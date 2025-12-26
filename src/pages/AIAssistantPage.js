/**
 * Page principale de l'Assistant IA - DocuCortex
 * VERSION 2.0 - SPLIT VIEW PROFESSIONNELLE
 * ✅ Vue divisée: Chat à gauche, Aperçu documents à droite
 * ✅ Plus de widgets au-dessus du chat
 * ✅ Interface épurée et professionnelle
 */

import React, { useState, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    IconButton,
    Tooltip,
    Divider,
    Chip,
    Collapse,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemButton,
    Skeleton
} from '@mui/material';
import {
    SmartToy as BotIcon,
    Description as DocumentIcon,
    PictureAsPdf as PdfIcon,
    Image as ImageIcon,
    TableChart as ExcelIcon,
    Article as WordIcon,
    Slideshow as PptIcon,
    FolderOpen as FolderIcon,
    OpenInNew as OpenIcon,
    ChevronRight as ChevronRightIcon,
    ChevronLeft as ChevronLeftIcon,
    Download as DownloadIcon,
    Visibility as PreviewIcon,
    Close as CloseIcon
} from '@mui/icons-material';

// Composant principal
import ChatInterfaceDocuCortex from '../components/AI/ChatInterfaceDocuCortex';

// ✅ NOUVEAU: Panneau d'aperçu des documents
const DocumentPreviewPanel = ({ documents, selectedDoc, onSelectDoc, onClose, onOpenFile, onOpenFolder, isCollapsed, onToggleCollapse }) => {

    const getFileIcon = (filename) => {
        if (!filename) return <DocumentIcon />;
        const ext = filename.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'pdf': return <PdfIcon sx={{ color: '#f44336' }} />;
            case 'doc':
            case 'docx': return <WordIcon sx={{ color: '#2196f3' }} />;
            case 'xls':
            case 'xlsx': return <ExcelIcon sx={{ color: '#4caf50' }} />;
            case 'ppt':
            case 'pptx': return <PptIcon sx={{ color: '#ff9800' }} />;
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif': return <ImageIcon sx={{ color: '#9c27b0' }} />;
            default: return <DocumentIcon sx={{ color: '#757575' }} />;
        }
    };

    if (isCollapsed) {
        return (
            <Box sx={{
                width: 48,
                height: '100%',
                borderLeft: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 2,
                bgcolor: 'background.paper'
            }}>
                <Tooltip title="Afficher les documents" placement="left">
                    <IconButton onClick={onToggleCollapse} size="small">
                        <ChevronLeftIcon />
                    </IconButton>
                </Tooltip>
                {documents.length > 0 && (
                    <Chip
                        label={documents.length}
                        size="small"
                        color="primary"
                        sx={{ mt: 1, height: 20, fontSize: '0.7rem' }}
                    />
                )}
            </Box>
        );
    }

    return (
        <Paper
            elevation={0}
            sx={{
                width: { xs: '100%', md: 380 },
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderLeft: '1px solid',
                borderColor: 'divider',
                overflow: 'hidden'
            }}
        >
            {/* Header du panneau */}
            <Box sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: 'grey.50'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DocumentIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight={600}>
                        Documents trouvés
                    </Typography>
                    {documents.length > 0 && (
                        <Chip label={documents.length} size="small" color="primary" sx={{ height: 22 }} />
                    )}
                </Box>
                <Tooltip title="Réduire">
                    <IconButton size="small" onClick={onToggleCollapse}>
                        <ChevronRightIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Liste des documents */}
            <Box sx={{ flex: 1, overflow: 'auto' }}>
                {documents.length === 0 ? (
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        p: 3,
                        textAlign: 'center',
                        color: 'text.secondary'
                    }}>
                        <FolderIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                        <Typography variant="body1" fontWeight={500}>
                            Aucun document
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1, opacity: 0.7 }}>
                            Les documents trouvés par l'IA apparaîtront ici
                        </Typography>
                    </Box>
                ) : (
                    <List sx={{ py: 0 }}>
                        {documents.map((doc, index) => (
                            <ListItem
                                key={doc.id || index}
                                disablePadding
                                secondaryAction={
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        {doc.canPreview && (
                                            <Tooltip title="Aperçu">
                                                <IconButton
                                                    edge="end"
                                                    size="small"
                                                    onClick={() => onSelectDoc(doc)}
                                                >
                                                    <PreviewIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        <Tooltip title="Ouvrir le fichier">
                                            <IconButton
                                                edge="end"
                                                size="small"
                                                onClick={() => onOpenFile(doc)}
                                            >
                                                <OpenIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Ouvrir le dossier">
                                            <IconButton
                                                edge="end"
                                                size="small"
                                                onClick={() => onOpenFolder(doc)}
                                            >
                                                <FolderIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                }
                                sx={{
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    bgcolor: selectedDoc?.id === doc.id ? 'action.selected' : 'transparent'
                                }}
                            >
                                <ListItemButton onClick={() => onSelectDoc(doc)} sx={{ py: 1.5 }}>
                                    <ListItemIcon sx={{ minWidth: 40 }}>
                                        {getFileIcon(doc.filename)}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 180 }}>
                                                {doc.filename}
                                            </Typography>
                                        }
                                        secondary={
                                            <Box>
                                                {doc.score && (
                                                    <Chip
                                                        label={`${Math.round(doc.score)}% pertinent`}
                                                        size="small"
                                                        color={doc.score > 70 ? 'success' : doc.score > 40 ? 'warning' : 'default'}
                                                        sx={{ height: 18, fontSize: '0.65rem', mr: 0.5 }}
                                                    />
                                                )}
                                                {doc.category && (
                                                    <Chip
                                                        label={doc.category}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ height: 18, fontSize: '0.65rem' }}
                                                    />
                                                )}
                                            </Box>
                                        }
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                )}
            </Box>

            {/* Aperçu du document sélectionné */}
            <Collapse in={!!selectedDoc}>
                {selectedDoc && (
                    <Box sx={{
                        p: 2,
                        borderTop: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'grey.50',
                        maxHeight: 300,
                        overflow: 'auto'
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle2" fontWeight={600}>
                                Aperçu: {selectedDoc.filename}
                            </Typography>
                            <IconButton size="small" onClick={() => onSelectDoc(null)}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Box>
                        <Divider sx={{ mb: 1 }} />
                        {selectedDoc.preview ? (
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
                                {selectedDoc.preview}
                            </Typography>
                        ) : selectedDoc.excerpt ? (
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
                                {selectedDoc.excerpt}
                            </Typography>
                        ) : (
                            <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                Aperçu non disponible pour ce type de document
                            </Typography>
                        )}
                    </Box>
                )}
            </Collapse>
        </Paper>
    );
};

const AIAssistantPage = () => {
    // États pour la vue divisée
    const [foundDocuments, setFoundDocuments] = useState([]);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

    // Session de chat unique
    const [docuSessionId] = useState(() => {
        const stored = localStorage.getItem('docucortex_session_id');
        if (stored) return stored;
        const newId = `docu_${Date.now()}`;
        localStorage.setItem('docucortex_session_id', newId);
        return newId;
    });

    // Handler pour les messages envoyés - capture les documents trouvés
    const handleMessageSent = useCallback((data) => {
        if (data.sources && data.sources.length > 0) {
            // Transformer les sources en documents pour le panneau
            const docs = data.sources.map((source, index) => ({
                id: source.documentId || `doc-${index}`,
                filename: source.filename || 'Document',
                filepath: source.filepath || source.networkPath,
                networkPath: source.networkPath,
                score: source.score || source.similarity,
                category: source.category,
                preview: source.preview || source.excerpt,
                excerpt: source.excerpt,
                canPreview: true,
                documentId: source.documentId
            }));
            setFoundDocuments(docs);
        }

        // Aussi capturer les attachments
        if (data.attachments && data.attachments.length > 0) {
            const attachDocs = data.attachments.map((att, index) => ({
                id: att.documentId || `attach-${index}`,
                filename: att.filename,
                filepath: att.filepath || att.networkPath,
                networkPath: att.networkPath,
                canPreview: att.canPreview,
                documentId: att.documentId
            }));
            setFoundDocuments(prev => {
                // Dédupliquer
                const existingIds = new Set(prev.map(d => d.id));
                const newDocs = attachDocs.filter(d => !existingIds.has(d.id));
                return [...prev, ...newDocs];
            });
        }
    }, []);

    // Handlers pour le panneau documents
    const handleOpenFile = useCallback(async (doc) => {
        const filepath = doc.filepath || doc.networkPath;
        if (!filepath) return;

        if (window.electron && window.electron.shell) {
            await window.electron.shell.openPath(filepath);
        }
    }, []);

    const handleOpenFolder = useCallback(async (doc) => {
        const filepath = doc.filepath || doc.networkPath;
        if (!filepath) return;

        const folderPath = filepath.substring(0, filepath.lastIndexOf('\\') || filepath.lastIndexOf('/'));
        if (window.electron && window.electron.shell) {
            await window.electron.shell.openPath(folderPath);
        }
    }, []);

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* En-tête DocuCortex - Compact et élégant */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 3,
                py: 1.5,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <BotIcon sx={{ fontSize: 36 }} />
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                            DocuCortex IA
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.85 }}>
                            Assistant documentaire intelligent • Powered by Gemini
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                        icon={<DocumentIcon sx={{ fontSize: '16px !important' }} />}
                        label={`${foundDocuments.length} doc${foundDocuments.length !== 1 ? 's' : ''}`}
                        size="small"
                        sx={{
                            bgcolor: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            fontWeight: 600,
                            '& .MuiChip-icon': { color: 'white' }
                        }}
                    />
                </Box>
            </Box>

            {/* Zone principale: Chat + Documents */}
            <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Panneau Chat - Gauche */}
                <Paper
                    elevation={0}
                    sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        borderRadius: 0
                    }}
                >
                    <ChatInterfaceDocuCortex
                        sessionId={docuSessionId}
                        onMessageSent={handleMessageSent}
                    />
                </Paper>

                {/* Panneau Documents - Droite */}
                <DocumentPreviewPanel
                    documents={foundDocuments}
                    selectedDoc={selectedDocument}
                    onSelectDoc={setSelectedDocument}
                    onOpenFile={handleOpenFile}
                    onOpenFolder={handleOpenFolder}
                    isCollapsed={isPanelCollapsed}
                    onToggleCollapse={() => setIsPanelCollapsed(!isPanelCollapsed)}
                    onClose={() => setSelectedDocument(null)}
                />
            </Box>
        </Box>
    );
};

export default AIAssistantPage;
