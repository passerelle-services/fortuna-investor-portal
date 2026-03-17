// ─── FORTUNA · Netlify Function : /api/login ──────────────────────────────────
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getStore } = require('@netlify/blobs');

const JWT_SECRET = process.env.JWT_SECRET || 'fortuna-investor-jwt-secret-2026';
const SHARED_PASSWORD = process.env.SHARED_PASSWORD || 'Fortuna2026!';

const INVESTORS = [
  { email: 'investor@fortuna.re',  passwordHash: bcrypt.hashSync(process.env.SHARED_PASSWORD || 'Fortuna2026!', 10), name: 'Investisseur' },
  { email: 'laurent@fortuna.re',   passwordHash: bcrypt.hashSync(process.env.PASS_LAURENT || 'Laurent2026!', 10),  name: 'Laurent Aubry' },
  { email: 'thierry@fortuna.re',   passwordHash: bcrypt.hashSync(process.env.PASS_THIERRY || 'Thierry2026!', 10),  name: 'Thierry Fontaine' },
  { email: 'laur.aubry974@gmail.com', passwordHash: bcrypt.hashSync(process.env.PASS_LAURENT_AUBRY || 'Aubry-974', 10), name: 'Laurent Aubry' },
  // ── Nouveaux investisseurs ────────────────────────────────────────────────
  { email: 'patrick.deleurme@gmail.com', passwordHash: bcrypt.hashSync('invest0126', 10), name: 'Patrick Deleurme' },
];

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };
}

async function saveLoginEvent(userName, userEmail) {
  try {
    const store = getStore({
      name: 'fortuna-analytics',
      siteID: process.env.SITE_ID || process.env.NETLIFY_SITE_ID || '1c1bfd7c-e6ef-4349-a4b1-12da522087fa',
      token: process.env.NETLIFY_API_TOKEN,
    });
    const key = `login-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
    await store.set(key, JSON.stringify({
      type: 'login',
      user: userName,
      email: userEmail || 'shared',
      at: new Date().toISOString(),
    }));
  } catch (e) {
    console.error('[analytics] saveLoginEvent error:', e.message);
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders(), body: JSON.stringify({ error: 'Méthode non autorisée' }) };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Corps invalide' }) }; }

  const { email, password } = body;
  const makeToken = (user, name) => jwt.sign({ user, name }, JWT_SECRET, { expiresIn: '8h' });

  // Mot de passe partagé (sans email)
  if (!email && password === SHARED_PASSWORD) {
    await saveLoginEvent('Investisseur', 'shared');
    return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ success: true, token: makeToken('shared', 'Investisseur') }) };
  }

  // Email + mot de passe individuel
  const investor = INVESTORS.find(i => i.email === (email || '').toLowerCase());
  if (investor && bcrypt.compareSync(password, investor.passwordHash)) {
    await saveLoginEvent(investor.name, investor.email);
    return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ success: true, token: makeToken(investor.email, investor.name) }) };
  }

  // Mot de passe partagé avec email quelconque
  if (password === SHARED_PASSWORD) {
    await saveLoginEvent(email || 'Investisseur', email || 'shared');
    return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ success: true, token: makeToken(email || 'shared', email || 'Investisseur') }) };
  }

  return { statusCode: 401, headers: corsHeaders(), body: JSON.stringify({ error: 'Email ou mot de passe incorrect.' }) };
};
