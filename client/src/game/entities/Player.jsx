import { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { usePlayerControls } from '../hooks/usePlayerControls';
import { useThirdPersonCamera } from '../hooks/useThirdPersonCamera';
import { useCombat } from '../hooks/useCombat';
import { useAbility } from '../hooks/useAbility';
import socketService from '../../services/socket';
import soundService from '../../services/soundService';
import AttackEffect from './AttackEffect';
import ArrowProjectile from './abilities/ArrowProjectile';
import BladeSpinEffect from './abilities/BladeSpinEffect';
import MeteorShower from './abilities/MeteorShower';

import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/gameStore';

const Player = forwardRef(({ character, position = [0, 0.5, 0], isLocalPlayer = true, onControlsReady, onAbilityImpact, onAbilityHitTarget, enemies }, ref) => {
  const meshRef = useRef();
  const materialRef = useRef();
  const [showAttackEffect, setShowAttackEffect] = useState(false);

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

  // Efeito de invulnerabilidade
  useFrame(({ clock }) => {
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

  return (
    <group ref={meshRef} position={position}>
      {/* Corpo do personagem */}
      <mesh castShadow position={[0, 0.5, 0]}>
        <capsuleGeometry args={[0.3, 0.6, 16, 32]} />
        <meshStandardMaterial ref={materialRef} color={color} />
      </mesh>

      {/* Indicador de direção (frente) */}
      <mesh position={[0, 0.5, -0.4]} castShadow>
        <coneGeometry args={[0.15, 0.3, 8]} />
        <meshStandardMaterial color="#ffffff" opacity={0.7} transparent />
      </mesh>

      {/* Nome do personagem (placeholder - pode adicionar texto 3D depois) */}
      {character?.name && (
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.05]} />
          <meshBasicMaterial color={color} />
        </mesh>
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
        const playerPosition = meshRef.current?.position;
        switch (ability.id) {
          case 'arrow_shot':
            return <ArrowProjectile key={ability.instanceId} ability={ability} initialPosition={playerPosition} initialRotation={meshRef.current.rotation} onHit={onAbilityHitTarget} enemies={enemies} />;
          case 'blade_spin':
            // O dano do blade_spin já é tratado na GameScene, mas podemos passar se necessário
            return <BladeSpinEffect key={ability.instanceId} ability={ability} />;
          case 'meteor_shower':
            return <MeteorShower key={ability.instanceId} ability={ability} targetPosition={playerPosition} onImpact={onAbilityImpact} />;
          default:
            return null;
        }
      })}
    </group>
  );
});

Player.displayName = 'Player';

export default Player;
