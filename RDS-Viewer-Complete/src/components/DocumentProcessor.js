import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip,
  Card,
  CardContent,
  Divider,
  Fade,
  Collapse,
  Grid
} from '@mui/material';
import {
  CloudUpload,
  PictureAsPdf,
  Image,
  Description,
  CheckCircle,
  Error,
  DeleteOutline,
  Visibility,
  Download,
  Refresh,
  Psychology,
  TextFields,
  FileCopy,
  VisibilityOff
} from '@mui/icons-material';
import { extractText, processDocument, processBatchDocuments } from '../../services/ocrService.js';

const DocumentProcessor = () => {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [expandedItem, setExpandedItem] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [batchMode, setBatchMode] = useState(false);
  const fileInputRef = useRef(null);

  // Types de fichiers supportés
  const supportedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'image/tiff',
    'application/pdf'
  ];

  // Gérer le drag & drop
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  // Gérer la sélection de fichiers
  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  // Gérer les fichiers sélectionnés
  const handleFiles = (newFiles) => {
    const validFiles = newFiles.filter(file => supportedTypes.includes(file.type));
    
    if (validFiles.length !== newFiles.length) {
      setError('Certains fichiers ne sont pas supportés. Formats acceptés: images et PDF.');
    }

    if (validFiles.length > 0) {
      const filesWithInfo = validFiles.map(file => ({
        file,
        id: Date.now() + Math.random(),
        name: file.name,
        type: file.type,
        size: file.size,
        status: 'pending',
        progress: 0
      }));
      
      setFiles(prev => [...prev, ...filesWithInfo]);
      setError(null);
    }
  };

  // Obtenir l'icône selon le type de fichier
  const getFileIcon = (type) => {
    if (type.includes('pdf')) return <PictureAsPdf color="error" />;
    if (type.includes('image')) return <Image color="primary" />;
    return <Description color="action" />;
  };

  // Formater la taille de fichier
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Traiter un fichier individuel
  const processSingleFile = async (fileInfo) => {
    try {
      setCurrentFile(fileInfo.name);
      
      // Mettre à jour le statut
      setFiles(prev => prev.map(f => 
        f.id === fileInfo.id 
          ? { ...f, status: 'processing', progress: 0 }
          : f
      ));

      const result = await processDocument(fileInfo.file, {
        analyze: showAnalysis,
        analysisType: 'general',
        onProgress: (progressValue, step, data) => {
          setProgress(progressValue);
          
          // Mettre à jour la progression
          setFiles(prev => prev.map(f => 
            f.id === fileInfo.id 
              ? { ...f, progress: progressValue }
              : f
          ));
        }
      });

      // Ajouter le résultat
      const resultInfo = {
        id: fileInfo.id,
        fileName: fileInfo.name,
        fileType: fileInfo.type,
        fileSize: fileInfo.size,
        extractedText: result.text,
        confidence: result.confidence,
        analysis: result.analysis,
        processedAt: result.processed_at,
        status: 'completed'
      };

      setResults(prev => [...prev, resultInfo]);

      // Mettre à jour le statut du fichier
      setFiles(prev => prev.map(f => 
        f.id === fileInfo.id 
          ? { ...f, status: 'completed', progress: 100 }
          : f
      ));

      console.log('✅ Fichier traité avec succès:', fileInfo.name);

    } catch (error) {
      console.error('❌ Erreur traitement fichier:', error);
      
      setFiles(prev => prev.map(f => 
        f.id === fileInfo.id 
          ? { ...f, status: 'error', error: error.message }
          : f
      ));

      setError(`Erreur lors du traitement de ${fileInfo.name}: ${error.message}`);
    }
  };

  // Traiter tous les fichiers
  const processAllFiles = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    
    if (pendingFiles.length === 0) {
      setError('Aucun fichier en attente à traiter.');
      return;
    }

    setProcessing(true);
    setError(null);
    setProgress(0);

    try {
      if (batchMode && pendingFiles.length > 1) {
        // Mode batch pour plusieurs fichiers
        const batchResults = await processBatchDocuments(
          pendingFiles.map(f => f.file),
          {
            analyze: showAnalysis,
            analysisType: 'general',
            onProgress: (progressData) => {
              setProgress(progressData.progress);
              setCurrentFile(progressData.filename || '');
            }
          }
        );

        // Traiter les résultats du batch
        batchResults.forEach((result, index) => {
          const fileInfo = pendingFiles[index];
          
          if (result.success) {
            const resultInfo = {
              id: fileInfo.id,
              fileName: fileInfo.name,
              fileType: fileInfo.type,
              fileSize: fileInfo.size,
              extractedText: result.data.text,
              confidence: result.data.confidence,
              analysis: result.data.analysis,
              processedAt: result.data.processed_at,
              status: 'completed'
            };
            setResults(prev => [...prev, resultInfo]);
            
            setFiles(prev => prev.map(f => 
              f.id === fileInfo.id 
                ? { ...f, status: 'completed', progress: 100 }
                : f
            ));
          } else {
            setFiles(prev => prev.map(f => 
              f.id === fileInfo.id 
                ? { ...f, status: 'error', error: result.error }
                : f
            ));
          }
        });

      } else {
        // Traitement individuel
        for (const fileInfo of pendingFiles) {
          await processSingleFile(fileInfo);
        }
      }

    } catch (error) {
      console.error('❌ Erreur traitement en lot:', error);
      setError(`Erreur lors du traitement: ${error.message}`);
    } finally {
      setProcessing(false);
      setCurrentFile('');
      setProgress(0);
    }
  };

  // Supprimer un fichier
  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setResults(prev => prev.filter(r => r.id !== fileId));
  };

  // Supprimer tous les fichiers
  const clearAll = () => {
    setFiles([]);
    setResults([]);
    setError(null);
    setProgress(0);
    setCurrentFile('');
  };

  // Afficher/masquer l'analyse
  const toggleAnalysis = () => {
    setShowAnalysis(prev => !prev);
  };

  // Basculer le mode batch
  const toggleBatchMode = () => {
    setBatchMode(prev => !prev);
  };

  // Copier le texte extrait
  const copyExtractedText = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log('📋 Texte copié dans le presse-papier');
    }).catch(err => {
      console.error('❌ Erreur copie:', err);
    });
  };

  // Télécharger les résultats
  const downloadResults = () => {
    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `docucortex-ocr-results-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom color="primary">
          DocuCortex OCR
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Extraction de texte et analyse intelligente de vos documents
        </Typography>
      </Paper>

      {/* Zone de drag & drop */}
      <Paper
        elevation={2}
        sx={{
          p: 4,
          mb: 3,
          textAlign: 'center',
          border: dragActive ? '2px dashed' : '2px dashed transparent',
          borderColor: dragActive ? 'primary.main' : 'divider',
          backgroundColor: dragActive ? 'action.hover' : 'background.paper',
          transition: 'all 0.2s ease-in-out',
          cursor: 'pointer'
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={supportedTypes.join(',')}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        
        <CloudUpload sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Glissez vos fichiers ici ou cliquez pour sélectionner
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Formats supportés: Images (JPEG, PNG, GIF, WebP, TIFF) et PDF
        </Typography>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }}
          startIcon={<CloudUpload />}
        >
          Choisir des fichiers
        </Button>
      </Paper>

      {/* Options */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant={showAnalysis ? "contained" : "outlined"}
              onClick={toggleAnalysis}
              startIcon={showAnalysis ? <Psychology /> : <Psychology />}
              fullWidth
            >
              {showAnalysis ? 'Analyse ON' : 'Analyse OFF'}
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant={batchMode ? "contained" : "outlined"}
              onClick={toggleBatchMode}
              startIcon={<FileCopy />}
              fullWidth
            >
              {batchMode ? 'Mode Lot' : 'Mode Individuel'}
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              onClick={processAllFiles}
              disabled={processing || files.filter(f => f.status === 'pending').length === 0}
              startIcon={<Refresh />}
              fullWidth
            >
              {processing ? 'Traitement...' : 'Tout traiter'}
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              color="error"
              onClick={clearAll}
              disabled={processing}
              startIcon={<DeleteOutline />}
              fullWidth
            >
              Tout effacer
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Barre de progression */}
      {(processing || progress > 0) && (
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="body2">
              Traitement: {currentFile}
            </Typography>
            <Chip label={`${progress}%`} size="small" />
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Paper>
      )}

      {/* Alerte d'erreur */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <IconButton
              size="small"
              onClick={() => setError(null)}
            >
              <Error />
            </IconButton>
          }
        >
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Liste des fichiers */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Fichiers ({files.length})
            </Typography>
            
            {files.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                Aucun fichier sélectionné
              </Typography>
            ) : (
              <List dense>
                {files.map((fileInfo) => (
                  <React.Fragment key={fileInfo.id}>
                    <ListItem
                      secondaryAction={
                        <IconButton
                          edge="end"
                          onClick={() => removeFile(fileInfo.id)}
                          disabled={processing}
                        >
                          <DeleteOutline />
                        </IconButton>
                      }
                    >
                      <ListItemIcon>
                        {getFileIcon(fileInfo.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={fileInfo.name}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              {formatFileSize(fileInfo.size)}
                            </Typography>
                            {fileInfo.status === 'processing' && (
                              <LinearProgress 
                                variant="determinate" 
                                value={fileInfo.progress} 
                                size="small" 
                                sx={{ mt: 1 }}
                              />
                            )}
                            {fileInfo.status === 'error' && (
                              <Typography variant="caption" color="error">
                                Erreur: {fileInfo.error}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <Chip
                        size="small"
                        label={
                          fileInfo.status === 'pending' ? 'En attente' :
                          fileInfo.status === 'processing' ? 'Traitement...' :
                          fileInfo.status === 'completed' ? 'Terminé' :
                          fileInfo.status
                        }
                        color={
                          fileInfo.status === 'pending' ? 'default' :
                          fileInfo.status === 'processing' ? 'primary' :
                          fileInfo.status === 'completed' ? 'success' :
                          'error'
                        }
                        icon={
                          fileInfo.status === 'completed' ? <CheckCircle /> :
                          fileInfo.status === 'error' ? <Error /> :
                          null
                        }
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Résultats */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Résultats ({results.length})
              </Typography>
              {results.length > 0 && (
                <Button
                  size="small"
                  startIcon={<Download />}
                  onClick={downloadResults}
                >
                  Télécharger
                </Button>
              )}
            </Box>
            
            {results.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                Aucun résultat disponible
              </Typography>
            ) : (
              <List dense>
                {results.map((result) => (
                  <React.Fragment key={result.id}>
                    <ListItem
                      button
                      onClick={() => setExpandedItem(
                        expandedItem === result.id ? null : result.id
                      )}
                    >
                      <ListItemIcon>
                        {getFileIcon(result.fileType)}
                      </ListItemIcon>
                      <ListItemText
                        primary={result.fileName}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              Confiance: {result.confidence?.toFixed(1)}% | 
                              {new Date(result.processedAt).toLocaleString()}
                            </Typography>
                            {result.extractedText && (
                              <Typography variant="body2" sx={{ 
                                mt: 1, 
                                fontStyle: 'italic',
                                color: 'text.secondary',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical'
                              }}>
                                "{result.extractedText.substring(0, 100)}..."
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <ListItemIcon>
                        {expandedItem === result.id ? <VisibilityOff /> : <Visibility />}
                      </ListItemIcon>
                    </ListItem>
                    
                    <Collapse in={expandedItem === result.id}>
                      <Box sx={{ pl: 4, pr: 2, pb: 2 }}>
                        <Card variant="outlined" sx={{ mb: 2 }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="subtitle2">Texte extrait</Typography>
                              <IconButton
                                size="small"
                                onClick={() => copyExtractedText(result.extractedText)}
                              >
                                <FileCopy fontSize="small" />
                              </IconButton>
                            </Box>
                            <Typography variant="body2" sx={{ 
                              whiteSpace: 'pre-wrap',
                              fontFamily: 'monospace',
                              fontSize: '0.875rem'
                            }}>
                              {result.extractedText}
                            </Typography>
                          </CardContent>
                        </Card>

                        {result.analysis && showAnalysis && (
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="subtitle2" gutterBottom>
                                Analyse IA
                              </Typography>
                              <Typography variant="body2" sx={{ 
                                whiteSpace: 'pre-wrap',
                                color: 'primary.main'
                              }}>
                                {result.analysis.analysis || result.analysis}
                              </Typography>
                              {result.analysis.model && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                  Modèle: {result.analysis.model}
                                </Typography>
                              )}
                            </CardContent>
                          </Card>
                        )}
                      </Box>
                    </Collapse>
                    
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DocumentProcessor;