#!/usr/bin/env node
// ─── FORTUNA · Ajout automatique d'un investisseur ───────────────────────────
// Usage : node add-investor.js "Prénom Nom" "email@example.com" "motdepasse"
// ─────────────────────────────────────────────────────────────────────────────

const fs        = require('fs');
const path      = require('path');
const nodemailer = require('nodemailer');
const { execSync } = require('child_process');

// ── Arguments ────────────────────────────────────────────────────────────────
const [,, fullName, email, password] = process.argv;
if (!fullName || !email || !password) {
  console.error('Usage: node add-investor.js "Prénom Nom" "email@example.com" "motdepasse"');
  process.exit(1);
}

// ── 1. Mise à jour de login.js ───────────────────────────────────────────────
const loginPath = path.join(__dirname, 'netlify', 'functions', 'login.js');
let src = fs.readFileSync(loginPath, 'utf8');

const marker = '  // ── Nouveaux investisseurs';
if (!src.includes(marker)) {
  console.error('Marqueur introuvable dans login.js');
  process.exit(1);
}

const newLine = `  { email: '${email}', passwordHash: bcrypt.hashSync('${password}', 10), name: '${fullName}' },`;
src = src.replace(marker, `${marker}\n${newLine}`);
fs.writeFileSync(loginPath, src, 'utf8');
console.log(`✅ Investisseur ajouté dans login.js : ${fullName} <${email}>`);

// ── 2. Envoi de l'email de bienvenue ─────────────────────────────────────────
async function sendWelcomeEmail() {
  const GMAIL_USER = process.env.GMAIL_USER || 'fortunabtp@gmail.com';
  const GMAIL_PASS = process.env.GMAIL_PASS;

  if (!GMAIL_PASS) {
    console.warn('⚠️  GMAIL_PASS non défini — email non envoyé. Exportez GMAIL_PASS=xxx avant de lancer le script.');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_PASS },
  });

  const prenom = fullName.split(' ')[0];

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a1fe8,#2563eb);padding:36px 40px 28px;text-align:center;">
            <div style="font-size:26px;font-weight:800;letter-spacing:.12em;color:#fff;">FORTUNA</div>
            <div style="font-size:12px;color:rgba(255,255,255,.7);margin-top:4px;letter-spacing:.06em;">PORTAIL INVESTISSEURS PRIVÉ</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px 28px;">
            <p style="font-size:16px;font-weight:700;color:#1e293b;margin:0 0 12px;">Bonjour ${prenom},</p>

            <p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 20px;">
              Votre accès au <strong>portail investisseurs FORTUNA</strong> vient d'être créé.
              Vous trouverez ci-dessous vos identifiants personnels.
            </p>

            <!-- Credentials box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8faff;border:1px solid #e2e8f0;border-radius:10px;margin:0 0 24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <div style="font-size:11px;font-weight:700;letter-spacing:.08em;color:#64748b;text-transform:uppercase;margin-bottom:14px;">Vos identifiants de connexion</div>
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-size:13px;color:#94a3b8;width:110px;padding-bottom:8px;">Email</td>
                      <td style="font-size:13px;font-weight:600;color:#1e293b;padding-bottom:8px;">${email}</td>
                    </tr>
                    <tr>
                      <td style="font-size:13px;color:#94a3b8;">Mot de passe</td>
                      <td style="font-size:13px;font-weight:600;color:#1e293b;font-family:monospace;background:#e0e7ff;padding:3px 8px;border-radius:4px;">${password}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding:8px 0 24px;">
                  <a href="https://fortuna-invest.netlify.app" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 32px;border-radius:8px;">
                    Accéder au portail →
                  </a>
                </td>
              </tr>
            </table>

            <p style="font-size:12px;color:#94a3b8;line-height:1.6;margin:0;">
              Ce portail est <strong>strictement confidentiel</strong>. Ne partagez pas vos identifiants.<br>
              Pour toute question, contactez-nous à <a href="mailto:fortunabtp@gmail.com" style="color:#2563eb;">fortunabtp@gmail.com</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8faff;border-top:1px solid #e2e8f0;padding:16px 40px;text-align:center;">
            <div style="font-size:11px;color:#94a3b8;">© 2026 FORTUNA · La Réunion · Document confidentiel</div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: `"FORTUNA Investisseurs" <${GMAIL_USER}>`,
    to: email,
    subject: `🔐 Votre accès au portail FORTUNA — ${fullName}`,
    html,
  });

  console.log(`📧 Email de bienvenue envoyé à ${email}`);
}

// ── 3. Git commit + push ─────────────────────────────────────────────────────
function gitPush() {
  try {
    execSync('git add netlify/functions/login.js', { stdio: 'inherit' });
    execSync(`git commit -m "auth: ajout investisseur ${fullName}"`, { stdio: 'inherit' });
    execSync('git push', { stdio: 'inherit' });
    console.log('🚀 Déployé sur Netlify via git push');
  } catch (e) {
    console.error('❌ Erreur git :', e.message);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
sendWelcomeEmail()
  .then(() => gitPush())
  .catch(err => {
    console.error('❌ Erreur email :', err.message);
    gitPush();
  });
