/**
 * SignatureManager.js - Gestionnaire des signatures et certificats utilisateur
 * 
 * Fonctionnalités:
 * - Gestion des certificats utilisateur
 * - Bibliothèque de signatures validées
 * - Historique des signatures par document
 * - Vérification de validité en temps réel
 * - Gestion des permissions de signature
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Avatar,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Badge,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Security as SecurityIcon,
  Fingerprint as FingerprintIcon,
  Certificate as CertificateIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Block as BlockIcon,
  Verified as VerifiedIcon,
  Cancel as CancelIcon,
  Gavel as GavelIcon,
  VerifiedUser as VerifiedUserIcon
} from '@mui/icons-material';

import eSignatureService from '../../services/eSignatureService';

const SignatureManager = ({
  userId,
  isVisible = true,
  onSignatureSelect,
  showFilters = true,
  showCreateCertificate = true
}) => {
  // États du composant
  const [activeTab, setActiveTab] = useState(0);
  const [certificates, setCertificates] = useState([]);
  const [signatures, setSignatures] = useState([]);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [selectedSignature, setSelectedSignature] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showValidateDialog, setShowValidateDialog] = useState(false);
  const [certificateForm, setCertificateForm] = useState({
    userName: '',
    userEmail: '',
    organization: 'DocuCortex',
    department: 'IT'
  });
  const [filters, setFilters] = useState({
    status: 'all',
    documentType: 'all',
    dateRange: 'all',
    searchQuery: ''
  });
  const [validationResult, setValidationResult] = useState(null);

  // Charger les données
  const loadData = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      // Charger les certificats de l'utilisateur
      const userCertificates = eSignatureService.getCertificates()
        .filter(cert => cert.subject.userId === userId);
      
      // Charger les signatures de l'utilisateur
      const userSignatures = eSignatureService.getSignatures()
        .filter(sig => sig.userId === userId);
      
      setCertificates(userCertificates);
      setSignatures(userSignatures);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Créer un nouveau certificat
  const handleCreateCertificate = async () => {
    setIsLoading(true);
    try {
      const certificate = await eSignatureService.createCertificate(
        userId,
        certificateForm.userName,
        {
          email: certificateForm.userEmail,
          organization: certificateForm.organization,
          department: certificateForm.department
        }
      );
      
      setCertificates(prev => [certificate, ...prev]);
      setShowCreateDialog(false);
      setCertificateForm({
        userName: '',
        userEmail: '',
        organization: 'DocuCortex',
        department: 'IT'
      });
    } catch (error) {
      console.error('Erreur lors de la création du certificat:', error);
      alert('Erreur lors de la création du certificat');
    } finally {
      setIsLoading(false);
    }
  };

  // Révouer un certificat
  const handleRevokeCertificate = async (certificateId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir révoquer ce certificat ?')) {
      return;
    }

    try {
      const revokedCert = eSignatureService.revokeCertificate(certificateId, 'user_requested');
      setCertificates(prev => prev.map(cert => 
        cert.id === certificateId ? revokedCert : cert
      ));
    } catch (error) {
      console.error('Erreur lors de la révocation:', error);
      alert('Erreur lors de la révocation du certificat');
    }
  };

  // Valider une signature
  const handleValidateSignature = async (signatureId) => {
    setIsLoading(true);
    try {
      const signature = eSignatureService.getSignatureById(signatureId);
      if (!signature) {
        throw new Error('Signature non trouvée');
      }

      // Vérifier la signature via le service
      const isValid = await eSignatureService.verifySignature(
        signature, 
        signature.dataHash
      );

      const certificate = eSignatureService.findCertificateByUserId(signature.userId);
      const certificateValidation = certificate ? 
        await eSignatureService.validateCertificate(certificate.id) : 
        { isValid: false, reason: 'Certificat non trouvé' };

      setValidationResult({
        signatureId,
        signatureValid: isValid,
        certificateValid: certificateValidation.isValid,
        certificateReason: certificateValidation.reason,
        signature,
        certificate
      });
      setShowValidateDialog(true);
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      alert('Erreur lors de la validation de la signature');
    } finally {
      setIsLoading(false);
    }
  };

  // Exporter des données
  const handleExportData = async (type, itemId) => {
    try {
      let data;
      
      switch (type) {
        case 'certificate':
          const cert = certificates.find(c => c.id === itemId);
          data = cert ? JSON.stringify(cert, null, 2) : null;
          break;
        case 'signature':
          data = eSignatureService.exportSignatureData(itemId, 'json');
          break;
        case 'all':
          data = JSON.stringify({
            certificates,
            signatures,
            exported: new Date().toISOString(),
            userId
          }, null, 2);
          break;
        default:
          throw new Error('Type d\'export non supporté');
      }

      if (data) {
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${type}-export-${userId}-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export des données');
    }
  };

  // Filtrer les données
  const filteredCertificates = certificates.filter(cert => {
    if (filters.status !== 'all') {
      const isActive = cert.isActive && new Date(cert.expiresAt) > new Date();
      if (filters.status === 'active' && !isActive) return false;
      if (filters.status === 'expired' && isActive) return false;
      if (filters.status === 'revoked' && !cert.isActive) return false;
    }
    
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      return cert.subject.userName.toLowerCase().includes(query) ||
             cert.subject.email.toLowerCase().includes(query) ||
             cert.subject.organization.toLowerCase().includes(query);
    }
    
    return true;
  });

  const filteredSignatures = signatures.filter(sig => {
    if (filters.documentType !== 'all' && sig.documentType !== filters.documentType) {
      return false;
    }
    
    if (filters.dateRange !== 'all') {
      const sigDate = new Date(sig.timestamp);
      const now = new Date();
      
      switch (filters.dateRange) {
        case 'week':
          return sigDate > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case 'month':
          return sigDate > new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case 'year':
          return sigDate > new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        default:
          return true;
      }
    }
    
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      return sig.documentId?.toLowerCase().includes(query) ||
             sig.id.toLowerCase().includes(query);
    }
    
    return true;
  });

  // Obtenir le statut d'un certificat
  const getCertificateStatus = (cert) => {
    if (!cert.isActive) {
      return { status: 'revoked', color: 'error', label: 'Révoqué' };
    }
    
    const expiresAt = new Date(cert.expiresAt);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', color: 'error', label: 'Expiré' };
    } else if (daysUntilExpiry < 30) {
      return { status: 'expiring', color: 'warning', label: `Expire dans ${daysUntilExpiry}j` };
    } else {
      return { status: 'active', color: 'success', label: 'Actif' };
    }
  };

  // Obtenir le statut d'une signature
  const getSignatureStatus = (sig) => {
    if (sig.isValid === false) {
      return { status: 'invalid', color: 'error', label: 'Invalide' };
    } else if (sig.isValid === true) {
      return { status: 'valid', color: 'success', label: 'Valide' };
    } else {
      return { status: 'unknown', color: 'default', label: 'Inconnu' };
    }
  };

  // Formater la date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* En-tête */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <VerifiedUserIcon color="primary" />
            <Typography variant="h5">
              Gestionnaire de Signatures
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadData}
              disabled={isLoading}
            >
              Actualiser
            </Button>
            
            {showCreateCertificate && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowCreateDialog(true)}
              >
                Nouveau Certificat
              </Button>
            )}
          </Box>
        </Box>

        {/* Statistiques */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {certificates.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Certificats
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {signatures.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Signatures
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {certificates.filter(c => getCertificateStatus(c).status === 'expiring').length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Expirant bientôt
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="error.main">
                  {signatures.filter(s => s.isValid === false).length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Signatures invalides
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Filtres */}
      {showFilters && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="Rechercher"
                value={filters.searchQuery}
                onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              />
            </Grid>
            
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Statut</InputLabel>
                <Select
                  value={filters.status}
                  label="Statut"
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <MenuItem value="all">Tous</MenuItem>
                  <MenuItem value="active">Actifs</MenuItem>
                  <MenuItem value="expiring">Expirant</MenuItem>
                  <MenuItem value="expired">Expirés</MenuItem>
                  <MenuItem value="revoked">Révoqués</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Type de document</InputLabel>
                <Select
                  value={filters.documentType}
                  label="Type de document"
                  onChange={(e) => setFilters(prev => ({ ...prev, documentType: e.target.value }))}
                >
                  <MenuItem value="all">Tous</MenuItem>
                  <MenuItem value="loan">Prêt</MenuItem>
                  <MenuItem value="return">Retour</MenuItem>
                  <MenuItem value="contract">Contrat</MenuItem>
                  <MenuItem value="report">Rapport</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Période</InputLabel>
                <Select
                  value={filters.dateRange}
                  label="Période"
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                >
                  <MenuItem value="all">Tout</MenuItem>
                  <MenuItem value="week">7 derniers jours</MenuItem>
                  <MenuItem value="month">30 derniers jours</MenuItem>
                  <MenuItem value="year">Dernière année</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab 
            icon={<CertificateIcon />} 
            label={`Certificats (${filteredCertificates.length})`} 
          />
          <Tab 
            icon={<FingerprintIcon />} 
            label={`Signatures (${filteredSignatures.length})`} 
          />
        </Tabs>
      </Paper>

      {/* Contenu des tabs */}
      {activeTab === 0 && (
        <Paper>
          {filteredCertificates.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <CertificateIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary">
                Aucun certificat trouvé
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowCreateDialog(true)}
                sx={{ mt: 2 }}
              >
                Créer mon premier certificat
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Utilisateur</TableCell>
                    <TableCell>Organisation</TableCell>
                    <TableCell>Émis le</TableCell>
                    <TableCell>Expire le</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCertificates.map(cert => {
                    const status = getCertificateStatus(cert);
                    return (
                      <TableRow key={cert.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ width: 32, height: 32 }}>
                              {cert.subject.userName.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2">
                                {cert.subject.userName}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {cert.subject.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {cert.subject.organization}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {cert.subject.department}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(cert.issuedAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(cert.expiresAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={status.label} 
                            color={status.color} 
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Voir détails">
                              <IconButton size="small">
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Exporter">
                              <IconButton 
                                size="small"
                                onClick={() => handleExportData('certificate', cert.id)}
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>
                            {cert.isActive && (
                              <Tooltip title="Révoquer">
                                <IconButton 
                                  size="small"
                                  color="error"
                                  onClick={() => handleRevokeCertificate(cert.id)}
                                >
                                  <BlockIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {activeTab === 1 && (
        <Paper>
          {filteredSignatures.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <FingerprintIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary">
                Aucune signature trouvée
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID Signature</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Document</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSignatures.map(sig => {
                    const status = getSignatureStatus(sig);
                    return (
                      <TableRow key={sig.id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {sig.id.substring(0, 8)}...
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={sig.documentType} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {sig.documentId || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(sig.timestamp)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={status.label} 
                            color={status.color} 
                            size="small"
                            icon={status.status === 'valid' ? <CheckCircleIcon /> : 
                                  status.status === 'invalid' ? <ErrorIcon /> : undefined}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Valider">
                              <IconButton 
                                size="small"
                                onClick={() => handleValidateSignature(sig.id)}
                              >
                                <GavelIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Exporter">
                              <IconButton 
                                size="small"
                                onClick={() => handleExportData('signature', sig.id)}
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Dialog de création de certificat */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Créer un nouveau certificat</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Nom d'utilisateur"
              value={certificateForm.userName}
              onChange={(e) => setCertificateForm(prev => ({ ...prev, userName: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={certificateForm.userEmail}
              onChange={(e) => setCertificateForm(prev => ({ ...prev, userEmail: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Organisation"
              value={certificateForm.organization}
              onChange={(e) => setCertificateForm(prev => ({ ...prev, organization: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Département"
              value={certificateForm.department}
              onChange={(e) => setCertificateForm(prev => ({ ...prev, department: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Annuler</Button>
          <Button 
            onClick={handleCreateCertificate}
            variant="contained"
            disabled={!certificateForm.userName || isLoading}
          >
            {isLoading ? <CircularProgress size={16} /> : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de validation */}
      <Dialog open={showValidateDialog} onClose={() => setShowValidateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Validation de signature</DialogTitle>
        <DialogContent>
          {validationResult && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity={validationResult.signatureValid && validationResult.certificateValid ? 'success' : 'error'}>
                <Typography variant="h6">
                  {validationResult.signatureValid && validationResult.certificateValid ? 
                    'Signature valide' : 'Signature invalide'}
                </Typography>
                <Typography variant="body2">
                  {validationResult.certificateReason}
                </Typography>
              </Alert>
              
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Détails de la signature</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2">ID:</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {validationResult.signature.id}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">Type:</Typography>
                    <Typography variant="body2">
                      {validationResult.signature.documentType}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">Date:</Typography>
                    <Typography variant="body2">
                      {formatDate(validationResult.signature.timestamp)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">Validité:</Typography>
                    <Chip 
                      label={validationResult.signature.isValid ? 'Valide' : 'Invalide'}
                      color={validationResult.signature.isValid ? 'success' : 'error'}
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowValidateDialog(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SignatureManager;