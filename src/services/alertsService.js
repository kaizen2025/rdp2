// src/services/alertsService.js - Service de gestion des alertes

export const ALERT_LEVELS = {
    INFO: { level: 1, label: 'Info', color: 'info' },
    WARNING: { level: 2, label: 'Attention', color: 'warning' },
    ERROR: { level: 3, label: 'Erreur', color: 'error' },
    CRITICAL: { level: 4, label: 'Critique', color: 'error' }
};

export const ALERT_TYPES = {
    OVERDUE: 'overdue',
    DUE_SOON: 'due_soon',
    EXTENDED: 'extended',
    NORMAL: 'normal'
};

class AlertsService {
    constructor() {
        this.notifications = [];
        this.preferences = this.loadPreferences();
    }

    loadPreferences() {
        const stored = localStorage.getItem('docucortex_alert_preferences');
        return stored ? JSON.parse(stored) : {
            enableBrowserNotifications: true,
            enableInAppNotifications: true,
            enableEmailNotifications: false,
            criticalThreshold: 2,
            warningThreshold: 7
        };
    }

    getUserPreferences() {
        return this.preferences;
    }

    updateUserPreferences(newPreferences) {
        this.preferences = { ...this.preferences, ...newPreferences };
        localStorage.setItem('docucortex_alert_preferences', JSON.stringify(this.preferences));
        return this.preferences;
    }

    getStoredNotifications() {
        const stored = localStorage.getItem('docucortex_notifications');
        return stored ? JSON.parse(stored) : [];
    }

    markAsRead(notificationId) {
        const notifications = this.getStoredNotifications();
        const updated = notifications.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
        );
        localStorage.setItem('docucortex_notifications', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('docucortex-alert-read', { detail: notificationId }));
    }

    deleteNotification(notificationId) {
        const notifications = this.getStoredNotifications();
        const updated = notifications.filter(n => n.id !== notificationId);
        localStorage.setItem('docucortex_notifications', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('docucortex-alert-deleted', { detail: notificationId }));
    }

    getNotificationHistory() {
        const stored = localStorage.getItem('docucortex_notification_history');
        return stored ? JSON.parse(stored) : [];
    }

    processLoansForAlerts(loans) {
        // Process loans and create alerts if necessary
        const alerts = this.getAlerts(loans);
        alerts.forEach(alert => {
            this.createNotification({
                id: `alert_${alert.id}_${Date.now()}`,
                title: `Alerte prêt: ${alert.borrowerName}`,
                message: `Ordinateur ${alert.computerSerial} - ${alert.alertStatus.type}`,
                priority: alert.alertStatus.level.level,
                timestamp: new Date().toISOString(),
                read: false,
                loanId: alert.id,
                actions: [
                    { action: 'view', label: 'Voir le prêt', icon: 'visibility' },
                    { action: 'extend', label: 'Prolonger', icon: 'schedule' }
                ]
            });
        });
    }

    createNotification(notification) {
        const notifications = this.getStoredNotifications();
        const exists = notifications.find(n => n.id === notification.id);
        if (!exists) {
            notifications.unshift(notification);
            localStorage.setItem('docucortex_notifications', JSON.stringify(notifications));
            window.dispatchEvent(new CustomEvent('docucortex-new-alert', { detail: notification }));
        }
    }

    getAlertStatistics() {
        const notifications = this.getStoredNotifications();
        return {
            total: notifications.length,
            unread: notifications.filter(n => !n.read).length,
            urgent: notifications.filter(n => n.priority >= 3).length
        };
    }

    calculateAlertStatus(loan) {
        if (!loan || !loan.expectedReturnDate) {
            return {
                level: ALERT_LEVELS.INFO,
                type: ALERT_TYPES.NORMAL,
                isOverdue: false,
                daysUntilReturn: null
            };
        }

        const now = new Date();
        const returnDate = new Date(loan.expectedReturnDate);
        const diffTime = returnDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let level = ALERT_LEVELS.INFO;
        let type = ALERT_TYPES.NORMAL;
        let isOverdue = false;

        if (diffDays < 0) {
            isOverdue = true;
            if (Math.abs(diffDays) > 7) {
                level = ALERT_LEVELS.CRITICAL;
            } else {
                level = ALERT_LEVELS.ERROR;
            }
            type = ALERT_TYPES.OVERDUE;
        } else if (diffDays <= 2) {
            level = ALERT_LEVELS.WARNING;
            type = ALERT_TYPES.DUE_SOON;
        }

        return {
            level,
            type,
            isOverdue,
            daysUntilReturn: diffDays
        };
    }

    getAlerts(loans) {
        if (!Array.isArray(loans)) return [];
        return loans
            .map(loan => ({
                ...loan,
                alertStatus: this.calculateAlertStatus(loan)
            }))
            .filter(loan => loan.alertStatus.level.level >= 2);
    }
}

export default new AlertsService();
