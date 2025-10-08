import { useRef } from 'react';
import * as THREE from 'three';

/**
 * Componente Fantasma - Apenas visual, sem IA.
 * A posição é controlada pelo servidor.
 */
function Ghost({ id, position = [0, 0, 0], health = 20, maxHealth = 20 }) {
  const meshRef = useRef();

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

      {/* Barra de vida */}
      {health > 0 && (
        <mesh position={[0, 1, 0]}>
          <planeGeometry args={[0.6 * (health / maxHealth), 0.1]} />
          <meshBasicMaterial color="#00FFFF" side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

export default Ghost;
