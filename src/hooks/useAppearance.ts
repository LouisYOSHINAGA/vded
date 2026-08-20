import { useEffect } from 'react'
import { useAppState } from '../state/store'
import { applyAppearance } from '../theme/apply'

/** Mirrors the appearance settings onto the document element. */
export function useAppearance(): void {
  const appearance = useAppState((s) => s.settings.appearance)
  useEffect(() => {
    applyAppearance(appearance)
  }, [appearance])
}
