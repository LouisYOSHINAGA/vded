import { TopBar } from './components/TopBar'

export function App() {
  return (
    <div className="app">
      <TopBar />
      <main className="content">
        <div className="content__main" />
        <aside className="content__rail" />
      </main>
    </div>
  )
}
