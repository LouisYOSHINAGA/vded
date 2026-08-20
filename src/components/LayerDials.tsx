import { isPartParamAvailable, partCc } from '../midi/ccmap'
import {
  midiConfig,
  sendPart,
  setLayerParam,
  setPartParam,
  setUi,
  triggerPart,
} from '../state/actions'
import { useAppState } from '../state/store'
import type { LayerParamKey, PartParamKey } from '../state/types'
import { EG_TYPE_NAMES, MOD_TYPE_NAMES, PART_COUNT, WAVE_NAMES } from '../state/types'
import { Knob } from './Knob'

const LAYER_KNOBS: { key: Exclude<LayerParamKey, 'select'>; label: string; def: number; bipolar?: boolean }[] = [
  { key: 'level', label: 'Lvl', def: 100 },
  { key: 'pitch', label: 'Pitch', def: 64, bipolar: true },
  { key: 'egAttack', label: 'Atk', def: 0 },
  { key: 'egRelease', label: 'Rel', def: 40 },
  { key: 'modAmount', label: 'M.Amt', def: 0 },
  { key: 'modRate', label: 'M.Rate', def: 64 },
]

const PART_KNOBS: { key: PartParamKey; label: string; def: number; bipolar?: boolean }[] = [
  { key: 'send', label: 'Send', def: 0 },
  { key: 'pan', label: 'Pan', def: 64, bipolar: true },
  { key: 'bitReduction', label: 'Bit', def: 0 },
  { key: 'fold', label: 'Fold', def: 0 },
  { key: 'drive', label: 'Drive', def: 0 },
  { key: 'dryGain', label: 'Gain', def: 100 },
]

function panFormat(value: number): string {
  if (value === 64) return 'C'
  return value < 64 ? `L${64 - value}` : `R${value - 64}`
}

/**
 * The same twelve layers as the matrix, drawn as dials.
 * Numbers are precise; dials show the shape of a kit at a glance.
 */
export function LayerDials() {
  return (
    <section className="panel">
      <div className="panel__head">
        <h2 className="panel__title">All layers · dials</h2>
        <span className="hint">
          6 パート × 2 レイヤをダイヤルで一覧。数値で追うときは ALL LAYERS タブへ。
        </span>
      </div>
      <div className="panel__body dials">
        {Array.from({ length: PART_COUNT }, (_, part) => (
          <DialPart key={part} part={part} />
        ))}
      </div>
    </section>
  )
}

function DialPart({ part }: { part: number }) {
  const data = useAppState((s) => s.patch.parts[part])
  const selected = useAppState((s) => s.ui.selectedPart === part)
  const mode = useAppState((s) => s.settings.mode)
  const tint = `var(--c-part-${part + 1})`

  return (
    <article
      className={`dial-part${selected ? ' dial-part--selected' : ''}`}
      style={{ ['--tint' as string]: tint, ['--tint-ink' as string]: `var(--c-on-part-${part + 1})` }}
    >
      <header className="dial-part__head">
        <button
          type="button"
          className="dial-part__pick"
          onClick={() => setUi({ selectedPart: part })}
          title={`PART ${part + 1} を編集対象にする`}
        >
          <span className="dial-part__num">{part + 1}</span>
          <span className="dial-part__name">{data.name}</span>
        </button>
        <div className="panel__spacer" />
        <button type="button" className="micro-btn" title="試聴" onPointerDown={() => triggerPart(part)}>
          ▸
        </button>
        <button type="button" className="micro-btn" title="このパートを再送信" onClick={() => sendPart(part)}>
          ↑
        </button>
      </header>

      {[0, 1].map((layerIndex) => {
        const layer = data.layers[layerIndex]
        const accent = layerIndex === 0 ? 'var(--c-layer1)' : 'var(--c-layer2)'
        const shadowed = mode === 'single' && layerIndex === 1
        return (
          <div
            key={layerIndex}
            className={`dial-row${shadowed ? ' dial-row--shadowed' : ''}`}
            style={{
              ['--layer-accent' as string]: accent,
              ['--layer-ink' as string]: layerIndex === 0 ? 'var(--c-on-layer1)' : 'var(--c-on-layer2)',
            }}
          >
            <button
              type="button"
              className="dial-row__id"
              onClick={() => setUi({ selectedPart: part, selectedLayer: layerIndex as 0 | 1 })}
              title="PART EDIT でこのレイヤを開く"
            >
              <span className="dial-row__badge">L{layerIndex + 1}</span>
              <span className="dial-row__source">
                {WAVE_NAMES[layer.wave]}
                <em>
                  {MOD_TYPE_NAMES[layer.modType]} · {EG_TYPE_NAMES[layer.egType]}
                </em>
              </span>
            </button>
            <div className="dial-row__knobs">
              {LAYER_KNOBS.map((knob) => (
                <Knob
                  key={knob.key}
                  size="sm"
                  label={knob.label}
                  value={layer[knob.key]}
                  defaultValue={knob.def}
                  bipolar={knob.bipolar}
                  accent={accent}
                  onChange={(v) => setLayerParam(part, layerIndex as 0 | 1, knob.key, v)}
                />
              ))}
            </div>
          </div>
        )
      })}

      <div className="dial-row dial-row--part">
        <span className="dial-row__id dial-row__id--static">
          <span className="dial-row__badge dial-row__badge--part">P</span>
          <span className="dial-row__source">
            PART
            <em>レイヤ共通</em>
          </span>
        </span>
        <div className="dial-row__knobs">
          {PART_KNOBS.map((knob) => {
            const available = isPartParamAvailable(mode, knob.key)
            return (
              <Knob
                key={knob.key}
                size="sm"
                label={knob.label}
                value={data[knob.key as 'send'] as number}
                defaultValue={knob.def}
                bipolar={knob.bipolar}
                disabled={!available}
                accent={tint}
                format={knob.key === 'pan' ? panFormat : undefined}
                onChange={(v) => setPartParam(part, knob.key, v)}
                title={
                  available
                    ? `${knob.label} — CC${partCc(midiConfig(), part, knob.key) ?? '—'}`
                    : `${knob.label} は single channel mode では送信できません`
                }
              />
            )
          })}
        </div>
      </div>
    </article>
  )
}
