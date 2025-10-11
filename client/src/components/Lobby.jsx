import { useState, useEffect } from 'react';
import './Lobby.css';
import socketService from '../services/socket';
import { useGameStore } from '../store/gameStore';
import { useMissionStore } from '../store/missionStore';

function Lobby({ onGameStart }) {
  const [screen, setScreen] = useState('menu'); // 'menu' | 'create' | 'join' | 'waiting'
  const [roomId, setRoomId] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [waitingPlayers, setWaitingPlayers] = useState([]);
  const [error, setError] = useState('');

  const { setPlayerId, setRoomId: setStoreRoomId, setPlayers } = useGameStore();
  const { reset: resetMissions } = useMissionStore();

  const characters = [
    { id: 'esther', name: 'Esther', class: 'Arqueira', color: '#87CEEB' },
    { id: 'elissa', name: 'Elissa', class: 'Guerreira', color: '#C71585' },
    { id: 'evelyn', name: 'Evelyn', class: 'Maga', color: '#FFB6C1' }
  ];

  useEffect(() => {
    // Conectar ao servidor
    const socket = socketService.connect();

    // Reset mission state when entering lobby
    resetMissions();

    // Listeners de eventos
    socketService.on('player_joined', (data) => {
      console.log('[Lobby] Jogadora entrou:', data);
    });

    socketService.on('player_character_selected', (data) => {
      console.log('[Lobby] Personagem selecionado:', data);
      setWaitingPlayers(data.players);
    });

    socketService.on('game_started', (data) => {
      console.log('[Lobby] Jogo iniciado:', data);
      setPlayers(data.players);
      useGameStore.getState().setEnemies(data.enemies || []); // Salva os inimigos na store
      useGameStore.getState().setNpcs(data.npcs || []); // Salva os NPCs na store

      const myPlayerId = useGameStore.getState().playerId;
      const myPlayerData = data.players.find(p => p.id === myPlayerId);
      const characterData = characters.find(c => c.id === myPlayerData?.character);

      onGameStart({
        roomId: roomId,
        character: characterData, // Usa o personagem correto vindo do servidor
        gameData: data
      });
    });

    socketService.on('error', (err) => {
      setError(err.message || 'Erro desconhecido');
    });

    return () => {
      // Cleanup listeners
      socketService.off('player_joined');
      socketService.off('player_character_selected');
      socketService.off('game_started');
      socketService.off('error');
    };
  }, [resetMissions]);

  const handleCreateRoom = async () => {
    try {
      const { roomId: newRoomId } = await socketService.createRoom();
      setRoomId(newRoomId);
      setStoreRoomId(newRoomId);
      setScreen('create');
      setError('');
    } catch (err) {
      setError('Erro ao criar sala');
      console.error(err);
    }
  };

  const handleJoinRoom = () => {
    setScreen('join');
    setError('');
  };

  const handleJoinRoomConfirm = async () => {
    try {
      await socketService.joinRoom(roomId);
      setStoreRoomId(roomId);
      setScreen('create');
      setError('');
    } catch (err) {
      setError('Sala não encontrada');
      console.error(err);
    }
  };

  const handleCharacterSelect = (character) => {
    setSelectedCharacter(character);
    socketService.selectCharacter(character.id);
    // Ir para tela de espera após selecionar
    setScreen('waiting');
  };

  const handleForceStart = () => {
    // Forçar início do jogo (para testes)
    socketService.forceStartGame();
  };

  return (
    <div className="lobby">
      <div className="lobby-background"></div>

      <div className="lobby-content">
        <h1 className="lobby-title">🔮 O ORÁCULO</h1>

        {screen === 'menu' && (
          <div className="lobby-menu">
            <button className="btn btn-primary" onClick={handleCreateRoom}>
              Criar Sala
            </button>
            <button className="btn btn-secondary" onClick={handleJoinRoom}>
              Entrar em Sala
            </button>
          </div>
        )}

        {screen === 'create' && (
          <div className="lobby-create card">
            <h2>Selecione sua Personagem</h2>
            {roomId && (
              <p style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
                Código da Sala: <strong style={{ fontSize: '20px', color: '#D4A5D4', letterSpacing: '2px' }}>{roomId}</strong>
              </p>
            )}
            <div className="character-grid">
              {characters.map(char => (
                <div
                  key={char.id}
                  className={`character-card ${selectedCharacter?.id === char.id ? 'selected' : ''}`}
                  style={{ borderColor: char.color }}
                  onClick={() => handleCharacterSelect(char)}
                >
                  <div
                    className="character-avatar"
                    style={{ backgroundColor: char.color }}
                  ></div>
                  <h3>{char.name}</h3>
                  <p className="character-class">{char.class}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {screen === 'join' && (
          <div className="lobby-join card">
            <h2>Entrar em Sala</h2>
            {error && <p className="error-message">{error}</p>}
            <input
              type="text"
              placeholder="Código da Sala"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              maxLength={6}
            />
            <button className="btn btn-primary" disabled={!roomId} onClick={handleJoinRoomConfirm}>
              Entrar
            </button>
          </div>
        )}

        {screen === 'waiting' && (
          <div className="lobby-waiting card">
            <h2>Sala Criada!</h2>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
              Compartilhe o código com suas amigas:
            </p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: '#D4A5D4', letterSpacing: '4px', marginBottom: '20px' }}>
              {roomId}
            </p>

            <div className="waiting-players">
              <div className="waiting-player">
                <div
                  className="player-avatar"
                  style={{ backgroundColor: selectedCharacter?.color }}
                />
                <span>{selectedCharacter?.name} (Você)</span>
              </div>
              {waitingPlayers.filter(p => p.character !== selectedCharacter?.id).map((player, idx) => (
                <div key={idx} className="waiting-player">
                  <div
                    className="player-avatar"
                    style={{ backgroundColor: characters.find(c => c.id === player.character)?.color }}
                  />
                  <span>{characters.find(c => c.id === player.character)?.name}</span>
                </div>
              ))}
            </div>

            <p className="waiting-text" style={{ marginBottom: '20px' }}>
              {waitingPlayers.length}/3 jogadora{waitingPlayers.length !== 1 ? 's' : ''} pronta{waitingPlayers.length !== 1 ? 's' : ''}
            </p>

            {waitingPlayers.length < 3 ? (
              <>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                  Aguardando mais {3 - waitingPlayers.length} jogadora{3 - waitingPlayers.length !== 1 ? 's' : ''}...
                </p>
                <button
                  className="btn btn-secondary"
                  onClick={handleForceStart}
                  style={{ marginTop: '10px' }}
                >
                  Iniciar Mesmo Assim (Teste)
                </button>
              </>
            ) : (
              <p style={{ fontSize: '14px', color: '#4CAF50', fontWeight: '600' }}>
                ✅ Iniciando em alguns segundos...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Lobby;
