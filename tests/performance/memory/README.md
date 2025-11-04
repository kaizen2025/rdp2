# Système de Détection et Test des Fuites de Mémoire

## 📋 Vue d'ensemble

Ce système complet de tests de mémoire détecte et analyse les fuites de mémoire dans l'application RDP. Il couvre tous les aspects critiques : Node.js/Electron, React, WebSocket, opérations GED, et Electron.

## 🎯 Fonctionnalités

### ✅ Tests de Surveillance Mémoire Heap Node.js/Electron
- Monitoring heap en temps réel
- Détection automatique de fuites
- Seuils d'alerte configurables
- Snapshots heap automatiques

### ✅ Tests de Fuites Composants React
- Détection useEffect non nettoyés
- Surveillance event listeners
- Monitoring références mémoire React
- Profilage composants

### ✅ Tests de Fuites WebSocket et Connexions Persistantes
- Surveillance connexions WebSocket
- Détection leaks IPC
- Tests reconnexions automatiques
- Monitoring activité messages

### ✅ Tests Performance Mémoire GED Massive
- Upload/download gros fichiers
- Streaming et traitement batch
- Cache mémoire optimisé
- Opérations OCR massives

### ✅ Tests Nettoyage Mémoire Electron
- Lifecycle BrowserWindow
- Nettoyage IPC Main
- Event listeners Electron
- Ressources preload

### ✅ Profilage Mémoire Détaillé
- Heap snapshots approfondis
- Analyse tendances mémoire
- Détection patterns de fuites
- Rapports détaillés (JSON, CSV, HTML)

## 🛠️ Installation et Configuration

### Prérequis
```bash
Node.js >= 14.0
Jest >= 27.0
```

### Installation
```bash
cd /workspace/rdp/tests/performance/memory
npm install
```

### Configuration Environnement
```bash
# Nécessaire pour le GC
export NODE_OPTIONS="--expose-gc --max-old-space-size=1024"

# Variables pour tests mémoire
export NODE_ENV="test-memory"
```

## 🚀 Utilisation

### Exécution Complète
```bash
# Avec toutes les options optimales
node --expose-gc ./tests/performance/memory/runMemoryTests.js

# Ou avec npm
npm run test:memory
```

### Exécution Tests Individuels
```bash
# Tests Heap Node.js/Electron
npm test -- nodeElectronHeap.test.js

# Tests Composants React  
npm test -- reactComponentLeaks.test.js

# Tests WebSocket
npm test -- websocketLeaks.test.js

# Tests GED Massive
npm test -- gedMassiveOperations.test.js

# Tests Nettoyage Electron
npm test -- electronWindowCleanup.test.js

# Tests Profilage Détaillé
npm test -- detailedProfiling.test.js
```

### Utilisation Programmée

```javascript
const MemoryMonitor = require('./memoryMonitor');
const { HeapAnalyzer } = require('./heapProfiler');

// Surveillance continue
const monitor = new MemoryMonitor();
monitor.startMonitoring();

// Mesure d'une fonction
const result = await monitor.measureFunctionMemory(
  () => {
    // Votre code ici
    return someFunction();
  },
  'nom-du-test'
);

// Prendre des snapshots
monitor.takeHeapSnapshot('snapshot-manuel');

// Analyser les fuites
const leaks = monitor.detectLeaks();

// Exporter rapport
const reportPath = monitor.saveReport('mon-rapport.json');
```

## 📊 Outils et Intégrations

### Node.js --inspect
```bash
# Débogage heap en temps réel
node --inspect --expose-gc ./app.js

# Chrome DevTools accessible sur chrome://inspect
```

### React DevTools Profiler
```javascript
// Dans l'application React
import { Profiler } from 'react';

<Profiler 
  id="ComponentName" 
  onRender={(id, phase, actualDuration) => {
    console.log('Profilage:', { id, phase, actualDuration });
  }}
>
  <ComponentName />
</Profiler>
```

### Intégration avec le Système RDP

```javascript
// Dans main.js (Electron)
const MemoryMonitor = require('./tests/performance/memory/memoryMonitor');

const monitor = new MemoryMonitor();
monitor.startMonitoring();

// Surveiller les BrowserWindow
app.on('browser-window-created', (event, window) => {
  monitor.takeHeapSnapshot(`window-created-${window.id}`);
});

app.on('browser-window-closed', (event, window) => {
  monitor.takeHeapSnapshot(`window-closed-${window.id}`);
});
```

## 📈 Métriques et Seuils

### Seuils d'Alerte
| Métrique | Warning | Critical |
|----------|---------|----------|
| Heap Used | 100MB | 200MB |
| Heap Total | 150MB | 250MB |
| RSS | 200MB | 300MB |
| Event Loop Lag | 50ms | 100ms |

### Configuration Avancée
```javascript
const { MEMORY_THRESHOLDS, PROFILING_CONFIG } = require('./memory.config');

// Personnaliser les seuils
MEMORY_THRESHOLDS.HEAP_USED.WARNING = 150;
MEMORY_THRESHOLDS.HEAP_USED.CRITICAL = 300;

// Personnaliser le profilage
PROFILING_CONFIG.SNAPSHOT_INTERVAL = 10000; // 10s
PROFILING_CONFIG.HEAP_SAMPLES = 200; // Plus d'échantillons
```

## 🔍 Analyse et Rapports

### Types de Rapports
1. **JSON**: Données structurées pour intégration CI/CD
2. **CSV**: Analyse dans Excel/Sheets
3. **HTML**: Présentation visuelle interactive
4. **Markdown**: Documentation technique

### Exemple de Rapport JSON
```json
{
  "timestamp": "2025-11-04T07:55:33.000Z",
  "summary": {
    "totalTests": 6,
    "passed": 6,
    "failed": 0,
    "passRate": "100%"
  },
  "memory": {
    "final": {
      "heapUsed": 45.2,
      "heapTotal": 78.5,
      "rss": 89.3
    },
    "statistics": {
      "totalHeapImpact": 123.4,
      "averageHeapImpact": 20.6,
      "maxHeapIncrease": 45.2
    }
  },
  "recommendations": [
    {
      "priority": "HIGH",
      "category": "MEMORY_PRESSURE",
      "message": "Utilisation heap critique détectée",
      "action": "Effectuer un nettoyage de mémoire immédiat"
    }
  ]
}
```

## 🚨 Détection de Fuites

### Patterns Détectés
1. **Croissance Continue**: Mémoire augmente sans nettoyage
2. **Accumulation Non Sécurisée**: Plus de 10MB alloués sans nettoyage
3. **Pas de Stabilisation**: Mémoire ne revient pas après opérations
4. **Croissance Exponentielle**: Accélération de l'utilisation mémoire

### Seuils de Détection
```javascript
// Détection croissance continue
if (growthRate > 1024 * 1024) { // 1MB par snapshot
  detectLeak();
}

// Détection accumulation
if (totalGrowth > 10 * 1024 * 1024) { // 10MB total
  alertAccumulation();
}
```

## 🔧 Intégration CI/CD

### GitHub Actions
```yaml
name: Memory Tests
on: [push, pull_request]
jobs:
  memory-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: node --expose-gc ./tests/performance/memory/runMemoryTests.js
      - uses: actions/upload-artifact@v2
        with:
          name: memory-test-report
          path: ./tests/performance/memory/reports/
```

### Jenkins
```groovy
pipeline {
    agent any
    stages {
        stage('Memory Tests') {
            steps {
                sh 'node --expose-gc ./tests/performance/memory/runMemoryTests.js'
            }
            post {
                always {
                    archiveArtifacts artifacts: 'tests/performance/memory/reports/**'
                }
            }
        }
    }
}
```

## 📚 Exemples d'Usage

### Surveillance d'une Fonction
```javascript
async function maFonction() {
  const result = await memoryMonitor.measureFunctionMemory(
    async () => {
      // Votre code
      const data = await fetchLargeData();
      return processData(data);
    },
    'nom-fonction'
  );
  
  console.log(`Croissance mémoire: ${result.memory.increaseFormatted}`);
  return result;
}
```

### Détection de Fuites en Temps Réel
```javascript
const leakDetector = new LeakDetector();

// Pendant l'exécution de votre application
memoryMonitor.on('memoryUpdate', (stats) => {
  if (leakDetector.shouldAlert(stats)) {
    console.warn('⚠️ Alerte mémoire détectée!');
  }
});
```

### Analyse de Trends
```javascript
const trends = heapAnalyzer.analyzeTrends(600000); // 10 minutes
console.log(`Tendance: ${trends.trend} (confiance: ${trends.confidence})`);
```

## 🐛 Dépannage

### Problèmes Courants

**GC non disponible**
```bash
# Solution
node --expose-gc your-script.js
```

**Tests timeout**
```javascript
// Augmenter le timeout dans jest.config.memory.js
testTimeout: 60000 // 60 secondes
```

**Mémoire insuffisante**
```bash
# Augmenter la limite Node.js
export NODE_OPTIONS="--max-old-space-size=2048"
```

### Logs de Débogage
```javascript
// Activer les logs détaillés
process.env.DEBUG_MEMORY_TESTS = 'true';
```

## 📞 Support

Pour toute question ou problème :
1. Vérifiez les logs dans `./tests/performance/memory/logs/`
2. Consultez les rapports générés
3. Utilisez l'inspecteur Node.js pour débogage approfondi

## 🎯 Prochaines Étapes

1. **Intégration Continue**: Intégrer dans la CI/CD
2. **Monitoring Production**: Adapter pour l'environnement production
3. **Alertes Automatiques**: Configurer notifications
4. **Formation Équipe**: Former aux bonnes pratiques mémoire
5. **Optimisation Performance**: Améliorer les algorithmes identifiés comme problématiques

---

*Ce système est conçu pour détecter et prévenir les fuites de mémoire dans l'application RDP. Utilisation recommandée en développement et test, avec adaptation possible pour la production.*