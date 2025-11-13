import { useEffect } from 'react'
import { useStore } from '../store'

export function useWhisper() {
  const { setTranscript } = useStore()

  useEffect(() => {
    const worker = new Worker(new URL('../workers/whisper.worker.ts', import.meta.url), { type: 'module' })

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      const rec = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      rec.ondataavailable = e => worker.postMessage(e.data)
      rec.start(500)
    })

    worker.onmessage = (e: MessageEvent<string>) => {
      setTranscript(e.data)
    }

    return () => worker.terminate()
  }, [setTranscript])
}
