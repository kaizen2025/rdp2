/**
 * Tests de profilage mémoire et CPU des processus Node.js
 * @file memory-profiling.js
 */

const v8 = require('v8');
const os = require('os');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');

class MemoryProfilingSuite {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.results = {
            timestamp: moment().toISOString(),
            systemInfo: this.getSystemInfo(),
            memorySnapshots: {},
            cpuMonitoring: {},
            heapAnalysis: {},
            performanceMetrics: {},
            summary: {},
            metrics: {}
        };
        this.monitoringInterval = null;
        this.startMemory = null;
    }

    getSystemInfo() {
        return {
            platform: os.platform(),
            arch: os.arch(),
            nodeVersion: process.version,
            v8Version: process.versions.v8,
            cpus: os.cpus().length,
            totalMemory: Math.round(os.totalmem() / 1024 / 1024), // MB
            freeMemory: Math.round(os.freemem() / 1024 / 1024), // MB
            hostname: os.hostname(),
            uptime: process.uptime()
        };
    }

    async runAllTests() {
        const startTime = moment();
        this.logger.info('💾 Début du profilage mémoire et CPU');

        try {
            // Prendre une capture mémoire initiale
            await this.takeInitialSnapshot();
            
            // Démarrer le monitoring continu
            await this.startContinuousMonitoring();
            
            // Exécuter des tests de charge pour observer l'impact mémoire
            await this.runMemoryLoadTests();
            
            // Analyser le tas (heap)
            await this.analyzeHeapUsage();
            
            // Test de croissance mémoire
            await this.testMemoryGrowth();
            
            // Test de fuite mémoire potentielle
            await this.testMemoryLeaks();
            
            // Arrêter le monitoring
            await this.stopContinuousMonitoring();
            
            // Prendre une capture finale
            await this.takeFinalSnapshot();
            
            const endTime = moment();
            const duration = endTime.diff(startTime);
            
            this.results.summary = {
                success: true,
                duration: `${duration}ms`,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                monitoringDuration: this.getMonitoringDuration(),
                testsRun: Object.keys(this.results).filter(k => 
                    !['timestamp', 'systemInfo', 'summary'].includes(k)
                ).length
            };
            
            this.calculateOverallMetrics();
            this.generateMemoryRecommendations();
            this.logger.success('✅ Profilage mémoire et CPU terminé');
            
        } catch (error) {
            this.logger.error('❌ Erreur lors du profilage:', error);
            this.results.summary = {
                success: false,
                error: error.message,
                duration: moment().diff(startTime) + 'ms'
            };
        }
        
        return this.results;
    }

    async takeInitialSnapshot() {
        this.logger.info('📸 Capture mémoire initiale');
        
        try {
            const memUsage = process.memoryUsage();
            const heapStats = v8.getHeapStatistics();
            const cpuUsage = process.cpuUsage();
            
            this.startMemory = {
                timestamp: moment().toISOString(),
                memoryUsage: {
                    rss: Math.round(memUsage.rss / 1024 / 1024), // MB
                    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
                    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
                    external: Math.round(memUsage.external / 1024 / 1024), // MB
                    arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024) // MB
                },
                heapStatistics: {
                    ...heapStats,
                    totalHeapSizeMB: Math.round(heapStats.total_heap_size / 1024 / 1024),
                    usedHeapSizeMB: Math.round(heapStats.used_heap_size / 1024 / 1024),
                    heapSizeLimitMB: Math.round(heapStats.heap_size_limit / 1024 / 1024)
                },
                cpuUsage: {
                    user: cpuUsage.user,
                    system: cpuUsage.system
                },
                systemMemory: {
                    total: Math.round(os.totalmem() / 1024 / 1024),
                    free: Math.round(os.freemem() / 1024 / 1024),
                    used: Math.round((os.totalmem() - os.freemem()) / 1024 / 1024),
                    usagePercent: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)
                }
            };
            
            this.results.memorySnapshots.initial = this.startMemory;
            this.logger.info(`📊 Mémoire initiale: ${this.startMemory.memoryUsage.heapUsed}MB heap utilisé`);
            
        } catch (error) {
            this.logger.error('❌ Erreur lors de la capture initiale:', error);
        }
    }

    async startContinuousMonitoring() {
        this.logger.info('📈 Démarrage du monitoring continu');
        
        const monitoringData = [];
        const interval = this.config.memory.intervals.medium; // 5 secondes
        
        this.monitoringInterval = setInterval(() => {
            try {
                const snapshot = this.captureCurrentState();
                monitoringData.push(snapshot);
                
                // Vérifier les alertes
                this.checkMemoryAlerts(snapshot);
                
            } catch (error) {
                this.logger.error('❌ Erreur lors du monitoring:', error);
            }
        }, interval);
        
        this.monitoringData = monitoringData;
        this.logger.info(`📊 Monitoring démarré (intervalle: ${interval}ms)`);
    }

    captureCurrentState() {
        const memUsage = process.memoryUsage();
        const heapStats = v8.getHeapStatistics();
        const cpuUsage = process.cpuUsage();
        const systemLoad = os.loadavg();
        
        return {
            timestamp: moment().toISOString(),
            memoryUsage: {
                rss: Math.round(memUsage.rss / 1024 / 1024),
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
                external: Math.round(memUsage.external / 1024 / 1024),
                arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024)
            },
            heapStatistics: {
                totalHeapSizeMB: Math.round(heapStats.total_heap_size / 1024 / 1024),
                usedHeapSizeMB: Math.round(heapStats.used_heap_size / 1024 / 1024),
                heapSizeLimitMB: Math.round(heapStats.heap_size_limit / 1024 / 1024)
            },
            cpuUsage: {
                user: cpuUsage.user,
                system: cpuUsage.system,
                percent: this.calculateCPUPercent(cpuUsage)
            },
            systemMetrics: {
                loadAverage: systemLoad,
                freeMemory: Math.round(os.freemem() / 1024 / 1024),
                usedMemory: Math.round((os.totalmem() - os.freemem()) / 1024 / 1024)
            }
        };
    }

    calculateCPUPercent(cpuUsage) {
        if (!this.lastCPUUsage) {
            this.lastCPUUsage = cpuUsage;
            return 0;
        }
        
        const userDiff = cpuUsage.user - this.lastCPUUsage.user;
        const systemDiff = cpuUsage.system - this.lastCPUUsage.system;
        
        this.lastCPUUsage = cpuUsage;
        
        // Calcul simplifié du pourcentage CPU
        const totalDiff = userDiff + systemDiff;
        return Math.round((totalDiff / 1000000) * 100); // Conversion approximative
    }

    checkMemoryAlerts(snapshot) {
        const heapUsed = snapshot.memoryUsage.heapUsed;
        const rss = snapshot.memoryUsage.rss;
        
        // Alertes sur la croissance de la mémoire
        if (this.startMemory) {
            const heapGrowth = heapUsed - this.startMemory.memoryUsage.heapUsed;
            const rssGrowth = rss - this.startMemory.memoryUsage.rss;
            
            if (heapGrowth > this.config.memory.alerts.heapGrowth / 1024 / 1024) {
                this.logger.warn(`⚠️ Croissance heap détectée: +${heapGrowth}MB`);
            }
            
            if (rssGrowth > this.config.memory.alerts.rssGrowth / 1024 / 1024) {
                this.logger.warn(`⚠️ Croissance RSS détectée: +${rssGrowth}MB`);
            }
        }
        
        // Alertes sur les seuils absolus
        if (heapUsed > this.config.thresholds.memory.warning / 1024 / 1024) {
            this.logger.warn(`⚠️ Utilisation mémoire élevée: ${heapUsed}MB`);
        }
        
        if (heapUsed > this.config.thresholds.memory.critical / 1024 / 1024) {
            this.logger.error(`🔴 Utilisation mémoire critique: ${heapUsed}MB`);
        }
    }

    async runMemoryLoadTests() {
        this.logger.info('🧪 Tests de charge mémoire');
        
        // Test avec simulation de charge API
        await this.runAPILoadMemoryTest();
        
        // Test avec simulation de charge base de données
        await this.runDatabaseLoadMemoryTest();
        
        // Test avec simulation de charge WebSocket
        await this.runWebSocketLoadMemoryTest();
    }

    async runAPILoadMemoryTest() {
        this.logger.info('📡 Test de charge API - Impact mémoire');
        
        const testDuration = 30000; // 30 secondes
        const startTime = moment();
        
        try {
            // Simuler des requêtes API
            const fetch = require('node-fetch');
            const endpoints = [
                '/api/health',
                '/api/computers',
                '/api/loans',
                '/api/notifications'
            ];
            
            const requests = [];
            const startMemory = process.memoryUsage();
            
            // Lancer des requêtes en boucle
            const requestInterval = setInterval(async () => {
                const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
                try {
                    const response = await fetch(`${this.config.servers.api.baseUrl}${endpoint}`);
                    await response.text(); // Consommer la réponse
                    
                    requests.push({
                        timestamp: moment().toISOString(),
                        endpoint,
                        status: response.status
                    });
                } catch (error) {
                    requests.push({
                        timestamp: moment().toISOString(),
                        endpoint,
                        error: error.message
                    });
                }
            }, 200); // 5 requêtes par seconde
            
            // Attendre la fin du test
            await this.sleep(testDuration);
            clearInterval(requestInterval);
            
            const endMemory = process.memoryUsage();
            const duration = moment().diff(startTime);
            
            const memoryDelta = {
                heapUsed: Math.round((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024),
                rss: Math.round((endMemory.rss - startMemory.rss) / 1024 / 1024),
                external: Math.round((endMemory.external - startMemory.external) / 1024 / 1024)
            };
            
            this.results.performanceMetrics.apiLoadTest = {
                success: true,
                duration,
                requestsCount: requests.length,
                errorsCount: requests.filter(r => r.error).length,
                memoryDelta,
                avgRequestsPerSecond: Math.round(requests.length / (duration / 1000))
            };
            
            this.logger.success(`✅ Test API: ${requests.length} requêtes, mémoire +${memoryDelta.heapUsed}MB`);
            
        } catch (error) {
            this.results.performanceMetrics.apiLoadTest = {
                success: false,
                error: error.message
            };
            
            this.logger.error(`❌ Test API: ${error.message}`);
        }
    }

    async runDatabaseLoadMemoryTest() {
        this.logger.info('🗄️ Test de charge base de données - Impact mémoire');
        
        try {
            const Database = require('better-sqlite3');
            const db = new Database(this.config.servers.database.path, { readonly: true });
            
            const startMemory = process.memoryUsage();
            const queries = [
                'SELECT COUNT(*) FROM computers',
                'SELECT COUNT(*) FROM loans',
                'SELECT * FROM computers LIMIT 50',
                'SELECT * FROM loans LIMIT 50'
            ];
            
            const results = [];
            const startTime = moment();
            
            // Exécuter des requêtes en boucle
            for (let i = 0; i < 1000; i++) {
                const query = queries[i % queries.length];
                try {
                    const result = db.prepare(query).all();
                    results.push({
                        query,
                        rowsCount: result.length,
                        timestamp: moment().toISOString()
                    });
                } catch (error) {
                    results.push({
                        query,
                        error: error.message,
                        timestamp: moment().toISOString()
                    });
                }
                
                // Pause occasionnelle pour simuler du trafic réaliste
                if (i % 100 === 0) {
                    await this.sleep(10);
                }
            }
            
            const endMemory = process.memoryUsage();
            const duration = moment().diff(startTime);
            
            db.close();
            
            const memoryDelta = {
                heapUsed: Math.round((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024),
                rss: Math.round((endMemory.rss - startMemory.rss) / 1024 / 1024)
            };
            
            this.results.performanceMetrics.databaseLoadTest = {
                success: true,
                duration,
                queriesCount: results.length,
                errorsCount: results.filter(r => r.error).length,
                memoryDelta,
                avgQueriesPerSecond: Math.round(results.length / (duration / 1000))
            };
            
            this.logger.success(`✅ Test DB: ${results.length} requêtes, mémoire +${memoryDelta.heapUsed}MB`);
            
        } catch (error) {
            this.results.performanceMetrics.databaseLoadTest = {
                success: false,
                error: error.message
            };
            
            this.logger.error(`❌ Test DB: ${error.message}`);
        }
    }

    async runWebSocketLoadMemoryTest() {
        this.logger.info('🔌 Test de charge WebSocket - Impact mémoire');
        
        try {
            const WebSocket = require('ws');
            const startMemory = process.memoryUsage();
            
            const connections = [];
            const messages = [];
            const startTime = moment();
            
            // Créer des connexions WebSocket
            for (let i = 0; i < 20; i++) {
                try {
                    const ws = new WebSocket(`ws://localhost:${this.config.servers.websocket.port}`);
                    
                    ws.on('open', () => {
                        // Envoyer des messages périodiques
                        const messageInterval = setInterval(() => {
                            ws.send(JSON.stringify({
                                type: 'load_test',
                                data: 'x'.repeat(1000) // 1KB message
                            }));
                        }, 1000);
                        
                        connections.push({ ws, interval: messageInterval, id: i });
                    });
                    
                    ws.on('message', (data) => {
                        messages.push({
                            size: data.length,
                            timestamp: moment().toISOString()
                        });
                    });
                    
                    // Attendre la connexion
                    await this.sleep(100);
                    
                } catch (error) {
                    // Ignorer les erreurs de connexion
                }
            }
            
            // Attendre et collecter les messages
            await this.sleep(10000);
            
            // Fermer toutes les connexions
            connections.forEach(conn => {
                clearInterval(conn.interval);
                conn.ws.close();
            });
            
            const endMemory = process.memoryUsage();
            const duration = moment().diff(startTime);
            
            const memoryDelta = {
                heapUsed: Math.round((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024),
                rss: Math.round((endMemory.rss - startMemory.rss) / 1024 / 1024)
            };
            
            this.results.performanceMetrics.websocketLoadTest = {
                success: true,
                duration,
                connectionsCount: connections.length,
                messagesCount: messages.length,
                memoryDelta,
                avgMessagesPerSecond: Math.round(messages.length / (duration / 1000))
            };
            
            this.logger.success(`✅ Test WS: ${connections.length} connexions, ${messages.length} messages, mémoire +${memoryDelta.heapUsed}MB`);
            
        } catch (error) {
            this.results.performanceMetrics.websocketLoadTest = {
                success: false,
                error: error.message
            };
            
            this.logger.error(`❌ Test WS: ${error.message}`);
        }
    }

    async analyzeHeapUsage() {
        this.logger.info('🔍 Analyse de l\'utilisation du tas (heap)');
        
        try {
            const heapStats = v8.getHeapStatistics();
            const memUsage = process.memoryUsage();
            
            // Analyser la fragmentation du tas
            const heapUsedPercent = (heapStats.used_heap_size / heapStats.total_heap_size) * 100;
            const heapFragmentationPercent = ((heapStats.total_heap_size - heapStats.used_heap_size) / heapStats.total_heap_size) * 100;
            
            this.results.heapAnalysis = {
                totalHeapSizeMB: Math.round(heapStats.total_heap_size / 1024 / 1024),
                usedHeapSizeMB: Math.round(heapStats.used_heap_size / 1024 / 1024),
                heapSizeLimitMB: Math.round(heapStats.heap_size_limit / 1024 / 1024),
                heapUsedPercent: heapUsedPercent.toFixed(2),
                heapFragmentationPercent: heapFragmentationPercent.toFixed(2),
                totalAvailableSizeMB: Math.round((heapStats.heap_size_limit - heapStats.total_heap_size) / 1024 / 1024),
                doesZapGarbage: heapStats.does_zap_garbage,
                isNarrowingRange: heapStats.is_narrowing_range,
                memoryUsageBreakdown: {
                    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
                    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
                    external: Math.round(memUsage.external / 1024 / 1024),
                    rss: Math.round(memUsage.rss / 1024 / 1024)
                }
            };
            
            this.logger.info(`📊 Heap: ${this.results.heapAnalysis.heapUsedPercent}% utilisé, ${this.results.heapAnalysis.heapFragmentationPercent}% fragmenté`);
            
        } catch (error) {
            this.results.heapAnalysis = {
                error: error.message
            };
            
            this.logger.error('❌ Erreur lors de l\'analyse heap:', error);
        }
    }

    async testMemoryGrowth() {
        this.logger.info('📈 Test de croissance mémoire');
        
        try {
            const measurements = [];
            const startMemory = process.memoryUsage();
            
            // Créer des objets et mesurer la croissance
            const objects = [];
            
            for (let i = 0; i < 1000; i++) {
                // Créer des objetssimulant la charge de l'application
                const obj = {
                    id: i,
                    data: 'x'.repeat(1000), // 1KB de données
                    timestamp: Date.now(),
                    array: new Array(100).fill(Math.random())
                };
                
                objects.push(obj);
                
                // Mesurer tous les 100 objets
                if (i % 100 === 0) {
                    const memUsage = process.memoryUsage();
                    measurements.push({
                        iteration: i,
                        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
                        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
                        timestamp: moment().toISOString()
                    });
                    
                    // Attendre un peu pour laisser le temps au GC
                    if (i % 300 === 0) {
                        if (global.gc) {
                            global.gc();
                        }
                        await this.sleep(100);
                    }
                }
            }
            
            const endMemory = process.memoryUsage();
            const totalGrowth = endMemory.heapUsed - startMemory.heapUsed;
            
            // Nettoyer
            objects.length = 0;
            if (global.gc) {
                global.gc();
            }
            
            this.results.memoryGrowthTest = {
                success: true,
                totalObjects: 1000,
                measurements: measurements,
                memoryGrowth: Math.round(totalGrowth / 1024 / 1024),
                growthPerObject: Math.round(totalGrowth / 1000),
                finalHeapSize: Math.round(endMemory.heapTotal / 1024 / 1024),
                heapUsedPercent: ((endMemory.heapUsed / endMemory.heapTotal) * 100).toFixed(2)
            };
            
            this.logger.success(`✅ Croissance mémoire: +${Math.round(totalGrowth / 1024 / 1024)}MB pour 1000 objets`);
            
        } catch (error) {
            this.results.memoryGrowthTest = {
                success: false,
                error: error.message
            };
            
            this.logger.error(`❌ Test croissance: ${error.message}`);
        }
    }

    async testMemoryLeaks() {
        this.logger.info('🔍 Test de détection de fuites mémoire');
        
        try {
            const iterations = 50;
            const measurements = [];
            
            // Simuler des opérations qui pourraient causer des fuites
            for (let i = 0; i < iterations; i++) {
                // Créer des structures de données temporaires
                const tempData = {
                    caches: [],
                    timers: [],
                    connections: []
                };
                
                // Simuler des caches qui grandissent
                for (let j = 0; j < 100; j++) {
                    tempData.caches.push({
                        key: `key_${j}`,
                        value: 'x'.repeat(1000),
                        timestamp: Date.now()
                    });
                }
                
                // Simuler des timers qui s'accumulent
                const timer = setTimeout(() => {}, 1000);
                tempData.timers.push(timer);
                
                // Mesurer la mémoire
                const memUsage = process.memoryUsage();
                measurements.push({
                    iteration: i,
                    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
                    rss: Math.round(memUsage.rss / 1024 / 1024),
                    timestamp: moment().toISOString()
                });
                
                // Attendre pour observer la croissance
                await this.sleep(100);
                
                // Nettoyer (mais pas tout pour simuler de vraies conditions)
                tempData.caches = tempData.caches.slice(0, 50); // Garder seulement 50 éléments
                clearTimeout(timer);
            }
            
            // Forcer le garbage collection
            if (global.gc) {
                global.gc();
            }
            
            await this.sleep(2000);
            
            // Mesurer après nettoyage
            const finalMemUsage = process.memoryUsage();
            const initialMem = measurements[0].heapUsed;
            const finalMem = finalMemUsage.heapUsed / 1024 / 1024;
            const netGrowth = finalMem - initialMem;
            
            this.results.memoryLeakTest = {
                success: true,
                iterations,
                measurements: measurements,
                initialHeapUsed: initialMem,
                finalHeapUsed: Math.round(finalMem),
                netGrowth: Math.round(netGrowth),
                avgGrowthPerIteration: Math.round(netGrowth / iterations),
                potentialLeak: netGrowth > 10, // Plus de 10MB de croissance est suspect
                recommendations: netGrowth > 10 ? [
                    'Vérifier les références circulaires',
                    'Surveiller les caches non limités',
                    'Examiner les event listeners non supprimés'
                ] : []
            };
            
            if (netGrowth > 10) {
                this.logger.warn(`⚠️ Croissance mémoire potentielle: +${Math.round(netGrowth)}MB`);
            } else {
                this.logger.success(`✅ Pas de fuite détectée: +${Math.round(netGrowth)}MB`);
            }
            
        } catch (error) {
            this.results.memoryLeakTest = {
                success: false,
                error: error.message
            };
            
            this.logger.error(`❌ Test fuites: ${error.message}`);
        }
    }

    async stopContinuousMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            this.logger.info('📈 Monitoring continu arrêté');
        }
    }

    async takeFinalSnapshot() {
        this.logger.info('📸 Capture mémoire finale');
        
        try {
            const memUsage = process.memoryUsage();
            const heapStats = v8.getHeapStatistics();
            
            const finalSnapshot = {
                timestamp: moment().toISOString(),
                memoryUsage: {
                    rss: Math.round(memUsage.rss / 1024 / 1024),
                    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
                    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
                    external: Math.round(memUsage.external / 1024 / 1024),
                    arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024)
                },
                heapStatistics: {
                    totalHeapSizeMB: Math.round(heapStats.total_heap_size / 1024 / 1024),
                    usedHeapSizeMB: Math.round(heapStats.used_heap_size / 1024 / 1024)
                }
            };
            
            this.results.memorySnapshots.final = finalSnapshot;
            
            // Calculer les deltas
            if (this.startMemory) {
                const delta = {
                    heapUsed: finalSnapshot.memoryUsage.heapUsed - this.startMemory.memoryUsage.heapUsed,
                    rss: finalSnapshot.memoryUsage.rss - this.startMemory.memoryUsage.rss,
                    external: finalSnapshot.memoryUsage.external - this.startMemory.memoryUsage.external
                };
                
                this.results.memorySnapshots.delta = delta;
                this.logger.info(`📊 Croissance finale: heap +${delta.heapUsed}MB, RSS +${delta.rss}MB`);
            }
            
        } catch (error) {
            this.logger.error('❌ Erreur lors de la capture finale:', error);
        }
    }

    getMonitoringDuration() {
        if (!this.monitoringData || this.monitoringData.length === 0) return 0;
        
        const firstTime = new Date(this.monitoringData[0].timestamp).getTime();
        const lastTime = new Date(this.monitoringData[this.monitoringData.length - 1].timestamp).getTime();
        
        return lastTime - firstTime;
    }

    calculateOverallMetrics() {
        // Calculer les métriques globales
        if (this.monitoringData && this.monitoringData.length > 0) {
            const heapUsedValues = this.monitoringData.map(s => s.memoryUsage.heapUsed);
            const rssValues = this.monitoringData.map(s => s.memoryUsage.rss);
            const cpuPercentValues = this.monitoringData.map(s => s.cpuUsage.percent || 0).filter(p => p > 0);
            
            this.results.metrics = {
                monitoringSamples: this.monitoringData.length,
                avgHeapUsed: Math.round(heapUsedValues.reduce((a, b) => a + b, 0) / heapUsedValues.length),
                maxHeapUsed: Math.max(...heapUsedValues),
                minHeapUsed: Math.min(...heapUsedValues),
                avgRSS: Math.round(rssValues.reduce((a, b) => a + b, 0) / rssValues.length),
                maxRSS: Math.max(...rssValues),
                avgCPUPercent: cpuPercentValues.length > 0 ? 
                    Math.round(cpuPercentValues.reduce((a, b) => a + b, 0) / cpuPercentValues.length) : 0,
                maxCPUPercent: cpuPercentValues.length > 0 ? Math.max(...cpuPercentValues) : 0,
                memoryGrowth: this.results.memorySnapshots.delta ? this.results.memorySnapshots.delta.heapUsed : 0
            };
        }
        
        // Ajouter les métriques des tests spécifiques
        Object.entries(this.results.performanceMetrics).forEach(([testName, testResult]) => {
            if (testResult.success && testResult.memoryDelta) {
                this.results.metrics[`${testName}_memoryDelta`] = testResult.memoryDelta;
            }
        });
    }

    generateMemoryRecommendations() {
        this.results.recommendations = [];
        
        if (this.results.metrics) {
            const avgHeapUsed = this.results.metrics.avgHeapUsed;
            const maxHeapUsed = this.results.metrics.maxHeapUsed;
            const avgCPUPercent = this.results.metrics.avgCPUPercent;
            const maxCPUPercent = this.results.metrics.maxCPUPercent;
            
            // Recommandations basées sur la mémoire
            if (avgHeapUsed > 500) {
                this.results.recommendations.push({
                    type: 'memory',
                    severity: 'medium',
                    message: `Utilisation mémoire élevée (${avgHeapUsed}MB moyenne)`,
                    suggestion: 'Optimiser la gestion mémoire et considerer la mise en cache'
                });
            }
            
            if (maxHeapUsed > 1000) {
                this.results.recommendations.push({
                    type: 'memory',
                    severity: 'high',
                    message: `Pic de mémoire élevé (${maxHeapUsed}MB)`,
                    suggestion: 'Investiguer les pics de consommation et vérifier les fuites'
                });
            }
            
            // Recommandations basées sur le CPU
            if (avgCPUPercent > this.config.thresholds.cpu.warning) {
                this.results.recommendations.push({
                    type: 'cpu',
                    severity: avgCPUPercent > this.config.thresholds.cpu.critical ? 'critical' : 'high',
                    message: `Utilisation CPU élevée (${avgCPUPercent}% moyenne)`,
                    suggestion: 'Optimiser les algorithmes et considerer la parallélisation'
                });
            }
            
            if (this.results.memoryLeakTest?.potentialLeak) {
                this.results.recommendations.push({
                    type: 'leak',
                    severity: 'high',
                    message: 'Fuite mémoire potentielle détectée',
                    suggestion: this.results.memoryLeakTest.recommendations.join(', ')
                });
            }
            
            // Recommandations sur l'optimisation du heap
            if (this.results.heapAnalysis?.heapFragmentationPercent > 20) {
                this.results.recommendations.push({
                    type: 'heap',
                    severity: 'medium',
                    message: `Fragmentation heap élevée (${this.results.heapAnalysis.heapFragmentationPercent}%)`,
                    suggestion: 'Considérer l\'optimisation des structures de données'
                });
            }
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = MemoryProfilingSuite;