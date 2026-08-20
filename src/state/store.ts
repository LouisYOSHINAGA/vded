import { useSyncExternalStore } from 'react'
import type { Appearance } from '../data/appearance'
import { DEFAULT_APPEARANCE } from '../data/appearance'
import type { CcTable, ChannelMode } from '../midi/ccmap'
import { DEFAULT_CC_TABLE } from '../midi/ccmap'
import { makeEmptyPattern, makeInitPatch } from './defaults'
import type { Pattern, Patch, Preset } from './types'
import { PART_COUNT } from './types'

export type EditorTab = 'part' | 'matrix' | 'dials' | 'presets' | 'func' | 'map'

export interface TransportState {
  playing: boolean
  bpm: number
  /** Percentage the even-numbered steps are pushed back, 0..75. */
  swing: number
  /** Note length in milliseconds. */
  gateMs: number
  /** Emit 24 ppqn clock plus start/stop so the machine follows the editor. */
  sendClock: boolean
  /** -1 when stopped. */
  currentStep: number
}

export interface MixerState {
  mutes: boolean[]
  solos: boolean[]
  /** Note number used to trigger each part. Any note works on the volca drum. */
  notes: number[]
}

export interface SettingsState {
  mode: ChannelMode
  /** Split: channel of part 1. Single: the shared channel. */
  baseChannel: number
  ccTable: CcTable
  sendPitchModQuantize: boolean
  /** Push every knob move to the machine as it happens. */
  liveSend: boolean
  ccIntervalMs: number
  dumpIntervalMs: number
  /** Theme, font and UI scale. Persisted with the rest of the settings. */
  appearance: Appearance
}

export interface UiState {
  selectedPart: number
  selectedLayer: 0 | 1
  /** Edit both layers at once and use the combined "1-2" CC. */
  layerLink: boolean
  editorTab: EditorTab
  showMonitor: boolean
  /** Width of the sequencer's part rail, in pixels. */
  seqRailWidth: number
  /** Progress of a running SEND ALL, 0..1, or null when idle. */
  sendAllProgress: number | null
}

export interface AppState {
  patch: Patch
  pattern: Pattern
  transport: TransportState
  mixer: MixerState
  settings: SettingsState
  ui: UiState
  presets: Preset[]
  /** Transient banner text, cleared by the UI. */
  toast: { id: number; text: string; tone: 'info' | 'warn' | 'error' } | null
}

export function makeInitialState(): AppState {
  return {
    patch: makeInitPatch(),
    pattern: makeEmptyPattern(),
    transport: {
      playing: false,
      bpm: 120,
      swing: 0,
      gateMs: 20,
      sendClock: false,
      currentStep: -1,
    },
    mixer: {
      mutes: Array.from({ length: PART_COUNT }, () => false),
      solos: Array.from({ length: PART_COUNT }, () => false),
      notes: Array.from({ length: PART_COUNT }, () => 60),
    },
    settings: {
      mode: 'split',
      baseChannel: 1,
      ccTable: DEFAULT_CC_TABLE,
      sendPitchModQuantize: false,
      liveSend: true,
      ccIntervalMs: 1.6,
      dumpIntervalMs: 4,
      appearance: DEFAULT_APPEARANCE,
    },
    ui: {
      selectedPart: 0,
      selectedLayer: 0,
      layerLink: false,
      editorTab: 'part',
      showMonitor: false,
      seqRailWidth: 216,
      sendAllProgress: null,
    },
    presets: [],
    toast: null,
  }
}

type Listener = () => void

class Store {
  private state: AppState = makeInitialState()
  private listeners = new Set<Listener>()

  get = (): AppState => this.state

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  set(updater: (state: AppState) => AppState): void {
    const next = updater(this.state)
    if (next === this.state) return
    this.state = next
    this.listeners.forEach((listener) => listener())
  }

  /** Replace one top-level slice, leaving the other slices referentially equal. */
  patchSlice<K extends keyof AppState>(key: K, value: Partial<AppState[K]>): void {
    this.set((state) => ({ ...state, [key]: { ...(state[key] as object), ...value } }))
  }
}

export const store = new Store()

/**
 * Selectors must return a stable reference for unchanged data — every update
 * here is immutable, so `state.patch.parts[n]` stays identical unless touched.
 */
export function useAppState<S>(selector: (state: AppState) => S): S {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.get()),
    () => selector(store.get()),
  )
}

let toastId = 0
export function toast(text: string, tone: 'info' | 'warn' | 'error' = 'info'): void {
  store.set((state) => ({ ...state, toast: { id: ++toastId, text, tone } }))
}

export function clearToast(): void {
  store.set((state) => (state.toast ? { ...state, toast: null } : state))
}
