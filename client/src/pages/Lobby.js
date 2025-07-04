import React from 'react';
import { useNavigate } from 'react-router-dom';

const Lobby = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleStartGame = () => {
    navigate('/game');
  };

  return (
    <div>
      <h2>Welcome to the Lobby</h2>
      <p>Select "Start Game" when you're ready!</p>
      <button onClick={handleStartGame}>Start Game</button>
      <br /><br />
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Lobby;
