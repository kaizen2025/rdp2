/**
 * Composant d'upload par Drag & Drop
 * Upload multiple avec preview et progression
 */

import React, { useState, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    LinearProgress,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemSecondaryAction,
    IconButton,
    Chip,
    Alert,
    Divider,
    Grid,
    Card,
    CardMedia,
    CardContent,
    CardActions,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    Delete as DeleteIcon,
    CheckCircle as CheckIcon,
    Error as ErrorIcon,
    Description as FileIcon,
    Image as ImageIcon,
    PictureAsPdf as PdfIcon,
    InsertDriveFile as DocIcon,
    Close as CloseIcon,
    Visibility as PreviewIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { getApiBaseUrl } from '../../services/backendConfig';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_FILE_TYPES = {
    'application/pdf': ['.pdf'],
    'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.bmp'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    'text/plain': ['.txt'],
    'application/zip': ['.zip']
};

function DragDropUpload({ onUploadComplete, autoCategorizationEnabled = true }) {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [categorizing, setCategorizing] = useState(false);
    const [previewFile, setPreviewFile] = useState(null);
    const [showMetadataDialog, setShowMetadataDialog] = useState(false);
    const [selectedFileForMetadata, setSelectedFileForMetadata] = useState(null);
    const [metadata, setMetadata] = useState({
        category: '',
        author: '',
        tags: '',
        description: ''
    });

    const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
        // Gérer les fichiers rejetés
        if (rejectedFiles.length > 0) {
            console.error('[DragDrop] Fichiers rejetés:', rejectedFiles);
            rejectedFiles.forEach(rejection => {
                const errors = rejection.errors.map(e => e.message).join(', ');
                alert(`Fichier rejeté: ${rejection.file.name}\nRaisons: ${errors}`);
            });
        }

        // Ajouter les fichiers acceptés
        const newFiles = acceptedFiles.map(file => ({
            id: `${file.name}-${Date.now()}`,
            file,
            status: 'pending', // pending, uploading, success, error
            error: null,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
            categorization: null
        }));

        setFiles(prev => [...prev, ...newFiles]);

        // Catégorisation automatique si activée
        if (autoCategorizationEnabled) {
            categorizeFiles(newFiles);
        }
    }, [autoCategorizationEnabled]);

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        accept: ACCEPTED_FILE_TYPES,
        maxSize: MAX_FILE_SIZE,
        multiple: true
    });

    const categorizeFiles = async (filesToCategorize) => {
        setCategorizing(true);
        try {
            const apiBase = await getApiBaseUrl();
            for (const fileItem of filesToCategorize) {
                const formData = new FormData();
                formData.append('file', fileItem.file);

                try {
                    const response = await axios.post(`${apiBase}/ai/categorize/document`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });

                    if (response.data.success) {
                        setFiles(prev => prev.map(f =>
                            f.id === fileItem.id
                                ? { ...f, categorization: response.data }
                                : f
                        ));
                    }
                } catch (error) {
                    console.error('[DragDrop] Erreur catégorisation:', error);
                }

                // Petit délai entre chaque catégorisation
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } finally {
            setCategorizing(false);
        }
    };

    const handleUpload = async () => {
        setUploading(true);
        const apiBase = await getApiBaseUrl();

        for (const fileItem of files) {
            if (fileItem.status === 'success') continue;

            try {
                setFiles(prev => prev.map(f =>
                    f.id === fileItem.id ? { ...f, status: 'uploading' } : f
                ));

                const formData = new FormData();
                formData.append('file', fileItem.file);

                // Ajouter les métadonnées si disponibles
                if (fileItem.categorization) {
                    formData.append('category', fileItem.categorization.category || '');
                    formData.append('confidence', fileItem.categorization.confidence || 0);
                    formData.append('metadata', JSON.stringify(fileItem.categorization.metadata || {}));
                }

                const response = await axios.post(`${apiBase}/ai/upload`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (progressEvent) => {
                        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(prev => ({ ...prev, [fileItem.id]: progress }));
                    }
                });

                if (response.data.success) {
                    setFiles(prev => prev.map(f =>
                        f.id === fileItem.id ? { ...f, status: 'success' } : f
                    ));
                } else {
                    throw new Error(response.data.error || 'Upload failed');
                }

            } catch (error) {
                console.error('[DragDrop] Erreur upload:', error);
                setFiles(prev => prev.map(f =>
                    f.id === fileItem.id
                        ? { ...f, status: 'error', error: error.message }
                        : f
                ));
            }
        }

        setUploading(false);

        // Callback de fin d'upload
        if (onUploadComplete) {
            const successCount = files.filter(f => f.status === 'success').length;
            onUploadComplete({ total: files.length, success: successCount });
        }
    };

    const handleRemoveFile = (fileId) => {
        setFiles(prev => {
            const file = prev.find(f => f.id === fileId);
            if (file && file.preview) {
                URL.revokeObjectURL(file.preview);
            }
            return prev.filter(f => f.id !== fileId);
        });
    };

    const handleClearAll = () => {
        files.forEach(file => {
            if (file.preview) {
                URL.revokeObjectURL(file.preview);
            }
        });
        setFiles([]);
        setUploadProgress({});
    };

    const handlePreview = (fileItem) => {
        setPreviewFile(fileItem);
    };

    const handleEditMetadata = (fileItem) => {
        setSelectedFileForMetadata(fileItem);
        setMetadata({
            category: fileItem.categorization?.category || '',
            author: fileItem.categorization?.metadata?.author || '',
            tags: fileItem.categorization?.tags?.join(', ') || '',
            description: ''
        });
        setShowMetadataDialog(true);
    };

    const handleSaveMetadata = () => {
        if (selectedFileForMetadata) {
            setFiles(prev => prev.map(f =>
                f.id === selectedFileForMetadata.id
                    ? {
                        ...f,
                        categorization: {
                            ...f.categorization,
                            category: metadata.category,
                            metadata: {
                                ...f.categorization?.metadata,
                                author: metadata.author
                            },
                            tags: metadata.tags.split(',').map(t => t.trim()).filter(t => t)
                        }
                    }
                    : f
            ));
        }
        setShowMetadataDialog(false);
        setSelectedFileForMetadata(null);
    };

    const getFileIcon = (file) => {
        const type = file.file.type;
        if (type.startsWith('image/')) return <ImageIcon />;
        if (type === 'application/pdf') return <PdfIcon />;
        if (type.includes('word') || type.includes('document')) return <DocIcon />;
        return <FileIcon />;
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const pendingFiles = files.filter(f => f.status === 'pending');
    const uploadingFiles = files.filter(f => f.status === 'uploading');
    const successFiles = files.filter(f => f.status === 'success');
    const errorFiles = files.filter(f => f.status === 'error');

    return (
        <Box>
            {/* Zone de Drag & Drop */}
            <Paper
                {...getRootProps()}
                elevation={3}
                sx={{
                    p: 4,
                    border: '3px dashed',
                    borderColor: isDragActive
                        ? 'primary.main'
                        : isDragReject
                            ? 'error.main'
                            : 'grey.300',
                    bgcolor: isDragActive ? 'action.hover' : 'background.paper',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textAlign: 'center',
                    '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'action.hover'
                    }
                }}
            >
                <input {...getInputProps()} />
                <UploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                    {isDragActive
                        ? 'Déposez les fichiers ici...'
                        : 'Glissez-déposez vos fichiers ici'}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    ou cliquez pour sélectionner des fichiers
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Formats acceptés: PDF, Images, Word, Excel, PowerPoint, ZIP
                </Typography>
                <br />
                <Typography variant="caption" color="text.secondary">
                    Taille maximale: 50 MB par fichier
                </Typography>
            </Paper>

            {/* Statistiques */}
            {files.length > 0 && (
                <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <Chip
                        label={`${files.length} fichier(s)`}
                        color="default"
                        variant="outlined"
                    />
                    {successFiles.length > 0 && (
                        <Chip
                            label={`${successFiles.length} envoyé(s)`}
                            color="success"
                            icon={<CheckIcon />}
                        />
                    )}
                    {errorFiles.length > 0 && (
                        <Chip
                            label={`${errorFiles.length} erreur(s)`}
                            color="error"
                            icon={<ErrorIcon />}
                        />
                    )}
                    {categorizing && (
                        <Chip
                            label="Catégorisation en cours..."
                            color="primary"
                            variant="outlined"
                        />
                    )}
                </Box>
            )}

            {/* Liste des fichiers */}
            {files.length > 0 && (
                <Box sx={{ mt: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                            Fichiers ({files.length})
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                                variant="outlined"
                                startIcon={<DeleteIcon />}
                                onClick={handleClearAll}
                                disabled={uploading}
                            >
                                Tout supprimer
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<UploadIcon />}
                                onClick={handleUpload}
                                disabled={uploading || files.every(f => f.status === 'success')}
                            >
                                {uploading ? 'Upload en cours...' : 'Envoyer tout'}
                            </Button>
                        </Box>
                    </Box>

                    <Grid container spacing={2}>
                        {files.map((fileItem) => (
                            <Grid item xs={12} sm={6} md={4} key={fileItem.id}>
                                <Card elevation={2}>
                                    {/* Preview si image */}
                                    {fileItem.preview && (
                                        <CardMedia
                                            component="img"
                                            height="140"
                                            image={fileItem.preview}
                                            alt={fileItem.file.name}
                                            sx={{ objectFit: 'cover' }}
                                        />
                                    )}

                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            {getFileIcon(fileItem)}
                                            <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                                                {fileItem.file.name}
                                            </Typography>
                                        </Box>

                                        <Typography variant="caption" color="text.secondary" display="block">
                                            {formatFileSize(fileItem.file.size)}
                                        </Typography>

                                        {/* Catégorisation */}
                                        {fileItem.categorization && (
                                            <Box sx={{ mt: 1 }}>
                                                <Chip
                                                    label={fileItem.categorization.category || 'Non classé'}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                                    Confiance: {Math.round((fileItem.categorization.confidence || 0) * 100)}%
                                                </Typography>
                                            </Box>
                                        )}

                                        {/* Statut */}
                                        <Box sx={{ mt: 2 }}>
                                            {fileItem.status === 'pending' && (
                                                <Chip label="En attente" size="small" />
                                            )}
                                            {fileItem.status === 'uploading' && (
                                                <Box>
                                                    <Chip label="Upload..." size="small" color="primary" />
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={uploadProgress[fileItem.id] || 0}
                                                        sx={{ mt: 1 }}
                                                    />
                                                    <Typography variant="caption" color="text.secondary">
                                                        {uploadProgress[fileItem.id] || 0}%
                                                    </Typography>
                                                </Box>
                                            )}
                                            {fileItem.status === 'success' && (
                                                <Chip label="Envoyé" size="small" color="success" icon={<CheckIcon />} />
                                            )}
                                            {fileItem.status === 'error' && (
                                                <Box>
                                                    <Chip label="Erreur" size="small" color="error" icon={<ErrorIcon />} />
                                                    <Typography variant="caption" color="error" display="block">
                                                        {fileItem.error}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </CardContent>

                                    <CardActions>
                                        {fileItem.preview && (
                                            <IconButton size="small" onClick={() => handlePreview(fileItem)}>
                                                <PreviewIcon />
                                            </IconButton>
                                        )}
                                        <IconButton
                                            size="small"
                                            onClick={() => handleEditMetadata(fileItem)}
                                            disabled={uploading}
                                        >
                                            <FileIcon />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleRemoveFile(fileItem.id)}
                                            disabled={uploading}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {/* Dialog Preview */}
            <Dialog
                open={previewFile !== null}
                onClose={() => setPreviewFile(null)}
                maxWidth="md"
                fullWidth
            >
                {previewFile && (
                    <>
                        <DialogTitle>
                            Aperçu: {previewFile.file.name}
                            <IconButton
                                onClick={() => setPreviewFile(null)}
                                sx={{ position: 'absolute', right: 8, top: 8 }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent>
                            {previewFile.preview && (
                                <Box sx={{ textAlign: 'center' }}>
                                    <img
                                        src={previewFile.preview}
                                        alt={previewFile.file.name}
                                        style={{ maxWidth: '100%', maxHeight: '70vh' }}
                                    />
                                </Box>
                            )}
                        </DialogContent>
                    </>
                )}
            </Dialog>

            {/* Dialog Metadata */}
            <Dialog
                open={showMetadataDialog}
                onClose={() => setShowMetadataDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Métadonnées du fichier</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControl fullWidth>
                            <InputLabel>Catégorie</InputLabel>
                            <Select
                                value={metadata.category}
                                label="Catégorie"
                                onChange={(e) => setMetadata({ ...metadata, category: e.target.value })}
                            >
                                <MenuItem value="Factures">Factures</MenuItem>
                                <MenuItem value="Devis">Devis</MenuItem>
                                <MenuItem value="Contrats">Contrats</MenuItem>
                                <MenuItem value="Rapports">Rapports</MenuItem>
                                <MenuItem value="Correspondance">Correspondance</MenuItem>
                                <MenuItem value="Documents Légaux">Documents Légaux</MenuItem>
                                <MenuItem value="Ressources Humaines">Ressources Humaines</MenuItem>
                                <MenuItem value="Comptabilité">Comptabilité</MenuItem>
                                <MenuItem value="Marketing">Marketing</MenuItem>
                                <MenuItem value="Technique">Technique</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="Auteur"
                            value={metadata.author}
                            onChange={(e) => setMetadata({ ...metadata, author: e.target.value })}
                        />

                        <TextField
                            fullWidth
                            label="Tags (séparés par des virgules)"
                            value={metadata.tags}
                            onChange={(e) => setMetadata({ ...metadata, tags: e.target.value })}
                        />

                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Description"
                            value={metadata.description}
                            onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowMetadataDialog(false)}>Annuler</Button>
                    <Button variant="contained" onClick={handleSaveMetadata}>Enregistrer</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default DragDropUpload;
