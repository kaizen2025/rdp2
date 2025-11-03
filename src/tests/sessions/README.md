# Tests Sessions RDS

Suite de tests complète pour le module Sessions RDS du RDS Viewer Anecoop.

## Démarrage rapide

### Exécution des tests

```bash
# Tous les tests
npm test src/tests/sessions/

# Un type de test spécifique
npm test src/tests/sessions/sessions.test.js
npm test src/tests/sessions/sessions-integration.test.js
npm test src/tests/sessions/sessions-performance.test.js

# Avec couverture
npm test src/tests/sessions/ -- --coverage
```

### Script d'aide

```bash
# Rendre exécutable (si autorisé)
chmod +x run-tests-sessions.sh

# Utiliser le script
./run-tests-sessions.sh all
./run-tests-sessions.sh performance
./run-tests-sessions.sh coverage
```

## Structure des tests

```
src/tests/sessions/
├── sessions.test.js              # Tests unitaires (599 lignes)
├── sessions-integration.test.js  # Tests d'intégration (661 lignes)
├── sessions-performance.test.js  # Tests de performance (699 lignes)
├── mockData.js                   # Données de test (401 lignes)
├── setup.js                      # Configuration des tests (370 lignes)
├── matchers.js                   # Matchers personnalisés (325 lignes)
└── jest.config.js               # Configuration Jest (196 lignes)
```

## Types de tests

### Tests unitaires (`sessions.test.js`)

**SessionsPage :**
- ✅ Affichage des statistiques (actives, déconnectées, serveurs, utilisateurs)
- ✅ Filtrage par utilisateur et serveur
- ✅ Actions : shadow, connexion RDP, messages, informations
- ✅ États vides et recherche sans résultats
- ✅ Gestion des sessions groupées par utilisateur

**SessionsTimeline :**
- ✅ Rendu avec données de sessions
- ✅ Génération de données simulées
- ✅ Changement type de graphique (ligne/zone)
- ✅ Affichage des statistiques (actuel, max, moyenne)
- ✅ Tooltip au survol

**SessionAlerts :**
- ✅ Détection sessions longues (> 24h, > 72h)
- ✅ Détection serveurs surchargés (CPU/RAM > 80%)
- ✅ Détection sessions simultanées excessives (> 50)
- ✅ Interface : couleurs, icônes, suppression
- ✅ Gestion robuste des données manquantes

**GroupedUserRow :**
- ✅ Affichage informations utilisateur
- ✅ Calcul durée de session
- ✅ États actif/inactif
- ✅ Actions disponibles

**Performance :**
- ✅ Rendu avec 100 sessions (benchmark)
- ✅ Timeline avec beaucoup de données

### Tests d'intégration (`sessions-integration.test.js`)

**Flux de travail :**
- ✅ Cycle complet : affichage → filtrage → action → rafraîchissement
- ✅ Shadow session avec notifications
- ✅ Connexion RDP avec/sans mot de passe
- ✅ Messages globaux et individuels

**Intégration composants :**
- ✅ Timeline et alertes mises à jour ensemble
- ✅ Réactivité des composants entre eux

**Gestion d'erreurs :**
- ✅ Sessions avec données incomplètes
- ✅ Serveurs sans métriques
- ✅ Données vides
- ✅ Erreurs réseau
- ✅ Sessions inactives (shadow bloqué)

**Multi-utilisateurs :**
- ✅ Groupement correct des sessions par utilisateur
- ✅ Affichage serveurs multiples pour un utilisateur

**Performance en charge :**
- ✅ 500 sessions simultanées
- ✅ 200 sessions dans timeline
- ✅ Filtrage avec beaucoup de résultats

**Messages et notifications :**
- ✅ Dialogue message global
- ✅ Messages utilisateurs spécifiques

**Scénarios réels :**
- ✅ Administrateur surveille les sessions
- ✅ Technicien démarre session RDP
- ✅ Superviseur envoie annonce

### Tests de performance (`sessions-performance.test.js`)

**Performance de rendu :**
- ✅ SessionsPage 50 sessions : < 500ms
- ✅ SessionsPage 200 sessions : < 1.5s
- ✅ SessionsPage 500 sessions : < 3s
- ✅ SessionsTimeline 300 sessions : < 800ms
- ✅ SessionAlerts 400 sessions + 20 serveurs : < 1s

**Performance interactions :**
- ✅ Filtrage utilisateur 300 sessions : < 200ms
- ✅ Changement serveur 250 sessions : < 300ms
- ✅ Rafraîchissement : < 500ms
- ✅ Changement type graphique : < 200ms

**Consommation mémoire :**
- ✅ Gestion efficace avec 800 sessions
- ✅ Pas de fuite mémoire lors des re-rendus
- ✅ Cleanup des event listeners

**Optimisations React :**
- ✅ useMemo pour calculs coûteux
- ✅ Éviter re-rendus inutiles
- ✅ Clés correctes pour éviter reconstruction DOM

**Performance graphiques :**
- ✅ SessionsTimeline mise à jour rapide 150 sessions : < 600ms
- ✅ Changement type graphique : < 200ms

**Scénarios de charge :**
- ✅ 1000 sessions simultanées : < 5s
- ✅ 600 sessions + 30 serveurs : < 1.2s
- ✅ Filtrage large 800 sessions : < 300ms

**Métriques temps réel :**
- ✅ API Performance measurements
- ✅ Surveillance mémoire JavaScript

**Optimisations de code :**
- ✅ Éviter allocations inutiles dans boucles
- ✅ Performance : temps + mémoire < seuils

**Régression performance :**
- ✅ Baseline 100 sessions : < 1s
- ✅ Pas de régression avec nouvelles fonctionnalités

## Données de mock

### Sessions RDS

```javascript
// Session active normale (2h)
{
  id: 'sess-001',
  sessionId: '1',
  username: 'alice.martin',
  displayName: 'Alice Martin',
  server: 'RDS-SERVER-01',
  isActive: true,
  startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  endTime: null,
  clientAddress: '192.168.1.45',
  protocol: 'RDP'
}

// Session longue durée (26h)
{
  id: 'sess-004',
  username: 'david.petit',
  startTime: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  // ... autres propriétés
}

// Session critique (45h)
{
  id: 'sess-005',
  username: 'eva.rousseau',
  startTime: new Date(Date.now() - 45 * 60 * 60 * 1000).toISOString(),
  // ... autres propriétés
}
```

### Serveurs

```javascript
// Serveur normal
{
  id: 'server-001',
  name: 'RDS-SERVER-01',
  metrics: { cpu: 65, memory: 72, disk: 45, sessions: 25 }
}

// Serveur surchargé (CPU)
{
  id: 'server-002',
  name: 'RDS-SERVER-02',
  metrics: { cpu: 85, memory: 78, disk: 52, sessions: 42 }
}

// Serveur surchargé (RAM)
{
  id: 'server-003',
  name: 'RDS-SERVER-03',
  metrics: { cpu: 45, memory: 90, disk: 38, sessions: 38 }
}

// Serveur avec trop de sessions
{
  id: 'server-005',
  name: 'RDS-SERVER-OVERLOADED',
  metrics: { cpu: 95, memory: 92, disk: 65, sessions: 55 }
}
```

### Utilisateurs

```javascript
// Utilisateur avec mot de passe
{
  username: 'alice.martin',
  displayName: 'Alice Martin',
  department: 'Comptabilité',
  email: 'alice.martin@anecoop.com',
  password: 'password123'
}

// Utilisateur sans mot de passe
{
  username: 'david.petit',
  displayName: 'David Petit',
  department: 'IT',
  email: 'david.petit@anecoop.com',
  password: null
}
```

### Génération de données

```javascript
// Générer 100 sessions aléatoires
const sessions = generateMockSessions(100);

// Session avec propriétés personnalisées
const session = mockActiveSessions[0];

// Serveur surchargé
const server = mockOverloadedServer;
```

## Configuration

### Jest (jest.config.js)

- **Patterns de test** : `src/tests/sessions/**/*.test.js`
- **Setup files** : `setup.js`, `matchers.js`
- **Transformations** : babel-jest, ts-jest
- **Mocks** : fileMock.js, Material-UI, Recharts, date-fns
- **Couverture** : 80% global, 90-95% modules critiques
- **Timeout** : 10s default, 60s tests longs, 120s performance
- **Reporters** : default, junit, html-reporters

### Setup (setup.js)

- **Timers** : fakeTimers pour tests déterministes
- **Date** : Date fixe (2025-01-15 10:30:00 UTC)
- **Mock APIs** : fetch, localStorage, sessionStorage
- **Mock Material-UI** : icônes et composants
- **Mock Recharts** : composants graphiques
- **Event Listeners** : addEventListener/removeEventListener mocks
- **Performance API** : mark, measure, getEntriesByType
- **Helpers** : createMockSession, createMockServer, waitFor, measureExecutionTime

### Matchers personnalisés (matchers.js)

```javascript
// Assertions sessions RDS
expect(session).toBeValidRdsSession();
expect(session).toBeActive();
expect(session).toBeInactive();
expect(session).toHaveDurationLongerThan(24);
expect(server).toBeOverloaded({ cpu: 80, memory: 80 });
expect(server).toHaveValidServerMetrics();

// Assertions alertes
expect(alert).toBeValidAlert();
expect(alert).toBeOfAlertType('long_session');

// Assertions interface
expect(element).toBeVisibleInDom();

// Assertions données
expect(ip).toBeValidIpAddress();
expect(username).toBeValidUsername();
expect(serverName).toBeValidServerName();

// Assertions perf
expect(number).toBeWithinRange(min, max);
expect(date).toBeInThePast();
expect(date).toBeInTheFuture();
```

## Scénarios de test

### 1. Session normale
**Données** : Session active 2-4h, serveur normal
**Validation** :
- ✅ Affichage correct avec statut "Actif"
- ✅ Durée calculée (XXh XXm)
- ✅ Actions disponibles (shadow, RDP, message)
- ✅ Aucune alerte

### 2. Alerte session longue
**Données** : Session active 26h+ ou 72h+
**Validation** :
- ✅ Alerte "Session longue durée"
- ✅ Sévérité : warning (26h), error (72h)
- ✅ Message avec durée calculée
- ✅ Icône TimeIcon

### 3. Alerte serveur surchargé
**Données** : CPU > 80% ou RAM > 80%
**Validation** :
- ✅ Alerte "Serveur surchargé"
- ✅ Sévérité "error"
- ✅ Message avec pourcentages
- ✅ Icône WarningIcon

### 4. Shadow session
**Données** : Session active, API Electron
**Validation** :
- ✅ Bouton activé pour sessions actives
- ✅ API launchRdp appelée avec bons params
- ✅ Notification de succès
- ✅ Shadow bloqué sur session inactive

### 5. Performance en charge
**Données** : 500-1000 sessions
**Validation** :
- ✅ Rendu < 3s (500 sessions), < 5s (1000 sessions)
- ✅ Filtrage < 200ms
- ✅ Mémoire < 50MB
- ✅ Interface réactive

### 6. Connexion RDP
**Données** : Utilisateur avec/sans mot de passe
**Validation** :
- ✅ Avec mot de passe : connexion auto
- ✅ Sans mot de passe : message erreur + connexion manuelle
- ✅ API launchRdp appelée

## Commandes utiles

### Exécution tests
```bash
# Tous les tests
npm test src/tests/sessions/

# Type spécifique
npm test src/tests/sessions/sessions.test.js
npm test src/tests/sessions/sessions-integration.test.js
npm test src/tests/sessions/sessions-performance.test.js

# Avec options
npm test -- --coverage
npm test -- --watch
npm test -- --testNamePattern="SessionsPage"
npm test -- --verbose
npm test -- --detectOpenHandles
```

### Script d'aide
```bash
./run-tests-sessions.sh all        # Tous les tests
./run-tests-sessions.sh unit       # Tests unitaires
./run-tests-sessions.sh perf       # Tests performance
./run-tests-sessions.sh coverage   # Avec couverture
./run-tests-sessions.sh clean      # Nettoyer caches
```

### Variables d'environnement
```bash
CI=true npm test                    # Mode CI
DEBUG=test-verbose npm test         # Logs détaillés
TEST_PERF_ONLY=true npm test        # Perf uniquement
```

## Maintenance

### Ajout tests
1. Identifier type (unitaire/intégration/performance)
2. Ajouter dans fichier approprié
3. Ajouter données dans `mockData.js`
4. Mettre à jour doc si nécessaire

### Update données
1. Sync avec production
2. Ajouter nouveaux scénarios
3. Nettoyer obsolètes

### Performance
1. Ajuster seuils si besoin
2. Optimiser mocks
3. Paralleliser tests

## Métriques qualité

### Couverture cible
- **SessionsPage** : 90%+ branches, 95%+ lines/functions
- **SessionsTimeline** : 85%+ branches, 90%+ lines/functions
- **SessionAlerts** : 85%+ branches, 90%+ lines/functions
- **Global** : 80% minimum

### Performance cible
- **Unit tests** : < 1s chacun
- **Integration** : < 5s chacun
- **Performance** : < 10s chacun
- **Suite complète** : < 2 minutes

### Fiabilité
- ✅ Tests déterministes (pas d'échec intermittent)
- ✅ Isolation des tests (pas d'inter-dépendance)
- ✅ Cleanup automatique
- ✅ Mocks complets et réalistes

## Support

Pour questions/troubles :
1. Vérifier `docs/TESTS_SESSIONS_RDS.md`
2. Examiner logs avec `--verbose`
3. Mode debug avec `--detectOpenHandles`
4. Script `./run-tests-sessions.sh help`
