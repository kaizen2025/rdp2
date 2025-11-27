// src/components/dashboard/LoansStatsWidget.js - Widget Statistiques Prêts Temps Réel
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    LinearProgress,
    Chip,
    IconButton,
    Tooltip,
    Badge,
    Avatar,
    useTheme,
    useMediaQuery,
    Collapse
} from '@mui/material';
import {
    Assignment,
    CheckCircle,
    Schedule,
    Error,
    TrendingUp,
    TrendingDown,
    Refresh,
    Visibility,
    VisibilityOff,
    Warning
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const LoansStatsWidget = ({ 
    height = 400,
    compact = false,
    showTrends = true,
    showAlerts = true,
    autoRefresh = true,
    refreshInterval = 30000
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
    // États locaux
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        overdue: 0,
        critical: 0,
        reserved: 0,
        returned: 0,
        trends: {
            daily: { change: 0, direction: 'stable' },
            weekly: { change: 0, direction: 'stable' }
        },
        alerts: []
    });
    
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [isMinimized, setIsMinimized] = useState(false);
    const [alertDetails, setAlertDetails] = useState({});
    
    // Données simulées pour la démonstration
    const mockData = useMemo(() => ({
        total: 147,
        active: 89,
        overdue: 12,
        critical: 3,
        reserved: 8,
        returned: 38,
        trends: {
            daily: { change: 5.2, direction: 'up' },
            weekly: { change: -2.1, direction: 'down' }
        },
        alerts: [
            {
                id: 1,
                type: 'overdue',
                message: '3 prêts en retard critique',
                severity: 'high',
                timestamp: Date.now() - 1000 * 60 * 5
            },
            {
                id: 2,
                type: 'capacity',
                message: '89% des ordinateurs sont en circulation',
                severity: 'medium',
                timestamp: Date.now() - 1000 * 60 * 15
            }
        ]
    }), []);

    // Mise à jour des données
    const updateStats = useCallback(() => {
        setIsLoading(true);
        
        // Simulation de données temps réel avec variations
        setTimeout(() => {
            const variation = (Math.random() - 0.5) * 0.1; // ±5% de variation
            setStats(prev => ({
                ...mockData,
                active: Math.max(0, Math.round(mockData.active * (1 + variation))),
                overdue: Math.max(0, Math.round(mockData.overdue * (1 + variation))),
                critical: Math.max(0, Math.round(mockData.critical * (1 + variation)))
            }));
            setLastUpdate(new Date());
            setIsLoading(false);
        }, 800);
    }, [mockData]);

    // Initialisation et refresh automatique
    useEffect(() => {
        updateStats();
        
        let interval;
        if (autoRefresh) {
            interval = setInterval(updateStats, refreshInterval);
        }
        
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [updateStats, autoRefresh, refreshInterval]);

    // Calcul des pourcentages et indicateurs
    const calculatedStats = useMemo(() => {
        const utilizationRate = stats.total > 0 ? (stats.active / stats.total) * 100 : 0;
        const availabilityRate = 100 - utilizationRate;
        const overdueRate = stats.active > 0 ? (stats.overdue / stats.active) * 100 : 0;
        const criticalRate = stats.active > 0 ? (stats.critical / stats.active) * 100 : 0;
        
        return {
            utilizationRate,
            availabilityRate,
            overdueRate,
            criticalRate
        };
    }, [stats]);

    // Composant d'icône avec animation
    const AnimatedIcon = ({ icon: Icon, color, pulse = false }) => (
        <motion.div
            animate={pulse ? {
                scale: [1, 1.1, 1],
                color: [color, theme.palette.error.main, color]
            } : {}}
            transition={pulse ? { 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
            } : { duration: 0.3 }}
        >
            <Avatar sx={{ 
                bgcolor: `${color}20`,
                color: color,
                width: 32,
                height: 32
            }}>
                <Icon fontSize="small" />
            </Avatar>
        </motion.div>
    );

    // Composant de carte de statistique
    const StatCard = ({ 
        title, 
        value, 
        subtitle, 
        icon: Icon, 
        color, 
        trend,
        alert = false,
        pulse = false
    }) => (
        <Card 
            elevation={2} 
            sx={{ 
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[8]
                }
            }}
        >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <AnimatedIcon icon={Icon} color={color} pulse={pulse} />
                    {trend && (
                        <Box display="flex" alignItems="center">
                            {trend.direction === 'up' ? (
                                <TrendingUp sx={{ color: 'success.main', fontSize: 16 }} />
                            ) : trend.direction === 'down' ? (
                                <TrendingDown sx={{ color: 'error.main', fontSize: 16 }} />
                            ) : null}
                            <Typography variant="caption" color={color} sx={{ ml: 0.5, fontWeight: 600 }}>
                                {Math.abs(trend.change)}%
                            </Typography>
                        </Box>
                    )}
                </Box>
                
                <Typography variant="h4" sx={{ fontWeight: 700, color, mb: 0.5 }}>
                    {value}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {title}
                </Typography>
                
                {subtitle && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                        {subtitle}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );

    // Gestionnaire de clic sur une carte
    const handleCardClick = (cardType) => {
        console.log(`Clic sur carte: ${cardType}`);
        // Ici on pourrait naviguer vers une page détaillée
    };

    if (isLoading && !stats.total) {
        return (
            <Paper elevation={2} sx={{ p: 2, height }}>
                <Typography variant="h6" gutterBottom>Statistiques des Prêts</Typography>
                <LinearProgress />
            </Paper>
        );
    }

    return (
        <Paper elevation={2} sx={{ p: 2, height, borderRadius: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
                <Typography 
                    variant="h6" 
                    sx={{ 
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                    }}
                >
                    <Assignment color="primary" />
                    Statistiques des Prêts
                </Typography>
                
                <Box display="flex" alignItems="center" gap={1}>
                    <Tooltip title={isMinimized ? "Afficher détails" : "Minimiser"}>
                        <IconButton 
                            size="small" 
                            onClick={() => setIsMinimized(!isMinimized)}
                        >
                            {isMinimized ? <Visibility /> : <VisibilityOff />}
                        </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Actualiser">
                        <IconButton size="small" onClick={updateStats}>
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                    
                    {lastUpdate && (
                        <Typography variant="caption" color="text.secondary">
                            MAJ: {lastUpdate.toLocaleTimeString()}
                        </Typography>
                    )}
                </Box>
            </Box>

            <Grid container spacing={2}>
                {/* Statistiques principales */}
                <Grid item xs={6} sm={3}>
                    <StatCard
                        title="Total"
                        value={stats.total}
                        icon={Assignment}
                        color={theme.palette.primary.main}
                        trend={showTrends ? stats.trends.daily : null}
                        onClick={() => handleCardClick('total')}
                    />
                </Grid>
                
                <Grid item xs={6} sm={3}>
                    <StatCard
                        title="Actifs"
                        value={stats.active}
                        subtitle={`${calculatedStats.utilizationRate.toFixed(1)}% utilisé`}
                        icon={CheckCircle}
                        color={theme.palette.success.main}
                        trend={showTrends ? stats.trends.weekly : null}
                        onClick={() => handleCardClick('active')}
                    />
                </Grid>
                
                <Grid item xs={6} sm={3}>
                    <StatCard
                        title="En Retard"
                        value={stats.overdue}
                        subtitle={`${calculatedStats.overdueRate.toFixed(1)}% des actifs`}
                        icon={Schedule}
                        color={theme.palette.warning.main}
                        pulse={stats.overdue > 10}
                        onClick={() => handleCardClick('overdue')}
                    />
                </Grid>
                
                <Grid item xs={6} sm={3}>
                    <StatCard
                        title="Critiques"
                        value={stats.critical}
                        subtitle={`${calculatedStats.criticalRate.toFixed(1)}% des actifs`}
                        icon={Error}
                        color={theme.palette.error.main}
                        pulse={stats.critical > 0}
                        alert={stats.critical > 0}
                        onClick={() => handleCardClick('critical')}
                    />
                </Grid>

                {/* Détails en mode étendu */}
                <AnimatePresence>
                    {!isMinimized && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Grid item xs={12}>
                                <Box display="flex" gap={2} mt={1}>
                                    <Chip
                                        icon={<Schedule />}
                                        label={`Réservés: ${stats.reserved}`}
                                        color="info"
                                        variant="outlined"
                                        size="small"
                                    />
                                    <Chip
                                        icon={<CheckCircle />}
                                        label={`Retour: ${stats.returned}`}
                                        color="success"
                                        variant="outlined"
                                        size="small"
                                    />
                                    <Chip
                                        icon={<TrendingUp />}
                                        label={`Taux occupation: ${calculatedStats.utilizationRate.toFixed(1)}%`}
                                        color={calculatedStats.utilizationRate > 80 ? "warning" : "success"}
                                        variant="outlined"
                                        size="small"
                                    />
                                </Box>
                            </Grid>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Alertes en temps réel */}
                <AnimatePresence>
                    {showAlerts && stats.alerts.length > 0 && !isMinimized && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                        >
                            <Grid item xs={12}>
                                <Box mt={1}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        <Warning sx={{ mr: 1, fontSize: 16 }} />
                                        Alertes Temps Réel
                                    </Typography>
                                    <Box display="flex" flexDirection="column" gap={1}>
                                        {stats.alerts.map(alert => (
                                            <AlertItem key={alert.id} alert={alert} />
                                        ))}
                                    </Box>
                                </Box>
                            </Grid>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Grid>

            {/* Barre de progression globale */}
            <Box mt={2}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Capacité d'utilisation globale
                </Typography>
                <Box position="relative">
                    <LinearProgress
                        variant="determinate"
                        value={calculatedStats.utilizationRate}
                        sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: `${theme.palette.primary.main}20`,
                            '& .MuiLinearProgress-bar': {
                                background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.warning.main}, ${theme.palette.error.main})`,
                                borderRadius: 4
                            }
                        }}
                    />
                    <Typography
                        variant="caption"
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'white',
                            fontWeight: 600,
                            textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                        }}
                    >
                        {calculatedStats.utilizationRate.toFixed(1)}%
                    </Typography>
                </Box>
            </Box>
        </Paper>
    );
};

// Composant d'alerte individuelle
const AlertItem = ({ alert }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const severityColors = {
        high: 'error',
        medium: 'warning',
        low: 'info'
    };
    
    const severityIcons = {
        high: Error,
        medium: Warning,
        low: Schedule
    };
    
    const Icon = severityIcons[alert.severity];
    const color = severityColors[alert.severity];
    
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 1.5,
                    border: 1,
                    borderColor: `${color}.main`,
                    borderRadius: 1,
                    bgcolor: `${color}.main`,
                    background: `linear-gradient(135deg, ${color}.main}15, ${color}.main}05)`,
                    cursor: 'pointer'
                }}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <Avatar sx={{ 
                    bgcolor: `${color}.main`,
                    width: 24,
                    height: 24,
                    mr: 1
                }}>
                    <Icon sx={{ fontSize: 14 }} />
                </Avatar>
                
                <Box flex={1}>
                    <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                        {alert.message}
                    </Typography>
                    
                    <Collapse in={isExpanded}>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                            {new Date(alert.timestamp).toLocaleTimeString()}
                        </Typography>
                    </Collapse>
                </Box>
            </Box>
        </motion.div>
    );
};

export default React.memo(LoansStatsWidget);