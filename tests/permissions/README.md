# Tests de Permissions Backend - RDS Viewer Anecoop

## Vue d'ensemble

Cette suite de tests valide de manière complète la sécurité des permissions backend de RDS Viewer Anecoop, incluant l'authentification, l'autorisation, la protection contre les attaques et le respect des bonnes pratiques de sécurité.

## Structure des Fichiers

```
tests/permissions/
├── backend-permissions.test.js    # Tests principaux de permissions
├── backend-security.test.js       # Tests de sécurité avancés
├── test-config.js                 # Configuration des tests
└── README.md                      # Cette documentation

scripts/
└── validate-permissions-backend.js # Script de validation complète

docs/
└── VALIDATION_PERMISSIONS_BACKEND.md # Documentation complète
```

## Tests Inclus

### 1. Tests d'Authentification (`backend-permissions.test.js`)

#### JWT Authentication
- ✅ **Token valide**: Acceptation des tokens correctement signés
- ❌ **Token invalide**: Rejet des tokens malformés
- ❌ **Token expiré**: Rejet des tokens après expiration
- ❌ **Token manquant**: Rejet des requêtes sans authentification

#### Session Management
- ✅ **Session valide**: Gestion des sessions actives
- ❌ **Session expirée**: Rejet des sessions dépassées
- ❌ **Session compromise**: Invalidation des sessions suspectes

### 2. Tests d'Autorisation (`backend-permissions.test.js`)

#### Role-Based Access Control (RBAC)
- ✅ **Admin full access**: Accès complet pour les administrateurs
- ❌ **Viewer admin access**: Rejet de l'accès admin pour les viewers
- ✅ **Manager team access**: Accès équipe pour managers
- ❌ **Viewer team access**: Rejet de l'accès équipe pour viewers

#### Permission-Based Authorization
- ✅ **Permission matching**: Vérification des permissions explicites
- ❌ **Missing permissions**: Rejet des permissions insuffisantes
- ✅ **Role hierarchy**: Respect de la hiérarchie des rôles
- ❌ **Privilege escalation**: Blocage de l'élévation de privilèges

### 3. Tests de Sécurité (`backend-security.test.js`)

#### Protection contre les Injections
- **XSS (Cross-Site Scripting)**
  - `<script>alert("XSS")</script>` → Bloqué
  - `<img src=x onerror=alert("XSS")>` → Bloqué
  - `javascript:alert("XSS")` → Bloqué

- **SQL Injection**
  - `'; DROP TABLE users; --` → Bloqué
  - `' OR '1'='1` → Bloqué
  - `admin' --` → Bloqué

- **Command Injection**
  - `&& cat /etc/passwd` → Bloqué
  - `| whoami` → Bloqué
  - `; ls -la` → Bloqué

- **Path Traversal**
  - `../../../etc/passwd` → Bloqué
  - `..\\..\\..\\windows\\system32` → Bloqué

- **Template Injection**
  - `{{constructor.constructor("return process")().exit()}}` → Bloqué
  - `${7*7}` → Bloqué

#### Rate Limiting
- ✅ **Role-based limits**: Limites adaptées par rôle
  - Viewer: 100 req/min
  - Technician: 200 req/min
  - Manager: 500 req/min
  - Admin: 1000 req/min
- ✅ **IP-based tracking**: Suivi par adresse IP
- ✅ **Automatic reset**: Réinitialisation après fenêtre temporelle
- ❌ **Limit bypass**: Blocage après dépassement

#### CSRF Protection
- ❌ **Missing CSRF token**: Rejet des requêtes POST sans token
- ❌ **Invalid CSRF token**: Rejet des tokens invalides
- ✅ **GET requests**: Autorisation des requêtes GET (sans effet)
- ✅ **Valid CSRF token**: Acceptation des tokens valides

#### Security Headers
- ✅ **X-Content-Type-Options**: `nosniff`
- ✅ **X-Frame-Options**: `DENY`
- ✅ **X-XSS-Protection**: `1; mode=block`
- ✅ **Strict-Transport-Security**: Pour HTTPS
- ✅ **Content-Security-Policy**: Politique de sécurité

### 4. Tests d'Intégration

#### Error Handling
- ✅ **No sensitive data exposure**: Masquage des informations techniques
- ✅ **Generic error messages**: Messages d'erreur génériques
- ✅ **Production mode**: Détails masqués en production
- ✅ **Stack traces hidden**: Non-exposition des stack traces

#### Performance & DoS Protection
- ✅ **Large payload rejection**: Rejet des payloads > 10MB
- ✅ **Deep nesting limits**: Limitation de la profondeur d'objets
- ✅ **Response time monitoring**: Surveillance des temps de réponse
- ✅ **Memory usage control**: Contrôle de l'utilisation mémoire

## Exécution des Tests

### Tests Unitaires

```bash
# Tous les tests de permissions
npm test tests/permissions/backend-permissions.test.js

# Tests de sécurité uniquement
npm test tests/permissions/backend-security.test.js

# Tests avec couverture
npm test -- --coverage tests/permissions/
```

### Tests d'Intégration

```bash
# Démarrer le serveur de test
npm run test:server

# Dans un autre terminal, exécuter les tests
npm run test:integration
```

### Script de Validation Complet

```bash
# Exécution complète avec rapport
node scripts/validate-permissions-backend.js

# Avec options spécifiques
node scripts/validate-permissions-backend.js --detailed --save-report
```

## Configuration des Tests

### Variables d'Environnement

```bash
# Configuration JWT
export JWT_SECRET="your-test-jwt-secret"
export JWT_EXPIRES_IN="3600"

# Configuration de la base de test
export TEST_DB_PATH="./test-data/test.sqlite"

# Mode debug
export DEBUG_PERMISSION_TESTS=true

# Rapport détaillé
export GENERATE_DETAILED_REPORT=true
```

### Configuration Personnalisée

Éditer `tests/permissions/test-config.js` pour modifier :

- **Utilisateurs de test**: Rôles et permissions
- **Endpoints à tester**: Chemins et méthodes
- **Payloads malveillants**: Patterns d'attaque à tester
- **Métriques de performance**: Seuils de temps de réponse

## Métriques de Validation

### Score de Sécurité

```javascript
{
  "timestamp": "2024-11-04T07:36:13.000Z",
  "testsRun": 156,
  "testsPassed": 148,
  "testsFailed": 8,
  "criticalIssues": 2,
  "warnings": 6,
  "recommendations": [
    "CRITIQUE: Corriger immédiatement les vulnérabilités de sécurité",
    "IMPORTANT: Améliorer la robustesse du système de permissions"
  ],
  "securityScore": 95, // 95% de tests réussis
  "details": { /* détails complets */ }
}
```

### Critères de Réussite

- ✅ **Score ≥ 95%**: Excellent
- ⚠️ **Score 85-94%**: Bon avec améliorations mineures
- ❌ **Score < 85%**: Insuffisant, corrections requises

## Mock API et Données de Test

### Génération de Tokens

```javascript
const { generateTestToken } = require('./scripts/validate-permissions-backend.js');

// Token admin
const adminToken = generateTestToken({
  username: 'admin_test',
  role: 'admin',
  permissions: ['read', 'write', 'delete', 'manage_users']
});

// Utilisation dans les requêtes
const response = await request(app)
  .get('/api/users')
  .set('Authorization', `Bearer ${adminToken}`);
```

### Données Simulées

```javascript
const testData = {
  users: [
    {
      username: 'alice',
      role: 'viewer',
      permissions: ['read']
    },
    {
      username: 'bob', 
      role: 'admin',
      permissions: ['read', 'write', 'delete', 'manage_users']
    }
  ],
  
  attackScenarios: [
    {
      name: 'XSS Attack',
      payload: '<script>alert("XSS")</script>',
      expectedResult: 'blocked'
    }
  ]
};
```

## Tests de Performance

### Scénarios de Charge

```bash
# Test de charge léger (10 utilisateurs)
npm run test:load --users=10

# Test de charge modéré (50 utilisateurs)
npm run test:load --users=50

# Test de charge intensif (100 utilisateurs)
npm run test:load --users=100
```

### Métriques Surveillées

- **Temps de réponse moyen**: < 500ms
- **Temps de réponse 95e percentile**: < 1000ms
- **Taux d'erreur**: < 1%
- **Utilisation CPU**: < 80%
- **Utilisation mémoire**: < 1GB

## Débogage

### Logs Détaillés

```javascript
// Activer le debugging
process.env.DEBUG_PERMISSION_TESTS = 'true';

// Les tests afficheront :
// - Tokens utilisés
// - Requêtes envoyées
// - Réponses reçues
// - Décisions d'autorisation
```

### Tests Manuels

```javascript
// Test manuel d'un endpoint spécifique
const response = await request(app)
  .get('/api/users')
  .set('Authorization', `Bearer ${adminToken}`)
  .expect(200);

console.log('Response:', response.body);
console.log('Headers:', response.headers);
```

## Bonnes Pratiques

### Pour les Développeurs

1. **Toujours tester les nouveaux endpoints** avec le système de permissions
2. **Valider les inputs** avant de traiter les données
3. **Logger les actions sensibles** pour l'audit
4. **Respecter la hiérarchie des rôles** dans les nouveaux modules
5. **Utiliser les middlewares existants** plutôt que de recréer

### Pour les Tests

1. **Tester tous les scénarios** : succès et échec
2. **Inclure les cas limites** : valeurs extrêmes, formats invalides
3. **Vérifier les permissions** : lecture ET écriture
4. **Tester les performances** : charge et stress
5. **Valider les logs** : audit trail complet

### Pour la Production

1. **HTTPS obligatoire** : chiffrement de bout en bout
2. **Secrets sécurisés** : rotation et gestion appropriée
3. **Monitoring continu** : alertes en temps réel
4. **Sauvegarde des logs** : rétention appropriée
5. **Mise à jour régulière** : dépendances et sécurité

## Contribution

### Ajouter de Nouveaux Tests

1. **Identifier le type** : authentification, autorisation, sécurité
2. **Créer le test** : utiliser la structure existante
3. **Ajouter la configuration** : si nécessaire
4. **Mettre à jour la documentation** : reflejar los cambios
5. **Valider avec les tests existants** : pas de régression

### Signaler des Problèmes

1. **Reproduire le problème** avec les données de test
2. **Inclure les logs** et la configuration
3. **Spécifier l'environnement** : Node.js, OS, etc.
4. **Proposer une solution** si possible

## Support

Pour toute question sur les tests de permissions :

1. **Consulter la documentation** : `docs/VALIDATION_PERMISSIONS_BACKEND.md`
2. **Vérifier les logs** : débogage et traçabilité
3. **Exécuter les tests de validation** : diagnostic automatique
4. **Contacter l'équipe sécurité** : pour les problèmes critiques

---

**Dernière mise à jour** : 2024-11-04
**Version** : 1.0.0
**Compatibilité** : Node.js 16+, Express 4+