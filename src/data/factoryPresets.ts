/**
 * Starting-point kits. The volca drum cannot be read back over MIDI, so these
 * are editor-side sketches meant to be loaded and then dialled in by ear.
 */
import { makeLayer, makePart, makeWaveGuide, patternFromStrings } from '../state/defaults'
import type { Preset } from '../state/types'

function preset(
  id: string,
  name: string,
  parts: ReturnType<typeof makePart>[],
  waveGuide: ReturnType<typeof makeWaveGuide>,
  rows: string[],
): Preset {
  const now = Date.now()
  return {
    id,
    name,
    createdAt: now,
    updatedAt: now,
    patch: { name, parts, waveGuide },
    pattern: patternFromStrings(name, rows),
  }
}

export const FACTORY_PRESETS: Preset[] = [
  preset(
    'factory-four-on-floor',
    'FOUR ON FLOOR',
    [
      makePart('KICK', {
        layers: [
          makeLayer({ wave: 0, modType: 0, egType: 1, level: 122, pitch: 30, egRelease: 46, modAmount: 52, modRate: 18 }),
          makeLayer({ wave: 3, modType: 0, egType: 0, level: 38, pitch: 24, egRelease: 10 }),
        ],
        drive: 34,
        dryGain: 104,
      }),
      makePart('SNARE', {
        layers: [
          makeLayer({ wave: 4, modType: 0, egType: 0, level: 108, pitch: 74, egRelease: 30, modAmount: 18, modRate: 70 }),
          makeLayer({ wave: 0, modType: 0, egType: 1, level: 62, pitch: 86, egRelease: 18 }),
        ],
        send: 34,
      }),
      makePart('CL HAT', {
        layers: [
          makeLayer({ wave: 2, modType: 2, egType: 0, level: 92, pitch: 104, egRelease: 8, modAmount: 26, modRate: 110 }),
          makeLayer({ wave: 2, modType: 0, egType: 0, level: 0 }),
        ],
        pan: 78,
      }),
      makePart('OP HAT', {
        layers: [
          makeLayer({ wave: 2, modType: 2, egType: 2, level: 84, pitch: 100, egRelease: 52, modAmount: 30, modRate: 116 }),
          makeLayer({ wave: 2, modType: 0, egType: 0, level: 0 }),
        ],
        pan: 50,
        send: 22,
      }),
      makePart('CLAP', {
        layers: [
          makeLayer({ wave: 4, modType: 1, egType: 2, level: 100, pitch: 82, egAttack: 6, egRelease: 34, modAmount: 44, modRate: 96 }),
          makeLayer({ wave: 3, modType: 0, egType: 0, level: 44, pitch: 70, egRelease: 24 }),
        ],
        send: 48,
      }),
      makePart('PERC', {
        layers: [
          makeLayer({ wave: 1, modType: 0, egType: 1, level: 88, pitch: 92, egRelease: 22, modAmount: 60, modRate: 44 }),
          makeLayer({ wave: 0, modType: 1, egType: 0, level: 54, pitch: 108, egRelease: 16, modAmount: 30, modRate: 84 }),
        ],
        send: 70,
        pan: 88,
      }),
    ],
    makeWaveGuide({ model: 0, decay: 58, body: 70, tune: 64 }),
    [
      'x...x...x...x...',
      '....x.......x...',
      'x.x.x.x.x.x.x.x.',
      '..............x.',
      '....X.......X...',
      '..o....o..o.....',
    ],
  ),
  preset(
    'factory-bitcrush',
    'BIT CRUSH',
    [
      makePart('CRUSH BD', {
        layers: [
          makeLayer({ wave: 0, modType: 0, egType: 1, level: 118, pitch: 26, egRelease: 40, modAmount: 66, modRate: 14 }),
          makeLayer({ wave: 1, modType: 0, egType: 0, level: 52, pitch: 34, egRelease: 14 }),
        ],
        bitReduction: 78,
        drive: 62,
        fold: 30,
      }),
      makePart('GLITCH SD', {
        layers: [
          makeLayer({ wave: 4, modType: 2, egType: 0, level: 104, pitch: 78, egRelease: 26, modAmount: 62, modRate: 88 }),
          makeLayer({ wave: 1, modType: 2, egType: 1, level: 70, pitch: 96, egRelease: 20, modAmount: 48, modRate: 104 }),
        ],
        bitReduction: 92,
        fold: 58,
        send: 40,
      }),
      makePart('TICK', {
        layers: [
          makeLayer({ wave: 2, modType: 2, egType: 0, level: 86, pitch: 118, egRelease: 4, modAmount: 40, modRate: 124 }),
          makeLayer({ wave: 2, modType: 0, egType: 0, level: 0 }),
        ],
        bitReduction: 110,
        pan: 96,
      }),
      makePart('FOLD TOM', {
        layers: [
          makeLayer({ wave: 1, modType: 0, egType: 1, level: 96, pitch: 54, egRelease: 44, modAmount: 70, modRate: 26 }),
          makeLayer({ wave: 0, modType: 1, egType: 0, level: 60, pitch: 48, egRelease: 30, modAmount: 34, modRate: 40 }),
        ],
        fold: 96,
        drive: 40,
        send: 56,
      }),
      makePart('NOISE HIT', {
        layers: [
          makeLayer({ wave: 3, modType: 1, egType: 2, level: 92, pitch: 64, egAttack: 14, egRelease: 60, modAmount: 80, modRate: 52 }),
          makeLayer({ wave: 4, modType: 2, egType: 0, level: 48, pitch: 88, egRelease: 36 }),
        ],
        bitReduction: 64,
        send: 84,
        pan: 34,
      }),
      makePart('METAL', {
        layers: [
          makeLayer({ wave: 1, modType: 2, egType: 2, level: 90, pitch: 110, egRelease: 70, modAmount: 96, modRate: 118 }),
          makeLayer({ wave: 2, modType: 1, egType: 1, level: 56, pitch: 116, egRelease: 48, modAmount: 52, modRate: 96 }),
        ],
        fold: 74,
        send: 100,
        dryGain: 78,
      }),
    ],
    makeWaveGuide({ model: 1, decay: 92, body: 44, tune: 88 }),
    [
      'x.....x.x.......',
      '....x.......x..x',
      'xxxxxxxxxxxxxxxx',
      '......x.....x...',
      '..x........x....',
      '...........o..o.',
    ],
  ),
  preset(
    'factory-waveguide',
    'WAVE GUIDE BLOOM',
    [
      makePart('SUB', {
        layers: [
          makeLayer({ wave: 0, modType: 0, egType: 1, level: 116, pitch: 20, egRelease: 58, modAmount: 30, modRate: 10 }),
          makeLayer({ wave: 0, modType: 0, egType: 0, level: 0 }),
        ],
        send: 20,
      }),
      makePart('RIM', {
        layers: [
          makeLayer({ wave: 1, modType: 0, egType: 0, level: 96, pitch: 96, egRelease: 12, modAmount: 54, modRate: 66 }),
          makeLayer({ wave: 2, modType: 0, egType: 0, level: 40, pitch: 110, egRelease: 6 }),
        ],
        send: 96,
      }),
      makePart('BELL', {
        layers: [
          makeLayer({ wave: 0, modType: 1, egType: 2, level: 88, pitch: 104, egRelease: 74, modAmount: 88, modRate: 100 }),
          makeLayer({ wave: 0, modType: 1, egType: 1, level: 66, pitch: 116, egRelease: 62, modAmount: 60, modRate: 88 }),
        ],
        send: 118,
        pan: 84,
      }),
      makePart('SHAKER', {
        layers: [
          makeLayer({ wave: 2, modType: 2, egType: 0, level: 78, pitch: 112, egAttack: 8, egRelease: 14, modAmount: 34, modRate: 120 }),
          makeLayer({ wave: 2, modType: 0, egType: 0, level: 0 }),
        ],
        send: 30,
        pan: 44,
      }),
      makePart('WOOD', {
        layers: [
          makeLayer({ wave: 1, modType: 0, egType: 1, level: 92, pitch: 84, egRelease: 18, modAmount: 72, modRate: 34 }),
          makeLayer({ wave: 3, modType: 0, egType: 0, level: 36, pitch: 76, egRelease: 10 }),
        ],
        send: 74,
      }),
      makePart('AIR', {
        layers: [
          makeLayer({ wave: 3, modType: 1, egType: 2, level: 70, pitch: 60, egAttack: 40, egRelease: 96, modAmount: 46, modRate: 22 }),
          makeLayer({ wave: 4, modType: 1, egType: 2, level: 52, pitch: 72, egAttack: 30, egRelease: 88, modAmount: 38, modRate: 30 }),
        ],
        send: 110,
        dryGain: 64,
      }),
    ],
    makeWaveGuide({ model: 1, decay: 110, body: 88, tune: 72 }),
    [
      'x.......x.......',
      '..x...x...x...x.',
      'x.............x.',
      '.x.x.x.x.x.x.x.x',
      '....x.......x...',
      'x...............',
    ],
  ),
]
