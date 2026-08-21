import { useEffect } from 'react'
import { useT } from '../i18n'
import { midiEngine } from '../midi/engine'
import { useMidiSnapshot } from '../hooks/useMidiSnapshot'
import { setSettings, setUi } from '../state/actions'
import { useAppState } from '../state/store'
import { PART_COUNT } from '../state/types'
import { Icon } from './Icon'
import { NumberField } from './NumberField'
import { Segmented } from './Segmented'

const STATUS_KEY: Record<string, string> = {
  unsupported: 'device.unsupported',
  idle: 'device.statusIdle',
  requesting: 'device.statusRequesting',
  ready: 'device.statusReady',
  denied: 'device.statusDenied',
  error: 'device.statusError',
}

/** MIDI port discovery, selection and channel-mode configuration. */
export function DeviceBar() {
  const t = useT()
  const midi = useMidiSnapshot()
  const mode = useAppState((s) => s.settings.mode)
  const baseChannel = useAppState((s) => s.settings.baseChannel)

  // Ask for MIDI as soon as the editor opens: the port list is the first thing
  // anyone needs, and it cannot be enumerated before permission is granted.
  useEffect(() => {
    void midiEngine.connect()
  }, [])

  const selected = midi.outputs.find((p) => p.id === midi.outputId) ?? null
  const connected = Boolean(selected)
  const ready = midi.status === 'ready'
  const maxBase = mode === 'split' ? 16 - PART_COUNT + 1 : 16
  const channelHint =
    mode === 'split'
      ? t('mode.splitHint', { from: baseChannel, to: baseChannel + PART_COUNT - 1 })
      : t('mode.singleHint', { ch: baseChannel })

  return (
    <>
      <div className="cluster device">
        <span className="cluster__label">{t('device.label')}</span>
        <span
          className={`led ${connected ? (selected?.isVolcaDrum ? 'led--on' : 'led--warn') : ''}`}
          title={t(STATUS_KEY[midi.status] ?? 'device.statusError')}
        />
        <select
          className="select device__select"
          value={midi.outputId ?? ''}
          disabled={midi.status === 'unsupported'}
          onChange={(e) => midiEngine.selectOutput(e.target.value || null)}
          onPointerDown={() => {
            if (!ready) void midiEngine.connect()
          }}
          aria-label={t('device.outputAria')}
          title={t('device.outputTitle')}
        >
          {ready ? (
            <>
              <option value="">{t('device.chooseOutput')}</option>
              {midi.outputs.map((port) => (
                <option key={port.id} value={port.id}>
                  {port.isVolcaDrum ? '★ ' : ''}
                  {port.name}
                  {port.manufacturer ? ` (${port.manufacturer})` : ''}
                </option>
              ))}
            </>
          ) : (
            <option value="">
              {midi.status === 'unsupported' ? t('device.unsupported') : t('device.connectHint')}
            </option>
          )}
        </select>
        <select
          className="select device__select device__select--in"
          value={midi.inputId ?? ''}
          disabled={!ready}
          onChange={(e) => midiEngine.selectInput(e.target.value || null)}
          aria-label={t('device.inputAria')}
          title={t('device.inputTitle')}
        >
          <option value="">{t('device.inputNone')}</option>
          {midi.inputs.map((port) => (
            <option key={port.id} value={port.id}>
              IN: {port.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn--ghost device__rescan"
          onClick={() => (ready ? midiEngine.refreshPorts(true) : void midiEngine.connect())}
          title={t('device.rescan')}
          aria-label={t('device.rescan')}
        >
          <Icon name="refresh" size={17} />
        </button>
      </div>

      <div className="cluster">
        <span className="cluster__label">{t('mode.label')}</span>
        <Segmented
          ariaLabel={t('mode.aria')}
          options={[
            { value: 'split', label: 'Split', title: t('mode.splitTitle') },
            { value: 'single', label: 'Single', title: t('mode.singleTitle') },
          ]}
          value={mode}
          onChange={(next) => {
            const clamped = next === 'split' ? Math.min(baseChannel, 16 - PART_COUNT + 1) : baseChannel
            setSettings({ mode: next, baseChannel: clamped })
            if (next === 'single') setUi({ layerLink: true })
          }}
        />
        <label className="row" style={{ gap: 4 }}>
          <span className="cluster__label">CH</span>
          <NumberField
            ariaLabel={t('mode.channelAria')}
            value={baseChannel}
            min={1}
            max={maxBase}
            onChange={(channel) => setSettings({ baseChannel: channel })}
          />
        </label>
        <span
          className="hint device__hint"
          title={mode === 'split' ? t('mode.splitTitle') : t('mode.singleTitle')}
        >
          {channelHint}
        </span>
      </div>
    </>
  )
}
