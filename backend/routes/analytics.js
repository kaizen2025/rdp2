/**
 * Routes API pour l'analytique des documents
 */

const express = require('express');
const router = express.Router();
const analyticsService = require('../services/ai/analyticsService');
const databaseService = require('../services/databaseService');

/**
 * GET /api/ai/analytics/documents
 * Récupère les statistiques globales des documents
 */
router.get('/documents', async (req, res) => {
    try {
        const { timeRange = '30d' } = req.query;

        console.log(`[Analytics API] Récupération des statistiques (${timeRange})`);

        // Récupérer tous les documents depuis la base de données
        // NOTE: À adapter selon votre base de données réelle
        const documents = await databaseService.getAllDocuments();

        if (!documents || documents.length === 0) {
            // Retourner des statistiques vides si pas de documents
            return res.json({
                success: true,
                stats: {
                    total: 0,
                    byCategory: {},
                    byAuthor: {},
                    byFileType: {},
                    sizeStats: { total: 0, avg: 0, min: 0, max: 0 },
                    documentsThisWeek: 0,
                    documentsThisMonth: 0,
                    growth: 0,
                    recentActivity: []
                },
                trends: {
                    dates: [],
                    documentsAdded: [],
                    documentsViewed: [],
                    documentsByCategory: {}
                },
                anomalies: []
            });
        }

        // Générer les statistiques
        const statsResult = await analyticsService.getDocumentAnalytics(documents, timeRange);
        const trendsResult = await analyticsService.getDocumentTrends(documents, timeRange);

        if (!statsResult.success || !trendsResult.success) {
            throw new Error('Erreur lors de la génération des statistiques');
        }

        // Détecter les anomalies
        const anomalies = await analyticsService.detectAnomalies(documents, statsResult.stats);

        res.json({
            success: true,
            stats: statsResult.stats,
            trends: trendsResult.trends,
            anomalies,
            timeRange
        });

    } catch (error) {
        console.error('[Analytics API] Erreur:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des statistiques',
            details: error.message
        });
    }
});

/**
 * GET /api/ai/analytics/export
 * Exporte les statistiques dans différents formats
 */
router.get('/export', async (req, res) => {
    try {
        const { format = 'json', timeRange = '30d' } = req.query;

        console.log(`[Analytics API] Export des statistiques (${format}, ${timeRange})`);

        // Récupérer les documents
        const documents = await databaseService.getAllDocuments();

        if (!documents || documents.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Aucun document disponible'
            });
        }

        // Générer les statistiques
        const statsResult = await analyticsService.getDocumentAnalytics(documents, timeRange);
        const trendsResult = await analyticsService.getDocumentTrends(documents, timeRange);

        if (!statsResult.success || !trendsResult.success) {
            throw new Error('Erreur lors de la génération des statistiques');
        }

        // Exporter dans le format demandé
        const exportResult = await analyticsService.exportAnalytics(
            statsResult.stats,
            trendsResult.trends,
            format
        );

        if (!exportResult.success) {
            throw new Error(exportResult.error);
        }

        // Définir les headers appropriés
        res.setHeader('Content-Type', exportResult.contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
        res.send(exportResult.data);

    } catch (error) {
        console.error('[Analytics API] Erreur export:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de l\'export',
            details: error.message
        });
    }
});

/**
 * GET /api/ai/analytics/trends
 * Récupère uniquement les tendances temporelles
 */
router.get('/trends', async (req, res) => {
    try {
        const { timeRange = '30d' } = req.query;

        console.log(`[Analytics API] Récupération des tendances (${timeRange})`);

        const documents = await databaseService.getAllDocuments();

        if (!documents || documents.length === 0) {
            return res.json({
                success: true,
                trends: {
                    dates: [],
                    documentsAdded: [],
                    documentsViewed: [],
                    documentsByCategory: {}
                }
            });
        }

        const result = await analyticsService.getDocumentTrends(documents, timeRange);

        res.json(result);

    } catch (error) {
        console.error('[Analytics API] Erreur:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des tendances',
            details: error.message
        });
    }
});

/**
 * GET /api/ai/analytics/anomalies
 * Détecte les anomalies dans les documents
 */
router.get('/anomalies', async (req, res) => {
    try {
        const { timeRange = '30d' } = req.query;

        console.log(`[Analytics API] Détection des anomalies (${timeRange})`);

        const documents = await databaseService.getAllDocuments();

        if (!documents || documents.length === 0) {
            return res.json({
                success: true,
                anomalies: []
            });
        }

        const statsResult = await analyticsService.getDocumentAnalytics(documents, timeRange);

        if (!statsResult.success) {
            throw new Error('Erreur lors de la génération des statistiques');
        }

        const anomalies = await analyticsService.detectAnomalies(documents, statsResult.stats);

        res.json({
            success: true,
            anomalies,
            count: anomalies.length
        });

    } catch (error) {
        console.error('[Analytics API] Erreur:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la détection des anomalies',
            details: error.message
        });
    }
});

/**
 * GET /api/ai/analytics/summary
 * Récupère un résumé rapide des statistiques clés
 */
router.get('/summary', async (req, res) => {
    try {
        console.log('[Analytics API] Récupération du résumé');

        const documents = await databaseService.getAllDocuments();

        if (!documents || documents.length === 0) {
            return res.json({
                success: true,
                summary: {
                    totalDocuments: 0,
                    categoriesCount: 0,
                    authorsCount: 0,
                    thisWeek: 0,
                    thisMonth: 0
                }
            });
        }

        const result = await analyticsService.getDocumentAnalytics(documents, 'all');

        if (!result.success) {
            throw new Error('Erreur lors de la génération des statistiques');
        }

        const summary = {
            totalDocuments: result.stats.total,
            categoriesCount: Object.keys(result.stats.byCategory || {}).length,
            authorsCount: Object.keys(result.stats.byAuthor || {}).length,
            thisWeek: result.stats.documentsThisWeek,
            thisMonth: result.stats.documentsThisMonth,
            topCategory: Object.keys(result.stats.byCategory || {})[0] || 'N/A',
            topAuthor: Object.keys(result.stats.byAuthor || {})[0] || 'N/A',
            totalSize: result.stats.sizeStats.total,
            avgSize: result.stats.sizeStats.avg
        };

        res.json({
            success: true,
            summary
        });

    } catch (error) {
        console.error('[Analytics API] Erreur:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération du résumé',
            details: error.message
        });
    }
});

module.exports = router;
