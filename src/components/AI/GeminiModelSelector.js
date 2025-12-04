/**
 * Composant de sélection de modèle Gemini
 * Affiche la liste des modèles disponibles via l'API Google
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    CircularProgress,
    Alert,
    Chip,
    Tooltip,
    Typography,
    IconButton,
    ListItemText,
    ListItemIcon
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    CheckCircle as CheckIcon,
    Star as StarIcon,
    Memory as MemoryIcon,
    Speed as SpeedIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE = 'http://localhost:3002/api/ai/config';

function GeminiModelSelector({ apiKey, selectedModel, onModelChange, disabled }) {
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [recommended, setRecommended] = useState(null);

    useEffect(() => {
        if (apiKey && apiKey.length > 20) {
            loadModels();
        }
    }, [apiKey]);

    const loadModels = async () => {
        if (!apiKey) {
            setError('Clé API requise');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            console.log('[GeminiModelSelector] Chargement des modèles...');

            const response = await axios.get(`${API_BASE}/gemini/models`, {
                params: { apiKey }
            });

            if (response.data.success) {
                setModels(response.data.models);
                setRecommended(response.data.recommended);
                console.log(`[GeminiModelSelector] ✅ ${response.data.models.length} modèles chargés`);

                // Si aucun modèle sélectionné, sélectionner le recommandé
                if (!selectedModel && response.data.recommended) {
                    onModelChange(response.data.recommended);
                }
            } else {
                setError(response.data.error || 'Erreur lors du chargement des modèles');
            }
        } catch (err) {
            console.error('[GeminiModelSelector] Erreur:', err);

            if (err.response?.status === 403) {
                setError('Clé API invalide ou accès refusé');
            } else if (err.response?.status === 429) {
                setError('Limite de requêtes atteinte. Réessayez dans quelques minutes.');
            } else {
                setError('Erreur de connexion à l\'API Google');
            }
        } finally {
            setLoading(false);
        }
    };

    const getModelIcon = (modelId) => {
        if (modelId.includes('flash')) return <SpeedIcon fontSize="small" color="primary" />;
        if (modelId.includes('pro')) return <MemoryIcon fontSize="small" color="secondary" />;
        return <MemoryIcon fontSize="small" />;
    };

    const getModelBadge = (modelId) => {
        if (modelId === recommended) {
            return <Chip label="Recommandé" color="success" size="small" icon={<StarIcon />} sx={{ ml: 1 }} />;
        }
        if (modelId.includes('2.0')) {
            return <Chip label="Dernière version" color="primary" size="small" sx={{ ml: 1 }} />;
        }
        if (modelId.includes('exp')) {
            return <Chip label="Experimental" color="warning" size="small" sx={{ ml: 1 }} />;
        }
        return null;
    };

    const formatTokenLimit = (limit) => {
        if (limit >= 1000000) return `${(limit / 1000000).toFixed(1)}M tokens`;
        if (limit >= 1000) return `${(limit / 1000).toFixed(0)}K tokens`;
        return `${limit} tokens`;
    };

    return (
        <Box>
            {/* Sélecteur de modèle */}
            <FormControl fullWidth margin="normal" disabled={disabled || !apiKey}>
                <InputLabel>Modèle Gemini</InputLabel>
                <Select
                    value={selectedModel || ''}
                    onChange={(e) => onModelChange(e.target.value)}
                    label="Modèle Gemini"
                    renderValue={(value) => (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getModelIcon(value)}
                            <Typography>{value}</Typography>
                            {getModelBadge(value)}
                        </Box>
                    )}
                >
                    {models.length === 0 && !loading && (
                        <MenuItem disabled>
                            <em>Chargez les modèles disponibles</em>
                        </MenuItem>
                    )}

                    {models.map((model) => (
                        <MenuItem key={model.id} value={model.id}>
                            <ListItemIcon>
                                {getModelIcon(model.id)}
                            </ListItemIcon>
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body2" fontWeight="medium">
                                            {model.id}
                                        </Typography>
                                        {getModelBadge(model.id)}
                                    </Box>
                                }
                                secondary={
                                    <Box>
                                        <Typography variant="caption" display="block">
                                            {model.description || model.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Entrée: {formatTokenLimit(model.inputTokenLimit)} •
                                            Sortie: {formatTokenLimit(model.outputTokenLimit)}
                                        </Typography>
                                    </Box>
                                }
                            />
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* Bouton de rechargement */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
                    onClick={loadModels}
                    disabled={loading || !apiKey || disabled}
                >
                    {loading ? 'Chargement...' : 'Charger les modèles'}
                </Button>

                {models.length > 0 && (
                    <Chip
                        icon={<CheckIcon />}
                        label={`${models.length} modèles disponibles`}
                        color="success"
                        size="small"
                        variant="outlined"
                    />
                )}
            </Box>

            {/* Messages d'erreur */}
            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Info sur le modèle sélectionné */}
            {selectedModel && models.length > 0 && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Modèle sélectionné:
                    </Typography>
                    {(() => {
                        const model = models.find(m => m.id === selectedModel);
                        if (!model) return <Typography variant="body2">{selectedModel}</Typography>;

                        return (
                            <Box>
                                <Typography variant="body2" fontWeight="medium">
                                    {model.name || model.id}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    {model.description}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                                    <Chip
                                        label={`Input: ${formatTokenLimit(model.inputTokenLimit)}`}
                                        size="small"
                                        variant="outlined"
                                    />
                                    <Chip
                                        label={`Output: ${formatTokenLimit(model.outputTokenLimit)}`}
                                        size="small"
                                        variant="outlined"
                                    />
                                    {model.temperature && (
                                        <Chip
                                            label={`Temp: ${model.temperature}`}
                                            size="small"
                                            variant="outlined"
                                        />
                                    )}
                                </Box>
                            </Box>
                        );
                    })()}
                </Box>
            )}

            {/* Aide */}
            {!apiKey && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    Entrez votre clé API Gemini pour afficher les modèles disponibles
                </Alert>
            )}
        </Box>
    );
}

export default GeminiModelSelector;
