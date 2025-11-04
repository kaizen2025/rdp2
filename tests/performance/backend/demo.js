#!/usr/bin/env node

/**
 * Script de démonstration rapide des tests de performance
 * @file demo.js
 */

const path = require('path');
const PerformanceBenchmarkSuite = require('./index');

// Configuration de démonstration
const demoConfig = {
    environment: 'development',
    testTypes: 'api,database', // Seuls tests API et DB pour la démo
    outputDir: path.join(__dirname, 'results'),
    generateReports: true,
    verbose: true
};

async function runDemo() {
    console.log('🎯 Démonstration des tests de performance backend DocuCortex\n');
    console.log('⚠️  NOTE: Cette démo suppose que le serveur backend fonctionne sur localhost:3002');
    console.log('         Démarrez le serveur avec: cd /workspace/rdp/server && npm start\n');
    
    try {
        const suite = new PerformanceBenchmarkSuite(demoConfig);
        
        console.log('📋 Configuration de démonstration:');
        console.log(`   Environnement: ${demoConfig.environment}`);
        console.log(`   Tests: ${demoConfig.testTypes}`);
        console.log(`   Sortie: ${demoConfig.outputDir}\n`);
        
        await suite.initialize();
        await suite.runAllTests();
        
        console.log('\n🎉 Démonstration terminée !');
        console.log('📁 Consultez les résultats dans le dossier:', demoConfig.outputDir);
        
    } catch (error) {
        console.error('❌ Erreur lors de la démonstration:', error.message);
        console.log('\n💡 Vérifiez que:');
        console.log('   1. Le serveur backend fonctionne sur http://localhost:3002');
        console.log('   2. Les dépendances sont installées (npm install)');
        console.log('   3. Node.js version >= 14 est utilisé');
    }
}

// Si appelé directement
if (require.main === module) {
    runDemo();
}

module.exports = runDemo;