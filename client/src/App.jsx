import { useState } from 'react';
import Lobby from './components/Lobby';
import Game from './components/Game';

function App() {
  const [gameState, setGameState] = useState('lobby'); // 'lobby' | 'game'
  const [roomData, setRoomData] = useState(null);

  const handleGameStart = (data) => {
    setRoomData(data);
    setGameState('game');
  };

  return (
    <div className="app">
      {gameState === 'lobby' && (
        <Lobby onGameStart={handleGameStart} />
      )}
      {gameState === 'game' && (
        <Game roomData={roomData} />
      )}
    </div>
  );
}

export default App;
