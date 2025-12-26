// src/components/loan-management/LoanList.js - NOUVEAU FICHIER COMPLET

import React, { useState, useMemo } from 'react';
import {
    Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, Tooltip, IconButton, Grid, FormControl, InputLabel, Select, MenuItem, Button
} from '@mui/material';
import {
    Edit as EditIcon, AssignmentReturn as AssignmentReturnIcon, Update as UpdateIcon,
    Cancel as CancelIcon, History as HistoryIcon, FilterListOff as FilterListOffIcon,
    Warning as WarningIcon, Add as AddIcon, EventAvailable as ReserveIcon
} from '@mui/icons-material';

import { useApp } from '../../contexts/AppContext';
import { useCache } from '../../contexts/CacheContext';
import apiService from '../../services/apiService';

import SearchInput from '../common/SearchInput';
import EmptyState from '../common/EmptyState';
import LoadingScreen from '../common/LoadingScreen';
import LoanDialog from '../LoanDialog';
import ReturnLoanDialog from '../ReturnLoanDialog';
import ExtendLoanDialog from '../ExtendLoanDialog';
import LoanHistoryDialog from '../LoanHistoryDialog';
import CancelLoanDialog from '../CancelLoanDialog';

const STATUS_CONFIG = {
    active: { label: 'Actif', color: 'success' },
    reserved: { label: 'Réservé', color: 'info' },
    overdue: { label: 'En retard', color: 'warning' },
    critical: { label: 'Critique', color: 'error' },
    returned: { label: 'Retourné', color: 'default' },
    cancelled: { label: 'Annulé', color: 'default' },
};

const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('fr-FR');

// ✅ OPTIMISATION: Composant memoïsé pour éviter re-renders inutiles
const LoanRow = React.memo(({ loan, onReturn, onEdit, onExtend, onHistory, onCancel }) => {
    const config = STATUS_CONFIG[loan.status] || {};

    // Calcul de l'urgence (retour prévu dans les 2 prochains jours)
    const expectedReturn = new Date(loan.expectedReturnDate);
    const today = new Date();
    const daysUntilReturn = Math.ceil((expectedReturn - today) / (1000 * 60 * 60 * 24));
    const isUrgent = daysUntilReturn <= 2 && daysUntilReturn >= 0 && ['active', 'reserved'].includes(loan.status);

    // Statuts actifs qui permettent les actions
    const isActiveStatus = ['active', 'overdue', 'critical', 'reserved'].includes(loan.status);

    return (
        <TableRow
            key={loan.id}
            hover
            sx={{
                bgcolor: loan.status === 'critical' ? 'error.lighter' :
                    loan.status === 'overdue' ? 'warning.lighter' :
                        isUrgent ? 'info.lighter' : 'inherit',
                '&:hover': { opacity: 0.9 }
            }}
        >
            <TableCell>
                <Chip label={config.label} color={config.color} size="small" />
                {isUrgent && <Chip label="Urgent" size="small" color="warning" sx={{ ml: 0.5 }} />}
            </TableCell>
            <TableCell>{loan.computerName}</TableCell>
            <TableCell>{loan.userDisplayName || loan.userName}</TableCell>
            <TableCell>{formatDate(loan.loanDate)}</TableCell>
            <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {formatDate(loan.expectedReturnDate)}
                    {isUrgent && <Tooltip title={`Retour dans ${daysUntilReturn} jour(s)`}><WarningIcon fontSize="small" color="warning" /></Tooltip>}
                </Box>
            </TableCell>
            <TableCell>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'nowrap' }}>
                    {isActiveStatus && (
                        <>
                            <Tooltip title="Retourner"><IconButton size="small" color="success" onClick={() => onReturn(loan)}><AssignmentReturnIcon fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title="Modifier"><IconButton size="small" color="primary" onClick={() => onEdit(loan)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title="Prolonger"><IconButton size="small" color="info" onClick={() => onExtend(loan)}><UpdateIcon fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title="Annuler"><IconButton size="small" color="error" onClick={() => onCancel(loan)}><CancelIcon fontSize="small" /></IconButton></Tooltip>
                        </>
                    )}
                    <Tooltip title="Historique"><IconButton size="small" onClick={() => onHistory(loan)}><HistoryIcon fontSize="small" /></IconButton></Tooltip>
                </Box>
            </TableCell>
        </TableRow>
    );
});

const LoanList = ({ preFilter }) => {
    const { showNotification } = useApp();
    const { cache, isLoading, invalidate } = useCache();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState(preFilter || 'active_ongoing');
    const [dialog, setDialog] = useState({ type: null, data: null });

    const { loans, computers, users, itStaff } = useMemo(() => ({
        loans: cache.loans || [],
        computers: cache.computers || [],
        users: Object.values(cache.excel_users || {}).flat(),
        itStaff: cache.config?.it_staff || [],
    }), [cache]);

    const filteredLoans = useMemo(() => {
        let result = [...loans];
        if (statusFilter !== 'all') {
            if (statusFilter === 'active_ongoing') {
                result = result.filter(l => ['active', 'overdue', 'critical', 'reserved'].includes(l.status));
            } else {
                result = result.filter(l => l.status === statusFilter);
            }
        }
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(l =>
                l.computerName?.toLowerCase().includes(term) ||
                l.userDisplayName?.toLowerCase().includes(term) ||
                l.userName?.toLowerCase().includes(term)
            );
        }
        return result;
    }, [loans, statusFilter, searchTerm]);

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
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); }
        finally { setDialog({ type: null, data: null }); }
    };

    const handleExtendLoan = async (loanId, newDate, reason) => {
        try {
            await apiService.extendLoan(loanId, newDate, reason);
            showNotification('success', 'Prêt prolongé.');
            await invalidate('loans');
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); }
        finally { setDialog({ type: null, data: null }); }
    };

    const handleCancelLoan = async (loan, reason) => {
        try {
            await apiService.cancelLoan(loan.id, reason);
            showNotification('success', 'Prêt annulé.');
            await Promise.all([invalidate('loans'), invalidate('computers')]);
        } catch (error) {
            showNotification('error', `Erreur: ${error.message}`);
        } finally {
            setDialog({ type: null, data: null });
        }
    };

    if (isLoading) {
        return <LoadingScreen type="table" />;
    }

    return (
        <Box sx={{ p: 2 }}>
            <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6}>
                        <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Rechercher un prêt..." />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Statut</InputLabel>
                            <Select value={statusFilter} label="Statut" onChange={(e) => setStatusFilter(e.target.value)}>
                                <MenuItem value="active_ongoing">En cours</MenuItem>
                                <MenuItem value="all">Tous</MenuItem>
                                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                    <MenuItem key={key} value={key}>{config.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                fullWidth
                                variant="contained"
                                color="primary"
                                startIcon={<AddIcon />}
                                onClick={() => setDialog({ type: 'create', data: null })}
                                sx={{ fontWeight: 600 }}
                            >
                                Nouveau Prêt
                            </Button>
                            <Button
                                fullWidth
                                variant="outlined"
                                color="info"
                                startIcon={<ReserveIcon />}
                                onClick={() => setDialog({ type: 'reserve', data: null })}
                                sx={{ fontWeight: 600 }}
                            >
                                Réserver
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
                <Box sx={{ mt: 1 }}>
                    <Button size="small" startIcon={<FilterListOffIcon />} onClick={() => { setSearchTerm(''); setStatusFilter('active_ongoing'); }}>
                        Effacer les filtres
                    </Button>
                </Box>
            </Paper>

            {filteredLoans.length === 0 ? (
                <EmptyState type="search" title="Aucun prêt trouvé" description="Aucun prêt ne correspond à vos critères de recherche." />
            ) : (
                <TableContainer component={Paper} elevation={2}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Statut</TableCell>
                                <TableCell>Matériel</TableCell>
                                <TableCell>Utilisateur</TableCell>
                                <TableCell>Date de prêt</TableCell>
                                <TableCell>Retour prévu</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredLoans.map(loan => (
                                <LoanRow
                                    key={loan.id}
                                    loan={loan}
                                    onReturn={(loan) => setDialog({ type: 'return', data: loan })}
                                    onEdit={(loan) => setDialog({ type: 'edit', data: loan })}
                                    onExtend={(loan) => setDialog({ type: 'extend', data: loan })}
                                    onHistory={(loan) => setDialog({ type: 'history', data: loan })}
                                    onCancel={(loan) => setDialog({ type: 'cancel', data: loan })}
                                />
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* ✅ Dialogue de création de prêt */}
            {dialog.type === 'create' && <LoanDialog open={true} onClose={() => setDialog({ type: null, data: null })} loan={null} onSave={handleSaveLoan} computers={computers} users={users} itStaff={itStaff} existingLoans={loans} />}
            {/* ✅ Dialogue de réservation */}
            {dialog.type === 'reserve' && <LoanDialog open={true} onClose={() => setDialog({ type: null, data: null })} loan={null} isReservation={true} onSave={handleSaveLoan} computers={computers} users={users} itStaff={itStaff} existingLoans={loans} />}
            {/* Dialogues existants */}
            {dialog.type === 'edit' && <LoanDialog open={true} onClose={() => setDialog({ type: null, data: null })} loan={dialog.data} onSave={handleSaveLoan} computers={computers} users={users} itStaff={itStaff} existingLoans={loans} />}
            {dialog.type === 'return' && <ReturnLoanDialog open={true} onClose={() => setDialog({ type: null, data: null })} loan={dialog.data} onReturn={handleReturnLoan} />}
            {dialog.type === 'extend' && <ExtendLoanDialog open={true} onClose={() => setDialog({ type: null, data: null })} loan={dialog.data} onExtend={handleExtendLoan} />}
            {dialog.type === 'history' && <LoanHistoryDialog open={true} onClose={() => setDialog({ type: null, data: null })} loan={dialog.data} />}
            {dialog.type === 'cancel' && <CancelLoanDialog open={true} onClose={() => setDialog({ type: null, data: null })} loan={dialog.data} onCancel={handleCancelLoan} />}
        </Box>
    );
};

export default LoanList;