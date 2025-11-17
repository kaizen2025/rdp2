// src/components/dashboard/DashboardPrêts.js - Dashboard Principal Temps Réel
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box,
    Container,
    Grid,
    Paper,
    Typography,
    Button,
    IconButton,
    Tooltip,
    Fab,
    Snackbar,
    Alert,
    useTheme,
    useMediaQuery,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Switch,
    FormControlLabel,
    Divider,
    Badge,
    Avatar,
    Chip
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Settings,
    Fullscreen,
    FullscreenExit,
    Refresh,
    Notifications,
    NotificationsActive,
    Wifi,
    WifiOff,
    Timeline,
    BarChart,
    TrendingUp,
    FilterList,
    ViewColumn,
    Save,
    Restore,
    PlayArrow,
    Pause,
    Warning,
    CheckCircle,
    Error
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Import des widgets individuels
import LoansStatsWidget from './LoansStatsWidget';
import ActivityChartWidget from './ActivityChartWidget';
import TopUsersWidget from './TopUsersWidget';
import AlertSummaryWidget from './AlertSummaryWidget';
import PerformanceMetricsWidget from './PerformanceMetricsWidget';

// Import du service WebSocket
import webSocketService from '../../services/websocketService';

const DashboardPrêts = ({
    initialLayout = 'default',
    height = '100vh',
    enableFullscreen = true,
    enableLayoutCustomization = true,
    autoRefresh = true,
    defaultPeriod = '24h'
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    // États du dashboard
    const [layout, setLayout] = useState(initialLayout);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    
    // États des connexions et données
    const [connectionStatus, setConnectionStatus] = useState({ connected: false });
    const [notifications, setNotifications] = useState([]);
    const [dashboardData, setDashboardData] = useState({});
    const [alerts, setAlerts] = useState([]);
    
    // États des préférences utilisateur
    const [preferences, setPreferences] = useState(() => {
        const saved = localStorage.getItem('dashboard_preferences');
        return saved ? JSON.parse(saved) : {
            widgets: {
                loansStats: { visible: true, order: 1, size: 'large' },
                activityChart: { visible: true, order: 2, size: 'large' },
                topUsers: { visible: true, order: 3, size: 'medium' },
                alerts: { visible: true, order: 4, size: 'medium' },
                performance: { visible: true, order: 5, size: 'large' }
            },
            settings: {
                autoRefresh: true,
                refreshInterval: 30000,
                showNotifications: true,
                compactMode: false,
                darkMode: false
            }
        };
    });
    
    // États de l'interface
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    
    // Initialisation des connexions WebSocket
    useEffect(() => {
        console.log('[DashboardPrêts] 🚀 Initialisation du dashboard...');
        
        // Configuration des abonnements WebSocket
        const subscriptions = [
            webSocketService.on('connection', (status) => {
                console.log('[DashboardPrêts] 🔌 Changement de connexion:', status);
                setConnectionStatus(status);
            }),
            
            webSocketService.on('dashboard_update', (data) => {
                console.log('[DashboardPrêts] 📊 Mise à jour dashboard:', data);
                setDashboardData(prev => ({ ...prev, ...data }));
                setLastUpdate(new Date());
            }),
            
            webSocketService.on('loan_status_change', (data) => {
                console.log('[DashboardPrêts] 📋 Changement statut prêt:', data);
                handleLoanUpdate(data);
            }),
            
            webSocketService.on('computer_status_change', (data) => {
                console.log('[DashboardPrêts] 💻 Changement statut ordinateur:', data);
                handleComputerUpdate(data);
            }),
            
            webSocketService.on('alert', (data) => {
                console.log('[DashboardPrêts] 🚨 Nouvelle alerte:', data);
                handleNewAlert(data);
            }),
            
            webSocketService.on('system_metrics', (data) => {
                console.log('[DashboardPrêts] ⚡ Métriques système:', data);
                handleSystemMetrics(data);
            })
        ];
        
        // Demande de données temps réel initiales
        requestInitialData();
        
        return () => {
            // Nettoyage des abonnements
            subscriptions.forEach(unsub => unsub && unsub());
        };
    }, []);
    
    // Gestion des mises à jour de données de prêts
    const handleLoanUpdate = useCallback((data) => {
        setDashboardData(prev => ({
            ...prev,
            loans: { ...prev.loans, ...data }
        }));
        
        showNotification({
            type: 'info',
            title: 'Prêt mis à jour',
            message: `Statut du prêt ${data.loanId} modifié`,
            duration: 3000
        });
    }, []);
    
    // Gestion des mises à jour d'ordinateurs
    const handleComputerUpdate = useCallback((data) => {
        setDashboardData(prev => ({
            ...prev,
            computers: { ...prev.computers, ...data }
        }));
    }, []);
    
    // Gestion des nouvelles alertes
    const handleNewAlert = useCallback((alert) => {
        const newNotification = {
            id: Date.now(),
            timestamp: new Date(),
            type: alert.severity === 'critical' ? 'error' : 'warning',
            title: `Alerte ${alert.severity}`,
            message: alert.message,
            data: alert,
            read: false
        };
        
        setNotifications(prev => [newNotification, ...prev].slice(0, 50));
        
        if (preferences.settings.showNotifications) {
            showNotification({
                type: newNotification.type,
                title: newNotification.title,
                message: newNotification.message,
                duration: alert.severity === 'critical' ? 0 : 5000
            });
        }
    }, [preferences.settings.showNotifications]);
    
    // Gestion des métriques système
    const handleSystemMetrics = useCallback((data) => {
        setDashboardData(prev => ({
            ...prev,
            metrics: data
        }));
    }, []);
    
    // Demande de données initiales
    const requestInitialData = useCallback(async () => {
        setIsLoading(true);
        
        try {
            // Demande de données temps réel
            await Promise.all([
                webSocketService.requestRealTimeData(['loans', 'computers', 'users']),
                webSocketService.requestSystemMetrics(),
                webSocketService.requestLoanStats(),
                webSocketService.requestTopUsers(10),
                webSocketService.requestActiveAlerts()
            ]);
            
            console.log('[DashboardPrêts] ✅ Données initiales demandées');
        } catch (error) {
            console.error('[DashboardPrêts] ❌ Erreur lors de la demande de données:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    // Affichage de notifications
    const showNotification = useCallback((notification) => {
        // Cette fonction sera implémentée avec le système de notifications
        console.log('[DashboardPrêts] 🔔 Notification:', notification);
    }, []);
    
    // Gestion de la mise à jour manuelle
    const handleManualRefresh = useCallback(() => {
        setIsLoading(true);
        requestInitialData().finally(() => setIsLoading(false));
    }, [requestInitialData]);
    
    // Gestion de la bascule fullscreen
    const toggleFullscreen = useCallback(() => {
        setIsFullscreen(!isFullscreen);
        
        if (!isFullscreen) {
            // Enter fullscreen
            document.documentElement.requestFullscreen?.();
        } else {
            // Exit fullscreen
            document.exitFullscreen?.();
        }
    }, [isFullscreen]);
    
    // Sauvegarde des préférences
    const savePreferences = useCallback(() => {
        localStorage.setItem('dashboard_preferences', JSON.stringify(preferences));
        showNotification({
            type: 'success',
            title: 'Préférences sauvegardées',
            message: 'Vos préférences ont été sauvegardées',
            duration: 2000
        });
    }, [preferences]);
    
    // Réinitialisation des préférences
    const resetPreferences = useCallback(() => {
        const defaultPrefs = {
            widgets: {
                loansStats: { visible: true, order: 1, size: 'large' },
                activityChart: { visible: true, order: 2, size: 'large' },
                topUsers: { visible: true, order: 3, size: 'medium' },
                alerts: { visible: true, order: 4, size: 'medium' },
                performance: { visible: true, order: 5, size: 'large' }
            },
            settings: {
                autoRefresh: true,
                refreshInterval: 30000,
                showNotifications: true,
                compactMode: false,
                darkMode: false
            }
        };
        setPreferences(defaultPrefs);
        localStorage.removeItem('dashboard_preferences');
        
        showNotification({
            type: 'info',
            title: 'Préférences réinitialisées',
            message: 'Les préférences par défaut ont été appliquées',
            duration: 3000
        });
    }, []);
    
    // Obtenir les widgets triés
    const sortedWidgets = useMemo(() => {
        return Object.entries(preferences.widgets)
            .filter(([_, config]) => config.visible)
            .sort(([_, a], [__, b]) => a.order - b.order)
            .map(([name, config]) => ({ name, config }));
    }, [preferences.widgets]);
    
    // Configuration des widgets
    const getWidgetConfig = (widgetName) => {
        const widget = preferences.widgets[widgetName];
        if (!widget || !widget.visible) return null;
        
        const commonConfig = {
            key: widgetName,
            height: isMobile ? 300 : 
                   widget.size === 'large' ? 400 :
                   widget.size === 'medium' ? 350 : 300,
            autoRefresh: preferences.settings.autoRefresh,
            refreshInterval: preferences.settings.refreshInterval
        };
        
        switch (widgetName) {
            case 'loansStats':
                return {
                    ...commonConfig,
                    compact: preferences.settings.compactMode,
                    showTrends: true,
                    showAlerts: true
                };
            case 'activityChart':
                return {
                    ...commonConfig,
                    defaultPeriod,
                    showControls: !preferences.settings.compactMode,
                    realTimeUpdates: true
                };
            case 'topUsers':
                return {
                    ...commonConfig,
                    maxUsers: isMobile ? 5 : 10,
                    showProgress: true,
                    showActivity: !preferences.settings.compactMode,
                    showDepartment: !preferences.settings.compactMode
                };
            case 'alerts':
                return {
                    ...commonConfig,
                    showFilters: !preferences.settings.compactMode,
                    showActions: !preferences.settings.compactMode,
                    maxAlerts: isMobile ? 5 : 10
                };
            case 'performance':
                return {
                    ...commonConfig,
                    showDetails: !preferences.settings.compactMode,
                    showTrends: true,
                    compact: preferences.settings.compactMode
                };
            default:
                return commonConfig;
        }
    };
    
    // Composant d'en-tête du dashboard
    const DashboardHeader = () => (
        <Box 
            sx={{ 
                p: 2, 
                bgcolor: theme.palette.background.paper,
                borderBottom: 1,
                borderColor: theme.palette.divider,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                zIndex: 1000
            }}
        >
            <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <DashboardIcon />
                </Avatar>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        Dashboard Prêts Temps Réel
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Vue d'ensemble de l'activité de prêt et monitoring
                        {lastUpdate && ` • Dernière MAJ: ${lastUpdate.toLocaleTimeString()}`}
                    </Typography>
                </Box>
            </Box>
            
            <Box display="flex" alignItems="center" gap={1}>
                {/* Indicateur de connexion */}
                <Tooltip title={connectionStatus.connected ? "Connecté" : "Déconnecté"}>
                    <Badge
                        variant="dot"
                        color={connectionStatus.connected ? "success" : "error"}
                    >
                        <Avatar 
                            sx={{ 
                                width: 32, 
                                height: 32,
                                bgcolor: connectionStatus.connected ? 'success.main' : 'error.main'
                            }}
                        >
                            {connectionStatus.connected ? <Wifi /> : <WifiOff />}
                        </Avatar>
                    </Badge>
                </Tooltip>
                
                {/* Notifications */}
                <Tooltip title="Notifications">
                    <IconButton 
                        onClick={() => setNotificationsOpen(true)}
                        color={notifications.length > 0 ? "primary" : "default"}
                    >
                        <Badge badgeContent={notifications.length} color="error">
                            <Notifications />
                        </Badge>
                    </IconButton>
                </Tooltip>
                
                {/* Refresh */}
                <Tooltip title="Actualiser">
                    <IconButton 
                        onClick={handleManualRefresh}
                        disabled={isLoading}
                        color="primary"
                    >
                        <Refresh />
                    </IconButton>
                </Tooltip>
                
                {/* Settings */}
                <Tooltip title="Paramètres">
                    <IconButton 
                        onClick={() => setSettingsOpen(true)}
                        color="default"
                    >
                        <Settings />
                    </IconButton>
                </Tooltip>
                
                {/* Fullscreen */}
                {enableFullscreen && (
                    <Tooltip title={isFullscreen ? "Quitter plein écran" : "Plein écran"}>
                        <IconButton onClick={toggleFullscreen} color="default">
                            {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
        </Box>
    );
    
    // Composant de contenu principal
    const DashboardContent = () => (
        <Container maxWidth="xl" sx={{ p: 2, height }}>
            <Grid container spacing={2}>
                {sortedWidgets.map(({ name, config }, index) => {
                    const widgetConfig = getWidgetConfig(name);
                    if (!widgetConfig) return null;
                    
                    const WidgetComponent = {
                        loansStats: LoansStatsWidget,
                        activityChart: ActivityChartWidget,
                        topUsers: TopUsersWidget,
                        alerts: AlertSummaryWidget,
                        performance: PerformanceMetricsWidget
                    }[name];
                    
                    return (
                        <Grid 
                            item 
                            xs={12} 
                            sm={config.size === 'large' ? 12 : 6} 
                            md={config.size === 'large' ? 12 : config.size === 'medium' ? 6 : 4}
                            key={name}
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                layout
                            >
                                <WidgetComponent {...widgetConfig} />
                            </motion.div>
                        </Grid>
                    );
                })}
            </Grid>
        </Container>
    );
    
    // Composant de paramètres
    const SettingsDrawer = () => (
        <Drawer
            anchor="right"
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
        >
            <Box sx={{ width: 350, p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Paramètres Dashboard
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                {/* Paramètres généraux */}
                <Typography variant="subtitle1" gutterBottom>
                    Paramètres généraux
                </Typography>
                
                <FormControlLabel
                    control={
                        <Switch
                            checked={preferences.settings.autoRefresh}
                            onChange={(e) => setPreferences(prev => ({
                                ...prev,
                                settings: { ...prev.settings, autoRefresh: e.target.checked }
                            }))}
                        />
                    }
                    label="Actualisation automatique"
                />
                
                <FormControlLabel
                    control={
                        <Switch
                            checked={preferences.settings.showNotifications}
                            onChange={(e) => setPreferences(prev => ({
                                ...prev,
                                settings: { ...prev.settings, showNotifications: e.target.checked }
                            }))}
                        />
                    }
                    label="Afficher notifications"
                />
                
                <FormControlLabel
                    control={
                        <Switch
                            checked={preferences.settings.compactMode}
                            onChange={(e) => setPreferences(prev => ({
                                ...prev,
                                settings: { ...prev.settings, compactMode: e.target.checked }
                            }))}
                        />
                    }
                    label="Mode compact"
                />
                
                <Divider sx={{ my: 2 }} />
                
                {/* Visibilité des widgets */}
                <Typography variant="subtitle1" gutterBottom>
                    Widgets
                </Typography>
                
                <List>
                    {Object.entries(preferences.widgets).map(([name, config]) => (
                        <ListItem key={name}>
                            <ListItemIcon>
                                {name === 'loansStats' && <Timeline />}
                                {name === 'activityChart' && <BarChart />}
                                {name === 'topUsers' && <TrendingUp />}
                                {name === 'alerts' && <Warning />}
                                {name === 'performance' && <CheckCircle />}
                            </ListItemIcon>
                            <ListItemText 
                                primary={name.charAt(0).toUpperCase() + name.slice(1)}
                                secondary={`Ordre: ${config.order}`}
                            />
                            <Switch
                                checked={config.visible}
                                onChange={(e) => setPreferences(prev => ({
                                    ...prev,
                                    widgets: {
                                        ...prev.widgets,
                                        [name]: { ...config, visible: e.target.checked }
                                    }
                                }))}
                            />
                        </ListItem>
                    ))}
                </List>
                
                <Divider sx={{ my: 2 }} />
                
                {/* Actions */}
                <Box display="flex" flexDirection="column" gap={1}>
                    <Button 
                        variant="contained" 
                        startIcon={<Save />}
                        onClick={savePreferences}
                        fullWidth
                    >
                        Sauvegarder
                    </Button>
                    <Button 
                        variant="outlined" 
                        startIcon={<Restore />}
                        onClick={resetPreferences}
                        fullWidth
                    >
                        Réinitialiser
                    </Button>
                </Box>
            </Box>
        </Drawer>
    );
    
    // Composant de notifications
    const NotificationsDrawer = () => (
        <Drawer
            anchor="right"
            open={notificationsOpen}
            onClose={() => setNotificationsOpen(false)}
        >
            <Box sx={{ width: 400, p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Notifications ({notifications.length})
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <List>
                    {notifications.map((notification) => (
                        <ListItem key={notification.id}>
                            <ListItemIcon>
                                {notification.type === 'error' && <Error color="error" />}
                                {notification.type === 'warning' && <Warning color="warning" />}
                                {notification.type === 'success' && <CheckCircle color="success" />}
                                {notification.type === 'info' && <Notifications color="info" />}
                            </ListItemIcon>
                            <ListItemText
                                primary={notification.title}
                                secondary={
                                    <Box>
                                        <Typography variant="body2">
                                            {notification.message}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {notification.timestamp.toLocaleString()}
                                        </Typography>
                                    </Box>
                                }
                            />
                        </ListItem>
                    ))}
                    
                    {notifications.length === 0 && (
                        <Box textAlign="center" py={4}>
                            <Typography color="text.secondary">
                                Aucune notification
                            </Typography>
                        </Box>
                    )}
                </List>
            </Box>
        </Drawer>
    );
    
    return (
        <Box 
            sx={{ 
                height: isFullscreen ? '100vh' : height,
                bgcolor: theme.palette.background.default
            }}
        >
            <DashboardHeader />
            <DashboardContent />
            
            <SettingsDrawer />
            <NotificationsDrawer />
            
            {/* FAB pour les actions rapides sur mobile */}
            {isMobile && (
                <Fab
                    color="primary"
                    aria-label="actions"
                    sx={{ 
                        position: 'fixed', 
                        bottom: 16, 
                        right: 16 
                    }}
                    onClick={() => setSettingsOpen(true)}
                >
                    <Settings />
                </Fab>
            )}
        </Box>
    );
};

export default DashboardPrêts;