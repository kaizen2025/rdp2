/**
 * Panneau de configuration IA - Gemini uniquement
 * Configuration complète avec orchestrateur intelligent
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    Divider,
    Alert,
    Chip,
    IconButton,
    InputAdornment,
    FormControlLabel,
    Switch,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    CircularProgress
} from '@mui/material';
import {
    SmartToy as AIIcon,
    Save as SaveIcon,
    Refresh as RefreshIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    CheckCircle as CheckIcon,
    Error as ErrorIcon,
    Settings as SettingsIcon
} from '@mui/icons-material';

import { useApp } from '../../contexts/AppContext';
import { usePermissions } from '../../hooks/usePermissions';
import axios from 'axios';

const API_BASE = '/api/ai';

// Liste des modèles Gemini disponibles
const GEMINI_MODELS = {
    text: [
        { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Experimental)', description: 'Le plus récent et rapide' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Rapide et efficace' },
        { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash 8B', description: 'Version légère' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Plus puissant, plus lent' },
        { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro', description: 'Version stable' }
    ],
    vision: [
        { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Experimental)', description: 'Vision multimodale avancée' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Vision rapide' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Vision haute qualité' }
    ],
    embedding: [
        { id: 'text-embedding-004', name: 'Text Embedding 004', description: 'Dernière version' },
        { id: 'embedding-001', name: 'Embedding 001', description: 'Version stable' }
    ]
};

const AISettingsPanel = () => {
    const { config } = useApp();
    const { hasPermission, isSuperAdmin } = usePermissions();

    const [aiConfig, setAiConfig] = useState({
        aiProvider: 'gemini',
        providers: {
            gemini: {
                enabled: true,
                priority: 1,
                apiKey: '',
                models: {
                    text: 'gemini-2.0-flash-exp',
                    vision: 'gemini-2.0-flash-exp',
                    embedding: 'text-embedding-004'
                },
                timeout: 120000,
                temperature: 0.7,
                max_tokens: 8192,
                orchestrator: {
                    enabled: true,
                    autoDetectIntent: true,
                    useOCRForImages: true,
                    useEmbeddingForSearch: true,
                    enableDocumentActions: true
                }
            }
        },
        fallback: {
            enabled: false
        }
    });

    const [showApiKey, setShowApiKey] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadConfiguration = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await axios.get(`${API_BASE}/config`);
            if (response.data.success && response.data.config) {
                // Fusionner avec les valeurs par défaut
                const loadedConfig = response.data.config;
                setAiConfig(prev => ({
                    ...prev,
                    ...loadedConfig,
                    providers: {
                        ...prev.providers,
                        gemini: {
                            ...prev.providers.gemini,
                            ...(loadedConfig.providers?.gemini || {}),
                            models: {
                                text: loadedConfig.providers?.gemini?.models?.text || loadedConfig.providers?.gemini?.model || 'gemini-2.0-flash-exp',
                                vision: loadedConfig.providers?.gemini?.models?.vision || 'gemini-2.0-flash-exp',
                                embedding: loadedConfig.providers?.gemini?.models?.embedding || 'text-embedding-004'
                            },
                            orchestrator: {
                                enabled: true,
                                autoDetectIntent: true,
                                useOCRForImages: true,
                                useEmbeddingForSearch: true,
                                enableDocumentActions: true,
                                ...(loadedConfig.providers?.gemini?.orchestrator || {})
                            }
                        }
                    }
                }));
            }
        } catch (error) {
            console.error('Erreur chargement configuration:', error);
            setError('Impossible de charger la configuration IA');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadConfiguration();
    }, [loadConfiguration]);

    const handleSaveConfig = async () => {
        try {
            setIsSaving(true);
            setError(null);
            setSuccess(null);

            const response = await axios.put(`${API_BASE}/config`, aiConfig);

            if (response.data.success) {
                setSuccess('Configuration IA sauvegardée avec succès');
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (error) {
            console.error('Erreur sauvegarde configuration:', error);
            setError('Erreur lors de la sauvegarde de la configuration IA');
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestConnection = async () => {
        try {
            setIsTesting(true);
            setConnectionStatus(null);

            const response = await axios.post(`${API_BASE}/providers/gemini/test`, {
                apiKey: aiConfig.providers.gemini.apiKey,
                model: aiConfig.providers.gemini.models?.text || 'gemini-2.0-flash-exp'
            });

            setConnectionStatus({
                success: response.data.success,
                message: response.data.success
                    ? 'Connexion à Gemini réussie !'
                    : response.data.error || 'Erreur de connexion'
            });
        } catch (error) {
            setConnectionStatus({
                success: false,
                message: error.response?.data?.details || error.response?.data?.error || error.message
            });
        } finally {
            setIsTesting(false);
        }
    };

    const updateGeminiConfig = (field, value) => {
        setAiConfig(prev => ({
            ...prev,
            providers: {
                ...prev.providers,
                gemini: {
                    ...prev.providers.gemini,
                    [field]: value
                }
            }
        }));
    };

    const updateGeminiModel = (modelType, value) => {
        setAiConfig(prev => ({
            ...prev,
            providers: {
                ...prev.providers,
                gemini: {
                    ...prev.providers.gemini,
                    models: {
                        ...prev.providers.gemini.models,
                        [modelType]: value
                    }
                }
            }
        }));
    };

    const updateOrchestrator = (field, value) => {
        setAiConfig(prev => ({
            ...prev,
            providers: {
                ...prev.providers,
                gemini: {
                    ...prev.providers.gemini,
                    orchestrator: {
                        ...prev.providers.gemini.orchestrator,
                        [field]: value
                    }
                }
            }
        }));
    };

    const canEdit = hasPermission('config:admin') || isSuperAdmin();

    if (!canEdit) {
        return (
            <Box>
                <Alert severity="warning">
                    Vous n'avez pas les permissions nécessaires pour modifier la configuration IA.
                </Alert>
            </Box>
        );
    }

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SettingsIcon /> Configuration IA - DocuCortex
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configurez Gemini (priorité 1) et OpenRouter (fallback). Provider actif: <strong>gemini</strong>
            </Typography>

            {error && (
                <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
                    {success}
                </Alert>
            )}

            {/* Configuration Gemini */}
            <Paper sx={{ p: 3, mb: 3, border: '2px solid #1976d2' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AIIcon color="primary" />
                        <Typography variant="h6">Gemini AI</Typography>
                        <Chip label="Priorité 1" size="small" color="primary" />
                        <Chip label="Par défaut" size="small" color="success" variant="outlined" />
                    </Box>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={aiConfig.providers.gemini.enabled}
                                onChange={(e) => updateGeminiConfig('enabled', e.target.checked)}
                            />
                        }
                        label="Activé"
                    />
                </Box>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                    {/* Clé API */}
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Clé API Gemini"
                            type={showApiKey ? 'text' : 'password'}
                            value={aiConfig.providers.gemini.apiKey}
                            onChange={(e) => updateGeminiConfig('apiKey', e.target.value)}
                            placeholder="AIza..."
                            helperText="Obtenez votre clé sur https://ai.google.dev/"
                            disabled={!aiConfig.providers.gemini.enabled}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowApiKey(!showApiKey)} edge="end">
                                            {showApiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Grid>

                    {/* Sélecteur Modèle Texte */}
                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth disabled={!aiConfig.providers.gemini.enabled}>
                            <InputLabel>Modèle Texte</InputLabel>
                            <Select
                                value={aiConfig.providers.gemini.models?.text || 'gemini-2.0-flash-exp'}
                                onChange={(e) => updateGeminiModel('text', e.target.value)}
                                label="Modèle Texte"
                            >
                                {GEMINI_MODELS.text.map(model => (
                                    <MenuItem key={model.id} value={model.id}>
                                        {model.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Typography variant="caption" color="text.secondary">
                            Questions générales
                        </Typography>
                    </Grid>

                    {/* Sélecteur Modèle Vision */}
                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth disabled={!aiConfig.providers.gemini.enabled}>
                            <InputLabel>Modèle Vision</InputLabel>
                            <Select
                                value={aiConfig.providers.gemini.models?.vision || 'gemini-2.0-flash-exp'}
                                onChange={(e) => updateGeminiModel('vision', e.target.value)}
                                label="Modèle Vision"
                            >
                                {GEMINI_MODELS.vision.map(model => (
                                    <MenuItem key={model.id} value={model.id}>
                                        {model.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Typography variant="caption" color="text.secondary">
                            Images, Excel scanné
                        </Typography>
                    </Grid>

                    {/* Sélecteur Modèle Embedding */}
                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth disabled={!aiConfig.providers.gemini.enabled}>
                            <InputLabel>Modèle Embedding</InputLabel>
                            <Select
                                value={aiConfig.providers.gemini.models?.embedding || 'text-embedding-004'}
                                onChange={(e) => updateGeminiModel('embedding', e.target.value)}
                                label="Modèle Embedding"
                            >
                                {GEMINI_MODELS.embedding.map(model => (
                                    <MenuItem key={model.id} value={model.id}>
                                        {model.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Typography variant="caption" color="text.secondary">
                            Recherche sémantique
                        </Typography>
                    </Grid>

                    {/* Bouton de test */}
                    <Grid item xs={12}>
                        <Button
                            variant="outlined"
                            onClick={handleTestConnection}
                            disabled={!aiConfig.providers.gemini.enabled || isTesting || !aiConfig.providers.gemini.apiKey}
                            startIcon={isTesting ? <CircularProgress size={20} /> : connectionStatus ? (connectionStatus.success ? <CheckIcon /> : <ErrorIcon />) : <RefreshIcon />}
                            color={connectionStatus ? (connectionStatus.success ? 'success' : 'error') : 'primary'}
                        >
                            {isTesting ? 'Test en cours...' : 'Tester la connexion'}
                        </Button>
                    </Grid>

                    {connectionStatus && (
                        <Grid item xs={12}>
                            <Alert severity={connectionStatus.success ? 'success' : 'error'}>
                                {connectionStatus.message}
                            </Alert>
                        </Grid>
                    )}

                    {/* Options Chef d'Orchestre */}
                    <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                            Options Chef d'Orchestre
                        </Typography>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            L'orchestrateur détecte automatiquement le type de requête et choisit le meilleur modèle (texte, vision, ou recherche documentaire).
                        </Alert>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={aiConfig.providers.gemini.orchestrator?.enabled !== false}
                                    onChange={(e) => updateOrchestrator('enabled', e.target.checked)}
                                    disabled={!aiConfig.providers.gemini.enabled}
                                />
                            }
                            label="Activer l'orchestrateur intelligent"
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={aiConfig.providers.gemini.orchestrator?.useOCRForImages !== false}
                                    onChange={(e) => updateOrchestrator('useOCRForImages', e.target.checked)}
                                    disabled={!aiConfig.providers.gemini.enabled}
                                />
                            }
                            label="OCR automatique pour images"
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={aiConfig.providers.gemini.orchestrator?.useEmbeddingForSearch !== false}
                                    onChange={(e) => updateOrchestrator('useEmbeddingForSearch', e.target.checked)}
                                    disabled={!aiConfig.providers.gemini.enabled}
                                />
                            }
                            label="Embeddings pour recherche"
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={aiConfig.providers.gemini.orchestrator?.enableDocumentActions !== false}
                                    onChange={(e) => updateOrchestrator('enableDocumentActions', e.target.checked)}
                                    disabled={!aiConfig.providers.gemini.enabled}
                                />
                            }
                            label="Actions documents (ouvrir/afficher)"
                        />
                    </Grid>
                </Grid>
            </Paper>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button variant="outlined" onClick={loadConfiguration}>
                    Annuler
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveConfig}
                    disabled={isSaving}
                >
                    {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
            </Box>
        </Box>
    );
};

export default AISettingsPanel;
