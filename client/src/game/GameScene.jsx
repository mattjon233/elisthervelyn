import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import Ground from './entities/Ground';
import Oracle from './entities/Oracle';
import TiaRose from './entities/TiaRose';
import Mansion from './entities/Mansion';
import MapBoundary from './entities/MapBoundary';
import Player from './entities/Player';
import Zombie from './entities/Zombie';
import Ghost from './entities/Ghost';
import Rocket from './entities/Rocket';
import DeathAnimation from './entities/DeathAnimation';
import { useGameStore } from '../store/gameStore';
import { useMissionStore } from '../store/missionStore';
import { useShopStore } from '../store/shopStore';
import socketService from '../services/socket';
import soundService from '../services/soundService';
import * as THREE from 'three';
import { usePrevious } from './hooks/usePrevious';

function GameScene({ character, onKillCountChange, isDead, onAbilityStateChange }) {

  const localPlayerRef = useRef();
  const directionalLightRef = useRef();

  // Animação do sol
  useFrame(({ clock }) => {
    if (directionalLightRef.current) {
      const time = clock.getElapsedTime();
      // Movimento circular lento do sol para girar as sombras
      const x = 50 * Math.cos(time * 0.05);
      const z = 50 * Math.sin(time * 0.05);
      directionalLightRef.current.position.x = x;
      directionalLightRef.current.position.z = z;
    }
  });

  const playerControlsRef = useRef(null);

  const [dyingEnemies, setDyingEnemies] = useState([]);

  const lastAttackTimeRef = useRef(0);

  const hitEnemiesRef = useRef({}); // Rastreia inimigos atingidos por habilidade



  const [killCount, setKillCount] = useState(0);

  // Notificar mudança no kill count
  useEffect(() => {
    if (onKillCountChange) {
      onKillCountChange(killCount);
    }
  }, [killCount, onKillCountChange]);

  const { players, playerId, enemies, npcs, updatePlayerMovement } = useGameStore();
  const { potion, usePotion } = useShopStore();

  // Listener para movimento de jogadores remotos
  useEffect(() => {
    const handlePlayerMoved = (data) => {
      updatePlayerMovement(data.playerId, data.position, data.rotation);
    };

    socketService.on('player_moved', handlePlayerMoved);

    return () => {
      socketService.off('player_moved', handlePlayerMoved);
    };
  }, [updatePlayerMovement]);

  // Listener para atualizações de estado do servidor
  useEffect(() => {
    const handleStateUpdate = ({ enemies: serverEnemies, players: serverPlayers }) => {
      useGameStore.getState().setEnemies(serverEnemies);
      useGameStore.getState().setPlayers(serverPlayers);
    };

    socketService.on('game_state_updated', handleStateUpdate);

    return () => {
      socketService.off('game_state_updated', handleStateUpdate);
    };
  }, []);

  // Listener para atualizações de missão do servidor (colaborativa)
  useEffect(() => {
    const handleMissionUpdate = ({ activeMission, missionProgress, teamGold }) => {
      useMissionStore.setState({
        activeMission: activeMission,
        missionProgress: missionProgress,
        missionReadyToComplete: activeMission ? missionProgress >= activeMission.requiredCount : false,
        teamGold: teamGold
      });
    };

    socketService.on('mission_updated', handleMissionUpdate);

    return () => {
      socketService.off('mission_updated', handleMissionUpdate);
    };
  }, []);

  // Listener para uso de poção
  useEffect(() => {
    const handlePotionUsed = ({ healAmount, newHealth }) => {
      console.log(`💊 Poção usada! Curou ${healAmount} HP (Vida: ${newHealth})`);
      soundService.playHealSound();
    };

    socketService.on('potion_used', handlePotionUsed);

    return () => {
      socketService.off('potion_used', handlePotionUsed);
    };
  }, []);

  // Detectar tecla 1 para usar poção
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === '1' && !isDead) {
        if (potion) {
          console.log('💊 Tentando usar poção...');
          socketService.emit('use_potion');
          usePotion(); // Remove da store local
        } else {
          console.log('❌ Você não tem nenhuma poção!');
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [potion, isDead, usePotion]);

  // Lógica para detectar mortes de inimigos e atualizar kill count
  const prevEnemies = usePrevious(enemies);

  useEffect(() => {
    if (prevEnemies) {
      prevEnemies.forEach(prevEnemy => {
        const currentEnemy = enemies.find(e => e.id === prevEnemy.id);
        // Se o inimigo existia e agora tem vida 0 (ou não existe mais)
        if (prevEnemy.health > 0 && (!currentEnemy || currentEnemy.health <= 0)) {
          console.log(`CLIENT: Morte detectada para ${prevEnemy.id}`);
          soundService.playEnemyDeathSound();
          if (onKillCountChange) {
            onKillCountChange(prevCount => prevCount + 1);
          }

          // Enviar progresso da missão para o servidor (kill count individual)
          socketService.emit('mission_progress', { enemyType: prevEnemy.type });
        }
      });
    }
  }, [enemies, prevEnemies, onKillCountChange]);

  // Respawn de inimigos quando jogador morrer e renascer
  useEffect(() => {
    if (!isDead) {
      // TODO: A lógica de respawn dos inimigos agora deve ser controlada pelo servidor
      setDyingEnemies([]);
    }
  }, [isDead]);

  // Sistema de combate e colisão
  useFrame((state) => {
    if (!localPlayerRef.current || isDead) return; // Parar tudo se morto

    const playerPos = localPlayerRef.current.position;

    // Calcular dano base por personagem
    const getBaseDamage = () => {
      switch (character?.id) {
        case 'esther': return 15; // Arqueira
        case 'elissa': return 20; // Guerreira
        case 'evelyn': return 12; // Maga
        default: return 10;
      }
    };

    // SISTEMA DE ATAQUE - Envia intenção de ataque para o servidor
    const isAttacking = playerControlsRef.current?.isAttacking;
    const currentTime = Date.now();

    if (isAttacking && currentTime - lastAttackTimeRef.current > 500) { // Cooldown de 500ms
      lastAttackTimeRef.current = currentTime;

      const attackRange = 2.5;
      const enemiesInRange = enemies.filter(enemy => {
        const dx = enemy.position[0] - playerPos.x;
        const dz = enemy.position[2] - playerPos.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        return distance <= attackRange;
      });

      if (enemiesInRange.length > 0) {
        const enemyIds = enemiesInRange.map(e => e.id);
        console.log(`CLIENT: Enviando ataque para inimigos:`, enemyIds);
        socketService.sendAttack(enemyIds);
      }
    }

    // SISTEMA DE HABILIDADES - Envia intenção para o servidor
    const activeAbilities = localPlayerRef.current?.activeAbilities || [];

    activeAbilities.forEach((ability) => {
      if (!hitEnemiesRef.current[ability.instanceId]) {
        hitEnemiesRef.current[ability.instanceId] = new Set();
      }
      const hitSet = hitEnemiesRef.current[ability.instanceId];

      switch (ability.type) {
        case 'melee_area':
          {
            const enemiesInRange = enemies.filter(enemy => {
              if (hitSet.has(enemy.id)) return false;
              const dx = enemy.position[0] - playerPos.x;
              const dz = enemy.position[2] - playerPos.z;
              const distance = Math.sqrt(dx * dx + dz * dz);
              return distance <= ability.range;
            });
            if (enemiesInRange.length > 0) {
              const enemyIds = enemiesInRange.map(e => e.id);
              enemyIds.forEach(id => hitSet.add(id)); // Marcar como atingido
              socketService.sendAttack(enemyIds, ability.damage);
            }
          }
          break;
        case 'melee_area_heal':
          {
            // Aplica dano em inimigos
            const enemiesInRange = enemies.filter(enemy => {
              if (hitSet.has(enemy.id)) return false;
              const dx = enemy.position[0] - playerPos.x;
              const dz = enemy.position[2] - playerPos.z;
              const distance = Math.sqrt(dx * dx + dz * dz);
              return distance <= ability.range;
            });
            if (enemiesInRange.length > 0) {
              const enemyIds = enemiesInRange.map(e => e.id);
              enemyIds.forEach(id => hitSet.add(id));
              socketService.sendAttack(enemyIds, ability.damage);
            }

            // Aplica cura em área para todas as jogadoras (apenas uma vez por habilidade)
            if (!hitSet.has('heal_applied')) {
              hitSet.add('heal_applied');

              // Curar todas as jogadoras em área (incluindo quem usou)
              const playersInRange = players.filter(player => {
                if (!player.position) return false;
                const dx = player.position.x - playerPos.x;
                const dz = player.position.z - playerPos.z;
                const distance = Math.sqrt(dx * dx + dz * dz);
                return distance <= ability.range;
              });

              // Enviar cura para cada jogadora em área
              playersInRange.forEach(player => {
                console.log(`💚 Explosão de Luz curou ${player.id} em ${ability.heal} HP!`);
                socketService.emit('player_heal_area', {
                  targetId: player.id,
                  amount: ability.heal
                });
              });
            }
          }
          break;
      }
    });

    // Lógica de colisão do jogador local com inimigos
    enemies.forEach((enemy) => {
      if (enemy.health <= 0) return; // Ignorar inimigos mortos

      const dx = enemy.position[0] - playerPos.x;
      const dz = enemy.position[2] - playerPos.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      const collisionRadius = 0.8; // Raio de colisão mais ajustado

      if (distance < collisionRadius && distance > 0.01) { // Evita divisão por zero
        // Calcula força de repulsão baseada na distância (quanto mais perto, mais forte)
        const pushStrength = (collisionRadius - distance) / collisionRadius * 0.15;

        // Normaliza o vetor de direção
        const pushX = (playerPos.x - enemy.position[0]) / distance * pushStrength;
        const pushZ = (playerPos.z - enemy.position[2]) / distance * pushStrength;

        // Aplica uma força para "empurrar" o jogador para longe do inimigo
        localPlayerRef.current.position.x += pushX;
        localPlayerRef.current.position.z += pushZ;
      }
    });

    // Garante que o jogador fique no chão
    localPlayerRef.current.position.y = 0.5;

    // Limpeza de instâncias de habilidades que já terminaram
    const activeInstanceIds = new Set(activeAbilities.map(a => a.instanceId));
    for (const instanceId in hitEnemiesRef.current) {
      if (!activeInstanceIds.has(instanceId)) {
        delete hitEnemiesRef.current[instanceId];
      }
    }

    // Passar estado da habilidade para a UI
    if (onAbilityStateChange) {
      onAbilityStateChange(localPlayerRef.current?.abilityState);
    }
  });

  // Coletar posições dos jogadores para Rocket seguir
  const playerPositions = players.map(p => p.position).filter(Boolean);

  return (
    <>
      {/* Iluminação Aprimorada */}
      <ambientLight intensity={0.7} />
      <directionalLight
        ref={directionalLightRef}
        position={[50, 50, 25]} // Posição inicial do sol
        intensity={1.5}
        castShadow
        shadow-mapSize-width={4096} // Resolução da sombra maior
        shadow-mapSize-height={4096}
        shadow-camera-near={0.5}
        shadow-camera-far={150}
        shadow-camera-left={-64}
        shadow-camera-right={64}
        shadow-camera-top={64}
        shadow-camera-bottom={-64}
      />

      {/* Céu */}
      <Sky
        sunPosition={[100, 20, 100]}
        turbidity={8}
        rayleigh={2}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />

      {/* Chão */}
      <Ground />

      {/* Barreiras do mapa */}
      <MapBoundary />

      {/* Mansão no canto inferior esquerdo */}
      <Mansion />

      {/* Oráculo */}
      <Oracle playerPosition={localPlayerRef.current?.position ? [localPlayerRef.current.position.x, localPlayerRef.current.position.y, localPlayerRef.current.position.z] : [0, 0, 0]} />

      {/* NPCs passivos (não atacam nem tomam dano) */}
      {npcs.map((npc) => {
        if (npc.type === 'tia_rose') {
          return (
            <TiaRose
              key={npc.id}
              playerPosition={localPlayerRef.current?.position ? [localPlayerRef.current.position.x, localPlayerRef.current.position.y, localPlayerRef.current.position.z] : [0, 0, 0]}
            />
          );
        }
        if (npc.type === 'rocket') {
          return (
            <Rocket
              key={npc.id}
              playerPositions={playerPositions}
              isPlayerDead={isDead}
            />
          );
        }
        return null;
      })}

      {/* Jogador Local - Respawn perto do Oracle */}
      <Player
        ref={localPlayerRef}
        character={character}
        position={[32, 0.5, 32]}
        isLocalPlayer={true}
        onControlsReady={(controls) => {
          playerControlsRef.current = controls;
        }}
        enemies={enemies} // Passa a lista de inimigos
        onAbilityHitTarget={(ability, enemyId) => {
          // Dano de alvo único (flecha) é enviado para o servidor com o dano da habilidade
          console.log(`🎯 Habilidade ${ability.name} atingiu ${enemyId} causando ${ability.damage} de dano`);
          socketService.sendAttack([enemyId], ability.damage);
        }}
        onAbilityImpact={(ability, impactPosition) => {
          // Dano em área (meteoro) é calculado e enviado para o servidor com o dano da habilidade
          const enemiesInRange = enemies.filter(enemy => {
            const dx = enemy.position[0] - impactPosition.x;
            const dz = enemy.position[2] - impactPosition.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            return distance <= ability.areaRadius;
          });
          if (enemiesInRange.length > 0) {
            const enemyIds = enemiesInRange.map(e => e.id);
            console.log(`💥 Habilidade ${ability.name} atingiu ${enemyIds.length} inimigos causando ${ability.damage} de dano cada`);
            socketService.sendAttack(enemyIds, ability.damage);
          }
        }}
      />

      {/* Jogadores Remotos */}
      {players.filter(p => p.id !== playerId).map((player) => (
        <Player
          key={player.id}
          character={player.stats} // Os stats do personagem estão aqui
          position={[player.position?.x || 0, 0.5, player.position?.z || 0]}
          isLocalPlayer={false}
        />
      ))}

      {/* Inimigos */}
      {enemies.map((enemy) => {
        if (enemy.health > 0) {
          if (enemy.type === 'zombie') {
            return (
              <Zombie
                key={enemy.id}
                id={enemy.id}
                position={enemy.position}
                health={enemy.health}
                maxHealth={enemy.maxHealth}
              />
            );
          }
          if (enemy.type === 'ghost') {
            return (
              <Ghost
                key={enemy.id}
                id={enemy.id}
                position={enemy.position}
                health={enemy.health}
                maxHealth={enemy.maxHealth}
              />
            );
          }
        } else {
          // Se o inimigo não foi renderizado antes (primeira vez com health 0), mostra animação
          // A "key" diferente garante que o componente seja novo
          return (
            <DeathAnimation
              key={`${enemy.id}-death`}
              position={enemy.position}
              type={enemy.type}
              onComplete={() => {
                // Eventualmente o servidor vai parar de enviar este inimigo
              }}
            />
          );
        }
        return null;
      })}

      {/* Animações de morte */}
      {dyingEnemies.map((enemy) => (
        <DeathAnimation
          key={`death-${enemy.id}`}
          position={enemy.position}
          type={enemy.type}
          onComplete={() => {
            // Remover da lista após animação
            setDyingEnemies((prev) => prev.filter((e) => e.id !== enemy.id));
          }}
        />
      ))}
    </>
  );
}

export default GameScene;
