/** Domain model for a volca drum kit + editor-side sequence data. */

export const PART_COUNT = 6
export const LAYER_COUNT = 2
export const MAX_STEPS = 16

/** SELECT is one CC that packs wave x mod x eg. These are its three axes. */
export const WAVE_NAMES = ['SINE', 'SAW', 'NOISE HP', 'NOISE LP', 'NOISE BP'] as const
export const MOD_TYPE_NAMES = ['EXP', 'TRI', 'RANDOM'] as const
export const EG_TYPE_NAMES = ['AD', 'EXP', 'MULTI'] as const

export type WaveIndex = 0 | 1 | 2 | 3 | 4
export type ModTypeIndex = 0 | 1 | 2
export type EgTypeIndex = 0 | 1 | 2

/** Continuous parameters that exist once per layer. */
export type LayerParamKey =
  | 'select'
  | 'level'
  | 'egAttack'
  | 'egRelease'
  | 'pitch'
  | 'modAmount'
  | 'modRate'

/** Parameters that exist once per part (shared by both layers). */
export type PartParamKey =
  | 'bitReduction'
  | 'fold'
  | 'drive'
  | 'dryGain'
  | 'pan'
  | 'send'
  | 'pitchModQuantize'

/** Parameters of the shared waveguide resonator. */
export type GlobalParamKey = 'wgModel' | 'wgDecay' | 'wgBody' | 'wgTune'

export interface Layer {
  /** SELECT axis 1 — oscillator source. */
  wave: WaveIndex
  /** SELECT axis 2 — pitch modulator shape. */
  modType: ModTypeIndex
  /** SELECT axis 3 — amp envelope shape. */
  egType: EgTypeIndex
  level: number
  pitch: number
  egAttack: number
  egRelease: number
  modAmount: number
  modRate: number
}

export interface Part {
  /** User label, shown in the sequencer rail. Purely editor-side. */
  name: string
  layers: [Layer, Layer]
  bitReduction: number
  fold: number
  drive: number
  dryGain: number
  /** 0 = hard left, 64 = center, 127 = hard right. */
  pan: number
  send: number
  pitchModQuantize: boolean
}

export interface WaveGuide {
  /** 0 = TUBE, 1 = STRING. */
  model: 0 | 1
  decay: number
  body: number
  tune: number
}

/** Everything that gets sent to the machine. */
export interface Patch {
  name: string
  parts: Part[]
  waveGuide: WaveGuide
}

export interface Step {
  on: boolean
  /** 1..127, sent as note-on velocity. */
  velocity: number
}

export interface Pattern {
  name: string
  /** Steps actually played, 1..16. */
  length: number
  /** [part][step] */
  steps: Step[][]
}

/** A saved preset bundles the kit and (optionally) the pattern. */
export interface Preset {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  patch: Patch
  pattern: Pattern | null
  /** Free-form user note. */
  note?: string
}

export const LAYER_PARAM_LABELS: Record<LayerParamKey, string> = {
  select: 'SELECT',
  level: 'LEVEL',
  egAttack: 'EG ATTACK',
  egRelease: 'EG RELEASE',
  pitch: 'PITCH',
  modAmount: 'MOD AMOUNT',
  modRate: 'MOD RATE',
}

export const PART_PARAM_LABELS: Record<PartParamKey, string> = {
  bitReduction: 'BIT REDUCTION',
  fold: 'FOLD',
  drive: 'DRIVE',
  dryGain: 'DRY GAIN',
  pan: 'PAN',
  send: 'WG SEND',
  pitchModQuantize: 'PITCH MOD QUANT',
}

export const GLOBAL_PARAM_LABELS: Record<GlobalParamKey, string> = {
  wgModel: 'MODEL',
  wgDecay: 'DECAY',
  wgBody: 'BODY',
  wgTune: 'TUNE',
}
