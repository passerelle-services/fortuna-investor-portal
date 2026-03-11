// ─── FORTUNA · Netlify Function : /api/logout ─────────────────────────────────
// JWT est stateless : le logout est géré côté client (suppression du token)
exports.handler = async () => ({
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ success: true }),
});
