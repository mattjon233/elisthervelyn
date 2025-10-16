import { useEffect, useState, useCallback, lazy, Suspense, memo } from 'react';
import { Canvas } from '@react-three/fiber';
import GameScene from '../game/GameScene';
import { useGameStore } from '../store/gameStore';
import { usePrevious } from '../game/hooks/usePrevious';
import socketService from '../services/socket';
import './Game.css';

// Lazy load components
const IntroCinematic = lazy(() => import('./IntroCinematic'));
const FinalCutscene = lazy(() => import('./FinalCutscene'));
const Credits = lazy(() => import('./Credits'));
const DamageOverlay = lazy(() => import('./DamageOverlay'));
const HealEffect = lazy(() => import('./HealEffect'));
const GameUI = lazy(() => import('./GameUI'));
const MissionUI = lazy(() => import('./MissionUI'));
const ShopUI = lazy(() => import('./ShopUI'));
const GameOverScreen = lazy(() => import('./GameOverScreen'));
const MissionChoiceUI = lazy(() => import('./MissionChoiceUI'));

// Memoized components
const MemoizedDamageOverlay = memo(DamageOverlay);
const MemoizedHealEffect = memo(HealEffect);
const MemoizedGameUI = memo(GameUI);
const MemoizedMissionUI = memo(MissionUI);

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
    showMissionChoice, setIsAnyCinematicActive
  } = useGameStore();

  const localPlayer = players.find(p => p.id === playerId);
  const prevPlayerState = usePrevious(localPlayer);

  useEffect(() => {
    if (!localPlayer || !prevPlayerState) return;
    const healthDiff = localPlayer.health - prevPlayerState.health;
    if (healthDiff > 0) {
      setHealAmount(healthDiff);
    }
  }, [localPlayer, prevPlayerState]);

  useEffect(() => {
    if (!localPlayer) return;
    if (localPlayer.health <= 0 && (prevPlayerState?.health > 0 || !isDead)) {
      setDead(true);
    }
    if (localPlayer.health > 0 && isDead) {
      setDead(false);
    }
  }, [localPlayer, prevPlayerState, isDead, setDead]);

  const handleCinematicComplete = useCallback(() => {
    setIsCinematicOpen(false);
    setIsAnyCinematicActive(false);
  }, [setIsCinematicOpen, setIsAnyCinematicActive]);

  useEffect(() => {
    const handleFinalCutscene = () => {
      setShowFinalCutscene(true);
      setIsAnyCinematicActive(true);
    };
    const handleShowCredits = () => {
      setShowFinalCutscene(false);
      setShowCredits(true);
      setIsAnyCinematicActive(true);
    };

    socketService.on('final_cutscene_start', handleFinalCutscene);
    socketService.on('show_credits', handleShowCredits);

    return () => {
      socketService.off('final_cutscene_start', handleFinalCutscene);
      socketService.off('show_credits', handleShowCredits);
    };
  }, [setIsAnyCinematicActive]);

  return (
    <div className="game-container">
      <Suspense fallback={<div>Loading...</div>}>
        {isCinematicOpen && <IntroCinematic onComplete={handleCinematicComplete} />}
        {showFinalCutscene && (
          <FinalCutscene 
            dialogueKey="coconaro_derrotado"
            onComplete={() => {
              setShowFinalCutscene(false);
              setIsAnyCinematicActive(false);
            }}
          />
        )}
        {showCredits && <Credits onComplete={() => {
          setShowCredits(false);
          setIsAnyCinematicActive(false);
        }} />}
      </Suspense>

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

      <Suspense fallback={null}>
        <MemoizedDamageOverlay lastDamage={lastDamageTime} />
        <MemoizedHealEffect lastHeal={lastHealTime} amount={healAmount} />
        <MemoizedGameUI
          character={roomData?.character}
          killCount={killCount}
          abilityState={abilityState}
          invulnerabilityState={invulnerabilityState}
          stonePrompts={stonePrompts}
        />
        <MemoizedMissionUI />
        <ShopUI />
        {isDead && <GameOverScreen killCount={killCount} />}
        {showMissionChoice && <MissionChoiceUI />}
      </Suspense>
    </div>
  );
}

export default Game;
