// src/components/users/UserDashboard.js - Dashboard statistiques temps réel

import React, { useState, useEffect, useMemo, memo } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    LinearProgress,
    Chip,
    IconButton,
    Tooltip,
    useTheme,
    alpha,
    Paper
} from '@mui/material';
import { motion } from 'framer-motion';
import {
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    TrendingFlat as TrendingFlatIcon,
    Person as PersonIcon,
    Security as SecurityIcon,
    PhoneIphone as PhoneIcon,
    Computer as ComputerIcon,
    VpnKey as VpnKeyIcon,
    Language as LanguageIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Refresh as RefreshIcon,
    FilterList as FilterIcon,
    Schedule as ScheduleIcon
} from '@mui/icons-material';

// Composants UI modernes
import { ModernCard, ModernStatsCard } from '../ui/ModernUIComponents';

// Hooks et services
import { useCache } from '../../contexts/CacheContext';
import apiService from '../../services/apiService';

// Variantes d'animation
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

const UserDashboard = memo(({
    users = [],
    userLoans = { phoneLoans: [], computerLoans: [] },
    filters = {},
    refreshInterval = 30000,
    onFilterChange
}) => {
    const theme = useTheme();
    const { cache, invalidate } = useCache();
    
    // États
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [dashboardData, setDashboardData] = useState({
        users: [],
        trends: {},
        alerts: []
    });

    // Données des groupes AD
    const vpnMembers = useMemo(() => {
        if (!cache || typeof cache !== 'object') return new Set();
        return new Set((cache['ad_groups:VPN'] || []).map(m => m?.SamAccountName).filter(Boolean));
    }, [cache]);

    const internetMembers = useMemo(() => {
        if (!cache || typeof cache !== 'object') return new Set();
        return new Set((cache['ad_groups:Sortants_responsables'] || []).map(m => m?.SamAccountName).filter(Boolean));
    }, [cache]);

    // Calcul des statistiques en temps réel
    const statistics = useMemo(() => {
        const totalUsers = users.length;
        const activeAD = users.filter(u => u.adEnabled === 1).length;
        const inactiveAD = users.filter(u => u.adEnabled === 0).length;
        const unknownAD = totalUsers - activeAD - inactiveAD;
        
        const usersWithVPN = users.filter(u => vpnMembers.has(u.username)).length;
        const usersWithInternet = users.filter(u => internetMembers.has(u.username)).length;
        
        const usersWithPhoneLoans = new Set(userLoans.phoneLoans?.map(l => l.userId) || []).size;
        const usersWithComputerLoans = new Set(userLoans.computerLoans?.map(l => l.userId) || []).size;
        const totalUsersWithLoans = new Set([
            ...userLoans.phoneLoans?.map(l => l.userId) || [],
            ...userLoans.computerLoans?.map(l => l.userId) || []
        ]).size;
        
        // Calcul des pourcentages
        const activeADPercent = totalUsers > 0 ? (activeAD / totalUsers * 100) : 0;
        const vpnPercent = totalUsers > 0 ? (usersWithVPN / totalUsers * 100) : 0;
        const internetPercent = totalUsers > 0 ? (usersWithInternet / totalUsers * 100) : 0;
        const loansPercent = totalUsers > 0 ? (totalUsersWithLoans / totalUsers * 100) : 0;
        
        // Répartition par département
        const departmentStats = {};
        users.forEach(user => {
            const dept = user.department || 'Non défini';
            if (!departmentStats[dept]) {
                departmentStats[dept] = { total: 0, active: 0, withLoans: 0 };
            }
            departmentStats[dept].total++;
            if (user.adEnabled === 1) departmentStats[dept].active++;
            if (totalUsersWithLoans > 0) {
                // Logique pour déterminer si l'utilisateur a des prêts
                const hasLoans = userLoans.phoneLoans?.some(l => l.userId === user.username) ||
                               userLoans.computerLoans?.some(l => l.userId === user.username);
                if (hasLoans) departmentStats[dept].withLoans++;
            }
        });

        // Statistiques des serveurs
        const serverStats = {};
        users.forEach(user => {
            const server = user.server || 'Non assigné';
            if (!serverStats[server]) {
                serverStats[server] = { total: 0, active: 0 };
            }
            serverStats[server].total++;
            if (user.adEnabled === 1) serverStats[server].active++;
        });

        // Alertes et problèmes
        const alerts = [];
        
        if (unknownAD > 0) {
            alerts.push({
                type: 'warning',
                title: 'Comptes AD Inconnus',
                message: `${unknownAD} utilisateur(s) avec statut AD non défini`,
                count: unknownAD,
                icon: <WarningIcon />
            });
        }
        
        if (inactiveAD > totalUsers * 0.3) {
            alerts.push({
                type: 'error',
                title: 'Comptes AD Inactifs',
                message: `${inactiveAD} utilisateur(s) avec compte AD désactivé`,
                count: inactiveAD,
                icon: <ErrorIcon />
            });
        }

        return {
            total: totalUsers,
            activeAD,
            inactiveAD,
            unknownAD,
            usersWithVPN,
            usersWithInternet,
            usersWithPhoneLoans,
            usersWithComputerLoans,
            totalUsersWithLoans,
            activeADPercent,
            vpnPercent,
            internetPercent,
            loansPercent,
            departmentStats,
            serverStats,
            alerts
        };
    }, [users, vpnMembers, internetMembers, userLoans]);

    // Tendances (simulation pour la démo)
    const trends = useMemo(() => {
        return {
            users: { value: 5.2, type: 'up' },
            activeAD: { value: 2.1, type: 'up' },
            loans: { value: -1.5, type: 'down' },
            security: { value: 0.8, type: 'neutral' }
        };
    }, []);

    // Configuration des couleurs pour les graphiques
    const getStatusColor = (value, threshold = 80) => {
        if (value >= threshold) return 'success';
        if (value >= threshold * 0.6) return 'warning';
        return 'error';
    };

    // Mise à jour périodique
    useEffect(() => {
        const interval = setInterval(() => {
            setLastUpdate(new Date());
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [refreshInterval]);

    // Rafraîchissement manuel
    const handleRefresh = async () => {
        setIsLoading(true);
        try {
            await Promise.all([
                invalidate('excel_users'),
                invalidate('ad_groups:VPN'),
                invalidate('ad_groups:Sortants_responsables')
            ]);
            setLastUpdate(new Date());
        } catch (error) {
            console.error('Erreur lors du rafraîchissement:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Rendu d'une carte de statistiques personnalisée
    const renderCustomStatsCard = (title, value, icon, color = 'primary', progress = null, subtitle = '') => {
        return (
            <motion.div variants={itemVariants}>
                <ModernCard interactive={false}>
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                                    {title}
                                </Typography>
                                
                                <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
                                    {value}
                                </Typography>
                                
                                {subtitle && (
                                    <Typography variant="body2" color="text.secondary">
                                        {subtitle}
                                    </Typography>
                                )}
                                
                                {progress !== null && (
                                    <Box sx={{ mt: 2 }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={progress}
                                            color={getStatusColor(progress)}
                                            sx={{
                                                height: 8,
                                                borderRadius: 4,
                                                backgroundColor: alpha(theme.palette.divider, 0.2),
                                                '& .MuiLinearProgress-bar': {
                                                    borderRadius: 4
                                                }
                                            }}
                                        />
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                            {Math.round(progress)}% du total
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                            
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 64,
                                    height: 64,
                                    borderRadius: '50%',
                                    backgroundColor: alpha(theme.palette[color].main, 0.1),
                                    color: `${color}.main`,
                                    ml: 2
                                }}
                            >
                                {icon}
                            </Box>
                        </Box>
                    </CardContent>
                </ModernCard>
            </motion.div>
        );
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ width: '100%' }}
        >
            {/* Header avec contrôles */}
            <motion.div variants={itemVariants}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box>
                        <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
                            Dashboard Utilisateurs
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Statistiques en temps réel • Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
                        </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip
                            icon={<ScheduleIcon />}
                            label={`${Math.round(refreshInterval / 1000)}s`}
                            size="small"
                            variant="outlined"
                        />
                        <Tooltip title="Actualiser">
                            <IconButton
                                onClick={handleRefresh}
                                disabled={isLoading}
                                sx={{
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    '&:hover': {
                                        bgcolor: alpha(theme.palette.primary.main, 0.2)
                                    }
                                }}
                            >
                                <RefreshIcon sx={{ 
                                    animation: isLoading ? 'spin 1s linear infinite' : 'none',
                                    '@keyframes spin': {
                                        '0%': { transform: 'rotate(0deg)' },
                                        '100%': { transform: 'rotate(360deg)' }
                                    }
                                }} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            </motion.div>

            {/* Alertes */}
            {statistics.alerts.length > 0 && (
                <motion.div variants={itemVariants}>
                    <Box sx={{ mb: 3 }}>
                        {statistics.alerts.map((alert, index) => (
                            <Box
                                key={index}
                                sx={{
                                    p: 2,
                                    mb: 1,
                                    borderRadius: 2,
                                    border: `1px solid ${alpha(
                                        alert.type === 'error' ? theme.palette.error.main :
                                        alert.type === 'warning' ? theme.palette.warning.main :
                                        theme.palette.info.main
                                    , 0.3)}`,
                                    bgcolor: alpha(
                                        alert.type === 'error' ? theme.palette.error.main :
                                        alert.type === 'warning' ? theme.palette.warning.main :
                                        theme.palette.info.main
                                    , 0.1),
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2
                                }}
                            >
                                <Box sx={{ color: `${alert.type}.main` }}>
                                    {alert.icon}
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle2" fontWeight={600}>
                                        {alert.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {alert.message}
                                    </Typography>
                                </Box>
                                <Chip
                                    label={alert.count}
                                    color={alert.type}
                                    size="small"
                                    variant="outlined"
                                />
                            </Box>
                        ))}
                    </Box>
                </motion.div>
            )}

            {/* Statistiques principales */}
            <motion.div variants={itemVariants}>
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        {renderCustomStatsCard(
                            'Total Utilisateurs',
                            statistics.total,
                            <PersonIcon />,
                            'primary',
                            null,
                            `${statistics.total > 0 ? '100%' : '0%'} du système`
                        )}
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        {renderCustomStatsCard(
                            'Comptes AD Actifs',
                            statistics.activeAD,
                            <CheckCircleIcon />,
                            'success',
                            statistics.activeADPercent,
                            `${Math.round(statistics.activeADPercent)}% activés`
                        )}
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        {renderCustomStatsCard(
                            'Utilisateurs VPN',
                            statistics.usersWithVPN,
                            <VpnKeyIcon />,
                            'info',
                            statistics.vpnPercent,
                            `${Math.round(statistics.vpnPercent)}% du total`
                        )}
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        {renderCustomStatsCard(
                            'Avec Équipements',
                            statistics.totalUsersWithLoans,
                            <PhoneIcon />,
                            'secondary',
                            statistics.loansPercent,
                            `${Math.round(statistics.loansPercent)}% du total`
                        )}
                    </Grid>
                </Grid>
            </motion.div>

            {/* Statistiques détaillées */}
            <motion.div variants={itemVariants}>
                <Grid container spacing={3}>
                    {/* Répartition par département */}
                    <Grid item xs={12} lg={6}>
                        <ModernCard>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                                    Répartition par Département
                                </Typography>
                                
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {Object.entries(statistics.departmentStats)
                                        .sort(([,a], [,b]) => b.total - a.total)
                                        .slice(0, 6)
                                        .map(([dept, stats]) => {
                                            const percentage = (stats.total / statistics.total) * 100;
                                            return (
                                                <Box key={dept}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {dept}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                                            <Chip
                                                                label={stats.total}
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                            <Chip
                                                                label={`${Math.round(percentage)}%`}
                                                                size="small"
                                                                color="primary"
                                                            />
                                                        </Box>
                                                    </Box>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={percentage}
                                                        sx={{
                                                            height: 6,
                                                            borderRadius: 3,
                                                            backgroundColor: alpha(theme.palette.divider, 0.2)
                                                        }}
                                                    />
                                                </Box>
                                            );
                                        })}
                                </Box>
                            </CardContent>
                        </ModernCard>
                    </Grid>

                    {/* Statut des comptes */}
                    <Grid item xs={12} lg={6}>
                        <ModernCard>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                                    Statut des Comptes AD
                                </Typography>
                                
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    <Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CheckCircleIcon color="success" fontSize="small" />
                                                <Typography variant="body2" fontWeight={500}>
                                                    Comptes Actifs
                                                </Typography>
                                            </Box>
                                            <Typography variant="h6" color="success.main" fontWeight={700}>
                                                {statistics.activeAD}
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={statistics.activeADPercent}
                                            color="success"
                                            sx={{ height: 8, borderRadius: 4 }}
                                        />
                                    </Box>
                                    
                                    <Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <ErrorIcon color="error" fontSize="small" />
                                                <Typography variant="body2" fontWeight={500}>
                                                    Comptes Inactifs
                                                </Typography>
                                            </Box>
                                            <Typography variant="h6" color="error.main" fontWeight={700}>
                                                {statistics.inactiveAD}
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={(statistics.inactiveAD / statistics.total) * 100}
                                            color="error"
                                            sx={{ height: 8, borderRadius: 4 }}
                                        />
                                    </Box>
                                    
                                    {statistics.unknownAD > 0 && (
                                        <Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <WarningIcon color="warning" fontSize="small" />
                                                    <Typography variant="body2" fontWeight={500}>
                                                        Statut Inconnu
                                                    </Typography>
                                                </Box>
                                                <Typography variant="h6" color="warning.main" fontWeight={700}>
                                                    {statistics.unknownAD}
                                                </Typography>
                                            </Box>
                                            <LinearProgress
                                                variant="determinate"
                                                value={(statistics.unknownAD / statistics.total) * 100}
                                                color="warning"
                                                sx={{ height: 8, borderRadius: 4 }}
                                            />
                                        </Box>
                                    )}
                                </Box>
                            </CardContent>
                        </ModernCard>
                    </Grid>

                    {/* Répartition des équipements */}
                    <Grid item xs={12} lg={6}>
                        <ModernCard>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                                    Gestion des Équipements
                                </Typography>
                                
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Box
                                            sx={{
                                                p: 2,
                                                textAlign: 'center',
                                                borderRadius: 2,
                                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                                            }}
                                        >
                                            <PhoneIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                                            <Typography variant="h4" fontWeight={700} color="primary.main">
                                                {statistics.usersWithPhoneLoans}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Téléphones
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    
                                    <Grid item xs={6}>
                                        <Box
                                            sx={{
                                                p: 2,
                                                textAlign: 'center',
                                                borderRadius: 2,
                                                bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                                border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`
                                            }}
                                        >
                                            <ComputerIcon sx={{ fontSize: 32, color: 'secondary.main', mb: 1 }} />
                                            <Typography variant="h4" fontWeight={700} color="secondary.main">
                                                {statistics.usersWithComputerLoans}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Ordinateurs
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </ModernCard>
                    </Grid>

                    {/* Tendances */}
                    <Grid item xs={12} lg={6}>
                        <ModernCard>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                                    Tendances
                                </Typography>
                                
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {Object.entries(trends).map(([key, trend]) => {
                                        const icons = {
                                            users: <PersonIcon />,
                                            activeAD: <SecurityIcon />,
                                            loans: <PhoneIcon />,
                                            security: <CheckCircleIcon />
                                        };
                                        
                                        const labels = {
                                            users: 'Nouveaux utilisateurs',
                                            activeAD: 'Comptes AD actifs',
                                            loans: 'Gestion prêts',
                                            security: 'Sécurité'
                                        };
                                        
                                        const TrendIcon = trend.type === 'up' ? TrendingUpIcon :
                                                        trend.type === 'down' ? TrendingDownIcon :
                                                        TrendingFlatIcon;
                                        
                                        return (
                                            <Box key={key} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Box sx={{ color: 'primary.main' }}>
                                                        {icons[key]}
                                                    </Box>
                                                    <Typography variant="body2" fontWeight={500}>
                                                        {labels[key]}
                                                    </Typography>
                                                </Box>
                                                
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <TrendIcon 
                                                        sx={{ 
                                                            fontSize: 16,
                                                            color: trend.type === 'up' ? 'success.main' :
                                                                   trend.type === 'down' ? 'error.main' :
                                                                   'text.secondary'
                                                        }} 
                                                    />
                                                    <Typography 
                                                        variant="body2" 
                                                        fontWeight={600}
                                                        sx={{
                                                            color: trend.type === 'up' ? 'success.main' :
                                                                   trend.type === 'down' ? 'error.main' :
                                                                   'text.secondary'
                                                        }}
                                                    >
                                                        {trend.value > 0 ? '+' : ''}{trend.value}%
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </CardContent>
                        </ModernCard>
                    </Grid>
                </Grid>
            </motion.div>
        </motion.div>
    );
});

UserDashboard.displayName = 'UserDashboard';

export default UserDashboard;
