// src/components/analytics/DistributionChart.js - Graphique de Distribution Avancé
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
    Slider,
    Card,
    CardContent,
    Grid,
    Divider,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    CircularProgress
} from '@mui/material';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    Treemap
} from 'recharts';
import {
    PieChart as PieChartIcon,
    BarChart,
    ScatterPlot,
    ShowChart,
    Download,
    FilterList,
    ViewModule,
    ViewList,
    ExpandMore,
    TrendingUp,
    Equalizer,
    Assessment
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const DistributionChart = ({
    data = {},
    height = 350,
    filters = {},
    settings = {},
    title = "Distribution",
    showControls = true,
    enableExport = true,
    showDetails = true
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const chartRef = useRef(null);
    
    // États du composant
    const [chartType, setChartType] = useState('pie'); // pie, bar, radar, treemap
    const [selectedDimension, setSelectedDimension] = useState('byStatus');
    const [showPercentages, setShowPercentages] = useState(true);
    const [showValues, setShowValues] = useState(true);
    const [maxItems, setMaxItems] = useState(10);
    const [minPercentage, setMinPercentage] = useState(0);
    const [sortBy, setSortBy] = useState('value'); // value, name
    const [hoveredSlice, setHoveredSlice] = useState(null);
    const [selectedSlice, setSelectedSlice] = useState(null);
    
    // Menu states
    const [menuAnchor, setMenuAnchor] = useState(null);
    
    // Dimensions disponibles
    const dimensions = [
        { key: 'byStatus', label: 'Par statut', color: '#8884d8' },
        { key: 'byDepartment', label: 'Par département', color: '#82ca9d' },
        { key: 'byType', label: 'Par type', color: '#ffc658' }
    ];
    
    // Types de graphiques
    const chartTypes = [
        { key: 'pie', label: 'Secteurs', icon: PieChartIcon },
        { key: 'bar', label: 'Barres', icon: BarChart },
        { key: 'radar', label: 'Radar', icon: ScatterPlot },
        { key: 'treemap', label: 'Treemap', icon: ViewModule }
    ];
    
    // Traitement des données
    const processedData = useMemo(() => {
        if (!data[selectedDimension]) return [];
        
        let items = [...data[selectedDimension]];
        
        // Tri
        if (sortBy === 'value') {
            items.sort((a, b) => b.value - a.value);
        } else {
            items.sort((a, b) => a.name.localeCompare(b.name));
        }
        
        // Limitation du nombre d'éléments
        items = items.slice(0, maxItems);
        
        // Filtrage par pourcentage minimum
        const total = items.reduce((sum, item) => sum + item.value, 0);
        items = items.filter(item => (item.value / total) * 100 >= minPercentage);
        
        // Calcul des pourcentages
        return items.map((item, index) => ({
            ...item,
            percentage: total > 0 ? (item.value / total) * 100 : 0,
            index,
            color: item.color || getColorByIndex(index)
        }));
    }, [data, selectedDimension, maxItems, minPercentage, sortBy]);
    
    // Génération des couleurs
    const getColorByIndex = useCallback((index) => {
        const colors = [
            theme.palette.primary.main,
            theme.palette.secondary.main,
            theme.palette.success.main,
            theme.palette.error.main,
            theme.palette.warning.main,
            theme.palette.info.main,
            '#9C27B0',
            '#607D8B',
            '#795548',
            '#FF5722'
        ];
        return colors[index % colors.length];
    }, [theme]);
    
    // Statistiques calculées
    const stats = useMemo(() => {
        if (!processedData.length) return null;
        
        const total = processedData.reduce((sum, item) => sum + item.value, 0);
        const max = Math.max(...processedData.map(item => item.value));
        const min = Math.min(...processedData.map(item => item.value));
        const avg = total / processedData.length;
        
        const topItem = processedData.reduce((prev, current) => 
            (prev.value > current.value) ? prev : current
        );
        
        const bottomItem = processedData.reduce((prev, current) => 
            (prev.value < current.value) ? prev : current
        );
        
        // Calcul de la distribution (coefficient de Gini simplifié)
        const sorted = [...processedData].sort((a, b) => a.value - b.value);
        let cumsum = 0;
        let giniSum = 0;
        
        sorted.forEach((item, index) => {
            cumsum += item.value;
            giniSum += cumsum;
        });
        
        const gini = total > 0 ? (2 * giniSum) / (processedData.length * total) - (processedData.length + 1) / processedData.length : 0;
        
        return {
            total,
            count: processedData.length,
            max,
            min,
            avg,
            topItem,
            bottomItem,
            gini: Math.abs(gini),
            distribution: {
                concentrated: gini > 0.5,
                balanced: gini < 0.3,
                moderately: gini >= 0.3 && gini <= 0.5
            }
        };
    }, [processedData]);
    
    // Gestionnaires d'événements
    const handleSliceHover = useCallback((data, index) => {
        setHoveredSlice(data ? { ...data, index } : null);
    }, []);
    
    const handleSliceClick = useCallback((data, index) => {
        setSelectedSlice(selectedSlice?.index === index ? null : { ...data, index });
    }, [selectedSlice]);
    
    const handleExport = useCallback(() => {
        const csvContent = [
            ['Catégorie', 'Valeur', 'Pourcentage'].join(','),
            ...processedData.map(item => [
                item.name,
                item.value,
                `${item.percentage.toFixed(2)}%`
            ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `distribution_${selectedDimension}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [processedData, selectedDimension]);
    
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
                <Paper sx={{ p: 2, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        {data.name}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Box 
                            sx={{ 
                                width: 12, 
                                height: 12, 
                                bgcolor: data.color, 
                                borderRadius: '50%' 
                            }} 
                        />
                        <Typography variant="body2">
                            Valeur: {data.value}
                        </Typography>
                    </Box>
                    {showPercentages && (
                        <Typography variant="body2" color="text.secondary">
                            {data.percentage.toFixed(2)}%
                        </Typography>
                    )}
                </Paper>
            );
        }
        return null;
    }, [showPercentages]);
    
    // Label personnalisé pour les secteurs
    const renderCustomizedLabel = useCallback(({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        if (percent < 0.05) return null; // Masquer les labels pour les petits secteurs
        
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        
        return (
            <text 
                x={x} 
                y={y} 
                fill="white" 
                textAnchor={x > cx ? 'start' : 'end'} 
                dominantBaseline="central"
                fontSize={12}
                fontWeight="bold"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    }, []);
    
    // Rendu des graphiques selon le type
    const renderChart = useCallback(() => {
        const commonProps = {
            data: processedData,
            margin: { top: 20, right: 30, left: 20, bottom: 5 }
        };
        
        switch (chartType) {
            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={processedData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={renderCustomizedLabel}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                onMouseEnter={handleSliceHover}
                                onMouseLeave={() => setHoveredSlice(null)}
                                onClick={handleSliceClick}
                            >
                                {processedData.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={entry.color}
                                        stroke={selectedSlice?.index === index ? theme.palette.primary.main : 'none'}
                                        strokeWidth={selectedSlice?.index === index ? 2 : 0}
                                    />
                                ))}
                            </Pie>
                            <RechartsTooltip content={<CustomTooltip />} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                );
                
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart {...commonProps}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                            <XAxis 
                                dataKey="name" 
                                stroke={theme.palette.text.secondary}
                                fontSize={12}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                            />
                            <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
                            <RechartsTooltip content={<CustomTooltip />} />
                            <Bar 
                                dataKey="value" 
                                fill={theme.palette.primary.main}
                                radius={[4, 4, 0, 0]}
                            />
                            <Legend />
                        </BarChart>
                    </ResponsiveContainer>
                );
                
            case 'radar':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={processedData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <PolarRadiusAxis tick={{ fontSize: 8 }} />
                            <Radar
                                name="Valeur"
                                dataKey="value"
                                stroke={theme.palette.primary.main}
                                fill={theme.palette.primary.main}
                                fillOpacity={0.3}
                                strokeWidth={2}
                            />
                            <Legend />
                        </RadarChart>
                    </ResponsiveContainer>
                );
                
            case 'treemap':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <Treemap
                            data={processedData.map(item => ({
                                name: item.name,
                                size: item.value,
                                fill: item.color
                            }))}
                            dataKey="size"
                            ratio={4/3}
                            stroke="#fff"
                            strokeWidth={2}
                        />
                    </ResponsiveContainer>
                );
                
            default:
                return null;
        }
    }, [chartType, processedData, theme, selectedSlice, renderCustomizedLabel, CustomTooltip, handleSliceHover, handleSliceClick]);
    
    // Composant des statistiques
    const StatsPanel = useCallback(() => {
        if (!showDetails || !stats) return null;
        
        return (
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="subtitle2">
                        Statistiques de Distribution
                    </Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Card variant="outlined" size="small">
                                <CardContent sx={{ py: 1 }}>
                                    <Typography variant="h6" color="primary">
                                        {stats.total}
                                    </Typography>
                                    <Typography variant="caption">
                                        Total
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6}>
                            <Card variant="outlined" size="small">
                                <CardContent sx={{ py: 1 }}>
                                    <Typography variant="h6" color="secondary">
                                        {stats.count}
                                    </Typography>
                                    <Typography variant="caption">
                                        Catégories
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6}>
                            <Card variant="outlined" size="small">
                                <CardContent sx={{ py: 1 }}>
                                    <Typography variant="h6" color="success.main">
                                        {stats.topItem?.name || '-'}
                                    </Typography>
                                    <Typography variant="caption">
                                        Plus important
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6}>
                            <Card variant="outlined" size="small">
                                <CardContent sx={{ py: 1 }}>
                                    <Typography variant="h6" color="warning.main">
                                        {(stats.gini * 100).toFixed(1)}%
                                    </Typography>
                                    <Typography variant="caption">
                                        Concentration
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>
                            Analyse de distribution
                        </Typography>
                        <Chip
                            label={
                                stats.distribution.balanced ? 'Équilibrée' :
                                stats.distribution.moderately ? 'Modérée' :
                                'Concentrée'
                            }
                            color={
                                stats.distribution.balanced ? 'success' :
                                stats.distribution.moderately ? 'warning' :
                                'error'
                            }
                            size="small"
                        />
                    </Box>
                </AccordionDetails>
            </Accordion>
        );
    }, [showDetails, stats]);
    
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
                <Assessment sx={{ fontSize: 48, color: 'text.disabled' }} />
                <Typography variant="body1" color="text.secondary">
                    Aucune donnée de distribution disponible
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
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                            <InputLabel>Dimension</InputLabel>
                            <Select
                                value={selectedDimension}
                                onChange={(e) => setSelectedDimension(e.target.value)}
                                label="Dimension"
                            >
                                {dimensions.map(dim => (
                                    <MenuItem key={dim.key} value={dim.key}>
                                        {dim.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        
                        <FormControl size="small" sx={{ minWidth: 100 }}>
                            <InputLabel>Graphique</InputLabel>
                            <Select
                                value={chartType}
                                onChange={(e) => setChartType(e.target.value)}
                                label="Graphique"
                            >
                                {chartTypes.map(type => (
                                    <MenuItem key={type.key} value={type.key}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <type.icon sx={{ fontSize: 16 }} />
                                            {type.label}
                                        </Box>
                                    </MenuItem>
                                ))}
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
            
            {/* Informations sur l'élément sélectionné */}
            {selectedSlice && (
                <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                        {selectedSlice.name}
                    </Typography>
                    <Box display="flex" gap={2} mt={1}>
                        <Typography variant="body2">
                            Valeur: {selectedSlice.value}
                        </Typography>
                        <Typography variant="body2">
                            Pourcentage: {selectedSlice.percentage.toFixed(2)}%
                        </Typography>
                    </Box>
                </Paper>
            )}
            
            {/* Graphique principal */}
            <Box height={showDetails ? height * 0.6 : height * 0.8}>
                {renderChart()}
            </Box>
            
            {/* Panneau des statistiques */}
            <StatsPanel />
            
            {/* Menu des options */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => { setShowPercentages(!showPercentages); handleMenuClose(); }}>
                    {showPercentages ? 'Masquer' : 'Afficher'} les pourcentages
                </MenuItem>
                <MenuItem onClick={() => { setShowValues(!showValues); handleMenuClose(); }}>
                    {showValues ? 'Masquer' : 'Afficher'} les valeurs
                </MenuItem>
                <MenuItem onClick={() => { 
                    setSortBy(sortBy === 'value' ? 'name' : 'value'); 
                    handleMenuClose(); 
                }}>
                    Trier par {sortBy === 'value' ? 'nom' : 'valeur'}
                </MenuItem>
            </Menu>
            
            {/* Contrôles de filtrage (si dans le menu ou sidebar) */}
            {menuAnchor && (
                <Box sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Filtres
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" gutterBottom>
                            Nombre max d'éléments: {maxItems}
                        </Typography>
                        <Slider
                            value={maxItems}
                            onChange={(_, value) => setMaxItems(value)}
                            min={3}
                            max={20}
                            step={1}
                            marks
                            valueLabelDisplay="auto"
                        />
                    </Box>
                    <Box>
                        <Typography variant="body2" gutterBottom>
                            Pourcentage minimum: {minPercentage}%
                        </Typography>
                        <Slider
                            value={minPercentage}
                            onChange={(_, value) => setMinPercentage(value)}
                            min={0}
                            max={10}
                            step={0.5}
                            valueLabelDisplay="auto"
                        />
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default DistributionChart;