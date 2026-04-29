const express = require('express');
const router  = express.Router();
const { broadcastAlert, getAlertHistory } = require('../controllers/alertController');
const { authMiddleware, authorizeRoles } = require('../middlewares/authMiddleware');
const rateLimit = require('express-rate-limit');

// Rate limit alert broadcasting (Increased for demo — 20 per minute)
// const alertLimiter = rateLimit({ ... }) - DISABLED FOR DEMO

// POST /api/alerts — admin and staff can broadcast alerts (limiter disabled for demo)
router.post('/', authMiddleware, authorizeRoles('admin', 'staff'), broadcastAlert);

// GET /api/alerts — all authenticated users can view alert history
router.get('/', authMiddleware, getAlertHistory);

module.exports = router;
