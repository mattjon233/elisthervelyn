import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Componente de efeito visual de ataque melhorado
 * Inclui slash animado, partículas e impacto visual
 */
function AttackEffect({ position, rotation, character, onComplete }) {
  const groupRef = useRef();
  const slashRef = useRef();
  const progress = useRef(0);
  const duration = 0.3; // Duração da animação (300ms)
  const [particles] = useState(() => {
    // Gera posições aleatórias para partículas
    return Array.from({ length: 15 }, () => ({
      offset: new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 0.5,
        (Math.random() - 0.5) * 2
      ),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        Math.random() * 2 + 1,
        (Math.random() - 0.5) * 3
      ),
      size: Math.random() * 0.1 + 0.05
    }));
  });

  // Cores por personagem
  const colors = {
    esther: '#FF1493',  // Rosa vibrante (Arqueira)
    elissa: '#9370DB',  // Roxo médio (Guerreira)
    evelyn: '#1E90FF'   // Azul brilhante (Maga)
  };

  const color = colors[character?.id] || '#FFFFFF';

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    progress.current += delta;
    const t = Math.min(progress.current / duration, 1);

    if (slashRef.current) {
      // Animação do slash - arco rápido
      const slashAngle = THREE.MathUtils.lerp(-Math.PI / 3, Math.PI / 3, t);
      slashRef.current.rotation.z = slashAngle;

      // Escala do slash
      const scale = THREE.MathUtils.lerp(0.3, 1.8, t);
      slashRef.current.scale.set(scale, scale, scale);

      // Fade out no final
      const opacity = t < 0.7 ? 1 : THREE.MathUtils.lerp(1, 0, (t - 0.7) / 0.3);
      slashRef.current.material.opacity = opacity;
    }

    if (t >= 1 && onComplete) {
      onComplete();
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Slash principal - arco cortante */}
      <mesh ref={slashRef} position={[0, 0.5, -0.6]} rotation={[0, 0, -Math.PI / 3]}>
        <torusGeometry args={[0.6, 0.08, 8, 32, Math.PI]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Efeito de brilho no centro */}
      <mesh position={[0, 0.5, -0.6]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial
          color="#FFFFFF"
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Linhas de velocidade */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={`line-${i}`}
          position={[
            Math.cos(i * Math.PI / 1.5) * 0.5,
            0.5,
            -0.6 + Math.sin(i * Math.PI / 1.5) * 0.3
          ]}
        >
          <boxGeometry args={[0.6, 0.03, 0.03]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}

      {/* Partículas de impacto */}
      {particles.map((particle, i) => {
        const t = Math.min(progress.current / duration, 1);
        const particlePos = particle.offset.clone()
          .add(particle.velocity.clone().multiplyScalar(t * 0.5));

        const particleOpacity = 1 - t;

        return (
          <mesh key={i} position={[particlePos.x, particlePos.y + 0.5, particlePos.z - 0.6]}>
            <sphereGeometry args={[particle.size, 8, 8]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={particleOpacity}
            />
          </mesh>
        );
      })}

      {/* Onda de choque no chão */}
      <mesh position={[0, 0.05, -0.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.8 * (1 + progress.current * 3), 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={Math.max(0, 0.5 - progress.current)}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Luz dinâmica */}
      <pointLight
        color={color}
        intensity={3 * (1 - progress.current / duration)}
        distance={3}
        position={[0, 0.5, -0.6]}
      />
    </group>
  );
}

export default AttackEffect;
