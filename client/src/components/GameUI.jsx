import { useState, useEffect } from 'react';
import './GameUI.css';
import VirtualJoystick from './VirtualJoystick';
import AbilityCooldown from './AbilityCooldown';
import { useGameStore } from '../store/gameStore';
import { useMissionStore } from '../store/missionStore';
import { useShopStore } from '../store/shopStore';
import { usePrevious } from '../game/hooks/usePrevious';

function GameUI({ character, killCount = 0, abilityState }) {
  const { players, playerId, currentDialogue, triggerDamageEffect, triggerHealEffect } = useGameStore();
  const { teamGold, activeMission } = useMissionStore();
  const { potion } = useShopStore();

  // Encontra os dados do jogador local na lista de jogadores
  const localPlayer = players.find(p => p.id === playerId);
  const health = localPlayer?.health || 100;
  const maxHealth = localPlayer?.maxHealth || 100;
  const healthPercentage = maxHealth > 0 ? (health / maxHealth) * 100 : 100;

  // Lógica para reativar efeitos de dano/cura
  const prevHealth = usePrevious(health);
  useEffect(() => {
    if (prevHealth !== undefined) {
      if (health < prevHealth) {
        triggerDamageEffect();
      }
      if (health > prevHealth) {
        triggerHealEffect();
      }
    }
  }, [health, prevHealth, triggerDamageEffect, triggerHealEffect]);

  const handleJoystickMove = ({ x, y }) => {
    // Movimento será tratado pelo hook usePlayerControls
  };

  const handleAttack = () => {
    console.log('🗡️ Botão de ataque pressionado');
    const event = new CustomEvent('mobileInput', { detail: { action: 'attack' } });
    window.dispatchEvent(event);
  };

  const handleSpecial = () => {
    console.log('✨ Botão de habilidade pressionado');
    const event = new CustomEvent('mobileInput', { detail: { action: 'ability' } });
    window.dispatchEvent(event);
  };

  const handleInteract = () => {
    console.log('💬 Botão de interação pressionado');
    const event = new CustomEvent('mobileInput', { detail: { action: 'interact' } });
    window.dispatchEvent(event);
  };

  const handleUsePotion = () => {
    console.log('💊 Botão de poção pressionado');
    const event = new CustomEvent('mobileInput', { detail: { action: 'potion' } });
    window.dispatchEvent(event);
  };

  const handleRotateLeft = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', bubbles: true }));
  };

  const handleRotateRight = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', bubbles: true }));
  };

  return (
    <div className="game-ui">
      {/* HUD Superior */}
      <div className="hud-top">
        {/* Widget de Informações do Jogador */}
        <div className="hud-widget character-info-widget">
          <div className="character-portrait" style={{ backgroundColor: character?.color || '#FFB6D9' }}></div>
          <div className="character-details">
            <div className="character-name">{character?.name || 'Jogadora'}</div>
            <div className="health-bar">
              <div className="health-fill" style={{ width: `${healthPercentage}%` }}></div>
              <div className="health-text">{health} / {maxHealth}</div>
            </div>
          </div>
        </div>

        {/* Widget de Missão e Kills */}
        <div className="hud-widget mission-info-widget">
          <div className="mission-text">{activeMission ? activeMission.title : 'Aguardando missão...'}</div>
          <div className="stats-row">
            <div className="kill-counter">
              💀 {killCount}
            </div>
            <div className="gold-counter">
              💰 {teamGold} Ouro
            </div>
          </div>
        </div>
      </div>

      {/* Diálogo do Oráculo */}
      {currentDialogue && (
        <div className="dialogue-box">
          <div className="dialogue-speaker">{currentDialogue.speaker || 'Oráculo'}</div>
          <div className="dialogue-text">{currentDialogue.text || currentDialogue.linhas?.[0]}</div>
        </div>
      )}

      {/* Controles Touch Virtual (mobile) */}
      <div className="touch-controls">
        <VirtualJoystick
          onMove={handleJoystickMove}
          onAttack={handleAttack}
          onSpecial={handleSpecial}
          onInteract={handleInteract}
          onUsePotion={handleUsePotion}
        />
      </div>

      {/* HUD de Habilidades - Apenas Desktop */}
      <div className="hud-bottom-right desktop-only">
        {/* Poção à esquerda da habilidade Q */}
        <div className={`hud-widget potion-widget ${potion ? 'has-potion' : 'no-potion'}`}>
          <div className="potion-icon">💊</div>
          <div className="potion-key">C</div>
        </div>
        <AbilityCooldown character={character} abilityState={abilityState} />
      </div>

      {/* Botões de Rotação da Câmera */}
      <div className="camera-controls">
        <button className="camera-btn camera-left" onClick={handleRotateLeft}>
          ↻ Z
        </button>
        <button className="camera-btn camera-right" onClick={handleRotateRight}>
          ↺ X
        </button>
      </div>
    </div>
  );
}

export default GameUI;
