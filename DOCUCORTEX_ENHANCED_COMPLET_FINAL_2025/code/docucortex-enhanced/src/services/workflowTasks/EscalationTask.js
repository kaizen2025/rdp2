// src/services/workflowTasks/EscalationTask.js - TÂCHE D'ESCALADE AUTOMATIQUE WORKFLOW
// Gère l'escalade automatique des problèmes et incidents selon des règles prédéfinies

import apiService from '../apiService';

class EscalationTask {
    constructor(config = {}) {
        this.config = {
            // Niveaux d'escalade
            levels: config.levels || [
                {
                    level: 1,
                    name: 'Premier niveau',
                    timeout: 24 * 60 * 60 * 1000, // 24h
                    recipients: ['supervisor'],
                    actions: ['notify', 'remind']
                },
                {
                    level: 2,
                    name: 'Deuxième niveau',
                    timeout: 48 * 60 * 60 * 1000, // 48h
                    recipients: ['manager'],
                    actions: ['notify', 'assign']
                },
                {
                    level: 3,
                    name: 'Niveau direction',
                    timeout: 72 * 60 * 60 * 1000, // 72h
                    recipients: ['director'],
                    actions: ['notify', 'force_action']
                }
            ],
            
            // Critères d'escalade
            escalationTriggers: {
                overdueLoans: config.overdueLoans || true,
                failedApprovals: config.failedApprovals || true,
                systemErrors: config.systemErrors || true,
                userComplaints: config.userComplaints || true,
                performanceIssues: config.performanceIssues || false
            },
            
            // Seuils d'escalade
            thresholds: {
                overdueDays: config.overdueDays || 7,
                failedAttempts: config.failedAttempts || 3,
                errorRate: config.errorRate || 10, // %
                responseTime: config.responseTime || 24 * 60 * 60 * 1000, // 24h
                ...config.thresholds
            },
            
            // Actions automatiques par niveau
            autoActions: {
                level1: ['notification', 'reminder'],
                level2: ['notification', 'assignment', 'auto_extension'],
                level3: ['notification', 'force_close', 'audit_trail']
            },
            
            // Configuration des notifications
            notificationConfig: {
                urgent: true,
                includeContext: true,
                includeHistory: true,
                requireAcknowledgment: true
            },
            
            ...config
        };

        // Suivi des escalades en cours
        this.activeEscalations = new Map();
        this.escalationHistory = [];
    }

    /**
     * Exécuter la tâche d'escalade
     */
    async execute(context) {
        const { task, executionContext, variables } = context;
        const {
            trigger,
            target,
            reason,
            priority = 'normal',
            customEscalation = false,
            escalationData = {}
        } = task;

        try {
            let escalationResult = {
                taskId: task.id,
                triggered: false,
                escalationId: null,
                level: null,
                actions: [],
                timestamp: new Date().toISOString()
            };

            if (customEscalation) {
                // Escalade manuelle personnalisée
                escalationResult = await this.executeCustomEscalation(
                    target, 
                    reason, 
                    priority, 
                    escalationData
                );
            } else {
                // Escalade automatique basée sur des triggers
                escalationResult = await this.executeTriggeredEscalation(
                    trigger, 
                    variables
                );
            }

            return escalationResult;

        } catch (error) {
            console.error('Erreur lors de l\'escalade:', error);
            
            return {
                taskId: task.id,
                error: error.message,
                triggered: false,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Exécuter une escalade déclenchée par un trigger
     */
    async executeTriggeredEscalation(trigger, variables) {
        const result = {
            trigger,
            triggered: false,
            escalationId: null,
            level: null,
            actions: [],
            timestamp: new Date().toISOString()
        };

        // Vérifier les conditions d'escalade selon le trigger
        switch (trigger) {
            case 'loan_overdue':
                result.triggered = await this.checkOverdueEscalation(variables);
                break;

            case 'approval_failed':
                result.triggered = await this.checkApprovalFailureEscalation(variables);
                break;

            case 'system_error':
                result.triggered = await this.checkSystemErrorEscalation(variables);
                break;

            case 'user_complaint':
                result.triggered = await this.checkUserComplaintEscalation(variables);
                break;

            case 'performance_issue':
                result.triggered = await this.checkPerformanceEscalation(variables);
                break;

            default:
                console.warn(`Type d'escalade non supporté: ${trigger}`);
                return result;
        }

        if (result.triggered) {
            // Déterminer le niveau d'escalade approprié
            const escalationLevel = await this.determineEscalationLevel(trigger, variables);
            result.level = escalationLevel.level;
            
            // Créer l'escalade
            const escalationId = await this.createEscalation(
                trigger,
                escalationLevel,
                variables
            );
            
            result.escalationId = escalationId;
            
            // Exécuter les actions d'escalade
            result.actions = await this.executeEscalationActions(
                escalationId,
                escalationLevel,
                variables
            );
        }

        return result;
    }

    /**
     * Exécuter une escalade personnalisée
     */
    async executeCustomEscalation(target, reason, priority, escalationData) {
        const result = {
            custom: true,
            triggered: true,
            escalationId: null,
            level: escalationData.level || 1,
            actions: [],
            timestamp: new Date().toISOString()
        };

        // Créer l'escalade personnalisée
        const escalationId = await this.createCustomEscalation(
            target,
            reason,
            priority,
            escalationData
        );

        result.escalationId = escalationId;
        result.actions = ['notification']; // Action par défaut

        return result;
    }

    // 🔍 VÉRIFICATION DES CONDITIONS D'ESCALADE

    /**
     * Vérifier l'escalade pour prêts en retard
     */
    async checkOverdueEscalation(variables) {
        const { loanId, loan } = variables;
        
        if (!loan && loanId) {
            loan = await apiService.getLoanById(loanId);
        }

        if (!loan) return false;

        const daysOverdue = this.calculateDaysOverdue(loan.returnDate);
        
        // Vérifier les seuils d'escalade
        if (daysOverdue >= this.config.thresholds.overdueDays) {
            // Compter les rappels déjà envoyés
            const remindersSent = await this.getReminderCount(loanId);
            
            if (remindersSent < this.config.thresholds.maxReminders) {
                variables.daysOverdue = daysOverdue;
                variables.remindersSent = remindersSent;
                return true;
            }
        }

        return false;
    }

    /**
     * Vérifier l'escalade pour échecs d'approbation
     */
    async checkApprovalFailureEscalation(variables) {
        const { loanId, failureCount, failureReason } = variables;
        
        if (failureCount >= this.config.thresholds.failedAttempts) {
            variables.failureReason = failureReason;
            return true;
        }

        return false;
    }

    /**
     * Vérifier l'escalade pour erreurs système
     */
    async checkSystemErrorEscalation(variables) {
        const { errorType, errorCount, timeWindow } = variables;
        
        // Vérifier le taux d'erreur
        const errorRate = await this.calculateErrorRate(errorType, timeWindow);
        
        if (errorRate >= this.config.thresholds.errorRate) {
            variables.errorRate = errorRate;
            return true;
        }

        return false;
    }

    /**
     * Vérifier l'escalade pour plaintes utilisateur
     */
    async checkUserComplaintEscalation(variables) {
        const { complaintId, complaintType, severity } = variables;
        
        // Les plaintes de haute sévérité déclenchent immédiatement l'escalade
        if (severity === 'high' || severity === 'critical') {
            return true;
        }

        return false;
    }

    /**
     * Vérifier l'escalade pour problèmes de performance
     */
    async checkPerformanceEscalation(variables) {
        const { responseTime, errorRate, affectedUsers } = variables;
        
        if (responseTime > this.config.thresholds.responseTime) {
            return true;
        }

        if (errorRate > this.config.thresholds.errorRate) {
            return true;
        }

        if (affectedUsers > 10) { // Plus de 10 utilisateurs affectés
            return true;
        }

        return false;
    }

    // 📊 MÉTHODES DE DÉTERMINATION DU NIVEAU

    /**
     * Déterminer le niveau d'escalade approprié
     */
    async determineEscalationLevel(trigger, variables) {
        let targetLevel = 1;

        // Logique de determination selon le trigger et les variables
        switch (trigger) {
            case 'loan_overdue':
                const daysOverdue = variables.daysOverdue || 0;
                if (daysOverdue > 30) {
                    targetLevel = 3;
                } else if (daysOverdue > 14) {
                    targetLevel = 2;
                }
                break;

            case 'system_error':
                const errorRate = variables.errorRate || 0;
                if (errorRate > 50) {
                    targetLevel = 3;
                } else if (errorRate > 25) {
                    targetLevel = 2;
                }
                break;

            case 'user_complaint':
                if (variables.severity === 'critical') {
                    targetLevel = 3;
                } else if (variables.severity === 'high') {
                    targetLevel = 2;
                }
                break;

            default:
                targetLevel = 1;
        }

        const escalationLevel = this.config.levels.find(level => level.level === targetLevel);
        
        return escalationLevel || this.config.levels[0];
    }

    // 🎯 CRÉATION ET GESTION DES ESCALADES

    /**
     * Créer une nouvelle escalade
     */
    async createEscalation(trigger, escalationLevel, variables) {
        const escalationId = this.generateEscalationId();
        
        const escalation = {
            id: escalationId,
            trigger,
            level: escalationLevel.level,
            levelName: escalationLevel.name,
            status: 'active',
            createdAt: new Date().toISOString(),
            target: variables.target || null,
            context: {
                loanId: variables.loanId,
                userId: variables.userId,
                ...variables
            },
            actions: [],
            acknowledgments: [],
            resolution: null
        };

        // Stocker l'escalade
        this.activeEscalations.set(escalationId, escalation);
        
        // Programmer l'escalade suivante si applicable
        if (escalationLevel.level < this.config.levels.length) {
            await this.scheduleNextEscalation(escalationId, escalationLevel);
        }

        // Ajouter à l'historique
        this.escalationHistory.push(escalation);

        console.log(`Escalade créée: ${escalationId} (Niveau ${escalationLevel.level})`);
        
        return escalationId;
    }

    /**
     * Créer une escalade personnalisée
     */
    async createCustomEscalation(target, reason, priority, escalationData) {
        const escalationId = this.generateEscalationId();
        const level = escalationData.level || 1;
        const escalationLevel = this.config.levels.find(l => l.level === level) || this.config.levels[0];

        const escalation = {
            id: escalationId,
            trigger: 'custom',
            level,
            levelName: escalationLevel.name,
            status: 'active',
            createdAt: new Date().toISOString(),
            target,
            reason,
            priority,
            context: escalationData,
            actions: [],
            acknowledgments: [],
            resolution: null
        };

        this.activeEscalations.set(escalationId, escalation);
        this.escalationHistory.push(escalation);

        return escalationId;
    }

    /**
     * Exécuter les actions d'escalade
     */
    async executeEscalationActions(escalationId, escalationLevel, variables) {
        const escalation = this.activeEscalations.get(escalationId);
        if (!escalation) return [];

        const actions = [];
        
        for (const action of escalationLevel.actions) {
            try {
                switch (action) {
                    case 'notify':
                        await this.sendEscalationNotification(escalation, escalationLevel, variables);
                        actions.push('notification');
                        break;

                    case 'remind':
                        await this.sendReminder(escalation, variables);
                        actions.push('reminder');
                        break;

                    case 'assign':
                        await this.assignToResponsible(escalation, escalationLevel);
                        actions.push('assignment');
                        break;

                    case 'auto_extension':
                        await this.autoExtendLoan(escalation, variables);
                        actions.push('auto_extension');
                        break;

                    case 'force_close':
                        await this.forceCloseItem(escalation, variables);
                        actions.push('force_close');
                        break;

                    case 'audit_trail':
                        await this.createAuditTrail(escalation);
                        actions.push('audit_trail');
                        break;
                }
            } catch (error) {
                console.error(`Erreur lors de l'action ${action}:`, error);
                actions.push(`error_${action}`);
            }
        }

        escalation.actions = actions;
        escalation.lastActionAt = new Date().toISOString();

        return actions;
    }

    // 📧 ACTIONS D'ESCALADE

    /**
     * Envoyer une notification d'escalade
     */
    async sendEscalationNotification(escalation, escalationLevel, variables) {
        const recipients = escalationLevel.recipients;
        const title = `Escalade Niveau ${escalation.level}: ${escalation.trigger}`;
        const message = this.buildEscalationMessage(escalation, escalationLevel, variables);

        // Envoyer via la tâche de notification
        const notificationTask = new (await import('./NotificationTask.js')).default();
        
        await notificationTask.execute({
            task: {
                type: 'escalation',
                recipients,
                title,
                message,
                priority: 'high',
                data: {
                    escalationId: escalation.id,
                    trigger: escalation.trigger,
                    level: escalation.level,
                    context: escalation.context
                }
            },
            executionContext: {},
            variables: {}
        });
    }

    /**
     * Envoyer un rappel
     */
    async sendReminder(escalation, variables) {
        const message = `Rappel d'escalade: ${escalation.trigger} nécessite une attention`;
        
        // Envoyer un rappel aux destinataires originaux
        console.log(`Rappel envoyé pour l'escalade ${escalation.id}:`, message);
    }

    /**
     * Assigner à un responsable
     */
    async assignToResponsible(escalation, escalationLevel) {
        const responsible = escalationLevel.recipients[0]; // Premier destinataire
        
        escalation.assignedTo = responsible;
        escalation.assignedAt = new Date().toISOString();
        
        console.log(`Escalade ${escalation.id} assignée à ${responsible}`);
    }

    /**
     * Extension automatique d'un prêt
     */
    async autoExtendLoan(escalation, variables) {
        if (escalation.context.loanId) {
            try {
                await apiService.extendLoan(escalation.context.loanId, {
                    extensionDays: 7,
                    reason: 'Extension automatique suite à escalade'
                });
                
                escalation.autoExtended = true;
                console.log(`Prêt ${escalation.context.loanId} étendu automatiquement`);
            } catch (error) {
                console.error('Erreur lors de l\'extension automatique:', error);
            }
        }
    }

    /**
     * Forcer la fermeture d'un élément
     */
    async forceCloseItem(escalation, variables) {
        // Selon le contexte, fermer le prêt, annuler la demande, etc.
        if (escalation.context.loanId) {
            await apiService.cancelLoan(escalation.context.loanId, 'Fermeture forcée par escalade');
            escalation.forcedClosed = true;
        }
    }

    /**
     * Créer une piste d'audit
     */
    async createAuditTrail(escalation) {
        const auditEntry = {
            timestamp: new Date().toISOString(),
            type: 'escalation',
            escalationId: escalation.id,
            level: escalation.level,
            trigger: escalation.trigger,
            actions: escalation.actions,
            context: escalation.context
        };

        // Stocker dans l'audit trail
        console.log('Audit trail créé:', auditEntry);
        
        escalation.auditTrail = true;
    }

    // 🛠️ UTILITAIRES

    /**
     * Calculer les jours de retard
     */
    calculateDaysOverdue(returnDate) {
        const now = new Date();
        const returnDateObj = new Date(returnDate);
        const diffTime = now - returnDateObj;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    /**
     * Obtenir le nombre de rappels envoyés
     */
    async getReminderCount(loanId) {
        // Simulation - en production, ceci would query une base de données
        return 0;
    }

    /**
     * Calculer le taux d'erreur
     */
    async calculateErrorRate(errorType, timeWindow) {
        // Simulation - en production, ceci would query des métriques système
        return Math.random() * 20; // Entre 0 et 20%
    }

    /**
     * Construire le message d'escalade
     */
    buildEscalationMessage(escalation, escalationLevel, variables) {
        let message = `${escalationLevel.name}\n\n`;
        message += `Trigger: ${escalation.trigger}\n`;
        message += `Niveau: ${escalation.level}\n`;
        message += `Heure: ${new Date().toLocaleString()}\n\n`;
        
        if (escalation.context.loanId) {
            message += `Prêt: ${escalation.context.loanId}\n`;
        }
        
        if (escalation.context.userId) {
            message += `Utilisateur: ${escalation.context.userId}\n`;
        }
        
        message += `\nActions requises: ${escalationLevel.actions.join(', ')}`;
        
        return message;
    }

    /**
     * Programmer la prochaine escalade
     */
    async scheduleNextEscalation(escalationId, currentLevel) {
        const nextLevelIndex = this.config.levels.findIndex(level => level.level === currentLevel.level) + 1;
        
        if (nextLevelIndex < this.config.levels.length) {
            const nextLevel = this.config.levels[nextLevelIndex];
            const escalationTime = new Date(Date.now() + nextLevel.timeout);
            
            console.log(`Prochaine escalade programmée pour ${escalationTime.toISOString()}`);
            // Dans une implémentation réelle, ceci would be enregistré dans un scheduler
        }
    }

    /**
     * Générer un ID d'escalade
     */
    generateEscalationId() {
        return `ESC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Obtenir les escalades actives
     */
    getActiveEscalations() {
        return Array.from(this.activeEscalations.values());
    }

    /**
     * Obtenir l'historique des escalades
     */
    getEscalationHistory(filter = {}) {
        let history = [...this.escalationHistory];
        
        if (filter.trigger) {
            history = history.filter(esc => esc.trigger === filter.trigger);
        }
        
        if (filter.level) {
            history = history.filter(esc => esc.level === filter.level);
        }
        
        if (filter.status) {
            history = history.filter(esc => esc.status === filter.status);
        }
        
        return history;
    }

    /**
     * Résoudre une escalade
     */
    resolveEscalation(escalationId, resolution) {
        const escalation = this.activeEscalations.get(escalationId);
        if (escalation) {
            escalation.status = 'resolved';
            escalation.resolvedAt = new Date().toISOString();
            escalation.resolution = resolution;
            
            // Déplacer vers l'historique
            this.activeEscalations.delete(escalationId);
        }
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
}

export default EscalationTask;