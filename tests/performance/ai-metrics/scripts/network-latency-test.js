/**
 * Test de latence réseau pour les services IA
 * Mesure les temps de réponse réseau, latence, bande passante et jitter
 */

const ping = require('ping');
const net = require('net');
const dns = require('dns').promises;
const { exec } = require('child_process');
const PerformanceMonitor = require('../shared/performance-monitor');
const MetricsCollector = require('../shared/metrics-collector');

class NetworkLatencyTest {
    constructor(config = {}) {
        this.config = {
            // Services IA à tester
            targets: [
                { name: 'Ollama Local', host: 'localhost:11434', protocol: 'http' },
                { name: 'DocuCortex Backend', host: 'localhost:3000', protocol: 'http' },
                { name: 'EasyOCR Python', host: 'localhost:8000', protocol: 'http' }
            ],
            
            // Tests réseau
            pingCount: 100,
            tcpTimeout: 5000,
            testDuration: 180, // 3 minutes
            interval: 1000, // 1 seconde entre tests
            
            // Test de bande passante
            bandwidthTestSize: 1024 * 1024, // 1MB
            bandwidthTimeout: 10000,
            
            ...config
        };
        
        this.monitor = new PerformanceMonitor('network-latency');
        this.metrics = new MetricsCollector('network-latency-test');
        this.results = {
            summary: {},
            detailed: [],
            targets: {},
            errors: []
        };
    }

    async initialize() {
        console.log('🔄 Initialisation du test de latence réseau...');
        await this.monitor.start();
        
        // Résoudre les DNS si nécessaire
        await this.resolveTargets();
        
        console.log('🎯 Cibles de test configurées:');
        this.config.targets.forEach(target => {
            console.log(`  - ${target.name}: ${target.host}`);
        });
    }

    async resolveTargets() {
        for (const target of this.config.targets) {
            try {
                const [hostname, port] = target.host.split(':');
                if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
                    const ip = await dns.lookup(hostname);
                    target.resolvedHost = ip.address;
                    target.port = port || (target.protocol === 'https' ? 443 : 80);
                } else {
                    target.resolvedHost = '127.0.0.1';
                    target.port = port || (target.protocol === 'https' ? 443 : 80);
                }
            } catch (error) {
                console.warn(`⚠️ Impossible de résoudre ${target.host}:`, error.message);
                target.resolvedHost = target.host;
            }
        }
    }

    async runTest() {
        console.log('🚀 Démarrage des tests de latence réseau...');
        const startTime = Date.now();
        
        try {
            // Test 1: Ping ICMP
            await this.runPingTests();
            
            // Test 2: Connexions TCP
            await this.runTCPTests();
            
            // Test 3: Latence HTTP
            await this.runHTTPLatencyTests();
            
            // Test 4: Test de bande passante
            await this.runBandwidthTests();
            
            // Test 5: Test de jitter
            await this.runJitterTests();
            
            // Test 6: Test de charge réseau
            await this.runNetworkLoadTests();

        } catch (error) {
            console.error('❌ Erreur pendant les tests:', error.message);
            this.results.errors.push(error.message);
        } finally {
            const endTime = Date.now();
            this.results.summary.testDuration = endTime - startTime;
        }
    }

    async runPingTests() {
        console.log('🏓 Test de ping ICMP...');
        
        for (const target of this.config.targets) {
            if (target.resolvedHost === '127.0.0.1') {
                // Skip localhost ping as it may not work
                this.results.targets[target.name] = {
                    ...this.results.targets[target.name],
                    ping: { skipped: true, reason: 'localhost' }
                };
                continue;
            }
            
            console.log(`  📡 Ping ${target.name}...`);
            const pingResults = await this.performPingTest(target.resolvedHost, this.config.pingCount);
            
            this.results.targets[target.name] = {
                ...this.results.targets[target.name],
                ping: pingResults
            };
            
            await this.sleep(2000); // Pause entre les cibles
        }
    }

    async performPingTest(host, count) {
        const results = {
            count,
            successful: 0,
            failed: 0,
            times: [],
            avg: 0,
            min: 0,
            max: 0,
            loss: 0
        };

        for (let i = 0; i < count; i++) {
            try {
                const response = await ping.promise.probe(host, {
                    timeout: 3,
                    extra: ['-c', '1']
                });
                
                if (response.alive) {
                    results.successful++;
                    const time = parseFloat(response.time);
                    if (!isNaN(time) && time > 0) {
                        results.times.push(time);
                    }
                } else {
                    results.failed++;
                }
            } catch (error) {
                results.failed++;
            }
            
            await this.sleep(100); // 100ms entre les pings
        }

        // Calculer les statistiques
        if (results.times.length > 0) {
            results.times.sort((a, b) => a - b);
            results.min = results.times[0];
            results.max = results.times[results.times.length - 1];
            results.avg = results.times.reduce((sum, time) => sum + time, 0) / results.times.length;
            results.loss = ((results.failed / count) * 100).toFixed(2);
        }

        return results;
    }

    async runTCPTests() {
        console.log('🔌 Test de connexions TCP...');
        
        for (const target of this.config.targets) {
            console.log(`  🔗 TCP ${target.name}:${target.port}...`);
            const tcpResults = await this.performTCPTest(target.resolvedHost, target.port);
            
            this.results.targets[target.name] = {
                ...this.results.targets[target.name],
                tcp: tcpResults
            };
            
            await this.sleep(1000);
        }
    }

    async performTCPTest(host, port) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const socket = new net.Socket();
            let connected = false;
            
            const timeout = setTimeout(() => {
                socket.destroy();
                resolve({
                    connected: false,
                    time: this.config.tcpTimeout,
                    error: 'timeout'
                });
            }, this.config.tcpTimeout);
            
            socket.connect(port, host, () => {
                connected = true;
                const connectTime = Date.now() - startTime;
                clearTimeout(timeout);
                socket.destroy();
                
                resolve({
                    connected: true,
                    time: connectTime,
                    error: null
                });
            });
            
            socket.on('error', (error) => {
                clearTimeout(timeout);
                resolve({
                    connected: false,
                    time: Date.now() - startTime,
                    error: error.message
                });
            });
        });
    }

    async runHTTPLatencyTests() {
        console.log('🌐 Test de latence HTTP...');
        
        for (const target of this.config.targets) {
            if (target.protocol === 'http' || target.protocol === 'https') {
                console.log(`  📡 HTTP ${target.name}...`);
                const httpResults = await this.performHTTPLatencyTest(target);
                
                this.results.targets[target.name] = {
                    ...this.results.targets[target.name],
                    http: httpResults
                };
                
                await this.sleep(2000);
            }
        }
    }

    async performHTTPLatencyTest(target) {
        const results = {
            tests: 20,
            successful: 0,
            failed: 0,
            times: [],
            avg: 0,
            min: 0,
            max: 0,
            p95: 0,
            errors: []
        };

        for (let i = 0; i < results.tests; i++) {
            try {
                const startTime = Date.now();
                const url = `${target.protocol}://${target.host}/api/health`;
                
                const response = await this.makeHTTRequest(url);
                const responseTime = Date.now() - startTime;
                
                if (response.status < 400) {
                    results.successful++;
                    results.times.push(responseTime);
                } else {
                    results.failed++;
                    results.errors.push(`HTTP ${response.status}`);
                }
                
            } catch (error) {
                results.failed++;
                results.errors.push(error.message);
            }
            
            await this.sleep(500);
        }

        // Calculer les statistiques
        if (results.times.length > 0) {
            results.times.sort((a, b) => a - b);
            results.min = results.times[0];
            results.max = results.times[results.times.length - 1];
            results.avg = results.times.reduce((sum, time) => sum + time, 0) / results.times.length;
            results.p95 = results.times[Math.floor(results.times.length * 0.95)];
        }

        return results;
    }

    async runBandwidthTests() {
        console.log('📊 Test de bande passante...');
        
        for (const target of this.config.targets) {
            if (target.protocol === 'http' || target.protocol === 'https') {
                console.log(`  📈 Bande passante ${target.name}...`);
                const bandwidthResults = await this.performBandwidthTest(target);
                
                this.results.targets[target.name] = {
                    ...this.results.targets[target.name],
                    bandwidth: bandwidthResults
                };
            }
        }
    }

    async performBandwidthTest(target) {
        const results = {
            testSize: this.config.bandwidthTestSize,
            duration: 0,
            avgSpeed: 0,
            minSpeed: 0,
            maxSpeed: 0,
            tests: []
        };

        try {
            const startTime = Date.now();
            const url = `${target.protocol}://${target.host}/api/bandwidth-test`;
            
            // Test de téléchargement
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Range': `bytes=0-${this.config.bandwidthTestSize - 1}`
                }
            });
            
            if (response.ok) {
                const data = await response.arrayBuffer();
                const duration = Date.now() - startTime;
                const speed = (this.config.bandwidthTestSize / (duration / 1000)) / (1024 * 1024); // MB/s
                
                results.duration = duration;
                results.avgSpeed = speed;
                results.tests.push({
                    size: this.config.bandwidthTestSize,
                    duration,
                    speed
                });
            }
            
        } catch (error) {
            results.error = error.message;
        }

        return results;
    }

    async runJitterTests() {
        console.log('📈 Test de jitter...');
        
        for (const target of this.config.targets) {
            if (target.protocol === 'http' || target.protocol === 'https') {
                console.log(`  📊 Jitter ${target.name}...`);
                const jitterResults = await this.performJitterTest(target);
                
                this.results.targets[target.name] = {
                    ...this.results.targets[target.name],
                    jitter: jitterResults
                };
            }
        }
    }

    async performJitterTest(target) {
        const results = {
            samples: 50,
            times: [],
            jitter: 0,
            avgJitter: 0
        };

        for (let i = 0; i < results.samples; i++) {
            try {
                const startTime = Date.now();
                await this.makeHTTRequest(`${target.protocol}://${target.host}/api/health`);
                const responseTime = Date.now() - startTime;
                results.times.push(responseTime);
                
            } catch (error) {
                results.times.push(this.config.tcpTimeout);
            }
            
            await this.sleep(200);
        }

        // Calculer le jitter (écart-type des temps de réponse)
        if (results.times.length > 1) {
            const avg = results.times.reduce((sum, time) => sum + time, 0) / results.times.length;
            const variance = results.times.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / results.times.length;
            results.jitter = Math.sqrt(variance);
            
            // Jitter moyen (différence absolue moyenne entre échantillons consécutifs)
            let jitterSum = 0;
            for (let i = 1; i < results.times.length; i++) {
                jitterSum += Math.abs(results.times[i] - results.times[i - 1]);
            }
            results.avgJitter = jitterSum / (results.times.length - 1);
        }

        return results;
    }

    async runNetworkLoadTests() {
        console.log('💪 Test de charge réseau...');
        
        const testDuration = 60000; // 1 minute
        const concurrentConnections = 10;
        const startTime = Date.now();
        
        while (Date.now() - startTime < testDuration) {
            const connectionPromises = [];
            
            // Créer des connexions concurrentes
            for (let i = 0; i < concurrentConnections; i++) {
                const target = this.config.targets[i % this.config.targets.length];
                if (target.protocol === 'http') {
                    connectionPromises.push(this.makeHTTRequest(`${target.protocol}://${target.host}/api/health`));
                }
            }
            
            try {
                await Promise.allSettled(connectionPromises);
            } catch (error) {
                // Ignorer les erreurs individuelles
            }
            
            await this.sleep(1000);
        }
    }

    async makeHTTRequest(url) {
        const axios = require('axios');
        return axios.get(url, {
            timeout: this.config.tcpTimeout,
            validateStatus: () => true // Accepter tous les codes de statut
        });
    }

    async generateReport() {
        console.log('📊 Génération du rapport de latence réseau...');
        
        // Calculer les métriques globales
        const targetSummaries = {};
        
        for (const [targetName, targetResults] of Object.entries(this.results.targets)) {
            const summary = {
                name: targetName,
                totalTests: 0,
                successfulTests: 0,
                overallSuccessRate: 0
            };
            
            // Ping metrics
            if (targetResults.ping && !targetResults.ping.skipped) {
                summary.pingSuccess = parseFloat(targetResults.ping.loss) < 50 ? 'GOOD' : 'POOR';
                summary.pingAvg = `${targetResults.ping.avg.toFixed(2)}ms`;
                summary.pingLoss = `${targetResults.ping.loss}%`;
                summary.totalTests += targetResults.ping.count;
                summary.successfulTests += targetResults.ping.successful;
            }
            
            // TCP metrics
            if (targetResults.tcp) {
                summary.tcpLatency = `${targetResults.tcp.time}ms`;
                summary.tcpStatus = targetResults.tcp.connected ? 'SUCCESS' : 'FAILED';
                summary.totalTests += 1;
                if (targetResults.tcp.connected) summary.successfulTests += 1;
            }
            
            // HTTP metrics
            if (targetResults.http) {
                summary.httpAvgLatency = `${targetResults.http.avg.toFixed(2)}ms`;
                summary.httpP95 = `${targetResults.http.p95.toFixed(2)}ms`;
                summary.httpSuccessRate = `${((targetResults.http.successful / targetResults.http.tests) * 100).toFixed(2)}%`;
                summary.totalTests += targetResults.http.tests;
                summary.successfulTests += targetResults.http.successful;
            }
            
            // Jitter metrics
            if (targetResults.jitter) {
                summary.jitter = `${targetResults.jitter.toFixed(2)}ms`;
                summary.avgJitter = `${targetResults.avgJitter.toFixed(2)}ms`;
            }
            
            // Bande passante
            if (targetResults.bandwidth && targetResults.bandwidth.avgSpeed > 0) {
                summary.bandwidth = `${targetResults.bandwidth.avgSpeed.toFixed(2)} MB/s`;
            }
            
            summary.overallSuccessRate = summary.totalTests > 0 ? 
                ((summary.successfulTests / summary.totalTests) * 100).toFixed(2) : 0;
            
            targetSummaries[targetName] = summary;
        }
        
        // Calculer le score global de réseau
        const globalMetrics = this.calculateGlobalNetworkMetrics(targetSummaries);

        this.results.summary = {
            ...this.results.summary,
            totalTargets: this.config.targets.length,
            testDuration: this.results.summary.testDuration,
            globalMetrics,
            targetSummaries,
            
            // Ressources système
            systemMetrics: await this.monitor.getSystemMetrics(),
            
            // Recommandations
            recommendations: this.generateRecommendations(targetSummaries),
            
            // Erreurs
            errorTypes: this.categorizeErrors(this.results.errors)
        };

        // Sauvegarde des résultats
        const reportPath = `../results/network-latency-test-${new Date().toISOString().split('T')[0]}.json`;
        require('fs').writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        
        return this.results.summary;
    }

    calculateGlobalNetworkMetrics(targetSummaries) {
        const summaries = Object.values(targetSummaries);
        
        if (summaries.length === 0) return {};
        
        const totalTests = summaries.reduce((sum, s) => sum + s.totalTests, 0);
        const totalSuccessful = summaries.reduce((sum, s) => sum + s.successfulTests, 0);
        
        return {
            overallSuccessRate: totalTests > 0 ? ((totalSuccessful / totalTests) * 100).toFixed(2) : 0,
            networkScore: this.calculateNetworkScore(summaries),
            latencyScore: this.calculateLatencyScore(summaries),
            reliabilityScore: this.calculateReliabilityScore(summaries)
        };
    }

    calculateNetworkScore(summaries) {
        let score = 0;
        let count = 0;
        
        summaries.forEach(summary => {
            if (summary.pingSuccess === 'GOOD') {
                score += 90;
                count++;
            } else if (summary.pingSuccess === 'POOR') {
                score += 50;
                count++;
            }
        });
        
        return count > 0 ? (score / count).toFixed(2) : 0;
    }

    calculateLatencyScore(summaries) {
        let score = 0;
        let count = 0;
        
        summaries.forEach(summary => {
            if (summary.httpAvgLatency) {
                const latency = parseFloat(summary.httpAvgLatency);
                if (latency < 100) score += 100;
                else if (latency < 500) score += 80;
                else if (latency < 1000) score += 60;
                else score += 40;
                count++;
            }
        });
        
        return count > 0 ? (score / count).toFixed(2) : 0;
    }

    calculateReliabilityScore(summaries) {
        let score = 0;
        let count = 0;
        
        summaries.forEach(summary => {
            const rate = parseFloat(summary.overallSuccessRate);
            score += rate;
            count++;
        });
        
        return count > 0 ? (score / count).toFixed(2) : 0;
    }

    generateRecommendations(targetSummaries) {
        const recommendations = [];
        
        Object.entries(targetSummaries).forEach(([name, summary]) => {
            if (summary.pingLoss && parseFloat(summary.pingLoss) > 10) {
                recommendations.push(`${name}: Perte de paquets élevée (${summary.pingLoss}). Vérifiez la connexion réseau.`);
            }
            
            if (summary.httpAvgLatency) {
                const latency = parseFloat(summary.httpAvgLatency);
                if (latency > 500) {
                    recommendations.push(`${name}: Latence élevée (${summary.httpAvgLatency}). Optimisez la configuration réseau.`);
                }
            }
            
            if (parseFloat(summary.overallSuccessRate) < 90) {
                recommendations.push(`${name}: Taux de réussite faible (${summary.overallSuccessRate}%). Vérifiez la disponibilité du service.`);
            }
        });
        
        return recommendations;
    }

    categorizeErrors(errors) {
        const categories = {};
        errors.forEach(error => {
            const category = error.includes('timeout') ? 'timeout' :
                           error.includes('connection') ? 'connection' :
                           error.includes('DNS') ? 'dns' : 'other';
            categories[category] = (categories[category] || 0) + 1;
        });
        return categories;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async run() {
        try {
            await this.initialize();
            await this.runTest();
            const summary = await this.generateReport();
            await this.monitor.stop();
            
            console.log('\n📈 RÉSUMÉ DU TEST DE LATENCE RÉSEAU:');
            console.log(`🎯 Cibles testées: ${summary.totalTargets}`);
            console.log(`📊 Score global: ${summary.globalMetrics.networkScore || 0}`);
            console.log(`⚡ Latence: ${summary.globalMetrics.latencyScore || 0}`);
            console.log(`✅ Fiabilité: ${summary.globalMetrics.reliabilityScore || 0}`);
            
            console.log('\n🔍 DÉTAILS PAR CIBLE:');
            Object.entries(summary.targetSummaries).forEach(([name, target]) => {
                console.log(`  ${name}:`);
                if (target.pingAvg) console.log(`    Ping: ${target.pingAvg} (${target.pingLoss} perte)`);
                if (target.httpAvgLatency) console.log(`    HTTP: ${target.httpAvgLatency} (P95: ${target.httpP95})`);
                if (target.jitter) console.log(`    Jitter: ${target.jitter}`);
                if (target.bandwidth) console.log(`    Bande passante: ${target.bandwidth}`);
                console.log(`    Succès global: ${target.overallSuccessRate}%`);
            });
            
            if (summary.recommendations && summary.recommendations.length > 0) {
                console.log('\n💡 RECOMMANDATIONS:');
                summary.recommendations.forEach(rec => console.log(`  - ${rec}`));
            }
            
            return summary;
        } catch (error) {
            console.error('❌ Échec du test:', error);
            throw error;
        }
    }
}

module.exports = NetworkLatencyTest;