require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = process.env.PORT || 5000;

// --- CORS for HTTP API routes ---
app.use(cors({
  origin: "https://gamingakku.netlify.app", // your frontend domain
  credentials: true
}));

app.use(express.json());
app.use('/api/auth', authRoutes);

// --- MongoDB connection ---
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('✅ MongoDB Connected');
  })
  .catch(err => console.error('❌ MongoDB Error:', err));

// --- Create HTTP server and Socket.IO ---
const server = http.createServer(app);

// --- CORS for Socket.IO ---
const io = new Server(server, {
  cors: {
    origin: "https://gamingakku.netlify.app", // your frontend domain
    methods: ["GET", "POST"],
    credentials: true
  }
});

let rooms = {};

io.on('connection', (socket) => {
  console.log('✅Connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    if (!rooms[roomId]) {
      rooms[roomId] = {
        board: Array(9).fill(null),
        players: [socket.id],
        turn: socket.id,
      };
    } else if (rooms[roomId].players.length < 2) {
      rooms[roomId].players.push(socket.id);
    }
    io.to(roomId).emit('players-update', rooms[roomId].players);
  });

  socket.on('make-move', ({ roomId, index }) => {
    const room = rooms[roomId];
    if (!room) return;
    if (socket.id !== room.turn) return;
    if (room.board[index]) return;
    const symbol = room.players[0] === socket.id ? 'X' : 'O';
    room.board[index] = symbol;
    room.turn = room.players.find(id => id !== socket.id);
    io.to(roomId).emit('move-made', { board: room.board });
    const winner = CheckWinner(room.board);
    if (winner) {
      io.to(roomId).emit('game-over', { winner });
      delete rooms[roomId];
    } else if (!room.board.includes(null)) {
      io.to(roomId).emit('game-over', { winner: 'Draw' });
      delete rooms[roomId];
    }
  });

  socket.on('disconnect', () => {
    console.log('❌Disconnected:', socket.id);
    // Optionally: clean up rooms here
  });
});

function CheckWinner(board) {
  const wins = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6],            // diagonals
  ];
  for (let [a, b, c] of wins) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
