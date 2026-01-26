import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import cors from 'cors';
import { ExpressPeerServer } from 'peer';
import { logger } from '../logger.js';
import Queue from '../Queue.js';
import { activePeers, rooms } from '../States.js';

const app = express();
const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

// Enable CORS for Next.js frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  allowEIO3: true,
  transports: ['polling', 'websocket']
});

const chatRandomio = io.of('/chat-random');
const chatOnlyio = io.of('/chat-only');
const chatRoomio = io.of('/chat-room');

const userQueue = new Queue();
const chatUsersQueue = new Queue();
const activeUsers = new Set(); // for chat-random

// API Routes
app.use(express.json());

app.get('/api/check-peer/:id', (req, res) => {
  const peerId = req.params.id;
  if (activePeers[peerId]) {
    res.json({ active: true });
  } else {
    res.json({ active: false });
  }
});

app.get('/api/active-peers-count', (req, res) => {
  const count = Object.keys(activePeers).length;
  res.json({ count });
});

app.post('/api/join-room/:roomID/:peerId', (req, res) => {
  console.log('Join room request received');
  const roomID = req.params.roomID;
  const peerId = req.params.peerId;

  if (!rooms[roomID]) {
    rooms[roomID] = [];
  }

  rooms[roomID].push(peerId);
  res.json({ peers: rooms[roomID].filter(id => id !== peerId) });
});

// Create PeerServer and mount it
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/',
  corsOptions: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

app.use('/peerjs', peerServer);

// PeerServer events
peerServer.on('connection', (client) => {
  const peerId = client.getId();
  if (peerId) {
    logger.info({ peerId }, 'New user connected');
    activePeers[peerId] = true;
  } else {
    logger.info('New user connected (pending ID assignment)');
  }
});

peerServer.on('disconnect', (client) => {
  const peerId = client.getId();
  if (peerId) {
    logger.info({ peerId }, 'User disconnected');
    delete activePeers[peerId];

    for (const roomID in rooms) {
      rooms[roomID] = rooms[roomID].filter(id => id !== peerId);
      if (rooms[roomID].length === 0) {
        delete rooms[roomID];
      }
    }
  } else {
    logger.info('User disconnected (no ID)');
  }
});

peerServer.on('error', (error) => {
  logger.error({ error }, 'PeerServer error');
});

// Socket.io events for chat-random namespace
chatRandomio.on('connection', (socket) => {
  logger.info({ socketId: socket.id }, 'Socket connected to chat-random');
  activeUsers.add(socket.id);
  logger.info({ count: activeUsers.size }, 'Active users count');
  chatRandomio.emit('peerCount', activeUsers.size);

  socket.on('joinQueue', (peerId) => {
    logger.info({ peerId, queueEmpty: userQueue.isEmpty() }, 'User joining queue');
    
    if (userQueue.isEmpty()) {
      userQueue.enqueue({ peerId, socketId: socket.id });
      logger.info({ queueSize: userQueue.size() }, 'User added to queue');
    } else {
      const match = userQueue.dequeue();
      logger.info({ peerId, matchPeerId: match.peerId }, 'Match found! Pairing users');
      chatRandomio.to(match.socketId).emit('matchFound', peerId);
      chatRandomio.to(socket.id).emit('matchFound', match.peerId);
    }
  });

  socket.on('disconnect', () => {
    logger.info({ socketId: socket.id }, 'User disconnected from chat-random');
    activeUsers.delete(socket.id);
    chatRandomio.emit('peerCount', activeUsers.size);
  });
});

// Socket.io events for chat-only namespace
chatOnlyio.on('connection', (socket) => {
  logger.info({ socketId: socket.id }, 'New client connected to chat-only namespace');

  socket.on('joinChatQueue', (peerId) => {
    if (chatUsersQueue.isEmpty()) {
      chatUsersQueue.enqueue({ peerId, socketId: socket.id });
      logger.info({ peerId }, 'User added to chat queue');
    } else {
      const match = chatUsersQueue.dequeue();
      chatOnlyio.to(socket.id).emit('chatMatchFound', match.peerId);
      chatOnlyio.to(match.socketId).emit('chatMatchFound', peerId);
    }
  });

  socket.on('disconnect', () => {
    logger.info({ socketId: socket.id }, 'Client disconnected from chat-only');
  });
});

// Socket.io events for chat-room namespace
chatRoomio.on('connection', (socket) => {
  logger.info({ socketId: socket.id }, 'New client connected to chat-room namespace');

  socket.on('disconnect', () => {
    logger.info({ socketId: socket.id }, 'Client disconnected from chat-room');
  });
});

// Default namespace
io.on('connection', (socket) => {
  logger.info({ socketId: socket.id }, 'New client connected to default namespace');

  socket.on('disconnect', () => {
    logger.info({ socketId: socket.id }, 'Client disconnected');
  });
});

server.listen(PORT, () => {
  logger.info({ port: PORT }, 'Backend server running');
});
