import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

function Oracle() {
  const meshRef = useRef();

  // Animação de levitação
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = 8 + Math.sin(state.clock.elapsedTime) * 0.3;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <group>
      <mesh ref={meshRef} position={[0, 8, 0]} castShadow>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFD700"
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Partículas douradas (placeholder simples) */}
      <pointLight position={[0, 8, 0]} color="#FFD700" intensity={1} distance={10} />
    </group>
  );
}

export default Oracle;
