# Suite de Tests de Performance Backend - DocuCortex

## 📋 Description

Cette suite complète de tests de performance pour le backend DocuCortex permet de mesurer et d'analyser les performances de tous les composants critiques du système :

- **Tests API** : Performance des endpoints REST
- **Tests Base de Données** : Requêtes SQLite et optimisations
- **Tests WebSocket** : Communication temps réel
- **Tests de Charge** : Simulation de charge utilisateur
- **Profilage Mémoire** : Analyse CPU et mémoire Node.js
- **Tests GED** : Gestion Électronique de Documents

## 🚀 Utilisation Rapide

### Lancement Simple
```bash
# Rendre le script exécutable
chmod +x run-performance-tests.sh

# Lancer tous les tests
./run-performance-tests.sh

# Tests rapides (développement)
./run-performance-tests.sh --env development

# Tests complets (staging/production)
./run-performance-tests.sh --env staging
```

### Lancement Manuel avec Node.js
```bash
# Installer les dépendances
npm install

# Lancer tous les tests
node index.js

# Lancer seulement les tests API
node index.js api

# Avec configuration personnalisée
node index.js all --env production --verbose
```

## 📊 Types de Tests

### 1. Tests API (`--test api`)
- **Latence** : Temps de réponse de chaque endpoint
- **Disponibilité** : Vérification du statut HTTP
- **Charge** : Tests avec autocannon (concurrence, durée)
- **Stress** : Tests sous charge élevée
- **Mutations** : POST/PUT/DELETE avec cleanup automatique

**Endpoints testés :**
- `/api/health` (critique)
- `/api/computers` (CRUD)
- `/api/loans` (CRUD + statistiques)
- `/api/notifications` (lecture)
- `/api/ai/*` (services IA)
- Et plus de 15 endpoints...

### 2. Tests Base de Données (`--test database`)
- **Connexion** : Tests de connexion simple/multiples
- **Performance Requêtes** : Exécution et timing de requêtes complexes
- **Concurrence** : Requêtes simultanées multiples
- **Indexation** : Analyse de l'utilisation des index SQLite
- **Mémoire** : Utilisation mémoire de SQLite

**Requêtes testées :**
```sql
-- Liste des ordinateurs
SELECT * FROM computers LIMIT 100

-- Jointure prêts-ordinateurs
SELECT l.*, c.name as computerName 
FROM loans l LEFT JOIN computers c ON l.computerId = c.id

-- Agrégations complexes
SELECT status, COUNT(*), AVG(duration) FROM loans 
GROUP BY status
```

### 3. Tests WebSocket (`--test websocket`)
- **Connexion** : Tests de connexion simple/multiples
- **Messaging** : Envoi/réception de messages
- **Broadcast** : Diffusion à multiple clients
- **Charge** : Simulation avec Artillery
- **Stress** : Test de resistance avec 100+ connexions

**Types de messages testés :**
- `data_updated`
- `chat_message_new`
- `ai_message`
- `notification`
- `system_status`

### 4. Tests de Charge (`--test load`)
- **Charge Légère** : 10 connexions, 30s
- **Charge Moyenne** : 50 connexions, 5min
- **Charge Lourde** : 100 connexions, 10min
- **Concurrence** : Tests multi-endpoints simultanés
- **Progressive** : Montée en charge progressive
- **Soak Test** : Test de resistance 10min

### 5. Profilage Mémoire (`--test memory`)
- **Surveillance Continue** : Monitoring CPU/mémoire en temps réel
- **Tests de Charge Mémoire** : Impact mémoire des opérations
- **Analyse Heap** : Fragmentation et utilisation du tas
- **Test de Croissance** : Évolution mémoire sous charge
- **Détection Fuites** : Recherche de memory leaks potentiels

**Métriques surveillées :**
- RSS, Heap Used/Total, External
- CPU Usage (user/system)
- System Load Average
- Mémoire disponible

### 6. Tests GED (`--test ged`)
- **Upload** : Simple, multiple, concurrent
- **Indexation** : Fichier individuel et par lots
- **Recherche** : Textuelle, avancée, floue
- **Téléchargement** : Simple et concurrent
- **Prévisualisation** : Génération de previews
- **Batch Operations** : Opérations par lots

**Types de fichiers testés :**
- Textes (1KB - 100KB)
- Images (500KB - 1MB)
- PDF (2MB - 10MB)

## ⚙️ Configuration

### Variables d'Environnement
```bash
export API_BASE_URL=http://localhost:3002
export API_PORT=3002
export WS_PORT=3003
export DB_PATH=/path/to/database.sqlite
export NODE_ENV=development
```

### Configuration Customisée
Le fichier `config.js` permet de personnaliser :

```javascript
// Seuils de performance
thresholds: {
    responseTime: {
        excellent: 100,   // ms
        good: 500,        // ms
        acceptable: 1000, // ms
        poor: 2000        // ms
    },
    throughput: {
        minimum: 100,   // req/s
        good: 500,      // req/s
        excellent: 1000 // req/s
    }
}

// Paramètres de test
load: {
    durations: {
        short: 30,    // 30 secondes
        medium: 300,  // 5 minutes
        long: 600     // 10 minutes
    },
    concurrency: {
        low: 10,
        medium: 50,
        high: 100,
        veryHigh: 200
    }
}
```

## 📁 Structure des Fichiers

```
tests/performance/backend/
├── index.js                    # Orchestrateur principal
├── config.js                   # Configuration globale
├── package.json                # Dépendances
├── run-performance-tests.sh    # Script de lancement
├── README.md                   # Cette documentation
├── api/
│   └── api-performance.js      # Tests des endpoints REST
├── database/
│   └── db-performance.js       # Tests SQLite
├── websocket/
│   └── ws-performance.js       # Tests WebSocket/Artillery
├── load/
│   └── load-testing.js         # Tests de charge
├── memory/
│   └── memory-profiling.js     # Profilage mémoire/CPU
├── ged/
│   └── ged-performance.js      # Tests GED
├── utils/
│   └── logger.js              # Logger personnalisé
└── templates/
    └── report-template.html    # Template rapport HTML
```

## 📈 Rapports et Métriques

### Types de Rapports Générés

1. **Rapport JSON** (`performance-report-YYYY-MM-DD_HH-mm-ss.json`)
   - Données complètes des tests
   - Métriques détaillées
   - Recommandations

2. **Rapport CSV** (`performance-summary-YYYY-MM-DD_HH-mm-ss.csv`)
   - Résumé tabulaire
   - Métriques principales
   - Import Excel/Google Sheets

3. **Rapport HTML** (`performance-report-YYYY-MM-DD_HH-mm-ss.html`)
   - Interface web interactive
   - Graphiques et métriques
   - Recommandations colorées

### Métriques Principales

- **Temps de Réponse** : Average, Min, Max, P95, P99
- **Débit** : Requêtes par seconde
- **Taux d'Erreur** : Pourcentage d'échecs
- **Utilisation Mémoire** : RSS, Heap, CPU
- **Fiabilité** : Taux de succès par test

## 🎯 Recommandations Automatiques

Le système génère automatiquement des recommandations basées sur :

### Performance
- Latence > 1000ms : Optimiser les requêtes
- Débit < 100 req/s : Scaling nécessaire
- CPU > 70% : Optimisation algorithmes

### Fiabilité
- Taux d'erreur > 1% : Investigation requise
- Timeouts fréquents : Problèmes de ressources

### Mémoire
- Croissance continue : Recherche de fuites
- Fragmentation heap > 20% : Optimisation structures

### Scalabilité
- Plateau de performance : Limites atteint
- Concurrence limitée : Bottlenecks identifiés

## 🛠️ Dépannage

### Problèmes Courants

**Serveur non accessible**
```bash
# Vérifier que le serveur backend fonctionne
curl http://localhost:3002/api/health

# Si nécessaire, démarrer le serveur
cd /workspace/rdp/server && npm start
```

**Erreurs de dépendances**
```bash
# Réinstaller les modules
rm -rf node_modules package-lock.json
npm install
```

**Tests de base de données échoués**
```bash
# Vérifier l'existence de la base
ls -la /workspace/rdp/data/rds_viewer_data.sqlite

# Vérifier les permissions
chmod 644 /workspace/rdp/data/rds_viewer_data.sqlite
```

### Logs Détaillés
```bash
# Lancer avec logs complets
./run-performance-tests.sh --verbose

# Consulter les logs
tail -f results/performance-tests-*.log
```

### Tests Sélectifs
```bash
# Tester seulement les endpoints critiques
node index.js api --test-types=critical

# Test rapide sans rapports
./run-performance-tests.sh --no-reports
```

## 📊 Interprétation des Résultats

### Seuils de Performance

| Métrique | Excellent | Bon | Acceptable | Critique |
|----------|-----------|-----|------------|----------|
| Latence | < 100ms | < 500ms | < 1000ms | > 1000ms |
| Débit | > 1000 req/s | > 500 req/s | > 100 req/s | < 100 req/s |
| Erreurs | < 0.01% | < 0.1% | < 1% | > 1% |
| Mémoire | < 500MB | < 1GB | < 2GB | > 2GB |

### Actions Recommandées

**🔴 Critique** : Intervention immédiate requise
**🟠 Élevé** : Planification d'optimisation
**🟡 Moyen** : Surveillance renforcée
**🔵 Info** : Amélioration possible

## 🔧 Développement et Extension

### Ajouter un Nouveau Test

1. Créer le fichier de test dans la catégorie appropriée
2. Implémenter la classe avec les méthodes requises
3. Ajouter la configuration dans `config.js`
4. Intégrer dans `index.js`

### Personnaliser les Métriques

```javascript
// Dans config.js
thresholds: {
    myMetric: {
        warning: 100,
        critical: 200
    }
}
```

### Ajouter des Recommandations

```javascript
// Dans le fichier de test
if (myMetric > config.thresholds.myMetric.warning) {
    this.results.recommendations.push({
        type: 'custom',
        severity: 'high',
        message: 'Métrique personnalisée élevée',
        suggestion: 'Action recommandée'
    });
}
```

## 🤝 Contribution

Pour contribuer à cette suite de tests :

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/amazing-test`)
3. Commit les changements (`git commit -m 'Add amazing test'`)
4. Push la branche (`git push origin feature/amazing-test`)
5. Ouvrir une Pull Request

## 📞 Support

En cas de problème :

1. Consulter cette documentation
2. Vérifier les logs générés
3. Ouvrir une issue avec :
   - Version Node.js (`node --version`)
   - OS et architecture
   - Logs d'erreur complets
   - Configuration utilisée

---

**© 2024 DocuCortex Team - Suite de Tests de Performance Backend**