import { useCallback, useRef, useState } from 'react'
import { useT } from '../i18n'
import {
  clearAllSteps,
  clearPartSteps,
  randomizePattern,
  scaleVelocities,
  setPatternLength,
  setStep,
  setStepVelocity,
  setTransport,
  setUi,
  shiftPart,
  toggleMute,
  toggleMuteAll,
  toggleSolo,
  triggerPart,
} from '../state/actions'
import { sequencer } from '../sequencer/engine'
import { store, useAppState } from '../state/store'
import { MAX_STEPS, PART_COUNT } from '../state/types'
import { Icon } from './Icon'
import { InfoTip } from './InfoTip'
import { Knob } from './Knob'
import { NumberField } from './NumberField'

/** Velocity a fresh step gets, and the value a double click returns to. */
const DEFAULT_VELOCITY = 100
const ACCENT_VELOCITY = 127
const SOFT_VELOCITY = 70

const DEFAULT_RAIL_WIDTH = 216

/** Each part carries its own tint, taken from the active skin. */
const partTint = (part: number) => `var(--c-part-${part + 1})`
const partInk = (part: number) => `var(--c-on-part-${part + 1})`

/** Splits the sixteen steps into four beats. */
function beats<T>(items: T[]): T[][] {
  return [0, 1, 2, 3].map((beat) => items.slice(beat * 4, beat * 4 + 4))
}

function clampRail(width: number): number {
  return Math.max(120, Math.min(340, Math.round(width)))
}

function velocityClass(velocity: number): string {
  if (velocity >= 118) return 'step--accent'
  if (velocity >= 85) return 'step--full'
  return 'step--soft'
}

export function Sequencer() {
  const t = useT()
  const pattern = useAppState((s) => s.pattern)
  const currentStep = useAppState((s) => s.transport.currentStep)
  const selectedPart = useAppState((s) => s.ui.selectedPart)
  const transport = useAppState((s) => s.transport)
  const railWidth = useAppState((s) => s.ui.seqRailWidth)

  /** Paint mode captured on pointer-down so a drag writes one consistent value. */
  const paint = useRef<{ on: boolean } | null>(null)

  const onCellDown = useCallback((part: number, step: number, event: React.PointerEvent) => {
    const current = store.get().pattern.steps[part][step]
    if (event.shiftKey) {
      // Shift cycles the accent level of an existing step instead of toggling.
      const next =
        current.velocity >= 118
          ? DEFAULT_VELOCITY
          : current.velocity >= 85
            ? SOFT_VELOCITY
            : ACCENT_VELOCITY
      setStep(part, step, true, next)
      paint.current = null
      return
    }
    const on = !current.on
    paint.current = { on }
    setStep(part, step, on)
    setUi({ selectedPart: part })
  }, [])

  const onCellEnter = useCallback((part: number, step: number, event: React.PointerEvent) => {
    if (!paint.current || event.buttons === 0) return
    setStep(part, step, paint.current.on)
  }, [])

  const endPaint = useCallback(() => {
    paint.current = null
  }, [])

  return (
    <section className="panel sequencer" onPointerUp={endPaint} onPointerLeave={endPaint}>
      <div className="panel__head">
        <h2 className="panel__title">{t('seq.title')}</h2>
        <button
          type="button"
          className={`transport__play${transport.playing ? ' transport__play--on' : ''}`}
          onClick={() => sequencer.toggle()}
          title={t('seq.playTitle')}
          aria-label={transport.playing ? t('seq.stop') : t('seq.play')}
        >
          <Icon name={transport.playing ? 'stop' : 'play'} size={19} />
          {transport.playing ? t('seq.stop') : t('seq.play')}
        </button>
        <div className="panel__spacer" />
        <div className="transport">
          <Knob
            label={t('seq.tempo')}
            size="sm"
            layout="inline"
            editable
            value={transport.bpm}
            min={20}
            max={300}
            defaultValue={120}
            onChange={(bpm) => setTransport({ bpm })}
            title={t('seq.tempoTitle')}
          />
          <Knob
            label={t('seq.swing')}
            size="sm"
            layout="inline"
            editable
            value={transport.swing}
            min={0}
            max={75}
            defaultValue={0}
            onChange={(swing) => setTransport({ swing })}
            title={t('seq.swingTitle')}
          />
          <Knob
            label={t('seq.gate')}
            size="sm"
            layout="inline"
            editable
            value={transport.gateMs}
            min={1}
            max={500}
            defaultValue={20}
            onChange={(gateMs) => setTransport({ gateMs })}
            title={t('seq.gateTitle')}
          />
          <label className="transport__field" title={t('seq.lengthAria')}>
            <span className="cluster__label">{t('seq.length')}</span>
            <NumberField
              ariaLabel={t('seq.lengthAria')}
              value={pattern.length}
              min={1}
              max={MAX_STEPS}
              onChange={setPatternLength}
            />
          </label>
          <button
            type="button"
            className={`btn btn--sm${transport.sendClock ? ' btn--on' : ' btn--ghost'}`}
            onClick={() => setTransport({ sendClock: !transport.sendClock })}
            title={t('seq.clockTitle')}
          >
            {t('seq.clock')}
          </button>
          <MuteAllButton />
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={clearAllSteps}
            title={t('seq.clearTitle')}
          >
            {t('seq.clear')}
          </button>
        </div>
      </div>

      <div className="panel__body sequencer__body">
        <div
          className="seq-grid"
          style={{ ['--steps' as string]: MAX_STEPS, ['--rail-w' as string]: `${railWidth}px` }}
        >
          <div className="seq-grid__corner legend">
            {t('seq.part')}
            <RailHandle />
          </div>
          <div className="seq-ruler">
            {beats(Array.from({ length: MAX_STEPS }, (_, i) => i)).map((beat, b) => (
              <div className="seq-beat" key={b}>
                {beat.map((i) => (
                  <div
                    key={i}
                    className={`seq-ruler__tick${i >= pattern.length ? ' seq-ruler__tick--off' : ''}${
                      i === currentStep ? ' seq-ruler__tick--now' : ''
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="seq-grid__corner" />

          {Array.from({ length: PART_COUNT }, (_, part) => (
            <PartRow
              key={part}
              part={part}
              selected={selectedPart === part}
              onCellDown={onCellDown}
              onCellEnter={onCellEnter}
              currentStep={currentStep}
            />
          ))}
        </div>

        <VelocityLane part={selectedPart} railWidth={railWidth} />
      </div>
    </section>
  )
}

function MuteAllButton() {
  const t = useT()
  const allMuted = useAppState((s) => s.mixer.mutes.every(Boolean))
  const anyMuted = useAppState((s) => s.mixer.mutes.some(Boolean))
  const anySolo = useAppState((s) => s.mixer.solos.some(Boolean))

  return (
    <button
      type="button"
      className={`btn btn--sm${allMuted ? ' btn--mute-on' : ' btn--ghost'}`}
      onClick={toggleMuteAll}
      title={allMuted ? t('seq.unmuteAllTitle') : t('seq.muteAllTitle')}
    >
      {allMuted ? t('seq.unmuteAll') : t('seq.muteAll')}
      {!allMuted && (anyMuted || anySolo) && <span className="btn__dot" aria-hidden="true" />}
    </button>
  )
}

/** Drag handle that resizes the part rail; double click restores the default. */
function RailHandle() {
  const t = useT()
  const width = useAppState((s) => s.ui.seqRailWidth)
  const drag = useRef<{ startX: number; startWidth: number } | null>(null)

  return (
    <span
      className="seq-grid__resizer"
      role="separator"
      aria-label={t('seq.railWidth')}
      aria-orientation="vertical"
      tabIndex={0}
      title={t('seq.railWidthTitle')}
      onPointerDown={(e) => {
        e.preventDefault()
        e.currentTarget.setPointerCapture(e.pointerId)
        drag.current = { startX: e.clientX, startWidth: width }
      }}
      onPointerMove={(e) => {
        const state = drag.current
        if (!state) return
        setUi({ seqRailWidth: clampRail(state.startWidth + (e.clientX - state.startX)) })
      }}
      onPointerUp={() => {
        drag.current = null
      }}
      onDoubleClick={() => setUi({ seqRailWidth: DEFAULT_RAIL_WIDTH })}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') setUi({ seqRailWidth: clampRail(width - 8) })
        if (e.key === 'ArrowRight') setUi({ seqRailWidth: clampRail(width + 8) })
      }}
    />
  )
}

interface PartRowProps {
  part: number
  selected: boolean
  currentStep: number
  onCellDown: (part: number, step: number, event: React.PointerEvent) => void
  onCellEnter: (part: number, step: number, event: React.PointerEvent) => void
}

function PartRow({ part, selected, currentStep, onCellDown, onCellEnter }: PartRowProps) {
  const t = useT()
  const name = useAppState((s) => s.patch.parts[part].name)
  const steps = useAppState((s) => s.pattern.steps[part])
  const length = useAppState((s) => s.pattern.length)
  const muted = useAppState((s) => s.mixer.mutes[part])
  const solo = useAppState((s) => s.mixer.solos[part])
  const anySolo = useAppState((s) => s.mixer.solos.some(Boolean))
  const audible = anySolo ? solo : !muted
  const tintStyle = {
    ['--tint' as string]: partTint(part),
    ['--tint-ink' as string]: partInk(part),
  }

  return (
    <>
      <div
        className={`seq-rail${selected ? ' seq-rail--selected' : ''}${audible ? '' : ' seq-rail--silent'}${
          part % 2 === 1 ? ' seq-rail--alt' : ''
        }`}
        style={tintStyle}
      >
        <button
          type="button"
          className="seq-rail__select"
          onClick={() => setUi({ selectedPart: part })}
          title={t('seq.selectPart', { n: part + 1 })}
        >
          <span className="seq-rail__num">{part + 1}</span>
          <span className="seq-rail__name">{name}</span>
        </button>
        <div className="seq-rail__buttons">
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
        </div>
      </div>
      <div
        className={`seq-row${part % 2 === 1 ? ' seq-row--alt' : ''}${
          selected ? ' seq-row--selected' : ''
        }`}
        style={tintStyle}
      >
        {beats(steps).map((beat, b) => (
          <div className="seq-beat" key={b}>
            {beat.map((step, j) => {
              const i = b * 4 + j
              return (
                <button
                  key={i}
                  type="button"
                  className={`step${step.on ? ` step--on ${velocityClass(step.velocity)}` : ''}${
                    i >= length ? ' step--outside' : ''
                  }${i === currentStep ? ' step--now' : ''}`}
                  aria-label={`${t('seq.stepAria', { part: part + 1, step: i + 1 })} ${
                    step.on ? t('seq.stepVelocity', { v: step.velocity }) : t('seq.stepOff')
                  }`}
                  aria-pressed={step.on}
                  onPointerDown={(e) => onCellDown(part, i, e)}
                  onPointerEnter={(e) => onCellEnter(part, i, e)}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="seq-row__tools">
        <button
          type="button"
          className="micro-btn"
          title={t('seq.shiftLeft')}
          aria-label={t('seq.shiftLeft')}
          onClick={() => shiftPart(part, -1)}
        >
          <Icon name="shiftLeft" />
        </button>
        <button
          type="button"
          className="micro-btn"
          title={t('seq.shiftRight')}
          aria-label={t('seq.shiftRight')}
          onClick={() => shiftPart(part, 1)}
        >
          <Icon name="shiftRight" />
        </button>
        <button
          type="button"
          className="micro-btn"
          title={t('seq.randomize')}
          aria-label={t('seq.randomize')}
          onClick={() => randomizePattern(part)}
        >
          <Icon name="random" />
        </button>
        <button
          type="button"
          className="micro-btn"
          title={t('seq.clearPart')}
          aria-label={t('seq.clearPart')}
          onClick={() => clearPartSteps(part)}
        >
          <Icon name="clear" />
        </button>
      </div>
    </>
  )
}

function VelocityLane({ part, railWidth }: { part: number; railWidth: number }) {
  const t = useT()
  const steps = useAppState((s) => s.pattern.steps[part])
  const length = useAppState((s) => s.pattern.length)
  const name = useAppState((s) => s.patch.parts[part].name)
  const drag = useRef<{ step: number; startY: number; startValue: number } | null>(null)

  const apply = (step: number, velocity: number) => {
    const clamped = Math.max(1, Math.min(127, Math.round(velocity)))
    const current = store.get().pattern.steps[part][step]
    if (!current.on) setStep(part, step, true, clamped)
    else setStepVelocity(part, step, clamped)
  }

  return (
    <div
      className="vel-lane"
      style={{
        ['--tint' as string]: partTint(part),
        ['--tint-ink' as string]: partInk(part),
        ['--rail-w' as string]: `${railWidth}px`,
      }}
    >
      <div className="vel-lane__label">
        <span className="legend">
          {t('seq.velocity')}
          <InfoTip label={t('seq.velocity')} align="right">
            {t('seq.velocityHelp', { def: DEFAULT_VELOCITY })}
          </InfoTip>
        </span>
        <span className="vel-lane__part">{name}</span>
      </div>
      <div className="vel-lane__row">
        {beats(steps).map((beat, b) => (
          <div className="seq-beat" key={b}>
            {beat.map((step, j) => {
              const i = b * 4 + j
              const label = t('seq.velocityAria', { part: part + 1, step: i + 1 })
              return (
                <div
                  key={i}
                  className={`vel-fader${step.on ? '' : ' vel-fader--off'}${
                    i >= length ? ' vel-fader--outside' : ''
                  }`}
                  role="slider"
                  tabIndex={0}
                  aria-label={label}
                  aria-valuemin={1}
                  aria-valuemax={127}
                  aria-valuenow={step.velocity}
                  title={`${label}: ${step.velocity}${step.on ? '' : t('seq.velocityOffHint')}`}
                  onPointerDown={(e) => {
                    if (e.button !== 0) return
                    e.preventDefault()
                    e.currentTarget.setPointerCapture(e.pointerId)
                    drag.current = { step: i, startY: e.clientY, startValue: step.velocity }
                  }}
                  onPointerMove={(e) => {
                    const state = drag.current
                    if (!state) return
                    const perUnit = e.shiftKey ? 2.5 : 0.7
                    apply(state.step, state.startValue + (state.startY - e.clientY) / perUnit)
                  }}
                  onPointerUp={() => {
                    drag.current = null
                  }}
                  onPointerCancel={() => {
                    drag.current = null
                  }}
                  onDoubleClick={() => apply(i, DEFAULT_VELOCITY)}
                  onKeyDown={(e) => {
                    const delta = e.shiftKey ? 1 : 8
                    if (e.key === 'ArrowUp') {
                      e.preventDefault()
                      apply(i, step.velocity + delta)
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault()
                      apply(i, step.velocity - delta)
                    }
                  }}
                >
                  <div className="vel-fader__track">
                    <span
                      className="vel-fader__fill"
                      style={{ height: `${(step.velocity / 127) * 100}%` }}
                    >
                      <i className="vel-fader__cap" />
                    </span>
                  </div>
                  <span className="vel-fader__value">{step.on ? step.velocity : '–'}</span>
                </div>
              )
            })}
          </div>
        ))}
      </div>
      <VelocityScaler part={part} />
    </div>
  )
}

/**
 * Scales the whole row at once. The factor only lands when Apply is pressed, so
 * dragging the slider never destroys the shape you already dialled in.
 */
function VelocityScaler({ part }: { part: number }) {
  const t = useT()
  const [factor, setFactor] = useState(1)
  // While the field has focus it holds raw text, so half-typed values like
  // "1." are not rewritten under the cursor.
  const [draft, setDraft] = useState<string | null>(null)

  const commitDraft = () => {
    const parsed = Number(draft)
    if (draft !== null && draft.trim() !== '' && Number.isFinite(parsed)) {
      setFactor(Math.round(Math.max(0, Math.min(2, parsed)) * 20) / 20)
    }
    setDraft(null)
  }

  return (
    <div className="vel-scaler">
      {/* The slider is a fader like the ones it scales — same height, same
          direction, and its own caption directly underneath. */}
      <div className="vel-scaler__track">
        <input
          className="vel-scaler__range"
          type="range"
          min={0}
          max={2}
          step={0.05}
          value={factor}
          aria-label={t('seq.scaleAria')}
          onChange={(e) => setFactor(Number(e.target.value))}
          onDoubleClick={() => setFactor(1)}
        />
        <span className="vel-scaler__caption legend">{t('seq.scale')}</span>
      </div>
      <div className="vel-scaler__side">
        <span className="vel-scaler__value">
          <span aria-hidden="true">×</span>
          <input
            className="vel-scaler__field"
            type="text"
            inputMode="decimal"
            value={draft ?? factor.toFixed(2)}
            aria-label={t('seq.scaleAria')}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            onBlur={() => commitDraft()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
              if (e.key === 'Escape') setDraft(null)
            }}
          />
        </span>
        <button
          type="button"
          className="btn btn--sm vel-scaler__apply"
          onClick={() => scaleVelocities(part, factor)}
          title={t('seq.applyTitle')}
        >
          {t('seq.apply')}
        </button>
      </div>
    </div>
  )
}
