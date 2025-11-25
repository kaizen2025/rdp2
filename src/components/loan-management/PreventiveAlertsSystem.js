// PreventiveAlertsSystem.js - Système d'alertes préventives avancées
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Snackbar,
    Alert,
    AlertTitle,
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Chip,
    Badge,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    LinearProgress,
    useTheme
} from '@mui/material';
import {
    Notifications,
    Warning,
    Error,
    Info,
    CheckCircle,
    Schedule,
    Person,
    Assignment,
    MarkEmailRead,
    Cancel,
    Settings,
    TrendingUp,
    AccessTime
} from '@mui/icons-material';

// Hook principal pour la gestion des alertes préventives
const usePreventiveAlerts = (loans = [], settings = {}) => {
    const [dismissedAlerts, setDismissedAlerts] = useState(new Set());
    
    const alertSettings = useMemo(() => ({
        criticalHours: settings.criticalHours || 24, // Alert après 24h de retard
        warningHours: settings.warningHours || 48,  // Alert 48h avant échéance
        escalationEnabled: settings.escalationEnabled !== false,
        emailNotifications: settings.emailNotifications !== false,
        autoExtend: settings.autoExtend || false
    }, [settings]);
    
    // Calculer les alertes actives
    const activeAlerts = useMemo(() => {
        const now = new Date();
        const alerts = [];
        
        loans.forEach(loan => {
            const returnDate = new Date(loan.returnDate);
            const loanDate = new Date(loan.loanDate);
            const hoursDiff = (now - returnDate) / (1000 * 60 * 60);
            const hoursUntilReturn = (returnDate - now) / (1000 * 60 * 60);
            
            // Retards critiques (> 24h)
            if (hoursDiff > alertSettings.criticalHours && loan.status === 'active') {
                alerts.push({
                    id: `critical-${loan.id}`,
                    type: 'critical',
                    level: 'error',
                    loan,
                    message: `Prêt en retard de ${Math.floor(hoursDiff)}h`,
                    action: 'Retour immédiat requis',
                    autoDismissible: false,
                    timestamp: now
                });
            }
            
            // Alertes de proximité (< 48h)
            if (hoursUntilReturn <= alertSettings.warningHours && hoursUntilReturn > 0 && loan.status === 'active') {
                alerts.push({
                    id: `warning-${loan.id}`,
                    type: 'warning',
                    level: 'warning',
                    loan,
                    message: `Retour dû dans ${Math.ceil(hoursUntilReturn)}h`,
                    action: 'Planifier le retour',
                    autoDismissible: true,
                    timestamp: now
                });
            }
            
            // Alertes d'information (7 jours avant)
            const daysUntilReturn = hoursUntilReturn / 24;
            if (daysUntilReturn <= 7 && daysUntilReturn > 2 && loan.status === 'active') {
                alerts.push({
                    id: `info-${loan.id}`,
                    type: 'info',
                    level: 'info',
                    loan,
                    message: `Retour prévu dans ${Math.floor(daysUntilReturn)} jours`,
                    action: 'Préparation',
                    autoDismissible: true,
                    timestamp: now
                });
            }
            
            // Alertes de confirmation de prêt (> 2h sans confirmation)
            const confirmationHours = (now - loanDate) / (1000 * 60 * 60);
            if (confirmationHours > 2 && loan.status === 'pending') {
                alerts.push({
                    id: `pending-${loan.id}`,
                    type: 'pending',
                    level: 'warning',
                    loan,
                    message: `Prêt en attente de confirmation depuis ${Math.floor(confirmationHours)}h`,
                    action: 'Confirmer le prêt',
                    autoDismissible: false,
                    timestamp: now
                });
            }
        });
        
        return alerts.filter(alert => !dismissedAlerts.has(alert.id));
    }, [loans, alertSettings, dismissedAlerts]);
    
    // Statistiques des alertes
    const alertStats = useMemo(() => {
        const stats = {
            critical: activeAlerts.filter(a => a.type === 'critical').length,
            warning: activeAlerts.filter(a => a.type === 'warning').length,
            info: activeAlerts.filter(a => a.type === 'info').length,
            pending: activeAlerts.filter(a => a.type === 'pending').length,
            total: activeAlerts.length
        };
        return stats;
    }, [activeAlerts]);
    
    // Fonctions utilitaires
    const dismissAlert = useCallback((alertId) => {
        setDismissedAlerts(prev => new Set([...prev, alertId]));
    }, []);
    
    const clearAllAlerts = useCallback(() => {
        setDismissedAlerts(new Set(activeAlerts.map(a => a.id)));
    }, [activeAlerts]);
    
    return {
        activeAlerts,
        alertStats,
        alertSettings,
        dismissAlert,
        clearAllAlerts
    };
};

// Composant principal d'alertes
const PreventiveAlertsSystem = ({ loans = [], settings = {}, onLoanAction }) => {
    const theme = useTheme();
    const [snackbar, setSnackbar] = useState(null);
    const [detailDialog, setDetailDialog] = useState(null);
    
    const {
        activeAlerts,
        alertStats,
        alertSettings,
        dismissAlert,
        clearAllAlerts
    } = usePreventiveAlerts(loans, settings);
    
    // Notifications automatiques
    useEffect(() => {
        if (alertStats.critical > 0) {
            setSnackbar({
                severity: 'error',
                title: 'Alertes critiques',
                message: `${alertStats.critical} prêt(s) en retard critique`,
                autoHide: false
            });
        } else if (alertStats.warning > 0) {
            setSnackbar({
                severity: 'warning',
                title: 'Alertes de proximité',
                message: `${alertStats.warning} prêt(s) dus bientôt`,
                autoHide: true,
                duration: 6000
            });
        }
    }, [alertStats.critical, alertStats.warning]);
    
    const handleAlertClick = (alert) => {
        setDetailDialog(alert);
    };
    
    const handleDismiss = (alertId) => {
        dismissAlert(alertId);
        if (snackbar) setSnackbar(null);
    };
    
    return (
        <Box>
            {/* Indicateur d'alertes dans la barre d'outils */}
            <Tooltip title={`${alertStats.total} alerte(s) active(s)`}>
                <Badge 
                    badgeContent={alertStats.total} 
                    color={alertStats.critical > 0 ? 'error' : 'warning'}
                    max={99}
                >
                    <Notifications color="action" />
                </Badge>
            </Tooltip>
            
            {/* Snackbar pour notifications */}
            {snackbar && (
                <Snackbar
                    open={true}
                    autoHideDuration={snackbar.duration}
                    onClose={() => setSnackbar(null)}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    <Alert 
                        severity={snackbar.severity} 
                        onClose={() => setSnackbar(null)}
                        variant="filled"
                    >
                        {snackbar.title && <AlertTitle>{snackbar.title}</AlertTitle>}
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            )}
            
            {/* Dialogue de détail d'alerte */}
            <Dialog 
                open={!!detailDialog} 
                onClose={() => setDetailDialog(null)}
                maxWidth="sm"
                fullWidth
            >
                {detailDialog && (
                    <>
                        <DialogTitle>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Error color={detailDialog.level === 'error' ? 'error' : 'warning'} />
                                Alerte {detailDialog.type}
                            </Box>
                        </DialogTitle>
                        <DialogContent>
                            <AlertDetailView 
                                alert={detailDialog} 
                                onLoanAction={onLoanAction}
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setDetailDialog(null)}>
                                Fermer
                            </Button>
                            <Button 
                                variant="contained" 
                                onClick={() => {
                                    onLoanAction?.(detailDialog.loan, detailDialog.type);
                                    setDetailDialog(null);
                                }}
                            >
                                {detailDialog.action}
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
};

// Composant pour afficher le détail d'une alerte
const AlertDetailView = ({ alert, onLoanAction }) => {
    const { loan } = alert;
    const daysOverdue = Math.floor((new Date() - new Date(loan.returnDate)) / (1000 * 60 * 60 * 24));
    
    return (
        <Box>
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Détails du prêt
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        <strong>Équipement:</strong> {loan.equipmentName} ({loan.equipmentType})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        <strong>Utilisateur:</strong> {loan.userDisplayName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        <strong>Date de prêt:</strong> {new Date(loan.loanDate).toLocaleDateString('fr-FR')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        <strong>Date de retour prévue:</strong> {new Date(loan.returnDate).toLocaleDateString('fr-FR')}
                    </Typography>
                    {daysOverdue > 0 && (
                        <Typography variant="body2" color="error">
                            <strong>Retard:</strong> {daysOverdue} jour{daysOverdue > 1 ? 's' : ''}
                        </Typography>
                    )}
                </CardContent>
            </Card>
            
            <Typography variant="body1" sx={{ mb: 2 }}>
                {alert.message}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip 
                    label={alert.action} 
                    color={alert.level === 'error' ? 'error' : 'warning'}
                    variant="outlined"
                />
            </Box>
        </Box>
    );
};

export default PreventiveAlertsSystem;
export { usePreventiveAlerts };