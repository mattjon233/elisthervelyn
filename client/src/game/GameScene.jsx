import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import Ground from './entities/Ground';
import Oracle from './entities/Oracle';
import TiaRose from './entities/TiaRose';
import Mansion from './entities/Mansion';
import MapBoundary from './entities/MapBoundary';
import Cemetery from './entities/Cemetery';
import Playground from './entities/Playground';
import FoodCourt from './entities/FoodCourt';
import Player from './entities/Player';
import FriendlyNPC from './entities/FriendlyNPC';
import friendlyNpcData from './data/friendlyNpcData';
import Zombie from './entities/Zombie';
import Ghost from './entities/Ghost';
import Slime from './entities/Slime';
import Rocket from './entities/Rocket';
import DeathAnimation from './entities/DeathAnimation';
import TioUncle from './entities/TioUncle';
import PreciousStone from './entities/PreciousStone';
import Coconaro from './entities/Coconaro';
import Coco from './entities/Coco';
import { useGameStore } from '../store/gameStore';
import { useMissionStore } from '../store/missionStore';
import { useShopStore } from '../store/shopStore';
import socketService from '../services/socket';
import soundService from '../services/soundService';
import * as THREE from 'three';
import { usePrevious } from './hooks/usePrevious';
import { useLevelStore } from '../store/levelStore';
import { tioUnclePosition } from './data/npcPositions';

function GameScene({ character, onKillCountChange, isDead, onAbilityStateChange, onInvulnerabilityStateChange, onStonePromptsChange }) {

  const localPlayerRef = useRef();
  const rocketRef = useRef();
  const directionalLightRef = useRef();

  const { bonuses } = useLevelStore();

  useFrame(({ clock }) => {
    if (directionalLightRef.current) {
      const time = clock.getElapsedTime();
      const x = 10 * Math.cos(time * 0.02);
      const z = 10 * Math.sin(time * 0.02);
      directionalLightRef.current.position.x = x;
      directionalLightRef.current.position.z = z;
    }
  });

  const playerControlsRef = useRef(null);
  const [dyingEnemies, setDyingEnemies] = useState([]);
  const lastAttackTimeRef = useRef(0);
  const hitEnemiesRef = useRef({});
  const [preciousStones, setPreciousStones] = useState([]);
  const [closestStone, setClosestStone] = useState(null);
  const [showStonePrompt, setShowStonePrompt] = useState(false);
  const [coconuts, setCoconuts] = useState([]); // Estado para os cocos
  const [killCount, setKillCount] = useState(0);

  useEffect(() => {
    if (onKillCountChange) {
      onKillCountChange(killCount);
    }
  }, [killCount, onKillCountChange]);

  const { players, playerId, enemies, npcs, updatePlayerMovement } = useGameStore();
  const { potion, usePotion } = useShopStore();

  useEffect(() => {
    const handlePlayerMoved = (data) => {
      updatePlayerMovement(data.playerId, data.position, data.rotation);
    };
    socketService.on('player_moved', handlePlayerMoved);
    return () => {
      socketService.off('player_moved', handlePlayerMoved);
    };
  }, [updatePlayerMovement]);

  useEffect(() => {
    const handleStateUpdate = ({ enemies: serverEnemies, players: serverPlayers, rocketState }) => {
      useGameStore.getState().setEnemies(serverEnemies);
      useGameStore.getState().setPlayers(serverPlayers);
      if (rocketState) {
        useGameStore.getState().setRocketState(rocketState);
      }
    };
    socketService.on('game_state_updated', handleStateUpdate);
    return () => {
      socketService.off('game_state_updated', handleStateUpdate);
    };
  }, []);

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

  useEffect(() => {
    const handleXPGained = ({ amount, reason }) => {
      const currentXP = useLevelStore.getState().currentXP;
      useLevelStore.getState().addXP(amount);
    };
    socketService.on('xp_gained', handleXPGained);
    return () => {
      socketService.off('xp_gained', handleXPGained);
    };
  }, [playerId]);

  useEffect(() => {
    const handleStonesSpawned = ({ stones }) => {
      setPreciousStones(stones);
    };
    const handleStoneCollected = ({ stoneId }) => {
      setPreciousStones(prev => prev.filter(s => s.id !== stoneId));
    };

    socketService.on('precious_stones_spawned', handleStonesSpawned);
    socketService.on('stone_collected', handleStoneCollected);

    return () => {
      socketService.off('precious_stones_spawned', handleStonesSpawned);
      socketService.off('stone_collected', handleStoneCollected);
    };
  }, [playerId]);

  useEffect(() => {
    const handleCoconaroMissionStart = ({ coconuts }) => {
      console.log('CLIENT: Missão Coconaro iniciada! Cocos recebidos:', coconuts);
      setCoconuts(coconuts);
    };

    const handleCoconutCollected = ({ coconutId }) => {
      console.log(`CLIENT: Coco ${coconutId} foi coletado.`);
      setCoconuts(prev => prev.filter(c => c.id !== coconutId));
    };

    socketService.on('coconaro_mission_started', handleCoconaroMissionStart);
    socketService.on('coconut_collected', handleCoconutCollected);

    return () => {
      socketService.off('coconaro_mission_started', handleCoconaroMissionStart);
      socketService.off('coconut_collected', handleCoconutCollected);
    };
  }, []);

  useEffect(() => {
    const handlePotionUsed = ({ healAmount, newHealth }) => {
      soundService.playHealSound();
    };
    socketService.on('potion_used', handlePotionUsed);
    return () => {
      socketService.off('potion_used', handlePotionUsed);
    };
  }, []);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === '1' && !isDead) {
        if (potion) {
          socketService.emit('use_potion');
          usePotion();
        } else {
          console.log('❌ Você não tem nenhuma poção!');
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [potion, isDead, usePotion]);

  useEffect(() => {
    const handleInteraction = (e) => {
      if ((e.key === 'e' || e.key === 'E') && !isDead) {
        if (showStonePrompt && closestStone) {
          socketService.emit('collect_stone', { stoneId: closestStone.id });
          setShowStonePrompt(false);
        }
      }
    };
    window.addEventListener('keydown', handleInteraction);
    return () => window.removeEventListener('keydown', handleInteraction);
  }, [isDead, showStonePrompt, closestStone]);

  useEffect(() => {
    const handleMobileInteract = (e) => {
      if (e.detail?.action === 'interact' && !isDead) {
        if (showStonePrompt && closestStone) {
          socketService.emit('collect_stone', { stoneId: closestStone.id });
          setShowStonePrompt(false);
        }
      }
    };
    window.addEventListener('mobileInput', handleMobileInteract);
    return () => window.removeEventListener('mobileInput', handleMobileInteract);
  }, [isDead, showStonePrompt, closestStone]);

  const prevEnemies = usePrevious(enemies);

  useEffect(() => {
    if (prevEnemies) {
      prevEnemies.forEach(prevEnemy => {
        const currentEnemy = enemies.find(e => e.id === prevEnemy.id);
        if (prevEnemy.health > 0 && (!currentEnemy || currentEnemy.health <= 0)) {
          soundService.playEnemyDeathSound();
          if (onKillCountChange) {
            onKillCountChange(prevCount => prevCount + 1);
          }
        }
      });
    }
  }, [enemies, prevEnemies, onKillCountChange]);

  useEffect(() => {
    if (!isDead) {
      setDyingEnemies([]);
    }
  }, [isDead]);

  useFrame((state) => {
    if (!localPlayerRef.current || isDead) return;
    const playerPos = localPlayerRef.current.position;
    const isAttacking = playerControlsRef.current?.isAttacking;
    const currentTime = Date.now();

    if (isAttacking && currentTime - lastAttackTimeRef.current > 500) {
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
        socketService.sendAttack(enemyIds, null, bonuses.damageMultiplier, bonuses.instakillChance);
      }
    }

    const activeAbilities = localPlayerRef.current?.activeAbilities || [];
    activeAbilities.forEach((ability) => {
      if (!hitEnemiesRef.current[ability.instanceId]) {
        hitEnemiesRef.current[ability.instanceId] = new Set();
      }
      const hitSet = hitEnemiesRef.current[ability.instanceId];
      switch (ability.type) {
        case 'melee_area': {
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
            socketService.sendAttack(enemyIds, ability.damage, bonuses.damageMultiplier, bonuses.instakillChance);
          }
          break;
        }
        case 'melee_area_heal': {
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
            socketService.sendAttack(enemyIds, ability.damage, bonuses.damageMultiplier, bonuses.instakillChance);
          }
          if (!hitSet.has('heal_applied')) {
            hitSet.add('heal_applied');
            const playersInRange = players.filter(player => {
              if (!player.position) return false;
              const dx = player.position.x - playerPos.x;
              const dz = player.position.z - playerPos.z;
              const distance = Math.sqrt(dx * dx + dz * dz);
              return distance <= ability.range;
            });
            playersInRange.forEach(player => {
              socketService.emit('player_heal_area', { targetId: player.id, amount: ability.heal });
            });
          }
          break;
        }
      }
    });

    enemies.forEach((enemy) => {
      if (enemy.health <= 0) return;
      const dx = enemy.position[0] - playerPos.x;
      const dz = enemy.position[2] - playerPos.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      const collisionRadius = 0.8;
      if (distance < collisionRadius && distance > 0.01 && !isAttacking) {
        const pushStrength = (collisionRadius - distance) / collisionRadius * 0.08;
        const pushX = (playerPos.x - enemy.position[0]) / distance * pushStrength;
        const pushZ = (playerPos.z - enemy.position[2]) / distance * pushStrength;
        localPlayerRef.current.position.x += pushX;
        localPlayerRef.current.position.z += pushZ;
      }
    });

    if (rocketRef.current) {
      const rocketPos = rocketRef.current.position;
      const rocketDx = rocketPos.x - playerPos.x;
      const rocketDz = rocketPos.z - playerPos.z;
      const rocketDistance = Math.sqrt(rocketDx * rocketDx + rocketDz * rocketDz);
      const rocketCollisionRadius = 0.8;
      if (rocketDistance < rocketCollisionRadius && rocketDistance > 0.01) {
        const pushStrength = (rocketCollisionRadius - rocketDistance) / rocketCollisionRadius * 0.15;
        const pushX = (playerPos.x - rocketPos.x) / rocketDistance * pushStrength;
        const pushZ = (playerPos.z - rocketPos.z) / rocketDistance * pushStrength;
        localPlayerRef.current.position.x += pushX;
        localPlayerRef.current.position.z += pushZ;
      }
    }

    players.forEach((player) => {
      if (player.id === playerId || !player.position || typeof player.position.x === 'undefined' || typeof player.position.z === 'undefined') return;
      const dx = player.position.x - playerPos.x;
      const dz = player.position.z - playerPos.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      const playerCollisionRadius = 0.6;
      if (distance < playerCollisionRadius && distance > 0.01) {
        const pushStrength = (playerCollisionRadius - distance) / playerCollisionRadius * 0.1;
        const pushX = (playerPos.x - player.position.x) / distance * pushStrength;
        const pushZ = (playerPos.z - player.position.z) / distance * pushStrength;
        localPlayerRef.current.position.x += pushX;
        localPlayerRef.current.position.z += pushZ;
      }
    });

    // Coleta de cocos por proximidade
    coconuts.forEach(coco => {
      // Safety check para garantir que o coco tem posição válida
      if (typeof coco.x === 'undefined' || typeof coco.z === 'undefined') return;
      
      const cocoPos = new THREE.Vector3(coco.x, coco.y, coco.z);
      const distance = playerPos.distanceTo(cocoPos);
      
      if (distance < 1.5) { // Raio de coleta
        socketService.emit('collect_coconut', { coconutId: coco.id });
      }
    });

    const mapBoundary = 50;
    if (localPlayerRef.current.position.x > mapBoundary) localPlayerRef.current.position.x = mapBoundary;
    if (localPlayerRef.current.position.x < -mapBoundary) localPlayerRef.current.position.x = -mapBoundary;
    if (localPlayerRef.current.position.z > mapBoundary) localPlayerRef.current.position.z = mapBoundary;
    if (localPlayerRef.current.position.z < -mapBoundary) localPlayerRef.current.position.z = -mapBoundary;

    if (preciousStones.length > 0) {
        let minDistance = Infinity;
        let currentClosestStone = null;

        preciousStones.forEach(stone => {
            const stoneDx = stone.x - playerPos.x;
            const stoneDz = stone.z - playerPos.z;
            const stoneDistance = Math.sqrt(stoneDx * stoneDx + stoneDz * stoneDz);
            if (stoneDistance < minDistance) {
                minDistance = stoneDistance;
                currentClosestStone = stone;
            }
        });

        const stoneInteractionRadius = 2.0;
        if (minDistance < stoneInteractionRadius) {
            setShowStonePrompt(true);
            setClosestStone(currentClosestStone);
        } else {
            setShowStonePrompt(false);
            setClosestStone(null);
        }
    } else {
        setShowStonePrompt(false);
        setClosestStone(null);
    }

    const activeInstanceIds = new Set(activeAbilities.map(a => a.instanceId));
    for (const instanceId in hitEnemiesRef.current) {
      if (!activeInstanceIds.has(instanceId)) {
        delete hitEnemiesRef.current[instanceId];
      }
    }

    if (onAbilityStateChange) onAbilityStateChange(localPlayerRef.current?.abilityState);
    if (onInvulnerabilityStateChange) onInvulnerabilityStateChange(localPlayerRef.current?.invulnerability);
    if (onStonePromptsChange) onStonePromptsChange({ showStonePrompt, showOracleDeliveryPrompt: false, hasStoneInInventory: false });
  });

  const playerPositions = players.map(p => p.position).filter(Boolean);

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight
        ref={directionalLightRef}
        position={[10, 50, 10]}
        intensity={2.0}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={100}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-bias={-0.00005}
        shadow-normalBias={0.02}
      />
      <Sky sunPosition={[100, 20, 100]} turbidity={8} rayleigh={2} mieCoefficient={0.005} mieDirectionalG={0.8} />
      <Ground />
      <MapBoundary />
      <Mansion />
      {/* Cemitério no canto superior direito */}
      <Cemetery />

      {/* Parquinho no canto superior esquerdo */}
      <Playground />

      {/* Praça de Alimentação no canto inferior esquerdo */}
      <FoodCourt />

      {/* Tio Uncle */}
      <TioUncle 
        position={[tioUnclePosition.x, tioUnclePosition.y, tioUnclePosition.z]} 
        playerPosition={localPlayerRef.current?.position ? [localPlayerRef.current.position.x, localPlayerRef.current.position.y, localPlayerRef.current.position.z] : [0, 0, 0]} 
      />

      {/* Oráculo */}
      <Oracle
        playerPosition={localPlayerRef.current?.position ? [localPlayerRef.current.position.x, localPlayerRef.current.position.y, localPlayerRef.current.position.z] : [0, 0, 0]}
        preciousStoneActive={preciousStones.length > 0}
      />

      {/* Pedras Preciosas */}
      {preciousStones.map(stone => (
        <PreciousStone key={stone.id} position={[stone.x, stone.y, stone.z]} />
      ))}

      {/* NPCs Amigáveis */}
      {friendlyNpcData.map(npc => (
        <FriendlyNPC 
          key={npc.id} 
          npcData={npc} 
          playerPosition={localPlayerRef.current?.position ? [localPlayerRef.current.position.x, localPlayerRef.current.position.y, localPlayerRef.current.position.z] : [0, 0, 0]}
        />
      ))}

      {/* NPCs Estáticos */}
      <TiaRose 
        playerPosition={localPlayerRef.current?.position ? [localPlayerRef.current.position.x, localPlayerRef.current.position.y, localPlayerRef.current.position.z] : [0, 0, 0]}
      />
      <Rocket ref={rocketRef} />
      <Player
        ref={localPlayerRef}
        character={character}
        position={[32, 0.5, 32]}
        isLocalPlayer={true}
        onControlsReady={(controls) => { playerControlsRef.current = controls; }}
        enemies={enemies}
        onAbilityHitTarget={(ability, enemyId) => {
          socketService.sendAttack([enemyId], ability.damage, bonuses.damageMultiplier, bonuses.instakillChance);
        }}
        onAbilityImpact={(ability, impactPosition) => {
          const enemiesInRange = enemies.filter(enemy => {
            const dx = enemy.position[0] - impactPosition.x;
            const dz = enemy.position[2] - impactPosition.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            return distance <= ability.areaRadius;
          });
          if (enemiesInRange.length > 0) {
            const enemyIds = enemiesInRange.map(e => e.id);
            socketService.sendAttack(enemyIds, ability.damage, bonuses.damageMultiplier, bonuses.instakillChance);
          }
        }}
      />
      {players.filter(p => p.id !== playerId).map((player) => {
        if (!player.stats && !player.character) {
          console.warn('⚠️ Jogador remoto sem character:', player.id, player);
        }
        return (
          <Player
            key={player.id}
            character={player.stats || player.character}
            position={[player.position?.x || 0, player.position?.y || 0.5, player.position?.z || 0]}
            isLocalPlayer={false}
          />
        );
      })}
      {enemies.map((enemy) => {
        if (enemy.health > 0) {
          if (enemy.type === 'zombie') {
            return <Zombie key={enemy.id} id={enemy.id} position={enemy.position} health={enemy.health} maxHealth={enemy.maxHealth} />;
          }
          if (enemy.type === 'ghost') {
            return <Ghost key={enemy.id} id={enemy.id} position={enemy.position} health={enemy.health} maxHealth={enemy.maxHealth} />;
          }
          if (enemy.type === 'slime') {
            return <Slime key={enemy.id} id={enemy.id} position={enemy.position} health={enemy.health} maxHealth={enemy.maxHealth} />;
          }
          if (enemy.type === 'coconaro') {
            return <Coconaro key={enemy.id} id={enemy.id} position={enemy.position} health={enemy.health} maxHealth={enemy.maxHealth} />;
          }
        } else {
          return <DeathAnimation key={`${enemy.id}-death`} position={enemy.position} type={enemy.type} onComplete={() => {}} />;
        }
        return null;
      })}

      {/* Cocos Colecionáveis */}
      {coconuts.map(coco => (
        <Coco key={coco.id} id={coco.id} position={[coco.x, coco.y, coco.z]} />
      ))}

      {dyingEnemies.map((enemy) => (
        <DeathAnimation
          key={`death-${enemy.id}`}
          position={enemy.position}
          type={enemy.type}
          onComplete={() => {
            setDyingEnemies((prev) => prev.filter((e) => e.id !== enemy.id));
          }}
        />
      ))}
    </>
  );
}

export default GameScene;