/**
 * Service de Recherche Sémantique Avancée
 * Utilise text-embedding-004 + Similarité Cosinus pour ranking intelligent
 */

const geminiService = require('./geminiService');

class SemanticSearchService {
    constructor() {
        this.documentsCache = new Map(); // Cache documents avec embeddings
        this.initialized = false;
    }

    /**
     * Recherche sémantique avec ranking par similarité cosinus
     */
    async search(query, options = {}) {
        try {
            console.log('[SemanticSearch] 🔍 Recherche:', query);

            const {
                maxResults = 10,
                minScore = 0.3,
                filters = {},
                includeMetadata = true
            } = options;

            // === 1. Générer embedding de la requête ===
            const queryEmbedding = await this.generateQueryEmbedding(query);

            if (!queryEmbedding) {
                console.warn('[SemanticSearch] ⚠️ Pas d\'embedding, fallback recherche texte');
                return await this.fallbackTextSearch(query, options);
            }

            // === 2. Récupérer documents avec embeddings ===
            const documents = await this.getDocumentsWithEmbeddings(filters);

            console.log(`[SemanticSearch] 📚 ${documents.length} documents à analyser`);

            // === 3. Calculer similarités cosinus ===
            const results = [];

            for (const doc of documents) {
                if (!doc.embedding || doc.embedding.length === 0) {
                    continue;
                }

                const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding);

                if (similarity >= minScore) {
                    results.push({
                        ...doc,
                        score: similarity,
                        scorePercentage: Math.round(similarity * 100)
                    });
                }
            }

            // === 4. Trier par score décroissant ===
            results.sort((a, b) => b.score - a.score);

            // === 5. Limiter résultats ===
            const topResults = results.slice(0, maxResults);

            console.log(`[SemanticSearch] ✅ ${topResults.length} résultats trouvés`);

            return {
                success: true,
                query: query,
                results: topResults.map(r => this.formatResult(r, includeMetadata)),
                totalFound: results.length,
                method: 'semantic_cosine',
                metadata: {
                    queryEmbeddingDim: queryEmbedding.length,
                    documentsScanned: documents.length,
                    minScore: minScore,
                    maxResults: maxResults
                }
            };

        } catch (error) {
            console.error('[SemanticSearch] ❌ Erreur recherche:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Calcul de similarité cosinus entre deux vecteurs
     */
    cosineSimilarity(vecA, vecB) {
        if (!vecA || !vecB || vecA.length !== vecB.length) {
            console.warn('[SemanticSearch] Vecteurs invalides pour cosinus');
            return 0;
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        normA = Math.sqrt(normA);
        normB = Math.sqrt(normB);

        if (normA === 0 || normB === 0) {
            return 0;
        }

        const similarity = dotProduct / (normA * normB);

        // Normaliser entre 0 et 1
        return Math.max(0, Math.min(1, similarity));
    }

    /**
     * Génère embedding pour la requête utilisateur
     */
    async generateQueryEmbedding(query) {
        try {
            console.log('[SemanticSearch] 🧠 Génération embedding requête...');

            const result = await geminiService.generateEmbedding(query);

            if (result.success) {
                console.log(`[SemanticSearch] ✅ Embedding généré (${result.dimensions} dim)`);
                return result.embedding;
            }

            return null;

        } catch (error) {
            console.error('[SemanticSearch] Erreur embedding requête:', error);
            return null;
        }
    }

    /**
     * Récupère documents avec leurs embeddings (depuis DB ou cache)
     */
    async getDocumentsWithEmbeddings(filters = {}) {
        try {
            // TODO: Implémenter récupération depuis vraie DB
            // Pour l'instant, retourne depuis cache ou mock data

            if (this.documentsCache.size > 0) {
                let docs = Array.from(this.documentsCache.values());

                // Appliquer filtres
                if (filters.category) {
                    docs = docs.filter(d => d.category === filters.category);
                }
                if (filters.dateFrom) {
                    docs = docs.filter(d => new Date(d.modifiedDate) >= new Date(filters.dateFrom));
                }
                if (filters.dateTo) {
                    docs = docs.filter(d => new Date(d.modifiedDate) <= new Date(filters.dateTo));
                }

                return docs;
            }

            // Mock data pour tests
            return this.getMockDocuments();

        } catch (error) {
            console.error('[SemanticSearch] Erreur récupération documents:', error);
            return [];
        }
    }

    /**
     * Recherche texte fallback si embeddings non disponibles
     */
    async fallbackTextSearch(query, options = {}) {
        console.log('[SemanticSearch] 📝 Fallback recherche texte simple');

        const documents = await this.getDocumentsWithEmbeddings(options.filters);
        const lowerQuery = query.toLowerCase();

        const results = documents
            .map(doc => {
                const content = (doc.content || '').toLowerCase();
                const filename = (doc.filename || '').toLowerCase();

                // Score basé sur occurrences et position
                let score = 0;
                const queryWords = lowerQuery.split(' ');

                queryWords.forEach(word => {
                    if (filename.includes(word)) score += 0.5;
                    if (content.includes(word)) score += 0.3;
                });

                return {
                    ...doc,
                    score: Math.min(1, score),
                    scorePercentage: Math.round(Math.min(100, score * 100))
                };
            })
            .filter(r => r.score >= (options.minScore || 0.1))
            .sort((a, b) => b.score - a.score)
            .slice(0, options.maxResults || 10);

        return {
            success: true,
            query: query,
            results: results.map(r => this.formatResult(r, options.includeMetadata)),
            totalFound: results.length,
            method: 'text_fallback'
        };
    }

    /**
     * Recherche hybride: Sémantique + Texte
     */
    async hybridSearch(query, options = {}) {
        try {
            console.log('[SemanticSearch] 🔀 Recherche hybride');

            // Recherche sémantique
            const semanticResults = await this.search(query, {
                ...options,
                maxResults: options.maxResults * 2 // Double pour fusion
            });

            // Recherche texte
            const textResults = await this.fallbackTextSearch(query, {
                ...options,
                maxResults: options.maxResults * 2
            });

            // Fusion avec pondération
            const combined = this.mergeResults(
                semanticResults.results || [],
                textResults.results || [],
                {
                    semanticWeight: 0.7,
                    textWeight: 0.3
                }
            );

            return {
                success: true,
                query: query,
                results: combined.slice(0, options.maxResults || 10),
                totalFound: combined.length,
                method: 'hybrid_semantic_text',
                breakdown: {
                    semantic: semanticResults.results?.length || 0,
                    text: textResults.results?.length || 0,
                    merged: combined.length
                }
            };

        } catch (error) {
            console.error('[SemanticSearch] Erreur recherche hybride:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Fusionne résultats avec pondération
     */
    mergeResults(semanticResults, textResults, weights) {
        const merged = new Map();

        // Ajouter résultats sémantiques
        semanticResults.forEach(result => {
            merged.set(result.id || result.filename, {
                ...result,
                finalScore: result.score * weights.semanticWeight,
                sources: ['semantic']
            });
        });

        // Ajouter/fusionner résultats texte
        textResults.forEach(result => {
            const existing = merged.get(result.id || result.filename);

            if (existing) {
                // Document trouvé dans les deux
                existing.finalScore += result.score * weights.textWeight;
                existing.sources.push('text');
            } else {
                // Nouveau document
                merged.set(result.id || result.filename, {
                    ...result,
                    finalScore: result.score * weights.textWeight,
                    sources: ['text']
                });
            }
        });

        // Convertir en array et trier
        return Array.from(merged.values())
            .sort((a, b) => b.finalScore - a.finalScore)
            .map(r => ({
                ...r,
                score: r.finalScore,
                scorePercentage: Math.round(r.finalScore * 100)
            }));
    }

    /**
     * Formate un résultat de recherche
     */
    formatResult(result, includeMetadata = true) {
        const formatted = {
            filename: result.filename,
            filepath: result.filepath,
            score: result.score,
            scorePercentage: result.scorePercentage,
            snippet: this.generateSnippet(result.content, 200)
        };

        if (includeMetadata) {
            formatted.metadata = {
                size: result.size,
                modifiedDate: result.modifiedDate,
                category: result.category,
                author: result.author,
                sources: result.sources
            };
        }

        return formatted;
    }

    /**
     * Génère extrait pertinent du contenu
     */
    generateSnippet(content, maxLength = 200) {
        if (!content) return '';
        return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
    }

    /**
     * Ajoute document au cache avec embedding
     */
    async addDocumentToCache(document) {
        if (!document.embedding && document.content) {
            const embeddingResult = await geminiService.generateEmbedding(document.content);
            if (embeddingResult.success) {
                document.embedding = embeddingResult.embedding;
            }
        }

        this.documentsCache.set(document.id || document.filename, document);
        console.log(`[SemanticSearch] 💾 Document ajouté au cache: ${document.filename}`);
    }

    /**
     * Vide le cache
     */
    clearCache() {
        this.documentsCache.clear();
        console.log('[SemanticSearch] 🗑️  Cache vidé');
    }

    /**
     * Mock documents pour tests
     */
    getMockDocuments() {
        return [
            {
                id: 1,
                filename: 'Offre_Prix_Mars_2024.pdf',
                filepath: '\\\\192.168.1.230\\Donnees\\Commercial\\Offres\\Offre_Prix_Mars_2024.pdf',
                content: 'Offre de prix pour le mois de mars 2024. Produits fruits et légumes. Tarifs clients.',
                embedding: Array(768).fill(0).map(() => Math.random()),
                size: 125000,
                modifiedDate: '2024-03-01',
                category: 'commercial',
                author: 'Service Commercial'
            },
            {
                id: 2,
                filename: 'Rapport_Qualite_Q1_2024.docx',
                filepath: '\\\\192.168.1.230\\Donnees\\Qualite\\Rapports\\Rapport_Qualite_Q1_2024.docx',
                content: 'Rapport qualité premier trimestre 2024. Audits réalisés. Certifications ISO.',
                embedding: Array(768).fill(0).map(() => Math.random()),
                size: 85000,
                modifiedDate: '2024-03-15',
                category: 'qualite',
                author: 'Responsable Qualité'
            }
        ];
    }

    /**
     * Statistiques
     */
    getStats() {
        return {
            cacheSize: this.documentsCache.size,
            initialized: this.initialized
        };
    }
}

module.exports = new SemanticSearchService();
