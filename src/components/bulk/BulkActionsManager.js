// src/components/bulk/BulkActionsManager.js
// Gestionnaire principal d'actions groupées avec validation intelligente et interface améliorée

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box,
    Paper,
    Toolbar,
    Typography,
    Button,
    IconButton,
    Tooltip,
    Chip,
    Stack,
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    InputAdornment,
    Menu,
    Divider,
    LinearProgress,
    Fab,
    useMediaQuery,
    useTheme
} from '@mui/material';
import {
    SelectAll as SelectAllIcon,
    Clear as ClearIcon,
    Extension as ExtensionIcon,
    Email as EmailIcon,
    SwapHoriz as TransferIcon,
    Flag as StatusIcon,
    Download as ExportIcon,
    Timeline as HistoryIcon,
    MoreVert as MoreIcon,
    CheckCircle as SuccessIcon,
    Error as ErrorIcon,
    Schedule as PendingIcon,
    ArrowBack as BackIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Settings as SettingsIcon
} from '@mui/icons-material';

// Import des composants spécialisés
import BulkActionsEngine from './BulkActionsEngine';
import BulkSelectionBar from './BulkSelectionBar';
import BulkActionDialog from './BulkActionDialog';
import BulkProgressIndicator from './BulkProgressIndicator';
import BulkErrorHandler from './BulkErrorHandler';
import BulkActionHistory from './BulkActionHistory';

// Services
import alertsService from '../../services/alertsService';

const BULK_ACTIONS = {
    EXTEND: {
        id: 'extend',
        label: 'Prolonger',
        icon: <ExtensionIcon />,
        color: 'primary',
        description: 'Prolonger la date de retour de plusieurs prêts',
        requiresParameters: true,
        parameterSchema: {
            days: { type: 'number', label: 'Nombre de jours', min: 1, max: 365, required: true }
        }
    },
    RECALL: {
        id: 'recall',
        label: 'Rappeler',
        icon: <EmailIcon />,
        color: 'warning',
        description: 'Envoyer un rappel par email aux emprunteurs',
        requiresParameters: false,
        parameterSchema: {
            message: { type: 'text', label: 'Message personnalisé', required: false }
        }
    },
    TRANSFER: {
        id: 'transfer',
        label: 'Transférer',
        icon: <TransferIcon />,
        color: 'info',
        description: 'Transférer les prêts vers un autre utilisateur',
        requiresParameters: true,
        parameterSchema: {
            targetUser: { type: 'user', label: 'Utilisateur cible', required: true },
            reason: { type: 'text', label: 'Motif de transfert', required: false }
        }
    },
    STATUS_CHANGE: {
        id: 'status_change',
        label: 'Changer statut',
        icon: <StatusIcon />,
        color: 'secondary',
        description: 'Changer le statut de plusieurs prêts',
        requiresParameters: true,
        parameterSchema: {
            newStatus: { 
                type: 'select', 
                label: 'Nouveau statut', 
                options: [
                    { value: 'active', label: 'Actif' },
                    { value: 'reserved', label: 'Réservé' },
                    { value: 'overdue', label: 'En retard' },
                    { value: 'returned', label: 'Retourné' }
                ],
                required: true 
            },
            reason: { type: 'text', label: 'Motif de changement', required: false }
        }
    },
    EXPORT: {
        id: 'export',
        label: 'Exporter',
        icon: <ExportIcon />,
        color: 'success',
        description: 'Exporter les données des prêts sélectionnés',
        requiresParameters: true,
        parameterSchema: {
            format: { 
                type: 'select', 
                label: 'Format d\'export', 
                options: [
                    { value: 'csv', label: 'CSV' },
                    { value: 'excel', label: 'Excel' },
                    { value: 'json', label: 'JSON' },
                    { value: 'pdf', label: 'PDF' }
                ],
                required: true 
            },
            fields: { 
                type: 'multiselect', 
                label: 'Champs à inclure', 
                options: [
                    { value: 'id', label: 'ID Prêt' },
                    { value: 'documentTitle', label: 'Document' },
                    { value: 'borrowerName', label: 'Emprunteur' },
                    { value: 'loanDate', label: 'Date d\'emprunt' },
                    { value: 'returnDate', label: 'Date de retour' },
                    { value: 'status', label: 'Statut' }
                ],
                required: true 
            }
        }
    },
    DELETE: {
        id: 'delete',
        label: 'Supprimer',
        icon: <DeleteIcon />,
        color: 'error',
        description: 'Supprimer définitivement les prêts sélectionnés',
        requiresParameters: true,
        parameterSchema: {
            confirmation: { type: 'checkbox', label: 'Je confirme la suppression définitive', required: true }
        },
        dangerous: true
    }
};

const BulkActionsManager = ({
    loans = [],
    selectedLoans = new Set(),
    onSelectionChange,
    onLoansUpdate,
    getUserColor = (id) => `hsl(${Math.abs(hashCode(id)) % 360}, 70%, 50%)`,
    maxBulkActions = 100,
    currentUser = { id: 'current-user', role: 'admin' },
    className
}) => {
    // États principaux
    const [localSelectedLoans, setLocalSelectedLoans] = useState(new Set(selectedLoans));
    const [currentAction, setCurrentAction] = useState(null);
    const [actionParameters, setActionParameters] = useState({});
    const [validationErrors, setValidationErrors] = useState({});
    const [showActionDialog, setShowActionDialog] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingProgress, setProcessingProgress] = useState(0);
    const [processingStep, setProcessingStep] = useState('');
    const [notification, setNotification] = useState(null);
    const [errorDialog, setErrorDialog] = useState(null);
    
    // États pour les menus et filtres
    const [moreMenuAnchor, setMoreMenuAnchor] = useState(null);
    const [quickSelectFilter, setQuickSelectFilter] = useState('');

    // Hooks et thèmes
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Validation et permissions
    const canPerformAction = useCallback((actionId) => {
        if (!currentUser || !currentUser.role) return false;
        
        const action = BULK_ACTIONS[actionId];
        if (!action) return false;

        // Vérification des permissions par rôle
        const rolePermissions = {
            'admin': ['EXTEND', 'RECALL', 'TRANSFER', 'STATUS_CHANGE', 'EXPORT', 'DELETE'],
            'manager': ['EXTEND', 'RECALL', 'TRANSFER', 'STATUS_CHANGE', 'EXPORT'],
            'user': ['RECALL', 'EXPORT']
        };

        const allowedActions = rolePermissions[currentUser.role] || [];
        return allowedActions.includes(actionId);
    }, [currentUser]);

    // Validation des paramètres d'action
    const validateActionParameters = useCallback((actionId, parameters) => {
        const errors = {};
        const action = BULK_ACTIONS[actionId];
        
        if (!action || !action.requiresParameters) return errors;

        Object.entries(action.parameterSchema).forEach(([key, schema]) => {
            const value = parameters[key];
            
            // Vérification des champs requis
            if (schema.required && (!value || value === '' || (Array.isArray(value) && value.length === 0))) {
                errors[key] = `${schema.label} est requis`;
                return;
            }

            // Validation par type
            if (value) {
                switch (schema.type) {
                    case 'number':
                        if (typeof value !== 'number' || isNaN(value)) {
                            errors[key] = `${schema.label} doit être un nombre`;
                        } else if (schema.min !== undefined && value < schema.min) {
                            errors[key] = `${schema.label} doit être ≥ ${schema.min}`;
                        } else if (schema.max !== undefined && value > schema.max) {
                            errors[key] = `${schema.label} doit être ≤ ${schema.max}`;
                        }
                        break;
                    
                    case 'select':
                        if (!schema.options.find(option => option.value === value)) {
                            errors[key] = `Valeur invalide pour ${schema.label}`;
                        }
                        break;
                    
                    case 'multiselect':
                        if (!Array.isArray(value) || value.length === 0) {
                            errors[key] = `Sélectionnez au moins une option pour ${schema.label}`;
                        }
                        break;
                    
                    case 'checkbox':
                        if (!value) {
                            errors[key] = `Veuillez confirmer pour ${schema.label}`;
                        }
                        break;
                }
            }
        });

        return errors;
    }, []);

    // Validation de la sélection pour une action
    const validateSelectionForAction = useCallback((actionId, selectedLoanIds) => {
        const errors = [];
        const selectedLoansData = loans.filter(loan => selectedLoanIds.has(loan.id));
        
        if (selectedLoansData.length === 0) {
            errors.push('Aucun prêt sélectionné');
            return errors;
        }

        if (selectedLoansData.length > maxBulkActions) {
            errors.push(`Limite maximale de ${maxBulkActions} prêts dépassé`);
            return errors;
        }

        // Validation spécifique par type d'action
        switch (actionId) {
            case 'EXTEND':
                selectedLoansData.forEach(loan => {
                    if (loan.status === 'returned') {
                        errors.push(`Le prêt ${loan.id} est déjà retourné`);
                    }
                    if (loan.status === 'cancelled') {
                        errors.push(`Le prêt ${loan.id} est annulé`);
                    }
                });
                break;
            
            case 'TRANSFER':
                selectedLoansData.forEach(loan => {
                    if (loan.status === 'returned') {
                        errors.push(`Le prêt ${loan.id} est déjà retourné`);
                    }
                });
                break;
            
            case 'STATUS_CHANGE':
                selectedLoansData.forEach(loan => {
                    if (loan.status === 'cancelled') {
                        errors.push(`Le prêt ${loan.id} est annulé`);
                    }
                });
                break;
        }

        return errors;
    }, [loans, maxBulkActions]);

    // Gestion de la sélection
    const handleSelectionChange = useCallback((newSelection) => {
        setLocalSelectedLoans(new Set(newSelection));
        onSelectionChange?.(new Set(newSelection));
    }, [onSelectionChange]);

    const handleSelectAll = useCallback(() => {
        const newSelection = new Set(loans.map(loan => loan.id));
        handleSelectionChange(newSelection);
    }, [loans, handleSelectionChange]);

    const handleClearSelection = useCallback(() => {
        handleSelectionChange(new Set());
    }, [handleSelectionChange]);

    const handleQuickSelect = useCallback((filter) => {
        let newSelection = new Set();
        
        switch (filter) {
            case 'overdue':
                newSelection = new Set(
                    loans.filter(loan => {
                        const alertStatus = alertsService.calculateAlertStatus(loan);
                        return alertStatus?.isOverdue;
                    }).map(loan => loan.id)
                );
                break;
            
            case 'critical':
                newSelection = new Set(
                    loans.filter(loan => {
                        const alertStatus = alertsService.calculateAlertStatus(loan);
                        return alertStatus?.level?.level === 4;
                    }).map(loan => loan.id)
                );
                break;
            
            case 'due-today':
                newSelection = new Set(
                    loans.filter(loan => {
                        const alertStatus = alertsService.calculateAlertStatus(loan);
                        return alertStatus?.daysUntilReturn === 0;
                    }).map(loan => loan.id)
                );
                break;
            
            default:
                return;
        }
        
        handleSelectionChange(newSelection);
        setQuickSelectFilter(filter);
    }, [loans, handleSelectionChange, alertsService]);

    // Gestion des actions
    const handleActionClick = useCallback((actionId) => {
        if (!canPerformAction(actionId)) {
            setNotification({
                type: 'error',
                message: 'Vous n\'avez pas les permissions pour cette action'
            });
            return;
        }

        const selectionErrors = validateSelectionForAction(actionId, localSelectedLoans);
        if (selectionErrors.length > 0) {
            setNotification({
                type: 'error',
                message: selectionErrors.join(', ')
            });
            return;
        }

        setCurrentAction(BULK_ACTIONS[actionId]);
        setActionParameters({});
        setValidationErrors({});
        setShowActionDialog(true);
    }, [canPerformAction, localSelectedLoans, validateSelectionForAction]);

    const handleActionConfirm = useCallback(async () => {
        if (!currentAction) return;

        // Validation des paramètres
        const paramErrors = validateActionParameters(currentAction.id, actionParameters);
        if (Object.keys(paramErrors).length > 0) {
            setValidationErrors(paramErrors);
            return;
        }

        setShowActionDialog(false);
        setIsProcessing(true);
        setProcessingProgress(0);
        setProcessingStep('Initialisation...');

        try {
            const result = await BulkActionsEngine.executeBulkAction({
                actionId: currentAction.id,
                selectedLoans: Array.from(localSelectedLoans).map(id => loans.find(l => l.id === id)).filter(Boolean),
                parameters: actionParameters,
                currentUser,
                onProgress: (progress, step) => {
                    setProcessingProgress(progress);
                    setProcessingStep(step);
                }
            });

            // Mise à jour de la liste des prêts si nécessaire
            if (result.updatedLoans && onLoansUpdate) {
                onLoansUpdate(result.updatedLoans);
            }

            // Affichage du résultat
            setNotification({
                type: 'success',
                message: `${currentAction.label} terminé avec succès sur ${result.successful} prêts`,
                details: result
            });

        } catch (error) {
            setErrorDialog({
                title: 'Erreur lors de l\'action groupée',
                message: error.message,
                details: error,
                actionId: currentAction.id,
                failedLoans: error.failedLoans || []
            });
        } finally {
            setIsProcessing(false);
            setCurrentAction(null);
            setActionParameters({});
        }
    }, [currentAction, actionParameters, validateActionParameters, localSelectedLoans, loans, currentUser, onLoansUpdate]);

    // Gestion de l'historique
    const handleShowHistory = useCallback(() => {
        setShowHistory(true);
    }, []);

    // Notifications
    const handleCloseNotification = useCallback(() => {
        setNotification(null);
    }, []);

    const handleCloseErrorDialog = useCallback(() => {
        setErrorDialog(null);
    }, []);

    // Synchronisation avec les props
    useEffect(() => {
        setLocalSelectedLoans(new Set(selectedLoans));
    }, [selectedLoans]);

    // Calcul des statistiques de sélection
    const selectionStats = useMemo(() => {
        const selectedLoansData = loans.filter(loan => localSelectedLoans.has(loan.id));
        
        return {
            total: localSelectedLoans.size,
            active: selectedLoansData.filter(l => l.status === 'active').length,
            overdue: selectedLoansData.filter(l => {
                const alertStatus = alertsService.calculateAlertStatus(l);
                return alertStatus?.isOverdue;
            }).length,
            critical: selectedLoansData.filter(l => {
                const alertStatus = alertsService.calculateAlertStatus(l);
                return alertStatus?.level?.level === 4;
            }).length,
            dueToday: selectedLoansData.filter(l => {
                const alertStatus = alertsService.calculateAlertStatus(l);
                return alertStatus?.daysUntilReturn === 0;
            }).length
        };
    }, [localSelectedLoans, loans, alertsService]);

    return (
        <Box className={className}>
            {/* Barre de sélection */}
            <BulkSelectionBar
                selectedCount={localSelectedLoans.size}
                totalCount={loans.length}
                selectionStats={selectionStats}
                onSelectAll={handleSelectAll}
                onClearSelection={handleClearSelection}
                onQuickSelect={handleQuickSelect}
                quickSelectFilter={quickSelectFilter}
                maxBulkActions={maxBulkActions}
                isProcessing={isProcessing}
            />

            {/* Barre d'actions contextuelle */}
            {localSelectedLoans.size > 0 && (
                <Paper sx={{ mt: 2, p: 2 }}>
                    <Toolbar disableGutters sx={{ gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                            Actions groupées ({localSelectedLoans.size} prêt{localSelectedLoans.size > 1 ? 's' : ''})
                        </Typography>

                        {/* Actions principales */}
                        {canPerformAction('EXTEND') && (
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<ExtensionIcon />}
                                onClick={() => handleActionClick('EXTEND')}
                                disabled={isProcessing}
                                size={isMobile ? 'small' : 'medium'}
                            >
                                Prolonger
                            </Button>
                        )}

                        {canPerformAction('RECALL') && (
                            <Button
                                variant="contained"
                                color="warning"
                                startIcon={<EmailIcon />}
                                onClick={() => handleActionClick('RECALL')}
                                disabled={isProcessing}
                                size={isMobile ? 'small' : 'medium'}
                            >
                                Rappeler
                            </Button>
                        )}

                        {canPerformAction('TRANSFER') && (
                            <Button
                                variant="contained"
                                color="info"
                                startIcon={<TransferIcon />}
                                onClick={() => handleActionClick('TRANSFER')}
                                disabled={isProcessing}
                                size={isMobile ? 'small' : 'medium'}
                            >
                                Transférer
                            </Button>
                        )}

                        {canPerformAction('STATUS_CHANGE') && (
                            <Button
                                variant="contained"
                                color="secondary"
                                startIcon={<StatusIcon />}
                                onClick={() => handleActionClick('STATUS_CHANGE')}
                                disabled={isProcessing}
                                size={isMobile ? 'small' : 'medium'}
                            >
                                Statut
                            </Button>
                        )}

                        {canPerformAction('EXPORT') && (
                            <Button
                                variant="contained"
                                color="success"
                                startIcon={<ExportIcon />}
                                onClick={() => handleActionClick('EXPORT')}
                                disabled={isProcessing}
                                size={isMobile ? 'small' : 'medium'}
                            >
                                Exporter
                            </Button>
                        )}

                        {/* Menu d'actions supplémentaires */}
                        <IconButton
                            onClick={(e) => setMoreMenuAnchor(e.currentTarget)}
                            disabled={isProcessing}
                            size={isMobile ? 'small' : 'medium'}
                        >
                            <MoreIcon />
                        </IconButton>
                    </Toolbar>
                </Paper>
            )}

            {/* Indicateur de progression */}
            {(isProcessing || processingProgress > 0) && (
                <BulkProgressIndicator
                    progress={processingProgress}
                    step={processingStep}
                    action={currentAction}
                    isProcessing={isProcessing}
                />
            )}

            {/* Dialog de configuration d'action */}
            <BulkActionDialog
                open={showActionDialog}
                onClose={() => setShowActionDialog(false)}
                action={currentAction}
                parameters={actionParameters}
                validationErrors={validationErrors}
                selectedCount={localSelectedLoans.size}
                onParametersChange={setActionParameters}
                onConfirm={handleActionConfirm}
                canPerformAction={canPerformAction}
            />

            {/* Dialog d'historique */}
            <BulkActionHistory
                open={showHistory}
                onClose={() => setShowHistory(false)}
                loans={loans}
                currentUser={currentUser}
            />

            {/* Gestionnaire d'erreurs */}
            <BulkErrorHandler
                open={!!errorDialog}
                error={errorDialog}
                onClose={handleCloseErrorDialog}
                onRetry={() => {
                    if (errorDialog?.actionId) {
                        handleActionClick(errorDialog.actionId);
                    }
                }}
            />

            {/* Menu d'actions supplémentaires */}
            <Menu
                anchorEl={moreMenuAnchor}
                open={Boolean(moreMenuAnchor)}
                onClose={() => setMoreMenuAnchor(null)}
            >
                {canPerformAction('DELETE') && (
                    <MenuItem 
                        onClick={() => {
                            setMoreMenuAnchor(null);
                            handleActionClick('DELETE');
                        }}
                        sx={{ color: 'error.main' }}
                    >
                        <DeleteIcon sx={{ mr: 1 }} />
                        Supprimer définitivement
                    </MenuItem>
                )}
                
                <Divider />
                
                <MenuItem onClick={() => {
                    setMoreMenuAnchor(null);
                    handleShowHistory();
                }}>
                    <HistoryIcon sx={{ mr: 1 }} />
                    Historique des actions
                </MenuItem>
            </Menu>

            {/* Notifications */}
            <Snackbar
                open={!!notification}
                autoHideDuration={6000}
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                {notification && (
                    <Alert 
                        onClose={handleCloseNotification} 
                        severity={notification.type}
                        sx={{ width: '100%' }}
                    >
                        {notification.message}
                    </Alert>
                )}
            </Snackbar>
        </Box>
    );
};

// Fonction utilitaire pour générer des couleurs cohérentes
function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
}

export default React.memo(BulkActionsManager);
export { BULK_ACTIONS };