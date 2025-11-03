// server.js - Serveur simple avec gestion automatique des ports

const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { findAllPorts, savePorts } = require('./backend/utils/portUtils');

const app = express();
const server = http.createServer(app);

// Configuration CORS pour permettre les connexions depuis React
app.use(cors({
    origin: '*',
    credentials: true
}));

// Middleware pour parser JSON
app.use(express.json());

// Routes simples pour tester
app.get('/api/status', (req, res) => {
    res.json({ 
        message: 'Serveur DocuCortex IA fonctionne !',
        timestamp: new Date().toISOString(),
        pid: process.pid
    });
});

app.get('/api/ping', (req, res) => {
    res.json({ pong: 'PONG!' });
});

// Servir les fichiers statiques (pour production)
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'build')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'build', 'index.html'));
    });
}

/**
 * Démarre le serveur avec allocation automatique des ports
 */
async function startServer() {
    try {
        console.log('🚀 Démarrage de DocuCortex IA avec gestion automatique des ports...\n');
        
        // Trouver des ports disponibles
        const ports = await findAllPorts({
            http: { start: 3002, end: 3012, name: 'HTTP Server' },
            websocket: { start: 3003, end: 3013, name: 'WebSocket' }
        });

        // Sauvegarder la configuration des ports
        await savePorts(ports);
        
        const { http: httpPort, websocket: wsPort } = ports;

        // Démarrer le serveur
        const serverInstance = server.listen(httpPort, '0.0.0.0', () => {
            console.log('\n✅ SERVEUR DÉMARRÉ AVEC SUCCÈS !');
            console.log('='.repeat(50));
            console.log(`🌐 Serveur HTTP     : http://localhost:${httpPort}`);
            console.log(`📡 WebSocket        : ws://localhost:${wsPort}`);
            console.log(`🔗 API Status       : http://localhost:${httpPort}/api/status`);
            console.log(`🔗 API Ping         : http://localhost:${httpPort}/api/ping`);
            console.log(`🆔 PID              : ${process.pid}`);
            console.log('='.repeat(50));
            console.log('\n📝 Pour arrêter le serveur : Ctrl+C');
            console.log('🔧 Configuration sauvegardée dans .ports.json\n');
        });

        // Gestion de l'arrêt propre
        process.on('SIGINT', () => {
            console.log('\n🛑 Arrêt du serveur...');
            serverInstance.close(() => {
                console.log('✅ Serveur arrêté proprement');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('❌ ERREUR FATALE:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Démarrer le serveur
startServer();