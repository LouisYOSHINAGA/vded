import { useMidiSnapshot } from '../hooks/useMidiSnapshot'
import { panic, sendAll } from '../state/actions'
import { useAppState } from '../state/store'
import { AppearanceMenu } from './AppearanceMenu'
import { DeviceBar } from './DeviceBar'
import { Icon } from './Icon'
import { ShortcutsMenu } from './ShortcutsMenu'

export function TopBar() {
  const midi = useMidiSnapshot()
  const progress = useAppState((s) => s.ui.sendAllProgress)
  const patchName = useAppState((s) => s.patch.name)
  const connected = Boolean(midi.outputId)

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand__mark">
          V<em>DED</em>
        </span>
        <span className="brand__sub">volca drum editor</span>
      </div>

      <DeviceBar />

      <div className="topbar__spacer" />

      <div className="cluster" title="編集中のプリセット名">
        <span className="cluster__label">Preset</span>
        <span className="value-readout" style={{ fontSize: 12 }}>
          {patchName || 'UNTITLED'}
        </span>
      </div>

      <div className="topbar__actions">
        <button
          type="button"
          className="btn btn--accent send-all"
          disabled={!connected}
          onClick={sendAll}
          title="現在のすべてのパラメータを CC で実機に送信します（volca drum は音色を送り返せないため、実機を画面に合わせる唯一の手段です）"
        >
          <Icon name="send" size={15} />
          Send all parameters
          {progress != null && (
            <span className="send-all__progress">
              <span className="progress">
                <span className="progress__bar" style={{ width: `${Math.round(progress * 100)}%` }} />
              </span>
            </span>
          )}
        </button>
        <AppearanceMenu />
        <ShortcutsMenu />
        <button
          type="button"
          className="btn btn--danger"
          onClick={panic}
          title="全チャンネルにノートオフを送信"
        >
          Panic
        </button>
      </div>
    </header>
  )
}
