// src/components/bulk/BulkProgressIndicator.js
// Indicateur de progression visuel pour les actions groupées avec statistiques en temps réel

import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    LinearProgress,
    CircularProgress,
    Chip,
    Stack,
    Button,
    Collapse,
    Fade,
    IconButton,
    Tooltip,
    Card,
    CardContent,
    Alert,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
    Badge,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    CheckCircle as SuccessIcon,
    Error as ErrorIcon,
    Schedule as PendingIcon,
    Cancel as CancelIcon,
    Refresh as RefreshIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    PlayArrow as PlayIcon,
    Pause as PauseIcon,
    Stop as StopIcon,
    Speed as SpeedIcon,
    Timeline as TimelineIcon,
    Analytics as AnalyticsIcon,
    Warning as WarningIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const BULK_ACTION_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    SUCCESS: 'success',
    ERROR: 'error',
    CANCELLED: 'cancelled',
    PAUSED: 'paused'
};

const STATUS_CONFIG = {
    pending: { 
        color: 'info', 
        icon: <PendingIcon />, 
        label: 'En attente',
        bgColor: 'info.light',
        textColor: 'info.contrastText'
    },
    processing: { 
        color: 'primary', 
        icon: <CircularProgress size={16} color="inherit" />, 
        label: 'En cours',
        bgColor: 'primary.light',
        textColor: 'primary.contrastText'
    },
    success: { 
        color: 'success', 
        icon: <SuccessIcon />, 
        label: 'Terminé',
        bgColor: 'success.light',
        textColor: 'success.contrastText'
    },
    error: { 
        color: 'error', 
        icon: <ErrorIcon />, 
        label: 'Échec',
        bgColor: 'error.light',
        textColor: 'error.contrastText'
    },
    cancelled: { 
        color: 'warning', 
        icon: <CancelIcon />, 
        label: 'Annulé',
        bgColor: 'warning.light',
        textColor: 'warning.contrastText'
    },
    paused: { 
        color: 'secondary', 
        icon: <PauseIcon />, 
        label: 'En pause',
        bgColor: 'secondary.light',
        textColor: 'secondary.contrastText'
    }
};

const BulkProgressIndicator = ({
    progress = 0,
    step = '',
    action = null,
    isProcessing = false,
    showDetails = false,
    onPause = null,
    onResume = null,
    onCancel = null,
    batchProgress = null,
    totalBatches = 0,
    currentBatch = 0,
    startTime = null,
    estimatedTimeRemaining = null,
    itemsProcessed = 0,
    totalItems = 0,
    errors = [],
    warnings = [],
    auditInfo = null,
    className
}) => {
    // États locaux
    const [expanded, setExpanded] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Mise à jour du temps toutes les secondes
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Calcul du temps écoulé
    useEffect(() => {
        if (startTime && !isPaused) {
            const elapsed = Math.floor((currentTime.getTime() - new Date(startTime).getTime()) / 1000);
            setElapsedTime(elapsed);
        }
    }, [currentTime, startTime, isPaused]);

    // Gestionnaires d'événements
    const handleToggleExpanded = () => {
        setExpanded(!expanded);
    };

    const handlePause = () => {
        setIsPaused(true);
        onPause?.();
    };

    const handleResume = () => {
        setIsPaused(false);
        onResume?.();
    };

    const handleCancel = () => {
        onCancel?.();
    };

    // Calculs de performance
    const progressPercentage = totalItems > 0 ? (itemsProcessed / totalItems) * 100 : progress;
    const speed = elapsedTime > 0 ? itemsProcessed / elapsedTime : 0; // items par seconde
    const remainingItems = Math.max(0, totalItems - itemsProcessed);
    const estimatedTime = speed > 0 ? remainingItems / speed : 0;

    // Formatage du temps
    const formatDuration = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    };

    // Thème et responsive
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    if (!isProcessing && progress === 0 && !auditInfo) {
        return null;
    }

    const statusInfo = isPaused ? STATUS_CONFIG.paused : 
                      isProcessing ? STATUS_CONFIG.processing :
                      progress === 100 ? STATUS_CONFIG.success :
                      STATUS_CONFIG.pending;

    return (
        <Fade in={true}>
            <Paper className={className} sx={{ mb: 2, overflow: 'hidden' }}>
                {/* Barre principale de progression */}
                <Card elevation={2}>
                    <CardContent sx={{ pb: 2 }}>
                        {/* En-tête avec informations principales */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {action?.icon}
                                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                        {action?.label || 'Action en cours'}
                                    </Typography>
                                </Box>
                                
                                <Chip
                                    icon={statusInfo.icon}
                                    label={statusInfo.label}
                                    color={statusInfo.color}
                                    variant="filled"
                                    size="small"
                                />
                            </Box>

                            {/* Boutons de contrôle */}
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                {isProcessing && (
                                    <>
                                        <Tooltip title={isPaused ? "Reprendre" : "Suspendre"}>
                                            <IconButton
                                                onClick={isPaused ? handleResume : handlePause}
                                                size="small"
                                                color={isPaused ? 'success' : 'warning'}
                                            >
                                                {isPaused ? <PlayIcon /> : <PauseIcon />}
                                            </IconButton>
                                        </Tooltip>
                                        
                                        <Tooltip title="Annuler">
                                            <IconButton
                                                onClick={handleCancel}
                                                size="small"
                                                color="error"
                                            >
                                                <StopIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </>
                                )}
                                
                                <Tooltip title={expanded ? "Masquer les détails" : "Afficher les détails"}>
                                    <IconButton
                                        onClick={handleToggleExpanded}
                                        size="small"
                                    >
                                        {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>

                        {/* Informations de progression principales */}
                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    {step || 'Traitement en cours...'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {itemsProcessed}/{totalItems} ({Math.round(progressPercentage)}%)
                                </Typography>
                            </Box>
                            
                            <LinearProgress
                                variant="determinate"
                                value={progressPercentage}
                                sx={{
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: 'grey.200',
                                    '& .MuiLinearProgress-bar': {
                                        borderRadius: 4,
                                        backgroundColor: isPaused ? 'secondary.main' : 
                                                      progressPercentage === 100 ? 'success.main' : 'primary.main'
                                    }
                                }}
                            />
                        </Box>

                        {/* Statistiques rapides */}
                        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                            <Chip
                                size="small"
                                icon={<SpeedIcon />}
                                label={`${speed.toFixed(1)}/s`}
                                variant="outlined"
                                color="primary"
                            />
                            
                            <Chip
                                size="small"
                                icon={<TimelineIcon />}
                                label={`${formatDuration(elapsedTime)} écoulées`}
                                variant="outlined"
                                color="info"
                            />
                            
                            {estimatedTime > 0 && (
                                <Chip
                                    size="small"
                                    icon={<ScheduleIcon />}
                                    label={`${formatDuration(estimatedTime)} restantes`}
                                    variant="outlined"
                                    color="warning"
                                />
                            )}
                            
                            {totalBatches > 0 && (
                                <Chip
                                    size="small"
                                    label={`Lot ${currentBatch}/${totalBatches}`}
                                    variant="outlined"
                                    color="secondary"
                                />
                            )}
                            
                            {errors.length > 0 && (
                                <Chip
                                    size="small"
                                    icon={<ErrorIcon />}
                                    label={`${errors.length} erreur${errors.length > 1 ? 's' : ''}`}
                                    color="error"
                                    variant="filled"
                                />
                            )}
                            
                            {warnings.length > 0 && (
                                <Chip
                                    size="small"
                                    icon={<WarningIcon />}
                                    label={`${warnings.length} avertissement${warnings.length > 1 ? 's' : ''}`}
                                    color="warning"
                                    variant="outlined"
                                />
                            )}
                        </Stack>
                    </CardContent>

                    {/* Détails expandables */}
                    <Collapse in={expanded}>
                        <Divider />
                        <CardContent sx={{ pt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Détails du traitement
                            </Typography>
                            
                            <List dense>
                                {/* Progression par lots */}
                                {batchProgress && (
                                    <ListItem>
                                        <ListItemIcon>
                                            <AnalyticsIcon color="primary" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Progression par lots"
                                            secondary={`Lot actuel: ${currentBatch}/${totalBatches}`}
                                        />
                                        <ListItemSecondaryAction>
                                            <LinearProgress
                                                variant="determinate"
                                                value={batchProgress}
                                                sx={{ width: 100, mr: 2 }}
                                            />
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                )}
                                
                                {/* Temps de traitement */}
                                <ListItem>
                                    <ListItemIcon>
                                        <TimelineIcon color="info" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="Temps de traitement"
                                        secondary={`Commencé il y a ${formatDistanceToNow(new Date(startTime), { addSuffix: true, locale: fr })}`}
                                    />
                                </ListItem>
                                
                                {/* Performance */}
                                <ListItem>
                                    <ListItemIcon>
                                        <SpeedIcon color="success" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="Performance"
                                        secondary={`${speed.toFixed(2)} éléments/seconde`}
                                    />
                                </ListItem>
                                
                                {/* Erreurs récentes */}
                                {errors.length > 0 && (
                                    <ListItem>
                                        <ListItemIcon>
                                            <ErrorIcon color="error" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Dernières erreurs"
                                            secondary={
                                                <Box>
                                                    {errors.slice(-3).map((error, index) => (
                                                        <Typography key={index} variant="caption" display="block" color="error">
                                                            • {error.message || error}
                                                        </Typography>
                                                    ))}
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                )}
                                
                                {/* Avertissements */}
                                {warnings.length > 0 && (
                                    <ListItem>
                                        <ListItemIcon>
                                            <WarningIcon color="warning" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Avertissements"
                                            secondary={
                                                <Box>
                                                    {warnings.slice(-3).map((warning, index) => (
                                                        <Typography key={index} variant="caption" display="block" color="warning.main">
                                                            • {warning.message || warning}
                                                        </Typography>
                                                    ))}
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                )}
                            </List>
                            
                            {/* Alertes en cas de problème */}
                            {progressPercentage < 100 && speed < 0.1 && elapsedTime > 30 && (
                                <Alert severity="warning" sx={{ mt: 2 }}>
                                    <Typography variant="body2">
                                        <strong>Traitement lent détecté:</strong> Le traitement avance très lentement. 
                                        Il pourrait y avoir un problème de connexion ou de charge serveur.
                                    </Typography>
                                </Alert>
                            )}
                            
                            {progressPercentage === 100 && errors.length > 0 && (
                                <Alert severity="warning" sx={{ mt: 2 }}>
                                    <Typography variant="body2">
                                        <strong>Traitement terminé avec erreurs:</strong> {errors.length} erreur{errors.length > 1 ? 's' : ''} 
                                        sont survenues. Vérifiez les détails pour plus d'informations.
                                    </Typography>
                                </Alert>
                            )}
                        </CardContent>
                    </Collapse>
                </Card>
            </Paper>
        </Fade>
    );
};

// Composant pour l'affichage de l'état d'achèvement
export const BulkActionCompletedIndicator = ({ 
    result, 
    action, 
    duration,
    onViewDetails = null,
    onDownload = null,
    className 
}) => {
    const [showDetails, setShowDetails] = useState(false);
    
    const formatDuration = (milliseconds) => {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}s`;
        }
        return `${remainingSeconds}s`;
    };

    return (
        <Paper className={className} sx={{ p: 2, border: '2px solid', borderColor: 'success.main' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <SuccessIcon color="success" />
                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                        {action?.label || 'Action'} terminée
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {result.successful} opération{result.successful > 1 ? 's' : ''} réussie{result.successful > 1 ? 's' : ''}
                        {result.failed > 0 && `, ${result.failed} échec${result.failed > 1 ? 's' : ''}`}
                        • Durée: {formatDuration(duration)}
                    </Typography>
                </Box>
                
                <Stack direction="row" spacing={1}>
                    {result.successRate && result.successRate < 100 && (
                        <Chip
                            icon={<WarningIcon />}
                            label={`${Math.round(result.successRate)}% succès`}
                            color="warning"
                            variant="outlined"
                            size="small"
                        />
                    )}
                    
                    {onViewDetails && (
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={onViewDetails}
                        >
                            Détails
                        </Button>
                    )}
                    
                    {onDownload && result.downloadUrl && (
                        <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => onDownload(result.downloadUrl)}
                        >
                            Télécharger
                        </Button>
                    )}
                </Stack>
            </Box>
            
            {/* Détails expandables */}
            {result.errors && result.errors.length > 0 && (
                <Box sx={{ mt: 2 }}>
                    <Button
                        size="small"
                        variant="text"
                        startIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        onClick={() => setShowDetails(!showDetails)}
                    >
                        {showDetails ? 'Masquer' : 'Afficher'} les erreurs ({result.errors.length})
                    </Button>
                    
                    <Collapse in={showDetails}>
                        <Box sx={{ mt: 1 }}>
                            <List dense>
                                {result.errors.map((error, index) => (
                                    <ListItem key={index}>
                                        <ListItemIcon>
                                            <ErrorIcon color="error" fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={error.loanId || `Erreur ${index + 1}`}
                                            secondary={error.error || error.message}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    </Collapse>
                </Box>
            )}
        </Paper>
    );
};

export default React.memo(BulkProgressIndicator);
export { BULK_ACTION_STATUS };