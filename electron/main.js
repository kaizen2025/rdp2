// electron/main.js - VERSION FINALE AVEC DÉMARRAGE SERVEUR ROBUSTE

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const { exec, fork } = require('child_process');
const fs = require('fs');
const os = require('os');
const isDev = require('electron-is-dev');

// --- Configuration des logs améliorée ---
log.transports.file.level = 'info';
log.transports.console.level = 'info';
autoUpdater.logger = log;

let mainWindow;

// Fonction pour envoyer les logs à la fenêtre React et aux fichiers/console
function logToUI(level, ...args) {
    const message = args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg))).join(' ');
    log[level](...args);
    if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('log-message', `[${level.toUpperCase()}] ${message}`);
    }
}

logToUI('info', '[Main] ===================================================');
logToUI('info', `[Main] 🚀 Démarrage de l'application Electron... v${app.getVersion()}`);
logToUI('info', `[Main] Mode de développement (isDev): ${isDev}`);
logToUI('info', `[Main] Chemin de l'application: ${app.getAppPath()}`);
logToUI('info', '[Main] ===================================================');

function startServer() {
    if (!isDev) {
        logToUI('info', '[Main] Environnement de production détecté. Démarrage du serveur Node.js interne...');
        const serverPath = path.join(__dirname, '..', 'server', 'server.js');
        logToUI('info', `[Main] Chemin du serveur: ${serverPath}`);

        const serverProcess = fork(serverPath, [], {
            silent: true,
            env: { 
                ...process.env, 
                RUNNING_IN_ELECTRON: 'true' // ✅ LA CORRECTION CRUCIALE
            }
        });

        serverProcess.stdout.on('data', (data) => logToUI('info', `[Server] ${data.toString().trim()}`));
        serverProcess.stderr.on('data', (data) => logToUI('error', `[Server ERROR] ${data.toString().trim()}`));
        serverProcess.on('error', (err) => {
            logToUI('error', '[Main] ❌ Erreur critique du processus serveur:', err);
            dialog.showErrorBox('Erreur Serveur Interne', `Le processus serveur a rencontré une erreur fatale: ${err.message}`);
            app.quit();
        });
        serverProcess.on('exit', (code) => {
            if (code !== 0) logToUI('error', `[Main] ⚠️ Le processus serveur s'est arrêté avec le code d'erreur: ${code}`);
            else logToUI('info', '[Main] Le processus serveur s\'est terminé proprement.');
        });
        app.on('will-quit', () => {
            logToUI('info', '[Main] Arrêt du processus serveur...');
            serverProcess.kill();
        });
        logToUI('info', '[Main] ✅ Processus serveur démarré.');
    } else {
        logToUI('info', '[Main] Mode développement. Le serveur backend est géré par un processus externe.');
    }
}

function createWindow() {
    logToUI('info', '[Main] 🎬 Création de la fenêtre principale...');
    mainWindow = new BrowserWindow({
        width: 1400, height: 900, minWidth: 1200, minHeight: 700,
        title: 'RDS Viewer Anecoop',
        icon: path.join(__dirname, '..', 'assets', 'icon.ico'),
        webPreferences: {
            nodeIntegration: false, contextIsolation: true, enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js')
        },
        autoHideMenuBar: true, frame: true, show: false
    });

    const devUrl = 'http://localhost:3000';
    const prodPath = path.join(__dirname, '..', 'build', 'index.html');

    if (isDev) {
        logToUI('info', `[Main] Chargement de l'URL de développement: ${devUrl}`);
        mainWindow.loadURL(devUrl).catch(err => {
            logToUI('error', `[Main] ❌ Impossible de charger l'URL de dev: ${err.message}`);
            dialog.showErrorBox('Erreur de chargement', `Impossible de se connecter au serveur de développement React. Vérifiez qu'il est bien démarré.\n\nErreur: ${err.message}`);
        });
        mainWindow.webContents.openDevTools();
    } else {
        logToUI('info', `[Main] Chargement du fichier de production: ${prodPath}`);
        mainWindow.loadFile(prodPath).catch(err => logToUI('error', `[Main] ❌ Impossible de charger le fichier de prod: ${err.message}`));
        // mainWindow.webContents.openDevTools({ mode: 'detach' }); // Décommenter pour débug en prod
    }

    mainWindow.once('ready-to-show', () => {
        logToUI('info', '[Main] ✅ Fenêtre prête à être affichée.');
        mainWindow.show();
        if (!isDev) {
            logToUI('info', '[Main] Lancement de la première vérification de mise à jour...');
            setTimeout(() => checkForUpdates(false), 5000);
        }
    });

    mainWindow.on('closed', () => { mainWindow = null; });
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        require('electron').shell.openExternal(url);
        return { action: 'deny' };
    });
}

function setupAutoUpdater() {
    try {
        const configPath = isDev
            ? path.join(__dirname, '..', 'config', 'config.json')
            : path.join(path.dirname(app.getPath('exe')), 'config', 'config.json');
        if (fs.existsSync(configPath)) {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            if (config.updateUrl) {
                logToUI('info', `[Updater] URL de mise à jour personnalisée: ${config.updateUrl}`);
                autoUpdater.setFeedURL(config.updateUrl);
            } else { logToUI('warn', '[Updater] Aucune URL de mise à jour personnalisée trouvée.'); }
        } else { logToUI('warn', `[Updater] Fichier de configuration non trouvé à ${configPath}.`); }
    } catch (error) { logToUI('error', '[Updater] Erreur lecture config.json pour l\'URL de mise à jour.', error); }

    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.on('checking-for-update', () => logToUI('info', '[Updater] 🔍 Vérification des mises à jour...'));
    autoUpdater.on('update-available', (info) => {
        logToUI('info', `[Updater] ✅ Mise à jour disponible: ${info.version}`);
        dialog.showMessageBox(mainWindow, { type: 'info', title: 'Mise à jour disponible', message: `Une nouvelle version (${info.version}) est disponible.`, detail: 'Voulez-vous la télécharger maintenant ?', buttons: ['Oui', 'Plus tard'], defaultId: 0, cancelId: 1 }).then(({ response }) => { if (response === 0) autoUpdater.downloadUpdate(); });
    });
    autoUpdater.on('update-not-available', () => logToUI('info', '[Updater] ℹ️ Aucune mise à jour disponible.'));
    autoUpdater.on('error', (err) => logToUI('error', `[Updater] ❌ Erreur: ${err.message}`));
    autoUpdater.on('download-progress', (p) => { logToUI('info', `[Updater] 📥 Téléchargement: ${p.percent.toFixed(2)}%`); if (mainWindow) mainWindow.setProgressBar(p.percent / 100); });
    autoUpdater.on('update-downloaded', () => {
        logToUI('info', '[Updater] ✅ Mise à jour téléchargée.');
        if (mainWindow) mainWindow.setProgressBar(-1);
        dialog.showMessageBox(mainWindow, { type: 'info', title: 'Mise à jour prête', message: 'La mise à jour a été téléchargée.', detail: 'L\'application va redémarrer pour installer la nouvelle version.', buttons: ['Redémarrer'], defaultId: 0 }).then(() => autoUpdater.quitAndInstall(true, true));
    });
}

function checkForUpdates(isManual) {
    autoUpdater.checkForUpdates().catch(err => {
        logToUI('error', '[Updater] Échec de la vérification des mises à jour :', err);
        if (isManual) dialog.showErrorBox('Erreur de mise à jour', `Impossible de vérifier les mises à jour : ${err.message}`);
    });
}

function setupIpcHandlers() {
    ipcMain.handle('get-app-version', () => app.getVersion());
    ipcMain.handle('check-for-updates', () => { checkForUpdates(true); return { success: true }; });
    ipcMain.handle('launch-rdp', async (event, params) => {
        const { server, sessionId, username, password } = params;
        if (!server) return { success: false, error: 'Serveur non spécifié' };
        if (username && password) {
            const tempDir = os.tmpdir();
            const rdpFilePath = path.join(tempDir, `rdp_${Date.now()}.rdp`);
            const rdpContent = `screen mode id:i:2\nfull address:s:${server}\nusername:s:${username}\nprompt for credentials:i:0\nauthentication level:i:2\nenablecredsspsupport:i:1`;
            try {
                fs.writeFileSync(rdpFilePath, rdpContent);
                const cmdkeyCommand = `cmdkey /generic:"TERMSRV/${server}" /user:"${username}" /pass:"${password}"`;
                const mstscCommand = `mstsc.exe "${rdpFilePath}"`;
                return new Promise((resolve) => {
                    exec(cmdkeyCommand, (error) => {
                        if (error) logToUI('error', `[RDP] Erreur cmdkey: ${error.message}`);
                        exec(mstscCommand, (mstscError) => {
                            setTimeout(() => { exec(`cmdkey /delete:"TERMSRV/${server}"`); if (fs.existsSync(rdpFilePath)) fs.unlinkSync(rdpFilePath); }, 10000);
                            if (mstscError) { logToUI('error', `[RDP] Erreur mstsc: ${mstscError.message}`); resolve({ success: false, error: mstscError.message }); }
                            else { resolve({ success: true }); }
                        });
                    });
                });
            } catch (error) { return { success: false, error: error.message }; }
        }
        const command = sessionId ? `mstsc.exe /shadow:${sessionId} /v:${server} /control /prompt` : `mstsc.exe /v:${server}`;
        return new Promise((resolve) => {
            exec(command, (error) => {
                if (error) resolve({ success: false, error: error.message });
                else resolve({ success: true });
            });
        });
    });
}

app.whenReady().then(() => {
    startServer();
    setupAutoUpdater();
    setupIpcHandlers();
    createWindow();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('will-quit', () => logToUI('info', '[Main] 🛑 Arrêt de l\'application.'));
process.on('uncaughtException', (error) => logToUI('error', '[Main] ❌ Erreur non capturée:', error));