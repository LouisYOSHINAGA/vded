import { useEffect, useRef, useState } from 'react'
import { t } from '../i18n'

export interface NumberFieldProps {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  /** Increment for one arrow key press and the drag unit. */
  step?: number
  /** Decimal places kept when committing. */
  precision?: number
  /** Width in characters; defaults to the widest value the range can produce. */
  chars?: number
  ariaLabel: string
  title?: string
  disabled?: boolean
  className?: string
  /** Pixels of vertical travel per `step`. */
  pixelsPerStep?: number
}

function clampTo(value: number, min: number, max: number, precision: number): number {
  const factor = 10 ** precision
  return Math.min(max, Math.max(min, Math.round(value * factor) / factor))
}

/**
 * Numeric field that can be dragged like a knob or typed into freely.
 *
 * A plain `<input type="number">` with a controlled clamp fights the user:
 * typing "1" on the way to "120" is instantly rewritten to the minimum. Here the
 * text is only a draft while focused, and clamping happens on commit.
 */
export function NumberField({
  value,
  onChange,
  min,
  max,
  step = 1,
  precision = 0,
  chars,
  ariaLabel,
  title,
  disabled = false,
  className = '',
  pixelsPerStep = 4,
}: NumberFieldProps) {
  const [draft, setDraft] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const drag = useRef<{ startY: number; startValue: number; moved: boolean } | null>(null)

  // Adopt external changes only while the user is not mid-edit.
  useEffect(() => {
    if (draft === null) return
    if (document.activeElement !== inputRef.current) setDraft(null)
  }, [draft, value])

  const commit = (text: string) => {
    const parsed = Number.parseFloat(text)
    if (Number.isFinite(parsed)) {
      const next = clampTo(parsed, min, max, precision)
      if (next !== value) onChange(next)
    }
    setDraft(null)
  }

  const nudge = (delta: number) => {
    const next = clampTo(value + delta, min, max, precision)
    if (next !== value) onChange(next)
  }

  const width = chars ?? Math.max(String(min).length, String(max).length) + (precision > 0 ? precision + 1 : 0)

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      className={`number-field${dragging ? ' number-field--dragging' : ''} ${className}`.trim()}
      style={{ width: `calc(${width}ch + 20px)` }}
      value={draft ?? value.toFixed(precision)}
      aria-label={ariaLabel}
      title={title ?? t('numberField.title', { name: ariaLabel })}
      disabled={disabled}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={() => setDraft(value.toFixed(precision))}
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          commit(e.currentTarget.value)
          e.currentTarget.blur()
        } else if (e.key === 'Escape') {
          setDraft(null)
          e.currentTarget.blur()
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault()
          const scale = e.shiftKey ? 10 : 1
          nudge((e.key === 'ArrowUp' ? step : -step) * scale)
          setDraft(null)
        }
      }}
      onPointerDown={(e) => {
        if (disabled || e.button !== 0) return
        drag.current = { startY: e.clientY, startValue: value, moved: false }
      }}
      onPointerMove={(e) => {
        const state = drag.current
        if (!state) return
        const delta = state.startY - e.clientY
        if (!state.moved) {
          // Below the threshold this is still a click, so let focus happen.
          if (Math.abs(delta) < 4) return
          state.moved = true
          setDragging(true)
          setDraft(null)
          inputRef.current?.blur()
          e.currentTarget.setPointerCapture(e.pointerId)
        }
        const perStep = e.shiftKey ? pixelsPerStep * 6 : pixelsPerStep
        onChange(clampTo(state.startValue + (delta / perStep) * step, min, max, precision))
      }}
      onPointerUp={(e) => {
        if (drag.current?.moved) {
          e.currentTarget.releasePointerCapture(e.pointerId)
          setDragging(false)
        }
        drag.current = null
      }}
      onPointerCancel={() => {
        drag.current = null
        setDragging(false)
      }}
    />
  )
}
