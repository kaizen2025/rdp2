/**
 * DocumentPreviewModal - Modale de prévisualisation de documents
 * Support: Images, PDF, Texte, avec accès direct au fichier réseau
 */

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    CircularProgress,
    Alert,
    IconButton,
    Chip,
    Tooltip
} from '@mui/material';
import {
    Close as CloseIcon,
    Download as DownloadIcon,
    FolderOpen as FolderOpenIcon,
    ZoomIn as ZoomInIcon,
    ZoomOut as ZoomOutIcon
} from '@mui/icons-material';
import apiService from '../../services/apiService';

const DocumentPreviewModal = ({ open, onClose, documentId, filename, networkPath }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [zoom, setZoom] = useState(100);

    useEffect(() => {
        if (open && documentId) {
            loadPreview();
        }
    }, [open, documentId]);

    const loadPreview = async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await apiService.getDocumentPreview(documentId);

            if (result.success) {
                setPreviewData(result);
            } else {
                setError(result.error || 'Impossible de charger l\'aperçu');
            }
        } catch (err) {
            setError('Erreur lors du chargement de l\'aperçu: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        apiService.downloadDocument(documentId);
    };

    const handleOpenInExplorer = () => {
        if (networkPath) {
            // Ouvrir l'explorateur Windows à l'emplacement du fichier
            // Nécessite un endpoint backend ou electron pour exécuter explorer.exe
            window.open(`file:///${networkPath}`, '_blank');
        }
    };

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));

    const getFileExtension = (fname) => {
        return fname?.split('.').pop()?.toLowerCase() || '';
    };

    const renderPreview = () => {
        if (loading) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Chargement de l'aperçu...</Typography>
                </Box>
            );
        }

        if (error) {
            return (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Vous pouvez toujours télécharger le document ou l'ouvrir dans l'explorateur.
                    </Typography>
                </Alert>
            );
        }

        const ext = getFileExtension(filename);

        // Aperçu image
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext)) {
            return (
                <Box sx={{ textAlign: 'center', overflow: 'auto', maxHeight: '60vh' }}>
                    <img
                        src={previewData.imageUrl || `data:image/${ext};base64,${previewData.base64}`}
                        alt={filename}
                        style={{
                            maxWidth: '100%',
                            transform: `scale(${zoom / 100})`,
                            transition: 'transform 0.2s'
                        }}
                    />
                </Box>
            );
        }

        // Aperçu texte
        if (['txt', 'md', 'log', 'json', 'xml', 'csv'].includes(ext)) {
            return (
                <Box
                    sx={{
                        maxHeight: '60vh',
                        overflow: 'auto',
                        bgcolor: '#f5f5f5',
                        p: 2,
                        borderRadius: 1,
                        fontFamily: 'monospace',
                        fontSize: `${zoom}%`,
                        whiteSpace: 'pre-wrap'
                    }}
                >
                    {previewData.textContent || 'Aucun contenu texte disponible'}
                </Box>
            );
        }

        // Aperçu PDF
        if (ext === 'pdf') {
            return (
                <Box sx={{ textAlign: 'center' }}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Aperçu PDF complet disponible après téléchargement.
                    </Alert>
                    {previewData.thumbnailUrl && (
                        <img
                            src={previewData.thumbnailUrl}
                            alt="PDF Preview"
                            style={{ maxWidth: '100%', border: '1px solid #ddd' }}
                        />
                    )}
                </Box>
            );
        }

        // Type non supporté
        return (
            <Alert severity="info">
                L'aperçu n'est pas disponible pour ce type de fichier ({ext.toUpperCase()}).
                Utilisez les boutons ci-dessous pour télécharger ou ouvrir le fichier.
            </Alert>
        );
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: { minHeight: '70vh' }
            }}
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6">Aperçu: {filename}</Typography>
                        {getFileExtension(filename) && (
                            <Chip
                                label={getFileExtension(filename).toUpperCase()}
                                size="small"
                                color="primary"
                            />
                        )}
                    </Box>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
                {networkPath && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                        📁 {networkPath}
                    </Typography>
                )}
            </DialogTitle>

            <DialogContent dividers>
                {/* Contrôles de zoom pour images et texte */}
                {!loading && !error && ['jpg', 'jpeg', 'png', 'gif', 'txt', 'md'].includes(getFileExtension(filename)) && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
                        <Tooltip title="Zoom -">
                            <IconButton size="small" onClick={handleZoomOut} disabled={zoom <= 50}>
                                <ZoomOutIcon />
                            </IconButton>
                        </Tooltip>
                        <Typography variant="body2" sx={{ alignSelf: 'center', minWidth: 60, textAlign: 'center' }}>
                            {zoom}%
                        </Typography>
                        <Tooltip title="Zoom +">
                            <IconButton size="small" onClick={handleZoomIn} disabled={zoom >= 200}>
                                <ZoomInIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                )}

                {renderPreview()}
            </DialogContent>

            <DialogActions>
                {networkPath && (
                    <Button
                        startIcon={<FolderOpenIcon />}
                        onClick={handleOpenInExplorer}
                        variant="outlined"
                    >
                        Ouvrir dans l'Explorateur
                    </Button>
                )}
                <Button
                    startIcon={<DownloadIcon />}
                    onClick={handleDownload}
                    variant="contained"
                >
                    Télécharger
                </Button>
                <Button onClick={onClose}>
                    Fermer
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DocumentPreviewModal;
