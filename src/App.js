// src/App.js - VERSION AVEC VÉRIFICATION DE SANTÉ DU SERVEUR

import React, { useState, useEffect } from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';

import { AppProvider } from './contexts/AppContext';
import { CacheProvider } from './contexts/CacheContext';
import LoginPage from './pages/LoginPage';
import MainLayout from './layouts/MainLayout';
import apiService from './services/apiService'; // Importer le service API

const theme = createTheme({
    // ... (thème inchangé)
});

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentTechnician, setCurrentTechnician] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [configError, setConfigError] = useState(null); // Nouvel état pour l'erreur de config

    useEffect(() => {
        const checkHealthAndAuth = async () => {
            try {
                // Étape 1: Vérifier la santé du serveur
                await apiService.checkServerHealth();
                setConfigError(null); // Si tout va bien, on s'assure qu'il n'y a pas de message d'erreur
            } catch (error) {
                // Si le serveur renvoie une erreur (ex: 503), on affiche le message
                const errorMessage = error.response?.data?.message || error.message || "Erreur de communication avec le serveur.";
                setConfigError(errorMessage);
            }

            // Étape 2: Vérifier l'authentification locale (ne change pas)
            // On peut tenter de s'authentifier même si le serveur a un problème de config,
            // car l'admin pourrait avoir besoin d'accéder à la page des paramètres.
            const storedTechnicianId = localStorage.getItem('currentTechnicianId');
            if (storedTechnicianId) {
                // Idéalement, on devrait valider le technicien auprès de l'API ici
                setCurrentTechnician({ id: storedTechnicianId }); // Simulation simple
                setIsAuthenticated(true);
            }

            setIsLoading(false);
        };

        checkHealthAndAuth();
    }, []);

    const handleLoginSuccess = (technician) => {
        setCurrentTechnician(technician);
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        apiService.logout();
        setIsAuthenticated(false);
        setCurrentTechnician(null);
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Le rendu conditionnel du bandeau d'erreur
    const ConfigErrorAlert = () => (
        configError && (
            <Alert severity="error" sx={{ m: 2, borderRadius: 1 }}>
                <AlertTitle>Erreur Critique du Serveur</AlertTitle>
                {configError}
            </Alert>
        )
    );

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                <AppProvider>
                    <Router>
                        {!isAuthenticated ? (
                            <>
                                <ConfigErrorAlert />
                                <LoginPage onLoginSuccess={handleLoginSuccess} />
                            </>
                        ) : (
                            <CacheProvider>
                                <ConfigErrorAlert />
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
