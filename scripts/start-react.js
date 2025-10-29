// scripts/start-react.js - Script de démarrage intelligent pour React

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { findAvailablePort } = require('../backend/utils/portUtils');

const PORTS_FILE = path.join(process.cwd(), '.ports.json');
const ENV_FILE = path.join(process.cwd(), '.env.local');
const MAX_WAIT = 30000; // 30 secondes max pour attendre le serveur
const CHECK_INTERVAL = 500; // Vérifier toutes les 500ms

console.log('=============================================');
console.log(' Démarrage de React Dev Server...');
console.log('=============================================\n');

/**
 * Attend que le fichier .ports.json soit créé par le serveur
 */
async function waitForPortsFile() {
    const startTime = Date.now();

    console.log('⏳ Attente du démarrage du serveur backend...');

    return new Promise((resolve, reject) => {
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;

            if (fs.existsSync(PORTS_FILE)) {
                clearInterval(interval);
                console.log('✅ Serveur backend détecté\n');
                resolve();
            } else if (elapsed > MAX_WAIT) {
                clearInterval(interval);
                console.warn('⚠️  Timeout - Le serveur backend n\'a pas créé le fichier de ports');
                console.warn('   Utilisation des ports par défaut\n');
                resolve(); // On continue quand même
            }
        }, CHECK_INTERVAL);
    });
}

/**
 * Lit les ports depuis le fichier .ports.json
 */
function readPorts() {
    try {
        if (fs.existsSync(PORTS_FILE)) {
            const data = fs.readFileSync(PORTS_FILE, 'utf8');
            const ports = JSON.parse(data);
            console.log('📖 Configuration des ports lue:');
            console.log(`   • Serveur HTTP  : ${ports.http}`);
            console.log(`   • WebSocket     : ${ports.websocket}\n`);
            return ports;
        }
    } catch (error) {
        console.warn(`⚠️  Erreur lecture des ports: ${error.message}`);
    }

    // Ports par défaut si le fichier n'existe pas
    console.log('📖 Utilisation des ports par défaut\n');
    return {
        http: 3002,
        websocket: 3003
    };
}

/**
 * Trouve un port disponible pour React dans la plage 3000-3010
 */
async function findReactPort() {
    console.log('🔍 Recherche d\'un port disponible pour React...');

    for (let port = 3000; port <= 3010; port++) {
        const { isPortAvailable } = require('../backend/utils/portUtils');
        if (await isPortAvailable(port)) {
            console.log(`✅ Port React: ${port}\n`);
            return port;
        }
    }

    throw new Error('Aucun port disponible dans la plage 3000-3010');
}

/**
 * Crée ou met à jour le fichier .env.local
 */
function createEnvFile(reactPort, serverPort, wsPort) {
    console.log('📝 Configuration de .env.local...');

    const envContent = `# Configuration générée automatiquement par start-react.js
# Ne pas modifier manuellement - Ce fichier est écrasé à chaque démarrage

# Port pour le serveur de développement React
PORT=${reactPort}

# URL du serveur backend
REACT_APP_API_URL=http://localhost:${serverPort}/api

# URL du WebSocket
REACT_APP_WS_URL=ws://localhost:${wsPort}

# N'ouvre pas automatiquement le navigateur
BROWSER=none

# Génération de source maps rapide pour le dev
GENERATE_SOURCEMAP=true
`;

    try {
        fs.writeFileSync(ENV_FILE, envContent, 'utf8');
        console.log('✅ .env.local créé avec succès');
        console.log(`   React sera sur: http://localhost:${reactPort}`);
        console.log(`   API sera sur  : http://localhost:${serverPort}/api`);
        console.log(`   WebSocket sur : ws://localhost:${wsPort}\n`);
    } catch (error) {
        console.error(`❌ Erreur création .env.local: ${error.message}`);
        throw error;
    }
}

/**
 * Démarre react-scripts
 */
function startReactScripts() {
    console.log('🚀 Lancement de react-scripts start...\n');
    console.log('=============================================\n');

    // Utiliser cross-platform spawn
    const isWindows = process.platform === 'win32';
    const command = isWindows ? 'npm.cmd' : 'npm';

    const reactProcess = spawn(command, ['start'], {
        stdio: 'inherit',
        shell: true,
        env: {
            ...process.env,
            // Force le rechargement du .env.local
            FORCE_COLOR: '1'
        }
    });

    reactProcess.on('error', (error) => {
        console.error(`❌ Erreur lors du démarrage de React: ${error.message}`);
        process.exit(1);
    });

    reactProcess.on('close', (code) => {
        console.log(`\n📊 React Dev Server terminé avec le code ${code}`);
        process.exit(code);
    });

    // Gestion du CTRL+C
    process.on('SIGINT', () => {
        console.log('\n\n🛑 Arrêt du serveur React...');
        reactProcess.kill('SIGINT');
    });

    process.on('SIGTERM', () => {
        reactProcess.kill('SIGTERM');
    });
}

/**
 * Fonction principale
 */
async function main() {
    try {
        // Étape 1 : Attendre que le serveur backend soit prêt
        await waitForPortsFile();

        // Étape 2 : Lire les ports du serveur
        const ports = readPorts();

        // Étape 3 : Trouver un port disponible pour React
        const reactPort = await findReactPort();

        // Étape 4 : Créer le fichier .env.local
        createEnvFile(reactPort, ports.http, ports.websocket);

        // Étape 5 : Démarrer React
        startReactScripts();

    } catch (error) {
        console.error(`\n❌ ERREUR FATALE: ${error.message}`);
        console.error(error.stack);
        process.exit(1);
    }
}

// Démarrage
main();
