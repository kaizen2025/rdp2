// src/components/UserDialog.js - VERSION FINALE AVEC MENTION SAGE

import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid,
    FormControl, InputLabel, Select, MenuItem, IconButton, InputAdornment,
    Typography, Slide, Autocomplete, Chip, Box
} from '@mui/material';
import { Visibility, VisibilityOff, Autorenew as AutoIcon } from '@mui/icons-material';
import { useCache } from '../contexts/CacheContext';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} timeout={{ enter: 200, exit: 150 }} />;
});

const UserDialog = ({ open, onClose, user, onSave, servers = [] }) => {
    const { cache } = useCache();
    const [isReady, setIsReady] = useState(false);

    // ✅ OPTIMISATION: Différer le rendu complet après l'animation d'ouverture
    useEffect(() => {
        if (open) {
            // Laisser l'animation de transition commencer, puis charger le contenu
            const timer = setTimeout(() => setIsReady(true), 50);
            return () => clearTimeout(timer);
        } else {
            setIsReady(false);
        }
    }, [open]);

    const [formData, setFormData] = useState({
        identifiant: '', motdepasse: '', office: '', nomcomplet: '',
        service: '', email: '', serveur: servers[0] || 'SRV-RDS-1',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showOfficePassword, setShowOfficePassword] = useState(false);
    const [errors, setErrors] = useState({});

    // ✅ OPTIMISATION: Différer le calcul lourd avec requestAnimationFrame
    const [departments, setDepartments] = useState([]);

    useEffect(() => {
        if (open) {
            // Différer le calcul des départements après le rendu initial
            requestAnimationFrame(() => {
                const allUsers = Object.values(cache.excel_users || {}).flat();
                const depts = [...new Set(allUsers.map(u => u.department).filter(Boolean))].sort();
                setDepartments(depts);
            });
        }
    }, [open, cache.excel_users]);

    // ✅ NOUVELLE FONCTION: Générer identifiant automatique (1ère lettre prénom + 1ère lettre nom)
    const generateUsername = (fullName) => {
        if (!fullName || !fullName.trim()) return '';
        const parts = fullName.trim().split(/\s+/);
        if (parts.length < 2) return fullName.toLowerCase().substring(0, 3);

        // Prendre 1ère lettre du prénom + nom complet
        const firstName = parts[0];
        const lastName = parts.slice(1).join('');
        return (firstName.charAt(0) + lastName).toLowerCase().replace(/[^a-z]/g, '');
    };

    // ✅ NOUVELLE FONCTION: Générer mot de passe automatique (ex: kb3272XM&)
    const generatePassword = (username) => {
        const numbers = Math.floor(1000 + Math.random() * 9000); // 4 chiffres aléatoires
        const letters = String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                       String.fromCharCode(65 + Math.floor(Math.random() * 26)); // 2 lettres majuscules
        const symbols = ['!', '@', '#', '$', '%', '&', '*', '+', '='][Math.floor(Math.random() * 9)]; // 1 symbole

        // Format: 2 premières lettres de l'identifiant + 4 chiffres + 2 lettres + 1 symbole
        const prefix = username.substring(0, 2).toLowerCase();
        return `${prefix}${numbers}${letters}${symbols}`;
    };

    useEffect(() => {
        if (open) {
            if (user) {
                setFormData({
                    identifiant: user.username || '', motdepasse: user.password || '',
                    office: user.officePassword || '', nomcomplet: user.displayName || '',
                    service: user.department || '', email: user.email || '',
                    serveur: user.server || servers[0] || 'SRV-RDS-1',
                });
            } else {
                setFormData({
                    identifiant: '', motdepasse: '', office: '', nomcomplet: '',
                    service: '', email: '', serveur: servers[0] || 'SRV-RDS-1',
                });
            }
            setErrors({});
        }
    }, [user, open, servers]);

    // ✅ Génération automatique de l'identifiant quand le nom complet change
    useEffect(() => {
        if (!user && formData.nomcomplet && !formData.identifiant) {
            const username = generateUsername(formData.nomcomplet);
            if (username) {
                setFormData(prev => ({
                    ...prev,
                    identifiant: username,
                    motdepasse: generatePassword(username)
                }));
            }
        }
    }, [formData.nomcomplet, user]);

    const validateField = (name, value) => {
        let error = '';
        switch (name) {
            case 'identifiant':
                if (!value || value.length < 3) error = "L'identifiant doit contenir au moins 3 caractères";
                else if (!/^[a-zA-Z0-9._-]+$/.test(value)) error = "L'identifiant contient des caractères invalides";
                break;
            case 'motdepasse':
                if (!value || value.length < 8) error = "Le mot de passe doit contenir au moins 8 caractères";
                break;
            case 'nomcomplet':
                if (!value) error = "Le nom complet est requis";
                break;
            case 'email':
                if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Format d'email invalide";
                break;
            default:
                break;
        }
        return error;
    }

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        const error = validateField(field, value);
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    const validate = () => {
        const newErrors = {};
        const fieldsToValidate = ['identifiant', 'motdepasse', 'nomcomplet', 'email'];
        fieldsToValidate.forEach(field => {
            const error = validateField(field, formData[field]);
            if (error) {
                newErrors[field] = error;
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegeneratePassword = () => {
        if (formData.identifiant) {
            const newPassword = generatePassword(formData.identifiant);
            setFormData(prev => ({ ...prev, motdepasse: newPassword }));
        }
    };

    const handleRegenerateUsername = () => {
        if (formData.nomcomplet) {
            const newUsername = generateUsername(formData.nomcomplet);
            setFormData(prev => ({
                ...prev,
                identifiant: newUsername,
                motdepasse: generatePassword(newUsername)
            }));
        }
    };

    const handleSave = () => {
        if (!validate()) return;
        onSave({ ...formData, isEdit: !!user });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth TransitionComponent={Transition}>
            <DialogTitle>{user ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    {/* Nom complet en premier pour générer l'identifiant */}
                    <Grid item xs={12}>
                        <TextField
                            label="Nom complet"
                            fullWidth
                            required
                            value={formData.nomcomplet}
                            onChange={(e) => handleChange('nomcomplet', e.target.value)}
                            error={!!errors.nomcomplet}
                            helperText={errors.nomcomplet || "Ex: Kevin BIVIA - L'identifiant sera généré automatiquement"}
                            placeholder="Prénom NOM"
                        />
                    </Grid>

                    {/* Identifiant avec bouton de régénération */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Identifiant (Windows / Sage)"
                            fullWidth
                            required
                            value={formData.identifiant}
                            onChange={(e) => handleChange('identifiant', e.target.value)}
                            error={!!errors.identifiant}
                            helperText={errors.identifiant}
                            disabled={!!user}
                            InputProps={{
                                endAdornment: !user && (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={handleRegenerateUsername}
                                            edge="end"
                                            size="small"
                                            title="Régénérer l'identifiant"
                                        >
                                            <AutoIcon />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Grid>

                    {/* Mot de passe avec bouton de régénération */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Mot de passe (Windows / Sage)"
                            fullWidth
                            required
                            type={showPassword ? 'text' : 'password'}
                            value={formData.motdepasse}
                            onChange={(e) => handleChange('motdepasse', e.target.value)}
                            error={!!errors.motdepasse}
                            helperText={errors.motdepasse || "Format: 2 lettres + 4 chiffres + 2 lettres + symbole"}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        {!user && (
                                            <IconButton
                                                onClick={handleRegeneratePassword}
                                                edge="end"
                                                size="small"
                                                title="Régénérer le mot de passe"
                                            >
                                                <AutoIcon />
                                            </IconButton>
                                        )}
                                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}><TextField label="Mot de passe Office" fullWidth type={showOfficePassword ? 'text' : 'password'} value={formData.office} onChange={(e) => handleChange('office', e.target.value)} InputProps={{ endAdornment: (<InputAdornment position="end"><IconButton onClick={() => setShowOfficePassword(!showOfficePassword)} edge="end">{showOfficePassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>) }} /></Grid>
                    <Grid item xs={12} sm={6}><TextField label="Email" fullWidth type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} error={!!errors.email} helperText={errors.email} /></Grid>
                    <Grid item xs={12} sm={6}>
                        <Autocomplete
                            freeSolo
                            options={departments}
                            value={formData.service || ''}
                            onInputChange={(event, newValue) => {
                                handleChange('service', newValue);
                            }}
                            renderInput={(params) => <TextField {...params} label="Service" />}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel>Serveur</InputLabel>
                            <Select value={formData.serveur} label="Serveur" onChange={(e) => handleChange('serveur', e.target.value)}>
                                {servers.length > 0 ? (
                                    servers.map(server => (<MenuItem key={server} value={server}>{server}</MenuItem>))
                                ) : (
                                    <MenuItem value="SRV-RDS-1">SRV-RDS-1</MenuItem>
                                )}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>Les champs marqués * sont obligatoires</Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Annuler</Button>
                <Button onClick={handleSave} variant="contained">{user ? 'Enregistrer' : 'Ajouter'}</Button>
            </DialogActions>
        </Dialog>
    );
};

export default UserDialog;