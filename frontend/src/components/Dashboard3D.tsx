import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import MemoryOrb from './MemoryOrb'

export default function Dashboard3D() {
  return (
    <Canvas camera={{ position: [0, 0, 10] }}>
      <ambientLight intensity={0.5} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <MemoryOrb />
      <OrbitControls autoRotate autoRotateSpeed={0.5} />
    </Canvas>
  )
}
