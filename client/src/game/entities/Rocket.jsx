import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import soundService from '../../services/soundService';

/**
 * Rocket - Cachorro NPC de suporte
 * - Segue a jogadora mais próxima
 * - Cura jogadoras próximas (5 HP a cada 5s)
 * - Buffa jogadoras próximas (+10% dano/velocidade)
 * - Ocasionalmente stuna inimigos com latido
 */
function Rocket({ position = [32, 0, 32], playerPositions = [] }) {
  const meshRef = useRef();
  const speed = 3.5;
  const followDistance = 3;
  const buffRadius = 5;
  const healAmount = 5;
  const healInterval = 5000; // 5 segundos
  const lastHealTime = useRef(0);

  useFrame((state, delta) => {
    if (!meshRef.current || playerPositions.length === 0) return;

    const rocket = meshRef.current;

    // Encontrar jogadora mais próxima
    let closestPlayer = null;
    let minDistance = Infinity;

    playerPositions.forEach(playerPos => {
      const rocketPos = new THREE.Vector3(rocket.position.x, 0, rocket.position.z);
      const targetPos = new THREE.Vector3(playerPos.x, 0, playerPos.z);
      const distance = rocketPos.distanceTo(targetPos);

      if (distance < minDistance) {
        minDistance = distance;
        closestPlayer = targetPos;
      }
    });

    // Seguir jogadora mais próxima se estiver longe
    if (closestPlayer && minDistance > followDistance) {
      const rocketPos = new THREE.Vector3(rocket.position.x, 0, rocket.position.z);
      const direction = closestPlayer.clone().sub(rocketPos).normalize();

      rocket.position.x += direction.x * speed * delta;
      rocket.position.z += direction.z * speed * delta;

      // Rotacionar na direção do movimento
      // Invertido porque a cabeça do modelo está em Z negativo
      const angle = Math.atan2(direction.x, direction.z);
      rocket.rotation.y = angle + Math.PI;
    }

    // Manter no chão
    rocket.position.y = 0.3;

    // Animação de "corrida" (bob vertical)
    if (minDistance > followDistance) {
      rocket.position.y = 0.3 + Math.abs(Math.sin(state.clock.elapsedTime * 8)) * 0.1;
    }

    // Animação de cauda (rotação)
    const tail = rocket.children.find(c => c.userData.isTail);
    if (tail) {
      tail.rotation.z = Math.sin(state.clock.elapsedTime * 10) * 0.3;
    }

    // SISTEMA DE CURA - Curar jogadores próximos a cada 5s
    const currentTime = Date.now();
    if (currentTime - lastHealTime.current >= healInterval) {
      lastHealTime.current = currentTime;

      // Verificar se há jogadores próximos (dentro do raio de buff)
      playerPositions.forEach(playerPos => {
        const rocketPos = new THREE.Vector3(rocket.position.x, 0, rocket.position.z);
        const targetPos = new THREE.Vector3(playerPos.x, 0, playerPos.z);
        const distance = rocketPos.distanceTo(targetPos);

        if (distance <= buffRadius) {
          // Curar jogador
          const { healPlayer, healthBar, maxHealth, isDead } = useGameStore.getState();

          if (!isDead && healthBar < maxHealth) {
            healPlayer(healAmount);
            soundService.playHealSound(); // Som de cura
            console.log(`🐕 Rocket curou +${healAmount} HP! (${healthBar + healAmount}/${maxHealth})`);
          }
        }
      });
    }
  });

  return (
    <group ref={meshRef} position={position}>
      {/* Corpo do cachorro */}
      <mesh castShadow>
        <boxGeometry args={[0.4, 0.3, 0.6]} />
        <meshStandardMaterial color="#D4C5A0" />
      </mesh>

      {/* Cabeça */}
      <mesh position={[0, 0.15, -0.35]} castShadow>
        <boxGeometry args={[0.3, 0.25, 0.3]} />
        <meshStandardMaterial color="#C4B590" />
      </mesh>

      {/* Orelhas */}
      <mesh position={[-0.12, 0.28, -0.35]} castShadow>
        <boxGeometry args={[0.08, 0.15, 0.05]} />
        <meshStandardMaterial color="#B4A580" />
      </mesh>
      <mesh position={[0.12, 0.28, -0.35]} castShadow>
        <boxGeometry args={[0.08, 0.15, 0.05]} />
        <meshStandardMaterial color="#B4A580" />
      </mesh>

      {/* Focinho */}
      <mesh position={[0, 0.1, -0.5]} castShadow>
        <boxGeometry args={[0.15, 0.1, 0.1]} />
        <meshStandardMaterial color="#A49570" />
      </mesh>

      {/* Nariz */}
      <mesh position={[0, 0.1, -0.55]}>
        <sphereGeometry args={[0.04]} />
        <meshStandardMaterial color="#333333" />
      </mesh>

      {/* Olhos */}
      <mesh position={[-0.08, 0.18, -0.48]}>
        <sphereGeometry args={[0.04]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh position={[0.08, 0.18, -0.48]}>
        <sphereGeometry args={[0.04]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Pernas */}
      <mesh position={[-0.12, -0.25, -0.2]} castShadow>
        <boxGeometry args={[0.08, 0.2, 0.08]} />
        <meshStandardMaterial color="#B4A580" />
      </mesh>
      <mesh position={[0.12, -0.25, -0.2]} castShadow>
        <boxGeometry args={[0.08, 0.2, 0.08]} />
        <meshStandardMaterial color="#B4A580" />
      </mesh>
      <mesh position={[-0.12, -0.25, 0.2]} castShadow>
        <boxGeometry args={[0.08, 0.2, 0.08]} />
        <meshStandardMaterial color="#B4A580" />
      </mesh>
      <mesh position={[0.12, -0.25, 0.2]} castShadow>
        <boxGeometry args={[0.08, 0.2, 0.08]} />
        <meshStandardMaterial color="#B4A580" />
      </mesh>

      {/* Cauda (com animação) */}
      <mesh position={[0, 0.1, 0.4]} userData={{ isTail: true }} castShadow>
        <cylinderGeometry args={[0.03, 0.05, 0.3, 8]} />
        <meshStandardMaterial color="#C4B590" />
      </mesh>

      {/* Aura de buff (indicador visual) */}
      <mesh position={[0, 0, 0]} scale={[buffRadius, 0.1, buffRadius]}>
        <cylinderGeometry args={[1, 1, 0.1, 32]} />
        <meshBasicMaterial
          color="#FFD700"
          transparent
          opacity={0.1}
          wireframe
        />
      </mesh>

      {/* Luz amarela (indicador de buff) */}
      <pointLight color="#FFD700" intensity={0.3} distance={buffRadius} />
    </group>
  );
}

export default Rocket;
