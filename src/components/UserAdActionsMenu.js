// src/components/UserAdActionsMenu.js - Menu complet avec réinitialisation mot de passe

import React, { useState } from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';

// Icons
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import LockResetIcon from '@mui/icons-material/LockReset';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

import { useApp } from '../contexts/AppContext';

const UserAdActionsMenu = ({ anchorEl, onClose, user, onActionComplete }) => {
    const { showNotification } = useApp();
    const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [passwordCopied, setPasswordCopied] = useState(false);

    const handleClose = () => {
        onClose();
    };

    // === GÉNÉRATEUR DE MOT DE PASSE PERSONNALISÉ ===
    // Format: 1ère lettre prénom + 1ère lettre nom + 4 chiffres + 2 lettres majuscules + 1 symbole
    // Exemple: Kevin Bivia → kb3272XM&
    const generateSecurePassword = () => {
        // Extraire le prénom et le nom du displayName
        const parts = (user.displayName || 'User').split(' ');
        const firstname = parts[0] || 'user';
        const lastname = parts[parts.length - 1] || 'user';

        // 1ère lettre du prénom en minuscule
        const prenomPrefix = firstname.charAt(0).toLowerCase();

        // 1ère lettre du nom en minuscule
        const nomPrefix = lastname.charAt(0).toLowerCase();

        // 4 chiffres aléatoires (1000-9999 pour garantir 4 chiffres)
        const digits = Math.floor(1000 + Math.random() * 9000);

        // 2 lettres majuscules aléatoires
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let randomLetters = '';
        for (let i = 0; i < 2; i++) {
            randomLetters += uppercase[Math.floor(Math.random() * uppercase.length)];
        }

        // 1 symbole aléatoire
        const specialChars = '!@#$%&*+-=';
        const randomSymbol = specialChars[Math.floor(Math.random() * specialChars.length)];

        // Construire le mot de passe
        const password = prenomPrefix + nomPrefix + digits + randomLetters + randomSymbol;

        setPasswordData({
            newPassword: password,
            confirmPassword: password
        });
        setPasswordError('');
    };

    // === VALIDER LE MOT DE PASSE ===
    const validatePassword = (pwd) => {
        if (!pwd) return 'Le mot de passe est obligatoire';
        if (pwd.length < 8) return 'Minimum 8 caractères';
        if (!/[A-Z]/.test(pwd)) return 'Doit contenir une majuscule';
        if (!/[a-z]/.test(pwd)) return 'Doit contenir une minuscule';
        if (!/[0-9]/.test(pwd)) return 'Doit contenir un chiffre';
        if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(pwd)) return 'Doit contenir un caractère spécial';
        return '';
    };

    // === ACTIVER LE COMPTE ===
    const handleEnableUser = async () => {
        setIsLoading(true);
        try {
            const result = await window.electronAPI.enableAdUser(user.username);
            if (result.success) {
                showNotification('success', `Compte ${user.username} activé`);
                if (onActionComplete) onActionComplete('enable');
            } else {
                showNotification('error', result.error || 'Erreur activation');
            }
        } catch (error) {
            showNotification('error', `Erreur: ${error.message}`);
        } finally {
            setIsLoading(false);
            handleClose();
        }
    };

    // === DÉSACTIVER LE COMPTE ===
    const handleDisableUser = async () => {
        setIsLoading(true);
        try {
            const result = await window.electronAPI.disableAdUser(user.username);
            if (result.success) {
                showNotification('success', `Compte ${user.username} désactivé`);
                if (onActionComplete) onActionComplete('disable');
            } else {
                showNotification('error', result.error || 'Erreur désactivation');
            }
        } catch (error) {
            showNotification('error', `Erreur: ${error.message}`);
        } finally {
            setIsLoading(false);
            handleClose();
        }
    };

    // === OUVRIR DIALOG RÉINITIALISATION MOT DE PASSE ===
    const handleOpenPasswordDialog = () => {
        setPasswordData({ newPassword: '', confirmPassword: '' });
        setPasswordError('');
        setIsPasswordVisible(false);
        setPasswordCopied(false);
        setOpenPasswordDialog(true);
        handleClose();
    };

    // === RÉINITIALISER MOT DE PASSE + METTRE À JOUR EXCEL ===
    const handleResetPassword = async () => {
        setPasswordError('');

        // Validation
        const pwd = passwordData.newPassword;
        const validationError = validatePassword(pwd);
        if (validationError) {
            setPasswordError(validationError);
            return;
        }

        if (pwd !== passwordData.confirmPassword) {
            setPasswordError('Les mots de passe ne correspondent pas');
            return;
        }

        setIsLoading(true);
        try {
            // 1. Réinitialiser le mot de passe dans AD (sans forcer changement)
            const adResult = await window.electronAPI.resetAdUserPassword(
                user.username,
                pwd,
                false // false = pas de forçage changement à la prochaine connexion
            );

            if (!adResult.success) {
                setPasswordError(adResult.error || 'Erreur réinitialisation AD');
                setIsLoading(false);
                return;
            }

            // 2. Mettre à jour le fichier Excel avec le nouveau mot de passe
            const excelUpdateResult = await window.electronAPI.saveUserToExcel({
                user: {
                    username: user.username,
                    displayName: user.displayName,
                    email: user.email,
                    department: user.department,
                    server: user.server,
                    password: pwd, // Nouveau mot de passe
                    officePassword: user.officePassword || pwd
                },
                isEdit: true
            });

            if (excelUpdateResult.success) {
                showNotification('success', `Mot de passe de ${user.username} réinitialisé et mis à jour`);
                if (onActionComplete) onActionComplete('reset-password');
                setOpenPasswordDialog(false);
            } else {
                showNotification('warning', `MDP réinitialisé en AD mais erreur Excel: ${excelUpdateResult.error}`);
            }
        } catch (error) {
            setPasswordError(`Erreur: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // === COPIER MOT DE PASSE ===
    const copyPasswordToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(passwordData.newPassword);
            setPasswordCopied(true);
            setTimeout(() => setPasswordCopied(false), 2000);
        } catch (err) {
            showNotification('error', 'Erreur copie');
        }
    };

    if (!user) return null;

    return (
        <>
            {/* MENU PRINCIPAL */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem disabled>
                    <ListItemIcon>
                        <PersonIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={user.username} secondary={user.displayName} />
                </MenuItem>

                <Divider />

                <MenuItem onClick={handleOpenPasswordDialog}>
                    <ListItemIcon>
                        <LockResetIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Réinitialiser mot de passe" secondary="Génère et met à jour Excel" />
                </MenuItem>

                <Divider />

                <MenuItem onClick={handleEnableUser} disabled={isLoading}>
                    <ListItemIcon>
                        <CheckCircleIcon fontSize="small" color="success" />
                    </ListItemIcon>
                    <ListItemText>Activer le compte</ListItemText>
                </MenuItem>

                <MenuItem onClick={handleDisableUser} disabled={isLoading}>
                    <ListItemIcon>
                        <BlockIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText>Désactiver le compte</ListItemText>
                </MenuItem>
            </Menu>

            {/* DIALOG RÉINITIALISATION MOT DE PASSE */}
            <Dialog
                open={openPasswordDialog}
                onClose={() => !isLoading && setOpenPasswordDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LockResetIcon />
                        Réinitialiser le mot de passe
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ pt: 2 }}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Réinitialisation pour : <strong>{user.username}</strong>
                    </Alert>

                    {passwordError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {passwordError}
                        </Alert>
                    )}

                    {/* Boutons générateur */}
                    <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={generateSecurePassword}
                            disabled={isLoading}
                            fullWidth
                        >
                            Générer mot de passe
                        </Button>
                    </Box>

                    {/* Nouveau mot de passe */}
                    <TextField
                        label="Nouveau mot de passe"
                        type={isPasswordVisible ? 'text' : 'password'}
                        fullWidth
                        margin="normal"
                        value={passwordData.newPassword}
                        onChange={(e) => {
                            setPasswordData({ ...passwordData, newPassword: e.target.value });
                            setPasswordError('');
                        }}
                        disabled={isLoading}
                        helperText="Min 8 caractères avec majuscule, minuscule, chiffre et caractère spécial"
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                        edge="end"
                                        size="small"
                                    >
                                        {isPasswordVisible ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />

                    {/* Confirmer mot de passe */}
                    <TextField
                        label="Confirmer le mot de passe"
                        type={isPasswordVisible ? 'text' : 'password'}
                        fullWidth
                        margin="normal"
                        value={passwordData.confirmPassword}
                        onChange={(e) => {
                            setPasswordData({ ...passwordData, confirmPassword: e.target.value });
                            setPasswordError('');
                        }}
                        disabled={isLoading}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                        edge="end"
                                        size="small"
                                    >
                                        {isPasswordVisible ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />

                    {/* Bouton copie si mot de passe généré */}
                    {passwordData.newPassword && (
                        <Box sx={{ mt: 2, p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
                                <Typography variant="caption" sx={{ fontFamily: 'monospace', flex: 1, wordBreak: 'break-all' }}>
                                    {isPasswordVisible ? passwordData.newPassword : '••••••••'}
                                </Typography>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={passwordCopied ? <CheckCircleIcon /> : <ContentCopyIcon />}
                                    onClick={copyPasswordToClipboard}
                                    disabled={isLoading}
                                >
                                    {passwordCopied ? 'Copié' : 'Copier'}
                                </Button>
                            </Box>
                        </Box>
                    )}
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => setOpenPasswordDialog(false)} disabled={isLoading}>
                        Annuler
                    </Button>
                    <Button
                        onClick={handleResetPassword}
                        variant="contained"
                        disabled={isLoading || !passwordData.newPassword}
                        startIcon={isLoading ? <CircularProgress size={20} /> : <LockResetIcon />}
                    >
                        {isLoading ? 'En cours...' : 'Réinitialiser et mettre à jour'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default UserAdActionsMenu;