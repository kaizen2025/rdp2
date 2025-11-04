/**
 * Tests de charge des services backend multiples simultanés
 * @file load-testing.js
 */

const autocannon = require('autocannon');
const { fork } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
const os = require('os');

class LoadTestingSuite {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.results = {
            timestamp: moment().toISOString(),
            systemInfo: this.getSystemInfo(),
            loadScenarios: {},
            concurrentTests: {},
            resourceMonitoring: {},
            summary: {},
            metrics: {}
        };
        this.monitoringProcess = null;
    }

    getSystemInfo() {
        return {
            platform: os.platform(),
            arch: os.arch(),
            cpus: os.cpus().length,
            totalMemory: Math.round(os.totalmem() / 1024 / 1024), // MB
            freeMemory: Math.round(os.freemem() / 1024 / 1024), // MB
            loadAverage: os.loadavg(),
            hostname: os.hostname()
        };
    }

    async runAllTests() {
        const startTime = moment();
        this.logger.info('⚡ Début des tests de charge backend');

        try {
            // Démarrer le monitoring des ressources
            await this.startResourceMonitoring();
            
            // Tests de charge par intensité
            await this.runLightLoadTest();
            await this.runMediumLoadTest();
            await this.runHeavyLoadTest();
            
            // Tests de charge simultanée sur plusieurs endpoints
            await this.runConcurrentEndpointTest();
            
            // Test de montée en charge progressive
            await this.runProgressiveLoadTest();
            
            // Test de résistance (soak test)
            await this.runSoakTest();
            
            // Arrêter le monitoring
            await this.stopResourceMonitoring();
            
            const endTime = moment();
            const duration = endTime.diff(startTime);
            
            this.results.summary = {
                success: true,
                duration: `${duration}ms`,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                testsRun: Object.keys(this.results.loadScenarios).length,
                scenariosCompleted: Object.values(this.results.loadScenarios).filter(s => s.success).length
            };
            
            this.calculateOverallMetrics();
            this.generateRecommendations();
            this.logger.success('✅ Tests de charge terminés');
            
        } catch (error) {
            this.logger.error('❌ Erreur lors des tests de charge:', error);
            this.results.summary = {
                success: false,
                error: error.message,
                duration: moment().diff(startTime) + 'ms'
            };
        }
        
        return this.results;
    }

    async startResourceMonitoring() {
        this.logger.info('📊 Démarrage du monitoring des ressources');
        
        // Créer un processus de monitoring séparé
        const monitorScript = `
            const os = require('os');
            const fs = require('fs');
            
            setInterval(() => {
                const usage = process.memoryUsage();
                const cpuUsage = process.cpuUsage();
                
                const data = {
                    timestamp: Date.now(),
                    memory: {
                        rss: Math.round(usage.rss / 1024 / 1024),
                        heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
                        heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
                        external: Math.round(usage.external / 1024 / 1024)
                    },
                    cpu: {
                        user: cpuUsage.user,
                        system: cpuUsage.system
                    },
                    system: {
                        loadAverage: os.loadavg(),
                        freeMemory: Math.round(os.freemem() / 1024 / 1024),
                        totalMemory: Math.round(os.totalmem() / 1024 / 1024)
                    }
                };
                
                console.log(JSON.stringify(data));
            }, 1000);
        `;
        
        this.monitoringProcess = fork(__filename, ['--monitor', monitorScript], {
            detached: true
        });
        
        this.logger.info('📈 Monitoring démarré (PID: ' + this.monitoringProcess.pid + ')');
    }

    async stopResourceMonitoring() {
        if (this.monitoringProcess) {
            this.monitoringProcess.kill();
            this.logger.info('📊 Monitoring arrêté');
        }
    }

    async runLightLoadTest() {
        this.logger.info('🌟 Test de charge légère');
        
        const testConfig = {
            name: 'light-load',
            connections: this.config.load.concurrency.low,
            duration: this.config.load.durations.short,
            description: 'Charge légère avec faible concurrence'
        };
        
        const result = await this.runLoadScenario(testConfig);
        this.results.loadScenarios.lightLoad = result;
        
        if (result.success) {
            this.logger.success(`✅ Charge légère: ${Math.round(result.metrics.avgThroughput)} req/s`);
        } else {
            this.logger.error(`❌ Charge légère échouée: ${result.error}`);
        }
    }

    async runMediumLoadTest() {
        this.logger.info('🔆 Test de charge moyenne');
        
        const testConfig = {
            name: 'medium-load',
            connections: this.config.load.concurrency.medium,
            duration: this.config.load.durations.medium,
            description: 'Charge moyenne avec concurrence modérée'
        };
        
        const result = await this.runLoadScenario(testConfig);
        this.results.loadScenarios.mediumLoad = result;
        
        if (result.success) {
            this.logger.success(`✅ Charge moyenne: ${Math.round(result.metrics.avgThroughput)} req/s`);
        } else {
            this.logger.error(`❌ Charge moyenne échouée: ${result.error}`);
        }
    }

    async runHeavyLoadTest() {
        this.logger.info('🔥 Test de charge lourde');
        
        const testConfig = {
            name: 'heavy-load',
            connections: this.config.load.concurrency.high,
            duration: this.config.load.durations.long,
            description: 'Charge élevée pour tester les limites'
        };
        
        const result = await this.runLoadScenario(testConfig);
        this.results.loadScenarios.heavyLoad = result;
        
        if (result.success) {
            this.logger.success(`✅ Charge lourde: ${Math.round(result.metrics.avgThroughput)} req/s`);
        } else {
            this.logger.error(`❌ Charge lourde échouée: ${result.error}`);
        }
    }

    async runLoadScenario(testConfig) {
        this.logger.info(`🎯 Test: ${testConfig.name} (${testConfig.connections} connexions, ${testConfig.duration}s)`);
        
        const endpoints = this.getEndpointsForLoadTest();
        const results = [];
        
        try {
            // Tester plusieurs endpoints en parallèle
            const promises = endpoints.slice(0, 3).map(endpoint => 
                this.runSingleEndpointLoadTest(endpoint, testConfig)
            );
            
            const endpointResults = await Promise.allSettled(promises);
            
            // Fusionner les résultats
            endpointResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    results.push({
                        endpoint: endpoints[index].path,
                        ...result.value
                    });
                } else {
                    results.push({
                        endpoint: endpoints[index].path,
                        success: false,
                        error: result.reason.message
                    });
                }
            });
            
            // Calculer les métriques agrégées
            const successfulResults = results.filter(r => r.success);
            const totalRequests = results.reduce((sum, r) => sum + (r.totalRequests || 0), 0);
            const totalErrors = results.reduce((sum, r) => sum + (r.totalErrors || 0), 0);
            const avgLatencies = results.filter(r => r.avgLatency).map(r => r.avgLatency);
            
            const overallResult = {
                success: successfulResults.length === results.length,
                config: testConfig,
                endpoints: results,
                metrics: {
                    avgThroughput: Math.round(totalRequests / testConfig.duration),
                    maxThroughput: Math.max(...results.map(r => r.throughput || 0)),
                    avgLatency: avgLatencies.length > 0 ? 
                        Math.round(avgLatencies.reduce((a, b) => a + b, 0) / avgLatencies.length) : 0,
                    minLatency: Math.min(...avgLatencies) || 0,
                    maxLatency: Math.max(...avgLatencies) || 0,
                    totalRequests,
                    totalErrors,
                    errorRate: totalRequests > 0 ? 
                        ((totalErrors / totalRequests) * 100).toFixed(2) : '0.00',
                    successRate: ((successfulResults.length / results.length) * 100).toFixed(2)
                }
            };
            
            return overallResult;
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                config: testConfig
            };
        }
    }

    async runSingleEndpointLoadTest(endpoint, testConfig) {
        const url = `${this.config.servers.api.baseUrl}${endpoint.path}`;
        
        return new Promise((resolve, reject) => {
            const instance = autocannon({
                url,
                method: endpoint.method,
                connections: Math.floor(testConfig.connections / 3), // Répartir les connexions
                duration: testConfig.duration,
                headers: {
                    'User-Agent': 'LoadTest/1.0',
                    'Content-Type': 'application/json'
                },
                body: endpoint.payload ? JSON.stringify(endpoint.payload) : undefined
            });
            
            instance.on('done', (result) => {
                resolve({
                    success: result.errors.total === 0,
                    throughput: Math.round(result.throughput),
                    totalRequests: result.requests.total,
                    totalErrors: result.errors.total,
                    avgLatency: Math.round(result.latency.average),
                    p95Latency: Math.round(result.latency.p95),
                    p99Latency: Math.round(result.latency.p99)
                });
            });
            
            instance.on('error', reject);
        });
    }

    getEndpointsForLoadTest() {
        return [
            {
                path: '/api/health',
                method: 'GET',
                priority: 'critical'
            },
            {
                path: '/api/computers',
                method: 'GET',
                priority: 'critical'
            },
            {
                path: '/api/loans',
                method: 'GET',
                priority: 'critical'
            },
            {
                path: '/api/notifications/unread',
                method: 'GET',
                priority: 'high'
            },
            {
                path: '/api/ai/health',
                method: 'GET',
                priority: 'medium'
            }
        ];
    }

    async runConcurrentEndpointTest() {
        this.logger.info('🔄 Test de concurrence entre endpoints');
        
        const testName = 'concurrent-endpoints';
        const endpoints = [
            { path: '/api/health', method: 'GET', weight: 10 },
            { path: '/api/computers', method: 'GET', weight: 30 },
            { path: '/api/loans', method: 'GET', weight: 30 },
            { path: '/api/notifications', method: 'GET', weight: 20 },
            { path: '/api/chat/channels', method: 'GET', weight: 10 }
        ];
        
        this.logger.info(`📊 Test de ${endpoints.length} endpoints simultanés`);
        
        const result = await this.runMultiEndpointLoadTest(endpoints, {
            connections: 50,
            duration: 120
        });
        
        this.results.concurrentTests[testName] = result;
        
        if (result.success) {
            this.logger.success(`✅ Concurrence: ${result.successfulEndpoints}/${result.totalEndpoints} endpoints`);
        } else {
            this.logger.error(`❌ Concurrence: ${result.error}`);
        }
    }

    async runMultiEndpointLoadTest(endpoints, testConfig) {
        const allResults = [];
        const startTime = moment();
        
        try {
            // Lancer des tests en parallèle pour chaque endpoint
            const promises = endpoints.map(async (endpoint, index) => {
                const url = `${this.config.servers.api.baseUrl}${endpoint.path}`;
                const connections = Math.floor(testConfig.connections * (endpoint.weight / 100));
                
                const instance = autocannon({
                    url,
                    method: endpoint.method,
                    connections,
                    duration: Math.floor(testConfig.duration / 2),
                    headers: {
                        'User-Agent': 'ConcurrentTest/1.0'
                    }
                });
                
                return new Promise((resolve, reject) => {
                    instance.on('done', (result) => {
                        resolve({
                            endpoint: endpoint.path,
                            weight: endpoint.weight,
                            connections: connections,
                            ...result
                        });
                    });
                    
                    instance.on('error', reject);
                });
            });
            
            // Attendre tous les tests
            const results = await Promise.allSettled(promises);
            
            // Analyser les résultats
            const successfulResults = results.filter(r => r.status === 'fulfilled');
            const failedResults = results.filter(r => r.status === 'rejected');
            
            const endTime = moment();
            const duration = endTime.diff(startTime);
            
            // Calculer les métriques combinées
            let totalRequests = 0;
            let totalErrors = 0;
            let totalThroughput = 0;
            const latencies = [];
            
            successfulResults.forEach(result => {
                const data = result.value;
                totalRequests += data.requests.total;
                totalErrors += data.errors.total;
                totalThroughput += data.throughput;
                latencies.push(data.latency.average);
            });
            
            return {
                success: failedResults.length === 0,
                totalEndpoints: endpoints.length,
                successfulEndpoints: successfulResults.length,
                failedEndpoints: failedResults.length,
                duration,
                metrics: {
                    totalRequests,
                    totalErrors,
                    avgThroughput: Math.round(totalThroughput / successfulResults.length),
                    errorRate: totalRequests > 0 ? 
                        ((totalErrors / totalRequests) * 100).toFixed(2) : '0.00',
                    avgLatency: latencies.length > 0 ? 
                        Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0
                },
                details: successfulResults.map(r => r.value)
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                duration: moment().diff(startTime)
            };
        }
    }

    async runProgressiveLoadTest() {
        this.logger.info('📈 Test de montée en charge progressive');
        
        const testName = 'progressive-load';
        const loadSteps = [
            { connections: 10, duration: 30 },
            { connections: 25, duration: 30 },
            { connections: 50, duration: 45 },
            { connections: 75, duration: 30 },
            { connections: 100, duration: 60 }
        ];
        
        const results = [];
        
        try {
            for (let i = 0; i < loadSteps.length; i++) {
                const step = loadSteps[i];
                this.logger.info(`📊 Étape ${i + 1}/${loadSteps.length}: ${step.connections} connexions`);
                
                const result = await this.runLoadStep(step);
                results.push({
                    step: i + 1,
                    config: step,
                    ...result
                });
                
                // Pause entre les étapes
                await this.sleep(5000);
            }
            
            this.results.loadScenarios[testName] = {
                success: results.every(r => r.success),
                steps: results,
                totalDuration: results.reduce((sum, r) => sum + r.duration, 0),
                metrics: {
                    maxConnections: Math.max(...loadSteps.map(s => s.connections)),
                    totalRequests: results.reduce((sum, r) => sum + (r.totalRequests || 0), 0),
                    avgThroughput: Math.round(
                        results.reduce((sum, r) => sum + (r.throughput || 0), 0) / results.length
                    ),
                    performanceDegradation: this.calculatePerformanceDegradation(results)
                }
            };
            
        } catch (error) {
            this.results.loadScenarios[testName] = {
                success: false,
                error: error.message
            };
        }
    }

    async runLoadStep(stepConfig) {
        const url = `${this.config.servers.api.baseUrl}/api/health`;
        
        return new Promise((resolve, reject) => {
            const instance = autocannon({
                url,
                connections: stepConfig.connections,
                duration: stepConfig.duration,
                headers: {
                    'User-Agent': 'ProgressiveLoadTest/1.0'
                }
            });
            
            instance.on('done', (result) => {
                resolve({
                    success: true,
                    duration: stepConfig.duration * 1000,
                    throughput: Math.round(result.throughput),
                    totalRequests: result.requests.total,
                    totalErrors: result.errors.total,
                    avgLatency: Math.round(result.latency.average),
                    p95Latency: Math.round(result.latency.p95)
                });
            });
            
            instance.on('error', reject);
        });
    }

    async runSoakTest() {
        this.logger.info('⏱️ Test de résistance (Soak Test)');
        
        const testName = 'soak-test';
        const testConfig = {
            connections: 20,
            duration: 600, // 10 minutes
            description: 'Test de résistance prolongée'
        };
        
        const result = await this.runLoadScenario(testConfig);
        this.results.loadScenarios[testName] = result;
        
        if (result.success) {
            this.logger.success(`✅ Test de résistance: Stable sur ${testConfig.duration}s`);
        } else {
            this.logger.error(`❌ Test de résistance: ${result.error}`);
        }
    }

    calculatePerformanceDegradation(results) {
        if (results.length < 2) return 0;
        
        const firstThroughput = results[0].throughput || 0;
        const lastThroughput = results[results.length - 1].throughput || 0;
        
        if (firstThroughput === 0) return 0;
        
        const degradation = ((firstThroughput - lastThroughput) / firstThroughput) * 100;
        return Math.round(degradation);
    }

    calculateOverallMetrics() {
        // Calculer les métriques globales à partir de tous les tests
        const allScenarios = Object.values(this.results.loadScenarios);
        
        const throughputs = allScenarios
            .filter(s => s.metrics?.avgThroughput)
            .map(s => s.metrics.avgThroughput);
            
        const latencies = allScenarios
            .filter(s => s.metrics?.avgLatency)
            .map(s => s.metrics.avgLatency);
            
        const errorRates = allScenarios
            .filter(s => s.metrics?.errorRate)
            .map(s => parseFloat(s.metrics.errorRate));
        
        this.results.metrics = {
            maxThroughput: throughputs.length > 0 ? Math.max(...throughputs) : 0,
            avgThroughput: throughputs.length > 0 ? 
                Math.round(throughputs.reduce((a, b) => a + b, 0) / throughputs.length) : 0,
            avgLatency: latencies.length > 0 ? 
                Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0,
            maxLatency: latencies.length > 0 ? Math.max(...latencies) : 0,
            avgErrorRate: errorRates.length > 0 ? 
                (errorRates.reduce((a, b) => a + b, 0) / errorRates.length).toFixed(2) : '0.00',
            testsCompleted: allScenarios.length,
            systemLoadAvg: this.results.systemInfo.loadAverage[0],
            availableMemory: this.results.systemInfo.freeMemory
        };
    }

    generateRecommendations() {
        this.results.recommendations = [];
        
        // Recommandations basées sur les résultats
        const avgLatency = this.results.metrics.avgLatency;
        const avgErrorRate = parseFloat(this.results.metrics.avgErrorRate);
        const maxThroughput = this.results.metrics.maxThroughput;
        
        if (avgLatency > this.config.thresholds.responseTime.good) {
            this.results.recommendations.push({
                type: 'performance',
                severity: avgLatency > this.config.thresholds.responseTime.poor ? 'high' : 'medium',
                message: `Latence moyenne élevée (${avgLatency}ms)`,
                suggestion: 'Optimiser les requêtes et considerer la mise en cache'
            });
        }
        
        if (avgErrorRate > this.config.thresholds.errorRate.good) {
            this.results.recommendations.push({
                type: 'reliability',
                severity: avgErrorRate > this.config.thresholds.errorRate.maximum ? 'critical' : 'high',
                message: `Taux d'erreur élevé (${avgErrorRate}%)`,
                suggestion: 'Identifier et corriger les causes des erreurs'
            });
        }
        
        if (maxThroughput < this.config.thresholds.throughput.minimum) {
            this.results.recommendations.push({
                type: 'scalability',
                severity: 'medium',
                message: `Débit maximal faible (${maxThroughput} req/s)`,
                suggestion: 'Considérer l\'optimisation du code ou l\'ajout de ressources'
            });
        }
        
        if (this.results.systemInfo.loadAverage[0] > 2) {
            this.results.recommendations.push({
                type: 'system',
                severity: 'high',
                message: `Charge système élevée (${this.results.systemInfo.loadAverage[0].toFixed(2)})`,
                suggestion: 'Surveiller l\'utilisation CPU et mémoire'
            });
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Interface CLI pour le processus de monitoring
if (process.argv.includes('--monitor') && process.argv.length > 2) {
    const script = process.argv[2];
    eval(script);
}

module.exports = LoadTestingSuite;