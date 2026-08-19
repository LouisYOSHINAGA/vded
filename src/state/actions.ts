/** Every mutation the UI performs, plus the MIDI side effect that goes with it. */
import {
  buildFullDump,
  buildPartDump,
  globalMessage,
  layerMessage,
  layerParamValue,
  partMessage,
  partParamValue,
  type LayerTarget,
  type MidiConfig,
} from '../midi/ccmap'
import { midiEngine } from '../midi/engine'
import type {
  EgTypeIndex,
  GlobalParamKey,
  Layer,
  LayerParamKey,
  ModTypeIndex,
  Part,
  PartParamKey,
  Patch,
  Pattern,
  Preset,
  WaveIndex,
} from './types'
import { MAX_STEPS, PART_COUNT } from './types'
import { makeEmptyPattern, makeInitPatch, makeLayer, makePart } from './defaults'
import type { AppState } from './store'
import { store, toast } from './store'

export function midiConfig(state: AppState = store.get()): MidiConfig {
  return {
    mode: state.settings.mode,
    baseChannel: state.settings.baseChannel,
    ccTable: state.settings.ccTable,
    sendPitchModQuantize: state.settings.sendPitchModQuantize,
  }
}

/**
 * Which layer a write actually addresses. Single-channel mode has no per-layer
 * CCs at all, and LINK deliberately drives both from one message.
 */
export function resolveTarget(state: AppState, layer: 0 | 1): LayerTarget {
  if (state.settings.mode === 'single') return 'both'
  return state.ui.layerLink ? 'both' : layer
}

function updatePart(state: AppState, index: number, updater: (part: Part) => Part): AppState {
  const parts = state.patch.parts.map((part, i) => (i === index ? updater(part) : part))
  return { ...state, patch: { ...state.patch, parts } }
}

function updateLayers(
  part: Part,
  target: LayerTarget,
  updater: (layer: Layer) => Layer,
): Part {
  const layers = part.layers.map((layer, i) =>
    target === 'both' || target === i ? updater(layer) : layer,
  ) as [Layer, Layer]
  return { ...part, layers }
}

// ---------------------------------------------------------------------------
// Sound parameters
// ---------------------------------------------------------------------------

export function setLayerParam(
  partIndex: number,
  layer: 0 | 1,
  key: Exclude<LayerParamKey, 'select'>,
  value: number,
): void {
  const state = store.get()
  const target = resolveTarget(state, layer)
  store.set((s) => updatePart(s, partIndex, (part) => updateLayers(part, target, (l) => ({ ...l, [key]: value }))))
  emitLayer(partIndex, target, key, value)
}

export function setLayerSelect(
  partIndex: number,
  layer: 0 | 1,
  axis: 'wave' | 'modType' | 'egType',
  value: number,
): void {
  const state = store.get()
  const target = resolveTarget(state, layer)
  store.set((s) =>
    updatePart(s, partIndex, (part) =>
      updateLayers(part, target, (l) => ({
        ...l,
        [axis]: value as WaveIndex & ModTypeIndex & EgTypeIndex,
      })),
    ),
  )
  const updated = store.get().patch.parts[partIndex].layers[target === 'both' ? 0 : target]
  emitLayer(partIndex, target, 'select', layerParamValue(updated, 'select'))
}

function emitLayer(partIndex: number, target: LayerTarget, key: LayerParamKey, value: number): void {
  const state = store.get()
  if (!state.settings.liveSend) return
  const message = layerMessage(midiConfig(state), partIndex, target, key, value)
  if (message) midiEngine.sendCc(message)
}

export function setPartParam(partIndex: number, key: PartParamKey, value: number | boolean): void {
  store.set((s) => updatePart(s, partIndex, (part) => ({ ...part, [key]: value })))
  const state = store.get()
  if (!state.settings.liveSend) return
  const part = state.patch.parts[partIndex]
  const message = partMessage(midiConfig(state), partIndex, key, partParamValue(part, key))
  if (message) midiEngine.sendCc(message)
}

export function setPartName(partIndex: number, name: string): void {
  store.set((s) => updatePart(s, partIndex, (part) => ({ ...part, name })))
}

export function setWaveGuideParam(key: GlobalParamKey, value: number): void {
  const field = ({ wgModel: 'model', wgDecay: 'decay', wgBody: 'body', wgTune: 'tune' } as const)[key]
  store.set((s) => ({
    ...s,
    patch: { ...s.patch, waveGuide: { ...s.patch.waveGuide, [field]: value } },
  }))
  const state = store.get()
  if (!state.settings.liveSend) return
  const wire = key === 'wgModel' ? (value === 1 ? 64 : 0) : value
  midiEngine.sendCc(globalMessage(midiConfig(state), key, wire))
}

// ---------------------------------------------------------------------------
// Part utilities (mirrors of the machine's FUNC shortcuts)
// ---------------------------------------------------------------------------

export function initPart(partIndex: number): void {
  const name = store.get().patch.parts[partIndex].name
  store.set((s) => updatePart(s, partIndex, () => makePart(name)))
  sendPart(partIndex, { quiet: true })
  toast(`PART ${partIndex + 1} を初期化しました`)
}

export function copyPart(from: number, to: number): void {
  if (from === to) return
  store.set((s) => {
    const source = s.patch.parts[from]
    const parts = s.patch.parts.map((part, i) =>
      i === to ? { ...structuredClone(source), name: part.name } : part,
    )
    const steps = s.pattern.steps.map((row, i) =>
      i === to ? s.pattern.steps[from].map((step) => ({ ...step })) : row,
    )
    return { ...s, patch: { ...s.patch, parts }, pattern: { ...s.pattern, steps } }
  })
  sendPart(to, { quiet: true })
  toast(`PART ${from + 1} を PART ${to + 1} にコピーしました`)
}

function randomByte(max = 127): number {
  return Math.floor(Math.random() * (max + 1))
}

export function randomizeLayer(partIndex: number, layer: 0 | 1): void {
  const state = store.get()
  const target = resolveTarget(state, layer)
  store.set((s) =>
    updatePart(s, partIndex, (part) =>
      updateLayers(part, target, (existing) =>
        makeLayer({
          wave: randomByte(4) as WaveIndex,
          modType: randomByte(2) as ModTypeIndex,
          egType: randomByte(2) as EgTypeIndex,
          level: existing.level,
          pitch: randomByte(),
          egAttack: randomByte(48),
          egRelease: randomByte(),
          modAmount: randomByte(),
          modRate: randomByte(),
        }),
      ),
    ),
  )
  sendPart(partIndex, { quiet: true })
}

export function randomizePattern(partIndex: number): void {
  store.set((s) => {
    const steps = s.pattern.steps.map((row, i) =>
      i === partIndex
        ? row.map(() => {
            const on = Math.random() < 0.35
            return { on, velocity: on && Math.random() < 0.25 ? 127 : 96 }
          })
        : row,
    )
    return { ...s, pattern: { ...s.pattern, steps } }
  })
}

// ---------------------------------------------------------------------------
// Sequencer
// ---------------------------------------------------------------------------

export function toggleStep(partIndex: number, stepIndex: number): void {
  store.set((s) => {
    const steps = s.pattern.steps.map((row, i) =>
      i === partIndex
        ? row.map((step, j) => (j === stepIndex ? { ...step, on: !step.on } : step))
        : row,
    )
    return { ...s, pattern: { ...s.pattern, steps } }
  })
}

export function setStep(partIndex: number, stepIndex: number, on: boolean, velocity?: number): void {
  store.set((s) => {
    const steps = s.pattern.steps.map((row, i) =>
      i === partIndex
        ? row.map((step, j) =>
            j === stepIndex ? { ...step, on, velocity: velocity ?? step.velocity } : step,
          )
        : row,
    )
    return { ...s, pattern: { ...s.pattern, steps } }
  })
}

export function setStepVelocity(partIndex: number, stepIndex: number, velocity: number): void {
  const clamped = Math.max(1, Math.min(127, Math.round(velocity)))
  store.set((s) => {
    const steps = s.pattern.steps.map((row, i) =>
      i === partIndex
        ? row.map((step, j) => (j === stepIndex ? { ...step, velocity: clamped } : step))
        : row,
    )
    return { ...s, pattern: { ...s.pattern, steps } }
  })
}

export function clearPartSteps(partIndex: number): void {
  store.set((s) => {
    const steps = s.pattern.steps.map((row, i) =>
      i === partIndex ? row.map(() => ({ on: false, velocity: 100 })) : row,
    )
    return { ...s, pattern: { ...s.pattern, steps } }
  })
}

export function clearAllSteps(): void {
  store.set((s) => ({ ...s, pattern: makeEmptyPattern(s.pattern.name) }))
}

export function shiftPart(partIndex: number, delta: number): void {
  store.set((s) => {
    const length = s.pattern.length
    const steps = s.pattern.steps.map((row, i) => {
      if (i !== partIndex) return row
      const next = row.map((step) => ({ ...step }))
      const window = next.slice(0, length)
      const shifted = window.map((_, j) => window[(j - delta + length * 2) % length])
      shifted.forEach((step, j) => {
        next[j] = step
      })
      return next
    })
    return { ...s, pattern: { ...s.pattern, steps } }
  })
}

export function setPatternLength(length: number): void {
  const clamped = Math.max(1, Math.min(MAX_STEPS, Math.round(length)))
  store.set((s) => ({ ...s, pattern: { ...s.pattern, length: clamped } }))
}

export function toggleMute(partIndex: number): void {
  store.set((s) => ({
    ...s,
    mixer: { ...s.mixer, mutes: s.mixer.mutes.map((m, i) => (i === partIndex ? !m : m)) },
  }))
}

/**
 * Mutes everything, or unmutes everything if it is already all muted.
 * Solos are cleared on the way in, otherwise a soloed part would keep
 * sounding through an "all mute".
 */
export function toggleMuteAll(): void {
  const state = store.get()
  const allMuted = state.mixer.mutes.every(Boolean)
  store.set((s) => ({
    ...s,
    mixer: {
      ...s.mixer,
      mutes: s.mixer.mutes.map(() => !allMuted),
      solos: allMuted ? s.mixer.solos : s.mixer.solos.map(() => false),
    },
  }))
}

export function clearSolos(): void {
  store.set((s) => ({ ...s, mixer: { ...s.mixer, solos: s.mixer.solos.map(() => false) } }))
}

export function toggleSolo(partIndex: number): void {
  store.set((s) => ({
    ...s,
    mixer: { ...s.mixer, solos: s.mixer.solos.map((m, i) => (i === partIndex ? !m : m)) },
  }))
}

export function setPartNote(partIndex: number, note: number): void {
  const clamped = Math.max(0, Math.min(127, Math.round(note)))
  store.set((s) => ({
    ...s,
    mixer: { ...s.mixer, notes: s.mixer.notes.map((n, i) => (i === partIndex ? clamped : n)) },
  }))
}

export function isAudible(state: AppState, partIndex: number): boolean {
  const anySolo = state.mixer.solos.some(Boolean)
  if (anySolo) return state.mixer.solos[partIndex]
  return !state.mixer.mutes[partIndex]
}

// ---------------------------------------------------------------------------
// Triggering
// ---------------------------------------------------------------------------

export function triggerPart(partIndex: number, velocity = 110): void {
  const state = store.get()
  const config = midiConfig(state)
  const channel =
    config.mode === 'single' ? config.baseChannel : ((config.baseChannel - 1 + partIndex) % 16) + 1
  const note = state.mixer.notes[partIndex]
  midiEngine.noteOn(channel, note, velocity)
  window.setTimeout(() => midiEngine.noteOff(channel, note), state.transport.gateMs)
}

// ---------------------------------------------------------------------------
// Bulk send
// ---------------------------------------------------------------------------

export function sendAll(): void {
  const state = store.get()
  if (!midiEngine.isConnected) {
    toast('MIDI 出力が選択されていません', 'error')
    return
  }
  const messages = buildFullDump(state.patch, midiConfig(state))
  midiEngine.sendCcBurst(messages)
  trackProgress(messages.length)
  toast(`SEND ALL: ${messages.length} 件の CC を送信中…`)
}

export function sendPart(partIndex: number, options: { quiet?: boolean } = {}): void {
  const state = store.get()
  if (!midiEngine.isConnected) {
    if (!options.quiet) toast('MIDI 出力が選択されていません', 'error')
    return
  }
  const messages = buildPartDump(state.patch, midiConfig(state), partIndex)
  midiEngine.sendCcBurst(messages)
  trackProgress(messages.length)
  if (!options.quiet) toast(`PART ${partIndex + 1}: ${messages.length} 件の CC を送信中…`)
}

export function sendWaveGuide(): void {
  const state = store.get()
  const config = midiConfig(state)
  const wg = state.patch.waveGuide
  midiEngine.sendCcBurst([
    globalMessage(config, 'wgModel', wg.model === 1 ? 64 : 0),
    globalMessage(config, 'wgDecay', wg.decay),
    globalMessage(config, 'wgBody', wg.body),
    globalMessage(config, 'wgTune', wg.tune),
  ])
}

function trackProgress(total: number): void {
  if (total === 0) return
  store.patchSlice('ui', { sendAllProgress: 0 })
  const tick = () => {
    const queued = midiEngine.getSnapshot().queued
    const done = Math.max(0, total - queued)
    if (queued === 0) {
      store.patchSlice('ui', { sendAllProgress: 1 })
      window.setTimeout(() => store.patchSlice('ui', { sendAllProgress: null }), 700)
      return
    }
    store.patchSlice('ui', { sendAllProgress: done / total })
    window.setTimeout(tick, 60)
  }
  window.setTimeout(tick, 60)
}

/**
 * Stops the sequencer first — that is what actually silences a runaway
 * pattern — then sends note-offs for every note/channel pair VDED uses.
 */
export function panic(): void {
  const state = store.get()
  const config = midiConfig(state)
  const channels =
    config.mode === 'single'
      ? [config.baseChannel]
      : Array.from({ length: PART_COUNT }, (_, i) => ((config.baseChannel - 1 + i) % 16) + 1)
  const wasPlaying = state.transport.playing
  onPanic?.()
  if (!midiEngine.isConnected) {
    toast('MIDI 出力が選択されていないため、シーケンサの停止のみ行いました', 'warn')
    return
  }
  const notes = Array.from(new Set(state.mixer.notes))
  midiEngine.panic(channels, notes)
  toast(
    `PANIC: ${channels.length * notes.length} 件のノートオフを送信${wasPlaying ? '／シーケンサ停止' : ''}`,
  )
}

/**
 * Set by the sequencer module. Actions cannot import the sequencer directly —
 * the sequencer already imports actions — so it registers itself here.
 */
let onPanic: (() => void) | null = null

export function registerPanicHandler(handler: () => void): void {
  onPanic = handler
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export function setSettings(patch: Partial<AppState['settings']>): void {
  store.patchSlice('settings', patch)
  const settings = store.get().settings
  midiEngine.setOptions({
    ccIntervalMs: settings.ccIntervalMs,
    dumpIntervalMs: settings.dumpIntervalMs,
  })
}

export function setUi(patch: Partial<AppState['ui']>): void {
  store.patchSlice('ui', patch)
}

export function setTransport(patch: Partial<AppState['transport']>): void {
  store.patchSlice('transport', patch)
}

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

function newId(): string {
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function savePreset(name: string, includePattern: boolean, note = ''): void {
  const state = store.get()
  const preset: Preset = {
    id: newId(),
    name: name.trim() || 'UNTITLED',
    note,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    patch: structuredClone(state.patch),
    pattern: includePattern ? structuredClone(state.pattern) : null,
  }
  store.set((s) => ({ ...s, presets: [preset, ...s.presets] }))
  toast(`プリセット「${preset.name}」を保存しました`)
}

export function overwritePreset(id: string, includePattern: boolean): void {
  const state = store.get()
  store.set((s) => ({
    ...s,
    presets: s.presets.map((preset) =>
      preset.id === id
        ? {
            ...preset,
            updatedAt: Date.now(),
            patch: structuredClone(state.patch),
            pattern: includePattern ? structuredClone(state.pattern) : preset.pattern,
          }
        : preset,
    ),
  }))
  toast('プリセットを上書きしました')
}

export function loadPreset(preset: Preset, options: { withPattern: boolean; send: boolean }): void {
  store.set((s) => ({
    ...s,
    patch: structuredClone(preset.patch),
    pattern:
      options.withPattern && preset.pattern ? structuredClone(preset.pattern) : s.pattern,
  }))
  if (options.send) sendAll()
  else toast(`「${preset.name}」を読み込みました（SEND ALL で実機に反映）`, 'warn')
}

export function renamePreset(id: string, name: string): void {
  store.set((s) => ({
    ...s,
    presets: s.presets.map((preset) => (preset.id === id ? { ...preset, name } : preset)),
  }))
}

export function deletePreset(id: string): void {
  store.set((s) => ({ ...s, presets: s.presets.filter((preset) => preset.id !== id) }))
}

export function importPresets(presets: Preset[]): number {
  const cleaned = presets
    .filter((preset) => preset && preset.patch && Array.isArray(preset.patch.parts))
    .map((preset) => ({ ...preset, id: newId() }))
  if (cleaned.length === 0) return 0
  store.set((s) => ({ ...s, presets: [...cleaned, ...s.presets] }))
  return cleaned.length
}

export function resetPatch(): void {
  store.set((s) => ({ ...s, patch: makeInitPatch() }))
  toast('INIT KIT を読み込みました')
}

export interface PresetFile {
  format: 'vded-preset-bank'
  version: 1
  exportedAt: string
  presets: Preset[]
}

export function makePresetFile(presets: Preset[]): PresetFile {
  return {
    format: 'vded-preset-bank',
    version: 1,
    exportedAt: new Date().toISOString(),
    presets,
  }
}

export function parsePresetFile(text: string): Preset[] {
  const data = JSON.parse(text) as PresetFile | Preset | Preset[]
  if (Array.isArray(data)) return data
  if ('presets' in data && Array.isArray(data.presets)) return data.presets
  if ('patch' in data) return [data]
  return []
}

export type { Patch, Pattern }
