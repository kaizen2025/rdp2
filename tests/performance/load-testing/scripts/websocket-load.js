#!/usr/bin/env node

/**
 * Tests de stabilité lors de pics de charge WebSocket
 * Teste la gestion des connexions WebSocket multiples et les pics de trafic
 */

const WebSocket = require('ws');
const EventEmitter = require('events');
const chalk = require('chalk');

class WebSocketLoadTest {
  constructor() {
    this.baseUrl = 'ws://localhost:3000/ws';
    this.results = {
      connections: { total: 0, successful: 0, failed: 0, closed: 0 },
      messages: { sent: 0, received: 0, errors: 0 },
      performance: {
        avgLatency: 0,
        maxLatency: 0,
        minLatency: Infinity,
        totalMessages: 0,
        messageRate: 0
      },
      errors: [],
      testDuration: 0
    };
    
    this.activeConnections = new Map();
    this.messageId = 0;
    this.startTime = 0;
    this.testEvents = new EventEmitter();
  }

  // Test de connexion simultanée massive
  async testMassiveConnections(connectionCount = 100, duration = '5m') {
    console.log(chalk.blue(`🔗 Test de connexions massives: ${connectionCount} connexions pendant ${duration}`));
    
    this.startTime = Date.now();
    const promises = [];
    
    // Créer les connexions par lots
    const batchSize = 20;
    const batches = Math.ceil(connectionCount / batchSize);
    
    for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
      const batchPromises = [];
      const startIndex = batchIndex * batchSize;
      const endIndex = Math.min(startIndex + batchSize, connectionCount);
      
      for (let i = startIndex; i < endIndex; i++) {
        batchPromises.push(this.createConnection(i));
      }
      
      // Attendre que le lot soit créé avant le suivant
      await Promise.allSettled(batchPromises);
      console.log(chalk.yellow(`📦 Lot ${batchIndex + 1}/${batches} créé (${endIndex - startIndex} connexions)`));
      
      // Pause entre les lots
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Attendre la durée du test
    const durationMs = this.parseDuration(duration);
    await new Promise(resolve => setTimeout(resolve, durationMs));
    
    return this.analyzeResults();
  }

  // Création d'une connexion WebSocket
  async createConnection(userId) {
    return new Promise((resolve) => {
      const ws = new WebSocket(this.baseUrl);
      const connectionStartTime = Date.now();
      
      const connection = {
        id: userId,
        ws: ws,
        createdAt: connectionStartTime,
        messagesSent: 0,
        messagesReceived: 0,
        lastPingTime: 0
      };

      this.activeConnections.set(userId, connection);
      this.results.connections.total++;

      // Événements de connexion
      ws.on('open', () => {
        this.results.connections.successful++;
        console.log(chalk.green(`✅ Connexion ${userId} établie`));
        
        // Démarrer l'envoi de messages
        this.startMessageFlow(connection);
        
        resolve(connection);
      });

      ws.on('message', (data) => {
        const receivedTime = Date.now();
        connection.messagesReceived++;
        this.results.messages.received++;
        
        // Traiter le message et calculer la latence si possible
        try {
          const message = JSON.parse(data.toString());
          if (message.timestamp && message.id) {
            const latency = receivedTime - message.timestamp;
            this.updateLatency(latency);
          }
        } catch (error) {
          // Ignorer les messages non-JSON
        }
      });

      ws.on('error', (error) => {
        this.results.connections.failed++;
        this.results.errors.push({
          type: 'connection_error',
          userId: userId,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        
        console.error(chalk.red(`❌ Erreur connexion ${userId}:`), error.message);
        this.activeConnections.delete(userId);
        resolve(null);
      });

      ws.on('close', () => {
        this.results.connections.closed++;
        this.activeConnections.delete(userId);
        console.log(chalk.yellow(`🔌 Connexion ${userId} fermée`));
      });

      // Timeout de connexion
      setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          this.results.connections.failed++;
          this.activeConnections.delete(userId);
          resolve(null);
        }
      }, 5000);
    });
  }

  // Démarrage du flux de messages
  startMessageFlow(connection) {
    const sendMessage = () => {
      if (connection.ws.readyState === WebSocket.OPEN) {
        const message = {
          type: this.getRandomMessageType(),
          id: ++this.messageId,
          userId: connection.id,
          timestamp: Date.now(),
          data: this.generateRandomMessageData()
        };

        connection.ws.send(JSON.stringify(message));
        connection.messagesSent++;
        this.results.messages.sent++;

        // Prochaine消息 avec délai variable
        const delay = Math.random() * 1000 + 100; // 100-1100ms
        setTimeout(sendMessage, delay);
      }
    };

    // Démarrer l'envoi immédiat
    sendMessage();
  }

  // Types de messages aléatoires
  getRandomMessageType() {
    const types = [
      'ping',
      'document_action',
      'ocr_request',
      'user_activity',
      'system_update',
      'chat_message'
    ];
    return types[Math.floor(Math.random() * types.length)];
  }

  // Génération de données de message aléatoires
  generateRandomMessageData() {
    const dataTypes = [
      { type: 'small', size: '1KB' },
      { type: 'medium', size: '10KB' },
      { type: 'large', size: '100KB' }
    ];
    
    const selectedType = dataTypes[Math.floor(Math.random() * dataTypes.length)];
    
    return {
      messageType: selectedType.type,
      size: selectedType.size,
      content: 'x'.repeat(selectedType.type === 'small' ? 1000 : selectedType.type === 'medium' ? 10000 : 100000),
      metadata: {
        timestamp: Date.now(),
        userAgent: 'LoadTest-WS/1.0',
        sessionId: Math.random().toString(36).substr(2, 9)
      }
    };
  }

  // Test de pics de trafic
  async testTrafficSpikes() {
    console.log(chalk.blue('📈 Test de pics de trafic'));
    
    const spikePattern = [
      { duration: 30000, connections: 20, messageRate: 2 },    // Normal
      { duration: 15000, connections: 50, messageRate: 5 },    // Pic 1
      { duration: 30000, connections: 20, messageRate: 2 },    // Normal
      { duration: 10000, connections: 100, messageRate: 10 },  // Pic 2
      { duration: 20000, connections: 30, messageRate: 3 }     // Récupération
    ];

    for (const phase of spikePattern) {
      console.log(chalk.yellow(`Phase: ${phase.connections} connexions, ${phase.messageRate} msg/s`));
      
      await this.runTrafficPhase(phase);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Pause entre phases
    }
  }

  async runTrafficPhase(phaseConfig) {
    const startTime = Date.now();
    const endTime = startTime + phaseConfig.duration;
    
    // Créer les connexions pour cette phase
    const connections = [];
    for (let i = 0; i < phaseConfig.connections; i++) {
      const connection = await this.createConnection(`spike-${Date.now()}-${i}`);
      if (connection) {
        connections.push(connection);
      }
    }
    
    // Maintenir les connexions pendant la durée de la phase
    while (Date.now() < endTime && connections.length > 0) {
      const activeConnections = connections.filter(c => c.ws.readyState === WebSocket.OPEN);
      
      // Envoyer des messages selon le taux configuré
      const messagesToSend = Math.min(phaseConfig.messageRate, activeConnections.length);
      for (let i = 0; i < messagesToSend; i++) {
        const connection = activeConnections[i % activeConnections.length];
        if (connection && connection.ws.readyState === WebSocket.OPEN) {
          const message = {
            type: 'spike_message',
            id: ++this.messageId,
            userId: connection.id,
            timestamp: Date.now(),
            data: { spike: true, phase: phaseConfig }
          };
          
          connection.ws.send(JSON.stringify(message));
          connection.messagesSent++;
          this.results.messages.sent++;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 seconde
    }
    
    // Fermer les connexions
    connections.forEach(connection => {
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.close();
      }
    });
  }

  // Test de gestion des erreurs
  async testErrorHandling() {
    console.log(chalk.blue('🛡️ Test de gestion des erreurs'));
    
    // Test de déconnexions massives
    console.log(chalk.yellow('Test de déconnexions massives'));
    await this.testMassDisconnections(50);
    
    // Test de messages invalides
    console.log(chalk.yellow('Test de messages invalides'));
    await this.testInvalidMessages(20);
    
    // Test de surcharge
    console.log(chalk.yellow('Test de surcharge'));
    await this.testOverload(200, '30s');
  }

  async testMassDisconnections(connectionCount) {
    // Créer des connexions
    const connections = [];
    for (let i = 0; i < connectionCount; i++) {
      const connection = await this.createConnection(`disconnect-test-${i}`);
      if (connection) {
        connections.push(connection);
      }
    }
    
    // Attendre un peu
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Fermer massivement les connexions
    console.log(chalk.red('🔴 Déconnexions massives en cours...'));
    const batchSize = 10;
    for (let i = 0; i < connections.length; i += batchSize) {
      const batch = connections.slice(i, i + batchSize);
      batch.forEach(connection => {
        if (connection.ws.readyState === WebSocket.OPEN) {
          connection.ws.close(1000, 'Mass disconnect test');
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 100)); // Pause entre lots
    }
  }

  async testInvalidMessages(connectionCount) {
    const connections = [];
    
    // Créer des connexions
    for (let i = 0; i < connectionCount; i++) {
      const connection = await this.createConnection(`invalid-${i}`);
      if (connection) {
        connections.push(connection);
      }
    }
    
    // Envoyer des messages invalides
    const invalidMessages = [
      '{invalid json',
      'null',
      '',
      '{"type": "valid", "data": "'.repeat(1000) + '"}',
      JSON.stringify({ type: 'oversized', data: 'x'.repeat(1000000) })
    ];
    
    connections.forEach((connection, index) => {
      if (connection.ws.readyState === WebSocket.OPEN) {
        const message = invalidMessages[index % invalidMessages.length];
        connection.ws.send(message);
        
        setTimeout(() => {
          if (connection.ws.readyState === WebSocket.OPEN) {
            connection.ws.close();
          }
        }, 2000);
      }
    });
  }

  async testOverload(connectionCount, duration) {
    console.log(chalk.red(`🚨 Test de surcharge: ${connectionCount} connexions pour ${duration}`));
    
    const durationMs = this.parseDuration(duration);
    const endTime = Date.now() + durationMs;
    
    // Créer massivement des connexions
    for (let i = 0; i < connectionCount; i++) {
      this.createConnection(`overload-${i}`);
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    // Attendre la fin du test
    while (Date.now() < endTime) {
      console.log(chalk.red(`Actives: ${this.activeConnections.size}/${connectionCount}`));
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // Mise à jour des statistiques de latence
  updateLatency(latency) {
    if (!isFinite(latency) || latency < 0) return;
    
    this.results.performance.totalMessages++;
    this.results.performance.avgLatency = 
      (this.results.performance.avgLatency * (this.results.performance.totalMessages - 1) + latency) / 
      this.results.performance.totalMessages;
    
    this.results.performance.maxLatency = Math.max(this.results.performance.maxLatency, latency);
    this.results.performance.minLatency = Math.min(this.results.performance.minLatency, latency);
  }

  // Analyse des résultats
  analyzeResults() {
    this.results.testDuration = Date.now() - this.startTime;
    this.results.performance.messageRate = this.results.messages.received / (this.results.testDuration / 1000);
    
    // Calculer le taux de réussite des connexions
    const connectionSuccessRate = (this.results.connections.successful / this.results.connections.total) * 100;
    
    return {
      totalConnections: this.results.connections.total,
      successfulConnections: this.results.connections.successful,
      connectionSuccessRate: connectionSuccessRate.toFixed(2) + '%',
      totalMessages: this.results.messages.sent,
      messagesReceived: this.results.messages.received,
      averageLatency: this.results.performance.avgLatency.toFixed(2) + 'ms',
      maxLatency: this.results.performance.maxLatency + 'ms',
      messageRate: this.results.performance.messageRate.toFixed(2) + ' msg/s',
      totalErrors: this.results.errors.length,
      testDuration: (this.results.testDuration / 1000).toFixed(2) + 's'
    };
  }

  // Rapport des résultats
  printReport() {
    const analysis = this.analyzeResults();
    
    console.log(chalk.cyan('\n📊 RAPPORT DE TEST WEBSOCKET'));
    console.log(chalk.white('═'.repeat(60)));
    
    console.log(chalk.yellow('\n🔗 CONNEXIONS'));
    console.log(`   Total: ${analysis.totalConnections}`);
    console.log(`   Réussies: ${analysis.successfulConnections}`);
    console.log(`   Taux de réussite: ${analysis.connectionSuccessRate}`);
    console.log(`   Échouées: ${this.results.connections.failed}`);
    
    console.log(chalk.yellow('\n💬 MESSAGES'));
    console.log(`   Envoyés: ${analysis.totalMessages}`);
    console.log(`   Reçus: ${analysis.messagesReceived}`);
    console.log(`   Taux: ${analysis.messageRate}`);
    
    console.log(chalk.yellow('\n⏱️ PERFORMANCE'));
    console.log(`   Latence moyenne: ${analysis.averageLatency}`);
    console.log(`   Latence max: ${analysis.maxLatency}`);
    console.log(`   Durée test: ${analysis.testDuration}`);
    
    console.log(chalk.yellow('\n⚠️ ERREURS'));
    console.log(`   Total erreurs: ${analysis.totalErrors}`);
    
    if (this.results.errors.length > 0) {
      console.log(chalk.red('\n🚨 ERREURS DÉTECTÉES:'));
      const errorCounts = {};
      this.results.errors.forEach(error => {
        const key = `${error.type}:${error.error}`;
        errorCounts[key] = (errorCounts[key] || 0) + 1;
      });
      
      Object.entries(errorCounts).forEach(([error, count]) => {
        console.log(chalk.red(`   ${error}: ${count} occurrences`));
      });
    }
  }

  // Sauvegarde des résultats
  saveResults(filename = 'websocket-load-results.json') {
    const fs = require('fs');
    const path = require('path');
    const reportDir = path.join(__dirname, '..', 'reports');
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportData = {
      timestamp: new Date().toISOString(),
      testType: 'WebSocket Load Test',
      results: this.results,
      analysis: this.analyzeResults()
    };

    fs.writeFileSync(
      path.join(reportDir, filename),
      JSON.stringify(reportData, null, 2)
    );

    console.log(chalk.green(`📁 Résultats sauvegardés: ${filename}`));
  }

  // Fermeture de toutes les connexions
  closeAllConnections() {
    this.activeConnections.forEach((connection, id) => {
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.close();
      }
    });
    
    this.activeConnections.clear();
  }

  // Parsing de durée
  parseDuration(duration) {
    const match = duration.match(/(\d+)([smh])/);
    if (!match) return 60000; // default 1 minute
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      default: return value * 1000;
    }
  }
}

// Exécution du test
async function main() {
  console.log(chalk.magenta.bold('🧪 SUITE DE TESTS DE CHARGE - WEBSOCKET'));
  console.log(chalk.magenta('=' .repeat(70)));

  const tester = new WebSocketLoadTest();
  
  try {
    // Test 1: Connexions massives
    console.log(chalk.blue('\n1️⃣ Test de connexions massives'));
    await tester.testMassiveConnections(50, '2m');
    
    // Test 2: Pics de trafic
    console.log(chalk.blue('\n2️⃣ Test de pics de trafic'));
    await tester.testTrafficSpikes();
    
    // Test 3: Gestion des erreurs
    console.log(chalk.blue('\n3️⃣ Test de gestion des erreurs'));
    await tester.testErrorHandling();
    
    // Rapport et sauvegarde
    tester.printReport();
    tester.saveResults();
    
    console.log(chalk.green.bold('\n✅ TESTS WEBSOCKET TERMINÉS AVEC SUCCÈS'));
    
  } catch (error) {
    console.error(chalk.red.bold('\n❌ ERREUR LORS DES TESTS:'), error);
  } finally {
    // Nettoyage
    console.log(chalk.yellow('\n🧹 Nettoyage des connexions...'));
    tester.closeAllConnections();
  }
}

if (require.main === module) {
  main();
}

module.exports = WebSocketLoadTest;