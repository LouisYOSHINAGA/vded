/**
 * CC assignments for the volca drum.
 *
 * See docs/midi-implementation.md for the provenance of every number here.
 * The table is data, not code paths: the MIDI MAP panel edits this structure at
 * runtime so a firmware/chart discrepancy never requires a rebuild.
 */
import type {
  GlobalParamKey,
  LayerParamKey,
  Part,
  PartParamKey,
  Patch,
  Layer,
} from '../state/types'
import { PART_COUNT } from '../state/types'

export type ChannelMode = 'split' | 'single'

/** Which layer a message addresses. 'both' uses the combined "1-2" CC. */
export type LayerTarget = 0 | 1 | 'both'

export interface CcTable {
  /** Split channel mode: part n listens on channel base+n-1, CCs are shared. */
  split: {
    /** [layer 1, layer 2, layer 1+2] */
    layer: Record<LayerParamKey, [number, number, number]>
    part: Record<PartParamKey, number>
  }
  /**
   * Single channel mode: one channel, per-part CCs, and every layer CC hits
   * both layers at once (the chart calls them SELECT1-2, LEVEL1-2, ...).
   */
  single: {
    layer: Record<LayerParamKey, number>[]
    part: Pick<Record<PartParamKey, number>, 'send' | 'pan'>[]
  }
  global: Record<GlobalParamKey, number>
}

/** Order used by the official single-channel chart, per part. */
const SINGLE_LAYER_ORDER: LayerParamKey[] = [
  'select',
  'level',
  'modAmount',
  'modRate',
  'pitch',
  'egAttack',
  'egRelease',
]

/** First CC of each part's 7-CC block, plus its SEND and PAN CCs. */
const SINGLE_PART_BLOCKS: { ccs: number[]; send: number; pan: number }[] = [
  { ccs: [14, 15, 16, 17, 18, 19, 20], send: 103, pan: 109 },
  { ccs: [23, 24, 25, 26, 27, 28, 29], send: 104, pan: 110 },
  { ccs: [46, 47, 48, 49, 50, 51, 52], send: 105, pan: 111 },
  { ccs: [55, 56, 57, 58, 59, 60, 61], send: 106, pan: 112 },
  { ccs: [80, 81, 82, 83, 84, 85, 86], send: 107, pan: 113 },
  { ccs: [89, 90, 96, 97, 98, 99, 100], send: 108, pan: 114 },
]

function buildSingleTable(): CcTable['single'] {
  const layer = SINGLE_PART_BLOCKS.map((block) => {
    const row = {} as Record<LayerParamKey, number>
    SINGLE_LAYER_ORDER.forEach((key, i) => {
      row[key] = block.ccs[i]
    })
    return row
  })
  const part = SINGLE_PART_BLOCKS.map((block) => ({ send: block.send, pan: block.pan }))
  return { layer, part }
}

export const DEFAULT_CC_TABLE: CcTable = {
  split: {
    layer: {
      select: [14, 15, 16],
      level: [17, 18, 19],
      egAttack: [20, 21, 22],
      egRelease: [23, 24, 25],
      pitch: [26, 27, 28],
      modAmount: [29, 30, 31],
      modRate: [46, 47, 48],
    },
    part: {
      bitReduction: 49,
      fold: 50,
      drive: 51,
      dryGain: 52,
      pan: 10,
      send: 103,
      pitchModQuantize: 53,
    },
  },
  single: buildSingleTable(),
  global: { wgModel: 116, wgDecay: 117, wgBody: 118, wgTune: 119 },
}

export function cloneCcTable(table: CcTable): CcTable {
  return JSON.parse(JSON.stringify(table)) as CcTable
}

/** Part-level parameters the single-channel implementation simply does not expose. */
export const SINGLE_MODE_UNAVAILABLE: PartParamKey[] = [
  'bitReduction',
  'fold',
  'drive',
  'dryGain',
  'pitchModQuantize',
]

export function isPartParamAvailable(mode: ChannelMode, key: PartParamKey): boolean {
  return mode === 'split' || !SINGLE_MODE_UNAVAILABLE.includes(key)
}

/** In single-channel mode one CC drives both layers, so they cannot diverge. */
export function areLayersIndependent(mode: ChannelMode): boolean {
  return mode === 'split'
}

// ---------------------------------------------------------------------------
// SELECT packing
// ---------------------------------------------------------------------------

export const SELECT_COMBINATIONS = 45 // 5 waves x 3 mod types x 3 eg types

/**
 * wave/mod/eg -> the single 0..127 value CC SELECT expects.
 *
 * Rounding up rather than to nearest is deliberate: it lands on the first value
 * of each combination's bucket, which is what a working volca drum editor
 * sends, and it makes the value survive the device's floor-based decode.
 */
export function encodeSelect(wave: number, modType: number, egType: number): number {
  const index = wave * 9 + modType * 3 + egType
  return clamp7(Math.ceil((index * 128) / SELECT_COMBINATIONS))
}

export function encodeSelectFromLayer(layer: Layer): number {
  return encodeSelect(layer.wave, layer.modType, layer.egType)
}

export function decodeSelect(value: number): { wave: number; modType: number; egType: number } {
  const index = Math.min(
    SELECT_COMBINATIONS - 1,
    Math.floor((clamp7(value) * SELECT_COMBINATIONS) / 128),
  )
  return {
    wave: Math.floor(index / 9),
    modType: Math.floor((index % 9) / 3),
    egType: index % 3,
  }
}

export function clamp7(value: number): number {
  return Math.max(0, Math.min(127, Math.round(value)))
}

// ---------------------------------------------------------------------------
// Message building
// ---------------------------------------------------------------------------

export interface MidiConfig {
  mode: ChannelMode
  /** Split: channel of part 1 (1..11). Single: the shared channel (1..16). */
  baseChannel: number
  ccTable: CcTable
  /** Send the community-sourced PITCH MOD QUANT CC (not in the official chart). */
  sendPitchModQuantize: boolean
}

export interface CcMessage {
  /** 1-based MIDI channel. */
  channel: number
  cc: number
  value: number
  /** Human readable, used by the monitor and the send-all progress readout. */
  label: string
  /** Coalescing key: newer messages replace older ones with the same key. */
  key: string
}

export function channelForPart(config: MidiConfig, part: number): number {
  if (config.mode === 'single') return config.baseChannel
  return ((config.baseChannel - 1 + part) % 16) + 1
}

/** Channel used for the global waveguide block. */
export function globalChannel(config: MidiConfig): number {
  return config.mode === 'single' ? config.baseChannel : channelForPart(config, 0)
}

export function layerCc(
  config: MidiConfig,
  part: number,
  target: LayerTarget,
  key: LayerParamKey,
): number | null {
  if (config.mode === 'single') {
    const row = config.ccTable.single.layer[part]
    return row ? row[key] : null
  }
  const trio = config.ccTable.split.layer[key]
  if (!trio) return null
  return target === 'both' ? trio[2] : trio[target]
}

export function partCc(config: MidiConfig, part: number, key: PartParamKey): number | null {
  if (config.mode === 'single') {
    if (key !== 'send' && key !== 'pan') return null
    const row = config.ccTable.single.part[part]
    return row ? row[key] : null
  }
  return config.ccTable.split.part[key] ?? null
}

const PART_LABEL = (part: number) => `P${part + 1}`
const LAYER_LABEL = (target: LayerTarget) => (target === 'both' ? 'L1+2' : `L${target + 1}`)

export function layerMessage(
  config: MidiConfig,
  part: number,
  target: LayerTarget,
  key: LayerParamKey,
  value: number,
): CcMessage | null {
  const cc = layerCc(config, part, target, key)
  if (cc == null) return null
  const channel = channelForPart(config, part)
  return {
    channel,
    cc,
    value: clamp7(value),
    label: `${PART_LABEL(part)} ${LAYER_LABEL(target)} ${key}`,
    key: `${channel}:${cc}`,
  }
}

export function partMessage(
  config: MidiConfig,
  part: number,
  key: PartParamKey,
  value: number,
): CcMessage | null {
  const cc = partCc(config, part, key)
  if (cc == null) return null
  const channel = channelForPart(config, part)
  return {
    channel,
    cc,
    value: clamp7(value),
    label: `${PART_LABEL(part)} ${key}`,
    key: `${channel}:${cc}`,
  }
}

export function globalMessage(
  config: MidiConfig,
  key: GlobalParamKey,
  value: number,
): CcMessage {
  const cc = config.ccTable.global[key]
  const channel = globalChannel(config)
  return {
    channel,
    cc,
    value: clamp7(value),
    label: `WG ${key}`,
    key: `${channel}:${cc}`,
  }
}

/** Raw value of a layer parameter, with SELECT packed into its CC encoding. */
export function layerParamValue(layer: Layer, key: LayerParamKey): number {
  if (key === 'select') return encodeSelectFromLayer(layer)
  return layer[key]
}

export function partParamValue(part: Part, key: PartParamKey): number {
  if (key === 'pitchModQuantize') return part.pitchModQuantize ? 127 : 0
  return part[key]
}

const ALL_LAYER_KEYS: LayerParamKey[] = [
  'select',
  'level',
  'pitch',
  'egAttack',
  'egRelease',
  'modAmount',
  'modRate',
]

const ALL_PART_KEYS: PartParamKey[] = [
  'send',
  'pan',
  'bitReduction',
  'fold',
  'drive',
  'dryGain',
  'pitchModQuantize',
]

/**
 * Every CC message needed to make the machine match the patch.
 * This is what SEND ALL pushes, in order: parts 1..6 then the waveguide.
 */
export function buildFullDump(patch: Patch, config: MidiConfig): CcMessage[] {
  const out: CcMessage[] = []
  for (let part = 0; part < PART_COUNT; part++) {
    const partData = patch.parts[part]
    if (!partData) continue
    if (config.mode === 'single') {
      // One CC per parameter drives both layers; layer 1 is the source of truth.
      for (const key of ALL_LAYER_KEYS) {
        const msg = layerMessage(config, part, 0, key, layerParamValue(partData.layers[0], key))
        if (msg) out.push(msg)
      }
    } else {
      for (let layer = 0; layer < 2; layer++) {
        for (const key of ALL_LAYER_KEYS) {
          const msg = layerMessage(
            config,
            part,
            layer as 0 | 1,
            key,
            layerParamValue(partData.layers[layer], key),
          )
          if (msg) out.push(msg)
        }
      }
    }
    for (const key of ALL_PART_KEYS) {
      if (key === 'pitchModQuantize' && !config.sendPitchModQuantize) continue
      if (!isPartParamAvailable(config.mode, key)) continue
      const msg = partMessage(config, part, key, partParamValue(partData, key))
      if (msg) out.push(msg)
    }
  }
  out.push(globalMessage(config, 'wgModel', patch.waveGuide.model === 1 ? 64 : 0))
  out.push(globalMessage(config, 'wgDecay', patch.waveGuide.decay))
  out.push(globalMessage(config, 'wgBody', patch.waveGuide.body))
  out.push(globalMessage(config, 'wgTune', patch.waveGuide.tune))
  return out
}

/** Messages for one part only — used by "send this part". */
export function buildPartDump(patch: Patch, config: MidiConfig, part: number): CcMessage[] {
  return buildFullDump(patch, config).filter((m) => m.label.startsWith(`${PART_LABEL(part)} `))
}
