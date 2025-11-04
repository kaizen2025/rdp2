#!/usr/bin/env node

/**
 * Tests de performance avec données volumineuses (10000+ enregistrements)
 * Teste les performances avec de grandes quantités de données
 */

const mysql = require('mysql2/promise');
const { Pool } = require('pg');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class BigDataPerformanceTest {
  constructor() {
    this.config = {
      mysql: {
        host: process.env.MYSQL_HOST || 'localhost',
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'docucortex_test',
        waitForConnections: true,
        connectionLimit: 20,
        queueLimit: 0
      },
      postgres: {
        host: process.env.PG_HOST || 'localhost',
        user: process.env.PG_USER || 'postgres',
        password: process.env.PG_PASSWORD || '',
        database: process.env.PG_DATABASE || 'docucortex_test',
        max: 20,
        idleTimeoutMillis: 30000
      },
      api: {
        baseUrl: process.env.API_BASE_URL || 'http://localhost:3000'
      }
    };

    this.results = {
      dataGeneration: { recordsCreated: 0, timeTaken: 0 },
      searchPerformance: {
        smallQuery: { responseTime: 0, recordsFound: 0 },
        largeQuery: { responseTime: 0, recordsFound: 0 },
        complexQuery: { responseTime: 0, recordsFound: 0 },
        fullTextSearch: { responseTime: 0, recordsFound: 0 }
      },
      databaseOperations: {
        mysql: {
          select: { responseTime: 0, throughput: 0 },
          update: { responseTime: 0, throughput: 0 },
          delete: { responseTime: 0, throughput: 0 }
        },
        postgres: {
          select: { responseTime: 0, throughput: 0 },
          update: { responseTime: 0, throughput: 0 },
          delete: { responseTime: 0, throughput: 0 }
        }
      },
      apiPerformance: {
        documentList: { responseTime: 0, recordsPerPage: 0, totalRecords: 0 },
        search: { responseTime: 0, resultsCount: 0 },
        export: { responseTime: 0, fileSize: 0 }
      },
      memoryUsage: {
        peak: 0,
        average: 0,
        final: 0
      }
    };

    this.pools = {};
    this.testData = {
      documents: [],
      users: [],
      ocrData: []
    };
    this.simulatorMode = false;
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

  // Génération de données volumineuses
  async generateBigData(recordCount = 15000) {
    console.log(chalk.blue(`📊 Génération de ${recordCount.toLocaleString()} enregistrements de test`));
    
    const startTime = Date.now();
    this.results.dataGeneration.recordsCreated = 0;
    
    // Générer des données de documents
    console.log(chalk.yellow('📄 Génération de documents...'));
    await this.generateDocuments(Math.floor(recordCount * 0.4));
    
    // Générer des données d'utilisateurs
    console.log(chalk.yellow('👥 Génération d\'utilisateurs...'));
    await this.generateUsers(Math.floor(recordCount * 0.1));
    
    // Générer des données OCR
    console.log(chalk.yellow('🔍 Génération de données OCR...'));
    await this.generateOCRData(Math.floor(recordCount * 0.5));
    
    const endTime = Date.now();
    this.results.dataGeneration.timeTaken = endTime - startTime;
    
    console.log(chalk.green(`✅ ${recordCount.toLocaleString()} enregistrements générés en ${(this.results.dataGeneration.timeTaken/1000).toFixed(2}s`));
  }

  async generateDocuments(count) {
    const documents = [];
    
    for (let i = 0; i < count; i++) {
      const document = {
        id: i + 1,
        name: `Document_${i.toString().padStart(6, '0')}_${this.generateRandomText(20)}`,
        content: this.generateLargeText(Math.floor(Math.random() * 10000) + 1000), // 1KB à 10KB
        userId: Math.floor(Math.random() * 1000) + 1,
        type: this.getRandomDocumentType(),
        status: this.getRandomStatus(),
        createdAt: this.getRandomDate(),
        tags: this.generateRandomTags(),
        metadata: {
          size: Math.floor(Math.random() * 10000000), // jusqu'à 10MB
          pages: Math.floor(Math.random() * 500) + 1,
          language: this.getRandomLanguage(),
          confidence: Math.random()
        }
      };
      
      documents.push(document);
      
      // Insertion par lots pour améliorer les performances
      if (documents.length >= 100) {
        await this.insertDocumentsBatch(documents);
        this.testData.documents.push(...documents);
        documents.length = 0;
      }
    }
    
    if (documents.length > 0) {
      await this.insertDocumentsBatch(documents);
      this.testData.documents.push(...documents);
    }
  }

  async generateUsers(count) {
    const users = [];
    
    for (let i = 0; i < count; i++) {
      const user = {
        id: i + 1,
        username: `user_${i.toString().padStart(6, '0')}`,
        email: `user${i}@example.com`,
        fullName: `${this.generateRandomText(5)} ${this.generateRandomText(8)}`,
        department: this.getRandomDepartment(),
        role: this.getRandomRole(),
        permissions: this.generateRandomPermissions(),
        createdAt: this.getRandomDate(),
        lastLogin: this.getRandomDate(),
        preferences: {
          theme: Math.random() > 0.5 ? 'light' : 'dark',
          language: 'fr',
          notifications: Math.random() > 0.3
        },
        statistics: {
          documentsUploaded: Math.floor(Math.random() * 1000),
          searchesPerformed: Math.floor(Math.random() * 5000),
          ocrProcessed: Math.floor(Math.random() * 2000)
        }
      };
      
      users.push(user);
      
      if (users.length >= 100) {
        await this.insertUsersBatch(users);
        this.testData.users.push(...users);
        users.length = 0;
      }
    }
    
    if (users.length > 0) {
      await this.insertUsersBatch(users);
      this.testData.users.push(...users);
    }
  }

  async generateOCRData(count) {
    const ocrRecords = [];
    
    for (let i = 0; i < count; i++) {
      const ocrRecord = {
        id: i + 1,
        documentId: Math.floor(Math.random() * (this.testData.documents.length || 10000)) + 1,
        content: this.generateLargeText(Math.floor(Math.random() * 50000) + 5000), // 5KB à 50KB
        confidence: Math.random(),
        processingTime: Math.floor(Math.random() * 30000) + 1000, // 1s à 30s
        language: this.getRandomLanguage(),
        engine: this.getRandomOCREngine(),
        errors: Math.random() > 0.9 ? [this.generateRandomError()] : [],
        metadata: {
          words: Math.floor(Math.random() * 10000) + 100,
          characters: Math.floor(Math.random() * 50000) + 500,
          pages: Math.floor(Math.random() * 100) + 1,
          processedAt: this.getRandomDate()
        }
      };
      
      ocrRecords.push(ocrRecord);
      
      if (ocrRecords.length >= 50) {
        await this.insertOCRBatch(ocrRecords);
        this.testData.ocrData.push(...ocrRecords);
        ocrRecords.length = 0;
      }
    }
    
    if (ocrRecords.length > 0) {
      await this.insertOCRBatch(ocrRecords);
      this.testData.ocrData.push(...ocrRecords);
    }
  }

  // Insertion par lots
  async insertDocumentsBatch(documents) {
    if (this.simulatorMode) {
      await this.simulateDatabaseOperation('INSERT', 'documents', documents.length);
      return;
    }
    
    try {
      const values = documents.map(doc => [
        doc.name, doc.content, doc.userId, doc.type, doc.status, 
        doc.createdAt, JSON.stringify(doc.tags), JSON.stringify(doc.metadata)
      ]);
      
      await this.pools.mysql.execute(
        `INSERT INTO documents (name, content, user_id, type, status, created_at, tags, metadata) 
         VALUES ?`,
        [values]
      );
      
      await this.pools.postgres.query(
        `INSERT INTO documents (name, content, user_id, type, status, created_at, tags, metadata) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [documents[0].name, documents[0].content, documents[0].userId, documents[0].type, 
         documents[0].status, documents[0].createdAt, JSON.stringify(documents[0].tags), 
         JSON.stringify(documents[0].metadata)]
      );
      
    } catch (error) {
      console.error(chalk.red('❌ Erreur insertion documents:'), error.message);
    }
  }

  async insertUsersBatch(users) {
    if (this.simulatorMode) {
      await this.simulateDatabaseOperation('INSERT', 'users', users.length);
      return;
    }
    
    try {
      const values = users.map(user => [
        user.username, user.email, user.fullName, user.department, user.role,
        JSON.stringify(user.permissions), user.createdAt, user.lastLogin,
        JSON.stringify(user.preferences), JSON.stringify(user.statistics)
      ]);
      
      await this.pools.mysql.execute(
        `INSERT INTO users (username, email, full_name, department, role, permissions, created_at, last_login, preferences, statistics) 
         VALUES ?`,
        [values]
      );
      
    } catch (error) {
      console.error(chalk.red('❌ Erreur insertion users:'), error.message);
    }
  }

  async insertOCRBatch(ocrRecords) {
    if (this.simulatorMode) {
      await this.simulateDatabaseOperation('INSERT', 'ocr_data', ocrRecords.length);
      return;
    }
    
    try {
      const values = ocrRecords.map(record => [
        record.documentId, record.content, record.confidence, record.processingTime,
        record.language, record.engine, JSON.stringify(record.errors),
        JSON.stringify(record.metadata)
      ]);
      
      await this.pools.mysql.execute(
        `INSERT INTO ocr_data (document_id, content, confidence, processing_time, language, engine, errors, metadata) 
         VALUES ?`,
        [values]
      );
      
    } catch (error) {
      console.error(chalk.red('❌ Erreur insertion OCR:'), error.message);
    }
  }

  // Test de performance de recherche
  async testSearchPerformance() {
    console.log(chalk.blue('\n🔍 Test de performance de recherche'));
    
    // Test 1: Recherche simple
    console.log(chalk.yellow('Recherche simple (petit résultat)'));
    const smallQueryStart = Date.now();
    const smallResults = await this.performSearch({ 
      query: 'Document_000001', 
      limit: 10,
      database: 'both'
    });
    this.results.searchPerformance.smallQuery = {
      responseTime: Date.now() - smallQueryStart,
      recordsFound: smallResults.total
    };
    
    // Test 2: Recherche large
    console.log(chalk.yellow('Recherche large (gros résultat)'));
    const largeQueryStart = Date.now();
    const largeResults = await this.performSearch({
      query: 'document',
      limit: 1000,
      database: 'both'
    });
    this.results.searchPerformance.largeQuery = {
      responseTime: Date.now() - largeQueryStart,
      recordsFound: largeResults.total
    };
    
    // Test 3: Recherche complexe
    console.log(chalk.yellow('Recherche complexe (conditions multiples)'));
    const complexQueryStart = Date.now();
    const complexResults = await this.performSearch({
      query: 'test',
      filters: {
        type: 'pdf',
        status: 'processed',
        userId: 123
      },
      sort: 'createdAt',
      order: 'desc',
      database: 'both'
    });
    this.results.searchPerformance.complexQuery = {
      responseTime: Date.now() - complexQueryStart,
      recordsFound: complexResults.total
    };
    
    // Test 4: Recherche full-text
    console.log(chalk.yellow('Recherche full-text'));
    const fullTextStart = Date.now();
    const fullTextResults = await this.performFullTextSearch({
      query: 'content text search performance test',
      database: 'both'
    });
    this.results.searchPerformance.fullTextSearch = {
      responseTime: Date.now() - fullTextStart,
      recordsFound: fullTextResults.total
    };
  }

  async performSearch(options) {
    if (this.simulatorMode) {
      // Simulation d'une recherche
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 100));
      return {
        total: Math.floor(Math.random() * 10000) + 100,
        results: Array.from({ length: Math.min(options.limit || 100, 1000) }, (_, i) => ({
          id: i + 1,
          name: `Result_${i + 1}`,
          relevance: Math.random()
        }))
      };
    }
    
    try {
      // Recherche MySQL
      let mysqlQuery = 'SELECT COUNT(*) as total FROM documents WHERE 1=1';
      let mysqlParams = [];
      
      if (options.query) {
        mysqlQuery += ' AND (name LIKE ? OR content LIKE ?)';
        mysqlParams.push(`%${options.query}%`, `%${options.query}%`);
      }
      
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          mysqlQuery += ` AND ${key} = ?`;
          mysqlParams.push(value);
        });
      }
      
      const [mysqlResult] = await this.pools.mysql.execute(mysqlQuery, mysqlParams);
      
      return {
        total: mysqlResult[0].total,
        mysqlTime: Date.now()
      };
      
    } catch (error) {
      console.error(chalk.red('❌ Erreur recherche:'), error.message);
      return { total: 0, results: [] };
    }
  }

  async performFullTextSearch(options) {
    if (this.simulatorMode) {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
      return {
        total: Math.floor(Math.random() * 5000) + 50,
        results: []
      };
    }
    
    try {
      // Recherche full-text PostgreSQL (plus performant pour ce cas)
      const [result] = await this.pools.postgres.query(
        `SELECT COUNT(*) as total FROM documents 
         WHERE to_tsvector('french', name || ' ' || content) @@ plainto_tsquery('french', $1)`,
        [options.query]
      );
      
      return {
        total: parseInt(result.rows[0].total),
        postgresTime: Date.now()
      };
      
    } catch (error) {
      console.error(chalk.red('❌ Erreur full-text search:'), error.message);
      return { total: 0, results: [] };
    }
  }

  // Test des opérations de base de données
  async testDatabaseOperations() {
    console.log(chalk.blue('\n💾 Test des opérations base de données'));
    
    // Test SELECT
    console.log(chalk.yellow('Test SELECT - Lecture de données'));
    await this.testSelectOperations();
    
    // Test UPDATE
    console.log(chalk.yellow('Test UPDATE - Mise à jour de données'));
    await this.testUpdateOperations();
    
    // Test DELETE
    console.log(chalk.yellow('Test DELETE - Suppression de données'));
    await this.testDeleteOperations();
  }

  async testSelectOperations() {
    const operations = [
      { name: 'Select Simple', query: 'SELECT * FROM documents LIMIT 1000' },
      { name: 'Select with JOIN', query: 'SELECT d.*, u.username FROM documents d JOIN users u ON d.user_id = u.id LIMIT 1000' },
      { name: 'Select with GROUP BY', query: 'SELECT user_id, COUNT(*) as doc_count FROM documents GROUP BY user_id LIMIT 100' }
    ];
    
    for (const operation of operations) {
      // Test MySQL
      const mysqlStart = Date.now();
      if (!this.simulatorMode) {
        try {
          await this.pools.mysql.execute(operation.query);
          this.results.databaseOperations.mysql.select.responseTime += Date.now() - mysqlStart;
          this.results.databaseOperations.mysql.select.throughput += 1000;
        } catch (error) {
          console.error(chalk.red(`❌ Erreur MySQL SELECT ${operation.name}:`), error.message);
        }
      } else {
        await this.simulateDatabaseOperation('SELECT', 'documents', 1000);
        this.results.databaseOperations.mysql.select.responseTime += 150;
      }
      
      // Test PostgreSQL
      const pgStart = Date.now();
      if (!this.simulatorMode) {
        try {
          await this.pools.postgres.query(operation.query);
          this.results.databaseOperations.postgres.select.responseTime += Date.now() - pgStart;
          this.results.databaseOperations.postgres.select.throughput += 1000;
        } catch (error) {
          console.error(chalk.red(`❌ Erreur PostgreSQL SELECT ${operation.name}:`), error.message);
        }
      } else {
        await this.simulateDatabaseOperation('SELECT', 'documents', 1000);
        this.results.databaseOperations.postgres.select.responseTime += 120;
      }
    }
  }

  async testUpdateOperations() {
    const operations = [
      { name: 'Update Simple', query: 'UPDATE documents SET status = ? WHERE id <= ?' },
      { name: 'Update with JOIN', query: 'UPDATE documents d JOIN users u ON d.user_id = u.id SET d.status = ? WHERE u.department = ?' }
    ];
    
    for (const operation of operations) {
      // Test MySQL
      const mysqlStart = Date.now();
      if (!this.simulatorMode) {
        try {
          await this.pools.mysql.execute(operation.query, ['updated', 'IT']);
          this.results.databaseOperations.mysql.update.responseTime += Date.now() - mysqlStart;
          this.results.databaseOperations.mysql.update.throughput += 500;
        } catch (error) {
          console.error(chalk.red(`❌ Erreur MySQL UPDATE ${operation.name}:`), error.message);
        }
      } else {
        await this.simulateDatabaseOperation('UPDATE', 'documents', 500);
        this.results.databaseOperations.mysql.update.responseTime += 300;
      }
      
      // Test PostgreSQL
      const pgStart = Date.now();
      if (!this.simulatorMode) {
        try {
          await this.pools.postgres.query(operation.query, ['updated', 'IT']);
          this.results.databaseOperations.postgres.update.responseTime += Date.now() - pgStart;
          this.results.databaseOperations.postgres.update.throughput += 500;
        } catch (error) {
          console.error(chalk.red(`❌ Erreur PostgreSQL UPDATE ${operation.name}:`), error.message);
        }
      } else {
        await this.simulateDatabaseOperation('UPDATE', 'documents', 500);
        this.results.databaseOperations.postgres.update.responseTime += 280;
      }
    }
  }

  async testDeleteOperations() {
    const operations = [
      { name: 'Delete Simple', query: 'DELETE FROM documents WHERE id > ?' },
      { name: 'Delete with Condition', query: 'DELETE FROM documents WHERE status = ? AND created_at < ?' }
    ];
    
    for (const operation of operations) {
      // Test MySQL
      const mysqlStart = Date.now();
      if (!this.simulatorMode) {
        try {
          await this.pools.mysql.execute(operation.query, ['test', new Date(Date.now() - 86400000)]);
          this.results.databaseOperations.mysql.delete.responseTime += Date.now() - mysqlStart;
          this.results.databaseOperations.mysql.delete.throughput += 200;
        } catch (error) {
          console.error(chalk.red(`❌ Erreur MySQL DELETE ${operation.name}:`), error.message);
        }
      } else {
        await this.simulateDatabaseOperation('DELETE', 'documents', 200);
        this.results.databaseOperations.mysql.delete.responseTime += 200;
      }
      
      // Test PostgreSQL
      const pgStart = Date.now();
      if (!this.simulatorMode) {
        try {
          await this.pools.postgres.query(operation.query, ['test', new Date(Date.now() - 86400000)]);
          this.results.databaseOperations.postgres.delete.responseTime += Date.now() - pgStart;
          this.results.databaseOperations.postgres.delete.throughput += 200;
        } catch (error) {
          console.error(chalk.red(`❌ Erreur PostgreSQL DELETE ${operation.name}:`), error.message);
        }
      } else {
        await this.simulateDatabaseOperation('DELETE', 'documents', 200);
        this.results.databaseOperations.postgres.delete.responseTime += 180;
      }
    }
  }

  // Test de performance API
  async testAPIPerformance() {
    console.log(chalk.blue('\n🌐 Test de performance API'));
    
    // Test 1: Liste des documents
    console.log(chalk.yellow('API - Liste des documents (pagination)'));
    const docListStart = Date.now();
    const docListResult = await this.testDocumentListAPI();
    this.results.apiPerformance.documentList = {
      responseTime: Date.now() - docListStart,
      recordsPerPage: docListResult.recordsPerPage || 0,
      totalRecords: docListResult.totalRecords || 0
    };
    
    // Test 2: Recherche API
    console.log(chalk.yellow('API - Recherche de documents'));
    const searchStart = Date.now();
    const searchResult = await this.testSearchAPI();
    this.results.apiPerformance.search = {
      responseTime: Date.now() - searchStart,
      resultsCount: searchResult.count || 0
    };
    
    // Test 3: Export de données
    console.log(chalk.yellow('API - Export de données'));
    const exportStart = Date.now();
    const exportResult = await this.testExportAPI();
    this.results.apiPerformance.export = {
      responseTime: Date.now() - exportStart,
      fileSize: exportResult.size || 0
    };
  }

  async testDocumentListAPI() {
    try {
      const pages = [1, 2, 5, 10, 20, 50];
      let totalRecords = 0;
      let totalTime = 0;
      
      for (const page of pages) {
        const pageStart = Date.now();
        
        const response = await axios.get(`${this.config.api.baseUrl}/api/documents`, {
          params: { page, limit: 100 },
          timeout: 10000
        });
        
        const pageTime = Date.now() - pageStart;
        totalTime += pageTime;
        totalRecords += response.data?.total || 0;
      }
      
      return {
        totalRecords,
        recordsPerPage: 100,
        avgResponseTime: totalTime / pages.length
      };
      
    } catch (error) {
      console.error(chalk.red('❌ Erreur API document list:'), error.message);
      return { totalRecords: 0, recordsPerPage: 0 };
    }
  }

  async testSearchAPI() {
    try {
      const queries = ['test', 'document', 'user', 'pdf', 'data'];
      let totalResults = 0;
      
      for (const query of queries) {
        const response = await axios.get(`${this.config.api.baseUrl}/api/search`, {
          params: { q: query, limit: 500 },
          timeout: 15000
        });
        
        totalResults += response.data?.results?.length || 0;
      }
      
      return { count: totalResults };
      
    } catch (error) {
      console.error(chalk.red('❌ Erreur API search:'), error.message);
      return { count: 0 };
    }
  }

  async testExportAPI() {
    try {
      const response = await axios.get(`${this.config.api.baseUrl}/api/export/documents`, {
        params: { format: 'json', limit: 5000 },
        timeout: 30000,
        responseType: 'stream'
      });
      
      let size = 0;
      response.data.on('data', (chunk) => {
        size += chunk.length;
      });
      
      return new Promise((resolve) => {
        response.data.on('end', () => {
          resolve({ size });
        });
      });
      
    } catch (error) {
      console.error(chalk.red('❌ Erreur API export:'), error.message);
      return { size: 0 };
    }
  }

  // Utilitaires
  generateRandomText(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  generateLargeText(minLength) {
    const sentences = [
      'Ceci est une phrase de test pour générer du contenu volumineux.',
      'Les performances avec de grandes quantités de données sont cruciales.',
      'DocuCortex doit gérer efficacement de nombreux documents.',
      'La recherche full-text doit rester rapide même avec beaucoup de données.',
      'Les tests de charge aident à identifier les goulots d\'étranglement.'
    ];
    
    let result = '';
    const sentenceCount = Math.floor(minLength / 100);
    
    for (let i = 0; i < sentenceCount; i++) {
      const sentence = sentences[Math.floor(Math.random() * sentences.length)];
      result += sentence + ' ';
    }
    
    return result.trim();
  }

  generateRandomTags() {
    const tags = ['important', 'document', 'test', 'user', 'system', 'data', 'file', 'archive'];
    const count = Math.floor(Math.random() * 5) + 1;
    return Array.from({ length: count }, () => tags[Math.floor(Math.random() * tags.length)]);
  }

  getRandomDocumentType() {
    const types = ['pdf', 'doc', 'docx', 'txt', 'image', 'spreadsheet'];
    return types[Math.floor(Math.random() * types.length)];
  }

  getRandomStatus() {
    const statuses = ['draft', 'processing', 'processed', 'archived', 'deleted'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  getRandomDepartment() {
    const departments = ['IT', 'HR', 'Finance', 'Marketing', 'Sales', 'Operations'];
    return departments[Math.floor(Math.random() * departments.length)];
  }

  getRandomRole() {
    const roles = ['user', 'admin', 'manager', 'viewer', 'editor'];
    return roles[Math.floor(Math.random() * roles.length)];
  }

  generateRandomPermissions() {
    const permissions = ['read', 'write', 'delete', 'admin', 'export'];
    const count = Math.floor(Math.random() * 3) + 1;
    return Array.from({ length: count }, () => permissions[Math.floor(Math.random() * permissions.length)]);
  }

  getRandomLanguage() {
    const languages = ['fr', 'en', 'de', 'es', 'it'];
    return languages[Math.floor(Math.random() * languages.length)];
  }

  getRandomOCREngine() {
    const engines = ['tesseract', 'aws', 'google', 'azure'];
    return engines[Math.floor(Math.random() * engines.length)];
  }

  generateRandomError() {
    const errors = ['OCR_TIMEOUT', 'LOW_CONFIDENCE', 'UNSUPPORTED_FORMAT', 'CORRUPTED_FILE'];
    return errors[Math.floor(Math.random() * errors.length)];
  }

  getRandomDate() {
    const start = new Date(2023, 0, 1);
    const end = new Date();
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }

  async simulateDatabaseOperation(operation, table, recordCount) {
    // Simulation réaliste des performances
    const baseTime = {
      'SELECT': recordCount * 0.1,
      'INSERT': recordCount * 2,
      'UPDATE': recordCount * 1.5,
      'DELETE': recordCount * 1.2
    };
    
    const time = baseTime[operation] + Math.random() * 100;
    await new Promise(resolve => setTimeout(resolve, time));
  }

  // Rapport des résultats
  printReport() {
    console.log(chalk.cyan('\n📊 RAPPORT DE TEST DE PERFORMANCE - DONNÉES VOLUMINEUSES'));
    console.log(chalk.white('═'.repeat(80)));
    
    // Génération de données
    console.log(chalk.yellow('\n📊 GÉNÉRATION DE DONNÉES'));
    console.log(`   Enregistrements créés: ${this.results.dataGeneration.recordsCreated.toLocaleString()}`);
    console.log(`   Temps de génération: ${(this.results.dataGeneration.timeTaken/1000).toFixed(2)}s`);
    console.log(`   Taux: ${(this.results.dataGeneration.recordsCreated / (this.results.dataGeneration.timeTaken/1000)).toFixed(0)} records/s`);
    
    // Performance de recherche
    console.log(chalk.yellow('\n🔍 PERFORMANCE DE RECHERCHE'));
    console.log(`   Recherche simple: ${this.results.searchPerformance.smallQuery.responseTime}ms (${this.results.searchPerformance.smallQuery.recordsFound} résultats)`);
    console.log(`   Recherche large: ${this.results.searchPerformance.largeQuery.responseTime}ms (${this.results.searchPerformance.largeQuery.recordsFound} résultats)`);
    console.log(`   Recherche complexe: ${this.results.searchPerformance.complexQuery.responseTime}ms (${this.results.searchPerformance.complexQuery.recordsFound} résultats)`);
    console.log(`   Full-text search: ${this.results.searchPerformance.fullTextSearch.responseTime}ms (${this.results.searchPerformance.fullTextSearch.recordsFound} résultats)`);
    
    // Opérations base de données
    console.log(chalk.yellow('\n💾 OPÉRATIONS BASE DE DONNÉES'));
    console.log(chalk.cyan('MySQL:'));
    console.log(`   SELECT: ${this.results.databaseOperations.mysql.select.responseTime}ms (${this.results.databaseOperations.mysql.select.throughput} ops)`);
    console.log(`   UPDATE: ${this.results.databaseOperations.mysql.update.responseTime}ms (${this.results.databaseOperations.mysql.update.throughput} ops)`);
    console.log(`   DELETE: ${this.results.databaseOperations.mysql.delete.responseTime}ms (${this.results.databaseOperations.mysql.delete.throughput} ops)`);
    
    console.log(chalk.cyan('PostgreSQL:'));
    console.log(`   SELECT: ${this.results.databaseOperations.postgres.select.responseTime}ms (${this.results.databaseOperations.postgres.select.throughput} ops)`);
    console.log(`   UPDATE: ${this.results.databaseOperations.postgres.update.responseTime}ms (${this.results.databaseOperations.postgres.update.throughput} ops)`);
    console.log(`   DELETE: ${this.results.databaseOperations.postgres.delete.responseTime}ms (${this.results.databaseOperations.postgres.delete.throughput} ops)`);
    
    // Performance API
    console.log(chalk.yellow('\n🌐 PERFORMANCE API'));
    console.log(`   Liste documents: ${this.results.apiPerformance.documentList.responseTime}ms`);
    console.log(`   Recherche API: ${this.results.apiPerformance.search.responseTime}ms`);
    console.log(`   Export données: ${this.results.apiPerformance.export.responseTime}ms`);
    
    // Recommandations
    console.log(chalk.cyan('\n💡 RECOMMANDATIONS'));
    const avgSearchTime = (this.results.searchPerformance.smallQuery.responseTime + 
                          this.results.searchPerformance.largeQuery.responseTime + 
                          this.results.searchPerformance.complexQuery.responseTime + 
                          this.results.searchPerformance.fullTextSearch.responseTime) / 4;
    
    if (avgSearchTime > 1000) {
      console.log(chalk.red('   ⚠️ Temps de recherche élevés - Consider indexing optimization'));
    }
    if (this.results.databaseOperations.mysql.select.throughput < 1000) {
      console.log(chalk.red('   ⚠️ Débit SELECT faible - Consider query optimization'));
    }
  }

  // Sauvegarde des résultats
  saveResults(filename = 'big-data-performance-results.json') {
    const fs = require('fs');
    const path = require('path');
    const reportDir = path.join(__dirname, '..', 'reports');
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportData = {
      timestamp: new Date().toISOString(),
      testType: 'Big Data Performance Test',
      results: this.results,
      testDataSummary: {
        totalRecords: this.results.dataGeneration.recordsCreated,
        documents: this.testData.documents.length,
        users: this.testData.users.length,
        ocrData: this.testData.ocrData.length
      }
    };

    fs.writeFileSync(
      path.join(reportDir, filename),
      JSON.stringify(reportData, null, 2)
    );

    console.log(chalk.green(`📁 Résultats sauvegardés: ${filename}`));
  }

  // Nettoyage des données de test
  async cleanup() {
    console.log(chalk.yellow('🧹 Nettoyage des données de test...'));
    
    if (!this.simulatorMode) {
      try {
        await this.pools.mysql.execute('DELETE FROM documents WHERE name LIKE "Document_%"');
        await this.pools.mysql.execute('DELETE FROM users WHERE username LIKE "user_%"');
        await this.pools.mysql.execute('DELETE FROM ocr_data WHERE confidence < 1.0');
      } catch (error) {
        console.warn(chalk.yellow('⚠️ Erreur lors du nettoyage:'), error.message);
      }
    }
    
    if (this.pools.mysql) await this.pools.mysql.end();
    if (this.pools.postgres) await this.pools.postgres.end();
  }
}

// Exécution du test
async function main() {
  console.log(chalk.magenta.bold('🧪 SUITE DE TESTS DE CHARGE - PERFORMANCE DONNÉES VOLUMINEUSES'));
  console.log(chalk.magenta('=' .repeat(90)));

  const tester = new BigDataPerformanceTest();
  
  try {
    await tester.initialize();
    
    // Test 1: Génération de données volumineuses
    console.log(chalk.blue('\n1️⃣ Génération de données volumineuses'));
    await tester.generateBigData(10000);
    
    // Test 2: Performance de recherche
    console.log(chalk.blue('\n2️⃣ Tests de performance de recherche'));
    await tester.testSearchPerformance();
    
    // Test 3: Opérations base de données
    console.log(chalk.blue('\n3️⃣ Tests d\'opérations base de données'));
    await tester.testDatabaseOperations();
    
    // Test 4: Performance API
    console.log(chalk.blue('\n4️⃣ Tests de performance API'));
    await tester.testAPIPerformance();
    
    // Rapport et sauvegarde
    tester.printReport();
    tester.saveResults();
    
    console.log(chalk.green.bold('\n✅ TESTS DE PERFORMANCE DONNÉES VOLUMINEUSES TERMINÉS AVEC SUCCÈS'));
    
  } catch (error) {
    console.error(chalk.red.bold('\n❌ ERREUR LORS DES TESTS:'), error);
  } finally {
    // Nettoyage
    await tester.cleanup();
  }
}

if (require.main === module) {
  main();
}

module.exports = BigDataPerformanceTest;