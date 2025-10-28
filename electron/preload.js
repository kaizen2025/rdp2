// electron/preload.js - Script de préchargement sécurisé

const { contextBridge, ipcRenderer } = require('electron');

// Exposer des APIs sécurisées au renderer
contextBridge.exposeInMainWorld('electronAPI', {
    // Vérifier les mises à jour
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),

    // Obtenir la version de l'application
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),

    // Listener pour les événements de mise à jour
    onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback)
});
