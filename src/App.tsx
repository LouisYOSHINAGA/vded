import { FuncPanel } from './components/FuncPanel'
import { LayerMatrix } from './components/LayerMatrix'
import { MidiMapPanel } from './components/MidiMapPanel'
import { MonitorPanel } from './components/MonitorPanel'
import { PartEditor } from './components/PartEditor'
import { PresetPanel } from './components/PresetPanel'
import { Sequencer } from './components/Sequencer'
import { Toast } from './components/Toast'
import { TopBar } from './components/TopBar'
import { WaveGuidePanel } from './components/WaveGuidePanel'
import { useShortcuts } from './hooks/useShortcuts'
import { setUi } from './state/actions'
import { useAppState, type EditorTab } from './state/store'

const TABS: { id: EditorTab; label: string }[] = [
  { id: 'part', label: 'Part edit' },
  { id: 'matrix', label: 'All layers' },
  { id: 'func', label: 'Func' },
  { id: 'map', label: 'MIDI map' },
]

export function App() {
  useShortcuts()
  const tab = useAppState((s) => s.ui.editorTab)

  return (
    <div className="app">
      <TopBar />
      <main className="content">
        <div className="content__main">
          <Sequencer />
          <div className="tabs" role="tablist" aria-label="エディタ">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                className="tabs__item"
                aria-selected={tab === item.id}
                onClick={() => setUi({ editorTab: item.id })}
              >
                {item.label}
              </button>
            ))}
          </div>
          {tab === 'part' && <PartEditor />}
          {tab === 'matrix' && <LayerMatrix />}
          {tab === 'func' && <FuncPanel />}
          {tab === 'map' && <MidiMapPanel />}
        </div>
        <aside className="content__rail">
          <WaveGuidePanel />
          <PresetPanel />
          <MonitorPanel />
        </aside>
      </main>
      <Toast />
    </div>
  )
}
