import { useEffect, useState } from 'react';
import './HealEffect.css';

/**
 * Efeito visual de cura - Partículas verdes + texto flutuante
 */
function HealEffect({ lastHeal, amount = 5 }) {
  const [visible, setVisible] = useState(false);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (lastHeal) {
      setVisible(true);

      // Gerar partículas aleatórias
      const newParticles = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: Math.random() * 100 - 50,
        y: Math.random() * 100 - 50,
        delay: Math.random() * 0.2
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => {
        setVisible(false);
        setParticles([]);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [lastHeal]);

  if (!visible) return null;

  return (
    <div className="heal-effect-container">
      {/* Partículas verdes */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="heal-particle"
          style={{
            left: `calc(50% + ${particle.x}px)`,
            top: `calc(50% + ${particle.y}px)`,
            animationDelay: `${particle.delay}s`
          }}
        />
      ))}

      {/* Texto flutuante */}
      <div className="heal-text">
        +{amount} HP
      </div>

      {/* Flash verde suave */}
      <div className="heal-flash" />
    </div>
  );
}

export default HealEffect;
