import { useState } from 'react'
import { FuncPanel } from './components/FuncPanel'
import { LayerDials } from './components/LayerDials'
import { LayerMatrix } from './components/LayerMatrix'
import { MemoPanel } from './components/MemoPanel'
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

const TAB_LABELS: Record<EditorTab, string> = {
  part: 'tab.part',
  matrix: 'tab.matrix',
  dials: 'tab.dials',
  presets: 'tab.presets',
  memo: 'tab.memo',
  func: 'tab.func',
  map: 'tab.map',
}

const TAB_PANELS: Record<EditorTab, () => JSX.Element> = {
  part: () => <PartEditor />,
  matrix: () => <LayerMatrix />,
  dials: () => <LayerDials />,
  presets: () => <PresetPanel />,
  memo: () => <MemoPanel />,
  func: () => <FuncPanel />,
  map: () => <MidiMapPanel />,
}

export function App() {
  useShortcuts()
  useAppearance()
  const t = useT()
  const tab = useAppState((s) => s.ui.editorTab)
  const tabOrder = useAppState((s) => s.ui.tabOrder)
  const [dragging, setDragging] = useState<EditorTab | null>(null)
  const [over, setOver] = useState<EditorTab | null>(null)

  // Dropping lands the tab on the side it came from, matching the dial cards.
  const landing = (moved: EditorTab, target: EditorTab): EditorTab | null =>
    tabOrder.indexOf(moved) < tabOrder.indexOf(target)
      ? (tabOrder[tabOrder.indexOf(target) + 1] ?? null)
      : target

  return (
    <div className="app">
      <TopBar />
      <main className="content">
        <div className="content__main">
          <Sequencer />
          {/* Tab strip and the panel below it are one folder: the active tab
              merges into the panel so it is obvious what the tabs switch. */}
          <div className="tabbed">
            {/* Tabs can be dragged into any order; a plain click still just
                switches, because a drag needs actual movement to begin. */}
            <div
              className="tabs"
              role="tablist"
              aria-label={t('tabs.label')}
              onDragOver={(e) => {
                if (dragging) e.preventDefault()
              }}
              onDrop={() => {
                if (dragging && over && over !== dragging) {
                  setUi({ tabOrder: reorder(tabOrder, dragging, landing(dragging, over)) })
                }
                setDragging(null)
                setOver(null)
              }}
            >
              {tabOrder.map((id) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  className={`tabs__item${over === id && dragging && dragging !== id ? ' tabs__item--over' : ''}${
                    dragging === id ? ' tabs__item--dragging' : ''
                  }`}
                  aria-selected={tab === id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move'
                    e.dataTransfer.setData('text/plain', id)
                    setDragging(id)
                  }}
                  onDragEnd={() => {
                    setDragging(null)
                    setOver(null)
                  }}
                  onDragOver={() => setOver(id)}
                  onClick={() => setUi({ editorTab: id })}
                  onKeyDown={(e) => {
                    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
                    if (!e.altKey) return
                    e.preventDefault()
                    const to = tabOrder.indexOf(id) + (e.key === 'ArrowLeft' ? -1 : 1)
                    if (to < 0 || to >= tabOrder.length) return
                    setUi({ tabOrder: reorder(tabOrder, id, landing(id, tabOrder[to])) })
                  }}
                  title={t('tabs.reorderTitle')}
                >
                  {t(TAB_LABELS[id])}
                </button>
              ))}
            </div>
            <div className="tabbed__body">{TAB_PANELS[tab]()}</div>
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

/** Moves one tab so it lands immediately before `before` (or last, when null). */
function reorder(order: EditorTab[], moved: EditorTab, before: EditorTab | null): EditorTab[] {
  const rest = order.filter((id) => id !== moved)
  const at = before === null ? rest.length : rest.indexOf(before)
  const index = at < 0 ? rest.length : at
  return [...rest.slice(0, index), moved, ...rest.slice(index)]
}
