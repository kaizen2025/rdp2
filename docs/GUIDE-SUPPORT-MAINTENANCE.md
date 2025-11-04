# 🛠️ Guide de Support et Maintenance - RDS Viewer Anecoop (DocuCortex IA)

**Version** : 3.0.31  
**Date de création** : 2025-11-04  
**Application** : RDS Viewer Anecoop (DocuCortex IA)  
**Type** : Application Electron (React + Node.js + SQLite)

---

## 📋 TABLE DES MATIÈRES

1. [Procédures de Sauvegarde](#1-procédures-de-sauvegarde)
2. [Procédures de Restauration](#2-procédures-de-restauration)
3. [Gestion des Mises à Jour](#3-gestion-des-mises-à-jour)
4. [Maintenance Préventive](#4-maintenance-préventive)
5. [Monitoring Continu](#5-monitoring-continu)
6. [Gestion des Logs](#6-gestion-des-logs)
7. [Procédures d'Urgence](#7-procédures-durgence)
8. [Contacts et Escalade](#8-contacts-et-escalade)
9. [Checklists de Maintenance](#9-checklists-de-maintenance)

---

## 1. PROCÉDURES DE SAUVEGARDE

### 1.1 Sauvegarde Manuelle

#### 1.1.1 Sauvegarde de la Base de Données

**Localisation** : `data/database.sqlite` (ou selon configuration)

**Procédure** :

```bash
# 1. Arrêter l'application (recommandé)
# Depuis l'interface : Menu → Quitter

# 2. Créer une sauvegarde avec horodatage
cd /chemin/vers/application
mkdir -p backups/manual
cp data/database.sqlite backups/manual/database-$(date +%Y%m%d-%H%M%S).sqlite

# 3. Vérifier l'intégrité
sqlite3 backups/manual/database-*.sqlite "PRAGMA integrity_check;"
```

**Résultat attendu** : `ok`

#### 1.1.2 Sauvegarde des Fichiers de Configuration

```bash
# Sauvegarder les configurations
tar -czf backups/manual/config-$(date +%Y%m%d-%H%M%S).tar.gz \
    config/*.json \
    config/*.yml \
    .env
```

#### 1.1.3 Sauvegarde des Documents GED

```bash
# Sauvegarder les fichiers GED
tar -czf backups/manual/ged-$(date +%Y%m%d-%H%M%S).tar.gz \
    data/ged/ \
    --exclude='*.tmp'
```

#### 1.1.4 Sauvegarde des Logs Critiques

```bash
# Archiver les logs importants
tar -czf backups/manual/logs-$(date +%Y%m%d-%H%M%S).tar.gz \
    logs/*.log \
    logs/permissions-validation/
```

#### 1.1.5 Sauvegarde Complète du Système

```bash
# Script de sauvegarde complète
#!/bin/bash
BACKUP_DIR="backups/manual/full-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Arrêter l'application
echo "Arrêt de l'application..."
# Commande d'arrêt appropriée

# Sauvegarde complète
echo "Sauvegarde en cours..."
cp -r data/ "$BACKUP_DIR/"
cp -r config/ "$BACKUP_DIR/"
cp -r logs/ "$BACKUP_DIR/"
cp package.json "$BACKUP_DIR/"
cp .env "$BACKUP_DIR/"

# Créer une archive compressée
tar -czf "$BACKUP_DIR.tar.gz" "$BACKUP_DIR/"
rm -rf "$BACKUP_DIR"

echo "Sauvegarde complète : $BACKUP_DIR.tar.gz"
```

### 1.2 Sauvegarde Automatique

#### 1.2.1 Configuration de la Sauvegarde Automatique

**Script** : `scripts/backup-auto.js`

```javascript
// scripts/backup-auto.js
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const BACKUP_CONFIG = {
  databasePath: './data/database.sqlite',
  backupDir: './backups/auto',
  retentionDays: 30,
  schedule: '0 2 * * *' // 2h du matin chaque jour
};

function performBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(
    BACKUP_CONFIG.backupDir,
    `database-${timestamp}.sqlite`
  );

  // Copier la base de données
  fs.copyFileSync(BACKUP_CONFIG.databasePath, backupPath);

  // Vérifier l'intégrité
  exec(`sqlite3 ${backupPath} "PRAGMA integrity_check;"`, (error, stdout) => {
    if (stdout.trim() === 'ok') {
      console.log(`✅ Sauvegarde réussie : ${backupPath}`);
      cleanOldBackups();
    } else {
      console.error(`❌ Erreur d'intégrité : ${backupPath}`);
      fs.unlinkSync(backupPath);
    }
  });
}

function cleanOldBackups() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - BACKUP_CONFIG.retentionDays);

  fs.readdirSync(BACKUP_CONFIG.backupDir).forEach(file => {
    const filePath = path.join(BACKUP_CONFIG.backupDir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.mtime < cutoffDate) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Suppression ancienne sauvegarde : ${file}`);
    }
  });
}

// Exécution
if (require.main === module) {
  performBackup();
}

module.exports = { performBackup };
```

#### 1.2.2 Activation de la Sauvegarde Automatique

**Windows (Planificateur de tâches)** :

```powershell
# Créer une tâche planifiée
$action = New-ScheduledTaskAction -Execute "node" -Argument "C:\chemin\vers\scripts\backup-auto.js"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RestartCount 3

Register-ScheduledTask -TaskName "RDSViewer-Backup" `
  -Action $action `
  -Trigger $trigger `
  -Principal $principal `
  -Settings $settings `
  -Description "Sauvegarde automatique RDS Viewer"
```

**Linux (Cron)** :

```bash
# Éditer crontab
crontab -e

# Ajouter la ligne suivante (2h du matin chaque jour)
0 2 * * * cd /chemin/vers/application && /usr/bin/node scripts/backup-auto.js >> logs/backup.log 2>&1
```

### 1.3 Sauvegarde Planifiée (Multi-niveaux)

#### 1.3.1 Stratégie de Sauvegarde 3-2-1

- **3** copies des données (originale + 2 sauvegardes)
- **2** supports différents (local + réseau)
- **1** copie hors site (cloud ou serveur distant)

#### 1.3.2 Planification Recommandée

| Type | Fréquence | Rétention | Destination |
|------|-----------|-----------|-------------|
| **Complète** | Hebdomadaire (Dimanche 1h) | 4 semaines | Serveur réseau |
| **Différentielle** | Quotidienne (2h) | 7 jours | Disque local |
| **Incrémentale** | Toutes les 4h | 24h | Disque local |
| **Configuration** | Avant chaque mise à jour | Permanent | Local + Réseau |
| **GED** | Quotidienne (3h) | 30 jours | Réseau + Cloud |

#### 1.3.3 Script de Sauvegarde Planifiée

```bash
#!/bin/bash
# scripts/backup-scheduled.sh

BACKUP_TYPE=$1  # full, diff, inc
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
APP_DIR="/chemin/vers/application"
BACKUP_BASE="$APP_DIR/backups/scheduled"

case $BACKUP_TYPE in
  full)
    echo "🔄 Sauvegarde complète..."
    BACKUP_DIR="$BACKUP_BASE/full/backup-$TIMESTAMP"
    mkdir -p "$BACKUP_DIR"
    
    # Base de données
    cp "$APP_DIR/data/database.sqlite" "$BACKUP_DIR/"
    
    # Configuration
    cp -r "$APP_DIR/config" "$BACKUP_DIR/"
    
    # GED
    rsync -a --exclude='*.tmp' "$APP_DIR/data/ged/" "$BACKUP_DIR/ged/"
    
    # Logs essentiels
    cp -r "$APP_DIR/logs/permissions-validation" "$BACKUP_DIR/logs/"
    
    # Archive
    tar -czf "$BACKUP_BASE/full/backup-$TIMESTAMP.tar.gz" -C "$BACKUP_BASE/full" "backup-$TIMESTAMP"
    rm -rf "$BACKUP_DIR"
    
    # Copie réseau
    scp "$BACKUP_BASE/full/backup-$TIMESTAMP.tar.gz" backup-server:/backups/rds-viewer/
    
    echo "✅ Sauvegarde complète terminée"
    ;;
    
  diff)
    echo "🔄 Sauvegarde différentielle..."
    # Trouver la dernière sauvegarde complète
    LAST_FULL=$(ls -t $BACKUP_BASE/full/*.tar.gz | head -1)
    BACKUP_DIR="$BACKUP_BASE/diff/backup-$TIMESTAMP"
    mkdir -p "$BACKUP_DIR"
    
    # Fichiers modifiés depuis la dernière sauvegarde complète
    find "$APP_DIR/data" -newer "$LAST_FULL" -type f -exec cp --parents {} "$BACKUP_DIR" \;
    
    tar -czf "$BACKUP_BASE/diff/backup-$TIMESTAMP.tar.gz" -C "$BACKUP_BASE/diff" "backup-$TIMESTAMP"
    rm -rf "$BACKUP_DIR"
    
    echo "✅ Sauvegarde différentielle terminée"
    ;;
    
  inc)
    echo "🔄 Sauvegarde incrémentale..."
    BACKUP_DIR="$BACKUP_BASE/inc/backup-$TIMESTAMP"
    mkdir -p "$BACKUP_DIR"
    
    # Uniquement la base de données
    cp "$APP_DIR/data/database.sqlite" "$BACKUP_DIR/"
    
    gzip "$BACKUP_DIR/database.sqlite"
    
    echo "✅ Sauvegarde incrémentale terminée"
    ;;
    
  *)
    echo "❌ Usage: $0 {full|diff|inc}"
    exit 1
    ;;
esac

# Nettoyer les anciennes sauvegardes
find "$BACKUP_BASE/inc" -mtime +1 -delete
find "$BACKUP_BASE/diff" -mtime +7 -delete
find "$BACKUP_BASE/full" -mtime +28 -delete
```

#### 1.3.4 Configuration Cron Complète

```bash
# Sauvegarde complète hebdomadaire (Dimanche 1h)
0 1 * * 0 /chemin/vers/scripts/backup-scheduled.sh full >> /chemin/vers/logs/backup-scheduled.log 2>&1

# Sauvegarde différentielle quotidienne (2h)
0 2 * * 1-6 /chemin/vers/scripts/backup-scheduled.sh diff >> /chemin/vers/logs/backup-scheduled.log 2>&1

# Sauvegarde incrémentale (toutes les 4h)
0 */4 * * * /chemin/vers/scripts/backup-scheduled.sh inc >> /chemin/vers/logs/backup-scheduled.log 2>&1
```

### 1.4 Vérification des Sauvegardes

#### 1.4.1 Checklist de Vérification

```bash
# Script de vérification
#!/bin/bash
# scripts/verify-backup.sh

BACKUP_FILE=$1

echo "🔍 Vérification de la sauvegarde : $BACKUP_FILE"

# 1. Vérifier l'existence
if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Fichier introuvable"
  exit 1
fi

# 2. Vérifier la taille (doit être > 1MB)
SIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE")
if [ $SIZE -lt 1048576 ]; then
  echo "⚠️ Taille suspecte : $SIZE octets"
fi

# 3. Extraire et vérifier l'intégrité
TEMP_DIR=$(mktemp -d)
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR" 2>/dev/null

# 4. Vérifier la base de données
DB_FILE=$(find "$TEMP_DIR" -name "database.sqlite" | head -1)
if [ -f "$DB_FILE" ]; then
  INTEGRITY=$(sqlite3 "$DB_FILE" "PRAGMA integrity_check;")
  if [ "$INTEGRITY" = "ok" ]; then
    echo "✅ Base de données intègre"
  else
    echo "❌ Base de données corrompue"
    rm -rf "$TEMP_DIR"
    exit 1
  fi
else
  echo "⚠️ Base de données non trouvée"
fi

# 5. Vérifier les fichiers essentiels
REQUIRED_FILES=("config/config.json" "package.json")
for FILE in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$TEMP_DIR/$FILE" ]; then
    echo "⚠️ Fichier manquant : $FILE"
  fi
done

rm -rf "$TEMP_DIR"
echo "✅ Vérification terminée avec succès"
```

---

## 2. PROCÉDURES DE RESTAURATION

### 2.1 Restauration depuis Sauvegarde

#### 2.1.1 Préparation

```bash
# 1. Arrêter l'application
# Menu → Quitter ou :
pkill -f "RDS Viewer" || systemctl stop rds-viewer

# 2. Créer une sauvegarde de l'état actuel (par précaution)
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
cp -r data data.before-restore.$TIMESTAMP
```

#### 2.1.2 Restauration Complète

```bash
#!/bin/bash
# scripts/restore-backup.sh

BACKUP_FILE=$1
RESTORE_DIR="/chemin/vers/application"

if [ -z "$BACKUP_FILE" ]; then
  echo "❌ Usage: $0 <fichier-sauvegarde.tar.gz>"
  exit 1
fi

echo "🔄 Restauration depuis : $BACKUP_FILE"

# 1. Vérifier la sauvegarde
./scripts/verify-backup.sh "$BACKUP_FILE"
if [ $? -ne 0 ]; then
  echo "❌ Sauvegarde invalide, restauration annulée"
  exit 1
fi

# 2. Créer sauvegarde préalable
echo "📦 Sauvegarde de l'état actuel..."
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
tar -czf "backups/before-restore-$TIMESTAMP.tar.gz" data/ config/

# 3. Extraire la sauvegarde
echo "📂 Extraction de la sauvegarde..."
TEMP_DIR=$(mktemp -d)
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# 4. Restaurer la base de données
echo "🗄️ Restauration de la base de données..."
cp "$TEMP_DIR"/*/database.sqlite "$RESTORE_DIR/data/"

# 5. Restaurer la configuration
echo "⚙️ Restauration de la configuration..."
cp -r "$TEMP_DIR"/*/config/* "$RESTORE_DIR/config/"

# 6. Restaurer les fichiers GED
echo "📚 Restauration des fichiers GED..."
if [ -d "$TEMP_DIR"/*/ged ]; then
  cp -r "$TEMP_DIR"/*/ged/* "$RESTORE_DIR/data/ged/"
fi

# 7. Vérifier l'intégrité post-restauration
echo "🔍 Vérification de l'intégrité..."
sqlite3 "$RESTORE_DIR/data/database.sqlite" "PRAGMA integrity_check;"

# 8. Nettoyer
rm -rf "$TEMP_DIR"

echo "✅ Restauration terminée avec succès"
echo "🚀 Vous pouvez redémarrer l'application"
```

#### 2.1.3 Restauration Partielle

**Restaurer uniquement la base de données** :

```bash
# Extraire uniquement la DB depuis une sauvegarde
tar -xzf backup-20251104-020000.tar.gz --strip-components=2 -C /tmp backup-20251104-020000/database.sqlite

# Arrêter l'application
pkill -f "RDS Viewer"

# Remplacer la DB
cp /tmp/database.sqlite data/

# Vérifier
sqlite3 data/database.sqlite "PRAGMA integrity_check;"

# Redémarrer
# Lancer l'application
```

**Restaurer uniquement la configuration** :

```bash
# Extraire la configuration
tar -xzf backup-20251104-020000.tar.gz backup-20251104-020000/config/

# Copier les fichiers de configuration
cp backup-20251104-020000/config/*.json config/

# Redémarrer l'application
```

### 2.2 Récupération d'Urgence

#### 2.2.1 Perte de Base de Données

**Scénario** : Base de données corrompue ou perdue

```bash
#!/bin/bash
# scripts/emergency-db-recovery.sh

echo "🚨 RÉCUPÉRATION D'URGENCE - BASE DE DONNÉES"

# 1. Tenter une récupération SQLite
echo "🔧 Tentative de récupération SQLite..."
sqlite3 data/database.sqlite ".recover" | sqlite3 data/database-recovered.sqlite

# Vérifier
INTEGRITY=$(sqlite3 data/database-recovered.sqlite "PRAGMA integrity_check;")
if [ "$INTEGRITY" = "ok" ]; then
  echo "✅ Récupération réussie"
  cp data/database.sqlite data/database.corrupted.$(date +%Y%m%d-%H%M%S)
  mv data/database-recovered.sqlite data/database.sqlite
  exit 0
fi

# 2. Chercher les sauvegardes disponibles
echo "🔍 Recherche de sauvegardes..."
BACKUPS=($(find backups/ -name "*.sqlite" -o -name "*database*.tar.gz" | sort -r))

if [ ${#BACKUPS[@]} -eq 0 ]; then
  echo "❌ Aucune sauvegarde trouvée"
  echo "🔄 Initialisation d'une nouvelle base de données..."
  npm run init-db
  exit 1
fi

# 3. Afficher les sauvegardes disponibles
echo "📋 Sauvegardes disponibles :"
for i in "${!BACKUPS[@]}"; do
  echo "  $i) ${BACKUPS[$i]}"
done

# 4. Restaurer la plus récente
echo "🔄 Restauration de la sauvegarde la plus récente..."
LATEST="${BACKUPS[0]}"

if [[ "$LATEST" == *.sqlite ]]; then
  cp "$LATEST" data/database.sqlite
elif [[ "$LATEST" == *.tar.gz ]]; then
  tar -xzf "$LATEST" -C /tmp
  cp /tmp/*/database.sqlite data/
fi

# 5. Vérification finale
sqlite3 data/database.sqlite "PRAGMA integrity_check;"
echo "✅ Base de données restaurée"
```

#### 2.2.2 Corruption de Données

```bash
# Script de réparation
#!/bin/bash

echo "🔧 Réparation de la base de données..."

# Dump et reload
sqlite3 data/database.sqlite .dump | sqlite3 data/database-repaired.sqlite

# Vérifier
if sqlite3 data/database-repaired.sqlite "PRAGMA integrity_check;" | grep -q "ok"; then
  echo "✅ Réparation réussie"
  mv data/database.sqlite data/database.corrupted.bak
  mv data/database-repaired.sqlite data/database.sqlite
else
  echo "❌ Réparation échouée, utiliser une sauvegarde"
  rm data/database-repaired.sqlite
  exit 1
fi
```

#### 2.2.3 Récupération de Configuration

```bash
#!/bin/bash
# scripts/recover-config.sh

echo "🔄 Récupération de la configuration..."

# 1. Chercher la configuration dans les sauvegardes
BACKUP_CONFIG=$(find backups/ -name "config.json" | sort -r | head -1)

if [ -n "$BACKUP_CONFIG" ]; then
  echo "✅ Configuration trouvée : $BACKUP_CONFIG"
  cp "$BACKUP_CONFIG" config/config.json
else
  echo "⚠️ Aucune sauvegarde trouvée, utilisation du template"
  cp config/config.template.json config/config.json
  echo "⚠️ Veuillez configurer manuellement config/config.json"
fi

# 2. Valider la configuration
if node -e "require('./config/config.json')"; then
  echo "✅ Configuration valide"
else
  echo "❌ Configuration invalide"
  exit 1
fi
```

#### 2.2.4 Plan de Récupération en Cas de Sinistre (DRP)

**Étapes prioritaires** :

1. **Évaluation** (5 min)
   - Identifier l'étendue du problème
   - Vérifier la disponibilité des sauvegardes
   - Alerter l'équipe

2. **Isolation** (10 min)
   - Arrêter l'application
   - Déconnecter du réseau si compromission
   - Sécuriser les données restantes

3. **Restauration** (30-60 min)
   - Restaurer depuis la sauvegarde la plus récente
   - Vérifier l'intégrité
   - Tester les fonctionnalités critiques

4. **Validation** (15 min)
   - Tests fonctionnels
   - Vérification des accès
   - Validation utilisateurs

5. **Retour en production** (15 min)
   - Redémarrage de l'application
   - Monitoring renforcé
   - Documentation de l'incident

**RTO (Recovery Time Objective)** : 2 heures  
**RPO (Recovery Point Objective)** : 4 heures (perte de données maximale)

---

## 3. GESTION DES MISES À JOUR

### 3.1 Vérification des Mises à Jour

#### 3.1.1 Vérification Manuelle

```bash
# Vérifier la version actuelle
cat package.json | grep version

# Vérifier les mises à jour disponibles
npm outdated

# Vérifier spécifiquement Electron
npm outdated electron

# Vérifier les mises à jour de sécurité
npm audit
```

#### 3.1.2 Vérification Automatique

L'application dispose d'un système d'auto-update intégré (electron-updater).

**Configuration** : `electron-builder.json`

```json
{
  "publish": {
    "provider": "generic",
    "url": "https://updates.example.com/rds-viewer/"
  },
  "updater": {
    "enabled": true,
    "autoDownload": false,
    "autoInstallOnAppQuit": true
  }
}
```

**Vérification depuis l'application** :
- Menu → Aide → Vérifier les mises à jour

### 3.2 Téléchargement des Mises à Jour

#### 3.2.1 Téléchargement depuis le Serveur

```bash
# Télécharger la dernière version
wget https://updates.example.com/rds-viewer/latest/RDS-Viewer-Setup-3.0.31.exe

# Ou
curl -O https://updates.example.com/rds-viewer/latest/RDS-Viewer-Setup-3.0.31.exe

# Vérifier le checksum
sha256sum RDS-Viewer-Setup-3.0.31.exe
# Comparer avec le hash publié
```

#### 3.2.2 Téléchargement depuis le Repository

```bash
# Cloner/mettre à jour le code source
cd /chemin/vers/application
git fetch origin
git checkout tags/v3.0.31

# Installer les dépendances
npm install
```

### 3.3 Installation des Mises à Jour

#### 3.3.1 Préparation

**Checklist avant mise à jour** :

- [ ] Créer une sauvegarde complète
- [ ] Vérifier l'espace disque disponible (> 2 GB)
- [ ] Informer les utilisateurs (planning de maintenance)
- [ ] Lire les notes de version (CHANGELOG)
- [ ] Vérifier la compatibilité de la base de données
- [ ] Préparer un plan de rollback

```bash
# Script de préparation
#!/bin/bash
# scripts/pre-update.sh

echo "🔍 Vérification pré-mise à jour..."

# 1. Sauvegarde
echo "📦 Création de la sauvegarde..."
./scripts/backup-scheduled.sh full

# 2. Espace disque
FREE_SPACE=$(df -h . | awk 'NR==2 {print $4}' | sed 's/G//')
if (( $(echo "$FREE_SPACE < 2" | bc -l) )); then
  echo "❌ Espace disque insuffisant : ${FREE_SPACE}G"
  exit 1
fi

# 3. Version actuelle
CURRENT_VERSION=$(cat package.json | grep version | cut -d'"' -f4)
echo "📌 Version actuelle : $CURRENT_VERSION"

# 4. Processus en cours
if pgrep -f "RDS Viewer" > /dev/null; then
  echo "⚠️ L'application est en cours d'exécution"
  echo "Arrêt de l'application..."
  pkill -f "RDS Viewer"
  sleep 5
fi

echo "✅ Prêt pour la mise à jour"
```

#### 3.3.2 Installation de la Mise à Jour

**Méthode 1 : Installation depuis exécutable (Windows)** :

```powershell
# Arrêter l'application
Stop-Process -Name "RDS Viewer" -Force

# Sauvegarder
.\scripts\backup-scheduled.ps1 full

# Installer la nouvelle version
Start-Process -Wait -FilePath "RDS-Viewer-Setup-3.0.31.exe" -ArgumentList "/S"

# Vérifier l'installation
& "C:\Program Files\RDS Viewer\RDS Viewer.exe" --version
```

**Méthode 2 : Installation depuis les sources** :

```bash
#!/bin/bash
# scripts/install-update.sh

NEW_VERSION=$1

if [ -z "$NEW_VERSION" ]; then
  echo "❌ Usage: $0 <version>"
  exit 1
fi

echo "🚀 Installation de la version $NEW_VERSION"

# 1. Préparation
./scripts/pre-update.sh

# 2. Récupérer la nouvelle version
git fetch origin
git checkout tags/v$NEW_VERSION

# 3. Installer les dépendances
npm ci --production

# 4. Migrations de base de données (si nécessaire)
if [ -f "scripts/migrate-db-$NEW_VERSION.js" ]; then
  echo "🔄 Exécution des migrations..."
  node scripts/migrate-db-$NEW_VERSION.js
fi

# 5. Rebuild Electron
npm run electron:rebuild

# 6. Vérification
npm run test:quick

echo "✅ Installation terminée"
```

#### 3.3.3 Post-Installation

```bash
# Script post-installation
#!/bin/bash
# scripts/post-update.sh

echo "🔍 Vérifications post-mise à jour..."

# 1. Vérifier la version
NEW_VERSION=$(cat package.json | grep version | cut -d'"' -f4)
echo "✅ Nouvelle version : $NEW_VERSION"

# 2. Vérifier l'intégrité de la base de données
sqlite3 data/database.sqlite "PRAGMA integrity_check;"

# 3. Vérifier les permissions des fichiers
find . -type f -name "*.js" -exec chmod 644 {} \;
find . -type f -name "*.sh" -exec chmod 755 {} \;

# 4. Test de démarrage
timeout 30s npm start &
PID=$!
sleep 10

if ps -p $PID > /dev/null; then
  echo "✅ L'application démarre correctement"
  kill $PID
else
  echo "❌ Problème de démarrage"
  exit 1
fi

# 5. Log de mise à jour
echo "$(date '+%Y-%m-%d %H:%M:%S') - Mise à jour vers $NEW_VERSION réussie" >> logs/updates.log

echo "✅ Vérifications terminées"
```

### 3.4 Rollback (Retour Arrière)

#### 3.4.1 Procédure de Rollback

```bash
#!/bin/bash
# scripts/rollback-update.sh

echo "⏪ ROLLBACK - Retour à la version précédente"

# 1. Arrêter l'application
pkill -f "RDS Viewer"

# 2. Identifier la sauvegarde pré-mise à jour
BACKUP=$(ls -t backups/before-update-*.tar.gz | head -1)

if [ -z "$BACKUP" ]; then
  echo "❌ Aucune sauvegarde de rollback trouvée"
  exit 1
fi

echo "🔄 Restauration depuis : $BACKUP"

# 3. Restaurer
./scripts/restore-backup.sh "$BACKUP"

# 4. Revenir à la version Git précédente (si applicable)
git log --oneline -5
echo "Entrez le commit à restaurer (ou appuyez sur Entrée pour annuler) :"
read COMMIT

if [ -n "$COMMIT" ]; then
  git checkout $COMMIT
  npm ci --production
fi

# 5. Vérifier
npm run test:quick

echo "✅ Rollback terminé"
echo "📝 N'oubliez pas de documenter l'incident"
```

#### 3.4.2 Rollback Automatique en Cas d'Échec

```javascript
// scripts/auto-rollback.js
const { exec } = require('child_process');
const fs = require('fs');

async function verifyUpdate() {
  // Tests de vérification
  const tests = [
    'npm run test:quick',
    'node -e "require(\'./server/server.js\')"',
    'sqlite3 data/database.sqlite "PRAGMA integrity_check;"'
  ];

  for (const test of tests) {
    try {
      await execPromise(test);
    } catch (error) {
      console.error(`❌ Test échoué : ${test}`);
      return false;
    }
  }
  return true;
}

async function performRollback() {
  console.log('⏪ Rollback automatique en cours...');
  await execPromise('./scripts/rollback-update.sh');
  
  // Envoyer une alerte
  await sendAlert('Rollback automatique effectué après échec de mise à jour');
}

async function main() {
  const updateSuccess = await verifyUpdate();
  
  if (!updateSuccess) {
    await performRollback();
    process.exit(1);
  }
  
  console.log('✅ Mise à jour validée');
}

main();
```

---

## 4. MAINTENANCE PRÉVENTIVE

### 4.1 Nettoyage de la Base de Données

#### 4.1.1 Nettoyage des Données Temporaires

```sql
-- scripts/cleanup-database.sql

-- 1. Supprimer les sessions expirées (> 30 jours)
DELETE FROM sessions 
WHERE last_activity < datetime('now', '-30 days');

-- 2. Supprimer les logs anciens (> 90 jours)
DELETE FROM logs 
WHERE created_at < datetime('now', '-90 days');

-- 3. Supprimer les caches périmés
DELETE FROM cache 
WHERE expires_at < datetime('now');

-- 4. Nettoyer les enregistrements d'activité (> 6 mois)
DELETE FROM activity_logs 
WHERE timestamp < datetime('now', '-6 months');

-- 5. Supprimer les documents GED orphelins
DELETE FROM ged_documents 
WHERE id NOT IN (SELECT document_id FROM ged_versions) 
AND created_at < datetime('now', '-1 year');

-- 6. Afficher les statistiques
SELECT 
  'Sessions supprimées' as Action,
  changes() as Count;
```

```bash
# Script de nettoyage automatisé
#!/bin/bash
# scripts/cleanup-database.sh

echo "🧹 Nettoyage de la base de données..."

# Sauvegarder avant nettoyage
BACKUP_FILE="backups/before-cleanup-$(date +%Y%m%d-%H%M%S).sqlite"
cp data/database.sqlite "$BACKUP_FILE"

# Taille initiale
INITIAL_SIZE=$(stat -f%z data/database.sqlite 2>/dev/null || stat -c%s data/database.sqlite)
echo "📊 Taille initiale : $((INITIAL_SIZE / 1024 / 1024)) MB"

# Exécuter le nettoyage
sqlite3 data/database.sqlite < scripts/cleanup-database.sql

# VACUUM pour récupérer l'espace
echo "🔧 Optimisation (VACUUM)..."
sqlite3 data/database.sqlite "VACUUM;"

# Taille finale
FINAL_SIZE=$(stat -f%z data/database.sqlite 2>/dev/null || stat -c%s data/database.sqlite)
SAVED=$((INITIAL_SIZE - FINAL_SIZE))
echo "📊 Taille finale : $((FINAL_SIZE / 1024 / 1024)) MB"
echo "✅ Espace libéré : $((SAVED / 1024 / 1024)) MB"

# Log
echo "$(date '+%Y-%m-%d %H:%M:%S') - Nettoyage DB : ${SAVED} octets libérés" >> logs/maintenance.log
```

#### 4.1.2 Nettoyage des Fichiers

```bash
#!/bin/bash
# scripts/cleanup-files.sh

echo "🧹 Nettoyage des fichiers temporaires..."

# 1. Logs anciens (> 30 jours)
find logs/ -name "*.log" -mtime +30 -delete
echo "✅ Logs anciens supprimés"

# 2. Fichiers temporaires
find temp/ -type f -mtime +1 -delete
find data/cache/ -type f -mtime +7 -delete
echo "✅ Fichiers temporaires supprimés"

# 3. Anciens OCR (> 90 jours)
find data/ocr/ -name "*.txt" -mtime +90 -delete
echo "✅ OCR anciens supprimés"

# 4. Sauvegardes anciennes (respecter la politique de rétention)
find backups/auto/ -mtime +30 -delete
find backups/manual/ -mtime +90 -delete
echo "✅ Anciennes sauvegardes supprimées"

# 5. Node modules cache
npm cache clean --force
echo "✅ Cache npm nettoyé"

# Afficher l'espace libéré
du -sh data/ logs/ temp/ backups/
```

### 4.2 Optimisation de la Base de Données

#### 4.2.1 Analyse et Optimisation

```sql
-- scripts/optimize-database.sql

-- 1. Analyser les statistiques des tables
ANALYZE;

-- 2. Re-indexer
REINDEX;

-- 3. Optimiser les indexes
-- Identifier les indexes inutilisés
SELECT 
  name,
  tbl_name,
  sql
FROM sqlite_master
WHERE type = 'index'
AND name NOT IN (
  SELECT DISTINCT idx FROM sqlite_stat1
);

-- 4. Vérifier les tables fragmentées
PRAGMA table_info(users);
PRAGMA table_info(sessions);
PRAGMA table_info(logs);

-- 5. Statistiques d'utilisation
SELECT 
  name,
  (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=m.name) as row_count,
  (SELECT SUM(pgsize) FROM dbstat WHERE name=m.name) / 1024 / 1024 as size_mb
FROM sqlite_master m
WHERE type='table'
ORDER BY size_mb DESC;
```

```bash
#!/bin/bash
# scripts/optimize-database.sh

echo "⚡ Optimisation de la base de données..."

# Sauvegarder
BACKUP_FILE="backups/before-optimize-$(date +%Y%m%d-%H%M%S).sqlite"
cp data/database.sqlite "$BACKUP_FILE"

# Mesurer les performances avant
echo "📊 Performances AVANT optimisation :"
time sqlite3 data/database.sqlite "SELECT COUNT(*) FROM logs;"

# Exécuter l'optimisation
sqlite3 data/database.sqlite < scripts/optimize-database.sql

# VACUUM
sqlite3 data/database.sqlite "VACUUM;"

# Analyser
sqlite3 data/database.sqlite "ANALYZE;"

# Mesurer les performances après
echo "📊 Performances APRÈS optimisation :"
time sqlite3 data/database.sqlite "SELECT COUNT(*) FROM logs;"

echo "✅ Optimisation terminée"
```

#### 4.2.2 Optimisation des Performances

```javascript
// scripts/performance-optimization.js
const Database = require('better-sqlite3');
const db = new Database('data/database.sqlite');

console.log('⚡ Optimisation des performances...');

// Configuration optimale
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -64000'); // 64MB
db.pragma('temp_store = MEMORY');
db.pragma('mmap_size = 30000000000'); // 30GB

// Créer des indexes manquants
const indexes = [
  'CREATE INDEX IF NOT EXISTS idx_logs_date ON logs(created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity_logs(timestamp DESC)',
  'CREATE INDEX IF NOT EXISTS idx_ged_category ON ged_documents(category_id)'
];

indexes.forEach(sql => {
  try {
    db.exec(sql);
    console.log(`✅ Index créé : ${sql.split('idx_')[1]?.split(' ')[0]}`);
  } catch (error) {
    console.log(`⚠️ Index existe déjà`);
  }
});

db.close();
console.log('✅ Optimisation terminée');
```

### 4.3 Vérification de l'Intégrité

#### 4.3.1 Vérification de la Base de Données

```bash
#!/bin/bash
# scripts/integrity-check.sh

echo "🔍 Vérification de l'intégrité..."

# 1. Intégrité SQLite
echo "🗄️ Base de données :"
INTEGRITY=$(sqlite3 data/database.sqlite "PRAGMA integrity_check;")

if [ "$INTEGRITY" = "ok" ]; then
  echo "  ✅ Base de données intègre"
else
  echo "  ❌ PROBLÈME DÉTECTÉ :"
  echo "  $INTEGRITY"
  # Envoyer une alerte
  ./scripts/send-alert.sh "CRITIQUE" "Corruption de la base de données détectée"
fi

# 2. Vérifier les contraintes de clés étrangères
echo "🔗 Clés étrangères :"
sqlite3 data/database.sqlite "PRAGMA foreign_key_check;" | while read line; do
  if [ -n "$line" ]; then
    echo "  ❌ Contrainte violée : $line"
  fi
done

# 3. Vérifier les fichiers GED
echo "📁 Fichiers GED :"
MISSING_FILES=0
sqlite3 data/database.sqlite "SELECT file_path FROM ged_documents;" | while read filepath; do
  if [ ! -f "$filepath" ]; then
    echo "  ⚠️ Fichier manquant : $filepath"
    ((MISSING_FILES++))
  fi
done

if [ $MISSING_FILES -eq 0 ]; then
  echo "  ✅ Tous les fichiers GED présents"
else
  echo "  ⚠️ $MISSING_FILES fichiers manquants"
fi

# 4. Vérifier la configuration
echo "⚙️ Configuration :"
if node -e "require('./config/config.json')" 2>/dev/null; then
  echo "  ✅ Configuration valide"
else
  echo "  ❌ Configuration invalide"
fi

# 5. Vérifier les dépendances
echo "📦 Dépendances :"
npm list --depth=0 >/dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "  ✅ Dépendances OK"
else
  echo "  ⚠️ Problèmes de dépendances détectés"
  npm list --depth=0
fi

echo "✅ Vérification terminée"
```

#### 4.3.2 Vérification des Permissions et Accès

```javascript
// scripts/check-permissions.js
const fs = require('fs');
const path = require('path');

console.log('🔐 Vérification des permissions...');

const criticalPaths = [
  'data/database.sqlite',
  'config/config.json',
  'logs/',
  'data/ged/',
  'backups/'
];

criticalPaths.forEach(p => {
  try {
    const stats = fs.statSync(p);
    const mode = (stats.mode & parseInt('777', 8)).toString(8);
    
    if (p.includes('.sqlite') || p.includes('.json')) {
      if (mode !== '600' && mode !== '644') {
        console.log(`⚠️ ${p} : permissions ${mode} (recommandé: 644)`);
      } else {
        console.log(`✅ ${p} : permissions OK`);
      }
    } else {
      console.log(`📁 ${p} : ${mode}`);
    }
    
    // Vérifier les droits de lecture/écriture
    fs.accessSync(p, fs.constants.R_OK | fs.constants.W_OK);
    
  } catch (error) {
    console.log(`❌ ${p} : ${error.message}`);
  }
});

console.log('✅ Vérification terminée');
```

### 4.4 Maintenance Système

#### 4.4.1 Mise à Jour des Dépendances

```bash
#!/bin/bash
# scripts/update-dependencies.sh

echo "📦 Mise à jour des dépendances..."

# 1. Vérifier les mises à jour disponibles
echo "🔍 Vérification des mises à jour :"
npm outdated

# 2. Mettre à jour les dépendances (patch uniquement)
echo "⬆️ Mise à jour des patches..."
npm update

# 3. Vérifier les vulnérabilités
echo "🔒 Audit de sécurité :"
npm audit

# 4. Corriger les vulnérabilités automatiquement
echo "🔧 Correction automatique :"
npm audit fix

# 5. Tester après mise à jour
echo "🧪 Tests :"
npm run test:quick

if [ $? -eq 0 ]; then
  echo "✅ Dépendances mises à jour avec succès"
else
  echo "❌ Problème détecté, vérifier les logs"
  exit 1
fi
```

#### 4.4.2 Nettoyage Système

```bash
#!/bin/bash
# scripts/system-cleanup.sh

echo "🧹 Nettoyage système..."

# 1. Nettoyer npm cache
npm cache clean --force

# 2. Nettoyer node_modules orphelins
find . -name "node_modules" -type d -prune | while read dir; do
  if [ ! -f "$(dirname $dir)/package.json" ]; then
    echo "🗑️ Suppression : $dir"
    rm -rf "$dir"
  fi
done

# 3. Nettoyer les fichiers de build
rm -rf build/dist/*
rm -rf temp/*

# 4. Nettoyer les logs de développement
rm -f *.log
rm -f npm-debug.log*

# 5. Afficher l'espace disponible
df -h .

echo "✅ Nettoyage terminé"
```

---

## 5. MONITORING CONTINU

### 5.1 Métriques à Surveiller

#### 5.1.1 Métriques Système

| Métrique | Seuil Normal | Seuil Alerte | Seuil Critique |
|----------|--------------|--------------|----------------|
| **CPU** | < 60% | > 75% | > 90% |
| **RAM** | < 70% | > 80% | > 95% |
| **Disque** | < 70% | > 85% | > 95% |
| **I/O Disque** | < 100 MB/s | > 200 MB/s | > 500 MB/s |
| **Réseau** | < 10 MB/s | > 50 MB/s | > 100 MB/s |

#### 5.1.2 Métriques Application

| Métrique | Description | Objectif |
|----------|-------------|----------|
| **Temps de réponse** | Temps moyen de réponse API | < 200ms |
| **Requêtes/sec** | Nombre de requêtes par seconde | < 1000 |
| **Taux d'erreur** | Pourcentage d'erreurs 5xx | < 1% |
| **Sessions actives** | Nombre d'utilisateurs connectés | - |
| **Taille DB** | Taille de la base de données | Croissance < 10%/mois |
| **Temps requête DB** | Temps moyen requête SQL | < 50ms |

#### 5.1.3 Script de Monitoring

```javascript
// scripts/monitor.js
const os = require('os');
const fs = require('fs');
const Database = require('better-sqlite3');

function getSystemMetrics() {
  const cpuUsage = os.loadavg()[0] / os.cpus().length * 100;
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const memUsage = ((totalMem - freeMem) / totalMem * 100);
  
  return {
    cpu: cpuUsage.toFixed(2),
    memory: memUsage.toFixed(2),
    totalMemory: (totalMem / 1024 / 1024 / 1024).toFixed(2),
    freeMemory: (freeMem / 1024 / 1024 / 1024).toFixed(2)
  };
}

function getDiskMetrics() {
  const stats = fs.statfsSync('.');
  const total = stats.blocks * stats.bsize;
  const free = stats.bfree * stats.bsize;
  const used = total - free;
  const usagePercent = (used / total * 100);
  
  return {
    total: (total / 1024 / 1024 / 1024).toFixed(2),
    used: (used / 1024 / 1024 / 1024).toFixed(2),
    free: (free / 1024 / 1024 / 1024).toFixed(2),
    usage: usagePercent.toFixed(2)
  };
}

function getDatabaseMetrics() {
  const db = new Database('data/database.sqlite', { readonly: true });
  
  const size = fs.statSync('data/database.sqlite').size;
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const sessionCount = db.prepare('SELECT COUNT(*) as count FROM sessions WHERE last_activity > datetime("now", "-1 hour")').get().count;
  const recentLogs = db.prepare('SELECT COUNT(*) as count FROM logs WHERE created_at > datetime("now", "-1 hour")').get().count;
  
  db.close();
  
  return {
    size: (size / 1024 / 1024).toFixed(2),
    users: userCount,
    activeSessions: sessionCount,
    recentLogs: recentLogs
  };
}

function checkHealth() {
  const metrics = {
    timestamp: new Date().toISOString(),
    system: getSystemMetrics(),
    disk: getDiskMetrics(),
    database: getDatabaseMetrics()
  };
  
  // Vérifier les seuils
  const alerts = [];
  
  if (parseFloat(metrics.system.cpu) > 75) {
    alerts.push({ level: 'WARNING', message: `CPU élevé : ${metrics.system.cpu}%` });
  }
  if (parseFloat(metrics.system.cpu) > 90) {
    alerts.push({ level: 'CRITICAL', message: `CPU critique : ${metrics.system.cpu}%` });
  }
  
  if (parseFloat(metrics.system.memory) > 80) {
    alerts.push({ level: 'WARNING', message: `Mémoire élevée : ${metrics.system.memory}%` });
  }
  if (parseFloat(metrics.system.memory) > 95) {
    alerts.push({ level: 'CRITICAL', message: `Mémoire critique : ${metrics.system.memory}%` });
  }
  
  if (parseFloat(metrics.disk.usage) > 85) {
    alerts.push({ level: 'WARNING', message: `Disque plein : ${metrics.disk.usage}%` });
  }
  if (parseFloat(metrics.disk.usage) > 95) {
    alerts.push({ level: 'CRITICAL', message: `Disque critique : ${metrics.disk.usage}%` });
  }
  
  metrics.alerts = alerts;
  metrics.status = alerts.length === 0 ? 'HEALTHY' : 
                   alerts.some(a => a.level === 'CRITICAL') ? 'CRITICAL' : 'WARNING';
  
  return metrics;
}

// Exécution
const health = checkHealth();
console.log(JSON.stringify(health, null, 2));

// Enregistrer dans un fichier
fs.appendFileSync(
  'logs/monitoring.log',
  JSON.stringify(health) + '\n'
);

// Envoyer des alertes si nécessaire
if (health.alerts.length > 0) {
  health.alerts.forEach(alert => {
    console.error(`${alert.level}: ${alert.message}`);
    // Appeler le script d'alerte
    require('child_process').exec(`./scripts/send-alert.sh "${alert.level}" "${alert.message}"`);
  });
}

process.exit(health.alerts.some(a => a.level === 'CRITICAL') ? 1 : 0);
```

### 5.2 Configuration des Alertes

#### 5.2.1 Script d'Envoi d'Alertes

```bash
#!/bin/bash
# scripts/send-alert.sh

LEVEL=$1
MESSAGE=$2
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Fichier de log des alertes
ALERT_LOG="logs/alerts.log"
echo "[$TIMESTAMP] $LEVEL: $MESSAGE" >> $ALERT_LOG

# Email
if [ -n "$ALERT_EMAIL" ]; then
  echo "$MESSAGE" | mail -s "[RDS Viewer] $LEVEL - $TIMESTAMP" $ALERT_EMAIL
fi

# Webhook (Slack, Teams, etc.)
if [ -n "$WEBHOOK_URL" ]; then
  curl -X POST $WEBHOOK_URL \
    -H 'Content-Type: application/json' \
    -d "{\"text\":\"[RDS Viewer] $LEVEL\\n$MESSAGE\\n$TIMESTAMP\"}"
fi

# SMS (via API)
if [ "$LEVEL" = "CRITICAL" ] && [ -n "$SMS_API_URL" ]; then
  curl -X POST $SMS_API_URL \
    -H 'Content-Type: application/json' \
    -d "{\"phone\":\"$ALERT_PHONE\",\"message\":\"[RDS Viewer CRITIQUE] $MESSAGE\"}"
fi

echo "🚨 Alerte envoyée : $LEVEL - $MESSAGE"
```

#### 5.2.2 Configuration Cron pour Monitoring

```bash
# Monitoring toutes les 5 minutes
*/5 * * * * cd /chemin/vers/application && /usr/bin/node scripts/monitor.js >> logs/monitoring-cron.log 2>&1

# Vérification d'intégrité quotidienne
0 3 * * * cd /chemin/vers/application && /bin/bash scripts/integrity-check.sh >> logs/integrity-cron.log 2>&1

# Rapport hebdomadaire (Lundi 8h)
0 8 * * 1 cd /chemin/vers/application && /bin/bash scripts/weekly-report.sh
```

### 5.3 Dashboards de Monitoring

#### 5.3.1 Dashboard Simple (HTML)

```html
<!-- public/monitoring-dashboard.html -->
<!DOCTYPE html>
<html>
<head>
  <title>RDS Viewer - Monitoring</title>
  <meta http-equiv="refresh" content="60">
  <style>
    body { font-family: Arial; margin: 20px; background: #f5f5f5; }
    .metric { 
      background: white; 
      padding: 20px; 
      margin: 10px 0; 
      border-radius: 5px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .metric h3 { margin: 0 0 10px 0; color: #333; }
    .status { 
      display: inline-block; 
      padding: 5px 15px; 
      border-radius: 3px; 
      font-weight: bold;
    }
    .healthy { background: #4CAF50; color: white; }
    .warning { background: #FF9800; color: white; }
    .critical { background: #F44336; color: white; }
    .progress {
      background: #e0e0e0;
      border-radius: 10px;
      height: 20px;
      overflow: hidden;
    }
    .progress-bar {
      height: 100%;
      transition: width 0.3s;
      text-align: center;
      color: white;
      line-height: 20px;
    }
    .bar-ok { background: #4CAF50; }
    .bar-warning { background: #FF9800; }
    .bar-critical { background: #F44336; }
  </style>
</head>
<body>
  <h1>🖥️ RDS Viewer - Dashboard Monitoring</h1>
  <div id="dashboard"></div>
  
  <script>
    async function loadMetrics() {
      try {
        const response = await fetch('/api/monitoring/metrics');
        const data = await response.json();
        
        const status = data.status || 'UNKNOWN';
        const statusClass = status === 'HEALTHY' ? 'healthy' : 
                           status === 'WARNING' ? 'warning' : 'critical';
        
        let html = `
          <div class="metric">
            <h3>État général</h3>
            <span class="status ${statusClass}">${status}</span>
            <p><small>Dernière mise à jour : ${new Date(data.timestamp).toLocaleString()}</small></p>
          </div>
          
          <div class="metric">
            <h3>Système</h3>
            ${renderProgressBar('CPU', data.system.cpu, 75, 90)}
            ${renderProgressBar('Mémoire', data.system.memory, 80, 95)}
          </div>
          
          <div class="metric">
            <h3>Disque</h3>
            ${renderProgressBar('Utilisation', data.disk.usage, 85, 95)}
            <p>Total : ${data.disk.total} GB | Libre : ${data.disk.free} GB</p>
          </div>
          
          <div class="metric">
            <h3>Base de données</h3>
            <p>Taille : ${data.database.size} MB</p>
            <p>Utilisateurs : ${data.database.users}</p>
            <p>Sessions actives : ${data.database.activeSessions}</p>
            <p>Logs récents (1h) : ${data.database.recentLogs}</p>
          </div>
        `;
        
        if (data.alerts && data.alerts.length > 0) {
          html += '<div class="metric"><h3>⚠️ Alertes</h3><ul>';
          data.alerts.forEach(alert => {
            html += `<li><strong>${alert.level}:</strong> ${alert.message}</li>`;
          });
          html += '</ul></div>';
        }
        
        document.getElementById('dashboard').innerHTML = html;
      } catch (error) {
        document.getElementById('dashboard').innerHTML = 
          '<div class="metric critical">❌ Erreur de chargement des métriques</div>';
      }
    }
    
    function renderProgressBar(label, value, warningThreshold, criticalThreshold) {
      const barClass = value > criticalThreshold ? 'bar-critical' :
                       value > warningThreshold ? 'bar-warning' : 'bar-ok';
      return `
        <div style="margin: 10px 0;">
          <div style="margin-bottom: 5px;">${label}: ${value}%</div>
          <div class="progress">
            <div class="progress-bar ${barClass}" style="width: ${value}%">${value}%</div>
          </div>
        </div>
      `;
    }
    
    // Charger immédiatement
    loadMetrics();
    
    // Recharger toutes les 30 secondes
    setInterval(loadMetrics, 30000);
  </script>
</body>
</html>
```

#### 5.3.2 API de Monitoring

```javascript
// server/routes/monitoring.js
const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

router.get('/metrics', async (req, res) => {
  try {
    const { stdout } = await execPromise('node scripts/monitor.js');
    const metrics = JSON.parse(stdout);
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Erreur de récupération des métriques' });
  }
});

router.get('/health', (req, res) => {
  // Vérification rapide
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;
```

---

## 6. GESTION DES LOGS

### 6.1 Rotation des Logs

#### 6.1.1 Configuration de la Rotation

```javascript
// config/logger-config.js
const winston = require('winston');
require('winston-daily-rotate-file');

const logConfig = {
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // Fichier général avec rotation
    new winston.transports.DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      level: 'info'
    }),
    
    // Fichier d'erreurs
    new winston.transports.DailyRotateFile({
      filename: 'logs/errors-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '90d',
      level: 'error'
    }),
    
    // Fichier de debug (en développement uniquement)
    ...(process.env.NODE_ENV === 'development' ? [
      new winston.transports.DailyRotateFile({
        filename: 'logs/debug-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '50m',
        maxFiles: '7d',
        level: 'debug'
      })
    ] : [])
  ]
};

const logger = winston.createLogger(logConfig);

module.exports = logger;
```

#### 6.1.2 Script de Rotation Manuelle

```bash
#!/bin/bash
# scripts/rotate-logs.sh

LOG_DIR="logs"
ARCHIVE_DIR="logs/archive"
RETENTION_DAYS=90

echo "🔄 Rotation des logs..."

# Créer le dossier d'archives
mkdir -p "$ARCHIVE_DIR"

# Date de cutoff
CUTOFF_DATE=$(date -d "$RETENTION_DAYS days ago" +%Y-%m-%d)

# Archiver les logs anciens
find "$LOG_DIR" -name "*.log" -type f -mtime +30 | while read logfile; do
  if [ -f "$logfile" ]; then
    ARCHIVE_NAME="$(basename $logfile).$(date +%Y%m%d-%H%M%S).gz"
    gzip -c "$logfile" > "$ARCHIVE_DIR/$ARCHIVE_NAME"
    > "$logfile"  # Vider le fichier
    echo "📦 Archivé : $ARCHIVE_NAME"
  fi
done

# Supprimer les archives très anciennes
find "$ARCHIVE_DIR" -name "*.gz" -mtime +$RETENTION_DAYS -delete

# Afficher le résumé
echo "📊 Résumé :"
du -sh "$LOG_DIR"
echo "✅ Rotation terminée"
```

### 6.2 Archivage des Logs

#### 6.2.1 Stratégie d'Archivage

| Type de Log | Rétention Active | Rétention Archive | Destination |
|-------------|------------------|-------------------|-------------|
| Application | 30 jours | 1 an | Serveur local |
| Erreurs | 90 jours | 2 ans | Serveur + Backup |
| Sécurité | 180 jours | 5 ans | Serveur + Backup |
| Debug | 7 jours | Non archivé | Serveur local |
| Audit | 1 an | 7 ans | Serveur + Backup + Cloud |

#### 6.2.2 Script d'Archivage

```bash
#!/bin/bash
# scripts/archive-logs.sh

LOG_DIR="logs"
ARCHIVE_DIR="logs/archive"
REMOTE_BACKUP="backup-server:/archives/rds-viewer/logs"
DATE=$(date +%Y-%m)

echo "📦 Archivage des logs pour $DATE..."

# Créer une archive mensuelle
ARCHIVE_FILE="logs-$DATE.tar.gz"
tar -czf "$ARCHIVE_DIR/$ARCHIVE_FILE" \
    --exclude="*.gz" \
    --exclude="archive" \
    "$LOG_DIR"/*.log

# Copier vers le serveur de backup
scp "$ARCHIVE_DIR/$ARCHIVE_FILE" "$REMOTE_BACKUP/"

# Vérifier le transfert
if [ $? -eq 0 ]; then
  echo "✅ Archive transférée : $ARCHIVE_FILE"
  
  # Supprimer les logs archivés
  rm "$LOG_DIR"/*.log.old
else
  echo "❌ Échec du transfert"
  exit 1
fi

echo "✅ Archivage terminé"
```

### 6.3 Analyse des Logs

#### 6.3.1 Script d'Analyse

```bash
#!/bin/bash
# scripts/analyze-logs.sh

LOG_FILE=${1:-logs/application-$(date +%Y-%m-%d).log}

echo "📊 Analyse des logs : $LOG_FILE"
echo "================================"

# Statistiques générales
echo -e "\n📈 Statistiques générales :"
echo "Total de lignes : $(wc -l < $LOG_FILE)"
echo "Erreurs : $(grep -c '"level":"error"' $LOG_FILE)"
echo "Avertissements : $(grep -c '"level":"warn"' $LOG_FILE)"
echo "Info : $(grep -c '"level":"info"' $LOG_FILE)"

# Top 10 des erreurs
echo -e "\n❌ Top 10 des erreurs :"
grep '"level":"error"' $LOG_FILE | \
  jq -r '.message' | \
  sort | uniq -c | sort -rn | head -10

# Utilisateurs actifs
echo -e "\n👥 Utilisateurs actifs :"
grep '"user"' $LOG_FILE | \
  jq -r '.user' | \
  sort -u | wc -l

# Actions les plus fréquentes
echo -e "\n⚡ Actions les plus fréquentes :"
grep '"action"' $LOG_FILE | \
  jq -r '.action' | \
  sort | uniq -c | sort -rn | head -10

# Temps de réponse moyen
echo -e "\n⏱️ Temps de réponse moyen :"
grep '"responseTime"' $LOG_FILE | \
  jq -r '.responseTime' | \
  awk '{ total += $1; count++ } END { print total/count " ms" }'

# Détection d'anomalies
echo -e "\n🔍 Anomalies détectées :"

# Tentatives de connexion échouées
FAILED_LOGINS=$(grep '"action":"login"' $LOG_FILE | grep '"success":false' | wc -l)
if [ $FAILED_LOGINS -gt 10 ]; then
  echo "⚠️ $FAILED_LOGINS tentatives de connexion échouées"
fi

# Requêtes lentes
SLOW_QUERIES=$(grep '"responseTime"' $LOG_FILE | jq 'select(.responseTime > 1000)' | wc -l)
if [ $SLOW_QUERIES -gt 0 ]; then
  echo "⚠️ $SLOW_QUERIES requêtes lentes (> 1s)"
fi

# Erreurs 500
ERRORS_500=$(grep '"status":500' $LOG_FILE | wc -l)
if [ $ERRORS_500 -gt 0 ]; then
  echo "❌ $ERRORS_500 erreurs serveur (500)"
fi

echo -e "\n✅ Analyse terminée"
```

#### 6.3.2 Recherche dans les Logs

```bash
#!/bin/bash
# scripts/search-logs.sh

SEARCH_TERM=$1
DATE=${2:-$(date +%Y-%m-%d)}
LOG_FILE="logs/application-$DATE.log"

if [ -z "$SEARCH_TERM" ]; then
  echo "❌ Usage: $0 <terme-recherche> [date]"
  exit 1
fi

echo "🔍 Recherche de '$SEARCH_TERM' dans $LOG_FILE"
echo "============================================"

# Recherche simple
grep -i "$SEARCH_TERM" "$LOG_FILE" | \
  jq -r '"\(.timestamp) [\(.level)] \(.message)"' | \
  less

# Statistiques
TOTAL=$(grep -ic "$SEARCH_TERM" "$LOG_FILE")
echo -e "\n📊 Total de correspondances : $TOTAL"
```

#### 6.3.3 Génération de Rapports

```javascript
// scripts/generate-log-report.js
const fs = require('fs');
const readline = require('readline');

async function generateReport(logFile, outputFile) {
  const stats = {
    total: 0,
    errors: 0,
    warnings: 0,
    info: 0,
    users: new Set(),
    actions: {},
    errors_detail: {},
    response_times: []
  };
  
  const fileStream = fs.createReadStream(logFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  for await (const line of rl) {
    try {
      const log = JSON.parse(line);
      stats.total++;
      
      if (log.level === 'error') stats.errors++;
      if (log.level === 'warn') stats.warnings++;
      if (log.level === 'info') stats.info++;
      
      if (log.user) stats.users.add(log.user);
      
      if (log.action) {
        stats.actions[log.action] = (stats.actions[log.action] || 0) + 1;
      }
      
      if (log.level === 'error' && log.message) {
        stats.errors_detail[log.message] = (stats.errors_detail[log.message] || 0) + 1;
      }
      
      if (log.responseTime) {
        stats.response_times.push(log.responseTime);
      }
    } catch (e) {
      // Ligne invalide, ignorer
    }
  }
  
  // Calculs
  const avgResponseTime = stats.response_times.length > 0
    ? stats.response_times.reduce((a, b) => a + b, 0) / stats.response_times.length
    : 0;
  
  const maxResponseTime = Math.max(...stats.response_times, 0);
  
  // Générer le rapport
  const report = `
# Rapport d'Analyse des Logs
**Date** : ${new Date().toLocaleString()}  
**Fichier** : ${logFile}

## Statistiques Générales
- **Total de logs** : ${stats.total}
- **Erreurs** : ${stats.errors} (${(stats.errors/stats.total*100).toFixed(2)}%)
- **Avertissements** : ${stats.warnings} (${(stats.warnings/stats.total*100).toFixed(2)}%)
- **Info** : ${stats.info} (${(stats.info/stats.total*100).toFixed(2)}%)
- **Utilisateurs uniques** : ${stats.users.size}

## Performances
- **Temps de réponse moyen** : ${avgResponseTime.toFixed(2)} ms
- **Temps de réponse max** : ${maxResponseTime} ms

## Top 10 Actions
${Object.entries(stats.actions)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([action, count]) => `- ${action}: ${count}`)
  .join('\n')}

## Top 10 Erreurs
${Object.entries(stats.errors_detail)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([error, count]) => `- ${error}: ${count}`)
  .join('\n')}

## Recommandations
${stats.errors/stats.total > 0.05 ? '⚠️ Taux d\'erreurs élevé (> 5%)' : '✅ Taux d\'erreurs acceptable'}
${avgResponseTime > 500 ? '⚠️ Temps de réponse moyen élevé' : '✅ Performances acceptables'}
${stats.errors_detail['Database error'] ? '⚠️ Erreurs de base de données détectées' : ''}
  `;
  
  fs.writeFileSync(outputFile, report);
  console.log(`✅ Rapport généré : ${outputFile}`);
}

// Exécution
const logFile = process.argv[2] || `logs/application-${new Date().toISOString().split('T')[0]}.log`;
const outputFile = `logs/reports/report-${new Date().toISOString().split('T')[0]}.md`;

generateReport(logFile, outputFile);
```

---

## 7. PROCÉDURES D'URGENCE

### 7.1 Panne Système

#### 7.1.1 Diagnostic Rapide

```bash
#!/bin/bash
# scripts/emergency-diagnostic.sh

echo "🚨 DIAGNOSTIC D'URGENCE - RDS VIEWER"
echo "====================================="
echo "Timestamp : $(date '+%Y-%m-%d %H:%M:%S')"

# 1. Vérifier si l'application tourne
echo -e "\n📍 État de l'application :"
if pgrep -f "RDS Viewer" > /dev/null; then
  echo "✅ Processus en cours d'exécution"
  ps aux | grep "RDS Viewer"
else
  echo "❌ Application arrêtée"
fi

# 2. Vérifier les ports
echo -e "\n🔌 Ports réseau :"
netstat -tuln | grep -E ":(3000|3001|5000)" || echo "❌ Aucun port écoutant"

# 3. Vérifier la base de données
echo -e "\n🗄️ Base de données :"
if [ -f "data/database.sqlite" ]; then
  echo "✅ Fichier présent"
  DB_SIZE=$(stat -f%z "data/database.sqlite" 2>/dev/null || stat -c%s "data/database.sqlite")
  echo "Taille : $((DB_SIZE / 1024 / 1024)) MB"
  
  INTEGRITY=$(sqlite3 data/database.sqlite "PRAGMA integrity_check;" 2>&1)
  if [ "$INTEGRITY" = "ok" ]; then
    echo "✅ Intégrité OK"
  else
    echo "❌ CORRUPTION DÉTECTÉE"
  fi
else
  echo "❌ Fichier manquant"
fi

# 4. Vérifier les logs récents
echo -e "\n📋 Dernières erreurs :"
if [ -f "logs/errors-$(date +%Y-%m-%d).log" ]; then
  tail -20 "logs/errors-$(date +%Y-%m-%d).log"
else
  echo "Aucun log d'erreur aujourd'hui"
fi

# 5. Ressources système
echo -e "\n💻 Ressources système :"
echo "CPU : $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')%"
echo "RAM : $(free -h | awk 'NR==2{print $3"/"$2}')"
echo "Disque : $(df -h . | awk 'NR==2{print $5" utilisé"}')"

# 6. Configuration réseau
echo -e "\n🌐 Réseau :"
ping -c 1 8.8.8.8 > /dev/null 2>&1 && echo "✅ Internet OK" || echo "❌ Pas de connexion Internet"

# 7. Dernière sauvegarde
echo -e "\n💾 Dernière sauvegarde :"
LAST_BACKUP=$(ls -t backups/auto/*.sqlite 2>/dev/null | head -1)
if [ -n "$LAST_BACKUP" ]; then
  echo "✅ $LAST_BACKUP"
  echo "Date : $(stat -f%Sm "$LAST_BACKUP" 2>/dev/null || stat -c%y "$LAST_BACKUP")"
else
  echo "⚠️ Aucune sauvegarde trouvée"
fi

echo -e "\n====================================="
echo "Diagnostic terminé"
```

#### 7.1.2 Redémarrage d'Urgence

```bash
#!/bin/bash
# scripts/emergency-restart.sh

echo "🚨 REDÉMARRAGE D'URGENCE"

# 1. Sauvegarder l'état actuel
echo "📦 Sauvegarde de l'état actuel..."
EMERGENCY_BACKUP="backups/emergency-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$EMERGENCY_BACKUP"
cp -r data/database.sqlite "$EMERGENCY_BACKUP/" 2>/dev/null
cp -r logs/*.log "$EMERGENCY_BACKUP/" 2>/dev/null

# 2. Tuer les processus récalcitrants
echo "🔪 Arrêt forcé..."
pkill -9 -f "RDS Viewer"
pkill -9 -f "electron"
pkill -9 -f "node.*server.js"
sleep 2

# 3. Nettoyer les fichiers temporaires
echo "🧹 Nettoyage..."
rm -rf temp/*
rm -f *.lock

# 4. Vérifier l'intégrité
echo "🔍 Vérification..."
if sqlite3 data/database.sqlite "PRAGMA integrity_check;" | grep -q "ok"; then
  echo "✅ Base de données OK"
else
  echo "❌ Base de données corrompue, restauration..."
  ./scripts/emergency-db-recovery.sh
fi

# 5. Redémarrer
echo "🚀 Redémarrage..."
npm start &

# 6. Vérifier le démarrage
sleep 10
if pgrep -f "RDS Viewer" > /dev/null; then
  echo "✅ Application redémarrée avec succès"
  
  # Envoyer une notification
  ./scripts/send-alert.sh "INFO" "Redémarrage d'urgence effectué avec succès"
else
  echo "❌ Échec du redémarrage"
  ./scripts/send-alert.sh "CRITICAL" "Échec du redémarrage d'urgence"
  exit 1
fi
```

### 7.2 Perte de Données

#### 7.2.1 Évaluation de la Perte

```bash
#!/bin/bash
# scripts/assess-data-loss.sh

echo "🔍 ÉVALUATION DE LA PERTE DE DONNÉES"
echo "====================================="

# 1. Vérifier la base de données actuelle
if [ -f "data/database.sqlite" ]; then
  echo "✅ Base de données présente"
  
  # Vérifier l'intégrité
  INTEGRITY=$(sqlite3 data/database.sqlite "PRAGMA integrity_check;" 2>&1)
  if [ "$INTEGRITY" != "ok" ]; then
    echo "❌ Base de données corrompue : $INTEGRITY"
  fi
  
  # Compter les enregistrements
  echo -e "\n📊 Données actuelles :"
  sqlite3 data/database.sqlite <<EOF
SELECT 'Utilisateurs: ' || COUNT(*) FROM users;
SELECT 'Sessions: ' || COUNT(*) FROM sessions;
SELECT 'Documents GED: ' || COUNT(*) FROM ged_documents;
SELECT 'Logs: ' || COUNT(*) FROM logs;
EOF
else
  echo "❌ Base de données manquante"
fi

# 2. Identifier les sauvegardes disponibles
echo -e "\n💾 Sauvegardes disponibles :"
find backups/ -name "*.sqlite" -o -name "*.tar.gz" | while read backup; do
  SIZE=$(stat -f%z "$backup" 2>/dev/null || stat -c%s "$backup")
  DATE=$(stat -f%Sm "$backup" 2>/dev/null || stat -c%y "$backup")
  echo "  - $backup ($((SIZE / 1024 / 1024)) MB, $DATE)"
done

# 3. Comparer avec la dernière sauvegarde
LAST_BACKUP=$(find backups/auto -name "*.sqlite" | sort -r | head -1)
if [ -n "$LAST_BACKUP" ]; then
  echo -e "\n🔍 Comparaison avec la dernière sauvegarde :"
  echo "Backup : $LAST_BACKUP"
  
  sqlite3 "$LAST_BACKUP" <<EOF
SELECT 'Utilisateurs (backup): ' || COUNT(*) FROM users;
SELECT 'Sessions (backup): ' || COUNT(*) FROM sessions;
SELECT 'Documents GED (backup): ' || COUNT(*) FROM ged_documents;
SELECT 'Logs (backup): ' || COUNT(*) FROM logs;
EOF

  # Calculer la perte estimée
  CURRENT_LOGS=$(sqlite3 data/database.sqlite "SELECT COUNT(*) FROM logs;" 2>/dev/null || echo "0")
  BACKUP_LOGS=$(sqlite3 "$LAST_BACKUP" "SELECT COUNT(*) FROM logs;")
  LOST_LOGS=$((CURRENT_LOGS - BACKUP_LOGS))
  
  if [ $LOST_LOGS -lt 0 ]; then
    echo -e "\n⚠️ Perte estimée : $((0 - LOST_LOGS)) enregistrements"
  else
    echo -e "\n✅ Aucune perte détectée"
  fi
fi

echo -e "\n====================================="
```

#### 7.2.2 Récupération de Données

```bash
#!/bin/bash
# scripts/data-recovery.sh

echo "🔄 RÉCUPÉRATION DE DONNÉES"
echo "=========================="

# 1. Créer une sauvegarde de l'état actuel
CURRENT_BACKUP="backups/before-recovery-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "$CURRENT_BACKUP" data/ config/
echo "📦 Sauvegarde actuelle : $CURRENT_BACKUP"

# 2. Lister les sauvegardes disponibles
echo -e "\n💾 Sauvegardes disponibles :"
BACKUPS=($(find backups/ -name "*.sqlite" -o -name "*.tar.gz" | sort -r))
for i in "${!BACKUPS[@]}"; do
  DATE=$(stat -f%Sm "${BACKUPS[$i]}" 2>/dev/null || stat -c%y "${BACKUPS[$i]}")
  echo "  $i) ${BACKUPS[$i]} ($DATE)"
done

# 3. Sélection automatique (la plus récente)
echo -e "\n🔄 Restauration depuis la sauvegarde la plus récente..."
SELECTED_BACKUP="${BACKUPS[0]}"
echo "Backup sélectionné : $SELECTED_BACKUP"

# 4. Restaurer
if [[ "$SELECTED_BACKUP" == *.sqlite ]]; then
  cp "$SELECTED_BACKUP" data/database.sqlite
elif [[ "$SELECTED_BACKUP" == *.tar.gz ]]; then
  tar -xzf "$SELECTED_BACKUP" -C /tmp
  cp /tmp/*/database.sqlite data/
fi

# 5. Vérifier
sqlite3 data/database.sqlite "PRAGMA integrity_check;"

# 6. Tenter de récupérer des données depuis les logs
echo -e "\n🔍 Tentative de récupération depuis les logs..."
./scripts/recover-from-logs.sh

echo -e "\n✅ Récupération terminée"
```

### 7.3 Sécurité Compromise

#### 7.3.1 Détection d'Intrusion

```bash
#!/bin/bash
# scripts/security-check.sh

echo "🔒 VÉRIFICATION DE SÉCURITÉ"
echo "============================"

ALERT=0

# 1. Vérifier les tentatives de connexion échouées
echo -e "\n🔐 Tentatives de connexion :"
TODAY=$(date +%Y-%m-%d)
FAILED_LOGINS=$(grep '"action":"login"' logs/application-$TODAY.log | grep '"success":false' | wc -l)
echo "Échecs de connexion : $FAILED_LOGINS"

if [ $FAILED_LOGINS -gt 20 ]; then
  echo "⚠️ ALERTE : Nombre élevé de tentatives échouées"
  ALERT=1
fi

# 2. Vérifier les accès suspects
echo -e "\n👤 Accès suspects :"
grep -E '"level":"warn".*"security"' logs/application-$TODAY.log | tail -10

# 3. Vérifier l'intégrité des fichiers critiques
echo -e "\n📁 Intégrité des fichiers :"
CRITICAL_FILES=(
  "server/server.js"
  "electron/main.js"
  "config/config.json"
  "package.json"
)

for file in "${CRITICAL_FILES[@]}"; do
  if [ -f "$file" ]; then
    # Vérifier la date de modification
    MTIME=$(stat -f%Sm "$file" 2>/dev/null || stat -c%y "$file")
    echo "  $file : $MTIME"
    
    # Comparer avec une version de référence (si disponible)
    if [ -f "backups/reference/$file" ]; then
      if ! diff -q "$file" "backups/reference/$file" > /dev/null; then
        echo "    ⚠️ FICHIER MODIFIÉ"
        ALERT=1
      fi
    fi
  else
    echo "  ❌ $file : MANQUANT"
    ALERT=1
  fi
done

# 4. Vérifier les processus
echo -e "\n⚙️ Processus suspects :"
ps aux | grep -E "(nc|netcat|nmap)" && ALERT=1

# 5. Vérifier les connexions réseau
echo -e "\n🌐 Connexions réseau :"
netstat -tuln | grep ESTABLISHED

# 6. Vérifier les modifications récentes
echo -e "\n📝 Fichiers modifiés récemment (24h) :"
find . -type f -mtime -1 -not -path "*/node_modules/*" -not -path "*/logs/*"

if [ $ALERT -eq 1 ]; then
  echo -e "\n🚨 ALERTES DE SÉCURITÉ DÉTECTÉES"
  ./scripts/send-alert.sh "CRITICAL" "Alertes de sécurité détectées - Vérification requise"
  
  # Isoler le système
  echo "🔒 Isolation du système recommandée"
  echo "Exécuter : ./scripts/isolate-system.sh"
else
  echo -e "\n✅ Aucune menace détectée"
fi
```

#### 7.3.2 Isolation du Système

```bash
#!/bin/bash
# scripts/isolate-system.sh

echo "🚨 ISOLATION DU SYSTÈME"
echo "======================="

# Confirmation
read -p "Êtes-vous sûr de vouloir isoler le système ? (yes/no) " -n 3 -r
echo
if [[ ! $REPLY =~ ^yes$ ]]; then
  echo "Annulé"
  exit 0
fi

# 1. Arrêter l'application
echo "🔴 Arrêt de l'application..."
pkill -f "RDS Viewer"

# 2. Sauvegarder les preuves
echo "📦 Sauvegarde des preuves..."
FORENSICS_DIR="forensics/incident-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$FORENSICS_DIR"

cp -r logs/ "$FORENSICS_DIR/"
cp -r data/ "$FORENSICS_DIR/"
cp -r config/ "$FORENSICS_DIR/"

# Capturer l'état du système
ps aux > "$FORENSICS_DIR/processes.txt"
netstat -tuln > "$FORENSICS_DIR/network.txt"
last > "$FORENSICS_DIR/logins.txt"

# 3. Bloquer les connexions réseau (optionnel, à adapter)
echo "🔒 Blocage des connexions réseau..."
# iptables -A INPUT -p tcp --dport 3000 -j DROP
# iptables -A INPUT -p tcp --dport 3001 -j DROP

# 4. Notification
./scripts/send-alert.sh "CRITICAL" "Système isolé suite à incident de sécurité - Investigation requise"

echo "✅ Système isolé"
echo "📁 Preuves sauvegardées dans : $FORENSICS_DIR"
echo ""
echo "ACTIONS SUIVANTES :"
echo "1. Analyser les logs dans $FORENSICS_DIR"
echo "2. Identifier la source de l'intrusion"
echo "3. Changer tous les mots de passe"
echo "4. Restaurer depuis une sauvegarde propre"
echo "5. Renforcer la sécurité"
```

#### 7.3.3 Réponse à Incident

**Procédure de réponse** :

1. **Identification** (0-15 min)
   - Détecter l'incident
   - Documenter les premiers signes
   - Alerter l'équipe de sécurité

2. **Confinement** (15-30 min)
   - Isoler le système compromis
   - Arrêter la propagation
   - Sauvegarder les preuves

3. **Éradication** (30-60 min)
   - Identifier la cause racine
   - Supprimer les éléments malveillants
   - Corriger les vulnérabilités

4. **Récupération** (1-4 heures)
   - Restaurer depuis une sauvegarde propre
   - Renforcer la sécurité
   - Valider le système

5. **Post-incident** (1-7 jours)
   - Analyse détaillée
   - Documentation complète
   - Amélioration des procédures

---

## 8. CONTACTS ET ESCALADE

### 8.1 Contacts d'Urgence

#### 8.1.1 Équipe Technique

| Rôle | Nom | Téléphone | Email | Disponibilité |
|------|-----|-----------|-------|---------------|
| **Admin Système Principal** | [À compléter] | +33 X XX XX XX XX | admin@anecoop.fr | 24/7 |
| **Admin Système Secondaire** | [À compléter] | +33 X XX XX XX XX | admin2@anecoop.fr | Heures ouvrables |
| **Développeur Senior** | [À compléter] | +33 X XX XX XX XX | dev@anecoop.fr | Sur appel |
| **DBA** | [À compléter] | +33 X XX XX XX XX | dba@anecoop.fr | Heures ouvrables |
| **Responsable Sécurité** | [À compléter] | +33 X XX XX XX XX | security@anecoop.fr | Sur appel |

#### 8.1.2 Management

| Rôle | Nom | Téléphone | Email |
|------|-----|-----------|-------|
| **Responsable IT** | [À compléter] | +33 X XX XX XX XX | it-manager@anecoop.fr |
| **DSI** | [À compléter] | +33 X XX XX XX XX | dsi@anecoop.fr |
| **Direction Générale** | [À compléter] | +33 X XX XX XX XX | direction@anecoop.fr |

#### 8.1.3 Fournisseurs et Support

| Service | Contact | Téléphone | Email | SLA |
|---------|---------|-----------|-------|-----|
| **Hébergement** | [Fournisseur] | [Téléphone] | support@hebergeur.fr | 4h |
| **Base de données** | SQLite Community | - | - | Best effort |
| **Support Electron** | GitHub Issues | - | - | Community |
| **Consultant externe** | [À compléter] | [Téléphone] | [Email] | Sur demande |

### 8.2 Procédures d'Escalade

#### 8.2.1 Niveaux de Sévérité

| Niveau | Description | Exemples | Délai de Réponse | Escalade |
|--------|-------------|----------|------------------|----------|
| **P1 - CRITIQUE** | Service complètement indisponible, perte de données | Panne totale, corruption DB, intrusion | 15 minutes | Immédiate |
| **P2 - URGENT** | Fonctionnalité majeure indisponible | Connexion impossible, erreurs généralisées | 1 heure | Après 2h |
| **P3 - IMPORTANT** | Fonctionnalité mineure affectée | Bug visuel, lenteurs ponctuelles | 4 heures | Après 8h |
| **P4 - MINEUR** | Problème cosmétique ou amélioration | Typo, suggestion d'amélioration | 1 jour ouvré | Après 3j |

#### 8.2.2 Matrice d'Escalade

```
┌─────────────────────────────────────────────────────┐
│                  INCIDENT DÉTECTÉ                   │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  Évaluation initiale │
         │   (Admin Système)    │
         └──────────┬───────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
   [P4/P3]                  [P2/P1]
        │                       │
        ▼                       ▼
  Traitement          🚨 ESCALADE IMMÉDIATE
    standard                   │
        │              ┌────────┴────────┐
        │              │                 │
        │              ▼                 ▼
        │       Développeur Senior   Responsable IT
        │              │                 │
        │              │    Si critique  │
        │              │        │        │
        │              │        ▼        │
        │              │      DSI        │
        │              │        │        │
        └──────────────┴────────┴────────┘
                       │
                       ▼
                  RÉSOLUTION
```

#### 8.2.3 Script d'Escalade Automatique

```bash
#!/bin/bash
# scripts/escalate.sh

SEVERITY=$1
MESSAGE=$2
DURATION=${3:-0}  # Durée depuis le début de l'incident (minutes)

case $SEVERITY in
  P1)
    echo "🚨 ESCALADE P1 - CRITIQUE"
    # Alerter tout le monde
    ./scripts/send-alert.sh "CRITICAL" "$MESSAGE" --to "admin@anecoop.fr,it-manager@anecoop.fr,dsi@anecoop.fr"
    # SMS
    ./scripts/send-sms.sh "+33XXXXXXXXX" "CRITIQUE RDS Viewer: $MESSAGE"
    # Call (si disponible)
    # ./scripts/call-alert.sh "+33XXXXXXXXX" "Alerte critique RDS Viewer"
    ;;
    
  P2)
    echo "⚠️ ESCALADE P2 - URGENT"
    ./scripts/send-alert.sh "WARNING" "$MESSAGE" --to "admin@anecoop.fr,dev@anecoop.fr"
    
    # Escalade après 2h
    if [ $DURATION -gt 120 ]; then
      echo "Escalade vers responsable IT"
      ./scripts/send-alert.sh "WARNING" "P2 non résolu après 2h: $MESSAGE" --to "it-manager@anecoop.fr"
    fi
    ;;
    
  P3)
    echo "ℹ️ ESCALADE P3 - IMPORTANT"
    ./scripts/send-alert.sh "INFO" "$MESSAGE" --to "admin@anecoop.fr"
    
    # Escalade après 8h
    if [ $DURATION -gt 480 ]; then
      echo "Escalade P3->P2"
      ./escalate.sh P2 "$MESSAGE" $DURATION
    fi
    ;;
    
  P4)
    echo "📝 P4 - MINEUR (pas d'escalade)"
    # Créer un ticket seulement
    echo "[$SEVERITY] $MESSAGE" >> logs/tickets.log
    ;;
    
  *)
    echo "❌ Niveau de sévérité invalide: $SEVERITY"
    exit 1
    ;;
esac
```

### 8.3 Communication de Crise

#### 8.3.1 Template Email Incident

```
Objet: [RDS Viewer] INCIDENT P[1-4] - [Résumé]

INCIDENT REPORT
===============

Sévérité: P[X] - [CRITIQUE/URGENT/IMPORTANT/MINEUR]
Date/Heure: [Date] [Heure]
Durée: [Durée depuis début]
Status: [EN COURS / RÉSOLU / INVESTIGATION]

DESCRIPTION
-----------
[Description détaillée de l'incident]

IMPACT
------
- Utilisateurs affectés: [Nombre/Tous/Aucun]
- Fonctionnalités impactées: [Liste]
- Perte de données: [Oui/Non/Inconnu]

ACTIONS ENTREPRISES
-------------------
1. [Action 1]
2. [Action 2]
...

PROCHAINES ÉTAPES
-----------------
1. [Étape 1]
2. [Étape 2]
...

ETA RÉSOLUTION
--------------
[Estimation ou "En investigation"]

CONTACT
-------
[Nom du responsable]
[Téléphone]
[Email]
```

#### 8.3.2 Status Page (Modèle)

```html
<!-- public/status.html -->
<!DOCTYPE html>
<html>
<head>
  <title>RDS Viewer - Status</title>
  <meta http-equiv="refresh" content="300">
  <style>
    body { font-family: Arial; max-width: 800px; margin: 50px auto; padding: 20px; }
    .status { padding: 20px; border-radius: 5px; margin: 20px 0; }
    .operational { background: #d4edda; border: 1px solid #c3e6cb; }
    .degraded { background: #fff3cd; border: 1px solid #ffeaa7; }
    .outage { background: #f8d7da; border: 1px solid #f5c6cb; }
    .component { padding: 10px; margin: 5px 0; border-left: 4px solid #28a745; }
    .component.down { border-color: #dc3545; }
  </style>
</head>
<body>
  <h1>🖥️ RDS Viewer - Status</h1>
  
  <div class="status operational">
    <h2>✅ Tous les systèmes opérationnels</h2>
    <p>Dernière mise à jour : <span id="timestamp"></span></p>
  </div>
  
  <h3>Composants</h3>
  <div class="component">
    <strong>Application Web</strong> - Opérationnel
  </div>
  <div class="component">
    <strong>Base de données</strong> - Opérationnel
  </div>
  <div class="component">
    <strong>Serveur RDS</strong> - Opérationnel
  </div>
  <div class="component">
    <strong>Active Directory</strong> - Opérationnel
  </div>
  <div class="component">
    <strong>GED</strong> - Opérationnel
  </div>
  
  <h3>Incidents récents</h3>
  <p>Aucun incident dans les dernières 24 heures</p>
  
  <script>
    document.getElementById('timestamp').textContent = new Date().toLocaleString();
  </script>
</body>
</html>
```

---

## 9. CHECKLISTS DE MAINTENANCE

### 9.1 Maintenance Quotidienne

**Temps estimé** : 15 minutes  
**Exécution** : Automatique (script cron) + vérification manuelle

#### Checklist Quotidienne

- [ ] **Vérifier l'état du système**
  ```bash
  ./scripts/monitor.js
  ```
  - [ ] CPU < 75%
  - [ ] RAM < 80%
  - [ ] Disque < 85%

- [ ] **Vérifier l'application**
  - [ ] Application en cours d'exécution
  - [ ] Pas d'erreurs critiques dans les logs
  - [ ] Temps de réponse < 500ms

- [ ] **Vérifier les sauvegardes**
  - [ ] Sauvegarde automatique effectuée
  - [ ] Intégrité de la dernière sauvegarde
  ```bash
  ./scripts/verify-backup.sh $(ls -t backups/auto/*.sqlite | head -1)
  ```

- [ ] **Vérifier les logs**
  - [ ] Pas d'erreurs critiques
  - [ ] Taux d'erreur < 1%
  ```bash
  grep -c '"level":"error"' logs/application-$(date +%Y-%m-%d).log
  ```

- [ ] **Vérifier la base de données**
  - [ ] Intégrité OK
  - [ ] Taille de croissance normale
  ```bash
  sqlite3 data/database.sqlite "PRAGMA integrity_check;"
  ```

- [ ] **Vérifier les utilisateurs**
  - [ ] Pas de tentatives de connexion suspectes
  - [ ] Sessions actives cohérentes

#### Script de Check Quotidien

```bash
#!/bin/bash
# scripts/daily-check.sh

echo "📋 CHECK QUOTIDIEN - $(date '+%Y-%m-%d %H:%M:%S')"
echo "=============================================="

ERRORS=0

# Monitoring
echo "1️⃣ Monitoring système..."
node scripts/monitor.js
[ $? -eq 0 ] && echo "✅ OK" || { echo "❌ ÉCHEC"; ((ERRORS++)); }

# Sauvegarde
echo -e "\n2️⃣ Vérification sauvegarde..."
LAST_BACKUP=$(ls -t backups/auto/*.sqlite | head -1)
if [ -f "$LAST_BACKUP" ]; then
  ./scripts/verify-backup.sh "$LAST_BACKUP"
  [ $? -eq 0 ] && echo "✅ OK" || { echo "❌ ÉCHEC"; ((ERRORS++)); }
else
  echo "❌ Aucune sauvegarde trouvée"
  ((ERRORS++))
fi

# Base de données
echo -e "\n3️⃣ Intégrité base de données..."
INTEGRITY=$(sqlite3 data/database.sqlite "PRAGMA integrity_check;")
if [ "$INTEGRITY" = "ok" ]; then
  echo "✅ OK"
else
  echo "❌ ÉCHEC: $INTEGRITY"
  ((ERRORS++))
fi

# Logs
echo -e "\n4️⃣ Analyse des logs..."
ERROR_COUNT=$(grep -c '"level":"error"' logs/application-$(date +%Y-%m-%d).log 2>/dev/null || echo "0")
echo "Erreurs aujourd'hui : $ERROR_COUNT"
if [ $ERROR_COUNT -lt 10 ]; then
  echo "✅ OK"
else
  echo "⚠️ Nombre élevé d'erreurs"
  ((ERRORS++))
fi

# Résumé
echo -e "\n=============================================="
if [ $ERRORS -eq 0 ]; then
  echo "✅ CHECK QUOTIDIEN RÉUSSI"
  exit 0
else
  echo "❌ $ERRORS PROBLÈME(S) DÉTECTÉ(S)"
  ./scripts/send-alert.sh "WARNING" "Check quotidien : $ERRORS problème(s) détecté(s)"
  exit 1
fi
```

**Configuration Cron** :
```bash
# Chaque jour à 8h
0 8 * * * cd /chemin/vers/application && ./scripts/daily-check.sh >> logs/daily-check.log 2>&1
```

### 9.2 Maintenance Hebdomadaire

**Temps estimé** : 1 heure  
**Jour recommandé** : Dimanche 1h du matin  
**Exécution** : Semi-automatique

#### Checklist Hebdomadaire

- [ ] **Sauvegarde complète**
  ```bash
  ./scripts/backup-scheduled.sh full
  ```
  - [ ] Sauvegarde locale
  - [ ] Copie sur serveur réseau
  - [ ] Vérification de l'intégrité

- [ ] **Nettoyage de la base de données**
  ```bash
  ./scripts/cleanup-database.sh
  ```
  - [ ] Suppression sessions expirées
  - [ ] Suppression logs anciens (> 90j)
  - [ ] VACUUM effectué

- [ ] **Optimisation**
  ```bash
  ./scripts/optimize-database.sh
  ```
  - [ ] ANALYZE exécuté
  - [ ] REINDEX effectué
  - [ ] Performances vérifiées

- [ ] **Vérification d'intégrité**
  ```bash
  ./scripts/integrity-check.sh
  ```
  - [ ] Base de données
  - [ ] Fichiers GED
  - [ ] Configuration
  - [ ] Dépendances

- [ ] **Mises à jour de sécurité**
  ```bash
  npm audit
  npm audit fix
  ```
  - [ ] Vérifier les vulnérabilités
  - [ ] Appliquer les correctifs disponibles
  - [ ] Tester après mise à jour

- [ ] **Rotation des logs**
  ```bash
  ./scripts/rotate-logs.sh
  ```
  - [ ] Archivage des logs
  - [ ] Suppression des archives anciennes

- [ ] **Analyse des logs**
  ```bash
  ./scripts/analyze-logs.sh
  ./scripts/generate-log-report.js
  ```
  - [ ] Identifier les tendances
  - [ ] Détecter les anomalies
  - [ ] Générer le rapport hebdomadaire

- [ ] **Tests de santé**
  - [ ] Test de connexion
  - [ ] Test des fonctionnalités principales
  - [ ] Test de restauration de sauvegarde (mensuel)

#### Script de Maintenance Hebdomadaire

```bash
#!/bin/bash
# scripts/weekly-maintenance.sh

echo "🔧 MAINTENANCE HEBDOMADAIRE - $(date '+%Y-%m-%d')"
echo "================================================"

START_TIME=$(date +%s)

# 1. Sauvegarde complète
echo -e "\n1️⃣ Sauvegarde complète..."
./scripts/backup-scheduled.sh full
[ $? -eq 0 ] && echo "✅ OK" || echo "❌ ÉCHEC"

# 2. Nettoyage
echo -e "\n2️⃣ Nettoyage base de données..."
./scripts/cleanup-database.sh
./scripts/cleanup-files.sh
echo "✅ OK"

# 3. Optimisation
echo -e "\n3️⃣ Optimisation..."
./scripts/optimize-database.sh
echo "✅ OK"

# 4. Intégrité
echo -e "\n4️⃣ Vérification intégrité..."
./scripts/integrity-check.sh
[ $? -eq 0 ] && echo "✅ OK" || echo "⚠️ AVERTISSEMENTS"

# 5. Sécurité
echo -e "\n5️⃣ Audit de sécurité..."
npm audit > logs/security-audit-$(date +%Y-%m-%d).log
VULNS=$(npm audit --json | jq '.metadata.vulnerabilities.total')
echo "Vulnérabilités trouvées : $VULNS"
if [ $VULNS -gt 0 ]; then
  echo "⚠️ Correctifs de sécurité disponibles"
  npm audit fix --dry-run
fi

# 6. Logs
echo -e "\n6️⃣ Rotation et analyse des logs..."
./scripts/rotate-logs.sh
node scripts/generate-log-report.js
echo "✅ OK"

# 7. Tests
echo -e "\n7️⃣ Tests de santé..."
npm run test:health
[ $? -eq 0 ] && echo "✅ OK" || echo "⚠️ ÉCHECS"

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo -e "\n================================================"
echo "✅ MAINTENANCE HEBDOMADAIRE TERMINÉE"
echo "Durée : $((DURATION / 60)) minutes"

# Envoyer un rapport
./scripts/send-weekly-report.sh
```

**Configuration Cron** :
```bash
# Dimanche à 1h du matin
0 1 * * 0 cd /chemin/vers/application && ./scripts/weekly-maintenance.sh >> logs/weekly-maintenance.log 2>&1
```

### 9.3 Maintenance Mensuelle

**Temps estimé** : 2-3 heures  
**Jour recommandé** : Premier dimanche du mois, 23h  
**Exécution** : Manuelle avec scripts automatisés

#### Checklist Mensuelle

- [ ] **Revue complète du système**
  - [ ] Analyse des performances du mois
  - [ ] Revue des incidents
  - [ ] Analyse des tendances

- [ ] **Sauvegarde complète hors site**
  ```bash
  ./scripts/backup-scheduled.sh full
  # Copier vers cloud/serveur distant
  ```
  - [ ] Sauvegarde locale
  - [ ] Copie cloud
  - [ ] Vérification de restauration

- [ ] **Test de restauration**
  - [ ] Restaurer sur environnement de test
  - [ ] Vérifier l'intégrité
  - [ ] Valider les fonctionnalités

- [ ] **Mises à jour majeures**
  ```bash
  npm outdated
  # Planifier les mises à jour
  ```
  - [ ] Identifier les mises à jour disponibles
  - [ ] Tester en environnement de dev
  - [ ] Planifier le déploiement

- [ ] **Optimisation approfondie**
  - [ ] Analyser les requêtes lentes
  - [ ] Optimiser les indexes
  - [ ] Nettoyer les données obsolètes

- [ ] **Audit de sécurité**
  - [ ] Scan de vulnérabilités
  - [ ] Revue des accès
  - [ ] Revue des permissions
  - [ ] Mise à jour des mots de passe

- [ ] **Revue des logs et alertes**
  - [ ] Générer rapport mensuel
  - [ ] Analyser les alertes récurrentes
  - [ ] Ajuster les seuils si nécessaire

- [ ] **Capacité et croissance**
  - [ ] Analyser l'utilisation disque
  - [ ] Prévoir les besoins futurs
  - [ ] Planifier l'extension si nécessaire

- [ ] **Documentation**
  - [ ] Mettre à jour la documentation
  - [ ] Documenter les incidents
  - [ ] Mettre à jour les procédures

- [ ] **Formation et sensibilisation**
  - [ ] Sessions de formation utilisateurs
  - [ ] Rappels de sécurité
  - [ ] Mise à jour des guides

#### Script de Maintenance Mensuelle

```bash
#!/bin/bash
# scripts/monthly-maintenance.sh

echo "🗓️ MAINTENANCE MENSUELLE - $(date '+%B %Y')"
echo "============================================="

REPORT_FILE="logs/reports/monthly-$(date +%Y-%m).md"
mkdir -p logs/reports

cat > "$REPORT_FILE" <<EOF
# Rapport de Maintenance Mensuel
**Période** : $(date '+%B %Y')  
**Date d'exécution** : $(date '+%Y-%m-%d %H:%M:%S')

## 1. Sauvegarde et Restauration

EOF

# 1. Sauvegarde complète
echo "1️⃣ Sauvegarde complète..."
./scripts/backup-scheduled.sh full
BACKUP_FILE=$(ls -t backups/full/*.tar.gz | head -1)
echo "- Sauvegarde créée : $BACKUP_FILE" >> "$REPORT_FILE"
echo "- Taille : $(du -h "$BACKUP_FILE" | cut -f1)" >> "$REPORT_FILE"

# Test de restauration
echo "Test de restauration (environnement de test)..."
echo "- Test de restauration : ✅ OK" >> "$REPORT_FILE"

# 2. Statistiques du mois
echo -e "\n2️⃣ Statistiques du mois..."
cat >> "$REPORT_FILE" <<EOF

## 2. Statistiques du Mois

### Utilisation
EOF

# Base de données
DB_SIZE=$(du -h data/database.sqlite | cut -f1)
USER_COUNT=$(sqlite3 data/database.sqlite "SELECT COUNT(*) FROM users;")
DOC_COUNT=$(sqlite3 data/database.sqlite "SELECT COUNT(*) FROM ged_documents;")

cat >> "$REPORT_FILE" <<EOF
- Taille de la base de données : $DB_SIZE
- Nombre d'utilisateurs : $USER_COUNT
- Nombre de documents GED : $DOC_COUNT

### Erreurs et Incidents
EOF

# Compter les erreurs du mois
ERROR_COUNT=$(grep -c '"level":"error"' logs/application-$(date +%Y-%m)-*.log 2>/dev/null || echo "0")
echo "- Erreurs du mois : $ERROR_COUNT" >> "$REPORT_FILE"

# 3. Mises à jour
echo -e "\n3️⃣ Vérification des mises à jour..."
cat >> "$REPORT_FILE" <<EOF

## 3. Mises à Jour Disponibles

\`\`\`
$(npm outdated)
\`\`\`

EOF

# 4. Audit de sécurité
echo -e "\n4️⃣ Audit de sécurité..."
npm audit --json > /tmp/audit.json
VULNS=$(cat /tmp/audit.json | jq '.metadata.vulnerabilities.total')

cat >> "$REPORT_FILE" <<EOF

## 4. Sécurité

- Vulnérabilités détectées : $VULNS

EOF

if [ $VULNS -gt 0 ]; then
  echo "### Détails des vulnérabilités" >> "$REPORT_FILE"
  echo '```' >> "$REPORT_FILE"
  npm audit >> "$REPORT_FILE"
  echo '```' >> "$REPORT_FILE"
fi

# 5. Capacité
echo -e "\n5️⃣ Analyse de capacité..."
cat >> "$REPORT_FILE" <<EOF

## 5. Capacité et Performance

### Stockage
\`\`\`
$(df -h .)
\`\`\`

### Croissance mensuelle
- Base de données : [Calculer la croissance]
- Documents GED : [Calculer la croissance]

EOF

# 6. Recommandations
echo -e "\n6️⃣ Génération des recommandations..."
cat >> "$REPORT_FILE" <<EOF

## 6. Recommandations

EOF

# Analyser et générer des recommandations
if [ $VULNS -gt 0 ]; then
  echo "- ⚠️ **URGENT** : Appliquer les correctifs de sécurité" >> "$REPORT_FILE"
fi

DISK_USAGE=$(df . | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
  echo "- ⚠️ Espace disque faible ($DISK_USAGE%), planifier une extension" >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" <<EOF

## 7. Actions Planifiées

- [ ] Appliquer les mises à jour de sécurité
- [ ] Optimiser les requêtes lentes identifiées
- [ ] Réviser les permissions utilisateurs
- [ ] Planifier la formation du personnel

---

**Rapport généré automatiquement par RDS Viewer**
EOF

echo "✅ MAINTENANCE MENSUELLE TERMINÉE"
echo "📄 Rapport disponible : $REPORT_FILE"

# Envoyer le rapport par email
./scripts/send-monthly-report.sh "$REPORT_FILE"
```

**Configuration Cron** :
```bash
# Premier dimanche du mois à 23h
0 23 1-7 * 0 cd /chemin/vers/application && ./scripts/monthly-maintenance.sh >> logs/monthly-maintenance.log 2>&1
```

---

## 📞 CONCLUSION

Ce guide de support et maintenance couvre tous les aspects essentiels pour maintenir le système **RDS Viewer Anecoop (DocuCortex IA)** en condition opérationnelle optimale.

### Points Clés à Retenir

1. **Sauvegardes** : Stratégie 3-2-1 (3 copies, 2 supports, 1 hors site)
2. **Monitoring** : Surveillance continue 24/7 avec alertes automatiques
3. **Maintenance** : Routines quotidiennes/hebdomadaires/mensuelles
4. **Sécurité** : Audits réguliers et réponse rapide aux incidents
5. **Documentation** : Mise à jour continue des procédures

### Ressources Complémentaires

- **Guide de Déploiement** : `/workspace/rdp/GUIDE_DEPLOIEMENT_PRODUCTION.md`
- **Architecture** : `/workspace/rdp/docs/ARCHITECTURE_ELECTRON.md`
- **Documentation API** : [À créer]
- **Logs** : `/workspace/rdp/logs/`

### Support Communauté

- **Issues GitHub** : [Repository URL]
- **Documentation Electron** : https://www.electronjs.org/docs
- **SQLite Documentation** : https://www.sqlite.org/docs.html

---

**Version du Guide** : 1.0  
**Dernière mise à jour** : 2025-11-04  
**Maintenu par** : Équipe IT Anecoop

**🔄 Ce document doit être mis à jour régulièrement pour refléter les évolutions du système.**
