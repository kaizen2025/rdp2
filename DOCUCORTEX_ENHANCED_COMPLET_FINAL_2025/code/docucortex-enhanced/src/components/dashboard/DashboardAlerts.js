// src/components/dashboard/DashboardAlerts.js - DASHBOARD DES ALERTES DOCUCORTEX
// Vue d'ensemble des alertes avec métriques de risque et actions en masse

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    Card,
    CardContent,
    Grid,
    Chip,
    IconButton,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Divider,
    LinearProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Checkbox,
    FormControlLabel,
    Tooltip,
    Badge,
    Avatar,
    LinearProgress as LinearProgressMUI
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Warning as WarningIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    Notifications as NotificationsIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Person as PersonIcon,
    Description as DocumentIcon,
    Schedule as ScheduleIcon,
    NotificationsActive as NotificationsActiveIcon,
    Refresh as RefreshIcon,
    Settings as SettingsIcon,
    Group as GroupIcon,
    FilterList as FilterIcon,
    ClearAll as ClearAllIcon,
    Send as SendIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { format, differenceInDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// Import des services
import alertsService, { ALERT_LEVELS, ALERT_TYPES } from '../../services/alertsService';

// 📊 COMPOSANT DE MÉTRIQUE INDIVIDUELLE
const MetricCard = React.memo(({ 
    title, 
    value, 
    subtitle, 
    color = 'primary', 
    icon, 
    trend, 
    trendValue,
    loading = false 
}) => {
    return (
        <Card 
            sx={{ 
                position: 'relative',
                overflow: 'visible',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    transition: 'transform 0.2s'
                }
            }}
        >
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography color="text.secondary" gutterBottom variant="body2">
                            {title}
                        </Typography>
                        <Typography variant="h4" component="div" color={`${color}.main`}>
                            {loading ? (
                                <LinearProgressMUI sx={{ width: 60, mt: 1 }} />
                            ) : (
                                value
                            )}
                        </Typography>
                        {subtitle && (
                            <Typography variant="body2" color="text.secondary">
                                {subtitle}
                            </Typography>
                        )}
                        
                        {/* Indicateur de tendance */}
                        {trend && trendValue !== undefined && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                {trend === 'up' ? (
                                    <TrendingUpIcon 
                                        sx={{ color: 'success.main', mr: 0.5 }} 
                                        fontSize="small" 
                                    />
                                ) : (
                                    <TrendingDownIcon 
                                        sx={{ color: 'error.main', mr: 0.5 }} 
                                        fontSize="small" 
                                    />
                                )}
                                <Typography 
                                    variant="caption" 
                                    color={trend === 'up' ? 'success.main' : 'error.main'}
                                >
                                    {trendValue > 0 ? '+' : ''}{trendValue}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                    
                    <Avatar 
                        sx={{ 
                            bgcolor: `${color}.main`,
                            width: 56,
                            height: 56
                        }}
                    >
                        {icon}
                    </Avatar>
                </Box>
            </CardContent>
        </Card>
    );
});

// 🎯 ÉLÉMENT D'ALERTE POUR LE DASHBOARD
const AlertItem = React.memo(({ 
    alert, 
    selected, 
    onSelect, 
    onAction,
    showCheckbox = false 
}) => {
    const levelConfig = useMemo(() => {
        return Object.values(ALERT_LEVELS).find(l => l.level === alert.priority) || ALERT_LEVELS.LOW;
    }, [alert.priority]);

    const getDaysUntilReturn = useCallback(() => {
        if (!alert.returnDate) return 'N/A';
        const today = new Date();
        const returnDate = parseISO(alert.returnDate);
        const days = differenceInDays(returnDate, today);
        
        if (days < 0) {
            return `En retard de ${Math.abs(days)} jour${Math.abs(days) > 1 ? 's' : ''}`;
        } else if (days === 0) {
            return 'Expires aujourd\'hui';
        } else {
            return `Dans ${days} jour${days > 1 ? 's' : ''}`;
        }
    }, [alert.returnDate]);

    return (
        <ListItem
            sx={{
                py: 1.5,
                borderLeft: 4,
                borderLeftColor: `${levelConfig.color}.main`,
                backgroundColor: selected ? 'action.selected' : 'transparent',
                cursor: 'pointer'
            }}
            onClick={() => !showCheckbox && onAction('view', alert.loanId)}
        >
            {showCheckbox && (
                <Checkbox
                    checked={selected}
                    onChange={(e) => onSelect(alert.loanId, e.target.checked)}
                    sx={{ mr: 1 }}
                />
            )}
            
            <ListItemText
                primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DocumentIcon fontSize="small" color="action.active" />
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {alert.documentTitle || 'Document inconnu'}
                        </Typography>
                        <Chip
                            label={levelConfig.label}
                            size="small"
                            color={levelConfig.color}
                            variant="outlined"
                        />
                    </Box>
                }
                secondary={
                    <Box sx={{ mt: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <PersonIcon fontSize="small" color="action.active" />
                                <Typography variant="caption">
                                    {alert.borrowerName || 'Utilisateur inconnu'}
                                </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <ScheduleIcon fontSize="small" color="action.active" />
                                <Typography variant="caption">
                                    {getDaysUntilReturn()}
                                </Typography>
                            </Box>
                        </Box>
                        
                        <Typography variant="caption" color="text.secondary">
                            {format(parseISO(alert.timestamp), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                        </Typography>
                    </Box>
                }
            />

            <ListItemSecondaryAction>
                <IconButton
                    edge="end"
                    onClick={() => onAction('manage', alert.loanId)}
                    size="small"
                >
                    <NotificationsActiveIcon fontSize="small" />
                </IconButton>
            </ListItemSecondaryAction>
        </ListItem>
    );
});

// 📈 GRAPHIQUE DE RÉPARTITION DES ALERTES (Version simple avec Chips)
const AlertDistributionChart = React.memo(({ statistics }) => {
    const data = [
        { label: 'Critiques', value: statistics.byLevel.critical, color: 'error', level: 4 },
        { label: 'Élevées', value: statistics.byLevel.high, color: 'warning', level: 3 },
        { label: 'Moyennes', value: statistics.byLevel.medium, color: 'info', level: 2 },
        { label: 'Faibles', value: statistics.byLevel.low, color: 'success', level: 1 }
    ];

    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Répartition par Niveau
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {data.map((item) => {
                        const percentage = total > 0 ? (item.value / total) * 100 : 0;
                        
                        return (
                            <Box key={item.level}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="body2">
                                        <Chip
                                            label={item.label}
                                            size="small"
                                            color={item.color}
                                            variant="outlined"
                                            sx={{ mr: 1 }}
                                        />
                                        {item.value} alerte{item.value > 1 ? 's' : ''}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {percentage.toFixed(1)}%
                                    </Typography>
                                </Box>
                                
                                <LinearProgress
                                    variant="determinate"
                                    value={percentage}
                                    color={item.color}
                                    sx={{ 
                                        height: 8, 
                                        borderRadius: 4,
                                        '& .MuiLinearProgress-bar': {
                                            borderRadius: 4
                                        }
                                    }}
                                />
                            </Box>
                        );
                    })}
                </Box>

                {total === 0 && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        Aucune alerte active
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
});

// 🎛️ DIALOG D'ACTIONS EN MASSE
const BulkActionsDialog = React.memo(({ 
    open, 
    onClose, 
    selectedAlerts, 
    onExecuteAction 
}) => {
    const [action, setAction] = useState('');
    const [includeRead, setIncludeRead] = useState(false);

    const handleExecute = () => {
        if (action && selectedAlerts.length > 0) {
            onExecuteAction(action, selectedAlerts);
            onClose();
        }
    };

    const getActionDescription = (actionType) => {
        switch (actionType) {
            case 'mark_read':
                return `Marquer ${selectedAlerts.length} alerte${selectedAlerts.length > 1 ? 's' : ''} comme lue${selectedAlerts.length > 1 ? 's' : ''}`;
            case 'send_reminder':
                return `Envoyer un rappel à ${selectedAlerts.length} emprunteur${selectedAlerts.length > 1 ? 's' : ''}`;
            case 'extend_loans':
                return `Prolonger ${selectedAlerts.length} prêt${selectedAlerts.length > 1 ? 's' : ''}`;
            case 'delete_alerts':
                return `Supprimer ${selectedAlerts.length} alerte${selectedAlerts.length > 1 ? 's' : ''}`;
            default:
                return '';
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                Actions en Masse
            </DialogTitle>
            
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Typography variant="body1">
                        {selectedAlerts.length} alerte{selectedAlerts.length > 1 ? 's' : ''} sélectionnée{selectedAlerts.length > 1 ? 's' : ''}
                    </Typography>

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={includeRead}
                                onChange={(e) => setIncludeRead(e.target.checked)}
                            />
                        }
                        label="Inclure les alertes déjà lues"
                    />

                    <Box>
                        <Typography variant="subtitle2" gutterBottom>
                            Action à effectuer
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Button
                                variant={action === 'mark_read' ? 'contained' : 'outlined'}
                                onClick={() => setAction('mark_read')}
                                startIcon={<InfoIcon />}
                                fullWidth
                            >
                                Marquer comme lu
                            </Button>
                            
                            <Button
                                variant={action === 'send_reminder' ? 'contained' : 'outlined'}
                                onClick={() => setAction('send_reminder')}
                                startIcon={<SendIcon />}
                                fullWidth
                            >
                                Envoyer un rappel
                            </Button>
                            
                            <Button
                                variant={action === 'extend_loans' ? 'contained' : 'outlined'}
                                onClick={() => setAction('extend_loans')}
                                startIcon={<ScheduleIcon />}
                                fullWidth
                            >
                                Prolonger les prêts
                            </Button>
                            
                            <Button
                                variant={action === 'delete_alerts' ? 'contained' : 'outlined'}
                                onClick={() => setAction('delete_alerts')}
                                startIcon={<ClearAllIcon />}
                                fullWidth
                                color="error"
                            >
                                Supprimer les alertes
                            </Button>
                        </Box>
                    </Box>

                    {action && (
                        <Alert severity="info">
                            {getActionDescription(action)}
                        </Alert>
                    )}
                </Box>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Annuler</Button>
                <Button 
                    onClick={handleExecute}
                    variant="contained"
                    disabled={!action || selectedAlerts.length === 0}
                >
                    Exécuter
                </Button>
            </DialogActions>
        </Dialog>
    );
});

// 📊 DASHBOARD PRINCIPAL DES ALERTES
const DashboardAlerts = ({
    loans = [],
    onLoanAction = () => {},
    refreshInterval = 300000 // 5 minutes par défaut
}) => {
    // États locaux
    const [statistics, setStatistics] = useState({
        total: 0,
        unread: 0,
        urgent: 0,
        last24h: 0,
        byLevel: { low: 0, medium: 0, high: 0, critical: 0 },
        byType: { overdue: 0, critical: 0, upcoming48h: 0, upcoming24h: 0 }
    });
    const [alerts, setAlerts] = useState([]);
    const [selectedAlerts, setSelectedAlerts] = useState(new Set());
    const [filterLevel, setFilterLevel] = useState(null);
    const [expandedSections, setExpandedSections] = useState({
        overview: true,
        critical: true,
        recent: true
    });
    const [bulkActionsOpen, setBulkActionsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Chargement et actualisation des données
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const stats = alertsService.getAlertStatistics();
            const notifications = alertsService.getStoredNotifications();
            setStatistics(stats);
            setAlerts(notifications);
        } catch (error) {
            console.error('Erreur lors du chargement des données d\'alertes:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
        
        // Actualisation automatique
        const interval = setInterval(loadData, refreshInterval);
        return () => clearInterval(interval);
    }, [loadData, refreshInterval]);

    // Écouteurs d'événements
    useEffect(() => {
        const handleNewAlert = () => loadData();
        const handleAlertUpdate = () => loadData();

        window.addEventListener('docucortex-new-alert', handleNewAlert);
        window.addEventListener('docucortex-alert-read', handleAlertUpdate);
        window.addEventListener('docucortex-alert-deleted', handleAlertUpdate);

        return () => {
            window.removeEventListener('docucortex-new-alert', handleNewAlert);
            window.removeEventListener('docucortex-alert-read', handleAlertUpdate);
            window.removeEventListener('docucortex-alert-deleted', handleAlertUpdate);
        };
    }, [loadData]);

    // Calcul des prêts par niveau de risque
    const loanRiskAnalysis = useMemo(() => {
        const analysis = {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            overdue: 0
        };

        loans.forEach(loan => {
            const alertStatus = alertsService.calculateAlertStatus(loan);
            if (alertStatus) {
                if (alertStatus.isOverdue) {
                    analysis.overdue++;
                } else if (alertStatus.priority === 4) {
                    analysis.critical++;
                } else if (alertStatus.priority === 3) {
                    analysis.high++;
                } else if (alertStatus.priority === 2) {
                    analysis.medium++;
                } else {
                    analysis.low++;
                }
            }
        });

        return analysis;
    }, [loans]);

    // Alertes filtrées
    const filteredAlerts = useMemo(() => {
        if (!filterLevel) return alerts;
        return alerts.filter(alert => alert.priority === filterLevel.level);
    }, [alerts, filterLevel]);

    // Gestionnaires d'événements
    const handleAlertSelect = useCallback((alertId, selected) => {
        setSelectedAlerts(prev => {
            const newSet = new Set(prev);
            if (selected) {
                newSet.add(alertId);
            } else {
                newSet.delete(alertId);
            }
            return newSet;
        });
    }, []);

    const handleSelectAll = useCallback(() => {
        if (selectedAlerts.size === filteredAlerts.length) {
            setSelectedAlerts(new Set());
        } else {
            setSelectedAlerts(new Set(filteredAlerts.map(alert => alert.loanId)));
        }
    }, [selectedAlerts.size, filteredAlerts]);

    const handleAction = useCallback((action, loanId) => {
        switch (action) {
            case 'view':
            case 'manage':
                onLoanAction(action, loanId);
                break;
            default:
                console.log('Action non gérée:', action, loanId);
        }
    }, [onLoanAction]);

    const handleBulkAction = useCallback((action, alertIds) => {
        console.log('Exécution action en masse:', action, alertIds);
        
        switch (action) {
            case 'mark_read':
                alertIds.forEach(id => alertsService.markAsRead(id));
                break;
            case 'delete_alerts':
                alertIds.forEach(id => alertsService.deleteNotification(id));
                break;
            case 'send_reminder':
                // TODO: Implémenter l'envoi de rappel en masse
                console.log('Rappels envoyés pour:', alertIds);
                break;
            case 'extend_loans':
                // TODO: Implémenter la prolongation en masse
                console.log('Prêts prolongés pour:', alertIds);
                break;
        }
        
        setSelectedAlerts(new Set());
        loadData();
    }, [loadData]);

    const toggleSection = useCallback((section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    }, []);

    // Actions rapides disponibles
    const quickActions = [
        {
            label: 'Actualiser',
            icon: <RefreshIcon />,
            action: loadData,
            color: 'primary'
        },
        {
            label: 'Tout sélectionner',
            icon: <GroupIcon />,
            action: handleSelectAll,
            color: 'secondary',
            disabled: filteredAlerts.length === 0
        },
        {
            label: 'Actions en masse',
            icon: <SettingsIcon />,
            action: () => setBulkActionsOpen(true),
            color: 'warning',
            disabled: selectedAlerts.size === 0
        }
    ];

    return (
        <Box sx={{ p: 3 }}>
            {/* En-tête */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <DashboardIcon color="primary" sx={{ fontSize: 32 }} />
                <Typography variant="h4">
                    Dashboard des Alertes
                </Typography>
                <Badge 
                    badgeContent={statistics.unread} 
                    color="error"
                    sx={{ ml: 'auto' }}
                >
                    <NotificationsIcon />
                </Badge>
            </Box>

            {/* Métriques principales */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Total Alertes"
                        value={statistics.total}
                        subtitle="Toutes confondues"
                        color="primary"
                        icon={<NotificationsIcon />}
                        loading={loading}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Non Lues"
                        value={statistics.unread}
                        subtitle="Requierrent attention"
                        color="warning"
                        icon={<ErrorIcon />}
                        loading={loading}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Urgentes"
                        value={statistics.urgent}
                        subtitle="24h dernières"
                        color="error"
                        icon={<NotificationsActiveIcon />}
                        loading={loading}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="En Retard"
                        value={loanRiskAnalysis.overdue}
                        subtitle="Prêts échus"
                        color="error"
                        icon={<WarningIcon />}
                        loading={loading}
                    />
                </Grid>
            </Grid>

            {/* Actions rapides */}
            <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                {quickActions.map((action, index) => (
                    <Button
                        key={index}
                        variant="outlined"
                        startIcon={action.icon}
                        onClick={action.action}
                        color={action.color}
                        disabled={action.disabled}
                        size="small"
                    >
                        {action.label}
                        {action.label === 'Actions en masse' && selectedAlerts.size > 0 && (
                            <Chip 
                                label={selectedAlerts.size} 
                                size="small" 
                                color="primary" 
                                sx={{ ml: 1 }} 
                            />
                        )}
                    </Button>
                ))}
            </Box>

            {/* Graphique de répartition */}
            <AlertDistributionChart statistics={statistics} />

            {/* Alertes critiques (collapsible) */}
            <Card sx={{ mt: 3 }}>
                <CardContent>
                    <Box 
                        sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            cursor: 'pointer',
                            mb: 2
                        }}
                        onClick={() => toggleSection('critical')}
                    >
                        <Typography variant="h6" sx={{ flex: 1 }}>
                            Alertes Critiques ({filteredAlerts.filter(a => a.priority >= 3).length})
                        </Typography>
                        <IconButton size="small">
                            {expandedSections.critical ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                    </Box>

                    {expandedSections.critical && (
                        <Box>
                            {/* Filtres */}
                            <Box sx={{ display: 'flex', gap: 0.5, mb: 2, flexWrap: 'wrap' }}>
                                <Chip
                                    label="Toutes"
                                    size="small"
                                    variant={!filterLevel ? 'filled' : 'outlined'}
                                    onClick={() => setFilterLevel(null)}
                                />
                                {Object.values(ALERT_LEVELS).filter(level => level.level >= 3).map(level => (
                                    <Chip
                                        key={level.level}
                                        label={level.label}
                                        size="small"
                                        color={level.color}
                                        variant={filterLevel?.level === level.level ? 'filled' : 'outlined'}
                                        onClick={() => setFilterLevel(level)}
                                    />
                                ))}
                            </Box>

                            {/* Liste des alertes critiques */}
                            {filteredAlerts.filter(a => a.priority >= 3).length === 0 ? (
                                <Alert severity="info">
                                    Aucune alerte critique active
                                </Alert>
                            ) : (
                                <List>
                                    {filteredAlerts
                                        .filter(a => a.priority >= 3)
                                        .map(alert => (
                                            <AlertItem
                                                key={alert.id}
                                                alert={alert}
                                                selected={selectedAlerts.has(alert.loanId)}
                                                onSelect={handleAlertSelect}
                                                onAction={handleAction}
                                                showCheckbox={selectedAlerts.size > 0}
                                            />
                                        ))
                                    }
                                </List>
                            )}
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Alertes récentes */}
            <Card sx={{ mt: 3 }}>
                <CardContent>
                    <Box 
                        sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            cursor: 'pointer',
                            mb: 2
                        }}
                        onClick={() => toggleSection('recent')}
                    >
                        <Typography variant="h6" sx={{ flex: 1 }}>
                            Alertes Récentes ({filteredAlerts.length})
                        </Typography>
                        <IconButton size="small">
                            {expandedSections.recent ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                    </Box>

                    {expandedSections.recent && (
                        <Box>
                            {filteredAlerts.length === 0 ? (
                                <Alert severity="info">
                                    {alerts.length === 0 
                                        ? 'Aucune alerte récente'
                                        : 'Aucune alerte ne correspond au filtre sélectionné'
                                    }
                                </Alert>
                            ) : (
                                <List>
                                    {filteredAlerts.map(alert => (
                                        <AlertItem
                                            key={alert.id}
                                            alert={alert}
                                            selected={selectedAlerts.has(alert.loanId)}
                                            onSelect={handleAlertSelect}
                                            onAction={handleAction}
                                            showCheckbox={selectedAlerts.size > 0}
                                        />
                                    ))}
                                </List>
                            )}
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Dialog d'actions en masse */}
            <BulkActionsDialog
                open={bulkActionsOpen}
                onClose={() => setBulkActionsOpen(false)}
                selectedAlerts={Array.from(selectedAlerts)}
                onExecuteAction={handleBulkAction}
            />
        </Box>
    );
};

export default React.memo(DashboardAlerts);