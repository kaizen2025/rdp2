/**
 * Orchestrateur principal des tests de performance backend
 * @file index.js
 */

const path = require('path');
const fs = require('fs-extra');
const moment = require('moment');
const config = require('./config');
const logger = require('./utils/logger');

// Tests individuels
const APIPerformance = require('./api/api-performance');
const DatabasePerformance = require('./database/db-performance');
const WebSocketPerformance = require('./websocket/ws-performance');
const LoadTesting = require('./load/load-testing');
const MemoryProfiling = require('./memory/memory-profiling');
const GEDPerformance = require('./ged/ged-performance');

class PerformanceBenchmarkSuite {
    constructor(options = {}) {
        this.config = config.getConfig(options.environment);
        this.options = {
            testTypes: options.testTypes || 'all',
            environment: options.environment || 'development',
            outputDir: options.outputDir || this.config.reporting.outputDir,
            generateReports: options.generateReports !== false,
            verbose: options.verbose || false
        };
        
        this.results = {
            timestamp: moment().toISOString(),
            environment: this.options.environment,
            tests: {},
            summary: {},
            recommendations: []
        };
        
        this.startTime = null;
    }

    async initialize() {
        console.log('🚀 Initialisation de la suite de tests de performance backend...\n');
        
        // Créer le dossier de sortie
        await fs.ensureDir(this.options.outputDir);
        
        // Initialiser le logger
        logger.init(this.options.outputDir, this.options.verbose);
        
        logger.info('Configuration chargée:', this.config.environment);
        logger.info('Tests à exécuter:', this.options.testTypes);
        
        // Vérifier que les serveurs sont accessibles
        await this.checkServerAvailability();
        
        console.log('✅ Initialisation terminée\n');
    }

    async checkServerAvailability() {
        const healthCheckUrl = `${this.config.servers.api.baseUrl}/api/health`;
        
        try {
            logger.info('Vérification de la disponibilité du serveur API...');
            
            const fetch = require('node-fetch');
            const response = await fetch(healthCheckUrl, { timeout: 10000 });
            
            if (response.ok) {
                logger.info('✅ Serveur API accessible');
            } else {
                throw new Error(`Serveur retournant code ${response.status}`);
            }
        } catch (error) {
            logger.error('❌ Serveur API non accessible:', error.message);
            logger.warn('Les tests continueront mais peuvent échouer');
        }
    }

    async runAllTests() {
        this.startTime = moment();
        logger.info('🎯 Début des tests de performance');
        
        const testSuites = {
            api: () => this.runAPITests(),
            database: () => this.runDatabaseTests(),
            websocket: () => this.runWebSocketTests(),
            load: () => this.runLoadTests(),
            memory: () => this.runMemoryTests(),
            ged: () => this.runGEDTests()
        };

        if (this.options.testTypes === 'all') {
            // Exécuter tous les tests
            for (const [testName, testFunction] of Object.entries(testSuites)) {
                await this.runTestSuite(testName, testFunction);
            }
        } else {
            // Exécuter seulement les tests spécifiés
            const requestedTests = this.options.testTypes.split(',');
            for (const testName of requestedTests) {
                if (testSuites[testName.trim()]) {
                    await this.runTestSuite(testName.trim(), testSuites[testName.trim()]);
                }
            }
        }
        
        await this.generateFinalReport();
    }

    async runTestSuite(testName, testFunction) {
        logger.info(`\n📊 Exécution des tests: ${testName.toUpperCase()}`);
        
        try {
            const result = await testFunction();
            this.results.tests[testName] = result;
            
            logger.info(`✅ Tests ${testName} terminés`);
            
            if (result.summary) {
                logger.info(`   - Réussites: ${result.summary.successes}`);
                logger.info(`   - Échecs: ${result.summary.failures}`);
                logger.info(`   - Temps total: ${result.summary.duration}`);
            }
            
        } catch (error) {
            logger.error(`❌ Erreur lors des tests ${testName}:`, error);
            this.results.tests[testName] = {
                success: false,
                error: error.message,
                timestamp: moment().toISOString()
            };
        }
    }

    async runAPITests() {
        const apiTest = new APIPerformance(this.config, logger);
        return await apiTest.runAllTests();
    }

    async runDatabaseTests() {
        const dbTest = new DatabasePerformance(this.config, logger);
        return await dbTest.runAllTests();
    }

    async runWebSocketTests() {
        const wsTest = new WebSocketPerformance(this.config, logger);
        return await wsTest.runAllTests();
    }

    async runLoadTests() {
        const loadTest = new LoadTesting(this.config, logger);
        return await loadTest.runAllTests();
    }

    async runMemoryTests() {
        const memoryTest = new MemoryProfiling(this.config, logger);
        return await memoryTest.runAllTests();
    }

    async runGEDTests() {
        const gedTest = new GEDPerformance(this.config, logger);
        return await gedTest.runAllTests();
    }

    async generateFinalReport() {
        const endTime = moment();
        const duration = endTime.diff(this.startTime, 'milliseconds');
        
        this.results.summary = {
            totalDuration: duration,
            startTime: this.startTime.toISOString(),
            endTime: endTime.toISOString(),
            testSuites: Object.keys(this.results.tests).length,
            successfulSuites: Object.values(this.results.tests).filter(t => t.success !== false).length,
            failedSuites: Object.values(this.results.tests).filter(t => t.success === false).length
        };

        // Générer des recommandations
        this.results.recommendations = this.generateRecommendations();

        if (this.options.generateReports) {
            await this.saveReports();
            await this.generateHTMLReport();
        }

        this.printSummary();
    }

    generateRecommendations() {
        const recommendations = [];

        // Analyser les résultats pour générer des recommandations
        Object.entries(this.results.tests).forEach(([testName, results]) => {
            if (results.metrics) {
                // Recommandations basées sur les métriques
                if (results.metrics.avgResponseTime > this.config.thresholds.responseTime.poor) {
                    recommendations.push({
                        type: 'performance',
                        severity: 'high',
                        test: testName,
                        message: `Le temps de réponse moyen (${results.metrics.avgResponseTime}ms) dépasse les seuils acceptables`,
                        suggestion: 'Optimiser les requêtes et améliorer l\'indexation de la base de données'
                    });
                }

                if (results.metrics.errorRate > this.config.thresholds.errorRate.maximum) {
                    recommendations.push({
                        type: 'reliability',
                        severity: 'critical',
                        test: testName,
                        message: `Taux d'erreur (${results.metrics.errorRate}%) trop élevé`,
                        suggestion: 'Identifier et corriger les causes des erreurs'
                    });
                }

                if (results.metrics.throughput < this.config.thresholds.throughput.minimum) {
                    recommendations.push({
                        type: 'scalability',
                        severity: 'medium',
                        test: testName,
                        message: `Débit (${results.metrics.throughput} req/s) en dessous du minimum recommandé`,
                        suggestion: 'Considérer l\'optimisation du code ou l\'augmentation des ressources'
                    });
                }
            }
        });

        return recommendations;
    }

    async saveReports() {
        const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
        const reportFile = path.join(this.options.outputDir, `performance-report-${timestamp}.json`);
        
        await fs.writeJson(reportFile, this.results, { spaces: 2 });
        logger.info(`📄 Rapport JSON sauvegardé: ${reportFile}`);

        // Sauvegarder aussi un résumé CSV
        const csvFile = path.join(this.options.outputDir, `performance-summary-${timestamp}.csv`);
        await this.generateCSVReport(csvFile);
    }

    async generateCSVReport(filePath) {
        const csvLines = [
            'Test Suite,Success,Duration,Avg Response Time,Error Rate,Throughput,Memory Usage',
            ...Object.entries(this.results.tests).map(([name, results]) => {
                const metrics = results.metrics || {};
                return [
                    name,
                    results.success !== false ? 'SUCCESS' : 'FAILED',
                    results.summary?.duration || 'N/A',
                    metrics.avgResponseTime || 'N/A',
                    metrics.errorRate || 'N/A',
                    metrics.throughput || 'N/A',
                    metrics.memoryUsage || 'N/A'
                ].join(',');
            })
        ];

        await fs.writeFile(filePath, csvLines.join('\n'));
        logger.info(`📊 Rapport CSV sauvegardé: ${filePath}`);
    }

    async generateHTMLReport() {
        const templatePath = path.join(__dirname, 'templates/report-template.html');
        const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
        const reportFile = path.join(this.options.outputDir, `performance-report-${timestamp}.html`);
        
        try {
            const template = await fs.readFile(templatePath, 'utf8');
            const html = template
                .replace('{{TIMESTAMP}}', this.results.timestamp)
                .replace('{{ENVIRONMENT}}', this.options.environment)
                .replace('{{TOTAL_DURATION}}', this.results.summary.totalDuration + 'ms')
                .replace('{{RESULTS_DATA}}', JSON.stringify(this.results, null, 2));
            
            await fs.writeFile(reportFile, html);
            logger.info(`🌐 Rapport HTML généré: ${reportFile}`);
        } catch (error) {
            logger.warn('Impossible de générer le rapport HTML:', error.message);
        }
    }

    printSummary() {
        console.log('\n🎯 RÉSUMÉ DES TESTS DE PERFORMANCE\n');
        console.log('=' .repeat(60));
        
        Object.entries(this.results.tests).forEach(([testName, results]) => {
            const status = results.success === false ? '❌ ÉCHEC' : '✅ SUCCÈS';
            console.log(`${testName.toUpperCase()}: ${status}`);
            
            if (results.metrics) {
                console.log(`   Temps de réponse moyen: ${results.metrics.avgResponseTime}ms`);
                console.log(`   Débit: ${results.metrics.throughput} req/s`);
                console.log(`   Taux d'erreur: ${results.metrics.errorRate}%`);
                console.log(`   Durée: ${results.summary?.duration}`);
            }
            
            if (results.error) {
                console.log(`   Erreur: ${results.error}`);
            }
            
            console.log('');
        });
        
        console.log('=' .repeat(60));
        console.log(`Durée totale: ${this.results.summary.totalDuration}ms`);
        console.log(`Suites réussies: ${this.results.summary.successfulSuites}/${this.results.summary.testSuites}`);
        
        if (this.results.recommendations.length > 0) {
            console.log('\n💡 RECOMMANDATIONS:');
            this.results.recommendations.forEach(rec => {
                const icon = rec.severity === 'critical' ? '🔴' : 
                           rec.severity === 'high' ? '🟠' : '🟡';
                console.log(`   ${icon} ${rec.message}`);
                console.log(`      → ${rec.suggestion}`);
            });
        }
        
        console.log('\n📁 Rapports sauvegardés dans:', this.options.outputDir);
    }
}

// CLI Interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {
        testTypes: args.find(arg => !arg.startsWith('--')) || 'all',
        environment: (args.find(arg => arg.startsWith('--env=')) || '--env=development').split('=')[1],
        outputDir: (args.find(arg => arg.startsWith('--output=')) || '--output=' + config.getConfig().reporting.outputDir).split('=')[1],
        generateReports: !args.includes('--no-reports'),
        verbose: args.includes('--verbose')
    };

    (async () => {
        try {
            const suite = new PerformanceBenchmarkSuite(options);
            await suite.initialize();
            await suite.runAllTests();
        } catch (error) {
            console.error('❌ Erreur fatale:', error);
            process.exit(1);
        }
    })();
}

module.exports = PerformanceBenchmarkSuite;