import type React from 'react'
import { isPartParamAvailable, layerCc, partCc } from '../midi/ccmap'
import { useT } from '../i18n'
import {
  copyPart,
  initPart,
  midiConfig,
  randomizeLayer,
  resolveTarget,
  sendPart,
  setLayerParam,
  setLayerSelect,
  setPartName,
  setPartParam,
  setUi,
  triggerPart,
} from '../state/actions'
import { store, useAppState } from '../state/store'
import type { Layer, LayerParamKey, PartParamKey } from '../state/types'
import { EG_TYPE_NAMES, MOD_TYPE_NAMES, PART_COUNT, WAVE_NAMES } from '../state/types'
import { InfoTip } from './InfoTip'
import type { IconName } from './Icon'
import { EG_ICONS, Icon, MOD_ICONS, WAVE_ICONS } from './Icon'
import { Knob } from './Knob'
import { Segmented } from './Segmented'

/** Layer 1 is the part's colour; layer 2 is its muted sibling. */
const layerAccent = (part: number, layer: number) =>
  layer === 0 ? `var(--c-part-${part + 1})` : `var(--c-part-${part + 1}-2)`
const layerInk = (part: number, layer: number) =>
  layer === 0 ? `var(--c-on-part-${part + 1})` : `var(--c-on-part-${part + 1}-2)`

function panFormat(value: number): string {
  if (value === 64) return 'CTR'
  return value < 64 ? `L${64 - value}` : `R${value - 64}`
}

const KNOBS: {
  key: Exclude<LayerParamKey, 'select'>
  label: string
  bipolar?: boolean
  defaultValue: number
}[] = [
  { key: 'level', label: 'Level', defaultValue: 100 },
  { key: 'pitch', label: 'Pitch', defaultValue: 64, bipolar: true },
  { key: 'egAttack', label: 'EG Attack', defaultValue: 0 },
  { key: 'egRelease', label: 'EG Release', defaultValue: 40 },
  { key: 'modAmount', label: 'Mod Amount', defaultValue: 0 },
  { key: 'modRate', label: 'Mod Rate', defaultValue: 64 },
]

export function PartEditor() {
  const t = useT()
  const partIndex = useAppState((s) => s.ui.selectedPart)
  const part = useAppState((s) => s.patch.parts[s.ui.selectedPart])
  const layerLink = useAppState((s) => s.ui.layerLink)
  const mode = useAppState((s) => s.settings.mode)
  const singleMode = mode === 'single'

  return (
    <section className="panel part-editor">
      <div className="panel__head">
        <h2 className="panel__title">{t('part.title')}</h2>
        {singleMode && (
          <span className="tag tag--warn">
            {t('part.singleChip')}
            <InfoTip label={t('part.singleChip')}>{t('part.singleHelp')}</InfoTip>
          </span>
        )}
        <div className="part-tabs">
          {Array.from({ length: PART_COUNT }, (_, i) => (
            <button
              key={i}
              type="button"
              className="part-tabs__item"
              style={
                {
                  '--tint': `var(--c-part-${i + 1})`,
                  '--tint-ink': `var(--c-on-part-${i + 1})`,
                } as React.CSSProperties
              }
              aria-pressed={i === partIndex}
              onClick={() => setUi({ selectedPart: i })}
              onDoubleClick={() => triggerPart(i)}
              title={t('seq.selectPart', { n: i + 1 })}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <input
          className="text-input part-editor__name"
          value={part.name}
          maxLength={14}
          onChange={(e) => setPartName(partIndex, e.target.value)}
          aria-label={t('part.nameAria')}
          title={t('part.nameTitle')}
        />
        <div className="panel__spacer" />
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => initPart(partIndex)}
          title={t('part.initTitle')}
        >
          {t('part.init')}
        </button>
        <select
          className="select btn--sm part-editor__copy"
          value=""
          onChange={(e) => {
            const to = Number(e.target.value)
            if (!Number.isNaN(to)) copyPart(partIndex, to)
            e.currentTarget.value = ''
          }}
          title={t('part.copyTitle')}
        >
          <option value="">{t('part.copyTo')}</option>
          {Array.from({ length: PART_COUNT }, (_, i) => i)
            .filter((i) => i !== partIndex)
            .map((i) => (
              <option key={i} value={i}>
                PART {i + 1}
              </option>
            ))}
        </select>
        <button
          type="button"
          className="btn btn--sm"
          onClick={() => sendPart(partIndex)}
          title={t('part.sendPartTitle')}
        >
          <Icon name="send" size={14} />
          {t('part.sendPart')}
        </button>
      </div>

      <div className="panel__body part-editor__body">
        <div
          className={`layer-grid${layerLink ? ' layer-grid--linked' : ''}`}
          style={
            {
              '--tint': `var(--c-part-${partIndex + 1})`,
              '--tint-ink': `var(--c-on-part-${partIndex + 1})`,
            } as React.CSSProperties
          }
        >
          <LayerPanel partIndex={partIndex} layerIndex={0} />
          {/* The link control lives between the two panels it joins, and is
              always present, so turning it on never reflows the layout. */}
          <div className="layer-link">
            <button
              type="button"
              className="layer-link__chip"
              aria-pressed={layerLink}
              disabled={singleMode}
              onClick={() => setUi({ layerLink: !layerLink })}
              title={singleMode ? t('part.linkSingleTitle') : t('part.linkTitle')}
            >
              <Icon name="link" size={15} />
              {t('part.link')}
            </button>
          </div>
          <LayerPanel partIndex={partIndex} layerIndex={1} />
        </div>

        <PartProcessing partIndex={partIndex} />
      </div>
    </section>
  )
}

function LayerPanel({ partIndex, layerIndex }: { partIndex: number; layerIndex: 0 | 1 }) {
  const t = useT()
  const layer = useAppState((s) => s.patch.parts[partIndex].layers[layerIndex])
  const selectedLayer = useAppState((s) => s.ui.selectedLayer)
  const mode = useAppState((s) => s.settings.mode)
  const accent = layerAccent(partIndex, layerIndex)
  const shadowed = mode === 'single' && layerIndex === 1
  const target = resolveTarget(store.get(), layerIndex)

  return (
    <div
      className={`layer-panel${shadowed ? ' layer-panel--shadowed' : ''}${
        selectedLayer === layerIndex ? ' layer-panel--active' : ''
      }`}
      style={{
        ['--layer-accent' as string]: accent,
        ['--layer-ink' as string]: layerInk(partIndex, layerIndex),
      }}
    >
      <header className="layer-panel__head">
        <span className="layer-panel__pick">
          <span className="layer-panel__badge">L{layerIndex + 1}</span>
          <span className="layer-panel__title">{t('part.layer', { n: layerIndex + 1 })}</span>
        </span>
        {shadowed && <span className="tag tag--warn">{t('part.notSent')}</span>}
        <div className="panel__spacer" />
        <button
          type="button"
          className="micro-btn"
          title={t('part.randomizeLayer')}
          aria-label={t('part.randomizeLayer')}
          onClick={() => randomizeLayer(partIndex, layerIndex)}
        >
          <Icon name="random" />
        </button>
      </header>

      <div className="layer-panel__select">
        <SelectAxis
          label={t('part.source')}
          names={WAVE_NAMES}
          icons={WAVE_ICONS}
          value={layer.wave}
          accent={accent}
          onChange={(v) => setLayerSelect(partIndex, layerIndex, 'wave', v)}
        />
        <SelectAxis
          label={t('part.modType')}
          names={MOD_TYPE_NAMES}
          icons={MOD_ICONS}
          value={layer.modType}
          accent={accent}
          onChange={(v) => setLayerSelect(partIndex, layerIndex, 'modType', v)}
        />
        <SelectAxis
          label={t('part.ampEg')}
          names={EG_TYPE_NAMES}
          icons={EG_ICONS}
          value={layer.egType}
          accent={accent}
          onChange={(v) => setLayerSelect(partIndex, layerIndex, 'egType', v)}
        />
      </div>

      <div className="layer-panel__knobs">
        {KNOBS.map((knob) => (
          <Knob
            key={knob.key}
            label={knob.label}
            value={layer[knob.key as keyof Layer] as number}
            defaultValue={knob.defaultValue}
            bipolar={knob.bipolar}
            accent={accent}
            onChange={(v) => setLayerParam(partIndex, layerIndex, knob.key, v)}
            title={`${knob.label} — CC${layerCc(midiConfig(), partIndex, target, knob.key) ?? '—'}`}
          />
        ))}
      </div>
    </div>
  )
}

function SelectAxis({
  label,
  names,
  icons,
  value,
  accent,
  onChange,
}: {
  label: string
  names: readonly string[]
  icons: IconName[]
  value: number
  accent: string
  onChange: (value: number) => void
}) {
  return (
    <div className="select-axis">
      <span className="legend">{label}</span>
      <Segmented
        ariaLabel={label}
        accent={accent}
        className="segmented--icons"
        options={names.map((name, i) => ({ value: i, label: name, icon: icons[i] }))}
        value={value}
        onChange={onChange}
      />
    </div>
  )
}

const PROCESSING: { key: PartParamKey; label: string; defaultValue: number; bipolar?: boolean }[] = [
  { key: 'send', label: 'WG Send', defaultValue: 0 },
  { key: 'pan', label: 'Pan', defaultValue: 64, bipolar: true },
  { key: 'bitReduction', label: 'Bit Red', defaultValue: 0 },
  { key: 'fold', label: 'Fold', defaultValue: 0 },
  { key: 'drive', label: 'Drive', defaultValue: 0 },
  { key: 'dryGain', label: 'Dry Gain', defaultValue: 100 },
]

function PartProcessing({ partIndex }: { partIndex: number }) {
  const t = useT()
  const part = useAppState((s) => s.patch.parts[partIndex])
  const mode = useAppState((s) => s.settings.mode)
  const sendQuant = useAppState((s) => s.settings.sendPitchModQuantize)

  return (
    <div className="processing">
      <header className="processing__head">
        <span className="legend">
          {t('part.processing')}
          <InfoTip label={t('part.processing')}>{t('part.processingHelp')}</InfoTip>
        </span>
      </header>
      <div className="processing__knobs">
        {PROCESSING.map((item) => {
          const available = isPartParamAvailable(mode, item.key)
          return (
            <Knob
              key={item.key}
              label={item.label}
              value={part[item.key as 'send'] as number}
              defaultValue={item.defaultValue}
              bipolar={item.bipolar}
              disabled={!available}
              format={item.key === 'pan' ? panFormat : undefined}
              onChange={(v) => setPartParam(partIndex, item.key, v)}
              title={
                available
                  ? `${item.label} — CC${partCc(midiConfig(), partIndex, item.key) ?? '—'}`
                  : t('matrix.unavailable', { name: item.label })
              }
            />
          )
        })}
        <label
          className="checkbox processing__quant"
          title={sendQuant ? t('part.quantTitle') : t('part.quantOffTitle')}
        >
          <input
            type="checkbox"
            checked={part.pitchModQuantize}
            disabled={!isPartParamAvailable(mode, 'pitchModQuantize') || !sendQuant}
            onChange={(e) => setPartParam(partIndex, 'pitchModQuantize', e.target.checked)}
          />
          <span className="legend">Pitch mod quant</span>
        </label>
      </div>
    </div>
  )
}
