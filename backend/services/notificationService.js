// backend/services/notificationService.js - VERSION FINALE SANS APPEL SYSTÈME

const db = require('./databaseService');
const { generateId } = require('./utils');
const configService = require('./configService');

const parseJSON = (field, defaultValue = null) => {
    try { return JSON.parse(field) || defaultValue; } catch { return defaultValue; }
};
const stringifyJSON = (field) => JSON.stringify(field);

const NOTIFICATION_TYPES = {
    REMINDER_BEFORE: 'reminder_before',
    OVERDUE: 'overdue',
    CRITICAL: 'critical',
    RETURNED: 'returned',
    EXTENDED: 'extended',
};

async function getNotifications() {
    try {
        const rows = db.all('SELECT * FROM loan_notifications ORDER BY date DESC');
        return rows.map(n => ({ ...n, read: !!n.read_status, details: parseJSON(n.details, {}) }));
    } catch (error) {
        console.error("Erreur getNotifications:", error);
        return [];
    }
}

async function createLoanNotification(loan, type, details = {}) {
    const notification = {
        id: generateId(),
        loanId: loan.id,
        computerName: loan.computerName,
        userName: loan.userName,
        userDisplayName: loan.userDisplayName,
        type,
        date: new Date().toISOString(),
        details: { ...details, expectedReturnDate: loan.expectedReturnDate, loanDate: loan.loanDate },
    };

    try {
        db.run(
            'INSERT INTO loan_notifications (id, loanId, computerName, userName, userDisplayName, type, date, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [notification.id, notification.loanId, notification.computerName, notification.userName, notification.userDisplayName, notification.type, notification.date, stringifyJSON(notification.details)]
        );
        // L'appel à showSystemNotification est supprimé car il n'existe plus dans un backend Node.js
        return notification;
    } catch (error) {
        console.error("Erreur createLoanNotification:", error);
        return null;
    }
}

// ... (Le reste du fichier est identique et correct)

async function markNotificationAsRead(notificationId) {
    try {
        db.run('UPDATE loan_notifications SET read_status = 1 WHERE id = ?', [notificationId]);
        return { success: true };
    } catch (error) {
        console.error("Erreur markNotificationAsRead:", error);
        return { success: false, error: error.message };
    }
}

async function markAllNotificationsAsRead() {
    try {
        db.run('UPDATE loan_notifications SET read_status = 1 WHERE read_status = 0');
        return { success: true };
    } catch (error) {
        console.error("Erreur markAllNotificationsAsRead:", error);
        return { success: false, error: error.message };
    }
}

async function cleanOldNotifications(daysToKeep = 90) {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const result = db.run('DELETE FROM loan_notifications WHERE read_status = 1 AND date < ?', [cutoffDate.toISOString()]);
        console.log(`${result.changes} anciennes notifications supprimées.`);
        return { success: true, removed: result.changes };
    } catch (error) {
        console.error("Erreur cleanOldNotifications:", error);
        return { success: false, error: error.message };
    }
}

async function getUnreadNotifications() {
    try {
        const rows = db.all('SELECT * FROM loan_notifications WHERE read_status = 0 ORDER BY date DESC');
        return rows.map(n => ({ ...n, read: false, details: parseJSON(n.details, {}) }));
    } catch (error) {
        console.error("Erreur getUnreadNotifications:", error);
        return [];
    }
}

async function checkAllLoansForNotifications(loans, settings) {
    const now = new Date();
    const notificationsCreated = [];
    for (const loan of loans) {
        if (['returned', 'cancelled'].includes(loan.status)) continue;
        const expectedReturn = new Date(loan.expectedReturnDate);
        const daysUntilReturn = Math.ceil((expectedReturn - now) / (1000 * 60 * 60 * 24));
        const daysOverdue = Math.max(0, -daysUntilReturn);
        let notificationType = null;
        let shouldNotify = false;
        const existingNotif = db.get('SELECT id FROM loan_notifications WHERE loanId = ? AND type = ?', [loan.id, `overdue_${daysOverdue}`]);
        if (existingNotif) continue;
        if (daysOverdue > 0) {
            if (daysOverdue >= 7 && settings.overdueReminderDays.includes(7)) {
                notificationType = NOTIFICATION_TYPES.CRITICAL;
                shouldNotify = true;
            } else if (settings.overdueReminderDays.includes(daysOverdue)) {
                notificationType = NOTIFICATION_TYPES.OVERDUE;
                shouldNotify = true;
            }
        } else {
            if (settings.reminderDaysBefore.includes(daysUntilReturn)) {
                notificationType = NOTIFICATION_TYPES.REMINDER_BEFORE;
                shouldNotify = true;
            }
        }
        if (shouldNotify && notificationType) {
            const notification = await createLoanNotification(loan, notificationType, { daysOverdue });
            if (notification) notificationsCreated.push(notification);
        }
    }
    return notificationsCreated;
}

async function findNotificationByContent(content) {
    try {
        // Recherche d'une notification non lue avec le même contenu dans les dernières 24h
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const row = db.get(
            'SELECT * FROM loan_notifications WHERE details LIKE ? AND date > ? ORDER BY date DESC LIMIT 1',
            [`%${content}%`, yesterday.toISOString()]
        );
        if (!row) return null;
        return { ...row, read: !!row.read_status, details: parseJSON(row.details, {}) };
    } catch (error) {
        console.error("Erreur findNotificationByContent:", error);
        return null;
    }
}

async function createNotification(notification) {
    try {
        const id = generateId();
        const now = new Date().toISOString();
        db.run(
            'INSERT INTO loan_notifications (id, loanId, computerName, userName, userDisplayName, type, date, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, null, '', '', '', notification.type || 'info', now, stringifyJSON({ title: notification.title, body: notification.body })]
        );
        return { id, ...notification, date: now };
    } catch (error) {
        console.error("Erreur createNotification:", error);
        return null;
    }
}

module.exports = {
    createLoanNotification,
    createNotification,
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    cleanOldNotifications,
    getUnreadNotifications,
    checkAllLoansForNotifications,
    findNotificationByContent,
    NOTIFICATION_TYPES,
};