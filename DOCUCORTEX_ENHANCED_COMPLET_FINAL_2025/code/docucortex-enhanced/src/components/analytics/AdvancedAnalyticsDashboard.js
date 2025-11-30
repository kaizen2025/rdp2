// src/components/analytics/AdvancedAnalyticsDashboard.js - Dashboard Analytics Avancé
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    Box,
    Container,
    Grid,
    Paper,
    Typography,
    Button,
    IconButton,
    Tooltip,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    TextField,
    Chip,
    Switch,
    FormControlLabel,
    Divider,
    Card,
    CardContent,
    CardHeader,
    Fade,
    CircularProgress,
    Alert,
    Snackbar,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Autocomplete,
    Badge,
    useTheme,
    useMediaQuery,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemButton,
    Collapse,
    Tabs,
    Tab,
    Skeleton
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Timeline,
    BarChart,
    TrendingUp,
    TrendingDown,
    FilterList,
    Download,
    Refresh,
    PlayArrow,
    Pause,
    Save,
    Share,
    Settings,
    ExpandMore,
    ExpandLess,
    Visibility,
    VisibilityOff,
    CompareArrows,
    CalendarToday,
    DateRange,
    Assessment,
    ShowChart,
    PieChart,
    ScatterPlot,
    Clear,
    Add,
    Delete,
    Fullscreen,
    FullscreenExit,
    Info,
    Warning,
    CheckCircle,
    Error,
    Schedule,
    Person,
    Devices,
    Analytics
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Import des composants spécialisés
import TimelineWidget from './TimelineWidget';
import DistributionChart from './DistributionChart';
import ActivityHeatmap from './ActivityHeatmap';
import PerformanceGraph from './PerformanceGraph';
import ComparisonWidget from './ComparisonWidget';

// Import des services
import apiService from '../../services/apiService';
import webSocketService from '../../services/websocketService';

// Configuration des périodes prédéfinies
const TIME_PERIODS = {
    '7d': { label: '7 derniers jours', days: 7 },
    '30d': { label: '30 derniers jours', days: 30 },
    '90d': { label: '90 derniers jours', days: 90 },
    '1y': { label: '1 an', days: 365 },
    'custom': { label: 'Personnalisé', days: null }
};

// Types de graphiques disponibles
const CHART_TYPES = {
    timeline: { label: 'Timeline', icon: Timeline, component: TimelineWidget },
    distribution: { label: 'Distribution', icon: PieChart, component: DistributionChart },
    heatmap: { label: 'Heatmap', icon: ScatterPlot, component: ActivityHeatmap },
    performance: { label: 'Performance', icon: ShowChart, component: PerformanceGraph },
    comparison: { label: 'Comparaison', icon: CompareArrows, component: ComparisonWidget }
};

const AdvancedAnalyticsDashboard = ({
    height = '100vh',
    defaultPeriod = '30d',
    autoRefresh = true,
    refreshInterval = 60000,
    enableExport = true,
    enableRealTime = true
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const containerRef = useRef(null);
    
    // États principaux
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    // États des données
    const [analyticsData, setAnalyticsData] = useState({});
    const [rawLoans, setRawLoans] = useState([]);
    const [users, setUsers] = useState([]);
    const [documents, setDocuments] = useState([]);
    
    // États de filtrage
    const [filters, setFilters] = useState({
        period: defaultPeriod,
        startDate: null,
        endDate: null,
        users: [],
        documents: [],
        statuses: [],
        departments: [],
        equipmentTypes: []
    });
    
    // États de configuration
    const [dashboardConfig, setDashboardConfig] = useState(() => {
        const saved = localStorage.getItem('analytics_dashboard_config');
        return saved ? JSON.parse(saved) : {
            visibleCharts: ['timeline', 'distribution', 'heatmap', 'performance'],
            chartPositions: {
                timeline: { order: 1, visible: true, size: 'large' },
                distribution: { order: 2, visible: true, size: 'medium' },
                heatmap: { order: 3, visible: true, size: 'medium' },
                performance: { order: 4, visible: true, size: 'large' },
                comparison: { order: 5, visible: false, size: 'medium' }
            },
            settings: {
                autoRefresh: true,
                realTimeUpdates: true,
                showTooltips: true,
                enableDrillDown: true,
                animationSpeed: 300,
                colorScheme: 'default'
            }
        };
    });
    
    // États de l'interface
    const [selectedChart, setSelectedChart] = useState(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [expandedSections, setExpandedSections] = useState({
        filters: true,
        charts: true,
        insights: true
    });
    
    // États des notifications
    const [notifications, setNotifications] = useState([]);
    
    // Initialisation des données
    useEffect(() => {
        loadInitialData();
        setupRealTimeUpdates();
        
        return () => {
            // Nettoyage
        };
    }, []);
    
    // Chargement des données initiales
    const loadInitialData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const [loansResponse, usersResponse, documentsResponse] = await Promise.all([
                apiService.getLoans(),
                apiService.getUsers(),
                apiService.getDocuments()
            ]);
            
            setRawLoans(loansResponse || []);
            setUsers(usersResponse || []);
            setDocuments(documentsResponse || []);
            
            // Calcul des analytics
            const analytics = calculateAnalytics(loansResponse || []);
            setAnalyticsData(analytics);
            
            setLastUpdate(new Date());
            
        } catch (err) {
            console.error('Erreur lors du chargement des données:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    // Configuration des mises à jour temps réel
    const setupRealTimeUpdates = useCallback(() => {
        if (!enableRealTime) return;
        
        const subscriptions = [
            webSocketService.on('loan_update', handleLoanUpdate),
            webSocketService.on('analytics_update', handleAnalyticsUpdate),
            webSocketService.on('kpi_alert', handleKpiAlert)
        ];
        
        return () => {
            subscriptions.forEach(unsub => unsub && unsub());
        };
    }, [enableRealTime]);
    
    // Gestion des mises à jour de prêts
    const handleLoanUpdate = useCallback((data) => {
        setRawLoans(prev => {
            const updated = prev.map(loan => 
                loan.id === data.id ? { ...loan, ...data } : loan
            );
            
            // Recalcul des analytics
            const analytics = calculateAnalytics(updated);
            setAnalyticsData(analytics);
            
            return updated;
        });
        
        showNotification({
            type: 'info',
            title: 'Prêt mis à jour',
            message: `Le prêt ${data.id} a été mis à jour`,
            duration: 3000
        });
    }, []);
    
    // Gestion des mises à jour d'analytics
    const handleAnalyticsUpdate = useCallback((data) => {
        setAnalyticsData(prev => ({ ...prev, ...data }));
        setLastUpdate(new Date());
    }, []);
    
    // Gestion des alertes KPI
    const handleKpiAlert = useCallback((alert) => {
        showNotification({
            type: alert.severity === 'critical' ? 'error' : 'warning',
            title: `Alerte KPI: ${alert.metric}`,
            message: alert.message,
            duration: alert.severity === 'critical' ? 0 : 5000
        });
    }, []);
    
    // Calcul des analytics
    const calculateAnalytics = useCallback((loans) => {
        const now = new Date();
        const periodDays = TIME_PERIODS[filters.period]?.days || 30;
        const startDate = new Date(now.getTime() - (periodDays * 24 * 60 * 60 * 1000));
        
        // Filtrer les données selon la période
        const filteredLoans = loans.filter(loan => {
            const loanDate = new Date(loan.loanDate);
            return loanDate >= startDate;
        });
        
        // Calculs temporels
        const timelineData = calculateTimelineData(filteredLoans, periodDays);
        const distributionData = calculateDistributionData(filteredLoans);
        const heatmapData = calculateHeatmapData(filteredLoans);
        const performanceData = calculatePerformanceData(filteredLoans);
        const kpis = calculateKPIs(filteredLoans);
        
        return {
            timeline: timelineData,
            distribution: distributionData,
            heatmap: heatmapData,
            performance: performanceData,
            kpis,
            metadata: {
                totalLoans: filteredLoans.length,
                period: filters.period,
                lastUpdated: now,
                dataSource: 'realtime'
            }
        };
    }, [filters.period]);
    
    // Calcul des données de timeline
    const calculateTimelineData = useCallback((loans, days) => {
        const data = [];
        const now = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
            const dateStr = date.toISOString().split('T')[0];
            
            const dayLoans = loans.filter(loan => {
                const loanDate = loan.loanDate?.split('T')[0];
                return loanDate === dateStr;
            });
            
            const dayReturns = loans.filter(loan => {
                const returnDate = loan.returnDate?.split('T')[0];
                return returnDate === dateStr;
            });
            
            data.push({
                date: dateStr,
                timestamp: date.getTime(),
                loans: dayLoans.length,
                returns: dayReturns.length,
                active: dayLoans.length - dayReturns.length,
                revenue: dayLoans.reduce((sum, loan) => sum + (loan.amount || 0), 0)
            });
        }
        
        return data;
    }, []);
    
    // Calcul des données de distribution
    const calculateDistributionData = useCallback((loans) => {
        const statusCount = {};
        const departmentCount = {};
        const typeCount = {};
        
        loans.forEach(loan => {
            // Distribution par statut
            const status = loan.status || 'unknown';
            statusCount[status] = (statusCount[status] || 0) + 1;
            
            // Distribution par département (si disponible)
            const dept = loan.borrower?.department || 'Non spécifié';
            departmentCount[dept] = (departmentCount[dept] || 0) + 1;
            
            // Distribution par type d'équipement
            const type = loan.document?.type || 'Document';
            typeCount[type] = (typeCount[type] || 0) + 1;
        });
        
        return {
            byStatus: Object.entries(statusCount).map(([status, count]) => ({
                name: status,
                value: count,
                color: getStatusColor(status)
            })),
            byDepartment: Object.entries(departmentCount).map(([dept, count]) => ({
                name: dept,
                value: count
            })),
            byType: Object.entries(typeCount).map(([type, count]) => ({
                name: type,
                value: count
            }))
        };
    }, []);
    
    // Calcul des données de heatmap
    const calculateHeatmapData = useCallback((loans) => {
        const heatmapGrid = {};
        
        // Créer une grille heatmap basée sur l'utilisateur et l'équipement
        loans.forEach(loan => {
            const userId = loan.borrowerId || 'unknown';
            const documentId = loan.documentId || 'unknown';
            const key = `${userId}-${documentId}`;
            
            heatmapGrid[key] = (heatmapGrid[key] || 0) + 1;
        });
        
        return Object.entries(heatmapGrid).map(([key, value]) => {
            const [userId, documentId] = key.split('-');
            return {
                user: userId,
                document: documentId,
                value: value,
                intensity: Math.min(value / 10, 1) // Normalisation
            };
        });
    }, []);
    
    // Calcul des données de performance
    const calculatePerformanceData = useCallback((loans) => {
        const kpis = calculateKPIs(loans);
        
        return {
            utilizationRate: kpis.utilizationRate,
            avgLoanDuration: kpis.avgLoanDuration,
            returnRate: kpis.returnRate,
            overdueRate: kpis.overdueRate,
            trends: calculateTrends(loans)
        };
    }, []);
    
    // Calcul des KPIs
    const calculateKPIs = useCallback((loans) => {
        if (loans.length === 0) {
            return {
                totalLoans: 0,
                activeLoans: 0,
                overdueLoans: 0,
                returnedLoans: 0,
                utilizationRate: 0,
                avgLoanDuration: 0,
                returnRate: 0,
                overdueRate: 0,
                topUsers: [],
                topDocuments: []
            };
        }
        
        const now = new Date();
        const activeLoans = loans.filter(loan => loan.status === 'active');
        const returnedLoans = loans.filter(loan => loan.status === 'returned');
        const overdueLoans = loans.filter(loan => {
            if (loan.status !== 'active' || !loan.returnDate) return false;
            return new Date(loan.returnDate) < now;
        });
        
        // Calcul de la durée moyenne des prêts
        const durations = returnedLoans.map(loan => {
            const loanDate = new Date(loan.loanDate);
            const returnDate = new Date(loan.returnDate);
            return (returnDate - loanDate) / (1000 * 60 * 60 * 24); // en jours
        });
        const avgLoanDuration = durations.length > 0 
            ? durations.reduce((sum, d) => sum + d, 0) / durations.length 
            : 0;
        
        // Top utilisateurs
        const userLoans = {};
        loans.forEach(loan => {
            const userId = loan.borrowerId || 'unknown';
            userLoans[userId] = (userLoans[userId] || 0) + 1;
        });
        const topUsers = Object.entries(userLoans)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([userId, count]) => ({
                userId,
                name: users.find(u => u.id === userId)?.name || 'Utilisateur inconnu',
                loans: count
            }));
        
        // Top documents
        const documentLoans = {};
        loans.forEach(loan => {
            const docId = loan.documentId || 'unknown';
            documentLoans[docId] = (documentLoans[docId] || 0) + 1;
        });
        const topDocuments = Object.entries(documentLoans)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([docId, count]) => ({
                documentId: docId,
                name: documents.find(d => d.id === docId)?.name || 'Document inconnu',
                loans: count
            }));
        
        return {
            totalLoans: loans.length,
            activeLoans: activeLoans.length,
            overdueLoans: overdueLoans.length,
            returnedLoans: returnedLoans.length,
            utilizationRate: loans.length > 0 ? (activeLoans.length / loans.length) * 100 : 0,
            avgLoanDuration,
            returnRate: loans.length > 0 ? (returnedLoans.length / loans.length) * 100 : 0,
            overdueRate: loans.length > 0 ? (overdueLoans.length / loans.length) * 100 : 0,
            topUsers,
            topDocuments
        };
    }, [users, documents]);
    
    // Calcul des tendances
    const calculateTrends = useCallback((loans) => {
        const now = new Date();
        const lastWeek = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        const weekBefore = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));
        
        const currentWeekLoans = loans.filter(loan => 
            new Date(loan.loanDate) >= lastWeek
        ).length;
        
        const previousWeekLoans = loans.filter(loan => {
            const loanDate = new Date(loan.loanDate);
            return loanDate >= weekBefore && loanDate < lastWeek;
        }).length;
        
        const loansTrend = previousWeekLoans > 0 
            ? ((currentWeekLoans - previousWeekLoans) / previousWeekLoans) * 100 
            : 0;
        
        return {
            loans: {
                current: currentWeekLoans,
                previous: previousWeekLoans,
                trend: loansTrend,
                direction: loansTrend > 0 ? 'up' : loansTrend < 0 ? 'down' : 'stable'
            }
        };
    }, []);
    
    // Utilitaires
    const getStatusColor = useCallback((status) => {
        const colors = {
            active: '#4CAF50',
            returned: '#2196F3',
            overdue: '#F44336',
            reserved: '#FF9800',
            cancelled: '#9E9E9E'
        };
        return colors[status] || '#9E9E9E';
    }, []);
    
    // Gestion des notifications
    const showNotification = useCallback((notification) => {
        setNotifications(prev => [...prev, {
            id: Date.now(),
            timestamp: new Date(),
            ...notification
        }]);
    }, []);
    
    // Gestion des filtres
    const updateFilters = useCallback((newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    }, []);
    
    // Gestion de la configuration
    const updateConfig = useCallback((newConfig) => {
        setDashboardConfig(prev => ({ ...prev, ...newConfig }));
    }, []);
    
    // Export des données
    const exportData = useCallback(async (format = 'csv') => {
        try {
            const data = {
                ...analyticsData,
                filters,
                exportDate: new Date().toISOString()
            };
            
            let blob;
            let filename;
            
            switch (format) {
                case 'csv':
                    const csv = convertToCSV(data);
                    blob = new Blob([csv], { type: 'text/csv' });
                    filename = `analytics_${new Date().toISOString().split('T')[0]}.csv`;
                    break;
                    
                case 'json':
                    blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    filename = `analytics_${new Date().toISOString().split('T')[0]}.json`;
                    break;
                    
                case 'pdf':
                    // Implémentation PDF à faire
                    throw new Error('Export PDF non implémenté');
                    
                default:
                    throw new Error('Format non supporté');
            }
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            
            showNotification({
                type: 'success',
                title: 'Export réussi',
                message: `Les données ont été exportées en ${format.toUpperCase()}`
            });
            
        } catch (error) {
            console.error('Erreur export:', error);
            showNotification({
                type: 'error',
                title: 'Erreur export',
                message: error.message
            });
        }
    }, [analyticsData, filters]);
    
    // Conversion en CSV
    const convertToCSV = useCallback((data) => {
        const headers = ['Date', 'Prêts', 'Retours', 'Actifs', 'Revenus'];
        const rows = data.timeline?.map(item => [
            item.date,
            item.loans,
            item.returns,
            item.active,
            item.revenue
        ]) || [];
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }, []);
    
    // Sauvegarde de la configuration
    const saveConfig = useCallback(() => {
        localStorage.setItem('analytics_dashboard_config', JSON.stringify(dashboardConfig));
        showNotification({
            type: 'success',
            title: 'Configuration sauvegardée',
            message: 'La configuration a été sauvegardée'
        });
    }, [dashboardConfig]);
    
    // Obtenir les graphiques triés
    const sortedCharts = useMemo(() => {
        return Object.entries(dashboardConfig.chartPositions)
            .filter(([_, config]) => config.visible)
            .sort(([_, a], [__, b]) => a.order - b.order)
            .map(([type, config]) => ({ type, config }));
    }, [dashboardConfig.chartPositions]);
    
    // Composant de filtre avancé
    const AdvancedFilters = () => (
        <Accordion 
            expanded={expandedSections.filters} 
            onChange={(_, expanded) => setExpandedSections(prev => ({ ...prev, filters: expanded }))}
        >
            <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={1}>
                    <FilterList />
                    <Typography variant="h6">Filtres Avancés</Typography>
                    <Chip size="small" label={`${Object.values(filters).filter(v => Array.isArray(v) ? v.length > 0 : v).length} actifs`} />
                </Box>
            </AccordionSummary>
            <AccordionDetails>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Période</InputLabel>
                            <Select
                                value={filters.period}
                                onChange={(e) => updateFilters({ period: e.target.value })}
                            >
                                {Object.entries(TIME_PERIODS).map(([key, period]) => (
                                    <MenuItem key={key} value={key}>
                                        {period.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    
                    {filters.period === 'custom' && (
                        <>
                            <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                    fullWidth
                                    label="Date début"
                                    type="date"
                                    value={filters.startDate || ''}
                                    onChange={(e) => updateFilters({ startDate: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                    fullWidth
                                    label="Date fin"
                                    type="date"
                                    value={filters.endDate || ''}
                                    onChange={(e) => updateFilters({ endDate: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                        </>
                    )}
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Autocomplete
                            multiple
                            options={users}
                            getOptionLabel={(user) => user.name || user.email || ''}
                            value={users.filter(u => filters.users.includes(u.id))}
                            onChange={(_, newValue) => updateFilters({ users: newValue.map(u => u.id) })}
                            renderInput={(params) => (
                                <TextField {...params} label="Utilisateurs" placeholder="Sélectionner..." />
                            )}
                        />
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Autocomplete
                            multiple
                            options={['active', 'returned', 'overdue', 'reserved']}
                            value={filters.statuses}
                            onChange={(_, newValue) => updateFilters({ statuses: newValue })}
                            renderInput={(params) => (
                                <TextField {...params} label="Statuts" placeholder="Sélectionner..." />
                            )}
                        />
                    </Grid>
                    
                    <Grid item xs={12}>
                        <Box display="flex" gap={1} flexWrap="wrap">
                            <Button 
                                variant="outlined" 
                                size="small"
                                onClick={() => updateFilters({
                                    users: [],
                                    statuses: [],
                                    documents: [],
                                    departments: [],
                                    equipmentTypes: []
                                })}
                            >
                                <Clear /> Effacer filtres
                            </Button>
                            <Button 
                                variant="contained" 
                                size="small"
                                onClick={loadInitialData}
                            >
                                <Refresh /> Appliquer
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </AccordionDetails>
        </Accordion>
    );
    
    // Composant principal de rendu
    if (isLoading) {
        return (
            <Container maxWidth="xl" sx={{ p: 2 }}>
                <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
                    <CircularProgress size={60} />
                    <Typography variant="h6" sx={{ ml: 2 }}>
                        Chargement des analytics...
                    </Typography>
                </Box>
            </Container>
        );
    }
    
    if (error) {
        return (
            <Container maxWidth="xl" sx={{ p: 2 }}>
                <Alert severity="error" action={
                    <Button color="inherit" size="small" onClick={loadInitialData}>
                        Réessayer
                    </Button>
                }>
                    {error}
                </Alert>
            </Container>
        );
    }
    
    return (
        <Box 
            ref={containerRef}
            sx={{ 
                height: isFullscreen ? '100vh' : height,
                bgcolor: theme.palette.background.default,
                overflow: 'auto'
            }}
        >
            {/* En-tête */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Analytics color="primary" />
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                Analytics Avancé
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Vue d'ensemble des performances et tendances • 
                                {lastUpdate && ` Dernière MAJ: ${lastUpdate.toLocaleTimeString()}`}
                            </Typography>
                        </Box>
                    </Box>
                    
                    <Box display="flex" gap={1} alignItems="center">
                        <Tooltip title="Actualiser">
                            <IconButton onClick={loadInitialData} disabled={isLoading}>
                                <Refresh />
                            </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Paramètres">
                            <IconButton onClick={() => setSettingsOpen(true)}>
                                <Settings />
                            </IconButton>
                        </Tooltip>
                        
                        {enableExport && (
                            <>
                                <Tooltip title="Exporter CSV">
                                    <IconButton onClick={() => exportData('csv')}>
                                        <Download />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Exporter JSON">
                                    <IconButton onClick={() => exportData('json')}>
                                        <Download />
                                    </IconButton>
                                </Tooltip>
                            </>
                        )}
                        
                        <Tooltip title={isFullscreen ? "Quitter plein écran" : "Plein écran"}>
                            <IconButton onClick={() => setIsFullscreen(!isFullscreen)}>
                                {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
                
                {/* KPIs rapides */}
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    {Object.entries(analyticsData.kpis || {}).slice(0, 4).map(([key, value]) => (
                        <Grid item xs={6} sm={3} key={key}>
                            <Card variant="outlined">
                                <CardContent sx={{ py: 1 }}>
                                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                        {typeof value === 'number' ? value.toFixed(1) : value}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Paper>
            
            {/* Filtres */}
            <Paper sx={{ mb: 2 }}>
                <AdvancedFilters />
            </Paper>
            
            {/* Graphiques */}
            <Grid container spacing={2}>
                {sortedCharts.map(({ type, config }) => {
                    const ChartComponent = CHART_TYPES[type]?.component;
                    if (!ChartComponent) return null;
                    
                    const chartConfig = {
                        key: type,
                        data: analyticsData[type] || [],
                        height: isMobile ? 300 : config.size === 'large' ? 400 : 350,
                        filters,
                        settings: dashboardConfig.settings
                    };
                    
                    return (
                        <Grid 
                            item 
                            xs={12} 
                            sm={config.size === 'large' ? 12 : 6} 
                            md={config.size === 'large' ? 12 : config.size === 'medium' ? 6 : 4}
                            key={type}
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                layout
                            >
                                <Card>
                                    <CardHeader
                                        avatar={<CHART_TYPES[type].icon color="primary" />}
                                        title={CHART_TYPES[type].label}
                                        action={
                                            <IconButton size="small" onClick={() => setSelectedChart(type)}>
                                                <Fullscreen />
                                            </IconButton>
                                        }
                                    />
                                    <CardContent>
                                        <ChartComponent {...chartConfig} />
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </Grid>
                    );
                })}
            </Grid>
            
            {/* Paramètres Drawer */}
            <Drawer
                anchor="right"
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
            >
                <Box sx={{ width: 350, p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Configuration Analytics
                    </Typography>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    {/* Visibilité des graphiques */}
                    <Typography variant="subtitle1" gutterBottom>
                        Graphiques visibles
                    </Typography>
                    
                    <List>
                        {Object.entries(CHART_TYPES).map(([type, config]) => (
                            <ListItem key={type}>
                                <ListItemIcon>
                                    <config.icon />
                                </ListItemIcon>
                                <ListItemText primary={config.label} />
                                <Switch
                                    checked={dashboardConfig.chartPositions[type]?.visible || false}
                                    onChange={(e) => updateConfig({
                                        chartPositions: {
                                            ...dashboardConfig.chartPositions,
                                            [type]: {
                                                ...dashboardConfig.chartPositions[type],
                                                visible: e.target.checked
                                            }
                                        }
                                    })}
                                />
                            </ListItem>
                        ))}
                    </List>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    {/* Paramètres */}
                    <Typography variant="subtitle1" gutterBottom>
                        Paramètres
                    </Typography>
                    
                    <FormControlLabel
                        control={
                            <Switch
                                checked={dashboardConfig.settings.autoRefresh}
                                onChange={(e) => updateConfig({
                                    settings: { ...dashboardConfig.settings, autoRefresh: e.target.checked }
                                })}
                            />
                        }
                        label="Actualisation auto"
                    />
                    
                    <FormControlLabel
                        control={
                            <Switch
                                checked={dashboardConfig.settings.realTimeUpdates}
                                onChange={(e) => updateConfig({
                                    settings: { ...dashboardConfig.settings, realTimeUpdates: e.target.checked }
                                })}
                            />
                        }
                        label="Mises à jour temps réel"
                    />
                    
                    <Box display="flex" gap={1} sx={{ mt: 2 }}>
                        <Button variant="contained" onClick={saveConfig} fullWidth>
                            Sauvegarder
                        </Button>
                        <Button 
                            variant="outlined" 
                            onClick={() => {
                                localStorage.removeItem('analytics_dashboard_config');
                                setDashboardConfig({
                                    visibleCharts: ['timeline', 'distribution', 'heatmap', 'performance'],
                                    chartPositions: {
                                        timeline: { order: 1, visible: true, size: 'large' },
                                        distribution: { order: 2, visible: true, size: 'medium' },
                                        heatmap: { order: 3, visible: true, size: 'medium' },
                                        performance: { order: 4, visible: true, size: 'large' },
                                        comparison: { order: 5, visible: false, size: 'medium' }
                                    },
                                    settings: {
                                        autoRefresh: true,
                                        realTimeUpdates: true,
                                        showTooltips: true,
                                        enableDrillDown: true,
                                        animationSpeed: 300,
                                        colorScheme: 'default'
                                    }
                                });
                            }}
                            fullWidth
                        >
                            Réinitialiser
                        </Button>
                    </Box>
                </Box>
            </Drawer>
            
            {/* Notifications Snackbar */}
            <Snackbar
                open={notifications.length > 0}
                autoHideDuration={3000}
                onClose={() => setNotifications([])}
            >
                <Alert onClose={() => setNotifications([])} severity="info">
                    {notifications[0]?.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AdvancedAnalyticsDashboard;