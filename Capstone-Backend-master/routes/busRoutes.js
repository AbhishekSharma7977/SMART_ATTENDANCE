const express = require('express');
const router  = express.Router();
const { updateLocation, getAllBusLocations } = require('../controllers/busController');
const { authMiddleware, authorizeRoles } = require('../middlewares/authMiddleware');

// POST /api/bus/update-location — Staff (bus drivers) only
router.post('/update-location', authMiddleware, authorizeRoles('staff'), updateLocation);

// GET /api/bus/all — parents and admins can view bus locations (auth required)
router.get('/all', authMiddleware, getAllBusLocations);

module.exports = router;
