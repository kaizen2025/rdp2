// electron/preload.js - VERSION AMÉLIORÉE

const { contextBridge, ipcRenderer } = require('electron');

// Exposer des APIs sécurisées au renderer
contextBridge.exposeInMainWorld('electronAPI', {
    // Obtenir la version de l'application
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),

    // Vérifier les mises à jour
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),

    // Listener pour les événements de mise à jour
    onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (event, ...args) => callback(...args)),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (event, ...args) => callback(...args)),

    // ✅ NOUVELLES FONCTIONS SPÉCIFIQUES
    launchShadow: (params) => ipcRenderer.invoke('launch-shadow', params),
    launchRdpConnect: (params) => ipcRenderer.invoke('launch-rdp-connect', params),

    // Lance le client Bureau à Distance natif (mstsc.exe)
    launchRdp: (params) => ipcRenderer.invoke('launch-rdp', params),

    // Fonctions diverses (si vous en avez d'autres)
    pingServer: (server) => ipcRenderer.invoke('ping-server', server),
    quickConnect: (server) => ipcRenderer.invoke('quick-connect', server),
    connectWithStoredCredentials: (credentials) => ipcRenderer.invoke('connect-with-credentials', credentials),

    // Permet à React d'écouter les messages de log du processus principal
    onLogMessage: (callback) => ipcRenderer.on('log-message', (event, message) => callback(message)),
});