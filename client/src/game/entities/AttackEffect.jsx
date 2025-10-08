import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Componente de efeito visual de ataque
 * Cria um arco de ataque que desaparece após a animação
 */
function AttackEffect({ position, rotation, character, onComplete }) {
  const meshRef = useRef();
  const progress = useRef(0);
  const duration = 0.2; // Duração da animação (200ms)

  // Cores por personagem
  const colors = {
    esther: '#FF69B4',  // Rosa vibrante (Arqueira)
    elissa: '#9370DB',  // Roxo médio (Guerreira)
    evelyn: '#4169E1'   // Azul royal (Maga)
  };

  const color = colors[character?.id] || '#FFFFFF';

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    progress.current += delta;

    // Animação de expansão e fade
    const t = progress.current / duration;

    if (t < 1) {
      // Escala cresce
      const scale = THREE.MathUtils.lerp(0.5, 1.5, t);
      meshRef.current.scale.set(scale, 1, scale);

      // Opacidade diminui
      meshRef.current.material.opacity = 1 - t;
    } else {
      // Animação completa
      if (onComplete) onComplete();
    }
  });

  return (
    <group position={position} rotation={rotation}>
      <mesh ref={meshRef} position={[0, 0.3, -0.8]}>
        {/* Cone de ataque */}
        <coneGeometry args={[0.8, 0.4, 16, 1, true, 0, Math.PI * 0.6]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={1}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

export default AttackEffect;
