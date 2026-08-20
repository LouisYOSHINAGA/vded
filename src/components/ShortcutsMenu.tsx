import { useEffect, useRef, useState } from 'react'

const SHORTCUTS: { keys: string; label: string }[] = [
  { keys: 'Space', label: '再生 / 停止' },
  { keys: '1 – 6', label: 'パート選択' },
  { keys: '⇧ + 1 – 6', label: 'パート試聴' },
  { keys: 'L', label: 'LINK L1+2 の切り替え' },
  { keys: '⌘ / Ctrl + S', label: 'SEND ALL PARAMETERS' },
  { keys: '?', label: 'このヘルプ' },
]

const GESTURES: { keys: string; label: string }[] = [
  { keys: 'ドラッグ', label: 'ノブ・数値・ベロシティの値を変更' },
  { keys: '⇧ + ドラッグ', label: '微調整' },
  { keys: 'ダブルクリック', label: '初期値に戻す（数値フィールドは入力）' },
  { keys: 'ステップをドラッグ', label: '連続して塗る / 消す' },
  { keys: '⇧ + ステップ', label: 'アクセント 127 → 96 → 64' },
]

/** Keyboard help, on demand instead of parked in a footer. */
export function ShortcutsMenu() {
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
        title="ショートカット一覧（? キー）"
      >
        ?
      </button>
      {open && (
        <div className="shortcuts__pop panel" role="dialog" aria-label="ショートカット">
          <h3 className="legend">Keyboard</h3>
          <ul className="shortcuts__list">
            {SHORTCUTS.map((item) => (
              <li key={item.keys}>
                <kbd>{item.keys}</kbd>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
          <h3 className="legend">Mouse</h3>
          <ul className="shortcuts__list">
            {GESTURES.map((item) => (
              <li key={item.keys}>
                <kbd>{item.keys}</kbd>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
          <p className="hint">音源は実機。VDED は MIDI を送るだけで、音は出しません。</p>
        </div>
      )}
    </div>
  )
}
