import { useState, useEffect } from 'react';
import './GameUI.css';
import VirtualJoystick from './VirtualJoystick';
import AbilityCooldown from './AbilityCooldown';
import { useGameStore } from '../store/gameStore';
import { useMissionStore } from '../store/missionStore';
import { usePrevious } from '../game/hooks/usePrevious';

function GameUI({ character, killCount = 0, abilityState }) {
  const { players, playerId, currentDialogue, currentMission, triggerDamageEffect, triggerHealEffect } = useGameStore();
  const { teamGold } = useMissionStore();
  const [mission, setMission] = useState('Aguardando missão...');

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

  useEffect(() => {
    if (currentMission) {
      setMission(currentMission.descricao || 'Em missão');
    }
  }, [currentMission]);

  const handleJoystickMove = ({ x, y }) => {
    // Movimento será tratado pelo hook usePlayerControls
    // Por enquanto só log (integração futura)
    // console.log('Joystick:', x, y);
  };

  const handleAttack = () => {
    // Simular clique do mouse para ativar ataque
    const event = new MouseEvent('mousedown', {
      button: 0,
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(event);

    setTimeout(() => {
      const upEvent = new MouseEvent('mouseup', {
        button: 0,
        bubbles: true,
        cancelable: true
      });
      window.dispatchEvent(upEvent);
    }, 100);
  };

  const handleSpecial = () => {
    // Simular pressionamento da tecla Q
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q', bubbles: true }));
    setTimeout(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'q', bubbles: true }));
    }, 100);
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
          <div className="mission-text">{mission}</div>
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
        />
        <AbilityCooldown character={character} abilityState={abilityState} />
      </div>
    </div>
  );
}

export default GameUI;
