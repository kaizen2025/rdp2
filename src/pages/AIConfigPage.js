/**
 * Page de Configuration de l'IA
 * Permet de configurer les providers, clés API, modèles, et paramètres
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    CardActions,
    Button,
    TextField,
    Switch,
    FormControlLabel,
    Chip,
    Alert,
    Snackbar,
    CircularProgress,
    Divider,
    Tabs,
    Tab,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip,
    LinearProgress,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    InputAdornment
} from '@mui/material';
import {
    Settings as SettingsIcon,
    Refresh as RefreshIcon,
    Save as SaveIcon,
    CheckCircle as CheckIcon,
    Error as ErrorIcon,
    Visibility,
    VisibilityOff,
    Speed as SpeedIcon,
    Memory as MemoryIcon,
    Assessment as StatsIcon,
    CloudQueue as CloudIcon,
    Language as LanguageIcon,
    Security as SecurityIcon,
    Toggle
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE = 'http://localhost:3002/api/ai';

function AIConfigPage() {
    // State pour la configuration
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState({});
    const [statistics, setStatistics] = useState(null);

    // State pour les messages
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    // State pour les tabs
    const [currentTab, setCurrentTab] = useState(0);

    // State pour masquer les clés API
    const [showApiKeys, setShowApiKeys] = useState({});

    // State pour les dialogues
    const [testDialog, setTestDialog] = useState({ open: false, provider: null, result: null });

    // Charger la configuration au démarrage
    useEffect(() => {
        loadConfiguration();
        loadStatistics();
    }, []);

    // Charger la configuration
    const loadConfiguration = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE}/config`);
            if (response.data.success) {
                setConfig(response.data.config);
            } else {
                showMessage('Erreur lors du chargement de la configuration', 'error');
            }
        } catch (error) {
            console.error('Erreur chargement configuration:', error);
            showMessage('Erreur lors du chargement de la configuration', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Charger les statistiques
    const loadStatistics = async () => {
        try {
            const response = await axios.get(`${API_BASE}/statistics`);
            if (response.data.success) {
                setStatistics(response.data);
            }
        } catch (error) {
            console.error('Erreur chargement statistiques:', error);
        }
    };

    // Sauvegarder la configuration
    const saveConfiguration = async () => {
        try {
            setSaving(true);
            const response = await axios.put(`${API_BASE}/config`, config);
            if (response.data.success) {
                showMessage('Configuration sauvegardée avec succès', 'success');
                await loadConfiguration(); // Recharger pour obtenir l'état à jour
            } else {
                showMessage('Erreur lors de la sauvegarde', 'error');
            }
        } catch (error) {
            console.error('Erreur sauvegarde configuration:', error);
            showMessage('Erreur lors de la sauvegarde', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Tester la connexion d'un provider
    const testProvider = async (providerName) => {
        try {
            setTesting({ ...testing, [providerName]: true });
            const provider = config.providers[providerName];

            const response = await axios.post(`${API_BASE}/providers/${providerName}/test`, {
                apiKey: provider.apiKey,
                model: provider.model
            });

            setTestDialog({
                open: true,
                provider: providerName,
                result: response.data
            });

            if (response.data.success) {
                showMessage(`${providerName} : connexion réussie`, 'success');
            } else {
                showMessage(`${providerName} : échec de connexion`, 'error');
            }
        } catch (error) {
            console.error(`Erreur test ${providerName}:`, error);
            setTestDialog({
                open: true,
                provider: providerName,
                result: { success: false, error: error.message }
            });
            showMessage(`Erreur lors du test de ${providerName}`, 'error');
        } finally {
            setTesting({ ...testing, [providerName]: false });
        }
    };

    // Activer/désactiver un provider
    const toggleProvider = async (providerName, enabled) => {
        try {
            const response = await axios.post(`${API_BASE}/providers/${providerName}/toggle`, {
                enabled: enabled
            });

            if (response.data.success) {
                // Mettre à jour l'état local
                setConfig(prevConfig => ({
                    ...prevConfig,
                    providers: {
                        ...prevConfig.providers,
                        [providerName]: {
                            ...prevConfig.providers[providerName],
                            enabled: enabled
                        }
                    }
                }));
                showMessage(`${providerName} ${enabled ? 'activé' : 'désactivé'}`, 'success');
                await loadConfiguration();
            } else {
                showMessage(`Erreur lors du changement d'état de ${providerName}`, 'error');
            }
        } catch (error) {
            console.error(`Erreur toggle ${providerName}:`, error);
            showMessage(`Erreur lors du changement d'état de ${providerName}`, 'error');
        }
    };

    // Mettre à jour une valeur de configuration
    const updateConfig = (path, value) => {
        const pathArray = path.split('.');
        setConfig(prevConfig => {
            const newConfig = JSON.parse(JSON.stringify(prevConfig));
            let current = newConfig;

            for (let i = 0; i < pathArray.length - 1; i++) {
                current = current[pathArray[i]];
            }

            current[pathArray[pathArray.length - 1]] = value;
            return newConfig;
        });
    };

    // Afficher un message
    const showMessage = (message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    // Render loading
    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!config) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Alert severity="error">Impossible de charger la configuration</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" gutterBottom>
                        <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Configuration IA
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Gérez les providers, modèles et paramètres de l'intelligence artificielle
                    </Typography>
                </Box>
                <Box>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={loadConfiguration}
                        sx={{ mr: 1 }}
                    >
                        Actualiser
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={saveConfiguration}
                        disabled={saving}
                    >
                        {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                    </Button>
                </Box>
            </Box>

            {/* Tabs */}
            <Paper sx={{ mb: 3 }}>
                <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
                    <Tab label="Providers" icon={<CloudIcon />} iconPosition="start" />
                    <Tab label="Paramètres" icon={<SettingsIcon />} iconPosition="start" />
                    <Tab label="Statistiques" icon={<StatsIcon />} iconPosition="start" />
                </Tabs>
            </Paper>

            {/* Tab 1: Providers */}
            {currentTab === 0 && (
                <Grid container spacing={3}>
                    {Object.keys(config.providers || {}).map(providerName => {
                        const provider = config.providers[providerName];
                        const isActive = provider.status?.active;
                        const isEnabled = provider.enabled;

                        return (
                            <Grid item xs={12} md={6} key={providerName}>
                                <Card
                                    variant="outlined"
                                    sx={{
                                        borderColor: isActive ? 'primary.main' : 'divider',
                                        borderWidth: isActive ? 2 : 1,
                                        position: 'relative'
                                    }}
                                >
                                    {isActive && (
                                        <Chip
                                            label="Actif"
                                            color="primary"
                                            size="small"
                                            sx={{ position: 'absolute', top: 10, right: 10 }}
                                        />
                                    )}

                                    <CardContent>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                            <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                                                {providerName}
                                            </Typography>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={isEnabled}
                                                        onChange={(e) => toggleProvider(providerName, e.target.checked)}
                                                        color="primary"
                                                    />
                                                }
                                                label={isEnabled ? "Activé" : "Désactivé"}
                                            />
                                        </Box>

                                        <Divider sx={{ my: 2 }} />

                                        {/* Priorité */}
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Priorité"
                                            value={provider.priority || 0}
                                            onChange={(e) => updateConfig(`providers.${providerName}.priority`, parseInt(e.target.value))}
                                            margin="normal"
                                            size="small"
                                            helperText="1 = priorité la plus élevée"
                                        />

                                        {/* Clé API */}
                                        <TextField
                                            fullWidth
                                            label="Clé API"
                                            value={provider.apiKey || ''}
                                            onChange={(e) => updateConfig(`providers.${providerName}.apiKey`, e.target.value)}
                                            margin="normal"
                                            size="small"
                                            type={showApiKeys[providerName] ? 'text' : 'password'}
                                            InputProps={{
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton
                                                            onClick={() => setShowApiKeys({
                                                                ...showApiKeys,
                                                                [providerName]: !showApiKeys[providerName]
                                                            })}
                                                            edge="end"
                                                        >
                                                            {showApiKeys[providerName] ? <VisibilityOff /> : <Visibility />}
                                                        </IconButton>
                                                    </InputAdornment>
                                                )
                                            }}
                                        />

                                        {/* Modèle */}
                                        <TextField
                                            fullWidth
                                            label="Modèle"
                                            value={provider.model || ''}
                                            onChange={(e) => updateConfig(`providers.${providerName}.model`, e.target.value)}
                                            margin="normal"
                                            size="small"
                                        />

                                        {/* Température */}
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Température"
                                            value={provider.temperature || 0.7}
                                            onChange={(e) => updateConfig(`providers.${providerName}.temperature`, parseFloat(e.target.value))}
                                            margin="normal"
                                            size="small"
                                            inputProps={{ min: 0, max: 2, step: 0.1 }}
                                            helperText="0 = déterministe, 1 = créatif"
                                        />

                                        {/* Max Tokens */}
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Max Tokens"
                                            value={provider.max_tokens || 2048}
                                            onChange={(e) => updateConfig(`providers.${providerName}.max_tokens`, parseInt(e.target.value))}
                                            margin="normal"
                                            size="small"
                                        />

                                        {/* Statut */}
                                        {provider.status && (
                                            <Box mt={2}>
                                                <Chip
                                                    icon={provider.status.initialized ? <CheckIcon /> : <ErrorIcon />}
                                                    label={provider.status.initialized ? "Initialisé" : "Non initialisé"}
                                                    color={provider.status.initialized ? "success" : "default"}
                                                    size="small"
                                                />
                                            </Box>
                                        )}
                                    </CardContent>

                                    <CardActions>
                                        <Button
                                            size="small"
                                            onClick={() => testProvider(providerName)}
                                            disabled={testing[providerName] || !isEnabled}
                                            startIcon={testing[providerName] ? <CircularProgress size={16} /> : null}
                                        >
                                            {testing[providerName] ? 'Test en cours...' : 'Tester la connexion'}
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {/* Tab 2: Paramètres */}
            {currentTab === 1 && (
                <Grid container spacing={3}>
                    {/* Fallback */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    Fallback
                                </Typography>
                                <Divider sx={{ my: 2 }} />

                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={config.fallback?.enabled || false}
                                            onChange={(e) => updateConfig('fallback.enabled', e.target.checked)}
                                        />
                                    }
                                    label="Activer le fallback"
                                />

                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={config.fallback?.autoSwitch || false}
                                            onChange={(e) => updateConfig('fallback.autoSwitch', e.target.checked)}
                                        />
                                    }
                                    label="Basculement automatique"
                                />

                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Tentatives de retry"
                                    value={config.fallback?.retryAttempts || 2}
                                    onChange={(e) => updateConfig('fallback.retryAttempts', parseInt(e.target.value))}
                                    margin="normal"
                                    size="small"
                                />
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* OCR */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    <LanguageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    OCR (EasyOCR)
                                </Typography>
                                <Divider sx={{ my: 2 }} />

                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={config.ocr?.enabled || false}
                                            onChange={(e) => updateConfig('ocr.enabled', e.target.checked)}
                                        />
                                    }
                                    label="Activer l'OCR"
                                />

                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={config.ocr?.gpu || false}
                                            onChange={(e) => updateConfig('ocr.gpu', e.target.checked)}
                                        />
                                    }
                                    label="Utiliser le GPU"
                                />

                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Seuil de confiance"
                                    value={config.ocr?.confidence_threshold || 0.6}
                                    onChange={(e) => updateConfig('ocr.confidence_threshold', parseFloat(e.target.value))}
                                    margin="normal"
                                    size="small"
                                    inputProps={{ min: 0, max: 1, step: 0.1 }}
                                />

                                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                    Langues supportées: {config.ocr?.languages?.length || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Chat */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    <MemoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    Chat
                                </Typography>
                                <Divider sx={{ my: 2 }} />

                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Contexte maximum"
                                    value={config.chat?.max_context || 10}
                                    onChange={(e) => updateConfig('chat.max_context', parseInt(e.target.value))}
                                    margin="normal"
                                    size="small"
                                    helperText="Nombre de messages gardés en mémoire"
                                />

                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={config.chat?.auto_save || false}
                                            onChange={(e) => updateConfig('chat.auto_save', e.target.checked)}
                                        />
                                    }
                                    label="Sauvegarde automatique"
                                />

                                <FormControl fullWidth margin="normal" size="small">
                                    <InputLabel>Thème</InputLabel>
                                    <Select
                                        value={config.chat?.theme || 'light'}
                                        onChange={(e) => updateConfig('chat.theme', e.target.value)}
                                        label="Thème"
                                    >
                                        <MenuItem value="light">Clair</MenuItem>
                                        <MenuItem value="dark">Sombre</MenuItem>
                                    </Select>
                                </FormControl>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Network */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    <SpeedIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    Réseau
                                </Typography>
                                <Divider sx={{ my: 2 }} />

                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Timeout (secondes)"
                                    value={config.network?.timeout || 30}
                                    onChange={(e) => updateConfig('network.timeout', parseInt(e.target.value))}
                                    margin="normal"
                                    size="small"
                                />

                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Tentatives de retry"
                                    value={config.network?.retries || 3}
                                    onChange={(e) => updateConfig('network.retries', parseInt(e.target.value))}
                                    margin="normal"
                                    size="small"
                                />
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Tab 3: Statistiques */}
            {currentTab === 2 && (
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="h6">
                                        <StatsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                        Statistiques de l'IA
                                    </Typography>
                                    <Button
                                        size="small"
                                        startIcon={<RefreshIcon />}
                                        onClick={loadStatistics}
                                    >
                                        Actualiser
                                    </Button>
                                </Box>

                                {statistics ? (
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Paper sx={{ p: 2, textAlign: 'center' }} elevation={0} variant="outlined">
                                                <Typography variant="h4" color="primary">
                                                    {statistics.totalDocuments || 0}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Documents indexés
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Paper sx={{ p: 2, textAlign: 'center' }} elevation={0} variant="outlined">
                                                <Typography variant="h4" color="primary">
                                                    {statistics.totalConversations || 0}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Conversations
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Paper sx={{ p: 2, textAlign: 'center' }} elevation={0} variant="outlined">
                                                <Typography variant="h4" color="primary">
                                                    {statistics.totalQueries || 0}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Requêtes totales
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Paper sx={{ p: 2, textAlign: 'center' }} elevation={0} variant="outlined">
                                                <Typography variant="h4" color="primary">
                                                    {statistics.averageResponseTime || 0}ms
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Temps de réponse moyen
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                ) : (
                                    <Box display="flex" justifyContent="center" py={4}>
                                        <CircularProgress />
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Snackbar pour les notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* Dialog pour les résultats de test */}
            <Dialog
                open={testDialog.open}
                onClose={() => setTestDialog({ ...testDialog, open: false })}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Test de connexion - {testDialog.provider}
                </DialogTitle>
                <DialogContent>
                    {testDialog.result ? (
                        <Box>
                            <Alert severity={testDialog.result.success ? 'success' : 'error'} sx={{ mb: 2 }}>
                                {testDialog.result.success ? 'Connexion réussie !' : 'Échec de connexion'}
                            </Alert>

                            {testDialog.result.success ? (
                                <List dense>
                                    <ListItem>
                                        <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                                        <ListItemText
                                            primary="Provider connecté"
                                            secondary={testDialog.result.provider || testDialog.provider}
                                        />
                                    </ListItem>
                                    {testDialog.result.model && (
                                        <ListItem>
                                            <ListItemIcon><MemoryIcon /></ListItemIcon>
                                            <ListItemText
                                                primary="Modèle"
                                                secondary={testDialog.result.model}
                                            />
                                        </ListItem>
                                    )}
                                    {testDialog.result.responseTime && (
                                        <ListItem>
                                            <ListItemIcon><SpeedIcon /></ListItemIcon>
                                            <ListItemText
                                                primary="Temps de réponse"
                                                secondary={`${testDialog.result.responseTime}ms`}
                                            />
                                        </ListItem>
                                    )}
                                </List>
                            ) : (
                                <Alert severity="error">
                                    {testDialog.result.error || 'Erreur inconnue'}
                                </Alert>
                            )}
                        </Box>
                    ) : (
                        <Box display="flex" justifyContent="center" py={2}>
                            <CircularProgress />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTestDialog({ ...testDialog, open: false })}>
                        Fermer
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default AIConfigPage;
