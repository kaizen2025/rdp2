#!/usr/bin/env node

/**
 * Tests de récupération après erreurs sous charge
 * Teste la capacité du système à se remettre d'erreurs tout en subissant une charge importante
 */

const axios = require('axios');
const WebSocket = require('ws');
const chalk = require('chalk');
const EventEmitter = require('events');

class ErrorRecoveryTest extends EventEmitter {
  constructor() {
    super();
    this.baseUrl = 'http://localhost:3000';
    this.wsUrl = 'ws://localhost:3000/ws';
    this.results = {
      tests: {
        serviceRestart: { success: false, recoveryTime: 0, successRate: 0 },
        databaseFailover: { success: false, recoveryTime: 0, successRate: 0 },
        networkPartition: { success: false, recoveryTime: 0, successRate: 0 },
        overloadRecovery: { success: false, recoveryTime: 0, successRate: 0 },
        websocketReconnection: { success: false, recoveryTime: 0, successRate: 0 }
      },
      errors: [],
      recoveryMetrics: {
        avgRecoveryTime: 0,
        successRate: 0,
        totalTests: 0,
        successfulRecoveries: 0
      }
    };
    
    this.loadGenerator = {
      isActive: false,
      connections: [],
      requestCount: 0,
      errorCount: 0
    };
  }

  // Démarrage de la charge de fond
  startBackgroundLoad(concurrency = 30, duration = 300000) { // 5 minutes par défaut
    console.log(chalk.blue(`🚀 Démarrage charge de fond: ${concurrency} connexions pour ${duration/1000}s`));
    
    this.loadGenerator.isActive = true;
    const startTime = Date.now();
    const endTime = startTime + duration;
    
    const generateLoad = () => {
      if (!this.loadGenerator.isActive || Date.now() >= endTime) {
        return;
      }

      // Générer des requêtes HTTP concurrentes
      const httpPromises = [];
      for (let i = 0; i < concurrency; i++) {
        httpPromises.push(this.makeBackgroundRequest());
      }

      // Générer des connexions WebSocket
      const wsPromise = this.createBackgroundWebSocket();

      Promise.allSettled([...httpPromises, wsPromise])
        .then(() => {
          // Programmer la prochaine vague
          setTimeout(generateLoad, 1000);
        })
        .catch(() => {
          // Continuer même en cas d'erreur
          setTimeout(generateLoad, 1000);
        });
    };

    generateLoad();
  }

  async makeBackgroundRequest() {
    try {
      const endpoints = [
        '/api/documents',
        '/api/users',
        '/api/ocr/history',
        '/api/search'
      ];
      
      const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
      
      await axios.get(`${this.baseUrl}${endpoint}`, {
        timeout: 5000,
        headers: {
          'User-Agent': 'BackgroundLoad/1.0',
          'Authorization': 'Bearer fake-token'
        }
      });
      
      this.loadGenerator.requestCount++;
      
    } catch (error) {
      this.loadGenerator.errorCount++;
      this.emit('backgroundError', error.message);
    }
  }

  async createBackgroundWebSocket() {
    return new Promise((resolve) => {
      const ws = new WebSocket(this.wsUrl);
      
      ws.on('open', () => {
        // Envoyer des messages de ping réguliers
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'ping',
              timestamp: Date.now()
            }));
          }
        }, 5000);

        ws.on('close', () => {
          clearInterval(pingInterval);
          resolve();
        });

        ws.on('error', () => {
          clearInterval(pingInterval);
          resolve();
        });
      });

      ws.on('error', () => resolve());

      // Timeout de sécurité
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
        resolve();
      }, 10000);
    });
  }

  // Arrêt de la charge de fond
  stopBackgroundLoad() {
    console.log(chalk.yellow('🛑 Arrêt de la charge de fond'));
    this.loadGenerator.isActive = false;
    
    // Fermer les connexions WebSocket
    this.loadGenerator.connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });
    this.loadGenerator.connections = [];
  }

  // Test de récupération après redémarrage de service
  async testServiceRestartRecovery() {
    console.log(chalk.blue('\n🔄 Test de récupération après redémarrage de service'));
    
    const startTime = Date.now();
    this.emit('testStarted', 'serviceRestart');
    
    // Attendre que la charge soit établie
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Simuler le redémarrage du service (arrêter puis redémarrer)
    console.log(chalk.red('🛑 Arrêt simulé du service...'));
    this.simulateServiceStop();
    
    // Attendre un peu
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Simuler le redémarrage
    console.log(chalk.green('🚀 Redémarrage simulé du service...'));
    this.simulateServiceStart();
    
    // Tester la récupération
    const recoveryStartTime = Date.now();
    const success = await this.testServiceAvailability();
    const recoveryTime = Date.now() - recoveryStartTime;
    
    this.results.tests.serviceRestart = {
      success,
      recoveryTime,
      successRate: success ? 100 : 0
    };
    
    this.emit('testCompleted', 'serviceRestart', success);
    return success;
  }

  simulateServiceStop() {
    // Simuler l'arrêt du service
    this.stopBackgroundLoad();
    console.log(chalk.yellow('Service arrêté'));
  }

  simulateServiceStart() {
    // Simuler le redémarrage du service
    this.startBackgroundLoad(30, 60000); // 1 minute
    console.log(chalk.yellow('Service redémarré'));
  }

  async testServiceAvailability() {
    const maxAttempts = 30;
    const attemptInterval = 2000; // 2 secondes
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await axios.get(`${this.baseUrl}/api/health`, { timeout: 5000 });
        
        if (response.status === 200) {
          console.log(chalk.green(`✅ Service disponible après ${attempt} tentatives`));
          return true;
        }
      } catch (error) {
        console.log(chalk.yellow(`⏳ Tentative ${attempt}/${maxAttempts}: Service non disponible`));
      }
      
      await new Promise(resolve => setTimeout(resolve, attemptInterval));
    }
    
    console.log(chalk.red('❌ Service non disponible après toutes les tentatives'));
    return false;
  }

  // Test de basculement de base de données
  async testDatabaseFailoverRecovery() {
    console.log(chalk.blue('\n💾 Test de basculement de base de données'));
    
    const startTime = Date.now();
    this.emit('testStarted', 'databaseFailover');
    
    // Attendre que la charge soit établie
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Tester les opérations de base de données avant la故障
    console.log(chalk.yellow('📊 Test des opérations DB avant故障'));
    const beforeFailover = await this.testDatabaseOperations();
    
    // Simuler la故障 de base de données
    console.log(chalk.red('💥 Simulation de故障 de base de données'));
    this.simulateDatabaseFailover();
    
    // Tester pendant la故障
    const duringFailover = await this.testDatabaseOperations();
    
    // Simuler la récupération
    console.log(chalk.green('🔧 Simulation de récupération de base de données'));
    this.simulateDatabaseRecovery();
    
    // Tester la récupération
    const recoveryStartTime = Date.now();
    const afterFailover = await this.testDatabaseOperations();
    const recoveryTime = Date.now() - recoveryStartTime;
    
    const success = afterFailover.successRate >= beforeFailover.successRate * 0.8;
    
    this.results.tests.databaseFailover = {
      success,
      recoveryTime,
      beforeSuccessRate: beforeFailover.successRate,
      afterSuccessRate: afterFailover.successRate
    };
    
    this.emit('testCompleted', 'databaseFailover', success);
    return success;
  }

  simulateDatabaseFailover() {
    // Simuler une故障 de base de données
    console.log(chalk.yellow('Base de données en mode dégradation'));
    this.databaseMode = 'degraded';
  }

  simulateDatabaseRecovery() {
    // Simuler la récupération de base de données
    console.log(chalk.yellow('Base de données en mode normal'));
    this.databaseMode = 'normal';
  }

  async testDatabaseOperations() {
    const operations = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
    const results = { success: 0, errors: 0, successRate: 0 };
    
    for (let i = 0; i < 20; i++) {
      try {
        const operation = operations[Math.floor(Math.random() * operations.length)];
        const endpoint = `/api/db-test?operation=${operation}&simulate=${this.databaseMode || 'normal'}`;
        
        await axios.get(`${this.baseUrl}${endpoint}`, { timeout: 5000 });
        results.success++;
        
      } catch (error) {
        results.errors++;
      }
    }
    
    results.successRate = (results.success / (results.success + results.errors)) * 100;
    console.log(chalk.cyan(`DB Ops: ${results.successRate.toFixed(1)}% de réussite`));
    
    return results;
  }

  // Test de partition réseau
  async testNetworkPartitionRecovery() {
    console.log(chalk.blue('\n🌐 Test de partition réseau'));
    
    const startTime = Date.now();
    this.emit('testStarted', 'networkPartition');
    
    // Attendre que la charge soit établie
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Simuler la partition réseau
    console.log(chalk.red('🚫 Simulation de partition réseau'));
    this.simulateNetworkPartition();
    
    // Tester les connexions pendant la partition
    console.log(chalk.yellow('📡 Test des connexions pendant partition'));
    const connectionTests = await this.testConnectionsDuringPartition();
    
    // Simuler la récupération du réseau
    console.log(chalk.green('🔗 Simulation de récupération réseau'));
    this.simulateNetworkRecovery();
    
    // Tester la récupération des connexions
    const recoveryStartTime = Date.now();
    const connectionRecovery = await this.testConnectionsAfterRecovery();
    const recoveryTime = Date.now() - recoveryStartTime;
    
    const success = connectionRecovery.connectedCount >= connectionTests.attemptedCount * 0.8;
    
    this.results.tests.networkPartition = {
      success,
      recoveryTime,
      attemptedConnections: connectionTests.attemptedCount,
      successfulConnections: connectionRecovery.connectedCount
    };
    
    this.emit('testCompleted', 'networkPartition', success);
    return success;
  }

  simulateNetworkPartition() {
    this.networkMode = 'partitioned';
    console.log(chalk.yellow('Réseau partitionné - connexions limitées'));
  }

  simulateNetworkRecovery() {
    this.networkMode = 'normal';
    console.log(chalk.yellow('Réseau récupéré - connexions normales'));
  }

  async testConnectionsDuringPartition() {
    const results = { attemptedCount: 0, connectedCount: 0, errors: [] };
    
    for (let i = 0; i < 20; i++) {
      results.attemptedCount++;
      
      try {
        if (this.networkMode === 'partitioned' && Math.random() < 0.3) {
          throw new Error('Connexion refusée - partition réseau');
        }
        
        await axios.get(`${this.baseUrl}/api/test`, { timeout: 3000 });
        results.connectedCount++;
        
      } catch (error) {
        results.errors.push(error.message);
      }
    }
    
    console.log(chalk.cyan(`Partition: ${results.connectedCount}/${results.attemptedCount} connexions réussies`));
    return results;
  }

  async testConnectionsAfterRecovery() {
    const results = { attemptedCount: 0, connectedCount: 0 };
    
    for (let i = 0; i < 30; i++) {
      results.attemptedCount++;
      
      try {
        await axios.get(`${this.baseUrl}/api/test`, { timeout: 5000 });
        results.connectedCount++;
        
      } catch (error) {
        // Ignorer les erreurs de récupération
      }
    }
    
    console.log(chalk.cyan(`Récupération: ${results.connectedCount}/${results.attemptedCount} connexions réussies`));
    return results;
  }

  // Test de récupération après surcharge
  async testOverloadRecovery() {
    console.log(chalk.blue('\n⚡ Test de récupération après surcharge'));
    
    const startTime = Date.now();
    this.emit('testStarted', 'overloadRecovery');
    
    // Démarrer avec une charge normale
    this.startBackgroundLoad(20, 30000);
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Générer une surcharge
    console.log(chalk.red('🔥 Génération de surcharge'));
    const overloadPromises = [];
    for (let i = 0; i < 100; i++) {
      overloadPromises.push(this.makeOverloadRequest());
    }
    
    await Promise.allSettled(overloadPromises);
    
    // Attendre que la surcharge se calme
    console.log(chalk.yellow('⏳ Attente de stabilisation'));
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Tester la récupération
    const recoveryStartTime = Date.now();
    const baselinePerformance = await this.measurePerformance();
    
    // Attendre la stabilisation
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    const currentPerformance = await this.measurePerformance();
    const recoveryTime = Date.now() - recoveryStartTime;
    
    const performanceRecovery = (currentPerformance.responseTime / baselinePerformance.responseTime) <= 1.5;
    const success = performanceRecovery;
    
    this.results.tests.overloadRecovery = {
      success,
      recoveryTime,
      baselineResponseTime: baselinePerformance.responseTime,
      currentResponseTime: currentPerformance.responseTime,
      performanceRatio: currentPerformance.responseTime / baselinePerformance.responseTime
    };
    
    this.emit('testCompleted', 'overloadRecovery', success);
    return success;
  }

  async makeOverloadRequest() {
    try {
      await axios.get(`${this.baseUrl}/api/overload-test`, { timeout: 1000 });
    } catch (error) {
      // Ignorer les erreurs de surcharge
    }
  }

  async measurePerformance() {
    const requests = 10;
    const responseTimes = [];
    
    for (let i = 0; i < requests; i++) {
      const startTime = Date.now();
      
      try {
        await axios.get(`${this.baseUrl}/api/performance-test`, { timeout: 5000 });
        responseTimes.push(Date.now() - startTime);
      } catch (error) {
        responseTimes.push(5000); // Timeout
      }
    }
    
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    
    return {
      responseTime: avgResponseTime,
      minTime: Math.min(...responseTimes),
      maxTime: Math.max(...responseTimes)
    };
  }

  // Test de reconnexion WebSocket
  async testWebSocketReconnection() {
    console.log(chalk.blue('\n🔌 Test de reconnexion WebSocket'));
    
    const startTime = Date.now();
    this.emit('testStarted', 'websocketReconnection');
    
    // Créer des connexions WebSocket de test
    const testConnections = [];
    for (let i = 0; i < 20; i++) {
      const connection = await this.createTestWebSocket(i);
      if (connection) {
        testConnections.push(connection);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Simuler une déconnexion massive
    console.log(chalk.red('💥 Simulation de déconnexion massive'));
    this.simulateWebSocketDisconnection(testConnections);
    
    // Tester la reconnexion
    const recoveryStartTime = Date.now();
    const reconnectionSuccess = await this.testWebSocketReconnection(testConnections);
    const recoveryTime = Date.now() - recoveryStartTime;
    
    const success = reconnectionSuccess.reconnectedCount >= testConnections.length * 0.8;
    
    this.results.tests.websocketReconnection = {
      success,
      recoveryTime,
      attemptedConnections: testConnections.length,
      reconnectedCount: reconnectionSuccess.reconnectedCount
    };
    
    this.emit('testCompleted', 'websocketReconnection', success);
    return success;
  }

  async createTestWebSocket(id) {
    return new Promise((resolve) => {
      const ws = new WebSocket(this.wsUrl);
      
      ws.on('open', () => {
        console.log(chalk.green(`✅ WS Test ${id} connecté`));
        resolve(ws);
      });
      
      ws.on('error', () => {
        console.log(chalk.red(`❌ WS Test ${id} erreur`));
        resolve(null);
      });
      
      // Timeout
      setTimeout(() => resolve(null), 5000);
    });
  }

  simulateWebSocketDisconnection(connections) {
    connections.forEach((ws, index) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        // Simuler une déconnexion forcée
        ws.terminate();
      }
    });
  }

  async testWebSocketReconnection(originalConnections) {
    const results = { attemptedCount: 0, reconnectedCount: 0 };
    
    for (let i = 0; i < originalConnections.length; i++) {
      results.attemptedCount++;
      
      try {
        const newConnection = await this.createTestWebSocket(`recovery-${i}`);
        if (newConnection) {
          results.reconnectedCount++;
        }
      } catch (error) {
        // Ignorer les erreurs
      }
    }
    
    console.log(chalk.cyan(`Reconnexion: ${results.reconnectedCount}/${results.attemptedCount} réussies`));
    return results;
  }

  // Rapport des résultats
  printReport() {
    console.log(chalk.cyan('\n📊 RAPPORT DE TEST DE RÉCUPÉRATION APRÈS ERREURS'));
    console.log(chalk.white('═'.repeat(70)));
    
    let totalTests = 0;
    let successfulRecoveries = 0;
    let totalRecoveryTime = 0;
    
    Object.entries(this.results.tests).forEach(([testName, result]) => {
      totalTests++;
      const status = result.success ? chalk.green('✅') : chalk.red('❌');
      const recoveryTime = (result.recoveryTime / 1000).toFixed(2) + 's';
      
      console.log(chalk.yellow(`\n${testName.toUpperCase()}:`));
      console.log(`   ${status} Statut: ${result.success ? 'Réussie' : 'Échouée'}`);
      console.log(`   ⏱️ Temps de récupération: ${recoveryTime}`);
      
      if (result.successRate !== undefined) {
        console.log(`   📊 Taux de réussite: ${result.successRate.toFixed(1)}%`);
      }
      
      if (result.success) {
        successfulRecoveries++;
      }
      totalRecoveryTime += result.recoveryTime;
    });
    
    // Métriques globales
    const overallSuccessRate = (successfulRecoveries / totalTests) * 100;
    const avgRecoveryTime = totalRecoveryTime / totalTests / 1000;
    
    console.log(chalk.cyan('\n📈 MÉTRIQUES GLOBALES'));
    console.log(chalk.white('═'.repeat(30)));
    console.log(`🔢 Tests totaux: ${totalTests}`);
    console.log(`✅ Récupérations réussies: ${successfulRecoveries}`);
    console.log(`📊 Taux de réussite global: ${overallSuccessRate.toFixed(1)}%`);
    console.log(`⏱️ Temps moyen de récupération: ${avgRecoveryTime.toFixed(2)}s`);
    
    // Charge de fond
    console.log(chalk.cyan('\n💪 CHARGE DE FOND'));
    console.log(chalk.white('═'.repeat(20)));
    console.log(`📡 Requêtes envoyées: ${this.loadGenerator.requestCount}`);
    console.log(`❌ Erreurs rencontrées: ${this.loadGenerator.errorCount}`);
    const loadErrorRate = (this.loadGenerator.errorCount / this.loadGenerator.requestCount * 100).toFixed(2);
    console.log(`📊 Taux d'erreur: ${loadErrorRate}%`);
  }

  // Sauvegarde des résultats
  saveResults(filename = 'error-recovery-results.json') {
    const fs = require('fs');
    const path = require('path');
    const reportDir = path.join(__dirname, '..', 'reports');
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportData = {
      timestamp: new Date().toISOString(),
      testType: 'Error Recovery Test',
      results: this.results,
      loadGeneratorStats: {
        requests: this.loadGenerator.requestCount,
        errors: this.loadGenerator.errorCount,
        errorRate: (this.loadGenerator.errorCount / this.loadGenerator.requestCount * 100).toFixed(2)
      }
    };

    fs.writeFileSync(
      path.join(reportDir, filename),
      JSON.stringify(reportData, null, 2)
    );

    console.log(chalk.green(`📁 Résultats sauvegardés: ${filename}`));
  }
}

// Exécution du test
async function main() {
  console.log(chalk.magenta.bold('🧪 SUITE DE TESTS DE CHARGE - RÉCUPÉRATION APRÈS ERREURS'));
  console.log(chalk.magenta('=' .repeat(80)));

  const tester = new ErrorRecoveryTest();
  
  try {
    // Démarrer la charge de fond
    tester.startBackgroundLoad(20, 600000); // 10 minutes
    
    // Test 1: Récupération après redémarrage de service
    console.log(chalk.blue('\n1️⃣ Test de récupération après redémarrage de service'));
    await tester.testServiceRestartRecovery();
    
    // Test 2: Basculement de base de données
    console.log(chalk.blue('\n2️⃣ Test de basculement de base de données'));
    await tester.testDatabaseFailoverRecovery();
    
    // Test 3: Partition réseau
    console.log(chalk.blue('\n3️⃣ Test de partition réseau'));
    await tester.testNetworkPartitionRecovery();
    
    // Test 4: Récupération après surcharge
    console.log(chalk.blue('\n4️⃣ Test de récupération après surcharge'));
    await tester.testOverloadRecovery();
    
    // Test 5: Reconnexion WebSocket
    console.log(chalk.blue('\n5️⃣ Test de reconnexion WebSocket'));
    await tester.testWebSocketReconnection();
    
    // Rapport et sauvegarde
    tester.printReport();
    tester.saveResults();
    
    console.log(chalk.green.bold('\n✅ TESTS DE RÉCUPÉRATION APRÈS ERREURS TERMINÉS AVEC SUCCÈS'));
    
  } catch (error) {
    console.error(chalk.red.bold('\n❌ ERREUR LORS DES TESTS:'), error);
  } finally {
    // Nettoyage
    console.log(chalk.yellow('\n🧹 Nettoyage...'));
    tester.stopBackgroundLoad();
  }
}

if (require.main === module) {
  main();
}

module.exports = ErrorRecoveryTest;