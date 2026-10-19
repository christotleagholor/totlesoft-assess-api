const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'STask', required: true },
  
  stage: { 
    type: String, 
    enum: ['guidelines', 'practice', 'test', 'passed', 'failed', 'forwarded'], 
    default: 'guidelines' 
  },
  
  // Practice Data
  practiceQuestions: [mongoose.Schema.Types.Mixed],
  practiceAnswers: [{
    taskId: String,
    answer: String,
    isCorrect: Boolean
  }],

  // Test Data
  testQuestions: [mongoose.Schema.Types.Mixed],
  testAnswers: [{
    taskId: String,
    answer: String,
    isCorrect: Boolean
  }],
  
  score: { type: Number, default: 0 },
  passed: { type: Boolean, default: false },
  
  // Timers
  testStartedAt: Date,
  testExpiresAt: Date,
  testCompletedAt: Date,
  
  // Forwarding
  forwardedAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('Attempt', attemptSchema);