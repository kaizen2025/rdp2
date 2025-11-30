// src/components/ReturnLoanDialogResponsive.js - Dialog de retour optimisé mobile

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  Divider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Grid,
  Paper,
  Chip,
  Avatar,
  IconButton,
  LinearProgress,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  QrCodeScanner as QrCodeIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  AssignmentReturn as AssignmentReturnIcon,
  Fingerprint as FingerprintIcon,
  Close as CloseIcon,
  CameraAlt as CameraIcon,
  FlashOn as FlashIcon,
  FlashOff as FlashOffIcon,
  CameraAlt,
  CheckCircle,
  Cancel as CancelIcon
} from '@mui/icons-material';

import { useBreakpoint } from '../hooks/useBreakpoint';
import ResponsiveGrid from './responsive/ResponsiveGrid';
import { getAccessoryIcon } from '../config/accessoriesConfig';
import { QRCodeScanner } from './qr';

/**
 * Composant de signature digitale mobile-friendly
 */
const DigitalSignature = ({ 
  onSignatureChange, 
  width = 300, 
  height = 150,
  disabled = false 
}) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const { isMobile, isTouch } = useBreakpoint();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Configuration tactile
    canvas.style.touchAction = 'none';
    canvas.style.userSelect = 'none';
  }, []);

  const startDrawing = (e) => {
    if (disabled) return;
    setIsDrawing(true);
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX ? e.clientX - rect.left : e.touches[0].clientX - rect.left;
    const y = e.clientY ? e.clientY - rect.top : e.touches[0].clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing || disabled) return;
    
    e.preventDefault();
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX ? e.clientX - rect.left : e.touches[0].clientX - rect.left;
    const y = e.clientY ? e.clientY - rect.top : e.touches[0].clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    const signatureData = canvas.toDataURL();
    onSignatureChange?.(signatureData);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onSignatureChange?.(null);
  };

  return (
    <Box>
      <Box sx={{ 
        position: 'relative',
        border: '2px dashed #ccc',
        borderRadius: 2,
        overflow: 'hidden'
      }}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{
            display: 'block',
            cursor: disabled ? 'not-allowed' : 'crosshair',
            width: '100%',
            height: 'auto'
          }}
        />
        {!hasSignature && (
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
            color: 'text.secondary'
          }}>
            <FingerprintIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="body2">
              {disabled ? 'Signature désactivée' : 'Signez ici'}
            </Typography>
            {isMobile && (
              <Typography variant="caption">
                Utilisez votre doigt ou un stylet
              </Typography>
            )}
          </Box>
        )}
      </Box>
      
      {hasSignature && (
        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={clearSignature}
            disabled={disabled}
          >
            Effacer
          </Button>
          <Chip 
            label="Signature capturée" 
            color="success" 
            size="small"
            icon={<CheckCircleIcon />}
          />
        </Box>
      )}
    </Box>
  );
};

/**
 * Composant de scan QR optimisé mobile - Maintenant utilise QRCodeScanner
 */

const ReturnLoanDialogResponsive = ({
  open,
  onClose,
  loan,
  onReturn,
  enableQR = true,
  enableSignature = true
}) => {
  const theme = useTheme();
  const { isMobile, isTablet, isTouch } = useBreakpoint();
  
  // États
  const [returnNotes, setReturnNotes] = useState('');
  const [returnedAccessories, setReturnedAccessories] = useState([]);
  const [allAccessories, setAllAccessories] = useState([]);
  const [technicianConfirmed, setTechnicianConfirmed] = useState(false);
  const [signatureData, setSignatureData] = useState(null);
  const [activeTab, setActiveTab] = useState('manual'); // 'manual', 'qr', 'signature'
  const [qrActive, setQrActive] = useState(false);

  // Informations calculées
  const returnInfo = useMemo(() => {
    if (!loan) return null;
    const now = new Date();
    const expectedReturn = new Date(loan.expectedReturnDate);
    const daysLate = Math.max(0, Math.ceil((now - expectedReturn) / (1000 * 60 * 60 * 24)));
    return { isLate: daysLate > 0, daysLate, expectedReturnDate: expectedReturn };
  }, [loan]);

  const accessoriesInfo = useMemo(() => {
    if (!loan || !loan.accessories || loan.accessories.length === 0 || allAccessories.length === 0) {
      return { hasAccessories: false, allReturned: true, missingCount: 0, missingNames: [] };
    }
    const loanedAccessories = loan.accessories || [];
    const missingAccessories = loanedAccessories.filter(id => !returnedAccessories.includes(id));
    const missingNames = missingAccessories.map(id => allAccessories.find(a => a.id === id)?.name).filter(Boolean);
    return { 
      hasAccessories: true, 
      loanedAccessories, 
      returnedAccessories, 
      missingAccessories, 
      allReturned: missingAccessories.length === 0, 
      missingCount: missingAccessories.length, 
      missingNames 
    };
  }, [loan, returnedAccessories, allAccessories]);

  // Initialisation
  useEffect(() => {
    if (open && loan) {
      // Charger les accessoires
      const mockAccessories = [
        { id: 1, name: 'Souris', icon: 'mouse' },
        { id: 2, name: 'Clavier', icon: 'keyboard' },
        { id: 3, name: 'Chargeur', icon: 'charger' },
        { id: 4, name: 'Sac', icon: 'bag' }
      ];
      setAllAccessories(mockAccessories);
      
      // Pré-cocher tous les accessoires par défaut
      setReturnedAccessories(loan.accessories || []);
      setReturnNotes('');
      setTechnicianConfirmed(false);
      setSignatureData(null);
    }
  }, [open, loan]);

  // Gestion des accessoires
  const handleAccessoryToggle = (accessoryId) => {
    setReturnedAccessories(prev => 
      prev.includes(accessoryId) 
        ? prev.filter(id => id !== accessoryId)
        : [...prev, accessoryId]
    );
  };

  // Gestion du scan QR
  const handleQRScan = (scanData) => {
    console.log('QR Scanned:', scanData);
    
    // Vérifier si c'est un ordinateur ou un prêt
    if (scanData.itemType === 'computer') {
      // Vérifier que c'est bien l'ordinateur du prêt
      if (scanData.itemId === loan.computerId || scanData.qrId === loan.computerId) {
        console.log('Ordinateur du prêt scanné avec succès');
        // Ici on pourrait valider que c'est le bon ordinateur
      }
    } else if (scanData.itemType === 'loan') {
      // Scanner un QR de prêt
      if (scanData.computerId === loan.computerId || scanData.loanId === loan.id) {
        console.log('QR de prêt scanné avec succès');
        // Auto-remplir les informations si nécessaire
      }
    }
    
    setQrActive(false);
  };

  const handleQRScanError = (error) => {
    console.error('Erreur scan QR:', error);
    setQrActive(false);
    // Afficher une erreur à l'utilisateur
  };

  // Soumission finale
  const handleReturn = () => {
    let finalNotes = returnNotes;
    
    // Ajouter automatiquement les informations de manquants
    if (!accessoriesInfo.allReturned) {
      const missingNote = `\n\n⚠️ Accessoires manquants au retour : ${accessoriesInfo.missingNames.join(', ')}.`;
      finalNotes += missingNote;
    }

    const accessoryInfoForDb = { 
      returnedAccessories, 
      loanedAccessories: loan.accessories || [],
      qrCode: qrActive ? 'SCANNED-QR-DATA' : null,
      signature: enableSignature ? {
        technicianSignature: signatureData,
        technicianConfirmation: technicianConfirmed,
        date: new Date().toISOString()
      } : {
        technicianConfirmation: technicianConfirmed,
        date: new Date().toISOString()
      }
    };

    onReturn(loan, finalNotes, accessoryInfoForDb);
  };

  if (!loan || !returnInfo) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth={isMobile}
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          height: isMobile ? '100vh' : '90vh',
          margin: isMobile ? 0 : 2
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isMobile && (
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          )}
          <AssignmentReturnIcon />
          <Typography variant="h6">
            Retour de prêt
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ flex: 1, overflow: 'auto' }}>
        {/* Informations du prêt */}
        <ResponsiveGrid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Ordinateur
              </Typography>
              <Typography variant="h6">
                {loan.computerName}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Utilisateur
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 32, height: 32 }}>
                  {(loan.userDisplayName || loan.userName || '?').charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="h6">
                  {loan.userDisplayName || loan.userName}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </ResponsiveGrid>

        {/* Alerte de retard */}
        {returnInfo.isLate ? (
          <Alert 
            severity="warning" 
            icon={<WarningIcon />}
            sx={{ mb: 2 }}
          >
            <Typography variant="body2" fontWeight="bold">
              Retard de {returnInfo.daysLate} jour(s)
            </Typography>
            <Typography variant="caption">
              Date de retour prévue : {returnInfo.expectedReturnDate.toLocaleDateString()}
            </Typography>
          </Alert>
        ) : (
          <Alert 
            severity="success" 
            icon={<CheckCircleIcon />}
            sx={{ mb: 2 }}
          >
            <Typography variant="body2">
              Retour dans les délais ✓
            </Typography>
          </Alert>
        )}

        {/* Scanner QR */}
        {enableQR && qrActive && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                📱 Scanner QR Code - Retour de prêt
              </Typography>
              <IconButton onClick={() => setQrActive(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
            
            <QRCodeScanner
              onScan={handleQRScan}
              onError={handleQRScanError}
              allowedTypes={['computer', 'loan']}
              showBatchMode={false}
              showHistory={false}
              continuousScan={false}
            />
            
            <Alert severity="info" sx={{ mt: 2 }}>
              Scannez le QR code de l'ordinateur ou du prêt pour validation automatique.
            </Alert>
          </Paper>
        )}

        {/* Vérification des accessoires */}
        {accessoriesInfo.hasAccessories && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                📦 Vérification des accessoires
              </Typography>
              {enableQR && (
                <Button
                  variant="outlined"
                  startIcon={<QrCodeIcon />}
                  onClick={() => setQrActive(!qrActive)}
                  size="small"
                >
                  Scanner QR
                </Button>
              )}
            </Box>
            
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              {isMobile ? 'Décochez les accessoires manquants' : 'Cochez/décochez les accessoires retournés'}
            </Typography>
            
            <FormGroup>
              <ResponsiveGrid container spacing={1}>
                {accessoriesInfo.loanedAccessories.map(accId => {
                  const accessory = allAccessories.find(a => a.id === accId);
                  if (!accessory) return null;
                  
                  const isReturned = returnedAccessories.includes(accId);
                  
                  return (
                    <Grid item xs={12} sm={6} key={accId}>
                      <Paper 
                        sx={{ 
                          p: 1.5, 
                          border: isReturned ? '2px solid' : '1px solid',
                          borderColor: isReturned ? 'success.main' : 'divider',
                          bgcolor: isReturned ? 'success.light' : 'background.paper'
                        }}
                      >
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={isReturned}
                              onChange={() => handleAccessoryToggle(accId)}
                              icon={<CheckCircleIcon />}
                              checkedIcon={<CheckCircle />}
                            />
                          }
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getAccessoryIcon(accessory.icon)}
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  {accessory.name}
                                </Typography>
                                {isReturned ? (
                                  <Chip 
                                    label="Retourné" 
                                    color="success" 
                                    size="small"
                                    sx={{ mt: 0.5 }}
                                  />
                                ) : (
                                  <Chip 
                                    label="Manquant" 
                                    color="error" 
                                    size="small"
                                    sx={{ mt: 0.5 }}
                                  />
                                )}
                              </Box>
                            </Box>
                          }
                        />
                      </Paper>
                    </Grid>
                  );
                })}
              </ResponsiveGrid>
            </FormGroup>
            
            {/* Alertes sur les manquants */}
            {!accessoriesInfo.allReturned && (
              <Alert 
                severity="error" 
                icon={<ErrorIcon />}
                sx={{ mt: 2 }}
              >
                <Typography variant="body2">
                  ⚠️ <strong>{accessoriesInfo.missingCount} accessoire(s) manquant(s)</strong>
                </Typography>
                <Typography variant="caption">
                  Une note sera automatiquement ajoutée au rapport.
                </Typography>
              </Alert>
            )}
            
            {accessoriesInfo.allReturned && (
              <Alert 
                severity="success" 
                icon={<CheckCircleIcon />}
                sx={{ mt: 2 }}
              >
                <Typography variant="body2">
                  ✓ Tous les accessoires semblent être retournés
                </Typography>
              </Alert>
            )}
          </Paper>
        )}

        {/* Notes de retour */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            📝 Notes de retour
          </Typography>
          <TextField
            label="État de l'ordinateur, problèmes rencontrés, etc."
            multiline
            rows={isMobile ? 4 : 3}
            fullWidth
            value={returnNotes}
            onChange={(e) => setReturnNotes(e.target.value)}
            placeholder="Ajoutez des informations sur l'état du matériel..."
          />
        </Paper>

        {/* Signature digitale */}
        {enableSignature && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              ✍️ Signature du technicien
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Signez ci-dessous pour confirmer la réception du matériel
            </Typography>
            
            <DigitalSignature
              onSignatureChange={setSignatureData}
              width={isMobile ? 350 : 400}
              height={isMobile ? 200 : 150}
            />
          </Paper>
        )}

        {/* Confirmation finale */}
        <Paper sx={{ p: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={technicianConfirmed}
                onChange={(e) => setTechnicianConfirmed(e.target.checked)}
              />
            }
            label={
              <Typography variant="body2">
                Je certifie avoir reçu le matériel en date du {new Date().toLocaleDateString()} 
                et avoir vérifié son état.
              </Typography>
            }
          />
          
          {technicianConfirmed && (
            <Chip 
              label="Confirmation enregistrée" 
              color="success" 
              icon={<CheckCircleIcon />}
              sx={{ mt: 1 }}
            />
          )}
        </Paper>
      </DialogContent>

      {/* Actions */}
      <DialogActions sx={{ 
        p: 2,
        borderTop: 1,
        borderColor: 'divider',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 1 : 0
      }}>
        {isMobile ? (
          <>
            <Button
              fullWidth
              variant="contained"
              color={accessoriesInfo.allReturned ? "success" : "warning"}
              startIcon={<AssignmentReturnIcon />}
              onClick={handleReturn}
              disabled={!technicianConfirmed}
              sx={{ py: 1.5 }}
            >
              {accessoriesInfo.allReturned ? "Confirmer le retour" : "Retour avec manquants"}
            </Button>
            
            <Button fullWidth onClick={onClose}>
              Annuler
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onClose}>
              Annuler
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              color={accessoriesInfo.allReturned ? "success" : "warning"}
              startIcon={<AssignmentReturnIcon />}
              onClick={handleReturn}
              disabled={!technicianConfirmed}
            >
              {accessoriesInfo.allReturned ? "Confirmer le retour" : "Retour avec manquants"}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ReturnLoanDialogResponsive;