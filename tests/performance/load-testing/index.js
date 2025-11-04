#!/usr/bin/env node

/**
 * Orchestrateur principal pour la suite de tests de charge
 * Coordonne l'exécution de tous les tests de stabilité et performance
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Import des classes de test
const ConcurrentUsersTest = require('./scripts/concurrent-users');
const DatabaseConcurrentTest = require('./scripts/database-concurrent');
const WebSocketLoadTest = require('./scripts/websocket-load');
const ErrorRecoveryTest = require('./scripts/error-recovery');
const BigDataPerformanceTest = require('./scripts/big-data-performance');
const EnduranceTest = require('./scripts/endurance-test');

class LoadTestOrchestrator {
  constructor() {
    this.config = {
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
      mysqlConfig: {
        host: process.env.MYSQL_HOST || 'localhost',
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'docucortex_test'
      },
      postgresConfig: {
        host: process.env.PG_HOST || 'localhost',
        user: process.env.PG_USER || 'postgres',
        password: process.env.PG_PASSWORD || '',
        database: process.env.PG_DATABASE || 'docucortex_test'
      }
    };

    this.testResults = {
      concurrentUsers: null,
      databaseConcurrent: null,
      websocketLoad: null,
      errorRecovery: null,
      bigDataPerformance: null,
      enduranceTest: null,
      artilleryRun: null
    };

    this.executionSummary = {
      totalTests: 0,
      completedTests: 0,
      failedTests: 0,
      totalDuration: 0,
      startTime: 0,
      endTime: 0
    };
  }

  // Vérification de l'environnement
  async verifyEnvironment() {
    console.log(chalk.blue('🔍 Vérification de l\'environnement de test...'));
    
    const checks = [
      { name: 'API Endpoint', test: this.checkAPI },
      { name: 'Node.js Version', test: this.checkNodeVersion },
      { name: 'Dependencies', test: this.checkDependencies },
      { name: 'Network', test: this.checkNetwork }
    ];

    const results = await Promise.all(
      checks.map(async (check) => {
        try {
          await check.test();
          return { name: check.name, status: '✅', error: null };
        } catch (error) {
          return { name: check.name, status: '❌', error: error.message };
        }
      })
    );

    console.log(chalk.cyan('\n📋 RÉSULTATS DE VÉRIFICATION:'));
    results.forEach(result => {
      const status = result.status === '✅' ? chalk.green(result.status) : chalk.red(result.status);
      console.log(`   ${status} ${result.name}`);
      if (result.error) {
        console.log(chalk.red(`      Erreur: ${result.error}`));
      }
    });

    const hasErrors = results.some(r => r.status === '❌');
    if (hasErrors) {
      console.log(chalk.red('\n⚠️ Des problèmes ont été détectés. Continuer quand même ? (y/N)'));
      const answer = await this.getUserInput();
      if (answer.toLowerCase() !== 'y') {
        throw new Error('Tests interrompus par l\'utilisateur');
      }
    }

    return !hasErrors;
  }

  async checkAPI() {
    try {
      const response = await require('axios').get(`${this.config.apiBaseUrl}/api/health`, { timeout: 5000 });
      if (response.status !== 200 && response.status !== 404) {
        throw new Error(`Status code: ${response.status}`);
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('API non disponible - vérifier que le serveur fonctionne');
      }
      throw error;
    }
  }

  async checkNodeVersion() {
    const version = process.version;
    const majorVersion = parseInt(version.slice(1).split('.')[0]);
    if (majorVersion < 14) {
      throw new Error(`Node.js ${version} - version minimale requise: 14.0.0`);
    }
  }

  async checkDependencies() {
    const requiredDeps = ['loadtest', 'ws', 'axios', 'chalk', 'mysql2', 'pg'];
    const missingDeps = [];
    
    for (const dep of requiredDeps) {
      try {
        require(dep);
      } catch (error) {
        missingDeps.push(dep);
      }
    }
    
    if (missingDeps.length > 0) {
      throw new Error(`Dépendances manquantes: ${missingDeps.join(', ')}`);
    }
  }

  async checkNetwork() {
    const dns = require('dns');
    const { promisify } = require('util');
    const lookup = promisify(dns.lookup);
    
    try {
      const result = await lookup('localhost');
      if (!result) {
        throw new Error('Résolution DNS locale échouée');
      }
    } catch (error) {
      throw new Error('Problème de connectivité réseau');
    }
  }

  // Exécution séquentielle des tests
  async runAllTests(options = {}) {
    console.log(chalk.magenta.bold('\n🚀 ORCHESTRATEUR DE TESTS DE CHARGE - DOCUCORTEX'));
    console.log(chalk.magenta('=' .repeat(80)));

    this.executionSummary.startTime = Date.now();

    try {
      // Vérification de l'environnement
      if (!options.skipEnvironmentCheck) {
        await this.verifyEnvironment();
      }

      // Configuration des variables d'environnement
      this.setupEnvironmentVariables();

      // Menu de sélection des tests
      const selectedTests = options.tests || await this.selectTests();
      
      if (selectedTests.length === 0) {
        console.log(chalk.yellow('Aucun test sélectionné. Fin du programme.'));
        return;
      }

      this.executionSummary.totalTests = selectedTests.length;

      // Exécution des tests sélectionnés
      for (const testName of selectedTests) {
        console.log(chalk.cyan(`\n📋 Exécution du test: ${testName}`));
        await this.executeTest(testName, options);
      }

      // Génération du rapport final
      await this.generateFinalReport(options);

    } catch (error) {
      console.error(chalk.red.bold('\n❌ ERREUR CRITIQUE:'), error.message);
      this.executionSummary.failedTests = this.executionSummary.totalTests;
    } finally {
      this.executionSummary.endTime = Date.now();
      this.executionSummary.totalDuration = this.executionSummary.endTime - this.executionSummary.startTime;
      
      this.printExecutionSummary();
    }
  }

  async selectTests() {
    const availableTests = [
      { id: 'concurrentUsers', name: 'Utilisateurs Concurrents (10-50)', description: 'Test de simulation d\'utilisateurs simultanés' },
      { id: 'databaseConcurrent', name: 'Base de Données Concurrente', description: 'Test d\'accès concurrent à la base de données' },
      { id: 'websocketLoad', name: 'Charge WebSocket', description: 'Test de stabilité lors de pics de charge WebSocket' },
      { id: 'errorRecovery', name: 'Récupération après Erreurs', description: 'Test de récupération après erreurs sous charge' },
      { id: 'bigDataPerformance', name: 'Performance Données Volumineuses', description: 'Test avec 10000+ enregistrements' },
      { id: 'enduranceTest', name: 'Test d\'Endurance', description: 'Test d\'endurance sur plusieurs heures' },
      { id: 'artilleryRun', name: 'Test Artillery', description: 'Test de charge avec Artillery.io' }
    ];

    console.log(chalk.cyan('\n📋 TESTS DISPONIBLES:'));
    availableTests.forEach((test, index) => {
      console.log(chalk.white(`   ${index + 1}. ${test.name}`));
      console.log(chalk.gray(`      ${test.description}\n`));
    });

    console.log(chalk.yellow('Sélectionnez les tests à exécuter (ex: 1,3,5 ou "all" pour tous): '));
    
    try {
      const answer = await this.getUserInput();
      
      if (answer.toLowerCase() === 'all') {
        return availableTests.map(test => test.id);
      }
      
      const indices = answer.split(',').map(x => parseInt(x.trim()) - 1).filter(x => x >= 0 && x < availableTests.length);
      return indices.map(i => availableTests[i].id);
      
    } catch (error) {
      console.log(chalk.yellow('Sélection invalide, exécution de tous les tests...'));
      return availableTests.map(test => test.id);
    }
  }

  async executeTest(testName, options) {
    const startTime = Date.now();
    
    try {
      let testInstance;
      
      switch (testName) {
        case 'concurrentUsers':
          testInstance = new ConcurrentUsersTest();
          await testInstance.runConcurrentUsersTest(50, '2m');
          await testInstance.runVariedActionsTest();
          await testInstance.runRampUpTest();
          testInstance.saveResults();
          break;
          
        case 'databaseConcurrent':
          testInstance = new DatabaseConcurrentTest();
          await testInstance.initialize();
          await testInstance.testConcurrentInserts('test_concurrent', 1000);
          await testInstance.testConcurrentReads('test_concurrent', 1000);
          await testInstance.testMixedOperations();
          await testInstance.testAPIDatabaseOperations();
          testInstance.printReport();
          testInstance.saveResults();
          await testInstance.cleanup();
          break;
          
        case 'websocketLoad':
          testInstance = new WebSocketLoadTest();
          await testInstance.testMassiveConnections(50, '2m');
          await testInstance.testTrafficSpikes();
          await testInstance.testErrorHandling();
          testInstance.printReport();
          testInstance.saveResults();
          testInstance.closeAllConnections();
          break;
          
        case 'errorRecovery':
          testInstance = new ErrorRecoveryTest();
          testInstance.startBackgroundLoad(20, 600000);
          await testInstance.testServiceRestartRecovery();
          await testInstance.testDatabaseFailoverRecovery();
          await testInstance.testNetworkPartitionRecovery();
          await testInstance.testOverloadRecovery();
          await testInstance.testWebSocketReconnection();
          testInstance.printReport();
          testInstance.saveResults();
          testInstance.stopBackgroundLoad();
          break;
          
        case 'bigDataPerformance':
          testInstance = new BigDataPerformanceTest();
          await testInstance.initialize();
          await testInstance.generateBigData(10000);
          await testInstance.testSearchPerformance();
          await testInstance.testDatabaseOperations();
          await testInstance.testAPIPerformance();
          testInstance.printReport();
          testInstance.saveResults();
          await testInstance.cleanup();
          break;
          
        case 'enduranceTest':
          testInstance = new EnduranceTest();
          const duration = options.enduranceDuration || '2h';
          const targetLoad = options.enduranceLoad || 30;
          await testInstance.startEnduranceTest(duration, targetLoad);
          testInstance.printFinalReport();
          testInstance.saveResults();
          break;
          
        case 'artilleryRun':
          await this.runArtilleryTest();
          break;
          
        default:
          throw new Error(`Test inconnu: ${testName}`);
      }
      
      this.testResults[testName] = {
        success: true,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
      
      this.executionSummary.completedTests++;
      
      console.log(chalk.green(`✅ Test ${testName} terminé en ${((Date.now() - startTime)/1000).toFixed(2)}s`));
      
    } catch (error) {
      this.testResults[testName] = {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
      
      this.executionSummary.failedTests++;
      
      console.error(chalk.red(`❌ Test ${testName} échoué: ${error.message}`));
      
      // Continuer avec les autres tests même en cas d'échec
    }
  }

  async runArtilleryTest() {
    return new Promise((resolve, reject) => {
      const artillery = spawn('npx', ['artillery', 'run', 'artillery-config.yml'], {
        stdio: 'inherit',
        cwd: __dirname
      });

      artillery.on('close', (code) => {
        if (code === 0) {
          this.testResults.artilleryRun = {
            success: true,
            duration: 0, // Artillery gère ses propres timings
            timestamp: new Date().toISOString()
          };
          console.log(chalk.green('✅ Test Artillery terminé'));
          resolve();
        } else {
          const error = new Error(`Artillery terminé avec le code ${code}`);
          this.testResults.artilleryRun = {
            success: false,
            error: error.message,
            duration: 0,
            timestamp: new Date().toISOString()
          };
          reject(error);
        }
      });

      artillery.on('error', (error) => {
        this.testResults.artilleryRun = {
          success: false,
          error: error.message,
          duration: 0,
          timestamp: new Date().toISOString()
        };
        reject(error);
      });
    });
  }

  setupEnvironmentVariables() {
    process.env.API_BASE_URL = this.config.apiBaseUrl;
    process.env.MYSQL_HOST = this.config.mysqlConfig.host;
    process.env.MYSQL_USER = this.config.mysqlConfig.user;
    process.env.MYSQL_PASSWORD = this.config.mysqlConfig.password;
    process.env.MYSQL_DATABASE = this.config.mysqlConfig.database;
    process.env.PG_HOST = this.config.postgresConfig.host;
    process.env.PG_USER = this.config.postgresConfig.user;
    process.env.PG_PASSWORD = this.config.postgresConfig.password;
    process.env.PG_DATABASE = this.config.postgresConfig.database;
  }

  async generateFinalReport(options) {
    console.log(chalk.cyan('\n📊 GÉNÉRATION DU RAPPORT FINAL...'));
    
    const reportData = {
      timestamp: new Date().toISOString(),
      testSuite: 'Load Testing Suite - DocuCortex',
      execution: this.executionSummary,
      results: this.testResults,
      configuration: {
        apiUrl: this.config.apiBaseUrl,
        database: {
          mysql: this.config.mysqlConfig,
          postgres: this.config.postgresConfig
        }
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: process.memoryUsage(),
        uptime: process.uptime()
      }
    };

    // Sauvegarder le rapport principal
    const reportPath = path.join(__dirname, 'reports', 'load-test-orchestrator-report.json');
    const reportsDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    // Générer un rapport HTML simple
    await this.generateHTMLReport(reportData);
    
    console.log(chalk.green(`📁 Rapport principal sauvegardé: ${reportPath}`));
  }

  async generateHTMLReport(reportData) {
    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport de Tests de Charge - DocuCortex</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #007bff; }
        .success { border-left-color: #28a745; }
        .failure { border-left-color: #dc3545; }
        .warning { border-left-color: #ffc107; }
        .test-results { margin-top: 20px; }
        .test-item { margin-bottom: 15px; padding: 15px; background: #f8f9fa; border-radius: 6px; }
        .test-name { font-weight: bold; margin-bottom: 5px; }
        .test-status { display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 12px; font-weight: bold; }
        .status-success { background: #d4edda; color: #155724; }
        .status-failure { background: #f8d7da; color: #721c24; }
        .duration { color: #6c757d; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Rapport de Tests de Charge - DocuCortex</h1>
            <p>Exécuté le ${new Date(reportData.timestamp).toLocaleString('fr-FR')}</p>
        </div>
        
        <div class="summary">
            <div class="metric ${reportData.execution.failedTests === 0 ? 'success' : 'warning'}">
                <h3>${reportData.execution.completedTests}</h3>
                <p>Tests Réussis</p>
            </div>
            <div class="metric ${reportData.execution.failedTests > 0 ? 'failure' : 'success'}">
                <h3>${reportData.execution.failedTests}</h3>
                <p>Tests Échoués</p>
            </div>
            <div class="metric">
                <h3>${Math.round(reportData.execution.totalDuration / 1000 / 60)} min</h3>
                <p>Durée Totale</p>
            </div>
            <div class="metric">
                <h3>${Math.round((reportData.execution.completedTests / reportData.execution.totalTests) * 100)}%</h3>
                <p>Taux de Réussite</p>
            </div>
        </div>
        
        <div class="test-results">
            <h2>📋 Détail des Tests</h2>
            ${Object.entries(reportData.results).map(([testName, result]) => `
                <div class="test-item">
                    <div class="test-name">${this.formatTestName(testName)}</div>
                    <div>
                        <span class="test-status ${result.success ? 'status-success' : 'status-failure'}">
                            ${result.success ? '✅ RÉUSSI' : '❌ ÉCHOUÉ'}
                        </span>
                        <span class="duration">
                            ${result.duration ? ` - ${Math.round(result.duration / 1000)}s` : ''}
                        </span>
                    </div>
                    ${result.error ? `<div style="color: #dc3545; margin-top: 5px;">${result.error}</div>` : ''}
                </div>
            `).join('')}
        </div>
        
        <div style="margin-top: 30px; padding: 15px; background: #e9ecef; border-radius: 6px;">
            <h3>🔧 Configuration</h3>
            <p><strong>API URL:</strong> ${reportData.configuration.apiUrl}</p>
            <p><strong>Node.js:</strong> ${reportData.environment.nodeVersion}</p>
            <p><strong>Platform:</strong> ${reportData.environment.platform} ${reportData.environment.arch}</p>
        </div>
    </div>
</body>
</html>`;

    const htmlPath = path.join(__dirname, 'reports', 'load-test-report.html');
    fs.writeFileSync(htmlPath, htmlContent);
    console.log(chalk.green(`📄 Rapport HTML généré: ${htmlPath}`));
  }

  formatTestName(testName) {
    const names = {
      concurrentUsers: 'Utilisateurs Concurrents',
      databaseConcurrent: 'Base de Données Concurrente',
      websocketLoad: 'Charge WebSocket',
      errorRecovery: 'Récupération après Erreurs',
      bigDataPerformance: 'Performance Données Volumineuses',
      enduranceTest: 'Test d\'Endurance',
      artilleryRun: 'Test Artillery'
    };
    return names[testName] || testName;
  }

  printExecutionSummary() {
    console.log(chalk.cyan('\n📊 RÉSUMÉ D\'EXÉCUTION'));
    console.log(chalk.white('═'.repeat(50)));
    console.log(`⏱️  Durée totale: ${this.formatTime(this.executionSummary.totalDuration)}`);
    console.log(`🔢 Tests total: ${this.executionSummary.totalTests}`);
    console.log(`✅ Tests réussis: ${this.executionSummary.completedTests}`);
    console.log(`❌ Tests échoués: ${this.executionSummary.failedTests}`);
    const successRate = this.executionSummary.totalTests > 0 ? 
      (this.executionSummary.completedTests / this.executionSummary.totalTests) * 100 : 0;
    console.log(`📊 Taux de réussite: ${successRate.toFixed(1)}%`);
    
    if (this.executionSummary.failedTests > 0) {
      console.log(chalk.yellow('\n⚠️ TESTS ÉCHOUÉS:'));
      Object.entries(this.testResults)
        .filter(([, result]) => !result.success)
        .forEach(([testName, result]) => {
          console.log(chalk.red(`   ❌ ${testName}: ${result.error}`));
        });
    }
  }

  formatTime(milliseconds) {
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  async getUserInput() {
    return new Promise((resolve) => {
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
      
      process.stdin.on('data', (data) => {
        process.stdin.pause();
        resolve(data.trim());
      });
    });
  }

  // Aide en ligne de commande
  static showHelp() {
    console.log(chalk.cyan(`
🧪 ORCHESTRATEUR DE TESTS DE CHARGE - DOCUCORTEX

Usage: node index.js [options]

Options:
  --help, -h          Afficher cette aide
  --skip-checks       Ignorer les vérifications d'environnement
  --test <name>       Exécuter un test spécifique
  --duration <time>   Durée pour le test d'endurance (ex: 2h, 30m)
  --load <number>     Charge cible pour les tests (nombre d'utilisateurs)
  --stress-test       Inclure les tests de stress avancés
  --all               Exécuter tous les tests

Tests disponibles:
  concurrentUsers      - Test d'utilisateurs concurrents (10-50)
  databaseConcurrent   - Test d'accès concurrent à la DB
  websocketLoad        - Test de charge WebSocket
  errorRecovery        - Test de récupération après erreurs
  bigDataPerformance   - Test avec données volumineuses (10000+)
  enduranceTest        - Test d'endurance sur plusieurs heures
  artilleryRun         - Test avec Artillery.io

Exemples:
  node index.js                           # Menu interactif
  node index.js --all                     # Tous les tests
  node index.js --test enduranceTest --duration 4h
  node index.js --test concurrentUsers --stress-test

Variables d'environnement:
  API_BASE_URL          # URL de base de l'API (défaut: http://localhost:3000)
  MYSQL_HOST/USER/PASS  # Configuration MySQL
  PG_HOST/USER/PASS     # Configuration PostgreSQL

Auteur: DocuCortex Team
Version: 1.0.0
`));
  }
}

// Point d'entrée principal
async function main() {
  const args = process.argv.slice(2);
  
  // Traitement des arguments de ligne de commande
  const options = {
    skipEnvironmentCheck: args.includes('--skip-checks') || args.includes('--skip'),
    tests: [],
    enduranceDuration: '2h',
    enduranceLoad: 30,
    stressTest: args.includes('--stress-test')
  };

  // Argument --help
  if (args.includes('--help') || args.includes('-h')) {
    LoadTestOrchestrator.showHelp();
    return;
  }

  // Argument --test
  const testIndex = args.indexOf('--test');
  if (testIndex !== -1 && args[testIndex + 1]) {
    options.tests = [args[testIndex + 1]];
  }

  // Argument --all
  if (args.includes('--all')) {
    options.tests = [
      'concurrentUsers',
      'databaseConcurrent', 
      'websocketLoad',
      'errorRecovery',
      'bigDataPerformance',
      'enduranceTest',
      'artilleryRun'
    ];
  }

  // Argument --duration
  const durationIndex = args.indexOf('--duration');
  if (durationIndex !== -1 && args[durationIndex + 1]) {
    options.enduranceDuration = args[durationIndex + 1];
  }

  // Argument --load
  const loadIndex = args.indexOf('--load');
  if (loadIndex !== -1 && args[loadIndex + 1]) {
    options.enduranceLoad = parseInt(args[loadIndex + 1]) || 30;
  }

  // Exécution
  const orchestrator = new LoadTestOrchestrator();
  
  try {
    await orchestrator.runAllTests(options);
  } catch (error) {
    console.error(chalk.red.bold('\n💥 ERREUR FATALE:'), error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = LoadTestOrchestrator;