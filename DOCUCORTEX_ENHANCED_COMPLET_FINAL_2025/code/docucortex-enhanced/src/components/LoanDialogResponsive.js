// src/components/LoanDialogResponsive.js - Dialog optimisé mobile avec formulaire multi-étapes

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Grid,
  Chip,
  Avatar,
  IconButton,
  Divider,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  QrCodeScanner as QrCodeIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Computer as ComputerIcon,
  AccessTime as AccessTimeIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { addDays } from 'date-fns';

import { useBreakpoint } from '../hooks/useBreakpoint';
import ResponsiveGrid from './responsive/ResponsiveGrid';
import { getAccessoryIcon } from '../config/accessoriesConfig';
import { QRCodeScanner } from './qr';

// Étapes du formulaire
const STEPS = [
  {
    label: 'Matériel',
    icon: <ComputerIcon />,
    description: 'Sélectionnez l\'ordinateur à prêter'
  },
  {
    label: 'Utilisateur',
    icon: <PersonIcon />,
    description: 'Choisissez l\'utilisateur bénéficiaire'
  },
  {
    label: 'Planning',
    icon: <AccessTimeIcon />,
    description: 'Dates de prêt et de retour'
  },
  {
    label: 'Accessoires',
    icon: <AssignmentIcon />,
    description: 'Accessoires inclus dans le prêt'
  },
  {
    label: 'Confirmation',
    icon: <CheckCircleIcon />,
    description: 'Révision finale et signature'
  }
];

const LoanDialogResponsive = ({
  open,
  onClose,
  loan,
  onSave,
  users,
  itStaff,
  computers = [],
  computer = null,
  enableQR = true
}) => {
  const theme = useTheme();
  const { isMobile, isTablet, isTouch } = useBreakpoint();
  const containerRef = useRef(null);
  
  // États du formulaire
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [availableAccessories, setAvailableAccessories] = useState([]);
  const [userConfirmed, setUserConfirmed] = useState(false);
  const [errors, setErrors] = useState({});
  const [scanMode, setScanMode] = useState(false);
  const [qrScanResult, setQrScanResult] = useState(null);
  
  const isEditMode = !!loan;
  const isSmallScreen = isMobile || isTablet;

  // Initialisation
  useEffect(() => {
    if (open) {
      // Charger les accessoires
      if (enableQR) {
        // Simulation du chargement QR
        setTimeout(() => setAvailableAccessories([]), 100);
      }

      if (isEditMode) {
        setFormData({
          ...loan,
          loanDate: new Date(loan.loanDate),
          expectedReturnDate: new Date(loan.expectedReturnDate),
          accessories: loan.accessories || [],
        });
        setUserConfirmed(true);
        setActiveStep(4); // Aller directement à la confirmation
      } else {
        const defaultStaff = itStaff.length > 0 ? itStaff[0] : '';
        setFormData({
          computerId: computer?.id || null,
          userName: '',
          userDisplayName: '',
          itStaff: defaultStaff,
          loanDate: new Date(),
          expectedReturnDate: addDays(new Date(), 7),
          notes: '',
          accessories: []
        });
        setUserConfirmed(false);
        setActiveStep(0);
      }
      
      // Reset du scan QR
      setQrScanResult(null);
    }
  }, [open, loan, isEditMode, computer, itStaff, enableQR]);

  // Gestion du scan QR
  const handleQRScan = (scanData) => {
    console.log('QR Scanned:', scanData);
    
    // Vérifier si c'est un ordinateur
    if (scanData.itemType === 'computer') {
      const computerExists = computers.find(c => c.id === scanData.itemId);
      if (computerExists) {
        setFormData(prev => ({
          ...prev,
          computerId: scanData.itemId
        }));
        setQrScanResult({
          success: true,
          message: `Ordinateur trouvé: ${scanData.name}`,
          item: computerExists
        });
        
        // Avancer automatiquement à l'étape suivante
        setTimeout(() => {
          if (activeStep < STEPS.length - 1) {
            setActiveStep(activeStep + 1);
          }
        }, 1000);
      } else {
        setQrScanResult({
          success: false,
          message: `Ordinateur non trouvé dans la base de données`,
          item: null
        });
      }
    } else {
      setQrScanResult({
        success: false,
        message: `QR Code non reconnu comme ordinateur (${scanData.itemType})`,
        item: null
      });
    }
  };

  const handleQRScanError = (error) => {
    console.error('Erreur scan QR:', error);
    setQrScanResult({
      success: false,
      message: `Erreur de scan: ${error.message}`,
      item: null
    });
  };

  // Validation par étape
  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 0: // Matériel
        if (!formData.computerId) newErrors.computerId = 'Veuillez sélectionner un ordinateur';
        break;
      case 1: // Utilisateur
        if (!formData.userName) newErrors.userName = 'Veuillez sélectionner un utilisateur';
        break;
      case 2: // Planning
        if (!formData.loanDate) newErrors.loanDate = 'Veuillez sélectionner une date de prêt';
        if (!formData.expectedReturnDate) newErrors.expectedReturnDate = 'Veuillez sélectionner une date de retour';
        if (formData.loanDate && formData.expectedReturnDate && formData.loanDate > formData.expectedReturnDate) {
          newErrors.expectedReturnDate = 'La date de retour doit être après la date de prêt';
        }
        break;
      case 4: // Confirmation
        if (!isEditMode && !userConfirmed) {
          newErrors.confirmation = 'Veuillez confirmer que l\'utilisateur a reçu le matériel';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation entre étapes
  const handleNext = () => {
    if (validateStep(activeStep)) {
      if (activeStep < STEPS.length - 1) {
        setActiveStep(activeStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    setActiveStep(Math.max(0, activeStep - 1));
    setErrors({});
  };

  // Soumission finale
  const handleSubmit = () => {
    if (!validateStep(activeStep)) return;

    if (!isEditMode && !userConfirmed) {
      alert('Veuillez confirmer que l\'utilisateur a bien reçu le matériel.');
      return;
    }

    const selectedComputer = computers.find(c => c.id === formData.computerId);
    const loanData = {
      ...formData,
      computerName: selectedComputer?.name || 'N/A',
      loanDate: formData.loanDate.toISOString(),
      expectedReturnDate: formData.expectedReturnDate.toISOString(),
      status: isEditMode ? loan.status : (new Date(formData.loanDate) > new Date() ? 'reserved' : 'active'),
      signature: {
        userConfirmation: userConfirmed,
        technicianName: itStaff[0], // À adapter selon le contexte
        date: new Date().toISOString()
      }
    };
    
    onSave(loanData);
  };

  // Rendu de l'étape actuelle
  const renderStepContent = (step) => {
    switch (step) {
      case 0: // Sélection du matériel
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Sélection de l'ordinateur
            </Typography>
            
            {/* Bouton QR scan */}
            {enableQR && (
              <Button
                fullWidth
                variant="outlined"
                startIcon={<QrCodeIcon />}
                onClick={() => setScanMode(!scanMode)}
                sx={{ mb: 2, py: 1.5 }}
              >
                {scanMode ? 'Fermer le scan' : 'Scanner un QR Code'}
              </Button>
            )}
            
            {/* Scanner QR */}
            {enableQR && scanMode && (
              <Box sx={{ mb: 2 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Positionnez le QR code de l'ordinateur dans le cadre pour scanner automatiquement.
                </Alert>
                
                <QRCodeScanner
                  onScan={handleQRScan}
                  onError={handleQRScanError}
                  allowedTypes={['computer']}
                  showBatchMode={false}
                  showHistory={false}
                  continuousScan={false}
                />
                
                {/* Résultat du scan */}
                {qrScanResult && (
                  <Alert 
                    severity={qrScanResult.success ? 'success' : 'error'}
                    sx={{ mt: 1 }}
                  >
                    {qrScanResult.message}
                  </Alert>
                )}
              </Box>
            )}
            
            <FormControl fullWidth required error={!!errors.computerId}>
              <InputLabel>Ordinateur</InputLabel>
              <Select
                value={formData.computerId || ''}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, computerId: e.target.value }));
                  setErrors(prev => ({...prev, computerId: ''}));
                }}
                label="Ordinateur"
                sx={{ 
                  '& .MuiSelect-select': {
                    display: 'flex',
                    alignItems: 'center'
                  }
                }}
              >
                {computers.filter(c => c.status === 'available' || c.id === loan?.computerId)
                  .map(comp => (
                  <MenuItem key={comp.id} value={comp.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ComputerIcon color="primary" fontSize="small" />
                      <Box>
                        <Typography variant="body2">{comp.name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {comp.brand} {comp.model}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {errors.computerId && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                  {errors.computerId}
                </Typography>
              )}
            </FormControl>
          </Box>
        );

      case 1: // Sélection utilisateur
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Utilisateur bénéficiaire
            </Typography>
            
            <Autocomplete
              options={users}
              value={users.find(u => u.username === formData.userName) || null}
              getOptionLabel={(option) => `${option.displayName || option.username} (${option.username})`}
              onChange={(event, newValue) => {
                setFormData(prev => ({
                  ...prev, 
                  userName: newValue ? newValue.username : '', 
                  userDisplayName: newValue ? newValue.displayName : ''
                }));
                setErrors(prev => ({...prev, userName: ''}));
              }}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Utilisateur" 
                  required 
                  error={!!errors.userName} 
                  helperText={errors.userName}
                  fullWidth
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                    {(option.displayName || option.username).charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="body2">{option.displayName || option.username}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {option.department || 'Aucun département'}
                    </Typography>
                  </Box>
                </Box>
              )}
            />
            
            {formData.userName && (
              <Paper sx={{ p: 2, mt: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <Typography variant="subtitle2">
                  Utilisateur sélectionné :
                </Typography>
                <Typography variant="body2">
                  {formData.userDisplayName || formData.userName}
                </Typography>
              </Paper>
            )}
          </Box>
        );

      case 2: // Dates et planning
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Planning du prêt
            </Typography>
            
            <ResponsiveGrid container spacing={2}>
              <Grid item xs={12}>
                <DatePicker
                  label="Date de début"
                  value={formData.loanDate}
                  onChange={(value) => setFormData(prev => ({ ...prev, loanDate: value }))}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      fullWidth 
                      required 
                      error={!!errors.loanDate}
                      helperText={errors.loanDate}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <DatePicker
                  label="Date de retour prévue"
                  value={formData.expectedReturnDate}
                  onChange={(value) => setFormData(prev => ({ ...prev, expectedReturnDate: value }))}
                  minDate={formData.loanDate}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      fullWidth 
                      required 
                      error={!!errors.expectedReturnDate}
                      helperText={errors.expectedReturnDate}
                    />
                  )}
                />
              </Grid>
            </ResponsiveGrid>
            
            {formData.loanDate && formData.expectedReturnDate && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Durée prévue : {Math.ceil((formData.expectedReturnDate - formData.loanDate) / (1000 * 60 * 60 * 24))} jour(s)
              </Alert>
            )}
          </Box>
        );

      case 3: // Accessoires
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Accessoires inclus
            </Typography>
            
            <FormGroup>
              <ResponsiveGrid container spacing={1}>
                {availableAccessories.map(accessory => (
                  <Grid item xs={12} sm={6} key={accessory.id}>
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={formData.accessories?.includes(accessory.id) || false}
                          onChange={() => {
                            setFormData(prev => ({
                              ...prev,
                              accessories: prev.accessories?.includes(accessory.id)
                                ? prev.accessories.filter(id => id !== accessory.id)
                                : [...(prev.accessories || []), accessory.id]
                            }));
                          }}
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getAccessoryIcon(accessory.icon)}
                          <Box>
                            <Typography variant="body2">{accessory.name}</Typography>
                            {accessory.description && (
                              <Typography variant="caption" color="textSecondary">
                                {accessory.description}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      }
                    />
                  </Grid>
                ))}
              </ResponsiveGrid>
            </FormGroup>
            
            {availableAccessories.length === 0 && (
              <Alert severity="info">
                Aucun accessoire disponible ou configuration en cours de chargement.
              </Alert>
            )}
            
            <TextField
              label="Notes (optionnel)"
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              fullWidth
              multiline
              rows={3}
              sx={{ mt: 2 }}
            />
          </Box>
        );

      case 4: // Confirmation
        const selectedComputer = computers.find(c => c.id === formData.computerId);
        const selectedUser = users.find(u => u.username === formData.userName);
        
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Confirmation du prêt
            </Typography>
            
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                📱 Matériel
              </Typography>
              <Typography variant="body2">
                {selectedComputer?.name} - {selectedComputer?.brand} {selectedComputer?.model}
              </Typography>
            </Paper>
            
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                👤 Utilisateur
              </Typography>
              <Typography variant="body2">
                {selectedUser?.displayName || selectedUser?.username}
              </Typography>
              {selectedUser?.department && (
                <Typography variant="caption" color="textSecondary">
                  {selectedUser.department}
                </Typography>
              )}
            </Paper>
            
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                📅 Dates
              </Typography>
              <Typography variant="body2">
                Du {formData.loanDate?.toLocaleDateString()} au {formData.expectedReturnDate?.toLocaleDateString()}
              </Typography>
            </Paper>
            
            {formData.accessories && formData.accessories.length > 0 && (
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  📦 Accessoires
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.accessories.map(accId => {
                    const accessory = availableAccessories.find(a => a.id === accId);
                    return accessory ? (
                      <Chip 
                        key={accId}
                        label={accessory.name}
                        icon={getAccessoryIcon(accessory.icon)}
                        size="small"
                      />
                    ) : null;
                  })}
                </Box>
              </Paper>
            )}
            
            {!isEditMode && (
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={userConfirmed}
                    onChange={(e) => setUserConfirmed(e.target.checked)}
                  />
                }
                label={
                  <Typography variant="body2">
                    L'utilisateur confirme avoir reçu le matériel et les accessoires listés.
                  </Typography>
                }
                sx={{ mt: 2 }}
              />
            )}
            
            {errors.confirmation && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {errors.confirmation}
              </Alert>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !isSmallScreen) {
      event.preventDefault();
      handleNext();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth={isSmallScreen}
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
          <Typography variant="h6">
            {isEditMode ? 'Modifier le prêt' : 'Nouveau prêt'}
          </Typography>
        </Box>
        
        {isMobile && (
          <Chip 
            label={`Étape ${activeStep + 1}/${STEPS.length}`}
            size="small"
            color="primary"
          />
        )}
      </DialogTitle>
      
      <DialogContent ref={containerRef} sx={{ flex: 1, overflow: 'auto' }}>
        {/* Stepper - Desktop */}
        {!isMobile && (
          <Box sx={{ mb: 3 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {STEPS.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel
                    icon={step.icon}
                    optional={
                      <Typography variant="caption">
                        {step.description}
                      </Typography>
                    }
                  >
                    {step.label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        )}
        
        {/* Stepper - Mobile */}
        {isMobile && (
          <Box sx={{ mb: 2 }}>
            <Stepper activeStep={activeStep} orientation="horizontal">
              {STEPS.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel icon={step.icon}>
                    {step.label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        )}
        
        {/* Contenu de l'étape */}
        <Box sx={{ mt: isMobile ? 2 : 0 }}>
          {renderStepContent(activeStep)}
        </Box>
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
              onClick={handleNext}
              variant="contained"
              fullWidth
              startIcon={<ArrowForwardIcon />}
              sx={{ 
                py: 1.5,
                touchAction: 'manipulation'
              }}
            >
              {activeStep === STEPS.length - 1 
                ? (isEditMode ? 'Sauvegarder' : 'Créer le prêt')
                : 'Suivant'
              }
            </Button>
            
            {activeStep > 0 && (
              <Button 
                onClick={handleBack}
                variant="outlined"
                fullWidth
                startIcon={<ArrowBackIcon />}
                sx={{ py: 1.5 }}
              >
                Précédent
              </Button>
            )}
            
            <Button 
              onClick={onClose}
              fullWidth
              sx={{ py: 1.5 }}
            >
              Annuler
            </Button>
          </>
        ) : (
          <>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {activeStep > 0 && (
                <Button 
                  onClick={handleBack}
                  startIcon={<ArrowBackIcon />}
                >
                  Précédent
                </Button>
              )}
            </Box>
            
            <Box sx={{ flex: 1 }} />
            
            <Button onClick={onClose}>
              Annuler
            </Button>
            
            <Button 
              onClick={handleNext}
              variant="contained"
              startIcon={<ArrowForwardIcon />}
            >
              {activeStep === STEPS.length - 1 
                ? (isEditMode ? 'Sauvegarder' : 'Créer le prêt')
                : 'Suivant'
              }
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default LoanDialogResponsive;