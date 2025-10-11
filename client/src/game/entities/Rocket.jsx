import { useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useGameStore } from '../../store/gameStore';
import { useShopStore } from '../../store/shopStore';
import soundService from '../../services/soundService';
import socketService from '../../services/socket';
import CooldownTimer from '../../components/CooldownTimer';
import { cemeteryObstacles } from './Cemetery';
import { playgroundObstacles } from './Playground';
import { foodCourtObstacles } from './FoodCourt';
import { npcObstacles } from '../data/npcPositions';
import { friendlyNpcObstacles } from '../data/friendlyNpcData';

/**
 * Rocket - Cachorro NPC de suporte
 */
const Rocket = forwardRef(({ position = [32, 0, 32] }, ref) => {
  const meshRef = useRef();
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Expor a ref do mesh para o componente pai (GameScene)
  useImperativeHandle(ref, () => meshRef.current);

  const { 
    players, playerId, rocketState, isDead, currentDialogue,
    isCinematicOpen, isSkillTreeOpen
  } = useGameStore();
  const { upgrades, isShopOpen } = useShopStore();

  // Determina se alguma UI modal está ativa
  const isUIActive = isShopOpen || isCinematicOpen || isSkillTreeOpen || currentDialogue || isDead;

  // Parâmetros base do Rocket
  const baseSpeed = 3.5;
  const baseHealAmount = 5;
  const baseHealInterval = 20000; // 20 segundos

  // Aplicar melhorias
  const speed = upgrades.rocketSpeed ? baseSpeed * 2 : baseSpeed;
  const healAmount = upgrades.healAmount ? 10 : baseHealAmount;
  const healInterval = upgrades.healCooldown ? 10000 : baseHealInterval;

  const followDistance = 3;
  const buffRadius = 5;

  useFrame((state, delta) => {
    const playerPositions = players.map(p => p.position).filter(Boolean);

    if (!meshRef.current || playerPositions.length === 0) {
      setCooldownRemaining(0);
      return;
    }

    const rocket = meshRef.current;
    const currentTime = Date.now();

    // --- Lógica de Cooldown (sincronizado com servidor) ---
    const elapsedSinceHeal = currentTime - rocketState.lastHealTime;
    const remainingCooldown = healInterval - elapsedSinceHeal;

    if (remainingCooldown > 0) {
      setCooldownRemaining(remainingCooldown / 1000);
    } else {
      setCooldownRemaining(0);
    }

    // --- Lógica de Movimento ---
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

    if (closestPlayer && minDistance > followDistance) {
      const direction = closestPlayer.clone().sub(rocket.position).normalize();
      rocket.position.x += direction.x * speed * delta;
      rocket.position.z += direction.z * speed * delta;
      const angle = Math.atan2(direction.x, direction.z);
      rocket.rotation.y = angle + Math.PI;
    }

    rocket.position.y = 0.3;
    if (minDistance > followDistance) {
      rocket.position.y = 0.3 + Math.abs(Math.sin(state.clock.elapsedTime * 8)) * 0.1;
    }

    const tail = rocket.children.find(c => c.userData.isTail);
    if (tail) {
      tail.rotation.z = Math.sin(state.clock.elapsedTime * 10) * 0.3;
    }

    // --- LÓGICA DE COLISÃO MANUAL (sincronizada com usePlayerControls.js) ---
    const rocketRadius = 0.3; // Raio de colisão para o Rocket

    // 1. Colisão com paredes do mapa
    const mapLimit = 49;
    rocket.position.x = Math.max(-mapLimit, Math.min(mapLimit, rocket.position.x));
    rocket.position.z = Math.max(-mapLimit, Math.min(mapLimit, rocket.position.z));

    // 2. Colisão com paredes da mansão
    const mansionX = -30;
    const mansionZ = 30;
    const mansionWidth = 16;
    const mansionDepth = 14;
    const wallThickness = 0.5;
    const left = mansionX - mansionWidth / 2;
    const right = mansionX + mansionWidth / 2;
    const front = mansionZ - mansionDepth / 2;
    const back = mansionZ + mansionDepth / 2;
    const doorWidth = 4;
    const doorLeft = mansionX - doorWidth / 2;
    const doorRight = mansionX + doorWidth / 2;

    const rocketX = rocket.position.x;
    const rocketZ = rocket.position.z;

    if (rocketX >= left - rocketRadius && rocketX <= left + wallThickness + rocketRadius && rocketZ >= front && rocketZ <= back) {
      rocket.position.x = left - rocketRadius;
    }
    if (rocketX >= right - wallThickness - rocketRadius && rocketX <= right + rocketRadius && rocketZ >= front && rocketZ <= back) {
      rocket.position.x = right + rocketRadius;
    }
    if (rocketX >= left && rocketX <= doorLeft && rocketZ >= front - rocketRadius && rocketZ <= front + wallThickness + rocketRadius) {
      rocket.position.z = front - rocketRadius;
    }
    if (rocketX >= doorRight && rocketX <= right && rocketZ >= front - rocketRadius && rocketZ <= front + wallThickness + rocketRadius) {
      rocket.position.z = front - rocketRadius;
    }
    if (rocketX >= left && rocketX <= right && rocketZ >= back - wallThickness - rocketRadius && rocketZ <= back + rocketRadius) {
      rocket.position.z = back + rocketRadius;
    }

    // 3. Colisão com objetos do cenário (incluindo cemitério)
    const staticObstacles = [
      { type: 'sphere', x: 10, z: -10, radius: 1.5 }, { type: 'sphere', x: -12, z: -8, radius: 1.2 },
      { type: 'sphere', x: 15, z: 5, radius: 1.8 }, { type: 'sphere', x: -10, z: 8, radius: 1.3 },
      { type: 'sphere', x: 8, z: 12, radius: 1.4 }, { type: 'sphere', x: -15, z: -15, radius: 1.6 },
      { type: 'sphere', x: -5, z: -12, radius: 1.2 }, { type: 'sphere', x: 12, z: -5, radius: 0.9 },
      { type: 'sphere', x: -8, z: 10, radius: 1.1 }, { type: 'sphere', x: 5, z: 15, radius: 0.9 },
      { type: 'sphere', x: 18, z: -12, radius: 1.2 },
    ];

    const allObstacles = [...staticObstacles, ...cemeteryObstacles, ...npcObstacles, ...playgroundObstacles, ...foodCourtObstacles, ...friendlyNpcObstacles];

    allObstacles.forEach(obstacle => {
      if (obstacle.type === 'sphere') {
        const dx = rocket.position.x - obstacle.x;
        const dz = rocket.position.z - obstacle.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance < obstacle.radius + rocketRadius) {
          const angle = Math.atan2(dz, dx);
          rocket.position.x = obstacle.x + Math.cos(angle) * (obstacle.radius + rocketRadius);
          rocket.position.z = obstacle.z + Math.sin(angle) * (obstacle.radius + rocketRadius);
        }
      } else if (obstacle.type === 'box') {
        const halfWidth = obstacle.width / 2;
        const halfDepth = obstacle.depth / 2;
        
        const closestX = Math.max(obstacle.x - halfWidth, Math.min(rocket.position.x, obstacle.x + halfWidth));
        const closestZ = Math.max(obstacle.z - halfDepth, Math.min(rocket.position.z, obstacle.z + halfDepth));

        const dx = rocket.position.x - closestX;
        const dz = rocket.position.z - closestZ;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance < rocketRadius) {
          const overlap = rocketRadius - distance;
          const angle = Math.atan2(dz, dx);
          
          if (distance === 0) {
             const distToMinX = rocket.position.x - (obstacle.x - halfWidth);
             const distToMaxX = (obstacle.x + halfWidth) - rocket.position.x;
             const distToMinZ = rocket.position.z - (obstacle.z - halfDepth);
             const distToMaxZ = (obstacle.z + halfDepth) - rocket.position.z;
             const minOverlap = Math.min(distToMinX, distToMaxX, distToMinZ, distToMaxZ);

             if (minOverlap === distToMinX) rocket.position.x -= overlap;
             else if (minOverlap === distToMaxX) rocket.position.x += overlap;
             else if (minOverlap === distToMinZ) rocket.position.z -= overlap;
             else rocket.position.z += overlap;
          } else {
             rocket.position.x += Math.cos(angle) * overlap;
             rocket.position.z += Math.sin(angle) * overlap;
          }
        }
      }
    });

    // --- FIM DA LÓGICA DE COLISÃO ---


    // --- SISTEMA DE CURA ---
    // Apenas o "host" (primeiro jogador da lista) deve executar a lógica de cura da área
    // para evitar que múltiplos clientes enviem os mesmos eventos de cura.
    const isHost = players.length > 0 && players[0].id === playerId;

    if (isHost && currentTime - rocketState.lastHealTime >= healInterval) {
      const rocketPos = new THREE.Vector3(meshRef.current.position.x, 0, meshRef.current.position.z);

      const playersToHeal = players.filter(player => {
        if (!player.position || player.health <= 0) return false; // Não curar jogadores mortos
        const playerPos = new THREE.Vector3(player.position.x, 0, player.position.z);
        return rocketPos.distanceTo(playerPos) <= buffRadius;
      });

      if (playersToHeal.length > 0) {
        // Enviar TODAS as curas em um único evento para o servidor processar atomicamente
        console.log(`🐕 Rocket (host) curando ${playersToHeal.length} jogadoras em +${healAmount} HP cada!`);
        socketService.emit('rocket_heal_area', {
          targetIds: playersToHeal.map(p => p.id),
          amount: healAmount
        });
        soundService.playHealSound();
      }
    }
  });

  return (
    <group ref={meshRef} position={position}>
      {/* Indicador de Cooldown - Visível apenas quando não há UI modal ativa */}
      {!isUIActive && (
        <Html position={[0, 1.2, 0]} center>
          <CooldownTimer remainingTime={cooldownRemaining} duration={healInterval / 1000} />
        </Html>
      )}

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
});

export default Rocket;