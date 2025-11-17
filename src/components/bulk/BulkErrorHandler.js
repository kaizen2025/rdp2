// src/components/bulk/BulkErrorHandler.js
// Gestionnaire d'erreurs avancé pour les actions groupées avec récupération intelligente

import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Alert,
    Box,
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
    Chip,
    Collapse,
    IconButton,
    Tooltip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Paper,
    Divider,
    Stack,
    LinearProgress,
    Card,
    CardContent,
    Tab,
    Tabs,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Badge,
    Grid
} from '@mui/material';
import {
    Error as ErrorIcon,
    Warning as WarningIcon,
    Refresh as RefreshIcon,
    Undo as UndoIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    VisibilityOff as HideIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    CheckCircle as CheckIcon,
    Schedule as ScheduleIcon,
    Person as PersonIcon,
    Description as DocumentIcon,
    FilterList as FilterIcon,
    Sort as SortIcon,
    Download as DownloadIcon,
    Email as EmailIcon,
    Send as SendIcon,
    Autorenew as RetryIcon,
    Close as CloseIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// Types d'erreurs et leurs résolutions suggérées
const ERROR_TYPES = {
    NETWORK_ERROR: {
        id: 'NETWORK_ERROR',
        title: 'Erreur de réseau',
        description: 'Problème de connexion avec le serveur',
        severity: 'high',
        icon: <ErrorIcon color="error" />,
        suggestions: [
            'Vérifier votre connexion internet',
            'Réessayer dans quelques instants',
            'Contacter l\'administrateur si le problème persiste'
        ],
        canRetry: true,
        autoRetry: true
    },
    PERMISSION_DENIED: {
        id: 'PERMISSION_DENIED',
        title: 'Permissions insuffisantes',
        description: 'Vous n\'avez pas les droits pour effectuer cette action',
        severity: 'high',
        icon: <ErrorIcon color="error" />,
        suggestions: [
            'Vérifier vos permissions utilisateur',
            'Contacter votre administrateur',
            'Demander les droits nécessaires'
        ],
        canRetry: false,
        autoRetry: false
    },
    VALIDATION_ERROR: {
        id: 'VALIDATION_ERROR',
        title: 'Erreur de validation',
        description: 'Certains paramètres sont invalides',
        severity: 'medium',
        icon: <WarningIcon color="warning" />,
        suggestions: [
            'Vérifier les paramètres de l\'action',
            'Corriger les données invalides',
            'Reconfigurer l\'action avec des valeurs valides'
        ],
        canRetry: true,
        autoRetry: false
    },
    CONFLICT_ERROR: {
        id: 'CONFLICT_ERROR',
        title: 'Conflit de données',
        description: 'Des données sont en conflit avec l\'opération demandée',
        severity: 'medium',
        icon: <WarningIcon color="warning" />,
        suggestions: [
            'Vérifier les prêts en cours de modification',
            'Attendre que les opérations en cours se terminent',
            'Sélectionner des prêts disponibles'
        ],
        canRetry: true,
        autoRetry: false
    },
    SERVER_OVERLOAD: {
        id: 'SERVER_OVERLOAD',
        title: 'Surcharge serveur',
        description: 'Le serveur est temporairement indisponible',
        severity: 'high',
        icon: <ErrorIcon color="error" />,
        suggestions: [
            'Attendre quelques minutes',
            'Réessayer avec moins d\'éléments',
            'Contacter l\'administrateur si le problème persiste'
        ],
        canRetry: true,
        autoRetry: true
    },
    DATA_CORRUPTION: {
        id: 'DATA_CORRUPTION',
        title: 'Corruption de données',
        description: ' Certaines données sont corrompues ou incomplètes',
        severity: 'critical',
        icon: <ErrorIcon color="error" />,
        suggestions: [
            'Vérifier l\'intégrité des données',
            'Recharger la liste des prêts',
            'Signaler le problème à l\'administrateur'
        ],
        canRetry: false,
        autoRetry: false
    }
};

// Actions de récupération disponibles
const RECOVERY_ACTIONS = {
    RETRY: {
        id: 'RETRY',
        label: 'Réessayer',
        description: 'Relancer l\'action avec les mêmes paramètres',
        icon: <RetryIcon />,
        color: 'primary'
    },
    RETRY_WITH_REDUCED_BATCH: {
        id: 'RETRY_WITH_REDUCED_BATCH',
        label: 'Réessayer par petits lots',
        description: 'Diviser en lots plus petits pour éviter la surcharge',
        icon: <ScheduleIcon />,
        color: 'primary'
    },
    SKIP_FAILED_ITEMS: {
        id: 'SKIP_FAILED_ITEMS',
        label: 'Ignorer les éléments échoués',
        description: 'Continuer avec seulement les éléments qui ont réussi',
        icon: <CloseIcon />,
        color: 'warning'
    },
    PARTIAL_SUCCESS: {
        id: 'PARTIAL_SUCCESS',
        label: 'Accepter le succès partiel',
        description: 'Confirmer les opérations qui ont réussi',
        icon: <CheckIcon />,
        color: 'success'
    },
    ROLLBACK: {
        id: 'ROLLBACK',
        label: 'Annuler les modifications',
        description: 'Restaurer l\'état précédent pour les éléments réussis',
        icon: <UndoIcon />,
        color: 'error'
    }
};

const BulkErrorHandler = ({
    open,
    error,
    onClose,
    onRetry,
    onAcceptPartial,
    onRollback,
    failedLoans = [],
    currentAction = null,
    totalProcessed = 0,
    successfulCount = 0,
    failedCount = 0,
    className
}) => {
    // États locaux
    const [selectedTab, setSelectedTab] = useState(0);
    const [expandedSections, setExpandedSections] = useState(new Set(['overview']));
    const [filteredErrors, setFilteredErrors] = useState([]);
    const [sortConfig, setSortConfig] = useState({ field: 'loanId', direction: 'asc' });
    const [showOnlyRecoverable, setShowOnlyRecoverable] = useState(false);
    const [autoRetryInProgress, setAutoRetryInProgress] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    // Analyse de l'erreur
    const errorAnalysis = useMemo(() => {
        if (!error) return null;

        // Classification automatique de l'erreur
        let errorType = ERROR_TYPES.VALIDATION_ERROR; // défaut
        let confidence = 0.5;

        const errorMessage = error.message?.toLowerCase() || '';
        const errorCode = error.errorCode?.toLowerCase() || '';

        // Classification par message d'erreur
        if (errorMessage.includes('network') || errorMessage.includes('connexion') || errorMessage.includes('timeout')) {
            errorType = ERROR_TYPES.NETWORK_ERROR;
            confidence = 0.9;
        } else if (errorMessage.includes('permission') || errorMessage.includes('droits') || errorMessage.includes('autorisation')) {
            errorType = ERROR_TYPES.PERMISSION_DENIED;
            confidence = 0.9;
        } else if (errorMessage.includes('validation') || errorMessage.includes('invalid') || errorMessage.includes('invalide')) {
            errorType = ERROR_TYPES.VALIDATION_ERROR;
            confidence = 0.8;
        } else if (errorMessage.includes('conflict') || errorMessage.includes('conflit') || errorMessage.includes('already')) {
            errorType = ERROR_TYPES.CONFLICT_ERROR;
            confidence = 0.8;
        } else if (errorMessage.includes('overload') || errorMessage.includes('surcharge') || errorMessage.includes('busy')) {
            errorType = ERROR_TYPES.SERVER_OVERLOAD;
            confidence = 0.7;
        } else if (errorMessage.includes('corruption') || errorMessage.includes('corromp') || errorMessage.includes('integrity')) {
            errorType = ERROR_TYPES.DATA_CORRUPTION;
            confidence = 0.9;
        }

        // Calcul des métriques
        const errorRate = totalProcessed > 0 ? (failedCount / totalProcessed) * 100 : 0;
        const canRecover = failedLoans.some(loan => loan.canRetry !== false);

        return {
            type: errorType,
            confidence,
            errorRate,
            canRecover,
            retryableCount: failedLoans.filter(loan => loan.canRetry !== false).length,
            criticalErrors: failedLoans.filter(loan => loan.severity === 'critical').length
        };
    }, [error, failedLoans, totalProcessed, failedCount]);

    // Filtrage et tri des erreurs
    useEffect(() => {
        let filtered = [...failedLoans];

        // Filtrage par récupérabilité
        if (showOnlyRecoverable) {
            filtered = filtered.filter(loan => loan.canRetry !== false);
        }

        // Tri
        filtered.sort((a, b) => {
            const aValue = a[sortConfig.field];
            const bValue = b[sortConfig.field];
            
            if (sortConfig.direction === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        setFilteredErrors(filtered);
    }, [failedLoans, sortConfig, showOnlyRecoverable]);

    // Auto-retry pour certains types d'erreurs
    useEffect(() => {
        if (errorAnalysis?.type.autoRetry && retryCount < 3 && !autoRetryInProgress) {
            const timer = setTimeout(() => {
                setAutoRetryInProgress(true);
                // Simulation d'un retry automatique
                setTimeout(() => {
                    setAutoRetryInProgress(false);
                    setRetryCount(prev => prev + 1);
                    if (onRetry) {
                        onRetry();
                    }
                }, 2000);
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [errorAnalysis, retryCount, autoRetryInProgress, onRetry]);

    // Gestionnaires d'événements
    const handleTabChange = (event, newValue) => {
        setSelectedTab(newValue);
    };

    const handleToggleSection = (sectionId) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(sectionId)) {
            newExpanded.delete(sectionId);
        } else {
            newExpanded.add(sectionId);
        }
        setExpandedSections(newExpanded);
    };

    const handleSort = (field) => {
        setSortConfig({
            field,
            direction: sortConfig.field === field && sortConfig.direction === 'asc' ? 'desc' : 'asc'
        });
    };

    const handleRecoveryAction = (actionId) => {
        switch (actionId) {
            case 'RETRY':
                onRetry?.();
                break;
            case 'RETRY_WITH_REDUCED_BATCH':
                onRetry?.({ reducedBatch: true });
                break;
            case 'SKIP_FAILED_ITEMS':
                onAcceptPartial?.();
                break;
            case 'PARTIAL_SUCCESS':
                onAcceptPartial?.();
                break;
            case 'ROLLBACK':
                onRollback?.();
                break;
        }
        onClose?.();
    };

    if (!error) return null;

    const errorType = errorAnalysis?.type || ERROR_TYPES.VALIDATION_ERROR;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: { minHeight: '70vh' }
            }}
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {errorType.icon}
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            Erreur lors de l'action groupée
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {error.message || 'Une erreur inattendue s\'est produite'}
                        </Typography>
                    </Box>
                    
                    <Stack direction="row" spacing={1}>
                        <Chip
                            label={`${failedCount}/${totalProcessed} échecs`}
                            color="error"
                            variant="outlined"
                        />
                        {errorAnalysis?.confidence > 0.7 && (
                            <Chip
                                label={`${Math.round(errorAnalysis.confidence * 100)}% confiance`}
                                color="info"
                                variant="outlined"
                                size="small"
                            />
                        )}
                    </Stack>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ pt: 2 }}>
                {/* Tabs principales */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs value={selectedTab} onChange={handleTabChange}>
                        <Tab label="Vue d'ensemble" />
                        <Tab 
                            label={
                                <Badge badgeContent={failedLoans.length} color="error">
                                    Détails des erreurs
                                </Badge>
                            } 
                        />
                        <Tab label="Actions de récupération" />
                    </Tabs>
                </Box>

                {/* Onglet Vue d'ensemble */}
                {selectedTab === 0 && (
                    <Box>
                        {/* Classification de l'erreur */}
                        <Paper sx={{ p: 2, mb: 2, border: '2px solid', borderColor: `${errorType.severity === 'critical' ? 'error' : errorType.severity === 'high' ? 'warning' : 'info'}.main` }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                {errorType.icon}
                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="h6">
                                        {errorType.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {errorType.description}
                                    </Typography>
                                </Box>
                                <Chip
                                    label={`Confiance: ${Math.round(errorAnalysis.confidence * 100)}%`}
                                    color={errorAnalysis.confidence > 0.8 ? 'success' : errorAnalysis.confidence > 0.6 ? 'warning' : 'error'}
                                    size="small"
                                />
                            </Box>

                            {/* Métriques */}
                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid item xs={6} md={3}>
                                    <Card variant="outlined">
                                        <CardContent sx={{ py: 2 }}>
                                            <Typography variant="h4" color="error.main" sx={{ fontWeight: 'bold' }}>
                                                {failedCount}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Échecs
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Card variant="outlined">
                                        <CardContent sx={{ py: 2 }}>
                                            <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                                                {successfulCount}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Succès
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Card variant="outlined">
                                        <CardContent sx={{ py: 2 }}>
                                            <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                                                {Math.round(errorAnalysis.errorRate)}%
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Taux d'échec
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Card variant="outlined">
                                        <CardContent sx={{ py: 2 }}>
                                            <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                                                {errorAnalysis.retryableCount}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Récupérables
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>

                            {/* Suggestions */}
                            <Accordion>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography variant="subtitle2">
                                        Suggestions de résolution ({errorType.suggestions.length})
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <List dense>
                                        {errorType.suggestions.map((suggestion, index) => (
                                            <ListItem key={index}>
                                                <ListItemIcon>
                                                    <InfoIcon color="info" fontSize="small" />
                                                </ListItemIcon>
                                                <ListItemText primary={suggestion} />
                                            </ListItem>
                                        ))}
                                    </List>
                                </AccordionDetails>
                            </Accordion>

                            {/* Auto-retry en cours */}
                            {autoRetryInProgress && (
                                <Alert severity="info" sx={{ mt: 2 }}>
                                    <Typography variant="body2">
                                        <strong>Retry automatique en cours...</strong> Tentative {retryCount + 1}/3
                                    </Typography>
                                    <LinearProgress sx={{ mt: 1 }} />
                                </Alert>
                            )}
                        </Paper>
                    </Box>
                )}

                {/* Onglet Détails des erreurs */}
                {selectedTab === 1 && (
                    <Box>
                        {/* Filtres et contrôles */}
                        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <InputLabel>Trier par</InputLabel>
                                <Select
                                    value={sortConfig.field}
                                    onChange={(e) => handleSort(e.target.value)}
                                    label="Trier par"
                                >
                                    <MenuItem value="loanId">ID Prêt</MenuItem>
                                    <MenuItem value="error">Erreur</MenuItem>
                                    <MenuItem value="severity">Sévérité</MenuItem>
                                </Select>
                            </FormControl>

                            <Button
                                size="small"
                                startIcon={<SortIcon />}
                                onClick={() => setSortConfig(prev => ({ 
                                    ...prev, 
                                    direction: prev.direction === 'asc' ? 'desc' : 'asc' 
                                }))}
                            >
                                {sortConfig.direction === 'asc' ? 'Ascendant' : 'Descendant'}
                            </Button>

                            <Button
                                size="small"
                                startIcon={showOnlyRecoverable ? <ViewIcon /> : <HideIcon />}
                                onClick={() => setShowOnlyRecoverable(!showOnlyRecoverable)}
                                color={showOnlyRecoverable ? 'primary' : 'inherit'}
                            >
                                {showOnlyRecoverable ? 'Tout afficher' : 'Récupérables seulement'}
                            </Button>
                        </Box>

                        {/* Table des erreurs */}
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>ID Prêt</TableCell>
                                        <TableCell>Document</TableCell>
                                        <TableCell>Emprunteur</TableCell>
                                        <TableCell>Erreur</TableCell>
                                        <TableCell>Sévérité</TableCell>
                                        <TableCell>Récupérable</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredErrors.map((loanError, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                    {loanError.loanId}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {loanError.documentTitle || 'Document inconnu'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {loanError.borrowerName || loanError.borrowerId}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="error">
                                                    {loanError.error || loanError.message}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    label={loanError.severity || 'unknown'}
                                                    color={loanError.severity === 'critical' ? 'error' : 
                                                           loanError.severity === 'high' ? 'warning' : 'default'}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    label={loanError.canRetry !== false ? 'Oui' : 'Non'}
                                                    color={loanError.canRetry !== false ? 'success' : 'error'}
                                                    icon={loanError.canRetry !== false ? <CheckIcon /> : <CloseIcon />}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {filteredErrors.length === 0 && (
                            <Alert severity="info">
                                Aucune erreur ne correspond aux filtres actuels.
                            </Alert>
                        )}
                    </Box>
                )}

                {/* Onglet Actions de récupération */}
                {selectedTab === 2 && (
                    <Box>
                        <Typography variant="subtitle1" gutterBottom>
                            Choisissez une action de récupération
                        </Typography>
                        
                        <Grid container spacing={2}>
                            {/* Actions disponibles selon le contexte */}
                            {errorType.canRetry && (
                                <Grid item xs={12} md={6}>
                                    <Card variant="outlined" sx={{ cursor: 'pointer' }} onClick={() => handleRecoveryAction('RETRY')}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <RECOVERY_ACTIONS.RETRY.icon />
                                                <Typography variant="h6">
                                                    {RECOVERY_ACTIONS.RETRY.label}
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" color="text.secondary">
                                                {RECOVERY_ACTIONS.RETRY.description}
                                            </Typography>
                                            <Chip 
                                                label="Recommandé" 
                                                color="primary" 
                                                size="small" 
                                                sx={{ mt: 1 }}
                                            />
                                        </CardContent>
                                    </Card>
                                </Grid>
                            )}

                            {errorAnalysis.errorRate > 50 && (
                                <Grid item xs={12} md={6}>
                                    <Card variant="outlined" sx={{ cursor: 'pointer' }} onClick={() => handleRecoveryAction('RETRY_WITH_REDUCED_BATCH')}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <RECOVERY_ACTIONS.RETRY_WITH_REDUCED_BATCH.icon />
                                                <Typography variant="h6">
                                                    {RECOVERY_ACTIONS.RETRY_WITH_REDUCED_BATCH.label}
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" color="text.secondary">
                                                {RECOVERY_ACTIONS.RETRY_WITH_REDUCED_BATCH.description}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            )}

                            {successfulCount > 0 && (
                                <Grid item xs={12} md={6}>
                                    <Card variant="outlined" sx={{ cursor: 'pointer' }} onClick={() => handleRecoveryAction('PARTIAL_SUCCESS')}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <RECOVERY_ACTIONS.PARTIAL_SUCCESS.icon />
                                                <Typography variant="h6">
                                                    {RECOVERY_ACTIONS.PARTIAL_SUCCESS.label}
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" color="text.secondary">
                                                {RECOVERY_ACTIONS.PARTIAL_SUCCESS.description}
                                            </Typography>
                                            <Chip 
                                                label={`${successfulCount} succès`} 
                                                color="success" 
                                                size="small" 
                                                sx={{ mt: 1 }}
                                            />
                                        </CardContent>
                                    </Card>
                                </Grid>
                            )}

                            {successfulCount > 0 && (
                                <Grid item xs={12} md={6}>
                                    <Card variant="outlined" sx={{ cursor: 'pointer' }} onClick={() => handleRecoveryAction('ROLLBACK')}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <RECOVERY_ACTIONS.ROLLBACK.icon />
                                                <Typography variant="h6">
                                                    {RECOVERY_ACTIONS.ROLLBACK.label}
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" color="text.secondary">
                                                {RECOVERY_ACTIONS.ROLLBACK.description}
                                            </Typography>
                                            <Chip 
                                                label="Irreversible" 
                                                color="error" 
                                                size="small" 
                                                sx={{ mt: 1 }}
                                            />
                                        </CardContent>
                                    </Card>
                                </Grid>
                            )}
                        </Grid>

                        {/* Message d'encouragement */}
                        <Alert severity="info" sx={{ mt: 3 }}>
                            <Typography variant="body2">
                                <strong>Ne vous inquiétez pas:</strong> La plupart des erreurs peuvent être résolues. 
                                Les actions de récupération vous aideront à minimiser la perte de données et à restaurer 
                                le bon fonctionnement de votre système.
                            </Typography>
                        </Alert>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={onClose}>
                    Fermer
                </Button>
                
                {errorType.canRetry && (
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<RetryIcon />}
                        onClick={() => handleRecoveryAction('RETRY')}
                    >
                        Réessayer
                    </Button>
                )}
                
                {successfulCount > 0 && (
                    <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckIcon />}
                        onClick={() => handleRecoveryAction('PARTIAL_SUCCESS')}
                    >
                        Accepter le succès partiel
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default React.memo(BulkErrorHandler);