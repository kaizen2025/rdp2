// src/components/dashboard/TopUsersWidget.js - Widget Top Utilisateurs Actifs
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Chip,
    IconButton,
    Tooltip,
    LinearProgress,
    Badge,
    useTheme,
    useMediaQuery,
    Divider,
    Collapse
} from '@mui/material';
import {
    Person,
    PersonAdd,
    TrendingUp,
    Schedule,
    Warning,
    CheckCircle,
    Refresh,
    ExpandMore,
    ExpandLess,
    AccountCircle,
    Work,
    School
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const TopUsersWidget = ({
    height = 400,
    maxUsers = 10,
    showProgress = true,
    showActivity = true,
    showDepartment = true,
    autoRefresh = true,
    refreshInterval = 60000
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
    // États locaux
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [expandedUser, setExpandedUser] = useState(null);
    const [sortBy, setSortBy] = useState('activity'); // 'activity', 'loans', 'efficiency'
    
    // Génération de données d'utilisateurs simulées
    const generateUsersData = useCallback(() => {
        const departments = ['IT', 'RH', 'Finance', 'Marketing', 'Commercial', 'Logistique'];
        const roles = ['Manager', 'Développeur', 'Analyste', 'Technicien', 'Assistant'];
        const names = [
            'Jean Dupont', 'Marie Martin', 'Pierre Durand', 'Sophie Leroy',
            'Paul Bernard', 'Julie Moreau', 'Thomas Laurent', 'Camille Giraud',
            'Antoine Dupont', 'Léa Blanc', 'Nicolas Mercier', 'Emma Rousseau',
            'Alexandre Fournier', 'Chloé Blanc', 'Gabriel Girard', 'Manon Bonnet',
            'Nathan Lefebvre', 'Camille Muller', 'Hugo Lambert', 'Alice Petit'
        ];
        
        return Array.from({ length: 20 }, (_, index) => {
            const name = names[index] || `Utilisateur ${index + 1}`;
            const department = departments[Math.floor(Math.random() * departments.length)];
            const role = roles[Math.floor(Math.random() * roles.length)];
            
            // Génération de statistiques réalistes
            const totalLoans = Math.floor(Math.random() * 50) + 5;
            const activeLoans = Math.floor(totalLoans * 0.3) + Math.floor(Math.random() * 5);
            const overdueLoans = Math.floor(Math.random() * 3);
            const activityScore = Math.floor(Math.random() * 100);
            const efficiency = Math.floor((totalLoans - overdueLoans) / totalLoans * 100);
            const lastActivity = Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000; // 7 derniers jours
            
            // Statut
            let status = 'active';
            if (overdueLoans > 2) status = 'overdue';
            else if (activityScore > 80) status = 'excellent';
            else if (activityScore < 30) status = 'inactive';
            
            return {
                id: index + 1,
                name,
                department,
                role,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${theme.palette.primary.main}&color=fff`,
                stats: {
                    totalLoans,
                    activeLoans,
                    overdueLoans,
                    activityScore,
                    efficiency,
                    lastActivity
                },
                status,
                trends: {
                    loansChange: (Math.random() - 0.5) * 20, // -10% à +10%
                    activityChange: (Math.random() - 0.5) * 30 // -15% à +15%
                }
            };
        });
    }, []);
    
    // Récupération et tri des utilisateurs
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        
        // Simulation de délai réseau
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const usersData = generateUsersData();
        let sortedUsers;
        
        switch (sortBy) {
            case 'activity':
                sortedUsers = usersData.sort((a, b) => b.stats.activityScore - a.stats.activityScore);
                break;
            case 'loans':
                sortedUsers = usersData.sort((a, b) => b.stats.totalLoans - a.stats.totalLoans);
                break;
            case 'efficiency':
                sortedUsers = usersData.sort((a, b) => b.stats.efficiency - a.stats.efficiency);
                break;
            default:
                sortedUsers = usersData;
        }
        
        setUsers(sortedUsers.slice(0, maxUsers));
        setLastUpdate(new Date());
        setLoading(false);
    }, [generateUsersData, sortBy, maxUsers]);
    
    // Initialisation et mise à jour automatique
    useEffect(() => {
        fetchUsers();
        
        if (autoRefresh) {
            const interval = setInterval(fetchUsers, refreshInterval);
            return () => clearInterval(interval);
        }
    }, [fetchUsers, autoRefresh, refreshInterval]);
    
    // Calcul des métriques globales
    const globalMetrics = useMemo(() => {
        if (users.length === 0) return null;
        
        const totalLoans = users.reduce((sum, user) => sum + user.stats.totalLoans, 0);
        const totalActive = users.reduce((sum, user) => sum + user.stats.activeLoans, 0);
        const totalOverdue = users.reduce((sum, user) => sum + user.stats.overdueLoans, 0);
        const averageActivity = users.reduce((sum, user) => sum + user.stats.activityScore, 0) / users.length;
        const averageEfficiency = users.reduce((sum, user) => sum + user.stats.efficiency, 0) / users.length;
        
        return {
            totalLoans,
            totalActive,
            totalOverdue,
            averageActivity: Math.round(averageActivity),
            averageEfficiency: Math.round(averageEfficiency),
            topPerformers: users.filter(user => user.stats.activityScore > 80).length
        };
    }, [users]);
    
    // Fonctions utilitaires
    const getStatusColor = (status) => {
        switch (status) {
            case 'excellent': return 'success';
            case 'overdue': return 'error';
            case 'inactive': return 'warning';
            default: return 'info';
        }
    };
    
    const getStatusIcon = (status) => {
        switch (status) {
            case 'excellent': return CheckCircle;
            case 'overdue': return Warning;
            case 'inactive': return Schedule;
            default: return Person;
        }
    };
    
    const formatLastActivity = (timestamp) => {
        const diff = Date.now() - timestamp;
        const days = Math.floor(diff / (24 * 60 * 60 * 1000));
        const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        
        if (days > 0) return `Il y a ${days}j`;
        if (hours > 0) return `Il y a ${hours}h`;
        return 'À l\'instant';
    };
    
    const handleUserClick = (userId) => {
        setExpandedUser(expandedUser === userId ? null : userId);
    };
    
    // Composant d'avatar utilisateur avec statut
    const UserAvatar = ({ user, size = 40 }) => {
        const StatusIcon = getStatusIcon(user.status);
        const statusColor = getStatusColor(user.status);
        
        return (
            <Box position="relative">
                <Avatar
                    src={user.avatar}
                    sx={{ 
                        width: size, 
                        height: size,
                        border: `2px solid ${theme.palette[statusColor].main}`
                    }}
                >
                    {user.name.charAt(0)}
                </Avatar>
                <Badge
                    badgeContent={
                        <Avatar sx={{ 
                            width: 16, 
                            height: 16, 
                            bgcolor: theme.palette[statusColor].main 
                        }}>
                            <StatusIcon sx={{ fontSize: 10 }} />
                        </Avatar>
                    }
                    sx={{
                        position: 'absolute',
                        bottom: -2,
                        right: -2,
                        '& .MuiBadge-badge': {
                            border: `2px solid ${theme.palette.background.paper}`
                        }
                    }}
                />
            </Box>
        );
    };
    
    // Composant de barre de progression d'activité
    const ActivityProgress = ({ score, color = 'primary' }) => {
        if (!showProgress) return null;
        
        return (
            <Box sx={{ mt: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                        Activité
                    </Typography>
                    <Typography variant="caption" color={`${color}.main`} sx={{ fontWeight: 600 }}>
                        {score}%
                    </Typography>
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={score}
                    sx={{
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: `${color}.main}20`,
                        '& .MuiLinearProgress-bar': {
                            backgroundColor: theme.palette[color].main,
                            borderRadius: 2
                        }
                    }}
                />
            </Box>
        );
    };
    
    return (
        <Paper elevation={2} sx={{ p: 2, height, borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
            {/* En-tête */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography 
                    variant="h6" 
                    sx={{ 
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                    }}
                >
                    <PersonAdd color="primary" />
                    Top Utilisateurs Actifs
                </Typography>
                
                <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="caption" color="text.secondary">
                        Tri: {sortBy}
                    </Typography>
                    <Tooltip title="Actualiser">
                        <IconButton size="small" onClick={fetchUsers} disabled={loading}>
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
            
            {/* Métriques globales */}
            {globalMetrics && (
                <Box mb={2} p={1} sx={{ 
                    backgroundColor: `${theme.palette.primary.main}10`,
                    borderRadius: 1
                }}>
                    <Grid container spacing={1}>
                        <Grid item xs={4}>
                            <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                                {globalMetrics.totalActive}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Prêts Actifs
                            </Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <Typography variant="body2" color="info.main" sx={{ fontWeight: 600 }}>
                                {globalMetrics.averageActivity}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Activité Moy.
                            </Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                                {globalMetrics.topPerformers}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Excellents
                            </Typography>
                        </Grid>
                    </Grid>
                </Box>
            )}
            
            {/* Liste des utilisateurs */}
            <Box flex={1} overflow="auto">
                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                        <Typography color="text.secondary">Chargement...</Typography>
                    </Box>
                ) : users.length === 0 ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                        <Typography color="text.secondary">Aucun utilisateur trouvé</Typography>
                    </Box>
                ) : (
                    <List dense disablePadding>
                        <AnimatePresence>
                            {users.map((user, index) => (
                                <motion.div
                                    key={user.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                >
                                    <ListItem
                                        sx={{
                                            py: 1.5,
                                            px: 0,
                                            cursor: 'pointer',
                                            borderRadius: 1,
                                            '&:hover': {
                                                backgroundColor: `${theme.palette.action.hover}`
                                            }
                                        }}
                                        onClick={() => handleUserClick(user.id)}
                                    >
                                        <ListItemAvatar>
                                            <UserAvatar user={user} />
                                        </ListItemAvatar>
                                        
                                        <ListItemText
                                            primary={
                                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                                    <Typography 
                                                        variant="subtitle2" 
                                                        sx={{ fontWeight: 600 }}
                                                    >
                                                        {user.name}
                                                    </Typography>
                                                    <Box display="flex" alignItems="center" gap={0.5}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            #{index + 1}
                                                        </Typography>
                                                        {expandedUser === user.id ? 
                                                            <ExpandLess fontSize="small" /> : 
                                                            <ExpandMore fontSize="small" />
                                                        }
                                                    </Box>
                                                </Box>
                                            }
                                            secondary={
                                                <Box>
                                                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                                        {showDepartment && (
                                                            <Chip
                                                                label={user.department}
                                                                size="small"
                                                                variant="outlined"
                                                                icon={<Work />}
                                                            />
                                                        )}
                                                        <Chip
                                                            label={user.role}
                                                            size="small"
                                                            variant="outlined"
                                                            icon={<AccountCircle />}
                                                        />
                                                    </Box>
                                                    
                                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                                        <Typography variant="caption" color="text.secondary">
                                                            {user.stats.activeLoans} prêts actifs • {formatLastActivity(user.stats.lastActivity)}
                                                        </Typography>
                                                        <Box display="flex" alignItems="center" gap={0.5}>
                                                            {user.trends.loansChange > 0 && (
                                                                <TrendingUp sx={{ fontSize: 12, color: 'success.main' }} />
                                                            )}
                                                            <Typography 
                                                                variant="caption" 
                                                                color={user.trends.loansChange > 0 ? 'success.main' : 'error.main'}
                                                                sx={{ fontWeight: 600 }}
                                                            >
                                                                {user.trends.loansChange > 0 ? '+' : ''}{user.trends.loansChange.toFixed(1)}%
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                    
                                                    <ActivityProgress 
                                                        score={user.stats.activityScore} 
                                                        color={getStatusColor(user.status)}
                                                    />
                                                    
                                                    {showActivity && (
                                                        <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Efficacité: {user.stats.efficiency}%
                                                            </Typography>
                                                            <Chip
                                                                label={user.status}
                                                                size="small"
                                                                color={getStatusColor(user.status)}
                                                                variant="outlined"
                                                            />
                                                        </Box>
                                                    )}
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                    
                                    <Collapse in={expandedUser === user.id}>
                                        <Box pl={8} pr={2} pb={2}>
                                            <Divider sx={{ mb: 1 }} />
                                            <Grid container spacing={1}>
                                                <Grid item xs={6}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Total prêts
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {user.stats.totalLoans}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        En retard
                                                    </Typography>
                                                    <Typography 
                                                        variant="body2" 
                                                        sx={{ 
                                                            fontWeight: 600,
                                                            color: user.stats.overdueLoans > 0 ? 'error.main' : 'success.main'
                                                        }}
                                                    >
                                                        {user.stats.overdueLoans}
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    </Collapse>
                                    
                                    {index < users.length - 1 && <Divider />}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </List>
                )}
            </Box>
            
            {/* Informations de mise à jour */}
            {lastUpdate && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                    Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
                </Typography>
            )}
        </Paper>
    );
};

export default React.memo(TopUsersWidget);