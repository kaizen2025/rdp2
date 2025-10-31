// src/components/AdActionsDialog.js - VERSION FINALE AVEC GESTION DES GROUPES

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
import Autocomplete from '@mui/material/Autocomplete';

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

// Sous-composant pour la réinitialisation du mot de passe (inchangé)
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
            const adResult = await apiService.resetAdUserPassword(user.username, generatedPassword, false);
            if (!adResult.success) throw new Error(`AD: ${adResult.error}`);

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
                        <Button variant="contained" color="secondary" startIcon={passwordCopied ? <CheckCircleIcon /> : <ContentCopyIcon />} onClick={async () => { await navigator.clipboard.writeText(generatedPassword); setPasswordCopied(true); }}>{passwordCopied ? 'Copié !' : 'Copier'}</Button>
                        <Button variant="contained" color="primary" onClick={handleConfirmReset} disabled={isResetting} startIcon={isResetting ? <CircularProgress size={20} /> : <LockResetIcon />}>{isResetting ? 'En cours...' : 'Confirmer et Mettre à Jour'}</Button>
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
    const [foundGroups, setFoundGroups] = useState([]);
    const [groupSearchTerm, setGroupSearchTerm] = useState('');
    const [isSearchingGroups, setIsSearchingGroups] = useState(false);

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
                onActionComplete();
                loadUserDetails();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            showNotification('error', `Erreur: ${error.message}`);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleGroupAction = async (groupName, action) => {
        if (!groupName) return;
        const actionVerb = action === 'add' ? 'ajouté' : 'retiré';
        const actionPresent = action === 'add' ? 'ajouter' : 'retirer';

        if (!window.confirm(`Voulez-vous vraiment ${actionPresent} ${user.username} du groupe ${groupName} ?`)) return;

        setIsActionLoading(true);
        try {
            const apiCall = action === 'add' ? apiService.addUserToGroup : apiService.removeUserFromGroup;
            const result = await apiCall(user.username, groupName);
            if (result.success) {
                showNotification('success', `Utilisateur ${actionVerb} du groupe ${groupName} avec succès.`);
                loadUserDetails(); // Recharger les détails pour voir le changement
                setGroupSearchTerm(''); // Réinitialiser le champ de recherche
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            showNotification('error', `Erreur lors de l'action sur le groupe: ${error.message}`);
        } finally {
            setIsActionLoading(false);
        }
    };

    // ✅ NOUVELLE FONCTION: Recherche de groupes AD avec debounce
    const searchAdGroups = useCallback(async (searchTerm) => {
        if (!searchTerm || searchTerm.length < 2) {
            setFoundGroups([]);
            return;
        }
        setIsSearchingGroups(true);
        try {
            const groups = await apiService.searchAdGroups(searchTerm);
            setFoundGroups(groups || []);
        } catch (error) {
            console.error('Erreur recherche de groupes:', error);
            setFoundGroups([]);
        } finally {
            setIsSearchingGroups(false);
        }
    }, []);

    // Debounce pour la recherche de groupes
    useEffect(() => {
        const timer = setTimeout(() => {
            searchAdGroups(groupSearchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [groupSearchTerm, searchAdGroups]);

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
                                <Typography variant="body2"><strong>Email :</strong> {details.user.email || user.email || 'N/A'}</Typography>
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
                                <Box sx={{ maxHeight: 150, overflow: 'auto', display: 'flex', flexWrap: 'wrap', gap: 1, p: 1, border: '1px solid #eee', borderRadius: 1 }}>
                                    {details.groups.length > 0 ? details.groups.map(group => (
                                        <Chip key={group} label={group} size="small" onDelete={() => handleGroupAction(group, 'remove')} disabled={isActionLoading} />
                                    )) : <Typography variant="body2" color="text.secondary">N'appartient à aucun groupe.</Typography>}
                                </Box>
                                <Autocomplete
                                    sx={{ mt: 2 }}
                                    freeSolo
                                    options={foundGroups}
                                    inputValue={groupSearchTerm}
                                    onInputChange={(event, newValue) => setGroupSearchTerm(newValue)}
                                    onChange={(event, newValue) => {
                                        if (newValue) {
                                            handleGroupAction(newValue, 'add');
                                        }
                                    }}
                                    loading={isSearchingGroups}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Ajouter à un groupe..."
                                            size="small"
                                            placeholder="Taper au moins 2 caractères..."
                                            helperText="Commencez à taper pour rechercher les groupes AD disponibles"
                                            InputProps={{
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <>
                                                        {isSearchingGroups ? <CircularProgress size={20} /> : null}
                                                        {params.InputProps.endAdornment}
                                                    </>
                                                )
                                            }}
                                        />
                                    )}
                                    renderOption={(props, option) => (
                                        <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <GroupIcon fontSize="small" color="action" />
                                            <Typography variant="body2">{option}</Typography>
                                        </Box>
                                    )}
                                    noOptionsText={groupSearchTerm.length < 2 ? "Tapez au moins 2 caractères" : "Aucun groupe trouvé"}
                                />
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
                        onActionComplete();
                    }}
                />
            )}
        </>
    );
};

export default AdActionsDialog;