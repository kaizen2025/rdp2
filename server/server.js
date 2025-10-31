// server/server.js - VERSION FINALE, COMPLÈTE ET SIMPLIFIÉE

const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');
const os = require('os');
const path = require('path');
const fs = require('fs');

// --- IMPORTS DES SERVICES DE L'APPLICATION ---
const configService = require('../backend/services/configService');
const databaseService = require('../backend/services/databaseService');
const notificationService = require('../backend/services/notificationService');
const dataService = require('../backend/services/dataService');
const rdsService = require('../backend/services/rdsService');
const technicianService = require('../backend/services/technicianService');
const userService = require('../backend/services/userService');
const apiRoutes = require('./apiRoutes');
const { findAllPorts, savePorts, isPortAvailable } = require('../backend/utils/portUtils');

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
    wss.on('connection', ws => {
        console.log('🔌 Nouveau client WebSocket connecté.');
        ws.on('close', () => console.log('🔌 Client WebSocket déconnecté.'));
        ws.on('error', (error) => console.error('❌ Erreur WebSocket:', error));
    });
    console.log(`✅ WebSocket initialisé sur le port ${WS_PORT}`);
}

function broadcast(data) {
    if (!wss) return;
    const jsonData = JSON.stringify(data);
    console.log(`🚀 Diffusion WebSocket : type=${data.type}, entity=${data.payload?.entity}`);
    wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) client.send(jsonData);
    });
}

function startBackgroundTasks() {
    console.log('🕒 Planification des tâches de fond...');
    setInterval(async () => {
        console.log('🔍 Exécution de la tâche : Vérification des prêts...');
        try {
            const loans = await dataService.getLoans();
            const settings = await dataService.getLoanSettings();
            if (settings.autoNotifications) {
                const newNotifications = await notificationService.checkAllLoansForNotifications(loans, settings);
                if (newNotifications?.length > 0) {
                    console.log(`📢 ${newNotifications.length} nouvelle(s) notification(s) de prêt créée(s).`);
                    broadcast({ type: 'data_updated', payload: { entity: 'notifications' } });
                }
            }
        } catch (error) { console.error("❌ Erreur lors de la vérification des prêts:", error); }
    }, 15 * 60 * 1000);

    setInterval(() => technicianService.updateAllTechniciansPresence(), 2 * 60 * 1000);
    setInterval(async () => {
        console.log('🔄 Exécution de la tâche : Rafraîchissement des sessions RDS...');
        try {
            const result = await rdsService.refreshAndStoreRdsSessions();
            if (result.success) broadcast({ type: 'data_updated', payload: { entity: 'rds_sessions' } });
        } catch (error) { console.error("❌ Erreur lors du rafraîchissement des sessions RDS:", error); }
    }, 30 * 1000);
    console.log('✅ Tâches de fond planifiées.');
}

async function startServer() {
    try {
        const isProduction = process.env.NODE_ENV === 'production' || process.env.RUNNING_IN_ELECTRON === 'true';

        if (isProduction) {
            console.log('\n🔧 Mode Production : Utilisation des ports fixes.');
            API_PORT = 3002;
            WS_PORT = 3003;
            if (!(await isPortAvailable(API_PORT))) throw new Error(`Le port API ${API_PORT} est déjà utilisé.`);
            if (!(await isPortAvailable(WS_PORT))) throw new Error(`Le port WebSocket ${WS_PORT} est déjà utilisé.`);
        } else {
            console.log('\n🔧 Mode Développement : Allocation automatique des ports...\n');
            const ports = await findAllPorts({ http: { start: 3002, end: 3012 }, websocket: { start: 3003, end: 3013 } });
            API_PORT = ports.http;
            WS_PORT = ports.websocket;
            await savePorts(ports);
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

        databaseService.connect();
        console.log('✅ Base de données connectée.');
        
        const syncResult = await userService.syncUsersFromExcel(false);
        if (syncResult.success) console.log(`✅ ${syncResult.usersCount} utilisateurs synchronisés.`);
        else console.warn(`⚠️  Échec synchro: ${syncResult.error}`);

        initializeWebSocket();
        app.use('/api', apiRoutes(broadcast));
        console.log('✅ Routes API configurées.');
        startBackgroundTasks();

        if (isProduction) {
            const buildPath = path.join(__dirname, '..', 'build');
            app.use(express.static(buildPath));
            app.get('*', (req, res) => res.sendFile(path.join(buildPath, 'index.html')));
            console.log(`✅ Service des fichiers statiques configuré.`);
        }

        server.listen(API_PORT, () => {
            console.log(`\n📡 Serveur API démarré sur http://localhost:${API_PORT}`);
            console.log(`⚡ WebSocket à l'écoute sur le port ${WS_PORT}`);
        });
    } catch (error) {
        console.error("❌ ERREUR CRITIQUE AU DÉMARRAGE :", error.message);
        process.exit(1);
    }
}

startServer();

process.on('SIGINT', () => {
    console.log('\nFermeture propre du serveur...');
    if (wss) wss.close();
    server.close(() => {
        databaseService.close();
        process.exit(0);
    });
});