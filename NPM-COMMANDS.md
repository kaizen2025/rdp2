# 🚀 RDS VIEWER - COMMANDES NPM

## 📋 Commandes Disponibles

### 🧪 **Tester l'Application**

#### Test Complet avec Allocation Automatique des Ports (Recommandé)
```bash
npm run test:app
```
**Description** : Lance le serveur Node.js ET l'interface React simultanément avec **allocation automatique des ports**.
- 🔵 **SERVER** : Serveur backend (ports 3002-3012, premier disponible)
- 🟣 **REACT** : Interface utilisateur (ports 3000-3010, premier disponible)

**✨ Nouveauté - Gestion Automatique des Ports** :
- ✅ **Détection automatique** : Si un port est occupé, le suivant est testé
- ✅ **Pas de conflit** : Plus besoin de tuer les processus manuellement
- ✅ **Configuration auto** : React se configure automatiquement pour le bon serveur
- ✅ **Logs clairs** : Affichage des ports utilisés au démarrage

**Utilisation** :
- Cette commande lance tout ce dont vous avez besoin pour tester l'app
- Le serveur alloue automatiquement les ports disponibles
- L'interface React attend le serveur puis se configure automatiquement
- Les deux processus tournent en parallèle avec leur port respectif

**Exemple de sortie** :
```
🔧 Allocation automatique des ports...
   Plage testée : 3002-3012
✅ Port 3002 disponible pour HTTP Server
   Plage testée : 3003-3013
✅ Port 3003 disponible pour WebSocket

⏳ Attente du démarrage du serveur backend...
✅ Serveur backend détecté

📖 Configuration des ports lue:
   • Serveur HTTP  : 3002
   • WebSocket     : 3003

🔍 Recherche d'un port disponible pour React...
✅ Port React: 3000

📝 Configuration de .env.local...
✅ .env.local créé avec succès
   React sera sur: http://localhost:3000
   API sera sur  : http://localhost:3002
   WebSocket sur : ws://localhost:3003
```

#### Test Simple (Sans Couleurs)
```bash
npm run test:app:simple
```
**Description** : Même fonctionnement que `test:app` mais sans les couleurs dans les logs (utile pour certains terminaux).

---

### 🏗️ **Build & Génération d'Exécutable**

#### Build Complet + EXE Portable
```bash
npm run build:exe
```
**Description** : Génère l'exécutable Windows portable en une seule commande.

**Ce qui se passe** :
1. ✅ Build de production React (optimisé et minifié)
2. ✅ Génération de l'exécutable portable avec Electron Builder
3. ✅ Création du fichier `.exe` dans le dossier `dist/`

**Fichier généré** :
```
dist/RDS Viewer Anecoop-3.0.0-portable.exe
```

#### Build Rapide (Sans Nettoyer)
```bash
npm run build:quick
```
**Description** : Build rapide sans nettoyer les fichiers précédents (plus rapide pour les tests).

---

### 🔧 **Maintenance & Dépannage**

#### Vérifier les Dépendances Natives
```bash
npm run check:deps
```
**Description** : Vérifie et recompile automatiquement `better-sqlite3` si nécessaire.

**✨ Ce que fait cette commande** :
1. 🔍 Teste si better-sqlite3 fonctionne
2. 📋 Affiche les informations système (Node.js, plateforme, ABI)
3. 🔨 Recompile automatiquement si incompatible
4. ✅ Valide que tout fonctionne après rebuild

**Quand l'utiliser** :
- ❌ Erreur `NODE_MODULE_VERSION` au démarrage
- 🔄 Après changement de version de Node.js
- 📦 Après un `npm install` sur une nouvelle machine
- 🆕 Après un `git pull` avec modifications de dépendances

**Exemple de sortie** :
```
🔍 Vérification des dépendances natives...

📋 Informations système:
   • Node.js version     : v20.10.0
   • Plateforme          : win32
   • Architecture        : x64
   • Module version (ABI): 127

📦 Test de better-sqlite3...
❌ better-sqlite3 ne fonctionne pas correctement
   Erreur: was compiled against NODE_MODULE_VERSION 130

⚠️  better-sqlite3 doit être recompilé pour votre version de Node.js

🔨 Rebuild de better-sqlite3 en cours...
   (Cela peut prendre 30-60 secondes)

✅ better-sqlite3 recompilé avec succès
✅ better-sqlite3 fonctionne maintenant correctement!
```

#### Rebuild Manuel des Modules Natifs
```bash
npm run rebuild:native
```
**Description** : Recompile manuellement better-sqlite3 (utilisé automatiquement par postinstall).

#### Démarrage Direct du Serveur (Sans Vérification)
```bash
npm run server:start:direct
```
**Description** : Lance le serveur sans vérification des dépendances (utile pour debug).

⚠️ **Attention** : Cette commande ne vérifie PAS better-sqlite3. Utilisez `server:start` normalement.

---

### 🔨 **Développement**

#### Développement Complet
```bash
npm run dev
```
**Description** : Lance le mode développement avec hot-reload.
- Backend avec **nodemon** (redémarrage automatique)
- Frontend React avec **react-scripts** (hot-reload)

#### Backend Seul (Développement)
```bash
npm run server:dev
```
**Description** : Lance uniquement le serveur backend avec nodemon.

#### Backend Seul (Production)
```bash
npm run server:start
```
**Description** : Lance uniquement le serveur backend sans nodemon (mode production).

#### Frontend Seul
```bash
npm start
```
**Description** : Lance uniquement l'interface React (nécessite le serveur lancé séparément).

---

### ⚡ **Electron**

#### Développement Electron
```bash
npm run electron:dev
```
**Description** : Lance l'application Electron en mode développement (nécessite un build préalable).

**Note** : Assurez-vous d'avoir fait `npm run build` avant.

---

### 🧹 **Nettoyage**

#### Nettoyer les Builds
```bash
npm run clean
```
**Description** : Supprime les dossiers de build, cache et fichiers générés.

**Fichiers/dossiers supprimés** :
- `build/` : Build de production React
- `dist/` : Exécutables Electron générés
- `node_modules/.cache` : Cache de compilation
- `.ports.json` : Configuration des ports (régénéré au démarrage)
- `.env.local` : Variables d'environnement React (régénéré au démarrage)
- `.rebuild-done` : Marqueur de rebuild (régénéré si nécessaire)

---

## 🎯 Scénarios d'Utilisation

### Cas 1: Je veux tester rapidement l'application
```bash
npm run test:app
```
✅ Tout démarre en une commande !

### Cas 2: Je développe activement et j'ai besoin du hot-reload
```bash
npm run dev
```
✅ Modifications visibles instantanément !

### Cas 3: Je veux générer un .exe pour déployer
```bash
npm run build:exe
```
✅ Exécutable prêt dans `dist/` !

### Cas 4: Je veux seulement tester le backend
```bash
npm run server:dev
```
✅ Serveur avec redémarrage automatique !

### Cas 5: Problèmes de cache ? Nettoyer et recommencer
```bash
npm run clean
npm install
npm run test:app
```
✅ Tout est propre et redémarre !

---

## 📊 Comparaison des Commandes

| Commande | Serveur | Frontend | Build | Electron | Hot-Reload | Utilisation |
|----------|---------|----------|-------|----------|------------|-------------|
| `test:app` | ✅ | ✅ | ❌ | ❌ | ❌ | Test rapide |
| `dev` | ✅ | ✅ | ❌ | ❌ | ✅ | Développement |
| `build:exe` | ❌ | ✅ | ✅ | ✅ | ❌ | Déploiement |
| `electron:dev` | ❌ | ❌ | ❌ | ✅ | ❌ | Test Electron |
| `server:dev` | ✅ | ❌ | ❌ | ❌ | ✅ | Backend seul |
| `start` | ❌ | ✅ | ❌ | ❌ | ✅ | Frontend seul |

---

## 🔧 Configuration Build

### Fichier de Sortie
L'exécutable est généré dans :
```
dist/RDS Viewer Anecoop-3.0.0-portable.exe
```

### Taille Approximative
- **Build React** : ~2 MB (compressé)
- **Exécutable Portable** : ~200 MB (inclut Node.js + Electron)

### Architecture
- **Cible** : Windows x64
- **Type** : Portable (pas d'installation requise)

---

## 🚨 Dépannage

### Problème: Le serveur ne démarre pas
**Solution** :
```bash
# Vérifier si le port 3002 est libre
netstat -ano | findstr :3002

# Ou redémarrer avec clean
npm run clean
npm install
npm run test:app
```

### Problème: Build échoue
**Solution** :
```bash
# Nettoyer et réinstaller
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build:exe
```

### Problème: L'exe ne se lance pas
**Solution** :
1. Vérifier que `config/config.json` existe
2. Vérifier les chemins de base de données dans la config
3. Lancer l'exe en mode administrateur si nécessaire

---

## 📝 Notes Importantes

### Environnement de Développement
- **Node.js** : Version 16+ recommandée
- **npm** : Version 7+ recommandée
- **OS** : Windows 10/11 pour le build d'exe

### Ports Utilisés
- **3000** : Interface React (développement)
- **3002** : Serveur API Node.js
- **3003** : WebSocket (chat temps réel)

### Auto-Update
L'application vérifie automatiquement les mises à jour sur :
```
http://192.168.1.232/update/
```

Configuration dans `config/config.json` :
```json
{
  "updateUrl": "http://192.168.1.232/update/"
}
```

---

## 🎨 Nouvelles Fonctionnalités

### Interface Modernisée
- ✨ Nouveau système de thème moderne
- 📊 Composants UI réutilisables (StatCard, PageHeader, etc.)
- 🎭 Skeleton screens pour meilleur chargement
- 🔍 Recherche optimisée avec debounce
- 📱 Design responsive amélioré

### Dashboard Amélioré
- 📈 Cards statistiques modernes avec gradients
- 🎨 Header avec gradient coloré
- ⚡ LoadingScreen élégant
- 🎯 Tooltips informatifs

---

## 📚 Ressources

### Documentation Complète
Voir `IMPROVEMENTS.md` pour :
- Guide complet des composants
- Exemples d'utilisation
- Conventions de design
- Roadmap des améliorations

### Support
- **Issues** : Créer une issue GitHub
- **Configuration** : Voir `config/config.template.json`
- **Logs** : Consultez `electron.log` (dans le dossier de l'exe)

---

**Version** : 3.0.0
**Dernière mise à jour** : 28 Octobre 2025
**Auteur** : Anecoop IT Team

🚀 Happy Coding! 🎉
