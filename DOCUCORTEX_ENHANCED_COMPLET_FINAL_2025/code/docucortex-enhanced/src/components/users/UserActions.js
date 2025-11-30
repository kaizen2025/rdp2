// src/components/users/UserActions.js - Gestionnaire d'actions avec validation et permissions

import React, { useState, useCallback, useMemo } from 'react';
import {
    Box,
    Button,
    IconButton,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    Checkbox,
    Chip,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Alert,
    CircularProgress,
    Tooltip,
    useTheme,
    alpha
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Person as PersonIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Print as PrintIcon,
    Download as DownloadIcon,
    Notifications as NotificationsIcon,
    Security as SecurityIcon,
    PhoneIphone as PhoneIcon,
    Computer as ComputerIcon,
    VpnKey as VpnKeyIcon,
    Language as LanguageIcon,
    Email as EmailIcon,
    FileCopy as FileCopyIcon,
    Settings as SettingsIcon,
    MoreVert as MoreVertIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    Warning as WarningIcon
} from '@mui/icons-material';

// Composants UI modernes
import { ModernButton } from '../ui/ModernUIComponents';

// Hooks et services
import { useApp } from '../../contexts/AppContext';
import apiService from '../../services/apiService';
import { debounceAsyncLeading } from '../../utils/debounce';

// Types d'actions disponibles
const ACTION_TYPES = {
    // Actions individuelles
    EDIT: 'edit',
    DELETE: 'delete',
    PRINT: 'print',
    EXPORT: 'export',
    
    // Actions AD
    ENABLE_AD: 'enable_ad',
    DISABLE_AD: 'disable_ad',
    RESET_PASSWORD: 'reset_password',
    ADD_TO_GROUP: 'add_to_group',
    REMOVE_FROM_GROUP: 'remove_from_group',
    
    // Actions équipements
    MANAGE_PHONE: 'manage_phone',
    MANAGE_COMPUTER: 'manage_computer',
    
    // Actions communication
    SEND_EMAIL: 'send_email',
    SEND_NOTIFICATION: 'send_notification',
    
    // Actions bulk
    BULK_EXPORT: 'bulk_export',
    BULK_DELETE: 'bulk_delete',
    BULK_NOTIFY: 'bulk_notify',
    BULK_RESET_PASSWORD: 'bulk_reset_password'
};

// Configuration des permissions par rôle
const ROLE_PERMISSIONS = {
    admin: Object.values(ACTION_TYPES),
    manager: [
        ACTION_TYPES.EDIT,
        ACTION_TYPES.PRINT,
        ACTION_TYPES.EXPORT,
        ACTION_TYPES.ENABLE_AD,
        ACTION_TYPES.DISABLE_AD,
        ACTION_TYPES.MANAGE_PHONE,
        ACTION_TYPES.MANAGE_COMPUTER,
        ACTION_TYPES.SEND_EMAIL,
        ACTION_TYPES.SEND_NOTIFICATION,
        ACTION_TYPES.BULK_EXPORT,
        ACTION_TYPES.BULK_NOTIFY
    ],
    operator: [
        ACTION_TYPES.EDIT,
        ACTION_TYPES.PRINT,
        ACTION_TYPES.MANAGE_PHONE,
        ACTION_TYPES.MANAGE_COMPUTER,
        ACTION_TYPES.BULK_EXPORT
    ],
    viewer: [
        ACTION_TYPES.PRINT,
        ACTION_TYPES.EXPORT
    ]
};

// Configuration des actions
const ACTION_CONFIG = {
    [ACTION_TYPES.EDIT]: {
        label: 'Modifier',
        icon: <EditIcon />,
        color: 'primary',
        requiresConfirmation: false,
        description: 'Modifier les informations de l\'utilisateur'
    },
    [ACTION_TYPES.DELETE]: {
        label: 'Supprimer',
        icon: <DeleteIcon />,
        color: 'error',
        requiresConfirmation: true,
        confirmationMessage: 'Êtes-vous sûr de vouloir supprimer cet utilisateur ?',
        description: 'Supprimer définitivement l\'utilisateur'
    },
    [ACTION_TYPES.PRINT]: {
        label: 'Imprimer',
        icon: <PrintIcon />,
        color: 'info',
        requiresConfirmation: false,
        description: 'Imprimer la fiche utilisateur'
    },
    [ACTION_TYPES.EXPORT]: {
        label: 'Exporter',
        icon: <DownloadIcon />,
        color: 'secondary',
        requiresConfirmation: false,
        description: 'Exporter les données utilisateur'
    },
    [ACTION_TYPES.ENABLE_AD]: {
        label: 'Activer AD',
        icon: <CheckCircleIcon />,
        color: 'success',
        requiresConfirmation: true,
        confirmationMessage: 'Activer le compte Active Directory ?',
        description: 'Activer le compte AD de l\'utilisateur'
    },
    [ACTION_TYPES.DISABLE_AD]: {
        label: 'Désactiver AD',
        icon: <ErrorIcon />,
        color: 'warning',
        requiresConfirmation: true,
        confirmationMessage: 'Désactiver le compte Active Directory ?',
        description: 'Désactiver le compte AD de l\'utilisateur'
    },
    [ACTION_TYPES.RESET_PASSWORD]: {
        label: 'Réinitialiser MDP',
        icon: <SecurityIcon />,
        color: 'warning',
        requiresConfirmation: true,
        confirmationMessage: 'Réinitialiser le mot de passe ?',
        description: 'Réinitialiser le mot de passe utilisateur'
    },
    [ACTION_TYPES.MANAGE_PHONE]: {
        label: 'Gérer Téléphone',
        icon: <PhoneIcon />,
        color: 'primary',
        requiresConfirmation: false,
        description: 'Gérer les téléphones attribués'
    },
    [ACTION_TYPES.MANAGE_COMPUTER]: {
        label: 'Gérer Ordinateur',
        icon: <ComputerIcon />,
        color: 'primary',
        requiresConfirmation: false,
        description: 'Gérer les ordinateurs attribués'
    },
    [ACTION_TYPES.SEND_EMAIL]: {
        label: 'Envoyer Email',
        icon: <EmailIcon />,
        color: 'info',
        requiresConfirmation: false,
        description: 'Envoyer un email à l\'utilisateur'
    },
    [ACTION_TYPES.SEND_NOTIFICATION]: {
        label: 'Notifier',
        icon: <NotificationsIcon />,
        color: 'secondary',
        requiresConfirmation: false,
        description: 'Envoyer une notification'
    },
    [ACTION_TYPES.BULK_EXPORT]: {
        label: 'Export en Lot',
        icon: <DownloadIcon />,
        color: 'secondary',
        requiresConfirmation: false,
        description: 'Exporter plusieurs utilisateurs'
    },
    [ACTION_TYPES.BULK_DELETE]: {
        label: 'Suppression en Lot',
        icon: <DeleteIcon />,
        color: 'error',
        requiresConfirmation: true,
        confirmationMessage: 'Supprimer plusieurs utilisateurs ?',
        description: 'Supprimer plusieurs utilisateurs en une fois'
    },
    [ACTION_TYPES.BULK_NOTIFY]: {
        label: 'Notifications en Lot',
        icon: <NotificationsIcon />,
        color: 'secondary',
        requiresConfirmation: false,
        description: 'Envoyer des notifications à plusieurs utilisateurs'
    }
};

const UserActions = memo(({
    user = null,
    users = [],
    selectedUsers = [],
    userRole = 'operator',
    onActionComplete,
    onError
}) => {
    const theme = useTheme();
    const { showNotification } = useApp();
    
    // États
    const [anchorEl, setAnchorEl] = useState(null);
    const [confirmationDialog, setConfirmationDialog] = useState({
        open: false,
        action: null,
        users: [],
        data: {}
    });
    const [actionProgress, setActionProgress] = useState({
        running: false,
        completed: 0,
        total: 0,
        errors: []
    });

    // Permissions de l'utilisateur actuel
    const userPermissions = useMemo(() => {
        return ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.operator;
    }, [userRole]);

    // Actions disponibles pour l'utilisateur
    const availableActions = useMemo(() => {
        if (!user && selectedUsers.length === 0) return [];
        
        const isBulk = selectedUsers.length > 1;
        const actions = [];
        
        // Actions individuelles
        if (user && !isBulk) {
            Object.keys(ACTION_CONFIG).forEach(actionType => {
                if (userPermissions.includes(actionType) && !actionType.startsWith('bulk_')) {
                    actions.push(actionType);
                }
            });
        }
        
        // Actions en lot
        if (isBulk) {
            Object.keys(ACTION_CONFIG).forEach(actionType => {
                if (userPermissions.includes(actionType) && actionType.startsWith('bulk_')) {
                    actions.push(actionType);
                }
            });
        }
        
        return actions;
    }, [user, selectedUsers, userPermissions]);

    // Gestion du menu
    const handleMenuOpen = useCallback((event) => {
        setAnchorEl(event.currentTarget);
    }, []);

    const handleMenuClose = useCallback(() => {
        setAnchorEl(null);
    }, []);

    // Exécution d'une action avec validation
    const executeAction = useCallback(async (actionType, targetUsers, actionData = {}) => {
        const config = ACTION_CONFIG[actionType];
        if (!config) {
            showNotification('error', `Action non reconnue: ${actionType}`);
            return;
        }

        // Vérification des permissions
        if (!userPermissions.includes(actionType)) {
            showNotification('error', 'Vous n\'avez pas les permissions pour cette action');
            return;
        }

        // Confirmation si nécessaire
        if (config.requiresConfirmation && !actionData.skipConfirmation) {
            setConfirmationDialog({
                open: true,
                action: actionType,
                users: targetUsers,
                data: actionData
            });
            return;
        }

        // Exécution directe
        await performAction(actionType, targetUsers, actionData);
    }, [userPermissions, showNotification]);

    // Exécution réelle de l'action
    const performAction = useCallback(
        debounceAsyncLeading(async (actionType, targetUsers, actionData) => {
            setActionProgress({
                running: true,
                completed: 0,
                total: targetUsers.length,
                errors: []
            });

            try {
                let results = [];
                
                switch (actionType) {
                    case ACTION_TYPES.EDIT:
                        // Action d'édition individuelle
                        if (onActionComplete) onActionComplete('edit', user, actionData);
                        break;

                    case ACTION_TYPES.DELETE:
                        for (const targetUser of targetUsers) {
                            try {
                                await apiService.deleteUserFromExcel(targetUser.username);
                                results.push({ success: true, user: targetUser });
                            } catch (error) {
                                results.push({ success: false, user: targetUser, error: error.message });
                            }
                            setActionProgress(prev => ({ ...prev, completed: prev.completed + 1 }));
                        }
                        break;

                    case ACTION_TYPES.PRINT:
                        // Action d'impression
                        if (onActionComplete) onActionComplete('print', targetUsers, actionData);
                        break;

                    case ACTION_TYPES.EXPORT:
                    case ACTION_TYPES.BULK_EXPORT:
                        // Action d'export
                        if (onActionComplete) onActionComplete('export', targetUsers, actionData);
                        break;

                    case ACTION_TYPES.ENABLE_AD:
                        for (const targetUser of targetUsers) {
                            try {
                                await apiService.enableAdUser(targetUser.username);
                                results.push({ success: true, user: targetUser });
                            } catch (error) {
                                results.push({ success: false, user: targetUser, error: error.message });
                            }
                            setActionProgress(prev => ({ ...prev, completed: prev.completed + 1 }));
                        }
                        break;

                    case ACTION_TYPES.DISABLE_AD:
                        for (const targetUser of targetUsers) {
                            try {
                                await apiService.disableAdUser(targetUser.username);
                                results.push({ success: true, user: targetUser });
                            } catch (error) {
                                results.push({ success: false, user: targetUser, error: error.message });
                            }
                            setActionProgress(prev => ({ ...prev, completed: prev.completed + 1 }));
                        }
                        break;

                    case ACTION_TYPES.MANAGE_PHONE:
                    case ACTION_TYPES.MANAGE_COMPUTER:
                        if (onActionComplete) onActionComplete(actionType, targetUsers, actionData);
                        break;

                    default:
                        showNotification('warning', `Action "${actionType}" non implémentée`);
                        return;
                }

                // Résumé des résultats
                const successCount = results.filter(r => r.success).length;
                const errorCount = results.filter(r => !r.success).length;

                if (errorCount === 0) {
                    showNotification('success', `${successCount} action(s) exécutée(s) avec succès`);
                } else {
                    showNotification('warning', `${successCount} succès, ${errorCount} erreur(s)`);
                }

                if (onActionComplete) onActionComplete(actionType, results, actionData);

            } catch (error) {
                showNotification('error', `Erreur lors de l'exécution: ${error.message}`);
                if (onError) onError(error);
            } finally {
                setActionProgress({
                    running: false,
                    completed: 0,
                    total: 0,
                    errors: []
                });
                setConfirmationDialog({ open: false, action: null, users: [], data: {} });
                handleMenuClose();
            }
        }, 500),
        [showNotification, onActionComplete, onError, handleMenuClose]
    );

    // Gestion des confirmations
    const handleConfirmAction = useCallback(() => {
        if (confirmationDialog.action && confirmationDialog.users.length > 0) {
            performAction(
                confirmationDialog.action,
                confirmationDialog.users,
                { ...confirmationDialog.data, skipConfirmation: true }
            );
        }
    }, [confirmationDialog, performAction]);

    const handleCancelAction = useCallback(() => {
        setConfirmationDialog({ open: false, action: null, users: [], data: {} });
    }, []);

    // Rendu du menu d'actions
    const renderActionsMenu = () => {
        if (availableActions.length === 0) return null;

        const isBulk = selectedUsers.length > 1;
        const targetUsers = isBulk ? selectedUsers : [user];

        return (
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        boxShadow: theme.shadows[8],
                        minWidth: 220
                    }
                }}
            >
                {availableActions.map((actionType) => {
                    const config = ACTION_CONFIG[actionType];
                    const isDisabled = actionProgress.running;
                    
                    return (
                        <MenuItem
                            key={actionType}
                            onClick={() => executeAction(actionType, targetUsers)}
                            disabled={isDisabled}
                            sx={{ py: 1.5 }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                <Box sx={{ color: `${config.color}.main`, display: 'flex' }}>
                                    {config.icon}
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2" fontWeight={500}>
                                        {config.label}
                                        {isBulk && actionType.startsWith('bulk_') && (
                                            <Chip 
                                                size="small" 
                                                label={selectedUsers.length} 
                                                sx={{ ml: 1, height: 16, fontSize: '0.625rem' }}
                                            />
                                        )}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {config.description}
                                    </Typography>
                                </Box>
                            </Box>
                        </MenuItem>
                    );
                })}
            </Menu>
        );
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Actions rapides */}
            {user && selectedUsers.length <= 1 && (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Modifier">
                        <IconButton
                            size="small"
                            onClick={() => executeAction(ACTION_TYPES.EDIT, [user])}
                            disabled={actionProgress.running}
                            sx={{ color: 'primary.main' }}
                        >
                            <EditIcon />
                        </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Imprimer">
                        <IconButton
                            size="small"
                            onClick={() => executeAction(ACTION_TYPES.PRINT, [user])}
                            disabled={actionProgress.running}
                            sx={{ color: 'info.main' }}
                        >
                            <PrintIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            )}

            {/* Menu d'actions complet */}
            <Tooltip title="Actions">
                <IconButton
                    onClick={handleMenuOpen}
                    disabled={actionProgress.running || availableActions.length === 0}
                    sx={{ 
                        color: availableActions.length > 0 ? 'text.primary' : 'text.disabled'
                    }}
                >
                    {actionProgress.running ? (
                        <CircularProgress size={20} />
                    ) : (
                        <MoreVertIcon />
                    )}
                </IconButton>
            </Tooltip>

            {renderActionsMenu()}

            {/* Dialog de confirmation */}
            <Dialog
                open={confirmationDialog.open}
                onClose={handleCancelAction}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WarningIcon color="warning" />
                        Confirmation d'Action
                    </Box>
                </DialogTitle>
                
                <DialogContent>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        {confirmationDialog.action && ACTION_CONFIG[confirmationDialog.action]?.confirmationMessage}
                    </Typography>
                    
                    {confirmationDialog.users.length > 0 && (
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Utilisateurs concernés ({confirmationDialog.users.length}):
                            </Typography>
                            <List dense>
                                {confirmationDialog.users.slice(0, 5).map((targetUser, index) => (
                                    <ListItem key={index}>
                                        <ListItemIcon>
                                            <PersonIcon />
                                        </ListItemIcon>
                                        <ListItemText 
                                            primary={targetUser.displayName || targetUser.username}
                                            secondary={targetUser.username}
                                        />
                                    </ListItem>
                                ))}
                                {confirmationDialog.users.length > 5 && (
                                    <ListItem>
                                        <ListItemText 
                                            primary={`... et ${confirmationDialog.users.length - 5} autres`}
                                        />
                                    </ListItem>
                                )}
                            </List>
                        </Box>
                    )}
                </DialogContent>
                
                <DialogActions>
                    <Button onClick={handleCancelAction}>
                        Annuler
                    </Button>
                    <ModernButton
                        variant="contained"
                        color={confirmationDialog.action && ACTION_CONFIG[confirmationDialog.action]?.color}
                        onClick={handleConfirmAction}
                    >
                        Confirmer
                    </ModernButton>
                </DialogActions>
            </Dialog>

            {/* Indicateur de progression */}
            <AnimatePresence>
                {actionProgress.running && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        style={{
                            position: 'fixed',
                            top: 20,
                            right: 20,
                            zIndex: 1000
                        }}
                    >
                        <Box
                            sx={{
                                p: 2,
                                bgcolor: 'background.paper',
                                borderRadius: 2,
                                boxShadow: theme.shadows[8],
                                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                                minWidth: 250
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <CircularProgress size={20} />
                                <Typography variant="body2" fontWeight={500}>
                                    Action en cours...
                                </Typography>
                            </Box>
                            
                            <Typography variant="caption" color="text.secondary">
                                {actionProgress.completed} / {actionProgress.total} traité(s)
                            </Typography>
                            
                            <Box sx={{ mt: 1, width: '100%', bgcolor: 'grey.200', borderRadius: 1, height: 4 }}>
                                <Box
                                    sx={{
                                        width: `${(actionProgress.completed / actionProgress.total) * 100}%`,
                                        bgcolor: 'primary.main',
                                        height: '100%',
                                        borderRadius: 1,
                                        transition: 'width 0.3s ease'
                                    }}
                                />
                            </Box>
                        </Box>
                    </motion.div>
                )}
            </AnimatePresence>
        </Box>
    );
});

UserActions.displayName = 'UserActions';
UserActions.ACTION_TYPES = ACTION_TYPES;

export default UserActions;
