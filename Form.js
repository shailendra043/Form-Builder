const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  questionKey: { type: String, required: true },
  airtableFieldId: { type: String, required: true },
  label: { type: String },
  type: { type: String },
  required: { type: Boolean, default: false },
  conditionalRules: { type: Object, default: null }
});

const FormSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String },
  airtableBaseId: { type: String, required: true },
  airtableTableId: { type: String, required: true },
  airtableTableName: { type: String },
  questions: [QuestionSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Form', FormSchema);
