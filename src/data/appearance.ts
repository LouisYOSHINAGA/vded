import type { Lang } from '../i18n'
import { detectLang } from '../i18n'
import type { ThemeSeed } from '../theme/palette'

export type ThemeId =
  | 'paper'
  | 'studio'
  | 'daylight'
  | 'vermilion'
  | 'carbon'
  | 'blueprint'
  | 'custom'

export type FontId = 'default' | 'mono' | 'system' | 'condensed' | 'serif'

export interface Appearance {
  theme: ThemeId
  font: FontId
  lang: Lang
  /** UI scale multiplier, 1 = 100%. */
  zoom: number
  /** Edited by the skin editor; used when `theme` is 'custom'. */
  custom: ThemeSeed
}

const LIGHT_SEMANTICS = { danger: '#c23a3e', warn: '#a97514', ok: '#3f8a4d', info: '#3d7590' }
const DARK_SEMANTICS = { danger: '#e0464a', warn: '#e0a13a', ok: '#6fbf73', info: '#6fa8bd' }

/**
 * Part colours walk the same distance around the wheel in every skin, at a
 * lightness that suits the mode, so the six rows stay tellable apart without
 * any one skin turning into a rainbow.
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
  vermilion: {
    mode: 'dark',
    bg: '#0a0b0c',
    panel: '#191b1e',
    ink: '#e7e3dc',
    accent: '#e8552f',
    parts: ['#ef6038', '#eda23c', '#c3cc57', '#57c9a2', '#59a6e0', '#ab8ae0'],
    ...DARK_SEMANTICS,
  },
  carbon: {
    mode: 'dark',
    bg: '#08090a',
    panel: '#16181a',
    ink: '#e6e6e4',
    accent: '#eda12a',
    parts: ['#eda12a', '#d9c04a', '#9ac36a', '#5cbfa8', '#6ca8cf', '#b394d4'],
    ...DARK_SEMANTICS,
  },
  blueprint: {
    mode: 'dark',
    bg: '#070a10',
    panel: '#121924',
    ink: '#dfe9f4',
    accent: '#3fb6e6',
    parts: ['#45b8e8', '#5ad0c0', '#7fd47a', '#e0c257', '#e88f5a', '#a48ae8'],
    ...DARK_SEMANTICS,
  },
}

export const DEFAULT_APPEARANCE: Appearance = {
  theme: 'paper',
  font: 'default',
  lang: detectLang(),
  zoom: 1,
  custom: { ...THEME_SEEDS.paper, parts: [...THEME_SEEDS.paper.parts] },
}

export interface ThemeInfo {
  id: ThemeId
  name: string
  note: string
  mode: 'light' | 'dark'
}

export const THEMES: ThemeInfo[] = [
  { id: 'paper', name: 'Paper', note: '温かみのある紙色＋バーミリオン', mode: 'light' },
  { id: 'studio', name: 'Studio', note: 'ニュートラルグレー＋インディゴ', mode: 'light' },
  { id: 'daylight', name: 'Daylight', note: '純白＋ティール。最も明るい構成', mode: 'light' },
  { id: 'vermilion', name: 'Vermilion', note: '実機のパネルに合わせたチャコール', mode: 'dark' },
  { id: 'carbon', name: 'Carbon', note: 'グラファイト＋アンバー', mode: 'dark' },
  { id: 'blueprint', name: 'Blueprint', note: '濃紺＋アイスブルー', mode: 'dark' },
]

export function seedFor(appearance: Appearance): ThemeSeed {
  if (appearance.theme === 'custom') return appearance.custom
  return THEME_SEEDS[appearance.theme]
}

export interface FontInfo {
  id: FontId
  name: string
  note: string
}

export const FONTS: FontInfo[] = [
  { id: 'default', name: 'Meiryo / Consolas', note: '和文はメイリオ系、数値は Consolas' },
  { id: 'mono', name: 'Consolas 全面', note: 'すべて等幅。コンソール寄りの見え方' },
  { id: 'system', name: 'System UI', note: 'OS 標準の UI フォント' },
  { id: 'condensed', name: 'Condensed', note: '機材のシルクスクリーン風・幅が狭い' },
  { id: 'serif', name: 'Serif', note: '明朝／セリフ' },
]

export const ZOOM_STEPS = [0.7, 0.8, 0.9, 1, 1.1, 1.25] as const

/** Editable seed fields, in the order the editor shows them. */
export const SEED_FIELDS: { key: keyof ThemeSeed; label: string }[] = [
  { key: 'bg', label: 'Background' },
  { key: 'panel', label: 'Panel' },
  { key: 'ink', label: 'Text' },
  { key: 'accent', label: 'Accent' },
]
