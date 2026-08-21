import { useEffect, useRef, useState } from 'react'
import type { Appearance, ThemeId } from '../data/appearance'
import { FONTS, SEED_FIELDS, THEMES, THEME_SEEDS, ZOOM_STEPS, seedFor } from '../data/appearance'
import { setSettings } from '../state/actions'
import { useAppState } from '../state/store'
import { isHex } from '../theme/color'
import type { ThemeSeed } from '../theme/palette'
import { seedWarnings } from '../theme/palette'

/** Skin / font / scale picker, including a full editor for a custom palette. */
export function AppearanceMenu() {
  const appearance = useAppState((s) => s.settings.appearance)
  const [open, setOpen] = useState(false)
  const [pane, setPane] = useState<'theme' | 'text'>('theme')
  const [editing, setEditing] = useState(false)
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

  const update = (patch: Partial<Appearance>) => {
    setSettings({ appearance: { ...appearance, ...patch } })
  }

  const updateSeed = (patch: Partial<ThemeSeed>) => {
    update({ theme: 'custom', custom: { ...appearance.custom, ...patch } })
  }

  const activeSeed = seedFor(appearance)
  const swatch = [activeSeed.panel, activeSeed.accent, activeSeed.parts[3]]

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
          {swatch.map((color, i) => (
            <i key={i} style={{ background: color }} />
          ))}
        </span>
        Skin
      </button>

      {open && (
        <div
          className={`appearance__pop panel${editing && pane === 'theme' ? ' appearance__pop--wide' : ''}`}
          role="dialog"
          aria-label="外観設定"
        >
          <div className="tabs appearance__tabs" role="tablist">
            <button
              type="button"
              role="tab"
              className="tabs__item"
              aria-selected={pane === 'theme'}
              onClick={() => setPane('theme')}
            >
              Theme
            </button>
            <button
              type="button"
              role="tab"
              className="tabs__item"
              aria-selected={pane === 'text'}
              onClick={() => setPane('text')}
            >
              Text
            </button>
          </div>

          {pane === 'theme' && (
          <section className="appearance__group">
            {(['light', 'dark'] as const).map((mode) => (
              <div key={mode} className="appearance__modegroup">
                <span className="appearance__modelabel legend">{mode}</span>
                <div className="appearance__themes">
                  {THEMES.filter((theme) => theme.mode === mode).map((theme) => {
                    const seed = THEME_SEEDS[theme.id as Exclude<ThemeId, 'custom'>]
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        className="theme-card"
                        aria-pressed={theme.id === appearance.theme}
                        onClick={() => update({ theme: theme.id })}
                        title={theme.note}
                      >
                        <span className="theme-card__swatch" aria-hidden="true">
                          <i style={{ background: seed.panel }} />
                          <i style={{ background: seed.accent }} />
                          <i style={{ background: seed.parts[3] }} />
                        </span>
                        <span className="theme-card__name">{theme.name}</span>
                        <span className="theme-card__note hint">{theme.note}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            <div className="theme-card theme-card--custom" data-active={appearance.theme === 'custom'}>
              <button
                type="button"
                className="theme-card__pick"
                aria-pressed={appearance.theme === 'custom'}
                onClick={() => {
                  // Selecting Custom on its own would look like nothing
                  // happened, so open the editor with it.
                  update({ theme: 'custom' })
                  setEditing(true)
                }}
              >
                <span className="theme-card__swatch" aria-hidden="true">
                  <i style={{ background: appearance.custom.panel }} />
                  <i style={{ background: appearance.custom.accent }} />
                  <i style={{ background: appearance.custom.parts[3] }} />
                </span>
                <span className="theme-card__name">Custom</span>
                <span className="theme-card__note hint">自分で配色を指定する</span>
              </button>
              <button
                type="button"
                className={`btn btn--sm${editing ? ' btn--on' : ' btn--ghost'}`}
                onClick={() => {
                  update({ theme: 'custom' })
                  setEditing((value) => !value)
                }}
              >
                {editing ? '閉じる' : '編集'}
              </button>
            </div>

            {editing && (
              <SkinEditor
                appearance={appearance}
                onSeed={updateSeed}
                onCopyFrom={(seed) => update({ theme: 'custom', custom: seed })}
              />
            )}
          </section>
          )}

          {pane === 'text' && (
          <>
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
                  onClick={() => update({ font: font.id })}
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
          </>
          )}
        </div>
      )}
    </div>
  )
}

function SkinEditor({
  appearance,
  onSeed,
  onCopyFrom,
}: {
  appearance: Appearance
  onSeed: (patch: Partial<ThemeSeed>) => void
  onCopyFrom: (seed: ThemeSeed) => void
}) {
  const seed = appearance.custom
  const warnings = seedWarnings(seed)

  return (
    <section className="appearance__group skin-editor">
      <div className="appearance__grouphead">
        <h3 className="legend">Custom palette</h3>
        <select
          className="select skin-editor__copy"
          value=""
          onChange={(event) => {
            const id = event.target.value as Exclude<ThemeId, 'custom'>
            if (id) onCopyFrom({ ...THEME_SEEDS[id], parts: [...THEME_SEEDS[id].parts] })
            event.currentTarget.value = ''
          }}
          title="既存スキンの配色をカスタムに複製します"
        >
          <option value="">複製元…</option>
          {THEMES.map((theme) => (
            <option key={theme.id} value={theme.id}>
              {theme.name}
            </option>
          ))}
        </select>
      </div>

      <div className="segmented skin-editor__mode">
        {(['light', 'dark'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            className="segmented__item"
            aria-pressed={seed.mode === mode}
            onClick={() => onSeed({ mode })}
            title="陰影やホバーの向きが変わります"
          >
            {mode}
          </button>
        ))}
      </div>

      <div className="skin-editor__grid">
        {SEED_FIELDS.map((field) => (
          <ColorField
            key={field.key}
            label={field.label}
            value={seed[field.key] as string}
            onChange={(value) => onSeed({ [field.key]: value } as Partial<ThemeSeed>)}
          />
        ))}
      </div>

      <h4 className="legend">Part colours</h4>
      <div className="skin-editor__grid">
        {seed.parts.map((color, i) => (
          <ColorField
            key={i}
            label={`Part ${i + 1}`}
            value={color}
            onChange={(value) => {
              const parts = [...seed.parts]
              parts[i] = value
              onSeed({ parts })
            }}
          />
        ))}
      </div>

      {warnings.length > 0 && (
        <div className="banner banner--warn">
          <div>
            {warnings.map((warning) => (
              <div key={warning}>{warning}</div>
            ))}
          </div>
        </div>
      )}
      <p className="hint">
        ここで指定するのは基準色だけです。ホバーや段差、アクセント上の文字色などは自動で導出されます。
      </p>
    </section>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)

  return (
    <label className="color-field">
      <span className="color-field__label legend">{label}</span>
      <span className="color-field__controls">
        <input
          type="color"
          className="color-field__swatch"
          value={value}
          aria-label={`${label} の色`}
          onChange={(event) => onChange(event.target.value)}
        />
        <input
          type="text"
          className="color-field__hex"
          value={draft ?? value}
          aria-label={`${label} のカラーコード`}
          spellCheck={false}
          onChange={(event) => {
            setDraft(event.target.value)
            if (isHex(event.target.value)) {
              const next = event.target.value.trim()
              onChange(next.startsWith('#') ? next : `#${next}`)
            }
          }}
          onBlur={() => setDraft(null)}
        />
      </span>
    </label>
  )
}
