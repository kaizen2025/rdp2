// start-electron-fixed.js - Démarrage Electron avec gestion simple des ports

const { spawn } = require('child_process');
const net = require('net');

console.log('🚀 DocuCortex IA - Démarrage avec gestion automatique des ports');
console.log('=' .repeat(70));

/**
 * Teste si un port est disponible
 */
function isPortAvailable(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', () => resolve(false));
        server.once('listening', () => {
            server.close();
            resolve(true);
        });
        server.listen(port, '0.0.0.0');
    });
}

/**
 * Trouve un port disponible pour React
 */
async function findReactPort() {
    const ports = [3000, 3001, 3002, 3003, 3004, 3005];
    
    console.log('🔍 Recherche d\'un port disponible pour React...');
    
    for (const port of ports) {
        const available = await isPortAvailable(port);
        if (available) {
            console.log(`✅ Port ${port} disponible pour React!`);
            return port;
        } else {
            console.log(`⚠️  Port ${port} occupé, test du suivant...`);
        }
    }
    
    throw new Error('Aucun port disponible dans la plage 3000-3005');
}

/**
 * Démarre React
 */
function startReact(port) {
    console.log(`🚀 Démarrage de React sur le port ${port}...`);
    
    const react = spawn('npm', ['start'], {
        env: {
            ...process.env,
            PORT: port.toString(),
            BROWSER: 'none'
        },
        stdio: 'inherit',
        shell: true
    });

    return react;
}

/**
 * Attend que React soit prêt puis démarre Electron
 */
function waitForReactAndStartElectron(react, reactPort) {
    console.log('⏳ Attente que React soit prêt...');
    
    setTimeout(() => {
        console.log(`🌐 React devrait être prêt sur: http://localhost:${reactPort}`);
        console.log(`🔄 Démarrage d'Electron...`);
        
        const electron = spawn('npx', ['electron', '.', '--no-sandbox'], {
            stdio: 'inherit',
            shell: true
        });

        electron.on('error', (error) => {
            console.error('❌ Erreur Electron:', error.message);
        });

        electron.on('close', (code) => {
            console.log(`📊 Electron terminé avec code ${code}`);
            react.kill('SIGINT');
        });

        // Gestion de l'arrêt
        process.on('SIGINT', () => {
            console.log('\n🛑 Arrêt de l\'application...');
            electron.kill('SIGINT');
            react.kill('SIGINT');
        });

    }, 8000); // Attendre 8 secondes pour que React démarre
}

/**
 * Fonction principale
 */
async function main() {
    try {
        // Trouver un port disponible pour React
        const reactPort = await findReactPort();
        
        // Créer un fichier de configuration simple
        const config = {
            react: reactPort,
            timestamp: new Date().toISOString()
        };
        
        require('fs').writeFileSync('.react-port.json', JSON.stringify(config, null, 2));
        console.log(`📝 Configuration sauvegardée dans .react-port.json`);
        
        // Démarrer React
        const react = startReact(reactPort);
        
        // Attendre React puis démarrer Electron
        waitForReactAndStartElectron(react, reactPort);
        
    } catch (error) {
        console.error('❌ ERREUR:', error.message);
        process.exit(1);
    }
}

// Lancer le script
main();