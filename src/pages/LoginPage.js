/**
 * LoginPage - Interface de connexion améliorée
 * Système de sélection de technicien IT avec design moderne
 */

import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, TextField, Button, Alert, Container,
    CircularProgress, Fade, InputAdornment, IconButton, Card,
    CardActionArea, CardContent, Avatar, Grid, Chip, Zoom
} from '@mui/material';
import {
    LockOpen as LockOpenIcon,
    Visibility, VisibilityOff
} from '@mui/icons-material';

import apiService from '../services/apiService';
import { useApp } from '../contexts/AppContext';

const LoginPage = ({ onLoginSuccess }) => {
    const { setCurrentTechnician } = useApp();

    const [technicians, setTechnicians] = useState([]);
    const [selectedTechnician, setSelectedTechnician] = useState(null);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Charger les techniciens disponibles
    useEffect(() => {
        const loadTechnicians = async () => {
            try {
                const config = await apiService.getConfig();
                if (config && config.it_technicians) {
                    // Filtrer uniquement les techniciens actifs
                    const activeTechs = config.it_technicians.filter(t => t.isActive);
                    setTechnicians(activeTechs);
                }
            } catch (error) {
                console.error('Erreur chargement techniciens:', error);
                setError('Impossible de charger la liste des techniciens');
            }
        };

        loadTechnicians();
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!selectedTechnician) {
            setError('Veuillez sélectionner un technicien');
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            // Vérifier le mot de passe (SHA-256)
            const passwordHash = await hashPassword(password);
            const config = await apiService.getConfig();

            if (passwordHash !== config.appPasswordHash) {
                setError('Mot de passe incorrect');
                setIsLoading(false);
                return;
            }

            // Enrichir le technicien avec les permissions du rôle
            const enrichedTechnician = { ...selectedTechnician };
            if (config.roles && selectedTechnician.role) {
                const roleConfig = config.roles[selectedTechnician.role];
                if (roleConfig && roleConfig.permissions) {
                    enrichedTechnician.permissions = roleConfig.permissions;
                } else {
                    console.warn(`⚠️ Rôle "${selectedTechnician.role}" introuvable, permissions viewer par défaut`);
                    enrichedTechnician.permissions = ['dashboard:view', 'sessions:view'];
                }
            } else {
                enrichedTechnician.permissions = ['dashboard:view', 'sessions:view'];
            }

            // Connexion réussie
            setCurrentTechnician(enrichedTechnician);
            localStorage.setItem('currentTechnicianId', enrichedTechnician.id);
            onLoginSuccess(enrichedTechnician);
        } catch (err) {
            console.error('Erreur login:', err);
            setError(`Erreur de connexion: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Hash SHA-256
    const hashPassword = async (password) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    // Couleurs de fond pour les avatars selon le rôle
    const getAvatarColor = (role) => {
        const colors = {
            'admin': '#d32f2f',
            'manager': '#1976d2',
            'technician': '#388e3c',
            'viewer': '#757575'
        };
        return colors[role] || '#667eea';
    };

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

                            {/* Grille de techniciens */}
                            <Grid container spacing={2} sx={{ mb: 4 }}>
                                {technicians.map((tech, index) => (
                                    <Grid item xs={12} sm={6} md={4} lg={3} key={tech.id}>
                                        <Zoom in={true} timeout={300 + index * 100}>
                                            <Card
                                                elevation={selectedTechnician?.id === tech.id ? 12 : 3}
                                                sx={{
                                                    border: selectedTechnician?.id === tech.id ? 4 : 0,
                                                    borderColor: 'primary.main',
                                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    transform: selectedTechnician?.id === tech.id ? 'scale(1.05)' : 'scale(1)',
                                                    '&:hover': {
                                                        transform: 'translateY(-4px)',
                                                        boxShadow: 6
                                                    }
                                                }}
                                            >
                                                <CardActionArea
                                                    onClick={() => setSelectedTechnician(tech)}
                                                    sx={{ height: '100%' }}
                                                >
                                                    <CardContent sx={{ textAlign: 'center', py: 3, px: 2 }}>
                                                        <Avatar
                                                            sx={{
                                                                width: 72,
                                                                height: 72,
                                                                mx: 'auto',
                                                                mb: 2,
                                                                bgcolor: getAvatarColor(tech.role),
                                                                fontSize: '1.8rem',
                                                                fontWeight: 'bold',
                                                                boxShadow: 3,
                                                                border: selectedTechnician?.id === tech.id ? 3 : 0,
                                                                borderColor: 'white'
                                                            }}
                                                        >
                                                            {tech.avatar || tech.name.substring(0, 2).toUpperCase()}
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
                                                            {tech.name}
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
                                                            {tech.position}
                                                        </Typography>
                                                        {tech.role && (
                                                            <Chip
                                                                label={tech.role.toUpperCase()}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: getAvatarColor(tech.role),
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
                            {!selectedTechnician && (
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
                            {selectedTechnician && (
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
                                    </Box>
                                </Fade>
                            )}
                        </Box>
                    </Paper>

                    {/* Footer */}
                    <Box sx={{ textAlign: 'center', mt: 3, opacity: 0.9 }}>
                        <Typography variant="caption" sx={{ fontSize: '0.85rem' }}>
                            © 2025 Anecoop - RDS Viewer v3.0
                        </Typography>
                    </Box>
                </Paper>
            </Fade>
        </Container>
    );
};

export default LoginPage;
