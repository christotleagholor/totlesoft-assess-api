const Attempt = require('../models/Attempt');
const STask = require('../models/STask');
const User = require('../models/User');

// Helper to shuffle arrays
const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

// 1. START ASSESSMENT (Guidelines Acknowledged)
exports.startAssessment = async (req, res) => {
  try {
    const { projectId } = req.body;
    const userId = req.user._id;

    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Project ID is missing' });
    }

    const project = await STask.findById(projectId).select('testConfig').lean();
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    // Find existing attempt
    let attempt = await Attempt.findOne({ userId, projectId });

    if (attempt) {
      // If they already passed or forwarded, don't let them start again
      if (['passed', 'forwarded'].includes(attempt.stage)) {
        return res.status(400).json({ 
          success: false, 
          message: 'You have already completed this assessment.' 
        });
      }
      
      // If they are on practice, resume it
      if (attempt.stage === 'practice') {
        return res.status(200).json({ success: true, attempt });
      }

      // If they failed, check if cooldown is over
      if (attempt.stage === 'failed') {
        const cooldownHours = project.testConfig?.retryCooldown || 168; // 7 days
        const hoursSinceFail = (Date.now() - new Date(attempt.testCompletedAt).getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceFail < cooldownHours) {
          const remaining = Math.ceil(cooldownHours - hoursSinceFail);
          return res.status(400).json({ 
            success: false, 
            message: `You must wait ${remaining} more hours before retaking this test.` 
          });
        }
        
        // Cooldown passed: Reset the attempt for a new try
        attempt.stage = 'practice';
        attempt.practiceQuestions = [];
        attempt.practiceAnswers = [];
        attempt.testQuestions = [];
        attempt.testAnswers = [];
        attempt.score = 0;
        attempt.passed = false;
        attempt.testStartedAt = null;
        attempt.testExpiresAt = null;
        attempt.testCompletedAt = null;
        await attempt.save();
        return res.status(200).json({ success: true, attempt });
      }
    }

    // If no attempt exists at all, create a new one
    attempt = await Attempt.create({
      userId,
      projectId,
      stage: 'practice'
    });

    res.status(200).json({ success: true, attempt });
  } catch (error) {
    console.error("Start Assessment Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. GET PRACTICE QUESTIONS
exports.getPracticeQuestions = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    const attempt = await Attempt.findOne({ userId, projectId });
    if (!attempt || attempt.stage !== 'practice') {
      return res.status(400).json({ success: false, message: 'Invalid stage. Please restart.' });
    }

    // ✅ If questions are already generated, return them (don't reshuffle on refresh)
    if (attempt.practiceQuestions && attempt.practiceQuestions.length > 0) {
      const sanitized = attempt.practiceQuestions.map(q => ({
        taskId: q._id,
        question: q.question || "Rate the content",
        content: q.content || "",
        options: q.options || [],
        type: q.type
      }));
      return res.status(200).json({ success: true, questions: sanitized });
    }

    const project = await STask.findById(projectId).select('masterTasks').lean();
    
    const practiceSize = Math.min(10, project.masterTasks.length);
    const shuffled = shuffleArray(project.masterTasks);
    const selected = shuffled.slice(0, practiceSize);

    attempt.practiceQuestions = selected;
    await attempt.save();

    const sanitized = selected.map(q => ({
      taskId: q._id,
      question: q.question || "Rate the content",
      content: q.content || "",
      options: q.options || [],
      type: q.type
    }));

    res.status(200).json({ success: true, questions: sanitized });
  } catch (error) {
    console.error("Practice Questions Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. SUBMIT PRACTICE ANSWER (Instant Feedback)
exports.submitPracticeAnswer = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { taskId, answer } = req.body;
    const userId = req.user._id;

    const attempt = await Attempt.findOne({ userId, projectId, stage: 'practice' });
    if (!attempt) return res.status(400).json({ success: false, message: 'Invalid stage' });

    const question = attempt.practiceQuestions.find(q => String(q._id) === String(taskId));
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });

    // Grade
    const isCorrect = String(question.correctAnswer).toLowerCase().trim() === String(answer).toLowerCase().trim();

    // Save answer
    const existingAnswerIndex = attempt.practiceAnswers.findIndex(a => String(a.taskId) === String(taskId));
    if (existingAnswerIndex > -1) {
      attempt.practiceAnswers[existingAnswerIndex].answer = answer;
      attempt.practiceAnswers[existingAnswerIndex].isCorrect = isCorrect;
    } else {
      attempt.practiceAnswers.push({ taskId, answer, isCorrect });
    }
    
    await attempt.save();

    res.status(200).json({ 
      success: true, 
      isCorrect, 
      correctAnswer: question.correctAnswer 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. READY FOR TEST
exports.readyForTest = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    const attempt = await Attempt.findOne({ userId, projectId, stage: 'practice' });
    if (!attempt) return res.status(400).json({ success: false, message: 'Invalid stage' });

    // Check retry cooldown if they failed before (we'll implement a check for previous failed attempts)
    const previousAttempt = await Attempt.findOne({ userId, projectId, stage: 'failed' }).sort({ createdAt: -1 });
    if (previousAttempt) {
      const hoursSinceFail = (Date.now() - new Date(previousAttempt.testCompletedAt).getTime()) / (1000 * 60 * 60);
      const project = await STask.findById(projectId);
      const cooldown = project.testConfig?.retryCooldown || 168; // 7 days default
      
      if (hoursSinceFail < cooldown) {
        const remaining = Math.ceil(cooldown - hoursSinceFail);
        return res.status(400).json({ 
          success: false, 
          message: `You must wait ${remaining} hours before retaking this test.` 
        });
      }
    }

    attempt.stage = 'test';
    await attempt.save();

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. GET TEST QUESTIONS
exports.getTestQuestions = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    const attempt = await Attempt.findOne({ userId, projectId, stage: 'test' });
    if (!attempt) return res.status(400).json({ success: false, message: 'Invalid stage' });

    const project = await STask.findById(projectId).select('masterTasks testConfig').lean();
    
    // Get config
    const testSize = project.testConfig?.testSize || 20;
    const timeLimit = project.testConfig?.timeLimit || 600;

    // Shuffle and pick questions
    const shuffled = shuffleArray(project.masterTasks);
    const selected = shuffled.slice(0, Math.min(testSize, project.masterTasks.length));

    // Save to attempt
    attempt.testQuestions = selected;
    attempt.testStartedAt = new Date();
    attempt.testExpiresAt = new Date(Date.now() + timeLimit * 1000);
    await attempt.save();

    // Sanitize
    const sanitized = selected.map(q => ({
      taskId: q._id,
      question: q.question || "Rate the content",
      content: q.content || "",
      options: q.options || [],
      type: q.type
    }));

    res.status(200).json({ 
      success: true, 
      questions: sanitized, 
      timeLimit,
      expiresAt: attempt.testExpiresAt
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. SUBMIT REAL TEST
exports.submitTest = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { answers } = req.body; // Array of { taskId, answer }
    const userId = req.user._id;

    const attempt = await Attempt.findOne({ userId, projectId, stage: 'test' });
    if (!attempt) return res.status(400).json({ success: false, message: 'Invalid stage' });

    // Check time (allow 5 seconds grace period for network lag)
    if (new Date() > new Date(attempt.testExpiresAt.getTime() + 5000)) {
       // Auto-submit whatever they have if they ran out of time
       // We don't reject, we just grade what they submitted
    }

    const project = await STask.findById(projectId);
    const passingScore = project.testConfig?.passingScore || 90;

    let correctCount = 0;

    // Grade
    attempt.testQuestions.forEach((q) => {
      const userAns = answers.find(a => String(a.taskId) === String(q._id));
      const answerText = userAns ? userAns.answer : "";
      
      const isCorrect = String(q.correctAnswer).toLowerCase().trim() === String(answerText).toLowerCase().trim();
      
      if (isCorrect) correctCount++;
      
      // Save answer record
      attempt.testAnswers.push({ 
        taskId: q._id, 
        answer: answerText, 
        isCorrect 
      });
    });

    const score = Math.round((correctCount / attempt.testQuestions.length) * 100);
    const passed = score >= passingScore;

    attempt.score = score;
    attempt.passed = passed;
    attempt.stage = passed ? 'passed' : 'failed';
    attempt.testCompletedAt = new Date();
    
    await attempt.save();

    res.status(200).json({ 
      success: true, 
      score, 
      passed, 
      correctCount, 
      totalQuestions: attempt.testQuestions.length,
      passingScore 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};