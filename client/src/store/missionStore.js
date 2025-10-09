import { create } from 'zustand';

/**
 * Store para gerenciar missões do jogo
 * Rastreia missão ativa, progresso, e recompensas
 */
export const useMissionStore = create((set, get) => ({
  // Ouro compartilhado por toda a equipe
  teamGold: 0,

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
      console.log('[Mission] Missão aceita:', mission.title);
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

    console.log(`[Mission] Progresso: ${newProgress}/${mission.requiredCount}`);
    if (isComplete) {
      console.log('[Mission] ✅ Missão completa! Volte ao Oráculo para recompensa.');
    }
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

    console.log('[Mission] 🎁 Recompensa coletada:', reward);
    return reward;
  },

  // Adicionar ouro manualmente (para outras fontes)
  addGold: (amount) => {
    set({ teamGold: get().teamGold + amount });
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
