const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiControllers');

router.get('/check-peer/:id', apiController.checkPeer);
router.get('/active-peers-count', apiController.activePeersCount);
router.post('/join-room/:roomID/:peerId', apiController.joinRoom);

module.exports = router;
