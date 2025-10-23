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

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PersonIcon from '@mui/icons-material/Person';

const InfoRow = ({ label, value, isPassword = false }) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleCopy = () => {
    if (value) navigator.clipboard.writeText(value);
  };

  return (
    <Grid container item xs={12} alignItems="center" sx={{ mb: 1.5 }}>
      {/* Label */}
      <Grid item xs={4}>
        <Typography variant="subtitle2" color="text.secondary">
          {label}
        </Typography>
      </Grid>

      {/* Value + Actions */}
      <Grid item xs={8}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body1">
            {isPassword && !showPassword ? '••••••••' : value || '-'}
          </Typography>

          {value && (
            <Tooltip title="Copier">
              <IconButton onClick={handleCopy} size="small">
                <ContentCopyIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          )}

          {isPassword && (
            <Tooltip title={showPassword ? 'Masquer' : 'Afficher'}>
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                size="small"
              >
                {showPassword ? (
                  <VisibilityOff fontSize="inherit" />
                ) : (
                  <Visibility fontSize="inherit" />
                )}
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Grid>
    </Grid>
  );
};

const UserInfoDialog = ({ open, onClose, user }) => {
  if (!user) return null;

  const { userInfo } = user;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      {/* Header */}
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PersonIcon /> Fiche Utilisateur
      </DialogTitle>

      {/* Contenu */}
      <DialogContent dividers>
        <Grid container spacing={1}>
          <InfoRow label="Nom d'utilisateur" value={user.user} />
          <InfoRow label="Nom Complet" value={userInfo?.displayName} />
          <InfoRow label="Service" value={userInfo?.department} />
          <InfoRow label="Email" value={userInfo?.email} />
          <InfoRow label="Serveur RDS" value={user.server} />
          <InfoRow
            label="Mot de passe Windows"
            value={userInfo?.password}
            isPassword
          />
          <InfoRow
            label="Mot de passe Office"
            value={userInfo?.officePassword}
            isPassword
          />
        </Grid>
      </DialogContent>

      {/* Footer */}
      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserInfoDialog;
