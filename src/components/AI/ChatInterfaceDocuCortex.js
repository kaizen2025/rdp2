/**
 * ChatInterface DocuCortex - Version avancée avec citations, suggestions et markdown
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Box,
    Paper,
    TextField,
    IconButton,
    Typography,
    Avatar,
    CircularProgress,
    Chip,
    Tooltip,
    Button,
    Divider,
    Card,
    CardContent,
    LinearProgress,
    Link,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Snackbar
} from '@mui/material';
import {
    Send as SendIcon,
    SmartToy as BotIcon,
    Person as PersonIcon,
    AttachFile as AttachIcon,
    Download as DownloadIcon,
    Visibility as PreviewIcon,
    QuestionAnswer as SuggestionIcon,
    CloudUpload as UploadIcon,
    Delete as DeleteIcon,
    AddCircle as NewConversationIcon,
    History as HistoryIcon,
    FolderOpen as FolderOpenIcon,
    OpenInNew as OpenIcon
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import apiService from '../../services/apiService';
import DocumentPreviewModal from './DocumentPreviewModal'; // ✅ AJOUT

const ChatInterfaceDocuCortex = ({ sessionId, onMessageSent }) => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showWelcome, setShowWelcome] = useState(true);
    const [previewModal, setPreviewModal] = useState({ open: false, documentId: null, filename: '', networkPath: '' }); // ✅ AJOUT
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Message de bienvenue automatique
    useEffect(() => {
        const loadHistoryAndWelcome = async () => {
            try {
                const data = await apiService.getAIConversationHistory(sessionId);

                if (data.success && data.conversations && data.conversations.length > 0) {
                    // Historique existe, charger
                    const formattedMessages = data.conversations.reverse().map(conv => ([
                        {
                            type: 'user',
                            content: conv.user_message,
                            timestamp: new Date(conv.created_at)
                        },
                        {
                            type: 'assistant',
                            content: conv.ai_response,
                            confidence: conv.confidence_score,
                            sources: conv.sources ? JSON.parse(conv.sources) : [],
                            timestamp: new Date(conv.created_at)
                        }
                    ])).flat();

                    setMessages(formattedMessages);
                    setShowWelcome(false);
                } else {
                    // Nouvelle conversation, afficher message de bienvenue
                    const welcomeMessage = {
                        type: 'assistant',
                        content: `Bonjour ! 👋 Je suis **DocuCortex**, l'assistant IA du groupe **Anecoop France**.

🎭 **Chef d'Orchestre Ultra-Intelligent à votre service :**
- 💬 Répondre à **toutes vos questions** (météo, calculs, informations générales)
- 🔍 Rechercher dans votre **GED** avec intelligence sémantique avancée
- 🖼️ Analyser **images, factures et tableaux Excel scannés** avec OCR
- 📄 Résumer, comparer et **organiser vos documents** professionnels
- 📂 **Ouvrir fichiers et dossiers réseau** en 1 clic depuis le chat

✨ **Powered by Google Gemini 2.0 Flash**
🚀 Vision Multimodale • RAG • Embeddings • Actions Intelligentes

Je suis là pour **simplifier votre travail quotidien** et vous faire gagner du temps !

**Comment puis-je vous aider aujourd'hui ?**`,
                        isWelcome: true,
                        timestamp: new Date(),
                        suggestions: [
                            'Quelle est la météo aujourd\'hui ?',
                            'Chercher des offres de prix dans la GED',
                            'Uploader et analyser un document scanné',
                            'Voir les fichiers modifiés cette semaine'
                        ]
                    };
                    setMessages([welcomeMessage]);
                }
            } catch (error) {
                console.error('Erreur chargement:', error);
            }
        };

        loadHistoryAndWelcome();
    }, [sessionId]);

    const sendMessage = async (messageText = null) => {
        const textToSend = messageText || inputMessage;
        if (!textToSend.trim()) {
            console.log('[DocuCortex] Message vide, ignoré');
            return;
        }

        if (isLoading) {
            console.log('[DocuCortex] Déjà en cours de traitement, ignoré');
            return;
        }

        console.log('[DocuCortex] Envoi message:', textToSend);

        const userMessage = {
            type: 'user',
            content: textToSend,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);
        setShowWelcome(false);

        try {
            const data = await apiService.sendAIMessage(sessionId, textToSend);

            console.log('[DocuCortex] Réponse reçue:', data);

            if (data.success) {
                // Générer suggestions intelligentes basées sur le contexte
                const smartSuggestions = generateSmartSuggestions(textToSend, data);

                const assistantMessage = {
                    type: 'assistant',
                    content: data.response,
                    confidence: data.confidence,
                    sources: data.sources || [],
                    attachments: data.attachments || [],
                    suggestions: data.suggestions || smartSuggestions,
                    metadata: data.metadata || {},
                    timestamp: new Date()
                };

                setMessages(prev => [...prev, assistantMessage]);

                if (onMessageSent) {
                    onMessageSent(data);
                }
            } else {
                const errorMessage = {
                    type: 'assistant',
                    content: `❌ ${data.error || 'Désolé, une erreur s\'est produite. Veuillez réessayer.'}`,
                    isError: true,
                    timestamp: new Date(),
                    suggestions: [
                        'Réessayer ma question',
                        'Reformuler autrement',
                        'Voir les documents disponibles',
                        'Contacter le support'
                    ]
                };
                setMessages(prev => [...prev, errorMessage]);
            }
        } catch (error) {
            console.error('[DocuCortex] Erreur envoi message:', error);
            const errorMessage = {
                type: 'assistant',
                content: `⚠️ Erreur de connexion au serveur.\n\nDétails: ${error.message}`,
                isError: true,
                timestamp: new Date(),
                suggestions: [
                    'Réessayer',
                    'Vérifier la connexion',
                    'Recharger la page'
                ]
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            console.log('[DocuCortex] Fin traitement, isLoading = false');
            setIsLoading(false);
        }
    };

    // ✅ NOUVEAU - Génération de suggestions intelligentes contextuelles
    const generateSmartSuggestions = (userQuery, response) => {
        const lowerQuery = userQuery.toLowerCase();
        const suggestions = [];

        // Analyse du type de question
        if (lowerQuery.includes('cherche') || lowerQuery.includes('trouve') || lowerQuery.includes('search')) {
            suggestions.push(
                'Affine ma recherche avec des critères',
                'Voir tous les résultats disponibles',
                'Rechercher dans une autre catégorie',
                'Filtrer par date récente'
            );
        } else if (lowerQuery.includes('résume') || lowerQuery.includes('analyse') || lowerQuery.includes('explique')) {
            suggestions.push(
                'Donne-moi plus de détails',
                'Compare avec d\'autres documents',
                'Extrais les points clés',
                'Génère un rapport complet'
            );
        } else if (lowerQuery.includes('météo') || lowerQuery.includes('weather') || lowerQuery.includes('calcul')) {
            suggestions.push(
                'Chercher des documents GED',
                'Uploader un nouveau document',
                'Voir les documents récents',
                'Poser une question sur mes fichiers'
            );
        } else if (response.sources && response.sources.length > 0) {
            // Si des sources sont trouvées
            suggestions.push(
                'Ouvrir le premier document',
                'Comparer ces documents',
                'Rechercher dans ces fichiers',
                'Exporter ces résultats'
            );
        } else {
            // Suggestions génériques intelligentes
            suggestions.push(
                'Chercher dans mes documents',
                'Uploader un fichier à analyser',
                'Voir les documents modifiés récemment',
                'Quelle est la procédure pour...'
            );
        }

        return suggestions.slice(0, 4);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setInputMessage(suggestion);
        sendMessage(suggestion);
    };

    const handleDownload = async (documentId) => {
        try {
            await apiService.downloadDocument(documentId);
        } catch (error) {
            console.error('Erreur téléchargement:', error);
        }
    };

    const handlePreview = async (attachment) => {
        try {
            setPreviewModal({
                open: true,
                documentId: attachment.documentId,
                filename: attachment.filename,
                networkPath: attachment.networkPath
            });
        } catch (error) {
            console.error('Erreur preview:', error);
        }
    };

    const closePreviewModal = () => {
        setPreviewModal({ open: false, documentId: null, filename: '', networkPath: '' });
    };

    // ✅ NOUVEAU - Ouvrir document dans l'explorateur
    const handleOpenDocument = async (attachment) => {
        try {
            const filepath = attachment.filepath || attachment.networkPath;
            if (!filepath) {
                setNotification({ open: true, message: 'Chemin du document non disponible', severity: 'warning' });
                return;
            }

            // Demander à Electron d'ouvrir le fichier
            if (window.electron && window.electron.shell) {
                await window.electron.shell.openPath(filepath);
                setNotification({ open: true, message: `Ouverture de ${attachment.filename}...`, severity: 'success' });
            } else {
                setNotification({ open: true, message: 'Fonction non disponible (mode web)', severity: 'info' });
            }
        } catch (error) {
            console.error('Erreur ouverture document:', error);
            setNotification({ open: true, message: 'Erreur lors de l\'ouverture du document', severity: 'error' });
        }
    };

    // ✅ NOUVEAU - Ouvrir répertoire du document
    const handleOpenFolder = async (attachment) => {
        try {
            const filepath = attachment.filepath || attachment.networkPath;
            if (!filepath) {
                setNotification({ open: true, message: 'Chemin du document non disponible', severity: 'warning' });
                return;
            }

            // Extraire le répertoire parent
            const folderPath = filepath.substring(0, filepath.lastIndexOf('\\') || filepath.lastIndexOf('/'));

            // Demander à Electron d'ouvrir le dossier
            if (window.electron && window.electron.shell) {
                await window.electron.shell.openPath(folderPath);
                setNotification({ open: true, message: `Ouverture du répertoire...`, severity: 'success' });
            } else {
                setNotification({ open: true, message: 'Fonction non disponible (mode web)', severity: 'info' });
            }
        } catch (error) {
            console.error('Erreur ouverture répertoire:', error);
            setNotification({ open: true, message: 'Erreur lors de l\'ouverture du répertoire', severity: 'error' });
        }
    };

    // ✅ NOUVEAU - Gestion upload de documents
    const handleUploadClick = () => {
        setUploadDialogOpen(true);
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            setUploadFile(file);
        }
    };

    const handleUploadDocument = async () => {
        if (!uploadFile) {
            setNotification({ open: true, message: 'Veuillez sélectionner un fichier', severity: 'warning' });
            return;
        }

        setUploading(true);
        try {
            const result = await apiService.uploadAIDocument(uploadFile);

            if (result.success) {
                setNotification({
                    open: true,
                    message: `Document "${uploadFile.name}" uploadé avec succès ! ${result.chunksCreated || 0} chunks indexés.`,
                    severity: 'success'
                });
                setUploadDialogOpen(false);
                setUploadFile(null);

                // Ajouter un message système dans le chat
                const systemMessage = {
                    type: 'assistant',
                    content: `✅ Document **${uploadFile.name}** ajouté à la base de connaissances.\n\n📊 **${result.chunksCreated || 0}** segments indexés.\n\nVous pouvez maintenant me poser des questions sur ce document !`,
                    timestamp: new Date(),
                    isSystem: true
                };
                setMessages(prev => [...prev, systemMessage]);
            } else {
                throw new Error(result.error || 'Échec de l\'upload');
            }
        } catch (error) {
            console.error('Erreur upload:', error);
            setNotification({
                open: true,
                message: `Erreur lors de l'upload: ${error.message}`,
                severity: 'error'
            });
        } finally {
            setUploading(false);
        }
    };

    // ✅ NOUVEAU - Nouvelle conversation
    const handleNewConversation = () => {
        if (window.confirm('Êtes-vous sûr de vouloir démarrer une nouvelle conversation ? L\'historique actuel sera perdu.')) {
            setMessages([]);
            setShowWelcome(true);
            setInputMessage('');
            setIsLoading(false); // ✅ Forcer déblocage

            // Message de bienvenue pour nouvelle conversation
            const welcomeMessage = {
                type: 'assistant',
                content: `Bonjour ! 👋 Je suis **DocuCortex**, l'assistant IA du groupe **Anecoop France**.

🎭 **Chef d'Orchestre Ultra-Intelligent à votre service :**
- 💬 Répondre à **toutes vos questions** (météo, calculs, informations générales)
- 🔍 Rechercher dans votre **GED** avec intelligence sémantique avancée
- 🖼️ Analyser **images, factures et tableaux Excel scannés** avec OCR
- 📄 Résumer, comparer et **organiser vos documents** professionnels
- 📂 **Ouvrir fichiers et dossiers réseau** en 1 clic depuis le chat

✨ **Powered by Google Gemini 2.0 Flash**
🚀 Vision Multimodale • RAG • Embeddings • Actions Intelligentes

Je suis là pour **simplifier votre travail quotidien** et vous faire gagner du temps !

**Comment puis-je vous aider aujourd'hui ?**`,
                isWelcome: true,
                timestamp: new Date(),
                suggestions: [
                    'Quelle est la météo aujourd\'hui ?',
                    'Chercher des offres de prix dans la GED',
                    'Uploader et analyser un document scanné',
                    'Voir les fichiers modifiés cette semaine'
                ]
            };
            setMessages([welcomeMessage]);
            setNotification({ open: true, message: '✨ Nouvelle conversation démarrée', severity: 'success' });
        }
    };

    // ✅ NOUVEAU - Purger l'historique
    const handleClearHistory = () => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer tout l\'historique de conversation ?')) {
            setMessages([]);
            setShowWelcome(true);
            setInputMessage('');
            setIsLoading(false); // ✅ Forcer déblocage
            setNotification({ open: true, message: '🗑️ Historique effacé', severity: 'success' });
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <Box sx={{
                p: 2,
                borderBottom: '1px solid #e0e0e0',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BotIcon sx={{ fontSize: 32 }} />
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                DocuCortex
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                Le Cortex de vos Documents
                            </Typography>
                        </Box>
                    </Box>

                    {/* ✅ NOUVEAU - Toolbar Actions */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Uploader un document">
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<UploadIcon />}
                                onClick={handleUploadClick}
                                sx={{
                                    bgcolor: 'rgba(255,255,255,0.2)',
                                    color: 'white',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                                    textTransform: 'none',
                                    fontWeight: 600
                                }}
                            >
                                Upload
                            </Button>
                        </Tooltip>

                        <Tooltip title="Nouvelle conversation">
                            <IconButton
                                size="small"
                                onClick={handleNewConversation}
                                sx={{
                                    color: 'white',
                                    bgcolor: 'rgba(255,255,255,0.2)',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                                }}
                            >
                                <NewConversationIcon />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Effacer l'historique">
                            <IconButton
                                size="small"
                                onClick={handleClearHistory}
                                sx={{
                                    color: 'white',
                                    bgcolor: 'rgba(255,255,255,0.2)',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                                }}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            </Box>

            {/* Messages */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2, backgroundColor: '#f5f7fa' }}>
                {messages.map((msg, idx) => (
                    <MessageBubble
                        key={idx}
                        message={msg}
                        onSuggestionClick={handleSuggestionClick}
                        onDownload={handleDownload}
                        onPreview={handlePreview}
                        onOpenDocument={handleOpenDocument}
                        onOpenFolder={handleOpenFolder}
                    />
                ))}

                {/* ✅ AJOUT - Modal de prévisualisation */}
                <DocumentPreviewModal
                    open={previewModal.open}
                    onClose={closePreviewModal}
                    documentId={previewModal.documentId}
                    filename={previewModal.filename}
                    networkPath={previewModal.networkPath}
                />

                {isLoading && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: '#667eea' }}>
                            <BotIcon />
                        </Avatar>
                        <Box>
                            <CircularProgress size={20} />
                            <Typography variant="caption" sx={{ ml: 1 }}>
                                DocuCortex réfléchit...
                            </Typography>
                        </Box>
                    </Box>
                )}

                <div ref={messagesEndRef} />
            </Box>

            {/* Input */}
            <Paper sx={{ p: 2, borderTop: '1px solid #e0e0e0' }} elevation={3}>
                {isLoading && (
                    <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={16} />
                        <Typography variant="caption" color="text.secondary">
                            DocuCortex réfléchit...
                        </Typography>
                        <Button
                            size="small"
                            variant="text"
                            onClick={() => {
                                console.log('[DocuCortex] Déblocage manuel forcé');
                                setIsLoading(false);
                                setNotification({
                                    open: true,
                                    message: 'Champ de saisie débloqué',
                                    severity: 'info'
                                });
                            }}
                            sx={{ ml: 'auto', fontSize: '0.7rem', textTransform: 'none' }}
                        >
                            Forcer le déblocage
                        </Button>
                    </Box>
                )}
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={isLoading ? "DocuCortex réfléchit..." : "Posez votre question à DocuCortex..."}
                        variant="outlined"
                        disabled={isLoading}
                        size="small"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                bgcolor: isLoading ? 'rgba(0,0,0,0.02)' : 'white',
                                transition: 'background-color 0.3s ease'
                            }
                        }}
                    />
                    <IconButton
                        color="primary"
                        onClick={() => sendMessage()}
                        disabled={!inputMessage.trim() || isLoading}
                        sx={{
                            background: isLoading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                background: isLoading ? '#ccc' : 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                transform: isLoading ? 'none' : 'scale(1.05)'
                            },
                            '&:disabled': {
                                background: '#ccc'
                            }
                        }}
                    >
                        {isLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : <SendIcon />}
                    </IconButton>
                </Box>
            </Paper>

            {/* ✅ NOUVEAU - Upload Dialog */}
            <Dialog
                open={uploadDialogOpen}
                onClose={() => !uploading && setUploadDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    fontWeight: 600
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <UploadIcon />
                        Uploader un document
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                        accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.ppt,.pptx,.jpg,.jpeg,.png"
                    />
                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => fileInputRef.current?.click()}
                        startIcon={<AttachIcon />}
                        disabled={uploading}
                        sx={{ mb: 2, py: 2 }}
                    >
                        {uploadFile ? uploadFile.name : 'Choisir un fichier'}
                    </Button>

                    {uploadFile && (
                        <Alert severity="info" sx={{ mt: 1 }}>
                            <Typography variant="body2">
                                <strong>Fichier sélectionné:</strong> {uploadFile.name}
                            </Typography>
                            <Typography variant="caption" display="block">
                                Taille: {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                            </Typography>
                        </Alert>
                    )}

                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                        Formats supportés: PDF, DOC, DOCX, TXT, XLSX, XLS, PPT, PPTX, JPG, PNG
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={() => setUploadDialogOpen(false)}
                        disabled={uploading}
                    >
                        Annuler
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleUploadDocument}
                        disabled={!uploadFile || uploading}
                        startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
                        sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                            }
                        }}
                    >
                        {uploading ? 'Upload en cours...' : 'Uploader'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ✅ NOUVEAU - Notifications */}
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={() => setNotification({ ...notification, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setNotification({ ...notification, open: false })}
                    severity={notification.severity}
                    sx={{ width: '100%' }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

/**
 * Composant MessageBubble avec support markdown, citations et suggestions
 */
const MessageBubble = ({ message, onSuggestionClick, onDownload, onPreview, onOpenDocument, onOpenFolder }) => {
    const isUser = message.type === 'user';

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                mb: 2
            }}
        >
            <Box sx={{ display: 'flex', gap: 1, maxWidth: '85%', alignItems: 'flex-start' }}>
                {!isUser && (
                    <Avatar sx={{ bgcolor: message.isError ? '#f44336' : '#667eea' }}>
                        <BotIcon />
                    </Avatar>
                )}

                <Box>
                    <Paper
                        elevation={1}
                        sx={{
                            p: 2,
                            bgcolor: isUser ? '#667eea' : 'white',
                            color: isUser ? 'white' : 'inherit',
                            borderRadius: 2
                        }}
                    >
                        {/* Contenu avec support Markdown */}
                        <ReactMarkdown>{message.content}</ReactMarkdown>

                        {/* Score de confiance */}
                        {!isUser && message.confidence && (
                            <Box sx={{ mt: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                    Confiance: {Math.round(message.confidence * 100)}%
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={message.confidence * 100}
                                    sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                                />
                            </Box>
                        )}

                        {/* Sources */}
                        {!isUser && message.sources && message.sources.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                                <Divider sx={{ mb: 1 }} />
                                <Typography variant="caption" fontWeight="bold">
                                    📚 Sources ({message.sources.length}):
                                </Typography>
                                {message.sources.slice(0, 3).map((source, idx) => (
                                    <Box key={idx} sx={{ mt: 1 }}>
                                        <Typography variant="caption" display="block">
                                            {idx + 1}. {source.filename} 
                                            <Chip
                                                size="small"
                                                label={`${source.score}%`}
                                                sx={{ ml: 1, height: 18, fontSize: '0.7rem' }}
                                            />
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        )}

                        {/* Pièces jointes (boutons actions) */}
                        {!isUser && message.attachments && message.attachments.length > 0 && (
                            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {message.attachments.map((att, idx) => (
                                    <Box key={idx} sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                        <Chip
                                            label={att.filename}
                                            size="small"
                                            sx={{ mr: 0.5, maxWidth: 200 }}
                                        />
                                        {att.canPreview && (
                                            <Tooltip title="Aperçu">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => onPreview(att)}
                                                    sx={{ bgcolor: '#f0f0f0' }}
                                                >
                                                    <PreviewIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        <Tooltip title="Télécharger">
                                            <IconButton
                                                size="small"
                                                onClick={() => onDownload(att.documentId)}
                                                sx={{ bgcolor: '#f0f0f0' }}
                                            >
                                                <DownloadIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        {(att.filepath || att.networkPath) && (
                                            <>
                                                <Tooltip title="Ouvrir le document">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => onOpenDocument(att)}
                                                        sx={{ bgcolor: '#e3f2fd' }}
                                                    >
                                                        <OpenIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Voir le répertoire">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => onOpenFolder(att)}
                                                        sx={{ bgcolor: '#fff3e0' }}
                                                    >
                                                        <FolderOpenIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </>
                                        )}
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Paper>

                    {/* ✨ Suggestions Ultra-Intelligentes */}
                    {!isUser && message.suggestions && message.suggestions.length > 0 && (
                        <Box sx={{
                            mt: 2,
                            p: 2,
                            bgcolor: 'rgba(102, 126, 234, 0.05)',
                            borderRadius: 2,
                            border: '1px solid rgba(102, 126, 234, 0.2)'
                        }}>
                            <Typography
                                variant="caption"
                                sx={{
                                    mb: 1.5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    fontWeight: 600,
                                    color: '#667eea',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}
                            >
                                <SuggestionIcon sx={{ fontSize: 16 }} />
                                Suggestions Intelligentes
                            </Typography>
                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                                gap: 1
                            }}>
                                {message.suggestions.map((suggestion, idx) => (
                                    <Button
                                        key={idx}
                                        variant="outlined"
                                        size="small"
                                        onClick={() => onSuggestionClick(suggestion)}
                                        startIcon={<SuggestionIcon sx={{ fontSize: 14 }} />}
                                        sx={{
                                            justifyContent: 'flex-start',
                                            textAlign: 'left',
                                            textTransform: 'none',
                                            fontSize: '0.813rem',
                                            fontWeight: 500,
                                            py: 1,
                                            px: 1.5,
                                            borderColor: 'rgba(102, 126, 234, 0.3)',
                                            color: '#667eea',
                                            background: 'white',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                color: 'white',
                                                borderColor: '#667eea',
                                                transform: 'translateY(-2px)',
                                                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                                            }
                                        }}
                                    >
                                        {suggestion}
                                    </Button>
                                ))}
                            </Box>
                        </Box>
                    )}

                    {/* Timestamp */}
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {message.timestamp?.toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </Typography>
                </Box>

                {isUser && (
                    <Avatar sx={{ bgcolor: '#764ba2' }}>
                        <PersonIcon />
                    </Avatar>
                )}
            </Box>
        </Box>
    );
};

export default ChatInterfaceDocuCortex;
