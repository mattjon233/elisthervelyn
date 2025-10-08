import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const projectileSpeed = 30;

function ArrowProjectile({ ability, initialPosition, initialRotation, onHit, enemies }) {
  const meshRef = useRef();
  const [isDestroyed, setIsDestroyed] = useState(false);

  // Define a direção inicial baseada na rotação do jogador
  const direction = useRef(new THREE.Vector3(0, 0, -1).applyEuler(initialRotation).normalize());

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(initialPosition);
      // Aponta a flecha na direção do movimento
      meshRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.current);
    }
  }, [initialPosition, initialRotation]);

  useFrame((state, delta) => {
    if (!meshRef.current || isDestroyed) return;

    // Mover o projétil
    meshRef.current.position.add(direction.current.clone().multiplyScalar(projectileSpeed * delta));

    // Verificar colisão com inimigos
    for (const enemy of enemies) {
      const enemyPosition = new THREE.Vector3(...enemy.position);
      if (meshRef.current.position.distanceTo(enemyPosition) < 1.0) { // Raio de colisão
        console.log(`🏹 Flecha atingiu ${enemy.id}!`);
        if (onHit) {
          // Passa o ID do inimigo para a função de dano de alvo único
          onHit(ability, enemy.id);
        }
        setIsDestroyed(true);
        return;
      }
    }

    // Destruir se passar do alcance
    if (initialPosition && meshRef.current.position.distanceTo(initialPosition) > ability.range) {
      setIsDestroyed(true);
    }
  });

  if (isDestroyed) return null;

  return (
    <group ref={meshRef}>
      {/* Flecha principal */}
      <mesh>
        <coneGeometry args={[0.1, 0.8, 8]} />
        <meshStandardMaterial color="#FF69B4" emissive="#FF1493" emissiveIntensity={0.8} />
      </mesh>
      {/* Trilha da flecha para melhor visibilidade */}
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color="#FF69B4" transparent opacity={0.4} />
      </mesh>
      {/* Partículas de energia */}
      <pointLight color="#FF1493" intensity={1} distance={2} />
    </group>
  );
}

export default ArrowProjectile;