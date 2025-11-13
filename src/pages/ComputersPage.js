// src/pages/ComputersPage.js - VERSION FINALE AVEC VUES MULTIPLES

import React, { useState, useMemo } from 'react';
import {
    Box, Paper, Typography, Button, IconButton, FormControl, InputLabel,
    Select, MenuItem, Chip, Tooltip, Grid, Menu, Card, Divider, Dialog,
    DialogTitle, DialogContent, DialogActions, Autocomplete, TextField,
    ToggleButtonGroup, ToggleButton, List, ListItem, ListItemText, ListItemIcon
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { addDays } from 'date-fns';

// Icons
import {
    Laptop as LaptopIcon, Add as AddIcon, Refresh as RefreshIcon,
    Edit as EditIcon, Delete as DeleteIcon, History as HistoryIcon,
    Build as BuildIcon, Assignment as AssignmentIcon, MoreVert as MoreVertIcon,
    CheckCircle as CheckCircleIcon, Error as ErrorIcon, Warning as WarningIcon,
    Mouse as MouseIcon, Bolt as BoltIcon, FilterListOff as FilterListOffIcon,
    ViewModule as ViewModuleIcon, ViewList as ViewListIcon
} from '@mui/icons-material';

// ... (tous les autres imports restent les mêmes)
import { useApp } from '../contexts/AppContext';
import { useCache } from '../contexts/CacheContext';
import apiService from '../services/apiService';
import ComputerDialog from '../components/ComputerDialog';
import ComputerHistoryDialog from '../components/ComputerHistoryDialog';
import MaintenanceDialog from '../components/MaintenanceDialog';
import LoanDialog from '../components/LoanDialog';
import AccessoriesManagement from '../pages/AccessoriesManagement';
import PageHeader from '../components/common/PageHeader';
import SearchInput from '../components/common/SearchInput';
import EmptyState from '../components/common/EmptyState';
import LoadingScreen from '../components/common/LoadingScreen';


const STATUS_CONFIG = {
    available: { label: 'Disponible', color: 'success', icon: <CheckCircleIcon sx={{fontSize: 16}} /> },
    loaned: { label: 'Prêté', color: 'info', icon: <AssignmentIcon sx={{fontSize: 16}} /> },
    reserved: { label: 'Réservé', color: 'warning', icon: <WarningIcon sx={{fontSize: 16}} /> },
    maintenance: { label: 'Maintenance', color: 'warning', icon: <BuildIcon sx={{fontSize: 16}} /> },
    retired: { label: 'Retiré', color: 'error', icon: <ErrorIcon sx={{fontSize: 16}} /> }
};

// --- VUE CARTE (COMPACTÉE) ---
const ComputerCard = ({ computer, onEdit, onDelete, onHistory, onMaintenance, onLoan }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const statusConfig = STATUS_CONFIG[computer.status] || {};
    return (
        <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="600" noWrap>{computer.name}</Typography>
                    <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}><MoreVertIcon /></IconButton>
                </Box>
                <Chip icon={statusConfig.icon} label={statusConfig.label} size="small" color={statusConfig.color} sx={{ mb: 1 }} />
                <Typography variant="caption" display="block" color="text.secondary">S/N: {computer.serialNumber}</Typography>
                <Typography variant="caption" display="block" color="text.secondary">Modèle: {computer.brand} {computer.model}</Typography>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <Divider />
            <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
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

// --- VUE LISTE COMPACTE ---
const ComputerListItem = ({ computer, onEdit, onLoan }) => {
    const statusConfig = STATUS_CONFIG[computer.status] || {};
    return (
        <ListItem divider secondaryAction={
            computer.status === 'available' && (
                <Button size="small" variant="contained" startIcon={<AssignmentIcon />} onClick={() => onLoan(computer)}>Prêter</Button>
            )
        }>
            <ListItemIcon><LaptopIcon color={computer.status === 'available' ? 'success' : 'action'} /></ListItemIcon>
            <ListItemText
                primary={<Typography variant="body2" fontWeight={500}>{computer.name}</Typography>}
                secondary={`${computer.brand} ${computer.model} - S/N: ${computer.serialNumber}`}
            />
            <Chip label={statusConfig.label} color={statusConfig.color} size="small" sx={{ mr: 2 }} />
            <Tooltip title="Modifier"><IconButton size="small" onClick={() => onEdit(computer)}><EditIcon /></IconButton></Tooltip>
        </ListItem>
    );
};

// QuickLoanDialog supprimé - Utiliser LoanDialog pour tous les prêts

const ComputersPage = () => {
    const { showNotification } = useApp();
    const { cache, invalidate, isLoading } = useCache();
    
    const [view, setView] = useState('list'); // 'grid', 'list' - Vue liste par défaut
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [locationFilter, setLocationFilter] = useState('all');
    const [brandFilter, setBrandFilter] = useState('all');
    const [dialog, setDialog] = useState({ type: null, data: null });

    // ... (toute la logique de gestion des données et des dialogues reste identique)
    const { computers, users, itStaff, loans } = useMemo(() => ({
        computers: cache.computers || [],
        users: Object.values(cache.excel_users || {}).flat(),
        itStaff: cache.config?.it_staff || [],
        loans: cache.loans || [],
    }), [cache]);

    const brands = useMemo(() => [...new Set(computers.map(c => c.brand).filter(Boolean))], [computers]);
    const locations = useMemo(() => [...new Set(computers.map(c => c.location).filter(Boolean))], [computers]);

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

    const handleSaveComputer = async (computerData) => {
        try {
            await apiService.saveComputer(computerData);
            showNotification('success', 'Ordinateur sauvegardé.');
            await invalidate('computers');
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); }
        setDialog({ type: null, data: null });
    };

    const handleDeleteComputer = async (computer) => {
        if (!window.confirm(`Supprimer ${computer.name} ?`)) return;
        try {
            await apiService.deleteComputer(computer.id);
            showNotification('success', 'Ordinateur supprimé.');
            await invalidate('computers');
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); }
    };

    const handleSaveMaintenance = async (computerId, maintenanceData) => {
        try {
            await apiService.addComputerMaintenance(computerId, maintenanceData);
            showNotification('success', 'Maintenance enregistrée.');
            await invalidate('computers');
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); }
        setDialog({ type: null, data: null });
    };

    const handleCreateLoan = async (loanData) => {
        try {
            await apiService.createLoan(loanData);
            showNotification('success', 'Prêt créé avec succès.');
            await Promise.all([invalidate('computers'), invalidate('loans')]);
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); }
        setDialog({ type: null, data: null });
    };

    const clearFilters = () => { setSearchTerm(''); setStatusFilter('all'); setLocationFilter('all'); setBrandFilter('all'); };
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
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Button variant="outlined" startIcon={<MouseIcon />} onClick={() => setDialog({ type: 'accessories' })}>Gérer les accessoires</Button>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog({ type: 'computer' })}>Ajouter</Button>
                        <Tooltip title="Actualiser"><IconButton onClick={() => invalidate('computers')} color="primary"><RefreshIcon /></IconButton></Tooltip>
                    </Box>
                }
            />

            <Paper elevation={2} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}><SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Rechercher..." fullWidth /></Grid>
                    <Grid item xs={6} sm={3} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Statut</InputLabel>
                            <Select value={statusFilter} label="Statut" onChange={(e) => setStatusFilter(e.target.value)}>
                                <MenuItem value="all">Tous</MenuItem>
                                {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                                    <MenuItem key={key} value={key}>{label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6} sm={3} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Localisation</InputLabel>
                            <Select value={locationFilter} label="Localisation" onChange={(e) => setLocationFilter(e.target.value)}>
                                <MenuItem value="all">Toutes</MenuItem>
                                {locations.map(location => (
                                    <MenuItem key={location} value={location}>{location}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6} sm={3} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Marque</InputLabel>
                            <Select value={brandFilter} label="Marque" onChange={(e) => setBrandFilter(e.target.value)}>
                                <MenuItem value="all">Toutes</MenuItem>
                                {brands.map(brand => (
                                    <MenuItem key={brand} value={brand}>{brand}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6} sm={3} md={2}>
                        <ToggleButtonGroup value={view} exclusive onChange={(e, newView) => newView && setView(newView)} size="small">
                            <Tooltip title="Vue Cartes"><ToggleButton value="grid"><ViewModuleIcon /></ToggleButton></Tooltip>
                            <Tooltip title="Vue Liste"><ToggleButton value="list"><ViewListIcon /></ToggleButton></Tooltip>
                        </ToggleButtonGroup>
                    </Grid>
                    {hasActiveFilters && <Grid item xs={12}><Button size="small" onClick={clearFilters} startIcon={<FilterListOffIcon />}>Effacer les filtres</Button></Grid>}
                </Grid>
            </Paper>

            {isLoading ? <LoadingScreen type="cards" /> : filteredComputers.length === 0 ? (
                <EmptyState type="search" />
            ) : (
                <Box>
                    {view === 'grid' && (
                        <Grid container spacing={2}>
                            {filteredComputers.map(computer => (
                                <Grid item key={computer.id} xs={12} sm={6} md={4} lg={3} xl={2}>
                                    <ComputerCard computer={computer} onEdit={(c) => setDialog({ type: 'computer', data: c })} onDelete={handleDeleteComputer} onHistory={(c) => setDialog({ type: 'history', data: c })} onMaintenance={(c) => setDialog({ type: 'maintenance', data: c })} onLoan={(c) => setDialog({ type: 'loan', data: c })} />
                                </Grid>
                            ))}
                        </Grid>
                    )}
                    {view === 'list' && (
                        <Paper elevation={2}><List disablePadding>{filteredComputers.map(computer => <ComputerListItem key={computer.id} computer={computer} onEdit={(c) => setDialog({ type: 'computer', data: c })} onLoan={(c) => setDialog({ type: 'loan', data: c })} />)}</List></Paper>
                    )}
                </Box>
            )}

            {/* Dialogues */}
            <ComputerDialog open={dialog.type === 'computer'} onClose={() => setDialog({ type: null })} computer={dialog.data} onSave={handleSaveComputer} />
            <ComputerHistoryDialog open={dialog.type === 'history'} onClose={() => setDialog({ type: null })} computer={dialog.data} />
            <MaintenanceDialog open={dialog.type === 'maintenance'} onClose={() => setDialog({ type: null })} computer={dialog.data} onSave={handleSaveMaintenance} />
            <LoanDialog open={dialog.type === 'loan'} onClose={() => setDialog({ type: null })} computer={dialog.data} users={users} itStaff={itStaff} computers={computers} loans={loans} onSave={handleCreateLoan} />
            <Dialog open={dialog.type === 'accessories'} onClose={() => setDialog({ type: null })} maxWidth="lg" fullWidth><AccessoriesManagement /></Dialog>
        </Box>
    );
};

export default ComputersPage;