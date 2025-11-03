# Guide d'Installation Complet - DocuCortex IA

## 📋 Prérequis

- **Node.js** version 18.x ou 20.x (LTS recommandée)
  - Télécharger : https://nodejs.org
  - Vérifier : `node --version`

- **npm** version 9.x ou supérieure (inclus avec Node.js)
  - Vérifier : `npm --version`

- **Git** (pour le clonage du dépôt)
  - Télécharger : https://git-scm.com

## 🚀 Installation Rapide

### Windows

1. **Cloner le dépôt**
   ```cmd
   git clone <URL_DU_DEPOT>
   cd rdp
   ```

2. **Lancer le script d'installation**
   ```cmd
   install-clean.bat
   ```

3. **Si des problèmes persistent**, réinstaller proprement :
   ```cmd
   install-clean.bat --clean
   ```

### Linux / macOS

1. **Cloner le dépôt**
   ```bash
   git clone <URL_DU_DEPOT>
   cd rdp
   ```

2. **Lancer le script d'installation**
   ```bash
   ./install-clean.sh
   ```

3. **Si des problèmes persistent**, réinstaller proprement :
   ```bash
   ./install-clean.sh --clean
   ```

## 📦 Installation Manuelle

Si les scripts automatiques ne fonctionnent pas :

```bash
# 1. Nettoyer (optionnel)
rm -rf node_modules package-lock.json build dist

# 2. Installer sans scripts de build
npm install --ignore-scripts

# 3. Compiler uniquement les dépendances nécessaires
npm rebuild better-sqlite3

# 4. Vérifier l'installation
npm run build
```

## 🏗️ Compilation du Projet

### Mode Développement

```bash
# Lancer le serveur + React en développement
npm run dev
```

L'application sera disponible sur :
- Frontend : http://localhost:3000
- Backend : http://localhost:3002

### Build de Production

```bash
# Compiler l'application React
npm run build
```

Le résultat sera dans le dossier `build/`

### Créer l'Exécutable Portable

```bash
# Créer un .exe portable Windows
npm run build:exe
```

L'exécutable sera dans le dossier `dist/` :
- `DocuCortex-IA-3.0.26-portable.exe`

## 🔧 Configuration

1. **Copier le fichier de configuration**
   ```bash
   cp config/config.template.json config/config.json
   ```

2. **Éditer `config/config.json`** avec vos paramètres :
   - Chemins de base de données
   - Identifiants Active Directory
   - URL de mise à jour
   - etc.

## 🐛 Résolution des Problèmes

### Problème : Conflits de merge Git

**Symptôme** : `npm install` échoue avec "Merge conflict detected"

**Solution** :
```bash
node resolve-conflicts.js
npm install --ignore-scripts
```

### Problème : Erreur avec `better-sqlite3`

**Symptôme** : Erreur lors de l'exécution du serveur

**Solution** :
```bash
npm rebuild better-sqlite3
```

### Problème : Erreur `gl` ou dépendances natives X11

**Symptôme** : Échec de compilation avec des erreurs sur `gl`, `x11`, `xi`, etc.

**Solution** : Ces dépendances sont optionnelles et ignorées automatiquement par le script d'installation

### Problème : Module non trouvé

**Symptôme** : `Module not found: Error: Can't resolve 'xxx'`

**Solution** :
```bash
npm install --save xxx
npm run build
```

## 📝 Scripts Disponibles

| Script | Description |
|--------|-------------|
| `npm start` | Lance React en mode développement |
| `npm run start:auto` | Lance React avec auto-redémarrage |
| `npm run server:start` | Lance le serveur backend |
| `npm run server:dev` | Lance le serveur avec nodemon |
| `npm run dev` | Lance serveur + React ensemble |
| `npm run dev:electron` | Lance l'application Electron |
| `npm run build` | Compile le projet pour production |
| `npm run build:exe` | Crée l'exécutable portable |
| `npm run clean` | Nettoie les fichiers temporaires |
| `npm run check:deps` | Vérifie les dépendances natives |

## 🎯 Structure du Projet

```
rdp/
├── assets/              # Ressources (icônes, etc.)
├── backend/             # Services Python (optionnel)
├── build/               # Application React compilée
├── config/              # Fichiers de configuration
├── dist/                # Exécutables générés
├── electron/            # Application Electron
│   ├── main.js         # Processus principal
│   └── preload.js      # Script preload
├── public/              # Ressources publiques
├── scripts/             # Scripts utilitaires
├── server/              # Serveur Node.js backend
│   ├── server.js       # Serveur Express
│   ├── apiRoutes.js    # Routes API
│   └── aiRoutes.js     # Routes IA
├── src/                 # Code source React
│   ├── components/     # Composants réutilisables
│   ├── pages/          # Pages de l'application
│   ├── services/       # Services API
│   ├── contexts/       # Contextes React
│   └── utils/          # Fonctions utilitaires
└── tests/               # Tests

```

## 🔐 Sécurité

- **Ne jamais commiter** `config/config.json` (contient des identifiants)
- Utiliser `config/config.template.json` comme modèle
- Les mots de passe doivent être sécurisés

## 📚 Documentation

- [README.md](./README.md) - Vue d'ensemble
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Guide de dépannage
- [NPM-COMMANDS.md](./NPM-COMMANDS.md) - Commandes npm détaillées

## 🆘 Support

En cas de problème :
1. Consulter ce guide
2. Vérifier les logs dans la console
3. Consulter les fichiers de documentation
4. Contacter l'équipe de développement

---

Dernière mise à jour : 2025-11-03
Version : 3.0.26
