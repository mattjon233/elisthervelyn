import React from 'react';
import './CooldownTimer.css';

/**
 * Componente para exibir um timer de cooldown visual.
 */
const CooldownTimer = ({ remainingTime, duration }) => {
  // Não renderiza se o tempo acabou ou se não há duração
  if (remainingTime <= 0 || !duration) {
    return null;
  }

  // Calcula a porcentagem de progresso para a barra
  const progress = ((duration - remainingTime) / duration) * 100;

  // Formata o texto para exibir uma casa decimal
  const text = remainingTime.toFixed(1);

  return (
    <div className="cooldown-timer-wrapper">
      {/* Barra de progresso que diminui */}
      <div className="cooldown-bar" style={{ width: `${progress}%` }}></div>
      
      {/* Texto com o tempo restante */}
      <div className="cooldown-text">{text}s</div>
    </div>
  );
};

export default CooldownTimer;
