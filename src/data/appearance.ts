import type { Lang } from '../i18n'
import { detectLang } from '../i18n'
import type { ThemeSeed } from '../theme/palette'

export type ThemeId =
  | 'paper'
  | 'studio'
  | 'daylight'
  | 'linen'
  | 'clay'
  | 'sage'
  | 'porcelain'
  | 'graph'
  | 'vermilion'
  | 'carbon'
  | 'blueprint'
  | 'slate'
  | 'moss'
  | 'plum'
  | 'basalt'
  | 'ember'
  | 'custom'

export type FontId = 'default' | 'mono' | 'system' | 'condensed' | 'serif'

/** How many user-defined palettes the skin editor keeps. */
export const CUSTOM_SLOTS = 8

export interface Appearance {
  theme: ThemeId
  font: FontId
  lang: Lang
  /** UI scale multiplier, 1 = 100%. Scales everything, dials included. */
  zoom: number
  /** Text-only multiplier, 1 = 100%. Layout metrics stay put. */
  fontScale: number
  /** The eight user slots; `customIndex` picks which one `theme: 'custom'` uses. */
  customs: ThemeSeed[]
  customIndex: number
}

const LIGHT_SEMANTICS = { danger: '#c23a3e', warn: '#a97514', ok: '#3f8a4d', info: '#3d7590' }
const DARK_SEMANTICS = { danger: '#e0464a', warn: '#e0a13a', ok: '#6fbf73', info: '#6fa8bd' }

/**
 * Part colours walk the same distance around the wheel in every skin, at a
 * lightness that suits the mode, so the six rows stay tellable apart without
 * any one skin turning into a rainbow.
 *
 * Dark chassis colours are deliberately grey rather than black: a true black
 * behind a mid-grey panel reads as a hole in the screen, and the panel edges
 * stop being visible at all.
 */
export const THEME_SEEDS: Record<Exclude<ThemeId, 'custom'>, ThemeSeed> = {
  paper: {
    mode: 'light',
    bg: '#eceae4',
    panel: '#f6f4ef',
    ink: '#23211d',
    accent: '#cf421c',
    parts: ['#cf421c', '#b8741a', '#6f8420', '#1f8272', '#2a6ba3', '#7a4fa3'],
    ...LIGHT_SEMANTICS,
  },
  studio: {
    mode: 'light',
    bg: '#e9ebee',
    panel: '#f5f7f9',
    ink: '#1c2126',
    accent: '#3f5ecd',
    parts: ['#3f5ecd', '#1f7fae', '#1c8a72', '#7f8a1e', '#c06a17', '#a03f8f'],
    ...LIGHT_SEMANTICS,
  },
  daylight: {
    mode: 'light',
    bg: '#f0efeb',
    panel: '#ffffff',
    ink: '#1a1c1b',
    accent: '#0f8a86',
    parts: ['#0f8a86', '#2f74bb', '#6a56c0', '#b0491f', '#a8781a', '#5e8f22'],
    ...LIGHT_SEMANTICS,
  },
  linen: {
    mode: 'light',
    bg: '#e8e2d6',
    panel: '#f7f3ea',
    ink: '#2b2519',
    accent: '#9a6b2f',
    parts: ['#9a6b2f', '#7d8330', '#3f7f63', '#2f6f95', '#71559b', '#a8483f'],
    ...LIGHT_SEMANTICS,
  },
  clay: {
    mode: 'light',
    bg: '#ece3df',
    panel: '#f9f3f1',
    ink: '#2a201d',
    accent: '#b4503f',
    parts: ['#b4503f', '#b2762c', '#7b8a35', '#2f8478', '#3c6fa6', '#8f549c'],
    ...LIGHT_SEMANTICS,
  },
  sage: {
    mode: 'light',
    bg: '#e4e9e3',
    panel: '#f3f7f2',
    ink: '#1d241d',
    accent: '#4a7c3f',
    parts: ['#4a7c3f', '#2b8271', '#2c6d9c', '#6b5aa8', '#a75f8c', '#a8722a'],
    ...LIGHT_SEMANTICS,
  },
  porcelain: {
    mode: 'light',
    bg: '#e7e9ec',
    panel: '#fbfcfd',
    ink: '#1b1f24',
    accent: '#4a4f57',
    parts: ['#4a4f57', '#3a6f8f', '#3f7a63', '#8a7a2c', '#a35c3c', '#7a5490'],
    ...LIGHT_SEMANTICS,
  },
  graph: {
    mode: 'light',
    bg: '#e6ecec',
    panel: '#f4f9f9',
    ink: '#14211f',
    accent: '#07726b',
    parts: ['#07726b', '#3a6ea8', '#7350a6', '#a8462f', '#9a7614', '#4b7d20'],
    ...LIGHT_SEMANTICS,
  },
  vermilion: {
    mode: 'dark',
    bg: '#1c1d1f',
    panel: '#2a2c2f',
    ink: '#e7e3dc',
    accent: '#e8552f',
    parts: ['#ef6038', '#eda23c', '#c3cc57', '#57c9a2', '#59a6e0', '#ab8ae0'],
    ...DARK_SEMANTICS,
  },
  carbon: {
    mode: 'dark',
    bg: '#1a1b1c',
    panel: '#272829',
    ink: '#e6e6e4',
    accent: '#eda12a',
    parts: ['#eda12a', '#d9c04a', '#9ac36a', '#5cbfa8', '#6ca8cf', '#b394d4'],
    ...DARK_SEMANTICS,
  },
  blueprint: {
    mode: 'dark',
    bg: '#161d28',
    panel: '#222c3b',
    ink: '#dfe9f4',
    accent: '#3fb6e6',
    parts: ['#45b8e8', '#5ad0c0', '#7fd47a', '#e0c257', '#e88f5a', '#a48ae8'],
    ...DARK_SEMANTICS,
  },
  slate: {
    mode: 'dark',
    bg: '#20242a',
    panel: '#2d323a',
    ink: '#e2e6ec',
    accent: '#7aa2f7',
    parts: ['#7aa2f7', '#7dcfff', '#9ece6a', '#e0af68', '#f7768e', '#bb9af7'],
    ...DARK_SEMANTICS,
  },
  moss: {
    mode: 'dark',
    bg: '#1c211d',
    panel: '#2a302b',
    ink: '#e2e8e0',
    accent: '#8fc46a',
    parts: ['#8fc46a', '#5ec5a4', '#63b0d8', '#b79ae0', '#e59a6a', '#dcc45c'],
    ...DARK_SEMANTICS,
  },
  plum: {
    mode: 'dark',
    bg: '#24202a',
    panel: '#322c3a',
    ink: '#eae3f0',
    accent: '#c58af0',
    parts: ['#c58af0', '#f08ab4', '#f0a86a', '#d8d06a', '#6ecfae', '#7fb2f0'],
    ...DARK_SEMANTICS,
  },
  basalt: {
    mode: 'dark',
    bg: '#1e2022',
    panel: '#2b2e31',
    ink: '#dfe3e6',
    accent: '#5fc2c2',
    parts: ['#5fc2c2', '#79b4e8', '#a99ae8', '#e89aa8', '#e0b06a', '#a8cc70'],
    ...DARK_SEMANTICS,
  },
  ember: {
    mode: 'dark',
    bg: '#231e1c',
    panel: '#312b28',
    ink: '#efe4de',
    accent: '#f0805a',
    parts: ['#f0805a', '#e8b45c', '#c8cc66', '#6ec8a8', '#79aee0', '#b795e0'],
    ...DARK_SEMANTICS,
  },
}

/** The palettes the eight user slots start from, so none of them opens blank. */
const CUSTOM_STARTERS: Exclude<ThemeId, 'custom'>[] = [
  'paper',
  'linen',
  'sage',
  'studio',
  'vermilion',
  'carbon',
  'slate',
  'plum',
]

export function makeCustomSlots(): ThemeSeed[] {
  return CUSTOM_STARTERS.map((id) => cloneSeed(THEME_SEEDS[id]))
}

export function cloneSeed(seed: ThemeSeed): ThemeSeed {
  return { ...seed, parts: [...seed.parts] }
}

export const DEFAULT_APPEARANCE: Appearance = {
  theme: 'paper',
  font: 'default',
  lang: detectLang(),
  zoom: 1,
  fontScale: 1,
  customs: makeCustomSlots(),
  customIndex: 0,
}

export interface ThemeInfo {
  id: ThemeId
  name: string
  mode: 'light' | 'dark'
}

export const THEMES: ThemeInfo[] = [
  { id: 'paper', name: 'Paper', mode: 'light' },
  { id: 'linen', name: 'Linen', mode: 'light' },
  { id: 'clay', name: 'Clay', mode: 'light' },
  { id: 'sage', name: 'Sage', mode: 'light' },
  { id: 'studio', name: 'Studio', mode: 'light' },
  { id: 'graph', name: 'Graph', mode: 'light' },
  { id: 'porcelain', name: 'Porcelain', mode: 'light' },
  { id: 'daylight', name: 'Daylight', mode: 'light' },
  { id: 'vermilion', name: 'Vermilion', mode: 'dark' },
  { id: 'ember', name: 'Ember', mode: 'dark' },
  { id: 'carbon', name: 'Carbon', mode: 'dark' },
  { id: 'basalt', name: 'Basalt', mode: 'dark' },
  { id: 'slate', name: 'Slate', mode: 'dark' },
  { id: 'blueprint', name: 'Blueprint', mode: 'dark' },
  { id: 'moss', name: 'Moss', mode: 'dark' },
  { id: 'plum', name: 'Plum', mode: 'dark' },
]

export function seedFor(appearance: Appearance): ThemeSeed {
  if (appearance.theme !== 'custom') return THEME_SEEDS[appearance.theme]
  return appearance.customs[appearance.customIndex] ?? appearance.customs[0]
}

export interface FontInfo {
  id: FontId
  name: string
  note: Record<Lang, string>
}

export const FONTS: FontInfo[] = [
  { id: 'default', name: 'Meiryo / Consolas', note: { en: 'Humanist sans, Consolas numerals', ja: '和文はメイリオ系、数値は Consolas' } },
  { id: 'mono', name: 'Consolas', note: { en: 'Monospaced throughout', ja: 'すべて等幅' } },
  { id: 'system', name: 'System UI', note: { en: 'The OS interface font', ja: 'OS 標準の UI フォント' } },
  { id: 'condensed', name: 'Condensed', note: { en: 'Narrow, like panel silkscreen', ja: '機材のシルクスクリーン風' } },
  { id: 'serif', name: 'Serif', note: { en: 'Serif / Mincho', ja: '明朝／セリフ' } },
]

export const ZOOM_STEPS = [0.7, 0.8, 0.9, 1, 1.1, 1.25] as const

/** Text-only steps. Narrower than the UI scale: past these the layout breaks. */
export const FONT_SCALE_STEPS = [0.85, 0.925, 1, 1.075, 1.15] as const

/** Editable seed fields, in the order the editor shows them. */
export const SEED_FIELDS: { key: keyof ThemeSeed; label: string }[] = [
  { key: 'bg', label: 'Background' },
  { key: 'panel', label: 'Panel' },
  { key: 'ink', label: 'Text' },
  { key: 'accent', label: 'Accent' },
]
