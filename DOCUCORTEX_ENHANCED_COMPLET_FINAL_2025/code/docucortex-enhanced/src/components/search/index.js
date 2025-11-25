// src/components/search/index.js - INDEX PRINCIPAL DES COMPOSANTS DE RECHERCHE
// Export centralisé de tous les composants et services de recherche DocuCortex

// Hook principal et engine
export { default as useSmartSearch, SmartSearchEngine } from './SmartSearchEngine';

// Composants principaux
export { default as AdvancedSearchContainer } from './AdvancedSearchContainer';
export { default as SearchBar } from './SearchBar';
export { default as SearchSuggestions } from './SearchSuggestions';
export { default as SearchFilters } from './SearchFilters';
export { default as SearchResults } from './SearchResults';
export { default as SearchHistory } from './SearchHistory';

// Service de recherche
export { default as searchService } from '../../services/searchService';

// Types et interfaces de recherche
export const SEARCH_CONSTANTS = {
    // Types de recherche
    SEARCH_TYPES: {
        TEXT: 'text',
        FILTER: 'filter', 
        ADVANCED: 'advanced',
        SAVED: 'saved'
    },
    
    // Modes d'affichage
    VIEW_MODES: {
        LIST: 'list',
        GRID: 'grid',
        COMPACT: 'compact'
    },
    
    // Options de tri
    SORT_OPTIONS: {
        RELEVANCE: 'relevance',
        DATE_DESC: 'dateDesc',
        DATE_ASC: 'dateAsc', 
        BORROWER_NAME: 'borrowerName',
        DOCUMENT_TITLE: 'documentTitle',
        RETURN_DATE: 'returnDate'
    },
    
    // Groupements
    GROUPING_OPTIONS: {
        NONE: 'none',
        STATUS: 'status',
        BORROWER: 'borrower',
        DOCUMENT_TYPE: 'documentType',
        DATE: 'date',
        ALERT_LEVEL: 'alertLevel'
    },
    
    // Positions du drawer
    DRAWER_POSITIONS: {
        LEFT: 'left',
        RIGHT: 'right',
        BOTTOM: 'bottom'
    },
    
    // Configuration des filtres par défaut
    DEFAULT_FILTERS: {
        status: '',
        alertLevel: '',
        documentTypes: [],
        borrowers: [],
        dateRange: null,
        durationRange: [0, 30],
        sortBy: 'relevance',
        includeReturned: false,
        fuzzySearch: true,
        caseSensitive: false
    },
    
    // Configuration de recherche par défaut
    DEFAULT_SEARCH_OPTIONS: {
        enableFuzzySearch: true,
        enableAutoComplete: true,
        enableHistory: true,
        enableFacets: true,
        debounceMs: 300,
        maxResults: 100,
        minScore: 0.3
    }
};

// Utilitaires de recherche
export const searchUtils = {
    // Normaliser le texte pour la recherche
    normalizeText: (text) => {
        return text?.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s-]/g, '')
            .trim() || '';
    },
    
    // Tokeniser une requête
    tokenizeQuery: (query) => {
        return searchUtils.normalizeText(query).split(/\s+/).filter(token => token.length > 1);
    },
    
    // Calculer le score de pertinence
    calculateRelevanceScore: (item, searchTerms) => {
        let score = 0;
        searchTerms.forEach(term => {
            if (item.documentTitle?.toLowerCase().includes(term)) score += 10;
            if (item.borrowerName?.toLowerCase().includes(term)) score += 8;
            if (item.documentType?.toLowerCase().includes(term)) score += 6;
            if (item.borrowerEmail?.toLowerCase().includes(term)) score += 4;
            if (item.id?.toLowerCase().includes(term)) score += 2;
        });
        return score;
    },
    
    // Générer des suggestions de recherche
    generateSuggestions: (data, query, limit = 5) => {
        const normalizedQuery = searchUtils.normalizeText(query);
        if (normalizedQuery.length < 2) return [];

        const suggestions = new Set();
        data.forEach(item => {
            if (item.documentTitle?.toLowerCase().includes(normalizedQuery)) {
                suggestions.add(item.documentTitle);
            }
            if (item.borrowerName?.toLowerCase().includes(normalizedQuery)) {
                suggestions.add(item.borrowerName);
            }
            if (item.documentType?.toLowerCase().includes(normalizedQuery)) {
                suggestions.add(item.documentType);
            }
        });

        return Array.from(suggestions).slice(0, limit);
    },
    
    // Formater la date relative
    formatRelativeDate: (dateString) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) return 'Aujourd\'hui';
            if (diffDays === 1) return 'Hier';
            if (diffDays < 7) return `Il y a ${diffDays} jours`;
            if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
            return `Il y a ${Math.floor(diffDays / 30)} mois`;
        } catch {
            return '';
        }
    },
    
    // Valider une requête de recherche
    validateSearchQuery: (query) => {
        const errors = [];
        
        if (!query || query.trim().length === 0) {
            errors.push('La requête de recherche ne peut pas être vide');
        }
        
        if (query.length > 200) {
            errors.push('La requête de recherche est trop longue (max 200 caractères)');
        }
        
        // Vérifier les caractères interdits
        const forbiddenChars = /[<>\/"'\\]/;
        if (forbiddenChars.test(query)) {
            errors.push('La requête contient des caractères interdits');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
};

// Hooks utilitaires
export const useSearchHistory = () => {
    const getHistory = () => {
        try {
            const history = localStorage.getItem('docucortex_search_history');
            return history ? JSON.parse(history) : [];
        } catch {
            return [];
        }
    };
    
    const addToHistory = (query, filters = {}) => {
        try {
            const history = getHistory();
            const newItem = {
                id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                query: query.trim(),
                filters,
                timestamp: new Date().toISOString()
            };
            
            history.unshift(newItem);
            // Limiter à 50 éléments
            const limitedHistory = history.slice(0, 50);
            localStorage.setItem('docucortex_search_history', JSON.stringify(limitedHistory));
            
            return newItem;
        } catch (error) {
            console.warn('Impossible de sauvegarder dans l\'historique:', error);
            return null;
        }
    };
    
    const clearHistory = () => {
        try {
            localStorage.removeItem('docucortex_search_history');
            return true;
        } catch {
            return false;
        }
    };
    
    return {
        getHistory,
        addToHistory,
        clearHistory
    };
};

export const useSavedSearches = () => {
    const getSavedSearches = () => {
        try {
            const saved = localStorage.getItem('docucortex_saved_searches');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    };
    
    const saveSearch = (name, query, filters = {}, options = {}) => {
        try {
            const saved = getSavedSearches();
            const newSaved = {
                id: `saved_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: name.trim(),
                query: query.trim(),
                filters,
                options,
                timestamp: new Date().toISOString()
            };
            
            saved.push(newSaved);
            localStorage.setItem('docucortex_saved_searches', JSON.stringify(saved));
            
            return newSaved;
        } catch (error) {
            console.warn('Impossible de sauvegarder la recherche:', error);
            return null;
        }
    };
    
    const deleteSavedSearch = (id) => {
        try {
            const saved = getSavedSearches();
            const filtered = saved.filter(item => item.id !== id);
            localStorage.setItem('docucortex_saved_searches', JSON.stringify(filtered));
            return true;
        } catch {
            return false;
        }
    };
    
    return {
        getSavedSearches,
        saveSearch,
        deleteSavedSearch
    };
};

// Composant de démonstration pour les tests
export const SearchDemo = () => {
    const [data] = useState([
        // Données de démonstration
        {
            id: '1',
            documentTitle: 'Contrat de Location Bureau A',
            documentType: 'Contrat',
            borrowerName: 'Jean Dupont',
            borrowerEmail: 'jean.dupont@entreprise.com',
            borrowerId: 'user123',
            status: 'active',
            loanDate: '2025-11-01T10:00:00Z',
            returnDate: '2025-11-15T18:00:00Z',
            notes: 'Contrat urgent à traiter rapidement',
            alertLevel: 'medium'
        },
        {
            id: '2',
            documentTitle: 'Facture Maintenance Serveur',
            documentType: 'Facture',
            borrowerName: 'Marie Martin',
            borrowerEmail: 'marie.martin@societe.fr',
            borrowerId: 'user456',
            status: 'overdue',
            loanDate: '2025-10-28T09:00:00Z',
            returnDate: '2025-11-10T17:00:00Z',
            notes: 'À rappeler',
            alertLevel: 'high'
        }
    ]);

    return (
        <AdvancedSearchContainer
            data={data}
            showHistory={true}
            showFilters={true}
            showAnalytics={true}
            drawerPosition="right"
            autoOpen={false}
        />
    );
};

export default {
    // Hooks
    useSmartSearch,
    useSearchHistory,
    useSavedSearches,
    
    // Composants
    AdvancedSearchContainer,
    SearchBar,
    SearchSuggestions,
    SearchFilters,
    SearchResults,
    SearchHistory,
    
    // Services
    searchService,
    
    // Utilitaires
    searchUtils,
    SEARCH_CONSTANTS,
    
    // Démonstration
    SearchDemo
};
