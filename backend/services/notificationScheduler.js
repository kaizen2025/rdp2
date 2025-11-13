/**
 * Planificateur automatique pour les notifications de prêts
 * Vérifie périodiquement les prêts et génère des notifications
 */

const notificationService = require('./notificationService');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class NotificationScheduler {
    constructor() {
        this.interval = null;
        this.checkFrequency = 3600000; // 1 heure en millisecondes
        this.isRunning = false;
        this.db = null;
    }

    /**
     * Obtenir la connexion à la base de données
     */
    getDb() {
        if (!this.db) {
            const dbPath = path.join(__dirname, '../../data/rds_viewer_data.sqlite');
            const dbDir = path.dirname(dbPath);

            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            this.db = new Database(dbPath);
            this.db.pragma('journal_mode = WAL');
        }
        return this.db;
    }

    /**
     * Démarrer le planificateur automatique
     */
    start() {
        if (this.isRunning) {
            console.log('[NotificationScheduler] Déjà démarré');
            return;
        }

        console.log('[NotificationScheduler] Démarrage du planificateur de notifications...');

        // Vérification immédiate au démarrage
        this.checkLoans();

        // Planifier les vérifications périodiques
        this.interval = setInterval(() => {
            this.checkLoans();
        }, this.checkFrequency);

        this.isRunning = true;
        console.log(`[NotificationScheduler] Planificateur actif - vérification toutes les ${this.checkFrequency / 60000} minutes`);
    }

    /**
     * Arrêter le planificateur
     */
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            this.isRunning = false;
            console.log('[NotificationScheduler] Planificateur arrêté');
        }
    }

    /**
     * Vérifier tous les prêts et générer les notifications nécessaires
     */
    async checkLoans() {
        try {
            console.log('[NotificationScheduler] Vérification des prêts en cours...');

            // Récupérer tous les prêts actifs
            const db = this.getDb();
            const loans = db.prepare(`
                SELECT * FROM loans
                WHERE status NOT IN ('returned', 'cancelled')
            `).all();

            if (loans.length === 0) {
                console.log('[NotificationScheduler] Aucun prêt actif à vérifier');
                return;
            }

            // Récupérer les paramètres
            const settingsRow = db.prepare('SELECT value FROM key_value_store WHERE key = ?').get('loan_settings');
            const settings = settingsRow ? JSON.parse(settingsRow.value) : this.getDefaultSettings();

            if (!settings.autoNotifications) {
                console.log('[NotificationScheduler] Notifications automatiques désactivées');
                return;
            }

            // Vérifier les prêts et créer les notifications
            const newNotifications = await notificationService.checkAllLoansForNotifications(loans, settings);

            if (newNotifications && newNotifications.length > 0) {
                console.log(`[NotificationScheduler] ✅ ${newNotifications.length} nouvelle(s) notification(s) créée(s)`);
            } else {
                console.log('[NotificationScheduler] Aucune nouvelle notification à créer');
            }

        } catch (error) {
            console.error('[NotificationScheduler] Erreur lors de la vérification des prêts:', error);
        }
    }

    /**
     * Paramètres par défaut si non trouvés
     */
    getDefaultSettings() {
        return {
            autoNotifications: true,
            reminderDaysBefore: [3, 1], // Rappels 3 jours et 1 jour avant
            overdueReminderDays: [1, 3, 7] // Alertes après 1, 3 et 7 jours de retard
        };
    }

    /**
     * Changer la fréquence de vérification
     */
    setFrequency(minutes) {
        this.checkFrequency = minutes * 60000;

        if (this.isRunning) {
            this.stop();
            this.start();
        }

        console.log(`[NotificationScheduler] Fréquence mise à jour: ${minutes} minutes`);
    }

    /**
     * Obtenir le statut du planificateur
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            checkFrequency: this.checkFrequency,
            checkFrequencyMinutes: this.checkFrequency / 60000
        };
    }
}

// Singleton
const notificationScheduler = new NotificationScheduler();

module.exports = notificationScheduler;
