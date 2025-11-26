import React, { useState, useCallback, useMemo } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Grid from '@mui/material/Grid';
import Fade from '@mui/material/Fade';
import CircularProgress from '@mui/material/CircularProgress';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PersonIcon from '@mui/icons-material/Person';

// ✅ OPTIMISATION: InfoRow optimisé avec useCallback
const InfoRow = React.memo(({ label, value, isPassword = false, forceCopy = false }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        if (value) {
            navigator.clipboard.writeText(value);
            setCopied(true);
            // ✅ SKELETON: Feedback visuel pour copie
            setTimeout(() => setCopied(false), 1000);
        }
    }, [value]);

    return (
        <Grid container item xs={12} alignItems="center" sx={{ mb: 1.5 }}>
            <Grid item xs={4}>
                <Typography variant="subtitle2" color="text.secondary">{label}</Typography>
            </Grid>
            <Grid item xs={8}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1">
                        {isPassword && !showPassword ? '••••••••' : value || '-'}
                    </Typography>
                    {(value || forceCopy) && (
                        <Tooltip title={copied ? 'Copié !' : 'Copier'}>
                            <IconButton 
                                onClick={handleCopy} 
                                size="small" 
                                disabled={!value}
                                color={copied ? 'success' : 'default'}
                            >
                                <ContentCopyIcon fontSize="inherit" />
                            </IconButton>
                        </Tooltip>
                    )}
                    {isPassword && value && (
                        <Tooltip title={showPassword ? 'Masquer' : 'Afficher'}>
                            <IconButton 
                                onClick={() => setShowPassword(!showPassword)} 
                                size="small"
                            >
                                {showPassword ? <VisibilityOff fontSize="inherit" /> : <Visibility fontSize="inherit" />}
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </Grid>
        </Grid>
    );
});

// ✅ OPTIMISATION: Transition Fade instantanée
const Transition = React.forwardRef(function Transition(props, ref) {
    return <Fade ref={ref} {...props} timeout={200} />;
});

const UserInfoDialog = React.memo(({ open, onClose, user }) => {
    // ✅ SKELETON: État de chargement pour optimisation
    const [isLoading, setIsLoading] = useState(false);

    // ✅ OPTIMISATION: Memo pour les données utilisateur
    const userInfo = useMemo(() => user?.userInfo || {}, [user]);
    
    // ✅ OPTIMISATION: Fermeture optimisée
    const handleClose = useCallback(() => {
        setIsLoading(true);
        // ✅ SKELETON: Transition fluide de fermeture
        setTimeout(() => {
            onClose();
            setIsLoading(false);
        }, 150);
    }, [onClose]);

    if (!user) return null;

    return (
        <Dialog 
            open={open} 
            onClose={handleClose} 
            maxWidth="sm" 
            fullWidth 
            TransitionComponent={Transition}
            disableRestoreFocus
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon /> 
                Fiche Utilisateur
                {isLoading && <CircularProgress size={20} sx={{ ml: 1 }} />}
            </DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={1}>
                    <InfoRow label="Nom d'utilisateur" value={user.username} />
                    <InfoRow label="Nom Complet" value={userInfo.displayName} />
                    <InfoRow label="Service" value={userInfo.department} />
                    <InfoRow label="Email" value={userInfo.email} />
                    <InfoRow label="Serveur RDS" value={user.server} />
                    <InfoRow label="Mot de passe Windows" value={userInfo.password} isPassword />
                    <InfoRow label="Mot de passe Office" value={userInfo.officePassword} isPassword />
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button 
                    onClick={handleClose} 
                    disabled={isLoading}
                    startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                    {isLoading ? 'Fermeture...' : 'Fermer'}
                </Button>
            </DialogActions>
        </Dialog>
    );
});

export default UserInfoDialog;