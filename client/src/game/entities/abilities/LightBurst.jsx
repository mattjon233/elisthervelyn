import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Explosão de Luz Rosa - Skill da Esther
 * Cria uma explosão de luz rosa que expande, causa dano em área E CURA!
 */
function LightBurst({ ability }) {
  const groupRef = useRef();
  const [scale, setScale] = useState(0.1);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    // Expande e depois desaparece
    const expandInterval = setInterval(() => {
      setScale(s => {
        const newScale = s + 0.15;
        if (newScale > 3) {
          setOpacity(o => Math.max(0, o - 0.1));
        }
        return newScale;
      });
    }, 16); // ~60fps

    return () => clearInterval(expandInterval);
  }, []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Rotação suave
      groupRef.current.rotation.y += 8 * delta;
      groupRef.current.rotation.x += 4 * delta;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Esfera central grande e brilhante */}
      <mesh scale={scale}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color="#FF69B4"
          emissive="#FF1493"
          emissiveIntensity={3}
          transparent
          opacity={opacity * 0.6}
        />
      </mesh>

      {/* Partículas orbitando */}
      {[...Array(8)].map((_, i) => {
        const angle = (Math.PI * 2 * i) / 8;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * scale * 1.5,
              Math.sin(angle * 2) * scale * 0.5,
              Math.sin(angle) * scale * 1.5
            ]}
          >
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshBasicMaterial color="#FFFFFF" transparent opacity={opacity} />
          </mesh>
        );
      })}

      {/* Anéis de energia */}
      <mesh rotation-x={Math.PI / 2} scale={scale}>
        <ringGeometry args={[0.8, 1.2, 32]} />
        <meshStandardMaterial
          color="#FF1493"
          emissive="#FF69B4"
          emissiveIntensity={2}
          transparent
          opacity={opacity}
          side={2}
        />
      </mesh>

      <mesh rotation-x={Math.PI / 2} rotation-z={Math.PI / 4} scale={scale}>
        <ringGeometry args={[0.6, 0.9, 32]} />
        <meshStandardMaterial
          color="#FFB6D9"
          emissive="#FF69B4"
          emissiveIntensity={2}
          transparent
          opacity={opacity * 0.7}
          side={2}
        />
      </mesh>

      {/* Partículas de cura (verdes) subindo */}
      {[...Array(12)].map((_, i) => {
        const angle = (Math.PI * 2 * i) / 12;
        const radius = 1 + (scale * 0.5);
        return (
          <mesh
            key={`heal-${i}`}
            position={[
              Math.cos(angle) * radius,
              scale * 0.8 + Math.sin(angle * 3) * 0.3,
              Math.sin(angle) * radius
            ]}
          >
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshBasicMaterial color="#00FF88" transparent opacity={opacity * 0.8} />
          </mesh>
        );
      })}

      {/* Cruz de cura no centro */}
      <mesh position={[0, 1.5, 0]} scale={scale * 0.5}>
        <boxGeometry args={[0.3, 1.2, 0.1]} />
        <meshBasicMaterial color="#00FF88" transparent opacity={opacity} />
      </mesh>
      <mesh position={[0, 1.5, 0]} scale={scale * 0.5}>
        <boxGeometry args={[1.2, 0.3, 0.1]} />
        <meshBasicMaterial color="#00FF88" transparent opacity={opacity} />
      </mesh>

      {/* Luz intensa rosa (dano) */}
      <pointLight color="#FF1493" intensity={10 * opacity} distance={8} />
      <pointLight color="#FFFFFF" intensity={5 * opacity} distance={5} />

      {/* Luz verde (cura) */}
      <pointLight color="#00FF88" intensity={8 * opacity} distance={6} position={[0, 2, 0]} />
    </group>
  );
}

export default LightBurst;
