/** localStorage persistence. Nothing here is required for the app to run. */
import type { Appearance } from '../data/appearance'
import { CUSTOM_SLOTS, THEME_SEEDS, makeCustomSlots } from '../data/appearance'
import { DEFAULT_CC_TABLE } from '../midi/ccmap'
import { makeEmptyPattern, makeInitPatch } from './defaults'
import type { AppState } from './store'
import type { EditorTab } from './store'
import { DEFAULT_TAB_ORDER, makeInitialState, store } from './store'
import type { ThemeSeed } from '../theme/palette'
import type { Preset } from './types'
import { PART_COUNT } from './types'

const KEY = 'vded.workspace.v1'
const SCHEMA = 1

interface Persisted {
  schema: number
  patch: AppState['patch']
  pattern: AppState['pattern']
  memo: string
  presets: Preset[]
  settings: AppState['settings']
  mixer: AppState['mixer']
  ui: Pick<
    AppState['ui'],
    | 'selectedPart'
    | 'selectedLayer'
    | 'layerLink'
    | 'editorTab'
    | 'seqRailWidth'
    | 'dialOrder'
    | 'tabOrder'
  >
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
      memo: typeof data.memo === 'string' ? data.memo : '',
      presets: Array.isArray(data.presets) ? data.presets : [],
      settings: {
        ...base.settings,
        ...data.settings,
        // A stale table from an older build must not shadow new defaults.
        ccTable: data.settings?.ccTable ?? DEFAULT_CC_TABLE,
        appearance: migrateAppearance(base.settings.appearance, data.settings?.appearance),
      },
      mixer: { ...base.mixer, ...data.mixer },
      ui: {
        ...base.ui,
        ...data.ui,
        dialOrder: validOrder(data.ui?.dialOrder) ?? base.ui.dialOrder,
        tabOrder: validTabOrder(data.ui?.tabOrder) ?? base.ui.tabOrder,
        layerLink: migrateLayerLink(data.ui?.layerLink),
        sendAllProgress: null,
      },
      transport: { ...base.transport, ...data.transport, playing: false, currentStep: -1 },
    }
  } catch {
    return null
  }
}

/**
 * Older saves held a single `custom` palette; it becomes the first of the eight
 * slots so nobody loses the skin they built.
 */
function migrateAppearance(base: Appearance, saved: Partial<Appearance> | undefined): Appearance {
  const merged = { ...base, ...saved } as Appearance & { custom?: ThemeSeed }
  const customs =
    Array.isArray(merged.customs) && merged.customs.length === CUSTOM_SLOTS
      ? merged.customs
      : makeCustomSlots().map((seed, i) => (i === 0 && merged.custom ? merged.custom : seed))
  delete merged.custom
  return {
    ...merged,
    customs,
    customIndex: Math.min(Math.max(0, merged.customIndex ?? 0), CUSTOM_SLOTS - 1),
    fontScale: merged.fontScale ?? 1,
    theme: merged.theme in THEME_SEEDS || merged.theme === 'custom' ? merged.theme : base.theme,
  }
}

/**
 * LINK used to be one flag for the whole kit. A saved boolean would now link
 * every part at once, which is the opposite of what it meant, so it is dropped.
 */
function migrateLayerLink(saved: boolean[] | boolean | undefined): boolean[] {
  const off = Array.from({ length: PART_COUNT }, () => false)
  if (!Array.isArray(saved) || saved.length !== PART_COUNT) return off
  return saved.map(Boolean)
}

/**
 * A saved tab order must still name every tab exactly once — otherwise a build
 * that adds or removes a tab would leave one unreachable.
 */
function validTabOrder(order: EditorTab[] | undefined): EditorTab[] | null {
  if (!Array.isArray(order) || order.length !== DEFAULT_TAB_ORDER.length) return null
  const seen = new Set(order)
  if (seen.size !== order.length) return null
  return DEFAULT_TAB_ORDER.every((tab) => seen.has(tab)) ? order : null
}

/** A saved order is only usable if it is still a permutation of every part. */
function validOrder(order: number[] | undefined): number[] | null {
  if (!Array.isArray(order) || order.length !== PART_COUNT) return null
  const seen = new Set(order)
  if (seen.size !== PART_COUNT) return null
  return order.every((n) => Number.isInteger(n) && n >= 0 && n < PART_COUNT) ? order : null
}

function serialize(state: AppState): string {
  const payload: Persisted = {
    schema: SCHEMA,
    patch: state.patch,
    pattern: state.pattern,
    memo: state.memo,
    presets: state.presets,
    settings: state.settings,
    mixer: state.mixer,
    ui: {
      selectedPart: state.ui.selectedPart,
      selectedLayer: state.ui.selectedLayer,
      layerLink: state.ui.layerLink,
      editorTab: state.ui.editorTab,
      seqRailWidth: state.ui.seqRailWidth,
      dialOrder: state.ui.dialOrder,
      tabOrder: state.ui.tabOrder,
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
    state.ui.seqRailWidth,
    state.ui.dialOrder,
    state.ui.tabOrder,
    state.memo,
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
