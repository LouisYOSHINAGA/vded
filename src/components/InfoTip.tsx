import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from './Icon'

export interface InfoTipProps {
  /** Screen-reader label and tooltip heading. */
  label: string
  children: React.ReactNode
  align?: 'left' | 'right'
}

/**
 * Explanatory text on demand. Panels used to carry a sentence of prose each,
 * which competed with the controls; the same words live here instead.
 *
 * Hovering previews it; clicking pins it open so it can be read at leisure —
 * long help text is unreadable if it vanishes the moment the pointer drifts.
 * Clicking anywhere else puts it away.
 */
export function InfoTip({ label, children, align = 'left' }: InfoTipProps) {
  const [hovered, setHovered] = useState(false)
  const [pinned, setPinned] = useState(false)
  const root = useRef<HTMLSpanElement>(null)
  const id = useId()
  const open = hovered || pinned

  useEffect(() => {
    if (!pinned) return
    const onDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setPinned(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPinned(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [pinned])

  return (
    <span
      className="infotip"
      ref={root}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <button
        type="button"
        className="infotip__trigger"
        aria-label={label}
        aria-expanded={open}
        aria-pressed={pinned}
        aria-describedby={open ? id : undefined}
        onClick={() => setPinned((value) => !value)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
      >
        <Icon name="info" size={15} />
      </button>
      {open && (
        <span
          className={`infotip__bubble infotip__bubble--${align}${
            pinned ? ' infotip__bubble--pinned' : ''
          }`}
          id={id}
          role="tooltip"
        >
          {children}
        </span>
      )}
    </span>
  )
}
