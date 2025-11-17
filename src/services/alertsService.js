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
