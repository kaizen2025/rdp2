/**
 * Panneau de gestion des utilisateurs et permissions
 * Permet aux admins de gérer les rôles et permissions des techniciens
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Tooltip,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Switch,
    FormControlLabel,
    Grid,
    Card,
    CardContent,
    Divider
} from '@mui/material';
import {
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Info as InfoIcon,
    Security as SecurityIcon
} from '@mui/icons-material';

import { ROLES } from '../../models/permissions';
import { usePermissions } from '../../hooks/usePermissions';
import { useApp } from '../../contexts/AppContext';
import apiService from '../../services/apiService';

const UsersPermissionsPanel = () => {
    const { config, updateConfig } = useApp();
    const { hasPermission, isSuperAdmin } = usePermissions();
    const [users, setUsers] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [selectedRole, setSelectedRole] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [roleInfoDialogOpen, setRoleInfoDialogOpen] = useState(false);
    const [selectedRoleInfo, setSelectedRoleInfo] = useState(null);

    useEffect(() => {
        if (config?.it_technicians) {
            setUsers(config.it_technicians);
        }
    }, [config]);

    const handleEditUser = (user) => {
        setEditingUser(user.id);
        setSelectedRole(user.role || '');
    };

    const handleCancelEdit = () => {
        setEditingUser(null);
        setSelectedRole('');
    };

    const handleSaveUser = async (userId) => {
        try {
            setError(null);
            setSuccess(null);

            // Mettre à jour l'utilisateur dans la config locale
            const updatedUsers = users.map(user => {
                if (user.id === userId) {
                    return { ...user, role: selectedRole };
                }
                return user;
            });

            // Sauvegarder la config via l'API
            const updatedConfig = {
                ...config,
                it_technicians: updatedUsers
            };

            await apiService.updateConfig(updatedConfig);

            // Mettre à jour l'état local
            setUsers(updatedUsers);
            updateConfig(updatedConfig);

            setEditingUser(null);
            setSelectedRole('');
            setSuccess('Permissions mises à jour avec succès');

            // Effacer le message de succès après 3s
            setTimeout(() => setSuccess(null), 3000);
        } catch (error) {
            console.error('Erreur sauvegarde permissions:', error);
            setError('Erreur lors de la sauvegarde des permissions');
        }
    };

    const getRoleConfig = (roleId) => {
        if (!roleId) return null;

        // Chercher dans config.json d'abord
        if (config?.roles && config.roles[roleId]) {
            return { id: roleId, ...config.roles[roleId] };
        }

        // Sinon dans les rôles prédéfinis
        const roleKey = roleId.toUpperCase();
        if (ROLES[roleKey]) {
            return ROLES[roleKey];
        }

        return null;
    };

    const showRoleInfo = (roleId) => {
        const roleInfo = getRoleConfig(roleId);
        if (roleInfo) {
            setSelectedRoleInfo(roleInfo);
            setRoleInfoDialogOpen(true);
        }
    };

    const formatPermissions = (permissions) => {
        if (!permissions || permissions.length === 0) return 'Aucune';
        if (permissions.includes('*')) return 'Toutes les permissions';
        return `${permissions.length} permission(s)`;
    };

    // Vérifier si l'utilisateur courant peut éditer
    const canEdit = hasPermission('config:admin') || isSuperAdmin();

    if (!canEdit) {
        return (
            <Box>
                <Alert severity="warning">
                    Vous n'avez pas les permissions nécessaires pour gérer les utilisateurs et permissions.
                </Alert>
            </Box>
        );
    }

    return (
        <Box>
            {/* En-tête avec légende des rôles */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SecurityIcon /> Gestion des Utilisateurs et Permissions
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Attribuez des rôles aux techniciens pour contrôler leur accès aux fonctionnalités.
                </Typography>

                {/* Cartes de rôles */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {Object.entries(ROLES).map(([key, role]) => (
                        <Grid item xs={12} sm={6} md={4} key={key}>
                            <Card
                                sx={{
                                    cursor: 'pointer',
                                    '&:hover': { boxShadow: 3 },
                                    borderLeft: `4px solid ${role.color}`
                                }}
                                onClick={() => showRoleInfo(role.id)}
                            >
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <span style={{ fontSize: '24px' }}>{role.icon}</span>
                                        <Typography variant="h6">
                                            {role.name}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary">
                                        {role.description}
                                    </Typography>
                                    <Chip
                                        label={formatPermissions(role.permissions)}
                                        size="small"
                                        sx={{ mt: 1 }}
                                    />
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            {/* Messages de feedback */}
            {error && (
                <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
                    {success}
                </Alert>
            )}

            {/* Tableau des utilisateurs */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>Nom</strong></TableCell>
                            <TableCell><strong>Position</strong></TableCell>
                            <TableCell><strong>Email</strong></TableCell>
                            <TableCell><strong>Rôle</strong></TableCell>
                            <TableCell><strong>Statut</strong></TableCell>
                            <TableCell align="center"><strong>Actions</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => {
                            const role = getRoleConfig(user.role);
                            const isEditing = editingUser === user.id;

                            return (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip
                                                label={user.avatar || '?'}
                                                size="small"
                                                color="primary"
                                            />
                                            {user.name}
                                        </Box>
                                    </TableCell>
                                    <TableCell>{user.position}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        {isEditing ? (
                                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                                <Select
                                                    value={selectedRole}
                                                    onChange={(e) => setSelectedRole(e.target.value)}
                                                >
                                                    {Object.entries(ROLES).map(([key, r]) => (
                                                        <MenuItem key={r.id} value={r.id}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <span>{r.icon}</span>
                                                                {r.name}
                                                            </Box>
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        ) : role ? (
                                            <Tooltip title={role.description}>
                                                <Chip
                                                    icon={<span>{role.icon}</span>}
                                                    label={role.name}
                                                    sx={{
                                                        bgcolor: role.color,
                                                        color: 'white',
                                                        '& .MuiChip-icon': { color: 'white' }
                                                    }}
                                                    onClick={() => showRoleInfo(user.role)}
                                                />
                                            </Tooltip>
                                        ) : (
                                            <Chip label="Non défini" size="small" variant="outlined" />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={user.isActive ? 'Actif' : 'Inactif'}
                                            color={user.isActive ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        {isEditing ? (
                                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                                <Tooltip title="Sauvegarder">
                                                    <IconButton
                                                        size="small"
                                                        color="success"
                                                        onClick={() => handleSaveUser(user.id)}
                                                    >
                                                        <SaveIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Annuler">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={handleCancelEdit}
                                                    >
                                                        <CancelIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        ) : (
                                            <Tooltip title="Modifier le rôle">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleEditUser(user)}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Dialog d'information sur un rôle */}
            <Dialog
                open={roleInfoDialogOpen}
                onClose={() => setRoleInfoDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {selectedRoleInfo && (
                            <>
                                <span style={{ fontSize: '32px' }}>{selectedRoleInfo.icon}</span>
                                <Typography variant="h6">{selectedRoleInfo.name}</Typography>
                            </>
                        )}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {selectedRoleInfo && (
                        <Box>
                            <Typography variant="body1" gutterBottom>
                                {selectedRoleInfo.description}
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle2" gutterBottom>
                                Permissions :
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                {selectedRoleInfo.permissions.map((perm, index) => (
                                    <Chip
                                        key={index}
                                        label={perm}
                                        size="small"
                                        variant="outlined"
                                    />
                                ))}
                            </Box>
                            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                    <strong>Priorité:</strong> {selectedRoleInfo.priority || 'N/A'}
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRoleInfoDialogOpen(false)}>
                        Fermer
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Aide */}
            <Alert severity="info" icon={<InfoIcon />} sx={{ mt: 3 }}>
                <Typography variant="body2">
                    <strong>Comment ça marche ?</strong> Cliquez sur l'icône d'édition pour changer le rôle d'un utilisateur.
                    Les permissions associées au rôle seront automatiquement appliquées.
                </Typography>
            </Alert>
        </Box>
    );
};

export default UsersPermissionsPanel;
