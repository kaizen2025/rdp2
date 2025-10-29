// backend/services/databaseService.js - SERVICE CENTRAL DE BASE DE DONNÉES COMPLET

const path = require('path');
const Database = require('better-sqlite3');
const configService = require('./configService');
const fs = require('fs');

let db;

// Schéma SQL complet qui définit la structure de toute l'application.
const schema = `
    -- Configuration initiale pour la robustesse et la performance
    PRAGMA foreign_keys = ON;      -- Active la vérification des clés étrangères
    PRAGMA synchronous = NORMAL;   -- Bon compromis entre sécurité et performance pour un usage réseau

    -- Table pour les ordinateurs (remplace computers_stock.json)
    CREATE TABLE IF NOT EXISTS computers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        brand TEXT,
        model TEXT,
        serialNumber TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'available' CHECK(status IN ('available', 'loaned', 'reserved', 'maintenance', 'retired')),
        notes TEXT,
        specifications TEXT, -- Champ de type TEXT pour stocker un objet JSON
        warranty TEXT,       -- Champ de type TEXT pour stocker un objet JSON
        location TEXT,
        condition TEXT,
        assetTag TEXT,
        maintenanceHistory TEXT, -- Champ de type TEXT pour stocker un tableau JSON
        createdAt TEXT,
        createdBy TEXT,
        lastModified TEXT,
        modifiedBy TEXT
    );

    -- Table pour les prêts (remplace loans.json)
    CREATE TABLE IF NOT EXISTS loans (
        id TEXT PRIMARY KEY,
        computerId TEXT NOT NULL REFERENCES computers(id) ON DELETE CASCADE, -- Si un PC est supprimé, ses prêts le sont aussi
        computerName TEXT,
        userName TEXT NOT NULL,
        userDisplayName TEXT,
        itStaff TEXT,
        loanDate TEXT NOT NULL,
        expectedReturnDate TEXT NOT NULL,
        actualReturnDate TEXT,
        status TEXT NOT NULL,
        notes TEXT,
        accessories TEXT, -- Champ de type TEXT pour stocker un tableau JSON
        history TEXT,     -- Champ de type TEXT pour stocker un tableau JSON
        extensionCount INTEGER DEFAULT 0,
        createdBy TEXT,
        createdAt TEXT,
        returnedBy TEXT,
        returnData TEXT   -- Champ de type TEXT pour stocker les infos de retour (accessoires, etc.)
    );

    -- Table pour l'historique global des prêts (optimisé pour les statistiques)
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
        details TEXT -- Champ de type TEXT pour stocker un objet JSON
    );
    CREATE INDEX IF NOT EXISTS idx_history_computer ON loan_history(computerId);
    CREATE INDEX IF NOT EXISTS idx_history_user ON loan_history(userName);

    -- Table pour les accessoires (remplace accessories_config.json)
    CREATE TABLE IF NOT EXISTS accessories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        icon TEXT,
        active INTEGER DEFAULT 1, -- 1 pour true, 0 pour false
        createdAt TEXT,
        createdBy TEXT,
        modifiedAt TEXT,
        modifiedBy TEXT
    );

    -- Table pour les notifications de prêt (remplace loan_notifications.json)
    CREATE TABLE IF NOT EXISTS loan_notifications (
        id TEXT PRIMARY KEY,
        loanId TEXT,
        computerName TEXT,
        userName TEXT,
        userDisplayName TEXT,
        type TEXT,
        date TEXT,
        read_status INTEGER DEFAULT 0, -- 1 pour lu, 0 pour non lu
        details TEXT -- Champ de type TEXT pour stocker un objet JSON
    );

    -- Table pour les canaux de chat (partie de chat.json)
    CREATE TABLE IF NOT EXISTS chat_channels (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        createdAt TEXT,
        createdBy TEXT
    );

    -- Table pour les messages de chat (partie de chat.json)
    CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        channelId TEXT NOT NULL, -- Peut être un channelId ou une clé de DM
        authorId TEXT NOT NULL,
        authorName TEXT,
        authorAvatar TEXT,
        text TEXT,
        timestamp TEXT NOT NULL,
        reactions TEXT, -- Champ de type TEXT pour stocker un objet JSON
        file_info TEXT  -- Champ de type TEXT pour stocker un objet JSON
    );
    CREATE INDEX IF NOT EXISTS idx_chat_channel_ts ON chat_messages(channelId, timestamp);

    -- Table pour la présence des techniciens (remplace technicians_presence.json)
    CREATE TABLE IF NOT EXISTS technician_presence (
        id TEXT PRIMARY KEY,
        name TEXT,
        avatar TEXT,
        position TEXT,
        status TEXT, -- 'online' ou 'offline'
        hostname TEXT,
        loginTime TEXT,
        lastActivity TEXT
    );

    -- Table pour les sessions RDS
    CREATE TABLE IF NOT EXISTS rds_sessions (
        id TEXT PRIMARY KEY, -- Composite key: server-sessionId
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

    -- Table pour les utilisateurs RDS (synchronisée depuis Excel)
    -- Cette table est le cache SQLite des utilisateurs, synchronisé avec le fichier Excel
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        displayName TEXT NOT NULL,
        email TEXT,
        department TEXT,
        server TEXT,
        password TEXT,
        officePassword TEXT,
        adEnabled INTEGER DEFAULT 1, -- 1 pour actif, 0 pour désactivé
        notes TEXT,
        createdAt TEXT,
        createdBy TEXT,
        lastModified TEXT,
        modifiedBy TEXT,
        lastSyncFromExcel TEXT -- Date de dernière synchronisation depuis Excel
    );
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_server ON users(server);

    -- Table clé-valeur générique pour les paramètres (ex: loan_settings)
    CREATE TABLE IF NOT EXISTS key_value_store (
        key TEXT PRIMARY KEY,
        value TEXT
    );
`;

/**
 * Établit la connexion à la base de données. Crée et initialise le fichier si nécessaire.
 */
function connect() {
    if (db) return;

    const dbPath = configService.appConfig.databasePath || 
                   path.join(path.dirname(configService.appConfig.defaultExcelPath), 'rds_viewer_data.sqlite');
    
    const dbExists = fs.existsSync(dbPath);

    try {
        // S'assurer que le répertoire existe
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        db = new Database(dbPath, { /* verbose: console.log */ });
        
        // AMÉLIORATION CONCURRENCE: WAL (Write-Ahead Logging) mode
        // Permet à plusieurs lecteurs d'accéder à la base pendant qu'un processus écrit. Crucial pour un partage réseau.
        db.pragma('journal_mode = WAL');
        
        // Appliquer le schéma pour créer les tables si elles n'existent pas
        db.exec(schema);

        // Si la base de données vient d'être créée, on la peuple avec des données initiales
        if (!dbExists) {
            console.log('Nouvelle base de données créée. Initialisation des données par défaut...');
            initializeDefaultData();
        }
        
        console.log(`✅ Base de données SQLite connectée : ${dbPath}`);
    } catch (error) {
        console.error("❌ Erreur de connexion à la base de données SQLite:", error);
        throw error; // Propage l'erreur pour arrêter l'application si la DB est inaccessible
    }
}

/**
 * Peuple la base de données avec les données initiales nécessaires au bon fonctionnement.
 */
function initializeDefaultData() {
    const now = new Date().toISOString();
    const transaction = db.transaction(() => {
        // Canaux de chat par défaut
        const channels = [
            { id: 'general', name: 'Général', description: 'Canal de discussion principal.' },
            { id: 'maintenance', name: 'Annonces Maintenance', description: 'Annonces importantes.' },
            { id: 'urgences', name: 'Urgences', description: 'Canal pour les urgences IT.' }
        ];
        const insertChannel = db.prepare('INSERT OR IGNORE INTO chat_channels (id, name, description, createdAt, createdBy) VALUES (?, ?, ?, ?, ?)');
        channels.forEach(c => insertChannel.run(c.id, c.name, c.description, now, 'system'));

        // Accessoires par défaut
        const accessories = [
            { id: 'charger', name: 'Chargeur', icon: 'power' }, 
            { id: 'mouse', name: 'Souris', icon: 'mouse' },
            { id: 'bag', name: 'Sacoche', icon: 'work' }, 
            { id: 'docking_station', name: 'Station d\'accueil', icon: 'dock' }
        ];
        const insertAccessory = db.prepare('INSERT OR IGNORE INTO accessories (id, name, icon, active, createdAt, createdBy) VALUES (?, ?, ?, 1, ?, ?)');
        accessories.forEach(a => insertAccessory.run(a.id, a.name, a.icon, now, 'system'));

        // Paramètres de prêt par défaut
        const defaultSettings = { 
            maxLoanDays: 90, 
            maxExtensions: 3, 
            reminderDaysBefore: [7, 3, 1], 
            overdueReminderDays: [1, 3, 7], 
            autoNotifications: true 
        };
        db.prepare('INSERT OR IGNORE INTO key_value_store (key, value) VALUES (?, ?)').run('loan_settings', JSON.stringify(defaultSettings));
    });
    transaction();
    console.log('✅ Données par défaut insérées.');
}

/**
 * Ferme la connexion à la base de données.
 */
function close() {
    if (db) {
        db.close();
        db = null;
        console.log('✅ Base de données SQLite déconnectée.');
    }
}

/**
 * Exécute une requête qui ne retourne pas de résultat (INSERT, UPDATE, DELETE).
 * @param {string} sql La requête SQL.
 * @param {Array} params Les paramètres de la requête.
 * @returns {object} Le résultat de l'exécution.
 */
function run(sql, params = []) {
    connect(); // S'assure que la connexion est active
    try {
        return db.prepare(sql).run(params);
    } catch (error) {
        console.error(`Erreur SQL (run) sur "${sql}":`, error);
        throw error;
    }
}

/**
 * Exécute une requête qui retourne une seule ligne.
 * @param {string} sql La requête SQL.
 * @param {Array} params Les paramètres de la requête.
 * @returns {object|undefined} La ligne de résultat ou undefined.
 */
function get(sql, params = []) {
    connect();
    try {
        return db.prepare(sql).get(params);
    } catch (error) {
        console.error(`Erreur SQL (get) sur "${sql}":`, error);
        throw error;
    }
}

/**
 * Exécute une requête qui retourne plusieurs lignes.
 * @param {string} sql La requête SQL.
 * @param {Array} params Les paramètres de la requête.
 * @returns {Array<object>} Un tableau des lignes de résultat.
 */
function all(sql, params = []) {
    connect();
    try {
        return db.prepare(sql).all(params);
    } catch (error) {
        console.error(`Erreur SQL (all) sur "${sql}":`, error);
        throw error;
    }
}

/**
 * Prépare une requête SQL pour une exécution ultérieure.
 * IMPORTANT: Cette méthode est nécessaire pour les transactions et requêtes paramétrées.
 * @param {string} sql La requête SQL à préparer.
 * @returns {Statement} Un objet Statement de better-sqlite3.
 */
function prepare(sql) {
    connect();
    try {
        return db.prepare(sql);
    } catch (error) {
        console.error(`Erreur SQL (prepare) sur "${sql}":`, error);
        throw error;
    }
}

/**
 * Crée une fonction de transaction.
 * IMPORTANT: Cette méthode est nécessaire pour exécuter plusieurs requêtes de manière atomique.
 * @param {Function} fn La fonction contenant les opérations de la transaction.
 * @returns {Function} Une fonction qui exécute la transaction.
 */
function transaction(fn) {
    connect();
    try {
        return db.transaction(fn);
    } catch (error) {
        console.error("Erreur création transaction:", error);
        throw error;
    }
}

/**
 * Exécute une requête SQL brute (pour les cas particuliers).
 * @param {string} sql La ou les requêtes SQL à exécuter.
 */
function exec(sql) {
    connect();
    try {
        return db.exec(sql);
    } catch (error) {
        console.error(`Erreur SQL (exec):`, error);
        throw error;
    }
}

/**
 * Obtient une référence à la connexion db pour des opérations avancées.
 * ATTENTION: À utiliser avec précaution.
 * @returns {Database} L'instance de connexion better-sqlite3.
 */
function getConnection() {
    connect();
    return db;
}

module.exports = {
    connect,
    close,
    run,
    get,
    all,
    prepare,      // ✅ AJOUT CRITIQUE
    transaction,  // ✅ AJOUT CRITIQUE
    exec,         // ✅ AJOUT POUR COMPATIBILITÉ
    getConnection // ✅ AJOUT POUR CAS AVANCÉS
};