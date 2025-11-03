# Validation des Permissions Backend - RDS Viewer Anecoop

## Vue d'ensemble

Ce document décrit le système complet de validation des permissions backend pour RDS Viewer Anecoop, incluant les tests de sécurité, les mécanismes d'authentification et d'autorisation, ainsi que les outils de validation.

## Architecture de Sécurité

### 1. Système d'Authentification

#### JWT (JSON Web Tokens)
- **Secret JWT**: Configuration sécurisée avec variable d'environnement
- **Expiration**: Tokens valides 1 heure par défaut
- **Claims**: Username, rôle, permissions
- **Validation**: Signature, expiration, structure

```javascript
// Exemple de token JWT
{
  "username": "admin_user",
  "role": "admin",
  "permissions": ["read", "write", "delete", "manage_users"],
  "iat": 1635789000,
  "exp": 1635792600
}
```

#### Sessions
- **Stockage**: En mémoire (Redis recommandé pour production)
- **Timeout**: 1 heure d'inactivité
- **Cleanup**: Nettoyage automatique des sessions expirées
- **CSRF**: Protection avec tokens uniques

### 2. Système d'Autorisation

#### Rôles Hiérarchiques
```javascript
const roles = {
  admin: {
    level: 4,
    permissions: ['read', 'write', 'delete', 'manage_users', 'system_admin', 'audit_logs'],
    rateLimit: 1000
  },
  manager: {
    level: 3,
    permissions: ['read', 'write', 'manage_team', 'view_reports'],
    rateLimit: 500
  },
  technician: {
    level: 2,
    permissions: ['read', 'write', 'maintenance'],
    rateLimit: 200
  },
  viewer: {
    level: 1,
    permissions: ['read'],
    rateLimit: 100
  }
};
```

#### Vérification de Permissions
- **Par rôle**: Hiérarchie avec niveau minimum
- **Par permission**: Vérification explicite des capacités
- **Combinaison**: AND logique pour permissions multiples

### 3. Middleware de Sécurité

#### Authentification (`authenticateToken`)
```javascript
// Vérification du token JWT
const authHeader = req.headers['authorization'];
const token = authHeader && authHeader.split(' ')[1];

try {
  const decoded = jwt.verify(token, jwtSecret);
  req.user = decoded;
  next();
} catch (error) {
  return res.status(401).json({ error: 'Token invalide' });
}
```

#### Autorisation (`authorizeRoles`)
```javascript
// Vérification du rôle utilisateur
const userRole = req.user.role;
const userLevel = roles[userRole]?.level || 0;

const isAllowed = allowedRoles.some(role => {
  const roleLevel = roles[role]?.level || 0;
  return userLevel >= roleLevel;
});

if (!isAllowed) {
  return res.status(403).json({ error: 'Rôle insuffisant' });
}
```

#### Rate Limiting (`rateLimitByRole`)
- **Par IP et rôle**: Limites différenciées
- **Fenêtre temporelle**: 1 minute
- **Nettoyage**: Automatique des anciennes entrées
- **Réponses**: HTTP 429 avec retry-after

#### Audit (`auditLog`)
```javascript
// Enregistrement des actions sensibles
utils.logAudit('USER_DELETE', req.user, {
  resource: req.originalUrl,
  method: req.method,
  ip: req.ip,
  result: 'SUCCESS',
  duration: Date.now() - req.auditStartTime
});
```

## Tests de Validation

### 1. Tests d'Authentification (`backend-permissions.test.js`)

#### Authentification JWT
- ✅ Token valide accepté
- ❌ Token invalide refusé
- ❌ Token expiré refusé
- ❌ Requête sans token refusée

#### Autorisation par Rôle
- ✅ Accès admin pour admin
- ❌ Accès admin pour viewer
- ✅ Accès équipe pour manager
- ❌ Accès équipe pour viewer

#### Rate Limiting
- ✅ Limites par rôle respectées
- ✅ Bloquage après dépassement
- ✅ Réinitialisation après fenêtre

#### Audit Trail
- ✅ Actions sensibles journalisées
- ✅ Tentatives d'accès refusées enregistrées
- ✅ Métadonnées complètes (IP, user-agent, durée)

### 2. Tests de Sécurité (`backend-security.test.js`)

#### Protection contre les Injections
- **XSS**: `<script>alert("xss")</script>` bloqué
- **SQL**: `'; DROP TABLE users; --` bloqué
- **Commandes**: `&& rm -rf /` bloqué
- **Traversal**: `../../../etc/passwd` bloqué

#### Validation d'Entrée
- ✅ Patterns malveillants détectés
- ✅ Objets imbriqués validés
- ✅ Payloads volumineux rejetés (1MB+)
- ✅ Profondeur d'imbrication limitée (50 niveaux)

#### Protection CSRF
- ❌ POST sans token CSRF refusé
- ❌ Token CSRF invalide refusé
- ✅ GET sans token CSRF accepté
- ✅ Token CSRF valide accepté

#### En-têtes de Sécurité
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `X-Frame-Options: DENY`
- ✅ `X-XSS-Protection: 1; mode=block`
- ✅ `Strict-Transport-Security` (HTTPS)
- ✅ `Content-Security-Policy`

#### Gestion d'Erreurs
- ✅ Informations sensibles masquées
- ✅ Stack traces non exposées
- ✅ Messages d'erreur génériques
- ✅ Détails techniques en dev seulement

### 3. Script de Validation (`validate-permissions-backend.js`)

#### Tests Automatisés
```bash
# Exécution des tests complets
node scripts/validate-permissions-backend.js
```

#### Métriques de Validation
- **Score de sécurité**: Pourcentage de tests passés
- **Issues critiques**: Vulnérabilités détectées
- **Avertissements**: Problèmes mineurs
- **Rapport JSON**: Détails complets sauvegardés

## API Endpoints Protégés

### 1. Routes Publiques
```
GET /health          - État du service
GET /version         - Version de l'application
```

### 2. Routes Authentifiées
```
GET /api/stats       - Statistiques (tous rôles)
GET /api/profile     - Profil utilisateur (tous rôles)
```

### 3. Routes Administrateur
```
GET /api/users       - Liste utilisateurs (admin)
POST /api/users      - Créer utilisateur (admin+)
PUT /api/users/:id   - Modifier utilisateur (admin+)
DELETE /api/users/:id - Supprimer utilisateur (admin)
```

### 4. Routes Gestion
```
GET /api/team        - Gestion équipe (manager+)
GET /api/reports     - Rapports (manager+)
POST /api/bulk       - Opérations en lot (manager+)
```

### 5. Routes Techniques
```
POST /api/maintenance - Opérations maintenance (tech+)
GET /api/logs        - Logs système (admin)
GET /api/config      - Configuration (admin)
```

## Mock API et Tests

### 1. Tokens de Test

```javascript
const testTokens = {
  admin: jwt.sign({
    username: 'admin_test',
    role: 'admin',
    permissions: ['read', 'write', 'delete', 'manage_users', 'system_admin']
  }, JWT_SECRET, { expiresIn: '1h' }),

  manager: jwt.sign({
    username: 'manager_test',
    role: 'manager',
    permissions: ['read', 'write', 'manage_team']
  }, JWT_SECRET, { expiresIn: '1h' }),

  technician: jwt.sign({
    username: 'tech_test',
    role: 'technician',
    permissions: ['read', 'write']
  }, JWT_SECRET, { expiresIn: '1h' }),

  viewer: jwt.sign({
    username: 'viewer_test',
    role: 'viewer',
    permissions: ['read']
  }, JWT_SECRET, { expiresIn: '1h' })
};
```

### 2. Tests de Performance

#### Scénarios de Charge
- **Viewer**: 100 req/min - Vérification lisibilité
- **Technician**: 200 req/min - Vérification opérations courantes
- **Manager**: 500 req/min - Vérification gestion équipe
- **Admin**: 1000 req/min - Vérification administration

#### Attaques DoS Simulées
- **Burst**: 1000 requêtes simultanées
- **Slowloris**: Requêtes partielles lentes
- **Volume**: Payloads de 10MB+

### 3. Tests d'Intrusion

#### Payloads Malveillants
```javascript
const attackPayloads = {
  xss: "<script>alert('XSS')</script>",
  sql: "'; DROP TABLE users; --",
  command: "&& cat /etc/passwd",
  template: "{{constructor.constructor('return process')().exit()}}",
  path: "../../../etc/passwd",
  script: "<img src=x onerror=alert('XSS')>"
};
```

#### Vecteurs d'Attaque Testés
- **Headers**: Authorization, X-Forwarded-For, User-Agent
- **Query**: Paramètres URL malformés
- **Body**: Données JSON/Form malveillantes
- **Cookies**: Manipulation de sessions

## Configuration de Production

### 1. Variables d'Environnement

```bash
# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRES_IN=3600

# Rate Limiting
RATE_LIMIT_WINDOW=60000
ADMIN_RATE_LIMIT=1000
MANAGER_RATE_LIMIT=500
TECHNICIAN_RATE_LIMIT=200
VIEWER_RATE_LIMIT=100

# Session Configuration
SESSION_TIMEOUT=3600000
SESSION_CLEANUP_INTERVAL=300000

# Audit Configuration
AUDIT_LOG_ENABLED=true
AUDIT_LOG_RETENTION=7776000000
```

### 2. Configuration Redis (Recommandée)

```javascript
// Production: Utiliser Redis pour le stockage de sessions
const redis = require('redis');
const client = redis.createClient({
  host: 'localhost',
  port: 6379,
  password: process.env.REDIS_PASSWORD
});

// Remplacer les Map en mémoire par Redis
const sessionStore = {
  set: (key, value) => client.setex(key, 3600, JSON.stringify(value)),
  get: (key) => client.get(key).then(data => JSON.parse(data)),
  delete: (key) => client.del(key)
};
```

### 3. Monitoring et Alertes

#### Métriques de Sécurité
- **Tentatives d'authentification échouées**
- **Accès refusés par rôle/permission**
- **Dépassements de rate limiting**
- **Attaques détectées (patterns malveillants)**
- **Sessions actives par rôle**

#### Alertes Recommandées
```javascript
// Seuils d'alerte
const alertThresholds = {
  failedLogins: 10, // 10 échecs par minute
  rateLimitHits: 50, // 50 hits de rate limiting
  suspiciousRequests: 5, // 5 requêtes suspectes
  adminAccessOutsideHours: true // Accès admin hors horaires
};
```

## Dépannage

### 1. Problèmes Courants

#### Erreur 401 - Token Invalide
```javascript
// Vérifier la configuration JWT
console.log('JWT Secret:', process.env.JWT_SECRET ? 'Set' : 'Missing');
console.log('Token expiry:', decoded.exp, 'Current:', Math.floor(Date.now()/1000));

// Vérifier la signature
try {
  jwt.verify(token, process.env.JWT_SECRET);
} catch (error) {
  console.error('JWT Error:', error.message);
}
```

#### Erreur 403 - Accès Refusé
```javascript
// Vérifier les rôles et permissions
console.log('User role:', req.user.role);
console.log('Required roles:', allowedRoles);
console.log('User permissions:', req.user.permissions);

// Vérifier la hiérarchie des rôles
const userLevel = roles[req.user.role]?.level;
const minLevel = Math.min(...allowedRoles.map(r => roles[r]?.level || 0));
console.log('User level:', userLevel, 'Required min:', minLevel);
```

#### Erreur 429 - Rate Limiting
```javascript
// Vérifier les compteurs
const userRequests = requests.get(`${req.ip}_${req.user.role}`);
console.log('Recent requests:', userRequests?.length);

// Ajuster les limites si nécessaire
const limits = roleLimits[req.user.role];
console.log('Rate limit for role:', limits);
```

### 2. Debugging Avancé

#### Logs d'Audit Détaillés
```javascript
// Activer les logs verbeux pour debugging
const debugAudit = (action, user, details) => {
  console.log(`[DEBUG] ${action}:`, {
    user: user?.username,
    role: user?.role,
    permissions: user?.permissions,
    ip: details.ip,
    resource: details.resource,
    timestamp: new Date().toISOString()
  });
};
```

#### Test des Middlewares Individuellement
```javascript
// Tester l'authentification seule
app.get('/test-auth', authenticateToken, (req, res) => {
  res.json({ user: req.user, message: 'Authenticated' });
});

// Tester l'autorisation seule (avec token valide)
app.get('/test-role', authenticateToken, authorizeRoles(['admin']), (req, res) => {
  res.json({ message: 'Role authorized' });
});
```

## Bonnes Pratiques

### 1. Sécurité
- ✅ Utiliser HTTPS en production
- ✅ Chiffrement des mots de passe (bcrypt)
- ✅ Rotation régulière des secrets JWT
- ✅ Validation systématique des entrées
- ✅ Logging des actions sensibles
- ✅ Rate limiting adaptatif

### 2. Performance
- ✅ Cache Redis pour les sessions
- ✅ Connection pooling pour la base de données
- ✅ Compression des réponses
- ✅ Pagination des résultats volumineux
- ✅ Indexation des requêtes fréquentes

### 3. Maintenance
- ✅ Nettoyage automatique des sessions expirées
- ✅ Rotation des logs d'audit
- ✅ Monitoring continu des métriques
- ✅ Alertes en temps réel
- ✅ Sauvegarde régulière de la configuration

## Conclusion

Le système de validation des permissions backend RDS Viewer Anecoop fournit une sécurité robuste avec :

- **Authentification JWT sécurisée** avec gestion de session
- **Autorisation granulaire** par rôles et permissions
- **Protection contre les attaques courantes** (XSS, SQL, CSRF)
- **Rate limiting intelligent** par rôle utilisateur
- **Audit trail complet** pour la traçabilité
- **Tests automatisés** pour la validation continue

Ce système est prêt pour la production avec les adaptations recommandées pour Redis et le monitoring avancé.