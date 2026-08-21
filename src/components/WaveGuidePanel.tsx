import { useT } from '../i18n'
import { sendWaveGuide, setWaveGuideParam } from '../state/actions'
import { useAppState } from '../state/store'
import { Icon } from './Icon'
import { InfoTip } from './InfoTip'
import { Knob } from './Knob'
import { Segmented } from './Segmented'

/** The shared resonator. One instance for the whole machine, not per part. */
export function WaveGuidePanel() {
  const t = useT()
  const wg = useAppState((s) => s.patch.waveGuide)

  return (
    <section className="panel">
      <div className="panel__head">
        <h2 className="panel__title">{t('wg.title')}</h2>
        <InfoTip label={t('wg.title')}>{t('wg.help')}</InfoTip>
        <div className="panel__spacer" />
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={sendWaveGuide}
          title={t('wg.sendTitle')}
        >
          <Icon name="send" size={14} />
          {t('wg.send')}
        </button>
      </div>
      <div className="panel__body waveguide">
        <div className="waveguide__model">
          <span className="legend">{t('wg.model')}</span>
          <Segmented
            ariaLabel={t('wg.modelAria')}
            options={[
              { value: 0, label: t('wg.tube'), title: t('wg.tubeTitle') },
              { value: 1, label: t('wg.string'), title: t('wg.stringTitle') },
            ]}
            value={wg.model}
            onChange={(v) => setWaveGuideParam('wgModel', v)}
          />
        </div>
        <div className="waveguide__knobs">
          <Knob
            label="Decay"
            value={wg.decay}
            defaultValue={64}
            onChange={(v) => setWaveGuideParam('wgDecay', v)}
          />
          <Knob
            label="Body"
            value={wg.body}
            defaultValue={64}
            onChange={(v) => setWaveGuideParam('wgBody', v)}
          />
          <Knob
            label="Tune"
            value={wg.tune}
            defaultValue={64}
            onChange={(v) => setWaveGuideParam('wgTune', v)}
          />
        </div>
      </div>
    </section>
  )
}
