# README - Tests d'Inventaire RDS Viewer Anecoop

## 🚀 Démarrage Rapide

### Exécution Simple
```bash
# Tous les tests d'inventaire
npm test -- --testPathPattern="inventory"

# Via le script personnalisé
bash src/tests/run-inventory-tests.sh --all
```

### Tests Rapides
```bash
# Tests unitaires uniquement
npm test -- --testPathPattern="inventory.test.js"

# Tests d'intégration
npm test -- --testPathPattern="inventory-integration.test.js"

# Tests de performance
npm test -- --testPathPattern="inventory-performance.test.js"
```

## 📁 Structure de la Suite de Tests

```
src/tests/
├── inventory.test.js                    # Tests unitaires (822 lignes)
├── inventory-integration.test.js        # Tests d'intégration (831 lignes)
├── inventory-performance.test.js        # Tests de performance (763 lignes)
├── inventory-setup.js                   # Setup spécifique inventaire (488 lignes)
├── jest.config.inventory.js             # Configuration Jest (172 lignes)
├── run-inventory-tests.sh               # Script d'exécution (360 lignes)
└── __mocks__/
    └── inventoryData.js                 # Données mockées (683 lignes)
```

## 🎯 Composants Couverts

### ✅ EquipmentPhotoUpload
- Upload drag & drop
- Validation fichiers (PNG, JPG, JPEG, GIF, WEBP)
- Limite 5MB par photo
- Prévisualisation
- Gestion erreurs
- Nettoyage URLs

### ✅ EquipmentAlerts  
- Alertes garantie expirée
- Alertes maintenance requise
- Tri par sévérité
- Statistiques temps réel

### ✅ ComputersPage
- CRUD complet
- Recherche multi-champs
- Filtres (statut, localisation, marque)
- Vues multiple (cartes, liste)
- Gestion prêts
- Historique modifications
- Statistiques dashboard

## 📊 Couverture de Tests

| Type de Test | Fichier | Tests | Couverture Cible |
|-------------|---------|-------|------------------|
| Unitaire | `inventory.test.js` | 31 tests | 90% |
| Intégration | `inventory-integration.test.js` | 25 tests | 85% |
| Performance | `inventory-performance.test.js` | 20 tests | 80% |
| **TOTAL** | | **76 tests** | **85%** |

## ⚡ Métriques de Performance

### Benchmarks Cibles
- **Rendu 10 éléments**: < 100ms
- **Rendu 1000 éléments**: < 1500ms  
- **Filtrage 1000 éléments**: < 200ms
- **API liste**: < 500ms
- **Upload photos**: < 3s (5 photos)

### Datasets de Test
- **Petit**: 10 éléments
- **Moyen**: 100 éléments  
- **Gros**: 1000 éléments
- **XL**: 5000 éléments

## 🛠️ Utilisation du Script

### Script d'Exécution Principal
```bash
# Rendre exécutable (si nécessaire)
chmod +x src/tests/run-inventory-tests.sh

# Exécuter
bash src/tests/run-inventory-tests.sh [OPTIONS]
```

### Options Disponibles
```bash
# Aide
bash src/tests/run-inventory-tests.sh --help

# Tests unitaires
bash src/tests/run-inventory-tests.sh --unit

# Tests d'intégration
bash src/tests/run-inventory-tests.sh --integration

# Tests de performance
bash src/tests/run-inventory-tests.sh --performance

# Tous les tests
bash src/tests/run-inventory-tests.sh --all

# Avec couverture
bash src/tests/run-inventory-tests.sh --coverage

# Mode watch (développement)
bash src/tests/run-inventory-tests.sh --watch

# Mode verbeux
bash src/tests/run-inventory-tests.sh --verbose

# Mode debug
bash src/tests/run-inventory-tests.sh --debug
```

## 📋 Exemples Pratiques

### Test d'un Composant Spécifique
```javascript
// Test spécifique EquipmentPhotoUpload
npm test -- --testPathPattern="inventory.test.js" --testNamePattern="EquipmentPhotoUpload"

// Test d'un cas particulier
npm test -- --testPathPattern="inventory.test.js" --testNamePattern="devrait uploader les photos avec succès"
```

### Tests avec Debug
```bash
# Activer le debug
DEBUG_TESTS=true npm test -- --testPathPattern="inventory"

// Avec logs détaillés
npm test -- --testPathPattern="inventory" --verbose
```

### Tests de Performance
```bash
# Tests de performance uniquement
npm test -- --testPathPattern="inventory-performance.test.js"

# Avec profilage mémoire
node --expose-gc npm test -- --testPathPattern="inventory-performance"
```

## 📈 Rapports Générés

### Fichiers de Sortie
```
test-results/
├── inventory-junit.xml      # Rapport JUnit
└── inventory-report.html    # Rapport HTML

coverage/
├── lcov-report/             # Rapport de couverture
│   └── index.html
└── coverage-final.json      # Données de couverture
```

### Métriques de Couverture
```bash
# Générer rapport complet
npm test -- --testPathPattern="inventory" --coverage --coverageReporters=html

# Voir le rapport HTML
open coverage/lcov-report/index.html
```

## 🎮 Scénarios de Test Principaux

### 1. Upload Multi-Photos
```bash
# Test du workflow complet d'upload
bash src/tests/run-inventory-tests.sh --unit --verbose
```
**Scénario** : Drag & drop 3 photos → Validation → Prévisualisation → Upload → Nettoyage

### 2. Recherche Rapide  
```bash
# Test de performance de recherche
bash src/tests/run-inventory-tests.sh --performance
```
**Scénario** : 1000 éléments → Recherche "Dell" → Filtres combinés → < 200ms

### 3. Workflow Complet
```bash
# Test d'intégration
bash src/tests/run-inventory-tests.sh --integration
```
**Scénario** : Ajouter PC → Upload photos → Créer prêt → Maintenance → Historique

## 🔧 Configuration Avancée

### Variables d'Environnement
```bash
# Tests de performance
export PERFORMANCE_TESTS=true

# Debug détaillé
export DEBUG_TESTS=true

# Mode CI
export CI=true

#Taille des datasets
export PERFORMANCE_DATA_SIZE=small|medium|large|xlarge
```

### Configuration Jest Personnalisée
```bash
# Utiliser la config spécifique
npm test -- --config=src/tests/jest.config.inventory.js

# Avec options spécifiques
npm test -- --testPathPattern="inventory" --maxWorkers=2
```

## 🚨 Dépannage

### Problèmes Courants

#### 1. Erreurs de Module
```bash
# Nettoyer le cache
rm -rf node_modules/.cache
rm -rf coverage

# Réinstaller les dépendances
npm install
```

#### 2. Tests Lents
```bash
# Réduire le nombre de workers
npm test -- --testPathPattern="inventory" --maxWorkers=1

# Tests séquentiels
npm test -- --testPathPattern="inventory" --runInBand
```

#### 3. Problèmes de Couverture
```bash
# Ignorer certains fichiers
npm test -- --testPathPattern="inventory" --collectCoverageFrom="!src/tests/**/*.js"
```

### Debug Avancé
```javascript
// Dans un test spécifique
screen.debug(); // Affiche le DOM

// Logs personnalisés
console.log('Debug state:', componentState);

// Mesure de performance
const start = performance.now();
// ... action
const duration = performance.now() - start;
console.log(`Action took ${duration}ms`);
```

## 📞 Support et Maintenance

### Commandes de Maintenance
```bash
# Vérifier la syntaxe
npm run lint

# Tests de régression
bash src/tests/run-inventory-tests.sh --all --coverage

# Nettoyage complet
rm -rf test-results/ coverage/ node_modules/.cache/
```

### Mise à Jour
```bash
# Mettre à jour les snapshots
npm test -- --testPathPattern="inventory" -u

# Mettre à jour les mocks
# Modifier src/tests/__mocks__/inventoryData.js
```

### Monitoring Continu
```bash
# Intégration dans CI/CD
# .github/workflows/inventory-tests.yml
- name: Run Inventory Tests
  run: bash src/tests/run-inventory-tests.sh --all --coverage
  env:
    CI: true
```

## 🎯 Objectifs de Qualité

### Seuils de Réussite
- **Couverture**: ≥ 80%
- **Tests unitaires**: 100% verts  
- **Tests d'intégration**: 95% verts
- **Performance**: Tous les benchmarks respectés
- **Accessibilité**: Niveau AA

### KPIs de Performance
- **Rendu initial**: < 500ms (1000 éléments)
- **Filtrage**: < 200ms (1000 éléments)
- **Recherche**: < 150ms (1000 éléments)
- **Mémoire**: < 50MB (2000 éléments)

---

**🎉 La suite de tests d'inventaire est maintenant complète et opérationnelle!**

Pour plus de détails, consultez la [documentation complète](docs/TESTS_INVENTAIRE.md).
