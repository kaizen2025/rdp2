// backend/utils/portUtils.js - Utilitaire de gestion automatique des ports

const net = require('net');

/**
 * Vérifie si un port est disponible
 * @param {number} port - Le port à tester
 * @returns {Promise<boolean>} - true si disponible, false sinon
 */
function isPortAvailable(port) {
    return new Promise((resolve) => {
        const server = net.createServer();

        server.once('error', (err) => {
            if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
                resolve(false);
            } else {
                resolve(false);
            }
        });

        server.once('listening', () => {
            server.close();
            resolve(true);
        });

        server.listen(port, '0.0.0.0');
    });
}

/**
 * Trouve un port disponible dans une plage
 * @param {number} startPort - Port de départ
 * @param {number} endPort - Port de fin (inclus)
 * @param {string} serviceName - Nom du service (pour logging)
 * @returns {Promise<number|null>} - Port disponible ou null si aucun trouvé
 */
async function findAvailablePort(startPort, endPort, serviceName = 'Service') {
    console.log(`🔍 Recherche d'un port disponible pour ${serviceName}...`);
    console.log(`   Plage testée : ${startPort}-${endPort}`);

    for (let port = startPort; port <= endPort; port++) {
        const available = await isPortAvailable(port);
        if (available) {
            console.log(`✅ Port ${port} disponible pour ${serviceName}`);
            return port;
        } else {
            console.log(`   ⚠️  Port ${port} occupé, test du suivant...`);
        }
    }

    console.error(`❌ Aucun port disponible dans la plage ${startPort}-${endPort} pour ${serviceName}`);
    return null;
}

/**
 * Trouve tous les ports nécessaires pour l'application
 * @param {Object} config - Configuration des ports
 * @returns {Promise<Object>} - Objet avec les ports disponibles
 */
async function findAllPorts(config = {}) {
    const defaults = {
        http: { start: 3002, end: 3012, name: 'HTTP Server' },
        websocket: { start: 3003, end: 3013, name: 'WebSocket' },
        react: { start: 3000, end: 3010, name: 'React Dev Server' }
    };

    const finalConfig = { ...defaults, ...config };
    const ports = {};

    console.log('\n=============================================');
    console.log('🔧 Allocation automatique des ports...');
    console.log('=============================================\n');

    // Trouver les ports dans l'ordre
    for (const [key, { start, end, name }] of Object.entries(finalConfig)) {
        const port = await findAvailablePort(start, end, name);
        if (port === null) {
            throw new Error(`Impossible de trouver un port disponible pour ${name}`);
        }
        ports[key] = port;
    }

    console.log('\n✅ Tous les ports ont été alloués avec succès:');
    console.log(`   • HTTP Server    : ${ports.http}`);
    console.log(`   • WebSocket      : ${ports.websocket}`);
    if (ports.react) {
        console.log(`   • React Dev      : ${ports.react}`);
    }
    console.log('');

    return ports;
}

/**
 * Attend qu'un port devienne disponible (avec timeout)
 * @param {number} port - Port à surveiller
 * @param {number} maxAttempts - Nombre maximum de tentatives
 * @param {number} delay - Délai entre les tentatives (ms)
 * @returns {Promise<boolean>}
 */
async function waitForPort(port, maxAttempts = 30, delay = 1000) {
    for (let i = 0; i < maxAttempts; i++) {
        const available = await isPortAvailable(port);
        if (!available) {
            return true; // Le port est utilisé (serveur démarré)
        }
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    return false;
}

/**
 * Vérifie qu'un serveur répond sur un port
 * @param {number} port - Port à tester
 * @param {string} host - Hôte (défaut: localhost)
 * @returns {Promise<boolean>}
 */
function checkServerResponding(port, host = 'localhost') {
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

        socket.connect(port, host);
    });
}

/**
 * Sauvegarde les ports utilisés dans un fichier pour les autres processus
 * @param {Object} ports - Ports à sauvegarder
 * @param {string} filePath - Chemin du fichier
 */
async function savePorts(ports, filePath = '.ports.json') {
    const fs = require('fs');
    const path = require('path');

    const portsData = {
        ...ports,
        timestamp: new Date().toISOString(),
        pid: process.pid
    };

    try {
        const fullPath = path.join(process.cwd(), filePath);
        await fs.promises.writeFile(fullPath, JSON.stringify(portsData, null, 2));
        console.log(`📝 Configuration des ports sauvegardée dans ${filePath}`);
    } catch (error) {
        console.warn(`⚠️  Impossible de sauvegarder les ports: ${error.message}`);
    }
}

/**
 * Charge les ports depuis un fichier
 * @param {string} filePath - Chemin du fichier
 * @returns {Promise<Object|null>}
 */
async function loadPorts(filePath = '.ports.json') {
    const fs = require('fs');
    const path = require('path');

    try {
        const fullPath = path.join(process.cwd(), filePath);
        const data = await fs.promises.readFile(fullPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return null;
    }
}

module.exports = {
    isPortAvailable,
    findAvailablePort,
    findAllPorts,
    waitForPort,
    checkServerResponding,
    savePorts,
    loadPorts
};