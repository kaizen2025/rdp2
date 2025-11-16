/**
 * SignatureInterface.js - Interface complète de signature électronique
 * 
 * Ce composant combine tous les éléments nécessaires pour un système de signature
 * électronique complet avec une interface utilisateur moderne et intuitive.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  Fingerprint as FingerprintIcon,
  Security as SecurityIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  Person as PersonIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Close as CloseIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon
} from '@mui/icons-material';

import DigitalSignaturePad from './DigitalSignaturePad';
import SignatureManager from './SignatureManager';
import SignatureWorkflow from './SignatureWorkflow';
import SignatureValidation from './SignatureValidation';
import AuditTrail from './AuditTrail';
import CertificateViewer from './CertificateViewer';
import eSignatureService from '../../services/eSignatureService';

const SignatureInterface = ({
  userId,
  documentType = 'loan',
  documentId,
  documentTitle,
  requiredSigners = [],
  optionalSigners = [],
  onSignatureComplete,
  onError
}) => {
  // États de l'interface
  const [activeTab, setActiveTab] = useState(0);
  const [currentSignature, setCurrentSignature] = useState(null);
  const [signatureStatus, setSignatureStatus] = useState('idle');
  const [certificate, setCertificate] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Configuration des onglets
  const tabs = [
    { label: 'Signature', icon: <FingerprintIcon /> },
    { label: 'Certificats', icon: <SecurityIcon /> },
    { label: 'Validation', icon: <AssessmentIcon /> },
    { label: 'Audit', icon: <TimelineIcon /> }
  ];

  // Initialiser l'interface
  useEffect(() => {
    initializeInterface();
  }, [userId]);

  // Initialiser l'interface utilisateur
  const initializeInterface = async () => {
    try {
      setIsInitialized(false);
      
      // Vérifier ou créer un certificat pour l'utilisateur
      const userCertificate = eSignatureService.findCertificateByUserId(userId);
      
      if (!userCertificate) {
        // Créer un certificat par défaut
        const newCertificate = await eSignatureService.createCertificate(
          userId,
          userId,
          {
            organization: 'DocuCortex',
            department: 'IT',
            email: `${userId}@docucortex.local`
          }
        );
        setCertificate(newCertificate);
      } else {
        setCertificate(userCertificate);
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      if (onError) onError(error);
    }
  };

  // Gérer la signature
  const handleSignatureComplete = async (signatureData) => {
    try {
      setSignatureStatus('processing');
      
      // Finaliser la signature
      const signature = await eSignatureService.signData(
        {
          documentId,
          documentType,
          documentTitle,
          signatureData
        },
        userId,
        {
          documentType,
          documentId
        }
      );

      setCurrentSignature(signature);
      setSignatureStatus('completed');
      setShowSignatureDialog(false);

      // Notifier le parent
      if (onSignatureComplete) {
        onSignatureComplete(signature);
      }

    } catch (error) {
      console.error('Erreur lors de la signature:', error);
      setSignatureStatus('error');
      if (onError) onError(error);
    }
  };

  // Obtenir le statut de la signature
  const getSignatureStatus = () => {
    switch (signatureStatus) {
      case 'idle':
        return { color: 'default', label: 'Prêt à signer', icon: null };
      case 'processing':
        return { color: 'warning', label: 'Signature en cours...', icon: null };
      case 'completed':
        return { color: 'success', label: 'Signé avec succès', icon: <CheckIcon /> };
      case 'error':
        return { color: 'error', label: 'Erreur de signature', icon: <ErrorIcon /> };
      default:
        return { color: 'default', label: 'Statut inconnu', icon: null };
    }
  };

  // Démarrer le processus de signature
  const startSigning = () => {
    if (!isInitialized) {
      alert('Interface en cours d\'initialisation...');
      return;
    }

    if (!certificate || !certificate.isActive) {
      alert('Certificat invalide ou manquant');
      return;
    }

    setShowSignatureDialog(true);
  };

  // Rendu de l'en-tête
  const renderHeader = () => {
    const status = getSignatureStatus();
    
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FingerprintIcon color="primary" fontSize="large" />
            <Box>
              <Typography variant="h4">
                Interface de Signature Électronique
              </Typography>
              <Typography variant="h6" color="textSecondary">
                {documentTitle}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ textAlign: 'right' }}>
            <Chip 
              label={status.label}
              color={status.color}
              icon={status.icon}
              sx={{ mb: 1 }}
            />
            <Typography variant="caption" display="block">
              {documentType} - {documentId}
            </Typography>
          </Box>
        </Box>

        {/* Actions principales */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={signatureStatus === 'idle' ? <StartIcon /> : <StopIcon />}
            onClick={startSigning}
            disabled={signatureStatus === 'processing'}
          >
            {signatureStatus === 'idle' ? 'Signer le document' : 'Arrêter'}
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => setActiveTab(1)}
          >
            Gérer les certificats
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<HelpIcon />}
            onClick={() => setShowHelp(true)}
          >
            Aide
          </Button>
        </Box>

        {/* Informations utilisateur */}
        {certificate && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Certificat actif:</strong> {certificate.subject.userName} 
              ({certificate.subject.organization}) - 
              Expire le {new Date(certificate.expiresAt).toLocaleDateString()}
            </Typography>
          </Alert>
        )}
      </Paper>
    );
  };

  // Rendu de l'onglet de signature
  const renderSignatureTab = () => (
    <Box>
      {/* Statut actuel */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          État de la signature
        </Typography>
        
        {currentSignature ? (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Document signé avec succès le {new Date(currentSignature.timestamp).toLocaleString()}
              </Typography>
            </Alert>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardHeader title="Détails de la signature" />
                  <CardContent>
                    <List dense>
                      <ListItem>
                        <ListItemText 
                          primary="ID de signature"
                          secondary={currentSignature.id}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Algorithm"
          secondary={currentSignature.algorithm}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Horodatage"
                          secondary={new Date(currentSignature.timestamp).toLocaleString()}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardHeader title="Actions disponibles" />
                  <CardContent>
                    <List>
                      <ListItem>
                        <ListItemIcon><AssessmentIcon /></ListItemIcon>
                        <Button 
                          onClick={() => {
                            setValidationResult(currentSignature);
                            setActiveTab(2);
                          }}
                        >
                          Valider la signature
                        </Button>
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><TimelineIcon /></ListItemIcon>
                        <Button onClick={() => setActiveTab(3)}>
                          Voir l'historique
                        </Button>
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <FingerprintIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Aucune signature pour ce document
            </Typography>
            <Button
              variant="contained"
              startIcon={<StartIcon />}
              onClick={startSigning}
              size="large"
            >
              Commencer la signature
            </Button>
          </Box>
        )}
      </Paper>

      {/* Workflow de signature si disponible */}
      {(requiredSigners.length > 0 || optionalSigners.length > 0) && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Workflow de signature
          </Typography>
          <SignatureWorkflow
            workflowId={`workflow_${documentId}`}
            documentType={documentType}
            documentId={documentId}
            documentTitle={documentTitle}
            requiredSigners={requiredSigners}
            optionalSigners={optionalSigners}
            onWorkflowComplete={(result) => {
              console.log('Workflow terminé:', result);
            }}
            onSignatureRequired={(signature) => {
              console.log('Signature requise:', signature);
            }}
          />
        </Paper>
      )}
    </Box>
  );

  // Rendu de l'onglet de certificats
  const renderCertificatesTab = () => (
    <SignatureManager
      userId={userId}
      isVisible={true}
      showCreateCertificate={true}
      showFilters={true}
    />
  );

  // Rendu de l'onglet de validation
  const renderValidationTab = () => (
    <Box>
      {validationResult ? (
        <SignatureValidation
          signatureId={validationResult.id}
          signatureData={validationResult}
          onValidationComplete={(result) => {
            console.log('Validation terminée:', result);
          }}
          autoValidate={true}
          showDetailedReport={true}
        />
      ) : currentSignature ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <AssessmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            Prêt pour la validation
          </Typography>
          <Button
            variant="contained"
            onClick={() => setValidationResult(currentSignature)}
          >
            Valider la signature
          </Button>
        </Box>
      ) : (
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="textSecondary">
            Aucune signature à valider. Commencez par signer un document.
          </Typography>
        </Paper>
      )}
    </Box>
  );

  // Rendu de l'onglet d'audit
  const renderAuditTab = () => (
    <AuditTrail
      userId={userId}
      documentId={documentId}
      documentType={documentType}
      showFilters={true}
      showRealTime={false}
    />
  );

  return (
    <Box sx={{ p: 2 }}>
      {/* En-tête */}
      {renderHeader()}

      {/* Onglets */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          {tabs.map((tab, index) => (
            <Tab 
              key={index}
              icon={tab.icon} 
              label={tab.label}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>

      {/* Contenu des onglets */}
      <Box sx={{ minHeight: 400 }}>
        {activeTab === 0 && renderSignatureTab()}
        {activeTab === 1 && renderCertificatesTab()}
        {activeTab === 2 && renderValidationTab()}
        {activeTab === 3 && renderAuditTab()}
      </Box>

      {/* Dialog de signature */}
      <Dialog
        open={showSignatureDialog}
        onClose={() => setShowSignatureDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '70vh' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FingerprintIcon />
            <Typography variant="h6">
              Signature électronique - {documentTitle}
            </Typography>
          </Box>
          <IconButton onClick={() => setShowSignatureDialog(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info">
              <Typography variant="body2">
                Signez ci-dessous pour confirmer votre approbation du document.
                Votre signature sera horodatée et cryptographiquement sécurisée.
              </Typography>
            </Alert>

            {certificate && (
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Signataire:</strong> {certificate.subject.userName}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Organisation:</strong> {certificate.subject.organization}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Certificat:</strong> Valide jusqu'au {new Date(certificate.expiresAt).toLocaleDateString()}
                </Typography>
              </Paper>
            )}

            <DigitalSignaturePad
              onSignatureComplete={handleSignatureComplete}
              userId={userId}
              documentId={documentId}
              documentType={documentType}
              width={500}
              height={300}
              showControls={true}
              showPreview={true}
              enablePressureSensitivity={true}
              enableVelocityDetection={true}
            />
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowSignatureDialog(false)}>
            Annuler
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog d'aide */}
      <Dialog open={showHelp} onClose={() => setShowHelp(false)} maxWidth="md" fullWidth>
        <DialogTitle>Aide - Signature Électronique</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">Comment utiliser la signature électronique ?</Typography>
            
            <List>
              <ListItem>
                <ListItemIcon><PersonIcon /></ListItemIcon>
                <ListItemText 
                  primary="1. Vérifiez votre certificat"
                  secondary="Votre certificat doit être valide et non expiré"
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon><FingerprintIcon /></ListItemIcon>
                <ListItemText 
                  primary="2. Signez le document"
                  secondary="Utilisez votre doigt, stylet ou souris pour signer"
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon><CheckIcon /></ListItemIcon>
                <ListItemText 
                  primary="3. Validez la signature"
                  secondary="Le système vérifie automatiquement la validité"
                />
              </ListItem>
            </List>

            <Divider />

            <Typography variant="h6">Avantages de la signature électronique</Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Sécurité cryptographique" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Horodatage légal" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Traçabilité complète" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Détection de fraude" />
              </ListItem>
            </List>

            <Alert severity="warning">
              <Typography variant="body2">
                <strong>Important:</strong> Votre signature électronique a la même valeur légale 
                qu'une signature manuscrite traditional.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHelp(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SignatureInterface;