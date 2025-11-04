/**
 * AnalysisPanel - Analyse intelligente de documents multi-langues
 * Support FR, EN, ES
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
    Chip,
    LinearProgress,
    Alert,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon
} from '@mui/material';
import {
    Analytics as AnalyticsIcon,
    Description as DocIcon,
    Lightbulb as IdeaIcon,
    Label as TagIcon,
    SentimentSatisfied as SentimentIcon,
    Refresh as RefreshIcon,
    Download as DownloadIcon
} from '@mui/icons-material';
import apiService from '../../services/apiService';

const AnalysisPanel = () => {
    const [documents, setDocuments] = useState([]);
    const [selectedDocument, setSelectedDocument] = useState('');
    const [analysisType, setAnalysisType] = useState('complete');
    const [manualText, setManualText] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [error, setError] = useState(null);

    // Types d'analyse
    const analysisTypes = [
        { value: 'complete', label: 'Analyse Complète', icon: <AnalyticsIcon /> },
        { value: 'summary', label: 'Résumé', icon: <DocIcon /> },
        { value: 'keywords', label: 'Mots-Clés', icon: <TagIcon /> },
        { value: 'sentiment', label: 'Sentiment', icon: <SentimentIcon /> },
        { value: 'entities', label: 'Entités', icon: <IdeaIcon /> }
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

    const handleAnalyze = async () => {
        if (!selectedDocument && !manualText.trim()) {
            setError('Veuillez sélectionner un document ou saisir du texte');
            return;
        }

        setIsAnalyzing(true);
        setError(null);
        setAnalysisResult(null);

        try {
            let result;

            if (selectedDocument) {
                // Analyser document existant
                result = await apiService.analyzeAIDocument(selectedDocument, analysisType);
            } else {
                // Analyser texte manuel
                result = await apiService.analyzeText(manualText, analysisType);
            }

            if (result.success) {
                setAnalysisResult(result);
            } else {
                setError(result.error || 'Erreur lors de l\'analyse');
            }
        } catch (err) {
            console.error('Erreur analyse:', err);
            setError(err.message || 'Erreur de connexion');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleDownloadAnalysis = () => {
        if (!analysisResult) return;

        const content = JSON.stringify(analysisResult, null, 2);
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analysis_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const renderAnalysisResult = () => {
        if (!analysisResult) return null;

        switch (analysisType) {
            case 'complete':
                return (
                    <Box>
                        {/* Résumé */}
                        {analysisResult.summary && (
                            <Card sx={{ mb: 2 }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        📝 Résumé
                                    </Typography>
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                        {analysisResult.summary}
                                    </Typography>
                                </CardContent>
                            </Card>
                        )}

                        {/* Mots-clés */}
                        {analysisResult.keywords && analysisResult.keywords.length > 0 && (
                            <Card sx={{ mb: 2 }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        🏷️ Mots-Clés
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        {analysisResult.keywords.map((keyword, idx) => (
                                            <Chip key={idx} label={keyword} color="primary" variant="outlined" />
                                        ))}
                                    </Box>
                                </CardContent>
                            </Card>
                        )}

                        {/* Sentiment */}
                        {analysisResult.sentiment && (
                            <Card sx={{ mb: 2 }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        😊 Analyse de Sentiment
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                        <Chip
                                            label={analysisResult.sentiment.label || 'Neutre'}
                                            color={
                                                analysisResult.sentiment.label === 'positif' ? 'success' :
                                                analysisResult.sentiment.label === 'négatif' ? 'error' :
                                                'default'
                                            }
                                        />
                                        <Typography variant="body2">
                                            Confiance: {Math.round((analysisResult.sentiment.confidence || 0) * 100)}%
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        )}

                        {/* Entités */}
                        {analysisResult.entities && analysisResult.entities.length > 0 && (
                            <Card sx={{ mb: 2 }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        🎯 Entités Détectées
                                    </Typography>
                                    <List dense>
                                        {analysisResult.entities.map((entity, idx) => (
                                            <ListItem key={idx}>
                                                <ListItemIcon>
                                                    <IdeaIcon color="primary" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={entity.text}
                                                    secondary={`Type: ${entity.type} - Confiance: ${Math.round((entity.confidence || 0) * 100)}%`}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </CardContent>
                            </Card>
                        )}

                        {/* Statistiques */}
                        {analysisResult.stats && (
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        📊 Statistiques
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6} sm={3}>
                                            <Typography variant="caption" color="text.secondary">
                                                Mots
                                            </Typography>
                                            <Typography variant="h6">
                                                {analysisResult.stats.wordCount || 0}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <Typography variant="caption" color="text.secondary">
                                                Caractères
                                            </Typography>
                                            <Typography variant="h6">
                                                {analysisResult.stats.charCount || 0}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <Typography variant="caption" color="text.secondary">
                                                Phrases
                                            </Typography>
                                            <Typography variant="h6">
                                                {analysisResult.stats.sentenceCount || 0}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <Typography variant="caption" color="text.secondary">
                                                Langue
                                            </Typography>
                                            <Typography variant="h6">
                                                {analysisResult.stats.language?.toUpperCase() || 'N/A'}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        )}
                    </Box>
                );

            case 'keywords':
                return (
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                🏷️ Mots-Clés Extraits
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                                {(analysisResult.keywords || []).map((keyword, idx) => (
                                    <Chip
                                        key={idx}
                                        label={keyword}
                                        color="primary"
                                        variant="outlined"
                                        size="medium"
                                    />
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                );

            case 'sentiment':
                return (
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                😊 Analyse de Sentiment
                            </Typography>
                            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Sentiment Principal:
                                    </Typography>
                                    <Chip
                                        label={analysisResult.sentiment?.label || 'Neutre'}
                                        color={
                                            analysisResult.sentiment?.label === 'positif' ? 'success' :
                                            analysisResult.sentiment?.label === 'négatif' ? 'error' :
                                            'default'
                                        }
                                        size="large"
                                    />
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Confiance:
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={(analysisResult.sentiment?.confidence || 0) * 100}
                                        sx={{ height: 10, borderRadius: 5 }}
                                    />
                                    <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                                        {Math.round((analysisResult.sentiment?.confidence || 0) * 100)}%
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                );

            default:
                return (
                    <Paper sx={{ p: 2 }}>
                        <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                            {JSON.stringify(analysisResult, null, 2)}
                        </Typography>
                    </Paper>
                );
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* En-tête */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <AnalyticsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        Analyse Intelligente de Documents
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Extraction de sens et analyse sémantique multi-langues
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
                                <InputLabel>Document à analyser</InputLabel>
                                <Select
                                    value={selectedDocument}
                                    onChange={(e) => {
                                        setSelectedDocument(e.target.value);
                                        setManualText('');
                                    }}
                                    label="Document à analyser"
                                    disabled={isAnalyzing}
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

                            {/* Type d'analyse */}
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Type d'analyse</InputLabel>
                                <Select
                                    value={analysisType}
                                    onChange={(e) => setAnalysisType(e.target.value)}
                                    label="Type d'analyse"
                                    disabled={isAnalyzing}
                                >
                                    {analysisTypes.map(type => (
                                        <MenuItem key={type.value} value={type.value}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {type.icon}
                                                {type.label}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Texte manuel */}
                            {!selectedDocument && (
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={8}
                                    value={manualText}
                                    onChange={(e) => setManualText(e.target.value)}
                                    placeholder="Saisissez ou collez votre texte ici..."
                                    disabled={isAnalyzing}
                                    sx={{ mb: 2 }}
                                />
                            )}

                            {/* Boutons d'action */}
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    variant="contained"
                                    onClick={handleAnalyze}
                                    disabled={isAnalyzing || (!selectedDocument && !manualText.trim())}
                                    startIcon={<AnalyticsIcon />}
                                    fullWidth
                                >
                                    {isAnalyzing ? 'Analyse...' : 'Analyser'}
                                </Button>
                                {analysisResult && (
                                    <Button
                                        variant="outlined"
                                        onClick={handleDownloadAnalysis}
                                        startIcon={<DownloadIcon />}
                                    >
                                        Export
                                    </Button>
                                )}
                            </Box>

                            {isAnalyzing && (
                                <LinearProgress sx={{ mt: 2 }} />
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Résultats */}
                <Grid item xs={12} md={8}>
                    <Card elevation={2} sx={{ minHeight: 400 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Résultats
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            {!analysisResult ? (
                                <Box sx={{ textAlign: 'center', py: 10 }}>
                                    <AnalyticsIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                                    <Typography variant="body1" color="text.secondary">
                                        Les résultats d'analyse apparaîtront ici
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Sélectionnez un document ou saisissez du texte, puis lancez l'analyse
                                    </Typography>
                                </Box>
                            ) : (
                                renderAnalysisResult()
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AnalysisPanel;
