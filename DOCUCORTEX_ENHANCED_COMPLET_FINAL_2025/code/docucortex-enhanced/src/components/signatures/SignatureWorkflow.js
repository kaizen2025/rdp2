/**
 * SignatureWorkflow.js - Processus de signature avec workflow
 * 
 * Fonctionnalités:
 * - Workflow de signature étape par étape
 * - Signatures multiples avec approbations
 * - Gestion des rôles et permissions
 * - Suivi en temps réel du processus
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  LinearProgress,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Send as SendIcon,
  Visibility as VisibilityIcon,
  Comment as CommentIcon,
  ThumbUp as ApproveIcon,
  ThumbDown as RejectIcon,
  PriorityHigh as PriorityHighIcon,
  Group as GroupIcon,
  Lock as LockIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';

import DigitalSignaturePad from './DigitalSignaturePad';

const SignatureWorkflow = ({
  workflowId,
  documentType,
  documentId,
  documentTitle,
  requiredSigners = [],
  optionalSigners = [],
  onWorkflowComplete,
  onSignatureRequired,
  initialSignatures = []
}) => {
  // États du workflow
  const [activeStep, setActiveStep] = useState(0);
  const [workflowStatus, setWorkflowStatus] = useState('pending');
  const [signatures, setSignatures] = useState(initialSignatures);
  const [currentSigner, setCurrentSigner] = useState(null);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [workflowComments, setWorkflowComments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Configuration des étapes
  const steps = [
    {
      label: 'Initialisation',
      description: 'Préparation du workflow',
      icon: <ScheduleIcon />,
      completed: true
    },
    {
      label: 'Signatures requises',
      description: `${requiredSigners.length} signature(s) nécessaire(s)`,
      icon: <LockIcon />,
      completed: signatures.filter(sig => requiredSigners.some(req => req.id === sig.signerId)).length >= requiredSigners.length
    },
    {
      label: 'Signatures optionnelles',
      description: `${signatures.filter(sig => optionalSigners.some(opt => opt.id === sig.signerId)).length}/${optionalSigners.length} complétées`,
      icon: <GroupIcon />,
      completed: false
    },
    {
      label: 'Validation finale',
      description: 'Vérification et finalisation',
      icon: <VerifiedIcon />,
      completed: workflowStatus === 'completed'
    }
  ];

  // Progression du workflow
  const progress = (signatures.length / (requiredSigners.length + optionalSigners.length)) * 100;

  // Déterminer le prochain signataire
  const getNextSigner = useCallback(() => {
    // D'abord, chercher les signatures requises manquantes
    const pendingRequired = requiredSigners.filter(
      req => !signatures.some(sig => sig.signerId === req.id && sig.status === 'signed')
    );

    if (pendingRequired.length > 0) {
      return pendingRequired[0];
    }

    // Ensuite, chercher les signatures optionnelles
    const pendingOptional = optionalSigners.filter(
      opt => !signatures.some(sig => sig.signerId === opt.id && sig.status === 'signed')
    );

    return pendingOptional.length > 0 ? pendingOptional[0] : null;
  }, [requiredSigners, optionalSignatures, signatures]);

  // Gérer une nouvelle signature
  const handleSignatureStart = (signer) => {
    setCurrentSigner(signer);
    setShowSignatureDialog(true);
  };

  // Finaliser une signature
  const handleSignatureComplete = async (signatureData) => {
    if (!currentSigner) return;

    setIsLoading(true);
    
    try {
      const newSignature = {
        id: `sig_${Date.now()}`,
        signerId: currentSigner.id,
        signerName: currentSigner.name,
        signerRole: currentSigner.role,
        timestamp: new Date().toISOString(),
        status: 'signed',
        signature: signatureData,
        workflowId: workflowId,
        documentType: documentType,
        documentId: documentId,
        metadata: {
          ipAddress: '192.168.1.100', // Simulation
          userAgent: navigator.userAgent,
          sessionId: `sess_${Date.now()}`
        }
      };

      setSignatures(prev => [...prev, newSignature]);
      setShowSignatureDialog(false);
      setCurrentSigner(null);

      // Vérifier si le workflow est complet
      const requiredSigned = signatures.filter(sig => 
        requiredSigners.some(req => req.id === sig.signerId)
      ).length;

      if (requiredSigned >= requiredSigners.length) {
        setWorkflowStatus('completed');
        if (onWorkflowComplete) {
          onWorkflowComplete({
            signatures,
            workflowId,
            status: 'completed',
            completedAt: new Date().toISOString()
          });
        }
      }

      // Notifier que la signature est requise
      if (onSignatureRequired) {
        onSignatureRequired(newSignature);
      }

    } catch (error) {
      console.error('Erreur lors de la signature:', error);
      alert('Erreur lors de la finalisation de la signature');
    } finally {
      setIsLoading(false);
    }
  };

  // Rejeter une signature
  const handleSignatureReject = (reason) => {
    if (!currentSigner) return;

    const rejection = {
      id: `rej_${Date.now()}`,
      signerId: currentSigner.id,
      signerName: currentSigner.name,
      signerRole: currentSigner.role,
      timestamp: new Date().toISOString(),
      status: 'rejected',
      reason: reason,
      workflowId: workflowId,
      documentType: documentType,
      documentId: documentId
    };

    setSignatures(prev => [...prev, rejection]);
    setShowSignatureDialog(false);
    setCurrentSigner(null);
    setWorkflowStatus('rejected');
  };

  // Obtenir le statut d'un signataire
  const getSignerStatus = (signer) => {
    const signature = signatures.find(sig => sig.signerId === signer.id);
    
    if (!signature) {
      return { status: 'pending', color: 'default', label: 'En attente' };
    }

    switch (signature.status) {
      case 'signed':
        return { status: 'signed', color: 'success', label: 'Signé' };
      case 'rejected':
        return { status: 'rejected', color: 'error', label: 'Rejeté' };
      default:
        return { status: 'pending', color: 'default', label: 'En attente' };
    }
  };

  // Obtenir la couleur de priorité
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* En-tête du workflow */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Workflow de Signature
            </Typography>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              {documentTitle}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Type: {documentType} | ID: {documentId}
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'right' }}>
            <Chip 
              label={workflowStatus === 'completed' ? 'Terminé' : 'En cours'} 
              color={workflowStatus === 'completed' ? 'success' : 'primary'}
              sx={{ mb: 1 }}
            />
            <Typography variant="body2">
              {signatures.length} signature(s) sur {requiredSigners.length + optionalSigners.length}
            </Typography>
          </Box>
        </Box>

        {/* Barre de progression */}
        <Box sx={{ mb: 2 }}>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
            Progression: {Math.round(progress)}%
          </Typography>
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} orientation="horizontal">
          {steps.map((step, index) => (
            <Step key={step.label} completed={step.completed}>
              <StepLabel icon={step.icon}>
                <Typography variant="body2">{step.label}</Typography>
                <Typography variant="caption" color="textSecondary">
                  {step.description}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Liste des signataires requis */}
      <Paper sx={{ mb: 2 }}>
        <CardHeader
          title="Signataires requis"
          subheader={`${requiredSigners.length} signature(s) obligatoire(s)`}
          avatar={<LockIcon color="primary" />}
        />
        <CardContent>
          <List>
            {requiredSigners.map((signer, index) => {
              const status = getSignerStatus(signer);
              const isCurrentUser = currentSigner?.id === signer.id;
              
              return (
                <ListItem key={signer.id}>
                  <ListItemAvatar>
                    <Badge
                      color={status.status === 'signed' ? 'success' : 'default'}
                      variant="dot"
                    >
                      <Avatar sx={{ bgcolor: status.status === 'signed' ? 'success.main' : 'primary.main' }}>
                        <PersonIcon />
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">{signer.name}</Typography>
                        <Chip 
                          label={signer.role} 
                          size="small" 
                          variant="outlined"
                        />
                        <Chip 
                          label={status.label} 
                          size="small" 
                          color={status.color}
                        />
                        {signer.priority && (
                          <PriorityHighIcon 
                            color={getPriorityColor(signer.priority)}
                            fontSize="small"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        {signer.department && (
                          <Typography variant="caption" color="textSecondary">
                            {signer.department}
                          </Typography>
                        )}
                        {signer.status === 'signed' && (
                          <Typography variant="caption" display="block" color="success.main">
                            Signé le {new Date(signer.signedAt || Date.now()).toLocaleString()}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    {status.status === 'pending' && !isCurrentUser && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleSignatureStart(signer)}
                      >
                        Signer
                      </Button>
                    )}
                    {status.status === 'signed' && (
                      <CheckCircleIcon color="success" />
                    )}
                    {status.status === 'rejected' && (
                      <Tooltip title={signer.reason || 'Rejeté'}>
                        <IconButton color="error">
                          <RejectIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        </CardContent>
      </Paper>

      {/* Liste des signataires optionnels */}
      {optionalSigners.length > 0 && (
        <Paper sx={{ mb: 2 }}>
          <CardHeader
            title="Signataires optionnels"
            subheader={`${optionalSigners.length} signature(s) optionnelle(s)`}
            avatar={<GroupIcon color="primary" />}
          />
          <CardContent>
            <List>
              {optionalSigners.map((signer, index) => {
                const status = getSignerStatus(signer);
                
                return (
                  <ListItem key={signer.id}>
                    <ListItemAvatar>
                      <Badge
                        color={status.status === 'signed' ? 'success' : 'default'}
                        variant="dot"
                      >
                        <Avatar sx={{ bgcolor: 'grey.400' }}>
                          <PersonIcon />
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">{signer.name}</Typography>
                          <Chip 
                            label={signer.role} 
                            size="small" 
                            variant="outlined"
                            color="secondary"
                          />
                          <Chip 
                            label={status.label} 
                            size="small" 
                            color={status.color}
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="textSecondary">
                          Signature optionnelle
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      {status.status === 'pending' && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleSignatureStart(signer)}
                        >
                          Signer
                        </Button>
                      )}
                      {status.status === 'signed' && (
                        <CheckCircleIcon color="success" />
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })}
            </List>
          </CardContent>
        </Paper>
      )}

      {/* Actions du workflow */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            Workflow ID: {workflowId}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<SendIcon />}
              onClick={() => {
                // Envoyer le workflow
                console.log('Envoi du workflow...');
              }}
            >
              Envoyer
            </Button>
            
            <Button
              variant="contained"
              startIcon={<VerifiedIcon />}
              disabled={workflowStatus !== 'completed'}
              onClick={() => {
                if (onWorkflowComplete) {
                  onWorkflowComplete({
                    signatures,
                    workflowId,
                    status: 'completed',
                    completedAt: new Date().toISOString()
                  });
                }
              }}
            >
              Finaliser
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Dialog de signature */}
      <Dialog 
        open={showSignatureDialog} 
        onClose={() => setShowSignatureDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Signature électronique - {currentSigner?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info">
              <Typography variant="body2">
                Veuillez signer ci-dessous pour confirmer votre approbation du document.
                Votre signature sera horodatée et cryptographiquement sécurisée.
              </Typography>
            </Alert>

            {currentSigner && (
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Signataire:</strong> {currentSigner.name}
                </Typography>
                <Typography variant="body2">
                  <strong>Rôle:</strong> {currentSigner.role}
                </Typography>
                <Typography variant="body2">
                  <strong>Document:</strong> {documentTitle}
                </Typography>
              </Box>
            )}

            <DigitalSignaturePad
              onSignatureComplete={handleSignatureComplete}
              userId={currentSigner?.id}
              documentId={documentId}
              documentType={documentType}
              width={500}
              height={300}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSignatureDialog(false)}>
            Annuler
          </Button>
          <Button 
            onClick={() => handleSignatureReject('Refusé par l\'utilisateur')}
            color="error"
          >
            Rejeter
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SignatureWorkflow;