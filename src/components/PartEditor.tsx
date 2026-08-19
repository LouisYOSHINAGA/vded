import {
  encodeSelectFromLayer,
  isPartParamAvailable,
  layerCc,
  partCc,
} from '../midi/ccmap'
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
import { Knob } from './Knob'
import { Segmented } from './Segmented'

const LAYER_ACCENT = ['var(--c-layer1)', 'var(--c-layer2)'] as const

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
  const partIndex = useAppState((s) => s.ui.selectedPart)
  const part = useAppState((s) => s.patch.parts[s.ui.selectedPart])
  const layerLink = useAppState((s) => s.ui.layerLink)
  const mode = useAppState((s) => s.settings.mode)
  const singleMode = mode === 'single'

  return (
    <section className="panel part-editor">
      <div className="panel__head">
        <h2 className="panel__title">Part Edit</h2>
        <div className="part-tabs">
          {Array.from({ length: PART_COUNT }, (_, i) => (
            <button
              key={i}
              type="button"
              className="part-tabs__item"
              aria-pressed={i === partIndex}
              onClick={() => setUi({ selectedPart: i })}
              onDoubleClick={() => triggerPart(i)}
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
          aria-label="パート名"
          title="パート名（エディタ内のラベル。実機には送信されません）"
        />
        <div className="panel__spacer" />
        <button
          type="button"
          className={`btn btn--sm${layerLink ? ' btn--on' : ' btn--ghost'}`}
          disabled={singleMode}
          onClick={() => setUi({ layerLink: !layerLink })}
          title={
            singleMode
              ? 'single channel mode では 1 つの CC が両レイヤに効くため、常にリンク状態です'
              : 'レイヤ 1 と 2 を同時に編集し、L1+2 の CC 1 通で送信します'
          }
        >
          Link L1+2
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => initPart(partIndex)} title="このパートを初期化">
          Init
        </button>
        <select
          className="select btn--sm part-editor__copy"
          value=""
          onChange={(e) => {
            const to = Number(e.target.value)
            if (!Number.isNaN(to)) copyPart(partIndex, to)
            e.currentTarget.value = ''
          }}
          title="このパートの音色・パターンを別のパートへコピー（FUNC+7 相当）"
        >
          <option value="">Copy to…</option>
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
          title="このパートのパラメータだけを実機に再送信"
        >
          Send part
        </button>
      </div>

      <div className="panel__body part-editor__body">
        {singleMode && (
          <div className="banner banner--warn">
            <strong>SINGLE CHANNEL MODE</strong>
            <span>
              1 つの CC がレイヤ 1 / 2 の両方に効くため、レイヤ別の値を実機へ送ることはできません。
              画面上ではレイヤ 2 も編集できますが、送信されるのはレイヤ 1 の値です。
              BIT / FOLD / DRIVE / DRY GAIN も single では制御できません。
            </span>
          </div>
        )}

        <div className="layer-grid">
          {[0, 1].map((index) => (
            <LayerPanel key={index} partIndex={partIndex} layerIndex={index as 0 | 1} />
          ))}
        </div>

        <PartProcessing partIndex={partIndex} />
      </div>
    </section>
  )
}

function LayerPanel({ partIndex, layerIndex }: { partIndex: number; layerIndex: 0 | 1 }) {
  const layer = useAppState((s) => s.patch.parts[partIndex].layers[layerIndex])
  const layerLink = useAppState((s) => s.ui.layerLink)
  const mode = useAppState((s) => s.settings.mode)
  const accent = LAYER_ACCENT[layerIndex]
  const shadowed = mode === 'single' && layerIndex === 1
  const target = resolveTarget(store.get(), layerIndex)
  const selectValue = encodeSelectFromLayer(layer)
  const selectCc = layerCc(midiConfig(), partIndex, target, 'select')

  return (
    <div
      className={`layer-panel${shadowed ? ' layer-panel--shadowed' : ''}`}
      style={{ ['--layer-accent' as string]: accent }}
    >
      <header className="layer-panel__head">
        <span className="layer-panel__badge">L{layerIndex + 1}</span>
        <span className="layer-panel__title">Layer {layerIndex + 1}</span>
        {layerLink && <span className="tag tag--accent">Linked</span>}
        {shadowed && <span className="tag tag--warn">送信されません</span>}
        <div className="panel__spacer" />
        <button
          type="button"
          className="micro-btn"
          title="このレイヤをランダマイズ（FUNC+9 相当）"
          onClick={() => randomizeLayer(partIndex, layerIndex)}
        >
          ⚄
        </button>
      </header>

      <div className="layer-panel__select">
        <SelectAxis
          label="Source"
          names={WAVE_NAMES}
          value={layer.wave}
          accent={accent}
          onChange={(v) => setLayerSelect(partIndex, layerIndex, 'wave', v)}
        />
        <SelectAxis
          label="Mod type"
          names={MOD_TYPE_NAMES}
          value={layer.modType}
          accent={accent}
          onChange={(v) => setLayerSelect(partIndex, layerIndex, 'modType', v)}
        />
        <SelectAxis
          label="Amp EG"
          names={EG_TYPE_NAMES}
          value={layer.egType}
          accent={accent}
          onChange={(v) => setLayerSelect(partIndex, layerIndex, 'egType', v)}
        />
        <p className="layer-panel__selecthint hint">
          SELECT = CC{selectCc ?? '—'} → <span className="value-readout">{selectValue}</span>
          <span className="layer-panel__combo">
            {WAVE_NAMES[layer.wave]} · {MOD_TYPE_NAMES[layer.modType]} · {EG_TYPE_NAMES[layer.egType]}
          </span>
        </p>
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
  value,
  accent,
  onChange,
}: {
  label: string
  names: readonly string[]
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
        options={names.map((name, i) => ({ value: i, label: name }))}
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
  const part = useAppState((s) => s.patch.parts[partIndex])
  const mode = useAppState((s) => s.settings.mode)
  const sendQuant = useAppState((s) => s.settings.sendPitchModQuantize)

  return (
    <div className="processing">
      <header className="processing__head">
        <span className="legend">Part processing</span>
        <span className="hint">
          レイヤ 1 / 2 共通。実機では EDIT ページの隠しパラメータです。
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
                  : `${item.label} は single channel mode では送信できません`
              }
            />
          )
        })}
        <label
          className="checkbox processing__quant"
          title={
            sendQuant
              ? 'PITCH MOD QUANT (CC53) を送信します'
              : '公式チャートに記載のない CC のため、既定では送信しません（MIDI MAP タブで有効化）'
          }
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
