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
      teamGold: 0,
      // NPCs passivos (não atacam nem tomam dano)
      npcs: [],
      // Missão especial das pedras preciosas
      preciousStones: [], // Array para as 10 pedras
      // Estado do Rocket (cooldown sincronizado)
      rocketState: {
        lastHealTime: 0
      },
      gemMissionCompleted: false, // Flag para controlar a aparição da missão do boss
      coconuts: [] // Array de cocos para a missão do Coconaro
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

    // Condição de vitória do Coconaro
    if (enemy.type === 'coconaro') {
      if (room.missionProgress.cocos >= 20) {
        console.log('SERVER: COCONARO DERROTADO! Dando item Coração do Coconaro.');
        const killer = room.players.find(p => p.id === killerSocket.id);
        if (killer) {
          killer.hasCoconaroHeart = true;
        }
        // Remover todos os outros zumbis
        room.enemies = room.enemies.filter(e => e.type !== 'zombie' && e.id !== 'coconaro_boss');
        this.io.to(roomId).emit('dialogue_triggered', { speaker: 'Oráculo', text: 'O tirano caiu! Levem o coração dele até mim!' });
      } else {
        // Se o HP acabou mas os cocos não, ele não morre de verdade
        console.log('SERVER: HP do Coconaro chegou a 0, mas os cocos não foram coletados. Restaurando 1 HP.');
        enemy.health = 1;
      }
    }
  }

  /**
   * Coletar coco
   */
  handleCollectCoconut(socket, { coconutId }) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.activeMission || room.activeMission.id !== 'coconaro_boss_fight') return;

    const coconutIndex = room.coconuts.findIndex(c => c.id === coconutId);
    if (coconutIndex === -1) return; // Coco já foi coletado

    // Remove o coco
    room.coconuts.splice(coconutIndex, 1);
    room.missionProgress.cocos = (room.missionProgress.cocos || 0) + 1;

    // Aplica dano no Coconaro
    const boss = room.enemies.find(e => e.id === 'coconaro_boss');
    if (boss) {
      const wasAlive = boss.health > 0;
      boss.health = Math.max(0, boss.health - 25);
      console.log(`SERVER: Coco coletado! Dano de 25 no Coconaro. HP restante: ${boss.health}`);
      const isDead = boss.health <= 0;
      if (wasAlive && isDead) {
        this.handleEnemyDeath(roomId, boss, socket);
      }
    }

    // Notifica todos sobre a coleta
    this.io.to(roomId).emit('coconut_collected', { coconutId });
    this.io.to(roomId).emit('mission_updated', { 
      activeMission: room.activeMission, 
      missionProgress: room.missionProgress,
      teamGold: room.teamGold
    });
  }

  /**
   * Entregar o Coração do Coconaro
   */
  handleDeliverHeart(socket) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player || !player.hasCoconaroHeart) return;

    player.hasCoconaroHeart = false; // Consome o item

    // Dispara a cutscene final e os créditos
    this.io.to(roomId).emit('final_cutscene_start', { dialogueKey: 'coconaro_derrotado' });
    setTimeout(() => {
      this.io.to(roomId).emit('show_credits');
    }, 10000); // Mostra créditos após 10s de cutscene

    console.log(`SERVER: ${player.id} entregou o Coração do Coconaro. Fim de jogo.`);
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
   * Interação com o Oráculo - Ponto central para missões
   */
  async handleInteractWithOracle(socket) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.gameStarted) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    // Lógica de Pós-Boss
    if (player.hasCoconaroHeart) {
      return this.handleDeliverHeart(socket);
    }

    // Se tem missão ativa e está completa, completar
    if (room.activeMission && room.missionProgress >= room.activeMission.requiredCount) {
      return this.handleMissionComplete(socket);
    }

    // Lógica de Escolha de Missão (Pós-Gema)
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

    // Lógica Padrão: Aceitar próxima missão sequencial
    if (!room.activeMission) {
      this.handleMissionAccept(socket, { missionId: 'kill_zombies_1' });
    }
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

  /**
   * Inicia uma missão com base na escolha da jogadora
   */
  async handleStartMission(socket, { missionId }) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.gameStarted) return;

    if (missionId === 'coconaro_boss_fight') {
      // Lógica para iniciar a missão do Coconaro
      console.log(`SERVER: Iniciando missão do Coconaro para a sala ${roomId}`);

      const missionData = await this.missionService.getMission('mission_coconaro_boss');
      room.activeMission = missionData;
      room.missionProgress = { cocos: 0, coconaro: 0 };

      // Spawnar Coconaro
      const bossData = this.gameService.getBossData();
      const coconaro = {
        id: 'coconaro_boss',
        type: 'coconaro',
        position: [-30, 0.5, 37], // Atrás da mansão
        health: bossData.stats.hp,
        maxHealth: bossData.stats.hp,
      };
      room.enemies.push(coconaro);

      // Spawnar Cocos
      room.coconuts = this.generateCoconutPositions(20);
      console.log(`SERVER: Gerados ${room.coconuts.length} cocos para a missão do Coconaro`);
      console.log(`SERVER: Primeiros 3 cocos:`, room.coconuts.slice(0, 3));

      this.io.to(roomId).emit('mission_updated', {
        activeMission: room.activeMission,
        missionProgress: room.missionProgress,
        teamGold: room.teamGold
      });

      this.io.to(roomId).emit('coconaro_mission_started', {
        boss: coconaro,
        coconuts: room.coconuts
      });

      console.log(`SERVER: Evento 'coconaro_mission_started' enviado para sala ${roomId}`);

    } else if (missionId === 'zombie_repeat') {
      // Lógica para repetir a missão dos zumbis
      this.handleMissionAccept(socket, { missionId: 'kill_zombies_1' });
    }
  }

  /**
   * Completar missão e coletar recompensa
   */
  handleMissionComplete(socket) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.gameStarted || !room.activeMission) return;

    // Verificar se completou
    if (room.missionProgress < room.activeMission.requiredCount) {
      console.log(`SERVER: Missão não pode ser completada ainda. Progresso: ${room.missionProgress}/${room.activeMission.requiredCount}`);
      return;
    }

    console.log(`SERVER: Completando missão ${room.activeMission.id} para sala ${roomId}`);

    // Determinar recompensas baseado na missão
    let goldReward = 0;
    let xpReward = 0;

    if (room.activeMission.id === 'kill_zombies_1') {
        goldReward = 50;
        xpReward = 100;
    } else if (room.activeMission.id === 'find_precious_stones') {
        goldReward = 150;
        xpReward = 300;
        room.gemMissionCompleted = true; // Marca que a missão da gema foi feita!
    }

    // Adicionar recompensa de ouro
    if (goldReward > 0) {
        room.teamGold += goldReward;
        console.log(`SERVER: Sala ${roomId} completou missão! +${goldReward} ouro (Total: ${room.teamGold})`);
    }
    
    // Dar XP para TODOS os jogadores na sala
    if (xpReward > 0) {
        console.log(`SERVER: Dando ${xpReward} XP para ${room.players.length} jogadores na sala ${roomId}`);
        this.io.to(roomId).emit('xp_gained', { amount: xpReward, reason: 'mission_complete' });
    }

    // Diálogo do Oráculo sobre a recompensa
    this.io.to(roomId).emit('dialogue_triggered', {
      speaker: 'Oráculo',
      text: `Excelente trabalho, heroínas! Aqui está sua recompensa!`
    });

    // Se foi a missão de zumbis, spawnar as 10 pedras preciosas
    if (room.activeMission.id === 'kill_zombies_1' && room.preciousStones.length === 0) {
      room.preciousStones = this.generateStonePositions(10);
      console.log(`SERVER: 10 Pedras preciosas spawnaram.`);

      // Notificar todos sobre as pedras
      this.io.to(roomId).emit('precious_stones_spawned', {
        stones: room.preciousStones
      });

      // Diálogo do Oráculo sobre a pedra
      this.io.to(roomId).emit('dialogue_triggered', {
        speaker: 'Oráculo',
        text: 'Sinto uma grande energia se espalhando! 10 pedras preciosas apareceram pelo mapa. Tragam-nas para mim!'
      });

      // Criar missão da pedra preciosa
      room.activeMission = {
        id: 'find_precious_stones',
        title: 'Encontrar as Pedras Preciosas',
        description: '10 pedras mágicas apareceram no mapa. Encontrem todas.',
        type: 'collect',
        target: 'precious_stone',
        requiredCount: 10
      };
      room.missionProgress = 0;

      // Broadcast missão da pedra
      this.io.to(roomId).emit('mission_updated', {
        activeMission: room.activeMission,
        missionProgress: room.missionProgress,
        teamGold: room.teamGold
      });
    } else {
      // Limpar missão (caso não seja a de zumbis ou já tenha sido feita)
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
  handleCollectStone(socket, { stoneId }) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.gameStarted) return;

    const stoneIndex = room.preciousStones.findIndex(s => s.id === stoneId);
    if (stoneIndex === -1) {
      socket.emit('error', { message: 'Pedra não disponível ou já coletada!' });
      return;
    }

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    // Remove a pedra do array
    room.preciousStones.splice(stoneIndex, 1);

    console.log(`SERVER: ${player.id} coletou a pedra preciosa ${stoneId}!`);

    // Atualiza o progresso da missão
    if (room.activeMission && room.activeMission.target === 'precious_stone') {
      room.missionProgress++;
      console.log(`SERVER: Progresso da missão da pedra: ${room.missionProgress}/${room.activeMission.requiredCount}`);
    }

    // Notifica todos os clientes que a pedra foi coletada
    this.io.to(roomId).emit('stone_collected', {
      stoneId: stoneId,
      playerId: socket.id
    });

    // Broadcast da atualização da missão
    this.io.to(roomId).emit('mission_updated', {
      activeMission: room.activeMission,
      missionProgress: room.missionProgress,
      teamGold: room.teamGold
    });

    // Se todas as pedras foram coletadas, envia um diálogo
    if (room.activeMission && room.missionProgress >= room.activeMission.requiredCount) {
      this.io.to(roomId).emit('dialogue_triggered', {
        speaker: 'Oráculo',
        text: 'Excelente! Vocês encontraram todas as pedras! Venham até mim para receber a recompensa!'
      });
    }
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
   * DEBUG: Completar missão atual (tecla N)
   */
  handleDebugCompleteMission(socket) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.gameStarted) return;

    console.log(`🔧 DEBUG: ${socket.id} forçou completar missão!`);

    if (room.activeMission) {
      // Forçar progresso = requiredCount
      room.missionProgress = room.activeMission.requiredCount;
      
      // Broadcast atualização
      this.io.to(roomId).emit('mission_updated', {
        activeMission: room.activeMission,
        missionProgress: room.missionProgress,
        teamGold: room.teamGold
      });
      
      console.log(`🔧 DEBUG: Missão ${room.activeMission.id} marcada como completa`);
    } else {
      console.log(`🔧 DEBUG: Nenhuma missão ativa para completar`);
    }
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

  /**
   * Gera posições aleatórias e espalhadas para os cocos
   */
  generateCoconutPositions(count) {
    const positions = [];
    const minDistance = 8; // Distância mínima entre cocos
    const mapLimit = 45; // Limites do mapa

    for (let i = 0; i < count; i++) {
      let position;
      let validPosition = false;
      while (!validPosition) {
        position = {
          id: `coco_${i}`,
          x: (Math.random() - 0.5) * 2 * mapLimit,
          y: 0.5,
          z: (Math.random() - 0.5) * 2 * mapLimit,
        };

        validPosition = true;
        for (const existing of positions) {
          const dx = position.x - existing.x;
          const dz = position.z - existing.z;
          const distance = Math.sqrt(dx * dx + dz * dz);
          if (distance < minDistance) {
            validPosition = false;
            break;
          }
        }
      }
      positions.push(position);
    }
    return positions;
  }

  /**
   * Gera posições aleatórias e espalhadas para as pedras preciosas
   */
  generateStonePositions(count) {
    const positions = [];
    const minDistance = 10; // Distância mínima entre pedras
    const mapLimit = 45; // Limites do mapa

    for (let i = 0; i < count; i++) {
      let position;
      let validPosition = false;
      while (!validPosition) {
        position = {
          id: `stone_${i}`,
          x: (Math.random() - 0.5) * 2 * mapLimit,
          y: 0.5,
          z: (Math.random() - 0.5) * 2 * mapLimit,
        };

        validPosition = true;
        // Evitar spawn perto do Oráculo
        const distToOracle = Math.sqrt(Math.pow(position.x - 35, 2) + Math.pow(position.z - 35, 2));
        if (distToOracle < 15) {
            validPosition = false;
            continue;
        }

        for (const existing of positions) {
          const dx = position.x - existing.x;
          const dz = position.z - existing.z;
          const distance = Math.sqrt(dx * dx + dz * dz);
          if (distance < minDistance) {
            validPosition = false;
            break;
          }
        }
      }
      positions.push(position);
    }
    return positions;
  }
}