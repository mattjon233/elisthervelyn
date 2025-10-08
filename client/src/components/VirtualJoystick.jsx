import { useRef, useState, useEffect } from 'react';
import './VirtualJoystick.css';

/**
 * Joystick Virtual para controle touch em dispositivos móveis
 */
function VirtualJoystick({ onMove, onAttack, onSpecial }) {
  const joystickRef = useRef(null);
  const stickRef = useRef(null);
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const maxDistance = 50; // Raio máximo do joystick

  useEffect(() => {
    const joystick = joystickRef.current;
    if (!joystick) return;

    let touchId = null;
    let startPos = { x: 0, y: 0 };

    const handleTouchStart = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      touchId = touch.identifier;

      const rect = joystick.getBoundingClientRect();
      startPos = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };

      setActive(true);
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      if (touchId === null) return;

      const touch = Array.from(e.touches).find(t => t.identifier === touchId);
      if (!touch) return;

      // Calcular deslocamento do centro
      const deltaX = touch.clientX - startPos.x;
      const deltaY = touch.clientY - startPos.y;

      // Limitar ao raio máximo
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const limitedDistance = Math.min(distance, maxDistance);
      const angle = Math.atan2(deltaY, deltaX);

      const x = Math.cos(angle) * limitedDistance;
      const y = Math.sin(angle) * limitedDistance;

      setPosition({ x, y });

      // Normalizar para valores -1 a 1
      const normalizedX = x / maxDistance;
      const normalizedY = y / maxDistance;

      // Callback com direção
      if (onMove) {
        onMove({ x: normalizedX, y: normalizedY });
      }
    };

    const handleTouchEnd = (e) => {
      e.preventDefault();
      touchId = null;
      setActive(false);
      setPosition({ x: 0, y: 0 });

      if (onMove) {
        onMove({ x: 0, y: 0 });
      }
    };

    joystick.addEventListener('touchstart', handleTouchStart);
    joystick.addEventListener('touchmove', handleTouchMove);
    joystick.addEventListener('touchend', handleTouchEnd);
    joystick.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      joystick.removeEventListener('touchstart', handleTouchStart);
      joystick.removeEventListener('touchmove', handleTouchMove);
      joystick.removeEventListener('touchend', handleTouchEnd);
      joystick.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [onMove]);

  return (
    <div className="virtual-controls">
      {/* Joystick de movimento */}
      <div className="joystick-container">
        <div
          ref={joystickRef}
          className={`joystick-base ${active ? 'active' : ''}`}
        >
          <div
            ref={stickRef}
            className="joystick-stick"
            style={{
              transform: `translate(${position.x}px, ${position.y}px)`
            }}
          />
        </div>
      </div>

      {/* Botões de ação */}
      <div className="action-buttons">
        <button
          className="action-btn attack-btn"
          onTouchStart={(e) => {
            e.preventDefault();
            if (onAttack) onAttack();
          }}
        >
          ⚔️
        </button>
        <button
          className="action-btn special-btn"
          onTouchStart={(e) => {
            e.preventDefault();
            if (onSpecial) onSpecial();
          }}
        >
          ✨
        </button>
      </div>
    </div>
  );
}

export default VirtualJoystick;
