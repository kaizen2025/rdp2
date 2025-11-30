// src/demo/AnalyticsDemo.js - Démonstration du Dashboard Analytics Avancé
import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Button,
    Paper,
    Grid,
    Card,
    CardContent,
    CardHeader,
    Chip,
    Alert,
    Snackbar,
    Fab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    FormControlLabel
} from '@mui/material';
import {
    Analytics,
    Timeline,
    BarChart,
    PieChart,
    ShowChart,
    CompareArrows,
    Settings,
    PlayArrow,
    Pause,
    Refresh,
    Fullscreen,
    Download,
    Info
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Import des composants analytics
import {
    AdvancedAnalyticsDashboard,
    TimelineWidget,
    DistributionChart,
    ActivityHeatmap,
    PerformanceGraph,
    ComparisonWidget
} from '../components/analytics';

// Import des services
import apiService from '../services/apiService';

const AnalyticsDemo = () => {
    const [dashboardType, setDashboardType] = useState('full'); // full, individual
    const [selectedComponent, setSelectedComponent] = useState('timeline');
    const [demoData, setDemoData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notification, setNotification] = useState(null);
    const [configDialog, setConfigDialog] = useState(false);
    const [dashboardConfig, setDashboardConfig] = useState({
        theme: 'light',
        animations: true,
        realTime: true,
        autoRefresh: true,
        refreshInterval: 30000
    });
    
    // Génération de données de démonstration
    const generateDemoData = () => {
        const today = new Date();
        const timelineData = [];
        
        // Génération de 90 jours de données
        for (let i = 89; i >= 0; i--) {
            const date = new Date(today.getTime() - (i * 24 * 60 * 60 * 1000));
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            
            // Simulation de l'activité (moins le weekend)
            const baseActivity = isWeekend ? 0 : Math.floor(Math.random() * 20) + 5;
            const loans = Math.max(0, baseActivity + Math.floor(Math.random() * 10) - 5);
            const returns = Math.max(0, loans - Math.floor(Math.random() * 5));
            const active = Math.max(0, baseActivity + Math.floor(Math.random() * 15) - 7);
            const revenue = loans * (Math.random() * 50 + 25);
            
            timelineData.push({
                date: date.toISOString().split('T')[0],
                loans,
                returns,
                active,
                revenue: Math.round(revenue * 100) / 100
            });
        }
        
        // Génération des métriques de performance
        const performanceData = timelineData.map(item => ({
            ...item,
            utilizationRate: Math.min(100, (item.active / 50) * 100 + Math.random() * 20 - 10),
            avgLoanDuration: Math.max(1, 7 + Math.random() * 14 - 7),
            returnRate: Math.min(100, Math.max(70, (item.returns / Math.max(item.loans, 1)) * 100 + Math.random() * 20 - 10)),
            overdueRate: Math.max(0, (Math.random() * 10))
        }));
        
        // Génération des données de distribution
        const distributionData = {
            byStatus: [
                { name: 'Actifs', value: Math.floor(timelineData.slice(-30).reduce((sum, item) => sum + item.active, 0) / 30), color: '#4CAF50' },
                { name: 'Retournés', value: Math.floor(timelineData.slice(-30).reduce((sum, item) => sum + item.returns, 0) / 30), color: '#2196F3' },
                { name: 'En retard', value: Math.floor(Math.random() * 20) + 5, color: '#F44336' },
                { name: 'Réservés', value: Math.floor(Math.random() * 15) + 3, color: '#FF9800' }
            ],
            byDepartment: [
                { name: 'Administration', value: Math.floor(Math.random() * 30) + 20 },
                { name: 'Ressources Humaines', value: Math.floor(Math.random() * 25) + 15 },
                { name: 'IT', value: Math.floor(Math.random() * 35) + 25 },
                { name: 'Finance', value: Math.floor(Math.random() * 20) + 10 },
                { name: 'Commercial', value: Math.floor(Math.random() * 30) + 15 }
            ],
            byType: [
                { name: 'Ordinateurs portables', value: Math.floor(Math.random() * 40) + 30 },
                { name: 'Tablettes', value: Math.floor(Math.random() * 25) + 15 },
                { name: 'Projecteurs', value: Math.floor(Math.random() * 20) + 10 },
                { name: 'Caméras', value: Math.floor(Math.random() * 15) + 8 },
                { name: 'Autres équipements', value: Math.floor(Math.random() * 30) + 20 }
            ]
        };
        
        // Génération des données de heatmap
        const heatmapData = [];
        const users = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
        const documents = ['Ordinateur A', 'Ordinateur B', 'Ordinateur C', 'Tablette X', 'Tablette Y', 'Projecteur Z'];
        
        users.forEach(user => {
            documents.forEach(document => {
                const activity = Math.floor(Math.random() * 15);
                if (activity > 0) {
                    heatmapData.push({
                        user,
                        document,
                        value: activity,
                        intensity: activity / 15
                    });
                }
            });
        });
        
        const analyticsData = {
            timeline: timelineData,
            performance: performanceData,
            distribution: distributionData,
            heatmap: heatmapData,
            kpis: {
                totalLoans: timelineData.reduce((sum, item) => sum + item.loans, 0),
                activeLoans: Math.floor(timelineData.slice(-30).reduce((sum, item) => sum + item.active, 0) / 30),
                utilizationRate: 75.5,
                avgLoanDuration: 8.2,
                returnRate: 92.3,
                overdueRate: 3.2
            }
        };
        
        return analyticsData;
    };
    
    // Initialisation des données de démonstration
    useEffect(() => {
        setIsLoading(true);
        
        // Simuler un chargement
        setTimeout(() => {
            const data = generateDemoData();
            setDemoData(data);
            setIsLoading(false);
            
            showNotification({
                type: 'success',
                message: 'Données de démonstration chargées avec succès'
            });
        }, 1500);
    }, []);
    
    const showNotification = (notification) => {
        setNotification(notification);
        setTimeout(() => setNotification(null), 5000);
    };
    
    const handleConfigSave = () => {
        localStorage.setItem('analytics_demo_config', JSON.stringify(dashboardConfig));
        setConfigDialog(false);
        showNotification({
            type: 'success',
            message: 'Configuration sauvegardée'
        });
    };
    
    const handleDataRefresh = () => {
        setIsLoading(true);
        setTimeout(() => {
            const newData = generateDemoData();
            setDemoData(newData);
            setIsLoading(false);
            showNotification({
                type: 'info',
                message: 'Données actualisées'
            });
        }, 1000);
    };
    
    const handleExport = (format) => {
        if (!demoData) return;
        
        // Simulation d'export
        const exportData = {
            timestamp: new Date().toISOString(),
            config: dashboardConfig,
            data: demoData
        };
        
        const content = JSON.stringify(exportData, null, 2);
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics_demo_${format}_${new Date().toISOString().split('T')[0]}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
        
        showNotification({
            type: 'success',
            message: `Export ${format.toUpperCase()} téléchargé`
        });
    };
    
    const componentOptions = [
        { key: 'timeline', label: 'Timeline', icon: Timeline, description: 'Chronologie interactive des prêts' },
        { key: 'distribution', label: 'Distribution', icon: PieChart, description: 'Graphiques de répartition' },
        { key: 'heatmap', label: 'Heatmap', icon: BarChart, description: 'Carte de chaleur des activités' },
        { key: 'performance', label: 'Performance', icon: ShowChart, description: 'KPIs et métriques' },
        { key: 'comparison', label: 'Comparaison', icon: CompareArrows, description: 'Comparaison de périodes' }
    ];
    
    const renderIndividualComponent = () => {
        if (!demoData) return null;
        
        const commonProps = {
            data: demoData,
            height: 400,
            showControls: true,
            enableExport: true,
            showDetails: true
        };
        
        switch (selectedComponent) {
            case 'timeline':
                return <TimelineWidget {...commonProps} />;
            case 'distribution':
                return <DistributionChart {...commonProps} />;
            case 'heatmap':
                return <ActivityHeatmap {...commonProps} data={demoData.heatmap} />;
            case 'performance':
                return <PerformanceGraph {...commonProps} data={demoData} />;
            case 'comparison':
                return <ComparisonWidget {...commonProps} data={demoData} />;
            default:
                return <TimelineWidget {...commonProps} />;
        }
    };
    
    if (isLoading) {
        return (
            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Analytics sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h4" gutterBottom>
                        Chargement du Dashboard Analytics
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Préparation des données de démonstration...
                    </Typography>
                </Paper>
            </Container>
        );
    }
    
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* En-tête de démonstration */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Analytics color="primary" sx={{ fontSize: 40 }} />
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                Dashboard Analytics Avancé - DocuCortex
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Démonstration des fonctionnalités d'analytics et de visualisation
                            </Typography>
                        </Box>
                    </Box>
                    
                    <Box display="flex" gap={1}>
                        <Button
                            variant={dashboardType === 'full' ? 'contained' : 'outlined'}
                            onClick={() => setDashboardType('full')}
                            startIcon={<Analytics />}
                        >
                            Dashboard Complet
                        </Button>
                        <Button
                            variant={dashboardType === 'individual' ? 'contained' : 'outlined'}
                            onClick={() => setDashboardType('individual')}
                            startIcon={<BarChart />}
                        >
                            Composants Individuels
                        </Button>
                    </Box>
                </Box>
                
                {/* Statistiques rapides */}
                {demoData && (
                    <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item xs={6} sm={3}>
                            <Card variant="outlined">
                                <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
                                    <Typography variant="h4" color="primary" fontWeight="bold">
                                        {demoData.kpis.totalLoans}
                                    </Typography>
                                    <Typography variant="caption">Total Prêts (90j)</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Card variant="outlined">
                                <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
                                    <Typography variant="h4" color="success.main" fontWeight="bold">
                                        {demoData.kpis.activeLoans}
                                    </Typography>
                                    <Typography variant="caption">Prêts Actifs</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Card variant="outlined">
                                <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
                                    <Typography variant="h4" color="secondary.main" fontWeight="bold">
                                        {demoData.kpis.utilizationRate.toFixed(1)}%
                                    </Typography>
                                    <Typography variant="caption">Utilisation</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Card variant="outlined">
                                <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
                                    <Typography variant="h4" color="warning.main" fontWeight="bold">
                                        {demoData.kpis.overdueRate.toFixed(1)}%
                                    </Typography>
                                    <Typography variant="caption">Taux de Retard</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                )}
            </Paper>
            
            {/* Contenu principal */}
            <Container maxWidth="xl" sx={{ pb: 4 }}>
                {dashboardType === 'full' ? (
                    <AdvancedAnalyticsDashboard
                        height="calc(100vh - 300px)"
                        defaultPeriod="30d"
                        enableExport={true}
                        enableRealTime={true}
                    />
                ) : (
                    <>
                        {/* Sélecteur de composant */}
                        <Paper sx={{ p: 2, mb: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Sélection du Composant
                            </Typography>
                            <Box display="flex" gap={1} flexWrap="wrap">
                                {componentOptions.map(option => (
                                    <Chip
                                        key={option.key}
                                        label={option.label}
                                        clickable
                                        color={selectedComponent === option.key ? 'primary' : 'default'}
                                        variant={selectedComponent === option.key ? 'filled' : 'outlined'}
                                        onClick={() => setSelectedComponent(option.key)}
                                        icon={<option.icon />}
                                        sx={{ minWidth: 120 }}
                                    />
                                ))}
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                {componentOptions.find(opt => opt.key === selectedComponent)?.description}
                            </Typography>
                        </Paper>
                        
                        {/* Composant sélectionné */}
                        <motion.div
                            key={selectedComponent}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {renderIndividualComponent()}
                        </motion.div>
                    </>
                )}
            </Container>
            
            {/* FAB pour les actions rapides */}
            <Box sx={{ position: 'fixed', bottom: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Fab color="primary" onClick={handleDataRefresh}>
                    <Refresh />
                </Fab>
                <Fab color="secondary" onClick={() => setConfigDialog(true)}>
                    <Settings />
                </Fab>
                <Fab color="info" onClick={() => handleExport('json')}>
                    <Download />
                </Fab>
            </Box>
            
            {/* Dialog de configuration */}
            <Dialog open={configDialog} onClose={() => setConfigDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Configuration du Dashboard</DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} sx={{ mt: 1 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={dashboardConfig.animations}
                                    onChange={(e) => setDashboardConfig(prev => ({ ...prev, animations: e.target.checked }))}
                                />
                            }
                            label="Activer les animations"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={dashboardConfig.realTime}
                                    onChange={(e) => setDashboardConfig(prev => ({ ...prev, realTime: e.target.checked }))}
                                />
                            }
                            label="Mises à jour en temps réel"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={dashboardConfig.autoRefresh}
                                    onChange={(e) => setDashboardConfig(prev => ({ ...prev, autoRefresh: e.target.checked }))}
                                />
                            }
                            label="Actualisation automatique"
                        />
                        
                        <TextField
                            label="Intervalle d'actualisation (ms)"
                            type="number"
                            value={dashboardConfig.refreshInterval}
                            onChange={(e) => setDashboardConfig(prev => ({ ...prev, refreshInterval: parseInt(e.target.value) || 30000 }))}
                            fullWidth
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfigDialog(false)}>Annuler</Button>
                    <Button onClick={handleConfigSave} variant="contained">Sauvegarder</Button>
                </DialogActions>
            </Dialog>
            
            {/* Notification */}
            <Snackbar
                open={Boolean(notification)}
                autoHideDuration={5000}
                onClose={() => setNotification(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                {notification && (
                    <Alert 
                        onClose={() => setNotification(null)} 
                        severity={notification.type}
                        sx={{ width: '100%' }}
                    >
                        {notification.message}
                    </Alert>
                )}
            </Snackbar>
        </Box>
    );
};

export default AnalyticsDemo;