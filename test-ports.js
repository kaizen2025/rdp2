// test-ports.js - Test ultra-simple de la gestion des ports

const { isPortAvailable, findAllPorts } = require('./backend/utils/portUtils');

async function testPortManagement() {
    console.log('🧪 Test de la gestion automatique des ports\n');
    
    try {
        // Test 1 : Vérifier si un port spécifique est disponible
        console.log('Test 1: Port 3000 disponible ?');
        const port3000Available = await isPortAvailable(3000);
        console.log(`✅ Port 3000: ${port3000Available ? 'DISPONIBLE' : 'OCCUPÉ'}\n`);

        // Test 2 : Allocation automatique de tous les ports
        console.log('Test 2: Allocation automatique de tous les ports...');
        const ports = await findAllPorts({
            http: { start: 3002, end: 3002, name: 'HTTP Server' },
            websocket: { start: 3003, end: 3003, name: 'WebSocket' }
        });
        
        console.log('✅ Allocation réussie!');
        console.log(`   HTTP Server: ${ports.http}`);
        console.log(`   WebSocket: ${ports.websocket}\n`);
        
        console.log('🎉 TOUS LES TESTS RÉUSSIS!');
        
    } catch (error) {
        console.error('❌ ERREUR:', error.message);
        console.error(error.stack);
    }
}

// Lancer le test
testPortManagement();