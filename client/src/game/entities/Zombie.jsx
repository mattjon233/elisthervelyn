import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

/**
 * Componente Zumbi - Apenas visual, sem IA.
 * A posição é controlada pelo servidor.
 */
function Zombie({ id, position = [0, 0, 0], health = 30, maxHealth = 30 }) {
  const meshRef = useRef();
  const healthBarRef = useRef();
  const healthPercent = Math.round((health / maxHealth) * 100);

  // DEBUG: Verificar as props de vida recebidas
  console.log(`Zumbi ${id} - Health: ${health}/${maxHealth} (${healthPercent}%)`);

  // Billboard effect - fazer a barra de HP sempre olhar para a câmera
  useFrame(({ camera }) => {
    if (healthBarRef.current) {
      healthBarRef.current.lookAt(camera.position);
    }
  });

  return (
    <group ref={meshRef} position={position}>
      {/* Corpo do zumbi */}
      <mesh castShadow>
        <boxGeometry args={[0.6, 1, 0.4]} />
        <meshStandardMaterial color="#6B8E23" roughness={0.8} />
      </mesh>

      {/* Cabeça */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color="#556B2F" roughness={0.8} />
      </mesh>

      {/* Olhos vermelhos */}
      <mesh position={[-0.1, 0.7, 0.21]}>
        <sphereGeometry args={[0.05]} />
        <meshBasicMaterial color="#FF0000" />
      </mesh>
      <mesh position={[0.1, 0.7, 0.21]}>
        <sphereGeometry args={[0.05]} />
        <meshBasicMaterial color="#FF0000" />
      </mesh>

      {/* Barra de vida melhorada com porcentagem */}
      {health > 0 && (
        <group ref={healthBarRef} position={[0, 1.4, 0]}>
          {/* Fundo preto da barra */}
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[1, 0.15]} />
            <meshBasicMaterial color="#000000" side={THREE.DoubleSide} />
          </mesh>

          {/* Barra de HP vermelha */}
          <mesh position={[-(1 - (health / maxHealth)) / 2, 0, 0]}>
            <planeGeometry args={[1 * (health / maxHealth), 0.12]} />
            <meshBasicMaterial color="#FF0000" side={THREE.DoubleSide} />
          </mesh>

          {/* Borda branca */}
          <lineSegments>
            <edgesGeometry attach="geometry" args={[new THREE.PlaneGeometry(1, 0.15)]} />
            <lineBasicMaterial attach="material" color="#FFFFFF" linewidth={2} />
          </lineSegments>

          {/* Texto da porcentagem */}
          <Text
            position={[0, 0.25, 0]}
            fontSize={0.15}
            color="#FFFFFF"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            {healthPercent}%
          </Text>
        </group>
      )}
    </group>
  );
}

export default Zombie;
