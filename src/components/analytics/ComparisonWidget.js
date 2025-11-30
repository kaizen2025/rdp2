// src/components/analytics/ComparisonWidget.js - Widget de Comparaison de Périodes
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
    Button,
    ButtonGroup,
    Badge,
    Alert
} from '@mui/material';
import {
    CompareArrows,
    TrendingUp,
    TrendingDown,
    Timeline,
    BarChart,
    ShowChart,
    Download,
    FilterList,
    SwapHoriz,
    DateRange,
    Assessment,
    Analytics,
    PlayArrow,
    Pause,
    Refresh,
    ExpandMore,
    Warning,
    CheckCircle,
    Error,
    Info,
    ArrowUpward,
    ArrowDownward,
    Remove
} from '@mui/icons-material';
import {
    ComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    ReferenceLine,
    Legend,
    Brush
} from 'recharts';
import { format, parseISO, subDays, subMonths, subYears, isAfter, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';

const ComparisonWidget = ({
    data = {},
    height = 350,
    filters = {},
    settings = {},
    title = "Comparaison de Périodes",
    showControls = true,
    enableExport = true,
    showDetails = true
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const chartRef = useRef(null);
    
    // États du composant
    const [comparisonMode, setComparisonMode] = useState('period'); // period, year_over_year, month_over_month
    const [primaryPeriod, setPrimaryPeriod] = useState('current'); // current, previous
    const [comparisonType, setComparisonType] = useState('overlaid'); // overlaid, side_by_side, difference
    const [selectedMetrics, setSelectedMetrics] = useState(['loans', 'returns']);
    const [timeRange, setTimeRange] = useState('30d');
    const [showPercentage, setShowPercentage] = useState(true);
    const [showAbsolute, setShowAbsolute] = useState(true);
    const [showGrowth, setShowGrowth] = useState(true);
    const [normalizeData, setNormalizeData] = useState(false);
    const [hoveredPoint, setHoveredPoint] = useState(null);
    const [selectedPeriod, setSelectedPeriod] = useState(null);
    
    // Menu states
    const [menuAnchor, setMenuAnchor] = useState(null);
    
    // Métriques disponibles
    const metrics = [
        { key: 'loans', label: 'Nouveaux prêts', color: theme.palette.primary.main, icon: TrendingUp },
        { key: 'returns', label: 'Retours', color: theme.palette.success.main, icon: TrendingDown },
        { key: 'active', label: 'Prêts actifs', color: theme.palette.warning.main, icon: Timeline },
        { key: 'revenue', label: 'Revenus', color: theme.palette.secondary.main, icon: ShowChart }
    ];
    
    // Types de période
    const periodTypes = [
        { key: '7d', label: '7 jours', days: 7 },
        { key: '30d', label: '30 jours', days: 30 },
        { key: '90d', label: '90 jours', days: 90 },
        { key: '1y', label: '1 an', days: 365 }
    ];
    
    // Calcul des données de comparaison
    const comparisonData = useMemo(() => {
        if (!data.timeline || !data.timeline.length) {
            return { 
                primary: [], 
                comparison: [], 
                combined: [], 
                stats: null, 
                insights: [] 
            };
        }
        
        const now = new Date();
        const period = periodTypes.find(p => p.key === timeRange);
        const days = period?.days || 30;
        
        // Déterminer les périodes à comparer
        const { primaryPeriod, comparisonPeriod } = getComparisonPeriods(now, days, comparisonMode);
        
        // Filtrer et traiter les données
        const primaryData = filterDataByPeriod(data.timeline, primaryPeriod);
        const comparisonData = filterDataByPeriod(data.timeline, comparisonPeriod);
        
        // Aligner les données sur la même structure temporelle
        const alignedPrimary = alignDataToTemplate(primaryData, days);
        const alignedComparison = alignDataToTemplate(comparisonData, days);
        
        // Combiner les données pour l'affichage
        const combinedData = combineComparisonData(alignedPrimary, alignedComparison);
        
        // Calculer les statistiques
        const stats = calculateComparisonStats(alignedPrimary, alignedComparison);
        const insights = generateInsights(alignedPrimary, alignedComparison, stats);
        
        return {
            primary: alignedPrimary,
            comparison: alignedComparison,
            combined: combinedData,
            stats,
            insights,
            periods: { primaryPeriod, comparisonPeriod }
        };
    }, [data, comparisonMode, timeRange, normalizeData]);
    
    // Détermination des périodes de comparaison
    const getComparisonPeriods = useCallback((currentDate, days, mode) => {
        const primaryEnd = new Date(currentDate);
        const primaryStart = subDays(primaryEnd, days);
        
        let comparisonStart, comparisonEnd;
        
        switch (mode) {
            case 'year_over_year':
                comparisonEnd = subYears(primaryEnd, 1);
                comparisonStart = subYears(primaryStart, 1);
                break;
            case 'month_over_month':
                comparisonEnd = subMonths(primaryEnd, 1);
                comparisonStart = subMonths(primaryStart, 1);
                break;
            case 'period':
            default:
                comparisonEnd = subDays(primaryStart, 1);
                comparisonStart = subDays(comparisonEnd, days);
                break;
        }
        
        return {
            primaryPeriod: { start: primaryStart, end: primaryEnd },
            comparisonPeriod: { start: comparisonStart, end: comparisonEnd }
        };
    }, []);
    
    // Filtrage des données par période
    const filterDataByPeriod = useCallback((data, period) => {
        return data.filter(item => {
            const itemDate = parseISO(item.date);
            return isAfter(itemDate, period.start) && isBefore(itemDate, period.end) || 
                   itemDate.getTime() === period.start.getTime() || 
                   itemDate.getTime() === period.end.getTime();
        });
    }, []);
    
    // Alignement des données sur un template temporel
    const alignDataToTemplate = useCallback((data, days) => {
        const template = [];
        const dataMap = new Map(data.map(item => [item.date, item]));
        
        for (let i = days - 1; i >= 0; i--) {
            const date = subDays(new Date(), i);
            const dateStr = format(date, 'yyyy-MM-dd');
            
            const existing = dataMap.get(dateStr) || {
                date: dateStr,
                loans: 0,
                returns: 0,
                active: 0,
                revenue: 0
            };
            
            template.push({
                ...existing,
                dayIndex: days - 1 - i,
                dateFormatted: format(date, 'dd/MM', { locale: fr }),
                displayDate: format(date, 'dd MMM yyyy', { locale: fr })
            });
        }
        
        return template;
    }, []);
    
    // Combinaison des données de comparaison
    const combineComparisonData = useCallback((primary, comparison) => {
        return primary.map((primaryItem, index) => {
            const comparisonItem = comparison[index] || {};
            
            const combined = {
                ...primaryItem,
                comparison: { ...comparisonItem },
                index
            };
            
            // Calcul des métriques de comparaison
            selectedMetrics.forEach(metric => {
                const primaryValue = primaryItem[metric] || 0;
                const comparisonValue = comparisonItem[metric] || 0;
                
                combined[`${metric}_absolute_diff`] = primaryValue - comparisonValue;
                combined[`${metric}_percentage_diff`] = comparisonValue > 0 
                    ? ((primaryValue - comparisonValue) / comparisonValue) * 100 
                    : 0;
                combined[`${metric}_ratio`] = comparisonValue > 0 
                    ? primaryValue / comparisonValue 
                    : 0;
            });
            
            return combined;
        });
    }, [selectedMetrics]);
    
    // Calcul des statistiques de comparaison
    const calculateComparisonStats = useCallback((primary, comparison) => {
        const stats = {};
        
        selectedMetrics.forEach(metric => {
            const primaryTotal = primary.reduce((sum, item) => sum + (item[metric] || 0), 0);
            const comparisonTotal = comparison.reduce((sum, item) => sum + (item[metric] || 0), 0);
            
            const absoluteDiff = primaryTotal - comparisonTotal;
            const percentageDiff = comparisonTotal > 0 
                ? ((primaryTotal - comparisonTotal) / comparisonTotal) * 100 
                : 0;
            
            stats[metric] = {
                primary: primaryTotal,
                comparison: comparisonTotal,
                absoluteDiff,
                percentageDiff,
                ratio: comparisonTotal > 0 ? primaryTotal / comparisonTotal : 0,
                improvement: percentageDiff > 0,
                trend: absoluteDiff > 0 ? 'up' : absoluteDiff < 0 ? 'down' : 'stable'
            };
        });
        
        // Calcul global
        const globalPrimary = Object.keys(stats).reduce((sum, metric) => sum + stats[metric].primary, 0);
        const globalComparison = Object.keys(stats).reduce((sum, metric) => sum + stats[metric].comparison, 0);
        const globalDiff = globalPrimary - globalComparison;
        const globalPercentageDiff = globalComparison > 0 
            ? ((globalPrimary - globalComparison) / globalComparison) * 100 
            : 0;
        
        return {
            ...stats,
            global: {
                primary: globalPrimary,
                comparison: globalComparison,
                absoluteDiff: globalDiff,
                percentageDiff: globalPercentageDiff,
                improvement: globalDiff > 0
            }
        };
    }, [selectedMetrics]);
    
    // Génération des insights
    const generateInsights = useCallback((primary, comparison, stats) => {
        const insights = [];
        
        // Insights par métrique
        selectedMetrics.forEach(metric => {
            const metricStats = stats[metric];
            const metricConfig = metrics.find(m => m.key === metric);
            
            if (Math.abs(metricStats.percentageDiff) > 10) {
                insights.push({
                    type: metricStats.improvement ? 'positive' : 'negative',
                    title: `${metricConfig?.label}`,
                    message: `${metricStats.improvement ? 'Augmentation' : 'Diminution'} de ${Math.abs(metricStats.percentageDiff).toFixed(1)}% par rapport à la période précédente`,
                    value: `${metricStats.percentageDiff > 0 ? '+' : ''}${metricStats.percentageDiff.toFixed(1)}%`,
                    metric
                });
            }
        });
        
        // Insight global
        const globalStats = stats.global;
        if (Math.abs(globalStats.percentageDiff) > 5) {
            insights.unshift({
                type: globalStats.improvement ? 'positive' : 'negative',
                title: 'Performance Globale',
                message: `${globalStats.improvement ? 'Amélioration' : 'Régression'} globale de ${Math.abs(globalStats.percentageDiff).toFixed(1)}%`,
                value: `${globalStats.percentageDiff > 0 ? '+' : ''}${globalStats.percentageDiff.toFixed(1)}%`,
                metric: 'global'
            });
        }
        
        return insights.slice(0, 5); // Limiter à 5 insights max
    }, [selectedMetrics, metrics]);
    
    // Gestionnaires d'événements
    const handlePointHover = useCallback((data) => {
        setHoveredPoint(data);
    }, []);
    
    const handleExport = useCallback(() => {
        const csvContent = [
            ['Date', ...selectedMetrics.map(m => `${m}_primary`), ...selectedMetrics.map(m => `${m}_comparison`), 
             ...selectedMetrics.map(m => `${m}_difference`), ...selectedMetrics.map(m => `${m}_percentage`)].join(','),
            ...comparisonData.combined.map(item => [
                item.date,
                ...selectedMetrics.map(m => item[m] || 0),
                ...selectedMetrics.map(m => item.comparison[m] || 0),
                ...selectedMetrics.map(m => item[`${m}_absolute_diff`] || 0),
                ...selectedMetrics.map(m => item[`${m}_percentage_diff`]?.toFixed(2) || 0)
            ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `comparison_${timeRange}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [comparisonData, selectedMetrics, timeRange]);
    
    const handleMenuOpen = useCallback((event) => {
        setMenuAnchor(event.currentTarget);
    }, []);
    
    const handleMenuClose = useCallback(() => {
        setMenuAnchor(null);
    }, []);
    
    // Tooltip personnalisé
    const CustomTooltip = useCallback(({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            
            return (
                <Paper sx={{ p: 2, bgcolor: 'background.paper', border: 1, borderColor: 'divider', minWidth: 250 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        {data.displayDate}
                    </Typography>
                    
                    <Box display="flex" flexDirection="column" gap={0.5}>
                        {selectedMetrics.map(metric => {
                            const metricConfig = metrics.find(m => m.key === metric);
                            const primary = data[metric] || 0;
                            const comparison = data.comparison[metric] || 0;
                            const diff = data[`${metric}_absolute_diff`] || 0;
                            const percentage = data[`${metric}_percentage_diff`] || 0;
                            
                            return (
                                <Box key={metric} display="flex" alignItems="center" justifyContent="space-between">
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Box 
                                            sx={{ 
                                                width: 12, 
                                                height: 12, 
                                                bgcolor: metricConfig?.color || theme.palette.primary.main, 
                                                borderRadius: '50%' 
                                            }} 
                                        />
                                        <Typography variant="body2">
                                            {metricConfig?.label}
                                        </Typography>
                                    </Box>
                                    <Box textAlign="right">
                                        <Typography variant="body2" fontWeight="bold">
                                            {primary}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            vs {comparison} ({percentage > 0 ? '+' : ''}{percentage.toFixed(1)}%)
                                        </Typography>
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                </Paper>
            );
        }
        return null;
    }, [selectedMetrics, metrics, theme]);
    
    // Composant des insights
    const InsightsPanel = useCallback(() => {
        if (!comparisonData.insights.length) return null;
        
        return (
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Assessment />
                        <Typography variant="subtitle2">
                            Insights ({comparisonData.insights.length})
                        </Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <Box display="flex" flexDirection="column" gap={1}>
                        {comparisonData.insights.map((insight, index) => (
                            <Alert
                                key={index}
                                severity={
                                    insight.type === 'positive' ? 'success' :
                                    insight.type === 'negative' ? 'warning' :
                                    'info'
                                }
                                icon={
                                    insight.type === 'positive' ? <CheckCircle /> :
                                    insight.type === 'negative' ? <Warning /> :
                                    <Info />
                                }
                                sx={{ fontSize: '0.875rem' }}
                            >
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Box>
                                        <Typography variant="body2" fontWeight="bold">
                                            {insight.title}
                                        </Typography>
                                        <Typography variant="body2">
                                            {insight.message}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={insight.value}
                                        color={
                                            insight.type === 'positive' ? 'success' :
                                            insight.type === 'negative' ? 'warning' :
                                            'info'
                                        }
                                        size="small"
                                        icon={
                                            insight.value.includes('+') ? <ArrowUpward /> :
                                            insight.value.includes('-') ? <ArrowDownward /> :
                                            <Remove />
                                        }
                                    />
                                </Box>
                            </Alert>
                        ))}
                    </Box>
                </AccordionDetails>
            </Accordion>
        );
    }, [comparisonData.insights]);
    
    // Composant des statistiques de comparaison
    const ComparisonStats = useCallback(() => {
        if (!comparisonData.stats) return null;
        
        return (
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="subtitle2">
                        Statistiques de Comparaison
                    </Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2}>
                        {selectedMetrics.map(metric => {
                            const metricConfig = metrics.find(m => m.key === metric);
                            const stats = comparisonData.stats[metric];
                            
                            return (
                                <Grid item xs={12} sm={6} md={3} key={metric}>
                                    <Card variant="outlined">
                                        <CardContent sx={{ py: 1.5 }}>
                                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                <metricConfig.icon sx={{ fontSize: 16, color: metricConfig.color }} />
                                                <Typography variant="subtitle2" noWrap>
                                                    {metricConfig.label}
                                                </Typography>
                                            </Box>
                                            
                                            <Box display="flex" justifyContent="space-between" mb={1}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Période actuelle
                                                </Typography>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {stats.primary}
                                                </Typography>
                                            </Box>
                                            
                                            <Box display="flex" justifyContent="space-between" mb={1}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Période comparée
                                                </Typography>
                                                <Typography variant="body2">
                                                    {stats.comparison}
                                                </Typography>
                                            </Box>
                                            
                                            <Box display="flex" justifyContent="space-between">
                                                <Typography variant="caption" color="text.secondary">
                                                    Évolution
                                                </Typography>
                                                <Box display="flex" alignItems="center" gap={0.5}>
                                                    {stats.trend === 'up' && <ArrowUpward sx={{ fontSize: 16, color: 'success.main' }} />}
                                                    {stats.trend === 'down' && <ArrowDownward sx={{ fontSize: 16, color: 'error.main' }} />}
                                                    {stats.trend === 'stable' && <Remove sx={{ fontSize: 16, color: 'grey.500' }} />}
                                                    <Typography 
                                                        variant="body2" 
                                                        fontWeight="bold"
                                                        color={
                                                            stats.trend === 'up' ? 'success.main' :
                                                            stats.trend === 'down' ? 'error.main' :
                                                            'text.secondary'
                                                        }
                                                    >
                                                        {stats.percentageDiff > 0 ? '+' : ''}{stats.percentageDiff.toFixed(1)}%
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                    
                    {/* Statistique globale */}
                    <Divider sx={{ my: 2 }} />
                    <Card variant="outlined" sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                        <CardContent sx={{ py: 1.5 }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Typography variant="subtitle1" fontWeight="bold">
                                    Évolution Globale
                                </Typography>
                                <Box display="flex" alignItems="center" gap={1}>
                                    {comparisonData.stats.global.improvement ? 
                                        <TrendingUp /> : 
                                        <TrendingDown />
                                    }
                                    <Typography variant="h6" fontWeight="bold">
                                        {comparisonData.stats.global.percentageDiff > 0 ? '+' : ''}
                                        {comparisonData.stats.global.percentageDiff.toFixed(1)}%
                                    </Typography>
                                </Box>
                            </Box>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                {comparisonData.stats.global.absoluteDiff > 0 ? 
                                    `Augmentation de ${comparisonData.stats.global.absoluteDiff} unités` :
                                    `Diminution de ${Math.abs(comparisonData.stats.global.absoluteDiff)} unités`
                                }
                            </Typography>
                        </CardContent>
                    </Card>
                </AccordionDetails>
            </Accordion>
        );
    }, [comparisonData.stats, selectedMetrics, metrics]);
    
    // Rendu du graphique
    const renderChart = useCallback(() => {
        if (!comparisonData.combined.length) return null;
        
        if (comparisonType === 'side_by_side') {
            return renderSideBySideChart();
        } else {
            return renderOverlaidChart();
        }
    }, [comparisonData, comparisonType, selectedMetrics]);
    
    // Graphique superposé
    const renderOverlaidChart = useCallback(() => (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={comparisonData.combined} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis 
                    dataKey="dateFormatted"
                    stroke={theme.palette.text.secondary}
                    fontSize={12}
                />
                <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend />
                
                {/* Barres pour les données de comparaison */}
                {selectedMetrics.map(metric => {
                    const metricConfig = metrics.find(m => m.key === metric);
                    return (
                        <Bar
                            key={`comparison-${metric}`}
                            dataKey={`comparison.${metric}`}
                            fill={metricConfig?.color || theme.palette.grey[400]}
                            fillOpacity={0.3}
                            name={`${metricConfig?.label} (comparé)`}
                            radius={[2, 2, 0, 0]}
                        />
                    );
                })}
                
                {/* Lignes pour les données principales */}
                {selectedMetrics.map(metric => {
                    const metricConfig = metrics.find(m => m.key === metric);
                    return (
                        <Line
                            key={`primary-${metric}`}
                            type="monotone"
                            dataKey={metric}
                            stroke={metricConfig?.color || theme.palette.primary.main}
                            strokeWidth={3}
                            dot={{ r: 4, fill: theme.palette.background.paper, strokeWidth: 2 }}
                            activeDot={{ r: 6, stroke: theme.palette.background.paper, strokeWidth: 2 }}
                            name={metricConfig?.label}
                        />
                    );
                })}
                
                <Brush dataKey="dateFormatted" height={30} stroke={theme.palette.primary.main} />
            </ComposedChart>
        </ResponsiveContainer>
    ), [comparisonData, selectedMetrics, metrics, theme, CustomTooltip]);
    
    // Graphique côte à côte
    const renderSideBySideChart = useCallback(() => (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={comparisonData.combined} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis 
                    dataKey="dateFormatted"
                    stroke={theme.palette.text.secondary}
                    fontSize={12}
                />
                <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend />
                
                {/* Affichage côte à côte avec bars groupées */}
                {selectedMetrics.map(metric => {
                    const metricConfig = metrics.find(m => m.key === metric);
                    return (
                        <React.Fragment key={metric}>
                            <Bar
                                dataKey={metric}
                                fill={metricConfig?.color || theme.palette.primary.main}
                                name={`${metricConfig?.label} (actuel)`}
                                radius={[2, 2, 0, 0]}
                            />
                            <Bar
                                dataKey={`comparison.${metric}`}
                                fill={metricConfig?.color || theme.palette.primary.main}
                                fillOpacity={0.5}
                                name={`${metricConfig?.label} (comparé)`}
                                radius={[2, 2, 0, 0]}
                            />
                        </React.Fragment>
                    );
                })}
                
                <Brush dataKey="dateFormatted" height={30} stroke={theme.palette.primary.main} />
            </ComposedChart>
        </ResponsiveContainer>
    ), [comparisonData, selectedMetrics, metrics, theme, CustomTooltip]);
    
    // S'il n'y a pas de données
    if (!comparisonData.combined.length) {
        return (
            <Box 
                height={height} 
                display="flex" 
                alignItems="center" 
                justifyContent="center"
                flexDirection="column"
                gap={2}
            >
                <CompareArrows sx={{ fontSize: 48, color: 'text.disabled' }} />
                <Typography variant="body1" color="text.secondary">
                    Aucune donnée de comparaison disponible
                </Typography>
            </Box>
        );
    }
    
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
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>Mode</InputLabel>
                            <Select
                                value={comparisonMode}
                                onChange={(e) => setComparisonMode(e.target.value)}
                                label="Mode"
                            >
                                <MenuItem value="period">Période précédente</MenuItem>
                                <MenuItem value="month_over_month">Mois précédent</MenuItem>
                                <MenuItem value="year_over_year">Année précédente</MenuItem>
                            </Select>
                        </FormControl>
                        
                        <FormControl size="small" sx={{ minWidth: 100 }}>
                            <InputLabel>Période</InputLabel>
                            <Select
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                                label="Période"
                            >
                                {periodTypes.map(period => (
                                    <MenuItem key={period.key} value={period.key}>
                                        {period.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                            <InputLabel>Type d'affichage</InputLabel>
                            <Select
                                value={comparisonType}
                                onChange={(e) => setComparisonType(e.target.value)}
                                label="Type d'affichage"
                            >
                                <MenuItem value="overlaid">Superposé</MenuItem>
                                <MenuItem value="side_by_side">Côte à côte</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    
                    <Box display="flex" gap={1}>
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
            
            {/* Sélecteur de métriques */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                    Métriques à comparer
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                    {metrics.map(metric => (
                        <Chip
                            key={metric.key}
                            label={metric.label}
                            clickable
                            color={selectedMetrics.includes(metric.key) ? 'primary' : 'default'}
                            variant={selectedMetrics.includes(metric.key) ? 'filled' : 'outlined'}
                            onClick={() => {
                                setSelectedMetrics(prev => 
                                    prev.includes(metric.key)
                                        ? prev.filter(m => m !== metric.key)
                                        : [...prev, metric.key]
                                );
                            }}
                            icon={<metric.icon />}
                            sx={{ 
                                borderColor: metric.color,
                                '&.MuiChip-filled': {
                                    bgcolor: metric.color,
                                    color: 'white'
                                }
                            }}
                        />
                    ))}
                </Box>
            </Paper>
            
            {/* Graphique principal */}
            <Box height={showDetails ? height * 0.5 : height * 0.7}>
                {renderChart()}
            </Box>
            
            {/* Panneau des statistiques */}
            <ComparisonStats />
            
            {/* Panneau des insights */}
            <InsightsPanel />
            
            {/* Menu des options */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => { 
                    setShowPercentage(!showPercentage); 
                    handleMenuClose(); 
                }}>
                    {showPercentage ? 'Masquer' : 'Afficher'} les pourcentages
                </MenuItem>
                <MenuItem onClick={() => { 
                    setShowAbsolute(!showAbsolute); 
                    handleMenuClose(); 
                }}>
                    {showAbsolute ? 'Masquer' : 'Afficher'} les valeurs absolues
                </MenuItem>
                <MenuItem onClick={() => { 
                    setNormalizeData(!normalizeData); 
                    handleMenuClose(); 
                }}>
                    {normalizeData ? 'Désactiver' : 'Activer'} la normalisation
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default ComparisonWidget;