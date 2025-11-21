/**
 * Gemini Multimodal Service - Chef d'orchestre IA ultra-intelligent
 * Gère texte, images, OCR, embeddings avec Google Gemini
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

class GeminiService {
    constructor() {
        this.genAI = null;
        this.config = null;
        this.initialized = false;
        this.models = {
            text: null,
            vision: null,
            embedding: null
        };
    }

    /**
     * Initialise le service Gemini avec la clé API
     */
    async initialize(apiKey, config = {}) {
        try {
            if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
                console.log('[GeminiService] ⚠️ Aucune clé API fournie (ou format invalide) - Mode désactivé');
                this.initialized = false;
                return { success: false, error: 'API Key manquante ou invalide' };
            }

            this.config = {
                models: {
                    text: config.models?.text || 'gemini-2.0-flash-exp',
                    vision: config.models?.vision || 'gemini-2.0-flash-exp',
                    embedding: config.models?.embedding || 'text-embedding-004'
                },
                temperature: config.temperature || 0.7,
                maxTokens: config.maxTokens || 8192,
                orchestrator: config.orchestrator || {
                    enabled: true,
                    autoDetectIntent: true,
                    useOCRForImages: true,
                    useEmbeddingForSearch: true,
                    enableDocumentActions: true
                }
            };

            this.genAI = new GoogleGenerativeAI(apiKey);

            // Initialiser les modèles
            this.models.text = this.genAI.getGenerativeModel({
                model: this.config.models.text,
                generationConfig: {
                    temperature: this.config.temperature,
                    maxOutputTokens: this.config.maxTokens
                }
            });

            this.models.vision = this.genAI.getGenerativeModel({
                model: this.config.models.vision,
                generationConfig: {
                    temperature: this.config.temperature,
                    maxOutputTokens: this.config.maxTokens
                }
            });

            // Note: embedding model doesn't use generationConfig
            this.models.embedding = this.genAI.getGenerativeModel({
                model: this.config.models.embedding
            });

            this.initialized = true;
            console.log('[GeminiService] ✅ Initialisé avec succès');
            console.log(`[GeminiService] 📝 Modèle texte: ${this.config.models.text}`);
            console.log(`[GeminiService] 🖼️  Modèle vision: ${this.config.models.vision}`);
            console.log(`[GeminiService] 🔍 Modèle embedding: ${this.config.models.embedding}`);

            return { success: true, models: this.config.models };
        } catch (error) {
            console.error('[GeminiService] ❌ Erreur initialisation:', error);
            this.initialized = false;
            return { success: false, error: error.message };
        }
    }

    /**
     * 🎭 CHEF D'ORCHESTRE - Décide automatiquement quelle méthode utiliser
     */
    async orchestrate(query, context = {}) {
        if (!this.initialized) {
            return {
                success: false,
                error: 'Gemini non initialisé. Configurez votre clé API.',
                fallback: true
            };
        }

        try {
            const {
                hasImages,
                hasDocuments,
                searchIntent,
                imageBuffers,
                documentContents,
                conversationHistory
            } = context;

            console.log('[GeminiService] 🎭 Chef d\'orchestre activé');
            console.log('[GeminiService] 📊 Contexte:', {
                hasImages: !!hasImages,
                hasDocuments: !!hasDocuments,
                searchIntent: !!searchIntent,
                historyLength: conversationHistory?.length || 0
            });

            // 🖼️ Images → Vision Multimodal
            if (hasImages && imageBuffers && imageBuffers.length > 0) {
                console.log('[GeminiService] 🖼️  Détection image → Mode Vision');
                return await this.analyzeImagesWithText(query, imageBuffers);
            }

            // 📄 Documents avec recherche → Embedding + Génération
            if (searchIntent && hasDocuments) {
                console.log('[GeminiService] 🔍 Recherche documentaire → Mode Embedding + RAG');
                return await this.searchAndGenerate(query, documentContents);
            }

            // 💬 Conversation normale → Texte simple
            console.log('[GeminiService] 💬 Question générale → Mode Texte');
            return await this.generateText(query, conversationHistory);

        } catch (error) {
            console.error('[GeminiService] ❌ Erreur orchestration:', error);
            return {
                success: false,
                error: error.message,
                fallback: true
            };
        }
    }

    /**
     * 📝 Génération de texte simple (questions générales)
     */
    async generateText(prompt, conversationHistory = []) {
        if (!this.initialized) {
            return { success: false, error: 'Service non initialisé' };
        }

        try {
            // Construire l'historique de conversation
            let fullPrompt = this.buildConversationContext(conversationHistory);
            fullPrompt += `\n\nQuestion actuelle: ${prompt}`;

            const result = await this.models.text.generateContent(fullPrompt);
            const response = result.response;
            const text = response.text();

            return {
                success: true,
                response: text,
                model: this.config.models.text,
                type: 'text',
                confidence: 0.9
            };
        } catch (error) {
            console.error('[GeminiService] Erreur génération texte:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 🖼️ Analyse d'images avec texte (multimodal)
     */
    async analyzeImagesWithText(textPrompt, imageBuffers) {
        if (!this.initialized) {
            return { success: false, error: 'Service non initialisé' };
        }

        try {
            const imageParts = imageBuffers.map(buffer => ({
                inlineData: {
                    data: buffer.toString('base64'),
                    mimeType: this.detectMimeType(buffer)
                }
            }));

            const prompt = `Tu es DocuCortex, assistant GED ultra-intelligent.

Analyse cette/ces image(s) et réponds à la question suivante:
${textPrompt}

Si l'image contient du texte (document scanné, facture, formulaire), extrais-le et structure l'information.
Si c'est un tableau Excel scanné, convertis-le en structure lisible.
Fournis une réponse claire, organisée et actionnable.`;

            const result = await this.models.vision.generateContent([prompt, ...imageParts]);
            const response = result.response;
            const text = response.text();

            return {
                success: true,
                response: text,
                model: this.config.models.vision,
                type: 'vision',
                confidence: 0.95,
                imagesAnalyzed: imageBuffers.length
            };
        } catch (error) {
            console.error('[GeminiService] Erreur analyse image:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 🔍 Recherche + génération (RAG - Retrieval Augmented Generation)
     */
    async searchAndGenerate(query, documentContents = []) {
        if (!this.initialized) {
            return { success: false, error: 'Service non initialisé' };
        }

        try {
            // Construire le contexte documentaire
            let contextPrompt = `Tu es DocuCortex, le chef d'orchestre ultra-intelligent de la GED.

**DOCUMENTS DISPONIBLES:**\n\n`;

            documentContents.forEach((doc, idx) => {
                contextPrompt += `[Document ${idx + 1}: ${doc.filename}]\n`;
                contextPrompt += `${doc.content.substring(0, 2000)}\n`;
                contextPrompt += `---\n\n`;
            });

            contextPrompt += `\n**QUESTION DE L'UTILISATEUR:**\n${query}\n\n`;
            contextPrompt += `**INSTRUCTIONS:**\n`;
            contextPrompt += `- Analyse les documents fournis ci-dessus\n`;
            contextPrompt += `- Réponds précisément à la question en citant les sources\n`;
            contextPrompt += `- Si possible, fournis des extraits pertinents\n`;
            contextPrompt += `- Suggère des actions (ouvrir document, voir répertoire, etc.)\n`;
            contextPrompt += `- Sois concis, clair et actionnable\n`;

            const result = await this.models.text.generateContent(contextPrompt);
            const response = result.response;
            const text = response.text();

            return {
                success: true,
                response: text,
                model: this.config.models.text,
                type: 'rag',
                confidence: 0.92,
                documentsUsed: documentContents.length,
                sources: documentContents.map(d => ({
                    filename: d.filename,
                    path: d.path
                }))
            };
        } catch (error) {
            console.error('[GeminiService] Erreur recherche+génération:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 📊 Génération d'embeddings pour recherche sémantique
     */
    async generateEmbedding(text) {
        if (!this.initialized) {
            return { success: false, error: 'Service non initialisé' };
        }

        try {
            const result = await this.models.embedding.embedContent(text);
            const embedding = result.embedding;

            return {
                success: true,
                embedding: embedding.values,
                dimensions: embedding.values.length
            };
        } catch (error) {
            console.error('[GeminiService] Erreur génération embedding:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 🎯 Détection d'intention (helper pour l'orchestrateur)
     */
    detectIntent(query) {
        const lowerQuery = query.toLowerCase();

        const intents = {
            search: ['cherche', 'trouve', 'recherche', 'où est', 'localise', 'search', 'find'],
            analyze: ['analyse', 'résume', 'explique', 'qu\'est-ce que', 'analyze', 'summarize'],
            general: ['météo', 'heure', 'calcul', 'weather', 'time', 'calculate'],
            document: ['ouvre', 'affiche', 'montre', 'voir', 'open', 'show', 'display']
        };

        for (const [intent, keywords] of Object.entries(intents)) {
            if (keywords.some(kw => lowerQuery.includes(kw))) {
                return intent;
            }
        }

        return 'general';
    }

    /**
     * Helper: Construire contexte de conversation
     */
    buildConversationContext(history = []) {
        if (!history || history.length === 0) {
            return `Tu es DocuCortex, l'assistant GED ultra-intelligent.

Tu es un chef d'orchestre qui:
- Aide à trouver et organiser des documents
- Répond aux questions générales avec clarté
- Propose des actions concrètes (ouvrir fichier, voir répertoire)
- Offre une expérience utilisateur moderne et ludique

Ton style: professionnel, précis, actionnable, avec touches d'emojis pertinents.`;
        }

        let context = `Historique de conversation:\n\n`;
        history.slice(-5).forEach(msg => {
            context += `${msg.type === 'user' ? 'Utilisateur' : 'DocuCortex'}: ${msg.content}\n`;
        });
        return context;
    }

    /**
     * Helper: Détecter MIME type depuis buffer
     */
    detectMimeType(buffer) {
        const signatures = {
            'ffd8ff': 'image/jpeg',
            '89504e47': 'image/png',
            '47494638': 'image/gif',
            '424d': 'image/bmp',
            '49492a00': 'image/tiff',
            '4d4d002a': 'image/tiff'
        };

        const hex = buffer.toString('hex', 0, 8);

        for (const [signature, mimeType] of Object.entries(signatures)) {
            if (hex.startsWith(signature)) {
                return mimeType;
            }
        }

        return 'image/jpeg'; // Default
    }

    /**
     * Vérifier l'état du service
     */
    getStatus() {
        return {
            initialized: this.initialized,
            models: this.initialized ? this.config.models : null,
            orchestrator: this.initialized ? this.config.orchestrator : null
        };
    }

    // === COMPATIBILITÉ AVEC L'ANCIEN CODE ===

    /**
     * Fonction de compatibilité: processConversation (ancien format)
     */
    async processConversation(messages, options = {}) {
        const lastMessage = messages[messages.length - 1];
        const prompt = lastMessage.content;
        const history = messages.slice(0, -1);

        return await this.generateText(prompt, history);
    }

    /**
     * Fonction de compatibilité: chatMultimodal (ancien format)
     */
    async chatMultimodal(parts, conversationId = null) {
        try {
            if (!this.initialized) {
                throw new Error('Service Gemini non initialisé');
            }

            const result = await this.models.vision.generateContent(parts);
            const response = result.response;
            const text = response.text();

            return {
                success: true,
                response: text,
                confidence: 95,
                conversationId: conversationId
            };
        } catch (error) {
            console.error('❌ Erreur chat multimodal:', error.message);
            throw error;
        }
    }

    /**
     * Test de connexion
     */
    async testConnection(apiKey, modelName) {
        try {
            const testAI = new GoogleGenerativeAI(apiKey || this.config?.apiKey);
            const testModel = testAI.getGenerativeModel({
                model: modelName || this.config?.models?.text || 'gemini-2.0-flash-exp'
            });
            const result = await testModel.generateContent('test');
            const response = result.response;
            const text = response.text();

            if (text) {
                return { success: true, message: 'Connexion à Gemini réussie.' };
            }
            return { success: false, error: 'Réponse invalide de Gemini.' };
        } catch (error) {
            console.error('❌ Erreur test connexion Gemini:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Statistiques
     */
    getStatistics() {
        return {
            provider: 'gemini',
            model: this.config?.models?.text,
            initialized: this.initialized,
            orchestrator: this.config?.orchestrator
        };
    }
}

// Export singleton
const geminiService = new GeminiService();

module.exports = geminiService;
