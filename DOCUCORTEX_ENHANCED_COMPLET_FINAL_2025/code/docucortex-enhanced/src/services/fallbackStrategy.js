// src/services/fallbackStrategy.js - STRATÉGIES DE SECOURS WORKFLOW
// Gestion intelligente des stratégies de fallback et de récupération

import EventEmitter from 'events';
import circuitBreakerRegistry from './circuitBreaker';

class FallbackStrategy extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Stratégies de fallback disponibles
            strategies: {
                cache_first: {
                    name: 'Cache First',
                    description: 'Utiliser le cache en priorité, puis le service',
                    priority: 1,
                    enabled: true
                },
                circuit_breaker: {
                    name: 'Circuit Breaker',
                    description: 'Utiliser circuit breaker pour protection',
                    priority: 2,
                    enabled: true
                },
                retry_with_backoff: {
                    name: 'Retry with Backoff',
                    description: 'Recommencer avec backoff exponentiel',
                    priority: 3,
                    enabled: true
                },
                graceful_degradation: {
                    name: 'Graceful Degradation',
                    description: 'Réduire les fonctionnalités en cas de problème',
                    priority: 4,
                    enabled: true
                },
                cached_response: {
                    name: 'Cached Response',
                    description: 'Réponse en cache statique',
                    priority: 5,
                    enabled: true
                },
                static_fallback: {
                    name: 'Static Fallback',
                    description: 'Réponse statique par défaut',
                    priority: 6,
                    enabled: true
                },
                alternative_service: {
                    name: 'Alternative Service',
                    description: 'Utiliser un service alternatif',
                    priority: 7,
                    enabled: true
                },
                queue_and_retry: {
                    name: 'Queue and Retry',
                    description: 'Mettre en file et réessayer plus tard',
                    priority: 8,
                    enabled: true
                }
            },
            
            // Configuration par défaut
            defaultConfig: {
                maxRetries: config.maxRetries || 3,
                retryDelay: config.retryDelay || 1000,
                maxCacheAge: config.maxCacheAge || 300000, // 5 minutes
                circuitBreakerThreshold: config.circuitBreakerThreshold || 5,
                timeout: config.timeout || 30000, // 30 secondes
                ...config.defaultConfig
            },
            
            // Configuration du cache
            cache: {
                enabled: config.cacheEnabled !== false,
                ttl: config.cacheTtl || 300000, // 5 minutes
                maxSize: config.cacheMaxSize || 1000,
                storage: config.cacheStorage || 'memory', // 'memory', 'localStorage', 'sessionStorage'
                ...config.cache
            },
            
            // Configuration des queues
            queue: {
                enabled: config.queueEnabled !== false,
                maxSize: config.queueMaxSize || 10000,
                retryInterval: config.queueRetryInterval || 60000, // 1 minute
                maxRetries: config.queueMaxRetries || 5,
                ...config.queue
            },
            
            // Monitoring et alertes
            monitoring: {
                enabled: config.monitoringEnabled !== false,
                alertThreshold: config.alertThreshold || 0.8, // 80% de fallbacks
                timeWindow: config.monitoringTimeWindow || 300000, // 5 minutes
                ...config.monitoring
            },
            
            ...config
        };

        // État interne
        this.fallbackCache = new Map();
        this.fallbackQueue = [];
        this.activeOperations = new Map();
        this.strategyStats = new Map();
        this.performanceMetrics = [];
        
        // Initialiser les statistiques
        this.initializeStats();
        
        // Démarrer les services de maintenance
        this.startMaintenanceServices();
    }

    /**
     * Exécuter une opération avec stratégies de fallback
     */
    async executeWithFallback(operation, options = {}) {
        const operationId = this.generateOperationId();
        
        const context = {
            id: operationId,
            operation,
            options: { ...this.config.defaultConfig, ...options },
            startTime: Date.now(),
            strategies: [],
            finalResult: null,
            error: null
        };

        try {
            this.registerOperation(context);
            
            // Déterminer les stratégies à utiliser
            const strategies = this.selectStrategies(context.options);
            
            // Exécuter avec chaque stratégie en fallback
            for (const strategy of strategies) {
                try {
                    const result = await this.executeWithStrategy(strategy, operation, context);
                    context.finalResult = result;
                    context.strategies.push({
                        strategy: strategy.name,
                        success: true,
                        duration: Date.now() - context.startTime
                    });
                    
                    // Succès, sortir de la boucle
                    break;
                    
                } catch (error) {
                    context.strategies.push({
                        strategy: strategy.name,
                        success: false,
                        error: error.message,
                        duration: Date.now() - context.startTime
                    });
                    
                    context.error = error;
                    
                    // Continuer avec la stratégie suivante
                    continue;
                }
            }
            
            if (!context.finalResult && context.error) {
                throw context.error;
            }
            
            // Enregistrer le succès
            this.recordSuccess(context);
            
            return context.finalResult;
            
        } catch (error) {
            this.recordFailure(context, error);
            throw error;
        } finally {
            this.unregisterOperation(context.id);
        }
    }

    /**
     * Exécuter avec une stratégie spécifique
     */
    async executeWithStrategy(strategy, operation, context) {
        const { id, options } = context;
        
        switch (strategy.name) {
            case 'cache_first':
                return await this.executeCacheFirst(operation, context);
                
            case 'circuit_breaker':
                return await this.executeCircuitBreaker(operation, context);
                
            case 'retry_with_backoff':
                return await this.executeRetryWithBackoff(operation, context);
                
            case 'graceful_degradation':
                return await this.executeGracefulDegradation(operation, context);
                
            case 'cached_response':
                return await this.executeCachedResponse(operation, context);
                
            case 'static_fallback':
                return await this.executeStaticFallback(operation, context);
                
            case 'alternative_service':
                return await this.executeAlternativeService(operation, context);
                
            case 'queue_and_retry':
                return await this.executeQueueAndRetry(operation, context);
                
            default:
                throw new Error(`Stratégie de fallback non supportée: ${strategy.name}`);
        }
    }

    // 🎯 STRATÉGIES DE FALLBACK

    /**
     * Stratégie Cache First
     */
    async executeCacheFirst(operation, context) {
        const { options } = context;
        
        // Essayer le cache d'abord
        const cacheKey = this.generateCacheKey(operation, options);
        const cached = this.getFromCache(cacheKey);
        
        if (cached && !this.isCacheExpired(cached)) {
            this.emit('fallback-cache-hit', {
                operationId: context.id,
                strategy: 'cache_first',
                cacheKey
            });
            
            return cached.data;
        }
        
        // Cache missed, essayer le service
        try {
            const result = await operation(options);
            
            // Stocker en cache si c'est un succès
            this.cacheResult(cacheKey, result, options.maxCacheAge);
            
            return result;
            
        } catch (error) {
            // En cas d'échec, essayer le fallback statique
            throw error;
        }
    }

    /**
     * Stratégie Circuit Breaker
     */
    async executeCircuitBreaker(operation, context) {
        const { options } = context;
        const serviceName = options.serviceName || 'fallback_service';
        
        // Obtenir ou créer le circuit breaker
        const breaker = circuitBreakerRegistry.getBreaker(serviceName, {
            failureThreshold: options.circuitBreakerThreshold || 5,
            timeout: options.timeout || 30000
        });
        
        // Exécuter via le circuit breaker
        return await breaker.execute(() => operation(options));
    }

    /**
     * Stratégie Retry with Backoff
     */
    async executeRetryWithBackoff(operation, context) {
        const { options } = context;
        const maxRetries = options.maxRetries || this.config.defaultConfig.maxRetries;
        let delay = options.retryDelay || this.config.defaultConfig.retryDelay;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const result = await operation(options);
                return result;
                
            } catch (error) {
                if (attempt === maxRetries) {
                    throw error;
                }
                
                // Backoff exponentiel avec jitter
                const jitter = Math.random() * 0.1 * delay;
                await this.sleep(delay + jitter);
                
                delay *= 2; // Doubler le délai
                
                this.emit('retry-attempt', {
                    operationId: context.id,
                    attempt: attempt + 1,
                    maxRetries,
                    delay,
                    error: error.message
                });
            }
        }
    }

    /**
     * Stratégie Graceful Degradation
     */
    async executeGracefulDegradation(operation, context) {
        const { options } = context;
        
        try {
            // Essayer l'opération complète
            return await operation({
                ...options,
                degradation: false
            });
            
        } catch (error) {
            this.emit('degradation-triggered', {
                operationId: context.id,
                error: error.message,
                originalOptions: options
            });
            
            // Exécuter une version dégradée
            const degradedOptions = {
                ...options,
                degradation: true,
                features: this.reduceFeatures(options.features || [])
            };
            
            try {
                return await operation(degradedOptions);
            } catch (degradedError) {
                // Même la version dégradée a échoué, utiliser le fallback statique
                throw degradedError;
            }
        }
    }

    /**
     * Stratégie Cached Response
     */
    async executeCachedResponse(operation, context) {
        const { options } = context;
        const cacheKey = this.generateCacheKey(operation, options);
        
        // Chercher une réponse en cache
        const cached = this.fallbackCache.get(cacheKey);
        
        if (cached && !this.isCacheExpired(cached)) {
            this.emit('cached-response-used', {
                operationId: context.id,
                cacheKey,
                age: Date.now() - cached.timestamp
            });
            
            return cached.data;
        }
        
        // Pas de cache, essayer l'opération
        try {
            const result = await operation(options);
            
            // Mettre en cache
            this.fallbackCache.set(cacheKey, {
                data: result,
                timestamp: Date.now(),
                expiresAt: Date.now() + this.config.cache.ttl
            });
            
            return result;
            
        } catch (error) {
            // Si pas de cache et échec, retourner une réponse par défaut
            return this.getDefaultResponse(options);
        }
    }

    /**
     * Stratégie Static Fallback
     */
    async executeStaticFallback(operation, context) {
        const { options } = context;
        
        try {
            // Essayer l'opération normale
            return await operation(options);
            
        } catch (error) {
            this.emit('static-fallback-used', {
                operationId: context.id,
                error: error.message,
                operationType: options.type || 'unknown'
            });
            
            // Retourner une réponse statique
            return this.getStaticFallbackResponse(options);
        }
    }

    /**
     * Stratégie Alternative Service
     */
    async executeAlternativeService(operation, context) {
        const { options } = context;
        const primaryService = options.serviceUrl;
        const alternativeServices = options.alternativeServices || [];
        
        // Essayer le service principal d'abord
        try {
            return await operation({
                ...options,
                serviceUrl: primaryService
            });
            
        } catch (primaryError) {
            // Essayer chaque service alternatif
            for (const altService of alternativeServices) {
                try {
                    this.emit('alternative-service-attempt', {
                        operationId: context.id,
                        service: altService.url,
                        originalService: primaryService
                    });
                    
                    const result = await operation({
                        ...options,
                        serviceUrl: altService.url,
                        headers: { ...options.headers, ...altService.headers }
                    });
                    
                    this.emit('alternative-service-success', {
                        operationId: context.id,
                        service: altService.url
                    });
                    
                    return result;
                    
                } catch (alternativeError) {
                    this.emit('alternative-service-failure', {
                        operationId: context.id,
                        service: altService.url,
                        error: alternativeError.message
                    });
                    
                    continue; // Essayer le suivant
                }
            }
            
            // Tous les services ont échoué
            throw primaryError;
        }
    }

    /**
     * Stratégie Queue and Retry
     */
    async executeQueueAndRetry(operation, context) {
        const { options } = context;
        
        try {
            // Essayer immédiatement
            return await operation(options);
            
        } catch (error) {
            // Mettre en file pour réessai
            const queueItem = {
                id: this.generateQueueItemId(),
                operation,
                options,
                attempts: 1,
                maxAttempts: this.config.queue.maxRetries,
                createdAt: Date.now(),
                nextRetryAt: Date.now() + this.config.queue.retryInterval
            };
            
            this.fallbackQueue.push(queueItem);
            
            // Traiter la file d'attente
            this.processQueue();
            
            // Retourner une réponse immédiate ou attendre
            if (options.immediateResponse) {
                return this.getImmediateResponse(options);
            } else {
                // Retourner une promise qui sera résolue plus tard
                return new Promise((resolve, reject) => {
                    queueItem.resolve = resolve;
                    queueItem.reject = reject;
                });
            }
        }
    }

    // 📊 SÉLECTION DE STRATÉGIES

    /**
     * Sélectionner les stratégies à utiliser
     */
    selectStrategies(options = {}) {
        const enabledStrategies = Object.entries(this.config.strategies)
            .filter(([_, config]) => config.enabled)
            .map(([name, config]) => ({
                name,
                priority: config.priority,
                description: config.description
            }))
            .sort((a, b) => a.priority - b.priority);

        // Filtrer selon les préférences utilisateur
        if (options.preferredStrategies) {
            const preferred = options.preferredStrategies;
            return enabledStrategies.filter(strategy => 
                preferred.includes(strategy.name)
            );
        }

        // Filtrer selon le type d'opération
        if (options.operationType) {
            return this.getStrategiesForOperationType(options.operationType);
        }

        return enabledStrategies;
    }

    /**
     * Obtenir les stratégies pour un type d'opération
     */
    getStrategiesForOperationType(operationType) {
        const strategies = Object.entries(this.config.strategies)
            .filter(([_, config]) => config.enabled)
            .map(([name, config]) => ({
                name,
                priority: config.priority,
                description: config.description
            }));

        // Ajuster les priorités selon le type d'opération
        switch (operationType) {
            case 'read':
                // Priorité au cache pour les lectures
                return strategies.sort((a, b) => {
                    if (a.name === 'cache_first' || a.name === 'cached_response') return -1;
                    if (b.name === 'cache_first' || b.name === 'cached_response') return 1;
                    return a.priority - b.priority;
                });
                
            case 'write':
                // Priorité à retry pour les écritures
                return strategies.sort((a, b) => {
                    if (a.name === 'retry_with_backoff') return -1;
                    if (b.name === 'retry_with_backoff') return 1;
                    return a.priority - b.priority;
                });
                
            case 'critical':
                // Priorité au circuit breaker pour les opérations critiques
                return strategies.sort((a, b) => {
                    if (a.name === 'circuit_breaker') return -1;
                    if (b.name === 'circuit_breaker') return 1;
                    return a.priority - b.priority;
                });
                
            default:
                return strategies.sort((a, b) => a.priority - b.priority);
        }
    }

    // 💾 GESTION DU CACHE

    /**
     * Générer une clé de cache
     */
    generateCacheKey(operation, options) {
        const keyData = {
            operation: operation.name || 'anonymous',
            params: options.params || {},
            type: options.operationType || 'default'
        };
        
        return `cache_${JSON.stringify(keyData)}`;
    }

    /**
     * Obtenir depuis le cache
     */
    getFromCache(key) {
        return this.fallbackCache.get(key);
    }

    /**
     * Mettre en cache
     */
    cacheResult(key, data, ttl = null) {
        if (!this.config.cache.enabled) return;
        
        const expiresAt = ttl || this.config.cache.ttl;
        
        // Vérifier la taille du cache
        if (this.fallbackCache.size >= this.config.cache.maxSize) {
            // Supprimer l'entrée la plus ancienne
            const oldestKey = this.fallbackCache.keys().next().value;
            this.fallbackCache.delete(oldestKey);
        }
        
        this.fallbackCache.set(key, {
            data,
            timestamp: Date.now(),
            expiresAt: Date.now() + expiresAt
        });
    }

    /**
     * Vérifier si le cache est expiré
     */
    isCacheExpired(cached) {
        return Date.now() > cached.expiresAt;
    }

    // 📋 GESTION DE LA FILE D'ATTENTE

    /**
     * Générer un ID d'élément de file
     */
    generateQueueItemId() {
        return `QUEUE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Traiter la file d'attente
     */
    processQueue() {
        const now = Date.now();
        
        // Traiter les éléments prêts
        for (let i = this.fallbackQueue.length - 1; i >= 0; i--) {
            const item = this.fallbackQueue[i];
            
            if (now >= item.nextRetryAt && item.attempts <= item.maxAttempts) {
                this.fallbackQueue.splice(i, 1);
                this.processQueueItem(item);
            }
        }
        
        // Programmer le prochain traitement
        setTimeout(() => this.processQueue(), this.config.queue.retryInterval);
    }

    /**
     * Traiter un élément de la file
     */
    async processQueueItem(item) {
        try {
            this.emit('queue-retry', {
                queueItemId: item.id,
                attempts: item.attempts,
                maxAttempts: item.maxAttempts
            });
            
            const result = await item.operation(item.options);
            
            // Succès - résoudre la promise
            if (item.resolve) {
                item.resolve(result);
            }
            
            this.emit('queue-success', {
                queueItemId: item.id,
                attempts: item.attempts
            });
            
        } catch (error) {
            item.attempts++;
            
            if (item.attempts > item.maxAttempts) {
                // Échec final - rejeter la promise
                if (item.reject) {
                    item.reject(error);
                }
                
                this.emit('queue-failure', {
                    queueItemId: item.id,
                    attempts: item.attempts,
                    error: error.message
                });
            } else {
                // Remettre en file
                item.nextRetryAt = Date.now() + (this.config.queue.retryInterval * item.attempts);
                this.fallbackQueue.push(item);
            }
        }
    }

    // 🛠️ OUTILS ET UTILITAIRES

    /**
     * Réduire les fonctionnalités pour la dégradation
     */
    reduceFeatures(features) {
        const priority = {
            essential: 1,
            important: 2,
            nice_to_have: 3,
            optional: 4
        };
        
        return features
            .sort((a, b) => priority[a.priority] - priority[b.priority])
            .slice(0, Math.ceil(features.length / 2)); // Garder seulement la moitié
    }

    /**
     * Obtenir une réponse par défaut
     */
    getDefaultResponse(options) {
        const type = options.operationType || 'generic';
        
        const defaultResponses = {
            read: { data: [], count: 0, timestamp: Date.now() },
            write: { success: true, id: null, timestamp: Date.now() },
            update: { success: true, timestamp: Date.now() },
            delete: { success: true, timestamp: Date.now() },
            search: { results: [], total: 0, timestamp: Date.now() },
            generic: { success: false, message: 'Service unavailable', timestamp: Date.now() }
        };
        
        return defaultResponses[type] || defaultResponses.generic;
    }

    /**
     * Obtenir une réponse statique de fallback
     */
    getStaticFallbackResponse(options) {
        const fallbackResponses = {
            user_data: {
                id: 'fallback_user',
                name: 'Utilisateur Indisponible',
                email: 'service@unavailable.com',
                status: 'unavailable'
            },
            document_data: {
                id: 'fallback_doc',
                title: 'Document Indisponible',
                status: 'unavailable'
            },
            loan_data: {
                loans: [],
                total: 0,
                status: 'service_unavailable'
            },
            analytics_data: {
                metrics: {},
                status: 'unavailable',
                timestamp: Date.now()
            }
        };
        
        return fallbackResponses[options.fallbackType] || {
            success: false,
            message: 'Service temporarily unavailable',
            fallback: true,
            timestamp: Date.now()
        };
    }

    /**
     * Obtenir une réponse immédiate
     */
    getImmediateResponse(options) {
        return {
            success: true,
            queued: true,
            message: 'Request queued for processing',
            queuedAt: Date.now(),
            estimatedProcessing: Date.now() + this.config.queue.retryInterval
        };
    }

    /**
     * Initialiser les statistiques
     */
    initializeStats() {
        for (const strategyName of Object.keys(this.config.strategies)) {
            this.strategyStats.set(strategyName, {
                name: strategyName,
                total: 0,
                successes: 0,
                failures: 0,
                averageDuration: 0,
                lastUsed: null
            });
        }
    }

    /**
     * Enregistrer un succès
     */
    recordSuccess(context) {
        const duration = Date.now() - context.startTime;
        
        for (const strategy of context.strategies) {
            if (strategy.success) {
                const stats = this.strategyStats.get(strategy.strategy);
                if (stats) {
                    stats.total++;
                    stats.successes++;
                    stats.lastUsed = new Date().toISOString();
                    
                    // Mettre à jour la durée moyenne
                    const alpha = 0.1;
                    stats.averageDuration = stats.averageDuration === 0 ? 
                        strategy.duration : 
                        (stats.averageDuration * (1 - alpha) + strategy.duration * alpha);
                }
                break;
            }
        }
        
        this.emit('fallback-success', {
            operationId: context.id,
            strategies: context.strategies,
            duration
        });
    }

    /**
     * Enregistrer un échec
     */
    recordFailure(context, error) {
        for (const strategy of context.strategies) {
            const stats = this.strategyStats.get(strategy.strategy);
            if (stats) {
                stats.total++;
                stats.failures++;
                stats.lastUsed = new Date().toISOString();
            }
        }
        
        this.emit('fallback-failure', {
            operationId: context.id,
            strategies: context.strategies,
            error: error.message
        });
    }

    /**
     * Enregistrer une opération active
     */
    registerOperation(context) {
        this.activeOperations.set(context.id, {
            ...context,
            registeredAt: Date.now()
        });
    }

    /**
     * Désenregistrer une opération
     */
    unregisterOperation(operationId) {
        this.activeOperations.delete(operationId);
    }

    // 📊 MÉTRIQUES ET STATISTIQUES

    /**
     * Obtenir les statistiques
     */
    getStatistics() {
        const strategies = {};
        for (const [name, stats] of this.strategyStats.entries()) {
            strategies[name] = {
                ...stats,
                successRate: stats.total > 0 ? stats.successes / stats.total : 0
            };
        }
        
        return {
            strategies,
            activeOperations: this.activeOperations.size,
            queueSize: this.fallbackQueue.length,
            cacheSize: this.fallbackCache.size,
            totalCacheHitRate: this.calculateCacheHitRate(),
            recentActivity: this.performanceMetrics.slice(-20)
        };
    }

    /**
     * Calculer le taux de réussite du cache
     */
    calculateCacheHitRate() {
        // Simulation - en production, track would be more sophisticated
        return 0.75; // 75%
    }

    // 🛠️ MAINTENANCE

    /**
     * Démarrer les services de maintenance
     */
    startMaintenanceServices() {
        // Nettoyage périodique du cache
        setInterval(() => {
            this.cleanupExpiredCache();
        }, 60000); // 1 minute
        
        // Traitement de la file d'attente
        setInterval(() => {
            this.processQueue();
        }, this.config.queue.retryInterval);
    }

    /**
     * Nettoyer le cache expiré
     */
    cleanupExpiredCache() {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [key, cached] of this.fallbackCache.entries()) {
            if (now > cached.expiresAt) {
                this.fallbackCache.delete(key);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            this.emit('cache-cleanup', {
                cleanedEntries: cleaned,
                remainingSize: this.fallbackCache.size
            });
        }
    }

    /**
     * Attendre (sleep)
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Générer un ID d'opération
     */
    generateOperationId() {
        return `FALLBACK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Obtenir la configuration
     */
    getConfig() {
        return this.config;
    }

    /**
     * Mettre à jour la configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * Vider le cache
     */
    clearCache() {
        this.fallbackCache.clear();
        this.emit('cache-cleared');
    }

    /**
     * Vider la file d'attente
     */
    clearQueue() {
        const cleared = this.fallbackQueue.length;
        this.fallbackQueue = [];
        
        this.emit('queue-cleared', { clearedItems: cleared });
        return cleared;
    }

    /**
     * Arrêter les services
     */
    shutdown() {
        this.clearCache();
        this.clearQueue();
        this.emit('shutdown');
    }
}

// Export singleton
const fallbackStrategy = new FallbackStrategy();

export default fallbackStrategy;
export { FallbackStrategy };