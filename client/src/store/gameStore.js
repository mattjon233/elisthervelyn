import { create } from 'zustand';

/**
 * Zustand Store - Estado global do jogo
 */
export const useGameStore = create((set, get) => ({
  // Estado de conexão
  connected: false,
  roomId: null,
  playerId: null,

  // Personagem do jogador
  selectedCharacter: null,
  playerData: null,

  // Jogadores na sala
  players: [],

  // Estado do jogo
  gameStarted: false,
  currentMission: null,
  missionProgress: {},

  // Diálogo atual
  currentDialogue: null,

  // Inimigos
  enemies: [],

  // NPCs passivos (não atacam nem tomam dano)
  npcs: [],

  // Estado do Rocket (sincronizado com servidor)
  rocketState: {
    lastHealTime: 0
  },

  // Boss
  bossActive: false,
  bossData: null,

  // UI
  showControls: true,
  isDead: false,
  lastDamageTime: null,
  lastHealTime: null,
  isCinematicOpen: true, // A cinemática de introdução começa aberta
  isSkillTreeOpen: false,

  // Actions
  setIsCinematicOpen: (isOpen) => set({ isCinematicOpen: isOpen }),
  setIsSkillTreeOpen: (isOpen) => set({ isSkillTreeOpen: isOpen }),
  triggerDamageEffect: () => set({ lastDamageTime: Date.now() }),
  triggerHealEffect: () => set({ lastHealTime: Date.now() }),

  setConnected: (connected) => set({ connected }),

  setRoomId: (roomId) => set({ roomId }),

  setPlayerId: (playerId) => set({ playerId }),

  setSelectedCharacter: (character) => set({ selectedCharacter: character }),

  setPlayerData: (data) => set({ playerData: data }),

  setPlayers: (players) => set((state) => {
    const maxHealthByCharacter = {
      esther: 100,
      elissa: 150,
      evelyn: 80,
    };

    const initializedPlayers = players.map(p => {
      // If health is not provided, initialize it.
      if (p.health === undefined || p.health === null) {
        const maxHealth = maxHealthByCharacter[p.character] || 100;
        return {
          ...p,
          health: maxHealth,
          maxHealth: maxHealth,
        };
      }
      return p;
    });

    return { players: initializedPlayers };
  }),

  addPlayer: (player) => set((state) => ({
    players: [...state.players, player]
  })),

  removePlayer: (playerId) => set((state) => ({
    players: state.players.filter(p => p.id !== playerId)
  })),

  updatePlayer: (playerId, data) => set((state) => ({
    players: state.players.map(p =>
      p.id === playerId ? { ...p, ...data } : p
    )
  })),

  updatePlayerMovement: (playerId, position, rotation) => set((state) => ({
    players: state.players.map(p =>
      p.id === playerId ? { ...p, position, rotation } : p
    )
  })),

  setGameStarted: (started) => set({ gameStarted: started }),

  setCurrentMission: (mission) => set({ currentMission: mission }),

  setMissionProgress: (progress) => set({ missionProgress: progress }),

  setCurrentDialogue: (dialogue) => set({ currentDialogue: dialogue }),

  clearDialogue: () => set({ currentDialogue: null }),

  setEnemies: (enemies) => set({ enemies }),

  setNpcs: (npcs) => set({ npcs }),

  setRocketState: (rocketState) => set({ rocketState }),

  addEnemy: (enemy) => set((state) => ({
    enemies: [...state.enemies, enemy]
  })),

  removeEnemy: (enemyId) => set((state) => ({
    enemies: state.enemies.filter(e => e.id !== enemyId)
  })),

  updateEnemy: (enemyId, data) => set((state) => ({
    enemies: state.enemies.map(e =>
      e.id === enemyId ? { ...e, ...data } : e
    )
  })),

  damageEnemy: (enemyId, damage) => set((state) => {
    const enemy = state.enemies.find(e => e.id === enemyId);
    if (!enemy) return state;

    const newHealth = Math.max(0, enemy.health - damage);

    return {
      enemies: state.enemies.map(e =>
        e.id === enemyId ? { ...e, health: newHealth, lastHit: Date.now() } : e
      )
    };
  }),

  setBossActive: (active) => set({ bossActive: active }),

  setBossData: (data) => set({ bossData: data }),

  damagePlayer: (damage) => set((state) => {
    const player = state.players.find(p => p.id === state.playerId);
    if (!player) return {};

    const newHealth = Math.max(0, player.health - damage);

    return {
      players: state.players.map(p =>
        p.id === state.playerId ? { ...p, health: newHealth } : p
      ),
      isDead: newHealth <= 0,
      lastDamageTime: Date.now(),
    };
  }),

  healPlayer: (amount) => set((state) => {
    const player = state.players.find(p => p.id === state.playerId);
    // Se o jogador não for encontrado ou já estiver com a vida cheia, não faz nada.
    if (!player || player.health >= player.maxHealth) {
      return {};
    }

    const newHealth = Math.min(player.maxHealth, player.health + amount);

    return {
      players: state.players.map(p =>
        p.id === state.playerId ? { ...p, health: newHealth } : p
      ),
      lastHealTime: Date.now()
    };
  }),

  setDead: (dead) => set({ isDead: dead }),

  respawnPlayer: () => set((state) => {
    const player = state.players.find(p => p.id === state.playerId);
    if (!player) return {};

    return {
      players: state.players.map(p =>
        p.id === state.playerId ? { ...p, health: p.maxHealth } : p
      ),
      isDead: false,
      lastDamageTime: null
    };
  }),

  resetGame: () => set({
    gameStarted: false,
    currentMission: null,
    missionProgress: {},
    enemies: [],
    bossActive: false,
    bossData: null,
  })
}));
