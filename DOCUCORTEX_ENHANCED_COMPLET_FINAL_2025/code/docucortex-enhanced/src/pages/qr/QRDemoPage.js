// src/pages/qr/QRDemoPage.js - Page de démonstration du système QR

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Alert,
  Paper,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  QrCode as QRCodeIcon,
  QrCodeScanner as ScannerIcon,
  Dashboard as DashboardIcon,
  Devices as DevicesIcon,
  Assignment as AssignmentIcon,
  Analytics as AnalyticsIcon,
  Download as DownloadIcon,
  Launch as LaunchIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Code as CodeIcon,
  Book as BookIcon
} from '@mui/icons-material';

// Import des composants QR
import { QRCodeSystem } from '../../components/qr';

// Données de démonstration
const DEMO_COMPUTERS = [
  {
    id: 'comp-001',
    name: 'Dell Latitude 7420',
    brand: 'Dell',
    model: 'Latitude 7420',
    serial: 'DL7420-001',
    status: 'available',
    location: 'Bureau A-101',
    processor: 'Intel i7-1165G7',
    ram: '16GB',
    storage: '512GB SSD',
    os: 'Windows 11 Pro'
  },
  {
    id: 'comp-002',
    name: 'MacBook Pro 16"',
    brand: 'Apple',
    model: 'MacBook Pro 16"',
    serial: 'MBP16-002',
    status: 'available',
    location: 'Bureau B-205',
    processor: 'Apple M2 Pro',
    ram: '32GB',
    storage: '1TB SSD',
    os: 'macOS Ventura'
  },
  {
    id: 'comp-003',
    name: 'Lenovo ThinkPad X1',
    brand: 'Lenovo',
    model: 'ThinkPad X1 Carbon',
    serial: 'TPX1-003',
    status: 'loaned',
    location: 'Utilisateur',
    processor: 'Intel i7-1260P',
    ram: '16GB',
    storage: '512GB SSD',
    os: 'Windows 11 Pro'
  }
];

const DEMO_ACCESSORIES = [
  {
    id: 'acc-001',
    name: 'Souris Logitech MX Master 3',
    category: 'Input',
    serial: 'LGMX3-001',
    status: 'available',
    location: 'Stock Accessoires',
    description: 'Souris ergonomique sans fil',
    icon: 'mouse'
  },
  {
    id: 'acc-002',
    name: 'Clavier mécanique',
    category: 'Input',
    serial: 'KBMECH-002',
    status: 'available',
    location: 'Stock Accessoires',
    description: 'Clavier AZERTY mécanique rétro-éclairé',
    icon: 'keyboard'
  },
  {
    id: 'acc-003',
    name: 'Chargeur Dell 65W',
    category: 'Power',
    serial: 'DELL65W-003',
    status: 'available',
    location: 'Stock Accessoires',
    description: 'Chargeur secteur USB-C',
    icon: 'charger'
  }
];

const DEMO_LOANS = [
  {
    id: 'loan-001',
    computerId: 'comp-003',
    computerName: 'Lenovo ThinkPad X1',
    userId: 'user-john',
    userName: 'john.doe',
    loanDate: '2024-01-15T10:00:00Z',
    expectedReturnDate: '2024-02-15T17:00:00Z',
    accessories: ['acc-001', 'acc-003'],
    status: 'active',
    notes: 'Projet Alpha en cours'
  }
];

const QRDemoPage = () => {
  const [currentView, setCurrentView] = useState('overview');
  const [demoData, setDemoData] = useState({
    computers: DEMO_COMPUTERS,
    accessories: DEMO_ACCESSORIES,
    loans: DEMO_LOANS
  });
  const [scanResults, setScanResults] = useState([]);
  const [generatedQRCodes, setGeneratedQRCodes] = useState([]);

  // Gestion des scans QR
  const handleQRScan = (scanData) => {
    console.log('QR Code scanné:', scanData);
    setScanResults(prev => [
      {
        timestamp: new Date().toISOString(),
        data: scanData,
        success: true
      },
      ...prev.slice(0, 9) // Garder les 10 derniers
    ]);
  };

  // Gestion de la génération QR
  const handleQRGenerate = (qrCodes) => {
    console.log('QR Codes générés:', qrCodes);
    setGeneratedQRCodes(prev => [...qrCodes, ...prev]);
  };

  // Gestion des erreurs
  const handleAlert = (alert) => {
    console.log('Alerte:', alert);
    // Ici on pourrait afficher une notification toast
  };

  // Fonction de démonstration - générateur automatique
  const generateDemoQRCodes = () => {
    const qrCodes = [];
    
    demoData.computers.forEach(computer => {
      qrCodes.push({
        id: `qr-comp-${computer.id}`,
        type: 'computer',
        itemId: computer.id,
        name: computer.name,
        brand: computer.brand,
        model: computer.model,
        serial: computer.serial,
        status: computer.status,
        version: 2,
        timestamp: new Date().toISOString()
      });
    });

    demoData.accessories.forEach(accessory => {
      qrCodes.push({
        id: `qr-acc-${accessory.id}`,
        type: 'accessory',
        itemId: accessory.id,
        name: accessory.name,
        category: accessory.category,
        serial: accessory.serial,
        status: accessory.status,
        version: 2,
        timestamp: new Date().toISOString()
      });
    });

    setGeneratedQRCodes(qrCodes);
  };

  // Fonction de démonstration - simuler des scans
  const simulateRandomScans = () => {
    const allItems = [...demoData.computers, ...demoData.accessories];
    const randomItem = allItems[Math.floor(Math.random() * allItems.length)];
    
    const scanData = {
      qrId: `qr-${randomItem.id}`,
      itemId: randomItem.id,
      itemType: randomItem.processor ? 'computer' : 'accessory',
      name: randomItem.name,
      type: randomItem.processor ? 'computer' : 'accessory',
      version: 2,
      timestamp: new Date().toISOString(),
      status: randomItem.status
    };

    handleQRScan(scanData);
  };

  // Statistiques de démonstration
  const stats = {
    totalItems: demoData.computers.length + demoData.accessories.length,
    availableItems: demoData.computers.filter(c => c.status === 'available').length + 
                    demoData.accessories.filter(a => a.status === 'available').length,
    totalLoans: demoData.loans.length,
    activeLoans: demoData.loans.filter(l => l.status === 'active').length,
    generatedQRCodes: generatedQRCodes.length,
    totalScans: scanResults.length
  };

  // Rendu de l'aperçu
  const renderOverview = () => (
    <Box>
      {/* Statistiques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <DevicesIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{stats.totalItems}</Typography>
              <Typography variant="body2" color="textSecondary">
                Éléments total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{stats.availableItems}</Typography>
              <Typography variant="body2" color="textSecondary">
                Disponibles
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AssignmentIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{stats.totalLoans}</Typography>
              <Typography variant="body2" color="textSecondary">
                Prêts total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <QRCodeIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{stats.generatedQRCodes}</Typography>
              <Typography variant="body2" color="textSecondary">
                QR générés
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ScannerIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{stats.totalScans}</Typography>
              <Typography variant="body2" color="textSecondary">
                Scans effectués
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AnalyticsIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{stats.activeLoans}</Typography>
              <Typography variant="body2" color="textSecondary">
                Prêts actifs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actions rapides */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🚀 Actions de démonstration
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<QRCodeIcon />}
              onClick={generateDemoQRCodes}
              sx={{ py: 1.5 }}
            >
              Générer QR demo
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ScannerIcon />}
              onClick={simulateRandomScans}
              sx={{ py: 1.5 }}
            >
              Simuler scan
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<LaunchIcon />}
              onClick={() => setCurrentView('system')}
              sx={{ py: 1.5 }}
            >
              Ouvrir système
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<DownloadIcon />}
              sx={{ py: 1.5 }}
              disabled
            >
              Export demo
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Données de démonstration */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              💻 Ordinateurs de démonstration
            </Typography>
            <List dense>
              {demoData.computers.map(computer => (
                <ListItem key={computer.id}>
                  <ListItemIcon>
                    <DevicesIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={computer.name}
                    secondary={`${computer.brand} ${computer.model} • ${computer.status}`}
                  />
                  <Chip 
                    label={computer.status} 
                    size="small" 
                    color={computer.status === 'available' ? 'success' : 'warning'}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              📦 Accessoires de démonstration
            </Typography>
            <List dense>
              {demoData.accessories.map(accessory => (
                <ListItem key={accessory.id}>
                  <ListItemIcon>
                    <AssignmentIcon color="secondary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={accessory.name}
                    secondary={`${accessory.category} • ${accessory.status}`}
                  />
                  <Chip 
                    label={accessory.status} 
                    size="small" 
                    color={accessory.status === 'available' ? 'success' : 'warning'}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Résultats récents */}
      {scanResults.length > 0 && (
        <Paper sx={{ p: 2, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            📊 Derniers scans ({scanResults.length})
          </Typography>
          <List dense>
            {scanResults.slice(0, 5).map((result, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <CheckIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary={`Scan de ${result.data.name} (${result.data.itemType})`}
                  secondary={new Date(result.timestamp).toLocaleString()}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* En-tête */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              <QRCodeIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
              Système QR Codes - Démonstration
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Découvrez toutes les fonctionnalités du système de traçabilité QR codes pour ordinateurs et accessoires
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant={currentView === 'overview' ? 'contained' : 'outlined'}
              onClick={() => setCurrentView('overview')}
            >
              Vue d'ensemble
            </Button>
            <Button
              variant={currentView === 'system' ? 'contained' : 'outlined'}
              onClick={() => setCurrentView('system')}
              startIcon={<LaunchIcon />}
            >
              Système complet
            </Button>
          </Box>
        </Box>

        {/* Navigation par onglets */}
        <Divider />
        <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
          <Chip 
            label="Génération QR" 
            icon={<QRCodeIcon />} 
            color={currentView === 'overview' ? 'primary' : 'default'}
            variant="outlined"
          />
          <Chip 
            label="Scanner" 
            icon={<ScannerIcon />} 
            color="default"
            variant="outlined"
          />
          <Chip 
            label="Gestionnaire" 
            icon={<DashboardIcon />} 
            color="default"
            variant="outlined"
          />
          <Chip 
            label="Analytics" 
            icon={<AnalyticsIcon />} 
            color="default"
            variant="outlined"
          />
        </Box>
      </Paper>

      {/* Contenu selon la vue */}
      {currentView === 'overview' ? renderOverview() : (
        <Paper sx={{ height: '80vh' }}>
          <QRCodeSystem
            computers={demoData.computers}
            accessories={demoData.accessories}
            loans={demoData.loans}
            onQRScan={handleQRScan}
            onQRGenerate={handleQRGenerate}
            onAlert={handleAlert}
          />
        </Paper>
      )}

      {/* Informations techniques */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          <CodeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Informations techniques
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Fonctionnalités implémentées:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                <ListItemText primary="Générateur QR codes avec métadonnées" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                <ListItemText primary="Scanner caméra avec validation" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                <ListItemText primary="Gestionnaire avec base IndexedDB" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                <ListItemText primary="Historique et analytics" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                <ListItemText primary="Alertes automatiques" />
              </ListItem>
            </List>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Technologies utilisées:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><InfoIcon color="info" fontSize="small" /></ListItemIcon>
                <ListItemText primary="qrcode.js pour la génération" />
              </ListItem>
              <ListItem>
                <ListItemIcon><InfoIcon color="info" fontSize="small" /></ListItemIcon>
                <ListItemText primary="@zxing/library pour le scan caméra" />
              </ListItem>
              <ListItem>
                <ListItemIcon><InfoIcon color="info" fontSize="small" /></ListItemIcon>
                <ListItemText primary="IndexedDB pour le stockage local" />
              </ListItem>
              <ListItem>
                <ListItemIcon><InfoIcon color="info" fontSize="small" /></ListItemIcon>
                <ListItemText primary="Material-UI pour l'interface" />
              </ListItem>
              <ListItem>
                <ListItemIcon><InfoIcon color="info" fontSize="small" /></ListItemIcon>
                <ListItemText primary="Géolocalisation HTML5" />
              </ListItem>
            </List>
          </Grid>
        </Grid>
        
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Note:</strong> Cette démonstration utilise des données simulées. 
            Pour une utilisation en production, intégrez avec votre base de données réelle 
            et configurez les permissions caméra appropriées.
          </Typography>
        </Alert>
      </Paper>
    </Container>
  );
};

export default QRDemoPage;