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
  if (id === 'analytics') loadAnalytics();
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
      'business-plan':     'Business Plan',
      'pitch-deck':        'Pitch Deck',
      'executive-summary': 'Executive Summary',
      'qr-investisseurs':  'Q/R Investisseurs',
    };

    const isNetlify = !!data.deployedOn;
    const noteHtml = isNetlify
      ? `<div class="info-box" style="margin-bottom:1.5rem">
           ℹ️ ${data.note || 'Analytics persistantes non disponibles en mode serverless.'}
         </div>`
      : '';

    const topDocs = Object.entries(data.docCounts || {}).length
      ? Object.entries(data.docCounts).sort((a,b) => b[1]-a[1])
          .map(([k,v]) => `<li class="log-item"><span class="log-user">${docLabels[k]||k}</span><span class="log-time">${v} vue(s)</span></li>`).join('')
      : '<li class="log-item"><span class="log-user">Aucune donnée</span></li>';

    const recentLogins = (data.recentLogins || []).length
      ? data.recentLogins.map(l => {
          const d = new Date(l.at);
          const time = d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'});
          return `<li class="log-item"><span class="log-user">${l.user}</span><span class="log-time">${time}</span></li>`;
        }).join('')
      : '<li class="log-item"><span class="log-user">Aucune donnée</span></li>';

    container.innerHTML = `
      ${noteHtml}
      <div class="analytics-grid">
        <div class="analytics-card">
          <div class="analytics-num">${data.totalLogins || '–'}</div>
          <div class="analytics-label">Connexions totales</div>
        </div>
        <div class="analytics-card">
          <div class="analytics-num">${data.totalDocViews || '–'}</div>
          <div class="analytics-label">Documents consultés</div>
        </div>
        <div class="analytics-card">
          <div class="analytics-num">${Object.keys(data.docCounts||{}).length || '–'}</div>
          <div class="analytics-label">Docs uniques vus</div>
        </div>
      </div>
      <div class="content-grid" style="margin-top:1.5rem">
        <div class="info-block"><h3>Documents les plus consultés</h3><ul class="log-list">${topDocs}</ul></div>
        <div class="info-block"><h3>Dernières connexions</h3><ul class="log-list">${recentLogins}</ul></div>
      </div>`;
  } catch {
    container.innerHTML = '<div class="loading-spinner">Erreur de chargement.</div>';
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

  const prenom = document.getElementById('iPrenom').value.trim();
  const nom    = document.getElementById('iNom').value.trim();
  const email  = document.getElementById('iEmail').value.trim();
  const tel    = document.getElementById('iTel').value.trim();
  const msg    = document.getElementById('iMsg').value.trim();

  const payload = {
    lot:       selectedLot.lot,
    montant:   selectedLot.montant,
    profil:    selectedLot.profil,
    prenom, nom, email,
    telephone: tel,
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
