// src/pages/LoginPage.js - VERSION FINALE UTILISANT apiService.login

import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Fade from '@mui/material/Fade';
import CircularProgress from '@mui/material/CircularProgress';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import apiService from '../services/apiService';
import { useApp } from '../contexts/AppContext';

const LoginPage = ({ onLoginSuccess }) => {
    const { setCurrentTechnician } = useApp();
    const [step, setStep] = useState(1);
    const [selectedTechnician, setSelectedTechnician] = useState(null);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [technicians, setTechnicians] = useState([]);
    const [connectedUsers, setConnectedUsers] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const [fullConfig, setFullConfig] = useState(null); // ✅ AJOUT: Stocker la config complète

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [config, connected] = await Promise.all([
                    apiService.getConfig(),
                    apiService.getConnectedTechnicians()
                ]);
                setFullConfig(config); // ✅ AJOUT: Sauvegarder config complète pour roles
                const configuredTechnicians = config.it_technicians || [];
                setTechnicians(configuredTechnicians);
                setConnectedUsers(Array.isArray(connected) ? connected.map(c => c.id) : []);
            } catch (err) {
                setError(`Erreur critique: Impossible de communiquer avec le backend. (${err.message})`);
            } finally {
                setIsLoadingData(false);
            }
        };
        loadInitialData();
    }, []);

    const handleTechnicianSelect = (technician) => {
        if (!technician.isActive) {
            setError('Ce compte technicien est désactivé.');
            return;
        }
        setSelectedTechnician(technician);
        setError('');
        setStep(2);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            // TODO: Remplacer la logique de mot de passe par un vrai appel API d'authentification
            if (password === 'admin') {
                // ✅ CORRECTION CRITIQUE: Enrichir le technicien avec les permissions de son rôle
                const enrichedTechnician = { ...selectedTechnician };

                // Charger les permissions depuis config.roles
                if (fullConfig && fullConfig.roles && selectedTechnician.role) {
                    const roleConfig = fullConfig.roles[selectedTechnician.role];
                    if (roleConfig && roleConfig.permissions) {
                        enrichedTechnician.permissions = roleConfig.permissions;
                        console.log(`✅ Permissions chargées pour ${selectedTechnician.name}:`, roleConfig.permissions);
                    } else {
                        console.warn(`⚠️ Rôle "${selectedTechnician.role}" introuvable, permissions par défaut appliquées`);
                        enrichedTechnician.permissions = ['dashboard:view']; // Permission minimale
                    }
                } else {
                    console.warn('⚠️ Config non disponible, permissions par défaut');
                    enrichedTechnician.permissions = ['dashboard:view'];
                }

                // CORRECTION : Appel de la méthode "login" qui existe dans l'instance d'apiService
                await apiService.login(enrichedTechnician);

                setCurrentTechnician(enrichedTechnician);
                onLoginSuccess(enrichedTechnician);
            } else {
                setError('Mot de passe incorrect (utilisez "admin" pour la démo).');
            }
        } catch (err) {
            setError(`Erreur de connexion: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoadingData) {
        return <Container component="main" maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}><CircularProgress size={60} sx={{ mb: 3 }} /><Typography variant="h5">Connexion au serveur RDS Viewer...</Typography></Container>;
    }

    if (error && technicians.length === 0) {
        return (
            <Container component="main" maxWidth="sm" sx={{ mt: 8 }}>
                 <Paper elevation={6} sx={{ p: 4, textAlign: 'center' }}>
                    <Typography component="h1" variant="h4">RDS Viewer - Anecoop</Typography>
                    <Alert severity="error" sx={{ mt: 3, textAlign: 'left' }}><Typography fontWeight="bold">Erreur de Connexion au Backend</Typography>{error}<Typography variant="body2" sx={{mt: 2}}>Veuillez vérifier que le serveur backend est bien démarré et accessible.</Typography></Alert>
                </Paper>
            </Container>
        );
    }

    if (step === 1) {
        return (
            <Container component="main" maxWidth="md" sx={{ mt: 4 }}>
                <Fade in={true}>
                    <Paper elevation={6} sx={{ p: 4 }}>
                        <Box sx={{ textAlign: 'center', mb: 4 }}><Typography component="h1" variant="h4">RDS Viewer - Anecoop</Typography><Typography color="textSecondary" variant="h6">Sélectionnez votre profil</Typography></Box>
                        <Grid container spacing={3}>
                            {technicians.map((tech) => {
                                const isConnected = connectedUsers.includes(tech.id);
                                return (
                                    <Grid item xs={12} sm={6} md={3} key={tech.id}>
                                        <Card elevation={isConnected ? 4 : 2} sx={{ height: '100%', border: isConnected ? '2px solid' : '1px solid transparent', borderColor: 'success.main', opacity: tech.isActive ? 1 : 0.6 }}>
                                            <CardActionArea onClick={() => handleTechnicianSelect(tech)} disabled={!tech.isActive} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                                <Box sx={{ position: 'relative' }}><Avatar sx={{ width: 64, height: 64, mb: 2, bgcolor: 'primary.main' }}>{tech.avatar}</Avatar>{isConnected && <CheckCircleIcon color="success" sx={{ position: 'absolute', bottom: 10, right: -5, bgcolor: 'white', borderRadius: '50%' }} />}</Box>
                                                <Typography variant="h6" component="h2" textAlign="center">{tech.name}</Typography>
                                                <Typography variant="body2" color="textSecondary" textAlign="center">{tech.position}</Typography>
                                                {!tech.isActive && <Chip label="Désactivé" size="small" color="error" sx={{ mt: 1 }} />}
                                            </CardActionArea>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </Paper>
                </Fade>
            </Container>
        );
    }

    return (
        <Container component="main" maxWidth="xs" sx={{ mt: 8 }}>
            <Fade in={true}>
                <Paper elevation={6} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Button startIcon={<ArrowBackIcon />} onClick={() => { setStep(1); setPassword(''); setError(''); }} sx={{ alignSelf: 'flex-start', mb: 2 }}>Retour</Button>
                    <Avatar sx={{ width: 80, height: 80, mb: 2, bgcolor: 'primary.main' }}>{selectedTechnician.avatar}</Avatar>
                    <Typography component="h1" variant="h5">{selectedTechnician.name}</Typography>
                    <Typography color="textSecondary" sx={{ mb: 3 }}>{selectedTechnician.position}</Typography>
                    <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
                        <TextField margin="normal" required fullWidth name="password" label="Mot de passe" type="password" autoComplete="current-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
                        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                        <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <LockOpenIcon />} disabled={isLoading}>{isLoading ? 'Connexion...' : 'Se connecter'}</Button>
                    </Box>
                </Paper>
            </Fade>
        </Container>
    );
};

export default LoginPage;