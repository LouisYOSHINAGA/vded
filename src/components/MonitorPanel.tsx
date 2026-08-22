import { useLayoutEffect, useRef } from 'react'
import { useT } from '../i18n'
import { midiEngine } from '../midi/engine'
import { useMidiSnapshot } from '../hooks/useMidiSnapshot'

/**
 * Live view of what leaves the MIDI port. Always open: the log is capped and
 * rendering a few rows costs nothing next to the value of seeing, at any
 * moment, exactly what the machine was told.
 *
 * The header sits outside the scroller rather than sticking to the top of it,
 * so rows are clipped at the bottom edge of the labels instead of sliding
 * behind them. The two share one fixed column layout, and the body's
 * horizontal scroll is mirrored onto the header.
 */
export function MonitorPanel() {
  const t = useT()
  const midi = useMidiSnapshot()
  const head = useRef<HTMLDivElement>(null)
  const body = useRef<HTMLDivElement>(null)

  // The header is a second table, so it has to be told how wide the body's
  // table came out and how much room its scrollbar takes; otherwise the two
  // drift apart the moment a long target name widens the last column.
  useLayoutEffect(() => {
    const headBox = head.current
    const bodyBox = body.current
    const headTable = headBox?.querySelector('table')
    const bodyTable = bodyBox?.querySelector('table')
    if (!headBox || !bodyBox || !headTable || !bodyTable) return
    headTable.style.width = `${bodyTable.offsetWidth}px`
    headBox.style.paddingRight = `${bodyBox.offsetWidth - bodyBox.clientWidth}px`
  })

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
        <div className="monitor__head" ref={head}>
          <table className="monitor__table">
            <thead>
              <tr>
                <th scope="col" className="monitor__col--ch">
                  {t('monitor.colCh')}
                </th>
                <th scope="col" className="monitor__col--cc">
                  {t('monitor.colCc')}
                </th>
                <th scope="col" className="monitor__col--val">
                  {t('monitor.colValue')}
                </th>
                <th scope="col">{t('monitor.colTarget')}</th>
              </tr>
            </thead>
          </table>
        </div>
        <div
          className="monitor__scroll"
          ref={body}
          onScroll={(e) => {
            if (head.current) head.current.scrollLeft = e.currentTarget.scrollLeft
          }}
        >
          <table className="monitor__table">
            <tbody>
              {midi.log.map((entry) => (
                <tr key={entry.id} className="monitor__row">
                  <td className="monitor__col--ch">{entry.channel ?? '—'}</td>
                  <td className="monitor__col--cc">{entry.cc ?? '—'}</td>
                  <td className="monitor__col--val monitor__value">{entry.value ?? '—'}</td>
                  <td className="monitor__target">{entry.target}</td>
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
