// src/components/search/SmartSearchEngine.js - MOTEUR DE RECHERCHE INTELLIGENT DOCUCORTEX
// Système de recherche avancée avec autocomplétion, fuzzy search et contexte

import Fuse from 'fuse.js';
import lunr from 'lunr';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// Cache de recherche pour optimiser les performances
class SearchCache {
    constructor(maxSize = 1000) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.searchHistory = JSON.parse(localStorage.getItem('docucortex_search_history') || '[]');
        this.savedFilters = JSON.parse(localStorage.getItem('docucortex_saved_filters') || '{}');
    }

    generateKey(query, filters, options) {
        return JSON.stringify({ query, filters, options });
    }

    get(key) {
        const item = this.cache.get(key);
        if (item && Date.now() - item.timestamp < 300000) { // 5 minutes
            return item.data;
        }
        return null;
    }

    set(key, data) {
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, { data, timestamp: Date.now() });
    }

    addToHistory(query) {
        if (!query.trim()) return;
        
        const timestamp = new Date().toISOString();
        const historyItem = { query: query.trim(), timestamp };
        
        // Supprimer les doublons et limiter à 50 éléments
        this.searchHistory = [historyItem, ...this.searchHistory.filter(h => h.query !== query.trim())].slice(0, 50);
        
        localStorage.setItem('docucortex_search_history', JSON.stringify(this.searchHistory));
    }

    saveFilter(name, filter) {
        this.savedFilters[name] = {
            ...filter,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('docucortex_saved_filters', JSON.stringify(this.savedFilters));
    }

    getSearchHistory(limit = 10) {
        return this.searchHistory.slice(0, limit);
    }

    getSavedFilters() {
        return this.savedFilters;
    }
}

// Configuration des champs pour la recherche
const SEARCH_FIELDS = {
    documentTitle: { weight: 0.3, searchable: true },
    documentType: { weight: 0.2, searchable: true },
    borrowerName: { weight: 0.25, searchable: true },
    borrowerEmail: { weight: 0.15, searchable: true },
    borrowerId: { weight: 0.1, searchable: true },
    id: { weight: 0.1, searchable: true },
    status: { weight: 0.05, searchable: true },
    notes: { weight: 0.15, searchable: true }
};

// Configuration Fuse.js pour fuzzy search
const FUSE_OPTIONS = {
    keys: Object.keys(SEARCH_FIELDS),
    threshold: 0.3,
    distance: 100,
    minMatchCharLength: 2,
    includeScore: true,
    includeMatches: true,
    findAllMatches: true,
    ignoreLocation: true,
    useExtendedSearch: true,
    keys: Object.keys(SEARCH_FIELDS).map(key => ({
        name: key,
        weight: SEARCH_FIELDS[key].weight
    }))
};

// Utilitaires de recherche
class SearchUtils {
    static normalizeText(text) {
        return text?.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
            .replace(/[^\w\s-]/g, '') // Supprimer la ponctuation
            .trim() || '';
    }

    static tokenizeQuery(query) {
        return this.normalizeText(query)
            .split(/\s+/)
            .filter(token => token.length > 1);
    }

    static generateSearchSuggestions(data, query, limit = 5) {
        const normalizedQuery = this.normalizeText(query);
        if (normalizedQuery.length < 2) return [];

        const suggestions = new Set();

        data.forEach(item => {
            // Suggestions basées sur les titres de documents
            if (item.documentTitle?.toLowerCase().includes(normalizedQuery)) {
                suggestions.add(item.documentTitle);
            }
            
            // Suggestions basées sur les noms d'emprunteurs
            if (item.borrowerName?.toLowerCase().includes(normalizedQuery)) {
                suggestions.add(item.borrowerName);
            }

            // Suggestions basées sur les types de documents
            if (item.documentType?.toLowerCase().includes(normalizedQuery)) {
                suggestions.add(item.documentType);
            }
        });

        return Array.from(suggestions).slice(0, limit);
    }

    static calculateRelevanceScore(item, searchTerms) {
        let score = 0;
        
        searchTerms.forEach(term => {
            // Titre de document (poids élevé)
            if (item.documentTitle?.toLowerCase().includes(term)) score += 10;
            
            // Nom de l'emprunteur
            if (item.borrowerName?.toLowerCase().includes(term)) score += 8;
            
            // Type de document
            if (item.documentType?.toLowerCase().includes(term)) score += 6;
            
            // Email de l'emprunteur
            if (item.borrowerEmail?.toLowerCase().includes(term)) score += 4;
            
            // ID
            if (item.id?.toLowerCase().includes(term)) score += 2;
        });

        return score;
    }

    static generateFacets(data) {
        const facets = {
            status: {},
            documentType: {},
            borrowerName: {},
            dateRanges: {}
        };

        data.forEach(item => {
            // Statuts
            if (item.status) {
                facets.status[item.status] = (facets.status[item.status] || 0) + 1;
            }

            // Types de documents
            if (item.documentType) {
                facets.documentType[item.documentType] = (facets.documentType[item.documentType] || 0) + 1;
            }

            // Emprunteurs
            if (item.borrowerName) {
                facets.borrowerName[item.borrowerName] = (facets.borrowerName[item.borrowerName] || 0) + 1;
            }
        });

        return facets;
    }
}

// Hook principal de recherche intelligente
export const useSmartSearch = (data = [], options = {}) => {
    const {
        enableFuzzySearch = true,
        enableAutoComplete = true,
        enableHistory = true,
        enableFacets = true,
        debounceMs = 300,
        maxResults = 100
    } = options;

    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({});
    const [results, setResults] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchTime, setSearchTime] = useState(0);
    const [facets, setFacets] = useState({});
    const [error, setError] = useState(null);

    const cacheRef = useRef(new SearchCache());
    const fuseRef = useRef(null);
    const lunrRef = useRef(null);

    // Initialiser les moteurs de recherche
    useEffect(() => {
        if (data.length > 0) {
            try {
                // Initialiser Fuse.js
                if (enableFuzzySearch) {
                    fuseRef.current = new Fuse(data, FUSE_OPTIONS);
                }

                // Initialiser Lunr.js pour l'indexation
                if (enableFacets) {
                    lunrRef.current = lunr(function() {
                        this.ref('id');
                        this.field('documentTitle');
                        this.field('documentType');
                        this.field('borrowerName');
                        this.field('borrowerEmail');
                        this.field('status');
                        
                        data.forEach(doc => {
                            this.add(doc);
                        });
                    });
                }

                // Générer les facets
                if (enableFacets) {
                    setFacets(SearchUtils.generateFacets(data));
                }
            } catch (err) {
                console.error('Erreur lors de l\'initialisation des moteurs de recherche:', err);
                setError('Erreur lors de l\'initialisation du moteur de recherche');
            }
        }
    }, [data, enableFuzzySearch, enableFacets]);

    // Fonction de recherche optimisée
    const performSearch = useCallback(async (query, currentFilters = filters) => {
        if (!query.trim() && Object.keys(currentFilters).length === 0) {
            setResults(data);
            setSuggestions([]);
            return;
        }

        setIsSearching(true);
        const startTime = performance.now();

        try {
            const normalizedQuery = SearchUtils.normalizeText(query);
            const searchTerms = SearchUtils.tokenizeQuery(normalizedQuery);
            const cacheKey = cacheRef.current.generateKey(query, currentFilters, { 
                enableFuzzySearch, 
                enableAutoComplete, 
                enableFacets 
            });

            // Vérifier le cache
            const cachedResults = cacheRef.current.get(cacheKey);
            if (cachedResults) {
                setResults(cachedResults.results);
                setSuggestions(cachedResults.suggestions);
                setSearchTime(performance.now() - startTime);
                setIsSearching(false);
                cacheRef.current.addToHistory(query);
                return;
            }

            let searchResults = [...data];
            let searchSuggestions = [];

            // Application des filtres
            Object.entries(currentFilters).forEach(([key, value]) => {
                if (value && value !== '' && value !== 'all') {
                    if (Array.isArray(value)) {
                        searchResults = searchResults.filter(item => value.includes(item[key]));
                    } else {
                        searchResults = searchResults.filter(item => {
                            if (key.includes('.')) {
                                // Gestion des filtres imbriqués (ex: alert.level)
                                const keys = key.split('.');
                                let itemValue = item;
                                for (const k of keys) {
                                    itemValue = itemValue?.[k];
                                }
                                return itemValue === value;
                            }
                            return item[key] === value;
                        });
                    }
                }
            });

            // Recherche par requête
            if (normalizedQuery) {
                if (enableFuzzySearch && fuseRef.current) {
                    const fuseResults = fuseRef.current.search(normalizedQuery);
                    searchResults = fuseResults.map(result => ({
                        ...result.item,
                        _searchScore: 1 - (result.score || 0),
                        _matches: result.matches || []
                    }));
                } else {
                    // Recherche simple par inclusion
                    searchResults = searchResults.filter(item => 
                        searchTerms.some(term => 
                            item.documentTitle?.toLowerCase().includes(term) ||
                            item.borrowerName?.toLowerCase().includes(term) ||
                            item.borrowerEmail?.toLowerCase().includes(term) ||
                            item.documentType?.toLowerCase().includes(term) ||
                            item.id?.toLowerCase().includes(term)
                        )
                    );
                }

                // Générer les suggestions
                if (enableAutoComplete) {
                    searchSuggestions = SearchUtils.generateSearchSuggestions(
                        data, 
                        query, 
                        8
                    );
                }

                // Ajouter à l'historique
                if (enableHistory) {
                    cacheRef.current.addToHistory(query);
                }
            }

            // Calculer le score de pertinence
            searchResults = searchResults
                .map(item => ({
                    ...item,
                    _relevanceScore: SearchUtils.calculateRelevanceScore(item, searchTerms)
                }))
                .sort((a, b) => {
                    // Priorité aux résultats avec un score de pertinence plus élevé
                    if (a._searchScore && b._searchScore) {
                        return b._searchScore - a._searchScore;
                    }
                    if (a._relevanceScore && b._relevanceScore) {
                        return b._relevanceScore - a._relevanceScore;
                    }
                    return 0;
                })
                .slice(0, maxResults);

            const endTime = performance.now();
            const searchDuration = endTime - startTime;

            // Sauvegarder dans le cache
            const searchResult = {
                results: searchResults,
                suggestions: searchSuggestions,
                duration: searchDuration,
                query: query,
                filters: currentFilters
            };

            cacheRef.current.set(cacheKey, searchResult);

            // Mettre à jour l'état
            setResults(searchResults);
            setSuggestions(searchSuggestions);
            setSearchTime(searchDuration);
            setError(null);

        } catch (err) {
            console.error('Erreur lors de la recherche:', err);
            setError('Erreur lors de la recherche: ' + err.message);
        } finally {
            setIsSearching(false);
        }
    }, [data, filters, enableFuzzySearch, enableAutoComplete, enableHistory, enableFacets, maxResults]);

    // Recherche avec debouncing
    const debouncedSearch = useCallback(
        (query, currentFilters = {}) => {
            if (query === searchQuery && JSON.stringify(filters) === JSON.stringify(currentFilters)) {
                return;
            }

            const timeoutId = setTimeout(() => {
                performSearch(query, currentFilters);
            }, debounceMs);

            return () => clearTimeout(timeoutId);
        },
        [searchQuery, filters, performSearch, debounceMs]
    );

    // Mettre à jour les filtres
    const updateFilters = useCallback((newFilters) => {
        const updatedFilters = { ...filters, ...newFilters };
        setFilters(updatedFilters);
        debouncedSearch(searchQuery, updatedFilters);
    }, [filters, searchQuery, debouncedSearch]);

    // Effacer les filtres
    const clearFilters = useCallback(() => {
        setFilters({});
        debouncedSearch(searchQuery, {});
    }, [searchQuery, debouncedSearch]);

    // Rechercher
    const search = useCallback((query) => {
        setSearchQuery(query);
        debouncedSearch(query, filters);
    }, [filters, debouncedSearch]);

    // Obtenir les filtres sauvegardés
    const getSavedFilters = useCallback(() => {
        return cacheRef.current.getSavedFilters();
    }, []);

    // Sauvegarder un filtre
    const saveCurrentFilter = useCallback((name) => {
        cacheRef.current.saveFilter(name, filters);
    }, [filters]);

    // Obtenir l'historique de recherche
    const getSearchHistory = useCallback((limit = 10) => {
        return cacheRef.current.getSearchHistory(limit);
    }, []);

    // Nettoyer le cache
    const clearCache = useCallback(() => {
        cacheRef.current.cache.clear();
    }, []);

    // Valeurs calculées
    const computedValues = useMemo(() => {
        return {
            totalResults: results.length,
            hasResults: results.length > 0,
            searchTime,
            facets,
            recentSearches: enableHistory ? getSearchHistory(5) : [],
            savedFilters: getSavedFilters()
        };
    }, [results, searchTime, facets, enableHistory, getSearchHistory, getSavedFilters]);

    return {
        // État
        searchQuery,
        setSearchQuery,
        filters,
        results,
        suggestions,
        isSearching,
        searchTime,
        error,
        ...computedValues,

        // Actions
        search,
        updateFilters,
        clearFilters,
        saveCurrentFilter,
        getSavedFilters,
        getSearchHistory,
        clearCache,
        
        // Utils
        utils: SearchUtils
    };
};

export default useSmartSearch;
