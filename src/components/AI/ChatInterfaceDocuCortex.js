/**
 * ChatInterfaceDocuCortex - Version Super-Agent avec Volet de Prévisualisation
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
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Snackbar,
    Drawer,
    Grid,
    Collapse
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
    OpenInNew as OpenIcon,
    PictureAsPdf as PdfIcon,
    Description as DocIcon,
    TableChart as ExcelIcon,
    Slideshow as PptIcon,
    Image as ImageIcon,
    Close as CloseIcon,
    ZoomIn as ZoomInIcon,
    ZoomOut as ZoomOutIcon
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import apiService from '../../services/apiService';
import ConversationHistory from './ConversationHistory';

// --- COMPOSANT DE PRÉVISUALISATION INTÉGRÉ ---
const PreviewPanel = ({ document, onClose, onDownload, onOpenFolder }) => {
    const [zoom, setZoom] = useState(100);
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (document) {
            loadContent();
        }
    }, [document]);

    const loadContent = async () => {
        setLoading(true);
        try {
            const result = await apiService.getDocumentPreview(document.documentId);
            if (result.success) {
                setContent(result);
            }
        } catch (error) {
            console.error("Erreur loading preview", error);
        } finally {
            setLoading(false);
        }
    };

    const getExtension = (filename) => filename?.split('.').pop()?.toLowerCase();

    return (
        <Paper
            elevation={4}
            sx={{
                width: '40%',
                minWidth: 350,
                maxWidth: 600,
                borderLeft: '1px solid #e0e0e0',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                bgcolor: '#fff'
            }}
        >
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f5f7fa' }}>
                <Box sx={{ overflow: 'hidden' }}>
                    <Typography variant="subtitle2" noWrap fontWeight="bold">{document?.filename}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>{document?.networkPath}</Typography>
                </Box>
                <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
            </Box>

            {/* Toolbar */}
            <Box sx={{ p: 1, borderBottom: '1px solid #e0e0e0', display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Tooltip title="Zoom -"><IconButton size="small" onClick={() => setZoom(z => Math.max(50, z - 10))}><ZoomOutIcon fontSize="small" /></IconButton></Tooltip>
                <Typography variant="caption">{zoom}%</Typography>
                <Tooltip title="Zoom +"><IconButton size="small" onClick={() => setZoom(z => Math.min(200, z + 10))}><ZoomInIcon fontSize="small" /></IconButton></Tooltip>
                <Divider orientation="vertical" flexItem />
                <Tooltip title="Télécharger"><IconButton size="small" onClick={() => onDownload(document.documentId)}><DownloadIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Ouvrir Dossier"><IconButton size="small" onClick={() => onOpenFolder(document)}><FolderOpenIcon fontSize="small" /></IconButton></Tooltip>
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: '#fafafa', position: 'relative' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <CircularProgress />
                    </Box>
                ) : content ? (
                    <Box sx={{
                        transform: `scale(${zoom / 100})`,
                        transformOrigin: 'top left',
                        transition: 'transform 0.2s'
                    }}>
                        {['jpg', 'png', 'jpeg', 'gif'].includes(getExtension(document.filename)) ? (
                            <img src={content.imageUrl || `data:image/png;base64,${content.base64}`} alt="Preview" style={{ maxWidth: '100%' }} />
                        ) : ['txt', 'md', 'csv', 'log'].includes(getExtension(document.filename)) ? (
                            <Paper variant="outlined" sx={{ p: 2, fontFamily: 'monospace', whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
                                {content.textContent}
                            </Paper>
                        ) : (
                            <Alert severity="info">Aperçu non disponible pour ce format. Veuillez télécharger le fichier.</Alert>
                        )}
                    </Box>
                ) : (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>Sélectionnez un document pour voir l'aperçu</Typography>
                )}
            </Box>
        </Paper>
    );
};

const ChatInterfaceDocuCortex = ({ sessionId, onMessageSent }) => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeDocument, setActiveDocument] = useState(null); // ✅ NOUVEAU - Document actif pour le panneau
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
    const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
    const [allConversations, setAllConversations] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const dropZoneRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, activeDocument]); // Scroll quand le panneau s'ouvre/ferme

    // ... (Drag & Drop logic remains mostly same, summarized here)
    const handleDragEnter = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
    const handleDragLeave = useCallback((e) => { e.preventDefault(); e.stopPropagation(); if (e.currentTarget === e.target) setIsDragging(false); }, []);
    const handleDragOver = useCallback((e) => { e.preventDefault(); e.stopPropagation(); }, []);
    const handleDrop = useCallback(async (e) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            setUploadFile(files[0]);
            setUploadDialogOpen(true);
        }
    }, []);

    useEffect(() => {
        const dropZone = dropZoneRef.current;
        if (!dropZone) return;
        dropZone.addEventListener('dragenter', handleDragEnter);
        dropZone.addEventListener('dragleave', handleDragLeave);
        dropZone.addEventListener('dragover', handleDragOver);
        dropZone.addEventListener('drop', handleDrop);
        return () => {
            dropZone.removeEventListener('dragenter', handleDragEnter);
            dropZone.removeEventListener('dragleave', handleDragLeave);
            dropZone.removeEventListener('dragover', handleDragOver);
            dropZone.removeEventListener('drop', handleDrop);
        };
    }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

    // Message de bienvenue
    useEffect(() => {
        const loadHistoryAndWelcome = async () => {
            try {
                const data = await apiService.getAIConversationHistory(sessionId);
                if (data.success && data.conversations && data.conversations.length > 0) {
                    setAllConversations(data.conversations);
                    const formattedMessages = data.conversations.reverse().map(conv => ([
                        { type: 'user', content: conv.user_message, timestamp: new Date(conv.created_at) },
                        { type: 'assistant', content: conv.ai_response, confidence: conv.confidence_score, sources: conv.sources ? JSON.parse(conv.sources) : [], timestamp: new Date(conv.created_at) }
                    ])).flat();
                    setMessages(formattedMessages);
                } else {
                    const welcomeMessage = {
                        type: 'assistant',
                        content: `Bonjour ! 👋 Je suis **DocuCortex**, votre Super Agent GED.

Je peux :
- 🔍 **Rechercher** des procédures et documents sur le serveur local
- 📄 **Analyser** le contenu des fichiers (PDF, Word, Excel)
- ☀️ Répondre aux questions de **culture générale** (Météo, Sport...)
- 🖼️ **OCR** sur les images et scans

Glissez un fichier ici pour l'analyser ou posez une question !`,
                        isWelcome: true,
                        timestamp: new Date(),
                        suggestions: ['Chercher la procédure de sauvegarde', 'Analyser le dernier rapport', 'Météo à Paris']
                    };
                    setMessages([welcomeMessage]);
                }
            } catch (error) { console.error(error); }
        };
        loadHistoryAndWelcome();
    }, [sessionId]);

    const sendMessage = async (messageText = null) => {
        const textToSend = messageText || inputMessage;
        if (!textToSend.trim()) return;
        if (isLoading) return;

        const userMessage = { type: 'user', content: textToSend, timestamp: new Date() };
        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            const data = await apiService.sendAIMessage(sessionId, textToSend);
            if (data.success) {
                const assistantMessage = {
                    type: 'assistant',
                    content: data.response,
                    confidence: data.confidence,
                    sources: data.sources || [],
                    attachments: data.attachments || [],
                    suggestions: data.suggestions || [],
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, assistantMessage]);
                // Si des sources sont trouvées, ouvrir automatiquement le panneau avec la première source
                if (data.attachments && data.attachments.length > 0) {
                    setActiveDocument(data.attachments[0]);
                }
            } else {
                setMessages(prev => [...prev, { type: 'assistant', content: `❌ ${data.error}`, isError: true, timestamp: new Date() }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { type: 'assistant', content: `⚠️ Erreur de connexion: ${error.message}`, isError: true, timestamp: new Date() }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUploadDocument = async () => {
        if (!uploadFile) return;
        setUploading(true);
        try {
            const result = await apiService.uploadAIDocument(uploadFile);
            if (result.success) {
                setNotification({ open: true, message: `Document "${uploadFile.name}" indexé !`, severity: 'success' });
                setUploadDialogOpen(false);
                setUploadFile(null);
                setMessages(prev => [...prev, { type: 'assistant', content: `✅ J'ai lu et indexé **${uploadFile.name}**. Je suis prêt à répondre à vos questions dessus.`, isSystem: true, timestamp: new Date() }]);
            }
        } catch (error) {
            setNotification({ open: true, message: `Erreur upload: ${error.message}`, severity: 'error' });
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = (docId) => apiService.downloadDocument(docId);
    const handleOpenFolder = async (doc) => {
        if (window.electron && window.electron.shell && doc.networkPath) {
            const folder = doc.networkPath.substring(0, doc.networkPath.lastIndexOf('\\'));
            await window.electron.shell.openPath(folder);
        } else {
            setNotification({ open: true, message: 'Fonction disponible uniquement sur l\'application de bureau', severity: 'info' });
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BotIcon sx={{ fontSize: 32 }} />
                    <Box>
                        <Typography variant="h6" fontWeight="bold">DocuCortex</Typography>
                        <Typography variant="caption">Super Agent GED & Assistant</Typography>
                    </Box>
                </Box>
                <Box>
                    <Tooltip title="Historique"><IconButton size="small" onClick={() => setHistoryDrawerOpen(true)} sx={{ color: 'white' }}><HistoryIcon /></IconButton></Tooltip>
                    <Tooltip title="Nouvelle conversation"><IconButton size="small" onClick={() => { setMessages([]); setInputMessage(''); }} sx={{ color: 'white' }}><NewConversationIcon /></IconButton></Tooltip>
                </Box>
            </Box>

            {/* Main Content Area (Chat + Preview) */}
            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }} ref={dropZoneRef}>
                {/* Chat Area */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: '#f5f7fa' }}>
                        {messages.map((msg, idx) => (
                            <MessageBubble
                                key={idx}
                                message={msg}
                                onSuggestionClick={(s) => { setInputMessage(s); sendMessage(s); }}
                                onPreview={(att) => setActiveDocument(att)}
                                onDownload={handleDownload}
                                onOpenFolder={handleOpenFolder}
                            />
                        ))}
                        {isLoading && <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 2 }}><CircularProgress size={20} /><Typography variant="caption">DocuCortex analyse...</Typography></Box>}
                        <div ref={messagesEndRef} />
                    </Box>

                    {/* Input Area */}
                    <Paper elevation={3} sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton onClick={() => document.getElementById('ai-file-input').click()}><AttachIcon /></IconButton>
                            <input type="file" id="ai-file-input" style={{ display: 'none' }} onChange={(e) => { setUploadFile(e.target.files[0]); setUploadDialogOpen(true); }} />
                            <TextField fullWidth size="small" placeholder="Posez une question ou demandez un document..." value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} disabled={isLoading} />
                            <IconButton color="primary" onClick={() => sendMessage()} disabled={!inputMessage.trim() || isLoading}><SendIcon /></IconButton>
                        </Box>
                    </Paper>
                </Box>

                {/* Preview Panel (Right Side) */}
                <Collapse in={!!activeDocument} orientation="horizontal">
                    {activeDocument && (
                        <PreviewPanel
                            document={activeDocument}
                            onClose={() => setActiveDocument(null)}
                            onDownload={handleDownload}
                            onOpenFolder={handleOpenFolder}
                        />
                    )}
                </Collapse>

                {/* Drag Overlay */}
                {isDragging && (
                    <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(102, 126, 234, 0.1)', border: '3px dashed #667eea', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Paper sx={{ p: 4, textAlign: 'center' }}><UploadIcon sx={{ fontSize: 60, color: 'primary.main' }} /><Typography variant="h6">Déposez pour analyser</Typography></Paper>
                    </Box>
                )}
            </Box>

            {/* Upload Dialog */}
            <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)}>
                <DialogTitle>Uploader un document</DialogTitle>
                <DialogContent>
                    <Typography>Fichier : {uploadFile?.name}</Typography>
                    <Typography variant="caption">{(uploadFile?.size / 1024 / 1024).toFixed(2)} MB</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setUploadDialogOpen(false)}>Annuler</Button>
                    <Button variant="contained" onClick={handleUploadDocument} disabled={uploading}>{uploading ? 'Indexation...' : 'Analyser'}</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={notification.open} autoHideDuration={4000} onClose={() => setNotification({ ...notification, open: false })} message={notification.message} />
        </Box>
    );
};

const MessageBubble = ({ message, onSuggestionClick, onPreview, onDownload, onOpenFolder }) => {
    const isUser = message.type === 'user';
    return (
        <Box sx={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', mb: 2 }}>
            <Box sx={{ maxWidth: '80%', display: 'flex', gap: 1, flexDirection: isUser ? 'row-reverse' : 'row' }}>
                <Avatar sx={{ bgcolor: isUser ? 'secondary.main' : 'primary.main' }}>{isUser ? <PersonIcon /> : <BotIcon />}</Avatar>
                <Paper sx={{ p: 2, bgcolor: isUser ? 'primary.light' : 'white', color: isUser ? 'white' : 'text.primary', borderRadius: 2 }}>
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                    {/* Attachments / Sources */}
                    {!isUser && message.attachments && message.attachments.length > 0 && (
                        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {message.attachments.map((att, i) => (
                                <Chip
                                    key={i}
                                    icon={<DocIcon />}
                                    label={att.filename}
                                    onClick={() => onPreview(att)}
                                    onDelete={() => onDownload(att.documentId)}
                                    deleteIcon={<DownloadIcon />}
                                    variant="outlined"
                                    size="small"
                                    sx={{ bgcolor: 'background.paper' }}
                                />
                            ))}
                        </Box>
                    )}
                    {/* Suggestions */}
                    {!isUser && message.suggestions && (
                        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {message.suggestions.map((s, i) => (
                                <Chip key={i} label={s} onClick={() => onSuggestionClick(s)} size="small" variant="outlined" color="primary" icon={<SuggestionIcon />} sx={{ bgcolor: 'background.paper' }} />
                            ))}
                        </Box>
                    )}
                    <Typography variant="caption" display="block" textAlign="right" sx={{ mt: 0.5, opacity: 0.7 }}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                </Paper>
            </Box>
        </Box>
    );
};

export default ChatInterfaceDocuCortex;
