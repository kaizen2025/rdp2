/**
 * Routes API pour l'Agent IA
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const AIService = require('../backend/services/ai/aiService');
const aiDatabaseService = require('../backend/services/ai/aiDatabaseService');
// ❌ REMOVED: Ollama is no longer used - replaced by Hugging Face & OpenRouter
// const ollamaService = require('../backend/services/ai/ollamaService');

// Configuration de multer pour upload de fichiers
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50 MB max
    }
});

module.exports = (broadcast) => {
    const router = express.Router();
    
    // Initialiser le service IA
    const aiService = new AIService(aiDatabaseService);

    const asyncHandler = (fn) => (req, res, next) =>
        Promise.resolve(fn(req, res, next)).catch((error) => {
            console.error(`Erreur sur route IA ${req.method} ${req.originalUrl}:`, error);
            res.status(500).json({
                success: false,
                error: 'Erreur interne du serveur',
                details: error.message
            });
        });

    // ==================== INITIALISATION ====================

    /**
     * GET /ai/health - Verifie l'etat du service IA
     */
    router.get('/health', asyncHandler(async (req, res) => {
        const status = aiService.initialized ? 'ready' : 'initializing';
        res.json({
            success: true,
            status: status,
            initialized: aiService.initialized
        });
    }));

    /**
     * POST /ai/initialize - Force l'initialisation du service IA
     */
    router.post('/initialize', asyncHandler(async (req, res) => {
        const result = await aiService.initialize();
        res.json(result);
    }));

    // ==================== GESTION DES DOCUMENTS ====================

    /**
     * POST /ai/documents/upload - Upload et indexe un document
     */
    router.post('/documents/upload', upload.single('file'), asyncHandler(async (req, res) => {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Aucun fichier fourni'
            });
        }

        const result = await aiService.uploadDocument(req.file);
        
        if (result.success) {
            // Notifier via WebSocket
            broadcast({
                type: 'ai_document_uploaded',
                document: result
            });
        }

        res.json(result);
    }));

    /**
     * GET /ai/documents - Liste tous les documents indexes
     */
    router.get('/documents', asyncHandler(async (req, res) => {
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;
        
        const result = aiService.getDocuments(limit, offset);
        res.json(result);
    }));

    /**
     * GET /ai/documents/:id - Obtient un document specifique
     */
    router.get('/documents/:id', asyncHandler(async (req, res) => {
        const documentId = parseInt(req.params.id);
        const document = aiDatabaseService.getAIDocumentById(documentId);
        
        if (!document) {
            return res.status(404).json({
                success: false,
                error: 'Document non trouve'
            });
        }

        res.json({
            success: true,
            document: document
        });
    }));

    /**
     * DELETE /ai/documents/:id - Supprime un document
     */
    router.delete('/documents/:id', asyncHandler(async (req, res) => {
        const documentId = parseInt(req.params.id);
        const result = await aiService.deleteDocument(documentId);
        
        if (result.success) {
            broadcast({
                type: 'ai_document_deleted',
                documentId: documentId
            });
        }

        res.json(result);
    }));

    /**
     * POST /ai/documents/search - Recherche dans les documents
     */
    router.post('/documents/search', asyncHandler(async (req, res) => {
        const { query, maxResults, minScore } = req.body;
        
        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Requete manquante'
            });
        }

        const result = await aiService.searchDocuments(query, {
            maxResults: maxResults || 5,
            minScore: minScore || 0.1
        });

        res.json(result);
    }));

    // ==================== CONVERSATIONS ====================

    /**
     * POST /ai/chat - Envoie un message a l'IA (DocuCortex)
     */
    router.post('/chat', asyncHandler(async (req, res) => {
        const { message, sessionId, userId } = req.body;
        
        if (!message || !sessionId) {
            return res.status(400).json({
                success: false,
                error: 'Message et sessionId requis'
            });
        }

        // ✅ Utilise la nouvelle recherche intelligente
        const result = await aiService.intelligentSearch(message, sessionId, userId);
        
        // Notifier via WebSocket pour temps reel
        if (result.success) {
            broadcast({
                type: 'ai_message',
                sessionId: sessionId,
                message: result.response,
                confidence: result.confidence,
                sources: result.sources,
                suggestions: result.suggestions
            });
        }

        res.json(result);
    }));

    /**
     * GET /ai/conversations/:sessionId - Obtient l'historique d'une session
     */
    router.get('/conversations/:sessionId', asyncHandler(async (req, res) => {
        const { sessionId } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        
        const result = aiService.getConversationHistory(sessionId, limit);
        res.json(result);
    }));

    /**
     * GET /ai/conversations - Obtient les conversations recentes
     */
    router.get('/conversations', asyncHandler(async (req, res) => {
        const limit = parseInt(req.query.limit) || 50;
        const result = aiService.getConversationHistory(null, limit);
        res.json(result);
    }));

    // ==================== PARAMETRES ====================

    /**
     * GET /ai/settings - Obtient tous les parametres
     */
    router.get('/settings', asyncHandler(async (req, res) => {
        const settings = aiService.getSettings();
        res.json({
            success: true,
            settings: settings
        });
    }));

    /**
     * PUT /ai/settings/:key - Met a jour un parametre
     */
    router.put('/settings/:key', asyncHandler(async (req, res) => {
        const { key } = req.params;
        const { value } = req.body;

        if (value === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Valeur manquante'
            });
        }

        const result = aiService.updateSetting(key, value);

        if (result.success) {
            broadcast({
                type: 'ai_settings_updated',
                key: key,
                value: value
            });
        }

        res.json(result);
    }));

    // ==================== CONFIGURATION AI ====================

    /**
     * GET /ai/config - Obtient la configuration complète de l'IA
     */
    router.get('/config', asyncHandler(async (req, res) => {
        try {
            const configPath = path.join(__dirname, '../config/ai-config.json');
            const configData = await fs.readFile(configPath, 'utf8');
            const config = JSON.parse(configData);

            // Masquer les clés API pour la sécurité
            const sanitizedConfig = JSON.parse(JSON.stringify(config));
            Object.keys(sanitizedConfig.providers || {}).forEach(provider => {
                if (sanitizedConfig.providers[provider].apiKey) {
                    const key = sanitizedConfig.providers[provider].apiKey;
                    if (key !== 'STORED_IN_ENV_FILE') {
                        sanitizedConfig.providers[provider].apiKey = key.substring(0, 8) + '...' + key.slice(-4);
                    }
                }
            });

            // Ajouter les informations de statut des providers
            Object.keys(sanitizedConfig.providers || {}).forEach(provider => {
                const providerService = aiService.providers[provider];
                if (providerService) {
                    sanitizedConfig.providers[provider].status = {
                        enabled: providerService.enabled || false,
                        active: aiService.activeProvider === provider,
                        initialized: providerService.enabled || false
                    };
                }
            });

            res.json({
                success: true,
                config: sanitizedConfig
            });
        } catch (error) {
            console.error('Erreur lecture configuration:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lecture configuration',
                details: error.message
            });
        }
    }));

    /**
     * PUT /ai/config - Met à jour la configuration de l'IA
     */
    router.put('/config', asyncHandler(async (req, res) => {
        try {
            const { aiProvider, providers, fallback, ocr, chat, network, ui } = req.body;

            const configPath = path.join(__dirname, '../config/ai-config.json');
            const currentConfigData = await fs.readFile(configPath, 'utf8');
            const currentConfig = JSON.parse(currentConfigData);

            // Mettre à jour seulement les champs fournis
            const updatedConfig = {
                ...currentConfig,
                ...(aiProvider && { aiProvider }),
                ...(providers && { providers: { ...currentConfig.providers, ...providers } }),
                ...(fallback && { fallback: { ...currentConfig.fallback, ...fallback } }),
                ...(ocr && { ocr: { ...currentConfig.ocr, ...ocr } }),
                ...(chat && { chat: { ...currentConfig.chat, ...chat } }),
                ...(network && { network: { ...currentConfig.network, ...network } }),
                ...(ui && { ui: { ...currentConfig.ui, ...ui } })
            };

            // Sauvegarder la configuration
            await fs.writeFile(configPath, JSON.stringify(updatedConfig, null, 2), 'utf8');

            // Recharger la configuration dans aiService
            aiService.config = updatedConfig;

            // Notifier via WebSocket
            broadcast({
                type: 'ai_config_updated',
                timestamp: new Date().toISOString()
            });

            res.json({
                success: true,
                message: 'Configuration mise à jour avec succès',
                config: updatedConfig
            });
        } catch (error) {
            console.error('Erreur mise à jour configuration:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur mise à jour configuration',
                details: error.message
            });
        }
    }));

    /**
     * POST /ai/providers/:provider/test - Teste la connexion d'un provider
     */
    router.post('/providers/:provider/test', asyncHandler(async (req, res) => {
        try {
            const { provider } = req.params;
            const { apiKey, model } = req.body;

            if (!aiService.providers[provider]) {
                return res.status(404).json({
                    success: false,
                    error: `Provider ${provider} non trouvé`
                });
            }

            const providerService = aiService.providers[provider].service;

            // Test de connexion
            const testResult = await providerService.testConnection(apiKey, model);

            res.json(testResult);
        } catch (error) {
            console.error(`Erreur test provider ${req.params.provider}:`, error);
            res.status(500).json({
                success: false,
                error: 'Erreur test provider',
                details: error.message
            });
        }
    }));

    /**
     * POST /ai/providers/:provider/toggle - Active/désactive un provider
     */
    router.post('/providers/:provider/toggle', asyncHandler(async (req, res) => {
        try {
            const { provider } = req.params;
            const { enabled } = req.body;

            if (!aiService.providers[provider]) {
                return res.status(404).json({
                    success: false,
                    error: `Provider ${provider} non trouvé`
                });
            }

            // Mettre à jour la configuration
            const configPath = path.join(__dirname, '../config/ai-config.json');
            const configData = await fs.readFile(configPath, 'utf8');
            const config = JSON.parse(configData);

            if (!config.providers[provider]) {
                return res.status(404).json({
                    success: false,
                    error: `Configuration provider ${provider} non trouvée`
                });
            }

            config.providers[provider].enabled = enabled;

            await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');

            // Mettre à jour le service
            aiService.providers[provider].enabled = enabled;
            aiService.config = config;

            // Si on désactive le provider actif, basculer sur un autre
            if (!enabled && aiService.activeProvider === provider) {
                const nextProvider = Object.keys(aiService.providers).find(
                    p => aiService.providers[p].enabled && p !== provider
                );
                if (nextProvider) {
                    aiService.activeProvider = nextProvider;
                    console.log(`Basculé vers ${nextProvider} comme provider actif`);
                }
            }

            // Notifier via WebSocket
            broadcast({
                type: 'ai_provider_toggled',
                provider: provider,
                enabled: enabled,
                activeProvider: aiService.activeProvider,
                timestamp: new Date().toISOString()
            });

            res.json({
                success: true,
                provider: provider,
                enabled: enabled,
                activeProvider: aiService.activeProvider
            });
        } catch (error) {
            console.error(`Erreur toggle provider ${req.params.provider}:`, error);
            res.status(500).json({
                success: false,
                error: 'Erreur toggle provider',
                details: error.message
            });
        }
    }));

    /**
     * GET /ai/providers/:provider/models - Récupère la liste des modèles disponibles
     */
    router.get('/providers/:provider/models', asyncHandler(async (req, res) => {
        try {
            const { provider } = req.params;
            const { free, sortBy, limit, task, sort } = req.query;

            if (!aiService.providers[provider]) {
                return res.status(404).json({
                    success: false,
                    error: `Provider ${provider} non trouvé`
                });
            }

            const providerService = aiService.providers[provider].service;

            // Vérifier que le service a la méthode getAvailableModels
            if (typeof providerService.getAvailableModels !== 'function') {
                return res.status(400).json({
                    success: false,
                    error: `Le provider ${provider} ne supporte pas la récupération de modèles`
                });
            }

            // Préparer les filtres selon le provider
            let filters = {};
            if (provider === 'openrouter') {
                filters = {
                    free: free === 'true',
                    sortBy: sortBy || 'recent',
                    limit: parseInt(limit) || 20
                };
            } else if (provider === 'huggingface') {
                filters = {
                    task: task || 'text-generation',
                    sort: sort || 'downloads',
                    limit: parseInt(limit) || 20,
                    publicOnly: true
                };
            }

            // Récupérer les modèles
            const result = await providerService.getAvailableModels(filters);

            res.json(result);
        } catch (error) {
            console.error(`Erreur récupération modèles ${req.params.provider}:`, error);
            res.status(500).json({
                success: false,
                error: 'Erreur récupération modèles',
                details: error.message
            });
        }
    }));

    /**
     * GET /ai/models/recommended - Récupère les modèles recommandés
     */
    router.get('/models/recommended', asyncHandler(async (req, res) => {
        try {
            const huggingfaceService = require('../backend/services/ai/huggingfaceService');

            const recommendedModels = [
                ...huggingfaceService.constructor.getRecommendedModels().map(m => ({
                    ...m,
                    provider: 'huggingface'
                })),
                ...huggingfaceService.constructor.getMistralFreeModels()
            ];

            res.json({
                success: true,
                models: recommendedModels,
                total: recommendedModels.length
            });
        } catch (error) {
            console.error('Erreur récupération modèles recommandés:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur récupération modèles recommandés',
                details: error.message
            });
        }
    }));

    // ==================== STATISTIQUES ====================

    /**
     * GET /ai/statistics - Obtient les statistiques de l'IA
     */
    router.get('/statistics', asyncHandler(async (req, res) => {
        const stats = await aiService.getStatistics();
        res.json(stats);
    }));

    /**
     * GET /ai/statistics/daily - Obtient les statistiques quotidiennes
     */
    router.get('/statistics/daily', asyncHandler(async (req, res) => {
        const days = parseInt(req.query.days) || 7;
        const stats = aiDatabaseService.getAIStats(days);
        
        res.json({
            success: true,
            stats: stats,
            days: days
        });
    }));

    // ==================== ADMINISTRATION ====================

    /**
     * POST /ai/reset - Reinitialise completement l'IA
     */
    router.post('/reset', asyncHandler(async (req, res) => {
        const result = await aiService.reset();
        
        if (result.success) {
            broadcast({
                type: 'ai_reset',
                timestamp: new Date().toISOString()
            });
        }

        res.json(result);
    }));

    /**
     * POST /ai/cleanup - Nettoie la base de donnees
     */
    router.post('/cleanup', asyncHandler(async (req, res) => {
        const result = aiDatabaseService.cleanup();
        
        res.json({
            success: true,
            result: result
        });
    }));

    /**
     * GET /ai/stats/overview - Vue d'ensemble des statistiques
     */
    router.get('/stats/overview', asyncHandler(async (req, res) => {
        const stats = aiDatabaseService.getOverallStats();
        
        res.json({
            success: true,
            stats: stats
        });
    }));

    // ==================== DOCUCORTEX - FONCTIONNALITÉS RÉSEAU ====================

    /**
     * POST /ai/network/configure - Configure l'accès réseau
     */
    router.post('/network/configure', asyncHandler(async (req, res) => {
        const { serverPath, workingDirectory, autoIndex, scanInterval, maxFileSize } = req.body;
        
        const config = {
            serverPath,
            workingDirectory,
            autoIndex: autoIndex !== undefined ? autoIndex : true,
            scanInterval: scanInterval || 30,
            maxFileSize: maxFileSize || 100,
            allowedExtensions: [], // Toutes extensions
            excludedFolders: req.body.excludedFolders || ['$RECYCLE.BIN', 'System Volume Information', 'Temp', 'Backup']
        };

        const result = aiService.configureNetworkAccess(config);
        res.json(result);
    }));

    /**
     * GET /ai/network/test - Teste la connexion réseau
     */
    router.get('/network/test', asyncHandler(async (req, res) => {
        const result = await aiService.testNetworkConnection();
        res.json(result);
    }));

    /**
     * POST /ai/network/scan - Lance un scan complet du réseau
     */
    router.post('/network/scan', asyncHandler(async (req, res) => {
        const result = await aiService.scanAndIndexNetwork();
        
        if (result.success) {
            broadcast({
                type: 'network_scan_completed',
                indexed: result.indexed,
                errors: result.errors
            });
        }

        res.json(result);
    }));

    /**
     * POST /ai/network/watch/start - Démarre la surveillance réseau
     */
    router.post('/network/watch/start', asyncHandler(async (req, res) => {
        const result = await aiService.startNetworkWatching();
        
        if (result.success) {
            broadcast({
                type: 'network_watching_started'
            });
        }

        res.json(result);
    }));

    /**
     * POST /ai/network/watch/stop - Arrête la surveillance réseau
     */
    router.post('/network/watch/stop', asyncHandler(async (req, res) => {
        const result = aiService.stopNetworkWatching();
        
        if (result.success) {
            broadcast({
                type: 'network_watching_stopped'
            });
        }

        res.json(result);
    }));

    // ==================== DOCUCORTEX - RECHERCHE INTELLIGENTE ====================

    /**
     * POST /ai/search/intelligent - Recherche intelligente avec réponses enrichies
     */
    router.post('/search/intelligent', asyncHandler(async (req, res) => {
        const { query, sessionId, userId } = req.body;
        
        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Query requise'
            });
        }

        const result = await aiService.intelligentSearch(query, sessionId, userId);
        res.json(result);
    }));

    // ==================== DOCUCORTEX - PREVIEW & DOWNLOAD ====================

    /**
     * GET /ai/documents/:id/preview - Génère preview d'un document
     */
    router.get('/documents/:id/preview', asyncHandler(async (req, res) => {
        const documentId = parseInt(req.params.id);
        const result = await aiService.prepareDocumentPreview(documentId);
        
        if (!result.success) {
            return res.status(404).json(result);
        }

        res.json(result);
    }));

    /**
     * GET /ai/documents/:id/download - Télécharge un document
     */
    router.get('/documents/:id/download', asyncHandler(async (req, res) => {
        const documentId = parseInt(req.params.id);
        const result = await aiService.prepareDocumentDownload(documentId);
        
        if (!result.success) {
            return res.status(404).json(result);
        }

        // Envoyer le fichier
        res.setHeader('Content-Type', result.mimetype);
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        res.sendFile(result.path);
    }));

    /**
     * GET /ai/statistics/extended - Statistiques étendues (incluant réseau)
     */
    router.get('/statistics/extended', asyncHandler(async (req, res) => {
        const stats = await aiService.getExtendedStatistics();
        res.json(stats);
    }));

    // ==================== DOCUCORTEX - NOUVEAUX ENDPOINTS RÉSEAU ====================

    /**
     * GET /ai/network/documents - Liste tous les documents du réseau
     */
    router.get('/network/documents', asyncHandler(async (req, res) => {
        try {
            const {
                search,
                fileType,
                dateFrom,
                dateTo,
                minSize,
                maxSize,
                limit,
                offset,
                sortBy,
                sortOrder
            } = req.query;

            // Validation des paramètres
            const queryOptions = {
                search: search || '',
                fileType: fileType || '',
                dateFrom: dateFrom || null,
                dateTo: dateTo || null,
                minSize: minSize ? parseInt(minSize) : null,
                maxSize: maxSize ? parseInt(maxSize) : null,
                limit: Math.min(parseInt(limit) || 100, 1000), // Limite max 1000
                offset: parseInt(offset) || 0,
                sortBy: sortBy || 'name',
                sortOrder: sortOrder || 'asc'
            };

            const result = await aiService.getNetworkDocuments(queryOptions);

            if (!result.success) {
                return res.status(result.errorCode || 500).json(result);
            }

            // Pagination
            const totalDocuments = result.total || 0;
            const hasMore = queryOptions.offset + queryOptions.limit < totalDocuments;

            res.json({
                success: true,
                data: result.documents || [],
                pagination: {
                    total: totalDocuments,
                    limit: queryOptions.limit,
                    offset: queryOptions.offset,
                    hasMore: hasMore,
                    currentPage: Math.floor(queryOptions.offset / queryOptions.limit) + 1,
                    totalPages: Math.ceil(totalDocuments / queryOptions.limit)
                },
                filters: {
                    appliedFilters: queryOptions,
                    availableFileTypes: result.availableFileTypes || [],
                    searchExecuted: queryOptions.search.length > 0
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des documents réseau:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération des documents',
                details: error.message
            });
        }
    }));

    /**
     * GET /ai/network/metadata/:fileId - Obtient les métadonnées d'un fichier
     */
    router.get('/network/metadata/:fileId', asyncHandler(async (req, res) => {
        try {
            const { fileId } = req.params;
            const { includeContent, includeHash, includePermissions } = req.query;

            if (!fileId) {
                return res.status(400).json({
                    success: false,
                    error: 'ID de fichier requis'
                });
            }

            const metadataOptions = {
                includeContent: includeContent === 'true',
                includeHash: includeHash === 'true',
                includePermissions: includePermissions === 'true'
            };

            const result = await aiService.getNetworkFileMetadata(fileId, metadataOptions);

            if (!result.success) {
                if (result.errorCode === 'FILE_NOT_FOUND') {
                    return res.status(404).json(result);
                } else if (result.errorCode === 'ACCESS_DENIED') {
                    return res.status(403).json(result);
                }
                return res.status(result.errorCode || 500).json(result);
            }

            // Enrichir avec des statistiques supplémentaires
            const enrichedMetadata = {
                ...result.metadata,
                accessTime: new Date().toISOString(),
                metadataRetrievalTime: Date.now(),
                cacheStatus: result.cached ? 'cached' : 'fresh'
            };

            // Ajouter des recommandations basées sur le contenu
            if (result.metadata.type === 'document') {
                enrichedMetadata.recommendations = await aiService.getContentRecommendations(fileId);
            }

            res.json({
                success: true,
                data: enrichedMetadata,
                query: {
                    fileId: fileId,
                    options: metadataOptions
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des métadonnées:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération des métadonnées',
                details: error.message
            });
        }
    }));

    /**
     * GET /ai/network/preview/:fileId - Génère une prévisualisation d'un fichier
     */
    router.get('/network/preview/:fileId', asyncHandler(async (req, res) => {
        try {
            const { fileId } = req.params;
            const { 
                width, 
                height, 
                format, 
                quality, 
                page,
                maxPages
            } = req.query;

            if (!fileId) {
                return res.status(400).json({
                    success: false,
                    error: 'ID de fichier requis'
                });
            }

            const previewOptions = {
                width: width ? parseInt(width) : 800,
                height: height ? parseInt(height) : 600,
                format: format || 'auto',
                quality: quality ? parseInt(quality) : 85,
                page: page ? parseInt(page) : 1,
                maxPages: maxPages ? parseInt(maxPages) : 10
            };

            const result = await aiService.generateNetworkFilePreview(fileId, previewOptions);

            if (!result.success) {
                if (result.errorCode === 'FILE_NOT_FOUND') {
                    return res.status(404).json(result);
                } else if (result.errorCode === 'UNSUPPORTED_FORMAT') {
                    return res.status(415).json(result);
                } else if (result.errorCode === 'FILE_TOO_LARGE') {
                    return res.status(413).json(result);
                }
                return res.status(result.errorCode || 500).json(result);
            }

            // Si c'est une image ou un PDF, retourner les données directement
            if (result.previewType === 'image') {
                res.setHeader('Content-Type', result.mimeType);
                res.setHeader('Cache-Control', 'public, max-age=3600');
                res.send(result.previewData);
                return;
            }

            // Pour les autres types, retourner la configuration
            res.json({
                success: true,
                data: {
                    fileId: fileId,
                    previewType: result.previewType,
                    previewUrl: result.previewUrl,
                    downloadUrl: result.downloadUrl,
                    thumbnailUrl: result.thumbnailUrl,
                    pageInfo: result.pageInfo,
                    textContent: result.textContent,
                    metadata: result.metadata
                },
                preview: result.preview,
                options: previewOptions,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erreur lors de la génération de prévisualisation:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la génération de prévisualisation',
                details: error.message
            });
        }
    }));

    /**
     * GET /ai/network/download/:fileId - Télécharge un fichier réseau
     */
    router.get('/network/download/:fileId', asyncHandler(async (req, res) => {
        try {
            const { fileId } = req.params;
            const { 
                filename,
                range,
                compression,
                format
            } = req.query;

            if (!fileId) {
                return res.status(400).json({
                    success: false,
                    error: 'ID de fichier requis'
                });
            }

            const downloadOptions = {
                requestedFilename: filename || null,
                range: range || null,
                compression: compression === 'true',
                format: format || 'original'
            };

            const result = await aiService.downloadNetworkFile(fileId, downloadOptions);

            if (!result.success) {
                if (result.errorCode === 'FILE_NOT_FOUND') {
                    return res.status(404).json(result);
                } else if (result.errorCode === 'ACCESS_DENIED') {
                    return res.status(403).json(result);
                } else if (result.errorCode === 'FILE_LOCKED') {
                    return res.status(423).json(result);
                } else if (result.errorCode === 'INSUFFICIENT_SPACE') {
                    return res.status(507).json(result);
                }
                return res.status(result.errorCode || 500).json(result);
            }

            // Configuration des headers pour le téléchargement
            res.setHeader('Content-Type', result.mimeType);
            res.setHeader('Content-Disposition', 
                `attachment; filename="${result.filename}"`);
            res.setHeader('Content-Length', result.size);
            res.setHeader('Accept-Ranges', 'bytes');
            
            if (result.lastModified) {
                res.setHeader('Last-Modified', result.lastModified);
            }
            
            if (result.etag) {
                res.setHeader('ETag', result.etag);
            }

            // Support pour les téléchargements partiels (range requests)
            if (range && result.stream) {
                const rangeMatch = range.match(/bytes=(\d+)-(\d*)/);
                if (rangeMatch) {
                    const start = parseInt(rangeMatch[1], 10);
                    const end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : result.size - 1;
                    
                    res.status(206);
                    res.setHeader('Content-Range', `bytes ${start}-${end}/${result.size}`);
                    res.setHeader('Content-Length', end - start + 1);
                    
                    // Envoyer le stream avec range
                    result.stream.pipe(res);
                } else {
                    result.stream.pipe(res);
                }
            } else {
                // Téléchargement complet
                if (result.stream) {
                    result.stream.pipe(res);
                } else if (result.buffer) {
                    res.send(result.buffer);
                } else {
                    res.sendFile(result.path, (err) => {
                        if (err) {
                            console.error('Erreur lors de l\'envoi du fichier:', err);
                            res.status(500).json({
                                success: false,
                                error: 'Erreur lors de l\'envoi du fichier'
                            });
                        }
                    });
                }
            }

        } catch (error) {
            console.error('Erreur lors du téléchargement:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors du téléchargement',
                details: error.message
            });
        }
    }));

    /**
     * GET /ai/network/stats - Obtient les statistiques du réseau
     */
    router.get('/network/stats', asyncHandler(async (req, res) => {
        try {
            const { 
                period,
                includeDetails,
                groupBy,
                refresh
            } = req.query;

            const statsOptions = {
                period: period || '24h', // 1h, 6h, 24h, 7d, 30d
                includeDetails: includeDetails === 'true',
                groupBy: groupBy || 'day',
                refresh: refresh === 'true'
            };

            const result = await aiService.getNetworkStatistics(statsOptions);

            if (!result.success) {
                return res.status(result.errorCode || 500).json(result);
            }

            // Enrichir avec des insights supplémentaires
            const enrichedStats = {
                ...result,
                timestamp: new Date().toISOString(),
                period: statsOptions.period,
                generatedAt: new Date().toISOString(),
                cacheInfo: {
                    cached: result.cached || false,
                    expiresAt: result.expiresAt || null,
                    lastUpdated: result.lastUpdated || null
                }
            };

            // Ajouter des recommandations si demandé
            if (statsOptions.includeDetails) {
                enrichedStats.recommendations = await aiService.getNetworkOptimizationRecommendations();
                enrichedStats.alerts = await aiService.getNetworkAlerts();
                enrichedStats.trends = await aiService.getNetworkTrends(statsOptions.period);
            }

            res.json({
                success: true,
                data: enrichedStats,
                query: statsOptions,
                meta: {
                    version: '1.0',
                    generated: enrichedStats.generatedAt,
                    requestId: req.headers['x-request-id'] || 'unknown'
                }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques réseau:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération des statistiques réseau',
                details: error.message
            });
        }
    }));

    // ==================== GESTION AVANCÉE DES ENDPOINTS ====================

    /**
     * PUT /ai/network/documents/:fileId - Met à jour les métadonnées d'un fichier
     */
    router.put('/network/documents/:fileId', asyncHandler(async (req, res) => {
        try {
            const { fileId } = req.params;
            const { 
                name,
                description,
                tags,
                customFields,
                permissions,
                metadata
            } = req.body;

            if (!fileId) {
                return res.status(400).json({
                    success: false,
                    error: 'ID de fichier requis'
                });
            }

            const updateData = {
                name: name || null,
                description: description || null,
                tags: tags || [],
                customFields: customFields || {},
                permissions: permissions || null,
                metadata: metadata || {}
            };

            const result = await aiService.updateNetworkFileMetadata(fileId, updateData);

            if (!result.success) {
                if (result.errorCode === 'FILE_NOT_FOUND') {
                    return res.status(404).json(result);
                } else if (result.errorCode === 'ACCESS_DENIED') {
                    return res.status(403).json(result);
                } else if (result.errorCode === 'VALIDATION_ERROR') {
                    return res.status(400).json(result);
                }
                return res.status(result.errorCode || 500).json(result);
            }

            // Notifier via WebSocket si c'est une mise à jour importante
            if (result.changedFields && result.changedFields.length > 0) {
                broadcast({
                    type: 'network_file_updated',
                    fileId: fileId,
                    changedFields: result.changedFields,
                    updatedBy: req.user?.id || 'system',
                    timestamp: new Date().toISOString()
                });
            }

            res.json({
                success: true,
                data: result.updatedMetadata,
                changes: {
                    modifiedFields: result.changedFields || [],
                    modifiedAt: new Date().toISOString(),
                    modifiedBy: req.user?.id || 'system'
                }
            });

        } catch (error) {
            console.error('Erreur lors de la mise à jour des métadonnées:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la mise à jour des métadonnées',
                details: error.message
            });
        }
    }));

    /**
     * DELETE /ai/network/documents/:fileId - Supprime un fichier du réseau
     */
    router.delete('/network/documents/:fileId', asyncHandler(async (req, res) => {
        try {
            const { fileId } = req.params;
            const { 
                force,
                backup,
                reason
            } = req.query;

            if (!fileId) {
                return res.status(400).json({
                    success: false,
                    error: 'ID de fichier requis'
                });
            }

            const deleteOptions = {
                force: force === 'true',
                backup: backup === 'true',
                reason: reason || 'Suppression via API'
            };

            const result = await aiService.deleteNetworkFile(fileId, deleteOptions);

            if (!result.success) {
                if (result.errorCode === 'FILE_NOT_FOUND') {
                    return res.status(404).json(result);
                } else if (result.errorCode === 'ACCESS_DENIED') {
                    return res.status(403).json(result);
                } else if (result.errorCode === 'FILE_LOCKED') {
                    return res.status(423).json(result);
                } else if (result.errorCode === 'BACKUP_FAILED') {
                    return res.status(500).json(result);
                }
                return res.status(result.errorCode || 500).json(result);
            }

            // Notifier via WebSocket
            broadcast({
                type: 'network_file_deleted',
                fileId: fileId,
                deletedBy: req.user?.id || 'system',
                deletedAt: new Date().toISOString(),
                reason: deleteOptions.reason,
                backupLocation: result.backupLocation || null
            });

            res.json({
                success: true,
                data: {
                    fileId: fileId,
                    deletedAt: new Date().toISOString(),
                    deletedBy: req.user?.id || 'system',
                    backupCreated: result.backupCreated || false,
                    backupLocation: result.backupLocation || null,
                    hardDelete: deleteOptions.force
                }
            });

        } catch (error) {
            console.error('Erreur lors de la suppression du fichier:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la suppression du fichier',
                details: error.message
            });
        }
    }));

    /**
     * POST /ai/network/documents/:fileId/copy - Copie un fichier
     */
    router.post('/network/documents/:fileId/copy', asyncHandler(async (req, res) => {
        try {
            const { fileId } = req.params;
            const { 
                targetPath,
                newName,
                preserveMetadata,
                overwrite
            } = req.body;

            if (!fileId || !targetPath) {
                return res.status(400).json({
                    success: false,
                    error: 'ID de fichier et chemin cible requis'
                });
            }

            const copyOptions = {
                targetPath: targetPath,
                newName: newName || null,
                preserveMetadata: preserveMetadata !== false, // true par défaut
                overwrite: overwrite === true
            };

            const result = await aiService.copyNetworkFile(fileId, copyOptions);

            if (!result.success) {
                if (result.errorCode === 'FILE_NOT_FOUND') {
                    return res.status(404).json(result);
                } else if (result.errorCode === 'TARGET_EXISTS') {
                    return res.status(409).json(result);
                } else if (result.errorCode === 'INSUFFICIENT_SPACE') {
                    return res.status(507).json(result);
                } else if (result.errorCode === 'ACCESS_DENIED') {
                    return res.status(403).json(result);
                }
                return res.status(result.errorCode || 500).json(result);
            }

            // Notifier via WebSocket
            broadcast({
                type: 'network_file_copied',
                sourceFileId: fileId,
                targetFileId: result.newFileId,
                copiedBy: req.user?.id || 'system',
                copiedAt: new Date().toISOString(),
                targetPath: targetPath
            });

            res.json({
                success: true,
                data: {
                    originalFileId: fileId,
                    newFileId: result.newFileId,
                    newPath: result.newPath,
                    copiedAt: new Date().toISOString(),
                    copiedBy: req.user?.id || 'system',
                    metadata: result.metadata
                }
            });

        } catch (error) {
            console.error('Erreur lors de la copie du fichier:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la copie du fichier',
                details: error.message
            });
        }
    }));

    /**
     * POST /ai/network/documents/:fileId/move - Déplace un fichier
     */
    router.post('/network/documents/:fileId/move', asyncHandler(async (req, res) => {
        try {
            const { fileId } = req.params;
            const { 
                targetPath,
                newName,
                overwrite
            } = req.body;

            if (!fileId || !targetPath) {
                return res.status(400).json({
                    success: false,
                    error: 'ID de fichier et chemin cible requis'
                });
            }

            const moveOptions = {
                targetPath: targetPath,
                newName: newName || null,
                overwrite: overwrite === true
            };

            const result = await aiService.moveNetworkFile(fileId, moveOptions);

            if (!result.success) {
                if (result.errorCode === 'FILE_NOT_FOUND') {
                    return res.status(404).json(result);
                } else if (result.errorCode === 'TARGET_EXISTS') {
                    return res.status(409).json(result);
                } else if (result.errorCode === 'SAME_LOCATION') {
                    return res.status(400).json(result);
                } else if (result.errorCode === 'ACCESS_DENIED') {
                    return res.status(403).json(result);
                }
                return res.status(result.errorCode || 500).json(result);
            }

            // Notifier via WebSocket
            broadcast({
                type: 'network_file_moved',
                fileId: fileId,
                oldPath: result.oldPath,
                newPath: result.newPath,
                movedBy: req.user?.id || 'system',
                movedAt: new Date().toISOString()
            });

            res.json({
                success: true,
                data: {
                    fileId: fileId,
                    oldPath: result.oldPath,
                    newPath: result.newPath,
                    movedAt: new Date().toISOString(),
                    movedBy: req.user?.id || 'system'
                }
            });

        } catch (error) {
            console.error('Erreur lors du déplacement du fichier:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors du déplacement du fichier',
                details: error.message
            });
        }
    }));

    /**
     * GET /ai/network/search - Recherche avancée dans le réseau
     */
    router.get('/network/search', asyncHandler(async (req, res) => {
        try {
            const {
                query,
                fileTypes,
                dateRange,
                sizeRange,
                location,
                tags,
                fullText,
                fuzzy,
                limit,
                offset,
                sortBy,
                sortOrder
            } = req.query;

            const searchOptions = {
                query: query || '',
                fileTypes: fileTypes ? fileTypes.split(',') : [],
                dateRange: dateRange || null,
                sizeRange: sizeRange || null,
                location: location || null,
                tags: tags ? tags.split(',') : [],
                fullText: fullText === 'true',
                fuzzy: fuzzy === 'true',
                limit: Math.min(parseInt(limit) || 50, 500), // Limite max 500
                offset: parseInt(offset) || 0,
                sortBy: sortBy || 'relevance',
                sortOrder: sortOrder || 'desc'
            };

            // Validation des paramètres de recherche
            if (!searchOptions.query && !searchOptions.fileTypes.length && 
                !searchOptions.tags.length && !searchOptions.dateRange && !searchOptions.sizeRange) {
                return res.status(400).json({
                    success: false,
                    error: 'Au moins un critère de recherche est requis'
                });
            }

            const result = await aiService.advancedNetworkSearch(searchOptions);

            if (!result.success) {
                return res.status(result.errorCode || 500).json(result);
            }

            // Enrichir les résultats avec des métadonnées supplémentaires
            const enrichedResults = {
                ...result,
                searchOptions: searchOptions,
                timestamp: new Date().toISOString(),
                performance: {
                    searchTime: result.searchTime || 0,
                    resultsCount: result.results?.length || 0,
                    cached: result.cached || false
                }
            };

            // Ajouter des suggestions d'amélioration si peu de résultats
            if (result.results && result.results.length === 0 && searchOptions.query) {
                enrichedResults.suggestions = await aiService.getSearchSuggestions(searchOptions.query);
            }

            res.json({
                success: true,
                data: enrichedResults,
                pagination: {
                    total: result.total || 0,
                    limit: searchOptions.limit,
                    offset: searchOptions.offset,
                    hasMore: searchOptions.offset + searchOptions.limit < (result.total || 0),
                    currentPage: Math.floor(searchOptions.offset / searchOptions.limit) + 1,
                    totalPages: Math.ceil((result.total || 0) / searchOptions.limit)
                },
                meta: {
                    query: searchOptions.query,
                    searchTime: enrichedResults.performance.searchTime,
                    timestamp: enrichedResults.timestamp
                }
            });

        } catch (error) {
            console.error('Erreur lors de la recherche réseau:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la recherche réseau',
                details: error.message
            });
        }
    }));

    // ==================== OCR - EASYOCR ENDPOINTS ====================

    /**
     * POST /ai/ocr/initialize - Initialise le service OCR EasyOCR
     */
    router.post('/ocr/initialize', asyncHandler(async (req, res) => {
        const result = await aiService.initializeOCR();
        res.json(result);
    }));

    /**
     * POST /ai/ocr/extract - Extrait le texte d'une image via OCR
     */
    router.post('/ocr/extract', upload.single('image'), asyncHandler(async (req, res) => {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Aucune image fournie'
            });
        }

        const {
            languages,
            enhanceImage,
            confidenceThreshold,
            includeBoundingBoxes,
            autoDetectLanguage
        } = req.body;

        const options = {
            languages: languages ? languages.split(',') : null,
            enhanceImage: enhanceImage !== 'false',
            confidenceThreshold: confidenceThreshold ? parseFloat(confidenceThreshold) : 0.5,
            includeBoundingBoxes: includeBoundingBoxes === 'true',
            autoDetectLanguage: autoDetectLanguage !== 'false'
        };

        const result = await aiService.extractTextFromImage(req.file, options);

        res.json(result);
    }));

    /**
     * POST /ai/ocr/extract-from-buffer - Extrait le texte d'une image via buffer base64
     */
    router.post('/ocr/extract-from-buffer', asyncHandler(async (req, res) => {
        const { imageBuffer, imageName, ...options } = req.body;

        if (!imageBuffer) {
            return res.status(400).json({
                success: false,
                error: 'Buffer image manquant'
            });
        }

        try {
            // Convertir base64 en buffer
            const buffer = Buffer.from(imageBuffer, 'base64');
            
            // Créer un objet fichier simulé
            const imageFile = {
                buffer: buffer,
                filename: imageName || 'image.png',
                originalname: imageName || 'image.png',
                mimetype: 'image/png',
                size: buffer.length
            };

            const result = await aiService.extractTextFromImage(imageFile, options);
            res.json(result);

        } catch (error) {
            res.status(400).json({
                success: false,
                error: 'Erreur décodage buffer: ' + error.message
            });
        }
    }));

    /**
     * POST /ai/ocr/process-image-document - Traite une image et l'indexe comme document
     */
    router.post('/ocr/process-image-document', upload.single('image'), asyncHandler(async (req, res) => {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Aucune image fournie'
            });
        }

        const {
            languages,
            enhanceImage,
            confidenceThreshold,
            autoDetectLanguage
        } = req.body;

        const options = {
            languages: languages ? languages.split(',') : null,
            enhanceImage: enhanceImage !== 'false',
            confidenceThreshold: confidenceThreshold ? parseFloat(confidenceThreshold) : 0.5,
            autoDetectLanguage: autoDetectLanguage !== 'false'
        };

        const result = await aiService.processImageDocument(req.file, options);

        if (result.success) {
            // Notifier via WebSocket
            broadcast({
                type: 'ocr_document_processed',
                documentId: result.documentId,
                filename: result.filename,
                wordCount: result.wordCount,
                confidence: result.confidence
            });
        }

        res.json(result);
    }));

    /**
     * POST /ai/ocr/batch-process - Traite plusieurs images en lot
     */
    router.post('/ocr/batch-process', upload.array('images', 10), asyncHandler(async (req, res) => {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Aucune image fournie'
            });
        }

        const {
            languages,
            enhanceImage,
            confidenceThreshold,
            autoIndexAsDocuments,
            maxConcurrent
        } = req.body;

        const options = {
            languages: languages ? languages.split(',') : null,
            enhanceImage: enhanceImage !== 'false',
            confidenceThreshold: confidenceThreshold ? parseFloat(confidenceThreshold) : 0.5,
            autoIndexAsDocuments: autoIndexAsDocuments === 'true',
            maxConcurrent: maxConcurrent ? parseInt(maxConcurrent) : 3
        };

        const result = await aiService.batchProcessImages(req.files, options);

        if (result.success && result.indexedDocuments) {
            // Notifier via WebSocket
            broadcast({
                type: 'ocr_batch_processed',
                processedCount: result.summary.successful,
                indexedCount: result.indexedDocuments.length,
                failedCount: result.summary.failed
            });
        }

        res.json(result);
    }));

    /**
     * POST /ai/ocr/detect-language - Détecte la langue d'une image
     */
    router.post('/ocr/detect-language', upload.single('image'), asyncHandler(async (req, res) => {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Aucune image fournie'
            });
        }

        const result = await aiService.extractTextFromImage(req.file, {
            autoDetectLanguage: true,
            confidenceThreshold: 0.3
        });

        res.json({
            success: result.success,
            language: result.metadata?.detectedLanguage || 'unknown',
            confidence: result.metadata?.confidence || 0,
            extractedText: result.extractedText || '',
            error: result.error
        });
    }));

    /**
     * GET /ai/ocr/info - Obtient les informations du service OCR
     */
    router.get('/ocr/info', asyncHandler(async (req, res) => {
        const info = aiService.getOCRServiceInfo();
        res.json({
            success: true,
            info: info
        });
    }));

    /**
     * POST /ai/ocr/cleanup - Nettoie les ressources OCR
     */
    router.post('/ocr/cleanup', asyncHandler(async (req, res) => {
        const result = await aiService.cleanupOCR();
        res.json(result);
    }));

    /* ==================== OLLAMA INTEGRATION ENDPOINTS (DISABLED) ====================
     * ❌ DISABLED: All Ollama endpoints are commented out because ollamaService was removed.
     * Ollama has been replaced by Hugging Face (priority 1) and OpenRouter (priority 2).
     * To re-enable these features, re-implement using aiService.processQuery() with HF/OpenRouter.
     *
    router.get('/ollama/status', asyncHandler(async (req, res) => {
        const result = await aiService.initialize();
        const ollamaInfo = aiService.getOllamaInfo();
        res.json({ success: true, aiService: result, ollama: ollamaInfo });
    }));

    router.get('/ollama/models', asyncHandler(async (req, res) => {
        const modelInfo = ollamaService.getModelInfo();
        res.json({ success: true, currentModel: modelInfo.name, available: modelInfo.available, models: modelInfo.allModels });
    }));

    router.post('/ollama/model', asyncHandler(async (req, res) => {
        const { modelName } = req.body;
        if (!modelName) return res.status(400).json({ success: false, error: 'Nom du modèle requis' });
        const result = await aiService.setOllamaModel(modelName);
        res.json(result);
    }));

    router.post('/ollama/chat', asyncHandler(async (req, res) => {
        const { message, messages, systemPrompt, temperature, maxTokens } = req.body;
        if (!message && !messages) return res.status(400).json({ success: false, error: 'Message ou messages requis' });
        const inputMessages = messages || [{ role: 'user', content: message }];
        const result = await ollamaService.processConversation(inputMessages, { systemPrompt, temperature: temperature || 0.7, maxTokens: maxTokens || 512 });
        if (result.success) broadcast({ type: 'ollama_response', provider: 'ollama', response: result.response, model: ollamaService.model, timestamp: new Date().toISOString() });
        res.json(result);
    }));

    router.post('/ollama/sentiment', asyncHandler(async (req, res) => {
        const { text } = req.body;
        if (!text) return res.status(400).json({ success: false, error: 'Texte requis pour l\'analyse' });
        const result = await aiService.analyzeSentiment(text);
        res.json(result);
    }));

    router.post('/ollama/summarize', asyncHandler(async (req, res) => {
        const { text, maxLength } = req.body;
        if (!text) return res.status(400).json({ success: false, error: 'Texte requis pour le résumé' });
        const result = await aiService.summarizeText(text, maxLength || 200);
        res.json(result);
    }));

    router.post('/ollama/keywords', asyncHandler(async (req, res) => {
        const { text, maxKeywords } = req.body;
        if (!text) return res.status(400).json({ success: false, error: 'Texte requis pour l\'extraction' });
        const result = await aiService.extractKeywords(text, maxKeywords || 10);
        res.json(result);
    }));

    router.post('/ollama/translate', asyncHandler(async (req, res) => {
        const { text, targetLanguage } = req.body;
        if (!text || !targetLanguage) return res.status(400).json({ success: false, error: 'Texte et langue cible requis' });
        const result = await aiService.translateText(text, targetLanguage);
        res.json(result);
    }));

    router.post('/ollama/qa', asyncHandler(async (req, res) => {
        const { documentId, question } = req.body;
        if (!documentId || !question) return res.status(400).json({ success: false, error: 'ID document et question requis' });
        const result = await aiService.answerQuestion(documentId, question);
        res.json(result);
    }));

    router.get('/ollama/stats', asyncHandler(async (req, res) => {
        const stats = ollamaService.getStatistics();
        const aiStats = await aiService.getStatistics();
        res.json({ success: true, ollama: stats, ai: aiStats, comparison: { ollamaRequests: stats.stats.totalRequests, aiTotalQueries: aiStats.runtime?.totalQueries || 0, ollamaEnabled: aiService.ollamaEnabled } });
    }));

    router.post('/ollama/reset-stats', asyncHandler(async (req, res) => {
        const result = ollamaService.resetStatistics();
        res.json(result);
    }));

    router.get('/ollama/test', asyncHandler(async (req, res) => {
        const result = await ollamaService.testConnection();
        res.json(result);
    }));
    */ // END OLLAMA ENDPOINTS (DISABLED)

    // ==================== ENHANCED AI CHAT WITH MULTI-PROVIDER SUPPORT ====================

    /**
     * POST /ai/chat/enhanced - Chat avec support multi-provider (HF/OpenRouter)
     */
    router.post('/chat/enhanced', asyncHandler(async (req, res) => {
        const { message, sessionId, userId, aiProvider } = req.body;

        if (!message || !sessionId) {
            return res.status(400).json({
                success: false,
                error: 'Message et sessionId requis'
            });
        }

        // Utiliser l'AI service avec support multi-provider
        const result = await aiService.processQuery(
            sessionId,
            message,
            userId,
            { aiProvider: aiProvider }
        );

        // Notifier via WebSocket
        if (result.success) {
            broadcast({
                type: 'ai_message_enhanced',
                sessionId: sessionId,
                message: result.response,
                confidence: result.confidence,
                sources: result.sources,
                suggestions: result.suggestions,
                aiProvider: result.aiProvider,
                model: result.model || 'unknown',
                timestamp: new Date().toISOString()
            });
        }

        res.json(result);
    }));

    // ==================== NOUVELLES ROUTES POUR FRONTEND DOCUCORTEX ====================

    /**
     * POST /ai/ocr - Route principale OCR pour OCRPanel
     */
    router.post('/ocr', upload.single('file'), asyncHandler(async (req, res) => {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Aucun fichier fourni'
            });
        }

        const ocrService = require('../backend/services/ai/ocrService');

        const languages = req.body.languages || 'fra+eng+spa';
        const autoAnalyze = req.body.autoAnalyze === 'true';

        try {
            const result = await ocrService.recognizeText(req.file.buffer, {
                languages: languages
            });

            // ❌ DISABLED: Auto-analyze was using Ollama which is removed
            // To re-enable: integrate with new Hugging Face/OpenRouter services
            if (result.success && autoAnalyze) {
                // TODO: Re-implement with aiService.processQuery() using HF/OpenRouter
                console.log('[OCR] Auto-analyze requested but disabled (Ollama removed)');
                result.analysis = null;
            }

            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }));

    /**
     * POST /ai/analyze - Analyse de texte brut
     */
    router.post('/analyze', asyncHandler(async (req, res) => {
        const { text, analysisType } = req.body;

        if (!text) {
            return res.status(400).json({
                success: false,
                error: 'Texte requis'
            });
        }

        try {
            let result = {
                success: true,
                stats: {
                    wordCount: text.split(/\s+/).length,
                    charCount: text.length,
                    sentenceCount: text.split(/[.!?]+/).length - 1
                }
            };

            switch (analysisType) {
                case 'complete':
                    // Analyse complète avec Ollama
                    const summary = await ollamaService.summarizeText(text, 200);
                    const keywords = await ollamaService.extractKeywords(text, 10);
                    const sentiment = await ollamaService.analyzeSentiment(text);

                    result.summary = summary.success ? summary.summary : null;
                    result.keywords = keywords.success ? keywords.keywords : [];
                    result.sentiment = sentiment.success ? sentiment : null;
                    break;

                case 'keywords':
                    const keywordsResult = await ollamaService.extractKeywords(text, 15);
                    result.keywords = keywordsResult.success ? keywordsResult.keywords : [];
                    break;

                case 'sentiment':
                    const sentimentResult = await ollamaService.analyzeSentiment(text);
                    result.sentiment = sentimentResult.success ? sentimentResult : null;
                    break;

                case 'summary':
                    const summaryResult = await ollamaService.summarizeText(text, 200);
                    result.summary = summaryResult.success ? summaryResult.summary : null;
                    break;

                default:
                    result.summary = text.substring(0, 200) + '...';
            }

            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }));

    /**
     * POST /ai/documents/:id/analyze - Analyse d'un document indexé
     */
    router.post('/documents/:id/analyze', asyncHandler(async (req, res) => {
        const documentId = parseInt(req.params.id);
        const { analysisType } = req.body;

        try {
            const document = aiDatabaseService.getAIDocumentById(documentId);

            if (!document) {
                return res.status(404).json({
                    success: false,
                    error: 'Document non trouvé'
                });
            }

            // Récupérer le contenu
            const content = document.content || document.text_content || '';

            if (!content) {
                return res.status(400).json({
                    success: false,
                    error: 'Document sans contenu'
                });
            }

            // Réutiliser la route /ai/analyze
            const analysisResult = await (async () => {
                let result = {
                    success: true,
                    stats: {
                        wordCount: content.split(/\s+/).length,
                        charCount: content.length,
                        sentenceCount: content.split(/[.!?]+/).length - 1,
                        language: document.language
                    }
                };

                if (analysisType === 'complete') {
                    const summary = await ollamaService.summarizeText(content, 200);
                    const keywords = await ollamaService.extractKeywords(content, 10);
                    const sentiment = await ollamaService.analyzeSentiment(content);

                    result.summary = summary.success ? summary.summary : null;
                    result.keywords = keywords.success ? keywords.keywords : [];
                    result.sentiment = sentiment.success ? sentiment : null;
                }

                return result;
            })();

            res.json(analysisResult);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }));

    /**
     * POST /ai/summarize - Résumé de texte brut
     */
    router.post('/summarize', asyncHandler(async (req, res) => {
        const { text, maxLength, style } = req.body;

        if (!text) {
            return res.status(400).json({
                success: false,
                error: 'Texte requis'
            });
        }

        try {
            const result = await ollamaService.summarizeText(text, maxLength || 200);

            if (result.success) {
                res.json({
                    success: true,
                    summary: result.summary,
                    originalLength: text.length,
                    summaryLength: result.summary.length,
                    compression: Math.round((1 - result.summary.length / text.length) * 100),
                    processingTime: result.processingTime
                });
            } else {
                res.status(500).json(result);
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }));

    /**
     * POST /ai/documents/:id/summarize - Résumé d'un document indexé
     */
    router.post('/documents/:id/summarize', asyncHandler(async (req, res) => {
        const documentId = parseInt(req.params.id);
        const { maxLength, style } = req.body;

        try {
            const document = aiDatabaseService.getAIDocumentById(documentId);

            if (!document) {
                return res.status(404).json({
                    success: false,
                    error: 'Document non trouvé'
                });
            }

            const content = document.content || document.text_content || '';

            if (!content) {
                return res.status(400).json({
                    success: false,
                    error: 'Document sans contenu'
                });
            }

            const result = await ollamaService.summarizeText(content, maxLength || 200);

            if (result.success) {
                res.json({
                    success: true,
                    summary: result.summary,
                    originalLength: content.length,
                    summaryLength: result.summary.length,
                    compression: Math.round((1 - result.summary.length / content.length) * 100),
                    documentId: documentId,
                    filename: document.filename
                });
            } else {
                res.status(500).json(result);
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }));

    /**
     * GET /ai/documents/:id/keywords - Extraction mots-clés document
     */
    router.get('/documents/:id/keywords', asyncHandler(async (req, res) => {
        const documentId = parseInt(req.params.id);

        try {
            const document = aiDatabaseService.getAIDocumentById(documentId);

            if (!document) {
                return res.status(404).json({
                    success: false,
                    error: 'Document non trouvé'
                });
            }

            const content = document.content || document.text_content || '';
            const result = await ollamaService.extractKeywords(content, 10);

            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }));

    /**
     * POST /ai/sentiment - Analyse de sentiment
     */
    router.post('/sentiment', asyncHandler(async (req, res) => {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({
                success: false,
                error: 'Texte requis'
            });
        }

        try {
            const result = await ollamaService.analyzeSentiment(text);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }));

    /**
     * GET /ai/ocr/statistics - Statistiques OCR
     */
    router.get('/ocr/statistics', asyncHandler(async (req, res) => {
        const ocrService = require('../backend/services/ai/ocrService');
        const stats = ocrService.getStatistics();
        res.json(stats);
    }));

    return router;
};
