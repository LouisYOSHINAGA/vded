import { useId, useState } from 'react'
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
 */
export function InfoTip({ label, children, align = 'left' }: InfoTipProps) {
  const [open, setOpen] = useState(false)
  const id = useId()

  return (
    <span
      className="infotip"
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="infotip__trigger"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen((value) => !value)}
        onBlur={() => setOpen(false)}
        onFocus={() => setOpen(true)}
      >
        <Icon name="info" size={15} />
      </button>
      {open && (
        <span className={`infotip__bubble infotip__bubble--${align}`} id={id} role="tooltip">
          {children}
        </span>
      )}
    </span>
  )
}
