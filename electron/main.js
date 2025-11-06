// electron/main.js - VERSION FINALE AVEC DÉMARRAGE SERVEUR ROBUSTE

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const { exec } = require('child_process');
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
        logToUI('info', '[Main] 🚀 Environnement de production détecté. Démarrage du serveur Node.js interne...');

        try {
            // En mode packagé, server/ est dans app.asar.unpacked (asarUnpack)
            const appPath = app.getAppPath();
            const unpackedPath = appPath.replace('app.asar', 'app.asar.unpacked');

            logToUI('info', `[Main] Chemin app: ${appPath}`);
            logToUI('info', `[Main] Chemin unpacked: ${unpackedPath}`);

            // ✅ SOLUTION ROBUSTE: Configurer NODE_PATH AVANT require()
            const nodeModulesPath = path.join(unpackedPath, 'node_modules');
            process.env.NODE_PATH = nodeModulesPath;
            require('module').Module._initPaths(); // Reload module paths

            logToUI('info', `[Main] ✅ NODE_PATH configuré: ${nodeModulesPath}`);

            // Configurer les variables d'environnement pour le serveur
            process.env.RUNNING_IN_ELECTRON = 'true';
            process.env.PORT = '3002';

            // Changer le répertoire de travail pour le serveur
            const serverDir = path.join(unpackedPath, 'server');
            const serverPath = path.join(serverDir, 'server.js');

            logToUI('info', `[Main] Chemin du serveur: ${serverPath}`);

            // Vérifier que le fichier serveur existe
            if (!fs.existsSync(serverPath)) {
                throw new Error(`Fichier serveur introuvable: ${serverPath}`);
            }

            logToUI('info', '[Main] ✅ Fichier serveur trouvé, chargement...');

            // ✅ DÉMARRER LE SERVEUR DANS LE PROCESSUS ELECTRON (pas de fork)
            // Cela garantit que tous les modules sont accessibles
            require(serverPath);

            logToUI('info', '[Main] ✅ Serveur backend chargé et démarré avec succès');

        } catch (error) {
            logToUI('error', `[Main] ❌ ERREUR FATALE lors du démarrage du serveur: ${error.message}`);
            logToUI('error', `[Main] Stack trace: ${error.stack}`);
            dialog.showErrorBox(
                'Erreur Serveur Critique',
                `Impossible de démarrer le serveur backend:\n\n${error.message}\n\nL'application va se fermer.\n\nConsultez les logs pour plus de détails.`
            );
            app.quit();
        }
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

    if (isDev) {
        // --- LOGIQUE D'ATTENTE ROBUSTE AVEC VÉRIFICATION DE CONNEXION ---
        const reactPortFilePath = path.join(__dirname, '..', '.react-port.json');
        const net = require('net');
        let maxRetries = 30; // Increased to 30 seconds
        const retryDelay = 1000;

        // Vérifier si le serveur React accepte des connexions
        const checkServerConnection = (port) => {
            return new Promise((resolve) => {
                const socket = new net.Socket();
                socket.setTimeout(2000);

                socket.on('connect', () => {
                    socket.destroy();
                    resolve(true);
                });

                socket.on('timeout', () => {
                    socket.destroy();
                    resolve(false);
                });

                socket.on('error', () => {
                    resolve(false);
                });

                socket.connect(port, 'localhost');
            });
        };

        const loadDevUrl = async () => {
            if (fs.existsSync(reactPortFilePath)) {
                try {
                    const { port } = JSON.parse(fs.readFileSync(reactPortFilePath, 'utf8'));

                    // ✅ CRITIQUE: Vérifier que le serveur répond avant loadURL
                    const isServerReady = await checkServerConnection(port);

                    if (isServerReady) {
                        const devUrl = `http://localhost:${port}`;
                        logToUI('info', `[Main] ✅ Serveur React répond sur le port ${port}. Chargement: ${devUrl}`);

                        mainWindow.loadURL(devUrl).catch(err => {
                            logToUI('error', `[Main] ❌ Erreur loadURL: ${err.message}`);
                            // Retry on connection error
                            if (maxRetries > 0) {
                                maxRetries--;
                                logToUI('info', `[Main] Nouvelle tentative... (${maxRetries} restantes)`);
                                setTimeout(loadDevUrl, retryDelay);
                            } else {
                                dialog.showErrorBox('Erreur de chargement', `Impossible de se connecter au serveur React.\n\nErreur: ${err.message}`);
                            }
                        });
                        mainWindow.webContents.openDevTools();
                    } else {
                        // Server not ready yet, retry
                        logToUI('info', `[Main] Serveur React pas encore prêt (port ${port}). Nouvelle tentative... (${maxRetries} restantes)`);
                        if (maxRetries > 0) {
                            maxRetries--;
                            setTimeout(loadDevUrl, retryDelay);
                        } else {
                            dialog.showErrorBox('Erreur de Démarrage', 'Le serveur React ne répond pas après 30 secondes.');
                        }
                    }

                } catch (error) {
                    logToUI('error', `[Main] Erreur lecture .react-port.json: ${error.message}`);
                    if (maxRetries > 0) {
                        maxRetries--;
                        setTimeout(loadDevUrl, retryDelay);
                    } else {
                        dialog.showErrorBox('Erreur Critique', 'Impossible de lire le port du serveur React.');
                    }
                }
            } else {
                 logToUI('info', `[Main] En attente de .react-port.json... (${maxRetries} tentatives restantes)`);
                if (maxRetries > 0) {
                    maxRetries--;
                    setTimeout(loadDevUrl, retryDelay);
                } else {
                    dialog.showErrorBox('Erreur de Démarrage', 'Le serveur de développement React n\'a pas démarré à temps.');
                }
            }
        };

        loadDevUrl();
        // --- FIN DE LA LOGIQUE D'ATTENTE ---
    } else {
        const prodPath = path.join(__dirname, '..', 'build', 'index.html');
        logToUI('info', `[Main] Chargement du fichier de production: ${prodPath}`);
        mainWindow.loadFile(prodPath).catch(err => logToUI('error', `[Main] ❌ Impossible de charger le fichier de prod: ${err.message}`));

        // ⚠️ MODE DEBUG ACTIVÉ - Ouvrir DevTools en production
        mainWindow.webContents.openDevTools();
        logToUI('info', '[Main] 🔍 DevTools ouvert pour debugging');
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

        // For both normal RDP and shadow connections with credentials
        if (username && password) {
            const tempDir = os.tmpdir();
            const rdpFilePath = path.join(tempDir, `rdp_${Date.now()}.rdp`);

            try {
                // Store credentials using cmdkey
                const domain = username.includes('\\') ? username.split('\\')[0] : '';
                const user = username.includes('\\') ? username.split('\\')[1] : username;
                const fullUsername = domain ? `${domain}\\${user}` : user;

                const cmdkeyCommand = `cmdkey /generic:"TERMSRV/${server}" /user:"${fullUsername}" /pass:"${password}"`;

                return new Promise((resolve) => {
                    exec(cmdkeyCommand, (cmdkeyError) => {
                        if (cmdkeyError) {
                            logToUI('error', `[RDP] Erreur cmdkey: ${cmdkeyError.message}`);
                            return resolve({ success: false, error: cmdkeyError.message });
                        }

                        // If it's a shadow connection
                        if (sessionId) {
                            logToUI('info', `[RDP] Lancement shadow: session ${sessionId} sur ${server}`);
                            // Shadow connection WITHOUT /control flag - will request user permission
                            const shadowCommand = `mstsc.exe /shadow:${sessionId} /v:${server} /prompt`;

                            exec(shadowCommand, (shadowError) => {
                                // Clean up credentials after 10 seconds
                                setTimeout(() => {
                                    exec(`cmdkey /delete:"TERMSRV/${server}"`);
                                    logToUI('info', `[RDP] Credentials nettoyés pour ${server}`);
                                }, 10000);

                                if (shadowError) {
                                    logToUI('error', `[RDP] Erreur shadow: ${shadowError.message}`);
                                    resolve({ success: false, error: shadowError.message });
                                } else {
                                    logToUI('info', `[RDP] Shadow lancé avec succès`);
                                    resolve({ success: true });
                                }
                            });
                        } else {
                            // Regular RDP connection with file
                            const rdpContent = `screen mode id:i:2\nfull address:s:${server}\nusername:s:${fullUsername}\nprompt for credentials:i:0\nauthentication level:i:2\nenablecredsspsupport:i:1`;
                            fs.writeFileSync(rdpFilePath, rdpContent);
                            const mstscCommand = `mstsc.exe "${rdpFilePath}"`;

                            exec(mstscCommand, (mstscError) => {
                                setTimeout(() => {
                                    exec(`cmdkey /delete:"TERMSRV/${server}"`);
                                    if (fs.existsSync(rdpFilePath)) fs.unlinkSync(rdpFilePath);
                                }, 10000);

                                if (mstscError) {
                                    logToUI('error', `[RDP] Erreur mstsc: ${mstscError.message}`);
                                    resolve({ success: false, error: mstscError.message });
                                } else {
                                    resolve({ success: true });
                                }
                            });
                        }
                    });
                });
            } catch (error) {
                return { success: false, error: error.message };
            }
        }

        // Fallback for connections without credentials (shouldn't happen for shadow)
        logToUI('warn', `[RDP] Connexion sans credentials pour ${server}${sessionId ? ` (shadow ${sessionId})` : ''}`);
        const command = sessionId ? `mstsc.exe /shadow:${sessionId} /v:${server} /prompt` : `mstsc.exe /v:${server}`;
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