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
    Alert,
    Tooltip,
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
    Person as PersonIcon,
    PeopleAlt as PeopleAltIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import apiService from '../services/apiService';
import PageHeader from '../components/common/PageHeader';
import UserEditDialog from '../components/users/UserEditDialog';

const AppUsersManagementPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    // États pour les dialogues
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        userId: null,
        newPassword: '',
        confirmPassword: ''
    });

    const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

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

    // Gestion du dialogue d'édition/création
    const handleOpenEditDialog = (user = null) => {
        setEditingUser(user);
        setEditDialogOpen(true);
    };

    const handleCloseEditDialog = () => {
        setEditDialogOpen(false);
        setEditingUser(null);
    };

    const handleSaveSuccess = (message) => {
        setNotification({ open: true, message, severity: 'success' });
        loadUsers();
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

    // Render permissions sous forme de chips pour le tableau
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
        <Box sx={{ p: 2 }}>
            <PageHeader
                title="Gestion des Utilisateurs"
                subtitle="Gérez les accès et permissions des utilisateurs de l'application"
                icon={PeopleAltIcon}
                actions={
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Actualiser">
                            <IconButton
                                onClick={loadUsers}
                                disabled={loading}
                                sx={{
                                    color: 'white',
                                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.25)' }
                                }}
                            >
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenEditDialog()}
                            sx={{
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                color: 'white',
                                fontWeight: 600,
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.3)'
                                }
                            }}
                        >
                            Nouvel Utilisateur
                        </Button>
                    </Box>
                }
            />

            {notification.open && (
                <Alert severity={notification.severity} sx={{ mb: 2 }} onClose={() => setNotification({ ...notification, open: false })}>
                    {notification.message}
                </Alert>
            )}

            <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ minWidth: 200 }}><strong>Utilisateur</strong></TableCell>
                                <TableCell sx={{ minWidth: 220 }}><strong>Email</strong></TableCell>
                                <TableCell sx={{ minWidth: 150 }}><strong>Poste</strong></TableCell>
                                <TableCell sx={{ minWidth: 100 }}><strong>Statut</strong></TableCell>
                                <TableCell sx={{ minWidth: 300 }}><strong>Permissions</strong></TableCell>
                                <TableCell align="right" sx={{ minWidth: 120 }}><strong>Actions</strong></TableCell>
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
                                            <IconButton size="small" onClick={() => handleOpenEditDialog(user)}>
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

            {/* Nouveau composant Dialog optimisé */}
            <UserEditDialog
                open={editDialogOpen}
                onClose={handleCloseEditDialog}
                user={editingUser}
                onSaveSuccess={handleSaveSuccess}
            />

            {/* Dialog Réinitialisation mot de passe (gardé ici car simple) */}
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
