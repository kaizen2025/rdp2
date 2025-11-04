/**
 * Page principale de l'Assistant IA - DocuCortex
 * VERSION COMPLÈTE Multi-Langues (FR, EN, ES)
 * GED Intelligente + Support Utilisateur
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Tab,
    Tabs,
    Card,
    CardContent,
    Alert,
    Button,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip,
    IconButton
} from '@mui/material';
import {
    SmartToy as BotIcon,
    Upload as UploadIcon,
    Description as DocumentIcon,
    CloudSync as NetworkIcon,
    Scanner as ScannerIcon,
    Analytics as AnalyticsIcon,
    Summarize as SummarizeIcon,
    History as HistoryIcon,
    Settings as SettingsIcon,
    Refresh as RefreshIcon,
    Delete as DeleteIcon,
    Visibility as PreviewIcon
} from '@mui/icons-material';

// Composants
import ChatInterfaceDocuCortex from '../components/AI/ChatInterfaceDocuCortex';
import DocumentUploader from '../components/AI/DocumentUploader';
import NetworkConfigPanel from '../components/AI/NetworkConfigPanel';
import OCRPanel from '../components/AI/OCRPanel';
import AnalysisPanel from '../components/AI/AnalysisPanel';
import SummaryPanel from '../components/AI/SummaryPanel';
import PermissionGate from '../components/auth/PermissionGate';
import { usePermissions } from '../hooks/usePermissions';
import apiService from '../services/apiService';

const AIAssistantPage = () => {
    const { hasPermission } = usePermissions();

    // États principaux
    const [currentTab, setCurrentTab] = useState(0);
    const [documents, setDocuments] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // États pour les sessions de chat
    const [docuSessionId] = useState(() => {
        const stored = localStorage.getItem('docucortex_session_id');
        if (stored) return stored;
        const newId = `docu_${Date.now()}`;
        localStorage.setItem('docucortex_session_id', newId);
        return newId;
    });

    // États pour dialog de suppression
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // États pour prévisualisation
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);

    // États pour les préférences
    const [preferences, setPreferences] = useState(() => {
        const stored = localStorage.getItem('docucortex_preferences');
        return stored ? JSON.parse(stored) : {
            language: 'fr',
            autoAnalyze: true,
            notifications: true
        };
    });

    // Définition des onglets
    const tabs = [
        { label: 'Chat IA', icon: <BotIcon />, permission: null },
        { label: 'Upload Documents', icon: <UploadIcon />, permission: 'ged_upload:create' },
        { label: 'OCR', icon: <ScannerIcon />, permission: null },
        { label: 'Analyse', icon: <AnalyticsIcon />, permission: null },
        { label: 'Résumé', icon: <SummarizeIcon />, permission: null },
        { label: 'Documents', icon: <DocumentIcon />, permission: null },
        { label: 'Config Réseau', icon: <NetworkIcon />, permission: 'ged_network_scan:admin' },
        { label: 'Historique', icon: <HistoryIcon />, permission: null },
        { label: 'Paramètres', icon: <SettingsIcon />, permission: null }
    ];

    useEffect(() => {
        initializePage();
    }, []);

    useEffect(() => {
        // Sauvegarder les préférences
        localStorage.setItem('docucortex_preferences', JSON.stringify(preferences));
    }, [preferences]);

    const initializePage = async () => {
        await loadDocuments();
        await loadStatistics();
    };

    const loadDocuments = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await apiService.getAIDocuments();
            if (data.success) {
                setDocuments(data.documents || []);
            }
        } catch (error) {
            console.error('Erreur chargement documents:', error);
            setError('Erreur lors du chargement des documents');
        } finally {
            setLoading(false);
        }
    };

    const loadStatistics = async () => {
        try {
            const data = await apiService.getAIStatistics();
            if (data.success) {
                setStatistics(data);
            }
        } catch (error) {
            console.error('Erreur chargement statistiques:', error);
        }
    };

    const handleUploadComplete = (result) => {
        loadDocuments();
        loadStatistics();
    };

    const handleDeleteDocument = async () => {
        if (!documentToDelete) return;

        try {
            setIsProcessing(true);
            setError(null);
            const data = await apiService.deleteAIDocument(documentToDelete);
            if (data.success) {
                loadDocuments();
                loadStatistics();
            } else {
                setError('Impossible de supprimer le document');
            }
        } catch (error) {
            console.error('Erreur suppression document:', error);
            setError('Erreur lors de la suppression du document');
        } finally {
            setDeleteDialogOpen(false);
            setDocumentToDelete(null);
            setIsProcessing(false);
        }
    };

    const handlePreviewDocument = (document) => {
        setSelectedDocument(document);
        setPreviewDialogOpen(true);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return 'N/A';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    // Filtrer les onglets selon les permissions
    const filteredTabs = tabs.filter(tab => !tab.permission || hasPermission(tab.permission));

    return (
        <Box sx={{ p: 3, height: '100%', overflow: 'hidden' }}>
            {/* En-tête DocuCortex */}
            <Box sx={{
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <BotIcon sx={{ fontSize: 48, mr: 2 }} />
                    <Box>
                        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                            DocuCortex AI
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            GED Intelligente Multi-Langues (FR • EN • ES) - Votre Assistant Documentaire
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="contained"
                        sx={{ bgcolor: 'white', color: '#667eea', '&:hover': { bgcolor: '#f0f0f0' } }}
                        startIcon={<RefreshIcon />}
                        onClick={() => {
                            loadDocuments();
                            loadStatistics();
                        }}
                    >
                        Actualiser
                    </Button>
                </Box>
            </Box>

            {/* Affichage des erreurs */}
            {error && (
                <Alert
                    severity="error"
                    onClose={() => setError(null)}
                    sx={{ mb: 2 }}
                >
                    {error}
                </Alert>
            )}

            {/* Statistiques rapides */}
            {statistics && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    📄 Documents Indexés
                                </Typography>
                                <Typography variant="h4">
                                    {statistics.database?.totalDocuments || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    💬 Conversations
                                </Typography>
                                <Typography variant="h4">
                                    {statistics.database?.totalConversations || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    🧩 Chunks de Texte
                                </Typography>
                                <Typography variant="h4">
                                    {statistics.database?.totalChunks || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    🔥 Sessions Actives
                                </Typography>
                                <Typography variant="h4">
                                    {statistics.sessions?.activeSessions || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Onglets principaux DocuCortex */}
            <Paper sx={{ height: 'calc(100% - 300px)' }}>
                <Tabs
                    value={currentTab}
                    onChange={(e, newValue) => setCurrentTab(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        '& .Mui-selected': {
                            color: '#667eea !important'
                        }
                    }}
                >
                    {filteredTabs.map((tab, index) => (
                        <Tab
                            key={index}
                            icon={tab.icon}
                            label={tab.label}
                            iconPosition="start"
                        />
                    ))}
                </Tabs>

                <Box sx={{ height: 'calc(100% - 48px)', overflow: 'auto' }}>
                    {/* Onglet Chat IA */}
                    {currentTab === 0 && (
                        <Box sx={{ height: '100%' }}>
                            <ChatInterfaceDocuCortex
                                sessionId={docuSessionId}
                                onMessageSent={(data) => {
                                    loadStatistics();
                                }}
                            />
                        </Box>
                    )}

                    {/* Onglet Upload Documents */}
                    {currentTab === 1 && (
                        <PermissionGate
                            permission="ged_upload:create"
                            fallback={
                                <Box sx={{ p: 3 }}>
                                    <Alert severity="warning">
                                        Vous n'avez pas les permissions nécessaires pour uploader des documents.
                                    </Alert>
                                </Box>
                            }
                        >
                            <Box sx={{ p: 3 }}>
                                <DocumentUploader onUploadComplete={handleUploadComplete} />
                            </Box>
                        </PermissionGate>
                    )}

                    {/* Onglet OCR */}
                    {currentTab === 2 && <OCRPanel />}

                    {/* Onglet Analyse */}
                    {currentTab === 3 && <AnalysisPanel />}

                    {/* Onglet Résumé */}
                    {currentTab === 4 && <SummaryPanel />}

                    {/* Onglet Documents */}
                    {currentTab === 5 && (
                        <Box sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Documents Indexés ({documents.length})
                            </Typography>
                            <Grid container spacing={2}>
                                {documents.map(doc => (
                                    <Grid item xs={12} md={6} lg={4} key={doc.id}>
                                        <Card sx={{ cursor: 'pointer' }} onClick={() => handlePreviewDocument(doc)}>
                                            <CardContent>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <DocumentIcon sx={{ mr: 1, color: 'primary.main' }} />
                                                    <Typography variant="h6" noWrap>
                                                        {doc.filename}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                                                    <Chip label={doc.file_type?.toUpperCase()} size="small" color="primary" />
                                                    <Chip label={doc.language?.toUpperCase()} size="small" variant="outlined" />
                                                </Box>
                                                <Typography variant="caption" display="block" color="text.secondary">
                                                    Taille: {formatFileSize(doc.file_size)}
                                                </Typography>
                                                <Typography variant="caption" display="block" color="text.secondary">
                                                    Indexé: {formatDate(doc.indexed_at)}
                                                </Typography>
                                                <PermissionGate permission="ged_delete:delete">
                                                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                                        <Tooltip title="Supprimer">
                                                            <IconButton
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setDocumentToDelete(doc.id);
                                                                    setDeleteDialogOpen(true);
                                                                }}
                                                                color="error"
                                                            >
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </PermissionGate>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    )}

                    {/* Onglet Config Réseau */}
                    {currentTab === 6 && (
                        <PermissionGate
                            permission="ged_network_scan:admin"
                            fallback={
                                <Box sx={{ p: 3 }}>
                                    <Alert severity="warning">
                                        Vous n'avez pas les permissions nécessaires pour la configuration réseau.
                                    </Alert>
                                </Box>
                            }
                        >
                            <NetworkConfigPanel />
                        </PermissionGate>
                    )}

                    {/* Onglet Historique */}
                    {currentTab === 7 && (
                        <Box sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Historique & Favoris
                            </Typography>
                            <Alert severity="info">
                                L'historique complet des conversations sera affiché ici.
                            </Alert>
                        </Box>
                    )}

                    {/* Onglet Paramètres */}
                    {currentTab === 8 && (
                        <Box sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Paramètres DocuCortex
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="subtitle1" gutterBottom>
                                                Langue Préférée
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                {['fr', 'en', 'es'].map(lang => (
                                                    <Button
                                                        key={lang}
                                                        variant={preferences.language === lang ? 'contained' : 'outlined'}
                                                        onClick={() => setPreferences({ ...preferences, language: lang })}
                                                    >
                                                        {lang.toUpperCase()}
                                                    </Button>
                                                ))}
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </Box>
            </Paper>

            {/* Dialog de suppression */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirmer la suppression</DialogTitle>
                <DialogContent>
                    <Typography>
                        Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>
                        Annuler
                    </Button>
                    <Button
                        onClick={handleDeleteDocument}
                        color="error"
                        variant="contained"
                        disabled={isProcessing}
                    >
                        {isProcessing ? 'Suppression...' : 'Supprimer'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog de prévisualisation */}
            <Dialog
                open={previewDialogOpen}
                onClose={() => setPreviewDialogOpen(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="h6">
                            Prévisualisation: {selectedDocument?.filename}
                        </Typography>
                        <Button onClick={() => setPreviewDialogOpen(false)}>
                            Fermer
                        </Button>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {selectedDocument && (
                        <Box>
                            <Typography variant="body2">
                                <strong>Type:</strong> {selectedDocument.file_type}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Taille:</strong> {formatFileSize(selectedDocument.file_size)}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Langue:</strong> {selectedDocument.language?.toUpperCase()}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default AIAssistantPage;
