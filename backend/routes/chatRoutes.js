// backend/routes/chatRoutes.js - Routes pour le système de chat interne

const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * GET /api/chat/channels
 * Récupérer tous les canaux de chat
 */
router.get('/channels', async (req, res) => {
    try {
        const channels = await new Promise((resolve, reject) => {
            db.all(
                `SELECT id, name, description, created_by, created_at, is_private, members
                 FROM chat_channels
                 ORDER BY created_at DESC`,
                [],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows.map(row => ({
                        ...row,
                        members: row.members ? JSON.parse(row.members) : []
                    })));
                }
            );
        });

        res.json({ success: true, channels });
    } catch (error) {
        console.error('Erreur lors de la récupération des canaux:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/chat/channels
 * Créer un nouveau canal de chat
 */
router.post('/channels', async (req, res) => {
    try {
        const { name, description, is_private, members } = req.body;
        const created_by = req.headers['x-technician-id'] || 'system';

        await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO chat_channels (name, description, created_by, is_private, members)
                 VALUES (?, ?, ?, ?, ?)`,
                [name, description, created_by, is_private ? 1 : 0, JSON.stringify(members || [])],
                function (err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID });
                }
            );
        });

        res.json({ success: true, message: 'Canal créé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la création du canal:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/chat/channels/:channelId/messages
 * Récupérer les messages d'un canal spécifique
 */
router.get('/channels/:channelId/messages', async (req, res) => {
    try {
        const { channelId } = req.params;
        const limit = parseInt(req.query.limit) || 100;

        const messages = await new Promise((resolve, reject) => {
            db.all(
                `SELECT id, channel_id, user_id, username, message, timestamp, edited, reactions
                 FROM chat_messages
                 WHERE channel_id = ?
                 ORDER BY timestamp DESC
                 LIMIT ?`,
                [channelId, limit],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows.map(row => ({
                        ...row,
                        reactions: row.reactions ? JSON.parse(row.reactions) : []
                    })).reverse());
                }
            );
        });

        res.json({ success: true, messages });
    } catch (error) {
        console.error('Erreur lors de la récupération des messages:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/chat/messages
 * Envoyer un message dans un canal
 */
router.post('/messages', async (req, res) => {
    try {
        const { channelId, message } = req.body;
        const user_id = req.headers['x-technician-id'] || 'system';
        const username = req.headers['x-technician-name'] || 'Système';

        const result = await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO chat_messages (channel_id, user_id, username, message, timestamp)
                 VALUES (?, ?, ?, ?, datetime('now'))`,
                [channelId, user_id, username, message],
                function (err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID });
                }
            );
        });

        res.json({ success: true, messageId: result.id });
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PUT /api/chat/messages/:id
 * Modifier un message
 */
router.put('/messages/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { newText } = req.body;

        await new Promise((resolve, reject) => {
            db.run(
                `UPDATE chat_messages 
                 SET message = ?, edited = 1
                 WHERE id = ?`,
                [newText, id],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        res.json({ success: true, message: 'Message modifié avec succès' });
    } catch (error) {
        console.error('Erreur lors de la modification du message:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /api/chat/messages/:id
 * Supprimer un message
 */
router.delete('/messages/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await new Promise((resolve, reject) => {
            db.run('DELETE FROM chat_messages WHERE id = ?', [id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        res.json({ success: true, message: 'Message supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression du message:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/chat/reactions
 * Ajouter/retirer une réaction à un message
 */
router.post('/reactions', async (req, res) => {
    try {
        const { messageId, emoji } = req.body;
        const user_id = req.headers['x-technician-id'] || 'system';

        // Récupérer les réactions actuelles
        const message = await new Promise((resolve, reject) => {
            db.get('SELECT reactions FROM chat_messages WHERE id = ?', [messageId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        let reactions = message.reactions ? JSON.parse(message.reactions) : [];

        // Vérifier si l'utilisateur a déjà réagi avec cet emoji
        const existingIndex = reactions.findIndex(r => r.emoji === emoji && r.userId === user_id);

        if (existingIndex >= 0) {
            // Retirer la réaction
            reactions.splice(existingIndex, 1);
        } else {
            // Ajouter la réaction
            reactions.push({ emoji, userId: user_id, timestamp: new Date().toISOString() });
        }

        // Mettre à jour la base de données
        await new Promise((resolve, reject) => {
            db.run(
                'UPDATE chat_messages SET reactions = ? WHERE id = ?',
                [JSON.stringify(reactions), messageId],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        res.json({ success: true, reactions });
    } catch (error) {
        console.error('Erreur lors de la gestion de la réaction:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
