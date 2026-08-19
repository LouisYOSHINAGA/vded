import { midiEngine } from '../midi/engine'
import { useMidiSnapshot } from '../hooks/useMidiSnapshot'
import { setSettings, setUi } from '../state/actions'
import { useAppState } from '../state/store'
import { PART_COUNT } from '../state/types'
import { Segmented } from './Segmented'

const STATUS_TEXT: Record<string, string> = {
  unsupported: 'Web MIDI 非対応',
  idle: 'MIDI 未接続',
  requesting: '接続中…',
  ready: 'MIDI 準備完了',
  denied: 'アクセス拒否',
  error: 'エラー',
}

/** MIDI port discovery, selection and channel-mode configuration. */
export function DeviceBar() {
  const midi = useMidiSnapshot()
  const mode = useAppState((s) => s.settings.mode)
  const baseChannel = useAppState((s) => s.settings.baseChannel)

  const selected = midi.outputs.find((p) => p.id === midi.outputId) ?? null
  const connected = Boolean(selected)
  const maxBase = mode === 'split' ? 16 - PART_COUNT + 1 : 16
  const channelHint =
    mode === 'split'
      ? `CH ${baseChannel}–${baseChannel + PART_COUNT - 1} → PART 1–6`
      : `CH ${baseChannel} → 全パート共通`

  return (
    <>
      <div className="cluster device">
        <span className="cluster__label">Device</span>
        <span
          className={`led ${connected ? (selected?.isVolcaDrum ? 'led--on' : 'led--warn') : ''}`}
          title={STATUS_TEXT[midi.status] ?? midi.status}
        />
        {midi.status === 'ready' ? (
          <>
            <select
              className="select device__select"
              value={midi.outputId ?? ''}
              onChange={(e) => midiEngine.selectOutput(e.target.value || null)}
              aria-label="MIDI 出力デバイス"
              title="MIDI OUT — volca drum を接続したポート"
            >
              <option value="">— MIDI OUT を選択 —</option>
              {midi.outputs.map((port) => (
                <option key={port.id} value={port.id}>
                  {port.isVolcaDrum ? '★ ' : ''}
                  {port.name}
                  {port.manufacturer ? ` (${port.manufacturer})` : ''}
                </option>
              ))}
            </select>
            <select
              className="select device__select device__select--in"
              value={midi.inputId ?? ''}
              onChange={(e) => midiEngine.selectInput(e.target.value || null)}
              aria-label="MIDI 入力デバイス"
              title="MIDI IN — モニタ用（volca drum は送信しません）"
            >
              <option value="">IN: なし</option>
              {midi.inputs.map((port) => (
                <option key={port.id} value={port.id}>
                  IN: {port.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => midiEngine.refreshPorts(true)}
              title="ポートを再スキャン"
            >
              ⟳
            </button>
          </>
        ) : (
          <button
            type="button"
            className="btn btn--accent btn--sm"
            disabled={midi.status === 'unsupported' || midi.status === 'requesting'}
            onClick={() => void midiEngine.connect()}
          >
            {midi.status === 'unsupported' ? 'Web MIDI 非対応' : 'MIDI に接続'}
          </button>
        )}
      </div>

      <div className="cluster">
        <span className="cluster__label">Mode</span>
        <Segmented
          ariaLabel="MIDI チャンネルモード"
          options={[
            { value: 'split', label: 'Split', title: 'パート 1–6 をチャンネル 1–6 で個別制御（推奨・工場出荷時）' },
            { value: 'single', label: 'Single', title: '全パートを 1 チャンネルで制御。レイヤ別・BIT/FOLD/DRIVE/GAIN は不可' },
          ]}
          value={mode}
          onChange={(next) => {
            const clamped = next === 'split' ? Math.min(baseChannel, 16 - PART_COUNT + 1) : baseChannel
            setSettings({ mode: next, baseChannel: clamped })
            if (next === 'single') setUi({ layerLink: true })
          }}
        />
        <label className="row" style={{ gap: 4 }}>
          <span className="cluster__label">CH</span>
          <input
            className="number-input"
            style={{ width: 46 }}
            type="number"
            min={1}
            max={maxBase}
            value={baseChannel}
            onChange={(e) =>
              setSettings({
                baseChannel: Math.max(1, Math.min(maxBase, Number(e.target.value) || 1)),
              })
            }
            aria-label="ベース MIDI チャンネル"
          />
        </label>
        <span className="hint device__hint">{channelHint}</span>
      </div>
    </>
  )
}
