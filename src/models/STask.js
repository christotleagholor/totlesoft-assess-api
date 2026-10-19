const mongoose = require('mongoose');

// We define a minimal schema but use { strict: false } 
// so we can read/write to your existing STask document without redefining every field.
const staskSchema = new mongoose.Schema({
  name: String,
  btdescription: String,
  testMode: String,
  testConfig: {
    testSize: { type: Number, default: 20 },
    passingScore: { type: Number, default: 90 },
    timeLimit: { type: Number, default: 600 },
    allowRetry: { type: Boolean, default: false },
    retryCooldown: { type: Number, default: 168 }, // 7 days
  },
  masterTasks: [mongoose.Schema.Types.Mixed], // Holds your actual questions
  applicants: [mongoose.Schema.Types.Mixed], // Holds applicant progress
}, { collection: 'stasks', strict: false }); // Exact collection name in your DB

module.exports = mongoose.model('STask', staskSchema);