// src/pages/DashboardPage.js - VERSION COMPACTE ET OPTIMISEE

import React, { memo, useMemo, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Grid, Paper, Typography, List, ListItem, ListItemText, ListItemAvatar,
    Tooltip, Chip, Avatar, CircularProgress, IconButton, LinearProgress,
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
    Divider, Alert, Collapse
} from '@mui/material';

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
import SettingsIcon from '@mui/icons-material/Settings';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import MemoryIcon from '@mui/icons-material/Memory';
import StorageIcon from '@mui/icons-material/Storage';
import SpeedIcon from '@mui/icons-material/Speed';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ComputerIcon from '@mui/icons-material/Computer';
import GroupsIcon from '@mui/icons-material/Groups';

import { useCache } from '../contexts/CacheContext';
import apiService from '../services/apiService';

import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import LoadingScreen from '../components/common/LoadingScreen';

// ===============================================
// COMPOSANT DE CARTE SERVEUR COMPACT
// ===============================================
const ServerCard = memo(({ server, status, thresholds, sessions = 0 }) => {
    const getColor = (percent, isInverse = false) => {
        if (!percent && percent !== 0) return 'default';
        if (isInverse) {
            if (percent > 30) return 'success';
            if (percent > 10) return 'warning';
            return 'error';
        }
        if (percent < 60) return 'success';
        if (percent < (thresholds?.cpuPercent || 85)) return 'warning';
        return 'error';
    };

    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) return '0 GB';
        const gb = bytes / (1024 * 1024 * 1024);
        return `${gb.toFixed(0)} GB`;
    };

    const isOnline = status?.online;
    const cpuUsage = status?.cpu?.usage || 0;
    const ramTotal = status?.memory?.total || 0;
    const ramFree = status?.memory?.free || 0;
    const ramUsedPercent = ramTotal > 0 ? ((ramTotal - ramFree) / ramTotal) * 100 : 0;
    const diskTotal = status?.storage?.total || 0;
    const diskFree = status?.storage?.free || 0;
    const diskFreePercent = diskTotal > 0 ? (diskFree / diskTotal) * 100 : 0;
    const diskUsedPercent = 100 - diskFreePercent;

    const hasAlerts = (
        cpuUsage > (thresholds?.cpuPercent || 85) ||
        ramUsedPercent > (thresholds?.memoryPercent || 85) ||
        diskFreePercent < 15
    );

    const MetricBar = ({ icon: Icon, label, value, percent, color, suffix = '%' }) => (
        <Box sx={{ mb: 0.75 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Icon sx={{ fontSize: 14, color: `${color}.main` }} />
                    <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>{label}</Typography>
                </Box>
                <Typography variant="caption" fontWeight={600} color={`${color}.main`} sx={{ fontSize: '0.7rem' }}>
                    {value}{suffix}
                </Typography>
            </Box>
            <LinearProgress
                variant="determinate"
                value={Math.min(percent, 100)}
                color={color}
                sx={{ height: 6, borderRadius: 3 }}
            />
        </Box>
    );

    return (
        <Paper
            elevation={1}
            sx={{
                p: 1.25,
                borderRadius: 2,
                border: hasAlerts ? '2px solid' : '1px solid',
                borderColor: hasAlerts ? 'error.main' : isOnline ? 'success.light' : 'grey.300',
                bgcolor: isOnline ? 'background.paper' : 'grey.100',
                transition: 'all 0.2s ease',
                minHeight: 160
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <DnsIcon sx={{ fontSize: 18, color: isOnline ? 'primary.main' : 'grey.400' }} />
                    <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: '0.8rem' }}>
                        {server}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {hasAlerts && <WarningIcon sx={{ fontSize: 14, color: 'error.main' }} />}
                    <Chip
                        size="small"
                        label={isOnline ? 'OK' : 'OFF'}
                        color={isOnline ? 'success' : 'error'}
                        sx={{ height: 18, fontSize: '0.65rem', '& .MuiChip-label': { px: 0.75 } }}
                    />
                </Box>
            </Box>

            {isOnline ? (
                <>
                    <MetricBar
                        icon={SpeedIcon}
                        label="CPU"
                        value={cpuUsage.toFixed(0)}
                        percent={cpuUsage}
                        color={getColor(cpuUsage)}
                    />
                    <MetricBar
                        icon={MemoryIcon}
                        label="RAM"
                        value={ramUsedPercent.toFixed(0)}
                        percent={ramUsedPercent}
                        color={getColor(ramUsedPercent)}
                    />
                    <MetricBar
                        icon={StorageIcon}
                        label="Disque"
                        value={diskUsedPercent.toFixed(0)}
                        percent={diskUsedPercent}
                        color={getColor(diskFreePercent, true)}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, pt: 0.5, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                            RAM: {formatBytes(ramTotal - ramFree)}/{formatBytes(ramTotal)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                            {formatBytes(diskFree)} libre
                        </Typography>
                    </Box>
                    {sessions > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, justifyContent: 'center' }}>
                            <GroupsIcon sx={{ fontSize: 12, color: 'info.main' }} />
                            <Typography variant="caption" color="info.main" sx={{ fontSize: '0.65rem', fontWeight: 600 }}>
                                {sessions} session(s)
                            </Typography>
                        </Box>
                    )}
                </>
            ) : (
                <Box sx={{ textAlign: 'center', py: 1.5 }}>
                    <CancelIcon sx={{ fontSize: 24, color: 'grey.400', mb: 0.5 }} />
                    <Typography variant="caption" color="error" sx={{ display: 'block', fontSize: '0.7rem' }}>
                        Inaccessible
                    </Typography>
                </Box>
            )}
        </Paper>
    );
});

// ===============================================
// COMPOSANT DE SUPERVISION SERVEURS OPTIMISE
// ===============================================
const ServerMonitoringSection = memo(() => {
    const { cache } = useCache();
    const [statuses, setStatuses] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [serverList, setServerList] = useState([]);
    const [newServer, setNewServer] = useState('');
    const [lastUpdate, setLastUpdate] = useState(null);
    const [thresholds, setThresholds] = useState({
        cpuPercent: 85,
        memoryPercent: 85,
        diskSpaceGB: 10
    });

    const serversToPing = useMemo(() => cache.config?.rds_servers || [], [cache.config]);
    const rdsSessions = useMemo(() => cache.rds_sessions || [], [cache.rds_sessions]);

    // Compter les sessions par serveur
    const sessionsByServer = useMemo(() => {
        return rdsSessions.reduce((acc, session) => {
            acc[session.server] = (acc[session.server] || 0) + 1;
            return acc;
        }, {});
    }, [rdsSessions]);

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
                    memory: res.memory,
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
                memory: curr.memory,
                storage: curr.storage
            };
            return acc;
        }, {});
        setStatuses(newStatuses);
        setLastUpdate(new Date());
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
        const serverName = newServer.trim().toUpperCase();

        // Vérifier si le serveur existe déjà
        if (serverList.includes(serverName)) {
            console.warn(`Le serveur ${serverName} existe déjà`);
            return;
        }

        try {
            const updatedList = [...serverList, serverName];
            await apiService.updateConfig({ rds_servers: updatedList });
            setServerList(updatedList);
            setNewServer('');
            // Forcer un rafraîchissement immédiat pour le nouveau serveur
            setTimeout(fetchStatuses, 500);
        } catch (error) {
            console.error('Erreur ajout serveur:', error);
        }
    };

    const handleDeleteServer = async (serverName) => {
        if (!window.confirm(`Voulez-vous vraiment retirer ${serverName} de la supervision ?`)) {
            return;
        }
        try {
            const updatedList = serverList.filter(s => s !== serverName);
            await apiService.updateConfig({ rds_servers: updatedList });
            setServerList(updatedList);
            // Nettoyer le statut du serveur supprimé
            setStatuses(prev => {
                const newStatuses = { ...prev };
                delete newStatuses[serverName];
                return newStatuses;
            });
        } catch (error) {
            console.error('Erreur suppression serveur:', error);
        }
    };

    const { alertCount, onlineCount } = useMemo(() => {
        let alerts = 0;
        let online = 0;
        Object.values(statuses).forEach(status => {
            if (!status.online) {
                alerts++;
            } else {
                online++;
                if (status.cpu?.usage > thresholds.cpuPercent) alerts++;
                const ramTotal = status.memory?.total || 0;
                const ramFree = status.memory?.free || 0;
                const ramUsedPercent = ramTotal > 0 ? ((ramTotal - ramFree) / ramTotal) * 100 : 0;
                if (ramUsedPercent > thresholds.memoryPercent) alerts++;
                const diskTotal = status.storage?.total || 0;
                const diskFree = status.storage?.free || 0;
                const diskFreePercent = diskTotal > 0 ? (diskFree / diskTotal) * 100 : 0;
                if (diskFreePercent < 15) alerts++;
            }
        });
        return { alertCount: alerts, onlineCount: online };
    }, [statuses, thresholds]);

    const totalSessions = rdsSessions.length;

    return (
        <>
            <Paper elevation={2} sx={{ p: 1.5, borderRadius: 2, mb: 2 }}>
                {/* Header compact */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DnsIcon sx={{ fontSize: 22, color: 'primary.main' }} />
                        <Typography variant="subtitle1" fontWeight={700}>
                            Supervision RDS
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Chip
                            size="small"
                            label={`${onlineCount}/${serversToPing.length}`}
                            color={onlineCount === serversToPing.length ? 'success' : 'warning'}
                            sx={{ height: 22, fontSize: '0.7rem' }}
                        />
                        {totalSessions > 0 && (
                            <Chip
                                size="small"
                                icon={<GroupsIcon sx={{ fontSize: '14px !important' }} />}
                                label={totalSessions}
                                color="info"
                                sx={{ height: 22, fontSize: '0.7rem' }}
                            />
                        )}
                        {alertCount > 0 && (
                            <Chip
                                size="small"
                                icon={<WarningIcon sx={{ fontSize: '14px !important' }} />}
                                label={alertCount}
                                color="error"
                                sx={{ height: 22, fontSize: '0.7rem' }}
                            />
                        )}
                        <Tooltip title="Configurer">
                            <IconButton size="small" onClick={() => setSettingsOpen(true)} color="primary">
                                <SettingsIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Actualiser">
                            <IconButton size="small" onClick={fetchStatuses} disabled={isLoading}>
                                <RefreshIcon sx={{ fontSize: 18, animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* Grille des serveurs - Layout dynamique adapté au nombre de serveurs */}
                {isLoading && serversToPing.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                        <CircularProgress size={28} />
                    </Box>
                ) : serversToPing.length === 0 ? (
                    <Alert severity="info" sx={{ py: 0.5 }}>
                        Aucun serveur configuré. Cliquez sur l'engrenage pour ajouter des serveurs.
                    </Alert>
                ) : (
                    <Grid container spacing={1}>
                        {serversToPing.map(server => {
                            // Calcul dynamique de la largeur des colonnes selon le nombre de serveurs
                            const serverCount = serversToPing.length;
                            let gridSize = { xs: 12, sm: 6, md: 4, lg: 3, xl: 2 };

                            // Adapter la grille pour un affichage optimal
                            if (serverCount === 1) gridSize = { xs: 12, sm: 12, md: 12 };
                            else if (serverCount === 2) gridSize = { xs: 12, sm: 6, md: 6 };
                            else if (serverCount === 3) gridSize = { xs: 12, sm: 6, md: 4 };
                            else if (serverCount <= 6) gridSize = { xs: 12, sm: 6, md: 4, lg: 3 };
                            else gridSize = { xs: 12, sm: 6, md: 4, lg: 3, xl: 2 };

                            return (
                                <Grid item {...gridSize} key={server}>
                                    <ServerCard
                                        server={server}
                                        status={statuses[server]}
                                        thresholds={thresholds}
                                        sessions={sessionsByServer[server] || 0}
                                    />
                                </Grid>
                            );
                        })}
                    </Grid>
                )}

                {/* Footer */}
                {lastUpdate && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'right', fontSize: '0.65rem' }}>
                        Maj: {lastUpdate.toLocaleTimeString('fr-FR')}
                    </Typography>
                )}
            </Paper>

            {/* Dialog de configuration */}
            <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SettingsIcon color="primary" />
                        <Typography variant="h6">Configuration Serveurs RDS</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 1, fontWeight: 600 }}>
                        Seuils d'Alerte
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
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
                                label="RAM (%)"
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

                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                        Serveurs ({serverList.length})
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Ex: SRV-RDS-5"
                            value={newServer}
                            onChange={(e) => setNewServer(e.target.value.toUpperCase())}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddServer()}
                        />
                        <Button variant="contained" size="small" onClick={handleAddServer} disabled={!newServer.trim()}>
                            <AddIcon />
                        </Button>
                    </Box>

                    <List dense sx={{ maxHeight: 180, overflow: 'auto', bgcolor: 'grey.50', borderRadius: 1 }}>
                        {serverList.map((server, idx) => (
                            <ListItem key={idx} divider sx={{ py: 0.5 }}>
                                <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: statuses[server]?.online ? 'success.main' : 'grey.400', width: 28, height: 28 }}>
                                        <DnsIcon sx={{ fontSize: 16 }} />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={server}
                                    secondary={statuses[server]?.online ? `En ligne - ${sessionsByServer[server] || 0} sessions` : 'Hors ligne'}
                                    primaryTypographyProps={{ fontWeight: 600, fontSize: '0.85rem' }}
                                    secondaryTypographyProps={{ fontSize: '0.7rem' }}
                                />
                                <IconButton size="small" onClick={() => handleDeleteServer(server)} color="error">
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </ListItem>
                        ))}
                        {serverList.length === 0 && (
                            <Typography variant="caption" color="text.secondary" sx={{ p: 2, display: 'block', textAlign: 'center' }}>
                                Aucun serveur
                            </Typography>
                        )}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSettingsOpen(false)}>Fermer</Button>
                </DialogActions>
            </Dialog>

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
// COMPOSANTS SECONDAIRES COMPACTS
// ===============================================
const ConnectedTechniciansWidget = memo(() => {
    const { cache } = useCache();
    const technicians = useMemo(() => cache.technicians || [], [cache.technicians]);

    return (
        <Paper elevation={1} sx={{ p: 1.25, height: '100%', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PeopleIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
                    <Typography variant="caption" fontWeight={600}>Techniciens</Typography>
                </Box>
                <Chip size="small" label={technicians.length} color="secondary" sx={{ height: 18, fontSize: '0.65rem' }} />
            </Box>
            <List dense disablePadding sx={{ maxHeight: 100, overflowY: 'auto' }}>
                {technicians.length > 0 ? technicians.map(tech => (
                    <ListItem key={tech.id} disableGutters sx={{ py: 0.25 }}>
                        <ListItemAvatar sx={{ minWidth: 28 }}>
                            <Avatar sx={{ width: 22, height: 22, fontSize: '0.65rem', bgcolor: 'secondary.main' }}>
                                {tech.name?.charAt(0) || '?'}
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={<Typography variant="caption" sx={{ fontSize: '0.7rem' }}>{tech.name}</Typography>}
                        />
                    </ListItem>
                )) : (
                    <Typography variant="caption" color="text.secondary" sx={{ py: 1, textAlign: 'center', display: 'block', fontSize: '0.7rem' }}>
                        Aucun connecte
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
        created: <AssignmentIcon sx={{ fontSize: 14, color: 'success.main' }} />,
        returned: <CheckCircleIcon sx={{ fontSize: 14, color: 'primary.main' }} />,
        extended: <TrendingUpIcon sx={{ fontSize: 14, color: 'info.main' }} />,
        cancelled: <CancelIcon sx={{ fontSize: 14, color: 'error.main' }} />
    }[e] || <HistoryIcon sx={{ fontSize: 14 }} />);

    const getLabel = (t) => ({ created: 'Pret', returned: 'Retour', extended: 'Prolong.', cancelled: 'Annul.' }[t] || 'Action');

    return (
        <Paper elevation={1} sx={{ p: 1.25, height: '100%', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
                <HistoryIcon sx={{ fontSize: 16, color: 'info.main' }} />
                <Typography variant="caption" fontWeight={600}>Activite Recente</Typography>
            </Box>
            <List dense disablePadding sx={{ maxHeight: 100, overflowY: 'auto' }}>
                {activities.length > 0 ? activities.slice(0, 5).map(act => (
                    <ListItem key={act.id} disableGutters sx={{ py: 0.25 }}>
                        <ListItemAvatar sx={{ minWidth: 22 }}>{getActivityIcon(act.eventType)}</ListItemAvatar>
                        <ListItemText
                            primary={
                                <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                                    <strong>{getLabel(act.eventType)}</strong> {act.computerName || 'N/A'}
                                </Typography>
                            }
                        />
                    </ListItem>
                )) : (
                    <Typography variant="caption" color="text.secondary" sx={{ py: 1, textAlign: 'center', display: 'block', fontSize: '0.7rem' }}>
                        Aucune activite
                    </Typography>
                )}
            </List>
        </Paper>
    );
});

const OverdueLoansWidget = memo(({ loans, onClick }) => {
    return (
        <Paper elevation={1} sx={{ p: 1.25, height: '100%', borderRadius: 2, borderLeft: loans.length > 0 ? '3px solid' : 'none', borderColor: 'error.main' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <WarningIcon sx={{ fontSize: 16, color: loans.length > 0 ? 'error.main' : 'text.secondary' }} />
                    <Typography variant="caption" fontWeight={600} color={loans.length > 0 ? 'error.main' : 'text.primary'}>
                        Retards
                    </Typography>
                </Box>
                <Chip
                    size="small"
                    label={loans.length}
                    color={loans.length > 0 ? 'error' : 'default'}
                    sx={{ height: 18, fontSize: '0.65rem' }}
                />
            </Box>
            <List dense disablePadding sx={{ maxHeight: 100, overflowY: 'auto' }}>
                {loans.length > 0 ? loans.slice(0, 5).map(l => (
                    <ListItem key={l.id} disableGutters sx={{ py: 0.25, cursor: 'pointer' }} onClick={onClick}>
                        <ListItemText
                            primary={
                                <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                                    <strong>{l.computerName}</strong>
                                </Typography>
                            }
                            secondary={
                                <Typography variant="caption" color="error" sx={{ fontSize: '0.65rem' }}>
                                    {l.userDisplayName} - {new Date(l.expectedReturnDate).toLocaleDateString('fr-FR')}
                                </Typography>
                            }
                        />
                    </ListItem>
                )) : (
                    <Typography variant="caption" color="text.secondary" sx={{ py: 1, textAlign: 'center', display: 'block', fontSize: '0.7rem' }}>
                        Aucun retard
                    </Typography>
                )}
            </List>
        </Paper>
    );
});

// ===============================================
// MINI STAT CARD MODERNE ET ATTRAYANT
// ===============================================
const MiniStatCard = memo(({ title, value, subtitle, icon: Icon, color, onClick }) => (
    <Paper
        elevation={2}
        onClick={onClick}
        sx={{
            p: 2.5,
            borderRadius: 3,
            cursor: onClick ? 'pointer' : 'default',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            background: `linear-gradient(135deg, ${color === 'primary' ? '#667eea 0%, #764ba2 100%' :
                color === 'info' ? '#4facfe 0%, #00f2fe 100%' :
                color === 'error' ? '#f093fb 0%, #f5576c 100%' :
                '#43e97b 0%, #38f9d7 100%'})`,
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            '&:hover': onClick ? {
                transform: 'translateY(-8px) scale(1.02)',
                boxShadow: 8,
                '&::before': {
                    opacity: 1
                }
            } : {},
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
                opacity: 0,
                transition: 'opacity 0.3s'
            }
        }}
    >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
            <Box>
                <Typography variant="h3" fontWeight={800} sx={{ textShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>
                    {value}
                </Typography>
                <Typography variant="body1" fontWeight={700} sx={{ mt: 0.5, opacity: 0.95 }}>
                    {title}
                </Typography>
                {subtitle && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.85 }}>
                        {subtitle}
                    </Typography>
                )}
            </Box>
            <Avatar sx={{
                bgcolor: 'rgba(255, 255, 255, 0.25)',
                width: 64,
                height: 64,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
                <Icon sx={{ fontSize: 36, color: 'white' }} />
            </Avatar>
        </Box>
    </Paper>
));

// ===============================================
// COMPOSANT PRINCIPAL DASHBOARD COMPACT
// ===============================================
const DashboardPage = ({ onAnalyzeServer }) => {
    const navigate = useNavigate();
    const { cache, isLoading } = useCache();

    const { loans = [], computers = [], loan_history = [] } = cache;

    const { overdueLoans, stats } = useMemo(() => {
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
        return { overdueLoans: overdue, stats: statistics };
    }, [loans, computers, loan_history]);

    if (isLoading) {
        return <LoadingScreen type="dashboard" />;
    }

    return (
        <Box sx={{ p: { xs: 1, sm: 2 }, maxHeight: '100vh', overflow: 'auto' }}>
            {/* Header moderne avec gradient */}
            <Box sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                p: 3,
                borderRadius: 3,
                color: 'white',
                mb: 3,
                boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'radial-gradient(circle at top right, rgba(255,255,255,0.1) 0%, transparent 60%)',
                }
            }}>
                <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <DashboardIcon sx={{ fontSize: 48, opacity: 0.9 }} />
                    <Box>
                        <Typography variant="h4" fontWeight={800} sx={{ textShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>
                            Tableau de Bord RDS
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                            Supervision complète et gestion des ressources
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Stats modernes avec gradients */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                    <MiniStatCard
                        title="Materiel"
                        value={stats.computers.total}
                        subtitle={`${stats.computers.available} dispo`}
                        icon={LaptopChromebookIcon}
                        color="primary"
                        onClick={() => navigate('/loans', { state: { initialTab: 1 } })}
                    />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <MiniStatCard
                        title="Prets Actifs"
                        value={stats.loans.active}
                        subtitle={`${stats.loans.reserved} reserves`}
                        icon={AssignmentIcon}
                        color="info"
                        onClick={() => navigate('/loans', { state: { initialTab: 0 } })}
                    />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <MiniStatCard
                        title="En Retard"
                        value={stats.loans.overdue + stats.loans.critical}
                        subtitle={`${stats.loans.critical} critiques`}
                        icon={ErrorOutlineIcon}
                        color="error"
                        onClick={() => navigate('/loans', { state: { initialTab: 0, preFilter: 'overdue' } })}
                    />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <MiniStatCard
                        title="Historique"
                        value={stats.history.totalLoans}
                        icon={HistoryIcon}
                        color="secondary"
                        onClick={() => navigate('/loans', { state: { initialTab: 3 } })}
                    />
                </Grid>
            </Grid>

            {/* Supervision Serveurs RDS */}
            <ServerMonitoringSection />

            {/* Section secondaire compacte */}
            <Grid container spacing={1}>
                <Grid item xs={12} sm={4}>
                    <ConnectedTechniciansWidget />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <RecentActivityWidget />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <OverdueLoansWidget
                        loans={overdueLoans}
                        onClick={() => navigate('/loans', { state: { initialTab: 0, preFilter: 'overdue' } })}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

export default DashboardPage;
