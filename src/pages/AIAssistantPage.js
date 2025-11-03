/**
 * Page principale de l'Assistant IA - DocuCortex
 * Version améliorée avec réseau, preview et statistiques étendues
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
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Chip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Switch,
    FormControlLabel,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Divider,
    Tooltip
} from '@mui/material';
import {
    SmartToy as BotIcon,
    Upload as UploadIcon,
    Description as DocumentIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    CloudSync as NetworkIcon,
    Settings as SettingsIcon
} from '@mui/icons-material';

import ChatInterfaceDocuCortex from '../components/AI/ChatInterfaceDocuCortex';
import DocumentUploader from '../components/AI/DocumentUploader';
import NetworkConfigPanel from '../components/AI/NetworkConfigPanel';
import PermissionGate from '../components/auth/PermissionGate'; // ✅ NOUVEAU - Protection des actions
import { usePermissions } from '../hooks/usePermissions'; // ✅ NOUVEAU - Vérification permissions
import apiService from '../services/apiService';

const AIAssistantPage = () => {
    // ✅ NOUVEAU - Hook de permissions
    const { hasPermission, getUserRole } = usePermissions();

    // États principaux
    const [currentTab, setCurrentTab] = useState(0);
    const [chatMode, setChatMode] = useState('docucortex'); // 'classic' ou 'docucortex'
    const [documents, setDocuments] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [error, setError] = useState(null); // ✅ NOUVEAU - Gestion des erreurs
    
    // États pour les sessions de chat
    const [classicSessionId] = useState(() => {
        const stored = localStorage.getItem('classic_chat_session_id');
        if (stored) return stored;
        const newId = `classic_${Date.now()}`;
        localStorage.setItem('classic_chat_session_id', newId);
        return newId;
    });
    
    const [docuSessionId] = useState(() => {
        const stored = localStorage.getItem('docucortex_session_id');
        if (stored) return stored;
        const newId = `docu_${Date.now()}`;
        localStorage.setItem('docucortex_session_id', newId);
        return newId;
    });
    
    // États pour les dialogues et interactions
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
    
    // États pour les préférences utilisateur
    const [preferences, setPreferences] = useState(() => {
        const stored = localStorage.getItem('docucortex_preferences');
        return stored ? JSON.parse(stored) : {
            theme: 'light',
            chatSound: true,
            autoSave: true,
            language: 'fr',
            model: 'default'
        };
    });
    
    // États pour l'historique et les favoris
    const [favorites, setFavorites] = useState(() => {
        const stored = localStorage.getItem('docucortex_favorites');
        return stored ? JSON.parse(stored) : [];
    });
    
    const [conversationHistory, setConversationHistory] = useState(() => {
        const stored = localStorage.getItem('docucortex_history');
        return stored ? JSON.parse(stored) : {};
    });

    useEffect(() => {
        loadDocuments();
        loadStatistics();
        loadUserPreferences();
    }, []);

    useEffect(() => {
        // Sauvegarder les préférences utilisateur
        localStorage.setItem('docucortex_preferences', JSON.stringify(preferences));
    }, [preferences]);

    useEffect(() => {
        // Sauvegarder l'historique des conversations
        localStorage.setItem('docucortex_history', JSON.stringify(conversationHistory));
    }, [conversationHistory]);

    const loadDocuments = async () => {
        try {
            setIsProcessing(true);
            setError(null); // ✅ Reset error
            const data = await apiService.getAIDocuments();
            if (data.success) {
                setDocuments(data.documents);
            } else {
                setError('Impossible de charger les documents.');
            }
        } catch (error) {
            console.error('Erreur chargement documents:', error);
            setError('Erreur lors du chargement des documents. Veuillez réessayer.'); // ✅ User-friendly error
        } finally {
            setIsProcessing(false);
        }
    };

    const loadStatistics = async () => {
        try {
            const data = await apiService.getAIStatistics();
            if (data.success) {
                setStatistics(data);
            } else {
                console.warn('Statistiques non disponibles');
            }
        } catch (error) {
            console.error('Erreur chargement statistiques:', error);
            // ✅ Ne pas bloquer l'UI si les stats ne se chargent pas
        }
    };

    const loadUserPreferences = async () => {
        try {
            // Charger les préférences depuis l'API si disponible
            const data = await apiService.getUserPreferences();
            if (data.success) {
                setPreferences({ ...preferences, ...data.preferences });
            }
        } catch (error) {
            console.log('Utilisation des préférences locales');
        }
    };

    const handleUploadComplete = (result) => {
        loadDocuments();
        loadStatistics();
        // Notification de succès
        if (result.success) {
            console.log('Upload réussi:', result.message);
        }
    };

    const handleDeleteDocument = async () => {
        if (!documentToDelete) return;

        try {
            setIsProcessing(true);
            setError(null); // ✅ Reset error
            const data = await apiService.deleteAIDocument(documentToDelete);
            if (data.success) {
                loadDocuments();
                loadStatistics();
            } else {
                setError('Impossible de supprimer le document.'); // ✅ User-friendly error
            }
        } catch (error) {
            console.error('Erreur suppression document:', error);
            setError('Erreur lors de la suppression du document. Veuillez réessayer.'); // ✅ User-friendly error
        } finally {
            setDeleteDialogOpen(false);
            setDocumentToDelete(null);
            setIsProcessing(false);
        }
    };

    const handleChatModeChange = (mode) => {
        setChatMode(mode);
        // Log du changement de mode pour les analytics
        console.log(`Changement de mode chat: ${mode}`);
    };

    const handleAddFavorite = (conversationId, title, mode) => {
        const newFavorite = {
            id: Date.now(),
            conversationId,
            title,
            mode,
            createdAt: new Date().toISOString()
        };
        setFavorites([...favorites, newFavorite]);
    };

    const handleRemoveFavorite = (favoriteId) => {
        setFavorites(favorites.filter(fav => fav.id !== favoriteId));
    };

    const handleExportConversation = async (sessionId, mode) => {
        try {
            const data = await apiService.exportConversation(sessionId, mode);
            if (data.success) {
                // Créer et télécharger le fichier
                const blob = new Blob([data.content], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `conversation_${mode}_${sessionId}.txt`;
                a.click();
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Erreur export conversation:', error);
        }
    };

    const handleClearHistory = () => {
        setConversationHistory({});
        localStorage.removeItem('docucortex_history');
    };

    const handlePreviewDocument = (document) => {
        setSelectedDocument(document);
        setPreviewDialogOpen(true);
    };

    const updatePreferences = (newPreferences) => {
        setPreferences({ ...preferences, ...newPreferences });
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

    const getConversationCount = (mode) => {
        return Object.keys(conversationHistory).filter(key => 
            key.startsWith(mode)
        ).length;
    };

    const getFavoriteConversations = (mode) => {
        return favorites.filter(fav => fav.mode === mode);
    };

    const formatDuration = (startTime) => {
        const duration = Date.now() - new Date(startTime).getTime();
        const minutes = Math.floor(duration / 60000);
        const hours = Math.floor(minutes / 60);
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        }
        return `${minutes}m`;
    };

    return (
        <Box sx={{ p: 3, height: '100%', overflow: 'hidden' }}>
            {/* ✅ NOUVEAU - Affichage des erreurs globales */}
            {error && (
                <Alert
                    severity="error"
                    onClose={() => setError(null)}
                    sx={{ mb: 2 }}
                >
                    {error}
                </Alert>
            )}

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
                            DocuCortex
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Le Cortex de vos Documents - GED Intelligente
                        </Typography>
                    </Box>
                </Box>
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

            {/* Statistiques rapides */}
            {statistics && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Documents indexés
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
                                    Conversations
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
                                    Chunks de texte
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
                                    Sessions actives
                                </Typography>
                                <Typography variant="h4">
                                    {statistics.sessions?.activeSessions || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Sélecteur de mode de chat */}
            <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                <Typography variant="h6">Mode de Chat:</Typography>
                <Button
                    variant={chatMode === 'classic' ? 'contained' : 'outlined'}
                    onClick={() => handleChatModeChange('classic')}
                    color="primary"
                >
                    Chat IA Classique
                </Button>
                <Button
                    variant={chatMode === 'docucortex' ? 'contained' : 'outlined'}
                    onClick={() => handleChatModeChange('docucortex')}
                    color="secondary"
                >
                    Chat DocuCortex
                </Button>
            </Box>

            {/* Onglets principaux DocuCortex */}
            <Paper sx={{ height: 'calc(100% - 300px)' }}>
                <Tabs
                    value={currentTab}
                    onChange={(e, newValue) => setCurrentTab(newValue)}
                    sx={{ 
                        borderBottom: 1, 
                        borderColor: 'divider',
                        '& .Mui-selected': {
                            color: '#667eea !important'
                        }
                    }}
                >
                    <Tab icon={<BotIcon />} label={`Chat ${chatMode === 'classic' ? 'Classique' : 'DocuCortex'}`} />
                    {/* ✅ NOUVEAU - Afficher les tabs selon les permissions */}
                    {hasPermission('ged_upload:create') && <Tab icon={<UploadIcon />} label="Upload" />}
                    <Tab icon={<DocumentIcon />} label="Documents" />
                    {hasPermission('ged_network_scan:admin') && <Tab icon={<NetworkIcon />} label="Config Réseau" />}
                    <Tab label="Historique & Favoris" />
                    <Tab label="Préférences" />
                </Tabs>

                <Box sx={{ height: 'calc(100% - 48px)' }}>
                    {/* Onglet Chat */}
                    {currentTab === 0 && (
                        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            {chatMode === 'classic' ? (
                                // Chat IA Classique
                                <Box sx={{ p: 2, height: '100%' }}>
                                    <Alert severity="info" sx={{ mb: 2 }}>
                                        <Typography variant="body2">
                                            <strong>Chat IA Classique:</strong> Conversation générale sans accès aux documents.
                                        </Typography>
                                    </Alert>
                                    <Box sx={{ flex: 1, border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                                        <Typography variant="h6" gutterBottom>
                                            Interface de Chat IA Classique
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Cette interface sera intégrée prochainement. Session ID: {classicSessionId}
                                        </Typography>
                                        {/* Ici on intégrerait le composant ChatInterfaceClassique */}
                                    </Box>
                                </Box>
                            ) : (
                                // Chat DocuCortex
                                <Box sx={{ height: '100%' }}>
                                    <ChatInterfaceDocuCortex
                                        sessionId={docuSessionId}
                                        onMessageSent={(data) => {
                                            loadStatistics();
                                            // Ajouter à l'historique
                                            const historyKey = `docu_${docuSessionId}`;
                                            setConversationHistory(prev => ({
                                                ...prev,
                                                [historyKey]: {
                                                    ...prev[historyKey],
                                                    lastActivity: new Date().toISOString(),
                                                    messageCount: (prev[historyKey]?.messageCount || 0) + 1
                                                }
                                            }));
                                        }}
                                    />
                                </Box>
                            )}
                        </Box>
                    )}

                    {/* Onglet Upload - ✅ PROTÉGÉ PAR PERMISSION */}
                    {currentTab === 1 && (
                        <PermissionGate
                            permission="ged_upload:create"
                            fallback={
                                <Box sx={{ p: 3 }}>
                                    <Alert severity="warning">
                                        Vous n'avez pas les permissions nécessaires pour uploader des documents.
                                        Contactez votre administrateur pour obtenir l'accès.
                                    </Alert>
                                </Box>
                            }
                        >
                            <Box sx={{ p: 3, overflowY: 'auto', height: '100%' }}>
                                <Typography variant="h6" gutterBottom>
                                    Ajouter des documents
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    Uploadez vos documents pour permettre à DocuCortex de répondre à vos questions.
                                    Tous les fichiers sont traités localement et indexés pour la recherche intelligente.
                                </Typography>
                                {isProcessing && (
                                    <Alert severity="warning" sx={{ mb: 2 }}>
                                        Traitement en cours, veuillez patienter...
                                    </Alert>
                                )}
                                <DocumentUploader onUploadComplete={handleUploadComplete} />
                            </Box>
                        </PermissionGate>
                    )}

                    {/* Onglet Documents */}
                    {currentTab === 2 && (
                        <Box sx={{ p: 3, overflowY: 'auto', height: '100%' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">
                                    Documents indexés ({documents.length})
                                </Typography>
                                <Button
                                    variant="outlined"
                                    onClick={loadDocuments}
                                    disabled={isProcessing}
                                >
                                    Actualiser
                                </Button>
                            </Box>
                            {documents.length === 0 ? (
                                <Alert severity="info" sx={{ mt: 2 }}>
                                    Aucun document indexé. Utilisez l'onglet Upload pour ajouter des documents.
                                </Alert>
                            ) : (
                                <Grid container spacing={2}>
                                    {documents.map(doc => (
                                        <Grid item xs={12} md={6} lg={4} key={doc.id}>
                                            <Card sx={{ height: '100%', cursor: 'pointer' }}
                                                  onClick={() => handlePreviewDocument(doc)}>
                                                <CardContent>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                        <DocumentIcon sx={{ mr: 1, color: 'primary.main' }} />
                                                        <Typography variant="h6" noWrap>
                                                            {doc.filename}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                                        <Chip
                                                            size="small"
                                                            label={doc.file_type.toUpperCase()}
                                                            color="primary"
                                                        />
                                                        <Chip
                                                            size="small"
                                                            label={doc.language.toUpperCase()}
                                                            variant="outlined"
                                                        />
                                                    </Box>
                                                    <Typography variant="caption" display="block" color="text.secondary">
                                                        Taille: {formatFileSize(doc.file_size)}
                                                    </Typography>
                                                    <Typography variant="caption" display="block" color="text.secondary">
                                                        Indexé le: {formatDate(doc.indexed_at)}
                                                    </Typography>
                                                    {doc.metadata && (() => {
                                                        try {
                                                            const metadata = JSON.parse(doc.metadata);
                                                            return (
                                                                <Typography variant="caption" display="block" color="text.secondary">
                                                                    {metadata.wordCount} mots
                                                                </Typography>
                                                            );
                                                        } catch (e) {
                                                            return null;
                                                        }
                                                    })()}
                                                    {/* ✅ NOUVEAU - Bouton supprimer protégé par permission */}
                                                    <PermissionGate permission="ged_delete:delete">
                                                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                                            <Tooltip title="Supprimer le document">
                                                                <IconButton
                                                                    edge="end"
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
                            )}
                        </Box>
                    )}

                    {/* Onglet Configuration Réseau - ✅ PROTÉGÉ PAR PERMISSION */}
                    {currentTab === 3 && (
                        <PermissionGate
                            permission="ged_network_scan:admin"
                            fallback={
                                <Box sx={{ p: 3 }}>
                                    <Alert severity="warning">
                                        Vous n'avez pas les permissions nécessaires pour accéder à la configuration réseau.
                                        Contactez votre administrateur pour obtenir l'accès.
                                    </Alert>
                                </Box>
                            }
                        >
                            <Box sx={{ p: 3, overflowY: 'auto', height: '100%' }}>
                                <NetworkConfigPanel />
                            </Box>
                        </PermissionGate>
                    )}

                    {/* Onglet Historique & Favoris */}
                    {currentTab === 4 && (
                        <Box sx={{ p: 3, overflowY: 'auto', height: '100%' }}>
                            <Typography variant="h6" gutterBottom>
                                Historique et Favoris
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Paper sx={{ p: 2 }}>
                                        <Typography variant="h6" gutterBottom>
                                            Conversations Récentes
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            Chat Classique: {getConversationCount('classic')} conversations
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            Chat DocuCortex: {getConversationCount('docu')} conversations
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            color="warning"
                                            onClick={handleClearHistory}
                                            sx={{ mt: 1 }}
                                        >
                                            Effacer l'historique
                                        </Button>
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Paper sx={{ p: 2 }}>
                                        <Typography variant="h6" gutterBottom>
                                            Conversations Favorites ({favorites.length})
                                        </Typography>
                                        {favorites.length === 0 ? (
                                            <Typography variant="body2" color="text.secondary">
                                                Aucune conversation favorite
                                            </Typography>
                                        ) : (
                                            <List dense>
                                                {favorites.map(fav => (
                                                    <ListItem key={fav.id}>
                                                        <ListItemText
                                                            primary={fav.title}
                                                            secondary={`${fav.mode} • ${formatDate(fav.createdAt)}`}
                                                        />
                                                        <IconButton
                                                            edge="end"
                                                            onClick={() => handleRemoveFavorite(fav.id)}
                                                            color="error"
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </ListItem>
                                                ))}
                                            </List>
                                        )}
                                    </Paper>
                                </Grid>
                            </Grid>
                        </Box>
                    )}

                    {/* Onglet Préférences */}
                    {currentTab === 5 && (
                        <Box sx={{ p: 3, overflowY: 'auto', height: '100%' }}>
                            <Typography variant="h6" gutterBottom>
                                Préférences Utilisateur
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Paper sx={{ p: 2 }}>
                                        <Typography variant="subtitle1" gutterBottom>
                                            Interface
                                        </Typography>
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="body2" gutterBottom>
                                                Thème
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Button
                                                    size="small"
                                                    variant={preferences.theme === 'light' ? 'contained' : 'outlined'}
                                                    onClick={() => updatePreferences({ theme: 'light' })}
                                                >
                                                    Clair
                                                </Button>
                                                <Button
                                                    size="small"
                                                    variant={preferences.theme === 'dark' ? 'contained' : 'outlined'}
                                                    onClick={() => updatePreferences({ theme: 'dark' })}
                                                >
                                                    Sombre
                                                </Button>
                                            </Box>
                                        </Box>
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="body2" gutterBottom>
                                                Langue
                                            </Typography>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => updatePreferences({ language: 'fr' })}
                                            >
                                                Français
                                            </Button>
                                        </Box>
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Paper sx={{ p: 2 }}>
                                        <Typography variant="subtitle1" gutterBottom>
                                            Fonctionnalités
                                        </Typography>
                                        <Box sx={{ mb: 2 }}>
                                            <Button
                                                size="small"
                                                variant={preferences.chatSound ? 'contained' : 'outlined'}
                                                onClick={() => updatePreferences({ chatSound: !preferences.chatSound })}
                                                sx={{ mr: 1 }}
                                            >
                                                Son de chat: {preferences.chatSound ? 'ON' : 'OFF'}
                                            </Button>
                                        </Box>
                                        <Box sx={{ mb: 2 }}>
                                            <Button
                                                size="small"
                                                variant={preferences.autoSave ? 'contained' : 'outlined'}
                                                onClick={() => updatePreferences({ autoSave: !preferences.autoSave })}
                                                sx={{ mr: 1 }}
                                            >
                                                Sauvegarde auto: {preferences.autoSave ? 'ON' : 'OFF'}
                                            </Button>
                                        </Box>
                                        <Box sx={{ mb: 2 }}>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => {
                                                    const data = localStorage.getItem('docucortex_preferences');
                                                    if (data) {
                                                        const blob = new Blob([data], { type: 'application/json' });
                                                        const url = URL.createObjectURL(blob);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = 'preferences_backup.json';
                                                        a.click();
                                                        URL.revokeObjectURL(url);
                                                    }
                                                }}
                                            >
                                                Exporter les préférences
                                            </Button>
                                        </Box>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </Box>
            </Paper>

            {/* Dialog de confirmation de suppression */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirmer la suppression</DialogTitle>
                <DialogContent>
                    <Typography>
                        Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.
                    </Typography>
                    {documentToDelete && (
                        <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                            ID: {documentToDelete}
                        </Typography>
                    )}
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

            {/* Dialog de prévisualisation des documents */}
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
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={12} md={6}>
                                    <Paper sx={{ p: 2 }}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Informations du document
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Nom:</strong> {selectedDocument.filename}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Type:</strong> {selectedDocument.file_type}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Taille:</strong> {formatFileSize(selectedDocument.file_size)}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Langue:</strong> {selectedDocument.language}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Indexé le:</strong> {formatDate(selectedDocument.indexed_at)}
                                        </Typography>
                                        {selectedDocument.metadata && (() => {
                                            try {
                                                const metadata = JSON.parse(selectedDocument.metadata);
                                                return (
                                                    <>
                                                        <Typography variant="body2">
                                                            <strong>Nombre de mots:</strong> {metadata.wordCount}
                                                        </Typography>
                                                        {metadata.pages && (
                                                            <Typography variant="body2">
                                                                <strong>Pages:</strong> {metadata.pages}
                                                            </Typography>
                                                        )}
                                                    </>
                                                );
                                            } catch (e) {
                                                return null;
                                            }
                                        })()}
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Paper sx={{ p: 2 }}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Actions
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            fullWidth
                                            sx={{ mb: 1 }}
                                            onClick={() => {
                                                // Re-indexer le document
                                                console.log('Re-indexation demandée pour:', selectedDocument.id);
                                            }}
                                        >
                                            Re-indexer
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            fullWidth
                                            color="primary"
                                            sx={{ mb: 1 }}
                                            onClick={() => {
                                                // Exporter les métadonnées
                                                const blob = new Blob(
                                                    [JSON.stringify(selectedDocument, null, 2)], 
                                                    { type: 'application/json' }
                                                );
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `metadata_${selectedDocument.filename}.json`;
                                                a.click();
                                                URL.revokeObjectURL(url);
                                            }}
                                        >
                                            Exporter les métadonnées
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            fullWidth
                                            color="secondary"
                                            onClick={() => {
                                                // Télécharger le document original
                                                console.log('Téléchargement demandé pour:', selectedDocument.filename);
                                            }}
                                        >
                                            Télécharger
                                        </Button>
                                    </Paper>
                                </Grid>
                            </Grid>
                            <Paper sx={{ p: 2, minHeight: '400px', backgroundColor: '#f9f9f9' }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Aperçu du contenu
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    L'aperçu du contenu sera affiché ici. Cette fonctionnalité nécessite 
                                    une implémentation spécifique selon le type de document.
                                </Typography>
                                <Box sx={{ mt: 2, p: 2, backgroundColor: 'white', borderRadius: 1 }}>
                                    <Typography variant="body2">
                                        Document ID: {selectedDocument.id}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Le contenu réel du document sera affiché dans une future version.
                                    </Typography>
                                </Box>
                            </Paper>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>

            {/* Indicateur de chargement global */}
            {isProcessing && (
                <Box
                    sx={{
                        position: 'fixed',
                        bottom: 16,
                        right: 16,
                        bgcolor: 'primary.main',
                        color: 'white',
                        p: 2,
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        zIndex: 1000
                    }}
                >
                    <Typography variant="body2">Traitement en cours...</Typography>
                    <Box
                        sx={{
                            width: 16,
                            height: 16,
                            border: '2px solid transparent',
                            borderTop: '2px solid white',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}
                    />
                    <style>
                        {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
                    </style>
                </Box>
            )}
        </Box>
    );
};

export default AIAssistantPage;
