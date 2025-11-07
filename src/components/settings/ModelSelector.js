/**
 * Composant de sélection de modèles AI avec chargement dynamique
 * Supporte HuggingFace et OpenRouter
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Chip,
    CircularProgress,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    TextField,
    InputAdornment,
    Typography,
    Alert,
    Tabs,
    Tab
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    Search as SearchIcon,
    Star as StarIcon,
    CloudDownload as DownloadIcon,
    Favorite as LikeIcon,
    CalendarMonth as CalendarIcon
} from '@mui/icons-material';

import axios from 'axios';

const API_BASE = '/api/ai';

const ModelSelector = ({ provider, value, onChange, disabled }) => {
    const [models, setModels] = useState([]);
    const [filteredModels, setFilteredModels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTab, setSelectedTab] = useState(0); // 0: Recommended, 1: All Models, 2: Free only
    const [error, setError] = useState(null);

    useEffect(() => {
        if (dialogOpen) {
            loadRecommendedModels();
        }
    }, [dialogOpen]);

    useEffect(() => {
        // Filtrer les modèles en fonction de la recherche
        if (searchTerm.trim() === '') {
            setFilteredModels(models);
        } else {
            const term = searchTerm.toLowerCase();
            setFilteredModels(
                models.filter(
                    (m) =>
                        m.name?.toLowerCase().includes(term) ||
                        m.id?.toLowerCase().includes(term) ||
                        m.description?.toLowerCase().includes(term)
                )
            );
        }
    }, [searchTerm, models]);

    const loadRecommendedModels = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.get(`${API_BASE}/models/recommended`);

            if (response.data.success) {
                // Filtrer par provider
                let providerModels = response.data.models;
                if (provider) {
                    providerModels = providerModels.filter(
                        (m) => m.provider === provider || m.provider === 'openrouter'
                    );
                }
                setModels(providerModels);
                setFilteredModels(providerModels);
            }
        } catch (error) {
            console.error('Erreur chargement modèles recommandés:', error);
            setError('Impossible de charger les modèles recommandés');
        } finally {
            setLoading(false);
        }
    };

    const loadAvailableModels = async (free = false) => {
        try {
            setLoading(true);
            setError(null);

            let params = {};
            if (provider === 'openrouter') {
                params = {
                    free: free,
                    sortBy: 'recent',
                    limit: free ? 20 : 50
                };
            } else if (provider === 'huggingface') {
                params = {
                    task: 'text-generation',
                    sort: 'downloads',
                    limit: 30
                };
            }

            const response = await axios.get(`${API_BASE}/providers/${provider}/models`, {
                params
            });

            if (response.data.success) {
                setModels(response.data.models);
                setFilteredModels(response.data.models);
            } else {
                setError(response.data.error || 'Erreur chargement modèles');
            }
        } catch (error) {
            console.error('Erreur chargement modèles:', error);
            setError('Impossible de charger les modèles disponibles');
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setSelectedTab(newValue);
        setSearchTerm('');

        if (newValue === 0) {
            loadRecommendedModels();
        } else if (newValue === 1) {
            loadAvailableModels(false);
        } else if (newValue === 2 && provider === 'openrouter') {
            loadAvailableModels(true);
        }
    };

    const handleSelectModel = (model) => {
        onChange(model.id);
        setDialogOpen(false);
    };

    const formatContextLength = (length) => {
        if (!length) return '';
        if (length >= 1000) return `${(length / 1000).toFixed(0)}K`;
        return length.toString();
    };

    return (
        <>
            <FormControl fullWidth disabled={disabled}>
                <InputLabel>Modèle</InputLabel>
                <Select
                    value={value || ''}
                    label="Modèle"
                    onChange={(e) => onChange(e.target.value)}
                    endAdornment={
                        <Button
                            size="small"
                            onClick={() => setDialogOpen(true)}
                            disabled={disabled}
                            sx={{ mr: 2 }}
                        >
                            Parcourir
                        </Button>
                    }
                >
                    <MenuItem value={value}>{value}</MenuItem>
                </Select>
            </FormControl>

            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Sélectionner un modèle {provider === 'huggingface' ? 'Hugging Face' : 'OpenRouter'}
                </DialogTitle>

                <DialogContent>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                        <Tabs value={selectedTab} onChange={handleTabChange}>
                            <Tab label="Recommandés" icon={<StarIcon />} iconPosition="start" />
                            <Tab label="Tous les modèles" />
                            {provider === 'openrouter' && <Tab label="Gratuits uniquement" />}
                        </Tabs>
                    </Box>

                    <TextField
                        fullWidth
                        placeholder="Rechercher un modèle..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ mb: 2 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            )
                        }}
                    />

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                            {filteredModels.length === 0 ? (
                                <Typography align="center" color="text.secondary" sx={{ py: 3 }}>
                                    Aucun modèle trouvé
                                </Typography>
                            ) : (
                                filteredModels.map((model) => (
                                    <ListItem key={model.id} disablePadding>
                                        <ListItemButton
                                            onClick={() => handleSelectModel(model)}
                                            selected={model.id === value}
                                        >
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        {model.name || model.id}
                                                        {model.recommended && (
                                                            <Chip
                                                                label="Recommandé"
                                                                size="small"
                                                                color="primary"
                                                                icon={<StarIcon />}
                                                            />
                                                        )}
                                                        {model.isFree && (
                                                            <Chip
                                                                label="Gratuit"
                                                                size="small"
                                                                color="success"
                                                            />
                                                        )}
                                                    </Box>
                                                }
                                                secondary={
                                                    <Box>
                                                        {model.description && (
                                                            <Typography
                                                                variant="caption"
                                                                display="block"
                                                                color="text.secondary"
                                                            >
                                                                {model.description.substring(0, 100)}
                                                                {model.description.length > 100 ? '...' : ''}
                                                            </Typography>
                                                        )}
                                                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                                            {model.contextLength && (
                                                                <Chip
                                                                    label={`${formatContextLength(model.contextLength)} ctx`}
                                                                    size="small"
                                                                    variant="outlined"
                                                                />
                                                            )}
                                                            {model.downloads && (
                                                                <Tooltip title="Téléchargements">
                                                                    <Chip
                                                                        icon={<DownloadIcon />}
                                                                        label={model.downloads.toLocaleString()}
                                                                        size="small"
                                                                        variant="outlined"
                                                                    />
                                                                </Tooltip>
                                                            )}
                                                            {model.likes && (
                                                                <Tooltip title="Likes">
                                                                    <Chip
                                                                        icon={<LikeIcon />}
                                                                        label={model.likes.toLocaleString()}
                                                                        size="small"
                                                                        variant="outlined"
                                                                    />
                                                                </Tooltip>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                }
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                ))
                            )}
                        </List>
                    )}
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Fermer</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ModelSelector;
