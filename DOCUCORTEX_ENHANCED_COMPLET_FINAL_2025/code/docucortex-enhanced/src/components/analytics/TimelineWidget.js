// src/components/analytics/TimelineWidget.js - Widget Timeline Interactive
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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
    CircularProgress,
    Alert
} from '@mui/material';
import {
    ZoomIn,
    ZoomOut,
    Refresh,
    Download,
    TrendingUp,
    TrendingDown,
    Timeline,
    DateRange,
    ShowChart,
    Visibility,
    VisibilityOff,
    FilterList
} from '@mui/icons-material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    ReferenceLine,
    Area,
    AreaChart,
    Brush,
    ReferenceDot
} from 'recharts';
import { format, parseISO, subDays, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

const TimelineWidget = ({
    data = [],
    height = 350,
    filters = {},
    settings = {},
    title = "Timeline Prêts",
    showControls = true,
    enableZoom = true,
    enableBrush = true,
    enableExport = true,
    realTimeUpdates = false
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const chartRef = useRef(null);
    
    // États du composant
    const [selectedMetric, setSelectedMetric] = useState('loans');
    const [chartType, setChartType] = useState('line'); // line, area
    const [showGrid, setShowGrid] = useState(true);
    const [showTrend, setShowTrend] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [brushDomain, setBrushDomain] = useState(null);
    const [hoveredPoint, setHoveredPoint] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // Menu states
    const [menuAnchor, setMenuAnchor] = useState(null);
    
    // Métriques disponibles
    const metrics = [
        { key: 'loans', label: 'Nouveaux prêts', color: theme.palette.primary.main, icon: TrendingUp },
        { key: 'returns', label: 'Retours', color: theme.palette.success.main, icon: TrendingDown },
        { key: 'active', label: 'Prêts actifs', color: theme.palette.warning.main, icon: Timeline },
        { key: 'revenue', label: 'Revenus', color: theme.palette.secondary.main, icon: ShowChart }
    ];
    
    // Traitement des données
    const processedData = useMemo(() => {
        return data.map(item => ({
            ...item,
            dateFormatted: format(parseISO(item.date), 'dd/MM', { locale: fr }),
            dateTime: new Date(item.date).getTime(),
            displayDate: format(parseISO(item.date), 'dd MMM yyyy', { locale: fr })
        }));
    }, [data]);
    
    // Calcul des statistiques
    const stats = useMemo(() => {
        if (!processedData.length) return null;
        
        const total = processedData.reduce((acc, item) => ({
            loans: acc.loans + (item.loans || 0),
            returns: acc.returns + (item.returns || 0),
            active: acc.active + (item.active || 0),
            revenue: acc.revenue + (item.revenue || 0)
        }), { loans: 0, returns: 0, active: 0, revenue: 0 });
        
        const avg = {
            loans: total.loans / processedData.length,
            returns: total.returns / processedData.length,
            active: total.active / processedData.length,
            revenue: total.revenue / processedData.length
        };
        
        // Calcul des tendances
        const trends = {};
        metrics.forEach(metric => {
            if (processedData.length >= 2) {
                const recent = processedData.slice(-7).reduce((sum, item) => sum + (item[metric.key] || 0), 0) / 7;
                const previous = processedData.slice(-14, -7).reduce((sum, item) => sum + (item[metric.key] || 0), 0) / 7;
                
                trends[metric.key] = {
                    current: recent,
                    previous,
                    change: previous > 0 ? ((recent - previous) / previous) * 100 : 0,
                    direction: recent > previous ? 'up' : recent < previous ? 'down' : 'stable'
                };
            }
        });
        
        return { total, avg, trends };
    }, [processedData]);
    
    // Ligne de tendance
    const trendLine = useMemo(() => {
        if (!showTrend || !processedData.length) return null;
        
        const values = processedData.map(item => item[selectedMetric] || 0);
        const n = values.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = values.reduce((sum, val) => sum + val, 0);
        const sumXY = values.reduce((sum, val, index) => sum + (index * val), 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        return processedData.map((item, index) => ({
            ...item,
            trend: slope * index + intercept
        }));
    }, [processedData, selectedMetric, showTrend]);
    
    // Gestionnaires d'événements
    const handleZoomIn = useCallback(() => {
        setZoomLevel(prev => Math.min(prev * 1.5, 5));
    }, []);
    
    const handleZoomOut = useCallback(() => {
        setZoomLevel(prev => Math.max(prev / 1.5, 1));
    }, []);
    
    const handleResetZoom = useCallback(() => {
        setZoomLevel(1);
        setBrushDomain(null);
    }, []);
    
    const handleBrushChange = useCallback((domain) => {
        setBrushDomain(domain);
    }, []);
    
    const handlePointHover = useCallback((data) => {
        setHoveredPoint(data);
    }, []);
    
    const handleExport = useCallback(() => {
        const csvContent = [
            ['Date', ...metrics.map(m => m.label)].join(','),
            ...processedData.map(item => [
                item.displayDate,
                ...metrics.map(m => item[m.key] || 0)
            ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `timeline_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [processedData]);
    
    const handleMenuOpen = useCallback((event) => {
        setMenuAnchor(event.currentTarget);
    }, []);
    
    const handleMenuClose = useCallback(() => {
        setMenuAnchor(null);
    }, []);
    
    // Tooltip personnalisé
    const CustomTooltip = useCallback(({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = processedData.find(item => item.date === label);
            if (!data) return null;
            
            return (
                <Paper sx={{ p: 2, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        {data.displayDate}
                    </Typography>
                    {payload.map((entry, index) => (
                        <Box key={index} display="flex" alignItems="center" gap={1}>
                            <Box 
                                sx={{ 
                                    width: 12, 
                                    height: 12, 
                                    bgcolor: entry.color, 
                                    borderRadius: '50%' 
                                }} 
                            />
                            <Typography variant="body2">
                                {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
                            </Typography>
                        </Box>
                    ))}
                </Paper>
            );
        }
        return null;
    }, [processedData]);
    
    // Composant des statistiques rapides
    const QuickStats = useCallback(() => {
        if (!stats) return null;
        
        const currentStat = stats.trends[selectedMetric];
        const isPositive = currentStat?.direction === 'up';
        
        return (
            <Box display="flex" gap={2} flexWrap="wrap" sx={{ mb: 2 }}>
                <Chip
                    label={`Total: ${stats.total[selectedMetric]}`}
                    color="primary"
                    variant="outlined"
                    size="small"
                />
                <Chip
                    label={`Moy: ${stats.avg[selectedMetric].toFixed(1)}`}
                    color="secondary"
                    variant="outlined"
                    size="small"
                />
                {currentStat && (
                    <Chip
                        label={`Trend: ${currentStat.change > 0 ? '+' : ''}${currentStat.change.toFixed(1)}%`}
                        color={isPositive ? 'success' : 'error'}
                        icon={isPositive ? <TrendingUp /> : <TrendingDown />}
                        variant="filled"
                        size="small"
                    />
                )}
            </Box>
        );
    }, [stats, selectedMetric]);
    
    // S'il n'y a pas de données
    if (!processedData.length) {
        return (
            <Box 
                height={height} 
                display="flex" 
                alignItems="center" 
                justifyContent="center"
                flexDirection="column"
                gap={2}
            >
                <Timeline sx={{ fontSize: 48, color: 'text.disabled' }} />
                <Typography variant="body1" color="text.secondary">
                    Aucune donnée de timeline disponible
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
                            <InputLabel>Métrique</InputLabel>
                            <Select
                                value={selectedMetric}
                                onChange={(e) => setSelectedMetric(e.target.value)}
                                label="Métrique"
                            >
                                {metrics.map(metric => (
                                    <MenuItem key={metric.key} value={metric.key}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <metric.icon sx={{ fontSize: 16 }} />
                                            {metric.label}
                                        </Box>
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
                            </Select>
                        </FormControl>
                    </Box>
                    
                    <Box display="flex" gap={1}>
                        <Tooltip title="Grille">
                            <IconButton 
                                size="small" 
                                onClick={() => setShowGrid(!showGrid)}
                                color={showGrid ? 'primary' : 'default'}
                            >
                                <FilterList />
                            </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Tendance">
                            <IconButton 
                                size="small" 
                                onClick={() => setShowTrend(!showTrend)}
                                color={showTrend ? 'primary' : 'default'}
                            >
                                <TrendingUp />
                            </IconButton>
                        </Tooltip>
                        
                        {enableZoom && (
                            <>
                                <Tooltip title="Zoom avant">
                                    <IconButton size="small" onClick={handleZoomIn}>
                                        <ZoomIn />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Zoom arrière">
                                    <IconButton size="small" onClick={handleZoomOut}>
                                        <ZoomOut />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Réinitialiser zoom">
                                    <IconButton size="small" onClick={handleResetZoom}>
                                        <Refresh />
                                    </IconButton>
                                </Tooltip>
                            </>
                        )}
                        
                        <Tooltip title="Options">
                            <IconButton size="small" onClick={handleMenuOpen}>
                                <DateRange />
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
            
            {/* Statistiques rapides */}
            <QuickStats />
            
            {/* Graphique principal */}
            <Box height={height - (showControls ? 120 : 60)} position="relative">
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'line' ? (
                        <LineChart
                            data={processedData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            ref={chartRef}
                        >
                            <CartesianGrid 
                                strokeDasharray="3 3" 
                                stroke={theme.palette.divider}
                                display={showGrid}
                            />
                            <XAxis 
                                dataKey="dateFormatted"
                                stroke={theme.palette.text.secondary}
                                fontSize={12}
                                tick={{ fill: theme.palette.text.secondary }}
                            />
                            <YAxis 
                                stroke={theme.palette.text.secondary}
                                fontSize={12}
                                tick={{ fill: theme.palette.text.secondary }}
                            />
                            <RechartsTooltip content={<CustomTooltip />} />
                            
                            <Line
                                type="monotone"
                                dataKey={selectedMetric}
                                stroke={metrics.find(m => m.key === selectedMetric)?.color || theme.palette.primary.main}
                                strokeWidth={2}
                                dot={{ fill: theme.palette.background.paper, strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, stroke: theme.palette.background.paper, strokeWidth: 2 }}
                                connectNulls={false}
                            />
                            
                            {showTrend && trendLine && (
                                <Line
                                    type="monotone"
                                    dataKey="trend"
                                    stroke={theme.palette.grey[500]}
                                    strokeWidth={1}
                                    strokeDasharray="5 5"
                                    dot={false}
                                    connectNulls={false}
                                />
                            )}
                            
                            {enableBrush && (
                                <Brush
                                    dataKey="dateFormatted"
                                    height={30}
                                    stroke={theme.palette.primary.main}
                                    fill={theme.palette.action.hover}
                                />
                            )}
                        </LineChart>
                    ) : (
                        <AreaChart
                            data={processedData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid 
                                strokeDasharray="3 3" 
                                stroke={theme.palette.divider}
                                display={showGrid}
                            />
                            <XAxis 
                                dataKey="dateFormatted"
                                stroke={theme.palette.text.secondary}
                                fontSize={12}
                            />
                            <YAxis 
                                stroke={theme.palette.text.secondary}
                                fontSize={12}
                            />
                            <RechartsTooltip content={<CustomTooltip />} />
                            
                            <Area
                                type="monotone"
                                dataKey={selectedMetric}
                                stroke={metrics.find(m => m.key === selectedMetric)?.color || theme.palette.primary.main}
                                fill={metrics.find(m => m.key === selectedMetric)?.color || theme.palette.primary.main}
                                fillOpacity={0.3}
                                strokeWidth={2}
                            />
                            
                            {enableBrush && (
                                <Brush
                                    dataKey="dateFormatted"
                                    height={30}
                                    stroke={theme.palette.primary.main}
                                />
                            )}
                        </AreaChart>
                    )}
                </ResponsiveContainer>
                
                {/* Point d'information au survol */}
                {hoveredPoint && (
                    <Paper
                        sx={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            p: 1,
                            bgcolor: 'background.paper',
                            border: 1,
                            borderColor: 'divider',
                            minWidth: 150
                        }}
                    >
                        <Typography variant="caption" display="block">
                            {hoveredPoint.displayDate}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                            {hoveredPoint[selectedMetric] || 0}
                        </Typography>
                    </Paper>
                )}
            </Box>
            
            {/* Menu des options */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => { setShowGrid(!showGrid); handleMenuClose(); }}>
                    {showGrid ? <VisibilityOff /> : <Visibility />}
                    {showGrid ? 'Masquer' : 'Afficher'} la grille
                </MenuItem>
                <MenuItem onClick={() => { setShowTrend(!showTrend); handleMenuClose(); }}>
                    {showTrend ? <VisibilityOff /> : <Visibility />}
                    {showTrend ? 'Masquer' : 'Afficher'} la tendance
                </MenuItem>
                <MenuItem onClick={handleResetZoom}>
                    <Refresh />
                    Réinitialiser le zoom
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default TimelineWidget;