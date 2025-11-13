/**
 * Script pour ajouter les colonnes BLOB pour les photos dans SQLite
 * Exécuter avec: node backend/scripts/add-photo-blob-columns.js
 */

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

async function addPhotoBlobColumns() {
    console.log('🚀 Ajout des colonnes photo BLOB dans la base...\n');

    let db;

    try {
        // Charger config.json pour obtenir le chemin de la base de données
        const configPath = path.join(__dirname, '../../config/config.json');
        let dbPath;

        if (fs.existsSync(configPath)) {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            if (config.databasePath) {
                dbPath = config.databasePath;
                console.log('✅ Utilisation de la base de données PRODUCTION:', dbPath);
            }
        }

        // Fallback sur base locale si config non trouvé
        if (!dbPath) {
            dbPath = path.join(__dirname, '../../data/rds_viewer_data.sqlite');
            console.log('⚠️  Base PRODUCTION non trouvée, utilisation de la base locale:', dbPath);
        }

        db = new Database(dbPath);
        db.pragma('journal_mode = WAL');

        // ==================== 1. APP_USERS - Photo de profil technicien ====================

        const appUserTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='app_users'").all();

        if (appUserTables.length > 0) {
            const appUsersInfo = db.prepare("PRAGMA table_info(app_users)").all();
            const hasProfilePicture = appUsersInfo.some(col => col.name === 'profile_picture');

            if (!hasProfilePicture) {
                db.prepare(`
                    ALTER TABLE app_users
                    ADD COLUMN profile_picture BLOB
                `).run();
                console.log('✅ Colonne profile_picture (BLOB) ajoutée à app_users');
            } else {
                console.log('ℹ️  Colonne profile_picture existe déjà dans app_users');
            }
        } else {
            console.log('⚠️  Table app_users n\'existe pas encore. Exécutez d\'abord: node migrate-production-safe.js');
        }

        // ==================== 2. COMPUTERS - Photo du matériel ====================

        const computerTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='computers'").all();

        if (computerTables.length > 0) {
            const computersInfo = db.prepare("PRAGMA table_info(computers)").all();
            const hasComputerPicture = computersInfo.some(col => col.name === 'picture');

            if (!hasComputerPicture) {
                db.prepare(`
                    ALTER TABLE computers
                    ADD COLUMN picture BLOB
                `).run();
                console.log('✅ Colonne picture (BLOB) ajoutée à computers');
            } else {
                console.log('ℹ️  Colonne picture existe déjà dans computers');
            }
        } else {
            console.log('⚠️  Table computers n\'existe pas encore.');
        }

        // ==================== 3. EXCEL_USERS - Photo utilisateur AD ====================

        const excelUserTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='excel_users'").all();

        if (excelUserTables.length > 0) {
            const excelUsersInfo = db.prepare("PRAGMA table_info(excel_users)").all();
            const hasUserPicture = excelUsersInfo.some(col => col.name === 'picture');

            if (!hasUserPicture) {
                db.prepare(`
                    ALTER TABLE excel_users
                    ADD COLUMN picture BLOB
                `).run();
                console.log('✅ Colonne picture (BLOB) ajoutée à excel_users');
            } else {
                console.log('ℹ️  Colonne picture existe déjà dans excel_users');
            }
        } else {
            console.log('⚠️  Table excel_users n\'existe pas encore.');
        }

        console.log('\n✅ Migration terminée avec succès!');
        console.log('   Les photos sont maintenant stockables en BLOB dans la base SQLite.');

    } catch (error) {
        console.error('❌ Erreur lors de l\'ajout des colonnes:', error.message);
        throw error;
    } finally {
        if (db) {
            db.close();
            console.log('✅ Connexion fermée.\n');
        }
    }
}

// Exécuter le script
addPhotoBlobColumns().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
});
