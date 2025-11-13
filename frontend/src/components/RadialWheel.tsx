import { useGesture } from '../hooks/useGesture'

export default function RadialWheel() {
  const gesture = useGesture()

  if (!gesture) return null

  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
      <div className="w-40 h-40 rounded-full border-2 border-cyan-400 grid place-items-center text-xs">
        {gesture}
      </div>
    </div>
  )
}
