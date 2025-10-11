import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

/**
 * Componente Slime (Gosma) - Apenas visual, sem IA.
 * A posição é controlada pelo servidor.
 * Gosma rosa e verde escuro, lento mas dá 40 de dano
 */
function Slime({ id, position = [0, 0, 0], health = 60, maxHealth = 60 }) {
  const meshRef = useRef();
  const healthBarRef = useRef();
  const healthPercent = Math.round((health / maxHealth) * 100);

  // Animação de flutuação e pulsação
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const time = clock.getElapsedTime();
      meshRef.current.position.y = Math.sin(time * 2) * 0.1;
      meshRef.current.scale.y = 1 + Math.sin(time * 3) * 0.1;
    }
  });

  // Billboard effect - fazer a barra de HP sempre olhar para a câmera
  useFrame(({ camera }) => {
    if (healthBarRef.current) {
      healthBarRef.current.lookAt(camera.position);
    }
  });

  return (
    <group position={position}>
      {/* Corpo principal da gosma (rosa) */}
      <mesh ref={meshRef} castShadow position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial
          color="#FF69B4"
          roughness={0.3}
          metalness={0.1}
          emissive="#FF69B4"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Manchas verdes escuras */}
      <mesh castShadow position={[0.2, 0.5, 0.2]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial
          color="#2F4F2F"
          roughness={0.4}
        />
      </mesh>
      <mesh castShadow position={[-0.15, 0.4, 0.25]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial
          color="#2F4F2F"
          roughness={0.4}
        />
      </mesh>
      <mesh castShadow position={[0.1, 0.35, -0.2]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial
          color="#2F4F2F"
          roughness={0.4}
        />
      </mesh>

      {/* Olhos da gosma */}
      <mesh position={[-0.15, 0.5, 0.45]}>
        <sphereGeometry args={[0.08]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh position={[0.15, 0.5, 0.45]}>
        <sphereGeometry args={[0.08]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Brilho nos olhos */}
      <mesh position={[-0.13, 0.52, 0.48]}>
        <sphereGeometry args={[0.03]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[0.17, 0.52, 0.48]}>
        <sphereGeometry args={[0.03]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>

      {/* Barra de vida */}
      {health > 0 && (
        <group ref={healthBarRef} position={[0, 1.2, 0]}>
          {/* Fundo preto da barra */}
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[1, 0.15]} />
            <meshBasicMaterial color="#000000" side={THREE.DoubleSide} />
          </mesh>

          {/* Barra de HP verde */}
          <mesh position={[-(1 - (health / maxHealth)) / 2, 0, 0]}>
            <planeGeometry args={[1 * (health / maxHealth), 0.12]} />
            <meshBasicMaterial color="#00FF00" side={THREE.DoubleSide} />
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

      {/* Luz rosa suave */}
      <pointLight position={[0, 0.5, 0]} color="#FF69B4" intensity={0.3} distance={3} />
    </group>
  );
}

export default Slime;
