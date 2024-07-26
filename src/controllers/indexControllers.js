const path = require('path');

exports.home = (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../public/html/home.html'));
};

exports.chatRoom = (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../public/html/chat-room.html'));
};

exports.lobby = (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../public/html/LobbyForRoom.html'));
};

exports.chat = (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../public/html/chat-only.html'));
};

exports.chatRandom = (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../public/html/chat-random.html'));
};
