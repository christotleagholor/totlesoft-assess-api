const express = require('express');
const { 
  startAssessment, getPracticeQuestions, submitPracticeAnswer, 
  readyForTest, getTestQuestions, submitTest, resetPractice // ✅ Import reset
} = require('../controllers/attemptController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.post('/start', protect, startAssessment);
router.get('/:projectId/practice', protect, getPracticeQuestions);
router.post('/:projectId/practice-answer', protect, submitPracticeAnswer);
router.post('/:projectId/practice-reset', protect, resetPractice); // ✅ New Route
router.post('/:projectId/ready', protect, readyForTest);
router.get('/:projectId/test', protect, getTestQuestions);
router.post('/:projectId/submit-test', protect, submitTest);

module.exports = router;