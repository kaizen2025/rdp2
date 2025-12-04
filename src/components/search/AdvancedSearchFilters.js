/**
 * Composant de filtres de recherche avancée
 * Permet des recherches ultra-précises avec multiples critères
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    TextField,
    Button,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Slider,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    IconButton,
    Tooltip,
    Grid,
    Autocomplete,
    Checkbox,
    FormControlLabel,
    Alert,
    Divider,
    Stack
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    Search as SearchIcon,
    FilterList as FilterIcon,
    Clear as ClearIcon,
    Save as SaveIcon,
    Restore as RestoreIcon,
    CalendarToday as CalendarIcon,
    AttachFile as FileIcon,
    Category as CategoryIcon,
    Person as PersonIcon,
    Label as LabelIcon,
    TrendingUp as TrendingIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import axios from 'axios';

const API_BASE = 'http://localhost:3002/api/ai';

function AdvancedSearchFilters({ onSearch, onSaveSearch, initialFilters = {} }) {
    // États des filtres
    const [query, setQuery] = useState('');
    const [keywords, setKeywords] = useState([]);
    const [keywordInput, setKeywordInput] = useState('');

    // Filtres de date
    const [dateStart, setDateStart] = useState(null);
    const [dateEnd, setDateEnd] = useState(null);

    // Filtres de fichiers
    const [fileTypes, setFileTypes] = useState([]);
    const [category, setCategory] = useState('');
    const [author, setAuthor] = useState('');
    const [tags, setTags] = useState([]);
    const [language, setLanguage] = useState('');

    // Filtre de montant
    const [amountRange, setAmountRange] = useState([0, 100000]);
    const [useAmountFilter, setUseAmountFilter] = useState(false);

    // Options de tri
    const [sortBy, setSortBy] = useState('relevance');

    // État du composant
    const [expanded, setExpanded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [savedSearches, setSavedSearches] = useState([]);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [savedSearchName, setSavedSearchName] = useState('');

    // Suggestions
    const [suggestions, setSuggestions] = useState([]);

    // Options prédéfinies
    const fileTypeOptions = [
        { value: 'pdf', label: 'PDF', icon: '📄' },
        { value: 'docx', label: 'Word', icon: '📝' },
        { value: 'xlsx', label: 'Excel', icon: '📊' },
        { value: 'pptx', label: 'PowerPoint', icon: '📽️' },
        { value: 'jpg', label: 'Image (JPG)', icon: '🖼️' },
        { value: 'png', label: 'Image (PNG)', icon: '🖼️' },
        { value: 'zip', label: 'Archive (ZIP)', icon: '🗜️' },
        { value: 'txt', label: 'Texte', icon: '📃' }
    ];

    const categoryOptions = [
        'Factures',
        'Devis',
        'Contrats',
        'Rapports',
        'Correspondance',
        'Documents Légaux',
        'Ressources Humaines',
        'Comptabilité',
        'Marketing',
        'Technique'
    ];

    const languageOptions = [
        { value: 'fr', label: 'Français' },
        { value: 'en', label: 'Anglais' },
        { value: 'es', label: 'Espagnol' },
        { value: 'de', label: 'Allemand' }
    ];

    const sortOptions = [
        { value: 'relevance', label: 'Pertinence' },
        { value: 'date', label: 'Date (récent d\'abord)' },
        { value: 'filename', label: 'Nom de fichier (A-Z)' },
        { value: 'size', label: 'Taille (grand d\'abord)' }
    ];

    useEffect(() => {
        loadSavedSearches();
    }, []);

    useEffect(() => {
        if (initialFilters && Object.keys(initialFilters).length > 0) {
            applyFilters(initialFilters);
        }
    }, [initialFilters]);

    const loadSavedSearches = async () => {
        try {
            const response = await axios.get(`${API_BASE}/advanced-search/saved`, {
                params: { userId: 'current' } // À remplacer par l'ID utilisateur réel
            });

            if (response.data.success) {
                setSavedSearches(response.data.searches || []);
            }
        } catch (error) {
            console.error('[AdvancedSearch] Erreur chargement recherches sauvegardées:', error);
        }
    };

    const handleAddKeyword = () => {
        if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
            setKeywords([...keywords, keywordInput.trim()]);
            setKeywordInput('');
        }
    };

    const handleRemoveKeyword = (keyword) => {
        setKeywords(keywords.filter(k => k !== keyword));
    };

    const handleAddTag = (tag) => {
        if (tag && !tags.includes(tag)) {
            setTags([...tags, tag]);
        }
    };

    const handleRemoveTag = (tag) => {
        setTags(tags.filter(t => t !== tag));
    };

    const buildFilters = () => {
        const filters = {
            keywords,
            sortBy,
            limit: 50,
            offset: 0
        };

        if (dateStart || dateEnd) {
            filters.dateRange = {
                start: dateStart ? dateStart.toISOString() : null,
                end: dateEnd ? dateEnd.toISOString() : null
            };
        }

        if (fileTypes.length > 0) {
            filters.fileTypes = fileTypes;
        }

        if (useAmountFilter && (amountRange[0] > 0 || amountRange[1] < 100000)) {
            filters.amountRange = {
                min: amountRange[0],
                max: amountRange[1]
            };
        }

        if (category) filters.category = category;
        if (author) filters.author = author;
        if (tags.length > 0) filters.tags = tags;
        if (language) filters.language = language;

        return filters;
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            const filters = buildFilters();

            console.log('[AdvancedSearch] Recherche avec filtres:', filters);

            const response = await axios.post(`${API_BASE}/advanced-search`, {
                query,
                filters
            });

            if (response.data.success && onSearch) {
                onSearch({
                    results: response.data.results,
                    total: response.data.total,
                    filters: filters,
                    executionTime: response.data.executionTime
                });
            }

        } catch (error) {
            console.error('[AdvancedSearch] Erreur recherche:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSearch = async () => {
        if (!savedSearchName.trim()) {
            return;
        }

        try {
            const filters = buildFilters();

            const response = await axios.post(`${API_BASE}/advanced-search/save`, {
                userId: 'current', // À remplacer
                name: savedSearchName,
                filters
            });

            if (response.data.success) {
                await loadSavedSearches();
                setShowSaveDialog(false);
                setSavedSearchName('');

                if (onSaveSearch) {
                    onSaveSearch(response.data);
                }
            }

        } catch (error) {
            console.error('[AdvancedSearch] Erreur sauvegarde recherche:', error);
        }
    };

    const handleLoadSavedSearch = (search) => {
        applyFilters(search.filters);
        handleSearch();
    };

    const applyFilters = (filters) => {
        if (filters.keywords) setKeywords(filters.keywords);
        if (filters.dateRange) {
            setDateStart(filters.dateRange.start ? new Date(filters.dateRange.start) : null);
            setDateEnd(filters.dateRange.end ? new Date(filters.dateRange.end) : null);
        }
        if (filters.fileTypes) setFileTypes(filters.fileTypes);
        if (filters.category) setCategory(filters.category);
        if (filters.author) setAuthor(filters.author);
        if (filters.tags) setTags(filters.tags);
        if (filters.language) setLanguage(filters.language);
        if (filters.amountRange) {
            setAmountRange([filters.amountRange.min, filters.amountRange.max]);
            setUseAmountFilter(true);
        }
        if (filters.sortBy) setSortBy(filters.sortBy);
    };

    const handleClearFilters = () => {
        setQuery('');
        setKeywords([]);
        setKeywordInput('');
        setDateStart(null);
        setDateEnd(null);
        setFileTypes([]);
        setCategory('');
        setAuthor('');
        setTags([]);
        setLanguage('');
        setAmountRange([0, 100000]);
        setUseAmountFilter(false);
        setSortBy('relevance');
    };

    const activeFiltersCount = () => {
        let count = 0;
        if (keywords.length > 0) count++;
        if (dateStart || dateEnd) count++;
        if (fileTypes.length > 0) count++;
        if (category) count++;
        if (author) count++;
        if (tags.length > 0) count++;
        if (language) count++;
        if (useAmountFilter) count++;
        return count;
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
            <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                {/* Barre de recherche principale */}
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <TextField
                        fullWidth
                        placeholder="Rechercher des documents..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        InputProps={{
                            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                    />
                    <Button
                        variant="contained"
                        startIcon={<SearchIcon />}
                        onClick={handleSearch}
                        disabled={loading}
                        sx={{ minWidth: 120 }}
                    >
                        {loading ? 'Recherche...' : 'Rechercher'}
                    </Button>
                </Box>

                {/* Indicateur de filtres actifs */}
                {activeFiltersCount() > 0 && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="body2">
                                {activeFiltersCount()} filtre(s) actif(s)
                            </Typography>
                            <Button
                                size="small"
                                startIcon={<ClearIcon />}
                                onClick={handleClearFilters}
                            >
                                Effacer tout
                            </Button>
                        </Box>
                    </Alert>
                )}

                {/* Section des filtres avancés */}
                <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FilterIcon color="primary" />
                            <Typography variant="subtitle1" fontWeight="medium">
                                Filtres Avancés
                            </Typography>
                            {activeFiltersCount() > 0 && (
                                <Chip
                                    label={activeFiltersCount()}
                                    size="small"
                                    color="primary"
                                />
                            )}
                        </Box>
                    </AccordionSummary>

                    <AccordionDetails>
                        <Grid container spacing={3}>
                            {/* Mots-clés */}
                            <Grid item xs={12}>
                                <Box>
                                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <LabelIcon fontSize="small" />
                                        Mots-clés
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                        <TextField
                                            size="small"
                                            fullWidth
                                            placeholder="Ajouter un mot-clé..."
                                            value={keywordInput}
                                            onChange={(e) => setKeywordInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                                        />
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={handleAddKeyword}
                                        >
                                            Ajouter
                                        </Button>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        {keywords.map((keyword) => (
                                            <Chip
                                                key={keyword}
                                                label={keyword}
                                                onDelete={() => handleRemoveKeyword(keyword)}
                                                color="primary"
                                                variant="outlined"
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            </Grid>

                            {/* Plage de dates */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CalendarIcon fontSize="small" />
                                    Période
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <DatePicker
                                        label="Date début"
                                        value={dateStart}
                                        onChange={setDateStart}
                                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                    />
                                    <DatePicker
                                        label="Date fin"
                                        value={dateEnd}
                                        onChange={setDateEnd}
                                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                    />
                                </Box>
                            </Grid>

                            {/* Types de fichiers */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <FileIcon fontSize="small" />
                                    Types de fichiers
                                </Typography>
                                <Autocomplete
                                    multiple
                                    size="small"
                                    options={fileTypeOptions}
                                    value={fileTypeOptions.filter(opt => fileTypes.includes(opt.value))}
                                    onChange={(e, newValue) => setFileTypes(newValue.map(v => v.value))}
                                    getOptionLabel={(option) => `${option.icon} ${option.label}`}
                                    renderInput={(params) => (
                                        <TextField {...params} placeholder="Sélectionner..." />
                                    )}
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => (
                                            <Chip
                                                label={`${option.icon} ${option.label}`}
                                                {...getTagProps({ index })}
                                                size="small"
                                            />
                                        ))
                                    }
                                />
                            </Grid>

                            {/* Catégorie */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CategoryIcon fontSize="small" />
                                    Catégorie
                                </Typography>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        displayEmpty
                                    >
                                        <MenuItem value="">Toutes les catégories</MenuItem>
                                        {categoryOptions.map((cat) => (
                                            <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Auteur */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PersonIcon fontSize="small" />
                                    Auteur
                                </Typography>
                                <TextField
                                    size="small"
                                    fullWidth
                                    placeholder="Nom de l'auteur..."
                                    value={author}
                                    onChange={(e) => setAuthor(e.target.value)}
                                />
                            </Grid>

                            {/* Langue */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Langue du document
                                </Typography>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                        displayEmpty
                                    >
                                        <MenuItem value="">Toutes les langues</MenuItem>
                                        {languageOptions.map((lang) => (
                                            <MenuItem key={lang.value} value={lang.value}>
                                                {lang.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Plage de montants */}
                            <Grid item xs={12} md={6}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={useAmountFilter}
                                            onChange={(e) => setUseAmountFilter(e.target.checked)}
                                        />
                                    }
                                    label={
                                        <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <TrendingIcon fontSize="small" />
                                            Plage de montants (€)
                                        </Typography>
                                    }
                                />
                                {useAmountFilter && (
                                    <Box sx={{ px: 2 }}>
                                        <Slider
                                            value={amountRange}
                                            onChange={(e, newValue) => setAmountRange(newValue)}
                                            valueLabelDisplay="auto"
                                            min={0}
                                            max={100000}
                                            step={1000}
                                            marks={[
                                                { value: 0, label: '0€' },
                                                { value: 50000, label: '50k€' },
                                                { value: 100000, label: '100k€' }
                                            ]}
                                        />
                                        <Typography variant="caption" color="text.secondary">
                                            De {amountRange[0].toLocaleString()}€ à {amountRange[1].toLocaleString()}€
                                        </Typography>
                                    </Box>
                                )}
                            </Grid>

                            {/* Tri */}
                            <Grid item xs={12}>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="subtitle2" gutterBottom>
                                    Trier par
                                </Typography>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                    >
                                        {sortOptions.map((opt) => (
                                            <MenuItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        {/* Actions */}
                        <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'space-between' }}>
                            <Button
                                variant="outlined"
                                startIcon={<ClearIcon />}
                                onClick={handleClearFilters}
                            >
                                Réinitialiser
                            </Button>

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<SaveIcon />}
                                    onClick={() => setShowSaveDialog(true)}
                                    disabled={activeFiltersCount() === 0}
                                >
                                    Sauvegarder
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<SearchIcon />}
                                    onClick={handleSearch}
                                    disabled={loading}
                                >
                                    Rechercher
                                </Button>
                            </Box>
                        </Box>
                    </AccordionDetails>
                </Accordion>

                {/* Recherches sauvegardées */}
                {savedSearches.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <RestoreIcon fontSize="small" />
                            Recherches sauvegardées
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                            {savedSearches.slice(0, 5).map((search) => (
                                <Chip
                                    key={search.id}
                                    label={search.name}
                                    onClick={() => handleLoadSavedSearch(search)}
                                    icon={<RestoreIcon />}
                                    variant="outlined"
                                    color="secondary"
                                />
                            ))}
                        </Stack>
                    </Box>
                )}

                {/* Dialog de sauvegarde */}
                {showSaveDialog && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Sauvegarder cette recherche
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                size="small"
                                fullWidth
                                placeholder="Nom de la recherche..."
                                value={savedSearchName}
                                onChange={(e) => setSavedSearchName(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSaveSearch()}
                            />
                            <Button
                                variant="contained"
                                onClick={handleSaveSearch}
                                disabled={!savedSearchName.trim()}
                            >
                                Sauvegarder
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    setShowSaveDialog(false);
                                    setSavedSearchName('');
                                }}
                            >
                                Annuler
                            </Button>
                        </Box>
                    </Box>
                )}
            </Paper>
        </LocalizationProvider>
    );
}

export default AdvancedSearchFilters;
