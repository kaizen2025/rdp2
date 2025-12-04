/**
 * Composant de configuration de l'URL de mise à jour
 * Permet de configurer le chemin réseau pour les mises à jour automatiques
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    Button,
    Alert,
    Paper,
    Typography,
    IconButton,
    InputAdornment,
    CircularProgress,
    Chip
} from '@mui/material';
import {
    Save as SaveIcon,
    Refresh as RefreshIcon,
    FolderOpen as FolderIcon,
    CheckCircle as CheckIcon,
    Error as ErrorIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE = 'http://localhost:3002/api/ai/config';

function UpdateUrlConfig() {
    const [updateUrl, setUpdateUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        loadUpdateUrl();
    }, []);

    const loadUpdateUrl = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE}/update-url`);

            if (response.data.success) {
                setUpdateUrl(response.data.updateUrl);
            }
        } catch (error) {
            console.error('[UpdateUrlConfig] Erreur chargement:', error);
            // URL par défaut
            setUpdateUrl('file://192.168.1.230/donnees/Informatique/PROGRAMMES/Programme RDS/RDS Viewer Group/update');
        } finally {
            setLoading(false);
        }
    };

    const saveUpdateUrl = async () => {
        try {
            setSaving(true);
            setMessage({ type: '', text: '' });

            const response = await axios.post(`${API_BASE}/update-url`, {
                updateUrl
            });

            if (response.data.success) {
                setMessage({
                    type: 'success',
                    text: 'URL de mise à jour sauvegardée avec succès'
                });

                // Informer Electron de recharger la configuration
                if (window.electronAPI?.reloadUpdateConfig) {
                    window.electronAPI.reloadUpdateConfig();
                }
            } else {
                setMessage({
                    type: 'error',
                    text: response.data.error || 'Erreur lors de la sauvegarde'
                });
            }
        } catch (error) {
            console.error('[UpdateUrlConfig] Erreur sauvegarde:', error);
            setMessage({
                type: 'error',
                text: 'Erreur lors de la sauvegarde de l\'URL'
            });
        } finally {
            setSaving(false);
        }
    };

    const resetToDefault = () => {
        setUpdateUrl('file://192.168.1.230/donnees/Informatique/PROGRAMMES/Programme RDS/RDS Viewer Group/update');
        setMessage({ type: '', text: '' });
    };

    const isNetworkPath = (url) => {
        return url.startsWith('file://') ||
               url.startsWith('\\\\') ||
               url.startsWith('http://') ||
               url.startsWith('https://');
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                <FolderIcon color="primary" />
                <Typography variant="h6">
                    Configuration des Mises à Jour
                </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" paragraph>
                Configurez le chemin réseau où sont hébergées les mises à jour de l'application.
                L'application vérifiera automatiquement les nouvelles versions à ce loca.
            </Typography>

            {/* Champ URL */}
            <TextField
                fullWidth
                label="URL de Mise à Jour"
                value={updateUrl}
                onChange={(e) => setUpdateUrl(e.target.value)}
                disabled={loading}
                margin="normal"
                placeholder="file://192.168.1.230/..."
                helperText="Chemin réseau (file://...) ou URL web (https://...)"
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <FolderIcon />
                        </InputAdornment>
                    )
                }}
            />

            {/* Validation visuelle */}
            {updateUrl && (
                <Box sx={{ mt: 1, mb: 2 }}>
                    {isNetworkPath(updateUrl) ? (
                        <Chip
                            icon={<CheckIcon />}
                            label="Format valide"
                            color="success"
                            size="small"
                        />
                    ) : (
                        <Chip
                            icon={<ErrorIcon />}
                            label="Format invalide"
                            color="error"
                            size="small"
                        />
                    )}
                </Box>
            )}

            {/* Boutons d'action */}
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                    onClick={saveUpdateUrl}
                    disabled={saving || loading || !isNetworkPath(updateUrl)}
                >
                    {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>

                <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={resetToDefault}
                    disabled={loading || saving}
                >
                    Valeur par défaut
                </Button>
            </Box>

            {/* Messages */}
            {message.text && (
                <Alert severity={message.type} sx={{ mt: 2 }}>
                    {message.text}
                </Alert>
            )}

            {/* Exemples de formats */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                    Exemples de formats supportés:
                </Typography>
                <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                    <li>
                        <Typography variant="body2" fontFamily="monospace">
                            file://192.168.1.230/donnees/Informatique/...
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Chemin réseau Windows (recommandé)
                        </Typography>
                    </li>
                    <li>
                        <Typography variant="body2" fontFamily="monospace">
                            \\192.168.1.230\donnees\Informatique\...
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Chemin UNC Windows
                        </Typography>
                    </li>
                    <li>
                        <Typography variant="body2" fontFamily="monospace">
                            https://updates.anecoop.com
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Serveur web HTTPS
                        </Typography>
                    </li>
                </Box>
            </Box>

            {/* Note importante */}
            <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                    <strong>Note:</strong> Les mises à jour sont vérifiées automatiquement:
                </Typography>
                <Box component="ul" sx={{ mt: 1, mb: 0 }}>
                    <li>Au démarrage de l'application</li>
                    <li>Toutes les heures (si l'application est ouverte)</li>
                    <li>Manuellement via le menu "Aide → Vérifier les mises à jour"</li>
                </Box>
            </Alert>
        </Paper>
    );
}

export default UpdateUrlConfig;
