// src/components/qr/QRCodeGenerator.js - Générateur de QR codes pour équipements et accessoires

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
  Tooltip,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  QrCode as QrCodeIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Computer as ComputerIcon,
  DevicesOther as DeviceIcon,
  Link as LinkIcon,
  Security as SecurityIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

// Import de la bibliothèque QRCode (sera ajoutée aux dépendances)
// import QRCode from 'qrcode';

// Types de QR codes
const QR_TYPES = {
  COMPUTER: 'computer',
  ACCESSORY: 'accessory',
  BATCH_COMPUTER: 'batch_computer',
  BATCH_ACCESSORY: 'batch_accessory',
  LOAN: 'loan'
};

// Versions de QR codes
const QR_VERSIONS = {
  V1: { version: 1, description: 'Version de base', maxSize: 'Petits espaces' },
  V2: { version: 2, description: 'Version avec métadonnées', maxSize: 'Moyens espaces' },
  V3: { version: 3, description: 'Version complète', maxSize: 'Grands espaces' },
  V4: { version: 4, description: 'Version haute qualité', maxSize: 'Impression' }
};

const QRCodeGenerator = ({
  computers = [],
  accessories = [],
  onGenerate,
  showExport = true,
  showBatch = true
}) => {
  const canvasRef = useRef(null);
  const [selectedType, setSelectedType] = useState(QR_TYPES.COMPUTER);
  const [selectedVersion, setSelectedVersion] = useState(QR_VERSIONS.V2);
  const [selectedItems, setSelectedItems] = useState([]);
  const [customData, setCustomData] = useState('');
  const [generatedQRCodes, setGeneratedQRCodes] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewQR, setPreviewQR] = useState(null);

  // Options de génération
  const [generationOptions, setGenerationOptions] = useState({
    size: 256,
    margin: 4,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    includeMetadata: true,
    includeValidation: true,
    includeTimestamp: true
  });

  // Génération des données QR selon le type
  const generateQRData = (item, type, version) => {
    const baseData = {
      type,
      version: version.version,
      timestamp: new Date().toISOString(),
      systemId: 'DocuCortex',
      validationHash: ''
    };

    switch (type) {
      case QR_TYPES.COMPUTER:
        return {
          ...baseData,
          itemId: item.id,
          itemType: 'computer',
          name: item.name,
          brand: item.brand,
          model: item.model,
          serial: item.serial,
          status: item.status,
          location: item.location,
          lastUpdate: new Date().toISOString(),
          metadata: {
            processor: item.processor,
            ram: item.ram,
            storage: item.storage,
            os: item.os,
            department: item.department
          }
        };

      case QR_TYPES.ACCESSORY:
        return {
          ...baseData,
          itemId: item.id,
          itemType: 'accessory',
          name: item.name,
          category: item.category,
          serial: item.serial,
          status: item.status,
          location: item.location,
          lastUpdate: new Date().toISOString(),
          metadata: {
            description: item.description,
            compatibility: item.compatibility,
            purchaseDate: item.purchaseDate,
            warranty: item.warranty
          }
        };

      case QR_TYPES.LOAN:
        return {
          ...baseData,
          itemId: item.loanId,
          itemType: 'loan',
          computerId: item.computerId,
          computerName: item.computerName,
          userId: item.userId,
          userName: item.userName,
          loanDate: item.loanDate,
          expectedReturnDate: item.expectedReturnDate,
          accessories: item.accessories || [],
          status: item.status,
          metadata: {
            notes: item.notes,
            department: item.department,
            priority: item.priority
          }
        };

      default:
        return baseData;
    }
  };

  // Génération d'un QR code individuel
  const generateSingleQR = async (item, type, version) => {
    try {
      const qrData = generateQRData(item, type, version);
      
      // Simulation de la génération QR (remplacer par qrcode.toCanvas quand disponible)
      const qrCodeData = {
        ...qrData,
        qrString: JSON.stringify(qrData),
        validation: generateValidationHash(qrData)
      };

      return {
        ...qrCodeData,
        canvas: await generateCanvas(qrCodeData.qrString, generationOptions),
        id: `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
    } catch (error) {
      console.error('Erreur lors de la génération QR:', error);
      throw error;
    }
  };

  // Génération d'un canvas QR (simulation)
  const generateCanvas = async (qrString, options) => {
    // Simulation - en réalité, utiliser QRCode.toCanvas(canvasRef.current, qrString, options)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = options.size;
    canvas.height = options.size;
    
    // Simulation du rendu QR avec motif simplifié
    ctx.fillStyle = options.color.light;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dessiner un motif QR simulé
    ctx.fillStyle = options.color.dark;
    for (let i = 0; i < 25; i++) {
      for (let j = 0; j < 25; j++) {
        if ((i + j) % 3 === 0) {
          ctx.fillRect(i * 10, j * 10, 8, 8);
        }
      }
    }
    
    return canvas;
  };

  // Génération de hash de validation
  const generateValidationHash = (data) => {
    const stringData = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < stringData.length; i++) {
      const char = stringData.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  };

  // Gestion de la sélection d'items
  const handleItemSelection = (itemId, selected) => {
    if (selected) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  // Génération en lot
  const generateBatch = async () => {
    if (selectedItems.length === 0) {
      alert('Veuillez sélectionner au moins un élément');
      return;
    }

    setIsGenerating(true);
    const newQRCodes = [];

    try {
      for (const itemId of selectedItems) {
        const item = selectedType === QR_TYPES.COMPUTER 
          ? computers.find(c => c.id === itemId)
          : accessories.find(a => a.id === itemId);

        if (item) {
          const qrCode = await generateSingleQR(item, selectedType, selectedVersion);
          newQRCodes.push(qrCode);
        }
      }

      setGeneratedQRCodes(prev => [...prev, ...newQRCodes]);
      onGenerate?.(newQRCodes);
    } catch (error) {
      console.error('Erreur lors de la génération en lot:', error);
      alert('Erreur lors de la génération des QR codes');
    } finally {
      setIsGenerating(false);
      setSelectedItems([]);
    }
  };

  // Prévisualisation QR
  const previewQRCode = (qrCode) => {
    setPreviewQR(qrCode);
    setPreviewOpen(true);
  };

  // Export des QR codes
  const exportQRCodes = async (format = 'png') => {
    try {
      // Implémentation de l'export (PNG, PDF, etc.)
      for (const qrCode of generatedQRCodes) {
        const canvas = qrCode.canvas;
        if (canvas) {
          const link = document.createElement('a');
          link.download = `${qrCode.itemType}_${qrCode.itemId}_QR.${format}`;
          link.href = canvas.toDataURL();
          link.click();
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export des QR codes');
    }
  };

  // Impression
  const printQRCodes = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Impression QR Codes</title>
          <style>
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            .qr-item { page-break-inside: avoid; margin: 20px 0; text-align: center; }
            .qr-canvas { border: 1px solid #ccc; margin: 10px auto; display: block; }
            .info { margin: 5px 0; font-size: 12px; }
          </style>
        </head>
        <body>
          ${generatedQRCodes.map(qr => `
            <div class="qr-item">
              <canvas class="qr-canvas" width="200" height="200">
                ${qr.canvas?.toDataURL() || ''}
              </canvas>
              <div class="info"><strong>${qr.name || qr.itemType}</strong></div>
              <div class="info">ID: ${qr.itemId}</div>
              <div class="info">Version QR: ${qr.version}</div>
              <div class="info">Généré: ${new Date(qr.timestamp).toLocaleString()}</div>
            </div>
          `).join('')}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Suppression QR
  const removeQR = (qrId) => {
    setGeneratedQRCodes(prev => prev.filter(qr => qr.id !== qrId));
  };

  // Réinitialisation
  const resetGenerator = () => {
    setGeneratedQRCodes([]);
    setSelectedItems([]);
    setCustomData('');
  };

  // Rendu de la liste d'items
  const renderItemsList = () => {
    const items = selectedType === QR_TYPES.COMPUTER ? computers : accessories;
    
    return (
      <Grid container spacing={2}>
        {items.map(item => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <Card 
              variant={selectedItems.includes(item.id) ? 'outlined' : 'elevation'}
              sx={{ 
                borderColor: selectedItems.includes(item.id) ? 'primary.main' : 'divider',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => handleItemSelection(item.id, !selectedItems.includes(item.id))}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  {selectedType === QR_TYPES.COMPUTER ? 
                    <ComputerIcon color="primary" /> : 
                    <DeviceIcon color="primary" />
                  }
                  <Typography variant="subtitle1" fontWeight="bold">
                    {item.name}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="textSecondary">
                  {selectedType === QR_TYPES.COMPUTER 
                    ? `${item.brand} ${item.model}`
                    : `${item.category} - ${item.description}`
                  }
                </Typography>
                
                <Box sx={{ mt: 1 }}>
                  <Chip 
                    label={item.status} 
                    size="small" 
                    color={item.status === 'available' ? 'success' : 'warning'}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* En-tête */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          <QrCodeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Générateur de QR Codes
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Créez des QR codes pour vos ordinateurs, accessoires et prêts avec métadonnées intégrées
        </Typography>
      </Paper>

      {/* Configuration */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Type de QR Code</InputLabel>
            <Select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              label="Type de QR Code"
            >
              <MenuItem value={QR_TYPES.COMPUTER}>Ordinateurs</MenuItem>
              <MenuItem value={QR_TYPES.ACCESSORY}>Accessoires</MenuItem>
              {showBatch && <MenuItem value={QR_TYPES.LOAN}>Prêts</MenuItem>}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Version QR</InputLabel>
            <Select
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(e.target.value)}
              label="Version QR"
            >
              {Object.entries(QR_VERSIONS).map(([key, version]) => (
                <MenuItem key={key} value={version}>
                  v{version.version} - {version.description}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            label="Taille (px)"
            type="number"
            value={generationOptions.size}
            onChange={(e) => setGenerationOptions(prev => ({
              ...prev,
              size: parseInt(e.target.value) || 256
            }))}
            fullWidth
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Couleur principale</InputLabel>
            <Select
              value={generationOptions.color.dark}
              onChange={(e) => setGenerationOptions(prev => ({
                ...prev,
                color: { ...prev.color, dark: e.target.value }
              }))}
              label="Couleur principale"
            >
              <MenuItem value="#000000">Noir</MenuItem>
              <MenuItem value="#1976d2">Bleu</MenuItem>
              <MenuItem value="#388e3c">Vert</MenuItem>
              <MenuItem value="#f57c00">Orange</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => setBatchDialogOpen(true)}
              fullWidth
            >
              Options Avancées
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Sélection d'items */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Sélection des éléments ({selectedItems.length} sélectionné(s))
          </Typography>
          {showBatch && (
            <Button
              variant="contained"
              onClick={generateBatch}
              disabled={selectedItems.length === 0 || isGenerating}
              startIcon={<QrCodeIcon />}
            >
              {isGenerating ? 'Génération...' : `Générer (${selectedItems.length})`}
            </Button>
          )}
        </Box>

        {isGenerating && <LinearProgress sx={{ mb: 2 }} />}

        {renderItemsList()}
      </Paper>

      {/* QR codes générés */}
      {generatedQRCodes.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              QR Codes Générés ({generatedQRCodes.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {showExport && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => exportQRCodes('png')}
                  >
                    Exporter PNG
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<PrintIcon />}
                    onClick={printQRCodes}
                  >
                    Imprimer
                  </Button>
                </>
              )}
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={resetGenerator}
              >
                Vider
              </Button>
            </Box>
          </Box>

          <Grid container spacing={2}>
            {generatedQRCodes.map(qr => (
              <Grid item xs={12} sm={6} md={3} key={qr.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ textAlign: 'center', mb: 1 }}>
                      <canvas
                        ref={canvasRef}
                        width={150}
                        height={150}
                        style={{
                          maxWidth: '100%',
                          height: 'auto',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                      >
                        {qr.canvas?.toDataURL() || ''}
                      </canvas>
                    </Box>
                    <Typography variant="body2" fontWeight="bold" noWrap>
                      {qr.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {qr.itemType} - {qr.itemId}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Tooltip title="Prévisualiser">
                      <IconButton 
                        size="small"
                        onClick={() => previewQRCode(qr)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Supprimer">
                      <IconButton 
                        size="small"
                        color="error"
                        onClick={() => removeQR(qr.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Dialogue de prévisualisation */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Prévisualisation QR Code</DialogTitle>
        <DialogContent>
          {previewQR && (
            <Box sx={{ textAlign: 'center' }}>
              <canvas
                width={300}
                height={300}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  margin: '20px auto',
                  display: 'block'
                }}
              >
                {previewQR.canvas?.toDataURL() || ''}
              </canvas>
              
              <Typography variant="h6" gutterBottom>
                {previewQR.name}
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemIcon><SecurityIcon fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary="Type" 
                    secondary={previewQR.itemType} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><LinkIcon fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary="ID" 
                    secondary={previewQR.itemId} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Version QR" 
                    secondary={`v${previewQR.version}`} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Généré le" 
                    secondary={new Date(previewQR.timestamp).toLocaleString()} 
                  />
                </ListItem>
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Fermer</Button>
          <Button 
            variant="contained" 
            startIcon={<DownloadIcon />}
            onClick={() => exportQRCodes('png')}
          >
            Télécharger
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QRCodeGenerator;