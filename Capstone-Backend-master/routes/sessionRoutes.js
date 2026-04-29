const express = require('express');
const router  = express.Router();
const {
    createSession,
    getUserAllSessions,
    getUserSession,
    deleteSession,
} = require('../controllers/sessionController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// POST /api/ai/session — create a new chat session
router.post('/', authMiddleware, createSession);

// GET /api/ai/session — list all sessions (paginated)
router.get('/', authMiddleware, getUserAllSessions);

// GET /api/ai/session/:sessionId — get specific session with chats
router.get('/:sessionId', authMiddleware, getUserSession);

// DELETE /api/ai/session/:sessionId — delete session and its chats
router.delete('/:sessionId', authMiddleware, deleteSession);

module.exports = router;