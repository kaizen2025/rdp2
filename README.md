# DocuCortex IA - Gestionnaire Intelligent avec Intelligence Artificielle

## Version 3.0.31 - Application Electron Complète

### 🚀 Lancement Rapide

Pour lancer l'application complète DocuCortex IA :

```bash
npm run dev
```

Ou pour une version standalone :

```bash
npm run electron-app
```

### 📋 Fonctionnalités

- **Éditeur de Documents** : Interface de rédaction intuitive
- **Analyse IA** : Analyse automatique des documents avec :
  - Résumé intelligent
  - Extraction de mots-clés
  - Analyse de sentiment
  - Classification automatique
  - Suggestions d'amélioration
- **Gestion des Documents** : Sauvegarde et historique
- **Interface Moderne** : Design responsive avec React et Material-UI

### 🛠️ Architecture

- **Frontend** : React 19 + CSS moderne
- **Backend** : Node.js + Express
- **Application** : Electron pour bureau
- **Base de Données** : SQLite (local)
- **IA** : Simulation d'analyse de documents

### 📁 Structure du Projet

```
docucortex-ia/
├── main.js              # Point d'entrée Electron
├── server.js            # Serveur backend API
├── src/
│   ├── App.js           # Interface principale
│   ├── App.css          # Styles
│   └── apiService.js    # Service API
├── public/
│   └── index.html       # Template HTML
├── assets/
│   └── icon.svg         # Icône de l'application
├── data/                # Données SQLite
└── build/               # Build React (généré)
```

### 🎯 Scripts Disponibles

| Commande | Description |
|----------|-------------|
| `npm start` | Lancement avec serveur React |
| `npm run dev` | Lancement développement complet |
| `npm run electron-app` | Lancement Electron standalone |
| `npm run build` | Construction de l'application |
| `npm run pack` | Packaging Electron |
| `npm run dist` | Création exécutable portable |

### 🔧 Configuration

L'application utilise :
- Port React : 3000
- Port API : 3001
- Mode développement avec hot reload
- Mode production pour Electron

### 📊 État de l'Application

L'application indique en temps réel :
- 🟢 **Serveur en ligne** : API et fonctionnalités IA disponibles
- 🔴 **Serveur hors ligne** : Mode lecture seule

### 💾 Sauvegarde

Les documents sont automatiquement sauvegardés dans :
- `data/documents.json` pour les métadonnées
- Base de données SQLite intégrée

### 🎨 Interface Utilisateur

- Design moderne avec dégradés
- Interface responsive
- Animations fluides
- Thème sombre/clair automatique

### 🚀 Préparation Production

Pour créer un exécutable portable :

```bash
npm run dist
```

L'exécutable sera généré dans le dossier `dist-electron/`

### 📞 Support

Application développée par **DocuCortex Team**
Version : 3.0.31
Date : Novembre 2025