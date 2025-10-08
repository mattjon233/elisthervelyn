import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

function BladeSpinEffect({ ability }) {
  const groupRef = useRef();

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 20 * delta;
    }
  });

  return (
    <group ref={groupRef}>
      {[...Array(4)].map((_, i) => (
        <mesh key={i} rotation-y={(Math.PI / 2) * i} position={[Math.sin((Math.PI / 2) * i) * 1.5, 1, Math.cos((Math.PI / 2) * i) * 1.5]}>
          <boxGeometry args={[1, 0.1, 0.1]} />
          <meshStandardMaterial color="#9370DB" />
        </mesh>
      ))}
    </group>
  );
}

export default BladeSpinEffect;