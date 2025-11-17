// src/components/dashboard/AlertSummaryWidget.js - Widget Résumé Alertes Temps Réel
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Chip,
    IconButton,
    Tooltip,
    Badge,
    Avatar,
    useTheme,
    useMediaQuery,
    Collapse,
    Button,
    Divider,
    Card,
    CardContent,
    LinearProgress
} from '@mui/material';
import {
    Warning,
    Error,
    Info,
    CheckCircle,
    Clear,
    ExpandMore,
    ExpandLess,
    Refresh,
    NotificationsActive,
    Schedule,
    Computer,
    Person,
    Close,
    Timer,
    TrendingUp,
    Warning as CriticalIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const AlertSummaryWidget = ({
    height = 400,
    maxAlerts = 10,
    showFilters = true,
    autoRefresh = true,
    refreshInterval = 30000,
    showActions = true
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
    // États locaux
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [selectedFilter, setSelectedFilter] = useState('all'); // 'all', 'critical', 'warning', 'info', 'resolved'
    const [expandedAlert, setExpandedAlert] = useState(null);
    const [dismissedAlerts, setDismissedAlerts] = useState(new Set());
    
    // Génération d'alertes simulées
    const generateAlerts = useCallback(() => {
        const categories = ['computer', 'loan', 'user', 'system', 'network'];
        const severities = ['critical', 'warning', 'info'];
        const statuses = ['active', 'resolved', 'acknowledged'];
        
        const sampleAlerts = [
            {
                id: 1,
                title: 'Ordinateur en retard critique',
                message: 'Ordinateur LENOVO-001 en retard depuis 5 jours',
                severity: 'critical',
                category: 'computer',
                status: 'active',
                timestamp: Date.now() - 1000 * 60 * 30, // 30 min ago
                assignedTo: 'Jean Dupont',
                estimatedResolution: Date.now() + 1000 * 60 * 60 * 2, // 2 hours
                impact: 'high',
                details: {
                    equipmentId: 'LENOVO-001',
                    user: 'Marie Martin',
                    location: 'Bâtiment A - Étage 2',
                    dueDate: Date.now() - 1000 * 60 * 60 * 24 * 5
                }
            },
            {
                id: 2,
                title: 'Taux d\'occupation élevé',
                message: '85% des ordinateurs sont actuellement en circulation',
                severity: 'warning',
                category: 'system',
                status: 'active',
                timestamp: Date.now() - 1000 * 60 * 15,
                estimatedResolution: null,
                impact: 'medium',
                details: {
                    currentUtilization: 85,
                    totalComputers: 120,
                    availableComputers: 18,
                    peakHours: '09:00-17:00'
                }
            },
            {
                id: 3,
                title: 'Utilisateur inactif',
                message: 'Pierre Durand n\'a pas restitué son équipement depuis 7 jours',
                severity: 'warning',
                category: 'user',
                status: 'acknowledged',
                timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2,
                assignedTo: 'Support IT',
                estimatedResolution: Date.now() + 1000 * 60 * 60 * 8,
                impact: 'low',
                details: {
                    userId: 'pierre.durand',
                    lastLogin: Date.now() - 1000 * 60 * 60 * 24 * 3,
                    equipment: 'Dell Laptop 2023'
                }
            },
            {
                id: 4,
                title: 'Maintenance programmée',
                message: 'Maintenance serveur prévue ce soir 23h-01h',
                severity: 'info',
                category: 'system',
                status: 'active',
                timestamp: Date.now() - 1000 * 60 * 60 * 4,
                estimatedResolution: Date.now() + 1000 * 60 * 60 * 12,
                impact: 'low',
                details: {
                    serverName: 'SRV-PRD-01',
                    maintenanceWindow: '23:00-01:00',
                    affectedServices: ['API', 'Database', 'Web Interface'],
                    expectedDowntime: '15 minutes'
                }
            },
            {
                id: 5,
                title: 'Problème de connectivité',
                message: 'Connexion réseau intermittente détectée',
                severity: 'critical',
                category: 'network',
                status: 'resolved',
                timestamp: Date.now() - 1000 * 60 * 60 * 2,
                assignedTo: 'Réseau IT',
                estimatedResolution: Date.now() - 1000 * 60 * 30,
                impact: 'high',
                details: {
                    affectedLocations: ['Bâtiment B', 'Bâtiment C'],
                    connectionType: 'WiFi',
                    resolutionTime: '30 minutes'
                }
            }
        ];
        
        return sampleAlerts;
    }, []);
    
    // Récupération des alertes
    const fetchAlerts = useCallback(async () => {
        setLoading(true);
        
        // Simulation de délai réseau
        await new Promise(resolve => setTimeout(resolve, 600));
        
        const alertsData = generateAlerts();
        setAlerts(alertsData);
        setLastUpdate(new Date());
        setLoading(false);
    }, [generateAlerts]);
    
    // Initialisation et mise à jour automatique
    useEffect(() => {
        fetchAlerts();
        
        if (autoRefresh) {
            const interval = setInterval(fetchAlerts, refreshInterval);
            return () => clearInterval(interval);
        }
    }, [fetchAlerts, autoRefresh, refreshInterval]);
    
    // Filtrage des alertes
    const filteredAlerts = useMemo(() => {
        let filtered = alerts;
        
        // Exclure les alertes dismissées
        filtered = filtered.filter(alert => !dismissedAlerts.has(alert.id));
        
        // Appliquer le filtre de statut
        switch (selectedFilter) {
            case 'critical':
                filtered = filtered.filter(alert => alert.severity === 'critical');
                break;
            case 'warning':
                filtered = filtered.filter(alert => alert.severity === 'warning');
                break;
            case 'info':
                filtered = filtered.filter(alert => alert.severity === 'info');
                break;
            case 'resolved':
                filtered = filtered.filter(alert => alert.status === 'resolved');
                break;
            default:
                // 'all' - afficher toutes les alertes actives
                filtered = filtered.filter(alert => alert.status !== 'resolved');
        }
        
        return filtered.slice(0, maxAlerts);
    }, [alerts, selectedFilter, dismissedAlerts, maxAlerts]);
    
    // Calculs de statistiques
    const stats = useMemo(() => {
        const totalAlerts = alerts.length;
        const activeAlerts = alerts.filter(a => a.status === 'active').length;
        const criticalAlerts = alerts.filter(a => a.severity === 'critical' && a.status === 'active').length;
        const warningAlerts = alerts.filter(a => a.severity === 'warning' && a.status === 'active').length;
        const infoAlerts = alerts.filter(a => a.severity === 'info' && a.status === 'active').length;
        const resolvedAlerts = alerts.filter(a => a.status === 'resolved').length;
        
        return {
            total: totalAlerts,
            active: activeAlerts,
            critical: criticalAlerts,
            warning: warningAlerts,
            info: infoAlerts,
            resolved: resolvedAlerts
        };
    }, [alerts]);
    
    // Fonctions utilitaires
    const getSeverityConfig = (severity) => {
        switch (severity) {
            case 'critical':
                return {
                    color: 'error',
                    icon: CriticalIcon,
                    bgColor: theme.palette.error.main + '15',
                    textColor: theme.palette.error.main
                };
            case 'warning':
                return {
                    color: 'warning',
                    icon: Warning,
                    bgColor: theme.palette.warning.main + '15',
                    textColor: theme.palette.warning.main
                };
            case 'info':
                return {
                    color: 'info',
                    icon: Info,
                    bgColor: theme.palette.info.main + '15',
                    textColor: theme.palette.info.main
                };
            default:
                return {
                    color: 'default',
                    icon: Info,
                    bgColor: theme.palette.grey[100],
                    textColor: theme.palette.text.secondary
                };
        }
    };
    
    const getStatusConfig = (status) => {
        switch (status) {
            case 'resolved':
                return {
                    color: 'success',
                    icon: CheckCircle,
                    label: 'Résolu'
                };
            case 'acknowledged':
                return {
                    color: 'info',
                    icon: Schedule,
                    label: 'Reconnu'
                };
            default:
                return {
                    color: 'default',
                    icon: Warning,
                    label: 'Actif'
                };
        }
    };
    
    const getCategoryIcon = (category) => {
        switch (category) {
            case 'computer':
                return Computer;
            case 'loan':
                return Timer;
            case 'user':
                return Person;
            case 'network':
                return TrendingUp;
            default:
                return Info;
        }
    };
    
    const formatTimestamp = (timestamp) => {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (minutes < 60) return `Il y a ${minutes}min`;
        if (hours < 24) return `Il y a ${hours}h`;
        return `Il y a ${days}j`;
    };
    
    const formatEstimatedResolution = (timestamp) => {
        if (!timestamp) return null;
        const diff = timestamp - Date.now();
        
        if (diff <= 0) return 'En retard';
        
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        
        if (hours > 0) return `${hours}h ${minutes % 60}min`;
        return `${minutes}min`;
    };
    
    // Gestionnaires d'événements
    const handleDismissAlert = (alertId) => {
        setDismissedAlerts(prev => new Set([...prev, alertId]));
    };
    
    const handleExpandAlert = (alertId) => {
        setExpandedAlert(expandedAlert === alertId ? null : alertId);
    };
    
    const handleFilterChange = (filter) => {
        setSelectedFilter(filter);
    };
    
    const handleRefresh = () => {
        fetchAlerts();
    };
    
    // Composant d'avatar d'alerte
    const AlertAvatar = ({ alert }) => {
        const severityConfig = getSeverityConfig(alert.severity);
        const StatusIcon = getStatusConfig(alert.status).icon;
        
        return (
            <Badge
                badgeContent={
                    <Avatar sx={{ 
                        width: 20, 
                        height: 20, 
                        bgcolor: theme.palette[getStatusConfig(alert.status).color].main 
                    }}>
                        <StatusIcon sx={{ fontSize: 12 }} />
                    </Avatar>
                }
                sx={{
                    '& .MuiBadge-badge': {
                        border: `2px solid ${theme.palette.background.paper}`,
                        bottom: -2,
                        right: -2
                    }
                }}
            >
                <Avatar sx={{ bgcolor: severityConfig.bgColor }}>
                    {React.createElement(severityConfig.icon, {
                        sx: { color: severityConfig.textColor }
                    })}
                </Avatar>
            </Badge>
        );
    };
    
    // Composant de filtre
    const AlertFilter = ({ active, count, label, color }) => (
        <Chip
            size="small"
            label={`${label} (${count})`}
            color={active ? color : 'default'}
            variant={active ? 'filled' : 'outlined'}
            onClick={() => handleFilterChange(label.toLowerCase())}
            sx={{ 
                cursor: 'pointer',
                fontWeight: active ? 600 : 400
            }}
        />
    );
    
    return (
        <Paper elevation={2} sx={{ p: 2, height, borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
            {/* En-tête avec statistiques */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography 
                    variant="h6" 
                    sx={{ 
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                    }}
                >
                    <NotificationsActive color="primary" />
                    Résumé des Alertes
                    {stats.critical > 0 && (
                        <Badge badgeContent={stats.critical} color="error" />
                    )}
                </Typography>
                
                <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="caption" color="text.secondary">
                        {stats.active} actives
                    </Typography>
                    <Tooltip title="Actualiser">
                        <IconButton size="small" onClick={handleRefresh} disabled={loading}>
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
            
            {/* Barre de statistiques */}
            <Box mb={2}>
                <Grid container spacing={1}>
                    <Grid item xs={3}>
                        <AlertFilter 
                            active={selectedFilter === 'all'} 
                            count={stats.active} 
                            label="Toutes" 
                            color="primary" 
                        />
                    </Grid>
                    <Grid item xs={3}>
                        <AlertFilter 
                            active={selectedFilter === 'critical'} 
                            count={stats.critical} 
                            label="Critique" 
                            color="error" 
                        />
                    </Grid>
                    <Grid item xs={3}>
                        <AlertFilter 
                            active={selectedFilter === 'warning'} 
                            count={stats.warning} 
                            label="Attention" 
                            color="warning" 
                        />
                    </Grid>
                    <Grid item xs={3}>
                        <AlertFilter 
                            active={selectedFilter === 'resolved'} 
                            count={stats.resolved} 
                            label="Résolues" 
                            color="success" 
                        />
                    </Grid>
                </Grid>
            </Box>
            
            {/* Liste des alertes */}
            <Box flex={1} overflow="auto">
                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                        <Typography color="text.secondary">Chargement des alertes...</Typography>
                    </Box>
                ) : filteredAlerts.length === 0 ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                        <Box textAlign="center">
                            <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                            <Typography color="success.main" sx={{ fontWeight: 600 }}>
                                Aucune alerte {selectedFilter !== 'all' ? selectedFilter : 'active'} 
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Tout fonctionne normalement
                            </Typography>
                        </Box>
                    </Box>
                ) : (
                    <List dense disablePadding>
                        <AnimatePresence>
                            {filteredAlerts.map((alert, index) => {
                                const severityConfig = getSeverityConfig(alert.severity);
                                const statusConfig = getStatusConfig(alert.status);
                                const isExpanded = expandedAlert === alert.id;
                                
                                return (
                                    <motion.div
                                        key={alert.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                    >
                                        <ListItem
                                            sx={{
                                                py: 1.5,
                                                px: 0,
                                                cursor: 'pointer',
                                                borderRadius: 1,
                                                mb: 1,
                                                backgroundColor: severityConfig.bgColor,
                                                border: `1px solid ${severityConfig.textColor}30`,
                                                '&:hover': {
                                                    backgroundColor: severityConfig.bgColor,
                                                    borderColor: severityConfig.textColor
                                                }
                                            }}
                                            onClick={() => handleExpandAlert(alert.id)}
                                        >
                                            <ListItemIcon>
                                                <AlertAvatar alert={alert} />
                                            </ListItemIcon>
                                            
                                            <ListItemText
                                                primary={
                                                    <Box display="flex" alignItems="center" justifyContent="space-between">
                                                        <Typography 
                                                            variant="subtitle2" 
                                                            sx={{ 
                                                                fontWeight: 600,
                                                                color: severityConfig.textColor,
                                                                maxWidth: '70%'
                                                            }}
                                                        >
                                                            {alert.title}
                                                        </Typography>
                                                        <Box display="flex" alignItems="center" gap={1}>
                                                            <Chip
                                                                label={statusConfig.label}
                                                                size="small"
                                                                color={statusConfig.color}
                                                                variant="outlined"
                                                            />
                                                            <Typography variant="caption" color="text.secondary">
                                                                {formatTimestamp(alert.timestamp)}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                }
                                                secondary={
                                                    <Box>
                                                        <Typography 
                                                            variant="body2" 
                                                            color="text.secondary" 
                                                            sx={{ mt: 0.5 }}
                                                        >
                                                            {alert.message}
                                                        </Typography>
                                                        
                                                        <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                                            <Chip
                                                                label={alert.category}
                                                                size="small"
                                                                icon={getCategoryIcon(alert.category)}
                                                                variant="outlined"
                                                            />
                                                            
                                                            <Chip
                                                                label={`Impact: ${alert.impact}`}
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                            
                                                            {alert.estimatedResolution && (
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Résolution estimée: {formatEstimatedResolution(alert.estimatedResolution)}
                                                                </Typography>
                                                            )}
                                                            
                                                            {isExpanded ? 
                                                                <ExpandLess fontSize="small" /> : 
                                                                <ExpandMore fontSize="small" />
                                                            }
                                                        </Box>
                                                    </Box>
                                                }
                                            />
                                            
                                            {showActions && (
                                                <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                                                    <Tooltip title="Ignorer">
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDismissAlert(alert.id);
                                                            }}
                                                            sx={{ 
                                                                opacity: 0.7,
                                                                '&:hover': { opacity: 1 }
                                                            }}
                                                        >
                                                            <Close fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            )}
                                        </ListItem>
                                        
                                        <Collapse in={isExpanded}>
                                            <Box pl={8} pr={2} pb={2}>
                                                <Divider sx={{ mb: 1 }} />
                                                <Typography variant="caption" color="text.secondary" gutterBottom>
                                                    Détails supplémentaires:
                                                </Typography>
                                                <Box sx={{ fontSize: '0.75rem' }}>
                                                    {alert.details && Object.entries(alert.details).map(([key, value]) => (
                                                        <Box key={key} display="flex" justifyContent="space-between" sx={{ py: 0.5 }}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {key}:
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                            </Typography>
                                                        </Box>
                                                    ))}
                                                </Box>
                                                
                                                {alert.assignedTo && (
                                                    <Box mt={1}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Assigné à: {alert.assignedTo}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Collapse>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </List>
                )}
            </Box>
            
            {/* Informations de mise à jour */}
            {lastUpdate && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                    Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
                </Typography>
            )}
        </Paper>
    );
};

export default React.memo(AlertSummaryWidget);