import { useEffect, useState } from 'react';
import './DamageOverlay.css';

/**
 * Overlay de dano - Pisca vermelho quando jogador recebe dano
 */
function DamageOverlay({ lastDamage }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (lastDamage) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 400); // Duração do efeito

      return () => clearTimeout(timer);
    }
  }, [lastDamage]);

  if (!visible) return null;

  return <div className="damage-overlay" />;
}

export default DamageOverlay;
