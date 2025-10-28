import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Menu from '@mui/material/Menu';
import Badge from '@mui/material/Badge';
import LaptopIcon from '@mui/icons-material/Laptop';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import BuildIcon from '@mui/icons-material/Build';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FilterListIcon from '@mui/icons-material/FilterList';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';

import { useApp } from '../contexts/AppContext';
import { useCache } from '../contexts/CacheContext';
import ComputerDialog from '../components/ComputerDialog';
import ComputerHistoryDialog from '../components/ComputerHistoryDialog';
import MaintenanceDialog from '../components/MaintenanceDialog';
import LoanDialog from '../components/LoanDialog';

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

    const needsMaintenance = computer.nextMaintenanceDate && 
        new Date(computer.nextMaintenanceDate) < new Date();

    return (
        <Card elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LaptopIcon color="primary" />
                        <Typography variant="h6" component="div" noWrap>
                            {computer.name}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Chip 
                            icon={<StatusIcon />}
                            label={statusConfig.label} 
                            size="small" 
                            color={statusConfig.color}
                        />
                        {needsMaintenance && (
                            <Tooltip title="Maintenance requise">
                                <Badge color="error" variant="dot">
                                    <BuildIcon fontSize="small" color="action" />
                                </Badge>
                            </Tooltip>
                        )}
                    </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        <strong>Marque:</strong> {computer.brand || '-'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        <strong>Modèle:</strong> {computer.model || '-'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        <strong>S/N:</strong> {computer.serialNumber}
                    </Typography>
                    {computer.assetTag && (
                        <Typography variant="body2" color="text.secondary">
                            <strong>Inventaire:</strong> {computer.assetTag}
                        </Typography>
                    )}
                </Box>

                {computer.specifications && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                            SPÉCIFICATIONS
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {computer.specifications.cpu && (
                                <Chip label={computer.specifications.cpu} size="small" variant="outlined" />
                            )}
                            {computer.specifications.ram && (
                                <Chip label={computer.specifications.ram} size="small" variant="outlined" />
                            )}
                            {computer.specifications.os && (
                                <Chip label={computer.specifications.os} size="small" variant="outlined" />
                            )}
                        </Box>
                    </Box>
                )}

                {computer.location && (
                    <Typography variant="body2" color="text.secondary">
                        <strong>Localisation:</strong> {computer.location}
                    </Typography>
                )}

                {computer.condition && (
                    <Typography variant="body2" color="text.secondary">
                        <strong>État:</strong> {computer.condition}
                    </Typography>
                )}

                {computer.totalLoans > 0 && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary">
                            {computer.totalLoans} prêt(s) • {computer.totalDaysLoaned || 0} jours total
                        </Typography>
                    </Box>
                )}
            </CardContent>

            <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Modifier">
                        <IconButton size="small" onClick={() => onEdit(computer)}>
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Historique">
                        <IconButton size="small" onClick={() => onHistory(computer)}>
                            <HistoryIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Maintenance">
                        <IconButton size="small" onClick={() => onMaintenance(computer)}>
                            <BuildIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
                <Box>
                    {computer.status === 'available' && (
                        <Button 
                            size="small" 
                            variant="contained" 
                            startIcon={<AssignmentIcon />}
                            onClick={() => onLoan(computer)}
                        >
                            Prêter
                        </Button>
                    )}
                    <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
                        <MoreVertIcon fontSize="small" />
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}
                    >
                        <MenuItem onClick={() => { onDelete(computer); setAnchorEl(null); }}>
                            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                            Supprimer
                        </MenuItem>
                    </Menu>
                </Box>
            </CardActions>
        </Card>
    );
};

const ComputersPage = () => {
    const { showNotification } = useApp();
    const { fetchWithCache, invalidate } = useCache();
    const [computers, setComputers] = useState([]);
    const [users, setUsers] = useState([]);
    const [itStaff, setItStaff] = useState([]);
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

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [computersData, config, usersData] = await Promise.all([
                fetchWithCache('computers', () => window.electronAPI.getComputers(), { force: false }),
                fetchWithCache('config', () => window.electronAPI.getConfig()),
                fetchWithCache('users', () => window.electronAPI.syncExcelUsers())
            ]);

            setComputers(computersData.data || []);
            setItStaff(config.data?.it_staff || []);
            
            const allUsers = Object.values(usersData.data?.users || {}).flat();
            setUsers(allUsers);
        } catch (error) {
            showNotification('error', `Erreur chargement: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const { locations, brands } = useMemo(() => {
        const locSet = new Set(computers.map(c => c.location).filter(Boolean));
        const brandSet = new Set(computers.map(c => c.brand).filter(Boolean));
        return {
            locations: Array.from(locSet).sort(),
            brands: Array.from(brandSet).sort()
        };
    }, [computers]);

    const filteredComputers = useMemo(() => {
        let result = [...computers];
        
        if (statusFilter !== 'all') {
            result = result.filter(c => c.status === statusFilter);
        }
        
        if (locationFilter !== 'all') {
            result = result.filter(c => c.location === locationFilter);
        }
        
        if (brandFilter !== 'all') {
            result = result.filter(c => c.brand === brandFilter);
        }
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(c =>
                c.name?.toLowerCase().includes(term) ||
                c.brand?.toLowerCase().includes(term) ||
                c.model?.toLowerCase().includes(term) ||
                c.serialNumber?.toLowerCase().includes(term) ||
                c.assetTag?.toLowerCase().includes(term)
            );
        }
        
        return result;
    }, [computers, statusFilter, locationFilter, brandFilter, searchTerm]);

    const handleSaveComputer = async (computerData) => {
        try {
            const result = await window.electronAPI.saveComputer(computerData);
            if (result.success) {
                showNotification('success', 'Ordinateur sauvegardé.');
                invalidate('computers');
                await loadData();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            showNotification('error', `Erreur: ${error.message}`);
        }
        setComputerDialogOpen(false);
    };

    const handleDeleteComputer = async (computer) => {
        if (!window.confirm(`Supprimer ${computer.name} ?`)) return;
        
        try {
            const result = await window.electronAPI.deleteComputer(computer.id);
            if (result.success) {
                showNotification('success', 'Ordinateur supprimé.');
                invalidate('computers');
                await loadData();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            showNotification('error', `Erreur: ${error.message}`);
        }
    };

    const handleSaveMaintenance = async (computerId, maintenanceData) => {
        try {
            const result = await window.electronAPI.addComputerMaintenance(computerId, maintenanceData);
            if (result.success) {
                showNotification('success', 'Maintenance enregistrée.');
                invalidate('computers');
                await loadData();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            showNotification('error', `Erreur: ${error.message}`);
        }
        setMaintenanceDialogOpen(false);
    };

    const handleCreateLoan = async (loanData) => {
        try {
            const result = await window.electronAPI.createLoan(loanData);
            if (result.success) {
                showNotification('success', 'Prêt créé avec succès.');
                invalidate('computers');
                invalidate('loans');
                await loadData();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            showNotification('error', `Erreur: ${error.message}`);
        }
        setLoanDialogOpen(false);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setLocationFilter('all');
        setBrandFilter('all');
    };

    const hasActiveFilters = searchTerm || statusFilter !== 'all' || 
                            locationFilter !== 'all' || brandFilter !== 'all';

    const stats = useMemo(() => {
        return {
            total: computers.length,
            available: computers.filter(c => c.status === 'available').length,
            loaned: computers.filter(c => c.status === 'loaned').length,
            maintenance: computers.filter(c => c.status === 'maintenance').length
        };
    }, [computers]);

    return (
        <Box sx={{ p: 2 }}>
            {/* Header Moderne */}
            <PageHeader
                title="Stock Ordinateurs"
                subtitle={`Gestion complète du parc informatique et prêts d'équipements`}
                icon={LaptopIcon}
                stats={[
                    {
                        label: 'Total',
                        value: stats.total,
                        icon: LaptopIcon
                    },
                    {
                        label: 'Disponibles',
                        value: stats.available,
                        icon: CheckCircleIcon
                    },
                    {
                        label: 'Prêtés',
                        value: stats.loaned,
                        icon: AssignmentIcon
                    },
                    {
                        label: 'En maintenance',
                        value: stats.maintenance,
                        icon: BuildIcon
                    }
                ]}
                actions={
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => {
                                setSelectedComputer(null);
                                setComputerDialogOpen(true);
                            }}
                            sx={{ borderRadius: 2 }}
                        >
                            Ajouter
                        </Button>
                        <Tooltip title="Actualiser">
                            <IconButton
                                onClick={() => loadData()}
                                color="primary"
                                sx={{
                                    bgcolor: 'primary.lighter',
                                    '&:hover': { bgcolor: 'primary.light' }
                                }}
                            >
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                }
            />

            {/* Filtres */}
            <Paper elevation={2} sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <Box sx={{ flexGrow: 1, minWidth: 300 }}>
                        <SearchInput
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Rechercher (nom, marque, modèle, S/N...)"
                            fullWidth
                        />
                    </Box>

                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Statut</InputLabel>
                        <Select
                            value={statusFilter}
                            label="Statut"
                            onChange={(e) => setStatusFilter(e.target.value)}
                            sx={{ borderRadius: 2 }}
                        >
                            <MenuItem value="all">Tous</MenuItem>
                            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                <MenuItem key={key} value={key}>{config.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Localisation</InputLabel>
                        <Select
                            value={locationFilter}
                            label="Localisation"
                            onChange={(e) => setLocationFilter(e.target.value)}
                            sx={{ borderRadius: 2 }}
                        >
                            <MenuItem value="all">Toutes</MenuItem>
                            {locations.map(loc => (
                                <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Marque</InputLabel>
                        <Select
                            value={brandFilter}
                            label="Marque"
                            onChange={(e) => setBrandFilter(e.target.value)}
                            sx={{ borderRadius: 2 }}
                        >
                            <MenuItem value="all">Toutes</MenuItem>
                            {brands.map(brand => (
                                <MenuItem key={brand} value={brand}>{brand}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {hasActiveFilters && (
                        <Button
                            size="small"
                            onClick={clearFilters}
                            startIcon={<FilterListIcon />}
                            sx={{ borderRadius: 2 }}
                        >
                            Effacer filtres
                        </Button>
                    )}

                    <Box sx={{ flexGrow: 0.1 }} />
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        {filteredComputers.length} / {computers.length} affiché(s)
                    </Typography>
                </Box>
            </Paper>

            {/* Grille d'ordinateurs */}
            {isLoading ? (
                <LoadingScreen type="cards" count={8} />
            ) : filteredComputers.length === 0 ? (
                <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
                    <EmptyState
                        type={hasActiveFilters ? 'search' : 'empty'}
                        title={hasActiveFilters ? 'Aucun ordinateur trouvé' : 'Aucun ordinateur en stock'}
                        description={
                            hasActiveFilters
                                ? 'Essayez avec d\'autres critères de recherche'
                                : 'Cliquez sur "Ajouter" pour enregistrer votre premier ordinateur'
                        }
                        actionLabel={hasActiveFilters ? 'Effacer les filtres' : 'Ajouter un ordinateur'}
                        onAction={
                            hasActiveFilters
                                ? clearFilters
                                : () => {
                                      setSelectedComputer(null);
                                      setComputerDialogOpen(true);
                                  }
                        }
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

            {computerDialogOpen && (
                <ComputerDialog
                    open={computerDialogOpen}
                    onClose={() => setComputerDialogOpen(false)}
                    computer={selectedComputer}
                    onSave={handleSaveComputer}
                />
            )}

            {historyDialogOpen && (
                <ComputerHistoryDialog
                    open={historyDialogOpen}
                    onClose={() => setHistoryDialogOpen(false)}
                    computer={selectedComputer}
                />
            )}

            {maintenanceDialogOpen && (
                <MaintenanceDialog
                    open={maintenanceDialogOpen}
                    onClose={() => setMaintenanceDialogOpen(false)}
                    computer={selectedComputer}
                    onSave={handleSaveMaintenance}
                />
            )}

            {loanDialogOpen && (
                <LoanDialog
                    open={loanDialogOpen}
                    onClose={() => setLoanDialogOpen(false)}
                    computer={selectedComputer}
                    users={users}
                    itStaff={itStaff}
                    computers={computers}
                    onSave={handleCreateLoan}
                />
            )}
        </Box>
    );
};

export default ComputersPage;