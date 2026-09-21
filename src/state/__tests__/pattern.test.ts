import { describe, expect, it } from 'vitest'
import { makeEmptyPattern, normalizePattern, patternFromStrings } from '../defaults'
import { DEFAULT_STEPS, MAX_STEPS, PAGE_COUNT, PART_COUNT, STEPS_PER_PAGE } from '../types'

describe('pattern pages', () => {
  it('spans four pages of sixteen', () => {
    expect(MAX_STEPS).toBe(STEPS_PER_PAGE * PAGE_COUNT)
    expect(PAGE_COUNT).toBe(4)
  })

  it('starts one page long with full-width rows', () => {
    const pattern = makeEmptyPattern()
    expect(pattern.length).toBe(DEFAULT_STEPS)
    expect(pattern.steps).toHaveLength(PART_COUNT)
    pattern.steps.forEach((row) => expect(row).toHaveLength(MAX_STEPS))
  })

  it('pads a sixteen-step pattern from an older save without losing it', () => {
    const old = {
      name: 'OLD',
      length: 16,
      steps: Array.from({ length: PART_COUNT }, () =>
        Array.from({ length: 16 }, (_, i) => ({ on: i % 4 === 0, velocity: 120 })),
      ),
    }
    const migrated = normalizePattern(old)
    expect(migrated.name).toBe('OLD')
    expect(migrated.length).toBe(16)
    migrated.steps.forEach((row) => {
      expect(row).toHaveLength(MAX_STEPS)
      // What was there is untouched...
      expect(row.slice(0, 16).filter((step) => step.on)).toHaveLength(4)
      // ...and the three new pages arrive empty.
      expect(row.slice(16).some((step) => step.on)).toBe(false)
    })
  })

  it('clamps a length that is out of range and fills missing rows', () => {
    expect(normalizePattern({ name: 'X', length: 999, steps: [] }).length).toBe(MAX_STEPS)
    expect(normalizePattern({ name: 'X', length: 0, steps: [] }).length).toBe(1)
    expect(normalizePattern(null).steps).toHaveLength(PART_COUNT)
  })

  it('keeps seed patterns on the first page', () => {
    const pattern = patternFromStrings('SEED', ['x...x...x...x...'])
    expect(pattern.length).toBe(DEFAULT_STEPS)
    expect(pattern.steps[0]).toHaveLength(MAX_STEPS)
    expect(pattern.steps[0].slice(STEPS_PER_PAGE).some((step) => step.on)).toBe(false)
  })
})
