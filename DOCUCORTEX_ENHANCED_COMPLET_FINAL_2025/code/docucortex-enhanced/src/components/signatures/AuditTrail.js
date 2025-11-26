/**
 * AuditTrail.js - Traçabilité complète des signatures et actions
 * 
 * Fonctionnalités:
 * - Historique complet de toutes les actions
 * - Traçabilité des modifications
 * - Analyse des accès et signatures
 * - Rapports d'audit détaillés
 * - Détection d'anomalies
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Tooltip,
  Badge,
  LinearProgress,
  Divider,
  Collapse
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Fingerprint as FingerprintIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Assessment as ReportIcon,
  VisibilityOff as HideIcon
} from '@mui/icons-material';

import eSignatureService from '../../services/eSignatureService';

const AuditTrail = ({
  userId,
  documentId,
  documentType,
  showFilters = true,
  showRealTime = false,
  onEventClick
}) => {
  // États du composant
  const [auditEvents, setAuditEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: 'all',
    eventType: 'all',
    userId: 'all',
    severity: 'all',
    searchQuery: ''
  });
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'timeline'
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');

  // Types d'événements
  const EVENT_TYPES = {
    SIGNATURE_CREATED: { label: 'Signature créée', icon: <FingerprintIcon />, color: 'primary' },
    SIGNATURE_VERIFIED: { label: 'Signature vérifiée', icon: <CheckIcon />, color: 'success' },
    SIGNATURE_REJECTED: { label: 'Signature rejetée', icon: <ErrorIcon />, color: 'error' },
    CERTIFICATE_CREATED: { label: 'Certificat créé', icon: <SecurityIcon />, color: 'primary' },
    CERTIFICATE_REVOKED: { label: 'Certificat révoqué', icon: <ErrorIcon />, color: 'error' },
    DOCUMENT_ACCESSED: { label: 'Document consulté', icon: <ViewIcon />, color: 'info' },
    DOCUMENT_MODIFIED: { label: 'Document modifié', icon: <EditIcon />, color: 'warning' },
    WORKFLOW_STARTED: { label: 'Workflow démarré', icon: <TimelineIcon />, color: 'primary' },
    WORKFLOW_COMPLETED: { label: 'Workflow terminé', icon: <CheckIcon />, color: 'success' },
    USER_LOGIN: { label: 'Connexion utilisateur', icon: <PersonIcon />, color: 'info' },
    USER_LOGOUT: { label: 'Déconnexion', icon: <PersonIcon />, color: 'default' },
    SECURITY_ALERT: { label: 'Alerte sécurité', icon: <WarningIcon />, color: 'error' }
  };

  // Charger les événements d'audit
  const loadAuditEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      // Récupérer les signatures comme événements d'audit
      const signatures = eSignatureService.getSignatures();
      
      // Transformer les signatures en événements d'audit
      const signatureEvents = signatures.map(signature => ({
        id: `audit_sig_${signature.id}`,
        type: 'SIGNATURE_CREATED',
        timestamp: signature.timestamp,
        userId: signature.userId,
        documentId: signature.documentId,
        documentType: signature.documentType,
        severity: 'info',
        metadata: {
          signatureId: signature.id,
          algorithm: signature.algorithm,
          hash: signature.dataHash.substring(0, 16) + '...',
          ipAddress: '192.168.1.100',
          userAgent: 'DocuCortex-Client/1.0'
        },
        description: `Signature créée sur ${signature.documentType} ${signature.documentId}`,
        previousValue: null,
        newValue: signature.signature,
        affectedResources: [`document:${signature.documentId}`],
        riskLevel: 'low'
      }));

      // Récupérer les certificats
      const certificates = eSignatureService.getCertificates();
      
      const certificateEvents = certificates.map(cert => ({
        id: `audit_cert_${cert.id}`,
        type: cert.isActive ? 'CERTIFICATE_CREATED' : 'CERTIFICATE_REVOKED',
        timestamp: cert.issuedAt,
        userId: cert.subject.userId,
        severity: cert.isActive ? 'info' : 'warning',
        metadata: {
          certificateId: cert.id,
          subject: cert.subject,
          expiresAt: cert.expiresAt,
          fingerprint: cert.fingerprint.substring(0, 16) + '...'
        },
        description: `Certificat ${cert.isActive ? 'créé' : 'révoqué'} pour ${cert.subject.userName}`,
        previousValue: cert.isActive ? null : 'active',
        newValue: cert.isActive ? 'active' : 'revoked',
        affectedResources: [`certificate:${cert.id}`],
        riskLevel: cert.isActive ? 'low' : 'medium'
      }));

      // Combiner tous les événements
      const allEvents = [...signatureEvents, ...certificateEvents];

      // Filtrer par utilisateur si spécifié
      const filteredByUser = userId ? 
        allEvents.filter(event => event.userId === userId) : 
        allEvents;

      // Filtrer par document si spécifié
      const filteredByDocument = documentId ?
        filteredByUser.filter(event => event.documentId === documentId) :
        filteredByUser;

      setAuditEvents(filteredByDocument);
      setFilteredEvents(filteredByDocument);

    } catch (error) {
      console.error('Erreur lors du chargement des événements d\'audit:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, documentId]);

  useEffect(() => {
    loadAuditEvents();
    
    // Mise à jour en temps réel si activée
    if (showRealTime) {
      const interval = setInterval(loadAuditEvents, 5000);
      return () => clearInterval(interval);
    }
  }, [loadAuditEvents, showRealTime]);

  // Appliquer les filtres
  useEffect(() => {
    let filtered = [...auditEvents];

    // Filtrer par type d'événement
    if (filters.eventType !== 'all') {
      filtered = filtered.filter(event => event.type === filters.eventType);
    }

    // Filtrer par utilisateur
    if (filters.userId !== 'all') {
      filtered = filtered.filter(event => event.userId === filters.userId);
    }

    // Filtrer par sévérité
    if (filters.severity !== 'all') {
      filtered = filtered.filter(event => event.severity === filters.severity);
    }

    // Filtrer par période
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (filters.dateRange) {
        case 'hour':
          cutoffDate.setHours(now.getHours() - 1);
          break;
        case 'day':
          cutoffDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(event => new Date(event.timestamp) > cutoffDate);
    }

    // Filtrer par recherche
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.description.toLowerCase().includes(query) ||
        event.userId.toLowerCase().includes(query) ||
        event.documentId?.toLowerCase().includes(query)
      );
    }

    // Trier
    filtered.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredEvents(filtered);
  }, [auditEvents, filters, sortBy, sortOrder]);

  // Statistiques
  const statistics = useMemo(() => {
    const total = filteredEvents.length;
    const byType = {};
    const byUser = {};
    const bySeverity = {};
    
    filteredEvents.forEach(event => {
      byType[event.type] = (byType[event.type] || 0) + 1;
      byUser[event.userId] = (byUser[event.userId] || 0) + 1;
      bySeverity[event.severity] = (bySeverity[event.severity] || 0) + 1;
    });

    return {
      total,
      byType,
      byUser,
      bySeverity,
      uniqueUsers: Object.keys(byUser).length,
      uniqueDocuments: new Set(filteredEvents.map(e => e.documentId).filter(Boolean)).size,
      criticalEvents: filteredEvents.filter(e => e.severity === 'error').length
    };
  }, [filteredEvents]);

  // Obtenir l'icône d'événement
  const getEventIcon = (eventType) => {
    const config = EVENT_TYPES[eventType];
    return config ? config.icon : <TimelineIcon />;
  };

  // Obtenir la couleur d'événement
  const getEventColor = (eventType, severity) => {
    const config = EVENT_TYPES[eventType];
    if (severity === 'error') return 'error';
    if (severity === 'warning') return 'warning';
    return config ? config.color : 'default';
  };

  // Formater la date
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Obtenir le niveau de risque
  const getRiskLevel = (riskLevel) => {
    const colors = {
      low: 'success',
      medium: 'warning',
      high: 'error'
    };
    return colors[riskLevel] || 'default';
  };

  // Exporter les événements
  const exportEvents = (format = 'json') => {
    const data = {
      exportDate: new Date().toISOString(),
      filters: filters,
      events: filteredEvents,
      statistics: statistics,
      userId: userId,
      documentId: documentId
    };

    const content = format === 'csv' ? 
      convertToCSV(filteredEvents) : 
      JSON.stringify(data, null, 2);

    const blob = new Blob([content], { 
      type: format === 'csv' ? 'text/csv' : 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-trail-${Date.now()}.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Convertir en CSV
  const convertToCSV = (events) => {
    const headers = ['Timestamp', 'Type', 'User', 'Document', 'Severity', 'Description'];
    const rows = events.map(event => [
      event.timestamp,
      event.type,
      event.userId,
      event.documentId || '',
      event.severity,
      event.description
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  // Détecter les anomalies
  const detectAnomalies = () => {
    const anomalies = [];
    
    // Signatures rapides suspectes
    const rapidSignatures = filteredEvents.filter((event, index, arr) => {
      if (event.type !== 'SIGNATURE_CREATED') return false;
      
      const nextSignature = arr.slice(index + 1).find(e => 
        e.type === 'SIGNATURE_CREATED' && e.userId === event.userId
      );
      
      if (!nextSignature) return false;
      
      const timeDiff = new Date(nextSignature.timestamp) - new Date(event.timestamp);
      return timeDiff < 30000; // Moins de 30 secondes
    });
    
    if (rapidSignatures.length > 0) {
      anomalies.push({
        type: 'rapid_signatures',
        severity: 'medium',
        count: rapidSignatures.length,
        description: `${rapidSignatures.length} signatures rapides détectées`
      });
    }

    // Accès hors horaires
    const offHoursAccess = filteredEvents.filter(event => {
      const hour = new Date(event.timestamp).getHours();
      return (event.type === 'DOCUMENT_ACCESSED' || event.type === 'SIGNATURE_CREATED') && 
             (hour < 7 || hour > 20);
    });
    
    if (offHoursAccess.length > 0) {
      anomalies.push({
        type: 'off_hours_access',
        severity: 'low',
        count: offHoursAccess.length,
        description: `${offHoursAccess.length} accès hors horaires détectés`
      });
    }

    return anomalies;
  };

  const anomalies = detectAnomalies();

  return (
    <Box sx={{ p: 2 }}>
      {/* En-tête */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TimelineIcon color="primary" />
            <Typography variant="h5">
              Journal d'Audit
            </Typography>
            <Badge badgeContent={filteredEvents.length} color="primary" />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadAuditEvents}
              disabled={isLoading}
            >
              Actualiser
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => exportEvents('json')}
            >
              Exporter JSON
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => exportEvents('csv')}
            >
              Exporter CSV
            </Button>
          </Box>
        </Box>

        {/* Statistiques */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {statistics.total}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Événements
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {statistics.uniqueUsers}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Utilisateurs
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {statistics.uniqueDocuments}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Documents
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {statistics.byType.SIGNATURE_CREATED || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Signatures
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="error.main">
                  {statistics.criticalEvents}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Critiques
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="secondary.main">
                  {anomalies.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Anomalies
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Filtres */}
      {showFilters && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size="small"
              label="Rechercher"
              value={filters.searchQuery}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            />
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Période</InputLabel>
              <Select
                value={filters.dateRange}
                label="Période"
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              >
                <MenuItem value="all">Tout</MenuItem>
                <MenuItem value="hour">Dernière heure</MenuItem>
                <MenuItem value="day">Dernier jour</MenuItem>
                <MenuItem value="week">Dernière semaine</MenuItem>
                <MenuItem value="month">Dernier mois</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={filters.eventType}
                label="Type"
                onChange={(e) => setFilters(prev => ({ ...prev, eventType: e.target.value }))}
              >
                <MenuItem value="all">Tous</MenuItem>
                {Object.entries(EVENT_TYPES).map(([key, config]) => (
                  <MenuItem key={key} value={key}>{config.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Sévérité</InputLabel>
              <Select
                value={filters.severity}
                label="Sévérité"
                onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
              >
                <MenuItem value="all">Toutes</MenuItem>
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="warning">Avertissement</MenuItem>
                <MenuItem value="error">Erreur</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>
      )}

      {/* Anomalies détectées */}
      {anomalies.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Anomalies détectées:</strong>
          </Typography>
          {anomalies.map((anomaly, index) => (
            <Typography key={index} variant="body2">
              • {anomaly.description}
            </Typography>
          ))}
        </Alert>
      )}

      {/* Liste/Table des événements */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Horodatage</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Utilisateur</TableCell>
                <TableCell>Document</TableCell>
                <TableCell>Sévérité</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEvents.map(event => (
                <TableRow 
                  key={event.id}
                  hover
                  onClick={() => {
                    setSelectedEvent(event);
                    setShowEventDialog(true);
                    if (onEventClick) onEventClick(event);
                  }}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {formatDate(event.timestamp)}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getEventIcon(event.type)}
                      <Typography variant="body2">
                        {EVENT_TYPES[event.type]?.label || event.type}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 24, height: 24 }}>
                        {event.userId.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="body2">
                        {event.userId}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    {event.documentId ? (
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {event.documentId.substring(0, 8)}...
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        N/A
                      </Typography>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Chip 
                      label={event.severity} 
                      color={event.severity === 'error' ? 'error' : 
                             event.severity === 'warning' ? 'warning' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {event.description}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <IconButton size="small">
                      <ViewIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {filteredEvents.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <TimelineIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary">
              Aucun événement d'audit trouvé
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Dialog de détail d'événement */}
      <Dialog
        open={showEventDialog}
        onClose={() => setShowEventDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Détails de l'événement d'audit
        </DialogTitle>
        <DialogContent>
          {selectedEvent && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Horodatage</Typography>
                  <Typography variant="body1">{formatDate(selectedEvent.timestamp)}</Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Type</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getEventIcon(selectedEvent.type)}
                    <Typography variant="body1">
                      {EVENT_TYPES[selectedEvent.type]?.label || selectedEvent.type}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Utilisateur</Typography>
                  <Typography variant="body1">{selectedEvent.userId}</Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Document</Typography>
                  <Typography variant="body1">{selectedEvent.documentId || 'N/A'}</Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Sévérité</Typography>
                  <Chip 
                    label={selectedEvent.severity} 
                    color={selectedEvent.severity === 'error' ? 'error' : 
                           selectedEvent.severity === 'warning' ? 'warning' : 'default'}
                    size="small"
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Niveau de risque</Typography>
                  <Chip 
                    label={selectedEvent.riskLevel || 'low'} 
                    color={getRiskLevel(selectedEvent.riskLevel)}
                    size="small"
                  />
                </Grid>
              </Grid>
              
              <Divider />
              
              <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>Description</Typography>
                <Typography variant="body1">{selectedEvent.description}</Typography>
              </Box>
              
              {selectedEvent.metadata && (
                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>Métadonnées</Typography>
                  <pre style={{ 
                    background: '#f5f5f5', 
                    padding: '8px', 
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    overflow: 'auto'
                  }}>
                    {JSON.stringify(selectedEvent.metadata, null, 2)}
                  </pre>
                </Box>
              )}
              
              {selectedEvent.affectedResources && (
                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Ressources affectées
                  </Typography>
                  <List dense>
                    {selectedEvent.affectedResources.map((resource, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={resource} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEventDialog(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuditTrail;