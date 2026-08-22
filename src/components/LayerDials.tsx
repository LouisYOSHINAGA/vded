import { useRef, useState } from 'react'
import { isPartParamAvailable, partCc } from '../midi/ccmap'
import {
  midiConfig,
  moveDialPart,
  resetDialOrder,
  sendPart,
  setLayerParam,
  setLayerSelect,
  setPartParam,
  setUi,
  toggleMute,
  toggleSolo,
  triggerPart,
} from '../state/actions'
import { useAppState } from '../state/store'
import type { LayerParamKey, PartParamKey } from '../state/types'
import { EG_TYPE_NAMES, MOD_TYPE_NAMES, WAVE_NAMES } from '../state/types'
import { useT } from '../i18n'
import type { IconName } from './Icon'
import { EG_ICONS, Icon, MOD_ICONS, WAVE_ICONS } from './Icon'
import { InfoTip } from './InfoTip'
import { Knob } from './Knob'

const LAYER_KNOBS: {
  key: Exclude<LayerParamKey, 'select'>
  label: string
  def: number
  bipolar?: boolean
}[] = [
  { key: 'level', label: 'Level', def: 100 },
  { key: 'pitch', label: 'Pitch', def: 64, bipolar: true },
  { key: 'egAttack', label: 'Attack', def: 0 },
  { key: 'egRelease', label: 'Release', def: 40 },
  { key: 'modAmount', label: 'Mod amt', def: 0 },
  { key: 'modRate', label: 'Mod rate', def: 64 },
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
  const t = useT()
  const order = useAppState((s) => s.ui.dialOrder)
  // The block being dragged, and the one it would land in front of.
  const [dragging, setDragging] = useState<number | null>(null)
  const [over, setOver] = useState<number | null>(null)
  const custom = order.some((part, i) => part !== i)

  // Dropping onto a block puts the dragged one on the side it came from: drag
  // right and it lands after the target, drag left and it lands before.
  const landing = (part: number, target: number): number | null =>
    order.indexOf(part) < order.indexOf(target) ? (order[order.indexOf(target) + 1] ?? null) : target

  const drop = () => {
    if (dragging !== null && over !== null && over !== dragging) {
      moveDialPart(dragging, landing(dragging, over))
    }
    setDragging(null)
    setOver(null)
  }

  return (
    <section className="panel">
      <div className="panel__head">
        <h2 className="panel__title">{t('dials.title')}</h2>
        <InfoTip label={t('dials.title')}>{t('dials.help')}</InfoTip>
        <div className="panel__spacer" />
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={resetDialOrder}
          disabled={!custom}
          title={t('dials.resetOrderTitle')}
        >
          <Icon name="refresh" size={15} />
          {t('dials.resetOrder')}
        </button>
      </div>
      <div
        className="panel__body dials"
        onDragOver={(e) => {
          if (dragging === null) return
          e.preventDefault()
        }}
        onDrop={drop}
      >
        {order.map((part) => (
          <DialPart
            key={part}
            part={part}
            dragging={dragging === part}
            over={over === part && dragging !== null && dragging !== part}
            overAfter={
              dragging !== null && over === part ? order.indexOf(dragging) < order.indexOf(part) : false
            }
            onDragStart={() => setDragging(part)}
            onDragEnd={() => {
              setDragging(null)
              setOver(null)
            }}
            onDragOverBlock={() => setOver(part)}
            onMove={(delta) => {
              const to = order.indexOf(part) + delta
              if (to < 0 || to >= order.length) return
              moveDialPart(part, landing(part, order[to]))
            }}
          />
        ))}
      </div>
    </section>
  )
}

function DialPart({
  part,
  dragging,
  over,
  overAfter,
  onDragStart,
  onDragEnd,
  onDragOverBlock,
  onMove,
}: {
  part: number
  dragging: boolean
  over: boolean
  overAfter: boolean
  onDragStart: () => void
  onDragEnd: () => void
  onDragOverBlock: () => void
  onMove: (delta: number) => void
}) {
  const t = useT()
  const data = useAppState((s) => s.patch.parts[part])
  const selected = useAppState((s) => s.ui.selectedPart === part)
  const mode = useAppState((s) => s.settings.mode)
  const tint = `var(--c-part-${part + 1})`
  // Only the grip starts a drag: the block is full of dials with their own
  // pointer handling. A ref, not state, because the browser decides whether a
  // drag begins in the same tick as the pointerdown — a re-render is too late.
  const fromGrip = useRef(false)

  return (
    <article
      className={`dial-part${selected ? ' dial-part--selected' : ''}${
        dragging ? ' dial-part--dragging' : ''
      }${over ? (overAfter ? ' dial-part--over-after' : ' dial-part--over-before') : ''}`}
      style={{ ['--tint' as string]: tint, ['--tint-ink' as string]: `var(--c-on-part-${part + 1})` }}
      draggable
      onDragStart={(e) => {
        if (!fromGrip.current) {
          e.preventDefault()
          return
        }
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', String(part))
        onDragStart()
      }}
      onDragEnd={() => {
        fromGrip.current = false
        onDragEnd()
      }}
      onDragOver={onDragOverBlock}
    >
      <header className="dial-part__head">
        <span
          className="dial-part__grip"
          role="button"
          tabIndex={0}
          aria-label={t('dials.reorderAria', { n: part + 1 })}
          title={t('dials.reorderTitle')}
          onPointerDown={() => {
            fromGrip.current = true
          }}
          onPointerUp={() => {
            fromGrip.current = false
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
              e.preventDefault()
              onMove(-1)
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
              e.preventDefault()
              onMove(1)
            }
          }}
        >
          <Icon name="grip" size={14} />
        </span>
        <button
          type="button"
          className="dial-part__pick"
          onClick={() => setUi({ selectedPart: part })}
          onDoubleClick={() => setUi({ selectedPart: part, editorTab: 'part' })}
          title={t('matrix.partBtnTitle', { n: part + 1 })}
        >
          <span className="dial-part__num">{part + 1}</span>
          <span className="dial-part__name">{data.name}</span>
        </button>
        <div className="panel__spacer" />
        <PartTransport part={part} />
      </header>

      {[0, 1].map((layerIndex) => {
        const layer = data.layers[layerIndex]
        const accent =
          layerIndex === 0 ? `var(--c-part-${part + 1})` : `var(--c-part-${part + 1}-2)`
        const shadowed = mode === 'single' && layerIndex === 1
        return (
          <div
            key={layerIndex}
            className={`dial-row${shadowed ? ' dial-row--shadowed' : ''}`}
            style={{
              ['--layer-accent' as string]: accent,
              ['--layer-ink' as string]:
                layerIndex === 0
                  ? `var(--c-on-part-${part + 1})`
                  : `var(--c-on-part-${part + 1}-2)`,
            }}
          >
            <div className="dial-row__id">
              <button
                type="button"
                className="dial-row__badge"
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
              <div className="dial-row__selects">
                <AxisSelect
                  names={WAVE_NAMES}
                  icons={WAVE_ICONS}
                  value={layer.wave}
                  ariaLabel={`PART ${part + 1} LAYER ${layerIndex + 1} source`}
                  onChange={(v) => setLayerSelect(part, layerIndex as 0 | 1, 'wave', v)}
                />
                <div className="dial-row__selectpair">
                  <AxisSelect
                    names={MOD_TYPE_NAMES}
                    icons={MOD_ICONS}
                    value={layer.modType}
                    ariaLabel={`PART ${part + 1} LAYER ${layerIndex + 1} mod type`}
                    onChange={(v) => setLayerSelect(part, layerIndex as 0 | 1, 'modType', v)}
                  />
                  <AxisSelect
                    names={EG_TYPE_NAMES}
                    icons={EG_ICONS}
                    value={layer.egType}
                    ariaLabel={`PART ${part + 1} LAYER ${layerIndex + 1} amp EG`}
                    onChange={(v) => setLayerSelect(part, layerIndex as 0 | 1, 'egType', v)}
                  />
                </div>
              </div>
            </div>
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
          <span className="dial-row__partlabel">{t('dials.part')}</span>
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
                    : t('matrix.unavailable', { name: knob.label })
                }
              />
            )
          })}
        </div>
      </div>
    </article>
  )
}


/** Mute / solo / audition / send, in the same order as the sequencer rail. */
function PartTransport({ part }: { part: number }) {
  const t = useT()
  const muted = useAppState((s) => s.mixer.mutes[part])
  const solo = useAppState((s) => s.mixer.solos[part])

  return (
    <div className="dial-part__transport">
      <button
        type="button"
        className={`micro-btn${muted ? ' micro-btn--mute' : ''}`}
        onClick={() => toggleMute(part)}
        title={t('seq.muteTitle')}
        aria-label={t('seq.mute')}
        aria-pressed={muted}
      >
        <Icon name="mute" />
      </button>
      <button
        type="button"
        className={`micro-btn${solo ? ' micro-btn--solo' : ''}`}
        onClick={() => toggleSolo(part)}
        title={t('seq.solo')}
        aria-label={t('seq.solo')}
        aria-pressed={solo}
      >
        <Icon name="solo" />
      </button>
      <button
        type="button"
        className="micro-btn"
        onPointerDown={() => triggerPart(part)}
        title={t('seq.triggerTitle')}
        aria-label={t('seq.trigger')}
      >
        <Icon name="trigger" />
      </button>
      <button
        type="button"
        className="micro-btn"
        onClick={() => sendPart(part)}
        title={t('part.sendPartTitle')}
        aria-label={t('part.sendPartTitle')}
      >
        <Icon name="send" />
      </button>
    </div>
  )
}

/** Compact picker showing the current shape as an icon. */
function AxisSelect({
  names,
  icons,
  value,
  ariaLabel,
  onChange,
}: {
  names: readonly string[]
  icons: IconName[]
  value: number
  ariaLabel: string
  onChange: (value: number) => void
}) {
  return (
    <span className="axis-select">
      <Icon name={icons[value]} size={16} />
      <select
        className="axis-select__native"
        value={value}
        aria-label={ariaLabel}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {names.map((name, i) => (
          <option key={name} value={i}>
            {name}
          </option>
        ))}
      </select>
    </span>
  )
}
