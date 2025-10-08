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

  // Boss
  bossActive: false,
  bossData: null,

  // UI
  healthBar: 100,
  maxHealth: 100,
  showControls: true,
  isDead: false,
  lastDamageTime: null,
  lastHealTime: null,

  // Actions
  triggerDamageEffect: () => set({ lastDamageTime: Date.now() }),
  triggerHealEffect: () => set({ lastHealTime: Date.now() }),

  setConnected: (connected) => set({ connected }),

  setRoomId: (roomId) => set({ roomId }),

  setPlayerId: (playerId) => set({ playerId }),

  setSelectedCharacter: (character) => set({ selectedCharacter: character }),

  setPlayerData: (data) => set({ playerData: data }),

  setPlayers: (players) => set({ players }),

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

  setHealth: (health) => set({ healthBar: health }),

  setMaxHealth: (maxHealth) => set({ maxHealth }),

  damagePlayer: (damage) => set((state) => {
    const newHealth = Math.max(0, state.healthBar - damage);
    return {
      healthBar: newHealth,
      isDead: newHealth <= 0,
      lastDamageTime: Date.now()
    };
  }),

  healPlayer: (amount) => set((state) => ({
    healthBar: Math.min(state.maxHealth, state.healthBar + amount),
    lastHealTime: Date.now()
  })),

  setDead: (dead) => set({ isDead: dead }),

  respawnPlayer: () => set((state) => ({
    healthBar: state.maxHealth,
    isDead: false,
    lastDamageTime: null
  })),

  resetGame: () => set({
    gameStarted: false,
    currentMission: null,
    missionProgress: {},
    enemies: [],
    bossActive: false,
    bossData: null,
    healthBar: 100
  })
}));
