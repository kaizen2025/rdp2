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
     * Obtenir la connexion à la base de données
     * Utilise le chemin configuré dans config.json (base de PRODUCTION)
     */
    getDb() {
        if (!this.db) {
            // Utiliser le chemin de config.json (base de PRODUCTION)
            let dbPath;

            if (configService.appConfig && configService.appConfig.databasePath) {
                dbPath = configService.appConfig.databasePath;
                console.log(`[UserPermissions] Utilisation base PRODUCTION: ${dbPath}`);
            } else {
                // Fallback sur base locale si config non chargée
                dbPath = path.join(__dirname, '../../data/rds_viewer_data.sqlite');
                console.warn(`[UserPermissions] ⚠️  Config non chargée, utilisation base locale: ${dbPath}`);
            }

            const dbDir = path.dirname(dbPath);

            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            this.db = new Database(dbPath);
            this.db.pragma('journal_mode = WAL');
        }
        return this.db;
    }

    /**
     * Initialise les tables utilisateurs et permissions
     */
    initialize() {
        if (this.initialized) return;

        try {
            const schemaPath = path.join(__dirname, '../schemas/users_permissions_schema.sql');
            const schema = fs.readFileSync(schemaPath, 'utf-8');

            // Exécuter le schéma
            const db = this.getDb();
            db.exec(schema);

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
                username, email, display_name, position,
                password_hash, is_admin, must_change_password
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            data.username,
            data.email,
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

        if (data.email !== undefined) {
            fields.push('email = ?');
            values.push(data.email);
        }
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
