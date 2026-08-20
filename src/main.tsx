import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/themes.css'
import './styles/base.css'
import './styles/layout.css'
import './styles/controls.css'
import './styles/sequencer.css'
import './styles/panels.css'
import { App } from './App'
import { loadWorkspace, startAutosave } from './state/persist'
import { store } from './state/store'
import { FACTORY_PRESETS } from './data/factoryPresets'
import { applyAppearance } from './theme/apply'

const restored = loadWorkspace()
if (restored) {
  store.set((state) => ({ ...state, ...restored }))
} else {
  store.set((state) => ({ ...state, presets: FACTORY_PRESETS }))
}
// Paint the skin before the first render so a dark skin never flashes white.
applyAppearance(store.get().settings.appearance)
startAutosave()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
