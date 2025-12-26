// src/components/CreateAdUserDialog.js - VERSION FINALE AVEC MENTION SAGE

import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid,
    Alert, FormControlLabel, Checkbox, Box, CircularProgress,
    Divider, FormControl, InputLabel, Select, MenuItem, Autocomplete, IconButton,
    InputAdornment, Tooltip, Chip
} from '@mui/material';
import Slide from '@mui/material/Slide';

// Icons
import {
    PersonAdd as PersonAddIcon, Lock as LockIcon, ContentCopy as ContentCopyIcon,
    Refresh as RefreshIcon, Visibility, VisibilityOff, Info as InfoIcon,
    CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

import apiService from '../services/apiService';
import { useApp } from '../contexts/AppContext';
import { useCache } from '../contexts/CacheContext';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} timeout={{ enter: 200, exit: 150 }} />;
});

// Sous-composant pour un champ de mot de passe amélioré (avec icônes)
const PasswordInput = ({ label, value, name, onChange, onGenerate, helperText, error }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (!value) return;
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <TextField
            label={label}
            name={name}
            type={isVisible ? 'text' : 'password'}
            fullWidth
            value={value}
            onChange={onChange}
            error={!!error}
            helperText={error || helperText}
            InputProps={{
                endAdornment: (
                    <InputAdornment position="end">
                        {onGenerate && <Tooltip title="Générer"><IconButton onClick={onGenerate}><RefreshIcon /></IconButton></Tooltip>}
                        <Tooltip title="Copier"><IconButton onClick={handleCopy} disabled={!value}>{copied ? <CheckCircleIcon color="success" /> : <ContentCopyIcon />}</IconButton></Tooltip>
                        <Tooltip title={isVisible ? "Masquer" : "Afficher"}><IconButton onClick={() => setIsVisible(!isVisible)}>{isVisible ? <VisibilityOff /> : <Visibility />}</IconButton></Tooltip>
                    </InputAdornment>
                )
            }}
        />
    );
};

const CreateAdUserDialog = ({ open, onClose, onSuccess, servers, defaultOU = "OU=Users,DC=anecoopfr,DC=local" }) => {
    const { showNotification } = useApp();
    const { cache } = useCache();
    const allUsers = useMemo(() => Object.values(cache.excel_users || {}).flat(), [cache.excel_users]);
    const departments = useMemo(() => [...new Set(allUsers.map(u => u.department).filter(Boolean))].sort(), [allUsers]);

    const initialFormData = {
        username: '', firstName: '', lastName: '', displayName: '', email: '',
        password: '', confirmPassword: '', officePassword: '',
        server: servers?.[0] || '', department: '', ouPath: defaultOU,
        changePasswordAtLogon: false, description: '', addToExcel: true, copyFromUser: null,
    };

    const [formData, setFormData] = useState(initialFormData);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    useEffect(() => {
        if (open) {
            setFormData({
                username: '', firstName: '', lastName: '', displayName: '', email: '',
                password: '', confirmPassword: '', officePassword: '',
                server: servers?.[0] || '', department: '', ouPath: defaultOU,
                changePasswordAtLogon: false, description: '', addToExcel: true, copyFromUser: null,
            });
            setError(''); setSuccess(''); setFieldErrors({});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    useEffect(() => {
        if (formData.firstName && formData.lastName) {
            const firstInitial = formData.firstName.charAt(0).toLowerCase();
            const username = (firstInitial + formData.lastName.toLowerCase()).replace(/[^a-z0-9.-_]/g, '');
            setFormData(prev => ({ ...prev, username }));
        }
    }, [formData.firstName, formData.lastName]);

    const handleCopyFromUser = (userToCopy) => {
        setFormData(prev => ({
            ...prev, copyFromUser: userToCopy,
            department: userToCopy?.department || prev.department,
            server: userToCopy?.server || prev.server,
            description: `Profil copié de ${userToCopy?.username || ''}`
        }));
    };

    const validateField = (name, value) => {
        let error = '';
        switch (name) {
            case 'username': if (!value || value.length < 3) error = 'Le nom d\'utilisateur doit contenir au moins 3 caractères'; break;
            case 'firstName': if (!value) error = 'Le prénom est obligatoire'; break;
            case 'lastName': if (!value) error = 'Le nom est obligatoire'; break;
            case 'email': if (!value || !/\S+@\S+\.\S+/.test(value)) error = 'Une adresse email valide est requise'; break;
            case 'password': if (!value || value.length < 8) error = 'Le mot de passe doit contenir au moins 8 caractères'; break;
            case 'confirmPassword': if (value !== formData.password) error = 'Les mots de passe ne correspondent pas'; break;
            default: break;
        }
        return error;
    }

    const handleChange = (e) => {
        const { name, value, checked, type } = e.target;
        const fieldValue = type === 'checkbox' ? checked : value;
        setFormData(prev => ({ ...prev, [name]: fieldValue }));
        const error = validateField(name, fieldValue);
        setFieldErrors(prev => ({ ...prev, [name]: error }));
        if (name === 'password') {
            const confirmPasswordError = validateField('confirmPassword', formData.confirmPassword);
            setFieldErrors(prev => ({ ...prev, confirmPassword: confirmPasswordError }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        const fieldsToValidate = ['username', 'firstName', 'lastName', 'email', 'password', 'confirmPassword'];
        fieldsToValidate.forEach(field => {
            const error = validateField(field, formData[field]);
            if (error) newErrors[field] = error;
        });
        setFieldErrors(newErrors);
        const isValid = Object.keys(newErrors).length === 0;
        if (!isValid) setError('Veuillez corriger les erreurs dans le formulaire.');
        return isValid;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        setIsLoading(true);
        setError('');
        setSuccess('');
        try {
            const displayName = formData.displayName || `${formData.firstName} ${formData.lastName}`;
            const adResult = await apiService.createAdUser({
                ...formData, displayName, copyFromUsername: formData.copyFromUser?.username,
                userCannotChangePassword: true, passwordNeverExpires: true,
            });
            if (!adResult.success) throw new Error(`Erreur AD: ${adResult.error}`);
            setSuccess(`Utilisateur ${formData.username} créé dans AD.`);

            // ✅ NOUVEAU: Créer le dossier utilisateur sur le serveur de fichiers
            try {
                const folderResult = await apiService.createUserFolder({
                    username: formData.username,
                    fileServerPath: '\\\\192.168.1.230\\Utilisateurs'
                });
                if (folderResult.success) {
                    setSuccess(prev => prev + ` Dossier créé: ${folderResult.path}`);
                } else {
                    showNotification('warning', `Utilisateur créé, mais erreur dossier: ${folderResult.error}`);
                }
            } catch (folderErr) {
                showNotification('warning', `Utilisateur créé, mais erreur dossier: ${folderErr.message}`);
            }

            if (formData.addToExcel) {
                const excelResult = await apiService.saveUserToExcel({
                    user: {
                        ...formData, displayName, officePassword: formData.officePassword || formData.password,
                        createdAt: new Date().toISOString(),
                    }, isEdit: false
                });
                if (!excelResult.success) {
                    showNotification('warning', `Utilisateur créé dans AD, mais échec de l'ajout à Excel: ${excelResult.error}`);
                } else {
                    setSuccess(`Utilisateur ${formData.username} créé dans AD et ajouté à Excel !`);
                }
            }
            setTimeout(() => {
                if (onSuccess) onSuccess(adResult);
                onClose();
            }, 2500);
        } catch (err) {
            setError(`Erreur: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const generateRdsPassword = () => {
        const { firstName, lastName } = formData;
        if (!firstName || !lastName) {
            showNotification('warning', 'Veuillez d\'abord saisir le prénom et le nom.'); return;
        }
        // Format: 1ère lettre prénom + 1ère lettre nom + 4 chiffres + 2 majuscules + 1 symbole
        // Exemple: Kevin BIVIA → kb3272XM&
        const prenom = firstName.charAt(0).toLowerCase();
        const nom = lastName.charAt(0).toLowerCase();
        const digits = Math.floor(1000 + Math.random() * 9000); // 4 chiffres (1000-9999)
        const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', special = '!@#$%&*+-=';
        const randomUpper = upper[Math.floor(Math.random() * upper.length)] + upper[Math.floor(Math.random() * upper.length)];
        const randomSpecial = special[Math.floor(Math.random() * special.length)];
        const pwd = `${prenom}${nom}${digits}${randomUpper}${randomSpecial}`;
        setFormData(prev => ({ ...prev, password: pwd, confirmPassword: pwd }));
        setFieldErrors(prev => ({ ...prev, password: '', confirmPassword: '' }));
    };

    const generateOfficePassword = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let pwd = '';
        for (let i = 0; i < 16; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
        setFormData(prev => ({ ...prev, officePassword: pwd }));
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth TransitionComponent={Transition}>
            <DialogTitle><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><PersonAddIcon />Créer un utilisateur (AD + Excel)</Box></DialogTitle>
            <DialogContent dividers>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
                <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>Vous pouvez copier les groupes et paramètres d'un utilisateur existant.</Alert>
                <Grid container spacing={2}>
                    <Grid item xs={12}><Divider><Chip label="Copier un profil (Optionnel)" icon={<ContentCopyIcon />} /></Divider></Grid>
                    <Grid item xs={12}><Autocomplete options={allUsers} getOptionLabel={(o) => `${o.displayName} (${o.username})`} value={formData.copyFromUser} onChange={(e, v) => handleCopyFromUser(v)} renderInput={(params) => <TextField {...params} label="Copier les groupes et paramètres d'un utilisateur" />} /></Grid>
                    <Grid item xs={12}><Divider sx={{ my: 1 }}><Chip label="Informations du nouvel utilisateur" /></Divider></Grid>
                    <Grid item xs={12} sm={6}><TextField name="firstName" label="Prénom *" value={formData.firstName} onChange={handleChange} fullWidth required error={!!fieldErrors.firstName} helperText={fieldErrors.firstName} /></Grid>
                    <Grid item xs={12} sm={6}><TextField name="lastName" label="Nom *" value={formData.lastName} onChange={handleChange} fullWidth required error={!!fieldErrors.lastName} helperText={fieldErrors.lastName} /></Grid>
                    {/* MODIFIÉ: Libellé mis à jour pour Sage */}
                    <Grid item xs={12} sm={6}><TextField name="username" label="Login (Windows / Sage) *" value={formData.username} onChange={handleChange} fullWidth required error={!!fieldErrors.username} helperText={fieldErrors.username || "Généré automatiquement"} InputProps={{ readOnly: true }} /></Grid>
                    <Grid item xs={12} sm={6}><TextField name="email" label="Email *" type="email" value={formData.email} onChange={handleChange} fullWidth required error={!!fieldErrors.email} helperText={fieldErrors.email} /></Grid>
                    <Grid item xs={12} sm={6}><TextField name="displayName" label="Nom d'affichage" value={formData.displayName} onChange={handleChange} fullWidth helperText="Laissez vide pour auto-générer" /></Grid>
                    <Grid item xs={12} sm={6}><Autocomplete freeSolo options={departments} value={formData.department || ''} onInputChange={(e, v) => setFormData(p => ({ ...p, department: v }))} renderInput={(params) => <TextField {...params} label="Service / Département" />} /></Grid>
                    <Grid item xs={12}><Divider sx={{ my: 1 }}><Chip label="Mots de passe" icon={<LockIcon />} /></Divider></Grid>
                    {/* MODIFIÉ: Libellé mis à jour pour Sage */}
                    <Grid item xs={12}><PasswordInput label="Mot de passe (Windows / RDS / Sage) *" name="password" value={formData.password} onChange={handleChange} onGenerate={generateRdsPassword} error={fieldErrors.password} helperText="Min. 8 caractères" /></Grid>
                    <Grid item xs={12}><PasswordInput label="Mot de passe Office" name="officePassword" value={formData.officePassword} onChange={handleChange} onGenerate={generateOfficePassword} helperText="Si vide, utilise le mot de passe Windows" /></Grid>
                    <Grid item xs={12}><FormControlLabel control={<Checkbox name="changePasswordAtLogon" checked={formData.changePasswordAtLogon} onChange={handleChange} />} label="Forcer le changement de mot de passe à la première connexion" /></Grid>
                    <Grid item xs={12}><Divider sx={{ my: 1 }}><Chip label="Informations complémentaires" /></Divider></Grid>
                    <Grid item xs={12} sm={6}><FormControl fullWidth><InputLabel>Serveur RDS</InputLabel><Select name="server" value={formData.server} label="Serveur RDS" onChange={handleChange}>{servers.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</Select></FormControl></Grid>
                    <Grid item xs={12} sm={6}><TextField name="ouPath" label="Chemin OU" value={formData.ouPath} onChange={handleChange} fullWidth helperText="Ex: OU=Users,DC=anecoopfr,DC=local" /></Grid>
                    <Grid item xs={12}><TextField name="description" label="Description (pour AD)" value={formData.description} onChange={handleChange} fullWidth multiline rows={2} /></Grid>
                    <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>
                    <Grid item xs={12}><FormControlLabel control={<Checkbox name="addToExcel" checked={formData.addToExcel} onChange={handleChange} />} label="Ajouter l'utilisateur dans le fichier Excel de suivi" /></Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={isLoading}>Annuler</Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={isLoading}
                    startIcon={isLoading ? <CircularProgress size={20} /> : <PersonAddIcon />}
                >
                    {isLoading ? 'Création...' : "Créer l'utilisateur"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateAdUserDialog;