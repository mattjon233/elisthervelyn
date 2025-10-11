import { GameService } from '../services/GameService.js';
import { DialogueService } from '../services/DialogueService.js';
import { MissionService } from '../services/MissionService.js';

/**
 * GameController - Gerencia eventos do Socket.io e coordena serviços do jogo
 */
export class GameController {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // roomId -> room data
    this.playerRooms = new Map(); // socketId -> roomId

    this.gameService = new GameService();
    this.dialogueService = new DialogueService();
    this.missionService = new MissionService();

    // Iniciar o game loop do servidor
    this.startGameLoop();
  }

  /**
   * Game loop principal do servidor
   */
  startGameLoop() {
    setInterval(() => {
      this.rooms.forEach(room => {
        if (room.gameStarted && room.players.length > 0) {
          // Atualiza a posição dos inimigos e aplica dano
          this.gameService.updateEnemyPositions(room.enemies, room.players);

          // Marca o timestamp de morte para jogadores que acabaram de morrer
          const now = Date.now();
          room.players.forEach(player => {
            if (player.health <= 0 && !player.deathTimestamp) {
              player.deathTimestamp = now; // Marca quando o jogador morreu
              console.log(`SERVER: Jogador ${player.id} morreu. Aguardando solicitação de respawn.`);
            }
          });

          // Envia o estado atualizado para todos na sala
          this.io.to(room.id).emit('game_state_updated', { enemies: room.enemies, players: room.players });
        }
      });
    }, 200); // Atualiza 5x por segundo
  }

  /**
   * Criar nova sala de jogo
   */
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
      // Missões colaborativas
      activeMission: null,
      missionProgress: 0,
      teamGold: 5000,
      // NPCs passivos (não atacam nem tomam dano)
      npcs: [],
      // Missão especial da pedra preciosa
      preciousStone: {
        spawned: false,
        collected: false,
        position: null
      },
      // Estado do Rocket (cooldown sincronizado)
      rocketState: {
        lastHealTime: 0
      }
    };

    this.rooms.set(roomId, room);
    this.playerRooms.set(socket.id, roomId);

    socket.join(roomId);
    socket.emit('room_created', { roomId, room });

    console.log(`[GameController] Sala criada: ${roomId} por ${socket.id}`);
  }

  /**
   * Entrar em sala existente
   */
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

  /**
   * Selecionar personagem
   */
  selectCharacter(socket, { character }) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);

    if (!room) return;

    // Verificar se personagem já foi escolhido
    const alreadySelected = room.players.find(p => p.character === character);
    if (alreadySelected) {
      socket.emit('error', { message: 'Personagem já selecionado por outra jogadora' });
      return;
    }

    // Adicionar ou atualizar jogadora
    const playerIndex = room.players.findIndex(p => p.id === socket.id);
    const characterStats = this.gameService.getCharacterStats(character);
    const player = {
      id: socket.id,
      character,
      ready: true,
      stats: {
        ...characterStats,
        id: character.toLowerCase() // Adicionar ID para sincronização
      },
      position: { x: 30 + Math.random() * 4, y: 0.5, z: 30 + Math.random() * 4 }, // Spawn perto do Oracle
      health: characterStats.stats.vida_maxima,
      maxHealth: characterStats.stats.vida_maxima,
      // Sistema de poções
      hasPotion: false,
      hasReceivedFreePotion: false,
    };

    if (playerIndex >= 0) {
      room.players[playerIndex] = player;
    } else {
      room.players.push(player);
    }

    // Notificar sala
    this.io.to(roomId).emit('player_character_selected', {
      playerId: socket.id,
      character,
      players: room.players
    });

    // Iniciar automaticamente apenas quando 3 jogadoras estiverem prontas
    if (room.players.length === room.maxPlayers && room.players.every(p => p.ready)) {
      this.startGame(roomId);
    } else if (room.gameStarted) {
      // Se o jogo já começou, envia os dados apenas para a jogadora que acabou de entrar
      this.startGameForPlayer(socket, room);
    }
  }

  /**
   * Iniciar jogo
   */
  async startGame(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.gameStarted = true;
    room.currentMission = 1;

    // O servidor agora é o dono da lista de inimigos
    room.enemies = this.gameService.getInitialEnemies();

    // NPCs agora são estáticos no cliente, este array pode ser usado para NPCs dinâmicos no futuro
    room.npcs = [];

    // Carregar diálogo de introdução
    const introDialogue = await this.dialogueService.getDialogue('intro');
    const mission1Briefing = await this.dialogueService.getDialogue('missao_1_briefing');
    const mission1Data = await this.missionService.getMission(1);

    this.io.to(roomId).emit('game_started', {
      introDialogue,
      mission1Briefing,
      mission: mission1Data,
      players: room.players,
      enemies: room.enemies, // Envia a lista inicial de inimigos
      npcs: room.npcs, // Envia NPCs passivos
    });

    console.log(`[GameController] Jogo iniciado na sala ${roomId}`);
  }

  /**
   * Envia os dados de um jogo já iniciado para uma jogadora específica
   */
  async startGameForPlayer(socket, room) {
    const missionData = await this.missionService.getMission(room.currentMission || 1);

    socket.emit('game_started', {
      mission: missionData,
      players: room.players,
      enemies: room.enemies, // Envia inimigos para jogadores que entram depois
      npcs: room.npcs,       // Envia NPCs para jogadores que entram depois
    });

    console.log(`[GameController] Enviando dados de jogo em andamento para ${socket.id} na sala ${room.id}`);
  }

  /**
   * Forçar início do jogo (para testes)
   */
  forceStartGame(socket) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);

    if (!room) return;
    if (room.gameStarted) return; // Já iniciado

    // Verificar se é o host
    if (socket.id !== room.host) {
      socket.emit('error', { message: 'Apenas o host pode forçar o início' });
      return;
    }

    // Verificar se há pelo menos 1 jogador pronto
    if (room.players.length === 0) {
      socket.emit('error', { message: 'Nenhuma jogadora pronta' });
      return;
    }

    console.log(`[GameController] Host forçou início da sala ${roomId}`);
    this.startGame(roomId);
  }

  /**
   * Movimentação do jogador
   */
  handlePlayerMove(socket, data) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room) return;

    // Atualiza a posição do jogador no estado do servidor
    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.position = data.position;
      player.rotation = data.rotation;
    }

    // Broadcast para outros jogadores na sala
    socket.to(roomId).emit('player_moved', {
      playerId: socket.id,
      ...data
    });
  }

  /**
   * Ataque básico e habilidades
   */
  handlePlayerAttack(socket, { targetIds, damage = null, damageMultiplier = 1.0, instakillChance = 0 }) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.gameStarted) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    targetIds.forEach(targetId => {
      const target = room.enemies.find(e => e.id === targetId);
      const wasAlive = target && target.health > 0;

      // Verificar instakill primeiro
      const instakillTriggered = instakillChance > 0 && Math.random() < instakillChance;
      if (instakillTriggered && target && target.health > 0) {
        console.log(`💀 INSTAKILL! ${socket.id} matou ${targetId} instantaneamente (${instakillChance * 100}% chance)`);
        target.health = 0;
      } else {
        // Se não houve instakill, aplica dano normal com multiplicador
        this.gameService.applyAttackDamage(player, room.enemies, targetId, damage, damageMultiplier);
      }

      // Se o inimigo morreu agora, processar morte (XP + progresso de missão)
      const isDead = target && target.health <= 0;
      if (wasAlive && isDead) {
        this.handleEnemyDeath(roomId, target, socket);
      }
    });

    // Remove inimigos mortos após um delay para a animação tocar no cliente
    room.enemies.forEach(enemy => {
      if (enemy.health <= 0 && !enemy.isDying) {
        enemy.isDying = true; // Marca para não processar de novo
        setTimeout(() => {
          room.enemies = room.enemies.filter(e => e.id !== enemy.id);
        }, 2000); // Remove após 2 segundos
      }
    });

    // Broadcast do novo estado dos inimigos e jogadores
    this.io.to(roomId).emit('game_state_updated', { enemies: room.enemies, players: room.players });
  }

  /**
   * Processa a morte de um inimigo (XP + progresso de missão)
   * Garante que cada morte seja processada apenas 1 vez
   */
  handleEnemyDeath(roomId, enemy, killerSocket) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // Dar 10 XP para o jogador que matou
    killerSocket.emit('xp_gained', { amount: 10, reason: 'monster_kill' });
    console.log(`SERVER: ${killerSocket.id} ganhou 10 XP por matar ${enemy.id}`);

    // Incrementar progresso da missão se for o tipo certo
    if (room.activeMission && room.activeMission.target === enemy.type) {
      room.missionProgress++;
      console.log(`SERVER: Progresso da missão: ${room.missionProgress}/${room.activeMission.requiredCount}`);

      // Broadcast atualização de missão
      this.io.to(roomId).emit('mission_updated', {
        activeMission: room.activeMission,
        missionProgress: room.missionProgress,
        teamGold: room.teamGold
      });
    }
  }

  /**
   * Habilidade especial
   */
  handlePlayerSpecial(socket, data) {
    const roomId = this.playerRooms.get(socket.id);
    if (!roomId) return;

    this.io.to(roomId).emit('player_used_special', {
      playerId: socket.id,
      ...data
    });
  }

  /**
   * Jogador solicita respawn (apenas após 5 segundos de morte)
   */
  handlePlayerRespawn(socket) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.gameStarted) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player || player.health > 0) return;

    // Verifica se já passou o tempo mínimo de 5 segundos
    const now = Date.now();
    const timeSinceDeath = player.deathTimestamp ? now - player.deathTimestamp : 0;

    if (timeSinceDeath >= 5000) {
      this.gameService.respawnPlayer(player);
      player.deathTimestamp = null; // Limpa o timestamp de morte
      console.log(`SERVER: Jogador ${player.id} renasceu manualmente após ${(timeSinceDeath / 1000).toFixed(1)}s.`);
      // O game loop se encarregará de transmitir o estado atualizado para todos.
    } else {
      console.log(`SERVER: Jogador ${player.id} tentou renascer muito cedo. Tempo restante: ${((5000 - timeSinceDeath) / 1000).toFixed(1)}s`);
      socket.emit('error', { message: `Aguarde ${((5000 - timeSinceDeath) / 1000).toFixed(1)}s para renascer` });
    }
  }

  /**
   * Cura do jogador
   */
  handlePlayerHeal(socket, { amount }) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.gameStarted) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    // Aplica a cura sem ultrapassar o máximo
    const oldHealth = player.health;
    player.health = Math.min(player.maxHealth, player.health + amount);
    const actualHeal = player.health - oldHealth;

    console.log(`SERVER: Jogador ${player.id} curou ${actualHeal} HP (${oldHealth} -> ${player.health})`);

    // Broadcast do novo estado
    this.io.to(roomId).emit('game_state_updated', { enemies: room.enemies, players: room.players });
  }

  /**
   * Cura em área do Rocket (processa múltiplas jogadoras atomicamente)
   */
  handleRocketHealArea(socket, { targetIds, amount }) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.gameStarted) return;

    const currentTime = Date.now();
    const timeSinceLastHeal = currentTime - room.rocketState.lastHealTime;

    console.log(`🐕 SERVER: handleRocketHealArea chamado por ${socket.id} - ${timeSinceLastHeal}ms desde última cura`);

    // PROTEÇÃO: Ignorar se foi chamado há menos de 1 segundo (possível duplicata)
    if (timeSinceLastHeal < 1000) {
      console.log(`⚠️ SERVER: Ignorando cura duplicada (muito rápido: ${timeSinceLastHeal}ms)`);
      return;
    }

    console.log(`🐕 SERVER: Processando cura de ${targetIds.length} jogadoras (${amount} HP cada)`);

    // Atualizar timestamp PRIMEIRO para evitar processamento duplicado
    room.rocketState.lastHealTime = currentTime;

    // Aplicar cura em todas as jogadoras
    targetIds.forEach(targetId => {
      const targetPlayer = room.players.find(p => p.id === targetId);
      if (!targetPlayer) return;

      const oldHealth = targetPlayer.health;
      targetPlayer.health = Math.min(targetPlayer.maxHealth, targetPlayer.health + amount);
      const actualHeal = targetPlayer.health - oldHealth;

      console.log(`🐕 SERVER: Rocket curou ${targetId} em ${actualHeal} HP (${oldHealth} -> ${targetPlayer.health})`);
    });

    // Broadcast do novo estado para todos (incluindo timestamp do Rocket)
    this.io.to(roomId).emit('game_state_updated', {
      enemies: room.enemies,
      players: room.players,
      rocketState: room.rocketState
    });
  }

  /**
   * Cura em área (habilidade Esther - mantido para compatibilidade)
   */
  handlePlayerHealArea(socket, { targetId, amount }) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.gameStarted) return;

    const targetPlayer = room.players.find(p => p.id === targetId);
    if (!targetPlayer) return;

    // Aplica a cura sem ultrapassar o máximo
    const oldHealth = targetPlayer.health;
    targetPlayer.health = Math.min(targetPlayer.maxHealth, targetPlayer.health + amount);
    const actualHeal = targetPlayer.health - oldHealth;

    console.log(`SERVER: Habilidade curou ${targetId} em ${actualHeal} HP (${oldHealth} -> ${targetPlayer.health})`);

    // Broadcast do novo estado para todos
    this.io.to(roomId).emit('game_state_updated', {
      enemies: room.enemies,
      players: room.players
    });
  }

  /**
   * Aceitar missão (colaborativa)
   */
  handleMissionAccept(socket, { missionId }) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.gameStarted) return;

    // Define missão ativa para toda a sala
    room.activeMission = {
      id: missionId,
      title: 'Eliminar os Mortos-Vivos',
      description: 'O Oráculo pede que vocês eliminem 5 zumbis que ameaçam a região.',
      type: 'kill',
      target: 'zombie',
      requiredCount: 5
    };
    room.missionProgress = 0;

    console.log(`SERVER: Sala ${roomId} aceitou missão ${missionId}`);

    // Broadcast para todos na sala
    this.io.to(roomId).emit('mission_updated', {
      activeMission: room.activeMission,
      missionProgress: room.missionProgress,
      teamGold: room.teamGold
    });
  }

  // handleMissionProgress removido - agora o progresso é automático em handleEnemyDeath

  /**
   * Completar missão e coletar recompensa
   */
  handleMissionComplete(socket) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.gameStarted || !room.activeMission) return;

    // Verificar se completou
    if (room.missionProgress < room.activeMission.requiredCount) return;

    // Adicionar recompensa
    room.teamGold += 100;

    console.log(`SERVER: Sala ${roomId} completou missão! +100 ouro (Total: ${room.teamGold})`);

    // Dar XP para TODOS os jogadores na sala (50 XP por completar missão)
    const playersInRoom = room.players.length;
    console.log(`SERVER: Dando 50 XP para ${playersInRoom} jogadores na sala ${roomId}`);
    this.io.to(roomId).emit('xp_gained', { amount: 50, reason: 'mission_complete' });

    // Se foi a missão de zumbis (target: 'zombie'), spawnar pedra preciosa
    if (room.activeMission.target === 'zombie' && !room.preciousStone.spawned) {
      room.preciousStone.spawned = true;
      // Posição aleatória no mapa (evitando mansão e centro)
      const randomX = (Math.random() - 0.5) * 80; // -40 a 40
      const randomZ = (Math.random() - 0.5) * 80;
      room.preciousStone.position = { x: randomX, y: 0.5, z: randomZ };

      console.log(`SERVER: Pedra preciosa spawnou em [${randomX.toFixed(2)}, ${randomZ.toFixed(2)}]`);

      // Notificar todos sobre a pedra
      this.io.to(roomId).emit('precious_stone_spawned', {
        position: room.preciousStone.position
      });

      // Diálogo do Oráculo sobre a pedra
      this.io.to(roomId).emit('dialogue_triggered', {
        speaker: 'Oráculo',
        text: 'Bem feito, heroínas! Mas espere... sinto uma energia mágica próxima. Uma pedra preciosa apareceu em algum lugar do mapa! Ela é pequena e brilhante. Tragam-na para mim e recompensarei vocês generosamente!'
      });

      // Criar missão da pedra preciosa
      room.activeMission = {
        id: 'find_precious_stone',
        title: 'Encontrar a Pedra Preciosa',
        description: 'Uma pedra mágica apareceu no mapa. Encontrem-na e levem ao Oráculo.',
        type: 'collect',
        target: 'precious_stone',
        requiredCount: 1
      };
      room.missionProgress = 0;

      // Broadcast missão da pedra
      this.io.to(roomId).emit('mission_updated', {
        activeMission: room.activeMission,
        missionProgress: room.missionProgress,
        teamGold: room.teamGold
      });
    } else {
      // Limpar missão (caso não seja zumbi)
      room.activeMission = null;
      room.missionProgress = 0;

      // Broadcast para todos
      this.io.to(roomId).emit('mission_updated', {
        activeMission: room.activeMission,
        missionProgress: room.missionProgress,
        teamGold: room.teamGold
      });
    }
  }

  /**
   * Comprar poção da Tia Rose
   */
  handleBuyPotion(socket, { potionId }) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.gameStarted) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    // Verificar se já tem uma poção
    if (player.hasPotion) {
      socket.emit('potion_buy_result', {
        success: false,
        message: 'Você já tem uma poção! Use-a antes de comprar outra.'
      });
      return;
    }

    // Primeira poção é grátis!
    if (!player.hasReceivedFreePotion) {
      player.hasPotion = true;
      player.hasReceivedFreePotion = true;

      console.log(`SERVER: ${player.id} recebeu primeira poção grátis`);

      socket.emit('potion_buy_result', {
        success: true,
        message: 'Primeira poção cortesia da casa, querida!',
        cost: 0,
        isFirstPotion: true
      });
      return;
    }

    // Preço da poção
    const potionPrice = 50;

    // Verificar se tem ouro suficiente
    if (room.teamGold < potionPrice) {
      socket.emit('potion_buy_result', {
        success: false,
        message: `Você precisa de ${potionPrice} moedas de ouro, querida!`
      });
      return;
    }

    // Descontar ouro e dar poção
    room.teamGold -= potionPrice;
    player.hasPotion = true;

    console.log(`SERVER: ${player.id} comprou poção por ${potionPrice} ouro (Restante: ${room.teamGold})`);

    socket.emit('potion_buy_result', {
      success: true,
      message: 'Poção comprada com sucesso!',
      cost: potionPrice,
      isFirstPotion: false
    });

    // Atualizar ouro para todos
    this.io.to(roomId).emit('mission_updated', {
      activeMission: room.activeMission,
      missionProgress: room.missionProgress,
      teamGold: room.teamGold
    });
  }

  /**
   * Usar poção
   */
  handleUsePotion(socket) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.gameStarted) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    // Verificar se tem poção
    if (!player.hasPotion) {
      socket.emit('error', { message: 'Você não tem nenhuma poção!' });
      return;
    }

    // Verificar se está morto
    if (player.health <= 0) {
      socket.emit('error', { message: 'Você não pode usar poção enquanto está morto!' });
      return;
    }

    // Aplicar cura
    const healAmount = 25;
    const oldHealth = player.health;
    player.health = Math.min(player.maxHealth, player.health + healAmount);
    const actualHeal = player.health - oldHealth;

    // Remover poção do inventário
    player.hasPotion = false;

    console.log(`SERVER: ${player.id} usou poção e curou ${actualHeal} HP (${oldHealth} -> ${player.health})`);

    // Notificar o jogador
    socket.emit('potion_used', {
      healAmount: actualHeal,
      newHealth: player.health
    });

    // Broadcast do novo estado
    this.io.to(roomId).emit('game_state_updated', { enemies: room.enemies, players: room.players });
  }

  /**
   * Coletar pedra preciosa
   */
  handleCollectStone(socket) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.gameStarted) return;

    // Verificar se a pedra existe e não foi coletada
    if (!room.preciousStone.spawned || room.preciousStone.collected) {
      socket.emit('error', { message: 'Pedra não disponível!' });
      return;
    }

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    // Marcar como coletada
    room.preciousStone.collected = true;
    player.hasPreciousStone = true;

    console.log(`SERVER: ${player.id} coletou a pedra preciosa!`);

    // Atualizar progresso da missão (se existe missão da pedra)
    if (room.activeMission && room.activeMission.target === 'precious_stone') {
      room.missionProgress = 1;
      console.log(`SERVER: Progresso da missão da pedra: 1/1`);
    }

    // Notificar todos
    this.io.to(roomId).emit('stone_collected', {
      playerId: socket.id
    });

    // Broadcast atualização de missão
    this.io.to(roomId).emit('mission_updated', {
      activeMission: room.activeMission,
      missionProgress: room.missionProgress,
      teamGold: room.teamGold
    });

    // Diálogo
    this.io.to(roomId).emit('dialogue_triggered', {
      speaker: 'Oráculo',
      text: 'Excelente! Vocês encontraram a pedra! Tragam-na até mim para receber a recompensa!'
    });
  }

  /**
   * Entregar pedra ao Oráculo
   */
  handleDeliverStone(socket) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.gameStarted) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player || !player.hasPreciousStone) {
      socket.emit('error', { message: 'Você não tem a pedra!' });
      return;
    }

    // Dar recompensa
    room.teamGold += 100;
    player.hasPreciousStone = false;

    console.log(`SERVER: ${player.id} entregou a pedra! +100 ouro (Total: ${room.teamGold})`);

    // XP para quem entregou
    socket.emit('xp_gained', { amount: 50, reason: 'stone_delivered' });

    // Limpar missão da pedra
    room.activeMission = null;
    room.missionProgress = 0;

    // Notificar todos
    this.io.to(roomId).emit('stone_delivered', {
      playerId: socket.id,
      teamGold: room.teamGold
    });

    // Diálogo de agradecimento
    this.io.to(roomId).emit('dialogue_triggered', {
      speaker: 'Oráculo',
      text: 'Maravilhoso! Esta pedra possui grande poder mágico. Aqui está sua recompensa: 100 de ouro e 50 XP! Continuem sua jornada, heroínas!'
    });

    // Atualizar estado (missão limpa)
    this.io.to(roomId).emit('mission_updated', {
      activeMission: room.activeMission,
      missionProgress: room.missionProgress,
      teamGold: room.teamGold
    });
  }

  /**
   * Skill desbloqueada - sincronizar com servidor
   */
  handleSkillUnlocked(socket, { skillName, bonus }) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.gameStarted) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    console.log(`📡 SERVER: ${socket.id} desbloqueou skill ${skillName}`);

    // Aplicar bônus de HP
    if (skillName === 'healthIncrease') {
      player.maxHealth += bonus;
      player.health = Math.min(player.health + bonus, player.maxHealth); // Cura também
      console.log(`❤️ SERVER: ${socket.id} HP aumentado: ${player.health}/${player.maxHealth}`);
    }

    // Broadcast atualização
    this.io.to(roomId).emit('game_state_updated', { enemies: room.enemies, players: room.players });
  }

  /**
   * Ativar invulnerabilidade (Skill T)
   */
  handleActivateInvulnerability(socket, { duration }) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.gameStarted) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    const invulnerableUntil = Date.now() + duration;
    player.invulnerableUntil = invulnerableUntil;

    console.log(`🛡️ SERVER: ${socket.id} ativou invulnerabilidade por ${duration}ms (até ${invulnerableUntil})`);

    // Broadcast atualização
    this.io.to(roomId).emit('game_state_updated', { enemies: room.enemies, players: room.players });
  }

  /**
   * DEBUG: Matar todos os monstros (tecla B)
   */
  handleDebugKillAll(socket) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.gameStarted) return;

    console.log(`🔧 DEBUG: ${socket.id} matou todos os monstros!`);

    const killedEnemies = [];

    // Matar todos os inimigos exceto Rocket
    room.enemies.forEach(enemy => {
      if (enemy.health > 0 && enemy.type !== 'rocket') {
        const wasAlive = true;
        enemy.health = 0;
        enemy.isDying = true;
        killedEnemies.push({ id: enemy.id, type: enemy.type });

        // Processar morte (XP + progresso de missão)
        this.handleEnemyDeath(roomId, enemy, socket);
      }
    });

    console.log(`🔧 DEBUG: ${killedEnemies.length} inimigos mortos`);

    // Remover inimigos mortos após delay
    setTimeout(() => {
      room.enemies = room.enemies.filter(e => e.type === 'rocket' || e.health > 0);
      this.io.to(roomId).emit('game_state_updated', { enemies: room.enemies, players: room.players });
    }, 2000);

    // Broadcast estado imediato
    this.io.to(roomId).emit('game_state_updated', { enemies: room.enemies, players: room.players });
  }

  /**
   * Desconexão
   */
  handleDisconnect(socket) {
    const roomId = this.playerRooms.get(socket.id);

    if (roomId) {
      const room = this.rooms.get(roomId);

      if (room) {
        room.players = room.players.filter(p => p.id !== socket.id);

        this.io.to(roomId).emit('player_left', {
          playerId: socket.id,
          players: room.players
        });

        // Se sala ficar vazia, remover
        if (room.players.length === 0) {
          this.rooms.delete(roomId);
          console.log(`[GameController] Sala ${roomId} removida (vazia)`);
        }
      }

      this.playerRooms.delete(socket.id);
    }

    console.log(`[GameController] Jogadora desconectada: ${socket.id}`);
  }

  /**
   * Gerar ID único para sala
   */
  generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}
