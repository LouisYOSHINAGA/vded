import { midiEngine } from '../midi/engine'
import { FUNC_ENTRIES, GLOBAL_SETTINGS } from '../data/funcReference'
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
  const selectedPart = useAppState((s) => s.ui.selectedPart)
  const selectedLayer = useAppState((s) => s.ui.selectedLayer)
  const model = useAppState((s) => s.patch.waveGuide.model)
  const notes = useAppState((s) => s.mixer.notes)
  const mode = useAppState((s) => s.settings.mode)
  const baseChannel = useAppState((s) => s.settings.baseChannel)

  return (
    <section className="panel">
      <div className="panel__head">
        <h2 className="panel__title">Func</h2>
        <span className="hint">実機の FUNC ボタンで使える機能と、その VDED での代替。</span>
      </div>

      <div className="panel__body func">
        <div className="func__section">
          <h3 className="func__heading">エディタから実行</h3>
          <div className="func__actions">
            <button type="button" className="btn" onClick={() => randomizeLayer(selectedPart, selectedLayer)}>
              Randomize layer
            </button>
            <button type="button" className="btn" onClick={() => randomizePattern(selectedPart)}>
              Randomize pattern
            </button>
            <button type="button" className="btn" onClick={() => setWaveGuideParam('wgModel', model === 1 ? 0 : 1)}>
              Toggle WG model
            </button>
            <button type="button" className="btn" onClick={() => initPart(selectedPart)}>
              Init part
            </button>
            <button type="button" className="btn btn--accent" onClick={sendAll}>
              Send all parameters
            </button>
          </div>
          <p className="hint">
            対象は PART {selectedPart + 1} / LAYER {selectedLayer + 1}。パートは上のシーケンサか PART EDIT のタブで選びます。
          </p>
        </div>

        <div className="func__section">
          <h3 className="func__heading">MIDI リアルタイム</h3>
          <div className="func__actions">
            <button type="button" className="btn" onClick={() => midiEngine.realtime(0xfa)} title="Start (0xFA)">
              Start
            </button>
            <button type="button" className="btn" onClick={() => midiEngine.realtime(0xfb)} title="Continue (0xFB)">
              Continue
            </button>
            <button type="button" className="btn" onClick={() => midiEngine.realtime(0xfc)} title="Stop (0xFC)">
              Stop
            </button>
            <button type="button" className="btn btn--danger" onClick={panic}>
              Panic
            </button>
          </div>
          <p className="hint">
            実機の MIDI Clock src が Auto のときのみ有効です。VDED 内蔵シーケンサと同期させるなら、
            シーケンサの MIDI CLOCK を ON にしてください。
          </p>
        </div>

        <div className="func__section">
          <h3 className="func__heading">パートのトリガーノート</h3>
          <p className="hint">
            volca drum はノートナンバーで音色を選びません。どのパートが鳴るかは MIDI チャンネルで決まります
            （現在: {mode === 'split' ? `CH ${baseChannel}–${baseChannel + PART_COUNT - 1}` : `CH ${baseChannel} 共通`}）。
            外部シーケンサに合わせたいときだけ変更してください。
          </p>
          <div className="func__notes">
            {Array.from({ length: PART_COUNT }, (_, part) => (
              <label key={part} className="func__note">
                <span className="legend">Part {part + 1}</span>
                <NumberField
                  ariaLabel={`PART ${part + 1} トリガーノート番号`}
                  value={notes[part]}
                  min={0}
                  max={127}
                  onChange={(note) => setPartNote(part, note)}
                />
                <span className="hint">{noteName(notes[part])}</span>
                <button type="button" className="micro-btn" onPointerDown={() => triggerPart(part)} title="試聴">
                  ▸
                </button>
              </label>
            ))}
          </div>
        </div>

        <div className="func__section">
          <h3 className="func__heading">実機側で設定が必要な項目</h3>
          <div className="func__settings">
            {GLOBAL_SETTINGS.map((setting) => (
              <div key={setting.title} className={`banner ${setting.critical ? 'banner--warn' : 'banner--info'}`}>
                <div>
                  <strong>{setting.title}</strong>
                  <div>{setting.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="func__section">
          <h3 className="func__heading">FUNC ショートカット早見表</h3>
          <table className="func__table">
            <thead>
              <tr>
                <th>FUNC +</th>
                <th>機能</th>
                <th>VDED での代替</th>
              </tr>
            </thead>
            <tbody>
              {FUNC_ENTRIES.map((entry) => (
                <tr key={entry.label}>
                  <td className="func__key">
                    {entry.step != null && <span className="func__step">{entry.step}</span>}
                    {entry.label}
                  </td>
                  <td>{entry.description}</td>
                  <td className={entry.mirrored ? 'func__mirror' : 'func__mirror func__mirror--none'}>
                    {entry.mirrored ?? '実機のみ'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="hint">
            SysEx とプログラムチェンジに非対応のため、実機メモリの保存／呼び出しとモーションシーケンスは
            MIDI から操作できません。キットの管理は右側の <strong>PRESETS</strong> パネルで行ってください。
          </p>
        </div>
      </div>
    </section>
  )
}
