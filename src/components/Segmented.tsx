import type { IconName } from './Icon'
import { Icon } from './Icon'

export interface SegmentedOption<T extends string | number> {
  value: T
  label: string
  title?: string
  disabled?: boolean
  /** Drawn above the label — the machine shows the same shapes on its LCD. */
  icon?: IconName
}

export interface SegmentedProps<T extends string | number> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  accent?: string
  stack?: boolean
  className?: string
  ariaLabel?: string
}

/** Small radio group styled like the machine's rubber selector buttons. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  accent,
  stack = false,
  className = '',
  ariaLabel,
}: SegmentedProps<T>) {
  return (
    <div
      className={`segmented${stack ? ' segmented--stack' : ''} ${className}`.trim()}
      role="group"
      aria-label={ariaLabel}
      style={accent ? ({ ['--seg-accent' as string]: accent } as React.CSSProperties) : undefined}
    >
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          className="segmented__item"
          aria-pressed={option.value === value}
          disabled={option.disabled}
          title={option.title ?? option.label}
          onClick={() => onChange(option.value)}
        >
          {option.icon && <Icon name={option.icon} size={26} className="segmented__icon" />}
          <span className="segmented__text">{option.label}</span>
        </button>
      ))}
    </div>
  )
}
