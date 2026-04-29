const express     = require('express');
const rateLimit   = require('express-rate-limit');
const { createUser, login, getUser, logout } = require('../controllers/authController');
const { authMiddleware, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();

// ── Stricter rate limiter for auth routes ─────────────────────────────────────
// 100 attempts per 15 min — relaxed for demo/capstone stability
// const authLimiter = rateLimit({ ... }) - DISABLED FOR DEMO

// POST /api/auth/register — Public route for /signup page
router.post('/register', createUser);

// POST /api/auth/login — rate limiter disabled for demo
router.post('/login', login);

// POST /api/auth/logout
router.post('/logout', logout);

// GET /api/auth/user — get current logged-in user
router.get('/user', authMiddleware, getUser);

module.exports = router;