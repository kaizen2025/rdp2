import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControlLabel,
    Checkbox,
    Grid,
    Typography,
    Divider,
    Avatar,
    FormGroup
} from '@mui/material';
import {
    PhotoCamera as PhotoCameraIcon
} from '@mui/icons-material';
import apiService from '../../services/apiService';

const UserEditDialog = ({ open, onClose, user, onSaveSuccess }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        display_name: '',
        position: '',
        is_admin: false,
        photo: null,
        permissions: {
            can_access_dashboard: true,
            can_access_rds_sessions: false,
            can_access_servers: false,
            can_access_users: false,
            can_access_ad_groups: false,
            can_access_loans: false,
            can_access_docucortex: false,
            can_manage_users: false,
            can_manage_permissions: false,
            can_view_reports: false
        }
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Initialisation des données quand l'utilisateur change ou que le dialog s'ouvre
    useEffect(() => {
        if (open) {
            setError('');
            if (user) {
                setFormData({
                    username: user.username,
                    email: user.email,
                    display_name: user.display_name,
                    position: user.position || '',
                    is_admin: user.is_admin === 1,
                    photo: null, // La photo existante est affichée via user.photo, ici c'est pour l'upload
                    permissions: {
                        can_access_dashboard: user.can_access_dashboard === 1,
                        can_access_rds_sessions: user.can_access_rds_sessions === 1,
                        can_access_servers: user.can_access_servers === 1,
                        can_access_users: user.can_access_users === 1,
                        can_access_ad_groups: user.can_access_ad_groups === 1,
                        can_access_loans: user.can_access_loans === 1,
                        can_access_docucortex: user.can_access_docucortex === 1,
                        can_manage_users: user.can_manage_users === 1,
                        can_manage_permissions: user.can_manage_permissions === 1,
                        can_view_reports: user.can_view_reports === 1
                    }
                });
            } else {
                // Reset pour nouvel utilisateur
                setFormData({
                    username: '',
                    email: '',
                    display_name: '',
                    position: '',
                    is_admin: false,
                    photo: null,
                    permissions: {
                        can_access_dashboard: true,
                        can_access_rds_sessions: false,
                        can_access_servers: false,
                        can_access_users: false,
                        can_access_ad_groups: false,
                        can_access_loans: false,
                        can_access_docucortex: false,
                        can_manage_users: false,
                        can_manage_permissions: false,
                        can_view_reports: false
                    }
                });
            }
        }
    }, [open, user]);

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            let result;
            if (user) {
                // Mise à jour utilisateur
                const userUpdateResult = await apiService.updateAppUser(user.id, {
                    email: formData.email,
                    display_name: formData.display_name,
                    position: formData.position,
                    is_admin: formData.is_admin
                });

                // Mise à jour permissions
                const permissionsResult = await apiService.updateUserPermissions(user.id, formData.permissions);

                if (formData.photo) {
                    await apiService.saveTechnicianPhoto(user.id, formData.photo);
                }

                if (userUpdateResult.success && permissionsResult.success) {
                    onSaveSuccess('Utilisateur mis à jour');
                    onClose();
                } else {
                    throw new Error('Erreur lors de la mise à jour');
                }
            } else {
                // Création nouvel utilisateur
                result = await apiService.createAppUser(formData);

                if (result.success) {
                    onSaveSuccess(`Utilisateur "${formData.display_name}" créé avec succès`);
                    onClose();
                } else {
                    throw new Error('Erreur lors de la création');
                }
            }
        } catch (err) {
            console.error('Erreur sauvegarde:', err);
            setError(err.message || 'Une erreur est survenue');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', fontWeight: 600 }}>
                {user ? `Modifier ${user.display_name}` : 'Nouvel Utilisateur'}
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
                {error && (
                    <Typography color="error" sx={{ mb: 2 }}>
                        {error}
                    </Typography>
                )}
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Avatar
                                src={formData.photo ? URL.createObjectURL(formData.photo) : (user?.photo ? `data:image/jpeg;base64,${user.photo}` : '')}
                                sx={{ width: 80, height: 80 }}
                            />
                            <input
                                accept="image/*"
                                style={{ display: 'none' }}
                                id="user-photo-upload"
                                type="file"
                                onChange={(e) => setFormData(prev => ({ ...prev, photo: e.target.files[0] }))}
                            />
                            <label htmlFor="user-photo-upload">
                                <Button variant="contained" component="span" startIcon={<PhotoCameraIcon />}>
                                    Changer la photo
                                </Button>
                            </label>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Nom d'utilisateur"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            disabled={!!user}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Nom complet"
                            value={formData.display_name}
                            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Poste / Position"
                            value={formData.position}
                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={formData.is_admin}
                                    onChange={(e) => setFormData({ ...formData, is_admin: e.target.checked })}
                                    color="error"
                                />
                            }
                            label={<Typography variant="body2" fontWeight="bold" color="error">Super Administrateur (accès complet)</Typography>}
                        />
                    </Grid>

                    {!formData.is_admin && (
                        <>
                            <Grid item xs={12}>
                                <Divider sx={{ my: 1 }} />
                                <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1 }}>
                                    Permissions d'accès aux onglets
                                </Typography>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <FormGroup>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={formData.permissions.can_access_dashboard}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    permissions: { ...formData.permissions, can_access_dashboard: e.target.checked }
                                                })}
                                            />
                                        }
                                        label="📊 Tableau de bord"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={formData.permissions.can_access_rds_sessions}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    permissions: { ...formData.permissions, can_access_rds_sessions: e.target.checked }
                                                })}
                                            />
                                        }
                                        label="💻 Sessions RDS"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={formData.permissions.can_access_servers}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    permissions: { ...formData.permissions, can_access_servers: e.target.checked }
                                                })}
                                            />
                                        }
                                        label="🖥️ Serveurs"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={formData.permissions.can_access_users}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    permissions: { ...formData.permissions, can_access_users: e.target.checked }
                                                })}
                                            />
                                        }
                                        label="👥 Utilisateurs"
                                    />
                                </FormGroup>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <FormGroup>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={formData.permissions.can_access_ad_groups}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    permissions: { ...formData.permissions, can_access_ad_groups: e.target.checked }
                                                })}
                                            />
                                        }
                                        label="🔐 Groupes AD"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={formData.permissions.can_access_loans}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    permissions: { ...formData.permissions, can_access_loans: e.target.checked }
                                                })}
                                            />
                                        }
                                        label="📦 Prêts"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={formData.permissions.can_access_docucortex}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    permissions: { ...formData.permissions, can_access_docucortex: e.target.checked }
                                                })}
                                            />
                                        }
                                        label="🤖 DocuCortex IA"
                                    />
                                </FormGroup>
                            </Grid>

                            <Grid item xs={12}>
                                <Divider sx={{ my: 1 }} />
                                <Typography variant="subtitle2" gutterBottom>
                                    Permissions spéciales
                                </Typography>
                            </Grid>

                            <Grid item xs={12}>
                                <FormGroup row>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={formData.permissions.can_manage_users}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    permissions: { ...formData.permissions, can_manage_users: e.target.checked }
                                                })}
                                                color="warning"
                                            />
                                        }
                                        label="Gérer les utilisateurs de l'app"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={formData.permissions.can_manage_permissions}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    permissions: { ...formData.permissions, can_manage_permissions: e.target.checked }
                                                })}
                                                color="warning"
                                            />
                                        }
                                        label="Modifier les permissions"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={formData.permissions.can_view_reports}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    permissions: { ...formData.permissions, can_view_reports: e.target.checked }
                                                })}
                                            />
                                        }
                                        label="Voir les rapports"
                                    />
                                </FormGroup>
                            </Grid>
                        </>
                    )}
                </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} disabled={saving}>Annuler</Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={saving}
                    sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        fontWeight: 600
                    }}
                >
                    {saving ? 'Sauvegarde...' : (user ? 'Mettre à jour' : 'Créer')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default UserEditDialog;
