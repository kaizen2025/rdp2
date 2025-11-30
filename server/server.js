// server/server.js - VERSION FINALE ULTRA-RAPIDE + DEBUG

// ... (tous les imports restent les mêmes)
const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');
const os = require('os');
const path = require('path');
const fs = require('fs');

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
const app = express();
const server = http.createServer(app);
let wss;

console.log("=============================================");
console.log(" Démarrage du serveur RDS Viewer...");
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
    wss = new WebSocketServer({ port: WS_PORT });
    
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
        console.log('🔍 [DEBUG] __dirname:', __dirname);
        console.log('🔍 [DEBUG] process.cwd():', process.cwd());
        console.log('🔍 [DEBUG] NODE_ENV:', process.env.NODE_ENV);
        console.log('🔍 [DEBUG] RUNNING_IN_ELECTRON:', process.env.RUNNING_IN_ELECTRON);

        const isProduction = process.env.NODE_ENV === 'production' || process.env.RUNNING_IN_ELECTRON === 'true';
        console.log('🔍 [DEBUG] isProduction:', isProduction);

        if (isProduction) {
            API_PORT = 3002; WS_PORT = 3003;
            console.log('✅ Mode PRODUCTION - Ports fixes:', { API_PORT, WS_PORT });
        } else {
            const ports = await findAllPorts({ http: { start: 3002, end: 3012 }, websocket: { start: 3003, end: 3013 } });
            API_PORT = ports.http; WS_PORT = ports.websocket;
            await savePorts(ports);
            console.log('✅ Mode DEV - Ports trouvés:', { API_PORT, WS_PORT });
        }

        await configService.loadConfigAsync();
        if (!configService.isConfigurationValid()) {
            console.error("\n❌ Démarrage en mode dégradé (config invalide).");
            app.use('/api', apiRoutes(() => {}));
            initializeWebSocket();
            server.listen(API_PORT, () => console.log(`\n📡 Serveur dégradé sur http://localhost:${API_PORT}`));
            return;
        }
        console.log('✅ Configuration chargée.');

        // Connexion à la base de données avec système de retry
        try {
            await databaseService.connectWithRetry();
            console.log('✅ Base de données connectée avec succès.');
        } catch (dbError) {
            console.error('⚠️  ATTENTION: Impossible de se connecter à la base de données.');
            console.error('   L\'application va démarrer en mode dégradé.');
            console.error('   Certaines fonctionnalités seront limitées.');
        }
        
        // ✅ SUPPRESSION de la synchro bloquante ici

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

        // ✅ Routes utilisateurs RDS (SQLite)
        app.use('/api/users', require('../backend/routes/userRoutes'));

        // ✅ Routes chat
        app.use('/api/chat', require('../backend/routes/chatRoutes'));

        // ✅ Routes préférences
        app.use('/api/preferences', require('../backend/routes/preferencesRoutes'));


        app.use('/api', apiRoutes(broadcast));
        app.use('/api/ai', aiRoutes(broadcast));
        app.use('/api/ai', aiMultimodalRoutes); // Routes multimodales (chat, upload, files)
        console.log('✅ Routes API configurées (standard + multimodal + auth + notifications + users + chat + preferences).');
        
        // Démarrage des tâches de fond APRÈS que le serveur soit prêt
        startBackgroundTasks();

        if (isProduction) {
            const buildPath = path.join(__dirname, '..', 'build');
            app.use(express.static(buildPath));
            app.get('*', (req, res) => res.sendFile(path.join(buildPath, 'index.html')));
        }

        server.listen(API_PORT, () => {
            console.log(`\n\n🚀 SERVEUR PRÊT !`);
            console.log(`   - API sur http://localhost:${API_PORT}`);
            console.log(`   - WebSocket sur le port ${WS_PORT}\n`);
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