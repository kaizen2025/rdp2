/**
 * Test de performance DocuCortex IA (chat, recherche, traitement) sous charge
 * Mesure les temps de réponse des différents modules IA de DocuCortex
 */

const axios = require('axios');
const PerformanceMonitor = require('../shared/performance-monitor');
const LoadGenerator = require('../shared/load-generator');
const MetricsCollector = require('../shared/metrics-collector');

class DocuCortexAILoadTest {
    constructor(config = {}) {
        this.config = {
            baseUrl: 'http://localhost:3000', // Backend DocuCortex
            aiEndpoint: '/api/ai',
            chatEndpoint: '/api/ai/chat',
            searchEndpoint: '/api/ai/search',
            processEndpoint: '/api/ai/process',
            
            concurrentUsers: 8,
            requestsPerUser: 15,
            rampUpTime: 45,
            testDuration: 240, // 4 minutes
            
            // Paramètres des tests
            maxTokens: 150,
            temperature: 0.7,
            
            ...config
        };
        
        this.monitor = new PerformanceMonitor('docucortex-ai');
        this.loadGenerator = new LoadGenerator(this.config.concurrentUsers);
        this.metrics = new MetricsCollector('docucortex-ai-load-test');
        this.results = {
            summary: {},
            detailed: [],
            errors: [],
            modules: {
                chat: [],
                search: [],
                process: []
            }
        };
    }

    async initialize() {
        console.log('🔄 Initialisation du test DocuCortex IA...');
        await this.monitor.start();
        
        // Vérifier la connexion au backend
        try {
            const healthResponse = await axios.get(`${this.config.baseUrl}/api/health`, {
                timeout: 10000
            });
            console.log('✅ Backend DocuCortex connecté:', healthResponse.data);
        } catch (error) {
            console.warn('⚠️ Backend DocuCortex non accessible, utilisation du mode mock');
            this.useMockMode = true;
        }
        
        // Préparer les données de test
        this.testData = {
            chatPrompts: [
                "Explique-moi les avantages de l'intelligence artificielle dans l'entreprise",
                "Comment fonctionne l'OCR pour la dématérialisation ?",
                "Quels sont les bénéfices de la GED pour les PME ?",
                "Comment optimiser les processus documentaires ?",
                "Quelle est l'importance de la cybersécurité en entreprise ?"
            ],
            searchQueries: [
                "documents comptables 2024",
                "factures fournisseurs",
                "contrats de travail",
                "politiques de sécurité",
                "rapports financiers"
            ],
            processTypes: [
                "document_classification",
                "text_extraction",
                "sentiment_analysis",
                "content_summarization",
                "entity_extraction"
            ]
        };
    }

    async runTest() {
        console.log('🚀 Démarrage du test de charge DocuCortex IA...');
        const startTime = Date.now();
        
        try {
            // Test de charge progressive
            await this.runProgressiveLoadTest();
            
            // Test de charge continue par module
            await this.runModuleLoadTests();
            
            // Test de stress avec toutes les fonctionnalités
            await this.runStressTest();

        } catch (error) {
            console.error('❌ Erreur pendant le test:', error.message);
            this.results.errors.push(error.message);
        } finally {
            const endTime = Date.now();
            this.results.summary.testDuration = endTime - startTime;
        }
    }

    async runProgressiveLoadTest() {
        console.log('📈 Test de charge progressive...');
        
        await this.loadGenerator.startProgressiveLoad(
            this.config.rampUpTime,
            async (userId, requestId) => {
                const module = ['chat', 'search', 'process'][requestId % 3];
                return await this.makeAIRequest(module, userId, requestId);
            }
        );
    }

    async runModuleLoadTests() {
        console.log('🔧 Tests par module...');
        
        // Test chat IA
        await this.runModuleTest('chat', 'chatPrompts', this.config.chatEndpoint);
        
        // Test recherche IA
        await this.runModuleTest('search', 'searchQueries', this.config.searchEndpoint);
        
        // Test traitement IA
        await this.runModuleTest('process', 'processTypes', this.config.processEndpoint);
    }

    async runModuleTest(module, dataType, endpoint) {
        console.log(`🎯 Test du module ${module}...`);
        const testDuration = 60000; // 1 minute par module
        
        const testStart = Date.now();
        const modulePromises = [];
        
        while (Date.now() - testStart < testDuration) {
            const promises = [];
            
            for (let i = 0; i < this.config.concurrentUsers; i++) {
                const userData = this.testData[dataType][i % this.testData[dataType].length];
                promises.push(this.makeAIRequest(module, `module-${i}`, Date.now(), userData));
            }
            
            const results = await Promise.allSettled(promises);
            results.forEach(result => {
                if (result.status === 'fulfilled') {
                    this.results.modules[module].push(result.value);
                }
            });
            
            // Petite pause entre les tours
            await this.sleep(2000);
        }
    }

    async runStressTest() {
        console.log('💪 Test de stress - Toutes fonctionnalités...');
        const stressDuration = 60000; // 1 minute
        
        const stressStart = Date.now();
        
        while (Date.now() - stressStart < stressDuration) {
            const stressPromises = [];
            
            // Lancer des requêtes sur tous les modules simultanément
            for (let i = 0; i < this.config.concurrentUsers * 2; i++) {
                const module = ['chat', 'search', 'process'][i % 3];
                const userData = this.selectRandomData(module);
                stressPromises.push(
                    this.makeAIRequest(module, `stress-${i}`, Date.now(), userData)
                );
            }
            
            const results = await Promise.allSettled(stressPromises);
            results.forEach(result => {
                if (result.status === 'fulfilled') {
                    this.results.detailed.push({
                        ...result.value,
                        stressTest: true
                    });
                }
            });
            
            await this.sleep(1000);
        }
    }

    selectRandomData(module) {
        switch (module) {
            case 'chat':
                return this.testData.chatPrompts[Math.floor(Math.random() * this.testData.chatPrompts.length)];
            case 'search':
                return this.testData.searchQueries[Math.floor(Math.random() * this.testData.searchQueries.length)];
            case 'process':
                return this.testData.processTypes[Math.floor(Math.random() * this.testData.processTypes.length)];
            default:
                return '';
        }
    }

    async makeAIRequest(module, userId, requestId, customData = null) {
        const requestStart = Date.now();
        let result = {
            module,
            userId,
            requestId,
            timestamp: new Date().toISOString(),
            success: false,
            responseTime: 0,
            error: null,
            tokens: 0,
            tokensPerSecond: 0
        };

        try {
            const requestData = this.buildRequestData(module, customData);
            const endpoint = this.getModuleEndpoint(module);
            
            if (this.useMockMode) {
                // Mode mock pour les tests sans backend
                result.responseTime = this.generateMockResponseTime(module);
                result.success = true;
                result.tokens = Math.floor(Math.random() * 100) + 50;
                result.tokensPerSecond = result.tokens / (result.responseTime / 1000);
                result.response = this.generateMockResponse(module, customData);
            } else {
                // Requête réelle au backend
                const response = await axios.post(`${this.config.baseUrl}${endpoint}`, requestData, {
                    timeout: 30000
                });

                result.responseTime = Date.now() - requestStart;
                result.success = true;
                result.tokens = response.data.tokens || 0;
                result.tokensPerSecond = result.tokens / (result.responseTime / 1000);
                result.response = response.data.response || response.data.result;
            }

        } catch (error) {
            result.error = error.message;
            result.responseTime = Date.now() - requestStart;
            console.error(`❌ Erreur ${module} (${userId}/${requestId}):`, error.message);
        }

        this.results.detailed.push(result);
        return result;
    }

    buildRequestData(module, customData) {
        const baseData = {
            max_tokens: this.config.maxTokens,
            temperature: this.config.temperature
        };

        switch (module) {
            case 'chat':
                return {
                    ...baseData,
                    message: customData || "Explique-moi l'importance de l'automatisation en entreprise.",
                    context: "business_automation"
                };
            case 'search':
                return {
                    ...baseData,
                    query: customData || "documents重要性",
                    search_type: "semantic",
                    max_results: 10
                };
            case 'process':
                return {
                    ...baseData,
                    document_type: customData || "invoice",
                    processing_type: "text_extraction",
                    output_format: "structured"
                };
            default:
                return baseData;
        }
    }

    getModuleEndpoint(module) {
        switch (module) {
            case 'chat': return this.config.chatEndpoint;
            case 'search': return this.config.searchEndpoint;
            case 'process': return this.config.processEndpoint;
            default: return this.config.aiEndpoint;
        }
    }

    generateMockResponseTime(module) {
        const baseTimes = {
            chat: 800 + Math.random() * 400, // 800-1200ms
            search: 500 + Math.random() * 300, // 500-800ms
            process: 1200 + Math.random() * 600 // 1200-1800ms
        };
        return Math.floor(baseTimes[module] || 1000);
    }

    generateMockResponse(module, customData) {
        const responses = {
            chat: `Voici une explication sur ${customData || 'le sujet'} : L'intelligence artificielle transforme radicalement les processus métier en automatisant les tâches répétitives et en améliorant l'efficacité opérationnelle. Les entreprises peuvent désormais traiter des volumes de documents importants, extraire des informations clés et prendre des décisions basées sur des données en temps réel.`,
            search: `Résultats pour "${customData || 'la requête'}" : 15 documents trouvés, pertinence moyenne 85%, temps de traitement 0.3s.`,
            process: `Traitement de document type "${customData || 'document'}" : Extraction réussie, 3 entités détectées, confiance 92%, format JSON généré.`
        };
        return responses[module] || 'Réponse générée par IA.';
    }

    async generateReport() {
        console.log('📊 Génération du rapport DocuCortex IA...');
        
        const successfulRequests = this.results.detailed.filter(r => r.success);
        const failedRequests = this.results.detailed.filter(r => !r.success);
        
        // Métriques globales
        this.results.summary = {
            ...this.results.summary,
            totalRequests: this.results.detailed.length,
            successfulRequests: successfulRequests.length,
            failedRequests: failedRequests.length,
            successRate: (successfulRequests.length / this.results.detailed.length * 100).toFixed(2),
            
            // Temps de réponse globaux
            avgResponseTime: this.calculateAverage(successfulRequests, 'responseTime'),
            p50ResponseTime: this.calculatePercentile(successfulRequests, 'responseTime', 50),
            p95ResponseTime: this.calculatePercentile(successfulRequests, 'responseTime', 95),
            p99ResponseTime: this.calculatePercentile(successfulRequests, 'responseTime', 99),
            
            // Métriques par module
            moduleMetrics: this.calculateModuleMetrics(),
            
            // Throughput
            requestsPerSecond: successfulRequests.length / (this.results.summary.testDuration / 1000),
            avgTokensPerSecond: this.calculateAverage(successfulRequests, 'tokensPerSecond'),
            
            // Stress test metrics
            stressMetrics: this.calculateStressMetrics(),
            
            // Erreurs
            errorTypes: this.categorizeErrors(failedRequests),
            
            // Ressources système
            systemMetrics: await this.monitor.getSystemMetrics()
        };

        // Sauvegarde des résultats
        const reportPath = `../results/docucortex-ai-load-test-${new Date().toISOString().split('T')[0]}.json`;
        require('fs').writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        
        return this.results.summary;
    }

    calculateModuleMetrics() {
        const modules = {};
        
        ['chat', 'search', 'process'].forEach(module => {
            const moduleRequests = this.results.detailed.filter(r => r.module === module && r.success);
            const allModuleRequests = this.results.detailed.filter(r => r.module === module);
            
            if (moduleRequests.length > 0) {
                modules[module] = {
                    totalRequests: allModuleRequests.length,
                    successfulRequests: moduleRequests.length,
                    successRate: (moduleRequests.length / allModuleRequests.length * 100).toFixed(2),
                    avgResponseTime: this.calculateAverage(moduleRequests, 'responseTime'),
                    p95ResponseTime: this.calculatePercentile(moduleRequests, 'responseTime', 95),
                    requestsPerSecond: moduleRequests.length / (this.results.summary.testDuration / 1000),
                    avgTokensPerSecond: this.calculateAverage(moduleRequests, 'tokensPerSecond')
                };
            }
        });
        
        return modules;
    }

    calculateStressMetrics() {
        const stressRequests = this.results.detailed.filter(r => r.stressTest && r.success);
        const allStressRequests = this.results.detailed.filter(r => r.stressTest);
        
        if (stressRequests.length > 0) {
            return {
                totalStressRequests: allStressRequests.length,
                successfulStressRequests: stressRequests.length,
                stressSuccessRate: (stressRequests.length / allStressRequests.length * 100).toFixed(2),
                avgStressResponseTime: this.calculateAverage(stressRequests, 'responseTime'),
                stressThroughput: stressRequests.length / 60 // par minute
            };
        }
        
        return {};
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
            const category = error.error && error.error.includes('timeout') ? 'timeout' :
                           error.error && error.error.includes('connection') ? 'connection' :
                           error.error && error.error.includes('memory') ? 'memory' : 'other';
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
            
            console.log('\n📈 RÉSUMÉ DU TEST DOCUCORTEX IA:');
            console.log(`✓ Requêtes réussies: ${summary.successfulRequests}/${summary.totalRequests} (${summary.successRate}%)`);
            console.log(`⚡ Temps de réponse moyen: ${summary.avgResponseTime}ms`);
            console.log(`📊 P95: ${summary.p95ResponseTime}ms, P99: ${summary.p99ResponseTime}ms`);
            console.log(`🚀 Débit global: ${summary.requestsPerSecond.toFixed(2)} req/s`);
            console.log(`🎯 Tokens/sec: ${summary.avgTokensPerSecond.toFixed(2)}`);
            
            console.log('\n🔧 MÉTRIQUES PAR MODULE:');
            Object.entries(summary.moduleMetrics).forEach(([module, metrics]) => {
                console.log(`  ${module}: ${metrics.avgResponseTime}ms, ${metrics.requestsPerSecond.toFixed(2)} req/s, ${metrics.successRate}%`);
            });
            
            if (summary.stressMetrics && summary.stressMetrics.totalStressRequests > 0) {
                console.log('\n💪 TEST DE STRESS:');
                console.log(`  Succès: ${summary.stressMetrics.stressSuccessRate}%`);
                console.log(`  Temps moyen: ${summary.stressMetrics.avgStressResponseTime}ms`);
                console.log(`  Débit: ${summary.stressMetrics.stressThroughput.toFixed(2)} req/min`);
            }
            
            return summary;
        } catch (error) {
            console.error('❌ Échec du test:', error);
            throw error;
        }
    }
}

module.exports = DocuCortexAILoadTest;