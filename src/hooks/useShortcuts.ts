import { useEffect } from 'react'
import { sequencer } from '../sequencer/engine'
import { sendAll, setLayerLink, setUi, triggerPart } from '../state/actions'
import { store } from '../state/store'
import { PART_COUNT } from '../state/types'

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)
}

/** Transport and part-select shortcuts, mirroring the machine's front panel. */
export function useShortcuts(): void {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isTyping(event.target)) return
      if (event.metaKey || event.ctrlKey) {
        if (event.key.toLowerCase() === 's') {
          event.preventDefault()
          sendAll()
        }
        return
      }
      if (event.code === 'Space') {
        event.preventDefault()
        sequencer.toggle()
        return
      }
      const digit = Number(event.key)
      if (Number.isInteger(digit) && digit >= 1 && digit <= PART_COUNT) {
        event.preventDefault()
        const part = digit - 1
        setUi({ selectedPart: part })
        if (event.shiftKey) triggerPart(part)
        return
      }
      if (event.key === 'l' || event.key === 'L') {
        event.preventDefault()
        const part = store.get().ui.selectedPart
        setLayerLink(part, !store.get().ui.layerLink[part])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
