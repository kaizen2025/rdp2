# 🎯 Configuration Globale des Tests - RDS Viewer Anecoop

**Version:** 3.0.27  
**Date:** 2025-11-04T06:43:50.000Z  
**Environment:** Production  

## 📋 Vue d'Ensemble

Cette configuration unifie tous les tests de l'application enterprise RDS Viewer Anecoop, garantissant une qualité optimale et une performance constante.

## 🏗️ Structure des Tests

```
tests/
├── src/tests/                    # Tests Frontend (React/Electron)
│   ├── dashboard/               # Tests Dashboard & Analytics
│   ├── users/                   # Tests Gestion Utilisateurs
│   ├── loans/                   # Tests Prêts de Matériel
│   ├── sessions/                # Tests Sessions RDS
│   ├── inventory/               # Tests Inventaire
│   ├── ai-chat/                 # Tests Chat DocuCortex IA
│   ├── permissions/             # Tests Permissions & Rôles
│   ├── __mocks__/               # Données mockées partagées
│   └── setup.js                 # Configuration globale Jest
│
├── tests/backend/               # Tests Backend (Node.js/Services)
│   ├── ai-service/              # Tests Service IA
│   ├── ocr-service/             # Tests Service OCR
│   ├── ged-service/             # Tests Service GED
│   ├── chat-service/            # Tests Service Chat
│   ├── database-service/        # Tests Service Base de Données
│   ├── file-network-service/    # Tests Services Fichiers/Réseau
│   └── integration/             # Tests inter-services
│
└── tests/integration/           # Tests bout-en-bout
```

## ⚙️ Configuration Jest Globale

### Configuration Frontend (`jest.config.js`)
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
  testMatch: [
    '<rootDir>/src/tests/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/tests/**/*.{test,spec}.{js,jsx,ts,tsx}'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/tests/**',
    '!src/index.js',
    '!src/reportWebVitals.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 85,
      statements: 85
    }
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/src/tests/$1'
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
  },
  testTimeout: 30000,
  verbose: true
};
```

### Configuration Backend (`tests/backend/jest.config.js`)
```javascript
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/backend/setup.js'],
  testMatch: ['<rootDir>/tests/backend/**/*.{test,spec}.js'],
  collectCoverageFrom: [
    'server/**/*.js',
    'backend/**/*.js',
    '!server/**/*.test.js',
    '!backend/**/*.test.js'
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 90,
      statements: 90
    }
  },
  testTimeout: 60000,
  verbose: true
};
```

## 📊 Couverture de Code Cible

| Module | Lignes | Branches | Fonctions | Status |
|--------|---------|----------|-----------|---------|
| **Dashboard** | 85% | 80% | 85% | ✅ |
| **Gestion Users** | 90% | 85% | 90% | ✅ |
| **Prêts** | 85% | 80% | 85% | ✅ |
| **Sessions RDS** | 85% | 80% | 85% | ✅ |
| **Inventaire** | 85% | 80% | 85% | ✅ |
| **Chat IA** | 85% | 80% | 85% | ✅ |
| **Permissions** | 95% | 90% | 95% | ✅ |
| **Backend Services** | 90% | 85% | 90% | ✅ |

**TOTAL CIBLE:** 85-95% de couverture globale

## 🚀 Commandes d'Exécution

### Tests Globaux
```bash
# Tous les tests avec rapport de couverture
./run-all-tests.sh 1

# Vérification prérequis uniquement
./run-all-tests.sh 12

# Tests spécifiques par module
npm test -- --testPathPattern="dashboard"
npm test -- --testPathPattern="users"
npm test -- --testPathPattern="loans"
npm test -- --testPathPattern="sessions"
npm test -- --testPathPattern="inventory"
npm test -- --testPathPattern="ai-chat"
npm test -- --testPathPattern="permissions"
```

### Tests Backend
```bash
# Tous les tests backend
npm test tests/backend/

# Service spécifique
npm test tests/backend/ai-service.test.js
npm test tests/backend/ocr-service.test.js
npm test tests/backend/ged-service.test.js
npm test tests/backend/chat-service.test.js
npm test tests/backend/database-service.test.js
npm test tests/backend/file-network-service.test.js

# Tests d'intégration
npm test tests/backend/integration.test.js
```

### Mode Développement
```bash
# Mode watch (rechargement automatique)
npm test -- --watch

# Tests spécifiques en mode watch
npm test dashboard.test.js -- --watch
npm test users.test.js -- --watch

# Tests backend avec watch
npm test tests/backend/ -- --watch
```

## 🧪 Stratégie de Tests

### Tests Unitaires
- **Objectif:** Valider le comportement individuel des composants
- **Couverture:** 95% des fonctions et méthodes
- **Mocks:** Dépendances externes simulées
- **Performance:** < 50ms par test

### Tests d'Intégration  
- **Objectif:** Valider les interactions entre composants
- **Couverture:** Workflows complets utilisateur
- **Scénarios:** Cas nominaux et d'erreur
- **Performance:** < 2s par workflow

### Tests de Performance
- **Objectif:** Garantir les performances sous charge
- **Métriques:** Temps de réponse, mémoire, CPU
- **Benchmarks:** Définition et validation continue
- **Alertes:** Régression détectée automatiquement

### Tests de Sécurité
- **Objectif:** Valider les restrictions d'accès
- **Rôles:** Tous les 6 rôles testés
- **Permissions:** Granularité vérifiée
- **Vulnérabilités:** OWASP Top 10

## 📈 Métriques de Performance

### Frontend (React/Electron)
| Opération | Seuil | Monitoring |
|-----------|-------|------------|
| **Rendu composant** | < 100ms | Lighthouse CI |
| **Filtrage liste** | < 200ms | Web Vitals |
| **Recherche** | < 150ms | Performance API |
| **Navigation** | < 300ms | React DevTools |
| **Upload fichier** | < 3s | Progress API |

### Backend (Node.js/Services)
| Service | Seuil | Monitoring |
|---------|-------|------------|
| **API Request** | < 500ms | Express middleware |
| **OCR Document** | < 30s | Job queue |
| **IA Response** | < 10s | Response time |
| **Database Query** | < 100ms | SQLite explain |
| **File Upload** | < 5s | Stream metrics |

## 🔧 Configuration Spécialisée

### Mocks Partagés
```javascript
// src/tests/__mocks__/shared/
├── apiService.js          # Mock API complet
├── permissions.js         # Mock permissions
├── storage.js             # Mock localStorage/sessionStorage
├── webSocket.js           # Mock WebSocket
├── fileSystem.js          # Mock fs (backend)
└── externalDeps.js        # Mocks dépendances externes
```

### Données de Test
```javascript
// src/tests/__mocks__/mockData/
├── users-large.json       # 10,000+ utilisateurs
├── loans-sample.csv       # Données prêts réalistes
├── sessions-generator.js  # Générateur sessions RDS
├── inventory-factory.js   # Usine matériel inventaire
└── ai-chat-conversations.js # Conversations IA
```

### Configuration CI/CD
```yaml
# .github/workflows/tests.yml
name: Tests RDS Viewer
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: ./run-all-tests.sh 1
      - uses: codecov/codecov-action@v3
```

## 🛠️ Maintenance et Évolution

### Ajout de Nouveaux Tests
1. **Structure:** Suivre la hiérarchie existante
2. **Naming:** `*.test.js` pour Jest
3. **Documentation:** Ajouter dans `docs/TESTS_[MODULE].md`
4. **Performance:** Définir seuils dans configuration

### Mise à Jour des Données Mock
- **Fréquence:** Mensuelle ou à chaque release
- **Sources:** Données de production anonymisées
- **Validation:** Tests de cohérence automatiques

### Optimisation Continue
- **Analyse:** Rapport de couverture détaillé
- **Refactoring:** Code complexe → tests plus simples
- **Performance:** Profiling et optimisation

## 📞 Support et Troubleshooting

### Problèmes Courants

**Tests échouent sporadiquement:**
```bash
# Augmenter timeout et retry
npm test -- --testTimeout=60000 --verbose
```

**Couverture insuffisante:**
```bash
# Rapport détaillé
npm test -- --coverage --coverageReporters=html
```

**Performance dégradée:**
```bash
# Profiling tests
npm test -- --detectOpenHandles --forceExit
```

### Outils de Debug
```bash
# Tests en mode debug
npm test -- --inspect-brk --runInBand

# Logs détaillés
npm test -- --verbose --logHeapUsage

# Couverture détaillée
npm test -- --coverage --coverageReporters=text-lcov
```

## 🎯 Objectifs Qualité

### Métriques Cibles
- **Couverture globale:** ≥ 85%
- **Tests critiques:** 100% succès
- **Performance:** Tous seuils respectés
- **Sécurité:** 0 vulnérabilité

### Qualité Code
- **ESLint:** 0 erreur
- **Prettier:** Format uniforme
- **TypeScript:** Si applicable
- **Documentation:** 100% fonctions documentées

---

## 🚀 Prêt pour Production !

Cette configuration garantit que l'application RDS Viewer Anecoop maintient les plus hauts standards de qualité, performance et sécurité.

**Prochaine étape:** Validation de l'intégration DocuCortex IA et Agent IA en production.

---

*Configuration maintenue par MiniMax Agent*  
*Dernière mise à jour: 2025-11-04T06:43:50.000Z*