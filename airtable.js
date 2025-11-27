const axios = require('axios');

async function fetchBases(accessToken) {
  const res = await axios.get('https://api.airtable.com/v0/meta/bases', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return res.data.bases || [];
}

async function fetchTables(accessToken, baseId) {
  const res = await axios.get(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return res.data.tables || [];
}

async function fetchTableFields(accessToken, baseId, tableId) {
  // find table by id
  const tables = await fetchTables(accessToken, baseId);
  const table = tables.find(t => t.id === tableId || t.name === tableId);
  if (!table) throw new Error('Table not found');
  return table.fields || [];
}

async function createAirtableRecord(accessToken, baseId, tableName, fields) {
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;
  const res = await axios.post(url, { fields }, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return res.data;
}

async function fetchAirtableRecord(accessToken, baseId, tableName, recordId) {
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}/${recordId}`;
  const res = await axios.get(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  return res.data;
}

async function refreshAccessToken(refreshToken) {
  const tokenUrl = 'https://airtable.com/oauth2/v1/token';
  const payload = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: process.env.AIRTABLE_CLIENT_ID,
    client_secret: process.env.AIRTABLE_CLIENT_SECRET
  }).toString();
  const res = await axios.post(tokenUrl, payload, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  return res.data; // { access_token, refresh_token, expires_in, ... }
}

async function fetchProfile(accessToken) {
  // Airtable doesn't have a single standardized 'me' endpoint in older docs; try meta endpoints
  try {
    const res = await axios.get('https://api.airtable.com/v0/meta/me', { headers: { Authorization: `Bearer ${accessToken}` } });
    return res.data;
  } catch (e) {
    // best-effort: return empty object if not available
    return {};
  }
}

module.exports = {
  fetchBases,
  fetchTables,
  fetchTableFields,
  createAirtableRecord,
  fetchAirtableRecord
  , refreshAccessToken, fetchProfile
};
