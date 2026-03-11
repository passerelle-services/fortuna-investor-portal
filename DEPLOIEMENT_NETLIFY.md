# 🚀 FORTUNA – Déploiement sur Netlify

## Pré-requis
- Compte GitHub (gratuit) : https://github.com
- Compte Netlify (gratuit) : https://netlify.com

---

## ÉTAPE 1 – Préparer le dépôt GitHub

### 1.1 Créer un fichier .gitignore
Créer le fichier `.gitignore` à la racine du projet :
```
node_modules/
data/analytics.json
.env
*.env
```

### 1.2 Initialiser Git et pousser sur GitHub
```bash
cd "C:\Users\Administrator\Dropbox\CLAUDE IA TRAVAIL\INVESTISSEUR\investor-portal"
git init
git add .
git commit -m "Initial commit - FORTUNA Investor Portal"
```

Créer un dépôt PRIVÉ sur https://github.com/new (nommé `fortuna-investor-portal`)
puis :
```bash
git remote add origin https://github.com/VOTRE_USERNAME/fortuna-investor-portal.git
git branch -M main
git push -u origin main
```

---

## ÉTAPE 2 – Déployer sur Netlify

### 2.1 Connecter GitHub à Netlify
1. Aller sur https://app.netlify.com
2. Cliquer **"Add new site"** → **"Import an existing project"**
3. Choisir **GitHub** → Autoriser Netlify
4. Sélectionner le repo `fortuna-investor-portal`

### 2.2 Paramètres de build
| Champ | Valeur |
|---|---|
| Base directory | *(laisser vide)* |
| Build command | *(laisser vide)* |
| Publish directory | `public` |
| Functions directory | `netlify/functions` |

Cliquer **"Deploy site"**

---

## ÉTAPE 3 – Variables d'environnement (IMPORTANT)

Dans Netlify : **Site settings → Environment variables → Add variable**

| Variable | Valeur |
|---|---|
| `JWT_SECRET` | *(chaîne aléatoire sécurisée, ex: `F0rtun4-S3cret-K3y-2026-R3union-BTP`)* |
| `SHARED_PASSWORD` | `Fortuna2026!` |
| `PASS_LAURENT` | `Laurent2026!` |
| `PASS_THIERRY` | `Thierry2026!` |

⚠️ **NE PAS utiliser les mots de passe par défaut en production !**
Choisir des mots de passe forts et les communiquer aux investisseurs.

Après ajout des variables → **Trigger redeploy**

---

## ÉTAPE 4 – Domaine personnalisé (optionnel)

### Option A : Sous-domaine Netlify (gratuit)
Par défaut : `https://fortuna-investor-portal.netlify.app`
Vous pouvez personnaliser : **Site settings → Domain management → Custom domains**
Ex: `https://investors.fortuna.re`

### Option B : Domaine fortuna.re
Si vous avez accès à fortuna.re :
1. Aller dans **Domain management → Add custom domain**
2. Entrer `investors.fortuna.re`
3. Ajouter un enregistrement CNAME chez votre registrar :
   - `investors` → `[votre-site].netlify.app`

---

## ÉTAPE 5 – Vérification

Accéder à l'URL Netlify et tester :
- ✅ Login avec `Fortuna2026!`
- ✅ Navigation entre sections
- ✅ Consultation des PDFs
- ✅ Téléchargement des PDFs

---

## Structure du projet pour Netlify

```
investor-portal/
├── netlify.toml              ← Config Netlify (build + redirects)
├── netlify/
│   └── functions/
│       ├── login.js          ← POST /api/login
│       ├── me.js             ← GET /api/me
│       ├── logout.js         ← POST /api/logout
│       ├── doc.js            ← GET /api/doc/:id
│       ├── analytics.js      ← GET /api/analytics
│       └── docs/             ← PDFs embarqués (bundlés avec les fonctions)
│           ├── business-plan.pdf
│           ├── pitch-deck.pdf
│           ├── executive-summary.pdf
│           └── qr-investisseurs.pdf
├── public/                   ← Site statique servi par Netlify CDN
│   ├── index.html            ← Page login
│   ├── dashboard.html        ← Portal
│   ├── assets/logo.png
│   ├── css/style.css
│   └── js/dashboard.js
└── server.js                 ← Serveur local Express (dev uniquement)
```

---

## Différences Local vs Netlify

| Fonctionnalité | Local (server.js) | Netlify |
|---|---|---|
| Auth | Session + JWT | JWT uniquement |
| PDFs | Depuis Google Drive | Embarqués dans les fonctions |
| Analytics | Fichier JSON persistant | Non persistant (logs Netlify) |
| HTTPS | Non (HTTP) | Oui (automatique) |
| Accès | localhost:3000 | URL publique |

---

## Sécurité Netlify

- ✅ HTTPS forcé automatiquement
- ✅ Headers X-Robots-Tag: noindex sur tout le site
- ✅ JWT avec expiration 8h
- ✅ PDFs non accessibles directement (servis uniquement via fonction authentifiée)
- ✅ Rate limiting (côté client + Netlify)

---

## Support

- Netlify docs : https://docs.netlify.com/functions/overview/
- Contact : laurent@fortuna.re / thierry@fortuna.re
