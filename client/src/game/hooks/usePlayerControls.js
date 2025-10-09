import { useEffect, useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Hook para controlar movimento do personagem
 * Movimento simples e intuitivo - WASD move relativo à câmera
 */
export function usePlayerControls(playerRef, speed = 8.0, triggerAbility, isDead = false, cameraAngleRef = null) {
  const [keys, setKeys] = useState({
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
    attack: false, // Ataque (clique do mouse ou tecla)
    ability: false, // Habilidade especial (Q)
    potion: false, // Usar poção (1)
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
      // Inclui 'q' para habilidade e '1' para poção
      if (['w', 'a', 's', 'd', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'f', 'j', 'q', '1'].includes(key)) {
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
          potion: prev.potion || key === '1', // Poção com 1
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
        potion: prev.potion && key !== '1',
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
        potion: false,
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

    // Movimento relativo à câmera
    // WASD sempre move baseado na orientação da câmera
    const angle = cameraAngleRef?.current || 0;

    // Direção base sem rotação
    let dirX = 0;
    let dirZ = 0;

    if (keys.w) dirZ -= 1; // Para frente
    if (keys.s) dirZ += 1; // Para trás
    if (keys.a) dirX -= 1; // Para esquerda
    if (keys.d) dirX += 1; // Para direita

    // Aplicar rotação da câmera ao movimento
    if (dirX !== 0 || dirZ !== 0) {
      // Rotacionar o vetor de movimento baseado no ângulo da câmera
      // W deve sempre mover "para frente" na direção da câmera
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      // Matriz de rotação 2D: [cos -sin] [x]
      //                       [sin  cos] [z]
      moveDirection.current.x = dirX * cos + dirZ * sin;
      moveDirection.current.z = -dirX * sin + dirZ * cos;
    }

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

    // Colisão com paredes da mansão (com porta aberta)
    // Mansão: centro em [-30, 0, 30], dimensões 16x14
    const mansionX = -30;
    const mansionZ = 30;
    const mansionWidth = 16;
    const mansionDepth = 14;
    const wallThickness = 0.5;
    const playerRadius = 0.5;

    const playerX = playerRef.current.position.x;
    const playerZ = playerRef.current.position.z;

    // Limites da mansão
    const left = mansionX - mansionWidth / 2;
    const right = mansionX + mansionWidth / 2;
    const front = mansionZ - mansionDepth / 2;
    const back = mansionZ + mansionDepth / 2;

    // Porta: centralizada na parede frontal, largura 4 unidades
    const doorWidth = 4;
    const doorLeft = mansionX - doorWidth / 2;
    const doorRight = mansionX + doorWidth / 2;

    // Parede ESQUERDA (toda altura)
    if (playerX >= left - playerRadius && playerX <= left + wallThickness + playerRadius &&
        playerZ >= front && playerZ <= back) {
      playerRef.current.position.x = left - playerRadius;
    }

    // Parede DIREITA (toda altura)
    if (playerX >= right - wallThickness - playerRadius && playerX <= right + playerRadius &&
        playerZ >= front && playerZ <= back) {
      playerRef.current.position.x = right + playerRadius;
    }

    // Parede FRONTAL ESQUERDA (antes da porta)
    if (playerX >= left && playerX <= doorLeft &&
        playerZ >= front - playerRadius && playerZ <= front + wallThickness + playerRadius) {
      playerRef.current.position.z = front - playerRadius;
    }

    // Parede FRONTAL DIREITA (depois da porta)
    if (playerX >= doorRight && playerX <= right &&
        playerZ >= front - playerRadius && playerZ <= front + wallThickness + playerRadius) {
      playerRef.current.position.z = front - playerRadius;
    }

    // Parede TRASEIRA (toda largura)
    if (playerX >= left && playerX <= right &&
        playerZ >= back - wallThickness - playerRadius && playerZ <= back + playerRadius) {
      playerRef.current.position.z = back + playerRadius;
    }

    // Colisão com OBJETOS INTERNOS DA MANSÃO
    // Todas as posições são relativas à mansão em [-30, 0, 30]

    // MESA DE JANTAR (centro em [-30, 1.2, 29], dimensões 9x4)
    const tableX = mansionX;
    const tableZ = mansionZ - 1;
    const tableWidth = 9;
    const tableDepth = 4;

    if (playerX >= tableX - tableWidth / 2 - playerRadius &&
        playerX <= tableX + tableWidth / 2 + playerRadius &&
        playerZ >= tableZ - tableDepth / 2 - playerRadius &&
        playerZ <= tableZ + tableDepth / 2 + playerRadius) {
      // Empurrar para o lado mais próximo
      const distLeft = Math.abs(playerX - (tableX - tableWidth / 2));
      const distRight = Math.abs(playerX - (tableX + tableWidth / 2));
      const distFront = Math.abs(playerZ - (tableZ - tableDepth / 2));
      const distBack = Math.abs(playerZ - (tableZ + tableDepth / 2));

      const minDist = Math.min(distLeft, distRight, distFront, distBack);

      if (minDist === distLeft) {
        playerRef.current.position.x = tableX - tableWidth / 2 - playerRadius;
      } else if (minDist === distRight) {
        playerRef.current.position.x = tableX + tableWidth / 2 + playerRadius;
      } else if (minDist === distFront) {
        playerRef.current.position.z = tableZ - tableDepth / 2 - playerRadius;
      } else {
        playerRef.current.position.z = tableZ + tableDepth / 2 + playerRadius;
      }
    }

    // CADEIRAS (8 cadeiras ao redor da mesa)
    const chairRadius = 0.5;
    const chairPositions = [
      // Lado esquerdo (3 cadeiras)
      [-35.5, 26], [-35.5, 29], [-35.5, 32],
      // Lado direito (3 cadeiras)
      [-24.5, 26], [-24.5, 29], [-24.5, 32],
      // Cabeceira e pé
      [-30, 25.5], [-30, 31.5]
    ];

    chairPositions.forEach(([cx, cz]) => {
      const dist = Math.sqrt(
        Math.pow(playerX - cx, 2) + Math.pow(playerZ - cz, 2)
      );

      if (dist < chairRadius + playerRadius) {
        // Empurrar para fora
        const angle = Math.atan2(playerZ - cz, playerX - cx);
        playerRef.current.position.x = cx + Math.cos(angle) * (chairRadius + playerRadius);
        playerRef.current.position.z = cz + Math.sin(angle) * (chairRadius + playerRadius);
      }
    });

    // ESCADA (centro em [-30, 0, 35], dimensões 4x3)
    const stairX = mansionX;
    const stairZ = mansionZ + 5;
    const stairWidth = 4;
    const stairDepth = 3;

    if (playerX >= stairX - stairWidth / 2 - playerRadius &&
        playerX <= stairX + stairWidth / 2 + playerRadius &&
        playerZ >= stairZ - stairDepth / 2 - playerRadius &&
        playerZ <= stairZ + stairDepth / 2 + playerRadius) {
      // Empurrar para o lado mais próximo
      const distLeft = Math.abs(playerX - (stairX - stairWidth / 2));
      const distRight = Math.abs(playerX - (stairX + stairWidth / 2));
      const distFront = Math.abs(playerZ - (stairZ - stairDepth / 2));
      const distBack = Math.abs(playerZ - (stairZ + stairDepth / 2));

      const minDist = Math.min(distLeft, distRight, distFront, distBack);

      if (minDist === distLeft) {
        playerRef.current.position.x = stairX - stairWidth / 2 - playerRadius;
      } else if (minDist === distRight) {
        playerRef.current.position.x = stairX + stairWidth / 2 + playerRadius;
      } else if (minDist === distFront) {
        playerRef.current.position.z = stairZ - stairDepth / 2 - playerRadius;
      } else {
        playerRef.current.position.z = stairZ + stairDepth / 2 + playerRadius;
      }
    }
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
