/**
 * Panneau de configuration OpenRouter uniquement
 * HuggingFace retiré - OpenRouter seul provider
 */

import React, { useState, useEffect } from 'react';
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
    Switch
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
        aiProvider: 'openrouter',
        providers: {
            openrouter: {
                enabled: true,
                priority: 1,
                apiKey: '',
                baseUrl: 'https://openrouter.ai/api/v1',
                model: 'meta-llama/llama-3.3-8b-instruct:free',
                timeout: 60000,
                temperature: 0.7,
                max_tokens: 2048
            }
        }
    });

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

    const handleTestProvider = async () => {
        try {
            setTestingProvider('openrouter');
            setConnectionStatus({ openrouter: null });

            const response = await axios.post(`${API_BASE}/providers/openrouter/test`, {
                apiKey: aiConfig.providers.openrouter.apiKey,
                model: aiConfig.providers.openrouter.model
            });

            setConnectionStatus({
                openrouter: {
                    success: response.data.success,
                    message: response.data.connected ? `✅ Connexion réussie (${response.data.modelsAvailable || 0} modèles disponibles)` : response.data.error
                }
            });
        } catch (error) {
            setConnectionStatus({
                openrouter: {
                    success: false,
                    message: error.response?.data?.details || error.message
                }
            });
        } finally {
            setTestingProvider(null);
        }
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

    return (
        <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SettingsIcon /> Configuration OpenRouter
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configurez OpenRouter avec accès à 14 modèles gratuits validés et fonctionnels.
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

            <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AIIcon color="primary" />
                        <Typography variant="h6">OpenRouter</Typography>
                        <Chip label="14 modèles validés" size="small" color="success" variant="outlined" />
                        <Chip label="100% gratuits" size="small" color="primary" variant="outlined" />
                    </Box>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={aiConfig.providers.openrouter.enabled}
                                onChange={(e) => setAiConfig({
                                    ...aiConfig,
                                    providers: {
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
                                    openrouter: {
                                        ...aiConfig.providers.openrouter,
                                        apiKey: e.target.value
                                    }
                                }
                            })}
                            placeholder="sk-or-v1-..."
                            helperText="Obtenez votre clé sur https://openrouter.ai/keys"
                            disabled={!aiConfig.providers.openrouter.enabled}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowORKey(!showORKey)} edge="end">
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
                            onClick={handleTestProvider}
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
