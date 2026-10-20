const mongoose = require('mongoose');
const shopSchema = new mongoose.Schema({
  name: String,
  email: String,
}, { collection: 'shops', strict: false });
module.exports = mongoose.model('Shop', shopSchema);