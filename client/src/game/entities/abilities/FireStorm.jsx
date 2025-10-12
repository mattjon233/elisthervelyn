import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Tempestade de Fogo - Skill da Evelyn
 * Cria um tornado de fogo que gira ao redor do personagem
 */
function FireStorm({ ability }) {
  const groupRef = useRef();
  const [scale, setScale] = useState(0.5);
  const [intensity, setIntensity] = useState(1);
  const timeRef = useRef(0);

  useEffect(() => {
    // Pulsa a intensidade do fogo
    const pulseInterval = setInterval(() => {
      setIntensity(i => 0.7 + Math.random() * 0.6);
    }, 100);

    // Expande levemente
    const expandInterval = setInterval(() => {
      setScale(s => Math.min(s + 0.05, 1.5));
    }, 50);

    return () => {
      clearInterval(pulseInterval);
      clearInterval(expandInterval);
    };
  }, []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      timeRef.current += delta;
      // Rotação rápida do tornado
      groupRef.current.rotation.y += 12 * delta;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Chamas verticais girando */}
      {[...Array(12)].map((_, i) => {
        const angle = (Math.PI * 2 * i) / 12;
        const radius = 2.5;
        const height = 1 + Math.sin(timeRef.current * 5 + i) * 0.5;

        return (
          <group key={i} rotation-y={angle}>
            {/* Chama externa laranja */}
            <mesh
              position={[Math.cos(angle) * radius, height, Math.sin(angle) * radius]}
              scale={[0.4 * scale, 1.5 * scale, 0.4 * scale]}
            >
              <coneGeometry args={[0.5, 2, 8]} />
              <meshStandardMaterial
                color="#FF4500"
                emissive="#FF6347"
                emissiveIntensity={intensity * 2}
                transparent
                opacity={0.8}
              />
            </mesh>

            {/* Chama interna amarela */}
            <mesh
              position={[Math.cos(angle) * radius, height + 0.3, Math.sin(angle) * radius]}
              scale={[0.25 * scale, 1.2 * scale, 0.25 * scale]}
            >
              <coneGeometry args={[0.3, 1.5, 8]} />
              <meshStandardMaterial
                color="#FFD700"
                emissive="#FFA500"
                emissiveIntensity={intensity * 3}
                transparent
                opacity={0.9}
              />
            </mesh>
          </group>
        );
      })}

      {/* Círculo de fogo no chão */}
      <mesh position={[0, 0.1, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[2, 3, 32]} />
        <meshStandardMaterial
          color="#FF4500"
          emissive="#FF0000"
          emissiveIntensity={intensity * 2}
          transparent
          opacity={0.7}
          side={2}
        />
      </mesh>

      {/* Círculo interno mais brilhante */}
      <mesh position={[0, 0.15, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[2.5, 32]} />
        <meshStandardMaterial
          color="#FFA500"
          emissive="#FF4500"
          emissiveIntensity={intensity * 1.5}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Partículas de fogo subindo */}
      {[...Array(20)].map((_, i) => {
        const angle = (Math.PI * 2 * i) / 20;
        const radius = 1.5 + Math.random() * 1;
        const yPos = (timeRef.current * 3 + i * 0.3) % 4;

        return (
          <mesh
            key={`particle-${i}`}
            position={[
              Math.cos(angle + timeRef.current) * radius,
              yPos,
              Math.sin(angle + timeRef.current) * radius
            ]}
          >
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshBasicMaterial
              color={yPos > 2 ? "#FFD700" : "#FF4500"}
              transparent
              opacity={1 - yPos / 4}
            />
          </mesh>
        );
      })}

      {/* Luzes do fogo */}
      <pointLight color="#FF4500" intensity={15 * intensity} distance={8} position={[0, 1, 0]} />
      <pointLight color="#FFA500" intensity={10 * intensity} distance={6} position={[0, 0.5, 0]} />
      <pointLight color="#FFD700" intensity={8 * intensity} distance={4} position={[0, 2, 0]} />

      {/* Luz ambiente quente */}
      {[...Array(4)].map((_, i) => {
        const angle = (Math.PI * 2 * i) / 4;
        return (
          <pointLight
            key={`ambient-${i}`}
            color="#FF6347"
            intensity={5 * intensity}
            distance={5}
            position={[Math.cos(angle) * 2, 0.5, Math.sin(angle) * 2]}
          />
        );
      })}
    </group>
  );
}

export default FireStorm;
