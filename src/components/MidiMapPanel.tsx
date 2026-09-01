import { DEFAULT_CC_TABLE, cloneCcTable, type CcTable } from '../midi/ccmap'
import { useT } from '../i18n'
import { setSettings } from '../state/actions'
import { store, toast, useAppState } from '../state/store'
import type { LayerParamKey, PartParamKey } from '../state/types'
import { LAYER_PARAM_LABELS, PART_PARAM_LABELS, PART_COUNT } from '../state/types'
import { InfoTip } from './InfoTip'
import { NumberField } from './NumberField'

const SPLIT_LAYER_ROWS: LayerParamKey[] = [
  'select',
  'level',
  'egAttack',
  'egRelease',
  'pitch',
  'modAmount',
  'modRate',
]

const SPLIT_PART_ROWS: PartParamKey[] = [
  'bitReduction',
  'fold',
  'drive',
  'dryGain',
  'pan',
  'send',
  'pitchModQuantize',
]

const SINGLE_LAYER_ROWS: LayerParamKey[] = [
  'select',
  'level',
  'modAmount',
  'modRate',
  'pitch',
  'egAttack',
  'egRelease',
]

function editTable(mutate: (table: CcTable) => void): void {
  const next = cloneCcTable(store.get().settings.ccTable)
  mutate(next)
  setSettings({ ccTable: next })
}

function CcInput({
  value,
  onChange,
  ariaLabel,
  isDefault,
}: {
  value: number
  onChange: (value: number) => void
  ariaLabel: string
  isDefault: boolean
}) {
  return (
    <NumberField
      className={`ccmap__input${isDefault ? '' : ' ccmap__input--changed'}`}
      value={value}
      min={0}
      max={127}
      chars={3}
      ariaLabel={ariaLabel}
      onChange={onChange}
    />
  )
}

/**
 * The CC table is editable because the official split-channel chart is not
 * distributed in a machine-readable form: if a number here disagrees with your
 * unit, fix it in place rather than waiting for a new build.
 */
export function MidiMapPanel() {
  const t = useT()
  const mode = useAppState((s) => s.settings.mode)
  const table = useAppState((s) => s.settings.ccTable)
  const liveSend = useAppState((s) => s.settings.liveSend)
  const ccInterval = useAppState((s) => s.settings.ccIntervalMs)
  const dumpInterval = useAppState((s) => s.settings.dumpIntervalMs)
  const baseChannel = useAppState((s) => s.settings.baseChannel)
  const channelRange = `${baseChannel}–${baseChannel + PART_COUNT - 1}`

  return (
    <section className="panel">
      <div className="panel__head">
        <h2 className="panel__title">{t('map.title')}</h2>
        <span className="tag">{mode === 'split' ? t('map.splitTag') : t('map.singleTag')}</span>
        <InfoTip label={t('map.modeHelpTitle')}>
          {t('map.modeHelp', { from: baseChannel, to: baseChannel + PART_COUNT - 1 })}
        </InfoTip>
        <div className="panel__spacer" />
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => {
            setSettings({ ccTable: cloneCcTable(DEFAULT_CC_TABLE) })
            toast(t('map.resetDone'))
          }}
        >
          {t('map.reset')}
        </button>
      </div>

      <div className="panel__body ccmap">
        <div className="ccmap__options">
          <label className="checkbox">
            <input type="checkbox" checked={liveSend} onChange={(e) => setSettings({ liveSend: e.target.checked })} />
            <span className="legend">{t('map.liveSend')}</span>
          </label>
          <label className="row" style={{ gap: 5 }} title={t('map.ccIntervalTitle')}>
            <span className="legend">{t('map.ccInterval')}</span>
            <NumberField
              ariaLabel={t('map.ccInterval')}
              value={ccInterval}
              min={0}
              max={20}
              step={0.2}
              precision={1}
              onChange={(ccIntervalMs) => setSettings({ ccIntervalMs })}
            />
            <span className="hint">ms</span>
          </label>
          <label className="row" style={{ gap: 5 }} title={t('map.dumpIntervalTitle')}>
            <span className="legend">{t('map.dumpInterval')}</span>
            <NumberField
              ariaLabel={t('map.dumpInterval')}
              value={dumpInterval}
              min={0}
              max={40}
              step={0.5}
              precision={1}
              onChange={(dumpIntervalMs) => setSettings({ dumpIntervalMs })}
            />
            <span className="hint">ms</span>
          </label>
        </div>

        {mode === 'split' ? (
          <>
                <h3 className="func__heading">{t('map.layerParams', { range: channelRange })}</h3>
            <table className="ccmap__table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Layer 1</th>
                  <th>Layer 2</th>
                  <th>Layer 1+2</th>
                </tr>
              </thead>
              <tbody>
                {SPLIT_LAYER_ROWS.map((key) => (
                  <tr key={key}>
                    <td className="ccmap__name">{LAYER_PARAM_LABELS[key]}</td>
                    {[0, 1, 2].map((slot) => (
                      <td key={slot}>
                        <CcInput
                          value={table.split.layer[key][slot]}
                          isDefault={table.split.layer[key][slot] === DEFAULT_CC_TABLE.split.layer[key][slot]}
                          ariaLabel={`${LAYER_PARAM_LABELS[key]} layer slot ${slot + 1} CC`}
                          onChange={(v) =>
                            editTable((next) => {
                              next.split.layer[key][slot] = v
                            })
                          }
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 className="func__heading">{t('map.partParams')}</h3>
            <table className="ccmap__table ccmap__table--narrow">
              <tbody>
                {SPLIT_PART_ROWS.map((key) => (
                  <tr key={key}>
                    <td className="ccmap__name">{PART_PARAM_LABELS[key]}</td>
                    <td>
                      <CcInput
                        value={table.split.part[key]}
                        isDefault={table.split.part[key] === DEFAULT_CC_TABLE.split.part[key]}
                        ariaLabel={`${PART_PARAM_LABELS[key]} CC`}
                        onChange={(v) =>
                          editTable((next) => {
                            next.split.part[key] = v
                          })
                        }
                      />
                    </td>
                    <td className="hint">
                      {key === 'pitchModQuantize' ? t('map.quantNote') : t('map.sharedNote')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <>
            <h3 className="func__heading">{t('map.perPart')}</h3>
            <table className="ccmap__table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  {Array.from({ length: PART_COUNT }, (_, i) => (
                    <th key={i}>P{i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SINGLE_LAYER_ROWS.map((key) => (
                  <tr key={key}>
                    <td className="ccmap__name">{LAYER_PARAM_LABELS[key]} 1-2</td>
                    {Array.from({ length: PART_COUNT }, (_, part) => (
                      <td key={part}>
                        <CcInput
                          value={table.single.layer[part][key]}
                          isDefault={table.single.layer[part][key] === DEFAULT_CC_TABLE.single.layer[part][key]}
                          ariaLabel={`part ${part + 1} ${LAYER_PARAM_LABELS[key]} CC`}
                          onChange={(v) =>
                            editTable((next) => {
                              next.single.layer[part][key] = v
                            })
                          }
                        />
                      </td>
                    ))}
                  </tr>
                ))}
                {(['send', 'pan'] as const).map((key) => (
                  <tr key={key}>
                    <td className="ccmap__name">{PART_PARAM_LABELS[key]}</td>
                    {Array.from({ length: PART_COUNT }, (_, part) => (
                      <td key={part}>
                        <CcInput
                          value={table.single.part[part][key]}
                          isDefault={table.single.part[part][key] === DEFAULT_CC_TABLE.single.part[part][key]}
                          ariaLabel={`part ${part + 1} ${PART_PARAM_LABELS[key]} CC`}
                          onChange={(v) =>
                            editTable((next) => {
                              next.single.part[part][key] = v
                            })
                          }
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

          </>
        )}

        <h3 className="func__heading">{t('map.global')}</h3>
        <table className="ccmap__table ccmap__table--narrow">
          <tbody>
            {(['wgModel', 'wgDecay', 'wgBody', 'wgTune'] as const).map((key) => (
              <tr key={key}>
                <td className="ccmap__name">{key.replace('wg', '').toUpperCase()}</td>
                <td>
                  <CcInput
                    value={table.global[key]}
                    isDefault={table.global[key] === DEFAULT_CC_TABLE.global[key]}
                    ariaLabel={`${key} CC`}
                    onChange={(v) =>
                      editTable((next) => {
                        next.global[key] = v
                      })
                    }
                  />
                </td>
                <td className="hint">{key === 'wgModel' ? t('map.modelNote') : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>
    </section>
  )
}
