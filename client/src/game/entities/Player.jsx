import { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { usePlayerControls } from '../hooks/usePlayerControls';
import { useThirdPersonCamera } from '../hooks/useThirdPersonCamera';
import { useCombat } from '../hooks/useCombat';
import { useAbility } from '../hooks/useAbility';
import { useInvulnerability } from '../hooks/useInvulnerability';
import { useLevelStore } from '../../store/levelStore';
import socketService from '../../services/socket';
import soundService from '../../services/soundService';
import AttackEffect from './AttackEffect';
import LightBurst from './abilities/LightBurst';
import BladeSpinEffect from './abilities/BladeSpinEffect';
import FireStorm from './abilities/FireStorm';

import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/gameStore';
import * as THREE from 'three';

const Player = forwardRef(({ character, position = [0, 0.5, 0], isLocalPlayer = true, onControlsReady, onAbilityImpact, onAbilityHitTarget, enemies }, ref) => {
  const meshRef = useRef();
  const materialRef = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();
  const [showAttackEffect, setShowAttackEffect] = useState(false);
  const attackAnimProgress = useRef(0);
  const walkCycle = useRef(0);

  // Cores por personagem
  const colors = {
    esther: '#FFB6D9',
    elissa: '#D4A5D4',
    evelyn: '#A8D8EA'
  };

  const color = colors[character?.id] || '#FFB6D9';

  // Pega o estado do jogador da store para invulnerabilidade
  const { players, playerId } = useGameStore();
  const playerData = players.find(p => p.id === playerId);
  const isDead = isLocalPlayer && playerData ? playerData.health <= 0 : false;

  // Bonus de skills
  const { bonuses } = useLevelStore();
  const playerSpeed = 8.0 * bonuses.speedMultiplier; // Aplica bonus de velocidade

  // DEBUG: Log dos bonuses ativos
  useEffect(() => {
    if (isLocalPlayer) {
      console.log('🔧 DEBUG Player Bonuses:', {
        speedMultiplier: bonuses.speedMultiplier,
        calculatedSpeed: playerSpeed,
        maxHealthBonus: bonuses.maxHealthBonus,
        abilityCooldownMultiplier: bonuses.abilityCooldownMultiplier,
        damageMultiplier: bonuses.damageMultiplier,
        hasInvulnerability: bonuses.hasInvulnerability,
        instakillChance: bonuses.instakillChance
      });
    }
  }, [bonuses, isLocalPlayer, playerSpeed]);

  // Câmera third-person (apenas para o jogador local)
  const cameraControls = isLocalPlayer ? useThirdPersonCamera(meshRef) : null;

  // Habilidades (apenas para o jogador local)
  const { abilityState, triggerAbility, activeAbilities } = isLocalPlayer
    ? useAbility(character)
    : { abilityState: {}, triggerAbility: () => {}, activeAbilities: [] };

  // Invulnerabilidade (apenas para o jogador local)
  const invulnerability = isLocalPlayer ? useInvulnerability() : null;

  // Controles (apenas para o jogador local) - passa o ref do ângulo da câmera e velocidade com bonus
  const controls = isLocalPlayer
    ? usePlayerControls(meshRef, playerSpeed, triggerAbility, isDead, cameraControls?.cameraAngleRef)
    : null;

  // Sistema de combate (apenas para o jogador local)
  const combat = isLocalPlayer && controls
    ? useCombat(meshRef, character, controls.isAttacking)
    : null;

  // Efeito de invulnerabilidade, animação de ataque e animação de caminhada
  useFrame(({ clock }, delta) => {
    if (isLocalPlayer && materialRef.current) {
      // Invulnerabilidade do servidor (após tomar dano) OU da skill T
      const serverInvuln = playerData?.invulnerableUntil && Date.now() < playerData.invulnerableUntil;
      const skillInvuln = invulnerability?.isInvulnerable || false;
      const isInvulnerable = serverInvuln || skillInvuln;

      if (isInvulnerable) {
        // Faz o personagem piscar com um brilho (dourado se skill T, branco se servidor)
        const pulse = (Math.sin(clock.elapsedTime * 30) + 1) / 2; // 0 a 1
        if (skillInvuln) {
          // Brilho dourado para skill T
          materialRef.current.emissive.setRGB(pulse, pulse * 0.8, 0);
        } else {
          // Brilho branco para invuln do servidor
          materialRef.current.emissive.setRGB(pulse, pulse, pulse);
        }
      } else {
        materialRef.current.emissive.setRGB(0, 0, 0); // Remove o brilho
      }
    }

    // Animação de caminhada (perninhas)
    if (isLocalPlayer && controls && leftLegRef.current && rightLegRef.current) {
      const isMoving = controls.keys && (controls.keys.w || controls.keys.a || controls.keys.s || controls.keys.d);

      if (isMoving) {
        walkCycle.current += delta * 8; // Velocidade da caminhada

        // Movimento alternado das pernas
        const legSwing = Math.sin(walkCycle.current) * 0.5; // Amplitude do balanço

        leftLegRef.current.rotation.x = legSwing;
        rightLegRef.current.rotation.x = -legSwing; // Invertido

        // Pequeno movimento vertical (bounce)
        if (meshRef.current) {
          const bounce = Math.abs(Math.sin(walkCycle.current * 2)) * 0.05;
          meshRef.current.position.y = 0.5 + bounce;
        }
      } else {
        // Quando parado, volta as pernas para posição neutra suavemente
        if (leftLegRef.current) leftLegRef.current.rotation.x *= 0.85;
        if (rightLegRef.current) rightLegRef.current.rotation.x *= 0.85;
        if (meshRef.current && meshRef.current.position.y > 0.5) {
          meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, 0.5, 0.1);
        }
      }
    }

    // Animação de ataque - movimento para frente
    if (showAttackEffect && meshRef.current) {
      attackAnimProgress.current += delta * 10; // Velocidade da animação

      if (attackAnimProgress.current < 1) {
        // Primeira metade: avança para frente
        const forwardPush = Math.sin(attackAnimProgress.current * Math.PI) * 0.3;
        const tempRotation = meshRef.current.rotation.y;
        meshRef.current.position.z -= Math.cos(tempRotation) * forwardPush * delta * 5;
        meshRef.current.position.x -= Math.sin(tempRotation) * forwardPush * delta * 5;

        // Pequena inclinação para frente
        meshRef.current.rotation.x = -Math.sin(attackAnimProgress.current * Math.PI) * 0.2;
      } else {
        // Volta à posição normal
        meshRef.current.rotation.x = 0;
        attackAnimProgress.current = 0;
      }
    } else {
      attackAnimProgress.current = 0;
      if (meshRef.current) {
        meshRef.current.rotation.x = 0;
      }
    }
  });

  // Expor referência e controles
  useImperativeHandle(ref, () => ({
    position: meshRef.current?.position,
    rotation: meshRef.current?.rotation,
    controls: controls,
    activeAbilities: activeAbilities, // Expor habilidades ativas
    invulnerability: invulnerability, // Expor invulnerabilidade
    abilityState: abilityState, // Expor estado das habilidades (cooldowns)
    cameraControls: cameraControls, // Expor controles da câmera
  }));

  // Notificar quando controles estão prontos
  useEffect(() => {
    if (controls && onControlsReady) {
      onControlsReady(controls);
    }
  }, [controls, onControlsReady]);

  // Mostrar efeito de ataque
  useEffect(() => {
    if (controls?.isAttacking) {
      setShowAttackEffect(true);
      soundService.playAttackSound(); // Som de ataque
    }
  }, [controls?.isAttacking]);

  // Ativar invulnerabilidade quando tecla T é pressionada
  useEffect(() => {
    if (controls?.keys?.invulnerability && invulnerability) {
      invulnerability.activate();
    }
  }, [controls?.keys?.invulnerability, invulnerability]);

  // Enviar posição via Socket.io (throttled)
  useEffect(() => {
    if (!isLocalPlayer || !meshRef.current) return;

    const interval = setInterval(() => {
      const pos = meshRef.current.position;
      const rot = meshRef.current.rotation;

      socketService.sendMovement(
        { x: pos.x, y: pos.y, z: pos.z },
        { x: rot.x, y: rot.y, z: rot.z }
      );
    }, 50); // 20 updates/segundo

    return () => clearInterval(interval);
  }, [isLocalPlayer]);

  // Log de habilidades ativas
  useEffect(() => {
    if (activeAbilities.length > 0) {
      console.log('Habilidades ativas:', activeAbilities);
    }
  }, [activeAbilities]);

  // Configurações por personagem
  const heightScale = character?.id === 'esther' ? 0.9 : 1.0; // Esther um pouco mais baixa
  const skinColor = '#ffd5bd';

  // Cores de cabelo
  const hairColors = {
    esther: '#8B6F47',  // Castanho claro
    elissa: '#3E2723',  // Castanho escuro
    evelyn: '#8B6F47'   // Castanho claro
  };
  const hairColor = hairColors[character?.id] || '#8B6F47';

  // Não renderizar se estiver morto
  if (isDead) {
    return null;
  }

  return (
    <group ref={meshRef} position={position}>
      {/* Indicador visual no chão - anel sutil colorido */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.28, 0.35, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.5}
          side={2}
        />
      </mesh>

      {/* Círculo interno brilhante */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.27, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.2}
        />
      </mesh>

      {/* Pernas com animação - ponto de pivô no topo */}
      <group ref={leftLegRef} position={[-0.12, 0.35 * heightScale, 0]}>
        <mesh castShadow position={[0, -0.15 * heightScale, 0]}>
          <capsuleGeometry args={[0.08, 0.3 * heightScale, 8, 16]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      </group>
      <group ref={rightLegRef} position={[0.12, 0.35 * heightScale, 0]}>
        <mesh castShadow position={[0, -0.15 * heightScale, 0]}>
          <capsuleGeometry args={[0.08, 0.3 * heightScale, 8, 16]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      </group>

      {/* Torso */}
      <mesh castShadow position={[0, 0.55 * heightScale, 0]}>
        <capsuleGeometry args={[0.2, 0.4 * heightScale, 16, 32]} />
        <meshStandardMaterial ref={materialRef} color={color} roughness={0.7} />
      </mesh>

      {/* Braços */}
      <mesh castShadow position={[-0.28, 0.57 * heightScale, 0]} rotation={[0, 0, 0.1]}>
        <capsuleGeometry args={[0.06, 0.35 * heightScale, 8, 16]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0.28, 0.57 * heightScale, 0]} rotation={[0, 0, -0.1]}>
        <capsuleGeometry args={[0.06, 0.35 * heightScale, 8, 16]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>

      {/* Pescoço */}
      <mesh castShadow position={[0, 0.78 * heightScale, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.12, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.6} />
      </mesh>

      {/* Cabeça */}
      <mesh castShadow position={[0, 0.92 * heightScale, 0]}>
        <sphereGeometry args={[0.16, 32, 32]} />
        <meshStandardMaterial color={skinColor} roughness={0.6} />
      </mesh>

      {/* Olhos */}
      <mesh position={[-0.07, 0.94 * heightScale, -0.14]}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh position={[0.07, 0.94 * heightScale, -0.14]}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Brilho nos olhos */}
      <mesh position={[-0.06, 0.95 * heightScale, -0.155]}>
        <sphereGeometry args={[0.01, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.08, 0.95 * heightScale, -0.155]}>
        <sphereGeometry args={[0.01, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Boca - sorriso */}
      <mesh position={[0, 0.88 * heightScale, -0.15]}>
        <sphereGeometry args={[0.025, 16, 16]} />
        <meshBasicMaterial color="#ff9999" />
      </mesh>

      {/* CABELO - Específico por personagem */}
      {character?.id === 'esther' && (
        <>
          {/* Cabelo castanho claro liso médio */}
          <mesh castShadow position={[0, 1.02 * heightScale, 0]}>
            <sphereGeometry args={[0.18, 32, 32]} />
            <meshStandardMaterial color={hairColor} roughness={0.8} />
          </mesh>
          {/* Franja */}
          <mesh castShadow position={[0, 0.95 * heightScale, -0.13]}>
            <boxGeometry args={[0.3, 0.09, 0.09]} />
            <meshStandardMaterial color={hairColor} roughness={0.8} />
          </mesh>
          {/* Cabelo nas costas - médio */}
          <mesh castShadow position={[0, 0.7 * heightScale, 0.14]}>
            <boxGeometry args={[0.24, 0.4, 0.07]} />
            <meshStandardMaterial color={hairColor} roughness={0.8} />
          </mesh>
        </>
      )}

      {character?.id === 'elissa' && (
        <>
          {/* Cabelo castanho escuro longo ondulado */}
          <mesh castShadow position={[0, 1.02 * heightScale, 0]}>
            <sphereGeometry args={[0.18, 32, 32]} />
            <meshStandardMaterial color={hairColor} roughness={0.8} />
          </mesh>
          {/* Franja */}
          <mesh castShadow position={[0, 0.95 * heightScale, -0.13]}>
            <boxGeometry args={[0.3, 0.09, 0.09]} />
            <meshStandardMaterial color={hairColor} roughness={0.8} />
          </mesh>
          {/* Cabelo longo ondulado - efeito com múltiplas camadas */}
          <mesh castShadow position={[-0.08, 0.55 * heightScale, 0.14]}>
            <boxGeometry args={[0.09, 0.55, 0.09]} />
            <meshStandardMaterial color={hairColor} roughness={0.8} />
          </mesh>
          <mesh castShadow position={[0, 0.53 * heightScale, 0.15]}>
            <boxGeometry args={[0.13, 0.57, 0.07]} />
            <meshStandardMaterial color={hairColor} roughness={0.8} />
          </mesh>
          <mesh castShadow position={[0.08, 0.55 * heightScale, 0.14]}>
            <boxGeometry args={[0.09, 0.55, 0.09]} />
            <meshStandardMaterial color={hairColor} roughness={0.8} />
          </mesh>
        </>
      )}

      {character?.id === 'evelyn' && (
        <>
          {/* Cabelo castanho claro longo liso */}
          <mesh castShadow position={[0, 1.02 * heightScale, 0]}>
            <sphereGeometry args={[0.18, 32, 32]} />
            <meshStandardMaterial color={hairColor} roughness={0.8} />
          </mesh>
          {/* Franja */}
          <mesh castShadow position={[0, 0.95 * heightScale, -0.13]}>
            <boxGeometry args={[0.3, 0.09, 0.09]} />
            <meshStandardMaterial color={hairColor} roughness={0.8} />
          </mesh>
          {/* Cabelo longo liso - uma peça só */}
          <mesh castShadow position={[0, 0.53 * heightScale, 0.15]}>
            <boxGeometry args={[0.26, 0.6, 0.07]} />
            <meshStandardMaterial color={hairColor} roughness={0.8} />
          </mesh>
        </>
      )}

      {/* Efeito de ataque */}
      {showAttackEffect && meshRef.current && (
        <AttackEffect
          position={[0, 0, 0]}
          rotation={[0, 0, 0]}
          character={character}
          onComplete={() => setShowAttackEffect(false)}
        />
      )}

      {/* Efeitos das habilidades ativas */}
      {activeAbilities.map((ability) => {
        if (!meshRef.current) return null;
        const playerPosition = meshRef.current.position.clone();
        const playerRotation = meshRef.current.rotation.clone();

        switch (ability.id) {
          case 'light_burst':
            return <LightBurst key={ability.instanceId} ability={ability} />;
          case 'blade_spin':
            return <BladeSpinEffect key={ability.instanceId} ability={ability} />;
          case 'fire_storm':
            return <FireStorm key={ability.instanceId} ability={ability} />;
          default:
            return null;
        }
      })}
    </group>
  );
});

Player.displayName = 'Player';

export default Player;
