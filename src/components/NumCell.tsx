import { useEffect, useRef, useState } from 'react'

export interface NumCellProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  accent?: string
  disabled?: boolean
  title?: string
  format?: (value: number) => string
  ariaLabel: string
}

/**
 * Compact drag-editable number used by the all-layer matrix: vertical drag like
 * a knob, double click to type, and a bar in the background for scanning.
 */
export function NumCell({
  value,
  onChange,
  min = 0,
  max = 127,
  accent,
  disabled = false,
  title,
  format,
  ariaLabel,
}: NumCellProps) {
  const drag = useRef<{ startY: number; startValue: number } | null>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  const commit = (next: number) => {
    const clamped = Math.max(min, Math.min(max, Math.round(next)))
    if (clamped !== value) onChange(clamped)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="num-cell num-cell--editing"
        type="number"
        min={min}
        max={max}
        value={draft}
        aria-label={ariaLabel}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          commit(Number(draft))
          setEditing(false)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commit(Number(draft))
            setEditing(false)
          } else if (e.key === 'Escape') {
            setEditing(false)
          }
        }}
        autoFocus
      />
    )
  }

  return (
    <button
      type="button"
      className={`num-cell${disabled ? ' num-cell--disabled' : ''}`}
      style={accent ? ({ ['--cell-accent' as string]: accent } as React.CSSProperties) : undefined}
      disabled={disabled}
      title={title ?? ariaLabel}
      aria-label={ariaLabel}
      onPointerDown={(e) => {
        if (disabled || e.button !== 0) return
        e.preventDefault()
        ;(e.target as Element).setPointerCapture(e.pointerId)
        drag.current = { startY: e.clientY, startValue: value }
      }}
      onPointerMove={(e) => {
        const state = drag.current
        if (!state) return
        const sensitivity = e.shiftKey ? (max - min) / 700 : (max - min) / 140
        commit(state.startValue + (state.startY - e.clientY) * sensitivity)
      }}
      onPointerUp={() => {
        drag.current = null
      }}
      onPointerCancel={() => {
        drag.current = null
      }}
      onDoubleClick={() => {
        if (disabled) return
        setDraft(String(value))
        setEditing(true)
      }}
      onKeyDown={(e) => {
        if (disabled) return
        const step = e.shiftKey ? 1 : 4
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          commit(value + step)
        } else if (e.key === 'ArrowDown') {
          e.preventDefault()
          commit(value - step)
        }
      }}
    >
      <span
        className="num-cell__bar"
        style={{ width: `${((value - min) / (max - min)) * 100}%` }}
        aria-hidden="true"
      />
      <span className="num-cell__text">{format ? format(value) : value}</span>
    </button>
  )
}
