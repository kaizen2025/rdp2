/**
 * Service de génération de réponses intelligentes - DocuCortex
 * Réponses structurées avec citations, suggestions, scoring
 */
class IntelligentResponseService {
    constructor() {
        this.intents = {
            greeting: ['bonjour', 'salut', 'hello', 'hi', 'bonsoir'],
            search: ['trouve', 'cherche', 'recherche', 'où', 'quel', 'quand'],
            summary: ['résume', 'synthèse', 'résumé', 'overview'],
            comparison: ['compare', 'différence', 'versus', 'vs']
        };
    }

    detectIntent(query) {
        const lower = query.toLowerCase();
        for (const [intent, keywords] of Object.entries(this.intents)) {
            if (keywords.some(kw => lower.includes(kw))) return intent;
        }
        return 'search';
    }

    async generateStructuredResponse(query, relevantDocs, intent) {
        let response = '';

        if (intent === 'greeting') {
            response = `🧠 **Bonjour! Je suis DocuCortex**, votre assistant GED intelligent.\n\nComment puis-je vous aider?`;
            return { text: response, citations: [], suggestions: this.getDefaultSuggestions() };
        }

        if (relevantDocs.length === 0) {
            response = `❌ Aucun document trouvé pour: "${query}"\n\n`;
            response += `💡 **Suggestions:**\n`;
            response += `• Essayez des mots-clés plus généraux\n`;
            response += `• Vérifiez l'orthographe\n`;
            response += `• Utilisez des synonymes`;
            return { text: response, citations: [], suggestions: [] };
        }

        // Introduction
        response += `📚 **${relevantDocs.length} document(s) pertinent(s) trouvé(s)**\n\n`;

        // Citations pour chaque document
        relevantDocs.forEach((doc, i) => {
            const citation = `[${i + 1}] ${doc.filename}`;
            const score = Math.round(doc.score * 100);

            response += `${citation}\n`;
            response += `📌 **Source:** \`${doc.networkPath || 'Local'}\`\n`;
            response += `📊 **Pertinence:** ${score}% `;
            response += score >= 80 ? '🟢' : score >= 50 ? '🟡' : '🟠';
            response += `\n`;

            if (doc.excerpt) {
                response += `📄 **Extrait:** "${doc.excerpt.substring(0, 200)}..."\n`;
            }

            response += `\n`;
        });

        // Suggestions questions
        const suggestions = this.generateRelatedQuestions(query, relevantDocs);
        if (suggestions.length > 0) {
            response += `\n❓ **Questions liées suggérées:**\n`;
            suggestions.forEach(q => response += `• ${q}\n`);
        }

        return {
            text: response,
            citations: relevantDocs.map(d => ({ id: d.id, filename: d.filename, path: d.networkPath })),
            suggestions
        };
    }

    /**
     * ✅ NOUVELLE MÉTHODE - Alias avec enrichissement pour aiService.js
     */
    generateEnrichedResponse(query, enrichedResults) {
        // Détecter l'intention
        const intent = this.detectIntent(query);

        // Formater les documents pour generateStructuredResponse
        const formattedDocs = enrichedResults.map(result => ({
            id: result.documentId,
            filename: result.metadata.filename,
            score: result.score,
            networkPath: result.metadata.filepath || result.metadata.relativePath,
            excerpt: this.extractExcerpt(result.content, query),
            metadata: result.metadata
        }));

        // Appeler la méthode principale
        const structuredResponse = this.generateStructuredResponse(query, formattedDocs, intent);

        // Enrichir avec attachments
        const attachments = formattedDocs.map(doc => ({
            documentId: doc.id,
            filename: doc.filename,
            networkPath: doc.networkPath,
            canPreview: this.isPreviewable(doc.filename),
            canDownload: true,
            score: Math.round(doc.score * 100)
        }));

        return {
            text: structuredResponse.text,
            confidence: this.calculateConfidence(formattedDocs),
            sources: formattedDocs.map(d => ({
                id: d.id,
                filename: d.filename,
                path: d.networkPath,
                score: Math.round(d.score * 100)
            })),
            attachments: attachments,
            suggestions: structuredResponse.suggestions,
            metadata: {
                totalDocuments: formattedDocs.length,
                averageScore: this.calculateAverageScore(formattedDocs),
                intent: intent
            }
        };
    }

    /**
     * Extrait un extrait pertinent du contenu
     */
    extractExcerpt(content, query) {
        if (!content) return '';

        const queryWords = query.toLowerCase().split(' ').filter(w => w.length > 2);
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);

        // Chercher la phrase la plus pertinente
        let bestSentence = sentences[0] || '';
        let bestScore = 0;

        sentences.forEach(sentence => {
            let score = 0;
            queryWords.forEach(word => {
                if (sentence.toLowerCase().includes(word)) {
                    score++;
                }
            });
            if (score > bestScore) {
                bestScore = score;
                bestSentence = sentence;
            }
        });

        return bestSentence.trim().substring(0, 300);
    }

    /**
     * Vérifie si le fichier est prévisualisable
     */
    isPreviewable(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        return ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'txt', 'md'].includes(ext);
    }

    /**
     * Calcule le score de confiance global
     */
    calculateConfidence(docs) {
        if (docs.length === 0) return 0;
        const avgScore = docs.reduce((sum, d) => sum + d.score, 0) / docs.length;
        return Math.min(avgScore, 1);
    }

    /**
     * Calcule le score moyen
     */
    calculateAverageScore(docs) {
        if (docs.length === 0) return 0;
        return Math.round(docs.reduce((sum, d) => sum + (d.score * 100), 0) / docs.length);
    }

    generateRelatedQuestions(query, docs) {
        const questions = [];
        
        // Basé sur les mots-clés des documents
        const keywords = new Set();
        docs.forEach(doc => {
            if (doc.metadata && doc.metadata.keywords) {
                doc.metadata.keywords.slice(0, 3).forEach(kw => keywords.add(kw));
            }
        });

        const keywordArray = Array.from(keywords).slice(0, 5);
        
        if (keywordArray.length > 0) {
            questions.push(`Quels sont les documents sur ${keywordArray[0]}?`);
            if (keywordArray.length > 1) {
                questions.push(`Y a-t-il des informations sur ${keywordArray[1]}?`);
            }
        }

        // Questions génériques
        if (docs.length > 1) {
            questions.push(`Peux-tu comparer ces ${docs.length} documents?`);
        }
        
        questions.push(`Quand ces documents ont-ils été créés?`);
        questions.push(`Qui a créé ces documents?`);

        return questions.slice(0, 5);
    }

    getDefaultSuggestions() {
        return [
            'Trouve les offres de prix récentes',
            'Quels sont les rapports de cette année?',
            'Cherche les documents techniques',
            'Liste les factures du mois dernier',
            'Où sont les contrats clients?'
        ];
    }

    scoreDocument(doc, query) {
        let score = 0;
        const queryWords = query.toLowerCase().split(' ').filter(w => w.length > 2);
        const docText = (doc.filename + ' ' + (doc.content || '')).toLowerCase();

        queryWords.forEach(word => {
            const count = (docText.match(new RegExp(word, 'g')) || []).length;
            score += count * 10;
        });

        return Math.min(score / 100, 1);
    }
}

module.exports = new IntelligentResponseService();
