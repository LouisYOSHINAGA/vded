import { useEffect, useRef, useState } from 'react'
import { FONTS, THEMES, ZOOM_STEPS } from '../data/appearance'
import type { FontId, ThemeId } from '../data/appearance'
import { setSettings } from '../state/actions'
import { useAppState } from '../state/store'

/** Theme / font / scale picker. The choice is stored with the workspace. */
export function AppearanceMenu() {
  const appearance = useAppState((s) => s.settings.appearance)
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const update = (patch: Partial<typeof appearance>) => {
    setSettings({ appearance: { ...appearance, ...patch } })
  }

  const current = THEMES.find((theme) => theme.id === appearance.theme) ?? THEMES[0]

  return (
    <div className="appearance" ref={root}>
      <button
        type="button"
        className="btn btn--ghost appearance__trigger"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        title="スキン・フォント・表示倍率"
      >
        <span className="appearance__swatch" aria-hidden="true">
          {current.swatch.map((color) => (
            <i key={color} style={{ background: color }} />
          ))}
        </span>
        Skin
      </button>

      {open && (
        <div className="appearance__pop panel" role="dialog" aria-label="外観設定">
          <section className="appearance__group">
            <h3 className="legend">Theme</h3>
            <div className="appearance__themes">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  className="theme-card"
                  aria-pressed={theme.id === appearance.theme}
                  onClick={() => update({ theme: theme.id as ThemeId })}
                  title={theme.note}
                >
                  <span className="theme-card__swatch" aria-hidden="true">
                    {theme.swatch.map((color) => (
                      <i key={color} style={{ background: color }} />
                    ))}
                  </span>
                  <span className="theme-card__name">{theme.name}</span>
                  <span className="theme-card__note hint">{theme.note}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="appearance__group">
            <h3 className="legend">Font</h3>
            <div className="appearance__fonts">
              {FONTS.map((font) => (
                <button
                  key={font.id}
                  type="button"
                  className="font-card"
                  data-font-preview={font.id}
                  aria-pressed={font.id === appearance.font}
                  onClick={() => update({ font: font.id as FontId })}
                  title={font.note}
                >
                  <span className="font-card__name">{font.name}</span>
                  <span className="font-card__sample">Aa 123 かな</span>
                </button>
              ))}
            </div>
          </section>

          <section className="appearance__group">
            <h3 className="legend">UI scale</h3>
            <div className="segmented appearance__zoom">
              {ZOOM_STEPS.map((zoom) => (
                <button
                  key={zoom}
                  type="button"
                  className="segmented__item"
                  aria-pressed={Math.abs(zoom - appearance.zoom) < 0.001}
                  onClick={() => update({ zoom })}
                >
                  {Math.round(zoom * 100)}%
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
