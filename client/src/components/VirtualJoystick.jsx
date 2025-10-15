import { useRef, useState, useEffect, useCallback } from 'react';
import './VirtualJoystick.css';

/**
 * Joystick Virtual para controle touch em dispositivos móveis
 * Reformulado para melhor captura e responsividade de touch
 */
function VirtualJoystick({ onMove, onAttack, onSpecial, onInteract, onUsePotion, onInvulnerability, hasInvulnerability = false, abilityState = null }) {
  const joystickRef = useRef(null);
  const stickRef = useRef(null);
  const touchIdRef = useRef(null);
  const centerRef = useRef({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const maxDistance = 50; // Raio máximo do joystick

  // Memoizar callback de movimento para evitar re-renders
  const handleMove = useCallback((x, y) => {
    if (onMove) {
      onMove({ x, y });
    }
  }, [onMove]);

  useEffect(() => {
    const joystick = joystickRef.current;
    if (!joystick) return;

    const handleTouchStart = (e) => {
      // Prevenir scroll e outros comportamentos padrão
      e.preventDefault();
      e.stopPropagation();

      const touch = e.touches[0];
      touchIdRef.current = touch.identifier;

      // Recalcular centro sempre no início do toque
      const rect = joystick.getBoundingClientRect();
      centerRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };

      setActive(true);

      // Iniciar movimento imediatamente
      const deltaX = touch.clientX - centerRef.current.x;
      const deltaY = touch.clientY - centerRef.current.y;

      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const clampedDistance = Math.min(distance, maxDistance);

      let finalX = deltaX;
      let finalY = deltaY;

      if (distance > maxDistance) {
        const angle = Math.atan2(deltaY, deltaX);
        finalX = Math.cos(angle) * maxDistance;
        finalY = Math.sin(angle) * maxDistance;
      }

      setPosition({ x: finalX, y: finalY });

      // Normalizar e enviar
      const normalizedX = distance > 0 ? (finalX / maxDistance) : 0;
      const normalizedY = distance > 0 ? (finalY / maxDistance) : 0;

      handleMove(normalizedX, normalizedY);
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (touchIdRef.current === null) return;

      // Encontrar o toque correspondente
      const touch = Array.from(e.touches).find(t => t.identifier === touchIdRef.current);
      if (!touch) return;

      // Calcular deslocamento do centro
      let deltaX = touch.clientX - centerRef.current.x;
      let deltaY = touch.clientY - centerRef.current.y;

      // Calcular distância e limitar ao raio máximo
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
      // Y: -1 = cima, +1 = baixo
      const normalizedX = distance > 0 ? (deltaX / maxDistance) : 0;
      const normalizedY = distance > 0 ? (deltaY / maxDistance) : 0;

      // Callback com direção
      handleMove(normalizedX, normalizedY);
    };

    const handleTouchEnd = (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Verificar se foi o toque correto que terminou
      const wasTouchEnded = Array.from(e.changedTouches).some(
        t => t.identifier === touchIdRef.current
      );

      if (!wasTouchEnded) return;

      touchIdRef.current = null;
      setActive(false);
      setPosition({ x: 0, y: 0 });

      // Parar movimento
      handleMove(0, 0);
    };

    // Adicionar listeners com passive: false para prevenir scroll
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
  }, [handleMove, maxDistance]);

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
