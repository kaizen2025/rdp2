# Guide Complet de Configuration Production
## RDS Viewer Anecoop - Version 3.0.27

**Date de création :** 2025-11-04  
**Environnement :** Production  
**Dernière mise à jour :** 2025-11-04

---

## Table des Matières

1. [Configuration Initiale de la Base de Données](#1-configuration-initiale-de-la-base-de-données)
2. [Configuration des Services IA](#2-configuration-des-services-ia)
3. [Configuration des Variables d'Environnement Production](#3-configuration-des-variables-denvironnement-production)
4. [Optimisations de Performance](#4-optimisations-de-performance)
5. [Configuration de la Sécurité](#5-configuration-de-la-sécurité)
6. [Configuration des Sauvegardes Automatiques](#6-configuration-des-sauvegardes-automatiques)
7. [Configuration des Logs et Monitoring](#7-configuration-des-logs-et-monitoring)
8. [Configuration des Notifications et Alertes](#8-configuration-des-notifications-et-alertes)
9. [Checklist de Déploiement](#9-checklist-de-déploiement)
10. [Dépannage et Maintenance](#10-dépannage-et-maintenance)

---

## 1. Configuration Initiale de la Base de Données

### 1.1 Emplacement de la Base de Données

La base de données SQLite principale doit être configurée dans un emplacement accessible et sécurisé :

```json
{
  "database": {
    "mode": "production",
    "path": "./data/docucortex.db",
    "backupPath": "./backups/",
    "maxConnections": 10
  }
}
```

**Recommandations d'emplacement :**

- **Production locale :** `./data/docucortex.db` (relatif à l'application)
- **Production réseau :** Utiliser un chemin réseau partagé si disponible
- **Permissions :** Accès en lecture/écriture pour l'utilisateur de l'application uniquement

### 1.2 Optimisations SQLite pour Production

#### Configuration dans `config/production.json`

```json
{
  "database": {
    "vacuumEnabled": true,
    "indexesEnabled": true,
    "maxConnections": 10
  }
}
```

#### Optimisations SQL à Appliquer

Exécuter le script `scripts/optimize-production.sql` lors du déploiement initial :

```sql
-- Activer les optimisations de performance
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 10000;
PRAGMA temp_store = MEMORY;
PRAGMA mmap_size = 268435456;

-- Optimisation du journal
PRAGMA wal_autocheckpoint = 1000;

-- Activer l'auto-vacuum incrémental
PRAGMA auto_vacuum = INCREMENTAL;
```

#### Script de Maintenance Automatique

Le fichier `scripts/optimize-database.js` doit être exécuté périodiquement :

```bash
# Exécution manuelle
node scripts/optimize-database.js

# Ou via le système de monitoring (voir section 7)
```

### 1.3 Structure des Données

**Répertoires requis :**

```
./data/
├── docucortex.db          # Base principale
├── ai/                    # Cache AI et embeddings
│   └── cache/
├── cache/                 # Cache général
├── ged/                   # Documents GED indexés
│   ├── index/
│   └── temp/
└── ocr/                   # Résultats OCR temporaires
    └── temp/
```

**Création des répertoires :**

```bash
mkdir -p data/ai/cache
mkdir -p data/cache
mkdir -p data/ged/index
mkdir -p data/ged/temp
mkdir -p data/ocr/temp
mkdir -p backups
mkdir -p logs
```

---

## 2. Configuration des Services IA

### 2.1 Ollama Configuration

#### Installation d'Ollama

**Windows :**
```bash
# Télécharger depuis https://ollama.ai
# Ou utiliser le script d'installation
node scripts/install-ollama.js
```

**Linux :**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

#### Configuration du Service Ollama

```json
{
  "ai": {
    "provider": "ollama",
    "model": "llama3.2:3b",
    "maxTokens": 2048,
    "temperature": 0.7,
    "timeout": 30000,
    "cache": true,
    "cacheTTL": 3600
  }
}
```

#### Démarrage d'Ollama

**En tant que service (recommandé) :**
```bash
# Windows (PowerShell en administrateur)
ollama serve

# Linux (systemd)
sudo systemctl enable ollama
sudo systemctl start ollama
```

**Variables d'environnement Ollama :**

```bash
# .env.production
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODELS_PATH=C:/Users/[User]/.ollama/models  # Windows
# ou
OLLAMA_MODELS_PATH=/usr/share/ollama/models        # Linux
```

#### Téléchargement des Modèles

```bash
# Modèle principal (recommandé pour production)
ollama pull llama3.2:3b

# Modèles alternatifs (optionnels)
ollama pull mistral:7b
ollama pull phi3:mini
```

#### Test de Connexion

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2:3b",
  "prompt": "Test de connexion",
  "stream": false
}'
```

### 2.2 EasyOCR Configuration

#### Installation des Dépendances

```bash
# Via npm (déjà inclus dans package.json)
npm install easyocr-node
```

#### Configuration OCR

```json
{
  "ocr": {
    "enabled": true,
    "languages": ["fr", "en", "es"],
    "maxFileSize": 104857600,
    "timeout": 60000,
    "confidence": 0.8
  }
}
```

**Variables d'environnement :**

```bash
OCR_ENABLED=true
OCR_LANGUAGES=fr,en,es
OCR_MAX_FILE_SIZE=104857600  # 100MB
OCR_TIMEOUT=60000            # 60 secondes
OCR_CONFIDENCE=0.8           # Seuil de confiance minimum
```

#### Optimisations OCR

- **GPU :** Si disponible, EasyOCR utilisera automatiquement le GPU
- **Mémoire :** Prévoir au minimum 4GB de RAM pour OCR
- **Langues :** Limiter aux langues strictement nécessaires

### 2.3 DocuCortex Configuration

DocuCortex est le système de gestion documentaire intégré.

#### Configuration GED

```json
{
  "ged": {
    "enabled": true,
    "networkPath": "\\\\192.168.1.230\\Donnees",
    "workingDirectory": "./data/ged/",
    "autoIndex": true,
    "scanInterval": 30,
    "maxSearchResults": 10,
    "embeddingModel": "local",
    "supportedExtensions": [
      "pdf", "docx", "xlsx", "txt", "md", 
      "jpg", "png", "pptx"
    ]
  }
}
```

#### Configuration du Chemin Réseau

**Windows :**
```bash
# Format UNC
GED_NETWORK_PATH=\\\\192.168.1.230\\Donnees

# Avec authentification (si nécessaire)
net use \\192.168.1.230\Donnees /user:DOMAIN\username password
```

**Linux (Samba) :**
```bash
# Monter le partage
sudo mkdir -p /mnt/ged
sudo mount -t cifs //192.168.1.230/Donnees /mnt/ged -o username=user,password=pass

# Configuration permanente dans /etc/fstab
//192.168.1.230/Donnees /mnt/ged cifs credentials=/root/.smbcredentials,uid=1000,gid=1000 0 0
```

#### Indexation Automatique

L'indexation se fait automatiquement toutes les 30 minutes (configurable via `scanInterval`).

**Déclenchement manuel :**
```bash
# Via l'API
curl -X POST http://localhost:3001/api/ged/reindex
```

---

## 3. Configuration des Variables d'Environnement Production

### 3.1 Fichier .env.production

Créer/modifier le fichier `.env.production` à la racine du projet :

```bash
# ==================
# Configuration Serveur
# ==================
NODE_ENV=production
PORT=3001
HOST=localhost
MAX_CONNECTIONS=100
TIMEOUT=30000

# ==================
# Base de Données
# ==================
DB_PATH=./data/docucortex.db
DB_BACKUP_PATH=./backups/
DB_AUTO_BACKUP=true
DB_BACKUP_INTERVAL=24
DB_VACUUM_ENABLED=true
DB_INDEXES_ENABLED=true

# ==================
# IA et OCR
# ==================
AI_PROVIDER=ollama
AI_MODEL=llama3.2:3b
AI_MAX_TOKENS=2048
AI_TIMEOUT=30000
AI_CACHE=true
AI_CACHE_TTL=3600

OCR_ENABLED=true
OCR_LANGUAGES=fr,en,es
OCR_MAX_FILE_SIZE=104857600
OCR_TIMEOUT=60000
OCR_CONFIDENCE=0.8

# ==================
# GED
# ==================
GED_ENABLED=true
GED_NETWORK_PATH=\\\\192.168.1.230\\Donnees
GED_WORKING_DIR=./data/ged/
GED_AUTO_INDEX=true
GED_SCAN_INTERVAL=30
GED_MAX_SEARCH_RESULTS=10

# ==================
# Sécurité
# ==================
SESSION_SECRET=CHANGE_ME_IN_PRODUCTION_USE_STRONG_SECRET
JWT_SECRET=CHANGE_ME_IN_PRODUCTION_USE_STRONG_JWT_SECRET
SESSION_TIMEOUT=3600
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=300
PASSWORD_MIN_LENGTH=8
ENABLE_MFA=false
RATE_LIMITING_ENABLED=true

# ==================
# SSL/TLS (si activé)
# ==================
HTTPS_ENABLED=false
SSL_CERT_PATH=./certs/server.crt
SSL_KEY_PATH=./certs/server.key

# ==================
# Performance
# ==================
CACHE_ENABLED=true
CACHE_TTL=3600
CACHE_MAX_SIZE=104857600
COMPRESSION_ENABLED=true
GZIP_ENABLED=true
LAZY_LOADING=true
BUNDLE_OPTIMIZATION=true

# ==================
# Monitoring et Logs
# ==================
LOG_LEVEL=info
LOG_MAX_SIZE=10485760
LOG_RETENTION_DAYS=7
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_INTERVAL=30000

# ==================
# Application
# ==================
APP_NAME=RDS Viewer Anecoop
APP_VERSION=3.0.27
APP_ENV=production
```

### 3.2 Sécurisation des Variables

**⚠️ IMPORTANT : Ne jamais committer .env.production dans Git !**

Ajouter dans `.gitignore` :
```
.env.production
.env.local
.env.*.local
*.key
*.pem
*.crt
```

### 3.3 Génération de Secrets Sécurisés

```bash
# Générer un secret fort (Node.js)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Ou avec OpenSSL
openssl rand -hex 64
```

**Remplacer les secrets par défaut :**
```bash
SESSION_SECRET=[votre_secret_généré_ici]
JWT_SECRET=[votre_jwt_secret_généré_ici]
```

---

## 4. Optimisations de Performance

### 4.1 Configuration du Cache

#### Cache Mémoire

```json
{
  "performance": {
    "cache": {
      "enabled": true,
      "ttl": 3600,
      "maxSize": 104857600
    }
  }
}
```

**Stratégies de cache :**

- **Données statiques :** TTL de 3600s (1h)
- **Données dynamiques :** TTL de 300s (5min)
- **Résultats AI :** TTL de 3600s avec invalidation intelligente
- **Résultats OCR :** TTL de 86400s (24h)

#### Cache Disque

Répertoire : `./data/cache/`

**Nettoyage automatique :**
```javascript
// Configurer dans monitoring
const cacheCleanupInterval = 24 * 60 * 60 * 1000; // 24h
```

### 4.2 Optimisation Mémoire

#### Allocation Mémoire Node.js

```bash
# Démarrage avec allocation mémoire optimisée
node --max-old-space-size=4096 server/server.js
```

**Dans package.json :**
```json
{
  "scripts": {
    "start:prod": "NODE_ENV=production node --max-old-space-size=4096 server/server.js"
  }
}
```

#### Limites Recommandées

- **Minimum :** 2GB RAM
- **Recommandé :** 4GB RAM
- **Optimal :** 8GB RAM (avec OCR et IA actifs)

### 4.3 Optimisation Processeurs

#### Workers Thread Pool

```javascript
// Configuration dans server.js
const os = require('os');
const numCPUs = os.cpus().length;

// Utiliser 75% des CPU disponibles
process.env.UV_THREADPOOL_SIZE = Math.max(4, Math.floor(numCPUs * 0.75));
```

#### Configuration Recommandée

- **CPU minimum :** 2 cœurs
- **CPU recommandé :** 4 cœurs
- **CPU optimal :** 8+ cœurs (pour AI et OCR parallèles)

### 4.4 Compression et Optimisation Réseau

```json
{
  "performance": {
    "compression": true,
    "gzip": true
  }
}
```

**Configuration Express :**
```javascript
const compression = require('compression');
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
```

### 4.5 Lazy Loading et Bundle Optimization

```json
{
  "performance": {
    "lazyLoading": true,
    "bundleOptimization": true
  }
}
```

**Webpack Configuration :**
```javascript
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10
        }
      }
    }
  }
};
```

---

## 5. Configuration de la Sécurité

### 5.1 Configuration JWT

#### Génération des Secrets

```bash
# Générer une clé JWT sécurisée
openssl rand -base64 64 > jwt-secret.key
```

#### Configuration JWT

```json
{
  "security": {
    "jwt": {
      "secret": "VOIR_.env.production",
      "expiresIn": "24h",
      "algorithm": "HS256",
      "issuer": "RDS-Viewer-Anecoop"
    }
  }
}
```

**Variables d'environnement :**
```bash
JWT_SECRET=votre_secret_jwt_ultra_securise_ici
JWT_EXPIRES_IN=24h
JWT_ALGORITHM=HS256
```

### 5.2 Configuration des Sessions

```json
{
  "security": {
    "sessionTimeout": 3600,
    "maxLoginAttempts": 5,
    "lockoutDuration": 300
  }
}
```

**Configuration Express-Session :**
```javascript
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);

app.use(session({
  store: new SQLiteStore({
    db: 'sessions.db',
    dir: './data'
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.HTTPS_ENABLED === 'true',
    httpOnly: true,
    maxAge: 3600000, // 1 heure
    sameSite: 'strict'
  }
}));
```

### 5.3 Configuration SSL/TLS

#### Génération des Certificats (Auto-signés pour test)

```bash
# Créer le répertoire des certificats
mkdir -p certs

# Générer une clé privée
openssl genrsa -out certs/server.key 2048

# Générer un certificat auto-signé
openssl req -new -x509 -key certs/server.key -out certs/server.crt -days 365
```

#### Configuration HTTPS

```javascript
// server.js
const https = require('https');
const fs = require('fs');

if (process.env.HTTPS_ENABLED === 'true') {
  const httpsOptions = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH)
  };
  
  const httpsServer = https.createServer(httpsOptions, app);
  httpsServer.listen(443, () => {
    console.log('✅ Serveur HTTPS démarré sur le port 443');
  });
}
```

**Variables d'environnement :**
```bash
HTTPS_ENABLED=true
SSL_CERT_PATH=./certs/server.crt
SSL_KEY_PATH=./certs/server.key
```

### 5.4 Rate Limiting

```json
{
  "security": {
    "rateLimiting": {
      "enabled": true,
      "windowMs": 900000,
      "max": 100
    }
  }
}
```

**Implémentation Express :**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite de 100 requêtes par fenêtre
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);
```

### 5.5 Sécurité des Headers

```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### 5.6 Protection des Mots de Passe

```javascript
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}
```

**Configuration minimum :**
```bash
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBERS=true
PASSWORD_REQUIRE_SPECIAL=true
```

---

## 6. Configuration des Sauvegardes Automatiques

### 6.1 Configuration des Sauvegardes

```json
{
  "database": {
    "backupPath": "./backups/",
    "autoBackup": true,
    "backupInterval": 24
  }
}
```

**Variables d'environnement :**
```bash
DB_BACKUP_PATH=./backups/
DB_AUTO_BACKUP=true
DB_BACKUP_INTERVAL=24  # Heures entre chaque sauvegarde
BACKUP_RETENTION_DAYS=30
BACKUP_COMPRESSION=true
```

### 6.2 Stratégie de Sauvegarde

#### Sauvegardes Automatiques Quotidiennes

**Planification :**
- **Quotidienne :** 02:00 AM (heure locale)
- **Hebdomadaire :** Dimanche 03:00 AM (copie complète)
- **Mensuelle :** 1er du mois 04:00 AM (archivage)

#### Script de Sauvegarde

Créer `scripts/backup-database.js` :

```javascript
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dbPath = process.env.DB_PATH || './data/docucortex.db';
  const backupDir = process.env.DB_BACKUP_PATH || './backups/';
  const backupFile = path.join(backupDir, `docucortex-${timestamp}.db`);
  
  // Créer le répertoire de sauvegarde si nécessaire
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Copier la base de données
  fs.copyFileSync(dbPath, backupFile);
  
  // Compression (optionnel)
  if (process.env.BACKUP_COMPRESSION === 'true') {
    execSync(`gzip ${backupFile}`);
    console.log(`✅ Sauvegarde créée et compressée: ${backupFile}.gz`);
  } else {
    console.log(`✅ Sauvegarde créée: ${backupFile}`);
  }
  
  // Nettoyage des anciennes sauvegardes
  cleanupOldBackups(backupDir);
}

function cleanupOldBackups(backupDir) {
  const retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS || '30');
  const now = Date.now();
  const maxAge = retentionDays * 24 * 60 * 60 * 1000;
  
  const files = fs.readdirSync(backupDir);
  files.forEach(file => {
    const filePath = path.join(backupDir, file);
    const stats = fs.statSync(filePath);
    const age = now - stats.mtimeMs;
    
    if (age > maxAge) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  Sauvegarde supprimée (trop ancienne): ${file}`);
    }
  });
}

// Exécution
backupDatabase();
```

### 6.3 Planification avec Cron (Linux)

```bash
# Éditer crontab
crontab -e

# Ajouter les tâches de sauvegarde
0 2 * * * cd /path/to/rdp && node scripts/backup-database.js >> logs/backup.log 2>&1
0 3 * * 0 cd /path/to/rdp && node scripts/backup-database.js --full >> logs/backup.log 2>&1
```

### 6.4 Planification avec Task Scheduler (Windows)

```powershell
# Créer une tâche planifiée
$action = New-ScheduledTaskAction -Execute "node" -Argument "scripts/backup-database.js" -WorkingDirectory "C:\path\to\rdp"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable
Register-ScheduledTask -TaskName "RDS Viewer Backup" -Action $action -Trigger $trigger -Settings $settings
```

### 6.5 Sauvegarde Réseau

**Configuration :**
```bash
# Copier vers un emplacement réseau
BACKUP_NETWORK_PATH=\\\\192.168.1.230\\Backups\\RDS-Viewer
BACKUP_NETWORK_ENABLED=true
```

**Script de copie réseau :**
```javascript
function copyToNetworkBackup(localBackupFile) {
  const networkPath = process.env.BACKUP_NETWORK_PATH;
  if (process.env.BACKUP_NETWORK_ENABLED === 'true' && networkPath) {
    const fileName = path.basename(localBackupFile);
    const networkFile = path.join(networkPath, fileName);
    fs.copyFileSync(localBackupFile, networkFile);
    console.log(`✅ Sauvegarde copiée sur le réseau: ${networkFile}`);
  }
}
```

### 6.6 Restauration de Sauvegarde

**Script de restauration :**
```javascript
// scripts/restore-database.js
function restoreDatabase(backupFile) {
  const dbPath = process.env.DB_PATH || './data/docucortex.db';
  
  // Créer une sauvegarde de sécurité avant restauration
  const safetyBackup = `${dbPath}.pre-restore.${Date.now()}`;
  if (fs.existsSync(dbPath)) {
    fs.copyFileSync(dbPath, safetyBackup);
    console.log(`✅ Sauvegarde de sécurité créée: ${safetyBackup}`);
  }
  
  // Restaurer
  fs.copyFileSync(backupFile, dbPath);
  console.log(`✅ Base de données restaurée depuis: ${backupFile}`);
}
```

---

## 7. Configuration des Logs et Monitoring

### 7.1 Configuration des Logs

```json
{
  "monitoring": {
    "enabled": true,
    "logLevel": "info",
    "maxLogSize": 10485760,
    "logRetention": 7
  }
}
```

**Variables d'environnement :**
```bash
LOG_LEVEL=info          # debug, info, warn, error
LOG_MAX_SIZE=10485760   # 10MB
LOG_RETENTION_DAYS=7
LOG_PATH=./logs/
```

### 7.2 Niveaux de Logs

**Hiérarchie des niveaux :**
1. **debug** - Informations détaillées de débogage
2. **info** - Informations générales
3. **warn** - Avertissements
4. **error** - Erreurs critiques

**Environnements recommandés :**
- **Production :** `info` ou `warn`
- **Développement :** `debug`
- **Test :** `error`

### 7.3 Structure des Logs

```
./logs/
├── application.log         # Log général de l'application
├── error.log              # Erreurs uniquement
├── access.log             # Logs d'accès HTTP
├── database.log           # Opérations base de données
├── ai.log                 # Opérations IA
├── ocr.log                # Opérations OCR
└── security.log           # Événements de sécurité
```

### 7.4 Implémentation Winston

```javascript
// backend/utils/logger.js
const winston = require('winston');
const path = require('path');

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}${stack ? '\n' + stack : ''}`;
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new winston.transports.File({ 
      filename: path.join(process.env.LOG_PATH || './logs', 'error.log'),
      level: 'error',
      maxsize: parseInt(process.env.LOG_MAX_SIZE || '10485760'),
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: path.join(process.env.LOG_PATH || './logs', 'application.log'),
      maxsize: parseInt(process.env.LOG_MAX_SIZE || '10485760'),
      maxFiles: 5
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      logFormat
    )
  }));
}

module.exports = logger;
```

### 7.5 Rotation des Logs

**Configuration automatique :**
```javascript
const DailyRotateFile = require('winston-daily-rotate-file');

const transport = new DailyRotateFile({
  filename: 'logs/application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  zippedArchive: true
});

logger.add(transport);
```

### 7.6 Health Check et Monitoring

```json
{
  "monitoring": {
    "healthCheck": true,
    "healthInterval": 30000
  }
}
```

**Endpoint de Health Check :**
```javascript
// server/apiRoutes.js
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    checks: {
      database: await checkDatabase(),
      ai: await checkAIService(),
      ocr: await checkOCRService(),
      ged: await checkGEDService()
    }
  };
  
  const allHealthy = Object.values(health.checks).every(c => c.status === 'ok');
  res.status(allHealthy ? 200 : 503).json(health);
});
```

### 7.7 Métriques de Performance

**Collecte des métriques :**
```javascript
const metrics = {
  requests: {
    total: 0,
    success: 0,
    errors: 0
  },
  performance: {
    avgResponseTime: 0,
    maxResponseTime: 0
  },
  ai: {
    queries: 0,
    cacheHits: 0,
    cacheMisses: 0
  }
};

// Middleware de mesure
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    metrics.requests.total++;
    
    if (res.statusCode < 400) {
      metrics.requests.success++;
    } else {
      metrics.requests.errors++;
    }
    
    metrics.performance.avgResponseTime = 
      (metrics.performance.avgResponseTime + duration) / 2;
    metrics.performance.maxResponseTime = 
      Math.max(metrics.performance.maxResponseTime, duration);
  });
  
  next();
});

// Endpoint de métriques
app.get('/metrics', (req, res) => {
  res.json(metrics);
});
```

---

## 8. Configuration des Notifications et Alertes

### 8.1 Configuration des Notifications

Le système de notifications est géré par `backend/services/notificationService.js`.

```json
{
  "notifications": {
    "enabled": true,
    "channels": ["websocket", "email"],
    "priorities": {
      "critical": true,
      "warning": true,
      "info": false
    }
  }
}
```

### 8.2 Notifications WebSocket

**Configuration automatique via server.js :**
```javascript
// Les WebSocket sont configurés automatiquement
// Port: 3003 (par défaut)

function sendNotification(message, level = 'info') {
  const notification = {
    type: 'notification',
    level: level,
    message: message,
    timestamp: new Date().toISOString()
  };
  
  broadcast(notification);
}
```

### 8.3 Notifications Email (Optionnel)

**Installation :**
```bash
npm install nodemailer
```

**Configuration :**
```bash
# .env.production
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=votre.email@example.com
EMAIL_PASSWORD=votre_mot_de_passe_app
EMAIL_FROM=RDS Viewer <noreply@example.com>
EMAIL_TO=admin@example.com
```

**Implémentation :**
```javascript
// backend/services/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

async function sendEmail(subject, text, html) {
  if (process.env.EMAIL_ENABLED !== 'true') {
    return;
  }
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_TO,
    subject: `[RDS Viewer] ${subject}`,
    text: text,
    html: html
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email envoyé: ${subject}`);
  } catch (error) {
    console.error(`❌ Erreur envoi email: ${error.message}`);
  }
}

module.exports = { sendEmail };
```

### 8.4 Alertes Système

**Types d'alertes :**

1. **Critique** - Nécessite une action immédiate
   - Échec de connexion base de données
   - Service IA indisponible
   - Espace disque critique
   - Erreurs de sécurité

2. **Warning** - Nécessite attention
   - Performance dégradée
   - Cache plein
   - Logs volumineux
   - Tentatives de connexion échouées

3. **Info** - Informations générales
   - Sauvegarde réussie
   - Mise à jour disponible
   - Statistiques quotidiennes

**Configuration des seuils :**
```javascript
const alertThresholds = {
  diskSpace: 10 * 1024 * 1024 * 1024, // 10GB minimum
  memoryUsage: 0.9, // 90% de la RAM
  cpuUsage: 0.85, // 85% du CPU
  responseTime: 5000, // 5 secondes
  errorRate: 0.05 // 5% d'erreurs
};
```

### 8.5 Monitoring Automatique

**Script de monitoring continu :**
```javascript
// scripts/monitor.js
const os = require('os');
const { sendEmail } = require('../backend/services/emailService');

async function monitorSystem() {
  // Vérifier l'espace disque
  const diskSpace = await checkDiskSpace();
  if (diskSpace < alertThresholds.diskSpace) {
    sendAlert('CRITIQUE', `Espace disque faible: ${formatBytes(diskSpace)} restant`);
  }
  
  // Vérifier la mémoire
  const memUsage = (os.totalmem() - os.freemem()) / os.totalmem();
  if (memUsage > alertThresholds.memoryUsage) {
    sendAlert('WARNING', `Utilisation mémoire élevée: ${(memUsage * 100).toFixed(1)}%`);
  }
  
  // Vérifier les services
  const servicesStatus = await checkServices();
  Object.entries(servicesStatus).forEach(([service, status]) => {
    if (!status.healthy) {
      sendAlert('CRITIQUE', `Service ${service} indisponible: ${status.message}`);
    }
  });
}

function sendAlert(level, message) {
  console.log(`🚨 [${level}] ${message}`);
  
  // Notification WebSocket
  sendNotification(message, level.toLowerCase());
  
  // Email pour alertes critiques
  if (level === 'CRITIQUE' && process.env.EMAIL_ENABLED === 'true') {
    sendEmail(`Alerte ${level}`, message, `<h2>${level}</h2><p>${message}</p>`);
  }
}

// Exécuter toutes les 5 minutes
setInterval(monitorSystem, 5 * 60 * 1000);
```

---

## 9. Checklist de Déploiement

### 9.1 Pré-déploiement

- [ ] **Configuration vérifiée**
  - [ ] `.env.production` créé et configuré
  - [ ] `config/production.json` vérifié
  - [ ] Secrets JWT/Session générés et sécurisés
  - [ ] Chemins réseau testés

- [ ] **Services externes**
  - [ ] Ollama installé et modèles téléchargés
  - [ ] EasyOCR configuré
  - [ ] Accès réseau GED vérifié

- [ ] **Base de données**
  - [ ] Répertoires créés (`data/`, `backups/`, `logs/`)
  - [ ] Scripts d'optimisation exécutés
  - [ ] Permissions fichiers configurées

- [ ] **Sécurité**
  - [ ] Certificats SSL générés (si HTTPS)
  - [ ] Rate limiting configuré
  - [ ] Headers de sécurité activés
  - [ ] Politique de mots de passe définie

### 9.2 Déploiement

- [ ] **Installation**
  - [ ] Dépendances installées (`npm install --production`)
  - [ ] Build production généré (`npm run build`)
  - [ ] Tests exécutés (`npm test`)

- [ ] **Configuration système**
  - [ ] Services Ollama démarrés
  - [ ] Permissions réseau configurées
  - [ ] Pare-feu configuré

- [ ] **Lancement**
  - [ ] Application démarrée (`npm run start:prod`)
  - [ ] Health check vérifié (`curl http://localhost:3001/health`)
  - [ ] Logs vérifiés

### 9.3 Post-déploiement

- [ ] **Vérifications**
  - [ ] Connexion base de données OK
  - [ ] Services IA accessibles
  - [ ] OCR fonctionnel
  - [ ] GED accessible

- [ ] **Monitoring**
  - [ ] Logs actifs et lisibles
  - [ ] Métriques collectées
  - [ ] Alertes configurées
  - [ ] Sauvegardes planifiées

- [ ] **Tests utilisateurs**
  - [ ] Authentification testée
  - [ ] Recherche testée
  - [ ] IA testée
  - [ ] OCR testé

---

## 10. Dépannage et Maintenance

### 10.1 Problèmes Courants

#### Base de Données Verrouillée

**Symptôme :** `SQLITE_BUSY: database is locked`

**Solution :**
```bash
# Vérifier les processus utilisant la DB
lsof | grep docucortex.db

# Redémarrer l'application
npm run stop
npm run start:prod
```

#### Service Ollama Inaccessible

**Symptôme :** `Error: connect ECONNREFUSED 127.0.0.1:11434`

**Solution :**
```bash
# Vérifier si Ollama est en cours d'exécution
curl http://localhost:11434/api/tags

# Démarrer Ollama si nécessaire
ollama serve

# Vérifier les logs
journalctl -u ollama -f  # Linux
Get-EventLog -LogName Application -Source Ollama  # Windows
```

#### Espace Disque Insuffisant

**Symptôme :** Erreurs d'écriture, sauvegardes échouées

**Solution :**
```bash
# Nettoyer les anciennes sauvegardes
node scripts/cleanup-backups.js

# Nettoyer le cache
rm -rf data/cache/*
rm -rf data/ocr/temp/*

# Vacuum la base de données
sqlite3 data/docucortex.db "VACUUM;"
```

#### Performance Dégradée

**Symptôme :** Requêtes lentes, timeouts

**Solution :**
```bash
# Optimiser la base de données
node scripts/optimize-database.js

# Vider le cache
curl -X POST http://localhost:3001/api/admin/clear-cache

# Vérifier la mémoire
node --max-old-space-size=8192 server/server.js
```

### 10.2 Maintenance Régulière

#### Quotidienne
- Vérifier les logs d'erreurs
- Vérifier l'état des services (health check)
- Vérifier l'espace disque

#### Hebdomadaire
- Analyser les métriques de performance
- Vérifier les sauvegardes
- Nettoyer les fichiers temporaires

#### Mensuelle
- Mettre à jour les dépendances (`npm update`)
- Vacuum complet de la base (`VACUUM FULL`)
- Vérifier les certificats SSL
- Analyser les logs de sécurité

#### Trimestrielle
- Audit de sécurité complet
- Optimisation des index base de données
- Révision des permissions
- Mise à jour des modèles IA

### 10.3 Scripts de Maintenance

**Créer `scripts/maintenance.js` :**
```javascript
const tasks = {
  daily: [
    checkLogs,
    checkServices,
    checkDiskSpace
  ],
  weekly: [
    analyzeMetrics,
    verifyBackups,
    cleanTempFiles
  ],
  monthly: [
    updateDependencies,
    vacuumDatabase,
    checkCertificates,
    analyzeSecurityLogs
  ]
};

async function runMaintenance(frequency) {
  console.log(`🔧 Exécution de la maintenance ${frequency}...`);
  
  for (const task of tasks[frequency]) {
    try {
      await task();
      console.log(`✅ ${task.name} terminé`);
    } catch (error) {
      console.error(`❌ ${task.name} échoué:`, error);
    }
  }
  
  console.log(`✅ Maintenance ${frequency} terminée`);
}

module.exports = { runMaintenance };
```

### 10.4 Contact et Support

**Documentation :**
- Architecture : `docs/ARCHITECTURE_*.md`
- Tests : `docs/TESTS_*.md`
- Déploiement : `GUIDE_DEPLOIEMENT_PRODUCTION.md`

**Logs utiles :**
- Application : `logs/application.log`
- Erreurs : `logs/error.log`
- Sécurité : `logs/security.log`

**Commandes de diagnostic :**
```bash
# État des services
npm run health-check

# Vérifier la configuration
node scripts/check-config.js

# Tester les permissions
node scripts/check-permissions-structure.js

# Analyser les performances
node scripts/analyze-performance.js
```

---

## Annexes

### A. Variables d'Environnement Complètes

Voir le fichier `.env.production` pour la liste complète des variables disponibles.

### B. Ports Utilisés

| Service | Port | Description |
|---------|------|-------------|
| Backend API | 3001 | API REST principale |
| React Dev | 3000 | Interface utilisateur |
| API Routes | 3002 | Routes API additionnelles |
| WebSocket | 3003 | Communication temps réel |
| Ollama | 11434 | Service IA |

### C. Structure des Fichiers

```
rdp/
├── backend/          # Services backend
├── config/           # Fichiers de configuration
├── data/             # Données et cache
├── backups/          # Sauvegardes base de données
├── logs/             # Logs applicatifs
├── server/           # Serveur Express
├── src/              # Code source React
├── scripts/          # Scripts utilitaires
├── docs/             # Documentation
└── .env.production   # Variables d'environnement
```

### D. Ressources Système Recommandées

**Configuration Minimale :**
- CPU: 2 cœurs
- RAM: 4 GB
- Disque: 20 GB
- Réseau: 100 Mbps

**Configuration Recommandée :**
- CPU: 4 cœurs
- RAM: 8 GB
- Disque: 50 GB SSD
- Réseau: 1 Gbps

**Configuration Optimale :**
- CPU: 8+ cœurs
- RAM: 16 GB
- Disque: 100 GB NVMe
- Réseau: 1 Gbps+
- GPU: Recommandé pour OCR

---

**Version du guide :** 1.0.0  
**Date de dernière mise à jour :** 2025-11-04  
**Auteur :** Équipe RDS Viewer Anecoop  
**License :** Propriétaire - Usage interne uniquement

---

## Notes Importantes

⚠️ **SÉCURITÉ :** Ne jamais committer les fichiers `.env.production`, certificats, ou clés privées dans Git.

⚠️ **SAUVEGARDES :** Vérifier régulièrement que les sauvegardes automatiques fonctionnent correctement.

⚠️ **MONITORING :** Configurer les alertes pour être notifié immédiatement en cas de problème critique.

⚠️ **MISES À JOUR :** Tester toutes les mises à jour dans un environnement de staging avant production.

---

*Pour toute question ou problème, consulter d'abord la section Dépannage et les logs applicatifs.*
