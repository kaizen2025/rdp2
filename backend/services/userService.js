// backend/services/userService.js - SERVICE DE GESTION DES UTILISATEURS RDS (SQLITE ONLY)

const db = require('./databaseService');

/**
 * Récupère tous les utilisateurs depuis la base SQLite
 * @returns {Promise<Array>} Liste des utilisateurs
 */
async function getUsers() {
    try {
        const rows = db.all('SELECT * FROM users ORDER BY displayName ASC');
        return { success: true, users: rows, total: rows.length };
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des utilisateurs:', error);
        return { success: false, error: error.message, users: [] };
    }
}

/**
 * Récupère un utilisateur par son username
 * @param {string} username Nom d'utilisateur
 * @returns {Promise<Object|null>} Utilisateur ou null
 */
async function getUserByUsername(username) {
    try {
        const user = db.get('SELECT * FROM users WHERE username = ?', [username]);
        return user || null;
    } catch (error) {
        console.error(`❌ Erreur lors de la récupération de l'utilisateur ${username}:`, error);
        return null;
    }
}

/**
 * Récupère les utilisateurs par serveur (groupés)
 * @returns {Promise<Object>} Utilisateurs groupés par serveur
 */
async function getUsersByServer() {
    try {
        const rows = db.all('SELECT * FROM users ORDER BY server, displayName ASC');

        // Grouper par serveur
        const grouped = rows.reduce((acc, user) => {
            const server = user.server || 'default';
            if (!acc[server]) acc[server] = [];
            acc[server].push(user);
            return acc;
        }, {});

        return { success: true, users: grouped };
    } catch (error) {
        console.error('❌ Erreur lors du groupement des utilisateurs:', error);
        return { success: false, error: error.message, users: {} };
    }
}

/**
 * Sauvegarde ou met à jour un utilisateur dans SQLite
 * @param {Object} userData Données de l'utilisateur
 * @param {Object} technician Technicien effectuant l'opération
 * @returns {Promise<Object>} Résultat de l'opération
 */
async function saveUser(userData, technician) {
    const now = new Date().toISOString();
    const existingUser = await getUserByUsername(userData.username);
    const isUpdate = !!existingUser;

    try {
        const id = existingUser?.id || `user_${Date.now()}`;

        if (isUpdate) {
            db.run(`
                UPDATE users SET
                    displayName = ?, email = ?, department = ?, server = ?,
                    password = ?, officePassword = ?, notes = ?,
                    lastModified = ?, modifiedBy = ?
                WHERE username = ?
            `, [
                userData.displayName, userData.email || '', userData.department || '', userData.server || '',
                userData.password || '', userData.officePassword || '', userData.notes || '',
                now, technician?.name || 'system', userData.username
            ]);
        } else {
            db.run(`
                INSERT INTO users (
                    id, username, displayName, email, department, server,
                    password, officePassword, notes, createdAt, createdBy,
                    lastModified, modifiedBy
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                id, userData.username, userData.displayName, userData.email || '', userData.department || '',
                userData.server || '', userData.password || '', userData.officePassword || '',
                userData.notes || '', now, technician?.name || 'system', now, technician?.name || 'system'
            ]);
        }

        console.log(`✅ Utilisateur ${userData.username} ${isUpdate ? 'mis à jour' : 'créé'} dans SQLite`);
        return { success: true };

    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde de l\'utilisateur:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Supprime un utilisateur de SQLite
 * @param {string} username Nom d'utilisateur à supprimer
 * @param {Object} technician Technicien effectuant l'opération
 * @returns {Promise<Object>} Résultat de l'opération
 */
async function deleteUser(username, technician) {
    try {
        db.run('DELETE FROM users WHERE username = ?', [username]);
        console.log(`✅ Utilisateur ${username} supprimé de SQLite`);
        return { success: true };
    } catch (error) {
        console.error('❌ Erreur lors de la suppression de l\'utilisateur:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Récupère les statistiques des utilisateurs
 * @returns {Promise<Object>} Statistiques
 */
async function getUserStats() {
    try {
        const total = db.get('SELECT COUNT(*) as count FROM users')?.count || 0;
        const byServer = db.all('SELECT server, COUNT(*) as count FROM users GROUP BY server');
        const byDepartment = db.all('SELECT department, COUNT(*) as count FROM users WHERE department IS NOT NULL AND department != "" GROUP BY department');
        const withOfficePassword = db.get('SELECT COUNT(*) as count FROM users WHERE officePassword IS NOT NULL AND officePassword != ""')?.count || 0;

        return {
            success: true,
            stats: { total, byServer, byDepartment, withOfficePassword, withoutOfficePassword: total - withOfficePassword }
        };
    } catch (error) {
        console.error('❌ Erreur lors du calcul des statistiques:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    getUsers,
    getUserByUsername,
    getUsersByServer,
    saveUser,
    deleteUser,
    getUserStats
};