// src/components/dashboard/PerformanceMetricsWidget.js - Widget Métriques de Performance
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
    useTheme,
    useMediaQuery,
    Switch,
    FormControlLabel,
    Divider
} from '@mui/material';
import {
    Speed,
    Memory,
    Storage,
    NetworkCheck,
    Timer,
    TrendingUp,
    TrendingDown,
    TrendingFlat,
    Refresh,
    Computer,
    Timeline,
    Wifi,
    WifiOff,
    BatteryAlert,
    BatteryFull,
    Cpu,
    DataUsage
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Composant de gauge circulaire pour les métriques
const CircularMetric = ({ 
    value, 
    max = 100, 
    size = 80, 
    strokeWidth = 8,
    color = 'primary',
    showValue = true,
    label = '',
    unit = '%',
    animated = true 
}) => {
    const theme = useTheme();
    const percentage = Math.min((value / max) * 100, 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
    const getColor = () => {
        if (percentage > 90) return theme.palette.error.main;
        if (percentage > 70) return theme.palette.warning.main;
        return theme.palette[color].main;
    };
    
    return (
        <Box position="relative" display="inline-flex" alignItems="center" justifyContent="center">
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={theme.palette.grey[200]}
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                {/* Progress circle */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={getColor()}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={strokeDasharray}
                    initial={animated ? { strokeDashoffset } : {}}
                    animate={animated ? { strokeDashoffset } : {}}
                    transition={animated ? { duration: 1.5, ease: "easeInOut" } : {}}
                    style={{
                        strokeLinecap: 'round',
                        filter: percentage > 70 ? 'drop-shadow(0 0 3px currentColor)' : 'none'
                    }}
                />
            </svg>
            
            {showValue && (
                <Box
                    position="absolute"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    textAlign="center"
                >
                    <Typography 
                        variant="h6" 
                        sx={{ 
                            fontWeight: 700,
                            color: getColor(),
                            lineHeight: 1
                        }}
                    >
                        {Math.round(value)}{unit}
                    </Typography>
                    {label && (
                        <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ fontSize: '0.6rem' }}
                        >
                            {label}
                        </Typography>
                    )}
                </Box>
            )}
        </Box>
    );
};

// Composant de carte de métrique avec tendances
const MetricCard = ({ 
    title, 
    value, 
    unit, 
    max, 
    icon: Icon, 
    trend = null,
    color = 'primary',
    description = '',
    status = 'normal' // 'normal', 'warning', 'critical'
}) => {
    const theme = useTheme();
    const percentage = Math.min((value / max) * 100, 100);
    
    const getStatusColor = () => {
        switch (status) {
            case 'critical': return theme.palette.error.main;
            case 'warning': return theme.palette.warning.main;
            default: return theme.palette[color].main;
        }
    };
    
    const getTrendIcon = () => {
        if (!trend) return null;
        switch (trend.direction) {
            case 'up': return <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />;
            case 'down': return <TrendingDown sx={{ fontSize: 16, color: 'error.main' }} />;
            default: return <TrendingFlat sx={{ fontSize: 16, color: 'text.secondary' }} />;
        }
    };
    
    return (
        <Card 
            elevation={2} 
            sx={{ 
                height: '100%',
                position: 'relative',
                overflow: 'visible',
                transition: 'all 0.3s ease',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[8]
                }
            }}
        >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ 
                            bgcolor: `${getStatusColor()}20`, 
                            color: getStatusColor(),
                            width: 32,
                            height: 32
                        }}>
                            <Icon fontSize="small" />
                        </Avatar>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {title}
                        </Typography>
                    </Box>
                    
                    {getTrendIcon()}
                </Box>
                
                <Box display="flex" alignItems="center" justifyContent="center" my={2}>
                    <CircularMetric
                        value={value}
                        max={max}
                        color={color}
                        showValue={true}
                        unit={unit}
                        label=""
                    />
                </Box>
                
                <Box mb={1}>
                    <LinearProgress
                        variant="determinate"
                        value={percentage}
                        sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: `${getStatusColor()}20`,
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: getStatusColor(),
                                borderRadius: 3
                            }
                        }}
                    />
                </Box>
                
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                        {description}
                    </Typography>
                    
                    <Chip
                        label={`${Math.round(percentage)}%`}
                        size="small"
                        color={status === 'critical' ? 'error' : status === 'warning' ? 'warning' : color}
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                    />
                </Box>
                
                {trend && (
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                        <Typography variant="caption" color="text.secondary">
                            Évolution
                        </Typography>
                        <Typography 
                            variant="caption" 
                            sx={{ 
                                fontWeight: 600,
                                color: trend.direction === 'up' ? 'success.main' : 
                                      trend.direction === 'down' ? 'error.main' : 'text.secondary'
                            }}
                        >
                            {trend.direction === 'up' ? '+' : ''}{trend.value}% 
                            {trend.period && ` (${trend.period})`}
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

const PerformanceMetricsWidget = ({
    height = 400,
    showDetails = true,
    showTrends = true,
    autoRefresh = true,
    refreshInterval = 5000,
    compact = false
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
    // États locaux
    const [metrics, setMetrics] = useState({
        cpu: { value: 0, max: 100, unit: '%' },
        memory: { value: 0, max: 100, unit: '%' },
        disk: { value: 0, max: 100, unit: '%' },
        network: { value: 0, max: 100, unit: '%' },
        responseTime: { value: 0, max: 1000, unit: 'ms' },
        throughput: { value: 0, max: 1000, unit: 'req/s' },
        connections: { value: 0, max: 500, unit: '' },
        uptime: { value: 0, max: 30, unit: 'j' }
    });
    
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [isLive, setIsLive] = useState(true);
    
    // Simulation de métriques en temps réel
    const generateMetrics = useCallback(() => {
        const now = new Date();
        const timeOfDay = now.getHours();
        
        // Variation selon l'heure (pic entre 9h-17h)
        let cpuBase = 30;
        let memoryBase = 50;
        let diskBase = 60;
        let networkBase = 40;
        
        if (timeOfDay >= 9 && timeOfDay <= 17) {
            cpuBase = 60;
            memoryBase = 70;
            networkBase = 80;
        } else if (timeOfDay >= 6 && timeOfDay <= 8) {
            cpuBase = 45;
            memoryBase = 60;
            networkBase = 60;
        } else if (timeOfDay >= 18 && timeOfDay <= 22) {
            cpuBase = 40;
            memoryBase = 55;
            networkBase = 50;
        }
        
        // Ajout de variations aléatoires
        const addVariation = (base, range) => 
            Math.max(0, Math.min(100, base + (Math.random() - 0.5) * range));
        
        return {
            cpu: {
                value: Math.round(addVariation(cpuBase, 30)),
                max: 100,
                unit: '%',
                description: 'Utilisation CPU serveurs',
                status: addVariation(cpuBase, 30) > 90 ? 'critical' : 
                       addVariation(cpuBase, 30) > 70 ? 'warning' : 'normal',
                trend: showTrends ? {
                    direction: Math.random() > 0.5 ? 'up' : 'down',
                    value: Math.round((Math.random() - 0.5) * 20),
                    period: '24h'
                } : null
            },
            memory: {
                value: Math.round(addVariation(memoryBase, 20)),
                max: 100,
                unit: '%',
                description: 'Mémoire système',
                status: addVariation(memoryBase, 20) > 90 ? 'critical' : 
                       addVariation(memoryBase, 20) > 75 ? 'warning' : 'normal',
                trend: showTrends ? {
                    direction: Math.random() > 0.5 ? 'up' : 'down',
                    value: Math.round((Math.random() - 0.5) * 15),
                    period: '24h'
                } : null
            },
            disk: {
                value: Math.round(addVariation(diskBase, 15)),
                max: 100,
                unit: '%',
                description: 'Stockage disque',
                status: addVariation(diskBase, 15) > 90 ? 'critical' : 
                       addVariation(diskBase, 15) > 80 ? 'warning' : 'normal',
                trend: showTrends ? {
                    direction: Math.random() > 0.5 ? 'up' : 'down',
                    value: Math.round((Math.random() - 0.5) * 10),
                    period: '24h'
                } : null
            },
            network: {
                value: Math.round(addVariation(networkBase, 40)),
                max: 100,
                unit: '%',
                description: 'Bande passante réseau',
                status: addVariation(networkBase, 40) > 95 ? 'critical' : 
                       addVariation(networkBase, 40) > 80 ? 'warning' : 'normal',
                trend: showTrends ? {
                    direction: Math.random() > 0.5 ? 'up' : 'down',
                    value: Math.round((Math.random() - 0.5) * 25),
                    period: '1h'
                } : null
            },
            responseTime: {
                value: Math.round(addVariation(200, 300)),
                max: 1000,
                unit: 'ms',
                description: 'Temps de réponse moyen',
                status: addVariation(200, 300) > 800 ? 'critical' : 
                       addVariation(200, 300) > 500 ? 'warning' : 'normal',
                trend: showTrends ? {
                    direction: Math.random() > 0.5 ? 'up' : 'down',
                    value: Math.round((Math.random() - 0.5) * 50),
                    period: '1h'
                } : null
            },
            throughput: {
                value: Math.round(addVariation(500, 400)),
                max: 1000,
                unit: 'req/s',
                description: 'Débit requêtes',
                status: addVariation(500, 400) < 200 ? 'critical' : 
                       addVariation(500, 400) < 300 ? 'warning' : 'normal',
                trend: showTrends ? {
                    direction: Math.random() > 0.5 ? 'up' : 'down',
                    value: Math.round((Math.random() - 0.5) * 30),
                    period: '1h'
                } : null
            },
            connections: {
                value: Math.round(addVariation(200, 200)),
                max: 500,
                unit: '',
                description: 'Connexions actives',
                status: addVariation(200, 200) > 450 ? 'critical' : 
                       addVariation(200, 200) > 350 ? 'warning' : 'normal',
                trend: showTrends ? {
                    direction: Math.random() > 0.5 ? 'up' : 'down',
                    value: Math.round((Math.random() - 0.5) * 20),
                    period: '1h'
                } : null
            },
            uptime: {
                value: 28.5,
                max: 30,
                unit: 'j',
                description: 'Disponibilité système',
                status: 'normal',
                trend: showTrends ? {
                    direction: 'up',
                    value: 2.3,
                    period: '30j'
                } : null
            }
        };
    }, [showTrends]);
    
    // Mise à jour des métriques
    const fetchMetrics = useCallback(async () => {
        setLoading(true);
        
        if (isLive) {
            // Simulation de délai réseau court en temps réel
            await new Promise(resolve => setTimeout(resolve, 200));
        } else {
            // Délai plus long en mode pause
            await new Promise(resolve => setTimeout(resolve, 800));
        }
        
        const newMetrics = generateMetrics();
        setMetrics(newMetrics);
        setLastUpdate(new Date());
        setLoading(false);
    }, [generateMetrics, isLive]);
    
    // Initialisation et mise à jour automatique
    useEffect(() => {
        fetchMetrics();
        
        if (autoRefresh && isLive) {
            const interval = setInterval(fetchMetrics, refreshInterval);
            return () => clearInterval(interval);
        }
    }, [fetchMetrics, autoRefresh, refreshInterval, isLive]);
    
    // Calculs de métriques globales
    const overallScore = useMemo(() => {
        const values = Object.values(metrics).map(m => m.value / m.max * 100);
        const average = values.reduce((sum, val) => sum + val, 0) / values.length;
        return Math.round(average);
    }, [metrics]);
    
    const healthStatus = useMemo(() => {
        if (overallScore >= 90) return 'excellent';
        if (overallScore >= 70) return 'good';
        if (overallScore >= 50) return 'warning';
        return 'critical';
    }, [overallScore]);
    
    // Gestionnaires d'événements
    const handleToggleLive = () => {
        setIsLive(!isLive);
    };
    
    const handleRefresh = () => {
        fetchMetrics();
    };
    
    // Icônes par type de métrique
    const getMetricIcon = (key) => {
        switch (key) {
            case 'cpu': return Cpu;
            case 'memory': return Memory;
            case 'disk': return Storage;
            case 'network': return NetworkCheck;
            case 'responseTime': return Timer;
            case 'throughput': return DataUsage;
            case 'connections': return Timeline;
            case 'uptime': return Speed;
            default: return Speed;
        }
    };
    
    return (
        <Paper elevation={2} sx={{ p: 2, height, borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
            {/* En-tête */}
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
                    <Speed color="primary" />
                    Métriques de Performance
                    <Chip 
                        size="small" 
                        label={isLive ? "LIVE" : "PAUSE"}
                        color={isLive ? "success" : "default"}
                        sx={{ 
                            fontWeight: 700,
                            animation: isLive ? 'pulse 2s infinite' : 'none',
                            '@keyframes pulse': {
                                '0%': { opacity: 1 },
                                '50%': { opacity: 0.5 },
                                '100%': { opacity: 1 }
                            }
                        }}
                    />
                </Typography>
                
                <Box display="flex" alignItems="center" gap={1}>
                    <FormControlLabel
                        control={
                            <Switch 
                                checked={isLive} 
                                onChange={handleToggleLive}
                                size="small"
                                color="success"
                            />
                        }
                        label=""
                        sx={{ m: 0 }}
                    />
                    <Tooltip title={isLive ? "Pause" : "Reprendre"}>
                        <IconButton size="small" onClick={handleToggleLive}>
                            {isLive ? <Wifi /> : <WifiOff />}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Actualiser">
                        <IconButton size="small" onClick={handleRefresh} disabled={loading}>
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
            
            {/* Score global */}
            <Box mb={2} p={2} sx={{ 
                background: `linear-gradient(135deg, ${theme.palette.primary.main}10, ${theme.palette.primary.main}05)`,
                borderRadius: 2,
                border: `1px solid ${theme.palette.primary.main}20`
            }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={4}>
                        <CircularMetric
                            value={overallScore}
                            max={100}
                            size={80}
                            color="primary"
                            showValue={true}
                            unit="%"
                            label="Score global"
                            animated={true}
                        />
                    </Grid>
                    <Grid item xs={8}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                            Score Global: {overallScore}/100
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            État du système: 
                            <Chip 
                                size="small" 
                                label={healthStatus}
                                color={
                                    healthStatus === 'excellent' ? 'success' :
                                    healthStatus === 'good' ? 'info' :
                                    healthStatus === 'warning' ? 'warning' : 'error'
                                }
                                sx={{ ml: 1, fontWeight: 600 }}
                            />
                        </Typography>
                        {lastUpdate && (
                            <Typography variant="caption" color="text.secondary">
                                Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
                            </Typography>
                        )}
                    </Grid>
                </Grid>
            </Box>
            
            {/* Grille des métriques */}
            <Box flex={1} overflow="auto">
                <Grid container spacing={2}>
                    {Object.entries(metrics).map(([key, metric], index) => (
                        <Grid item xs={12} sm={6} md={4} key={key}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                                <MetricCard
                                    title={key.charAt(0).toUpperCase() + key.slice(1)}
                                    value={metric.value}
                                    unit={metric.unit}
                                    max={metric.max}
                                    icon={getMetricIcon(key)}
                                    color="primary"
                                    description={metric.description}
                                    status={metric.status}
                                    trend={metric.trend}
                                />
                            </motion.div>
                        </Grid>
                    ))}
                </Grid>
            </Box>
            
            {/* Informations détaillées */}
            {showDetails && (
                <>
                    <Divider sx={{ my: 2 }} />
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>
                            Alertes et recommandations
                        </Typography>
                        
                        {Object.entries(metrics)
                            .filter(([_, metric]) => metric.status === 'critical' || metric.status === 'warning')
                            .map(([key, metric]) => (
                                <Box 
                                    key={key} 
                                    display="flex" 
                                    alignItems="center" 
                                    justifyContent="space-between" 
                                    p={1} 
                                    sx={{ 
                                        bgcolor: metric.status === 'critical' ? 'error.main' : 'warning.main',
                                        bgcolor: `${metric.status === 'critical' ? theme.palette.error.main : theme.palette.warning.main}15`,
                                        borderRadius: 1,
                                        mb: 0.5
                                    }}
                                >
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {metric.description}
                                    </Typography>
                                    <Chip
                                        size="small"
                                        label={metric.status}
                                        color={metric.status === 'critical' ? 'error' : 'warning'}
                                        variant="outlined"
                                    />
                                </Box>
                            ))
                        }
                        
                        {Object.values(metrics).every(m => m.status === 'normal') && (
                            <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                                ✅ Toutes les métriques sont dans les valeurs normales
                            </Typography>
                        )}
                    </Box>
                </>
            )}
        </Paper>
    );
};

export default React.memo(PerformanceMetricsWidget);