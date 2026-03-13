/* ─── FORTUNA · NETLIFY FUNCTION : send-reservation ───────────────────────── */
const nodemailer = require('nodemailer');
const jwt        = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fortuna-investor-jwt-secret-2026';

// ── Auth helper ─────────────────────────────────────────────────────────────
function getUser(event) {
  const auth  = (event.headers['authorization'] || '').replace('Bearer ', '').trim();
  const cookie = (event.headers['cookie'] || '');
  if (!auth) return 'Investisseur';
  try {
    const decoded = jwt.verify(auth, JWT_SECRET);
    return decoded.name || decoded.user || 'Investisseur';
  } catch {
    return 'Investisseur';
  }
}

// ── HTML email – fondateurs ─────────────────────────────────────────────────
function buildFounderEmail({ lot, montant, profil, prenom, nom, email, telephone, paiement, message }) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:32px 40px;text-align:center">
          <div style="font-size:28px;font-weight:800;letter-spacing:4px;color:#d4a843">FORTUNA</div>
          <div style="color:#94a3b8;font-size:13px;margin-top:4px;letter-spacing:2px">INVESTOR PORTAL</div>
        </td></tr>

        <!-- Alert badge -->
        <tr><td style="padding:32px 40px 0">
          <div style="background:#fef3c7;border-left:4px solid #d4a843;border-radius:6px;padding:16px 20px">
            <div style="font-size:18px;font-weight:700;color:#92400e">🔔 Nouvelle réservation d'investissement</div>
            <div style="color:#78350f;font-size:14px;margin-top:4px">Reçue le ${new Date().toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' })} à ${new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</div>
          </div>
        </td></tr>

        <!-- Lot info -->
        <tr><td style="padding:28px 40px 0">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:10px;overflow:hidden">
            <tr><td style="padding:24px 28px">
              <div style="color:#d4a843;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px">Lot sélectionné</div>
              <div style="display:flex;align-items:baseline;gap:12px">
                <span style="color:#ffffff;font-size:32px;font-weight:800">LOT ${lot}</span>
                <span style="color:#d4a843;font-size:22px;font-weight:700">${montant}</span>
              </div>
              <div style="color:#94a3b8;font-size:14px;margin-top:8px">${profil}</div>
              ${paiement && paiement !== 'Non précisé' ? `<div style="margin-top:10px;display:inline-block;background:#d4a843;color:#0f172a;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px">💳 Paiement en ${paiement}</div>` : ''}
            </td></tr>
          </table>
        </td></tr>

        <!-- Contact info -->
        <tr><td style="padding:28px 40px 0">
          <div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:16px;text-transform:uppercase;letter-spacing:1px">Coordonnées de l'investisseur</div>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;width:140px">👤 Prénom &amp; Nom</td>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;font-weight:600">${prenom} ${nom}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px">📧 Email</td>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:14px"><a href="mailto:${email}" style="color:#1e3a5f;font-weight:600">${email}</a></td>
            </tr>
            <tr>
              <td style="padding:10px 0;${message ? 'border-bottom:1px solid #e2e8f0;' : ''}color:#64748b;font-size:14px">📞 Téléphone</td>
              <td style="padding:10px 0;${message ? 'border-bottom:1px solid #e2e8f0;' : ''}color:#0f172a;font-size:14px;font-weight:600">${telephone || '–'}</td>
            </tr>
            ${message ? `
            <tr>
              <td style="padding:10px 0;color:#64748b;font-size:14px;vertical-align:top">💬 Message</td>
              <td style="padding:10px 0;color:#0f172a;font-size:14px">${message}</td>
            </tr>` : ''}
          </table>
        </td></tr>

        <!-- Action reminder -->
        <tr><td style="padding:28px 40px">
          <div style="background:#f0fdf4;border-radius:8px;padding:20px;border:1px solid #bbf7d0">
            <div style="font-size:14px;font-weight:700;color:#166534;margin-bottom:8px">✅ Action recommandée</div>
            <div style="font-size:14px;color:#166534">Contacter ${prenom} ${nom} dans les 48h pour confirmer les modalités de souscription (virement, calendrier de paiement, documents légaux).</div>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0">
          <div style="color:#94a3b8;font-size:12px">FORTUNA – Portail Investisseurs · Closing prévu le <strong>5 avril 2026</strong></div>
          <div style="color:#cbd5e1;font-size:11px;margin-top:4px">Ce message est envoyé automatiquement depuis le portail sécurisé des investisseurs.</div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── HTML email – investisseur (confirmation) ────────────────────────────────
function buildInvestorEmail({ lot, montant, profil, prenom, nom }) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:32px 40px;text-align:center">
          <div style="font-size:28px;font-weight:800;letter-spacing:4px;color:#d4a843">FORTUNA</div>
          <div style="color:#94a3b8;font-size:13px;margin-top:4px;letter-spacing:2px">INVESTOR PORTAL</div>
        </td></tr>

        <!-- Greeting -->
        <tr><td style="padding:36px 40px 0">
          <div style="font-size:22px;font-weight:700;color:#0f172a">Bonjour ${prenom},</div>
          <div style="margin-top:12px;font-size:16px;color:#475569;line-height:1.7">
            Nous avons bien reçu votre demande de réservation. Votre intérêt pour FORTUNA nous touche et nous vous félicitons de votre excellente décision.
          </div>
        </td></tr>

        <!-- Reservation recap -->
        <tr><td style="padding:28px 40px 0">
          <div style="background:#0f172a;border-radius:10px;padding:24px 28px">
            <div style="color:#d4a843;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px">Récapitulatif de votre réservation</div>
            <div style="color:#ffffff;font-size:24px;font-weight:800">LOT ${lot} — ${montant}</div>
            <div style="color:#94a3b8;font-size:14px;margin-top:6px">${profil}</div>
          </div>
        </td></tr>

        <!-- Next steps -->
        <tr><td style="padding:28px 40px 0">
          <div style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:16px">📋 Prochaines étapes</div>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:top;padding:8px 0">
                <div style="background:#d4a843;color:#0f172a;border-radius:50%;width:28px;height:28px;text-align:center;line-height:28px;font-weight:700;font-size:13px;display:inline-block;min-width:28px">1</div>
              </td>
              <td style="padding:8px 0 8px 12px;font-size:14px;color:#475569">L'équipe fondatrice vous contactera dans les <strong>48 heures</strong> pour confirmer les modalités.</td>
            </tr>
            <tr>
              <td style="vertical-align:top;padding:8px 0">
                <div style="background:#d4a843;color:#0f172a;border-radius:50%;width:28px;height:28px;text-align:center;line-height:28px;font-weight:700;font-size:13px;display:inline-block;min-width:28px">2</div>
              </td>
              <td style="padding:8px 0 8px 12px;font-size:14px;color:#475569">Vous recevrez les <strong>documents légaux</strong> de souscription à signer électroniquement.</td>
            </tr>
            <tr>
              <td style="vertical-align:top;padding:8px 0">
                <div style="background:#d4a843;color:#0f172a;border-radius:50%;width:28px;height:28px;text-align:center;line-height:28px;font-weight:700;font-size:13px;display:inline-block;min-width:28px">3</div>
              </td>
              <td style="padding:8px 0 8px 12px;font-size:14px;color:#475569">Le <strong>virement de souscription</strong> sera effectué selon le calendrier convenu avant le <strong>5 avril 2026</strong>.</td>
            </tr>
          </table>
        </td></tr>

        <!-- Contact -->
        <tr><td style="padding:28px 40px">
          <div style="background:#f8fafc;border-radius:8px;padding:20px;border:1px solid #e2e8f0">
            <div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:12px">📞 Vos contacts FORTUNA</div>
            <div style="font-size:14px;color:#475569;margin-bottom:6px">
              <strong>Laurent Aubry</strong> — <a href="tel:+262692649000" style="color:#1e3a5f">+262 692 64 9000</a> · <a href="mailto:laurent@fortuna.re" style="color:#1e3a5f">laurent@fortuna.re</a>
            </div>
            <div style="font-size:14px;color:#475569">
              <strong>Thierry Fontaine</strong> — <a href="tel:+262692570252" style="color:#1e3a5f">+262 692 570 252</a> · <a href="mailto:thierry@fortuna.re" style="color:#1e3a5f">thierry@fortuna.re</a>
            </div>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0">
          <div style="color:#0f172a;font-weight:700;letter-spacing:3px;font-size:14px">FORTUNA</div>
          <div style="color:#94a3b8;font-size:12px;margin-top:4px">Construire l'avenir de La Réunion, ensemble.</div>
          <div style="color:#cbd5e1;font-size:11px;margin-top:8px">Ce message de confirmation a été envoyé automatiquement. Merci de ne pas y répondre directement.</div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Handler ──────────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Auth check
  const auth = (event.headers['authorization'] || '').replace('Bearer ', '').trim();
  if (auth) {
    try { jwt.verify(auth, JWT_SECRET); }
    catch { return { statusCode: 401, body: JSON.stringify({ error: 'Non autorisé' }) }; }
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: 'Corps invalide' }) }; }

  const { lot, montant, profil, prenom, nom, email, telephone, paiement, message } = body;

  if (!lot || !montant || !prenom || !nom || !email) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Champs obligatoires manquants' }) };
  }

  // ── SMTP config ─────────────────────────────────────────────────────────
  const GMAIL_USER = process.env.GMAIL_USER;    // ex: fortuna.noreply@gmail.com
  const GMAIL_PASS = process.env.GMAIL_PASS;    // App Password 16 caractères

  if (!GMAIL_USER || !GMAIL_PASS) {
    // Graceful degradation – log mais ne plante pas (Netlify Forms a déjà capté)
    console.warn('[send-reservation] GMAIL_USER / GMAIL_PASS non configurés.');
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, warn: 'Email non envoyé (SMTP non configuré)' }),
    };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_PASS },
  });

  const subject = `[FORTUNA] 🏗️ Réservation LOT ${lot} – ${prenom} ${nom}`;

  try {
    // Email aux fondateurs
    await transporter.sendMail({
      from: `"FORTUNA Investor Portal" <${GMAIL_USER}>`,
      to: 'laurent@fortuna.re, thierry@fortuna.re',
      subject,
      html: buildFounderEmail({ lot, montant, profil, prenom, nom, email, telephone, paiement, message }),
    });

    // Email de confirmation à l'investisseur
    await transporter.sendMail({
      from: `"FORTUNA" <${GMAIL_USER}>`,
      to: email,
      subject: `[FORTUNA] Confirmation de votre réservation – LOT ${lot}`,
      html: buildInvestorEmail({ lot, montant, profil, prenom, nom }),
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error('[send-reservation] SMTP error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erreur envoi email: ' + err.message }),
    };
  }
};
