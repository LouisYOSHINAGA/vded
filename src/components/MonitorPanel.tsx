import { useT } from '../i18n'
import { midiEngine } from '../midi/engine'
import { useMidiSnapshot } from '../hooks/useMidiSnapshot'
import { setUi } from '../state/actions'
import { useAppState } from '../state/store'

/** Live view of what actually leaves (and enters) the MIDI port. */
export function MonitorPanel() {
  const t = useT()
  const midi = useMidiSnapshot()
  const open = useAppState((s) => s.ui.showMonitor)

  return (
    <section className="panel">
      <div className="panel__head">
        <h2 className="panel__title">{t('monitor.title')}</h2>
        {midi.queued > 0 && (
          <span className="tag tag--accent">{t('monitor.queue', { n: midi.queued })}</span>
        )}
        <div className="panel__spacer" />
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => midiEngine.clearLog()}
          disabled={midi.log.length === 0}
        >
          {t('monitor.clear')}
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => setUi({ showMonitor: !open })}
        >
          {open ? t('monitor.hide') : t('monitor.show')}
        </button>
      </div>
      {open && (
        <div className="panel__body monitor">
          {midi.error && <div className="banner banner--error">{midi.error}</div>}
          {/* A table, not a sentence per line: CC numbers and values are only
              worth reading when they line up in columns. */}
          <table className="monitor__table">
            <thead>
              <tr>
                <th scope="col">{t('monitor.colDir')}</th>
                <th scope="col">{t('monitor.colType')}</th>
                <th scope="col">{t('monitor.colCh')}</th>
                <th scope="col">{t('monitor.colNum')}</th>
                <th scope="col">{t('monitor.colValue')}</th>
                <th scope="col" className="monitor__th--target">
                  {t('monitor.colTarget')}
                </th>
              </tr>
            </thead>
            <tbody>
              {midi.log.map((entry) => (
                <tr key={entry.id} className={`monitor__row monitor__row--${entry.direction}`}>
                  <td className="monitor__dir">{entry.direction === 'out' ? 'OUT' : 'IN'}</td>
                  <td className="monitor__kind">{entry.kind}</td>
                  <td className="monitor__num">{entry.channel ?? ''}</td>
                  <td className="monitor__num">{entry.number ?? ''}</td>
                  <td className="monitor__num monitor__num--value">{entry.value ?? ''}</td>
                  <td className="monitor__target" title={entry.target}>
                    {entry.target}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {midi.log.length === 0 && <p className="hint monitor__empty">{t('monitor.empty')}</p>}
        </div>
      )}
    </section>
  )
}
