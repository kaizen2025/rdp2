/**
 * Routes API pour la recherche avancée
 */

const express = require('express');
const router = express.Router();
const advancedSearchService = require('../services/ai/advancedSearchService');

/**
 * POST /api/ai/advanced-search
 * Recherche avec filtres multiples
 */
router.post('/', async (req, res) => {
    try {
        const { query, filters = {}, options = {} } = req.body;

        console.log('[Advanced Search API] Nouvelle recherche:', { query, filters });

        const result = await advancedSearchService.searchWithFilters(query, filters, options);

        res.json(result);

    } catch (error) {
        console.error('[Advanced Search API] Erreur:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la recherche avancée',
            details: error.message
        });
    }
});

/**
 * POST /api/ai/advanced-search/save
 * Sauvegarder une recherche
 */
router.post('/save', async (req, res) => {
    try {
        const { userId, name, filters } = req.body;

        if (!userId || !name || !filters) {
            return res.status(400).json({
                success: false,
                error: 'userId, name et filters sont requis'
            });
        }

        const result = await advancedSearchService.saveSearch(userId, name, filters);

        console.log(`[Advanced Search API] Recherche sauvegardée: ${name}`);

        res.json(result);

    } catch (error) {
        console.error('[Advanced Search API] Erreur sauvegarde:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la sauvegarde',
            details: error.message
        });
    }
});

/**
 * GET /api/ai/advanced-search/saved
 * Récupérer les recherches sauvegardées d'un utilisateur
 */
router.get('/saved', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId requis'
            });
        }

        const result = await advancedSearchService.getSavedSearches(userId);

        res.json(result);

    } catch (error) {
        console.error('[Advanced Search API] Erreur récupération recherches:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération',
            details: error.message
        });
    }
});

/**
 * GET /api/ai/advanced-search/suggestions
 * Obtenir des suggestions de recherche
 */
router.get('/suggestions', async (req, res) => {
    try {
        const { query, userId } = req.query;

        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'query requis'
            });
        }

        const result = await advancedSearchService.getSuggestions(query, userId);

        res.json(result);

    } catch (error) {
        console.error('[Advanced Search API] Erreur suggestions:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la génération de suggestions',
            details: error.message
        });
    }
});

/**
 * POST /api/ai/advanced-search/stats
 * Obtenir des statistiques sur les résultats
 */
router.post('/stats', async (req, res) => {
    try {
        const { results } = req.body;

        if (!results || !Array.isArray(results)) {
            return res.status(400).json({
                success: false,
                error: 'results (array) requis'
            });
        }

        const stats = advancedSearchService.getSearchStats(results);

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('[Advanced Search API] Erreur stats:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors du calcul des statistiques',
            details: error.message
        });
    }
});

module.exports = router;
