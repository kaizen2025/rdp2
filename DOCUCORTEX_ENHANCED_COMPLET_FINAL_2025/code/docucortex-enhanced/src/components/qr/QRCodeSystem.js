// src/components/qr/QRCodeSystem.js - Système principal QR codes

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
  Container,
  Fab,
  Snackbar,
  Alert,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  QrCode as QRCodeIcon,
  QrCodeScanner as ScannerIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Help as HelpIcon,
  Info as InfoIcon
} from '@mui/icons-material';

// Import des composants QR
import QRCodeGenerator from './QRCodeGenerator';
import QRCodeScanner from './QRCodeScanner';
import QRCodeManager from './QRCodeManager';

// Types d'onglets
const TABS = {
  GENERATOR: 0,
  SCANNER: 1,
  MANAGER: 2
};

const QRCodeSystem = ({
  computers = [],
  accessories = [],
  loans = [],
  onQRScan,
  onQRGenerate,
  onQRValidation,
  onAlert,
  isDrawer = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(TABS.GENERATOR);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showHelp, setShowHelp] = useState(false);

  // Gestion des notifications
  const showNotification = (message, severity = 'info', duration = 4000) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, severity }]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  };

  // Gestion des scans
  const handleScan = (scanData) => {
    showNotification(`QR Code scanné: ${scanData.name}`, 'success');
    onQRScan?.(scanData);
    onQRValidation?.(scanData);
  };

  // Gestion des erreurs
  const handleScanError = (error) => {
    showNotification(`Erreur de scan: ${error.message}`, 'error');
    onAlert?.(error);
  };

  // Gestion de la génération
  const handleGenerate = (qrCodes) => {
    showNotification(`${qrCodes.length} QR Code(s) généré(s)`, 'success');
    onQRGenerate?.(qrCodes);
  };

  // Configuration des onglets
  const getTabs = () => [
    {
      label: 'Générateur',
      icon: <QRCodeIcon />,
      component: (
        <QRCodeGenerator
          computers={computers}
          accessories={accessories}
          onGenerate={handleGenerate}
          showExport={true}
          showBatch={true}
        />
      )
    },
    {
      label: 'Scanner',
      icon: <ScannerIcon />,
      component: (
        <QRCodeScanner
          onScan={handleScan}
          onError={handleScanError}
          onValidation={onQRValidation}
          allowedTypes={['computer', 'accessory', 'loan']}
          showBatchMode={true}
          showHistory={true}
          continuousScan={false}
          cameraSettings={{
            autoFocus: true,
            maxRetries: 3,
            scanInterval: 500,
            confidenceThreshold: 0.8
          }}
        />
      )
    },
    {
      label: 'Gestionnaire',
      icon: <DashboardIcon />,
      component: (
        <QRCodeManager
          onQRUpdate={onQRGenerate}
          onScan={handleScan}
          onAlert={(alert) => {
            showNotification(alert.message || alert, alert.severity || 'info');
            onAlert?.(alert);
          }}
        />
      )
    }
  ];

  const tabs = getTabs();

  // Rendu du contenu principal
  const renderMainContent = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Onglets - Desktop */}
      {!isMobile && (
        <AppBar position="static" color="default" elevation={1}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                icon={tab.icon}
                label={tab.label}
                iconPosition="start"
                sx={{ minHeight: 64 }}
              />
            ))}
          </Tabs>
        </AppBar>
      )}

      {/* Contenu */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {tabs[activeTab].component}
      </Box>
    </Box>
  );

  // Rendu mobile avec drawer
  if (isMobile && isDrawer) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Barre d'outils mobile */}
        <AppBar position="static" color="primary">
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Système QR Codes
            </Typography>
            
            <IconButton
              color="inherit"
              onClick={() => setShowHelp(true)}
            >
              <HelpIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Drawer de navigation */}
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          PaperProps={{
            sx: { width: 250 }
          }}
        >
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                QR Codes
              </Typography>
              <IconButton onClick={() => setDrawerOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
            
            <List>
              {tabs.map((tab, index) => (
                <ListItem
                  button
                  key={index}
                  selected={activeTab === index}
                  onClick={() => {
                    setActiveTab(index);
                    setDrawerOpen(false);
                  }}
                >
                  <ListItemIcon>{tab.icon}</ListItemIcon>
                  <ListItemText primary={tab.label} />
                </ListItem>
              ))}
            </List>
            
            <Box sx={{ mt: 3 }}>
              <Alert severity="info" icon={<InfoIcon />}>
                <Typography variant="body2">
                  Système de traçabilité complet pour ordinateurs et accessoires
                </Typography>
              </Alert>
            </Box>
          </Box>
        </Drawer>

        {/* Contenu principal */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {tabs[activeTab].component}
        </Box>

        {/* FAB pour changer d'onglet rapidement */}
        <Fab
          color="primary"
          aria-label="change tab"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => {
            const nextTab = (activeTab + 1) % tabs.length;
            setActiveTab(nextTab);
          }}
        >
          {tabs[(activeTab + 1) % tabs.length].icon}
        </Fab>
      </Box>

      {/* Notifications */}
      {notifications.map(notification => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={4000}
          onClose={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            severity={notification.severity}
            onClose={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </Box>
  );

  // Rendu desktop
  return (
    <Container maxWidth="xl" sx={{ py: 2, height: '100vh' }}>
      <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* En-tête desktop */}
        {!isMobile && (
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h5" gutterBottom>
              <QRCodeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Système de Gestion QR Codes
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Traçabilité complète des ordinateurs et accessoires par QR codes
            </Typography>
          </Box>
        )}

        {renderMainContent()}
      </Paper>

      {/* Notifications */}
      {notifications.map(notification => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={4000}
          onClose={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            severity={notification.severity}
            onClose={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}

      {/* Aide modal (mobile) */}
      <Drawer
        anchor="bottom"
        open={showHelp}
        onClose={() => setShowHelp(false)}
        PaperProps={{
          sx: { height: 'auto', maxHeight: '80vh' }
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Aide - Système QR Codes
            </Typography>
            <IconButton onClick={() => setShowHelp(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Typography variant="h6" gutterBottom>
            Fonctionnalités disponibles :
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                📱 Générateur QR Codes
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Générez des QR codes pour ordinateurs et accessoires<br/>
                • Templates avec métadonnées intégrées<br/>
                • Export en PNG ou impression<br/>
                • Versions multiples (v1 à v4)
              </Typography>
            </Paper>
            
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                📷 Scanner QR Codes
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Scan par caméra en temps réel<br/>
                • Support caméra avant/arrière<br/>
                • Validation automatique des données<br/>
                • Mode batch pour scans multiples<br/>
                • Historique des scans
              </Typography>
            </Paper>
            
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                ⚙️ Gestionnaire QR
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Base de données IndexedDB locale<br/>
                • Historique complet des scans<br/>
                • Alertes automatiques<br/>
                • Analytics et statistiques<br/>
                • Export/import des données
              </Typography>
            </Paper>
          </Box>
        </Box>
      </Drawer>
    </Container>
  );
};

export default QRCodeSystem;