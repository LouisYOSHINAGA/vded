/**
 * Web MIDI transport.
 *
 * The volca drum has a small MIDI input buffer, so nothing is written to the
 * port directly: control changes go through a queue that coalesces repeated
 * edits of the same CC and paces the wire. Notes and realtime bytes bypass the
 * queue because their timing is the point.
 */
import type { CcMessage } from './ccmap'

export interface PortInfo {
  id: string
  name: string
  manufacturer: string
  /** True when the port name looks like a volca drum. */
  isVolcaDrum: boolean
  /** True when it looks like some other volca / KORG device. */
  isKorg: boolean
  state: string
  connection: string
}

export type MidiStatus = 'unsupported' | 'idle' | 'requesting' | 'ready' | 'denied' | 'error'

/**
 * One monitor row. The fields are kept apart rather than pre-formatted so the
 * monitor can lay them out in columns: scanning a stream of CCs is much easier
 * when the numbers line up.
 */
export interface LogEntry {
  id: number
  time: number
  channel: number | null
  /** CC number. Null for anything that is not a control change. */
  cc: number | null
  value: number | null
  /** What the message controls: a parameter name, or free text. */
  target: string
}

export interface EngineSnapshot {
  status: MidiStatus
  error: string | null
  outputs: PortInfo[]
  outputId: string | null
  log: LogEntry[]
  /** Number of CC messages waiting in the queue. */
  queued: number
}

const LOG_LIMIT = 250

const KORG_RE = /korg|volca|nts-?[12]|minilogue|monologue/i

function describePort(port: MIDIPort): PortInfo {
  const name = port.name ?? 'unknown'
  const manufacturer = port.manufacturer ?? ''
  const haystack = `${manufacturer} ${name}`
  return {
    id: port.id,
    name,
    manufacturer,
    isVolcaDrum: /volca/i.test(haystack) && /drum/i.test(haystack),
    isKorg: KORG_RE.test(haystack),
    state: port.state,
    connection: port.connection,
  }
}

export interface EngineOptions {
  /** Minimum gap between queued CC messages, in milliseconds. */
  ccIntervalMs: number
  /** Gap used while a bulk dump is draining. */
  dumpIntervalMs: number
}

export class MidiEngine {
  private access: MIDIAccess | null = null
  private listeners = new Set<() => void>()
  private queue: CcMessage[] = []
  private queueIndex = new Map<string, CcMessage>()
  private draining = false
  private logId = 0
  private dumpRemaining = 0
  private options: EngineOptions = { ccIntervalMs: 1.6, dumpIntervalMs: 4 }

  private snapshot: EngineSnapshot = {
    status: typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator
      ? 'idle'
      : 'unsupported',
    error: null,
    outputs: [],
    outputId: null,
    log: [],
    queued: 0,
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = (): EngineSnapshot => this.snapshot

  setOptions(options: Partial<EngineOptions>): void {
    this.options = { ...this.options, ...options }
  }

  private emit(patch: Partial<EngineSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...patch }
    this.listeners.forEach((l) => l())
  }

  private log(fields: Omit<LogEntry, 'id' | 'time'>): void {
    const entry: LogEntry = { id: ++this.logId, time: performance.now(), ...fields }
    const log = [entry, ...this.snapshot.log].slice(0, LOG_LIMIT)
    this.emit({ log })
  }

  clearLog(): void {
    this.emit({ log: [] })
  }

  async connect(): Promise<void> {
    if (this.snapshot.status === 'unsupported') return
    if (this.snapshot.status === 'requesting') return
    this.emit({ status: 'requesting', error: null })
    try {
      const access = await navigator.requestMIDIAccess({ sysex: false })
      this.access = access
      access.onstatechange = () => this.refreshPorts()
      this.emit({ status: 'ready' })
      this.refreshPorts(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const denied = /denied|NotAllowed|SecurityError/i.test(message)
      this.emit({ status: denied ? 'denied' : 'error', error: message })
    }
  }

  refreshPorts(autoSelect = false): void {
    if (!this.access) return
    const outputs: PortInfo[] = []
    this.access.outputs.forEach((port) => outputs.push(describePort(port)))

    let outputId = this.snapshot.outputId
    if (outputId && !outputs.some((p) => p.id === outputId)) outputId = null

    if (!outputId && (autoSelect || outputs.length === 1)) {
      const preferred = outputs.find((p) => p.isVolcaDrum) ?? outputs.find((p) => p.isKorg) ?? outputs[0]
      outputId = preferred ? preferred.id : null
    }
    this.emit({ outputs, outputId })
  }

  selectOutput(id: string | null): void {
    this.emit({ outputId: id })
  }

  private get output(): MIDIOutput | null {
    if (!this.access || !this.snapshot.outputId) return null
    return this.access.outputs.get(this.snapshot.outputId) ?? null
  }

  get isConnected(): boolean {
    return this.output != null
  }

  // -------------------------------------------------------------------------
  // Immediate sends
  // -------------------------------------------------------------------------

  /** Write bytes straight to the port. `timestamp` enables sample-accurate scheduling. */
  sendRaw(bytes: number[], timestamp?: number): boolean {
    const output = this.output
    if (!output) return false
    try {
      output.send(bytes, timestamp)
      return true
    } catch (err) {
      this.emit({ error: err instanceof Error ? err.message : String(err) })
      return false
    }
  }

  noteOn(channel: number, note: number, velocity: number, timestamp?: number): void {
    this.sendRaw([0x90 | ((channel - 1) & 0x0f), note & 0x7f, Math.max(1, velocity) & 0x7f], timestamp)
  }

  noteOff(channel: number, note: number, timestamp?: number): void {
    this.sendRaw([0x80 | ((channel - 1) & 0x0f), note & 0x7f, 0], timestamp)
  }

  /** 0xFA start / 0xFB continue / 0xFC stop / 0xF8 clock. */
  realtime(byte: number, timestamp?: number): void {
    this.sendRaw([byte], timestamp)
  }

  /**
   * Note-offs for the notes we actually send, on every channel we address.
   * The volca drum ignores CC123 (All Notes Off) and flooding it with 128
   * note-offs per channel would just overrun its input buffer.
   */
  panic(channels: number[], notes: number[]): void {
    const unique = Array.from(new Set(notes))
    for (const channel of channels) {
      for (const note of unique) {
        this.sendRaw([0x80 | ((channel - 1) & 0x0f), note & 0x7f, 0])
      }
    }
    this.log({
      channel: null,
      cc: null,
      value: null,
      target: `PANIC — note off · ch ${channels.join(',')} · note ${unique.join(',')}`,
    })
  }

  // -------------------------------------------------------------------------
  // Queued control changes
  // -------------------------------------------------------------------------

  /** Queue a CC, replacing any pending message for the same channel+CC. */
  sendCc(message: CcMessage): void {
    const existing = this.queueIndex.get(message.key)
    if (existing) {
      existing.value = message.value
      existing.label = message.label
    } else {
      this.queue.push(message)
      this.queueIndex.set(message.key, message)
    }
    this.emit({ queued: this.queue.length })
    void this.drain()
  }

  /** Queue an ordered burst (SEND ALL). Paced more gently than live edits. */
  sendCcBurst(messages: CcMessage[]): void {
    this.dumpRemaining += messages.length
    for (const message of messages) {
      // Bursts must preserve order and reach the device in full, so they are
      // appended without coalescing against live edits.
      this.queue.push({ ...message, key: `burst:${this.logId}:${this.queue.length}` })
    }
    this.emit({ queued: this.queue.length })
    void this.drain()
  }

  private async drain(): Promise<void> {
    if (this.draining) return
    this.draining = true
    try {
      while (this.queue.length > 0) {
        const message = this.queue.shift()!
        this.queueIndex.delete(message.key)
        const isDump = this.dumpRemaining > 0
        if (isDump) this.dumpRemaining--
        const ok = this.sendRaw([
          0xb0 | ((message.channel - 1) & 0x0f),
          message.cc & 0x7f,
          message.value & 0x7f,
        ])
        if (!ok) {
          this.queue.length = 0
          this.queueIndex.clear()
          this.dumpRemaining = 0
          break
        }
        this.log({
          channel: message.channel,
          cc: message.cc,
          value: message.value,
          target: message.label,
        })
        this.emit({ queued: this.queue.length })
        const gap = isDump ? this.options.dumpIntervalMs : this.options.ccIntervalMs
        if (this.queue.length > 0) await sleep(gap)
      }
    } finally {
      this.draining = false
      this.emit({ queued: this.queue.length })
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const midiEngine = new MidiEngine()
