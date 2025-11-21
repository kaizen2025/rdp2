// src/components/loan-management/LoanList.js - LISTE DES PRÊTS AVEC ALERTES INTÉGRÉES
// Composant principal de gestion des prêts avec système d'alertes préventives

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    Chip,
    IconButton,
    Typography,
    Tooltip,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Checkbox,
    Avatar,
    LinearProgress,
    Alert,
    Button,
    TextField,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    Badge,
    Stack
} from '@mui/material';
import {
    Warning as WarningIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    Notifications as NotificationsIcon,
    NotificationsActive as NotificationsActiveIcon,
    Schedule as ScheduleIcon,
    Person as PersonIcon,
    Description as DocumentIcon,
    Search as SearchIcon,
    FilterList as FilterIcon,
    Clear as ClearIcon,
    ViewList as ViewListIcon,
    ViewModule as ViewModuleIcon,
    Sort as SortIcon,
    Refresh as RefreshIcon,
    Settings as SettingsIcon
} from '@mui/icons-material';
import { format, differenceInDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// Import des services
import alertsService, { ALERT_LEVELS, ALERT_TYPES } from '../../services/alertsService';
import AlertSystem from '../alerts/AlertSystem';

// Configuration des statuts (compatible avec LoanListVirtualized)
const STATUS_CONFIG = {
    active: { label: 'Actif', color: 'success', priority: 1 },
    reserved: { label: 'Réservé', color: 'info', priority: 2 },
    overdue: { label: 'En retard', color: 'warning', priority: 3 },
    critical: { label: 'Critique', color: 'error', priority: 4 },
    returned: { label: 'Retourné', color: 'default', priority: 5 },
    cancelled: { label: 'Annulé', color: 'default', priority: 6 }
};

// 🎯 COMPOSANT D'INDICATEUR D'ALERTE DANS LE TABLEAU
const AlertIndicator = React.memo(({ loan, size = 'small' }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [alertStatus, setAlertStatus] = useState(null);

    useEffect(() => {
        if (loan) {
            const status = alertsService.calculateAlertStatus(loan);
            setAlertStatus(status);
        }
    }, [loan]);

    const handleMenuOpen = (event) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    if (!alertStatus || !alertStatus.level) {
        return (
            <Chip
                label="Normal"
                size={size}
                color="success"
                variant="outlined"
                icon={<InfoIcon />}
            />
        );
    }

    const getIcon = () => {
        switch (alertStatus.type) {
            case ALERT_TYPES.OVERDUE:
                return <ErrorIcon fontSize={size === 'small' ? 'small' : 'medium'} />;
            case ALERT_TYPES.CRITICAL:
                return <NotificationsActiveIcon fontSize={size === 'small' ? 'small' : 'medium'} />;
            case ALERT_TYPES.UPCOMING_24H:
                return <WarningIcon fontSize={size === 'small' ? 'small' : 'medium'} />;
            case ALERT_TYPES.UPCOMING_48H:
                return <ScheduleIcon fontSize={size === 'small' ? 'small' : 'medium'} />;
            default:
                return <InfoIcon fontSize={size === 'small' ? 'small' : 'medium'} />;
        }
    };

    const getColor = () => {
        return alertStatus.level.color;
    };

    const getLabel = () => {
        if (alertStatus.isOverdue) {
            const days = Math.abs(alertStatus.daysUntilReturn);
            return `Retard ${days}j`;
        } else if (alertStatus.daysUntilReturn === 0) {
            return 'Aujourd\'hui';
        } else if (alertStatus.daysUntilReturn === 1) {
            return 'Demain';
        } else {
            return `${alertStatus.daysUntilReturn}j`;
        }
    };

    return (
        <Box sx={{ position: 'relative' }}>
            <Chip
                label={getLabel()}
                size={size}
                color={getColor()}
                variant={alertStatus.level.level >= 3 ? 'filled' : 'outlined'}
                icon={getIcon()}
                onClick={handleMenuOpen}
                sx={{
                    cursor: 'pointer',
                    animation: alertStatus.level.level >= 3 ? 'pulse 2s infinite' : 'none',
                    '@keyframes pulse': {
                        '0%': { transform: 'scale(1)' },
                        '50%': { transform: 'scale(1.05)' },
                        '100%': { transform: 'scale(1)' }
                    }
                }}
            />

            {/* Menu contextuel */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    sx: { minWidth: 250 }
                }}
            >
                <Box sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Détails de l'alerte
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant="body2">
                            <strong>Type:</strong> {alertStatus.type}
                        </Typography>
                        <Typography variant="body2">
                            <strong>Niveau:</strong> {alertStatus.level.label}
                        </Typography>
                        <Typography variant="body2">
                            <strong>Échéance:</strong> {format(parseISO(loan.returnDate), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                        </Typography>

                        {alertStatus.isOverdue && (
                            <Alert severity="error" sx={{ mt: 1 }}>
                                Ce prêt est en retard !
                            </Alert>
                        )}
                    </Box>

                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ScheduleIcon />}
                            onClick={() => {
                                handleMenuClose();
                                // Action de prolongation
                            }}
                        >
                            Prolonger
                        </Button>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<NotificationsActiveIcon />}
                            onClick={() => {
                                handleMenuClose();
                                // Action de rappel
                            }}
                        >
                            Rappeler
                        </Button>
                    </Stack>
                </Box>
            </Menu>
        </Box>
    );
});

// 🔄 COMPOSANT DE LIGNE DE PRÊT AVEC ALERTES
const LoanRow = React.memo(({
    loan,
    isSelected,
    onSelect,
    onReturn,
    onEdit,
    onExtend,
    onHistory,
    onCancel,
    sortConfig,
    onSort,
    getUserColor,
    compact = false
}) => {
    const [anchorEl, setAnchorEl] = useState(null);

    const handleMenuOpen = (event) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleAction = (action) => {
        handleMenuClose();
        switch (action) {
            case 'return':
                onReturn(loan);
                break;
            case 'edit':
                onEdit(loan);
                break;
            case 'extend':
                onExtend(loan);
                break;
            case 'history':
                onHistory(loan);
                break;
            case 'cancel':
                onCancel(loan);
                break;
        }
    };

    const statusConfig = STATUS_CONFIG[loan.status] || STATUS_CONFIG.active;

    return (
        <TableRow
            hover
            selected={isSelected}
            sx={{
                cursor: 'pointer',
                '&:last-child td, &:last-child th': { border: 0 },
                backgroundColor: isSelected ? 'action.selected' : 'inherit'
            }}
            onClick={() => onSelect(loan)}
        >
            <TableCell padding="checkbox">
                <Checkbox
                    checked={isSelected}
                    onChange={(e) => onSelect(loan, e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                />
            </TableCell>

            {/* Document */}
            <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                        sx={{
                            width: compact ? 32 : 40,
                            height: compact ? 32 : 40,
                            bgcolor: getUserColor(loan.borrowerId)
                        }}
                    >
                        <DocumentIcon fontSize={compact ? 'small' : 'medium'} />
                    </Avatar>
                    <Box>
                        <Typography variant={compact ? 'body2' : 'body1'} sx={{ fontWeight: 'bold' }}>
                            {loan.documentTitle || 'Document'}
                        </Typography>
                        {!compact && (
                            <Typography variant="caption" color="text.secondary">
                                {loan.documentType || 'Type'}
                            </Typography>
                        )}
                    </Box>
                </Box>
            </TableCell>

            {/* Emprunteur */}
            <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                        sx={{
                            width: compact ? 28 : 32,
                            height: compact ? 28 : 32,
                            bgcolor: getUserColor(loan.borrowerId)
                        }}
                    >
                        <PersonIcon fontSize={compact ? 'small' : 'small'} />
                    </Avatar>
                    <Box>
                        <Typography variant={compact ? 'body2' : 'body1'}>
                            {loan.borrowerName || 'Utilisateur'}
                        </Typography>
                        {!compact && (
                            <Typography variant="caption" color="text.secondary">
                                {loan.borrowerEmail || loan.borrowerId}
                            </Typography>
                        )}
                    </Box>
                </Box>
            </TableCell>

            {/* Date d'emprunt */}
            <TableCell>
                <Typography variant={compact ? 'body2' : 'body1'}>
                    {format(parseISO(loan.loanDate), 'dd/MM/yy', { locale: fr })}
                </Typography>
                {!compact && (
                    <Typography variant="caption" color="text.secondary">
                        {format(parseISO(loan.loanDate), 'HH:mm', { locale: fr })}
                    </Typography>
                )}
            </TableCell>

            {/* Date de retour */}
            <TableCell>
                <Typography variant={compact ? 'body2' : 'body1'}>
                    {format(parseISO(loan.returnDate), 'dd/MM/yy', { locale: fr })}
                </Typography>
                {!compact && (
                    <Typography variant="caption" color="text.secondary">
                        {format(parseISO(loan.returnDate), 'HH:mm', { locale: fr })}
                    </Typography>
                )}
            </TableCell>

            {/* Statut */}
            <TableCell>
                <Chip
                    label={statusConfig.label}
                    color={statusConfig.color}
                    variant="outlined"
                    size={compact ? 'small' : 'medium'}
                />
            </TableCell>

            {/* Alerte/Statut d'expiration */}
            <TableCell>
                <AlertIndicator loan={loan} size={compact ? 'small' : 'medium'} />
            </TableCell>

            {/* Actions */}
            <TableCell align="right">
                <IconButton
                    size={compact ? 'small' : 'medium'}
                    onClick={handleMenuOpen}
                >
                    <SettingsIcon />
                </IconButton>

                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                >
                    <MenuItem onClick={() => handleAction('return')}>
                        <ListItemIcon>
                            <ScheduleIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Marquer retourné</ListItemText>
                    </MenuItem>

                    <MenuItem onClick={() => handleAction('extend')}>
                        <ListItemIcon>
                            <ScheduleIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Prolonger</ListItemText>
                    </MenuItem>

                    <MenuItem onClick={() => handleAction('edit')}>
                        <ListItemIcon>
                            <SettingsIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Modifier</ListItemText>
                    </MenuItem>

                    <MenuItem onClick={() => handleAction('history')}>
                        <ListItemIcon>
                            <InfoIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Historique</ListItemText>
                    </MenuItem>

                    <MenuItem onClick={() => handleAction('cancel')}>
                        <ListItemIcon>
                            <ErrorIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Annuler</ListItemText>
                    </MenuItem>
                </Menu>
            </TableCell>
        </TableRow>
    );
});

// 📊 COMPOSANT DE STATUT D'ALERTE GLOBALE
const GlobalAlertStatus = React.memo(({ loans }) => {
    const alertStats = useMemo(() => {
        const stats = {
            total: 0,
            overdue: 0,
            critical: 0,
            upcoming24h: 0,
            upcoming48h: 0
        };

        loans.forEach(loan => {
            const alertStatus = alertsService.calculateAlertStatus(loan);
            if (alertStatus) {
                stats.total++;
                switch (alertStatus.type) {
                    case ALERT_TYPES.OVERDUE:
                        stats.overdue++;
                        break;
                    case ALERT_TYPES.CRITICAL:
                        stats.critical++;
                        break;
                    case ALERT_TYPES.UPCOMING_24H:
                        stats.upcoming24h++;
                        break;
                    case ALERT_TYPES.UPCOMING_48H:
                        stats.upcoming48h++;
                        break;
                }
            }
        });

        return stats;
    }, [loans]);

    if (alertStats.total === 0) {
        return (
            <Alert severity="success" sx={{ mb: 2 }}>
                ✅ Aucune alerte active. Tous les prêts sont dans les temps.
            </Alert>
        );
    }

    return (
        <Alert
            severity={alertStats.overdue > 0 ? 'error' : alertStats.critical > 0 ? 'warning' : 'info'}
            sx={{ mb: 2 }}
            action={
                <Button
                    color="inherit"
                    size="small"
                    onClick={() => alertsService.processLoansForAlerts(loans)}
                >
                    Actualiser
                </Button>
            }
        >
            {alertStats.overdue > 0 && `🚨 ${alertStats.overdue} prêt${alertStats.overdue > 1 ? 's' : ''} en retard`}
            {alertStats.critical > 0 && `${alertStats.overdue > 0 ? ' • ' : ''}⚠️ ${alertStats.critical} critique${alertStats.critical > 1 ? 's' : ''}`}
            {alertStats.upcoming24h > 0 && `${(alertStats.overdue + alertStats.critical) > 0 ? ' • ' : ''}⏰ ${alertStats.upcoming24h} expire${alertStats.upcoming24h > 1 ? 'nt' : ''} demain`}
            {alertStats.upcoming48h > 0 && `${(alertStats.overdue + alertStats.critical + alertStats.upcoming24h) > 0 ? ' • ' : ''}📅 ${alertStats.upcoming48h} expire${alertStats.upcoming48h > 1 ? 'nt' : ''} dans 48h`}
        </Alert>
    );
});

// 🎨 COMPOSANT PRINCIPAL LOANLIST
const LoanList = ({
    loans = [],
    selectedLoans = new Set(),
    onSelectLoan,
    onReturn,
    onEdit,
    onExtend,
    onHistory,
    onCancel,
    getUserColor = (id) => `hsl(${Math.abs(hashCode(id)) % 360}, 70%, 50%)`,
    sortConfig = { field: 'loanDate', direction: 'desc' },
    onSort,
    showAlerts = true,
    showStatistics = true,
    compact = false
}) => {
    // États locaux
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [alertFilter, setAlertFilter] = useState('');
    const [alertsData, setAlertsData] = useState([]);

    // Chargement des alertes
    useEffect(() => {
        setAlertsData(alertsService.getStoredNotifications());
    }, [loans]);

    // Écouteurs d'événements d'alertes
    useEffect(() => {
        const handleNewAlert = () => {
            setAlertsData(alertsService.getStoredNotifications());
        };

        window.addEventListener('docucortex-new-alert', handleNewAlert);
        window.addEventListener('docucortex-alert-deleted', handleNewAlert);

        return () => {
            window.removeEventListener('docucortex-new-alert', handleNewAlert);
            window.removeEventListener('docucortex-alert-deleted', handleNewAlert);
        };
    }, []);

    // Filtrage standard (sans SmartSearch)
    const filteredLoans = useMemo(() => {
        let filtered = loans;

        // Filtre texte simple
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(loan =>
                (loan.documentTitle && loan.documentTitle.toLowerCase().includes(lowerTerm)) ||
                (loan.borrowerName && loan.borrowerName.toLowerCase().includes(lowerTerm)) ||
                (loan.documentType && loan.documentType.toLowerCase().includes(lowerTerm))
            );
        }

        // Filtre statut
        if (statusFilter) {
            filtered = filtered.filter(loan => loan.status === statusFilter);
        }

        // Filtre alertes
        if (alertFilter) {
            filtered = filtered.filter(loan => {
                const alertStatus = alertsService.calculateAlertStatus(loan);
                if (!alertStatus) return alertFilter === 'none';

                switch (alertFilter) {
                    case 'overdue':
                        return alertStatus.isOverdue;
                    case 'critical':
                        return alertStatus.level.level === 4;
                    case 'high':
                        return alertStatus.level.level === 3;
                    case 'medium':
                        return alertStatus.level.level === 2;
                    case 'low':
                        return alertStatus.level.level === 1;
                    default:
                        return true;
                }
            });
        }

        return filtered;
    }, [loans, searchTerm, statusFilter, alertFilter]);

    // Gestionnaires d'événements
    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleStatusFilterChange = (event) => {
        setStatusFilter(event.target.value);
    };

    const handleAlertFilterChange = (event) => {
        setAlertFilter(event.target.value);
    };

    const handleSelectAll = (event) => {
        if (event.target.checked) {
            const newSelected = new Set(filteredLoans.map(loan => loan.id));
            onSelectLoan(newSelected);
        } else {
            onSelectLoan(new Set());
        }
    };

    const handleSelectLoan = (loan, isSelected) => {
        const newSelected = new Set(selectedLoans);
        if (isSelected) {
            newSelected.add(loan.id);
        } else {
            newSelected.delete(loan.id);
        }
        onSelectLoan(newSelected);
    };

    const handleSort = (field) => {
        const isAsc = sortConfig.field === field && sortConfig.direction === 'asc';
        onSort({
            field,
            direction: isAsc ? 'desc' : 'asc'
        });
    };

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        setAlertFilter('');
    };

    // Helper pour hashCode (manquant dans le code original mais utilisé)
    const hashCode = (str) => {
        let hash = 0;
        if (!str) return hash;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    };

    return (
        <Box sx={{ width: '100%' }}>
            {/* Système d'alertes intégré */}
            {showAlerts && (
                <Box sx={{ mb: 3 }}>
                    <AlertSystem
                        loans={loans}
                        embedded={true}
                        showStatistics={false}
                        onLoanAction={(action, loanId) => {
                            const loan = loans.find(l => l.id === loanId);
                            if (loan) {
                                switch (action) {
                                    case 'extend':
                                        onExtend(loan);
                                        break;
                                    case 'recall':
                                        // Action de rappel
                                        console.log('Rappel envoyé pour', loanId);
                                        break;
                                    case 'view':
                                        onEdit(loan);
                                        break;
                                }
                            }
                        }}
                    />
                </Box>
            )}

            {/* Statut global des alertes */}
            {showStatistics && <GlobalAlertStatus loans={loans} />}

            {/* Contrôles et filtres */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                    <TextField
                        placeholder="Recherche rapide..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        size="small"
                        sx={{ minWidth: 250 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            )
                        }}
                    />

                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Statut</InputLabel>
                        <Select
                            value={statusFilter}
                            label="Statut"
                            onChange={handleStatusFilterChange}
                        >
                            <MenuItem value="">Tous</MenuItem>
                            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                <MenuItem key={key} value={key}>
                                    {config.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Alerte</InputLabel>
                        <Select
                            value={alertFilter}
                            label="Alerte"
                            onChange={handleAlertFilterChange}
                        >
                            <MenuItem value="">Toutes</MenuItem>
                            <MenuItem value="overdue">En retard</MenuItem>
                            <MenuItem value="critical">Critique</MenuItem>
                            <MenuItem value="high">Élevée</MenuItem>
                            <MenuItem value="medium">Moyenne</MenuItem>
                            <MenuItem value="low">Faible</MenuItem>
                            <MenuItem value="none">Aucune</MenuItem>
                        </Select>
                    </FormControl>

                    {(searchTerm || statusFilter || alertFilter) && (
                        <Button
                            size="small"
                            startIcon={<ClearIcon />}
                            onClick={clearFilters}
                        >
                            Effacer filtres
                        </Button>
                    )}
                </Box>
            </Paper>

            {/* Tableau des prêts */}
            <TableContainer component={Paper}>
                <Table size={compact ? 'small' : 'medium'}>
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox">
                                <Checkbox
                                    indeterminate={selectedLoans.size > 0 && selectedLoans.size < filteredLoans.length}
                                    checked={filteredLoans.length > 0 && selectedLoans.size === filteredLoans.length}
                                    onChange={handleSelectAll}
                                />
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={sortConfig.field === 'documentTitle'}
                                    direction={sortConfig.field === 'documentTitle' ? sortConfig.direction : 'asc'}
                                    onClick={() => handleSort('documentTitle')}
                                >
                                    Document
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={sortConfig.field === 'borrowerName'}
                                    direction={sortConfig.field === 'borrowerName' ? sortConfig.direction : 'asc'}
                                    onClick={() => handleSort('borrowerName')}
                                >
                                    Emprunteur
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={sortConfig.field === 'loanDate'}
                                    direction={sortConfig.field === 'loanDate' ? sortConfig.direction : 'asc'}
                                    onClick={() => handleSort('loanDate')}
                                >
                                    Date Prêt
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={sortConfig.field === 'returnDate'}
                                    direction={sortConfig.field === 'returnDate' ? sortConfig.direction : 'asc'}
                                    onClick={() => handleSort('returnDate')}
                                >
                                    Retour Prévu
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>Statut</TableCell>
                            <TableCell>Alerte</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredLoans.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                                    <Typography variant="body1" color="text.secondary">
                                        Aucun prêt trouvé
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredLoans.map((loan) => (
                                <LoanRow
                                    key={loan.id}
                                    loan={loan}
                                    isSelected={selectedLoans.has(loan.id)}
                                    onSelect={handleSelectLoan}
                                    onReturn={onReturn}
                                    onEdit={onEdit}
                                    onExtend={onExtend}
                                    onHistory={onHistory}
                                    onCancel={onCancel}
                                    sortConfig={sortConfig}
                                    onSort={onSort}
                                    getUserColor={getUserColor}
                                    compact={compact}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default LoanList;