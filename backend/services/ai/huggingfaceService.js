/**
 * Service d'intégration Hugging Face pour DocuCortex
 * API Inference pour accéder aux modèles LLM sur Hugging Face
 * Documentation: https://huggingface.co/docs/api-inference/
 */

const axios = require('axios');

class HuggingFaceService {
    constructor() {
        this.baseUrl = 'https://api-inference.huggingface.co';
        this.apiKey = null;
        this.model = 'mistralai/Mistral-7B-Instruct-v0.2'; // Modèle par défaut (excellent en français)
        this.initialized = false;
        this.connectionStatus = {
            connected: false,
            lastCheck: null,
            responseTime: null
        };
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalTokens: 0,
            averageResponseTime: 0
        };
    }

    /**
     * Configure la clé API Hugging Face
     * @param {string} apiKey - Clé API Hugging Face (hf_...)
     */
    setApiKey(apiKey) {
        // Nettoyer les espaces et vérifier la validité
        const cleanedKey = apiKey ? apiKey.trim() : '';

        if (!cleanedKey || cleanedKey === 'STORED_IN_ENV_FILE' || !cleanedKey.startsWith('hf_')) {
            console.warn('⚠️ Format de clé API Hugging Face invalide (devrait commencer par hf_)');
            return false;
        }
        this.apiKey = cleanedKey;
        console.log('✅ Clé API Hugging Face configurée');
        return true;
    }

    /**
     * Configure le modèle à utiliser
     * @param {string} model - Nom du modèle (ex: mistralai/Mistral-7B-Instruct-v0.2)
     */
    setModel(model) {
        this.model = model;
        console.log(`✅ Modèle Hugging Face configuré: ${model}`);
    }

    /**
     * Initialise le service Hugging Face
     */
    async initialize(config = {}) {
        if (this.initialized) return { success: true };

        try {
            console.log('🔗 Initialisation du service Hugging Face...');

            // Configurer la clé API depuis la config
            if (config.apiKey) {
                this.setApiKey(config.apiKey);
            }

            // Configurer le modèle depuis la config
            if (config.model) {
                this.setModel(config.model);
            }

            if (!this.apiKey) {
                throw new Error('Clé API Hugging Face non configurée');
            }

            // Vérifier la connexion à Hugging Face
            await this.testConnection();

            this.initialized = true;
            console.log('✅ Service Hugging Face initialisé avec succès');

            return { success: true };
        } catch (error) {
            console.error('❌ Erreur initialisation Hugging Face:', error.message);
            return {
                success: false,
                error: error.message,
                connectionDetails: {
                    apiConfigured: !!this.apiKey,
                    url: this.baseUrl,
                    model: this.model
                }
            };
        }
    }

    /**
     * Teste la connexion à Hugging Face
     */
    async testConnection() {
        try {
            const startTime = Date.now();

            // Test simple avec un prompt minimal
            const response = await axios.post(
                `${this.baseUrl}/models/${this.model}`,
                {
                    inputs: 'Hello',
                    parameters: {
                        max_new_tokens: 10,
                        return_full_text: false
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000 // Hugging Face peut être lent au premier appel (chargement du modèle)
                }
            );

            const responseTime = Date.now() - startTime;

            this.connectionStatus = {
                connected: response.status === 200,
                lastCheck: new Date().toISOString(),
                responseTime: responseTime
            };

            console.log(`✅ Connexion Hugging Face OK (${responseTime}ms)`);
            return {
                success: true,
                connected: true,
                responseTime: responseTime,
                model: this.model
            };

        } catch (error) {
            this.connectionStatus = {
                connected: false,
                lastCheck: new Date().toISOString(),
                responseTime: null,
                error: error.message
            };

            // Si le modèle est en cours de chargement
            if (error.response?.status === 503) {
                console.log('⏳ Modèle Hugging Face en cours de chargement...');
                return {
                    success: true,
                    connected: true,
                    loading: true,
                    message: 'Modèle en cours de chargement'
                };
            }

            console.error('❌ Connexion Hugging Face échouée:', error.message);
            return {
                success: false,
                connected: false,
                error: error.message
            };
        }
    }

    /**
     * Génère une réponse avec Hugging Face
     * @param {string} prompt - Le prompt à envoyer
     * @param {Object} options - Options de génération
     */
    async generate(prompt, options = {}) {
        if (!this.initialized) {
            throw new Error('Service Hugging Face non initialisé');
        }

        const startTime = Date.now();
        this.stats.totalRequests++;

        try {
            const requestBody = {
                inputs: prompt,
                parameters: {
                    max_new_tokens: options.max_tokens || 2048,
                    temperature: options.temperature || 0.7,
                    top_p: options.top_p || 0.95,
                    return_full_text: false,
                    do_sample: true
                }
            };

            console.log(`🤖 Hugging Face: Génération avec ${this.model}...`);

            const response = await axios.post(
                `${this.baseUrl}/models/${this.model}`,
                requestBody,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: options.timeout || 60000
                }
            );

            const responseTime = Date.now() - startTime;
            this.stats.successfulRequests++;
            this.stats.averageResponseTime =
                (this.stats.averageResponseTime * (this.stats.successfulRequests - 1) + responseTime) /
                this.stats.successfulRequests;

            // Hugging Face retourne un tableau avec l'objet de réponse
            const completion = Array.isArray(response.data)
                ? response.data[0]?.generated_text || response.data[0]?.text || ''
                : response.data.generated_text || response.data.text || '';

            // Estimation des tokens (approximatif)
            const estimatedTokens = Math.ceil(completion.split(/\s+/).length * 1.3);
            this.stats.totalTokens += estimatedTokens;

            console.log(`✅ Réponse générée (${responseTime}ms, ~${estimatedTokens} tokens)`);

            return {
                success: true,
                response: completion.trim(),
                model: this.model,
                usage: {
                    promptTokens: Math.ceil(prompt.split(/\s+/).length * 1.3),
                    completionTokens: estimatedTokens,
                    totalTokens: estimatedTokens
                },
                responseTime: responseTime
            };

        } catch (error) {
            this.stats.failedRequests++;
            console.error('❌ Erreur génération Hugging Face:', error.message);

            // Extraire les détails de l'erreur
            let errorDetails = error.message;
            if (error.response?.data) {
                if (typeof error.response.data === 'string') {
                    errorDetails = error.response.data;
                } else if (error.response.data.error) {
                    errorDetails = error.response.data.error;
                }
            }

            // Modèle en cours de chargement
            if (error.response?.status === 503) {
                const estimatedTime = error.response.data?.estimated_time || 20;
                return {
                    success: false,
                    error: `Modèle en cours de chargement. Temps estimé: ${estimatedTime}s`,
                    loading: true,
                    estimatedTime: estimatedTime,
                    responseTime: Date.now() - startTime
                };
            }

            return {
                success: false,
                error: errorDetails,
                responseTime: Date.now() - startTime
            };
        }
    }

    /**
     * Génère une réponse avec contexte de conversation
     * @param {Array} messages - Historique des messages
     * @param {Object} options - Options de génération
     */
    async chat(messages, options = {}) {
        if (!this.initialized) {
            throw new Error('Service Hugging Face non initialisé');
        }

        // Convertir les messages en prompt formaté pour le modèle
        let prompt = '';

        // Ajouter un system prompt si disponible
        const systemPrompt = options.systemPrompt ||
            'Tu es DocuCortex, un assistant IA intelligent pour la gestion de documents et la recherche d\'informations. Réponds de manière claire et helpful en français.';

        prompt += `<s>[INST] ${systemPrompt} [/INST]</s>\n\n`;

        // Ajouter les messages
        messages.forEach(msg => {
            const role = msg.role === 'assistant' ? 'Assistant' : 'Utilisateur';
            const content = typeof msg === 'string' ? msg : msg.content;

            if (msg.role === 'assistant' || role === 'Assistant') {
                prompt += `${content}\n\n`;
            } else {
                prompt += `<s>[INST] ${content} [/INST]`;
            }
        });

        // Générer la réponse
        return await this.generate(prompt, options);
    }

    /**
     * Traite une conversation avec contexte (compatible avec openrouterService)
     * @param {Array} messages - Messages de la conversation
     * @param {Object} options - Options de traitement
     */
    async processConversation(messages, options = {}) {
        try {
            const systemPrompt = options.systemPrompt ||
                'Tu es DocuCortex, un assistant IA intelligent pour la gestion de documents et la recherche d\'informations. Réponds de manière claire et helpful en français.';

            // Construire le prompt avec contexte
            let conversationPrompt = `<s>[INST] ${systemPrompt}\n\n`;

            // Ajouter le contexte si disponible
            if (options.context && options.context.length > 0) {
                conversationPrompt += 'Contexte de la conversation précédente:\n';
                options.context.slice(-5).forEach(msg => {
                    const role = msg.role === 'assistant' ? 'Assistant' : 'Utilisateur';
                    conversationPrompt += `${role}: ${msg.content}\n`;
                });
                conversationPrompt += '\n';
            }

            // Ajouter le message actuel
            const lastMessage = messages[messages.length - 1];
            const userMessage = typeof lastMessage === 'string' ? lastMessage : lastMessage.content;
            conversationPrompt += `${userMessage} [/INST]`;

            // Appeler l'API Hugging Face
            const result = await this.generate(conversationPrompt, {
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens || 2048,
                timeout: options.timeout || 60000
            });

            if (result.success) {
                return {
                    success: true,
                    response: result.response,
                    conversationId: options.sessionId || 'default',
                    confidence: 0.85,
                    contextUsed: options.context || [],
                    modelUsed: this.model,
                    tokens: result.usage.totalTokens,
                    responseTime: result.responseTime
                };
            }

            return result;

        } catch (error) {
            console.error('❌ Erreur traitement conversation Hugging Face:', error.message);
            return {
                success: false,
                response: 'Désolé, une erreur s\'est produite avec le service Hugging Face.',
                error: error.message
            };
        }
    }

    /**
     * Récupère la liste des modèles disponibles depuis Hugging Face
     * @param {Object} filters - Filtres optionnels (task, sort, limit)
     */
    async getAvailableModels(filters = {}) {
        try {
            console.log('🔍 Récupération des modèles Hugging Face...');

            // Construire l'URL avec les filtres
            const params = new URLSearchParams();

            // Filtrer par tâche (text-generation par défaut pour LLM)
            params.append('filter', filters.task || 'text-generation');

            // Trier par likes, downloads ou trending
            if (filters.sort) {
                params.append('sort', filters.sort);
            } else {
                params.append('sort', 'downloads'); // Par défaut, trier par popularité
            }

            // Limiter les résultats
            const limit = filters.limit || 20;
            params.append('limit', limit.toString());

            const response = await axios.get(
                `https://huggingface.co/api/models?${params.toString()}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`
                    },
                    timeout: 15000
                }
            );

            if (!Array.isArray(response.data)) {
                return {
                    success: false,
                    error: 'Format de réponse inattendu'
                };
            }

            // Formater les modèles pour l'interface
            const formattedModels = response.data.map(model => ({
                id: model.modelId || model.id,
                name: model.modelId || model.id,
                description: model.description || '',
                downloads: model.downloads || 0,
                likes: model.likes || 0,
                tags: model.tags || [],
                pipeline_tag: model.pipeline_tag,
                private: model.private || false,
                author: model.author || model.modelId?.split('/')[0],
                lastModified: model.lastModified,
                isFree: true // Tous les modèles HuggingFace publics sont gratuits
            }));

            // Filtrer les modèles privés si nécessaire
            const publicModels = filters.publicOnly !== false
                ? formattedModels.filter(m => !m.private)
                : formattedModels;

            console.log(`✅ ${publicModels.length} modèle(s) Hugging Face récupéré(s)`);

            return {
                success: true,
                models: publicModels,
                total: publicModels.length,
                task: filters.task || 'text-generation'
            };

        } catch (error) {
            console.error('❌ Erreur récupération modèles Hugging Face:', error.message);

            // En cas d'erreur, retourner les modèles recommandés
            console.log('📋 Utilisation des modèles recommandés comme fallback');
            return {
                success: true,
                models: HuggingFaceService.getRecommendedModels(),
                total: HuggingFaceService.getRecommendedModels().length,
                fallback: true,
                error: error.message
            };
        }
    }

    /**
     * Récupère les statistiques d'utilisation
     */
    getStats() {
        return {
            ...this.stats,
            connectionStatus: this.connectionStatus,
            configuration: {
                baseUrl: this.baseUrl,
                model: this.model,
                apiKeyConfigured: !!this.apiKey
            }
        };
    }

    /**
     * Alias pour getStats() pour compatibilité
     */
    getStatistics() {
        return this.getStats();
    }

    /**
     * Réinitialise les statistiques
     */
    resetStats() {
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalTokens: 0,
            averageResponseTime: 0
        };
        console.log('📊 Statistiques réinitialisées');
    }

    /**
     * Liste des modèles recommandés pour DocuCortex
     */
    static getRecommendedModels() {
        return [
            {
                id: 'mistralai/Mistral-7B-Instruct-v0.3',
                name: 'Mistral 7B Instruct v0.3',
                description: 'Dernière version - Excellent modèle français, rapide et précis',
                recommended: true,
                contextLength: 32768
            },
            {
                id: 'mistralai/Mistral-7B-Instruct-v0.2',
                name: 'Mistral 7B Instruct v0.2',
                description: 'Version stable - Excellent modèle français',
                recommended: true,
                contextLength: 32768
            },
            {
                id: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
                name: 'Mixtral 8x7B Instruct',
                description: 'Très puissant, excellentes performances',
                recommended: true,
                contextLength: 32768
            },
            {
                id: 'meta-llama/Llama-2-7b-chat-hf',
                name: 'Llama 2 7B Chat',
                description: 'Modèle de Meta, bon équilibre performance/vitesse',
                contextLength: 4096
            },
            {
                id: 'meta-llama/Llama-3-8B-Instruct',
                name: 'Llama 3 8B Instruct',
                description: 'Nouvelle génération Llama, très performant',
                recommended: true,
                contextLength: 8192
            },
            {
                id: 'google/flan-t5-xxl',
                name: 'FLAN-T5 XXL',
                description: 'Bon pour les tâches de compréhension et résumé',
                contextLength: 512
            },
            {
                id: 'tiiuae/falcon-7b-instruct',
                name: 'Falcon 7B Instruct',
                description: 'Rapide et efficace',
                contextLength: 2048
            }
        ];
    }

    /**
     * Liste des modèles Mistral gratuits disponibles sur OpenRouter
     */
    static getMistralFreeModels() {
        return [
            {
                id: 'mistralai/mistral-3-free',
                name: 'Mistral 3 (Free)',
                description: 'Version gratuite de Mistral 3 via OpenRouter',
                recommended: true,
                provider: 'openrouter',
                isFree: true,
                contextLength: 128000
            },
            {
                id: 'mistralai/mistral-7b-instruct:free',
                name: 'Mistral 7B Instruct (Free)',
                description: 'Mistral 7B gratuit via OpenRouter',
                provider: 'openrouter',
                isFree: true,
                contextLength: 32768
            }
        ];
    }
}

// Export singleton
module.exports = new HuggingFaceService();
