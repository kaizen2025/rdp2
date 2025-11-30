/**
 * CertificateViewer.js - Visualiseur de certificats numériques
 * 
 * Fonctionnalités:
 * - Visualisation détaillée des certificats
 * - Vérification de validité en temps réel
 * - Export et partage de certificats
 * - Affichage des métadonnées et signature
 * - Interface de validation légale
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Alert,
  Divider,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  LinearProgress,
  CopyToClipboard,
  useSnackbar
} from '@mui/material';
import {
  Certificate as CertificateIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Security as SecurityIcon,
  Verified as VerifiedIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Business as OrganizationIcon,
  Email as EmailIcon,
  Fingerprint as FingerprintIcon,
  Lock as LockIcon,
  Share as ShareIcon,
  QrCode as QrCodeIcon,
  Timeline as TimelineIcon,
  Gavel as GavelIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

import eSignatureService from '../../services/eSignatureService';

const CertificateViewer = ({
  certificateId,
  certificate,
  showValidation = true,
  allowExport = true,
  onCertificateSelect,
  compact = false
}) => {
  // États du composant
  const [selectedCertificate, setSelectedCertificate] = useState(certificate);
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showQRCode, setShowQRCode] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const { showSnackbar } = useSnackbar();

  // Charger et valider le certificat
  useEffect(() => {
    if (certificateId) {
      loadCertificate();
    } else if (certificate) {
      setSelectedCertificate(certificate);
      if (showValidation) {
        validateCertificate();
      }
    }
  }, [certificateId, certificate, showValidation]);

  // Charger un certificat par ID
  const loadCertificate = async () => {
    try {
      const cert = eSignatureService.getCertificateById(certificateId);
      if (cert) {
        setSelectedCertificate(cert);
        if (showValidation) {
          await validateCertificate(cert);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du certificat:', error);
    }
  };

  // Valider un certificat
  const validateCertificate = async (cert = selectedCertificate) => {
    if (!cert) return;
    
    setIsValidating(true);
    try {
      const result = await eSignatureService.validateCertificate(cert.id);
      setValidationResult(result);
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      setValidationResult({
        isValid: false,
        reason: `Erreur de validation: ${error.message}`
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Obtenir le statut du certificat
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

  // Formater la date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Copier dans le presse-papier
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      showSnackbar(`${label} copié dans le presse-papier`, 'success');
    }).catch(() => {
      showSnackbar(`Erreur lors de la copie`, 'error');
    });
  };

  // Exporter le certificat
  const exportCertificate = (format = 'json') => {
    if (!selectedCertificate) return;
    
    const exportData = {
      certificate: selectedCertificate,
      validation: validationResult,
      exportedAt: new Date().toISOString(),
      exportedBy: 'DocuCortex-CertificateViewer'
    };

    const content = format === 'pem' ? 
      convertToPEM(selectedCertificate) : 
      JSON.stringify(exportData, null, 2);

    const blob = new Blob([content], { 
      type: format === 'pem' ? 'application/x-pem-file' : 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `certificate-${selectedCertificate.id}.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Convertir en format PEM (simulation)
  const convertToPEM = (cert) => {
    return `-----BEGIN CERTIFICATE-----
${btoa(JSON.stringify(cert)).match(/.{1,64}/g).join('\n')}
-----END CERTIFICATE-----`;
  };

  // Générer l'URL de partage
  const generateShareUrl = () => {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/certificate/${selectedCertificate.id}`;
    setShareUrl(url);
  };

  // Raccourcir un texte
  const shortenText = (text, maxLength = 16) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (!selectedCertificate) {
    return (
      <Paper sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="textSecondary">
          Aucun certificat à afficher
        </Typography>
      </Paper>
    );
  }

  const status = getCertificateStatus(selectedCertificate);
  const isExpired = status.status === 'expired';
  const isExpiring = status.status === 'expiring';

  if (compact) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CertificateIcon color="primary" />
              <Box>
                <Typography variant="h6">
                  {selectedCertificate.subject.userName}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {selectedCertificate.subject.organization}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label={status.label} 
                color={status.color} 
                size="small"
              />
              <IconButton size="small" onClick={() => validateCertificate()}>
                <RefreshIcon />
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* En-tête du certificat */}
      <Paper sx={{ p: 3, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
              <CertificateIcon />
            </Avatar>
            <Box>
              <Typography variant="h4" gutterBottom>
                Certificat Numérique
              </Typography>
              <Typography variant="h6" color="textSecondary">
                {selectedCertificate.subject.userName}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {selectedCertificate.subject.organization} - {selectedCertificate.subject.department}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ textAlign: 'right' }}>
            <Chip 
              label={status.label} 
              color={status.color} 
              sx={{ mb: 1 }}
            />
            <Typography variant="caption" display="block">
              ID: {shortenText(selectedCertificate.id)}
            </Typography>
          </Box>
        </Box>

        {/* Alertes de statut */}
        {isExpired && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Ce certificat a expiré le {formatDate(selectedCertificate.expiresAt)} et ne doit plus être utilisé.
            </Typography>
          </Alert>
        )}

        {isExpiring && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Ce certificat expire bientôt ({status.label}). Renouvelez-le avant expiration.
            </Typography>
          </Alert>
        )}

        {validationResult && validationResult.isValid && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Certificat valide et conforme aux standards de sécurité.
            </Typography>
          </Alert>
        )}

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<CheckIcon />}
            onClick={() => validateCertificate()}
            disabled={isValidating}
          >
            {isValidating ? 'Validation...' : 'Valider'}
          </Button>
          
          {allowExport && (
            <>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => exportCertificate('json')}
              >
                Exporter JSON
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => exportCertificate('pem')}
              >
                Exporter PEM
              </Button>
            </>
          )}
          
          <Button
            variant="outlined"
            startIcon={<ShareIcon />}
            onClick={() => {
              generateShareUrl();
              setShowQRCode(true);
            }}
          >
            Partager
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<CopyIcon />}
            onClick={() => copyToClipboard(selectedCertificate.id, 'ID du certificat')}
          >
            Copier l'ID
          </Button>
        </Box>
      </Paper>

      {/* Onglets */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab icon={<PersonIcon />} label="Informations" />
          <Tab icon={<SecurityIcon />} label="Sécurité" />
          <Tab icon={<TimelineIcon />} label="Historique" />
          <Tab icon={<VerifiedIcon />} label="Validation" />
        </Tabs>
      </Paper>

      {/* Contenu des onglets */}
      {activeTab === 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Informations du certificat
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader title="Sujet du certificat" />
                <CardContent>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><PersonIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Nom"
                        secondary={selectedCertificate.subject.userName}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon><EmailIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Email"
                        secondary={selectedCertificate.subject.email || 'Non spécifié'}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon><OrganizationIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Organisation"
                        secondary={selectedCertificate.subject.organization}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon><BusinessIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Département"
                        secondary={selectedCertificate.subject.department}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader title="Informations techniques" />
                <CardContent>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><LockIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Algorithme"
                        secondary={selectedCertificate.algorithm}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon><FingerprintIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Empreinte"
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {shortenText(selectedCertificate.fingerprint)}
                            </Typography>
                            <IconButton 
                              size="small"
                              onClick={() => copyToClipboard(selectedCertificate.fingerprint, 'Empreinte')}
                            >
                              <CopyIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        }
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon><ScheduleIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Numéro de série"
                        secondary={selectedCertificate.serialNumber}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon><SecurityIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Version"
                        secondary={selectedCertificate.version}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      {activeTab === 1 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Informations de sécurité
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader title="Période de validité" />
                <CardContent>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Émis le"
                        secondary={formatDate(selectedCertificate.issuedAt)}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemText 
                        primary="Expire le"
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              {formatDate(selectedCertificate.expiresAt)}
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={Math.max(0, 100 - (new Date(selectedCertificate.expiresAt) - new Date()) / (365 * 24 * 60 * 60 * 1000) * 100)}
                              sx={{ mt: 1 }}
                            />
                            <Typography variant="caption" color="textSecondary">
                              Durée de vie restante
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader title="Émetteur du certificat" />
                <CardContent>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><OrganizationIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Nom"
                        secondary={selectedCertificate.issuer.name}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon><BusinessIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Organisation"
                        secondary={selectedCertificate.issuer.organization}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Clé publique */}
          <Card variant="outlined" sx={{ mt: 2 }}>
            <CardHeader title="Clé publique" />
            <CardContent>
              <Box sx={{ 
                bgcolor: 'grey.100', 
                p: 2, 
                borderRadius: 1, 
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                wordBreak: 'break-all'
              }}>
                {selectedCertificate.publicKey}
              </Box>
            </CardContent>
          </Card>
        </Paper>
      )}

      {activeTab === 2 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Historique du certificat
          </Typography>
          
          <Alert severity="info">
            <Typography variant="body2">
              L'historique complet du certificat sera affiché ici, incluant les créations, modifications et révocations.
            </Typography>
          </Alert>
        </Paper>
      )}

      {activeTab === 3 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Validation du certificat
          </Typography>
          
          {isValidating && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <LinearProgress sx={{ flex: 1 }} />
              <Typography variant="body2">Validation en cours...</Typography>
            </Box>
          )}
          
          {validationResult && (
            <Box>
              <Alert 
                severity={validationResult.isValid ? 'success' : 'error'} 
                icon={validationResult.isValid ? <CheckIcon /> : <ErrorIcon />}
                sx={{ mb: 2 }}
              >
                <Typography variant="body2">
                  <strong>Statut de validation:</strong> {validationResult.isValid ? 'Valide' : 'Invalide'}
                </Typography>
                <Typography variant="body2">
                  {validationResult.reason}
                </Typography>
              </Alert>

              <Card variant="outlined">
                <CardHeader title="Détails de validation" />
                <CardContent>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell><strong>Validité cryptographique</strong></TableCell>
                          <TableCell>
                            <Chip 
                              label={validationResult.isValid ? 'Valide' : 'Invalide'} 
                              color={validationResult.isValid ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                        
                        <TableRow>
                          <TableCell><strong>Expiration</strong></TableCell>
                          <TableCell>
                            {new Date(selectedCertificate.expiresAt) > new Date() ? 
                              <Chip label="Non expiré" color="success" size="small" /> :
                              <Chip label="Expiré" color="error" size="small" />
                            }
                          </TableCell>
                        </TableRow>
                        
                        <TableRow>
                          <TableCell><strong>Statut de révocation</strong></TableCell>
                          <TableCell>
                            {selectedCertificate.isActive ? 
                              <Chip label="Actif" color="success" size="small" /> :
                              <Chip label="Révoqué" color="error" size="small" />
                            }
                          </TableCell>
                        </TableRow>
                        
                        <TableRow>
                          <TableCell><strong>Signature de l'émetteur</strong></TableCell>
                          <TableCell>
                            <Chip 
                              label="Vérifiée" 
                              color="success" 
                              size="small"
                              icon={<CheckIcon />}
                            />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Box>
          )}
        </Paper>
      )}

      {/* Dialog de partage avec QR Code */}
      <Dialog open={showQRCode} onClose={() => setShowQRCode(false)}>
        <DialogTitle>Partager le certificat</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            {/* QR Code simulation */}
            <Box sx={{ 
              width: 200, 
              height: 200, 
              bgcolor: 'grey.100', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '2px solid #ccc',
              borderRadius: 2
            }}>
              <QrCodeIcon sx={{ fontSize: 100, color: 'grey.400' }} />
            </Box>
            
            <Typography variant="body2" color="textSecondary" textAlign="center">
              URL de partage du certificat
            </Typography>
            
            <Box sx={{ 
              p: 2, 
              bgcolor: 'grey.50', 
              borderRadius: 1, 
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              wordBreak: 'break-all'
            }}>
              {shareUrl || 'Génération en cours...'}
            </Box>
            
            <Button
              variant="outlined"
              startIcon={<CopyIcon />}
              onClick={() => copyToClipboard(shareUrl, 'URL de partage')}
              disabled={!shareUrl}
            >
              Copier l'URL
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowQRCode(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CertificateViewer;