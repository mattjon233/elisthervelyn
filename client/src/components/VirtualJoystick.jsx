import { useRef, useState, useEffect } from 'react';
import './VirtualJoystick.css';

/**
 * Joystick Virtual para controle touch em dispositivos móveis
 */
function VirtualJoystick({ onMove, onAttack, onSpecial, onInteract, onUsePotion, onInvulnerability, hasInvulnerability = false, abilityState = null }) {
  const joystickRef = useRef(null);
  const stickRef = useRef(null);
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const maxDistance = 50; // Raio máximo do joystick

  useEffect(() => {
    const joystick = joystickRef.current;
    if (!joystick) return;

    let touchId = null;
    let centerX = 0;
    let centerY = 0;

    const handleTouchStart = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      touchId = touch.identifier;

      const rect = joystick.getBoundingClientRect();
      centerX = rect.left + rect.width / 2;
      centerY = rect.top + rect.height / 2;

      setActive(true);
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      if (touchId === null) return;

      const touch = Array.from(e.touches).find(t => t.identifier === touchId);
      if (!touch) return;

      // Calcular deslocamento do centro
      let deltaX = touch.clientX - centerX;
      let deltaY = touch.clientY - centerY;

      // Limitar ao raio máximo
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (distance > maxDistance) {
        const angle = Math.atan2(deltaY, deltaX);
        deltaX = Math.cos(angle) * maxDistance;
        deltaY = Math.sin(angle) * maxDistance;
      }

      // Atualizar posição visual do stick
      setPosition({ x: deltaX, y: deltaY });

      // Normalizar para valores -1 a 1
      // X: -1 = esquerda, +1 = direita
      // Y: -1 = cima, +1 = baixo (normalizado corretamente)
      const normalizedX = deltaX / maxDistance;
      const normalizedY = deltaY / maxDistance;

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

    joystick.addEventListener('touchstart', handleTouchStart, { passive: false });
    joystick.addEventListener('touchmove', handleTouchMove, { passive: false });
    joystick.addEventListener('touchend', handleTouchEnd, { passive: false });
    joystick.addEventListener('touchcancel', handleTouchEnd, { passive: false });

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

      {/* Botões de ação à direita */}
      <div className="action-buttons-right">
        {/* Botão de Ataque */}
        <button
          className="action-btn attack-btn"
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onAttack) onAttack();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          ⚔️
        </button>

        {/* Botão de Habilidade Especial */}
        <button
          className={`action-btn special-btn ${abilityState && !abilityState.canUse ? 'on-cooldown' : ''}`}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onSpecial) onSpecial();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className="btn-icon">✨</div>
          <div className="btn-label">Q</div>
          {abilityState && !abilityState.canUse && (
            <div
              className="cooldown-overlay"
              style={{
                height: `${(1 - (abilityState.cooldownProgress || 0)) * 100}%`
              }}
            />
          )}
        </button>
      </div>

      {/* Botões auxiliares no centro inferior */}
      <div className="action-buttons-center">
        {/* Botão de Interação (E) */}
        <button
          className="action-btn interact-btn"
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onInteract) onInteract();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          💬
        </button>

        {/* Botão de Poção */}
        <button
          className="action-btn potion-btn"
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onUsePotion) onUsePotion();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          💊
        </button>

        {/* Botão de Invulnerabilidade (T) - só aparece se desbloqueado */}
        {hasInvulnerability && (
          <button
            className="action-btn invuln-btn"
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onInvulnerability) onInvulnerability();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            🛡️
          </button>
        )}
      </div>
    </div>
  );
}

export default VirtualJoystick;
