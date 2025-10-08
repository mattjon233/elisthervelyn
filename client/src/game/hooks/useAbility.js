import { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import soundService from '../../services/soundService';

// Mapa de habilidades por personagem
const characterAbilities = {
  esther: [
    {
      id: 'light_burst',
      name: 'Explosão de Luz',
      type: 'melee_area_heal',
      damage: 25,
      heal: 25,
      range: 4,
      cooldown: 20000, // 20s
      duration: 800,
    },
  ],
  elissa: [
    {
      id: 'blade_spin',
      name: 'Giro da Lâmina',
      type: 'melee_area',
      damage: 15,
      range: 3,
      cooldown: 3000, // 3s
      duration: 400,
    },
  ],
  evelyn: [
    {
      id: 'fire_storm',
      name: 'Tempestade de Fogo',
      type: 'melee_area',
      damage: 50,
      range: 3.5,
      cooldown: 15000, // 15s
      duration: 1000,
    },
  ],
};

/**
 * Hook para gerenciar habilidades especiais dos personagens.
 * Controla cooldowns, ativação e renderização de efeitos.
 */
export function useAbility(character) {
  // Pega as habilidades do personagem ou um array vazio se não existir
  const abilities = characterAbilities[character?.id] || [];

  // Estado para controlar cooldowns e status de cada habilidade
  const [abilityState, setAbilityState] = useState(() => {
    const initialState = {};
    abilities.forEach((ability) => {
      initialState[ability.id] = {
        canUse: true,
        isUsing: false,
        cooldownProgress: 0,
      };
    });
    return initialState;
  });

  // Estado para gerenciar as instâncias de habilidades ativas (para renderização)
  const [activeAbilities, setActiveAbilities] = useState([]);
  const timersRef = useRef({});

  const triggerAbility = useCallback(() => {
    const ability = abilities[0];
    if (!ability) return;

    // Usa a forma funcional do setState para garantir que estamos lendo o estado mais recente
    setAbilityState(currentState => {
      // 1. Verifica se a habilidade pode ser usada
      if (!currentState[ability.id]?.canUse) {
        return currentState; // Retorna o estado inalterado
      }

      // 2. Dispara efeitos sonoros
      switch (ability.id) {
        case 'light_burst': soundService.playBladeSpinSound(); break;
        case 'blade_spin': soundService.playBladeSpinSound(); break;
        case 'fire_storm': soundService.playMeteorSound(); break; // Som de fogo/explosão
        default: break;
      }

      // 3. Adiciona a instância da habilidade para renderização
      const newAbilityInstance = { instanceId: uuidv4(), ...ability };
      setActiveAbilities(prev => [...prev, newAbilityInstance]);

      // 4. Timers para duração e cooldown
      setTimeout(() => {
        setActiveAbilities(prev => prev.filter(a => a.instanceId !== newAbilityInstance.instanceId));
        setAbilityState(s => ({ ...s, [ability.id]: { ...s[ability.id], isUsing: false } }));
      }, ability.duration);

      const startTime = Date.now();
      const cooldownInterval = setInterval(() => {
        const progress = Math.min((Date.now() - startTime) / ability.cooldown, 1);
        setAbilityState(s => ({ ...s, [ability.id]: { ...s[ability.id], cooldownProgress: progress } }));
        if (progress >= 1) {
          clearInterval(cooldownInterval);
          setAbilityState(s => ({ ...s, [ability.id]: { ...s[ability.id], canUse: true, cooldownProgress: 0 } }));
        }
      }, 50);
      timersRef.current[ability.id] = cooldownInterval;

      // 5. Retorna o novo estado, marcando a habilidade como "em cooldown"
      return {
        ...currentState,
        [ability.id]: { ...currentState[ability.id], canUse: false, isUsing: true },
      };
    });
  }, [abilities]); // A dependência é apenas 'abilities', que é estável.

  // Limpeza dos timers
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      Object.values(timers).forEach(clearInterval);
    };
  }, []);

  return { abilityState, activeAbilities, triggerAbility };
}
