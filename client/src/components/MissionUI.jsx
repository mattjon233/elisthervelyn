import { useState } from 'react';
import { useMissionStore } from '../store/missionStore';
import './MissionUI.css';

/**
 * UI para mostrar missão ativa e progresso, com funcionalidade de minimizar.
 */
function MissionUI() {
  const { activeMission, missionProgress } = useMissionStore();
  const [isMinimized, setIsMinimized] = useState(false);

  if (!activeMission) return null;

  const toggleMinimize = () => setIsMinimized(!isMinimized);

  // --- Lógica Unificada para Progresso ---
  const isCoconaroMission = activeMission.id === 'coconaro_boss_fight';

  const title = activeMission.title || activeMission.nome;
  const description = activeMission.description || activeMission.descricao;

  let currentProgress = 0;
  let requiredCount = 0;
  let progressText = 'Progresso';
  let missionIcon = '🧟';

  if (isCoconaroMission) {
    const coconaroMorto = missionProgress?.coconaro || 0;

    if (coconaroMorto > 0) {
      // Boss derrotado
      currentProgress = coconaroMorto;
      requiredCount = 1;
      progressText = 'Enfrentar Coconaro';
      missionIcon = '🦍';
    } else {
      // Coletar cocos
      currentProgress = missionProgress?.cocos || 0;
      requiredCount = activeMission.objetivos?.alvos?.cocos || 20;
      progressText = activeMission.objetivos?.texto_ui || 'Coletar Cocos';
      missionIcon = '🥥';
    }
  } else {
    currentProgress = missionProgress || 0;
    requiredCount = activeMission.requiredCount || 0;

    // Definir ícone baseado no target
    const target = activeMission.target;
    if (target === 'zombie') {
      missionIcon = '🧟';
      progressText = 'Eliminar Zumbis';
    } else if (target === 'precious_stone') {
      missionIcon = '💎';
      progressText = 'Coletar Pedra';
    }
  }

  const isMissionComplete = requiredCount > 0 && currentProgress >= requiredCount;
  const progressPercent = requiredCount > 0 ? (currentProgress / requiredCount) * 100 : 0;

  return (
    <div className={`mission-ui ${isMinimized ? 'minimized' : ''}`}>
      <div className="mission-header" onClick={toggleMinimize}>
        <div className="mission-title-group">
          <span className="mission-icon">📜</span>
          <h3>
            {!isMinimized && title}
            {isMinimized && (
              <>
                <span className="mission-title-desktop">
                  {title} ({currentProgress}/{requiredCount})
                </span>
                <span className="mission-title-mobile">
                  {missionIcon} {currentProgress}/{requiredCount}
                </span>
              </>
            )}
          </h3>
        </div>
        <span className="minimize-icon">{isMinimized ? '[+]' : '[-]'}</span>
      </div>

      {!isMinimized && (
        <div className="mission-body">
          <p className="mission-description">{description || 'Elimine os inimigos que ameaçam a região.'}</p>

          {requiredCount > 0 && (
            <div className="mission-progress">
              <div className="progress-text">
                <span>{progressText}</span>
                <span className={isMissionComplete ? 'complete' : ''}>
                  {currentProgress}/{requiredCount}
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {isMissionComplete && (
            <div className="mission-complete">
              ✅ Missão completa! Retorne ao Oráculo
            </div>
          )}

          <div className="mission-reward">
            <span className="reward-label">Recompensa:</span>
            <span className="reward-item">💰 {activeMission.rewards?.gold || 50} Ouro</span>
            <span className="reward-item">⭐ {activeMission.rewards?.xp || 100} XP</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default MissionUI;
