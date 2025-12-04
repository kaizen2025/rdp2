/**
 * Routes API pour la catégorisation automatique des documents
 */

const express = require('express');
const router = express.Router();
const documentCategorizationService = require('../services/ai/documentCategorizationService');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configuration multer pour l'upload temporaire
const upload = multer({
    dest: 'temp/categorization/',
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
});

/**
 * POST /api/ai/categorize/document
 * Catégorise un seul document
 */
router.post('/document', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Aucun fichier fourni'
            });
        }

        const { content } = req.body;

        console.log('[Categorization API] Analyse du document:', req.file.originalname);

        const result = await documentCategorizationService.categorizeDocument(
            req.file.path,
            content || null
        );

        // Nettoyage du fichier temporaire
        try {
            await fs.unlink(req.file.path);
        } catch (error) {
            console.warn('[Categorization API] Erreur suppression fichier temporaire:', error);
        }

        res.json({
            ...result,
            originalFilename: req.file.originalname
        });

    } catch (error) {
        console.error('[Categorization API] Erreur:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la catégorisation',
            details: error.message
        });
    }
});

/**
 * POST /api/ai/categorize/batch
 * Catégorise plusieurs documents en batch
 */
router.post('/batch', upload.array('files', 50), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Aucun fichier fourni'
            });
        }

        console.log(`[Categorization API] Catégorisation batch: ${req.files.length} fichiers`);

        const documents = req.files.map(file => ({
            filePath: file.path,
            originalname: file.originalname,
            content: null // Le contenu peut être ajouté si nécessaire
        }));

        const result = await documentCategorizationService.categorizeDocuments(documents);

        // Nettoyage des fichiers temporaires
        for (const file of req.files) {
            try {
                await fs.unlink(file.path);
            } catch (error) {
                console.warn('[Categorization API] Erreur suppression:', error);
            }
        }

        res.json(result);

    } catch (error) {
        console.error('[Categorization API] Erreur batch:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la catégorisation batch',
            details: error.message
        });
    }
});

/**
 * POST /api/ai/categorize/text
 * Catégorise du contenu textuel sans fichier
 */
router.post('/text', async (req, res) => {
    try {
        const { content, filename } = req.body;

        if (!content) {
            return res.status(400).json({
                success: false,
                error: 'Contenu textuel requis'
            });
        }

        console.log('[Categorization API] Analyse de contenu textuel');

        const result = await documentCategorizationService.categorizeDocument(
            filename || 'document.txt',
            content
        );

        res.json(result);

    } catch (error) {
        console.error('[Categorization API] Erreur:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la catégorisation',
            details: error.message
        });
    }
});

/**
 * GET /api/ai/categorize/categories
 * Liste des catégories disponibles
 */
router.get('/categories', (req, res) => {
    try {
        const categories = documentCategorizationService.categories.map(cat => ({
            name: cat.name,
            keywords: cat.keywords,
            description: `Documents de type ${cat.name.toLowerCase()}`
        }));

        res.json({
            success: true,
            categories,
            total: categories.length
        });

    } catch (error) {
        console.error('[Categorization API] Erreur:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des catégories',
            details: error.message
        });
    }
});

/**
 * POST /api/ai/categorize/stats
 * Génère des statistiques sur les résultats de catégorisation
 */
router.post('/stats', async (req, res) => {
    try {
        const { results } = req.body;

        if (!results || !Array.isArray(results)) {
            return res.status(400).json({
                success: false,
                error: 'Résultats (array) requis'
            });
        }

        const stats = documentCategorizationService.getCategorizationStats(results);

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('[Categorization API] Erreur stats:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors du calcul des statistiques',
            details: error.message
        });
    }
});

/**
 * POST /api/ai/categorize/suggest-filename
 * Suggère un nom de fichier standardisé
 */
router.post('/suggest-filename', async (req, res) => {
    try {
        const { category, metadata, originalFilename } = req.body;

        if (!category || !originalFilename) {
            return res.status(400).json({
                success: false,
                error: 'category et originalFilename requis'
            });
        }

        const suggestedFilename = documentCategorizationService.generateStandardFilename(
            category,
            metadata || {},
            originalFilename
        );

        res.json({
            success: true,
            originalFilename,
            suggestedFilename,
            category
        });

    } catch (error) {
        console.error('[Categorization API] Erreur:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la génération du nom',
            details: error.message
        });
    }
});

module.exports = router;
