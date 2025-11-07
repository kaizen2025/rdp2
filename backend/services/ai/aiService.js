/**
 * Service principal de l'Agent IA - DocuCortex
 * Orchestre tous les services IA et gere la persistence
 * Version améliorée avec accès réseau, métadonnées et réponses intelligentes
 */

const documentParserService = require('./documentParserService');
const nlpService = require('./nlpService');
const vectorSearchService = require('./vectorSearchService');
const conversationService = require('./conversationService');
const networkDocumentService = require('./networkDocumentService');
const documentMetadataService = require('./documentMetadataService');
const intelligentResponseService = require('./intelligentResponseService');
const filePreviewService = require('./filePreviewService');
const ocrService = require('./ocrService');
const huggingfaceService = require('./huggingfaceService'); // ✅ Service Hugging Face (PRIORITAIRE)
const openrouterService = require('./openrouterService'); // ✅ Service OpenRouter (FALLBACK)
const path = require('path');
const fs = require('fs').promises;

class AIService {
    constructor(databaseService) {
        this.db = databaseService;
        this.initialized = false;
        this.stats = {
            totalDocuments: 0,
            totalConversations: 0,
            totalQueries: 0
        };
        // Système multi-provider avec fallback
        this.providers = {
            huggingface: { enabled: false, service: huggingfaceService },
            openrouter: { enabled: false, service: openrouterService }
        };
        this.activeProvider = 'default'; // Provider actuellement utilisé
        this.config = null; // Configuration complète chargée depuis ai-config.json
        this.gedSystemPrompt = null; // Prompt système GED optimisé pour Polaris Alpha
    }

    /**
     * Initialise le service IA avec système multi-provider
     */
    async initialize() {
        if (this.initialized) return;

        try {
            console.log('\n🔧 Initialisation du service IA DocuCortex...');
            console.log('=============================================');

            // Initialiser le NLP
            await nlpService.initialize();

            // Charger la configuration IA
            this.config = this.loadAIConfig();

            // Charger le prompt système GED optimisé
            this.gedSystemPrompt = this.loadGEDSystemPrompt();

            if (!this.config || !this.config.providers) {
                console.warn('⚠️ Configuration IA non trouvée, utilisation du service par défaut');
                this.initialized = true;
                return { success: true, provider: 'default' };
            }

            // Initialiser les providers par ordre de priorité
            const sortedProviders = this.getSortedProviders();

            for (const providerName of sortedProviders) {
                const providerConfig = this.config.providers[providerName];

                if (!providerConfig.enabled) {
                    console.log(`⏭️  ${providerName}: désactivé (priority: ${providerConfig.priority})`);
                    continue;
                }

                console.log(`\n🔌 Initialisation de ${providerName} (priority: ${providerConfig.priority})...`);

                try {
                    const result = await this.providers[providerName].service.initialize({
                        apiKey: providerConfig.apiKey,
                        model: providerConfig.model,
                        timeout: providerConfig.timeout
                    });

                    if (result.success) {
                        this.providers[providerName].enabled = true;

                        // Le premier provider qui réussit devient actif
                        if (this.activeProvider === 'default') {
                            this.activeProvider = providerName;
                            console.log(`✅ ${providerName} défini comme provider actif`);
                        } else {
                            console.log(`✅ ${providerName} disponible en fallback`);
                        }
                    } else {
                        console.warn(`⚠️ ${providerName} non disponible:`, result.error);
                    }
                } catch (error) {
                    console.error(`❌ Erreur initialisation ${providerName}:`, error.message);
                }
            }

            // Charger les documents existants dans l'index
            await this.loadDocumentsToIndex();

            this.initialized = true;

            console.log('\n=============================================');
            console.log(`✅ Service IA initialisé - Provider actif: ${this.activeProvider}`);
            console.log(`   Fallback: ${this.config.fallback?.enabled ? 'Activé' : 'Désactivé'}`);
            console.log('=============================================\n');

            return {
                success: true,
                activeProvider: this.activeProvider,
                availableProviders: Object.keys(this.providers).filter(p => this.providers[p].enabled),
                fallbackEnabled: this.config.fallback?.enabled
            };
        } catch (error) {
            console.error('❌ Erreur initialisation service IA:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Charge la configuration IA depuis le fichier de config
     */
    loadAIConfig() {
        try {
            const configPath = path.join(__dirname, '../../..', 'config', 'ai-config.json');
            const envPath = path.join(__dirname, '../../..', '.env.ai');
            const fs = require('fs');

            if (!fs.existsSync(configPath)) {
                console.warn('⚠️ Fichier ai-config.json non trouvé');
                return null;
            }

            // Charger la configuration
            const configData = fs.readFileSync(configPath, 'utf8');
            const config = JSON.parse(configData);

            // Charger les clés API depuis le fichier .env.ai
            const apiKeys = this.loadAPIKeys(envPath);

            // Remplacer les placeholders par les vraies clés API
            if (config.providers) {
                Object.keys(config.providers).forEach(providerName => {
                    const provider = config.providers[providerName];

                    if (provider.apiKey === 'STORED_IN_ENV_FILE') {
                        // Trouver la clé correspondante
                        const keyName = providerName.toUpperCase() + '_API_KEY';
                        if (apiKeys[keyName]) {
                            provider.apiKey = apiKeys[keyName];
                        } else {
                            console.warn(`⚠️ Clé API non trouvée pour ${providerName} (${keyName})`);
                        }
                    }
                });
            }

            console.log('✅ Configuration IA chargée');
            return config;
        } catch (error) {
            console.error('❌ Erreur chargement configuration IA:', error.message);
            return null;
        }
    }

    /**
     * Charge les clés API depuis le fichier .env.ai
     */
    loadAPIKeys(envPath) {
        try {
            const fs = require('fs');

            if (!fs.existsSync(envPath)) {
                console.warn('⚠️ Fichier .env.ai non trouvé - Les clés API doivent être configurées');
                return {};
            }

            const envData = fs.readFileSync(envPath, 'utf8');
            const keys = {};

            // Parser le fichier .env
            envData.split('\n').forEach(line => {
                line = line.trim();

                // Ignorer les commentaires et lignes vides
                if (!line || line.startsWith('#')) return;

                const [key, ...valueParts] = line.split('=');
                if (key && valueParts.length > 0) {
                    keys[key.trim()] = valueParts.join('=').trim();
                }
            });

            console.log(`✅ ${Object.keys(keys).length} clés API chargées depuis .env.ai`);
            return keys;
        } catch (error) {
            console.error('❌ Erreur chargement .env.ai:', error.message);
            return {};
        }
    }

    /**
     * Charge le prompt système GED optimisé pour Polaris Alpha
     */
    loadGEDSystemPrompt() {
        try {
            const fs = require('fs');
            const promptPath = path.join(__dirname, '../../..', 'config', 'ged-system-prompt.json');

            if (!fs.existsSync(promptPath)) {
                console.warn('⚠️ Fichier ged-system-prompt.json non trouvé, utilisation du prompt par défaut');
                return 'Tu es DocuCortex, un assistant IA intelligent pour la gestion documentaire.';
            }

            const promptData = fs.readFileSync(promptPath, 'utf8');
            const promptConfig = JSON.parse(promptData);

            console.log('✅ Prompt système GED chargé (version ' + promptConfig.version + ')');
            return promptConfig.systemPrompt;
        } catch (error) {
            console.error('❌ Erreur chargement prompt GED:', error.message);
            return 'Tu es DocuCortex, un assistant IA intelligent pour la gestion documentaire.';
        }
    }

    /**
     * Retourne les providers triés par priorité
     */
    getSortedProviders() {
        if (!this.config || !this.config.providers) return [];

        return Object.keys(this.config.providers).sort((a, b) => {
            const priorityA = this.config.providers[a].priority || 999;
            const priorityB = this.config.providers[b].priority || 999;
            return priorityA - priorityB; // Ordre croissant (priority 1 avant priority 2)
        });
    }

    /**
     * Obtient le service d'un provider
     */
    getProviderService(providerName) {
        if (this.providers[providerName] && this.providers[providerName].enabled) {
            return this.providers[providerName].service;
        }
        return null;
    }

    /**
     * Change le provider actif
     */
    setActiveProvider(providerName) {
        if (this.providers[providerName] && this.providers[providerName].enabled) {
            this.activeProvider = providerName;
            console.log(`✅ Provider actif changé vers: ${providerName}`);
            return true;
        }
        console.warn(`⚠️ Provider ${providerName} non disponible`);
        return false;
    }

    /**
     * Charge les documents de la DB dans l'index vectoriel
     */
    async loadDocumentsToIndex() {
        try {
            const documents = this.db.getAllAIDocuments();
            
            documents.forEach(doc => {
                vectorSearchService.indexDocument(
                    doc.id,
                    doc.content,
                    {
                        filename: doc.filename,
                        fileType: doc.file_type,
                        language: doc.language,
                        indexedAt: doc.indexed_at
                    }
                );
            });

            this.stats.totalDocuments = documents.length;
            console.log(`${documents.length} document(s) charge(s) dans l'index`);
        } catch (error) {
            console.error('Erreur chargement documents:', error);
        }
    }

    /**
     * Upload et traite un document
     */
    async uploadDocument(file) {
        try {
            const { originalname, buffer, mimetype, size } = file;
            
            console.log(`Upload document: ${originalname} (${size} bytes)`);

            // Parser le document
            const parseResult = await documentParserService.parseDocument(
                originalname,
                buffer
            );

            if (!parseResult.success) {
                return {
                    success: false,
                    error: 'Echec du parsing du document',
                    details: parseResult.error
                };
            }

            // Nettoyer le texte
            const cleanedText = documentParserService.cleanText(parseResult.text);
            
            // Detecter la langue
            const language = documentParserService.detectLanguage(cleanedText);

            // Extraire les mots-cles
            const keywords = nlpService.extractKeywords(cleanedText, 10);

            // Sauvegarder en DB
            const documentId = this.db.createAIDocument({
                filename: originalname,
                file_type: path.extname(originalname).substring(1),
                file_size: size,
                content: cleanedText,
                metadata: JSON.stringify({
                    parseMethod: parseResult.method || 'standard',
                    keywords: keywords,
                    wordCount: cleanedText.split(/\s+/).length
                }),
                language: language
            });

            // Creer les chunks et les indexer
            const chunks = documentParserService.chunkText(cleanedText);
            
            chunks.forEach(chunk => {
                this.db.createAIDocumentChunk({
                    document_id: documentId,
                    chunk_text: chunk.text,
                    chunk_position: chunk.position,
                    word_count: chunk.wordCount
                });
            });

            // Indexer dans le moteur de recherche vectorielle
            vectorSearchService.indexDocument(
                documentId,
                cleanedText,
                {
                    filename: originalname,
                    fileType: path.extname(originalname).substring(1),
                    language: language,
                    keywords: keywords
                }
            );

            this.stats.totalDocuments++;

            return {
                success: true,
                documentId: documentId,
                filename: originalname,
                language: language,
                wordCount: cleanedText.split(/\s+/).length,
                chunksCount: chunks.length,
                keywords: keywords.slice(0, 5)
            };
        } catch (error) {
            console.error('Erreur upload document:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Traite une requete utilisateur avec système multi-provider et fallback
     */
    async processQuery(sessionId, message, userId = null, options = {}) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            this.stats.totalQueries++;

            // Obtenir les parametres
            const settings = this.getSettings();

            // Récupérer le contexte de conversation récent
            const conversationHistory = this.db.getAIConversationsBySession(sessionId, 5);
            const contextMessages = conversationHistory.map(conv => ({
                role: conv.user_message ? 'user' : 'assistant',
                content: conv.user_message || conv.ai_response
            })).reverse();

            // Déterminer quel provider utiliser
            let providerToUse = options.aiProvider || this.activeProvider;
            let result = null;
            let attempts = 0;
            const maxAttempts = this.config?.fallback?.retryAttempts || 2;

            // Obtenir les providers disponibles dans l'ordre de fallback
            const sortedProviders = this.getSortedProviders();
            const availableProviders = sortedProviders.filter(p =>
                this.providers[p] && this.providers[p].enabled
            );

            // Boucle de tentatives avec fallback
            while (attempts < maxAttempts && !result?.success && availableProviders.length > 0) {
                attempts++;

                // Trouver le provider à utiliser
                if (!this.providers[providerToUse]?.enabled) {
                    providerToUse = availableProviders[0];
                }

                console.log(`\n🤖 Tentative ${attempts}/${maxAttempts} avec ${providerToUse}...`);

                const providerService = this.getProviderService(providerToUse);

                if (providerService) {
                    try {
                        // ✅ NOUVEAU: Détecter si la question nécessite une recherche documentaire
                        const needsDocuments = this._needsDocumentSearch(message);

                        let enrichedMessage = message;
                        let documentSources = [];
                        let searchResult = null;

                        // Rechercher les documents SEULEMENT si nécessaire
                        if (needsDocuments) {
                            console.log('🔍 Question nécessite une recherche documentaire');
                            searchResult = await this.searchDocuments(message, { limit: 5 });
                        } else {
                            console.log('💬 Question conversationnelle - pas de recherche documentaire');
                        }

                        if (searchResult && searchResult.success && searchResult.results.length > 0) {
                            // Enrichir le message avec le contexte documentaire pour le LLM
                            const contextDocs = searchResult.results.map((r, idx) => {
                                const doc = r.document;
                                return `
📄 **Document ${idx + 1}: ${doc?.filename || 'Sans nom'}**
📁 Chemin: \`${doc?.filepath || 'Non spécifié'}\`
📅 Modifié: ${doc?.modifiedDate || 'Inconnu'}
👤 Auteur: ${doc?.author || 'Inconnu'}
🏷️  Catégorie: ${doc?.category || 'Non classé'}
📊 Pertinence: ${Math.round(r.score * 100)}%

**Extrait:**
${r.content?.substring(0, 300)}...
`;
                            }).join('\n---\n');

                            enrichedMessage = `${message}

---
**📚 CONTEXTE DOCUMENTAIRE (${searchResult.results.length} documents trouvés):**

${contextDocs}

---
**INSTRUCTIONS:** Utilise ces documents pour répondre à la question. Cite toujours tes sources avec le nom du fichier et le chemin réseau. Fournis des réponses précises basées sur le contenu des documents.`;

                            documentSources = searchResult.results.map(r => ({
                                filename: r.document?.filename || 'Document',
                                filepath: r.document?.filepath || null,
                                category: r.document?.category || null,
                                author: r.document?.author || null,
                                modifiedDate: r.document?.modifiedDate || null,
                                score: r.score,
                                snippet: r.content?.substring(0, 200) + '...'
                            }));
                        }

                        result = await providerService.processConversation(
                            [...contextMessages, { role: 'user', content: enrichedMessage }],
                            {
                                sessionId: sessionId,
                                context: contextMessages,
                                systemPrompt: settings.systemPrompt || this.gedSystemPrompt || 'Tu es DocuCortex, un assistant IA intelligent pour la gestion documentaire.',
                                temperature: settings.temperature || 0.7,
                                maxTokens: settings.maxTokens || 4096
                            }
                        );

                        if (result.success) {
                            console.log(`✅ Réponse obtenue avec ${providerToUse}`);

                            // Ajouter les sources au résultat
                            if (documentSources.length > 0) {
                                result.context = searchResult.results;
                                result.sources = documentSources;
                            }

                            result.aiProvider = providerToUse;
                            break; // Succès, on sort de la boucle
                        }
                    } catch (providerError) {
                        console.error(`❌ Erreur avec ${providerToUse}:`, providerError.message);
                        result = { success: false, error: providerError.message };
                    }
                }

                // Si échec et fallback activé, essayer le provider suivant
                if (!result?.success && this.config?.fallback?.enabled && this.config?.fallback?.autoSwitch) {
                    const currentIndex = availableProviders.indexOf(providerToUse);
                    const nextIndex = currentIndex + 1;

                    if (nextIndex < availableProviders.length) {
                        const nextProvider = availableProviders[nextIndex];
                        console.warn(`⚠️ ${providerToUse} a échoué, basculement vers ${nextProvider}...`);
                        providerToUse = nextProvider;
                    } else {
                        console.warn('⚠️ Tous les providers ont échoué');
                        break;
                    }
                } else {
                    break; // Pas de fallback ou dernier provider, on sort
                }
            }

            // Si aucun provider n'a fonctionné, utiliser le service par défaut
            if (!result?.success) {
                console.log('🔧 Utilisation du service de conversation par défaut...');
                result = await conversationService.processMessage(
                    sessionId,
                    message,
                    settings
                );
                result.aiProvider = 'default';
            }

            // Sauvegarder la conversation en DB
            if (result.success) {
                this.db.createAIConversation({
                    session_id: sessionId,
                    user_message: message,
                    ai_response: result.response,
                    context_used: JSON.stringify(result.context || []),
                    confidence_score: result.confidence || 0.5,
                    response_time_ms: result.responseTime || 0,
                    language: settings.language || 'fr',
                    ai_provider: result.aiProvider || 'default'
                });

                this.stats.totalConversations++;
            }

            // Ajouter des métadonnées
            result.providerStats = result.aiProvider !== 'default'
                ? this.getProviderService(result.aiProvider)?.getStatistics()
                : null;

            return result;
        } catch (error) {
            console.error('❌ Erreur traitement requete:', error);
            return {
                success: false,
                response: 'Une erreur s\'est produite. Veuillez réessayer.',
                error: error.message,
                confidence: 0,
                aiProvider: 'error'
            };
        }
    }

    /**
     * Recherche dans les documents
     */
    async searchDocuments(query, options = {}) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            const results = vectorSearchService.search(query, options);

            // Enrichir avec les infos de la DB (incluant métadonnées GED)
            const enrichedResults = results.map(result => {
                const doc = this.db.getAIDocumentById(result.documentId);
                return {
                    ...result,
                    document: doc ? {
                        id: doc.id,
                        filename: doc.filename,
                        fileType: doc.file_type,
                        language: doc.language,
                        indexedAt: doc.indexed_at,
                        // Métadonnées GED pour Polaris Alpha
                        filepath: doc.filepath,
                        category: doc.category,
                        documentType: doc.document_type,
                        author: doc.author,
                        modifiedDate: doc.modified_date,
                        tags: doc.tags ? JSON.parse(doc.tags) : [],
                        source: doc.source,
                        wordCount: doc.word_count,
                        qualityScore: doc.quality_score
                    } : null
                };
            });

            return {
                success: true,
                results: enrichedResults,
                total: enrichedResults.length
            };
        } catch (error) {
            console.error('Erreur recherche documents:', error);
            return {
                success: false,
                error: error.message,
                results: []
            };
        }
    }

    /**
     * Obtient la liste des documents indexes
     */
    getDocuments(limit = 100, offset = 0) {
        try {
            const documents = this.db.getAllAIDocuments(limit, offset);
            const total = this.db.getAIDocumentsCount();

            return {
                success: true,
                documents: documents,
                total: total,
                limit: limit,
                offset: offset
            };
        } catch (error) {
            console.error('Erreur recuperation documents:', error);
            return {
                success: false,
                error: error.message,
                documents: [],
                total: 0
            };
        }
    }

    /**
     * Supprime un document
     */
    async deleteDocument(documentId) {
        try {
            // Supprimer de la DB
            const deleted = this.db.deleteAIDocument(documentId);
            
            if (deleted) {
                // Supprimer de l'index vectoriel
                vectorSearchService.removeDocument(documentId);
                this.stats.totalDocuments--;
                
                return { success: true };
            }

            return { success: false, error: 'Document non trouve' };
        } catch (error) {
            console.error('Erreur suppression document:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Obtient l'historique des conversations
     */
    getConversationHistory(sessionId = null, limit = 50) {
        try {
            const conversations = sessionId
                ? this.db.getAIConversationsBySession(sessionId, limit)
                : this.db.getRecentAIConversations(limit);

            return {
                success: true,
                conversations: conversations,
                total: conversations.length
            };
        } catch (error) {
            console.error('Erreur recuperation historique:', error);
            return {
                success: false,
                error: error.message,
                conversations: []
            };
        }
    }

    /**
     * Obtient les parametres de l'IA
     */
    getSettings() {
        try {
            const settings = this.db.getAllAISettings();
            const settingsObject = {};

            settings.forEach(setting => {
                let value = setting.setting_value;
                
                // Convertir les types
                if (value === 'true') value = true;
                else if (value === 'false') value = false;
                else if (!isNaN(value)) value = parseFloat(value);

                settingsObject[setting.setting_key] = value;
            });

            return settingsObject;
        } catch (error) {
            console.error('Erreur recuperation parametres:', error);
            return {};
        }
    }

    /**
     * Met a jour un parametre
     */
    updateSetting(key, value) {
        try {
            this.db.updateAISetting(key, value.toString());
            return { success: true };
        } catch (error) {
            console.error('Erreur mise a jour parametre:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Obtient les statistiques
     */
    async getStatistics() {
        try {
            const dbStats = {
                totalDocuments: this.db.getAIDocumentsCount(),
                totalConversations: this.db.getAIConversationsCount(),
                totalChunks: this.db.getAIChunksCount()
            };

            const indexStats = vectorSearchService.getStats();
            const sessionStats = conversationService.getStats();

            return {
                success: true,
                database: dbStats,
                index: indexStats,
                sessions: sessionStats,
                runtime: this.stats,
                ollama: this.ollamaEnabled ? ollamaService.getStatistics() : null,
                aiProvider: this.aiProvider
            };
        } catch (error) {
            console.error('Erreur recuperation statistiques:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Reinitialise completement l'IA
     */
    async reset() {
        try {
            // Supprimer tous les documents de la DB
            this.db.deleteAllAIDocuments();
            
            // Reinitialiser l'index vectoriel
            vectorSearchService.clearIndex();
            
            // Reinitialiser les stats
            this.stats = {
                totalDocuments: 0,
                totalConversations: 0,
                totalQueries: 0
            };

            return { success: true, message: 'IA reinitialise avec succes' };
        } catch (error) {
            console.error('Erreur reinitialisation:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== FONCTIONNALITÉS OLLAMA ====================

    /**
     * Analyse de sentiment avec Ollama
     */
    async analyzeSentiment(text) {
        try {
            if (!this.ollamaEnabled) {
                return {
                    success: false,
                    error: 'Ollama n\'est pas disponible',
                    fallbackUsed: true
                };
            }

            const result = await ollamaService.analyzeSentiment(text);
            
            if (result.success) {
                console.log(`💭 Analyse sentiment: ${result.sentiment} (${Math.round(result.confidence * 100)}%)`);
            }

            return result;
        } catch (error) {
            console.error('❌ Erreur analyse sentiment:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Résumé intelligent avec Ollama
     */
    async summarizeText(text, maxLength = 200) {
        try {
            if (!this.ollamaEnabled) {
                // Fallback: résumé simple par coupure
                const words = text.split(' ');
                const summary = words.slice(0, Math.floor(maxLength / 6)).join(' ');
                return {
                    success: true,
                    summary: summary + (words.length > maxLength / 6 ? '...' : ''),
                    method: 'fallback'
                };
            }

            const result = await ollamaService.summarizeText(text, maxLength);
            
            if (result.success) {
                console.log(`📝 Résumé généré: ${result.compression}% de compression`);
            }

            return result;
        } catch (error) {
            console.error('❌ Erreur résumé texte:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Extraction de mots-clés avec Ollama
     */
    async extractKeywords(text, maxKeywords = 10) {
        try {
            if (!this.ollamaEnabled) {
                // Fallback: extraction simple par fréquence
                const words = text.toLowerCase()
                    .replace(/[^\w\s]/g, ' ')
                    .split(/\s+/)
                    .filter(w => w.length > 3);
                
                const frequency = {};
                words.forEach(word => {
                    frequency[word] = (frequency[word] || 0) + 1;
                });
                
                const keywords = Object.entries(frequency)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, maxKeywords)
                    .map(([word]) => word);

                return {
                    success: true,
                    keywords: keywords,
                    method: 'frequency'
                };
            }

            const result = await ollamaService.extractKeywords(text, maxKeywords);
            
            if (result.success) {
                console.log(`🏷️ Mots-clés extraits: ${result.keywords.join(', ')}`);
            }

            return result;
        } catch (error) {
            console.error('❌ Erreur extraction mots-clés:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Traduction avec Ollama
     */
    async translateText(text, targetLanguage = 'français') {
        try {
            if (!this.ollamaEnabled) {
                return {
                    success: false,
                    error: 'Ollama n\'est pas disponible pour la traduction',
                    fallbackUsed: true
                };
            }

            const result = await ollamaService.translateText(text, targetLanguage);
            
            if (result.success) {
                console.log(`🌐 Traduction vers ${targetLanguage} réussie`);
            }

            return result;
        } catch (error) {
            console.error('❌ Erreur traduction:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Q&A sur un document avec Ollama
     */
    async answerQuestion(documentId, question) {
        try {
            const document = this.db.getAIDocumentById(documentId);
            
            if (!document) {
                return {
                    success: false,
                    error: 'Document non trouvé'
                };
            }

            if (!this.ollamaEnabled) {
                return {
                    success: false,
                    error: 'Ollama n\'est pas disponible pour Q&A',
                    fallbackUsed: true
                };
            }

            const result = await ollamaService.answerQuestion(document.content, question);
            
            if (result.success) {
                console.log(`❓ Q&A sur document ${document.filename}: ${question.substring(0, 50)}...`);
            }

            return result;
        } catch (error) {
            console.error('❌ Erreur Q&A document:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Change le modèle Ollama
     */
    async setOllamaModel(modelName) {
        try {
            if (!this.ollamaEnabled) {
                return {
                    success: false,
                    error: 'Ollama n\'est pas disponible'
                };
            }

            const result = await ollamaService.setModel(modelName);
            
            if (result.success) {
                console.log(`🔄 Modèle Ollama changé vers: ${modelName}`);
            }

            return result;
        } catch (error) {
            console.error('❌ Erreur changement modèle:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Obtient les informations Ollama
     */
    getOllamaInfo() {
        const modelInfo = ollamaService.getModelInfo();
        const ollamaStats = ollamaService.getStatistics();
        
        return {
            enabled: this.ollamaEnabled,
            provider: this.aiProvider,
            model: modelInfo,
            stats: ollamaStats,
            connection: ollamaStats.connection
        };
    }

    // ==================== NOUVELLES FONCTIONNALITÉS DOCUCORTEX ====================

    /**
     * Configure l'accès au serveur réseau
     */
    configureNetworkAccess(config) {
        networkDocumentService.configure(config);
        return { success: true, message: 'Configuration réseau appliquée' };
    }

    /**
     * Teste la connexion au serveur réseau
     */
    async testNetworkConnection() {
        return await networkDocumentService.testConnection();
    }

    /**
     * Scan complet du répertoire réseau et indexation
     */
    async scanAndIndexNetwork() {
        try {
            console.log('🔍 Démarrage scan réseau...');
            
            const scanResult = await networkDocumentService.fullScan();
            
            if (!scanResult.success) {
                return scanResult;
            }

            console.log(`📄 ${scanResult.files.length} fichiers trouvés, début indexation...`);
            
            let indexed = 0;
            let errors = 0;

            for (const file of scanResult.files) {
                try {
                    // Lire le fichier
                    const readResult = await networkDocumentService.readFile(file.path);
                    
                    if (!readResult.success) {
                        errors++;
                        continue;
                    }

                    // Parser le contenu
                    const parseResult = await documentParserService.parseDocument(
                        file.name,
                        readResult.buffer
                    );

                    if (!parseResult.success) {
                        errors++;
                        continue;
                    }

                    // Extraire métadonnées enrichies
                    const metadata = documentMetadataService.extractMetadata(
                        file,
                        parseResult.text
                    );

                    // Nettoyer et chunker
                    const cleanedText = documentParserService.cleanText(parseResult.text);
                    const chunks = documentParserService.chunkText(cleanedText);

                    // Sauvegarder en DB avec métadonnées
                    const documentId = this.db.createAIDocument({
                        filename: file.name,
                        filepath: file.path,
                        relativePath: file.relativePath,
                        file_type: file.extension,
                        content: cleanedText,
                        size: file.size,
                        language: metadata.language,
                        indexed_at: new Date().toISOString(),
                        // Métadonnées étendues
                        category: metadata.category,
                        document_type: metadata.type,
                        tags: JSON.stringify(metadata.tags),
                        word_count: metadata.wordCount,
                        quality_score: metadata.qualityScore,
                        date_in_filename: metadata.dateInFilename,
                        modified_date: file.modified?.toISOString()
                    });

                    // Sauvegarder chunks
                    chunks.forEach((chunk, idx) => {
                        this.db.createAIChunk({
                            document_id: documentId,
                            chunk_index: idx,
                            content: chunk,
                            char_count: chunk.length
                        });
                    });

                    // Indexer dans vectorSearch
                    vectorSearchService.indexDocument(
                        documentId,
                        cleanedText,
                        {
                            filename: file.name,
                            filepath: file.path,
                            relativePath: file.relativePath,
                            fileType: file.extension,
                            language: metadata.language,
                            category: metadata.category,
                            type: metadata.type,
                            modified: file.modified,
                            indexedAt: new Date()
                        }
                    );

                    indexed++;

                    if (indexed % 10 === 0) {
                        console.log(`   ... ${indexed} fichiers indexés`);
                    }

                } catch (error) {
                    console.error(`❌ Erreur indexation ${file.name}:`, error.message);
                    errors++;
                }
            }

            this.stats.totalDocuments += indexed;

            console.log(`✅ Scan réseau terminé: ${indexed} indexés, ${errors} erreurs`);

            return {
                success: true,
                scanned: scanResult.files.length,
                indexed,
                errors,
                duration: scanResult.duration
            };

        } catch (error) {
            console.error('❌ Erreur scan réseau:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Démarre la surveillance automatique du réseau
     */
    async startNetworkWatching() {
        const self = this;
        
        await networkDocumentService.startWatching(async (file) => {
            console.log(`📢 Nouveau fichier détecté: ${file.name}`);
            
            try {
                // Indexer automatiquement
                const readResult = await networkDocumentService.readFile(file.path);
                if (!readResult.success) return;

                const parseResult = await documentParserService.parseDocument(
                    file.name,
                    readResult.buffer
                );
                if (!parseResult.success) return;

                const metadata = documentMetadataService.extractMetadata(file, parseResult.text);
                const cleanedText = documentParserService.cleanText(parseResult.text);
                const chunks = documentParserService.chunkText(cleanedText);

                const documentId = self.db.createAIDocument({
                    filename: file.name,
                    filepath: file.path,
                    relativePath: file.relativePath,
                    file_type: file.extension,
                    content: cleanedText,
                    size: file.size,
                    language: metadata.language,
                    category: metadata.category,
                    document_type: metadata.type,
                    tags: JSON.stringify(metadata.tags),
                    indexed_at: new Date().toISOString()
                });

                chunks.forEach((chunk, idx) => {
                    self.db.createAIChunk({
                        document_id: documentId,
                        chunk_index: idx,
                        content: chunk,
                        char_count: chunk.length
                    });
                });

                vectorSearchService.indexDocument(documentId, cleanedText, {
                    filename: file.name,
                    filepath: file.path,
                    fileType: file.extension,
                    language: metadata.language,
                    category: metadata.category
                });

                self.stats.totalDocuments++;
                console.log(`✅ Auto-indexé: ${file.name}`);

            } catch (error) {
                console.error(`❌ Erreur auto-indexation ${file.name}:`, error.message);
            }
        });

        return { success: true, message: 'Surveillance réseau démarrée' };
    }

    /**
     * Arrête la surveillance réseau
     */
    stopNetworkWatching() {
        networkDocumentService.stopWatching();
        return { success: true, message: 'Surveillance réseau arrêtée' };
    }

    /**
     * Recherche intelligente avec réponses enrichies
     */
    async intelligentSearch(query, sessionId = null, userId = null) {
        try {
            this.stats.totalQueries++;

            // Recherche vectorielle
            const searchResults = vectorSearchService.search(query, 10);

            // Enrichir avec métadonnées depuis DB
            const enrichedResults = searchResults.map(result => {
                const doc = this.db.getAIDocumentById(result.documentId);
                return {
                    ...result,
                    metadata: {
                        filename: doc.filename,
                        filepath: doc.filepath,
                        relativePath: doc.relativePath,
                        extension: doc.file_type,
                        size: doc.size,
                        sizeFormatted: documentMetadataService.formatFileSize(doc.size),
                        category: doc.category,
                        type: doc.document_type,
                        tags: doc.tags ? JSON.parse(doc.tags) : [],
                        language: doc.language,
                        modified: doc.modified_date,
                        wordCount: doc.word_count,
                        qualityScore: doc.quality_score
                    },
                    content: doc.content
                };
            });

            // Générer réponse intelligente
            const intelligentResponse = intelligentResponseService.generateEnrichedResponse(
                query,
                enrichedResults
            );

            // Sauvegarder conversation si sessionId fourni
            if (sessionId) {
                this.db.createAIConversation({
                    session_id: sessionId,
                    user_id: userId,
                    user_message: query,
                    ai_response: intelligentResponse.text,
                    confidence_score: intelligentResponse.confidence,
                    sources: JSON.stringify(intelligentResponse.sources),
                    created_at: new Date().toISOString()
                });

                this.stats.totalConversations++;
            }

            return {
                success: true,
                response: intelligentResponse.text,
                confidence: intelligentResponse.confidence,
                sources: intelligentResponse.sources,
                attachments: intelligentResponse.attachments,
                suggestions: intelligentResponse.suggestions,
                metadata: intelligentResponse.metadata
            };

        } catch (error) {
            console.error('❌ Erreur recherche intelligente:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Prépare preview d'un document
     */
    async prepareDocumentPreview(documentId) {
        try {
            const doc = this.db.getAIDocumentById(documentId);
            
            if (!doc) {
                return { success: false, error: 'Document introuvable' };
            }

            const previewResult = await filePreviewService.generateThumbnail(
                doc.filepath,
                documentId
            );

            return {
                success: true,
                preview: previewResult,
                document: {
                    id: documentId,
                    filename: doc.filename,
                    path: doc.filepath,
                    type: doc.file_type,
                    size: doc.size
                }
            };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Prépare téléchargement d'un document
     */
    async prepareDocumentDownload(documentId) {
        try {
            const doc = this.db.getAIDocumentById(documentId);
            
            if (!doc) {
                return { success: false, error: 'Document introuvable' };
            }

            return await filePreviewService.prepareDownload(doc.filepath);

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Statistiques étendues incluant réseau
     */
    async getExtendedStatistics() {
        const baseStats = await this.getStatistics();
        const networkStats = networkDocumentService.getStats();
        const cacheStats = await filePreviewService.getCacheStats();

        return {
            ...baseStats,
            network: networkStats,
            cache: cacheStats
        };
    }

    // ==================== NOUVELLES FONCTIONS RECHERCHE RÉSEAU ====================

    /**
     * Recherche spécialisée dans les documents réseau avec enrichissement intelligent
     * Combine recherche vectorielle et filtres réseau pour des résultats optimisés
     */
    async searchNetworkDocuments(query, options = {}) {
        try {
            console.log(`🔍 Recherche réseau pour: "${query}"`);
            
            // Recherche vectorielle optimisée pour les documents réseau
            const searchOptions = {
                limit: options.limit || 20,
                threshold: options.threshold || 0.3,
                filters: {
                    ...options.filters,
                    hasNetworkPath: true // Filtrer uniquement les documents réseau
                }
            };

            const vectorResults = vectorSearchService.search(query, searchOptions);

            // Enrichir avec métadonnées réseau spécifiques
            const networkEnrichedResults = vectorResults.map(result => {
                const doc = this.db.getAIDocumentById(result.documentId);
                return {
                    ...result,
                    document: doc ? {
                        ...doc,
                        isNetworkDocument: !!doc.filepath,
                        networkPath: doc.filepath,
                        relativeNetworkPath: doc.relativePath,
                        networkCategory: doc.category,
                        networkTags: doc.tags ? JSON.parse(doc.tags) : [],
                        lastModified: doc.modified_date,
                        accessibility: this._getNetworkDocumentAccessibility(doc)
                    } : null,
                    networkContext: this._buildNetworkContext(doc),
                    relevanceScore: result.score,
                    snippet: this._generateRelevantSnippet(doc?.content, query),
                    highlightedContent: this._highlightSearchTerms(doc?.content, query)
                };
            });

            // Filtrer et scorer les résultats réseau
            const scoredResults = networkEnrichedResults
                .filter(result => result.document?.isNetworkDocument)
                .sort((a, b) => b.relevanceScore - a.relevanceScore)
                .slice(0, searchOptions.limit);

            // Générer statistiques de recherche réseau
            const searchStats = this._generateNetworkSearchStats(scoredResults, query);

            console.log(`✅ ${scoredResults.length} documents réseau trouvés pour: "${query}"`);

            return {
                success: true,
                query: query,
                results: scoredResults,
                total: scoredResults.length,
                statistics: searchStats,
                searchMetadata: {
                    performedAt: new Date().toISOString(),
                    searchType: 'network_vector_search',
                    optionsUsed: searchOptions,
                    networkDocumentsOnly: true
                }
            };

        } catch (error) {
            console.error('❌ Erreur recherche réseau:', error);
            return {
                success: false,
                error: error.message,
                results: [],
                query: query
            };
        }
    }

    /**
     * Récupère le contexte complet d'un document réseau pour enrichissement de réponse
     * Inclut métadonnées, contenu pertinent, et liens vers documents similaires
     */
    async getDocumentContext(fileId, contextType = 'full') {
        try {
            console.log(`📄 Récupération contexte document: ${fileId}`);

            const doc = this.db.getAIDocumentById(fileId);
            
            if (!doc) {
                return { success: false, error: 'Document introuvable' };
            }

            if (!doc.filepath) {
                return { success: false, error: 'Ce document n\'est pas un document réseau' };
            }

            // Contexte de base
            const baseContext = {
                document: {
                    id: doc.id,
                    filename: doc.filename,
                    networkPath: doc.filepath,
                    relativePath: doc.relativePath,
                    fileType: doc.file_type,
                    size: doc.size,
                    sizeFormatted: documentMetadataService.formatFileSize(doc.size),
                    lastModified: doc.modified_date,
                    language: doc.language,
                    category: doc.category,
                    type: doc.document_type,
                    tags: doc.tags ? JSON.parse(doc.tags) : [],
                    qualityScore: doc.quality_score,
                    wordCount: doc.word_count
                },
                networkMetadata: {
                    isNetworkDocument: true,
                    accessibility: this._getNetworkDocumentAccessibility(doc),
                    directory: doc.relativePath ? doc.relativePath.split('/').slice(0, -1).join('/') : '',
                    parentDirectory: this._getParentDirectory(doc.filepath),
                    siblings: await this._getNetworkDocumentSiblings(doc),
                    relatedDocuments: await this._getNetworkRelatedDocuments(doc),
                    documentHistory: await this._getNetworkDocumentHistory(doc)
                }
            };

            // Contexte étendu selon le type demandé
            let extendedContext = {};

            switch (contextType) {
                case 'content':
                    extendedContext = {
                        content: {
                            fullText: doc.content,
                            wordCount: doc.word_count,
                            language: doc.language,
                            readabilityScore: documentMetadataService.calculateReadabilityScore(doc.content),
                            keyPhrases: this._extractKeyPhrases(doc.content),
                            summary: await this._generateDocumentSummary(doc.content)
                        }
                    };
                    break;

                case 'search':
                    extendedContext = {
                        searchContext: {
                            searchOptimizedContent: this._optimizeContentForSearch(doc.content),
                            searchableMetadata: {
                                filename: doc.filename,
                                category: doc.category,
                                tags: doc.tags ? JSON.parse(doc.tags) : [],
                                language: doc.language
                            },
                            networkSearchHints: this._generateNetworkSearchHints(doc)
                        }
                    };
                    break;

                case 'preview':
                    extendedContext = {
                        previewContext: {
                            canGeneratePreview: true,
                            previewReady: false,
                            thumbnailPath: null,
                            firstPages: this._extractPreviewContent(doc.content),
                            metadataForPreview: {
                                title: doc.filename,
                                author: doc.author || 'Inconnu',
                                subject: doc.category,
                                keywords: doc.tags ? JSON.parse(doc.tags) : []
                            }
                        }
                    };
                    break;

                case 'full':
                default:
                    // Récupérer tous les contextes
                    extendedContext = {
                        content: {
                            fullText: doc.content,
                            wordCount: doc.word_count,
                            language: doc.language,
                            readabilityScore: documentMetadataService.calculateReadabilityScore(doc.content),
                            keyPhrases: this._extractKeyPhrases(doc.content),
                            summary: await this._generateDocumentSummary(doc.content)
                        },
                        searchContext: {
                            searchOptimizedContent: this._optimizeContentForSearch(doc.content),
                            searchableMetadata: {
                                filename: doc.filename,
                                category: doc.category,
                                tags: doc.tags ? JSON.parse(doc.tags) : [],
                                language: doc.language
                            },
                            networkSearchHints: this._generateNetworkSearchHints(doc)
                        },
                        previewContext: {
                            canGeneratePreview: true,
                            previewReady: false,
                            thumbnailPath: null,
                            firstPages: this._extractPreviewContent(doc.content),
                            metadataForPreview: {
                                title: doc.filename,
                                author: doc.author || 'Inconnu',
                                subject: doc.category,
                                keywords: doc.tags ? JSON.parse(doc.tags) : []
                            }
                        }
                    };
                    break;
            }

            // Statistiques d'utilisation
            const usageStats = await this._getDocumentUsageStats(doc.id);

            const completeContext = {
                ...baseContext,
                ...extendedContext,
                usage: usageStats,
                contextGenerated: new Date().toISOString(),
                contextType: contextType
            };

            console.log(`✅ Contexte document récupéré: ${doc.filename} (${contextType})`);

            return {
                success: true,
                context: completeContext,
                metadata: {
                    documentId: doc.id,
                    contextType: contextType,
                    generatedAt: new Date().toISOString(),
                    networkPath: doc.filepath
                }
            };

        } catch (error) {
            console.error('❌ Erreur récupération contexte:', error);
            return {
                success: false,
                error: error.message,
                documentId: fileId
            };
        }
    }

    /**
     * Enrichit une réponse avec des citations et références aux documents réseau trouvés
     * Intègre avec intelligentResponseService pour une amélioration optimale
     */
    async enhanceResponseWithDocuments(response, query, searchResults = null) {
        try {
            console.log(`📝 Enrichissement réponse avec documents réseau pour: "${query}"`);

            let documentResults = searchResults;

            // Si pas de résultats fournis, faire une recherche
            if (!documentResults) {
                const searchResult = await this.searchNetworkDocuments(query, { limit: 10 });
                documentResults = searchResult.success ? searchResult.results : [];
            }

            if (!documentResults || documentResults.length === 0) {
                console.log('ℹ️ Aucun document réseau trouvé pour enrichir la réponse');
                return {
                    enhancedResponse: response,
                    enhancement: {
                        applied: false,
                        reason: 'no_documents_found',
                        documentsUsed: 0
                    }
                };
            }

            // Préparer les sources de documents réseau
            const documentSources = documentResults.slice(0, 5).map((result, index) => {
                const doc = result.document;
                return {
                    id: doc.id,
                    rank: index + 1,
                    filename: doc.filename,
                    networkPath: doc.networkPath,
                    relativePath: doc.relativeNetworkPath,
                    relevanceScore: result.relevanceScore,
                    category: doc.networkCategory,
                    tags: doc.networkTags,
                    sizeFormatted: doc.sizeFormatted,
                    lastModified: doc.lastModified,
                    snippet: result.snippet,
                    highlightedContent: result.highlightedContent,
                    accessibility: doc.accessibility
                };
            });

            // Créer les citations formatées
            const citations = this._formatNetworkDocumentCitations(documentSources);

            // Générer les références enrichies
            const references = this._generateNetworkDocumentReferences(documentSources);

            // Construire les métadonnées d'enrichissement
            const enhancementMetadata = {
                documentsFound: documentResults.length,
                documentsUsed: documentSources.length,
                averageRelevanceScore: documentSources.reduce((sum, src) => sum + src.relevanceScore, 0) / documentSources.length,
                queryMatch: this._analyzeQueryMatch(query, documentSources),
                networkPathStats: this._analyzeNetworkPaths(documentSources),
                categoriesFound: [...new Set(documentSources.map(src => src.category))].filter(Boolean),
                totalNetworkSize: documentSources.reduce((sum, src) => sum + (src.size || 0), 0),
                enhancementTimestamp: new Date().toISOString()
            };

            // Enrichir la réponse avec intelligentResponseService
            let enhancedResponse = response;
            let intelligentEnhancement = null;

            try {
                // Utiliser intelligentResponseService pour un enrichissement optimal
                if (intelligentResponseService && typeof intelligentResponseService.enhanceWithDocuments === 'function') {
                    intelligentEnhancement = intelligentResponseService.enhanceWithDocuments(
                        response,
                        documentSources,
                        {
                            includeCitations: true,
                            includeReferences: true,
                            citationStyle: 'academic',
                            maxCitations: 5,
                            includeNetworkPaths: true,
                            enhanceWithSnippets: true
                        }
                    );

                    if (intelligentEnhancement && intelligentEnhancement.enhancedResponse) {
                        enhancedResponse = intelligentEnhancement.enhancedResponse;
                    }
                } else {
                    // Fallback: enrichissement manuel
                    enhancedResponse = this._manuallyEnhanceResponse(
                        response,
                        documentSources,
                        citations,
                        references
                    );
                }
            } catch (enhancementError) {
                console.warn('⚠️ Erreur enrichissement intelligent, utilisation fallback:', enhancementError.message);
                enhancedResponse = this._manuallyEnhanceResponse(
                    response,
                    documentSources,
                    citations,
                    references
                );
            }

            // Préparer les suggestions de navigation réseau
            const navigationSuggestions = this._generateNetworkNavigationSuggestions(documentSources, query);

            // Statistiques d'enrichissement
            const enhancementStats = {
                originalResponseLength: response.length,
                enhancedResponseLength: enhancedResponse.length,
                lengthIncrease: enhancedResponse.length - response.length,
                documentsIntegrated: documentSources.length,
                citationsAdded: citations.length,
                referencesAdded: references.length,
                navigationSuggestions: navigationSuggestions.length
            };

            console.log(`✅ Réponse enrichie avec ${documentSources.length} documents réseau`);

            return {
                enhancedResponse: enhancedResponse,
                enhancement: {
                    applied: true,
                    method: intelligentEnhancement ? 'intelligent_service' : 'manual',
                    documentsUsed: documentSources.length,
                    citations: citations,
                    references: references,
                    navigationSuggestions: navigationSuggestions,
                    metadata: enhancementMetadata,
                    statistics: enhancementStats
                },
                searchContext: {
                    query: query,
                    resultsCount: documentResults.length,
                    averageRelevanceScore: enhancementMetadata.averageRelevanceScore
                }
            };

        } catch (error) {
            console.error('❌ Erreur enrichissement réponse:', error);
            return {
                enhancedResponse: response,
                enhancement: {
                    applied: false,
                    error: error.message,
                    documentsUsed: 0
                }
            };
        }
    }

    // ==================== MÉTHODES PRIVÉES D'ASSISTANCE ====================

    /**
     * Détermine l'accessibilité d'un document réseau
     */
    _getNetworkDocumentAccessibility(doc) {
        if (!doc.filepath) return 'local';
        
        const path = doc.filepath.toLowerCase();
        if (path.includes('public') || path.includes('shared')) return 'public';
        if (path.includes('private') || path.includes('restricted')) return 'restricted';
        return 'network';
    }

    /**
     * Construit le contexte réseau d'un document
     */
    _buildNetworkContext(doc) {
        if (!doc.filepath) return null;

        const pathParts = doc.filepath.split(/[\\/]/);
        const relativePathParts = doc.relativePath ? doc.relativePath.split('/') : [];

        return {
            fullPath: doc.filepath,
            relativePath: doc.relativePath,
            directory: pathParts[pathParts.length - 2] || '',
            parentDirectories: pathParts.slice(0, -1),
            depth: relativePathParts.length,
            isRootDocument: relativePathParts.length <= 1,
            networkRoot: this._detectNetworkRoot(doc.filepath)
        };
    }

    /**
     * Génère un extrait pertinent basé sur la requête
     */
    _generateRelevantSnippet(content, query, maxLength = 200) {
        if (!content) return '';

        const queryWords = query.toLowerCase().split(/\s+/);
        const contentLower = content.toLowerCase();

        let bestIndex = -1;
        let bestScore = 0;

        // Chercher le meilleur passage contenant les mots-clés
        for (const word of queryWords) {
            const index = contentLower.indexOf(word);
            if (index !== -1 && index < bestIndex || bestIndex === -1) {
                bestIndex = index;
                bestScore = queryWords.length;
            }
        }

        if (bestIndex === -1) {
            // Retourner le début si aucune correspondance exacte
            return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
        }

        // Extraire le contexte autour de la correspondance
        const start = Math.max(0, bestIndex - 50);
        const end = Math.min(content.length, bestIndex + maxLength);
        let snippet = content.substring(start, end);

        if (start > 0) snippet = '...' + snippet;
        if (end < content.length) snippet = snippet + '...';

        return snippet;
    }

    /**
     * Surligne les termes de recherche dans le contenu
     */
    _highlightSearchTerms(content, query) {
        if (!content || !query) return content;

        const queryWords = query.split(/\s+/).filter(word => word.length > 2);
        let highlightedContent = content;

        queryWords.forEach(word => {
            const regex = new RegExp(`(${word})`, 'gi');
            highlightedContent = highlightedContent.replace(regex, '**$1**');
        });

        return highlightedContent;
    }

    /**
     * Génère des statistiques pour la recherche réseau
     */
    _generateNetworkSearchStats(results, query) {
        const categories = {};
        const fileTypes = {};
        let totalSize = 0;
        let avgRelevance = 0;

        results.forEach(result => {
            const doc = result.document;
            if (doc) {
                // Statistiques par catégorie
                const category = doc.networkCategory || 'Non classé';
                categories[category] = (categories[category] || 0) + 1;

                // Statistiques par type de fichier
                const fileType = doc.fileType || 'inconnu';
                fileTypes[fileType] = (fileTypes[fileType] || 0) + 1;

                // Taille totale
                totalSize += doc.size || 0;

                // Score de pertinence moyen
                avgRelevance += result.relevanceScore || 0;
            }
        });

        return {
            totalResults: results.length,
            categoriesDistribution: categories,
            fileTypesDistribution: fileTypes,
            totalNetworkSize: totalSize,
            averageRelevanceScore: results.length > 0 ? avgRelevance / results.length : 0,
            queryLength: query.length,
            searchPerformance: {
                resultsPerSecond: results.length, // Métrique simplifiée
                memoryEfficient: totalSize < 1000000 // Moins de 1MB
            }
        };
    }

    /**
     * Extrait les phrases clés d'un document
     */
    _extractKeyPhrases(content, maxPhrases = 5) {
        if (!content) return [];

        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
        const phrases = [];

        for (const sentence of sentences) {
            const words = sentence.trim().split(/\s+/);
            if (words.length >= 3 && words.length <= 15) {
                phrases.push({
                    text: sentence.trim(),
                    wordCount: words.length,
                    relevance: Math.min(1, words.length / 10)
                });
            }
        }

        return phrases
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, maxPhrases)
            .map(p => p.text);
    }

    /**
     * Génère un résumé de document
     */
    async _generateDocumentSummary(content, maxSentences = 3) {
        if (!content) return '';

        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
        const summarySentences = sentences.slice(0, maxSentences);
        
        return summarySentences.join('. ') + '.';
    }

    /**
     * Optimise le contenu pour la recherche
     */
    _optimizeContentForSearch(content) {
        if (!content) return '';

        return content
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }

    /**
     * Génère des conseils de recherche réseau
     */
    _generateNetworkSearchHints(doc) {
        const hints = [];

        if (doc.category) {
            hints.push(`Catégorie: ${doc.category}`);
        }

        if (doc.tags) {
            const tags = doc.tags ? JSON.parse(doc.tags) : [];
            if (tags.length > 0) {
                hints.push(`Mots-clés: ${tags.slice(0, 3).join(', ')}`);
            }
        }

        if (doc.relativePath) {
            hints.push(`Localisation: ${doc.relativePath}`);
        }

        return hints;
    }

    /**
     * Extrait le contenu pour prévisualisation
     */
    _extractPreviewContent(content, maxChars = 500) {
        if (!content) return '';
        return content.substring(0, maxChars) + (content.length > maxChars ? '...' : '');
    }

    /**
     * Obtient les statistiques d'utilisation d'un document
     */
    async _getDocumentUsageStats(documentId) {
        // Simulation - à remplacer par de vraies statistiques d'utilisation
        return {
            viewCount: Math.floor(Math.random() * 100),
            lastAccessed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            popularityScore: Math.random()
        };
    }

    /**
     * Formate les citations de documents réseau
     */
    _formatNetworkDocumentCitations(sources) {
        return sources.map((source, index) => ({
            id: index + 1,
            reference: `${source.rank}. ${source.filename} [${source.category}] (${source.relativePath})`,
            url: source.networkPath,
            relevanceScore: Math.round(source.relevanceScore * 100) / 100,
            metadata: {
                size: source.sizeFormatted,
                modified: source.lastModified,
                accessibility: source.accessibility
            }
        }));
    }

    /**
     * Génère les références de documents réseau
     */
    _generateNetworkDocumentReferences(sources) {
        return sources.map(source => ({
            id: source.id,
            title: source.filename,
            type: 'network_document',
            location: {
                path: source.networkPath,
                relativePath: source.relativePath,
                category: source.category
            },
            description: `Document réseau - ${source.category}`,
            relevance: source.relevanceScore,
            lastModified: source.lastModified,
            tags: source.tags
        }));
    }

    /**
     * Enrichit manuellement la réponse (fallback)
     */
    _manuallyEnhanceResponse(response, sources, citations, references) {
        let enhanced = response;

        // Ajouter une section sources
        if (sources.length > 0) {
            enhanced += '\n\n**Sources de documents réseau:**\n\n';
            
            sources.slice(0, 3).forEach(source => {
                enhanced += `• [${source.filename}](${source.networkPath}) - ${source.category} (Score: ${Math.round(source.relevanceScore * 100)}%)\n`;
                if (source.snippet) {
                    enhanced += `  > ${source.snippet}\n`;
                }
                enhanced += '\n';
            });
        }

        return enhanced;
    }

    /**
     * Génère des suggestions de navigation réseau
     */
    _generateNetworkNavigationSuggestions(sources, query) {
        const suggestions = [];

        // Suggestions basées sur les catégories trouvées
        const categories = [...new Set(sources.map(s => s.category).filter(Boolean))];
        categories.forEach(category => {
            suggestions.push({
                type: 'category_filter',
                label: `Explorer la catégorie "${category}"`,
                action: `search?category=${encodeURIComponent(category)}`,
                relevance: 'high'
            });
        });

        // Suggestions basées sur les répertoires
        const directories = [...new Set(sources.map(s => {
            const pathParts = s.relativePath?.split('/') || [];
            return pathParts.slice(0, -1).join('/');
        }).filter(Boolean))];

        directories.forEach(dir => {
            suggestions.push({
                type: 'directory_navigation',
                label: `Parcourir ${dir}`,
                action: `browse?path=${encodeURIComponent(dir)}`,
                relevance: 'medium'
            });
        });

        return suggestions;
    }

    /**
     * Analyse la correspondance avec la requête
     */
    _analyzeQueryMatch(query, sources) {
        const queryWords = query.toLowerCase().split(/\s+/);
        const matches = [];

        sources.forEach(source => {
            const sourceText = `${source.filename} ${source.category} ${source.tags.join(' ')}`.toLowerCase();
            const matchedWords = queryWords.filter(word => sourceText.includes(word));
            
            matches.push({
                documentId: source.id,
                matchedWords: matchedWords.length,
                totalWords: queryWords.length,
                matchRatio: matchedWords.length / queryWords.length
            });
        });

        return {
            averageMatchRatio: matches.reduce((sum, m) => sum + m.matchRatio, 0) / matches.length,
            totalMatches: matches.reduce((sum, m) => sum + m.matchedWords, 0),
            perfectMatches: matches.filter(m => m.matchRatio === 1).length
        };
    }

    /**
     * Analyse les chemins réseau
     */
    _analyzeNetworkPaths(sources) {
        const paths = sources.map(s => s.relativePath).filter(Boolean);
        const commonPrefixes = this._findCommonPrefixes(paths);
        
        return {
            totalPaths: paths.length,
            uniqueDirectories: new Set(paths.map(p => p.split('/').slice(0, -1).join('/'))).size,
            commonPrefixes: commonPrefixes,
            deepestPath: Math.max(...paths.map(p => p.split('/').length)),
            shallowestPath: Math.min(...paths.map(p => p.split('/').length))
        };
    }

    /**
     * Trouve les préfixes communs
     */
    _findCommonPrefixes(paths) {
        if (paths.length === 0) return [];
        
        const prefixes = [];
        const firstPath = paths[0].split('/');
        
        for (let i = 1; i < firstPath.length; i++) {
            const prefix = firstPath.slice(0, i).join('/');
            if (paths.every(p => p.startsWith(prefix))) {
                prefixes.push(prefix);
            }
        }
        
        return prefixes;
    }

    /**
     * Détecte la racine réseau
     */
    _detectNetworkRoot(filepath) {
        const parts = filepath.split(/[\\/]/);
        return parts[0] + (parts.length > 1 ? '/' : '');
    }

    /**
     * Obtient le répertoire parent
     */
    _getParentDirectory(filepath) {
        const parts = filepath.split(/[\\/]/);
        return parts.length > 1 ? parts.slice(0, -1).join('/') : '';
    }

    /**
     * Obtient les documents frères (même répertoire)
     */
    async _getNetworkDocumentSiblings(doc) {
        if (!doc.relativePath) return [];
        
        const parentDir = this._getParentDirectory(doc.filepath);
        const siblings = this.db.getAIDocumentsByDirectory(parentDir)
            .filter(sibling => sibling.id !== doc.id)
            .slice(0, 5);
            
        return siblings.map(sibling => ({
            id: sibling.id,
            filename: sibling.filename,
            category: sibling.category
        }));
    }

    /**
     * Obtient les documents liés (même catégorie)
     */
    async _getNetworkRelatedDocuments(doc) {
        if (!doc.category) return [];
        
        const related = this.db.getAIDocumentsByCategory(doc.category)
            .filter(relatedDoc => relatedDoc.id !== doc.id)
            .slice(0, 5);
            
        return related.map(relatedDoc => ({
            id: relatedDoc.id,
            filename: relatedDoc.filename,
            relevance: Math.random() // À calculer avec similarité vectorielle
        }));
    }

    /**
     * Obtient l'historique réseau du document
     */
    async _getNetworkDocumentHistory(doc) {
        // Simulation - à remplacer par vraie historique de modifications
        return {
            created: doc.created_at,
            lastModified: doc.modified_date,
            version: 1,
            modifications: []
        };
    }

    // ==================== NOUVELLES FONCTIONNALITÉS OCR ====================

    /**
     * Initialise le service OCR EasyOCR
     */
    async initializeOCR() {
        try {
            console.log('🔧 Initialisation du service OCR EasyOCR...');
            
            const result = await ocrService.initialize();
            
            if (result.success) {
                console.log('✅ Service OCR EasyOCR initialisé avec succès');
                
                // Notifier via WebSocket
                return {
                    success: true,
                    message: 'Service OCR EasyOCR initialisé',
                    supportedLanguages: result.supportedLanguages,
                    defaultLanguages: result.defaultLanguages
                };
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('❌ Erreur initialisation OCR:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Extrait le texte d'une image via OCR
     */
    async extractTextFromImage(imageFile, options = {}) {
        try {
            console.log(`🔍 OCR sur image: ${imageFile.filename || imageFile.originalname || 'buffer'}`);

            const {
                languages = null, // Utilisera la détection auto si null
                enhanceImage = true,
                confidenceThreshold = 0.5,
                includeBoundingBoxes = false,
                autoDetectLanguage = true
            } = options;

            let ocrResult;
            
            // Si c'est un fichier uploadé (multer)
            if (imageFile.buffer) {
                // Détection automatique de langue si demandée
                let finalLanguages = languages;
                if (autoDetectLanguage && !languages) {
                    const languageDetection = await ocrService.detectImageLanguage(imageFile.buffer);
                    if (languageDetection.success) {
                        finalLanguages = [languageDetection.language];
                        console.log(`🌍 Langue détectée automatiquement: ${languageDetection.language}`);
                    }
                }

                ocrResult = await ocrService.extractTextFromImageBuffer(imageFile.buffer, {
                    languages: finalLanguages || ['fr', 'en'], // Fallback
                    enhanceImage,
                    confidenceThreshold,
                    includeBoundingBoxes
                });
            } else if (typeof imageFile === 'string') {
                // Chemin de fichier
                ocrResult = await ocrService.extractTextFromImageFile(imageFile, {
                    languages: languages || ['fr', 'en'],
                    enhanceImage,
                    confidenceThreshold,
                    includeBoundingBoxes
                });
            } else {
                throw new Error('Format de fichier non supporté pour l\'OCR');
            }

            if (!ocrResult.success) {
                return {
                    success: false,
                    error: ocrResult.error,
                    extractedText: ''
                };
            }

            // Nettoyer le texte extrait
            const cleanedText = ocrService.cleanExtractedText(ocrResult.text);

            // Détecter la langue si pas fait automatiquement
            let detectedLanguage = null;
            if (autoDetectLanguage && !languages) {
                const langDetection = await ocrService.detectImageLanguage(
                    imageFile.buffer || await fs.readFile(imageFile)
                );
                if (langDetection.success) {
                    detectedLanguage = langDetection.language;
                }
            }

            console.log(`✅ OCR terminé: ${cleanedText.length} caractères extraits`);

            return {
                success: true,
                extractedText: cleanedText,
                metadata: {
                    ...ocrResult.metadata,
                    detectedLanguage: detectedLanguage,
                    originalLanguages: languages,
                    autoLanguageDetection: autoDetectLanguage && !languages,
                    enhancement: enhanceImage,
                    boundingBoxes: includeBoundingBoxes ? ocrResult.boundingBoxes : null
                },
                confidence: ocrResult.metadata.confidence,
                wordsCount: ocrResult.metadata.wordsCount,
                linesCount: ocrResult.metadata.linesCount
            };

        } catch (error) {
            console.error('❌ Erreur OCR:', error);
            return {
                success: false,
                error: error.message,
                extractedText: ''
            };
        }
    }

    /**
     * Traite un fichier image et l'indexe comme document
     */
    async processImageDocument(imageFile, options = {}) {
        try {
            console.log(`📄 Traitement document image: ${imageFile.filename || imageFile.originalname}`);

            // Extraire le texte via OCR
            const ocrResult = await this.extractTextFromImage(imageFile, options);

            if (!ocrResult.success) {
                return {
                    success: false,
                    error: `Échec OCR: ${ocrResult.error}`
                };
            }

            if (!ocrResult.extractedText || ocrResult.extractedText.length < 10) {
                return {
                    success: false,
                    error: 'Aucun texte significatif extrait de l\'image'
                };
            }

            // Préparer les métadonnées du document
            const metadata = {
                source: 'ocr',
                ocr: {
                    confidence: ocrResult.confidence,
                    wordsCount: ocrResult.wordsCount,
                    linesCount: ocrResult.linesCount,
                    detectedLanguage: ocrResult.metadata.detectedLanguage,
                    processingOptions: options
                },
                originalImage: {
                    filename: imageFile.filename || imageFile.originalname,
                    size: imageFile.size || imageFile.buffer?.length || 0,
                    mimetype: imageFile.mimetype || imageFile.type || 'image/jpeg'
                },
                wordCount: ocrResult.extractedText.split(/\s+/).length,
                parseMethod: 'ocr_easyocr'
            };

            // Sauvegarder en DB comme document IA
            const documentId = this.db.createAIDocument({
                filename: imageFile.filename || imageFile.originalname,
                file_type: 'ocr-image',
                file_size: imageFile.size || imageFile.buffer?.length || 0,
                content: ocrResult.extractedText,
                metadata: JSON.stringify(metadata),
                language: ocrResult.metadata.detectedLanguage || 'unknown'
            });

            // Créer les chunks
            const chunks = documentParserService.chunkText(ocrResult.extractedText);
            
            chunks.forEach((chunk, index) => {
                this.db.createAIDocumentChunk({
                    document_id: documentId,
                    chunk_text: chunk.text,
                    chunk_position: chunk.position,
                    word_count: chunk.wordCount
                });
            });

            // Indexer dans le moteur de recherche vectorielle
            vectorSearchService.indexDocument(
                documentId,
                ocrResult.extractedText,
                {
                    filename: imageFile.filename || imageFile.originalname,
                    fileType: 'ocr-image',
                    language: ocrResult.metadata.detectedLanguage || 'unknown',
                    source: 'ocr',
                    confidence: ocrResult.confidence,
                    extractedAt: new Date().toISOString()
                }
            );

            this.stats.totalDocuments++;

            console.log(`✅ Document image OCR indexé: ${documentId}`);

            return {
                success: true,
                documentId: documentId,
                filename: imageFile.filename || imageFile.originalname,
                extractedText: ocrResult.extractedText,
                language: ocrResult.metadata.detectedLanguage || 'unknown',
                confidence: ocrResult.confidence,
                wordCount: ocrResult.extractedText.split(/\s+/).length,
                chunksCount: chunks.length,
                metadata: metadata
            };

        } catch (error) {
            console.error('❌ Erreur traitement document image:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Traite plusieurs images en lot
     */
    async batchProcessImages(imageFiles, options = {}) {
        try {
            console.log(`🔄 Traitement lot de ${imageFiles.length} images...`);

            const {
                languages = null,
                enhanceImage = true,
                confidenceThreshold = 0.5,
                autoIndexAsDocuments = false,
                maxConcurrent = 3
            } = options;

            // Initialiser le service OCR si pas déjà fait
            if (!ocrService.initialized) {
                await this.initializeOCR();
            }

            // Traitement en lot
            const batchResult = await ocrService.batchProcessImages(imageFiles, {
                languages: languages || ['fr', 'en'],
                enhanceImage,
                confidenceThreshold,
                includeBoundingBoxes: false,
                maxConcurrent
            });

            if (!batchResult.success) {
                return {
                    success: false,
                    error: batchResult.error
                };
            }

            // Indexer les résultats si demandé
            if (autoIndexAsDocuments) {
                const indexedDocuments = [];
                const failedIndexing = [];

                for (let i = 0; i < batchResult.results.length; i++) {
                    const result = batchResult.results[i];
                    
                    if (result.success && result.text && result.text.length >= 10) {
                        try {
                            const docResult = await this.processImageDocument(
                                imageFiles[i],
                                { languages, enhanceImage, confidenceThreshold }
                            );
                            
                            if (docResult.success) {
                                indexedDocuments.push(docResult);
                            } else {
                                failedIndexing.push({
                                    index: i,
                                    error: docResult.error,
                                    originalResult: result
                                });
                            }
                        } catch (error) {
                            failedIndexing.push({
                                index: i,
                                error: error.message,
                                originalResult: result
                            });
                        }
                    }
                }

                batchResult.indexedDocuments = indexedDocuments;
                batchResult.failedIndexing = failedIndexing;
            }

            console.log(`✅ Traitement lot OCR terminé: ${batchResult.summary.successful} réussies`);

            return {
                success: true,
                ...batchResult,
                processingOptions: options
            };

        } catch (error) {
            console.error('❌ Erreur traitement lot images:', error);
            return {
                success: false,
                error: error.message,
                results: []
            };
        }
    }

    /**
     * Obtient les informations du service OCR
     */
    getOCRServiceInfo() {
        return ocrService.getServiceInfo();
    }

    /**
     * Nettoie les ressources OCR
     */
    async cleanupOCR() {
        try {
            const result = await ocrService.cleanup();

            if (result.success) {
                console.log('🧹 Service OCR nettoyé');
            }

            return result;
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Détermine si une question nécessite une recherche documentaire
     * ou si c'est une conversation générale
     * @param {string} message - Le message de l'utilisateur
     * @returns {boolean} true si nécessite recherche documentaire, false sinon
     */
    _needsDocumentSearch(message) {
        const lowerMessage = message.toLowerCase().trim();

        // Mots-clés conversationnels qui n'ont PAS besoin de documents
        const conversationalPatterns = [
            // Salutations
            /^(salut|bonjour|bonsoir|hello|hi|hey|coucou)/,
            /^(ça va|comment vas-tu|comment allez-vous|tu vas bien)/,
            /^(merci|d'accord|ok|oui|non|peut-être)/,

            // Questions personnelles/générales
            /^(qui es-tu|qu'est-ce que tu (es|peux faire)|que peux-tu faire)/,
            /^(comment tu t'appelles|quel est ton nom)/,

            // Questions hors contexte documentaire
            /météo|temps qu'il fait/,
            /actualité|actualités|news/,
            /heure|quelle heure/,
            /^(aide|help)$/,

            // Confirmations simples
            /^(d'accord|compris|je vois|ah|oh|mm|hmm)$/
        ];

        // Si le message correspond à un pattern conversationnel
        for (const pattern of conversationalPatterns) {
            if (pattern.test(lowerMessage)) {
                return false; // Pas besoin de recherche documentaire
            }
        }

        // Mots-clés indiquant besoin de documents
        const documentKeywords = [
            'document', 'fichier', 'pdf', 'excel', 'word',
            'trouve', 'cherche', 'recherche', 'montre', 'affiche',
            'liste', 'quels', 'combien de',
            'contenu', 'texte', 'information',
            'offre', 'prix', 'facture', 'devis',
            'rapport', 'compte-rendu', 'procès-verbal',
            'dans le', 'dans les', 'parmi'
        ];

        // Si le message contient des mots-clés documentaires
        for (const keyword of documentKeywords) {
            if (lowerMessage.includes(keyword)) {
                return true; // Nécessite recherche documentaire
            }
        }

        // Détection de questions (souvent liées aux documents)
        const questionWords = ['quel', 'quelle', 'quels', 'quelles', 'comment', 'où', 'quand', 'pourquoi', 'qu\'est-ce'];
        const hasQuestionWord = questionWords.some(word => lowerMessage.includes(word));

        // Si c'est une question ET assez longue (>5 mots), probablement besoin de documents
        const wordCount = lowerMessage.split(/\s+/).length;
        if (hasQuestionWord && wordCount > 5) {
            return true; // Probablement besoin de documents
        }

        // Par défaut, pour les messages très courts (<3 mots), traiter comme conversationnel
        if (wordCount < 3) {
            return false;
        }

        // Par défaut, pour tout le reste, faire une recherche documentaire
        // (principe de précaution - mieux vaut chercher que ne pas chercher)
        return true;
    }
}


module.exports = AIService;
