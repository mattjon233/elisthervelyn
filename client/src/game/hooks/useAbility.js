import { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import soundService from '../../services/soundService';

// Mapa de habilidades por personagem
const characterAbilities = {
  esther: [
    {
      id: 'arrow_shot',
      name: 'Tiro de Flecha',
      type: 'projectile',
      damage: 35,
      range: 20,
      cooldown: 1000, // 1s
      duration: 0,
    },
    // Adicionar mais habilidades para Esther aqui
  ],
  elissa: [
    {
      id: 'blade_spin',
      name: 'Giro da Lâmina',
      type: 'melee_area',
      damage: 25,
      range: 3,
      cooldown: 2000, // 2s
      duration: 400,
    },
  ],
  evelyn: [
    {
      id: 'meteor_shower',
      name: 'Chuva de Meteoros',
      type: 'area_delayed',
      damage: 40,
      range: 10,
      areaRadius: 4,
      delay: 1500,
      cooldown: 3000, // 3s
      duration: 2500,
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
        case 'arrow_shot': soundService.playArrowSound(); break;
        case 'blade_spin': soundService.playBladeSpinSound(); break;
        case 'meteor_shower': soundService.playMeteorSound(); break;
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
