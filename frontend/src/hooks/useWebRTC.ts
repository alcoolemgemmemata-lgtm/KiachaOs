import { useEffect, useRef } from 'react'

export function useWebRTC() {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      if (ref.current) {
        ref.current.srcObject = stream
      }
    })
  }, [])

  return ref
}
