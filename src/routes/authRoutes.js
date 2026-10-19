const express = require('express');
const { verifySessionAndGetProject } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/verify', protect, verifySessionAndGetProject);

module.exports = router;