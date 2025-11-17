// src/components/users/UserFilters.js - Filtres avancés avec sauvegarde et recherche intelligente

import React, { useState, useCallback, useMemo } from 'react';
import {
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Chip,
    Autocomplete,
    Button,
    IconButton,
    Collapse,
    Typography,
    Paper,
    Divider,
    Tooltip,
    useTheme,
    alpha
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FilterList as FilterIcon,
    Clear as ClearIcon,
    Save as SaveIcon,
    RestoreFromTrash as RestoreIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Search as SearchIcon,
    VpnKey as VpnKeyIcon,
    Language as LanguageIcon,
    Security as SecurityIcon,
    PhoneIphone as PhoneIcon,
    Computer as ComputerIcon,
    Person as PersonIcon,
    Work as WorkIcon,
    Dashboard as DashboardIcon
} from '@mui/icons-material';

// Composants UI modernes
import { ModernButton, ModernIconButton } from '../ui/ModernUIComponents';

// Données des badges disponibles
const AVAILABLE_BADGES = [
    { id: 'vpn', label: 'VPN', icon: <VpnKeyIcon />, color: 'primary' },
    { id: 'internet', label: 'Internet', icon: <LanguageIcon />, color: 'success' },
    { id: 'admin', label: 'Administrateur', icon: <SecurityIcon />, color: 'error' },
    { id: 'phone', label: 'Téléphone', icon: <PhoneIcon />, color: 'info' },
    { id: 'computer', label: 'Ordinateur', icon: <ComputerIcon />, color: 'secondary' }
];

// Configurations de filtres prédéfinies
const PRESET_FILTERS = [
    {
        id: 'active_users',
        name: 'Utilisateurs Actifs',
        description: 'Utilisateurs avec AD activé',
        filters: { status: 'enabled' },
        icon: <PersonIcon />
    },
    {
        id: 'with_equipment',
        name: 'Avec Équipements',
        description: 'Utilisateurs ayant des prêts actifs',
        filters: { hasLoans: 'yes' },
        icon: <PhoneIcon />
    },
    {
        id: 'it_department',
        name: 'Département IT',
        description: 'Utilisateurs du service informatique',
        filters: { department: 'IT' },
        icon: <WorkIcon />
    },
    {
        id: 'no_recent_login',
        name: 'Inactifs Récents',
        description: 'Utilisateurs sans connexion récente',
        filters: { status: 'all', hasRecentActivity: false },
        icon: <SecurityIcon />
    },
    {
        id: 'high_privilege',
        name: 'Privilèges Élevés',
        description: 'Administrateurs et utilisateurs VPN',
        filters: { badges: ['vpn', 'admin'] },
        icon: <VpnKeyIcon />
    }
];

const UserFilters = memo(({
    filters,
    onChange,
    options = {},
    onSavePreset,
    onLoadPreset,
    className
}) => {
    const theme = useTheme();
    const [expandedSections, setExpandedSections] = useState({
        basic: true,
        advanced: false,
        badges: false,
        presets: false
    });
    const [searchValue, setSearchValue] = useState('');

    // Gérer l'état d'expansion des sections
    const handleToggleSection = useCallback((section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    }, []);

    // Mettre à jour un filtre spécifique
    const handleFilterChange = useCallback((key, value) => {
        onChange({
            ...filters,
            [key]: value
        });
    }, [filters, onChange]);

    // Nettoyer tous les filtres
    const handleClearAll = useCallback(() => {
        onChange({
            server: 'all',
            department: 'all',
            status: 'all',
            badges: [],
            hasLoans: 'all',
            hasRecentActivity: 'all'
        });
        setSearchValue('');
    }, [onChange]);

    // Appliquer un preset
    const handleApplyPreset = useCallback((preset) => {
        onChange({
            ...filters,
            ...preset.filters
        });
    }, [filters, onChange]);

    // Gérer la recherche de texte libre
    const filteredOptions = useMemo(() => {
        if (!searchValue) return options;
        
        const searchTerm = searchValue.toLowerCase();
        return {
            departments: options.departments?.filter(dept => 
                dept.toLowerCase().includes(searchTerm)
            ) || [],
            servers: options.servers?.filter(server => 
                server.toLowerCase().includes(searchTerm)
            ) || []
        };
    }, [searchValue, options]);

    // Statistiques des filtres appliqués
    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (filters.server !== 'all') count++;
        if (filters.department !== 'all') count++;
        if (filters.status !== 'all') count++;
        if (filters.hasLoans !== 'all') count++;
        if (filters.badges && filters.badges.length > 0) count += filters.badges.length;
        return count;
    }, [filters]);

    return (
        <Box className={className} sx={{ width: '100%' }}>
            {/* Header avec actions */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FilterIcon color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                        Filtres Avancés
                    </Typography>
                    {activeFiltersCount > 0 && (
                        <Chip
                            size="small"
                            label={`${activeFiltersCount} filtre${activeFiltersCount > 1 ? 's' : ''} actif${activeFiltersCount > 1 ? 's' : ''}`}
                            color="primary"
                            variant="outlined"
                        />
                    )}
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {activeFiltersCount > 0 && (
                        <ModernButton
                            size="small"
                            variant="outlined"
                            startIcon={<ClearIcon />}
                            onClick={handleClearAll}
                        >
                            Effacer
                        </ModernButton>
                    )}
                    
                    <ModernButton
                        size="small"
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={() => onSavePreset && onSavePreset(filters)}
                    >
                        Sauvegarder
                    </ModernButton>
                </Box>
            </Box>

            <Paper 
                sx={{ 
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    borderRadius: 2,
                    overflow: 'hidden'
                }}
            >
                {/* Recherche rapide */}
                <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Recherche rapide dans les options..."
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        InputProps={{
                            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                '&.Mui-focused fieldset': {
                                    borderColor: theme.palette.primary.main,
                                },
                            },
                        }}
                    />
                </Box>

                <Divider />

                {/* Filtres de base */}
                <Box sx={{ p: 2 }}>
                    <Box 
                        sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            mb: 2 
                        }}
                        onClick={() => handleToggleSection('basic')}
                    >
                        <Typography variant="subtitle1" fontWeight={600}>
                            Filtres de Base
                        </Typography>
                        <ModernIconButton size="small">
                            {expandedSections.basic ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </ModernIconButton>
                    </Box>

                    <AnimatePresence>
                        {expandedSections.basic && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Serveur</InputLabel>
                                            <Select
                                                value={filters.server}
                                                label="Serveur"
                                                onChange={(e) => handleFilterChange('server', e.target.value)}
                                                sx={{ borderRadius: 2 }}
                                            >
                                                <MenuItem value="all">Tous les serveurs</MenuItem>
                                                {filteredOptions.servers?.map((server) => (
                                                    <MenuItem key={server} value={server}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <DashboardIcon sx={{ fontSize: 16 }} />
                                                            {server}
                                                        </Box>
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    <Grid item xs={12} sm={6} md={3}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Département</InputLabel>
                                            <Select
                                                value={filters.department}
                                                label="Département"
                                                onChange={(e) => handleFilterChange('department', e.target.value)}
                                                sx={{ borderRadius: 2 }}
                                            >
                                                <MenuItem value="all">Tous les départements</MenuItem>
                                                {filteredOptions.departments?.map((dept) => (
                                                    <MenuItem key={dept} value={dept}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <WorkIcon sx={{ fontSize: 16 }} />
                                                            {dept}
                                                        </Box>
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    <Grid item xs={12} sm={6} md={3}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Statut AD</InputLabel>
                                            <Select
                                                value={filters.status}
                                                label="Statut AD"
                                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                                sx={{ borderRadius: 2 }}
                                            >
                                                <MenuItem value="all">Tous les statuts</MenuItem>
                                                <MenuItem value="enabled">AD Activé</MenuItem>
                                                <MenuItem value="disabled">AD Désactivé</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    <Grid item xs={12} sm={6} md={3}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Prêts</InputLabel>
                                            <Select
                                                value={filters.hasLoans}
                                                label="Prêts"
                                                onChange={(e) => handleFilterChange('hasLoans', e.target.value)}
                                                sx={{ borderRadius: 2 }}
                                            >
                                                <MenuItem value="all">Tous</MenuItem>
                                                <MenuItem value="yes">Avec prêts actifs</MenuItem>
                                                <MenuItem value="no">Sans prêts</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Box>

                <Divider />

                {/* Filtres par badges */}
                <Box sx={{ p: 2 }}>
                    <Box 
                        sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            mb: 2 
                        }}
                        onClick={() => handleToggleSection('badges')}
                    >
                        <Typography variant="subtitle1" fontWeight={600}>
                            Filtres par Badges
                        </Typography>
                        <ModernIconButton size="small">
                            {expandedSections.badges ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </ModernIconButton>
                    </Box>

                    <AnimatePresence>
                        {expandedSections.badges && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Autocomplete
                                    multiple
                                    options={AVAILABLE_BADGES}
                                    getOptionLabel={(option) => option.label}
                                    value={AVAILABLE_BADGES.filter(badge => 
                                        filters.badges?.includes(badge.id)
                                    )}
                                    onChange={(event, newValue) => {
                                        const badgeIds = newValue.map(badge => badge.id);
                                        handleFilterChange('badges', badgeIds);
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            size="small"
                                            label="Sélectionner des badges"
                                            placeholder="Rechercher des badges..."
                                        />
                                    )}
                                    renderOption={(props, option) => (
                                        <Box component="li" {...props}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Box sx={{ color: `${option.color}.main` }}>
                                                    {option.icon}
                                                </Box>
                                                <Typography variant="body2">
                                                    {option.label}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    )}
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => (
                                            <Chip
                                                {...getTagProps({ index })}
                                                key={option.id}
                                                icon={option.icon}
                                                label={option.label}
                                                color={option.color}
                                                variant="outlined"
                                                size="small"
                                            />
                                        ))
                                    }
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                        },
                                    }}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Box>

                <Divider />

                {/* Presets prédéfinis */}
                <Box sx={{ p: 2 }}>
                    <Box 
                        sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            mb: 2 
                        }}
                        onClick={() => handleToggleSection('presets')}
                    >
                        <Typography variant="subtitle1" fontWeight={600}>
                            Filtres Prédéfinis
                        </Typography>
                        <ModernIconButton size="small">
                            {expandedSections.presets ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </ModernIconButton>
                    </Box>

                    <AnimatePresence>
                        {expandedSections.presets && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Grid container spacing={2}>
                                    {PRESET_FILTERS.map((preset) => (
                                        <Grid item xs={12} sm={6} md={4} key={preset.id}>
                                            <Box
                                                sx={{
                                                    p: 2,
                                                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                                                    borderRadius: 2,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    '&:hover': {
                                                        borderColor: theme.palette.primary.main,
                                                        bgcolor: alpha(theme.palette.primary.main, 0.04)
                                                    }
                                                }}
                                                onClick={() => handleApplyPreset(preset)}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                    <Box sx={{ color: 'primary.main' }}>
                                                        {preset.icon}
                                                    </Box>
                                                    <Typography variant="subtitle2" fontWeight={600}>
                                                        {preset.name}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    {preset.description}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Box>
            </Paper>

            {/* Résumé des filtres actifs */}
            <AnimatePresence>
                {activeFiltersCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Paper 
                            sx={{ 
                                mt: 2, 
                                p: 2, 
                                bgcolor: alpha(theme.palette.primary.main, 0.04),
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                            }}
                        >
                            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                                Filtres Actifs:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {filters.server !== 'all' && (
                                    <Chip size="small" label={`Serveur: ${filters.server}`} color="primary" />
                                )}
                                {filters.department !== 'all' && (
                                    <Chip size="small" label={`Département: ${filters.department}`} color="primary" />
                                )}
                                {filters.status !== 'all' && (
                                    <Chip 
                                        size="small" 
                                        label={`Statut: ${filters.status === 'enabled' ? 'AD Activé' : 'AD Désactivé'}`} 
                                        color="primary" 
                                    />
                                )}
                                {filters.hasLoans !== 'all' && (
                                    <Chip 
                                        size="small" 
                                        label={`Prêts: ${filters.hasLoans === 'yes' ? 'Avec prêts' : 'Sans prêts'}`} 
                                        color="primary" 
                                    />
                                )}
                                {filters.badges?.map((badgeId) => {
                                    const badge = AVAILABLE_BADGES.find(b => b.id === badgeId);
                                    return badge ? (
                                        <Chip
                                            key={badgeId}
                                            size="small"
                                            icon={badge.icon}
                                            label={badge.label}
                                            color={badge.color}
                                            variant="outlined"
                                        />
                                    ) : null;
                                })}
                            </Box>
                        </Paper>
                    </motion.div>
                )}
            </AnimatePresence>
        </Box>
    );
});

UserFilters.displayName = 'UserFilters';

export default UserFilters;
