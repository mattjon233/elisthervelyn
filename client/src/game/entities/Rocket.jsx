import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useGameStore } from '../../store/gameStore';
import { useShopStore } from '../../store/shopStore';
import soundService from '../../services/soundService';
import socketService from '../../services/socket';
import CooldownTimer from '../../components/CooldownTimer';

/**
 * Rocket - Cachorro NPC de suporte
 */
function Rocket({ position = [32, 0, 32] }) {
  const meshRef = useRef();
  const lastHealTime = useRef(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const players = useGameStore((state) => state.players);
  const playerId = useGameStore((state) => state.playerId);
  const upgrades = useShopStore((state) => state.upgrades);

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

    // --- Lógica de Cooldown ---
    const elapsedSinceHeal = currentTime - lastHealTime.current;
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

    // --- SISTEMA DE CURA ---
    // Apenas o "host" (primeiro jogador da lista) deve executar a lógica de cura da área
    // para evitar que múltiplos clientes enviem os mesmos eventos de cura.
    const isHost = players.length > 0 && players[0].id === playerId;

    if (isHost && currentTime - lastHealTime.current >= healInterval) {
      lastHealTime.current = currentTime;

      const rocketPos = new THREE.Vector3(meshRef.current.position.x, 0, meshRef.current.position.z);

      const playersToHeal = players.filter(player => {
        if (!player.position || player.health <= 0) return false; // Não curar jogadores mortos
        const playerPos = new THREE.Vector3(player.position.x, 0, player.position.z);
        return rocketPos.distanceTo(playerPos) <= buffRadius;
      });

      if (playersToHeal.length > 0) {
        playersToHeal.forEach(player => {
          console.log(`🐕 Rocket (host) curando ${player.id} em +${healAmount} HP!`);
          socketService.emit('player_heal_area', {
            targetId: player.id,
            amount: healAmount
          });
        });
        soundService.playHealSound();
      }
    }
  });

  return (
    <group ref={meshRef} position={position}>
      {/* Indicador de Cooldown */}
      <Html position={[0, 1.2, 0]} center>
        <CooldownTimer remainingTime={cooldownRemaining} duration={healInterval / 1000} />
      </Html>

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