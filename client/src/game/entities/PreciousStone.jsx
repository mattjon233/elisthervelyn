import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Pedra Preciosa - Item colecionável
 * Pequena, brilhante e girando
 */
function PreciousStone({ position = [0, 0.5, 0], onCollect }) {
  const meshRef = useRef();
  const glowRef = useRef();
  const [isCollected, setIsCollected] = useState(false);

  // Animação: rotação e flutuação
  useFrame(({ clock }) => {
    if (meshRef.current && !isCollected) {
      // Rotação suave
      meshRef.current.rotation.y = clock.elapsedTime * 2;

      // Flutuação para cima e para baixo
      const floatY = Math.sin(clock.elapsedTime * 2) * 0.1;
      meshRef.current.position.y = position[1] + floatY;
    }

    // Pulsação do brilho
    if (glowRef.current && !isCollected) {
      const pulse = (Math.sin(clock.elapsedTime * 3) + 1) / 2; // 0 a 1
      glowRef.current.scale.setScalar(0.8 + pulse * 0.4);
      glowRef.current.material.opacity = 0.3 + pulse * 0.3;
    }
  });

  if (isCollected) {
    return null; // Não renderiza se já foi coletada
  }

  return (
    <group position={position}>
      {/* Pedra principal - diamante/cristal */}
      <mesh ref={meshRef} position={[0, 0, 0]} castShadow>
        {/* Forma de octaedro (diamante) */}
        <octahedronGeometry args={[0.15, 0]} />
        <meshStandardMaterial
          color="#00FFFF"
          emissive="#00FFFF"
          emissiveIntensity={0.5}
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Brilho ao redor */}
      <mesh ref={glowRef} position={[0, 0, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshBasicMaterial
          color="#00FFFF"
          transparent
          opacity={0.3}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Luz pontual para iluminar área ao redor */}
      <pointLight
        position={[0, 0, 0]}
        color="#00FFFF"
        intensity={1.5}
        distance={3}
        decay={2}
      />

      {/* Partículas brilhantes ao redor */}
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const radius = 0.3;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * radius,
              Math.sin(angle * 2) * 0.1,
              Math.sin(angle) * radius
            ]}
          >
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
        );
      })}
    </group>
  );
}

export default PreciousStone;
