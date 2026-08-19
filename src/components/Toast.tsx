import { useEffect } from 'react'
import { clearToast, useAppState } from '../state/store'

export function Toast() {
  const toast = useAppState((s) => s.toast)

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(clearToast, 3200)
    return () => window.clearTimeout(id)
  }, [toast])

  if (!toast) return null
  return (
    <div className={`toast toast--${toast.tone}`} role="status" aria-live="polite">
      <span className={`led ${toast.tone === 'error' ? '' : 'led--on'}`} />
      {toast.text}
    </div>
  )
}
