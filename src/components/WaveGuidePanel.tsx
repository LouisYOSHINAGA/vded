import { sendWaveGuide, setWaveGuideParam } from '../state/actions'
import { useAppState } from '../state/store'
import { Knob } from './Knob'
import { Segmented } from './Segmented'

/** The shared resonator. One instance for the whole machine, not per part. */
export function WaveGuidePanel() {
  const wg = useAppState((s) => s.patch.waveGuide)

  return (
    <section className="panel">
      <div className="panel__head">
        <h2 className="panel__title">Wave guide</h2>
        <span className="tag">Global</span>
        <div className="panel__spacer" />
        <button type="button" className="btn btn--ghost btn--sm" onClick={sendWaveGuide} title="この 4 パラメータを再送信">
          Send
        </button>
      </div>
      <div className="panel__body waveguide">
        <div className="waveguide__model">
          <span className="legend">Model</span>
          <Segmented
            ariaLabel="ウェーブガイド モデル"
            options={[
              { value: 0, label: 'Tube', title: '筒・胴のような共鳴' },
              { value: 1, label: 'String', title: '弦の金属的な共鳴' },
            ]}
            value={wg.model}
            onChange={(v) => setWaveGuideParam('wgModel', v)}
          />
        </div>
        <div className="waveguide__knobs">
          <Knob label="Decay" value={wg.decay} defaultValue={64} onChange={(v) => setWaveGuideParam('wgDecay', v)} />
          <Knob label="Body" value={wg.body} defaultValue={64} onChange={(v) => setWaveGuideParam('wgBody', v)} />
          <Knob label="Tune" value={wg.tune} defaultValue={64} onChange={(v) => setWaveGuideParam('wgTune', v)} />
        </div>
        <p className="hint">
          各パートの <strong>WG SEND</strong> で送り量を決めます。共鳴器そのものは全パート共通です。
        </p>
      </div>
    </section>
  )
}
