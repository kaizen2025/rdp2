/**
 * LoginPage - Interface de connexion améliorée avec authentification app_users
 * Système de sélection de technicien avec design moderne + gestion complète permissions
 */

import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Button, Alert, Container,
    CircularProgress, Fade, Card, CardActionArea, CardContent,
    Avatar, Grid, Chip, Zoom, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, InputAdornment, IconButton
} from '@mui/material';
import {
    LockOpen as LockOpenIcon,
    Visibility, VisibilityOff
} from '@mui/icons-material';

import apiService from '../services/apiService';
import { useApp } from '../contexts/AppContext';

const LoginPage = ({ onLoginSuccess }) => {
    const { setCurrentTechnician } = useApp();

    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    // Dialog changement mot de passe
    const [changePasswordDialog, setChangePasswordDialog] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loggedUser, setLoggedUser] = useState(null);

    // Charger les utilisateurs depuis app_users
    useEffect(() => {
        const loadUsers = async () => {
            setLoadingUsers(true);
            try {
                const response = await apiService.getAllAppUsers();
                if (response.success && response.users) {
                    // Filtrer uniquement les utilisateurs actifs
                    const activeUsers = response.users.filter(u => u.is_active === 1);
                    setUsers(activeUsers);
                } else {
                    setUsers([]);
                }
            } catch (error) {
                console.error('Erreur chargement utilisateurs:', error);
                setError('Impossible de charger la liste des utilisateurs');
            } finally {
                setLoadingUsers(false);
            }
        };

        loadUsers();
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!selectedUser) {
            setError('Veuillez sélectionner un utilisateur');
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            // Authentification via API app_users
            const result = await apiService.login(selectedUser.username, password);

            if (result.success && result.user) {
                setLoggedUser(result.user);

                // Vérifier si l'utilisateur doit changer son mot de passe
                if (result.mustChangePassword) {
                    setChangePasswordDialog(true);
                    setIsLoading(false);
                    return;
                }

                // Connexion réussie
                setCurrentTechnician(result.user);
                localStorage.setItem('currentUserId', result.user.id.toString());
                onLoginSuccess(result.user);
            } else {
                setError(result.error || 'Erreur de connexion');
            }
        } catch (err) {
            console.error('Erreur login:', err);
            setError(`Erreur de connexion: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        if (newPassword.length < 4) {
            setError('Le mot de passe doit contenir au moins 4 caractères');
            return;
        }

        try {
            setIsLoading(true);
            const result = await apiService.changePassword(loggedUser.id, password, newPassword);

            if (result.success) {
                const updatedUser = { ...loggedUser, must_change_password: 0 };
                setCurrentTechnician(updatedUser);
                localStorage.setItem('currentUserId', updatedUser.id.toString());
                onLoginSuccess(updatedUser);
            } else {
                setError(result.error || 'Erreur lors du changement de mot de passe');
            }
        } catch (err) {
            console.error('Erreur changement mot de passe:', err);
            setError(`Erreur: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Couleurs de fond pour les avatars selon admin/user
    const getAvatarColor = (user) => {
        if (user.is_admin === 1) return '#d32f2f'; // Rouge pour admin
        return '#667eea'; // Violet pour utilisateurs normaux
    };

    if (loadingUsers) {
        return (
            <Container component="main" maxWidth="md" sx={{ mt: 8 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <CircularProgress size={60} />
                </Box>
            </Container>
        );
    }

    return (
        <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Fade in={true} timeout={800}>
                <Paper
                    elevation={12}
                    sx={{
                        p: { xs: 3, md: 5 },
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        borderRadius: 3
                    }}
                >
                    {/* En-tête */}
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Typography
                            component="h1"
                            variant="h3"
                            fontWeight="bold"
                            gutterBottom
                            sx={{
                                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                                letterSpacing: '0.5px'
                            }}
                        >
                            🖥️ RDS Viewer - Anecoop
                        </Typography>
                        <Typography
                            variant="h6"
                            sx={{
                                opacity: 0.95,
                                fontWeight: 300
                            }}
                        >
                            Gestionnaire de sessions et ressources
                        </Typography>
                    </Box>

                    {/* Zone de connexion */}
                    <Paper
                        elevation={4}
                        sx={{
                            p: { xs: 3, md: 4 },
                            bgcolor: 'rgba(255, 255, 255, 0.98)',
                            borderRadius: 3,
                            backdropFilter: 'blur(10px)'
                        }}
                    >
                        <Box component="form" onSubmit={handleLogin}>
                            <Typography
                                variant="h5"
                                gutterBottom
                                color="primary"
                                fontWeight="600"
                                sx={{ mb: 3 }}
                            >
                                👤 Sélectionnez votre profil
                            </Typography>

                            {/* Grille d'utilisateurs */}
                            <Grid container spacing={2} sx={{ mb: 4 }}>
                                {users.map((user, index) => (
                                    <Grid item xs={12} sm={6} md={4} lg={3} key={user.id}>
                                        <Zoom in={true} timeout={300 + index * 100}>
                                            <Card
                                                elevation={selectedUser?.id === user.id ? 12 : 3}
                                                sx={{
                                                    border: selectedUser?.id === user.id ? 4 : 0,
                                                    borderColor: 'primary.main',
                                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    transform: selectedUser?.id === user.id ? 'scale(1.05)' : 'scale(1)',
                                                    '&:hover': {
                                                        transform: 'translateY(-4px)',
                                                        boxShadow: 6
                                                    }
                                                }}
                                            >
                                                <CardActionArea
                                                    onClick={() => setSelectedUser(user)}
                                                    sx={{ height: '100%' }}
                                                >
                                                    <CardContent sx={{ textAlign: 'center', py: 3, px: 2 }}>
                                                        <Avatar
                                                            src={user.profile_picture_url || undefined}
                                                            sx={{
                                                                width: 72,
                                                                height: 72,
                                                                mx: 'auto',
                                                                mb: 2,
                                                                bgcolor: getAvatarColor(user),
                                                                fontSize: '1.8rem',
                                                                fontWeight: 'bold',
                                                                boxShadow: 3,
                                                                border: selectedUser?.id === user.id ? 3 : 0,
                                                                borderColor: 'white'
                                                            }}
                                                        >
                                                            {!user.profile_picture_url && user.display_name.substring(0, 2).toUpperCase()}
                                                        </Avatar>
                                                        <Typography
                                                            variant="h6"
                                                            gutterBottom
                                                            fontWeight="600"
                                                            sx={{
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            {user.display_name}
                                                        </Typography>
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            sx={{
                                                                mb: 1,
                                                                minHeight: '40px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                        >
                                                            {user.position || 'Technicien'}
                                                        </Typography>
                                                        {user.is_admin === 1 && (
                                                            <Chip
                                                                label="ADMIN"
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: '#d32f2f',
                                                                    color: 'white',
                                                                    fontWeight: 'bold',
                                                                    fontSize: '0.7rem'
                                                                }}
                                                            />
                                                        )}
                                                    </CardContent>
                                                </CardActionArea>
                                            </Card>
                                        </Zoom>
                                    </Grid>
                                ))}
                            </Grid>

                            {/* Message si aucune sélection */}
                            {!selectedUser && (
                                <Fade in={true}>
                                    <Alert
                                        severity="info"
                                        icon="👆"
                                        sx={{
                                            mb: 3,
                                            fontSize: '1rem',
                                            fontWeight: 500
                                        }}
                                    >
                                        Cliquez sur une carte pour sélectionner votre profil
                                    </Alert>
                                </Fade>
                            )}

                            {/* Champ mot de passe (apparaît après sélection) */}
                            {selectedUser && (
                                <Fade in={true} timeout={500}>
                                    <Box>
                                        <TextField
                                            margin="normal"
                                            required
                                            fullWidth
                                            label="Mot de passe"
                                            type={showPassword ? 'text' : 'password'}
                                            autoComplete="current-password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            disabled={isLoading}
                                            autoFocus
                                            sx={{
                                                mb: 2,
                                                '& .MuiOutlinedInput-root': {
                                                    fontSize: '1.1rem'
                                                }
                                            }}
                                            InputProps={{
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            edge="end"
                                                            size="large"
                                                        >
                                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                                        </IconButton>
                                                    </InputAdornment>
                                                )
                                            }}
                                        />

                                        {error && (
                                            <Alert severity="error" sx={{ mb: 2 }}>
                                                {error}
                                            </Alert>
                                        )}

                                        <Button
                                            type="submit"
                                            fullWidth
                                            variant="contained"
                                            size="large"
                                            sx={{
                                                py: 1.8,
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                fontWeight: 700,
                                                fontSize: '1.2rem',
                                                borderRadius: 2,
                                                textTransform: 'none',
                                                boxShadow: 4,
                                                '&:hover': {
                                                    background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                                                    boxShadow: 6,
                                                    transform: 'translateY(-2px)'
                                                },
                                                transition: 'all 0.3s'
                                            }}
                                            startIcon={isLoading ? <CircularProgress size={24} color="inherit" /> : <LockOpenIcon />}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? 'Connexion en cours...' : 'Se connecter'}
                                        </Button>

                                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Mot de passe par défaut : admin
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Fade>
                            )}
                        </Box>
                    </Paper>

                    {/* Footer */}
                    <Box sx={{ textAlign: 'center', mt: 3, opacity: 0.9 }}>
                        <Typography variant="caption" sx={{ fontSize: '0.85rem' }}>
                            © 2025 Anecoop - RDS Viewer v3.1
                        </Typography>
                    </Box>
                </Paper>
            </Fade>

            {/* Dialog changement de mot de passe obligatoire */}
            <Dialog
                open={changePasswordDialog}
                disableEscapeKeyDown
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    fontWeight: 600
                }}>
                    Changement de mot de passe requis
                </DialogTitle>
                <DialogContent sx={{ mt: 3 }}>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Pour des raisons de sécurité, vous devez changer votre mot de passe avant de continuer.
                    </Alert>

                    <TextField
                        fullWidth
                        margin="normal"
                        label="Nouveau mot de passe"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={isLoading}
                        autoFocus
                    />

                    <TextField
                        fullWidth
                        margin="normal"
                        label="Confirmer le mot de passe"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isLoading}
                    />

                    {error && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {error}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        variant="contained"
                        onClick={handleChangePassword}
                        disabled={isLoading || !newPassword || !confirmPassword}
                        sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            fontWeight: 600
                        }}
                    >
                        {isLoading ? 'Changement...' : 'Changer le mot de passe'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default LoginPage;
