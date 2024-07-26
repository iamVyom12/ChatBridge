const{activePeers,rooms} = require('../../States');

exports.checkPeer = (req, res) => {
    const peerId = req.params.id;
    if (activePeers[peerId]) {
        res.send({ active: true });
    } else {
        res.send({ active: false });
    }
};

exports.activePeersCount = (req, res) => {
    const count = Object.keys(activePeers).length;
    res.send({ count });
};

exports.joinRoom = (req, res) => {
    console.log('Join room request received');
    const roomID = req.params.roomID;
    const peerId = req.params.peerId;

    if (!rooms[roomID]) {
        rooms[roomID] = [];
    }

    rooms[roomID].push(peerId);
    res.json({ peers: rooms[roomID].filter(id => id !== peerId) });
};
