// src/pages/DashboardPage.js - VERSION AMÉLIORÉE AVEC GRILLE RESPONSIVE

import React, { memo, useMemo, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Paper, Typography, List, ListItem, ListItemText, ListItemAvatar, Tooltip, Chip, Avatar, CircularProgress } from '@mui/material';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import DnsIcon from '@mui/icons-material/Dns';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HistoryIcon from '@mui/icons-material/History';
import AssignmentIcon from '@mui/icons-material/Assignment';
import WarningIcon from '@mui/icons-material/Warning';
import LaptopChromebookIcon from '@mui/icons-material/LaptopChromebook';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import { useCache } from '../contexts/CacheContext';
import apiService from '../services/apiService';

import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import LoadingScreen from '../components/common/LoadingScreen';

const ServerStatusWidget = memo(() => {
    const { cache } = useCache();
    const serversToPing = useMemo(() => cache.config?.rds_servers || [], [cache.config]);
    const [statuses, setStatuses] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const fetchStatuses = useCallback(async () => {
        if (serversToPing.length === 0) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const results = await Promise.all(serversToPing.map(async server => {
            try {
                const res = await apiService.pingRdsServer(server);
                return { server, online: res.success, message: res.output };
            } catch (err) {
                return { server, online: false, message: err.message };
            }
        }));
        const newStatuses = results.reduce((acc, curr) => {
            acc[curr.server] = { online: curr.online, message: curr.message };
            return acc;
        }, {});
        setStatuses(newStatuses);
        setIsLoading(false);
    }, [serversToPing]);

    useEffect(() => {
        fetchStatuses();
        const interval = setInterval(fetchStatuses, 60000); // Rafraîchit le ping toutes les minutes
        return () => clearInterval(interval);
    }, [fetchStatuses]);

    return (
        <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <DnsIcon sx={{ mr: 1, color: 'primary.main' }} />
                Statut Serveurs RDS
            </Typography>
            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}><CircularProgress size={24} /></Box>
            ) : (
                <List dense disablePadding sx={{ maxHeight: 180, overflowY: 'auto' }}>
                    {serversToPing.map(server => {
                        const status = statuses[server];
                        const online = status?.online;
                        return (
                            <ListItem key={server} disablePadding sx={{ mb: 0.5 }}>
                                <Chip
                                    icon={online ? <CheckCircleIcon /> : <CancelIcon />}
                                    label={server}
                                    color={online ? 'success' : 'error'}
                                    variant="outlined"
                                    size="small"
                                    sx={{ width: '100%', justifyContent: 'flex-start' }}
                                />
                            </ListItem>
                        );
                    })}
                </List>
            )}
        </Paper>
    );
});

const ConnectedTechniciansWidget = memo(() => {
    const { cache } = useCache();
    const technicians = cache.technicians || [];

    const calculateConnectionTime = (loginTime) => {
        if (!loginTime) return 'Récent';
        const diffMins = Math.floor((new Date() - new Date(loginTime)) / 60000);
        if (diffMins < 1) return "À l'instant";
        if (diffMins < 60) return `${diffMins} min`;
        return `${Math.floor(diffMins / 60)}h ${diffMins % 60}min`;
    };

    return (
        <Paper elevation={2} sx={{ p: 2, height: '100%', minHeight: 150 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <PeopleIcon sx={{ mr: 1, color: 'secondary.main' }} />
                Techniciens ({technicians.length})
            </Typography>
            <List dense disablePadding sx={{ maxHeight: 180, overflowY: 'auto' }}>
                {technicians.length > 0 ? technicians.map(tech => (
                    <ListItem key={tech.id} disableGutters>
                        <ListItemAvatar sx={{ minWidth: 36 }}>
                            <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: 'secondary.light' }}>{tech.avatar}</Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={<Typography variant="body2" fontWeight={500}>{tech.name}</Typography>}
                            secondary={<Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><AccessTimeIcon sx={{ fontSize: 14 }} /><Typography variant="caption">{calculateConnectionTime(tech.loginTime)}</Typography></Box>}
                        />
                    </ListItem>
                )) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px' }}>
                        <Typography variant="body2" color="text.secondary">Aucun technicien connecté</Typography>
                    </Box>
                )}
            </List>
        </Paper>
    );
});

const RecentActivityWidget = memo(() => {
    const { cache } = useCache();
    const activities = cache.loan_history || [];
    const getActivityIcon = (e) => ({ created: <AssignmentIcon color="success" fontSize="small" />, returned: <CheckCircleIcon color="primary" fontSize="small" />, extended: <HistoryIcon color="info" fontSize="small" />, cancelled: <CancelIcon color="error" fontSize="small" /> }[e] || <HistoryIcon fontSize="small" />);
    const getActivityText = (act) => `${({ created: 'Prêt', returned: 'Retour', extended: 'Prolong.', cancelled: 'Annul.' }[act.eventType] || 'Action')}: ${act.computerName || 'N/A'}`;

    return (
        <Paper elevation={2} sx={{ p: 2, height: '100%', minHeight: 150 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <HistoryIcon sx={{ mr: 1, color: 'info.main' }} />
                Activité Récente
            </Typography>
            <List dense disablePadding sx={{ maxHeight: 180, overflowY: 'auto' }}>
                {activities.length > 0 ? activities.slice(0, 5).map(act => (
                    <ListItem key={act.id} disableGutters>
                        <ListItemAvatar sx={{ minWidth: 36 }}>{getActivityIcon(act.eventType)}</ListItemAvatar>
                        <ListItemText
                            primary={<Typography variant="body2">{getActivityText(act)}</Typography>}
                            secondary={<Typography variant="caption">Par {act.by || 'Syst.'}</Typography>}
                        />
                    </ListItem>
                )) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px' }}>
                        <Typography variant="body2" color="text.secondary">Aucune activité récente</Typography>
                    </Box>
                )}
            </List>
        </Paper>
    );
});

const DashboardPage = () => {
    const navigate = useNavigate();
    const { cache, isLoading } = useCache();

    const { loans = [], computers = [], loan_history = [] } = cache;

    const { activeLoans, overdueLoans, stats } = useMemo(() => {
        const active = loans.filter(l => l.status === 'active');
        const overdue = loans.filter(l => l.status === 'overdue' || l.status === 'critical');
        const statistics = {
            computers: {
                total: computers.length,
                available: computers.filter(c => c.status === 'available').length,
            },
            loans: {
                active: active.length,
                reserved: loans.filter(l => l.status === 'reserved').length,
                overdue: overdue.filter(l => l.status === 'overdue').length,
                critical: overdue.filter(l => l.status === 'critical').length,
            },
            history: {
                totalLoans: loan_history.filter(h => h.eventType === 'created').length,
            }
        };
        return { activeLoans: active, overdueLoans: overdue, stats: statistics };
    }, [loans, computers, loan_history]);

    if (isLoading) {
        return <LoadingScreen type="dashboard" />;
    }

    return (
        <Box sx={{ p: { xs: 1, sm: 2 } }}>
            <PageHeader
                title="Tableau de Bord"
                subtitle="Vue d'ensemble de l'activité RDS et gestion des prêts"
                icon={DashboardIcon}
            />

            <Grid container spacing={{ xs: 1.5, sm: 3 }}>
                {/* Ligne des StatCards */}
                <Grid item xs={12} sm={6} md={3}><StatCard title="Matériel Total" value={stats.computers.total} subtitle={`${stats.computers.available} disponibles`} icon={LaptopChromebookIcon} color="primary" loading={isLoading} onClick={() => navigate('/loans', { state: { initialTab: 1 }})} tooltip="Stock total d'ordinateurs" /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard title="Prêts Actifs" value={stats.loans.active} subtitle={`${stats.loans.reserved} réservés`} icon={AssignmentIcon} color="info" loading={isLoading} onClick={() => navigate('/loans', { state: { initialTab: 0 }})} tooltip="Prêts en cours et réservations" /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard title="En Retard" value={stats.loans.overdue + stats.loans.critical} subtitle={`${stats.loans.critical} critiques`} icon={ErrorOutlineIcon} color="error" loading={isLoading} onClick={() => navigate('/loans', { state: { initialTab: 0, preFilter: 'overdue' }})} tooltip="Prêts en retard" /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard title="Historique Total" value={stats.history.totalLoans} icon={HistoryIcon} color="secondary" loading={isLoading} onClick={() => navigate('/loans', { state: { initialTab: 3 }})} tooltip="Nombre total de prêts effectués" /></Grid>

                {/* Colonne principale (plus large) */}
                <Grid item xs={12} lg={8}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                                    <WarningIcon sx={{ mr: 1, verticalAlign: 'bottom' }} color="warning" />
                                    Prêts en Retard ({overdueLoans.length})
                                </Typography>
                                <List dense>
                                    {overdueLoans.length > 0 ? overdueLoans.slice(0, 5).map(l => (
                                        <ListItem key={l.id}>
                                            <ListItemText 
                                                primary={l.computerName} 
                                                secondary={`${l.userDisplayName} - Retour prévu le ${new Date(l.expectedReturnDate).toLocaleDateString()}`} 
                                            />
                                        </ListItem>
                                    )) : (
                                        <Box sx={{ p: 2, textAlign: 'center' }}>
                                            <Typography variant="body2" color="text.secondary">Aucun prêt en retard.</Typography>
                                        </Box>
                                    )}
                                </List>
                            </Paper>
                        </Grid>
                        <Grid item xs={12}>
                            <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                                    <AssignmentIcon sx={{ mr: 1, verticalAlign: 'bottom' }} color="info" />
                                    Prêts Actifs ({activeLoans.length})
                                </Typography>
                                <List dense>
                                    {activeLoans.length > 0 ? activeLoans.slice(0, 5).map(l => (
                                        <ListItem key={l.id}>
                                            <ListItemText 
                                                primary={l.computerName} 
                                                secondary={`${l.userDisplayName} - Retour prévu le ${new Date(l.expectedReturnDate).toLocaleDateString()}`} 
                                            />
                                        </ListItem>
                                    )) : (
                                        <Box sx={{ p: 2, textAlign: 'center' }}>
                                            <Typography variant="body2" color="text.secondary">Aucun prêt actif.</Typography>
                                        </Box>
                                    )}
                                </List>
                            </Paper>
                        </Grid>
                    </Grid>
                </Grid>

                {/* Colonne secondaire (plus étroite) */}
                <Grid item xs={12} lg={4}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}><ServerStatusWidget /></Grid>
                        <Grid item xs={12}><ConnectedTechniciansWidget /></Grid>
                        <Grid item xs={12}><RecentActivityWidget /></Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DashboardPage;