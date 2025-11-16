// UsersBatchActions.js - COMPOSANT AVANCÉ D'ACTIONS EN LOT POUR UTILISATEURS
// Sélection multiple, actions en lot avec confirmation, progress et rollback
// Interface moderne avec animations Framer Motion

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    LinearProgress,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Checkbox,
    Divider,
    Alert,
    Snackbar,
    Tooltip,
    Fade,
    Switch,
    FormControlLabel,
    Grid,
    Card,
    CardContent,
    CardActions
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Delete as DeleteIcon,
    Edit as EditIcon,
    Download as DownloadIcon,
    CloudUpload as UploadIcon,
    Group as GroupIcon,
    Person as PersonIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    Refresh as RefreshIcon,
    Undo as UndoIcon,
    Info as InfoIcon,
    FileExcel as ExcelIcon,
    PictureAsPdf as PdfIcon,
    Email as EmailIcon,
    Security as SecurityIcon,
    RestoreFromTrash as RestoreIcon,
    History as HistoryIcon,
    KeyboardArrowUp as ArrowUpIcon,
    KeyboardArrowDown as ArrowDownIcon
} from '@mui/icons-material';

import BulkActionsEngine, { AuditService } from '../bulk/BulkActionsEngine';
import apiService from '../../services/apiService';

// Animation variants
const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: 'easeOut' }
    },
    exit: { opacity: 0, y: -60, transition: { duration: 0.3 } }
};

const scaleIn = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.3 } }
};

const slideInRight = {
    hidden: { opacity: 0, x: 100 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, x: 100, transition: { duration: 0.3 } }
};

// Types d'actions disponibles
const BULK_ACTIONS = {
    DELETE_USERS: {
        id: 'DELETE_USERS',
        label: 'Supprimer Utilisateurs',
        icon: DeleteIcon,
        color: 'error',
        description: 'Supprimer définitivement les utilisateurs sélectionnés',
        requiresConfirmation: true,
        doubleConfirmation: true,
        maxUsers: 50
    },
    UPDATE_GROUPS: {
        id: 'UPDATE_GROUPS',
        label: 'Modifier Groupes',
        icon: GroupIcon,
        color: 'primary',
        description: 'Ajouter ou supprimer des groupes pour les utilisateurs',
        requiresConfirmation: true,
        maxUsers: 100
    },
    EXPORT_EXCEL: {
        id: 'EXPORT_EXCEL',
        label: 'Export Excel',
        icon: ExcelIcon,
        color: 'success',
        description: 'Exporter les données au format Excel',
        requiresConfirmation: false,
        maxUsers: 1000
    },
    EXPORT_PDF: {
        id: 'EXPORT_PDF',
        label: 'Export PDF',
        icon: PdfIcon,
        color: 'success',
        description: 'Générer un rapport PDF des utilisateurs',
        requiresConfirmation: false,
        maxUsers: 500
    },
    SEND_EMAIL: {
        id: 'SEND_EMAIL',
        label: 'Envoyer Email',
        icon: EmailIcon,
        color: 'info',
        description: 'Envoyer un email aux utilisateurs sélectionnés',
        requiresConfirmation: true,
        maxUsers: 200
    },
    DISABLE_USERS: {
        id: 'DISABLE_USERS',
        label: 'Désactiver Utilisateurs',
        icon: SecurityIcon,
        color: 'warning',
        description: 'Désactiver les comptes utilisateurs',
        requiresConfirmation: true,
        maxUsers: 100
    },
    RESTORE_USERS: {
        id: 'RESTORE_USERS',
        label: 'Restaurer Utilisateurs',
        icon: RestoreIcon,
        color: 'success',
        description: 'Restaurer les comptes supprimés',
        requiresConfirmation: true,
        maxUsers: 20
    },
    BATCH_UPDATE: {
        id: 'BATCH_UPDATE',
        label: 'Mise à jour Groupes',
        icon: EditIcon,
        color: 'primary',
        description: 'Modifier les propriétés en lot',
        requiresConfirmation: true,
        maxUsers: 100
    }
};

// Hook pour la sélection multiple
const useMultipleSelection = (items, keyField = 'username') => {
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [lastSelectedIndex, setLastSelectedIndex] = useState(-1);

    const toggleItem = useCallback((item) => {
        setSelectedItems(prev => {
            const newSelection = new Set(prev);
            const itemId = item[keyField];
            if (newSelection.has(itemId)) {
                newSelection.delete(itemId);
            } else {
                newSelection.add(itemId);
            }
            return newSelection;
        });
    }, [keyField]);

    const selectRange = useCallback((startIndex, endIndex) => {
        setSelectedItems(prev => {
            const newSelection = new Set(prev);
            const minIndex = Math.min(startIndex, endIndex);
            const maxIndex = Math.max(startIndex, endIndex);
            
            items.slice(minIndex, maxIndex + 1).forEach(item => {
                newSelection.add(item[keyField]);
            });
            
            return newSelection;
        });
        setLastSelectedIndex(endIndex);
    }, [items, keyField]);

    const handleItemClick = useCallback((item, index, event) => {
        if (event.ctrlKey || event.metaKey) {
            // Ctrl+click : toggle individual
            toggleItem(item);
        } else if (event.shiftKey && lastSelectedIndex !== -1) {
            // Shift+click : select range
            selectRange(lastSelectedIndex, index);
        } else {
            // Normal click : select only this item
            setSelectedItems(new Set([item[keyField]]));
            setLastSelectedIndex(index);
        }
    }, [toggleItem, selectRange, lastSelectedIndex, keyField]);

    const selectAll = useCallback(() => {
        setSelectedItems(new Set(items.map(item => item[keyField])));
    }, [items, keyField]);

    const clearSelection = useCallback(() => {
        setSelectedItems(new Set());
        setLastSelectedIndex(-1);
    }, []);

    const isSelected = useCallback((item) => {
        return selectedItems.has(item[keyField]);
    }, [selectedItems, keyField]);

    return {
        selectedItems,
        selectAll,
        clearSelection,
        handleItemClick,
        isSelected,
        hasSelection: selectedItems.size > 0,
        selectionCount: selectedItems.size
    };
};

// Composant de confirmation d'action
const ActionConfirmationDialog = ({ open, action, selectedUsers, onConfirm, onCancel, onProgress }) => {
    const [confirmationText, setConfirmationText] = useState('');
    const [doubleConfirm, setDoubleConfirm] = useState(false);
    const [parameters, setParameters] = useState({});

    const expectedConfirmation = action.id === 'DELETE_USERS' ? 'SUPPRIMER' : '';

    useEffect(() => {
        if (open) {
            setConfirmationText('');
            setDoubleConfirm(false);
            setParameters({});
        }
    }, [open, action]);

    const handleConfirm = () => {
        if (action.requiresConfirmation) {
            if (expectedConfirmation && confirmationText !== expectedConfirmation) {
                return;
            }
            if (doubleConfirm && action.doubleConfirmation) {
                setDoubleConfirm(true);
                return;
            }
        }

        onConfirm(parameters);
    };

    const canConfirm = useMemo(() => {
        if (!action.requiresConfirmation) return true;
        
        if (expectedConfirmation) {
            return confirmationText === expectedConfirmation;
        }
        
        if (doubleConfirm && action.doubleConfirmation) {
            return true;
        }
        
        return true;
    }, [action, confirmationText, doubleConfirm, expectedConfirmation]);

    const renderParameterFields = () => {
        switch (action.id) {
            case 'UPDATE_GROUPS':
            case 'BATCH_UPDATE':
                return (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Action sur les groupes :</Typography>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Type d'action</InputLabel>
                            <Select
                                value={parameters.actionType || 'add'}
                                onChange={(e) => setParameters(prev => ({ ...prev, actionType: e.target.value }))}
                            >
                                <MenuItem value="add">Ajouter</MenuItem>
                                <MenuItem value="remove">Supprimer</MenuItem>
                                <MenuItem value="replace">Remplacer</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            label="Groupes (séparés par des virgules)"
                            value={parameters.groups || ''}
                            onChange={(e) => setParameters(prev => ({ ...prev, groups: e.target.value }))}
                            placeholder="VPN, Internet, Administrateurs"
                        />
                    </Box>
                );

            case 'SEND_EMAIL':
                return (
                    <Box sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Sujet de l'email"
                            value={parameters.subject || ''}
                            onChange={(e) => setParameters(prev => ({ ...prev, subject: e.target.value }))}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Message"
                            value={parameters.message || ''}
                            onChange={(e) => setParameters(prev => ({ ...prev, message: e.target.value }))}
                            placeholder="Votre message..."
                        />
                    </Box>
                );

            case 'EXPORT_EXCEL':
            case 'EXPORT_PDF':
                return (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Champs à exporter :</Typography>
                        <Grid container spacing={1}>
                            {['displayName', 'username', 'email', 'department', 'server', 'adEnabled', 'createdDate'].map(field => (
                                <Grid item xs={6} key={field}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={(parameters.fields || []).includes(field)}
                                                onChange={(e) => {
                                                    const fields = parameters.fields || [];
                                                    if (e.target.checked) {
                                                        setParameters(prev => ({ ...prev, fields: [...fields, field] }));
                                                    } else {
                                                        setParameters(prev => ({ ...prev, fields: fields.filter(f => f !== field) }));
                                                    }
                                                }}
                                            />
                                        }
                                        label={field}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                );

            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <action.icon color={action.color} />
                {action.label}
            </DialogTitle>
            <DialogContent>
                <Alert severity="warning" sx={{ mb: 2 }}>
                    {action.description}
                </Alert>
                
                <Typography variant="body2" sx={{ mb: 2 }}>
                    Cette action affectera <strong>{selectedUsers.length} utilisateur{selectedUsers.length > 1 ? 's' : ''}</strong>.
                </Typography>

                {renderParameterFields()}

                {action.requiresConfirmation && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            {action.doubleConfirmation ? 'Confirmation requise' : 'Confirmer l\'action'}
                        </Typography>
                        {action.doubleConfirmation ? (
                            <Box>
                                <TextField
                                    fullWidth
                                    label={`Tapez "${expectedConfirmation}" pour confirmer`}
                                    value={confirmationText}
                                    onChange={(e) => setConfirmationText(e.target.value)}
                                />
                                {confirmationText === expectedConfirmation && (
                                    <Alert severity="info" sx={{ mt: 1 }}>
                                        Appuyez à nouveau sur Confirmer pour procéder.
                                    </Alert>
                                )}
                            </Box>
                        ) : (
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={doubleConfirm}
                                        onChange={(e) => setDoubleConfirm(e.target.checked)}
                                    />
                                }
                                label="Je comprends les conséquences de cette action"
                            />
                        )}
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel}>Annuler</Button>
                <Button
                    onClick={handleConfirm}
                    variant="contained"
                    color={action.color}
                    disabled={!canConfirm}
                >
                    Confirmer
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// Composant principal
const UsersBatchActions = ({ 
    users, 
    onUsersUpdate, 
    currentUser = { id: 'admin', role: 'admin' },
    className = ''
}) => {
    const [actionProgress, setActionProgress] = useState(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [snackbar, setSnackbar] = useState(null);
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    
    const selection = useMultipleSelection(users);

    // Chargement de l'historique au montage
    useEffect(() => {
        const auditHistory = AuditService.getAuditHistory({
            actionId: 'users_bulk_action'
        });
        setHistory(auditHistory);
    }, []);

    // Traitement d'une action en lot
    const processBulkAction = useCallback(async (action, selectedUserIds, parameters = {}) => {
        setActionProgress({
            action: action.id,
            progress: 0,
            message: 'Initialisation...',
            userId: currentUser.id,
            timestamp: new Date().toISOString(),
            total: selectedUserIds.length,
            successful: 0,
            failed: 0
        });

        try {
            // Adapter les données pour le moteur d'actions en lot
            const selectedUserData = users.filter(user => selectedUserIds.includes(user.username));
            
            // Convertir les utilisateurs en format prêt pour le moteur
            const userLoans = selectedUserData.map(user => ({
                id: user.username,
                borrowerId: user.username,
                borrowerName: user.displayName,
                borrowerEmail: user.email,
                status: user.adEnabled ? 'active' : 'disabled',
                department: user.department,
                server: user.server,
                ...user
            }));

            const result = await BulkActionsEngine.executeBulkAction({
                actionId: action.id,
                selectedLoans: userLoans,
                parameters,
                currentUser,
                onProgress: (progress, message) => {
                    setActionProgress(prev => ({
                        ...prev,
                        progress,
                        message
                    }));
                }
            });

            // Traitement post-action selon le type
            await handlePostAction(action, selectedUserData, parameters, result);

            setActionProgress(null);
            setSnackbar({
                type: 'success',
                message: `Action terminée: ${result.successful} succès, ${result.failed} erreurs`
            });

            // Ajout à l'historique
            const newHistoryEntry = {
                id: `history_${Date.now()}`,
                action: action.id,
                actionLabel: action.label,
                timestamp: new Date().toISOString(),
                userId: currentUser.id,
                affectedUsers: selectedUserIds.length,
                result,
                parameters,
                canRollback: ['DELETE_USERS', 'UPDATE_GROUPS', 'DISABLE_USERS'].includes(action.id)
            };
            
            setHistory(prev => [newHistoryEntry, ...prev.slice(0, 99)]); // Garder les 100 dernières
            
            return result;

        } catch (error) {
            setActionProgress(null);
            setSnackbar({
                type: 'error',
                message: `Erreur lors de l'action: ${error.message}`
            });
            throw error;
        }
    }, [users, currentUser]);

    // Traitement post-action
    const handlePostAction = useCallback(async (action, selectedUsers, parameters, result) => {
        switch (action.id) {
            case 'EXPORT_EXCEL':
            case 'EXPORT_PDF':
                if (result.downloadUrl) {
                    // Créer un lien de téléchargement temporaire
                    const link = document.createElement('a');
                    link.href = result.downloadUrl;
                    link.download = `export_users_${Date.now()}.${action.id === 'EXPORT_EXCEL' ? 'xlsx' : 'pdf'}`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
                break;

            case 'DELETE_USERS':
                // Appel API pour supprimer les utilisateurs
                for (const user of selectedUsers) {
                    try {
                        await apiService.deleteUser(user.username);
                    } catch (error) {
                        console.warn(`Erreur suppression utilisateur ${user.username}:`, error);
                    }
                }
                break;

            case 'UPDATE_GROUPS':
            case 'BATCH_UPDATE':
                // Appel API pour modifier les groupes
                for (const user of selectedUsers) {
                    try {
                        await apiService.updateUserGroups(user.username, parameters.groups, parameters.actionType);
                    } catch (error) {
                        console.warn(`Erreur modification groupes ${user.username}:`, error);
                    }
                }
                break;

            case 'SEND_EMAIL':
                // Traitement des emails - en production, utiliser un service email
                console.log('Emails envoyés:', parameters);
                break;

            case 'DISABLE_USERS':
            case 'RESTORE_USERS':
                // Appel API pour changer le statut
                for (const user of selectedUsers) {
                    try {
                        const newStatus = action.id === 'RESTORE_USERS' ? 1 : 0;
                        await apiService.updateUserStatus(user.username, { adEnabled: newStatus });
                    } catch (error) {
                        console.warn(`Erreur changement statut ${user.username}:`, error);
                    }
                }
                break;
        }

        // Notifier les composants parents
        if (onUsersUpdate) {
            onUsersUpdate();
        }
    }, [onUsersUpdate]);

    // Exécution d'une action
    const executeAction = useCallback(async (parameters = {}) => {
        if (!pendingAction) return;

        setShowConfirmation(false);
        const selectedUserIds = Array.from(selection.selectedItems);
        
        try {
            await processBulkAction(pendingAction, selectedUserIds, parameters);
            selection.clearSelection();
        } catch (error) {
            console.error('Erreur action en lot:', error);
        } finally {
            setPendingAction(null);
        }
    }, [pendingAction, selection, processBulkAction]);

    // Ouverture du dialogue de confirmation
    const openActionConfirmation = useCallback((action) => {
        if (selection.selectionCount > action.maxUsers) {
            setSnackbar({
                type: 'warning',
                message: `Cette action est limitée à ${action.maxUsers} utilisateurs. Vous avez sélectionné ${selection.selectionCount} utilisateurs.`
            });
            return;
        }

        setPendingAction(action);
        setShowConfirmation(true);
    }, [selection.selectionCount]);

    // Rollback d'une action
    const rollbackAction = useCallback(async (historyEntry) => {
        setActionProgress({
            action: 'ROLLBACK',
            progress: 0,
            message: 'Annulation en cours...',
            userId: currentUser.id,
            timestamp: new Date().toISOString()
        });

        try {
            // Implémentation du rollback selon le type d'action
            switch (historyEntry.action) {
                case 'DELETE_USERS':
                    // Restaurer les utilisateurs supprimés
                    // En production, récupération depuis la corbeille ou backup
                    break;
                case 'UPDATE_GROUPS':
                    // Revenir aux groupes précédents
                    // Nécessiterait de sauvegarder l'état précédent
                    break;
                case 'DISABLE_USERS':
                    // Réactiver les utilisateurs
                    // Appel API pour réactiver
                    break;
            }

            setActionProgress(null);
            setSnackbar({
                type: 'success',
                message: 'Action annulée avec succès'
            });
        } catch (error) {
            setActionProgress(null);
            setSnackbar({
                type: 'error',
                message: `Erreur lors de l'annulation: ${error.message}`
            });
        }
    }, [currentUser]);

    return (
        <Box className={className}>
            {/* Barre d'actions flottante */}
            <AnimatePresence>
                {selection.hasSelection && (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={slideInRight}
                        style={{
                            position: 'fixed',
                            bottom: 20,
                            right: 20,
                            zIndex: 1000,
                            maxWidth: 400
                        }}
                    >
                        <Paper sx={{ p: 2, boxShadow: 4 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="subtitle1" fontWeight={600}>
                                    {selection.selectionCount} utilisateur{selection.selectionCount > 1 ? 's' : ''} sélectionné{selection.selectionCount > 1 ? 's' : ''}
                                </Typography>
                                <IconButton size="small" onClick={selection.clearSelection}>
                                    <ArrowDownIcon />
                                </IconButton>
                            </Box>

                            <Grid container spacing={1}>
                                {Object.values(BULK_ACTIONS).map((action) => (
                                    <Grid item xs={6} key={action.id}>
                                        <Tooltip title={action.description} arrow>
                                            <Button
                                                variant={action.color === 'error' ? 'outlined' : 'contained'}
                                                color={action.color}
                                                size="small"
                                                startIcon={<action.icon />}
                                                onClick={() => openActionConfirmation(action)}
                                                fullWidth
                                                disabled={selection.selectionCount > action.maxUsers}
                                            >
                                                {action.label}
                                            </Button>
                                        </Tooltip>
                                    </Grid>
                                ))}
                            </Grid>

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={selection.selectAll}
                                    fullWidth
                                >
                                    Tout sélectionner
                                </Button>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => setShowHistory(!showHistory)}
                                    startIcon={<HistoryIcon />}
                                >
                                    Historique
                                </Button>
                            </Box>
                        </Paper>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Dialogue de confirmation */}
            <ActionConfirmationDialog
                open={showConfirmation}
                action={pendingAction}
                selectedUsers={Array.from(selection.selectedItems).map(id => 
                    users.find(u => u.username === id)
                ).filter(Boolean)}
                onConfirm={executeAction}
                onCancel={() => {
                    setShowConfirmation(false);
                    setPendingAction(null);
                }}
                onProgress={(progress, message) => {
                    setActionProgress(prev => ({
                        ...prev,
                        progress,
                        message
                    }));
                }}
            />

            {/* Indicateur de progression */}
            <AnimatePresence>
                {actionProgress && (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={scaleIn}
                        style={{
                            position: 'fixed',
                            top: 20,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 1001,
                            minWidth: 400
                        }}
                    >
                        <Paper sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <RefreshIcon sx={{ animation: 'spin 2s linear infinite' }} />
                                <Typography variant="h6">
                                    {actionProgress.action === 'ROLLBACK' ? 'Annulation' : 'Action en cours'}
                                </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                {actionProgress.message}
                            </Typography>
                            <LinearProgress 
                                variant="determinate" 
                                value={actionProgress.progress} 
                                sx={{ height: 8, borderRadius: 4 }}
                            />
                            {actionProgress.total && (
                                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                                    {actionProgress.successful + actionProgress.failed} / {actionProgress.total}
                                </Typography>
                            )}
                        </Paper>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Panneau d'historique */}
            <AnimatePresence>
                {showHistory && (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={fadeInUp}
                        style={{
                            position: 'fixed',
                            top: 20,
                            right: 20,
                            zIndex: 999,
                            width: 400,
                            maxHeight: '80vh',
                            overflow: 'auto'
                        }}
                    >
                        <Paper sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">Historique des Actions</Typography>
                                <IconButton size="small" onClick={() => setShowHistory(false)}>
                                    <ArrowUpIcon />
                                </IconButton>
                            </Box>
                            
                            {history.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">
                                    Aucune action en lot effectuée
                                </Typography>
                            ) : (
                                <List dense>
                                    {history.map((entry) => (
                                        <ListItem key={entry.id} divider>
                                            <ListItemIcon>
                                                <CheckCircleIcon color="success" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={entry.actionLabel}
                                                secondary={
                                                    <Box>
                                                        <Typography variant="caption">
                                                            {new Date(entry.timestamp).toLocaleString()}
                                                        </Typography>
                                                        <Typography variant="caption" display="block">
                                                            {entry.affectedUsers} utilisateur{entry.affectedUsers > 1 ? 's' : ''} affecté{entry.affectedUsers > 1 ? 's' : ''}
                                                        </Typography>
                                                    </Box>
                                                }
                                            />
                                            {entry.canRollback && (
                                                <Tooltip title="Annuler cette action">
                                                    <IconButton size="small" onClick={() => rollbackAction(entry)}>
                                                        <UndoIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Paper>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Notifications */}
            <Snackbar
                open={!!snackbar}
                autoHideDuration={4000}
                onClose={() => setSnackbar(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                {snackbar && (
                    <Alert 
                        onClose={() => setSnackbar(null)} 
                        severity={snackbar.type}
                        sx={{ width: '100%' }}
                    >
                        {snackbar.message}
                    </Alert>
                )}
            </Snackbar>
        </Box>
    );
};

export default UsersBatchActions;
export { BULK_ACTIONS, useMultipleSelection };