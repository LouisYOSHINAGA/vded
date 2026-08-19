import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CC_TABLE,
  buildFullDump,
  buildPartDump,
  channelForPart,
  decodeSelect,
  encodeSelect,
  isPartParamAvailable,
  layerCc,
  partCc,
  type MidiConfig,
} from '../ccmap'
import { makeInitPatch, makeLayer } from '../../state/defaults'
import { PART_COUNT } from '../../state/types'

const split: MidiConfig = {
  mode: 'split',
  baseChannel: 1,
  ccTable: DEFAULT_CC_TABLE,
  sendPitchModQuantize: false,
}

const single: MidiConfig = { ...split, mode: 'single' }

describe('SELECT packing', () => {
  it('matches the values a working volca drum editor sends', () => {
    // wave / mod / eg contributions, verified against a published editor.
    expect(encodeSelect(0, 0, 0)).toBe(0)
    expect(encodeSelect(1, 0, 0)).toBe(26)
    expect(encodeSelect(2, 0, 0)).toBe(52)
    expect(encodeSelect(3, 0, 0)).toBe(77)
    expect(encodeSelect(4, 0, 0)).toBe(103)
    expect(encodeSelect(0, 1, 0)).toBe(9)
    expect(encodeSelect(0, 2, 0)).toBe(18)
    expect(encodeSelect(0, 0, 1)).toBe(3)
    expect(encodeSelect(0, 0, 2)).toBe(6)
  })

  it('never leaves the 7-bit range', () => {
    expect(encodeSelect(4, 2, 2)).toBeLessThanOrEqual(127)
    expect(encodeSelect(4, 2, 2)).toBe(126)
  })

  it('round-trips every combination', () => {
    for (let wave = 0; wave < 5; wave++) {
      for (let modType = 0; modType < 3; modType++) {
        for (let egType = 0; egType < 3; egType++) {
          expect(decodeSelect(encodeSelect(wave, modType, egType))).toEqual({ wave, modType, egType })
        }
      }
    }
  })
})

describe('split channel map', () => {
  it('puts part n on channel n', () => {
    for (let part = 0; part < PART_COUNT; part++) {
      expect(channelForPart(split, part)).toBe(part + 1)
    }
  })

  it('offsets every part when the base channel moves', () => {
    const shifted = { ...split, baseChannel: 5 }
    expect(channelForPart(shifted, 0)).toBe(5)
    expect(channelForPart(shifted, 5)).toBe(10)
  })

  it('uses the same CC numbers for every part', () => {
    for (let part = 0; part < PART_COUNT; part++) {
      expect(layerCc(split, part, 0, 'select')).toBe(14)
      expect(layerCc(split, part, 1, 'select')).toBe(15)
      expect(layerCc(split, part, 'both', 'select')).toBe(16)
      expect(layerCc(split, part, 0, 'modRate')).toBe(46)
      expect(partCc(split, part, 'pan')).toBe(10)
      expect(partCc(split, part, 'send')).toBe(103)
    }
  })
})

describe('single channel map', () => {
  it('keeps every part on the one channel', () => {
    for (let part = 0; part < PART_COUNT; part++) {
      expect(channelForPart(single, part)).toBe(1)
    }
  })

  it('reproduces the official per-part CC blocks', () => {
    // From volca_drum_single_ch_MIDI_Chart: SELECT, LEVEL, MODAMT, MODRATE,
    // PITCH, EGATT, EGREL then SEND and PAN.
    const expected = [
      { ccs: [14, 15, 16, 17, 18, 19, 20], send: 103, pan: 109 },
      { ccs: [23, 24, 25, 26, 27, 28, 29], send: 104, pan: 110 },
      { ccs: [46, 47, 48, 49, 50, 51, 52], send: 105, pan: 111 },
      { ccs: [55, 56, 57, 58, 59, 60, 61], send: 106, pan: 112 },
      { ccs: [80, 81, 82, 83, 84, 85, 86], send: 107, pan: 113 },
      { ccs: [89, 90, 96, 97, 98, 99, 100], send: 108, pan: 114 },
    ]
    const order = ['select', 'level', 'modAmount', 'modRate', 'pitch', 'egAttack', 'egRelease'] as const
    expected.forEach((block, part) => {
      order.forEach((key, i) => {
        expect(layerCc(single, part, 0, key)).toBe(block.ccs[i])
        // Both layer targets collapse onto the same CC.
        expect(layerCc(single, part, 1, key)).toBe(block.ccs[i])
        expect(layerCc(single, part, 'both', key)).toBe(block.ccs[i])
      })
      expect(partCc(single, part, 'send')).toBe(block.send)
      expect(partCc(single, part, 'pan')).toBe(block.pan)
    })
  })

  it('reports the parameters the mode cannot reach', () => {
    for (const key of ['bitReduction', 'fold', 'drive', 'dryGain', 'pitchModQuantize'] as const) {
      expect(isPartParamAvailable('single', key)).toBe(false)
      expect(isPartParamAvailable('split', key)).toBe(true)
      expect(partCc(single, 0, key)).toBeNull()
    }
  })
})

describe('full dump', () => {
  it('covers both layers, the part block and the waveguide in split mode', () => {
    const messages = buildFullDump(makeInitPatch(), split)
    // 6 parts x (2 layers x 7 layer CCs + 6 part CCs) + 4 waveguide CCs
    expect(messages).toHaveLength(6 * (14 + 6) + 4)
    expect(messages.every((m) => m.value >= 0 && m.value <= 127)).toBe(true)
    expect(messages.every((m) => m.cc >= 0 && m.cc <= 127)).toBe(true)
    expect(messages.every((m) => m.channel >= 1 && m.channel <= 16)).toBe(true)
  })

  it('drops the unreachable parameters in single mode', () => {
    const messages = buildFullDump(makeInitPatch(), single)
    // 6 parts x (7 layer CCs + SEND + PAN) + 4 waveguide CCs
    expect(messages).toHaveLength(6 * 9 + 4)
    expect(messages.every((m) => m.channel === 1)).toBe(true)
  })

  it('adds PITCH MOD QUANT only when explicitly enabled', () => {
    const withQuant = buildFullDump(makeInitPatch(), { ...split, sendPitchModQuantize: true })
    expect(withQuant).toHaveLength(6 * (14 + 7) + 4)
    expect(withQuant.filter((m) => m.cc === 53)).toHaveLength(6)
  })

  it('sends layer 1 values when single mode collapses the layers', () => {
    const patch = makeInitPatch()
    patch.parts[0].layers[0] = makeLayer({ level: 111 })
    patch.parts[0].layers[1] = makeLayer({ level: 22 })
    const messages = buildFullDump(patch, single)
    const level = messages.find((m) => m.channel === 1 && m.cc === 15)
    expect(level?.value).toBe(111)
  })

  it('scopes a part dump to that part alone', () => {
    const messages = buildPartDump(makeInitPatch(), split, 2)
    expect(messages).toHaveLength(20)
    expect(messages.every((m) => m.channel === 3)).toBe(true)
  })

  it('maps the waveguide model onto its two-value CC', () => {
    const patch = makeInitPatch()
    patch.waveGuide.model = 1
    const messages = buildFullDump(patch, split)
    expect(messages.find((m) => m.cc === 116)?.value).toBe(64)
    patch.waveGuide.model = 0
    expect(buildFullDump(patch, split).find((m) => m.cc === 116)?.value).toBe(0)
  })
})
