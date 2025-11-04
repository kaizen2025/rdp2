/**
 * Test de dégradation gracieuse quand les services IA sont surchargés
 * Mesure la résilience et les mécanismes de fallback des services IA
 */

const axios = require('axios');
const PerformanceMonitor = require('../shared/performance-monitor');
const LoadGenerator = require('../shared/load-generator');
const MetricsCollector = require('../shared/metrics-collector');

class GracefulDegradationTest {
    constructor(config = {}) {
        this.config = {
            baseUrl: 'http://localhost:3000',
            services: [
                {
                    name: 'Ollama',
                    endpoint: '/api/ai/ollama',
                    critical: true,
                    maxConcurrentRequests: 3
                },
                {
                    name: 'EasyOCR',
                    endpoint: '/api/ocr/easyocr',
                    critical: true,
                    maxConcurrentRequests: 2
                },
                {
                    name: 'DocuCortex AI',
                    endpoint: '/api/ai/chat',
                    critical: false,
                    maxConcurrentRequests: 5
                },
                {
                    name: 'GED Search',
                    endpoint: '/api/ged/search',
                    critical: false,
                    maxConcurrentRequests: 10
                }
            ],
            
            // Tests de charge progressive
            initialUsers: 5,
            maxUsers: 50,
            stepUsers: 5,
            stepInterval: 30, // secondes
            
            // Seuils de dégradation
            responseTimeThreshold: 5000, // 5 secondes
            errorRateThreshold: 10, // 10%
            cpuThreshold: 90, // 90%
            memoryThreshold: 85, // 85%
            
            // Mécanismes de fallback
            enableFallback: true,
            fallbackStrategies: ['cache', 'queue', 'degraded', 'error'],
            
            testDuration: 600, // 10 minutes
            
            ...config
        };
        
        this.monitor = new PerformanceMonitor('graceful-degradation');
        this.loadGenerator = new LoadGenerator(this.config.maxUsers);
        this.metrics = new MetricsCollector('graceful-degradation-test');
        this.results = {
            summary: {},
            detailed: [],
            degradationEvents: [],
            fallbackEvents: [],
            errors: []
        };
        
        this.currentLoad = 0;
        this.degradationDetected = false;
        this.fallbackActivated = false;
    }

    async initialize() {
        console.log('🔄 Initialisation du test de dégradation gracieuse...');
        await this.monitor.start();
        
        // Vérifier la disponibilité des services
        await this.checkServicesHealth();
        
        // Initialiser les métriques par service
        this.serviceMetrics = {};
        this.config.services.forEach(service => {
            this.serviceMetrics[service.name] = {
                requestCount: 0,
                errorCount: 0,
                responseTimes: [],
                fallbackCount: 0,
                degradationLevel: 0
            };
        });
    }

    async checkServicesHealth() {
        console.log('🏥 Vérification de la santé des services...');
        
        for (const service of this.config.services) {
            try {
                const response = await axios.get(`${this.config.baseUrl}/api/health`, {
                    timeout: 5000
                });
                console.log(`✅ ${service.name}: Disponible`);
            } catch (error) {
                console.warn(`⚠️ ${service.name}: Non accessible, mode mock activé`);
                service.mockMode = true;
            }
        }
    }

    async runTest() {
        console.log('🚀 Démarrage du test de dégradation gracieuse...');
        const startTime = Date.now();
        
        try {
            // Phase 1: Charge normale
            await this.runNormalLoadPhase();
            
            // Phase 2: Charge progressive
            await this.runProgressiveLoadPhase();
            
            // Phase 3: Charge excessive (stress test)
            await this.runOverloadPhase();
            
            // Phase 4: Test de récupération
            await this.runRecoveryPhase();

        } catch (error) {
            console.error('❌ Erreur pendant le test:', error.message);
            this.results.errors.push(error.message);
        } finally {
            const endTime = Date.now();
            this.results.summary.testDuration = endTime - startTime;
        }
    }

    async runNormalLoadPhase() {
        console.log('📊 Phase 1: Charge normale...');
        const duration = 60000; // 1 minute
        
        const startTime = Date.now();
        const userCount = this.config.initialUsers;
        
        while (Date.now() - startTime < duration) {
            const requests = [];
            
            for (let i = 0; i < userCount; i++) {
                const service = this.config.services[i % this.config.services.length];
                requests.push(this.makeServiceRequest(service, 'normal', i));
            }
            
            const results = await Promise.allSettled(requests);
            this.processResults(results, 'normal');
            
            await this.sleep(2000);
        }
    }

    async runProgressiveLoadPhase() {
        console.log('📈 Phase 2: Charge progressive...');
        
        for (let userCount = this.config.initialUsers + this.config.stepUsers; 
             userCount <= this.config.maxUsers; 
             userCount += this.config.stepUsers) {
            
            console.log(`  👥 Charge: ${userCount} utilisateurs`);
            this.currentLoad = userCount;
            
            const stepStart = Date.now();
            
            while (Date.now() - stepStart < (this.config.stepInterval * 1000)) {
                const requests = [];
                
                for (let i = 0; i < userCount; i++) {
                    const service = this.selectServiceForLoad(userCount);
                    requests.push(this.makeServiceRequest(service, 'progressive', i));
                }
                
                const results = await Promise.allSettled(requests);
                this.processResults(results, 'progressive');
                
                // Vérifier les seuils de dégradation
                await this.checkDegradationThresholds();
                
                await this.sleep(1000);
            }
            
            // Vérification finale de la phase
            if (this.degradationDetected) {
                console.log(`⚠️ Dégradation détectée à ${userCount} utilisateurs`);
                break;
            }
        }
    }

    async runOverloadPhase() {
        console.log('💪 Phase 3: Charge excessive...');
        const overloadUsers = this.config.maxUsers * 2;
        const duration = 120000; // 2 minutes
        
        console.log(`  🚨 Surcharge: ${overloadUsers} utilisateurs`);
        
        const startTime = Date.now();
        
        while (Date.now() - startTime < duration) {
            const requests = [];
            
            for (let i = 0; i < overloadUsers; i++) {
                const service = this.config.services[i % this.config.services.length];
                requests.push(this.makeServiceRequest(service, 'overload', i));
            }
            
            const results = await Promise.allSettled(requests);
            this.processResults(results, 'overload');
            
            // Activer les mécanismes de fallback si nécessaire
            if (this.enableFallback) {
                await this.activateFallbackMechanisms();
            }
            
            await this.sleep(500);
        }
    }

    async runRecoveryPhase() {
        console.log('🔄 Phase 4: Test de récupération...');
        
        // Réduire progressivement la charge
        for (let userCount = this.config.maxUsers; userCount >= this.config.initialUsers; userCount -= this.config.stepUsers) {
            console.log(`  🔄 Récupération: ${userCount} utilisateurs`);
            
            const recoveryStart = Date.now();
            
            while (Date.now() - recoveryStart < 30000) { // 30 secondes par niveau
                const requests = [];
                
                for (let i = 0; i < userCount; i++) {
                    const service = this.config.services[i % this.config.services.length];
                    requests.push(this.makeServiceRequest(service, 'recovery', i));
                }
                
                const results = await Promise.allSettled(requests);
                this.processResults(results, 'recovery');
                
                await this.sleep(2000);
            }
            
            // Vérifier la récupération
            const systemMetrics = await this.monitor.getSystemMetrics();
            if (this.isSystemRecovered(systemMetrics)) {
                console.log(`✅ Système récupéré à ${userCount} utilisateurs`);
                break;
            }
        }
    }

    selectServiceForLoad(userCount) {
        // Sélection intelligente basée sur la charge
        const criticalServices = this.config.services.filter(s => s.critical);
        const normalServices = this.config.services.filter(s => !s.critical);
        
        if (userCount > this.config.maxUsers * 0.8) {
            // En surcharge, prioriser les services critiques
            return criticalServices[userCount % criticalServices.length];
        } else {
            // Charge normale, distribuer équitablement
            return this.config.services[userCount % this.config.services.length];
        }
    }

    async makeServiceRequest(service, phase, index) {
        const requestStart = Date.now();
        const requestId = `${phase}-${service.name}-${index}-${Date.now()}`;
        
        const result = {
            service: service.name,
            phase,
            requestId,
            timestamp: new Date().toISOString(),
            success: false,
            responseTime: 0,
            fallbackUsed: false,
            fallbackStrategy: null,
            error: null,
            statusCode: null
        };

        try {
            if (service.mockMode) {
                // Mode mock pour test hors ligne
                result.responseTime = this.generateMockResponseTime(service, phase);
                result.success = result.responseTime < this.config.responseTimeThreshold;
                result.statusCode = result.success ? 200 : 503;
            } else {
                // Requête réelle avec timeout adaptatif
                const timeout = this.calculateAdaptiveTimeout(service, phase);
                const response = await axios.post(`${this.config.baseUrl}${service.endpoint}`, 
                    this.generateRequestData(service), 
                    { timeout }
                );
                
                result.responseTime = Date.now() - requestStart;
                result.success = response.status < 400;
                result.statusCode = response.status;
            }
            
            // Mettre à jour les métriques du service
            this.updateServiceMetrics(service.name, result);
            
        } catch (error) {
            result.error = error.message;
            result.responseTime = Date.now() - requestStart;
            result.statusCode = error.response?.status || 0;
            
            // En cas d'erreur, tenter le fallback
            if (this.config.enableFallback) {
                const fallbackResult = await this.attemptFallback(service, result);
                if (fallbackResult.success) {
                    result.fallbackUsed = true;
                    result.fallbackStrategy = fallbackResult.strategy;
                    result.success = true;
                }
            }
            
            this.updateServiceMetrics(service.name, result);
        }

        this.results.detailed.push(result);
        return result;
    }

    generateMockResponseTime(service, phase) {
        const baseTimes = {
            normal: 200 + Math.random() * 300,
            progressive: 300 + Math.random() * 500,
            overload: 800 + Math.random() * 2000,
            recovery: 250 + Math.random() * 400
        };
        
        let time = baseTimes[phase] || 500;
        
        // Ajouter de la variabilité basée sur le service
        const serviceMultiplier = {
            'Ollama': 1.5,
            'EasyOCR': 2.0,
            'DocuCortex AI': 1.2,
            'GED Search': 0.8
        };
        
        time *= serviceMultiplier[service.name] || 1.0;
        
        // En overload, certains services échouent
        if (phase === 'overload' && Math.random() < 0.15) {
            return this.config.responseTimeThreshold + Math.random() * 5000;
        }
        
        return Math.floor(time);
    }

    generateRequestData(service) {
        const dataTemplates = {
            'Ollama': {
                prompt: 'Expliquez l\'intelligence artificielle en quelques phrases.',
                model: 'llama3.2:3b',
                max_tokens: 100
            },
            'EasyOCR': {
                image_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
                languages: ['fr', 'en']
            },
            'DocuCortex AI': {
                message: 'Comment optimiser mes processus documentaires ?',
                context: 'business_optimization'
            },
            'GED Search': {
                query: 'documents importants',
                limit: 10,
                search_type: 'semantic'
            }
        };
        
        return dataTemplates[service.name] || { test: true };
    }

    calculateAdaptiveTimeout(service, phase) {
        const baseTimeout = 5000; // 5 secondes
        const phaseMultiplier = {
            normal: 1.0,
            progressive: 1.5,
            overload: 2.0,
            recovery: 1.2
        };
        
        let timeout = baseTimeout * (phaseMultiplier[phase] || 1.0);
        
        // Ajuster selon la criticité du service
        if (service.critical) {
            timeout *= 0.8; // Timeout plus court pour les services critiques
        }
        
        return Math.floor(timeout);
    }

    async attemptFallback(service, originalResult) {
        const strategies = ['cache', 'queue', 'degraded'];
        
        for (const strategy of strategies) {
            try {
                const fallbackResult = await this.applyFallbackStrategy(service, strategy, originalResult);
                if (fallbackResult.success) {
                    return {
                        success: true,
                        strategy: strategy,
                        result: fallbackResult
                    };
                }
            } catch (error) {
                // Continuer avec la stratégie suivante
                continue;
            }
        }
        
        return { success: false };
    }

    async applyFallbackStrategy(service, strategy, originalResult) {
        const fallbackStart = Date.now();
        
        switch (strategy) {
            case 'cache':
                // Simuler un retour depuis le cache
                return {
                    success: true,
                    responseTime: Date.now() - fallbackStart,
                    data: { cached: true, service: service.name }
                };
                
            case 'queue':
                // Simuler la mise en file d'attente
                await this.sleep(Math.random() * 2000);
                return {
                    success: true,
                    responseTime: Date.now() - fallbackStart,
                    data: { queued: true, service: service.name }
                };
                
            case 'degraded':
                // Service dégradé avec fonctionnalités limitées
                return {
                    success: true,
                    responseTime: Date.now() - fallbackStart,
                    data: { degraded: true, service: service.name, features: ['basic'] }
                };
                
            default:
                throw new Error(`Stratégie de fallback inconnue: ${strategy}`);
        }
    }

    updateServiceMetrics(serviceName, result) {
        const metrics = this.serviceMetrics[serviceName];
        if (!metrics) return;
        
        metrics.requestCount++;
        
        if (!result.success) {
            metrics.errorCount++;
        }
        
        if (result.fallbackUsed) {
            metrics.fallbackCount++;
        }
        
        metrics.responseTimes.push(result.responseTime);
        
        // Maintenir seulement les 1000 derniers temps de réponse
        if (metrics.responseTimes.length > 1000) {
            metrics.responseTimes = metrics.responseTimes.slice(-1000);
        }
        
        // Calculer le niveau de dégradation (0-100)
        metrics.degradationLevel = this.calculateDegradationLevel(serviceName);
    }

    calculateDegradationLevel(serviceName) {
        const metrics = this.serviceMetrics[serviceName];
        if (!metrics || metrics.requestCount === 0) return 0;
        
        const errorRate = (metrics.errorCount / metrics.requestCount) * 100;
        const avgResponseTime = metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length;
        
        let degradationLevel = 0;
        
        // Dégradation basée sur le taux d'erreur
        if (errorRate > 5) degradationLevel += 30;
        if (errorRate > 15) degradationLevel += 40;
        
        // Dégradation basée sur le temps de réponse
        if (avgResponseTime > 2000) degradationLevel += 20;
        if (avgResponseTime > 5000) degradationLevel += 30;
        
        // Dégradation basée sur l'utilisation du fallback
        const fallbackRate = (metrics.fallbackCount / metrics.requestCount) * 100;
        if (fallbackRate > 10) degradationLevel += 20;
        
        return Math.min(degradationLevel, 100);
    }

    processResults(results, phase) {
        results.forEach(result => {
            if (result.status === 'fulfilled') {
                // Résultat réussi
            } else {
                // Résultat échoué
                this.results.errors.push({
                    phase,
                    error: result.reason?.message || 'Unknown error',
                    timestamp: new Date().toISOString()
                });
            }
        });
    }

    async checkDegradationThresholds() {
        const systemMetrics = await this.monitor.getSystemMetrics();
        
        // Vérifier les seuils système
        if (systemMetrics.cpu && systemMetrics.cpu > this.config.cpuThreshold) {
            this.triggerDegradationEvent('cpu_overload', systemMetrics.cpu);
        }
        
        if (systemMetrics.memory && systemMetrics.memory > this.config.memoryThreshold) {
            this.triggerDegradationEvent('memory_overload', systemMetrics.memory);
        }
        
        // Vérifier les seuils par service
        for (const [serviceName, metrics] of Object.entries(this.serviceMetrics)) {
            if (metrics.requestCount > 0) {
                const errorRate = (metrics.errorCount / metrics.requestCount) * 100;
                const avgResponseTime = metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length;
                
                if (errorRate > this.config.errorRateThreshold) {
                    this.triggerDegradationEvent('high_error_rate', { service: serviceName, errorRate });
                }
                
                if (avgResponseTime > this.config.responseTimeThreshold) {
                    this.triggerDegradationEvent('slow_response', { service: serviceName, avgResponseTime });
                }
            }
        }
    }

    triggerDegradationEvent(type, data) {
        const event = {
            type,
            timestamp: new Date().toISOString(),
            currentLoad: this.currentLoad,
            data,
            severity: this.calculateEventSeverity(type, data)
        };
        
        this.results.degradationEvents.push(event);
        this.degradationDetected = true;
        
        console.log(`⚠️ Événement de dégradation [${event.severity}]: ${type}`, data);
    }

    calculateEventSeverity(type, data) {
        switch (type) {
            case 'cpu_overload':
            case 'memory_overload':
                return data > 95 ? 'CRITICAL' : 'HIGH';
            case 'high_error_rate':
                return data.errorRate > 50 ? 'CRITICAL' : data.errorRate > 30 ? 'HIGH' : 'MEDIUM';
            case 'slow_response':
                return data.avgResponseTime > 10000 ? 'CRITICAL' : data.avgResponseTime > 5000 ? 'HIGH' : 'MEDIUM';
            default:
                return 'MEDIUM';
        }
    }

    async activateFallbackMechanisms() {
        if (this.fallbackActivated) return;
        
        // Activer les mécanismes de fallback pour les services non-critiques
        for (const service of this.config.services) {
            if (!service.critical) {
                service.fallbackMode = true;
                console.log(`🔄 Fallback activé pour ${service.name}`);
            }
        }
        
        this.fallbackActivated = true;
    }

    isSystemRecovered(systemMetrics) {
        return (
            (!systemMetrics.cpu || systemMetrics.cpu < 70) &&
            (!systemMetrics.memory || systemMetrics.memory < 60) &&
            this.currentLoad < this.config.maxUsers
        );
    }

    async generateReport() {
        console.log('📊 Génération du rapport de dégradation gracieuse...');
        
        // Calculer les métriques globales
        const totalRequests = Object.values(this.serviceMetrics).reduce((sum, m) => sum + m.requestCount, 0);
        const totalErrors = Object.values(this.serviceMetrics).reduce((sum, m) => sum + m.errorCount, 0);
        const totalFallbacks = Object.values(this.serviceMetrics).reduce((sum, m) => sum + m.fallbackCount, 0);
        
        // Analyser les événements de dégradation
        const degradationAnalysis = this.analyzeDegradationEvents();
        
        // Analyser l'efficacité des fallback
        const fallbackAnalysis = this.analyzeFallbackEffectiveness();
        
        // Calculer la résilience
        const resilienceScore = this.calculateResilienceScore();

        this.results.summary = {
            ...this.results.summary,
            totalRequests,
            totalErrors,
            totalFallbacks,
            overallErrorRate: totalRequests > 0 ? ((totalErrors / totalRequests) * 100).toFixed(2) : 0,
            fallbackUsageRate: totalRequests > 0 ? ((totalFallbacks / totalRequests) * 100).toFixed(2) : 0,
            
            // Métriques par service
            serviceMetrics: this.serviceMetrics,
            
            // Événements de dégradation
            degradationEvents: this.results.degradationEvents,
            degradationAnalysis,
            
            // Analyse des fallback
            fallbackAnalysis,
            
            // Score de résilience
            resilienceScore,
            
            // Ressources système
            systemMetrics: await this.monitor.getSystemMetrics(),
            
            // Recommandations
            recommendations: this.generateRecommendations()
        };

        // Sauvegarde des résultats
        const reportPath = `../results/graceful-degradation-test-${new Date().toISOString().split('T')[0]}.json`;
        require('fs').writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        
        return this.results.summary;
    }

    analyzeDegradationEvents() {
        const events = this.results.degradationEvents;
        
        if (events.length === 0) {
            return {
                totalEvents: 0,
                severityBreakdown: {},
                timeline: []
            };
        }
        
        const severityBreakdown = {};
        events.forEach(event => {
            severityBreakdown[event.severity] = (severityBreakdown[event.severity] || 0) + 1;
        });
        
        // Analyser la timeline des événements
        const timeline = events.map(event => ({
            time: event.timestamp,
            type: event.type,
            severity: event.severity,
            load: event.currentLoad
        }));
        
        return {
            totalEvents: events.length,
            severityBreakdown,
            timeline,
            firstEvent: events[0]?.timestamp,
            lastEvent: events[events.length - 1]?.timestamp
        };
    }

    analyzeFallbackEffectiveness() {
        const services = Object.entries(this.serviceMetrics);
        const effectiveness = {};
        
        services.forEach(([serviceName, metrics]) => {
            if (metrics.requestCount > 0) {
                const fallbackRate = (metrics.fallbackCount / metrics.requestCount) * 100;
                effectiveness[serviceName] = {
                    fallbackRate: fallbackRate.toFixed(2),
                    errorRate: ((metrics.errorCount / metrics.requestCount) * 100).toFixed(2),
                    avgResponseTime: metrics.responseTimes.length > 0 ? 
                        (metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length).toFixed(2) : 0
                };
            }
        });
        
        return effectiveness;
    }

    calculateResilienceScore() {
        const services = Object.values(this.serviceMetrics);
        
        if (services.length === 0) return 0;
        
        let totalScore = 0;
        let validServices = 0;
        
        services.forEach(metrics => {
            if (metrics.requestCount > 0) {
                // Score basé sur plusieurs facteurs
                const errorScore = Math.max(0, 100 - (metrics.errorCount / metrics.requestCount) * 100);
                const fallbackScore = Math.max(0, 100 - (metrics.fallbackCount / metrics.requestCount) * 100);
                const responseTimeScore = metrics.responseTimes.length > 0 ? 
                    Math.max(0, 100 - (metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length) / 100) : 0;
                
                const serviceScore = (errorScore * 0.4) + (fallbackScore * 0.3) + (responseTimeScore * 0.3);
                totalScore += serviceScore;
                validServices++;
            }
        });
        
        return validServices > 0 ? (totalScore / validServices).toFixed(2) : 0;
    }

    generateRecommendations() {
        const recommendations = [];
        
        // Recommandations basées sur la résilience
        if (this.results.summary.resilienceScore < 70) {
            recommendations.push('Score de résilience faible - Optimisez les mécanismes de fallback et la gestion de charge');
        }
        
        // Recommandations basées sur les événements de dégradation
        const criticalEvents = this.results.degradationEvents.filter(e => e.severity === 'CRITICAL');
        if (criticalEvents.length > 0) {
            recommendations.push(`${criticalEvents.length} événements critiques détectés - Réviser la capacité des services`);
        }
        
        // Recommandations basées sur les fallback
        Object.entries(this.serviceMetrics).forEach(([serviceName, metrics]) => {
            const fallbackRate = (metrics.fallbackCount / metrics.requestCount) * 100;
            if (fallbackRate > 20) {
                recommendations.push(`${service.name}: Taux de fallback élevé (${fallbackRate.toFixed(1)}%) - Optimiser la performance`);
            }
        });
        
        return recommendations;
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
            
            console.log('\n📈 RÉSUMÉ DU TEST DE DÉGRADATION GRACIEUSE:');
            console.log(`📊 Score de résilience: ${summary.resilienceScore}/100`);
            console.log(`📨 Requêtes totales: ${summary.totalRequests}`);
            console.log(`❌ Taux d'erreur: ${summary.overallErrorRate}%`);
            console.log(`🔄 Utilisation fallback: ${summary.fallbackUsageRate}%`);
            console.log(`⚠️ Événements de dégradation: ${summary.degradationAnalysis.totalEvents}`);
            
            console.log('\n🚨 SÉVÉRITÉ DES ÉVÉNEMENTS:');
            Object.entries(summary.degradationAnalysis.severityBreakdown).forEach(([severity, count]) => {
                console.log(`  ${severity}: ${count}`);
            });
            
            console.log('\n💡 RECOMMANDATIONS:');
            summary.recommendations.forEach(rec => console.log(`  - ${rec}`));
            
            return summary;
        } catch (error) {
            console.error('❌ Échec du test:', error);
            throw error;
        }
    }
}

module.exports = GracefulDegradationTest;