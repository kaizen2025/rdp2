// backend/routes/preferencesRoutes.js - Routes pour les préférences utilisateur

const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * GET /api/preferences
 * Récupérer les préférences de l'utilisateur connecté
 */
router.get('/', async (req, res) => {
    try {
        const user_id = req.headers['x-technician-id'] || 'default';

        const preferences = await new Promise((resolve, reject) => {
            db.get(
                'SELECT preferences FROM user_preferences WHERE user_id = ?',
                [user_id],
                (err, row) => {
                    if (err) reject(err);
                    else if (row) {
                        resolve(JSON.parse(row.preferences));
                    } else {
                        // Préférences par défaut
                        resolve({
                            notifications: {
                                enabled: true,
                                sound: true,
                                desktop: true,
                                loans: true,
                                returns: true,
                                overdue: true
                            },
                            theme: 'light',
                            language: 'fr'
                        });
                    }
                }
            );
        });

        res.json({ success: true, preferences });
    } catch (error) {
        console.error('Erreur lors de la récupération des préférences:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/preferences
 * Sauvegarder les préférences de l'utilisateur connecté
 */
router.post('/', async (req, res) => {
    try {
        const user_id = req.headers['x-technician-id'] || 'default';
        const preferences = req.body;

        await new Promise((resolve, reject) => {
            db.run(
                `INSERT OR REPLACE INTO user_preferences (user_id, preferences, updated_at)
                 VALUES (?, ?, datetime('now'))`,
                [user_id, JSON.stringify(preferences)],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        res.json({ success: true, message: 'Préférences sauvegardées avec succès' });
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des préférences:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
