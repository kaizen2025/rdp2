// src/components/dashboard/DashboardDemo.js - Démonstration du Dashboard Temps Réel
import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Container,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    CardActions,
    Paper,
    Chip,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Divider,
    Alert,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    PlayArrow,
    Stop,
    Settings,
    Dashboard,
    Timeline,
    BarChart,
    TrendingUp,
    Warning,
    CheckCircle,
    Speed,
    Notifications,
    Fullscreen,
    Launch,
    Code,
    Palette,
    DragIndicator
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Import des composants
import DashboardPrêts from './DashboardPrêts';
import RealTimeNotifications from './RealTimeNotifications';
import DashboardConfiguration from './DashboardConfiguration';

// Configuration des fonctionnalités disponibles
const FEATURES = [
    {
        id: 'realtime',
        title: 'Mises à jour temps réel',
        description: 'WebSocket avec synchronisation multi-utilisateurs',
        icon: <Speed />,
        status: 'disponible',
        demo: 'websocket-service'
    },
    {
        id: 'widgets',
        title: 'Widgets interactifs',
        description: 'Statistiques, graphiques, alertes, performance',
        icon: <Dashboard />,
        status: 'disponible',
        demo: 'widgets-overview'
    },
    {
        id: 'notifications',
        title: 'Notifications temps réel',
        description: 'Toast notifications avec actions et sons',
        icon: <Notifications />,
        status: 'disponible',
        demo: 'notifications-demo'
    },
    {
        id: 'customization',
        title: 'Personnalisation layout',
        description: 'Drag & drop, layouts prédéfinis, thèmes',
        icon: <DragIndicator />,
        status: 'disponible',
        demo: 'layout-customization'
    },
    {
        id: 'performance',
        title: 'Performance optimisée',
        description: '60fps, compression, fallback polling',
        icon: <TrendingUp />,
        status: 'disponible',
        demo: 'performance-features'
    },
    {
        id: 'mobile',
        title: 'Compatible mobile',
        description: 'Responsive, tactile, adapté petits écrans',
        icon: <CheckCircle />,
        status: 'disponible',
        demo: 'mobile-responsive'
    }
];

const DEMO_FEATURES = [
    {
        title: 'Service WebSocket Avancé',
        description: 'Gestion automatique des reconnexions avec backoff exponentiel',
        code: `webSocketService.subscribe('dashboard_update', (data) => {
  updateDashboardData(data);
});`
    },
    {
        title: 'Widgets Animés',
        description: 'Composants avec animations Framer Motion',
        code: `<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  <LoansStatsWidget />
</motion.div>`
    },
    {
        title: 'Notifications Contextuelles',
        description: 'Système de notifications avec actions',
        code: `notifications.showLoanAlert(loan, 'critical', 
  'Prêt en retard critique');`
    },
    {
        title: 'Layout Drag & Drop',
        description: 'Réorganisation des widgets par glisser-déposer',
        code: `<DragDropContext onDragEnd={handleDragEnd}>
  <Droppable>...</Droppable>
</DragDropContext>`
    }
];

const DashboardDemo = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    // États de la démonstration
    const [currentView, setCurrentView] = useState('overview'); // 'overview', 'demo', 'code'
    const [demoRunning, setDemoRunning] = useState(false);
    const [configOpen, setConfigOpen] = useState(false);
    const [selectedFeature, setSelectedFeature] = useState(null);
    
    // Simulation de données temps réel pour la démo
    const simulateRealTimeData = useCallback(() => {
        // Simulation d'activité de prêt
        const simulateLoanActivity = () => {
            const activities = [
                { type: 'created', message: 'Nouveau prêt créé', severity: 'success' },
                { type: 'returned', message: 'Prêt retourné', severity: 'info' },
                { type: 'overdue', message: 'Prêt en retard détecté', severity: 'warning' },
                { type: 'extended', message: 'Prêt prolongé', severity: 'info' }
            ];
            
            return activities[Math.floor(Math.random() * activities.length)];
        };
        
        // Simulation d'alertes système
        const simulateSystemAlert = () => {
            const alerts = [
                { type: 'performance', message: 'Pic de charge CPU détecté', severity: 'warning' },
                { type: 'network', message: 'Latence réseau augmentée', severity: 'warning' },
                { type: 'storage', message: 'Espace disque faible', severity: 'error' },
                { type: 'memory', message: 'Mémoire haute utilisation', severity: 'info' }
            ];
            
            return alerts[Math.floor(Math.random() * alerts.length)];
        };
        
        return { simulateLoanActivity, simulateSystemAlert };
    }, []);
    
    // Démarrage de la démonstration
    const startDemo = useCallback(() => {
        setDemoRunning(true);
        console.log('[DashboardDemo] 🚀 Démarrage de la démonstration...');
        
        // Simulation d'activité continue
        const interval = setInterval(() => {
            const { simulateLoanActivity, simulateSystemAlert } = simulateRealTimeData();
            
            // Simulation occasionnelle d'activité
            if (Math.random() > 0.7) {
                const activity = simulateLoanActivity();
                console.log(`[DashboardDemo] 📋 Activité prêt:`, activity);
            }
            
            // Simulation occasionnelle d'alertes
            if (Math.random() > 0.8) {
                const alert = simulateSystemAlert();
                console.log(`[DashboardDemo] 🚨 Alerte système:`, alert);
            }
        }, 2000);
        
        // Stockage de l'interval pour nettoyage
        return () => clearInterval(interval);
    }, [simulateRealTimeData]);
    
    // Arrêt de la démonstration
    const stopDemo = useCallback(() => {
        setDemoRunning(false);
        console.log('[DashboardDemo] ⏹️ Arrêt de la démonstration');
    }, []);
    
    // Effet pour gérer le cycle de vie de la démo
    useEffect(() => {
        let cleanup;
        
        if (demoRunning) {
            cleanup = startDemo();
        }
        
        return cleanup;
    }, [demoRunning, startDemo]);
    
    // Composant de vue d'ensemble
    const OverviewView = () => (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* En-tête */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <Box textAlign="center" mb={6}>
                    <Typography 
                        variant="h2" 
                        sx={{ 
                            fontWeight: 700,
                            background: 'linear-gradient(45deg, #2196f3, #21cbf3)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 2
                        }}
                    >
                        Dashboard Temps Réel
                    </Typography>
                    <Typography variant="h5" color="text.secondary" paragraph>
                        Vue d'ensemble de l'activité de prêt avec KPIs et alertes visuelles
                    </Typography>
                    <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap">
                        <Chip 
                            icon={<Speed />} 
                            label="Temps Réel" 
                            color="primary" 
                            variant="outlined"
                        />
                        <Chip 
                            icon={<Dashboard />} 
                            label="Widgets Interactifs" 
                            color="info" 
                            variant="outlined"
                        />
                        <Chip 
                            icon={<Notifications />} 
                            label="Notifications" 
                            color="success" 
                            variant="outlined"
                        />
                        <Chip 
                            icon={<Palette />} 
                            label="Personnalisable" 
                            color="warning" 
                            variant="outlined"
                        />
                    </Box>
                </Box>
            </motion.div>
            
            {/* Statistiques de démonstration */}
            <Grid container spacing={3} mb={6}>
                <Grid item xs={12} sm={6} md={3}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h3" color="primary" sx={{ fontWeight: 700 }}>
                                    147
                                </Typography>
                                <Typography variant="h6" color="text.secondary">
                                    Total Prêts
                                </Typography>
                            </CardContent>
                        </Card>
                    </motion.div>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h3" color="success.main" sx={{ fontWeight: 700 }}>
                                    89
                                </Typography>
                                <Typography variant="h6" color="text.secondary">
                                    Actifs
                                </Typography>
                            </CardContent>
                        </Card>
                    </motion.div>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h3" color="warning.main" sx={{ fontWeight: 700 }}>
                                    12
                                </Typography>
                                <Typography variant="h6" color="text.secondary">
                                    En Retard
                                </Typography>
                            </CardContent>
                        </Card>
                    </motion.div>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h3" color="error.main" sx={{ fontWeight: 700 }}>
                                    3
                                </Typography>
                                <Typography variant="h6" color="text.secondary">
                                    Critiques
                                </Typography>
                            </CardContent>
                        </Card>
                    </motion.div>
                </Grid>
            </Grid>
            
            {/* Fonctionnalités disponibles */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
            >
                <Typography variant="h4" gutterBottom textAlign="center" sx={{ mb: 4 }}>
                    Fonctionnalités Disponibles
                </Typography>
                
                <Grid container spacing={3}>
                    {FEATURES.map((feature, index) => (
                        <Grid item xs={12} sm={6} md={4} key={feature.id}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                            >
                                <Card 
                                    sx={{ 
                                        height: '100%',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: theme.shadows[8]
                                        }
                                    }}
                                    onClick={() => {
                                        setSelectedFeature(feature);
                                        setCurrentView('demo');
                                    }}
                                >
                                    <CardContent>
                                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                                                {feature.icon}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                    {feature.title}
                                                </Typography>
                                                <Chip 
                                                    label={feature.status} 
                                                    size="small" 
                                                    color="success" 
                                                    variant="outlined"
                                                />
                                            </Box>
                                        </Box>
                                        
                                        <Typography variant="body2" color="text.secondary">
                                            {feature.description}
                                        </Typography>
                                    </CardContent>
                                    
                                    <CardActions>
                                        <Button 
                                            size="small" 
                                            startIcon={<Launch />}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setCurrentView('demo');
                                                setSelectedFeature(feature);
                                            }}
                                        >
                                            Voir Démo
                                        </Button>
                                    </CardActions>
                                </Card>
                            </motion.div>
                        </Grid>
                    ))}
                </Grid>
            </motion.div>
            
            {/* Actions principales */}
            <Box textAlign="center" mt={6}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 1 }}
                >
                    <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap">
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<Dashboard />}
                            onClick={() => setCurrentView('demo')}
                            sx={{ 
                                px: 4, 
                                py: 1.5,
                                fontSize: '1.1rem'
                            }}
                        >
                            Démarrer Dashboard
                        </Button>
                        
                        <Button
                            variant="outlined"
                            size="large"
                            startIcon={<Code />}
                            onClick={() => setCurrentView('code')}
                            sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
                        >
                            Voir le Code
                        </Button>
                        
                        <Button
                            variant="outlined"
                            size="large"
                            startIcon={<Settings />}
                            onClick={() => setConfigOpen(true)}
                            sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
                        >
                            Configuration
                        </Button>
                    </Box>
                </motion.div>
            </Box>
        </Container>
    );
    
    // Composant de vue démo
    const DemoView = () => (
        <Box sx={{ height: '100vh', bgcolor: 'background.default' }}>
            {/* Barre de contrôle */}
            <Paper 
                elevation={2} 
                sx={{ 
                    p: 2, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    borderRadius: 0
                }}
            >
                <Box display="flex" alignItems="center" gap={2}>
                    <Button
                        variant="contained"
                        startIcon={demoRunning ? <Stop /> : <PlayArrow />}
                        onClick={() => setDemoRunning(!demoRunning)}
                        color={demoRunning ? "error" : "success"}
                    >
                        {demoRunning ? "Arrêter" : "Démarrer"} Démo
                    </Button>
                    
                    {selectedFeature && (
                        <Chip
                            icon={selectedFeature.icon}
                            label={selectedFeature.title}
                            color="primary"
                            variant="outlined"
                        />
                    )}
                </Box>
                
                <Box display="flex" alignItems="center" gap={1}>
                    <Chip 
                        label={demoRunning ? "EN DIRECT" : "PAUSE"} 
                        color={demoRunning ? "success" : "default"}
                        sx={{ fontWeight: 600 }}
                    />
                    
                    <Button
                        variant="outlined"
                        onClick={() => setCurrentView('overview')}
                    >
                        Retour Vue d'ensemble
                    </Button>
                </Box>
            </Paper>
            
            {/* Dashboard principal */}
            <Box sx={{ height: 'calc(100vh - 80px)' }}>
                <DashboardPrêts
                    initialLayout="default"
                    height="100%"
                    enableFullscreen={true}
                    enableLayoutCustomization={true}
                    autoRefresh={demoRunning}
                    defaultPeriod="24h"
                />
            </Box>
            
            {/* Système de notifications */}
            <RealTimeNotifications
                position="top-right"
                maxVisible={5}
                autoHideDuration={6000}
                enableSound={true}
                enableVibration={true}
            />
            
            {/* Configuration */}
            <DashboardConfiguration
                open={configOpen}
                onClose={() => setConfigOpen(false)}
                currentLayout="default"
                onLayoutChange={(layout) => console.log('Layout changé:', layout)}
                onSave={(config) => console.log('Configuration sauvegardée:', config)}
                onReset={() => console.log('Configuration réinitialisée')}
            />
        </Box>
    );
    
    // Composant de vue code
    const CodeView = () => (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                    Exemples de Code
                </Typography>
                <Button 
                    variant="outlined" 
                    onClick={() => setCurrentView('overview')}
                >
                    Retour
                </Button>
            </Box>
            
            <Grid container spacing={3}>
                {DEMO_FEATURES.map((feature, index) => (
                    <Grid item xs={12} key={index}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <Card>
                                <CardContent>
                                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                                        {feature.title}
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary" paragraph>
                                        {feature.description}
                                    </Typography>
                                    
                                    <Paper 
                                        elevation={1} 
                                        sx={{ 
                                            p: 2, 
                                            bgcolor: 'grey.900',
                                            color: 'grey.100',
                                            fontFamily: 'Monaco, monospace',
                                            fontSize: '0.9rem',
                                            overflow: 'auto'
                                        }}
                                    >
                                        <pre style={{ margin: 0 }}>
                                            <code>{feature.code}</code>
                                        </pre>
                                    </Paper>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </Grid>
                ))}
            </Grid>
            
            <Alert severity="info" sx={{ mt: 4 }}>
                <Typography variant="body1">
                    <strong>Remarque :</strong> Ce sont des exemples simplifiés. 
                    Dans un projet réel, vous auriez besoin d'installer les dépendances 
                    appropriées et de configurer l'environnement de développement.
                </Typography>
            </Alert>
        </Container>
    );
    
    // Rendu principal
    return (
        <Box>
            <AnimatePresence mode="wait">
                {currentView === 'overview' && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <OverviewView />
                    </motion.div>
                )}
                
                {currentView === 'demo' && (
                    <motion.div
                        key="demo"
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '-100%' }}
                        transition={{ duration: 0.3 }}
                    >
                        <DemoView />
                    </motion.div>
                )}
                
                {currentView === 'code' && (
                    <motion.div
                        key="code"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <CodeView />
                    </motion.div>
                )}
            </AnimatePresence>
        </Box>
    );
};

export default DashboardDemo;