# RDS Viewer - Gestionnaire de sessions RDS avec Intelligence Artificielle

## Version 3.0.26 - Application Electron Professionnelle

Application Electron complète pour la gestion de sessions RDS, prêts d'ordinateurs et documents avec IA intégrée (DocuCortex) pour Anecoop.

---

## 🚀 Lancement Rapide

### Développement

```bash
# Lancer le serveur backend + frontend React + Electron
npm run electron:start

# Ou seulement backend + frontend (sans Electron)
npm run dev
```

**Ports utilisés:**
- Frontend React: `http://localhost:3000`
- Backend API: `http://localhost:3002`
- WebSocket: `ws://localhost:3003`

### Production - Build Optimisé

```bash
# Build optimisé portable Windows (recommandé)
build-production.bat

# Ou via npm script
npm run build:optimized
```

Le build génère: `dist/RDS Viewer-3.0.26-Portable-Optimized.exe` (~180 MB)

**⏱️ Temps de build:** 3-5 minutes
**📦 Taille finale:** ~180 MB (optimisé)

---

## 📋 Fonctionnalités Principales

### Gestion RDS
- Sessions RDS en temps réel avec statuts (Actif/Déconnecté/Inactif)
- Synchronisation automatique des sessions
- Filtrage et recherche avancée
- Export Excel des rapports

### Gestion Prêts d'Ordinateurs
- Suivi des prêts en cours
- Notifications de retard automatiques
- Historique complet des prêts
- Gestion des techniciens

### Gestion Documents
- Upload de documents (PDF, Word, Excel, Images)
- Reconnaissance optique (OCR) avec Tesseract.js
- Catégorisation automatique
- Recherche full-text

### Intelligence Artificielle (DocuCortex)
- Chat IA avec Gemini AI
- Analyse de documents
- Extraction de contenu intelligent
- Résumés automatiques
- Suggestions contextuelles

### Administration
- Gestion utilisateurs avec rôles
- Authentification JWT sécurisée
- Logs système
- Configuration centralisée

---

## 🛠️ Architecture Technique

### Stack Technologique

**Frontend:**
- React 18.2.0 + React Router
- Material-UI (MUI) 5.15
- TanStack React Query (cache & synchronisation)
- Axios pour API REST
- WebSocket (ws) pour temps réel

**Backend:**
- Express 4.21 (API REST)
- better-sqlite3 (base de données)
- bcrypt (hashing mots de passe)
- jsonwebtoken (JWT auth)
- multer (upload fichiers)
- express-rate-limit (protection API)

**IA & NLP:**
- Google Generative AI (Gemini)
- natural, compromise, node-nlp (traitement langage)
- tesseract.js (OCR)

**Documents:**
- pdfjs-dist (lecture PDF)
- mammoth (lecture Word)
- xlsx (lecture Excel)
- html2canvas + jspdf (génération PDF)

**Desktop:**
- Electron 31.0.0
- electron-builder (packaging)
- electron-log (logging)
- electron-updater (mises à jour)

### Optimisations Webpack

**Code Splitting:** 5 bundles distincts
- `vendors-react` - React core (~150 KB)
- `vendors-mui` - Material-UI (~400 KB)
- `vendors-documents` - PDF/Excel/Word (~800 KB)
- `vendors-ai` - IA et NLP (~200 KB)
- `vendors-other` - Autres dépendances

**Compression:**
- Minification Terser (drop console.log en prod)
- Gzip compression des assets
- Tree shaking Material-UI
- Source maps optimisés

**Performance:**
- Lazy loading des composants
- React.memo pour composants lourds
- Virtualisation des listes (react-window)
- Cache React Query (5 min TTL)

---

## 📁 Structure du Projet

```
rdp2/
├── electron/
│   ├── main.js                 # Point d'entrée Electron
│   └── preload.js              # Preload script sécurisé
├── server/
│   └── server.js               # Serveur Express principal
├── backend/
│   ├── config/
│   │   └── database.js         # Configuration SQLite
│   ├── controllers/            # Contrôleurs API
│   ├── middleware/             # Middlewares (auth, validation)
│   ├── routes/                 # Routes Express
│   ├── services/               # Services métier
│   │   ├── ai/                 # Services IA (Gemini, NLP)
│   │   ├── documents/          # Gestion documents
│   │   └── realtime/           # WebSocket services
│   └── utils/                  # Utilitaires
├── src/
│   ├── components/             # Composants React
│   │   ├── AI/                 # Interface DocuCortex
│   │   ├── Admin/              # Interfaces admin
│   │   ├── Dashboard/          # Tableaux de bord
│   │   └── RDSManagement/      # Gestion RDS
│   ├── contexts/               # React contexts
│   ├── pages/                  # Pages principales
│   ├── services/               # Services frontend
│   └── utils/                  # Utilitaires frontend
├── public/                     # Assets statiques
├── build/                      # Build React (généré)
├── dist/                       # Builds Electron (généré)
├── data/                       # Base SQLite + uploads
├── config/                     # Configuration app
├── assets/                     # Icônes (ico, png, icns)
├── craco.config.js             # Config Webpack custom
├── electron-builder.json       # Config build standard
├── electron-builder-optimized.json  # Config build optimisé
├── build-production.bat        # Script build optimisé
└── package.json
```

---

## 🎯 Scripts Disponibles

### Développement

| Commande | Description |
|----------|-------------|
| `npm start` | Frontend React seul (port 3000) |
| `npm run server:start` | Backend Express seul (port 3002) |
| `npm run electron:dev` | Electron seul |
| `npm run dev` | Backend + Frontend |
| `npm run electron:start` | **Backend + Frontend + Electron (complet)** |

### Build Production

| Commande | Description |
|----------|-------------|
| `npm run build` | Build React optimisé |
| `npm run build:portable` | Build portable Windows |
| `npm run build:optimized` | **Build optimisé (recommandé)** |
| `npm run build:installer` | Build installeur NSIS |
| `npm run build:all` | Build tous formats Windows |
| `npm run build:linux` | Build Linux (AppImage, deb, rpm) |
| `npm run build:mac` | Build macOS (dmg, zip) |

### Scripts Batch

| Script | Description |
|--------|-------------|
| `build-production.bat` | **Build optimisé complet (recommandé)** |
| `build-fast.bat` | Build rapide sans portable (win-unpacked) |

---

## 🔧 Configuration Build Optimisé

### electron-builder-optimized.json

**Caractéristiques:**
- ✅ ASAR **désactivé** (zéro erreur de modules)
- ✅ `node_modules/**/*` inclus explicitement
- ✅ Compression normale (pas maximum)
- ✅ Exclusion des tests et fichiers dev
- ✅ Temps de build: 3-5 minutes

```json
{
  "asar": false,
  "compression": "normal",
  "files": [
    "build/**/*",
    "electron/**/*",
    "server/**/*",
    "backend/**/*",
    "node_modules/**/*",
    "!node_modules/**/{test,__tests__,tests}/**"
  ]
}
```

### craco.config.js

**Optimisations Webpack:**
- Code splitting intelligent (5 bundles)
- Minification Terser (drop console.log)
- Compression Gzip
- Tree shaking Material-UI
- ESLint non-bloquant en dev

**ESLint Configuration:**
```javascript
eslint: {
  enable: process.env.NODE_ENV !== 'production',
  loaderOptions: {
    failOnError: false,      // Ne bloque PAS la compilation
    failOnWarning: false,    // Ne bloque PAS la compilation
  }
}
```

---

## 📊 Métriques de Performance

| Métrique | Valeur | Notes |
|----------|--------|-------|
| **Taille EXE** | ~180 MB | Portable optimisé |
| **Taille win-unpacked** | ~400 MB | Dossier décompressé |
| **Temps build** | 3-5 min | Sans blocage |
| **Temps démarrage** | 3-4s | Application prête |
| **Mémoire RAM** | 250-300 MB | En fonctionnement |
| **Bundles React** | 5 chunks | Code splitting |
| **Bundle principal** | ~50 KB | Minifié + gzippé |

---

## 🐛 Dépannage

### ESLint bloque la compilation en dev?

```bash
# Solution 1: Déjà configuré dans craco.config.js
# failOnError: false, failOnWarning: false

# Solution 2: Désactiver complètement ESLint
set DISABLE_ESLINT_PLUGIN=true
npm start
```

### Erreur "Cannot find module" après build?

```bash
# 1. Vérifier que le module est dans dependencies (PAS devDependencies)
npm list <module-name>

# 2. Ajouter au package.json dependencies si manquant
npm install --save <module-name>

# 3. Rebuilder les modules natifs
npm rebuild
```

### Build bloque à "building target=portable"?

```bash
# Utiliser le script optimisé (ne devrait plus bloquer)
build-production.bat

# Alternative: Build win-unpacked directement (rapide)
build-fast.bat
```

### better-sqlite3 NODE_MODULE_VERSION mismatch?

```bash
# Rebuilder pour la version Node.js actuelle
npm rebuild better-sqlite3

# Ou réinstaller
npm uninstall better-sqlite3
npm install better-sqlite3
```

### Port 3002 ou 3003 déjà utilisé?

```bash
# Tuer les processus Node.js
taskkill /F /IM node.exe

# Ou changer les ports dans:
# - server/server.js (PORT = 3002, WS_PORT = 3003)
```

---

## 📦 Distribution

### Fichiers Générés

**Build optimisé:**
```
dist/
├── RDS Viewer-3.0.26-Portable-Optimized.exe  (~180 MB)
└── win-unpacked/                             (~400 MB)
    └── RDS Viewer.exe
```

### Distribution aux Utilisateurs

**Option 1: EXE Portable (recommandé)**
- Distribuer: `RDS Viewer-3.0.26-Portable-Optimized.exe`
- Auto-extracteur NSIS
- S'extrait dans `%TEMP%` au lancement
- Aucune installation requise

**Option 2: Dossier win-unpacked**
- Zipper: `dist/win-unpacked/`
- Plus gros (~350 MB zippé)
- Démarrage plus rapide (pas d'extraction)
- Exécuter directement `RDS Viewer.exe`

---

## 📖 Documentation Détaillée

Pour plus de détails techniques sur le build optimisé:
- **[SOLUTION-DEFINITIVE.md](SOLUTION-DEFINITIVE.md)** - Guide complet de la solution

---

## 🔐 Sécurité

- Authentification JWT avec tokens expirables
- Hashing bcrypt pour mots de passe
- express-rate-limit pour protection DoS
- express-validator pour validation inputs
- CORS configuré pour localhost seulement
- Sandboxing Electron désactivé (app interne)

---

## 🚀 Prochaines Étapes

1. **Tester le Build**
   ```bash
   build-production.bat
   ```

2. **Vérifier l'EXE**
   - Lancer `dist/RDS Viewer-3.0.26-Portable-Optimized.exe`
   - Tester toutes les fonctionnalités

3. **Distribuer**
   - Créer release GitHub
   - Uploader l'EXE
   - Partager avec les utilisateurs

---

## 📝 Notes de Version 3.0.26

### Nouveautés
- ✅ Optimisation complète du build (1.5 GB → 400 MB)
- ✅ ESLint non-bloquant en développement
- ✅ Ajout modules backend manquants
- ✅ Script build simplifié (3 étapes)
- ✅ Build terminé en 3-5 min (sans blocage)

### Corrections
- ✅ Résolution erreurs "Cannot find module"
- ✅ Fix better-sqlite3 NODE_MODULE_VERSION
- ✅ Fix compilation bloquée par ESLint
- ✅ Fix portable builder bloqué 20+ min

### Performances
- ✅ Code splitting (5 bundles)
- ✅ Tree shaking Material-UI
- ✅ Compression Gzip
- ✅ Drop console.log en production

---

## 📞 Support

**Application:** RDS Viewer
**Version:** 3.0.26
**Développeur:** Anecoop
**Contact:** support@anecoop.com
**Date:** Janvier 2025

---

## 📄 Licence

Copyright © 2025 Anecoop - Tous droits réservés
