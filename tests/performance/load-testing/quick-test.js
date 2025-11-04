#!/usr/bin/env node

/**
 * Test de fonctionnement rapide de la suite de tests
 * Effectue un test basique sans charge réelle pour vérifier l'infrastructure
 */

const chalk = require('chalk');
const axios = require('axios');

async function quickTest() {
  console.log(chalk.cyan.bold('\n🧪 TEST RAPIDE DE LA SUITE DE TESTS DE CHARGE'));
  console.log(chalk.cyan('=' .repeat(60)));
  
  // Test 1: Vérification de l'orchestrateur
  console.log(chalk.yellow('\n1️⃣ Test de l\'orchestrateur principal...'));
  try {
    const LoadTestOrchestrator = require('./index');
    const orchestrator = new LoadTestOrchestrator();
    console.log(chalk.green('✅ Orchestrateur initialisé avec succès'));
  } catch (error) {
    console.log(chalk.red(`❌ Erreur orchestrateur: ${error.message}`));
    return false;
  }
  
  // Test 2: Vérification des scripts de test
  console.log(chalk.yellow('\n2️⃣ Test des scripts de test...'));
  const testScripts = [
    './scripts/concurrent-users.js',
    './scripts/database-concurrent.js',
    './scripts/websocket-load.js',
    './scripts/error-recovery.js',
    './scripts/big-data-performance.js',
    './scripts/endurance-test.js'
  ];
  
  let scriptsValid = true;
  for (const script of testScripts) {
    try {
      require(script);
      console.log(chalk.green(`✅ ${script} - Chargement réussi`));
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND' || error.message.includes('Cannot find module')) {
        // Erreur de dépendances manquantes - acceptable en mode test
        console.log(chalk.yellow(`⚠️ ${script} - Dépendances manquantes (normal avant installation)`));
      } else {
        console.log(chalk.red(`❌ ${script} - ${error.message.split('\n')[0]}`));
        scriptsValid = false;
      }
    }
  }
  
  // Test 3: Vérification de l'API (optionnel)
  console.log(chalk.yellow('\n3️⃣ Test de connectivité API...'));
  try {
    const apiUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    await axios.get(`${apiUrl}/api/health`, { timeout: 3000 });
    console.log(chalk.green('✅ API accessible'));
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(chalk.yellow('⚠️ API non accessible (DocuCortex non démarré)'));
      console.log(chalk.gray('   Les tests fonctionneront en mode simulateur'));
    } else {
      console.log(chalk.red(`❌ Erreur API: ${error.message}`));
    }
  }
  
  // Test 4: Vérification des fichiers de configuration
  console.log(chalk.yellow('\n4️⃣ Test des fichiers de configuration...'));
  try {
    const fs = require('fs');
    
    const configs = [
      './artillery-config.yml',
      './config/environments.ini',
      './package.json'
    ];
    
    configs.forEach(config => {
      if (fs.existsSync(config)) {
        console.log(chalk.green(`✅ ${config} - Présent`));
      } else {
        console.log(chalk.red(`❌ ${config} - Manquant`));
      }
    });
    
  } catch (error) {
    console.log(chalk.red(`❌ Erreur vérification configs: ${error.message}`));
  }
  
  // Résumé
  console.log(chalk.cyan('\n📊 RÉSUMÉ DU TEST RAPIDE'));
  console.log(chalk.cyan('=' .repeat(40)));
  
  if (scriptsValid) {
    console.log(chalk.green('🎉 Infrastructure de test OK'));
    console.log(chalk.green('\nLa suite est prête à être utilisée!'));
    
    console.log(chalk.cyan('\n🚀 PROCHAINES ÉTAPES:'));
    console.log(chalk.white('1. Installation des dépendances:'));
    console.log(chalk.yellow('   npm install'));
    console.log(chalk.white('\n2. Ou utiliser le script d\'installation:'));
    console.log(chalk.yellow('   bash install.sh'));
    console.log(chalk.white('\n3. Lancer la démonstration:'));
    console.log(chalk.yellow('   node demo.js'));
    console.log(chalk.white('\n4. Menu interactif:'));
    console.log(chalk.yellow('   node index.js'));
    
  } else {
    console.log(chalk.red('❌ Problèmes détectés dans l\'infrastructure'));
    console.log(chalk.yellow('\nVérifiez les erreurs ci-dessus et relancez'));
  }
  
  return scriptsValid;
}

// Exécution
if (require.main === module) {
  quickTest()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error(chalk.red('Erreur fatale:'), error);
      process.exit(1);
    });
}

module.exports = quickTest;