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
import { store, toast, useAppState } from '../state/store'
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
      toast(count > 0 ? `${count} 件のプリセットを読み込みました` : '読み込めるプリセットがありません', count > 0 ? 'info' : 'warn')
    } catch (err) {
      toast(`ファイルを解析できません: ${err instanceof Error ? err.message : err}`, 'error')
    }
  }

  return (
    <section className="panel presets">
      <div className="panel__head">
        <h2 className="panel__title">Presets</h2>
        <span className="tag">{presets.length}</span>
        <div className="panel__spacer" />
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => download(`vded-presets-${Date.now()}.json`, JSON.stringify(makePresetFile(presets), null, 2))}
          disabled={presets.length === 0}
          title="全プリセットを JSON ファイルに書き出し"
        >
          Export
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => fileInput.current?.click()} title="JSON からプリセットを読み込み">
          Import
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
            placeholder={patchName || 'キット名'}
            value={name}
            maxLength={28}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSave()
            }}
            aria-label="保存するプリセット名"
          />
          <button type="button" className="btn btn--accent btn--sm" onClick={onSave}>
            Save
          </button>
        </div>
        <div className="presets__options">
          <label className="checkbox">
            <input type="checkbox" checked={withPattern} onChange={(e) => setWithPattern(e.target.checked)} />
            <span className="legend">パターンも含める</span>
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={withAppearance}
              onChange={(e) => setWithAppearance(e.target.checked)}
            />
            <span className="legend">スキン／フォントも含める</span>
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={sendOnLoad} onChange={(e) => setSendOnLoad(e.target.checked)} />
            <span className="legend">読込時に実機へ送信</span>
          </label>
        </div>

        {presets.length > 4 && (
          <input
            className="text-input presets__search"
            placeholder="検索…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="プリセット検索"
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
            <li className="presets__empty hint">
              プリセットがありません。エディットしてから <strong>SAVE</strong> で保存できます。
            </li>
          )}
        </ul>

        <div className="presets__footer">
          <button type="button" className="btn btn--ghost btn--sm" onClick={resetPatch} title="INIT KIT に戻す">
            Init kit
          </button>
          <span className="hint">
            volca drum は音色を送り返せないため、プリセットはエディタ側にのみ保存されます。
          </span>
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
          aria-label="プリセット名を変更"
        />
      ) : (
        <button
          type="button"
          className="preset__main"
          onClick={() => loadPreset(preset, { withPattern, withAppearance, send: sendOnLoad })}
          title="クリックで読み込み"
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
        <button type="button" className="micro-btn" title="現在の状態で上書き" onClick={() => overwritePreset(preset.id, { pattern: withPattern, appearance: withAppearance })}>
          ⤓
        </button>
        <button type="button" className="micro-btn" title="名前を変更" onClick={() => setRenaming(true)}>
          ✎
        </button>
        <button
          type="button"
          className="micro-btn"
          title="削除"
          onClick={() => {
            if (window.confirm(`「${preset.name}」を削除しますか？`)) deletePreset(preset.id)
          }}
        >
          ✕
        </button>
      </div>
    </li>
  )
}
