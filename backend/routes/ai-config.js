/**
 * Routes API pour la configuration de l'IA
 * Gère la récupération des modèles disponibles, configuration des providers, etc.
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

/**
 * GET /api/ai/config/gemini/models
 * Récupère la liste des modèles Gemini disponibles via l'API Google
 */
router.get('/gemini/models', async (req, res) => {
    try {
        const { apiKey } = req.query;

        if (!apiKey) {
            return res.status(400).json({
                success: false,
                error: 'Clé API Gemini requise'
            });
        }

        console.log('[AI Config] Récupération des modèles Gemini disponibles...');

        // Appel à l'API Google Gemini pour lister les modèles
        const response = await axios.get('https://generativelanguage.googleapis.com/v1beta/models', {
            params: {
                key: apiKey
            },
            timeout: 10000
        });

        if (!response.data || !response.data.models) {
            return res.status(500).json({
                success: false,
                error: 'Réponse invalide de l\'API Gemini'
            });
        }

        // Extraire les informations pertinentes des modèles
        const models = response.data.models.map(model => ({
            id: model.name.replace('models/', ''), // Nettoyer le préfixe "models/"
            name: model.displayName || model.name,
            description: model.description || '',
            supportedGenerationMethods: model.supportedGenerationMethods || [],
            inputTokenLimit: model.inputTokenLimit || 0,
            outputTokenLimit: model.outputTokenLimit || 0,
            temperature: model.temperature,
            topP: model.topP,
            topK: model.topK
        }));

        // Filtrer pour ne garder que les modèles Gemini (pas les embeddings)
        const geminiModels = models.filter(m =>
            m.id.includes('gemini') &&
            m.supportedGenerationMethods.includes('generateContent')
        );

        // Trier par nom (les plus récents en premier)
        geminiModels.sort((a, b) => {
            // Ordre: 2.0 > 1.5 > 1.0, puis flash > pro
            const aVersion = a.id.match(/(\d+\.\d+)/)?.[1] || '0';
            const bVersion = b.id.match(/(\d+\.\d+)/)?.[1] || '0';

            if (aVersion !== bVersion) {
                return parseFloat(bVersion) - parseFloat(aVersion);
            }

            // Si même version, flash avant pro
            if (a.id.includes('flash') && !b.id.includes('flash')) return -1;
            if (!a.id.includes('flash') && b.id.includes('flash')) return 1;

            return a.id.localeCompare(b.id);
        });

        console.log(`[AI Config] ✅ ${geminiModels.length} modèles Gemini trouvés`);

        res.json({
            success: true,
            models: geminiModels,
            total: geminiModels.length,
            recommended: geminiModels[0]?.id || 'gemini-2.0-flash-exp'
        });

    } catch (error) {
        console.error('[AI Config] ❌ Erreur récupération modèles:', error.message);

        if (error.response?.status === 403) {
            return res.status(403).json({
                success: false,
                error: 'Clé API invalide ou accès refusé',
                details: error.response.data
            });
        }

        if (error.response?.status === 429) {
            return res.status(429).json({
                success: false,
                error: 'Limite de requêtes atteinte. Réessayez dans quelques minutes.'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des modèles',
            details: error.message
        });
    }
});

/**
 * GET /api/ai/config/update-url
 * Récupère l'URL de mise à jour configurée
 */
router.get('/update-url', async (req, res) => {
    try {
        const configPath = path.join(__dirname, '../../config/config.json');
        const configData = await fs.readFile(configPath, 'utf-8');
        const config = JSON.parse(configData);

        res.json({
            success: true,
            updateUrl: config.updateUrl || 'file://192.168.1.230/donnees/Informatique/PROGRAMMES/Programme RDS/RDS Viewer Group/update'
        });
    } catch (error) {
        console.error('[AI Config] Erreur lecture URL de mise à jour:', error);
        res.json({
            success: true,
            updateUrl: 'file://192.168.1.230/donnees/Informatique/PROGRAMMES/Programme RDS/RDS Viewer Group/update'
        });
    }
});

/**
 * POST /api/ai/config/update-url
 * Met à jour l'URL de mise à jour
 */
router.post('/update-url', async (req, res) => {
    try {
        const { updateUrl } = req.body;

        if (!updateUrl) {
            return res.status(400).json({
                success: false,
                error: 'URL de mise à jour requise'
            });
        }

        const configPath = path.join(__dirname, '../../config/config.json');

        let config = {};
        try {
            const configData = await fs.readFile(configPath, 'utf-8');
            config = JSON.parse(configData);
        } catch (error) {
            // Fichier n'existe pas, on crée une config vide
            console.log('[AI Config] Création de config.json');
        }

        config.updateUrl = updateUrl;

        await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');

        console.log(`[AI Config] ✅ URL de mise à jour configurée: ${updateUrl}`);

        res.json({
            success: true,
            updateUrl: config.updateUrl
        });

    } catch (error) {
        console.error('[AI Config] Erreur sauvegarde URL de mise à jour:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la sauvegarde de l\'URL',
            details: error.message
        });
    }
});

/**
 * POST /api/ai/config/gemini/test-key
 * Teste une clé API Gemini
 */
router.post('/gemini/test-key', async (req, res) => {
    try {
        const { apiKey } = req.body;

        if (!apiKey) {
            return res.status(400).json({
                success: false,
                error: 'Clé API requise'
            });
        }

        console.log('[AI Config] Test de la clé API Gemini...');

        // Faire un appel simple pour tester la clé
        const response = await axios.get('https://generativelanguage.googleapis.com/v1beta/models', {
            params: { key: apiKey },
            timeout: 5000
        });

        if (response.data && response.data.models) {
            console.log('[AI Config] ✅ Clé API valide');
            res.json({
                success: true,
                valid: true,
                modelsCount: response.data.models.length
            });
        } else {
            res.json({
                success: false,
                valid: false,
                error: 'Réponse invalide de l\'API'
            });
        }

    } catch (error) {
        console.error('[AI Config] ❌ Clé API invalide:', error.message);

        res.json({
            success: false,
            valid: false,
            error: error.response?.status === 403 ? 'Clé API invalide' : 'Erreur de connexion'
        });
    }
});

module.exports = router;
