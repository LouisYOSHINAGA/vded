export type ThemeId = 'vermilion' | 'carbon' | 'blueprint' | 'paper'
export type FontId = 'default' | 'mono' | 'system' | 'condensed' | 'serif'

export interface Appearance {
  theme: ThemeId
  font: FontId
  /** UI scale multiplier, 1 = 100%. */
  zoom: number
}

export const DEFAULT_APPEARANCE: Appearance = { theme: 'vermilion', font: 'default', zoom: 1 }

export interface ThemeInfo {
  id: ThemeId
  name: string
  note: string
  /** Swatch: [panel, accent, layer 2]. */
  swatch: [string, string, string]
}

export const THEMES: ThemeInfo[] = [
  {
    id: 'vermilion',
    name: 'Vermilion',
    note: '実機のパネルに合わせた既定のスキン',
    swatch: ['#191b1e', '#e8552f', '#d8952f'],
  },
  {
    id: 'carbon',
    name: 'Carbon',
    note: 'グラファイト＋アンバー。彩度をさらに落とした構成',
    swatch: ['#16181a', '#eda12a', '#9aa6ad'],
  },
  {
    id: 'blueprint',
    name: 'Blueprint',
    note: '濃紺＋アイスブルー。暗い部屋向け',
    swatch: ['#121924', '#3fb6e6', '#7d92e0'],
  },
  {
    id: 'paper',
    name: 'Paper',
    note: '明るい部屋・スクリーン共有向けのライトスキン',
    swatch: ['#f6f4ef', '#cf421c', '#a9761a'],
  },
]

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

export const ZOOM_STEPS = [0.9, 1, 1.1, 1.25] as const
