/* ─── FORTUNA INVESTOR PORTAL · DASHBOARD JS ─────────────────────────────────── */

// ─── AUTH HELPERS ────────────────────────────────────────────────────────────
function getToken() {
  return sessionStorage.getItem('fortuna_token') || '';
}
function authHeaders() {
  const t = getToken();
  return t ? { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' }
           : { 'Content-Type': 'application/json' };
}

// ─── SESSION CHECK ────────────────────────────────────────────────────────────
(async function init() {
  try {
    const res = await fetch('/api/me', { headers: authHeaders() });
    if (!res.ok) { window.location.href = '/'; return; }
    const data = await res.json();
    const el = document.getElementById('sidebarUser');
    if (el) el.textContent = '👤 ' + (data.name || data.user);
  } catch {
    window.location.href = '/';
  }
})();

// ─── NAVIGATION ──────────────────────────────────────────────────────────────
const SECTION_TITLES = {
  'overview':      'Vue d\'ensemble',
  'business-plan': 'Business Plan',
  'love-money':    'Tour 1 – Love Money',
  'qr':            'Q / R Investisseurs',
  'pitch-deck':    'Pitch Deck',
  'legal':         'Documents légaux',
  'contact':       'Contact fondateurs',
  'analytics':     'Tracking Investisseurs',
};

function showSection(id, linkEl) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const sec = document.getElementById('sec-' + id);
  if (sec) sec.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (linkEl) {
    linkEl.classList.add('active');
  } else {
    const nav = document.querySelector(`[data-section="${id}"]`);
    if (nav) nav.classList.add('active');
  }

  const tb = document.getElementById('topbarTitle');
  if (tb) tb.textContent = SECTION_TITLES[id] || id;

  if (window.innerWidth < 768) document.getElementById('sidebar').classList.remove('open');
  if (id === 'analytics') {
    // Reroute vers la vérification du code AVANT d'afficher
    // On annule l'affichage de la section et on ouvre le modal
    document.getElementById('sec-analytics').classList.remove('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    openTrackingModal();
    return false;
  }
  if (id === 'pitch-deck') loadPitchDeck();

  return false;
}

// ─── SIDEBAR TOGGLE ───────────────────────────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
async function logout() {
  sessionStorage.removeItem('fortuna_token');
  await fetch('/api/logout', { method: 'POST' }).catch(() => {});
  window.location.href = '/';
}

// ─── PDF LOADING (via fetch + Blob URL) ───────────────────────────────────────
const blobCache = {};
const loadingDocs = {};

async function fetchPdfBlob(docId) {
  if (blobCache[docId]) return blobCache[docId];
  if (loadingDocs[docId]) return loadingDocs[docId];

  loadingDocs[docId] = (async () => {
    const res = await fetch('/api/doc/' + docId, { headers: authHeaders() });
    if (!res.ok) throw new Error('Accès refusé ou document introuvable.');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    blobCache[docId] = url;
    delete loadingDocs[docId];
    return url;
  })();

  return loadingDocs[docId];
}

// Basculer le viewer PDF intégré
async function viewDoc(docId) {
  const pvId = 'pv-' + docId;
  const iframeId = 'iframe-' + docId;
  const pv = document.getElementById(pvId);
  const iframe = document.getElementById(iframeId);
  if (!pv || !iframe) return;

  if (pv.style.display === 'none' || !pv.style.display) {
    // Loader
    pv.style.display = 'block';
    if (!blobCache[docId]) {
      iframe.style.display = 'none';
      pv.innerHTML = '<div class="pdf-loading">⏳ Chargement du document…</div>';
    }
    try {
      const url = await fetchPdfBlob(docId);
      // Restaurer l'iframe si on a remplacé le contenu
      if (!document.getElementById(iframeId)) {
        pv.innerHTML = `<iframe id="${iframeId}" src="${url}" class="pdf-iframe"></iframe>`;
      } else {
        document.getElementById(iframeId).src = url;
        document.getElementById(iframeId).style.display = 'block';
      }
    } catch (err) {
      pv.innerHTML = `<div class="pdf-error">❌ ${err.message}</div>`;
    }
  } else {
    pv.style.display = 'none';
  }
}

// Télécharger un document
async function downloadDoc(docId, filename) {
  const btn = event && event.currentTarget;
  const origText = btn ? btn.textContent : '';
  if (btn) btn.textContent = '⏳ Téléchargement…';

  try {
    const url = await fetchPdfBlob(docId);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || docId + '.pdf';
    a.click();
  } catch (err) {
    alert('Erreur : ' + err.message);
  } finally {
    if (btn) btn.textContent = origText;
  }
}

// Chargement automatique du Pitch Deck
let pitchLoaded = false;
async function loadPitchDeck() {
  if (pitchLoaded) return;
  const iframe = document.getElementById('iframe-pitch-deck');
  const pv = document.getElementById('pv-pitch-deck');
  if (!iframe) return;

  pv.innerHTML = '<div class="pdf-loading">⏳ Chargement du Pitch Deck…</div>';
  try {
    const url = await fetchPdfBlob('pitch-deck');
    pv.innerHTML = `<iframe id="iframe-pitch-deck" src="${url}" class="pdf-iframe pitch-full"></iframe>`;
    pitchLoaded = true;
  } catch (err) {
    pv.innerHTML = `<div class="pdf-error">❌ Impossible de charger le Pitch Deck. ${err.message}</div>`;
  }
}

// ─── FAQ ACCORDION ────────────────────────────────────────────────────────────
function toggleFAQ(qEl) {
  const item = qEl.closest('.faq-item');
  const ans = item.querySelector('.faq-a');
  const isOpen = qEl.classList.contains('open');

  document.querySelectorAll('.faq-q.open').forEach(q => {
    q.classList.remove('open');
    q.closest('.faq-item').querySelector('.faq-a').classList.remove('open');
  });

  if (!isOpen) {
    qEl.classList.add('open');
    ans.classList.add('open');
  }
}

// ─── FAQ FILTER ───────────────────────────────────────────────────────────────
function filterFAQ(cat, btn) {
  document.querySelectorAll('.faq-cat').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  document.querySelectorAll('.faq-item').forEach(item => {
    item.classList.toggle('hidden', cat !== 'all' && item.dataset.cat !== cat);
  });
}

// ─── LEGAL DOC REQUEST ────────────────────────────────────────────────────────
function requestDoc(docName) {
  const msg = document.getElementById('docRequestMsg');
  if (msg) {
    msg.style.display = 'block';
    msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// ─── CONTACT FORM ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name    = document.getElementById('cName').value;
      const email   = document.getElementById('cEmail').value;
      const subject = document.getElementById('cSubject').value;
      const msg     = document.getElementById('cMsg').value;

      const mailtoLink = `mailto:laurent@fortuna.re,thierry@fortuna.re`
        + `?subject=${encodeURIComponent('[Investor Portal] ' + subject)}`
        + `&body=${encodeURIComponent(`De: ${name} (${email})\n\n${msg}`)}`;
      window.open(mailtoLink, '_blank');

      document.getElementById('contactSuccess').style.display = 'block';
      form.reset();
    });
  }
});

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
async function loadAnalytics() {
  const container = document.getElementById('analyticsContent');
  if (!container) return;

  try {
    const res = await fetch('/api/analytics', { headers: authHeaders() });
    const data = await res.json();

    const docLabels = {
      'business-plan':     '📄 Business Plan',
      'pitch-deck':        '🎯 Pitch Deck',
      'executive-summary': '📋 Executive Summary',
      'qr-investisseurs':  '💬 Q/R Investisseurs',
    };

    const sectionLabels = {
      'business-plan': 'Business Plan', 'love-money': 'Tour 1 Love Money',
      'qr': 'Q/R', 'pitch-deck': 'Pitch Deck', 'docs': 'Documents légaux',
      'contact': 'Contact', 'analytics': 'Tracking'
    };

    // ── Par utilisateur (depuis userMap API ou reconstitué) ──────────
    const userMap = data.userMap && Object.keys(data.userMap).length
      ? data.userMap
      : (() => {
          const m = {};
          (data.recentLogins || []).forEach(l => {
            const key = l.user || l.email || 'Inconnu';
            if (!m[key]) m[key] = { logins: [], lastLogin: null };
            m[key].logins.push(l.at);
            if (!m[key].lastLogin || new Date(l.at) > new Date(m[key].lastLogin))
              m[key].lastLogin = l.at;
          });
          return m;
        })();

    const fmt = iso => {
      if (!iso) return '–';
      const d = new Date(iso);
      return d.toLocaleDateString('fr-FR') + ' à ' + d.toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'});
    };

    const userRows = Object.keys(userMap).length
      ? Object.entries(userMap).sort((a,b) => new Date(b[1].lastLogin) - new Date(a[1].lastLogin)).map(([user, info]) => `
          <tr>
            <td style="padding:10px 12px;font-weight:600;color:#1e293b">${user}</td>
            <td style="padding:10px 12px;text-align:center">
              <span style="background:#dbeafe;color:#1d4ed8;border-radius:20px;padding:3px 10px;font-size:.8rem;font-weight:700">${info.logins.length}</span>
            </td>
            <td style="padding:10px 12px;color:#64748b;font-size:.82rem">${fmt(info.lastLogin)}</td>
          </tr>`).join('')
      : `<tr><td colspan="3" style="padding:16px;text-align:center;color:#94a3b8">Aucune connexion enregistrée</td></tr>`;

    // ── Documents ────────────────────────────────────────────────────
    const topDocs = Object.entries(data.docCounts || {}).length
      ? Object.entries(data.docCounts).sort((a,b) => b[1]-a[1]).map(([k,v]) => `
          <tr>
            <td style="padding:10px 12px;color:#1e293b">${docLabels[k]||k}</td>
            <td style="padding:10px 12px;text-align:center">
              <span style="background:#f0fdf4;color:#16a34a;border-radius:20px;padding:3px 10px;font-size:.8rem;font-weight:700">${v}</span>
            </td>
          </tr>`).join('')
      : `<tr><td colspan="2" style="padding:16px;text-align:center;color:#94a3b8">Aucune consultation enregistrée</td></tr>`;

    // ── Dernières activités ──────────────────────────────────────────
    const recentActivity = (data.recentLogins || []).slice(0, 15).map(l => {
      const d = new Date(l.at);
      const time = d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'});
      return `<li class="log-item"><span class="log-user">${l.user}</span><span class="log-time">${time}</span></li>`;
    }).join('') || '<li class="log-item"><span class="log-user">Aucune donnée</span></li>';

    const uniqueUsers = Object.keys(userMap).length;
    const lastActivity = data.recentLogins?.[0] ? fmt(data.recentLogins[0].at) : '–';

    const tblStyle = 'width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0';
    const thStyle = 'padding:10px 12px;background:#f8fafc;font-size:.72rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em;text-align:left;border-bottom:1px solid #e2e8f0';
    const trHover = 'border-bottom:1px solid #f1f5f9';

    container.innerHTML = `
      <div class="analytics-grid" style="margin-bottom:1.5rem">
        <div class="analytics-card">
          <div class="analytics-num">${uniqueUsers || '–'}</div>
          <div class="analytics-label">Investisseurs actifs</div>
        </div>
        <div class="analytics-card">
          <div class="analytics-num">${data.totalLogins || '–'}</div>
          <div class="analytics-label">Connexions totales</div>
        </div>
        <div class="analytics-card">
          <div class="analytics-num">${data.totalDocViews || '–'}</div>
          <div class="analytics-label">Documents consultés</div>
        </div>
      </div>

      <div style="margin-bottom:1.5rem">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.75rem">
          <h3 style="font-size:.95rem;font-weight:700;color:#1e293b">👤 Activité par investisseur</h3>
          <span style="font-size:.75rem;color:#94a3b8">Dernière activité : ${lastActivity}</span>
        </div>
        <table style="${tblStyle}">
          <thead><tr>
            <th style="${thStyle}">Investisseur</th>
            <th style="${thStyle};text-align:center">Visites</th>
            <th style="${thStyle}">Dernière connexion</th>
          </tr></thead>
          <tbody style="${trHover}">${userRows}</tbody>
        </table>
      </div>

      <div>
        <h3 style="font-size:.95rem;font-weight:700;color:#1e293b;margin-bottom:.75rem">📂 Documents consultés</h3>
        <table style="${tblStyle}">
          <thead><tr>
            <th style="${thStyle}">Document</th>
            <th style="${thStyle};text-align:center">Vues</th>
          </tr></thead>
          <tbody>${topDocs}</tbody>
        </table>
      </div>

      <div style="margin-top:1.5rem">
        <h3 style="font-size:.95rem;font-weight:700;color:#1e293b;margin-bottom:.75rem">🕐 Journal des connexions récentes</h3>
        <ul class="log-list">${recentActivity}</ul>
      </div>`;

  } catch {
    container.innerHTML = '<div class="loading-spinner">Erreur de chargement.</div>';
  }
}

// ─── TRACKING CODE MODAL ───────────────────────────────────────────────────────
function openTrackingModal() {
  const modal = document.getElementById('trackingModal');
  modal.style.display = 'flex';
  document.getElementById('trackingCodeInput').value = '';
  document.getElementById('trackingCodeError').style.display = 'none';
  setTimeout(() => document.getElementById('trackingCodeInput').focus(), 100);
}

function closeTrackingModal() {
  document.getElementById('trackingModal').style.display = 'none';
}

function submitTrackingCode() {
  const code = document.getElementById('trackingCodeInput').value.trim();
  const errEl = document.getElementById('trackingCodeError');
  if (code === 'anutrof') {
    closeTrackingModal();
    // Afficher la section analytics manuellement
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById('sec-analytics').classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const nav = document.querySelector('[data-section="analytics"]');
    if (nav) nav.classList.add('active');
    const tb = document.getElementById('topbarTitle');
    if (tb) tb.textContent = 'Tracking Investisseurs';
    loadAnalytics();
  } else {
    errEl.textContent = 'Code incorrect. Accès refusé.';
    errEl.style.display = 'block';
    document.getElementById('trackingCodeInput').value = '';
    document.getElementById('trackingCodeInput').focus();
  }
}

// ─── MODAL INVESTISSEMENT ─────────────────────────────────────────────────────
let selectedLot = null;

function openInvestModal() {
  selectedLot = null;
  goModalStep1();
  document.getElementById('investModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeInvestModal() {
  document.getElementById('investModal').style.display = 'none';
  document.body.style.overflow = '';
}

function closeModalOutside(e) {
  if (e.target === document.getElementById('investModal')) closeInvestModal();
}

function selectModalLot(lot, montant, profil) {
  selectedLot = { lot, montant, profil };
  document.querySelectorAll('.modal-lot').forEach(el => el.classList.remove('selected'));
  document.getElementById('mlot-' + lot).classList.add('selected');
  const btn = document.getElementById('btnStep1Next');
  btn.disabled = false;
  btn.style.opacity = '1';
}

function goModalStep1() {
  document.getElementById('modalStep1').style.display = 'block';
  document.getElementById('modalStep2').style.display = 'none';
  document.getElementById('modalStep3').style.display = 'none';
}

function goModalStep2() {
  if (!selectedLot) return;
  document.getElementById('modalStep1').style.display = 'none';
  document.getElementById('modalStep2').style.display = 'block';
  document.getElementById('modalStep3').style.display = 'none';

  document.getElementById('iLot').value     = 'LOT ' + selectedLot.lot;
  document.getElementById('iMontant').value = selectedLot.montant;
  document.getElementById('iProfil').value  = selectedLot.profil;

  document.getElementById('lotRecap').innerHTML = `
    <span class="mlr-lot">✅ LOT ${selectedLot.lot} sélectionné</span>
    <span class="mlr-price">${selectedLot.montant}</span>
    <span class="mlr-profile">${selectedLot.profil}</span>
  `;
}

async function submitInvestForm(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSubmitInvest');
  btn.textContent = '⏳ Envoi en cours…';
  btn.disabled = true;

  const prenom   = document.getElementById('iPrenom').value.trim();
  const nom      = document.getElementById('iNom').value.trim();
  const email    = document.getElementById('iEmail').value.trim();
  const tel      = document.getElementById('iTel').value.trim();
  const msg      = document.getElementById('iMsg').value.trim();
  const payEl    = document.querySelector('input[name="paiement"]:checked');
  const paiement = payEl ? payEl.value : 'Non précisé';
  document.getElementById('iPaiement').value = paiement;

  const payload = {
    lot:       selectedLot.lot,
    montant:   selectedLot.montant,
    profil:    selectedLot.profil,
    prenom, nom, email,
    telephone: tel,
    paiement,
    message:   msg,
  };

  // 1 – Envoi email via Netlify Function (SMTP)
  let emailSent = false;
  try {
    const res = await fetch('/api/send-reservation', {
      method:  'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    if (res.ok) emailSent = true;
  } catch { /* réseau indisponible */ }

  // 2 – Fallback : Netlify Forms (capture sans SMTP)
  try {
    await fetch('/', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        'form-name': 'reservation-investissement',
        prenom, nom, email, telephone: tel,
        lot:     'LOT ' + selectedLot.lot,
        montant: selectedLot.montant,
        profil:  selectedLot.profil,
        message: msg,
      }).toString(),
    });
  } catch { /* ignore si hors Netlify */ }

  // 3 – Fallback ultime : mailto si SMTP et Netlify Forms échouent
  if (!emailSent) {
    const subj = encodeURIComponent(`[FORTUNA] Réservation LOT ${selectedLot.lot} – ${prenom} ${nom}`);
    const body = encodeURIComponent(
      `Réservation investissement FORTUNA\n\n` +
      `LOT ${selectedLot.lot} – ${selectedLot.montant} (${selectedLot.profil})\n\n` +
      `Prénom : ${prenom}\nNom : ${nom}\nEmail : ${email}\nTél : ${tel}\nMessage : ${msg || '–'}\n\nClosing : 5 avril 2026`
    );
    window.open(`mailto:laurent@fortuna.re,thierry@fortuna.re?subject=${subj}&body=${body}`, '_blank');
  }

  // Afficher l'écran de succès
  document.getElementById('successDetails').innerHTML =
    `LOT ${selectedLot.lot} — ${selectedLot.montant} (${selectedLot.profil})<br>` +
    `👤 ${prenom} ${nom} · 📧 ${email} · 📞 ${tel}`;

  document.getElementById('modalStep2').style.display = 'none';
  document.getElementById('modalStep3').style.display = 'block';
  btn.textContent = '✅ Confirmer ma réservation';
  btn.disabled = false;
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeInvestModal();
});
