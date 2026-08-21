import { FuncPanel } from './components/FuncPanel'
import { LayerDials } from './components/LayerDials'
import { LayerMatrix } from './components/LayerMatrix'
import { MidiMapPanel } from './components/MidiMapPanel'
import { MonitorPanel } from './components/MonitorPanel'
import { PartEditor } from './components/PartEditor'
import { PresetPanel } from './components/PresetPanel'
import { Sequencer } from './components/Sequencer'
import { Toast } from './components/Toast'
import { TopBar } from './components/TopBar'
import { WaveGuidePanel } from './components/WaveGuidePanel'
import { useT } from './i18n'
import { useAppearance } from './hooks/useAppearance'
import { useShortcuts } from './hooks/useShortcuts'
import { setUi } from './state/actions'
import { useAppState, type EditorTab } from './state/store'

/*
 * Tab order follows how often a tab is opened while working: the two sound
 * editors first, then the overviews, then the things you visit between
 * sessions (presets) or once during setup (func, MIDI map).
 */
const TABS: { id: EditorTab; key: string }[] = [
  { id: 'part', key: 'tab.part' },
  { id: 'matrix', key: 'tab.matrix' },
  { id: 'dials', key: 'tab.dials' },
  { id: 'presets', key: 'tab.presets' },
  { id: 'func', key: 'tab.func' },
  { id: 'map', key: 'tab.map' },
]

export function App() {
  useShortcuts()
  useAppearance()
  const t = useT()
  const tab = useAppState((s) => s.ui.editorTab)

  return (
    <div className="app">
      <TopBar />
      <main className="content">
        <div className="content__main">
          <Sequencer />
          {/* Tab strip and the panel below it are one folder: the active tab
              merges into the panel so it is obvious what the tabs switch. */}
          <div className="tabbed">
            <div className="tabs" role="tablist" aria-label={t('tabs.label')}>
              {TABS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  className="tabs__item"
                  aria-selected={tab === item.id}
                  onClick={() => setUi({ editorTab: item.id })}
                >
                  {t(item.key)}
                </button>
              ))}
            </div>
            <div className="tabbed__body">
              {tab === 'part' && <PartEditor />}
              {tab === 'matrix' && <LayerMatrix />}
              {tab === 'dials' && <LayerDials />}
              {tab === 'presets' && <PresetPanel />}
              {tab === 'func' && <FuncPanel />}
              {tab === 'map' && <MidiMapPanel />}
            </div>
          </div>
        </div>
        {/* The rail holds what must stay reachable while editing: the shared
            resonator every part feeds, and the diagnostic log. The preset
            library moved to a tab — it is a between-takes activity, not
            something to keep on screen while tweaking a sound. */}
        <aside className="content__rail">
          <WaveGuidePanel />
          <MonitorPanel />
        </aside>
      </main>
      <Toast />
    </div>
  )
}
