const mongoose = require('mongoose');

const ResponseSchema = new mongoose.Schema({
  formId: { type: mongoose.Schema.Types.ObjectId, ref: 'Form', required: true },
  airtableRecordId: { type: String },
  answers: { type: Object },
  status: { type: String, default: 'submitted' },
  deletedInAirtable: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Response', ResponseSchema);
