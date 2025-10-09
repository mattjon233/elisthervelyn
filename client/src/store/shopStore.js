import { create } from 'zustand';

export const useShopStore = create((set) => ({
  isShopOpen: false,
  hasUsedFreeUpgrade: false,
  hasReceivedFreePotion: false,
  potion: null, // Poção atual do jogador
  upgrades: {
    healCooldown: false,
    healAmount: false,
    rocketSpeed: false,
  },

  openShop: () => set({ isShopOpen: true }),
  closeShop: () => set({ isShopOpen: false }),

  buyUpgrade: (upgradeId) => set((state) => {
    if (state.upgrades[upgradeId]) {
      console.log('Melhoria já comprada!');
      return state; // Already purchased
    }

    return {
      upgrades: { ...state.upgrades, [upgradeId]: true },
      hasUsedFreeUpgrade: true,
    };
  }),

  // Adicionar poção ao inventário
  addPotion: (potion) => set({ potion }),

  // Usar poção (remove do inventário)
  usePotion: () => set({ potion: null }),

  // Marcar que recebeu poção grátis
  setReceivedFreePotion: () => set({ hasReceivedFreePotion: true }),
}));