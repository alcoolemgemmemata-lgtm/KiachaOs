import { useStore } from '../store'
import { useEffect } from 'react'

export function usePiper() {
  const { transcript, speaking, setSpeaking } = useStore()

  useEffect(() => {
    if (!transcript || speaking) return

    setSpeaking(true)
    const worker = new Worker(new URL('../workers/piper.worker.ts', import.meta.url), { type: 'module' })
    worker.postMessage(transcript)
    worker.onmessage = () => setSpeaking(false)

    return () => worker.terminate()
  }, [transcript, speaking, setSpeaking])
}
