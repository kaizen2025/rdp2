// backend/services/databaseService.js - VERSION FINALE AVEC MIGRATION ROBUSTE

const path = require('path');
const Database = require('better-sqlite3');
const configService = require('./configService');
const fs = require('fs');

let db;

const schema = `
    PRAGMA foreign_keys = ON; PRAGMA synchronous = NORMAL;
    CREATE TABLE IF NOT EXISTS computers (id TEXT PRIMARY KEY, name TEXT NOT NULL, brand TEXT, model TEXT, serialNumber TEXT UNIQUE NOT NULL, status TEXT DEFAULT 'available', notes TEXT, specifications TEXT, warranty TEXT, location TEXT, condition TEXT, assetTag TEXT, maintenanceHistory TEXT, createdAt TEXT, createdBy TEXT, lastModified TEXT, modifiedBy TEXT);
    CREATE TABLE IF NOT EXISTS loans (id TEXT PRIMARY KEY, computerId TEXT NOT NULL REFERENCES computers(id) ON DELETE CASCADE, computerName TEXT, userName TEXT NOT NULL, userDisplayName TEXT, itStaff TEXT, loanDate TEXT NOT NULL, expectedReturnDate TEXT NOT NULL, actualReturnDate TEXT, status TEXT NOT NULL, notes TEXT, accessories TEXT, history TEXT, extensionCount INTEGER DEFAULT 0, createdBy TEXT, createdAt TEXT, returnedBy TEXT, returnData TEXT);
    CREATE TABLE IF NOT EXISTS loan_history (id TEXT PRIMARY KEY, loanId TEXT, eventType TEXT, date TEXT, by TEXT, byId TEXT, computerId TEXT, computerName TEXT, userName TEXT, userDisplayName TEXT, details TEXT); CREATE INDEX IF NOT EXISTS idx_history_computer ON loan_history(computerId); CREATE INDEX IF NOT EXISTS idx_history_user ON loan_history(userName);
    CREATE TABLE IF NOT EXISTS accessories (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, icon TEXT, active INTEGER DEFAULT 1, createdAt TEXT, createdBy TEXT, modifiedAt TEXT, modifiedBy TEXT);
    CREATE TABLE IF NOT EXISTS loan_notifications (id TEXT PRIMARY KEY, loanId TEXT, computerName TEXT, userName TEXT, userDisplayName TEXT, type TEXT, date TEXT, read_status INTEGER DEFAULT 0, details TEXT);
    CREATE TABLE IF NOT EXISTS chat_channels (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, description TEXT, createdAt TEXT, createdBy TEXT);
    CREATE TABLE IF NOT EXISTS chat_messages (id TEXT PRIMARY KEY, channelId TEXT NOT NULL, authorId TEXT NOT NULL, authorName TEXT, authorAvatar TEXT, text TEXT, timestamp TEXT NOT NULL, reactions TEXT, file_info TEXT); CREATE INDEX IF NOT EXISTS idx_chat_channel_ts ON chat_messages(channelId, timestamp);
    CREATE TABLE IF NOT EXISTS technician_presence (id TEXT PRIMARY KEY, name TEXT, avatar TEXT, position TEXT, status TEXT, hostname TEXT, loginTime TEXT, lastActivity TEXT);
    CREATE TABLE IF NOT EXISTS rds_sessions (id TEXT PRIMARY KEY, server TEXT NOT NULL, sessionId TEXT NOT NULL, username TEXT, sessionName TEXT, state TEXT, idleTime TEXT, logonTime TEXT, isActive INTEGER, lastUpdate TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, displayName TEXT NOT NULL, email TEXT, department TEXT, server TEXT, password TEXT, officePassword TEXT, adEnabled INTEGER DEFAULT 1, notes TEXT, createdAt TEXT, createdBy TEXT, lastModified TEXT, modifiedBy TEXT, lastSyncFromExcel TEXT); CREATE INDEX IF NOT EXISTS idx_users_username ON users(username); CREATE INDEX IF NOT EXISTS idx_users_server ON users(server);
    CREATE TABLE IF NOT EXISTS key_value_store (key TEXT PRIMARY KEY, value TEXT);
`;

function runMigrationIfNecessary() {
    console.log("🔍 Vérification de la nécessité d'une migration de données...");
    const migrationFlag = db.prepare("SELECT value FROM key_value_store WHERE key = 'migration_done'").get();
    if (migrationFlag) {
        console.log("✅ Migration déjà effectuée, rien à faire.");
        return;
    }
    const computersCount = db.prepare('SELECT COUNT(*) as count FROM computers').get().count;
    if (computersCount > 0) {
        console.log("✅ Base de données non vide. Migration ignorée.");
        db.prepare("INSERT INTO key_value_store (key, value) VALUES ('migration_done', 'true')").run();
        return;
    }
    console.log("🚀 Démarrage de la migration depuis les fichiers JSON...");

    const SHARED_DATA_PATH = path.dirname(configService.appConfig.databasePath);
    const PATHS = {
        computers: path.join(SHARED_DATA_PATH, 'computers_stock.json'),
        loans: path.join(SHARED_DATA_PATH, 'loans.json'),
        chat: path.join(SHARED_DATA_PATH, 'chat.json'),
    };

    const readJson = (filePath) => {
        try {
            if (fs.existsSync(filePath)) { return JSON.parse(fs.readFileSync(filePath, 'utf-8')); }
            console.warn(`- Fichier de migration non trouvé: ${path.basename(filePath)}`); return null;
        } catch (error) { console.error(`! Erreur lecture ${path.basename(filePath)}:`, error); return null; }
    };
    const stringify = (data) => data ? JSON.stringify(data) : null;

    const transaction = db.transaction(() => {
        const computersData = readJson(PATHS.computers);
        if (computersData?.computers) {
            const insert = db.prepare(`INSERT OR IGNORE INTO computers (id, name, brand, model, serialNumber, status, notes, specifications, warranty, location, condition, assetTag, maintenanceHistory, createdAt, createdBy, lastModified, modifiedBy) VALUES (@id, @name, @brand, @model, @serialNumber, @status, @notes, @specifications, @warranty, @location, @condition, @assetTag, @maintenanceHistory, @createdAt, @createdBy, @updatedAt, @updatedBy)`);
            computersData.computers.forEach(c => insert.run({ ...c, specifications: stringify(c.specifications), warranty: stringify(c.warranty), maintenanceHistory: stringify(c.maintenanceHistory) }));
            console.log(`  -> ${computersData.computers.length} ordinateurs migrés.`);
        }

        const loansData = readJson(PATHS.loans);
        if (loansData?.loans) {
            const insertLoan = db.prepare(`INSERT OR IGNORE INTO loans (id, computerId, computerName, userName, userDisplayName, itStaff, loanDate, expectedReturnDate, actualReturnDate, status, notes, accessories, history, extensionCount, createdBy, createdAt, returnedBy, returnData) VALUES (@id, @computerId, @computerName, @userName, @userDisplayName, @itStaff, @loanDate, @expectedReturnDate, @actualReturnDate, @status, @notes, @accessories, @history, @extensionCount, @createdBy, @createdAt, @returnedBy, @returnData)`);
            const insertHistory = db.prepare(`INSERT OR IGNORE INTO loan_history (id, loanId, eventType, date, by, byId, computerId, computerName, userName, userDisplayName, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
            loansData.loans.forEach(l => {
                const loanWithDefaults = {
                    actualReturnDate: null, notes: '', accessories: null, history: null, extensionCount: 0,
                    createdBy: '', createdAt: '', returnedBy: null, returnData: null, ...l
                };
                insertLoan.run({ ...loanWithDefaults, accessories: stringify(loanWithDefaults.accessories), history: stringify(loanWithDefaults.history), returnData: stringify(loanWithDefaults.returnData) });
                if (l.history) {
                    l.history.forEach(h => insertHistory.run(`hist_${l.id}_${h.event}_${new Date(h.date).getTime()}`, l.id, h.event, h.date, h.by, h.byId, l.computerId, l.computerName, l.userName, l.userDisplayName, stringify(h.details)));
                }
            });
            console.log(`  -> ${loansData.loans.length} prêts migrés.`);
        }

        const chatData = readJson(PATHS.chat);
        if (chatData?.channels) {
            const insert = db.prepare('INSERT OR IGNORE INTO chat_channels (id, name, description) VALUES (@id, @name, @description)');
            chatData.channels.forEach(c => insert.run(c));
            console.log(`  -> ${chatData.channels.length} canaux de chat migrés.`);
        }
        
        db.prepare("INSERT INTO key_value_store (key, value) VALUES ('migration_done', 'true')").run();
        console.log("🎉 Migration terminée avec succès !");
    });

    try {
        transaction();
    } catch (error) {
        console.error("❌ ERREUR PENDANT LA MIGRATION:", error);
    }
}

function connect() {
    if (db) return;
    const dbPath = configService.appConfig.databasePath;
    const dbExists = fs.existsSync(dbPath);
    try {
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        db = new Database(dbPath);
        db.pragma('journal_mode = WAL');
        db.exec(schema);
        if (!dbExists) initializeDefaultData();
        runMigrationIfNecessary();
        console.log(`✅ Base de données SQLite connectée : ${dbPath}`);
    } catch (error) {
        console.error("❌ Erreur de connexion à la base de données SQLite:", error);
        throw error;
    }
}

function initializeDefaultData() {
    const now = new Date().toISOString();
    const transaction = db.transaction(() => {
        const channels = [{ id: 'general', name: 'Général', description: 'Canal principal.' }, { id: 'maintenance', name: 'Annonces Maintenance', description: 'Annonces importantes.' }];
        const insertChannel = db.prepare('INSERT OR IGNORE INTO chat_channels (id, name, description, createdAt, createdBy) VALUES (?, ?, ?, ?, ?)');
        channels.forEach(c => insertChannel.run(c.id, c.name, c.description, now, 'system'));
        const accessories = [{ id: 'charger', name: 'Chargeur', icon: 'power' }, { id: 'mouse', name: 'Souris', icon: 'mouse' }, { id: 'bag', name: 'Sacoche', icon: 'work' }];
        const insertAccessory = db.prepare('INSERT OR IGNORE INTO accessories (id, name, icon, active, createdAt, createdBy) VALUES (?, ?, ?, 1, ?, ?)');
        accessories.forEach(a => insertAccessory.run(a.id, a.name, a.icon, now, 'system'));
        const defaultSettings = { maxLoanDays: 90, maxExtensions: 3, autoNotifications: true };
        db.prepare('INSERT OR IGNORE INTO key_value_store (key, value) VALUES (?, ?)').run('loan_settings', JSON.stringify(defaultSettings));
    });
    transaction();
    console.log('✅ Données par défaut insérées.');
}

function close() { if (db) { db.close(); db = null; console.log('✅ Base de données déconnectée.'); } }
function run(sql, params = []) { connect(); try { return db.prepare(sql).run(params); } catch (error) { console.error(`Erreur SQL (run) sur "${sql}":`, error); throw error; } }
function get(sql, params = []) { connect(); try { return db.prepare(sql).get(params); } catch (error) { console.error(`Erreur SQL (get) sur "${sql}":`, error); throw error; } }
function all(sql, params = []) { connect(); try { return db.prepare(sql).all(params); } catch (error) { console.error(`Erreur SQL (all) sur "${sql}":`, error); throw error; } }
function prepare(sql) { connect(); try { return db.prepare(sql); } catch (error) { console.error(`Erreur SQL (prepare) sur "${sql}":`, error); throw error; } }
function transaction(fn) { connect(); try { return db.transaction(fn); } catch (error) { console.error("Erreur transaction:", error); throw error; } }
function exec(sql) { connect(); try { return db.exec(sql); } catch (error) { console.error(`Erreur SQL (exec):`, error); throw error; } }
function getConnection() { connect(); return db; }

module.exports = { connect, close, run, get, all, prepare, transaction, exec, getConnection };