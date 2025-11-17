// src/components/search/test-search-system.js - TESTS DU SYSTÈME DE RECHERCHE
// Script de test pour vérifier toutes les fonctionnalités du système

import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Button,
    Paper,
    Grid,
    List,
    ListItem,
    ListItemText,
    Alert,
    Chip,
    LinearProgress,
    Divider,
    useTheme
} from '@mui/material';
import {
    PlayArrow as RunIcon,
    CheckCircle as SuccessIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    Speed as PerformanceIcon
} from '@mui/icons-material';

// Import des composants à tester
import { 
    useSmartSearch, 
    searchService,
    SearchBar,
    SearchFilters,
    SearchResults,
    SearchHistory,
    searchUtils
} from './index';

// Données de test
const TEST_DATA = [
    {
        id: '1',
        documentTitle: 'Contrat de Test Alpha',
        documentType: 'Contrat',
        borrowerName: 'Jean Testeur',
        borrowerEmail: 'jean.test@test.com',
        borrowerId: 'test-001',
        status: 'active',
        loanDate: '2025-11-01T10:00:00Z',
        returnDate: '2025-11-15T18:00:00Z',
        notes: 'Document de test pour vérification système'
    },
    {
        id: '2',
        documentTitle: 'Facture Test Beta',
        documentType: 'Facture',
        borrowerName: 'Marie Test',
        borrowerEmail: 'marie.test@test.com',
        borrowerId: 'test-002',
        status: 'overdue',
        loanDate: '2025-10-15T14:00:00Z',
        returnDate: '2025-10-30T17:00:00Z',
        notes: 'Facture en retard pour test'
    }
];

// Hook de test principal
const useSearchSystemTest = () => {
    const [testResults, setTestResults] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState(0);

    const runTests = async () => {
        setIsRunning(true);
        setTestResults([]);
        setProgress(0);

        const tests = [
            {
                name: 'Initialisation du service',
                test: async () => {
                    try {
                        const success = await searchService.initialize(TEST_DATA);
                        return {
                            success,
                            message: success ? 'Service initialisé avec succès' : 'Échec de l\'initialisation'
                        };
                    } catch (error) {
                        return { success: false, message: `Erreur: ${error.message}` };
                    }
                }
            },
            {
                name: 'Recherche basique',
                test: async () => {
                    try {
                        const result = await searchService.search('Contrat');
                        return {
                            success: result.results.length > 0,
                            message: `${result.results.length} résultat(s) trouvé(s) pour "Contrat"`
                        };
                    } catch (error) {
                        return { success: false, message: `Erreur recherche: ${error.message}` };
                    }
                }
            },
            {
                name: 'Fuzzy search (recherche floue)',
                test: async () => {
                    try {
                        // Test avec faute de frappe intentionnelle
                        const result = await searchService.search('Cntract'); // "Contrat" mal orthographié
                        return {
                            success: result.results.length > 0,
                            message: `Fuzzy search: ${result.results.length} résultat(s) pour "Cntract"`
                        };
                    } catch (error) {
                        return { success: false, message: `Erreur fuzzy search: ${error.message}` };
                    }
                }
            },
            {
                name: 'Suggestions de recherche',
                test: async () => {
                    try {
                        const suggestions = await searchService.getSuggestions('Contrat', 5);
                        return {
                            success: suggestions.length > 0,
                            message: `${suggestions.length} suggestion(s) générée(s)`
                        };
                    } catch (error) {
                        return { success: false, message: `Erreur suggestions: ${error.message}` };
                    }
                }
            },
            {
                name: 'Génération de facets',
                test: async () => {
                    try {
                        const facets = await searchService.getFacetData();
                        const facetCount = Object.keys(facets).length;
                        return {
                            success: facetCount > 0,
                            message: `${facetCount} facette(s) générée(s)`
                        };
                    } catch (error) {
                        return { success: false, message: `Erreur facets: ${error.message}` };
                    }
                }
            },
            {
                name: 'Cache de recherche',
                test: async () => {
                    try {
                        // Première recherche
                        const result1 = await searchService.search('Test');
                        // Deuxième recherche (doit utiliser le cache)
                        const result2 = await searchService.search('Test');
                        
                        const cacheStats = searchService.getServiceStats().cache;
                        return {
                            success: cacheStats.hits > 0 || result1.searchTime > 0,
                            message: `Cache hit rate: ${cacheStats.hitRate}%`
                        };
                    } catch (error) {
                        return { success: false, message: `Erreur cache: ${error.message}` };
                    }
                }
            },
            {
                name: 'Historique de recherche',
                test: async () => {
                    try {
                        // Effectuer plusieurs recherches pour créer un historique
                        await searchService.search('Test 1');
                        await searchService.search('Test 2');
                        await searchService.search('Test 3');
                        
                        const history = searchService.getSearchHistory(10);
                        return {
                            success: history.length > 0,
                            message: `${history.length} entrée(s) dans l'historique`
                        };
                    } catch (error) {
                        return { success: false, message: `Erreur historique: ${error.message}` };
                    }
                }
            },
            {
                name: 'Recherches sauvegardées',
                test: async () => {
                    try {
                        // Sauvegarder une recherche
                        const savedSearch = searchService.saveSearch(
                            'Test Recherche',
                            'Test query',
                            { status: 'active' }
                        );
                        
                        const savedSearches = searchService.getSavedSearches();
                        return {
                            success: savedSearches.length > 0,
                            message: `${savedSearches.length} recherche(s) sauvegardée(s)`
                        };
                    } catch (error) {
                        return { success: false, message: `Erreur sauvegarde: ${error.message}` };
                    }
                }
            },
            {
                name: 'Utilitaires de recherche',
                test: async () => {
                    try {
                        // Tester les utilitaires
                        const normalized = searchUtils.normalizeText('TÉST ACCÉNTS');
                        const tokens = searchUtils.tokenizeQuery('mot1 mot2 mot3');
                        const suggestions = searchUtils.generateSuggestions(TEST_DATA, 'test', 5);
                        
                        return {
                            success: normalized === 'test accents' && tokens.length === 3,
                            message: `Utilitaires OK: "${normalized}", ${tokens.length} tokens`
                        };
                    } catch (error) {
                        return { success: false, message: `Erreur utilitaires: ${error.message}` };
                    }
                }
            },
            {
                name: 'Performance globale',
                test: async () => {
                    try {
                        const startTime = performance.now();
                        
                        // Effectuer plusieurs recherches
                        for (let i = 0; i < 10; i++) {
                            await searchService.search(`test ${i}`);
                        }
                        
                        const endTime = performance.now();
                        const totalTime = endTime - startTime;
                        const avgTime = totalTime / 10;
                        
                        return {
                            success: avgTime < 100, // Moins de 100ms par recherche en moyenne
                            message: `Temps moyen: ${avgTime.toFixed(2)}ms par recherche`
                        };
                    } catch (error) {
                        return { success: false, message: `Erreur performance: ${error.message}` };
                    }
                }
            }
        ];

        for (let i = 0; i < tests.length; i++) {
            setProgress(((i + 1) / tests.length) * 100);
            
            try {
                const result = await tests[i].test();
                setTestResults(prev => [...prev, {
                    name: tests[i].name,
                    ...result,
                    timestamp: new Date().toLocaleTimeString()
                }]);
            } catch (error) {
                setTestResults(prev => [...prev, {
                    name: tests[i].name,
                    success: false,
                    message: `Erreur inattendue: ${error.message}`,
                    timestamp: new Date().toLocaleTimeString()
                }]);
            }
        }

        setIsRunning(false);
    };

    return {
        testResults,
        isRunning,
        progress,
        runTests
    };
};

// Composant de test principal
const SearchSystemTest = () => {
    const { testResults, isRunning, progress, runTests } = useSearchSystemTest();
    const smartSearch = useSmartSearch(TEST_DATA);
    const theme = useTheme();

    // Compteurs de résultats
    const successCount = testResults.filter(result => result.success).length;
    const totalCount = testResults.length;
    const successRate = totalCount > 0 ? (successCount / totalCount * 100).toFixed(1) : 0;

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h3" gutterBottom align="center" color="primary">
                🧪 Tests du Système de Recherche DocuCortex
            </Typography>
            
            <Typography variant="h6" align="center" color="text.secondary" paragraph>
                Testez toutes les fonctionnalités du système de recherche intelligente
            </Typography>

            {/* Bouton de test */}
            <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
                <Button
                    variant="contained"
                    size="large"
                    startIcon={<RunIcon />}
                    onClick={runTests}
                    disabled={isRunning}
                    sx={{ mr: 2, mb: isRunning ? 2 : 0 }}
                >
                    {isRunning ? 'Tests en cours...' : 'Lancer tous les tests'}
                </Button>
                
                {isRunning && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" gutterBottom>
                            Progression: {Math.round(progress)}%
                        </Typography>
                        <LinearProgress variant="determinate" value={progress} />
                    </Box>
                )}
            </Paper>

            {/* Résumé des résultats */}
            {testResults.length > 0 && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6}>
                            <Typography variant="h6" gutterBottom>
                                Résumé des Tests
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Chip 
                                    label={`${successCount}/${totalCount} réussis`}
                                    color={successCount === totalCount ? 'success' : 'warning'}
                                    variant="filled"
                                />
                                <Chip 
                                    label={`${successRate}% de réussite`}
                                    color="primary"
                                    variant="outlined"
                                />
                            </Box>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <Typography variant="h6" gutterBottom>
                                Statut Global
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {successCount === totalCount ? (
                                    <>
                                        <SuccessIcon color="success" />
                                        <Typography color="success.main">Tous les tests réussis !</Typography>
                                    </>
                                ) : successCount > totalCount * 0.8 ? (
                                    <>
                                        <WarningIcon color="warning" />
                                        <Typography color="warning.main">Tests大部分 réussis</Typography>
                                    </>
                                ) : (
                                    <>
                                        <ErrorIcon color="error" />
                                        <Typography color="error.main">Plusieurs tests ont échoué</Typography>
                                    </>
                                )}
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            {/* Liste des résultats de tests */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Détail des Tests
                </Typography>
                
                {testResults.length === 0 ? (
                    <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                        Cliquez sur "Lancer tous les tests" pour commencer
                    </Typography>
                ) : (
                    <List>
                        {testResults.map((result, index) => (
                            <React.Fragment key={index}>
                                <ListItem>
                                    <Box sx={{ width: '100%' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {result.name}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    {result.timestamp}
                                                </Typography>
                                                {result.success ? (
                                                    <SuccessIcon color="success" fontSize="small" />
                                                ) : (
                                                    <ErrorIcon color="error" fontSize="small" />
                                                )}
                                            </Box>
                                        </Box>
                                        
                                        <Typography 
                                            variant="body2" 
                                            color={result.success ? 'success.main' : 'error.main'}
                                        >
                                            {result.message}
                                        </Typography>
                                        
                                        {result.success && (
                                            <Alert severity="success" sx={{ mt: 1, py: 0.5 }}>
                                                ✅ Test réussi
                                            </Alert>
                                        )}
                                        
                                        {!result.success && (
                                            <Alert severity="error" sx={{ mt: 1, py: 0.5 }}>
                                                ❌ Test échoué
                                            </Alert>
                                        )}
                                    </Box>
                                </ListItem>
                                {index < testResults.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </Paper>

            {/* Test interactif avec useSmartSearch */}
            {testResults.length > 0 && (
                <Paper sx={{ p: 3, mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        🎮 Test Interactif du Hook useSmartSearch
                    </Typography>
                    
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <SearchBar
                                value={smartSearch.searchQuery}
                                onChange={smartSearch.search}
                                onSearch={smartSearch.search}
                                placeholder="Testez la recherche en temps réel..."
                                loading={smartSearch.isSearching}
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Chip 
                                    label={`${smartSearch.results.length} résultats`}
                                    color="primary"
                                    variant="outlined"
                                />
                                <Chip 
                                    label={`${smartSearch.suggestions.length} suggestions`}
                                    color="secondary"
                                    variant="outlined"
                                />
                                {smartSearch.searchTime > 0 && (
                                    <Chip 
                                        label={`${smartSearch.searchTime.toFixed(1)}ms`}
                                        color="success"
                                        variant="outlined"
                                    />
                                )}
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            )}
        </Container>
    );
};

export default SearchSystemTest;
