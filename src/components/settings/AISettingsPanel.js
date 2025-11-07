/**
 * Panneau de configuration des API IA (Hugging Face & OpenRouter)
 * Permet de configurer les clés API et les modèles utilisés
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    FormControlLabel,
    Divider,
    Alert,
    Chip,
    IconButton,
    InputAdornment
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
import ModelSelector from './ModelSelector';
import axios from 'axios';

const API_BASE = '/api/ai';

const AISettingsPanel = () => {
    const { config } = useApp();
    const { hasPermission, isSuperAdmin } = usePermissions();

    const [aiConfig, setAiConfig] = useState({
        aiProvider: 'huggingface',
        providers: {
            huggingface: {
                enabled: true,
                priority: 1,
                apiKey: '',
                baseUrl: 'https://api-inference.huggingface.co',
                model: 'mistralai/Mistral-7B-Instruct-v0.2',
                timeout: 60000,
                temperature: 0.7,
                max_tokens: 2048
            },
            openrouter: {
                enabled: true,
                priority: 2,
                apiKey: '',
                baseUrl: 'https://openrouter.ai/api/v1',
                model: 'openai/gpt-3.5-turbo',
                timeout: 60000,
                temperature: 0.7,
                max_tokens: 2048
            }
        }
    });

    const [showHFKey, setShowHFKey] = useState(false);
    const [showORKey, setShowORKey] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [testingProvider, setTestingProvider] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState({});

    useEffect(() => {
        loadConfiguration();
    }, []);

    const loadConfiguration = async () => {
        try {
            const response = await axios.get(`${API_BASE}/config`);
            if (response.data.success) {
                // Les clés API sont masquées par le backend
                setAiConfig(response.data.config);
            }
        } catch (error) {
            console.error('Erreur chargement configuration:', error);
            setError('Impossible de charger la configuration IA');
        }
    };

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

    const handleTestProvider = async (providerName) => {
        try {
            setTestingProvider(providerName);
            setConnectionStatus({ ...connectionStatus, [providerName]: null });

            const response = await axios.post(`${API_BASE}/providers/${providerName}/test`);

            setConnectionStatus({
                ...connectionStatus,
                [providerName]: {
                    success: response.data.success,
                    message: response.data.message || 'Connexion réussie'
                }
            });
        } catch (error) {
            setConnectionStatus({
                ...connectionStatus,
                [providerName]: {
                    success: false,
                    message: error.response?.data?.message || error.message
                }
            });
        } finally {
            setTestingProvider(null);
        }
    };

    const maskApiKey = (key) => {
        if (!key || key.length < 12) return '••••••••••••';
        return key.substring(0, 4) + '••••••••' + key.slice(-4);
    };

    // Vérifier les permissions
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

    return (
        <Box>
            {/* Titre */}
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SettingsIcon /> Configuration des API IA
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configurez les fournisseurs d'intelligence artificielle : Hugging Face (prioritaire) et OpenRouter (fallback).
            </Typography>

            {/* Messages de feedback */}
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

            {/* Section Hugging Face */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AIIcon color="primary" />
                        <Typography variant="h6">Hugging Face</Typography>
                        <Chip
                            label="Priorité 1"
                            size="small"
                            color="primary"
                            variant="outlined"
                        />
                    </Box>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={aiConfig.providers.huggingface.enabled}
                                onChange={(e) => setAiConfig({
                                    ...aiConfig,
                                    providers: {
                                        ...aiConfig.providers,
                                        huggingface: {
                                            ...aiConfig.providers.huggingface,
                                            enabled: e.target.checked
                                        }
                                    }
                                })}
                            />
                        }
                        label="Activé"
                    />
                </Box>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Clé API Hugging Face"
                            type={showHFKey ? 'text' : 'password'}
                            value={aiConfig.providers.huggingface.apiKey}
                            onChange={(e) => setAiConfig({
                                ...aiConfig,
                                providers: {
                                    ...aiConfig.providers,
                                    huggingface: {
                                        ...aiConfig.providers.huggingface,
                                        apiKey: e.target.value
                                    }
                                }
                            })}
                            placeholder="hf_..."
                            helperText="Obtenez votre clé sur https://huggingface.co/settings/tokens"
                            disabled={!aiConfig.providers.huggingface.enabled}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowHFKey(!showHFKey)}
                                            edge="end"
                                        >
                                            {showHFKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Grid>

                    <Grid item xs={12} md={8}>
                        <ModelSelector
                            provider="huggingface"
                            value={aiConfig.providers.huggingface.model}
                            onChange={(newModel) => setAiConfig({
                                ...aiConfig,
                                providers: {
                                    ...aiConfig.providers,
                                    huggingface: {
                                        ...aiConfig.providers.huggingface,
                                        model: newModel
                                    }
                                }
                            })}
                            disabled={!aiConfig.providers.huggingface.enabled}
                        />
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={() => handleTestProvider('huggingface')}
                            disabled={!aiConfig.providers.huggingface.enabled || testingProvider === 'huggingface'}
                            startIcon={testingProvider === 'huggingface' ? <RefreshIcon /> : connectionStatus.huggingface ? (connectionStatus.huggingface.success ? <CheckIcon /> : <ErrorIcon />) : <RefreshIcon />}
                            color={connectionStatus.huggingface ? (connectionStatus.huggingface.success ? 'success' : 'error') : 'primary'}
                            sx={{ height: '56px' }}
                        >
                            {testingProvider === 'huggingface' ? 'Test...' : 'Tester'}
                        </Button>
                    </Grid>

                    {connectionStatus.huggingface && (
                        <Grid item xs={12}>
                            <Alert severity={connectionStatus.huggingface.success ? 'success' : 'error'}>
                                {connectionStatus.huggingface.message}
                            </Alert>
                        </Grid>
                    )}
                </Grid>
            </Paper>

            {/* Section OpenRouter */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AIIcon color="secondary" />
                        <Typography variant="h6">OpenRouter</Typography>
                        <Chip
                            label="Priorité 2 (Fallback)"
                            size="small"
                            color="secondary"
                            variant="outlined"
                        />
                    </Box>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={aiConfig.providers.openrouter.enabled}
                                onChange={(e) => setAiConfig({
                                    ...aiConfig,
                                    providers: {
                                        ...aiConfig.providers,
                                        openrouter: {
                                            ...aiConfig.providers.openrouter,
                                            enabled: e.target.checked
                                        }
                                    }
                                })}
                            />
                        }
                        label="Activé"
                    />
                </Box>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Clé API OpenRouter"
                            type={showORKey ? 'text' : 'password'}
                            value={aiConfig.providers.openrouter.apiKey}
                            onChange={(e) => setAiConfig({
                                ...aiConfig,
                                providers: {
                                    ...aiConfig.providers,
                                    openrouter: {
                                        ...aiConfig.providers.openrouter,
                                        apiKey: e.target.value
                                    }
                                }
                            })}
                            placeholder="sk-or-..."
                            helperText="Obtenez votre clé sur https://openrouter.ai/keys"
                            disabled={!aiConfig.providers.openrouter.enabled}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowORKey(!showORKey)}
                                            edge="end"
                                        >
                                            {showORKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Grid>

                    <Grid item xs={12} md={8}>
                        <ModelSelector
                            provider="openrouter"
                            value={aiConfig.providers.openrouter.model}
                            onChange={(newModel) => setAiConfig({
                                ...aiConfig,
                                providers: {
                                    ...aiConfig.providers,
                                    openrouter: {
                                        ...aiConfig.providers.openrouter,
                                        model: newModel
                                    }
                                }
                            })}
                            disabled={!aiConfig.providers.openrouter.enabled}
                        />
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={() => handleTestProvider('openrouter')}
                            disabled={!aiConfig.providers.openrouter.enabled || testingProvider === 'openrouter'}
                            startIcon={testingProvider === 'openrouter' ? <RefreshIcon /> : connectionStatus.openrouter ? (connectionStatus.openrouter.success ? <CheckIcon /> : <ErrorIcon />) : <RefreshIcon />}
                            color={connectionStatus.openrouter ? (connectionStatus.openrouter.success ? 'success' : 'error') : 'primary'}
                            sx={{ height: '56px' }}
                        >
                            {testingProvider === 'openrouter' ? 'Test...' : 'Tester'}
                        </Button>
                    </Grid>

                    {connectionStatus.openrouter && (
                        <Grid item xs={12}>
                            <Alert severity={connectionStatus.openrouter.success ? 'success' : 'error'}>
                                {connectionStatus.openrouter.message}
                            </Alert>
                        </Grid>
                    )}
                </Grid>
            </Paper>

            {/* Boutons d'action */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                    variant="outlined"
                    onClick={loadConfiguration}
                >
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

            {/* Informations */}
            <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                    <strong>Fonctionnement multi-provider:</strong>
                    <br />
                    • Hugging Face est utilisé en priorité (priority 1)
                    <br />
                    • En cas d'échec, OpenRouter prend automatiquement le relais (priority 2)
                    <br />
                    • Les clés API sont stockées dans config/ai-config.json et dans les variables d'environnement
                </Typography>
            </Alert>
        </Box>
    );
};

export default AISettingsPanel;
