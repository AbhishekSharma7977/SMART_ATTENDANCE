const express = require('express');
const router  = express.Router();
const { getAllStudents } = require('../controllers/studentController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// GET /api/student — paginated student list (role-scoped in controller)
router.get('/', authMiddleware, getAllStudents);

module.exports = router;