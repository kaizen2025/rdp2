// server/server.js - VERSION AVEC GESTION AUTOMATIQUE DES PORTS

const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');
const os = require('os');
const path = require('path');

// --- IMPORTS DES SERVICES DE L'APPLICATION (CHEMINS CORRIGÉS) ---
const configService = require('../backend/services/configService');
const databaseService = require('../backend/services/databaseService');
const notificationService = require('../backend/services/notificationService');
const dataService = require('../backend/services/dataService');
const rdsService = require('../backend/services/rdsService');
const technicianService = require('../backend/services/technicianService');
const apiRoutes = require('./apiRoutes');
const { findAllPorts, savePorts } = require('../backend/utils/portUtils');

// Ports par défaut (seront ajustés automatiquement si occupés)
let API_PORT = 3002;
let WS_PORT = 3003;

const app = express();
const server = http.createServer(app);
let wss; // Sera initialisé après allocation des ports

console.log("=============================================");
console.log(" Démarrage du serveur RDS Viewer...");
console.log("=============================================");

// Fonction pour obtenir les origines autorisées (sera appelée après allocation des ports)
function getAllowedOrigins() {
  return [
    // Origines localhost
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004',
    'http://localhost:3005',
    'http://localhost:3006',
    'http://localhost:3007',
    'http://localhost:3008',
    'http://localhost:3009',
    'http://localhost:3010',
    // Origines 127.0.0.1 (équivalent localhost mais traité différemment par le navigateur)
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    'http://127.0.0.1:3003',
    'http://127.0.0.1:3004',
    'http://127.0.0.1:3005',
    'http://127.0.0.1:3006',
    'http://127.0.0.1:3007',
    'http://127.0.0.1:3008',
    'http://127.0.0.1:3009',
    'http://127.0.0.1:3010',
    // Origines dynamiques
    `http://localhost:${API_PORT}`,
    `http://127.0.0.1:${API_PORT}`,
    `http://192.168.1.232:${API_PORT}`,
    `http://${os.hostname()}:${API_PORT}`,
  ];
}

app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = getAllowedOrigins();
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`Origine non autorisée par CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json());

// Fonction pour initialiser WebSocket (sera appelée après allocation des ports)
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
  if (!wss) {
    console.warn('⚠️  WebSocket non initialisé, broadcast ignoré');
    return;
  }
  const jsonData = JSON.stringify(data);
  console.log(`🚀 Diffusion WebSocket : type=${data.type}, entity=${data.payload?.entity}`);
  wss.clients.forEach(client => {
    if (client.readyState === client.OPEN) {
      client.send(jsonData);
    }
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
                if (newNotifications && newNotifications.length > 0) {
                    console.log(`📢 ${newNotifications.length} nouvelle(s) notification(s) de prêt créée(s).`);
                    broadcast({ type: 'data_updated', payload: { entity: 'notifications' } });
                }
            }
        } catch (error) {
            console.error("❌ Erreur lors de la vérification des prêts:", error);
        }
    }, 15 * 60 * 1000);

    setInterval(async () => {
        console.log('🧹 Exécution de la tâche : Nettoyage des notifications...');
        try {
            await notificationService.cleanOldNotifications(90);
        } catch (error) {
            console.error("❌ Erreur lors du nettoyage des notifications:", error);
        }
    }, 24 * 60 * 60 * 1000);

    setInterval(async () => {
        try {
            await technicianService.updateAllTechniciansPresence();
        } catch (error) {
            console.error("❌ Erreur lors du nettoyage des présences:", error);
        }
    }, 2 * 60 * 1000);

    setInterval(async () => {
        console.log('🔄 Exécution de la tâche : Rafraîchissement des sessions RDS...');
        try {
            const result = await rdsService.refreshAndStoreRdsSessions();
            if (result.success) {
                broadcast({ type: 'data_updated', payload: { entity: 'rds_sessions' } });
            }
        } catch (error) {
            console.error("❌ Erreur lors du rafraîchissement des sessions RDS:", error);
        }
    }, 30 * 1000);

    console.log('✅ Tâches de fond planifiées.');
}

async function startServer() {
    try {
        // ========================================
        // ÉTAPE 1 : ALLOCATION AUTOMATIQUE DES PORTS
        // ========================================
        console.log('\n🔧 Allocation automatique des ports...\n');

        const ports = await findAllPorts({
            http: { start: 3002, end: 3012, name: 'HTTP Server' },
            websocket: { start: 3003, end: 3013, name: 'WebSocket' }
        });

        // Mettre à jour les ports globaux
        API_PORT = ports.http;
        WS_PORT = ports.websocket;

        // Sauvegarder les ports pour que React puisse les lire
        await savePorts(ports);

        console.log('✅ Ports alloués avec succès\n');

        // ========================================
        // ÉTAPE 2 : CHARGEMENT DE LA CONFIGURATION
        // ========================================
        await configService.loadConfigAsync();

        // La validation se fait maintenant à l'intérieur de loadConfigAsync.
        // On vérifie simplement l'état après le chargement.
        if (!configService.isConfigurationValid()) {
            console.error("\n❌ Démarrage interrompu en raison d'une configuration invalide. Veuillez corriger les erreurs listées ci-dessus et redémarrer le serveur.");

            // On expose quand même un endpoint de santé pour que le frontend puisse afficher un message clair.
            app.use('/api', apiRoutes(() => broadcast));

            // Initialiser WebSocket même en mode dégradé
            initializeWebSocket();

            server.listen(API_PORT, () => {
                console.log(`\n📡 Serveur démarré en mode dégradé sur http://localhost:${API_PORT}`);
                console.log(`   WebSocket actif sur ws://localhost:${WS_PORT}`);
                console.log("   Seul le diagnostic de configuration est actif.");
            });
            return; // Arrêter le processus de démarrage normal ici.
        }

        console.log('✅ Configuration chargée et validée.');

        // ========================================
        // ÉTAPE 3 : CONNEXION À LA BASE DE DONNÉES
        // ========================================
        databaseService.connect();
        console.log('✅ Base de données connectée.');

        // ========================================
        // ÉTAPE 4 : INITIALISATION WEBSOCKET
        // ========================================
        initializeWebSocket();

        // ========================================
        // ÉTAPE 5 : CONFIGURATION DES ROUTES API
        // ========================================
        app.use('/api', apiRoutes(() => broadcast));
        console.log('✅ Routes API configurées.');

        // ========================================
        // ÉTAPE 6 : DÉMARRAGE DES TÂCHES DE FOND
        // ========================================
        startBackgroundTasks();

        const buildPath = path.join(__dirname, '..', 'build');
        app.use(express.static(buildPath));
        app.get('*', (req, res) => {
          res.sendFile(path.join(buildPath, 'index.html'));
        });
        console.log(`✅ Service des fichiers statiques configuré pour servir depuis : ${buildPath}`);

        server.listen(API_PORT, () => {
            console.log(`\n📡 Serveur API et Web démarré sur http://localhost:${API_PORT}`);
            console.log(`   Accessible sur le réseau via http://${os.hostname()}:${API_PORT}`);
            console.log(`⚡ Serveur WebSocket à l'écoute sur le port ${WS_PORT}\n`);
        });

    } catch (error) {
        console.error("❌ ERREUR CRITIQUE AU DÉMARRAGE :", error);
        process.exit(1);
    }
}

startServer();

process.on('SIGINT', () => {
    console.log('\nSIGINT reçu. Fermeture propre du serveur...');
    wss.close();
    server.close(() => {
        databaseService.close();
        console.log('Serveur arrêté.');
        process.exit(0);
    });
});