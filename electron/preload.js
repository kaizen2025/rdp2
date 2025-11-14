// electron/preload.js - Script de préchargement sécurisé

const { contextBridge, ipcRenderer } = require('electron');

// Exposer des APIs sécurisées au renderer
contextBridge.exposeInMainWorld('electronAPI', {
    // ========================================
    // ACTIVE DIRECTORY - GESTION DES GROUPES
    // ========================================

    /**
     * Récupère la liste des membres d'un groupe AD
     * @param {string} groupName - Nom du groupe (VPN, Sortants_responsables, etc.)
     * @returns {Promise<{success: boolean, members: Array, count: number}>}
     */
    getAdGroupMembers: (groupName) => ipcRenderer.invoke('ad:getGroupMembers', groupName),

    /**
     * Ajoute un utilisateur à un groupe AD
     * @param {Object} params - { username, groupName }
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    addUserToGroup: (params) => ipcRenderer.invoke('ad:addUserToGroup', params),

    /**
     * Retire un utilisateur d'un groupe AD
     * @param {Object} params - { username, groupName }
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    removeUserFromGroup: (params) => ipcRenderer.invoke('ad:removeUserFromGroup', params),

    /**
     * Recherche des utilisateurs dans AD
     * @param {string} searchTerm - Terme de recherche (min 2 caractères)
     * @returns {Promise<{success: boolean, users: Array, count: number}>}
     */
    searchAdUsers: (searchTerm) => ipcRenderer.invoke('ad:searchUsers', searchTerm),

    /**
     * Obtient les détails d'un utilisateur AD
     * @param {string} username - SamAccountName de l'utilisateur
     * @returns {Promise<{success: boolean, user: Object}>}
     */
    getAdUserDetails: (username) => ipcRenderer.invoke('ad:getUserDetails', username),

    /**
     * Recherche des groupes dans AD
     * @param {string} searchTerm - Terme de recherche (min 2 caractères)
     * @returns {Promise<{success: boolean, groups: Array, count: number}>}
     */
    searchAdGroups: (searchTerm) => ipcRenderer.invoke('ad:searchGroups', searchTerm),

    // ========================================
    // MISES À JOUR
    // ========================================

    // Vérifier les mises à jour
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),

    // Obtenir la version de l'application
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),

    // Listener pour les événements de mise à jour
    onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (event, ...args) => callback(...args)),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (event, ...args) => callback(...args)),

    // ========================================
    // BUREAU À DISTANCE (RDP)
    // ========================================

    // Lance le client Bureau à Distance natif (mstsc.exe)
    launchRdp: (params) => ipcRenderer.invoke('launch-rdp', params),

    // ========================================
    // UTILITAIRES RÉSEAU
    // ========================================

    // Fonctions diverses (si vous en avez d'autres)
    pingServer: (server) => ipcRenderer.invoke('ping-server', server),
    quickConnect: (server) => ipcRenderer.invoke('quick-connect', server),
    connectWithStoredCredentials: (credentials) => ipcRenderer.invoke('connect-with-credentials', credentials),

    // Permet à React d'écouter les messages de log du processus principal
    onLogMessage: (callback) => ipcRenderer.on('log-message', (event, message) => callback(message)),

    // ========================================
    // INTERACTION AVEC LE SYSTÈME DE FICHIERS
    // ========================================
    openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
    openFolder: (filePath) => ipcRenderer.invoke('open-folder', filePath),
});