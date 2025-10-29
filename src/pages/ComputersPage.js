// src/pages/ComputersPage.js - VERSION AVEC IMPORTS CORRIGÉS

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box, Paper, Typography, Button, IconButton, FormControl, InputLabel,
    Select, MenuItem, Chip, Tooltip, Grid, Menu, Badge, Card, Divider, Dialog
} from '@mui/material';

// Icons
import {
    Laptop as LaptopIcon, Add as AddIcon, Refresh as RefreshIcon,
    Edit as EditIcon, Delete as DeleteIcon, History as HistoryIcon,
    Build as BuildIcon, Assignment as AssignmentIcon, MoreVert as MoreVertIcon,
    FilterList as FilterListIcon, CheckCircle as CheckCircleIcon,
    Error as ErrorIcon, Warning as WarningIcon, Mouse as MouseIcon
} from '@mui/icons-material';

import { useApp } from '../contexts/AppContext';
import { useCache } from '../contexts/CacheContext';
import apiService from '../services/apiService';
import ComputerDialog from '../components/ComputerDialog';
import ComputerHistoryDialog from '../components/ComputerHistoryDialog';
import MaintenanceDialog from '../components/MaintenanceDialog';
import LoanDialog from '../components/LoanDialog';
import AccessoriesManagement from '../pages/AccessoriesManagement';

// Nouveaux composants modernes
import PageHeader from '../components/common/PageHeader';
import SearchInput from '../components/common/SearchInput';
import EmptyState from '../components/common/EmptyState';
import LoadingScreen from '../components/common/LoadingScreen';

const STATUS_CONFIG = {
    available: { label: 'Disponible', color: 'success', icon: CheckCircleIcon },
    loaned: { label: 'Prêté', color: 'info', icon: AssignmentIcon },
    reserved: { label: 'Réservé', color: 'warning', icon: WarningIcon },
    maintenance: { label: 'Maintenance', color: 'warning', icon: BuildIcon },
    retired: { label: 'Retiré', color: 'error', icon: ErrorIcon }
};

const ComputerCard = ({ computer, onEdit, onDelete, onHistory, onMaintenance, onLoan }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const statusConfig = STATUS_CONFIG[computer.status] || STATUS_CONFIG.available;
    const StatusIcon = statusConfig.icon;

    const needsMaintenance = computer.nextMaintenanceDate && new Date(computer.nextMaintenanceDate) < new Date();

    return (
        <Card elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'all 0.2s ease-in-out', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }}>
            <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <LaptopIcon color="primary" />
                        <Typography variant="h6" component="div" noWrap fontWeight="600">
                            {computer.name}
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}><MoreVertIcon /></IconButton>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
                    <Chip icon={<StatusIcon />} label={statusConfig.label} size="small" color={statusConfig.color} />
                    {needsMaintenance && (
                        <Tooltip title="Maintenance requise">
                            <Badge color="error" variant="dot">
                                <BuildIcon fontSize="small" color="action" />
                            </Badge>
                        </Tooltip>
                    )}
                </Box>
                <Typography variant="body2" color="text.secondary"><strong>S/N:</strong> {computer.serialNumber}</Typography>
                <Typography variant="body2" color="text.secondary"><strong>Modèle:</strong> {computer.brand || ''} {computer.model || ''}</Typography>
                {computer.assetTag && <Typography variant="body2" color="text.secondary"><strong>Inventaire:</strong> {computer.assetTag}</Typography>}
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <Divider />
            <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Tooltip title="Modifier"><IconButton size="small" onClick={() => onEdit(computer)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Historique"><IconButton size="small" onClick={() => onHistory(computer)}><HistoryIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Maintenance"><IconButton size="small" onClick={() => onMaintenance(computer)}><BuildIcon fontSize="small" /></IconButton></Tooltip>
                </Box>
                {computer.status === 'available' && (
                    <Button size="small" variant="contained" startIcon={<AssignmentIcon />} onClick={() => onLoan(computer)}>Prêter</Button>
                )}
            </Box>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                <MenuItem onClick={() => { onDelete(computer); setAnchorEl(null); }}><DeleteIcon fontSize="small" sx={{ mr: 1 }} />Supprimer</MenuItem>
            </Menu>
        </Card>
    );
};

const ComputersPage = () => {
    const { showNotification } = useApp();
    const { fetchWithCache, invalidate } = useCache();
    const [computers, setComputers] = useState([]);
    const [users, setUsers] = useState([]);
    const [itStaff, setItStaff] = useState([]);
    const [loans, setLoans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [locationFilter, setLocationFilter] = useState('all');
    const [brandFilter, setBrandFilter] = useState('all');
    
    const [computerDialogOpen, setComputerDialogOpen] = useState(false);
    const [selectedComputer, setSelectedComputer] = useState(null);
    const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
    const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
    const [loanDialogOpen, setLoanDialogOpen] = useState(false);
    const [accessoriesDialogOpen, setAccessoriesDialogOpen] = useState(false);

    const loadData = useCallback(async (force = false) => {
        setIsLoading(true);
        try {
            const [computersRes, configRes, usersRes, loansRes] = await Promise.all([
                fetchWithCache('computers', apiService.getComputers, { force }),
                fetchWithCache('config', apiService.getConfig, { force }),
                fetchWithCache('excel_users', apiService.getExcelUsers, { force }),
                fetchWithCache('loans', apiService.getLoans, { force })
            ]);

            setComputers(Array.isArray(computersRes) ? computersRes : []);
            setItStaff(configRes?.it_staff || []);
            setUsers(usersRes?.success ? Object.values(usersRes.users).flat() : []);
            setLoans(loansRes || []);
        } catch (error) {
            showNotification('error', `Erreur chargement: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [fetchWithCache, showNotification]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const { locations, brands } = useMemo(() => ({
        locations: [...new Set(computers.map(c => c.location).filter(Boolean))].sort(),
        brands: [...new Set(computers.map(c => c.brand).filter(Boolean))].sort()
    }), [computers]);

    const filteredComputers = useMemo(() => {
        let result = [...computers];
        if (statusFilter !== 'all') result = result.filter(c => c.status === statusFilter);
        if (locationFilter !== 'all') result = result.filter(c => c.location === locationFilter);
        if (brandFilter !== 'all') result = result.filter(c => c.brand === brandFilter);
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(c =>
                ['name', 'brand', 'model', 'serialNumber', 'assetTag']
                .some(field => c[field]?.toLowerCase().includes(term))
            );
        }
        return result;
    }, [computers, statusFilter, locationFilter, brandFilter, searchTerm]);

    const handleSaveComputer = async (computerData) => {
        try {
            await apiService.saveComputer(computerData);
            showNotification('success', 'Ordinateur sauvegardé.');
            invalidate('computers');
            await loadData(true);
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); }
        setComputerDialogOpen(false);
    };

    const handleDeleteComputer = async (computer) => {
        if (!window.confirm(`Supprimer ${computer.name} ?`)) return;
        try {
            await apiService.deleteComputer(computer.id);
            showNotification('success', 'Ordinateur supprimé.');
            invalidate('computers');
            await loadData(true);
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); }
    };

    const handleSaveMaintenance = async (computerId, maintenanceData) => {
        try {
            await apiService.addComputerMaintenance(computerId, maintenanceData);
            showNotification('success', 'Maintenance enregistrée.');
            invalidate('computers');
            await loadData(true);
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); }
        setMaintenanceDialogOpen(false);
    };

    const handleCreateLoan = async (loanData) => {
        try {
            await apiService.createLoan(loanData);
            showNotification('success', 'Prêt créé avec succès.');
            invalidate('computers');
            invalidate('loans');
            await loadData(true);
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); }
        setLoanDialogOpen(false);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setLocationFilter('all');
        setBrandFilter('all');
    };

    const hasActiveFilters = searchTerm || statusFilter !== 'all' || locationFilter !== 'all' || brandFilter !== 'all';

    const stats = useMemo(() => ({
        total: computers.length,
        available: computers.filter(c => c.status === 'available').length,
        loaned: computers.filter(c => c.status === 'loaned').length,
        maintenance: computers.filter(c => c.status === 'maintenance').length
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
                        <Button variant="outlined" startIcon={<MouseIcon />} onClick={() => setAccessoriesDialogOpen(true)}>Gérer les accessoires</Button>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setSelectedComputer(null); setComputerDialogOpen(true); }}>Ajouter</Button>
                        <Tooltip title="Actualiser"><IconButton onClick={() => loadData(true)} color="primary"><RefreshIcon /></IconButton></Tooltip>
                    </Box>
                }
            />

            <Paper elevation={2} sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
                <Grid container spacing={2} alignItems="flex-end">
                    <Grid item xs={12} sm={4}><SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Rechercher (nom, marque, S/N...)" fullWidth /></Grid>
                    <Grid item xs={6} sm={2}><FormControl fullWidth size="small"><InputLabel>Statut</InputLabel><Select value={statusFilter} label="Statut" onChange={(e) => setStatusFilter(e.target.value)}><MenuItem value="all">Tous</MenuItem>{Object.entries(STATUS_CONFIG).map(([key, config]) => (<MenuItem key={key} value={key}>{config.label}</MenuItem>))}</Select></FormControl></Grid>
                    <Grid item xs={6} sm={2}><FormControl fullWidth size="small"><InputLabel>Localisation</InputLabel><Select value={locationFilter} label="Localisation" onChange={(e) => setLocationFilter(e.target.value)}><MenuItem value="all">Toutes</MenuItem>{locations.map(loc => (<MenuItem key={loc} value={loc}>{loc}</MenuItem>))}</Select></FormControl></Grid>
                    <Grid item xs={6} sm={2}><FormControl fullWidth size="small"><InputLabel>Marque</InputLabel><Select value={brandFilter} label="Marque" onChange={(e) => setBrandFilter(e.target.value)}><MenuItem value="all">Toutes</MenuItem>{brands.map(brand => (<MenuItem key={brand} value={brand}>{brand}</MenuItem>))}</Select></FormControl></Grid>
                    <Grid item xs={6} sm={2} sx={{ textAlign: 'right' }}><Typography variant="body2" color="text.secondary" fontWeight={500}>{filteredComputers.length} / {computers.length} affichés</Typography></Grid>
                    {hasActiveFilters && <Grid item xs={12}><Button size="small" onClick={clearFilters} startIcon={<FilterListIcon />}>Effacer les filtres</Button></Grid>}
                </Grid>
            </Paper>

            {isLoading ? (
                <LoadingScreen type="cards" count={8} />
            ) : filteredComputers.length === 0 ? (
                <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
                    <EmptyState
                        type={hasActiveFilters ? 'search' : 'empty'}
                        title={hasActiveFilters ? 'Aucun ordinateur trouvé' : 'Aucun ordinateur en stock'}
                        description={hasActiveFilters ? 'Essayez avec d\'autres critères de recherche' : 'Cliquez sur "Ajouter" pour enregistrer votre premier ordinateur'}
                        actionLabel={hasActiveFilters ? 'Effacer les filtres' : 'Ajouter un ordinateur'}
                        onAction={hasActiveFilters ? clearFilters : () => { setSelectedComputer(null); setComputerDialogOpen(true); }}
                    />
                </Paper>
            ) : (
                <Grid container spacing={2}>
                    {filteredComputers.map(computer => (
                        <Grid item key={computer.id} xs={12} sm={6} md={4} lg={3}>
                            <ComputerCard
                                computer={computer}
                                onEdit={(c) => { setSelectedComputer(c); setComputerDialogOpen(true); }}
                                onDelete={handleDeleteComputer}
                                onHistory={(c) => { setSelectedComputer(c); setHistoryDialogOpen(true); }}
                                onMaintenance={(c) => { setSelectedComputer(c); setMaintenanceDialogOpen(true); }}
                                onLoan={(c) => { setSelectedComputer(c); setLoanDialogOpen(true); }}
                            />
                        </Grid>
                    ))}
                </Grid>
            )}

            {computerDialogOpen && <ComputerDialog open={computerDialogOpen} onClose={() => setComputerDialogOpen(false)} computer={selectedComputer} onSave={handleSaveComputer} />}
            {historyDialogOpen && <ComputerHistoryDialog open={historyDialogOpen} onClose={() => setHistoryDialogOpen(false)} computer={selectedComputer} />}
            {maintenanceDialogOpen && <MaintenanceDialog open={maintenanceDialogOpen} onClose={() => setMaintenanceDialogOpen(false)} computer={selectedComputer} onSave={handleSaveMaintenance} />}
            {loanDialogOpen && <LoanDialog open={loanDialogOpen} onClose={() => setLoanDialogOpen(false)} computer={selectedComputer} users={users} itStaff={itStaff} computers={computers} loans={loans} onSave={handleCreateLoan} />}
            {accessoriesDialogOpen && <Dialog open={accessoriesDialogOpen} onClose={() => setAccessoriesDialogOpen(false)} maxWidth="lg" fullWidth><AccessoriesManagement /></Dialog>}
        </Box>
    );
};

export default ComputersPage;