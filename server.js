const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const socket = require('socket.io');
const path = require('path');
const http = require('http');
const server = http.createServer(app);
const io = socket(server);
const { PeerServer } = require('peer');
const peerServer = PeerServer({ port: process.env.PEER_PORT || 9000, path: '/myapp' });
const Queue = require('./Queue');
const userQueue = new Queue();
const chatUsersQueue = new Queue();

const indexRoutes = require('./src/routes/index');
const apiRoutes = require('./src/routes/api');

app.use(express.static(path.resolve(__dirname, './public')));
app.use('/', indexRoutes);
app.use('/', apiRoutes);

// let activePeers = {};
// let rooms = {};
const{activePeers,rooms} = require('./States');
// PeerServer events
peerServer.on('connection', (client) => {
    console.log('new user connected', client.getId());
    activePeers[client.getId()] = true;
});

peerServer.on('disconnect', (client) => {
    console.log('user disconnected', client.getId());
    delete activePeers[client.getId()]; 

    for (const roomID in rooms) {
        rooms[roomID] = rooms[roomID].filter(id => id !== client.getId());
        if (rooms[roomID].length === 0) {
            delete rooms[roomID];
        }
    }
});

// Socket.io events
io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('joinQueue', (peerId) => {
        console.log('Join queue event received');
        if (userQueue.isEmpty()) {
            userQueue.enqueue({ peerId, socketId: socket.id });
            console.log('User added to queue');
        } else {
            const match = userQueue.dequeue();
            io.to(socket.id).emit('matchFound', match.peerId);
            io.to(match.socketId).emit('matchFound', peerId);
        }
    });

    socket.on('joinChatQueue', (peerId) => {
        if (chatUsersQueue.isEmpty()) {
            chatUsersQueue.enqueue({ peerId, socketId: socket.id });
            console.log('User added to chat queue');
        } else {
            const match = chatUsersQueue.dequeue();
            io.to(socket.id).emit('chatMatchFound', match.peerId);
            io.to(match.socketId).emit('chatMatchFound', peerId);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
