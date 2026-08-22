import { useCallback, useId, useRef, useState } from 'react'
import { useAppState } from '../state/store'
import { NumberField } from './NumberField'

export interface KnobProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  /** Value restored on double click / right click. */
  defaultValue?: number
  /** Draw the arc from the centre instead of from the minimum (PAN, PITCH). */
  bipolar?: boolean
  size?: 'sm' | 'md' | 'lg'
  /** Formats the readout. Defaults to the raw MIDI value. */
  format?: (value: number) => string
  accent?: string
  disabled?: boolean
  title?: string
  /** Replace the readout with a field that can also be typed into. */
  editable?: boolean
  /** Shown next to an editable readout, e.g. a unit. */
  unit?: string
  /** 'stack' puts the label under the dial; 'inline' puts it beside. */
  layout?: 'stack' | 'inline'
}

const ARC = 270
const START = -135

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}

function arcPath(cx: number, cy: number, r: number, fromDeg: number, toDeg: number): string {
  const [x1, y1] = polar(cx, cy, r, fromDeg)
  const [x2, y2] = polar(cx, cy, r, toDeg)
  const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0
  const sweep = toDeg >= fromDeg ? 1 : 0
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} ${sweep} ${x2} ${y2}`
}

const SIZES = { sm: 34, md: 44, lg: 56 } as const

export function Knob({
  label,
  value,
  onChange,
  min = 0,
  max = 127,
  defaultValue,
  bipolar = false,
  size = 'md',
  format,
  accent,
  disabled = false,
  title,
  editable = false,
  unit,
  layout = 'stack',
}: KnobProps) {
  const zoom = useAppState((s) => s.settings.appearance.zoom)
  /*
   * The dial is sized in *final* pixels and cancels the app's UI scale inside
   * itself (see `.knob__dial` in controls.css). The app is scaled with CSS
   * `zoom`, and Chromium's GPU rasteriser gets an SVG's viewBox mapping wrong
   * when it is scaled that way — the value arc ends up drawn off the ring at a
   * larger radius. Neutralising the zoom means the SVG always maps 100 user
   * units onto a whole number of CSS pixels at an effective scale of 1, which
   * is the ordinary, well-trodden path through the rasteriser.
   */
  const px = Math.max(1, Math.round(SIZES[size] * (zoom > 0 ? zoom : 1)))
  const [dragging, setDragging] = useState(false)
  const drag = useRef<{ startY: number; startValue: number } | null>(null)
  const id = useId()

  const span = max - min
  const ratio = span === 0 ? 0 : (value - min) / span
  const angle = START + ratio * ARC
  const centreAngle = START + ARC / 2

  const commit = useCallback(
    (next: number) => {
      const clamped = Math.max(min, Math.min(max, Math.round(next)))
      if (clamped !== value) onChange(clamped)
    },
    [max, min, onChange, value],
  )

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || event.button !== 0) return
    event.preventDefault()
    ;(event.target as Element).setPointerCapture(event.pointerId)
    drag.current = { startY: event.clientY, startValue: value }
    setDragging(true)
  }

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = drag.current
    if (!state) return
    // 160 px of travel covers the full range; shift slows it down 5x.
    const sensitivity = (event.shiftKey ? span / 800 : span / 160)
    commit(state.startValue + (state.startY - event.clientY) * sensitivity)
  }

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    drag.current = null
    setDragging(false)
    if ((event.target as Element).hasPointerCapture?.(event.pointerId)) {
      ;(event.target as Element).releasePointerCapture(event.pointerId)
    }
  }

  const reset = (event: React.MouseEvent) => {
    event.preventDefault()
    if (disabled || defaultValue === undefined) return
    commit(defaultValue)
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return
    const coarse = event.shiftKey ? 1 : 4
    const map: Record<string, number> = {
      ArrowUp: coarse,
      ArrowRight: coarse,
      ArrowDown: -coarse,
      ArrowLeft: -coarse,
      PageUp: 16,
      PageDown: -16,
    }
    if (event.key in map) {
      event.preventDefault()
      commit(value + map[event.key])
    } else if (event.key === 'Home') {
      event.preventDefault()
      commit(min)
    } else if (event.key === 'End') {
      event.preventDefault()
      commit(max)
    }
  }

  const [px1, py1] = polar(50, 50, 22, angle)
  const [px2, py2] = polar(50, 50, 40, angle)
  const trackFrom = bipolar ? centreAngle : START
  const readout = format ? format(value) : String(value)

  return (
    <div
      className={`knob knob--${size} knob--${layout}${disabled ? ' knob--disabled' : ''}${
        dragging ? ' knob--dragging' : ''
      }`}
      style={accent ? ({ ['--knob-accent' as string]: accent } as React.CSSProperties) : undefined}
      title={title ?? `${label}: ${readout}`}
    >
      <div
        className="knob__dial"
        style={{ width: px, height: px }}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={readout}
        aria-disabled={disabled}
        aria-labelledby={`${id}-label`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={reset}
        onContextMenu={reset}
        onKeyDown={onKeyDown}
      >
        {/* Keyed on the UI scale so the SVG is re-created when it changes:
            Chromium otherwise reuses the subtree's raster at the old scale. */}
        <svg viewBox="0 0 100 100" width={px} height={px} aria-hidden="true" key={zoom}>
          {/* Track and fill are the same arc at the same width, so the
              coloured part can never reach outside the ring. There is no halo:
              anything wider than the track paints past it, which at small UI
              scales reads as colour spilling off the dial. */}
          <path className="knob__track" d={arcPath(50, 50, 40, START, START + ARC)} />
          <path
            className="knob__fill"
            d={arcPath(50, 50, 40, Math.min(trackFrom, angle), Math.max(trackFrom, angle))}
          />
          <circle className="knob__cap" cx="50" cy="50" r="30" />
          <line className="knob__pointer" x1={px1} y1={py1} x2={px2} y2={py2} />
        </svg>
      </div>
      <span className="knob__readout">
        <span className="knob__label legend" id={`${id}-label`}>
          {label}
        </span>
        {editable ? (
          <span className="knob__field">
            <NumberField
              ariaLabel={label}
              value={value}
              min={min}
              max={max}
              onChange={onChange}
              disabled={disabled}
              className="number-field--knob"
            />
            {unit && <span className="knob__unit">{unit}</span>}
          </span>
        ) : (
          <span className="knob__value value-readout">{readout}</span>
        )}
      </span>
    </div>
  )
}
