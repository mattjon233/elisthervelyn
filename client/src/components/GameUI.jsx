import { useState, useEffect } from 'react';
import './GameUI.css';
import VirtualJoystick from './VirtualJoystick';
import AbilityCooldown from './AbilityCooldown';
import InvulnerabilityCooldown from './InvulnerabilityCooldown';
import SkillTreeUI from './SkillTreeUI';
import { useGameStore } from '../store/gameStore';
import { useMissionStore } from '../store/missionStore';
import { useShopStore } from '../store/shopStore';
import { useLevelStore } from '../store/levelStore';
import { usePrevious } from '../game/hooks/usePrevious';

function GameUI({ character, killCount = 0, abilityState, invulnerabilityState, stonePrompts = {} }) {
  const { 
    players, playerId, currentDialogue, triggerDamageEffect, triggerHealEffect, 
    isSkillTreeOpen, setIsSkillTreeOpen 
  } = useGameStore();
  const { teamGold, activeMission } = useMissionStore();
  const { potion } = useShopStore();
  const { currentLevel, currentXP, xpToNextLevel, skillPoints, bonuses } = useLevelStore();

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
    const event = new CustomEvent('mobileInput', { detail: { action: 'attack' } });
    window.dispatchEvent(event);
  };

  const handleSpecial = () => {
    const event = new CustomEvent('mobileInput', { detail: { action: 'ability' } });
    window.dispatchEvent(event);
  };

  const handleInteract = () => {
    const event = new CustomEvent('mobileInput', { detail: { action: 'interact' } });
    window.dispatchEvent(event);
  };

  const handleUsePotion = () => {
    const event = new CustomEvent('mobileInput', { detail: { action: 'potion' } });
    window.dispatchEvent(event);
  };

  const handleInvulnerability = () => {
    const event = new CustomEvent('mobileInput', { detail: { action: 'invulnerability' } });
    window.dispatchEvent(event);
  };

  const handleRotateLeft = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', bubbles: true }));
  };

  const handleRotateRight = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', bubbles: true }));
  };

  // Atalho K para abrir Skill Tree
  useEffect(() => {
    const handleSkillTreeKey = (e) => {
      if (e.key === 'k' || e.key === 'K') {
        setIsSkillTreeOpen(!isSkillTreeOpen);
      }
    };

    window.addEventListener('keydown', handleSkillTreeKey);
    return () => window.removeEventListener('keydown', handleSkillTreeKey);
  }, [isSkillTreeOpen, setIsSkillTreeOpen]);

  return (
    <div className="game-ui">
      {/* HUD Superior */}
      <div className="hud-top">
        {/* Widget de Informações do Jogador */}
        <div className="hud-widget character-info-widget">
          <div
            className="character-portrait"
            style={{
              backgroundColor: character?.color || '#FFB6D9',
              backgroundImage: character?.name ? `url(/img/${character.name.toLowerCase()}.jpg)` : 'none'
            }}
          ></div>
          <div className="character-details">
            <div className="character-name-row">
              <div className="character-name">{character?.name || 'Jogadora'}</div>
              <div className="character-level" onClick={() => setIsSkillTreeOpen(true)}>
                <span>⭐ Nível {currentLevel}</span>
                <span className="level-key-hint">K</span>
                {skillPoints > 0 && <span className="skill-points-badge">{skillPoints}</span>}
              </div>
            </div>
            <div className="health-bar">
              <div className="health-fill" style={{ width: `${healthPercentage}%` }}></div>
              <div className="health-text">{health} / {maxHealth}</div>
            </div>
            <div className="xp-bar">
              <div className="xp-fill" style={{ width: `${(currentXP / xpToNextLevel) * 100}%` }}></div>
              <div className="xp-text">{currentXP} / {xpToNextLevel} XP</div>
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

      {/* Prompt de Interação - Coletar Pedra */}
      {stonePrompts.showStonePrompt && (
        <div className="interaction-prompt stone-prompt">
          <div className="prompt-icon">💎</div>
          <div className="prompt-text">Pressione E para coletar a Pedra Preciosa!</div>
          <div className="prompt-key">E</div>
        </div>
      )}

      {/* Prompt de Interação - Entregar ao Oráculo */}
      {stonePrompts.showOracleDeliveryPrompt && (
        <div className="interaction-prompt oracle-prompt">
          <div className="prompt-icon">✨</div>
          <div className="prompt-text">Pressione E para entregar a Pedra ao Oráculo!</div>
          <div className="prompt-key">E</div>
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
          onInvulnerability={handleInvulnerability}
          hasInvulnerability={bonuses.hasInvulnerability}
        />
      </div>

      {/* HUD de Habilidades - Apenas Desktop */}
      <div className="hud-bottom-right desktop-only">
        {/* Poção à esquerda da habilidade Q */}
        <div className={`hud-widget potion-widget ${potion ? 'has-potion' : 'no-potion'}`}>
          <div className="potion-icon">💊</div>
          <div className="potion-key">C</div>
        </div>
        {/* Pedra Preciosa */}
        {stonePrompts.hasStoneInInventory && (
          <div className="hud-widget stone-widget has-stone">
            <div className="stone-icon">💎</div>
            <div className="stone-label">Pedra</div>
          </div>
        )}
        <AbilityCooldown character={character} abilityState={abilityState} />
        <InvulnerabilityCooldown invulnerabilityState={invulnerabilityState} />
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

      {/* Skill Tree Modal */}
      {isSkillTreeOpen && <SkillTreeUI onClose={() => setIsSkillTreeOpen(false)} />}
    </div>
  );
}

export default GameUI;
