/**
 * Script de migration des IT technicians (config.json) vers app_users (SQLite)
 * Exécuter avec: node backend/scripts/migrate-technicians-to-appusers.js
 */

const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');

const SALT_ROUNDS = 10;

async function migrateITTechniciansToAppUsers() {
    console.log('🚀 Démarrage de la migration des techniciens IT vers app_users...\n');

    let db;

    try {
        // Charger config.json directement
        const configPath = path.join(__dirname, '../../config/config.json');
        if (!fs.existsSync(configPath)) {
            throw new Error('❌ Fichier config.json non trouvé');
        }

        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        console.log('✅ Configuration chargée');

        // Connexion directe à la base de données
        const dbPath = path.join(__dirname, '../../data/rds_viewer_data.sqlite');
        const dbDir = path.dirname(dbPath);

        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        db = new Database(dbPath);
        db.pragma('journal_mode = WAL');
        console.log('✅ Base de données connectée:', dbPath);

        // Créer les tables si elles n'existent pas
        db.exec(`
            CREATE TABLE IF NOT EXISTS app_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                display_name TEXT NOT NULL,
                position TEXT,
                password_hash TEXT NOT NULL,
                is_admin INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1,
                must_change_password INTEGER DEFAULT 1,
                last_login DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS app_permissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                can_access_dashboard INTEGER DEFAULT 1,
                can_access_rds_sessions INTEGER DEFAULT 0,
                can_access_servers INTEGER DEFAULT 0,
                can_access_users INTEGER DEFAULT 0,
                can_access_ad_groups INTEGER DEFAULT 0,
                can_access_loans INTEGER DEFAULT 0,
                can_access_docucortex INTEGER DEFAULT 0,
                can_manage_users INTEGER DEFAULT 0,
                can_manage_permissions INTEGER DEFAULT 0,
                can_view_reports INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
                UNIQUE(user_id)
            );
        `);
        console.log('✅ Tables app_users et app_permissions vérifiées\n');

        const itTechnicians = config.it_technicians || [];

        if (itTechnicians.length === 0) {
            console.log('⚠️  Aucun technicien IT trouvé dans config.json');
            return;
        }

        console.log(`📋 ${itTechnicians.length} technicien(s) trouvé(s) dans config.json\n`);

        // Mapper les rôles vers les permissions par onglet
        const roleToPermissions = {
            'admin': {
                can_access_dashboard: 1,
                can_access_rds_sessions: 1,
                can_access_servers: 1,
                can_access_users: 1,
                can_access_ad_groups: 1,
                can_access_loans: 1,
                can_access_docucortex: 1,
                can_manage_users: 1,
                can_manage_permissions: 1,
                can_view_reports: 1
            },
            'manager': {
                can_access_dashboard: 1,
                can_access_rds_sessions: 1,
                can_access_servers: 1,
                can_access_users: 1,
                can_access_ad_groups: 1,
                can_access_loans: 1,
                can_access_docucortex: 1,
                can_manage_users: 0,
                can_manage_permissions: 0,
                can_view_reports: 1
            },
            'technician': {
                can_access_dashboard: 1,
                can_access_rds_sessions: 1,
                can_access_servers: 1,
                can_access_users: 1,
                can_access_ad_groups: 1,
                can_access_loans: 1,
                can_access_docucortex: 1,
                can_manage_users: 0,
                can_manage_permissions: 0,
                can_view_reports: 0
            },
            'viewer': {
                can_access_dashboard: 1,
                can_access_rds_sessions: 1,
                can_access_servers: 1,
                can_access_users: 1,
                can_access_ad_groups: 0,
                can_access_loans: 1,
                can_access_docucortex: 0,
                can_manage_users: 0,
                can_manage_permissions: 0,
                can_view_reports: 0
            }
        };

        let migratedCount = 0;
        let skippedCount = 0;

        // Préparer les statements
        const checkUserStmt = db.prepare('SELECT id FROM app_users WHERE username = ?');
        const insertUserStmt = db.prepare(`
            INSERT INTO app_users (username, email, display_name, position, password_hash, is_admin, must_change_password)
            VALUES (?, ?, ?, ?, ?, ?, 1)
        `);
        const insertPermissionsStmt = db.prepare(`
            INSERT INTO app_permissions (
                user_id, can_access_dashboard, can_access_rds_sessions, can_access_servers,
                can_access_users, can_access_ad_groups, can_access_loans, can_access_docucortex,
                can_manage_users, can_manage_permissions, can_view_reports
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        // Migrer chaque technicien
        for (const tech of itTechnicians) {
            if (!tech.isActive) {
                console.log(`⏭️  Ignoré (inactif): ${tech.name}`);
                skippedCount++;
                continue;
            }

            try {
                // Vérifier si l'utilisateur existe déjà
                const existing = checkUserStmt.get(tech.id);
                if (existing) {
                    console.log(`⏭️  Déjà migré: ${tech.name} (${tech.id})`);
                    skippedCount++;
                    continue;
                }

                // Déterminer les permissions selon le rôle
                const permissions = roleToPermissions[tech.role] || roleToPermissions['viewer'];

                // Hasher le mot de passe par défaut "admin"
                const passwordHash = await bcrypt.hash('admin', SALT_ROUNDS);

                // Créer l'utilisateur
                const result = insertUserStmt.run(
                    tech.id,
                    tech.email || `${tech.id}@anecoop.fr`,
                    tech.name,
                    tech.position || tech.role,
                    passwordHash,
                    tech.role === 'admin' ? 1 : 0
                );

                const userId = result.lastInsertRowid;

                // Créer les permissions
                insertPermissionsStmt.run(
                    userId,
                    permissions.can_access_dashboard,
                    permissions.can_access_rds_sessions,
                    permissions.can_access_servers,
                    permissions.can_access_users,
                    permissions.can_access_ad_groups,
                    permissions.can_access_loans,
                    permissions.can_access_docucortex,
                    permissions.can_manage_users,
                    permissions.can_manage_permissions,
                    permissions.can_view_reports
                );

                console.log(`✅ Migré: ${tech.name} (${tech.id}) - Rôle: ${tech.role} - ID: ${userId}`);
                migratedCount++;

            } catch (error) {
                console.error(`❌ Erreur migration ${tech.name}:`, error.message);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log(`✨ Migration terminée !`);
        console.log(`   - ${migratedCount} technicien(s) migré(s)`);
        console.log(`   - ${skippedCount} ignoré(s) (inactifs ou déjà migrés)`);
        console.log('='.repeat(60));
        console.log('\n📝 Note: Tous les utilisateurs ont le mot de passe par défaut "admin"');
        console.log('   Ils devront le changer à la première connexion.\n');

    } catch (error) {
        console.error('❌ ERREUR FATALE:', error);
        throw error;
    } finally {
        if (db) {
            db.close();
            console.log('✅ Base de données fermée');
        }
    }
}

// Exécuter la migration
if (require.main === module) {
    migrateITTechniciansToAppUsers()
        .then(() => {
            console.log('\n✅ Script terminé avec succès\n');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Le script a échoué:', error.message, '\n');
            process.exit(1);
        });
}

module.exports = { migrateITTechniciansToAppUsers };
