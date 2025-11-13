/**
 * Page de gestion des utilisateurs de l'application et de leurs permissions
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControlLabel,
    Checkbox,
    Grid,
    Tooltip,
    Alert,
    FormGroup,
    Divider,
    Avatar
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    VpnKey as PasswordIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    AdminPanelSettings as AdminIcon,
    Person as PersonIcon
} from '@mui/icons-material';
import apiService from '../services/apiService';

const AppUsersManagementPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

    // Formulaire nouvel utilisateur
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        display_name: '',
        position: '',
        is_admin: false,
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

    const [passwordForm, setPasswordForm] = useState({
        userId: null,
        newPassword: '',
        confirmPassword: ''
    });

    // Charger la liste des utilisateurs
    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const result = await apiService.getAllAppUsers();
            if (result.success) {
                setUsers(result.users);
            }
        } catch (error) {
            console.error('Erreur chargement utilisateurs:', error);
            setNotification({ open: true, message: `Erreur: ${error.message}`, severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    // Ouvrir dialog création/édition
    const handleOpenDialog = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                username: user.username,
                email: user.email,
                display_name: user.display_name,
                position: user.position || '',
                is_admin: user.is_admin === 1,
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
            setEditingUser(null);
            setFormData({
                username: '',
                email: '',
                display_name: '',
                position: '',
                is_admin: false,
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
        setOpenDialog(true);
    };

    // Sauvegarder utilisateur (créer ou modifier)
    const handleSave = async () => {
        try {
            if (editingUser) {
                // Mise à jour utilisateur
                const userUpdateResult = await apiService.updateAppUser(editingUser.id, {
                    email: formData.email,
                    display_name: formData.display_name,
                    position: formData.position,
                    is_admin: formData.is_admin
                });

                // Mise à jour permissions
                const permissionsResult = await apiService.updateUserPermissions(editingUser.id, formData.permissions);

                if (userUpdateResult.success && permissionsResult.success) {
                    setNotification({ open: true, message: 'Utilisateur mis à jour', severity: 'success' });
                    loadUsers();
                    setOpenDialog(false);
                }
            } else {
                // Création nouvel utilisateur
                const result = await apiService.createAppUser(formData);

                if (result.success) {
                    setNotification({ open: true, message: `Utilisateur "${formData.display_name}" créé avec succès`, severity: 'success' });
                    loadUsers();
                    setOpenDialog(false);
                }
            }
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
            setNotification({ open: true, message: `Erreur: ${error.message}`, severity: 'error' });
        }
    };

    // Supprimer utilisateur
    const handleDelete = async (user) => {
        if (user.id === 1) {
            setNotification({ open: true, message: 'Impossible de supprimer l\'administrateur principal', severity: 'warning' });
            return;
        }

        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.display_name}" ?`)) {
            return;
        }

        try {
            const result = await apiService.deleteAppUser(user.id);
            if (result.success) {
                setNotification({ open: true, message: 'Utilisateur supprimé', severity: 'success' });
                loadUsers();
            }
        } catch (error) {
            console.error('Erreur suppression:', error);
            setNotification({ open: true, message: `Erreur: ${error.message}`, severity: 'error' });
        }
    };

    // Ouvrir dialog changement mot de passe
    const handleOpenPasswordDialog = (user) => {
        setPasswordForm({
            userId: user.id,
            newPassword: '',
            confirmPassword: ''
        });
        setPasswordDialogOpen(true);
    };

    // Réinitialiser mot de passe
    const handleResetPassword = async () => {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setNotification({ open: true, message: 'Les mots de passe ne correspondent pas', severity: 'error' });
            return;
        }

        if (passwordForm.newPassword.length < 4) {
            setNotification({ open: true, message: 'Le mot de passe doit contenir au moins 4 caractères', severity: 'error' });
            return;
        }

        try {
            const result = await apiService.resetUserPassword(passwordForm.userId, passwordForm.newPassword);
            if (result.success) {
                setNotification({ open: true, message: 'Mot de passe réinitialisé. L\'utilisateur devra le changer à la prochaine connexion.', severity: 'success' });
                setPasswordDialogOpen(false);
            }
        } catch (error) {
            console.error('Erreur réinitialisation:', error);
            setNotification({ open: true, message: `Erreur: ${error.message}`, severity: 'error' });
        }
    };

    // Render permissions sous forme de chips
    const renderPermissions = (user) => {
        const permissions = [];

        if (user.is_admin === 1) {
            return <Chip label="ADMIN COMPLET" color="error" size="small" />;
        }

        const permissionLabels = {
            can_access_dashboard: '📊 Tableau de bord',
            can_access_rds_sessions: '💻 Sessions RDS',
            can_access_servers: '🖥️ Serveurs',
            can_access_users: '👥 Utilisateurs',
            can_access_ad_groups: '🔐 Groupes AD',
            can_access_loans: '📦 Prêts',
            can_access_docucortex: '🤖 DocuCortex'
        };

        Object.entries(permissionLabels).forEach(([key, label]) => {
            if (user[key] === 1) {
                permissions.push(
                    <Chip key={key} label={label} size="small" color="primary" variant="outlined" sx={{ mr: 0.5, mb: 0.5 }} />
                );
            }
        });

        return permissions.length > 0 ? permissions : <Chip label="Aucune permission" size="small" color="default" />;
    };

    return (
        <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" fontWeight="bold">
                        👥 Gestion des Utilisateurs de l'Application
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                        sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            fontWeight: 600
                        }}
                    >
                        Nouvel Utilisateur
                    </Button>
                </Box>

                {notification.open && (
                    <Alert severity={notification.severity} sx={{ mb: 2 }} onClose={() => setNotification({ ...notification, open: false })}>
                        {notification.message}
                    </Alert>
                )}

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Utilisateur</strong></TableCell>
                                <TableCell><strong>Email</strong></TableCell>
                                <TableCell><strong>Poste</strong></TableCell>
                                <TableCell><strong>Statut</strong></TableCell>
                                <TableCell><strong>Permissions</strong></TableCell>
                                <TableCell align="right"><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id} hover>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Avatar sx={{ bgcolor: user.is_admin ? '#f44336' : '#667eea' }}>
                                                {user.is_admin ? <AdminIcon /> : <PersonIcon />}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {user.display_name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    @{user.username}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.position || '-'}</TableCell>
                                    <TableCell>
                                        {user.is_active === 1 ? (
                                            <Chip label="Actif" color="success" size="small" icon={<CheckIcon />} />
                                        ) : (
                                            <Chip label="Inactif" color="default" size="small" icon={<CloseIcon />} />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {renderPermissions(user)}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Modifier">
                                            <IconButton size="small" onClick={() => handleOpenDialog(user)}>
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Réinitialiser mot de passe">
                                            <IconButton size="small" onClick={() => handleOpenPasswordDialog(user)}>
                                                <PasswordIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Supprimer">
                                            <IconButton size="small" onClick={() => handleDelete(user)} disabled={user.id === 1}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Dialog Création/Édition */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', fontWeight: 600 }}>
                    {editingUser ? `Modifier ${editingUser.display_name}` : 'Nouvel Utilisateur'}
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Nom d'utilisateur"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                disabled={!!editingUser}
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
                    <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            fontWeight: 600
                        }}
                    >
                        {editingUser ? 'Mettre à jour' : 'Créer'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog Réinitialisation mot de passe */}
            <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>
                    Réinitialiser le mot de passe
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <TextField
                        fullWidth
                        type="password"
                        label="Nouveau mot de passe"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        type="password"
                        label="Confirmer mot de passe"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    />
                    <Alert severity="info" sx={{ mt: 2 }}>
                        L'utilisateur devra changer ce mot de passe à sa prochaine connexion.
                    </Alert>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setPasswordDialogOpen(false)}>Annuler</Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleResetPassword}
                        startIcon={<PasswordIcon />}
                    >
                        Réinitialiser
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AppUsersManagementPage;
