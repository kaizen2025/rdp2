# 🚀 Guide de Déploiement en Production - DocuCortex IA

**Version** : 3.0.27+
**Date** : 2025-11-03
**Cible** : Serveur de production

---

## 📋 TABLE DES MATIÈRES

1. [Prérequis](#prérequis)
2. [Préparation](#préparation)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Sécurité](#sécurité)
6. [Déploiement](#déploiement)
7. [Monitoring](#monitoring)
8. [Maintenance](#maintenance)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 PRÉREQUIS

### Serveur

- **OS** : Windows Server 2019/2022 ou Ubuntu Server 20.04/22.04 LTS
- **RAM** : Minimum 8 GB (16 GB recommandé)
- **CPU** : 4 cores minimum (8 cores recommandé)
- **Disque** : 100 GB SSD minimum
- **Réseau** : Accès aux serveurs RDS et Active Directory

### Logiciels

- **Node.js** : v20.x LTS
  ```bash
  # Vérifier la version
  node --version  # Doit afficher v20.x.x
  ```

- **npm** : v9.x ou supérieur
  ```bash
  npm --version  # Doit afficher v9.x.x ou supérieur
  ```

- **Git** : Pour le déploiement continu
  ```bash
  git --version
  ```

- **PM2** : Pour la gestion des processus (recommandé)
  ```bash
  npm install -g pm2
  ```

### Accès Réseau

- [ ] Accès en lecture/écriture au partage réseau (\\192.168.1.230\Donnees)
- [ ] Connexion Active Directory avec compte de service
- [ ] Ports ouverts :
  - `3000` : Frontend React (dev uniquement)
  - `3002` : Backend API
  - `80/443` : HTTP/HTTPS (si serveur web)

---

## 🛠️ PRÉPARATION

### 1. Créer un Utilisateur de Service

**Windows** :
```powershell
New-LocalUser -Name "DocuCortexService" -Description "Service account for DocuCortex" -Password (ConvertTo-SecureString "MotDePasseF0rt!" -AsPlainText -Force)
Add-LocalGroupMember -Group "Administrators" -Member "DocuCortexService"
```

**Linux** :
```bash
sudo adduser docucortex
sudo usermod -aG sudo docucortex
```

### 2. Cloner le Dépôt

```bash
# En tant qu'utilisateur de service
su - docucortex  # Linux
# ou
runas /user:DocuCortexService cmd  # Windows

cd /opt  # Linux
# ou
cd C:\Services  # Windows

git clone https://github.com/kaizen2025/rdp.git docucortex
cd docucortex
```

### 3. Créer les Dossiers Nécessaires

```bash
# Linux
sudo mkdir -p /var/log/docucortex
sudo mkdir -p /var/lib/docucortex/uploads
sudo chown -R docucortex:docucortex /var/log/docucortex /var/lib/docucortex

# Windows
mkdir C:\Services\DocuCortex\logs
mkdir C:\Services\DocuCortex\uploads
```

---

## 📦 INSTALLATION

### 1. Installation des Dépendances

```bash
# Utiliser le script d'installation propre
./install-clean.sh  # Linux
# ou
install-clean.bat  # Windows

# Ou manuellement
npm install --ignore-scripts --production
npm rebuild better-sqlite3
```

### 2. Vérification de l'Installation

```bash
# Vérifier que better-sqlite3 fonctionne
node -e "require('better-sqlite3'); console.log('✅ better-sqlite3 OK');"

# Vérifier les autres dépendances critiques
npm run check:deps
```

---

## ⚙️ CONFIGURATION

### 1. Configuration Principale

```bash
# Copier le template
cp config/config.template.json config/config.json

# Éditer la configuration
nano config/config.json  # Linux
# ou
notepad config/config.json  # Windows
```

**Configuration minimale** :
```json
{
  "appPasswordHash": "...",
  "domain": "anecoopfr.local",
  "username": "service_docucortex",
  "password": "MOT_DE_PASSE_SECURISE",
  "databasePath": "\\\\192.168.1.230\\Donnees\\docucortex.sqlite",
  "excelFilePath": "\\\\192.168.1.230\\Donnees\\users.xlsx",
  "updateUrl": "https://updates.votredomaine.fr/",

  "ged": {
    "enabled": true,
    "serverPath": "\\\\192.168.1.230\\Donnees",
    "autoIndex": true,
    "scanInterval": 30,
    "maxFileSize": 104857600
  }
}
```

### 2. Variables d'Environnement (Production)

Créer `.env.production` :
```env
NODE_ENV=production
PORT=3002
REACT_APP_API_URL=http://localhost:3002/api

# Sécurité
SESSION_SECRET=GENERER_UN_SECRET_FORT_ICI
JWT_SECRET=GENERER_UN_AUTRE_SECRET_ICI

# Logging
LOG_LEVEL=info
LOG_PATH=/var/log/docucortex/app.log

# Base de données
DB_PATH=\\\\192.168.1.230\\Donnees\\docucortex.sqlite

# Active Directory (si pas dans config.json)
AD_DOMAIN=anecoopfr.local
AD_USERNAME=service_docucortex
AD_PASSWORD=MOT_DE_PASSE_SECURISE
```

**⚠️  IMPORTANT : Ne JAMAIS committer ce fichier !**

### 3. Générer les Secrets

```bash
# Générer des secrets forts
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copier le résultat dans SESSION_SECRET

node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copier le résultat dans JWT_SECRET
```

---

## 🔐 SÉCURITÉ

### 1. Permissions des Fichiers

**Linux** :
```bash
# Configuration (contient mots de passe)
chmod 600 config/config.json
chmod 600 .env.production

# Logs
chmod 755 /var/log/docucortex
chmod 644 /var/log/docucortex/*.log

# Exécutables
chmod +x install-clean.sh
chmod +x scripts/*.js
```

**Windows** :
```powershell
# Restreindre l'accès au fichier de configuration
icacls config\config.json /inheritance:r /grant:r "DocuCortexService:R"
```

### 2. Firewall

**Linux (UFW)** :
```bash
sudo ufw allow 3002/tcp comment "DocuCortex API"
sudo ufw allow 80/tcp comment "HTTP"
sudo ufw allow 443/tcp comment "HTTPS"
sudo ufw enable
sudo ufw status
```

**Windows Firewall** :
```powershell
New-NetFirewallRule -DisplayName "DocuCortex API" -Direction Inbound -LocalPort 3002 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "DocuCortex HTTP" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "DocuCortex HTTPS" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow
```

### 3. SSL/TLS (HTTPS)

**Option A : Nginx Reverse Proxy (Recommandé)**

```nginx
# /etc/nginx/sites-available/docucortex
server {
    listen 80;
    server_name docucortex.votredomaine.fr;

    # Redirection HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name docucortex.votredomaine.fr;

    # SSL
    ssl_certificate /etc/letsencrypt/live/docucortex.votredomaine.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/docucortex.votredomaine.fr/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Frontend (Build React)
    location / {
        root /opt/docucortex/build;
        try_files $uri /index.html;
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activer :
```bash
sudo ln -s /etc/nginx/sites-available/docucortex /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**Option B : IIS (Windows)**

1. Installer IIS avec Application Request Routing (ARR)
2. Créer un nouveau site web
3. Configurer le reverse proxy vers `http://localhost:3002`

---

## 🚀 DÉPLOIEMENT

### 1. Build de Production

```bash
# Nettoyer
npm run clean

# Build React
npm run build

# Vérifier le build
ls -la build/  # Linux
dir build\  # Windows

# Tester le serveur
NODE_ENV=production node server/server.js
```

### 2. Déploiement avec PM2 (Recommandé)

**Créer le fichier de config PM2** :
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'docucortex-api',
    script: 'server/server.js',
    instances: 2,  // Nombre de processus (CPU cores)
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    error_file: '/var/log/docucortex/pm2-error.log',
    out_file: '/var/log/docucortex/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false
  }]
};
```

**Démarrer l'application** :
```bash
# Démarrer
pm2 start ecosystem.config.js --env production

# Vérifier le statut
pm2 status
pm2 logs docucortex-api

# Sauvegarder la config
pm2 save

# Démarrage automatique au boot
pm2 startup
# Suivre les instructions affichées
```

### 3. Déploiement avec systemd (Alternative Linux)

**Créer le service** :
```ini
# /etc/systemd/system/docucortex.service
[Unit]
Description=DocuCortex IA Application
After=network.target

[Service]
Type=simple
User=docucortex
WorkingDirectory=/opt/docucortex
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server/server.js
Restart=always
RestartSec=10
StandardOutput=append:/var/log/docucortex/app.log
StandardError=append:/var/log/docucortex/error.log

[Install]
WantedBy=multi-user.target
```

**Activer et démarrer** :
```bash
sudo systemctl daemon-reload
sudo systemctl enable docucortex
sudo systemctl start docucortex
sudo systemctl status docucortex
```

### 4. Déploiement avec Windows Service

**Utiliser node-windows** :
```javascript
// install-service-windows.js
const Service = require('node-windows').Service;
const path = require('path');

const svc = new Service({
    name: 'DocuCortex IA',
    description: 'Application de gestion documentaire intelligente',
    script: path.join(__dirname, 'server', 'server.js'),
    nodeOptions: [
        '--max_old_space_size=2048'
    ],
    env: [{
        name: 'NODE_ENV',
        value: 'production'
    }]
});

svc.on('install', () => {
    console.log('Service installé');
    svc.start();
});

svc.on('error', (err) => {
    console.error('Erreur service:', err);
});

svc.install();
```

**Installer** :
```bash
node install-service-windows.js
```

---

## 📊 MONITORING

### 1. Logs

**PM2** :
```bash
# Logs en temps réel
pm2 logs docucortex-api

# Logs avec filtre
pm2 logs docucortex-api --lines 100 --err

# Vider les logs
pm2 flush
```

**systemd** :
```bash
# Logs en temps réel
journalctl -u docucortex -f

# Logs des dernières 24h
journalctl -u docucortex --since "1 day ago"
```

### 2. Monitoring avec PM2

```bash
# Dashboard temps réel
pm2 monit

# Informations système
pm2 info docucortex-api

# Métriques
pm2 describe docucortex-api
```

### 3. Health Check

**Créer un endpoint de health** :
```javascript
// Dans server/server.js
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        memory: process.memoryUsage(),
        version: require('../package.json').version
    });
});
```

**Tester** :
```bash
curl http://localhost:3002/health
```

### 4. Monitoring Externe (Optionnel)

**Avec cron (vérification périodique)** :
```bash
# /etc/cron.d/docucortex-health
*/5 * * * * root curl -f http://localhost:3002/health || systemctl restart docucortex
```

---

## 🔄 MAINTENANCE

### 1. Mise à Jour

```bash
# Arrêter l'application
pm2 stop docucortex-api

# Sauvegarder
cp -r /opt/docucortex /opt/docucortex.backup-$(date +%Y%m%d)

# Mettre à jour
cd /opt/docucortex
git pull origin main

# Réinstaller les dépendances
npm install --ignore-scripts --production
npm rebuild better-sqlite3

# Rebuild
npm run build

# Redémarrer
pm2 restart docucortex-api
pm2 logs docucortex-api --lines 50
```

### 2. Backup

**Script de backup automatique** :
```bash
#!/bin/bash
# /opt/docucortex/scripts/backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/docucortex"
SOURCE_DIR="/opt/docucortex"

mkdir -p $BACKUP_DIR

# Backup code
tar -czf $BACKUP_DIR/code-$DATE.tar.gz \
    --exclude=node_modules \
    --exclude=build \
    --exclude=dist \
    $SOURCE_DIR

# Backup config
cp $SOURCE_DIR/config/config.json $BACKUP_DIR/config-$DATE.json

# Backup database
cp \\\\192.168.1.230\\Donnees\\docucortex.sqlite $BACKUP_DIR/db-$DATE.sqlite

# Nettoyer les backups > 30 jours
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.json" -mtime +30 -delete
find $BACKUP_DIR -name "*.sqlite" -mtime +30 -delete

echo "Backup terminé : $DATE"
```

**Automatiser avec cron** :
```bash
# Backup quotidien à 2h du matin
0 2 * * * /opt/docucortex/scripts/backup.sh >> /var/log/docucortex/backup.log 2>&1
```

### 3. Rotation des Logs

```bash
# /etc/logrotate.d/docucortex
/var/log/docucortex/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 docucortex docucortex
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## 🆘 TROUBLESHOOTING

### Problème : L'API ne répond pas

```bash
# Vérifier que le service tourne
pm2 status

# Vérifier les ports
netstat -tuln | grep 3002
# ou
lsof -i :3002

# Vérifier les logs
pm2 logs docucortex-api --lines 100
```

### Problème : Erreur de connexion à la base de données

```bash
# Vérifier l'accès au partage réseau
ls \\\\192.168.1.230\\Donnees  # Windows
smbclient //192.168.1.230/Donnees -U username  # Linux

# Vérifier les permissions
ls -la /path/to/docucortex.sqlite

# Tester la connexion
node -e "const db = require('better-sqlite3')('path/to/db.sqlite'); console.log(db.prepare('SELECT 1').get());"
```

### Problème : Out of Memory

```bash
# Augmenter la mémoire allouée
pm2 delete docucortex-api
pm2 start ecosystem.config.js --node-args="--max-old-space-size=4096"

# Ou dans ecosystem.config.js
node_args: '--max-old-space-size=4096'
```

### Problème : Lenteur de l'application

```bash
# Analyser les performances
pm2 monit

# Profiler
node --prof server/server.js
# Arrêter après quelques minutes
node --prof-process isolate-*.log > profile.txt
```

---

## ✅ CHECKLIST DE DÉPLOIEMENT

- [ ] Serveur configuré avec ressources suffisantes
- [ ] Node.js et npm installés
- [ ] Dépendances installées sans erreur
- [ ] Configuration créée et sécurisée
- [ ] Permissions des fichiers configurées
- [ ] Firewall configuré
- [ ] SSL/TLS configuré (si applicable)
- [ ] PM2 ou service system configuré
- [ ] Application démarrée et accessible
- [ ] Health check répond correctement
- [ ] Logs accessibles et rotationnés
- [ ] Backup automatique configuré
- [ ] Monitoring en place
- [ ] Documentation à jour

---

## 📞 SUPPORT

En cas de problème :
1. Consulter les logs : `pm2 logs docucortex-api`
2. Vérifier la santé : `curl http://localhost:3002/health`
3. Consulter cette documentation
4. Contacter l'équipe de développement

---

**🎉 Votre application DocuCortex IA est maintenant déployée en production !**

Prochaine étape : Configuration du monitoring avancé et des alertes
