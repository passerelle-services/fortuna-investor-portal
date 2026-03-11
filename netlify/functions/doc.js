// ─── FORTUNA · Netlify Function : /api/doc/:id ────────────────────────────────
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET || 'fortuna-investor-jwt-secret-2026';

const DOC_NAMES = {
  'business-plan':     'FORTUNA_BusinessPlan.pdf',
  'pitch-deck':        'FORTUNA_PitchDeck.pdf',
  'executive-summary': 'FORTUNA_ExecutiveSummary.pdf',
  'qr-investisseurs':  'FORTUNA_QR_Investisseurs.pdf',
};

function corsHeaders(contentType) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': contentType || 'application/json',
    'X-Robots-Tag': 'noindex, nofollow',
    'Cache-Control': 'no-store',
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

  // Vérification JWT
  const decoded = verifyToken(event);
  if (!decoded) {
    return { statusCode: 401, headers: corsHeaders(), body: JSON.stringify({ error: 'Non autorisé' }) };
  }

  // Extraction de l'ID du document depuis le path
  // event.path = "/.netlify/functions/doc/business-plan" ou "/api/doc/business-plan"
  const segments = (event.path || '').split('/').filter(Boolean);
  const docId = segments[segments.length - 1];

  if (!docId || !DOC_NAMES[docId]) {
    return { statusCode: 404, headers: corsHeaders(), body: JSON.stringify({ error: 'Document introuvable.' }) };
  }

  // Lecture du fichier PDF depuis le dossier docs/ (bundlé avec la fonction)
  const docPath = path.join(__dirname, 'docs', docId + '.pdf');

  if (!fs.existsSync(docPath)) {
    console.error(`[doc] Fichier introuvable : ${docPath}`);
    return { statusCode: 404, headers: corsHeaders(), body: JSON.stringify({ error: 'Fichier PDF non trouvé sur le serveur.' }) };
  }

  try {
    const content = fs.readFileSync(docPath);
    return {
      statusCode: 200,
      headers: {
        ...corsHeaders('application/pdf'),
        'Content-Disposition': `inline; filename="${DOC_NAMES[docId]}"`,
      },
      body: content.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error('[doc] Erreur lecture:', err.message);
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Erreur serveur.' }) };
  }
};
