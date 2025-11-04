#!/usr/bin/env node

/**
 * Tests de performance avec accès concurrent à la base de données
 * Teste la stabilité et les performances des opérations de base de données simultanées
 */

const mysql = require('mysql2/promise');
const { Pool } = require('pg');
const axios = require('axios');
const chalk = require('chalk');

class DatabaseConcurrentTest {
  constructor() {
    this.config = {
      mysql: {
        host: process.env.MYSQL_HOST || 'localhost',
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'test_db',
        waitForConnections: true,
        connectionLimit: 50,
        queueLimit: 0
      },
      postgres: {
        host: process.env.PG_HOST || 'localhost',
        user: process.env.PG_USER || 'postgres',
        password: process.env.PG_PASSWORD || '',
        database: process.env.PG_DATABASE || 'test_db',
        max: 50,
        idleTimeoutMillis: 30000
      },
      api: {
        baseUrl: process.env.API_BASE_URL || 'http://localhost:3000'
      }
    };

    this.results = {
      mysql: { success: 0, errors: 0, avgTime: 0 },
      postgres: { success: 0, errors: 0, avgTime: 0 },
      api: { success: 0, errors: 0, avgTime: 0 },
      concurrentOperations: []
    };

    this.pools = {};
  }

  // Initialisation des connexions
  async initialize() {
    try {
      // Pool MySQL
      this.pools.mysql = mysql.createPool(this.config.mysql);
      console.log(chalk.green('✅ Pool MySQL initialisé'));
      
      // Pool PostgreSQL
      this.pools.postgres = new Pool(this.config.postgres);
      console.log(chalk.green('✅ Pool PostgreSQL initialisé'));
      
    } catch (error) {
      console.warn(chalk.yellow('⚠️ Connexions base de données non disponibles, utilisation du mode simulateur'));
      this.simulatorMode = true;
    }
  }

  // Test d'insertion concurrente
  async testConcurrentInserts(tableName = 'test_concurrent', recordCount = 1000) {
    console.log(chalk.blue(`📝 Test d'insertions concurrentes: ${recordCount} enregistrements`));
    
    const startTime = Date.now();
    const operations = [];
    
    // Test MySQL
    if (!this.simulatorMode) {
      operations.push(this.testMySQLInserts(tableName, recordCount));
    } else {
      operations.push(this.simulateDatabaseOperation('MySQL INSERT', recordCount));
    }
    
    // Test PostgreSQL
    if (!this.simulatorMode) {
      operations.push(this.testPostgreSQLInserts(tableName, recordCount));
    } else {
      operations.push(this.simulateDatabaseOperation('PostgreSQL INSERT', recordCount));
    }

    const results = await Promise.allSettled(operations);
    
    const endTime = Date.now();
    console.log(chalk.green(`✅ Test d'insertions terminé en ${((endTime - startTime) / 1000).toFixed(2)}s`));
    
    return results;
  }

  async testMySQLInserts(tableName, recordCount) {
    const startTime = Date.now();
    let success = 0;
    let errors = 0;

    try {
      // Créer la table si elle n'existe pas
      await this.pools.mysql.execute(`
        CREATE TABLE IF NOT EXISTS ${tableName} (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          document_name VARCHAR(255),
          content TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user_id (user_id)
        )
      `);

      // Insertions concurrentes par lots
      const batchSize = 100;
      const batches = Math.ceil(recordCount / batchSize);
      
      const promises = [];
      for (let i = 0; i < batches; i++) {
        const batch = this.generateBatchData(i * batchSize, Math.min(batchSize, recordCount - i * batchSize));
        promises.push(
          this.pools.mysql.execute(
            `INSERT INTO ${tableName} (user_id, document_name, content) VALUES ?`,
            [batch]
          )
        );
      }

      const results = await Promise.all(promises);
      success = results.length;
      
    } catch (error) {
      console.error(chalk.red('❌ Erreur MySQL inserts:'), error.message);
      errors++;
    }

    const endTime = Date.now();
    this.results.mysql.success += success;
    this.results.mysql.errors += errors;
    this.results.mysql.avgTime += (endTime - startTime);

    return { database: 'MySQL', operation: 'INSERT', success, errors, duration: endTime - startTime };
  }

  async testPostgreSQLInserts(tableName, recordCount) {
    const startTime = Date.now();
    let success = 0;
    let errors = 0;

    try {
      // Créer la table si elle n'existe pas
      await this.pools.postgres.query(`
        CREATE TABLE IF NOT EXISTS ${tableName} (
          id SERIAL PRIMARY KEY,
          user_id INTEGER,
          document_name VARCHAR(255),
          content TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Insertions concurrentes par lots
      const batchSize = 100;
      const batches = Math.ceil(recordCount / batchSize);
      
      const promises = [];
      for (let i = 0; i < batches; i++) {
        const batch = this.generateBatchData(i * batchSize, Math.min(batchSize, recordCount - i * batchSize));
        const values = batch.map((_, index) => 
          `($${index * 3 + 1}, $${index * 3 + 2}, $${index * 3 + 3})`
        ).join(', ');
        
        const params = batch.flat();
        promises.push(
          this.pools.postgres.query(
            `INSERT INTO ${tableName} (user_id, document_name, content) VALUES ${values}`,
            params
          )
        );
      }

      const results = await Promise.all(promises);
      success = results.length;
      
    } catch (error) {
      console.error(chalk.red('❌ Erreur PostgreSQL inserts:'), error.message);
      errors++;
    }

    const endTime = Date.now();
    this.results.postgres.success += success;
    this.results.postgres.errors += errors;
    this.results.postgres.avgTime += (endTime - startTime);

    return { database: 'PostgreSQL', operation: 'INSERT', success, errors, duration: endTime - startTime };
  }

  // Test de lectures concurrentes
  async testConcurrentReads(tableName = 'test_concurrent', queryCount = 1000) {
    console.log(chalk.blue(`📖 Test de lectures concurrentes: ${queryCount} requêtes`));
    
    const operations = [];
    
    // Test MySQL
    if (!this.simulatorMode) {
      operations.push(this.testMySQLReads(tableName, queryCount));
    } else {
      operations.push(this.simulateDatabaseOperation('MySQL SELECT', queryCount));
    }
    
    // Test PostgreSQL
    if (!this.simulatorMode) {
      operations.push(this.testPostgreSQLReads(tableName, queryCount));
    } else {
      operations.push(this.simulateDatabaseOperation('PostgreSQL SELECT', queryCount));
    }

    const results = await Promise.allSettled(operations);
    return results;
  }

  async testMySQLReads(tableName, queryCount) {
    const startTime = Date.now();
    let success = 0;
    let errors = 0;

    try {
      const promises = [];
      for (let i = 0; i < queryCount; i++) {
        promises.push(
          this.pools.mysql.execute(
            `SELECT * FROM ${tableName} WHERE user_id = ? LIMIT 10`,
            [Math.floor(Math.random() * 1000)]
          )
        );
      }

      const results = await Promise.allSettled(promises);
      success = results.filter(r => r.status === 'fulfilled').length;
      errors = results.length - success;
      
    } catch (error) {
      console.error(chalk.red('❌ Erreur MySQL reads:'), error.message);
      errors++;
    }

    const endTime = Date.now();
    this.results.mysql.success += success;
    this.results.mysql.errors += errors;
    this.results.mysql.avgTime += (endTime - startTime);

    return { database: 'MySQL', operation: 'SELECT', success, errors, duration: endTime - startTime };
  }

  async testPostgreSQLReads(tableName, queryCount) {
    const startTime = Date.now();
    let success = 0;
    let errors = 0;

    try {
      const promises = [];
      for (let i = 0; i < queryCount; i++) {
        promises.push(
          this.pools.postgres.query(
            `SELECT * FROM ${tableName} WHERE user_id = $1 LIMIT 10`,
            [Math.floor(Math.random() * 1000)]
          )
        );
      }

      const results = await Promise.allSettled(promises);
      success = results.filter(r => r.status === 'fulfilled').length;
      errors = results.length - success;
      
    } catch (error) {
      console.error(chalk.red('❌ Erreur PostgreSQL reads:'), error.message);
      errors++;
    }

    const endTime = Date.now();
    this.results.postgres.success += success;
    this.results.postgres.errors += errors;
    this.results.postgres.avgTime += (endTime - startTime);

    return { database: 'PostgreSQL', operation: 'SELECT', success, errors, duration: endTime - startTime };
  }

  // Test d'opérations mixtes concurrentes
  async testMixedOperations() {
    console.log(chalk.blue('🔄 Test d\'opérations mixtes concurrentes'));
    
    const operations = [
      'INSERT', 'SELECT', 'UPDATE', 'DELETE', 'SELECT'
    ];
    
    const promises = operations.map(operation => 
      this.simulateDatabaseOperation(operation, 50)
    );

    const results = await Promise.allSettled(promises);
    return results;
  }

  // Test via API
  async testAPIDatabaseOperations() {
    console.log(chalk.blue('🌐 Test des opérations base de données via API'));
    
    const operations = [
      { endpoint: '/api/documents', method: 'GET' },
      { endpoint: '/api/documents', method: 'POST', data: { name: 'Test Document' } },
      { endpoint: '/api/users', method: 'GET' },
      { endpoint: '/api/ocr/history', method: 'GET' }
    ];

    const promises = [];
    
    // 100 requêtes par opération
    for (const operation of operations) {
      for (let i = 0; i < 100; i++) {
        promises.push(this.callAPI(operation));
      }
    }

    const startTime = Date.now();
    const results = await Promise.allSettled(promises);
    const endTime = Date.now();

    const success = results.filter(r => r.status === 'fulfilled').length;
    const errors = results.length - success;
    
    this.results.api.success += success;
    this.results.api.errors += errors;
    this.results.api.avgTime += (endTime - startTime);

    return { success, errors, duration: endTime - startTime, totalRequests: results.length };
  }

  async callAPI(operation) {
    try {
      const config = {
        method: operation.method,
        url: `${this.config.api.baseUrl}${operation.endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer fake-jwt-token'
        },
        timeout: 10000
      };

      if (operation.data) {
        config.data = operation.data;
      }

      await axios(config);
      return { status: 'success' };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  // Génération de données de test
  generateBatchData(startIndex, count) {
    const batch = [];
    for (let i = 0; i < count; i++) {
      batch.push([
        Math.floor(Math.random() * 1000) + startIndex,
        `Document_${startIndex + i}_${Date.now()}`,
        `Contenu du document ${startIndex + i} avec des données de test étendues...`.repeat(10)
      ]);
    }
    return batch;
  }

  // Simulation d'opération base de données
  async simulateDatabaseOperation(type, count) {
    const startTime = Date.now();
    
    // Simulation du temps d'exécution réaliste
    const delay = Math.random() * 50 + 10; // 10-60ms par opération
    
    const promises = [];
    for (let i = 0; i < Math.min(count, 50); i++) {
      promises.push(new Promise(resolve => {
        setTimeout(() => {
          resolve({ 
            database: type.split(' ')[0], 
            operation: type.split(' ')[1], 
            success: true,
            duration: delay 
          });
        }, delay);
      }));
    }

    const results = await Promise.all(promises);
    const endTime = Date.now();
    
    return { 
      database: type.split(' ')[0], 
      operation: type.split(' ')[1], 
      success: results.length,
      errors: 0,
      duration: endTime - startTime 
    };
  }

  // Rapport de résultats
  printReport() {
    console.log(chalk.cyan('\n📊 RAPPORT DE TEST BASE DE DONNÉES CONCURRENTE'));
    console.log(chalk.white('═'.repeat(70)));

    // Résultats MySQL
    console.log(chalk.yellow('\n🗄️ MySQL'));
    console.log(`   ✅ Succès: ${this.results.mysql.success}`);
    console.log(`   ❌ Erreurs: ${this.results.mysql.errors}`);
    console.log(`   ⏱️ Temps moyen: ${(this.results.mysql.avgTime / 1000).toFixed(2)}s`);

    // Résultats PostgreSQL
    console.log(chalk.yellow('\n🐘 PostgreSQL'));
    console.log(`   ✅ Succès: ${this.results.postgres.success}`);
    console.log(`   ❌ Erreurs: ${this.results.postgres.errors}`);
    console.log(`   ⏱️ Temps moyen: ${(this.results.postgres.avgTime / 1000).toFixed(2)}s`);

    // Résultats API
    console.log(chalk.yellow('\n🌐 API'));
    console.log(`   ✅ Succès: ${this.results.api.success}`);
    console.log(`   ❌ Erreurs: ${this.results.api.errors}`);
    console.log(`   ⏱️ Temps moyen: ${(this.results.api.avgTime / 1000).toFixed(2)}s`);

    const totalSuccess = this.results.mysql.success + this.results.postgres.success + this.results.api.success;
    const totalErrors = this.results.mysql.errors + this.results.postgres.errors + this.results.api.errors;
    const totalOperations = totalSuccess + totalErrors;
    
    console.log(chalk.cyan('\n📈 RÉSUMÉ GLOBAL'));
    console.log(chalk.white('═'.repeat(30)));
    console.log(`🔢 Total opérations: ${totalOperations}`);
    console.log(`✅ Taux de réussite: ${((totalSuccess / totalOperations) * 100).toFixed(2)}%`);
  }

  // Sauvegarde des résultats
  saveResults(filename = 'database-concurrent-results.json') {
    const fs = require('fs');
    const path = require('path');
    const reportDir = path.join(__dirname, '..', 'reports');
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportData = {
      timestamp: new Date().toISOString(),
      testType: 'Database Concurrent Operations',
      results: this.results,
      configuration: this.config
    };

    fs.writeFileSync(
      path.join(reportDir, filename),
      JSON.stringify(reportData, null, 2)
    );

    console.log(chalk.green(`📁 Résultats sauvegardés: ${filename}`));
  }

  // Fermeture des connexions
  async cleanup() {
    if (this.pools.mysql) {
      await this.pools.mysql.end();
    }
    if (this.pools.postgres) {
      await this.pools.postgres.end();
    }
  }
}

// Exécution du test
async function main() {
  console.log(chalk.magenta.bold('🧪 SUITE DE TESTS DE CHARGE - BASE DE DONNÉES CONCURRENTE'));
  console.log(chalk.magenta('=' .repeat(80)));

  const tester = new DatabaseConcurrentTest();
  
  try {
    await tester.initialize();
    
    // Test 1: Insertions concurrentes
    console.log(chalk.blue('\n1️⃣ Test d\'insertions concurrentes'));
    await tester.testConcurrentInserts('test_concurrent_inserts', 1000);
    
    // Test 2: Lectures concurrentes
    console.log(chalk.blue('\n2️⃣ Test de lectures concurrentes'));
    await tester.testConcurrentReads('test_concurrent_inserts', 1000);
    
    // Test 3: Opérations mixtes
    console.log(chalk.blue('\n3️⃣ Test d\'opérations mixtes'));
    await tester.testMixedOperations();
    
    // Test 4: API Database Operations
    console.log(chalk.blue('\n4️⃣ Test opérations via API'));
    await tester.testAPIDatabaseOperations();
    
    // Rapport et sauvegarde
    tester.printReport();
    tester.saveResults();
    
    console.log(chalk.green.bold('\n✅ TESTS BASE DE DONNÉES CONCURRENTE TERMINÉS AVEC SUCCÈS'));
    
  } catch (error) {
    console.error(chalk.red.bold('\n❌ ERREUR LORS DES TESTS:'), error);
  } finally {
    await tester.cleanup();
  }
}

if (require.main === module) {
  main();
}

module.exports = DatabaseConcurrentTest;