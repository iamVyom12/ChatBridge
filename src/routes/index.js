const express = require('express');
const router = express.Router();
const indexController = require('../controllers/indexControllers');

router.get('/', indexController.home);
router.get('/chat-room', indexController.chatRoom);
router.get('/lobby', indexController.lobby);
router.get('/chat', indexController.chat);
router.get('/chat-random', indexController.chatRandom);

module.exports = router;
