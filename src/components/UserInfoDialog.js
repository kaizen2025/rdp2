import React, { useState, useEffect } from 'react';
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
import Avatar from '@mui/material/Avatar';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PersonIcon from '@mui/icons-material/Person';

import apiService from '../services/apiService';

const InfoRow = ({ label, value, isPassword = false, forceCopy = false }) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleCopy = () => {
    if (value) navigator.clipboard.writeText(value);
  };

  return (
    <Grid container item xs={12} alignItems="center" sx={{ mb: 1.5 }}>
      <Grid item xs={4}>
        <Typography variant="subtitle2" color="text.secondary">{label}</Typography>
      </Grid>
      <Grid item xs={8}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body1">{isPassword && !showPassword ? '••••••••' : value || '-'}</Typography>
          {(value || forceCopy) && (
            <Tooltip title="Copier">
              <IconButton onClick={handleCopy} size="small" disabled={!value}><ContentCopyIcon fontSize="inherit" /></IconButton>
            </Tooltip>
          )}
          {isPassword && value && (
            <Tooltip title={showPassword ? 'Masquer' : 'Afficher'}>
              <IconButton onClick={() => setShowPassword(!showPassword)} size="small">{showPassword ? <VisibilityOff fontSize="inherit" /> : <Visibility fontSize="inherit" />}</IconButton>
            </Tooltip>
          )}
        </Box>
      </Grid>
    </Grid>
  );
};

const UserInfoDialog = ({ open, onClose, user }) => {
  const [userPhoto, setUserPhoto] = useState(null);

  // ✅ Charger la photo de l'utilisateur AD depuis excel_users
  useEffect(() => {
    const loadUserPhoto = async () => {
      if (user && user.username && open) {
        try {
          const photoResult = await apiService.getExcelUserPicture(user.username);
          if (photoResult.success && photoResult.picture) {
            setUserPhoto(photoResult.picture);
          } else {
            setUserPhoto(null);
          }
        } catch (err) {
          console.log('Aucune photo trouvée pour cet utilisateur AD');
          setUserPhoto(null);
        }
      } else {
        setUserPhoto(null);
      }
    };

    loadUserPhoto();
  }, [user, open]);

  if (!user) return null;

  const { userInfo } = user;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><PersonIcon /> Fiche Utilisateur</DialogTitle>
      <DialogContent dividers>
        {/* ✅ Affichage photo de profil en haut */}
        {userPhoto && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3, mt: 1 }}>
            <Avatar
              src={userPhoto}
              alt={userInfo?.displayName || user.username}
              sx={{ width: 120, height: 120 }}
            />
          </Box>
        )}

        <Grid container spacing={1}>
          {/* CORRECTION: Utilisation de user.username */}
          <InfoRow label="Nom d'utilisateur" value={user.username} />
          <InfoRow label="Nom Complet" value={userInfo?.displayName} />
          <InfoRow label="Service" value={userInfo?.department} />
          <InfoRow label="Email" value={userInfo?.email} />
          <InfoRow label="Serveur RDS" value={user.server} />
          <InfoRow label="Mot de passe Windows" value={userInfo?.password} isPassword />
          <InfoRow label="Mot de passe Office" value={userInfo?.officePassword} isPassword />
        </Grid>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Fermer</Button></DialogActions>
    </Dialog>
  );
};

export default UserInfoDialog;