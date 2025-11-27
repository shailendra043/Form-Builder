const express = require('express');
const axios = require('axios');
const qs = require('querystring');
const User = require('../models/User');
const { fetchBases, fetchProfile } = require('../utils/airtable');

const router = express.Router();

// Start OAuth
router.get('/airtable', (req, res) => {
  const clientId = process.env.AIRTABLE_CLIENT_ID;
  const redirectUri = process.env.AIRTABLE_OAUTH_REDIRECT_URI;
  const scope = 'data.records:read data.records:write data.bases:read';
  const url = `https://airtable.com/oauth2/v1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
  return res.redirect(url);
});

// Callback
router.get('/airtable/callback', async (req, res) => {
  try {
    const code = req.query.code;
    const tokenUrl = 'https://airtable.com/oauth2/v1/token';
    const payload = {
      grant_type: 'authorization_code',
      client_id: process.env.AIRTABLE_CLIENT_ID,
      client_secret: process.env.AIRTABLE_CLIENT_SECRET,
      code,
      redirect_uri: process.env.AIRTABLE_OAUTH_REDIRECT_URI
    };

    const tokenRes = await axios.post(tokenUrl, qs.stringify(payload), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token, refresh_token } = tokenRes.data;

    // fetch profile (best-effort)
    const profile = await fetchProfile(access_token).catch(()=>({}));
    const airtableUserId = profile?.id || profile?.user?.id || null;

    // store or update user. Prefer matching by airtableUserId if available
    let user = null;
    if (airtableUserId) user = await User.findOne({ airtableUserId });
    if (!user) user = await User.findOne({ 'profile.email': profile?.email });
    if (!user) {
      user = new User({ airtableUserId, profile, accessToken: access_token, refreshToken: refresh_token, lastLoginAt: new Date() });
    } else {
      user.airtableUserId = airtableUserId || user.airtableUserId;
      user.profile = profile || user.profile;
      user.accessToken = access_token;
      user.refreshToken = refresh_token || user.refreshToken;
      user.lastLoginAt = new Date();
    }
    await user.save();

    // redirect to frontend with user id so frontend can use it for subsequent calls
    const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontend}/?userId=${user._id}`);
  } catch (err) {
    console.error('OAuth callback error', err?.response?.data || err.message);
    return res.status(500).send('OAuth error');
  }
});

module.exports = router;
