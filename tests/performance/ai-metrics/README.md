# Système de Métriques IA - DocuCortex

## 📊 Vue d'ensemble

Ce système complet de métriques pour les temps de réponse IA/OCR sous charge permet de mesurer, analyser et surveiller les performances des services IA de DocuCortex en conditions réelles d'utilisation.

### 🎯 Objectifs

- **Tests de performance** sous charge pour tous les services IA
- **Monitoring en temps réel** des temps de réponse et métriques système
- **Alertes automatiques** basées sur des seuils configurables
- **Tableaux de bord interactifs** pour la visualisation des données
- **Rapports détaillés** avec recommandations d'optimisation

### 🚀 Services Testés

1. **Ollama IA** (llama3.2:3b) - Temps de réponse, débit, utilisation mémoire
2. **EasyOCR** - Performance multi-langues, précision, traitement
3. **DocuCortex IA** - Chat, recherche, traitement de documents
4. **GED Services** - Upload, indexation, recherche volumétrique
5. **Réseau** - Latence, bande passante, connectivité
6. **Dégradation Gracieuse** - Résilience sous charge excessive

## 📁 Structure du Projet

```
ai-metrics/
├── scripts/                    # Scripts de tests de performance
│   ├── ollama-load-test.js     # Test Ollama sous charge
│   ├── easyocr-load-test.js    # Test EasyOCR multi-langues
│   ├── docucortex-ai-load-test.js # Test DocuCortex IA
│   ├── ged-volume-load-test.js # Test GED volumétrique
│   ├── network-latency-test.js # Test latence réseau
│   └── graceful-degradation-test.js # Test dégradation
├── shared/                     # Modules partagés
│   ├── performance-monitor.js  # Monitoring système
│   ├── load-generator.js       # Génération de charge
│   └── metrics-collector.js    # Collecte de métriques
├── dashboards/                 # Tableaux de bord
│   └── metrics-dashboard.html  # Dashboard temps réel
├── alerts/                     # Système d'alertes
│   ├── alert-thresholds.js     # Gestion des seuils
│   └── alert-config.json       # Configuration des alertes
├── configs/                    # Configurations
├── results/                    # Résultats des tests
├── ai-metrics-orchestrator.js  # Orchestrateur principal
├── start-ai-metrics.sh         # Script de démarrage
└── README.md                   # Cette documentation
```

## 🛠️ Installation

### Prérequis

- **Node.js** >= 14.x
- **npm** >= 6.x
- **Python3** (pour EasyOCR, optionnel)
- **Ollama** (pour les tests IA, optionnel)

### Installation Rapide

```bash
# Cloner le projet
git clone <repository-url>
cd rdp/tests/performance/ai-metrics

# Utiliser le script de démarrage automatique
./start-ai-metrics.sh --quick
```

### Installation Manuelle

```bash
# 1. Installer les dépendances Node.js
npm install

# 2. Installer EasyOCR (optionnel)
pip3 install easyocr

# 3. Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos configurations

# 4. Créer les dossiers de travail
mkdir -p results temp logs
```

## 🚀 Utilisation

### Démarrage Rapide

```bash
# Exécution rapide (Ollama + EasyOCR)
./start-ai-metrics.sh --quick

# Tests complets (tous les services)
./start-ai-metrics.sh --full

# Démarrer le dashboard
./start-ai-metrics.sh --dashboard
```

### Mode Interactif

```bash
# Lancer le menu interactif
./start-ai-metrics.sh

# Puis choisir dans le menu:
# 1) Exécution rapide
# 2) Tests complets
# 3-8) Tests individuels
# 9) Dashboard
# etc.
```

### Utilisation Programmatique

```javascript
const AIPerformanceOrchestrator = require('./ai-metrics-orchestrator');

const orchestrator = new AIPerformanceOrchestrator();

// Tests en parallèle
await orchestrator.runAllTests({
    parallel: true,
    tests: ['ollama', 'easyocr', 'network']
});

// Tests spécifiques
await orchestrator.runAllTests({
    tests: ['docucortex', 'ged'],
    config: {
        docucortex: { concurrentUsers: 10 },
        ged: { totalDocuments: 200 }
    }
});
```

### Options de Ligne de Commande

```bash
# Aide complète
node ai-metrics-orchestrator.js --help

# Tests spécifiques en parallèle
node ai-metrics-orchestrator.js --tests ollama,easyocr --parallel

# Tests avec configuration personnalisée
node ai-metrics-orchestrator.js --tests all --config my-config.json

# Mode silencieux
node ai-metrics-orchestrator.js --tests all --quiet
```

## 📊 Tests de Performance

### 1. Test Ollama IA

Mesure les performances du modèle llama3.2:3b sous charge :

- **Métriques** : Temps de réponse, débit (tokens/sec), utilisation mémoire
- **Charge** : 5 utilisateurs concurrents, montée progressive
- **Duración** : 5 minutes
- **Seuils** : 
  - Temps de réponse critique : > 5s
  - Débit critique : < 15 tokens/sec
  - Mémoire critique : > 90%

```javascript
// Exemple de configuration
{
  "ollama": {
    "baseUrl": "http://localhost:11434",
    "model": "llama3.2:3b",
    "concurrentUsers": 5,
    "requestsPerUser": 20
  }
}
```

### 2. Test EasyOCR Multi-langues

Évalue les performances OCR sur plusieurs langues :

- **Langues** : Français, Anglais, Espagnol, Allemand, Italien
- **Métriques** : Temps de traitement, précision, confiance
- **Types** : Images PNG/JPG, documents texte
- **Seuils** :
  - Traitement critique : > 10s
  - Précision critique : < 85%
  - Confiance critique : < 0.7

### 3. Test DocuCortex IA

Test complet des fonctionnalités IA :

- **Modules** : Chat IA, Recherche sémantique, Traitement
- **Métriques** : Temps par module, throughput, erreurs
- **Charge** : 8 utilisateurs concurrents
- **Seuils** :
  - Chat critique : > 8s
  - Recherche critique : > 3s
  - Traitement critique : > 6s

### 4. Test GED Volumineux

Performance de gestion documentaire :

- **Documents** : 100 fichiers (PDF, DOCX, images)
- **Opérations** : Upload, indexation, recherche
- **Métriques** : Vitesse upload, temps indexation, débit recherche
- **Seuils** :
  - Upload critique : < 1 MB/s
  - Indexation critique : < 10 docs/min
  - Recherche critique : > 1s

### 5. Test Latence Réseau

Analyse de la connectivité réseau :

- **Tests** : Ping, TCP, HTTP, bande passante, jitter
- **Métriques** : Latence, perte paquets, score réseau
- **Cibles** : Ollama, DocuCortex, EasyOCR
- **Seuils** :
  - Latence critique : > 1000ms
  - Perte paquets critique : > 10%
  - Score réseau critique : < 70

### 6. Test Dégradation Gracieuse

Résilience sous charge excessive :

- **Charge** : 5 à 50 utilisateurs progressifs
- **Mécanismes** : Fallback, mise en file, dégradation
- **Métriques** : Score résilience, événements dégradation
- **Seuils** :
  - Résilience critique : < 70%
  - Taux fallback critique : > 20%

## 🔔 Système d'Alertes

### Configuration des Seuils

Les seuils d'alerte sont configurés dans `alerts/alert-config.json` :

```json
{
  "global": {
    "responseTime": {
      "critical": 5000,
      "high": 3000,
      "warning": 2000,
      "good": 1000
    },
    "successRate": {
      "critical": 80,
      "high": 85,
      "warning": 90,
      "good": 95
    }
  },
  "services": {
    "ollama": {
      "responseTime": {
        "multiplier": 1.5,
        "critical": 7500
      }
    }
  }
}
```

### Niveaux d'Alerte

- **🔴 CRITICAL** : Action immédiate requise
- **🟡 HIGH** : Intervention sous 1 heure
- **🟠 WARNING** : Surveillance sous 4 heures
- **🟢 LOW** : Information

### Escalade Automatique

```javascript
const alertThresholds = new AlertThresholds({
    configPath: './alerts/alert-config.json'
});

// Vérifier une métrique
const result = alertThresholds.checkThreshold(
    'responseTime', 
    3500, // valeur mesurée
    'ollama' // service
);

if (result.triggered) {
    console.log(`Alerte ${result.level} déclenchée`);
}
```

## 📈 Dashboard de Monitoring

### Dashboard Temps Réel

Le dashboard interactif (`dashboards/metrics-dashboard.html`) offre :

- **Métriques en temps réel** : RPS, temps réponse, taux succès
- **État des services** : Ollama, EasyOCR, DocuCortex, GED
- **Graphiques interactifs** : Temps réponse, débit, erreurs
- **Alertes visuelles** : Notifications en temps réel

### Démarrage du Dashboard

```bash
# Mode simple
./start-ai-metrics.sh --dashboard

# Ou avec serveur HTTP
cd dashboards
python3 -m http.server 8080
# Ouvrir: http://localhost:8080/metrics-dashboard.html
```

### Personnalisation

Le dashboard peut être personnalisé dans `metrics-dashboard.html` :

```javascript
// Configuration des seuils d'alerte
const alertThresholds = {
    responseTime: 2000,
    successRate: 95,
    cpuUsage: 85
};

// Couleurs personnalisées
const colors = {
    critical: '#e74c3c',
    high: '#f39c12',
    warning: '#f1c40f',
    good: '#27ae60'
};
```

## 📄 Rapports et Analyse

### Types de Rapports

1. **Rapport JSON Détaillé** : Données complètes pour analyse
2. **Rapport Markdown** : Format lisible avec recommandations
3. **Export CSV** : Données tabulaires pour Excel/BI
4. **Dashboard HTML** : Visualisation interactive

### Génération de Rapports

```javascript
// Rapport consolidé automatique
const report = await orchestrator.generateConsolidatedReport(testResults);

// Export CSV des métriques
metricsCollector.exportToCSV();

// Rapport santé des seuils
const healthReport = alertThresholds.generateHealthReport();
```

### Analyse Automatique

Le système génère automatiquement :

- **Score de performance global** (0-100)
- **Goulots d'étranglement** identifiés
- **Recommandations d'optimisation**
- **Tendances de performance**
- **Prévisions de capacité**

## ⚙️ Configuration

### Configuration Globale

Créer `config/test-config.json` :

```json
{
  "ollama": {
    "baseUrl": "http://localhost:11434",
    "model": "llama3.2:3b",
    "concurrentUsers": 5,
    "enabled": true
  },
  "docucortex": {
    "baseUrl": "http://localhost:3000",
    "concurrentUsers": 8,
    "enabled": true
  },
  "general": {
    "parallel": false,
    "outputDir": "./results",
    "alertThresholds": "./alerts/alert-config.json"
  }
}
```

### Variables d'Environnement

Créer `.env` :

```env
# Services IA
OLLAMA_HOST=localhost
OLLAMA_PORT=11434
DOCUCORTEX_HOST=localhost
DOCUCORTEX_PORT=3000

# Alertes
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
EMAIL_NOTIFICATIONS=admin@docucortex.com

# Réseau
NETWORK_TIMEOUT=5000
PING_COUNT=100

# Dashboard
DASHBOARD_PORT=8080
REFRESH_INTERVAL=2000
```

### Configuration Avancée

```javascript
// Configuration personnalisée des tests
const customConfig = {
    ollama: {
        concurrentUsers: 10,
        testDuration: 600,
        customPrompts: [
            "Expliquez l'IA en 2 phrases",
            "Résumez ce document",
            "Traduisez ce texte"
        ]
    },
    degradation: {
        enableFallback: true,
        maxUsers: 100,
        stepUsers: 10
    }
};

await orchestrator.runAllTests({
    config: customConfig
});
```

## 🔧 Dépannage

### Problèmes Courants

#### 1. Services IA Non Accessible

```bash
# Vérifier l'état des services
curl http://localhost:11434/api/version  # Ollama
curl http://localhost:3000/api/health    # DocuCortex

# Démarrer les services
./start-ai-metrics.sh --services
```

#### 2. Erreurs de Dépendances

```bash
# Réinstaller les dépendances
npm install --force

# Vérifier Python/EasyOCR
python3 -c "import easyocr; print('OK')"
```

#### 3. Problèmes de Performance

```bash
# Tester en mode mock (sans services réels)
node ai-metrics-orchestrator.js --tests ollama --mock-mode

# Réduire la charge
node ai-metrics-orchestrator.js --tests ollama --concurrent-users 2
```

### Logs et Débogage

```bash
# Logs en temps réel
tail -f logs/ai-metrics.log

# Mode verbeux
node ai-metrics-orchestrator.js --verbose --tests ollama

# Debug spécifique
DEBUG=ai-metrics:* node ai-metrics-orchestrator.js
```

### Configuration Réseau

```bash
# Test de connectivité
ping localhost
telnet localhost 11434  # Ollama
telnet localhost 3000   # DocuCortex

# Ports utilisés
netstat -tulpn | grep -E "(11434|3000)"
```

## 📚 Exemples d'Utilisation

### 1. Test de Charge Quotidien

```bash
#!/bin/bash
# daily-load-test.sh

cd /path/to/ai-metrics

# Nettoyer les anciens résultats
rm -f results/*.json

# Exécuter les tests
./start-ai-metrics.sh --full

# Générer un rapport quotidien
node -e "
const orchestrator = require('./ai-metrics-orchestrator');
orchestrator.runAllTests().then(() => {
    console.log('Tests quotidiens terminés');
});
"
```

### 2. Monitoring Continu

```javascript
// continuous-monitoring.js
const orchestrator = new AIPerformanceOrchestrator();

async function continuousMonitoring() {
    while (true) {
        try {
            // Tests rapides toutes les 5 minutes
            await orchestrator.runAllTests({
                tests: ['ollama', 'docucortex', 'network'],
                config: {
                    ollama: { concurrentUsers: 2 },
                    docucortex: { concurrentUsers: 3 }
                }
            });
            
            // Attendre 5 minutes
            await new Promise(resolve => setTimeout(resolve, 300000));
            
        } catch (error) {
            console.error('Erreur monitoring:', error);
            await new Promise(resolve => setTimeout(resolve, 60000)); // Attendre 1 minute
        }
    }
}

continuousMonitoring();
```

### 3. Test de Régression

```javascript
// regression-test.js
const baselineResults = require('./results/baseline-results.json');

async function regressionTest() {
    const currentResults = await orchestrator.runAllTests();
    
    // Comparer avec la baseline
    const regressions = [];
    
    Object.entries(currentResults).forEach(([service, current]) => {
        const baseline = baselineResults[service];
        
        if (baseline && current.avgResponseTime > baseline.avgResponseTime * 1.2) {
            regressions.push({
                service,
                metric: 'responseTime',
                baseline: baseline.avgResponseTime,
                current: current.avgResponseTime,
                degradation: ((current.avgResponseTime / baseline.avgResponseTime - 1) * 100).toFixed(1) + '%'
            });
        }
    });
    
    if (regressions.length > 0) {
        console.log('🚨 RÉGRESSIONS DÉTECTÉES:');
        regressions.forEach(reg => {
            console.log(`- ${reg.service}: ${reg.degradation} plus lent`);
        });
        
        // Envoyer une alerte
        // await sendSlackAlert(regressions);
    }
}
```

## 🤝 Contribution

### Structure du Code

```javascript
// Template pour un nouveau test
class NewServiceLoadTest {
    constructor(config = {}) {
        this.config = {
            baseUrl: 'http://localhost:port',
            concurrentUsers: 5,
            testDuration: 300,
            ...config
        };
        
        this.monitor = new PerformanceMonitor('new-service');
        this.metrics = new MetricsCollector('new-service-load-test');
    }
    
    async run() {
        await this.initialize();
        await this.runTest();
        const summary = await this.generateReport();
        return summary;
    }
}
```

### Standards de Code

- **ESLint** : Configuration pour Node.js
- **Documentation** : JSDoc pour toutes les fonctions
- **Tests** : Chaque module doit avoir ses tests
- **Logs** : Utiliser console.log avec niveaux (INFO, WARN, ERROR)

### Ajout d'un Nouveau Test

1. Créer `scripts/new-service-load-test.js`
2. Étendre `PerformanceMonitor` et `MetricsCollector`
3. Ajouter la configuration dans `alert-config.json`
4. Mettre à jour l'orchestrateur
5. Ajouter au menu du script de démarrage
6. Documenter dans ce README

## 📞 Support

### Contacts

- **Documentation** : Ce README
- **Issues** : Système de tickets GitHub
- **Slack** : #ai-metrics-support
- **Email** : ai-metrics@docucortex.com

### Ressources

- **Wiki** : Documentation technique détaillée
- **API Reference** : Documentation des modules
- **Examples** : Exemples d'utilisation avancés
- **Best Practices** : Guide d'optimisation

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

---

**Développé avec ❤️ par l'équipe DocuCortex**

*Dernière mise à jour : 2025-11-04*