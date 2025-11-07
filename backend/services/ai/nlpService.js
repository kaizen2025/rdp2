/**
 * Service de traitement du langage naturel (NLP)
 * Utilise node-nlp et compromise pour l'analyse linguistique
 */

const { NlpManager } = require('node-nlp');
const compromise = require('compromise');
const natural = require('natural');

class NLPService {
    constructor() {
        this.manager = null;
        this.tfidf = new natural.TfIdf();
        this.tokenizer = new natural.WordTokenizer();
        this.initialized = false;
    }

    /**
     * Initialise le manager NLP
     */
    async initialize() {
        if (this.initialized) return;

        try {
            this.manager = new NlpManager({ 
                languages: ['fr', 'es'],
                forceNER: true,
                nlu: { log: false }
            });

            // Entrainer le modele avec des intentions de base
            await this.trainBaseIntents();
            
            this.initialized = true;
            console.log('NLP Service initialise avec succes');
        } catch (error) {
            console.error('Erreur initialisation NLP:', error);
            throw error;
        }
    }

    /**
     * Entraine les intentions de base
     */
    async trainBaseIntents() {
        // INTENTION: Salutation
        this.manager.addDocument('fr', 'bonjour', 'salutation');
        this.manager.addDocument('fr', 'salut', 'salutation');
        this.manager.addDocument('fr', 'hello', 'salutation');
        this.manager.addDocument('fr', 'bonsoir', 'salutation');
        this.manager.addDocument('es', 'hola', 'salutation');
        this.manager.addDocument('es', 'buenos dias', 'salutation');
        
        this.manager.addAnswer('fr', 'salutation', 'Bonjour! Comment puis-je vous aider?');
        this.manager.addAnswer('es', 'salutation', 'Hola! Como puedo ayudarte?');

        // INTENTION: Recherche document
        this.manager.addDocument('fr', 'chercher un document', 'recherche.document');
        this.manager.addDocument('fr', 'trouver un fichier', 'recherche.document');
        this.manager.addDocument('fr', 'rechercher %document%', 'recherche.document');
        this.manager.addDocument('fr', 'ou est le document %document%', 'recherche.document');
        this.manager.addDocument('es', 'buscar un documento', 'recherche.document');
        this.manager.addDocument('es', 'encontrar archivo', 'recherche.document');

        // INTENTION: Question generale
        this.manager.addDocument('fr', 'quest ce que', 'question.generale');
        this.manager.addDocument('fr', 'peux tu expliquer', 'question.generale');
        this.manager.addDocument('fr', 'dis moi', 'question.generale');
        this.manager.addDocument('fr', 'comment', 'question.generale');
        this.manager.addDocument('es', 'que es', 'question.generale');
        this.manager.addDocument('es', 'explicame', 'question.generale');

        // INTENTION: Aide
        this.manager.addDocument('fr', 'aide', 'aide');
        this.manager.addDocument('fr', 'aidez moi', 'aide');
        this.manager.addDocument('fr', 'comment ca marche', 'aide');
        this.manager.addDocument('fr', 'que peux tu faire', 'aide');
        this.manager.addDocument('es', 'ayuda', 'aide');
        this.manager.addDocument('es', 'ayudame', 'aide');

        this.manager.addAnswer('fr', 'aide', 
            'Je suis votre assistant IA local. Je peux vous aider a:\n' +
            '- Rechercher dans vos documents\n' +
            '- Repondre a vos questions sur le contenu indexe\n' +
            '- Analyser et extraire des informations\n' +
            'Uploadez des documents pour commencer!'
        );

        // Entrainer le modele
        await this.manager.train();
        console.log('Modele NLP entraine avec succes');
    }

    /**
     * Analyse un message utilisateur
     */
    async analyze(text, language = 'fr') {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            // Analyse avec node-nlp
            const nlpResult = await this.manager.process(language, text);

            // Analyse avec compromise pour extraction d'entites
            const doc = compromise(text);
            const entities = {
                people: doc.people().out('array'),
                places: doc.places().out('array'),
                organizations: doc.organizations().out('array'),
                // dates: doc.dates().out('array'), // ❌ RETIRÉE - méthode non disponible dans compromise
                numbers: doc.numbers().out('array'),
                verbs: doc.verbs().out('array'),
                nouns: doc.nouns().out('array')
            };

            // Tokenization
            const tokens = this.tokenizer.tokenize(text.toLowerCase());

            // Sentiment (simple)
            const sentiment = this.analyzeSentiment(text);

            return {
                intent: nlpResult.intent,
                confidence: nlpResult.score,
                entities: nlpResult.entities,
                extractedEntities: entities,
                tokens: tokens,
                sentiment: sentiment,
                language: nlpResult.language,
                originalText: text
            };
        } catch (error) {
            console.error('Erreur analyse NLP:', error);
            return {
                intent: 'unknown',
                confidence: 0,
                entities: [],
                extractedEntities: {},
                tokens: [],
                sentiment: 'neutral',
                language: language,
                originalText: text,
                error: error.message
            };
        }
    }

    /**
     * Analyse simple du sentiment
     */
    analyzeSentiment(text) {
        const positiveWords = [
            'bon', 'bien', 'excellent', 'super', 'genial', 'parfait', 
            'merci', 'bravo', 'formidable', 'agreable'
        ];
        const negativeWords = [
            'mauvais', 'mal', 'probleme', 'erreur', 'bug', 'defaut',
            'nul', 'horrible', 'terrible', 'ennuyeux'
        ];

        const lowerText = text.toLowerCase();
        let score = 0;

        positiveWords.forEach(word => {
            if (lowerText.includes(word)) score++;
        });

        negativeWords.forEach(word => {
            if (lowerText.includes(word)) score--;
        });

        if (score > 0) return 'positive';
        if (score < 0) return 'negative';
        return 'neutral';
    }

    /**
     * Extrait les mots-cles d'un texte
     */
    extractKeywords(text, maxKeywords = 10) {
        try {
            // Tokenization et nettoyage
            const tokens = this.tokenizer.tokenize(text.toLowerCase());
            
            // Mots vides (stop words) francais
            const stopWords = new Set([
                'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 
                'ou', 'est', 'sont', 'dans', 'sur', 'pour', 'avec', 'par',
                'ce', 'ces', 'cet', 'cette', 'il', 'elle', 'on', 'nous',
                'vous', 'ils', 'elles', 'a', 'au', 'aux', 'en', 'y', 'qui',
                'que', 'quoi', 'dont', 'se', 'si', 'ne', 'pas', 'plus',
                'mais', 'comme', 'tout', 'tous', 'toute', 'toutes'
            ]);

            // Filtrer les stop words et garder mots significatifs
            const filteredTokens = tokens.filter(token => 
                token.length > 3 && !stopWords.has(token)
            );

            // Compter les occurrences
            const frequency = {};
            filteredTokens.forEach(token => {
                frequency[token] = (frequency[token] || 0) + 1;
            });

            // Trier par frequence
            const sortedKeywords = Object.entries(frequency)
                .sort((a, b) => b[1] - a[1])
                .slice(0, maxKeywords)
                .map(([word, count]) => ({ word, count }));

            return sortedKeywords;
        } catch (error) {
            console.error('Erreur extraction mots-cles:', error);
            return [];
        }
    }

    /**
     * Calcule la similarite entre deux textes (cosine similarity)
     */
    calculateSimilarity(text1, text2) {
        try {
            const tokens1 = new Set(this.tokenizer.tokenize(text1.toLowerCase()));
            const tokens2 = new Set(this.tokenizer.tokenize(text2.toLowerCase()));

            const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
            const union = new Set([...tokens1, ...tokens2]);

            // Jaccard similarity
            const similarity = intersection.size / union.size;

            return similarity;
        } catch (error) {
            console.error('Erreur calcul similarite:', error);
            return 0;
        }
    }

    /**
     * Genere un resume d'un texte
     */
    generateSummary(text, maxSentences = 3) {
        try {
            const doc = compromise(text);
            const sentences = doc.sentences().out('array');

            if (sentences.length <= maxSentences) {
                return text;
            }

            // Prendre les premieres et dernieres phrases
            const summary = [
                ...sentences.slice(0, Math.floor(maxSentences / 2)),
                ...sentences.slice(-Math.ceil(maxSentences / 2))
            ].join(' ');

            return summary;
        } catch (error) {
            console.error('Erreur generation resume:', error);
            return text.substring(0, 500) + '...';
        }
    }

    /**
     * Ajoute un document au corpus TF-IDF
     */
    addDocumentToCorpus(text, documentId) {
        this.tfidf.addDocument(text, documentId);
    }

    /**
     * Recherche les documents pertinents avec TF-IDF
     */
    searchDocuments(query, maxResults = 5) {
        const results = [];
        
        this.tfidf.tfidfs(query, (i, measure, key) => {
            results.push({
                documentId: key,
                score: measure
            });
        });

        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, maxResults);
    }
}

module.exports = new NLPService();
