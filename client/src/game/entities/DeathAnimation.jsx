import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Componente de animação de morte para inimigos
 * Faz o inimigo cair e desaparecer
 */
function DeathAnimation({ position, type, onComplete }) {
  const meshRef = useRef();
  const progress = useRef(0);
  const duration = 1.0; // 1 segundo

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    progress.current += delta;
    const t = Math.min(progress.current / duration, 1);

    // Animação de queda
    meshRef.current.position.y = position[1] * (1 - t * t); // Queda acelerada
    meshRef.current.rotation.x = t * Math.PI / 2; // Rotação para frente
    meshRef.current.scale.setScalar(1 - t * 0.5); // Diminuir tamanho

    // Opacidade
    if (meshRef.current.children.length > 0) {
      meshRef.current.children.forEach((child) => {
        if (child.material) {
          child.material.opacity = 1 - t;
          child.material.transparent = true;
        }
      });
    }

    // Completar animação
    if (t >= 1 && onComplete) {
      onComplete();
    }
  });

  // Renderizar modelo do inimigo que morreu
  return (
    <group ref={meshRef} position={position}>
      {type === 'zombie' ? (
        <>
          {/* Corpo do zumbi */}
          <mesh>
            <boxGeometry args={[0.6, 1, 0.4]} />
            <meshStandardMaterial color="#6B8E23" roughness={0.8} transparent={true} />
          </mesh>
          {/* Cabeça */}
          <mesh position={[0, 0.7, 0]}>
            <boxGeometry args={[0.4, 0.4, 0.4]} />
            <meshStandardMaterial color="#556B2F" roughness={0.8} transparent={true} />
          </mesh>
        </>
      ) : (
        <>
          {/* Corpo do fantasma */}
          <mesh>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshStandardMaterial
              color="#E6E6FA"
              transparent
              opacity={0.6}
            />
          </mesh>
        </>
      )}
    </group>
  );
}

export default DeathAnimation;
