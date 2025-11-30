// src/services/workflowTasks/NotificationTask.js - TÂCHE DE GESTION DES NOTIFICATIONS WORKFLOW
// Gère l'envoi automatisé de notifications dans les workflows

import apiService from '../apiService';

class NotificationTask {
    constructor(config = {}) {
        this.config = {
            // Types de notifications supportés
            supportedTypes: ['info', 'warning', 'error', 'success', 'reminder', 'alert'],
            
            // Canaux de notification
            channels: {
                inApp: config.inApp !== false,
                browser: config.browser !== false,
                email: config.email !== false,
                sms: config.sms !== false
            },
            
            // Configuration des rappels
            enableReminders: config.enableReminders !== false,
            reminderIntervals: config.reminderIntervals || [24, 48, 168], // heures
            maxReminders: config.maxReminders || 3,
            
            // Templates de messages
            templates: {
                ...config.templates,
                loanExpiring: 'Votre prêt pour "{documentTitle}" expire dans {days} jours',
                loanOverdue: 'Votre prêt pour "{documentTitle}" est en retard de {days} jours',
                loanApproved: 'Votre demande de prêt pour "{documentTitle}" a été approuvée',
                loanRejected: 'Votre demande de prêt pour "{documentTitle}" a été rejetée',
                systemAlert: 'Alerte système: {message}'
            },
            
            // Personnalisation
            defaultPriority: config.defaultPriority || 'normal',
            includeActions: config.includeActions !== false,
            ...config
        };
    }

    /**
     * Exécuter la tâche de notification
     */
    async execute(context) {
        const { task, executionContext, variables } = context;
        const {
            type = 'info',
            recipients = [],
            title,
            message,
            template,
            data = {},
            channels,
            priority = this.config.defaultPriority,
            schedule,
            templateData = {}
        } = task;

        try {
            const notificationConfig = {
                type,
                recipients,
                title,
                message: message || this.resolveTemplate(template, templateData),
                data,
                channels: { ...this.config.channels, ...channels },
                priority,
                schedule,
                workflowId: executionContext.workflowId,
                taskId: task.id,
                executionId: context.executionId
            };

            let result = {
                taskId: task.id,
                type,
                sent: false,
                recipients: [],
                channels: [],
                errors: [],
                timestamp: new Date().toISOString()
            };

            // Traitement des destinataires
            const resolvedRecipients = await this.resolveRecipients(recipients, templateData);
            result.recipients = resolvedRecipients;

            // Envoyer les notifications
            for (const recipient of resolvedRecipients) {
                try {
                    const recipientResult = await this.sendToRecipient(
                        recipient, 
                        notificationConfig, 
                        templateData
                    );
                    
                    result.channels.push(...recipientResult.channels);
                    
                    if (recipientResult.success) {
                        result.sent = true;
                    } else {
                        result.errors.push({
                            recipient: recipient.id || recipient,
                            error: recipientResult.error
                        });
                    }
                } catch (error) {
                    result.errors.push({
                        recipient: recipient.id || recipient,
                        error: error.message
                    });
                }
            }

            // Configurer les rappels si nécessaire
            if (this.config.enableReminders && schedule) {
                await this.setupReminders(notificationConfig, resolvedRecipients);
            }

            // Journaliser l'événement
            if (result.sent) {
                console.log(`Notification envoyée: ${type} vers ${resolvedRecipients.length} destinataire(s)`);
            } else {
                console.warn(`Échec de notification: ${result.errors.length} erreur(s)`);
            }

            return result;

        } catch (error) {
            console.error('Erreur lors de l\'envoi de notification:', error);
            
            return {
                taskId: task.id,
                type,
                error: error.message,
                sent: false,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Résoudre les destinataires
     */
    async resolveRecipients(recipients, templateData) {
        const resolved = [];

        for (const recipient of recipients) {
            if (typeof recipient === 'string') {
                // ID utilisateur direct
                resolved.push({ id: recipient, type: 'user' });
            } else if (typeof recipient === 'object' && recipient.id) {
                // Objet destinataire complet
                resolved.push(recipient);
            } else if (recipient.type === 'role') {
                // Destinataires par rôle
                const roleRecipients = await this.getRecipientsByRole(recipient.role, recipient.scope);
                resolved.push(...roleRecipients);
            } else if (recipient.type === 'group') {
                // Destinataires par groupe
                const groupRecipients = await this.getRecipientsByGroup(recipient.group);
                resolved.push(...groupRecipients);
            } else if (recipient.type === 'condition') {
                // Destinataires dynamiques basés sur des conditions
                const conditionRecipients = await this.getRecipientsByCondition(recipient.condition, templateData);
                resolved.push(...conditionRecipients);
            }
        }

        // Éliminer les doublons
        const uniqueRecipients = resolved.filter((recipient, index, self) => 
            index === self.findIndex(r => r.id === recipient.id)
        );

        return uniqueRecipients;
    }

    /**
     * Envoyer une notification à un destinataire
     */
    async sendToRecipient(recipient, config, templateData) {
        const result = {
            recipient: recipient.id,
            channels: [],
            success: true,
            error: null
        };

        try {
            // Notification in-app
            if (config.channels.inApp) {
                try {
                    await apiService.sendNotification({
                        type: config.type,
                        recipient: recipient.id,
                        title: config.title,
                        message: config.message,
                        priority: config.priority,
                        data: {
                            ...config.data,
                            workflowId: config.workflowId,
                            taskId: config.taskId,
                            executionId: config.executionId
                        }
                    });
                    
                    result.channels.push('inApp');
                } catch (error) {
                    console.warn(`Erreur notification in-app pour ${recipient.id}:`, error);
                    result.error = result.error || error.message;
                }
            }

            // Notification navigateur
            if (config.channels.browser && this.hasBrowserPermission()) {
                try {
                    await this.sendBrowserNotification(recipient, config, templateData);
                    result.channels.push('browser');
                } catch (error) {
                    console.warn(`Erreur notification navigateur pour ${recipient.id}:`, error);
                    result.error = result.error || error.message;
                }
            }

            // Notification email
            if (config.channels.email) {
                try {
                    await this.sendEmailNotification(recipient, config, templateData);
                    result.channels.push('email');
                } catch (error) {
                    console.warn(`Erreur notification email pour ${recipient.id}:`, error);
                    result.error = result.error || error.message;
                }
            }

            // SMS (simulation)
            if (config.channels.sms) {
                try {
                    await this.sendSmsNotification(recipient, config, templateData);
                    result.channels.push('sms');
                } catch (error) {
                    console.warn(`Erreur notification SMS pour ${recipient.id}:`, error);
                    result.error = result.error || error.message;
                }
            }

            // Marquer comme échoué si aucun canal n'a fonctionné
            if (result.channels.length === 0) {
                result.success = false;
                result.error = result.error || 'Aucun canal de notification disponible';
            }

        } catch (error) {
            result.success = false;
            result.error = error.message;
        }

        return result;
    }

    /**
     * Envoyer une notification navigateur
     */
    async sendBrowserNotification(recipient, config, templateData) {
        if (!('Notification' in window)) {
            throw new Error('Notifications non supportées par ce navigateur');
        }

        // Demander la permission si nécessaire
        if (Notification.permission === 'default') {
            await Notification.requestPermission();
        }

        if (Notification.permission !== 'granted') {
            throw new Error('Permission de notification refusée');
        }

        const notification = new Notification(config.title, {
            body: config.message,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: `workflow-${config.workflowId}-${config.taskId}`,
            requireInteraction: config.priority === 'high',
            data: {
                ...config.data,
                recipient: recipient.id
            }
        });

        // Actions cliquables
        if (this.config.includeActions && config.data.actionUrl) {
            notification.onclick = () => {
                window.open(config.data.actionUrl, '_blank');
                notification.close();
            };
        }

        // Auto-fermeture après délai
        setTimeout(() => {
            notification.close();
        }, 10000); // 10 secondes

        return true;
    }

    /**
     * Envoyer une notification email
     */
    async sendEmailNotification(recipient, config, templateData) {
        // Simulation d'envoi d'email
        // En production, ceci would be intégré avec un service d'email comme SendGrid, AWS SES, etc.
        
        const emailData = {
            to: recipient.email || `${recipient.id}@example.com`,
            subject: config.title,
            body: this.formatEmailBody(config.message, templateData),
            priority: config.priority,
            workflowId: config.workflowId,
            taskId: config.taskId
        };

        console.log('Simulation envoi email:', emailData);
        
        // TODO: Intégrer avec un vrai service d'email
        // const response = await emailService.send(emailData);
        
        return true;
    }

    /**
     * Envoyer une notification SMS
     */
    async sendSmsNotification(recipient, config, templateData) {
        // Simulation d'envoi SMS
        const smsData = {
            to: recipient.phone || '+33123456789',
            message: this.truncateForSms(config.message),
            priority: config.priority,
            workflowId: config.workflowId
        };

        console.log('Simulation envoi SMS:', smsData);
        
        // TODO: Intégrer avec un vrai service SMS
        // const response = await smsService.send(smsData);
        
        return true;
    }

    // 📋 MÉTHODES D'AIDE

    /**
     * Vérifier si les notifications navigateur sont autorisées
     */
    hasBrowserPermission() {
        if (!('Notification' in window)) {
            return false;
        }
        return Notification.permission === 'granted';
    }

    /**
     * Résoudre un template avec des données
     */
    resolveTemplate(templateName, data) {
        const template = this.config.templates[templateName];
        if (!template) {
            return templateName;
        }

        return template.replace(/\{(\w+)\}/g, (match, key) => {
            return data[key] || match;
        });
    }

    /**
     * Obtenir les destinataires par rôle
     */
    async getRecipientsByRole(role, scope = 'all') {
        // Simulation - en production, ceci would query une base de données
        const mockRecipients = {
            'admin': [
                { id: 'admin1', type: 'user', name: 'Administrateur 1' },
                { id: 'admin2', type: 'user', name: 'Administrateur 2' }
            ],
            'librarian': [
                { id: 'lib1', type: 'user', name: 'Bibliothécaire 1' }
            ],
            'user': [
                { id: 'user1', type: 'user', name: 'Utilisateur 1' }
            ]
        };

        return mockRecipients[role] || [];
    }

    /**
     * Obtenir les destinataires par groupe
     */
    async getRecipientsByGroup(groupName) {
        // Simulation - en production, ceci would query un système de groupes
        const mockGroups = {
            'all-users': [
                { id: 'user1', type: 'user' },
                { id: 'user2', type: 'user' },
                { id: 'user3', type: 'user' }
            ],
            'active-borrowers': [
                { id: 'user1', type: 'user' },
                { id: 'user4', type: 'user' }
            ]
        };

        return mockGroups[groupName] || [];
    }

    /**
     * Obtenir les destinataires par condition
     */
    async getRecipientsByCondition(condition, data) {
        // Implementation simplifiée - en production, ceci would be plus sophistiqué
        const { field, operator, value } = condition;
        
        if (data[field] && this.evaluateCondition(data[field], operator, value)) {
            return [{ id: data.userId, type: 'user' }];
        }

        return [];
    }

    /**
     * Évaluer une condition simple
     */
    evaluateCondition(fieldValue, operator, expectedValue) {
        switch (operator) {
            case 'equals':
                return fieldValue === expectedValue;
            case 'not_equals':
                return fieldValue !== expectedValue;
            case 'greater_than':
                return Number(fieldValue) > Number(expectedValue);
            case 'less_than':
                return Number(fieldValue) < Number(expectedValue);
            case 'contains':
                return String(fieldValue).includes(expectedValue);
            default:
                return false;
        }
    }

    /**
     * Configurer les rappels automatiques
     */
    async setupReminders(config, recipients) {
        const reminderConfig = {
            type: 'reminder',
            originalTitle: config.title,
            originalMessage: config.message,
            templateData: config.data,
            recipients: recipients.map(r => r.id),
            channels: config.channels,
            priority: config.priority,
            intervals: this.config.reminderIntervals,
            maxReminders: this.config.maxReminders
        };

        // Programmer les rappels
        for (const interval of this.config.reminderIntervals) {
            const reminderTime = new Date(Date.now() + interval * 60 * 60 * 1000);
            
            // Dans une implémentation réelle, ceci would be enregistré dans une base de données
            // ou un système de tâches cron
            console.log(`Rappel programmé dans ${interval}h:`, reminderConfig);
        }

        return true;
    }

    /**
     * Formater le corps d'un email
     */
    formatEmailBody(message, data) {
        let body = message;
        
        // Ajouter des informations de contexte
        body += '\n\n';
        body += '---\n';
        body += 'Informations complémentaires:\n';
        
        Object.entries(data).forEach(([key, value]) => {
            body += `${key}: ${value}\n`;
        });
        
        body += '\nCet email a été envoyé automatiquement par le système DocuCortex.';
        
        return body;
    }

    /**
     * Tronquer un message pour SMS
     */
    truncateForSms(message, maxLength = 160) {
        if (message.length <= maxLength) {
            return message;
        }
        return message.substring(0, maxLength - 3) + '...';
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
     * Ajouter un template personnalisé
     */
    addTemplate(name, template) {
        this.config.templates[name] = template;
    }

    /**
     * Supprimer un template
     */
    removeTemplate(name) {
        delete this.config.templates[name];
    }

    /**
     * Obtenir tous les templates
     */
    getTemplates() {
        return { ...this.config.templates };
    }
}

export default NotificationTask;