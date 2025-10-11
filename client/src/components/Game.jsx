import { useEffect, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import GameScene from '../game/GameScene';
import GameUI from './GameUI';
import MissionUI from './MissionUI';
import ShopUI from './ShopUI';
import GameOverScreen from './GameOverScreen';
import DamageOverlay from './DamageOverlay';
import HealEffect from './HealEffect';
import IntroCinematic from './IntroCinematic';
import MissionChoiceUI from './MissionChoiceUI';
import FinalCutscene from './FinalCutscene';
import Credits from './Credits';
import { useGameStore } from '../store/gameStore';
import { usePrevious } from '../game/hooks/usePrevious';
import socketService from '../services/socket';
import './Game.css';

function Game({ roomData }) {
  const [killCount, setKillCount] = useState(0);
  const [abilityState, setAbilityState] = useState(null);
  const [invulnerabilityState, setInvulnerabilityState] = useState(null);
  const [stonePrompts, setStonePrompts] = useState({ showStonePrompt: false, showOracleDeliveryPrompt: false, hasStoneInInventory: false });
  const [healAmount, setHealAmount] = useState(5);
  const [showFinalCutscene, setShowFinalCutscene] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const { 
    players, playerId, isDead, lastDamageTime, lastHealTime, 
    isCinematicOpen, setIsCinematicOpen, setDead,
    showMissionChoice 
  } = useGameStore();

  const localPlayer = players.find(p => p.id === playerId);
  const prevPlayerState = usePrevious(localPlayer);

  // Rastrear mudanças de HP para calcular cura
  useEffect(() => {
    if (!localPlayer || !prevPlayerState) return;

    const healthDiff = localPlayer.health - prevPlayerState.health;

    // Se ganhou HP, atualizar quantidade de cura
    if (healthDiff > 0) {
      setHealAmount(healthDiff);
    }
  }, [localPlayer, prevPlayerState]);

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

  const handleCinematicComplete = useCallback(() => {
    setIsCinematicOpen(false);
  }, [setIsCinematicOpen]);

  // Listener para o final do jogo
  useEffect(() => {
    const handleFinalCutscene = () => {
      setShowFinalCutscene(true);
    };
    const handleShowCredits = () => {
      setShowFinalCutscene(false); // Garante que a cutscene saia
      setShowCredits(true);
    };

    socketService.on('final_cutscene_start', handleFinalCutscene);
    socketService.on('show_credits', handleShowCredits);

    return () => {
      socketService.off('final_cutscene_start', handleFinalCutscene);
      socketService.off('show_credits', handleShowCredits);
    };
  }, []);

  return (
    <div className="game-container">
      {/* Cinematográfica de Introdução */}
      {isCinematicOpen && (
        <IntroCinematic onComplete={handleCinematicComplete} />
      )}

      {/* Cutscene Final */}
      {showFinalCutscene && (
        <FinalCutscene onComplete={() => setShowFinalCutscene(false)} />
      )}

      {/* Créditos */}
      {showCredits && <Credits />}

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
          onInvulnerabilityStateChange={setInvulnerabilityState}
          onStonePromptsChange={setStonePrompts}
        />
      </Canvas>

      {/* Efeito de dano (tela vermelha) */}
      <DamageOverlay lastDamage={lastDamageTime} />

      {/* Efeito de cura (partículas verdes) */}
      <HealEffect lastHeal={lastHealTime} amount={healAmount} />

      {/* UI 2D sobreposta */}
      <GameUI
        character={roomData?.character}
        killCount={killCount}
        abilityState={abilityState}
        invulnerabilityState={invulnerabilityState}
        stonePrompts={stonePrompts}
      />

      {/* UI de Missões */}
      <MissionUI />

      {/* UI da Loja */}
      <ShopUI />

      {/* Tela de Game Over */}
      {isDead && (
        <GameOverScreen
          killCount={killCount}
        />
      )}

      {/* UI de Escolha de Missão */}
      {showMissionChoice && <MissionChoiceUI />}
    </div>
  );
}

export default Game;
