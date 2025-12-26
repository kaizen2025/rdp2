/**
 * ChatDocuCortex Advanced - Interface IA Ultra-Intelligente
 * - Upload multiformat (images, PDF, Excel, Word, etc.)
 * - Analyse et édition de fichiers via Gemini
 * - Historique des conversations avec purge
 * - Gestion des modèles et configuration
 * - Export des fichiers modifiés
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    TextField,
    Button,
    IconButton,
    Typography,
    Chip,
    Avatar,
    Divider,
    CircularProgress,
    Alert,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Card,
    CardContent,
    Grid,
    Tooltip,
    LinearProgress,
    Badge
} from '@mui/material';
import {
    Send as SendIcon,
    AttachFile as AttachFileIcon,
    Image as ImageIcon,
    PictureAsPdf as PdfIcon,
    TableChart as ExcelIcon,
    Description as WordIcon,
    InsertDriveFile as FileIcon,
    Delete as DeleteIcon,
    Download as DownloadIcon,
    History as HistoryIcon,
    Settings as SettingsIcon,
    Close as CloseIcon,
    SmartToy as AIIcon,
    Person as PersonIcon,
    CheckCircle as CheckIcon,
    Error as ErrorIcon,
    Refresh as RefreshIcon,
    Code as CodeIcon,
    VideoLibrary as VideoIcon,
    AudioFile as AudioIcon
} from '@mui/icons-material';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { getApiBaseUrl } from '../../services/backendConfig';

const ChatDocuCortexAdvanced = () => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [currentConversationId, setCurrentConversationId] = useState(null);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [activeProvider, setActiveProvider] = useState('gemini');
    const [providerStatus, setProviderStatus] = useState({});
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const dropZoneRef = useRef(null);

    useEffect(() => {
        loadConversations();
        loadProviderStatus();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadConversations = async () => {
        try {
            const apiBase = await getApiBaseUrl();
            const response = await axios.get(`${apiBase}/ai/conversations`);
            setConversations(response.data.conversations || []);
        } catch (error) {
            console.error('Erreur chargement conversations:', error);
        }
    };

    const loadProviderStatus = async () => {
        try {
            const apiBase = await getApiBaseUrl();
            const response = await axios.get(`${apiBase}/ai/status`);
            setProviderStatus(response.data);
            setActiveProvider(response.data.activeProvider || 'gemini');
        } catch (error) {
            console.error('Erreur chargement statut providers:', error);
        }
    };

    const handleFileSelect = (event) => {
        const files = Array.from(event.target.files);
        processFiles(files);
    };

    const processFiles = async (files) => {
        const newFiles = await Promise.all(
            files.map(async (file) => {
                const preview = await generatePreview(file);
                return {
                    file,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    preview,
                    id: Date.now() + Math.random()
                };
            })
        );
        setUploadedFiles([...uploadedFiles, ...newFiles]);
    };

    const generatePreview = (file) => {
        return new Promise((resolve) => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(file);
            } else {
                resolve(null);
            }
        });
    };

    const getFileIcon = (type) => {
        if (type.startsWith('image/')) return <ImageIcon />;
        if (type === 'application/pdf') return <PdfIcon />;
        if (type.includes('spreadsheet') || type.includes('excel')) return <ExcelIcon />;
        if (type.includes('document') || type.includes('word')) return <WordIcon />;
        if (type.startsWith('video/')) return <VideoIcon />;
        if (type.startsWith('audio/')) return <AudioIcon />;
        if (type.includes('code') || type.includes('javascript') || type.includes('python')) return <CodeIcon />;
        return <FileIcon />;
    };

    const removeFile = (fileId) => {
        setUploadedFiles(uploadedFiles.filter(f => f.id !== fileId));
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() && uploadedFiles.length === 0) return;

        const userMessage = {
            role: 'user',
            content: inputMessage,
            files: uploadedFiles.map(f => ({ name: f.name, type: f.type })),
            timestamp: new Date()
        };

        setMessages([...messages, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append('message', inputMessage);
            formData.append('conversationId', currentConversationId || '');

            uploadedFiles.forEach((fileObj, index) => {
                formData.append(`files`, fileObj.file);
            });

            const apiBase = await getApiBaseUrl();
            const response = await axios.post(`${apiBase}/ai/chat`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setUploadProgress(percentCompleted);
                }
            });

            const aiMessage = {
                role: 'assistant',
                content: response.data.response,
                files: response.data.files || [],
                confidence: response.data.confidence,
                provider: response.data.provider,
                timestamp: new Date()
            };

            setMessages([...messages, userMessage, aiMessage]);
            setCurrentConversationId(response.data.conversationId);
            setUploadedFiles([]);
            setUploadProgress(0);

        } catch (error) {
            console.error('Erreur envoi message:', error);
            const errorMessage = {
                role: 'assistant',
                content: '❌ Erreur: ' + (error.response?.data?.error || error.message),
                timestamp: new Date(),
                isError: true
            };
            setMessages([...messages, userMessage, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewConversation = () => {
        setMessages([]);
        setCurrentConversationId(null);
        setUploadedFiles([]);
    };

    const handleLoadConversation = async (conversationId) => {
        try {
            const apiBase = await getApiBaseUrl();
            const response = await axios.get(`${apiBase}/ai/conversations/${conversationId}`);
            setMessages(response.data.messages || []);
            setCurrentConversationId(conversationId);
            setHistoryOpen(false);
        } catch (error) {
            console.error('Erreur chargement conversation:', error);
        }
    };

    const handleDeleteConversation = async (conversationId) => {
        try {
            const apiBase = await getApiBaseUrl();
            await axios.delete(`${apiBase}/ai/conversations/${conversationId}`);
            loadConversations();
            if (currentConversationId === conversationId) {
                handleNewConversation();
            }
        } catch (error) {
            console.error('Erreur suppression conversation:', error);
        }
    };

    const handlePurgeAll = async () => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer TOUTES les conversations?')) {
            try {
                const apiBase = await getApiBaseUrl();
                await axios.delete(`${apiBase}/ai/conversations`);
                loadConversations();
                handleNewConversation();
            } catch (error) {
                console.error('Erreur purge conversations:', error);
            }
        }
    };

    const handleTestProvider = async (provider) => {
        try {
            const apiBase = await getApiBaseUrl();
            const response = await axios.post(`${apiBase}/ai/providers/${provider}/test`);
            setProviderStatus({
                ...providerStatus,
                [provider]: response.data.success ? 'connected' : 'error'
            });
        } catch (error) {
            setProviderStatus({
                ...providerStatus,
                [provider]: 'error'
            });
        }
    };

    const handleDownloadFile = async (fileData) => {
        try {
            const apiBase = await getApiBaseUrl();
            const response = await axios.get(`${apiBase}/ai/files/${fileData.id}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileData.name);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Erreur téléchargement fichier:', error);
        }
    };

    // Drag & Drop handlers
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        processFiles(files);
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <AIIcon color="primary" sx={{ fontSize: 40 }} />
                        <Box>
                            <Typography variant="h5" fontWeight="bold">
                                DocuCortex IA Ultra-Intelligente
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Propulsé par {activeProvider} • Mode Hybride: GED + Assistant Général
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Nouvelle conversation">
                            <Button
                                variant="outlined"
                                startIcon={<RefreshIcon />}
                                onClick={handleNewConversation}
                            >
                                Nouveau
                            </Button>
                        </Tooltip>
                        <Tooltip title="Historique">
                            <IconButton onClick={() => setHistoryOpen(true)}>
                                <Badge badgeContent={conversations.length} color="primary">
                                    <HistoryIcon />
                                </Badge>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Paramètres">
                            <IconButton onClick={() => setSettingsOpen(true)}>
                                <SettingsIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            </Paper>

            {/* Messages Area */}
            <Paper
                sx={{
                    flex: 1,
                    p: 2,
                    overflowY: 'auto',
                    mb: 2,
                    backgroundColor: '#f5f5f5'
                }}
                ref={dropZoneRef}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {isDragging && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(25, 118, 210, 0.1)',
                            border: '3px dashed #1976d2',
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000
                        }}
                    >
                        <Typography variant="h5" color="primary">
                            📎 Déposez vos fichiers ici
                        </Typography>
                    </Box>
                )}

                {messages.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <AIIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            Bonjour! Je suis DocuCortex 🤖
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Assistant IA polyvalent propulsé par Gemini
                        </Typography>
                        <Grid container spacing={2} sx={{ maxWidth: 800, mx: 'auto' }}>
                            <Grid item xs={12} md={6}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                            📚 Mode GED Spécialisé
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            • Recherche de documents<br/>
                                            • Analyse de fichiers réseau<br/>
                                            • Extraction d'informations
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                            🌟 Assistant Général
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            • Questions générales<br/>
                                            • Analyse multimédia<br/>
                                            • Édition de fichiers
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Box>
                ) : (
                    messages.map((msg, index) => (
                        <Box
                            key={index}
                            sx={{
                                display: 'flex',
                                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                mb: 2
                            }}
                        >
                            <Box
                                sx={{
                                    maxWidth: '70%',
                                    display: 'flex',
                                    gap: 1,
                                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                                }}
                            >
                                <Avatar
                                    sx={{
                                        bgcolor: msg.role === 'user' ? 'primary.main' : 'secondary.main'
                                    }}
                                >
                                    {msg.role === 'user' ? <PersonIcon /> : <AIIcon />}
                                </Avatar>
                                <Paper
                                    sx={{
                                        p: 2,
                                        backgroundColor: msg.isError ? '#ffebee' :
                                                       msg.role === 'user' ? '#e3f2fd' : 'white'
                                    }}
                                >
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>

                                    {msg.files && msg.files.length > 0 && (
                                        <Box sx={{ mt: 2 }}>
                                            {msg.files.map((file, idx) => (
                                                <Chip
                                                    key={idx}
                                                    icon={getFileIcon(file.type)}
                                                    label={file.name}
                                                    size="small"
                                                    onClick={() => handleDownloadFile(file)}
                                                    sx={{ mr: 1, mb: 1 }}
                                                />
                                            ))}
                                        </Box>
                                    )}

                                    {msg.confidence && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                            Confiance: {msg.confidence}% • {msg.provider}
                                        </Typography>
                                    )}
                                </Paper>
                            </Box>
                        </Box>
                    ))
                )}
                <div ref={messagesEndRef} />
            </Paper>

            {/* Uploaded Files Preview */}
            {uploadedFiles.length > 0 && (
                <Paper sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Fichiers joints ({uploadedFiles.length})
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {uploadedFiles.map((fileObj) => (
                            <Card key={fileObj.id} variant="outlined" sx={{ width: 120 }}>
                                <CardContent sx={{ p: 1, textAlign: 'center' }}>
                                    {fileObj.preview ? (
                                        <img
                                            src={fileObj.preview}
                                            alt={fileObj.name}
                                            style={{ width: '100%', height: 60, objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <Box sx={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {getFileIcon(fileObj.type)}
                                        </Box>
                                    )}
                                    <Typography variant="caption" noWrap>
                                        {fileObj.name}
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        onClick={() => removeFile(fileObj.id)}
                                        sx={{ mt: 0.5 }}
                                    >
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                        <LinearProgress variant="determinate" value={uploadProgress} sx={{ mt: 1 }} />
                    )}
                </Paper>
            )}

            {/* Input Area */}
            <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        hidden
                        onChange={handleFileSelect}
                        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,audio/*,video/*,.csv,.json,.txt,.md"
                    />
                    <Tooltip title="Joindre fichier(s)">
                        <IconButton
                            color="primary"
                            onClick={() => fileInputRef.current.click()}
                        >
                            <AttachFileIcon />
                        </IconButton>
                    </Tooltip>
                    <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        placeholder="Posez votre question ou uploadez un fichier..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        disabled={isLoading}
                    />
                    <Button
                        variant="contained"
                        endIcon={isLoading ? <CircularProgress size={20} /> : <SendIcon />}
                        onClick={handleSendMessage}
                        disabled={isLoading || (!inputMessage.trim() && uploadedFiles.length === 0)}
                        sx={{ minWidth: 100 }}
                    >
                        Envoyer
                    </Button>
                </Box>
            </Paper>

            {/* History Dialog */}
            <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    Historique des Conversations
                    <IconButton
                        onClick={() => setHistoryOpen(false)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    {conversations.length === 0 ? (
                        <Typography color="text.secondary" align="center" py={4}>
                            Aucune conversation enregistrée
                        </Typography>
                    ) : (
                        <List>
                            {conversations.map((conv) => (
                                <ListItem
                                    key={conv.id}
                                    button
                                    onClick={() => handleLoadConversation(conv.id)}
                                    selected={conv.id === currentConversationId}
                                >
                                    <ListItemText
                                        primary={conv.title || `Conversation ${conv.id}`}
                                        secondary={new Date(conv.createdAt).toLocaleString()}
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton
                                            edge="end"
                                            onClick={() => handleDeleteConversation(conv.id)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handlePurgeAll} color="error">
                        Tout supprimer
                    </Button>
                    <Button onClick={() => setHistoryOpen(false)}>
                        Fermer
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Settings Dialog */}
            <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Paramètres IA
                    <IconButton
                        onClick={() => setSettingsOpen(false)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="subtitle2" gutterBottom>
                        Providers Disponibles
                    </Typography>
                    <List>
                        <ListItem>
                            <ListItemText
                                primary="Gemini AI"
                                secondary="Provider principal • Multimodal"
                            />
                            <Chip
                                icon={providerStatus.gemini === 'connected' ? <CheckIcon /> : <ErrorIcon />}
                                label={providerStatus.gemini === 'connected' ? 'Connecté' : 'Non testé'}
                                color={providerStatus.gemini === 'connected' ? 'success' : 'default'}
                                size="small"
                            />
                            <IconButton onClick={() => handleTestProvider('gemini')}>
                                <RefreshIcon />
                            </IconButton>
                        </ListItem>
                        <Divider />
                        <ListItem>
                            <ListItemText
                                primary="OpenRouter"
                                secondary="Provider fallback • 14 modèles"
                            />
                            <Chip
                                icon={providerStatus.openrouter === 'connected' ? <CheckIcon /> : <ErrorIcon />}
                                label={providerStatus.openrouter === 'connected' ? 'Connecté' : 'Non testé'}
                                color={providerStatus.openrouter === 'connected' ? 'success' : 'default'}
                                size="small"
                            />
                            <IconButton onClick={() => handleTestProvider('openrouter')}>
                                <RefreshIcon />
                            </IconButton>
                        </ListItem>
                    </List>

                    <Alert severity="info" sx={{ mt: 2 }}>
                        Provider actif: <strong>{activeProvider}</strong><br/>
                        Fallback automatique activé
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSettingsOpen(false)}>
                        Fermer
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ChatDocuCortexAdvanced;
