import { midiEngine } from '../midi/engine'
import { useMidiSnapshot } from '../hooks/useMidiSnapshot'
import { setUi } from '../state/actions'
import { useAppState } from '../state/store'

/** Live view of what actually leaves (and enters) the MIDI port. */
export function MonitorPanel() {
  const midi = useMidiSnapshot()
  const open = useAppState((s) => s.ui.showMonitor)

  return (
    <section className="panel">
      <div className="panel__head">
        <h2 className="panel__title">MIDI monitor</h2>
        {midi.queued > 0 && <span className="tag tag--accent">queue {midi.queued}</span>}
        <div className="panel__spacer" />
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => midiEngine.clearLog()} disabled={midi.log.length === 0}>
          Clear
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setUi({ showMonitor: !open })}>
          {open ? 'Hide' : 'Show'}
        </button>
      </div>
      {open && (
        <div className="panel__body monitor">
          {midi.error && <div className="banner banner--error">{midi.error}</div>}
          <ul className="monitor__list">
            {midi.log.map((entry) => (
              <li key={entry.id} className={`monitor__row monitor__row--${entry.direction}`}>
                <span className="monitor__dir">{entry.direction === 'out' ? '→' : '←'}</span>
                <span className="monitor__text">{entry.text}</span>
                {entry.detail && <span className="monitor__detail">{entry.detail}</span>}
              </li>
            ))}
            {midi.log.length === 0 && <li className="hint monitor__empty">まだ送受信はありません。</li>}
          </ul>
        </div>
      )}
    </section>
  )
}
