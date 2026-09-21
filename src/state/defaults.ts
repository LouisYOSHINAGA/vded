import type { Layer, Part, Pattern, Patch, Step, WaveGuide } from './types'
import { DEFAULT_STEPS, MAX_STEPS, PART_COUNT } from './types'

export function makeLayer(overrides: Partial<Layer> = {}): Layer {
  return {
    wave: 0,
    modType: 0,
    egType: 0,
    level: 100,
    pitch: 64,
    egAttack: 0,
    egRelease: 40,
    modAmount: 0,
    modRate: 64,
    ...overrides,
  }
}

export function makePart(name: string, overrides: Partial<Part> = {}): Part {
  return {
    name,
    layers: [makeLayer(), makeLayer({ level: 0 })],
    bitReduction: 0,
    fold: 0,
    drive: 0,
    dryGain: 100,
    pan: 64,
    send: 0,
    pitchModQuantize: false,
    ...overrides,
  }
}

export function makeWaveGuide(overrides: Partial<WaveGuide> = {}): WaveGuide {
  return { model: 0, decay: 64, body: 64, tune: 64, ...overrides }
}

export function makeInitPatch(): Patch {
  return {
    name: 'INIT',
    parts: Array.from({ length: PART_COUNT }, (_, i) => makePart(`PART ${i + 1}`)),
    waveGuide: makeWaveGuide(),
  }
}

export function makeStep(): Step {
  return { on: false, velocity: 100 }
}

/**
 * Rows are always MAX_STEPS long whatever the length is, so extending a
 * pattern never has to grow the arrays and never loses what a longer pattern
 * had before it was shortened.
 */
export function makeEmptyPattern(name = 'INIT PATTERN', length = DEFAULT_STEPS): Pattern {
  return {
    name,
    length,
    steps: Array.from({ length: PART_COUNT }, () =>
      Array.from({ length: MAX_STEPS }, () => makeStep()),
    ),
  }
}

/** Fills a pattern row from a step string: 'X' accent, 'x' normal, '.' off. */
export function rowFromString(spec: string): Step[] {
  return Array.from({ length: MAX_STEPS }, (_, i) => {
    const c = spec[i] ?? '.'
    if (c === 'X') return { on: true, velocity: 127 }
    if (c === 'x') return { on: true, velocity: 96 }
    if (c === 'o') return { on: true, velocity: 64 }
    return { on: false, velocity: 100 }
  })
}

export function patternFromStrings(name: string, rows: string[]): Pattern {
  const pattern = makeEmptyPattern(name)
  rows.slice(0, PART_COUNT).forEach((row, i) => {
    pattern.steps[i] = rowFromString(row)
  })
  return pattern
}

/**
 * Brings a pattern from anywhere — an old save, a preset file written before
 * pages existed — up to the current shape: PART_COUNT rows of MAX_STEPS, and a
 * length inside the range. Short rows keep what they had and gain empty steps.
 */
export function normalizePattern(pattern: Pattern | null | undefined): Pattern {
  if (!pattern || !Array.isArray(pattern.steps)) return makeEmptyPattern()
  const steps = Array.from({ length: PART_COUNT }, (_, part) => {
    const row = Array.isArray(pattern.steps[part]) ? pattern.steps[part] : []
    return Array.from({ length: MAX_STEPS }, (_, i) => {
      const step = row[i]
      if (!step || typeof step !== 'object') return makeStep()
      return {
        on: Boolean(step.on),
        velocity: Math.max(1, Math.min(127, Math.round(Number(step.velocity) || 100))),
      }
    })
  })
  const saved = Math.round(Number(pattern.length))
  const length = Number.isFinite(saved) ? Math.max(1, Math.min(MAX_STEPS, saved)) : DEFAULT_STEPS
  return { name: typeof pattern.name === 'string' ? pattern.name : 'INIT PATTERN', length, steps }
}
