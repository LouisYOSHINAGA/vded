import { midiEngine } from '../midi/engine'
import { FUNC_ENTRIES, GLOBAL_SETTINGS } from '../data/funcReference'
import { useT } from '../i18n'
import {
  initPart,
  panic,
  randomizeLayer,
  randomizePattern,
  sendAll,
  setPartNote,
  setWaveGuideParam,
  triggerPart,
} from '../state/actions'
import { useAppState } from '../state/store'
import { PART_COUNT } from '../state/types'
import { Icon } from './Icon'
import { InfoTip } from './InfoTip'
import { NumberField } from './NumberField'

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function noteName(note: number): string {
  return `${NOTE_NAMES[note % 12]}${Math.floor(note / 12) - 1}`
}

/**
 * Everything the machine hides behind FUNC: what VDED can do for you, what only
 * MIDI realtime can do, and what has to be done on the panel itself.
 */
export function FuncPanel() {
  const t = useT()
  const lang = useAppState((s) => s.settings.appearance.lang)
  const selectedPart = useAppState((s) => s.ui.selectedPart)
  const selectedLayer = useAppState((s) => s.ui.selectedLayer)
  const model = useAppState((s) => s.patch.waveGuide.model)
  const notes = useAppState((s) => s.mixer.notes)
  const mode = useAppState((s) => s.settings.mode)
  const baseChannel = useAppState((s) => s.settings.baseChannel)

  return (
    <section className="panel">
      <div className="panel__head">
        <h2 className="panel__title">{t('func.title')}</h2>
        <InfoTip label={t('func.title')}>{t('func.help')}</InfoTip>
      </div>

      <div className="panel__body func">
        <div className="func__section">
          <h3 className="func__heading">{t('func.editorSection')}</h3>
          <div className="func__actions">
            <button type="button" className="btn" onClick={() => randomizeLayer(selectedPart, selectedLayer)}>
              {t('func.randomizeLayer')}
            </button>
            <button type="button" className="btn" onClick={() => randomizePattern(selectedPart)}>
              {t('func.randomizePattern')}
            </button>
            <button type="button" className="btn" onClick={() => setWaveGuideParam('wgModel', model === 1 ? 0 : 1)}>
              {t('func.toggleModel')}
            </button>
            <button type="button" className="btn" onClick={() => initPart(selectedPart)}>
              {t('func.initPart')}
            </button>
            <button type="button" className="btn btn--accent" onClick={sendAll}>
              {t('top.sendAll')}
            </button>
          </div>
          <p className="hint">
            {t('func.target', { part: selectedPart + 1, layer: selectedLayer + 1 })}
          </p>
        </div>

        <div className="func__section">
          <h3 className="func__heading">{t('func.realtimeSection')}</h3>
          <div className="func__actions">
            <button type="button" className="btn" onClick={() => midiEngine.realtime(0xfa)} title="Start (0xFA)">
              {t('func.start')}
            </button>
            <button type="button" className="btn" onClick={() => midiEngine.realtime(0xfb)} title="Continue (0xFB)">
              {t('func.continue')}
            </button>
            <button type="button" className="btn" onClick={() => midiEngine.realtime(0xfc)} title="Stop (0xFC)">
              {t('func.stop')}
            </button>
            <button type="button" className="btn btn--danger" onClick={panic}>
              {t('top.panic')}
            </button>
          </div>
          <p className="hint">{t('func.realtimeHelp')}</p>
        </div>

        <div className="func__section">
          <h3 className="func__heading">{t('func.notesSection')}</h3>
          <p className="hint">
            {t('func.notesHelp', {
              channels:
                mode === 'split'
                  ? `CH ${baseChannel}–${baseChannel + PART_COUNT - 1}`
                  : `CH ${baseChannel}`,
            })}
          </p>
          <div className="func__notes">
            {Array.from({ length: PART_COUNT }, (_, part) => (
              <label key={part} className="func__note">
                <span className="legend">Part {part + 1}</span>
                <NumberField
                  ariaLabel={t('func.noteAria', { part: part + 1 })}
                  value={notes[part]}
                  min={0}
                  max={127}
                  onChange={(note) => setPartNote(part, note)}
                />
                <span className="hint">{noteName(notes[part])}</span>
                <button
                  type="button"
                  className="micro-btn"
                  onPointerDown={() => triggerPart(part)}
                  title={t('seq.triggerTitle')}
                  aria-label={t('seq.trigger')}
                >
                  <Icon name="trigger" />
                </button>
              </label>
            ))}
          </div>
        </div>

        <div className="func__section">
          <h3 className="func__heading">{t('func.settingsSection')}</h3>
          <div className="func__settings">
            {GLOBAL_SETTINGS.map((setting) => (
              <div
                key={setting.title.en}
                className={`banner ${setting.critical ? 'banner--warn' : 'banner--info'}`}
              >
                <div>
                  <strong>{setting.title[lang]}</strong>
                  <div>{setting.body[lang]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="func__section">
          <h3 className="func__heading">{t('func.tableSection')}</h3>
          <table className="func__table">
            <thead>
              <tr>
                <th>{t('func.tableKey')}</th>
                <th>{t('func.tableFunction')}</th>
                <th>{t('func.tableMirror')}</th>
              </tr>
            </thead>
            <tbody>
              {FUNC_ENTRIES.map((entry) => (
                <tr key={entry.label}>
                  <td className="func__key">
                    {entry.step != null && <span className="func__step">{entry.step}</span>}
                    {entry.label}
                  </td>
                  <td>{entry.description[lang]}</td>
                  <td className={entry.mirrored ? 'func__mirror' : 'func__mirror func__mirror--none'}>
                    {entry.mirrored ? entry.mirrored[lang] : t('func.machineOnly')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="hint">{t('func.tableFoot')}</p>
        </div>
      </div>
    </section>
  )
}
