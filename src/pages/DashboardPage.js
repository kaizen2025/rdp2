// src/pages/DashboardPage.js - VERSION MODERNISÉE AVEC NOUVEAUX COMPOSANTS ET LAYOUT AMÉLIORÉ

import React, { memo, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Paper, Typography, List, ListItem, ListItemText, ListItemAvatar, CircularProgress, Tooltip, Chip, Avatar } from '@mui/material';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import DnsIcon from '@mui/icons-material/Dns';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HistoryIcon from '@mui/icons-material/History';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import LaptopChromebookIcon from '@mui/icons-material/LaptopChromebook';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import { useApp } from '../contexts/AppContext';
import apiService from '../services/apiService';
import useDataFetching from '../hooks/useDataFetching';

// Nouveaux composants
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import LoadingScreen from '../components/common/LoadingScreen';

const ServerStatusWidget = memo(({ serversToPing }) => {
    const fetchStatuses = useCallback(async () => {
        if (!serversToPing || serversToPing.length === 0) return [];
        return Promise.all(serversToPing.map(async server => {
            try {
                const res = await apiService.pingRdsServer(server);
                return { server, online: res.success, message: res.output };
            } catch (err) { return { server, online: false, message: err.message }; }
        }));
    }, [serversToPing]);

    const { data: statuses, isLoading } = useDataFetching(fetchStatuses, { refreshInterval: 60000 });

    return (
        <Paper elevation={2} sx={{ p: 1.5, height: '100%', borderRadius: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 600, mb: 1 }}>
                <DnsIcon sx={{ mr: 1, fontSize: 18, color: 'primary.main' }} />
                Statut Serveurs RDS
            </Typography>
            {isLoading && !statuses ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                    <CircularProgress size={20} />
                </Box>
            ) : (
                <List dense disablePadding sx={{ maxHeight: 180, overflowY: 'auto' }}>
                    {(statuses || []).map(({ server, online, message }) => (
                        <ListItem key={server} disablePadding sx={{ mb: 0.3 }}>
                            <Tooltip title={message || 'Vérification...'} placement="right" arrow>
                                <Chip
                                    icon={online ? <CheckCircleIcon /> : <CancelIcon />}
                                    label={server}
                                    color={online ? 'success' : 'error'}
                                    variant={online ? 'filled' : 'outlined'}
                                    size="small"
                                    sx={{ width: '100%', justifyContent: 'flex-start', fontWeight: 500, fontSize: '0.75rem', height: 28 }}
                                />
                            </Tooltip>
                        </ListItem>
                    ))}
                </List>
            )}
        </Paper>
    );
});

const ConnectedTechniciansWidget = memo(() => {
    const { data: technicians, isLoading } = useDataFetching(apiService.getConnectedTechnicians, {
        refreshInterval: 15000,
        entityName: 'technicians'
    });

    const calculateConnectionTime = (loginTime) => {
        if (!loginTime) return 'Récent';
        const diffMins = Math.floor((new Date() - new Date(loginTime)) / 60000);
        if (diffMins < 1) return "À l'instant";
        if (diffMins < 60) return `${diffMins} min`;
        return `${Math.floor(diffMins / 60)}h ${diffMins % 60}min`;
    };

    return (
        <Paper elevation={2} sx={{ p: 1.5, height: '100%', borderRadius: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 600, mb: 1 }}>
                <PeopleIcon sx={{ mr: 1, fontSize: 18, color: 'secondary.main' }} />
                Techniciens ({technicians?.length || 0})
            </Typography>
            {isLoading && !technicians ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                    <CircularProgress size={20} />
                </Box>
            ) : (
                <List dense disablePadding sx={{ maxHeight: 180, overflowY: 'auto' }}>
                    {technicians?.length > 0 ? technicians.map(tech => (
                        <ListItem key={tech.id} disableGutters sx={{ py: 0.3 }}>
                            <ListItemAvatar sx={{ minWidth: 32 }}>
                                <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: 'secondary.main' }}>{tech.avatar}</Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={<Typography variant="caption" fontWeight={500}>{tech.name}</Typography>}
                                secondary={<Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}><AccessTimeIcon sx={{ fontSize: 12 }} /><Typography variant="caption" sx={{ fontSize: '0.65rem' }}>{calculateConnectionTime(tech.loginTime)}</Typography></Box>}
                            />
                        </ListItem>
                    )) : (
                        <Typography variant="caption" color="text.secondary" sx={{ py: 2, textAlign: 'center', display: 'block' }}>Aucun technicien connecté</Typography>
                    )}
                </List>
            )}
        </Paper>
    );
});

const RecentActivityWidget = memo(() => {
    const { data: activities, isLoading } = useDataFetching(() => apiService.getLoanHistory({ limit: 5 }), { entityName: 'loan_history' });
    const getActivityIcon = (e) => ({ created: <AssignmentIcon color="success" fontSize="small" />, returned: <CheckCircleIcon color="primary" fontSize="small" />, extended: <TrendingUpIcon color="info" fontSize="small" />, cancelled: <CancelIcon color="error" fontSize="small" /> }[e] || <HistoryIcon fontSize="small" />);
    const getActivityText = (act) => `${({ created: 'Prêt', returned: 'Retour', extended: 'Prolong.', cancelled: 'Annul.' }[act.eventType] || 'Action')}: ${act.computerName || 'N/A'}`;

    return (
        <Paper elevation={2} sx={{ p: 1.5, height: '100%', borderRadius: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 600, mb: 1 }}><HistoryIcon sx={{ mr: 1, fontSize: 18, color: 'info.main' }} />Activité Récente</Typography>
            {isLoading && !activities ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}><CircularProgress size={20} /></Box> : (
                <List dense disablePadding sx={{ maxHeight: 180, overflowY: 'auto' }}>
                    {activities?.length > 0 ? activities.map(act => (
                        <ListItem key={act.id} disableGutters sx={{ py: 0.3 }}>
                            <ListItemAvatar sx={{ minWidth: 32 }}>{getActivityIcon(act.eventType)}</ListItemAvatar>
                            <ListItemText
                                primary={<Typography variant="caption">{getActivityText(act)}</Typography>}
                                secondary={<Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Par {act.by || 'Syst.'}</Typography>}
                            />
                        </ListItem>
                    )) : <Typography variant="caption" color="text.secondary" sx={{ py: 2, textAlign: 'center', display: 'block' }}>Aucune activité récente</Typography>}
                </List>
            )}
        </Paper>
    );
});

const DashboardPage = () => {
    const navigate = useNavigate();
    const { config, isInitializing } = useApp();
    const { data: stats, isLoading: isLoadingStats } = useDataFetching(apiService.getLoanStatistics, { entityName: 'loans' });
    const { data: loans, isLoading: isLoadingLoans } = useDataFetching(apiService.getLoans, { entityName: 'loans' });

    const { activeLoans, overdueLoans } = useMemo(() => {
        if (!loans) return { activeLoans: [], overdueLoans: [] };
        return {
            activeLoans: loans.filter(l => l.status === 'active'),
            overdueLoans: loans.filter(l => l.status === 'overdue' || l.status === 'critical')
        };
    }, [loans]);

    if (isInitializing || (isLoadingStats && !stats)) {
        return <LoadingScreen type="dashboard" />;
    }

    return (
        <Box sx={{ p: { xs: 1, sm: 2 }, maxHeight: '100vh', overflow: 'auto' }}>
            <PageHeader
                title="Tableau de Bord"
                subtitle="Vue d'ensemble de l'activité RDS et gestion des prêts"
                icon={DashboardIcon}
            />

            <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Matériel Total" value={stats?.computers?.total ?? 0} subtitle={`${stats?.computers?.available ?? 0} disponibles`} icon={LaptopChromebookIcon} color="primary" loading={isLoadingStats} onClick={() => navigate('/loans', { state: { initialTab: 1 }})} tooltip="Stock total d'ordinateurs et disponibilité" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Prêts Actifs" value={stats?.loans?.active ?? 0} subtitle={`${stats?.loans?.reserved ?? 0} réservés`} icon={AssignmentIcon} color="info" loading={isLoadingStats} onClick={() => navigate('/loans', { state: { initialTab: 0 }})} tooltip="Prêts en cours et réservations" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="En Retard" value={(stats?.loans?.overdue ?? 0) + (stats?.loans?.critical ?? 0)} subtitle={`${stats?.loans?.critical ?? 0} critiques`} icon={ErrorOutlineIcon} color="error" loading={isLoadingStats} onClick={() => navigate('/loans', { state: { initialTab: 0, preFilter: 'overdue' }})} tooltip="Prêts en retard nécessitant une action" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Historique Total" value={stats?.history?.totalLoans ?? 0} icon={HistoryIcon} color="secondary" loading={isLoadingStats} onClick={() => navigate('/loans', { state: { initialTab: 3 }})} tooltip="Nombre total de prêts effectués" />
                </Grid>

                <Grid item xs={12} lg={4}>
                    <ServerStatusWidget serversToPing={config?.rds_servers || []} />
                </Grid>
                <Grid item xs={12} lg={4}>
                    <ConnectedTechniciansWidget />
                </Grid>
                <Grid item xs={12} lg={4}>
                    <RecentActivityWidget />
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 1.5, height: '100%', maxHeight: 240, borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 600, mb: 1 }}><WarningIcon sx={{ mr: 1, fontSize: 18, color: 'warning.main' }} />Prêts en Retard ({overdueLoans.length})</Typography>
                        {isLoadingLoans ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}><CircularProgress size={20}/></Box> : (
                            <List dense disablePadding sx={{ flex: 1, overflowY: 'auto' }}>
                                {overdueLoans.slice(0,5).map(l => (
                                    <ListItem key={l.id} disableGutters sx={{ py: 0.3 }}>
                                        <ListItemText
                                            primary={<Typography variant="caption" fontWeight={500}>{l.computerName}</Typography>}
                                            secondary={
                                                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>{l.userDisplayName}</Typography>
                                                    <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>•</Typography>
                                                    <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>{new Date(l.expectedReturnDate).toLocaleDateString('fr-FR')}</Typography>
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                ))}
                                {overdueLoans.length === 0 && <Typography variant="caption" color="text.secondary" sx={{ py: 2, textAlign: 'center', display: 'block' }}>Aucun prêt en retard</Typography>}
                            </List>
                        )}
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 1.5, height: '100%', maxHeight: 240, borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 600, mb: 1 }}><AssignmentIcon sx={{ mr: 1, fontSize: 18, color: 'info.main' }} />Prêts Actifs ({activeLoans.length})</Typography>
                        {isLoadingLoans ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}><CircularProgress size={20}/></Box> : (
                            <List dense disablePadding sx={{ flex: 1, overflowY: 'auto' }}>
                                {activeLoans.slice(0,5).map(l => (
                                    <ListItem key={l.id} disableGutters sx={{ py: 0.3 }}>
                                        <ListItemText
                                            primary={<Typography variant="caption" fontWeight={500}>{l.computerName}</Typography>}
                                            secondary={
                                                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>{l.userDisplayName}</Typography>
                                                    <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>•</Typography>
                                                    <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>{new Date(l.expectedReturnDate).toLocaleDateString('fr-FR')}</Typography>
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                ))}
                                {activeLoans.length === 0 && <Typography variant="caption" color="text.secondary" sx={{ py: 2, textAlign: 'center', display: 'block' }}>Aucun prêt actif</Typography>}
                            </List>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DashboardPage;