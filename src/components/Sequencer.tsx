import { useCallback, useRef } from 'react'
import {
  clearAllSteps,
  clearPartSteps,
  randomizePattern,
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
import { NumberField } from './NumberField'

/**
 * Each part carries its own tint. The six values come from the active skin, so
 * they stay within one family instead of being an arbitrary rainbow — and the
 * skin editor lets them be reassigned outright.
 */
const partTint = (part: number) => `var(--c-part-${part + 1})`
const partInk = (part: number) => `var(--c-on-part-${part + 1})`

function velocityClass(velocity: number): string {
  if (velocity >= 118) return 'step--accent'
  if (velocity >= 80) return 'step--full'
  return 'step--soft'
}

export function Sequencer() {
  const pattern = useAppState((s) => s.pattern)
  const currentStep = useAppState((s) => s.transport.currentStep)
  const selectedPart = useAppState((s) => s.ui.selectedPart)
  const transport = useAppState((s) => s.transport)

  /** Paint mode captured on pointer-down so a drag writes one consistent value. */
  const paint = useRef<{ on: boolean } | null>(null)

  const onCellDown = useCallback(
    (part: number, step: number, event: React.PointerEvent) => {
      const current = store.get().pattern.steps[part][step]
      if (event.shiftKey) {
        // Shift cycles the accent level of an existing step instead of toggling.
        const next = current.velocity >= 118 ? 96 : current.velocity >= 80 ? 64 : 127
        setStep(part, step, true, next)
        paint.current = null
        return
      }
      const on = !current.on
      paint.current = { on }
      setStep(part, step, on)
      setUi({ selectedPart: part })
    },
    [],
  )

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
        <h2 className="panel__title">Step Sequencer</h2>
        <div className="panel__spacer" />
        <div className="transport">
          <button
            type="button"
            className={`btn transport__play${transport.playing ? ' btn--on' : ''}`}
            onClick={() => sequencer.toggle()}
            title="再生 / 停止 (Space)"
          >
            {transport.playing ? '■ Stop' : '▶ Play'}
          </button>
          <label className="transport__field" title="テンポ（上下ドラッグ / クリックして入力）">
            <span className="cluster__label">BPM</span>
            <NumberField
              ariaLabel="テンポ BPM"
              value={transport.bpm}
              min={20}
              max={300}
              onChange={(bpm) => setTransport({ bpm })}
            />
          </label>
          <label className="transport__field" title="偶数ステップを後ろにずらす量 (%)">
            <span className="cluster__label">Swing</span>
            <NumberField
              ariaLabel="スイング (%)"
              value={transport.swing}
              min={0}
              max={75}
              onChange={(swing) => setTransport({ swing })}
            />
          </label>
          <label className="transport__field" title="ノートの長さ (ms)">
            <span className="cluster__label">Gate</span>
            <NumberField
              ariaLabel="ゲートタイム (ms)"
              value={transport.gateMs}
              min={1}
              max={500}
              onChange={(gateMs) => setTransport({ gateMs })}
            />
          </label>
          <label className="transport__field" title="パターンの長さ（ステップ数）">
            <span className="cluster__label">Len</span>
            <NumberField
              ariaLabel="パターン長（ステップ数）"
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
            title="MIDI クロックと START/STOP を実機に送る（実機側 MIDI Clock src を Auto に）"
          >
            MIDI Clock
          </button>
          <MuteAllButton />
          <button type="button" className="btn btn--ghost btn--sm" onClick={clearAllSteps} title="全パートのステップを消去">
            Clear
          </button>
        </div>
      </div>

      <div className="panel__body sequencer__body">
        <div className="seq-grid" style={{ ['--steps' as string]: MAX_STEPS }}>
          <div className="seq-grid__corner legend">Part</div>
          <div className="seq-ruler">
            {Array.from({ length: MAX_STEPS }, (_, i) => (
              <div
                key={i}
                className={`seq-ruler__tick${i % 4 === 0 ? ' seq-ruler__tick--beat' : ''}${
                  i >= pattern.length ? ' seq-ruler__tick--off' : ''
                }${i === currentStep ? ' seq-ruler__tick--now' : ''}`}
              >
                {i + 1}
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

        <VelocityLane part={selectedPart} />
      </div>
    </section>
  )
}

function MuteAllButton() {
  const allMuted = useAppState((s) => s.mixer.mutes.every(Boolean))
  const anyMuted = useAppState((s) => s.mixer.mutes.some(Boolean))
  const anySolo = useAppState((s) => s.mixer.solos.some(Boolean))

  return (
    <button
      type="button"
      className={`btn btn--sm${allMuted ? ' btn--mute-on' : ' btn--ghost'}`}
      onClick={toggleMuteAll}
      title={
        allMuted
          ? '全パートのミュートを解除します'
          : '全パートをミュートします（ソロも解除されます）'
      }
    >
      {allMuted ? 'Unmute all' : 'Mute all'}
      {!allMuted && (anyMuted || anySolo) && <span className="btn__dot" aria-hidden="true" />}
    </button>
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
  const name = useAppState((s) => s.patch.parts[part].name)
  const steps = useAppState((s) => s.pattern.steps[part])
  const length = useAppState((s) => s.pattern.length)
  const muted = useAppState((s) => s.mixer.mutes[part])
  const solo = useAppState((s) => s.mixer.solos[part])
  const anySolo = useAppState((s) => s.mixer.solos.some(Boolean))
  const audible = anySolo ? solo : !muted
  const tint = partTint(part)

  return (
    <>
      <div
        className={`seq-rail${selected ? ' seq-rail--selected' : ''}${audible ? '' : ' seq-rail--silent'}${
          part % 2 === 1 ? ' seq-rail--alt' : ''
        }`}
        style={{ ['--tint' as string]: tint, ['--tint-ink' as string]: partInk(part) }}
      >
        <button
          type="button"
          className="seq-rail__select"
          onClick={() => setUi({ selectedPart: part })}
          title={`PART ${part + 1} を編集対象にする`}
        >
          <span className="seq-rail__num">{part + 1}</span>
          <span className="seq-rail__name">{name}</span>
        </button>
        <div className="seq-rail__buttons">
          <button
            type="button"
            className={`micro-btn${muted ? ' micro-btn--mute' : ''}`}
            onClick={() => toggleMute(part)}
            title="ミュート（エディタ内蔵シーケンサのみ）"
          >
            M
          </button>
          <button
            type="button"
            className={`micro-btn${solo ? ' micro-btn--solo' : ''}`}
            onClick={() => toggleSolo(part)}
            title="ソロ"
          >
            S
          </button>
          <button
            type="button"
            className="micro-btn"
            onPointerDown={() => triggerPart(part)}
            title="試聴（ノートを 1 発送信）"
          >
            ▸
          </button>
        </div>
      </div>
      <div
        className={`seq-row${part % 2 === 1 ? ' seq-row--alt' : ''}${
          selected ? ' seq-row--selected' : ''
        }`}
      >
        {steps.map((step, i) => (
          <button
            key={i}
            type="button"
            className={`step${step.on ? ` step--on ${velocityClass(step.velocity)}` : ''}${
              i % 4 === 0 ? ' step--beat' : ''
            }${i >= length ? ' step--outside' : ''}${i === currentStep ? ' step--now' : ''}`}
            style={{ ['--tint' as string]: tint, ['--tint-ink' as string]: partInk(part) }}
            aria-label={`PART ${part + 1} step ${i + 1}${step.on ? ` velocity ${step.velocity}` : ' off'}`}
            aria-pressed={step.on}
            onPointerDown={(e) => onCellDown(part, i, e)}
            onPointerEnter={(e) => onCellEnter(part, i, e)}
          />
        ))}
      </div>
      <div className="seq-row__tools">
        <button type="button" className="micro-btn" title="1 ステップ左へ" onClick={() => shiftPart(part, -1)}>
          ‹
        </button>
        <button type="button" className="micro-btn" title="1 ステップ右へ" onClick={() => shiftPart(part, 1)}>
          ›
        </button>
        <button type="button" className="micro-btn" title="ランダマイズ（FUNC+10 相当）" onClick={() => randomizePattern(part)}>
          ⚄
        </button>
        <button type="button" className="micro-btn" title="このパートを消去" onClick={() => clearPartSteps(part)}>
          ✕
        </button>
      </div>
    </>
  )
}

function VelocityLane({ part }: { part: number }) {
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
    <div className="vel-lane" style={{ ['--tint' as string]: partTint(part), ['--tint-ink' as string]: partInk(part) }}>
      <div className="vel-lane__label">
        <span className="legend">Velocity</span>
        <span className="vel-lane__part">{name}</span>
        <span className="hint">上下ドラッグ · W クリックで 96</span>
      </div>
      <div className="vel-lane__row">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`vel-fader${step.on ? '' : ' vel-fader--off'}${
              i >= length ? ' vel-fader--outside' : ''
            }${i % 4 === 0 ? ' vel-fader--beat' : ''}`}
            role="slider"
            tabIndex={0}
            aria-label={`PART ${part + 1} step ${i + 1} velocity`}
            aria-valuemin={1}
            aria-valuemax={127}
            aria-valuenow={step.velocity}
            title={`step ${i + 1} — velocity ${step.velocity}${step.on ? '' : '（オフ／ドラッグでオンになります）'}`}
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
            onDoubleClick={() => apply(i, 96)}
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
              <span className="vel-fader__fill" style={{ height: `${(step.velocity / 127) * 100}%` }}>
                <i className="vel-fader__cap" />
              </span>
            </div>
            <span className="vel-fader__value">{step.on ? step.velocity : '–'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
