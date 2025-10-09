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
      teamGold: 0
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
    const player = {
      id: socket.id,
      character,
      ready: true,
      stats: this.gameService.getCharacterStats(character),
      position: { x: 30 + Math.random() * 4, y: 0.5, z: 30 + Math.random() * 4 }, // Spawn perto do Oracle
      health: this.gameService.getCharacterStats(character).stats.vida_maxima,
      maxHealth: this.gameService.getCharacterStats(character).stats.vida_maxima,
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
    // Adiciona o Rocket à lista de entidades da sala
    room.enemies.push({ id: 'rocket_npc', type: 'rocket', position: [0, 0.5, 2], health: 999, maxHealth: 999 });

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
      players: room.players
      // Diálogos podem ser omitidos para quem entra depois, ou enviados se necessário
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
  handlePlayerAttack(socket, { targetIds, damage = null }) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.gameStarted) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    targetIds.forEach(targetId => {
      // Se o cliente enviou um dano específico (habilidade), usa ele; senão, usa o dano padrão
      this.gameService.applyAttackDamage(player, room.enemies, targetId, damage);
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
   * Cura em área (habilidade Esther)
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

    console.log(`SERVER: ${socket.id} curou ${targetId} em ${actualHeal} HP (${oldHealth} -> ${targetPlayer.health})`);

    // Broadcast do novo estado para todos
    this.io.to(roomId).emit('game_state_updated', { enemies: room.enemies, players: room.players });
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
   * Incrementar progresso da missão (quando mata inimigo)
   */
  handleMissionProgress(socket, { enemyType }) {
    const roomId = this.playerRooms.get(socket.id);
    const room = this.rooms.get(roomId);
    if (!room || !room.gameStarted || !room.activeMission) return;

    // Verificar se é o tipo certo de inimigo
    if (room.activeMission.target !== enemyType) return;

    room.missionProgress++;
    console.log(`SERVER: Missão progresso ${room.missionProgress}/${room.activeMission.requiredCount}`);

    // Broadcast para todos
    this.io.to(roomId).emit('mission_updated', {
      activeMission: room.activeMission,
      missionProgress: room.missionProgress,
      teamGold: room.teamGold
    });
  }

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

    // Limpar missão
    room.activeMission = null;
    room.missionProgress = 0;

    // Broadcast para todos
    this.io.to(roomId).emit('mission_updated', {
      activeMission: room.activeMission,
      missionProgress: room.missionProgress,
      teamGold: room.teamGold
    });
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
