// src/components/qr/QRCodeManager.js - Gestionnaire de QR codes complet

import React, { useState, useEffect, useCallback } from 'react';
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
  ListItemIcon,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Avatar,
  Switch,
  FormControlLabel,
  Stack
} from '@mui/material';
import {
  QrCode as QRCodeIcon,
  History as HistoryIcon,
  Computer as ComputerIcon,
  DevicesOther as DeviceIcon,
  Assignment as AssignmentIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Analytics as AnalyticsIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Backup as BackupIcon,
  RestoreFromTrash as RestoreIcon
} from '@mui/icons-material';

// Types de données
const QR_DATA_TYPES = {
  COMPUTER: 'computer',
  ACCESSORY: 'accessory',
  LOAN: 'loan',
  BATCH: 'batch'
};

const QR_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  LOST: 'lost',
  DAMAGED: 'damaged',
  ARCHIVED: 'archived'
};

const SCAN_ACTIONS = {
  SCAN: 'scan',
  VALIDATE: 'validate',
  CHECKOUT: 'checkout',
  CHECKIN: 'checkin',
  UPDATE: 'update'
};

// Hook IndexedDB pour stockage local
const useQRDatabase = () => {
  const [db, setDb] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initDB = async () => {
      try {
        const request = indexedDB.open('DocuCortexQRDB', 1);
        
        request.onerror = () => {
          console.error('Erreur lors de l\'ouverture de la base de données');
        };

        request.onsuccess = () => {
          setDb(request.result);
          setIsInitialized(true);
        };

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          
          // Store pour les QR codes
          if (!db.objectStoreNames.contains('qrcodes')) {
            const qrStore = db.createObjectStore('qrcodes', { keyPath: 'id' });
            qrStore.createIndex('itemId', 'itemId', { unique: false });
            qrStore.createIndex('type', 'type', { unique: false });
            qrStore.createIndex('status', 'status', { unique: false });
            qrStore.createIndex('createdAt', 'createdAt', { unique: false });
          }
          
          // Store pour l'historique des scans
          if (!db.objectStoreNames.contains('scanHistory')) {
            const historyStore = db.createObjectStore('scanHistory', { keyPath: 'id' });
            historyStore.createIndex('qrId', 'qrId', { unique: false });
            historyStore.createIndex('action', 'action', { unique: false });
            historyStore.createIndex('timestamp', 'timestamp', { unique: false });
            historyStore.createIndex('userId', 'userId', { unique: false });
          }
          
          // Store pour les associations prêt-QR
          if (!db.objectStoreNames.contains('loanAssociations')) {
            const loanStore = db.createObjectStore('loanAssociations', { keyPath: 'id' });
            loanStore.createIndex('loanId', 'loanId', { unique: false });
            loanStore.createIndex('qrId', 'qrId', { unique: false });
          }
          
          // Store pour les alertes
          if (!db.objectStoreNames.contains('alerts')) {
            const alertStore = db.createObjectStore('alerts', { keyPath: 'id' });
            alertStore.createIndex('type', 'type', { unique: false });
            alertStore.createIndex('priority', 'priority', { unique: false });
            alertStore.createIndex('resolved', 'resolved', { unique: false });
          }
        };
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de la base de données:', error);
      }
    };

    initDB();
  }, []);

  // Ajouter QR code
  const addQRCode = useCallback((qrData) => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error('Base de données non initialisée'));
        return;
      }

      const transaction = db.transaction(['qrcodes'], 'readwrite');
      const store = transaction.objectStore('qrcodes');
      
      const qrRecord = {
        id: qrData.id || `qr_${Date.now()}`,
        ...qrData,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: qrData.version || 1
      };

      const request = store.add(qrRecord);
      
      request.onsuccess = () => resolve(qrRecord);
      request.onerror = () => reject(request.error);
    });
  }, [db]);

  // Obtenir QR code par ID
  const getQRCode = useCallback((id) => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error('Base de données non initialisée'));
        return;
      }

      const transaction = db.transaction(['qrcodes'], 'readonly');
      const store = transaction.objectStore('qrcodes');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }, [db]);

  // Obtenir tous les QR codes
  const getAllQRCodes = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error('Base de données non initialisée'));
        return;
      }

      const transaction = db.transaction(['qrcodes'], 'readonly');
      const store = transaction.objectStore('qrcodes');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }, [db]);

  // Mettre à jour QR code
  const updateQRCode = useCallback((id, updates) => {
    return new Promise(async (resolve, reject) => {
      try {
        const qrCode = await getQRCode(id);
        if (!qrCode) {
          reject(new Error('QR code non trouvé'));
          return;
        }

        const updatedQR = {
          ...qrCode,
          ...updates,
          lastModified: new Date().toISOString()
        };

        const transaction = db.transaction(['qrcodes'], 'readwrite');
        const store = transaction.objectStore('qrcodes');
        const request = store.put(updatedQR);

        request.onsuccess = () => resolve(updatedQR);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }, [db, getQRCode]);

  // Supprimer QR code
  const deleteQRCode = useCallback((id) => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error('Base de données non initialisée'));
        return;
      }

      const transaction = db.transaction(['qrcodes'], 'readwrite');
      const store = transaction.objectStore('qrcodes');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }, [db]);

  // Ajouter entrée à l'historique
  const addScanHistory = useCallback((historyData) => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error('Base de données non initialisée'));
        return;
      }

      const transaction = db.transaction(['scanHistory'], 'readwrite');
      const store = transaction.objectStore('scanHistory');
      
      const historyRecord = {
        id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...historyData,
        timestamp: new Date().toISOString()
      };

      const request = store.add(historyRecord);
      
      request.onsuccess = () => resolve(historyRecord);
      request.onerror = () => reject(request.error);
    });
  }, [db]);

  // Obtenir l'historique
  const getScanHistory = useCallback((filters = {}) => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error('Base de données non initialisée'));
        return;
      }

      const transaction = db.transaction(['scanHistory'], 'readonly');
      const store = transaction.objectStore('scanHistory');
      
      let request;
      if (filters.qrId) {
        const index = store.index('qrId');
        request = index.getAll(filters.qrId);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        let results = request.result;
        
        // Appliquer filtres supplémentaires
        if (filters.action) {
          results = results.filter(item => item.action === filters.action);
        }
        if (filters.userId) {
          results = results.filter(item => item.userId === filters.userId);
        }
        if (filters.startDate) {
          results = results.filter(item => new Date(item.timestamp) >= new Date(filters.startDate));
        }
        if (filters.endDate) {
          results = results.filter(item => new Date(item.timestamp) <= new Date(filters.endDate));
        }
        
        // Trier par timestamp décroissant
        results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }, [db]);

  // Associer QR à un prêt
  const associateLoanQR = useCallback((loanId, qrIds) => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error('Base de données non initialisée'));
        return;
      }

      const transaction = db.transaction(['loanAssociations'], 'readwrite');
      const store = transaction.objectStore('loanAssociations');
      
      const associations = qrIds.map(qrId => ({
        id: `assoc_${loanId}_${qrId}`,
        loanId,
        qrId,
        createdAt: new Date().toISOString()
      }));

      let completed = 0;
      const total = associations.length;
      
      associations.forEach(assoc => {
        const request = store.add(assoc);
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve(associations);
          }
        };
        request.onerror = () => reject(request.error);
      });
    });
  }, [db]);

  // Obtenir les associations de prêt
  const getLoanAssociations = useCallback((loanId) => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error('Base de données non initialisée'));
        return;
      }

      const transaction = db.transaction(['loanAssociations'], 'readonly');
      const store = transaction.objectStore('loanAssociations');
      const index = store.index('loanId');
      const request = index.getAll(loanId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }, [db]);

  // Ajouter alerte
  const addAlert = useCallback((alertData) => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error('Base de données non initialisée'));
        return;
      }

      const transaction = db.transaction(['alerts'], 'readwrite');
      const store = transaction.objectStore('alerts');
      
      const alert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...alertData,
        timestamp: new Date().toISOString(),
        resolved: false
      };

      const request = store.add(alert);
      
      request.onsuccess = () => resolve(alert);
      request.onerror = () => reject(request.error);
    });
  }, [db]);

  // Obtenir les alertes
  const getAlerts = useCallback((unresolvedOnly = false) => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error('Base de données non initialisée'));
        return;
      }

      const transaction = db.transaction(['alerts'], 'readonly');
      const store = transaction.objectStore('alerts');
      const request = store.getAll();

      request.onsuccess = () => {
        let results = request.result;
        if (unresolvedOnly) {
          results = results.filter(alert => !alert.resolved);
        }
        results.sort((a, b) => {
          if (a.priority !== b.priority) {
            return b.priority - a.priority; // Priorité haute en premier
          }
          return new Date(b.timestamp) - new Date(a.timestamp);
        });
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }, [db]);

  // Résoudre alerte
  const resolveAlert = useCallback((alertId) => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error('Base de données non initialisée'));
        return;
      }

      const transaction = db.transaction(['alerts'], 'readwrite');
      const store = transaction.objectStore('alerts');
      const getRequest = store.get(alertId);

      getRequest.onsuccess = () => {
        const alert = getRequest.result;
        if (!alert) {
          reject(new Error('Alerte non trouvée'));
          return;
        }

        alert.resolved = true;
        alert.resolvedAt = new Date().toISOString();
        
        const updateRequest = store.put(alert);
        updateRequest.onsuccess = () => resolve(alert);
        updateRequest.onerror = () => reject(updateRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }, [db]);

  // Sauvegarder la base de données
  const exportData = useCallback(() => {
    return new Promise(async (resolve, reject) => {
      try {
        const qrcodes = await getAllQRCodes();
        const scanHistory = await getScanHistory();
        const alerts = await getAlerts();
        
        const exportData = {
          version: '1.0',
          timestamp: new Date().toISOString(),
          qrcodes,
          scanHistory,
          alerts
        };
        
        resolve(exportData);
      } catch (error) {
        reject(error);
      }
    });
  }, [getAllQRCodes, getScanHistory, getAlerts]);

  return {
    isInitialized,
    addQRCode,
    getQRCode,
    getAllQRCodes,
    updateQRCode,
    deleteQRCode,
    addScanHistory,
    getScanHistory,
    associateLoanQR,
    getLoanAssociations,
    addAlert,
    getAlerts,
    resolveAlert,
    exportData
  };
};

const QRCodeManager = ({
  onQRUpdate,
  onScan,
  onAlert
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [qrCodes, setQrCodes] = useState([]);
  const [scanHistory, setScanHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedQR, setSelectedQR] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [isLoading, setIsLoading] = useState(true);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  const db = useQRDatabase();

  // Charger les données
  const loadData = useCallback(async () => {
    if (!db.isInitialized) return;
    
    setIsLoading(true);
    try {
      const [qrcodes, history, alerts] = await Promise.all([
        db.getAllQRCodes(),
        db.getScanHistory(),
        db.getAlerts()
      ]);
      
      setQrCodes(qrcodes);
      setScanHistory(history);
      setAlerts(alerts);
      
      // Calculer les statistiques
      const stats = calculateAnalytics(qrcodes, history, alerts);
      setAnalytics(stats);
      
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  // Calculer les statistiques
  const calculateAnalytics = (qrcodes, history, alerts) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentHistory = history.filter(h => new Date(h.timestamp) >= thirtyDaysAgo);
    const recentAlerts = alerts.filter(a => new Date(a.timestamp) >= sevenDaysAgo);

    return {
      totalQRCodes: qrcodes.length,
      activeQRCodes: qrcodes.filter(qr => qr.status === QR_STATUS.ACTIVE).length,
      inactiveQRCodes: qrcodes.filter(qr => qr.status === QR_STATUS.INACTIVE).length,
      lostQRCodes: qrcodes.filter(qr => qr.status === QR_STATUS.LOST).length,
      totalScans: history.length,
      scansThisWeek: recentHistory.filter(h => new Date(h.timestamp) >= sevenDaysAgo).length,
      scansThisMonth: recentHistory.length,
      totalAlerts: alerts.length,
      unresolvedAlerts: alerts.filter(a => !a.resolved).length,
      alertsThisWeek: recentAlerts.length,
      scanFrequency: recentHistory.length / 30, // Scans par jour en moyenne
      mostScannedItem: calculateMostScanned(recentHistory),
      alertsByType: calculateAlertsByType(alerts),
      statusDistribution: calculateStatusDistribution(qrcodes)
    };
  };

  const calculateMostScanned = (history) => {
    const scanCounts = {};
    history.forEach(h => {
      scanCounts[h.qrId] = (scanCounts[h.qrId] || 0) + 1;
    });
    
    const maxScans = Math.max(...Object.values(scanCounts));
    const mostScannedId = Object.keys(scanCounts).find(id => scanCounts[id] === maxScans);
    
    return { qrId: mostScannedId, scanCount: maxScans };
  };

  const calculateAlertsByType = (alerts) => {
    const counts = {};
    alerts.forEach(alert => {
      counts[alert.type] = (counts[alert.type] || 0) + 1;
    });
    return counts;
  };

  const calculateStatusDistribution = (qrcodes) => {
    const counts = {};
    Object.values(QR_STATUS).forEach(status => {
      counts[status] = qrcodes.filter(qr => qr.status === status).length;
    });
    return counts;
  };

  // Filtrer les QR codes
  const filteredQRCodes = qrCodes.filter(qr => {
    const matchesSearch = !searchTerm || 
      qr.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      qr.itemId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      qr.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || qr.status === statusFilter;
    const matchesType = typeFilter === 'all' || qr.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Gérer le scan
  const handleScan = useCallback(async (scanData) => {
    try {
      await db.addScanHistory({
        qrId: scanData.qrId || scanData.itemId,
        action: SCAN_ACTIONS.SCAN,
        userId: scanData.userId || 'current_user',
        location: scanData.location,
        metadata: scanData,
        success: true
      });

      // Vérifier les alertes
      await checkForAlerts(scanData);
      
      // Recharger les données
      loadData();
      
      onScan?.(scanData);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du scan:', error);
      onAlert?.({ type: 'scan_error', message: error.message, severity: 'error' });
    }
  }, [db, loadData, onScan, onAlert]);

  // Vérifier les alertes
  const checkForAlerts = async (scanData) => {
    try {
      // Vérifier si l'élément est signalé comme perdu
      const qrCode = await db.getQRCode(scanData.qrId);
      if (qrCode?.status === QR_STATUS.LOST) {
        await db.addAlert({
          type: 'lost_item_scanned',
          priority: 'high',
          title: 'Objet perdu scanné',
          message: `L'objet ${qrCode.name} (${qrCode.itemId}) a été scanné`,
          data: { qrId: scanData.qrId, scanData }
        });
      }

      // Vérifier les mouvements suspects (géolocalisation)
      if (scanData.location) {
        const recentScans = await db.getScanHistory({
          qrId: scanData.qrId,
          startDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 heures
        });

        const lastScan = recentScans.find(s => s.location);
        if (lastScan?.location && calculateDistance(lastScan.location, scanData.location) > 100) {
          await db.addAlert({
            type: 'location_change',
            priority: 'medium',
            title: 'Changement de localisation suspect',
            message: `L'objet ${qrCode?.name} a changé de localisation`,
            data: { qrId: scanData.qrId, oldLocation: lastScan.location, newLocation: scanData.location }
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des alertes:', error);
    }
  };

  // Calculer la distance entre deux points GPS
  const calculateDistance = (loc1, loc2) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLon = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c * 1000; // Distance en mètres
  };

  // Exporter les données
  const handleExport = async () => {
    try {
      const data = await db.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `docucortex-qr-export-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setExportDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      onAlert?.({ type: 'export_error', message: error.message, severity: 'error' });
    }
  };

  // Résoudre une alerte
  const handleResolveAlert = async (alertId) => {
    try {
      await db.resolveAlert(alertId);
      loadData();
    } catch (error) {
      console.error('Erreur lors de la résolution de l\'alerte:', error);
    }
  };

  // Effets
  useEffect(() => {
    if (db.isInitialized) {
      loadData();
    }
  }, [db.isInitialized, loadData]);

  // Recharger périodiquement
  useEffect(() => {
    const interval = setInterval(loadData, 30000); // 30 secondes
    return () => clearInterval(interval);
  }, [loadData]);

  // Rendu des onglets
  const renderTabs = () => (
    <Paper sx={{ mb: 2 }}>
      <Tabs 
        value={activeTab} 
        onChange={(e, newValue) => setActiveTab(newValue)}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab icon={<QRCodeIcon />} label="QR Codes" />
        <Tab icon={<HistoryIcon />} label="Historique" />
        <Tab icon={<WarningIcon />} label={`Alertes (${analytics?.unresolvedAlerts || 0})`} />
        <Tab icon={<AnalyticsIcon />} label="Analytics" />
        <Tab icon={<StorageIcon />} label="Gestion" />
      </Tabs>
    </Paper>
  );

  // Rendu de l'onglet QR Codes
  const renderQRCodesTab = () => (
    <Box>
      {/* Filtres et recherche */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Rechercher"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          
          <Grid item xs={6} sm={3} md={2}>
            <FormControl fullWidth>
              <InputLabel>Statut</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Statut"
              >
                <MenuItem value="all">Tous</MenuItem>
                <MenuItem value={QR_STATUS.ACTIVE}>Actifs</MenuItem>
                <MenuItem value={QR_STATUS.INACTIVE}>Inactifs</MenuItem>
                <MenuItem value={QR_STATUS.LOST}>Perdus</MenuItem>
                <MenuItem value={QR_STATUS.DAMAGED}>Endommagés</MenuItem>
                <MenuItem value={QR_STATUS.ARCHIVED}>Archivés</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} sm={3} md={2}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                label="Type"
              >
                <MenuItem value="all">Tous</MenuItem>
                <MenuItem value={QR_DATA_TYPES.COMPUTER}>Ordinateurs</MenuItem>
                <MenuItem value={QR_DATA_TYPES.ACCESSORY}>Accessoires</MenuItem>
                <MenuItem value={QR_DATA_TYPES.LOAN}>Prêts</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setTypeFilter('all');
              }}
            >
              Réinitialiser
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => setExportDialogOpen(true)}
            >
              Exporter
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Liste des QR codes */}
      <Paper>
        {isLoading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <LinearProgress />
            <Typography sx={{ mt: 2 }}>Chargement des QR codes...</Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Élément</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>ID</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Version</TableCell>
                    <TableCell>Créé</TableCell>
                    <TableCell>Dernière action</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredQRCodes
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((qr) => (
                    <TableRow key={qr.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {qr.type === QR_DATA_TYPES.COMPUTER ? (
                            <ComputerIcon color="primary" />
                          ) : (
                            <DeviceIcon color="primary" />
                          )}
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {qr.name}
                            </Typography>
                            {qr.brand && (
                              <Typography variant="caption" color="textSecondary">
                                {qr.brand} {qr.model}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Chip 
                          label={qr.type} 
                          size="small"
                          color={qr.type === QR_DATA_TYPES.COMPUTER ? 'primary' : 'secondary'}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {qr.itemId}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Chip 
                          label={qr.status}
                          size="small"
                          color={
                            qr.status === QR_STATUS.ACTIVE ? 'success' :
                            qr.status === QR_STATUS.LOST ? 'error' :
                            qr.status === QR_STATUS.DAMAGED ? 'warning' : 'default'
                          }
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          v{qr.version}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="caption">
                          {new Date(qr.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="caption">
                          {qr.lastModified ? new Date(qr.lastModified).toLocaleDateString() : '-'}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Voir détails">
                            <IconButton 
                              size="small"
                              onClick={() => setSelectedQR(qr)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Modifier">
                            <IconButton size="small">
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton size="small" color="error">
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              component="div"
              count={filteredQRCodes.length}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </>
        )}
      </Paper>
    </Box>
  );

  // Rendu de l'onglet Historique
  const renderHistoryTab = () => (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Historique des scans ({scanHistory.length})
      </Typography>
      
      <List>
        {scanHistory.slice(0, 50).map((scan) => (
          <ListItem key={scan.id} divider>
            <ListItemIcon>
              {scan.action === SCAN_ACTIONS.SCAN && <QRCodeIcon color="primary" />}
              {scan.action === SCAN_ACTIONS.VALIDATE && <CheckIcon color="success" />}
              {scan.action === SCAN_ACTIONS.CHECKOUT && <AssignmentIcon color="info" />}
              {scan.action === SCAN_ACTIONS.CHECKIN && <CheckIcon color="success" />}
              {scan.action === SCAN_ACTIONS.UPDATE && <EditIcon color="warning" />}
            </ListItemIcon>
            
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">
                    Scan de {scan.qrId}
                  </Typography>
                  <Chip 
                    label={scan.action} 
                    size="small" 
                    color={scan.success ? 'success' : 'error'}
                  />
                </Box>
              }
              secondary={
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    {new Date(scan.timestamp).toLocaleString()}
                  </Typography>
                  {scan.location && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <LocationIcon fontSize="small" color="action" />
                      <Typography variant="caption">
                        {scan.location.lat.toFixed(4)}, {scan.location.lng.toFixed(4)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );

  // Rendu de l'onglet Alertes
  const renderAlertsTab = () => (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Alertes système ({alerts.filter(a => !a.resolved).length} non résolues)
      </Typography>
      
      {alerts.length === 0 ? (
        <Alert severity="success">
          Aucune alerte active. Le système fonctionne normalement.
        </Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {alerts.map((alert) => (
            <Accordion key={alert.id}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Chip 
                    label={alert.priority}
                    size="small"
                    color={
                      alert.priority === 'high' ? 'error' :
                      alert.priority === 'medium' ? 'warning' : 'info'
                    }
                  />
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {alert.title}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {new Date(alert.timestamp).toLocaleDateString()}
                  </Typography>
                  {alert.resolved && (
                    <Chip label="Résolue" size="small" color="success" />
                  )}
                </Box>
              </AccordionSummary>
              
              <AccordionDetails>
                <Box>
                  <Typography variant="body2" paragraph>
                    {alert.message}
                  </Typography>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Typography variant="caption" color="textSecondary">
                    Type: {alert.type} | ID: {alert.id}
                  </Typography>
                  
                  {!alert.resolved && (
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<CheckIcon />}
                        onClick={() => handleResolveAlert(alert.id)}
                      >
                        Marquer comme résolue
                      </Button>
                    </Box>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Paper>
  );

  // Rendu de l'onglet Analytics
  const renderAnalyticsTab = () => (
    <Box>
      {analytics && (
        <>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <QRCodeIcon color="primary" />
                    <Typography variant="h6">
                      {analytics.totalQRCodes}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    QR Codes total
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckIcon color="success" />
                    <Typography variant="h6">
                      {analytics.totalScans}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    Scans total
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon color="warning" />
                    <Typography variant="h6">
                      {analytics.totalAlerts}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    Alertes total
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon color="info" />
                    <Typography variant="h6">
                      {analytics.scanFrequency.toFixed(1)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    Scans/jour (moy.)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Répartition des statuts
                </Typography>
                <Stack spacing={1}>
                  {Object.entries(analytics.statusDistribution).map(([status, count]) => (
                    <Box key={status} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">
                        {status} ({count})
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={(count / analytics.totalQRCodes) * 100}
                        sx={{ width: 100 }}
                      />
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Alertes par type
                </Typography>
                <Stack spacing={1}>
                  {Object.entries(analytics.alertsByType).map(([type, count]) => (
                    <Box key={type} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">
                        {type} ({count})
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={(count / analytics.totalAlerts) * 100}
                        sx={{ width: 100 }}
                        color={
                          type === 'lost_item_scanned' ? 'error' :
                          type === 'location_change' ? 'warning' : 'info'
                        }
                      />
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );

  // Rendu de l'onglet Gestion
  const renderManagementTab = () => (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Gestion de la base de données
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                💾 Sauvegarde
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Exporter toutes les données QR codes et historique
              </Typography>
              <Button
                variant="contained"
                startIcon={<BackupIcon />}
                onClick={() => setExportDialogOpen(true)}
                fullWidth
              >
                Exporter les données
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                🔄 Synchronisation
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Synchroniser avec le serveur central
              </Typography>
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                fullWidth
                disabled
              >
                Sync (Bientôt disponible)
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );

  return (
    <Box sx={{ p: 2 }}>
      {/* En-tête avec statuts */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h6">
              <QRCodeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Gestionnaire QR Codes
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Système complet de traçabilité par QR codes
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              {analytics && (
                <>
                  <Chip 
                    label={`${analytics.activeQRCodes} actifs`}
                    color="success"
                    size="small"
                  />
                  <Chip 
                    label={`${analytics.unresolvedAlerts} alertes`}
                    color="warning"
                    size="small"
                  />
                </>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Onglets */}
      {renderTabs()}

      {/* Contenu des onglets */}
      {isLoading ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <LinearProgress />
          <Typography sx={{ mt: 2 }}>Chargement...</Typography>
        </Box>
      ) : (
        <>
          {activeTab === 0 && renderQRCodesTab()}
          {activeTab === 1 && renderHistoryTab()}
          {activeTab === 2 && renderAlertsTab()}
          {activeTab === 3 && renderAnalyticsTab()}
          {activeTab === 4 && renderManagementTab()}
        </>
      )}

      {/* Dialogue d'export */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
        <DialogTitle>Exporter les données</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Cette opération va exporter toutes les données QR codes, l'historique des scans et les alertes.
          </Typography>
          <Alert severity="info">
            Le fichier sera sauvegardé au format JSON avec toutes les métadonnées.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>
            Annuler
          </Button>
          <Button variant="contained" onClick={handleExport}>
            Exporter
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QRCodeManager;