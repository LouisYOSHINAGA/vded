import { useSyncExternalStore } from 'react'
import { midiEngine } from '../midi/engine'

export function useMidiSnapshot() {
  return useSyncExternalStore(midiEngine.subscribe, midiEngine.getSnapshot, midiEngine.getSnapshot)
}
