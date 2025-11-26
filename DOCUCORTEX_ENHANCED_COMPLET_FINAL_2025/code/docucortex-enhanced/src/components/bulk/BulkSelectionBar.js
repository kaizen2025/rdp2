// src/components/bulk/BulkSelectionBar.js
// Barre de sélection intelligente avec filtres rapides et statistiques

import React, { useState } from 'react';
import {
    Box,
    Paper,
    Toolbar,
    Typography,
    Button,
    ButtonGroup,
    IconButton,
    Tooltip,
    Chip,
    Stack,
    Menu,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    LinearProgress,
    Collapse,
    Alert,
    Badge,
    Divider,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import {
    SelectAll as SelectAllIcon,
    Clear as ClearIcon,
    FilterList as FilterIcon,
    ExpandMore as ExpandMoreIcon,
    Warning as WarningIcon,
    Error as ErrorIcon,
    Schedule as ScheduleIcon,
    Person as PersonIcon,
    Group as GroupIcon,
    Dashboard as StatsIcon,
    CheckCircle as CheckIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const BULK_SELECTION_PRESETS = [
    {
        id: 'overdue',
        label: 'En retard',
        icon: <ErrorIcon />,
        color: 'error',
        description: 'Prêts en retard de retour',
        filter: (loan) => {
            const alertStatus = require('../../services/alertsService').default.calculateAlertStatus(loan);
            return alertStatus?.isOverdue;
        }
    },
    {
        id: 'critical',
        label: 'Critiques',
        icon: <WarningIcon />,
        color: 'warning',
        description: 'Prêts avec alertes critiques',
        filter: (loan) => {
            const alertStatus = require('../../services/alertsService').default.calculateAlertStatus(loan);
            return alertStatus?.level?.level === 4;
        }
    },
    {
        id: 'due-today',
        label: 'Échéance aujourd\'hui',
        icon: <ScheduleIcon />,
        color: 'info',
        description: 'Prêts à retourner aujourd\'hui',
        filter: (loan) => {
            const alertStatus = require('../../services/alertsService').default.calculateAlertStatus(loan);
            return alertStatus?.daysUntilReturn === 0;
        }
    },
    {
        id: 'due-tomorrow',
        label: 'Échéance demain',
        icon: <ScheduleIcon />,
        color: 'primary',
        description: 'Prêts à retourner demain',
        filter: (loan) => {
            const alertStatus = require('../../services/alertsService').default.calculateAlertStatus(loan);
            return alertStatus?.daysUntilReturn === 1;
        }
    },
    {
        id: 'active',
        label: 'Prêts actifs',
        icon: <CheckIcon />,
        color: 'success',
        description: 'Prêts en cours',
        filter: (loan) => loan.status === 'active'
    },
    {
        id: 'expired-user',
        label: 'Utilisateurs avec prêts expirés',
        icon: <PersonIcon />,
        color: 'secondary',
        description: 'Regrouper par utilisateur',
        filter: (loan) => {
            const alertStatus = require('../../services/alertsService').default.calculateAlertStatus(loan);
            return alertStatus?.isOverdue;
        },
        groupBy: 'borrowerId'
    }
];

const BulkSelectionBar = ({
    selectedCount = 0,
    totalCount = 0,
    selectionStats = {},
    onSelectAll,
    onClearSelection,
    onQuickSelect,
    quickSelectFilter = '',
    maxBulkActions = 100,
    isProcessing = false,
    className
}) => {
    // États locaux
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
    const [statsMenuAnchor, setStatsMenuAnchor] = useState(null);

    // Calculs de progression
    const selectionProgress = totalCount > 0 ? (selectedCount / totalCount) * 100 : 0;
    const isNearLimit = selectedCount > maxBulkActions * 0.8;
    const isOverLimit = selectedCount > maxBulkActions;

    // Gestionnaires d'événements
    const handleQuickSelect = (presetId) => {
        onQuickSelect?.(presetId);
        setFilterMenuAnchor(null);
    };

    const handleSelectAllVisible = () => {
        onSelectAll?.();
    };

    const handleClearSelection = () => {
        onClearSelection?.();
    };

    // Rendu des statistiques rapides
    const renderQuickStats = () => (
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            <Chip
                size="small"
                label={`${selectedCount}/${totalCount}`}
                color={selectedCount === totalCount ? 'success' : 'primary'}
                variant="outlined"
                icon={<GroupIcon />}
            />
            
            {selectionStats.overdue > 0 && (
                <Chip
                    size="small"
                    label={`${selectionStats.overdue} en retard`}
                    color="error"
                    variant="outlined"
                    icon={<ErrorIcon />}
                />
            )}
            
            {selectionStats.critical > 0 && (
                <Chip
                    size="small"
                    label={`${selectionStats.critical} critiques`}
                    color="warning"
                    variant="outlined"
                    icon={<WarningIcon />}
                />
            )}
            
            {selectionStats.dueToday > 0 && (
                <Chip
                    size="small"
                    label={`${selectionStats.dueToday} aujourd'hui`}
                    color="info"
                    variant="outlined"
                    icon={<ScheduleIcon />}
                />
            )}
        </Stack>
    );

    return (
        <Paper className={className} sx={{ mb: 2 }}>
            {/* Barre principale */}
            <Toolbar 
                sx={{ 
                    gap: 2, 
                    flexWrap: 'wrap',
                    minHeight: isProcessing ? 80 : 64,
                    transition: 'min-height 0.3s ease'
                }}
            >
                {/* Section sélection */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Sélection
                    </Typography>
                    
                    {selectedCount > 0 && (
                        <Badge 
                            badgeContent={selectedCount} 
                            color="primary"
                            sx={{
                                '& .MuiBadge-badge': {
                                    right: -3,
                                    top: 3,
                                }
                            }}
                        >
                            <GroupIcon color="primary" />
                        </Badge>
                    )}
                    
                    {isOverLimit && (
                        <Tooltip title={`Limite dépassée: ${selectedCount}/${maxBulkActions}`}>
                            <ErrorIcon color="error" />
                        </Tooltip>
                    )}
                </Box>

                {/* Actions de sélection */}
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                    <Tooltip title="Tout sélectionner">
                        <span>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<SelectAllIcon />}
                                onClick={handleSelectAllVisible}
                                disabled={isProcessing || totalCount === 0}
                            >
                                Tout sélectionner
                            </Button>
                        </span>
                    </Tooltip>

                    {selectedCount > 0 && (
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<ClearIcon />}
                            onClick={handleClearSelection}
                            disabled={isProcessing}
                        >
                            Effacer
                        </Button>
                    )}

                    {/* Menu filtres rapides */}
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<FilterIcon />}
                        endIcon={<ExpandMoreIcon />}
                        onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
                        disabled={isProcessing || totalCount === 0}
                        color={quickSelectFilter ? 'primary' : 'inherit'}
                    >
                        Filtres rapides
                    </Button>

                    {/* Menu statistiques */}
                    {selectedCount > 0 && (
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<StatsIcon />}
                            endIcon={<ExpandMoreIcon />}
                            onClick={(e) => setStatsMenuAnchor(e.currentTarget)}
                            disabled={isProcessing}
                        >
                            Statistiques
                        </Button>
                    )}
                </Stack>
            </Toolbar>

            {/* Barre de progression de sélection */}
            {totalCount > 0 && (
                <Box sx={{ px: 2, pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                            Progression de la sélection
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {Math.round(selectionProgress)}%
                        </Typography>
                    </Box>
                    <LinearProgress 
                        variant="determinate" 
                        value={selectionProgress}
                        sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: 'grey.200',
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: isNearLimit ? 'warning.main' : 'primary.main',
                                borderRadius: 3
                            }
                        }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                            0
                        </Typography>
                        <Typography 
                            variant="caption" 
                            color={isOverLimit ? 'error' : 'text.secondary'}
                            sx={{ fontWeight: isOverLimit ? 'bold' : 'normal' }}
                        >
                            {maxBulkActions} (limite)
                        </Typography>
                    </Box>
                </Box>
            )}

            {/* Statistiques de sélection */}
            {selectedCount > 0 && (
                <Box sx={{ px: 2, pb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Détails de la sélection ({selectedCount} élément{selectedCount > 1 ? 's' : ''})
                    </Typography>
                    {renderQuickStats()}
                </Box>
            )}

            {/* Alertes et avertissements */}
            {isOverLimit && (
                <Alert severity="error" sx={{ mx: 2, mb: 1 }}>
                    <Typography variant="body2">
                        <strong>Limite dépassée:</strong> Vous avez sélectionné {selectedCount} prêts, 
                        mais la limite est de {maxBulkActions}. 
                        <Button size="small" onClick={handleClearSelection}>
                            Effacer la sélection
                        </Button>
                    </Typography>
                </Alert>
            )}

            {isNearLimit && !isOverLimit && (
                <Alert severity="warning" sx={{ mx: 2, mb: 1 }}>
                    <Typography variant="body2">
                        <strong>Attention:</strong> Vous approchez de la limite ({selectedCount}/{maxBulkActions}). 
                        Les actions groupées pourraient prendre plus de temps.
                    </Typography>
                </Alert>
            )}

            {/* Accordion filtres avancés */}
            <Collapse in={showAdvancedFilters}>
                <Divider />
                <Accordion disableGutters>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle2">Filtres avancés et sélection par critères</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box sx={{ p: 2 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Utilisez les filtres ci-dessous pour sélectionner automatiquement des groupes de prêts.
                            </Typography>
                            
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                                {BULK_SELECTION_PRESETS.map((preset) => (
                                    <Tooltip key={preset.id} title={preset.description} arrow>
                                        <Button
                                            variant={quickSelectFilter === preset.id ? 'contained' : 'outlined'}
                                            size="small"
                                            startIcon={preset.icon}
                                            color={preset.color}
                                            onClick={() => handleQuickSelect(preset.id)}
                                            disabled={isProcessing}
                                        >
                                            {preset.label}
                                        </Button>
                                    </Tooltip>
                                ))}
                            </Box>
                        </Box>
                    </AccordionDetails>
                </Accordion>
            </Collapse>

            {/* Indicateur de traitement */}
            {isProcessing && (
                <>
                    <Divider />
                    <Box sx={{ px: 2, py: 1 }}>
                        <Alert severity="info" icon={<RefreshIcon />}>
                            <Typography variant="body2">
                                <strong>Traitement en cours...</strong> 
                                Les actions groupées sont en cours d'exécution. 
                                Veuillez patienter.
                            </Typography>
                        </Alert>
                    </Box>
                </>
            )}

            {/* Menu des filtres rapides */}
            <Menu
                anchorEl={filterMenuAnchor}
                open={Boolean(filterMenuAnchor)}
                onClose={() => setFilterMenuAnchor(null)}
                PaperProps={{ sx: { minWidth: 300 } }}
            >
                <Box sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Sélection rapide par critères
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Cliquez sur un filtre pour sélectionner automatiquement les prêts correspondants.
                    </Typography>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Stack spacing={1}>
                        {BULK_SELECTION_PRESETS.map((preset) => (
                            <MenuItem 
                                key={preset.id}
                                onClick={() => handleQuickSelect(preset.id)}
                                sx={{ 
                                    borderRadius: 1,
                                    '&:hover': { backgroundColor: preset.color === 'error' ? 'error.light' : 
                                                   preset.color === 'warning' ? 'warning.light' : 
                                                   preset.color === 'success' ? 'success.light' :
                                                   preset.color === 'info' ? 'info.light' :
                                                   preset.color === 'primary' ? 'primary.light' :
                                                   'secondary.light' }
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                    {preset.icon}
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                            {preset.label}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {preset.description}
                                        </Typography>
                                    </Box>
                                </Box>
                            </MenuItem>
                        ))}
                    </Stack>
                </Box>
            </Menu>

            {/* Menu des statistiques détaillées */}
            <Menu
                anchorEl={statsMenuAnchor}
                open={Boolean(statsMenuAnchor)}
                onClose={() => setStatsMenuAnchor(null)}
                PaperProps={{ sx: { minWidth: 350 } }}
            >
                <Box sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Statistiques de sélection
                    </Typography>
                    
                    <Stack spacing={2}>
                        {/* Statistiques générales */}
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
                                Vue d'ensemble
                            </Typography>
                            <Stack spacing={1}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2">Total sélectionné:</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                        {selectedCount}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2">Pourcentage:</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                        {totalCount > 0 ? Math.round((selectedCount / totalCount) * 100) : 0}%
                                    </Typography>
                                </Box>
                            </Stack>
                        </Box>

                        <Divider />

                        {/* Statistiques par statut */}
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
                                Par statut d'alerte
                            </Typography>
                            <Stack spacing={1}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ErrorIcon color="error" fontSize="small" />
                                        <Typography variant="body2">En retard:</Typography>
                                    </Box>
                                    <Chip size="small" label={selectionStats.overdue} color="error" />
                                </Box>
                                
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <WarningIcon color="warning" fontSize="small" />
                                        <Typography variant="body2">Critiques:</Typography>
                                    </Box>
                                    <Chip size="small" label={selectionStats.critical} color="warning" />
                                </Box>
                                
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ScheduleIcon color="info" fontSize="small" />
                                        <Typography variant="body2">Aujourd'hui:</Typography>
                                    </Box>
                                    <Chip size="small" label={selectionStats.dueToday} color="info" />
                                </Box>
                            </Stack>
                        </Box>

                        <Divider />

                        {/* Actions suggérées */}
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
                                Actions suggérées
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {selectionStats.overdue > 0 && "• Envoyer des rappels pour les prêts en retard"}
                                {selectionStats.critical > 0 && "\n• Prolonger les prêts critiques"}
                                {selectionStats.dueToday > 0 && "\n• Notifier pour les échéances d'aujourd'hui"}
                                {selectedCount > 0 && selectionStats.overdue === 0 && selectionStats.critical === 0 && selectionStats.dueToday === 0 &&
                                    "• Exporter les données sélectionnées"}
                            </Typography>
                        </Box>
                    </Stack>
                </Box>
            </Menu>
        </Paper>
    );
};

export default React.memo(BulkSelectionBar);