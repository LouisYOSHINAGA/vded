import { useEffect, useRef, useState } from 'react'
import { useT } from '../i18n'

const SHORTCUTS: { keys: string; key: string }[] = [
  { keys: 'Space', key: 'shortcuts.playStop' },
  { keys: '1 – 6', key: 'shortcuts.selectPart' },
  { keys: '⇧ + 1 – 6', key: 'shortcuts.auditionPart' },
  { keys: 'L', key: 'shortcuts.toggleLink' },
  { keys: '⌘ / Ctrl + S', key: 'shortcuts.sendAll' },
  { keys: '?', key: 'shortcuts.help' },
]

const GESTURES: { keys: string; key: string }[] = [
  { keys: 'Drag', key: 'shortcuts.drag' },
  { keys: '⇧ + Drag', key: 'shortcuts.fineDrag' },
  { keys: 'Double click', key: 'shortcuts.doubleClick' },
  { keys: 'Drag steps', key: 'shortcuts.paint' },
  { keys: '⇧ + Step', key: 'shortcuts.accent' },
]

/** Keyboard help, on demand instead of parked in a footer. */
export function ShortcutsMenu() {
  const t = useT()
  const [open, setOpen] = useState(false)
  /** Hover-opened help closes itself again; a click pins it. */
  const pinned = useRef(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) {
        pinned.current = false
        setOpen(false)
      }
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        pinned.current = false
        setOpen(false)
      }
      const target = event.target as HTMLElement | null
      const typing =
        target?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '')
      if (!typing && event.key === '?') {
        pinned.current = true
        setOpen((value) => !value)
      }
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div
      className="shortcuts"
      ref={root}
      onPointerLeave={() => {
        if (!pinned.current) setOpen(false)
      }}
    >
      <button
        type="button"
        className="btn btn--ghost shortcuts__trigger"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          pinned.current = !open
          setOpen((value) => !value)
        }}
        onPointerEnter={() => setOpen(true)}
        title={t('top.shortcutsTitle')}
      >
        ?
      </button>
      {open && (
        <div className="shortcuts__pop panel" role="dialog" aria-label={t('shortcuts.dialog')}>
          <h3 className="legend">{t('shortcuts.keyboard')}</h3>
          <ul className="shortcuts__list">
            {SHORTCUTS.map((item) => (
              <li key={item.keys}>
                <kbd>{item.keys}</kbd>
                <span>{t(item.key)}</span>
              </li>
            ))}
          </ul>
          <h3 className="legend">{t('shortcuts.mouse')}</h3>
          <ul className="shortcuts__list">
            {GESTURES.map((item) => (
              <li key={item.keys}>
                <kbd>{item.keys}</kbd>
                <span>{t(item.key)}</span>
              </li>
            ))}
          </ul>
          <p className="hint">{t('shortcuts.footer')}</p>
        </div>
      )}
    </div>
  )
}
