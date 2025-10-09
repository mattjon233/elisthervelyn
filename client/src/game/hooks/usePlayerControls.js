import { useEffect, useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Hook para controlar movimento do personagem
 * Movimento simples e intuitivo - WASD move relativo à tela
 */
export function usePlayerControls(playerRef, speed = 8.0, triggerAbility, isDead = false) {
  const [keys, setKeys] = useState({
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
    attack: false, // Ataque (clique do mouse ou tecla)
    ability: false, // Habilidade especial (Q)
  });

  const moveDirection = useRef(new THREE.Vector3());
  const smoothVelocity = useRef(new THREE.Vector3());

  // Sistema de ataque com cooldown
  const [isAttacking, setIsAttacking] = useState(false);
  const [canAttack, setCanAttack] = useState(true);
  const attackCooldown = 0.5; // 500ms entre ataques

  // Keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isDead) return; // Não aceitar input se morto

      const key = e.key.toLowerCase();
      // Inclui 'q' para habilidade
      if (['w', 'a', 's', 'd', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'f', 'j', 'q'].includes(key)) {
        e.preventDefault();

        setKeys((prev) => ({
          ...prev,
          w: prev.w || key === 'w' || key === 'arrowup',
          a: prev.a || key === 'a' || key === 'arrowleft',
          s: prev.s || key === 's' || key === 'arrowdown',
          d: prev.d || key === 'd' || key === 'arrowright',
          space: prev.space || key === ' ',
          attack: prev.attack || key === 'f' || key === 'j',
          ability: prev.ability || key === 'q', // Habilidade com Q
        }));
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      setKeys((prev) => ({
        ...prev,
        w: prev.w && key !== 'w' && key !== 'arrowup',
        a: prev.a && key !== 'a' && key !== 'arrowleft',
        s: prev.s && key !== 's' && key !== 'arrowdown',
        d: prev.d && key !== 'd' && key !== 'arrowright',
        space: prev.space && key !== ' ',
        attack: prev.attack && key !== 'f' && key !== 'j',
        ability: prev.ability && key !== 'q',
      }));
    };

    // Resetar todas as teclas quando janela perde foco ou menu de contexto abre
    const handleBlur = () => {
      setKeys({
        w: false,
        a: false,
        s: false,
        d: false,
        space: false,
        attack: false,
        ability: false,
      });
    };

    const handleContextMenu = (e) => {
      e.preventDefault(); // Prevenir menu de contexto
      handleBlur(); // Resetar teclas
    };

    // Mouse click para ataque
    const handleMouseDown = (e) => {
      if (isDead) return; // Não aceitar input se morto
      if (e.button === 0) { // Botão esquerdo
        setKeys((prev) => ({ ...prev, attack: true }));
      }
    };

    const handleMouseUp = (e) => {
      if (e.button === 0) {
        setKeys((prev) => ({ ...prev, attack: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDead]);

  // Atualizar movimento a cada frame
  useFrame((state, delta) => {
    if (!playerRef.current || isDead) return; // Não mover se morto

    // Resetar direção
    moveDirection.current.set(0, 0, 0);

    // Movimento simples e direto - sem câmera complicada
    // W/Seta Cima = para "cima" na tela (Z negativo)
    // S/Seta Baixo = para "baixo" na tela (Z positivo)
    // A/Seta Esq = para esquerda (X negativo)
    // D/Seta Dir = para direita (X positivo)

    if (keys.w) moveDirection.current.z = -1;
    if (keys.s) moveDirection.current.z = 1;
    if (keys.a) moveDirection.current.x = -1;
    if (keys.d) moveDirection.current.x = 1;

    // Se está movendo, normalizar e aplicar
    if (moveDirection.current.length() > 0) {
      moveDirection.current.normalize();

      // Suavização do movimento (lerp para fluidez)
      const targetVelocity = moveDirection.current.multiplyScalar(speed);
      smoothVelocity.current.lerp(targetVelocity, 0.2);

      // Aplicar movimento
      playerRef.current.position.x += smoothVelocity.current.x * delta;
      playerRef.current.position.z += smoothVelocity.current.z * delta;

      // Rotacionar personagem na direção do movimento (suave)
      const targetAngle = Math.atan2(moveDirection.current.x, moveDirection.current.z);
      playerRef.current.rotation.y = THREE.MathUtils.lerp(
        playerRef.current.rotation.y,
        targetAngle,
        0.15
      );
    } else {
      // Parar suavemente quando não está movendo
      smoothVelocity.current.lerp(new THREE.Vector3(0, 0, 0), 0.3);
    }

    // Manter no chão
    playerRef.current.position.y = 0.5;

    // Colisão com paredes do mapa (limites em ±49 para dar espaço antes da parede)
    const mapLimit = 49;
    playerRef.current.position.x = Math.max(-mapLimit, Math.min(mapLimit, playerRef.current.position.x));
    playerRef.current.position.z = Math.max(-mapLimit, Math.min(mapLimit, playerRef.current.position.z));
  });

  // Detectar ataque
  useEffect(() => {
    if (keys.attack && canAttack && !isAttacking) {
      setIsAttacking(true);
      setCanAttack(false);

      // Resetar estado de ataque após animação
      setTimeout(() => {
        setIsAttacking(false);
      }, 200); // Duração da animação de ataque

      // Cooldown
      setTimeout(() => {
        setCanAttack(true);
      }, attackCooldown * 1000);
    }
  }, [keys.attack, canAttack, isAttacking]);

  // Detectar uso de habilidade
  useEffect(() => {
    if (keys.ability && triggerAbility) {
      console.log('DEBUG: Tentando usar habilidade!'); // Log para depuração
      triggerAbility();
    }
  }, [keys.ability, triggerAbility]);

  return {
    keys,
    isMoving: keys.w || keys.a || keys.s || keys.d,
    isAttacking,
    canAttack,
    position: playerRef.current?.position,
    rotation: playerRef.current?.rotation
  };
}
