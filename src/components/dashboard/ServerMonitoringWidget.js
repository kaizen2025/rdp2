// src/components/dashboard/ServerMonitoringWidget.js - Widget de monitoring RDS amélioré

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
    Box, Paper, Typography, Grid, LinearProgress, Chip, IconButton, Tooltip,
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
    List, ListItem, ListItemText, ListItemSecondaryAction, Divider, Alert
} from '@mui/material';
import {
    Dns as DnsIcon,
    Refresh as RefreshIcon,
    Settings as SettingsIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Memory as MemoryIcon,
    Storage as StorageIcon,
    Speed as SpeedIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import apiService from '../../services/apiService';

const ServerCard = memo(({ server, thresholds }) => {
    const getCpuColor = (percent) => {
        if (!percent) return 'default';
        if (percent < 70) return 'success';
        if (percent < thresholds.cpuPercent) return 'warning';
        return 'error';
    };

    const getMemoryColor = (percent) => {
        if (!percent) return 'default';
        if (percent < 70) return 'success';
        if (percent < thresholds.memoryPercent) return 'warning';
        return 'error';
    };

    const getDiskColor = (freeGB) => {
        if (!freeGB) return 'default';
        if (freeGB > thresholds.diskSpaceGB * 2) return 'success';
        if (freeGB > thresholds.diskSpaceGB) return 'warning';
        return 'error';
    };

    if (!server) return null;

    return (
        <Paper elevation={1} sx={{ p: 1.5, height: '100%', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: '0.9rem' }}>
                    {server.ServerName || server.server}
                </Typography>
                <Chip
                    icon={<CheckCircleIcon />}
                    label="En ligne"
                    size="small"
                    color="success"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                />
            </Box>

            <Grid container spacing={1}>
                {/* CPU */}
                <Grid item xs={12} sm={4}>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                            <SpeedIcon sx={{ fontSize: 14, color: getCpuColor(server.CPU?.Percent) + '.main' }} />
                            <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                                CPU: {server.CPU?.Percent?.toFixed(1) || 0}%
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={server.CPU?.Percent || 0}
                            color={getCpuColor(server.CPU?.Percent)}
                            sx={{ height: 6, borderRadius: 3 }}
                        />
                    </Box>
                </Grid>

                {/* RAM */}
                <Grid item xs={12} sm={4}>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                            <MemoryIcon sx={{ fontSize: 14, color: getMemoryColor(server.Memory?.UsedPercent) + '.main' }} />
                            <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                                RAM: {server.Memory?.UsedPercent?.toFixed(1) || 0}%
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={server.Memory?.UsedPercent || 0}
                            color={getMemoryColor(server.Memory?.UsedPercent)}
                            sx={{ height: 6, borderRadius: 3 }}
                        />
                        <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                            {server.Memory?.UsedGB?.toFixed(1) || 0} / {server.Memory?.TotalGB?.toFixed(1) || 0} GB
                        </Typography>
                    </Box>
                </Grid>

                {/* Disque */}
                <Grid item xs={12} sm={4}>
                    <Box>
                        {server.Disks && server.Disks.length > 0 ? (
                            <>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                                    <StorageIcon sx={{ fontSize: 14, color: getDiskColor(server.Disks[0].FreeGB) + '.main' }} />
                                    <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                                        {server.Disks[0].Drive}: {server.Disks[0].FreeGB?.toFixed(1)} GB libre
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={server.Disks[0].UsedPercent || 0}
                                    color={getDiskColor(server.Disks[0].FreeGB)}
                                    sx={{ height: 6, borderRadius: 3 }}
                                />
                                <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                                    {server.Disks[0].UsedGB?.toFixed(1)} / {server.Disks[0].TotalGB?.toFixed(1)} GB
                                </Typography>
                            </>
                        ) : (
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                Aucune donnée disque
                            </Typography>
                        )}
                    </Box>
                </Grid>
            </Grid>

            {/* Alertes critiques */}
            {server.CPU?.Percent > thresholds.cpuPercent && (
                <Alert severity="error" sx={{ mt: 1, py: 0.3, fontSize: '0.7rem' }}>
                    ⚠️ CPU critique ({server.CPU.Percent.toFixed(1)}%)
                </Alert>
            )}
            {server.Memory?.UsedPercent > thresholds.memoryPercent && (
                <Alert severity="error" sx={{ mt: 1, py: 0.3, fontSize: '0.7rem' }}>
                    ⚠️ Mémoire critique ({server.Memory.UsedPercent.toFixed(1)}%)
                </Alert>
            )}
            {server.Disks?.some(d => d.FreeGB < thresholds.diskSpaceGB) && (
                <Alert severity="error" sx={{ mt: 1, py: 0.3, fontSize: '0.7rem' }}>
                    ⚠️ Espace disque critique
                </Alert>
            )}
        </Paper>
    );
});

const ServerMonitoringWidget = () => {
    const [serversStats, setServersStats] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [thresholds, setThresholds] = useState({
        diskSpaceGB: 5,
        cpuPercent: 90,
        memoryPercent: 85
    });
    const [serverList, setServerList] = useState([]);
    const [newServer, setNewServer] = useState('');

    const fetchStats = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:3001/api/rds/monitoring/stats/all');
            const data = await response.json();
            if (data.success) {
                setServersStats(data.servers || []);
            }
        } catch (error) {
            console.error('Erreur chargement stats:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchConfig = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:3001/api/rds/monitoring/config');
            const data = await response.json();
            if (data.success && data.config) {
                setThresholds(data.config.thresholds || thresholds);
            }

            // Charger la liste des serveurs depuis la config
            const config = await apiService.getConfig();
            setServerList(config.rds_servers || []);
        } catch (error) {
            console.error('Erreur chargement config:', error);
        }
    }, [thresholds]);

    useEffect(() => {
        fetchStats();
        fetchConfig();

        // Actualisation automatique toutes les 30s
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, [fetchStats, fetchConfig]);

    const handleRefresh = async () => {
        setIsLoading(true);
        await fetchStats();
    };

    const handleSaveThresholds = async () => {
        try {
            await fetch('http://localhost:3001/api/rds/monitoring/config/thresholds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(thresholds)
            });
            await fetchConfig();
            setSettingsOpen(false);
        } catch (error) {
            console.error('Erreur sauvegarde seuils:', error);
        }
    };

    const handleAddServer = async () => {
        if (!newServer.trim()) return;

        try {
            const updatedList = [...serverList, newServer.trim()];
            await apiService.updateConfig({ rds_servers: updatedList });
            setServerList(updatedList);
            setNewServer('');
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
        return serversStats.reduce((count, server) => {
            let alerts = 0;
            if (server.CPU?.Percent > thresholds.cpuPercent) alerts++;
            if (server.Memory?.UsedPercent > thresholds.memoryPercent) alerts++;
            if (server.Disks?.some(d => d.FreeGB < thresholds.diskSpaceGB)) alerts++;
            return count + alerts;
        }, 0);
    }, [serversStats, thresholds]);

    return (
        <>
            <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DnsIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                        <Typography variant="subtitle1" fontWeight={600}>
                            Statut Serveurs RDS en Temps Réel
                        </Typography>
                        <Chip
                            label={`${serversStats.length} serveur(s)`}
                            size="small"
                            color="primary"
                            sx={{ height: 22, fontSize: '0.7rem' }}
                        />
                        {alertCount > 0 && (
                            <Chip
                                icon={<WarningIcon />}
                                label={`${alertCount} alerte(s)`}
                                size="small"
                                color="error"
                                sx={{ height: 22, fontSize: '0.7rem' }}
                            />
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Configurer">
                            <IconButton size="small" onClick={() => setSettingsOpen(true)}>
                                <SettingsIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Actualiser">
                            <IconButton size="small" onClick={handleRefresh} disabled={isLoading}>
                                <RefreshIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {isLoading && serversStats.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                            Chargement des données...
                        </Typography>
                    </Box>
                ) : serversStats.length === 0 ? (
                    <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
                        Aucun serveur configuré. Utilisez le bouton de configuration pour ajouter des serveurs.
                    </Alert>
                ) : (
                    <Grid container spacing={1.5}>
                        {serversStats.map((server, idx) => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={idx}>
                                <ServerCard server={server} thresholds={thresholds} />
                            </Grid>
                        ))}
                    </Grid>
                )}

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'right', fontSize: '0.65rem' }}>
                    Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}
                </Typography>
            </Paper>

            {/* Dialog de configuration */}
            <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SettingsIcon />
                        Configuration du Monitoring
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                        Seuils d'Alerte
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Seuil CPU (%)"
                                type="number"
                                value={thresholds.cpuPercent}
                                onChange={(e) => setThresholds({ ...thresholds, cpuPercent: parseFloat(e.target.value) })}
                                helperText="Alerte si CPU > X%"
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Seuil Mémoire (%)"
                                type="number"
                                value={thresholds.memoryPercent}
                                onChange={(e) => setThresholds({ ...thresholds, memoryPercent: parseFloat(e.target.value) })}
                                helperText="Alerte si RAM > X%"
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Seuil Disque (GB)"
                                type="number"
                                value={thresholds.diskSpaceGB}
                                onChange={(e) => setThresholds({ ...thresholds, diskSpaceGB: parseFloat(e.target.value) })}
                                helperText="Alerte si libre < X GB"
                            />
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle2" gutterBottom>
                        Serveurs à Monitorer
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Nom du serveur (ex: SRV-RDS-5)"
                            value={newServer}
                            onChange={(e) => setNewServer(e.target.value)}
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

                    <List dense>
                        {serverList.map((server, idx) => (
                            <ListItem key={idx} divider>
                                <ListItemText
                                    primary={server}
                                    primaryTypographyProps={{ fontWeight: 500 }}
                                />
                                <ListItemSecondaryAction>
                                    <IconButton
                                        edge="end"
                                        size="small"
                                        onClick={() => handleDeleteServer(server)}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                        {serverList.length === 0 && (
                            <Typography variant="caption" color="text.secondary" sx={{ p: 2, display: 'block', textAlign: 'center' }}>
                                Aucun serveur configuré
                            </Typography>
                        )}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSettingsOpen(false)}>Annuler</Button>
                    <Button onClick={handleSaveThresholds} variant="contained">Enregistrer</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ServerMonitoringWidget;
