const express = require('express');
const router  = express.Router();
const { getDashboardStats } = require('../controllers/statsController');
const { authMiddleware, authorizeRoles } = require('../middlewares/authMiddleware');

// GET /api/stats/dashboard — role-based stats return
router.get('/dashboard', authMiddleware, authorizeRoles('admin', 'staff', 'parent'), getDashboardStats);

module.exports = router;
