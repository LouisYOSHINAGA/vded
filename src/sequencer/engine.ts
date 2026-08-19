/**
 * Step sequencer clock.
 *
 * Uses the classic lookahead pattern: a coarse timer wakes up often enough to
 * schedule the next slice of events, and each event is handed to Web MIDI with
 * an explicit timestamp so jitter in the timer never reaches the wire.
 */
import { midiEngine } from '../midi/engine'
import { isAudible, midiConfig } from '../state/actions'
import { store } from '../state/store'
import { PART_COUNT } from '../state/types'

const LOOKAHEAD_MS = 120
const TIMER_MS = 25
const PPQN = 24

const CLOCK = 0xf8
const START = 0xfa
const CONTINUE = 0xfb
const STOP = 0xfc

function stepDurationMs(bpm: number): number {
  return 60000 / bpm / 4
}

function channelForPart(partIndex: number): number {
  const config = midiConfig()
  if (config.mode === 'single') return config.baseChannel
  return ((config.baseChannel - 1 + partIndex) % 16) + 1
}

class Sequencer {
  private timer: number | undefined
  private nextStepTime = 0
  private nextClockTime = 0
  private stepIndex = 0
  private uiTimers: number[] = []

  get running(): boolean {
    return this.timer !== undefined
  }

  start(fromStep = 0): void {
    if (this.running) return
    const now = performance.now()
    this.stepIndex = fromStep
    this.nextStepTime = now + 40
    this.nextClockTime = now + 40
    const { transport } = store.get()
    if (transport.sendClock) midiEngine.realtime(fromStep === 0 ? START : CONTINUE)
    store.patchSlice('transport', { playing: true, currentStep: fromStep })
    this.timer = window.setInterval(() => this.tick(), TIMER_MS)
    this.tick()
  }

  stop(): void {
    if (this.timer !== undefined) {
      window.clearInterval(this.timer)
      this.timer = undefined
    }
    this.uiTimers.forEach((id) => window.clearTimeout(id))
    this.uiTimers = []
    const { transport } = store.get()
    if (transport.sendClock) midiEngine.realtime(STOP)
    store.patchSlice('transport', { playing: false, currentStep: -1 })
  }

  toggle(): void {
    if (this.running) this.stop()
    else this.start(0)
  }

  private tick(): void {
    const state = store.get()
    const { bpm, swing, sendClock } = state.transport
    const horizon = performance.now() + LOOKAHEAD_MS
    const stepMs = stepDurationMs(bpm)

    if (sendClock) {
      const clockMs = 60000 / bpm / PPQN
      while (this.nextClockTime < horizon) {
        midiEngine.realtime(CLOCK, this.nextClockTime)
        this.nextClockTime += clockMs
      }
    } else {
      this.nextClockTime = Math.max(this.nextClockTime, horizon)
    }

    while (this.nextStepTime < horizon) {
      // Swing pushes the odd-numbered (0-based) steps later, like the machine's
      // SWING knob, up to 75% of a step.
      const isOffbeat = this.stepIndex % 2 === 1
      const offset = isOffbeat ? (stepMs * Math.min(75, swing)) / 100 : 0
      this.fireStep(this.stepIndex, this.nextStepTime + offset)
      this.stepIndex = (this.stepIndex + 1) % Math.max(1, store.get().pattern.length)
      this.nextStepTime += stepMs
    }
  }

  private fireStep(stepIndex: number, when: number): void {
    const state = store.get()
    const gate = state.transport.gateMs
    for (let part = 0; part < PART_COUNT; part++) {
      const step = state.pattern.steps[part]?.[stepIndex]
      if (!step || !step.on) continue
      if (!isAudible(state, part)) continue
      const channel = channelForPart(part)
      const note = state.mixer.notes[part]
      midiEngine.noteOn(channel, note, step.velocity, when)
      midiEngine.noteOff(channel, note, when + gate)
    }
    const delay = Math.max(0, when - performance.now())
    const id = window.setTimeout(() => {
      store.patchSlice('transport', { currentStep: stepIndex })
      this.uiTimers = this.uiTimers.filter((t) => t !== id)
    }, delay)
    this.uiTimers.push(id)
  }
}

export const sequencer = new Sequencer()
