const express = require('express');
const ResponseModel = require('../models/Response');
const User = require('../models/User');
const { fetchAirtableRecord } = require('../utils/airtable');

const router = express.Router();

// Airtable will POST webhook events here
router.post('/airtable', async (req, res) => {
  try {
    // optional secret header validation
    const secret = process.env.WEBHOOK_SECRET;
    if (secret) {
      const incoming = req.header('x-webhook-secret') || req.header('x-airtable-signature') || req.header('x-signature');
      if (!incoming || incoming !== secret) {
        return res.status(401).json({ error: 'Invalid webhook secret' });
      }
    }
    const event = req.body;
    // Basic generic handling: event.action = 'updated' | 'deleted'
    const { action, record, base, table } = event;

    if (!record?.id) {
      return res.status(400).send('no record');
    }

    // Find response by airtableRecordId
    const resp = await ResponseModel.findOne({ airtableRecordId: record.id });

    if (action === 'deleted') {
      if (resp) {
        resp.deletedInAirtable = true;
        await resp.save();
      }
      return res.json({ ok: true });
    }

    if (action === 'updated' || action === 'created') {
      // find a user with access token to fetch the record (naive: pick any user)
      const user = await User.findOne();
      if (!user) return res.status(500).json({ error: 'No user to fetch record' });
      let fetched;
      try {
        fetched = await fetchAirtableRecord(user.accessToken, base?.id || event.baseId, table?.name || event.tableName, record.id);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401 && user.refreshToken) {
          const { refreshAccessToken } = require('../utils/airtable');
          const newTokens = await refreshAccessToken(user.refreshToken);
          if (newTokens?.access_token) {
            user.accessToken = newTokens.access_token;
            if (newTokens.refresh_token) user.refreshToken = newTokens.refresh_token;
            await user.save();
            fetched = await fetchAirtableRecord(user.accessToken, base?.id || event.baseId, table?.name || event.tableName, record.id);
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }
      const fields = fetched?.fields || {};

      if (resp) {
        resp.answers = fields;
        resp.updatedAt = new Date();
        resp.deletedInAirtable = false;
        await resp.save();
      } else {
        // if not found, create local record linking to form if possible: we skip linking to form here
        const newResp = new ResponseModel({ airtableRecordId: record.id, answers: fields });
        await newResp.save();
      }
      return res.json({ ok: true });
    }

    res.json({ ok: true });
  } catch (e) {
    console.error('webhook error', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
