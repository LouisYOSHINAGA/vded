/**
 * A skin is a handful of seed colours; every other token is derived from them.
 *
 * Presets and user-defined skins go through this same function, so anything the
 * built-in skins get — hover states, step shading, readable text on the accent —
 * a custom palette gets too.
 */
import { lift, luminance, mix, readableOn, rgba, sink } from './color'

export interface ThemeSeed {
  mode: 'dark' | 'light'
  /** Chassis colour behind the panels. */
  bg: string
  /** Panel surface. */
  panel: string
  /** Primary text. */
  ink: string
  accent: string
  /** One colour per sequencer part, in order. Layer 2 is derived from it. */
  parts: string[]
  danger: string
  warn: string
  ok: string
  info: string
}

export type ThemeVars = Record<string, string>

export function buildThemeVars(seed: ThemeSeed): ThemeVars {
  const { mode, bg, panel, ink, accent } = seed
  const dark = mode === 'dark'

  /** Raised surfaces move away from the chassis; recesses move toward it. */
  const up = (color: string, t: number) => (dark ? lift(color, t) : lift(color, t))
  const down = (color: string, t: number) => (dark ? sink(color, t) : sink(color, t))

  const surfaces: ThemeVars = dark
    ? {
        '--c-void': bg,
        '--c-body': up(bg, 0.03),
        '--c-panel': panel,
        '--c-panel-2': up(panel, 0.05),
        '--c-raise': up(panel, 0.11),
        '--c-raise-2': up(panel, 0.18),
        '--c-btn-hover': up(panel, 0.25),
        '--c-btn-hover-2': up(panel, 0.15),
        '--c-line': up(panel, 0.2),
        '--c-line-soft': up(panel, 0.08),
        '--c-topbar': up(panel, 0.06),
        '--c-topbar-2': down(panel, 0.2),
        '--c-rail-sel': up(panel, 0.08),
        '--c-toast': up(panel, 0.07),
        '--c-step-off': up(panel, 0.06),
        '--c-step-off-2': down(panel, 0.12),
        '--c-step-hover': up(panel, 0.12),
        '--c-step-hover-2': up(panel, 0.03),
        '--c-step-line': up(panel, 0.13),
        '--c-step-line-beat': up(panel, 0.28),
        '--c-step-now': up(panel, 0.26),
        '--c-track': up(panel, 0.1),
        '--c-knob-cap': down(panel, 0.28),
        '--c-knob-ring': up(panel, 0.22),
        '--c-led-off': up(panel, 0.09),
      }
    : {
        '--c-void': down(bg, 0.07),
        '--c-body': bg,
        '--c-panel': panel,
        '--c-panel-2': up(panel, 0.55),
        '--c-raise': down(panel, 0.05),
        '--c-raise-2': down(panel, 0.015),
        '--c-btn-hover': up(panel, 0.7),
        '--c-btn-hover-2': down(panel, 0.07),
        '--c-line': down(panel, 0.24),
        '--c-line-soft': down(panel, 0.11),
        '--c-topbar': down(panel, 0.03),
        '--c-topbar-2': down(panel, 0.1),
        '--c-rail-sel': up(panel, 0.45),
        '--c-toast': down(ink, 0.1),
        '--c-step-off': down(panel, 0.07),
        '--c-step-off-2': down(panel, 0.13),
        '--c-step-hover': down(panel, 0.02),
        '--c-step-hover-2': down(panel, 0.09),
        '--c-step-line': down(panel, 0.19),
        '--c-step-line-beat': down(panel, 0.36),
        '--c-step-now': down(panel, 0.28),
        '--c-track': down(panel, 0.15),
        '--c-knob-cap': up(panel, 0.6),
        '--c-knob-ring': down(panel, 0.3),
        '--c-led-off': down(panel, 0.2),
      }

  const inks: ThemeVars = {
    '--c-ink': ink,
    '--c-ink-bright': dark ? lift(ink, 0.65) : sink(ink, 0.6),
    '--c-ink-dim': mix(ink, panel, dark ? 0.32 : 0.34),
    '--c-ink-faint': mix(ink, panel, dark ? 0.55 : 0.56),
    '--c-on-accent': readableOn(accent),
    '--c-toast-ink': readableOn(dark ? up(panel, 0.07) : down(ink, 0.1)),
  }

  const accents: ThemeVars = {
    '--c-accent': accent,
    '--c-accent-hot': dark ? lift(accent, 0.22) : lift(accent, 0.13),
    '--c-accent-deep': sink(accent, 0.32),
    '--c-accent-glow': rgba(accent, dark ? 0.45 : 0.24),
    '--c-danger': seed.danger,
    '--c-warn': seed.warn,
    '--c-ok': seed.ok,
    '--c-info': seed.info,
  }

  /*
   * Layer 2 is the part's own colour pulled halfway to a neutral mid-tone.
   * Giving the layers hues of their own put them in competition with the six
   * part colours; this way a layer always belongs, visibly, to its part.
   */
  const neutral = mix(panel, ink, 0.5)
  const parts: ThemeVars = {}
  seed.parts.slice(0, 6).forEach((color, i) => {
    const second = mix(color, neutral, 0.5)
    parts[`--c-part-${i + 1}`] = color
    parts[`--c-on-part-${i + 1}`] = readableOn(color)
    parts[`--c-part-${i + 1}-2`] = second
    parts[`--c-on-part-${i + 1}-2`] = readableOn(second)
  })

  const depth: ThemeVars = dark
    ? {
        '--shadow-panel': '0 1px 0 rgba(255, 255, 255, 0.04) inset, 0 10px 24px rgba(0, 0, 0, 0.45)',
        '--shadow-raise': '0 1px 0 rgba(255, 255, 255, 0.07) inset, 0 2px 4px rgba(0, 0, 0, 0.5)',
        '--shadow-press': '0 1px 3px rgba(0, 0, 0, 0.6) inset',
        '--glow-strength': '1',
      }
    : {
        '--shadow-panel': `0 1px 0 rgba(255, 255, 255, 0.8) inset, 0 2px 8px ${rgba(sink(bg, 0.6), 0.14)}`,
        '--shadow-raise': `0 1px 0 rgba(255, 255, 255, 0.9) inset, 0 1px 2px ${rgba(sink(bg, 0.6), 0.2)}`,
        '--shadow-press': `0 1px 3px ${rgba(sink(bg, 0.6), 0.3)} inset`,
        '--glow-strength': '0.15',
      }

  return { ...surfaces, ...inks, ...accents, ...parts, ...depth }
}

/** Returns translation keys for anything that will be hard to read. */
export function seedWarnings(seed: ThemeSeed): string[] {
  const warnings: string[] = []
  const contrast = (a: string, b: string) => {
    const la = luminance(a)
    const lb = luminance(b)
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
  }
  if (contrast(seed.ink, seed.panel) < 4.5) warnings.push('warn.contrast')
  if (contrast(seed.accent, seed.panel) < 2) warnings.push('warn.accent')
  if (seed.mode === 'dark' && luminance(seed.panel) > 0.35) warnings.push('warn.darkPanel')
  if (seed.mode === 'light' && luminance(seed.panel) < 0.4) warnings.push('warn.lightPanel')
  return warnings
}
