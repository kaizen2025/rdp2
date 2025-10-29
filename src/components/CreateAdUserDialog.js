// src/components/CreateAdUserDialog.js - Dialog pour créer un utilisateur AD

import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';

// Icons
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LockIcon from '@mui/icons-material/Lock';
import InfoIcon from '@mui/icons-material/Info';
import Slide from '@mui/material/Slide';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const CreateAdUserDialog = ({ open, onClose, onSuccess, defaultOU = "OU=Users,DC=anecoopfr,DC=local" }) => {
    const [formData, setFormData] = useState({
        username: '',
        firstName: '',
        lastName: '',
        displayName: '',
        email: '',
        password: '',
        confirmPassword: '',
        ouPath: defaultOU,
        changePasswordAtLogon: true,
        description: '',
        addToExcel: true, // Option pour ajouter aussi dans le fichier Excel local
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [fieldErrors, setFieldErrors] = useState({});

    const validateField = (name, value) => {
        let error = '';
        switch (name) {
            case 'username':
                if (!value || value.length < 3) error = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
                break;
            case 'firstName':
                if (!value) error = 'Le prénom est obligatoire';
                break;
            case 'lastName':
                if (!value) error = 'Le nom est obligatoire';
                break;
            case 'email':
                if (!value || !value.includes('@')) error = 'Une adresse email valide est requise';
                break;
            case 'password':
                if (!value || value.length < 8) error = 'Le mot de passe doit contenir au moins 8 caractères';
                else {
                    const hasUpperCase = /[A-Z]/.test(value);
                    const hasLowerCase = /[a-z]/.test(value);
                    const hasNumber = /[0-9]/.test(value);
                    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
                    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
                        error = 'Majuscule, minuscule, chiffre et caractère spécial requis';
                    }
                }
                break;
            case 'confirmPassword':
                if (value !== formData.password) error = 'Les mots de passe ne correspondent pas';
                break;
            default:
                break;
        }
        return error;
    }

    const handleChange = (e) => {
        const { name, value, checked, type } = e.target;
        const fieldValue = type === 'checkbox' ? checked : value;
        setFormData(prev => ({
            ...prev,
            [name]: fieldValue
        }));

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
            if (error) {
                newErrors[field] = error;
            }
        });

        setFieldErrors(newErrors);
        const isValid = Object.keys(newErrors).length === 0;
        if (!isValid) {
            setError('Veuillez corriger les erreurs dans le formulaire.');
        }
        return isValid;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            // Générer automatiquement le displayName si non fourni
            const displayName = formData.displayName || `${formData.firstName} ${formData.lastName}`;

            // Créer l'utilisateur dans Active Directory
            const result = await window.electronAPI.createAdUser({
                username: formData.username,
                firstName: formData.firstName,
                lastName: formData.lastName,
                displayName: displayName,
                email: formData.email,
                password: formData.password,
                ouPath: formData.ouPath,
                changePasswordAtLogon: formData.changePasswordAtLogon,
                description: formData.description,
            });

            if (result.success) {
                setSuccess(`Utilisateur ${formData.username} créé avec succès dans Active Directory !`);
                
                // Optionnel: Ajouter aussi dans le fichier Excel local
                if (formData.addToExcel) {
                    try {
                        await window.electronAPI.saveUserToExcel({
                            user: {
                                username: formData.username,
                                displayName: displayName,
                                email: formData.email,
                                department: 'IT',
                                server: 'SRV-RDS-1',
                                createdAt: new Date().toISOString(),
                            }
                        });
                        console.log('Utilisateur ajouté au fichier Excel local');
                    } catch (excelError) {
                        console.warn('Erreur ajout Excel:', excelError);
                    }
                }

                // Attendre 2 secondes avant de fermer
                setTimeout(() => {
                    if (onSuccess) onSuccess(result);
                    onClose();
                }, 2000);
            } else {
                setError(result.error || 'Erreur lors de la création de l\'utilisateur');
            }
        } catch (err) {
            setError(`Erreur: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const generatePassword = () => {
        const length = 12;
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let password = "";
        
        // S'assurer d'avoir au moins un de chaque type
        password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
        password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
        password += "0123456789"[Math.floor(Math.random() * 10)];
        password += "!@#$%^&*"[Math.floor(Math.random() * 8)];
        
        // Compléter jusqu'à la longueur voulue
        for (let i = 4; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        
        // Mélanger les caractères
        password = password.split('').sort(() => Math.random() - 0.5).join('');
        
        setFormData(prev => ({
            ...prev,
            password: password,
            confirmPassword: password
        }));
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            TransitionComponent={Transition}
            aria-labelledby="ad-user-dialog-title"
            aria-describedby="ad-user-dialog-description"
        >
            <DialogTitle id="ad-user-dialog-title">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonAddIcon />
                    Créer un utilisateur Active Directory
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                <Typography id="ad-user-dialog-description" style={{ display: 'none' }}>
                    Formulaire pour créer un utilisateur Active Directory.
                </Typography>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
                    <Typography variant="body2">
                        Cette action créera un nouvel utilisateur directement dans Active Directory.
                        Assurez-vous d'avoir les permissions nécessaires.
                    </Typography>
                </Alert>

                <Grid container spacing={2}>
                    {/* Informations de base */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom>
                            Informations de base
                        </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            name="username"
                            label="Nom d'utilisateur *"
                            value={formData.username}
                            onChange={handleChange}
                            fullWidth
                            required
                            error={!!fieldErrors.username}
                            helperText={fieldErrors.username || "Utilisé pour la connexion (ex: j.dupont)"}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            name="email"
                            label="Email *"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            fullWidth
                            required
                            error={!!fieldErrors.email}
                            helperText={fieldErrors.email || "Adresse email professionnelle"}
                        />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <TextField
                            name="firstName"
                            label="Prénom *"
                            value={formData.firstName}
                            onChange={handleChange}
                            fullWidth
                            required
                            error={!!fieldErrors.firstName}
                            helperText={fieldErrors.firstName}
                        />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <TextField
                            name="lastName"
                            label="Nom *"
                            value={formData.lastName}
                            onChange={handleChange}
                            fullWidth
                            required
                            error={!!fieldErrors.lastName}
                            helperText={fieldErrors.lastName}
                        />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <TextField
                            name="displayName"
                            label="Nom d'affichage"
                            value={formData.displayName}
                            onChange={handleChange}
                            fullWidth
                            helperText="Laissez vide pour auto-générer"
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LockIcon fontSize="small" />
                            Mot de passe
                        </Typography>
                    </Grid>

                    <Grid item xs={12} sm={5}>
                        <TextField
                            name="password"
                            label="Mot de passe *"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            fullWidth
                            required
                            error={!!fieldErrors.password}
                            helperText={fieldErrors.password || "Min. 8 caractères, mixte"}
                        />
                    </Grid>

                    <Grid item xs={12} sm={5}>
                        <TextField
                            name="confirmPassword"
                            label="Confirmer le mot de passe *"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            fullWidth
                            required
                            error={!!fieldErrors.confirmPassword}
                            helperText={fieldErrors.confirmPassword}
                        />
                    </Grid>

                    <Grid item xs={12} sm={2}>
                        <Button 
                            variant="outlined" 
                            onClick={generatePassword}
                            fullWidth
                            sx={{ height: '56px' }}
                        >
                            Générer
                        </Button>
                    </Grid>

                    <Grid item xs={12}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    name="changePasswordAtLogon"
                                    checked={formData.changePasswordAtLogon}
                                    onChange={handleChange}
                                />
                            }
                            label="Forcer le changement de mot de passe à la première connexion"
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="subtitle2" gutterBottom>
                            Informations complémentaires
                        </Typography>
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            name="ouPath"
                            label="Chemin OU (Organizational Unit)"
                            value={formData.ouPath}
                            onChange={handleChange}
                            fullWidth
                            helperText="Ex: OU=Users,DC=anecoopfr,DC=local"
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            name="description"
                            label="Description (optionnel)"
                            value={formData.description}
                            onChange={handleChange}
                            fullWidth
                            multiline
                            rows={2}
                            placeholder="Fonction, service, etc."
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    name="addToExcel"
                                    checked={formData.addToExcel}
                                    onChange={handleChange}
                                />
                            }
                            label="Ajouter également dans le fichier Excel local"
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={isLoading}>
                    Annuler
                </Button>
                <Button 
                    onClick={handleSubmit} 
                    variant="contained" 
                    disabled={isLoading}
                    startIcon={isLoading ? <CircularProgress size={20} /> : <PersonAddIcon />}
                >
                    {isLoading ? 'Création en cours...' : 'Créer l\'utilisateur'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateAdUserDialog;