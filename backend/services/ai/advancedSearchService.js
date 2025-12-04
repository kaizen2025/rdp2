/**
 * Service de recherche avancée avec filtres multiples
 * Permet des recherches ultra-précises dans la GED
 */

class AdvancedSearchService {
    constructor() {
        this.savedSearches = new Map(); // Cache des recherches sauvegardées
    }

    /**
     * 🔍 Recherche avancée avec filtres multiples
     */
    async searchWithFilters(query, filters = {}, options = {}) {
        try {
            console.log('[AdvancedSearch] Recherche avec filtres:', filters);

            const {
                keywords = [],
                dateRange = null,
                fileTypes = [],
                amountRange = null,
                author = null,
                category = null,
                tags = [],
                modifiedBy = null,
                status = null,
                hasAttachments = null,
                language = null,
                sortBy = 'relevance',
                limit = 50,
                offset = 0
            } = filters;

            // Construction de la requête SQL avec filtres
            let sqlQuery = `
                SELECT
                    d.*,
                    dm.file_size,
                    dm.word_count,
                    dm.page_count,
                    dm.author,
                    dm.category,
                    dm.tags,
                    dm.language,
                    dm.last_accessed_date
                FROM documents d
                LEFT JOIN document_metadata dm ON d.id = dm.document_id
                WHERE 1=1
            `;

            const params = [];
            let paramIndex = 1;

            // Filtre par mots-clés (recherche dans filename et content)
            if (keywords.length > 0) {
                const keywordConditions = keywords.map(kw => {
                    params.push(`%${kw}%`);
                    return `(d.filename LIKE $${paramIndex++} OR d.content LIKE $${paramIndex - 1})`;
                });
                sqlQuery += ` AND (${keywordConditions.join(' OR ')})`;
            }

            // Filtre par plage de dates
            if (dateRange) {
                if (dateRange.start) {
                    params.push(dateRange.start);
                    sqlQuery += ` AND d.date_added >= $${paramIndex++}`;
                }
                if (dateRange.end) {
                    params.push(dateRange.end);
                    sqlQuery += ` AND d.date_added <= $${paramIndex++}`;
                }
            }

            // Filtre par types de fichiers
            if (fileTypes.length > 0) {
                const typeConditions = fileTypes.map(type => {
                    params.push(`%.${type}%`);
                    return `d.filename LIKE $${paramIndex++}`;
                });
                sqlQuery += ` AND (${typeConditions.join(' OR ')})`;
            }

            // Filtre par catégorie
            if (category) {
                params.push(category);
                sqlQuery += ` AND dm.category = $${paramIndex++}`;
            }

            // Filtre par auteur
            if (author) {
                params.push(`%${author}%`);
                sqlQuery += ` AND dm.author LIKE $${paramIndex++}`;
            }

            // Filtre par tags
            if (tags.length > 0) {
                const tagConditions = tags.map(tag => {
                    params.push(`%${tag}%`);
                    return `dm.tags LIKE $${paramIndex++}`;
                });
                sqlQuery += ` AND (${tagConditions.join(' OR ')})`;
            }

            // Filtre par langue
            if (language) {
                params.push(language);
                sqlQuery += ` AND dm.language = $${paramIndex++}`;
            }

            // Tri
            switch (sortBy) {
                case 'date':
                    sqlQuery += ' ORDER BY d.date_added DESC';
                    break;
                case 'filename':
                    sqlQuery += ' ORDER BY d.filename ASC';
                    break;
                case 'size':
                    sqlQuery += ' ORDER BY dm.file_size DESC';
                    break;
                case 'relevance':
                default:
                    // Score de pertinence calculé
                    sqlQuery += ' ORDER BY d.id DESC'; // Temporaire
            }

            // Limite et offset
            params.push(limit);
            sqlQuery += ` LIMIT $${paramIndex++}`;

            if (offset > 0) {
                params.push(offset);
                sqlQuery += ` OFFSET $${paramIndex++}`;
            }

            console.log('[AdvancedSearch] SQL:', sqlQuery);
            console.log('[AdvancedSearch] Params:', params);

            // Exécution de la requête (à implémenter avec votre DB)
            // const results = await this.db.query(sqlQuery, params);

            // Pour l'instant, retour simulé
            return {
                success: true,
                results: [],
                total: 0,
                filters: filters,
                query: query,
                executionTime: Date.now()
            };

        } catch (error) {
            console.error('[AdvancedSearch] Erreur:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 💾 Sauvegarder une recherche fréquente
     */
    async saveSearch(userId, name, filters) {
        const searchId = `search_${Date.now()}`;

        this.savedSearches.set(searchId, {
            id: searchId,
            userId,
            name,
            filters,
            createdAt: new Date().toISOString(),
            useCount: 0
        });

        console.log(`[AdvancedSearch] Recherche sauvegardée: ${name}`);

        return {
            success: true,
            searchId,
            name
        };
    }

    /**
     * 📋 Récupérer les recherches sauvegardées d'un utilisateur
     */
    async getSavedSearches(userId) {
        const userSearches = Array.from(this.savedSearches.values())
            .filter(s => s.userId === userId)
            .sort((a, b) => b.useCount - a.useCount);

        return {
            success: true,
            searches: userSearches
        };
    }

    /**
     * 🎯 Suggestions de recherche intelligentes
     */
    async getSuggestions(partialQuery, userId = null) {
        const suggestions = [];

        // Suggestions basées sur les mots-clés fréquents
        const commonKeywords = [
            'facture', 'devis', 'contrat', 'rapport',
            'anecoop', 'client', 'fournisseur',
            'janvier', 'février', 'mars', '2025'
        ];

        const matching = commonKeywords.filter(kw =>
            kw.toLowerCase().includes(partialQuery.toLowerCase())
        );

        suggestions.push(...matching.map(kw => ({
            type: 'keyword',
            value: kw,
            display: `Rechercher "${kw}"`
        })));

        // Suggestions de filtres
        if (partialQuery.includes('2025') || partialQuery.includes('2024')) {
            suggestions.push({
                type: 'filter',
                value: 'dateRange',
                display: 'Filtrer par année'
            });
        }

        // Suggestions de recherches sauvegardées
        if (userId) {
            const saved = await this.getSavedSearches(userId);
            if (saved.success) {
                saved.searches.slice(0, 3).forEach(s => {
                    suggestions.push({
                        type: 'saved',
                        value: s.id,
                        display: `Recherche: ${s.name}`
                    });
                });
            }
        }

        return {
            success: true,
            suggestions: suggestions.slice(0, 10)
        };
    }

    /**
     * 📊 Statistiques de recherche
     */
    getSearchStats(results) {
        if (!results || results.length === 0) {
            return null;
        }

        const stats = {
            total: results.length,
            byFileType: {},
            byCategory: {},
            byAuthor: {},
            sizeRange: {
                min: Infinity,
                max: 0,
                avg: 0
            }
        };

        results.forEach(doc => {
            // Par type de fichier
            const ext = doc.filename?.split('.').pop()?.toLowerCase() || 'unknown';
            stats.byFileType[ext] = (stats.byFileType[ext] || 0) + 1;

            // Par catégorie
            if (doc.category) {
                stats.byCategory[doc.category] = (stats.byCategory[doc.category] || 0) + 1;
            }

            // Par auteur
            if (doc.author) {
                stats.byAuthor[doc.author] = (stats.byAuthor[doc.author] || 0) + 1;
            }

            // Taille
            if (doc.file_size) {
                stats.sizeRange.min = Math.min(stats.sizeRange.min, doc.file_size);
                stats.sizeRange.max = Math.max(stats.sizeRange.max, doc.file_size);
            }
        });

        // Moyenne de taille
        const sizes = results.filter(d => d.file_size).map(d => d.file_size);
        if (sizes.length > 0) {
            stats.sizeRange.avg = sizes.reduce((a, b) => a + b, 0) / sizes.length;
        }

        return stats;
    }
}

// Export singleton
const advancedSearchService = new AdvancedSearchService();

module.exports = advancedSearchService;
