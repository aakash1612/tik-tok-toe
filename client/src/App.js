import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import io from 'socket.io-client';
import './App.css';
import Register from './pages/Register';
import Login from './pages/Login';

// ✅ Import the new Lobby page
import Lobby from './pages/Lobby';

const socket = io('https://tik-tok-toe-backend.onrender.com');

function Game() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [symbol, setSymbol] = useState(null);
  const [turn, setTurn] = useState(null);
  const [roomId] = useState('game123');

  React.useEffect(() => {
    socket.emit('join-room', roomId);

    socket.on('players-update', (players) => {
      const isX = players[0] === socket.id;
      setSymbol(isX ? 'X' : 'O');
    });

    socket.on('move-made', ({ board }) => {
      setBoard(board);
    });

    socket.on('game-over', ({ winner }) => {
      alert(winner === 'Draw' ? 'It\'s a draw!' : `${winner} wins`);
      setBoard(Array(9).fill(null));
    });

    return () => {
      socket.off();
    };
  }, [roomId]);

  const handleClick = (index) => {
    if (board[index] || turn !== symbol) return;
    socket.emit('make-move', { roomId, index });
  };

  React.useEffect(() => {
    if (!symbol) return;
    setTurn('X'); // X starts first

    socket.on('move-made', ({ board }) => {
      setBoard(board);
      setTurn((prev) => (prev === 'X' ? 'O' : 'X'));
    });
  }, [symbol]);

  return (
    <div className="App">
      <h1>🎮 Multiplayer Tic-Tac-Toe</h1>
      <p>You are: <strong>{symbol || '...'}</strong></p>
      <p>Turn: <strong>{turn || 'Waiting...'}</strong></p>

      <div className="board">
        {board.map((cell, index) => (
          <div className="cell" key={index} onClick={() => handleClick(index)}>
            {cell}
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  const handleAuth = () => {
    setIsAuthenticated(true);
  };

  return (
    <Router>
      <Routes>
        <Route path="/register" element={<Register onAuth={handleAuth} />} />
        <Route path="/login" element={<Login onAuth={handleAuth} />} />
        <Route path="/lobby" element={isAuthenticated ? <Lobby /> : <Navigate to="/login" />} />
        <Route path="/game" element={isAuthenticated ? <Game /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to={isAuthenticated ? "/lobby" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;
