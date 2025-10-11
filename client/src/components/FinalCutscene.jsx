import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import socketService from '../services/socket';
import './IntroCinematic.css'; // Reutilizando estilos

function FinalCutscene({ onComplete }) {
  const [dialogue, setDialogue] = useState(null);

  useEffect(() => {
    const handleStart = ({ dialogueKey }) => {
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
      setTimeout(onComplete, 10000);
    };

    socketService.on('final_cutscene_start', handleStart);
    return () => socketService.off('final_cutscene_start', handleStart);
  }, [onComplete]);

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
    </div>
  );
}

export default FinalCutscene;
