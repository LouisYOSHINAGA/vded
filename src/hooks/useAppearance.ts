import { useEffect } from 'react'
import { useAppState } from '../state/store'

/** Mirrors the appearance settings onto the document element. */
export function useAppearance(): void {
  const appearance = useAppState((s) => s.settings.appearance)

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = appearance.theme
    root.dataset.font = appearance.font
    root.style.setProperty('--ui-zoom', String(appearance.zoom))
  }, [appearance])
}
