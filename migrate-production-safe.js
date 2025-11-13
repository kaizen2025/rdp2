/**
 * Script de migration SÉCURISÉ pour la base de données de PRODUCTION
 *
 * ⚠️  ATTENTION : Ce script manipule la base de PRODUCTION avec des prêts en cours
 *
 * Fonctionnement :
 * 1. Vérifie que la base existe
 * 2. Crée les tables app_users SI ELLES N'EXISTENT PAS
 * 3. Migre les 4 techniciens UNIQUEMENT S'ILS NE SONT PAS DÉJÀ PRÉSENTS
 * 4. Ne touche PAS aux données existantes (prêts, ordinateurs, utilisateurs Excel)
 */

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const SALT_ROUNDS = 10;

// Chemin de la base de PRODUCTION (Windows)
const PRODUCTION_DB_PATH = '\\\\192.168.1.230\\Donnees\\Informatique\\PROGRAMMES\\Programme RDS\\RDS Viewer Group\\rds_viewer_data.sqlite';

// Les 4 techniciens à migrer
const TECHNICIANS = [
    {
        id: 'kevin_bivia',
        name: 'Kevin BIVIA',
        email: 'kevin.bivia@anecoop.fr',
        position: 'Chef de projet',
        role: 'super_admin'
    },
    {
        id: 'meher_benhassine',
        name: 'Meher BENHASSINE',
        email: 'meher.benhassine@anecoop.fr',
        position: 'Chef de projet',
        role: 'admin'
    },
    {
        id: 'christelle_moles',
        name: 'Christelle MOLES',
        email: 'christelle.moles@anecoop.fr',
        position: 'Responsable informatique',
        role: 'admin'
    },
    {
        id: 'macha_anton',
        name: 'Macha ANTON',
        email: 'macha.anton@anecoop.fr',
        position: 'Alternante informatique',
        role: 'technician'
    }
];

// Mapping rôle → permissions
const ROLE_PERMISSIONS = {
    super_admin: {
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
    admin: {
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
    technician: {
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
    }
};

async function migrateProduction() {
    console.log('🔐 MIGRATION SÉCURISÉE BASE DE PRODUCTION');
    console.log('================================================\n');

    // 1. Vérifier que la base existe
    console.log(`📂 Chemin: ${PRODUCTION_DB_PATH}\n`);

    if (!fs.existsSync(PRODUCTION_DB_PATH)) {
        console.error('❌ ERREUR: Base de données introuvable !');
        console.log('   Vérifiez que le partage réseau est accessible.\n');
        process.exit(1);
    }

    console.log('✅ Base de données trouvée\n');

    // 2. Ouvrir la base (PAS en readonly cette fois)
    const db = new Database(PRODUCTION_DB_PATH);
    db.pragma('journal_mode = WAL');

    try {
        // 3. Commencer une transaction pour tout ou rien
        db.exec('BEGIN TRANSACTION');

        console.log('🔍 Vérification des tables existantes...\n');

        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
        const tableNames = tables.map(t => t.name);

        const hasAppUsers = tableNames.includes('app_users');
        const hasAppPermissions = tableNames.includes('app_permissions');
        const hasLoginHistory = tableNames.includes('app_login_history');

        // 4. Créer les tables SI ELLES N'EXISTENT PAS
        if (!hasAppUsers) {
            console.log('📝 Création de la table app_users...');
            db.exec(`
                CREATE TABLE app_users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT NOT NULL,
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
            `);
            console.log('✅ Table app_users créée\n');
        } else {
            console.log('✅ Table app_users existe déjà\n');
        }

        if (!hasAppPermissions) {
            console.log('📝 Création de la table app_permissions...');
            db.exec(`
                CREATE TABLE app_permissions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL UNIQUE,
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
                    FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE
                );
            `);
            console.log('✅ Table app_permissions créée\n');
        } else {
            console.log('✅ Table app_permissions existe déjà\n');
        }

        if (!hasLoginHistory) {
            console.log('📝 Création de la table app_login_history...');
            db.exec(`
                CREATE TABLE app_login_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    ip_address TEXT,
                    user_agent TEXT,
                    success INTEGER NOT NULL,
                    failure_reason TEXT,
                    login_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE
                );
            `);
            console.log('✅ Table app_login_history créée\n');
        } else {
            console.log('✅ Table app_login_history existe déjà\n');
        }

        // 5. Migrer les techniciens UNIQUEMENT s'ils n'existent pas
        console.log('👥 Migration des techniciens...\n');

        const insertUserStmt = db.prepare(`
            INSERT INTO app_users (username, email, display_name, position, password_hash, is_admin, is_active, must_change_password)
            VALUES (?, ?, ?, ?, ?, ?, 1, 1)
        `);

        const insertPermStmt = db.prepare(`
            INSERT INTO app_permissions (
                user_id, can_access_dashboard, can_access_rds_sessions, can_access_servers,
                can_access_users, can_access_ad_groups, can_access_loans, can_access_docucortex,
                can_manage_users, can_manage_permissions, can_view_reports
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const checkUserStmt = db.prepare('SELECT id FROM app_users WHERE username = ?');

        let migratedCount = 0;
        let skippedCount = 0;

        for (const tech of TECHNICIANS) {
            const existing = checkUserStmt.get(tech.id);

            if (existing) {
                console.log(`   ⏭️  ${tech.name} existe déjà (ID: ${existing.id})`);
                skippedCount++;
                continue;
            }

            // Hash le mot de passe par défaut "admin"
            const passwordHash = await bcrypt.hash('admin', SALT_ROUNDS);

            // Insérer l'utilisateur
            const result = insertUserStmt.run(
                tech.id,
                tech.email,
                tech.name,
                tech.position,
                passwordHash,
                tech.role === 'super_admin' || tech.role === 'admin' ? 1 : 0
            );

            const userId = result.lastInsertRowid;

            // Insérer les permissions
            const perms = ROLE_PERMISSIONS[tech.role];
            insertPermStmt.run(
                userId,
                perms.can_access_dashboard,
                perms.can_access_rds_sessions,
                perms.can_access_servers,
                perms.can_access_users,
                perms.can_access_ad_groups,
                perms.can_access_loans,
                perms.can_access_docucortex,
                perms.can_manage_users,
                perms.can_manage_permissions,
                perms.can_view_reports
            );

            console.log(`   ✅ ${tech.name} migré (ID: ${userId})`);
            migratedCount++;
        }

        // 6. Valider la transaction
        db.exec('COMMIT');

        console.log('\n================================================');
        console.log('✅ MIGRATION TERMINÉE AVEC SUCCÈS\n');
        console.log(`   • ${migratedCount} technicien(s) ajouté(s)`);
        console.log(`   • ${skippedCount} technicien(s) déjà existant(s)`);

        // 7. Vérifier que les prêts sont toujours là
        const loanCount = db.prepare('SELECT COUNT(*) as count FROM loans').get();
        console.log(`   • ${loanCount.count} prêt(s) préservé(s) dans la base\n`);

        console.log('⚠️  Mot de passe par défaut: "admin"');
        console.log('   (à changer à la première connexion)\n');

    } catch (error) {
        // Annuler tout en cas d'erreur
        db.exec('ROLLBACK');
        console.error('\n❌ ERREUR LORS DE LA MIGRATION:');
        console.error(error.message);
        console.error('\n⚠️  Transaction annulée, aucune modification appliquée.\n');
        process.exit(1);
    } finally {
        db.close();
    }
}

// Exécuter
migrateProduction().catch(console.error);
