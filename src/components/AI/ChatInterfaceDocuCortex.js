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
    Link
} from '@mui/material';
import {
    Send as SendIcon,
    SmartToy as BotIcon,
    Person as PersonIcon,
    AttachFile as AttachIcon,
    Download as DownloadIcon,
    Visibility as PreviewIcon,
    QuestionAnswer as SuggestionIcon
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
    const messagesEndRef = useRef(null);

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
                        content: `Bonjour ! 👋 Je suis **DocuCortex**, votre assistant GED intelligent.

Je peux vous aider à :
- 🔍 Rechercher des documents dans votre base documentaire
- 📄 Résumer et analyser des fichiers
- 💡 Suggérer des documents pertinents
- 📊 Comparer plusieurs documents

**Comment puis-je vous aider aujourd'hui ?**`,
                        isWelcome: true,
                        timestamp: new Date(),
                        suggestions: [
                            'Quels types de documents sont disponibles ?',
                            'Montre-moi les documents les plus récents',
                            'Trouve-moi des offres de prix',
                            'Résume les documents modifiés cette semaine'
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
        if (!textToSend.trim() || isLoading) return;

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

            if (data.success) {
                const assistantMessage = {
                    type: 'assistant',
                    content: data.response,
                    confidence: data.confidence,
                    sources: data.sources || [],
                    attachments: data.attachments || [],
                    suggestions: data.suggestions || [],
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
                    content: 'Désolé, une erreur s\'est produite. Veuillez réessayer.',
                    isError: true,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, errorMessage]);
            }
        } catch (error) {
            console.error('Erreur envoi message:', error);
            const errorMessage = {
                type: 'assistant',
                content: 'Erreur de connexion au serveur.',
                isError: true,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
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

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <Box sx={{ 
                p: 2, 
                borderBottom: '1px solid #e0e0e0',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
            }}>
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
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Posez votre question à DocuCortex..."
                        variant="outlined"
                        disabled={isLoading}
                        size="small"
                    />
                    <IconButton
                        color="primary"
                        onClick={() => sendMessage()}
                        disabled={!inputMessage.trim() || isLoading}
                        sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                            },
                            '&:disabled': {
                                background: '#ccc'
                            }
                        }}
                    >
                        <SendIcon />
                    </IconButton>
                </Box>
            </Paper>
        </Box>
    );
};

/**
 * Composant MessageBubble avec support markdown, citations et suggestions
 */
const MessageBubble = ({ message, onSuggestionClick, onDownload, onPreview }) => {
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
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Paper>

                    {/* Suggestions */}
                    {!isUser && message.suggestions && message.suggestions.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                                <SuggestionIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                                Questions suggérées:
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {message.suggestions.map((suggestion, idx) => (
                                    <Chip
                                        key={idx}
                                        label={suggestion}
                                        size="small"
                                        onClick={() => onSuggestionClick(suggestion)}
                                        sx={{
                                            cursor: 'pointer',
                                            '&:hover': { bgcolor: '#667eea', color: 'white' }
                                        }}
                                    />
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
