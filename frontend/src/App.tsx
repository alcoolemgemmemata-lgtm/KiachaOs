import Dashboard3D from './components/Dashboard3D'
import VoiceWidget from './components/VoiceWidget'
import VisionWidget from './components/VisionWidget'
import RadialWheel from './components/RadialWheel'

export default function App() {
  return (
    <div className="w-screen h-screen relative">
      <Dashboard3D />
      <div className="absolute top-4 left-4 space-y-2">
        <VoiceWidget />
        <VisionWidget />
        <RadialWheel />
      </div>
    </div>
  )
}
