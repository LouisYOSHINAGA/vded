import { useRef, useState } from 'react'
import {
  deletePreset,
  importPresets,
  loadPreset,
  makePresetFile,
  overwritePreset,
  parsePresetFile,
  renamePreset,
  resetPatch,
  savePreset,
} from '../state/actions'
import { useT } from '../i18n'
import { store, toast, useAppState } from '../state/store'
import { Icon } from './Icon'
import { InfoTip } from './InfoTip'
import type { Preset } from '../state/types'

function download(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function formatDate(ms: number): string {
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function PresetPanel() {
  const t = useT()
  const presets = useAppState((s) => s.presets)
  const patchName = useAppState((s) => s.patch.name)
  const [name, setName] = useState('')
  const [withPattern, setWithPattern] = useState(true)
  const [withAppearance, setWithAppearance] = useState(false)
  const [sendOnLoad, setSendOnLoad] = useState(true)
  const [query, setQuery] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  const filtered = query
    ? presets.filter((preset) => preset.name.toLowerCase().includes(query.toLowerCase()))
    : presets

  const onSave = () => {
    const finalName = name.trim() || patchName || 'UNTITLED'
    savePreset(finalName, { pattern: withPattern, appearance: withAppearance })
    store.set((s) => ({ ...s, patch: { ...s.patch, name: finalName } }))
    setName('')
  }

  const onImport = async (file: File) => {
    try {
      const parsed = parsePresetFile(await file.text())
      const count = importPresets(parsed)
      toast(
        count > 0 ? t('presets.imported', { n: count }) : t('presets.importedNone'),
        count > 0 ? 'info' : 'warn',
      )
    } catch (err) {
      toast(
        t('presets.parseError', { message: err instanceof Error ? err.message : String(err) }),
        'error',
      )
    }
  }

  return (
    <section className="panel presets">
      <div className="panel__head">
        <h2 className="panel__title">{t('presets.title')}</h2>
        <span className="tag">{presets.length}</span>
        {/* Which kit is on screen right now. It lived in the top bar, but it is
            only ever consulted alongside the library itself. */}
        <span className="presets__current" title={t('top.presetTitle')}>
          <span className="cluster__label">{t('presets.editing')}</span>
          <span className="value-readout">{patchName || 'UNTITLED'}</span>
        </span>
        <div className="panel__spacer" />
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => download(`vded-presets-${Date.now()}.json`, JSON.stringify(makePresetFile(presets), null, 2))}
          disabled={presets.length === 0}
          title={t('presets.exportTitle')}
        >
          {t('presets.export')}
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => fileInput.current?.click()}
          title={t('presets.importTitle')}
        >
          {t('presets.import')}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void onImport(file)
            e.target.value = ''
          }}
        />
      </div>

      <div className="panel__body presets__body">
        <div className="presets__save">
          <input
            className="text-input"
            placeholder={patchName || t('presets.namePlaceholder')}
            value={name}
            maxLength={28}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSave()
            }}
            aria-label={t('presets.nameAria')}
          />
          <button type="button" className="btn btn--accent btn--sm" onClick={onSave}>
            {t('presets.save')}
          </button>
        </div>
        <div className="presets__options">
          <label className="checkbox">
            <input type="checkbox" checked={withPattern} onChange={(e) => setWithPattern(e.target.checked)} />
            <span className="legend">{t('presets.withPattern')}</span>
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={withAppearance}
              onChange={(e) => setWithAppearance(e.target.checked)}
            />
            <span className="legend">{t('presets.withAppearance')}</span>
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={sendOnLoad} onChange={(e) => setSendOnLoad(e.target.checked)} />
            <span className="legend">{t('presets.sendOnLoad')}</span>
          </label>
        </div>

        {presets.length > 4 && (
          <input
            className="text-input presets__search"
            placeholder={t('presets.search')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={t('presets.searchAria')}
          />
        )}

        <ul className="presets__list">
          {filtered.map((preset) => (
            <PresetRow
              key={preset.id}
              preset={preset}
              withPattern={withPattern}
              withAppearance={withAppearance}
              sendOnLoad={sendOnLoad}
            />
          ))}
          {filtered.length === 0 && (
            <li className="presets__empty hint">{t('presets.empty')}</li>
          )}
        </ul>

        <div className="presets__footer">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={resetPatch}
            title={t('presets.initTitle')}
          >
            {t('presets.init')}
          </button>
          <InfoTip label={t('presets.title')}>{t('presets.storageHelp')}</InfoTip>
        </div>
      </div>
    </section>
  )
}

function PresetRow({
  preset,
  withPattern,
  withAppearance,
  sendOnLoad,
}: {
  preset: Preset
  withPattern: boolean
  withAppearance: boolean
  sendOnLoad: boolean
}) {
  const t = useT()
  const [renaming, setRenaming] = useState(false)
  const [draft, setDraft] = useState(preset.name)

  return (
    <li className="preset">
      {renaming ? (
        <input
          className="text-input preset__rename"
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            renamePreset(preset.id, draft.trim() || preset.name)
            setRenaming(false)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
            if (e.key === 'Escape') setRenaming(false)
          }}
          aria-label={t('presets.renameAria')}
        />
      ) : (
        <button
          type="button"
          className="preset__main"
          onClick={() => loadPreset(preset, { withPattern, withAppearance, send: sendOnLoad })}
          title={t('presets.loadTitle')}
        >
          <span className="preset__name">{preset.name}</span>
          <span className="preset__meta">
            {preset.pattern && <span className="tag">PTN</span>}
            {preset.appearance && <span className="tag">SKIN</span>}
            <span className="hint">{formatDate(preset.updatedAt)}</span>
          </span>
        </button>
      )}
      <div className="preset__actions">
        <button
          type="button"
          className="micro-btn"
          title={t('presets.overwrite')}
          aria-label={t('presets.overwrite')}
          onClick={() =>
            overwritePreset(preset.id, { pattern: withPattern, appearance: withAppearance })
          }
        >
          <Icon name="overwrite" />
        </button>
        <button
          type="button"
          className="micro-btn"
          title={t('presets.rename')}
          aria-label={t('presets.rename')}
          onClick={() => setRenaming(true)}
        >
          <Icon name="rename" />
        </button>
        <button
          type="button"
          className="micro-btn"
          title={t('presets.delete')}
          aria-label={t('presets.delete')}
          onClick={() => {
            if (window.confirm(t('presets.deleteConfirm', { name: preset.name })))
              deletePreset(preset.id)
          }}
        >
          <Icon name="clear" />
        </button>
      </div>
    </li>
  )
}
