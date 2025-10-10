import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useLevelStore } from '../../store/levelStore';

/**
 * Hook para gerenciar sistema de combate
 * Detecta colisões, calcula dano e gerencia efeitos de ataque
 */
export function useCombat(playerRef, character, isAttacking) {
  const [hitEnemies, setHitEnemies] = useState([]);
  const attackRangeRef = useRef(1.5); // Alcance do ataque básico

  // Pega os bonus de skills
  const { bonuses } = useLevelStore();

  // Calcular dano base por personagem
  const getBaseDamage = () => {
    const baseDmg = (() => {
      switch (character?.id) {
        case 'esther': return 15; // Arqueira - dano médio
        case 'elissa': return 20; // Guerreira - dano alto
        case 'evelyn': return 12; // Maga - dano baixo (depende de habilidades)
        default: return 10;
      }
    })();

    // Aplica multiplicador de dano da skill tree
    return Math.floor(baseDmg * bonuses.damageMultiplier);
  };

  /**
   * Detectar inimigos na área de ataque
   * @param {Array} enemies - Lista de inimigos ativos
   * @returns {Array} - IDs dos inimigos atingidos
   */
  const checkAttackHit = (enemies) => {
    if (!playerRef.current || !isAttacking) return [];

    const playerPos = playerRef.current.position;
    const playerRot = playerRef.current.rotation;

    // Direção que o jogador está olhando
    const direction = new THREE.Vector3(
      Math.sin(playerRot.y),
      0,
      Math.cos(playerRot.y)
    );

    const hits = [];

    enemies.forEach((enemy) => {
      if (!enemy.position) return;

      // Vetor do jogador até o inimigo
      const toEnemy = new THREE.Vector3(
        enemy.position.x - playerPos.x,
        0,
        enemy.position.z - playerPos.z
      );

      const distance = toEnemy.length();

      // Verificar se está dentro do alcance
      if (distance <= attackRangeRef.current) {
        // Verificar se está na frente do jogador (cone de ataque)
        toEnemy.normalize();
        const dotProduct = direction.dot(toEnemy);

        // Se o ângulo for menor que 60 graus (cos(60°) ≈ 0.5), está no cone
        if (dotProduct > 0.5) {
          // Verificar chance de instakill
          const isInstakill = Math.random() < bonuses.instakillChance;
          const damage = isInstakill ? 9999 : getBaseDamage(); // 9999 = instakill

          if (isInstakill) {
            console.log('💀 INSTAKILL!');
          }

          hits.push({
            enemyId: enemy.id,
            damage: damage,
            distance: distance,
            isInstakill: isInstakill
          });
        }
      }
    });

    return hits;
  };

  /**
   * Aplicar dano aos inimigos
   * @param {Array} enemies - Lista de inimigos
   * @param {Function} onEnemyHit - Callback quando um inimigo é atingido
   */
  const applyDamage = (enemies, onEnemyHit) => {
    const hits = checkAttackHit(enemies);

    if (hits.length > 0 && isAttacking) {
      hits.forEach((hit) => {
        // Evitar hit duplo no mesmo frame
        if (!hitEnemies.includes(hit.enemyId)) {
          setHitEnemies([...hitEnemies, hit.enemyId]);
          onEnemyHit(hit);
        }
      });

      // Limpar lista de hits após um curto período
      setTimeout(() => {
        setHitEnemies([]);
      }, 300);
    }
  };

  /**
   * Verificar se jogador está recebendo dano de inimigos
   * @param {Array} enemies - Lista de inimigos
   * @param {Function} onPlayerHit - Callback quando jogador é atingido
   */
  const checkPlayerDamage = (enemies, onPlayerHit) => {
    if (!playerRef.current) return;

    const playerPos = playerRef.current.position;

    enemies.forEach((enemy) => {
      if (!enemy.position || !enemy.isAttacking) return;

      const distance = new THREE.Vector3(
        enemy.position.x - playerPos.x,
        0,
        enemy.position.z - playerPos.z
      ).length();

      // Se o inimigo está perto e atacando
      if (distance < 1.0) {
        onPlayerHit({
          enemyId: enemy.id,
          damage: enemy.damage || 10
        });
      }
    });
  };

  return {
    attackRange: attackRangeRef.current,
    baseDamage: getBaseDamage(),
    checkAttackHit,
    applyDamage,
    checkPlayerDamage
  };
}
