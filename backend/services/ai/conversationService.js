/**
 * Service de gestion des conversations avec l'IA
 * Orchestre NLP, recherche vectorielle et generation de reponses
 */

const nlpService = require('./nlpService');
const vectorSearchService = require('./vectorSearchService');

class ConversationService {
    constructor() {
        this.sessions = new Map(); // sessionId -> conversation history
        this.defaultSettings = {
            maxResponseLength: 500,
            confidenceThreshold: 0.5,
            maxContextDocs: 3,
            responseStyle: 'professional',
            language: 'fr'
        };
    }

    /**
     * Traite un message utilisateur
     */
    async processMessage(sessionId, userMessage, settings = {}) {
        const startTime = Date.now();
        
        try {
            // Fusionner avec parametres par defaut
            const config = { ...this.defaultSettings, ...settings };

            // Obtenir ou creer session
            if (!this.sessions.has(sessionId)) {
                this.sessions.set(sessionId, {
                    history: [],
                    createdAt: new Date(),
                    lastActivity: new Date()
                });
            }

            const session = this.sessions.get(sessionId);
            session.lastActivity = new Date();

            // Analyse NLP du message
            const analysis = await nlpService.analyze(userMessage, config.language);

            // Recherche dans les documents indexes
            const searchResults = vectorSearchService.search(userMessage, {
                maxResults: config.maxContextDocs,
                minScore: config.confidenceThreshold * 0.5,
                searchInChunks: true
            });

            // Generer la reponse
            const response = await this.generateResponse(
                userMessage,
                analysis,
                searchResults,
                session.history,
                config
            );

            // Ajouter a l'historique
            session.history.push({
                user: userMessage,
                assistant: response.text,
                timestamp: new Date(),
                analysis: analysis,
                searchResults: searchResults.length
            });

            // Limiter l'historique a 50 messages
            if (session.history.length > 50) {
                session.history = session.history.slice(-50);
            }

            const responseTime = Date.now() - startTime;

            return {
                success: true,
                response: response.text,
                confidence: response.confidence,
                intent: analysis.intent,
                documentsUsed: searchResults.length,
                responseTime: responseTime,
                context: searchResults.map(r => ({
                    documentId: r.documentId,
                    score: r.score,
                    excerpt: r.relevantChunk || ''
                }))
            };
        } catch (error) {
            console.error('Erreur traitement message:', error);
            return {
                success: false,
                response: 'Desolé, une erreur s\'est produite lors du traitement de votre message.',
                error: error.message,
                confidence: 0,
                intent: 'error',
                documentsUsed: 0,
                responseTime: Date.now() - startTime
            };
        }
    }

    /**
     * Genere une reponse intelligente
     */
    async generateResponse(userMessage, analysis, searchResults, history, config) {
        try {
            // Determiner le type de reponse selon l'intention
            switch (analysis.intent) {
                case 'salutation':
                    return this.generateGreeting(config.language);

                case 'aide':
                    return this.generateHelpResponse(config.language);

                case 'recherche.document':
                    return this.generateSearchResponse(searchResults, userMessage, config);

                case 'question.generale':
                    return this.generateAnswerFromContext(
                        userMessage,
                        searchResults,
                        config
                    );

                default:
                    // Reponse contextuelle generale
                    return this.generateContextualResponse(
                        userMessage,
                        analysis,
                        searchResults,
                        config
                    );
            }
        } catch (error) {
            console.error('Erreur generation reponse:', error);
            return {
                text: 'Je ne suis pas certain de comprendre. Pouvez-vous reformuler?',
                confidence: 0.3
            };
        }
    }

    /**
     * Genere un message de salutation
     */
    generateGreeting(language) {
        const greetings = {
            fr: [
                'Bonjour! Je suis votre assistant IA local. Comment puis-je vous aider aujourd\'hui?',
                'Salut! Je peux vous aider a rechercher dans vos documents ou repondre a vos questions.',
                'Bonjour! N\'hesitez pas a me poser vos questions sur les documents indexes.'
            ],
            es: [
                'Hola! Soy tu asistente IA local. Como puedo ayudarte hoy?',
                'Hola! Puedo ayudarte a buscar en tus documentos o responder tus preguntas.'
            ]
        };

        const options = greetings[language] || greetings.fr;
        const text = options[Math.floor(Math.random() * options.length)];

        return { text, confidence: 1.0 };
    }

    /**
     * Genere une reponse d'aide
     */
    generateHelpResponse(language) {
        const helpText = {
            fr: `Je suis un assistant IA intelligent qui peut vous aider avec:

1. Recherche de documents - Trouvez rapidement l'information dont vous avez besoin
2. Questions & Reponses - Posez-moi des questions sur le contenu indexe
3. Analyse de documents - Je peux extraire et synthetiser l'information

Pour commencer, vous pouvez:
- Uploader des documents (PDF, DOCX, Excel, images, etc.)
- Me poser une question sur vos documents
- Rechercher un sujet specifique

Tous les traitements sont effectues localement, vos donnees restent privees.`,
            es: `Soy un asistente IA inteligente que puede ayudarte con:

1. Busqueda de documentos - Encuentra rapidamente la informacion que necesitas
2. Preguntas y Respuestas - Hazme preguntas sobre el contenido indexado
3. Analisis de documentos - Puedo extraer y sintetizar informacion

Para empezar, puedes:
- Subir documentos (PDF, DOCX, Excel, imagenes, etc.)
- Hacerme una pregunta sobre tus documentos
- Buscar un tema especifico

Todos los procesamientos se realizan localmente, tus datos permanecen privados.`
        };

        return {
            text: helpText[language] || helpText.fr,
            confidence: 1.0
        };
    }

    /**
     * Genere une reponse de recherche
     */
    generateSearchResponse(searchResults, query, config) {
        if (searchResults.length === 0) {
            return {
                text: `Je n'ai pas trouve de documents correspondant a "${query}". Assurez-vous d'avoir indexe des documents pertinents.`,
                confidence: 0.5
            };
        }

        let response = `J'ai trouve ${searchResults.length} document(s) pertinent(s) pour "${query}":\n\n`;

        searchResults.forEach((result, index) => {
            const filename = result.metadata?.filename || `Document ${result.documentId}`;
            response += `${index + 1}. ${filename} (pertinence: ${Math.round(result.score * 100)}%)\n`;
            
            if (result.relevantChunk) {
                const excerpt = result.relevantChunk.substring(0, 200);
                response += `   "${excerpt}..."\n\n`;
            }
        });

        return {
            text: response.trim(),
            confidence: Math.max(...searchResults.map(r => r.score))
        };
    }

    /**
     * Genere une reponse basee sur le contexte
     */
    generateAnswerFromContext(question, searchResults, config) {
        if (searchResults.length === 0) {
            return {
                text: 'Je n\'ai pas suffisamment d\'informations dans mes documents indexes pour repondre a cette question. Pouvez-vous uploader des documents pertinents?',
                confidence: 0.3
            };
        }

        // Extraire les informations pertinentes
        const contexts = searchResults
            .map(r => r.relevantChunk || r.metadata?.excerpt || '')
            .filter(c => c.length > 0);

        if (contexts.length === 0) {
            return {
                text: 'J\'ai trouve des documents pertinents mais je n\'ai pas pu extraire d\'information specifique. Pouvez-vous reformuler votre question?',
                confidence: 0.4
            };
        }

        // Synthetiser une reponse
        const topContext = contexts[0];
        const keywords = nlpService.extractKeywords(question, 3);
        
        let response = `Selon les documents indexes, voici ce que j'ai trouve:\n\n`;
        response += `${topContext.substring(0, config.maxResponseLength)}`;
        
        if (topContext.length > config.maxResponseLength) {
            response += '...';
        }

        response += `\n\nCette information provient de ${searchResults[0].metadata?.filename || 'un document indexe'}.`;

        const avgScore = searchResults.reduce((sum, r) => sum + r.score, 0) / searchResults.length;

        return {
            text: response,
            confidence: avgScore
        };
    }

    /**
     * Genere une reponse contextuelle generale
     */
    generateContextualResponse(userMessage, analysis, searchResults, config) {
        // Si on a des resultats de recherche, utiliser le contexte
        if (searchResults.length > 0) {
            return this.generateAnswerFromContext(userMessage, searchResults, config);
        }

        // Détecter si c'est une question générale (météo, heure, calcul, etc.)
        const generalQuestionKeywords = [
            'météo', 'meteo', 'temps', 'température', 'heure', 'date', 'calcul', 'combien',
            'capitale', 'president', 'weather', 'time', 'calculate', 'what is'
        ];

        const isGeneralQuestion = generalQuestionKeywords.some(keyword =>
            userMessage.toLowerCase().includes(keyword.toLowerCase())
        );

        if (isGeneralQuestion) {
            const response = {
                fr: `Je suis **DocuCortex**, un assistant spécialisé dans la recherche et l'analyse de documents GED.

Je ne peux pas répondre aux questions générales comme la météo, l'heure, ou des calculs.

**Mon expertise** :
• 🔍 Recherche dans votre base documentaire
• 📄 Analyse et résumé de documents (PDF, DOCX, Excel, etc.)
• 📊 Extraction d'informations depuis vos fichiers
• 💡 Suggestions de documents pertinents

**Pour que je puisse vous aider** :
✅ Posez-moi des questions sur vos documents indexés
✅ Demandez-moi de chercher dans votre base GED
✅ Uploadez des documents à analyser

*Configuration: Pour les questions générales, veuillez configurer l'API Gemini dans les paramètres IA.*`,
                es: `Soy **DocuCortex**, un asistente especializado en busqueda y analisis de documentos GED.

No puedo responder preguntas generales como el clima, la hora o calculos.

**Mi experiencia**:
• 🔍 Busqueda en tu base documental
• 📄 Analisis y resumen de documentos
• 📊 Extraccion de informacion de tus archivos

*Configuracion: Para preguntas generales, configure la API Gemini en la configuracion IA.*`
            };

            return {
                text: response[config.language] || response.fr,
                confidence: 0.6
            };
        }

        // Pour les questions sur les documents
        const responses = {
            fr: `Je comprends votre question, mais je n'ai pas trouvé d'information pertinente dans les documents indexés.

**Suggestions** :
• 📤 Uploadez des documents relatifs à votre question
• 🔍 Reformulez votre question avec plus de détails
• 📚 Vérifiez que les documents sont bien indexés

*Astuce: Je fonctionne mieux avec des questions précises sur le contenu de vos documents.*`,
            es: `Entiendo tu pregunta, pero no encontre informacion relevante en los documentos indexados.

**Sugerencias**:
• 📤 Sube documentos relacionados con tu pregunta
• 🔍 Reformula tu pregunta con mas detalles
• 📚 Verifica que los documentos esten bien indexados`
        };

        return {
            text: responses[config.language] || responses.fr,
            confidence: 0.4
        };
    }

    /**
     * Obtient l'historique d'une session
     */
    getSessionHistory(sessionId, limit = 20) {
        const session = this.sessions.get(sessionId);
        if (!session) return [];

        return session.history.slice(-limit);
    }

    /**
     * Nettoie les sessions inactives
     */
    cleanupInactiveSessions(maxAgeMinutes = 60) {
        const now = new Date();
        let cleaned = 0;

        this.sessions.forEach((session, sessionId) => {
            const ageMinutes = (now - session.lastActivity) / 1000 / 60;
            if (ageMinutes > maxAgeMinutes) {
                this.sessions.delete(sessionId);
                cleaned++;
            }
        });

        console.log(`Nettoyage: ${cleaned} session(s) inactive(s) supprimee(s)`);
        return cleaned;
    }

    /**
     * Obtient les statistiques des sessions
     */
    getStats() {
        return {
            activeSessions: this.sessions.size,
            totalMessages: Array.from(this.sessions.values())
                .reduce((sum, s) => sum + s.history.length, 0),
            avgMessagesPerSession: this.sessions.size > 0
                ? Array.from(this.sessions.values())
                    .reduce((sum, s) => sum + s.history.length, 0) / this.sessions.size
                : 0
        };
    }
}

module.exports = new ConversationService();
