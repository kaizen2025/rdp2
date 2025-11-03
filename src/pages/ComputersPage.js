import React, { useState, useMemo, useCallback } from 'react';
import {
    Box, Paper, Typography, Button, IconButton, FormControl, InputLabel,
    Select, MenuItem, Chip, Tooltip, Grid, Menu, Card, Divider, Dialog,
    ButtonGroup, ListItemIcon, ListItemText as MuiListItemText,
    ToggleButtonGroup, ToggleButton // ✅ IMPORTS AJOUTÉS
} from '@mui/material';
import {
    Laptop as LaptopIcon, Add as AddIcon, Refresh as RefreshIcon,
    Edit as EditIcon, Delete as DeleteIcon, History as HistoryIcon,
    Build as BuildIcon, Assignment as AssignmentIcon, MoreVert as MoreVertIcon,
    CheckCircle as CheckCircleIcon, Error as ErrorIcon, Warning as WarningIcon,
    FilterListOff as FilterListOffIcon, ViewModule as ViewModuleIcon, ViewList as ViewListIcon,
    Bolt as BoltIcon
} from '@mui/icons-material';

import { useApp } from '../contexts/AppContext';
import { useCache } from '../contexts/CacheContext';
import apiService from '../services/apiService';
import PageHeader from '../components/common/PageHeader';
import SearchInput from '../components/common/SearchInput';
import EmptyState from '../components/common/EmptyState';
import LoadingScreen from '../components/common/LoadingScreen';

// ✅ CORRECTION: Import du composant QuickLoanDialog
import QuickLoanDialog from '../components/QuickLoanDialog'; 

// Lazy load des autres dialogues
const ComputerDialog = React.lazy(() => import('../components/ComputerDialog'));
const ComputerHistoryDialog = React.lazy(() => import('../components/ComputerHistoryDialog'));
const MaintenanceDialog = React.lazy(() => import('../components/MaintenanceDialog'));
const LoanDialog = React.lazy(() => import('../components/LoanDialog'));
const AccessoriesManagement = React.lazy(() => import('./AccessoriesManagement'));

const STATUS_CONFIG = {
    available: { label: 'Disponible', color: 'success', icon: <CheckCircleIcon sx={{fontSize: 16}} /> },
    loaned: { label: 'Prêté', color: 'info', icon: <AssignmentIcon sx={{fontSize: 16}} /> },
    reserved: { label: 'Réservé', color: 'warning', icon: <WarningIcon sx={{fontSize: 16}} /> },
    maintenance: { label: 'Maintenance', color: 'warning', icon: <BuildIcon sx={{fontSize: 16}} /> },
    retired: { label: 'Retiré', color: 'error', icon: <ErrorIcon sx={{fontSize: 16}} /> }
};

// ✅ AMÉLIORATION: Vue Carte plus compacte et organisée
const ComputerCard = ({ computer, onEdit, onDelete, onHistory, onMaintenance, onLoan, onQuickLoan }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const statusConfig = STATUS_CONFIG[computer.status] || {};
    return (
        <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 1.5, flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="600" noWrap>{computer.name}</Typography>
                    <Chip icon={statusConfig.icon} label={statusConfig.label} size="small" color={statusConfig.color} />
                </Box>
                <Typography variant="caption" display="block" color="text.secondary">S/N: {computer.serialNumber}</Typography>
                <Typography variant="caption" display="block" color="text.secondary">Modèle: {computer.brand} {computer.model}</Typography>
            </Box>
            <Divider />
            <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {computer.status === 'available' ? (
                    <ButtonGroup variant="outlined" size="small">
                        <Button startIcon={<BoltIcon />} onClick={() => onQuickLoan(computer)}>Rapide</Button>
                        <Button startIcon={<AssignmentIcon />} onClick={() => onLoan(computer)}>Complet</Button>
                    </ButtonGroup>
                ) : <Box />}
                <Tooltip title="Plus d'options">
                    <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}><MoreVertIcon /></IconButton>
                </Tooltip>
            </Box>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                <MenuItem onClick={() => { onEdit(computer); setAnchorEl(null); }}><ListItemIcon><EditIcon fontSize="small" /></ListItemIcon><MuiListItemText>Modifier</MuiListItemText></MenuItem>
                <MenuItem onClick={() => { onHistory(computer); setAnchorEl(null); }}><ListItemIcon><HistoryIcon fontSize="small" /></ListItemIcon><MuiListItemText>Historique</MuiListItemText></MenuItem>
                <MenuItem onClick={() => { onMaintenance(computer); setAnchorEl(null); }}><ListItemIcon><BuildIcon fontSize="small" /></ListItemIcon><MuiListItemText>Maintenance</MuiListItemText></MenuItem>
                <Divider />
                <MenuItem onClick={() => { onDelete(computer); setAnchorEl(null); }} sx={{ color: 'error.main' }}><ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon><MuiListItemText>Supprimer</MuiListItemText></MenuItem>
            </Menu>
        </Card>
    );
};

// ✅ AMÉLIORATION: Vue Liste corrigée et plus propre
const ComputerListItem = ({ computer, onEdit, onDelete, onHistory, onMaintenance, onLoan, onQuickLoan }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const statusConfig = STATUS_CONFIG[computer.status] || {};
    return (
        <Paper elevation={1} sx={{ display: 'flex', alignItems: 'center', p: 1.5, mb: 1, '&:hover': { bgcolor: 'action.hover' } }}>
            <ListItemIcon sx={{ mr: 1 }}><LaptopIcon color={computer.status === 'available' ? 'success' : 'action'} /></ListItemIcon>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="body1" fontWeight={500} noWrap>{computer.name}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap>{computer.brand} {computer.model} - S/N: {computer.serialNumber}</Typography>
            </Box>
            <Chip label={statusConfig.label} color={statusConfig.color} size="small" sx={{ mx: 2, flexShrink: 0 }} />
            <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                {computer.status === 'available' && (
                    <ButtonGroup variant="outlined" size="small">
                        <Button onClick={() => onQuickLoan(computer)}>Prêt Rapide</Button>
                        <Button onClick={() => onLoan(computer)}>Prêt Complet</Button>
                    </ButtonGroup>
                )}
            </Box>
            <Tooltip title="Plus d'options">
                <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ ml: 1 }}><MoreVertIcon /></IconButton>
            </Tooltip>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                <MenuItem onClick={() => { onEdit(computer); setAnchorEl(null); }}><ListItemIcon><EditIcon fontSize="small" /></ListItemIcon><MuiListItemText>Modifier</MuiListItemText></MenuItem>
                <MenuItem onClick={() => { onHistory(computer); setAnchorEl(null); }}><ListItemIcon><HistoryIcon fontSize="small" /></ListItemIcon><MuiListItemText>Historique</MuiListItemText></MenuItem>
                <MenuItem onClick={() => { onMaintenance(computer); setAnchorEl(null); }}><ListItemIcon><BuildIcon fontSize="small" /></ListItemIcon><MuiListItemText>Maintenance</MuiListItemText></MenuItem>
                <Divider />
                <MenuItem onClick={() => { onDelete(computer); setAnchorEl(null); }} sx={{ color: 'error.main' }}><ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon><MuiListItemText>Supprimer</MuiListItemText></MenuItem>
            </Menu>
        </Paper>
    );
};

const ComputersPage = () => {
    const { showNotification } = useApp();
    const { cache, invalidate, isLoading } = useCache();
    
    // ✅ AMÉLIORATION: Vue liste par défaut
    const [view, setView] = useState('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [locationFilter, setLocationFilter] = useState('all');
    const [brandFilter, setBrandFilter] = useState('all');
    const [dialog, setDialog] = useState({ type: null, data: null });

    const { computers, users, itStaff, loans } = useMemo(() => ({
        computers: cache.computers || [],
        users: Object.values(cache.excel_users || {}).flat(),
        itStaff: cache.config?.it_staff || [],
        loans: cache.loans || [],
    }), [cache]);

    const filteredComputers = useMemo(() => {
        let result = [...computers];
        if (statusFilter !== 'all') result = result.filter(c => c.status === statusFilter);
        if (locationFilter !== 'all') result = result.filter(c => c.location === locationFilter);
        if (brandFilter !== 'all') result = result.filter(c => c.brand === brandFilter);
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(c => ['name', 'brand', 'model', 'serialNumber', 'assetTag'].some(field => c[field]?.toLowerCase().includes(term)));
        }
        return result;
    }, [computers, statusFilter, locationFilter, brandFilter, searchTerm]);

    const handleSaveComputer = useCallback(async (computerData) => {
        try {
            await apiService.saveComputer(computerData);
            showNotification('success', 'Ordinateur sauvegardé.');
            await invalidate('computers');
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); }
        setDialog({ type: null, data: null });
    }, [invalidate, showNotification]);

    const handleDeleteComputer = useCallback(async (computer) => {
        if (!window.confirm(`Supprimer ${computer.name} ?`)) return;
        try {
            await apiService.deleteComputer(computer.id);
            showNotification('success', 'Ordinateur supprimé.');
            await invalidate('computers');
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); }
    }, [invalidate, showNotification]);

    const handleSaveMaintenance = useCallback(async (computerId, maintenanceData) => {
        try {
            await apiService.addComputerMaintenance(computerId, maintenanceData);
            showNotification('success', 'Maintenance enregistrée.');
            await invalidate('computers');
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); }
        setDialog({ type: null, data: null });
    }, [invalidate, showNotification]);

    const handleCreateLoan = useCallback(async (loanData) => {
        try {
            await apiService.createLoan(loanData);
            showNotification('success', 'Prêt créé avec succès.');
            await Promise.all([invalidate('computers'), invalidate('loans')]);
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); }
        setDialog({ type: null, data: null });
    }, [invalidate, showNotification]);

    const clearFilters = () => { setSearchTerm(''); setStatusFilter('all'); setLocationFilter('all'); setBrandFilter('all'); };
    const hasActiveFilters = searchTerm || statusFilter !== 'all' || locationFilter !== 'all' || brandFilter !== 'all';

    const stats = useMemo(() => ({
        total: computers.length,
        available: computers.filter(c => c.status === 'available').length,
        loaned: computers.filter(c => c.status === 'loaned').length,
        maintenance: computers.filter(c => c.status === 'maintenance').length
    }), [computers]);

    const { locations, brands } = useMemo(() => ({
        locations: [...new Set(computers.map(c => c.location).filter(Boolean))].sort(),
        brands: [...new Set(computers.map(c => c.brand).filter(Boolean))].sort()
    }), [computers]);

    return (
        <Box sx={{ p: 2 }}>
            <PageHeader
                title="Inventaire Matériel"
                subtitle="Vue d'ensemble du parc informatique"
                icon={LaptopIcon}
                stats={[
                    { label: 'Total', value: stats.total, icon: LaptopIcon },
                    { label: 'Disponibles', value: stats.available, icon: CheckCircleIcon },
                    { label: 'Prêtés', value: stats.loaned, icon: AssignmentIcon },
                    { label: 'En maintenance', value: stats.maintenance, icon: BuildIcon }
                ]}
                actions={
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog({ type: 'computer' })}>Ajouter</Button>
                        <Tooltip title="Actualiser"><IconButton onClick={() => invalidate('computers')} color="primary"><RefreshIcon /></IconButton></Tooltip>
                    </Box>
                }
            />

            <Paper elevation={2} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}><SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Rechercher..." fullWidth /></Grid>
                    <Grid item xs={6} sm={3} md={2}><FormControl fullWidth size="small"><InputLabel>Statut</InputLabel><Select value={statusFilter} label="Statut" onChange={(e) => setStatusFilter(e.target.value)}><MenuItem value="all">Tous</MenuItem>{Object.entries(STATUS_CONFIG).map(([key, conf]) => <MenuItem key={key} value={key}>{conf.label}</MenuItem>)}</Select></FormControl></Grid>
                    <Grid item xs={6} sm={3} md={2}><FormControl fullWidth size="small"><InputLabel>Localisation</InputLabel><Select value={locationFilter} label="Localisation" onChange={(e) => setLocationFilter(e.target.value)}><MenuItem value="all">Toutes</MenuItem>{locations.map(loc => <MenuItem key={loc} value={loc}>{loc}</MenuItem>)}</Select></FormControl></Grid>
                    <Grid item xs={6} sm={3} md={2}><FormControl fullWidth size="small"><InputLabel>Marque</InputLabel><Select value={brandFilter} label="Marque" onChange={(e) => setBrandFilter(e.target.value)}><MenuItem value="all">Toutes</MenuItem>{brands.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}</Select></FormControl></Grid>
                    <Grid item xs={6} sm={3} md={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <ToggleButtonGroup value={view} exclusive onChange={(e, newView) => newView && setView(newView)} size="small">
                            <Tooltip title="Vue Liste"><ToggleButton value="list"><ViewListIcon /></ToggleButton></Tooltip>
                            <Tooltip title="Vue Cartes"><ToggleButton value="grid"><ViewModuleIcon /></ToggleButton></Tooltip>
                        </ToggleButtonGroup>
                    </Grid>
                    {hasActiveFilters && <Grid item xs={12}><Button size="small" onClick={clearFilters} startIcon={<FilterListOffIcon />}>Effacer les filtres</Button></Grid>}
                </Grid>
            </Paper>

            {isLoading ? <LoadingScreen type="cards" /> : filteredComputers.length === 0 ? (
                <EmptyState type="search" onAction={clearFilters} actionLabel="Réinitialiser les filtres" />
            ) : (
                <Box>
                    {view === 'grid' && (
                        <Grid container spacing={2}>
                            {filteredComputers.map(computer => (
                                <Grid item key={computer.id} xs={12} sm={6} md={4} lg={3}>
                                    <ComputerCard computer={computer} onEdit={(c) => setDialog({ type: 'computer', data: c })} onDelete={handleDeleteComputer} onHistory={(c) => setDialog({ type: 'history', data: c })} onMaintenance={(c) => setDialog({ type: 'maintenance', data: c })} onLoan={(c) => setDialog({ type: 'loan', data: c })} onQuickLoan={(c) => setDialog({ type: 'quickLoan', data: c })} />
                                </Grid>
                            ))}
                        </Grid>
                    )}
                    {view === 'list' && (
                        <Box>{filteredComputers.map(computer => <ComputerListItem key={computer.id} computer={computer} onEdit={(c) => setDialog({ type: 'computer', data: c })} onDelete={handleDeleteComputer} onHistory={(c) => setDialog({ type: 'history', data: c })} onMaintenance={(c) => setDialog({ type: 'maintenance', data: c })} onLoan={(c) => setDialog({ type: 'loan', data: c })} onQuickLoan={(c) => setDialog({ type: 'quickLoan', data: c })} />)}</Box>
                    )}
                </Box>
            )}

            <React.Suspense fallback={<div />}>
                {dialog.type === 'computer' && <ComputerDialog open={true} onClose={() => setDialog({ type: null })} computer={dialog.data} onSave={handleSaveComputer} />}
                {dialog.type === 'history' && <ComputerHistoryDialog open={true} onClose={() => setDialog({ type: null })} computer={dialog.data} />}
                {dialog.type === 'maintenance' && <MaintenanceDialog open={true} onClose={() => setDialog({ type: null })} computer={dialog.data} onSave={handleSaveMaintenance} />}
                {dialog.type === 'loan' && <LoanDialog open={true} onClose={() => setDialog({ type: null })} computer={dialog.data} users={users} itStaff={itStaff} computers={computers} loans={loans} onSave={handleCreateLoan} />}
                {dialog.type === 'quickLoan' && <QuickLoanDialog open={true} onClose={() => setDialog({ type: null })} computer={dialog.data} users={users} onSave={handleCreateLoan} />}
                {dialog.type === 'accessories' && <Dialog open={true} onClose={() => setDialog({ type: null })} maxWidth="lg" fullWidth><AccessoriesManagement /></Dialog>}
            </React.Suspense>
        </Box>
    );
};

export default ComputersPage;