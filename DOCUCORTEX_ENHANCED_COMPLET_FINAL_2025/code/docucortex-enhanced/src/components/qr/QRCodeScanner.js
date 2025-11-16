// src/components/qr/QRCodeScanner.js - Scanner QR pour équipements et accessoires

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge
} from '@mui/material';
import {
  QrCodeScanner as ScannerIcon,
  CameraAlt as CameraIcon,
  FlashOn as FlashOnIcon,
  FlashOff as FlashOffIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Computer as ComputerIcon,
  DevicesOther as DeviceIcon,
  Assignment as AssignmentIcon,
  Visibility as VisibilityIcon,
  Settings as SettingsIcon,
  PhotoCamera as PhotoIcon,
  CameraRear as RearCameraIcon,
  CameraFront as FrontCameraIcon,
  VolumeUp as SoundIcon,
  VolumeOff as MuteIcon
} from '@mui/icons-material';

// Types de QR supportés
const QR_TYPES = {
  COMPUTER: 'computer',
  ACCESSORY: 'accessory',
  LOAN: 'loan',
  BATCH: 'batch'
};

// États du scanner
const SCANNER_STATES = {
  IDLE: 'idle',
  SCANNING: 'scanning',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  ERROR: 'error'
};

const QRCodeScanner = ({
  onScan,
  onValidation,
  onError,
  allowedTypes = [QR_TYPES.COMPUTER, QR_TYPES.ACCESSORY, QR_TYPES.LOAN],
  showBatchMode = true,
  showHistory = true,
  continuousScan = false,
  cameraSettings = {}
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  
  // États du scanner
  const [scannerState, setScannerState] = useState(SCANNER_STATES.IDLE);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' ou 'environment'
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastResult, setLastResult] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [validationResult, setValidationResult] = useState(null);
  const [scannedItems, setScannedItems] = useState([]);
  const [batchMode, setBatchMode] = useState(false);
  const [autoProcess, setAutoProcess] = useState(false);
  const [scanSettings, setScanSettings] = useState({
    autoFocus: true,
    maxRetries: 3,
    scanInterval: 100,
    confidenceThreshold: 0.8,
    ...cameraSettings
  });

  // Initialisation de la caméra
  const initCamera = useCallback(async () => {
    try {
      setScannerState(SCANNER_STATES.PROCESSING);
      
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          ...scanSettings
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      setIsCameraActive(true);
      setScannerState(SCANNER_STATES.IDLE);
      
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la caméra:', error);
      setScannerState(SCANNER_STATES.ERROR);
      onError?.(error);
    }
  }, [facingMode, scanSettings, onError]);

  // Arrêt de la caméra
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setScannerState(SCANNER_STATES.IDLE);
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  }, []);

  // Basculement de caméra
  const toggleCamera = useCallback(() => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    
    if (isCameraActive) {
      stopCamera();
      setTimeout(() => {
        setFacingMode(newFacingMode);
        initCamera();
      }, 100);
    }
  }, [facingMode, isCameraActive, stopCamera, initCamera]);

  // Toggle flash (si supporté)
  const toggleFlash = useCallback(() => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track && track.getCapabilities) {
        const capabilities = track.getCapabilities();
        if (capabilities.torch) {
          track.applyConstraints({
            advanced: [{ torch: !flashEnabled }]
          });
          setFlashEnabled(!flashEnabled);
        }
      }
    }
  }, [flashEnabled]);

  // Scan d'image (fallback)
  const scanFromImage = useCallback(async (imageFile) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Simulation du scan OCR
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        // Ici, vous utiliseriez @zxing/library ou autre solution de scan
        resolve(imageData);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(imageFile);
    });
  }, []);

  // Validation des données QR
  const validateQRData = useCallback(async (qrData) => {
    try {
      const parsedData = JSON.parse(qrData);
      
      // Vérifications de base
      if (!parsedData.type || !allowedTypes.includes(parsedData.type)) {
        throw new Error(`Type non supporté: ${parsedData.type}`);
      }

      if (!parsedData.itemId || !parsedData.version) {
        throw new Error('Données QR invalides');
      }

      // Vérification du timestamp (pas plus de 1 an)
      const qrTimestamp = new Date(parsedData.timestamp);
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      
      if (qrTimestamp < oneYearAgo) {
        throw new Error('QR Code expiré');
      }

      // Vérification du hash de validation si présent
      if (parsedData.validationHash) {
        const calculatedHash = generateValidationHash(parsedData);
        if (calculatedHash !== parsedData.validationHash) {
          throw new Error('Validation hash invalide');
        }
      }

      return {
        isValid: true,
        data: parsedData,
        warnings: []
      };

    } catch (error) {
      return {
        isValid: false,
        data: null,
        error: error.message
      };
    }
  }, [allowedTypes]);

  // Génération du hash de validation
  const generateValidationHash = (data) => {
    const { validationHash, ...dataToHash } = data;
    const stringData = JSON.stringify(dataToHash);
    let hash = 0;
    for (let i = 0; i < stringData.length; i++) {
      const char = stringData.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  };

  // Traitement du scan
  const processScanResult = useCallback(async (qrString) => {
    setScannerState(SCANNER_STATES.PROCESSING);
    
    try {
      const validation = await validateQRData(qrString);
      
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const result = {
        ...validation.data,
        scanTimestamp: new Date().toISOString(),
        rawQR: qrString,
        isValid: true
      };

      // Ajout à l'historique
      setScanHistory(prev => [result, ...prev.slice(0, 49)]); // Garder les 50 derniers
      
      // En mode batch, ajouter à la liste
      if (batchMode) {
        setScannedItems(prev => {
          const exists = prev.find(item => item.itemId === result.itemId);
          if (exists) return prev;
          return [...prev, result];
        });
      }

      setLastResult(result);
      setValidationResult(validation);
      setScannerState(SCANNER_STATES.SUCCESS);

      // Son de confirmation
      if (soundEnabled) {
        playSuccessSound();
      }

      // Auto-traitement
      if (autoProcess) {
        onScan?.(result);
      }

      onValidation?.(validation);

    } catch (error) {
      console.error('Erreur lors du traitement:', error);
      setScannerState(SCANNER_STATES.ERROR);
      setValidationResult({
        isValid: false,
        error: error.message
      });
      
      if (soundEnabled) {
        playErrorSound();
      }
      
      onError?.(error);
    }
  }, [validateQRData, batchMode, autoProcess, soundEnabled, onScan, onValidation, onError]);

  // Sons de feedback
  const playSuccessSound = () => {
    // Simulation d'un son de succès
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const playErrorSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 200;
    oscillator.type = 'square';
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  // Démarrage du scan continu
  const startScanning = useCallback(() => {
    if (!isCameraActive) return;
    
    setScannerState(SCANNER_STATES.SCANNING);
    
    // Simulation du scan (remplacer par analyse vidéo réelle)
    scanIntervalRef.current = setInterval(async () => {
      try {
        // Ici, vous utiliseriez @zxing/library pour analyser la vidéo
        // Exemple: const result = await reader.decodeFromVideoDevice(deviceId, videoElement);
        
        // Simulation de données QR
        if (Math.random() > 0.95) { // 5% de chance de "trouver" un QR
          const mockQRData = {
            type: QR_TYPES.COMPUTER,
            itemId: `COMP-${Date.now()}`,
            name: `Ordinateur Test`,
            version: 2,
            timestamp: new Date().toISOString()
          };
          
          const qrString = JSON.stringify(mockQRData);
          processScanResult(qrString);
          
          if (!continuousScan && !batchMode) {
            stopScanning();
          }
        }
      } catch (error) {
        console.error('Erreur lors du scan:', error);
      }
    }, scanSettings.scanInterval);
  }, [isCameraActive, continuousScan, batchMode, processScanResult, scanSettings.scanInterval]);

  // Arrêt du scan
  const stopScanning = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setScannerState(SCANNER_STATES.IDLE);
  }, []);

  // Redémarrage
  const restartScanning = useCallback(() => {
    stopScanning();
    setTimeout(() => {
      startScanning();
    }, 500);
  }, [stopScanning, startScanning]);

  // Upload d'image pour scan
  const handleImageUpload = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setScannerState(SCANNER_STATES.PROCESSING);
      const imageData = await scanFromImage(file);
      
      // Simulation du scan depuis image
      const mockQRData = {
        type: QR_TYPES.COMPUTER,
        itemId: `IMG-${Date.now()}`,
        name: `Scan depuis image`,
        version: 2,
        timestamp: new Date().toISOString()
      };
      
      await processScanResult(JSON.stringify(mockQRData));
    } catch (error) {
      console.error('Erreur lors du scan d\'image:', error);
      setScannerState(SCANNER_STATES.ERROR);
    }
  }, [scanFromImage, processScanResult]);

  // Effacer l'historique
  const clearHistory = () => {
    setScanHistory([]);
    setScannedItems([]);
    setLastResult(null);
    setValidationResult(null);
  };

  // Supprimer un item du batch
  const removeBatchItem = (itemId) => {
    setScannedItems(prev => prev.filter(item => item.itemId !== itemId));
  };

  // Traitement du batch complet
  const processBatch = () => {
    onScan?.(scannedItems);
    setScannedItems([]);
  };

  // Effets
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  useEffect(() => {
    if (isCameraActive && scannerState === SCANNER_STATES.SCANNING) {
      startScanning();
    }
  }, [isCameraActive, scannerState, startScanning]);

  // Rendu du guide de scan
  const renderScanGuide = () => {
    return (
      <Box sx={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none'
      }}>
        <Box sx={{
          width: 200,
          height: 200,
          border: '2px solid #fff',
          borderRadius: 2,
          boxShadow: '0 0 0 2000px rgba(0,0,0,0.5)',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -2,
            left: -2,
            right: -2,
            bottom: -2,
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 2
          }
        }}>
          {scannerState === SCANNER_STATES.SCANNING && (
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              bgcolor: 'primary.main',
              animation: 'scanline 2s linear infinite'
            }} />
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* En-tête */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          <ScannerIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Scanner QR Code
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Scannez les QR codes d'ordinateurs, accessoires et prêts
        </Typography>
      </Paper>

      {/* Contrôles principaux */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              color={isCameraActive ? "secondary" : "primary"}
              startIcon={isCameraActive ? <StopIcon /> : <CameraIcon />}
              onClick={isCameraActive ? stopCamera : initCamera}
              disabled={scannerState === SCANNER_STATES.PROCESSING}
            >
              {isCameraActive ? 'Arrêter' : 'Démarrer'} Caméra
            </Button>
          </Grid>

          {isCameraActive && (
            <>
              <Grid item xs={6} sm={3} md={2}>
                <Button
                  fullWidth
                  variant={scannerState === SCANNER_STATES.SCANNING ? "contained" : "outlined"}
                  onClick={scannerState === SCANNER_STATES.SCANNING ? stopScanning : startScanning}
                  disabled={scannerState === SCANNER_STATES.PROCESSING}
                >
                  {scannerState === SCANNER_STATES.SCANNING ? 'Arrêter' : 'Scanner'}
                </Button>
              </Grid>

              <Grid item xs={6} sm={3} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<RearCameraIcon />}
                  onClick={toggleCamera}
                >
                  {facingMode === 'user' ? 'Avant' : 'Arrière'}
                </Button>
              </Grid>
            </>
          )}

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Flash">
                <span>
                  <IconButton
                    onClick={toggleFlash}
                    disabled={!isCameraActive}
                    color={flashEnabled ? "primary" : "default"}
                  >
                    {flashEnabled ? <FlashOnIcon /> : <FlashOffIcon />}
                  </IconButton>
                </span>
              </Tooltip>
              
              <Tooltip title="Son">
                <IconButton
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  color={soundEnabled ? "primary" : "default"}
                >
                  {soundEnabled ? <SoundIcon /> : <MuteIcon />}
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>

        {/* Modes et options */}
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={batchMode}
                  onChange={(e) => setBatchMode(e.target.checked)}
                  disabled={!showBatchMode}
                />
              }
              label="Mode batch"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoProcess}
                  onChange={(e) => setAutoProcess(e.target.checked)}
                />
              }
              label="Auto-traitement"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<PhotoIcon />}
              disabled={!isCameraActive}
            >
              Scan Image
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleImageUpload}
              />
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Zone de scan */}
      {isCameraActive && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ position: 'relative', display: 'inline-block', width: '100%' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                maxWidth: 500,
                height: 'auto',
                borderRadius: 8,
                backgroundColor: '#000'
              }}
            />
            {renderScanGuide()}
          </Box>
          
          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
          />
        </Paper>
      )}

      {/* État du scanner */}
      {(scannerState !== SCANNER_STATES.IDLE || lastResult) && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            État du Scanner
          </Typography>
          
          {scannerState === SCANNER_STATES.PROCESSING && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <LinearProgress sx={{ flex: 1 }} />
              <Typography>Traitement en cours...</Typography>
            </Box>
          )}

          {scannerState === SCANNER_STATES.SUCCESS && validationResult && (
            <Alert severity="success" icon={<CheckIcon />}>
              <Typography variant="body2">
                ✅ QR Code validé et analysé avec succès
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Type: {validationResult.data.type} | ID: {validationResult.data.itemId}
              </Typography>
            </Alert>
          )}

          {scannerState === SCANNER_STATES.ERROR && validationResult && (
            <Alert severity="error" icon={<ErrorIcon />}>
              <Typography variant="body2">
                ❌ Erreur de validation
              </Typography>
              <Typography variant="caption">
                {validationResult.error}
              </Typography>
            </Alert>
          )}
        </Paper>
      )}

      {/* Résultat détaillé */}
      {lastResult && validationResult?.isValid && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            📱 Détails du Scan
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    {lastResult.itemType === 'computer' ? 
                      <ComputerIcon color="primary" /> : 
                      <DeviceIcon color="primary" />
                    }
                    <Typography variant="h6">{lastResult.name}</Typography>
                  </Box>
                  
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Type" 
                        secondary={lastResult.itemType} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="ID" 
                        secondary={lastResult.itemId} 
                      />
                    </ListItem>
                    {lastResult.brand && (
                      <ListItem>
                        <ListItemText 
                          primary="Marque" 
                          secondary={lastResult.brand} 
                        />
                      </ListItem>
                    )}
                    {lastResult.model && (
                      <ListItem>
                        <ListItemText 
                          primary="Modèle" 
                          secondary={lastResult.model} 
                        />
                      </ListItem>
                    )}
                    <ListItem>
                      <ListItemText 
                        primary="Statut" 
                        secondary={
                          <Chip 
                            label={lastResult.status} 
                            size="small" 
                            color={lastResult.status === 'available' ? 'success' : 'warning'}
                          />
                        } 
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    🕒 Informations techniques
                  </Typography>
                  
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Version QR" 
                        secondary={`v${lastResult.version}`} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Scanné le" 
                        secondary={new Date(lastResult.scanTimestamp).toLocaleString()} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Validé" 
                        secondary={
                          <Chip 
                            label="✓ Valide" 
                            size="small" 
                            color="success"
                            icon={<CheckIcon />}
                          />
                        } 
                      />
                    </ListItem>
                  </List>
                  
                  {!autoProcess && (
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<AssignmentIcon />}
                        onClick={() => onScan?.(lastResult)}
                      >
                        Utiliser cet élément
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Mode batch - Liste des éléments scannés */}
      {batchMode && scannedItems.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              <Badge badgeContent={scannedItems.length} color="primary">
                Liste de scan
              </Badge>
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                onClick={clearHistory}
              >
                Vider
              </Button>
              <Button
                variant="contained"
                onClick={processBatch}
                disabled={scannedItems.length === 0}
              >
                Traiter tout ({scannedItems.length})
              </Button>
            </Box>
          </Box>

          <Grid container spacing={1}>
            {scannedItems.map(item => (
              <Grid item xs={12} sm={6} md={4} key={item.itemId}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="body2" fontWeight="bold" noWrap>
                        {item.name}
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => removeBatchItem(item.itemId)}
                      >
                        <ErrorIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography variant="caption" color="textSecondary">
                      {item.itemType} - {item.itemId}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Historique des scans */}
      {showHistory && scanHistory.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Historique des scans ({scanHistory.length})
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={clearHistory}
            >
              Effacer tout
            </Button>
          </Box>

          <List>
            {scanHistory.slice(0, 10).map((item, index) => (
              <ListItem key={`${item.itemId}-${item.scanTimestamp}`}>
                <ListItemIcon>
                  {item.isValid ? (
                    <CheckIcon color="success" />
                  ) : (
                    <ErrorIcon color="error" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={item.name}
                  secondary={`${item.itemType} - ${item.itemId} • ${new Date(item.scanTimestamp).toLocaleTimeString()}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default QRCodeScanner;