/**
 * LoginPage - Interface de connexion adaptée au nouveau système app_users
 * Support à la fois de l'ancien système (IT technicians) et du nouveau (app_users)
 */

import React, { useState } from 'react';
import {
    Box, Paper, Typography, TextField, Button, Alert, Container,
    CircularProgress, Fade, InputAdornment, IconButton, Dialog,
    DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
    LockOpen as LockOpenIcon,
    Visibility, VisibilityOff
} from '@mui/icons-material';

import apiService from '../services/apiService';
import { useApp } from '../contexts/AppContext';

const LoginPage = ({ onLoginSuccess }) => {
    const { setCurrentTechnician } = useApp();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [mustChangePassword, setMustChangePassword] = useState(false);
    const [changePasswordDialog, setChangePasswordDialog] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loggedUser, setLoggedUser] = useState(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // ✅ NOUVEAU SYSTÈME - Authentification via API app_users
            const result = await apiService.login(username, password);

            if (result.success && result.user) {
                setLoggedUser(result.user);

                // Vérifier si l'utilisateur doit changer son mot de passe
                if (result.mustChangePassword) {
                    setMustChangePassword(true);
                    setChangePasswordDialog(true);
                    setIsLoading(false);
                    return;
                }

                // Connexion réussie - Mettre à jour le contexte
                setCurrentTechnician(result.user);

                // Sauvegarder l'ID utilisateur pour persistance
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
                // Mot de passe changé avec succès
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

    return (
        <Container component="main" maxWidth="xs" sx={{ mt: 8 }}>
            <Fade in={true}>
                <Paper
                    elevation={6}
                    sx={{
                        p: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white'
                    }}
                >
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Typography component="h1" variant="h4" fontWeight="bold" gutterBottom>
                            RDS Viewer - Anecoop
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Gestionnaire de sessions et ressources
                        </Typography>
                    </Box>

                    <Box
                        component="form"
                        onSubmit={handleLogin}
                        sx={{
                            width: '100%',
                            p: 3,
                            bgcolor: 'white',
                            borderRadius: 2,
                            color: 'text.primary'
                        }}
                    >
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Nom d'utilisateur"
                            autoComplete="username"
                            autoFocus
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={isLoading}
                        />

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
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />

                        {error && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                {error}
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{
                                mt: 3,
                                mb: 2,
                                py: 1.5,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                fontWeight: 600,
                                fontSize: '1.1rem'
                            }}
                            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <LockOpenIcon />}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Connexion...' : 'Se connecter'}
                        </Button>

                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                                Compte par défaut: admin / admin
                            </Typography>
                        </Box>
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
