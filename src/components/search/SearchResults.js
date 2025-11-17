// src/components/search/SearchResults.js - AFFICHAGE DES RÉSULTATS DE RECHERCHE AVEC HIGHLIGHT
// Composant d'affichage optimisé des résultats avec groupage, tri et highlights

import React, { useState, useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemIcon,
    Chip,
    Avatar,
    Tooltip,
    IconButton,
    Divider,
    Collapse,
    Button,
    TextField,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    LinearProgress,
    Alert,
    Skeleton,
    Grid,
    Card,
    CardContent,
    useTheme,
    alpha
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    ViewList as ListViewIcon,
    ViewModule as GridViewIcon,
    Sort as SortIcon,
    FilterList as FilterIcon,
    Clear as ClearIcon,
    Refresh as RefreshIcon,
    Download as DownloadIcon,
    Share as ShareIcon,
    Bookmark as BookmarkIcon,
    Timer as TimerIcon,
    Person as PersonIcon,
    Description as DocumentIcon,
    Schedule as ScheduleIcon,
    TrendingUp as TrendingUpIcon,
    Star as StarIcon
} from '@mui/icons-material';
import Highlighter from 'react-highlight-words';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, differenceInDays, isToday, isTomorrow } from 'date-fns';
import { fr } from 'date-fns/locale';

// Configuration des vues
const VIEW_MODES = {
    list: 'list',
    grid: 'grid',
    compact: 'compact'
};

// Configuration du groupage
const GROUPING_OPTIONS = {
    none: 'Aucun',
    status: 'Par statut',
    borrower: 'Par emprunteur',
    documentType: 'Par type de document',
    date: 'Par date de retour',
    alertLevel: 'Par niveau d\'alerte'
};

// Configuration du tri
const SORT_OPTIONS = {
    relevance: { label: 'Pertinence', icon: <StarIcon /> },
    dateDesc: { label: 'Date (plus récent)', icon: <ScheduleIcon /> },
    dateAsc: { label: 'Date (plus ancien)', icon: <ScheduleIcon /> },
    borrowerName: { label: 'Emprunteur', icon: <PersonIcon /> },
    documentTitle: { label: 'Document', icon: <DocumentIcon /> },
    returnDate: { label: 'Date de retour', icon: <ScheduleIcon /> },
    alertLevel: { label: 'Niveau d\'alerte', icon: <TrendingUpIcon /> }
};

const SearchResults = ({
    results = [],
    loading = false,
    searchQuery = '',
    filters = {},
    onResultSelect,
    onResultAction,
    viewMode = 'list',
    onViewModeChange,
    groupBy = 'none',
    onGroupByChange,
    sortBy = 'relevance',
    onSortByChange,
    showFilters = true,
    showStats = true,
    maxHeight = 600,
    showLoadMore = false,
    onLoadMore,
    hasMore = false,
    totalResults = 0,
    searchTime = 0,
    error = null,
    className
}) => {
    const [expandedGroups, setExpandedGroups] = useState(new Set());
    const [selectedResult, setSelectedResult] = useState(null);
    
    const theme = useTheme();

    // Gestion de la sélection de résultat
    const handleResultSelect = (result) => {
        setSelectedResult(result.id);
        if (onResultSelect) {
            onResultSelect(result);
        }
    };

    // Gestion des actions sur résultat
    const handleResultAction = (action, result) => {
        if (onResultAction) {
            onResultAction(action, result);
        }
    };

    // Toggle des groupes expandés
    const toggleGroup = (groupKey) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(groupKey)) {
            newExpanded.delete(groupKey);
        } else {
            newExpanded.add(groupKey);
        }
        setExpandedGroups(newExpanded);
    };

    // Groupement des résultats
    const groupedResults = useMemo(() => {
        if (groupBy === 'none') {
            return { 'Tous les résultats': results };
        }

        const groups = {};
        results.forEach(result => {
            let groupKey;
            
            switch (groupBy) {
                case 'status':
                    groupKey = getStatusLabel(result.status);
                    break;
                case 'borrower':
                    groupKey = result.borrowerName || 'Inconnu';
                    break;
                case 'documentType':
                    groupKey = result.documentType || 'Non catégorisé';
                    break;
                case 'date':
                    groupKey = formatGroupByDate(result.returnDate);
                    break;
                case 'alertLevel':
                    groupKey = getAlertLevelLabel(result);
                    break;
                default:
                    groupKey = 'Autres';
            }
            
            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(result);
        });

        // Trier les groupes
        const sortedGroups = {};
        Object.keys(groups).sort().forEach(key => {
            sortedGroups[key] = groups[key];
        });

        return sortedGroups;
    }, [results, groupBy]);

    // Fonction utilitaire pour les libellés de statut
    const getStatusLabel = (status) => {
        const statusLabels = {
            active: 'Actifs',
            reserved: 'Réservés',
            overdue: 'En retard',
            critical: 'Critiques',
            returned: 'Retournés',
            cancelled: 'Annulés'
        };
        return statusLabels[status] || status;
    };

    // Fonction utilitaire pour les niveaux d'alerte
    const getAlertLevelLabel = (result) => {
        if (!result.alertLevel) return 'Aucune alerte';
        const alertLabels = {
            low: 'Alertes faibles',
            medium: 'Alertes moyennes',
            high: 'Alertes élevées',
            critical: 'Alertes critiques'
        };
        return alertLabels[result.alertLevel] || result.alertLevel;
    };

    // Fonction utilitaire pour grouper par date
    const formatGroupByDate = (dateString) => {
        if (!dateString) return 'Dates inconnues';
        
        const date = parseISO(dateString);
        const today = new Date();
        
        if (isToday(date)) return 'Aujourd\'hui';
        if (isTomorrow(date)) return 'Demain';
        
        const daysDiff = differenceInDays(date, today);
        if (daysDiff > 0 && daysDiff <= 7) return 'Cette semaine';
        if (daysDiff > 0 && daysDiff <= 30) return 'Ce mois';
        if (daysDiff < 0) return 'En retard';
        
        return format(date, 'MMMM yyyy', { locale: fr });
    };

    // Fonction pour obtenir la couleur de statut
    const getStatusColor = (status) => {
        const colors = {
            active: 'success',
            reserved: 'info',
            overdue: 'warning',
            critical: 'error',
            returned: 'default',
            cancelled: 'default'
        };
        return colors[status] || 'default';
    };

    // Composant d'élément de résultat en vue liste
    const ListResultItem = ({ result, index }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            <ListItem
                disablePadding
                selected={selectedResult === result.id}
                sx={{
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    '&:hover': {
                        backgroundColor: alpha(theme.palette.action.hover, 0.5)
                    }
                }}
            >
                <ListItemButton
                    onClick={() => handleResultSelect(result)}
                    sx={{ py: 2 }}
                >
                    <ListItemIcon sx={{ minWidth: 50 }}>
                        <Avatar
                            sx={{
                                bgcolor: getStatusColor(result.status),
                                width: 40,
                                height: 40
                            }}
                        >
                            <DocumentIcon />
                        </Avatar>
                    </ListItemIcon>
                    
                    <ListItemText
                        primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Highlighter
                                    searchWords={[searchQuery]}
                                    textToHighlight={result.documentTitle || 'Document sans titre'}
                                    highlightTag={({ children }) => (
                                        <Box component="mark" sx={{ bgcolor: 'yellow', p: 0.2, borderRadius: 0.5 }}>
                                            {children}
                                        </Box>
                                    )}
                                />
                                {result._relevanceScore && (
                                    <Chip
                                        label={`${Math.round(result._relevanceScore)}%`}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                    />
                                )}
                            </Box>
                        }
                        secondary={
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Highlighter
                                        searchWords={[searchQuery]}
                                        textToHighlight={result.borrowerName || 'Emprunteur inconnu'}
                                        highlightTag={({ children }) => (
                                            <Box component="mark" sx={{ bgcolor: 'yellow', p: 0.1, borderRadius: 0.3 }}>
                                                {children}
                                            </Box>
                                        )}
                                    />
                                    <Typography variant="caption" color="text.secondary">
                                        {result.borrowerEmail}
                                    </Typography>
                                </Box>
                                
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                    <Chip
                                        label={getStatusLabel(result.status)}
                                        color={getStatusColor(result.status)}
                                        size="small"
                                    />
                                    
                                    {result.documentType && (
                                        <Chip
                                            label={result.documentType}
                                            variant="outlined"
                                            size="small"
                                        />
                                    )}
                                    
                                    {result.returnDate && (
                                        <Typography variant="caption" color="text.secondary">
                                            Retour: {format(parseISO(result.returnDate), 'dd/MM/yyyy', { locale: fr })}
                                        </Typography>
                                    )}
                                    
                                    {result.alertLevel && (
                                        <Chip
                                            label={`Alerte ${result.alertLevel}`}
                                            color={result.alertLevel === 'critical' ? 'error' : 'warning'}
                                            size="small"
                                        />
                                    )}
                                </Box>
                            </Box>
                        }
                    />
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {result._searchScore && (
                            <Tooltip title="Score de pertinence">
                                <Chip
                                    label={`${Math.round((1 - result._searchScore) * 100)}%`}
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                />
                            </Tooltip>
                        )}
                        
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleResultAction('bookmark', result);
                            }}
                        >
                            <BookmarkIcon />
                        </IconButton>
                        
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleResultAction('share', result);
                            }}
                        >
                            <ShareIcon />
                        </IconButton>
                    </Box>
                </ListItemButton>
            </ListItem>
        </motion.div>
    );

    // Composant d'élément de résultat en vue grille
    const GridResultItem = ({ result, index }) => (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
        >
            <Card
                sx={{
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[8]
                    },
                    border: selectedResult === result.id ? `2px solid ${theme.palette.primary.main}` : '1px solid',
                    borderColor: selectedResult === result.id ? 'primary.main' : 'divider'
                }}
                onClick={() => handleResultSelect(result)}
            >
                <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                        <Avatar
                            sx={{
                                bgcolor: getStatusColor(result.status),
                                width: 32,
                                height: 32
                            }}
                        >
                            <DocumentIcon fontSize="small" />
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Highlighter
                                searchWords={[searchQuery]}
                                textToHighlight={result.documentTitle || 'Document sans titre'}
                                highlightTag={({ children }) => (
                                    <Box component="mark" sx={{ bgcolor: 'yellow', p: 0.2, borderRadius: 0.5 }}>
                                        {children}
                                    </Box>
                                )}
                            />
                        </Box>
                        {result._relevanceScore && (
                            <Chip
                                label={`${Math.round(result._relevanceScore)}%`}
                                size="small"
                                color="primary"
                                variant="outlined"
                            />
                        )}
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        <Highlighter
                            searchWords={[searchQuery]}
                            textToHighlight={result.borrowerName || 'Emprunteur inconnu'}
                            highlightTag={({ children }) => (
                                <Box component="mark" sx={{ bgcolor: 'yellow', p: 0.1, borderRadius: 0.3 }}>
                                    {children}
                                </Box>
                            )}
                        />
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                        <Chip
                            label={getStatusLabel(result.status)}
                            color={getStatusColor(result.status)}
                            size="small"
                        />
                        {result.documentType && (
                            <Chip
                                label={result.documentType}
                                variant="outlined"
                                size="small"
                            />
                        )}
                    </Box>
                    
                    {result.returnDate && (
                        <Typography variant="caption" color="text.secondary">
                            Retour: {format(parseISO(result.returnDate), 'dd/MM/yyyy', { locale: fr })}
                        </Typography>
                    )}
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleResultAction('bookmark', result);
                            }}
                        >
                            <BookmarkIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </CardContent>
            </Card>
        </motion.div>
    );

    // Composant de groupe de résultats
    const ResultsGroup = ({ groupName, groupResults, groupIndex }) => {
        const isExpanded = expandedGroups.has(groupName);
        const resultCount = groupResults.length;

        return (
            <Box sx={{ mb: 2 }}>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 2,
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                        borderRadius: 1,
                        mb: 1,
                        cursor: 'pointer',
                        '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.1)
                        }
                    }}
                    onClick={() => toggleGroup(groupName)}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        <Typography variant="subtitle1" fontWeight="medium">
                            {groupName}
                        </Typography>
                        <Chip
                            label={resultCount}
                            size="small"
                            color="primary"
                            variant="outlined"
                        />
                    </Box>
                    
                    <Typography variant="caption" color="text.secondary">
                        {resultCount} résultat{resultCount > 1 ? 's' : ''}
                    </Typography>
                </Box>
                
                <Collapse in={isExpanded}>
                    {viewMode === 'list' ? (
                        <List sx={{ py: 0 }}>
                            {groupResults.map((result, index) => (
                                <ListResultItem
                                    key={`${groupName}-${result.id}`}
                                    result={result}
                                    index={groupIndex * 100 + index}
                                />
                            ))}
                        </List>
                    ) : (
                        <Grid container spacing={2}>
                            {groupResults.map((result, index) => (
                                <Grid item xs={12} sm={6} md={4} key={`${groupName}-${result.id}`}>
                                    <GridResultItem
                                        result={result}
                                        index={groupIndex * 100 + index}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Collapse>
            </Box>
        );
    };

    // Composant de statistiques
    const SearchStats = () => (
        <Box sx={{ p: 2, backgroundColor: alpha(theme.palette.primary.main, 0.05), borderRadius: 1, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="h4" color="primary" fontWeight="bold">
                        {totalResults}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Résultat{totalResults > 1 ? 's' : ''} trouvé{totalResults > 1 ? 's' : ''}
                    </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                        Temps de recherche
                    </Typography>
                    <Typography variant="h6">
                        <TimerIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                        {searchTime.toFixed(2)}ms
                    </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                        Filtres appliqués
                    </Typography>
                    <Typography variant="h6">
                        {Object.keys(filters).filter(key => filters[key] !== '' && filters[key] !== null).length}
                    </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                        Regroupement
                    </Typography>
                    <Typography variant="h6">
                        {GROUPING_OPTIONS[groupBy]}
                    </Typography>
                </Grid>
            </Grid>
        </Box>
    );

    if (loading) {
        return (
            <Box className={className}>
                <Paper sx={{ p: 2, mb: 2 }}>
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
                </Paper>
            </Box>
        );
    }

    if (error) {
        return (
            <Box className={className}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            </Box>
        );
    }

    return (
        <Box className={className} sx={{ maxHeight }}>
            {/* Contrôles */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Typography variant="h6" sx={{ mr: 'auto' }}>
                        Résultats de recherche
                    </Typography>
                    
                    {/* Mode d'affichage */}
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Affichage</InputLabel>
                        <Select
                            value={viewMode}
                            label="Affichage"
                            onChange={(e) => onViewModeChange?.(e.target.value)}
                        >
                            <MenuItem value="list">
                                <ListViewIcon sx={{ mr: 1 }} />
                                Liste
                            </MenuItem>
                            <MenuItem value="grid">
                                <GridViewIcon sx={{ mr: 1 }} />
                                Grille
                            </MenuItem>
                        </Select>
                    </FormControl>

                    {/* Groupement */}
                    {showFilters && (
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Grouper par</InputLabel>
                            <Select
                                value={groupBy}
                                label="Grouper par"
                                onChange={(e) => onGroupByChange?.(e.target.value)}
                            >
                                {Object.entries(GROUPING_OPTIONS).map(([key, label]) => (
                                    <MenuItem key={key} value={key}>
                                        {label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    {/* Tri */}
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Trier par</InputLabel>
                        <Select
                            value={sortBy}
                            label="Trier par"
                            onChange={(e) => onSortByChange?.(e.target.value)}
                        >
                            {Object.entries(SORT_OPTIONS).map(([key, option]) => (
                                <MenuItem key={key} value={key}>
                                    {option.icon}
                                    <Typography variant="body2" sx={{ ml: 1 }}>
                                        {option.label}
                                    </Typography>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Button
                        startIcon={<RefreshIcon />}
                        onClick={() => window.location.reload()}
                        size="small"
                    >
                        Actualiser
                    </Button>
                </Box>
            </Paper>

            {/* Statistiques */}
            {showStats && <SearchStats />}

            {/* Résultats */}
            <Box sx={{ position: 'relative' }}>
                {results.length === 0 ? (
                    <Paper sx={{ p: 4, textAlign: 'center' }}>
                        <DocumentIcon fontSize="large" color="disabled" sx={{ mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                            Aucun résultat trouvé
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Essayez de modifier vos critères de recherche ou vos filtres
                        </Typography>
                    </Paper>
                ) : (
                    <AnimatePresence>
                        {groupBy === 'none' ? (
                            // Affichage direct des résultats
                            viewMode === 'list' ? (
                                <Paper>
                                    <List>
                                        {results.map((result, index) => (
                                            <ListResultItem
                                                key={result.id}
                                                result={result}
                                                index={index}
                                            />
                                        ))}
                                    </List>
                                </Paper>
                            ) : (
                                <Grid container spacing={2}>
                                    {results.map((result, index) => (
                                        <Grid item xs={12} sm={6} md={4} key={result.id}>
                                            <GridResultItem
                                                result={result}
                                                index={index}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>
                            )
                        ) : (
                            // Affichage groupé
                            Object.entries(groupedResults).map(([groupName, groupResults], groupIndex) => (
                                <ResultsGroup
                                    key={groupName}
                                    groupName={groupName}
                                    groupResults={groupResults}
                                    groupIndex={groupIndex}
                                />
                            ))
                        )}
                    </AnimatePresence>
                )}

                {/* Bouton charger plus */}
                {showLoadMore && hasMore && (
                    <Box sx={{ textAlign: 'center', mt: 3 }}>
                        <Button
                            variant="outlined"
                            onClick={onLoadMore}
                            disabled={loading}
                        >
                            Charger plus de résultats
                        </Button>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default React.memo(SearchResults);
