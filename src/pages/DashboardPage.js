// src/pages/DashboardPage.js - VERSION REFONDEE AVEC SUPERVISION SERVEURS COMPLETE

import React, { memo, useMemo, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Grid, Paper, Typography, List, ListItem, ListItemText, ListItemAvatar,
    Tooltip, Chip, Avatar, CircularProgress, IconButton, LinearProgress,
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
    Divider, Alert
} from '@mui/material';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import DnsIcon from '@mui/icons-material/Dns';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HistoryIcon from '@mui/icons-material/History';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import LaptopChromebookIcon from '@mui/icons-material/LaptopChromebook';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import MemoryIcon from '@mui/icons-material/Memory';
import StorageIcon from '@mui/icons-material/Storage';
import SpeedIcon from '@mui/icons-material/Speed';

import { useCache } from '../contexts/CacheContext';
import apiService from '../services/apiService';

import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import LoadingScreen from '../components/common/LoadingScreen';

// ===============================================
// COMPOSANT DE CARTE SERVEUR AMELIORE
// ===============================================
const ServerCard = memo(({ server, status, thresholds, onAnalyze }) => {
    const getCpuColor = (percent) => {
        if (!percent && percent !== 0) return 'default';
        if (percent < 60) return 'success';
        if (percent < (thresholds?.cpuPercent || 85)) return 'warning';
        return 'error';
    };

    const getMemoryColor = (percent) => {
        if (!percent && percent !== 0) return 'default';
        if (percent < 60) return 'success';
        if (percent < (thresholds?.memoryPercent || 85)) return 'warning';
        return 'error';
    };

    const getDiskColor = (freePercent) => {
        if (!freePercent && freePercent !== 0) return 'default';
        if (freePercent > 30) return 'success';
        if (freePercent > 10) return 'warning';
        return 'error';
    };

    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) return '0 GB';
        const gb = bytes / (1024 * 1024 * 1024);
        return `${gb.toFixed(1)} GB`;
    };

    const isOnline = status?.online;
    const cpuUsage = status?.cpu?.usage || 0;
    const ramTotal = status?.storage?.total || 0;
    const ramFree = status?.storage?.free || 0;
    const ramUsedPercent = ramTotal > 0 ? ((ramTotal - ramFree) / ramTotal) * 100 : 0;
    const diskFreePercent = ramTotal > 0 ? (ramFree / ramTotal) * 100 : 0;

    // Calculer les alertes
    const hasAlerts = (
        cpuUsage > (thresholds?.cpuPercent || 85) ||
        ramUsedPercent > (thresholds?.memoryPercent || 85) ||
        diskFreePercent < 15
    );

    return (
        <Paper
            elevation={2}
            sx={{
                p: 2,
                height: '100%',
                borderRadius: 2,
                border: hasAlerts ? '2px solid' : '1px solid',
                borderColor: hasAlerts ? 'error.main' : isOnline ? 'success.light' : 'grey.300',
                bgcolor: isOnline ? 'background.paper' : 'grey.50',
                transition: 'all 0.3s ease'
            }}
        >
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DnsIcon sx={{ fontSize: 20, color: isOnline ? 'primary.main' : 'grey.400' }} />
                    <Typography variant="subtitle2" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                        {server}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {hasAlerts && (
                        <Tooltip title="Alertes actives">
                            <WarningIcon sx={{ fontSize: 18, color: 'error.main' }} />
                        </Tooltip>
                    )}
                    <Chip
                        icon={isOnline ? <CheckCircleIcon /> : <CancelIcon />}
                        label={isOnline ? 'En ligne' : 'Hors ligne'}
                        size="small"
                        color={isOnline ? 'success' : 'error'}
                        variant={isOnline ? 'filled' : 'outlined'}
                        sx={{ height: 22, fontSize: '0.7rem' }}
                    />
                </Box>
            </Box>

            {isOnline ? (
                <>
                    {/* CPU */}
                    <Box sx={{ mb: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <SpeedIcon sx={{ fontSize: 16, color: getCpuColor(cpuUsage) + '.main' }} />
                                <Typography variant="caption" fontWeight={600}>CPU</Typography>
                            </Box>
                            <Typography variant="caption" fontWeight={700} color={getCpuColor(cpuUsage) + '.main'}>
                                {cpuUsage.toFixed(1)}%
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={Math.min(cpuUsage, 100)}
                            color={getCpuColor(cpuUsage)}
                            sx={{ height: 8, borderRadius: 4 }}
                        />
                    </Box>

                    {/* RAM */}
                    <Box sx={{ mb: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <MemoryIcon sx={{ fontSize: 16, color: getMemoryColor(ramUsedPercent) + '.main' }} />
                                <Typography variant="caption" fontWeight={600}>RAM</Typography>
                            </Box>
                            <Typography variant="caption" fontWeight={700} color={getMemoryColor(ramUsedPercent) + '.main'}>
                                {ramUsedPercent.toFixed(1)}%
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={Math.min(ramUsedPercent, 100)}
                            color={getMemoryColor(ramUsedPercent)}
                            sx={{ height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                            {formatBytes(ramTotal - ramFree)} / {formatBytes(ramTotal)}
                        </Typography>
                    </Box>

                    {/* Stockage */}
                    <Box sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <StorageIcon sx={{ fontSize: 16, color: getDiskColor(diskFreePercent) + '.main' }} />
                                <Typography variant="caption" fontWeight={600}>Stockage</Typography>
                            </Box>
                            <Typography variant="caption" fontWeight={700} color={getDiskColor(diskFreePercent) + '.main'}>
                                {formatBytes(ramFree)} libre
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={Math.min(100 - diskFreePercent, 100)}
                            color={getDiskColor(diskFreePercent)}
                            sx={{ height: 8, borderRadius: 4 }}
                        />
                    </Box>

                    {/* Bouton analyse IA */}
                    {onAnalyze && (
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<SmartToyIcon />}
                            onClick={() => onAnalyze(server, status)}
                            sx={{ mt: 1, width: '100%', fontSize: '0.7rem' }}
                        >
                            Analyser avec IA
                        </Button>
                    )}
                </>
            ) : (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="caption" color="error">
                        Serveur inaccessible
                    </Typography>
                    {status?.message && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontSize: '0.65rem' }}>
                            {status.message}
                        </Typography>
                    )}
                </Box>
            )}
        </Paper>
    );
});

// ===============================================
// COMPOSANT DE SUPERVISION SERVEURS COMPLET
// ===============================================
const ServerMonitoringSection = memo(({ onAnalyzeServer }) => {
    const { cache } = useCache();
    const [statuses, setStatuses] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [serverList, setServerList] = useState([]);
    const [newServer, setNewServer] = useState('');
    const [thresholds, setThresholds] = useState({
        cpuPercent: 85,
        memoryPercent: 85,
        diskSpaceGB: 10
    });

    const serversToPing = useMemo(() => cache.config?.rds_servers || [], [cache.config]);

    const fetchStatuses = useCallback(async () => {
        if (serversToPing.length === 0) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const results = await Promise.all(serversToPing.map(async server => {
            try {
                const res = await apiService.pingRdsServer(server);
                return {
                    server,
                    online: res.success,
                    message: res.output,
                    cpu: res.cpu,
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
                storage: curr.storage
            };
            return acc;
        }, {});
        setStatuses(newStatuses);
        setIsLoading(false);
    }, [serversToPing]);

    useEffect(() => {
        setServerList(serversToPing);
        fetchStatuses();
        const interval = setInterval(fetchStatuses, 60000);
        return () => clearInterval(interval);
    }, [fetchStatuses, serversToPing]);

    const handleAddServer = async () => {
        if (!newServer.trim()) return;
        try {
            const updatedList = [...serverList, newServer.trim().toUpperCase()];
            await apiService.updateConfig({ rds_servers: updatedList });
            setServerList(updatedList);
            setNewServer('');
            // Rafraichir les statuts
            setTimeout(fetchStatuses, 500);
        } catch (error) {
            console.error('Erreur ajout serveur:', error);
        }
    };

    const handleDeleteServer = async (serverName) => {
        try {
            const updatedList = serverList.filter(s => s !== serverName);
            await apiService.updateConfig({ rds_servers: updatedList });
            setServerList(updatedList);
        } catch (error) {
            console.error('Erreur suppression serveur:', error);
        }
    };

    const alertCount = useMemo(() => {
        return Object.values(statuses).reduce((count, status) => {
            if (!status.online) return count + 1;
            let alerts = 0;
            if (status.cpu?.usage > thresholds.cpuPercent) alerts++;
            if (status.storage) {
                const usedPercent = ((status.storage.total - status.storage.free) / status.storage.total) * 100;
                if (usedPercent > thresholds.memoryPercent) alerts++;
            }
            return count + alerts;
        }, 0);
    }, [statuses, thresholds]);

    return (
        <>
            <Paper elevation={3} sx={{ p: 2.5, borderRadius: 3, mb: 2.5 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <DnsIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                        <Box>
                            <Typography variant="h6" fontWeight={700}>
                                Supervision Serveurs RDS
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Monitoring en temps réel - Actualisation automatique
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                            label={`${serversToPing.length} serveur(s)`}
                            size="small"
                            color="primary"
                            sx={{ fontWeight: 600 }}
                        />
                        {alertCount > 0 && (
                            <Chip
                                icon={<WarningIcon />}
                                label={`${alertCount} alerte(s)`}
                                size="small"
                                color="error"
                                sx={{ fontWeight: 600 }}
                            />
                        )}
                        <Tooltip title="Configurer les serveurs">
                            <IconButton onClick={() => setSettingsOpen(true)} color="primary">
                                <SettingsIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Rafraichir">
                            <IconButton onClick={fetchStatuses} disabled={isLoading}>
                                <RefreshIcon sx={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* Grille des serveurs */}
                {isLoading && serversToPing.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <CircularProgress size={32} />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            Chargement des serveurs...
                        </Typography>
                    </Box>
                ) : serversToPing.length === 0 ? (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Aucun serveur configuré. Cliquez sur l'engrenage pour ajouter des serveurs RDS.
                    </Alert>
                ) : (
                    <Grid container spacing={2}>
                        {serversToPing.map(server => (
                            <Grid item xs={12} sm={6} md={3} key={server}>
                                <ServerCard
                                    server={server}
                                    status={statuses[server]}
                                    thresholds={thresholds}
                                    onAnalyze={onAnalyzeServer}
                                />
                            </Grid>
                        ))}
                    </Grid>
                )}

                {/* Footer */}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'right' }}>
                    Derniere mise a jour: {new Date().toLocaleTimeString('fr-FR')}
                </Typography>
            </Paper>

            {/* Dialog de configuration */}
            <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SettingsIcon color="primary" />
                        <Typography variant="h6">Configuration des Serveurs RDS</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {/* Seuils d'alerte */}
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 1, fontWeight: 600 }}>
                        Seuils d'Alerte
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={4}>
                            <TextField
                                fullWidth
                                size="small"
                                label="CPU (%)"
                                type="number"
                                value={thresholds.cpuPercent}
                                onChange={(e) => setThresholds({ ...thresholds, cpuPercent: parseInt(e.target.value) || 85 })}
                                inputProps={{ min: 50, max: 100 }}
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Memoire (%)"
                                type="number"
                                value={thresholds.memoryPercent}
                                onChange={(e) => setThresholds({ ...thresholds, memoryPercent: parseInt(e.target.value) || 85 })}
                                inputProps={{ min: 50, max: 100 }}
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Disque min (GB)"
                                type="number"
                                value={thresholds.diskSpaceGB}
                                onChange={(e) => setThresholds({ ...thresholds, diskSpaceGB: parseInt(e.target.value) || 10 })}
                                inputProps={{ min: 1, max: 100 }}
                            />
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    {/* Liste des serveurs */}
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                        Serveurs a Monitorer
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Nom du serveur (ex: SRV-RDS-5)"
                            value={newServer}
                            onChange={(e) => setNewServer(e.target.value.toUpperCase())}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddServer()}
                        />
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleAddServer}
                            disabled={!newServer.trim()}
                        >
                            Ajouter
                        </Button>
                    </Box>

                    <List dense sx={{ maxHeight: 200, overflow: 'auto', bgcolor: 'grey.50', borderRadius: 1 }}>
                        {serverList.map((server, idx) => (
                            <ListItem key={idx} divider sx={{ py: 1 }}>
                                <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: statuses[server]?.online ? 'success.main' : 'grey.400', width: 32, height: 32 }}>
                                        <DnsIcon sx={{ fontSize: 18 }} />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={server}
                                    secondary={statuses[server]?.online ? 'En ligne' : 'Hors ligne'}
                                    primaryTypographyProps={{ fontWeight: 600 }}
                                />
                                <IconButton
                                    edge="end"
                                    size="small"
                                    onClick={() => handleDeleteServer(server)}
                                    color="error"
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </ListItem>
                        ))}
                        {serverList.length === 0 && (
                            <Typography variant="caption" color="text.secondary" sx={{ p: 2, display: 'block', textAlign: 'center' }}>
                                Aucun serveur configure
                            </Typography>
                        )}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSettingsOpen(false)}>Fermer</Button>
                </DialogActions>
            </Dialog>

            {/* Keyframes pour l'animation de refresh */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
});

// ===============================================
// COMPOSANTS SECONDAIRES
// ===============================================
const ConnectedTechniciansWidget = memo(() => {
    const { cache } = useCache();
    const technicians = useMemo(() => cache.technicians || [], [cache.technicians]);

    const calculateConnectionTime = (loginTime) => {
        if (!loginTime) return 'Recent';
        const diffMins = Math.floor((new Date() - new Date(loginTime)) / 60000);
        if (diffMins < 1) return "A l'instant";
        if (diffMins < 60) return `${diffMins} min`;
        return `${Math.floor(diffMins / 60)}h ${diffMins % 60}min`;
    };

    return (
        <Paper elevation={2} sx={{ p: 2, height: '100%', borderRadius: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 600, mb: 1.5 }}>
                <PeopleIcon sx={{ mr: 1, fontSize: 20, color: 'secondary.main' }} />
                Techniciens Connectes ({technicians.length})
            </Typography>
            <List dense disablePadding sx={{ maxHeight: 200, overflowY: 'auto' }}>
                {technicians.length > 0 ? technicians.map(tech => (
                    <ListItem key={tech.id} disableGutters sx={{ py: 0.5 }}>
                        <ListItemAvatar sx={{ minWidth: 36 }}>
                            <Avatar sx={{ width: 30, height: 30, fontSize: '0.8rem', bgcolor: 'secondary.main' }}>
                                {tech.name?.charAt(0) || '?'}
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={<Typography variant="body2" fontWeight={500}>{tech.name}</Typography>}
                            secondary={
                                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <AccessTimeIcon sx={{ fontSize: 12 }} />
                                    <Typography variant="caption">{calculateConnectionTime(tech.loginTime)}</Typography>
                                </Box>
                            }
                        />
                    </ListItem>
                )) : (
                    <Typography variant="caption" color="text.secondary" sx={{ py: 2, textAlign: 'center', display: 'block' }}>
                        Aucun technicien connecte
                    </Typography>
                )}
            </List>
        </Paper>
    );
});

const RecentActivityWidget = memo(() => {
    const { cache } = useCache();
    const activities = cache.loan_history || [];

    const getActivityIcon = (e) => ({
        created: <AssignmentIcon color="success" fontSize="small" />,
        returned: <CheckCircleIcon color="primary" fontSize="small" />,
        extended: <TrendingUpIcon color="info" fontSize="small" />,
        cancelled: <CancelIcon color="error" fontSize="small" />
    }[e] || <HistoryIcon fontSize="small" />);

    const getActivityText = (act) => `${({ created: 'Pret', returned: 'Retour', extended: 'Prolong.', cancelled: 'Annul.' }[act.eventType] || 'Action')}: ${act.computerName || 'N/A'}`;

    return (
        <Paper elevation={2} sx={{ p: 2, height: '100%', borderRadius: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 600, mb: 1.5 }}>
                <HistoryIcon sx={{ mr: 1, fontSize: 20, color: 'info.main' }} />
                Activite Recente
            </Typography>
            <List dense disablePadding sx={{ maxHeight: 200, overflowY: 'auto' }}>
                {activities.length > 0 ? activities.slice(0, 6).map(act => (
                    <ListItem key={act.id} disableGutters sx={{ py: 0.5 }}>
                        <ListItemAvatar sx={{ minWidth: 32 }}>{getActivityIcon(act.eventType)}</ListItemAvatar>
                        <ListItemText
                            primary={<Typography variant="caption">{getActivityText(act)}</Typography>}
                            secondary={<Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Par {act.by || 'Syst.'}</Typography>}
                        />
                    </ListItem>
                )) : (
                    <Typography variant="caption" color="text.secondary" sx={{ py: 2, textAlign: 'center', display: 'block' }}>
                        Aucune activite recente
                    </Typography>
                )}
            </List>
        </Paper>
    );
});

// ===============================================
// COMPOSANT PRINCIPAL DASHBOARD
// ===============================================
const DashboardPage = ({ onAnalyzeServer }) => {
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

    const handleAnalyzeServer = (server, status) => {
        const prompt = `J'aimerais une analyse du serveur RDS "${server}". Voici les metriques actuelles :
- Utilisation CPU : ${status?.cpu?.usage?.toFixed(2) || 'N/A'}%
- Stockage total : ${status?.storage?.total || 'N/A'}
- Stockage libre : ${status?.storage?.free || 'N/A'}

Peux-tu me donner un diagnostic et des pistes d'optimisation ?`;
        if (onAnalyzeServer) {
            onAnalyzeServer(prompt);
        }
    };

    if (isLoading) {
        return <LoadingScreen type="dashboard" />;
    }

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2.5 }, maxHeight: '100vh', overflow: 'auto' }}>
            <PageHeader
                title="Tableau de Bord"
                subtitle="Vue d'ensemble de l'activite RDS et gestion des prets"
                icon={DashboardIcon}
            />

            {/* Section Stats principales */}
            <Grid container spacing={2} sx={{ mb: 2.5 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Materiel Total"
                        value={stats.computers.total}
                        subtitle={`${stats.computers.available} disponibles`}
                        icon={LaptopChromebookIcon}
                        color="primary"
                        loading={isLoading}
                        onClick={() => navigate('/loans', { state: { initialTab: 1 }})}
                        tooltip="Stock total d'ordinateurs et disponibilite"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Prets Actifs"
                        value={stats.loans.active}
                        subtitle={`${stats.loans.reserved} reserves`}
                        icon={AssignmentIcon}
                        color="info"
                        loading={isLoading}
                        onClick={() => navigate('/loans', { state: { initialTab: 0 }})}
                        tooltip="Prets en cours et reservations"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="En Retard"
                        value={stats.loans.overdue + stats.loans.critical}
                        subtitle={`${stats.loans.critical} critiques`}
                        icon={ErrorOutlineIcon}
                        color="error"
                        loading={isLoading}
                        onClick={() => navigate('/loans', { state: { initialTab: 0, preFilter: 'overdue' }})}
                        tooltip="Prets en retard necessitant une action"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Historique Total"
                        value={stats.history.totalLoans}
                        icon={HistoryIcon}
                        color="secondary"
                        loading={isLoading}
                        onClick={() => navigate('/loans', { state: { initialTab: 3 }})}
                        tooltip="Nombre total de prets effectues"
                    />
                </Grid>
            </Grid>

            {/* Section Supervision Serveurs RDS - AMELIOREE */}
            <ServerMonitoringSection onAnalyzeServer={handleAnalyzeServer} />

            {/* Section secondaire */}
            <Grid container spacing={2}>
                {/* Techniciens connectes */}
                <Grid item xs={12} md={4}>
                    <ConnectedTechniciansWidget />
                </Grid>

                {/* Activite recente */}
                <Grid item xs={12} md={4}>
                    <RecentActivityWidget />
                </Grid>

                {/* Prets en retard */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={2} sx={{ p: 2, height: '100%', borderRadius: 2 }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 600, mb: 1.5, color: overdueLoans.length > 0 ? 'error.main' : 'text.primary' }}>
                            <WarningIcon sx={{ mr: 1, fontSize: 20, color: 'warning.main' }} />
                            Prets en Retard ({overdueLoans.length})
                        </Typography>
                        <List dense disablePadding sx={{ maxHeight: 200, overflowY: 'auto' }}>
                            {overdueLoans.length > 0 ? overdueLoans.slice(0, 6).map(l => (
                                <ListItem key={l.id} disableGutters sx={{ py: 0.5 }}>
                                    <ListItemText
                                        primary={<Typography variant="body2" fontWeight={500}>{l.computerName}</Typography>}
                                        secondary={
                                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Typography variant="caption">{l.userDisplayName}</Typography>
                                                <Typography variant="caption">-</Typography>
                                                <Typography variant="caption" color="error">
                                                    {new Date(l.expectedReturnDate).toLocaleDateString('fr-FR')}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                            )) : (
                                <Typography variant="caption" color="text.secondary" sx={{ py: 2, textAlign: 'center', display: 'block' }}>
                                    Aucun pret en retard
                                </Typography>
                            )}
                        </List>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DashboardPage;
