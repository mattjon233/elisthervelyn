import { io } from 'socket.io-client';
import { useGameStore } from '../store/gameStore'; // Importar a store

// URL do servidor (ajustar em produção)
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  /**
   * Conectar ao servidor
   */
  connect() {
    if (this.socket?.connected) {
      console.log('[Socket] Já conectado');
      return this.socket;
    }

    this.socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      this.connected = true;
      console.log('[Socket] Conectado:', this.socket.id);
      // Atualiza o ID do jogador na store global
      useGameStore.getState().setPlayerId(this.socket.id);
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      console.log('[Socket] Desconectado');
    });

    this.socket.on('error', (error) => {
      console.error('[Socket] Erro:', error);
    });

    return this.socket;
  }

  /**
   * Desconectar
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  /**
   * Emitir evento
   */
  emit(event, data) {
    if (!this.socket) {
      console.warn('[Socket] Socket não conectado');
      return;
    }
    this.socket.emit(event, data);
  }

  /**
   * Escutar evento
   */
  on(event, callback) {
    if (!this.socket) {
      console.warn('[Socket] Socket não conectado');
      return;
    }
    this.socket.on(event, callback);
  }

  /**
   * Remover listener
   */
  off(event, callback) {
    if (!this.socket) return;
    this.socket.off(event, callback);
  }

  /**
   * Criar sala
   */
  createRoom() {
    return new Promise((resolve, reject) => {
      this.emit('create_room', {});
      this.socket.once('room_created', (data) => resolve(data));
      this.socket.once('error', (error) => reject(error));
    });
  }

  /**
   * Entrar em sala
   */
  joinRoom(roomId) {
    return new Promise((resolve, reject) => {
      this.emit('join_room', { roomId });
      this.socket.once('room_joined', (data) => resolve(data));
      this.socket.once('error', (error) => reject(error));
    });
  }

  /**
   * Selecionar personagem
   */
  selectCharacter(character) {
    this.emit('select_character', { character });
  }

  /**
   * Forçar início do jogo (host)
   */
  forceStartGame() {
    this.emit('force_start');
  }

  /**
   * Enviar movimento
   */
  sendMovement(position, rotation) {
    this.emit('player_move', { position, rotation });
  }

  /**
   * Enviar ataque
   */
  sendAttack(targetIds, damage = null, damageMultiplier = 1.0, instakillChance = 0) {
    this.emit('player_attack', { targetIds, damage, damageMultiplier, instakillChance });
  }

  /**
   * Usar habilidade especial
   */
  sendSpecial(position) {
    this.emit('player_special', { position });
  }

  /**
   * Solicitar respawn
   */
  requestRespawn() {
    this.emit('request_respawn', {});
  }

  /**
   * Enviar cura
   */
  sendHeal(amount) {
    this.emit('player_heal', { amount });
  }
}

export default new SocketService();
