import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import GameScene from '../game/GameScene';
import GameUI from './GameUI';
import MissionUI from './MissionUI';
import GameOverScreen from './GameOverScreen';
import DamageOverlay from './DamageOverlay';
import HealEffect from './HealEffect';
import { useGameStore } from '../store/gameStore';
import { usePrevious } from '../game/hooks/usePrevious';
import './Game.css';

function Game({ roomData }) {
  const [killCount, setKillCount] = useState(0);
  const [abilityState, setAbilityState] = useState(null);
  const { players, playerId, isDead, lastDamageTime, lastHealTime, respawnPlayer, setMaxHealth, setDead } = useGameStore();

  const localPlayer = players.find(p => p.id === playerId);
  const prevPlayerState = usePrevious(localPlayer);

  // Efeito para detectar morte e respawn
  useEffect(() => {
    if (!localPlayer) return;

    // Jogador morreu nesta atualização?
    if (localPlayer.health <= 0 && (prevPlayerState?.health > 0 || !isDead)) {
      setDead(true);
    }
    // Jogador renasceu nesta atualização?
    if (localPlayer.health > 0 && isDead) {
      setDead(false);
    }
  }, [localPlayer, prevPlayerState, isDead, setDead]);

  useEffect(() => {
    // Configurar vida máxima baseada no personagem
    const maxHealthByCharacter = {
      esther: 100,
      elissa: 150,
      evelyn: 80
    };
    const maxHp = maxHealthByCharacter[roomData?.character?.id] || 100;
    setMaxHealth(maxHp);
  }, [roomData, setMaxHealth]);

  return (
    <div className="game-container">
      {/* Cena 3D */}
      <Canvas
        camera={{ position: [0, 10, 15], fov: 60 }}
        shadows
      >
        <GameScene
          character={roomData?.character}
          onKillCountChange={setKillCount}
          isDead={isDead}
          onAbilityStateChange={setAbilityState}
        />
      </Canvas>

      {/* Efeito de dano (tela vermelha) */}
      <DamageOverlay lastDamage={lastDamageTime} />

      {/* Efeito de cura (partículas verdes) */}
      <HealEffect lastHeal={lastHealTime} amount={5} />

      {/* UI 2D sobreposta */}
      <GameUI
        character={roomData?.character}
        killCount={killCount}
        abilityState={abilityState}
      />

      {/* UI de Missões */}
      <MissionUI />

      {/* Tela de Game Over */}
      {isDead && (
        <GameOverScreen
          killCount={killCount}
        />
      )}
    </div>
  );
}

export default Game;
