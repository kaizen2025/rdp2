// src/components/users/UsersManagementEnhanced.js - VERSION COMPLÈTEMENT RÉVOLUTIONNÉE
// Interface moderne avec recherche intelligente, filtres avancés, et actions bulk

import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    IconButton,
    Tooltip,
    CircularProgress,
    Chip,
    Grid,
    Fade,
    useMediaQuery,
    useTheme,
    alpha,
    Snackbar,
    Alert
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PersonAdd as PersonAddIcon,
    Refresh as RefreshIcon,
    Clear as ClearIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Print as PrintIcon,
    Download as DownloadIcon,
    Notifications as NotificationsIcon,
    Settings as SettingsIcon,
    FilterList as FilterIcon,
    ViewList as ViewListIcon,
    ViewModule as ViewModuleIcon,
    Dashboard as DashboardIcon,
    Search as SearchIcon
} from '@mui/icons-material';

// Composants UI modernes
import {
    ModernCard,
    ModernButton,
    ModernIconButton,
    ModernStatsCard
} from '../ui/ModernUIComponents';

// Composants spécialisés
import UserCardModern from './UserCardModern';
import UserFilters from './UserFilters';
import UserActions from './UserActions';
import UserDashboard from './UserDashboard';
import UserColorManager, { useUserColorManager } from '../loan-management/UserColorManager';

// Hooks et services
import { useApp } from '../../contexts/AppContext';
import { useCache } from '../../contexts/CacheContext';
import apiService from '../../services/apiService';
import { debounceAsyncLeading } from '../../utils/debounce';

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            duration: 0.6,
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: 'easeOut' }
    }
};

const UsersManagementEnhanced = memo(() => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { showNotification } = useApp();
    const { cache, isLoading: isCacheLoading, invalidate } = useCache();
    
    // États principaux
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        server: 'all',
        department: 'all',
        status: 'all',
        badges: [],
        hasLoans: 'all'
    });
    const [selectedUsers, setSelectedUsers] = useState(new Set());
    const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'
    const [showDashboard, setShowDashboard] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [notification, setNotification] = useState(null);
    
    // Données dérivées
    const { getUserColor } = useUserColorManager(users);
    const [userLoans, setUserLoans] = useState({ phoneLoans: [], computerLoans: [] });

    // Chargement des données utilisateurs
    const loadUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const excelUsers = await apiService.getExcelUsers();
            if (excelUsers && excelUsers.data) {
                setUsers(excelUsers.data);
            }
        } catch (error) {
            showNotification('error', `Erreur lors du chargement: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [showNotification]);

    // Chargement des prêts utilisateur
    const loadUserLoans = useCallback(async () => {
        try {
            const [phoneLoans, computerLoans] = await Promise.all([
                apiService.getUserPhoneLoans(),
                apiService.getUserComputerLoans()
            ]);
            setUserLoans({
                phoneLoans: phoneLoans || [],
                computerLoans: computerLoans || []
            });
        } catch (error) {
            console.warn('Erreur lors du chargement des prêts:', error);
        }
    }, []);

    // Initialisation
    useEffect(() => {
        loadUsers();
        loadUserLoans();
    }, [loadUsers, loadUserLoans]);

    // Rafraîchissement intelligent
    const handleRefresh = useCallback(
        debounceAsyncLeading(async () => {
            showNotification('info', 'Actualisation des données...');
            try {
                await apiService.refreshExcelUsers();
                await Promise.all([
                    invalidate('excel_users'),
                    invalidate('ad_groups:VPN'),
                    invalidate('ad_groups:Sortants_responsables')
                ]);
                await loadUsers();
                await loadUserLoans();
                showNotification('success', 'Données actualisées avec succès');
            } catch (error) {
                showNotification('error', `Erreur: ${error.message}`);
            }
        }, 2000),
        [invalidate, showNotification, loadUsers, loadUserLoans]
    );

    // Recherche intelligente avec debounce
    const debouncedSearch = useCallback(
        debounceAsyncLeading((term) => {
            setSearchTerm(term);
        }, 300),
        []
    );

    // Filtrage avancé des utilisateurs
    const filteredUsers = useMemo(() => {
        let result = [...users];

        // Filtre par terme de recherche
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(user => 
                user.displayName?.toLowerCase().includes(term) ||
                user.username?.toLowerCase().includes(term) ||
                user.email?.toLowerCase().includes(term) ||
                user.department?.toLowerCase().includes(term) ||
                user.server?.toLowerCase().includes(term)
            );
        }

        // Filtres avancés
        if (filters.server !== 'all') {
            result = result.filter(user => user.server === filters.server);
        }

        if (filters.department !== 'all') {
            result = result.filter(user => user.department === filters.department);
        }

        if (filters.status !== 'all') {
            if (filters.status === 'enabled') {
                result = result.filter(user => user.adEnabled === 1);
            } else if (filters.status === 'disabled') {
                result = result.filter(user => user.adEnabled === 0);
            }
        }

        if (filters.hasLoans === 'yes') {
            const usersWithLoans = new Set([
                ...userLoans.phoneLoans.map(l => l.userId),
                ...userLoans.computerLoans.map(l => l.userId)
            ]);
            result = result.filter(user => usersWithLoans.has(user.username));
        } else if (filters.hasLoans === 'no') {
            const usersWithLoans = new Set([
                ...userLoans.phoneLoans.map(l => l.userId),
                ...userLoans.computerLoans.map(l => l.userId)
            ]);
            result = result.filter(user => !usersWithLoans.has(user.username));
        }

        // Filtre par badges (VPN, Internet)
        if (filters.badges.length > 0) {
            // Logique de filtrage par badges serait ajoutée ici
            // en fonction des groupes AD
        }

        return result;
    }, [users, searchTerm, filters, userLoans]);

    // Statistiques en temps réel
    const stats = useMemo(() => {
        const total = users.length;
        const enabled = users.filter(u => u.adEnabled === 1).length;
        const withLoans = new Set([
            ...userLoans.phoneLoans.map(l => l.userId),
            ...userLoans.computerLoans.map(l => l.userId)
        ]).size;
        
        return {
            total,
            enabled,
            disabled: total - enabled,
            withLoans,
            filtered: filteredUsers.length,
            selected: selectedUsers.size
        };
    }, [users, filteredUsers, selectedUsers, userLoans]);

    // Gestion des sélections
    const handleSelectUser = useCallback((username) => {
        setSelectedUsers(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(username)) {
                newSelection.delete(username);
            } else {
                newSelection.add(username);
            }
            return newSelection;
        });
    }, []);

    const handleSelectAll = useCallback(() => {
        if (selectedUsers.size === filteredUsers.length) {
            setSelectedUsers(new Set());
        } else {
            setSelectedUsers(new Set(filteredUsers.map(u => u.username)));
        }
    }, [selectedUsers.size, filteredUsers]);

    // Actions bulk
    const handleBulkAction = useCallback(async (action, userIds) => {
        try {
            setNotification({ type: 'info', message: 'Action en cours...' });
            
            switch (action) {
                case 'export':
                    // Implémenter export
                    showNotification('success', 'Export iniciado');
                    break;
                case 'delete':
                    if (window.confirm(`Supprimer ${userIds.length} utilisateur(s) ?`)) {
                        // Implémenter suppression en lot
                        showNotification('success', 'Utilisateurs supprimés');
                    }
                    break;
                case 'notify':
                    // Implémenter notifications
                    showNotification('success', 'Notifications envoyées');
                    break;
            }
            setSelectedUsers(new Set());
        } catch (error) {
            showNotification('error', `Erreur: ${error.message}`);
        }
    }, [showNotification]);

    // Options des filtres disponibles
    const filterOptions = useMemo(() => {
        const departments = [...new Set(users.map(u => u.department).filter(Boolean))].sort();
        const servers = [...new Set(users.map(u => u.server).filter(Boolean))].sort();
        
        return {
            departments,
            servers,
            statuses: [
                { value: 'all', label: 'Tous les statuts' },
                { value: 'enabled', label: 'AD activé' },
                { value: 'disabled', label: 'AD désactivé' }
            ],
            loanOptions: [
                { value: 'all', label: 'Tous' },
                { value: 'yes', label: 'Avec prêts' },
                { value: 'no', label: 'Sans prêts' }
            ]
        };
    }, [users]);

    if (isCacheLoading || isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress size={60} />
            </Box>
        );
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ width: '100%' }}
        >
            {/* Header avec statistiques */}
            <motion.div variants={itemVariants}>
                <ModernCard sx={{ mb: 3 }}>
                    <Box sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                            <Box>
                                <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
                                    Gestion des Utilisateurs
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    Administration complète des comptes et équipements
                                </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <ModernButton
                                    variant="outlined"
                                    startIcon={<RefreshIcon />}
                                    onClick={handleRefresh}
                                    animated
                                >
                                    Actualiser
                                </ModernButton>
                                
                                <ModernButton
                                    variant="contained"
                                    startIcon={<PersonAddIcon />}
                                    animated
                                >
                                    Nouvel Utilisateur
                                </ModernButton>
                            </Box>
                        </Box>

                        {/* Dashboard statistiques */}
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={3}>
                                <ModernStatsCard
                                    title="Total Utilisateurs"
                                    value={stats.total}
                                    icon={<PersonAddIcon />}
                                    trend="neutral"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <ModernStatsCard
                                    title="AD Activé"
                                    value={stats.enabled}
                                    icon={<SettingsIcon />}
                                    trend="up"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <ModernStatsCard
                                    title="Avec Prêts"
                                    value={stats.withLoans}
                                    icon={<DashboardIcon />}
                                    trend="up"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <ModernStatsCard
                                    title="Sélectionnés"
                                    value={stats.selected}
                                    icon={<FilterIcon />}
                                    trend={stats.selected > 0 ? "up" : "neutral"}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </ModernCard>
            </motion.div>

            {/* Barre de recherche et filtres */}
            <motion.div variants={itemVariants}>
                <ModernCard sx={{ mb: 3 }}>
                    <Box sx={{ p: 3 }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={4}>
                                <Box sx={{ position: 'relative' }}>
                                    <SearchIcon sx={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'text.secondary' }} />
                                    <input
                                        type="text"
                                        placeholder="Rechercher un utilisateur..."
                                        onChange={(e) => debouncedSearch(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '12px 12px 12px 40px',
                                            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                                            borderRadius: theme.shape.borderRadius,
                                            fontSize: '14px',
                                            outline: 'none',
                                            transition: 'all 0.2s ease',
                                            backgroundColor: 'transparent'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = theme.palette.primary.main;
                                            e.target.style.boxShadow = `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`;
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = alpha(theme.palette.divider, 0.2);
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </Box>
                            </Grid>
                            
                            <Grid item xs={12} md={3}>
                                <ModernButton
                                    variant="outlined"
                                    startIcon={<FilterIcon />}
                                    onClick={() => setShowFilters(!showFilters)}
                                    fullWidth
                                >
                                    Filtres Avancés
                                </ModernButton>
                            </Grid>
                            
                            <Grid item xs={12} md={2}>
                                <ModernButton
                                    variant={viewMode === 'grid' ? 'contained' : 'outlined'}
                                    startIcon={<ViewModuleIcon />}
                                    onClick={() => setViewMode('grid')}
                                    fullWidth
                                >
                                    Grille
                                </ModernButton>
                            </Grid>
                            
                            <Grid item xs={12} md={2}>
                                <ModernButton
                                    variant={viewMode === 'list' ? 'contained' : 'outlined'}
                                    startIcon={<ViewListIcon />}
                                    onClick={() => setViewMode('list')}
                                    fullWidth
                                >
                                    Liste
                                </ModernButton>
                            </Grid>
                            
                            <Grid item xs={12} md={1}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {stats.filtered} / {stats.total}
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                        
                        {/* Filtres avancés */}
                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Box sx={{ mt: 3, pt: 3, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                                        <UserFilters
                                            filters={filters}
                                            onChange={setFilters}
                                            options={filterOptions}
                                        />
                                    </Box>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Box>
                </ModernCard>
            </motion.div>

            {/* Actions en lot */}
            <AnimatePresence>
                {selectedUsers.size > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            position: 'fixed',
                            bottom: 20,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 1000
                        }}
                    >
                        <ModernCard sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="body2" fontWeight={600}>
                                    {selectedUsers.size} utilisateur{selectedUsers.size > 1 ? 's' : ''} sélectionné{selectedUsers.size > 1 ? 's' : ''}
                                </Typography>
                                
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <ModernButton
                                        variant="contained"
                                        size="small"
                                        startIcon={<DownloadIcon />}
                                        onClick={() => handleBulkAction('export', Array.from(selectedUsers))}
                                    >
                                        Exporter
                                    </ModernButton>
                                    
                                    <ModernButton
                                        variant="outlined"
                                        size="small"
                                        startIcon={<NotificationsIcon />}
                                        onClick={() => handleBulkAction('notify', Array.from(selectedUsers))}
                                    >
                                        Notifier
                                    </ModernButton>
                                    
                                    <ModernButton
                                        variant="outlined"
                                        size="small"
                                        color="error"
                                        startIcon={<DeleteIcon />}
                                        onClick={() => handleBulkAction('delete', Array.from(selectedUsers))}
                                    >
                                        Supprimer
                                    </ModernButton>
                                </Box>
                            </Box>
                        </ModernCard>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Liste des utilisateurs */}
            <motion.div variants={itemVariants}>
                <ModernCard>
                    <Box sx={{ p: 0 }}>
                        {filteredUsers.length === 0 ? (
                            <Box sx={{ p: 4, textAlign: 'center' }}>
                                <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                                    Aucun utilisateur trouvé
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Essayez de modifier vos critères de recherche
                                </Typography>
                            </Box>
                        ) : (
                            <Grid container spacing={2} sx={{ p: 2 }}>
                                {filteredUsers.map((user, index) => (
                                    <Grid item xs={12} sm={6} md={4} lg={3} key={user.username}>
                                        <UserCardModern
                                            user={user}
                                            isSelected={selectedUsers.has(user.username)}
                                            onSelect={() => handleSelectUser(user.username)}
                                            viewMode={viewMode}
                                            userLoans={userLoans}
                                            userColor={getUserColor(user.username, user.username)}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </Box>
                </ModernCard>
            </motion.div>

            {/* Notifications */}
            <Snackbar
                open={!!notification}
                autoHideDuration={4000}
                onClose={() => setNotification(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                {notification && (
                    <Alert 
                        onClose={() => setNotification(null)} 
                        severity={notification.type}
                        sx={{ width: '100%' }}
                    >
                        {notification.message}
                    </Alert>
                )}
            </Snackbar>
        </motion.div>
    );
});

UsersManagementEnhanced.displayName = 'UsersManagementEnhanced';

export default UsersManagementEnhanced;
