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
  direction: 'out' | 'in'
  /** CC, NOTE, PANIC, CLOCK… shown as-is in the TYPE column. */
  kind: string
  channel: number | null
  /** CC number, or note number for note messages. */
  number: number | null
  value: number | null
  /** What the message controls: a parameter name, or free text. */
  target: string
}

export interface EngineSnapshot {
  status: MidiStatus
  error: string | null
  outputs: PortInfo[]
  inputs: PortInfo[]
  outputId: string | null
  inputId: string | null
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
    inputs: [],
    outputId: null,
    inputId: null,
    log: [],
    queued: 0,
  }

  /** Called with every incoming MIDI message from the selected input. */
  onIncoming: ((data: Uint8Array) => void) | null = null

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

  private log(direction: 'out' | 'in', fields: Omit<LogEntry, 'id' | 'time' | 'direction'>): void {
    const entry: LogEntry = { id: ++this.logId, time: performance.now(), direction, ...fields }
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
    const inputs: PortInfo[] = []
    this.access.inputs.forEach((port) => inputs.push(describePort(port)))

    let outputId = this.snapshot.outputId
    let inputId = this.snapshot.inputId
    if (outputId && !outputs.some((p) => p.id === outputId)) outputId = null
    if (inputId && !inputs.some((p) => p.id === inputId)) inputId = null

    if (!outputId && (autoSelect || outputs.length === 1)) {
      const preferred = outputs.find((p) => p.isVolcaDrum) ?? outputs.find((p) => p.isKorg) ?? outputs[0]
      outputId = preferred ? preferred.id : null
    }
    this.emit({ outputs, inputs, outputId, inputId })
    this.bindInput(inputId)
  }

  selectOutput(id: string | null): void {
    this.emit({ outputId: id })
  }

  selectInput(id: string | null): void {
    this.emit({ inputId: id })
    this.bindInput(id)
  }

  private bindInput(id: string | null): void {
    if (!this.access) return
    this.access.inputs.forEach((port) => {
      port.onmidimessage = null
    })
    if (!id) return
    const port = this.access.inputs.get(id)
    if (!port) return
    port.onmidimessage = (event: MIDIMessageEvent) => {
      const data = event.data
      if (!data) return
      // Clock spam would drown the monitor; count it silently.
      if (data[0] !== 0xf8) this.log('in', decodeIncoming(data))
      this.onIncoming?.(data)
    }
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
    this.log('out', {
      kind: 'PANIC',
      channel: null,
      number: null,
      value: null,
      target: `note off · ch ${channels.join(',')} · note ${unique.join(',')}`,
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
        this.log('out', {
          kind: 'CC',
          channel: message.channel,
          number: message.cc,
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

type IncomingFields = Omit<LogEntry, 'id' | 'time' | 'direction'>

function decodeIncoming(data: Uint8Array): IncomingFields {
  const status = data[0] & 0xf0
  const channel = (data[0] & 0x0f) + 1
  switch (status) {
    case 0x90:
      return data[2] === 0
        ? { kind: 'NOTE OFF', channel, number: data[1], value: 0, target: '' }
        : { kind: 'NOTE ON', channel, number: data[1], value: data[2], target: '' }
    case 0x80:
      return { kind: 'NOTE OFF', channel, number: data[1], value: 0, target: '' }
    case 0xb0:
      return { kind: 'CC', channel, number: data[1], value: data[2], target: '' }
    default:
      return {
        kind: 'RAW',
        channel: null,
        number: null,
        value: null,
        target: Array.from(data).map((b) => b.toString(16).padStart(2, '0')).join(' '),
      }
  }
}

export const midiEngine = new MidiEngine()
