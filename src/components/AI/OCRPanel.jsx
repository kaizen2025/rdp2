/**
 * OCRPanel - Interface complète pour OCR multi-langues
 * Support FR, EN, ES avec détection automatique
 */

import React, { useState, useCallback } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Button,
    LinearProgress,
    Chip,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Card,
    CardContent,
    IconButton,
    Tooltip,
    Divider,
    TextField
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    Scanner as ScannerIcon,
    ContentCopy as CopyIcon,
    Download as DownloadIcon,
    Refresh as RefreshIcon,
    Check as CheckIcon,
    Translate as TranslateIcon,
    Image as ImageIcon,
    PictureAsPdf as PdfIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import apiService from '../../services/apiService';

const OCRPanel = () => {
    // États
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [ocrResult, setOcrResult] = useState(null);
    const [error, setError] = useState(null);
    const [selectedLanguages, setSelectedLanguages] = useState('fra+eng+spa');
    const [autoAnalyze, setAutoAnalyze] = useState(true);
    const [copied, setCopied] = useState(false);

    // Langues supportées
    const languages = [
        { code: 'fra', label: 'Français', flag: '🇫🇷' },
        { code: 'eng', label: 'English', flag: '🇬🇧' },
        { code: 'spa', label: 'Español', flag: '🇪🇸' },
        { code: 'fra+eng+spa', label: 'Auto (Toutes)', flag: '🌍' }
    ];

    // Dropzone pour drag & drop
    const onDrop = useCallback(acceptedFiles => {
        if (acceptedFiles && acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            setSelectedFile(file);
            setError(null);
            setOcrResult(null);

            // Créer prévisualisation
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff'],
            'application/pdf': ['.pdf']
        },
        maxFiles: 1,
        multiple: false
    });

    // Traiter OCR
    const handleProcessOCR = async () => {
        if (!selectedFile) {
            setError('Veuillez sélectionner un fichier');
            return;
        }

        setIsProcessing(true);
        setProgress(0);
        setError(null);
        setOcrResult(null);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('languages', selectedLanguages);
            formData.append('autoAnalyze', autoAnalyze);

            // Simulation progression (car l'API ne renvoie pas de progression en temps réel)
            const progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 500);

            const result = await apiService.processOCR(formData);

            clearInterval(progressInterval);
            setProgress(100);

            if (result.success) {
                setOcrResult(result);
                setTimeout(() => setProgress(0), 1000);
            } else {
                setError(result.error || 'Erreur lors du traitement OCR');
            }
        } catch (err) {
            console.error('Erreur OCR:', err);
            setError(err.message || 'Erreur de connexion au serveur');
        } finally {
            setIsProcessing(false);
        }
    };

    // Copier le texte
    const handleCopyText = () => {
        if (ocrResult && ocrResult.text) {
            navigator.clipboard.writeText(ocrResult.text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Télécharger le texte
    const handleDownloadText = () => {
        if (ocrResult && ocrResult.text) {
            const blob = new Blob([ocrResult.text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ocr_result_${Date.now()}.txt`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    // Reset
    const handleReset = () => {
        setSelectedFile(null);
        setImagePreview(null);
        setOcrResult(null);
        setError(null);
        setProgress(0);
        setCopied(false);
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* En-tête */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ScannerIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                            OCR - Extraction de Texte
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Support multi-langues (Français, English, Español)
                        </Typography>
                    </Box>
                </Box>

                <FormControl sx={{ minWidth: 200 }} size="small">
                    <InputLabel>Langues</InputLabel>
                    <Select
                        value={selectedLanguages}
                        onChange={(e) => setSelectedLanguages(e.target.value)}
                        label="Langues"
                        disabled={isProcessing}
                    >
                        {languages.map(lang => (
                            <MenuItem key={lang.code} value={lang.code}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <span>{lang.flag}</span>
                                    <span>{lang.label}</span>
                                </Box>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {error && (
                <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Zone Upload / Prévisualisation */}
                <Grid item xs={12} md={6}>
                    <Card elevation={2}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <UploadIcon /> Source
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            {!selectedFile ? (
                                // Zone Drag & Drop
                                <Box
                                    {...getRootProps()}
                                    sx={{
                                        border: '2px dashed',
                                        borderColor: isDragActive ? 'primary.main' : 'grey.400',
                                        borderRadius: 2,
                                        p: 4,
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        bgcolor: isDragActive ? 'action.hover' : 'transparent',
                                        transition: 'all 0.3s',
                                        '&:hover': {
                                            borderColor: 'primary.main',
                                            bgcolor: 'action.hover'
                                        }
                                    }}
                                >
                                    <input {...getInputProps()} />
                                    <UploadIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                                    <Typography variant="h6" gutterBottom>
                                        {isDragActive ? 'Déposez le fichier ici' : 'Glissez-déposez une image ou PDF'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        ou cliquez pour sélectionner
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                                        <Chip icon={<ImageIcon />} label="PNG, JPG, GIF" size="small" />
                                        <Chip icon={<PdfIcon />} label="PDF" size="small" />
                                    </Box>
                                </Box>
                            ) : (
                                // Prévisualisation
                                <Box>
                                    {imagePreview && (
                                        <Box
                                            sx={{
                                                mb: 2,
                                                textAlign: 'center',
                                                p: 2,
                                                bgcolor: 'grey.100',
                                                borderRadius: 2,
                                                maxHeight: 400,
                                                overflow: 'auto'
                                            }}
                                        >
                                            <img
                                                src={imagePreview}
                                                alt="Prévisualisation"
                                                style={{ maxWidth: '100%', maxHeight: 350, borderRadius: 4 }}
                                            />
                                        </Box>
                                    )}

                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
                                        <Typography variant="body2" sx={{ flex: 1 }}>
                                            <strong>Fichier:</strong> {selectedFile.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {(selectedFile.size / 1024).toFixed(1)} KB
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button
                                            variant="contained"
                                            onClick={handleProcessOCR}
                                            disabled={isProcessing}
                                            startIcon={<ScannerIcon />}
                                            fullWidth
                                        >
                                            {isProcessing ? 'Traitement...' : 'Extraire le Texte'}
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            onClick={handleReset}
                                            disabled={isProcessing}
                                            startIcon={<RefreshIcon />}
                                        >
                                            Nouveau
                                        </Button>
                                    </Box>

                                    {isProcessing && (
                                        <Box sx={{ mt: 2 }}>
                                            <LinearProgress variant="determinate" value={progress} />
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                                Extraction en cours... {progress}%
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Résultats OCR */}
                <Grid item xs={12} md={6}>
                    <Card elevation={2} sx={{ height: '100%' }}>
                        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <TranslateIcon /> Texte Extrait
                                </Typography>

                                {ocrResult && (
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Tooltip title={copied ? 'Copié !' : 'Copier'}>
                                            <IconButton onClick={handleCopyText} size="small" color={copied ? 'success' : 'default'}>
                                                {copied ? <CheckIcon /> : <CopyIcon />}
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Télécharger">
                                            <IconButton onClick={handleDownloadText} size="small">
                                                <DownloadIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                )}
                            </Box>

                            <Divider sx={{ mb: 2 }} />

                            {!ocrResult ? (
                                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <TranslateIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                                        <Typography variant="body1" color="text.secondary">
                                            Le texte extrait apparaîtra ici
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Sélectionnez une image et lancez l'extraction
                                        </Typography>
                                    </Box>
                                </Box>
                            ) : (
                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    {/* Métadonnées */}
                                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                                        <Chip
                                            label={`Langue: ${ocrResult.language?.toUpperCase() || 'AUTO'}`}
                                            size="small"
                                            color="primary"
                                        />
                                        <Chip
                                            label={`Confiance: ${Math.round(ocrResult.confidence || 0)}%`}
                                            size="small"
                                            color={ocrResult.confidence > 80 ? 'success' : 'warning'}
                                        />
                                        <Chip
                                            label={`${ocrResult.text?.length || 0} caractères`}
                                            size="small"
                                            variant="outlined"
                                        />
                                        <Chip
                                            label={`${ocrResult.words || 0} mots`}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </Box>

                                    {/* Texte */}
                                    <Paper
                                        sx={{
                                            flex: 1,
                                            p: 2,
                                            bgcolor: 'grey.50',
                                            overflow: 'auto',
                                            fontFamily: 'monospace',
                                            whiteSpace: 'pre-wrap',
                                            wordWrap: 'break-word'
                                        }}
                                        variant="outlined"
                                    >
                                        {ocrResult.text || 'Aucun texte détecté'}
                                    </Paper>

                                    {/* Analyse IA (si activée) */}
                                    {ocrResult.analysis && (
                                        <Box sx={{ mt: 2 }}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                📊 Analyse IA:
                                            </Typography>
                                            <Paper sx={{ p: 2, bgcolor: 'primary.50' }} variant="outlined">
                                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                                    {ocrResult.analysis}
                                                </Typography>
                                            </Paper>
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Statistiques / Informations */}
            {ocrResult && ocrResult.metadata && (
                <Card elevation={1} sx={{ mt: 3 }}>
                    <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                            Informations de Traitement:
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6} sm={3}>
                                <Typography variant="caption" color="text.secondary">
                                    Temps de traitement
                                </Typography>
                                <Typography variant="body2">
                                    {ocrResult.processingTime ? `${ocrResult.processingTime}ms` : 'N/A'}
                                </Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <Typography variant="caption" color="text.secondary">
                                    Lignes détectées
                                </Typography>
                                <Typography variant="body2">
                                    {ocrResult.lines || 0}
                                </Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <Typography variant="caption" color="text.secondary">
                                    Blocs de texte
                                </Typography>
                                <Typography variant="body2">
                                    {ocrResult.blocks || 0}
                                </Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <Typography variant="caption" color="text.secondary">
                                    Orientation
                                </Typography>
                                <Typography variant="body2">
                                    {ocrResult.metadata?.orientation || 'N/A'}
                                </Typography>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};

export default OCRPanel;
