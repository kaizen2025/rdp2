// src/services/alertManager.js - GESTIONNAIRE D'ALERTES ET INCIDENTS WORKFLOW
// Gestion centralisée des alertes avec escalation et notifications

import EventEmitter from 'events';

class AlertManager extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Niveaux d'alerte
            levels: {
                INFO: {
                    level: 0,
                    name: 'Information',
                    color: '#2196F3',
                    sound: false,
                    autoResolve: false
                },
                WARNING: {
                    level: 1,
                    name: 'Avertissement',
                    color: '#FF9800',
                    sound: true,
                    autoResolve: false
                },
                ERROR: {
                    level: 2,
                    name: 'Erreur',
                    color: '#F44336',
                    sound: true,
                    autoResolve: false
                },
                CRITICAL: {
                    level: 3,
                    name: 'Critique',
                    color: '#D32F2F',
                    sound: true,
                    autoResolve: false
                }
            },
            
            // Seuils et délais
            thresholds: {
                errorRate: config.errorRate || 0.1, // 10%
                responseTime: config.responseTime || 5000, // 5 secondes
                queueSize: config.queueSize || 1000,
                memoryUsage: config.memoryUsage || 0.8, // 80%
                concurrentOperations: config.concurrentOperations || 50
            },
            
            // Configuration des notifications
            notifications: {
                enabled: config.notificationsEnabled !== false,
                channels: {
                    browser: config.browserNotifications !== false,
                    email: config.emailNotifications !== false,
                    webhook: config.webhookNotifications !== false,
                    sms: config.smsNotifications !== false
                },
                batching: {
                    enabled: config.batchingEnabled !== false,
                    batchSize: config.batchSize || 5,
                    batchTimeout: config.batchTimeout || 30000 // 30 secondes
                }
            },
            
            // Escalade automatique
            escalation: {
                enabled: config.escalationEnabled !== false,
                levels: [
                    {
                        delay: 300000, // 5 minutes
                        recipients: ['admin'],
                        actions: ['notify']
                    },
                    {
                        delay: 900000, // 15 minutes
                        recipients: ['manager'],
                        actions: ['notify', 'escalate']
                    },
                    {
                        delay: 1800000, // 30 minutes
                        recipients: ['director'],
                        actions: ['notify', 'escalate', 'broadcast']
                    }
                ],
                maxEscalations: config.maxEscalations || 3
            },
            
            // Persistance
            persistence: {
                enabled: config.persistenceEnabled !== false,
                storage: config.storage || 'localStorage', // 'localStorage', 'sessionStorage'
                maxAlerts: config.maxAlerts || 1000,
                retentionDays: config.retentionDays || 30
            },
            
            // Auto-résolution
            autoResolve: {
                enabled: config.autoResolveEnabled !== false,
                conditions: {
                    noNewEvents: 600000, // 10 minutes
                    resolvedServices: true,
                    healthCheckPass: true
                }
            },
            
            ...config
        };

        // Stockage des alertes
        this.alerts = new Map();
        this.alertHistory = [];
        this.activeIncidents = new Map();
        this.escalationTimers = new Map();
        
        // Statistiques et métriques
        this.statistics = {
            totalAlerts: 0,
            alertsByLevel: {},
            alertsByCategory: {},
            alertsByComponent: {},
            averageResolutionTime: 0,
            incidentsToday: 0,
            autoResolvedAlerts: 0
        };
        
        // File d'attente des notifications
        this.notificationQueue = [];
        this.notificationTimer = null;
        
        // Services de santé
        this.healthChecks = new Map();
        this.healthStatus = {
            overall: 'healthy',
            lastCheck: Date.now(),
            components: {}
        };
        
        // Démarrer les services
        this.startServices();
    }

    /**
     * Créer une alerte
     */
    async createAlert(alertData) {
        const alert = this.buildAlert(alertData);
        
        try {
            // Valider l'alerte
            const validation = this.validateAlert(alert);
            if (!validation.isValid) {
                throw new Error(`Alerte invalide: ${validation.errors.join(', ')}`);
            }
            
            // Stocker l'alerte
            this.alerts.set(alert.id, alert);
            this.updateStatistics(alert);
            
            // Traiter l'alerte selon son niveau
            await this.processAlert(alert);
            
            // Sauvegarder si persistence activée
            if (this.config.persistence.enabled) {
                this.saveAlertToStorage(alert);
            }
            
            // Émettre des événements
            this.emit('alert-created', alert);
            this.emit(`alert-${alert.level.toLowerCase()}`, alert);
            
            // Vérifier si c'est le début d'un incident
            if (this.shouldCreateIncident(alert)) {
                await this.createIncident(alert);
            }
            
            console.log(`Alerte créée: ${alert.title} (${alert.level})`);
            
            return alert.id;
            
        } catch (error) {
            console.error('Erreur lors de la création de l\'alerte:', error);
            throw error;
        }
    }

    /**
     * Construire une alerte structurée
     */
    buildAlert(data) {
        const id = this.generateAlertId();
        
        return {
            id,
            title: data.title || 'Alerte sans titre',
            message: data.message || 'Aucun message fourni',
            level: data.level || 'WARNING',
            category: data.category || 'system',
            component: data.component || 'unknown',
            source: data.source || 'workflow',
            severity: data.severity || 'medium',
            
            // Contexte et métadonnées
            context: {
                workflowId: data.workflowId || null,
                executionId: data.executionId || null,
                taskId: data.taskId || null,
                userId: data.userId || null,
                sessionId: data.sessionId || null,
                requestId: data.requestId || this.generateRequestId(),
                ...data.context
            },
            
            // Métriques et données
            metrics: {
                responseTime: data.responseTime || null,
                errorCount: data.errorCount || 1,
                affectedUsers: data.affectedUsers || 0,
                serviceStatus: data.serviceStatus || 'unknown',
                ...data.metrics
            },
            
            // Actions et recommandations
            actions: data.actions || [],
            recommendations: data.recommendations || [],
            tags: data.tags || [],
            
            // État et timestamps
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            acknowledged: false,
            acknowledgedAt: null,
            acknowledgedBy: null,
            resolved: false,
            resolvedAt: null,
            resolvedBy: null,
            
            // Escalade
            escalated: false,
            escalationLevel: 0,
            escalationHistory: []
        };
    }

    /**
     * Valider une alerte
     */
    validateAlert(alert) {
        const errors = [];
        
        // Vérifications obligatoires
        if (!alert.title || alert.title.trim() === '') {
            errors.push('Le titre est requis');
        }
        
        if (!alert.message || alert.message.trim() === '') {
            errors.push('Le message est requis');
        }
        
        if (!this.config.levels[alert.level]) {
            errors.push(`Niveau d\'alerte invalide: ${alert.level}`);
        }
        
        // Vérifications de contenu
        if (alert.title.length > 200) {
            errors.push('Le titre ne peut pas dépasser 200 caractères');
        }
        
        if (alert.message.length > 2000) {
            errors.push('Le message ne peut pas dépasser 2000 caractères');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Traiter une alerte
     */
    async processAlert(alert) {
        const level = this.config.levels[alert.level];
        
        // Actions selon le niveau
        switch (alert.level) {
            case 'INFO':
                await this.handleInfoAlert(alert);
                break;
            case 'WARNING':
                await this.handleWarningAlert(alert);
                break;
            case 'ERROR':
                await this.handleErrorAlert(alert);
                break;
            case 'CRITICAL':
                await this.handleCriticalAlert(alert);
                break;
        }
        
        // Programmer l'escalade si nécessaire
        if (this.config.escalation.enabled) {
            await this.scheduleEscalation(alert);
        }
        
        // Notifications
        await this.queueNotification(alert);
    }

    // 🔔 GESTION DES NIVEAUX D'ALERTE

    /**
     * Gérer une alerte INFO
     */
    async handleInfoAlert(alert) {
        // Logging simple pour les informations
        console.info(`[INFO] ${alert.title}: ${alert.message}`);
        
        // Notification silencieuse si activée
        if (this.config.notifications.enabled) {
            this.queueSilentNotification(alert);
        }
    }

    /**
     * Gérer une alerte WARNING
     */
    async handleWarningAlert(alert) {
        // Notification standard
        console.warn(`[WARNING] ${alert.title}: ${alert.message}`);
        
        // Notification navigateur avec son
        if (this.shouldNotifyBrowser(alert)) {
            await this.sendBrowserNotification(alert, {
                requireInteraction: false,
                silent: false
            });
        }
        
        // Vérifier les seuils de santé
        await this.checkHealthThresholds(alert);
    }

    /**
     * Gérer une alerte ERROR
     */
    async handleErrorAlert(alert) {
        // Notification prioritaire
        console.error(`[ERROR] ${alert.title}: ${alert.message}`);
        
        // Notification navigateur avec interaction requise
        if (this.shouldNotifyBrowser(alert)) {
            await this.sendBrowserNotification(alert, {
                requireInteraction: true,
                silent: false
            });
        }
        
        // Actions correctives automatiques
        await this.executeCorrectiveActions(alert);
        
        // Marquer le service comme dégradé
        this.markComponentDegraded(alert.component);
    }

    /**
     * Gérer une alerte CRITIQUE
     */
    async handleCriticalAlert(alert) {
        // Notification d'urgence
        console.error(`[CRITICAL] ${alert.title}: ${alert.message}`);
        
        // Notification navigateur avec action requise
        if (this.shouldNotifyBrowser(alert)) {
            await this.sendBrowserNotification(alert, {
                requireInteraction: true,
                silent: false
            });
        }
        
        // Actions d'urgence
        await this.executeEmergencyActions(alert);
        
        // Marquer le service comme indisponible
        this.markComponentDown(alert.component);
        
        // Créer un incident critique
        await this.createCriticalIncident(alert);
    }

    // 🚨 GESTION DES INCIDENTS

    /**
     * Vérifier s'il faut créer un incident
     */
    shouldCreateIncident(alert) {
        // Créer un incident pour les erreurs critiques et multiples erreurs
        if (alert.level === 'CRITICAL') {
            return true;
        }
        
        // Compter les erreurs récentes du même composant
        const recentErrors = this.getRecentAlerts({
            level: 'ERROR',
            component: alert.component,
            timeWindow: 300000 // 5 minutes
        });
        
        if (recentErrors.length >= 5) {
            return true;
        }
        
        return false;
    }

    /**
     * Créer un incident
     */
    async createIncident(alert) {
        const incident = {
            id: this.generateIncidentId(),
            title: `Incident: ${alert.title}`,
            description: alert.message,
            severity: this.mapAlertToIncidentSeverity(alert.level),
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            
            // Relations
            relatedAlerts: [alert.id],
            affectedComponents: [alert.component],
            impactedServices: this.getImpactedServices(alert),
            
            // Gestion
            assignedTo: null,
            priority: this.calculateIncidentPriority(alert),
            estimatedResolution: this.estimateResolutionTime(alert),
            
            // Escalade
            escalated: false,
            escalationLevel: 0,
            
            // Métriques
            metrics: {
                detectionTime: Date.now(),
                firstAlertTime: alert.createdAt,
                alertCount: 1,
                affectedUsers: alert.metrics.affectedUsers || 0
            }
        };
        
        this.activeIncidents.set(incident.id, incident);
        this.statistics.incidentsToday++;
        
        // Émettre un événement
        this.emit('incident-created', incident);
        
        console.log(`Incident créé: ${incident.id} - ${incident.title}`);
        
        return incident.id;
    }

    /**
     * Créer un incident critique
     */
    async createCriticalIncident(alert) {
        const incidentId = await this.createIncident(alert);
        
        // Actions immédiates pour les incidents critiques
        await this.executeIncidentActions(incidentId, 'critical');
        
        // Notification d'urgence
        await this.sendUrgentNotification(incidentId, alert);
    }

    // 📢 NOTIFICATIONS

    /**
     * Mettre en file d'attente une notification
     */
    async queueNotification(alert) {
        if (!this.config.notifications.enabled) return;
        
        const notification = {
            id: this.generateNotificationId(),
            alert,
            priority: this.getNotificationPriority(alert.level),
            channels: this.getNotificationChannels(alert),
            createdAt: Date.now()
        };
        
        this.notificationQueue.push(notification);
        
        // Traiter immédiatement si prioritaire
        if (notification.priority === 'high') {
            await this.processNotification(notification);
        } else if (!this.notificationTimer) {
            // Démarrer le timer de traitement en lot
            this.notificationTimer = setTimeout(() => {
                this.processNotificationBatch();
            }, this.config.notifications.batching.batchTimeout);
        }
    }

    /**
     * Traiter une notification
     */
    async processNotification(notification) {
        const { alert, channels } = notification;
        
        for (const channel of channels) {
            try {
                switch (channel) {
                    case 'browser':
                        await this.sendBrowserNotification(alert);
                        break;
                    case 'email':
                        await this.sendEmailNotification(alert);
                        break;
                    case 'webhook':
                        await this.sendWebhookNotification(alert);
                        break;
                    case 'sms':
                        await this.sendSmsNotification(alert);
                        break;
                }
                
                this.emit('notification-sent', {
                    channel,
                    alertId: alert.id,
                    notificationId: notification.id
                });
                
            } catch (error) {
                console.error(`Erreur envoi notification ${channel}:`, error);
                
                this.emit('notification-failed', {
                    channel,
                    alertId: alert.id,
                    error: error.message
                });
            }
        }
    }

    /**
     * Traiter un lot de notifications
     */
    async processNotificationBatch() {
        if (this.notificationQueue.length === 0) return;
        
        const batch = this.notificationQueue.splice(0, this.config.notifications.batching.batchSize);
        
        for (const notification of batch) {
            await this.processNotification(notification);
        }
        
        // Programmer le prochain lot
        if (this.notificationQueue.length > 0) {
            this.notificationTimer = setTimeout(() => {
                this.processNotificationBatch();
            }, this.config.notifications.batching.batchTimeout);
        } else {
            this.notificationTimer = null;
        }
    }

    /**
     * Envoyer une notification navigateur
     */
    async sendBrowserNotification(alert, options = {}) {
        if (!this.hasNotificationPermission()) {
            throw new Error('Permissions de notification manquantes');
        }
        
        const { requireInteraction = false, silent = false } = options;
        
        const notification = new Notification(alert.title, {
            body: alert.message,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: `alert-${alert.id}`,
            requireInteraction,
            silent,
            data: {
                alertId: alert.id,
                level: alert.level,
                component: alert.component
            }
        });
        
        // Actions cliquables
        notification.onclick = () => {
            window.focus();
            this.openAlertDetails(alert.id);
            notification.close();
        };
        
        // Auto-fermeture selon le niveau
        const autoCloseTime = this.getAutoCloseTime(alert.level);
        setTimeout(() => notification.close(), autoCloseTime);
        
        return notification;
    }

    /**
     * Envoyer une notification email
     */
    async sendEmailNotification(alert) {
        // Simulation d'envoi d'email
        console.log(`Envoi email pour alerte ${alert.id}:`, {
            to: this.getNotificationRecipients('email'),
            subject: `[${alert.level}] ${alert.title}`,
            body: alert.message
        });
        
        // En production, intégration avec un service d'email
        // const response = await emailService.send({...});
    }

    /**
     * Envoyer une notification webhook
     */
    async sendWebhookNotification(alert) {
        const webhookData = {
            alert: {
                id: alert.id,
                title: alert.title,
                message: alert.message,
                level: alert.level,
                category: alert.category,
                component: alert.component,
                createdAt: alert.createdAt
            },
            timestamp: new Date().toISOString(),
            source: 'DocuCortex Alert Manager'
        };
        
        console.log(`Envoi webhook pour alerte ${alert.id}:`, webhookData);
        
        // En production, envoi HTTP POST vers webhook configuré
        // await fetch(webhookUrl, { method: 'POST', body: JSON.stringify(webhookData) });
    }

    /**
     * Envoyer une notification SMS
     */
    async sendSmsNotification(alert) {
        // Simulation d'envoi SMS
        console.log(`Envoi SMS pour alerte ${alert.id}:`, {
            to: this.getNotificationRecipients('sms'),
            message: `[${alert.level}] ${alert.title}: ${alert.message.substring(0, 100)}...`
        });
        
        // En production, intégration avec un service SMS
        // await smsService.send({...});
    }

    // 📊 ACTIONS CORRECTIVES

    /**
     * Exécuter des actions correctives
     */
    async executeCorrectiveActions(alert) {
        const actions = [];
        
        switch (alert.category) {
            case 'performance':
                actions.push(...await this.handlePerformanceAlert(alert));
                break;
            case 'security':
                actions.push(...await this.handleSecurityAlert(alert));
                break;
            case 'availability':
                actions.push(...await this.handleAvailabilityAlert(alert));
                break;
            case 'data':
                actions.push(...await this.handleDataAlert(alert));
                break;
        }
        
        return actions;
    }

    /**
     * Gérer une alerte de performance
     */
    async handlePerformanceAlert(alert) {
        const actions = [];
        
        // Redémarrer le service si nécessaire
        if (alert.metrics.responseTime > 10000) { // 10 secondes
            actions.push('service_restart_scheduled');
            console.log(`Redémarrage programmé pour ${alert.component}`);
        }
        
        // Augmenter les ressources si possible
        if (alert.metrics.memoryUsage > 0.8) {
            actions.push('resources_scaling_requested');
        }
        
        return actions;
    }

    /**
     * Gérer une alerte de sécurité
     */
    async handleSecurityAlert(alert) {
        const actions = [];
        
        // Bloquer l'accès si nécessaire
        if (alert.severity === 'high') {
            actions.push('access_blocked');
            console.log(`Accès bloqué pour ${alert.component}`);
        }
        
        // Notifier l'équipe sécurité
        actions.push('security_team_notified');
        
        return actions;
    }

    /**
     * Gérer une alerte de disponibilité
     */
    async handleAvailabilityAlert(alert) {
        const actions = [];
        
        // Basculer vers un service de secours
        actions.push('failover_initiated');
        
        // Notifier les utilisateurs
        actions.push('user_notification_scheduled');
        
        return actions;
    }

    /**
     * Gérer une alerte de données
     */
    async handleDataAlert(alert) {
        const actions = [];
        
        // Lancer une sauvegarde
        actions.push('backup_initiated');
        
        // Vérifier l'intégrité
        actions.push('integrity_check_scheduled');
        
        return actions;
    }

    // ⚡ ACTIONS D'URGENCE

    /**
     * Exécuter des actions d'urgence
     */
    async executeEmergencyActions(alert) {
        const actions = [];
        
        // Arrêt d'urgence si nécessaire
        if (alert.level === 'CRITICAL') {
            actions.push('emergency_shutdown_initiated');
            console.log(`Arrêt d'urgence initié pour ${alert.component}`);
        }
        
        // Notification d'urgence
        actions.push('emergency_notification_sent');
        
        // Activation du mode dégradé
        actions.push('degraded_mode_activated');
        
        return actions;
    }

    // 📈 SURVEILLANCE ET SANTÉ

    /**
     * Vérifier les seuils de santé
     */
    async checkHealthThresholds(alert) {
        const checks = [
            this.checkErrorRate(alert),
            this.checkResponseTime(alert),
            this.checkQueueSize(alert),
            this.checkMemoryUsage(alert)
        ];
        
        for (const check of checks) {
            if (check.triggered) {
                await this.createHealthCheckAlert(check);
            }
        }
    }

    /**
     * Vérifier le taux d'erreur
     */
    checkErrorRate(alert) {
        // Simulation de calcul du taux d'erreur
        const errorRate = Math.random() * 0.2; // 0-20%
        
        return {
            triggered: errorRate > this.config.thresholds.errorRate,
            metric: 'errorRate',
            value: errorRate,
            threshold: this.config.thresholds.errorRate
        };
    }

    /**
     * Vérifier le temps de réponse
     */
    checkResponseTime(alert) {
        const responseTime = alert.metrics.responseTime || 0;
        
        return {
            triggered: responseTime > this.config.thresholds.responseTime,
            metric: 'responseTime',
            value: responseTime,
            threshold: this.config.thresholds.responseTime
        };
    }

    /**
     * Vérifier la taille de la file
     */
    checkQueueSize(alert) {
        const queueSize = this.getQueueSize(alert.component);
        
        return {
            triggered: queueSize > this.config.thresholds.queueSize,
            metric: 'queueSize',
            value: queueSize,
            threshold: this.config.thresholds.queueSize
        };
    }

    /**
     * Vérifier l'utilisation mémoire
     */
    checkMemoryUsage(alert) {
        const memoryUsage = alert.metrics.memoryUsage || 0;
        
        return {
            triggered: memoryUsage > this.config.thresholds.memoryUsage,
            metric: 'memoryUsage',
            value: memoryUsage,
            threshold: this.config.thresholds.memoryUsage
        };
    }

    // 🔄 ESCALADE

    /**
     * Programmer l'escalade
     */
    async scheduleEscalation(alert) {
        if (!this.config.escalation.enabled) return;
        
        for (let i = 0; i < this.config.escalation.levels.length; i++) {
            const escalationLevel = this.config.escalation.levels[i];
            
            const timer = setTimeout(async () => {
                await this.executeEscalation(alert, i + 1);
            }, escalationLevel.delay);
            
            this.escalationTimers.set(`${alert.id}_${i + 1}`, timer);
        }
    }

    /**
     * Exécuter l'escalade
     */
    async executeEscalation(alert, level) {
        const escalationConfig = this.config.escalation.levels[level - 1];
        if (!escalationConfig) return;
        
        // Mettre à jour l'alerte
        alert.escalated = true;
        alert.escalationLevel = level;
        alert.escalationHistory.push({
            level,
            timestamp: new Date().toISOString(),
            actions: escalationConfig.actions
        });
        
        // Exécuter les actions d'escalade
        for (const action of escalationConfig.actions) {
            switch (action) {
                case 'notify':
                    await this.sendEscalationNotification(alert, escalationConfig);
                    break;
                case 'escalate':
                    await this.escalateToSuperior(alert, escalationConfig);
                    break;
                case 'broadcast':
                    await this.broadcastAlert(alert);
                    break;
            }
        }
        
        this.emit('alert-escalated', {
            alertId: alert.id,
            level,
            recipients: escalationConfig.recipients,
            actions: escalationConfig.actions
        });
        
        console.log(`Alerte ${alert.id} escaladée au niveau ${level}`);
    }

    // 📋 GESTION DES ALERTES

    /**
     * Accepter une alerte
     */
    acknowledgeAlert(alertId, acknowledgedBy = 'system') {
        const alert = this.alerts.get(alertId);
        if (!alert) {
            throw new Error(`Alerte non trouvée: ${alertId}`);
        }
        
        alert.acknowledged = true;
        alert.acknowledgedAt = new Date().toISOString();
        alert.acknowledgedBy = acknowledgedBy;
        alert.updatedAt = new Date().toISOString();
        
        this.emit('alert-acknowledged', {
            alertId,
            acknowledgedBy,
            timestamp: alert.acknowledgedAt
        });
        
        return alert;
    }

    /**
     * Résoudre une alerte
     */
    resolveAlert(alertId, resolvedBy = 'system', resolution = '') {
        const alert = this.alerts.get(alertId);
        if (!alert) {
            throw new Error(`Alerte non trouvée: ${alertId}`);
        }
        
        alert.resolved = true;
        alert.resolvedAt = new Date().toISOString();
        alert.resolvedBy = resolvedBy;
        alert.resolution = resolution;
        alert.updatedAt = new Date().toISOString();
        
        // Annuler les timers d'escalade
        this.cancelEscalationTimers(alertId);
        
        // Mettre à jour les incidents liés
        this.updateRelatedIncidents(alertId);
        
        this.emit('alert-resolved', {
            alertId,
            resolvedBy,
            resolution,
            timestamp: alert.resolvedAt
        });
        
        return alert;
    }

    /**
     * Rechercher des alertes
     */
    searchAlerts(criteria = {}) {
        let results = Array.from(this.alerts.values());
        
        // Filtrer par niveau
        if (criteria.level) {
            results = results.filter(alert => alert.level === criteria.level);
        }
        
        // Filtrer par statut
        if (criteria.status) {
            results = results.filter(alert => alert.status === criteria.status);
        }
        
        // Filtrer par composant
        if (criteria.component) {
            results = results.filter(alert => alert.component === criteria.component);
        }
        
        // Filtrer par période
        if (criteria.from || criteria.to) {
            results = results.filter(alert => {
                const timestamp = new Date(alert.createdAt);
                const fromOk = criteria.from ? timestamp >= new Date(criteria.from) : true;
                const toOk = criteria.to ? timestamp <= new Date(criteria.to) : true;
                return fromOk && toOk;
            });
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
     * Obtenir une alerte par ID
     */
    getAlertById(alertId) {
        return this.alerts.get(alertId);
    }

    /**
     * Obtenir les alertes actives
     */
    getActiveAlerts() {
        return Array.from(this.alerts.values())
            .filter(alert => !alert.resolved)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // 📊 STATISTIQUES ET MÉTRIQUES

    /**
     * Mettre à jour les statistiques
     */
    updateStatistics(alert) {
        this.statistics.totalAlerts++;
        this.statistics.alertsByLevel[alert.level] = 
            (this.statistics.alertsByLevel[alert.level] || 0) + 1;
        this.statistics.alertsByCategory[alert.category] = 
            (this.statistics.alertsByCategory[alert.category] || 0) + 1;
        this.statistics.alertsByComponent[alert.component] = 
            (this.statistics.alertsByComponent[alert.component] || 0) + 1;
    }

    /**
     * Obtenir les statistiques
     */
    getStatistics() {
        const activeAlerts = this.getActiveAlerts();
        const today = new Date().toDateString();
        const todayAlerts = Array.from(this.alerts.values())
            .filter(alert => new Date(alert.createdAt).toDateString() === today);
        
        return {
            overview: {
                totalAlerts: this.statistics.totalAlerts,
                activeAlerts: activeAlerts.length,
                incidentsToday: this.statistics.incidentsToday,
                autoResolvedAlerts: this.statistics.autoResolvedAlerts
            },
            byLevel: this.statistics.alertsByLevel,
            byCategory: this.statistics.alertsByCategory,
            byComponent: this.statistics.alertsByComponent,
            recentActivity: todayAlerts.slice(-20),
            healthStatus: this.healthStatus
        };
    }

    // 💾 PERSISTANCE

    /**
     * Sauvegarder une alerte
     */
    saveAlertToStorage(alert) {
        if (!this.config.persistence.enabled) return;
        
        try {
            const storageKey = this.getStorageKey();
            const stored = localStorage.getItem(storageKey);
            const alerts = stored ? JSON.parse(stored) : [];
            
            alerts.push(alert);
            
            // Limiter le nombre d'alertes stockées
            if (alerts.length > this.config.persistence.maxAlerts) {
                alerts.splice(0, alerts.length - this.config.persistence.maxAlerts);
            }
            
            localStorage.setItem(storageKey, JSON.stringify(alerts));
            
        } catch (error) {
            console.warn('Impossible de sauvegarder l\'alerte:', error);
        }
    }

    /**
     * Charger les alertes depuis le stockage
     */
    loadAlertsFromStorage() {
        if (!this.config.persistence.enabled) return;
        
        try {
            const storageKey = this.getStorageKey();
            const stored = localStorage.getItem(storageKey);
            
            if (stored) {
                const alerts = JSON.parse(stored);
                
                alerts.forEach(alert => {
                    this.alerts.set(alert.id, alert);
                });
                
                console.log(`Chargé ${alerts.length} alertes depuis le stockage`);
            }
            
        } catch (error) {
            console.warn('Impossible de charger les alertes:', error);
        }
    }

    // 🛠️ SERVICES ET MAINTENANCE

    /**
     * Démarrer les services
     */
    startServices() {
        // Charger les alertes sauvegardées
        if (this.config.persistence.enabled) {
            this.loadAlertsFromStorage();
        }
        
        // Démarrer la surveillance de santé
        this.startHealthMonitoring();
        
        // Démarrer l'auto-résolution
        if (this.config.autoResolve.enabled) {
            this.startAutoResolve();
        }
        
        // Nettoyage périodique
        setInterval(() => {
            this.performCleanup();
        }, 300000); // 5 minutes
    }

    /**
     * Démarrer la surveillance de santé
     */
    startHealthMonitoring() {
        setInterval(() => {
            this.performHealthCheck();
        }, 60000); // 1 minute
    }

    /**
     * Effectuer une vérification de santé
     */
    async performHealthCheck() {
        const components = ['workflow-engine', 'api-service', 'database', 'cache'];
        
        for (const component of components) {
            const health = await this.checkComponentHealth(component);
            this.healthStatus.components[component] = health;
            
            if (health.status !== 'healthy') {
                await this.createAlert({
                    title: `Problème de santé: ${component}`,
                    message: health.message,
                    level: health.severity,
                    category: 'health',
                    component,
                    metrics: health.metrics
                });
            }
        }
        
        // Mettre à jour l'état global
        this.healthStatus.overall = this.calculateOverallHealth();
        this.healthStatus.lastCheck = Date.now();
        
        this.emit('health-check-completed', this.healthStatus);
    }

    /**
     * Vérifier la santé d'un composant
     */
    async checkComponentHealth(component) {
        // Simulation de vérification de santé
        const health = {
            status: 'healthy',
            message: 'Composant opérationnel',
            severity: 'INFO',
            metrics: {
                responseTime: Math.random() * 1000,
                memoryUsage: Math.random(),
                errorRate: Math.random() * 0.05
            },
            timestamp: Date.now()
        };
        
        // Simuler des problèmes occasionnels
        if (Math.random() < 0.1) { // 10% de chance
            health.status = 'degraded';
            health.message = 'Performance dégradée';
            health.severity = 'WARNING';
        } else if (Math.random() < 0.02) { // 2% de chance
            health.status = 'down';
            health.message = 'Composant indisponible';
            health.severity = 'CRITICAL';
        }
        
        this.healthChecks.set(component, health);
        return health;
    }

    /**
     * Démarrer l'auto-résolution
     */
    startAutoResolve() {
        setInterval(() => {
            this.checkAutoResolveConditions();
        }, 60000); // 1 minute
    }

    /**
     * Vérifier les conditions d'auto-résolution
     */
    async checkAutoResolveConditions() {
        const conditions = this.config.autoResolve.conditions;
        const activeAlerts = this.getActiveAlerts();
        
        for (const alert of activeAlerts) {
            if (alert.level === 'INFO' || alert.level === 'WARNING') {
                const age = Date.now() - new Date(alert.createdAt).getTime();
                
                // Vérifier si l'alerte est assez ancienne
                if (age > conditions.noNewEvents) {
                    // Vérifier qu'il n'y a pas de nouvelles erreurs
                    const recentErrors = this.getRecentAlerts({
                        level: 'ERROR',
                        component: alert.component,
                        timeWindow: conditions.noNewEvents
                    });
                    
                    if (recentErrors.length === 0) {
                        await this.resolveAlert(alert.id, 'auto-resolve', 'Auto-résolu: plus d\'erreurs détectées');
                        this.statistics.autoResolvedAlerts++;
                    }
                }
            }
        }
    }

    /**
     * Effectuer le nettoyage
     */
    performCleanup() {
        // Nettoyer les alertes anciennes résolues
        const retentionTime = this.config.persistence.retentionDays * 24 * 60 * 60 * 1000;
        const cutoff = Date.now() - retentionTime;
        
        for (const [alertId, alert] of this.alerts.entries()) {
            if (alert.resolved && new Date(alert.resolvedAt).getTime() < cutoff) {
                this.alerts.delete(alertId);
            }
        }
        
        // Nettoyer les incidents résolus
        for (const [incidentId, incident] of this.activeIncidents.entries()) {
            if (incident.status === 'resolved' && 
                new Date(incident.resolvedAt).getTime() < cutoff) {
                this.activeIncidents.delete(incidentId);
            }
        }
        
        this.emit('cleanup-performed', {
            timestamp: new Date().toISOString(),
            remainingAlerts: this.alerts.size,
            remainingIncidents: this.activeIncidents.size
        });
    }

    // 🛠️ UTILITAIRES

    /**
     * Générer un ID d'alerte
     */
    generateAlertId() {
        return `ALT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Générer un ID d'incident
     */
    generateIncidentId() {
        return `INC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Générer un ID de requête
     */
    generateRequestId() {
        return `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Générer un ID de notification
     */
    generateNotificationId() {
        return `NOT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Obtenir les alertes récentes
     */
    getRecentAlerts(criteria) {
        const { level, component, timeWindow } = criteria;
        const cutoff = Date.now() - timeWindow;
        
        return Array.from(this.alerts.values()).filter(alert => {
            const alertTime = new Date(alert.createdAt).getTime();
            return alertTime >= cutoff &&
                   (!level || alert.level === level) &&
                   (!component || alert.component === component);
        });
    }

    /**
     * Obtenir la clé de stockage
     */
    getStorageKey() {
        return `docucortex_alerts_${this.config.persistence.storage}`;
    }

    /**
     * Obtenir les destinataires de notification
     */
    getNotificationRecipients(channel) {
        // Simulation - en production, query user management system
        const recipients = {
            email: ['admin@docucortex.com', 'ops@docucortex.com'],
            sms: ['+33123456789', '+33987654321'],
            webhook: ['https://hooks.slack.com/services/...']
        };
        
        return recipients[channel] || [];
    }

    /**
     * Vérifier les permissions de notification
     */
    hasNotificationPermission() {
        return 'Notification' in window && Notification.permission === 'granted';
    }

    /**
     * Ouvrir les détails d'une alerte
     */
    openAlertDetails(alertId) {
        // Émettre un événement pour ouvrir les détails
        window.dispatchEvent(new CustomEvent('open-alert-details', {
            detail: { alertId }
        }));
    }

    /**
     * Obtenir le temps de fermeture automatique
     */
    getAutoCloseTime(level) {
        const times = {
            INFO: 10000,     // 10 secondes
            WARNING: 15000,  // 15 secondes
            ERROR: 30000,    // 30 secondes
            CRITICAL: 60000  // 1 minute
        };
        
        return times[level] || 15000;
    }

    /**
     * Obtenir la priorité de notification
     */
    getNotificationPriority(level) {
        const priorities = {
            INFO: 'low',
            WARNING: 'medium',
            ERROR: 'high',
            CRITICAL: 'urgent'
        };
        
        return priorities[level] || 'medium';
    }

    /**
     * Obtenir les canaux de notification
     */
    getNotificationChannels(alert) {
        const availableChannels = Object.entries(this.config.notifications.channels)
            .filter(([_, enabled]) => enabled)
            .map(([channel, _]) => channel);
        
        // Ajuster selon le niveau
        if (alert.level === 'CRITICAL') {
            return ['browser', 'email', 'webhook', 'sms'];
        } else if (alert.level === 'ERROR') {
            return ['browser', 'email', 'webhook'];
        } else if (alert.level === 'WARNING') {
            return ['browser', 'webhook'];
        } else {
            return ['webhook'];
        }
    }

    /**
     * Vérifier si on doit notifier le navigateur
     */
    shouldNotifyBrowser(alert) {
        if (!this.config.notifications.channels.browser) return false;
        if (!this.hasNotificationPermission()) return false;
        if (alert.level === 'INFO') return false;
        
        return true;
    }

    /**
     * Marquer un composant comme dégradé
     */
    markComponentDegraded(component) {
        this.healthStatus.components[component] = {
            ...this.healthStatus.components[component],
            status: 'degraded',
            lastDegraded: Date.now()
        };
    }

    /**
     * Marquer un composant comme indisponible
     */
    markComponentDown(component) {
        this.healthStatus.components[component] = {
            ...this.healthStatus.components[component],
            status: 'down',
            lastDown: Date.now()
        };
    }

    /**
     * Calculer l'état de santé global
     */
    calculateOverallHealth() {
        const components = Object.values(this.healthStatus.components);
        
        if (components.length === 0) return 'unknown';
        
        const downCount = components.filter(c => c.status === 'down').length;
        const degradedCount = components.filter(c => c.status === 'degraded').length;
        const totalCount = components.length;
        
        if (downCount > 0) return 'critical';
        if (degradedCount > totalCount * 0.5) return 'degraded';
        if (degradedCount > 0) return 'warning';
        return 'healthy';
    }

    /**
     * Obtenir la taille d'une file
     */
    getQueueSize(component) {
        // Simulation - en production, query actual queue
        return Math.floor(Math.random() * 2000);
    }

    /**
     * Obtenir les services impactés
     */
    getImpactedServices(alert) {
        const serviceMapping = {
            'workflow-engine': ['workflows', 'executions'],
            'api-service': ['loans', 'users', 'documents'],
            'database': ['all-services'],
            'cache': ['performance']
        };
        
        return serviceMapping[alert.component] || [alert.component];
    }

    /**
     * Mapper l'alerte vers la sévérité d'incident
     */
    mapAlertToIncidentSeverity(alertLevel) {
        const mapping = {
            'INFO': 'minor',
            'WARNING': 'moderate',
            'ERROR': 'major',
            'CRITICAL': 'severe'
        };
        
        return mapping[alertLevel] || 'minor';
    }

    /**
     * Calculer la priorité d'incident
     */
    calculateIncidentPriority(alert) {
        // Algorithme simple de priorité
        let priority = 5; // Base
        
        // Ajustements selon le niveau
        const levelAdjustments = {
            'INFO': 0,
            'WARNING': 1,
            'ERROR': 2,
            'CRITICAL': 3
        };
        
        priority -= levelAdjustments[alert.level] || 0;
        
        // Ajustements selon l'impact
        if (alert.metrics.affectedUsers > 100) priority -= 2;
        else if (alert.metrics.affectedUsers > 10) priority -= 1;
        
        return Math.max(1, Math.min(5, priority));
    }

    /**
     * Estimer le temps de résolution
     */
    estimateResolutionTime(alert) {
        const estimates = {
            'INFO': 300000,     // 5 minutes
            'WARNING': 900000,  // 15 minutes
            'ERROR': 3600000,   // 1 heure
            'CRITICAL': 7200000 // 2 heures
        };
        
        return Date.now() + (estimates[alert.level] || 1800000);
    }

    /**
     * Annuler les timers d'escalade
     */
    cancelEscalationTimers(alertId) {
        for (const [key, timer] of this.escalationTimers.entries()) {
            if (key.startsWith(alertId)) {
                clearTimeout(timer);
                this.escalationTimers.delete(key);
            }
        }
    }

    /**
     * Mettre à jour les incidents liés
     */
    updateRelatedIncidents(alertId) {
        for (const [incidentId, incident] of this.activeIncidents.entries()) {
            if (incident.relatedAlerts.includes(alertId)) {
                // Vérifier si tous les alertes liées sont résolues
                const unresolvedAlerts = incident.relatedAlerts.filter(alertId => {
                    const alert = this.alerts.get(alertId);
                    return alert && !alert.resolved;
                });
                
                if (unresolvedAlerts.length === 0) {
                    // Marquer l'incident comme résolu
                    incident.status = 'resolved';
                    incident.resolvedAt = new Date().toISOString();
                }
            }
        }
    }

    /**
     * Envoyer une notification d'escalade
     */
    async sendEscalationNotification(alert, escalationConfig) {
        // Notification prioritaire pour l'escalade
        console.log(`Escalade niveau ${alert.escalationLevel}:`, {
            alertId: alert.id,
            recipients: escalationConfig.recipients,
            level: alert.level
        });
    }

    /**
     * Escaler vers un supérieur
     */
    async escalateToSuperior(alert, escalationConfig) {
        // Logique d'escalade vers un niveau supérieur
        console.log(`Escalade vers supérieur pour alerte ${alert.id}`);
    }

    /**
     * Diffuser l'alerte
     */
    async broadcastAlert(alert) {
        // Diffusion de l'alerte à tous les canaux
        this.emit('alert-broadcast', alert);
    }

    /**
     * Envoyer une notification d'urgence
     */
    async sendUrgentNotification(incidentId, alert) {
        // Notification d'urgence pour les incidents critiques
        console.log(`Notification d'urgence pour incident ${incidentId}`);
    }

    /**
     * Exécuter des actions d'incident
     */
    async executeIncidentActions(incidentId, severity) {
        // Actions automatiques selon la sévérité
        if (severity === 'critical') {
            // Actions d'urgence immédiates
            console.log(`Actions d'urgence pour incident ${incidentId}`);
        }
    }

    /**
     * Créer une alerte de vérification de santé
     */
    async createHealthCheckAlert(check) {
        await this.createAlert({
            title: `Santé: ${check.metric} élevé`,
            message: `${check.metric} = ${check.value.toFixed(2)}, seuil = ${check.threshold}`,
            level: 'WARNING',
            category: 'health',
            component: 'system'
        });
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
        // Nettoyer les timers
        for (const timer of this.escalationTimers.values()) {
            clearTimeout(timer);
        }
        
        if (this.notificationTimer) {
            clearTimeout(this.notificationTimer);
        }
        
        this.emit('shutdown');
    }
}

// Export singleton
const alertManager = new AlertManager();

export default alertManager;
export { AlertManager };