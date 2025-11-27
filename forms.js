const express = require('express');
const Form = require('../models/Form');
const ResponseModel = require('../models/Response');
const User = require('../models/User');
const { fetchBases, fetchTables, fetchTableFields, createAirtableRecord, fetchAirtableRecord } = require('../utils/airtable');

const router = express.Router();

// Helper: call an airtable util and refresh token on 401 then retry
async function callWithRetry(fn, user, ...args) {
  try {
    return await fn(user.accessToken, ...args);
  } catch (err) {
    const status = err?.response?.status;
    if (status === 401 && user.refreshToken) {
      try {
        const { refreshAccessToken } = require('../utils/airtable');
        const newTokens = await refreshAccessToken(user.refreshToken);
        if (newTokens?.access_token) {
          user.accessToken = newTokens.access_token;
          if (newTokens.refresh_token) user.refreshToken = newTokens.refresh_token;
          await user.save();
          return await fn(user.accessToken, ...args);
        }
      } catch (refreshErr) {
        throw refreshErr;
      }
    }
    throw err;
  }
}

// Simple middleware to resolve user from header x-user-id
router.use(async (req, res, next) => {
  const uid = req.header('x-user-id');
  if (!uid) return res.status(401).json({ error: 'Missing x-user-id header' });
  const user = await User.findById(uid);
  if (!user) return res.status(401).json({ error: 'User not found' });
  req.user = user;
  next();
});

router.get('/bases', async (req, res) => {
  try {
    const bases = await callWithRetry(fetchBases, req.user);
    res.json({ bases });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/tables/:baseId', async (req, res) => {
  try {
    const tables = await callWithRetry(fetchTables, req.user, req.params.baseId);
    res.json({ tables });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/fields/:baseId/:tableId', async (req, res) => {
  try {
    const fields = await callWithRetry(fetchTableFields, req.user, req.params.baseId, req.params.tableId);
    res.json({ fields });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Create form schema
router.post('/', async (req, res) => {
  try {
    const { title, airtableBaseId, airtableTableId, airtableTableName, questions } = req.body;
    if (!airtableBaseId || !airtableTableId) return res.status(400).json({ error: 'base and table required' });

    // validate fields exist and types are supported
    const fields = await callWithRetry(fetchTableFields, req.user, airtableBaseId, airtableTableId);
    const allowedFieldTypes = ['singleLineText', 'multilineText', 'singleSelect', 'multipleSelects', 'multipleAttachments'];

    const qValidated = questions.map(q => {
      const f = fields.find(x => x.id === q.airtableFieldId || x.name === q.airtableFieldId);
      if (!f) throw new Error(`Field ${q.airtableFieldId} not found`);
      if (!allowedFieldTypes.includes(f.type)) throw new Error(`Field ${f.name} type ${f.type} not supported`);
      const item = {
        questionKey: q.questionKey,
        airtableFieldId: f.id,
        label: q.label || f.name,
        type: f.type,
        required: !!q.required,
        conditionalRules: q.conditionalRules || null,
        options: f.options || null
      };
      return item;
    });

    const form = new Form({ owner: req.user._id, title, airtableBaseId, airtableTableId, airtableTableName, questions: qValidated });
    await form.save();
    res.json({ form });
  } catch (e) {
    console.error('Create form error', e.message);
    res.status(400).json({ error: e.message });
  }
});

router.get('/:formId', async (req, res) => {
  try {
    const form = await Form.findById(req.params.formId);
    if (!form) return res.status(404).json({ error: 'Form not found' });
    res.json({ form });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Submit a response: validate and save to airtable + db
router.post('/:formId/submit', async (req, res) => {
  try {
    const form = await Form.findById(req.params.formId);
    if (!form) return res.status(404).json({ error: 'Form not found' });

    const answers = req.body.answers || {};

    // validate required
    for (const q of form.questions) {
      if (q.required) {
        const val = answers[q.questionKey];
        if (val === undefined || val === null || val === '') {
          return res.status(400).json({ error: `Missing required field ${q.questionKey}` });
        }
      }
      // additional validation for singleSelect / multipleSelects
      if (q.type === 'singleSelect' && answers[q.questionKey] != null) {
        const choice = answers[q.questionKey];
        const options = q.options?.choices?.map(c => c.name) || [];
        if (options.length && !options.includes(choice)) return res.status(400).json({ error: `Invalid choice for ${q.questionKey}` });
      }
      if (q.type === 'multipleSelects' && answers[q.questionKey] != null) {
        const arr = answers[q.questionKey];
        if (!Array.isArray(arr)) return res.status(400).json({ error: `${q.questionKey} should be an array` });
        const options = q.options?.choices?.map(c => c.name) || [];
        for (const item of arr) if (options.length && !options.includes(item)) return res.status(400).json({ error: `Invalid choice in ${q.questionKey}` });
      }
    }

    // prepare fields for Airtable: map question label -> value
    const fields = {};
    for (const q of form.questions) {
      if (answers[q.questionKey] !== undefined) {
        fields[q.label || q.questionKey] = answers[q.questionKey];
      }
    }

    // create record in Airtable
    const airtableRes = await callWithRetry(createAirtableRecord, req.user, form.airtableBaseId, form.airtableTableName || form.airtableTableId, fields);

    const response = new ResponseModel({ formId: form._id, airtableRecordId: airtableRes.id, answers });
    await response.save();

    res.json({ response, airtable: airtableRes });
  } catch (e) {
    console.error('Submit error', e.message);
    res.status(500).json({ error: e.message });
  }
});

// List responses for a form (DB only)
router.get('/:formId/responses', async (req, res) => {
  try {
    const responses = await ResponseModel.find({ formId: req.params.formId }).sort({ createdAt: -1 });
    res.json({ responses });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
