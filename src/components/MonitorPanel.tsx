import { useT } from '../i18n'
import { midiEngine } from '../midi/engine'
import { useMidiSnapshot } from '../hooks/useMidiSnapshot'

/**
 * Live view of what leaves the MIDI port. Always open: the log is capped and
 * rendering a few rows costs nothing next to the value of seeing, at any
 * moment, exactly what the machine was told.
 */
export function MonitorPanel() {
  const t = useT()
  const midi = useMidiSnapshot()

  return (
    <section className="panel monitor-panel">
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
      </div>
      <div className="panel__body monitor">
        {midi.error && <div className="banner banner--error">{midi.error}</div>}
        {/* A table, not a sentence per line: CC numbers and values are only
            worth reading when they line up in columns. */}
        <div className="monitor__scroll">
          <table className="monitor__table">
            <thead>
              <tr>
                <th scope="col">{t('monitor.colType')}</th>
                <th scope="col">{t('monitor.colCh')}</th>
                <th scope="col">{t('monitor.colNum')}</th>
                <th scope="col">{t('monitor.colValue')}</th>
                <th scope="col">{t('monitor.colTarget')}</th>
              </tr>
            </thead>
            <tbody>
              {midi.log.map((entry) => (
                <tr key={entry.id} className="monitor__row">
                  <td className="monitor__kind">{entry.kind}</td>
                  <td>{entry.channel ?? ''}</td>
                  <td>{entry.number ?? ''}</td>
                  <td className="monitor__value">{entry.value ?? ''}</td>
                  <td className="monitor__target" title={entry.target}>
                    {entry.target}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {midi.log.length === 0 && <p className="hint monitor__empty">{t('monitor.empty')}</p>}
      </div>
    </section>
  )
}
