import type { Appearance } from '../data/appearance'
import { seedFor } from '../data/appearance'
import { setLang } from '../i18n'
import { buildThemeVars } from './palette'

let applied: string[] = []
let lastZoom: number | null = null

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

  setLang(appearance.lang)
  document.documentElement.lang = appearance.lang
  root.dataset.theme = appearance.theme
  root.dataset.mode = seed.mode
  root.dataset.font = appearance.font
  root.style.setProperty('--ui-zoom', String(appearance.zoom))
  root.style.setProperty('--fs', String(appearance.fontScale ?? 1))
  if (lastZoom !== null && lastZoom !== appearance.zoom) repaint()
  lastZoom = appearance.zoom
  root.style.colorScheme = seed.mode
}

/**
 * Chromium can leave a subtree painted at the old scale after a CSS `zoom`
 * change — the SVG dials in particular keep their previous size until something
 * else invalidates them. Detaching and restoring the app forces a clean repaint.
 */
function repaint(): void {
  const app = document.querySelector<HTMLElement>('.app')
  if (!app) return
  const previous = app.style.display
  app.style.display = 'none'
  void app.offsetHeight
  app.style.display = previous
}
