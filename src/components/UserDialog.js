// src/components/UserDialog.js - VERSION FINALE AVEC MENTION SAGE

import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid,
    FormControl, InputLabel, Select, MenuItem, IconButton, InputAdornment,
    Typography, Slide, Autocomplete
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useCache } from '../contexts/CacheContext';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const UserDialog = ({ open, onClose, user, onSave, servers = [] }) => {
    const { cache } = useCache();

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

    const handleSave = () => {
        if (!validate()) return;
        onSave({ ...formData, isEdit: !!user });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth TransitionComponent={Transition}>
            <DialogTitle>{user ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    {/* MODIFIÉ: Libellé mis à jour pour Sage */}
                    <Grid item xs={12} sm={6}><TextField label="Identifiant (Windows / Sage)" fullWidth required value={formData.identifiant} onChange={(e) => handleChange('identifiant', e.target.value)} error={!!errors.identifiant} helperText={errors.identifiant} disabled={!!user} /></Grid>
                    <Grid item xs={12} sm={6}><TextField label="Nom complet" fullWidth required value={formData.nomcomplet} onChange={(e) => handleChange('nomcomplet', e.target.value)} error={!!errors.nomcomplet} helperText={errors.nomcomplet} /></Grid>
                    {/* MODIFIÉ: Libellé mis à jour pour Sage */}
                    <Grid item xs={12}><TextField label="Mot de passe (Windows / Sage)" fullWidth required type={showPassword ? 'text' : 'password'} value={formData.motdepasse} onChange={(e) => handleChange('motdepasse', e.target.value)} error={!!errors.motdepasse} helperText={errors.motdepasse} InputProps={{ endAdornment: (<InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>) }} /></Grid>
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