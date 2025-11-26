// src/services/retryManager.js - GESTIONNAIRE DE RECOMMANDEES WORKFLOW
// Mécanisme intelligent de retry avec stratégies adaptatives et limitations

import EventEmitter from 'events';

class RetryManager extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Stratégies de retry par défaut
            defaultStrategy: {
                maxAttempts: config.maxAttempts || 3,
                initialDelay: config.initialDelay || 1000, // 1 seconde
                maxDelay: config.maxDelay || 30000, // 30 secondes
                backoffMultiplier: config.backoffMultiplier || 2,
                jitter: config.jitter !== false, // Ajouter du randomness
                jitterRange: config.jitterRange || 0.1 // 10% de variance
            },
            
            // Stratégies par type d'erreur
            strategies: {
                network: {
                    maxAttempts: 5,
                    initialDelay: 500,
                    maxDelay: 10000,
                    backoffMultiplier: 2,
                    recoverable: true
                },
                validation: {
                    maxAttempts: 1,
                    initialDelay: 0,
                    recoverable: false
                },
                permission: {
                    maxAttempts: 1,
                    initialDelay: 0,
                    recoverable: false
                },
                server_error: {
                    maxAttempts: 3,
                    initialDelay: 2000,
                    maxDelay: 60000,
                    backoffMultiplier: 3,
                    recoverable: true
                },
                rate_limit: {
                    maxAttempts: 5,
                    initialDelay: 5000,
                    maxDelay: 120000,
                    backoffMultiplier: 2,
                    recoverable: true
                },
                timeout: {
                    maxAttempts: 3,
                    initialDelay: 1000,
                    maxDelay: 15000,
                    backoffMultiplier: 1.5,
                    recoverable: true
                }
            },
            
            // Configuration des limites
            limits: {
                maxConcurrentRetries: config.maxConcurrentRetries || 10,
                retryQueueSize: config.retryQueueSize || 1000,
                maxRetriesPerHour: config.maxRetriesPerHour || 100,
                globalRetryCooldown: config.globalRetryCooldown || 60000 // 1 minute
            },
            
            // Configuration de la surveillance
            monitoring: {
                enabled: config.monitoringEnabled !== false,
                alertThreshold: config.alertThreshold || 0.8, // 80% de taux d'échec
                timeWindow: config.monitoringTimeWindow || 300000, // 5 minutes
                storeHistory: config.storeHistory !== false,
                maxHistorySize: config.maxHistorySize || 10000
            },
            
            ...config
        };

        // État interne
        this.retryQueue = [];
        this.activeRetries = new Map();
        this.retryHistory = [];
        this.statistics = {
            totalRetries: 0,
            successfulRetries: 0,
            failedRetries: 0,
            averageAttempts: 0,
            retriesByCategory: {},
            timeSeries: []
        };

        // Limites et rate limiting
        this.limits = {
            currentRetries: 0,
            retryCount: 0,
            lastResetTime: Date.now(),
            retryCountPerHour: new Map()
        };

        // État global
        this.globalCooldown = false;
        this.globalCooldownUntil = 0;

        // Timer de maintenance
        this.maintenanceTimer = null;

        // Démarrer la maintenance
        this.startMaintenance();
    }

    /**
     * Exécuter une opération avec retry
     */
    async executeWithRetry(operation, options = {}) {
        const retryId = this.generateRetryId();
        
        const retryContext = {
            id: retryId,
            operation,
            options: { ...this.config.defaultStrategy, ...options },
            attempts: 0,
            startTime: Date.now(),
            category: options.category || 'default',
            context: options.context || {},
            schedule: []
        };

        // Vérifier les limites avant de commencer
        if (!this.canStartRetry(retryContext)) {
            throw new Error(`Impossible de démarrer le retry ${retryId}: limites dépassées`);
        }

        // Ajouter à la file d'attente
        this.addToQueue(retryContext);

        // Commencer l'exécution si possible
        if (this.canExecuteImmediately()) {
            return await this.processRetry(retryContext);
        }

        // Retourner une promise qui sera résolue quand le retry sera traité
        return new Promise((resolve, reject) => {
            retryContext.resolve = resolve;
            retryContext.reject = reject;
        });
    }

    /**
     * Traiter un retry
     */
    async processRetry(retryContext) {
        const { id, operation, options, attempts } = retryContext;
        
        try {
            this.registerRetry(id, retryContext);
            
            while (attempts < options.maxAttempts) {
                retryContext.attempts++;
                this.limits.currentRetries++;
                
                try {
                    // Attendre avant l'exécution (sauf première tentative)
                    if (attempts > 0) {
                        const delay = this.calculateDelay(retryContext);
                        await this.sleep(delay);
                    }
                    
                    // Exécuter l'opération
                    const result = await this.executeOperation(operation, retryContext);
                    
                    // Succès - enregistrer et retourner
                    this.recordSuccess(retryContext);
                    this.cleanupRetry(id);
                    
                    this.emit('retry-success', {
                        retryId: id,
                        attempts: retryContext.attempts,
                        totalTime: Date.now() - retryContext.startTime
                    });
                    
                    return result;
                    
                } catch (error) {
                    // Échec - analyser l'erreur
                    const errorAnalysis = this.analyzeError(error, retryContext);
                    
                    if (!errorAnalysis.retryable || attempts >= options.maxAttempts) {
                        // Échec final
                        this.recordFailure(retryContext, error);
                        this.cleanupRetry(id);
                        
                        const finalError = new Error(`Retry failed after ${retryContext.attempts} attempts: ${error.message}`);
                        finalError.cause = error;
                        finalError.retryAttempts = retryContext.attempts;
                        finalError.retryId = id;
                        
                        this.emit('retry-failure', {
                            retryId: id,
                            error: finalError,
                            attempts: retryContext.attempts
                        });
                        
                        throw finalError;
                    }
                    
                    // Programmer le prochain retry
                    retryContext.schedule.push({
                        attempt: attempts + 1,
                        delay: this.calculateDelay(retryContext),
                        errorType: errorAnalysis.type,
                        timestamp: Date.now()
                    });
                    
                    this.emit('retry-attempt', {
                        retryId: id,
                        attempt: attempts + 1,
                        maxAttempts: options.maxAttempts,
                        error: error.message,
                        errorType: errorAnalysis.type
                    });
                    
                    // Continuer avec le prochain attempt
                }
            }
            
        } catch (error) {
            this.cleanupRetry(id);
            throw error;
        } finally {
            this.limits.currentRetries = Math.max(0, this.limits.currentRetries - 1);
        }
    }

    /**
     * Exécuter l'opération
     */
    async executeOperation(operation, retryContext) {
        const startTime = Date.now();
        
        try {
            // L'opération peut être une fonction ou une promesse
            const result = await operation(retryContext.context);
            
            // Enregistrer le temps d'exécution
            const executionTime = Date.now() - startTime;
            retryContext.lastExecutionTime = executionTime;
            
            return result;
            
        } catch (error) {
            error.executionTime = Date.now() - startTime;
            error.retryAttempt = retryContext.attempts;
            error.retryId = retryContext.id;
            throw error;
        }
    }

    /**
     * Analyser une erreur pour déterminer si elle est réessayable
     */
    analyzeError(error, retryContext) {
        const message = error.message.toLowerCase();
        const code = error.code || '';
        
        // Analyser le type d'erreur
        let type = 'unknown';
        let retryable = true;
        let severity = 'medium';
        
        // Erreurs réseau
        if (message.includes('network') || message.includes('connection') || 
            code === 'NETWORK_ERROR' || code === 'CONNECTION_FAILED') {
            type = 'network';
            retryable = true;
            severity = 'low';
        }
        
        // Erreurs de timeout
        else if (message.includes('timeout') || code === 'TIMEOUT') {
            type = 'timeout';
            retryable = true;
            severity = 'medium';
        }
        
        // Erreurs de validation (pas réessayables)
        else if (message.includes('validation') || message.includes('invalid') || 
                 code === 'VALIDATION_ERROR' || code === 'INVALID_INPUT') {
            type = 'validation';
            retryable = false;
            severity = 'high';
        }
        
        // Erreurs de permissions (pas réessayables)
        else if (message.includes('permission') || message.includes('unauthorized') ||
                 code === 'PERMISSION_DENIED' || code === 'UNAUTHORIZED') {
            type = 'permission';
            retryable = false;
            severity = 'high';
        }
        
        // Erreurs serveur (réessayables)
        else if (message.includes('server error') || code >= 500) {
            type = 'server_error';
            retryable = true;
            severity = 'medium';
        }
        
        // Rate limiting (réessayables avec backoff)
        else if (message.includes('rate limit') || message.includes('too many requests') ||
                 code === 'RATE_LIMIT_EXCEEDED' || code === 429) {
            type = 'rate_limit';
            retryable = true;
            severity = 'high';
        }
        
        // Erreurs métier (généralement pas réessayables)
        else if (message.includes('business rule') || message.includes('not available')) {
            type = 'business_rule';
            retryable = false;
            severity = 'medium';
        }
        
        // Utiliser la stratégie spécifique si disponible
        const strategy = this.config.strategies[type];
        if (strategy) {
            retryable = strategy.recoverable !== false;
        }
        
        return {
            type,
            retryable,
            severity,
            strategy: strategy || this.config.defaultStrategy
        };
    }

    /**
     * Calculer le délai avant le prochain retry
     */
    calculateDelay(retryContext) {
        const { options, attempts } = retryContext;
        const errorAnalysis = retryContext.lastError ? 
            this.analyzeError(retryContext.lastError, retryContext) : 
            { strategy: options };
        
        const strategy = errorAnalysis.strategy;
        
        // Délai de base avec backoff exponentiel
        let delay = strategy.initialDelay * Math.pow(strategy.backoffMultiplier, attempts - 1);
        
        // Respecter la limite maximale
        delay = Math.min(delay, strategy.maxDelay);
        
        // Ajouter du jitter pour éviter les thundering herd
        if (strategy.jitter) {
            const jitterRange = strategy.jitterRange || 0.1;
            const jitter = (Math.random() - 0.5) * 2 * jitterRange;
            delay = delay * (1 + jitter);
        }
        
        // Ajustements spéciaux selon le type d'erreur
        if (errorAnalysis.type === 'rate_limit') {
            // Délai plus long pour les rate limits
            delay = Math.max(delay, 5000);
        } else if (errorAnalysis.type === 'network') {
            // Délai plus court pour les erreurs réseau
            delay = Math.max(delay, 500);
        }
        
        return Math.floor(delay);
    }

    /**
     * Enregistrer une tentative de retry
     */
    registerRetry(retryId, retryContext) {
        this.activeRetries.set(retryId, {
            ...retryContext,
            registeredAt: new Date().toISOString()
        });
        
        // Mettre à jour les statistiques
        this.limits.retryCount++;
        this.updateHourlyCount();
        
        // Vérifier les limites globales
        this.checkGlobalLimits();
        
        this.emit('retry-registered', {
            retryId,
            category: retryContext.category,
            maxAttempts: retryContext.options.maxAttempts
        });
    }

    /**
     * Enregistrer un succès de retry
     */
    recordSuccess(retryContext) {
        this.statistics.successfulRetries++;
        this.statistics.totalRetries++;
        
        // Mettre à jour la moyenne des tentatives
        this.updateAverageAttempts(retryContext.attempts);
        
        // Ajouter à l'historique
        if (this.config.monitoring.storeHistory) {
            this.addToHistory({
                id: retryContext.id,
                category: retryContext.category,
                attempts: retryContext.attempts,
                status: 'success',
                duration: Date.now() - retryContext.startTime,
                timestamp: new Date().toISOString()
            });
        }
        
        // Mettre à jour les statistiques par catégorie
        this.statistics.retriesByCategory[retryContext.category] = 
            (this.statistics.retriesByCategory[retryContext.category] || 0) + 1;
        
        // Réinitialiser le cooldown global si nécessaire
        if (this.globalCooldown) {
            this.globalCooldown = false;
            this.globalCooldownUntil = 0;
        }
    }

    /**
     * Enregistrer un échec de retry
     */
    recordFailure(retryContext, error) {
        this.statistics.failedRetries++;
        this.statistics.totalRetries++;
        
        // Mettre à jour la moyenne des tentatives
        this.updateAverageAttempts(retryContext.attempts);
        
        // Ajouter à l'historique
        if (this.config.monitoring.storeHistory) {
            this.addToHistory({
                id: retryContext.id,
                category: retryContext.category,
                attempts: retryContext.attempts,
                status: 'failure',
                error: error.message,
                duration: Date.now() - retryContext.startTime,
                timestamp: new Date().toISOString()
            });
        }
        
        // Déclencher le cooldown global en cas d'échec critique
        if (retryContext.attempts >= retryContext.options.maxAttempts) {
            this.triggerGlobalCooldown();
        }
        
        // Vérifier le seuil d'alerte
        this.checkAlertThreshold();
    }

    /**
     * Nettoyer un retry terminé
     */
    cleanupRetry(retryId) {
        this.activeRetries.delete(retryId);
        
        // Retirer de la file d'attente s'il y est
        const queueIndex = this.retryQueue.findIndex(item => item.id === retryId);
        if (queueIndex !== -1) {
            this.retryQueue.splice(queueIndex, 1);
        }
        
        this.emit('retry-completed', { retryId });
    }

    // 📊 SURVEILLANCE ET STATISTIQUES

    /**
     * Vérifier les limites globales
     */
    checkGlobalLimits() {
        const currentRetries = this.activeRetries.size;
        
        // Vérifier la limite de retries concurrents
        if (currentRetries >= this.config.limits.maxConcurrentRetries) {
            throw new Error(`Limite de retries concurrents atteinte: ${currentRetries}`);
        }
        
        // Vérifier la limite de taille de la file
        if (this.retryQueue.length >= this.config.limits.retryQueueSize) {
            throw new Error(`File d'attente des retries pleine: ${this.retryQueue.length}`);
        }
        
        // Vérifier le cooldown global
        if (this.globalCooldown && Date.now() < this.globalCooldownUntil) {
            throw new Error(`Retry en cooldown global jusqu'à ${new Date(this.globalCooldownUntil).toISOString()}`);
        }
    }

    /**
     * Déclencher le cooldown global
     */
    triggerGlobalCooldown() {
        this.globalCooldown = true;
        this.globalCooldownUntil = Date.now() + this.config.limits.globalRetryCooldown;
        
        this.emit('global-cooldown-triggered', {
            until: this.globalCooldownUntil,
            reason: 'excessive_failures'
        });
    }

    /**
     * Mettre à jour le compteur horaire
     */
    updateHourlyCount() {
        const now = Date.now();
        const hourStart = Math.floor(now / 3600000) * 3600000;
        
        // Réinitialiser si on change d'heure
        if (this.limits.lastResetTime < hourStart) {
            this.limits.retryCountPerHour.clear();
            this.limits.lastResetTime = hourStart;
        }
        
        // Incrémenter le compteur pour cette heure
        const count = this.limits.retryCountPerHour.get(hourStart) || 0;
        this.limits.retryCountPerHour.set(hourStart, count + 1);
        
        // Vérifier la limite horaire
        if (count >= this.config.limits.maxRetriesPerHour) {
            this.triggerGlobalCooldown();
        }
    }

    /**
     * Vérifier le seuil d'alerte
     */
    checkAlertThreshold() {
        if (!this.config.monitoring.enabled) return;
        
        const recentHistory = this.retryHistory.slice(-100);
        if (recentHistory.length < 10) return; // Pas assez de données
        
        const failures = recentHistory.filter(item => item.status === 'failure').length;
        const failureRate = failures / recentHistory.length;
        
        if (failureRate >= this.config.monitoring.alertThreshold) {
            this.emit('high-failure-rate', {
                failureRate,
                recentFailures: failures,
                recentTotal: recentHistory.length,
                threshold: this.config.monitoring.alertThreshold
            });
        }
    }

    /**
     * Mettre à jour la moyenne des tentatives
     */
    updateAverageAttempts(attempts) {
        const total = this.statistics.totalRetries;
        if (total === 1) {
            this.statistics.averageAttempts = attempts;
        } else {
            this.statistics.averageAttempts = 
                ((this.statistics.averageAttempts * (total - 1)) + attempts) / total;
        }
    }

    /**
     * Ajouter à l'historique
     */
    addToHistory(entry) {
        this.retryHistory.push(entry);
        
        // Limiter la taille de l'historique
        if (this.retryHistory.length > this.config.monitoring.maxHistorySize) {
            this.retryHistory = this.retryHistory.slice(-Math.floor(this.config.monitoring.maxHistorySize / 2));
        }
        
        // Ajouter à la série temporelle
        const minute = Math.floor(Date.now() / 60000);
        let timeSeriesEntry = this.statistics.timeSeries.find(entry => entry.minute === minute);
        
        if (!timeSeriesEntry) {
            timeSeriesEntry = { 
                minute, 
                retries: 0, 
                successes: 0, 
                failures: 0 
            };
            this.statistics.timeSeries.push(timeSeriesEntry);
            
            // Garder seulement les 60 dernières minutes
            if (this.statistics.timeSeries.length > 60) {
                this.statistics.timeSeries = this.statistics.timeSeries.slice(-60);
            }
        }
        
        timeSeriesEntry.retries++;
        if (entry.status === 'success') {
            timeSeriesEntry.successes++;
        } else {
            timeSeriesEntry.failures++;
        }
    }

    /**
     * Obtenir les statistiques de retry
     */
    getRetryStatistics(timeRange = null) {
        let history = this.retryHistory;
        
        // Filtrer par période si spécifiée
        if (timeRange) {
            const from = Date.now() - timeRange;
            history = history.filter(entry => new Date(entry.timestamp).getTime() >= from);
        }
        
        const stats = {
            overview: {
                total: this.statistics.totalRetries,
                successful: this.statistics.successfulRetries,
                failed: this.statistics.failedRetries,
                averageAttempts: Math.round(this.statistics.averageAttempts * 100) / 100,
                successRate: this.statistics.totalRetries > 0 ? 
                    Math.round((this.statistics.successfulRetries / this.statistics.totalRetries) * 100) : 0
            },
            byCategory: {},
            recent: history.slice(-20),
            timeSeries: this.statistics.timeSeries.slice(-30), // 30 dernières minutes
            active: this.activeRetries.size,
            queueSize: this.retryQueue.length,
            globalCooldown: {
                active: this.globalCooldown,
                until: this.globalCooldown ? new Date(this.globalCooldownUntil).toISOString() : null
            }
        };
        
        // Calculer les statistiques par catégorie
        history.forEach(entry => {
            if (!stats.byCategory[entry.category]) {
                stats.byCategory[entry.category] = {
                    total: 0,
                    successful: 0,
                    failed: 0
                };
            }
            
            stats.byCategory[entry.category].total++;
            if (entry.status === 'success') {
                stats.byCategory[entry.category].successful++;
            } else {
                stats.byCategory[entry.category].failed++;
            }
        });
        
        return stats;
    }

    // 🔍 INTERROGATION ET CONTRÔLE

    /**
     * Vérifier si un retry peut être démarré
     */
    canStartRetry(retryContext) {
        // Vérifier les limites de base
        if (this.globalCooldown && Date.now() < this.globalCooldownUntil) {
            return false;
        }
        
        if (this.activeRetries.size >= this.config.limits.maxConcurrentRetries) {
            return false;
        }
        
        // Vérifier les limites horaires
        const hourStart = Math.floor(Date.now() / 3600000) * 3600000;
        const hourlyCount = this.limits.retryCountPerHour.get(hourStart) || 0;
        
        if (hourlyCount >= this.config.limits.maxRetriesPerHour) {
            return false;
        }
        
        return true;
    }

    /**
     * Vérifier si un retry peut être exécuté immédiatement
     */
    canExecuteImmediately() {
        return this.activeRetries.size < this.config.limits.maxConcurrentRetries && 
               !this.globalCooldown;
    }

    /**
     * Ajouter à la file d'attente
     */
    addToQueue(retryContext) {
        this.retryQueue.push(retryContext);
        
        // Trier par priorité (priorité plus haute = plus tôt dans la file)
        this.retryQueue.sort((a, b) => {
            const priorityA = a.options.priority || 0;
            const priorityB = b.options.priority || 0;
            return priorityB - priorityA;
        });
    }

    /**
     * Obtenir les retries actifs
     */
    getActiveRetries() {
        return Array.from(this.activeRetries.values()).map(retry => ({
            id: retry.id,
            category: retry.category,
            attempts: retry.attempts,
            maxAttempts: retry.options.maxAttempts,
            registeredAt: retry.registeredAt,
            context: retry.context
        }));
    }

    /**
     * Obtenir la file d'attente
     */
    getRetryQueue() {
        return this.retryQueue.map(retry => ({
            id: retry.id,
            category: retry.category,
            attempts: retry.attempts,
            maxAttempts: retry.options.maxAttempts,
            queuedAt: retry.startTime
        }));
    }

    /**
     * Annuler un retry en attente
     */
    cancelRetry(retryId) {
        const retryContext = this.activeRetries.get(retryId);
        if (retryContext) {
            // Marquer comme annulé et rejeter la promise
            retryContext.cancelled = true;
            retryContext.reject(new Error(`Retry ${retryId} cancelled`));
            this.cleanupRetry(retryId);
            
            this.emit('retry-cancelled', { retryId });
            return true;
        }
        
        return false;
    }

    /**
     * Vider la file d'attente
     */
    clearRetryQueue() {
        const cancelled = this.retryQueue.length;
        
        while (this.retryQueue.length > 0) {
            const retry = this.retryQueue.shift();
            if (retry.reject) {
                retry.reject(new Error('Retry queue cleared'));
            }
        }
        
        this.emit('retry-queue-cleared', { cancelled });
        return cancelled;
    }

    // 🛠️ MAINTENANCE

    /**
     * Démarrer la maintenance
     */
    startMaintenance() {
        this.maintenanceTimer = setInterval(() => {
            this.performMaintenance();
        }, 60000); // 1 minute
    }

    /**
     * Effectuer la maintenance
     */
    performMaintenance() {
        // Nettoyer les retries expirés
        const now = Date.now();
        const maxAge = 30 * 60 * 1000; // 30 minutes
        
        for (const [retryId, retry] of this.activeRetries.entries()) {
            if (now - retry.startTime > maxAge) {
                this.cleanupRetry(retryId);
                console.warn(`Retry expiré nettoyé: ${retryId}`);
            }
        }
        
        // Nettoyer l'historique ancien
        const oneDayAgo = now - 24 * 60 * 60 * 1000;
        this.retryHistory = this.retryHistory.filter(entry => 
            new Date(entry.timestamp).getTime() > oneDayAgo
        );
        
        // Réinitialiser les compteurs horaires si nécessaire
        this.updateHourlyCount();
        
        this.emit('maintenance-performed', {
            timestamp: new Date().toISOString(),
            activeRetries: this.activeRetries.size,
            queueSize: this.retryQueue.length,
            historySize: this.retryHistory.length
        });
    }

    /**
     * Arrêter la maintenance
     */
    stopMaintenance() {
        if (this.maintenanceTimer) {
            clearInterval(this.maintenanceTimer);
            this.maintenanceTimer = null;
        }
    }

    // 🛠️ UTILITAIRES

    /**
     * Attendre (sleep)
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Générer un ID de retry
     */
    generateRetryId() {
        return `RET_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
     * Arrêter le gestionnaire
     */
    shutdown() {
        this.stopMaintenance();
        
        // Annuler tous les retries en cours
        for (const retryId of this.activeRetries.keys()) {
            this.cancelRetry(retryId);
        }
        
        // Vider la file d'attente
        this.clearRetryQueue();
        
        this.emit('shutdown');
    }
}

// Export singleton
const retryManager = new RetryManager();

export default retryManager;
export { RetryManager };