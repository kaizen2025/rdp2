// src/components/users/UsersSmartSearch.js - Recherche intelligente avec fuzzy matching et autocomplétion
// Phase 2 - Recherche Intelligente Fuzzy

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
    Box,
    TextField,
    Autocomplete,
    Paper,
    Typography,
    Chip,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemButton,
    IconButton,
    Collapse,
    Badge,
    useTheme,
    alpha,
    CircularProgress,
    Tooltip,
    Divider,
    Card,
    CardContent
} from '@mui/material';
import {
    Search as SearchIcon,
    History as HistoryIcon,
    Clear as ClearIcon,
    FilterList as FilterIcon,
    TrendingUp as TrendingUpIcon,
    Person as PersonIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Work as WorkIcon,
    Group as GroupIcon,
    AccessTime as AccessTimeIcon,
    Close as CloseIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    ErrorOutline as ErrorIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Utilitaires de performance et debounce
import { debounceSearch, debounceWithCleanup, throttle } from '../../utils/debounce';
import { UsersPerformanceOptimizer } from '../../utils/UsersPerformanceOptimizer';

// =============================================================================
// 🔍 ALGORITHME DE FUZZY MATCHING (LEVENSHTEIN DISTANCE)
// =============================================================================

/**
 * Calcule la distance de Levenshtein entre deux chaînes
 * @param {string} str1 - Première chaîne
 * @param {string} str2 - Deuxième chaîne
 * @returns {number} - Distance de Levenshtein
 */
export const calculateLevenshteinDistance = (str1, str2) => {
    const matrix = [];
    const n = str1.length;
    const m = str2.length;

    // Initialiser la matrice
    for (let i = 0; i <= n; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= m; j++) {
        matrix[0][j] = j];
    }

    // Calculer les distances
    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,     // suppression
                matrix[i][j - 1] + 1,     // insertion
                matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }

    return matrix[n][m];
};

/**
 * Calcule le score de similarité entre 0 et 1
 * @param {string} str1 - Première chaîne
 * @param {string} str2 - Deuxième chaîne
 * @returns {number} - Score de similarité
 */
export const calculateSimilarityScore = (str1, str2) => {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 1;
    
    const maxLength = Math.max(str1.length, str2.length);
    const distance = calculateLevenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    return 1 - (distance / maxLength);
};

// =============================================================================
// 📊 TYPES ET INTERFACES
// =============================================================================

/**
 * @typedef {Object} User
 * @property {string} id - ID unique de l'utilisateur
 * @property {string} name - Nom complet
 * @property {string} email - Adresse email
 * @property {string} phone - Numéro de téléphone
 * @property {string} department - Département
 * @property {string} group - Groupe de sécurité
 * @property {'active'|'inactive'|'disabled'} status - Statut
 * @property {string[]} tags - Tags/Badges
 * @property {string} avatar - URL avatar
 * @property {Date} lastLogin - Dernière connexion
 */

/**
 * @typedef {Object} SearchFilters
 * @property {string} status - Filtre par statut
 * @property {string} department - Filtre par département
 * @property {string} group - Filtre par groupe
 * @property {boolean} hasActiveLoans - A des prêts actifs
 */

/**
 * @typedef {Object} SearchResult
 * @property {User} user - Utilisateur trouvé
 * @property {number} score - Score de pertinence (0-100)
 * @property {string} matchedField - Champ qui a correspondu
 * @property {string} matchType - Type de correspondance (exact, fuzzy, partial)
 */

// =============================================================================
// 🎯 COMPOSANT PRINCIPAL
// =============================================================================

/**
 * Composant de recherche intelligente avec fuzzy matching et autocomplétion
 * Optimisé pour 500+ utilisateurs avec throttling et debounce intelligent
 */
const UsersSmartSearch = ({
    users = [],
    onUserSelect,
    onSearchChange,
    placeholder = "Rechercher des utilisateurs par nom, email, téléphone...",
    maxResults = 50,
    enableHistory = true,
    enableFilters = true,
    enableFuzzySearch = true,
    enableAutocomplete = true,
    showPerformanceMetrics = false,
    className
}) => {
    // États principaux
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [autocompleteOptions, setAutocompleteOptions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [filters, setFilters] = useState({
        status: 'all',
        department: 'all',
        group: 'all',
        hasActiveLoans: 'all'
    });
    const [searchHistory, setSearchHistory] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [searchMetrics, setSearchMetrics] = useState({
        duration: 0,
        resultsCount: 0,
        cacheHits: 0
    });

    // Réfs et optimisations
    const searchInputRef = useRef();
    const autocompleteRef = useRef();
    const optimizer = useMemo(() => new UsersPerformanceOptimizer(), []);
    const searchCache = useRef(new Map());

    // Hooks de performance
    const theme = useTheme();

    // =============================================================================
    // 📈 DONNÉES DÉRIVÉES
    // =============================================================================

    // Extraire les options de filtres uniques
    const filterOptions = useMemo(() => ({
        departments: [...new Set(users.map(u => u.department).filter(Boolean))].sort(),
        groups: [...new Set(users.map(u => u.group).filter(Boolean))].sort(),
        statuses: ['active', 'inactive', 'disabled']
    }), [users]);

    // Historique de recherche depuis localStorage
    useEffect(() => {
        if (enableHistory) {
            try {
                const saved = localStorage.getItem('users-search-history');
                if (saved) {
                    setSearchHistory(JSON.parse(saved).slice(0, 10)); // Garder seulement les 10 derniers
                }
            } catch (error) {
                console.warn('Erreur lors du chargement de l\'historique:', error);
            }
        }
    }, [enableHistory]);

    // =============================================================================
    // 🔍 ALGORITHME DE RECHERCHE INTELLIGENT
    // =============================================================================

    /**
     * Recherche intelligente avec fuzzy matching
     * @param {string} query - Terme de recherche
     * @param {SearchFilters} activeFilters - Filtres actifs
     * @returns {SearchResult[]} - Résultats ordonnés par pertinence
     */
    const performSmartSearch = useCallback((query, activeFilters = filters) => {
        if (!query || query.trim().length === 0) return [];

        const normalizedQuery = query.toLowerCase().trim();
        
        // Vérifier le cache
        const cacheKey = `${normalizedQuery}-${JSON.stringify(activeFilters)}`;
        if (searchCache.current.has(cacheKey)) {
            const cached = searchCache.current.get(cacheKey);
            setSearchMetrics(prev => ({ ...prev, cacheHits: prev.cacheHits + 1 }));
            return cached;
        }

        const startTime = performance.now();
        const results = [];

        // Filtrer d'abord par critères exacts
        let filteredUsers = users.filter(user => {
            // Filtre statut
            if (activeFilters.status !== 'all' && user.status !== activeFilters.status) return false;
            // Filtre département
            if (activeFilters.department !== 'all' && user.department !== activeFilters.department) return false;
            // Filtre groupe
            if (activeFilters.group !== 'all' && user.group !== activeFilters.group) return false;
            // Filtre prêts actifs
            if (activeFilters.hasActiveLoans === 'yes' && !user.hasActiveLoans) return false;
            if (activeFilters.hasActiveLoans === 'no' && user.hasActiveLoans) return false;
            
            return true;
        });

        // Calculer les scores pour chaque utilisateur
        filteredUsers.forEach(user => {
            let maxScore = 0;
            let matchedField = '';
            let matchType = 'none';

            // Recherche par nom
            const nameSimilarity = calculateSimilarityScore(query, user.name || '');
            if (nameSimilarity > maxScore) {
                maxScore = nameSimilarity;
                matchedField = 'name';
                matchType = nameSimilarity === 1 ? 'exact' : (nameSimilarity > 0.7 ? 'fuzzy' : 'partial');
            }

            // Recherche par email
            const emailSimilarity = calculateSimilarityScore(query, user.email || '');
            if (emailSimilarity > maxScore) {
                maxScore = emailSimilarity;
                matchedField = 'email';
                matchType = emailSimilarity === 1 ? 'exact' : (emailSimilarity > 0.7 ? 'fuzzy' : 'partial');
            }

            // Recherche par téléphone
            const phoneSimilarity = calculateSimilarityScore(query, user.phone || '');
            if (phoneSimilarity > maxScore) {
                maxScore = phoneSimilarity;
                matchedField = 'phone';
                matchType = phoneSimilarity === 1 ? 'exact' : (phoneSimilarity > 0.7 ? 'fuzzy' : 'partial');
            }

            // Recherche par département
            const deptSimilarity = calculateSimilarityScore(query, user.department || '');
            if (deptSimilarity > maxScore) {
                maxScore = deptSimilarity;
                matchedField = 'department';
                matchType = deptSimilarity === 1 ? 'exact' : (deptSimilarity > 0.7 ? 'fuzzy' : 'partial');
            }

            // Recherche par nom d'utilisateur (sans email)
            if (user.username) {
                const usernameSimilarity = calculateSimilarityScore(query, user.username);
                if (usernameSimilarity > maxScore) {
                    maxScore = usernameSimilarity;
                    matchedField = 'username';
                    matchType = usernameSimilarity === 1 ? 'exact' : (usernameSimilarity > 0.7 ? 'fuzzy' : 'partial');
                }
            }

            // Seuil minimum pour inclure dans les résultats
            if (maxScore >= 0.3) {
                results.push({
                    user,
                    score: Math.round(maxScore * 100),
                    matchedField,
                    matchType
                });
            }
        });

        // Trier par score décroissant et limiter les résultats
        const sortedResults = results
            .sort((a, b) => b.score - a.score)
            .slice(0, maxResults);

        // Métriques de performance
        const duration = performance.now() - startTime;
        setSearchMetrics({
            duration: Math.round(duration),
            resultsCount: sortedResults.length,
            cacheHits: 0
        });

        // Mettre en cache
        searchCache.current.set(cacheKey, sortedResults);
        
        // Nettoyer le cache si trop plein (max 100 entrées)
        if (searchCache.current.size > 100) {
            const firstKey = searchCache.current.keys().next().value;
            searchCache.current.delete(firstKey);
        }

        return sortedResults;
    }, [users, filters, maxResults]);

    /**
     * Génère des suggestions d'autocomplétion
     * @param {string} query - Terme de recherche
     * @returns {string[]} - Top 10 suggestions
     */
    const generateAutocompleteSuggestions = useCallback((query) => {
        if (!query || query.length < 2) return [];

        const suggestions = new Set();
        const normalizedQuery = query.toLowerCase();

        // Suggestions basées sur les noms
        users.forEach(user => {
            if (user.name && user.name.toLowerCase().includes(normalizedQuery)) {
                suggestions.add(user.name);
            }
            if (user.email && user.email.toLowerCase().includes(normalizedQuery)) {
                suggestions.add(user.email);
            }
            if (user.department && user.department.toLowerCase().includes(normalizedQuery)) {
                suggestions.add(user.department);
            }
        });

        return Array.from(suggestions).slice(0, 10);
    }, [users]);

    // =============================================================================
    // ⚡ GESTIONNAIRES D'ÉVÉNEMENTS OPTIMISÉS
    // =============================================================================

    // Déclenchement de la recherche avec debounce
    const debouncedSearch = useCallback(
        debounceWithCleanup((query, activeFilters) => {
            const results = performSmartSearch(query, activeFilters);
            setSearchResults(results);
            setIsSearching(false);
        }, 300),
        [performSmartSearch]
    );

    // Déclenchement de l'autocomplétion avec throttle
    const throttledAutocomplete = useCallback(
        throttle((query) => {
            const suggestions = generateAutocompleteSuggestions(query);
            setAutocompleteOptions(suggestions);
        }, 150),
        [generateAutocompleteSuggestions]
    );

    // Gestion de la saisie de recherche
    const handleSearchInputChange = useCallback((event, newInputValue) => {
        setSearchQuery(newInputValue);
        setIsSearching(true);

        if (enableAutocomplete) {
            throttledAutocomplete(newInputValue);
        }

        debouncedSearch(newInputValue, filters);

        // Notifier le parent
        if (onSearchChange) {
            onSearchChange({
                query: newInputValue,
                filters,
                resultsCount: searchResults.length,
                metrics: searchMetrics
            });
        }
    }, [debouncedSearch, throttledAutocomplete, enableAutocomplete, filters, searchResults.length, searchMetrics, onSearchChange]);

    // Gestion de la sélection d'un utilisateur
    const handleUserSelect = useCallback((event, selectedUser) => {
        if (selectedUser && onUserSelect) {
            onUserSelect(selectedUser.user || selectedUser);
            
            // Ajouter à l'historique
            if (enableHistory && searchQuery) {
                const newHistory = [
                    { query: searchQuery, timestamp: new Date(), results: searchResults.length },
                    ...searchHistory.filter(h => h.query !== searchQuery)
                ].slice(0, 10);
                
                setSearchHistory(newHistory);
                try {
                    localStorage.setItem('users-search-history', JSON.stringify(newHistory));
                } catch (error) {
                    console.warn('Erreur lors de la sauvegarde de l\'historique:', error);
                }
            }
        }
    }, [searchQuery, searchResults, searchHistory, onUserSelect, enableHistory]);

    // Gestion des filtres
    const handleFilterChange = useCallback((newFilters) => {
        setFilters(newFilters);
        if (searchQuery) {
            debouncedSearch(searchQuery, newFilters);
        }
    }, [debouncedSearch, searchQuery]);

    // Effacer la recherche
    const handleClearSearch = useCallback(() => {
        setSearchQuery('');
        setSearchResults([]);
        setAutocompleteOptions([]);
        setIsSearching(false);
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, []);

    // Supprimer un élément de l'historique
    const handleRemoveFromHistory = useCallback((queryToRemove) => {
        const newHistory = searchHistory.filter(h => h.query !== queryToRemove);
        setSearchHistory(newHistory);
        try {
            localStorage.setItem('users-search-history', JSON.stringify(newHistory));
        } catch (error) {
            console.warn('Erreur lors de la sauvegarde de l\'historique:', error);
        }
    }, [searchHistory]);

    // =============================================================================
    // 🎨 RENDU DES COMPOSANTS UI
    // =============================================================================

    // Rendu des options d'autocomplétion personnalisées
    const renderAutocompleteOption = useCallback((props, option) => (
        <Box component="li" {...props}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <SearchIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" sx={{ flex: 1 }}>
                    {option}
                </Typography>
                <Chip 
                    size="small" 
                    label="Suggestion" 
                    color="primary" 
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                />
            </Box>
        </Box>
    ), []);

    // Rendu des éléments de l'historique
    const renderHistoryItem = useCallback((historyItem, index) => (
        <motion.div
            key={`${historyItem.query}-${index}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
        >
            <ListItem
                secondaryAction={
                    <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleRemoveFromHistory(historyItem.query)}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                }
                sx={{ px: 1, py: 0.5 }}
            >
                <ListItemButton
                    onClick={() => setSearchQuery(historyItem.query)}
                    sx={{ borderRadius: 1, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) } }}
                >
                    <HistoryIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                    <ListItemText
                        primary={historyItem.query}
                        secondary={`${historyItem.results} résultat${historyItem.results > 1 ? 's' : ''} - ${historyItem.timestamp.toLocaleTimeString()}`}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                    />
                </ListItemButton>
            </ListItem>
        </motion.div>
    ), [theme, handleRemoveFromHistory]);

    // Rendu des résultats de recherche
    const renderSearchResult = useCallback((props, searchResult) => (
        <Box component="li" {...props}>
            <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
            >
                <Card 
                    variant="outlined" 
                    sx={{ 
                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        '&:hover': {
                            borderColor: theme.palette.primary.main,
                            bgcolor: alpha(theme.palette.primary.main, 0.04)
                        }
                    }}
                >
                    <CardContent sx={{ py: 1.5, px: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {/* Avatar ou icône par défaut */}
                            <Box sx={{ 
                                width: 40, 
                                height: 40, 
                                borderRadius: '50%',
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {searchResult.user.avatar ? (
                                    <img 
                                        src={searchResult.user.avatar} 
                                        alt={searchResult.user.name}
                                        style={{ 
                                            width: '100%', 
                                            height: '100%', 
                                            borderRadius: '50%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                ) : (
                                    <PersonIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                                )}
                            </Box>

                            {/* Informations utilisateur */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="subtitle2" noWrap fontWeight={600}>
                                    {searchResult.user.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" noWrap>
                                    {searchResult.user.email}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        {searchResult.user.department}
                                    </Typography>
                                    {searchResult.user.phone && (
                                        <>
                                            <Typography variant="caption" color="text.secondary">•</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {searchResult.user.phone}
                                            </Typography>
                                        </>
                                    )}
                                </Box>
                            </Box>

                            {/* Score et type de correspondance */}
                            <Box sx={{ textAlign: 'right' }}>
                                <Chip
                                    size="small"
                                    label={`${searchResult.score}%`}
                                    color={searchResult.score >= 80 ? 'success' : searchResult.score >= 60 ? 'warning' : 'default'}
                                    sx={{ mb: 0.5 }}
                                />
                                <Typography variant="caption" color="text.secondary" display="block">
                                    {searchResult.matchType === 'exact' ? 'Exakte' : 
                                     searchResult.matchType === 'fuzzy' ? 'Fuzzy' : 'Partiel'}
                                </Typography>
                            </Box>

                            {/* Statut utilisateur */}
                            <Box>
                                {searchResult.user.status === 'active' && (
                                    <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                                )}
                                {searchResult.user.status === 'disabled' && (
                                    <CancelIcon sx={{ color: 'error.main', fontSize: 20 }} />
                                )}
                                {searchResult.user.status === 'inactive' && (
                                    <ErrorIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                                )}
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </motion.div>
        </Box>
    ), [theme]);

    return (
        <Box className={className} sx={{ width: '100%', maxWidth: 800 }}>
            {/* En-tête avec métriques */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <SearchIcon color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                        Recherche Intelligente
                    </Typography>
                    {searchQuery && (
                        <Chip 
                            size="small" 
                            label={`${searchResults.length} résultat${searchResults.length > 1 ? 's' : ''}`}
                            color="primary"
                            variant="outlined"
                        />
                    )}
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {showPerformanceMetrics && (
                        <Tooltip title={`${searchMetrics.duration}ms • ${searchMetrics.cacheHits} cache hit${searchMetrics.cacheHits !== 1 ? 's' : ''}`}>
                            <Chip
                                size="small"
                                icon={<TrendingUpIcon />}
                                label={`${searchMetrics.duration}ms`}
                                variant="outlined"
                                color="secondary"
                            />
                        </Tooltip>
                    )}
                    
                    <Tooltip title="Afficher/Masquer les filtres">
                        <IconButton
                            onClick={() => setShowFilters(!showFilters)}
                            color={showFilters ? 'primary' : 'default'}
                        >
                            <FilterList />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Composant de recherche principal */}
            <Autocomplete
                ref={autocompleteRef}
                freeSolo
                options={searchQuery ? autocompleteOptions : []}
                inputValue={searchQuery}
                onInputChange={handleSearchInputChange}
                onChange={handleUserSelect}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        ref={searchInputRef}
                        fullWidth
                        placeholder={placeholder}
                        InputProps={{
                            ...params.InputProps,
                            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                            endAdornment: (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {isSearching && <CircularProgress size={16} />}
                                    {searchQuery && (
                                        <IconButton size="small" onClick={handleClearSearch}>
                                            <ClearIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </Box>
                            ),
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                '&.Mui-focused fieldset': {
                                    borderColor: theme.palette.primary.main,
                                },
                            },
                        }}
                    />
                )}
                renderOption={enableAutocomplete ? renderAutocompleteOption : undefined}
                filterOptions={(x) => x} // Pas de filtrage automatique, on gère nous-mêmes
                noOptionsText="Aucun résultat"
                loadingText="Recherche en cours..."
                loading={isSearching}
                getOptionLabel={(option) => typeof option === 'string' ? option : option.user?.name || ''}
                isOptionEqualToValue={(option, value) => option.user?.id === value.user?.id}
            />

            {/* Résultats de recherche */}
            <AnimatePresence>
                {searchResults.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Paper 
                            sx={{ 
                                mt: 2, 
                                maxHeight: 400, 
                                overflow: 'auto',
                                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                            }}
                        >
                            <List sx={{ p: 0 }}>
                                {searchResults.map((result, index) => (
                                    <ListItem key={result.user.id} disablePadding>
                                        <ListItemButton
                                            onClick={() => handleUserSelect(null, result.user)}
                                            sx={{ 
                                                borderBottom: index < searchResults.length - 1 ? 
                                                    `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none',
                                                '&:hover': {
                                                    bgcolor: alpha(theme.palette.primary.main, 0.05)
                                                }
                                            }}
                                        >
                                            {renderSearchResult({ key: result.user.id }, result)}
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Aucun résultat */}
            <AnimatePresence>
                {searchQuery && searchResults.length === 0 && !isSearching && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Paper sx={{ mt: 2, p: 3, textAlign: 'center' }}>
                            <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="h6" gutterBottom>
                                Aucun résultat trouvé
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Essayez avec des termes différents ou ajustez vos filtres
                            </Typography>
                        </Paper>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Historique des recherches */}
            <AnimatePresence>
                {enableHistory && !searchQuery && searchHistory.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Paper sx={{ mt: 2, p: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <HistoryIcon color="primary" />
                                <Typography variant="subtitle1" fontWeight={600}>
                                    Recherches Récentes
                                </Typography>
                                <Chip 
                                    size="small" 
                                    label={`${searchHistory.length}`}
                                    color="primary"
                                    variant="outlined"
                                />
                            </Box>
                            
                            <List sx={{ p: 0 }}>
                                <AnimatePresence>
                                    {searchHistory.map((item, index) => renderHistoryItem(item, index))}
                                </AnimatePresence>
                            </List>
                        </Paper>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Filtres rapides */}
            <AnimatePresence>
                {enableFilters && showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Paper sx={{ mt: 2, p: 2 }}>
                            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                                Filtres Rapides
                            </Typography>
                            
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {/* Filtres statut */}
                                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                    <CheckCircleIcon fontSize="small" color="success" />
                                    <Button
                                        size="small"
                                        variant={filters.status === 'active' ? 'contained' : 'outlined'}
                                        onClick={() => handleFilterChange({ ...filters, status: filters.status === 'active' ? 'all' : 'active' })}
                                    >
                                        Actifs
                                    </Button>
                                </Box>
                                
                                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                    <CancelIcon fontSize="small" color="error" />
                                    <Button
                                        size="small"
                                        variant={filters.status === 'disabled' ? 'contained' : 'outlined'}
                                        onClick={() => handleFilterChange({ ...filters, status: filters.status === 'disabled' ? 'all' : 'disabled' })}
                                    >
                                        Désactivés
                                    </Button>
                                </Box>

                                {/* Filtres départements populaires */}
                                {filterOptions.departments.slice(0, 5).map(dept => (
                                    <Button
                                        key={dept}
                                        size="small"
                                        variant={filters.department === dept ? 'contained' : 'outlined'}
                                        startIcon={<WorkIcon />}
                                        onClick={() => handleFilterChange({ ...filters, department: filters.department === dept ? 'all' : dept })}
                                    >
                                        {dept}
                                    </Button>
                                ))}

                                {/* Filtre prêts actifs */}
                                <Button
                                    size="small"
                                    variant={filters.hasActiveLoans === 'yes' ? 'contained' : 'outlined'}
                                    startIcon={<GroupIcon />}
                                    onClick={() => handleFilterChange({ ...filters, hasActiveLoans: filters.hasActiveLoans === 'yes' ? 'all' : 'yes' })}
                                >
                                    Avec Prêts
                                </Button>
                            </Box>
                        </Paper>
                    </motion.div>
                )}
            </AnimatePresence>
        </Box>
    );
};

UsersSmartSearch.displayName = 'UsersSmartSearch';

export default UsersSmartSearch;

// Export des utilitaires pour tests unitaires
export {
    calculateLevenshteinDistance,
    calculateSimilarityScore
};