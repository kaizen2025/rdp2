/**
 * Service d'intégration Ollama pour DocuCortex
 * Permet de communiquer avec Ollama local et Llama 3.2 3B
 * S'intègre avec aiService.js existant
 */

const axios = require('axios');
const path = require('path');

class OllamaService {
    constructor() {
        this.baseUrl = 'http://localhost:11434';
        this.model = 'llama3.2'; // Support Llama 3.2 (compatible avec toutes les variantes)
        this.initialized = false;
        this.availableModels = [];
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
     * Initialise le service Ollama
     */
    async initialize() {
        if (this.initialized) return { success: true };

        try {
            console.log('🔗 Initialisation du service Ollama...');
            
            // Vérifier la connexion à Ollama
            await this.testConnection();
            
            // Charger les modèles disponibles
            await this.loadAvailableModels();
            
            this.initialized = true;
            console.log('✅ Service Ollama initialisé avec succès');
            
            return { success: true };
        } catch (error) {
            console.error('❌ Erreur initialisation Ollama:', error.message);
            return { 
                success: false, 
                error: error.message,
                connectionDetails: {
                    ollamaRunning: false,
                    url: this.baseUrl,
                    model: this.model
                }
            };
        }
    }

    /**
     * Teste la connexion à Ollama
     */
    async testConnection() {
        try {
            const startTime = Date.now();
            
            // Test de base avec un appel simple
            const response = await axios.get(`${this.baseUrl}/api/tags`, {
                timeout: 10000
            });
            
            const responseTime = Date.now() - startTime;
            
            this.connectionStatus = {
                connected: response.status === 200,
                lastCheck: new Date().toISOString(),
                responseTime: responseTime
            };
            
            console.log(`✅ Connexion Ollama OK (${responseTime}ms)`);
            return {
                success: true,
                connected: true,
                responseTime: responseTime,
                ollamaVersion: response.data?.version || 'unknown'
            };
            
        } catch (error) {
            this.connectionStatus = {
                connected: false,
                lastCheck: new Date().toISOString(),
                responseTime: null,
                error: error.message
            };
            
            console.error('❌ Connexion Ollama échouée:', error.message);
            return {
                success: false,
                connected: false,
                error: error.message
            };
        }
    }

    /**
     * Charge les modèles disponibles
     */
    async loadAvailableModels() {
        try {
            const response = await axios.get(`${this.baseUrl}/api/tags`);
            this.availableModels = response.data.models || [];
            
            console.log(`📦 ${this.availableModels.length} modèles disponibles`);
            this.availableModels.forEach(model => {
                console.log(`   - ${model.name} (${Math.round(model.size / 1024 / 1024)}MB)`);
            });
            
            return this.availableModels;
        } catch (error) {
            console.error('❌ Erreur chargement modèles:', error.message);
            return [];
        }
    }

    /**
     * Génère une réponse avec Ollama (compatible avec aiService)
     */
    async generateResponse(prompt, options = {}) {
        const startTime = Date.now();
        this.stats.totalRequests++;
        
        try {
            if (!this.connectionStatus.connected) {
                await this.testConnection();
            }
            
            if (!this.connectionStatus.connected) {
                throw new Error('Ollama non disponible');
            }

            const requestOptions = {
                model: options.model || this.model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: options.temperature || 0.7,
                    top_p: options.top_p || 0.9,
                    top_k: options.top_k || 40,
                    num_predict: options.maxTokens || 512,
                    stop: options.stop || ['\n\n', '###'],
                    seed: options.seed || -1
                }
            };

            console.log(`🤖 Génération réponse Ollama (${requestOptions.model})...`);

            const response = await axios.post(
                `${this.baseUrl}/api/generate`,
                requestOptions,
                {
                    timeout: 30000, // 30 secondes
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            const responseTime = Date.now() - startTime;
            
            if (response.data && response.data.response) {
                this.stats.successfulRequests++;
                this.stats.totalTokens += response.data.eval_count || 0;
                this._updateAverageResponseTime(responseTime);
                
                console.log(`✅ Réponse Ollama générée (${responseTime}ms, ${response.data.eval_count || 0} tokens)`);
                
                return {
                    success: true,
                    response: response.data.response.trim(),
                    model: requestOptions.model,
                    tokens: response.data.eval_count || 0,
                    time: responseTime,
                    promptTokens: response.data.prompt_eval_count || 0,
                    completionTokens: response.data.eval_count || 0
                };
            } else {
                throw new Error('Réponse invalide d\'Ollama');
            }

        } catch (error) {
            this.stats.failedRequests++;
            const responseTime = Date.now() - startTime;
            
            console.error('❌ Erreur génération Ollama:', error.message);
            
            return {
                success: false,
                error: error.message,
                responseTime: responseTime,
                fallbackUsed: false
            };
        }
    }

    /**
     * Traite une conversation avec contexte (compatible avec conversationService)
     */
    async processConversation(messages, options = {}) {
        try {
            // Convertir les messages en format Ollama
            const systemPrompt = options.systemPrompt || 'Tu es DocuCortex, un assistant IA intelligent pour la gestion de documents et la recherche d\'informations. Réponds de manière claire et helpful.';
            
            // Construire le prompt avec contexte
            let contextPrompt = systemPrompt + '\n\n';
            
            if (options.context && options.context.length > 0) {
                contextPrompt += 'Contexte de la conversation:\n';
                options.context.slice(-5).forEach(msg => { // Garder seulement les 5 derniers messages
                    contextPrompt += `${msg.role}: ${msg.content}\n`;
                });
                contextPrompt += '\n';
            }
            
            contextPrompt += `Utilisateur: ${messages[messages.length - 1]?.content || messages[messages.length - 1] || messages}`;
            
            const result = await this.generateResponse(contextPrompt, options);
            
            if (result.success) {
                return {
                    success: true,
                    response: result.response,
                    conversationId: options.sessionId || 'default',
                    confidence: 0.85, // Ollama a généralement une bonne confiance
                    contextUsed: options.context || [],
                    modelUsed: result.model,
                    tokens: result.tokens,
                    responseTime: result.time
                };
            }
            
            return result;

        } catch (error) {
            console.error('❌ Erreur traitement conversation Ollama:', error.message);
            return {
                success: false,
                response: 'Désolé, une erreur s\'est produite avec le service Ollama.',
                error: error.message
            };
        }
    }

    /**
     * Analyse de sentiment avec Ollama
     */
    async analyzeSentiment(text) {
        try {
            const prompt = `Analyse le sentiment de ce texte et réponds uniquement par un JSON avec "sentiment" (positif/négatif/neutre), "confidence" (0-1) et "emotions" (liste d'émotions détectées):

Texte: "${text}"

Réponse au format JSON uniquement:`;

            const result = await this.generateResponse(prompt, {
                maxTokens: 100,
                temperature: 0.1 // Plus déterministe pour l'analyse
            });

            if (result.success) {
                try {
                    const jsonMatch = result.response.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const sentimentData = JSON.parse(jsonMatch[0]);
                        return {
                            success: true,
                            sentiment: sentimentData.sentiment || 'neutral',
                            confidence: sentimentData.confidence || 0.5,
                            emotions: sentimentData.emotions || []
                        };
                    }
                } catch (parseError) {
                    console.warn('⚠️ Erreur parsing sentiment:', parseError.message);
                }
            }

            return {
                success: false,
                error: 'Impossible d\'analyser le sentiment'
            };

        } catch (error) {
            console.error('❌ Erreur analyse sentiment:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Résumé intelligent d'un texte
     */
    async summarizeText(text, maxLength = 200) {
        try {
            const prompt = `Résume ce texte en maximum ${maxLength} caractères en conservant les points clés:

${text}

Résumé:`;

            const result = await this.generateResponse(prompt, {
                maxTokens: Math.ceil(maxLength / 4), // Approximation tokens pour la longueur
                temperature: 0.3
            });

            if (result.success) {
                return {
                    success: true,
                    summary: result.response.trim(),
                    originalLength: text.length,
                    summaryLength: result.response.length,
                    compression: Math.round((1 - result.response.length / text.length) * 100)
                };
            }

            return {
                success: false,
                error: 'Impossible de générer le résumé'
            };

        } catch (error) {
            console.error('❌ Erreur résumé texte:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Extraction de mots-clés
     */
    async extractKeywords(text, maxKeywords = 10) {
        try {
            const prompt = `Extrais ${maxKeywords} mots-clés importants de ce texte. Réponds uniquement par une liste séparée par des virgules:

${text}

Mots-clés:`;

            const result = await this.generateResponse(prompt, {
                maxTokens: 50,
                temperature: 0.2
            });

            if (result.success) {
                const keywords = result.response
                    .split(',')
                    .map(k => k.trim().toLowerCase())
                    .filter(k => k.length > 2)
                    .slice(0, maxKeywords);
                
                return {
                    success: true,
                    keywords: keywords,
                    count: keywords.length
                };
            }

            return {
                success: false,
                error: 'Impossible d\'extraire les mots-clés'
            };

        } catch (error) {
            console.error('❌ Erreur extraction mots-clés:', error.message);
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
            const prompt = `Traduis ce texte en ${targetLanguage}. Réponds uniquement par la traduction:

${text}

Traduction:`;

            const result = await this.generateResponse(prompt, {
                maxTokens: Math.ceil(text.length / 2), // Estimation
                temperature: 0.2
            });

            if (result.success) {
                return {
                    success: true,
                    translation: result.response.trim(),
                    originalText: text,
                    targetLanguage: targetLanguage
                };
            }

            return {
                success: false,
                error: 'Impossible de traduire le texte'
            };

        } catch (error) {
            console.error('❌ Erreur traduction:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Q&A sur un document
     */
    async answerQuestion(documentText, question) {
        try {
            const prompt = `Réponds à la question en te basant UNIQUEMENT sur le document fourni. Si la réponse n'est pas dans le document, dis-le clairement.

Document:
${documentText}

Question: ${question}

Réponse:`;

            const result = await this.generateResponse(prompt, {
                maxTokens: 300,
                temperature: 0.1
            });

            if (result.success) {
                return {
                    success: true,
                    answer: result.response.trim(),
                    question: question,
                    confidence: this._calculateConfidence(result.response),
                    source: 'document'
                };
            }

            return {
                success: false,
                error: 'Impossible de répondre à la question'
            };

        } catch (error) {
            console.error('❌ Erreur Q&A document:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Obtient les informations du modèle
     */
    getModelInfo() {
        return {
            name: this.model,
            available: this.availableModels.some(m => m.name === this.model),
            allModels: this.availableModels.map(m => ({
                name: m.name,
                size: m.size,
                sizeFormatted: `${Math.round(m.size / 1024 / 1024)}MB`,
                modifiedAt: m.modified_at
            }))
        };
    }

    /**
     * Change le modèle actif
     */
    async setModel(modelName) {
        try {
            // Vérifier que le modèle existe
            const modelExists = this.availableModels.some(m => m.name === modelName);
            
            if (!modelExists) {
                throw new Error(`Modèle ${modelName} non disponible`);
            }
            
            this.model = modelName;
            console.log(`🔄 Modèle Ollama changé vers: ${modelName}`);
            
            return {
                success: true,
                model: modelName,
                previousModel: this.previousModel
            };
        } catch (error) {
            console.error('❌ Erreur changement modèle:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Obtient les statistiques du service
     */
    getStatistics() {
        const successRate = this.stats.totalRequests > 0 
            ? (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(1)
            : 0;

        return {
            initialized: this.initialized,
            connection: this.connectionStatus,
            stats: {
                totalRequests: this.stats.totalRequests,
                successfulRequests: this.stats.successfulRequests,
                failedRequests: this.stats.failedRequests,
                successRate: `${successRate}%`,
                totalTokens: this.stats.totalTokens,
                averageResponseTime: Math.round(this.stats.averageResponseTime)
            },
            model: this.getModelInfo(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Reset les statistiques
     */
    resetStatistics() {
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalTokens: 0,
            averageResponseTime: 0
        };
        
        console.log('📊 Statistiques Ollama réinitialisées');
        return { success: true };
    }

    // ==================== MÉTHODES PRIVÉES ====================

    /**
     * Met à jour le temps de réponse moyen
     */
    _updateAverageResponseTime(responseTime) {
        if (this.stats.averageResponseTime === 0) {
            this.stats.averageResponseTime = responseTime;
        } else {
            // Moyenne mobile simple
            this.stats.averageResponseTime = 
                (this.stats.averageResponseTime + responseTime) / 2;
        }
    }

    /**
     * Calcule un score de confiance basé sur la réponse
     */
    _calculateConfidence(response) {
        // Heuristiques simples pour estimer la confiance
        let confidence = 0.5;
        
        if (response.includes('Je ne sais pas') || response.includes('inconnu')) {
            confidence = 0.2;
        } else if (response.length > 50) {
            confidence = 0.8;
        } else if (response.length > 20) {
            confidence = 0.6;
        }
        
        return confidence;
    }

    /**
     * Formatte les erreurs pour la compatibilité avec aiService
     */
    _formatError(error) {
        return {
            success: false,
            response: 'Une erreur s\'est produite avec le service Ollama.',
            error: error.message,
            confidence: 0,
            timestamp: new Date().toISOString()
        };
    }
}

// Export pour utilisation dans aiService.js
module.exports = new OllamaService();