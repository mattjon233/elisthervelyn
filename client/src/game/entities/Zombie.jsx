import { useRef } from 'react';
import * as THREE from 'three';

/**
 * Componente Zumbi - Apenas visual, sem IA.
 * A posição é controlada pelo servidor.
 */
function Zombie({ id, position = [0, 0, 0], health = 30, maxHealth = 30 }) {
  const meshRef = useRef();

  // DEBUG: Verificar as props de vida recebidas
  console.log(`Zumbi ${id} - Health: ${health}/${maxHealth}`);

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

      {/* Barra de vida */}
      {health > 0 && (
        <mesh position={[0, 1.3, 0]}>
          <planeGeometry args={[0.6 * (health / maxHealth), 0.1]} />
          <meshBasicMaterial color="#FF0000" side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

export default Zombie;
