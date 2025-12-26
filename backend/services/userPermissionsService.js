/**
 * Service de gestion des utilisateurs et permissions de l'application
 */

const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const configService = require('./configService');

class UserPermissionsService {
    constructor() {
        this.initialized = false;
        this.SALT_ROUNDS = 10;
        this.db = null;
    }

    /**
     * Test synchrone rapide d'accès réseau avec timeout
     */
    testNetworkAccessSync(networkPath) {
        const { execSync } = require('child_process');
        try {
            execSync(`dir "${path.dirname(networkPath)}" /b`, { timeout: 3000, stdio: 'pipe' });
            console.log('[UserPermissions] ✅ Réseau accessible');
            return true;
        } catch (error) {
            console.log(`[UserPermissions] ⚠️ Réseau inaccessible: ${error.message}`);
            return false;
        }
    }

    /**
     * Obtenir la connexion à la base de données
     * ✅ OPTIMISATION: Test réseau avec timeout de 3s avant fallback local
     */
    getDb() {
        if (!this.db) {
            const os = require('os');
            const startTime = Date.now();

            const userDataPath = typeof configService.getUserDataPath === 'function'
                ? configService.getUserDataPath()
                : path.join(os.homedir(), 'AppData', 'Roaming', 'RDS Viewer');
            const localDbPath = path.join(userDataPath, 'data', 'rds_viewer_data.sqlite');
            let dbPath = localDbPath;

            if (configService.appConfig && configService.appConfig.databasePath) {
                const configuredPath = configService.appConfig.databasePath;

                if (configuredPath.startsWith('\\\\')) {
                    // ✅ Chemin réseau: tester avec timeout de 3s
                    console.log(`[UserPermissions] 🌐 Chemin réseau détecté: ${configuredPath}`);
                    if (this.testNetworkAccessSync(configuredPath)) {
                        dbPath = configuredPath;
                    } else {
                        console.log(`[UserPermissions] ⚡ Fallback vers base locale`);
                        dbPath = localDbPath;
                    }
                } else if (!configuredPath.includes('CHEMIN_RESEAU') && !configuredPath.includes('VOTRE_')) {
                    dbPath = configuredPath;
                }
            } else {
                console.log(`[UserPermissions] ⚠️ Config non chargée, utilisation base locale`);
            }

            // Créer le dossier si nécessaire (chemins locaux uniquement)
            const dbDir = path.dirname(dbPath);
            if (!dbPath.startsWith('\\\\') && !fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
                console.log(`[UserPermissions] 📁 Dossier créé: ${dbDir}`);
            }

            console.log(`[UserPermissions] ✅ Connexion BDD en ${Date.now() - startTime}ms: ${dbPath}`);
            this.db = new Database(dbPath);
            this.db.pragma('journal_mode = WAL');
        }
        return this.db;
    }

    /**
     * Initialise les tables utilisateurs et permissions
     * Schéma intégré pour éviter les problèmes de fichier externe
     */
    initialize() {
        if (this.initialized) return;

        try {
            const db = this.getDb();

            // Schéma intégré directement dans le code
            const schema = `
                -- Table des utilisateurs de l'application
                CREATE TABLE IF NOT EXISTS app_users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    display_name TEXT,
                    position TEXT DEFAULT 'Utilisateur',
                    password_hash TEXT NOT NULL,
                    is_admin INTEGER DEFAULT 0,
                    is_active INTEGER DEFAULT 1,
                    must_change_password INTEGER DEFAULT 1,
                    last_login TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                );

                -- Table des permissions
                CREATE TABLE IF NOT EXISTS app_permissions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER UNIQUE NOT NULL,
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
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE
                );

                -- Table d'historique des connexions
                CREATE TABLE IF NOT EXISTS app_login_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    ip_address TEXT,
                    user_agent TEXT,
                    login_timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
                    success INTEGER DEFAULT 0,
                    failure_reason TEXT,
                    FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE SET NULL
                );

                -- Index pour améliorer les performances
                CREATE INDEX IF NOT EXISTS idx_app_users_username ON app_users(username);
                CREATE INDEX IF NOT EXISTS idx_app_permissions_user_id ON app_permissions(user_id);
                CREATE INDEX IF NOT EXISTS idx_app_login_history_user_id ON app_login_history(user_id);
                CREATE INDEX IF NOT EXISTS idx_app_login_history_timestamp ON app_login_history(login_timestamp);
            `;

            db.exec(schema);

            // ✅ MIGRATION: Ajouter les colonnes manquantes si la base existait avant
            try {
                // Vérifier si les colonnes existent
                const columns = db.prepare("PRAGMA table_info(app_users)").all();
                const columnNames = columns.map(col => col.name);

                const migrations = [
                    { name: 'is_active', sql: "ALTER TABLE app_users ADD COLUMN is_active INTEGER DEFAULT 1" },
                    { name: 'is_admin', sql: "ALTER TABLE app_users ADD COLUMN is_admin INTEGER DEFAULT 0" },
                    { name: 'must_change_password', sql: "ALTER TABLE app_users ADD COLUMN must_change_password INTEGER DEFAULT 1" },
                    { name: 'position', sql: "ALTER TABLE app_users ADD COLUMN position TEXT DEFAULT 'Utilisateur'" },
                    { name: 'display_name', sql: "ALTER TABLE app_users ADD COLUMN display_name TEXT" },
                    { name: 'last_login', sql: "ALTER TABLE app_users ADD COLUMN last_login TEXT" },
                    { name: 'created_at', sql: "ALTER TABLE app_users ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP" },
                    { name: 'updated_at', sql: "ALTER TABLE app_users ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP" },
                    { name: 'password_hash', sql: "ALTER TABLE app_users ADD COLUMN password_hash TEXT" }
                ];

                for (const migration of migrations) {
                    if (!columnNames.includes(migration.name)) {
                        console.log(`📦 Migration: Ajout de la colonne ${migration.name}...`);
                        db.exec(migration.sql);
                    }
                }
            } catch (migrationError) {
                console.warn('⚠️ Migration colonnes ignorée:', migrationError.message);
            }

            try {
                // RESCUE: Vérifier les mots de passe NULL (cas migration colonne ajoutée)
                const nullPwdCount = db.prepare("SELECT COUNT(*) as count FROM app_users WHERE password_hash IS NULL OR password_hash = ''").get().count;

                if (nullPwdCount > 0) {
                    console.log(`⚠️ ${nullPwdCount} utilisateurs avec mot de passe NULL détectés. Réinitialisation à '123456'...`);
                    const defaultHash = bcrypt.hashSync('123456', this.SALT_ROUNDS);
                    db.prepare("UPDATE app_users SET password_hash = ? WHERE password_hash IS NULL OR password_hash = ''").run(defaultHash);
                    console.log('✅ Mots de passe réinitialisés.');
                }

                // Vérifier si des utilisateurs existent
                const count = db.prepare("SELECT COUNT(*) as count FROM app_users").get().count;

                if (count === 0) {
                    console.log('⚠️ Table app_users vide. Tentative de récupération depuis la table users...');

                    // Vérifier si la table users existe (ancienne table)
                    const usersTableExists = db.prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='users'").get().count > 0;

                    if (usersTableExists) {
                        const existingUsers = db.prepare("SELECT * FROM users").all();
                        if (existingUsers.length > 0) {
                            console.log(`📦 Migration: Import de ${existingUsers.length} utilisateurs depuis la table legacy...`);

                            const insertStmt = db.prepare(`
                                INSERT INTO app_users (username, display_name, password_hash, is_active, is_admin, position)
                                VALUES (?, ?, ?, 1, 0, 'Technicien')
                            `);

                            const defaultPasswordHash = bcrypt.hashSync('123456', this.SALT_ROUNDS); // Mot de passe par défaut pour migration

                            const transaction = db.transaction((users) => {
                                for (const user of users) {
                                    // Détecter si admin
                                    const isAdmin = user.username.toLowerCase().includes('admin') || user.username.toLowerCase() === 'kbivia';
                                    insertStmt.run(user.username, user.displayName || user.username, defaultPasswordHash);
                                    if (isAdmin) {
                                        db.prepare("UPDATE app_users SET is_admin = 1 WHERE username = ?").run(user.username);
                                    }
                                }
                            });

                            transaction(existingUsers);
                            console.log('✅ Import terminés. Mot de passe par défaut: 123456');
                        } else {
                            // Créer admin par défaut si aucun user legacy
                            console.log('📦 Création admin par défaut (mot de passe: 123456)...');
                            const hash = bcrypt.hashSync('123456', this.SALT_ROUNDS);
                            db.prepare("INSERT INTO app_users (username, display_name, password_hash, is_admin, is_active, must_change_password, position) VALUES (?, ?, ?, 1, 1, 0, 'Administrateur IT')").run('admin', 'Administrateur', hash);
                        }
                    } else {
                        // Créer admin par défaut
                        console.log('📦 Création admin par défaut (mot de passe: 123456)...');
                        const hash = bcrypt.hashSync('123456', this.SALT_ROUNDS);
                        db.prepare("INSERT INTO app_users (username, display_name, password_hash, is_admin, is_active, must_change_password, position) VALUES (?, ?, ?, 1, 1, 0, 'Administrateur IT')").run('admin', 'Administrateur', hash);
                    }
                }
            } catch (seedError) {
                console.error('❌ Erreur seeding/rescue utilisateurs:', seedError);
            }

            this.initialized = true;
            console.log('✅ Tables utilisateurs et permissions initialisées');
        } catch (error) {
            console.error('❌ Erreur initialisation tables utilisateurs:', error);
            throw error;
        }
    }

    // ==================== UTILISATEURS ====================

    /**
     * Créer un nouvel utilisateur
     */
    async createUser(data) {
        this.initialize();

        const passwordHash = await bcrypt.hash(data.password || 'admin', this.SALT_ROUNDS);

        const stmt = this.getDb().prepare(`
            INSERT INTO app_users (
                username, display_name, position,
                password_hash, is_admin, must_change_password
            ) VALUES (?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            data.username,
            data.display_name,
            data.position || 'Utilisateur',
            passwordHash,
            data.is_admin ? 1 : 0,
            1  // Doit changer le mot de passe par défaut
        );

        const userId = result.lastInsertRowid;

        // Créer les permissions par défaut
        this.createDefaultPermissions(userId, data.permissions);

        return userId;
    }

    /**
     * Créer les permissions par défaut pour un utilisateur
     */
    createDefaultPermissions(userId, customPermissions = {}) {
        this.initialize();

        const defaultPerms = {
            can_access_dashboard: 1,
            can_access_rds_sessions: 0,
            can_access_servers: 0,
            can_access_users: 0,
            can_access_ad_groups: 0,
            can_access_loans: 0,
            can_access_docucortex: 0,
            can_manage_users: 0,
            can_manage_permissions: 0,
            can_view_reports: 0,
            ...customPermissions
        };

        const stmt = this.getDb().prepare(`
            INSERT INTO app_permissions (
                user_id,
                can_access_dashboard, can_access_rds_sessions, can_access_servers,
                can_access_users, can_access_ad_groups, can_access_loans, can_access_docucortex,
                can_manage_users, can_manage_permissions, can_view_reports
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            userId,
            defaultPerms.can_access_dashboard,
            defaultPerms.can_access_rds_sessions,
            defaultPerms.can_access_servers,
            defaultPerms.can_access_users,
            defaultPerms.can_access_ad_groups,
            defaultPerms.can_access_loans,
            defaultPerms.can_access_docucortex,
            defaultPerms.can_manage_users,
            defaultPerms.can_manage_permissions,
            defaultPerms.can_view_reports
        );
    }

    /**
     * Obtenir tous les utilisateurs avec leurs permissions
     */
    getAllUsers() {
        this.initialize();

        const users = this.getDb().prepare(`
            SELECT
                u.*,
                p.can_access_dashboard,
                p.can_access_rds_sessions,
                p.can_access_servers,
                p.can_access_users,
                p.can_access_ad_groups,
                p.can_access_loans,
                p.can_access_docucortex,
                p.can_manage_users,
                p.can_manage_permissions,
                p.can_view_reports
            FROM app_users u
            LEFT JOIN app_permissions p ON u.id = p.user_id
            WHERE u.is_active = 1
            ORDER BY u.is_admin DESC, u.display_name ASC
        `).all();

        // Supprimer les hash de mots de passe pour la sécurité
        return users.map(user => {
            const { password_hash, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
    }

    /**
     * Obtenir un utilisateur par ID
     */
    getUserById(userId) {
        this.initialize();

        const user = this.getDb().prepare(`
            SELECT
                u.*,
                p.can_access_dashboard,
                p.can_access_rds_sessions,
                p.can_access_servers,
                p.can_access_users,
                p.can_access_ad_groups,
                p.can_access_loans,
                p.can_access_docucortex,
                p.can_manage_users,
                p.can_manage_permissions,
                p.can_view_reports
            FROM app_users u
            LEFT JOIN app_permissions p ON u.id = p.user_id
            WHERE u.id = ?
        `).get(userId);

        if (!user) return null;

        const { password_hash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    /**
     * Obtenir un utilisateur par username
     */
    getUserByUsername(username) {
        this.initialize();

        return this.getDb().prepare(`
            SELECT
                u.*,
                p.can_access_dashboard,
                p.can_access_rds_sessions,
                p.can_access_servers,
                p.can_access_users,
                p.can_access_ad_groups,
                p.can_access_loans,
                p.can_access_docucortex,
                p.can_manage_users,
                p.can_manage_permissions,
                p.can_view_reports
            FROM app_users u
            LEFT JOIN app_permissions p ON u.id = p.user_id
            WHERE u.username = ? AND u.is_active = 1
        `).get(username);
    }

    /**
     * Mettre à jour un utilisateur
     */
    async updateUser(userId, data) {
        this.initialize();

        const fields = [];
        const values = [];

        // Note: email supprimé car la colonne n'existe pas dans la table
        if (data.display_name !== undefined) {
            fields.push('display_name = ?');
            values.push(data.display_name);
        }
        if (data.position !== undefined) {
            fields.push('position = ?');
            values.push(data.position);
        }
        if (data.is_admin !== undefined) {
            fields.push('is_admin = ?');
            values.push(data.is_admin ? 1 : 0);
        }
        if (data.is_active !== undefined) {
            fields.push('is_active = ?');
            values.push(data.is_active ? 1 : 0);
        }

        if (fields.length === 0) return false;

        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(userId);

        const sql = `UPDATE app_users SET ${fields.join(', ')} WHERE id = ?`;
        const result = this.getDb().prepare(sql).run(values);

        return result.changes > 0;
    }

    /**
     * Changer le mot de passe d'un utilisateur
     */
    async changePassword(userId, newPassword, resetMustChange = false) {
        this.initialize();

        const passwordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

        const result = this.getDb().prepare(`
            UPDATE app_users
            SET password_hash = ?,
                must_change_password = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(passwordHash, resetMustChange ? 0 : 1, userId);

        return result.changes > 0;
    }

    /**
     * Vérifier le mot de passe d'un utilisateur
     */
    async verifyPassword(username, password) {
        this.initialize();

        const user = this.getDb().prepare(
            'SELECT * FROM app_users WHERE username = ? AND is_active = 1'
        ).get(username);

        if (!user) return null;

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) return null;

        // Mettre à jour last_login
        this.getDb().prepare(
            'UPDATE app_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?'
        ).run(user.id);

        // Retourner l'utilisateur avec ses permissions
        return this.getUserById(user.id);
    }

    /**
     * Supprimer un utilisateur
     */
    deleteUser(userId) {
        this.initialize();

        // Les permissions seront supprimées automatiquement (CASCADE)
        const result = this.getDb().prepare('DELETE FROM app_users WHERE id = ? AND id != 1').run(userId);
        return result.changes > 0;
    }

    // ==================== PERMISSIONS ====================

    /**
     * Mettre à jour les permissions d'un utilisateur
     */
    updatePermissions(userId, permissions) {
        this.initialize();

        const fields = [];
        const values = [];

        const permissionFields = [
            'can_access_dashboard',
            'can_access_rds_sessions',
            'can_access_servers',
            'can_access_users',
            'can_access_ad_groups',
            'can_access_loans',
            'can_access_docucortex',
            'can_manage_users',
            'can_manage_permissions',
            'can_view_reports'
        ];

        permissionFields.forEach(field => {
            if (permissions[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(permissions[field] ? 1 : 0);
            }
        });

        if (fields.length === 0) return false;

        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(userId);

        const sql = `UPDATE app_permissions SET ${fields.join(', ')} WHERE user_id = ?`;
        const result = this.getDb().prepare(sql).run(values);

        return result.changes > 0;
    }

    /**
     * Obtenir les permissions d'un utilisateur
     */
    getUserPermissions(userId) {
        this.initialize();

        return this.getDb().prepare(
            'SELECT * FROM app_permissions WHERE user_id = ?'
        ).get(userId);
    }

    /**
     * Vérifier si un utilisateur a accès à un onglet
     */
    hasAccessToTab(userId, tabName) {
        this.initialize();

        const user = this.getUserById(userId);
        if (!user) return false;

        // Les admins ont accès à tout
        if (user.is_admin) return true;

        const tabPermissionMap = {
            'dashboard': 'can_access_dashboard',
            'rds_sessions': 'can_access_rds_sessions',
            'servers': 'can_access_servers',
            'users': 'can_access_users',
            'ad_groups': 'can_access_ad_groups',
            'loans': 'can_access_loans',
            'docucortex': 'can_access_docucortex'
        };

        const permissionField = tabPermissionMap[tabName];
        if (!permissionField) return false;

        return user[permissionField] === 1;
    }

    // ==================== HISTORIQUE CONNEXIONS ====================

    /**
     * Enregistrer une tentative de connexion
     */
    logLogin(userId, ipAddress, userAgent, success, failureReason = null) {
        this.initialize();

        const stmt = this.getDb().prepare(`
            INSERT INTO app_login_history (user_id, ip_address, user_agent, success, failure_reason)
            VALUES (?, ?, ?, ?, ?)
        `);

        stmt.run(userId, ipAddress, userAgent, success ? 1 : 0, failureReason);
    }

    /**
     * Obtenir l'historique des connexions d'un utilisateur
     */
    getLoginHistory(userId, limit = 50) {
        this.initialize();

        return this.getDb().prepare(`
            SELECT * FROM app_login_history
            WHERE user_id = ?
            ORDER BY login_timestamp DESC
            LIMIT ?
        `).all(userId, limit);
    }

    /**
     * Obtenir les statistiques de connexion
     */
    getLoginStats() {
        this.initialize();

        const db = this.getDb();
        return {
            totalLogins: db.prepare('SELECT COUNT(*) as count FROM app_login_history').get()?.count || 0,
            successfulLogins: db.prepare('SELECT COUNT(*) as count FROM app_login_history WHERE success = 1').get()?.count || 0,
            failedLogins: db.prepare('SELECT COUNT(*) as count FROM app_login_history WHERE success = 0').get()?.count || 0,
            uniqueUsers: db.prepare('SELECT COUNT(DISTINCT user_id) as count FROM app_login_history').get()?.count || 0
        };
    }
}

module.exports = new UserPermissionsService();
