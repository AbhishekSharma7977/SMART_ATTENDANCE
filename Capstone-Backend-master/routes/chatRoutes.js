const express = require('express');
const router  = express.Router();
const { saveChat, getChatsBySession } = require('../controllers/chatbotController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// POST /api/ai/chat — send a message (all authenticated users)
router.post('/', authMiddleware, saveChat);

// GET /api/ai/chat/:sessionId — get all chats in a session
router.get('/:sessionId', authMiddleware, getChatsBySession);

module.exports = router;