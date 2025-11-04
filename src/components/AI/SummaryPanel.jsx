/**
 * SummaryPanel - Génération de résumés intelligents multi-langues
 * Support FR, EN, ES avec Ollama
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Card,
    CardContent,
    Slider,
    Chip,
    Alert,
    Divider,
    LinearProgress,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Summarize as SummarizeIcon,
    ContentCopy as CopyIcon,
    Download as DownloadIcon,
    Check as CheckIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import apiService from '../../services/apiService';

const SummaryPanel = () => {
    const [documents, setDocuments] = useState([]);
    const [selectedDocument, setSelectedDocument] = useState('');
    const [manualText, setManualText] = useState('');
    const [summaryLength, setSummaryLength] = useState(200);
    const [summaryStyle, setSummaryStyle] = useState('concise');
    const [isGenerating, setIsGenerating] = useState(false);
    const [summaryResult, setSummaryResult] = useState(null);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    // Styles de résumé
    const styles = [
        { value: 'concise', label: 'Concis', description: 'Points essentiels uniquement' },
        { value: 'detailed', label: 'Détaillé', description: 'Résumé complet avec contexte' },
        { value: 'bullet', label: 'Puces', description: 'Liste à puces structurée' },
        { value: 'executive', label: 'Exécutif', description: 'Synthèse pour décideurs' }
    ];

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        try {
            const result = await apiService.getAIDocuments(50);
            if (result.success) {
                setDocuments(result.documents || []);
            }
        } catch (err) {
            console.error('Erreur chargement documents:', err);
        }
    };

    const handleGenerate = async () => {
        if (!selectedDocument && !manualText.trim()) {
            setError('Veuillez sélectionner un document ou saisir du texte');
            return;
        }

        setIsGenerating(true);
        setError(null);
        setSummaryResult(null);

        try {
            let result;

            if (selectedDocument) {
                // Résumer document existant
                result = await apiService.summarizeAIDocument(selectedDocument, {
                    maxLength: summaryLength,
                    style: summaryStyle
                });
            } else {
                // Résumer texte manuel
                result = await apiService.summarizeText(manualText, {
                    maxLength: summaryLength,
                    style: summaryStyle
                });
            }

            if (result.success) {
                setSummaryResult(result);
            } else {
                setError(result.error || 'Erreur lors de la génération du résumé');
            }
        } catch (err) {
            console.error('Erreur résumé:', err);
            setError(err.message || 'Erreur de connexion');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        if (summaryResult && summaryResult.summary) {
            navigator.clipboard.writeText(summaryResult.summary);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownload = () => {
        if (!summaryResult) return;

        const content = `# Résumé\n\n${summaryResult.summary}\n\n---\n\n## Métadonnées\n\n- Longueur originale: ${summaryResult.originalLength || 0} caractères\n- Longueur résumé: ${summaryResult.summaryLength || 0} caractères\n- Compression: ${summaryResult.compression || 0}%\n- Style: ${summaryStyle}\n- Date: ${new Date().toLocaleString('fr-FR')}`;

        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resume_${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        setSelectedDocument('');
        setManualText('');
        setSummaryResult(null);
        setError(null);
        setCopied(false);
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* En-tête */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <SummarizeIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        Génération de Résumés Intelligents
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Résumés automatiques multi-langues avec Ollama
                    </Typography>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Panel de configuration */}
                <Grid item xs={12} md={4}>
                    <Card elevation={2}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Configuration
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            {/* Sélection document */}
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Document à résumer</InputLabel>
                                <Select
                                    value={selectedDocument}
                                    onChange={(e) => {
                                        setSelectedDocument(e.target.value);
                                        setManualText('');
                                    }}
                                    label="Document à résumer"
                                    disabled={isGenerating}
                                >
                                    <MenuItem value="">
                                        <em>Saisie manuelle</em>
                                    </MenuItem>
                                    {documents.map(doc => (
                                        <MenuItem key={doc.id} value={doc.id}>
                                            {doc.filename}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Texte manuel */}
                            {!selectedDocument && (
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={6}
                                    value={manualText}
                                    onChange={(e) => setManualText(e.target.value)}
                                    placeholder="Saisissez ou collez votre texte ici..."
                                    disabled={isGenerating}
                                    sx={{ mb: 2 }}
                                    helperText={`${manualText.length} caractères`}
                                />
                            )}

                            {/* Style de résumé */}
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Style de résumé</InputLabel>
                                <Select
                                    value={summaryStyle}
                                    onChange={(e) => setSummaryStyle(e.target.value)}
                                    label="Style de résumé"
                                    disabled={isGenerating}
                                >
                                    {styles.map(style => (
                                        <MenuItem key={style.value} value={style.value}>
                                            <Box>
                                                <Typography variant="body2">{style.label}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {style.description}
                                                </Typography>
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Longueur du résumé */}
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="body2" gutterBottom>
                                    Longueur maximale: {summaryLength} mots
                                </Typography>
                                <Slider
                                    value={summaryLength}
                                    onChange={(e, value) => setSummaryLength(value)}
                                    min={50}
                                    max={500}
                                    step={50}
                                    marks={[
                                        { value: 50, label: '50' },
                                        { value: 200, label: '200' },
                                        { value: 500, label: '500' }
                                    ]}
                                    disabled={isGenerating}
                                    valueLabelDisplay="auto"
                                />
                            </Box>

                            {/* Boutons d'action */}
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    variant="contained"
                                    onClick={handleGenerate}
                                    disabled={isGenerating || (!selectedDocument && !manualText.trim())}
                                    startIcon={<SummarizeIcon />}
                                    fullWidth
                                >
                                    {isGenerating ? 'Génération...' : 'Générer'}
                                </Button>
                                {summaryResult && (
                                    <Button
                                        variant="outlined"
                                        onClick={handleReset}
                                        startIcon={<RefreshIcon />}
                                    >
                                        Nouveau
                                    </Button>
                                )}
                            </Box>

                            {isGenerating && (
                                <Box sx={{ mt: 2 }}>
                                    <LinearProgress />
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                                        Génération du résumé avec Ollama...
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Résultats */}
                <Grid item xs={12} md={8}>
                    <Card elevation={2} sx={{ minHeight: 400 }}>
                        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="h6">
                                    Résumé Généré
                                </Typography>

                                {summaryResult && (
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Tooltip title={copied ? 'Copié !' : 'Copier'}>
                                            <IconButton onClick={handleCopy} size="small" color={copied ? 'success' : 'default'}>
                                                {copied ? <CheckIcon /> : <CopyIcon />}
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Télécharger">
                                            <IconButton onClick={handleDownload} size="small">
                                                <DownloadIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                )}
                            </Box>

                            <Divider sx={{ mb: 2 }} />

                            {!summaryResult ? (
                                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <SummarizeIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                                        <Typography variant="body1" color="text.secondary">
                                            Le résumé apparaîtra ici
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Sélectionnez un document ou saisissez du texte, puis lancez la génération
                                        </Typography>
                                    </Box>
                                </Box>
                            ) : (
                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    {/* Métadonnées */}
                                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                                        <Chip
                                            label={`Style: ${summaryStyle}`}
                                            size="small"
                                            color="primary"
                                        />
                                        {summaryResult.originalLength && (
                                            <Chip
                                                label={`Original: ${summaryResult.originalLength} car.`}
                                                size="small"
                                                variant="outlined"
                                            />
                                        )}
                                        {summaryResult.summaryLength && (
                                            <Chip
                                                label={`Résumé: ${summaryResult.summaryLength} car.`}
                                                size="small"
                                                variant="outlined"
                                            />
                                        )}
                                        {summaryResult.compression && (
                                            <Chip
                                                label={`Compression: ${summaryResult.compression}%`}
                                                size="small"
                                                color="success"
                                            />
                                        )}
                                    </Box>

                                    {/* Résumé */}
                                    <Paper
                                        sx={{
                                            flex: 1,
                                            p: 3,
                                            bgcolor: 'grey.50',
                                            overflow: 'auto',
                                            whiteSpace: 'pre-wrap',
                                            lineHeight: 1.8
                                        }}
                                        variant="outlined"
                                    >
                                        <Typography variant="body1">
                                            {summaryResult.summary || 'Aucun résumé généré'}
                                        </Typography>
                                    </Paper>

                                    {/* Temps de traitement */}
                                    {summaryResult.processingTime && (
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'right' }}>
                                            Généré en {summaryResult.processingTime}ms
                                        </Typography>
                                    )}
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default SummaryPanel;
