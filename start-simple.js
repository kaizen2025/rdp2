// Démarrage simple de DocuCortex IA
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Démarrage de DocuCortex IA');
console.log('=' .repeat(50));

// Fonction pour démarrer React sur un port spécifique
function startReactOnPort(port) {
    console.log(`🔍 Test du port ${port}...`);
    
    const reactEnv = {
        ...process.env,
        PORT: port.toString(),
        BROWSER: 'none'
    };

    const react = spawn('npm', ['start'], {
        env: reactEnv,
        stdio: 'inherit',
        shell: true
    });

    react.on('error', (error) => {
        console.error(`❌ Erreur React sur port ${port}:`, error.message);
    });

    react.on('close', (code) => {
        console.log(`📊 React terminé avec code ${code}`);
    });
}

// Tester et démarrer sur différents ports
async function findWorkingPort() {
    const net = require('net');
    
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

    const ports = [3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010];
    
    for (const port of ports) {
        const available = await isPortAvailable(port);
        if (available) {
            console.log(`✅ Port ${port} disponible!`);
            console.log(`🌐 React démarrera sur: http://localhost:${port}`);
            console.log('=' .repeat(50));
            
            startReactOnPort(port);
            return;
        } else {
            console.log(`⚠️  Port ${port} occupé`);
        }
    }
    
    console.log('❌ Aucun port disponible dans la plage 3001-3010');
}

// Lancer la recherche
findWorkingPort();