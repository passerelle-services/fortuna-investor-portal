// ─── FORTUNA · Netlify Function : /api/analytics ──────────────────────────────
// Sur Netlify (serverless), analytics en mémoire par session uniquement.
// Pour des stats persistantes, connectez un service (ex: Supabase, Faunadb).
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'fortuna-investor-jwt-secret-2026';

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

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders(), body: '' };

  const decoded = verifyToken(event);
  if (!decoded) return { statusCode: 401, headers: corsHeaders(), body: JSON.stringify({ error: 'Non autorisé' }) };

  // Données de démonstration (remplacer par une vraie DB si besoin)
  return {
    statusCode: 200,
    headers: corsHeaders(),
    body: JSON.stringify({
      totalLogins: '–',
      totalDocViews: '–',
      docCounts: {},
      recentLogins: [],
      recentDocViews: [],
      note: 'Analytics persistantes disponibles avec Supabase/FaunaDB. Contactez les fondateurs pour la configuration.',
      deployedOn: 'Netlify',
    }),
  };
};
