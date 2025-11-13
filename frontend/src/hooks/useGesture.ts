import { useStore } from '../store'
import { useEffect } from 'react'
import { Hands } from '@mediapipe/hands'

export function useGesture() {
  const { gesture, setGesture } = useStore()

  useEffect(() => {
    const hands = new Hands({
      locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`
    })

    hands.setOptions({ maxNumHands: 1, modelComplexity: 0 })
    hands.onResults(res => {
      if (res.multiHandLandmarks.length) setGesture('👋')
      else setGesture('')
    })

    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      const video = document.createElement('video')
      video.srcObject = stream
      video.onloadedmetadata = () => video.play()

      const loop = () => {
        hands.send({ image: video })
        requestAnimationFrame(loop)
      }
      loop()
    })
  }, [setGesture])

  return gesture
}
