import React, { useState } from 'react';
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
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PersonIcon from '@mui/icons-material/Person';

const InfoRow = ({ label, value, isPassword = false, forceCopy = false, onCopy }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (value) {
      navigator.clipboard.writeText(value);
      setCopied(true);
      if (onCopy) onCopy();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Grid container item xs={12} alignItems="center" sx={{ mb: 1.5 }}>
      <Grid item xs={4}>
        <Typography variant="subtitle2" color="text.secondary">{label}</Typography>
      </Grid>
      <Grid item xs={8}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body1" sx={{ fontFamily: isPassword ? 'monospace' : 'inherit' }}>
            {isPassword && !showPassword ? '••••••••' : value || '-'}
          </Typography>
          {(value || forceCopy) && (
            <Tooltip title={copied ? "Copié !" : "Copier"}>
              <IconButton onClick={handleCopy} size="small" disabled={!value} color={copied ? "success" : "default"}>
                {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          )}
          {isPassword && value && (
            <Tooltip title={showPassword ? 'Masquer' : 'Afficher'}>
              <IconButton onClick={() => setShowPassword(!showPassword)} size="small">
                {showPassword ? <VisibilityOff fontSize="inherit" /> : <Visibility fontSize="inherit" />}</IconButton>
            </Tooltip>
          )}
        </Box>
      </Grid>
    </Grid>
  );
};

const UserInfoDialog = ({ open, onClose, user }) => {
  const [toastOpen, setToastOpen] = useState(false);

  if (!user) return null;

  const { userInfo } = user;
  const displayName = userInfo?.displayName || user.username;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PersonIcon color="primary" />
          <Box>
            <Typography variant="h6">Fiche Utilisateur</Typography>
            <Typography variant="subtitle2" color="text.secondary">{displayName}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={1}>
            <InfoRow label="Nom d'utilisateur" value={user.username} onCopy={() => setToastOpen(true)} />
            <InfoRow label="Nom Complet" value={userInfo?.displayName} onCopy={() => setToastOpen(true)} />
            <InfoRow label="Service" value={userInfo?.department} onCopy={() => setToastOpen(true)} />
            <InfoRow label="Email" value={userInfo?.email} onCopy={() => setToastOpen(true)} />
            <InfoRow label="Serveur RDS" value={user.server} onCopy={() => setToastOpen(true)} />
            <InfoRow label="Mot de passe Windows" value={userInfo?.password} isPassword onCopy={() => setToastOpen(true)} />
            <InfoRow label="Mot de passe Office" value={userInfo?.officePassword} isPassword onCopy={() => setToastOpen(true)} />
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} variant="contained">Fermer</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toastOpen}
        autoHideDuration={2000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setToastOpen(false)} severity="success" sx={{ width: '100%' }} variant="filled">
          Information copiée dans le presse-papier
        </Alert>
      </Snackbar>
    </>
  );
};

export default UserInfoDialog;
