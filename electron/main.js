// electron/main.js - Application Electron avec auto-update

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

// Configuration des logs
log.transports.file.level = 'info';
autoUpdater.logger = log;

// Variables globales
let mainWindow;
let serverProcess;

// Importer et démarrer le serveur Node.js
function startServer() {
    const serverPath = path.join(__dirname, '..', 'server', 'server.js');
    log.info(`Démarrage du serveur depuis: ${serverPath}`);

    try {
        // Charger et démarrer le serveur
        require(serverPath);
        log.info('✅ Serveur démarré avec succès');
    } catch (error) {
        log.error('❌ Erreur lors du démarrage du serveur:', error);
        dialog.showErrorBox('Erreur serveur', `Impossible de démarrer le serveur: ${error.message}`);
    }
}

// Créer la fenêtre principale
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 700,
        title: 'RDS Viewer Anecoop',
        icon: path.join(__dirname, '..', 'assets', 'icon.ico'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js')
        },
        autoHideMenuBar: true,
        frame: true,
        show: false
    });

    // Charger l'application React buildée
    const indexPath = path.join(__dirname, '..', 'build', 'index.html');
    mainWindow.loadFile(indexPath);

    // Afficher la fenêtre quand elle est prête
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();

        // Vérifier les mises à jour après 5 secondes
        setTimeout(() => {
            checkForUpdates();
        }, 5000);
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Ouvrir les liens externes dans le navigateur par défaut
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        require('electron').shell.openExternal(url);
        return { action: 'deny' };
    });
}

// Configuration de l'auto-updater
function setupAutoUpdater() {
    autoUpdater.autoDownload = false; // Ne pas télécharger automatiquement
    autoUpdater.autoInstallOnAppQuit = true; // Installer à la fermeture de l'app

    // Événement: Vérification des mises à jour
    autoUpdater.on('checking-for-update', () => {
        log.info('🔍 Vérification des mises à jour...');
    });

    // Événement: Mise à jour disponible
    autoUpdater.on('update-available', (info) => {
        log.info('✅ Mise à jour disponible:', info.version);

        const response = dialog.showMessageBoxSync(mainWindow, {
            type: 'info',
            title: 'Mise à jour disponible',
            message: `Une nouvelle version (${info.version}) est disponible !`,
            detail: 'Voulez-vous télécharger et installer la mise à jour maintenant ?',
            buttons: ['Oui, mettre à jour', 'Plus tard'],
            defaultId: 0,
            cancelId: 1
        });

        if (response === 0) {
            autoUpdater.downloadUpdate();
        }
    });

    // Événement: Aucune mise à jour disponible
    autoUpdater.on('update-not-available', (info) => {
        log.info('ℹ️ Aucune mise à jour disponible');
    });

    // Événement: Erreur lors de la vérification
    autoUpdater.on('error', (err) => {
        log.error('❌ Erreur lors de la vérification des mises à jour:', err);
    });

    // Événement: Téléchargement en cours
    autoUpdater.on('download-progress', (progressObj) => {
        let logMessage = `📥 Téléchargement: ${progressObj.percent.toFixed(2)}%`;
        log.info(logMessage);

        if (mainWindow) {
            mainWindow.setProgressBar(progressObj.percent / 100);
        }
    });

    // Événement: Téléchargement terminé
    autoUpdater.on('update-downloaded', (info) => {
        log.info('✅ Mise à jour téléchargée');

        if (mainWindow) {
            mainWindow.setProgressBar(-1); // Enlever la barre de progression
        }

        const response = dialog.showMessageBoxSync(mainWindow, {
            type: 'info',
            title: 'Mise à jour prête',
            message: 'La mise à jour a été téléchargée avec succès !',
            detail: 'L\'application va redémarrer pour installer la mise à jour.',
            buttons: ['Redémarrer maintenant', 'Redémarrer plus tard'],
            defaultId: 0,
            cancelId: 1
        });

        if (response === 0) {
            autoUpdater.quitAndInstall(false, true);
        }
    });
}

// Vérifier les mises à jour
function checkForUpdates() {
    autoUpdater.checkForUpdates()
        .catch(err => {
            log.error('Erreur lors de la vérification des mises à jour:', err);
        });
}

// IPC Handlers
ipcMain.handle('check-for-updates', async () => {
    checkForUpdates();
    return 'Vérification des mises à jour lancée';
});

ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});

// Cycle de vie de l'application
app.whenReady().then(() => {
    // Démarrer le serveur Node.js
    startServer();

    // Configurer l'auto-updater
    setupAutoUpdater();

    // Créer la fenêtre
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    log.info('🛑 Arrêt de l\'application');
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
    log.error('❌ Erreur non capturée:', error);
});
