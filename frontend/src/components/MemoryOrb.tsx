import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function MemoryOrb() {
  const ref = useRef<THREE.Mesh>(null!)

  useFrame(({ clock }: { clock: { getElapsedTime: () => number } }) => {
    ref.current.rotation.x = clock.getElapsedTime()
    ref.current.rotation.y = clock.getElapsedTime()
  })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[2, 32, 32]} />
      <meshStandardMaterial color="#0ff" wireframe />
    </mesh>
  )
}
