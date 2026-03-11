const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const SHARED_PASSWORD = 'Fortuna2026!'; // mot de passe partagé
const SESSION_SECRET = 'fortuna-investor-portal-secret-key-2026';
const JWT_SECRET = 'fortuna-investor-jwt-secret-2026';

// Investors: email + password (hashed at startup)
const INVESTORS = [
  { email: 'investor@fortuna.re',  passwordHash: bcrypt.hashSync('Fortuna2026!', 10), name: 'Investisseur' },
  { email: 'laurent@fortuna.re',   passwordHash: bcrypt.hashSync('Laurent2026!', 10), name: 'Laurent Aubry' },
  { email: 'thierry@fortuna.re',   passwordHash: bcrypt.hashSync('Thierry2026!', 10), name: 'Thierry Fontaine' },
];

// PDF documents – served securely (no direct public URL)
const DOCS = {
  'business-plan':      path.join('G:\\Mon Drive\\FORTUNA 2026\\05 - INVESTISSEURS - LEVEES DE FONDS\\02 - DOSSIER LOVE MONEY mars 2026\\FORTUNA_BusinessPlan_Investisseurs.docx.pdf'),
  'pitch-deck':         path.join('G:\\Mon Drive\\FORTUNA 2026\\05 - INVESTISSEURS - LEVEES DE FONDS\\02 - DOSSIER LOVE MONEY mars 2026\\FORTUNA_PitchDeck_Investisseurs.pptx.pdf'),
  'executive-summary':  path.join('G:\\Mon Drive\\FORTUNA 2026\\05 - INVESTISSEURS - LEVEES DE FONDS\\02 - DOSSIER LOVE MONEY mars 2026\\FORTUNA_ExecutiveSummary.docx.pdf'),
  'qr-investisseurs':   path.join('C:\\Users\\Administrator\\Downloads\\02A - Q_R investisseurs.pdf'),
};

// ─── ANALYTICS STORE ─────────────────────────────────────────────────────────
const ANALYTICS_FILE = path.join(__dirname, 'data', 'analytics.json');
if (!fs.existsSync(path.join(__dirname, 'data'))) fs.mkdirSync(path.join(__dirname, 'data'));
if (!fs.existsSync(ANALYTICS_FILE)) {
  fs.writeFileSync(ANALYTICS_FILE, JSON.stringify({ logins: [], docViews: [], sessions: {} }));
}

function loadAnalytics() {
  try { return JSON.parse(fs.readFileSync(ANALYTICS_FILE, 'utf8')); }
  catch { return { logins: [], docViews: [], sessions: {} }; }
}
function saveAnalytics(data) {
  fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(data, null, 2));
}
function trackLogin(user, ip) {
  const a = loadAnalytics();
  a.logins.push({ user, ip, at: new Date().toISOString() });
  saveAnalytics(a);
}
function trackDocView(doc, user) {
  const a = loadAnalytics();
  a.docViews.push({ doc, user, at: new Date().toISOString() });
  saveAnalytics(a);
}

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,  // relax for inline scripts/styles
  crossOriginEmbedderPolicy: false,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 8 * 60 * 60 * 1000 }, // 8h
}));

// Rate limit login
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Trop de tentatives.' });

// Auth guard – accepte session (local) ET Bearer JWT (Netlify/client)
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  const auth = req.headers['authorization'] || '';
  const token = auth.replace('Bearer ', '').trim();
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.jwtUser = decoded;
      return next();
    } catch { /* invalid */ }
  }
  res.status(401).json({ error: 'Non autorisé' });
}
function requireAuthPage(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  res.redirect('/');
}

// ─── STATIC ───────────────────────────────────────────────────────────────────
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));
app.use('/css', express.static(path.join(__dirname, 'public', 'css')));
app.use('/js', express.static(path.join(__dirname, 'public', 'js')));

// ─── ROUTES ──────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  if (req.session && req.session.authenticated) return res.redirect('/dashboard');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', requireAuthPage, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// LOGIN
app.post('/api/login', loginLimiter, (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip;
  const makeToken = (user, name) => jwt.sign({ user, name }, JWT_SECRET, { expiresIn: '8h' });

  const respond = (user, name) => {
    req.session.authenticated = true;
    req.session.user = user;
    req.session.userName = name;
    trackLogin(user, ip);
    return res.json({ success: true, token: makeToken(user, name) });
  };

  if (!email && password === SHARED_PASSWORD) return respond('shared', 'Investisseur');

  const investor = INVESTORS.find(i => i.email === email?.toLowerCase());
  if (investor && bcrypt.compareSync(password, investor.passwordHash)) return respond(investor.email, investor.name);

  if (password === SHARED_PASSWORD) return respond(email || 'shared', email || 'Investisseur');

  return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
});

// LOGOUT
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// SESSION INFO
app.get('/api/me', requireAuth, (req, res) => {
  const user = req.jwtUser || { user: req.session.user, name: req.session.userName };
  res.json({ user: user.user || user, name: user.name || req.session.userName });
});

// SERVE DOCUMENT (protected)
app.get('/api/doc/:id', requireAuth, (req, res) => {
  const docPath = DOCS[req.params.id];
  if (!docPath || !fs.existsSync(docPath)) {
    return res.status(404).json({ error: 'Document introuvable.' });
  }
  trackDocView(req.params.id, req.session.user);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${req.params.id}.pdf"`);
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.sendFile(docPath);
});

// ANALYTICS (admin only)
app.get('/api/analytics', requireAuth, (req, res) => {
  const a = loadAnalytics();
  // Summary
  const docCounts = {};
  a.docViews.forEach(v => { docCounts[v.doc] = (docCounts[v.doc] || 0) + 1; });
  res.json({
    totalLogins: a.logins.length,
    recentLogins: a.logins.slice(-10).reverse(),
    totalDocViews: a.docViews.length,
    docCounts,
    recentDocViews: a.docViews.slice(-10).reverse(),
  });
});

// 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// ─── START ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 FORTUNA Investor Portal running at http://localhost:${PORT}`);
  console.log(`   Mot de passe partagé : ${SHARED_PASSWORD}`);
  console.log(`   Admin: laurent@fortuna.re / Laurent2026!\n`);
});
