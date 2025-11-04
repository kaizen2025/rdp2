/**
 * Tests de performance de la base de données SQLite
 * @file db-performance.js
 */

const Database = require('better-sqlite3');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');

class DatabasePerformanceTester {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.db = null;
        this.results = {
            timestamp: moment().toISOString(),
            database: {
                path: config.servers.database.path,
                size: 0
            },
            connectionTests: {},
            queryTests: {},
            concurrentTests: {},
            indexTests: {},
            summary: {},
            metrics: {}
        };
    }

    async runAllTests() {
        const startTime = moment();
        this.logger.info('🗄️ Début des tests de performance base de données');

        try {
            await this.connectToDatabase();
            await this.runConnectionTests();
            await this.runQueryPerformanceTests();
            await this.runConcurrentTests();
            await this.runIndexTests();
            await this.runMemoryUsageTests();
            
            const endTime = moment();
            const duration = endTime.diff(startTime);
            
            this.results.summary = {
                success: true,
                duration: `${duration}ms`,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                testsRun: Object.keys(this.results).filter(k => k !== 'timestamp' && k !== 'summary').length
            };
            
            this.calculateOverallMetrics();
            this.logger.success('✅ Tests base de données terminés');
            
        } catch (error) {
            this.logger.error('❌ Erreur lors des tests base de données:', error);
            this.results.summary = {
                success: false,
                error: error.message,
                duration: moment().diff(startTime) + 'ms'
            };
        } finally {
            this.closeConnection();
        }
        
        return this.results;
    }

    async connectToDatabase() {
        this.logger.info('🔌 Connexion à la base de données');
        
        try {
            // Vérifier l'existence du fichier
            const dbExists = await fs.pathExists(this.config.servers.database.path);
            if (!dbExists) {
                this.logger.warn('⚠️ Fichier de base de données non trouvé, création d\'une base vide');
            }
            
            // Connexion avec options optimisées
            this.db = new Database(this.config.servers.database.path, {
                fileMustExist: dbExists,
                timeout: this.config.database.connectionTests.timeout
            });
            
            // Configurations SQLite pour les performances
            this.db.pragma('synchronous = NORMAL');
            this.db.pragma('cache_size = 10000');
            this.db.pragma('temp_store = memory');
            this.db.pragma('mmap_size = 268435456'); // 256MB
            this.db.pragma('journal_mode = WAL');
            this.db.pragma('busy_timeout = 5000');
            
            // Obtenir les informations de base
            const dbSize = await this.getDatabaseSize();
            this.results.database.size = dbSize;
            
            this.logger.success(`✅ Connexion établie (${this.formatBytes(dbSize)})`);
            
        } catch (error) {
            throw new Error(`Erreur de connexion à la base: ${error.message}`);
        }
    }

    async getDatabaseSize() {
        try {
            const stats = await fs.stat(this.config.servers.database.path);
            return stats.size;
        } catch (error) {
            return 0;
        }
    }

    async runConnectionTests() {
        this.logger.info('🔌 Tests de connexion');
        
        const tests = [
            {
                name: 'connexion-simple',
                test: () => this.testSimpleConnection()
            },
            {
                name: 'connexion-multiple',
                test: () => this.testMultipleConnections()
            },
            {
                name: 'connexion-timeout',
                test: () => this.testConnectionTimeout()
            }
        ];
        
        for (const test of tests) {
            await this.runDatabaseTest(test, this.results.connectionTests);
        }
    }

    async testSimpleConnection() {
        const startTime = moment();
        const db = new Database(this.config.servers.database.path, { readonly: true });
        
        try {
            // Test simple SELECT
            const result = db.prepare('SELECT COUNT(*) as count FROM sqlite_master WHERE type="table"').get();
            const duration = moment().diff(startTime);
            
            return {
                success: true,
                duration,
                tablesCount: result.count
            };
        } finally {
            db.close();
        }
    }

    async testMultipleConnections() {
        const connections = [];
        const startTime = moment();
        
        try {
            // Créer 10 connexions simultanées
            for (let i = 0; i < 10; i++) {
                const db = new Database(this.config.servers.database.path, { readonly: true });
                connections.push(db);
            }
            
            // Effectuer une requête sur chaque connexion
            const promises = connections.map(db => 
                new Promise(resolve => {
                    const result = db.prepare('SELECT 1 as test').get();
                    resolve(result);
                })
            );
            
            await Promise.all(promises);
            const duration = moment().diff(startTime);
            
            return {
                success: true,
                duration,
                connectionsCount: connections.length
            };
        } finally {
            connections.forEach(db => db.close());
        }
    }

    async testConnectionTimeout() {
        const startTime = moment();
        
        try {
            // Test avec timeout court
            const db = new Database(this.config.servers.database.path, { 
                readonly: true,
                timeout: 1000 // 1 seconde
            });
            
            const result = db.prepare('SELECT COUNT(*) as count FROM computers').get();
            const duration = moment().diff(startTime);
            
            return {
                success: true,
                duration,
                timeout: 1000
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                duration: moment().diff(startTime)
            };
        } finally {
            if (this.db) this.db.close();
        }
    }

    async runQueryPerformanceTests() {
        this.logger.info('📊 Tests de performance des requêtes');
        
        for (const queryTest of this.config.database.queryTests) {
            await this.runQueryTest(queryTest);
        }
    }

    async runQueryTest(queryTest) {
        this.logger.info(`🔍 Test: ${queryTest.name}`);
        
        const results = {
            name: queryTest.name,
            priority: queryTest.priority,
            sql: queryTest.sql,
            success: false,
            metrics: {},
            runs: []
        };
        
        // Exécuter la requête plusieurs fois pour obtenir des métriques fiables
        const runs = 10;
        
        for (let i = 0; i < runs; i++) {
            const runResult = await this.executeQuery(queryTest);
            results.runs.push(runResult);
            
            // Pause entre les exécutions
            if (i < runs - 1) {
                await this.sleep(10);
            }
        }
        
        // Analyser les résultats
        const durations = results.runs.map(r => r.duration);
        const successCount = results.runs.filter(r => r.success).length;
        
        results.success = successCount === runs;
        results.metrics = {
            avgDuration: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
            minDuration: Math.min(...durations),
            maxDuration: Math.max(...durations),
            p95Duration: this.calculatePercentile(durations, 95),
            p99Duration: this.calculatePercentile(durations, 99),
            successRate: (successCount / runs) * 100,
            totalRows: results.runs.reduce((sum, r) => sum + (r.rowsCount || 0), 0) / runs,
            meetsThreshold: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) <= queryTest.maxTime
        };
        
        // Évaluer contre le seuil
        if (results.metrics.avgDuration <= queryTest.maxTime) {
            this.logger.success(`✅ ${queryTest.name}: ${results.metrics.avgDuration}ms (≤${queryTest.maxTime}ms)`);
        } else {
            this.logger.warn(`⚠️ ${queryTest.name}: ${results.metrics.avgDuration}ms (>${queryTest.maxTime}ms)`);
        }
        
        this.results.queryTests[queryTest.name] = results;
    }

    async executeQuery(queryTest) {
        const startTime = moment();
        
        try {
            // Préparer la requête
            const stmt = this.db.prepare(queryTest.sql);
            
            // Exécuter avec ou sans paramètres
            const result = queryTest.params ? 
                stmt.get(...queryTest.params) : 
                stmt.get();
                
            const duration = moment().diff(startTime);
            
            return {
                success: true,
                duration,
                rowsCount: result ? 1 : 0,
                data: result
            };
            
        } catch (error) {
            return {
                success: false,
                duration: moment().diff(startTime),
                error: error.message
            };
        }
    }

    async runConcurrentTests() {
        this.logger.info('⚡ Tests de concurrence');
        
        await this.runConcurrentQueryTest();
    }

    async runConcurrentQueryTest() {
        const testConfig = this.config.database.concurrentQueries;
        this.logger.info(`🔄 ${testConfig.threads} threads, ${testConfig.queriesPerThread} requêtes chacun`);
        
        const startTime = moment();
        const threads = [];
        const results = [];
        
        // Créer les threads de requêtes concurrentes
        for (let t = 0; t < testConfig.threads; t++) {
            const threadPromise = this.runThreadQueries(t, testConfig.queriesPerThread);
            threads.push(threadPromise);
        }
        
        try {
            // Attendre tous les threads
            const threadResults = await Promise.all(threads);
            
            // Fusionner les résultats
            threadResults.forEach(result => {
                results.push(...result);
            });
            
            const totalDuration = moment().diff(startTime);
            
            const successCount = results.filter(r => r.success).length;
            const durations = results.map(r => r.duration);
            
            this.results.concurrentTests = {
                success: successCount === results.length,
                threads: testConfig.threads,
                queriesPerThread: testConfig.queriesPerThread,
                totalQueries: results.length,
                totalDuration,
                avgDurationPerThread: totalDuration / testConfig.threads,
                metrics: {
                    totalSuccesses: successCount,
                    totalFailures: results.length - successCount,
                    avgQueryDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
                    minQueryDuration: Math.min(...durations),
                    maxQueryDuration: Math.max(...durations),
                    p95QueryDuration: this.calculatePercentile(durations, 95),
                    throughputPerSecond: (results.length / totalDuration) * 1000
                }
            };
            
            this.logger.success(`✅ Tests concurrence: ${Math.round(results.length / totalDuration * 1000)} requêtes/sec`);
            
        } catch (error) {
            this.results.concurrentTests = {
                success: false,
                error: error.message
            };
            
            this.logger.error(`❌ Tests concurrence: ${error.message}`);
        }
    }

    async runThreadQueries(threadId, queryCount) {
        const results = [];
        
        for (let i = 0; i < queryCount; i++) {
            // Choisir une requête aléatoire du pool
            const queryTest = this.config.database.queryTests[
                Math.floor(Math.random() * this.config.database.queryTests.length)
            ];
            
            const result = await this.executeQuery(queryTest);
            results.push({
                ...result,
                threadId,
                queryIndex: i
            });
            
            // Pause courte entre requêtes
            await this.sleep(5);
        }
        
        return results;
    }

    async runIndexTests() {
        this.logger.info('📇 Tests d\'indexation');
        
        await this.testIndexUsage();
        await this.testIndexEfficiency();
    }

    async testIndexUsage() {
        this.logger.info('🔍 Test d\'utilisation des index');
        
        // Analyser les requêtes existantes pour voir si elles utilisent les index
        const queryPlans = await this.analyzeQueryPlans();
        
        this.results.indexTests = {
            queryPlans,
            indexesUsed: queryPlans.filter(plan => plan.usesIndex).length,
            totalQueries: queryPlans.length,
            indexEfficiency: (queryPlans.filter(plan => plan.usesIndex).length / queryPlans.length) * 100
        };
        
        this.logger.info(`📊 Index utilisés: ${this.results.indexTests.indexesUsed}/${this.results.indexTests.totalQueries}`);
    }

    async analyzeQueryPlans() {
        const plans = [];
        
        // Tester quelques requêtes pour leur plan d'exécution
        const testQueries = [
            'EXPLAIN QUERY PLAN SELECT * FROM computers WHERE status = "available"',
            'EXPLAIN QUERY PLAN SELECT * FROM loans WHERE status = "active"',
            'EXPLAIN QUERY PLAN SELECT l.*, c.name FROM loans l JOIN computers c ON l.computerId = c.id'
        ];
        
        for (const query of testQueries) {
            try {
                const result = this.db.prepare(query).all();
                const usesIndex = result.some(row => 
                    row.detail && (row.detail.includes('USING INDEX') || row.detail.includes('USING INDEX'))
                );
                
                plans.push({
                    query: query.replace('EXPLAIN QUERY PLAN ', ''),
                    usesIndex,
                    detail: result.map(r => r.detail || '').join('; ')
                });
                
            } catch (error) {
                plans.push({
                    query: query.replace('EXPLAIN QUERY PLAN ', ''),
                    usesIndex: false,
                    error: error.message
                });
            }
        }
        
        return plans;
    }

    async testIndexEfficiency() {
        this.logger.info('⚡ Test d\'efficacité des index');
        
        // Test avec et sans index (simulation)
        const tests = [
            {
                name: 'recherche-avec-index',
                query: 'SELECT * FROM computers WHERE status = "available" LIMIT 100'
            },
            {
                name: 'recherche-sans-index',
                query: 'SELECT * FROM computers WHERE name LIKE "%test%" LIMIT 100'
            }
        ];
        
        for (const test of tests) {
            const result = await this.measureQueryEfficiency(test);
            this.results.indexTests[test.name] = result;
        }
    }

    async measureQueryEfficiency(test) {
        const runs = 5;
        const durations = [];
        
        for (let i = 0; i < runs; i++) {
            const startTime = moment();
            try {
                const result = this.db.prepare(test.query).all();
                const duration = moment().diff(startTime);
                durations.push(duration);
            } catch (error) {
                durations.push(999999); // Grande valeur pour les erreurs
            }
            
            await this.sleep(10);
        }
        
        return {
            avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
            minDuration: Math.min(...durations),
            maxDuration: Math.max(...durations),
            runs: durations.length
        };
    }

    async runMemoryUsageTests() {
        this.logger.info('💾 Tests d\'utilisation mémoire');
        
        try {
            // Obtenir les informations mémoire SQLite
            const memoryInfo = this.db.prepare('PRAGMA page_count').get();
            const pageSize = this.db.prepare('PRAGMA page_size').get();
            
            this.results.memoryTests = {
                pageCount: memoryInfo.page_count || 0,
                pageSize: pageSize.page_size || 0,
                databaseSize: (memoryInfo.page_count * (pageSize.page_size || 0)) || 0,
                walMode: this.db.prepare('PRAGMA journal_mode').get().journal_mode === 'wal'
            };
            
            this.logger.info(`📊 Pages: ${memoryInfo.page_count}, Taille page: ${this.formatBytes(pageSize.page_size)}`);
            
        } catch (error) {
            this.results.memoryTests = {
                error: error.message
            };
        }
    }

    calculatePercentile(values, percentile) {
        const sorted = [...values].sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[Math.max(0, index)];
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async runDatabaseTest(testConfig, targetObject) {
        const startTime = moment();
        
        try {
            const result = await testConfig.test();
            targetObject[testConfig.name] = {
                ...result,
                duration: moment().diff(startTime)
            };
            
            this.logger.success(`✅ ${testConfig.name}`);
            
        } catch (error) {
            targetObject[testConfig.name] = {
                success: false,
                error: error.message,
                duration: moment().diff(startTime)
            };
            
            this.logger.error(`❌ ${testConfig.name}: ${error.message}`);
        }
    }

    calculateOverallMetrics() {
        // Calculer les métriques globales à partir de tous les tests
        
        const allQueryDurations = Object.values(this.results.queryTests)
            .filter(test => test.metrics.avgDuration)
            .map(test => test.metrics.avgDuration);
            
        if (allQueryDurations.length > 0) {
            this.results.metrics = {
                avgQueryTime: Math.round(allQueryDurations.reduce((a, b) => a + b, 0) / allQueryDurations.length),
                maxQueryTime: Math.max(...allQueryDurations),
                minQueryTime: Math.min(...allQueryDurations),
                queriesUnderThreshold: Object.values(this.results.queryTests)
                    .filter(test => test.metrics.meetsThreshold).length,
                totalQueries: Object.keys(this.results.queryTests).length,
                databaseSize: this.results.database.size,
                indexEfficiency: this.results.indexTests?.indexEfficiency || 0
            };
        }
    }

    closeConnection() {
        if (this.db) {
            this.db.close();
            this.logger.info('🔌 Connexion base de données fermée');
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = DatabasePerformanceTester;