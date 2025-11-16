// src/services/circuitBreaker.js - CIRCUIT BREAKER POUR PROTECTION DES SERVICES
// Protection intelligente des services avec fallbacks et métriques

import EventEmitter from 'events';

class CircuitBreaker extends EventEmitter {
    constructor(serviceName, options = {}) {
        super();
        
        this.serviceName = serviceName;
        
        this.config = {
            // Seuils de déclenchement
            failureThreshold: options.failureThreshold || 5,
            successThreshold: options.successThreshold || 3,
            timeout: options.timeout || 60000, // 1 minute
            
            // Fenêtre de temps pour les métriques
            monitoringPeriod: options.monitoringPeriod || 60000, // 1 minute
            
            // État initial
            initialState: options.initialState || 'CLOSED', // CLOSED, OPEN, HALF_OPEN
            
            // Configuration des fallbacks
            fallback: {
                enabled: options.fallbackEnabled !== false,
                strategy: options.fallbackStrategy || 'fail_fast', // 'fail_fast', 'cached_response', 'alternative_service'
                cacheTimeout: options.cacheTimeout || 300000, // 5 minutes
                maxCacheSize: options.maxCacheSize || 100,
                ...options.fallback
            },
            
            // Métriques et monitoring
            metrics: {
                enabled: options.metricsEnabled !== false,
                storeHistory: options.storeHistory !== false,
                maxHistorySize: options.maxHistorySize || 1000,
                alertThresholds: {
                    highFailureRate: options.highFailureRate || 0.8,
                    slowResponse: options.slowResponse || 5000 // 5 secondes
                }
            },
            
            ...options
        };

        // État du circuit breaker
        this.state = this.config.initialState;
        this.stateChangedAt = Date.now();
        this.failureCount = 0;
        this.successCount = 0;
        this.lastFailureTime = 0;
        this.lastSuccessTime = 0;
        this.requestCount = 0;

        // Cache pour les fallbacks
        this.cache = new Map();
        this.cacheMetadata = new Map();

        // Métriques et historique
        this.metrics = {
            requests: 0,
            successes: 0,
            failures: 0,
            timeouts: 0,
            averageResponseTime: 0,
            minResponseTime: Infinity,
            maxResponseTime: 0,
            requestsByState: { CLOSED: 0, OPEN: 0, HALF_OPEN: 0 }
        };
        
        this.history = [];
        this.performanceMetrics = [];

        // Timer pour l'état HALF_OPEN
        this.halfOpenTimer = null;

        // Services alternatifs
        this.alternativeServices = options.alternativeServices || [];
        this.currentAlternativeIndex = 0;

        // Initialiser
        this.initialize();
    }

    /**
     * Exécuter une opération protégée par le circuit breaker
     */
    async execute(operation, options = {}) {
        const requestId = this.generateRequestId();
        const startTime = Date.now();
        
        const context = {
            requestId,
            serviceName: this.serviceName,
            state: this.state,
            timestamp: startTime,
            options
        };

        try {
            // Vérifier l'état du circuit
            this.checkCircuitState();
            
            // Mettre à jour les métriques
            this.recordRequest(context);
            
            // Exécuter l'opération avec timeout
            const result = await this.executeWithTimeout(operation, options, context);
            
            // Succès
            this.recordSuccess(context, Date.now() - startTime, result);
            
            return result;
            
        } catch (error) {
            // Échec
            const duration = Date.now() - startTime;
            await this.recordFailure(context, duration, error);
            
            // Gérer selon la stratégie de fallback
            return await this.handleFailure(operation, context, error);
        }
    }

    /**
     * Vérifier l'état du circuit
     */
    checkCircuitState() {
        switch (this.state) {
            case 'OPEN':
                // Vérifier si on peut passer en HALF_OPEN
                if (this.shouldAttemptReset()) {
                    this.transitionToHalfOpen();
                } else {
                    throw new Error(`Circuit breaker is OPEN for ${this.serviceName}`);
                }
                break;
                
            case 'HALF_OPEN':
                // Une seule requête autorisée en HALF_OPEN
                // Le timer s'en charge
                break;
                
            case 'CLOSED':
                // Normal operation
                break;
        }
    }

    /**
     * Exécuter avec timeout
     */
    async executeWithTimeout(operation, options, context) {
        const timeout = options.timeout || this.config.timeout;
        
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Operation timeout after ${timeout}ms`));
            }, timeout);
        });
        
        const operationPromise = operation(context);
        
        try {
            const result = await Promise.race([operationPromise, timeoutPromise]);
            
            // Enregistrer le timeout si nécessaire
            if (result === undefined && timeoutPromise) {
                throw new Error(`Operation timeout after ${timeout}ms`);
            }
            
            return result;
            
        } catch (error) {
            if (error.message.includes('timeout')) {
                this.metrics.timeouts++;
                error.type = 'timeout';
            }
            throw error;
        }
    }

    /**
     * Enregistrer un succès
     */
    recordSuccess(context, duration, result) {
        this.metrics.requests++;
        this.metrics.successes++;
        this.requestCount++;
        this.successCount++;
        this.lastSuccessTime = Date.now();
        
        // Mettre à jour les temps de réponse
        this.updateResponseTimeMetrics(duration);
        
        // Changer d'état selon le contexte
        if (this.state === 'HALF_OPEN') {
            this.successCount++;
            
            if (this.successCount >= this.config.successThreshold) {
                this.transitionToClosed();
            }
        } else if (this.state === 'CLOSED') {
            // Reset du compteur d'échecs en cas de succès
            if (this.failureCount > 0) {
                this.failureCount = Math.max(0, this.failureCount - 1);
            }
        }
        
        // Enregistrer dans l'historique
        this.addToHistory({
            type: 'success',
            requestId: context.requestId,
            duration,
            state: this.state,
            timestamp: new Date().toISOString()
        });
        
        // Émettre un événement
        this.emit('success', {
            serviceName: this.serviceName,
            requestId: context.requestId,
            duration,
            state: this.state
        });
    }

    /**
     * Enregistrer un échec
     */
    async recordFailure(context, duration, error) {
        this.metrics.requests++;
        this.metrics.failures++;
        this.requestCount++;
        this.failureCount++;
        this.lastFailureTime = Date.now();
        
        // Mettre à jour les temps de réponse même pour les échecs
        this.updateResponseTimeMetrics(duration);
        
        // Changer d'état selon le contexte
        if (this.state === 'HALF_OPEN') {
            // En HALF_OPEN, un seul échec suffit pour retourner en OPEN
            this.transitionToOpen('Failure in HALF_OPEN state');
        } else if (this.state === 'CLOSED') {
            // Vérifier si on doit ouvrir le circuit
            if (this.failureCount >= this.config.failureThreshold) {
                this.transitionToOpen('Failure threshold exceeded');
            }
        }
        
        // Enregistrer dans l'historique
        this.addToHistory({
            type: 'failure',
            requestId: context.requestId,
            duration,
            error: error.message,
            errorType: error.type || 'unknown',
            state: this.state,
            timestamp: new Date().toISOString()
        });
        
        // Émettre un événement
        this.emit('failure', {
            serviceName: this.serviceName,
            requestId: context.requestId,
            error,
            duration,
            state: this.state,
            failureCount: this.failureCount
        });
        
        // Vérifier les alertes
        this.checkAlertThresholds();
    }

    /**
     * Gérer un échec avec stratégie de fallback
     */
    async handleFailure(operation, context, error) {
        if (!this.config.fallback.enabled) {
            throw error;
        }
        
        switch (this.config.fallback.strategy) {
            case 'cached_response':
                return await this.getCachedResponse(context, error);
                
            case 'alternative_service':
                return await this.tryAlternativeService(operation, context, error);
                
            case 'fail_fast':
            default:
                throw error;
        }
    }

    /**
     * Obtenir une réponse en cache
     */
    async getCachedResponse(context, originalError) {
        // Chercher une réponse en cache pour ce type de requête
        const cacheKey = this.generateCacheKey(context.options);
        const cached = this.cache.get(cacheKey);
        
        if (cached && !this.isCacheExpired(cached)) {
            this.emit('fallback-cache-hit', {
                serviceName: this.serviceName,
                requestId: context.requestId,
                cacheKey
            });
            
            return cached.data;
        }
        
        // Pas de cache disponible
        this.emit('fallback-cache-miss', {
            serviceName: this.serviceName,
            requestId: context.requestId,
            cacheKey,
            originalError
        });
        
        throw originalError;
    }

    /**
     * Essayer un service alternatif
     */
    async tryAlternativeService(operation, context, originalError) {
        if (this.alternativeServices.length === 0) {
            throw originalError;
        }
        
        // Essayer chaque service alternatif
        for (let i = 0; i < this.alternativeServices.length; i++) {
            const serviceIndex = (this.currentAlternativeIndex + i) % this.alternativeServices.length;
            const alternative = this.alternativeServices[serviceIndex];
            
            try {
                this.emit('fallback-alternative-attempt', {
                    serviceName: this.serviceName,
                    requestId: context.requestId,
                    alternative: alternative.name
                });
                
                // Exécuter l'opération avec le service alternatif
                const result = await this.executeAlternativeService(operation, alternative, context);
                
                // Succès avec le service alternatif
                this.currentAlternativeIndex = serviceIndex;
                
                this.emit('fallback-alternative-success', {
                    serviceName: this.serviceName,
                    requestId: context.requestId,
                    alternative: alternative.name
                });
                
                return result;
                
            } catch (alternativeError) {
                this.emit('fallback-alternative-failure', {
                    serviceName: this.serviceName,
                    requestId: context.requestId,
                    alternative: alternative.name,
                    error: alternativeError
                });
                
                // Continuer avec le service suivant
                continue;
            }
        }
        
        // Tous les services alternatifs ont échoué
        this.emit('fallback-all-alternatives-failed', {
            serviceName: this.serviceName,
            requestId: context.requestId,
            originalError
        });
        
        throw originalError;
    }

    /**
     * Exécuter avec un service alternatif
     */
    async executeAlternativeService(operation, alternative, context) {
        // Adapter l'opération pour le service alternatif
        const adaptedOperation = this.adaptOperationForAlternative(operation, alternative, context);
        
        // Exécuter avec un timeout spécifique au service alternatif
        const timeout = alternative.timeout || this.config.timeout;
        
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Alternative service timeout after ${timeout}ms`));
            }, timeout);
        });
        
        const operationPromise = adaptedOperation();
        
        return await Promise.race([operationPromise, timeoutPromise]);
    }

    /**
     * Adapter une opération pour un service alternatif
     */
    adaptOperationForAlternative(operation, alternative, context) {
        return async () => {
            // Ici, on adapterait l'opération selon le service alternatif
            // Par exemple, changer l'endpoint, les paramètres, etc.
            
            const adaptedContext = {
                ...context,
                serviceName: alternative.name,
                url: alternative.url,
                headers: { ...alternative.headers, ...context.options.headers }
            };
            
            return operation(adaptedContext);
        };
    }

    // 🔄 TRANSITIONS D'ÉTAT

    /**
     * Transition vers l'état OPEN
     */
    transitionToOpen(reason) {
        const previousState = this.state;
        this.state = 'OPEN';
        this.stateChangedAt = Date.now();
        
        // Programmer la tentative de reset
        this.scheduleHalfOpenAttempt();
        
        this.emit('state-change', {
            serviceName: this.serviceName,
            from: previousState,
            to: 'OPEN',
            reason,
            failureCount: this.failureCount
        });
        
        console.warn(`Circuit breaker OPEN for ${this.serviceName}: ${reason}`);
    }

    /**
     * Transition vers l'état HALF_OPEN
     */
    transitionToHalfOpen() {
        const previousState = this.state;
        this.state = 'HALF_OPEN';
        this.stateChangedAt = Date.now();
        this.successCount = 0;
        
        // Programmer le retour automatique en OPEN si nécessaire
        this.halfOpenTimer = setTimeout(() => {
            if (this.state === 'HALF_OPEN') {
                this.transitionToOpen('Half-open timeout');
            }
        }, this.config.timeout);
        
        this.emit('state-change', {
            serviceName: this.serviceName,
            from: previousState,
            to: 'HALF_OPEN'
        });
        
        console.info(`Circuit breaker HALF_OPEN for ${this.serviceName}`);
    }

    /**
     * Transition vers l'état CLOSED
     */
    transitionToClosed() {
        const previousState = this.state;
        this.state = 'CLOSED';
        this.stateChangedAt = Date.now();
        this.failureCount = 0;
        this.successCount = 0;
        
        // Nettoyer le timer HALF_OPEN
        if (this.halfOpenTimer) {
            clearTimeout(this.halfOpenTimer);
            this.halfOpenTimer = null;
        }
        
        this.emit('state-change', {
            serviceName: this.serviceName,
            from: previousState,
            to: 'CLOSED'
        });
        
        console.info(`Circuit breaker CLOSED for ${this.serviceName}`);
    }

    /**
     * Programmer une tentative de passage en HALF_OPEN
     */
    scheduleHalfOpenAttempt() {
        setTimeout(() => {
            if (this.state === 'OPEN') {
                this.transitionToHalfOpen();
            }
        }, this.config.timeout);
    }

    /**
     * Vérifier si on doit tenter de réinitialiser
     */
    shouldAttemptReset() {
        return Date.now() - this.stateChangedAt >= this.config.timeout;
    }

    // 📊 MÉTRIQUES ET MONITORING

    /**
     * Enregistrer une requête
     */
    recordRequest(context) {
        this.metrics.requests++;
        this.metrics.requestsByState[this.state]++;
        
        // Ajouter aux métriques de performance
        this.performanceMetrics.push({
            timestamp: Date.now(),
            state: this.state,
            requestId: context.requestId
        });
        
        // Nettoyer les métriques anciennes
        this.cleanupOldMetrics();
    }

    /**
     * Mettre à jour les métriques de temps de réponse
     */
    updateResponseTimeMetrics(duration) {
        // Moyenne mobile
        const alpha = 0.1; // Facteur de lissage
        this.metrics.averageResponseTime = 
            this.metrics.averageResponseTime === 0 ? 
            duration : 
            (this.metrics.averageResponseTime * (1 - alpha) + duration * alpha);
        
        // Min/Max
        this.metrics.minResponseTime = Math.min(this.metrics.minResponseTime, duration);
        this.metrics.maxResponseTime = Math.max(this.metrics.maxResponseTime, duration);
    }

    /**
     * Vérifier les seuils d'alerte
     */
    checkAlertThresholds() {
        if (!this.config.metrics.enabled) return;
        
        const { alertThresholds } = this.config.metrics;
        const recentHistory = this.history.slice(-20);
        
        if (recentHistory.length < 5) return;
        
        // Taux d'échec élevé
        const failures = recentHistory.filter(h => h.type === 'failure').length;
        const failureRate = failures / recentHistory.length;
        
        if (failureRate >= alertThresholds.highFailureRate) {
            this.emit('high-failure-rate', {
                serviceName: this.serviceName,
                failureRate,
                threshold: alertThresholds.highFailureRate,
                recentHistory: recentHistory.length
            });
        }
        
        // Temps de réponse lent
        const avgResponseTime = this.metrics.averageResponseTime;
        if (avgResponseTime >= alertThresholds.slowResponse) {
            this.emit('slow-response-time', {
                serviceName: this.serviceName,
                averageResponseTime: avgResponseTime,
                threshold: alertThresholds.slowResponse
            });
        }
    }

    /**
     * Ajouter à l'historique
     */
    addToHistory(entry) {
        if (this.config.metrics.storeHistory) {
            this.history.push(entry);
            
            // Limiter la taille
            if (this.history.length > this.config.metrics.maxHistorySize) {
                this.history = this.history.slice(-Math.floor(this.config.metrics.maxHistorySize / 2));
            }
        }
        
        // Ajouter à l'historique de performance
        this.performanceMetrics.push({
            timestamp: Date.now(),
            ...entry
        });
        
        // Nettoyer l'historique ancien
        const cutoff = Date.now() - this.config.monitoringPeriod;
        this.performanceMetrics = this.performanceMetrics.filter(
            metric => metric.timestamp > cutoff
        );
    }

    /**
     * Nettoyer les anciennes métriques
     */
    cleanupOldMetrics() {
        const cutoff = Date.now() - this.config.monitoringPeriod;
        
        // Nettoyer les métriques de performance
        this.performanceMetrics = this.performanceMetrics.filter(
            metric => metric.timestamp > cutoff
        );
        
        // Nettoyer le cache expiré
        for (const [key, cached] of this.cache.entries()) {
            if (this.isCacheExpired(cached)) {
                this.cache.delete(key);
                this.cacheMetadata.delete(key);
            }
        }
    }

    /**
     * Obtenir les métriques du service
     */
    getMetrics() {
        const totalRequests = this.metrics.requests;
        const successRate = totalRequests > 0 ? (this.metrics.successes / totalRequests) : 0;
        const failureRate = totalRequests > 0 ? (this.metrics.failures / totalRequests) : 0;
        const timeoutRate = totalRequests > 0 ? (this.metrics.timeouts / totalRequests) : 0;
        
        return {
            serviceName: this.serviceName,
            state: this.state,
            stateDuration: Date.now() - this.stateChangedAt,
            metrics: {
                totalRequests,
                successes: this.metrics.successes,
                failures: this.metrics.failures,
                timeouts: this.metrics.timeouts,
                successRate: Math.round(successRate * 100) / 100,
                failureRate: Math.round(failureRate * 100) / 100,
                timeoutRate: Math.round(timeoutRate * 100) / 100,
                averageResponseTime: Math.round(this.metrics.averageResponseTime),
                minResponseTime: this.metrics.minResponseTime === Infinity ? 0 : this.metrics.minResponseTime,
                maxResponseTime: this.metrics.maxResponseTime,
                requestsByState: { ...this.metrics.requestsByState }
            },
            recentHistory: this.history.slice(-10),
            performanceTrend: this.getPerformanceTrend(),
            cacheStats: this.getCacheStats(),
            alternativeServices: this.alternativeServices.length,
            currentAlternativeIndex: this.currentAlternativeIndex
        };
    }

    /**
     * Obtenir la tendance de performance
     */
    getPerformanceTrend() {
        const recent = this.performanceMetrics.slice(-20);
        
        if (recent.length < 2) return 'insufficient_data';
        
        const stateChanges = recent.filter(m => m.type === 'state-change');
        const successes = recent.filter(m => m.type === 'success');
        const failures = recent.filter(m => m.type === 'failure');
        
        const recentFailureRate = failures.length / recent.length;
        const previousFailureRate = this.history.slice(-40, -20).filter(h => h.type === 'failure').length / 20;
        
        if (recentFailureRate > previousFailureRate * 1.2) {
            return 'degrading';
        } else if (recentFailureRate < previousFailureRate * 0.8) {
            return 'improving';
        } else {
            return 'stable';
        }
    }

    /**
     * Obtenir les statistiques du cache
     */
    getCacheStats() {
        let hitCount = 0;
        let missCount = 0;
        
        for (const metadata of this.cacheMetadata.values()) {
            if (metadata.hit) hitCount++;
            else missCount++;
        }
        
        const total = hitCount + missCount;
        const hitRate = total > 0 ? hitCount / total : 0;
        
        return {
            size: this.cache.size,
            maxSize: this.config.fallback.maxCacheSize,
            hitRate: Math.round(hitRate * 100) / 100,
            hitCount,
            missCount
        };
    }

    // 💾 CACHE ET FALLBACKS

    /**
     * Stocker en cache
     */
    cacheResponse(key, data, ttl = null) {
        if (this.cache.size >= this.config.fallback.maxCacheSize) {
            // Supprimer l'entrée la plus ancienne
            const oldestKey = this.cacheMetadata.keys().next().value;
            this.cache.delete(oldestKey);
            this.cacheMetadata.delete(oldestKey);
        }
        
        const expiresAt = ttl || this.config.fallback.cacheTimeout;
        const metadata = {
            timestamp: Date.now(),
            expiresAt: Date.now() + expiresAt,
            hit: false
        };
        
        this.cache.set(key, { data, metadata });
        this.cacheMetadata.set(key, metadata);
    }

    /**
     * Vérifier si le cache est expiré
     */
    isCacheExpired(cached) {
        return Date.now() > cached.metadata.expiresAt;
    }

    /**
     * Générer une clé de cache
     */
    generateCacheKey(options) {
        // Créer une clé simple basée sur les paramètres importants
        const keyData = {
            service: this.serviceName,
            ...options
        };
        
        return `cache_${this.serviceName}_${JSON.stringify(keyData)}`;
    }

    // 🔍 ÉTAT ET CONTRÔLE

    /**
     * Obtenir l'état actuel
     */
    getState() {
        return {
            serviceName: this.serviceName,
            state: this.state,
            stateChangedAt: this.stateChangedAt,
            stateDuration: Date.now() - this.stateChangedAt,
            failureCount: this.failureCount,
            successCount: this.successCount,
            lastFailureTime: this.lastFailureTime,
            lastSuccessTime: this.lastSuccessTime,
            requestCount: this.requestCount
        };
    }

    /**
     * Forcer un changement d'état
     */
    forceState(state, reason = 'manual') {
        const previousState = this.state;
        
        switch (state) {
            case 'OPEN':
                this.transitionToOpen(reason);
                break;
            case 'CLOSED':
                this.transitionToClosed();
                break;
            case 'HALF_OPEN':
                this.transitionToHalfOpen();
                break;
            default:
                throw new Error(`Invalid state: ${state}`);
        }
        
        this.emit('force-state-change', {
            serviceName: this.serviceName,
            from: previousState,
            to: state,
            reason
        });
    }

    /**
     * Réinitialiser les métriques
     */
    resetMetrics() {
        this.metrics = {
            requests: 0,
            successes: 0,
            failures: 0,
            timeouts: 0,
            averageResponseTime: 0,
            minResponseTime: Infinity,
            maxResponseTime: 0,
            requestsByState: { CLOSED: 0, OPEN: 0, HALF_OPEN: 0 }
        };
        
        this.history = [];
        this.performanceMetrics = [];
        
        this.emit('metrics-reset', {
            serviceName: this.serviceName
        });
    }

    /**
     * Vider le cache
     */
    clearCache() {
        this.cache.clear();
        this.cacheMetadata.clear();
        
        this.emit('cache-cleared', {
            serviceName: this.serviceName
        });
    }

    /**
     * Ajouter un service alternatif
     */
    addAlternativeService(service) {
        this.alternativeServices.push({
            name: service.name || `alternative_${this.alternativeServices.length + 1}`,
            url: service.url,
            timeout: service.timeout || this.config.timeout,
            headers: service.headers || {},
            ...service
        });
        
        this.emit('alternative-service-added', {
            serviceName: this.serviceName,
            alternative: service.name
        });
    }

    /**
     * Supprimer un service alternatif
     */
    removeAlternativeService(serviceName) {
        const index = this.alternativeServices.findIndex(s => s.name === serviceName);
        if (index !== -1) {
            this.alternativeServices.splice(index, 1);
            
            this.emit('alternative-service-removed', {
                serviceName: this.serviceName,
                alternative: serviceName
            });
            
            return true;
        }
        return false;
    }

    // 🛠️ UTILITAIRES

    /**
     * Initialiser le circuit breaker
     */
    initialize() {
        // Initialiser les métriques
        this.metrics.minResponseTime = Infinity;
        
        // Programmer le nettoyage périodique
        setInterval(() => {
            this.cleanupOldMetrics();
        }, 60000); // 1 minute
        
        // Émettre un événement d'initialisation
        this.emit('initialized', {
            serviceName: this.serviceName,
            initialState: this.state,
            config: this.config
        });
    }

    /**
     * Générer un ID de requête
     */
    generateRequestId() {
        return `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
     * Arrêter le circuit breaker
     */
    shutdown() {
        // Nettoyer les timers
        if (this.halfOpenTimer) {
            clearTimeout(this.halfOpenTimer);
        }
        
        // Vider le cache
        this.clearCache();
        
        // Émettre un événement de fermeture
        this.emit('shutdown', {
            serviceName: this.serviceName,
            finalState: this.state,
            finalMetrics: this.getMetrics()
        });
    }
}

// Factory pour créer des circuit breakers
class CircuitBreakerRegistry extends EventEmitter {
    constructor() {
        super();
        this.breakers = new Map();
    }

    /**
     * Créer ou obtenir un circuit breaker
     */
    getBreaker(serviceName, options = {}) {
        if (!this.breakers.has(serviceName)) {
            const breaker = new CircuitBreaker(serviceName, options);
            this.breakers.set(serviceName, breaker);
            
            breaker.on('state-change', (data) => {
                this.emit('state-change', data);
            });
            
            breaker.on('failure', (data) => {
                this.emit('failure', data);
            });
        }
        
        return this.breakers.get(serviceName);
    }

    /**
     * Supprimer un circuit breaker
     */
    removeBreaker(serviceName) {
        const breaker = this.breakers.get(serviceName);
        if (breaker) {
            breaker.shutdown();
            this.breakers.delete(serviceName);
            return true;
        }
        return false;
    }

    /**
     * Obtenir tous les circuit breakers
     */
    getAllBreakers() {
        const breakers = {};
        for (const [name, breaker] of this.breakers.entries()) {
            breakers[name] = breaker.getState();
        }
        return breakers;
    }

    /**
     * Obtenir les métriques de tous les services
     */
    getAllMetrics() {
        const metrics = {};
        for (const [name, breaker] of this.breakers.entries()) {
            metrics[name] = breaker.getMetrics();
        }
        return metrics;
    }

    /**
     * Réinitialiser tous les circuit breakers
     */
    resetAll() {
        for (const breaker of this.breakers.values()) {
            breaker.resetMetrics();
        }
    }

    /**
     * Arrêter tous les circuit breakers
     */
    shutdownAll() {
        for (const breaker of this.breakers.values()) {
            breaker.shutdown();
        }
        this.breakers.clear();
    }
}

// Export instances
const circuitBreakerRegistry = new CircuitBreakerRegistry();

export default circuitBreakerRegistry;
export { CircuitBreaker, CircuitBreakerRegistry };