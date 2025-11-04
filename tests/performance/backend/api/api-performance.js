/**
 * Tests de performance des API endpoints avec autocannon
 * @file api-performance.js
 */

const autocannon = require('autocannon');
const path = require('path');
const fs = require('fs-extra');
const moment = require('moment');
const fetch = require('node-fetch');

class APIPerformanceTester {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.results = {
            timestamp: moment().toISOString(),
            environment: config.environment,
            endpoints: {},
            summary: {},
            metrics: {}
        };
    }

    async runAllTests() {
        const startTime = moment();
        this.logger.info('🔍 Début des tests de performance API');

        try {
            // Test des endpoints GET
            await this.testGETEndpoints();
            
            // Test des mutations POST
            await this.testMutations();
            
            // Tests de charge par endpoint
            await this.runLoadTests();
            
            // Tests de stress
            await this.runStressTests();
            
            // Génération du rapport
            await this.generateReport();
            
            const endTime = moment();
            const duration = endTime.diff(startTime);
            
            this.results.summary = {
                success: true,
                duration: `${duration}ms`,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                totalTests: Object.keys(this.results.endpoints).length,
                successfulTests: Object.values(this.results.endpoints).filter(r => r.success).length,
                failedTests: Object.values(this.results.endpoints).filter(r => !r.success).length
            };
            
            this.calculateOverallMetrics();
            this.logger.success('✅ Tests API terminés');
            
        } catch (error) {
            this.logger.error('❌ Erreur lors des tests API:', error);
            this.results.summary = {
                success: false,
                error: error.message,
                duration: moment().diff(startTime) + 'ms'
            };
        }
        
        return this.results;
    }

    async testGETEndpoints() {
        this.logger.info('📡 Test des endpoints GET');
        
        for (const endpoint of this.config.api.endpoints) {
            await this.testEndpoint(endpoint);
        }
    }

    async testEndpoint(endpoint) {
        const benchmarkName = `${endpoint.method}-${endpoint.path}`;
        this.logger.info(`🔍 Test de ${endpoint.method} ${endpoint.path}`);
        
        const result = {
            path: endpoint.path,
            method: endpoint.method,
            priority: endpoint.priority,
            success: false,
            metrics: {},
            errors: []
        };

        try {
            // Test simple de latence
            const latency = await this.measureLatency(endpoint);
            result.metrics.latency = latency;
            
            // Test de disponibilité avec timeout
            const availability = await this.testAvailability(endpoint);
            result.availability = availability;
            
            if (availability.success) {
                result.success = true;
                this.logger.success(`✅ ${benchmarkName} - Latence: ${latency}ms`);
            } else {
                result.errors.push(`Availability failed: ${availability.error}`);
                this.logger.error(`❌ ${benchmarkName} - ${availability.error}`);
            }
            
        } catch (error) {
            result.errors.push(error.message);
            this.logger.error(`❌ ${benchmarkName} - ${error.message}`);
        }
        
        this.results.endpoints[benchmarkName] = result;
        
        // Pause entre les tests
        await this.sleep(100);
    }

    async measureLatency(endpoint) {
        const url = `${this.config.servers.api.baseUrl}${endpoint.path}`;
        const startTime = Date.now();
        
        try {
            const response = await fetch(url, {
                method: endpoint.method,
                timeout: this.config.servers.api.timeout
            });
            
            await response.text(); // Attendre la réponse complète
            return Date.now() - startTime;
            
        } catch (error) {
            throw new Error(`Latency test failed: ${error.message}`);
        }
    }

    async testAvailability(endpoint) {
        const url = `${this.config.servers.api.baseUrl}${endpoint.path}`;
        
        try {
            const startTime = Date.now();
            const response = await fetch(url, {
                method: endpoint.method,
                timeout: this.config.servers.api.timeout,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'PerformanceTest/1.0'
                }
            });
            const responseTime = Date.now() - startTime;
            
            const expectedStatus = endpoint.expectedStatus || 200;
            if (response.status !== expectedStatus) {
                return {
                    success: false,
                    status: response.status,
                    responseTime,
                    error: `Expected status ${expectedStatus}, got ${response.status}`
                };
            }
            
            return {
                success: true,
                status: response.status,
                responseTime,
                contentLength: response.headers.get('content-length') || 'unknown'
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                responseTime: this.config.servers.api.timeout
            };
        }
    }

    async testMutations() {
        this.logger.info('🔄 Test des mutations POST/PUT/DELETE');
        
        for (const mutation of this.config.api.mutations) {
            await this.testMutation(mutation);
        }
    }

    async testMutation(mutation) {
        const benchmarkName = `${mutation.method}-${mutation.path}`;
        this.logger.info(`🔧 Test de mutation ${benchmarkName}`);
        
        const result = {
            path: mutation.path,
            method: mutation.method,
            success: false,
            metrics: {},
            createdId: null
        };

        try {
            // Test de création
            const createResult = await this.testCreateMutation(mutation);
            result.createdId = createResult.id;
            result.createSuccess = createResult.success;
            
            // Test de mise à jour si nécessaire
            if (createResult.success && mutation.method === 'POST') {
                const updateResult = await this.testUpdateMutation(mutation, createResult.id);
                result.updateSuccess = updateResult.success;
                result.updateId = updateResult.id;
            }
            
            // Test de suppression si nécessaire
            if (createResult.success && mutation.cleanup) {
                const deleteResult = await this.testDeleteMutation(mutation, createResult.id);
                result.deleteSuccess = deleteResult.success;
            }
            
            result.success = createResult.success;
            
            if (result.success) {
                this.logger.success(`✅ ${benchmarkName} - Mutation réussie`);
            } else {
                this.logger.error(`❌ ${benchmarkName} - Mutation échouée`);
            }
            
        } catch (error) {
            result.error = error.message;
            this.logger.error(`❌ ${benchmarkName} - ${error.message}`);
            
            // Nettoyage d'urgence
            if (result.createdId && mutation.cleanup) {
                await this.emergencyCleanup(mutation, result.createdId);
            }
        }
        
        this.results.endpoints[benchmarkName] = result;
        await this.sleep(200);
    }

    async testCreateMutation(mutation) {
        const url = `${this.config.servers.api.baseUrl}${mutation.path}`;
        const payload = { ...mutation.payload };
        
        // Ajouter un timestamp unique pour éviter les conflits
        if (payload.name) {
            payload.name += `-${Date.now()}`;
        }
        if (payload.serialNumber) {
            payload.serialNumber += `-${Date.now()}`;
        }
        
        try {
            const startTime = Date.now();
            const response = await fetch(url, {
                method: mutation.method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
                timeout: this.config.servers.api.timeout
            });
            
            const responseTime = Date.now() - startTime;
            const responseData = await response.json();
            
            return {
                success: response.status === mutation.expectedStatus,
                id: responseData.id || responseData.result?.id,
                responseTime,
                status: response.status,
                data: responseData
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async testUpdateMutation(mutation, id) {
        const url = `${this.config.servers.api.baseUrl}${mutation.path.replace('/:id', `/${id}`)}`;
        const payload = {
            ...mutation.payload,
            name: mutation.payload.name + '-UPDATED'
        };
        
        try {
            const startTime = Date.now();
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
                timeout: this.config.servers.api.timeout
            });
            
            const responseTime = Date.now() - startTime;
            
            return {
                success: response.ok,
                id,
                responseTime,
                status: response.status
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async testDeleteMutation(mutation, id) {
        const url = `${this.config.servers.api.baseUrl}${mutation.path.replace('/:id', `/${id}`)}`;
        
        try {
            const startTime = Date.now();
            const response = await fetch(url, {
                method: 'DELETE',
                timeout: this.config.servers.api.timeout
            });
            
            const responseTime = Date.now() - startTime;
            
            return {
                success: response.ok,
                id,
                responseTime,
                status: response.status
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async emergencyCleanup(mutation, id) {
        try {
            this.logger.warn(`🧹 Nettoyage d'urgence pour ${id}`);
            const url = `${this.config.servers.api.baseUrl}${mutation.path.replace('/:id', `/${id}`)}`;
            
            await fetch(url, {
                method: 'DELETE',
                timeout: 5000
            });
            
        } catch (error) {
            this.logger.error(`❌ Erreur lors du nettoyage d'urgence: ${error.message}`);
        }
    }

    async runLoadTests() {
        this.logger.info('📈 Tests de charge avec autocannon');
        
        // Tests de charge légers pour les endpoints critiques
        const criticalEndpoints = this.config.api.endpoints
            .filter(ep => ep.priority === 'critical')
            .slice(0, 3); // Limiter à 3 endpoints
        
        for (const endpoint of criticalEndpoints) {
            await this.runAutocannonTest(endpoint);
        }
    }

    async runAutocannonTest(endpoint) {
        const url = `${this.config.servers.api.baseUrl}${endpoint.path}`;
        const testName = `load-${endpoint.method}-${endpoint.path.replace(/\//g, '-')}`;
        
        this.logger.info(`🎯 Test de charge: ${testName}`);
        
        const instance = autocannon({
            url,
            method: endpoint.method,
            connections: 10,  // Concurrence modérée
            duration: 30,     // 30 secondes
            headers: {
                'User-Agent': 'PerformanceTest/1.0'
            }
        });
        
        try {
            const result = await new Promise((resolve, reject) => {
                instance.on('done', resolve);
                instance.on('error', reject);
            });
            
            this.results.endpoints[testName] = {
                path: endpoint.path,
                type: 'load-test',
                success: true,
                metrics: {
                    throughput: Math.round(result.throughput),
                    latency: {
                        average: Math.round(result.latency.average),
                        min: Math.round(result.latency.min),
                        max: Math.round(result.latency.max),
                        p50: Math.round(result.latency.p50),
                        p90: Math.round(result.latency.p90),
                        p95: Math.round(result.latency.p95),
                        p99: Math.round(result.latency.p99)
                    },
                    requests: {
                        total: result.requests.total,
                        average: result.requests.average
                    },
                    throughput: {
                        average: Math.round(result.throughput),
                        max: Math.round(result.throughput.max)
                    },
                    errors: result.errors.total,
                    timeouts: result.timeouts.total
                }
            };
            
            this.logger.success(`✅ ${testName}: ${Math.round(result.throughput)} req/s`);
            
        } catch (error) {
            this.results.endpoints[testName] = {
                path: endpoint.path,
                type: 'load-test',
                success: false,
                error: error.message
            };
            
            this.logger.error(`❌ ${testName}: ${error.message}`);
        }
    }

    async runStressTests() {
        this.logger.info('💥 Tests de stress');
        
        // Test de stress sur l'endpoint health
        await this.runStressTest('/api/health', 'health-stress');
    }

    async runStressTest(path, testName) {
        const url = `${this.config.servers.api.baseUrl}${path}`;
        
        this.logger.info(`🔥 Test de stress: ${testName}`);
        
        const instance = autocannon({
            url,
            connections: 50,  // Concurrence élevée
            duration: 60,     // 60 secondes
            headers: {
                'User-Agent': 'StressTest/1.0'
            }
        });
        
        try {
            const result = await new Promise((resolve, reject) => {
                instance.on('done', resolve);
                instance.on('error', reject);
            });
            
            const success = result.errors.total < (result.requests.total * 0.05); // Moins de 5% d'erreurs
            
            this.results.endpoints[testName] = {
                path,
                type: 'stress-test',
                success,
                metrics: {
                    throughput: Math.round(result.throughput),
                    maxThroughput: Math.round(result.throughput.max),
                    avgLatency: Math.round(result.latency.average),
                    p95Latency: Math.round(result.latency.p95),
                    errorRate: (result.errors.total / result.requests.total) * 100,
                    totalRequests: result.requests.total,
                    totalErrors: result.errors.total
                }
            };
            
            if (success) {
                this.logger.success(`✅ ${testName}: Stress test passé`);
            } else {
                this.logger.warn(`⚠️ ${testName}: ${result.errors.total} erreurs détectées`);
            }
            
        } catch (error) {
            this.results.endpoints[testName] = {
                path,
                type: 'stress-test',
                success: false,
                error: error.message
            };
            
            this.logger.error(`❌ ${testName}: ${error.message}`);
        }
    }

    calculateOverallMetrics() {
        const allResults = Object.values(this.results.endpoints);
        const successfulResults = allResults.filter(r => r.success);
        const loadTestResults = allResults.filter(r => r.type === 'load-test' || r.type === 'stress-test');
        
        // Calculer les métriques globales
        const totalLatencies = allResults
            .filter(r => r.metrics?.latency)
            .map(r => r.metrics.latency);
            
        const totalThroughputs = loadTestResults
            .filter(r => r.metrics?.throughput)
            .map(r => r.metrics.throughput);
        
        const totalErrors = loadTestResults
            .filter(r => r.metrics?.totalErrors !== undefined)
            .map(r => r.metrics.totalErrors);
            
        const totalRequests = loadTestResults
            .filter(r => r.metrics?.totalRequests !== undefined)
            .map(r => r.metrics.totalRequests);
        
        this.results.metrics = {
            avgResponseTime: totalLatencies.length > 0 ? 
                Math.round(totalLatencies.reduce((a, b) => a + b, 0) / totalLatencies.length) : 0,
            maxResponseTime: totalLatencies.length > 0 ? Math.max(...totalLatencies) : 0,
            minResponseTime: totalLatencies.length > 0 ? Math.min(...totalLatencies) : 0,
            avgThroughput: totalThroughputs.length > 0 ? 
                Math.round(totalThroughputs.reduce((a, b) => a + b, 0) / totalThroughputs.length) : 0,
            maxThroughput: totalThroughputs.length > 0 ? Math.max(...totalThroughputs) : 0,
            totalErrors: totalErrors.length > 0 ? 
                totalErrors.reduce((a, b) => a + b, 0) : 0,
            totalRequests: totalRequests.length > 0 ? 
                totalRequests.reduce((a, b) => a + b, 0) : 0,
            errorRate: (totalRequests.length > 0 && totalErrors.length > 0) ?
                ((totalErrors.reduce((a, b) => a + b, 0) / totalRequests.reduce((a, b) => a + b, 0)) * 100).toFixed(2) : '0.00',
            successRate: allResults.length > 0 ?
                ((successfulResults.length / allResults.length) * 100).toFixed(2) : '0.00'
        };
    }

    async generateReport() {
        const reportFile = path.join(this.config.reporting.outputDir, 'api-performance-report.json');
        await fs.writeJson(reportFile, this.results, { spaces: 2 });
        this.logger.info(`📄 Rapport API sauvegardé: ${reportFile}`);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = APIPerformanceTester;