// UsersBatchActionsDemo.js - Démonstration complète du composant UsersBatchActions
// Intégration avec données de test et toutes les fonctionnalités

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    Divider,
    Alert,
    Chip,
    Avatar,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    IconButton,
    Tooltip,
    Fab,
    TextField,
    InputAdornment
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PlayArrow as PlayIcon,
    Refresh as RefreshIcon,
    Search as SearchIcon,
    Person as PersonIcon,
    Group as GroupIcon,
    Business as BusinessIcon,
    Computer as ComputerIcon,
    Security as SecurityIcon,
    Email as EmailIcon,
    CheckCircle as CheckIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    Info as InfoIcon
} from '@mui/icons-material';

import UsersBatchActions, { BULK_ACTIONS } from './UsersBatchActions';
import useUsersBatchActions from './useUsersBatchActions';
import { ModernCard, ModernButton } from '../ui/ModernUIComponents';
import apiService from '../../services/apiService';

// Données de test pour les utilisateurs
const generateTestUsers = (count = 50) => {
    const departments = ['IT', 'RH', 'Finance', 'Marketing', 'Vente', 'Support', 'Direction'];
    const servers = ['SRV-DC01', 'SRV-DC02', 'SRV-APP01', 'SRV-APP02'];
    const groups = ['VPN', 'Internet', 'Administrateurs', 'Développeurs', 'Utilisateurs', 'Invités'];
    
    return Array.from({ length: count }, (_, i) => ({
        username: `user${String(i + 1).padStart(3, '0')}`,
        displayName: `Utilisateur ${i + 1}`,
        email: `user${i + 1}@docucortex.com`,
        department: departments[Math.floor(Math.random() * departments.length)],
        server: servers[Math.floor(Math.random() * servers.length)],
        adEnabled: Math.random() > 0.2, // 80% d'utilisateurs actifs
        createdDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
        lastLogin: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : null,
        phoneLoans: Math.floor(Math.random() * 3),
        computerLoans: Math.floor(Math.random() * 2),
        groups: groups.slice(0, Math.floor(Math.random() * 4) + 1)
    }));
};

// Composant pour l'affichage des utilisateurs
const UserItem = ({ user, isSelected, onClick, onContextMenu }) => {
    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const getStatusColor = (enabled) => enabled ? 'success' : 'default';
    const getStatusIcon = (enabled) => enabled ? <CheckIcon /> : <ErrorIcon />;

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ cursor: 'pointer' }}
            onClick={onClick}
            onContextMenu={onContextMenu}
        >
            <Card 
                sx={{ 
                    mb: 1,
                    border: isSelected ? 2 : 1,
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    bgcolor: isSelected ? 'action.selected' : 'background.paper',
                    transition: 'all 0.2s ease'
                }}
            >
                <CardContent sx={{ py: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                            {getInitials(user.displayName)}
                        </Avatar>
                        
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="subtitle2" noWrap>
                                {user.displayName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>
                                {user.username} • {user.department}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                            <Chip 
                                size="small"
                                label={user.adEnabled ? 'Actif' : 'Inactif'}
                                color={getStatusColor(user.adEnabled)}
                                icon={getStatusIcon(user.adEnabled)}
                                variant="outlined"
                            />
                            <Typography variant="caption" color="text.secondary">
                                {user.server}
                            </Typography>
                        </Box>
                    </Box>

                    {user.groups && user.groups.length > 0 && (
                        <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {user.groups.slice(0, 3).map(group => (
                                <Chip key={group} size="small" label={group} variant="outlined" />
                            ))}
                            {user.groups.length > 3 && (
                                <Chip size="small" label={`+${user.groups.length - 3}`} variant="outlined" />
                            )}
                        </Box>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
};

// Composant principal de démonstration
const UsersBatchActionsDemo = () => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);

    // Hook pour les actions en lot
    const batchActions = useUsersBatchActions();

    // Chargement des données de test
    useEffect(() => {
        const loadTestData = async () => {
            setIsLoading(true);
            try {
                // Simulation de chargement depuis l'API
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const testUsers = generateTestUsers(100);
                setUsers(testUsers);
                
                addNotification('success', 'Données de test chargées');
            } catch (error) {
                addNotification('error', `Erreur lors du chargement: ${error.message}`);
            } finally {
                setIsLoading(false);
            }
        };

        loadTestData();
    }, []);

    // Filtrage des utilisateurs
    const filteredUsers = useMemo(() => {
        let filtered = users;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(user => 
                user.displayName.toLowerCase().includes(term) ||
                user.username.toLowerCase().includes(term) ||
                user.email.toLowerCase().includes(term) ||
                user.department.toLowerCase().includes(term)
            );
        }

        if (filterDepartment !== 'all') {
            filtered = filtered.filter(user => user.department === filterDepartment);
        }

        if (filterStatus !== 'all') {
            const isActive = filterStatus === 'active';
            filtered = filtered.filter(user => user.adEnabled === isActive);
        }

        return filtered;
    }, [users, searchTerm, filterDepartment, filterStatus]);

    // Statistiques
    const stats = useMemo(() => {
        const total = users.length;
        const active = users.filter(u => u.adEnabled).length;
        const withLoans = users.filter(u => u.phoneLoans > 0 || u.computerLoans > 0).length;
        const departments = new Set(users.map(u => u.department)).size;
        
        return { total, active, withLoans, departments };
    }, [users]);

    // Gestion des notifications
    const addNotification = useCallback((type, message) => {
        const notification = {
            id: Date.now(),
            type,
            message,
            timestamp: new Date().toISOString()
        };
        
        setNotifications(prev => [notification, ...prev.slice(0, 4)]);
        
        // Suppression automatique après 5 secondes
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, 5000);
    }, []);

    // Actions de démonstration
    const handleRefreshData = useCallback(async () => {
        addNotification('info', 'Actualisation des données...');
        
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            const newUsers = generateTestUsers(100);
            setUsers(newUsers);
            addNotification('success', 'Données actualisées');
        } catch (error) {
            addNotification('error', `Erreur: ${error.message}`);
        }
    }, [addNotification]);

    const handleUsersUpdate = useCallback(() => {
        addNotification('info', 'Utilisateurs mis à jour');
        // Ici on pourrait recharger les données depuis l'API
    }, [addNotification]);

    // Gestion des raccourcis clavier
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.ctrlKey || event.metaKey) {
                switch (event.key) {
                    case 'a':
                        event.preventDefault();
                        // Sélectionner tous les utilisateurs visibles
                        break;
                    case 'r':
                        event.preventDefault();
                        handleRefreshData();
                        break;
                    case 'f':
                        event.preventDefault();
                        // Focus sur la recherche
                        break;
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleRefreshData]);

    // Options de filtrage
    const departments = useMemo(() => {
        return Array.from(new Set(users.map(u => u.department))).sort();
    }, [users]);

    return (
        <Box sx={{ p: 3 }}>
            {/* Header avec statistiques */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <ModernCard sx={{ mb: 3 }}>
                    <Box sx={{ p: 3 }}>
                        <Grid container spacing={3} alignItems="center">
                            <Grid item xs={12} md={6}>
                                <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
                                    Démonstration - Actions en Lot Utilisateurs
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    Testez toutes les fonctionnalités des actions en lot sur les utilisateurs
                                </Typography>
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Card variant="outlined">
                                            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                                <PersonIcon color="primary" sx={{ mb: 1 }} />
                                                <Typography variant="h6">{stats.total}</Typography>
                                                <Typography variant="caption">Total Utilisateurs</Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Card variant="outlined">
                                            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                                <CheckIcon color="success" sx={{ mb: 1 }} />
                                                <Typography variant="h6">{stats.active}</Typography>
                                                <Typography variant="caption">Utilisateurs Actifs</Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Card variant="outlined">
                                            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                                <ComputerIcon color="info" sx={{ mb: 1 }} />
                                                <Typography variant="h6">{stats.withLoans}</Typography>
                                                <Typography variant="caption">Avec Prêts</Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Card variant="outlined">
                                            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                                <BusinessIcon color="warning" sx={{ mb: 1 }} />
                                                <Typography variant="h6">{stats.departments}</Typography>
                                                <Typography variant="caption">Départements</Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <ModernButton
                                variant="contained"
                                startIcon={<RefreshIcon />}
                                onClick={handleRefreshData}
                                loading={isLoading}
                            >
                                Actualiser les Données
                            </ModernButton>
                            
                            <TextField
                                placeholder="Rechercher un utilisateur..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                                size="small"
                                sx={{ minWidth: 250 }}
                            />

                            <Button
                                variant="outlined"
                                onClick={() => setFilterDepartment('all')}
                                disabled={filterDepartment === 'all'}
                            >
                                Tous les Départements
                            </Button>

                            <Button
                                variant="outlined"
                                onClick={() => setFilterStatus('all')}
                                disabled={filterStatus === 'all'}
                            >
                                Tous les Statuts
                            </Button>
                        </Box>

                        {/* Filtres rapides */}
                        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {departments.slice(0, 5).map(dept => (
                                <Chip
                                    key={dept}
                                    label={dept}
                                    clickable
                                    color={filterDepartment === dept ? 'primary' : 'default'}
                                    onClick={() => setFilterDepartment(dept)}
                                    variant="outlined"
                                />
                            ))}
                        </Box>
                    </Box>
                </ModernCard>
            </motion.div>

            {/* Liste des utilisateurs */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <ModernCard>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">
                                Utilisateurs ({filteredUsers.length} / {users.length})
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Tips: Utilisez Ctrl+click pour sélection individuelle, Shift+click pour sélection en range
                            </Typography>
                        </Box>

                        <Divider sx={{ mb: 2 }} />

                        {isLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <Typography>Chargement des données...</Typography>
                            </Box>
                        ) : filteredUsers.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography color="text.secondary">
                                    Aucun utilisateur trouvé avec les filtres actuels
                                </Typography>
                            </Box>
                        ) : (
                            <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
                                <AnimatePresence>
                                    {filteredUsers.map((user) => (
                                        <motion.div
                                            key={user.username}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <UserItem
                                                user={user}
                                                isSelected={false} // Géré par le composant parent
                                                onClick={() => {}}
                                                onContextMenu={(e) => {
                                                    e.preventDefault();
                                                    addNotification('info', `Menu contextuel pour ${user.displayName}`);
                                                }}
                                            />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </Box>
                        )}
                    </CardContent>
                </ModernCard>
            </motion.div>

            {/* Composant d'actions en lot */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
            >
                <UsersBatchActions
                    users={filteredUsers}
                    onUsersUpdate={handleUsersUpdate}
                    currentUser={{ id: 'demo_admin', role: 'admin' }}
                    className="users-batch-actions"
                />
            </motion.div>

            {/* Notifications */}
            <AnimatePresence>
                {notifications.map((notification) => (
                    <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        style={{
                            position: 'fixed',
                            top: 20,
                            right: 20,
                            zIndex: 9999,
                            maxWidth: 350
                        }}
                    >
                        <Alert 
                            severity={notification.type}
                            variant="filled"
                            sx={{ mb: 1 }}
                            action={
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        setNotifications(prev => prev.filter(n => n.id !== notification.id));
                                    }}
                                >
                                    ×
                                </IconButton>
                            }
                        >
                            {notification.message}
                        </Alert>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Indicateur de progression global */}
            <AnimatePresence>
                {batchActions.isProcessing && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        style={{
                            position: 'fixed',
                            bottom: 20,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 1002,
                            minWidth: 300
                        }}
                    >
                        <Paper sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <PlayIcon sx={{ animation: 'spin 2s linear infinite' }} />
                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="body2">
                                        {batchActions.currentAction}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {batchActions.progress.toFixed(1)}%
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    </motion.div>
                )}
            </AnimatePresence>
        </Box>
    );
};

export default UsersBatchActionsDemo;