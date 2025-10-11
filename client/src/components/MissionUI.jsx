import { useState } from 'react';
import { useMissionStore } from '../store/missionStore';
import './MissionUI.css';

/**
 * UI para mostrar missão ativa e progresso, com funcionalidade de minimizar.
 */
function MissionUI() {
  const { activeMission, missionProgress, missionReadyToComplete } = useMissionStore();
  const [isMinimized, setIsMinimized] = useState(false);

  if (!activeMission) return null;

  const toggleMinimize = () => setIsMinimized(!isMinimized);

  // Lógica customizada para a missão do Coconaro
  const isCoconaroMission = activeMission.id === 'coconaro_boss_fight';
  const coconaroProgress = isCoconaroMission ? (missionProgress?.cocos || 0) : missionProgress;
  const coconaroRequired = isCoconaroMission ? activeMission.objetivos.alvos.cocos : activeMission.requiredCount;
  const coconaroText = isCoconaroMission ? activeMission.objetivos.texto_ui : 'Progresso';

  const progressPercent = (coconaroProgress / coconaroRequired) * 100;

  return (
    <div className={`mission-ui ${isMinimized ? 'minimized' : ''}`}>
      <div className="mission-header" onClick={toggleMinimize}>
        <div className="mission-title-group">
          <span className="mission-icon">📜</span>
          <h3>{activeMission.title}</h3>
        </div>
        <span className="minimize-icon">{isMinimized ? '[+]' : '[-]'}</span>
      </div>

      {!isMinimized && (
        <div className="mission-body">
          <p className="mission-description">{activeMission.description || 'Elimine os inimigos que ameaçam a região.'}</p>

          <div className="mission-progress">
            <div className="progress-text">
              <span>{coconaroText}</span>
              <span className={coconaroProgress >= coconaroRequired ? 'complete' : ''}>
                {coconaroProgress}/{coconaroRequired}
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {missionReadyToComplete && (
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
