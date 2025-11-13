/**
 * Script pour ajouter la colonne profile_picture_url à la table app_users
 * Exécuter avec: node backend/scripts/add-profile-picture-column.js
 */

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

async function addProfilePictureColumn() {
    console.log('🚀 Ajout de la colonne profile_picture_url à app_users...\n');

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

        // Vérifier si la table app_users existe
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='app_users'").all();

        if (tables.length === 0) {
            console.log('⚠️  La table app_users n\'existe pas encore.');
            console.log('   Veuillez d\'abord exécuter: node migrate-production-safe.js');
            return;
        }

        // Vérifier si la colonne existe déjà
        const tableInfo = db.prepare("PRAGMA table_info(app_users)").all();
        const hasProfilePicture = tableInfo.some(col => col.name === 'profile_picture_url');

        if (hasProfilePicture) {
            console.log('✅ La colonne profile_picture_url existe déjà, rien à faire.');
            return;
        }

        // Ajouter la colonne
        db.prepare(`
            ALTER TABLE app_users
            ADD COLUMN profile_picture_url TEXT
        `).run();

        console.log('✅ Colonne profile_picture_url ajoutée avec succès!');
        console.log('   Les utilisateurs peuvent maintenant uploader une photo de profil.');

    } catch (error) {
        console.error('❌ Erreur lors de l\'ajout de la colonne:', error.message);
        throw error;
    } finally {
        if (db) {
            db.close();
            console.log('\n✅ Migration terminée.');
        }
    }
}

// Exécuter le script
addProfilePictureColumn().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
});
