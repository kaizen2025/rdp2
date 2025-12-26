/**
 * Service de Classification d'Intent Ultra-Intelligent
 * Utilise NLP + patterns + contexte pour déterminer l'intent avec précision
 */

const nlpService = require('./nlpService');

class IntentClassificationService {
    constructor() {
        this.intents = {
            factual_question: {
                description: "Question factuelle nécessitant une réponse générale (pas de documents)",
                keywords: ['quelle', 'quel', 'qui', 'combien', 'quand', 'pourquoi', 'comment', 'définition', 'expliquer'],
                patterns: [
                    /^(quelle?|qui est|combien|quand|où|pourquoi|comment)/i,
                    /(météo|température|heure actuelle|date du jour|capitale|définition)/i,
                    /(qu'est-ce que|c'est quoi|expliquer)/i
                ],
                antiPatterns: [
                    /(document|fichier|rapport|pdf|excel|dossier|serveur)/i
                ],
                weight: 1.0
            },
            document_search: {
                description: "Recherche de documents dans le système GED",
                keywords: ['trouve', 'cherche', 'recherche', 'affiche', 'montre', 'liste', 'voir', 'procédure', 'document', 'fichier'],
                patterns: [
                    /(trouve|cherche|recherche|affiche|montre).*\b(document|fichier|rapport|pdf|excel|word|dossier)\b/i,
                    /\b(dans|sur)\s+(le|la|les)?\s*(serveur|réseau|dossier|répertoire|drive)/i,
                    /(rapport|facture|contrat|devis|compte-rendu|procès-verbal).*\b(de|du|des)\b/i,
                    /\b(pdf|xlsx?|docx?|pptx?).*\b(de|du|des|contenant)\b/i,
                    // ✅ NOUVEAU: Patterns pour procédures et tutoriels
                    /(procédure|procedure|comment faire|tutoriel|guide|mode d'emploi|marche à suivre)/i,
                    /(où trouver|où est|existe.+document|documentation)/i,
                    /(formation|manuel|instructions?|étapes?)/i
                ],
                documentTypes: ['pdf', 'xlsx', 'docx', 'rapport', 'facture', 'contrat', 'devis', 'procedure', 'guide'],
                weight: 1.3 // Prioritaire pour DocuCortex - augmenté
            },
            document_analysis: {
                description: "Analyse ou résumé d'un document spécifique",
                keywords: ['résume', 'analyse', 'explique', 'compare', 'synthèse', 'extrait'],
                patterns: [
                    /(résume|analyse|explique|compare|synthétise).*\b(ce|cette|le|la|les)\b/i,
                    /\b(résumé|synthèse|analyse|comparaison|extrait)\s+(de|du)\b/i,
                    /que (dit|contient|indique|mentionne)/i
                ],
                requiresContext: true, // Nécessite un contexte de recherche précédent
                weight: 1.1
            },
            web_search: {
                description: "Recherche web pour informations temps réel",
                keywords: ['météo', 'actualité', 'news', 'résultat', 'match', 'score', 'aujourd\'hui', 'hier'],
                patterns: [
                    /\b(météo|weather|température)\b/i,
                    /\b(actualité|news|nouvelles)\b/i,
                    /\b(match|résultat|score|ligue|champions|coupe)\b.*\b(hier|aujourd'hui|ce soir)\b/i,
                    /\b(cours|bourse|action|bitcoin|crypto)/i
                ],
                weight: 1.0
            },
            app_command: {
                description: "Commande applicative (ouvrir, lister, créer dans l'app)",
                keywords: ['ouvre', 'lance', 'affiche', 'liste', 'crée', 'supprime', 'modifie'],
                patterns: [
                    /^(ouvre|lance|affiche|liste|montre)\s+(les?\s+)?(prêt|ordinateur|serveur|session|utilisateur|technicien)/i,
                    /(créer|ajouter|supprimer|modifier)\s+(un|une)\s+(prêt|ordinateur|utilisateur)/i
                ],
                weight: 1.0
            },
            conversation: {
                description: "Conversation générale ou continuation de contexte",
                keywords: ['merci', 'ok', 'oui', 'non', 'peut-être', 'continue', 'et puis', 'explique-moi plus'],
                patterns: [
                    /^(merci|ok|d'accord|oui|non|peut-être|bien|super|génial)/i,
                    /\b(explique-moi|dis-moi|raconte|détaille|continue|et puis|et alors|pourquoi)\b/i,
                    /^(le|la|les|ce|cette|ces|ça)\b/i // Pronoms de référence
                ],
                requiresContext: true,
                weight: 0.8
            }
        };

        this.contextMemory = new Map(); // Stockage du contexte par session
    }

    /**
     * Classifie l'intent d'une requête avec scoring multi-critères
     * @param {string} query - La requête utilisateur
     * @param {object} context - Contexte de la conversation
     * @returns {object} - { intent, confidence, alternates, reasoning }
     */
    async classify(query, context = {}) {
        const { sessionId, lastIntent, lastSearchContext, conversationHistory = [] } = context;

        console.log(`\n🎯 [Intent] Classification de: "${query}"`);
        console.log(`📍 [Intent] Session: ${sessionId}, Dernier intent: ${lastIntent || 'aucun'}`);

        const lower = query.toLowerCase().trim();
        const scores = {};
        const reasonings = {};

        // Analyse NLP si disponible
        let nlpEntities = [];
        let nlpSentiment = null;
        if (nlpService && nlpService.extractEntities) {
            try {
                nlpEntities = await nlpService.extractEntities(query);
                nlpSentiment = await nlpService.analyzeSentiment(query);
            } catch (error) {
                console.warn('[Intent] NLP non disponible:', error.message);
            }
        }

        // Score chaque intent
        for (const [intentName, intentConfig] of Object.entries(this.intents)) {
            let score = 0;
            const reasoning = [];

            // 1. Keywords matching (20%)
            const keywordMatches = intentConfig.keywords.filter(kw => lower.includes(kw));
            const keywordScore = keywordMatches.length > 0 ? (keywordMatches.length / intentConfig.keywords.length) * 0.20 : 0;
            score += keywordScore;
            if (keywordScore > 0) {
                reasoning.push(`Keywords: ${keywordMatches.join(', ')} (+${Math.round(keywordScore * 100)}%)`);
            }

            // 2. Pattern matching (30%)
            const patternMatches = intentConfig.patterns.filter(pattern => pattern.test(query));
            const patternScore = patternMatches.length > 0 ? Math.min(patternMatches.length / intentConfig.patterns.length, 1.0) * 0.30 : 0;
            score += patternScore;
            if (patternScore > 0) {
                reasoning.push(`Patterns: ${patternMatches.length} match(es) (+${Math.round(patternScore * 100)}%)`);
            }

            // 3. Anti-patterns (pénalité)
            if (intentConfig.antiPatterns) {
                const hasAntiPattern = intentConfig.antiPatterns.some(pattern => pattern.test(query));
                if (hasAntiPattern) {
                    score *= 0.3; // Réduction drastique
                    reasoning.push(`Anti-pattern détecté (-70%)`);
                }
            }

            // 4. NLP Entities (20%)
            if (nlpEntities.length > 0 && intentConfig.documentTypes) {
                const hasDocType = intentConfig.documentTypes.some(type =>
                    nlpEntities.some(e => e.text.toLowerCase().includes(type))
                );
                if (hasDocType) {
                    score += 0.20;
                    reasoning.push(`NLP: Type document détecté (+20%)`);
                }
            }

            // 5. Context awareness (20%)
            if (intentConfig.requiresContext) {
                if (lastIntent && lastSearchContext) {
                    // Bonus si continuation logique
                    if (lastIntent === 'document_search' && intentName === 'document_analysis') {
                        score += 0.20;
                        reasoning.push(`Contexte: Continuation de recherche (+20%)`);
                    } else if (lastIntent && intentName === 'conversation') {
                        score += 0.15;
                        reasoning.push(`Contexte: Conversation en cours (+15%)`);
                    }
                } else if (intentConfig.requiresContext && !lastSearchContext) {
                    // Pénalité si contexte requis mais absent
                    score *= 0.5;
                    reasoning.push(`Contexte: Manquant (-50%)`);
                }
            }

            // 6. Pronoms de référence (bonus conversation)
            if (intentName === 'conversation' || intentName === 'document_analysis') {
                const hasReference = /^(le|la|les|ce|cette|ces|ça|celui|celle)\b/i.test(query);
                if (hasReference && lastSearchContext) {
                    score += 0.10;
                    reasoning.push(`Référence contextuelle (+10%)`);
                }
            }

            // 7. Longueur de la requête (facteur)
            if (intentName === 'conversation' && query.length < 20) {
                score += 0.05;
                reasoning.push(`Requête courte: conversation probable (+5%)`);
            }

            // 8. Apply intent weight
            score *= intentConfig.weight;
            if (intentConfig.weight !== 1.0) {
                reasoning.push(`Poids intent: x${intentConfig.weight}`);
            }

            // Cap à 1.0
            score = Math.min(score, 1.0);

            scores[intentName] = score;
            reasonings[intentName] = reasoning;
        }

        // Trouver les meilleurs intents
        const sortedIntents = Object.entries(scores)
            .sort((a, b) => b[1] - a[1])
            .map(([intent, score]) => ({
                intent,
                score,
                reasoning: reasonings[intent]
            }));

        const bestIntent = sortedIntents[0];
        const alternates = sortedIntents.slice(1, 3);

        // Log du résultat
        console.log(`✅ [Intent] Résultat: ${bestIntent.intent} (confiance: ${Math.round(bestIntent.score * 100)}%)`);
        console.log(`📊 [Intent] Reasoning: ${bestIntent.reasoning.join(', ')}`);
        if (alternates.length > 0) {
            console.log(`🔄 [Intent] Alternates: ${alternates.map(a => `${a.intent}(${Math.round(a.score * 100)}%)`).join(', ')}`);
        }

        // Sauvegarder le contexte
        if (sessionId) {
            this.contextMemory.set(sessionId, {
                lastQuery: query,
                lastIntent: bestIntent.intent,
                timestamp: Date.now()
            });
        }

        return {
            intent: bestIntent.intent,
            confidence: bestIntent.score,
            alternates: alternates.map(a => ({ intent: a.intent, score: a.score })),
            reasoning: bestIntent.reasoning,
            description: this.intents[bestIntent.intent].description
        };
    }

    /**
     * Obtient le contexte d'une session
     */
    getContext(sessionId) {
        return this.contextMemory.get(sessionId) || null;
    }

    /**
     * Nettoie les contextes expirés (> 1h)
     */
    cleanupExpiredContexts() {
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        for (const [sessionId, context] of this.contextMemory.entries()) {
            if (context.timestamp < oneHourAgo) {
                this.contextMemory.delete(sessionId);
            }
        }
    }
}

// Singleton
const intentClassificationService = new IntentClassificationService();

// Cleanup périodique (toutes les 30 minutes)
setInterval(() => {
    intentClassificationService.cleanupExpiredContexts();
}, 30 * 60 * 1000);

module.exports = intentClassificationService;
