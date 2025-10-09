import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

/**
 * Componente Fantasma - Apenas visual, sem IA.
 * A posição é controlada pelo servidor.
 */
function Ghost({ id, position = [0, 0, 0], health = 20, maxHealth = 20 }) {
  const meshRef = useRef();
  const healthBarRef = useRef();
  const healthPercent = Math.round((health / maxHealth) * 100);

  // Billboard effect - fazer a barra de HP sempre olhar para a câmera
  useFrame(({ camera }) => {
    if (healthBarRef.current) {
      healthBarRef.current.lookAt(camera.position);
    }
  });

  return (
    <group ref={meshRef} position={position}>
      {/* Corpo do fantasma (esfera semi-transparente) */}
      <mesh castShadow>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial
          color="#E6E6FA"
          transparent
          opacity={0.6}
          emissive="#E6E6FA"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Cauda do fantasma (cone invertido) */}
      <mesh position={[0, -0.4, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[0.3, 0.6, 8]} />
        <meshStandardMaterial
          color="#E6E6FA"
          transparent
          opacity={0.5}
          emissive="#E6E6FA"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Olhos brilhantes */}
      <mesh position={[-0.15, 0.1, 0.4]}>
        <sphereGeometry args={[0.08]} />
        <meshBasicMaterial color="#00FFFF" />
      </mesh>
      <mesh position={[0.15, 0.1, 0.4]}>
        <sphereGeometry args={[0.08]} />
        <meshBasicMaterial color="#00FFFF" />
      </mesh>

      {/* Aura fantasmagórica */}
      <pointLight color="#E6E6FA" intensity={0.5} distance={3} />

      {/* Barra de vida melhorada com porcentagem */}
      {health > 0 && (
        <group ref={healthBarRef} position={[0, 1.1, 0]}>
          {/* Fundo preto da barra */}
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[1, 0.15]} />
            <meshBasicMaterial color="#000000" side={THREE.DoubleSide} />
          </mesh>

          {/* Barra de HP ciano */}
          <mesh position={[-(1 - (health / maxHealth)) / 2, 0, 0]}>
            <planeGeometry args={[1 * (health / maxHealth), 0.12]} />
            <meshBasicMaterial color="#00FFFF" side={THREE.DoubleSide} />
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

export default Ghost;
