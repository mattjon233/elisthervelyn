import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GameController } from './controllers/GameController.js';

const app = express();
const httpServer = createServer(app);

// Configuração CORS
app.use(cors());
app.use(express.json());

// Socket.io com CORS configurado
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Em produção, especifique o domínio do cliente
    methods: ["GET", "POST"]
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'O Oráculo Server is running' });
});

// Inicializar controlador do jogo
const gameController = new GameController(io);

// Socket.io connection handling
io.on('connection', (socket) => {
  // Criar ou entrar em sala
  socket.on('create_room', (data) => gameController.createRoom(socket, data));
  socket.on('join_room', (data) => gameController.joinRoom(socket, data));

  // Seleção de personagem
  socket.on('select_character', (data) => gameController.selectCharacter(socket, data));

  // Forçar início do jogo
  socket.on('force_start', () => gameController.forceStartGame(socket));

  // Controles do jogo
  socket.on('player_move', (data) => gameController.handlePlayerMove(socket, data));
  socket.on('player_attack', (data) => gameController.handlePlayerAttack(socket, data));
  socket.on('player_special', (data) => gameController.handlePlayerSpecial(socket, data));
  socket.on('player_heal', (data) => gameController.handlePlayerHeal(socket, data));
  socket.on('player_heal_area', (data) => gameController.handlePlayerHealArea(socket, data));
  socket.on('rocket_heal_area', (data) => gameController.handleRocketHealArea(socket, data));
  socket.on('request_respawn', () => gameController.handlePlayerRespawn(socket));

  // Missões colaborativas
  socket.on('interact_with_oracle', () => gameController.handleInteractWithOracle(socket));
  socket.on('start_mission', (data) => gameController.handleStartMission(socket, data));
  socket.on('collect_coconut', (data) => gameController.handleCollectCoconut(socket, data));
  socket.on('mission_accept', (data) => gameController.handleMissionAccept(socket, data));
  socket.on('mission_complete', () => gameController.handleMissionComplete(socket));

  // Loja da Tia Rose
  socket.on('buy_potion', (data) => gameController.handleBuyPotion(socket, data));
  socket.on('use_potion', () => gameController.handleUsePotion(socket));

  // Pedra Preciosa
  socket.on('collect_stone', (data) => gameController.handleCollectStone(socket, data));

  // Skills
  socket.on('skill_unlocked', (data) => gameController.handleSkillUnlocked(socket, data));
  socket.on('activate_invulnerability', (data) => gameController.handleActivateInvulnerability(socket, data));

  // DEBUG: Matar todos os monstros (tecla B)
  socket.on('debug_kill_all', () => gameController.handleDebugKillAll(socket));
  socket.on('debug_complete_mission', () => gameController.handleDebugCompleteMission(socket));

  // Desconexão
  socket.on('disconnect', () => gameController.handleDisconnect(socket));
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  // Server started
});
