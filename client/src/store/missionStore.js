import { create } from 'zustand';

/**
 * Store para gerenciar missões do jogo
 * Rastreia missão ativa, progresso, e recompensas
 */
export const useMissionStore = create((set, get) => ({
  // Ouro compartilhado por toda a equipe (5000 inicial para testes)
  teamGold: 5000,

  // Missão ativa (null se não tiver nenhuma)
  activeMission: null,

  // Progresso da missão atual (ex: zombies mortos)
  missionProgress: 0,

  // Se já completou a missão e pode coletar recompensa
  missionReadyToComplete: false,

  // Missões disponíveis
  availableMissions: [
    {
      id: 'kill_zombies_1',
      title: 'Eliminar os Mortos-Vivos',
      description: 'O Oráculo pede que você elimine 5 zumbis que ameaçam a região.',
      type: 'kill',
      target: 'zombie',
      requiredCount: 5,
      reward: {
        gold: 100,
        xp: 50
      }
    }
  ],

  // Aceitar missão
  acceptMission: (missionId) => {
    const mission = get().availableMissions.find(m => m.id === missionId);
    if (mission) {
      set({
        activeMission: mission,
        missionProgress: 0,
        missionReadyToComplete: false
      });
    }
  },

  // Incrementar progresso (chamado quando mata inimigo)
  incrementProgress: (enemyType) => {
    const mission = get().activeMission;
    if (!mission || mission.target !== enemyType) return;

    const newProgress = get().missionProgress + 1;
    const isComplete = newProgress >= mission.requiredCount;

    set({
      missionProgress: newProgress,
      missionReadyToComplete: isComplete
    });
  },

  // Completar missão e coletar recompensa
  completeMission: () => {
    const mission = get().activeMission;
    if (!mission || !get().missionReadyToComplete) return null;

    const reward = mission.reward;

    // Adicionar ouro à equipe
    if (reward.gold) {
      set({ teamGold: get().teamGold + reward.gold });
    }

    set({
      activeMission: null,
      missionProgress: 0,
      missionReadyToComplete: false
    });

    return reward;
  },

  // Adicionar ouro manualmente (para outras fontes)
  addGold: (amount) => {
    set({ teamGold: get().teamGold + amount });
  },

  // Gastar ouro
  spendGold: (amount) => {
    const currentGold = get().teamGold;
    if (currentGold >= amount) {
      set({ teamGold: currentGold - amount });
      return true;
    }
    return false;
  },

  // Reset (para limpar ao sair do jogo)
  reset: () => {
    set({
      teamGold: 0,
      activeMission: null,
      missionProgress: 0,
      missionReadyToComplete: false
    });
  }
}));
