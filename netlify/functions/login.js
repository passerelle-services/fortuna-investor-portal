// ─── FORTUNA · Netlify Function : /api/login ──────────────────────────────────
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getStore } = require('@netlify/blobs');

const JWT_SECRET = process.env.JWT_SECRET;
const SHARED_PASSWORD = process.env.SHARED_PASSWORD || '';

const INVESTORS = [
  { email: 'investor@fortuna.re',           passwordHash: '$2a$10$8AxwQCh5MbpilyRcAFwmd.OxVcFiW6Ug9AFjKGUT3iPVD7boSkZRe', name: 'Investisseur' },
  { email: 'laurent@fortuna.re',            passwordHash: '$2a$10$8CGotTx.57kgclZLNRpAP.pSEMOG8izcDcL6El6H9rk9DQoMNjXHC', name: 'Laurent Aubry' },
  { email: 'thierry@fortuna.re',            passwordHash: '$2a$10$Q7DEcOxZHRbkeD25HgUcoOKic9D6FKZr9uyx/wdUzpqfEr0iQUzm6', name: 'Thierry Fontaine' },
  { email: 'laur.aubry974@gmail.com',       passwordHash: '$2a$10$nwFh5SVVf.ru2l4GIeDFXueICH6k9uEUlP8V.ZlZNolZgXlAFrLfu', name: 'Laurent Aubry' },
  // ── Nouveaux investisseurs ────────────────────────────────────────────────
  { email: 'patrick.deleurme@gmail.com',    passwordHash: '$2a$10$8moXlduyPEPqitUktqsIxOMp7UW9Pk906PJQgyyNX/QnJ0a9KlApq', name: 'Patrick Deleurme' },
  { email: 'passerelle.services@gmail.com', passwordHash: '$2a$10$eHgbTZPPd83s.qZ8J73bGOx6IT0jbr9K0D.4kiEcjQFBzsXv5qZPq', name: 'Passerelle Services' },
  { email: 'marc.chouquet@ayomi.pro',       passwordHash: '$2a$10$/zXOdMckF.7oteXJ8ZS4G.DOt8ubxiCiDRn84O1Mllb5h1HYqf7Fu', name: 'Marc Chouquet' },
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
