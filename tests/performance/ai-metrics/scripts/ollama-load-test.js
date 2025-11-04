/**
 * Test de performance Ollama avec llama3.2:3b sous charge
 * Mesure les temps de réponse, throughput et utilisation des ressources
 */

const axios = require('axios');
const PerformanceMonitor = require('../shared/performance-monitor');
const LoadGenerator = require('../shared/load-generator');
const MetricsCollector = require('../shared/metrics-collector');

class OllamaLoadTest {
    constructor(config = {}) {
        this.config = {
            baseUrl: 'http://localhost:11434',
            model: 'llama3.2:3b',
            concurrentUsers: 5,
            requestsPerUser: 20,
            rampUpTime: 30, // secondes
            testDuration: 300, // 5 minutes
            prompt: "Explique-moi en quelques phrases ce qu'est l'intelligence artificielle.",
            ...config
        };
        
        this.monitor = new PerformanceMonitor('ollama');
        this.loadGenerator = new LoadGenerator(this.config.concurrentUsers);
        this.metrics = new MetricsCollector('ollama-load-test');
        this.results = {
            summary: {},
            detailed: [],
            errors: []
        };
    }

    async initialize() {
        console.log('🔄 Initialisation du test Ollama...');
        await this.monitor.start();
        
        // Vérifier la connexion Ollama
        try {
            const response = await axios.get(`${this.config.baseUrl}/api/version`);
            console.log('✅ Ollama connecté:', response.data);
        } catch (error) {
            throw new Error(`❌ Impossible de se connecter à Ollama: ${error.message}`);
        }
    }

    async runTest() {
        console.log('🚀 Démarrage du test de charge Ollama...');
        const startTime = Date.now();
        
        try {
            // Génération de charge progressive
            await this.loadGenerator.startProgressiveLoad(
                this.config.rampUpTime,
                async (userId, requestId) => {
                    return await this.makeOllamaRequest(userId, requestId);
                }
            );

            // Test de charge continue
            await this.loadGenerator.startContinuousLoad(
                this.config.testDuration,
                async () => {
                    return await this.makeOllamaRequest('continuous', Date.now());
                }
            );

        } catch (error) {
            console.error('❌ Erreur pendant le test:', error.message);
            this.results.errors.push(error.message);
        } finally {
            const endTime = Date.now();
            this.results.summary.testDuration = endTime - startTime;
        }
    }

    async makeOllamaRequest(userId, requestId) {
        const requestStart = Date.now();
        let result = {
            userId,
            requestId,
            timestamp: new Date().toISOString(),
            success: false,
            responseTime: 0,
            tokensPerSecond: 0,
            error: null
        };

        try {
            // Appel API Ollama
            const response = await axios.post(`${this.config.baseUrl}/api/generate`, {
                model: this.config.model,
                prompt: this.config.prompt,
                stream: false,
                options: {
                    temperature: 0.7,
                    top_p: 0.9,
                    max_tokens: 100
                }
            }, {
                timeout: 30000
            });

            const requestEnd = Date.now();
            result.responseTime = requestEnd - requestStart;
            result.success = true;
            result.tokensPerSecond = response.data.eval_count / (requestEnd - requestStart) * 1000;
            result.tokens = response.data.eval_count;
            result.response = response.data.response;

        } catch (error) {
            result.error = error.message;
            result.responseTime = Date.now() - requestStart;
            console.error(`❌ Erreur requête Ollama (${userId}/${requestId}):`, error.message);
        }

        this.results.detailed.push(result);
        return result;
    }

    async generateReport() {
        console.log('📊 Génération du rapport de performance...');
        
        const successfulRequests = this.results.detailed.filter(r => r.success);
        const failedRequests = this.results.detailed.filter(r => !r.success);
        
        // Métriques de base
        this.results.summary = {
            ...this.results.summary,
            totalRequests: this.results.detailed.length,
            successfulRequests: successfulRequests.length,
            failedRequests: failedRequests.length,
            successRate: (successfulRequests.length / this.results.detailed.length * 100).toFixed(2),
            
            // Temps de réponse
            avgResponseTime: this.calculateAverage(successfulRequests, 'responseTime'),
            p50ResponseTime: this.calculatePercentile(successfulRequests, 'responseTime', 50),
            p95ResponseTime: this.calculatePercentile(successfulRequests, 'responseTime', 95),
            p99ResponseTime: this.calculatePercentile(successfulRequests, 'responseTime', 99),
            maxResponseTime: Math.max(...successfulRequests.map(r => r.responseTime)),
            minResponseTime: Math.min(...successfulRequests.map(r => r.responseTime)),
            
            // Throughput
            requestsPerSecond: successfulRequests.length / (this.results.summary.testDuration / 1000),
            avgTokensPerSecond: this.calculateAverage(successfulRequests, 'tokensPerSecond'),
            
            // Erreurs
            errorTypes: this.categorizeErrors(failedRequests),
            
            // Ressources système
            systemMetrics: await this.monitor.getSystemMetrics()
        };

        // Sauvegarde des résultats
        const reportPath = `../results/ollama-load-test-${new Date().toISOString().split('T')[0]}.json`;
        require('fs').writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        
        return this.results.summary;
    }

    calculateAverage(data, field) {
        if (data.length === 0) return 0;
        return (data.reduce((sum, item) => sum + item[field], 0) / data.length).toFixed(2);
    }

    calculatePercentile(data, field, percentile) {
        if (data.length === 0) return 0;
        const sorted = data.map(item => item[field]).sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[index];
    }

    categorizeErrors(errors) {
        const categories = {};
        errors.forEach(error => {
            const category = error.error.includes('timeout') ? 'timeout' :
                           error.error.includes('connection') ? 'connection' :
                           error.error.includes('memory') ? 'memory' : 'other';
            categories[category] = (categories[category] || 0) + 1;
        });
        return categories;
    }

    async run() {
        try {
            await this.initialize();
            await this.runTest();
            const summary = await this.generateReport();
            await this.monitor.stop();
            
            console.log('\n📈 RÉSUMÉ DU TEST OLLAMA:');
            console.log(`✓ Requêtes réussies: ${summary.successfulRequests}/${summary.totalRequests} (${summary.successRate}%)`);
            console.log(`⚡ Temps de réponse moyen: ${summary.avgResponseTime}ms`);
            console.log(`📊 P95: ${summary.p95ResponseTime}ms, P99: ${summary.p99ResponseTime}ms`);
            console.log(`🚀 Débit: ${summary.requestsPerSecond.toFixed(2)} req/s`);
            console.log(`🎯 Tokens/sec: ${summary.avgTokensPerSecond.toFixed(2)}`);
            
            return summary;
        } catch (error) {
            console.error('❌ Échec du test:', error);
            throw error;
        }
    }
}

module.exports = OllamaLoadTest;