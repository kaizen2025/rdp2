// src/components/monitoring/RDSMonitoringDashboard.js - Dashboard monitoring RDS temps réel

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Paper, Typography, Grid, Card, CardContent, LinearProgress, Chip,
    IconButton, Tooltip, Alert, AlertTitle, List, ListItem, ListItemText,
    ListItemIcon, Divider, Button, TextField, Dialog, DialogTitle,
    DialogContent, DialogActions, CircularProgress
} from '@mui/material';
import {
    Computer as ComputerIcon,
    Memory as MemoryIcon,
    Storage as StorageIcon,
    Speed as SpeedIcon,
    Refresh as RefreshIcon,
    Settings as SettingsIcon,
    Warning as WarningIcon,
    Error as ErrorIcon,
    CheckCircle as CheckCircleIcon,
    TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

const RDSMonitoringDashboard = () => {
    const [serversStats, setServersStats] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [thresholds, setThresholds] = useState({
        diskSpaceGB: 5,
        cpuPercent: 90,
        memoryPercent: 85
    });

    // Charger les données initiales
    const loadData = useCallback(async () => {
        try {
            // Stats serveurs
            const statsRes = await fetch('http://localhost:3001/api/rds/monitoring/stats/all');
            const statsData = await statsRes.json();
            if (statsData.success) {
                setServersStats(statsData.servers);
            }

            // Alertes actives
            const alertsRes = await fetch('http://localhost:3001/api/rds/monitoring/alerts/active');
            const alertsData = await alertsRes.json();
            if (alertsData.success) {
                setAlerts(alertsData.alerts);
            }

            // Configuration
            const configRes = await fetch('http://localhost:3001/api/rds/monitoring/config');
            const configData = await configRes.json();
            if (configData.success) {
                setConfig(configData.config);
                setThresholds(configData.config.thresholds);
            }
        } catch (error) {
            console.error('Erreur chargement monitoring:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();

        // Actualisation automatique toutes les 30s
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, [loadData]);

    // Forcer refresh
    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await fetch('http://localhost:3001/api/rds/monitoring/check', { method: 'POST' });
            await loadData();
        } finally {
            setRefreshing(false);
        }
    };

    // Sauvegarder seuils
    const handleSaveThresholds = async () => {
        try {
            await fetch('http://localhost:3001/api/rds/monitoring/config/thresholds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(thresholds)
            });
            await loadData();
            setSettingsOpen(false);
        } catch (error) {
            console.error('Erreur sauvegarde seuils:', error);
        }
    };

    // Obtenir couleur selon pourcentage
    const getColorByPercent = (percent, isReverse = false) => {
        if (isReverse) {
            // Pour espace disque libre (vert = beaucoup libre)
            if (percent > 50) return 'success';
            if (percent > 20) return 'warning';
            return 'error';
        }
        // Pour CPU/RAM (vert = peu utilisé)
        if (percent < 70) return 'success';
        if (percent < 85) return 'warning';
        return 'error';
    };

    // Obtenir icône selon sévérité
    const getSeverityIcon = (severity) => {
        switch (severity) {
            case 'critical':
                return <ErrorIcon color="error" />;
            case 'warning':
                return <WarningIcon color="warning" />;
            default:
                return <CheckCircleIcon color="success" />;
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" gutterBottom>
                        🖥️ Monitoring Serveurs RDS
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Surveillance en temps réel - Mise à jour toutes les 60s
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Paramètres">
                        <IconButton onClick={() => setSettingsOpen(true)} color="primary">
                            <SettingsIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Actualiser maintenant">
                        <IconButton onClick={handleRefresh} disabled={refreshing} color="primary">
                            {refreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Alertes critiques */}
            {alerts.filter(a => a.alerts.some(al => al.severity === 'critical')).length > 0 && (
                <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 3 }}>
                    <AlertTitle>🚨 Alertes Critiques</AlertTitle>
                    <List dense>
                        {alerts.filter(a => a.alerts.some(al => al.severity === 'critical')).map((alert, idx) => (
                            <ListItem key={idx} disablePadding>
                                <ListItemText
                                    primary={`${alert.serverName}: ${alert.alerts.filter(a => a.severity === 'critical').map(a => a.message).join(', ')}`}
                                    secondary={new Date(alert.timestamp).toLocaleString('fr-FR')}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Alert>
            )}

            {/* Stats globales */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="h4" color="primary">{serversStats.length}</Typography>
                                    <Typography variant="body2" color="text.secondary">Serveurs surveillés</Typography>
                                </Box>
                                <ComputerIcon sx={{ fontSize: 48, opacity: 0.3 }} color="primary" />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="h4" color="error">
                                        {alerts.filter(a => a.alerts.some(al => al.severity === 'critical')).length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">Alertes critiques</Typography>
                                </Box>
                                <ErrorIcon sx={{ fontSize: 48, opacity: 0.3 }} color="error" />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="h4" color="warning.main">
                                        {alerts.filter(a => a.alerts.some(al => al.severity === 'warning')).length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">Avertissements</Typography>
                                </Box>
                                <WarningIcon sx={{ fontSize: 48, opacity: 0.3 }} color="warning" />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="h4" color="success.main">
                                        {serversStats.reduce((sum, s) => sum + (s.Sessions?.Active || 0), 0)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">Sessions actives</Typography>
                                </Box>
                                <TrendingUpIcon sx={{ fontSize: 48, opacity: 0.3 }} color="success" />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Détails par serveur */}
            <Grid container spacing={3}>
                {serversStats.map((server, idx) => (
                    <Grid item xs={12} key={idx}>
                        <Paper elevation={3} sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                🖥️ {server.ServerName}
                                <Chip
                                    label={`${server.Sessions?.Active || 0} session(s)`}
                                    size="small"
                                    color="primary"
                                    sx={{ ml: 2 }}
                                />
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                                Dernière mise à jour: {new Date(server.Timestamp).toLocaleString('fr-FR')}
                            </Typography>

                            <Grid container spacing={2}>
                                {/* CPU */}
                                <Grid item xs={12} md={4}>
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <SpeedIcon sx={{ mr: 1 }} color={getColorByPercent(server.CPU?.Percent)} />
                                                <Typography variant="subtitle2">CPU</Typography>
                                            </Box>
                                            <Typography variant="h4" color={getColorByPercent(server.CPU?.Percent) + '.main'}>
                                                {server.CPU?.Percent?.toFixed(1)}%
                                            </Typography>
                                            <LinearProgress
                                                variant="determinate"
                                                value={server.CPU?.Percent || 0}
                                                color={getColorByPercent(server.CPU?.Percent)}
                                                sx={{ mt: 1, height: 8, borderRadius: 4 }}
                                            />
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* RAM */}
                                <Grid item xs={12} md={4}>
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <MemoryIcon sx={{ mr: 1 }} color={getColorByPercent(server.Memory?.UsedPercent)} />
                                                <Typography variant="subtitle2">Mémoire</Typography>
                                            </Box>
                                            <Typography variant="h4" color={getColorByPercent(server.Memory?.UsedPercent) + '.main'}>
                                                {server.Memory?.UsedPercent?.toFixed(1)}%
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {server.Memory?.UsedGB?.toFixed(1)} / {server.Memory?.TotalGB?.toFixed(1)} GB
                                            </Typography>
                                            <LinearProgress
                                                variant="determinate"
                                                value={server.Memory?.UsedPercent || 0}
                                                color={getColorByPercent(server.Memory?.UsedPercent)}
                                                sx={{ mt: 1, height: 8, borderRadius: 4 }}
                                            />
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Disques */}
                                <Grid item xs={12} md={4}>
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <StorageIcon sx={{ mr: 1 }} />
                                                <Typography variant="subtitle2">Disques</Typography>
                                            </Box>
                                            {server.Disks?.map((disk, diskIdx) => {
                                                const freePercent = (disk.FreeGB / disk.TotalGB) * 100;
                                                return (
                                                    <Box key={diskIdx} sx={{ mb: diskIdx < server.Disks.length - 1 ? 2 : 0 }}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <Chip
                                                                label={disk.Drive}
                                                                size="small"
                                                                color={disk.FreeGB < thresholds.diskSpaceGB ? 'error' : 'default'}
                                                            />
                                                            <Typography
                                                                variant="body2"
                                                                fontWeight="bold"
                                                                color={disk.FreeGB < thresholds.diskSpaceGB ? 'error.main' : 'text.primary'}
                                                            >
                                                                {disk.FreeGB?.toFixed(1)} GB libre
                                                            </Typography>
                                                        </Box>
                                                        <Typography variant="caption" color="text.secondary" display="block">
                                                            {disk.UsedGB?.toFixed(1)} / {disk.TotalGB?.toFixed(1)} GB ({disk.UsedPercent?.toFixed(1)}%)
                                                        </Typography>
                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={disk.UsedPercent || 0}
                                                            color={getColorByPercent(freePercent, true)}
                                                            sx={{ mt: 0.5, height: 6, borderRadius: 3 }}
                                                        />
                                                        {disk.FreeGB < thresholds.diskSpaceGB && (
                                                            <Alert severity="error" sx={{ mt: 1 }}>
                                                                ⚠️ ESPACE CRITIQUE: Moins de {thresholds.diskSpaceGB} GB libre !
                                                            </Alert>
                                                        )}
                                                    </Box>
                                                );
                                            })}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {serversStats.length === 0 && (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <ComputerIcon sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        Aucune donnée de monitoring disponible
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Le monitoring se lancera automatiquement dans quelques instants
                    </Typography>
                    <Button variant="contained" onClick={handleRefresh} startIcon={<RefreshIcon />}>
                        Forcer une mise à jour
                    </Button>
                </Paper>
            )}

            {/* Dialog paramètres */}
            <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>⚙️ Configuration des Seuils d'Alerte</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <TextField
                            fullWidth
                            label="💾 Seuil Espace Disque (GB libre)"
                            type="number"
                            value={thresholds.diskSpaceGB}
                            onChange={(e) => setThresholds({ ...thresholds, diskSpaceGB: parseFloat(e.target.value) })}
                            helperText="Alerte si moins de X GB libres sur un disque"
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="⚡ Seuil CPU (%)"
                            type="number"
                            value={thresholds.cpuPercent}
                            onChange={(e) => setThresholds({ ...thresholds, cpuPercent: parseFloat(e.target.value) })}
                            helperText="Alerte si CPU > X%"
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="🧠 Seuil Mémoire (%)"
                            type="number"
                            value={thresholds.memoryPercent}
                            onChange={(e) => setThresholds({ ...thresholds, memoryPercent: parseFloat(e.target.value) })}
                            helperText="Alerte si RAM utilisée > X%"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSettingsOpen(false)}>Annuler</Button>
                    <Button onClick={handleSaveThresholds} variant="contained">Enregistrer</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default RDSMonitoringDashboard;
