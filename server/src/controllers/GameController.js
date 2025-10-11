import { GameService } from '../services/GameService.js';
import { DialogueService } from '../services/DialogueService.js';
import { MissionService } from '../services/MissionService.js';

export class GameController {
  constructor(io) {
    this.io = io;
    this.rooms = new Map();
    this.playerRooms = new Map();
    this.gameService = new GameService();
    this.dialogueService = new DialogueService();
    this.missionService = new MissionService();
    this.mapObstacles = this.getMapObstacles();
    this.startGameLoop();
  }

  startGameLoop() {
    setInterval(() => {
      this.rooms.forEach(room => {
        if (room.gameStarted && room.players.length > 0) {
          this.gameService.updateEnemyPositions(room.enemies, room.players);
          const now = Date.now();
          room.players.forEach(player => {
            if (player.health <= 0 && !player.deathTimestamp) {
              player.deathTimestamp = now;
              console.log(`SERVER: Jogador ${player.id} morreu. Aguardando solicitação de respawn.`);
            }
          });
          this.io.to(room.id).emit('game_state_updated', { enemies: room.enemies, players: room.players });
        }
      });
    }, 200);
  }

  createRoom(socket, data) {
    const roomId = this.generateRoomId();
    const room = {
      id: roomId,
      host: socket.id,
      players: [],
      maxPlayers: 3,
      gameStarted: false,
      currentMission: 0,
      createdAt: Date.now(),
      activeMission: null,
      missionProgress: 0,
      teamGold: 0,
      npcs: [],
      preciousStones: [],
      rocketState: { lastHealTime: 0 },
      gemMissionCompleted: false,
      coconuts: []
    };
    this.rooms.set(roomId, room);
    this.playerRooms.set(socket.id, roomId);
    socket.join(roomId);
    socket.emit('room_created', { roomId, room });
    console.log(`[GameController] Sala criada: ${roomId} por ${socket.id}`);
  }

  joinRoom(socket, { roomId }) {
    const room = this.rooms.get(roomId);
    if (!room) {
      socket.emit('error', { message: 'Sala não encontrada' });
      return;
    }
    if (room.players.length >= room.maxPlayers) {
      socket.emit('error', { message: 'Sala cheia' });
      return;
    }
    this.playerRooms.set(socket.id, roomId);
    socket.join(roomId);
    socket.emit('room_joined', { roomId, room });
    this.io.to(roomId).emit('player_joined', { playerId: socket.id });
    console.log(`[GameController] ${socket.id} entrou na sala ${roomId}`);
  }

  selectCharacter(socket, { character }) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room) return;
    const alreadySelected = room.players.find(p => p.character === character);
    if (alreadySelected) {
      socket.emit('error', { message: 'Personagem já selecionado por outra jogadora' });
      return;
    }
    const playerIndex = room.players.findIndex(p => p.id === socket.id);
    const characterStats = this.gameService.getCharacterStats(character);
    const player = {
      id: socket.id,
      character,
      ready: true,
      stats: { ...characterStats, id: character.toLowerCase() },
      position: { x: 30 + Math.random() * 4, y: 0.5, z: 30 + Math.random() * 4 },
      health: characterStats.stats.vida_maxima,
      maxHealth: characterStats.stats.vida_maxima,
      hasPotion: false,
      hasReceivedFreePotion: false,
    };
    if (playerIndex >= 0) {
      room.players[playerIndex] = player;
    } else {
      room.players.push(player);
    }
    this.io.to(roomId).emit('player_character_selected', { playerId: socket.id, character, players: room.players });
    if (room.players.length === room.maxPlayers && room.players.every(p => p.ready)) {
      this.startGame(roomId);
    } else if (room.gameStarted) {
      this.startGameForPlayer(socket, room);
    }
  }

  async startGame(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.gameStarted = true;
    room.currentMission = 1;
    room.enemies = this.gameService.getInitialEnemies();
    room.npcs = [];
    const introDialogue = await this.dialogueService.getDialogue('intro');
    const mission1Briefing = await this.dialogueService.getDialogue('missao_1_briefing');
    const mission1Data = await this.missionService.getMission(1);
    this.io.to(roomId).emit('game_started', { introDialogue, mission1Briefing, mission: mission1Data, players: room.players, enemies: room.enemies, npcs: room.npcs });
    console.log(`[GameController] Jogo iniciado na sala ${roomId}`);
  }

  async startGameForPlayer(socket, room) {
    const missionData = await this.missionService.getMission(room.currentMission || 1);
    socket.emit('game_started', { mission: missionData, players: room.players, enemies: room.enemies, npcs: room.npcs });
    console.log(`[GameController] Enviando dados de jogo em andamento para ${socket.id} na sala ${room.id}`);
  }

  forceStartGame(socket) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || room.gameStarted) return;
    if (socket.id !== room.host) {
      socket.emit('error', { message: 'Apenas o host pode forçar o início' });
      return;
    }
    if (room.players.length === 0) {
      socket.emit('error', { message: 'Nenhuma jogadora pronta' });
      return;
    }
    console.log(`[GameController] Host forçou início da sala ${roomId}`);
    this.startGame(roomId);
  }

  handlePlayerMove(socket, data) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.position = data.position;
      player.rotation = data.rotation;
    }
    socket.to(roomId).emit('player_moved', { playerId: socket.id, ...data });
  }

  handlePlayerAttack(socket, { targetIds, damage = null, damageMultiplier = 1.0, instakillChance = 0 }) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.gameStarted) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    targetIds.forEach(targetId => {
      const target = room.enemies.find(e => e.id === targetId);
      const wasAlive = target && target.health > 0;
      const instakillTriggered = instakillChance > 0 && Math.random() < instakillChance;
      if (instakillTriggered && target && target.health > 0) {
        console.log(`💀 INSTAKILL! ${socket.id} matou ${targetId} instantaneamente (${instakillChance * 100}% chance)`);
        target.health = 0;
      } else {
        this.gameService.applyAttackDamage(player, room.enemies, targetId, damage, damageMultiplier);
      }
      const isDead = target && target.health <= 0;
      if (wasAlive && isDead) {
        this.handleEnemyDeath(roomId, target, socket);
      }
    });
    room.enemies.forEach(enemy => {
      if (enemy.health <= 0 && !enemy.isDying) {
        enemy.isDying = true;
        setTimeout(() => {
          room.enemies = room.enemies.filter(e => e.id !== enemy.id);
        }, 2000);
      }
    });
    this.io.to(roomId).emit('game_state_updated', { enemies: room.enemies, players: room.players });
  }

  handleEnemyDeath(roomId, enemy, killerSocket) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    killerSocket.emit('xp_gained', { amount: 10, reason: 'monster_kill' });
    if (enemy.type === 'coconaro') {
      // Coconaro só morre de verdade se todos os cocos foram coletados
      if (room.activeMission.id === 'coconaro_boss_fight' && room.activeMission.phase === 'kill_coconaro') {
        console.log('SERVER: COCONARO DERROTADO! Iniciando cutscene final.');
        this.io.to(roomId).emit('final_cutscene_start', { dialogueKey: 'coconaro_derrotado' });
        setTimeout(() => {
          this.io.to(roomId).emit('show_credits');
        }, 10000); // Mostra créditos após 10s de cutscene

        // Recompensa da missão Coconaro
        const goldReward = 500;
        const xpReward = 1000;
        room.teamGold += goldReward;
        this.io.to(roomId).emit('xp_gained', { amount: xpReward, reason: 'mission_complete' });
        this.io.to(roomId).emit('dialogue_triggered', { speaker: 'Oráculo', text: `A comunidade está livre! Recompensa: ${goldReward} de ouro e ${xpReward} XP!` });

        // Limpar missão após a derrota do Coconaro
        room.activeMission = null;
        room.missionProgress = 0;
        this.io.to(roomId).emit('mission_updated', { activeMission: room.activeMission, missionProgress: room.missionProgress, teamGold: room.teamGold });

        // Remover Coconaro e outros inimigos
        room.enemies = room.enemies.filter(e => e.id !== 'coconaro_boss');
      } else {
        // Se o HP acabou mas os cocos não, ele não morre de verdade
        console.log('SERVER: HP do Coconaro chegou a 0, mas os cocos não foram coletados. Restaurando 1 HP.');
        enemy.health = 1;
      }
    } else if (room.activeMission && room.activeMission.target === enemy.type) {
      room.missionProgress++;
      this.io.to(roomId).emit('mission_updated', { activeMission: room.activeMission, missionProgress: room.missionProgress, teamGold: room.teamGold });
    }
  }

  handleCollectCoconut(socket, { coconutId }) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.gameStarted || room.activeMission?.id !== 'coconaro_boss_fight') return;
    const coconutIndex = room.coconuts.findIndex(c => c.id === coconutId);
    if (coconutIndex === -1) return;
    room.coconuts.splice(coconutIndex, 1);
    room.missionProgress.cocos = (room.missionProgress.cocos || 0) + 1;

    // Se todos os cocos foram coletados, muda a fase da missão
    if (room.missionProgress.cocos >= room.activeMission.objetivos.alvos.cocos && room.activeMission.phase === 'collect_cocos') {
        room.activeMission.phase = 'kill_coconaro';
        room.activeMission.description = 'Todos os cocos foram coletados! Agora, derrote Coconaro!';
        room.activeMission.objetivos.texto_ui = 'Colete os Cocos e Mate o Coconaro';
        this.io.to(roomId).emit('dialogue_triggered', { speaker: 'Oráculo', text: 'Vocês coletaram todos os cocos! Agora, matem o Coconaro!' });
    }

    const boss = room.enemies.find(e => e.id === 'coconaro_boss');
    if (boss) {
      const wasAlive = boss.health > 0;
      boss.health = Math.max(0, boss.health - 25);
      const isDead = boss.health <= 0;
      if (wasAlive && isDead) {
        this.handleEnemyDeath(roomId, boss, socket);
      }
    }
    this.io.to(roomId).emit('coconut_collected', { coconutId });
    this.io.to(roomId).emit('mission_updated', { activeMission: room.activeMission, missionProgress: room.missionProgress, teamGold: room.teamGold });
  }

  handleDeliverHeart(socket) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player || !player.hasCoconaroHeart) return;
    player.hasCoconaroHeart = false;
    this.io.to(roomId).emit('final_cutscene_start', { dialogueKey: 'coconaro_derrotado' });
    setTimeout(() => {
      this.io.to(roomId).emit('show_credits');
    }, 10000);
  }

  handlePlayerSpecial(socket, data) {
    const roomId = this.playerRooms.get(socket.id);
    if (!roomId) return;
    this.io.to(roomId).emit('player_used_special', { playerId: socket.id, ...data });
  }

  handlePlayerRespawn(socket) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.gameStarted) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player || player.health > 0) return;
    const now = Date.now();
    const timeSinceDeath = player.deathTimestamp ? now - player.deathTimestamp : 0;
    if (timeSinceDeath >= 5000) {
      this.gameService.respawnPlayer(player);
      player.deathTimestamp = null;
    } else {
      socket.emit('error', { message: `Aguarde ${((5000 - timeSinceDeath) / 1000).toFixed(1)}s para renascer` });
    }
  }

  handlePlayerHeal(socket, { amount }) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.gameStarted) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    player.health = Math.min(player.maxHealth, player.health + amount);
    this.io.to(roomId).emit('game_state_updated', { enemies: room.enemies, players: room.players });
  }

  handleRocketHealArea(socket, { targetIds, amount }) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.gameStarted) return;
    const currentTime = Date.now();
    const timeSinceLastHeal = currentTime - room.rocketState.lastHealTime;
    if (timeSinceLastHeal < 1000) {
      return;
    }
    room.rocketState.lastHealTime = currentTime;
    targetIds.forEach(targetId => {
      const targetPlayer = room.players.find(p => p.id === targetId);
      if (!targetPlayer) return;
      targetPlayer.health = Math.min(targetPlayer.maxHealth, targetPlayer.health + amount);
    });
    this.io.to(roomId).emit('game_state_updated', { enemies: room.enemies, players: room.players, rocketState: room.rocketState });
  }

  handlePlayerHealArea(socket, { targetId, amount }) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.gameStarted) return;
    const targetPlayer = room.players.find(p => p.id === targetId);
    if (!targetPlayer) return;
    targetPlayer.health = Math.min(targetPlayer.maxHealth, targetPlayer.health + amount);
    this.io.to(roomId).emit('game_state_updated', { enemies: room.enemies, players: room.players });
  }

  async handleInteractWithOracle(socket) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.gameStarted) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    if (player.hasCoconaroHeart) {
      return this.handleDeliverHeart(socket);
    }
    // Para a missão do Coconaro, o Oráculo não completa a missão aqui.
    // A missão é completada ao matar o Coconaro após coletar os cocos.
    if (room.activeMission?.id === 'coconaro_boss_fight') {
        // Oráculo pode dar dicas ou apenas não fazer nada
        this.io.to(roomId).emit('dialogue_triggered', { 
            speaker: 'Oráculo', 
            text: room.activeMission.phase === 'collect_cocos' 
                ? 'Ainda faltam cocos para coletar antes de enfrentar Coconaro de verdade!' 
                : 'Coconaro está à espreita! Derrotem-no para libertar a comunidade!' 
        });
        return;
    }

    if (room.activeMission && room.missionProgress >= room.activeMission.requiredCount) {
      return this.handleMissionComplete(socket);
    }
    if (room.gemMissionCompleted && !room.activeMission) {
      const briefing = await this.dialogueService.getDialogue('coconaro_briefing');
      socket.emit('show_mission_choice', {
        title: 'O Próximo Passo',
        dialogue: briefing.oraculo,
        choices: [
          { id: 'zombie_repeat', text: 'Repetir Missão: Matar Zumbis' },
          { id: 'coconaro_boss_fight', text: 'Nova Missão: Enfrentar Coconaro' },
        ]
      });
      return;
    }
    if (!room.activeMission) {
      this.handleMissionAccept(socket, { missionId: 'kill_zombies_1' });
    }
  }

  handleMissionAccept(socket, { missionId }) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.gameStarted) return;
    room.activeMission = {
      id: missionId,
      title: 'Eliminar os Mortos-Vivos',
      description: 'O Oráculo pede que vocês eliminem 5 zumbis que ameaçam a região.',
      type: 'kill',
      target: 'zombie',
      requiredCount: 5
    };
    room.missionProgress = 0;
    this.io.to(roomId).emit('mission_updated', { activeMission: room.activeMission, missionProgress: room.missionProgress, teamGold: room.teamGold });
  }

  async handleStartMission(socket, { missionId }) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.gameStarted) return;
    if (missionId === 'coconaro_boss_fight') {
      const missionData = await this.missionService.getMission('mission_coconaro_boss');
      room.activeMission = {
          ...missionData,
          phase: 'collect_cocos' // Define a fase inicial da missão do Coconaro
      };
      room.missionProgress = { cocos: 0, coconaro: 0 };
      const bossData = this.gameService.getBossData();
      const coconaro = {
        id: 'coconaro_boss',
        type: 'coconaro',
        position: [-30, 0.5, 37],
        health: bossData.stats.hp,
        maxHealth: bossData.stats.hp,
      };
      room.enemies.push(coconaro);
      room.coconuts = this.generateCoconutPositions(20);
      this.io.to(roomId).emit('mission_updated', { activeMission: room.activeMission, missionProgress: room.missionProgress, teamGold: room.teamGold });
      this.io.to(roomId).emit('coconaro_mission_started', { boss: coconaro, coconuts: room.coconuts });
    } else if (missionId === 'zombie_repeat') {
      this.handleMissionAccept(socket, { missionId: 'kill_zombies_1' });
    }
  }

  handleMissionComplete(socket) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.gameStarted || !room.activeMission) return;
    // Para a missão do Coconaro, a conclusão é tratada em handleEnemyDeath
    if (room.activeMission.id === 'coconaro_boss_fight') return;

    if (room.missionProgress < room.activeMission.requiredCount) {
      return;
    }
    let goldReward = 0;
    let xpReward = 0;
    if (room.activeMission.id === 'kill_zombies_1') {
      goldReward = 50;
      xpReward = 100;
    } else if (room.activeMission.id === 'find_precious_stones') {
      goldReward = 150;
      xpReward = 300;
      room.gemMissionCompleted = true;
    }
    if (goldReward > 0) {
      room.teamGold += goldReward;
    }
    if (xpReward > 0) {
      this.io.to(roomId).emit('xp_gained', { amount: xpReward, reason: 'mission_complete' });
    }
    this.io.to(roomId).emit('dialogue_triggered', { speaker: 'Oráculo', text: `Excelente trabalho, heroínas! Aqui está sua recompensa!` });
    if (room.activeMission.id === 'kill_zombies_1' && room.preciousStones.length === 0) {
      room.preciousStones = this.generateStonePositions(10);
      this.io.to(roomId).emit('precious_stones_spawned', { stones: room.preciousStones });
      this.io.to(roomId).emit('dialogue_triggered', { speaker: 'Oráculo', text: 'Sinto uma grande energia se espalhando! 10 pedras preciosas apareceram pelo mapa. Tragam-nas para mim!' });
      room.activeMission = {
        id: 'find_precious_stones',
        title: 'Encontrar as Pedras Preciosas',
        description: '10 pedras mágicas apareceram no mapa. Encontrem todas.',
        type: 'collect',
        target: 'precious_stone',
        requiredCount: 10
      };
      room.missionProgress = 0;
      this.io.to(roomId).emit('mission_updated', { activeMission: room.activeMission, missionProgress: room.missionProgress, teamGold: room.teamGold });
    } else {
      room.activeMission = null;
      room.missionProgress = 0;
      this.io.to(roomId).emit('mission_updated', { activeMission: room.activeMission, missionProgress: room.missionProgress, teamGold: room.teamGold });
    }
  }

  handleBuyPotion(socket, { potionId }) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.gameStarted) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    if (player.hasPotion) {
      socket.emit('potion_buy_result', { success: false, message: 'Você já tem uma poção! Use-a antes de comprar outra.' });
      return;
    }
    if (!player.hasReceivedFreePotion) {
      player.hasPotion = true;
      player.hasReceivedFreePotion = true;
      socket.emit('potion_buy_result', { success: true, message: 'Primeira poção cortesia da casa, querida!', cost: 0, isFirstPotion: true });
      return;
    }
    const potionPrice = 50;
    if (room.teamGold < potionPrice) {
      socket.emit('potion_buy_result', { success: false, message: `Você precisa de ${potionPrice} moedas de ouro, querida!` });
      return;
    }
    room.teamGold -= potionPrice;
    player.hasPotion = true;
    socket.emit('potion_buy_result', { success: true, message: 'Poção comprada com sucesso!', cost: potionPrice, isFirstPotion: false });
    this.io.to(roomId).emit('mission_updated', { activeMission: room.activeMission, missionProgress: room.missionProgress, teamGold: room.teamGold });
  }

  handleUsePotion(socket) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.gameStarted) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    if (!player.hasPotion) return;
    if (player.health <= 0) return;
    const healAmount = 25;
    player.health = Math.min(player.maxHealth, player.health + healAmount);
    player.hasPotion = false;
    socket.emit('potion_used', { healAmount: player.health - (player.health - healAmount), newHealth: player.health });
    this.io.to(roomId).emit('game_state_updated', { enemies: room.enemies, players: room.players });
  }

  handleCollectStone(socket, { stoneId }) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.gameStarted) return;
    const stoneIndex = room.preciousStones.findIndex(s => s.id === stoneId);
    if (stoneIndex === -1) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    room.preciousStones.splice(stoneIndex, 1);
    if (room.activeMission && room.activeMission.target === 'precious_stone') {
      room.missionProgress++;
    }
    this.io.to(roomId).emit('stone_collected', { stoneId: stoneId, playerId: socket.id });
    this.io.to(roomId).emit('mission_updated', { activeMission: room.activeMission, missionProgress: room.missionProgress, teamGold: room.teamGold });
    if (room.activeMission && room.missionProgress >= room.activeMission.requiredCount) {
      this.io.to(roomId).emit('dialogue_triggered', { speaker: 'Oráculo', text: 'Excelente! Vocês encontraram todas as pedras! Venham até mim para receber a recompensa!' });
    }
  }

  handleSkillUnlocked(socket, { skillName, bonus }) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.gameStarted) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    if (skillName === 'healthIncrease') {
      player.maxHealth += bonus;
      player.health = Math.min(player.health + bonus, player.maxHealth);
    }
    this.io.to(roomId).emit('game_state_updated', { enemies: room.enemies, players: room.players });
  }

  handleActivateInvulnerability(socket, { duration }) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.gameStarted) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    player.invulnerableUntil = Date.now() + duration;
    this.io.to(roomId).emit('game_state_updated', { enemies: room.enemies, players: room.players });
  }

  handleDebugKillAll(socket) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.gameStarted) return;
    room.enemies.forEach(enemy => {
      if (enemy.health > 0 && enemy.type !== 'rocket') {
        enemy.health = 0;
        enemy.isDying = true;
        this.handleEnemyDeath(roomId, enemy, socket);
      }
    });
    setTimeout(() => {
      room.enemies = room.enemies.filter(e => e.type === 'rocket' || e.health > 0);
      this.io.to(roomId).emit('game_state_updated', { enemies: room.enemies, players: room.players });
    }, 2000);
    this.io.to(roomId).emit('game_state_updated', { enemies: room.enemies, players: room.players });
  }

  handleDebugCompleteMission(socket) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.gameStarted || !room.activeMission) return;

    if (room.activeMission.id === 'coconaro_boss_fight') {
        // Força a coleta de cocos e a transição de fase
        room.missionProgress.cocos = room.activeMission.objetivos.alvos.cocos;
        room.activeMission.phase = 'kill_coconaro';
        room.activeMission.description = 'Todos os cocos foram coletados! Agora, derrote Coconaro!';
        room.activeMission.objetivos.texto_ui = 'Mate o Coconaro';
        this.io.to(roomId).emit('dialogue_triggered', { speaker: 'Oráculo', text: 'DEBUG: Cocos coletados. Mate o Coconaro!' });
    } else {
        room.missionProgress = room.activeMission.requiredCount;
    }
    this.io.to(roomId).emit('mission_updated', { activeMission: room.activeMission, missionProgress: room.missionProgress, teamGold: room.teamGold });
  }

  handleDisconnect(socket) {
    const roomId = this.playerRooms.get(socket.id);
    if (roomId) {
      const room = this.rooms.get(roomId);
      if (room) {
        room.players = room.players.filter(p => p.id !== socket.id);
        this.io.to(roomId).emit('player_left', { playerId: socket.id, players: room.players });
        if (room.players.length === 0) {
          this.rooms.delete(roomId);
        }
      }
      this.playerRooms.delete(socket.id);
    }
  }

  getMapObstacles() {
    return [
      { type: 'box', x: -30, z: 30, width: 16, depth: 14, name: 'mansion' },
      { type: 'box', x: 35, z: -35, width: 22, depth: 20, name: 'cemetery_area' },
      { type: 'box', x: -30, z: 0, width: 18, depth: 15, name: 'food_court_area' },
      { type: 'sphere', x: -25, z: -25, radius: 10, name: 'playground_area' },
      { type: 'sphere', x: 10, z: -10, radius: 1.5 }, { type: 'sphere', x: -12, z: -8, radius: 1.2 },
      { type: 'sphere', x: 15, z: 5, radius: 1.8 }, { type: 'sphere', x: -10, z: 8, radius: 1.3 },
      { type: 'sphere', x: 8, z: 12, radius: 1.4 }, { type: 'sphere', x: -15, z: -15, radius: 1.6 },
      { type: 'sphere', x: -5, z: -12, radius: 1.2 }, { type: 'sphere', x: 12, z: -5, radius: 0.9 },
      { type: 'sphere', x: -8, z: 10, radius: 1.1 }, { type: 'sphere', x: 5, z: 15, radius: 0.9 },
      { type: 'sphere', x: 18, z: -12, radius: 1.2 },
      { type: 'sphere', x: 27, z: -43, radius: 0.5 }, { type: 'sphere', x: 30, z: -41, radius: 0.5 },
      { type: 'sphere', x: 26, z: -38, radius: 0.5 }, { type: 'sphere', x: 29, z: -35, radius: 0.5 },
      { type: 'sphere', x: 26, z: -32, radius: 0.5 }, { type: 'sphere', x: 31, z: -30, radius: 0.5 },
      { type: 'sphere', x: 35, z: -40, radius: 0.5 }, { type: 'sphere', x: 37, z: -37, radius: 0.5 },
      { type: 'sphere', x: 36, z: -33, radius: 0.5 }, { type: 'sphere', x: 40, z: -43, radius: 0.5 },
      { type: 'sphere', x: 43, z: -40, radius: 0.5 }, { type: 'sphere', x: 41, z: -36, radius: 0.5 },
      { type: 'sphere', x: 44, z: -31, radius: 0.5 }, { type: 'sphere', x: 39, z: -28, radius: 0.5 },
    ];
  }

  isPositionObstructed(pos, obstacles) {
    for (const obstacle of obstacles) {
      if (obstacle.type === 'box') {
        const halfWidth = obstacle.width / 2;
        const halfDepth = obstacle.depth / 2;
        if (pos.x >= obstacle.x - halfWidth && pos.x <= obstacle.x + halfWidth &&
            pos.z >= obstacle.z - halfDepth && pos.z <= obstacle.z + halfDepth) {
          return true;
        }
      } else if (obstacle.type === 'sphere') {
        const dx = pos.x - obstacle.x;
        const dz = pos.z - obstacle.z;
        if (Math.sqrt(dx * dx + dz * dz) < obstacle.radius) {
          return true;
        }
      }
    }
    return false;
  }

  generateCoconutPositions(count) {
    const positions = [];
    const obstacles = this.mapObstacles;
    const minDistance = 4;
    const mapLimit = 48;
    const maxAttempts = 500;

    const cemeteryBounds = { x: 35, z: -35, width: 22, depth: 20 };
    const cemeteryObstacles = obstacles.filter(o => o.name !== 'cemetery_area');

    let cemeteryCoconuts = 0;
    let attempts = 0;
    while (cemeteryCoconuts < 3 && attempts < maxAttempts) {
      attempts++;
      const pos = {
        x: cemeteryBounds.x + (Math.random() - 0.5) * cemeteryBounds.width,
        y: 0.5,
        z: cemeteryBounds.z + (Math.random() - 0.5) * cemeteryBounds.depth
      };
      const isTooClose = positions.some(p => Math.sqrt(Math.pow(p.x - pos.x, 2) + Math.pow(p.z - pos.z, 2)) < minDistance);
      if (!this.isPositionObstructed(pos, cemeteryObstacles) && !isTooClose) {
        positions.push({ id: `coco_${positions.length}`, ...pos });
        cemeteryCoconuts++;
      }
    }

    attempts = 0;
    while (positions.length < count && attempts < maxAttempts * 2) {
      attempts++;
      const pos = {
        x: (Math.random() - 0.5) * 2 * mapLimit,
        y: 0.5,
        z: (Math.random() - 0.5) * 2 * mapLimit
      };
      const isTooClose = positions.some(p => Math.sqrt(Math.pow(p.x - pos.x, 2) + Math.pow(p.z - pos.z, 2)) < minDistance);
      if (!this.isPositionObstructed(pos, obstacles) && !isTooClose) {
        positions.push({ id: `coco_${positions.length}`, ...pos });
      }
    }
    return positions;
  }

  generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  generateStonePositions(count) {
    const positions = [];
    const obstacles = this.mapObstacles;
    const minDistance = 10;
    const mapLimit = 45;
    let attempts = 0;
    while (positions.length < count && attempts < 500) {
        attempts++;
        const pos = {
            x: (Math.random() - 0.5) * 2 * mapLimit,
            y: 0.5,
            z: (Math.random() - 0.5) * 2 * mapLimit,
        };
        const isTooClose = positions.some(p => Math.sqrt(Math.pow(p.x - pos.x, 2) + Math.pow(p.z - pos.z, 2)) < minDistance);
        if (!this.isPositionObstructed(pos, obstacles) && !isTooClose) {
            positions.push({ id: `stone_${positions.length}`, ...pos });
        }
    }
    return positions;
  }
}