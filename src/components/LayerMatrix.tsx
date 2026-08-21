import type React from 'react'
import { isPartParamAvailable } from '../midi/ccmap'
import {
  sendPart,
  setLayerParam,
  setLayerSelect,
  setPartParam,
  setUi,
  triggerPart,
} from '../state/actions'
import { useAppState } from '../state/store'
import type { LayerParamKey, PartParamKey } from '../state/types'
import { EG_TYPE_NAMES, MOD_TYPE_NAMES, PART_COUNT, WAVE_NAMES } from '../state/types'
import { useT } from '../i18n'
import { Icon } from './Icon'
import { InfoTip } from './InfoTip'
import { NumCell } from './NumCell'

const layerAccent = (part: number, layer: number) =>
  layer === 0 ? `var(--c-part-${part + 1})` : `var(--c-part-${part + 1}-2)`

const LAYER_COLUMNS: { key: Exclude<LayerParamKey, 'select'>; label: string }[] = [
  { key: 'level', label: 'Lvl' },
  { key: 'pitch', label: 'Pitch' },
  { key: 'egAttack', label: 'Atk' },
  { key: 'egRelease', label: 'Rel' },
  { key: 'modAmount', label: 'M.Amt' },
  { key: 'modRate', label: 'M.Rate' },
]

const PART_COLUMNS: { key: PartParamKey; label: string }[] = [
  { key: 'send', label: 'Send' },
  { key: 'pan', label: 'Pan' },
  { key: 'bitReduction', label: 'Bit' },
  { key: 'fold', label: 'Fold' },
  { key: 'drive', label: 'Drive' },
  { key: 'dryGain', label: 'Gain' },
]

function panFormat(value: number): string {
  if (value === 64) return 'C'
  return value < 64 ? `L${64 - value}` : `R${value - 64}`
}

/**
 * Every layer of every part on one screen — the view for spotting what a kit is
 * actually doing across its twelve layers.
 */
export function LayerMatrix() {
  const t = useT()
  const mode = useAppState((s) => s.settings.mode)
  const layerLink = useAppState((s) => s.ui.layerLink)

  return (
    <section className="panel">
      <div className="panel__head">
        <h2 className="panel__title">{t('matrix.title')}</h2>
        <InfoTip label={t('matrix.title')}>{t('matrix.help')}</InfoTip>
        {layerLink && (
          <span className="tag tag--accent" title={t('matrix.linked')}>
            <Icon name="link" size={12} />
            {t('part.linked')}
          </span>
        )}
      </div>
      <div className="panel__body matrix__body">
        <table className="matrix">
          <thead>
            <tr>
              <th className="matrix__th matrix__th--part">{t('matrix.part')}</th>
              <th className="matrix__th">{t('matrix.layer')}</th>
              <th className="matrix__th matrix__th--wide">{t('part.source')}</th>
              <th className="matrix__th">Mod</th>
              <th className="matrix__th">EG</th>
              {LAYER_COLUMNS.map((column) => (
                <th key={column.key} className="matrix__th matrix__th--num">
                  {column.label}
                </th>
              ))}
              {PART_COLUMNS.map((column) => (
                <th key={column.key} className="matrix__th matrix__th--num">
                  {column.label}
                </th>
              ))}
              <th className="matrix__th" />
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: PART_COUNT }, (_, part) => (
              <MatrixPart key={part} part={part} mode={mode} linked={layerLink} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function MatrixPart({
  part,
  mode,
  linked,
}: {
  part: number
  mode: 'split' | 'single'
  linked: boolean
}) {
  const t = useT()
  const partData = useAppState((s) => s.patch.parts[part])
  const selected = useAppState((s) => s.ui.selectedPart === part)

  return (
    <>
      {[0, 1].map((layerIndex) => {
        const layer = partData.layers[layerIndex]
        const accent = layerAccent(part, layerIndex)
        const first = layerIndex === 0
        const shadowed = mode === 'single' && layerIndex === 1
        return (
          <tr
            key={layerIndex}
            className={`matrix__row${selected ? ' matrix__row--selected' : ''}${
              first ? ' matrix__row--first' : ''
            }${shadowed ? ' matrix__row--shadowed' : ''}${linked ? ' matrix__row--linked' : ''}`}
            style={
              {
                '--row-tint': `var(--c-part-${part + 1})`,
                '--row-ink': `var(--c-on-part-${part + 1})`,
              } as React.CSSProperties
            }
          >
            {first && (
              <th className="matrix__part" rowSpan={2} scope="rowgroup">
                <button type="button" className="matrix__partbtn" onClick={() => setUi({ selectedPart: part })}>
                  <span className="matrix__partnum">{part + 1}</span>
                  <span className="matrix__partname">{partData.name}</span>
                </button>
              </th>
            )}
            <td className="matrix__layer" style={{ ['--cell-accent' as string]: accent }}>
              {linked && first && (
                <span className="matrix__linkmark" title={t('matrix.linked')} aria-hidden="true" />
              )}
              <button
                type="button"
                className="matrix__layerbtn"
                onClick={() =>
                  setUi({
                    selectedPart: part,
                    selectedLayer: layerIndex as 0 | 1,
                    editorTab: 'part',
                  })
                }
                title={t('matrix.openLayer', { part: part + 1, layer: layerIndex + 1 })}
              >
                L{layerIndex + 1}
              </button>
            </td>
            <td>
              <MiniSelect
                value={layer.wave}
                names={WAVE_NAMES}
                accent={accent}
                onChange={(v) => setLayerSelect(part, layerIndex as 0 | 1, 'wave', v)}
                ariaLabel={`part ${part + 1} layer ${layerIndex + 1} source`}
              />
            </td>
            <td>
              <MiniSelect
                value={layer.modType}
                names={MOD_TYPE_NAMES}
                accent={accent}
                onChange={(v) => setLayerSelect(part, layerIndex as 0 | 1, 'modType', v)}
                ariaLabel={`part ${part + 1} layer ${layerIndex + 1} mod type`}
              />
            </td>
            <td>
              <MiniSelect
                value={layer.egType}
                names={EG_TYPE_NAMES}
                accent={accent}
                onChange={(v) => setLayerSelect(part, layerIndex as 0 | 1, 'egType', v)}
                ariaLabel={`part ${part + 1} layer ${layerIndex + 1} amp eg`}
              />
            </td>
            {LAYER_COLUMNS.map((column) => (
              <td key={column.key}>
                <NumCell
                  value={layer[column.key]}
                  accent={accent}
                  ariaLabel={`part ${part + 1} layer ${layerIndex + 1} ${column.label}`}
                  onChange={(v) => setLayerParam(part, layerIndex as 0 | 1, column.key, v)}
                />
              </td>
            ))}
            {first &&
              PART_COLUMNS.map((column) => {
                const available = isPartParamAvailable(mode, column.key)
                return (
                  <td
                    key={column.key}
                    rowSpan={2}
                    className="matrix__partcell"
                    style={{ ['--cell-accent' as string]: `var(--c-part-${part + 1})` }}
                  >
                    <NumCell
                      value={partData[column.key as 'send'] as number}
                      accent={`var(--c-part-${part + 1})`}
                      disabled={!available}
                      format={column.key === 'pan' ? panFormat : undefined}
                      ariaLabel={`part ${part + 1} ${column.label}`}
                      title={
                        available
                          ? `PART ${part + 1} ${column.label}`
                          : t('matrix.unavailable', { name: column.label })
                      }
                      onChange={(v) => setPartParam(part, column.key, v)}
                    />
                  </td>
                )
              })}
            {first && (
              <td rowSpan={2} className="matrix__tools">
                <button
                  type="button"
                  className="micro-btn"
                  title={t('seq.triggerTitle')}
                  aria-label={t('seq.trigger')}
                  onPointerDown={() => triggerPart(part)}
                >
                  <Icon name="trigger" />
                </button>
                <button
                  type="button"
                  className="micro-btn"
                  title={t('part.sendPartTitle')}
                  aria-label={t('part.sendPartTitle')}
                  onClick={() => sendPart(part)}
                >
                  <Icon name="send" />
                </button>
              </td>
            )}
          </tr>
        )
      })}
    </>
  )
}

function MiniSelect({
  value,
  names,
  accent,
  onChange,
  ariaLabel,
}: {
  value: number
  names: readonly string[]
  accent: string
  onChange: (value: number) => void
  ariaLabel: string
}) {
  return (
    <select
      className="mini-select"
      style={{ ['--cell-accent' as string]: accent } as React.CSSProperties}
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(Number(e.target.value))}
    >
      {names.map((name, i) => (
        <option key={name} value={i}>
          {name}
        </option>
      ))}
    </select>
  )
}
