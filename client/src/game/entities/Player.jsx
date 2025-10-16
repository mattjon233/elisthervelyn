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
import { Box, Sphere, Capsule } from '@react-three/drei';

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

  const colors = {
    esther: '#FFB6D9',
    elissa: '#D4A5D4',
    evelyn: '#A8D8EA'
  };

  const charId = character?.id || character?.nome?.toLowerCase() || 'elissa';
  const color = colors[charId] || '#FFB6D9';

  const { players, playerId } = useGameStore();
  const playerData = players.find(p => p.id === playerId);
  const isDead = isLocalPlayer && playerData ? playerData.health <= 0 : false;

  const { bonuses } = useLevelStore();
  const playerSpeed = 8.0 * bonuses.speedMultiplier;

  const cameraControls = isLocalPlayer ? useThirdPersonCamera(meshRef) : null;

  const { abilityState, triggerAbility, activeAbilities } = isLocalPlayer
    ? useAbility(character)
    : { abilityState: {}, triggerAbility: () => {}, activeAbilities: [] };

  const invulnerability = isLocalPlayer ? useInvulnerability() : null;

  const controls = isLocalPlayer
    ? usePlayerControls(meshRef, playerSpeed, triggerAbility, isDead, cameraControls?.cameraAngleRef)
    : null;

  const combat = isLocalPlayer && controls
    ? useCombat(meshRef, character, controls.isAttacking)
    : null;

  useFrame(({ clock }, delta) => {
    if (isLocalPlayer && materialRef.current) {
      const serverInvuln = playerData?.invulnerableUntil && Date.now() < playerData.invulnerableUntil;
      const skillInvuln = invulnerability?.isInvulnerable || false;
      const isInvulnerable = serverInvuln || skillInvuln;

      if (isInvulnerable) {
        const pulse = (Math.sin(clock.elapsedTime * 30) + 1) / 2;
        if (skillInvuln) {
          materialRef.current.emissive.setRGB(pulse, pulse * 0.8, 0);
        } else {
          materialRef.current.emissive.setRGB(pulse, pulse, pulse);
        }
      } else {
        materialRef.current.emissive.setRGB(0, 0, 0);
      }
    }
    
    if (isLocalPlayer && leftLegRef.current && rightLegRef.current) {
        let isMoving = controls.keys.w || controls.keys.a || controls.keys.s || controls.keys.d;

        if (isMoving) {
            walkCycle.current += delta * 8;
            const legSwing = Math.sin(walkCycle.current) * 0.5;
            leftLegRef.current.rotation.x = legSwing;
            rightLegRef.current.rotation.x = -legSwing;
            const bounce = Math.abs(Math.sin(walkCycle.current * 2)) * 0.05;
            meshRef.current.position.y = 0.5 + bounce;
        } else {
            leftLegRef.current.rotation.x *= 0.85;
            rightLegRef.current.rotation.x *= 0.85;
            if (meshRef.current.position.y > 0.5) {
                meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, 0.5, 0.1);
            }
        }
    }

    if (showAttackEffect && meshRef.current) {
      attackAnimProgress.current += delta * 10;

      if (attackAnimProgress.current < 1) {
        const forwardPush = Math.sin(attackAnimProgress.current * Math.PI) * 0.3;
        const tempRotation = meshRef.current.rotation.y;
        meshRef.current.position.z -= Math.cos(tempRotation) * forwardPush * delta * 5;
        meshRef.current.position.x -= Math.sin(tempRotation) * forwardPush * delta * 5;

        meshRef.current.rotation.x = -Math.sin(attackAnimProgress.current * Math.PI) * 0.2;
      } else {
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

  useImperativeHandle(ref, () => ({
    position: meshRef.current?.position,
    rotation: meshRef.current?.rotation,
    controls: controls,
    activeAbilities: activeAbilities,
    invulnerability: invulnerability,
    abilityState: abilityState,
    cameraControls: cameraControls,
  }));

  useEffect(() => {
    if (controls && onControlsReady) {
      onControlsReady(controls);
    }
  }, [controls, onControlsReady]);

  useEffect(() => {
    if (controls?.isAttacking) {
      setShowAttackEffect(true);
      soundService.playAttackSound();
    }
  }, [controls?.isAttacking]);

  useEffect(() => {
    if (controls?.keys?.invulnerability && invulnerability) {
      invulnerability.activate();
    }
  }, [controls?.keys?.invulnerability, invulnerability]);

  useEffect(() => {
    if (!isLocalPlayer || !meshRef.current) return;

    const interval = setInterval(() => {
      if (!meshRef.current) return;

      const pos = meshRef.current.position;
      const rot = meshRef.current.rotation;

      socketService.sendMovement(
        { x: pos.x, y: pos.y, z: pos.z },
        { x: rot.x, y: rot.y, z: rot.z }
      );
    }, 50);

    return () => clearInterval(interval);
  }, [isLocalPlayer]);

  if (isDead) {
    return null;
  }

  const heightScale = charId === 'esther' ? 0.9 : 1.0;
  const skinColor = '#ffd5bd';
  const hairColors = {
    esther: '#8B6F47',
    elissa: '#3E2723',
    evelyn: '#8B6F47'
  };
  const hairColor = hairColors[charId] || '#8B6F47';

  return (
    <group ref={meshRef} position={position}>
      {isLocalPlayer ? (
        <>
          <group ref={leftLegRef} position={[-0.12, 0.35 * heightScale, 0]}>
            <Capsule args={[0.08, 0.3 * heightScale, 8, 16]} castShadow>
              <meshStandardMaterial color={color} roughness={0.7} />
            </Capsule>
          </group>
          <group ref={rightLegRef} position={[0.12, 0.35 * heightScale, 0]}>
            <Capsule args={[0.08, 0.3 * heightScale, 8, 16]} castShadow>
              <meshStandardMaterial color={color} roughness={0.7} />
            </Capsule>
          </group>
          <Capsule args={[0.2, 0.4 * heightScale, 16, 32]} castShadow position={[0, 0.55 * heightScale, 0]}>
            <meshStandardMaterial ref={materialRef} color={color} roughness={0.7} />
          </Capsule>
          <Capsule args={[0.06, 0.35 * heightScale, 8, 16]} castShadow position={[-0.28, 0.57 * heightScale, 0]} rotation={[0, 0, 0.1]}>
            <meshStandardMaterial color={color} roughness={0.7} />
          </Capsule>
          <Capsule args={[0.06, 0.35 * heightScale, 8, 16]} castShadow position={[0.28, 0.57 * heightScale, 0]} rotation={[0, 0, -0.1]}>
            <meshStandardMaterial color={color} roughness={0.7} />
          </Capsule>
          <Sphere args={[0.16, 32, 32]} castShadow position={[0, 0.92 * heightScale, 0]}>
            <meshStandardMaterial color={skinColor} roughness={0.6} />
          </Sphere>
        </>
      ) : (
        <Box args={[0.8, 1.8, 0.8]} castShadow>
          <meshStandardMaterial ref={materialRef} color={color} roughness={0.7} />
        </Box>
      )}

      {showAttackEffect && meshRef.current && (
        <AttackEffect
          position={[0, 0, 0]}
          rotation={[0, 0, 0]}
          character={character}
          onComplete={() => setShowAttackEffect(false)}
        />
      )}

      {activeAbilities.map((ability) => {
        if (!meshRef.current) return null;

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
