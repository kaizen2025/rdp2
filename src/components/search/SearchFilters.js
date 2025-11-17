// src/components/search/SearchFilters.js - SYSTÈME DE FILTRES INTELLIGENTS AVANCÉS
// Composant de filtres contextuels avec sauvegarde et combinaisons puissantes

import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    FormControlLabel,
    FormGroup,
    FormLabel,
    RadioGroup,
    Radio,
    Button,
    Chip,
    IconButton,
    Tooltip,
    Slider,
    Autocomplete,
    Collapse,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemButton,
    Switch,
    Grid,
    Card,
    CardContent,
    Alert
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    FilterList as FilterIcon,
    Clear as ClearIcon,
    Save as SaveIcon,
    Delete as DeleteIcon,
    History as HistoryIcon,
    Star as StarIcon,
    Settings as SettingsIcon,
    DateRange as DateRangeIcon,
    Person as PersonIcon,
    Description as DocumentIcon,
    Schedule as ScheduleIcon,
    Label as LabelIcon,
    Download as DownloadIcon,
    Upload as UploadIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
// import { motion, AnimatePresence } from 'framer-motion'; // Removed - not installed
import { parseISO, format, isValid } from 'date-fns';

const SearchFilters = ({
    filters = {},
    facets = {},
    availableFields = [],
    onFiltersChange,
    onFiltersReset,
    onSaveFilter,
    onLoadFilter,
    onDeleteFilter,
    savedFilters = {},
    maxHeight = 500,
    collapsible = true,
    showSaveOptions = true,
    showAdvanced = true,
    className
}) => {
    const [localFilters, setLocalFilters] = useState(filters);
    const [expandedSections, setExpandedSections] = useState({
        basic: true,
        dates: false,
        advanced: false,
        custom: false
    });
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [newFilterName, setNewFilterName] = useState('');
    const [loadDialogOpen, setLoadDialogOpen] = useState(false);

    const theme = useTheme();

    // Synchroniser les filtres locaux
    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    // Gestion des changements de filtres
    const handleFilterChange = (key, value) => {
        const updatedFilters = { ...localFilters, [key]: value };
        setLocalFilters(updatedFilters);
        
        if (onFiltersChange) {
            onFiltersChange(updatedFilters);
        }
    };

    // Gestion des filtres multiples
    const handleMultiSelectChange = (key, values) => {
        handleFilterChange(key, values);
    };

    // Gestion des filtres de plage de dates
    const handleDateRangeChange = (type, date) => {
        const updatedFilters = {
            ...localFilters,
            [`date${type.charAt(0).toUpperCase() + type.slice(1)}`]: date ? date.toISOString() : null
        };
        
        setLocalFilters(updatedFilters);
        if (onFiltersChange) {
            onFiltersChange(updatedFilters);
        }
    };

    // Réinitialiser les filtres
    const handleResetFilters = () => {
        setLocalFilters({});
        if (onFiltersReset) {
            onFiltersReset();
        }
    };

    // Toggle des sections collapse
    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Sauvegarder un filtre
    const handleSaveFilter = () => {
        if (newFilterName.trim() && onSaveFilter) {
            onSaveFilter(newFilterName.trim(), localFilters);
            setNewFilterName('');
            setSaveDialogOpen(false);
        }
    };

    // Charger un filtre
    const handleLoadFilter = (filterName, filterConfig) => {
        setLocalFilters(filterConfig.filters || {});
        if (onLoadFilter) {
            onLoadFilter(filterName, filterConfig);
        }
        setLoadDialogOpen(false);
    };

    // Supprimer un filtre sauvegardé
    const handleDeleteFilter = (filterName) => {
        if (onDeleteFilter) {
            onDeleteFilter(filterName);
        }
    };

    // Options pour les filtres
    const filterOptions = useMemo(() => {
        const options = {
            status: [
                { value: 'active', label: 'Actif', color: 'success' },
                { value: 'reserved', label: 'Réservé', color: 'info' },
                { value: 'overdue', label: 'En retard', color: 'warning' },
                { value: 'critical', label: 'Critique', color: 'error' },
                { value: 'returned', label: 'Retourné', color: 'default' },
                { value: 'cancelled', label: 'Annulé', color: 'default' }
            ],
            alertLevel: [
                { value: 'low', label: 'Faible', color: 'success' },
                { value: 'medium', label: 'Moyen', color: 'warning' },
                { value: 'high', label: 'Élevé', color: 'error' },
                { value: 'critical', label: 'Critique', color: 'error' }
            ],
            documentType: Object.entries(facets.documentType || {}).map(([type, count]) => ({
                value: type,
                label: `${type} (${count})`,
                count
            })),
            borrowerName: Object.entries(facets.borrowerName || {}).map(([name, count]) => ({
                value: name,
                label: `${name} (${count})`,
                count
            }))
        };
        return options;
    }, [facets]);

    // Composant de filtre basique
    const BasicFilters = () => (
        <Box sx={{ p: 2 }}>
            <Grid container spacing={2}>
                {/* Recherche textuelle */}
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="Recherche textuelle"
                        value={localFilters.search || ''}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        placeholder="Rechercher dans tous les champs..."
                        size="small"
                    />
                </Grid>

                {/* Statut */}
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Statut</InputLabel>
                        <Select
                            value={localFilters.status || ''}
                            label="Statut"
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                        >
                            <MenuItem value="">Tous</MenuItem>
                            {filterOptions.status.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Chip 
                                            label={option.label} 
                                            color={option.color} 
                                            size="small" 
                                        />
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                {/* Niveau d'alerte */}
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Niveau d'alerte</InputLabel>
                        <Select
                            value={localFilters.alertLevel || ''}
                            label="Niveau d'alerte"
                            onChange={(e) => handleFilterChange('alertLevel', e.target.value)}
                        >
                            <MenuItem value="">Tous</MenuItem>
                            {filterOptions.alertLevel.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    <Chip 
                                        label={option.label} 
                                        color={option.color} 
                                        size="small" 
                                    />
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                {/* Type de document (autocomplete multiple) */}
                <Grid item xs={12}>
                    <Autocomplete
                        multiple
                        options={filterOptions.documentType}
                        getOptionLabel={(option) => option.label}
                        value={localFilters.documentTypes || []}
                        onChange={(_, newValue) => handleFilterChange('documentTypes', newValue.map(v => v.value))}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Types de documents"
                                placeholder="Sélectionner..."
                                size="small"
                            />
                        )}
                        renderOption={(props, option) => (
                            <MenuItem {...props}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                    <Typography variant="body2">{option.label}</Typography>
                                    <Chip label={option.count} size="small" variant="outlined" />
                                </Box>
                            </MenuItem>
                        )}
                    />
                </Grid>

                {/* Emprunteurs (autocomplete multiple) */}
                <Grid item xs={12}>
                    <Autocomplete
                        multiple
                        options={filterOptions.borrowerName}
                        getOptionLabel={(option) => option.label}
                        value={localFilters.borrowers || []}
                        onChange={(_, newValue) => handleFilterChange('borrowers', newValue.map(v => v.value))}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Emprunteurs"
                                placeholder="Sélectionner..."
                                size="small"
                            />
                        )}
                        renderOption={(props, option) => (
                            <MenuItem {...props}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                    <Typography variant="body2">{option.label}</Typography>
                                    <Chip label={option.count} size="small" variant="outlined" />
                                </Box>
                            </MenuItem>
                        )}
                    />
                </Grid>
            </Grid>
        </Box>
    );

    // Composant de filtres de dates
    const DateFilters = () => (
        <Box sx={{ p: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <DatePicker
                            label="Date d'emprunt (début)"
                            value={localFilters.loanDateStart ? parseISO(localFilters.loanDateStart) : null}
                            onChange={(date) => handleDateRangeChange('loanStart', date)}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    size: 'small'
                                }
                            }}
                        />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                        <DatePicker
                            label="Date d'emprunt (fin)"
                            value={localFilters.loanDateEnd ? parseISO(localFilters.loanDateEnd) : null}
                            onChange={(date) => handleDateRangeChange('loanEnd', date)}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    size: 'small'
                                }
                            }}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <DatePicker
                            label="Date de retour (début)"
                            value={localFilters.returnDateStart ? parseISO(localFilters.returnDateStart) : null}
                            onChange={(date) => handleDateRangeChange('returnStart', date)}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    size: 'small'
                                }
                            }}
                        />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                        <DatePicker
                            label="Date de retour (fin)"
                            value={localFilters.returnDateEnd ? parseISO(localFilters.returnDateEnd) : null}
                            onChange={(date) => handleDateRangeChange('returnEnd', date)}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    size: 'small'
                                }
                            }}
                        />
                    </Grid>
                </Grid>
            </LocalizationProvider>
        </Box>
    );

    // Composant de filtres avancés
    const AdvancedFilters = () => (
        <Box sx={{ p: 2 }}>
            <Grid container spacing={2}>
                {/* Durée des prêts */}
                <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                        Durée des prêts (jours)
                    </Typography>
                    <Slider
                        value={localFilters.durationRange || [0, 30]}
                        onChange={(_, value) => handleFilterChange('durationRange', value)}
                        valueLabelDisplay="auto"
                        min={0}
                        max={30}
                        marks={[
                            { value: 0, label: '0j' },
                            { value: 7, label: '1 sem' },
                            { value: 14, label: '2 sem' },
                            { value: 30, label: '1 mois' }
                        ]}
                    />
                </Grid>

                {/* Tri par pertinence */}
                <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Trier par</InputLabel>
                        <Select
                            value={localFilters.sortBy || 'relevance'}
                            label="Trier par"
                            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                        >
                            <MenuItem value="relevance">Pertinence</MenuItem>
                            <MenuItem value="dateDesc">Date d'emprunt (plus récent)</MenuItem>
                            <MenuItem value="dateAsc">Date d'emprunt (plus ancien)</MenuItem>
                            <MenuItem value="returnDateAsc">Date de retour (plus tôt)</MenuItem>
                            <MenuItem value="borrowerName">Nom de l'emprunteur</MenuItem>
                            <MenuItem value="documentTitle">Titre du document</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                {/* Options avancées */}
                <Grid item xs={12}>
                    <FormGroup>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={localFilters.includeReturned || false}
                                    onChange={(e) => handleFilterChange('includeReturned', e.target.checked)}
                                />
                            }
                            label="Inclure les prêts retournés"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={localFilters.fuzzySearch !== false}
                                    onChange={(e) => handleFilterChange('fuzzySearch', e.target.checked)}
                                />
                            }
                            label="Recherche approximative (fuzzy)"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={localFilters.caseSensitive || false}
                                    onChange={(e) => handleFilterChange('caseSensitive', e.target.checked)}
                                />
                            }
                            label="Respecter la casse"
                        />
                    </FormGroup>
                </Grid>
            </Grid>
        </Box>
    );

    // Composant de gestion des filtres sauvegardés
    const SavedFiltersManager = () => (
        <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle2" gutterBottom>
                Filtres sauvegardés
            </Typography>
            
            {Object.keys(savedFilters).length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                    Aucun filtre sauvegardé
                </Typography>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {Object.entries(savedFilters).map(([name, config]) => (
                        <Paper
                            key={name}
                            variant="outlined"
                            sx={{
                                p: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <StarIcon fontSize="small" color="warning" />
                                <Typography variant="body2">{name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {format(parseISO(config.timestamp), 'dd/MM/yyyy', { locale: fr })}
                                </Typography>
                            </Box>
                            <Box>
                                <Button
                                    size="small"
                                    onClick={() => handleLoadFilter(name, config)}
                                >
                                    Charger
                                </Button>
                                <IconButton
                                    size="small"
                                    onClick={() => handleDeleteFilter(name)}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </Paper>
                    ))}
                </Box>
            )}
        </Box>
    );

    // Compter les filtres actifs
    const activeFiltersCount = useMemo(() => {
        return Object.values(localFilters).filter(value => 
            value !== null && value !== undefined && value !== '' &&
            (Array.isArray(value) ? value.length > 0 : true)
        ).length;
    }, [localFilters]);

    return (
        <Paper
            className={className}
            elevation={3}
            sx={{
                maxHeight,
                overflow: 'auto',
                position: 'relative'
            }}
        >
            {/* En-tête */}
            <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FilterIcon color="primary" />
                        <Typography variant="h6">
                            Filtres de recherche
                        </Typography>
                        {activeFiltersCount > 0 && (
                            <Chip
                                label={activeFiltersCount}
                                color="primary"
                                size="small"
                            />
                        )}
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            size="small"
                            startIcon={<ClearIcon />}
                            onClick={handleResetFilters}
                            disabled={activeFiltersCount === 0}
                        >
                            Effacer
                        </Button>
                        
                        {showSaveOptions && (
                            <Button
                                size="small"
                                startIcon={<SaveIcon />}
                                onClick={() => setSaveDialogOpen(true)}
                                disabled={activeFiltersCount === 0}
                            >
                                Sauvegarder
                            </Button>
                        )}
                    </Box>
                </Box>
            </Box>

            {/* Filtres basiques */}
            <Box>
                {collapsible ? (
                    <Box>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                p: 2,
                                cursor: 'pointer',
                                '&:hover': {
                                    backgroundColor: alpha(theme.palette.action.hover, 0.5)
                                }
                            }}
                            onClick={() => toggleSection('basic')}
                        >
                            <Typography variant="subtitle1">Filtres de base</Typography>
                            {expandedSections.basic ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </Box>
                        <Collapse in={expandedSections.basic}>
                            <BasicFilters />
                        </Collapse>
                    </Box>
                ) : (
                    <BasicFilters />
                )}
            </Box>

            <Divider />

            {/* Filtres de dates */}
            {collapsible ? (
                <Box>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 2,
                            cursor: 'pointer',
                            '&:hover': {
                                backgroundColor: alpha(theme.palette.action.hover, 0.5)
                            }
                        }}
                        onClick={() => toggleSection('dates')}
                    >
                        <Typography variant="subtitle1">
                            <DateRangeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Plages de dates
                        </Typography>
                        {expandedSections.dates ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </Box>
                    <Collapse in={expandedSections.dates}>
                        <DateFilters />
                    </Collapse>
                </Box>
            ) : (
                <Box>
                    <Typography variant="subtitle1" sx={{ p: 2, pb: 1 }}>
                        <DateRangeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Plages de dates
                    </Typography>
                    <DateFilters />
                </Box>
            )}

            {showAdvanced && (
                <>
                    <Divider />
                    {/* Filtres avancés */}
                    {collapsible ? (
                        <Box>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    p: 2,
                                    cursor: 'pointer',
                                    '&:hover': {
                                        backgroundColor: alpha(theme.palette.action.hover, 0.5)
                                    }
                                }}
                                onClick={() => toggleSection('advanced')}
                            >
                                <Typography variant="subtitle1">
                                    <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    Filtres avancés
                                </Typography>
                                {expandedSections.advanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </Box>
                            <Collapse in={expandedSections.advanced}>
                                <AdvancedFilters />
                            </Collapse>
                        </Box>
                    ) : (
                        <Box>
                            <Typography variant="subtitle1" sx={{ p: 2, pb: 1 }}>
                                <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Filtres avancés
                            </Typography>
                            <AdvancedFilters />
                        </Box>
                    )}
                </>
            )}

            {/* Gestion des filtres sauvegardés */}
            {showSaveOptions && (
                <>
                    <Divider />
                    <SavedFiltersManager />
                </>
            )}

            {/* Dialogue de sauvegarde */}
                {saveDialogOpen && (
                    <Box
                        sx={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            zIndex: 1200,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            p: 2
                        }}
                        onClick={() => setSaveDialogOpen(false)}
                    >
                        <Paper
                            sx={{
                                p: 3,
                                maxWidth: 400,
                                width: '100%'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Typography variant="h6" gutterBottom>
                                Sauvegarder le filtre
                            </Typography>
                            <TextField
                                fullWidth
                                label="Nom du filtre"
                                value={newFilterName}
                                onChange={(e) => setNewFilterName(e.target.value)}
                                placeholder="ex: Prêts en retard cette semaine"
                                sx={{ mb: 2 }}
                            />
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                <Button onClick={() => setSaveDialogOpen(false)}>
                                    Annuler
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={handleSaveFilter}
                                    disabled={!newFilterName.trim()}
                                >
                                    Sauvegarder
                                </Button>
                            </Box>
                        </Paper>
                    </Box>
                )}

            {/* Message si aucun filtre */}
            {activeFiltersCount === 0 && (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <FilterIcon fontSize="large" color="disabled" sx={{ mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                        Aucun filtre actif
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        Utilisez les filtres ci-dessus pour affiner votre recherche
                    </Typography>
                </Box>
            )}
        </Paper>
    );
};

export default React.memo(SearchFilters);
