# 🔧 Guide de Dépannage - RDS Viewer

## 📋 Table des Matières

- [Problème: better-sqlite3](#problème-better-sqlite3)
- [Problème: Ports occupés](#problème-ports-occupés)
- [Problème: Warnings ESLint](#problème-warnings-eslint)
- [Problème: Serveur ne démarre pas](#problème-serveur-ne-démarre-pas)
- [Solutions Rapides](#solutions-rapides)

---

## Problème: better-sqlite3

### Symptôme
```
❌ Error: The module 'better_sqlite3.node' was compiled against a different Node.js version
   using NODE_MODULE_VERSION 130. This version requires NODE_MODULE_VERSION 127.
```

### Cause
Le module natif `better-sqlite3` a été compilé pour une version différente de Node.js.

### ✅ Solution Automatique (Recommandée)

Le système vérifie et recompile automatiquement better-sqlite3 au démarrage:

```bash
npm run test:app
```

Le script `check-dependencies.js` s'exécute automatiquement et:
1. ✅ Détecte si better-sqlite3 fonctionne
2. 🔨 Recompile automatiquement si nécessaire
3. ✅ Vérifie que tout fonctionne après rebuild

### 🛠️ Solutions Manuelles

#### Option 1: Rebuild Simple
```bash
npm rebuild better-sqlite3
```

#### Option 2: Tester les Dépendances
```bash
npm run check:deps
```

#### Option 3: Réinstallation Complète
```bash
npm uninstall better-sqlite3
npm install better-sqlite3
```

#### Option 4: Nettoyage Complet
```bash
# Windows (PowerShell en tant qu'administrateur)
Remove-Item -Recurse -Force node_modules
npm install

# OU avec la commande clean
npm run clean
Remove-Item -Recurse -Force node_modules
npm install
```

### 📋 Vérification Post-Fix

```bash
# Tester better-sqlite3
npm run check:deps

# Si OK, démarrer l'application
npm run test:app
```

### 🔍 Informations Système

Le script de vérification affiche automatiquement:
- Version de Node.js (ex: v20.10.0)
- Plateforme (win32, linux, darwin)
- Architecture (x64, arm64)
- ABI Version (127 pour Node v20, 130 pour Node v22)

---

## Problème: Ports occupés

### Symptôme
```
Error: listen EADDRINUSE: address already in use :::3000
```

### ✅ Solution Automatique

Le système de gestion automatique des ports trouve automatiquement un port disponible:

```bash
npm run test:app
```

Plages de ports testées:
- React: 3000-3010
- HTTP Server: 3002-3012
- WebSocket: 3003-3013

### 🛠️ Solution Manuelle

#### Windows
```bash
# Trouver le processus sur le port 3000
netstat -ano | findstr :3000

# Tuer le processus (remplacer PID par le numéro trouvé)
taskkill /PID <PID> /F

# Ou tuer tous les processus Node.js
taskkill /IM node.exe /F
```

#### Linux/Mac
```bash
# Trouver et tuer le processus
lsof -ti:3000 | xargs kill -9
```

---

## Problème: Warnings ESLint

### Symptôme
```
[eslint]
src\pages\UsersManagementPage.js
  Line 3:66:   'useRef' is defined but never used    no-unused-vars
```

### ✅ Solution

Les imports inutilisés ont été automatiquement nettoyés dans la dernière version.

Si vous voyez encore des warnings après un `git pull`:

```bash
# Nettoyer le cache
npm run clean

# Redémarrer
npm run test:app
```

### Désactiver ESLint (Non Recommandé)

Si vous voulez désactiver temporairement ESLint:

Créer `.env.local`:
```env
DISABLE_ESLINT_PLUGIN=true
```

---

## Problème: Erreur CORS - L'application ne s'ouvre pas

### Symptôme
```
[SERVER] Origine non autorisée par CORS: http://127.0.0.1:3000
[SERVER] Error: Not allowed by CORS
```

L'application compile avec succès mais ne charge pas les données. La console affiche des erreurs CORS.

### Cause
React accède parfois au backend via `http://127.0.0.1:3000` au lieu de `http://localhost:3000`. Bien que ces deux adresses pointent vers la même machine, elles sont considérées comme des **origines différentes** par la politique de sécurité CORS des navigateurs.

### ✅ Solution

La configuration CORS dans `server/server.js` inclut maintenant les deux variantes :

```javascript
function getAllowedOrigins() {
  return [
    // Origines localhost
    'http://localhost:3000',
    'http://localhost:3001',
    // ... 3002-3010

    // Origines 127.0.0.1
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    // ... 3002-3010
  ];
}
```

Si le problème persiste après un `git pull` :

```bash
# 1. Tuer les processus Node.js
taskkill /IM node.exe /F

# 2. Nettoyer
npm run clean

# 3. Redémarrer
npm run test:app
```

### 📋 Vérification

Vérifier dans la console que le serveur accepte bien les deux origines :
- ✅ `http://localhost:3000` (variante standard)
- ✅ `http://127.0.0.1:3000` (variante IP numérique)

---

## Problème: Serveur ne démarre pas

### Symptôme 1: Configuration Invalide
```
❌ Démarrage interrompu en raison d'une configuration invalide
```

**Solution**:
1. Vérifier `config/config.json`
2. S'assurer que tous les chemins existent
3. Vérifier les informations Active Directory

### Symptôme 2: Base de Données
```
❌ Erreur de connexion à la base de données SQLite
```

**Solutions**:
1. Vérifier que better-sqlite3 fonctionne: `npm run check:deps`
2. Vérifier les permissions du dossier de données
3. Vérifier que le chemin dans config.json existe

### Symptôme 3: Ports Occupés
Voir section [Ports occupés](#problème-ports-occupés)

---

## Solutions Rapides

### 🚨 Solution Universelle

```bash
# 1. Tuer tous les processus Node.js
taskkill /IM node.exe /F

# 2. Nettoyer
npm run clean

# 3. Vérifier les dépendances
npm run check:deps

# 4. Redémarrer
npm run test:app
```

### 🔄 Réinitialisation Complète

```bash
# 1. Tuer Node.js
taskkill /IM node.exe /F

# 2. Supprimer node_modules
Remove-Item -Recurse -Force node_modules

# 3. Nettoyer
npm run clean

# 4. Réinstaller
npm install

# 5. Démarrer
npm run test:app
```

### 📊 Vérification de l'État

```bash
# Vérifier Node.js
node --version

# Vérifier npm
npm --version

# Vérifier les dépendances natives
npm run check:deps

# Vérifier les ports
netstat -ano | findstr "3000 3002 3003"
```

---

## 🆘 Support Avancé

### Logs de Debug

#### Activer les logs détaillés pour React
```bash
# .env.local
REACT_APP_DEBUG=true
```

#### Logs du serveur
Le serveur affiche déjà des logs détaillés. Pour plus d'infos:
```bash
# Démarrer le serveur seul
npm run server:start:direct
```

### Informations à Fournir en Cas de Problème

1. **Version de Node.js**: `node --version`
2. **Système d'exploitation**: Windows 10/11, version
3. **Message d'erreur complet**: Copier toute la sortie console
4. **Sortie de**: `npm run check:deps`
5. **Ports occupés**: `netstat -ano | findstr "3000 3002 3003"`

### Fichiers de Configuration

Vérifier ces fichiers:
- ✅ `config/config.json` : Configuration principale
- ✅ `.ports.json` : Ports alloués (généré automatiquement)
- ✅ `.env.local` : Variables d'environnement React (généré automatiquement)
- ✅ `.rebuild-done` : Marqueur de rebuild (généré automatiquement)

### Commandes de Diagnostic

```bash
# Tester les dépendances
npm run check:deps

# Voir les infos système
node -p "process.version, process.platform, process.arch"

# Vérifier better-sqlite3
node -e "console.log(require('better-sqlite3'))"

# Lister les processus Node.js
tasklist | findstr "node.exe"
```

---

## 📚 Documentation Complémentaire

- **[NPM-COMMANDS.md](NPM-COMMANDS.md)** : Liste complète des commandes
- **[PORT-MANAGEMENT.md](PORT-MANAGEMENT.md)** : Système de gestion des ports
- **[IMPROVEMENTS.md](IMPROVEMENTS.md)** : Guide des améliorations UI

---

**Dernière mise à jour**: 28 octobre 2025
**Version**: 3.0.0
**Auteur**: Anecoop IT Team avec Claude Code
