// src/components/loan-management/LoanListEnhanced.js - LISTE OPTIMISÉE AVEC VIRTUALISATION
// Version améliorée du composant LoanList original avec virtualisation automatique

import React, { useState, useMemo, useCallback } from 'react';
import {
    Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, Tooltip, IconButton, Grid, FormControl, InputLabel, Select, MenuItem, Button,
    Checkbox, Toolbar, Typography, Menu, Divider, ListItemIcon, ListItemText, Badge,
    TablePagination, LinearProgress, Alert, Switch, FormControlLabel
} from '@mui/material';
import {
    Edit as EditIcon, AssignmentReturn as AssignmentReturnIcon, Update as UpdateIcon,
    Cancel as CancelIcon, History as HistoryIcon, FilterListOff as FilterListOffIcon,
    Sort as SortIcon, FileDownload as FileDownloadIcon, Notifications as NotificationsIcon,
    CheckBox as CheckBoxIcon, CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon, Refresh as RefreshIcon,
    Speed as SpeedIcon, ViewList as ViewListIcon, ViewModule as ViewModuleIcon
} from '@mui/icons-material';

import { useApp } from '../../contexts/AppContext';
import { useCache } from '../../contexts/CacheContext';
import apiService from '../../services/apiService';

// Import des composants optimisés
import SearchInput from '../common/SearchInput';
import EmptyState from '../common/EmptyState';
import LoadingScreen from '../common/LoadingScreen';
import LoanDialog from '../LoanDialog';
import ReturnLoanDialog from '../ReturnLoanDialog';
import ExtendLoanDialog from '../ExtendLoanDialog';
import LoanHistoryDialog from '../LoanHistoryDialog';
import BulkActionsToolbar from '../BulkActionsToolbar';
import LoanListVirtualized from './LoanListVirtualized';

// Import des utilitaires
import { debounceSearch, createSearchDebouncer } from '../../utils/debounce';
import { usePerformanceMonitor } from '../../utils/PerformanceMonitor';

import { useUserColorManager, UserColorBadge } from './UserColorManager';

// Configuration des statuts (copie depuis LoanList.js original)
const STATUS_CONFIG = {
    active: { label: 'Actif', color: 'success', priority: 1 },
    reserved: { label: 'Réservé', color: 'info', priority: 2 },
    overdue: { label: 'En retard', color: 'warning', priority: 3 },
    critical: { label: 'Critique', color: 'error', priority: 4 },
    returned: { label: 'Retourné', color: 'default', priority: 5 },
    cancelled: { label: 'Annulé', color: 'default', priority: 6 },
};

const PRIORITY_SORT = { desc: 'desc', asc: 'asc' };
const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];
const VIRTUALIZATION_THRESHOLD = 100; // Seuil pour activer la virtualisation automatiquement

// 📅 FORMATERS (copiés depuis LoanList.js)
const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatAmount = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
};

// ✅ COMPOSANTS MÉMOÏSÉS OPTIMISÉS (améliorés)
const StatusChip = React.memo(({ status }) => {
    const config = STATUS_CONFIG[status] || { label: status, color: 'default', priority: 99 };
    return (
        <Chip 
            label={config.label} 
            color={config.color} 
            size="small" 
            variant="outlined"
            sx={{ 
                fontWeight: config.priority <= 2 ? 'bold' : 'normal',
                fontSize: '0.75rem'
            }} 
        />
    );
});

const CheckboxCell = React.memo(({ checked, onChange }) => (
    <Checkbox
        checked={checked}
        onChange={onChange}
        icon={<CheckBoxOutlineBlankIcon />}
        checkedIcon={<CheckBoxIcon />}
        size="small"
    />
));

// 🎯 RENDU DES LIGNES OPTIMISÉES
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
    const config = STATUS_CONFIG[loan.status] || {};
    const isOverdue = loan.status === 'overdue' || loan.status === 'critical';
    
    const handleRowClick = () => {
        if (!isSelected) {
            onSelect(loan.id);
        }
    };

    const cellPadding = compact ? 'checkbox' : 'normal';
    const fontSize = compact ? '0.75rem' : 'body2';
    const iconSize = compact ? 'small' : 'medium';

    return (
        <TableRow 
            hover 
            selected={isSelected}
            onClick={handleRowClick}
            sx={{ 
                cursor: 'pointer',
                '&:hover': {
                    backgroundColor: 'action.hover',
                    transform: compact ? 'none' : 'scale(1.01)',
                    transition: 'all 0.2s ease'
                }
            }}
        >
            <TableCell padding={cellPadding}>
                <CheckboxCell
                    checked={isSelected}
                    onChange={(e) => {
                        e.stopPropagation();
                        onSelect(loan.id, e.target.checked);
                    }}
                />
            </TableCell>
            <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: compact ? 0.5 : 1 }}>
                    <StatusChip status={loan.status} />
                    {isOverdue && (
                        <Tooltip title="Prêt en retard">
                            <Chip 
                                icon={<NotificationsIcon />}
                                label="Urgent"
                                size="small" 
                                color="error" 
                                sx={{ 
                                    ml: compact ? 0 : 1, 
                                    fontSize: compact ? '0.6rem' : '0.7rem',
                                    height: compact ? 20 : 24
                                }}
                            />
                        </Tooltip>
                    )}
                </Box>
            </TableCell>
            <TableCell>
                <Tooltip title={loan.computerName}>
                    <Typography variant={fontSize} noWrap sx={{ maxWidth: compact ? 100 : 150 }}>
                        {loan.computerName || 'N/A'}
                    </Typography>
                </Tooltip>
            </TableCell>
            <TableCell>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: compact ? 0.2 : 0.5 }}>
                    <UserColorBadge
                        userId={loan.userId}
                        userName={loan.userName}
                        displayName={loan.userDisplayName}
                        size={compact ? "small" : "small"}
                        showIcon={true}
                        style={{ fontSize: compact ? '0.65rem' : '0.75rem' }}
                    />
                    {loan.userDepartment && !compact && (
                        <Typography variant="caption" color="textSecondary">
                            {loan.userDepartment}
                        </Typography>
                    )}
                </Box>
            </TableCell>
            <TableCell>
                <Typography variant={fontSize}>{formatDate(loan.loanDate)}</Typography>
            </TableCell>
            <TableCell>
                <Typography variant={fontSize}>{formatDate(loan.expectedReturnDate)}</Typography>
                {isOverdue && (
                    <Typography variant="caption" color="error">
                        {Math.ceil((new Date() - new Date(loan.expectedReturnDate)) / (1000 * 60 * 60 * 24))} j de retard
                    </Typography>
                )}
            </TableCell>
            <TableCell align={compact ? "center" : "right"}>
                <Typography variant={fontSize}>{formatAmount(loan.amount)}</Typography>
            </TableCell>
            <TableCell align="center">
                <Box sx={{ display: 'flex', gap: compact ? 0.5 : 1, justifyContent: 'center' }}>
                    <Tooltip title="Retourner">
                        <IconButton size={iconSize} color="success" onClick={(e) => { e.stopPropagation(); onReturn(loan); }}>
                            <AssignmentReturnIcon fontSize={compact ? 'small' : 'medium'} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Modifier">
                        <IconButton size={iconSize} color="primary" onClick={(e) => { e.stopPropagation(); onEdit(loan); }}>
                            <EditIcon fontSize={compact ? 'small' : 'medium'} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Prolonger">
                        <IconButton size={iconSize} color="info" onClick={(e) => { e.stopPropagation(); onExtend(loan); }}>
                            <UpdateIcon fontSize={compact ? 'small' : 'medium'} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Historique">
                        <IconButton size={iconSize} onClick={(e) => { e.stopPropagation(); onHistory(loan); }}>
                            <HistoryIcon fontSize={compact ? 'small' : 'medium'} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Annuler">
                        <IconButton size={iconSize} color="error" onClick={(e) => { e.stopPropagation(); onCancel(loan); }}>
                            <CancelIcon fontSize={compact ? 'small' : 'medium'} />
                        </IconButton>
                    </Tooltip>
                </Box>
            </TableCell>
        </TableRow>
    );
});

// Header de tableau avec tri (optimisé)
const SortableTableCell = React.memo(({ label, sortKey, sortConfig, onSort, align = 'left' }) => {
    const isSorted = sortConfig.key === sortKey;
    const SortIconComponent = isSorted ? (sortConfig.direction === PRIORITY_SORT.asc ? '⬆️' : '⬇️') : '↕️';
    
    return (
        <TableCell 
            align={align}
            sx={{ 
                fontWeight: 'bold',
                cursor: 'pointer',
                '&:hover': { backgroundColor: 'action.hover' },
                fontSize: '0.875rem'
            }}
            onClick={onSort}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>{label}</span>
                <SortIcon fontSize="small" />
                <span style={{ fontSize: '0.7rem' }}>{SortIconComponent}</span>
            </Box>
        </TableCell>
    );
});

// 🎨 COMPOSANT PRINCIPAL OPTIMISÉ
const LoanListEnhanced = ({ 
    preFilter, 
    advancedFilters, 
    onFiltersChange,
    onExportRequest,
    onAnalyticsRequest,
    onNotificationsRequest,
    refreshTrigger = 0 
}) => {
    const { showNotification } = useApp();
    const { cache, isLoading, invalidate } = useCache();
    
    // 📊 Surveiller les performances
    const performanceData = usePerformanceMonitor('LoanListEnhanced');

    // États de filtre et tri
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState(preFilter || 'active_ongoing');
    const [sortConfig, setSortConfig] = useState({ key: 'status', direction: PRIORITY_SORT.asc });
    const [selectedLoans, setSelectedLoans] = useState(new Set());
    const [bulkActionMenu, setBulkActionMenu] = useState(null);
    
    // États de pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    
    // États de dialog
    const [dialog, setDialog] = useState({ type: null, data: null });
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // États de virtualisation
    const [forceVirtualization, setForceVirtualization] = useState(false);
    const [enableMetrics, setEnableMetrics] = useState(true);
    const [viewMode, setViewMode] = useState('auto'); // 'auto', 'virtualized', 'classic'

    // Statistiques en temps réel
    const [statistics, setStatistics] = useState({
        total: 0,
        active: 0,
        overdue: 0,
        critical: 0,
        returned: 0,
        cancelled: 0
    });

    // Données principales
    const { loans, computers, users, itStaff } = useMemo(() => ({
        loans: cache.loans || [],
        computers: cache.computers || [],
        users: Object.values(cache.excel_users || {}).flat(),
        itStaff: cache.config?.it_staff || [],
    }), [cache]);

    // Gestion des couleurs utilisateur
    const { getUserColor, getColoredUserList } = useUserColorManager(users);

    // Déterminer si on doit utiliser la virtualisation
    const shouldUseVirtualization = useMemo(() => {
        if (viewMode === 'virtualized') return true;
        if (viewMode === 'classic') return false;
        
        // Mode automatique basé sur le nombre d'éléments
        return loans.length > VIRTUALIZATION_THRESHOLD;
    }, [loans.length, viewMode]);

    // Calcul des statistiques (optimisé)
    const updateStatistics = useCallback(() => {
        const stats = {
            total: loans.length,
            active: loans.filter(l => l.status === 'active').length,
            overdue: loans.filter(l => l.status === 'overdue').length,
            critical: loans.filter(l => l.status === 'critical').length,
            returned: loans.filter(l => l.status === 'returned').length,
            cancelled: loans.filter(l => l.status === 'cancelled').length
        };
        setStatistics(stats);
    }, [loans]);

    // 🔍 RECHERCHE AVEC DÉBOUNCING OPTIMISÉ
    const debouncedSearch = useMemo(() => {
        return createSearchDebouncer((term) => {
            console.log(`🔍 Recherche debouncée: ${term}`);
            // La recherche est gérée directement par searchTerm
        }, {
            delay: 300,
            minLength: 2,
            onEmpty: () => setSearchTerm('')
        });
    }, []);

    const handleSearchChange = useCallback((term) => {
        setSearchTerm(term);
        debouncedSearch(term);
    }, [debouncedSearch]);

    // Filtrage avancé avec recherche multicritères (optimisé)
    const filteredLoans = useMemo(() => {
        let result = [...loans];

        // Filtre par statut
        if (statusFilter !== 'all') {
            if (statusFilter === 'active_ongoing') {
                result = result.filter(l => ['active', 'overdue', 'critical', 'reserved'].includes(l.status));
            } else {
                result = result.filter(l => l.status === statusFilter);
            }
        }

        // Filtre par terme de recherche (optimisé)
        if (searchTerm && searchTerm.length >= 2) {
            const term = searchTerm.toLowerCase();
            result = result.filter(l =>
                l.computerName?.toLowerCase().includes(term) ||
                l.userDisplayName?.toLowerCase().includes(term) ||
                l.userName?.toLowerCase().includes(term) ||
                l.userDepartment?.toLowerCase().includes(term) ||
                (l.notes && l.notes.toLowerCase().includes(term))
            );
        }

        // Application des filtres avancés
        if (advancedFilters) {
            // Filtre par période
            if (advancedFilters.startDate || advancedFilters.endDate) {
                result = result.filter(l => {
                    const loanDate = new Date(l.loanDate);
                    const startMatch = !advancedFilters.startDate || loanDate >= advancedFilters.startDate;
                    const endMatch = !advancedFilters.endDate || loanDate <= advancedFilters.endDate;
                    return startMatch && endMatch;
                });
            }

            // Filtre par montant
            if (advancedFilters.minAmount !== undefined || advancedFilters.maxAmount !== undefined) {
                result = result.filter(l => {
                    const amount = l.amount || 0;
                    const minMatch = advancedFilters.minAmount === undefined || amount >= advancedFilters.minAmount;
                    const maxMatch = advancedFilters.maxAmount === undefined || amount <= advancedFilters.maxAmount;
                    return minMatch && maxMatch;
                });
            }

            // Filtre par technicien
            if (advancedFilters.technician) {
                result = result.filter(l => l.technicianId === advancedFilters.technician.id);
            }

            // Filtre par département
            if (advancedFilters.department) {
                result = result.filter(l => 
                    l.userDepartment?.toLowerCase().includes(advancedFilters.department.toLowerCase())
                );
            }

            // Filtre par utilisateur spécifique
            if (advancedFilters.user) {
                result = result.filter(l => 
                    l.userName?.toLowerCase().includes(advancedFilters.user.toLowerCase()) ||
                    l.userDisplayName?.toLowerCase().includes(advancedFilters.user.toLowerCase())
                );
            }
        }

        // Tri des résultats (optimisé)
        if (sortConfig.key) {
            result.sort((a, b) => {
                let aVal, bVal;
                
                switch (sortConfig.key) {
                    case 'status':
                        aVal = STATUS_CONFIG[a.status]?.priority || 99;
                        bVal = STATUS_CONFIG[b.status]?.priority || 99;
                        break;
                    case 'loanDate':
                    case 'expectedReturnDate':
                        aVal = new Date(a[sortConfig.key]) || 0;
                        bVal = new Date(b[sortConfig.key]) || 0;
                        break;
                    case 'amount':
                        aVal = a.amount || 0;
                        bVal = b.amount || 0;
                        break;
                    case 'computerName':
                        aVal = a.computerName?.toLowerCase() || '';
                        bVal = b.computerName?.toLowerCase() || '';
                        break;
                    case 'userName':
                        aVal = (a.userDisplayName || a.userName || '').toLowerCase();
                        bVal = (b.userDisplayName || b.userName || '').toLowerCase();
                        break;
                    default:
                        return 0;
                }

                if (aVal < bVal) return sortConfig.direction === PRIORITY_SORT.asc ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === PRIORITY_SORT.asc ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [loans, statusFilter, searchTerm, advancedFilters, sortConfig]);

    // Pagination (seulement pour le mode classique)
    const paginatedLoans = useMemo(() => {
        if (shouldUseVirtualization) return filteredLoans;
        const startIndex = page * rowsPerPage;
        return filteredLoans.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredLoans, page, rowsPerPage, shouldUseVirtualization]);

    // Mise à jour des statistiques
    useMemo(() => updateStatistics(), [filteredLoans.length, updateStatistics]);

    // Gestion des sélections (optimisée)
    const handleSelectLoan = useCallback((loanId, checked) => {
        setSelectedLoans(prev => {
            const newSet = new Set(prev);
            if (checked) {
                newSet.add(loanId);
            } else {
                newSet.delete(loanId);
            }
            return newSet;
        });
    }, []);

    const handleSelectAll = useCallback((checked) => {
        if (shouldUseVirtualization) {
            // En mode virtualisé, sélectionner tous les éléments filtrés
            if (checked) {
                setSelectedLoans(new Set(filteredLoans.map(l => l.id)));
            } else {
                setSelectedLoans(new Set());
            }
        } else {
            // Mode classique - sélectionner seulement les éléments paginés
            if (checked) {
                setSelectedLoans(new Set(paginatedLoans.map(l => l.id)));
            } else {
                setSelectedLoans(new Set());
            }
        }
    }, [filteredLoans, paginatedLoans, shouldUseVirtualization]);

    // Gestion du tri
    const handleSort = useCallback((key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === PRIORITY_SORT.asc 
                ? PRIORITY_SORT.desc 
                : PRIORITY_SORT.asc
        }));
    }, []);

    // Actions en lot (optimisées)
    const handleBulkAction = useCallback(async (action, loanIds = null) => {
        const targetIds = loanIds || Array.from(selectedLoans);
        
        if (targetIds.length === 0) {
            showNotification('warning', 'Aucun prêt sélectionné');
            return;
        }

        try {
            switch (action) {
                case 'bulkReturn':
                    showNotification('info', `Retour de ${targetIds.length} prêts en cours...`);
                    // Implémentation du retour en lot
                    break;
                case 'bulkExtend':
                    showNotification('info', `Prolongation de ${targetIds.length} prêts en cours...`);
                    // Implémentation de la prolongation en lot
                    break;
                case 'bulkCancel':
                    showNotification('info', `Annulation de ${targetIds.length} prêts en cours...`);
                    // Implémentation de l'annulation en lot
                    break;
                case 'export':
                    if (onExportRequest) {
                        await onExportRequest(targetIds);
                    }
                    break;
                case 'notifications':
                    if (onNotificationsRequest) {
                        await onNotificationsRequest(targetIds);
                    }
                    break;
                default:
                    break;
            }
            
            setSelectedLoans(new Set());
            setBulkActionMenu(null);
        } catch (error) {
            showNotification('error', `Erreur lors de l'action en lot: ${error.message}`);
        }
    }, [selectedLoans, onExportRequest, onNotificationsRequest, showNotification]);

    // Rafraîchissement (optimisé)
    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([
                invalidate('loans'),
                invalidate('computers'),
                invalidate('excel_users')
            ]);
            showNotification('success', 'Données rafraîchies');
        } catch (error) {
            showNotification('error', 'Erreur lors du rafraîchissement');
        } finally {
            setIsRefreshing(false);
        }
    }, [invalidate, showNotification]);

    // Gestion des événements de pagination
    const handlePageChange = useCallback((event, newPage) => setPage(newPage), []);
    const handleRowsPerPageChange = useCallback((event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    }, []);

    // Gestionnaires de dialogs
    const handleSaveLoan = async (loanData) => {
        const isEdit = !!loanData.id;
        try {
            if (isEdit) {
                await apiService.updateLoan(loanData.id, loanData);
                showNotification('success', 'Prêt modifié avec succès.');
            } else {
                await apiService.createLoan(loanData);
                showNotification('success', 'Prêt créé avec succès.');
            }
            await Promise.all([invalidate('loans'), invalidate('computers')]);
        } catch (error) {
            showNotification('error', `Erreur: ${error.message}`);
        } finally {
            setDialog({ type: null, data: null });
        }
    };

    const handleReturnLoan = async (loan, notes, accessoryInfo) => {
        try {
            await apiService.returnLoan(loan.id, notes, accessoryInfo);
            showNotification('success', 'Prêt retourné.');
            await Promise.all([invalidate('loans'), invalidate('computers')]);
        } catch (error) { 
            showNotification('error', `Erreur: ${error.message}`); 
        }
        finally { 
            setDialog({ type: null, data: null }); 
        }
    };

    const handleExtendLoan = async (loanId, newDate, reason) => {
        try {
            await apiService.extendLoan(loanId, newDate, reason);
            showNotification('success', 'Prêt prolongé.');
            await invalidate('loans');
        } catch (error) { 
            showNotification('error', `Erreur: ${error.message}`); 
        }
        finally { 
            setDialog({ type: null, data: null }); 
        }
    };

    const handleCancelLoan = async (loan) => {
        const reason = prompt('Raison de l\'annulation:');
        if (reason) {
            try {
                await apiService.cancelLoan(loan.id, reason);
                showNotification('success', 'Prêt annulé.');
                await Promise.all([invalidate('loans'), invalidate('computers')]);
            } catch (error) { 
                showNotification('error', `Erreur: ${error.message}`); 
            }
        }
    };

    // 🎨 RENDU DU TABLEAU CLASSIQUE
    const renderClassicTable = useCallback(() => (
        <Paper elevation={2} sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <TableContainer sx={{ flex: 1 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox">
                                <Checkbox
                                    checked={paginatedLoans.length > 0 && selectedLoans.size === paginatedLoans.length}
                                    indeterminate={selectedLoans.size > 0 && selectedLoans.size < paginatedLoans.length}
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                />
                            </TableCell>
                            <SortableTableCell 
                                label="Statut" 
                                sortKey="status" 
                                sortConfig={sortConfig} 
                                onSort={() => handleSort('status')}
                            />
                            <SortableTableCell 
                                label="Matériel" 
                                sortKey="computerName" 
                                sortConfig={sortConfig} 
                                onSort={() => handleSort('computerName')}
                            />
                            <SortableTableCell 
                                label="Utilisateur" 
                                sortKey="userName" 
                                sortConfig={sortConfig} 
                                onSort={() => handleSort('userName')}
                            />
                            <SortableTableCell 
                                label="Date de prêt" 
                                sortKey="loanDate" 
                                sortConfig={sortConfig} 
                                onSort={() => handleSort('loanDate')}
                            />
                            <SortableTableCell 
                                label="Retour prévu" 
                                sortKey="expectedReturnDate" 
                                sortConfig={sortConfig} 
                                onSort={() => handleSort('expectedReturnDate')}
                            />
                            <SortableTableCell 
                                label="Montant" 
                                sortKey="amount" 
                                sortConfig={sortConfig} 
                                onSort={() => handleSort('amount')}
                                align="right"
                            />
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedLoans.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                                    <EmptyState 
                                        type="search" 
                                        title="Aucun prêt trouvé" 
                                        description="Aucun prêt ne correspond à vos critères de recherche." 
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedLoans.map(loan => (
                                <LoanRow
                                    key={loan.id}
                                    loan={loan}
                                    isSelected={selectedLoans.has(loan.id)}
                                    onSelect={handleSelectLoan}
                                    onReturn={(loan) => setDialog({ type: 'return', data: loan })}
                                    onEdit={(loan) => setDialog({ type: 'edit', data: loan })}
                                    onExtend={(loan) => setDialog({ type: 'extend', data: loan })}
                                    onHistory={(loan) => setDialog({ type: 'history', data: loan })}
                                    onCancel={handleCancelLoan}
                                    sortConfig={sortConfig}
                                    onSort={handleSort}
                                    getUserColor={getUserColor}
                                    compact={false}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            
            {/* Pagination */}
            <TablePagination
                rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
                component="div"
                count={filteredLoans.length}
                page={page}
                onPageChange={handlePageChange}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleRowsPerPageChange}
                labelRowsPerPage="Lignes par page:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
            />
        </Paper>
    ), [paginatedLoans, selectedLoans, sortConfig, handleSelectAll, handleSort, handleSelectLoan, handleCancelLoan, getUserColor, filteredLoans.length, page, rowsPerPage]);

    // 🔍 RENDU PRINCIPAL
    if (isLoading) {
        return <LoadingScreen type="table" />;
    }

    return (
        <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Barre d'actions supérieure avec contrôles de performance */}
            <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                        <SearchInput 
                            value={searchTerm} 
                            onChange={handleSearchChange} 
                            placeholder="Rechercher par ordinateur, utilisateur, département, notes..."
                            showAdvancedSearch
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Statut</InputLabel>
                            <Select 
                                value={statusFilter} 
                                label="Statut" 
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <MenuItem value="active_ongoing">
                                    En cours ({statistics.active + statistics.overdue + statistics.critical})
                                </MenuItem>
                                <MenuItem value="all">Tous ({statistics.total})</MenuItem>
                                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                    <MenuItem key={key} value={key}>
                                        {config.label} ({statistics[key] || 0})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Mode d'affichage</InputLabel>
                            <Select 
                                value={viewMode} 
                                label="Mode d'affichage" 
                                onChange={(e) => setViewMode(e.target.value)}
                            >
                                <MenuItem value="auto">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <SpeedIcon fontSize="small" />
                                        Auto ({loans.length > VIRTUALIZATION_THRESHOLD ? 'Virtualisé' : 'Classique'})
                                    </Box>
                                </MenuItem>
                                <MenuItem value="virtualized">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ViewModuleIcon fontSize="small" />
                                        Virtualisé
                                    </Box>
                                </MenuItem>
                                <MenuItem value="classic">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ViewListIcon fontSize="small" />
                                        Classique
                                    </Box>
                                </MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={enableMetrics}
                                        onChange={(e) => setEnableMetrics(e.target.checked)}
                                        size="small"
                                    />
                                }
                                label="Métriques"
                                sx={{ mr: 1 }}
                            />
                            <Button 
                                fullWidth 
                                startIcon={<FilterListOffIcon />} 
                                variant="outlined"
                                onClick={() => { 
                                    setSearchTerm(''); 
                                    setStatusFilter('active_ongoing'); 
                                    if (onFiltersChange) onFiltersChange({});
                                }}
                            >
                                Effacer
                            </Button>
                            <Tooltip title="Rafraîchir">
                                <IconButton 
                                    onClick={handleRefresh} 
                                    disabled={isRefreshing}
                                >
                                    <RefreshIcon />
                                </IconButton>
                            </Tooltip>
                            {isRefreshing && <LinearProgress sx={{ width: 50 }} />}
                        </Box>
                    </Grid>
                </Grid>

                {/* Bandeau de statistiques */}
                <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Chip 
                        label={`Total: ${statistics.total.toLocaleString()}`} 
                        color="primary" 
                        variant="outlined" 
                        size="small"
                    />
                    <Chip 
                        label={`Actifs: ${statistics.active}`} 
                        color="success" 
                        variant="outlined" 
                        size="small"
                    />
                    <Chip 
                        label={`En retard: ${statistics.overdue}`} 
                        color="warning" 
                        variant="outlined" 
                        size="small"
                    />
                    <Chip 
                        label={`Critiques: ${statistics.critical}`} 
                        color="error" 
                        variant="outlined" 
                        size="small"
                    />
                    <Chip 
                        label={`Retournés: ${statistics.returned}`} 
                        color="info" 
                        variant="outlined" 
                        size="small"
                    />
                    {/* Indicateur de mode d'affichage */}
                    <Chip 
                        label={`Mode: ${shouldUseVirtualization ? 'Virtualisé' : 'Classique'}`} 
                        color="secondary" 
                        variant="filled" 
                        size="small"
                        icon={<SpeedIcon />}
                    />
                </Box>
            </Paper>

            {/* Alertes pour prêts critiques */}
            {(statistics.overdue > 0 || statistics.critical > 0) && (
                <Alert 
                    severity="warning" 
                    sx={{ mb: 2 }}
                    action={
                        <Button 
                            color="inherit" 
                            size="small"
                            onClick={() => onNotificationsRequest?.()}
                        >
                            Voir détails
                        </Button>
                    }
                >
                    {statistics.critical > 0 && `${statistics.critical} prêt(s) critique(s) - `}
                    {statistics.overdue > 0 && `${statistics.overdue} prêt(s) en retard`}
                </Alert>
            )}

            {/* Légende des couleurs utilisateur */}
            {getColoredUserList().length > 0 && (
                <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Utilisateurs actifs :
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, maxHeight: 60, overflow: 'auto' }}>
                        {getColoredUserList().map(user => (
                            <Box
                                key={user.id || user.userName}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    px: 1,
                                    py: 0.5,
                                    backgroundColor: user.color,
                                    color: user.textColor,
                                    borderRadius: 1,
                                    fontSize: '0.7rem',
                                    fontWeight: 'medium'
                                }}
                                title={`${user.displayName} (${user.userName})`}
                            >
                                <span style={{ 
                                    fontSize: '10px', 
                                    fontWeight: 'bold', 
                                    color: user.textColor 
                                }}>
                                    {user.displayName.charAt(0).toUpperCase()}
                                </span>
                                <span>{user.displayName}</span>
                            </Box>
                        ))}
                    </Box>
                </Paper>
            )}

            {/* Barre d'actions en lot */}
            {selectedLoans.size > 0 && (
                <Paper elevation={1} sx={{ p: 1, mb: 2 }}>
                    <Toolbar>
                        <Checkbox
                            checked={selectedLoans.size > 0}
                            indeterminate={selectedLoans.size > 0 && selectedLoans.size < paginatedLoans.length}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                        />
                        <Typography variant="body2" sx={{ flex: 1 }}>
                            {selectedLoans.size.toLocaleString()} prêt(s) sélectionné(s)
                        </Typography>
                        
                        <Button
                            size="small"
                            variant="contained"
                            endIcon={<KeyboardArrowDownIcon />}
                            onClick={(event) => setBulkActionMenu(event.currentTarget)}
                        >
                            Actions en lot
                        </Button>
                        
                        <Menu
                            anchorEl={bulkActionMenu}
                            open={Boolean(bulkActionMenu)}
                            onClose={() => setBulkActionMenu(null)}
                        >
                            <MenuItem onClick={() => handleBulkAction('bulkReturn')}>
                                <ListItemIcon>
                                    <AssignmentReturnIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>Retourner en lot</ListItemText>
                            </MenuItem>
                            <MenuItem onClick={() => handleBulkAction('bulkExtend')}>
                                <ListItemIcon>
                                    <UpdateIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>Prolonger en lot</ListItemText>
                            </MenuItem>
                            <MenuItem onClick={() => handleBulkAction('bulkCancel')}>
                                <ListItemIcon>
                                    <CancelIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>Annuler en lot</ListItemText>
                            </MenuItem>
                            <Divider />
                            <MenuItem onClick={() => handleBulkAction('export')}>
                                <ListItemIcon>
                                    <FileDownloadIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>Exporter Excel/PDF</ListItemText>
                            </MenuItem>
                            <MenuItem onClick={() => handleBulkAction('notifications')}>
                                <ListItemIcon>
                                    <NotificationsIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>Envoyer notifications</ListItemText>
                            </MenuItem>
                        </Menu>
                    </Toolbar>
                </Paper>
            )}

            {/* Tableau principal - Choix du mode d'affichage */}
            {shouldUseVirtualization ? (
                <LoanListVirtualized
                    loans={filteredLoans}
                    selectedLoans={selectedLoans}
                    onSelectLoan={handleSelectLoan}
                    onReturn={(loan) => setDialog({ type: 'return', data: loan })}
                    onEdit={(loan) => setDialog({ type: 'edit', data: loan })}
                    onExtend={(loan) => setDialog({ type: 'extend', data: loan })}
                    onHistory={(loan) => setDialog({ type: 'history', data: loan })}
                    onCancel={handleCancelLoan}
                    getUserColor={getUserColor}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    enableMetrics={enableMetrics}
                    height={600}
                    overscan={5}
                    rowHeight={80}
                    enableInfiniteScroll={false}
                />
            ) : (
                renderClassicTable()
            )}

            {/* Dialogs */}
            {dialog.type === 'edit' && (
                <LoanDialog 
                    open={true} 
                    onClose={() => setDialog({ type: null, data: null })} 
                    loan={dialog.data} 
                    onSave={handleSaveLoan} 
                    computers={computers} 
                    users={users} 
                    itStaff={itStaff} 
                />
            )}
            {dialog.type === 'return' && (
                <ReturnLoanDialog 
                    open={true} 
                    onClose={() => setDialog({ type: null, data: null })} 
                    loan={dialog.data} 
                    onReturn={handleReturnLoan} 
                />
            )}
            {dialog.type === 'extend' && (
                <ExtendLoanDialog 
                    open={true} 
                    onClose={() => setDialog({ type: null, data: null })} 
                    loan={dialog.data} 
                    onExtend={handleExtendLoan} 
                />
            )}
            {dialog.type === 'history' && (
                <LoanHistoryDialog 
                    open={true} 
                    onClose={() => setDialog({ type: null, data: null })} 
                    loan={dialog.data} 
                />
            )}
        </Box>
    );
};

export default React.memo(LoanListEnhanced);