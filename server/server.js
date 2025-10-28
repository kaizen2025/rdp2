// server/server.js - VERSION FINALE, COMPLÈTE ET DÉFINITIVEMENT CORRIGÉE

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

const API_PORT = 3002;
const WS_PORT = 3003;

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ port: WS_PORT });

console.log("=============================================");
console.log(" Démarrage du serveur RDS Viewer...");
console.log("=============================================");

const allowedOrigins = [
  'http://localhost:3000',  // Port de développement React
  `http://localhost:${API_PORT}`,  // Port de production
  `http://192.168.1.232:${API_PORT}`,
  `http://${os.hostname()}:${API_PORT}`,
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`Origine non autorisée par CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json());

wss.on('connection', ws => {
  console.log('🔌 Nouveau client WebSocket connecté.');
  ws.on('close', () => console.log('🔌 Client WebSocket déconnecté.'));
  ws.on('error', (error) => console.error('❌ Erreur WebSocket:', error));
});

function broadcast(data) {
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
        await configService.loadConfigAsync();

        // La validation se fait maintenant à l'intérieur de loadConfigAsync.
        // On vérifie simplement l'état après le chargement.
        if (!configService.isConfigurationValid()) {
            console.error("\n❌ Démarrage interrompu en raison d'une configuration invalide. Veuillez corriger les erreurs listées ci-dessus et redémarrer le serveur.");

            // On expose quand même un endpoint de santé pour que le frontend puisse afficher un message clair.
            app.use('/api', apiRoutes(() => broadcast));
            server.listen(API_PORT, () => {
                console.log(`\n📡 Serveur démarré en mode dégradé sur http://localhost:${API_PORT}`);
                console.log("   Seul le diagnostic de configuration est actif.");
            });
            return; // Arrêter le processus de démarrage normal ici.
        }

        console.log('✅ Configuration chargée et validée.');

        databaseService.connect();
        console.log('✅ Base de données connectée.');

        app.use('/api', apiRoutes(() => broadcast));
        console.log('✅ Routes API configurées.');

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