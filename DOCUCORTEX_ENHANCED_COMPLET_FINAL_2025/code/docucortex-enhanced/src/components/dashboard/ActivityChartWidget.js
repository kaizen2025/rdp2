// src/components/dashboard/ActivityChartWidget.js - Widget Graphique d'Activité Temps Réel
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    IconButton,
    Tooltip,
    useTheme,
    useMediaQuery,
    Chip,
    Grid
} from '@mui/material';
import {
    TrendingUp,
    ShowChart,
    Refresh,
    Timeline,
    BarChart,
    Analytics,
    Timeline as TimelineIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
// Note: Dans un projet réel, vous utiliseriez Chart.js ou Recharts
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

// Composant de graphique simulée pour la démonstration
const MockChart = ({ 
    data, 
    type = 'line', 
    height = 300,
    color = '#2196f3',
    animated = true 
}) => {
    const canvasRef = useRef(null);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !data) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth;
        const canvasHeight = canvas.height = height;
        
        // Configuration du graphique
        const padding = { top: 20, right: 20, bottom: 30, left: 40 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = canvasHeight - padding.top - padding.bottom;
        
        // Calculs des échelles
        const maxValue = Math.max(...data.map(d => d.value));
        const minValue = Math.min(...data.map(d => d.value));
        const valueRange = maxValue - minValue || 1;
        
        // Nettoyage du canvas
        ctx.clearRect(0, 0, width, canvasHeight);
        
        // Styles
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2;
        
        if (type === 'line') {
            // Dessin de la ligne
            ctx.beginPath();
            data.forEach((point, index) => {
                const x = padding.left + (index / (data.length - 1)) * chartWidth;
                const y = padding.top + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    if (animated) {
                        // Animation simple
                        const progress = Date.now() % 1000 / 1000;
                        const currentX = padding.left + (index * progress) / (data.length - 1) * chartWidth;
                        if (currentX >= x) {
                            ctx.lineTo(x, y);
                        } else {
                            ctx.lineTo(currentX, y);
                        }
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
            });
            ctx.stroke();
            
            // Points
            data.forEach((point, index) => {
                const x = padding.left + (index / (data.length - 1)) * chartWidth;
                const y = padding.top + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
                
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, 2 * Math.PI);
                ctx.fill();
            });
            
        } else if (type === 'bar') {
            // Dessin des barres
            const barWidth = chartWidth / data.length * 0.8;
            const barSpacing = chartWidth / data.length * 0.2;
            
            data.forEach((point, index) => {
                const x = padding.left + index * (chartWidth / data.length) + barSpacing / 2;
                const barHeight = ((point.value - minValue) / valueRange) * chartHeight;
                const y = padding.top + chartHeight - barHeight;
                
                ctx.fillStyle = color + '80';
                ctx.fillRect(x, y, barWidth, barHeight);
                
                ctx.strokeStyle = color;
                ctx.strokeRect(x, y, barWidth, barHeight);
            });
        }
        
        // Grid et axes (simplifiés)
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.font = '12px Arial';
        ctx.fillStyle = '#666';
        
        // Grille horizontale
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (i / 4) * chartHeight;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();
            
            // Labels
            const value = maxValue - (i / 4) * valueRange;
            ctx.fillText(value.toFixed(0), 5, y + 4);
        }
        
        // Labels X
        const step = Math.max(1, Math.floor(data.length / 6));
        data.forEach((point, index) => {
            if (index % step === 0 || index === data.length - 1) {
                const x = padding.left + (index / (data.length - 1)) * chartWidth;
                ctx.save();
                ctx.translate(x, canvasHeight - 5);
                ctx.rotate(-Math.PI / 6);
                ctx.fillText(point.label, 0, 0);
                ctx.restore();
            }
        });
        
    }, [data, type, height, color, animated]);
    
    return (
        <canvas
            ref={canvasRef}
            style={{
                width: '100%',
                height: `${height}px`,
                display: 'block'
            }}
        />
    );
};

const ActivityChartWidget = ({
    height = 400,
    defaultPeriod = '24h',
    chartTypes = ['line', 'bar'],
    showControls = true,
    realTimeUpdates = true
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
    // États locaux
    const [period, setPeriod] = useState(defaultPeriod);
    const [chartType, setChartType] = useState('line');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [isLive, setIsLive] = useState(true);
    
    // Génération de données d'activité simulées
    const generateActivityData = useCallback((timePeriod) => {
        const now = new Date();
        const dataPoints = [];
        let interval, duration;
        
        switch (timePeriod) {
            case '1h':
                interval = 5 * 60 * 1000; // 5 minutes
                duration = 60 * 60 * 1000; // 1 heure
                break;
            case '24h':
                interval = 60 * 60 * 1000; // 1 heure
                duration = 24 * 60 * 60 * 1000; // 24 heures
                break;
            case '7d':
                interval = 24 * 60 * 60 * 1000; // 1 jour
                duration = 7 * 24 * 60 * 60 * 1000; // 7 jours
                break;
            case '30d':
                interval = 24 * 60 * 60 * 1000; // 1 jour
                duration = 30 * 24 * 60 * 60 * 1000; // 30 jours
                break;
            default:
                interval = 60 * 60 * 1000;
                duration = 24 * 60 * 60 * 1000;
        }
        
        const pointCount = Math.ceil(duration / interval);
        
        for (let i = 0; i < pointCount; i++) {
            const timestamp = now.getTime() - (duration - i * interval);
            const date = new Date(timestamp);
            
            // Simulation d'une activité réaliste
            let baseActivity = 50;
            
            // Variation selon l'heure (pic entre 9h-17h)
            const hour = date.getHours();
            if (hour >= 9 && hour <= 17) {
                baseActivity += 30;
            } else if (hour >= 6 && hour <= 8) {
                baseActivity += 15;
            } else if (hour >= 18 && hour <= 22) {
                baseActivity += 20;
            }
            
            // Variation selon le jour (moins le weekend)
            const dayOfWeek = date.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                baseActivity *= 0.4;
            }
            
            // Variation aléatoire
            const randomFactor = 0.7 + Math.random() * 0.6;
            const activity = Math.max(0, Math.round(baseActivity * randomFactor));
            
            dataPoints.push({
                timestamp,
                value: activity,
                label: timePeriod === '1h' 
                    ? date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                    : timePeriod === '24h'
                    ? date.toLocaleTimeString('fr-FR', { hour: '2-digit' })
                    : date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
            });
        }
        
        return dataPoints;
    }, []);
    
    // Mise à jour des données
    const fetchActivityData = useCallback(async () => {
        setLoading(true);
        
        // Simulation de délai réseau
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const newData = generateActivityData(period);
        setData(newData);
        setLastUpdate(new Date());
        setLoading(false);
    }, [period, generateActivityData]);
    
    // Initialisation et mise à jour automatique
    useEffect(() => {
        fetchActivityData();
    }, [fetchActivityData]);
    
    // Mise à jour temps réel
    useEffect(() => {
        if (!realTimeUpdates || !isLive) return;
        
        const interval = setInterval(() => {
            // Ajout d'un nouveau point de données
            setData(prev => {
                const newData = [...prev];
                const now = new Date();
                const lastValue = prev.length > 0 ? prev[prev.length - 1].value : 50;
                
                // Variation autour de la dernière valeur
                const variation = (Math.random() - 0.5) * 10;
                const newValue = Math.max(0, lastValue + variation);
                
                newData.push({
                    timestamp: now.getTime(),
                    value: Math.round(newValue),
                    label: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                });
                
                // Garder seulement les derniers points selon la période
                const maxPoints = period === '1h' ? 12 : period === '24h' ? 24 : 7;
                return newData.slice(-maxPoints);
            });
        }, 5000); // Mise à jour toutes les 5 secondes
        
        return () => clearInterval(interval);
    }, [realTimeUpdates, isLive, period]);
    
    // Calculs de statistiques
    const stats = useMemo(() => {
        if (data.length === 0) return null;
        
        const values = data.map(d => d.value);
        const total = values.reduce((sum, val) => sum + val, 0);
        const average = total / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        const current = values[values.length - 1];
        const previous = values[values.length - 2] || current;
        const change = ((current - previous) / previous) * 100;
        
        return {
            total,
            average: Math.round(average),
            max,
            min,
            current,
            change: Math.round(change * 10) / 10
        };
    }, [data]);
    
    // Gestionnaires d'événements
    const handlePeriodChange = (event) => {
        setPeriod(event.target.value);
    };
    
    const handleChartTypeChange = (event) => {
        setChartType(event.target.value);
    };
    
    const handleRefresh = () => {
        fetchActivityData();
    };
    
    const toggleLiveMode = () => {
        setIsLive(!isLive);
    };
    
    return (
        <Paper elevation={2} sx={{ p: 2, height, borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
            {/* En-tête avec contrôles */}
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
                    <TimelineIcon color="primary" />
                    Activité en Temps Réel
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
                    <Tooltip title={isLive ? "Pause" : "Reprendre"}>
                        <IconButton 
                            size="small" 
                            onClick={toggleLiveMode}
                            color={isLive ? "success" : "default"}
                        >
                            <ShowChart />
                        </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Actualiser">
                        <IconButton size="small" onClick={handleRefresh} disabled={loading}>
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
            
            {/* Contrôles de configuration */}
            {showControls && (
                <Grid container spacing={2} mb={2}>
                    <Grid item xs={6} sm={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Période</InputLabel>
                            <Select
                                value={period}
                                onChange={handlePeriodChange}
                                label="Période"
                            >
                                <MenuItem value="1h">1 Heure</MenuItem>
                                <MenuItem value="24h">24 Heures</MenuItem>
                                <MenuItem value="7d">7 Jours</MenuItem>
                                <MenuItem value="30d">30 Jours</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    
                    <Grid item xs={6} sm={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Type</InputLabel>
                            <Select
                                value={chartType}
                                onChange={handleChartTypeChange}
                                label="Type"
                            >
                                {chartTypes.map(type => (
                                    <MenuItem key={type} value={type}>
                                        {type === 'line' ? 'Ligne' : 'Barres'}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            )}
            
            {/* Graphique principal */}
            <Box flex={1} position="relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${period}-${chartType}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ height: '100%' }}
                    >
                        {loading ? (
                            <Box 
                                display="flex" 
                                alignItems="center" 
                                justifyContent="center" 
                                height="100%"
                            >
                                <Typography color="text.secondary">Chargement...</Typography>
                            </Box>
                        ) : data.length > 0 ? (
                            <MockChart
                                data={data}
                                type={chartType}
                                height={height - 180}
                                color={theme.palette.primary.main}
                                animated={isLive}
                            />
                        ) : (
                            <Box 
                                display="flex" 
                                alignItems="center" 
                                justifyContent="center" 
                                height="100%"
                            >
                                <Typography color="text.secondary">
                                    Aucune donnée disponible
                                </Typography>
                            </Box>
                        )}
                    </motion.div>
                </AnimatePresence>
            </Box>
            
            {/* Statistiques et informations */}
            {stats && (
                <Grid container spacing={2} mt={1}>
                    <Grid item xs={6} sm={3}>
                        <Box textAlign="center">
                            <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                                {stats.current}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Actuel
                            </Typography>
                        </Box>
                    </Grid>
                    
                    <Grid item xs={6} sm={3}>
                        <Box textAlign="center">
                            <Typography variant="h6" color="info.main" sx={{ fontWeight: 700 }}>
                                {stats.average}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Moyenne
                            </Typography>
                        </Box>
                    </Grid>
                    
                    <Grid item xs={6} sm={3}>
                        <Box textAlign="center">
                            <Typography variant="h6" color="success.main" sx={{ fontWeight: 700 }}>
                                {stats.max}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Maximum
                            </Typography>
                        </Box>
                    </Grid>
                    
                    <Grid item xs={6} sm={3}>
                        <Box textAlign="center">
                            <Typography 
                                variant="h6" 
                                sx={{ 
                                    fontWeight: 700,
                                    color: stats.change >= 0 ? 'success.main' : 'error.main'
                                }}
                            >
                                {stats.change >= 0 ? '+' : ''}{stats.change}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Évolution
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            )}
            
            {/* Informations de mise à jour */}
            {lastUpdate && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                    Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
                </Typography>
            )}
        </Paper>
    );
};

export default React.memo(ActivityChartWidget);