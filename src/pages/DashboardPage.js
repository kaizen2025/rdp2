// src/pages/DashboardPage.js - VERSION OPTIMISÉE ET COMPACTE

import React, { memo, useMemo, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Paper, Typography, List, ListItem, ListItemText, ListItemAvatar, Tooltip, Chip, Avatar, CircularProgress, IconButton, LinearProgress, Divider } from '@mui/material';

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

import { useCache } from '../contexts/CacheContext';
import apiService from '../services/apiService';

import PageHeader from '../components/common/PageHeader';
import LoadingScreen from '../components/common/LoadingScreen';
import KPIWidgetMUI from '../components/dashboard/KPIWidgetMUI';

const ServerStatusWidget = memo(({ onAnalyze }) => {
    const { cache } = useCache();
    const serversToPing = useMemo(() => cache.config?.rds_servers || [], [cache.config]);
    const [statuses, setStatuses] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const fetchStatuses = useCallback(async () => {
        if (serversToPing.length === 0) {
            setIsLoading(false);
            return;
        }
        // Keep previous statuses while loading to avoid flickering
        const results = await Promise.all(serversToPing.map(async server => {
            try {
                const res = await apiService.pingRdsServer(server);
                return {
                    server,
                    online: res.success,
                    message: res.output,
                    cpu: res.cpu,
                    ram: res.ram,
                    storage: res.storage
                };
            } catch (err) {
                return { server, online: false, message: err.message };
            }
        }));
        const newStatuses = results.reduce((acc, curr) => {
            acc[curr.server] = {
                online: curr.online,
                message: curr.message,
                cpu: curr.cpu,
                ram: curr.ram,
                storage: curr.storage
            };
            return acc;
        }, {});
        setStatuses(newStatuses);
        setIsLoading(false);
    }, [serversToPing]);

    useEffect(() => {
        fetchStatuses();
        const interval = setInterval(fetchStatuses, 30000); // Refresh every 30s for better responsiveness
        return () => clearInterval(interval);
    }, [fetchStatuses]);

    const formatBytes = (bytes, decimals = 2) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    return (
        <Paper elevation={2} sx={{ p: 2, height: '100%', borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 600, mb: 2 }}>
                <DnsIcon sx={{ mr: 1.5, color: 'primary.main' }} />
                Statut Serveurs RDS
            </Typography>

            {isLoading && Object.keys(statuses).length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
            ) : (
                <Grid container spacing={2} sx={{ flex: 1 }}>
                    {serversToPing.map(server => {
                        const status = statuses[server];
                        return (
                            <Grid item xs={12} md={6} key={server}>
                                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, height: '100%' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Chip
                                                icon={status?.online ? <CheckCircleIcon /> : <CancelIcon />}
                                                label={server}
                                                color={status?.online ? 'success' : 'error'}
                                                variant={status?.online ? 'filled' : 'outlined'}
                                                size="small"
                                                sx={{ fontWeight: 700 }}
                                            />
                                        </Box>
                                    </Box>

                                    {status?.online ? (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                            {/* CPU & RAM Row */}
                                            <Box sx={{ display: 'flex', gap: 2 }}>
                                                <Box sx={{ flex: 1 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                        <Typography variant="caption" fontWeight={600}>CPU</Typography>
                                                        <Typography variant="caption" fontWeight={700}>
                                                            {status.cpu?.usage !== undefined ? status.cpu.usage.toFixed(1) + '%' : 'N/A'}
                                                        </Typography>
                                                    </Box>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={status.cpu?.usage || 0}
                                                        color={status.cpu?.usage > 80 ? 'error' : status.cpu?.usage > 60 ? 'warning' : 'success'}
                                                        sx={{ height: 6, borderRadius: 3 }}
                                                    />
                                                </Box>
                                                <Box sx={{ flex: 1 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                        <Typography variant="caption" fontWeight={600}>RAM</Typography>
                                                        <Typography variant="caption" fontWeight={700}>
                                                            {status.ram?.usage !== undefined ? status.ram.usage.toFixed(1) + '%' : 'N/A'}
                                                        </Typography>
                                                    </Box>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={status.ram?.usage || 0}
                                                        color={status.ram?.usage > 80 ? 'error' : status.ram?.usage > 60 ? 'warning' : 'info'}
                                                        sx={{ height: 6, borderRadius: 3 }}
                                                    />
                                                </Box>
                                            </Box>

                                            {/* Disk Row */}
                                            <Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                    <Typography variant="caption" fontWeight={600}>Disque (C:)</Typography>
                                                    <Typography variant="caption" fontWeight={700}>
                                                        {status.storage?.used !== undefined ?
                                                            `${formatBytes(status.storage.free)} libres / ${formatBytes(status.storage.total)}` : 'N/A'}
                                                    </Typography>
                                                </Box>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={status.storage?.usage || 0}
                                                    color={status.storage?.usage > 90 ? 'error' : status.storage?.usage > 75 ? 'warning' : 'primary'}
                                                    sx={{ height: 6, borderRadius: 3 }}
                                                />
                                            </Box>
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" color="error.main" sx={{ py: 2, textAlign: 'center' }}>
                                            {status?.message || 'Serveur injoignable'}
                                        </Typography>
                                    )}
                                </Paper>
                            </Grid>
                        );
                    })}
                </Grid>
            )}
        </Paper>
    );
});

const CompactListWidget = memo(({ title, icon: Icon, color, items, emptyMessage, renderItem }) => (
    <Paper elevation={2} sx={{ p: 1.5, height: '100%', borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', fontWeight: 600, mb: 1, color: `${color}.main` }}>
            <Icon sx={{ mr: 1, fontSize: 20 }} />
            {title}
        </Typography>
        <Divider sx={{ mb: 1 }} />
        <List dense disablePadding sx={{ flex: 1, overflowY: 'auto', maxHeight: 200 }}>
            {items && items.length > 0 ? items.map(renderItem) : (
                <Typography variant="caption" color="text.secondary" sx={{ py: 2, textAlign: 'center', display: 'block' }}>
                    {emptyMessage}
                </Typography>
            )}
        </List>
    </Paper>
));

const DashboardPage = ({ onAnalyzeServer }) => {
    const navigate = useNavigate();
    const { cache, isLoading } = useCache();

    const { loans = [], computers = [], loan_history = [], technicians = [] } = cache;

    const { activeLoans, overdueLoans, stats } = useMemo(() => {
        const active = loans.filter(l => l.status === 'active');
        const overdue = loans.filter(l => l.status === 'overdue' || l.status === 'critical');
        return {
            activeLoans: active,
            overdueLoans: overdue,
            stats: {
                computers: { total: computers.length, available: computers.filter(c => c.status === 'available').length },
                loans: { active: active.length, reserved: loans.filter(l => l.status === 'reserved').length, overdue: overdue.length },
                history: { total: loan_history.filter(h => h.eventType === 'created').length }
            }
        };
    }, [loans, computers, loan_history]);

    if (isLoading) return <LoadingScreen type="dashboard" />;

    return (
        <Box sx={{ p: 2, maxHeight: '100vh', overflow: 'auto' }}>
            <PageHeader title="Tableau de Bord" subtitle="Vue d'ensemble RDS & Parc Informatique" icon={DashboardIcon} />

            {/* KPI Widgets - Ligne unique et compacte */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6} md={3}>
                    <KPIWidgetMUI title="Matériel" value={stats.computers.total} subtitle={`${stats.computers.available} dispos`} icon={LaptopChromebookIcon} color="primary" />
                </Grid>
                <Grid item xs={6} md={3}>
                    <KPIWidgetMUI title="Prêts Actifs" value={stats.loans.active} subtitle={`${stats.loans.reserved} réservés`} icon={AssignmentIcon} color="info" />
                </Grid>
                <Grid item xs={6} md={3}>
                    <KPIWidgetMUI title="Retards" value={stats.loans.overdue} subtitle="Action requise" icon={WarningIcon} color="error" />
                </Grid>
                <Grid item xs={6} md={3}>
                    <KPIWidgetMUI title="Historique" value={stats.history.total} subtitle="Total prêts" icon={HistoryIcon} color="success" />
                </Grid>
            </Grid>

            <Grid container spacing={2}>
                {/* Colonne Principale : RDS (Prend plus de place) */}
                <Grid item xs={12} lg={8}>
                    <ServerStatusWidget onAnalyze={onAnalyzeServer} />
                </Grid>

                {/* Colonne Latérale : Techniciens & Activité */}
                <Grid item xs={12} lg={4}>
                    <Grid container spacing={2} direction="column">
                        <Grid item xs={12}>
                            <CompactListWidget
                                title={`Techniciens (${technicians.length})`}
                                icon={PeopleIcon}
                                color="secondary"
                                items={technicians}
                                emptyMessage="Aucun technicien connecté"
                                renderItem={(tech) => (
                                    <ListItem key={tech.id} disableGutters sx={{ py: 0.5 }}>
                                        <ListItemAvatar sx={{ minWidth: 36 }}>
                                            <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: 'secondary.main' }}>{tech.name.charAt(0)}</Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={<Typography variant="body2" fontWeight={500}>{tech.name}</Typography>}
                                            secondary={<Typography variant="caption" color="text.secondary">Connecté depuis {new Date(tech.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>}
                                        />
                                    </ListItem>
                                )}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <CompactListWidget
                                title="Activité Récente"
                                icon={HistoryIcon}
                                color="info"
                                items={loan_history.slice(0, 5)}
                                emptyMessage="Aucune activité"
                                renderItem={(act) => (
                                    <ListItem key={act.id} disableGutters sx={{ py: 0.5 }}>
                                        <ListItemText
                                            primary={<Typography variant="body2">{act.computerName}</Typography>}
                                            secondary={<Typography variant="caption">{act.eventType === 'created' ? 'Prêté à' : 'Retourné par'} {act.userDisplayName || 'Utilisateur'}</Typography>}
                                        />
                                        <Typography variant="caption" color="text.secondary">{new Date(act.timestamp || act.date).toLocaleDateString()}</Typography>
                                    </ListItem>
                                )}
                            />
                        </Grid>
                    </Grid>
                </Grid>

                {/* Ligne du bas : Listes compactes Prêts */}
                <Grid item xs={12} md={6}>
                    <CompactListWidget
                        title={`En Retard (${overdueLoans.length})`}
                        icon={WarningIcon}
                        color="error"
                        items={overdueLoans.slice(0, 5)}
                        emptyMessage="Aucun retard"
                        renderItem={(loan) => (
                            <ListItem key={loan.id} disableGutters sx={{ py: 0.5 }}>
                                <ListItemText
                                    primary={<Typography variant="body2" fontWeight={600}>{loan.computerName}</Typography>}
                                    secondary={<Typography variant="caption">{loan.userDisplayName}</Typography>}
                                />
                                <Chip label={new Date(loan.expectedReturnDate).toLocaleDateString()} size="small" color="error" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                            </ListItem>
                        )}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <CompactListWidget
                        title={`Prêts Actifs (${activeLoans.length})`}
                        icon={AssignmentIcon}
                        color="info"
                        items={activeLoans.slice(0, 5)}
                        emptyMessage="Aucun prêt actif"
                        renderItem={(loan) => (
                            <ListItem key={loan.id} disableGutters sx={{ py: 0.5 }}>
                                <ListItemText
                                    primary={<Typography variant="body2" fontWeight={500}>{loan.computerName}</Typography>}
                                    secondary={<Typography variant="caption">{loan.userDisplayName}</Typography>}
                                />
                                <Chip label={new Date(loan.expectedReturnDate).toLocaleDateString()} size="small" color="info" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                            </ListItem>
                        )}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

export default DashboardPage;
