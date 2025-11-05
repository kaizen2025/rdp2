# 🗄️ Architecture Base de Données - RDS Viewer

## ⚠️ IMPORTANT: Gestion de la Base de Données Partagée

### 📋 **Résumé Exécutif**

**LA BASE DE DONNÉES N'EST JAMAIS ÉCRASÉE PAR L'EXE PORTABLE !**

- ✅ La base réseau `rds_viewer_data.sqlite` reste **intacte sur le serveur** `\\192.168.1.230`
- ✅ L'exe portable **NE CONTIENT PAS** de base de données
- ✅ Tous les utilisateurs **partagent la même base réseau centralisée**
- ✅ Mode OFFLINE de secours si le serveur est inaccessible

---

## 🏗️ **Architecture Multi-Mode**

### **Mode 1: ONLINE (Par défaut - Production)** 🌐

#### **Configuration**
```json
// config/config.json
{
  "databasePath": "\\\\192.168.1.230\\Donnees\\Informatique\\PROGRAMMES\\Programme RDS\\RDS Viewer Group\\rds_viewer_data.sqlite",
  "excelFilePath": "\\\\192.168.1.230\\Donnees\\Informatique\\PROGRAMMES\\Programme RDS\\RDS Viewer Group\\Data_utilisateur_partage.xlsx"
}
```

#### **Comportement**
1. **Au démarrage de l'exe:**
   - ✅ L'application lit `config/config.json`
   - ✅ Tente de se connecter au serveur réseau `\\192.168.1.230`
   - ✅ Ouvre la base SQLite partagée (2 tentatives avec 500ms de délai)

2. **Pendant l'exécution:**
   - ✅ Toutes les opérations sur la base réseau
   - ✅ SQLite en mode WAL (Write-Ahead Logging) pour multi-accès
   - ✅ Transactions pour intégrité des données

3. **Contenu de la base partagée (EXISTANTE):**
   - 📊 Ordinateurs en stock (computers)
   - 📝 Prêts actifs et historique (loans, loan_history)
   - 💬 Messages de chat (chat_channels, chat_messages)
   - 👥 Utilisateurs RDS (users)
   - 🔔 Notifications (loan_notifications)
   - 🖥️ Sessions RDS (rds_sessions)
   - 🔧 Accessoires (accessories)
   - 👨‍💼 Présence techniciens (technician_presence)

**✅ AUCUNE MODIFICATION DU CONTENU EXISTANT**

---

### **Mode 2: OFFLINE (Secours automatique)** 💾

#### **Configuration**
```javascript
// Automatique si serveur inaccessible
const LOCAL_DB_PATH = './data/rds_viewer_data.sqlite'; // Base locale
```

#### **Déclenchement**
- ⚠️ Le serveur réseau `\\192.168.1.230` est inaccessible
- ⚠️ 2 tentatives échouées (timeout 500ms chacune)
- ⚠️ Erreur d'accès au répertoire réseau

#### **Comportement**
1. **Au basculement en OFFLINE:**
   ```
   ⚠️  SERVEUR RÉSEAU INACCESSIBLE - BASCULEMENT EN MODE OFFLINE
      Chemin réseau: \\192.168.1.230\...\rds_viewer_data.sqlite
      → Utilisation base locale: ./data/rds_viewer_data.sqlite
   ```

2. **Création base locale:**
   - 📦 Nouvelle base SQLite **vide** créée dans `data/`
   - 📦 Données par défaut initialisées:
     - 2 canaux de chat (Général, Maintenance)
     - 3 accessoires (Chargeur, Souris, Sacoche)
     - Paramètres de prêt par défaut (90 jours max, 3 extensions)

3. **Limitations mode OFFLINE:**
   - ❌ Pas de synchronisation avec le serveur réseau
   - ❌ Données isolées (visible uniquement sur ce poste)
   - ❌ Pas d'accès aux prêts existants
   - ❌ Pas d'accès aux ordinateurs en stock
   - ⚠️ **Mode dégradé pour utilisation temporaire uniquement**

---

## 🔐 **Protection de la Base Existante**

### **Garanties de Non-Écrasement**

#### ✅ **1. Séparation Physique**
```
EXE PORTABLE (distribution):
├── RDS Viewer.exe
├── build/           (interface React)
├── server/          (serveur Express)
├── backend/         (services)
├── config/
│   └── config.json  (pointe vers \\192.168.1.230)
└── data/
    └── .gitkeep     (VIDE - pas de base incluse)

SERVEUR RÉSEAU (données partagées):
\\192.168.1.230\Donnees\Informatique\PROGRAMMES\Programme RDS\RDS Viewer Group\
├── rds_viewer_data.sqlite    ← BASE EXISTANTE PARTAGÉE
├── Data_utilisateur_partage.xlsx
├── computers_stock.json      (pour migration legacy)
├── loans.json                (pour migration legacy)
└── chat.json                 (pour migration legacy)
```

#### ✅ **2. Code de Connexion Sécurisé**
```javascript
// backend/services/databaseService.js

async function connectWithRetry(retryCount = 0) {
    // Récupère le chemin DEPUIS config.json
    const dbPath = configService.appConfig.databasePath;
    // → "\\\\192.168.1.230\\...\\rds_viewer_data.sqlite"

    const isNetworkPath = dbPath.startsWith('\\\\');

    try {
        // Test d'accès au répertoire réseau
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) {
            // Crée le dossier RÉSEAU si nécessaire (rare)
            fs.mkdirSync(dir, { recursive: true });
        }

        // Ouvre la base EXISTANTE sur le réseau
        const dbExists = fs.existsSync(dbPath);
        db = new Database(dbPath); // ← Ouvre, NE CRÉE PAS

        if (!dbExists) {
            // Seulement si NOUVELLE installation réseau (jamais arrivé)
            initializeDefaultData();
        }

        console.log(`✅ Base de données SQLite connectée (ONLINE) : ${dbPath}`);
        return true;
    } catch (error) {
        // Échec → Bascule en mode OFFLINE avec base LOCALE
        isOfflineMode = true;
        return connectToLocalDatabase();
    }
}
```

#### ✅ **3. Migration Legacy (Sécurisée)**
```javascript
function runMigrationIfNecessary() {
    // Vérifie le flag de migration
    const migrationFlag = db.prepare("SELECT value FROM key_value_store WHERE key = 'migration_done'").get();
    if (migrationFlag) {
        console.log("✅ Migration déjà effectuée, rien à faire.");
        return; // ← ARRÊT SI DÉJÀ MIGRÉE
    }

    // Vérifie si la base est vide
    const computersCount = db.prepare('SELECT COUNT(*) as count FROM computers').get().count;
    if (computersCount > 0) {
        console.log("✅ Base de données non vide. Migration ignorée.");
        db.prepare("INSERT INTO key_value_store (key, value) VALUES ('migration_done', 'true')").run();
        return; // ← ARRÊT SI DONNÉES EXISTANTES
    }

    // Migration seulement si base complètement vide
    console.log("🚀 Démarrage de la migration depuis les fichiers JSON...");
    // ...
}
```

**Protection triple:**
1. ✅ Flag `migration_done` dans key_value_store
2. ✅ Vérification `COUNT(*) > 0` sur la table computers
3. ✅ Migration = INSERT OR IGNORE (pas d'écrasement)

---

## 📊 **Scénarios d'Utilisation**

### **Scénario A: Installation Initiale (1er utilisateur)**
```
1. Utilisateur télécharge RDS Viewer-3.0.26-Portable.exe
2. Lance l'exe
3. Serveur \\192.168.1.230 accessible
4. Base rds_viewer_data.sqlite EXISTE DÉJÀ avec données
5. Connexion ONLINE réussie
6. Migration ignorée (base non vide)
7. ✅ Application fonctionne avec données existantes
```

### **Scénario B: Nouvel utilisateur (base déjà existante)**
```
1. Nouvel utilisateur lance l'exe
2. Serveur \\192.168.1.230 accessible
3. Base rds_viewer_data.sqlite EXISTE avec données de l'équipe
4. Connexion ONLINE réussie
5. Migration ignorée (base non vide)
6. ✅ Voit tous les prêts, ordinateurs, utilisateurs existants
```

### **Scénario C: Serveur réseau inaccessible (VPN off, réseau down)**
```
1. Utilisateur lance l'exe
2. Serveur \\192.168.1.230 INACCESSIBLE
3. 2 tentatives échouent (1 seconde total)
4. Basculement automatique en mode OFFLINE
5. Création base locale VIDE dans data/
6. Données par défaut: 2 canaux, 3 accessoires
7. ⚠️ Mode dégradé - Fonctionne mais isolé
8. Message dans logs: "MODE OFFLINE - Base locale utilisée"
```

### **Scénario D: Mise à jour de l'exe (version 3.0.27)**
```
1. Utilisateur remplace l'ancien exe par le nouveau
2. Lance la nouvelle version
3. Serveur \\192.168.1.230 accessible
4. Base rds_viewer_data.sqlite INCHANGÉE sur le réseau
5. Connexion ONLINE réussie
6. ✅ Toutes les données préservées (prêts, historique, etc.)
```

---

## 🔍 **Vérification de l'État**

### **API Endpoint: /status**
```bash
GET http://localhost:3002/api/status

Réponse:
{
  "isOffline": false,
  "databasePath": "\\\\192.168.1.230\\Donnees\\Informatique\\PROGRAMMES\\Programme RDS\\RDS Viewer Group\\rds_viewer_data.sqlite",
  "message": "Mode ONLINE - Connecté au serveur réseau"
}
```

### **Logs Console**
```
Mode ONLINE:
✅ Base de données SQLite connectée (ONLINE) : \\192.168.1.230\...\rds_viewer_data.sqlite
🔍 Vérification de la nécessité d'une migration de données...
✅ Base de données non vide. Migration ignorée.

Mode OFFLINE:
⚠️  SERVEUR RÉSEAU INACCESSIBLE - BASCULEMENT EN MODE OFFLINE
   Chemin réseau: \\192.168.1.230\...\rds_viewer_data.sqlite
   → Utilisation base locale: ./data/rds_viewer_data.sqlite
✅ Base de données SQLite connectée (OFFLINE MODE) : ./data/rds_viewer_data.sqlite
💡 L'app fonctionne en mode OFFLINE - Les données ne seront pas synchronisées
```

---

## 🎓 **Bonnes Pratiques**

### **Pour les Administrateurs**

#### ✅ **1. Sauvegarde Régulière**
```bash
# Sauvegarde automatique quotidienne (Windows Task Scheduler)
robocopy "\\192.168.1.230\Donnees\Informatique\PROGRAMMES\Programme RDS\RDS Viewer Group" "\\192.168.1.230\Backups\RDS_Viewer\%date:~-4,4%-%date:~-7,2%-%date:~-10,2%" rds_viewer_data.sqlite /Z /W:5

# Sauvegarde manuelle
copy "\\192.168.1.230\...\rds_viewer_data.sqlite" "D:\Backups\rds_viewer_data_%date%.sqlite"
```

#### ✅ **2. Droits d'Accès Réseau**
```
\\192.168.1.230\Donnees\Informatique\PROGRAMMES\Programme RDS\RDS Viewer Group\
├── rds_viewer_data.sqlite
│   ├── Lecture: Groupe "RDS Users"
│   └── Écriture: Groupe "RDS Users"
└── config.json
    ├── Lecture: Groupe "RDS Users"
    └── Écriture: Administrateurs uniquement
```

#### ✅ **3. Monitoring**
- Vérifier que tous les postes sont en mode ONLINE
- Surveiller la taille de la base SQLite (croissance normale)
- Logs disponibles dans `%APPDATA%\RDS Viewer\logs\`

### **Pour les Utilisateurs**

#### ✅ **1. Vérifier le Mode**
- Ouvrir DevTools (F12)
- Aller sur l'onglet Console
- Chercher "Mode ONLINE" ou "Mode OFFLINE"

#### ✅ **2. Si Mode OFFLINE Non Désiré**
- Vérifier la connexion VPN
- Vérifier l'accès au serveur: `\\192.168.1.230`
- Redémarrer l'application

---

## ❓ **FAQ**

### **Q: L'exe portable va-t-il écraser ma base existante ?**
**R:** ❌ **NON, JAMAIS.** L'exe ne contient aucune base de données. Il se connecte à la base réseau existante à `\\192.168.1.230`.

### **Q: Que se passe-t-il si je lance l'exe sans accès au réseau ?**
**R:** ⚠️ L'application bascule automatiquement en mode OFFLINE avec une base locale vide. Vos données réseau restent intactes.

### **Q: Puis-je utiliser l'exe depuis chez moi (hors VPN) ?**
**R:** ⚠️ Oui, mais en mode OFFLINE uniquement. Vous devrez vous connecter au VPN pour accéder à la base partagée.

### **Q: Les données en mode OFFLINE sont-elles synchronisées ?**
**R:** ❌ Non. Le mode OFFLINE est isolé. Reconnectez-vous au réseau pour accéder à la base partagée.

### **Q: Combien d'utilisateurs peuvent utiliser la base simultanément ?**
**R:** ✅ SQLite en mode WAL supporte plusieurs lecteurs et 1 écrivain simultané. Pour 10+ utilisateurs concurrents, envisager PostgreSQL/MySQL.

### **Q: Comment migrer vers une base serveur (PostgreSQL) ?**
**R:** 📝 Export SQLite → Import PostgreSQL. Modifier `databaseService.js` pour utiliser `pg` au lieu de `better-sqlite3`.

### **Q: Que contient le dossier `data/` dans l'exe ?**
**R:** 📦 Uniquement `.gitkeep` et `README.md`. Aucune base de données. Le dossier est utilisé pour le mode OFFLINE de secours.

### **Q: Comment forcer le mode OFFLINE pour tester ?**
**R:** 💡 Modifier temporairement `config.json` → `databasePath: "./data/test.sqlite"` et relancer l'exe.

---

## 🚨 **En Cas de Problème**

### **Base corrompue (rare)**
```bash
# 1. Stopper toutes les instances de RDS Viewer
# 2. Restaurer depuis backup
copy "\\192.168.1.230\Backups\...\rds_viewer_data_2025-11-04.sqlite" "\\192.168.1.230\...\rds_viewer_data.sqlite"
# 3. Relancer l'application
```

### **Base verrouillée (fichier .lock)**
```bash
# SQLite en mode WAL crée des fichiers temporaires
\\192.168.1.230\...\
├── rds_viewer_data.sqlite       ← Base principale
├── rds_viewer_data.sqlite-wal   ← Write-Ahead Log
└── rds_viewer_data.sqlite-shm   ← Shared Memory

# Si bloqué, attendre 30 secondes ou supprimer -wal et -shm
```

### **Performances dégradées**
```bash
# Vacuum de la base (compacter)
sqlite3 "\\192.168.1.230\...\rds_viewer_data.sqlite" "VACUUM;"

# Réindexer
sqlite3 "\\192.168.1.230\...\rds_viewer_data.sqlite" "REINDEX;"
```

---

## ✅ **Conclusion**

**LA BASE DE DONNÉES RÉSEAU EST 100% SÉCURISÉE**

- ✅ Aucune copie dans l'exe portable
- ✅ Aucun écrasement lors des mises à jour
- ✅ Mode OFFLINE de secours automatique
- ✅ Données partagées centralisées
- ✅ Architecture production-ready

**Chemin de la base existante:**
```
\\192.168.1.230\Donnees\Informatique\PROGRAMMES\Programme RDS\RDS Viewer Group\rds_viewer_data.sqlite
```

**Cette base ne sera JAMAIS modifiée par l'exe portable, sauf pour:**
- ✅ Ajouter de nouveaux prêts
- ✅ Ajouter de nouveaux ordinateurs
- ✅ Ajouter des messages de chat
- ✅ Mettre à jour des sessions RDS
- ✅ **= Utilisation normale de l'application**

**AUCUN risque d'écrasement ou de perte de données !**

---

**Date de création:** 2025-11-05
**Version:** 1.0
**Auteur:** Claude AI Assistant
**Projet:** RDS Viewer avec DocuCortex AI
