// backend/services/databaseService.js - VERSION SIMPLIFIEE ET ROBUSTE

const path = require('path');
const os = require('os');
const Database = require('better-sqlite3');
const fs = require('fs');

// Import configService de manière différée pour éviter les dépendances circulaires
let configService = null;
function getConfigService() {
    if (!configService) {
        configService = require('./configService');
    }
    return configService;
}

let db = null;
let isOfflineMode = false;

// Déterminer le chemin userData de manière robuste
function getUserDataPath() {
    const envUserData = process.env.RDS_VIEWER_USER_DATA || process.env.APP_USER_DATA_DIR;
    if (envUserData) {
        return envUserData;
    }
    // Essayer d'utiliser electron si disponible
    if (typeof process.versions.electron !== 'undefined') {
        try {
            const electronApp = require('electron').app;
            if (electronApp) {
                return electronApp.getPath('userData');
            }
        } catch (e) { }
    }
    // Fallback: AppData/Roaming
    return path.join(os.homedir(), 'AppData', 'Roaming', 'RDS Viewer');
}

const userDataPath = getUserDataPath();
const dataDir = path.join(userDataPath, 'data');

// Créer le dossier data s'il n'existe pas
if (!fs.existsSync(dataDir)) {
    try { fs.mkdirSync(dataDir, { recursive: true }); } catch (e) { }
}

const LOCAL_DB_PATH = path.join(dataDir, 'rds_viewer_data.sqlite');

const schema = `
    PRAGMA foreign_keys = ON;
    PRAGMA synchronous = NORMAL;

    CREATE TABLE IF NOT EXISTS computers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        brand TEXT,
        model TEXT,
        serialNumber TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'available',
        notes TEXT,
        specifications TEXT,
        warranty TEXT,
        location TEXT,
        condition TEXT,
        assetTag TEXT,
        maintenanceHistory TEXT,
        createdAt TEXT,
        createdBy TEXT,
        lastModified TEXT,
        modifiedBy TEXT,
        photo BLOB
    );

    CREATE TABLE IF NOT EXISTS loans (
        id TEXT PRIMARY KEY,
        computerId TEXT NOT NULL REFERENCES computers(id) ON DELETE CASCADE,
        computerName TEXT,
        userName TEXT NOT NULL,
        userDisplayName TEXT,
        itStaff TEXT,
        loanDate TEXT NOT NULL,
        expectedReturnDate TEXT NOT NULL,
        actualReturnDate TEXT,
        status TEXT NOT NULL,
        notes TEXT,
        accessories TEXT,
        history TEXT,
        extensionCount INTEGER DEFAULT 0,
        createdBy TEXT,
        createdAt TEXT,
        returnedBy TEXT,
        returnData TEXT
    );

    CREATE TABLE IF NOT EXISTS loan_history (
        id TEXT PRIMARY KEY,
        loanId TEXT,
        eventType TEXT,
        date TEXT,
        by TEXT,
        byId TEXT,
        computerId TEXT,
        computerName TEXT,
        userName TEXT,
        userDisplayName TEXT,
        details TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_history_computer ON loan_history(computerId);
    CREATE INDEX IF NOT EXISTS idx_history_user ON loan_history(userName);

    CREATE TABLE IF NOT EXISTS accessories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        icon TEXT,
        active INTEGER DEFAULT 1,
        createdAt TEXT,
        createdBy TEXT,
        modifiedAt TEXT,
        modifiedBy TEXT
    );

    CREATE TABLE IF NOT EXISTS loan_notifications (
        id TEXT PRIMARY KEY,
        loanId TEXT,
        computerName TEXT,
        userName TEXT,
        userDisplayName TEXT,
        type TEXT,
        date TEXT,
        read_status INTEGER DEFAULT 0,
        details TEXT
    );

    CREATE TABLE IF NOT EXISTS chat_channels (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        createdAt TEXT,
        createdBy TEXT,
        is_private INTEGER DEFAULT 0,
        participants TEXT
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        channelId TEXT NOT NULL,
        authorId TEXT NOT NULL,
        authorName TEXT,
        authorAvatar TEXT,
        text TEXT,
        timestamp TEXT NOT NULL,
        reactions TEXT,
        file_info TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_chat_channel_ts ON chat_messages(channelId, timestamp);

    CREATE TABLE IF NOT EXISTS technician_presence (
        id TEXT PRIMARY KEY,
        name TEXT,
        avatar TEXT,
        position TEXT,
        status TEXT,
        hostname TEXT,
        loginTime TEXT,
        lastActivity TEXT,
        photo BLOB
    );

    CREATE TABLE IF NOT EXISTS rds_sessions (
        id TEXT PRIMARY KEY,
        server TEXT NOT NULL,
        sessionId TEXT NOT NULL,
        username TEXT,
        sessionName TEXT,
        state TEXT,
        idleTime TEXT,
        logonTime TEXT,
        isActive INTEGER,
        lastUpdate TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        displayName TEXT NOT NULL,
        email TEXT,
        department TEXT,
        server TEXT,
        password TEXT,
        officePassword TEXT,
        adEnabled INTEGER DEFAULT 1,
        notes TEXT,
        createdAt TEXT,
        createdBy TEXT,
        lastModified TEXT,
        modifiedBy TEXT,
        lastSyncFromExcel TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_server ON users(server);

    CREATE TABLE IF NOT EXISTS key_value_store (
        key TEXT PRIMARY KEY,
        value TEXT
    );

    CREATE TABLE IF NOT EXISTS app_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        display_name TEXT NOT NULL,
        email TEXT,
        position TEXT,
        role TEXT DEFAULT 'viewer',
        permissions TEXT,
        is_admin INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        must_change_password INTEGER DEFAULT 1,
        profile_picture_url TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ai_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        file_type TEXT,
        file_size INTEGER,
        content TEXT,
        metadata TEXT,
        language TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        embedding TEXT
    );

    CREATE TABLE IF NOT EXISTS ai_document_chunks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_id INTEGER,
        chunk_index INTEGER,
        content TEXT,
        embedding TEXT,
        metadata TEXT,
        FOREIGN KEY(document_id) REFERENCES ai_documents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ai_document_manifest (
        filePath TEXT PRIMARY KEY,
        hash TEXT NOT NULL,
        lastModified TEXT NOT NULL
    );
`;

function initializeDefaultData() {
    const now = new Date().toISOString();
    const bcrypt = require('bcryptjs');

    const transaction = db.transaction(() => {
        // Canaux de chat par défaut
        const channels = [
            { id: 'general', name: 'Général', description: 'Canal principal.' },
            { id: 'maintenance', name: 'Annonces Maintenance', description: 'Annonces importantes.' }
        ];
        const insertChannel = db.prepare('INSERT OR IGNORE INTO chat_channels (id, name, description, createdAt, createdBy) VALUES (?, ?, ?, ?, ?)');
        channels.forEach(c => insertChannel.run(c.id, c.name, c.description, now, 'system'));

        // Accessoires par défaut
        const accessories = [
            { id: 'charger', name: 'Chargeur', icon: 'power' },
            { id: 'mouse', name: 'Souris', icon: 'mouse' },
            { id: 'bag', name: 'Sacoche', icon: 'work' }
        ];
        const insertAccessory = db.prepare('INSERT OR IGNORE INTO accessories (id, name, icon, active, createdAt, createdBy) VALUES (?, ?, ?, 1, ?, ?)');
        accessories.forEach(a => insertAccessory.run(a.id, a.name, a.icon, now, 'system'));

        // Paramètres par défaut
        const defaultSettings = { maxLoanDays: 90, maxExtensions: 3, autoNotifications: true };
        db.prepare('INSERT OR IGNORE INTO key_value_store (key, value) VALUES (?, ?)').run('loan_settings', JSON.stringify(defaultSettings));

        // ✅ CRITIQUE: Créer un utilisateur admin par défaut pour la connexion
        const existingAdmin = db.prepare('SELECT id FROM app_users WHERE username = ?').get('admin');
        if (!existingAdmin) {
            console.log('[DatabaseService] 👤 Création utilisateur admin par défaut...');
            const defaultPasswordHash = bcrypt.hashSync('123456', 10);
            const adminPermissions = JSON.stringify([
                'dashboard:view', 'dashboard:edit',
                'sessions:view', 'sessions:manage',
                'users:view', 'users:edit', 'users:create', 'users:delete',
                'servers:view', 'servers:manage',
                'ad_groups:view', 'ad_groups:manage',
                'loans:view', 'loans:manage',
                'ai_assistant:view', 'ai_assistant:manage',
                'chat_ged:view', 'chat_ged:manage',
                'can_manage_users'
            ]);

            db.prepare(`
                INSERT INTO app_users (username, password_hash, display_name, email, position, role, permissions, is_admin, is_active, must_change_password, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run('admin', defaultPasswordHash, 'Administrateur', 'admin@anecoop.fr', 'Administrateur IT', 'admin', adminPermissions, 1, 1, 0, now);

            console.log('[DatabaseService] ✅ Utilisateur admin créé (login: admin, mot de passe: 123456)');
        }
    });
    transaction();
    console.log('[DatabaseService] ✅ Données par défaut insérées.');
}

function runMigrationIfNecessary() {
    console.log("🔍 Vérification de la nécessité d'une migration de données...");

    try {
        const migrationFlag = db.prepare("SELECT value FROM key_value_store WHERE key = 'migration_done'").get();
        if (migrationFlag) {
            console.log("✅ Migration déjà effectuée, rien à faire.");
            return;
        }
    } catch (e) {
        // Table n'existe peut-être pas encore
    }

    try {
        const computersCount = db.prepare('SELECT COUNT(*) as count FROM computers').get().count;
        if (computersCount > 0) {
            console.log("✅ Base de données non vide. Migration ignorée.");
            db.prepare("INSERT OR REPLACE INTO key_value_store (key, value) VALUES ('migration_done', 'true')").run();
            return;
        }
    } catch (e) {
        // Continuer si erreur
    }

    console.log("🚀 Démarrage de la migration depuis les fichiers JSON...");

    const config = getConfigService();
    const dbPath = config.appConfig?.databasePath || LOCAL_DB_PATH;
    const SHARED_DATA_PATH = path.dirname(dbPath);

    const PATHS = {
        computers: path.join(SHARED_DATA_PATH, 'computers_stock.json'),
        loans: path.join(SHARED_DATA_PATH, 'loans.json'),
        chat: path.join(SHARED_DATA_PATH, 'chat.json'),
    };

    const readJson = (filePath) => {
        try {
            if (fs.existsSync(filePath)) {
                return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            }
            console.warn(`- Fichier de migration non trouvé: ${path.basename(filePath)}`);
            return null;
        } catch (error) {
            console.error(`! Erreur lecture ${path.basename(filePath)}:`, error.message);
            return null;
        }
    };

    const stringify = (data) => data ? JSON.stringify(data) : null;

    const transaction = db.transaction(() => {
        const computersData = readJson(PATHS.computers);
        if (computersData?.computers) {
            const insert = db.prepare(`INSERT OR IGNORE INTO computers (id, name, brand, model, serialNumber, status, notes, specifications, warranty, location, condition, assetTag, maintenanceHistory, createdAt, createdBy, lastModified, modifiedBy) VALUES (@id, @name, @brand, @model, @serialNumber, @status, @notes, @specifications, @warranty, @location, @condition, @assetTag, @maintenanceHistory, @createdAt, @createdBy, @updatedAt, @updatedBy)`);
            computersData.computers.forEach(c => insert.run({
                ...c,
                specifications: stringify(c.specifications),
                warranty: stringify(c.warranty),
                maintenanceHistory: stringify(c.maintenanceHistory)
            }));
            console.log(`  -> ${computersData.computers.length} ordinateurs migrés.`);
        }

        const loansData = readJson(PATHS.loans);
        if (loansData?.loans) {
            const insertLoan = db.prepare(`INSERT OR IGNORE INTO loans (id, computerId, computerName, userName, userDisplayName, itStaff, loanDate, expectedReturnDate, actualReturnDate, status, notes, accessories, history, extensionCount, createdBy, createdAt, returnedBy, returnData) VALUES (@id, @computerId, @computerName, @userName, @userDisplayName, @itStaff, @loanDate, @expectedReturnDate, @actualReturnDate, @status, @notes, @accessories, @history, @extensionCount, @createdBy, @createdAt, @returnedBy, @returnData)`);
            loansData.loans.forEach(l => {
                const loanWithDefaults = {
                    actualReturnDate: null, notes: '', accessories: null, history: null, extensionCount: 0,
                    createdBy: '', createdAt: '', returnedBy: null, returnData: null, ...l
                };
                insertLoan.run({
                    ...loanWithDefaults,
                    accessories: stringify(loanWithDefaults.accessories),
                    history: stringify(loanWithDefaults.history),
                    returnData: stringify(loanWithDefaults.returnData)
                });
            });
            console.log(`  -> ${loansData.loans.length} prêts migrés.`);
        }

        const chatData = readJson(PATHS.chat);
        if (chatData?.channels) {
            const insert = db.prepare('INSERT OR IGNORE INTO chat_channels (id, name, description) VALUES (@id, @name, @description)');
            chatData.channels.forEach(c => insert.run(c));
            console.log(`  -> ${chatData.channels.length} canaux de chat migrés.`);
        }

        db.prepare("INSERT OR REPLACE INTO key_value_store (key, value) VALUES ('migration_done', 'true')").run();
        console.log("🎉 Migration terminée avec succès !");
    });

    try {
        transaction();
    } catch (error) {
        console.error("❌ ERREUR PENDANT LA MIGRATION:", error.message);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ✅ Test rapide d'accès réseau avec timeout (évite blocage Windows)
function testNetworkAccessWithTimeout(networkPath, timeoutMs = 3000) {
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            console.log(`[DatabaseService] ⏱️ Timeout ${timeoutMs}ms - réseau non accessible`);
            resolve(false);
        }, timeoutMs);

        // Utiliser un worker thread ou spawn pour éviter blocage
        const { exec } = require('child_process');
        // Test rapide avec dir (plus rapide que fs.existsSync sur réseau)
        exec(`dir "${path.dirname(networkPath)}" /b`, { timeout: timeoutMs }, (error) => {
            clearTimeout(timeout);
            if (error) {
                console.log(`[DatabaseService] ⚠️ Réseau inaccessible: ${error.message}`);
                resolve(false);
            } else {
                console.log(`[DatabaseService] ✅ Réseau accessible`);
                resolve(true);
            }
        });
    });
}

async function connectWithRetry(retryCount = 0) {
    if (db) return true;

    const startTime = Date.now();
    console.log('[DatabaseService] 🔌 Tentative de connexion BDD...');

    const config = getConfigService();
    const configDbPath = config.appConfig?.databasePath;

    // Si pas de chemin configuré ou chemin invalide, utiliser directement la base locale
    if (!configDbPath || configDbPath.includes('CHEMIN_RESEAU') || configDbPath.includes('VOTRE_')) {
        console.log('[DatabaseService] 📦 Utilisation de la base de données locale par défaut');
        return connectToLocalDatabase();
    }

    const dbPath = configDbPath;
    const isNetworkPath = dbPath.startsWith('\\\\');

    // Si déjà en mode offline, utiliser directement la base locale
    if (isOfflineMode) {
        return connectToLocalDatabase();
    }

    // ✅ POUR LES CHEMINS RÉSEAU: Test rapide avec timeout de 3 secondes
    if (isNetworkPath) {
        console.log(`[DatabaseService] 🌐 Chemin réseau détecté: ${dbPath}`);
        console.log('[DatabaseService] ⏳ Test d\'accessibilité réseau (timeout 3s)...');

        const isNetworkAccessible = await testNetworkAccessWithTimeout(dbPath, 3000);

        if (!isNetworkAccessible) {
            console.log('[DatabaseService] ⚡ Réseau non accessible - utilisation base locale');
            isOfflineMode = true;
            return connectToLocalDatabase();
        }

        // Réseau accessible, continuer avec la connexion réseau
        console.log('[DatabaseService] ✅ Réseau accessible, connexion à la base partagée...');
    }

    try {
        // Vérifier/créer le répertoire
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) {
            console.log(`[DatabaseService] 📁 Création du répertoire : ${dir}`);
            fs.mkdirSync(dir, { recursive: true });
        }

        // Test d'accès en écriture (pour chemins locaux uniquement)
        if (!isNetworkPath) {
            const testFile = path.join(dir, '.write-test');
            try {
                fs.writeFileSync(testFile, 'test');
                fs.unlinkSync(testFile);
            } catch (accessError) {
                throw new Error(`Répertoire inaccessible`);
            }
        }

        // Connexion à la base de données
        const dbExists = fs.existsSync(dbPath);
        db = new Database(dbPath);
        db.pragma('journal_mode = WAL');
        db.exec(schema);

        if (!dbExists) initializeDefaultData();
        runMigrationIfNecessary();

        isOfflineMode = false;
        console.log(`[DatabaseService] ✅ BDD connectée en ${Date.now() - startTime}ms : ${dbPath}`);
        return true;

    } catch (error) {
        console.log(`[DatabaseService] ⚠️ Erreur connexion: ${error.message}`);
        console.log('[DatabaseService] → Basculement en mode local');
        isOfflineMode = true;
        return connectToLocalDatabase();
    }
}

function connectToLocalDatabase() {
    try {
        // Créer le répertoire si nécessaire
        const localDir = path.dirname(LOCAL_DB_PATH);
        if (!fs.existsSync(localDir)) {
            fs.mkdirSync(localDir, { recursive: true });
        }

        const dbExists = fs.existsSync(LOCAL_DB_PATH);
        db = new Database(LOCAL_DB_PATH);
        db.pragma('journal_mode = WAL');
        db.exec(schema);

        if (!dbExists) {
            console.log('📦 Initialisation nouvelle base locale...');
            initializeDefaultData();
        }

        runMigrationIfNecessary();
        console.log(`✅ Base de données SQLite connectée : ${LOCAL_DB_PATH}`);
        return true;

    } catch (error) {
        console.error('❌ ERREUR FATALE: Impossible de créer la base locale:', error.message);
        throw error;
    }
}

// ✅ Test synchrone rapide d'accès réseau (pour connect() synchrone)
function testNetworkAccessSync(networkPath) {
    const { execSync } = require('child_process');
    try {
        // Timeout de 3 secondes max
        execSync(`dir "${path.dirname(networkPath)}" /b`, { timeout: 3000, stdio: 'pipe' });
        console.log('[DatabaseService] ✅ Réseau accessible (sync)');
        return true;
    } catch (error) {
        console.log(`[DatabaseService] ⚠️ Réseau inaccessible (sync): ${error.message}`);
        return false;
    }
}

function connect() {
    if (db) return;

    const startTime = Date.now();
    console.log('[DatabaseService] 🔌 Connexion synchrone BDD...');

    try {
        const config = getConfigService();
        const configDbPath = config.appConfig?.databasePath;

        let dbPath = LOCAL_DB_PATH;
        let useNetworkPath = false;

        if (configDbPath && !configDbPath.includes('CHEMIN_RESEAU') && !configDbPath.includes('VOTRE_')) {
            if (configDbPath.startsWith('\\\\')) {
                // ✅ Chemin réseau: tester avec timeout de 3s
                console.log(`[DatabaseService] 🌐 Chemin réseau détecté: ${configDbPath}`);
                if (testNetworkAccessSync(configDbPath)) {
                    dbPath = configDbPath;
                    useNetworkPath = true;
                } else {
                    console.log('[DatabaseService] ⚡ Réseau non accessible - utilisation base locale');
                    isOfflineMode = true;
                }
            } else {
                dbPath = configDbPath;
            }
        }

        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        const dbExists = fs.existsSync(dbPath);
        db = new Database(dbPath);
        db.pragma('journal_mode = WAL');
        db.exec(schema);

        if (!dbExists) initializeDefaultData();
        console.log(`[DatabaseService] ✅ BDD connectée en ${Date.now() - startTime}ms : ${dbPath}`);
    } catch (error) {
        console.error("[DatabaseService] ❌ Erreur de connexion:", error.message);
        console.log('[DatabaseService] → Fallback vers base locale');
        isOfflineMode = true;

        // Fallback vers base locale
        const localDir = path.dirname(LOCAL_DB_PATH);
        if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });

        const dbExists = fs.existsSync(LOCAL_DB_PATH);
        db = new Database(LOCAL_DB_PATH);
        db.pragma('journal_mode = WAL');
        db.exec(schema);

        if (!dbExists) initializeDefaultData();
        console.log(`[DatabaseService] ✅ Base de données de secours : ${LOCAL_DB_PATH}`);
    }
}

function close() {
    if (db) {
        db.close();
        db = null;
        console.log('✅ Base de données déconnectée.');
    }
}

function run(sql, params = []) {
    connect();
    try {
        return db.prepare(sql).run(params);
    } catch (error) {
        console.error(`Erreur SQL (run):`, error.message);
        throw error;
    }
}

function get(sql, params = []) {
    connect();
    try {
        return db.prepare(sql).get(params);
    } catch (error) {
        console.error(`Erreur SQL (get):`, error.message);
        throw error;
    }
}

function all(sql, params = []) {
    connect();
    try {
        return db.prepare(sql).all(params);
    } catch (error) {
        console.error(`Erreur SQL (all):`, error.message);
        throw error;
    }
}

function prepare(sql) {
    connect();
    try {
        return db.prepare(sql);
    } catch (error) {
        console.error(`Erreur SQL (prepare):`, error.message);
        throw error;
    }
}

function transaction(fn) {
    connect();
    try {
        return db.transaction(fn);
    } catch (error) {
        console.error("Erreur transaction:", error.message);
        throw error;
    }
}

function createAIDocument(doc) {
    connect();
    try {
        const stmt = db.prepare(`
            INSERT INTO ai_documents (filename, file_type, file_size, content, metadata, language)
            VALUES (@filename, @file_type, @file_size, @content, @metadata, @language)
        `);
        const info = stmt.run(doc);
        return info.lastInsertRowid;
    } catch (error) {
        console.error("Erreur createAIDocument:", error.message);
        throw error;
    }
}

function createAIDocumentChunk(chunk) {
    connect();
    try {
        const stmt = db.prepare(`
            INSERT INTO ai_document_chunks (document_id, chunk_index, content, metadata)
            VALUES (@document_id, @chunk_index, @content, @metadata)
        `);
        const info = stmt.run(chunk);
        return info.lastInsertRowid;
    } catch (error) {
        console.error("Erreur createAIDocumentChunk:", error.message);
        throw error;
    }
}

function exec(sql) {
    connect();
    try {
        return db.exec(sql);
    } catch (error) {
        console.error(`Erreur SQL (exec):`, error.message);
        throw error;
    }
}

function getConnection() {
    connect();
    return db;
}

function isInOfflineMode() {
    return isOfflineMode;
}

function getDatabasePath() {
    return isOfflineMode ? LOCAL_DB_PATH : (getConfigService().appConfig?.databasePath || LOCAL_DB_PATH);
}

module.exports = {
    connect,
    connectWithRetry,
    close,
    run,
    get,
    all,
    prepare,
    transaction,
    exec,
    getConnection,
    isInOfflineMode,
    getDatabasePath,
    createAIDocument,
    createAIDocumentChunk
};
