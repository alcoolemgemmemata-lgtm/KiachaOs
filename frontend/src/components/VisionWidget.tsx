import { useWebRTC } from '../hooks/useWebRTC'

export default function VisionWidget() {
  const video = useWebRTC()

  return (
    <div className="p-3 bg-cyan-900/30 backdrop-blur rounded-xl">
      <div className="text-xs uppercase tracking-widest mb-2">Vision</div>
      <video ref={video} autoPlay muted className="w-64 rounded" />
    </div>
  )
}
