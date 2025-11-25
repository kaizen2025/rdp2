// src/services/searchService.js - SERVICE CENTRAL DE RECHERCHE INTELLIGENTE DOCUCORTEX
// Service unifié pour la recherche, l'indexation et les performances

import Fuse from 'fuse.js';
import lunr from 'lunr';

// Configuration des indexes et des caches
class SearchIndex {
    constructor() {
        this.fuseIndex = null;
        this.lunrIndex = null;
        this.documentMap = new Map();
        this.lastUpdated = null;
        this.buildStats = {
            documentsIndexed: 0,
            buildTime: 0,
            memoryUsage: 0
        };
    }

    // Construire les index à partir des données
    buildIndex(documents) {
        const startTime = performance.now();
        
        try {
            // Préparer les documents pour l'indexation
            const indexedDocuments = documents.map(doc => ({
                ...doc,
                _searchableText: this.prepareDocumentForSearch(doc)
            }));

            // Construire l'index Fuse.js pour fuzzy search
            this.fuseIndex = new Fuse(indexedDocuments, {
                keys: [
                    { name: 'documentTitle', weight: 0.3 },
                    { name: 'documentType', weight: 0.2 },
                    { name: 'borrowerName', weight: 0.25 },
                    { name: 'borrowerEmail', weight: 0.15 },
                    { name: 'borrowerId', weight: 0.1 },
                    { name: 'id', weight: 0.1 },
                    { name: 'status', weight: 0.05 },
                    { name: 'notes', weight: 0.15 },
                    { name: '_searchableText', weight: 0.1 }
                ],
                threshold: 0.3,
                distance: 100,
                minMatchCharLength: 2,
                includeScore: true,
                includeMatches: true,
                findAllMatches: true,
                ignoreLocation: true,
                useExtendedSearch: true
            });

            // Construire l'index Lunr.js pour recherche full-text
            this.lunrIndex = lunr(function() {
                this.ref('id');
                this.field('documentTitle');
                this.field('documentType');
                this.field('borrowerName');
                this.field('borrowerEmail');
                this.field('status');
                this.field('notes');
                this.field('_searchableText');
                
                indexedDocuments.forEach(doc => {
                    this.add(doc);
                });
            });

            // Construire la carte des documents pour l'accès rapide
            this.documentMap.clear();
            indexedDocuments.forEach(doc => {
                this.documentMap.set(doc.id, doc);
            });

            const endTime = performance.now();
            this.lastUpdated = new Date();
            this.buildStats = {
                documentsIndexed: documents.length,
                buildTime: endTime - startTime,
                memoryUsage: this.calculateMemoryUsage()
            };

            console.log('Index de recherche construit:', this.buildStats);
            return true;
        } catch (error) {
            console.error('Erreur lors de la construction de l\'index:', error);
            return false;
        }
    }

    // Préparer un document pour la recherche
    prepareDocumentForSearch(doc) {
        const searchableFields = [
            doc.documentTitle,
            doc.documentType,
            doc.borrowerName,
            doc.borrowerEmail,
            doc.status,
            doc.notes
        ].filter(Boolean);

        return searchableFields.join(' ').toLowerCase().trim();
    }

    // Effectuer une recherche avec l'index
    search(query, options = {}) {
        if (!this.fuseIndex || !this.lunrIndex) {
            return { results: [], suggestions: [], facets: {} };
        }

        const {
            limit = 100,
            includeMatches = true,
            includeScores = true,
            minScore = 0,
            filters = {},
            sortBy = 'relevance'
        } = options;

        try {
            let results = [];

            // Si la requête est vide, retourner tous les documents filtrés
            if (!query.trim()) {
                results = Array.from(this.documentMap.values());
            } else {
                // Recherche avec Fuse.js
                const fuseResults = this.fuseIndex.search(query);
                
                // Filtrer par score minimum
                const filteredResults = fuseResults.filter(result => {
                    const score = result.score || 0;
                    return score >= (1 - minScore); // Inverser car Fuse utilise 0 = parfait
                });

                // Transformer les résultats
                results = filteredResults.map(result => ({
                    ...result.item,
                    _searchScore: result.score,
                    _matches: result.matches || []
                }));
            }

            // Appliquer les filtres
            if (Object.keys(filters).length > 0) {
                results = this.applyFilters(results, filters);
            }

            // Trier les résultats
            results = this.sortResults(results, sortBy);

            // Limiter les résultats
            results = results.slice(0, limit);

            // Générer les suggestions
            const suggestions = this.generateSuggestions(query, results);

            // Générer les facets
            const facets = this.generateFacets(results);

            return {
                results,
                suggestions,
                facets,
                stats: {
                    totalFound: results.length,
                    searchTime: 0, // Sera calculé par le caller
                    indexStats: this.buildStats
                }
            };
        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
            return { results: [], suggestions: [], facets: {}, error: error.message };
        }
    }

    // Appliquer des filtres aux résultats
    applyFilters(results, filters) {
        return results.filter(result => {
            return Object.entries(filters).every(([key, value]) => {
                if (!value || value === '' || value === 'all') return true;
                
                if (Array.isArray(value)) {
                    return value.includes(result[key]);
                }
                
                if (key.includes('.')) {
                    // Gérer les filtres imbriqués
                    const keys = key.split('.');
                    let itemValue = result;
                    for (const k of keys) {
                        itemValue = itemValue?.[k];
                    }
                    return itemValue === value;
                }
                
                return result[key] === value;
            });
        });
    }

    // Trier les résultats
    sortResults(results, sortBy) {
        switch (sortBy) {
            case 'dateDesc':
                return results.sort((a, b) => 
                    new Date(b.loanDate) - new Date(a.loanDate)
                );
            case 'dateAsc':
                return results.sort((a, b) => 
                    new Date(a.loanDate) - new Date(b.loanDate)
                );
            case 'borrowerName':
                return results.sort((a, b) => 
                    (a.borrowerName || '').localeCompare(b.borrowerName || '')
                );
            case 'documentTitle':
                return results.sort((a, b) => 
                    (a.documentTitle || '').localeCompare(b.documentTitle || '')
                );
            case 'returnDate':
                return results.sort((a, b) => 
                    new Date(a.returnDate) - new Date(b.returnDate)
                );
            case 'relevance':
            default:
                return results.sort((a, b) => {
                    // Priorité aux scores de recherche
                    if (a._searchScore !== undefined && b._searchScore !== undefined) {
                        return a._searchScore - b._searchScore;
                    }
                    // Puis par pertinence calculée
                    if (a._relevanceScore && b._relevanceScore) {
                        return b._relevanceScore - a._relevanceScore;
                    }
                    return 0;
                });
        }
    }

    // Générer des suggestions intelligentes
    generateSuggestions(query, results) {
        if (!query || query.length < 2) return [];

        const suggestions = new Set();
        const queryLower = query.toLowerCase();

        // Suggestions basées sur les titres de documents
        results.forEach(result => {
            if (result.documentTitle?.toLowerCase().includes(queryLower)) {
                suggestions.add(result.documentTitle);
            }
        });

        // Suggestions basées sur les noms d'emprunteurs
        results.forEach(result => {
            if (result.borrowerName?.toLowerCase().includes(queryLower)) {
                suggestions.add(result.borrowerName);
            }
        });

        // Suggestions basées sur les types de documents
        results.forEach(result => {
            if (result.documentType?.toLowerCase().includes(queryLower)) {
                suggestions.add(result.documentType);
            }
        });

        return Array.from(suggestions).slice(0, 8);
    }

    // Générer des facets pour l'exploration des résultats
    generateFacets(results) {
        const facets = {
            status: {},
            documentType: {},
            borrowerName: {},
            borrowerEmail: {},
            alertLevel: {},
            dateRanges: {}
        };

        results.forEach(result => {
            // Statuts
            if (result.status) {
                facets.status[result.status] = (facets.status[result.status] || 0) + 1;
            }

            // Types de documents
            if (result.documentType) {
                facets.documentType[result.documentType] = (facets.documentType[result.documentType] || 0) + 1;
            }

            // Emprunteurs
            if (result.borrowerName) {
                facets.borrowerName[result.borrowerName] = (facets.borrowerName[result.borrowerName] || 0) + 1;
            }

            // Emails d'emprunteurs
            if (result.borrowerEmail) {
                facets.borrowerEmail[result.borrowerEmail] = (facets.borrowerEmail[result.borrowerEmail] || 0) + 1;
            }

            // Niveaux d'alerte
            if (result.alertLevel) {
                facets.alertLevel[result.alertLevel] = (facets.alertLevel[result.alertLevel] || 0) + 1;
            }
        });

        return facets;
    }

    // Calculer l'usage mémoire
    calculateMemoryUsage() {
        if (performance.memory) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }
        return null;
    }

    // Obtenir les statistiques de l'index
    getStats() {
        return {
            ...this.buildStats,
            lastUpdated: this.lastUpdated,
            documentsInMap: this.documentMap.size,
            hasFuseIndex: !!this.fuseIndex,
            hasLunrIndex: !!this.lunrIndex
        };
    }
}

// Cache de recherche avec TTL
class SearchCache {
    constructor(maxSize = 500, defaultTTL = 300000) { // 5 minutes par défaut
        this.cache = new Map();
        this.maxSize = maxSize;
        this.defaultTTL = defaultTTL;
        this.hits = 0;
        this.misses = 0;
    }

    generateKey(query, filters, options) {
        return JSON.stringify({
            query: query.toLowerCase().trim(),
            filters: JSON.stringify(filters),
            options: JSON.stringify(options)
        });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) {
            this.misses++;
            return null;
        }

        // Vérifier l'expiration
        if (Date.now() - item.timestamp > item.ttl) {
            this.cache.delete(key);
            this.misses++;
            return null;
        }

        // Mettre à jour l'accès
        item.lastAccessed = Date.now();
        item.accessCount++;
        this.hits++;
        return item.data;
    }

    set(key, data, ttl = this.defaultTTL) {
        // Supprimer le plus ancien si la limite est atteinte
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl,
            lastAccessed: Date.now(),
            accessCount: 1
        });
    }

    evictOldest() {
        let oldestKey = null;
        let oldestTime = Date.now();

        for (const [key, item] of this.cache.entries()) {
            if (item.lastAccessed < oldestTime) {
                oldestTime = item.lastAccessed;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }

    clear() {
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
    }

    getStats() {
        const hitRate = this.hits + this.misses > 0 ? (this.hits / (this.hits + this.misses)) * 100 : 0;
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hits: this.hits,
            misses: this.misses,
            hitRate: Math.round(hitRate * 100) / 100
        };
    }
}

// Service principal de recherche
class SearchService {
    constructor() {
        this.index = new SearchIndex();
        this.cache = new SearchCache();
        this.searchHistory = this.loadSearchHistory();
        this.savedSearches = this.loadSavedSearches();
        this.performanceMetrics = {
            searchesPerformed: 0,
            totalSearchTime: 0,
            averageSearchTime: 0
        };
    }

    // Initialiser le service avec des données
    async initialize(data) {
        try {
            const success = this.index.buildIndex(data);
            if (success) {
                console.log('Service de recherche initialisé avec succès');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Erreur lors de l\'initialisation du service de recherche:', error);
            return false;
        }
    }

    // Effectuer une recherche complète
    async search(query, filters = {}, options = {}) {
        const startTime = performance.now();
        
        try {
            // Générer la clé de cache
            const cacheKey = this.cache.generateKey(query, filters, options);
            
            // Vérifier le cache
            const cachedResult = this.cache.get(cacheKey);
            if (cachedResult) {
                return {
                    ...cachedResult,
                    fromCache: true,
                    searchTime: 0 // Déjà calculé lors de la mise en cache
                };
            }

            // Effectuer la recherche
            const searchResult = this.index.search(query, options);
            
            const endTime = performance.now();
            const searchTime = endTime - startTime;

            // Mettre à jour les métriques
            this.updateMetrics(searchTime);

            // Enrichir le résultat avec des métadonnées
            const enrichedResult = {
                ...searchResult,
                query,
                filters,
                options,
                searchTime,
                timestamp: new Date().toISOString(),
                fromCache: false
            };

            // Ajouter à l'historique si ce n'est pas une recherche vide
            if (query.trim()) {
                this.addToHistory(query, filters, searchResult);
            }

            // Mettre en cache
            this.cache.set(cacheKey, enrichedResult);

            return enrichedResult;

        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
            return {
                results: [],
                suggestions: [],
                facets: {},
                error: error.message,
                searchTime: performance.now() - startTime
            };
        }
    }

    // Obtenir des suggestions intelligentes
    async getSuggestions(query, limit = 5) {
        if (!query || query.length < 2) return [];

        try {
            const results = this.index.search(query, { limit: 20 });
            return this.index.generateSuggestions(query, results.results);
        } catch (error) {
            console.error('Erreur lors de la génération de suggestions:', error);
            return [];
        }
    }

    // Obtenir des facet data pour l'UI
    async getFacetData(results = null) {
        try {
            if (results) {
                return this.index.generateFacets(results);
            }
            
            // Obtenir tous les documents pour générer les facets
            const allDocuments = Array.from(this.index.documentMap.values());
            return this.index.generateFacets(allDocuments);
        } catch (error) {
            console.error('Erreur lors de la génération des facets:', error);
            return {};
        }
    }

    // Ajouter à l'historique de recherche
    addToHistory(query, filters = {}, result = null) {
        const historyItem = {
            id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            query: query.trim(),
            filters,
            timestamp: new Date().toISOString(),
            resultCount: result?.results?.length || 0,
            searchTime: result?.searchTime || 0
        };

        this.searchHistory.unshift(historyItem);
        
        // Limiter l'historique à 100 éléments
        if (this.searchHistory.length > 100) {
            this.searchHistory = this.searchHistory.slice(0, 100);
        }

        this.saveSearchHistory();
    }

    // Obtenir l'historique de recherche
    getSearchHistory(limit = 20) {
        return this.searchHistory.slice(0, limit);
    }

    // Supprimer un élément de l'historique
    removeFromHistory(searchId) {
        this.searchHistory = this.searchHistory.filter(item => item.id !== searchId);
        this.saveSearchHistory();
    }

    // Effacer tout l'historique
    clearHistory() {
        this.searchHistory = [];
        this.saveSearchHistory();
    }

    // Sauvegarder une recherche
    saveSearch(name, query, filters = {}, options = {}) {
        const savedSearch = {
            id: `saved_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: name.trim(),
            query: query.trim(),
            filters,
            options,
            timestamp: new Date().toISOString()
        };

        this.savedSearches.push(savedSearch);
        this.saveSavedSearches();
        return savedSearch;
    }

    // Obtenir les recherches sauvegardées
    getSavedSearches() {
        return this.savedSearches;
    }

    // Supprimer une recherche sauvegardée
    removeSavedSearch(searchId) {
        this.savedSearches = this.savedSearches.filter(item => item.id !== searchId);
        this.saveSavedSearches();
    }

    // Mettre à jour les métriques de performance
    updateMetrics(searchTime) {
        this.performanceMetrics.searchesPerformed++;
        this.performanceMetrics.totalSearchTime += searchTime;
        this.performanceMetrics.averageSearchTime = 
            this.performanceMetrics.totalSearchTime / this.performanceMetrics.searchesPerformed;
    }

    // Obtenir les statistiques du service
    getServiceStats() {
        return {
            index: this.index.getStats(),
            cache: this.cache.getStats(),
            performance: this.performanceMetrics,
            history: {
                count: this.searchHistory.length,
                saved: this.savedSearches.length
            }
        };
    }

    // Sauvegarder l'historique en localStorage
    saveSearchHistory() {
        try {
            localStorage.setItem('docucortex_search_history', JSON.stringify(this.searchHistory));
        } catch (error) {
            console.warn('Impossible de sauvegarder l\'historique de recherche:', error);
        }
    }

    // Charger l'historique depuis localStorage
    loadSearchHistory() {
        try {
            const stored = localStorage.getItem('docucortex_search_history');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.warn('Impossible de charger l\'historique de recherche:', error);
            return [];
        }
    }

    // Sauvegarder les recherches sauvegardées
    saveSavedSearches() {
        try {
            localStorage.setItem('docucortex_saved_searches', JSON.stringify(this.savedSearches));
        } catch (error) {
            console.warn('Impossible de sauvegarder les recherches:', error);
        }
    }

    // Charger les recherches sauvegardées
    loadSavedSearches() {
        try {
            const stored = localStorage.getItem('docucortex_saved_searches');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.warn('Impossible de charger les recherches:', error);
            return [];
        }
    }

    // Nettoyer le cache
    clearCache() {
        this.cache.clear();
    }

    // Reconstruire l'index
    rebuildIndex(data) {
        return this.index.buildIndex(data);
    }

    // Arrêter le service
    shutdown() {
        this.clearCache();
        this.saveSearchHistory();
        this.saveSavedSearches();
        console.log('Service de recherche arrêté');
    }
}

// Export d'une instance singleton
const searchService = new SearchService();

export default searchService;
export { SearchService, SearchIndex, SearchCache };
