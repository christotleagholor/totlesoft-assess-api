const express = require('express');
const { getProjectById } = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/:id', protect, getProjectById);

module.exports = router;