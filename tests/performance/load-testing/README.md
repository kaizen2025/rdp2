# 🧪 Suite de Tests de Charge - DocuCortex

Cette suite complète de tests de charge permet d'évaluer la stabilité, les performances et la résilience du système DocuCortex sous diverses conditions de charge et stress.

## 📋 Table des Matières

- [Aperçu](#-aperçu)
- [Installation](#-installation)
- [Types de Tests](#-types-de-tests)
- [Utilisation](#-utilisation)
- [Configuration](#-configuration)
- [Rapports](#-rapports)
- [Exemples](#-exemples)
- [Dépannage](#-dépannage)

## 🔍 Aperçu

La suite de tests de charge comprend 6 types de tests spécialisés :

1. **Tests d'utilisateurs concurrents** (10-50 utilisateurs simultanés)
2. **Tests d'accès concurrent à la base de données**
3. **Tests de charge WebSocket**
4. **Tests de récupération après erreurs**
5. **Tests de performance avec données volumineuses** (10,000+ enregistrements)
6. **Tests d'endurance** (plusieurs heures)

## 🚀 Installation

### Prérequis

- Node.js 14.0.0 ou supérieur
- Accès à l'API DocuCortex (http://localhost:3000 par défaut)
- Base de données MySQL/PostgreSQL (optionnel pour les tests)
- npm ou yarn

### Installation rapide

```bash
# Naviguer vers le répertoire de tests
cd /workspace/rdp/tests/performance/load-testing

# Installer les dépendances
npm install

# Ou utiliser le script d'installation
chmod +x install.sh
./install.sh
```

### Variables d'environnement

Créez un fichier `.env` ou configurez les variables suivantes :

```bash
# Configuration API
API_BASE_URL=http://localhost:3000

# Configuration MySQL
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=docucortex_test

# Configuration PostgreSQL
PG_HOST=localhost
PG_USER=postgres
PG_PASSWORD=your_password
PG_DATABASE=docucortex_test
```

## 🧪 Types de Tests

### 1. Utilisateurs Concurrents

**Objectif** : Simuler 10-50 utilisateurs effectuant des opérations simultanées

**Fonctionnalités testées** :
- Navigation utilisateur standard
- Upload de documents
- Recherche de documents
- Traitement OCR
- Gestion de profil utilisateur

**Durée** : ~5 minutes
**Charge** : 10-50 utilisateurs parallèles

### 2. Base de Données Concurrente

**Objectif** : Tester l'accès concurrent aux bases de données MySQL et PostgreSQL

**Opérations testées** :
- Insertions concurrentes (1000+ enregistrements)
- Lectures concurrentes
- Opérations mixtes (INSERT, SELECT, UPDATE, DELETE)
- Tests via API

**Durée** : ~8 minutes
**Volume** : 1000-5000 opérations

### 3. Charge WebSocket

**Objectif** : Évaluer la stabilité des connexions WebSocket sous charge

**Tests inclus** :
- Connexions massives (100+ connexions simultanées)
- Pics de trafic
- Gestion des déconnexions
- Test de surcharge
- Messages de différentes tailles

**Durée** : ~10 minutes
**Connexions** : 50-200 connexions WebSocket

### 4. Récupération après Erreurs

**Objectif** : Tester la capacité de récupération du système après des erreurs sous charge

**Scénarios de récupération** :
- Redémarrage de service
- Basculement de base de données
- Partition réseau
- Récupération après surcharge
- Reconnexion WebSocket

**Durée** : ~15 minutes
**Charge de fond** : 20 utilisateurs continus

### 5. Performance Données Volumineuses

**Objectif** : Tester les performances avec de grandes quantités de données

**Tests inclus** :
- Génération de 10,000+ enregistrements
- Recherche sur gros volumes
- Requêtes complexes
- Opérations full-text
- Performance API avec pagination

**Durée** : ~12 minutes
**Volume** : 10,000-15,000 enregistrements

### 6. Test d'Endurance

**Objectif** : Tester la stabilité sur une longue période

**Surveillance** :
- Utilisation mémoire continue
- Taux d'erreur dans le temps
- Performance constante
- Détection de memory leaks
- Stabilité WebSocket

**Durée** : 2-24 heures (configurable)
**Charge** : 30-100 utilisateurs continus

## 🎯 Utilisation

### Menu interactif

```bash
# Lancement avec menu interactif
node index.js
```

### Ligne de commande

```bash
# Tous les tests
node index.js --all

# Test spécifique
node index.js --test concurrentUsers

# Test d'endurance personnalisé
node index.js --test enduranceTest --duration 4h --load 50

# Ignorer les vérifications d'environnement
node index.js --skip-checks --all

# Avec tests de stress avancés
node index.js --all --stress-test
```

### Tests individuels

```bash
# Utilisateurs concurrents
npm run load-test:concurrent

# Base de données concurrente
npm run load-test:database

# Charge WebSocket
npm run load-test:websocket

# Récupération après erreurs
npm run load-test:recovery

# Données volumineuses
npm run load-test:big-data

# Test d'endurance
npm run load-test:endurance

# Test Artillery
npm run artillery:run
```

## ⚙️ Configuration

### Configuration des tests

Les tests peuvent être configurés via :

1. **Variables d'environnement** (recommandé pour CI/CD)
2. **Arguments de ligne de commande**
3. **Édition directe des scripts**

### Paramètres courants

```javascript
// Dans les scripts de test
const config = {
  concurrentUsers: 50,        // Nombre d'utilisateurs
  testDuration: '2m',         // Durée des tests
  databaseOperations: 1000,   // Opérations DB
  websocketConnections: 100,  // Connexions WebSocket
  enduranceDuration: '4h',    // Durée d'endurance
  bigDataRecords: 15000       // Enregistrements de test
};
```

### Configuration Artillery

Le fichier `artillery-config.yml` permet de configurer finement les tests Artillery :

```yaml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warmup"
    - duration: 300
      arrivalRate: 20
      name: "Sustained load"
```

## 📊 Rapports

### Types de rapports

1. **Rapports JSON** : Données détaillées pour analyse
2. **Rapports HTML** : Visualisation web interactive
3. **Rapports console** : Sortie en temps réel
4. **Rapports Artillery** : Graphiques et métriques

### Emplacement des rapports

```
reports/
├── concurrent-users-results.json
├── database-concurrent-results.json
├── websocket-load-results.json
├── error-recovery-results.json
├── big-data-performance-results.json
├── endurance-test-results.json
├── load-test-orchestrator-report.json
├── load-test-report.html
└── artillery-report.html
```

### Métriques surveillées

- **Temps de réponse** : Moyenne, P95, P99, minimum, maximum
- **Débit** : Requêtes par seconde
- **Taux d'erreur** : Pourcentage d'échecs
- **Utilisation mémoire** : Pic, moyenne, échantillons
- **Connexions actives** : WebSocket, HTTP
- **Stabilité** : Uptime, crashes, récupérations

## 📝 Exemples

### Exemple 1 : Test rapide de régression

```bash
# Test rapide des fonctionnalités critiques
node index.js --skip-checks --test concurrentUsers --test databaseConcurrent
```

### Exemple 2 : Test de performance complet

```bash
# Tous les tests de performance
node index.js --all --stress-test
```

### Exemple 3 : Test d'endurance nocturne

```bash
# Test d'endurance de 8 heures
nohup node index.js --test enduranceTest --duration 8h --load 100 > endurance.log 2>&1 &
```

### Exemple 4 : Configuration CI/CD

```yaml
# .github/workflows/load-test.yml
name: Load Tests
on: [push, pull_request]
jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install dependencies
        run: npm install
      - name: Run load tests
        run: node index.js --skip-checks --test concurrentUsers
        env:
          API_BASE_URL: ${{ secrets.API_BASE_URL }}
```

## 🔧 Dépannage

### Problèmes courants

#### 1. API non disponible

```
❌ Erreur: API non disponible - vérifier que le serveur fonctionne
```

**Solution** :
```bash
# Vérifier que l'API est accessible
curl http://localhost:3000/api/health

# Ajuster l'URL si nécessaire
export API_BASE_URL=http://your-server:3000
```

#### 2. Connexion base de données échouée

```
⚠️ Connexions base de données non disponibles, utilisation du mode simulateur
```

**Solution** :
- Vérifier les credentials MySQL/PostgreSQL
- S'assurer que les bases sont accessibles
- Les tests continuent en mode simulateur

#### 3. Artillery non installé

```bash
# Installer Artillery globalement
npm install -g artillery

# Ou utiliser npx (recommandé)
npx artillery run artillery-config.yml
```

#### 4. Problèmes de mémoire

```
⚠️ Utilisation mémoire élevée - Surveiller les memory leaks
```

**Solutions** :
- Réduire la charge de test
- Augmenter la mémoire Node.js : `node --max-old-space-size=4096`
- Optimiser les requêtes de base de données

### Logs et débogage

```bash
# Logs détaillés
DEBUG=loadtest,artillery node index.js

# Profil de performance
node --prof index.js

# Analyse des memory leaks
node --inspect index.js
```

### Optimisation des performances

```javascript
// Réduire la verbosité pour améliorer les performances
const config = {
  verbose: false,        // Désactiver les logs détaillés
  batchSize: 50,         // Taille des lots pour les insertions DB
  concurrentLimit: 100,  // Limite de concurrence
  timeout: 30000         // Timeout des requêtes
};
```

## 📚 Documentation technique

### Architecture des tests

```javascript
// Structure des classes de test
class LoadTestBase {
  constructor() {
    this.results = {};    // Résultats du test
    this.config = {};     // Configuration
    this.startTime = 0;   // Timestamp de début
  }
  
  async run() {
    // Logique du test
  }
  
  saveResults() {
    // Sauvegarde des résultats
  }
  
  generateReport() {
    // Génération du rapport
  }
}
```

### Points d'extension

1. **Nouveaux types de tests** : Hériter de `LoadTestBase`
2. **Métriques personnalisées** : Étendre la classe de métriques
3. **Formats de rapport** : Implémenter de nouveaux formats
4. **Intégrations** : Ajouter des plugins pour monitoring externe

### APIs utilisées

- **REST API** : Tests HTTP/HTTPS standard
- **WebSocket** : Tests de connexions temps réel
- **Base de données** : Tests MySQL et PostgreSQL directs
- **Système** : Métriques système et mémoire

## 🤝 Contribution

Pour ajouter de nouveaux tests :

1. Créer un nouveau script dans `scripts/`
2. Hériter de la classe de base appropriée
3. Implémenter les méthodes requises
4. Ajouter la configuration dans `index.js`
5. Mettre à jour la documentation

## 📄 Licence

Cette suite de tests fait partie du projet DocuCortex et suit la même licence.

---

**Auteur** : DocuCortex Team  
**Version** : 1.0.0  
**Dernière mise à jour** : 2025-11-04

Pour toute question ou support, consulter la documentation principale de DocuCortex.