/**
 * Tests de performance WebSocket avec Artillery
 * @file ws-performance.js
 */

const WebSocket = require('ws');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');

class WebSocketPerformanceTester {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.results = {
            timestamp: moment().toISOString(),
            connectionTests: {},
            messageTests: {},
            loadTests: {},
            summary: {},
            metrics: {}
        };
    }

    async runAllTests() {
        const startTime = moment();
        this.logger.info('🔌 Début des tests de performance WebSocket');

        try {
            await this.runConnectionTests();
            await this.runMessageTests();
            await this.runLoadTests();
            await this.runStressTests();
            
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
            this.logger.success('✅ Tests WebSocket terminés');
            
        } catch (error) {
            this.logger.error('❌ Erreur lors des tests WebSocket:', error);
            this.results.summary = {
                success: false,
                error: error.message,
                duration: moment().diff(startTime) + 'ms'
            };
        }
        
        return this.results;
    }

    async runConnectionTests() {
        this.logger.info('🔗 Tests de connexion');
        
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
            await this.runWebSocketTest(test, this.results.connectionTests);
        }
    }

    async testSimpleConnection() {
        return new Promise((resolve, reject) => {
            const startTime = moment();
            const ws = new WebSocket(`ws://localhost:${this.config.servers.websocket.port}`);
            
            const timeout = setTimeout(() => {
                ws.close();
                reject(new Error('Timeout de connexion'));
            }, 5000);
            
            ws.on('open', () => {
                const duration = moment().diff(startTime);
                clearTimeout(timeout);
                ws.close();
                
                resolve({
                    success: true,
                    duration,
                    message: 'Connexion établie'
                });
            });
            
            ws.on('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }

    async testMultipleConnections() {
        const connections = [];
        const results = [];
        const maxConnections = 20;
        
        this.logger.info(`🔄 Création de ${maxConnections} connexions simultanées`);
        
        for (let i = 0; i < maxConnections; i++) {
            const result = this.createConnection(i);
            connections.push(result.promise);
            results.push(result);
        }
        
        try {
            const connectionResults = await Promise.allSettled(connections);
            const successes = connectionResults.filter(r => r.status === 'fulfilled').length;
            const failures = connectionResults.filter(r => r.status === 'rejected').length;
            
            return {
                success: failures === 0,
                connections: maxConnections,
                successes,
                failures,
                successRate: (successes / maxConnections) * 100
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    createConnection(id) {
        return {
            id,
            promise: new Promise((resolve, reject) => {
                const ws = new WebSocket(`ws://localhost:${this.config.servers.websocket.port}`);
                
                const timeout = setTimeout(() => {
                    ws.close();
                    reject(new Error(`Timeout pour connexion ${id}`));
                }, 3000);
                
                ws.on('open', () => {
                    clearTimeout(timeout);
                    ws.close();
                    resolve({ id, success: true });
                });
                
                ws.on('error', (error) => {
                    clearTimeout(timeout);
                    reject(new Error(`Erreur connexion ${id}: ${error.message}`));
                });
            })
        };
    }

    async testConnectionTimeout() {
        return new Promise((resolve, reject) => {
            const startTime = moment();
            const ws = new WebSocket(`ws://localhost:9999`); // Port incorrect
            
            const timeout = setTimeout(() => {
                ws.close();
                const duration = moment().diff(startTime);
                resolve({
                    success: false,
                    duration,
                    message: 'Timeout attendu sur port incorrect'
                });
            }, 2000);
            
            ws.on('error', (error) => {
                clearTimeout(timeout);
                const duration = moment().diff(startTime);
                resolve({
                    success: true,
                    duration,
                    message: 'Erreur attendue sur port incorrect'
                });
            });
        });
    }

    async runMessageTests() {
        this.logger.info('💬 Tests de messagerie');
        
        // Test d'envoi et réception de messages
        await this.testMessageDelivery();
        
        // Test de différents types de messages
        await this.testMessageTypes();
        
        // Test de broadcast
        await this.testBroadcast();
    }

    async testMessageDelivery() {
        this.logger.info('📤 Test de livraison de messages');
        
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(`ws://localhost:${this.config.servers.websocket.port}`);
            const testMessage = {
                type: 'test',
                data: 'message-test-' + Date.now(),
                timestamp: moment().toISOString()
            };
            
            const timeout = setTimeout(() => {
                ws.close();
                reject(new Error('Timeout test message'));
            }, 10000);
            
            ws.on('open', () => {
                ws.send(JSON.stringify(testMessage));
            });
            
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    
                    if (message.type === 'data_updated' || message.type === 'test') {
                        clearTimeout(timeout);
                        ws.close();
                        
                        resolve({
                            success: true,
                            messageSent: testMessage,
                            messageReceived: message,
                            deliveryTime: moment().toISOString()
                        });
                    }
                } catch (error) {
                    // Ignorer les messages non-JSON
                }
            });
            
            ws.on('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }

    async testMessageTypes() {
        this.logger.info('📋 Test de différents types de messages');
        
        const messageTypes = this.config.websocket.messageTypes;
        const results = [];
        
        for (const messageType of messageTypes) {
            try {
                const result = await this.testMessageType(messageType);
                results.push(result);
                
                // Pause entre les types de messages
                await this.sleep(100);
                
            } catch (error) {
                results.push({
                    type: messageType,
                    success: false,
                    error: error.message
                });
            }
        }
        
        this.results.messageTests.messageTypes = results;
        this.logger.info(`📊 Types de messages testés: ${results.length}`);
        
        return results;
    }

    async testMessageType(messageType) {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(`ws://localhost:${this.config.servers.websocket.port}`);
            const testMessage = {
                type: messageType,
                data: {
                    test: true,
                    timestamp: moment().toISOString()
                }
            };
            
            const timeout = setTimeout(() => {
                ws.close();
                reject(new Error(`Timeout pour type ${messageType}`));
            }, 5000);
            
            ws.on('open', () => {
                ws.send(JSON.stringify(testMessage));
            });
            
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    
                    if (message.type === messageType) {
                        clearTimeout(timeout);
                        ws.close();
                        
                        resolve({
                            type: messageType,
                            success: true,
                            message: message,
                            timestamp: moment().toISOString()
                        });
                    }
                } catch (error) {
                    // Ignorer les messages non-JSON
                }
            });
            
            ws.on('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }

    async testBroadcast() {
        this.logger.info('📡 Test de broadcast');
        
        const clientsCount = 5;
        const clients = [];
        const messagesReceived = [];
        
        try {
            // Créer plusieurs clients
            for (let i = 0; i < clientsCount; i++) {
                const client = await this.createConnectedClient(i);
                clients.push(client);
                
                // Écouter les messages
                client.ws.on('message', (data) => {
                    messagesReceived.push({
                        clientId: i,
                        message: data.toString(),
                        timestamp: moment().toISOString()
                    });
                });
            }
            
            // Envoyer un message de broadcast via un client
            const broadcaster = clients[0];
            const broadcastMessage = {
                type: 'data_updated',
                payload: {
                    entity: 'broadcast_test',
                    testId: Date.now()
                }
            };
            
            broadcaster.ws.send(JSON.stringify(broadcastMessage));
            
            // Attendre la propagation
            await this.sleep(1000);
            
            // Fermer toutes les connexions
            clients.forEach(client => client.ws.close());
            
            const broadcastsReceived = messagesReceived.filter(msg => 
                msg.message.includes('data_updated') && 
                msg.message.includes('broadcast_test')
            );
            
            this.results.messageTests.broadcast = {
                success: broadcastsReceived.length >= clientsCount * 0.8, // 80% de réussite minimum
                clientsCount,
                messagesSent: 1,
                messagesReceived: broadcastsReceived.length,
                deliveryRate: (broadcastsReceived.length / clientsCount) * 100
            };
            
        } catch (error) {
            this.results.messageTests.broadcast = {
                success: false,
                error: error.message
            };
        }
    }

    async createConnectedClient(id) {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(`ws://localhost:${this.config.servers.websocket.port}`);
            
            const timeout = setTimeout(() => {
                ws.close();
                reject(new Error(`Timeout connexion client ${id}`));
            }, 3000);
            
            ws.on('open', () => {
                clearTimeout(timeout);
                resolve({ id, ws });
            });
            
            ws.on('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }

    async runLoadTests() {
        this.logger.info('📈 Tests de charge WebSocket');
        
        // Générer le fichier de configuration Artillery
        await this.generateArtilleryConfig();
        
        // Tests avec différents scénarios
        const scenarios = this.config.websocket.testScenarios;
        
        for (const [scenarioName, scenarioConfig] of Object.entries(scenarios)) {
            await this.runArtilleryTest(scenarioName, scenarioConfig);
        }
    }

    async generateArtilleryConfig() {
        const config = {
            config: {
                target: `ws://localhost:${this.config.servers.websocket.port}`,
                phases: [
                    {
                        duration: 30,
                        arrivalRate: 5
                    },
                    {
                        duration: 60,
                        arrivalRate: 10
                    }
                ],
                engine: 'ws',
                engineOptions: {
                    pool: 25
                }
            },
            scenarios: [
                {
                    name: 'WebSocket Load Test',
                    weight: 100,
                    engine: 'ws',
                    flow: [
                        {
                            connect: {
                                url: '/'
                            }
                        },
                        {
                            think: 1
                        },
                        {
                            loop: [
                                {
                                    send: {
                                        data: JSON.stringify({
                                            type: 'load_test',
                                            timestamp: Date.now(),
                                            message: 'Performance test message'
                                        })
                                    }
                                },
                                {
                                    think: 2
                                }
                            ],
                            count: 100
                        },
                        {
                            disconnect: {}
                        }
                    ]
                }
            ]
        };
        
        const configPath = path.join(this.config.reporting.outputDir, 'ws-load-test.yml');
        await fs.writeFile(configPath, require('yaml').stringify(config));
        
        this.logger.info(`📄 Configuration Artillery générée: ${configPath}`);
    }

    async runArtilleryTest(scenarioName, scenarioConfig) {
        this.logger.info(`🎯 Test Artillery: ${scenarioName}`);
        
        // Simulation du test Artillery (implémentation simplifiée)
        const testResult = await this.simulateArtilleryTest(scenarioName, scenarioConfig);
        
        this.results.loadTests[scenarioName] = testResult;
        
        if (testResult.success) {
            this.logger.success(`✅ ${scenarioName}: ${Math.round(testResult.metrics.avgLatency)}ms latence moyenne`);
        } else {
            this.logger.error(`❌ ${scenarioName}: ${testResult.error}`);
        }
    }

    async simulateArtilleryTest(scenarioName, scenarioConfig) {
        const startTime = moment();
        const connections = [];
        const messages = [];
        const errors = [];
        
        try {
            // Créer les connexions
            for (let i = 0; i < scenarioConfig.connections; i++) {
                const connection = await this.createConnectedClient(i);
                connections.push(connection);
                
                // Envoyer des messages
                for (let j = 0; j < scenarioConfig.messagesPerConnection; j++) {
                    const messageStart = moment();
                    
                    try {
                        connection.ws.send(JSON.stringify({
                            type: 'load_test',
                            connectionId: i,
                            messageId: j,
                            timestamp: messageStart.toISOString()
                        }));
                        
                        messages.push({
                            connectionId: i,
                            messageId: j,
                            duration: moment().diff(messageStart),
                            timestamp: messageStart.toISOString()
                        });
                        
                        // Pause entre messages
                        await this.sleep(scenarioConfig.interval);
                        
                    } catch (error) {
                        errors.push({
                            connectionId: i,
                            messageId: j,
                            error: error.message
                        });
                    }
                }
            }
            
            // Calculer les métriques
            const durations = messages.map(m => m.duration);
            const successCount = messages.length;
            const totalMessages = scenarioConfig.connections * scenarioConfig.messagesPerConnection;
            const testDuration = moment().diff(startTime);
            
            // Fermer toutes les connexions
            connections.forEach(conn => conn.ws.close());
            
            return {
                success: errors.length < totalMessages * 0.1, // Moins de 10% d'erreurs
                scenario: scenarioName,
                config: scenarioConfig,
                duration: testDuration,
                metrics: {
                    totalConnections: scenarioConfig.connections,
                    totalMessages: totalMessages,
                    sentMessages: successCount,
                    errorMessages: errors.length,
                    successRate: (successCount / totalMessages) * 100,
                    errorRate: (errors.length / totalMessages) * 100,
                    avgLatency: durations.length > 0 ? 
                        Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0,
                    minLatency: durations.length > 0 ? Math.min(...durations) : 0,
                    maxLatency: durations.length > 0 ? Math.max(...durations) : 0,
                    p95Latency: this.calculatePercentile(durations, 95),
                    messagesPerSecond: Math.round(successCount / (testDuration / 1000))
                },
                errors: errors.slice(0, 10) // Limiter le nombre d'erreurs stockées
            };
            
        } catch (error) {
            // Fermer toutes les connexions en cas d'erreur
            connections.forEach(conn => {
                try {
                    conn.ws.close();
                } catch (e) {
                    // Ignorer les erreurs de fermeture
                }
            });
            
            return {
                success: false,
                scenario: scenarioName,
                error: error.message,
                duration: moment().diff(startTime)
            };
        }
    }

    async runStressTests() {
        this.logger.info('💥 Tests de stress WebSocket');
        
        // Test de stress: beaucoup de connexions simultanées
        const stressTest = {
            name: 'stress-high-load',
            connections: 100,
            messagesPerConnection: 50,
            interval: 100,
            duration: 30000 // 30 secondes
        };
        
        const result = await this.simulateArtilleryTest(stressTest.name, stressTest);
        this.results.loadTests.stressTest = result;
        
        if (result.success && result.metrics.avgLatency < 1000) {
            this.logger.success('✅ Test de stress réussi');
        } else if (result.metrics.avgLatency >= 1000) {
            this.logger.warn('⚠️ Test de stress: latence élevée détectée');
        } else {
            this.logger.error('❌ Test de stress échoué');
        }
    }

    calculatePercentile(values, percentile) {
        if (values.length === 0) return 0;
        const sorted = [...values].sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[Math.max(0, index)];
    }

    calculateOverallMetrics() {
        // Calculer les métriques globales
        const allLoadTests = Object.values(this.results.loadTests);
        const allMessageTests = Object.values(this.results.messageTests);
        
        const latencies = allLoadTests
            .filter(test => test.metrics?.avgLatency)
            .map(test => test.metrics.avgLatency);
            
        const successRates = allLoadTests
            .filter(test => test.metrics?.successRate)
            .map(test => test.metrics.successRate);
            
        const messageRates = allLoadTests
            .filter(test => test.metrics?.messagesPerSecond)
            .map(test => test.metrics.messagesPerSecond);
        
        this.results.metrics = {
            avgLatency: latencies.length > 0 ? 
                Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0,
            minLatency: latencies.length > 0 ? Math.min(...latencies) : 0,
            maxLatency: latencies.length > 0 ? Math.max(...latencies) : 0,
            avgSuccessRate: successRates.length > 0 ? 
                (successRates.reduce((a, b) => a + b, 0) / successRates.length).toFixed(2) : '0.00',
            maxMessageRate: messageRates.length > 0 ? Math.max(...messageRates) : 0,
            connectionTests: Object.keys(this.results.connectionTests).length,
            loadTestsCompleted: allLoadTests.length,
            messageTypesTested: allMessageTests.length || 0
        };
    }

    async runWebSocketTest(testConfig, targetObject) {
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

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = WebSocketPerformanceTester;