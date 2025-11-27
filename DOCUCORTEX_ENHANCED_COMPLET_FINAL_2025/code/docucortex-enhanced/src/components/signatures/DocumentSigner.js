/**
 * DocumentSigner.js - Signateur de documents complet
 * 
 * Fonctionnalités:
 * - Interface de signature pour différents types de documents
 * - Support multi-pages et multi-signatures
 * - Prévisualisation avant signature
 * - Génération automatique de PDF
 * - Intégration avec le workflow de signature
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Alert,
  Divider,
  Grid,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Tooltip,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Checkbox,
  FormControlLabel,
  Avatar,
  Badge
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Preview as PreviewIcon,
  Fingerprint as SignatureIcon,
  CheckCircle as CheckIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Send as SendIcon,
  AttachFile as AttachIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Lock as LockIcon
} from '@mui/icons-material';

import DigitalSignaturePad from './DigitalSignaturePad';
import SignatureWorkflow from './SignatureWorkflow';
import eSignatureService from '../../services/eSignatureService';

const DocumentSigner = ({
  documentType = 'loan',
  documentId,
  documentTitle,
  documentData,
  onDocumentSigned,
  requiredSigners = [],
  optionalSigners = [],
  userId,
  enableWorkflow = true,
  showPreview = true,
  allowMultiPage = true
}) => {
  // États du composant
  const [activeStep, setActiveStep] = useState(0);
  const [document, setDocument] = useState(documentData);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [signatures, setSignatures] = useState([]);
  const [currentSignature, setCurrentSignature] = useState(null);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [signatureSettings, setSignatureSettings] = useState({
    position: { x: 0, y: 0, page: 1 },
    style: { fontSize: 12, color: '#000000' },
    includeMetadata: true,
    includeTimestamp: true
  });
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [generatedPDF, setGeneratedPDF] = useState(null);
  const [workflowStarted, setWorkflowStarted] = useState(false);

  // Configuration des étapes
  const steps = [
    { label: 'Préparation', icon: <ScheduleIcon /> },
    { label: 'Prévisualisation', icon: <PreviewIcon /> },
    { label: 'Signature', icon: <SignatureIcon /> },
    { label: 'Génération PDF', icon: <PdfIcon /> },
    { label: 'Finalisation', icon: <CheckIcon /> }
  ];

  // Charger et préparer le document
  useEffect(() => {
    if (documentData) {
      prepareDocument();
    }
  }, [documentData]);

  // Préparer le document pour la signature
  const prepareDocument = async () => {
    try {
      // Générer la prévisualisation
      const previewData = generateDocumentPreview();
      setPreviewUrl(previewData);

      // Initialiser les métadonnées de signature
      const documentMetadata = {
        id: documentId,
        type: documentType,
        title: documentTitle,
        content: documentData,
        signatureFields: [],
        signatures: [],
        created: new Date().toISOString(),
        pageCount: calculatePageCount()
      };

      setDocument(documentMetadata);
    } catch (error) {
      console.error('Erreur lors de la préparation du document:', error);
    }
  };

  // Générer la prévisualisation du document
  const generateDocumentPreview = () => {
    // Simulation de génération de preview
    return `data:application/pdf;base64,${generateMockPDFBase64()}`;
  };

  // Calculer le nombre de pages (simulation)
  const calculatePageCount = () => {
    const contentSize = JSON.stringify(documentData).length;
    return Math.max(1, Math.ceil(contentSize / 1000));
  };

  // Générer un PDF mock (en production, utiliser PDF-lib)
  const generateMockPDFBase64 = () => {
    const mockPDFContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 18 Tf
50 700 Td
(${documentTitle}) Tj
0 -30 Td
/F1 12 Tf
(Type de document: ${documentType}) Tj
0 -50 Td
(Contenu du document...) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000173 00000 n 
0000000301 00000 n 
0000000380 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
492
%%EOF`;
    
    return btoa(mockPDFContent);
  };

  // Commencer la signature
  const startSignature = () => {
    if (enableWorkflow && (requiredSigners.length > 0 || optionalSigners.length > 0)) {
      setWorkflowStarted(true);
    } else {
      setShowSignatureDialog(true);
    }
  };

  // Finaliser une signature individuelle
  const handleSignatureComplete = async (signatureData) => {
    try {
      setIsLoading(true);
      
      // Créer l'entrée de signature
      const signatureEntry = {
        id: `signature_${Date.now()}`,
        userId,
        documentId,
        documentType,
        timestamp: new Date().toISOString(),
        position: signatureSettings.position,
        style: signatureSettings.style,
        signatureData: signatureData,
        metadata: {
          ipAddress: '192.168.1.100',
          userAgent: navigator.userAgent,
          sessionId: `session_${Date.now()}`,
          ...signatureData.metadata
        }
      };

      // Ajouter la signature au document
      setSignatures(prev => [...prev, signatureEntry]);

      // Finaliser la signature via le service
      const finalizedSignature = await eSignatureService.signData(
        signatureEntry,
        userId,
        {
          documentType,
          documentId,
          position: signatureSettings.position
        }
      );

      setCurrentSignature(finalizedSignature);
      setShowSignatureDialog(false);

      // Avancer à l'étape suivante si pas de workflow
      if (!workflowStarted && activeStep < steps.length - 1) {
        setTimeout(() => setActiveStep(activeStep + 1), 1000);
      }

    } catch (error) {
      console.error('Erreur lors de la signature:', error);
      alert('Erreur lors de la finalisation de la signature');
    } finally {
      setIsLoading(false);
    }
  };

  // Générer le PDF final
  const generateFinalPDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      // Simulation de génération PDF avec signatures intégrées
      const pdfData = await generateSignedPDF();
      setGeneratedPDF(pdfData);
      
      // Avancer à l'étape suivante
      if (activeStep < steps.length - 1) {
        setActiveStep(activeStep + 1);
      }
      
    } catch (error) {
      console.error('Erreur lors de la génération PDF:', error);
      alert('Erreur lors de la génération du PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Générer un PDF signé (simulation)
  const generateSignedPDF = async () => {
    // En production, utiliser PDF-lib pour intégrer les signatures
    const pdfContent = {
      originalDocument: document,
      signatures: signatures,
      generatedAt: new Date().toISOString(),
      signatureCount: signatures.length,
      isComplete: signatures.length >= requiredSigners.length
    };

    // Simuler la génération
    return {
      url: URL.createObjectURL(new Blob([JSON.stringify(pdfContent)], { type: 'application/pdf' })),
      size: JSON.stringify(pdfContent).length,
      pages: document.pageCount,
      signatures: signatures.length
    };
  };

  // Finaliser le document
  const finalizeDocument = async () => {
    try {
      const finalizedDoc = {
        ...document,
        signatures,
        status: 'signed',
        signedAt: new Date().toISOString(),
        signedBy: signatures.map(sig => sig.userId),
        isComplete: signatures.length >= requiredSigners.length,
        pdfUrl: generatedPDF?.url
      };

      // Notifier le parent
      if (onDocumentSigned) {
        onDocumentSigned(finalizedDoc);
      }

      // Optionnel: télécharger le PDF
      if (generatedPDF?.url) {
        const link = document.createElement('a');
        link.href = generatedPDF.url;
        link.download = `${documentTitle}_signed.pdf`;
        link.click();
      }

    } catch (error) {
      console.error('Erreur lors de la finalisation:', error);
      alert('Erreur lors de la finalisation du document');
    }
  };

  // Rendu du contenu d'étape
  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Préparation
        return renderPreparationStep();
      case 1: // Prévisualisation
        return renderPreviewStep();
      case 2: // Signature
        return renderSignatureStep();
      case 3: // Génération PDF
        return renderPDFGenerationStep();
      case 4: // Finalisation
        return renderFinalizationStep();
      default:
        return null;
    }
  };

  // Étape de préparation
  const renderPreparationStep = () => (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          Préparation du document pour la signature électronique.
          Toutes les signatures seront horodatées et sécurisées cryptographiquement.
        </Typography>
      </Alert>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Informations du document" />
            <CardContent>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Titre" 
                    secondary={documentTitle}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Type" 
                    secondary={documentType}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Pages" 
                    secondary={`${document.pageCount || 1} page(s)`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Signatures requises" 
                    secondary={`${requiredSigners.length} obligatoire(s)`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Paramètres de signature" />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl size="small">
                  <InputLabel>Position</InputLabel>
                  <Select
                    value={signatureSettings.position.page}
                    label="Position"
                    onChange={(e) => setSignatureSettings(prev => ({
                      ...prev,
                      position: { ...prev.position, page: e.target.value }
                    }))}
                  >
                    {Array.from({ length: document.pageCount || 1 }, (_, i) => (
                      <MenuItem key={i + 1} value={i + 1}>
                        Page {i + 1}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={signatureSettings.includeTimestamp}
                      onChange={(e) => setSignatureSettings(prev => ({
                        ...prev,
                        includeTimestamp: e.target.checked
                      }))}
                    />
                  }
                  label="Inclure l'horodatage"
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={signatureSettings.includeMetadata}
                      onChange={(e) => setSignatureSettings(prev => ({
                        ...prev,
                        includeMetadata: e.target.checked
                      }))}
                    />
                  }
                  label="Inclure les métadonnées"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  // Étape de prévisualisation
  const renderPreviewStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Prévisualisation du document
      </Typography>
      
      {previewUrl && (
        <Box sx={{ border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden' }}>
          <iframe
            src={previewUrl}
            width="100%"
            height="600"
            style={{ border: 'none' }}
            title="Aperçu du document"
          />
        </Box>
      )}

      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          Vérifiez que le document est correct avant de procéder à la signature.
        </Typography>
      </Alert>
    </Box>
  );

  // Étape de signature
  const renderSignatureStep = () => {
    if (workflowStarted && enableWorkflow) {
      return (
        <SignatureWorkflow
          workflowId={`workflow_${documentId}`}
          documentType={documentType}
          documentId={documentId}
          documentTitle={documentTitle}
          requiredSigners={requiredSigners}
          optionalSigners={optionalSigners}
          onWorkflowComplete={(result) => {
            setSignatures(result.signatures);
            setActiveStep(3);
          }}
          onSignatureRequired={(signature) => {
            console.log('Signature requise:', signature);
          }}
        />
      );
    }

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Signature électronique
        </Typography>
        
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Signez ci-dessous pour confirmer votre approbation du document.
            Votre signature sera sécurisée et légalement contraignante.
          </Typography>
        </Alert>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <DigitalSignaturePad
            onSignatureComplete={handleSignatureComplete}
            userId={userId}
            documentId={documentId}
            documentType={documentType}
            width={500}
            height={300}
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<SignatureIcon />}
            onClick={() => setShowSignatureDialog(true)}
          >
            Ouvrir le tablette de signature
          </Button>
        </Box>
      </Box>
    );
  };

  // Étape de génération PDF
  const renderPDFGenerationStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Génération du PDF final
      </Typography>

      {isGeneratingPDF ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
          <CircularProgress size={48} />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Génération du PDF en cours...
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Intégration des signatures et finalisation du document
          </Typography>
        </Box>
      ) : generatedPDF ? (
        <Box>
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="body2">
              PDF généré avec succès ! ({generatedPDF.signatures} signature(s) intégrée(s))
            </Typography>
          </Alert>

          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardHeader title="Informations du PDF" />
                <CardContent>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Taille" 
                        secondary={`${(generatedPDF.size / 1024).toFixed(1)} KB`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Pages" 
                        secondary={generatedPDF.pages}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Signatures" 
                        secondary={generatedPDF.signatures}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title="Actions" />
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = generatedPDF.url;
                        link.download = `${documentTitle}_signed.pdf`;
                        link.click();
                      }}
                    >
                      Télécharger
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<ViewIcon />}
                      onClick={() => window.open(generatedPDF.url, '_blank')}
                    >
                      Prévisualiser
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Button
            variant="contained"
            startIcon={<PdfIcon />}
            onClick={generateFinalPDF}
            size="large"
          >
            Générer le PDF final
          </Button>
        </Box>
      )}
    </Box>
  );

  // Étape de finalisation
  const renderFinalizationStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Document finalisé
      </Typography>

      <Alert severity="success" sx={{ mb: 2 }}>
        <Typography variant="body2">
          Le document a été signé avec succès et est maintenant légalement contraignant.
        </Typography>
      </Alert>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Résumé" />
            <CardContent>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <SignatureIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Signatures" 
                    secondary={`${signatures.length} signature(s) collectée(s)`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ScheduleIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Finalisé le" 
                    secondary={new Date().toLocaleString()}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <PdfIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Document PDF" 
                    secondary="Généré et prêt"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Actions" />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={finalizeDocument}
                  fullWidth
                >
                  Télécharger le document final
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<SendIcon />}
                  onClick={() => {
                    // Envoyer par email ou autre méthode
                    console.log('Envoi du document...');
                  }}
                  fullWidth
                >
                  Envoyer
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Box sx={{ p: 2 }}>
      {/* En-tête */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" gutterBottom>
              Signateur de Documents
            </Typography>
            <Typography variant="h6" color="textSecondary">
              {documentTitle}
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'right' }}>
            <Chip 
              label={`Étape ${activeStep + 1}/${steps.length}`}
              color="primary"
              sx={{ mb: 1 }}
            />
            <Typography variant="caption" display="block">
              {steps[activeStep].label}
            </Typography>
          </Box>
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mt: 2 }}>
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel icon={step.icon}>
                {step.label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Contenu de l'étape */}
      <Paper sx={{ p: 3 }}>
        {renderStepContent()}
      </Paper>

      {/* Navigation */}
      <Paper sx={{ p: 2, mt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={activeStep === 0}
            onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
          >
            Précédent
          </Button>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {activeStep === 0 && (
              <Button
                variant="contained"
                onClick={() => setActiveStep(1)}
                disabled={!document}
              >
                Suivant
              </Button>
            )}
            
            {activeStep === 1 && (
              <Button
                variant="contained"
                onClick={startSignature}
              >
                Commencer la signature
              </Button>
            )}

            {activeStep === 2 && !workflowStarted && (
              <Button
                variant="contained"
                onClick={() => setActiveStep(3)}
                disabled={signatures.length === 0}
              >
                Générer le PDF
              </Button>
            )}

            {activeStep === 3 && generatedPDF && (
              <Button
                variant="contained"
                onClick={() => setActiveStep(4)}
              >
                Finaliser
              </Button>
            )}

            {activeStep === 4 && (
              <Button
                variant="contained"
                onClick={finalizeDocument}
              >
                Terminer
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Dialog de signature individuelle */}
      <Dialog
        open={showSignatureDialog}
        onClose={() => setShowSignatureDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Signature électronique</DialogTitle>
        <DialogContent>
          <DigitalSignaturePad
            onSignatureComplete={handleSignatureComplete}
            userId={userId}
            documentId={documentId}
            documentType={documentType}
            width={500}
            height={300}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSignatureDialog(false)}>
            Annuler
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentSigner;