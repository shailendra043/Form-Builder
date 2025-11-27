const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  airtableUserId: { type: String },
  profile: { type: Object },
  accessToken: { type: String },
  refreshToken: { type: String },
  lastLoginAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
