# 🚀 Instructions de Build Final - RDS Viewer 3.1.0

**Date**: 26 novembre 2025
**Version**: 3.1.0 - DocuCortex AI v2.0 Complete Edition

---

## 📋 Prérequis

### Logiciels Requis
- ✅ **Node.js**: 16.x ou supérieur
- ✅ **npm**: 8.x ou supérieur
- ✅ **PowerShell**: 5.1 ou supérieur (pour calcul SHA512)
- ✅ **Git**: 2.x ou supérieur

### Vérification
```bash
node --version    # v16.x.x ou supérieur
npm --version     # 8.x.x ou supérieur
git --version     # 2.x.x ou supérieur
```

---

## 🔧 Étape 1: Préparation de l'Environnement

### 1.1 Installer les Dépendances
```bash
# Dans le dossier racine du projet
npm install
```

**Nouvelles dépendances Phase 3** (déjà ajoutées dans package.json):
- `chart.js`: ^4.4.1
- `react-chartjs-2`: ^5.2.0

### 1.2 Créer les Dossiers Temporaires
```bash
# PowerShell ou CMD
mkdir temp
mkdir temp\categorization
```

### 1.3 Vérifier la Configuration

**Fichiers importants à vérifier:**
- ✅ `package.json`: version 3.1.0
- ✅ `electron-builder-release.json`: publish.url correct
- ✅ `config/ai-config.json`: Gemini 2.0 configuré
- ✅ `.env.ai`: Clés API présentes (template créé)

---

## 🏗️ Étape 2: Build de l'Application React

### 2.1 Build Production
```bash
npm run build
```

**Ce que fait cette commande:**
- Compile tous les composants React
- Optimise les bundles (minification, tree-shaking)
- Génère les fichiers statiques dans `build/`
- Applique les optimisations de production

**Durée estimée**: 2-5 minutes

**Sortie attendue:**
```
Creating an optimized production build...
Compiled successfully.

File sizes after gzip:

  489.23 KB  build/static/js/main.abc123.js
  15.42 KB   build/static/css/main.def456.css

The build folder is ready to be deployed.
```

### 2.2 Vérification du Build React
```bash
# Vérifier que le dossier build existe
dir build

# Contenu attendu:
# - index.html
# - static/ (js, css, media)
# - manifest.json
# - robots.txt
```

---

## 📦 Étape 3: Build Electron (Portable)

### 3.1 Build avec Script Automatisé
```bash
npm run build:release
```

**Ce que fait cette commande:**
```json
"build:release": "cross-env NODE_ENV=production GENERATE_SOURCEMAP=false npm run build && electron-builder --config electron-builder-release.json --win portable --x64"
```

1. Set NODE_ENV=production
2. Désactive les source maps
3. Build React (optimisé)
4. Build Electron avec config release
5. Crée le portable .exe (x64)

**Durée estimée**: 5-10 minutes

### 3.2 Build Manuel (Alternative)
```bash
# Si le script ne fonctionne pas, exécuter manuellement:

# 1. Build React
cross-env NODE_ENV=production GENERATE_SOURCEMAP=false npm run build

# 2. Build Electron
npx electron-builder --config electron-builder-release.json --win portable --x64
```

### 3.3 Vérification du Build Electron
```bash
# Vérifier que le fichier .exe existe
dir dist

# Fichier attendu:
# RDS Viewer-3.1.0-Portable.exe
```

**Taille attendue**: ~150-250 MB (selon les dépendances)

---

## 🔐 Étape 4: Calcul du Hash SHA512

### 4.1 Méthode PowerShell (Recommandée)
```powershell
# PowerShell
cd dist
Get-FileHash -Path "RDS Viewer-3.1.0-Portable.exe" -Algorithm SHA512 | Select-Object Hash | Format-List

# Sortie:
# Hash : ABC123DEF456...
```

### 4.2 Méthode Node.js (Alternative)
```javascript
// sha512.js
const crypto = require('crypto');
const fs = require('fs');

const filePath = 'dist/RDS Viewer-3.1.0-Portable.exe';
const hash = crypto.createHash('sha512');
const fileBuffer = fs.readFileSync(filePath);

hash.update(fileBuffer);
const sha512 = hash.digest('base64');

console.log('SHA512 (Base64):', sha512);
console.log('Taille:', fs.statSync(filePath).size, 'bytes');
```

Exécution:
```bash
node sha512.js
```

### 4.3 Méthode certUtil (Windows)
```cmd
certUtil -hashfile "dist\RDS Viewer-3.1.0-Portable.exe" SHA512
```

---

## 📝 Étape 5: Mise à Jour de latest.yml

### 5.1 Localiser le Fichier
```bash
# Le fichier doit être dans le dossier racine
dir latest.yml
```

### 5.2 Mettre à Jour avec les Valeurs Calculées
```yaml
version: 3.1.0
files:
  - url: RDS Viewer-3.1.0-Portable.exe
    sha512: <COLLER_ICI_LE_SHA512_CALCULÉ_EN_BASE64>
    size: <COLLER_ICI_LA_TAILLE_EN_BYTES>
path: RDS Viewer-3.1.0-Portable.exe
releaseDate: '2025-11-26T12:00:00.000Z'
releaseNotes: |
  🚀 RDS Viewer v3.1.0 - DocuCortex AI v2.0 Complete Edition

  ✅ Phase 3 - Nouvelles Fonctionnalités:
  • Smart Search with Advanced Filters (10+ critères)
  • Document Auto-Categorization avec Gemini Vision
  • Advanced Analytics Dashboard (4 graphiques interactifs)
  • Drag & Drop Upload avec preview et progression

  ✅ Phase 2:
  • Configuration réseau des mises à jour
  • Sélection automatique des modèles Gemini

  ✅ Phase 1:
  • Intent Classification 95%+ précision
  • Gemini 2.0 Flash Experimental (1M tokens)
  • JSON Mode + System Instructions + Function Calling
  • Structured Responses avec 7 schemas
  • Multi-provider avec fallback
```

**Exemple complet:**
```yaml
version: 3.1.0
files:
  - url: RDS Viewer-3.1.0-Portable.exe
    sha512: iOKx9Kw8DlSh6qK9bH2XJ8vN5mP3rT7yU9iO0pL4kJ8hG6fD5sA3qW2eR1tY0uI9oP8lK7jH6gF5dS4aQ3wE2rT1y=
    size: 187654321
path: RDS Viewer-3.1.0-Portable.exe
releaseDate: '2025-11-26T12:00:00.000Z'
releaseNotes: |
  🚀 RDS Viewer v3.1.0 - DocuCortex AI v2.0 Complete Edition
  ...
```

### 5.3 Copier latest.yml vers dist/
```bash
copy latest.yml dist\latest.yml
```

---

## 🌐 Étape 6: Déploiement sur le Réseau

### 6.1 Vérifier l'Accès au Réseau
```powershell
# Tester l'accès au dossier réseau
Test-Path "\\192.168.1.230\donnees\Informatique\PROGRAMMES\Programme RDS\RDS Viewer Group\update"

# Résultat attendu: True
```

### 6.2 Copier les Fichiers
```powershell
# PowerShell
$source = "dist\"
$destination = "\\192.168.1.230\donnees\Informatique\PROGRAMMES\Programme RDS\RDS Viewer Group\update\"

# Copier le .exe
Copy-Item "$source\RDS Viewer-3.1.0-Portable.exe" $destination -Force -Verbose

# Copier latest.yml
Copy-Item "$source\latest.yml" $destination -Force -Verbose

# Vérification
Get-ChildItem $destination
```

### 6.3 Alternative CMD
```cmd
REM CMD
copy /Y "dist\RDS Viewer-3.1.0-Portable.exe" "\\192.168.1.230\donnees\Informatique\PROGRAMMES\Programme RDS\RDS Viewer Group\update\"
copy /Y "dist\latest.yml" "\\192.168.1.230\donnees\Informatique\PROGRAMMES\Programme RDS\RDS Viewer Group\update\"
```

### 6.4 Vérification Post-Déploiement
```powershell
# Vérifier que les fichiers sont bien sur le réseau
$networkPath = "\\192.168.1.230\donnees\Informatique\PROGRAMMES\Programme RDS\RDS Viewer Group\update\"

# Vérifier le .exe
if (Test-Path "$networkPath\RDS Viewer-3.1.0-Portable.exe") {
    Write-Host "✅ .exe déployé avec succès"
    Get-Item "$networkPath\RDS Viewer-3.1.0-Portable.exe" | Select-Object Name, Length, LastWriteTime
} else {
    Write-Host "❌ .exe non trouvé"
}

# Vérifier latest.yml
if (Test-Path "$networkPath\latest.yml") {
    Write-Host "✅ latest.yml déployé avec succès"
    Get-Content "$networkPath\latest.yml"
} else {
    Write-Host "❌ latest.yml non trouvé"
}
```

---

## 🧪 Étape 7: Tests Post-Build

### 7.1 Test Local de l'Exécutable
```bash
# Exécuter le portable .exe
cd dist
.\RDS Viewer-3.1.0-Portable.exe
```

**Tests à effectuer:**
1. ✅ L'application démarre sans erreur
2. ✅ Le serveur backend démarre (port 3002)
3. ✅ WebSocket connecté (port 3003)
4. ✅ Interface React chargée
5. ✅ Dashboard visible avec widgets
6. ✅ DocuCortex AI répond aux requêtes
7. ✅ Nouvelles fonctionnalités Phase 3 accessibles:
   - Advanced Search (filtres)
   - Auto-Categorization (test upload)
   - Analytics Dashboard (graphiques)
   - Drag & Drop Upload (zone de drop)

### 7.2 Test de Mise à Jour Automatique
```bash
# 1. Lancer une version antérieure (ex: 3.0.26)
# 2. L'application devrait détecter la v3.1.0 sur le réseau
# 3. Notification de mise à jour disponible
# 4. Cliquer "Télécharger et installer"
# 5. Vérifier que la v3.1.0 se télécharge et s'installe
```

### 7.3 Test des Endpoints Phase 3
```bash
# Vérifier que le serveur est lancé
curl http://localhost:3002/api/health

# Test Advanced Search
curl -X POST http://localhost:3002/api/ai/advanced-search \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"test\",\"filters\":{\"category\":\"Factures\"}}"

# Test Analytics
curl http://localhost:3002/api/ai/analytics/documents?timeRange=30d

# Test Categorization (nécessite un fichier)
curl -X POST http://localhost:3002/api/ai/categorize/text \
  -H "Content-Type: application/json" \
  -d "{\"content\":\"Facture N° 2025-001\",\"filename\":\"test.txt\"}"
```

---

## 📊 Checklist de Validation

### Avant Build
- [ ] Toutes les dépendances installées (`npm install`)
- [ ] Version 3.1.0 dans package.json
- [ ] electron-builder-release.json configuré
- [ ] .env.ai avec clés API
- [ ] Dossiers temp/ créés

### Après Build React
- [ ] Dossier `build/` créé
- [ ] `build/index.html` existe
- [ ] `build/static/` contient js et css
- [ ] Pas d'erreurs dans la console

### Après Build Electron
- [ ] Fichier `RDS Viewer-3.1.0-Portable.exe` créé dans `dist/`
- [ ] Taille du .exe raisonnable (150-250 MB)
- [ ] SHA512 calculé et sauvegardé
- [ ] Taille en bytes notée

### Après Mise à Jour latest.yml
- [ ] `latest.yml` mis à jour avec SHA512
- [ ] Taille correcte
- [ ] Version 3.1.0
- [ ] Release notes à jour
- [ ] Copié dans `dist/`

### Après Déploiement Réseau
- [ ] .exe copié sur \\192.168.1.230\...\update\
- [ ] latest.yml copié sur \\192.168.1.230\...\update\
- [ ] Fichiers accessibles depuis le réseau
- [ ] Dates de modification récentes

### Après Tests
- [ ] Application démarre sans erreur
- [ ] Backend opérationnel (port 3002)
- [ ] WebSocket connecté (port 3003)
- [ ] Dashboard affiche les données
- [ ] DocuCortex répond correctement
- [ ] Advanced Search fonctionnel
- [ ] Auto-Categorization opérationnel
- [ ] Analytics Dashboard affiche graphiques
- [ ] Drag & Drop Upload fonctionne
- [ ] Mise à jour automatique détecte la v3.1.0

---

## 🐛 Dépannage

### Erreur: npm ERR! code ELIFECYCLE
**Solution**: Supprimer `node_modules/` et réinstaller
```bash
rimraf node_modules
npm install
```

### Erreur: electron-builder not found
**Solution**: Installer electron-builder en global
```bash
npm install -g electron-builder
```

### Erreur: Accès réseau refusé
**Solution**: Vérifier les permissions
```powershell
# Tester les permissions
Test-Path "\\192.168.1.230\donnees\Informatique\PROGRAMMES\Programme RDS\RDS Viewer Group\update" -IsValid
```

### Erreur: SHA512 invalide
**Solution**: Recalculer avec PowerShell
```powershell
Get-FileHash -Path "dist\RDS Viewer-3.1.0-Portable.exe" -Algorithm SHA512 | Select-Object Hash
```

### Erreur: Build React échoue
**Solution**: Vérifier les erreurs de compilation
```bash
# Build avec logs détaillés
npm run build -- --verbose
```

### Erreur: Application ne démarre pas
**Solution**: Vérifier les logs
```bash
# Logs Electron
type %APPDATA%\rds-viewer\logs\main.log

# Logs Backend
type logs\backend.log
```

---

## 📚 Références

### Fichiers de Configuration
- `package.json`: Dépendances et scripts
- `electron-builder-release.json`: Configuration Electron Builder
- `latest.yml`: Métadonnées de mise à jour
- `config/ai-config.json`: Configuration IA
- `.env.ai`: Clés API (template)

### Scripts Utiles
- `npm run build`: Build React production
- `npm run build:release`: Build complet (React + Electron)
- `npm run build:portable`: Build portable seulement
- `npm run server:start`: Démarrer backend seul
- `npm run dev`: Mode développement

### Liens Utiles
- [Electron Builder Docs](https://www.electron.build/)
- [electron-updater Docs](https://www.electron.build/auto-update)
- [React Build Docs](https://create-react-app.dev/docs/production-build/)

---

## 🎉 Résultat Final

### Fichiers Générés

**Localement (`dist/`):**
- `RDS Viewer-3.1.0-Portable.exe` (150-250 MB)
- `latest.yml` (mise à jour)
- `builder-effective-config.yaml` (config utilisée)
- `win-unpacked/` (version décompressée)

**Sur le Réseau:**
- `\\192.168.1.230\...\update\RDS Viewer-3.1.0-Portable.exe`
- `\\192.168.1.230\...\update\latest.yml`

### Commande Rapide Complète
```bash
# Build complet en une commande
npm install && npm run build:release && echo "Build terminé!"

# Calcul SHA512 et copie réseau (PowerShell)
$exe = "dist\RDS Viewer-3.1.0-Portable.exe"
$hash = (Get-FileHash $exe -Algorithm SHA512).Hash
$size = (Get-Item $exe).Length
Write-Host "SHA512: $hash"
Write-Host "Taille: $size bytes"

# Mettre à jour latest.yml manuellement puis:
copy latest.yml dist\latest.yml
copy "$exe" "\\192.168.1.230\donnees\Informatique\PROGRAMMES\Programme RDS\RDS Viewer Group\update\"
copy "dist\latest.yml" "\\192.168.1.230\donnees\Informatique\PROGRAMMES\Programme RDS\RDS Viewer Group\update\"

Write-Host "✅ Déploiement terminé!"
```

---

**Version**: 3.1.0 - DocuCortex AI v2.0 Complete Edition
**Date**: 26 novembre 2025
**Statut**: ✅ Prêt pour Production
