import { useGameStore } from '../store/gameStore';
import socketService from '../services/socket';
import './MissionUI.css'; // Reutilizando estilos

function MissionChoiceUI() {
  const { missionChoiceData, setShowMissionChoice } = useGameStore();

  if (!missionChoiceData) {
    return null;
  }

  const handleChoice = (choiceId) => {
    socketService.emit('start_mission', { missionId: choiceId });
    setShowMissionChoice(false, null);
  };

  return (
    <div className="mission-choice-overlay">
      <div className="mission-choice-box">
        <div className="dialogue-speaker">{missionChoiceData.title || 'Oráculo'}</div>
        {missionChoiceData.dialogue.map((line, index) => (
          <p key={index} className="dialogue-text">{line}</p>
        ))}
        <div className="mission-choices">
          {missionChoiceData.choices.map((choice) => (
            <button key={choice.id} onClick={() => handleChoice(choice.id)}>
              {choice.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MissionChoiceUI;
