const express = require('express');
const router = express.Router();
const rdsService = require('../services/rdsService');

// Récupérer les sessions RDS stockées
router.get('/', async (req, res) => {
    try {
        const sessions = await rdsService.getStoredRdsSessions();
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rafraîchir les sessions RDS (force update)
router.post('/refresh', async (req, res) => {
    try {
        const result = await rdsService.refreshAndStoreRdsSessions();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Pinger un serveur RDS pour obtenir son statut
router.get('/ping/:server', async (req, res) => {
    try {
        const { server } = req.params;
        const result = await rdsService.pingServer(server);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Envoyer un message à une session
router.post('/send-message', async (req, res) => {
    try {
        const { server, sessionId, message } = req.body;
        const result = await rdsService.sendMessage(server, sessionId, message);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
