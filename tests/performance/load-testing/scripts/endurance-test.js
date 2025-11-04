#!/usr/bin/env node

/**
 * Tests d'endurance sur plusieurs heures
 * Teste la stabilité et les performances du système sur une longue période
 */

const axios = require('axios');
const WebSocket = require('ws');
const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class EnduranceTest extends EventEmitter {
  constructor() {
    super();
    this.baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    this.wsUrl = 'ws://localhost:3000/ws';
    
    this.results = {
      duration: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalWebSocketConnections: 0,
      activeWebSocketConnections: 0,
      peakMemoryUsage: 0,
      avgMemoryUsage: 0,
      memorySamples: [],
      performance: {
        avgResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        responseTimeSamples: []
      },
      stability: {
        uptime: 0,
        errorRate: 0,
        crashes: 0,
        restarts: 0
      },
      hourlyStats: [],
      errorBreakdown: {}
    };
    
    this.isRunning = false;
    this.startTime = 0;
    this.endTime = 0;
    this.currentHour = 0;
    this.metricsCollector = null;
    this.loadGenerator = null;
    this.webSocketManager = null;
  }

  // Démarrage du test d'endurance
  async startEnduranceTest(duration = '4h', targetLoad = 50) {
    console.log(chalk.blue(`🚀 Démarrage du test d'endurance: ${duration} avec charge ${targetLoad} utilisateurs`));
    
    this.startTime = Date.now();
    this.endTime = this.startTime + this.parseDuration(duration);
    this.isRunning = true;
    
    // Collecteurs de métriques
    this.startMetricsCollector();
    
    // Générateur de charge
    this.startLoadGenerator(targetLoad);
    
    // Gestionnaire WebSocket
    this.startWebSocketManager(targetLoad / 2);
    
    // Boucle principale d'endurance
    await this.runEnduranceLoop();
    
    // Finalisation
    this.finalizeTest();
  }

  // Collecteur de métriques système
  startMetricsCollector() {
    this.metricsCollector = setInterval(() => {
      this.collectSystemMetrics();
    }, 30000); // Toutes les 30 secondes
    
    console.log(chalk.green('📊 Collecteur de métriques démarré'));
  }

  collectSystemMetrics() {
    const now = Date.now();
    
    // Métriques de mémoire (simulation)
    const memoryUsage = process.memoryUsage();
    const heapUsed = memoryUsage.heapUsed / 1024 / 1024; // MB
    
    this.results.memorySamples.push({
      timestamp: now,
      heapUsed,
      rss: memoryUsage.rss / 1024 / 1024,
      external: memoryUsage.external / 1024 / 1024
    });
    
    // Mettre à jour les statistiques
    this.results.peakMemoryUsage = Math.max(this.results.peakMemoryUsage, heapUsed);
    
    // Calculer la moyenne sur les 60 derniers échantillons
    const recentSamples = this.results.memorySamples.slice(-60);
    if (recentSamples.length > 0) {
      this.results.avgMemoryUsage = recentSamples.reduce((sum, sample) => sum + sample.heapUsed, 0) / recentSamples.length;
    }
    
    // Statistiques horaires
    this.updateHourlyStats();
  }

  updateHourlyStats() {
    const currentHour = Math.floor((Date.now() - this.startTime) / 3600000);
    
    if (currentHour > this.currentHour) {
      this.currentHour = currentHour;
      
      this.results.hourlyStats.push({
        hour: currentHour,
        requests: this.results.totalRequests,
        successes: this.results.successfulRequests,
        failures: this.results.failedRequests,
        avgResponseTime: this.calculateAverageResponseTime(),
        avgMemoryUsage: this.results.avgMemoryUsage,
        activeWebSockets: this.results.activeWebSocketConnections,
        timestamp: Date.now()
      });
      
      console.log(chalk.cyan(`📊 Statistiques heure ${currentHour} enregistrées`));
    }
  }

  // Générateur de charge continue
  startLoadGenerator(concurrency) {
    this.loadGenerator = setInterval(async () => {
      if (!this.isRunning) return;
      
      const promises = [];
      for (let i = 0; i < concurrency; i++) {
        promises.push(this.performLoadRequest());
      }
      
      await Promise.allSettled(promises);
    }, 2000); // Toutes les 2 secondes
    
    console.log(chalk.green(`⚡ Générateur de charge démarré (${concurrency} requêtes parallèles)`));
  }

  async performLoadRequest() {
    const endpoints = [
      { path: '/api/documents', weight: 30 },
      { path: '/api/users', weight: 20 },
      { path: '/api/search', weight: 25 },
      { path: '/api/ocr/history', weight: 15 },
      { path: '/api/analytics', weight: 10 }
    ];
    
    const endpoint = this.selectWeightedEndpoint(endpoints);
    const startTime = Date.now();
    
    try {
      const response = await axios.get(`${this.baseUrl}${endpoint.path}`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'EnduranceTest/1.0',
          'Authorization': 'Bearer endurance-test-token'
        }
      });
      
      const responseTime = Date.now() - startTime;
      this.recordSuccessfulRequest(responseTime);
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.recordFailedRequest(responseTime, error);
    }
  }

  selectWeightedEndpoint(endpoints) {
    const totalWeight = endpoints.reduce((sum, endpoint) => sum + endpoint.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const endpoint of endpoints) {
      random -= endpoint.weight;
      if (random <= 0) {
        return endpoint;
      }
    }
    
    return endpoints[0]; // Fallback
  }

  // Gestionnaire WebSocket pour endurance
  startWebSocketManager(maxConnections) {
    this.webSocketManager = {
      connections: new Map(),
      maxConnections,
      reconnectInterval: null,
      
      start() {
        this.reconnectInterval = setInterval(() => {
          this.manageConnections();
        }, 10000);
        
        this.manageConnections(); // Démarrage immédiat
      },
      
      manageConnections() {
        // Créer de nouvelles connexions si nécessaire
        while (this.connections.size < this.maxConnections) {
          this.createWebSocket();
        }
        
        // Nettoyer les connexions fermées
        for (const [id, connection] of this.connections) {
          if (connection.ws.readyState !== WebSocket.OPEN) {
            this.connections.delete(id);
          }
        }
        
        // Mettre à jour les statistiques globales
        this.updateGlobalStats();
      },
      
      createWebSocket() {
        const id = Date.now() + Math.random();
        const ws = new WebSocket(this.wsUrl);
        
        const connection = {
          id,
          ws,
          createdAt: Date.now(),
          messagesSent: 0,
          messagesReceived: 0,
          lastActivity: Date.now()
        };
        
        this.connections.set(id, connection);
        
        ws.on('open', () => {
          connection.lastActivity = Date.now();
          this.startMessaging(connection);
        });
        
        ws.on('message', (data) => {
          connection.messagesReceived++;
          connection.lastActivity = Date.now();
          this.results.totalWebSocketConnections++;
        });
        
        ws.on('close', () => {
          this.connections.delete(id);
          this.updateGlobalStats();
        });
        
        ws.on('error', () => {
          this.connections.delete(id);
          this.updateGlobalStats();
        });
      },
      
      startMessaging(connection) {
        const sendMessage = () => {
          if (connection.ws.readyState !== WebSocket.OPEN) return;
          
          const message = {
            type: this.getRandomMessageType(),
            timestamp: Date.now(),
            id: connection.id,
            data: this.generateMessageData()
          };
          
          try {
            connection.ws.send(JSON.stringify(message));
            connection.messagesSent++;
            connection.lastActivity = Date.now();
            
            // Programmer le prochain message avec délai variable
            setTimeout(sendMessage, Math.random() * 5000 + 1000);
          } catch (error) {
            // Erreur d'envoi, arrêter les messages pour cette connexion
          }
        };
        
        sendMessage();
      },
      
      getRandomMessageType() {
        const types = ['ping', 'status', 'activity', 'notification', 'data_sync'];
        return types[Math.floor(Math.random() * types.length)];
      },
      
      generateMessageData() {
        const sizes = ['small', 'medium', 'large'];
        const size = sizes[Math.floor(Math.random() * sizes.length)];
        
        const dataSizes = {
          small: 100,
          medium: 1000,
          large: 10000
        };
        
        return {
          size,
          content: 'x'.repeat(dataSizes[size]),
          metadata: {
            sessionId: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now()
          }
        };
      },
      
      updateGlobalStats() {
        this.updateGlobalStats = () => {
          this.activeWebSocketConnections = this.connections.size;
        };
        
        this.updateGlobalStats();
      }
    };
    
    this.webSocketManager.start();
    console.log(chalk.green(`🔌 Gestionnaire WebSocket démarré (max ${maxConnections} connexions)`));
  }

  // Boucle principale d'endurance
  async runEnduranceLoop() {
    console.log(chalk.blue('\n⏱️ Début de la boucle d\'endurance'));
    
    const checkInterval = setInterval(async () => {
      if (Date.now() >= this.endTime) {
        clearInterval(checkInterval);
        this.isRunning = false;
        return;
      }
      
      // Vérifications de santé du système
      await this.performHealthChecks();
      
      // Rapport de progression
      this.printProgress();
      
    }, 60000); // Chaque minute
    
    // Attendre la fin du test
    while (this.isRunning && Date.now() < this.endTime) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  async performHealthChecks() {
    const healthCheckEndpoints = [
      '/api/health',
      '/api/status',
      '/api/ping'
    ];
    
    for (const endpoint of healthCheckEndpoints) {
      try {
        await axios.get(`${this.baseUrl}${endpoint}`, { timeout: 5000 });
        
      } catch (error) {
        this.results.stability.crashes++;
        this.recordError('health_check_failed', `${endpoint}: ${error.message}`);
      }
    }
  }

  recordSuccessfulRequest(responseTime) {
    this.results.totalRequests++;
    this.results.successfulRequests++;
    
    // Mettre à jour les statistiques de performance
    this.results.performance.responseTimeSamples.push(responseTime);
    this.results.performance.minResponseTime = Math.min(this.results.performance.minResponseTime, responseTime);
    this.results.performance.maxResponseTime = Math.max(this.results.performance.maxResponseTime, responseTime);
    
    // Limiter la taille des échantillons pour éviter les memory leaks
    if (this.results.performance.responseTimeSamples.length > 1000) {
      this.results.performance.responseTimeSamples = this.results.performance.responseTimeSamples.slice(-500);
    }
  }

  recordFailedRequest(responseTime, error) {
    this.results.totalRequests++;
    this.results.failedRequests++;
    
    // Enregistrer l'erreur
    const errorKey = this.categorizeError(error);
    this.results.errorBreakdown[errorKey] = (this.results.errorBreakdown[errorKey] || 0) + 1;
    
    this.recordError(errorKey, error.message);
  }

  categorizeError(error) {
    if (error.code === 'ECONNABORTED') return 'timeout';
    if (error.code === 'ECONNREFUSED') return 'connection_refused';
    if (error.response) return `http_${error.response.status}`;
    if (error.code === 'ENOTFOUND') return 'dns_error';
    return 'unknown_error';
  }

  recordError(type, message) {
    this.emit('error', {
      type,
      message,
      timestamp: Date.now(),
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024
    });
  }

  calculateAverageResponseTime() {
    const samples = this.results.performance.responseTimeSamples;
    if (samples.length === 0) return 0;
    
    return samples.reduce((sum, time) => sum + time, 0) / samples.length;
  }

  printProgress() {
    const elapsed = Date.now() - this.startTime;
    const total = this.endTime - this.startTime;
    const progress = (elapsed / total) * 100;
    
    const remaining = total - elapsed;
    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    
    const successRate = this.results.totalRequests > 0 ? 
      (this.results.successfulRequests / this.results.totalRequests) * 100 : 0;
    
    console.log(chalk.cyan(`\n📊 PROGRESSION - ${progress.toFixed(1)}% (${hours}h ${minutes}m restantes)`));
    console.log(chalk.white('═'.repeat(60)));
    console.log(`⏱️  Temps écoulé: ${this.formatTime(elapsed)}`);
    console.log(`📡 Requêtes totales: ${this.results.totalRequests.toLocaleString()}`);
    console.log(`✅ Taux de réussite: ${successRate.toFixed(2)}%`);
    console.log(`⏱️  Temps réponse moyen: ${this.calculateAverageResponseTime().toFixed(2)}ms`);
    console.log(`💾 Mémoire utilisée: ${this.results.avgMemoryUsage.toFixed(2)}MB`);
    console.log(`🔌 WebSockets actifs: ${this.results.activeWebSocketConnections}`);
    
    if (Object.keys(this.results.errorBreakdown).length > 0) {
      console.log(chalk.yellow(`⚠️  Erreurs: ${Object.entries(this.results.errorBreakdown).map(([type, count]) => `${type}:${count}`).join(', ')}`));
    }
  }

  formatTime(milliseconds) {
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  parseDuration(duration) {
    const match = duration.match(/(\d+)([smhd])/);
    if (!match) return 14400000; // default 4 hours
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return value * 1000;
    }
  }

  // Test de stress avancé
  async performAdvancedStressTest() {
    console.log(chalk.blue('\n🔥 Test de stress avancé'));
    
    // Test de pics de charge soudains
    console.log(chalk.yellow('Test de pics de charge'));
    await this.simulateTrafficSpikes();
    
    // Test de mémoire haute
    console.log(chalk.yellow('Test de mémoire haute'));
    await this.simulateHighMemoryUsage();
    
    // Test de connexions multiples
    console.log(chalk.yellow('Test de connexions multiples'));
    await this.simulateMultipleConnections();
  }

  async simulateTrafficSpikes() {
    const spikePattern = [100, 200, 300, 500, 100]; // Requêtes par burst
    
    for (const spikeSize of spikePattern) {
      console.log(chalk.red(`🚨 Pic de charge: ${spikeSize} requêtes`));
      
      const promises = [];
      for (let i = 0; i < spikeSize; i++) {
        promises.push(this.performLoadRequest());
      }
      
      await Promise.allSettled(promises);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Pause entre pics
    }
  }

  async simulateHighMemoryUsage() {
    console.log(chalk.yellow('Allocation de mémoire intensive...'));
    
    // Créer des objets volumineux pour simuler une pression mémoire
    const bigObjects = [];
    for (let i = 0; i < 100; i++) {
      bigObjects.push(new Array(10000).fill(`data_${i}_${Date.now()}`));
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Tester sous pression mémoire
    await this.performLoadRequest();
    
    // Nettoyer
    bigObjects.length = 0;
    
    console.log(chalk.green('✅ Test de mémoire terminé'));
  }

  async simulateMultipleConnections() {
    console.log(chalk.yellow('Test de connexions multiples...'));
    
    // Créer de nombreuses connexions rapidement
    const connectionPromises = [];
    for (let i = 0; i < 1000; i++) {
      connectionPromises.push(
        axios.get(`${this.baseUrl}/api/ping`, { timeout: 2000 })
          .catch(() => null) // Ignorer les erreurs
      );
      
      if (i % 50 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    await Promise.allSettled(connectionPromises);
    console.log(chalk.green('✅ Test de connexions multiples terminé'));
  }

  // Finalisation du test
  finalizeTest() {
    this.results.duration = Date.now() - this.startTime;
    
    // Arrêter les collecteurs
    if (this.metricsCollector) clearInterval(this.metricsCollector);
    if (this.loadGenerator) clearInterval(this.loadGenerator);
    if (this.webSocketManager?.reconnectInterval) {
      clearInterval(this.webSocketManager.reconnectInterval);
    }
    
    // Calculer les statistiques finales
    this.calculateFinalStatistics();
    
    console.log(chalk.green('✅ Test d\'endurance terminé'));
  }

  calculateFinalStatistics() {
    this.results.stability.uptime = this.results.duration;
    this.results.stability.errorRate = this.results.totalRequests > 0 ? 
      (this.results.failedRequests / this.results.totalRequests) * 100 : 0;
    
    // Performance finale
    this.results.performance.avgResponseTime = this.calculateAverageResponseTime();
    
    // Stocker les statistiques finales
    if (this.results.hourlyStats.length === 0) {
      this.updateHourlyStats();
    }
  }

  // Rapport final
  printFinalReport() {
    console.log(chalk.cyan('\n📊 RAPPORT FINAL - TEST D\'ENDURANCE'));
    console.log(chalk.white('═'.repeat(70)));
    
    // Durée et charge
    console.log(chalk.yellow('\n⏱️ DURÉE ET CHARGE'));
    console.log(`   Durée totale: ${this.formatTime(this.results.duration)}`);
    console.log(`   Debut: ${new Date(this.startTime).toLocaleString()}`);
    console.log(`   Fin: ${new Date(this.endTime).toLocaleString()}`);
    
    // Statistiques de requêtes
    console.log(chalk.yellow('\n📡 STATISTIQUES DE REQUÊTES'));
    console.log(`   Total requêtes: ${this.results.totalRequests.toLocaleString()}`);
    console.log(`   Réussies: ${this.results.successfulRequests.toLocaleString()}`);
    console.log(`   Échouées: ${this.results.failedRequests.toLocaleString()}`);
    const successRate = this.results.totalRequests > 0 ? 
      (this.results.successfulRequests / this.results.totalRequests) * 100 : 0;
    console.log(`   Taux de réussite: ${successRate.toFixed(2)}%`);
    console.log(`   Requêtes/seconde: ${(this.results.totalRequests / (this.results.duration / 1000)).toFixed(2)}`);
    
    // Performance
    console.log(chalk.yellow('\n⚡ PERFORMANCE'));
    console.log(`   Temps réponse moyen: ${this.results.performance.avgResponseTime.toFixed(2)}ms`);
    console.log(`   Temps réponse min: ${this.results.performance.minResponseTime.toFixed(2)}ms`);
    console.log(`   Temps réponse max: ${this.results.performance.maxResponseTime.toFixed(2)}ms`);
    
    // Mémoire
    console.log(chalk.yellow('\n💾 MÉMOIRE'));
    console.log(`   Usage pic: ${this.results.peakMemoryUsage.toFixed(2)}MB`);
    console.log(`   Usage moyen: ${this.results.avgMemoryUsage.toFixed(2)}MB`);
    
    // WebSocket
    console.log(chalk.yellow('\n🔌 WEBSOCKET'));
    console.log(`   Connexions totales: ${this.results.totalWebSocketConnections.toLocaleString()}`);
    console.log(`   Connexions actives: ${this.results.activeWebSocketConnections}`);
    
    // Stabilité
    console.log(chalk.yellow('\n🛡️ STABILITÉ'));
    console.log(`   Uptime: ${(this.results.stability.uptime / 1000 / 60 / 60).toFixed(2)} heures`);
    console.log(`   Taux d'erreur: ${this.results.stability.errorRate.toFixed(2)}%`);
    console.log(`   Crashes détectés: ${this.results.stability.crashes}`);
    
    // Analyse par heure
    if (this.results.hourlyStats.length > 0) {
      console.log(chalk.yellow('\n📈 ÉVOLUTION HORAIRE'));
      console.log(chalk.white('Heure | Requêtes | Succès | Échec | Resp.Moy | Mémoire | WS'));
      console.log(chalk.white('-'.repeat(70)));
      
      this.results.hourlyStats.forEach(stat => {
        const successRate = stat.requests > 0 ? 
          ((stat.successes / stat.requests) * 100).toFixed(1) : '0.0';
        console.log(
          `${stat.hour.toString().padStart(4)} | ` +
          `${stat.requests.toLocaleString().padStart(9)} | ` +
          `${successRate.padStart(6)}% | ` +
          `${(stat.failures || 0).toLocaleString().padStart(5)} | ` +
          `${stat.avgResponseTime.toFixed(1).padStart(8)}ms | ` +
          `${stat.avgMemoryUsage.toFixed(1).padStart(7)}MB | ` +
          `${stat.activeWebSockets.toString().padStart(3)}`
        );
      });
    }
    
    // Répartition des erreurs
    if (Object.keys(this.results.errorBreakdown).length > 0) {
      console.log(chalk.yellow('\n🚨 RÉPARTITION DES ERREURS'));
      Object.entries(this.results.errorBreakdown)
        .sort(([,a], [,b]) => b - a)
        .forEach(([type, count]) => {
          const percentage = (count / this.results.totalRequests * 100).toFixed(2);
          console.log(`   ${type}: ${count} (${percentage}%)`);
        });
    }
    
    // Recommandations
    console.log(chalk.cyan('\n💡 RECOMMANDATIONS'));
    
    if (successRate < 95) {
      console.log(chalk.red('   ⚠️ Taux de réussite faible - Vérifier la stabilité du système'));
    }
    if (this.results.performance.avgResponseTime > 1000) {
      console.log(chalk.red('   ⚠️ Temps de réponse élevés - Optimiser les performances'));
    }
    if (this.results.peakMemoryUsage > 500) {
      console.log(chalk.red('   ⚠️ Utilisation mémoire élevée - Surveiller les memory leaks'));
    }
    if (this.results.stability.crashes > 0) {
      console.log(chalk.red('   ⚠️ Crashes détectés - Investiguer les causes'));
    }
    
    if (successRate >= 95 && this.results.performance.avgResponseTime <= 1000 && 
        this.results.peakMemoryUsage <= 500 && this.results.stability.crashes === 0) {
      console.log(chalk.green('   ✅ Système stable et performant - Test d\'endurance réussi'));
    }
  }

  // Sauvegarde des résultats
  saveResults(filename = 'endurance-test-results.json') {
    const fs = require('fs');
    const path = require('path');
    const reportDir = path.join(__dirname, '..', 'reports');
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportData = {
      timestamp: new Date().toISOString(),
      testType: 'Endurance Test',
      startTime: new Date(this.startTime).toISOString(),
      endTime: new Date(this.endTime).toISOString(),
      results: this.results,
      summary: {
        durationFormatted: this.formatTime(this.results.duration),
        totalRequests: this.results.totalRequests,
        successRate: this.results.totalRequests > 0 ? 
          (this.results.successfulRequests / this.results.totalRequests) * 100 : 0,
        avgResponseTime: this.results.performance.avgResponseTime,
        peakMemoryUsage: this.results.peakMemoryUsage,
        errorRate: this.results.stability.errorRate
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
  console.log(chalk.magenta.bold('🧪 SUITE DE TESTS DE CHARGE - TEST D\'ENDURANCE'));
  console.log(chalk.magenta('=' .repeat(70)));

  const tester = new EnduranceTest();
  
  // Écouter les événements d'erreur
  tester.on('error', (error) => {
    console.log(chalk.red(`🚨 Erreur détectée: ${error.type} - ${error.message}`));
  });
  
  try {
    // Configuration du test
    const duration = process.argv[2] || '4h';
    const targetLoad = parseInt(process.argv[3]) || 50;
    
    console.log(chalk.blue(`\nConfiguration: ${duration} de test avec ${targetLoad} utilisateurs`));
    
    // Test d'endurance principal
    await tester.startEnduranceTest(duration, targetLoad);
    
    // Test de stress avancé (optionnel)
    if (process.argv.includes('--stress-test')) {
      await tester.performAdvancedStressTest();
    }
    
    // Rapport final et sauvegarde
    tester.printFinalReport();
    tester.saveResults();
    
    console.log(chalk.green.bold('\n✅ TEST D\'ENDURANCE TERMINÉ AVEC SUCCÈS'));
    
  } catch (error) {
    console.error(chalk.red.bold('\n❌ ERREUR LORS DU TEST D\'ENDURANCE:'), error);
    tester.finalizeTest();
    tester.printFinalReport();
  }
}

if (require.main === module) {
  main();
}

module.exports = EnduranceTest;