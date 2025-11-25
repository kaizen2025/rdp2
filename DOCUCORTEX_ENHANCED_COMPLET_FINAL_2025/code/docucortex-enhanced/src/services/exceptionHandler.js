// src/services/exceptionHandler.js - GESTIONNAIRE D'EXCEPTIONS WORKFLOW
// Gestion centralisée des erreurs et exceptions dans les workflows

import EventEmitter from 'events';

class ExceptionHandler extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Configuration des niveaux de log
            logLevels: {
                ERROR: 0,
                WARN: 1,
                INFO: 2,
                DEBUG: 3
            },
            
            // Configuration de la persistance
            persistence: {
                enabled: config.persistenceEnabled !== false,
                maxEntries: config.maxLogEntries || 1000,
                storageKey: config.storageKey || 'docucortex_workflow_logs',
                autoCleanup: config.autoCleanup !== false
            },
            
            // Configuration des alertes
            alerts: {
                enabled: config.alertsEnabled !== false,
                errorThreshold: config.errorThreshold || 10,
                timeWindow: config.alertTimeWindow || 300000, // 5 minutes
                channels: config.alertChannels || ['console', 'storage']
            },
            
            // Configuration des notifications
            notifications: {
                immediate: config.immediateNotifications !== false,
                batchSize: config.notificationBatchSize || 5,
                batchTimeout: config.notificationBatchTimeout || 10000, // 10 secondes
                maxRetries: config.maxNotificationRetries || 3
            },
            
            // Configuration de la classification
            classification: {
                categories: {
                    SYSTEM: 'system',
                    USER_INPUT: 'user_input',
                    NETWORK: 'network',
                    VALIDATION: 'validation',
                    PERMISSION: 'permission',
                    BUSINESS_LOGIC: 'business_logic',
                    INTEGRATION: 'integration',
                    DATA: 'data'
                },
                severities: {
                    CRITICAL: 'critical',
                    HIGH: 'high',
                    MEDIUM: 'medium',
                    LOW: 'low',
                    INFO: 'info'
                },
                autoClassify: config.autoClassify !== false
            },
            
            ...config
        };

        // Stockage des logs et exceptions
        this.logs = [];
        this.exceptions = new Map();
        this.statistics = {
            totalExceptions: 0,
            exceptionsByCategory: {},
            exceptionsBySeverity: {},
            exceptionsByComponent: {},
            timeSeries: []
        };

        // État des alertes
        this.alertState = {
            activeAlerts: new Map(),
            alertHistory: [],
            lastAlertTime: null,
            errorCount: 0
        };

        // File d'attente des notifications
        this.notificationQueue = [];
        this.notificationTimer = null;

        // Charge de travail
        this.isProcessing = false;
        this.processQueue = [];

        // Initialiser la persistence
        this.loadFromStorage();
        
        // Démarrer les services de maintenance
        this.startMaintenanceServices();
    }

    /**
     * Gérer une exception
     */
    async handleException(error, context = {}) {
        const exception = this.createException(error, context);
        
        try {
            // Classifier l'exception
            const classification = this.classifyException(exception);
            exception.category = classification.category;
            exception.severity = classification.severity;
            exception.tags = classification.tags;
            
            // Stocker l'exception
            this.storeException(exception);
            
            // Mettre à jour les statistiques
            this.updateStatistics(exception);
            
            // Traiter selon le niveau de sévérité
            switch (exception.severity) {
                case this.config.classification.severities.CRITICAL:
                    await this.handleCriticalException(exception);
                    break;
                case this.config.classification.severities.HIGH:
                    await this.handleHighSeverityException(exception);
                    break;
                case this.config.classification.severities.MEDIUM:
                    await this.handleMediumSeverityException(exception);
                    break;
                default:
                    await this.handleLowSeverityException(exception);
                    break;
            }
            
            // Émettre des événements
            this.emit('exception-handled', exception);
            this.emit(`exception-${exception.severity}`, exception);
            
            return exception;
            
        } catch (handlingError) {
            console.error('Erreur lors du traitement de l\'exception:', handlingError);
            return this.createException(handlingError, {
                ...context,
                originalError: error,
                handlingError: true
            });
        }
    }

    /**
     * Créer une exception structurée
     */
    createException(error, context) {
        const exception = {
            id: this.generateExceptionId(),
            timestamp: new Date().toISOString(),
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
                code: error.code || null,
                cause: error.cause || null
            },
            context: {
                component: context.component || 'unknown',
                operation: context.operation || 'unknown',
                workflowId: context.workflowId || null,
                executionId: context.executionId || null,
                taskId: context.taskId || null,
                userId: context.userId || null,
                sessionId: context.sessionId || null,
                requestId: context.requestId || this.generateRequestId(),
                ...context
            },
            metadata: {
                userAgent: context.userAgent || 'unknown',
                url: context.url || 'unknown',
                timestamp: context.timestamp || new Date().toISOString(),
                version: context.version || '1.0.0'
            },
            category: context.category || 'unknown',
            severity: context.severity || 'medium',
            resolved: false,
            resolvedAt: null,
            resolvedBy: null,
            actions: [],
            relatedExceptions: [],
            tags: context.tags || []
        };

        return exception;
    }

    /**
     * Classifier une exception automatiquement
     */
    classifyException(exception) {
        if (!this.config.classification.autoClassify) {
            return {
                category: exception.category || 'unknown',
                severity: exception.severity || 'medium',
                tags: exception.tags || []
            };
        }

        const error = exception.error;
        const message = error.message.toLowerCase();
        const stack = error.stack ? error.stack.toLowerCase() : '';

        // Classification par message d'erreur
        let category = this.config.classification.categories.SYSTEM;
        let severity = this.config.classification.severities.MEDIUM;
        const tags = [];

        // Catégorie - Type d'erreur
        if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
            category = this.config.classification.categories.NETWORK;
            tags.push('network', 'connectivity');
        } else if (message.includes('permission') || message.includes('access denied') || message.includes('unauthorized')) {
            category = this.config.classification.categories.PERMISSION;
            severity = this.config.classification.severities.HIGH;
            tags.push('security', 'authorization');
        } else if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
            category = this.config.classification.categories.VALIDATION;
            tags.push('data-validation', 'user-input');
        } else if (message.includes('user') || message.includes('input')) {
            category = this.config.classification.categories.USER_INPUT;
            tags.push('user-error', 'input-validation');
        } else if (message.includes('business') || message.includes('rule')) {
            category = this.config.classification.categories.BUSINESS_LOGIC;
            tags.push('business-rule', 'workflow');
        } else if (message.includes('integration') || message.includes('api') || message.includes('service')) {
            category = this.config.classification.categories.INTEGRATION;
            tags.push('external-service', 'integration');
        } else if (message.includes('data') || message.includes('database') || message.includes('sql')) {
            category = this.config.classification.categories.DATA;
            tags.push('database', 'data-integrity');
        }

        // Sévérité - Impact et urgence
        if (message.includes('critical') || message.includes('fatal') || stack.includes('cannot read')) {
            severity = this.config.classification.severities.CRITICAL;
            tags.push('system-critical');
        } else if (message.includes('error') && !message.includes('warning')) {
            severity = this.config.classification.severities.HIGH;
            tags.push('high-impact');
        } else if (message.includes('warning') || message.includes('deprecation')) {
            severity = this.config.classification.severities.LOW;
            tags.push('warning', 'maintenance');
        } else if (message.includes('info') || message.includes('debug')) {
            severity = this.config.classification.severities.INFO;
            tags.push('informational');
        }

        // Tags supplémentaires selon le contexte
        if (exception.context.workflowId) {
            tags.push('workflow');
        }
        if (exception.context.taskId) {
            tags.push('task');
        }
        if (exception.context.executionId) {
            tags.push('execution');
        }

        return { category, severity, tags };
    }

    /**
     * Stocker une exception
     */
    storeException(exception) {
        // Stocker en mémoire
        this.exceptions.set(exception.id, exception);
        
        // Ajouter aux logs
        this.logs.push({
            id: exception.id,
            timestamp: exception.timestamp,
            level: this.getLogLevel(exception.severity),
            message: exception.error.message,
            category: exception.category,
            severity: exception.severity,
            context: exception.context,
            stack: exception.error.stack
        });

        // Limiter la taille des logs
        if (this.logs.length > this.config.persistence.maxEntries) {
            this.logs = this.logs.slice(-Math.floor(this.config.persistence.maxEntries / 2));
        }

        // Sauvegarder en persistence si activée
        if (this.config.persistence.enabled) {
            this.saveToStorage();
        }
    }

    /**
     * Gérer une exception critique
     */
    async handleCriticalException(exception) {
        console.error('EXCEPTION CRITIQUE:', exception);
        
        // Actions immédiates
        await this.executeImmediateActions(exception);
        
        // Créer une alerte critique
        await this.createAlert('critical', exception);
        
        // Notifications urgentes
        await this.queueNotification(exception, 'urgent');
        
        // Journaliser en détail
        this.logCriticalException(exception);
    }

    /**
     * Gérer une exception de haute sévérité
     */
    async handleHighSeverityException(exception) {
        console.warn('EXCEPTION HAUTE SÉVÉRITÉ:', exception);
        
        // Créer une alerte
        await this.createAlert('high', exception);
        
        // Notifications standard
        await this.queueNotification(exception, 'standard');
        
        // Logging standard
        this.logException(exception);
    }

    /**
     * Gérer une exception de sévérité moyenne
     */
    async handleMediumSeverityException(exception) {
        // Créer une alerte si nécessaire
        await this.checkAlertThreshold();
        
        // Notifications batchées
        await this.queueNotification(exception, 'batched');
        
        // Logging standard
        this.logException(exception);
    }

    /**
     * Gérer une exception de faible sévérité
     */
    async handleLowSeverityException(exception) {
        // Logging simple
        this.logException(exception, 'info');
        
        // Peut être ignoré selon la configuration
        if (this.shouldSuppressLowSeverity()) {
            return;
        }
    }

    // 🚨 ALERTES ET NOTIFICATIONS

    /**
     * Créer une alerte
     */
    async createAlert(level, exception) {
        const alertId = this.generateAlertId();
        
        const alert = {
            id: alertId,
            level,
            exceptionId: exception.id,
            message: `${level.toUpperCase()}: ${exception.error.message}`,
            details: {
                category: exception.category,
                component: exception.context.component,
                workflowId: exception.context.workflowId,
                count: 1
            },
            createdAt: new Date().toISOString(),
            acknowledged: false,
            resolved: false,
            actions: []
        };

        // Stocker l'alerte
        this.alertState.activeAlerts.set(alertId, alert);
        this.alertState.alertHistory.push(alert);
        this.alertState.lastAlertTime = new Date().toISOString();

        // Envoyer l'alerte selon les canaux configurés
        await this.sendAlert(alert);

        console.log(`Alerte créée: ${alertId} (${level})`);
        
        return alertId;
    }

    /**
     * Envoyer une alerte
     */
    async sendAlert(alert) {
        for (const channel of this.config.alerts.channels) {
            try {
                switch (channel) {
                    case 'console':
                        console[alert.level === 'critical' ? 'error' : 'warn'](
                            `[ALERT] ${alert.message}`,
                            alert.details
                        );
                        break;
                    
                    case 'storage':
                        await this.storeAlertInStorage(alert);
                        break;
                    
                    case 'notification':
                        await this.sendSystemNotification(alert);
                        break;
                    
                    default:
                        console.warn(`Canal d'alerte non supporté: ${channel}`);
                }
            } catch (error) {
                console.error(`Erreur lors de l'envoi de l'alerte via ${channel}:`, error);
            }
        }
    }

    /**
     * Vérifier le seuil d'alertes
     */
    async checkAlertThreshold() {
        const now = new Date();
        const timeWindow = this.config.alerts.timeWindow;
        
        // Compter les erreurs dans la fenêtre de temps
        const recentErrors = this.logs.filter(log => {
            const logTime = new Date(log.timestamp);
            return (now - logTime) < timeWindow && log.level <= this.config.logLevels.ERROR;
        });

        this.alertState.errorCount = recentErrors.length;

        // Créer une alerte si le seuil est dépassé
        if (recentErrors.length >= this.config.alerts.errorThreshold) {
            const message = `Seuil d'erreurs dépassé: ${recentErrors.length} erreurs dans les ${timeWindow / 60000} dernières minutes`;
            
            await this.createAlert('high', {
                id: 'threshold_' + Date.now(),
                error: { message },
                context: { component: 'exception-handler' },
                category: 'system',
                severity: 'high'
            });
        }
    }

    /**
     * Mettre en file d'attente une notification
     */
    async queueNotification(exception, priority = 'standard') {
        const notification = {
            id: this.generateNotificationId(),
            exception,
            priority,
            queuedAt: new Date().toISOString(),
            attempts: 0
        };

        // Ajouter à la file d'attente
        this.notificationQueue.push(notification);
        
        // Trier par priorité
        this.notificationQueue.sort((a, b) => {
            const priorityOrder = { urgent: 0, standard: 1, batched: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        // Traiter immédiatement si urgent
        if (priority === 'urgent') {
            await this.processNotificationQueue();
        } else if (!this.notificationTimer) {
            // Démarrer le timer de traitement en lot
            this.notificationTimer = setTimeout(() => {
                this.processNotificationQueue();
            }, this.config.notifications.batchTimeout);
        }
    }

    /**
     * Traiter la file d'attente des notifications
     */
    async processNotificationQueue() {
        if (this.isProcessing || this.notificationQueue.length === 0) {
            return;
        }

        this.isProcessing = true;
        
        try {
            const batch = this.notificationQueue.splice(0, this.config.notifications.batchSize);
            
            for (const notification of batch) {
                try {
                    await this.sendNotification(notification);
                    notification.sent = true;
                    notification.sentAt = new Date().toISOString();
                } catch (error) {
                    notification.attempts++;
                    notification.lastError = error.message;
                    
                    // Remettre en file si pas trop d'essais
                    if (notification.attempts < this.config.notifications.maxRetries) {
                        this.notificationQueue.push(notification);
                    }
                }
            }
        } finally {
            this.isProcessing = false;
            
            // Nettoyer le timer
            if (this.notificationTimer) {
                clearTimeout(this.notificationTimer);
                this.notificationTimer = null;
            }
            
            // Continuer le traitement si nécessaire
            if (this.notificationQueue.length > 0) {
                setTimeout(() => this.processNotificationQueue(), 1000);
            }
        }
    }

    /**
     * Envoyer une notification
     */
    async sendNotification(notification) {
        const { exception, priority } = notification;
        
        // Notification console pour les exceptions importantes
        if (exception.severity === 'critical' || exception.severity === 'high') {
            console.group(`🚨 Exception ${exception.severity.toUpperCase()}`);
            console.error('Message:', exception.error.message);
            console.error('Composant:', exception.context.component);
            console.error('Workflow:', exception.context.workflowId);
            console.error('Stack:', exception.error.stack);
            console.groupEnd();
        }
        
        // Notification navigateur pour les exceptions critiques
        if (exception.severity === 'critical' && this.hasNotificationPermission()) {
            new Notification(`Erreur Critique - ${exception.context.component}`, {
                body: exception.error.message,
                icon: '/favicon.ico',
                requireInteraction: true,
                tag: `exception-${exception.id}`
            });
        }
        
        // Événement personnalisé pour l'intégration
        window.dispatchEvent(new CustomEvent('docucortex-exception', {
            detail: {
                id: exception.id,
                severity: exception.severity,
                category: exception.category,
                message: exception.error.message,
                component: exception.context.component,
                workflowId: exception.context.workflowId
            }
        }));
    }

    // 📊 STATISTIQUES ET ANALYSE

    /**
     * Mettre à jour les statistiques
     */
    updateStatistics(exception) {
        this.statistics.totalExceptions++;
        
        // Par catégorie
        this.statistics.exceptionsByCategory[exception.category] = 
            (this.statistics.exceptionsByCategory[exception.category] || 0) + 1;
        
        // Par sévérité
        this.statistics.exceptionsBySeverity[exception.severity] = 
            (this.statistics.exceptionsBySeverity[exception.severity] || 0) + 1;
        
        // Par composant
        const component = exception.context.component;
        this.statistics.exceptionsByComponent[component] = 
            (this.statistics.exceptionsByComponent[component] || 0) + 1;
        
        // Série temporelle (par minute)
        const minute = Math.floor(Date.now() / 60000);
        let timeSeriesEntry = this.statistics.timeSeries.find(entry => entry.minute === minute);
        
        if (!timeSeriesEntry) {
            timeSeriesEntry = { minute, count: 0, categories: {} };
            this.statistics.timeSeries.push(timeSeriesEntry);
            
            // Garder seulement les 60 dernières minutes
            if (this.statistics.timeSeries.length > 60) {
                this.statistics.timeSeries = this.statistics.timeSeries.slice(-60);
            }
        }
        
        timeSeriesEntry.count++;
        timeSeriesEntry.categories[exception.category] = 
            (timeSeriesEntry.categories[exception.category] || 0) + 1;
    }

    /**
     * Obtenir les statistiques des exceptions
     */
    getExceptionStatistics(timeRange = null) {
        let logs = this.logs;
        
        // Filtrer par période si spécifiée
        if (timeRange) {
            const now = new Date();
            const from = new Date(now.getTime() - timeRange);
            logs = logs.filter(log => new Date(log.timestamp) >= from);
        }

        const stats = {
            total: logs.length,
            byLevel: {},
            byCategory: {},
            bySeverity: {},
            byComponent: {},
            recent: logs.slice(-10),
            trends: this.calculateTrends(logs)
        };

        // Calculer les statistiques par catégorie
        logs.forEach(log => {
            stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
            stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
            stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1;
            stats.byComponent[log.context.component] = (stats.byComponent[log.context.component] || 0) + 1;
        });

        return stats;
    }

    /**
     * Calculer les tendances
     */
    calculateTrends(logs) {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const recent = logs.filter(log => new Date(log.timestamp) >= oneHourAgo);
        const yesterday = logs.filter(log => {
            const logTime = new Date(log.timestamp);
            return logTime >= oneDayAgo && logTime < oneHourAgo;
        });

        return {
            hourlyRate: recent.length,
            dailyRate: logs.filter(log => new Date(log.timestamp) >= oneDayAgo).length,
            trend: recent.length > yesterday.length ? 'increasing' : 
                   recent.length < yesterday.length ? 'decreasing' : 'stable'
        };
    }

    // 🔍 INTERROGATION ET RECHERCHE

    /**
     * Rechercher des exceptions
     */
    searchExceptions(criteria = {}) {
        let results = Array.from(this.exceptions.values());

        // Filtrer par texte
        if (criteria.search) {
            const searchLower = criteria.search.toLowerCase();
            results = results.filter(exception => 
                exception.error.message.toLowerCase().includes(searchLower) ||
                exception.context.component.toLowerCase().includes(searchLower) ||
                exception.category.toLowerCase().includes(searchLower)
            );
        }

        // Filtrer par catégorie
        if (criteria.category) {
            results = results.filter(exception => exception.category === criteria.category);
        }

        // Filtrer par sévérité
        if (criteria.severity) {
            results = results.filter(exception => exception.severity === criteria.severity);
        }

        // Filtrer par composant
        if (criteria.component) {
            results = results.filter(exception => exception.context.component === criteria.component);
        }

        // Filtrer par période
        if (criteria.from || criteria.to) {
            results = results.filter(exception => {
                const timestamp = new Date(exception.timestamp);
                const fromOk = criteria.from ? timestamp >= new Date(criteria.from) : true;
                const toOk = criteria.to ? timestamp <= new Date(criteria.to) : true;
                return fromOk && toOk;
            });
        }

        // Filtrer par statut
        if (criteria.resolved !== undefined) {
            results = results.filter(exception => exception.resolved === criteria.resolved);
        }

        // Limiter et paginer
        const limit = criteria.limit || 50;
        const offset = criteria.offset || 0;

        return {
            results: results.slice(offset, offset + limit),
            total: results.length,
            hasMore: results.length > offset + limit
        };
    }

    /**
     * Obtenir une exception par ID
     */
    getExceptionById(exceptionId) {
        return this.exceptions.get(exceptionId);
    }

    /**
     * Résoudre une exception
     */
    resolveException(exceptionId, resolution = {}) {
        const exception = this.exceptions.get(exceptionId);
        if (!exception) {
            throw new Error(`Exception non trouvée: ${exceptionId}`);
        }

        exception.resolved = true;
        exception.resolvedAt = new Date().toISOString();
        exception.resolvedBy = resolution.resolvedBy || 'system';
        exception.resolution = resolution;

        // Mettre à jour les alertes associées
        for (const [alertId, alert] of this.alertState.activeAlerts.entries()) {
            if (alert.exceptionId === exceptionId) {
                alert.resolved = true;
                alert.resolvedAt = new Date().toISOString();
            }
        }

        this.emit('exception-resolved', exception);
        
        return exception;
    }

    // 🛠️ ACTIONS ET MAINTENANCE

    /**
     * Exécuter des actions immédiates pour les exceptions critiques
     */
    async executeImmediateActions(exception) {
        // Actions selon le type d'exception
        switch (exception.category) {
            case this.config.classification.categories.SYSTEM:
                await this.handleSystemCritical(exception);
                break;
            
            case this.config.classification.categories.NETWORK:
                await this.handleNetworkCritical(exception);
                break;
            
            case this.config.classification.categories.DATA:
                await this.handleDataCritical(exception);
                break;
        }
    }

    /**
     * Gérer une exception système critique
     */
    async handleSystemCritical(exception) {
        console.error('Action système critique requise pour:', exception.id);
        // Actions spécifiques au système
    }

    /**
     * Gérer une exception réseau critique
     */
    async handleNetworkCritical(exception) {
        console.error('Action réseau critique requise pour:', exception.id);
        // Actions de reconnexion, fallback, etc.
    }

    /**
     * Gérer une exception de données critique
     */
    async handleDataCritical(exception) {
        console.error('Action données critique requise pour:', exception.id);
        // Actions de sauvegarde, restauration, etc.
    }

    /**
     * Journaliser une exception critique
     */
    logCriticalException(exception) {
        const logEntry = {
            timestamp: exception.timestamp,
            level: 'CRITICAL',
            message: `CRITICAL: ${exception.error.message}`,
            category: exception.category,
            severity: exception.severity,
            context: exception.context,
            stack: exception.error.stack
        };

        // Log détaillé pour les exceptions critiques
        console.group('🚨 EXCEPTION CRITIQUE');
        console.error('ID:', exception.id);
        console.error('Message:', exception.error.message);
        console.error('Composant:', exception.context.component);
        console.error('Workflow:', exception.context.workflowId);
        console.error('Stack:', exception.error.stack);
        console.groupEnd();
    }

    /**
     * Journaliser une exception standard
     */
    logException(exception, level = null) {
        const logLevel = level || this.getLogLevel(exception.severity);
        
        const logEntry = {
            timestamp: exception.timestamp,
            level: logLevel,
            message: exception.error.message,
            category: exception.category,
            severity: exception.severity,
            context: exception.context
        };

        switch (logLevel) {
            case 'ERROR':
                console.error(logEntry.message, logEntry.context);
                break;
            case 'WARN':
                console.warn(logEntry.message, logEntry.context);
                break;
            case 'INFO':
                console.info(logEntry.message, logEntry.context);
                break;
            default:
                console.log(logEntry.message, logEntry.context);
        }
    }

    // 💾 PERSISTENCE

    /**
     * Sauvegarder en localStorage
     */
    saveToStorage() {
        try {
            const data = {
                logs: this.logs,
                exceptions: Array.from(this.exceptions.entries()),
                statistics: this.statistics,
                alerts: Array.from(this.alertState.activeAlerts.entries()),
                timestamp: Date.now()
            };

            localStorage.setItem(this.config.persistence.storageKey, JSON.stringify(data));
        } catch (error) {
            console.warn('Impossible de sauvegarder les logs d\'exceptions:', error);
        }
    }

    /**
     * Charger depuis localStorage
     */
    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.config.persistence.storageKey);
            if (stored) {
                const data = JSON.parse(stored);
                
                // Charger les logs
                if (data.logs) {
                    this.logs = data.logs.slice(-this.config.persistence.maxEntries);
                }
                
                // Charger les exceptions
                if (data.exceptions) {
                    this.exceptions = new Map(data.exceptions);
                }
                
                // Charger les statistiques
                if (data.statistics) {
                    this.statistics = data.statistics;
                }
                
                // Charger les alertes
                if (data.alerts) {
                    this.alertState.activeAlerts = new Map(data.alerts);
                }
            }
        } catch (error) {
            console.warn('Impossible de charger les logs d\'exceptions:', error);
        }
    }

    /**
     * Stocker une alerte en persistence
     */
    async storeAlertInStorage(alert) {
        try {
            const alertsKey = 'docucortex_alerts';
            const stored = localStorage.getItem(alertsKey);
            const alerts = stored ? JSON.parse(stored) : [];
            
            alerts.push(alert);
            
            // Garder seulement les 100 dernières alertes
            if (alerts.length > 100) {
                alerts.splice(0, alerts.length - 100);
            }
            
            localStorage.setItem(alertsKey, JSON.stringify(alerts));
        } catch (error) {
            console.warn('Impossible de sauvegarder l\'alerte:', error);
        }
    }

    /**
     * Envoyer une notification système
     */
    async sendSystemNotification(alert) {
        // Événement personnalisé pour l'intégration avec le système d'alertes
        window.dispatchEvent(new CustomEvent('docucortex-system-alert', {
            detail: alert
        }));
    }

    // 🛠️ UTILITAIRES

    /**
     * Démarrer les services de maintenance
     */
    startMaintenanceServices() {
        // Nettoyage périodique
        setInterval(() => {
            this.performCleanup();
        }, 300000); // 5 minutes
    }

    /**
     * Effectuer le nettoyage
     */
    performCleanup() {
        if (this.config.persistence.autoCleanup) {
            // Supprimer les exceptions résolues anciennes
            const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            
            for (const [exceptionId, exception] of this.exceptions.entries()) {
                if (exception.resolved && new Date(exception.resolvedAt) < oneWeekAgo) {
                    this.exceptions.delete(exceptionId);
                }
            }
            
            // Vider les logs anciens
            if (this.logs.length > this.config.persistence.maxEntries) {
                this.logs = this.logs.slice(-Math.floor(this.config.persistence.maxEntries / 2));
            }
            
            // Sauvegarder
            this.saveToStorage();
        }
    }

    /**
     * Obtenir le niveau de log depuis la sévérité
     */
    getLogLevel(severity) {
        const mapping = {
            [this.config.classification.severities.CRITICAL]: 'ERROR',
            [this.config.classification.severities.HIGH]: 'ERROR',
            [this.config.classification.severities.MEDIUM]: 'WARN',
            [this.config.classification.severities.LOW]: 'INFO',
            [this.config.classification.severities.INFO]: 'INFO'
        };
        
        return mapping[severity] || 'INFO';
    }

    /**
     * Vérifier si les notifications navigateur sont autorisées
     */
    hasNotificationPermission() {
        return 'Notification' in window && Notification.permission === 'granted';
    }

    /**
     * Vérifier si les exceptions de faible sévérité doivent être supprimées
     */
    shouldSuppressLowSeverity() {
        // Supprimer les exceptions d'info en production pour éviter le spam
        return false; // Ou selon la configuration
    }

    /**
     * Générer un ID d'exception
     */
    generateExceptionId() {
        return `EXC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Générer un ID de requête
     */
    generateRequestId() {
        return `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Générer un ID d'alerte
     */
    generateAlertId() {
        return `ALT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Générer un ID de notification
     */
    generateNotificationId() {
        return `NOT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
        // Sauvegarder avant l'arrêt
        this.saveToStorage();
        
        // Vider la file d'attente de notifications
        if (this.notificationTimer) {
            clearTimeout(this.notificationTimer);
        }
        
        this.emit('shutdown');
    }
}

// Export singleton
const exceptionHandler = new ExceptionHandler();

export default exceptionHandler;
export { ExceptionHandler };