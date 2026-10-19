const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  avatar: {
    public_id: String,
    url: String,
  },
  // Add other fields if you need them in the assessment portal
}, { collection: 'users' }); // Exact collection name in your DB

module.exports = mongoose.model('User', userSchema);