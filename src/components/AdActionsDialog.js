// src/components/AdActionsDialog.js - NOUVEAU COMPOSANT COMPLET

import React, { useState, useEffect, useCallback } from 'react';
import StyledDialog from './StyledDialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

// Icons
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import LockResetIcon from '@mui/icons-material/LockReset';
import GroupIcon from '@mui/icons-material/Group';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

import { useApp } from '../contexts/AppContext';
import apiService from '../services/apiService';

// Sous-composant pour la réinitialisation du mot de passe
const PasswordResetDialog = ({ user, onComplete, onClose }) => {
    const { showNotification } = useApp();
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [isResetting, setIsResetting] = useState(false);
    const [error, setError] = useState('');
    const [passwordCopied, setPasswordCopied] = useState(false);
    const [showPassword, setShowPassword] = useState(true);

    const generatePassword = useCallback(() => {
        const parts = (user.displayName || 'User Name').split(' ');
        const prenom = parts[0].substring(0, 2).toLowerCase();
        const nom = parts[parts.length - 1].substring(0, 2).toLowerCase();
        const digits = Math.floor(1000 + Math.random() * 9000);
        const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const special = '!@#$%^&*';
        const randomUpper = upper[Math.floor(Math.random() * upper.length)] + upper[Math.floor(Math.random() * upper.length)];
        const randomSpecial = special[Math.floor(Math.random() * special.length)];
        setGeneratedPassword(`${prenom}${nom}${digits}${randomUpper}${randomSpecial}`);
        setError('');
        setPasswordCopied(false);
    }, [user.displayName]);

    const handleConfirmReset = async () => {
        setIsResetting(true);
        setError('');
        try {
            // 1. Réinitialiser dans AD
            const adResult = await apiService.resetAdUserPassword(user.username, generatedPassword, false);
            if (!adResult.success) throw new Error(`AD: ${adResult.error}`);

            // 2. Mettre à jour dans Excel
            const excelResult = await apiService.saveUserToExcel({
                user: { ...user, password: generatedPassword, officePassword: user.officePassword || generatedPassword },
                isEdit: true
            });
            if (!excelResult.success) {
                showNotification('warning', `Mot de passe réinitialisé dans AD, mais échec de la mise à jour Excel: ${excelResult.error}`);
            } else {
                showNotification('success', `Mot de passe pour ${user.username} réinitialisé et mis à jour.`);
            }

            onComplete();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <StyledDialog open onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogContent>
                <Alert severity="info" sx={{ mb: 2 }}>
                    Un mot de passe sécurisé sera généré, appliqué dans Active Directory et mis à jour dans le fichier Excel.
                </Alert>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 2 }}>
                    <TextField
                        label="Mot de passe généré"
                        value={generatedPassword}
                        fullWidth
                        type={showPassword ? 'text' : 'password'}
                        InputProps={{
                            readOnly: true,
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                    <Button variant="outlined" onClick={generatePassword} startIcon={<RefreshIcon />}>
                        Générer
                    </Button>
                </Box>

                {generatedPassword && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                        <Button
                            variant="contained"
                            color="secondary"
                            startIcon={passwordCopied ? <CheckCircleIcon /> : <ContentCopyIcon />}
                            onClick={async () => {
                                await navigator.clipboard.writeText(generatedPassword);
                                setPasswordCopied(true);
                            }}
                        >
                            {passwordCopied ? 'Copié !' : 'Copier'}
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleConfirmReset}
                            disabled={isResetting}
                            startIcon={isResetting ? <CircularProgress size={20} /> : <LockResetIcon />}
                        >
                            {isResetting ? 'En cours...' : 'Confirmer et Mettre à Jour'}
                        </Button>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={isResetting}>Fermer</Button>
            </DialogActions>
        </StyledDialog>
    );
};


const AdActionsDialog = ({ open, onClose, user, onActionComplete }) => {
    const { showNotification } = useApp();
    const [isLoading, setIsLoading] = useState(true);
    const [details, setDetails] = useState(null);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

    const loadUserDetails = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const result = await apiService.getAdUserDetails(user.username);
            if (result.success) {
                setDetails(result);
            } else {
                showNotification('error', result.error || 'Impossible de charger les détails AD.');
            }
        } catch (error) {
            showNotification('error', `Erreur: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [user, showNotification]);

    useEffect(() => {
        if (open) {
            loadUserDetails();
        }
    }, [open, loadUserDetails]);

    const handleToggleAccountStatus = async () => {
        const isEnabled = details?.user?.enabled;
        const actionText = isEnabled ? 'désactivé' : 'activé';

        if (!window.confirm(`Voulez-vous vraiment ${isEnabled ? 'DÉSACTIVER' : 'ACTIVER'} le compte ${user.username} ?`)) return;

        setIsActionLoading(true);
        try {
            const result = isEnabled
                ? await apiService.disableAdUser(user.username)
                : await apiService.enableAdUser(user.username);

            if (result.success) {
                showNotification('success', `Compte ${actionText} avec succès.`);
                onActionComplete(); // Déclenche le rafraîchissement
                loadUserDetails(); // Recharge les détails dans le dialogue
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            showNotification('error', `Erreur: ${error.message}`);
        } finally {
            setIsActionLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Jamais';
        return new Date(dateStr).toLocaleString('fr-FR');
    };

    return (
        <>
            <StyledDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <PersonIcon fontSize="large" />
                        <Box>
                            <Typography variant="h6">Actions Active Directory</Typography>
                            <Typography variant="body2" color="text.secondary">{user?.displayName} ({user?.username})</Typography>
                        </Box>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    {isLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
                    ) : !details ? (
                        <Alert severity="error">Impossible de charger les informations de l'utilisateur depuis Active Directory.</Alert>
                    ) : (
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Informations du Compte</Typography>
                                <Chip
                                    icon={details.user.enabled ? <CheckCircleIcon /> : <BlockIcon />}
                                    label={details.user.enabled ? 'Compte Activé' : 'Compte Désactivé'}
                                    color={details.user.enabled ? 'success' : 'error'}
                                    sx={{ mb: 2 }}
                                />
                                <Typography variant="body2"><strong>Email :</strong> {details.user.email || 'N/A'}</Typography>
                                <Typography variant="body2"><strong>Créé le :</strong> {formatDate(details.user.created)}</Typography>
                                <Typography variant="body2"><strong>Dernière connexion :</strong> {formatDate(details.user.lastLogon)}</Typography>
                                <Typography variant="body2"><strong>Mot de passe modifié le :</strong> {formatDate(details.user.passwordLastSet)}</Typography>
                                <Typography variant="body2" sx={{ mt: 1 }}><strong>Description :</strong> {details.user.description || 'Aucune'}</Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                                    <GroupIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                                    Appartenance aux groupes
                                </Typography>
                                <Box sx={{ maxHeight: 200, overflow: 'auto', display: 'flex', flexWrap: 'wrap', gap: 1, p: 1, border: '1px solid #eee', borderRadius: 1 }}>
                                    {details.groups.length > 0 ? details.groups.map(group => (
                                        <Chip key={group} label={group} size="small" />
                                    )) : <Typography variant="body2" color="text.secondary">N'appartient à aucun groupe.</Typography>}
                                </Box>
                            </Grid>
                            <Grid item xs={12}>
                                <Divider sx={{ my: 1 }} />
                                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Actions Rapides</Typography>
                                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                                    <Button
                                        variant="contained"
                                        color={details.user.enabled ? 'error' : 'success'}
                                        onClick={handleToggleAccountStatus}
                                        disabled={isActionLoading}
                                        startIcon={isActionLoading ? <CircularProgress size={20} /> : (details.user.enabled ? <BlockIcon /> : <CheckCircleIcon />)}
                                    >
                                        {details.user.enabled ? 'Désactiver le compte' : 'Activer le compte'}
                                    </Button>
                                    <Button
                                        variant="contained"
                                        onClick={() => setPasswordDialogOpen(true)}
                                        startIcon={<LockResetIcon />}
                                    >
                                        Réinitialiser le mot de passe
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Fermer</Button>
                </DialogActions>
            </StyledDialog>

            {passwordDialogOpen && (
                <PasswordResetDialog
                    user={user}
                    onClose={() => setPasswordDialogOpen(false)}
                    onComplete={() => {
                        setPasswordDialogOpen(false);
                        onActionComplete(); // Rafraîchit la liste principale
                    }}
                />
            )}
        </>
    );
};

export default AdActionsDialog;