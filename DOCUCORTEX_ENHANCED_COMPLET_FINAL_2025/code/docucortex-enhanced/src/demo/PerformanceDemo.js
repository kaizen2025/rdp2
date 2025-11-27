// src/demo/PerformanceDemo.js - DÉMONSTRATION DES PERFORMANCES OPTIMISÉES
// Page de démonstration pour tester les optimisations de performance

import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Paper, Typography, Button, Grid, Card, CardContent,
    LinearProgress, Chip, Alert, Switch, FormControlLabel,
    TextField, Slider, Divider, IconButton, Tooltip
} from '@mui/material';
import {
    PlayArrow as PlayIcon, Pause as PauseIcon, Refresh as RefreshIcon,
    Speed as SpeedIcon, Assessment as AssessmentIcon, TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

// Import des composants optimisés
import LoanListVirtualized from '../components/loan-management/LoanListVirtualized';
import LoanListEnhanced from '../components/loan-management/LoanListEnhanced';

// Import des utilitaires
import { usePerformanceMonitor } from '../utils/PerformanceMonitor';

// 📊 DONNÉES DE TEST GÉNÉRÉES
const generateMockData = (count) => {
    const statuses = ['active', 'reserved', 'overdue', 'critical', 'returned', 'cancelled'];
    const computerTypes = ['Laptop', 'Desktop', 'Tablet', 'Workstation', 'Server'];
    const departments = ['IT', 'HR', 'Finance', 'Marketing', 'Sales', 'R&D', 'Operations'];
    
    return Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        computerName: `${computerTypes[Math.floor(Math.random() * computerTypes.length)]}-${String(i + 1).padStart(4, '0')}`,
        userId: `user-${i + 1}`,
        userName: `user${i + 1}`,
        userDisplayName: `Utilisateur ${i + 1}`,
        userDepartment: departments[Math.floor(Math.random() * departments.length)],
        loanDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        expectedReturnDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        amount: Math.floor(Math.random() * 5000) + 100,
        updatedAt: new Date().toISOString()
    }));
};

// 🎯 COMPOSANT DE DÉMONSTRATION
const PerformanceDemo = () => {
    // États de configuration
    const [datasetSize, setDatasetSize] = useState(500);
    const [isRunning, setIsRunning] = useState(false);
    const [enableMetrics, setEnableMetrics] = useState(true);
    const [viewMode, setViewMode] = useState('auto');
    const [testMode, setTestMode] = useState('enhanced'); // 'enhanced' ou 'virtualized'
    
    // État des données
    const [mockData, setMockData] = useState([]);
    const [selectedLoans, setSelectedLoans] = useState(new Set());
    
    // État de performance
    const [performanceHistory, setPerformanceHistory] = useState([]);
    
    // Surveiller les performances
    const performanceData = usePerformanceMonitor('PerformanceDemo');

    // Générer les données de test
    const generateTestData = useMemo(() => {
        return () => {
            const startTime = performance.now();
            const data = generateMockData(datasetSize);
            const endTime = performance.now();
            
            console.log(`📊 Génération de ${datasetSize} éléments en ${(endTime - startTime).toFixed(2)}ms`);
            return data;
        };
    }, [datasetSize]);

    // Gérer les données de test
    const handleGenerateData = () => {
        const startTime = performance.now();
        const data = generateTestData();
        setMockData(data);
        setSelectedLoans(new Set());
        const endTime = performance.now();
        
        // Enregistrer dans l'historique
        setPerformanceHistory(prev => [...prev.slice(-9), {
            timestamp: new Date().toLocaleTimeString(),
            datasetSize,
            generationTime: endTime - startTime,
            fps: performanceData.getCurrentMetrics().fps
        }]);
    };

    // Démarrer/Arrêter la démonstration
    const toggleDemo = () => {
        setIsRunning(!isRunning);
        if (!isRunning) {
            handleGenerateData();
        }
    };

    // Actualiser les données
    const refreshData = () => {
        handleGenerateData();
    };

    // Configuration des actions
    const handleSelectLoan = (loanId, checked) => {
        setSelectedLoans(prev => {
            const newSet = new Set(prev);
            if (checked) {
                newSet.add(loanId);
            } else {
                newSet.delete(loanId);
            }
            return newSet;
        });
    };

    const handleReturn = (loan) => {
        console.log('🔄 Retour:', loan.id);
    };

    const handleEdit = (loan) => {
        console.log('✏️ Modifier:', loan.id);
    };

    const handleExtend = (loan) => {
        console.log('⏰ Prolonger:', loan.id);
    };

    const handleHistory = (loan) => {
        console.log('📜 Historique:', loan.id);
    };

    const handleCancel = (loan) => {
        console.log('❌ Annuler:', loan.id);
    };

    const getUserColor = (userId) => {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
        const index = parseInt(userId.split('-')[1]) % colors.length;
        return {
            backgroundColor: colors[index],
            textColor: '#FFFFFF'
        };
    };

    // Auto-génération des données au montage
    useEffect(() => {
        if (isRunning) {
            handleGenerateData();
        }
    }, [isRunning, datasetSize]);

    // Composant des métriques
    const PerformanceMetrics = () => {
        const metrics = performanceData.getCurrentMetrics();
        
        return (
            <Paper elevation={2} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AssessmentIcon />
                    Métriques Temps Réel
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <Card variant="outlined">
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Typography variant="body2" color="textSecondary">
                                    Temps de Rendu
                                </Typography>
                                <Typography variant="h4" color="primary">
                                    {metrics.renderTime.toFixed(1)}ms
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6}>
                        <Card variant="outlined">
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Typography variant="body2" color="textSecondary">
                                    FPS
                                </Typography>
                                <Typography variant="h4" color={metrics.fps >= 55 ? 'success.main' : metrics.fps >= 30 ? 'warning.main' : 'error.main'}>
                                    {metrics.fps.toFixed(0)}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6}>
                        <Card variant="outlined">
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Typography variant="body2" color="textSecondary">
                                    Mémoire
                                </Typography>
                                <Typography variant="h4">
                                    {(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6}>
                        <Card variant="outlined">
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Typography variant="body2" color="textSecondary">
                                    Éléments
                                </Typography>
                                <Typography variant="h4">
                                    {mockData.length.toLocaleString()}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Paper>
        );
    };

    // Composant d'historique
    const PerformanceHistory = () => (
        <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon />
                Historique des Tests
            </Typography>
            <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                {performanceHistory.map((entry, index) => (
                    <Box key={index} sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        py: 1,
                        borderBottom: index < performanceHistory.length - 1 ? '1px solid' : 'none',
                        borderColor: 'divider'
                    }}>
                        <Box>
                            <Typography variant="body2">
                                {entry.timestamp} - {entry.datasetSize} éléments
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                Généré en {entry.generationTime.toFixed(2)}ms
                            </Typography>
                        </Box>
                        <Chip 
                            label={`${entry.fps.toFixed(0)} FPS`}
                            size="small"
                            color={entry.fps >= 55 ? 'success' : entry.fps >= 30 ? 'warning' : 'error'}
                        />
                    </Box>
                ))}
            </Box>
        </Paper>
    );

    return (
        <Box sx={{ p: 3, height: '100vh', overflow: 'hidden' }}>
            {/* Header avec contrôles */}
            <Paper elevation={3} sx={{ p: 3, mb: 2 }}>
                <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SpeedIcon color="primary" />
                    Démonstration Performance - DocuCortex Enhanced
                </Typography>
                
                <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={3}>
                        <Typography variant="body2" gutterBottom>
                            Nombre d'éléments : {datasetSize}
                        </Typography>
                        <Slider
                            value={datasetSize}
                            onChange={(e, value) => setDatasetSize(value)}
                            min={50}
                            max={5000}
                            step={50}
                            marks={[
                                { value: 50, label: '50' },
                                { value: 500, label: '500' },
                                { value: 1000, label: '1K' },
                                { value: 2000, label: '2K' },
                                { value: 5000, label: '5K' }
                            ]}
                            valueLabelDisplay="auto"
                        />
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Button
                                variant="contained"
                                color={isRunning ? "error" : "primary"}
                                startIcon={isRunning ? <PauseIcon /> : <PlayIcon />}
                                onClick={toggleDemo}
                                fullWidth
                            >
                                {isRunning ? 'Arrêter' : 'Démarrer'}
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<RefreshIcon />}
                                onClick={refreshData}
                                disabled={!isRunning}
                                fullWidth
                            >
                                Actualiser
                            </Button>
                        </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={enableMetrics}
                                        onChange={(e) => setEnableMetrics(e.target.checked)}
                                    />
                                }
                                label="Métriques actives"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={testMode === 'virtualized'}
                                        onChange={(e) => setTestMode(e.target.checked ? 'virtualized' : 'enhanced')}
                                    />
                                }
                                label="Mode Virtualisé"
                            />
                        </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Chip
                                label={`Mode: ${testMode === 'virtualized' ? 'Virtualisé' : 'Enhanced'}`}
                                color="primary"
                                variant="filled"
                            />
                            <Chip
                                label={`${mockData.length} éléments chargés`}
                                color="secondary"
                                variant="outlined"
                            />
                            <Chip
                                label={`${selectedLoans.size} sélectionnés`}
                                color="info"
                                variant="outlined"
                            />
                        </Box>
                    </Grid>
                </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ height: 'calc(100vh - 200px)' }}>
                {/* Panneau de métriques */}
                <Grid item xs={12} md={3}>
                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {enableMetrics && <PerformanceMetrics />}
                        <PerformanceHistory />
                    </Box>
                </Grid>
                
                {/* Zone de démonstration */}
                <Grid item xs={12} md={9}>
                    <Paper elevation={3} sx={{ height: '100%', overflow: 'hidden' }}>
                        {isRunning && mockData.length > 0 ? (
                            testMode === 'virtualized' ? (
                                <LoanListVirtualized
                                    loans={mockData}
                                    selectedLoans={selectedLoans}
                                    onSelectLoan={handleSelectLoan}
                                    onReturn={handleReturn}
                                    onEdit={handleEdit}
                                    onExtend={handleExtend}
                                    onHistory={handleHistory}
                                    onCancel={handleCancel}
                                    getUserColor={getUserColor}
                                    sortConfig={{ key: 'status', direction: 'asc' }}
                                    enableMetrics={enableMetrics}
                                    height={window.innerHeight - 300}
                                />
                            ) : (
                                <LoanListEnhanced
                                    preFilter="active_ongoing"
                                    advancedFilters={null}
                                    onFiltersChange={() => {}}
                                    onExportRequest={() => {}}
                                    onAnalyticsRequest={() => {}}
                                    onNotificationsRequest={() => {}}
                                    refreshTrigger={0}
                                />
                            )
                        ) : (
                            <Box sx={{ 
                                height: '100%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                flexDirection: 'column',
                                gap: 2
                            }}>
                                <SpeedIcon sx={{ fontSize: 64, color: 'action.disabled' }} />
                                <Typography variant="h6" color="textSecondary">
                                    Cliquez sur "Démarrer" pour lancer la démonstration
                                </Typography>
                                <Typography variant="body2" color="textSecondary" align="center">
                                    Cette démonstration vous permet de tester les performances avec différents volumes de données
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
            
            {/* Instructions */}
            <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                    <strong>Instructions :</strong> 
                    Utilisez le curseur pour ajuster le nombre d'éléments (50-5000). 
                    Le mode virtualisé s'active automatiquement au-delà de 100 éléments. 
                    Surveillez les métriques de performance en temps réel.
                </Typography>
            </Alert>
        </Box>
    );
};

export default PerformanceDemo;