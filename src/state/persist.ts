/** localStorage persistence. Nothing here is required for the app to run. */
import { DEFAULT_CC_TABLE } from '../midi/ccmap'
import { makeEmptyPattern, makeInitPatch } from './defaults'
import type { AppState } from './store'
import { makeInitialState, store } from './store'
import type { Preset } from './types'

const KEY = 'vded.workspace.v1'
const SCHEMA = 1

interface Persisted {
  schema: number
  patch: AppState['patch']
  pattern: AppState['pattern']
  presets: Preset[]
  settings: AppState['settings']
  mixer: AppState['mixer']
  ui: Pick<AppState['ui'], 'selectedPart' | 'selectedLayer' | 'layerLink' | 'editorTab' | 'showMonitor'>
  transport: Pick<AppState['transport'], 'bpm' | 'swing' | 'gateMs' | 'sendClock'>
}

export function loadWorkspace(): Partial<AppState> | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as Persisted
    if (data.schema !== SCHEMA) return null
    const base = makeInitialState()
    return {
      patch: data.patch ?? makeInitPatch(),
      pattern: data.pattern ?? makeEmptyPattern(),
      presets: Array.isArray(data.presets) ? data.presets : [],
      settings: {
        ...base.settings,
        ...data.settings,
        // A stale table from an older build must not shadow new defaults.
        ccTable: data.settings?.ccTable ?? DEFAULT_CC_TABLE,
      },
      mixer: { ...base.mixer, ...data.mixer },
      ui: { ...base.ui, ...data.ui, sendAllProgress: null },
      transport: { ...base.transport, ...data.transport, playing: false, currentStep: -1 },
    }
  } catch {
    return null
  }
}

function serialize(state: AppState): string {
  const payload: Persisted = {
    schema: SCHEMA,
    patch: state.patch,
    pattern: state.pattern,
    presets: state.presets,
    settings: state.settings,
    mixer: state.mixer,
    ui: {
      selectedPart: state.ui.selectedPart,
      selectedLayer: state.ui.selectedLayer,
      layerLink: state.ui.layerLink,
      editorTab: state.ui.editorTab,
      showMonitor: state.ui.showMonitor,
    },
    transport: {
      bpm: state.transport.bpm,
      swing: state.transport.swing,
      gateMs: state.transport.gateMs,
      sendClock: state.transport.sendClock,
    },
  }
  return JSON.stringify(payload)
}

/**
 * Anything the sequencer touches every step — the playhead, the playing flag —
 * is not persisted, so a running transport must not trigger a save. Compare the
 * slices that do get written before doing any work.
 */
function persistedSlices(state: AppState): unknown[] {
  return [
    state.patch,
    state.pattern,
    state.presets,
    state.settings,
    state.mixer,
    state.ui.selectedPart,
    state.ui.selectedLayer,
    state.ui.layerLink,
    state.ui.editorTab,
    state.ui.showMonitor,
    state.transport.bpm,
    state.transport.swing,
    state.transport.gateMs,
    state.transport.sendClock,
  ]
}

/** Debounced autosave; safe to call before the store has any data. */
export function startAutosave(): () => void {
  let timer: number | undefined
  let previous = persistedSlices(store.get())
  return store.subscribe(() => {
    const next = persistedSlices(store.get())
    if (next.every((value, i) => value === previous[i])) return
    previous = next
    if (timer !== undefined) window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      try {
        localStorage.setItem(KEY, serialize(store.get()))
      } catch {
        // Quota or private mode — autosave is best effort.
      }
    }, 400)
  })
}
