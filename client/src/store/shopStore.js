import { create } from 'zustand';

/**
 * Store para gerenciar a loja da Tia Rose e inventário de poções
 */
export const useShopStore = create((set, get) => ({
  // Poções no inventário do jogador (máximo 1)
  potion: null,

  // Histórico de compras (para saber se já ganhou a primeira grátis)
  hasReceivedFreePotion: false,

  // Produtos disponíveis
  availableProducts: [
    {
      id: 'health_potion',
      name: 'Poção de Vida',
      description: 'Restaura 25 HP instantaneamente',
      price: 50,
      effect: {
        type: 'heal',
        amount: 25
      }
    }
  ],

  // Comprar poção
  buyPotion: (productId, currentGold) => {
    const product = get().availableProducts.find(p => p.id === productId);
    if (!product) return { success: false, message: 'Produto não encontrado' };

    // Se já tem uma poção
    if (get().potion) {
      return { success: false, message: 'Você já tem uma poção! Use-a antes de comprar outra.' };
    }

    // Primeira poção é grátis!
    if (!get().hasReceivedFreePotion) {
      set({
        potion: product,
        hasReceivedFreePotion: true
      });
      return {
        success: true,
        message: 'Primeira poção cortesia da casa, querida!',
        cost: 0,
        potion: product
      };
    }

    // Verificar se tem ouro suficiente
    if (currentGold < product.price) {
      return {
        success: false,
        message: `Você precisa de ${product.price} moedas de ouro, querida!`
      };
    }

    // Comprar poção
    set({ potion: product });
    return {
      success: true,
      message: 'Poção comprada com sucesso!',
      cost: product.price,
      potion: product
    };
  },

  // Usar poção (retorna o efeito para aplicar)
  usePotion: () => {
    const potion = get().potion;
    if (!potion) return null;

    // Remove a poção do inventário
    set({ potion: null });

    console.log('[Shop] Poção usada:', potion.name);
    return potion.effect;
  },

  // Verifica se tem poção
  hasPotion: () => {
    return get().potion !== null;
  },

  // Reset (ao sair do jogo)
  reset: () => {
    set({
      potion: null,
      hasReceivedFreePotion: false
    });
  }
}));
