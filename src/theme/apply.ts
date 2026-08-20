import type { Appearance } from '../data/appearance'
import { seedFor } from '../data/appearance'
import { buildThemeVars } from './palette'

let applied: string[] = []

/** Writes the derived palette onto the document element. */
export function applyAppearance(appearance: Appearance): void {
  const root = document.documentElement
  const seed = seedFor(appearance)
  const vars = buildThemeVars(seed)

  // Drop tokens the previous skin defined but this one does not.
  for (const name of applied) {
    if (!(name in vars)) root.style.removeProperty(name)
  }
  applied = Object.keys(vars)
  for (const [name, value] of Object.entries(vars)) {
    root.style.setProperty(name, value)
  }

  root.dataset.theme = appearance.theme
  root.dataset.mode = seed.mode
  root.dataset.font = appearance.font
  root.style.setProperty('--ui-zoom', String(appearance.zoom))
  root.style.colorScheme = seed.mode
}
