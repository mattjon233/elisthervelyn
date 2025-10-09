import { create } from 'zustand';

export const useShopStore = create((set) => ({
  isShopOpen: false,
  hasUsedFreeUpgrade: false,
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
}));