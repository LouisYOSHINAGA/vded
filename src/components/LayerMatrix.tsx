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
import { NumCell } from './NumCell'

const LAYER_ACCENT = ['var(--c-layer1)', 'var(--c-layer2)'] as const

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
  const mode = useAppState((s) => s.settings.mode)

  return (
    <section className="panel">
      <div className="panel__head">
        <h2 className="panel__title">All layers</h2>
        <span className="hint">
          6 パート × 2 レイヤをまとめて表示。セルは上下ドラッグ、ダブルクリックで直接入力。
        </span>
      </div>
      <div className="panel__body matrix__body">
        <table className="matrix">
          <thead>
            <tr>
              <th className="matrix__th matrix__th--part">Part</th>
              <th className="matrix__th">Layer</th>
              <th className="matrix__th matrix__th--wide">Source</th>
              <th className="matrix__th">Mod</th>
              <th className="matrix__th">EG</th>
              {LAYER_COLUMNS.map((column) => (
                <th key={column.key} className="matrix__th matrix__th--num">
                  {column.label}
                </th>
              ))}
              {PART_COLUMNS.map((column) => (
                <th key={column.key} className="matrix__th matrix__th--num matrix__th--part-col">
                  {column.label}
                </th>
              ))}
              <th className="matrix__th" />
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: PART_COUNT }, (_, part) => (
              <MatrixPart key={part} part={part} mode={mode} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function MatrixPart({ part, mode }: { part: number; mode: 'split' | 'single' }) {
  const partData = useAppState((s) => s.patch.parts[part])
  const selected = useAppState((s) => s.ui.selectedPart === part)

  return (
    <>
      {[0, 1].map((layerIndex) => {
        const layer = partData.layers[layerIndex]
        const accent = LAYER_ACCENT[layerIndex]
        const first = layerIndex === 0
        const shadowed = mode === 'single' && layerIndex === 1
        return (
          <tr
            key={layerIndex}
            className={`matrix__row${selected ? ' matrix__row--selected' : ''}${
              first ? ' matrix__row--first' : ''
            }${shadowed ? ' matrix__row--shadowed' : ''}`}
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
              <button
                type="button"
                className="matrix__layerbtn"
                onClick={() => setUi({ selectedPart: part, selectedLayer: layerIndex as 0 | 1 })}
                title={`PART ${part + 1} LAYER ${layerIndex + 1} を編集`}
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
                  <td key={column.key} rowSpan={2} className="matrix__partcell">
                    <NumCell
                      value={partData[column.key as 'send'] as number}
                      disabled={!available}
                      format={column.key === 'pan' ? panFormat : undefined}
                      ariaLabel={`part ${part + 1} ${column.label}`}
                      title={
                        available
                          ? `PART ${part + 1} ${column.label}`
                          : `${column.label} は single channel mode では送信できません`
                      }
                      onChange={(v) => setPartParam(part, column.key, v)}
                    />
                  </td>
                )
              })}
            {first && (
              <td rowSpan={2} className="matrix__tools">
                <button type="button" className="micro-btn" title="試聴" onPointerDown={() => triggerPart(part)}>
                  ▸
                </button>
                <button type="button" className="micro-btn" title="このパートを再送信" onClick={() => sendPart(part)}>
                  ↑
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
