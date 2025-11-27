/**
 * DigitalSignaturePad.js - Composant de signature tactile avancé
 * 
 * Fonctionnalités:
 * - Canvas HTML5 pour signature tactile
 * - Support stylus et doigt
 * - Détection de pression et vélocité
 * - Prévisualisation et validation
 * - Export en multiple formats (PNG, SVG, PDF)
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  IconButton,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Tooltip,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Brush as BrushIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
  Undo as UndoIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Palette as PaletteIcon,
  Save as SaveIcon,
  Fingerprint as FingerprintIcon
} from '@mui/icons-material';

import eSignatureService from '../../services/eSignatureService';

const DigitalSignaturePad = ({
  onSignatureComplete,
  onSignatureChange,
  width = 500,
  height = 300,
  strokeColor = '#000000',
  strokeWidth = 2,
  backgroundColor = '#ffffff',
  disabled = false,
  showControls = true,
  showPreview = true,
  enablePressureSensitivity = true,
  enableVelocityDetection = true,
  minStrokeLength = 3,
  userId,
  documentId,
  documentType = 'loan'
}) => {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const containerRef = useRef(null);
  
  // États du composant
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [strokeData, setStrokeData] = useState([]);
  const [currentStroke, setCurrentStroke] = useState(null);
  const [currentSettings, setCurrentSettings] = useState({
    color: strokeColor,
    width: strokeWidth,
    pressure: 0.5,
    velocity: 0
  });
  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [signatureMetadata, setSignatureMetadata] = useState(null);
  const [biometricData, setBiometricData] = useState({
    strokes: [],
    pressure: [],
    velocity: [],
    acceleration: [],
    totalTime: 0,
    strokeCount: 0
  });

  // Styles et configuration
  const STYLES = {
    canvas: {
      cursor: disabled ? 'not-allowed' : 'crosshair',
      touchAction: 'none',
      userSelect: 'none',
      backgroundColor,
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    },
    container: {
      position: 'relative',
      display: 'inline-block',
      border: '2px solid #ddd',
      borderRadius: '8px',
      overflow: 'hidden'
    }
  };

  const STROKE_COLORS = [
    { value: '#000000', label: 'Noir' },
    { value: '#FF0000', label: 'Rouge' },
    { value: '#0000FF', label: 'Bleu' },
    { value: '#008000', label: 'Vert' },
    { value: '#800080', label: 'Violet' }
  ];

  const STROKE_WIDTHS = [
    { value: 1, label: 'Fin' },
    { value: 2, label: 'Normal' },
    { value: 3, label: 'Épais' },
    { value: 5, label: 'Très épais' }
  ];

  // Initialisation du canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Configuration du contexte
    ctx.strokeStyle = currentSettings.color;
    ctx.lineWidth = currentSettings.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.imageSmoothingEnabled = true;

    // Pré-remplir le canvas avec la couleur de fond
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Configuration tactile
    canvas.style.touchAction = 'none';
    canvas.style.userSelect = 'none';

    // Support des événements de pointeur
    if ('PointerEvent' in window) {
      canvas.addEventListener('pointerdown', startDrawing);
      canvas.addEventListener('pointermove', draw);
      canvas.addEventListener('pointerup', stopDrawing);
      canvas.addEventListener('pointercancel', stopDrawing);
      canvas.addEventListener('pointerleave', stopDrawing);
    } else {
      // Fallback pour navigateurs plus anciens
      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stopDrawing);
      canvas.addEventListener('mouseleave', stopDrawing);
      
      // Touch events
      canvas.addEventListener('touchstart', handleTouchStart);
      canvas.addEventListener('touchmove', handleTouchMove);
      canvas.addEventListener('touchend', handleTouchEnd);
    }
  }, [currentSettings, backgroundColor, disabled]);

  // Gestion des événements de dessin
  const startDrawing = useCallback((e) => {
    if (disabled) return;
    
    e.preventDefault();
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    const strokePoint = {
      x,
      y,
      pressure: e.pressure || (enablePressureSensitivity ? 0.5 : 1),
      timestamp: Date.now(),
      velocity: 0
    };

    const newStroke = {
      points: [strokePoint],
      startTime: Date.now(),
      color: currentSettings.color,
      width: currentSettings.width,
      pressure: strokePoint.pressure
    };

    setCurrentStroke(newStroke);
    setIsDrawing(true);
    
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    // Met à jour les métadonnées biométriques
    setBiometricData(prev => ({
      ...prev,
      strokes: [...prev.strokes, strokePoint],
      pressure: [...prev.pressure, strokePoint.pressure],
      strokeCount: prev.strokeCount + 1
    }));
  }, [disabled, zoom, currentSettings, enablePressureSensitivity]);

  const draw = useCallback((e) => {
    if (!isDrawing || disabled || !currentStroke) return;
    
    e.preventDefault();
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    const lastPoint = currentStroke.points[currentStroke.points.length - 1];
    const currentTime = Date.now();
    const timeDiff = currentTime - lastPoint.timestamp;
    const distance = Math.sqrt(Math.pow(x - lastPoint.x, 2) + Math.pow(y - lastPoint.y, 2));
    const velocity = timeDiff > 0 ? distance / timeDiff : 0;
    
    const strokePoint = {
      x,
      y,
      pressure: e.pressure || (enablePressureSensitivity ? 0.5 : 1),
      timestamp: currentTime,
      velocity: enableVelocityDetection ? velocity : 0,
      distance: distance
    };

    const ctx = canvas.getContext('2d');
    ctx.lineWidth = currentSettings.width * strokePoint.pressure;
    ctx.globalAlpha = strokePoint.pressure;
    ctx.lineTo(x, y);
    ctx.stroke();

    setCurrentStroke(prev => ({
      ...prev,
      points: [...prev.points, strokePoint]
    }));

    // Met à jour les métadonnées
    setBiometricData(prev => ({
      ...prev,
      strokes: [...prev.strokes, strokePoint],
      velocity: [...prev.velocity, strokePoint.velocity],
      totalTime: currentTime - currentStroke.startTime
    }));
  }, [isDrawing, disabled, currentStroke, zoom, currentSettings, enablePressureSensitivity, enableVelocityDetection]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing || !currentStroke) return;
    
    const ctx = canvasRef.current.getContext('2d');
    ctx.globalAlpha = 1;
    
    setStrokeData(prev => [...prev, currentStroke]);
    setCurrentStroke(null);
    setIsDrawing(false);
    setHasSignature(true);
    
    // Notify of signature change
    if (onSignatureChange) {
      const signatureData = getSignatureImageData();
      onSignatureChange({
        data: signatureData,
        metadata: biometricData,
        strokeCount: strokeData.length + 1,
        isComplete: true
      });
    }
  }, [isDrawing, currentStroke, onSignatureChange, strokeData, biometricData]);

  // Gestion tactile (fallback)
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      startDrawing({
        clientX: touch.clientX,
        clientY: touch.clientY,
        pressure: 0.5,
        preventDefault: () => e.preventDefault()
      });
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      draw({
        clientX: touch.clientX,
        clientY: touch.clientY,
        pressure: 0.5,
        preventDefault: () => e.preventDefault()
      });
    }
  };

  const handleTouchEnd = (e) => {
    if (e.changedTouches.length === 1) {
      stopDrawing();
    }
  };

  // Fonctions utilitaires
  const getSignatureImageData = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    return {
      dataURL: canvas.toDataURL('image/png'),
      width: canvas.width,
      height: canvas.height,
      format: 'PNG'
    };
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    setStrokeData([]);
    setCurrentStroke(null);
    setHasSignature(false);
    setBiometricData({
      strokes: [],
      pressure: [],
      velocity: [],
      acceleration: [],
      totalTime: 0,
      strokeCount: 0
    });
    
    if (onSignatureChange) {
      onSignatureChange({
        data: null,
        metadata: null,
        strokeCount: 0,
        isComplete: false
      });
    }
  };

  const undoLastStroke = () => {
    if (strokeData.length === 0) return;
    
    const newStrokeData = strokeData.slice(0, -1);
    setStrokeData(newStrokeData);
    
    // Redessiner la signature
    redrawSignature(newStrokeData);
  };

  const redrawSignature = (strokes) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return;
      
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      
      for (let i = 1; i < stroke.points.length; i++) {
        const point = stroke.points[i];
        ctx.lineTo(point.x, point.y);
      }
      
      ctx.stroke();
    });
    
    setHasSignature(strokes.length > 0);
  };

  const exportSignature = async (format = 'png') => {
    setIsLoading(true);
    
    try {
      const canvas = canvasRef.current;
      const imageData = getSignatureImageData();
      
      if (!imageData) throw new Error('Aucune signature à exporter');
      
      switch (format.toLowerCase()) {
        case 'png':
          downloadDataURL(imageData.dataURL, 'signature.png');
          break;
        
        case 'svg':
          const svgData = generateSVG();
          downloadText(svgData, 'signature.svg');
          break;
        
        case 'json':
          const jsonData = generateJSON();
          downloadText(JSON.stringify(jsonData, null, 2), 'signature.json');
          break;
        
        default:
          throw new Error(`Format non supporté: ${format}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSVG = () => {
    if (strokeData.length === 0) return '<svg></svg>';
    
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    
    strokeData.forEach(stroke => {
      if (stroke.points.length < 2) return;
      
      const pathData = stroke.points.map((point, index) => 
        `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
      ).join(' ');
      
      svg += `<path d="${pathData}" stroke="${stroke.color}" stroke-width="${stroke.width}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    });
    
    svg += '</svg>';
    return svg;
  };

  const generateJSON = () => {
    return {
      signature: {
        strokes: strokeData,
        metadata: biometricData,
        settings: currentSettings,
        dimensions: { width, height },
        created: new Date().toISOString(),
        userId: userId || 'anonymous',
        documentId: documentId,
        documentType: documentType
      },
      biometricData: {
        ...biometricData,
        averagePressure: biometricData.pressure.length > 0 ? 
          biometricData.pressure.reduce((a, b) => a + b, 0) / biometricData.pressure.length : 0,
        averageVelocity: biometricData.velocity.length > 0 ? 
          biometricData.velocity.reduce((a, b) => a + b, 0) / biometricData.velocity.length : 0
      },
      quality: calculateSignatureQuality()
    };
  };

  const calculateSignatureQuality = () => {
    const totalStrokes = strokeData.length;
    const totalTime = biometricData.totalTime;
    const avgPressure = biometricData.pressure.length > 0 ? 
      biometricData.pressure.reduce((a, b) => a + b, 0) / biometricData.pressure.length : 0;
    
    // Score de qualité basé sur plusieurs facteurs
    let quality = 0;
    
    // Utilisation de plusieurs traits
    if (totalStrokes >= 3) quality += 25;
    else if (totalStrokes >= 2) quality += 15;
    else if (totalStrokes >= 1) quality += 5;
    
    // Variabilité de la pression (simulation de signature naturelle)
    if (avgPressure > 0.3 && avgPressure < 1.0) quality += 25;
    
    // Durée de signature réaliste
    if (totalTime > 1000 && totalTime < 10000) quality += 25;
    
    // Complexité du dessin
    const totalPoints = strokeData.reduce((sum, stroke) => sum + stroke.points.length, 0);
    if (totalPoints > 10) quality += 25;
    
    return Math.min(quality, 100);
  };

  const finalizeSignature = async () => {
    if (!hasSignature || !userId) {
      console.warn('Signature incomplète ou utilisateur non défini');
      return null;
    }
    
    setIsLoading(true);
    
    try {
      // Créer les métadonnées de signature
      const signatureMetadata = {
        userId,
        documentId,
        documentType,
        imageData: getSignatureImageData(),
        biometricData,
        quality: calculateSignatureQuality(),
        timestamp: new Date().toISOString(),
        settings: currentSettings
      };

      // Signer les données via le service
      const signatureResult = await eSignatureService.signData(
        signatureMetadata,
        userId,
        {
          documentType,
          documentId
        }
      );

      setSignatureMetadata(signatureResult);
      
      if (onSignatureComplete) {
        onSignatureComplete({
          metadata: signatureMetadata,
          signature: signatureResult,
          quality: calculateSignatureQuality()
        });
      }

      return signatureResult;
    } catch (error) {
      console.error('Erreur lors de la finalisation de la signature:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Fonctions de téléchargement
  const downloadDataURL = (dataURL, filename) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataURL;
    link.click();
  };

  const downloadText = (text, filename) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box ref={containerRef} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Canvas de signature */}
      <Box sx={{ position: 'relative', display: 'inline-block' }}>
        <Box sx={STYLES.container}>
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            style={{
              ...STYLES.canvas,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left'
            }}
          />
          
          {/* Overlay d'aide */}
          {!hasSignature && !disabled && (
            <Box
              ref={overlayRef}
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none',
                color: 'text.secondary'
              }}
            >
              <FingerprintIcon sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Signez ici
              </Typography>
              <Typography variant="body2">
                Utilisez votre doigt, stylet ou souris
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Contrôles de signature */}
      {showControls && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Contrôles de base */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ClearIcon />}
                onClick={clearSignature}
                disabled={disabled}
              >
                Effacer
              </Button>
              
              <Button
                variant="outlined"
                size="small"
                startIcon={<UndoIcon />}
                onClick={undoLastStroke}
                disabled={disabled || strokeData.length === 0}
              >
                Annuler
              </Button>
              
              <Button
                variant="contained"
                size="small"
                startIcon={<SaveIcon />}
                onClick={finalizeSignature}
                disabled={disabled || !hasSignature || isLoading}
              >
                {isLoading ? <CircularProgress size={16} /> : 'Finaliser'}
              </Button>
            </Box>

            <Divider />

            {/* Contrôles de style */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Couleur</InputLabel>
                <Select
                  value={currentSettings.color}
                  label="Couleur"
                  onChange={(e) => setCurrentSettings(prev => ({ ...prev, color: e.target.value }))}
                >
                  {STROKE_COLORS.map(color => (
                    <MenuItem key={color.value} value={color.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 20, height: 20, bgcolor: color.value, borderRadius: '50%' }} />
                        {color.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Épaisseur</InputLabel>
                <Select
                  value={currentSettings.width}
                  label="Épaisseur"
                  onChange={(e) => setCurrentSettings(prev => ({ ...prev, width: e.target.value }))}
                >
                  {STROKE_WIDTHS.map(width => (
                    <MenuItem key={width.value} value={width.value}>
                      {width.label} ({width.value}px)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title="Zoom">
                  <IconButton size="small" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>
                    <ZoomOutIcon />
                  </IconButton>
                </Tooltip>
                <Typography variant="body2" sx={{ minWidth: 50 }}>
                  {Math.round(zoom * 100)}%
                </Typography>
                <Tooltip title="Zoom">
                  <IconButton size="small" onClick={() => setZoom(Math.min(2, zoom + 0.1))}>
                    <ZoomInIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Métadonnées de signature */}
            {hasSignature && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label={`${strokeData.length} trait(s)`} size="small" />
                <Chip label={`${Math.round(biometricData.totalTime / 1000)}s`} size="small" />
                <Chip label={`Qualité: ${calculateSignatureQuality()}%`} 
                      color={calculateSignatureQuality() > 70 ? 'success' : 'warning'} size="small" />
              </Box>
            )}
          </Box>
        </Paper>
      )}

      {/* Export et formats */}
      {hasSignature && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            📤 Exporter la signature
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={() => exportSignature('png')}
              disabled={isLoading}
            >
              PNG
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={() => exportSignature('svg')}
              disabled={isLoading}
            >
              SVG
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={() => exportSignature('json')}
              disabled={isLoading}
            >
              JSON (Métadonnées)
            </Button>
          </Box>
        </Paper>
      )}

      {/* Informations de qualité */}
      {hasSignature && showPreview && (
        <Alert severity="info">
          <Typography variant="body2">
            <strong>Signature capturée avec succès !</strong><br />
            Qualité: {calculateSignatureQuality()}% | 
            Traits: {strokeData.length} | 
            Durée: {Math.round(biometricData.totalTime / 1000)}s
          </Typography>
        </Alert>
      )}

      {/* Signature finalisée */}
      {signatureMetadata && (
        <Alert severity="success">
          <Typography variant="body2">
            <strong>Signature électronique finalisée</strong><br />
            ID: {signatureMetadata.id}<br />
            Timestamp: {new Date(signatureMetadata.timestamp).toLocaleString()}
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default DigitalSignaturePad;