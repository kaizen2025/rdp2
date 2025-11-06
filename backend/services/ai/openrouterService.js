/**
 * Service d'intégration OpenRouter pour DocuCortex
 * API compatible OpenAI pour accéder à plusieurs modèles LLM
 * Documentation: https://openrouter.ai/docs
 */

const axios = require('axios');

class OpenRouterService {
    constructor() {
        this.baseUrl = 'https://openrouter.ai/api/v1';
        this.apiKey = null;
        this.model = 'openai/gpt-3.5-turbo'; // Modèle par défaut
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
     * Configure la clé API OpenRouter
     * @param {string} apiKey - Clé API OpenRouter (sk-or-v1-...)
     */
    setApiKey(apiKey) {
        if (!apiKey || !apiKey.startsWith('sk-or-v1-')) {
            console.warn('⚠️ Format de clé API OpenRouter invalide');
            return false;
        }
        this.apiKey = apiKey;
        console.log('✅ Clé API OpenRouter configurée');
        return true;
    }

    /**
     * Configure le modèle à utiliser
     * @param {string} model - Nom du modèle (ex: openai/gpt-3.5-turbo, anthropic/claude-2, etc.)
     */
    setModel(model) {
        this.model = model;
        console.log(`✅ Modèle configuré: ${model}`);
    }

    /**
     * Initialise le service OpenRouter
     */
    async initialize(config = {}) {
        if (this.initialized) return { success: true };

        try {
            console.log('🔗 Initialisation du service OpenRouter...');

            // Configurer la clé API depuis la config
            if (config.apiKey) {
                this.setApiKey(config.apiKey);
            }

            // Configurer le modèle depuis la config
            if (config.model) {
                this.setModel(config.model);
            }

            if (!this.apiKey) {
                throw new Error('Clé API OpenRouter non configurée');
            }

            // Vérifier la connexion à OpenRouter
            await this.testConnection();

            this.initialized = true;
            console.log('✅ Service OpenRouter initialisé avec succès');

            return { success: true };
        } catch (error) {
            console.error('❌ Erreur initialisation OpenRouter:', error.message);
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
     * Teste la connexion à OpenRouter
     */
    async testConnection() {
        try {
            const startTime = Date.now();

            // Test simple avec l'endpoint models
            const response = await axios.get(`${this.baseUrl}/models`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': 'http://localhost:3002',
                    'X-Title': 'RDS Viewer DocuCortex'
                },
                timeout: 10000
            });

            const responseTime = Date.now() - startTime;

            this.connectionStatus = {
                connected: response.status === 200,
                lastCheck: new Date().toISOString(),
                responseTime: responseTime
            };

            console.log(`✅ Connexion OpenRouter OK (${responseTime}ms)`);
            return {
                success: true,
                connected: true,
                responseTime: responseTime,
                modelsAvailable: response.data?.data?.length || 0
            };

        } catch (error) {
            this.connectionStatus = {
                connected: false,
                lastCheck: new Date().toISOString(),
                responseTime: null,
                error: error.message
            };

            console.error('❌ Connexion OpenRouter échouée:', error.message);
            return {
                success: false,
                connected: false,
                error: error.message
            };
        }
    }

    /**
     * Génère une réponse avec OpenRouter
     * @param {string} prompt - Le prompt à envoyer
     * @param {Object} options - Options de génération
     */
    async generate(prompt, options = {}) {
        if (!this.initialized) {
            throw new Error('Service OpenRouter non initialisé');
        }

        const startTime = Date.now();
        this.stats.totalRequests++;

        try {
            const requestBody = {
                model: options.model || this.model,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: options.temperature || 0.7,
                max_tokens: options.max_tokens || 2048,
                stream: false
            };

            // Ajouter le contexte si fourni
            if (options.context && options.context.length > 0) {
                requestBody.messages = [
                    ...options.context.map(msg => ({
                        role: msg.role || 'user',
                        content: msg.content
                    })),
                    { role: 'user', content: prompt }
                ];
            }

            console.log(`🤖 OpenRouter: Génération avec ${requestBody.model}...`);

            const response = await axios.post(
                `${this.baseUrl}/chat/completions`,
                requestBody,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'HTTP-Referer': 'http://localhost:3002',
                        'X-Title': 'RDS Viewer DocuCortex',
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

            const completion = response.data.choices[0].message.content;
            const usage = response.data.usage || {};

            this.stats.totalTokens += (usage.total_tokens || 0);

            console.log(`✅ Réponse générée (${responseTime}ms, ${usage.total_tokens || 0} tokens)`);

            return {
                success: true,
                response: completion,
                model: response.data.model,
                usage: {
                    promptTokens: usage.prompt_tokens || 0,
                    completionTokens: usage.completion_tokens || 0,
                    totalTokens: usage.total_tokens || 0
                },
                responseTime: responseTime,
                id: response.data.id
            };

        } catch (error) {
            this.stats.failedRequests++;
            console.error('❌ Erreur génération OpenRouter:', error.message);

            // Extraire les détails de l'erreur
            let errorDetails = error.message;
            if (error.response?.data) {
                errorDetails = error.response.data.error?.message || error.response.data.message || errorDetails;
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
            throw new Error('Service OpenRouter non initialisé');
        }

        const startTime = Date.now();
        this.stats.totalRequests++;

        try {
            const requestBody = {
                model: options.model || this.model,
                messages: messages.map(msg => ({
                    role: msg.role || 'user',
                    content: msg.content
                })),
                temperature: options.temperature || 0.7,
                max_tokens: options.max_tokens || 2048,
                stream: false
            };

            console.log(`💬 OpenRouter Chat: ${messages.length} messages avec ${requestBody.model}...`);

            const response = await axios.post(
                `${this.baseUrl}/chat/completions`,
                requestBody,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'HTTP-Referer': 'http://localhost:3002',
                        'X-Title': 'RDS Viewer DocuCortex',
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

            const completion = response.data.choices[0].message.content;
            const usage = response.data.usage || {};

            this.stats.totalTokens += (usage.total_tokens || 0);

            console.log(`✅ Chat réponse générée (${responseTime}ms, ${usage.total_tokens || 0} tokens)`);

            return {
                success: true,
                response: completion,
                model: response.data.model,
                usage: {
                    promptTokens: usage.prompt_tokens || 0,
                    completionTokens: usage.completion_tokens || 0,
                    totalTokens: usage.total_tokens || 0
                },
                responseTime: responseTime,
                id: response.data.id
            };

        } catch (error) {
            this.stats.failedRequests++;
            console.error('❌ Erreur chat OpenRouter:', error.message);

            let errorDetails = error.message;
            if (error.response?.data) {
                errorDetails = error.response.data.error?.message || error.response.data.message || errorDetails;
            }

            return {
                success: false,
                error: errorDetails,
                responseTime: Date.now() - startTime
            };
        }
    }

    /**
     * Traite une conversation avec contexte (compatible avec ollamaService)
     * @param {Array} messages - Messages de la conversation
     * @param {Object} options - Options de traitement
     */
    async processConversation(messages, options = {}) {
        try {
            const systemPrompt = options.systemPrompt ||
                'Tu es DocuCortex, un assistant IA intelligent pour la gestion de documents et la recherche d\'informations. Réponds de manière claire et helpful en français.';

            // Construire les messages avec le system prompt
            const chatMessages = [
                { role: 'system', content: systemPrompt }
            ];

            // Ajouter le contexte si disponible
            if (options.context && options.context.length > 0) {
                options.context.slice(-5).forEach(msg => {
                    chatMessages.push({
                        role: msg.role === 'assistant' ? 'assistant' : 'user',
                        content: msg.content
                    });
                });
            }

            // Ajouter les nouveaux messages
            messages.forEach(msg => {
                if (typeof msg === 'string') {
                    chatMessages.push({ role: 'user', content: msg });
                } else {
                    chatMessages.push({
                        role: msg.role === 'assistant' ? 'assistant' : 'user',
                        content: msg.content
                    });
                }
            });

            // Appeler l'API OpenRouter
            const result = await this.chat(chatMessages, {
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens || 2048,
                timeout: options.timeout || 60000
            });

            if (result.success) {
                return {
                    success: true,
                    response: result.response,
                    conversationId: options.sessionId || 'default',
                    confidence: 0.9, // OpenRouter a généralement une excellente confiance
                    contextUsed: options.context || [],
                    modelUsed: result.model,
                    tokens: result.usage.totalTokens,
                    responseTime: result.responseTime
                };
            }

            return result;

        } catch (error) {
            console.error('❌ Erreur traitement conversation OpenRouter:', error.message);
            return {
                success: false,
                response: 'Désolé, une erreur s\'est produite avec le service OpenRouter.',
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
     * Alias pour getStats() pour compatibilité avec ollamaService
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
}

// Export singleton
module.exports = new OpenRouterService();
