// server/server.js - VERSION FINALE ULTRA-RAPIDE + DEBUG

// ... (tous les imports restent les mêmes)
const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');
const os = require('os');
const path = require('path');
const fs = require('fs');

function guardPipeErrors(stream) {
    if (!stream || typeof stream.on !== 'function') return;
    stream.on('error', (error) => {
        if (error && error.code === 'EPIPE') {
            return;
        }
    });
}

guardPipeErrors(process.stdout);
guardPipeErrors(process.stderr);

const backendLogFile = process.env.RDS_BACKEND_LOG_FILE;
let backendLogStream = null;
if (backendLogFile) {
    try {
        fs.mkdirSync(path.dirname(backendLogFile), { recursive: true });
        backendLogStream = fs.createWriteStream(backendLogFile, { flags: 'a' });
        backendLogStream.write(`\n=== Backend log ${new Date().toISOString()} ===\n`);
    } catch (error) {
        backendLogStream = null;
    }
}

function writeBackendLog(level, args) {
    if (!backendLogStream) return;
    const message = args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' ');
    backendLogStream.write(`[${new Date().toISOString()}] [${level}] ${message}\n`);
}

['log', 'info', 'warn', 'error'].forEach((level) => {
    const original = console[level].bind(console);
    console[level] = (...args) => {
        writeBackendLog(level, args);
        try {
            original(...args);
        } catch (error) {
            if (error && error.code !== 'EPIPE') {
                try {
                    backendLogStream?.write(`[${new Date().toISOString()}] [${level}] console error: ${error.message}\n`);
                } catch (_) { }
            }
        }
    };
});

const configService = require('../backend/services/configService');
const databaseService = require('../backend/services/databaseService');
const notificationService = require('../backend/services/notificationService');
const dataService = require('../backend/services/dataService');
const rdsService = require('../backend/services/rdsService');
const technicianService = require('../backend/services/technicianService');
const userService = require('../backend/services/userService');
const adCacheService = require('../backend/services/adCacheService');
const apiRoutes = require('./apiRoutes');
const aiRoutes = require('./aiRoutes');
const aiMultimodalRoutes = require('../backend/routes/ai-multimodal');
const { findAllPorts, savePorts, isPortAvailable } = require('../backend/utils/portUtils');

// ✅ NOUVEAU - Routes d'authentification et permissions
const authRoutes = require('../backend/routes/auth');
const notificationRoutes = require('../backend/routes/notifications');
const notificationScheduler = require('../backend/services/notificationScheduler');
const documentSyncService = require('../backend/services/ai/documentSyncService');


// ... (le début du fichier jusqu'à startServer reste identique)
let API_PORT = 3002;
let WS_PORT = 3003;
let LISTEN_HOST = null;
const app = express();
const server = http.createServer(app);
let wss;

const serverStartTime = Date.now();
console.log("=============================================");
console.log(" 🚀 Démarrage du serveur RDS Viewer...");
console.log(" 📅 Date:", new Date().toISOString());
console.log(" 💻 Hostname:", os.hostname());
console.log(" 🔧 Node:", process.version);
console.log(" 📂 CWD:", process.cwd());
console.log("=============================================");

function getAllowedOrigins() {
    const origins = new Set();
    for (let i = 3000; i <= 3010; i++) {
        origins.add(`http://localhost:${i}`);
        origins.add(`http://127.0.0.1:${i}`);
    }
    origins.add(`http://localhost:${API_PORT}`);
    origins.add(`http://127.0.0.1:${API_PORT}`);
    origins.add(`http://${os.hostname()}:${API_PORT}`);
    return Array.from(origins);
}
app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = getAllowedOrigins();
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`Origine non autorisée par CORS: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    }
}));
app.use(express.json());

function initializeWebSocket() {
    const wsOptions = LISTEN_HOST ? { port: WS_PORT, host: LISTEN_HOST } : { port: WS_PORT };
    wss = new WebSocketServer(wsOptions);
    
    // Configuration heartbeat pour détecter connexions mortes
    const heartbeatInterval = setInterval(() => {
        wss.clients.forEach(ws => {
            if (ws.isAlive === false) {
                console.log('🔌 Connexion WebSocket morte détectée, fermeture...');
                return ws.terminate();
            }
            ws.isAlive = false;
            ws.ping();
        });
    }, 30000); // Vérification toutes les 30 secondes
    
    wss.on('connection', ws => {
        console.log('🔌 Nouveau client WebSocket connecté.');
        ws.isAlive = true;
        
        ws.on('pong', () => {
            ws.isAlive = true;
        });
        
        ws.on('close', () => console.log('🔌 Client WebSocket déconnecté.'));
        ws.on('error', (error) => console.error('❌ Erreur WebSocket:', error));
    });
    
    wss.on('close', () => {
        clearInterval(heartbeatInterval);
    });
    
    console.log(`✅ WebSocket initialisé sur le port ${WS_PORT} avec heartbeat`);
}

function listenHttpServer(callback) {
    if (LISTEN_HOST) {
        return server.listen(API_PORT, LISTEN_HOST, callback);
    }
    return server.listen(API_PORT, callback);
}

function broadcast(data) {
    if (!wss) return;
    const jsonData = JSON.stringify(data);
    wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) client.send(jsonData);
    });
}

function startBackgroundTasks() {
    console.log('🕒 Planification des tâches de fond...');
    
    const runAsyncTask = (name, taskFn, interval, initialDelay = 2000) => {
        const run = async () => {
            console.log(`[Task: ${name}] 🚀 Démarrage...`);
            try {
                await taskFn();
                console.log(`[Task: ${name}] ✅ Terminé.`);
            } catch (error) {
                console.error(`[Task: ${name}] ❌ Erreur:`, error);
            }
        };
        setTimeout(run, initialDelay);
        setInterval(run, interval);
    };

    // ✅ NOUVEAU : Synchronisation Excel en tâche de fond
    runAsyncTask('Excel Sync', async () => {
        const syncResult = await userService.syncUsersFromExcel(false);
        if (syncResult.success && syncResult.usersCount > 0) {
            broadcast({ type: 'data_updated', payload: { entity: 'excel_users' } });
        }
    }, 10 * 60 * 1000, 5000); // Toutes les 10 min, premier lancement après 5s

    runAsyncTask('RDS Sessions', async () => {
        const result = await rdsService.refreshAndStoreRdsSessions();
        if (result.success) broadcast({ type: 'data_updated', payload: { entity: 'rds_sessions' } });
    }, 30 * 1000);

    runAsyncTask('Loan Check', async () => {
        const loans = await dataService.getLoans();
        const settings = await dataService.getLoanSettings();
        if (settings.autoNotifications) {
            const newNotifications = await notificationService.checkAllLoansForNotifications(loans, settings);
            if (newNotifications?.length > 0) {
                broadcast({ type: 'data_updated', payload: { entity: 'notifications' } });
            }
        }
    }, 15 * 60 * 1000);

    runAsyncTask('Technician Presence', technicianService.updateAllTechniciansPresence, 2 * 60 * 1000);
    runAsyncTask('AD Status Cache', adCacheService.updateUserAdStatuses, 5 * 60 * 1000, 15000); // Lancement après 15s

    // ✅ NOUVEAU - Démarrer le planificateur de notifications automatiques
    notificationScheduler.start();

    // ✅ NOUVEAU - Démarrer le service de synchronisation des documents
    const syncPath = configService.appConfig.documentSyncPath;
    if (syncPath) {
        documentSyncService.start(syncPath);
        console.log(`[DocSync] Service de synchronisation démarré pour le dossier : ${syncPath}`);
    } else {
        console.warn('[DocSync] Aucun chemin de synchronisation des documents configuré. Le service ne démarrera pas.');
    }

    console.log('✅ Tâches de fond planifiées.');
}

async function startServer() {
    try {
        console.log('');
        console.log('📊 ===== PHASE 1: INITIALISATION =====');
        const phase1Start = Date.now();
        console.log('🔍 [DEBUG] __dirname:', __dirname);
        console.log('🔍 [DEBUG] process.cwd():', process.cwd());
        console.log('🔍 [DEBUG] NODE_ENV:', process.env.NODE_ENV);
        console.log('🔍 [DEBUG] RUNNING_IN_ELECTRON:', process.env.RUNNING_IN_ELECTRON);

        const isProduction = process.env.NODE_ENV === 'production' || process.env.RUNNING_IN_ELECTRON === 'true';
        LISTEN_HOST = isProduction ? '127.0.0.1' : null;
        console.log('🔍 [DEBUG] isProduction:', isProduction);

        if (isProduction) {
            const envApiPort = parseInt(process.env.API_PORT || process.env.PORT, 10);
            const envWsPort = parseInt(process.env.WS_PORT, 10);
            API_PORT = Number.isInteger(envApiPort) ? envApiPort : 3002;
            WS_PORT = Number.isInteger(envWsPort) ? envWsPort : 3003;
            console.log('✅ Mode PRODUCTION - Ports fixes:', { API_PORT, WS_PORT });
        } else {
            const ports = await findAllPorts({ http: { start: 3002, end: 3012 }, websocket: { start: 3003, end: 3013 } });
            API_PORT = ports.http; WS_PORT = ports.websocket;
            await savePorts(ports);
            console.log('✅ Mode DEV - Ports trouvés:', { API_PORT, WS_PORT });
        }
        console.log(`⏱️ Phase 1 terminée en ${Date.now() - phase1Start}ms`);

        console.log('');
        console.log('📊 ===== PHASE 2: CONFIGURATION =====');
        const phase2Start = Date.now();
        await configService.loadConfigAsync();
        if (!configService.isConfigurationValid()) {
            console.error("\n❌ Démarrage en mode dégradé (config invalide).");
            app.use('/api', apiRoutes(() => {}));
            initializeWebSocket();
            listenHttpServer(() => console.log(`\n📡 Serveur dégradé sur http://localhost:${API_PORT}`));
            return;
        }
        console.log('✅ Configuration chargée.');
        console.log(`⏱️ Phase 2 terminée en ${Date.now() - phase2Start}ms`);

        console.log('');
        console.log('📊 ===== PHASE 3: BASE DE DONNÉES =====');
        const phase3Start = Date.now();
        // ✅ OPTIMISATION: Connexion avec timeout de 10 secondes max
        try {
            const dbPromise = databaseService.connectWithRetry();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout connexion BDD (10s)')), 10000)
            );

            await Promise.race([dbPromise, timeoutPromise]);
            console.log('✅ Base de données connectée avec succès.');
        } catch (dbError) {
            console.error('⚠️  ATTENTION: Connexion BDD lente ou impossible:', dbError.message);
            console.error('   L\'application va démarrer en mode dégradé.');
            // Tenter connexion locale en dernier recours
            try {
                databaseService.connect(); // Connexion synchrone à la base locale
                console.log('✅ Base locale utilisée comme fallback');
            } catch (localError) {
                console.error('❌ Même la base locale a échoué:', localError.message);
            }
        }
        console.log(`⏱️ Phase 3 terminée en ${Date.now() - phase3Start}ms`);
        
        // ✅ SUPPRESSION de la synchro bloquante ici

        console.log('');
        console.log('📊 ===== PHASE 4: WEBSOCKET & ROUTES =====');
        const phase4Start = Date.now();
        initializeWebSocket();

        // --- NOUVEL ENDPOINT POUR LA DÉCOUVERTE DES PORTS ---
        app.get('/api/ports', (req, res) => {
            try {
                const portsFilePath = path.join(__dirname, '..', '.ports.json');
                if (fs.existsSync(portsFilePath)) {
                    const ports = JSON.parse(fs.readFileSync(portsFilePath, 'utf8'));
                    res.json({ success: true, ports });
                } else {
                    // En production ou si le fichier n'existe pas, retourner les ports par défaut
                    res.json({ success: true, ports: { http: API_PORT, websocket: WS_PORT } });
                }
            } catch (error) {
                res.status(500).json({ success: false, message: 'Erreur à la lecture des ports.' });
            }
        });
        // --- FIN DE L'ENDPOINT ---

        // ✅ NOUVEAU - Monter les routes d'authentification et notifications EN PREMIER
        app.use('/api/auth', authRoutes);
        app.use('/api/notifications', notificationRoutes);

        app.use('/api', apiRoutes(broadcast));
        app.use('/api/ai', aiRoutes(broadcast));
        app.use('/api/ai', aiMultimodalRoutes); // Routes multimodales (chat, upload, files)
        console.log('✅ Routes API configurées (standard + multimodal + auth + notifications).');
        console.log(`⏱️ Phase 4 terminée en ${Date.now() - phase4Start}ms`);

        // Démarrage des tâches de fond APRÈS que le serveur soit prêt
        console.log('');
        console.log('📊 ===== PHASE 5: TÂCHES DE FOND =====');
        startBackgroundTasks();

        if (isProduction) {
            const buildPath = path.join(__dirname, '..', 'build');
            app.use(express.static(buildPath));
            app.get('*', (req, res) => res.sendFile(path.join(buildPath, 'index.html')));
        }

        listenHttpServer(() => {
            const totalStartupTime = Date.now() - serverStartTime;
            console.log(`\n\n🚀 ===== SERVEUR PRÊT ! =====`);
            console.log(`   - API sur http://localhost:${API_PORT}`);
            console.log(`   - WebSocket sur le port ${WS_PORT}`);
            console.log(`   ⏱️ TEMPS DE DÉMARRAGE TOTAL: ${totalStartupTime}ms`);
            console.log(`==============================\n`);
        });
    } catch (error) {
        console.error("❌ ERREUR CRITIQUE AU DÉMARRAGE :", error.message);
        console.error("❌ Stack trace:", error.stack);
        console.error("❌ Erreur complète:", error);
        process.exit(1);
    }
}

console.log('🔍 [DEBUG] Appel de startServer()...');
try {
    startServer();
} catch (error) {
    console.error("❌ ERREUR LORS DE L'APPEL DE startServer():", error);
    process.exit(1);
}

process.on('SIGINT', () => {
    console.log('\nFermeture propre du serveur...');
    if (wss) wss.close();
    server.close(() => {
        databaseService.close();
        process.exit(0);
    });
});
