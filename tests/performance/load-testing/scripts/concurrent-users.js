#!/usr/bin/env node

/**
 * Tests de simulation d'utilisateurs concurrents (10-50 utilisateurs simultanés)
 * Teste les performances avec des utilisateurs simultanés effectuant diverses opérations
 */

const loadtest = require('loadtest');
const chalk = require('chalk');
const axios = require('axios');

class ConcurrentUsersTest {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgLatency: 0,
      maxLatency: 0,
      minLatency: Infinity,
      errorCodes: {}
    };
  }

  // Test de charge avec utilisateurs simultanés
  async runConcurrentUsersTest(userCount = 50, duration = '2m') {
    console.log(chalk.blue(`🚀 Démarrage du test d'utilisateurs concurrents: ${userCount} utilisateurs pour ${duration}`));
    
    const options = {
      url: `${this.baseUrl}/api`,
      maxRequests: userCount * 10, // 10 requêtes par utilisateur
      concurrency: userCount,
      duration: duration,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LoadTest-Concurrency/1.0'
      }
    };

    return new Promise((resolve, reject) => {
      loadtest.loadTest(options, (error, result) => {
        if (error) {
          console.error(chalk.red('❌ Erreur lors du test de charge:'), error);
          reject(error);
          return;
        }

        this.results.totalRequests = result.totalRequests;
        this.results.successfulRequests = result.successfulRequests;
        this.failedRequests = result.totalRequests - result.successfulRequests;
        this.results.errorCodes = result.errorCodes;

        this.analyzeResults(result);
        this.printReport();
        resolve(this.results);
      });
    });
  }

  // Test de charge avec actions diverses
  async runVariedActionsTest() {
    console.log(chalk.blue('📋 Test d\'actions variées avec utilisateurs concurrents'));
    
    const actions = [
      { path: '/api/documents', method: 'GET', weight: 30 },
      { path: '/api/documents/upload', method: 'POST', weight: 20 },
      { path: '/api/documents/search', method: 'POST', weight: 25 },
      { path: '/api/ocr/process', method: 'POST', weight: 15 },
      { path: '/api/users/profile', method: 'GET', weight: 10 }
    ];

    const totalWeight = actions.reduce((sum, action) => sum + action.weight, 0);
    
    const promises = actions.map(action => {
      const requestCount = Math.floor((action.weight / totalWeight) * 100);
      return this.runSingleActionTest(action, requestCount);
    });

    return Promise.all(promises);
  }

  async runSingleActionTest(action, requestCount) {
    return new Promise((resolve) => {
      const options = {
        url: `${this.baseUrl}${action.path}`,
        method: action.method,
        maxRequests: requestCount,
        concurrency: Math.min(requestCount, 20),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer fake-jwt-token'
        },
        body: action.method === 'POST' ? JSON.stringify({
          test: 'data',
          timestamp: Date.now()
        }) : null
      };

      loadtest.loadTest(options, (error, result) => {
        if (error) {
          console.error(chalk.red(`❌ Erreur pour ${action.path}:`), error);
          resolve({ action, error });
          return;
        }

        console.log(chalk.green(`✅ ${action.path}: ${result.meanRps.toFixed(2)} req/s`));
        resolve({ action, result });
      });
    });
  }

  // Test de montée en charge progressive
  async runRampUpTest() {
    console.log(chalk.blue('📈 Test de montée en charge progressive'));
    
    const userSteps = [10, 20, 30, 40, 50];
    const results = [];

    for (const userCount of userSteps) {
      console.log(chalk.yellow(`Test avec ${userCount} utilisateurs`));
      
      try {
        const result = await this.runConcurrentUsersTest(userCount, '1m');
        results.push({ userCount, ...result });
      } catch (error) {
        console.error(chalk.red(`❌ Échec avec ${userCount} utilisateurs:`), error.message);
        break;
      }
    }

    this.printRampUpReport(results);
    return results;
  }

  analyzeResults(result) {
    this.results.avgLatency = result.meanLatency;
    this.results.maxLatency = result.maxLatency;
    this.results.minLatency = result.minLatency;
  }

  printReport() {
    console.log(chalk.cyan('\n📊 RAPPORT DE TEST D\'UTILISATEURS CONCURRENTS'));
    console.log(chalk.white('═'.repeat(60)));
    console.log(`📈 Total des requêtes: ${this.results.totalRequests}`);
    console.log(`✅ Requêtes réussies: ${this.results.successfulRequests}`);
    console.log(`❌ Requêtes échouées: ${this.failedRequests}`);
    console.log(`⚡ Taux de réussite: ${((this.results.successfulRequests / this.results.totalRequests) * 100).toFixed(2)}%`);
    console.log(`⏱️ Latence moyenne: ${this.results.avgLatency.toFixed(2)}ms`);
    console.log(`🚀 Latence max: ${this.results.maxLatency}ms`);
    console.log(`🐌 Latence min: ${this.results.minLatency}ms`);

    if (Object.keys(this.results.errorCodes).length > 0) {
      console.log(chalk.red('\n🚨 Codes d\'erreur détectés:'));
      Object.entries(this.results.errorCodes).forEach(([code, count]) => {
        console.log(chalk.red(`   HTTP ${code}: ${count} occurrences`));
      });
    }
  }

  printRampUpReport(results) {
    console.log(chalk.cyan('\n📊 RAPPORT DE MONTÉE EN CHARGE'));
    console.log(chalk.white('═'.repeat(60)));
    console.log('Utilisateurs | Requêtes | Latence Moy | Taux Réussite');
    console.log(chalk.white('-'.repeat(60)));
    
    results.forEach(result => {
      const successRate = ((result.successfulRequests / result.totalRequests) * 100).toFixed(1);
      console.log(
        `${result.userCount.toString().padStart(9)} | ` +
        `${result.totalRequests.toString().padStart(9)} | ` +
        `${result.avgLatency.toFixed(2).toString().padStart(11)}ms | ` +
        `${successRate.padStart(5)}%`
      );
    });
  }

  // Sauvegarde des résultats
  saveResults(filename = 'concurrent-users-results.json') {
    const fs = require('fs');
    const path = require('path');
    const reportDir = path.join(__dirname, 'reports');
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportData = {
      timestamp: new Date().toISOString(),
      testType: 'Concurrent Users',
      results: this.results
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
  console.log(chalk.magenta.bold('🧪 SUITE DE TESTS DE CHARGE - UTILISATEURS CONCURRENTS'));
  console.log(chalk.magenta('=' .repeat(70)));

  const tester = new ConcurrentUsersTest();
  
  try {
    // Test 1: 50 utilisateurs concurrents
    console.log(chalk.blue('\n1️⃣ Test 50 utilisateurs concurrents'));
    await tester.runConcurrentUsersTest(50, '2m');
    
    // Test 2: Actions variées
    console.log(chalk.blue('\n2️⃣ Test d\'actions variées'));
    await tester.runVariedActionsTest();
    
    // Test 3: Montée en charge progressive
    console.log(chalk.blue('\n3️⃣ Test de montée en charge progressive'));
    await tester.runRampUpTest();
    
    // Sauvegarde des résultats
    tester.saveResults();
    
    console.log(chalk.green.bold('\n✅ TESTS D\'UTILISATEURS CONCURRENTS TERMINÉS AVEC SUCCÈS'));
    
  } catch (error) {
    console.error(chalk.red.bold('\n❌ ERREUR LORS DES TESTS:'), error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ConcurrentUsersTest;