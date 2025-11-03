# Tests du Dashboard - RDS Viewer Anecoop

## Vue d'ensemble

Ce répertoire contient une suite complète de tests automatisés pour le module Dashboard et Analytics de RDS Viewer Anecoop. Les tests couvrent les aspects fonctionnels, d'intégration, de performance et d'accessibilité.

## Structure des fichiers

```
src/tests/
├── __mocks__/
│   ├── mockDashboardData.js          # Données mock réalistes
│   ├── dashboardMocks.js             # Mocks des services et bibliothèques
│   └── setupDashboardTests.js        # Configuration spécialisée
├── dashboard.test.js                 # Tests unitaires
├── dashboard-integration.test.js     # Tests d'intégration
├── dashboard-performance.test.js     # Tests de performance
├── jest.config.dashboard.js          # Configuration Jest spécialisée
└── package-additions.json           # Ajouts pour package.json

docs/
└── TESTS_DASHBOARD.md               # Documentation complète

scripts/
└── test-dashboard.sh               # Script bash pour l'exécution
```

## Types de tests

### 1. Tests unitaires (`dashboard.test.js`)
Testent chaque composant individuellement :
- ✅ `ActivityHeatmap` - Carte thermique d'activité
- ✅ `TopUsersWidget` - Widget des top utilisateurs
- ✅ `DashboardExport` - Export des données
- ✅ `DashboardFilters` - Filtres temporels
- ✅ `DashboardWidgets` - Gestion des widgets
- ✅ `DashboardPage` - Page principale

### 2. Tests d'intégration (`dashboard-integration.test.js`)
Testent les interactions entre composants :
- ✅ Flux de données complets
- ✅ Navigation entre composants
- ✅ Gestion des états de chargement
- ✅ Workflows utilisateur complets
- ✅ Tests d'accessibilité
- ✅ Responsive design

### 3. Tests de performance (`dashboard-performance.test.js`)
Mesurent les performances :
- ✅ Temps de rendu (< 500ms)
- ✅ Calculs statistiques (< 50ms)
- ✅ Traitement de données volumineuses
- ✅ Gestion mémoire
- ✅ Scalabilité
- ✅ Benchmarks de référence

## Installation et configuration

### 1. Installer les dépendances

```bash
# Dépendances principales pour les tests
npm install --save-dev \
  @testing-library/jest-dom \
  @testing-library/react \
  @testing-library/user-event \
  jest \
  jest-environment-jsdom \
  jest-junit \
  babel-jest \
  @babel/preset-env \
  @babel/preset-react

# Dépendances supplémentaires
npm install --save-dev \
  enzyme-to-json \
  jsdom
```

### 2. Configuration Babel

Créer `.babelrc` ou `babel.config.js` :

```json
{
  "presets": [
    ["@babel/preset-env", { "targets": { "node": "current" } }],
    ["@babel/preset-react", { "runtime": "automatic" }]
  ]
}
```

### 3. Copier la configuration Jest

La configuration est dans `src/tests/jest.config.dashboard.js`

### 4. Ajouter les scripts npm

Copier les scripts de `src/tests/package-additions.json` dans le `package.json`

### 5. Rendre le script bash exécutable

```bash
chmod +x scripts/test-dashboard.sh
```

## Exécution des tests

### Scripts npm (recommandés)

```bash
# Tous les tests du dashboard
npm run test:dashboard

# Tests unitaires uniquement
npm run test:dashboard:unit

# Tests d'intégration uniquement
npm run test:dashboard:integration

# Tests de performance uniquement
npm run test:dashboard:performance

# Tests avec couverture
npm run test:dashboard:coverage

# Mode watch pour développement
npm run test:dashboard:watch

# Tests spécifiques
npm run test:dashboard:export      # Tests d'export
npm run test:dashboard:filters     # Tests de filtres
npm run test:dashboard:widgets     # Tests de widgets
npm run test:dashboard:a11y        # Tests d'accessibilité
npm run test:dashboard:responsive  # Tests responsive
```

### Script bash

```bash
# Utilisation de base
./scripts/test-dashboard.sh

# Options disponibles
./scripts/test-dashboard.sh --unit                    # Tests unitaires
./scripts/test-dashboard.sh --integration             # Tests d'intégration
./scripts/test-dashboard.sh --performance             # Tests de performance
./scripts/test-dashboard.sh --all                     # Tous les tests
./scripts/test-dashboard.sh --all --coverage          # Avec couverture
./scripts/test-dashboard.sh --unit --watch            # Mode watch
./scripts/test-dashboard.sh --performance --debug     # Mode debug

# Filtrage des tests
./scripts/test-dashboard.sh --unit --filter "Heatmap"
```

### Jest direct

```bash
# Tous les tests dashboard
npm test -- --testPathPattern='dashboard.*\\.test\\.js'

# Tests unitaires
npm test -- dashboard.test.js

# Tests avec couverture
npm test -- --coverage --testPathPattern='dashboard.*\\.test\\.js'

# Mode watch
npm test -- --watch --testPathPattern='dashboard'

# Filtrage par nom de test
npm test -- --testNamePattern="ActivityHeatmap"
```

## Scénarios de test

### Scénario 1 : Chargement normal
```bash
npm run test:dashboard:unit
```
Vérifie :
- Rendu correct avec données valides
- Calculs statistiques corrects
- Affichage des widgets
- Navigation fonctionnelle

### Scénario 2 : Gestion d'erreurs
```bash
npm run test:dashboard:integration
```
Vérifie :
- Données vides → affichage gracieux
- Erreurs serveur → pas de crash
- Données corrompues → validation

### Scénario 3 : Performance
```bash
npm run test:dashboard:performance
```
Vérifie :
- Rendu < 500ms
- 1000 prêts < 1000ms
- Mémoire stable
- Pas de fuites

### Scénario 4 : Accessibilité
```bash
npm run test:dashboard:a11y
```
Vérifie :
- Navigation clavier
- Attributs ARIA
- Contraste des couleurs

### Scénario 5 : Responsive
```bash
npm run test:dashboard:responsive
```
Vérifie :
- Adaptation mobile/tablet/desktop
- Layout responsive
- Navigation mobile

## Métriques de qualité

### Couverture de code
- **Objectif :** ≥ 85% lignes, ≥ 80% branches
- **Mesure :** `npm run test:dashboard:coverage`
- **Rapport :** `coverage/dashboard/lcov-report/index.html`

### Performance
- **Rendu initial :** < 500ms
- **Calculs :** < 50ms
- **Interactions :** < 200ms
- **Export :** < 500ms

### Fiabilité
- **Tests unitaires :** 100% des composants critiques
- **Tests d'intégration :** Tous les workflows principaux
- **Tests de performance :** Seuils définis pour chaque opération

## Développement

### Ajouter un nouveau test

1. **Identifier le type :** unitaire / intégration / performance
2. **Créer le test :**
   ```javascript
   describe('NouveauComposant', () => {
     test('devrait faire quelque chose', () => {
       // Arrange
       // Act
       // Assert
     });
   });
   ```
3. **Ajouter les mocks nécessaires :**
   ```javascript
   // Dans __mocks__/dashboardMocks.js
   export const mockNouveauComposant = () => <div>NouveauComposant</div>;
   ```
4. **Mettre à jour la documentation**

### Modifier un test existant

1. Identifier le fichier de test approprié
2. Modifier le scénario de test
3. Mettre à jour les mocks si nécessaire
4. Vérifier la couverture
5. Exécuter tous les tests : `npm run test:dashboard`

### Debugger les tests

```bash
# Mode debug avec output verbeux
npm run test:dashboard:debug

# Test spécifique avec pattern
npm test -- --testNamePattern="ActivityHeatmap" --verbose

# Tests de performance avec timing détaillé
PERFORMANCE_TESTS=true npm test -- dashboard-performance.test.js --verbose
```

## CI/CD Integration

### GitHub Actions exemple

```yaml
name: Dashboard Tests

on: [push, pull_request]

jobs:
  dashboard-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run dashboard tests
        run: npm run test:dashboard:ci
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: dashboard
```

### Jenkins exemple

```groovy
pipeline {
    agent any
    
    stages {
        stage('Dashboard Tests') {
            steps {
                sh 'npm ci'
                sh 'npm run test:dashboard:ci'
            }
            post {
                always {
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'coverage/dashboard/lcov-report',
                        reportFiles: 'index.html',
                        reportName: 'Dashboard Coverage Report'
                    ])
                }
            }
        }
    }
}
```

## Troubleshooting

### Problèmes courants

#### Tests qui échouent sporadiquement
```bash
# Augmenter le timeout
npm test -- --testTimeout=30000

# Mode séquentiel pour les tests de performance
npm test -- dashboard-performance.test.js --runInBand
```

#### Problèmes de mocks
```bash
# Nettoyer les caches
rm -rf node_modules/.cache
npm test -- --clearCache

# Réinitialiser les mocks
npm test -- --resetMocks
```

#### Problèmes de couverture
```bash
# Ignorer les fichiers de test
# Vérifier jest.config.dashboard.js
# S'assurer que collectCoverageFrom est correct
```

### Commandes de diagnostic

```bash
# Vérifier la configuration Jest
npm test -- --showConfig

# Lister les tests trouvés
npm test -- --listTests | grep dashboard

# Vérifier la couverture détaillée
npm test -- --coverage --coverageReporters=text-summary
```

## Maintenance

### Routines régulières

1. **À chaque commit :** Exécuter `npm run test:dashboard:unit`
2. **Avant release :** Exécuter `npm run test:dashboard:validate`
3. **Hebdomadaire :** Analyser les métriques de performance
4. **Mensuelle :** Réviser et mettre à jour les mocks

### Mise à jour des tests

1. **Nouveau composant :** Ajouter tests unitaires + intégration
2. **Nouvelle fonctionnalité :** Ajouter tests spécifiques + performance
3. **Changement d'API :** Mettre à jour mocks + tests
4. **Problème utilisateur :** Ajouter test de régression

### Documentation

- Maintenir `docs/TESTS_DASHBOARD.md` à jour
- Documenter les nouvelles métriques de performance
- Mettre à jour les exemples d'utilisation

## Support

Pour questions ou problèmes :
1. Consulter la documentation : `docs/TESTS_DASHBOARD.md`
2. Vérifier les logs de test
3. Utiliser les modes debug
4. Créer un issue avec :
   - Configuration système
   - Commandes exécutées
   - Logs d'erreur
   - Tests qui échouent

---

**Dernière mise à jour :** 2024-11-04  
**Version :** 1.0.0  
**Responsables :** Équipe QA / Développement Frontend