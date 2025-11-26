// src/components/alerts/AlertSystem.js - SYSTÈME D'ALERTES INTELLIGENT DOCUCORTEX
// Composant principal pour la gestion des alertes préventives

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
    Badge,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Switch,
    FormControlLabel,
    Divider,
    LinearProgress,
    Alert,
    Snackbar,
    Card,
    CardContent,
    Grid,
    Switch as SwitchMUI
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    Warning as WarningIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    Close as CloseIcon,
    Settings as SettingsIcon,
    History as HistoryIcon,
    Delete as DeleteIcon,
    MarkEmailRead as MarkEmailReadIcon,
    Refresh as RefreshIcon,
    FilterList as FilterIcon,
    ClearAll as ClearAllIcon,
    NotificationsActive as NotificationsActiveIcon,
    Schedule as ScheduleIcon,
    Person as PersonIcon,
    Description as DocumentIcon
} from '@mui/icons-material';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// Import du service d'alertes
import alertsService, { ALERT_LEVELS, ALERT_TYPES } from '../../services/alertsService';

// 🎨 COMPOSANT D'INDICATEUR D'ALERTE CONDENSÉ
const AlertIndicator = React.memo(({ level, count, onClick }) => {
    if (!level || count === 0) return null;

    const getIcon = () => {
        switch (level.level) {
            case 1: return <InfoIcon fontSize="small" />;
            case 2: return <WarningIcon fontSize="small" />;
            case 3: return <ErrorIcon fontSize="small" />;
            case 4: return <NotificationsActiveIcon fontSize="small" />;
            default: return <InfoIcon fontSize="small" />;
        }
    };

    const getColor = () => {
        switch (level.level) {
            case 1: return 'info';
            case 2: return 'warning';
            case 3: return 'error';
            case 4: return 'error';
            default: return 'default';
        }
    };

    return (
        <Tooltip title={`${count} alerte${count > 1 ? 's' : ''} - ${level.label}`}>
            <IconButton
                color={getColor()}
                onClick={onClick}
                size="small"
                sx={{ 
                    animation: level.level >= 3 ? 'pulse 2s infinite' : 'none',
                    '@keyframes pulse': {
                        '0%': { transform: 'scale(1)' },
                        '50%': { transform: 'scale(1.1)' },
                        '100%': { transform: 'scale(1)' }
                    }
                }}
            >
                <Badge badgeContent={count} color={getColor()} max={99}>
                    {getIcon()}
                </Badge>
            </IconButton>
        </Tooltip>
    );
});

// 🎯 ÉLÉMENT DE NOTIFICATION INDIVIDUEL
const NotificationItem = React.memo(({ 
    notification, 
    onMarkAsRead, 
    onDelete, 
    onActionClick 
}) => {
    const [anchorEl, setAnchorEl] = useState(null);
    
    const handleMenuOpen = (event) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleAction = (action) => {
        handleMenuClose();
        onActionClick(notification, action);
    };

    const getLevelConfig = useCallback(() => {
        return Object.values(ALERT_LEVELS).find(l => l.level === notification.priority) || ALERT_LEVELS.LOW;
    }, [notification.priority]);

    const levelConfig = getLevelConfig();

    return (
        <ListItem
            sx={{
                py: 1.5,
                px: 2,
                borderLeft: 4,
                borderLeftColor: `${levelConfig.color}.main`,
                backgroundColor: notification.read ? 'transparent' : 'action.hover',
                cursor: 'pointer',
                '&:hover': {
                    backgroundColor: 'action.selected'
                }
            }}
            onClick={() => onMarkAsRead(notification.id)}
        >
            <ListItemIcon>
                <Box
                    sx={{
                        p: 0.5,
                        borderRadius: '50%',
                        backgroundColor: `${levelConfig.color}.light`,
                        color: `${levelConfig.color}.main`
                    }}
                >
                    {React.createElement(levelConfig.icon === 'critical' ? NotificationsActiveIcon : levelConfig.icon, { fontSize: 'small' })}
                </Box>
            </ListItemIcon>

            <ListItemText
                primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                            variant="body2"
                            sx={{
                                fontWeight: notification.read ? 'normal' : 'bold',
                                flex: 1
                            }}
                            noWrap
                        >
                            {notification.title}
                        </Typography>
                        {!notification.read && (
                            <Chip
                                label="Nouveau"
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ height: 20 }}
                            />
                        )}
                    </Box>
                }
                secondary={
                    <Box sx={{ mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                            {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {formatDistanceToNow(parseISO(notification.timestamp), { addSuffix: true, locale: fr })}
                        </Typography>
                    </Box>
                }
            />

            <ListItemSecondaryAction>
                <IconButton
                    edge="end"
                    size="small"
                    onClick={handleMenuOpen}
                >
                    <SettingsIcon fontSize="small" />
                </IconButton>

                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                >
                    <MenuItem onClick={() => handleAction('view')}>
                        <ListItemIcon><InfoIcon fontSize="small" /></ListItemIcon>
                        Voir les détails
                    </MenuItem>
                    
                    {notification.actions?.map((action) => (
                        <MenuItem 
                            key={action.action}
                            onClick={() => handleAction(action.action)}
                        >
                            <ListItemIcon>
                                {action.icon === 'schedule' && <ScheduleIcon fontSize="small" />}
                                {action.icon === 'notifications_active' && <NotificationsActiveIcon fontSize="small" />}
                                {action.icon === 'visibility' && <InfoIcon fontSize="small" />}
                            </ListItemIcon>
                            {action.label}
                        </MenuItem>
                    ))}
                    
                    <Divider />
                    
                    <MenuItem onClick={() => onMarkAsRead(notification.id)}>
                        <ListItemIcon><MarkEmailReadIcon fontSize="small" /></ListItemIcon>
                        Marquer comme lu
                    </MenuItem>
                    
                    <MenuItem 
                        onClick={() => {
                            onDelete(notification.id);
                            handleMenuClose();
                        }}
                        sx={{ color: 'error.main' }}
                    >
                        <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                        Supprimer
                    </MenuItem>
                </Menu>
            </ListItemSecondaryAction>
        </ListItem>
    );
});

// ⚙️ MODAL DE PRÉFÉRENCES D'ALERTES
const AlertPreferencesDialog = React.memo(({ 
    open, 
    onClose, 
    preferences, 
    onPreferencesChange 
}) => {
    const [localPreferences, setLocalPreferences] = useState(preferences);

    useEffect(() => {
        setLocalPreferences(preferences);
    }, [preferences]);

    const handleSave = () => {
        onPreferencesChange(localPreferences);
        onClose();
    };

    const handleToggle = (key) => (event) => {
        setLocalPreferences(prev => ({
            ...prev,
            [key]: event.target.checked
        }));
    };

    const handleThresholdChange = (key) => (event) => {
        const value = parseInt(event.target.value, 10);
        setLocalPreferences(prev => ({
            ...prev,
            [key]: value
        }));
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SettingsIcon />
                    Préférences d'Alertes
                </Box>
            </DialogTitle>
            
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                    {/* Notifications navigateur */}
                    <FormControlLabel
                        control={
                            <SwitchMUI
                                checked={localPreferences.enableBrowserNotifications}
                                onChange={handleToggle('enableBrowserNotifications')}
                            />
                        }
                        label="Notifications navigateur"
                        subtitle="Permettre les notifications du système"
                    />

                    {/* Notifications in-app */}
                    <FormControlLabel
                        control={
                            <SwitchMUI
                                checked={localPreferences.enableInAppNotifications}
                                onChange={handleToggle('enableInAppNotifications')}
                            />
                        }
                        label="Notifications in-app"
                        subtitle="Afficher les notifications dans l'application"
                    />

                    {/* Notifications email */}
                    <FormControlLabel
                        control={
                            <SwitchMUI
                                checked={localPreferences.enableEmailNotifications}
                                onChange={handleToggle('enableEmailNotifications')}
                            />
                        }
                        label="Notifications email"
                        subtitle="Recevoir les alertes par email"
                    />

                    <Divider />

                    {/* Seuil critique */}
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>
                            Seuil critique (jours)
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Nombre de jours avant expiration pour déclencher l'alerte critique
                        </Typography>
                        <input
                            type="number"
                            min="1"
                            max="30"
                            value={localPreferences.criticalThreshold}
                            onChange={handleThresholdChange('criticalThreshold')}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                fontSize: '14px'
                            }}
                        />
                    </Box>

                    {/* Seuil d'avertissement */}
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>
                            Seuil d'avertissement (jours)
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Nombre de jours avant expiration pour déclencher l'avertissement
                        </Typography>
                        <input
                            type="number"
                            min="1"
                            max="60"
                            value={localPreferences.warningThreshold}
                            onChange={handleThresholdChange('warningThreshold')}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                fontSize: '14px'
                            }}
                        />
                    </Box>

                    <Alert severity="info">
                        Les alertes seront envoyées automatiquement 48h et 24h avant l'expiration des prêts.
                    </Alert>
                </Box>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Annuler</Button>
                <Button onClick={handleSave} variant="contained">Sauvegarder</Button>
            </DialogActions>
        </Dialog>
    );
});

// 📊 MODAL D'HISTORIQUE DES ALERTES
const AlertHistoryDialog = React.memo(({ open, onClose }) => {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (open) {
            setHistory(alertsService.getNotificationHistory());
        }
    }, [open]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HistoryIcon />
                    Historique des Alertes
                </Box>
            </DialogTitle>
            
            <DialogContent>
                {history.length === 0 ? (
                    <Alert severity="info">Aucun historique d'alertes disponible.</Alert>
                ) : (
                    <List>
                        {history.map((item) => (
                            <ListItem key={item.id}>
                                <ListItemText
                                    primary={item.message}
                                    secondary={
                                        <Box>
                                            <Typography variant="caption" display="block">
                                                {format(parseISO(item.timestamp), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                                            </Typography>
                                            <Typography variant="caption">
                                                Niveau: {Object.values(ALERT_LEVELS).find(l => l.level === item.alertLevel)?.label}
                                                {' • '}Type: {item.alertType}
                                                {' • '}Via: {item.deliveredVia.join(', ')}
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Fermer</Button>
            </DialogActions>
        </Dialog>
    );
});

// 🔔 COMPOSANT PRINCIPAL ALERTSYSTEM
const AlertSystem = ({
    loans = [],
    onLoanAction = () => {},
    embedded = false,
    showStatistics = true
}) => {
    // États locaux
    const [notifications, setNotifications] = useState([]);
    const [preferences, setPreferences] = useState(alertsService.getUserPreferences());
    const [anchorEl, setAnchorEl] = useState(null);
    const [preferencesOpen, setPreferencesOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [filterLevel, setFilterLevel] = useState(null);

    // Chargement initial des données
    useEffect(() => {
        setNotifications(alertsService.getStoredNotifications());
        setPreferences(alertsService.getUserPreferences());
    }, []);

    // Écouteurs d'événements
    useEffect(() => {
        const handleNewAlert = (event) => {
            setNotifications(prev => [event.detail, ...prev]);
        };

        const handleAlertRead = () => {
            setNotifications(alertsService.getStoredNotifications());
        };

        const handleAlertDeleted = () => {
            setNotifications(alertsService.getStoredNotifications());
        };

        const handleLoanAction = (event) => {
            const { action, loanId } = event.detail;
            onLoanAction(action, loanId);
        };

        window.addEventListener('docucortex-new-alert', handleNewAlert);
        window.addEventListener('docucortex-alert-read', handleAlertRead);
        window.addEventListener('docucortex-alert-deleted', handleAlertDeleted);
        window.addEventListener('docucortex-loan-action', handleLoanAction);

        return () => {
            window.removeEventListener('docucortex-new-alert', handleNewAlert);
            window.removeEventListener('docucortex-alert-read', handleAlertRead);
            window.removeEventListener('docucortex-alert-deleted', handleAlertDeleted);
            window.removeEventListener('docucortex-loan-action', handleLoanAction);
        };
    }, [onLoanAction]);

    // Statistiques calculées
    const statistics = useMemo(() => {
        const stats = alertsService.getAlertStatistics();
        const unreadNotifications = notifications.filter(n => !n.read);
        
        // Trouver le niveau d'alerte le plus critique non lu
        const highestUnreadLevel = unreadNotifications.reduce((max, notification) => {
            return notification.priority > max ? notification.priority : max;
        }, 1);

        return {
            ...stats,
            unreadCount: unreadNotifications.length,
            highestUnreadLevel: Object.values(ALERT_LEVELS).find(l => l.level === highestUnreadLevel) || ALERT_LEVELS.LOW
        };
    }, [notifications]);

    // Notifications filtrées
    const filteredNotifications = useMemo(() => {
        if (!filterLevel) return notifications;
        return notifications.filter(n => n.priority === filterLevel.level);
    }, [notifications, filterLevel]);

    // Gestionnaires d'événements
    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleMarkAsRead = useCallback((notificationId) => {
        alertsService.markAsRead(notificationId);
        setSnackbarMessage('Notification marquée comme lue');
        setSnackbarOpen(true);
    }, []);

    const handleDeleteNotification = useCallback((notificationId) => {
        alertsService.deleteNotification(notificationId);
        setSnackbarMessage('Notification supprimée');
        setSnackbarOpen(true);
    }, []);

    const handleActionClick = useCallback((notification, action) => {
        switch (action) {
            case 'view':
                onLoanAction('view', notification.loanId);
                break;
            case 'extend':
                onLoanAction('extend', notification.loanId);
                break;
            case 'recall':
            case 'remind':
                onLoanAction('recall', notification.loanId);
                break;
            default:
                console.log('Action non gérée:', action);
        }
        
        // Marquer comme lu automatiquement pour les actions
        alertsService.markAsRead(notification.id);
        handleMarkAsRead(notification.id);
    }, [onLoanAction, handleMarkAsRead]);

    const handlePreferencesChange = useCallback((newPreferences) => {
        const updated = alertsService.updateUserPreferences(newPreferences);
        setPreferences(updated);
        setSnackbarMessage('Préférences mises à jour');
        setSnackbarOpen(true);
    }, []);

    const handleClearAll = useCallback(() => {
        notifications.forEach(n => alertsService.markAsRead(n.id));
        setSnackbarMessage('Toutes les notifications ont été marquées comme lues');
        setSnackbarOpen(true);
        handleMenuClose();
    }, [notifications]);

    const handleRefresh = useCallback(() => {
        alertsService.processLoansForAlerts(loans);
        setSnackbarMessage('Alertes actualisées');
        setSnackbarOpen(true);
        handleMenuClose();
    }, [loans]);

    // Menu principal
    const menuOpen = Boolean(anchorEl);

    if (embedded) {
        return (
            <Box sx={{ p: 2 }}>
                {/* Indicateurs d'alertes en mode intégré */}
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <AlertIndicator
                        level={statistics.highestUnreadLevel}
                        count={statistics.unreadCount}
                        onClick={handleMenuOpen}
                    />
                    
                    <Tooltip title="Préférences">
                        <IconButton size="small" onClick={() => setPreferencesOpen(true)}>
                            <SettingsIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Historique">
                        <IconButton size="small" onClick={() => setHistoryOpen(true)}>
                            <HistoryIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>

                {/* Menu dropdown */}
                <Menu
                    anchorEl={anchorEl}
                    open={menuOpen}
                    onClose={handleMenuClose}
                    PaperProps={{
                        sx: { 
                            width: 400,
                            maxHeight: 500
                        }
                    }}
                >
                    {/* En-tête avec statistiques */}
                    <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                        <Typography variant="h6" gutterBottom>
                            Alertes DocuCortex
                        </Typography>
                        
                        <Grid container spacing={1}>
                            <Grid item xs={4}>
                                <Card variant="outlined" sx={{ textAlign: 'center', py: 1 }}>
                                    <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                                        <Typography variant="h6" color="primary">
                                            {statistics.total}
                                        </Typography>
                                        <Typography variant="caption">Total</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            
                            <Grid item xs={4}>
                                <Card variant="outlined" sx={{ textAlign: 'center', py: 1 }}>
                                    <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                                        <Typography variant="h6" color="warning.main">
                                            {statistics.unread}
                                        </Typography>
                                        <Typography variant="caption">Non lues</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            
                            <Grid item xs={4}>
                                <Card variant="outlined" sx={{ textAlign: 'center', py: 1 }}>
                                    <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                                        <Typography variant="h6" color="error.main">
                                            {statistics.urgent}
                                        </Typography>
                                        <Typography variant="caption">Urgentes</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        {/* Filtres */}
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                            <Chip
                                label="Toutes"
                                size="small"
                                variant={!filterLevel ? 'filled' : 'outlined'}
                                onClick={() => setFilterLevel(null)}
                            />
                            {Object.values(ALERT_LEVELS).map(level => (
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
                    </Box>

                    {/* Actions */}
                    <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
                        <Grid container spacing={1}>
                            <Grid item xs={6}>
                                <Button
                                    fullWidth
                                    size="small"
                                    startIcon={<ClearAllIcon />}
                                    onClick={handleClearAll}
                                >
                                    Tout marquer lu
                                </Button>
                            </Grid>
                            
                            <Grid item xs={6}>
                                <Button
                                    fullWidth
                                    size="small"
                                    startIcon={<RefreshIcon />}
                                    onClick={handleRefresh}
                                >
                                    Actualiser
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Liste des notifications */}
                    <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                        {filteredNotifications.length === 0 ? (
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                    {notifications.length === 0 
                                        ? 'Aucune alerte active'
                                        : 'Aucune alerte pour ce filtre'
                                    }
                                </Typography>
                            </Box>
                        ) : (
                            filteredNotifications.map(notification => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    onMarkAsRead={handleMarkAsRead}
                                    onDelete={handleDeleteNotification}
                                    onActionClick={handleActionClick}
                                />
                            ))
                        )}
                    </Box>
                </Menu>

                {/* Dialogs */}
                <AlertPreferencesDialog
                    open={preferencesOpen}
                    onClose={() => setPreferencesOpen(false)}
                    preferences={preferences}
                    onPreferencesChange={handlePreferencesChange}
                />

                <AlertHistoryDialog
                    open={historyOpen}
                    onClose={() => setHistoryOpen(false)}
                />

                {/* Snackbar */}
                <Snackbar
                    open={snackbarOpen}
                    autoHideDuration={3000}
                    onClose={() => setSnackbarOpen(false)}
                    message={snackbarMessage}
                />
            </Box>
        );
    }

    // Version autonome du composant
    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <NotificationsIcon color="primary" />
                <Typography variant="h5">
                    Système d'Alertes Préventives
                </Typography>
            </Box>

            {showStatistics && (
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" color="primary">
                                    {statistics.total}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Total Alertes
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" color="warning.main">
                                    {statistics.unread}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Non Lues
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" color="error.main">
                                    {statistics.urgent}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Urgentes
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" color="success.main">
                                    {statistics.last24h}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Dernières 24h
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Configuration et actions */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Button
                    variant="outlined"
                    startIcon={<SettingsIcon />}
                    onClick={() => setPreferencesOpen(true)}
                >
                    Préférences
                </Button>

                <Button
                    variant="outlined"
                    startIcon={<HistoryIcon />}
                    onClick={() => setHistoryOpen(true)}
                >
                    Historique
                </Button>

                <Button
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={() => alertsService.processLoansForAlerts(loans)}
                >
                    Actualiser Alertes
                </Button>
            </Box>

            {/* Liste des alertes actives */}
            <Typography variant="h6" gutterBottom>
                Alertes Actives ({filteredNotifications.length})
            </Typography>

            {filteredNotifications.length === 0 ? (
                <Alert severity="info">
                    {notifications.length === 0 
                        ? 'Aucune alerte active. Les alertes apparaîtront automatiquement quand les prêts approcheront de l\'expiration.'
                        : 'Aucune alerte ne correspond au filtre sélectionné.'
                    }
                </Alert>
            ) : (
                <List>
                    {filteredNotifications.map(notification => (
                        <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onMarkAsRead={handleMarkAsRead}
                            onDelete={handleDeleteNotification}
                            onActionClick={handleActionClick}
                        />
                    ))}
                </List>
            )}

            {/* Dialogs */}
            <AlertPreferencesDialog
                open={preferencesOpen}
                onClose={() => setPreferencesOpen(false)}
                preferences={preferences}
                onPreferencesChange={handlePreferencesChange}
            />

            <AlertHistoryDialog
                open={historyOpen}
                onClose={() => setHistoryOpen(false)}
            />

            {/* Snackbar */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() => setSnackbarOpen(false)}
                message={snackbarMessage}
            />
        </Paper>
    );
};

export default React.memo(AlertSystem);