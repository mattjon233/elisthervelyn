import { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { usePlayerControls } from '../hooks/usePlayerControls';
import { useThirdPersonCamera } from '../hooks/useThirdPersonCamera';
import { useCombat } from '../hooks/useCombat';
import { useAbility } from '../hooks/useAbility';
import socketService from '../../services/socket';
import soundService from '../../services/soundService';
import AttackEffect from './AttackEffect';
import LightBurst from './abilities/LightBurst';
import BladeSpinEffect from './abilities/BladeSpinEffect';
import FireStorm from './abilities/FireStorm';

import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/gameStore';

const Player = forwardRef(({ character, position = [0, 0.5, 0], isLocalPlayer = true, onControlsReady, onAbilityImpact, onAbilityHitTarget, enemies }, ref) => {
  const meshRef = useRef();
  const materialRef = useRef();
  const [showAttackEffect, setShowAttackEffect] = useState(false);
  const attackAnimProgress = useRef(0);

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

  // Habilidades (apenas para o jogador local)
  const { abilityState, triggerAbility, activeAbilities } = isLocalPlayer
    ? useAbility(character)
    : { abilityState: {}, triggerAbility: () => {}, activeAbilities: [] };

  // Controles (apenas para o jogador local)
  const controls = isLocalPlayer ? usePlayerControls(meshRef, 8.0, triggerAbility) : null;

  // Sistema de combate (apenas para o jogador local)
  const combat = isLocalPlayer && controls
    ? useCombat(meshRef, character, controls.isAttacking)
    : null;

  // Efeito de invulnerabilidade e animação de ataque
  useFrame(({ clock }, delta) => {
    if (isLocalPlayer && materialRef.current) {
      const isInvulnerable = playerData?.invulnerableUntil && Date.now() < playerData.invulnerableUntil;
      if (isInvulnerable) {
        // Faz o personagem piscar com um brilho branco
        const pulse = (Math.sin(clock.elapsedTime * 30) + 1) / 2; // 0 a 1
        materialRef.current.emissive.setRGB(pulse, pulse, pulse);
      } else {
        materialRef.current.emissive.setRGB(0, 0, 0); // Remove o brilho
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
    abilityState: abilityState, // Expor estado das habilidades (cooldowns)
  }));

  // Notificar quando controles estão prontos
  useEffect(() => {
    if (controls && onControlsReady) {
      onControlsReady(controls);
    }
  }, [controls, onControlsReady]);

  // Câmera third-person (apenas para o jogador local)
  if (isLocalPlayer) {
    useThirdPersonCamera(meshRef);
  }

  // Mostrar efeito de ataque
  useEffect(() => {
    if (controls?.isAttacking) {
      setShowAttackEffect(true);
      soundService.playAttackSound(); // Som de ataque
    }
  }, [controls?.isAttacking]);

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

  return (
    <group ref={meshRef} position={position}>
      {/* Pernas */}
      <mesh castShadow position={[-0.12, 0.15 * heightScale, 0]}>
        <capsuleGeometry args={[0.08, 0.3 * heightScale, 8, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh castShadow position={[0.12, 0.15 * heightScale, 0]}>
        <capsuleGeometry args={[0.08, 0.3 * heightScale, 8, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Torso */}
      <mesh castShadow position={[0, 0.5 * heightScale, 0]}>
        <capsuleGeometry args={[0.18, 0.35 * heightScale, 16, 32]} />
        <meshStandardMaterial ref={materialRef} color={color} />
      </mesh>

      {/* Braços */}
      <mesh castShadow position={[-0.25, 0.52 * heightScale, 0]}>
        <capsuleGeometry args={[0.06, 0.32 * heightScale, 8, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh castShadow position={[0.25, 0.52 * heightScale, 0]}>
        <capsuleGeometry args={[0.06, 0.32 * heightScale, 8, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Pescoço */}
      <mesh castShadow position={[0, 0.73 * heightScale, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.1, 16]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>

      {/* Cabeça */}
      <mesh castShadow position={[0, 0.85 * heightScale, 0]}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>

      {/* Olhos */}
      <mesh position={[-0.06, 0.87 * heightScale, -0.13]}>
        <sphereGeometry args={[0.025, 16, 16]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh position={[0.06, 0.87 * heightScale, -0.13]}>
        <sphereGeometry args={[0.025, 16, 16]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Boca */}
      <mesh position={[0, 0.82 * heightScale, -0.14]}>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshBasicMaterial color="#d4a5a5" />
      </mesh>

      {/* CABELO - Específico por personagem */}
      {character?.id === 'esther' && (
        <>
          {/* Cabelo castanho claro liso médio */}
          <mesh castShadow position={[0, 0.95 * heightScale, 0]}>
            <sphereGeometry args={[0.17, 32, 32]} />
            <meshStandardMaterial color={hairColor} />
          </mesh>
          {/* Franja */}
          <mesh castShadow position={[0, 0.88 * heightScale, -0.12]}>
            <boxGeometry args={[0.28, 0.08, 0.08]} />
            <meshStandardMaterial color={hairColor} />
          </mesh>
          {/* Cabelo nas costas - médio */}
          <mesh castShadow position={[0, 0.65 * heightScale, 0.13]}>
            <boxGeometry args={[0.22, 0.35, 0.06]} />
            <meshStandardMaterial color={hairColor} />
          </mesh>
        </>
      )}

      {character?.id === 'elissa' && (
        <>
          {/* Cabelo castanho escuro longo ondulado */}
          <mesh castShadow position={[0, 0.95 * heightScale, 0]}>
            <sphereGeometry args={[0.17, 32, 32]} />
            <meshStandardMaterial color={hairColor} />
          </mesh>
          {/* Franja */}
          <mesh castShadow position={[0, 0.88 * heightScale, -0.12]}>
            <boxGeometry args={[0.28, 0.08, 0.08]} />
            <meshStandardMaterial color={hairColor} />
          </mesh>
          {/* Cabelo longo ondulado - efeito com múltiplas camadas */}
          <mesh castShadow position={[-0.08, 0.50 * heightScale, 0.13]}>
            <boxGeometry args={[0.08, 0.5, 0.08]} />
            <meshStandardMaterial color={hairColor} />
          </mesh>
          <mesh castShadow position={[0, 0.48 * heightScale, 0.14]}>
            <boxGeometry args={[0.12, 0.52, 0.06]} />
            <meshStandardMaterial color={hairColor} />
          </mesh>
          <mesh castShadow position={[0.08, 0.50 * heightScale, 0.13]}>
            <boxGeometry args={[0.08, 0.5, 0.08]} />
            <meshStandardMaterial color={hairColor} />
          </mesh>
        </>
      )}

      {character?.id === 'evelyn' && (
        <>
          {/* Cabelo castanho claro longo liso */}
          <mesh castShadow position={[0, 0.95 * heightScale, 0]}>
            <sphereGeometry args={[0.17, 32, 32]} />
            <meshStandardMaterial color={hairColor} />
          </mesh>
          {/* Franja */}
          <mesh castShadow position={[0, 0.88 * heightScale, -0.12]}>
            <boxGeometry args={[0.28, 0.08, 0.08]} />
            <meshStandardMaterial color={hairColor} />
          </mesh>
          {/* Cabelo longo liso - uma peça só */}
          <mesh castShadow position={[0, 0.48 * heightScale, 0.14]}>
            <boxGeometry args={[0.24, 0.55, 0.06]} />
            <meshStandardMaterial color={hairColor} />
          </mesh>
        </>
      )}

      {/* Indicador de direção (na frente do rosto) */}
      <mesh position={[0, 0.5 * heightScale, -0.4]} castShadow>
        <coneGeometry args={[0.1, 0.2, 8]} />
        <meshStandardMaterial color="#ffffff" opacity={0.5} transparent />
      </mesh>

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
