// ElectronicSignatureWorkflow.js - Workflow de signature électronique avancé
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    Button,
    Stepper,
    Step,
    StepLabel,
    Card,
    CardContent,
    Grid,
    TextField,
    Avatar,
    Chip,
    Alert,
    LinearProgress,
    CircularProgress,
    Divider,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Create,
    Save,
    Clear,
    CheckCircle,
    Fingerprint,
    Timer,
    Security,
    VerifiedUser,
    History,
    Person,
    Assignment,
    PhotoCamera,
    Videocam,
    CloudUpload
} from '@mui/icons-material';

// Hook pour la gestion des signatures
const useElectronicSignature = () => {
    const [signature, setSignature] = useState(null);
    const [fingerprint, setFingerprint] = useState(null);
    const [timestamp, setTimestamp] = useState(null);
    const [ipAddress, setIpAddress] = useState(null);
    
    // Simuler la capture d'empreinte digitale
    const captureFingerprint = useCallback(async () => {
        try {
            // Simulation de la capture d'empreinte (à remplacer par SDK réelle)
            const mockFingerprint = `FP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            setFingerprint(mockFingerprint);
            return mockFingerprint;
        } catch (error) {
            console.error('Erreur capture empreinte:', error);
            return null;
        }
    }, []);
    
    // Obtenir l'adresse IP
    const getClientIP = useCallback(async () => {
        try {
            // En environnement réel, utiliser un service comme ipify.org
            const mockIP = `192.168.1.${Math.floor(Math.random() * 255)}`;
            setIpAddress(mockIP);
            return mockIP;
        } catch (error) {
            console.error('Erreur récupération IP:', error);
            return null;
        }
    }, []);
    
    // Générer un hash de signature pour la blockchain
    const generateSignatureHash = useCallback(async (signatureData) => {
        const data = JSON.stringify({
            signature: signatureData,
            timestamp: new Date().toISOString(),
            fingerprint,
            ipAddress
        });
        
        // Simulation de hash cryptographique
        const mockHash = `0x${Array.from(new TextEncoder().encode(data))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
            .substring(0, 64)}`;
            
        return mockHash;
    }, [fingerprint, ipAddress]);
    
    return {
        signature,
        setSignature,
        fingerprint,
        captureFingerprint,
        timestamp,
        setTimestamp,
        ipAddress,
        getClientIP,
        generateSignatureHash
    };
};

// Composant de signature tactile
const SignaturePad = ({ onSignatureChange, width = 400, height = 200 }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        // Configurer le canvas pour la haute résolution
        const rect = canvas.getBoundingClientRect();
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.scale(ratio, ratio);
    }, [width, height]);
    
    const startDrawing = (e) => {
        setIsDrawing(true);
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(x, y);
    };
    
    const draw = (e) => {
        if (!isDrawing) return;
        
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const ctx = canvasRef.current.getContext('2d');
        ctx.lineTo(x, y);
        ctx.stroke();
        setHasSignature(true);
    };
    
    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        
        // Capturer la signature
        const signatureData = canvasRef.current.toDataURL();
        onSignatureChange?.(signatureData);
    };
    
    const clearSignature = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
        onSignatureChange?.(null);
    };
    
    return (
        <Box>
            <Box
                sx={{
                    border: '2px solid #ccc',
                    borderRadius: 1,
                    display: 'inline-block',
                    cursor: 'crosshair'
                }}
            >
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    style={{ display: 'block' }}
                />
            </Box>
            {hasSignature && (
                <Box sx={{ mt: 1 }}>
                    <IconButton onClick={clearSignature} color="error" size="small">
                        <Clear fontSize="small" />
                    </IconButton>
                    <Typography variant="caption" sx={{ ml: 1 }}>
                        Effacer la signature
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

// Workflow principal de signature électronique
const ElectronicSignatureWorkflow = ({ 
    open, 
    onClose, 
    loan, 
    user,
    onSignatureComplete 
}) => {
    const [activeStep, setActiveStep] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [signatureData, setSignatureData] = useState(null);
    
    const {
        signature,
        setSignature,
        fingerprint,
        captureFingerprint,
        timestamp,
        setTimestamp,
        ipAddress,
        getClientIP,
        generateSignatureHash
    } = useElectronicSignature();
    
    const steps = [
        'Vérification utilisateur',
        'Signature électronique',
        'Empreinte digitale',
        'Validation finale'
    ];
    
    const handleSignatureChange = (newSignature) => {
        setSignatureData(newSignature);
        setSignature(newSignature);
    };
    
    const handleNext = async () => {
        setIsProcessing(true);
        setError(null);
        
        try {
            switch (activeStep) {
                case 0:
                    // Vérification de l'utilisateur
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    break;
                    
                case 1:
                    // Signature électronique
                    if (!signatureData) {
                        throw new Error('Signature requise');
                    }
                    break;
                    
                case 2:
                    // Empreinte digitale
                    await captureFingerprint();
                    await getClientIP();
                    await new Promise(resolve => setTimeout(resolve, 500));
                    break;
                    
                case 3:
                    // Validation finale
                    setTimestamp(new Date());
                    const signatureHash = await generateSignatureHash(signatureData);
                    
                    const signatureRecord = {
                        loanId: loan.id,
                        userId: user.id,
                        userName: user.displayName,
                        signature: signatureData,
                        fingerprint: fingerprint,
                        ipAddress: ipAddress,
                        timestamp: timestamp,
                        signatureHash: signatureHash,
                        deviceInfo: navigator.userAgent,
                        validated: true
                    };
                    
                    // Stocker la signature (simulation)
                    console.log('Signature enregistrement:', signatureRecord);
                    
                    onSignatureComplete?.(signatureRecord);
                    onClose();
                    return;
            }
            
            setActiveStep(prev => prev + 1);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleBack = () => {
        setActiveStep(prev => prev - 1);
    };
    
    const isLastStep = activeStep === steps.length - 1;
    const canProceed = !isProcessing && !error;
    
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Security color="primary" />
                    Signature Électronique Sécurisée
                </Box>
            </DialogTitle>
            
            <DialogContent>
                {/* Barre de progression */}
                <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
                
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                
                {/* Contenu de l'étape active */}
                <Box>
                    {activeStep === 0 && (
                        <UserVerificationStep user={user} loan={loan} />
                    )}
                    
                    {activeStep === 1 && (
                        <ElectronicSignatureStep 
                            onSignatureChange={handleSignatureChange}
                            hasSignature={!!signatureData}
                        />
                    )}
                    
                    {activeStep === 2 && (
                        <FingerprintStep 
                            fingerprint={fingerprint}
                            onCapture={captureFingerprint}
                        />
                    )}
                    
                    {activeStep === 3 && (
                        <FinalValidationStep 
                            user={user}
                            loan={loan}
                            signature={signatureData}
                            fingerprint={fingerprint}
                            ipAddress={ipAddress}
                        />
                    )}
                </Box>
                
                {isProcessing && <LinearProgress sx={{ mt: 2 }} />}
            </DialogContent>
            
            <DialogActions>
                <Button onClick={onClose} disabled={isProcessing}>
                    Annuler
                </Button>
                <Button 
                    disabled={!canProceed || (activeStep === 0 && !loan)}
                    onClick={handleNext}
                    variant="contained"
                    startIcon={isProcessing ? <CircularProgress size={20} /> : null}
                >
                    {isLastStep ? 'Valider' : activeStep === 0 ? 'Suivant' : 'Continuer'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// Étape de vérification utilisateur
const UserVerificationStep = ({ user, loan }) => {
    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Vérification de l'identité
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ width: 60, height: 60 }}>
                                <Person sx={{ fontSize: 30 }} />
                            </Avatar>
                            <Box>
                                <Typography variant="subtitle1">
                                    {user.displayName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {user.email}
                                </Typography>
                                <Chip label="Vérifié" color="success" size="small" sx={{ mt: 1 }} />
                            </Box>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2">Prêt à signer:</Typography>
                        <Typography variant="body2">
                            {loan.equipmentName} ({loan.equipmentType})
                        </Typography>
                        <Typography variant="body2">
                            Retour prévu: {new Date(loan.returnDate).toLocaleDateString('fr-FR')}
                        </Typography>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

// Étape de signature électronique
const ElectronicSignatureStep = ({ onSignatureChange, hasSignature }) => {
    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Signature électronique
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Signez dans la zone ci-dessous pour valider le prêt.
                    Votre signature sera horodatée et crypteée.
                </Typography>
                
                <SignaturePad onSignatureChange={onSignatureChange} />
                
                {hasSignature && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                        <CheckCircle sx={{ mr: 1 }} />
                        Signature capturée avec succès
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
};

// Étape d'empreinte digitale
const FingerprintStep = ({ fingerprint, onCapture }) => {
    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Authentification biométrique
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Pour renforcer la sécurité, une authentification par empreinte digitale est requise.
                </Typography>
                
                <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Fingerprint sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                    <Button 
                        variant="contained" 
                        onClick={onCapture}
                        startIcon={<Fingerprint />}
                        disabled={!!fingerprint}
                    >
                        {fingerprint ? 'Empreinte capturée' : 'Capturer l\'empreinte'}
                    </Button>
                    
                    {fingerprint && (
                        <Alert severity="success" sx={{ mt: 2 }}>
                            <CheckCircle sx={{ mr: 1 }} />
                            Empreinte digitale validée
                        </Alert>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
};

// Étape de validation finale
const FinalValidationStep = ({ user, loan, signature, fingerprint, ipAddress }) => {
    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Validation finale
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Vérifiez les informations avant de finaliser la signature.
                </Typography>
                
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2">Informations de validation:</Typography>
                        <Typography variant="body2">✓ Signature capturée</Typography>
                        <Typography variant="body2">✓ Empreinte digitale validée</Typography>
                        <Typography variant="body2">✓ Horodatage: {new Date().toLocaleString('fr-FR')}</Typography>
                        <Typography variant="body2">✓ Adresse IP: {ipAddress || 'En cours...'}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2">Détails du prêt:</Typography>
                        <Typography variant="body2">Équipement: {loan.equipmentName}</Typography>
                        <Typography variant="body2">Utilisateur: {user.displayName}</Typography>
                        <Typography variant="body2">Retour: {new Date(loan.returnDate).toLocaleDateString('fr-FR')}</Typography>
                    </Grid>
                </Grid>
                
                <Alert severity="info" sx={{ mt: 2 }}>
                    <Security sx={{ mr: 1 }} />
                    Cette signature est légalement contraignante et sera archivée selon la réglementation en vigueur.
                </Alert>
            </CardContent>
        </Card>
    );
};

export default ElectronicSignatureWorkflow;