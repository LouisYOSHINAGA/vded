/**
 * A label that changes with state without changing the control's width.
 *
 * Every candidate is rendered stacked in one grid cell and all but the current
 * one is hidden, so the box is always as wide as the longest wording — in
 * whichever language is loaded.
 */
export function SwapLabel({ options, value }: { options: string[]; value: string }) {
  return (
    <span className="swap-label">
      {options.map((option) => (
        <span
          key={option}
          className="swap-label__item"
          data-on={option === value}
          aria-hidden={option !== value}
        >
          {option}
        </span>
      ))}
    </span>
  )
}
