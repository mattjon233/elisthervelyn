import { useEffect, useState } from 'react';
import socketService from '../services/socket';
import './GameOverScreen.css';

/**
 * Tela de Game Over - Agora com botão de renascer manual
 */
function GameOverScreen({ killCount = 0 }) {
  const [countdown, setCountdown] = useState(5);
  const [canRespawn, setCanRespawn] = useState(false);

  useEffect(() => {
    // Inicia o countdown
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev > 0) {
          return prev - 1;
        } else {
          setCanRespawn(true); // Habilita o botão quando countdown chega a 0
          return 0;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleRespawn = () => {
    if (canRespawn) {
      console.log('🔄 Solicitando renascimento ao servidor...');
      socketService.requestRespawn();
    }
  };

  return (
    <div className="game-over-screen">
      <div className="game-over-content">
        <h1 className="game-over-title">💀 VOCÊ MORREU</h1>

        <div className="game-over-stats">
          <p className="stat-label">KILLS</p>
          <p className="stat-value">{killCount}</p>
        </div>

        <div className="respawn-info">
          {!canRespawn ? (
            <p>Aguarde <span className="countdown">{countdown}</span>s para renascer...</p>
          ) : (
            <button
              className="respawn-button"
              onClick={handleRespawn}
            >
              ✨ RENASCER
            </button>
          )}
        </div>

        <p className="game-over-tip">
          💡 Dica: Fique próximo ao Rocket para ganhar HP!
        </p>
      </div>
    </div>
  );
}

export default GameOverScreen;
