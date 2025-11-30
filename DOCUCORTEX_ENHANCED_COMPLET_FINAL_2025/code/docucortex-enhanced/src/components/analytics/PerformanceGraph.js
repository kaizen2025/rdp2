// src/components/analytics/PerformanceGraph.js - Graphique de Performance et KPIs
import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
    Box,
    Typography,
    IconButton,
    Tooltip,
    Menu,
    MenuItem,
    FormControl,
    Select,
    InputLabel,
    Chip,
    Paper,
    useTheme,
    useMediaQuery,
    Slider,
    Card,
    CardContent,
    Grid,
    Divider,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Alert,
    LinearProgress,
    CircularProgress,
    Button
} from '@mui/material';
import {
    ShowChart,
    TrendingUp,
    TrendingDown,
    Equalizer,
    Speed,
    Timer,
    Assessment,
    Download,
    FilterList,
    ZoomIn,
    ZoomOut,
    Refresh,
    ExpandMore,
    PlayArrow,
    Pause,
    Warning,
    CheckCircle,
    Error,
    Info
} from '@mui/icons-material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    ComposedChart,
    ReferenceLine,
    ReferenceDot,
    Brush,
    Cell
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const PerformanceGraph = ({
    data = {},
    height = 350,
    filters = {},
    settings = {},
    title = "Performance",
    showControls = true,
    enableExport = true,
    showDetails = true,
    realTimeUpdates = false
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const chartRef = useRef(null);
    
    // États du composant
    const [chartType, setChartType] = useState('line'); // line, area, bar, composed
    const [selectedMetric, setSelectedMetric] = useState('utilizationRate');
    const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d, 1y
    const [showBaseline, setShowBaseline] = useState(false);
    const [showTargets, setShowTargets] = useState(true);
    const [showAlerts, setShowAlerts] = useState(true);
    const [smoothing, setSmoothing] = useState(0); // 0, 3, 7 (jours de moyenne mobile)
    const [thresholds, setThresholds] = useState({
        warning: 70,
        critical: 90
    });
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [hoveredPoint, setHoveredPoint] = useState(null);
    const [selectedPoints, setSelectedPoints] = useState([]);
    
    // Menu states
    const [menuAnchor, setMenuAnchor] = useState(null);
    
    // Métriques de performance disponibles
    const metrics = [
        { key: 'utilizationRate', label: 'Taux d\'utilisation', unit: '%', target: 80, color: theme.palette.primary.main },
        { key: 'avgLoanDuration', label: 'Durée moyenne prêts', unit: 'jours', target: 7, color: theme.palette.secondary.main },
        { key: 'returnRate', label: 'Taux de retour', unit: '%', target: 95, color: theme.palette.success.main },
        { key: 'overdueRate', label: 'Taux de retard', unit: '%', target: 5, color: theme.palette.error.main }
    ];
    
    // Periods disponibles
    const periods = [
        { key: '7d', label: '7 jours' },
        { key: '30d', label: '30 jours' },
        { key: '90d', label: '90 jours' },
        { key: '1y', label: '1 an' }
    ];
    
    // Traitement des données
    const processedData = useMemo(() => {
        if (!data.timeline || !data.timeline.length) return { points: [], stats: null, alerts: [] };
        
        const points = [...data.timeline];
        
        // Appliquer le lissage si nécessaire
        if (smoothing > 0) {
            applySmoothing(points, smoothing);
        }
        
        // Calculer les métriques dérivées
        const enhancedPoints = points.map((point, index) => ({
            ...point,
            performanceScore: calculatePerformanceScore(point),
            trend: calculateTrend(points, index),
            alertLevel: getAlertLevel(point, thresholds),
            normalizedValue: normalizeValue(point[selectedMetric])
        }));
        
        const stats = calculateStatistics(enhancedPoints);
        const alerts = generateAlerts(enhancedPoints, thresholds);
        
        return {
            points: enhancedPoints,
            stats,
            alerts,
            targets: calculateTargets(enhancedPoints),
            baseline: calculateBaseline(enhancedPoints)
        };
    }, [data, selectedMetric, smoothing, thresholds]);
    
    // Application du lissage (moyenne mobile)
    const applySmoothing = useCallback((points, windowSize) => {
        for (let i = windowSize; i < points.length; i++) {
            const window = points.slice(i - windowSize, i + 1);
            const avg = window.reduce((sum, p) => sum + (p[selectedMetric] || 0), 0) / (windowSize + 1);
            points[i] = { ...points[i], [`${selectedMetric}_smoothed`]: avg };
        }
    }, [selectedMetric]);
    
    // Calcul du score de performance global
    const calculatePerformanceScore = useCallback((point) => {
        const weights = {
            utilizationRate: 0.3,
            avgLoanDuration: 0.2,
            returnRate: 0.3,
            overdueRate: 0.2
        };
        
        let score = 0;
        let totalWeight = 0;
        
        Object.entries(weights).forEach(([metric, weight]) => {
            if (point[metric] !== undefined) {
                let normalizedValue;
                
                if (metric === 'overdueRate') {
                    // Plus le taux de retard est bas, mieux c'est
                    normalizedValue = Math.max(0, 100 - point[metric]);
                } else if (metric === 'avgLoanDuration') {
                    // Durée optimale entre 3 et 14 jours
                    const optimal = 7;
                    normalizedValue = Math.max(0, 100 - Math.abs(point[metric] - optimal) * 10);
                } else {
                    normalizedValue = point[metric];
                }
                
                score += normalizedValue * weight;
                totalWeight += weight;
            }
        });
        
        return totalWeight > 0 ? score / totalWeight : 0;
    }, []);
    
    // Calcul de la tendance
    const calculateTrend = useCallback((points, index) => {
        if (index < 3) return 'stable';
        
        const recent = points.slice(index - 3, index + 1);
        const values = recent.map(p => p[selectedMetric] || 0);
        
        if (values.length < 2) return 'stable';
        
        const slope = (values[values.length - 1] - values[0]) / (values.length - 1);
        
        if (slope > 0.5) return 'up';
        if (slope < -0.5) return 'down';
        return 'stable';
    }, [selectedMetric]);
    
    // Détermination du niveau d'alerte
    const getAlertLevel = useCallback((point, thresholds) => {
        const value = point[selectedMetric] || 0;
        
        // Logique spéciale selon la métrique
        if (selectedMetric === 'overdueRate') {
            if (value > thresholds.critical) return 'critical';
            if (value > thresholds.warning) return 'warning';
            return 'normal';
        } else if (selectedMetric === 'returnRate') {
            if (value < thresholds.critical) return 'critical';
            if (value < thresholds.warning) return 'warning';
            return 'normal';
        } else {
            // Pour utilizationRate et avgLoanDuration
            if (selectedMetric === 'utilizationRate') {
                if (value < 30 || value > 95) return 'critical';
                if (value < 50 || value > 85) return 'warning';
                return 'normal';
            }
        }
        
        return 'normal';
    }, [selectedMetric, thresholds]);
    
    // Normalisation des valeurs
    const normalizeValue = useCallback((value) => {
        if (value === undefined || value === null) return 0;
        
        switch (selectedMetric) {
            case 'utilizationRate':
                return Math.max(0, Math.min(100, value));
            case 'returnRate':
                return Math.max(0, Math.min(100, value));
            case 'overdueRate':
                return Math.max(0, Math.min(100, value));
            case 'avgLoanDuration':
                return Math.max(0, Math.min(30, value)); // Max 30 jours
            default:
                return value;
        }
    }, [selectedMetric]);
    
    // Calcul des statistiques
    const calculateStatistics = useCallback((points) => {
        if (!points.length) return null;
        
        const values = points.map(p => p[selectedMetric] || 0);
        const total = values.reduce((sum, val) => sum + val, 0);
        const avg = total / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        
        // Calcul des percentiles
        const sorted = [...values].sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const median = sorted[Math.floor(sorted.length / 2)];
        
        // Calcul de la volatilité (écart-type)
        const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
        const volatility = Math.sqrt(variance);
        
        // Tendances
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
        const overallTrend = secondAvg > firstAvg ? 'improving' : secondAvg < firstAvg ? 'declining' : 'stable';
        
        return {
            total,
            avg,
            min,
            max,
            q1,
            q3,
            median,
            volatility,
            overallTrend,
            trendStrength: Math.abs((secondAvg - firstAvg) / firstAvg) * 100
        };
    }, [selectedMetric]);
    
    // Génération des alertes
    const generateAlerts = useCallback((points, thresholds) => {
        const alerts = [];
        
        points.forEach((point, index) => {
            const alertLevel = point.alertLevel;
            const value = point[selectedMetric];
            
            if (alertLevel === 'critical') {
                alerts.push({
                    type: 'critical',
                    message: `Valeur critique détectée: ${value.toFixed(1)}${getMetricUnit()}`,
                    timestamp: point.date,
                    index,
                    value
                });
            } else if (alertLevel === 'warning') {
                alerts.push({
                    type: 'warning',
                    message: `Attention: ${value.toFixed(1)}${getMetricUnit()}`,
                    timestamp: point.date,
                    index,
                    value
                });
            }
        });
        
        return alerts.slice(-10); // Garder les 10 dernières alertes
    }, [selectedMetric, thresholds]);
    
    // Calcul des cibles
    const calculateTargets = useCallback((points) => {
        const metric = metrics.find(m => m.key === selectedMetric);
        if (!metric) return [];
        
        return points.map(point => ({
            ...point,
            target: metric.target,
            targetMet: (point[selectedMetric] || 0) >= metric.target
        }));
    }, [selectedMetric]);
    
    // Calcul de la baseline
    const calculateBaseline = useCallback((points) => {
        const recent = points.slice(-7); // 7 derniers points
        if (recent.length === 0) return 0;
        
        return recent.reduce((sum, p) => sum + (p[selectedMetric] || 0), 0) / recent.length;
    }, [selectedMetric]);
    
    // Obtenir l'unité de la métrique
    const getMetricUnit = useCallback(() => {
        const metric = metrics.find(m => m.key === selectedMetric);
        return metric ? metric.unit : '';
    }, [selectedMetric]);
    
    // Gestionnaires d'événements
    const handlePointHover = useCallback((data) => {
        setHoveredPoint(data);
    }, []);
    
    const handlePointClick = useCallback((data) => {
        const pointKey = `${data.date}-${data[selectedMetric]}`;
        setSelectedPoints(prev => {
            const exists = prev.find(p => `${p.date}-${p[selectedMetric]}` === pointKey);
            if (exists) {
                return prev.filter(p => `${p.date}-${p[selectedMetric]}` !== pointKey);
            } else {
                return [...prev, data];
            }
        });
    }, [selectedMetric]);
    
    const handleExport = useCallback(() => {
        const csvContent = [
            ['Date', ...metrics.map(m => m.label), 'Score Performance', 'Niveau Alerte'].join(','),
            ...processedData.points.map(point => [
                point.date,
                ...metrics.map(m => point[m.key] || 0),
                point.performanceScore.toFixed(2),
                point.alertLevel
            ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `performance_${selectedMetric}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [processedData, selectedMetric]);
    
    const handleMenuOpen = useCallback((event) => {
        setMenuAnchor(event.currentTarget);
    }, []);
    
    const handleMenuClose = useCallback(() => {
        setMenuAnchor(null);
    }, []);
    
    const handlePlayPause = useCallback(() => {
        setIsPlaying(!isPlaying);
        
        if (!isPlaying) {
            const interval = setInterval(() => {
                setCurrentFrame(prev => {
                    const next = prev + 1;
                    if (next >= processedData.points.length) {
                        clearInterval(interval);
                        setIsPlaying(false);
                        return 0;
                    }
                    return next;
                });
            }, 500);
        }
    }, [isPlaying, processedData.points.length]);
    
    // Tooltip personnalisé
    const CustomTooltip = useCallback(({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const metric = metrics.find(m => m.key === selectedMetric);
            
            return (
                <Paper sx={{ p: 2, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        {format(parseISO(data.date), 'dd MMM yyyy', { locale: fr })}
                    </Typography>
                    
                    <Box display="flex" alignItems="center" gap={1}>
                        <Box 
                            sx={{ 
                                width: 12, 
                                height: 12, 
                                bgcolor: metric?.color || theme.palette.primary.main, 
                                borderRadius: '50%' 
                            }} 
                        />
                        <Typography variant="body2">
                            {metric?.label}: {data[selectedMetric]?.toFixed(2) || 0}{getMetricUnit()}
                        </Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary">
                        Score: {data.performanceScore?.toFixed(1) || 0}
                    </Typography>
                    
                    <Chip
                        size="small"
                        label={data.alertLevel}
                        color={
                            data.alertLevel === 'critical' ? 'error' :
                            data.alertLevel === 'warning' ? 'warning' :
                            'success'
                        }
                        icon={
                            data.alertLevel === 'critical' ? <Error /> :
                            data.alertLevel === 'warning' ? <Warning /> :
                            <CheckCircle />
                        }
                    />
                </Paper>
            );
        }
        return null;
    }, [selectedMetric, metrics, theme, getMetricUnit]);
    
    // Composant des KPIs
    const KPICards = useCallback(() => {
        if (!processedData.stats) return null;
        
        const stats = processedData.stats;
        const currentMetric = metrics.find(m => m.key === selectedMetric);
        
        return (
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="subtitle2">
                        Indicateurs de Performance
                    </Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2}>
                        <Grid item xs={6} sm={3}>
                            <Card variant="outlined" size="small">
                                <CardContent sx={{ py: 1 }}>
                                    <Typography variant="h6" color="primary">
                                        {stats.avg.toFixed(1)}{getMetricUnit()}
                                    </Typography>
                                    <Typography variant="caption">
                                        Moyenne
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Card variant="outlined" size="small">
                                <CardContent sx={{ py: 1 }}>
                                    <Typography variant="h6" color="secondary">
                                        {stats.median.toFixed(1)}{getMetricUnit()}
                                    </Typography>
                                    <Typography variant="caption">
                                        Médiane
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Card variant="outlined" size="small">
                                <CardContent sx={{ py: 1 }}>
                                    <Typography variant="h6" color="success.main">
                                        {stats.max.toFixed(1)}{getMetricUnit()}
                                    </Typography>
                                    <Typography variant="caption">
                                        Maximum
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Card variant="outlined" size="small">
                                <CardContent sx={{ py: 1 }}>
                                    <Typography variant="h6" color="warning.main">
                                        {stats.volatility.toFixed(1)}
                                    </Typography>
                                    <Typography variant="caption">
                                        Volatilité
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>
                            Tendance générale
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                            {stats.overallTrend === 'improving' && <TrendingUp color="success" />}
                            {stats.overallTrend === 'declining' && <TrendingDown color="error" />}
                            {stats.overallTrend === 'stable' && <Equalizer color="info" />}
                            <Chip
                                label={
                                    stats.overallTrend === 'improving' ? 'En amélioration' :
                                    stats.overallTrend === 'declining' ? 'En dégradation' :
                                    'Stable'
                                }
                                color={
                                    stats.overallTrend === 'improving' ? 'success' :
                                    stats.overallTrend === 'declining' ? 'error' :
                                    'info'
                                }
                                size="small"
                            />
                            <Typography variant="body2" color="text.secondary">
                                ({stats.trendStrength.toFixed(1)}% de variation)
                            </Typography>
                        </Box>
                    </Box>
                </AccordionDetails>
            </Accordion>
        );
    }, [processedData.stats, selectedMetric, getMetricUnit]);
    
    // Composant des alertes
    const AlertsPanel = useCallback(() => {
        if (!processedData.alerts.length) return null;
        
        return (
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Warning color="warning" />
                        <Typography variant="subtitle2">
                            Alertes ({processedData.alerts.length})
                        </Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <Box display="flex" flexDirection="column" gap={1}>
                        {processedData.alerts.slice(-5).map((alert, index) => (
                            <Alert 
                                key={index}
                                severity={alert.type === 'critical' ? 'error' : 'warning'}
                                icon={alert.type === 'critical' ? <Error /> : <Warning />}
                                sx={{ fontSize: '0.875rem' }}
                            >
                                <Typography variant="body2">
                                    {alert.message}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {format(parseISO(alert.timestamp), 'dd MMM HH:mm', { locale: fr })}
                                </Typography>
                            </Alert>
                        ))}
                    </Box>
                </AccordionDetails>
            </Accordion>
        );
    }, [processedData.alerts]);
    
    // S'il n'y a pas de données
    if (!processedData.points.length) {
        return (
            <Box 
                height={height} 
                display="flex" 
                alignItems="center" 
                justifyContent="center"
                flexDirection="column"
                gap={2}
            >
                <ShowChart sx={{ fontSize: 48, color: 'text.disabled' }} />
                <Typography variant="body1" color="text.secondary">
                    Aucune donnée de performance disponible
                </Typography>
            </Box>
        );
    }
    
    // Rendu du graphique selon le type
    const renderChart = useCallback(() => {
        const metricData = processedData.points;
        const currentMetric = metrics.find(m => m.key === selectedMetric);
        
        const commonProps = {
            data: metricData,
            margin: { top: 20, right: 30, left: 20, bottom: 5 }
        };
        
        switch (chartType) {
            case 'line':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart {...commonProps}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                            <XAxis 
                                dataKey="dateFormatted"
                                stroke={theme.palette.text.secondary}
                                fontSize={12}
                            />
                            <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
                            <RechartsTooltip content={<CustomTooltip />} />
                            
                            <Line
                                type="monotone"
                                dataKey={smoothing > 0 ? `${selectedMetric}_smoothed` : selectedMetric}
                                stroke={currentMetric?.color || theme.palette.primary.main}
                                strokeWidth={3}
                                dot={(props) => {
                                    const { payload } = props;
                                    const alertColor = payload.alertLevel === 'critical' ? theme.palette.error.main :
                                                     payload.alertLevel === 'warning' ? theme.palette.warning.main :
                                                     currentMetric?.color || theme.palette.primary.main;
                                    
                                    return (
                                        <circle
                                            cx={props.cx}
                                            cy={props.cy}
                                            r={selectedPoints.find(p => p.date === payload.date) ? 6 : 4}
                                            fill={alertColor}
                                            stroke={theme.palette.background.paper}
                                            strokeWidth={2}
                                        />
                                    );
                                }}
                                activeDot={{ r: 6, stroke: theme.palette.background.paper, strokeWidth: 2 }}
                            />
                            
                            {showBaseline && (
                                <ReferenceLine 
                                    y={processedData.baseline} 
                                    stroke={theme.palette.grey[500]}
                                    strokeDasharray="5 5"
                                    label="Baseline"
                                />
                            )}
                            
                            {showTargets && (
                                <ReferenceLine 
                                    y={currentMetric?.target} 
                                    stroke={theme.palette.success.main}
                                    strokeDasharray="2 2"
                                    label="Cible"
                                />
                            )}
                            
                            <Brush dataKey="dateFormatted" height={30} stroke={theme.palette.primary.main} />
                        </LineChart>
                    </ResponsiveContainer>
                );
                
            case 'area':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart {...commonProps}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                            <XAxis dataKey="dateFormatted" stroke={theme.palette.text.secondary} fontSize={12} />
                            <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
                            <RechartsTooltip content={<CustomTooltip />} />
                            
                            <Area
                                type="monotone"
                                dataKey={smoothing > 0 ? `${selectedMetric}_smoothed` : selectedMetric}
                                stroke={currentMetric?.color || theme.palette.primary.main}
                                fill={currentMetric?.color || theme.palette.primary.main}
                                fillOpacity={0.3}
                                strokeWidth={2}
                            />
                            
                            {showBaseline && (
                                <ReferenceLine y={processedData.baseline} stroke={theme.palette.grey[500]} strokeDasharray="5 5" />
                            )}
                            
                            {showTargets && (
                                <ReferenceLine y={currentMetric?.target} stroke={theme.palette.success.main} strokeDasharray="2 2" />
                            )}
                        </AreaChart>
                    </ResponsiveContainer>
                );
                
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart {...commonProps}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                            <XAxis dataKey="dateFormatted" stroke={theme.palette.text.secondary} fontSize={12} />
                            <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
                            <RechartsTooltip content={<CustomTooltip />} />
                            
                            <Bar dataKey={selectedMetric} fill={currentMetric?.color || theme.palette.primary.main} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                );
                
            default:
                return null;
        }
    }, [chartType, processedData.points, selectedMetric, smoothing, showBaseline, showTargets, currentFrame, theme, selectedPoints, CustomTooltip]);
    
    return (
        <Box>
            {/* En-tête avec contrôles */}
            {showControls && (
                <Box 
                    display="flex" 
                    alignItems="center" 
                    justifyContent="space-between" 
                    mb={2}
                    flexWrap="wrap"
                    gap={1}
                >
                    <Box display="flex" alignItems="center" gap={1}>
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                            <InputLabel>Métrique</InputLabel>
                            <Select
                                value={selectedMetric}
                                onChange={(e) => setSelectedMetric(e.target.value)}
                                label="Métrique"
                            >
                                {metrics.map(metric => (
                                    <MenuItem key={metric.key} value={metric.key}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Box 
                                                sx={{ 
                                                    width: 12, 
                                                    height: 12, 
                                                    bgcolor: metric.color, 
                                                    borderRadius: '50%' 
                                                }} 
                                            />
                                            {metric.label}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        
                        <FormControl size="small" sx={{ minWidth: 100 }}>
                            <InputLabel>Période</InputLabel>
                            <Select
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                                label="Période"
                            >
                                {periods.map(period => (
                                    <MenuItem key={period.key} value={period.key}>
                                        {period.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        
                        <FormControl size="small" sx={{ minWidth: 100 }}>
                            <InputLabel>Type</InputLabel>
                            <Select
                                value={chartType}
                                onChange={(e) => setChartType(e.target.value)}
                                label="Type"
                            >
                                <MenuItem value="line">Lignes</MenuItem>
                                <MenuItem value="area">Zone</MenuItem>
                                <MenuItem value="bar">Barres</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    
                    <Box display="flex" gap={1}>
                        {realTimeUpdates && (
                            <Tooltip title={isPlaying ? "Pause" : "Play"}>
                                <IconButton 
                                    size="small" 
                                    onClick={handlePlayPause}
                                    color={isPlaying ? 'primary' : 'default'}
                                >
                                    {isPlaying ? <Pause /> : <PlayArrow />}
                                </IconButton>
                            </Tooltip>
                        )}
                        
                        <Tooltip title="Baseline">
                            <IconButton 
                                size="small" 
                                onClick={() => setShowBaseline(!showBaseline)}
                                color={showBaseline ? 'primary' : 'default'}
                            >
                                <Equalizer />
                            </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Cibles">
                            <IconButton 
                                size="small" 
                                onClick={() => setShowTargets(!showTargets)}
                                color={showTargets ? 'primary' : 'default'}
                            >
                                <Target />
                            </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Alertes">
                            <IconButton 
                                size="small" 
                                onClick={() => setShowAlerts(!showAlerts)}
                                color={showAlerts ? 'primary' : 'default'}
                            >
                                <Warning />
                            </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Options">
                            <IconButton size="small" onClick={handleMenuOpen}>
                                <FilterList />
                            </IconButton>
                        </Tooltip>
                        
                        {enableExport && (
                            <Tooltip title="Exporter">
                                <IconButton size="small" onClick={handleExport}>
                                    <Download />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                </Box>
            )}
            
            {/* Indicateurs de performance en temps réel */}
            <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                {metrics.map(metric => {
                    const currentValue = processedData.points[processedData.points.length - 1]?.[metric.key] || 0;
                    const target = metric.target;
                    const percentage = (currentValue / target) * 100;
                    
                    return (
                        <Card 
                            key={metric.key}
                            variant="outlined" 
                            sx={{ 
                                minWidth: 120,
                                borderColor: selectedMetric === metric.key ? metric.color : 'divider',
                                borderWidth: selectedMetric === metric.key ? 2 : 1
                            }}
                        >
                            <CardContent sx={{ py: 1.5 }}>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            {metric.label}
                                        </Typography>
                                        <Typography variant="h6" fontWeight="bold">
                                            {currentValue.toFixed(1)}{metric.unit}
                                        </Typography>
                                    </Box>
                                    <Box textAlign="right">
                                        <Typography variant="caption" color="text.secondary">
                                            Cible: {target}{metric.unit}
                                        </Typography>
                                        <Typography variant="body2" color={
                                            percentage >= 100 ? 'success.main' :
                                            percentage >= 80 ? 'warning.main' :
                                            'error.main'
                                        }>
                                            {percentage.toFixed(0)}%
                                        </Typography>
                                    </Box>
                                </Box>
                                <LinearProgress 
                                    variant="determinate" 
                                    value={Math.min(percentage, 100)}
                                    sx={{ mt: 1, height: 6, borderRadius: 3 }}
                                    color={
                                        percentage >= 100 ? 'success' :
                                        percentage >= 80 ? 'warning' :
                                        'error'
                                    }
                                />
                            </CardContent>
                        </Card>
                    );
                })}
            </Box>
            
            {/* Graphique principal */}
            <Box height={showDetails ? height * 0.5 : height * 0.7}>
                {renderChart()}
            </Box>
            
            {/* Panneau des KPIs */}
            <KPICards />
            
            {/* Panneau des alertes */}
            <AlertsPanel />
            
            {/* Menu des options */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => { 
                    setSmoothing(smoothing === 0 ? 3 : smoothing === 3 ? 7 : 0); 
                    handleMenuClose(); 
                }}>
                    Lissage: {smoothing === 0 ? 'Aucun' : `${smoothing} jours`}
                </MenuItem>
                <MenuItem onClick={() => { 
                    setShowAlerts(!showAlerts); 
                    handleMenuClose(); 
                }}>
                    {showAlerts ? 'Masquer' : 'Afficher'} les alertes
                </MenuItem>
            </Menu>
            
            {/* Contrôles dans le menu */}
            {menuAnchor && (
                <Box sx={{ p: 2, minWidth: 250 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Seuils d'alerte
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" gutterBottom>
                            Attention: {thresholds.warning}%
                        </Typography>
                        <Slider
                            value={thresholds.warning}
                            onChange={(_, value) => setThresholds(prev => ({ ...prev, warning: value }))}
                            min={10}
                            max={90}
                            step={5}
                            valueLabelDisplay="auto"
                        />
                    </Box>
                    
                    <Box>
                        <Typography variant="body2" gutterBottom>
                            Critique: {thresholds.critical}%
                        </Typography>
                        <Slider
                            value={thresholds.critical}
                            onChange={(_, value) => setThresholds(prev => ({ ...prev, critical: value }))}
                            min={thresholds.warning + 5}
                            max={100}
                            step={5}
                            valueLabelDisplay="auto"
                        />
                    </Box>
                </Box>
            )}
        </Box>
    );
};

// Icon manquante - définition locale
const Target = ({ sx }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={sx}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
);

const Search = ({ sx }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={sx}>
        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
    </svg>
);

export default PerformanceGraph;