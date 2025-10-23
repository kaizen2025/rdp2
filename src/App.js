// src/App.js - VERSION FINALE REFACTORISÉE POUR L'ARCHITECTURE WEB

import React, { useState, useEffect } from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';

// Import des nouveaux contextes et services
import { AppProvider } from './contexts/AppContext';
import { CacheProvider } from './contexts/CacheContext';

// Import des pages et layouts
import LoginPage from './pages/LoginPage';
import MainLayout from './layouts/MainLayout';

// Thème Material-UI (inchangé)
const theme = createTheme({
    palette: {
        mode: 'light',
        primary: { main: '#1976d2' },
        secondary: { main: '#dc004e' },
        background: {
            default: '#f4f6f8',
            paper: '#ffffff'
        }
    },
    typography: {
        fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }
});

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentTechnician, setCurrentTechnician] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Vérifie si une session est déjà active (ex: via un token JWT dans le localStorage)
    useEffect(() => {
        const checkAuth = async () => {
            try {
                // TODO: Remplacer cette simulation par une vraie vérification de token
                // Par exemple: const profile = await apiService.getProfile();
                // if (profile) {
                //   setCurrentTechnician(profile.technician);
                //   setIsAuthenticated(true);
                // }

                // --- SIMULATION POUR LA MIGRATION ---
                // Pour l'instant, on considère l'utilisateur comme non connecté au démarrage
                // pour forcer le passage par la page de login.
                // Dans une application de production, on vérifierait un token ici.
                setIsAuthenticated(false);
                // ------------------------------------

            } catch (error) {
                console.error('Échec de la vérification de session:', error);
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    const handleLoginSuccess = (technician) => {
        console.log('✅ Login réussi:', technician);
        // TODO: Stocker le token d'authentification reçu du serveur
        // localStorage.setItem('authToken', technician.token);
        setCurrentTechnician(technician);
        setIsAuthenticated(true);
    };

    const handleLogout = async () => {
        // TODO: Appeler une route de déconnexion sur l'API
        // await apiService.logout();
        // localStorage.removeItem('authToken');
        
        console.log('✅ Déconnexion réussie');
        setIsAuthenticated(false);
        setCurrentTechnician(null);
    };

    // Affiche un spinner de chargement pendant la vérification de session initiale
    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                {/* Le AppProvider enveloppe TOUTE l'application pour fournir le contexte WebSocket */}
                <AppProvider>
                    <Router>
                        {!isAuthenticated ? (
                            // Si non authentifié, afficher la page de connexion
                            <LoginPage onLoginSuccess={handleLoginSuccess} />
                        ) : (
                            // Si authentifié, fournir le CacheProvider et afficher l'interface principale
                            <CacheProvider>
                                <MainLayout 
                                    onLogout={handleLogout} 
                                    currentTechnician={currentTechnician}
                                />
                            </CacheProvider>
                        )}
                    </Router>
                </AppProvider>
            </LocalizationProvider>
        </ThemeProvider>
    );
}

export default App;