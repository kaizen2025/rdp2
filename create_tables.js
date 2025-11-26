// create_tables.js - Création des tables SQLite
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, 'database');
const DB_PATH = path.join(DB_DIR, 'docucortex.db');

// Créer le dossier database s'il n'existe pas
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
    console.log('✅ Dossier database créé');
}

const db = new sqlite3.Database(DB_PATH);

const SQL_SCHEMA = `
-- Tables pour le système de chat
CREATE TABLE IF NOT EXISTS chat_channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_private INTEGER DEFAULT 0,
    members TEXT
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    edited INTEGER DEFAULT 0,
    reactions TEXT,
    FOREIGN KEY (channel_id) REFERENCES chat_channels(id)
);

CREATE TABLE IF NOT EXISTS user_preferences (
    user_id TEXT PRIMARY KEY,
    preferences TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

console.log('📝 Création des tables SQLite...');

db.exec(SQL_SCHEMA, (err) => {
    if (err) {
        console.error('❌ Erreur:', err);
        process.exit(1);
    }

    // Vérifier les tables créées
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
        if (err) {
            console.error('❌ Erreur:', err);
            process.exit(1);
        }

        console.log('✅ Tables créées/vérifiées:');
        const requiredTables = ['chat_channels', 'chat_messages', 'user_preferences'];
        requiredTables.forEach(tableName => {
            if (tables.find(t => t.name === tableName)) {
                console.log(`   ✓ ${tableName}`);
            } else {
                console.log(`   ✗ ${tableName} (manquante)`);
            }
        });

        console.log(`\n📍 Base de données: ${DB_PATH}`);
        db.close();
    });
});
