// electron/main.js - VERSION FINALE AVEC DÉMARRAGE SERVEUR ROBUSTE

const { app, BrowserWindow, ipcMain, dialog, Notification } = require('electron');
const path = require('path');
// const notificationScheduler = require('../backend/services/notificationScheduler'); // ❌ Supprimé pour éviter conflit version Node
const log = require('electron-log');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const net = require('net');
const http = require('http');
const isDev = process.env.ELECTRON_IS_DEV === '1' || !app.isPackaged;

// Import du bridge Active Directory
const { initializeAdBridge, cleanupAdBridge } = require('./ad-bridge');

// --- Configuration des logs améliorée ---
log.transports.file.level = 'info';
log.transports.console.level = 'info';

// Nettoyage automatique des logs anciens (garde les 7 derniers jours)
const LOG_RETENTION_DAYS = 7;
function cleanOldLogs() {
    try {
        const logsDir = path.join(app.getPath('userData'), 'logs');
        if (!fs.existsSync(logsDir)) return;

        const now = Date.now();
        const maxAge = LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000;

        fs.readdirSync(logsDir).forEach(file => {
            const filePath = path.join(logsDir, file);
            const stat = fs.statSync(filePath);

            if (now - stat.mtime.getTime() > maxAge) {
                fs.unlinkSync(filePath);
                console.log(`[Log Cleanup] Supprimé: ${file}`);
            }
        });

        // Limiter la taille du fichier main.log
        const mainLogPath = path.join(logsDir, 'main.log');
        if (fs.existsSync(mainLogPath)) {
            const stat = fs.statSync(mainLogPath);
            const maxSize = 5 * 1024 * 1024; // 5 MB

            if (stat.size > maxSize) {
                const content = fs.readFileSync(mainLogPath, 'utf8');
                const lines = content.split('\n');
                const keep = lines.slice(-5000); // Garde les 5000 dernières lignes
                fs.writeFileSync(mainLogPath, keep.join('\n'));
                console.log(`[Log Cleanup] main.log réduit: ${stat.size} -> ${fs.statSync(mainLogPath).size} bytes`);
            }
        }
    } catch (error) {
        console.error('[Log Cleanup] Erreur:', error);
    }
}

// Exécuter le nettoyage au démarrage
app.whenReady().then(cleanOldLogs);

let autoUpdater;

let mainWindow;
let backendProcess;
let backendLogPath = null;
let backendLogBuffer = [];
let backendLogStream = null;

const DEFAULT_API_PORT = 3002;
const DEFAULT_WS_PORT = 3003;
const DEFAULT_BACKEND_HOST = '127.0.0.1';
const PORT_RANGE = {
    api: { start: 3002, end: 3012 },
    ws: { start: 3003, end: 3013 }
};
const BACKEND_START_TIMEOUT_MS = 60000;
const BACKEND_LOG_MAX_LINES = 200;

let backendInfo = {
    apiPort: DEFAULT_API_PORT,
    wsPort: DEFAULT_WS_PORT,
    apiUrl: `http://${DEFAULT_BACKEND_HOST}:${DEFAULT_API_PORT}/api`,
    wsUrl: `ws://${DEFAULT_BACKEND_HOST}:${DEFAULT_WS_PORT}`
};

// Fonction pour envoyer les logs à la fenêtre React et aux fichiers/console
function logToUI(level, ...args) {
    const message = args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg))).join(' ');
    log[level](...args);
    if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('log-message', `[${level.toUpperCase()}] ${message}`);
    }
}

function initBackendLogFile() {
    try {
        const logsDir = path.join(app.getPath('userData'), 'logs');
        fs.mkdirSync(logsDir, { recursive: true });
        backendLogPath = path.join(logsDir, 'backend-startup.log');
        backendLogStream = fs.createWriteStream(backendLogPath, { flags: 'a' });
        backendLogStream.write(`\n=== Backend start ${new Date().toISOString()} ===\n`);
    } catch (error) {
        logToUI('warn', `[Main] Impossible d'initialiser le log backend: ${error.message}`);
    }
}

function appendBackendLogLine(line) {
    if (!line) return;
    backendLogBuffer.push(line);
    if (backendLogBuffer.length > BACKEND_LOG_MAX_LINES) {
        backendLogBuffer = backendLogBuffer.slice(-BACKEND_LOG_MAX_LINES);
    }
    if (backendLogStream && backendLogStream.writable) {
        backendLogStream.write(`${line}\n`);
    }
}

function appendBackendOutput(source, data) {
    const text = data.toString();
    text.split(/\r?\n/).filter(Boolean).forEach((line) => {
        appendBackendLogLine(`[${source}] ${line}`);
    });
}

function getBackendLogSnippet(maxLines = 20) {
    if (!backendLogBuffer.length) return '';
    return backendLogBuffer.slice(-maxLines).join('\n');
}

function buildBackendInfo(apiPort, wsPort, host = DEFAULT_BACKEND_HOST) {
    return {
        apiPort,
        wsPort,
        apiUrl: `http://${host}:${apiPort}/api`,
        wsUrl: `ws://${host}:${wsPort}`
    };
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function readDevPorts() {
    try {
        const candidates = [
            path.join(app.getAppPath(), '.ports.json'),
            path.join(process.cwd(), '.ports.json')
        ];
        const portsPath = candidates.find(p => fs.existsSync(p));
        if (!portsPath) return null;
        const data = JSON.parse(fs.readFileSync(portsPath, 'utf-8'));
        return {
            apiPort: data.http,
            wsPort: data.websocket
        };
    } catch (error) {
        logToUI('warn', `[Main] Impossible de lire .ports.json: ${error.message}`);
        return null;
    }
}

function isPortAvailable(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', () => resolve(false));
        server.once('listening', () => {
            server.close(() => resolve(true));
        });
        server.listen(port, '127.0.0.1');
    });
}

async function findAvailablePort(startPort, endPort, excluded = new Set()) {
    for (let port = startPort; port <= endPort; port++) {
        if (excluded.has(port)) continue;
        if (await isPortAvailable(port)) return port;
    }
    return null;
}

function checkBackendHealth(apiUrl, timeoutMs = 2000) {
    return new Promise((resolve) => {
        const url = `${apiUrl}/health`;
        const req = http.get(url, { timeout: timeoutMs }, (res) => {
            const statusCode = res.statusCode || 0;
            res.resume();
            resolve(statusCode === 200 || statusCode === 503);
        });
        req.on('timeout', () => {
            req.destroy();
            resolve(false);
        });
        req.on('error', () => resolve(false));
    });
}

async function waitForBackendReady(apiUrl, timeoutMs = BACKEND_START_TIMEOUT_MS, shouldAbort) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        if (shouldAbort && shouldAbort()) return false;
        if (await checkBackendHealth(apiUrl)) return true;
        await sleep(1000);
    }
    return false;
}

async function resolveBackendPorts() {
    if (isDev) {
        const devPorts = readDevPorts();
        const apiPort = devPorts?.apiPort || DEFAULT_API_PORT;
        const wsPort = devPorts?.wsPort || DEFAULT_WS_PORT;
        return { apiPort, wsPort, backendAlreadyRunning: true, host: 'localhost' };
    }

    const defaultInfo = buildBackendInfo(DEFAULT_API_PORT, DEFAULT_WS_PORT, DEFAULT_BACKEND_HOST);
    if (await checkBackendHealth(defaultInfo.apiUrl)) {
        return { apiPort: DEFAULT_API_PORT, wsPort: DEFAULT_WS_PORT, backendAlreadyRunning: true, host: DEFAULT_BACKEND_HOST };
    }

    const apiAvailable = await isPortAvailable(DEFAULT_API_PORT);
    const apiPort = apiAvailable
        ? DEFAULT_API_PORT
        : await findAvailablePort(PORT_RANGE.api.start, PORT_RANGE.api.end);

    const wsPort = await findAvailablePort(
        PORT_RANGE.ws.start,
        PORT_RANGE.ws.end,
        new Set([apiPort])
    );

    if (!apiPort || !wsPort) {
        throw new Error('Aucun port disponible pour le backend.');
    }

    return { apiPort, wsPort, backendAlreadyRunning: false, host: DEFAULT_BACKEND_HOST };
}

function getAutoUpdater() {
    if (autoUpdater) return autoUpdater;
    try {
        autoUpdater = require('electron-updater').autoUpdater;
        autoUpdater.logger = log;
        return autoUpdater;
    } catch (error) {
        logToUI('error', '[Updater] Impossible de charger electron-updater:', error);
        return null;
    }
}

logToUI('info', '[Main] ===================================================');
logToUI('info', `[Main] 🚀 Démarrage de l'application Electron... v${app.getVersion()}`);
logToUI('info', `[Main] Mode de développement (isDev): ${isDev}`);
logToUI('info', `[Main] Chemin de l'application: ${app.getAppPath()}`);
logToUI('info', '[Main] ===================================================');

async function startServer() {
    const ports = await resolveBackendPorts();
    backendInfo = buildBackendInfo(ports.apiPort, ports.wsPort, ports.host || DEFAULT_BACKEND_HOST);
    let backendExitInfo = null;

    if (isDev) {
        logToUI('info', `[Main] Mode developpement. Backend externe (API ${backendInfo.apiPort}, WS ${backendInfo.wsPort}).`);
        return backendInfo;
    }

    logToUI('info', '[Main] ?? Environnement de production detecte. Demarrage du serveur Node.js dedie...');

    try {
        if (ports.backendAlreadyRunning) {
            logToUI('info', `[Main] Backend deja actif sur ${backendInfo.apiUrl}`);
            return backendInfo;
        }

        // En mode package avec ASAR, les fichiers unpacked sont dans app.asar.unpacked
        const appPath = app.getAppPath();
        const isAsar = appPath.includes('.asar');
        const unpackedPath = isAsar ? appPath.replace('app.asar', 'app.asar.unpacked') : appPath;
        const resourcesPath = process.resourcesPath || path.dirname(appPath);

        logToUI('info', `[Main] Chemin app: ${appPath}`);
        logToUI('info', `[Main] Chemin unpacked: ${unpackedPath}`);
        logToUI('info', `[Main] Chemin resources: ${resourcesPath}`);

        const nodeModulesCandidates = [
            path.join(unpackedPath, 'node_modules'),
            path.join(appPath, 'node_modules')
        ];
        const nodeModulesPath = nodeModulesCandidates.find(p => fs.existsSync(p));
        if (!nodeModulesPath) {
            throw new Error(`Dossier node_modules introuvable. Candidats: ${nodeModulesCandidates.join(' | ')}`);
        }
        logToUI('info', `[Main] Node modules: ${nodeModulesPath}`);

        const serverCandidates = [
            path.join(unpackedPath, 'server', 'server.js'),
            path.join(appPath, 'server', 'server.js')
        ];
        const serverPath = serverCandidates.find(p => fs.existsSync(p));
        if (!serverPath) {
            throw new Error(`Fichier serveur introuvable. Candidats: ${serverCandidates.join(' | ')}`);
        }
        logToUI('info', `[Main] Chemin du serveur: ${serverPath}`);

        logToUI('info', `[Main] ? Lancement du serveur backend (API ${backendInfo.apiPort}, WS ${backendInfo.wsPort})...`);
        initBackendLogFile();

        const env = {
            ...process.env,
            ELECTRON_RUN_AS_NODE: '1',
            RUNNING_IN_ELECTRON: 'true',
            NODE_ENV: 'production',
            PORT: String(backendInfo.apiPort),
            API_PORT: String(backendInfo.apiPort),
            WS_PORT: String(backendInfo.wsPort),
            NODE_PATH: nodeModulesPath,
            RDS_VIEWER_USER_DATA: app.getPath('userData'),
            RDS_BACKEND_LOG_FILE: path.join(app.getPath('userData'), 'logs', 'backend-process.log')
        };

        backendProcess = spawn(process.execPath, [serverPath], {
            env,
            cwd: resourcesPath,
            stdio: ['ignore', 'pipe', 'pipe'],
            windowsHide: true
        });

        backendProcess.stdout.on('data', (data) => {
            logToUI('info', `[Backend] ${data.toString().trim()}`);
            appendBackendOutput('stdout', data);
        });

        backendProcess.stderr.on('data', (data) => {
            logToUI('error', `[Backend] ${data.toString().trim()}`);
            appendBackendOutput('stderr', data);
        });

        backendProcess.on('exit', (code, signal) => {
            backendExitInfo = { code, signal };
            logToUI('error', `[Backend] Arret du processus backend (code=${code}, signal=${signal || 'none'})`);
            if (backendLogStream) backendLogStream.end();
        });

        backendProcess.on('error', (error) => {
            backendExitInfo = { error };
            logToUI('error', `[Backend] Erreur au demarrage: ${error.message}`);
            if (backendLogStream) backendLogStream.end();
        });

        const ready = await waitForBackendReady(backendInfo.apiUrl, BACKEND_START_TIMEOUT_MS, () => backendExitInfo);
        if (!ready) {
            const logSnippet = getBackendLogSnippet();
            if (backendExitInfo) {
                const exitMessage = backendExitInfo.error
                    ? backendExitInfo.error.message
                    : `code=${backendExitInfo.code}, signal=${backendExitInfo.signal || 'none'}`;
                throw new Error(
                    `Le backend s'est arrete avant d'etre pret (${exitMessage}).` +
                    (logSnippet ? `\n\nDerniers logs:\n${logSnippet}` : '') +
                    (backendLogPath ? `\n\nLog complet: ${backendLogPath}` : '')
                );
            }
            throw new Error(
                `Le backend ne repond pas apres ${BACKEND_START_TIMEOUT_MS / 1000}s.` +
                (logSnippet ? `\n\nDerniers logs:\n${logSnippet}` : '') +
                (backendLogPath ? `\n\nLog complet: ${backendLogPath}` : '')
            );
        }

        logToUI('info', `[Main] Backend pret sur ${backendInfo.apiUrl}`);
        return backendInfo;
    } catch (error) {
        logToUI('error', `[Main] ? ERREUR FATALE lors du demarrage du serveur: ${error.message}`);
        logToUI('error', `[Main] Stack trace: ${error.stack}`);
        dialog.showErrorBox(
            'Erreur Serveur Critique',
            `Impossible de demarrer le serveur backend:\n\n${error.message}\n\nL'application va se fermer.\n\nConsultez les logs pour plus de details.`
        );
        app.quit();
        throw error;
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
        let maxRetries = 90; // ✅ FIX: Increased to 90 seconds for slow React compilation
        const retryDelay = 1000;
        const DEFAULT_REACT_PORT = 3000; // Port React par défaut

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
            let portToTry = DEFAULT_REACT_PORT;

            // ✅ FIX: Try to read port from file, but fallback to default port
            if (fs.existsSync(reactPortFilePath)) {
                try {
                    const { port } = JSON.parse(fs.readFileSync(reactPortFilePath, 'utf8'));
                    portToTry = port;
                    logToUI('info', `[Main] 📄 Port trouvé dans .react-port.json: ${port}`);
                } catch (error) {
                    logToUI('warn', `[Main] ⚠️ Erreur lecture .react-port.json: ${error.message}, utilisation du port par défaut ${DEFAULT_REACT_PORT}`);
                }
            } else {
                logToUI('info', `[Main] ⏳ Fichier .react-port.json absent, essai du port par défaut ${DEFAULT_REACT_PORT}... (${maxRetries}s restantes)`);
            }

            // ✅ CRITIQUE: Vérifier que le serveur répond avant loadURL
            const isServerReady = await checkServerConnection(portToTry);

            if (isServerReady) {
                const devUrl = `http://localhost:${portToTry}`;
                logToUI('info', `[Main] ✅ Serveur React PRÊT sur le port ${portToTry}. Chargement: ${devUrl}`);

                mainWindow.loadURL(devUrl).catch(err => {
                    logToUI('error', `[Main] ❌ Erreur loadURL: ${err.message}`);
                    // Retry on connection error
                    if (maxRetries > 0) {
                        maxRetries--;
                        logToUI('info', `[Main] Nouvelle tentative... (${maxRetries}s restantes)`);
                        setTimeout(loadDevUrl, retryDelay);
                    } else {
                        dialog.showErrorBox('Erreur de chargement', `Impossible de se connecter au serveur React après 90 secondes.\n\nErreur: ${err.message}`);
                    }
                });
                // ✅ CORRECTION: Ne plus ouvrir DevTools automatiquement (sauf en mode dev)
                if (isDev) {
                    mainWindow.webContents.openDevTools();
                }
            } else {
                // Server not ready yet, retry
                if (maxRetries > 0) {
                    maxRetries--;
                    // Log moins verbose après 60 secondes
                    if (maxRetries % 10 === 0 || maxRetries > 80) {
                        logToUI('info', `[Main] ⏳ Compilation React en cours... (${maxRetries}s restantes)`);
                    }
                    setTimeout(loadDevUrl, retryDelay);
                } else {
                    dialog.showErrorBox('Erreur de Démarrage', `Le serveur React ne répond pas après 90 secondes.\n\nVérifiez la compilation dans la console.`);
                }
            }
        };

        loadDevUrl();
        // --- FIN DE LA LOGIQUE D'ATTENTE ---
    } else {
        // En mode production packagé, le dossier build est dans le même répertoire que electron
        const prodPath = path.join(__dirname, '..', 'build', 'index.html');
        logToUI('info', `[Main] Chargement du fichier de production: ${prodPath}`);

        // Vérifier si le fichier existe
        if (fs.existsSync(prodPath)) {
            logToUI('info', `[Main] ✅ Fichier index.html trouvé`);
            mainWindow.loadFile(prodPath).catch(err => {
                logToUI('error', `[Main] ❌ Impossible de charger le fichier de prod: ${err.message}`);
                dialog.showErrorBox('Erreur de chargement', `Impossible de charger l'interface:\n\n${err.message}`);
            });
        } else {
            logToUI('error', `[Main] ❌ Fichier index.html non trouvé: ${prodPath}`);
            logToUI('info', `[Main] __dirname = ${__dirname}`);
            logToUI('info', `[Main] Contenu du dossier parent: ${fs.readdirSync(path.join(__dirname, '..')).join(', ')}`);

            dialog.showErrorBox('Fichier introuvable', `Le fichier index.html est introuvable:\n${prodPath}\n\nVérifiez que l'application a été correctement compilée.`);
        }

        // ✅ CORRECTION: Ne plus ouvrir DevTools automatiquement en production
        if (isDev) {
            logToUI('info', '[Main] 🔍 Mode Dev - Ouverture automatique des DevTools');
            mainWindow.webContents.once('did-finish-load', () => {
                mainWindow.webContents.openDevTools();
                logToUI('info', '[Main] 🔍 DevTools ouvert automatiquement');
            });
        }
    }

    // ✅ NOUVEAU: Raccourci clavier pour ouvrir DevTools en mode production (pour debug)
    mainWindow.webContents.on('before-input-event', (event, input) => {
        // F12 ou Ctrl+Shift+I pour ouvrir DevTools
        if (input.key === 'F12' || (input.control && input.shift && input.key === 'I')) {
            mainWindow.webContents.openDevTools();
            logToUI('info', '[Main] 🔍 DevTools ouvert via raccourci clavier');
        }
        // Ctrl+Shift+D pour afficher les logs de debug dans la console
        if (input.control && input.shift && input.key === 'D') {
            mainWindow.webContents.send('toggle-debug-mode');
            logToUI('info', '[Main] 🐛 Mode debug togglé');
        }
    });

    // ✅ TIMEOUT DE SÉCURITÉ: Forcer l'affichage après 30 secondes même si pas prêt
    const forceShowTimeout = setTimeout(() => {
        if (mainWindow && !mainWindow.isVisible()) {
            logToUI('warn', '[Main] ⚠️ TIMEOUT: Forçage affichage fenêtre après 30s');
            mainWindow.show();
            // ✅ CORRECTION: Ne plus ouvrir DevTools automatiquement en production
            if (isDev) {
                mainWindow.webContents.openDevTools();
                logToUI('info', '[Main] 🔍 DevTools ouvert automatiquement pour diagnostic (mode dev)');
            }
        }
    }, 30000);

    mainWindow.once('ready-to-show', () => {
        clearTimeout(forceShowTimeout); // Annuler le timeout si la fenêtre est prête
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
    const updater = getAutoUpdater();
    if (!updater) return;
    try {
        const configPath = isDev
            ? path.join(__dirname, '..', 'config', 'config.json')
            : path.join(process.resourcesPath, 'config', 'config.json');

        if (fs.existsSync(configPath)) {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            if (config.updateUrl) {
                logToUI('info', `[Updater] URL de mise à jour trouvée: ${config.updateUrl}`);

                // Convertir le chemin UNC en URL file:// si nécessaire
                let feedUrl = config.updateUrl;
                if (feedUrl.startsWith('\\\\')) {
                    feedUrl = 'file://' + feedUrl.replace(/\\/g, '/');
                    logToUI('info', `[Updater] Conversion UNC -> file:// : ${feedUrl}`);
                }

                updater.setFeedURL({
                    provider: 'generic',
                    url: feedUrl
                });
                logToUI('info', `[Updater] ✅ Feed URL configurée: ${feedUrl}`);
            } else {
                logToUI('warn', '[Updater] ⚠️ Aucune URL de mise à jour trouvée dans config.json');
            }
        } else {
            logToUI('warn', `[Updater] ⚠️ Fichier de configuration non trouvé à ${configPath}`);
        }
    } catch (error) {
        logToUI('error', '[Updater] ❌ Erreur lecture config.json pour l\'URL de mise à jour:', error.message);
    }

    updater.autoDownload = false;
    updater.autoInstallOnAppQuit = true;
    updater.on('checking-for-update', () => logToUI('info', '[Updater] 🔍 Vérification des mises à jour...'));
    updater.on('update-available', (info) => {
        logToUI('info', `[Updater] ✅ Mise à jour disponible: ${info.version}`);
        dialog.showMessageBox(mainWindow, { type: 'info', title: 'Mise à jour disponible', message: `Une nouvelle version (${info.version}) est disponible.`, detail: 'Voulez-vous la télécharger maintenant ?', buttons: ['Oui', 'Plus tard'], defaultId: 0, cancelId: 1 }).then(({ response }) => { if (response === 0) updater.downloadUpdate(); });
    });
    updater.on('update-not-available', () => logToUI('info', '[Updater] ℹ️ Aucune mise à jour disponible.'));
    updater.on('error', (err) => logToUI('error', `[Updater] ❌ Erreur: ${err.message}`));
    updater.on('download-progress', (p) => { logToUI('info', `[Updater] 📥 Téléchargement: ${p.percent.toFixed(2)}%`); if (mainWindow) mainWindow.setProgressBar(p.percent / 100); });
    updater.on('update-downloaded', () => {
        logToUI('info', '[Updater] ✅ Mise à jour téléchargée.');
        if (mainWindow) mainWindow.setProgressBar(-1);
        dialog.showMessageBox(mainWindow, { type: 'info', title: 'Mise à jour prête', message: 'La mise à jour a été téléchargée.', detail: 'L\'application va redémarrer pour installer la nouvelle version.', buttons: ['Redémarrer'], defaultId: 0 }).then(() => updater.quitAndInstall(true, true));
    });
}

function checkForUpdates(isManual) {
    const updater = getAutoUpdater();
    if (!updater) return;
    updater.checkForUpdates().catch(err => {
        logToUI('error', '[Updater] Échec de la vérification des mises à jour :', err);
        if (isManual) dialog.showErrorBox('Erreur de mise à jour', `Impossible de vérifier les mises à jour : ${err.message}`);
    });
}

const { shell } = require('electron');

function setupIpcHandlers() {
    ipcMain.handle('get-backend-info', () => backendInfo);
    ipcMain.handle('get-app-version', () => app.getVersion());
    ipcMain.handle('check-for-updates', () => { checkForUpdates(true); return { success: true }; });

    // ✅ NOUVEAU: Handler pour ouvrir DevTools manuellement depuis React
    ipcMain.handle('open-devtools', () => {
        if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.openDevTools();
            logToUI('info', '[Main] 🔍 DevTools ouvert manuellement depuis React');
            return { success: true };
        }
        return { success: false, error: 'Fenêtre non disponible' };
    });

    ipcMain.on('show-notification', (event, { title, body }) => {
        const notification = new Notification({ title, body });
        notification.show();
    });

    ipcMain.handle('open-file', (event, filePath) => {
        shell.openPath(filePath);
    });

    ipcMain.handle('open-folder', (event, filePath) => {
        shell.showItemInFolder(filePath);
    });

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
                            // Shadow connection WITH /control flag for full control capability
                            const shadowCommand = `mstsc.exe /v:${server} /shadow:${sessionId} /control`;

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
        const command = sessionId ? `mstsc.exe /v:${server} /shadow:${sessionId} /control` : `mstsc.exe /v:${server}`;
        return new Promise((resolve) => {
            exec(command, (error) => {
                if (error) resolve({ success: false, error: error.message });
                else resolve({ success: true });
            });
        });
    });
}

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });
}

app.whenReady().then(async () => {
    if (!gotSingleInstanceLock) return;
    try {
        await startServer();
    } catch (error) {
        return;
    }
    setupAutoUpdater();
    initializeAdBridge();  // ✅ Initialize AD IPC bridge
    setupIpcHandlers();
    createWindow();
    // notificationScheduler.start(mainWindow); // ❌ Géré par backend via WS -> IPC
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('will-quit', () => {
    logToUI('info', '[Main] ?? Arret de l\'application.');
    if (backendProcess && !backendProcess.killed) {
        backendProcess.kill();
    }
    if (backendLogStream) backendLogStream.end();
    cleanupAdBridge();  // ? Cleanup AD bridge on app quit
});
process.on('uncaughtException', (error) => logToUI('error', '[Main] ❌ Erreur non capturée:', error));


