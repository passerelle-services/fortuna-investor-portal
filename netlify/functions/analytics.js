// ─── FORTUNA · Netlify Function : /api/analytics ──────────────────────────────
const jwt = require('jsonwebtoken');
const { getStore } = require('@netlify/blobs');

const JWT_SECRET = process.env.JWT_SECRET || 'fortuna-investor-jwt-secret-2026';
const SITE_ID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID || '1c1bfd7c-e6ef-4349-a4b1-12da522087fa';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };
}

function verifyToken(event) {
  const auth = event.headers['authorization'] || event.headers['Authorization'] || '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET); }
  catch { return null; }
}

function getBlobStore() {
  return getStore({
    name: 'fortuna-analytics',
    siteID: SITE_ID,
    token: process.env.NETLIFY_API_TOKEN,
  });
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders(), body: '' };

  const decoded = verifyToken(event);
  if (!decoded) return { statusCode: 401, headers: corsHeaders(), body: JSON.stringify({ error: 'Non autorisé' }) };

  try {
    const store = getBlobStore();

    // Récupérer tous les événements login
    const loginList = await store.list({ prefix: 'login-' });
    const logins = await Promise.all(
      loginList.blobs.map(b => store.get(b.key, { type: 'json' }).catch(() => null))
    );
    const validLogins = logins.filter(Boolean).sort((a, b) => new Date(b.at) - new Date(a.at));

    // Récupérer tous les événements doc
    const docList = await store.list({ prefix: 'doc-' });
    const docs = await Promise.all(
      docList.blobs.map(b => store.get(b.key, { type: 'json' }).catch(() => null))
    );
    const validDocs = docs.filter(Boolean);

    // Stats par utilisateur
    const userMap = {};
    validLogins.forEach(l => {
      const key = l.user || l.email || 'Inconnu';
      if (!userMap[key]) userMap[key] = { logins: [], lastLogin: null };
      userMap[key].logins.push(l.at);
      if (!userMap[key].lastLogin || new Date(l.at) > new Date(userMap[key].lastLogin))
        userMap[key].lastLogin = l.at;
    });

    // Stats par doc
    const docCounts = {};
    validDocs.forEach(d => {
      if (d.docId) docCounts[d.docId] = (docCounts[d.docId] || 0) + 1;
    });

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({
        totalLogins: validLogins.length,
        totalDocViews: validDocs.length,
        docCounts,
        recentLogins: validLogins.slice(0, 30),
        userMap,
      }),
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({
        totalLogins: null,
        totalDocViews: null,
        docCounts: {},
        recentLogins: [],
        userMap: {},
        blobsError: err.message,
      }),
    };
  }
};
