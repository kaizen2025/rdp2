// backend/services/userService.js - SERVICE DE GESTION DES UTILISATEURS RDS (SQLITE ONLY)

const db = require('./databaseService');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

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

/**
 * Synchronise les utilisateurs depuis le fichier Excel
 * @param {boolean} force Force la synchronisation même si le fichier n'a pas changé
 * @returns {Promise<Object>} Résultat de la synchronisation
 */
async function syncUsersFromExcel(force = false) {
    try {
        // Chercher le fichier Excel à la racine du projet
        // On remonte de deux niveaux car on est dans backend/services/
        const excelPath = path.resolve(__dirname, '../../Data_utilisateur_partage.xlsx');

        if (!fs.existsSync(excelPath)) {
            console.log(`⚠️ Fichier Excel non trouvé à ${excelPath}, synchronisation ignorée.`);
            return { success: false, error: 'Fichier Excel introuvable' };
        }

        const stats = fs.statSync(excelPath);
        const lastModified = stats.mtime.toISOString();

        // Vérifier si une synchro est nécessaire (via un flag stocké en DB ou juste faire à chaque fois si force=true)
        // Pour l'instant on lit toujours si le fichier existe.

        console.log(`📊 Lecture du fichier Excel: ${excelPath}`);
        const workbook = xlsx.readFile(excelPath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convertir en JSON
        const rows = xlsx.utils.sheet_to_json(sheet);

        if (!rows || rows.length === 0) {
            return { success: false, error: 'Fichier Excel vide ou format invalide' };
        }

        console.log(`📊 ${rows.length} lignes trouvées dans le fichier Excel.`);

        let updatedCount = 0;
        let createdCount = 0;
        const now = new Date().toISOString();

        // Transaction pour la rapidité
        const transaction = db.transaction(() => {
            rows.forEach(row => {
                // Mapping intelligent des colonnes
                // On cherche des noms de colonnes probables
                const username = row['Identifiant'] || row['Login'] || row['User'] || row['Username'] || row['Utilisateur'];
                const displayName = row['Nom complet'] || row['Nom Prénom'] || row['Display Name'] || row['Nom'];
                const email = row['Email'] || row['Courriel'] || row['Mail'] || row['Adresse Mail'];
                const department = row['Service'] || row['Département'] || row['Department'] || row['Bureau'];
                const server = row['Serveur'] || row['Server'] || row['RDS'];
                const password = row['Mot de passe'] || row['Password'] || row['Mdp'];
                const officePassword = row['Mot de passe Office'] || row['Office Password'] || row['Mdp Office'];
                const notes = row['Notes'] || row['Commentaire'] || '';

                if (!username || !displayName) {
                    // Ignorer les lignes sans username ou nom
                    return;
                }

                const existing = db.get('SELECT id FROM users WHERE username = ?', [username]);

                if (existing) {
                    db.run(`UPDATE users SET
                        displayName = ?, email = ?, department = ?, server = ?,
                        password = ?, officePassword = ?, notes = ?,
                        lastModified = ?, modifiedBy = ?, lastSyncFromExcel = ?
                        WHERE username = ?`,
                        [displayName, email || '', department || '', server || '',
                        password || '', officePassword || '', notes,
                        now, 'system_excel_sync', now, username]
                    );
                    updatedCount++;
                } else {
                    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                    db.run(`INSERT INTO users (
                        id, username, displayName, email, department, server,
                        password, officePassword, notes, createdAt, createdBy,
                        lastModified, modifiedBy, lastSyncFromExcel
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [id, username, displayName, email || '', department || '', server || '',
                        password || '', officePassword || '', notes, now, 'system_excel_sync',
                        now, 'system_excel_sync', now]
                    );
                    createdCount++;
                }
            });
        });

        transaction();

        console.log(`✅ Synchronisation Excel terminée: ${createdCount} créés, ${updatedCount} mis à jour.`);
        return { success: true, usersCount: rows.length, created: createdCount, updated: updatedCount };

    } catch (error) {
        console.error('❌ Erreur lors de la synchronisation Excel:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    getUsers,
    getUserByUsername,
    getUsersByServer,
    saveUser,
    deleteUser,
    getUserStats,
    syncUsersFromExcel
};
