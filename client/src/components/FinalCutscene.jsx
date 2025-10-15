import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import socketService from '../services/socket';
import './IntroCinematic.css'; // Reutilizando estilos

function FinalCutscene({ onComplete, dialogueKey }) {
  const [dialogue, setDialogue] = useState(null);
  const [isSkipping, setIsSkipping] = useState(false);

  useEffect(() => {
    // No futuro, poderia carregar o diálogo do servidor
    const finalDialogue = {
      speaker: 'Oráculo',
      lines: [
        'Vocês conseguiram! O Coração de Coconaro prova sua vitória!',
        'A terra está finalmente livre da ameaça zumbi. A paz foi restaurada... por enquanto.',
        'Obrigado, heroínas!'
      ]
    };
    setDialogue(finalDialogue);

    // Termina a cutscene após um tempo
    const timer = setTimeout(() => {
      if (!isSkipping) {
        onComplete();
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [onComplete, dialogueKey, isSkipping]);

  useEffect(() => {
    if (isSkipping) {
      onComplete();
    }
  }, [isSkipping, onComplete]);

  const handleSkip = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsSkipping(true);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!dialogue) {
    return null;
  }

  return (
    <div className="intro-cinematic fade-in">
      <div className="scene-background" />
      <div className="vignette" />
      <div className="scene-text glow">
        <p className="main-text">{dialogue.speaker}</p>
        {dialogue.lines.map((line, i) => (
          <p key={i} className="subtitle-text" style={{ animationDelay: `${i * 2}s` }}>{line}</p>
        ))}
      </div>

      <button
        className="skip-button"
        onClick={handleSkip}
        onTouchStart={handleSkip}
      >
        Pular (ESC)
      </button>
    </div>
  );
}

export default FinalCutscene;
