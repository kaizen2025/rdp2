// src/services/alertsService.js - SERVICE D'ALERTES PRÉVENTIVES DOCUCORTEX
// Système intelligent de notifications pour la gestion de prêts

import { format, differenceInDays, addDays, isAfter, isBefore, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const STORAGE_KEYS = {
    ALERTS: 'docucortex_alerts',
    PREFERENCES: 'docucortex_alert_preferences',
    SENT_NOTIFICATIONS: 'docucortex_sent_notifications',
    USER_SETTINGS: 'docucortex_user_alert_settings'
};

// Configuration par défaut des alertes
const DEFAULT_ALERT_CONFIG = {
    notificationHours: [24, 48], // Heures avant expiration pour les alertes
    enableBrowserNotifications: true,
    enableEmailNotifications: false,
    enableInAppNotifications: true,
    autoExtendAllowed: false,
    criticalThreshold: 3, // Jours avant expiration pour passer en critique
    warningThreshold: 7   // Jours avant expiration pour passer en avertissement
};

// Types d'alertes
const ALERT_TYPES = {
    UPCOMING_24H: 'upcoming_24h',
    UPCOMING_48H: 'upcoming_48h',
    CRITICAL: 'critical',
    OVERDUE: 'overdue',
    EXTENDED: 'extended',
    RETURNED: 'returned'
};

// Niveaux de priorité
const ALERT_LEVELS = {
    LOW: { level: 1, label: 'Faible', color: 'info', icon: 'info' },
    MEDIUM: { level: 2, label: 'Moyen', color: 'warning', icon: 'warning' },
    HIGH: { level: 3, label: 'Élevé', color: 'error', icon: 'error' },
    CRITICAL: { level: 4, label: 'Critique', color: 'error', icon: 'critical' }
};

class AlertsService {
    constructor() {
        this.init();
        this.setupNotificationListener();
    }

    // 🚀 Initialisation du service
    async init() {
        await this.requestNotificationPermission();
        this.loadSentNotifications();
        console.log('🔔 Service d\'alertes DocuCortex initialisé');
    }

    // 📱 Demande de permission pour les notifications
    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.warn('❌ Les notifications ne sont pas supportées par ce navigateur');
            return false;
        }

        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return Notification.permission === 'granted';
    }

    // 📊 Calcul automatique des dates d'expiration et niveaux d'alerte
    calculateAlertStatus(loan) {
        if (!loan.returnDate) return null;

        const today = new Date();
        const returnDate = parseISO(loan.returnDate);
        const daysUntilReturn = differenceInDays(returnDate, today);
        const hoursUntilReturn = differenceInDays(returnDate, today) * 24;

        // Déterminer le niveau d'alerte
        let alertLevel = null;
        let alertType = null;

        if (daysUntilReturn < 0) {
            // Prêt en retard
            alertLevel = ALERT_LEVELS.CRITICAL;
            alertType = ALERT_TYPES.OVERDUE;
        } else if (daysUntilReturn <= DEFAULT_ALERT_CONFIG.criticalThreshold) {
            // Seuil critique
            alertLevel = ALERT_LEVELS.CRITICAL;
            alertType = ALERT_TYPES.CRITICAL;
        } else if (daysUntilReturn <= DEFAULT_ALERT_CONFIG.warningThreshold) {
            // Seuil d'avertissement
            alertLevel = ALERT_LEVELS.MEDIUM;
            alertType = ALERT_TYPES.UPCOMING_48H;
        } else if (hoursUntilReturn <= 24 && hoursUntilReturn > 0) {
            // 24h restantes
            alertLevel = ALERT_LEVELS.HIGH;
            alertType = ALERT_TYPES.UPCOMING_24H;
        }

        // Générer les dates d'alertes programmées
        const alertDates = this.generateAlertDates(returnDate);

        return {
            level: alertLevel,
            type: alertType,
            daysUntilReturn,
            hoursUntilReturn,
            isOverdue: daysUntilReturn < 0,
            alertDates,
            returnDate: returnDate.toISOString(),
            priority: alertLevel?.level || 0
        };
    }

    // 📅 Génération des dates d'alertes programmées
    generateAlertDates(returnDate) {
        const alerts = [];
        
        // Alertes 48h et 24h avant
        DEFAULT_ALERT_CONFIG.notificationHours.forEach(hours => {
            const alertDate = addDays(returnDate, -hours / 24);
            if (isAfter(alertDate, new Date())) {
                alerts.push({
                    type: `upcoming_${hours}h`,
                    date: alertDate.toISOString(),
                    scheduled: true
                });
            }
        });

        return alerts;
    }

    // 🔔 Envoi de notification
    async sendNotification(loan, alertStatus, customMessage = null) {
        const preferences = this.getUserPreferences();
        
        if (!preferences.enableBrowserNotifications) {
            console.log('📵 Notifications désactivées dans les préférences utilisateur');
            return false;
        }

        // Vérifier si la notification a déjà été envoyée
        const notificationKey = `${loan.id}_${alertStatus.type}_${format(new Date(), 'yyyy-MM-dd')}`;
        if (this.hasNotificationBeenSent(notificationKey)) {
            console.log(`📵 Notification déjà envoyée pour ${loan.id} - ${alertStatus.type}`);
            return false;
        }

        try {
            // Notification in-app
            if (preferences.enableInAppNotifications) {
                this.showInAppNotification(loan, alertStatus, customMessage);
            }

            // Notification navigateur
            if (preferences.enableBrowserNotifications && Notification.permission === 'granted') {
                await this.showBrowserNotification(loan, alertStatus, customMessage);
            }

            // Marquer comme envoyée
            this.markNotificationAsSent(notificationKey);
            this.saveNotificationHistory(loan, alertStatus, customMessage);

            return true;
        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi de la notification:', error);
            return false;
        }
    }

    // 💻 Notification in-app
    showInAppNotification(loan, alertStatus, customMessage) {
        const notification = {
            id: `${Date.now()}_${loan.id}`,
            type: alertStatus.type,
            level: alertStatus.level,
            title: this.getNotificationTitle(loan, alertStatus),
            message: customMessage || this.getNotificationMessage(loan, alertStatus),
            loanId: loan.id,
            documentTitle: loan.documentTitle || loan.document?.title || 'Document inconnu',
            borrowerName: loan.borrowerName || loan.borrower?.name || 'Utilisateur inconnu',
            returnDate: loan.returnDate,
            priority: alertStatus.level.level,
            timestamp: new Date().toISOString(),
            read: false,
            actions: this.getNotificationActions(loan, alertStatus)
        };

        // Sauvegarder dans le localStorage
        const existingNotifications = this.getStoredNotifications();
        existingNotifications.unshift(notification);
        
        // Limiter à 100 notifications maximum
        if (existingNotifications.length > 100) {
            existingNotifications.splice(100);
        }

        localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(existingNotifications));

        // Émettre un événement personnalisé pour les composants React
        window.dispatchEvent(new CustomEvent('docucortex-new-alert', {
            detail: notification
        }));

        console.log('💻 Notification in-app envoyée:', notification.title);
    }

    // 🌐 Notification navigateur
    async showBrowserNotification(loan, alertStatus, customMessage) {
        const notification = new Notification(
            this.getNotificationTitle(loan, alertStatus),
            {
                body: customMessage || this.getNotificationMessage(loan, alertStatus),
                icon: '/icon.png',
                badge: '/badge.png',
                tag: `${loan.id}_${alertStatus.type}`,
                requireInteraction: alertStatus.level.level >= 3,
                silent: false,
                actions: this.getNotificationActions(loan, alertStatus).map(action => ({
                    action: action.action,
                    title: action.label
                }))
            }
        );

        // Auto-fermeture après 10 secondes pour les alertes non-critiques
        if (alertStatus.level.level < 3) {
            setTimeout(() => {
                notification.close();
            }, 10000);
        }

        // Gestion des actions
        notification.onclick = () => {
            window.focus();
            notification.close();
            
            // Émettre un événement pour ouvrir la modal de gestion du prêt
            window.dispatchEvent(new CustomEvent('docucortex-loan-action', {
                detail: { action: 'manage', loanId: loan.id }
            }));
        };

        console.log('🌐 Notification navigateur envoyée');
        return notification;
    }

    // 📝 Génération du titre de notification
    getNotificationTitle(loan, alertStatus) {
        const documentTitle = loan.documentTitle || 'Document';
        const daysUntilReturn = Math.abs(alertStatus.daysUntilReturn);

        switch (alertStatus.type) {
            case ALERT_TYPES.OVERDUE:
                return `🚨 RETARD: "${documentTitle}" - En retard de ${daysUntilReturn} jour${daysUntilReturn > 1 ? 's' : ''}`;
            case ALERT_TYPES.CRITICAL:
                return `⚠️ CRITIQUE: "${documentTitle}" expire dans ${daysUntilReturn} jour${daysUntilReturn > 1 ? 's' : ''}`;
            case ALERT_TYPES.UPCOMING_48H:
                return `📅 RAPPEL: "${documentTitle}" expire dans 2 jours`;
            case ALERT_TYPES.UPCOMING_24H:
                return `⏰ URGENT: "${documentTitle}" expire demain`;
            default:
                return `📋 Alerte DocuCortex: "${documentTitle}"`;
        }
    }

    // 📄 Génération du message de notification
    getNotificationMessage(loan, alertStatus) {
        const borrowerName = loan.borrowerName || 'Utilisateur';
        const returnDate = format(parseISO(loan.returnDate), 'dd MMMM yyyy à HH:mm', { locale: fr });
        
        let baseMessage = `Emprunteur: ${borrowerName}\nRetour prévu: ${returnDate}`;

        switch (alertStatus.type) {
            case ALERT_TYPES.OVERDUE:
                return `${baseMessage}\n\n⚠️ Ce prêt est en retard. Une action est requise.`;
            case ALERT_TYPES.CRITICAL:
                return `${baseMessage}\n\n🚨 Ce prêt expire bientôt. Prenez des mesures rapidement.`;
            case ALERT_TYPES.UPCOMING_48H:
                return `${baseMessage}\n\n📅 Ce prêt expire dans 48h. N'oubliez pas de le retourner.`;
            case ALERT_TYPES.UPCOMING_24H:
                return `${baseMessage}\n\n⏰ Ce prêt expire demain. Préparez-vous pour le retour.`;
            default:
                return baseMessage;
        }
    }

    // 🎯 Actions disponibles pour les notifications
    getNotificationActions(loan, alertStatus) {
        const actions = [
            {
                action: 'view',
                label: 'Voir les détails',
                icon: 'visibility',
                primary: true
            }
        ];

        // Actions contextuelles basées sur le type d'alerte
        switch (alertStatus.type) {
            case ALERT_TYPES.OVERDUE:
                actions.push(
                    {
                        action: 'recall',
                        label: 'Rappeler',
                        icon: 'notifications_active',
                        primary: false
                    },
                    {
                        action: 'extend',
                        label: 'Prolonger',
                        icon: 'schedule',
                        primary: false
                    }
                );
                break;
            case ALERT_TYPES.CRITICAL:
            case ALERT_TYPES.UPCOMING_24H:
            case ALERT_TYPES.UPCOMING_48H:
                actions.push(
                    {
                        action: 'extend',
                        label: 'Prolonger',
                        icon: 'schedule',
                        primary: false
                    },
                    {
                        action: 'remind',
                        label: 'Rappeler',
                        icon: 'notifications_active',
                        primary: false
                    }
                );
                break;
        }

        return actions;
    }

    // 💾 Gestion des notifications envoyées
    hasNotificationBeenSent(notificationKey) {
        const sentNotifications = this.getSentNotifications();
        return sentNotifications.includes(notificationKey);
    }

    markNotificationAsSent(notificationKey) {
        const sentNotifications = this.getSentNotifications();
        sentNotifications.push(notificationKey);
        
        // Limiter à 1000 clés maximum
        if (sentNotifications.length > 1000) {
            sentNotifications.splice(0, sentNotifications.length - 1000);
        }

        localStorage.setItem(STORAGE_KEYS.SENT_NOTIFICATIONS, JSON.stringify(sentNotifications));
    }

    getSentNotifications() {
        const stored = localStorage.getItem(STORAGE_KEYS.SENT_NOTIFICATIONS);
        return stored ? JSON.parse(stored) : [];
    }

    loadSentNotifications() {
        const sentNotifications = this.getSentNotifications();
        console.log(`📤 ${sentNotifications.length} notifications déjà envoyées chargées`);
    }

    // 📚 Historique des notifications
    saveNotificationHistory(loan, alertStatus, customMessage) {
        const history = {
            id: `${Date.now()}_${loan.id}`,
            loanId: loan.id,
            alertType: alertStatus.type,
            alertLevel: alertStatus.level.level,
            message: customMessage || this.getNotificationMessage(loan, alertStatus),
            timestamp: new Date().toISOString(),
            deliveredVia: [
                'inApp',
                ...(Notification.permission === 'granted' ? ['browser'] : [])
            ]
        };

        const existingHistory = this.getNotificationHistory();
        existingHistory.unshift(history);

        // Limiter à 500 entrées d'historique
        if (existingHistory.length > 500) {
            existingHistory.splice(500);
        }

        localStorage.setItem('docucortex_notification_history', JSON.stringify(existingHistory));
    }

    getNotificationHistory() {
        const stored = localStorage.getItem('docucortex_notification_history');
        return stored ? JSON.parse(stored) : [];
    }

    // 🎛️ Gestion des préférences utilisateur
    getUserPreferences() {
        const stored = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
        return stored ? { ...DEFAULT_ALERT_CONFIG, ...JSON.parse(stored) } : DEFAULT_ALERT_CONFIG;
    }

    updateUserPreferences(newPreferences) {
        const currentPreferences = this.getUserPreferences();
        const updatedPreferences = { ...currentPreferences, ...newPreferences };
        localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updatedPreferences));
        
        console.log('⚙️ Préférences d\'alertes mises à jour:', updatedPreferences);
        return updatedPreferences;
    }

    // 📊 Statistiques des alertes
    getAlertStatistics() {
        const notifications = this.getStoredNotifications();
        const history = this.getNotificationHistory();
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const recentNotifications = notifications.filter(n => new Date(n.timestamp) > last7d);
        const urgentAlerts = notifications.filter(n => n.priority >= 3 && new Date(n.timestamp) > last24h);

        return {
            total: notifications.length,
            unread: notifications.filter(n => !n.read).length,
            last24h: notifications.filter(n => new Date(n.timestamp) > last24h).length,
            last7d: recentNotifications.length,
            urgent: urgentAlerts.length,
            byLevel: {
                low: notifications.filter(n => n.priority === 1).length,
                medium: notifications.filter(n => n.priority === 2).length,
                high: notifications.filter(n => n.priority === 3).length,
                critical: notifications.filter(n => n.priority === 4).length
            },
            byType: {
                overdue: notifications.filter(n => n.type === ALERT_TYPES.OVERDUE).length,
                critical: notifications.filter(n => n.type === ALERT_TYPES.CRITICAL).length,
                upcoming48h: notifications.filter(n => n.type === ALERT_TYPES.UPCOMING_48H).length,
                upcoming24h: notifications.filter(n => n.type === ALERT_TYPES.UPCOMING_24H).length
            }
        };
    }

    // 🔔 Notifications stockées
    getStoredNotifications() {
        const stored = localStorage.getItem(STORAGE_KEYS.ALERTS);
        return stored ? JSON.parse(stored) : [];
    }

    // ✅ Marquer comme lu
    markAsRead(notificationId) {
        const notifications = this.getStoredNotifications();
        const notification = notifications.find(n => n.id === notificationId);
        
        if (notification) {
            notification.read = true;
            notification.readAt = new Date().toISOString();
            localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(notifications));
            
            // Émettre un événement de mise à jour
            window.dispatchEvent(new CustomEvent('docucortex-alert-read', {
                detail: { notificationId }
            }));
        }
    }

    // 🗑️ Supprimer une notification
    deleteNotification(notificationId) {
        const notifications = this.getStoredNotifications();
        const filtered = notifications.filter(n => n.id !== notificationId);
        localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(filtered));
        
        // Émettre un événement de suppression
        window.dispatchEvent(new CustomEvent('docucortex-alert-deleted', {
            detail: { notificationId }
        }));
    }

    // 📧 Envoi d'email (placeholder pour intégration future)
    sendEmailNotification(loan, alertStatus) {
        // TODO: Intégration avec service d'email
        console.log('📧 Email envoyé pour:', loan.id, alertStatus.type);
    }

    // 🎯 Écouteur d'événements de notification
    setupNotificationListener() {
        window.addEventListener('docucortex-process-loan-alerts', (event) => {
            this.processLoansForAlerts(event.detail.loans);
        });
    }

    // 🔄 Traitement des prêts pour les alertes
    async processLoansForAlerts(loans) {
        console.log(`🔄 Traitement de ${loans.length} prêts pour les alertes...`);
        
        const alertsGenerated = [];
        
        for (const loan of loans) {
            const alertStatus = this.calculateAlertStatus(loan);
            
            if (alertStatus && alertStatus.type) {
                const sent = await this.sendNotification(loan, alertStatus);
                if (sent) {
                    alertsGenerated.push({
                        loanId: loan.id,
                        type: alertStatus.type,
                        level: alertStatus.level.level
                    });
                }
            }
        }
        
        console.log(`✅ ${alertsGenerated.length} alertes générées`);
        return alertsGenerated;
    }

    // 🔧 Utilitaires
    static getAlertLevelConfig() {
        return ALERT_LEVELS;
    }

    static getAlertTypes() {
        return ALERT_TYPES;
    }

    // 📱 Vérification du support mobile
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // 🧹 Nettoyage des anciennes données
    cleanupOldData() {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        // Nettoyer les notifications anciennes
        const notifications = this.getStoredNotifications();
        const recentNotifications = notifications.filter(n => new Date(n.timestamp) > thirtyDaysAgo);
        localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(recentNotifications));
        
        // Nettoyer l'historique ancien
        const history = this.getNotificationHistory();
        const recentHistory = history.filter(h => new Date(h.timestamp) > thirtyDaysAgo);
        localStorage.setItem('docucortex_notification_history', JSON.stringify(recentHistory));
        
        console.log('🧹 Nettoyage des anciennes données d\'alertes effectué');
    }
}

// Export d'une instance singleton
const alertsService = new AlertsService();

export default alertsService;
export { ALERT_TYPES, ALERT_LEVELS, DEFAULT_ALERT_CONFIG };