// src/components/search/AdvancedSearchContainer.js - CONTAINER PRINCIPAL DE RECHERCHE INTELLIGENTE
// Intégration complète du système de recherche avec tous les composants

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box,
    Drawer,
    Paper,
    Typography,
    IconButton,
    Button,
    Divider,
    useMediaQuery,
    useTheme,
    Grid,
    Card,
    CardContent,
    Alert,
    Snackbar,
    Fade,
    Tooltip,
    Badge
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterList as FilterIcon,
    Close as CloseIcon,
    Fullscreen as FullscreenIcon,
    Settings as SettingsIcon,
    Analytics as AnalyticsIcon,
    FullscreenExit as ExitFullscreenIcon,
    KeyboardArrowLeft as BackIcon,
    KeyboardArrowRight as ForwardIcon,
    Refresh as RefreshIcon,
    Clear as ClearIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Import des composants de recherche
import useSmartSearch from './SmartSearchEngine';
import SearchBar from './SearchBar';
import SearchSuggestions from './SearchSuggestions';
import SearchFilters from './SearchFilters';
import SearchResults from './SearchResults';
import SearchHistory from './SearchHistory';

// Import du service de recherche
import searchService from '../../services/searchService';

// Configuration des positions du drawer
const DRAWER_POSITIONS = {
    left: 'left',
    right: 'right',
    bottom: 'bottom'
};

const AdvancedSearchContainer = ({
    data = [],
    onResultSelect,
    onResultAction,
    drawerPosition = 'right',
    drawerWidth = 600,
    initialQuery = '',
    initialFilters = {},
    showHistory = true,
    showFilters = true,
    showAnalytics = true,
    autoOpen = false,
    persistent = false,
    className,
    sx = {}
}) => {
    const [drawerOpen, setDrawerOpen] = useState(autoOpen);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [viewMode, setViewMode] = useState('results'); // results, history, filters
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [isSearching, setIsSearching] = useState(false);
    const [lastSearchQuery, setLastSearchQuery] = useState('');
    const [searchStats, setSearchStats] = useState(null);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

    // Hook de recherche intelligente
    const smartSearch = useSmartSearch(data, {
        enableFuzzySearch: true,
        enableAutoComplete: true,
        enableHistory: true,
        enableFacets: true,
        debounceMs: 300,
        maxResults: 200
    });

    // Initialisation du service de recherche
    useEffect(() => {
        const initializeSearch = async () => {
            try {
                await searchService.initialize(data);
                console.log('Service de recherche DocuCortex initialisé');
            } catch (error) {
                console.error('Erreur lors de l\'initialisation:', error);
                showSnackbar('Erreur lors de l\'initialisation du système de recherche', 'error');
            }
        };

        if (data.length > 0) {
            initializeSearch();
        }
    }, [data]);

    // Synchroniser avec le service de recherche
    useEffect(() => {
        const performSearch = async () => {
            if (smartSearch.searchQuery.trim()) {
                setIsSearching(true);
                try {
                    const result = await searchService.search(
                        smartSearch.searchQuery,
                        smartSearch.filters,
                        {
                            limit: 100,
                            sortBy: 'relevance',
                            minScore: 0.3
                        }
                    );
                    
                    if (result.error) {
                        showSnackbar(result.error, 'error');
                    }
                    
                    setLastSearchQuery(smartSearch.searchQuery);
                    setSearchStats(result.stats);
                } catch (error) {
                    console.error('Erreur lors de la recherche:', error);
                    showSnackbar('Erreur lors de la recherche', 'error');
                } finally {
                    setIsSearching(false);
                }
            }
        };

        // Debounce la recherche
        const timeoutId = setTimeout(performSearch, 300);
        return () => clearTimeout(timeoutId);
    }, [smartSearch.searchQuery, smartSearch.filters]);

    // Gestionnaires d'événements
    const showSnackbar = useCallback((message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    }, []);

    const hideSnackbar = useCallback(() => {
        setSnackbar({ open: false, message: '', severity: 'info' });
    }, []);

    const handleDrawerToggle = useCallback(() => {
        setDrawerOpen(prev => !prev);
    }, []);

    const handleFullscreenToggle = useCallback(() => {
        setIsFullscreen(prev => !prev);
    }, []);

    const handleSearch = useCallback((query) => {
        smartSearch.search(query);
        if (query.trim()) {
            showSnackbar(`Recherche: "${query}"`, 'success');
        }
    }, [smartSearch, showSnackbar]);

    const handleFilterChange = useCallback((filters) => {
        smartSearch.updateFilters(filters);
        const activeFilters = Object.keys(filters).filter(key => filters[key] && filters[key] !== '').length;
        if (activeFilters > 0) {
            showSnackbar(`${activeFilters} filtre(s) appliqué(s)`, 'info');
        }
    }, [smartSearch, showSnackbar]);

    const handleHistorySelect = useCallback((historyItem) => {
        smartSearch.search(historyItem.query);
        showSnackbar(`Recherche depuis l'historique: "${historyItem.query}"`, 'info');
    }, [smartSearch, showSnackbar]);

    const handleResultSelect = useCallback((result) => {
        if (onResultSelect) {
            onResultSelect(result);
        }
        showSnackbar(`Document sélectionné: ${result.documentTitle}`, 'success');
    }, [onResultSelect, showSnackbar]);

    const handleResultAction = useCallback((action, result) => {
        if (onResultAction) {
            onResultAction(action, result);
        }
        showSnackbar(`Action "${action}" sur ${result.documentTitle}`, 'info');
    }, [onResultAction, showSnackbar]);

    const handleClearAll = useCallback(() => {
        smartSearch.clearFilters();
        smartSearch.search('');
        showSnackbar('Tous les filtres ont été effacés', 'info');
    }, [smartSearch, showSnackbar]);

    // Raccourcis clavier
    useEffect(() => {
        const handleKeyDown = (event) => {
            // Ctrl/Cmd + K pour ouvrir la recherche
            if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
                event.preventDefault();
                if (!drawerOpen) {
                    handleDrawerToggle();
                }
            }

            // Escape pour fermer
            if (event.key === 'Escape' && drawerOpen) {
                handleDrawerToggle();
            }

            // F11 pour plein écran
            if (event.key === 'F11') {
                event.preventDefault();
                handleFullscreenToggle();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [drawerOpen, handleDrawerToggle, handleFullscreenToggle]);

    // Configuration du drawer
    const drawerConfig = useMemo(() => {
        const config = {
            position: drawerPosition,
            width: isFullscreen ? '100vw' : (isMobile ? '100vw' : drawerWidth),
            height: isFullscreen ? '100vh' : (drawerPosition === 'bottom' ? '80vh' : '100vh')
        };

        if (isMobile) {
            config.position = 'bottom';
            config.height = '90vh';
        }

        return config;
    }, [drawerPosition, drawerWidth, isMobile, isFullscreen]);

    // Contenu principal
    const SearchContent = () => (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* En-tête */}
            <Paper 
                elevation={2} 
                sx={{ 
                    p: 2, 
                    borderRadius: 0,
                    borderBottom: `1px solid ${theme.palette.divider}`
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <SearchIcon color="primary" fontSize="large" />
                        <Typography variant="h5" fontWeight="bold">
                            Recherche Intelligente DocuCortex
                        </Typography>
                        {searchStats && (
                            <Tooltip title="Statistiques de recherche">
                                <Badge badgeContent={searchStats.totalFound} color="primary">
                                    <AnalyticsIcon />
                                </Badge>
                            </Tooltip>
                        )}
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Tooltip title="Plein écran">
                            <IconButton onClick={handleFullscreenToggle}>
                                {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
                            </IconButton>
                        </Tooltip>
                        
                        {!persistent && (
                            <Tooltip title="Fermer">
                                <IconButton onClick={handleDrawerToggle}>
                                    <CloseIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                </Box>

                {/* Barre de recherche */}
                <Box sx={{ mt: 2 }}>
                    <SearchBar
                        value={smartSearch.searchQuery}
                        onChange={smartSearch.setSearchQuery}
                        onSearch={handleSearch}
                        onClear={() => smartSearch.search('')}
                        onFilterClick={() => setViewMode('filters')}
                        onHistoryClick={() => setViewMode('history')}
                        placeholder="Rechercher dans les prêts, documents, utilisateurs..."
                        suggestions={smartSearch.suggestions}
                        onSuggestionSelect={(suggestion) => smartSearch.search(suggestion)}
                        recentSearches={smartSearch.recentSearches}
                        filtersCount={Object.keys(smartSearch.filters).filter(key => 
                            smartSearch.filters[key] && smartSearch.filters[key] !== ''
                        ).length}
                        loading={isSearching}
                        fullWidth
                    />
                </Box>

                {/* Navigation entre les vues */}
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button
                        variant={viewMode === 'results' ? 'contained' : 'outlined'}
                        startIcon={<SearchIcon />}
                        onClick={() => setViewMode('results')}
                        size="small"
                    >
                        Résultats
                    </Button>
                    
                    {showFilters && (
                        <Button
                            variant={viewMode === 'filters' ? 'contained' : 'outlined'}
                            startIcon={<FilterIcon />}
                            onClick={() => setViewMode('filters')}
                            size="small"
                        >
                            Filtres
                        </Button>
                    )}
                    
                    {showHistory && (
                        <Button
                            variant={viewMode === 'history' ? 'contained' : 'outlined'}
                            startIcon={<AnalyticsIcon />}
                            onClick={() => setViewMode('history')}
                            size="small"
                        >
                            Historique
                        </Button>
                    )}
                    
                    <Box sx={{ ml: 'auto' }}>
                        <Tooltip title="Actualiser l'index">
                            <IconButton 
                                size="small"
                                onClick={() => {
                                    searchService.rebuildIndex(data);
                                    showSnackbar('Index de recherche actualisé', 'success');
                                }}
                            >
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Effacer tous les filtres">
                            <IconButton 
                                size="small"
                                onClick={handleClearAll}
                                disabled={Object.keys(smartSearch.filters).length === 0}
                            >
                                <ClearIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            </Paper>

            {/* Contenu selon la vue */}
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
                <AnimatePresence mode="wait">
                    {viewMode === 'results' && (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            style={{ height: '100%' }}
                        >
                            <SearchResults
                                results={smartSearch.results}
                                loading={smartSearch.isSearching}
                                searchQuery={smartSearch.searchQuery}
                                filters={smartSearch.filters}
                                onResultSelect={handleResultSelect}
                                onResultAction={handleResultAction}
                                totalResults={smartSearch.totalResults}
                                searchTime={smartSearch.searchTime}
                                error={smartSearch.error}
                                maxHeight="100%"
                                showStats={showAnalytics}
                            />
                        </motion.div>
                    )}

                    {viewMode === 'filters' && (
                        <motion.div
                            key="filters"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            style={{ height: '100%', overflow: 'auto' }}
                        >
                            <SearchFilters
                                filters={smartSearch.filters}
                                facets={smartSearch.facets}
                                onFiltersChange={handleFilterChange}
                                onFiltersReset={smartSearch.clearFilters}
                                onSaveFilter={smartSearch.saveCurrentFilter}
                                onLoadFilter={(name, config) => {
                                    smartSearch.updateFilters(config.filters || {});
                                    showSnackbar(`Filtre "${name}" appliqué`, 'success');
                                }}
                                onDeleteFilter={(name) => {
                                    showSnackbar(`Filtre "${name}" supprimé`, 'info');
                                }}
                                savedFilters={smartSearch.savedFilters}
                                maxHeight="100%"
                            />
                        </motion.div>
                    )}

                    {viewMode === 'history' && (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            style={{ height: '100%', overflow: 'auto' }}
                        >
                            <SearchHistory
                                history={smartSearch.getSearchHistory(50)}
                                savedSearches={Object.entries(smartSearch.savedFilters).map(([name, config]) => ({
                                    id: name,
                                    name,
                                    ...config
                                }))}
                                onSearchSelect={handleHistorySelect}
                                onSearchDelete={(item) => {
                                    smartSearch.clearCache();
                                    showSnackbar('Élément supprimé de l\'historique', 'info');
                                }}
                                onSearchClear={() => {
                                    smartSearch.clearCache();
                                    showSnackbar('Historique effacé', 'info');
                                }}
                                showAnalytics={showAnalytics}
                                maxHeight="100%"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </Box>
        </Box>
    );

    // Rendu principal
    return (
        <Box className={className} sx={sx}>
            {/* Bouton d'ouverture du drawer (si non persistant) */}
            {!persistent && (
                <Tooltip title="Recherche avancée (Ctrl+K)">
                    <IconButton
                        onClick={handleDrawerToggle}
                        sx={{
                            position: 'fixed',
                            top: 20,
                            [drawerConfig.position]: 20,
                            zIndex: 1400,
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            '&:hover': {
                                bgcolor: 'primary.dark'
                            }
                        }}
                    >
                        <SearchIcon />
                    </IconButton>
                </Tooltip>
            )}

            {/* Drawer de recherche */}
            <Drawer
                anchor={drawerConfig.position}
                open={drawerOpen}
                onClose={handleDrawerToggle}
                variant={persistent ? 'persistent' : 'temporary'}
                elevation={8}
                PaperProps={{
                    sx: {
                        width: drawerConfig.width,
                        height: drawerConfig.height,
                        maxWidth: '100vw',
                        maxHeight: '100vh'
                    }
                }}
            >
                <SearchContent />
            </Drawer>

            {/* Snackbar pour les notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={hideSnackbar}
                TransitionComponent={Fade}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    onClose={hideSnackbar} 
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* Overlay pour le mode plein écran */}
            <AnimatePresence>
                {isFullscreen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            zIndex: 1200,
                            cursor: 'pointer'
                        }}
                        onClick={handleFullscreenToggle}
                    />
                )}
            </AnimatePresence>
        </Box>
    );
};

export default React.memo(AdvancedSearchContainer);
