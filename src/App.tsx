import { PartEditor } from './components/PartEditor'
import { Sequencer } from './components/Sequencer'
import { TopBar } from './components/TopBar'

export function App() {
  return (
    <div className="app">
      <TopBar />
      <main className="content">
        <div className="content__main">
          <Sequencer />
          <PartEditor />
        </div>
        <aside className="content__rail" />
      </main>
    </div>
  )
}
