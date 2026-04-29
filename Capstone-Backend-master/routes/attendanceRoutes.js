const express = require('express');
const { markAttendance, getStudentAttendance, saveAttendance } = require('../controllers/attendanceController');
const { authorizeRoles, authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

// POST /api/attendance — mark attendance via face recognition (staff only)
router.post('/', authMiddleware, authorizeRoles('staff'), markAttendance);

// POST /api/attendance/save — bulk save absents at end of day (staff only)
router.post('/save', authMiddleware, authorizeRoles('staff'), saveAttendance);

// GET /api/attendance/:studentId — get student's attendance history (auth required)
router.get('/:studentId', authMiddleware, getStudentAttendance);

module.exports = router;