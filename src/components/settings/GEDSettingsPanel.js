/**
 * Panneau de configuration pour DocuCortex IA / GED
 * Permet de configurer l'IA, l'indexation réseau, et Ollama
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
    Card,
    CardContent,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import {
    SmartToy as AIIcon,
    Folder as FolderIcon,
    Refresh as RefreshIcon,
    Save as SaveIcon,
    Info as InfoIcon,
    CloudSync as NetworkIcon,
    Memory as MemoryIcon,
    Settings as SettingsIcon
} from '@mui/icons-material';

import { useApp } from '../../contexts/AppContext';
import { usePermissions } from '../../hooks/usePermissions';
import apiService from '../../services/apiService';

const GEDSettingsPanel = () => {
    const { config, updateConfig } = useApp();
    const { hasPermission, isSuperAdmin } = usePermissions();

    // État pour les paramètres GED
    const [gedConfig, setGedConfig] = useState({
        serverPath: '',
        workingDirectory: '',
        autoIndex: true,
        scanInterval: 30,
        allowedExtensions: ['*'],
        excludedFolders: [],
        maxFileSize: 104857600
    });

    // État pour les paramètres Ollama
    const [ollamaConfig, setOllamaConfig] = useState({
        apiUrl: 'http://192.168.1.232:11434',
        model: 'llama2',
        temperature: 0.7,
        maxTokens: 2048,
        timeout: 30000,
        enabled: true
    });

    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [testingConnection, setTestingConnection] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState(null);

    useEffect(() => {
        // Charger la config GED depuis config.json
        if (config?.networkDocuments) {
            setGedConfig({
                serverPath: config.networkDocuments.serverPath || '',
                workingDirectory: config.networkDocuments.workingDirectory || '',
                autoIndex: config.networkDocuments.autoIndex !== false,
                scanInterval: config.networkDocuments.scanInterval || 30,
                allowedExtensions: config.networkDocuments.allowedExtensions || ['*'],
                excludedFolders: config.networkDocuments.excludedFolders || [],
                maxFileSize: config.networkDocuments.maxFileSize || 104857600
            });
        }

        // Charger la config Ollama depuis config.json
        if (config?.ollama) {
            setOllamaConfig({
                apiUrl: config.ollama.apiUrl || 'http://192.168.1.232:11434',
                model: config.ollama.model || 'llama2',
                temperature: config.ollama.temperature || 0.7,
                maxTokens: config.ollama.maxTokens || 2048,
                timeout: config.ollama.timeout || 30000,
                enabled: config.ollama.enabled !== false
            });
        }
    }, [config]);

    const handleSaveConfig = async () => {
        try {
            setIsSaving(true);
            setError(null);
            setSuccess(null);

            // Construire la nouvelle config
            const updatedConfig = {
                ...config,
                networkDocuments: {
                    ...gedConfig
                },
                ollama: {
                    ...ollamaConfig
                }
            };

            // Sauvegarder via l'API
            await apiService.updateConfig(updatedConfig);

            // Mettre à jour le contexte
            updateConfig(updatedConfig);

            setSuccess('Configuration sauvegardée avec succès');
            setTimeout(() => setSuccess(null), 3000);
        } catch (error) {
            console.error('Erreur sauvegarde configuration:', error);
            setError('Erreur lors de la sauvegarde de la configuration');
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestOllamaConnection = async () => {
        try {
            setTestingConnection(true);
            setConnectionStatus(null);

            const response = await fetch(`${ollamaConfig.apiUrl}/api/tags`);
            if (response.ok) {
                const data = await response.json();
                setConnectionStatus({
                    success: true,
                    message: `Connexion réussie ! Modèles disponibles: ${data.models?.length || 0}`
                });
            } else {
                setConnectionStatus({
                    success: false,
                    message: `Erreur de connexion: ${response.status} ${response.statusText}`
                });
            }
        } catch (error) {
            setConnectionStatus({
                success: false,
                message: `Impossible de se connecter à Ollama: ${error.message}`
            });
        } finally {
            setTestingConnection(false);
        }
    };

    const formatFileSize = (bytes) => {
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    // Vérifier les permissions
    const canEdit = hasPermission('ged_network_scan:admin') || hasPermission('config:admin') || isSuperAdmin();

    if (!canEdit) {
        return (
            <Box>
                <Alert severity="warning">
                    Vous n'avez pas les permissions nécessaires pour modifier la configuration GED.
                </Alert>
            </Box>
        );
    }

    return (
        <Box>
            {/* Titre */}
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SettingsIcon /> Configuration DocuCortex IA & GED
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configurez l'intelligence artificielle Ollama, l'indexation réseau et les paramètres de la GED.
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

            {/* Section Ollama */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MemoryIcon color="primary" /> Configuration Ollama (IA)
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={ollamaConfig.enabled}
                                    onChange={(e) => setOllamaConfig({ ...ollamaConfig, enabled: e.target.checked })}
                                />
                            }
                            label="Activer Ollama"
                        />
                    </Grid>

                    <Grid item xs={12} md={8}>
                        <TextField
                            fullWidth
                            label="URL de l'API Ollama"
                            value={ollamaConfig.apiUrl}
                            onChange={(e) => setOllamaConfig({ ...ollamaConfig, apiUrl: e.target.value })}
                            placeholder="http://192.168.1.232:11434"
                            helperText="Adresse du serveur Ollama (ex: http://192.168.1.232:11434)"
                            disabled={!ollamaConfig.enabled}
                        />
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={handleTestOllamaConnection}
                            disabled={!ollamaConfig.enabled || testingConnection}
                            startIcon={<RefreshIcon />}
                            sx={{ height: '56px' }}
                        >
                            {testingConnection ? 'Test...' : 'Tester'}
                        </Button>
                    </Grid>

                    {connectionStatus && (
                        <Grid item xs={12}>
                            <Alert severity={connectionStatus.success ? 'success' : 'error'}>
                                {connectionStatus.message}
                            </Alert>
                        </Grid>
                    )}

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Modèle Ollama"
                            value={ollamaConfig.model}
                            onChange={(e) => setOllamaConfig({ ...ollamaConfig, model: e.target.value })}
                            placeholder="llama2, mistral, codellama..."
                            helperText="Nom du modèle Ollama à utiliser"
                            disabled={!ollamaConfig.enabled}
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Timeout (ms)"
                            value={ollamaConfig.timeout}
                            onChange={(e) => setOllamaConfig({ ...ollamaConfig, timeout: parseInt(e.target.value) })}
                            helperText="Temps maximum d'attente en millisecondes"
                            disabled={!ollamaConfig.enabled}
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Température"
                            value={ollamaConfig.temperature}
                            onChange={(e) => setOllamaConfig({ ...ollamaConfig, temperature: parseFloat(e.target.value) })}
                            inputProps={{ min: 0, max: 2, step: 0.1 }}
                            helperText="Créativité des réponses (0 = précis, 2 = créatif)"
                            disabled={!ollamaConfig.enabled}
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Tokens maximum"
                            value={ollamaConfig.maxTokens}
                            onChange={(e) => setOllamaConfig({ ...ollamaConfig, maxTokens: parseInt(e.target.value) })}
                            helperText="Longueur maximale des réponses"
                            disabled={!ollamaConfig.enabled}
                        />
                    </Grid>
                </Grid>

                <Alert severity="info" icon={<InfoIcon />} sx={{ mt: 2 }}>
                    <Typography variant="body2">
                        <strong>Ollama</strong> est le moteur d'intelligence artificielle utilisé par DocuCortex pour analyser et répondre aux questions sur vos documents.
                        Assurez-vous que le serveur Ollama est accessible et qu'un modèle compatible est installé.
                    </Typography>
                </Alert>
            </Paper>

            {/* Section GED / Indexation Réseau */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NetworkIcon color="primary" /> Indexation Réseau
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={gedConfig.autoIndex}
                                    onChange={(e) => setGedConfig({ ...gedConfig, autoIndex: e.target.checked })}
                                />
                            }
                            label="Indexation automatique"
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Chemin réseau à indexer"
                            value={gedConfig.serverPath}
                            onChange={(e) => setGedConfig({ ...gedConfig, serverPath: e.target.value })}
                            placeholder="\\192.168.1.230\Donnees"
                            helperText="Chemin UNC du dossier réseau à indexer"
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Répertoire de travail"
                            value={gedConfig.workingDirectory}
                            onChange={(e) => setGedConfig({ ...gedConfig, workingDirectory: e.target.value })}
                            placeholder="Laisser vide pour utiliser le défaut"
                            helperText="Répertoire local pour le cache"
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Intervalle de scan (minutes)"
                            value={gedConfig.scanInterval}
                            onChange={(e) => setGedConfig({ ...gedConfig, scanInterval: parseInt(e.target.value) })}
                            helperText="Fréquence de mise à jour de l'index"
                            disabled={!gedConfig.autoIndex}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Taille maximale de fichier"
                            value={gedConfig.maxFileSize}
                            onChange={(e) => setGedConfig({ ...gedConfig, maxFileSize: parseInt(e.target.value) })}
                            helperText={`Taille max en octets (actuellement: ${formatFileSize(gedConfig.maxFileSize)})`}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Dossiers exclus (un par ligne)"
                            value={gedConfig.excludedFolders.join('\n')}
                            onChange={(e) => setGedConfig({ ...gedConfig, excludedFolders: e.target.value.split('\n').filter(f => f.trim()) })}
                            helperText="Dossiers à ignorer lors de l'indexation"
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <Box>
                            <Typography variant="body2" gutterBottom>
                                Dossiers actuellement exclus:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {gedConfig.excludedFolders.map((folder, index) => (
                                    <Chip
                                        key={index}
                                        label={folder}
                                        size="small"
                                        onDelete={() => {
                                            const newFolders = gedConfig.excludedFolders.filter((_, i) => i !== index);
                                            setGedConfig({ ...gedConfig, excludedFolders: newFolders });
                                        }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Statistiques d'indexation */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FolderIcon color="primary" /> État de l'indexation
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Documents indexés
                                </Typography>
                                <Typography variant="h4">
                                    --
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Dernier scan
                                </Typography>
                                <Typography variant="h6">
                                    --
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Taille totale
                                </Typography>
                                <Typography variant="h6">
                                    --
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Statut
                                </Typography>
                                <Chip label="Prêt" color="success" size="small" />
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                <Alert severity="info" icon={<InfoIcon />} sx={{ mt: 2 }}>
                    Les statistiques détaillées seront disponibles après la première indexation.
                </Alert>
            </Paper>

            {/* Boutons d'action */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                    variant="outlined"
                    onClick={() => {
                        // Recharger depuis config
                        if (config?.networkDocuments) {
                            setGedConfig(config.networkDocuments);
                        }
                        if (config?.ollama) {
                            setOllamaConfig(config.ollama);
                        }
                    }}
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
        </Box>
    );
};

export default GEDSettingsPanel;
