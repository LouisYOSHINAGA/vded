/** Minimal sRGB helpers. Enough to derive a whole UI palette from a few seeds. */

export interface Rgb {
  r: number
  g: number
  b: number
}

export function parseHex(hex: string): Rgb {
  let value = hex.trim().replace('#', '')
  if (value.length === 3) {
    value = value
      .split('')
      .map((c) => c + c)
      .join('')
  }
  const int = Number.parseInt(value.slice(0, 6), 16)
  if (!Number.isFinite(int)) return { r: 0, g: 0, b: 0 }
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 }
}

export function toHex({ r, g, b }: Rgb): string {
  const part = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${part(r)}${part(g)}${part(b)}`
}

export function isHex(value: string): boolean {
  return /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim())
}

export function mix(a: string, b: string, t: number): string {
  const x = parseHex(a)
  const y = parseHex(b)
  return toHex({
    r: x.r + (y.r - x.r) * t,
    g: x.g + (y.g - x.g) * t,
    b: x.b + (y.b - x.b) * t,
  })
}

/** Toward white. */
export function lift(color: string, t: number): string {
  return mix(color, '#ffffff', t)
}

/** Toward black. */
export function sink(color: string, t: number): string {
  return mix(color, '#000000', t)
}

export function rgba(color: string, alpha: number): string {
  const { r, g, b } = parseHex(color)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function luminance(color: string): number {
  const { r, g, b } = parseHex(color)
  const channel = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** Picks whichever of near-black / near-white reads better on `background`. */
export function readableOn(background: string): string {
  const dark = sink(background, 0.88)
  const light = lift(background, 0.94)
  return contrastRatio(background, dark) >= contrastRatio(background, light) ? dark : light
}
