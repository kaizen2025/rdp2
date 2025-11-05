# 🚀 RDS Viewer - Guide de Compilation

## 📋 Vue d'ensemble

Ce guide explique comment générer les exécutables de RDS Viewer avec l'AI Assistant DocuCortex intégré.

---

## 🎯 Prérequis

### **Environnement de développement**
- ✅ **Node.js 18+** installé
- ✅ **npm** ou **yarn**
- ✅ **Git** (pour gestion de version)

### **Dépendances système (Windows)**
- ✅ **Visual Studio Build Tools** (pour modules natifs)
- ✅ **Python 3.x** (pour node-gyp)
- ✅ **Windows 10/11** (pour build Windows)

### **Vérifications préalables**
```bash
# Vérifier Node.js
node --version  # Devrait afficher v18+

# Vérifier npm
npm --version

# Vérifier electron-builder
npx electron-builder --version
```

---

## 📦 Installation des dépendances

### **Étape 1: Cloner le projet (si nécessaire)**
```bash
git clone <repository-url>
cd rdp2
```

### **Étape 2: Installer toutes les dépendances**
```bash
# Installation complète avec legacy peer deps
npm install --legacy-peer-deps
```

**Important:** Utilisez toujours `--legacy-peer-deps` car il y a des conflits mineurs entre les packages MUI qui sont sans danger.

---

## 🔨 Scripts de Build Disponibles

### **1. Build Portable Exe (Recommandé)**
Génère un exe portable Windows qui ne nécessite pas d'installation.

```bash
npm run build:portable
```

**Résultat:** `dist/RDS Viewer-3.0.26-Portable.exe`

**Caractéristiques:**
- ✅ Ne nécessite pas d'installation
- ✅ Toutes les données dans le même dossier
- ✅ Peut être exécuté depuis une clé USB
- ✅ Taille: ~300-400 MB

---

### **2. Build Installateur NSIS**
Génère un installateur Windows classique.

```bash
npm run build:installer
```

**Résultat:** `dist/RDS Viewer-3.0.26-Setup.exe`

**Caractéristiques:**
- ✅ Installation dans Program Files
- ✅ Création de raccourcis bureau/menu démarrer
- ✅ Désinstallation propre
- ✅ Support multi-utilisateurs

---

### **3. Build Complet (Portable + Installateur)**
Génère les deux versions en une seule commande.

```bash
npm run build:all
```

**Résultat:**
- `dist/RDS Viewer-3.0.26-Portable.exe`
- `dist/RDS Viewer-3.0.26-Setup.exe`

---

### **4. Build Linux (AppImage, .deb, .rpm)**
```bash
npm run build:linux
```

**Résultat:**
- `dist/RDS Viewer-3.0.26.AppImage`
- `dist/rds-viewer_3.0.26_amd64.deb`
- `dist/rds-viewer-3.0.26.x86_64.rpm`

---

### **5. Build macOS (DMG, ZIP)**
```bash
npm run build:mac
```

**Résultat:**
- `dist/RDS Viewer-3.0.26.dmg`
- `dist/RDS Viewer-3.0.26-mac.zip`

---

## ⚙️ Configuration Avancée

### **electron-builder.json**

Le fichier `electron-builder.json` contient toute la configuration de build:

```json
{
  "appId": "com.anecoop.rdsviewer",
  "productName": "RDS Viewer",
  "copyright": "Copyright © 2025 Anecoop",
  "compression": "maximum",
  "asar": true,
  "asarUnpack": [
    "node_modules/bcrypt/**/*",
    "node_modules/better-sqlite3/**/*",
    "node_modules/tesseract.js/**/*",
    "node_modules/natural/**/*",
    "node_modules/node-nlp/**/*",
    "backend/**/*",
    "server/**/*",
    "config/**/*",
    "data/**/*"
  ]
}
```

### **Modules natifs extraits (asarUnpack)**

Ces modules doivent être extraits du fichier ASAR car ils contiennent des binaires natifs:

- ✅ **bcrypt** - Chiffrement des mots de passe
- ✅ **better-sqlite3** - Base de données SQLite
- ✅ **tesseract.js** - OCR multi-langues
- ✅ **natural** - Traitement du langage naturel
- ✅ **node-nlp** - NLP avancé
- ✅ **pdf-parse** - Extraction de texte PDF
- ✅ **mammoth** - Conversion DOCX
- ✅ **backend/** - Services IA
- ✅ **server/** - Serveur Express
- ✅ **config/** - Fichiers de configuration
- ✅ **data/** - Base de données

---

## 🧪 Test de l'exe généré

### **Étape 1: Localiser l'exe**
```bash
cd dist
dir  # Windows
ls   # Linux/Mac
```

### **Étape 2: Tester le portable exe**
```bash
# Exécuter directement
./RDS\ Viewer-3.0.26-Portable.exe
```

### **Étape 3: Vérifier les fonctionnalités**

#### **✅ Checklist de test:**

1. **Démarrage de l'application**
   - [ ] L'exe se lance sans erreur
   - [ ] Le splash screen s'affiche (si configuré)
   - [ ] Le serveur backend démarre automatiquement (port 3002)

2. **Page de connexion**
   - [ ] La page de login s'affiche correctement
   - [ ] Les styles CSS sont chargés
   - [ ] Les icônes MUI s'affichent

3. **Après connexion - RDS Viewer**
   - [ ] Dashboard s'affiche avec les statistiques
   - [ ] Onglets de navigation visibles (Dashboard, Sessions, Users, etc.)
   - [ ] **Onglet AI Assistant (DocuCortex) visible**

4. **Fonctionnalités RDS**
   - [ ] Sessions RDS - Liste des sessions actives
   - [ ] Users Management - Gestion des utilisateurs avec virtualisation
   - [ ] Servers/Connections - Drag & drop des serveurs
   - [ ] AD Groups - Groupes Active Directory avec virtualisation
   - [ ] Computer Loans - Prêts d'ordinateurs avec Timeline

5. **AI Assistant - DocuCortex**
   - [ ] Chat interface s'affiche correctement
   - [ ] Message de bienvenue affiché
   - [ ] Envoi d'un message test: "Bonjour"
   - [ ] Réponse de l'IA (nécessite Ollama + Llama 3.2 3B)
   - [ ] Support Markdown dans les réponses
   - [ ] Suggestions cliquables affichées
   - [ ] Barre de confiance visible

6. **Recherche documentaire (si configuré)**
   - [ ] Accès au serveur réseau `\\192.168.1.230` (si disponible)
   - [ ] Recherche de documents fonctionne
   - [ ] Citations avec sources et scores
   - [ ] Attachments cliquables (Preview + Download)
   - [ ] Modal de prévisualisation (images, texte, PDF)
   - [ ] Bouton "Ouvrir dans l'Explorateur"

7. **OCR Multi-langues**
   - [ ] Upload d'une image avec du texte
   - [ ] Extraction automatique du texte (FR/EN/ES)
   - [ ] Copie du texte extrait

8. **GED Complète**
   - [ ] Upload de documents (PDF, DOCX, TXT)
   - [ ] Indexation automatique
   - [ ] Recherche dans les documents uploadés

---

## 🐛 Dépannage

### **Problème 1: "Module not found" après build**

**Cause:** Un module natif n'est pas extrait du fichier ASAR.

**Solution:**
Ajoutez le module dans `electron-builder.json` → `asarUnpack`:
```json
"asarUnpack": [
  "node_modules/votre-module/**/*"
]
```

---

### **Problème 2: "ENOENT: no such file" en production**

**Cause:** Les chemins de fichiers ne sont pas adaptés pour la production.

**Solution:**
Dans `electron/main.js`, utilisez:
```javascript
const isDev = require('electron-is-dev');

const filePath = isDev
  ? path.join(__dirname, '..', 'config', 'config.json')
  : path.join(path.dirname(app.getPath('exe')), 'config', 'config.json');
```

---

### **Problème 3: Build échoue avec "Cannot find module electron-builder"**

**Solution:**
```bash
npm install --save-dev electron-builder
```

---

### **Problème 4: Serveur backend ne démarre pas dans l'exe**

**Cause:** La variable d'environnement `RUNNING_IN_ELECTRON` n'est pas définie.

**Vérification:**
Dans `electron/main.js`, assurez-vous que:
```javascript
const serverProcess = fork(serverPath, [], {
  env: {
    ...process.env,
    RUNNING_IN_ELECTRON: 'true'
  }
});
```

---

### **Problème 5: "Maximum update depth exceeded" au démarrage**

**Cause:** Boucle infinie de navigation dans React Router.

**Solution:** ✅ **CORRIGÉ** - Le `currentTechnician` est maintenant correctement passé au `AppContext`.

---

## 📊 Optimisations de Performance

### **1. Réduire la taille de l'exe**

#### **Exclure les devDependencies**
Les devDependencies sont automatiquement exclus du build.

#### **Compression maximale**
Déjà configuré dans `electron-builder.json`:
```json
"compression": "maximum"
```

#### **Nettoyer node_modules avant build**
```bash
# Supprimer les fichiers inutiles
npm prune --production

# Réinstaller tout
npm install --legacy-peer-deps
```

---

### **2. Accélérer le démarrage**

#### **Lazy loading des pages**
Déjà implémenté dans `MainLayout.js`:
```javascript
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const SessionsPage = lazy(() => import('../pages/SessionsPage'));
```

#### **Cache centralisé**
Le `CacheContext` réduit les appels API redondants.

---

## 🔐 Signature de Code (Optionnel)

Pour la distribution publique, il est recommandé de signer le code.

### **Windows Code Signing**

1. **Obtenir un certificat**
   - Acheter un certificat code signing auprès d'une CA (DigiCert, Sectigo, etc.)

2. **Configurer electron-builder**
```json
"win": {
  "certificateFile": "path/to/cert.pfx",
  "certificatePassword": "your-password",
  "signingHashAlgorithms": ["sha256"],
  "sign": "custom-sign.js"
}
```

3. **Build signé**
```bash
npm run build:all
```

---

## 📝 Versions et Changelog

### **Version actuelle: 3.0.26**

**Nouvelles fonctionnalités:**
- ✅ AI Assistant DocuCortex intégré
- ✅ Recherche intelligente de documents réseau
- ✅ OCR multi-langues (FR/EN/ES)
- ✅ Chat avec Llama 3.2 3B (via Ollama)
- ✅ GED complète avec indexation automatique
- ✅ Preview documents (images, texte, PDF)
- ✅ Accès direct UNC aux fichiers réseau

**Corrections:**
- ✅ Fix navigation loop ("Maximum update depth exceeded")
- ✅ Fix compatibilité MUI v5 packages
- ✅ Fix date-fns v2 pour @mui/x-date-pickers
- ✅ Fix react-window API (FixedSizeList → List)
- ✅ Fix 39 modules npm manquants
- ✅ Fix AppContext export
- ✅ Fix intelligentResponseService.generateEnrichedResponse

---

## 🎉 Distribution

### **Portable Exe**
- ✅ Peut être distribué via:
  - Partage réseau (\\server\apps\)
  - Téléchargement web
  - Clé USB
  - Email (si < 25 MB - sinon utiliser un lien)

### **Installateur NSIS**
- ✅ Recommandé pour:
  - Déploiement sur postes de travail
  - Installation centralisée
  - Mises à jour automatiques

---

## 🆘 Support

En cas de problème lors du build ou de l'exécution:

1. **Vérifier les logs Electron**
   - Ouvrir DevTools dans l'exe (F12 ou Ctrl+Shift+I)
   - Console → Vérifier les erreurs JavaScript
   - Network → Vérifier les requêtes API

2. **Vérifier les logs backend**
   - Les logs sont dans `%USERPROFILE%\AppData\Roaming\RDS Viewer\logs\`
   - Fichier: `main.log`

3. **Nettoyer et rebuilder**
```bash
# Supprimer tout
rm -rf node_modules package-lock.json dist build

# Réinstaller
npm install --legacy-peer-deps

# Rebuilder
npm run build:portable
```

---

## ✅ Checklist finale avant distribution

- [ ] Tests complets effectués (voir section Test)
- [ ] Pas d'erreurs dans les logs Electron
- [ ] Serveur backend démarre correctement
- [ ] AI Assistant fonctionne (si Ollama configuré)
- [ ] Toutes les pages RDS Viewer accessibles
- [ ] Permissions utilisateurs fonctionnent
- [ ] Base de données SQLite se crée correctement
- [ ] Fichier de configuration `config.json` présent
- [ ] LICENSE file présent
- [ ] README.md à jour
- [ ] Version number correct dans package.json
- [ ] Code signé (si distribution publique)

---

**Date de création:** 2025-11-05
**Version du guide:** 1.0
**Auteur:** Claude AI Assistant
**Projet:** RDS Viewer avec DocuCortex AI

---

**🚀 Prêt pour la production !**
