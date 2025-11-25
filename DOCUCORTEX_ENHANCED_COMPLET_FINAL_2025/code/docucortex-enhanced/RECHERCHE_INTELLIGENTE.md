# Système de Recherche Intelligente DocuCortex

## 🎯 Vue d'ensemble

Le système de recherche intelligente DocuCortex fournit une solution complète et performante pour naviguer rapidement dans des milliers de prêts avec autocomplétion avancée, recherche floue et filtres contextuels.

## ✨ Fonctionnalités principales

### 🔍 Recherche intelligente
- **Recherche full-text** dans tous les champs (titres, noms, emails, notes)
- **Autocomplétion prédictive** avec suggestions contextuelles
- **Recherche floue (fuzzy search)** tolérante aux fautes de frappe
- **Recherche phonétique** pour les noms difficiles à orthographier
- **Recherche en temps réel** avec debouncing pour optimiser les performances

### 🧠 Intelligence contextuelle
- **Suggestions basées sur l'historique** de recherche de l'utilisateur
- **Filtres auto-suggérés** selon le contexte des données
- **Reconnaissance intelligente** des termes de recherche
- **Score de pertinence** pour ordonner les résultats
- **Facets dynamiques** pour l'exploration des résultats

### 🎛️ Filtres avancés
- **Filtres multi-critères** avec combinaisons puissantes
- **Filtres sauvegardés et nommés** pour les recherches fréquentes
- **Filtres par date** avec sélection de plages temporelles
- **Filtres par statut, type, emprunteur** avec autocomplete
- **Filtres par niveau d'alerte** et durée de prêt
- **Reset rapide** et filtres par défaut intelligents

### 📊 Interface utilisateur optimisée
- **Mode plein écran** pour la recherche intensive (F11)
- **Raccourcis clavier** (Ctrl+K pour focus, Escape pour fermer)
- **Résultats groupés** par catégorie (statut, emprunteur, type)
- **Modes d'affichage** (liste, grille, compact)
- **Highlight intelligent** des termes de recherche dans les résultats
- **Responsive design** optimisé pour mobile et desktop

### 💾 Persistance et performance
- **Cache intelligent** avec TTL configurable
- **Historique persistant** des recherches (localStorage)
- **Recherches sauvegardées** avec tags et métadonnées
- **Indexation optimisée** avec Fuse.js et Lunr.js
- **Métriques de performance** en temps réel

## 🏗️ Architecture

### Composants principaux

```
src/components/search/
├── SmartSearchEngine.js          # Hook et logique métier
├── AdvancedSearchContainer.js    # Container principal
├── SearchBar.js                  # Barre de recherche avec autocomplétion
├── SearchSuggestions.js          # Système de suggestions
├── SearchFilters.js              # Filtres avancés
├── SearchResults.js              # Affichage des résultats
├── SearchHistory.js              # Historique persistant
└── index.js                      # Point d'entrée centralisé
```

### Services

```
src/services/
└── searchService.js              # Service central de recherche
```

### Hooks personnalisés

```javascript
// Hook principal de recherche intelligente
const smartSearch = useSmartSearch(data, options);

// Hooks utilitaires
const { getHistory, addToHistory } = useSearchHistory();
const { getSavedSearches, saveSearch } = useSavedSearches();
```

## 🚀 Utilisation

### Intégration de base

```javascript
import { AdvancedSearchContainer } from '../components/search';

function MyComponent() {
    const [loans, setLoans] = useState([]);
    
    return (
        <AdvancedSearchContainer
            data={loans}
            onResultSelect={(result) => {
                console.log('Résultat sélectionné:', result);
            }}
            onResultAction={(action, result) => {
                console.log('Action:', action, 'sur:', result);
            }}
            drawerPosition="right"
            drawerWidth={600}
            showHistory={true}
            showFilters={true}
            showAnalytics={true}
        />
    );
}
```

### Intégration avancée avec le LoanList

```javascript
import { useSmartSearch } from '../components/search';

function LoanList({ loans }) {
    const smartSearch = useSmartSearch(loans, {
        enableFuzzySearch: true,
        enableAutoComplete: true,
        enableHistory: true,
        enableFacets: true,
        debounceMs: 300,
        maxResults: 500
    });

    const handleSearch = (query) => {
        smartSearch.search(query);
    };

    const handleFilterChange = (filters) => {
        smartSearch.updateFilters(filters);
    };

    return (
        <Box>
            <SearchBar
                value={smartSearch.searchQuery}
                onChange={smartSearch.setSearchQuery}
                onSearch={handleSearch}
                suggestions={smartSearch.suggestions}
                recentSearches={smartSearch.recentSearches}
                loading={smartSearch.isSearching}
            />
            
            <SearchResults
                results={smartSearch.results}
                searchQuery={smartSearch.searchQuery}
                totalResults={smartSearch.totalResults}
                searchTime={smartSearch.searchTime}
            />
        </Box>
    );
}
```

### Configuration avancée

```javascript
const searchOptions = {
    enableFuzzySearch: true,        // Recherche approximative
    enableAutoComplete: true,       // Autocomplétion
    enableHistory: true,           // Historique des recherches
    enableFacets: true,            // Facets pour l'exploration
    debounceMs: 300,               // Délai de debounce (ms)
    maxResults: 100,               // Nombre maximum de résultats
    minScore: 0.3,                 // Score minimum de pertinence
    cacheSize: 500,                // Taille du cache
    cacheTTL: 300000               // Durée de vie du cache (ms)
};

// Utilisation
const smartSearch = useSmartSearch(data, searchOptions);
```

## ⚙️ Configuration

### Variables d'environnement

```bash
# Performance
REACT_APP_SEARCH_DEBOUNCE_MS=300
REACT_APP_SEARCH_MAX_RESULTS=100
REACT_APP_SEARCH_CACHE_SIZE=500
REACT_APP_SEARCH_CACHE_TTL=300000

# Fonctionnalités
REACT_APP_ENABLE_FUZZY_SEARCH=true
REACT_APP_ENABLE_AUTO_COMPLETE=true
REACT_APP_ENABLE_HISTORY=true
REACT_APP_ENABLE_FACETS=true
```

### Paramètres du service de recherche

```javascript
// Configuration personnalisée du service
import { searchService } from '../components/search';

await searchService.initialize(data, {
    indexType: 'hybrid',           // 'fuse', 'lunr', ou 'hybrid'
    cacheConfig: {
        maxSize: 1000,
        defaultTTL: 600000,        // 10 minutes
        enablePersistence: true
    },
    performance: {
        enableMetrics: true,
        logSearchTime: true,
        logCacheStats: true
    }
});
```

## 📈 Performance

### Métriques disponibles

```javascript
const stats = searchService.getServiceStats();
console.log('Statistiques:', {
    index: stats.index,           // État des index
    cache: stats.cache,           // Statistiques du cache
    performance: stats.performance, // Métriques de performance
    history: stats.history        // Statistiques d'historique
});
```

### Optimisations recommandées

1. **Indexation** : Les index sont automatiquement mis à jour lors de l'ajout de données
2. **Cache** : Les résultats de recherche fréquents sont automatiquement mis en cache
3. **Debouncing** : La recherche est déclenchée après un délai configurable
4. **Pagination** : Les résultats sont limités par défaut pour optimiser l'affichage
5. **Lazy loading** : Les suggestions sont chargées de manière asynchrone

## 🎨 Personnalisation

### Thème et样式

```javascript
// Personnalisation des couleurs de recherche
const searchTheme = {
    palette: {
        primary: {
            main: '#2196f3',      // Couleur principale de recherche
            light: '#64b5f6',
            dark: '#1976d2'
        },
        secondary: {
            main: '#ff9800',      // Couleur des suggestions
            light: '#ffb74d',
            dark: '#f57c00'
        }
    },
    typography: {
        searchHighlight: {
            backgroundColor: '#fff3cd',
            color: '#856404'
        }
    }
};
```

### Composants personnalisés

```javascript
// Remplacement du composant SearchBar
import { SearchBar } from '../components/search';

const CustomSearchBar = (props) => {
    return (
        <SearchBar
            {...props}
            className="custom-search-bar"
            sx={{
                '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
            }}
        />
    );
};
```

## 🔧 API Reference

### Hook useSmartSearch

```typescript
interface UseSmartSearchOptions {
    enableFuzzySearch?: boolean;
    enableAutoComplete?: boolean;
    enableHistory?: boolean;
    enableFacets?: boolean;
    debounceMs?: number;
    maxResults?: number;
    minScore?: number;
}

interface SmartSearchResult {
    searchQuery: string;
    filters: Record<string, any>;
    results: Loan[];
    suggestions: string[];
    isSearching: boolean;
    searchTime: number;
    error: string | null;
    totalResults: number;
    recentSearches: SearchHistoryItem[];
    savedFilters: Record<string, FilterConfig>;
    
    // Actions
    search: (query: string) => void;
    updateFilters: (filters: Record<string, any>) => void;
    clearFilters: () => void;
    getSearchHistory: (limit?: number) => SearchHistoryItem[];
    saveCurrentFilter: (name: string) => void;
}
```

### Service searchService

```typescript
interface SearchService {
    initialize(data: any[]): Promise<boolean>;
    search(query: string, filters?: Record<string, any>, options?: SearchOptions): Promise<SearchResult>;
    getSuggestions(query: string, limit?: number): Promise<string[]>;
    getFacetData(results?: any[]): Promise<FacetData>;
    getServiceStats(): ServiceStats;
    clearCache(): void;
    rebuildIndex(data: any[]): boolean;
}
```

## 🐛 Dépannage

### Problèmes courants

1. **Recherche lente** : Vérifiez la taille du cache et les paramètres de debouncing
2. **Résultats manquants** : Vérifiez les filtres actifs et la configuration des index
3. **Suggestions non affichées** : Vérifiez que `enableAutoComplete` est activé
4. **Historique vide** : Vérifiez que `enableHistory` est activé et que localStorage est accessible

### Logs de débogage

```javascript
// Activer les logs détaillés
localStorage.setItem('docucortex_search_debug', 'true');

// Vérifier les statistiques
const stats = searchService.getServiceStats();
console.log('Debug stats:', stats);
```

## 🔮 Évolutions futures

- [ ] Recherche par reconnaissance vocale
- [ ] Suggestions basées sur l'IA
- [ ] Recherche collaborative en temps réel
- [ ] Export avancé des résultats de recherche
- [ ] Intégration avec des moteurs de recherche externes
- [ ] Support multi-langue avancé
- [ ] Recherche sémantique avec embeddings

## 📝 Notes de version

### v2.0.0 (Phase 2)
- ✅ Système de recherche intelligente complet
- ✅ Autocomplétion avancée avec context
- ✅ Filtres intelligents et sauvegardés
- ✅ Interface utilisateur optimisée
- ✅ Performance et cache optimisés
- ✅ Intégration complète avec LoanList

### v1.x (Phase 1)
- ✅ Recherche basique fonctionnelle
- ✅ Filtres statiques
- ✅ Système d'alertes intégré
