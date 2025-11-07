/**
 * Bridge Electron pour Active Directory
 * Expose les fonctions AD au frontend via IPC
 */

const { ipcMain } = require('electron');
const path = require('path');

// Charger le service AD depuis le backend
const adService = require(path.join(__dirname, '../backend/services/adService'));

/**
 * Initialise tous les handlers IPC pour Active Directory
 */
function initializeAdBridge() {
    console.log('🔌 Initialisation du bridge AD Electron...');

    // ========================================
    // 1. RÉCUPÉRER LES MEMBRES D'UN GROUPE
    // ========================================
    ipcMain.handle('ad:getGroupMembers', async (event, groupName) => {
        console.log(`[AD Bridge] Récupération membres du groupe: ${groupName}`);

        try {
            // Validation
            if (!groupName || typeof groupName !== 'string') {
                throw new Error('Nom de groupe invalide');
            }

            // Appel au service AD
            const members = await adService.getAdGroupMembers(groupName);

            console.log(`[AD Bridge] ✅ ${members.length} membres récupérés pour ${groupName}`);

            return {
                success: true,
                members: members,
                count: members.length
            };

        } catch (error) {
            console.error(`[AD Bridge] ❌ Erreur récupération groupe ${groupName}:`, error.message);
            return {
                success: false,
                error: error.message,
                members: []
            };
        }
    });

    // ========================================
    // 2. AJOUTER UN UTILISATEUR À UN GROUPE
    // ========================================
    ipcMain.handle('ad:addUserToGroup', async (event, { username, groupName }) => {
        console.log(`[AD Bridge] Ajout de ${username} au groupe ${groupName}`);

        try {
            // Validation
            if (!username || !groupName) {
                throw new Error('Username et groupName requis');
            }

            // Appel au service AD
            const result = await adService.addUserToGroup(username, groupName);

            if (result.success) {
                console.log(`[AD Bridge] ✅ ${username} ajouté à ${groupName}`);
            } else {
                console.warn(`[AD Bridge] ⚠️ Échec ajout: ${result.error}`);
            }

            return result;

        } catch (error) {
            console.error(`[AD Bridge] ❌ Erreur ajout utilisateur:`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    });

    // ========================================
    // 3. RETIRER UN UTILISATEUR D'UN GROUPE
    // ========================================
    ipcMain.handle('ad:removeUserFromGroup', async (event, { username, groupName }) => {
        console.log(`[AD Bridge] Retrait de ${username} du groupe ${groupName}`);

        try {
            // Validation
            if (!username || !groupName) {
                throw new Error('Username et groupName requis');
            }

            // Appel au service AD
            const result = await adService.removeUserFromGroup(username, groupName);

            if (result.success) {
                console.log(`[AD Bridge] ✅ ${username} retiré de ${groupName}`);
            } else {
                console.warn(`[AD Bridge] ⚠️ Échec retrait: ${result.error}`);
            }

            return result;

        } catch (error) {
            console.error(`[AD Bridge] ❌ Erreur retrait utilisateur:`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    });

    // ========================================
    // 4. RECHERCHER DES UTILISATEURS
    // ========================================
    ipcMain.handle('ad:searchUsers', async (event, searchTerm) => {
        console.log(`[AD Bridge] Recherche utilisateurs: "${searchTerm}"`);

        try {
            // Validation
            if (!searchTerm || searchTerm.length < 2) {
                return {
                    success: true,
                    users: [],
                    message: 'Tapez au moins 2 caractères'
                };
            }

            // Appel au service AD
            const users = await adService.searchAdUsers(searchTerm);

            console.log(`[AD Bridge] ✅ ${users.length} utilisateur(s) trouvé(s)`);

            return {
                success: true,
                users: users,
                count: users.length
            };

        } catch (error) {
            console.error(`[AD Bridge] ❌ Erreur recherche utilisateurs:`, error.message);
            return {
                success: false,
                error: error.message,
                users: []
            };
        }
    });

    // ========================================
    // 5. OBTENIR LES DÉTAILS D'UN UTILISATEUR
    // ========================================
    ipcMain.handle('ad:getUserDetails', async (event, username) => {
        console.log(`[AD Bridge] Détails utilisateur: ${username}`);

        try {
            if (!username) {
                throw new Error('Username requis');
            }

            const details = await adService.getAdUserDetails(username);

            return {
                success: true,
                user: details
            };

        } catch (error) {
            console.error(`[AD Bridge] ❌ Erreur détails utilisateur:`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    });

    // ========================================
    // 6. RECHERCHER DES GROUPES
    // ========================================
    ipcMain.handle('ad:searchGroups', async (event, searchTerm) => {
        console.log(`[AD Bridge] Recherche groupes: "${searchTerm}"`);

        try {
            if (!searchTerm || searchTerm.length < 2) {
                return {
                    success: true,
                    groups: [],
                    message: 'Tapez au moins 2 caractères'
                };
            }

            const groups = await adService.searchAdGroups(searchTerm);

            console.log(`[AD Bridge] ✅ ${groups.length} groupe(s) trouvé(s)`);

            return {
                success: true,
                groups: groups,
                count: groups.length
            };

        } catch (error) {
            console.error(`[AD Bridge] ❌ Erreur recherche groupes:`, error.message);
            return {
                success: false,
                error: error.message,
                groups: []
            };
        }
    });

    console.log('✅ Bridge AD Electron initialisé (6 handlers)');
}

/**
 * Nettoie les handlers IPC lors de la fermeture de l'app
 */
function cleanupAdBridge() {
    console.log('🧹 Nettoyage des handlers AD...');

    ipcMain.removeHandler('ad:getGroupMembers');
    ipcMain.removeHandler('ad:addUserToGroup');
    ipcMain.removeHandler('ad:removeUserFromGroup');
    ipcMain.removeHandler('ad:searchUsers');
    ipcMain.removeHandler('ad:getUserDetails');
    ipcMain.removeHandler('ad:searchGroups');

    console.log('✅ Handlers AD nettoyés');
}

module.exports = {
    initializeAdBridge,
    cleanupAdBridge
};
