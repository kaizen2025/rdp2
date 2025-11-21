// src/components/search/SearchHistory.js - HISTORIQUE PERSISTANT DES RECHERCHES
// Composant de gestion de l'historique avec statistiques et actions

import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    IconButton,
    Button,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Tooltip,
    Menu,
    Divider,
    Grid,
    Card,
    CardContent,
    Avatar
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
    History as HistoryIcon,
    Delete as DeleteIcon,
    Clear as ClearIcon,
    Search as SearchIcon,
    Bookmark as BookmarkIcon,
    Share as ShareIcon,
    Download as DownloadIcon,
    Upload as UploadIcon,
    Analytics as AnalyticsIcon,
    TrendingUp as TrendingUpIcon,
    Schedule as ScheduleIcon,
    Person as PersonIcon,
    Document as DocumentIcon,
    MoreVert as MoreVertIcon,
    Edit as EditIcon,
    ClearAll as ClearAllIcon,
    GetApp as ExportIcon,
    Add as AddIcon,
    Close as CloseIcon,
    FilterList as FilterIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, differenceInDays, isToday, isYesterday, startOfWeek, startOfMonth, endOfWeek, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

// Configuration des types de recherche
const SEARCH_TYPES = {
    text: { label: 'Recherche textuelle', icon: <SearchIcon />, color: 'primary' },
    filter: { label: 'Filtres', icon: <FilterIcon />, color: 'secondary' },
    advanced: { label: 'Recherche avancée', icon: <AnalyticsIcon />, color: 'info' },
    saved: { label: 'Recherche sauvegardée', icon: <BookmarkIcon />, color: 'warning' }
};

// Configuration des catégories d'analyse
const ANALYTICS_CATEGORIES = {
    daily: { label: 'Aujourd\'hui', getDate: () => new Date() },
    yesterday: { label: 'Hier', getDate: () => new Date(Date.now() - 24 * 60 * 60 * 1000) },
    week: { label: 'Cette semaine', getDate: () => startOfWeek(new Date(), { weekStartsOn: 1 }) },
    month: { label: 'Ce mois', getDate: () => startOfMonth(new Date()) }
};

const SearchHistory = ({
    history = [],
    savedSearches = [],
    onSearchSelect,
    onSearchDelete,
    onSearchEdit,
    onSearchExport,
    onSearchClear,
    onSearchBookmark,
    maxHeight = 500,
    showAnalytics = true,
    showExport = true,
    showBookmarks = true,
    showFilters = true,
    className
}) => {
    const [selectedHistory, setSelectedHistory] = useState([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', tags: '' });
    const [analyticsPeriod, setAnalyticsPeriod] = useState('week');
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);

    const theme = useTheme();

    // Gestion de la sélection
    const handleItemSelect = (item) => {
        if (onSearchSelect) {
            onSearchSelect(item);
        }
    };

    // Gestion de la suppression
    const handleDeleteClick = (item, event) => {
        event.stopPropagation();
        setItemToDelete(item);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (onSearchDelete && itemToDelete) {
            onSearchDelete(itemToDelete);
        }
        setDeleteDialogOpen(false);
        setItemToDelete(null);
    };

    // Gestion de l'édition
    const handleEditClick = (item, event) => {
        event.stopPropagation();
        setItemToEdit(item);
        setEditForm({
            name: item.name || item.query,
            tags: item.tags ? item.tags.join(', ') : ''
        });
        setEditDialogOpen(true);
    };

    const handleEditConfirm = () => {
        if (onSearchEdit && itemToEdit) {
            const updatedItem = {
                ...itemToEdit,
                name: editForm.name,
                tags: editForm.tags.split(',').map(tag => tag.trim()).filter(Boolean)
            };
            onSearchEdit(updatedItem);
        }
        setEditDialogOpen(false);
        setItemToEdit(null);
        setEditForm({ name: '', tags: '' });
    };

    // Gestion du menu contextuel
    const handleMenuClick = (event, item) => {
        event.stopPropagation();
        setMenuAnchor(event.currentTarget);
        setSelectedItem(item);
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
        setSelectedItem(null);
    };

    // Gestion de la sélection multiple
    const handleSelectToggle = (itemId) => {
        setSelectedHistory(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const handleSelectAll = () => {
        if (selectedHistory.length === history.length) {
            setSelectedHistory([]);
        } else {
            setSelectedHistory(history.map(item => item.id));
        }
    };

    // Effacer toutes les sélections
    const handleClearSelection = () => {
        setSelectedHistory([]);
    };

    // Effacer tout l'historique
    const handleClearAll = () => {
        if (onSearchClear) {
            onSearchClear();
        }
    };

    // Statistiques d'historique
    const analytics = useMemo(() => {
        if (!showAnalytics || history.length === 0) return null;

        const now = new Date();
        const analytics = {
            total: history.length,
            unique: new Set(history.map(h => h.query.toLowerCase().trim())).size,
            periods: {},
            topQueries: {},
            avgLength: 0,
            categories: {}
        };

        // Analyser par période
        Object.entries(ANALYTICS_CATEGORIES).forEach(([key, category]) => {
            const categoryHistory = history.filter(item => {
                const itemDate = parseISO(item.timestamp);
                switch (key) {
                    case 'daily':
                        return isToday(itemDate);
                    case 'yesterday':
                        return isYesterday(itemDate);
                    case 'week':
                        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
                        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
                        return itemDate >= weekStart && itemDate <= weekEnd;
                    case 'month':
                        const monthStart = startOfMonth(now);
                        const monthEnd = endOfMonth(now);
                        return itemDate >= monthStart && itemDate <= monthEnd;
                    default:
                        return false;
                }
            });
            analytics.periods[key] = categoryHistory.length;
        });

        // Top des requêtes
        const queryCounts = {};
        history.forEach(item => {
            const query = item.query.toLowerCase().trim();
            queryCounts[query] = (queryCounts[query] || 0) + 1;
        });

        analytics.topQueries = Object.entries(queryCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([query, count]) => ({ query, count }));

        // Longueur moyenne
        const totalLength = history.reduce((sum, item) => sum + item.query.length, 0);
        analytics.avgLength = Math.round(totalLength / history.length);

        return analytics;
    }, [history, showAnalytics]);

    // Formater la date relative
    const formatRelativeDate = (dateString) => {
        try {
            const date = parseISO(dateString);
            if (isToday(date)) return 'Aujourd\'hui';
            if (isYesterday(date)) return 'Hier';

            const daysAgo = differenceInDays(new Date(), date);
            if (daysAgo < 7) return `Il y a ${daysAgo} jour${daysAgo > 1 ? 's' : ''}`;
            if (daysAgo < 30) return `Il y a ${Math.floor(daysAgo / 7)} semaine${Math.floor(daysAgo / 7) > 1 ? 's' : ''}`;

            return format(date, 'dd/MM/yyyy', { locale: fr });
        } catch {
            return '';
        }
    };

    // Déterminer le type de recherche
    const getSearchType = (item) => {
        if (item.type) return item.type;
        if (item.filters && Object.keys(item.filters).length > 0) return 'filter';
        if (item.advanced) return 'advanced';
        return 'text';
    };

    // Obtenir l'icône de type de recherche
    const getSearchTypeIcon = (item) => {
        const type = getSearchType(item);
        const typeConfig = SEARCH_TYPES[type] || SEARCH_TYPES.text;
        return typeConfig.icon;
    };

    // Obtenir la couleur de type de recherche
    const getSearchTypeColor = (item) => {
        const type = getSearchType(item);
        const typeConfig = SEARCH_TYPES[type] || SEARCH_TYPES.text;
        return typeConfig.color;
    };

    // Composant d'élément d'historique
    const HistoryItem = ({ item, index }) => (
        <div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
        >
            <ListItem
                disablePadding
                secondaryAction={
                    <Box>
                        <IconButton
                            edge="end"
                            onClick={(e) => handleMenuClick(e, item)}
                        >
                            <MoreVertIcon />
                        </IconButton>
                    </Box>
                }
                sx={{
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    '&:hover': {
                        backgroundColor: alpha(theme.palette.action.hover, 0.5)
                    }
                }}
            >
                <ListItemButton onClick={() => handleItemSelect(item)}>
                    <ListItemIcon>
                        <Avatar
                            sx={{
                                bgcolor: getSearchTypeColor(item),
                                width: 32,
                                height: 32
                            }}
                        >
                            {getSearchTypeIcon(item)}
                        </Avatar>
                    </ListItemIcon>

                    <ListItemText
                        primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Typography variant="body2" noWrap sx={{ fontWeight: item.bookmarked ? 'bold' : 'normal' }}>
                                    {item.name || item.query}
                                </Typography>

                                {item.bookmarked && (
                                    <BookmarkIcon fontSize="small" color="warning" />
                                )}

                                {item.frequency && item.frequency > 1 && (
                                    <Chip
                                        label={`x${item.frequency}`}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                    />
                                )}

                                {item.tags && item.tags.length > 0 && (
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        {item.tags.slice(0, 2).map((tag, tagIndex) => (
                                            <Chip
                                                key={tagIndex}
                                                label={tag}
                                                size="small"
                                                variant="outlined"
                                                sx={{ height: 20, fontSize: '0.7rem' }}
                                            />
                                        ))}
                                        {item.tags.length > 2 && (
                                            <Chip
                                                label={`+${item.tags.length - 2}`}
                                                size="small"
                                                variant="outlined"
                                                sx={{ height: 20, fontSize: '0.7rem' }}
                                            />
                                        )}
                                    </Box>
                                )}
                            </Box>
                        }
                        secondary={
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">
                                    {item.query}
                                </Typography>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        {formatRelativeDate(item.timestamp)}
                                    </Typography>

                                    {item.resultCount && (
                                        <Typography variant="caption" color="text.secondary">
                                            • {item.resultCount} résultat{item.resultCount > 1 ? 's' : ''}
                                        </Typography>
                                    )}

                                    {item.searchTime && (
                                        <Typography variant="caption" color="text.secondary">
                                            • {item.searchTime}ms
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        }
                    />
                </ListItemButton>
            </ListItem>
        </div>
    );

    // Composant d'analytics
    const AnalyticsCard = () => {
        if (!analytics) return null;

        return (
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <AnalyticsIcon color="primary" />
                        <Typography variant="h6">
                            Statistiques d'historique
                        </Typography>
                    </Box>

                    <Grid container spacing={2}>
                        <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" color="primary">
                                    {analytics.total}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Recherches totales
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" color="secondary">
                                    {analytics.unique}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Requêtes uniques
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" color="info">
                                    {analytics.avgLength}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Longueur moyenne
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" color="success">
                                    {analytics.periods[analyticsPeriod] || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {ANALYTICS_CATEGORIES[analyticsPeriod]?.label}
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>

                    {/* Top des requêtes */}
                    {analytics.topQueries.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Top des requêtes
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {analytics.topQueries.map((query, index) => (
                                    <Box
                                        key={index}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            p: 1,
                                            backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                            borderRadius: 1
                                        }}
                                    >
                                        <Typography variant="body2" noWrap>
                                            {query.query}
                                        </Typography>
                                        <Chip
                                            label={query.count}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                        />
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    )}
                </CardContent>
            </Card>
        );
    };

    return (
        <Box className={className} sx={{ maxHeight }}>
            {/* En-tête */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HistoryIcon color="primary" />
                        <Typography variant="h6">
                            Historique des recherches
                        </Typography>
                        {history.length > 0 && (
                            <Chip
                                label={history.length}
                                color="primary"
                                size="small"
                            />
                        )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {selectedHistory.length > 0 && (
                            <Button
                                size="small"
                                startIcon={<ClearIcon />}
                                onClick={handleClearSelection}
                            >
                                Effacer sélection ({selectedHistory.length})
                            </Button>
                        )}

                        <Button
                            size="small"
                            startIcon={<ClearAllIcon />}
                            onClick={handleClearAll}
                            disabled={history.length === 0}
                        >
                            Tout effacer
                        </Button>
                    </Box>
                </Box>

                {selectedHistory.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                        <FormControl size="small">
                            <InputLabel>Actions sur la sélection</InputLabel>
                            <Select
                                value=""
                                label="Actions sur la sélection"
                                onChange={(e) => {
                                    const action = e.target.value;
                                    if (action === 'delete' && onSearchDelete) {
                                        selectedHistory.forEach(id => {
                                            const item = history.find(h => h.id === id);
                                            if (item) onSearchDelete(item);
                                        });
                                    }
                                    setSelectedHistory([]);
                                }}
                            >
                                <MenuItem value="delete">Supprimer</MenuItem>
                                <MenuItem value="export">Exporter</MenuItem>
                                <MenuItem value="bookmark">Marquer</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                )}
            </Paper>

            {/* Analytics */}
            {showAnalytics && <AnalyticsCard />}

            {/* Liste de l'historique */}
            {history.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <HistoryIcon fontSize="large" color="disabled" sx={{ mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                        Aucun historique de recherche
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Vos recherches précédentes apparaîtront ici
                    </Typography>
                </Paper>
            ) : (
                <Paper sx={{ maxHeight: maxHeight, overflow: 'auto' }}>
                    <List>
                        <AnimatePresence>
                            {history.map((item, index) => (
                                <HistoryItem
                                    key={item.id || `${item.query}-${item.timestamp}`}
                                    item={item}
                                    index={index}
                                />
                            ))}
                        </AnimatePresence>
                    </List>
                </Paper>
            )}

            {/* Menu contextuel */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => {
                    handleItemSelect(selectedItem);
                    handleMenuClose();
                }}>
                    <SearchIcon sx={{ mr: 1 }} />
                    Rechercher
                </MenuItem>

                {onSearchBookmark && (
                    <MenuItem onClick={() => {
                        onSearchBookmark(selectedItem);
                        handleMenuClose();
                    }}>
                        <BookmarkIcon sx={{ mr: 1 }} />
                        {selectedItem?.bookmarked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    </MenuItem>
                )}

                <MenuItem onClick={() => {
                    handleEditClick(selectedItem);
                    handleMenuClose();
                }}>
                    <EditIcon sx={{ mr: 1 }} />
                    Modifier
                </MenuItem>

                {showExport && onSearchExport && (
                    <MenuItem onClick={() => {
                        onSearchExport([selectedItem]);
                        handleMenuClose();
                    }}>
                        <ExportIcon sx={{ mr: 1 }} />
                        Exporter
                    </MenuItem>
                )}

                <Divider />

                <MenuItem
                    onClick={() => {
                        handleDeleteClick(selectedItem);
                        handleMenuClose();
                    }}
                    sx={{ color: 'error.main' }}
                >
                    <DeleteIcon sx={{ mr: 1 }} />
                    Supprimer
                </MenuItem>
            </Menu>

            {/* Dialog de confirmation de suppression */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirmer la suppression</DialogTitle>
                <DialogContent>
                    <Typography>
                        Êtes-vous sûr de vouloir supprimer cette recherche de l'historique ?
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        "{itemToDelete?.query}"
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>
                        Annuler
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        color="error"
                        variant="contained"
                    >
                        Supprimer
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog d'édition */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Modifier la recherche</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1 }}>
                        <TextField
                            fullWidth
                            label="Nom"
                            value={editForm.name}
                            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            margin="normal"
                        />
                        <TextField
                            fullWidth
                            label="Tags (séparés par des virgules)"
                            value={editForm.tags}
                            onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                            margin="normal"
                            placeholder="ex: urgent, important, travail"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>
                        Annuler
                    </Button>
                    <Button
                        onClick={handleEditConfirm}
                        variant="contained"
                        disabled={!editForm.name.trim()}
                    >
                        Sauvegarder
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default React.memo(SearchHistory);
