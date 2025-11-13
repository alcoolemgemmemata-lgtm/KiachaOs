import { useStore } from '../store'
import { useWhisper } from '../hooks/useWhisper'

export default function VoiceWidget() {
  const { transcript } = useStore()
  useWhisper()

  return (
    <div className="p-3 bg-cyan-900/30 backdrop-blur rounded-xl">
      <div className="text-xs uppercase tracking-widest">Voice</div>
      <div className="text-sm">{transcript || 'listening...'}</div>
    </div>
  )
}
