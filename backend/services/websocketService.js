// backend/services/websocketService.js

const { WebSocketServer } = require('ws');

let wss = null;

function initialize(server, port) {
    wss = new WebSocketServer({ noServer: true });

    // Configuration du heartbeat pour détecter les connexions mortes
    const heartbeatInterval = setInterval(() => {
        wss.clients.forEach(ws => {
            if (ws.isAlive === false) {
                console.log('🔌 Connexion WebSocket morte détectée, fermeture...');
                return ws.terminate();
            }
            ws.isAlive = false;
            ws.ping();
        });
    }, 30000);

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

    // Attacher au serveur HTTP existant
    server.on('upgrade', (request, socket, head) => {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    });

    console.log(`✅ WebSocket initialisé et attaché au serveur HTTP sur le port ${port}`);
}

function broadcast(data) {
    if (!wss) {
        console.warn('[WebSocket] Tentative de broadcast avant initialisation.');
        return;
    }
    const jsonData = JSON.stringify(data);
    wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
            client.send(jsonData);
        }
    });
}

function getWss() {
    return wss;
}

module.exports = {
    initialize,
    broadcast,
    getWss
};
