/**
 * Routes pour les notifications de prêts
 */

const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');

// Obtenir toutes les notifications
router.get('/', async (req, res) => {
    try {
        const notifications = await notificationService.getNotifications();
        res.json(notifications);
    } catch (error) {
        console.error('Erreur récupération notifications:', error);
        res.status(500).json({ error: 'Erreur serveur', message: error.message });
    }
});

// Obtenir les notifications non lues
router.get('/unread', async (req, res) => {
    try {
        const notifications = await notificationService.getUnreadNotifications();
        res.json(notifications);
    } catch (error) {
        console.error('Erreur récupération notifications non lues:', error);
        res.status(500).json({ error: 'Erreur serveur', message: error.message });
    }
});

// Marquer une notification comme lue
router.put('/:id/read', async (req, res) => {
    try {
        const result = await notificationService.markNotificationAsRead(req.params.id);
        res.json(result);
    } catch (error) {
        console.error('Erreur marquage notification:', error);
        res.status(500).json({ error: 'Erreur serveur', message: error.message });
    }
});

// Marquer toutes les notifications comme lues
router.put('/read-all', async (req, res) => {
    try {
        const result = await notificationService.markAllNotificationsAsRead();
        res.json(result);
    } catch (error) {
        console.error('Erreur marquage toutes notifications:', error);
        res.status(500).json({ error: 'Erreur serveur', message: error.message });
    }
});

// Nettoyer les anciennes notifications
router.delete('/clean', async (req, res) => {
    try {
        const daysToKeep = req.query.days ? parseInt(req.query.days) : 90;
        const result = await notificationService.cleanOldNotifications(daysToKeep);
        res.json(result);
    } catch (error) {
        console.error('Erreur nettoyage notifications:', error);
        res.status(500).json({ error: 'Erreur serveur', message: error.message });
    }
});

module.exports = router;
