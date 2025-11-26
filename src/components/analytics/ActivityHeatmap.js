// src/components/analytics/ActivityHeatmap.js - Heatmap d'Activité Temporelle
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
    TextField,
    Autocomplete,
    LinearProgress,
    Alert
} from '@mui/material';
import {
    ScatterPlot,
    Download,
    FilterList,
    HeatPump,
    Person,
    DeviceUnknown,
    TrendingUp,
    TrendingDown,
    Visibility,
    VisibilityOff,
    ZoomIn,
    ZoomOut,
    Refresh,
    ExpandMore,
    Assessment,
    Schedule
} from '@mui/icons-material';
import {
    ResponsiveContainer,
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Cell,
    ReferenceLine,
    ZAxis
} from 'recharts';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';

const ActivityHeatmap = ({
    data = [],
    height = 350,
    filters = {},
    settings = {},
    title = "Heatmap d'Activité",
    showControls = true,
    enableExport = true,
    showDetails = true
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const chartRef = useRef(null);
    
    // États du composant
    const [heatmapMode, setHeatmapMode] = useState('user_document'); // user_document, time_user, time_document
    const [intensityScale, setIntensityScale] = useState('linear'); // linear, log
    const [colorScheme, setColorScheme] = useState('default'); // default, red, green, blue
    const [showGrid, setShowGrid] = useState(true);
    const [showLegend, setShowLegend] = useState(true);
    const [cellSize, setCellSize] = useState(20);
    const [minIntensity, setMinIntensity] = useState(0);
    const [maxIntensity, setMaxIntensity] = useState(null);
    const [hoveredCell, setHoveredCell] = useState(null);
    const [selectedCells, setSelectedCells] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedItems, setHighlightedItems] = useState([]);
    
    // Menu states
    const [menuAnchor, setMenuAnchor] = useState(null);
    
    // Données sources
    const [sourceUsers, setSourceUsers] = useState([]);
    const [sourceDocuments, setSourceDocuments] = useState([]);
    
    // Traitement des données selon le mode
    const processedData = useMemo(() => {
        if (!data.length) return { cells: [], stats: null, metadata: {} };
        
        let processedCells = [];
        let xAxisData = [];
        let yAxisData = [];
        let legendData = [];
        
        switch (heatmapMode) {
            case 'user_document':
                return processUserDocumentData();
            case 'time_user':
                return processTimeUserData();
            case 'time_document':
                return processTimeDocumentData();
            default:
                return { cells: [], stats: null, metadata: {} };
        }
    }, [data, heatmapMode, minIntensity, maxIntensity, searchQuery]);
    
    // Traitement des données utilisateur-document
    const processUserDocumentData = useCallback(() => {
        const users = [...new Set(data.map(item => item.user).filter(Boolean))];
        const documents = [...new Set(data.map(item => item.document).filter(Boolean))];
        
        // Filtrage par recherche
        const filteredUsers = searchQuery 
            ? users.filter(user => user.toLowerCase().includes(searchQuery.toLowerCase()))
            : users;
        const filteredDocuments = documents;
        
        const cells = [];
        const intensityMap = new Map();
        
        // Agrégation des intensités
        data.forEach(item => {
            if (!filteredUsers.includes(item.user) || !filteredDocuments.includes(item.document)) {
                return;
            }
            
            const key = `${item.user}-${item.document}`;
            intensityMap.set(key, (intensityMap.get(key) || 0) + item.value);
        });
        
        // Création des cellules
        filteredUsers.forEach((user, userIndex) => {
            filteredDocuments.forEach((document, docIndex) => {
                const key = `${user}-${document}`;
                const intensity = intensityMap.get(key) || 0;
                
                if (intensity >= minIntensity && (maxIntensity === null || intensity <= maxIntensity)) {
                    cells.push({
                        x: docIndex,
                        y: userIndex,
                        z: intensity,
                        user,
                        document,
                        intensity: applyIntensityScale(intensity),
                        fill: getColorByIntensity(intensity),
                        originalValue: intensity
                    });
                }
            });
        });
        
        const stats = calculateStats(Array.from(intensityMap.values()));
        
        return {
            cells,
            stats,
            metadata: {
                users: filteredUsers,
                documents: filteredDocuments,
                totalCells: cells.length,
                maxIntensity: Math.max(...Array.from(intensityMap.values())),
                minIntensity: Math.min(...Array.from(intensityMap.values()))
            }
        };
    }, [data, heatmapMode, minIntensity, maxIntensity, searchQuery]);
    
    // Traitement des données temps-utilisateur
    const processTimeUserData = useCallback(() => {
        const now = new Date();
        const last7Days = eachDayOfInterval({
            start: subDays(now, 6),
            end: now
        });
        
        const users = [...new Set(data.map(item => item.user).filter(Boolean))];
        const filteredUsers = searchQuery 
            ? users.filter(user => user.toLowerCase().includes(searchQuery.toLowerCase()))
            : users;
        
        const cells = [];
        const intensityMap = new Map();
        
        // Agrégation par jour et utilisateur
        data.forEach(item => {
            const dateKey = format(parseISO(item.date || new Date().toISOString()), 'yyyy-MM-dd');
            const dayIndex = last7Days.findIndex(day => 
                format(day, 'yyyy-MM-dd') === dateKey
            );
            
            if (dayIndex !== -1 && filteredUsers.includes(item.user)) {
                const key = `${dayIndex}-${item.user}`;
                intensityMap.set(key, (intensityMap.get(key) || 0) + item.value);
            }
        });
        
        // Création des cellules
        last7Days.forEach((day, dayIndex) => {
            filteredUsers.forEach((user, userIndex) => {
                const key = `${dayIndex}-${user}`;
                const intensity = intensityMap.get(key) || 0;
                
                if (intensity >= minIntensity) {
                    cells.push({
                        x: dayIndex,
                        y: userIndex,
                        z: intensity,
                        date: format(day, 'yyyy-MM-dd'),
                        dayName: format(day, 'EEE', { locale: fr }),
                        user,
                        intensity: applyIntensityScale(intensity),
                        fill: getColorByIntensity(intensity),
                        originalValue: intensity
                    });
                }
            });
        });
        
        const stats = calculateStats(Array.from(intensityMap.values()));
        
        return {
            cells,
            stats,
            metadata: {
                days: last7Days.map(day => ({
                    index: last7Days.indexOf(day),
                    label: format(day, 'dd MMM', { locale: fr }),
                    date: format(day, 'yyyy-MM-dd')
                })),
                users: filteredUsers,
                totalCells: cells.length,
                maxIntensity: Math.max(...Array.from(intensityMap.values())),
                minIntensity: Math.min(...Array.from(intensityMap.values()))
            }
        };
    }, [data, heatmapMode, minIntensity, maxIntensity, searchQuery]);
    
    // Traitement des données temps-document
    const processTimeDocumentData = useCallback(() => {
        const now = new Date();
        const last7Days = eachDayOfInterval({
            start: subDays(now, 6),
            end: now
        });
        
        const documents = [...new Set(data.map(item => item.document).filter(Boolean))];
        
        const cells = [];
        const intensityMap = new Map();
        
        // Agrégation par jour et document
        data.forEach(item => {
            const dateKey = format(parseISO(item.date || new Date().toISOString()), 'yyyy-MM-dd');
            const dayIndex = last7Days.findIndex(day => 
                format(day, 'yyyy-MM-dd') === dateKey
            );
            
            if (dayIndex !== -1) {
                const key = `${dayIndex}-${item.document}`;
                intensityMap.set(key, (intensityMap.get(key) || 0) + item.value);
            }
        });
        
        // Création des cellules
        last7Days.forEach((day, dayIndex) => {
            documents.forEach((document, docIndex) => {
                const key = `${dayIndex}-${document}`;
                const intensity = intensityMap.get(key) || 0;
                
                if (intensity >= minIntensity) {
                    cells.push({
                        x: dayIndex,
                        y: docIndex,
                        z: intensity,
                        date: format(day, 'yyyy-MM-dd'),
                        dayName: format(day, 'EEE', { locale: fr }),
                        document,
                        intensity: applyIntensityScale(intensity),
                        fill: getColorByIntensity(intensity),
                        originalValue: intensity
                    });
                }
            });
        });
        
        const stats = calculateStats(Array.from(intensityMap.values()));
        
        return {
            cells,
            stats,
            metadata: {
                days: last7Days.map(day => ({
                    index: last7Days.indexOf(day),
                    label: format(day, 'dd MMM', { locale: fr }),
                    date: format(day, 'yyyy-MM-dd')
                })),
                documents,
                totalCells: cells.length,
                maxIntensity: Math.max(...Array.from(intensityMap.values())),
                minIntensity: Math.min(...Array.from(intensityMap.values()))
            }
        };
    }, [data, heatmapMode, minIntensity, maxIntensity, searchQuery]);
    
    // Calcul des statistiques
    const calculateStats = useCallback((values) => {
        if (!values.length) return null;
        
        const total = values.reduce((sum, val) => sum + val, 0);
        const avg = total / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        
        // Calcul des percentiles
        const sorted = [...values].sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        
        return {
            total,
            avg,
            max,
            min,
            count: values.length,
            q1,
            q3,
            median: sorted[Math.floor(sorted.length / 2)]
        };
    }, []);
    
    // Application de l'échelle d'intensité
    const applyIntensityScale = useCallback((value) => {
        if (intensityScale === 'log' && value > 0) {
            return Math.log(value + 1);
        }
        return value;
    }, [intensityScale]);
    
    // Génération des couleurs
    const getColorByIntensity = useCallback((value) => {
        const maxValue = processedData.metadata?.maxIntensity || 1;
        const normalized = Math.min(value / maxValue, 1);
        
        switch (colorScheme) {
            case 'red':
                return `rgba(244, 67, 54, ${normalized})`;
            case 'green':
                return `rgba(76, 175, 80, ${normalized})`;
            case 'blue':
                return `rgba(33, 150, 243, ${normalized})`;
            default:
                return `rgba(63, 81, 181, ${normalized})`;
        }
    }, [processedData.metadata, colorScheme]);
    
    // Génération de l'échelle de couleurs
    const generateColorScale = useCallback(() => {
        const steps = 5;
        const colors = [];
        
        for (let i = 0; i <= steps; i++) {
            const intensity = i / steps;
            colors.push({
                value: i,
                color: getColorByIntensity(intensity * (processedData.metadata?.maxIntensity || 1)),
                label: `${Math.round(intensity * (processedData.metadata?.maxIntensity || 1))}`
            });
        }
        
        return colors;
    }, [processedData.metadata, getColorByIntensity]);
    
    // Gestionnaires d'événements
    const handleCellHover = useCallback((data, index) => {
        if (data) {
            setHoveredCell({ ...data, index });
        } else {
            setHoveredCell(null);
        }
    }, []);
    
    const handleCellClick = useCallback((data, index) => {
        if (!data) return;
        
        const cellKey = `${data.x}-${data.y}`;
        setSelectedCells(prev => {
            const exists = prev.find(c => `${c.x}-${c.y}` === cellKey);
            if (exists) {
                return prev.filter(c => `${c.x}-${c.y}` !== cellKey);
            } else {
                return [...prev, data];
            }
        });
    }, []);
    
    const handleExport = useCallback(() => {
        const csvContent = [
            ['X', 'Y', 'Intensité', ...getAxisLabels()].join(','),
            ...processedData.cells.map(cell => [
                cell.x,
                cell.y,
                cell.originalValue,
                ...getCellDetails(cell)
            ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `heatmap_${heatmapMode}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [processedData, heatmapMode]);
    
    const getAxisLabels = useCallback(() => {
        switch (heatmapMode) {
            case 'user_document':
                return ['Utilisateur', 'Document'];
            case 'time_user':
                return ['Jour', 'Utilisateur'];
            case 'time_document':
                return ['Jour', 'Document'];
            default:
                return ['X', 'Y'];
        }
    }, [heatmapMode]);
    
    const getCellDetails = useCallback((cell) => {
        switch (heatmapMode) {
            case 'user_document':
                return [cell.user, cell.document];
            case 'time_user':
                return [cell.dayName, cell.user];
            case 'time_document':
                return [cell.dayName, cell.document];
            default:
                return ['-', '-'];
        }
    }, [heatmapMode]);
    
    const handleMenuOpen = useCallback((event) => {
        setMenuAnchor(event.currentTarget);
    }, []);
    
    const handleMenuClose = useCallback(() => {
        setMenuAnchor(null);
    }, []);
    
    // Tooltip personnalisé
    const CustomTooltip = useCallback(({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <Paper sx={{ p: 2, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Activité détaillée
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                        <HeatPump sx={{ fontSize: 16 }} />
                        <Typography variant="body2">
                            Intensité: {data.originalValue}
                        </Typography>
                    </Box>
                    {getCellDetails(data).map((detail, index) => (
                        <Typography key={index} variant="body2" color="text.secondary">
                            {getAxisLabels()[index]}: {detail}
                        </Typography>
                    ))}
                </Paper>
            );
        }
        return null;
    }, [getCellDetails, getAxisLabels]);
    
    // Légende des couleurs
    const ColorLegend = useCallback(() => {
        const colorScale = generateColorScale();
        
        return (
            <Box display="flex" alignItems="center" gap={1} sx={{ mt: 1 }}>
                <Typography variant="caption">Intensité:</Typography>
                {colorScale.map((step, index) => (
                    <Box key={index} display="flex" alignItems="center">
                        <Box
                            sx={{
                                width: 16,
                                height: 16,
                                bgcolor: step.color,
                                border: 1,
                                borderColor: 'divider',
                                borderRadius: 0.5
                            }}
                        />
                        <Typography variant="caption" sx={{ ml: 0.5, mr: 1 }}>
                            {step.label}
                        </Typography>
                    </Box>
                ))}
            </Box>
        );
    }, [generateColorScale]);
    
    // Composant des statistiques
    const StatsPanel = useCallback(() => {
        if (!showDetails || !processedData.stats) return null;
        
        const stats = processedData.stats;
        
        return (
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="subtitle2">
                        Statistiques d'Activité
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
                                        Total activité
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
                                        Cellules actives
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6}>
                            <Card variant="outlined" size="small">
                                <CardContent sx={{ py: 1 }}>
                                    <Typography variant="h6" color="success.main">
                                        {stats.avg.toFixed(1)}
                                    </Typography>
                                    <Typography variant="caption">
                                        Moyenne
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6}>
                            <Card variant="outlined" size="small">
                                <CardContent sx={{ py: 1 }}>
                                    <Typography variant="h6" color="warning.main">
                                        {stats.max}
                                    </Typography>
                                    <Typography variant="caption">
                                        Pic d'activité
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>
        );
    }, [showDetails, processedData]);
    
    // S'il n'y a pas de données
    if (!processedData.cells.length) {
        return (
            <Box 
                height={height} 
                display="flex" 
                alignItems="center" 
                justifyContent="center"
                flexDirection="column"
                gap={2}
            >
                <HeatPump sx={{ fontSize: 48, color: 'text.disabled' }} />
                <Typography variant="body1" color="text.secondary">
                    Aucune donnée de heatmap disponible
                </Typography>
                {data.length === 0 && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        Importez des données pour afficher la heatmap d'activité
                    </Alert>
                )}
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
                        <TextField
                            size="small"
                            placeholder="Rechercher..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: <Search sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                            }}
                            sx={{ minWidth: 200 }}
                        />
                        
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>Mode</InputLabel>
                            <Select
                                value={heatmapMode}
                                onChange={(e) => setHeatmapMode(e.target.value)}
                                label="Mode"
                            >
                                <MenuItem value="user_document">Utilisateur-Document</MenuItem>
                                <MenuItem value="time_user">Temps-Utilisateur</MenuItem>
                                <MenuItem value="time_document">Temps-Document</MenuItem>
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
                        
                        <Tooltip title="Légende">
                            <IconButton 
                                size="small" 
                                onClick={() => setShowLegend(!showLegend)}
                                color={showLegend ? 'primary' : 'default'}
                            >
                                {showLegend ? <Visibility /> : <VisibilityOff />}
                            </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Options">
                            <IconButton size="small" onClick={handleMenuOpen}>
                                <Schedule />
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
            
            {/* Informations sur la cellule survolée */}
            {hoveredCell && (
                <Paper sx={{ p: 2, mb: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                        Détails de l'activité
                    </Typography>
                    <Box display="flex" gap={2} mt={1} flexWrap="wrap">
                        <Typography variant="body2">
                            Intensité: {hoveredCell.originalValue}
                        </Typography>
                        {getCellDetails(hoveredCell).map((detail, index) => (
                            <Typography key={index} variant="body2">
                                {getAxisLabels()[index]}: {detail}
                            </Typography>
                        ))}
                    </Box>
                </Paper>
            )}
            
            {/* Graphique principal */}
            <Box height={showDetails ? height * 0.6 : height * 0.8}>
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                        <CartesianGrid 
                            strokeDasharray="3 3" 
                            stroke={theme.palette.divider}
                            display={showGrid}
                        />
                        
                        <XAxis 
                            type="number"
                            dataKey="x"
                            domain={['dataMin - 0.5', 'dataMax + 0.5']}
                            ticks={getAxisTicks(processedData.metadata)}
                            tick={{ fontSize: 10 }}
                            interval={0}
                        />
                        
                        <YAxis 
                            type="number"
                            dataKey="y"
                            domain={['dataMin - 0.5', 'dataMax + 0.5']}
                            ticks={getAxisTicks(processedData.metadata)}
                            tick={{ fontSize: 10 }}
                            interval={0}
                        />
                        
                        <ZAxis 
                            type="number" 
                            dataKey="intensity" 
                            range={[50, 400]}
                        />
                        
                        <RechartsTooltip content={<CustomTooltip />} />
                        
                        <Scatter
                            data={processedData.cells}
                            fill="#8884d8"
                            onMouseEnter={handleCellHover}
                            onMouseLeave={() => setHoveredCell(null)}
                            onClick={handleCellClick}
                        >
                            {processedData.cells.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={entry.fill}
                                    stroke={selectedCells.find(c => c.x === entry.x && c.y === entry.y) ? theme.palette.primary.main : 'none'}
                                    strokeWidth={selectedCells.find(c => c.x === entry.x && c.y === entry.y) ? 2 : 0}
                                />
                            ))}
                        </Scatter>
                        
                        {showGrid && (
                            <ReferenceLine 
                                stroke={theme.palette.divider} 
                                strokeWidth={1}
                            />
                        )}
                    </ScatterChart>
                </ResponsiveContainer>
                
                {/* Légende des couleurs */}
                {showLegend && (
                    <Box sx={{ mt: 1 }}>
                        <ColorLegend />
                    </Box>
                )}
            </Box>
            
            {/* Panneau des statistiques */}
            <StatsPanel />
            
            {/* Menu des options */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => { 
                    setColorScheme(colorScheme === 'default' ? 'red' : colorScheme === 'red' ? 'green' : 'default'); 
                    handleMenuClose(); 
                }}>
                    Schéma de couleurs: {colorScheme}
                </MenuItem>
                <MenuItem onClick={() => { 
                    setIntensityScale(intensityScale === 'linear' ? 'log' : 'linear'); 
                    handleMenuClose(); 
                }}>
                    Échelle: {intensityScale === 'linear' ? 'Linéaire' : 'Logarithmique'}
                </MenuItem>
                <MenuItem onClick={() => { 
                    setMinIntensity(0); 
                    setMaxIntensity(null); 
                    handleMenuClose(); 
                }}>
                    Réinitialiser les filtres
                </MenuItem>
            </Menu>
            
            {/* Contrôles de filtrage dans le menu */}
            {menuAnchor && (
                <Box sx={{ p: 2, minWidth: 250 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Filtres d'intensité
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" gutterBottom>
                            Intensité minimum: {minIntensity}
                        </Typography>
                        <Slider
                            value={minIntensity}
                            onChange={(_, value) => setMinIntensity(value)}
                            min={0}
                            max={processedData.metadata?.maxIntensity || 10}
                            step={1}
                            valueLabelDisplay="auto"
                        />
                    </Box>
                    
                    <Box>
                        <Typography variant="body2" gutterBottom>
                            Taille des cellules: {cellSize}px
                        </Typography>
                        <Slider
                            value={cellSize}
                            onChange={(_, value) => setCellSize(value)}
                            min={10}
                            max={40}
                            step={2}
                            valueLabelDisplay="auto"
                        />
                    </Box>
                </Box>
            )}
        </Box>
    );
};

// Fonction utilitaire pour générer les ticks d'axe
const getAxisTicks = (metadata) => {
    if (!metadata) return [];
    
    if (metadata.users && metadata.documents) {
        return metadata.documents.map((_, index) => index);
    } else if (metadata.days && metadata.users) {
        return metadata.days.map((_, index) => index);
    } else if (metadata.days && metadata.documents) {
        return metadata.days.map((_, index) => index);
    }
    
    return [];
};

export default ActivityHeatmap;