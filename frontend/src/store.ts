import { create } from 'zustand'
import type { SetState } from 'zustand'

interface Store {
  transcript: string
  setTranscript: (t: string) => void
  speaking: boolean
  setSpeaking: (s: boolean) => void
  gesture: string
  setGesture: (g: string) => void
}

export const useStore = create<Store>((set: SetState<Store>) => ({
  transcript: '',
  setTranscript: (t: string) => set({ transcript: t }),
  speaking: false,
  setSpeaking: (s: boolean) => set({ speaking: s }),
  gesture: '',
  setGesture: (g: string) => set({ gesture: g }),
}))
