// electron/main.js - Application Electron avec auto-update, RDP natif et URL de mise à jour configurable

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const { exec } = require('child_process');
const fs = require('fs');
const isDev = require('electron-is-dev');

// Configuration des logs
log.transports.file.level = 'info';
log.transports.console.level = 'info';
autoUpdater.logger = log;

log.info('[Main] ===================================================');
log.info('[Main] 🚀 Démarrage de l\'application Electron...');
log.info(`[Main] Mode de développement (isDev): ${isDev}`);
log.info(`[Main] Version de l'application: ${app.getVersion()}`);
log.info(`[Main] Chemin de l'application: ${app.getAppPath()}`);
log.info('[Main] ===================================================');

let mainWindow;

// --- Démarrage du serveur backend (uniquement en production) ---
function startServer() {
    if (!isDev) {
        log.info('[Main] Environnement de production détecté. Démarrage du serveur Node.js interne...');
        const serverPath = path.join(__dirname, '..', 'server', 'server.js');
        log.info(`[Main] Chemin du serveur: ${serverPath}`);
        try {
            require(serverPath);
            log.info('[Main] ✅ Serveur Node.js démarré avec succès.');
        } catch (error) {
            log.error('[Main] ❌ Erreur critique lors du démarrage du serveur:', error);
            dialog.showErrorBox('Erreur Serveur Interne', `Impossible de démarrer le serveur local: ${error.message}`);
            app.quit();
        }
    } else {
        log.info('[Main] Mode développement. Le serveur backend est géré par un processus externe.');
    }
}

// --- Création de la fenêtre principale ---
function createWindow() {
    log.info('[Main] 🎬 Création de la fenêtre principale...');
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
        show: false // La fenêtre est masquée jusqu'à ce que le contenu soit prêt
    });

    const devUrl = 'http://localhost:3000';
    const prodPath = path.join(__dirname, '..', 'build', 'index.html');

    if (isDev) {
        log.info(`[Main] Chargement de l'URL de développement: ${devUrl}`);
        mainWindow.loadURL(devUrl).catch(err => {
            log.error(`[Main] ❌ Impossible de charger l'URL de développement: ${err.message}`);
            dialog.showErrorBox('Erreur de chargement', `Impossible de se connecter au serveur de développement React. Veuillez vérifier qu'il est bien démarré.\n\nErreur: ${err.message}`);
        });
        // Ouvrir les outils de développement en mode dev
        mainWindow.webContents.openDevTools();
    } else {
        log.info(`[Main] Chargement du fichier de production: ${prodPath}`);
        mainWindow.loadFile(prodPath).catch(err => {
            log.error(`[Main] ❌ Impossible de charger le fichier de production: ${err.message}`);
        });
    }

    mainWindow.once('ready-to-show', () => {
        log.info('[Main] ✅ Fenêtre prête à être affichée.');
        mainWindow.show();
        if (!isDev) {
            log.info('[Main] Lancement de la première vérification de mise à jour...');
            setTimeout(() => checkForUpdates(false), 5000);
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        require('electron').shell.openExternal(url);
        return { action: 'deny' };
    });
}

// Configuration de l'auto-updater
function setupAutoUpdater() {
    try {
        const configPath = path.join(app.getAppPath(), 'config', 'config.json');
        const configData = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configData);
        
        if (config.updateUrl) {
            log.info(`[Updater] URL de mise à jour personnalisée trouvée: ${config.updateUrl}`);
            autoUpdater.setFeedURL(config.updateUrl);
        } else {
            log.warn('[Updater] Aucune URL de mise à jour personnalisée trouvée. Utilisation de la configuration par défaut.');
        }
    } catch (error) {
        log.error('[Updater] Erreur lors de la lecture de config.json pour l\'URL de mise à jour. Utilisation de la configuration par défaut.', error);
    }

    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('checking-for-update', () => log.info('[Updater] 🔍 Vérification des mises à jour...'));

    autoUpdater.on('update-available', (info) => {
        log.info(`[Updater] ✅ Mise à jour disponible: ${info.version}`);
        dialog.showMessageBox(mainWindow, {
            type: 'info', title: 'Mise à jour disponible',
            message: `Une nouvelle version (${info.version}) est disponible.`,
            detail: 'Voulez-vous la télécharger maintenant ? Le téléchargement se fera en arrière-plan.',
            buttons: ['Oui', 'Plus tard'], defaultId: 0, cancelId: 1
        }).then(({ response }) => {
            if (response === 0) {
                autoUpdater.downloadUpdate();
            }
        });
    });

    autoUpdater.on('update-not-available', (info) => {
        log.info('[Updater] ℹ️ Aucune mise à jour disponible.');
    });

    autoUpdater.on('error', (err) => log.error(`[Updater] ❌ Erreur: ${err.message}`));

    autoUpdater.on('download-progress', (p) => {
        log.info(`[Updater] 📥 Téléchargement: ${p.percent.toFixed(2)}%`);
        if (mainWindow) mainWindow.setProgressBar(p.percent / 100);
    });

    autoUpdater.on('update-downloaded', (info) => {
        log.info('[Updater] ✅ Mise à jour téléchargée. Prête à être installée.');
        if (mainWindow) mainWindow.setProgressBar(-1);
        dialog.showMessageBox(mainWindow, {
            type: 'info', title: 'Mise à jour prête',
            message: 'La mise à jour a été téléchargée.',
            detail: 'L\'application va maintenant redémarrer pour installer la nouvelle version.',
            buttons: ['Redémarrer et Mettre à Jour'], defaultId: 0
        }).then(() => {
            autoUpdater.quitAndInstall(true, true);
        });
    });
}

function checkForUpdates(isManual) {
    autoUpdater.checkForUpdates().catch(err => {
        log.error('[Updater] Échec de la vérification des mises à jour :', err);
        if (isManual) {
            dialog.showErrorBox('Erreur de mise à jour', `Impossible de vérifier les mises à jour : ${err.message}`);
        }
    });
}

// --- IPC Handlers ---
function setupIpcHandlers() {
    ipcMain.handle('get-app-version', () => app.getVersion());
    
    ipcMain.handle('check-for-updates', async () => {
        checkForUpdates(true); // `true` signifie que c'est une demande manuelle
        return { success: true, message: 'Vérification lancée.' };
    });

    ipcMain.handle('launch-rdp', async (event, params) => {
        const { server, sessionId } = params;
        if (!server) return { success: false, error: 'Serveur non spécifié' };

        const command = sessionId
            ? `mstsc.exe /shadow:${sessionId} /v:${server} /control`
            : `mstsc.exe /v:${server}`;
        
        log.info(`[RDP] Lancement de: ${command}`);

        return new Promise((resolve) => {
            exec(command, (error) => {
                if (error) {
                    log.error(`[RDP] Erreur: ${error.message}`);
                    resolve({ success: false, error: error.message });
                } else {
                    resolve({ success: true });
                }
            });
        });
    });
}

// --- Cycle de vie de l'application ---
app.whenReady().then(() => {
    startServer();
    setupAutoUpdater();
    setupIpcHandlers();
    createWindow();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('will-quit', () => log.info('[Main] 🛑 Arrêt de l\'application.'));
process.on('uncaughtException', (error) => log.error('[Main] ❌ Erreur non capturée:', error));