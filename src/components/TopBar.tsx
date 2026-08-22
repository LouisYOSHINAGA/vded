import { useT } from '../i18n'
import { useMidiSnapshot } from '../hooks/useMidiSnapshot'
import { panic, sendAll } from '../state/actions'
import { useAppState } from '../state/store'
import { AppearanceMenu } from './AppearanceMenu'
import { DeviceBar } from './DeviceBar'
import { Icon } from './Icon'
import { ShortcutsMenu } from './ShortcutsMenu'

export function TopBar() {
  const t = useT()
  const midi = useMidiSnapshot()
  const progress = useAppState((s) => s.ui.sendAllProgress)
  const connected = Boolean(midi.outputId)

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand__mark">
          V<em>DED</em>
        </span>
        <span className="brand__sub">{t('app.tagline')}</span>
        <span className="brand__version">ver.{__APP_VERSION__}</span>
      </div>

      <DeviceBar />

      <div className="topbar__spacer" />

      <div className="topbar__actions">
        <button
          type="button"
          className="btn btn--accent send-all"
          disabled={!connected}
          onClick={sendAll}
          title={t('top.sendAllTitle')}
        >
          <Icon name="send" size={15} />
          {t('top.sendAll')}
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
        <button type="button" className="btn btn--danger" onClick={panic} title={t('top.panicTitle')}>
          {t('top.panic')}
        </button>
      </div>
    </header>
  )
}
