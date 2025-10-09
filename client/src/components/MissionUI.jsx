import { useMissionStore } from '../store/missionStore';
import './MissionUI.css';

/**
 * UI para mostrar missão ativa e progresso
 */
function MissionUI() {
  const { activeMission, missionProgress, missionReadyToComplete } = useMissionStore();

  if (!activeMission) return null;

  const progressPercent = (missionProgress / activeMission.requiredCount) * 100;

  return (
    <div className="mission-ui">
      <div className="mission-header">
        <span className="mission-icon">📜</span>
        <h3>{activeMission.title}</h3>
      </div>

      <p className="mission-description">{activeMission.description || 'Elimine os inimigos que ameaçam a região.'}</p>

      <div className="mission-progress">
        <div className="progress-text">
          <span>Progresso</span>
          <span className={missionReadyToComplete ? 'complete' : ''}>
            {missionProgress}/{activeMission.requiredCount}
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
        <span className="reward-item">💰 100 Ouro</span>
        <span className="reward-item">⭐ 50 XP</span>
      </div>
    </div>
  );
}

export default MissionUI;
