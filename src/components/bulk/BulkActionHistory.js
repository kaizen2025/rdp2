// src/components/bulk/BulkActionHistory.js
// Historique complet des actions groupées avec recherche, filtrage et export

import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
    Chip,
    IconButton,
    Tooltip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Paper,
    Divider,
    Stack,
    Card,
    CardContent,
    Tab,
    Tabs,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Badge,
    Alert,
    Pagination,
    CircularProgress,
    InputAdornment,
    Grid
} from '@mui/material';
import {
    History as HistoryIcon,
    Extension as ExtendIcon,
    Email as EmailIcon,
    SwapHoriz as TransferIcon,
    Flag as StatusIcon,
    Download as ExportIcon,
    Delete as DeleteIcon,
    ExpandMore as ExpandMoreIcon,
    Search as SearchIcon,
    FilterList as FilterIcon,
    Sort as SortIcon,
    Refresh as RefreshIcon,
    CheckCircle as SuccessIcon,
    Error as ErrorIcon,
    Schedule as PendingIcon,
    Person as PersonIcon,
    Description as DocumentIcon,
    GetApp as DownloadIcon,
    Timeline as TimelineIcon,
    Analytics as AnalyticsIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
    DeleteOutline as ClearIcon,
    Print as PrintIcon,
    Share as ShareIcon
} from '@mui/icons-material';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// Configuration des types d'actions
const ACTION_TYPES = {
    EXTEND: {
        id: 'EXTEND',
        label: 'Prolongation',
        icon: <ExtendIcon color="primary" />,
        color: 'primary'
    },
    RECALL: {
        id: 'RECALL',
        label: 'Rappel',
        icon: <EmailIcon color="warning" />,
        color: 'warning'
    },
    TRANSFER: {
        id: 'TRANSFER',
        label: 'Transfert',
        icon: <TransferIcon color="info" />,
        color: 'info'
    },
    STATUS_CHANGE: {
        id: 'STATUS_CHANGE',
        label: 'Changement de statut',
        icon: <StatusIcon color="secondary" />,
        color: 'secondary'
    },
    EXPORT: {
        id: 'EXPORT',
        label: 'Export',
        icon: <ExportIcon color="success" />,
        color: 'success'
    },
    DELETE: {
        id: 'DELETE',
        label: 'Suppression',
        icon: <DeleteIcon color="error" />,
        color: 'error'
    }
};

const STATUS_COLORS = {
    completed: 'success',
    failed: 'error',
    cancelled: 'warning',
    in_progress: 'info'
};

// Service de l'historique (simulation)
class BulkActionHistoryService {
    static async getHistory(filters = {}, page = 1, limit = 10) {
        // Simulation de données - en production, ceci ferait un appel API
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockData = this.generateMockData();
        let filteredData = mockData;

        // Application des filtres
        if (filters.actionType) {
            filteredData = filteredData.filter(item => item.actionType === filters.actionType);
        }
        if (filters.status) {
            filteredData = filteredData.filter(item => item.status === filters.status);
        }
        if (filters.userId) {
            filteredData = filteredData.filter(item => item.userId === filters.userId);
        }
        if (filters.dateFrom) {
            filteredData = filteredData.filter(item => item.timestamp >= filters.dateFrom);
        }
        if (filters.dateTo) {
            filteredData = filteredData.filter(item => item.timestamp <= filters.dateTo);
        }
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filteredData = filteredData.filter(item => 
                item.id.toLowerCase().includes(searchTerm) ||
                item.actionType.toLowerCase().includes(searchTerm) ||
                item.userName.toLowerCase().includes(searchTerm)
            );
        }

        // Pagination
        const total = filteredData.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = filteredData.slice(startIndex, endIndex);

        return {
            data: paginatedData,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    static generateMockData() {
        const data = [];
        const users = [
            { id: 'user1', name: 'Jean Dupont', email: 'jean.dupont@exemple.fr' },
            { id: 'user2', name: 'Marie Martin', email: 'marie.martin@exemple.fr' },
            { id: 'user3', name: 'Pierre Durand', email: 'pierre.durand@exemple.fr' }
        ];

        const statuses = ['completed', 'failed', 'cancelled'];
        const actionTypes = Object.keys(ACTION_TYPES);

        for (let i = 0; i < 150; i++) {
            const randomUser = users[Math.floor(Math.random() * users.length)];
            const randomAction = actionTypes[Math.floor(Math.random() * actionTypes.length)];
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
            const daysAgo = Math.floor(Math.random() * 30);
            const timestamp = new Date();
            timestamp.setDate(timestamp.getDate() - daysAgo);

            data.push({
                id: `BULK_${Date.now()}_${i}`,
                actionType: randomAction,
                status: randomStatus,
                timestamp: timestamp.toISOString(),
                userId: randomUser.id,
                userName: randomUser.name,
                userEmail: randomUser.email,
                parameters: this.generateMockParameters(randomAction),
                result: this.generateMockResult(randomStatus, randomAction),
                affectedItems: Math.floor(Math.random() * 50) + 1,
                duration: Math.floor(Math.random() * 300000) + 5000, // 5s à 5min
                ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
                userAgent: 'Mozilla/5.0 (compatible; DocuCortex/1.0)',
                auditTrail: this.generateAuditTrail(randomStatus)
            });
        }

        return data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    static generateMockParameters(actionType) {
        const parameters = {};
        
        switch (actionType) {
            case 'EXTEND':
                parameters.days = Math.floor(Math.random() * 30) + 1;
                break;
            case 'RECALL':
                parameters.message = 'Rappel automatique de retour de document';
                break;
            case 'TRANSFER':
                parameters.targetUser = 'user2';
                parameters.reason = 'Changement de service';
                break;
            case 'STATUS_CHANGE':
                parameters.newStatus = 'returned';
                parameters.reason = 'Retour confirmé';
                break;
            case 'EXPORT':
                parameters.format = 'csv';
                parameters.fields = ['id', 'documentTitle', 'borrowerName'];
                break;
            case 'DELETE':
                parameters.confirmation = true;
                parameters.reason = 'Nettoyage de données';
                break;
        }
        
        return parameters;
    }

    static generateMockResult(status, actionType) {
        const baseCount = Math.floor(Math.random() * 50) + 1;
        
        if (status === 'completed') {
            return {
                successful: baseCount,
                failed: 0,
                successRate: 100,
                errors: [],
                warnings: []
            };
        } else if (status === 'failed') {
            return {
                successful: Math.floor(baseCount * 0.7),
                failed: Math.ceil(baseCount * 0.3),
                successRate: 70,
                errors: Array.from({ length: 3 }, (_, i) => ({
                    loanId: `PRÊT_${i + 1}`,
                    error: `Erreur de traitement ${i + 1}`
                })),
                warnings: []
            };
        } else { // cancelled
            return {
                successful: Math.floor(baseCount * 0.4),
                failed: Math.ceil(baseCount * 0.6),
                successRate: 40,
                errors: Array.from({ length: 5 }, (_, i) => ({
                    loanId: `PRÊT_${i + 1}`,
                    error: `Opération annulée ${i + 1}`
                })),
                warnings: ['Action annulée par l\'utilisateur']
            };
        }
    }

    static generateAuditTrail(status) {
        const trail = [
            { timestamp: new Date().toISOString(), action: 'action_initiated', user: 'system' },
            { timestamp: new Date(Date.now() - 1000).toISOString(), action: 'validation_started', user: 'system' }
        ];

        if (status === 'completed') {
            trail.push({ timestamp: new Date(Date.now() - 500).toISOString(), action: 'action_completed', user: 'system' });
        } else if (status === 'failed') {
            trail.push({ timestamp: new Date(Date.now() - 300).toISOString(), action: 'validation_failed', user: 'system' });
        } else {
            trail.push({ timestamp: new Date(Date.now() - 200).toISOString(), action: 'action_cancelled', user: 'user' });
        }

        return trail;
    }
}

const BulkActionHistory = ({
    open,
    onClose,
    loans = [],
    currentUser = {},
    onExportHistory = null,
    className
}) => {
    // États principaux
    const [selectedTab, setSelectedTab] = useState(0);
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // États de filtrage
    const [filters, setFilters] = useState({
        actionType: '',
        status: '',
        userId: '',
        dateFrom: '',
        dateTo: '',
        search: ''
    });
    const [sortConfig, setSortConfig] = useState({ field: 'timestamp', direction: 'desc' });

    // Chargement de l'historique
    const loadHistory = async (newFilters = filters, page = currentPage) => {
        setLoading(true);
        try {
            const result = await BulkActionHistoryService.getHistory(newFilters, page, 10);
            setHistoryData(result.data);
            setTotalPages(result.totalPages);
            setTotalItems(result.total);
        } catch (error) {
            console.error('Erreur lors du chargement de l\'historique:', error);
        } finally {
            setLoading(false);
        }
    };

    // Chargement initial
    useEffect(() => {
        if (open) {
            loadHistory();
        }
    }, [open]);

    // Gestionnaires d'événements
    const handleTabChange = (event, newValue) => {
        setSelectedTab(newValue);
    };

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        setCurrentPage(1);
        loadHistory(newFilters, 1);
    };

    const handleSort = (field) => {
        const newDirection = sortConfig.field === field && sortConfig.direction === 'desc' ? 'asc' : 'desc';
        setSortConfig({ field, direction: newDirection });
    };

    const handlePageChange = (event, page) => {
        setCurrentPage(page);
        loadHistory(filters, page);
    };

    const handleExport = (format) => {
        if (onExportHistory) {
            onExportHistory(historyData, format);
        } else {
            // Export par défaut
            const dataStr = JSON.stringify(historyData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `historique_actions_${format(new Date(), 'yyyy-MM-dd')}.json`;
            link.click();
            URL.revokeObjectURL(url);
        }
    };

    const clearFilters = () => {
        const emptyFilters = {
            actionType: '',
            status: '',
            userId: '',
            dateFrom: '',
            dateTo: '',
            search: ''
        };
        setFilters(emptyFilters);
        setCurrentPage(1);
        loadHistory(emptyFilters, 1);
    };

    // Statistiques de l'historique
    const statistics = useMemo(() => {
        const stats = {
            total: historyData.length,
            completed: historyData.filter(item => item.status === 'completed').length,
            failed: historyData.filter(item => item.status === 'failed').length,
            cancelled: historyData.filter(item => item.status === 'cancelled').length,
            totalAffected: historyData.reduce((sum, item) => sum + item.affectedItems, 0)
        };
        stats.successRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
        return stats;
    }, [historyData]);

    if (!open) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xl"
            fullWidth
            PaperProps={{
                sx: { minHeight: '80vh' }
            }}
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <HistoryIcon color="primary" />
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            Historique des actions groupées
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Suivi et analyse des opérations groupées effectuées
                        </Typography>
                    </Box>
                    
                    <Stack direction="row" spacing={1}>
                        <Button
                            size="small"
                            startIcon={<DownloadIcon />}
                            onClick={() => handleExport('json')}
                        >
                            Exporter JSON
                        </Button>
                        <Button
                            size="small"
                            startIcon={<PrintIcon />}
                            onClick={() => handleExport('print')}
                        >
                            Imprimer
                        </Button>
                    </Stack>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ pt: 2 }}>
                {/* Statistiques rapides */}
                <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                    <Typography variant="h6" gutterBottom>
                        Vue d'ensemble
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        <Chip
                            label={`${statistics.total} actions`}
                            color="inherit"
                            variant="filled"
                        />
                        <Chip
                            icon={<SuccessIcon />}
                            label={`${statistics.completed} réussies`}
                            color="inherit"
                            variant="filled"
                        />
                        <Chip
                            icon={<ErrorIcon />}
                            label={`${statistics.failed} échouées`}
                            color="inherit"
                            variant="filled"
                        />
                        <Chip
                            icon={<ScheduleIcon />}
                            label={`${statistics.cancelled} annulées`}
                            color="inherit"
                            variant="filled"
                        />
                        <Chip
                            label={`${statistics.successRate}% succès`}
                            color="inherit"
                            variant="outlined"
                        />
                        <Chip
                            label={`${statistics.totalAffected} éléments traités`}
                            color="inherit"
                            variant="outlined"
                        />
                    </Box>
                </Paper>

                {/* Filtres et recherche */}
                <Paper sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                        <TextField
                            size="small"
                            placeholder="Rechercher..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                )
                            }}
                            sx={{ minWidth: 250 }}
                        />

                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Type d'action</InputLabel>
                            <Select
                                value={filters.actionType}
                                onChange={(e) => handleFilterChange('actionType', e.target.value)}
                                label="Type d'action"
                            >
                                <MenuItem value="">Tous</MenuItem>
                                {Object.entries(ACTION_TYPES).map(([key, action]) => (
                                    <MenuItem key={key} value={key}>
                                        {action.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>Statut</InputLabel>
                            <Select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                label="Statut"
                            >
                                <MenuItem value="">Tous</MenuItem>
                                <MenuItem value="completed">Terminé</MenuItem>
                                <MenuItem value="failed">Échoué</MenuItem>
                                <MenuItem value="cancelled">Annulé</MenuItem>
                            </Select>
                        </FormControl>

                        <Button
                            size="small"
                            startIcon={<ClearIcon />}
                            onClick={clearFilters}
                        >
                            Effacer
                        </Button>
                    </Box>

                    {/* Table de l'historique */}
                    <TableContainer component={Paper} variant="outlined">
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>
                                        <Button
                                            size="small"
                                            onClick={() => handleSort('timestamp')}
                                            startIcon={<SortIcon />}
                                        >
                                            Date/Heure
                                        </Button>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            size="small"
                                            onClick={() => handleSort('actionType')}
                                            startIcon={<SortIcon />}
                                        >
                                            Action
                                        </Button>
                                    </TableCell>
                                    <TableCell>Utilisateur</TableCell>
                                    <TableCell align="right">
                                        <Button
                                            size="small"
                                            onClick={() => handleSort('affectedItems')}
                                            startIcon={<SortIcon />}
                                        >
                                            Éléments
                                        </Button>
                                    </TableCell>
                                    <TableCell>Résultat</TableCell>
                                    <TableCell>Durée</TableCell>
                                    <TableCell align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                            <CircularProgress />
                                            <Typography variant="body2" sx={{ mt: 1 }}>
                                                Chargement de l'historique...
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : historyData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                            <Alert severity="info">
                                                Aucune action trouvée avec les filtres actuels.
                                            </Alert>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    historyData.map((item) => (
                                        <HistoryRow
                                            key={item.id}
                                            item={item}
                                            onViewDetails={() => {
                                                // TODO: Implémenter la vue détaillée
                                                console.log('Voir détails de:', item.id);
                                            }}
                                        />
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <Pagination
                                count={totalPages}
                                page={currentPage}
                                onChange={handlePageChange}
                                color="primary"
                                showFirstButton
                                showLastButton
                            />
                        </Box>
                    )}
                </Paper>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={onClose}>
                    Fermer
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// Composant ligne d'historique
const HistoryRow = ({ item, onViewDetails }) => {
    const [expanded, setExpanded] = useState(false);
    const actionConfig = ACTION_TYPES[item.actionType] || ACTION_TYPES.EXTEND;
    const statusColor = STATUS_COLORS[item.status] || 'default';

    const formatDuration = (milliseconds) => {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}s`;
        }
        return `${remainingSeconds}s`;
    };

    return (
        <>
            <TableRow hover>
                <TableCell>
                    <Typography variant="body2">
                        {format(parseISO(item.timestamp), 'dd/MM/yyyy', { locale: fr })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {format(parseISO(item.timestamp), 'HH:mm:ss', { locale: fr })}
                    </Typography>
                </TableCell>

                <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {actionConfig.icon}
                        <Box>
                            <Typography variant="body2">
                                {actionConfig.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {item.id}
                            </Typography>
                        </Box>
                    </Box>
                </TableCell>

                <TableCell>
                    <Box>
                        <Typography variant="body2">
                            {item.userName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {item.userEmail}
                        </Typography>
                    </Box>
                </TableCell>

                <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {item.affectedItems}
                    </Typography>
                </TableCell>

                <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                            size="small"
                            label={item.status === 'completed' ? 'Terminé' : 
                                   item.status === 'failed' ? 'Échec' : 'Annulé'}
                            color={statusColor}
                            variant="outlined"
                        />
                        {item.result.successRate < 100 && (
                            <Chip
                                size="small"
                                label={`${item.result.successRate}%`}
                                color="warning"
                                variant="filled"
                            />
                        )}
                    </Stack>
                </TableCell>

                <TableCell>
                    <Typography variant="body2">
                        {formatDuration(item.duration)}
                    </Typography>
                </TableCell>

                <TableCell align="center">
                    <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                        {expanded ? <ExpandMoreIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                </TableCell>
            </TableRow>

            {/* Détails expandables */}
            <TableRow>
                <TableCell colSpan={7} sx={{ p: 0 }}>
                    <Collapse in={expanded}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Détails de l'action
                            </Typography>
                            
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                        Paramètres:
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                                        {JSON.stringify(item.parameters, null, 2)}
                                    </Typography>
                                </Grid>
                                
                                <Grid item xs={12} md={6}>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                        Résultat:
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                                        {JSON.stringify(item.result, null, 2)}
                                    </Typography>
                                </Grid>
                            </Grid>

                            {/* Audit trail */}
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    Historique d'exécution:
                                </Typography>
                                <List dense>
                                    {item.auditTrail.map((entry, index) => (
                                        <ListItem key={index} sx={{ py: 0.5 }}>
                                            <ListItemIcon sx={{ minWidth: 32 }}>
                                                <TimelineIcon fontSize="small" color="primary" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={`${entry.action} (${entry.user})`}
                                                secondary={format(parseISO(entry.timestamp), 'HH:mm:ss', { locale: fr })}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
};

export default React.memo(BulkActionHistory);