// src/App.js - VERSION AVEC VÉRIFICATION DE SANTÉ DU SERVEUR ET THÈME MODERNE

import React, { useState, useEffect } from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';

import { AppProvider, useApp } from './contexts/AppContext';
import { CacheProvider } from './contexts/CacheContext';
import LoginPage from './pages/LoginPage';
import MainLayout from './layouts/MainLayout';
import ErrorBoundary from './components/common/ErrorBoundary';
import apiService from './services/apiService';
import theme from './styles/theme'; // Importer le nouveau thème moderne

// ✅ CORRECTION: Composant interne pour accéder au contexte et éviter la boucle infinie
function AppContent() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [configError, setConfigError] = useState(null);
    const { currentTechnician, setCurrentTechnician } = useApp(); // ✅ Utiliser le contexte

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

            // Étape 2: Vérifier l'authentification locale et charger les données complètes
            const storedTechnicianId = localStorage.getItem('currentTechnicianId');
            if (storedTechnicianId) {
                try {
                    // ✅ FIX: Charger la configuration complète pour obtenir le technicien avec rôle et permissions
                    const config = await apiService.getConfig();
                    const technician = config.it_technicians?.find(t => t.id === storedTechnicianId);

                    if (technician && technician.isActive) {
                        // Enrichir avec les permissions du rôle
                        const enrichedTechnician = { ...technician };
                        if (config.roles && technician.role) {
                            const roleConfig = config.roles[technician.role];
                            if (roleConfig && roleConfig.permissions) {
                                enrichedTechnician.permissions = roleConfig.permissions;
                            } else {
                                console.warn(`⚠️ Rôle "${technician.role}" introuvable, permissions viewer par défaut`);
                                enrichedTechnician.permissions = ['dashboard:view', 'sessions:view'];
                            }
                        } else {
                            console.warn('⚠️ Config non disponible, permissions viewer par défaut');
                            enrichedTechnician.permissions = ['dashboard:view', 'sessions:view'];
                        }

                        setCurrentTechnician(enrichedTechnician);
                        setIsAuthenticated(true);
                    } else {
                        // Technicien non trouvé ou désactivé, déconnecter
                        localStorage.removeItem('currentTechnicianId');
                    }
                } catch (error) {
                    console.error('Erreur chargement technicien:', error);
                    // En cas d'erreur, déconnecter pour forcer une vraie connexion
                    localStorage.removeItem('currentTechnicianId');
                }
            }

            setIsLoading(false);
        };

        checkHealthAndAuth();
    }, [setCurrentTechnician]);

    const handleLoginSuccess = (technician) => {
        setCurrentTechnician(technician); // ✅ Mettre à jour le contexte
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        apiService.logout();
        setIsAuthenticated(false);
        setCurrentTechnician(null); // ✅ Nettoyer le contexte
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
        <Router>
            {!isAuthenticated ? (
                <>
                    <ConfigErrorAlert />
                    <LoginPage onLoginSuccess={handleLoginSuccess} />
                </>
            ) : (
                <ErrorBoundary>
                    <CacheProvider>
                        <ConfigErrorAlert />
                        <MainLayout
                            onLogout={handleLogout}
                            currentTechnician={currentTechnician}
                        />
                    </CacheProvider>
                </ErrorBoundary>
            )}
        </Router>
    );
}

// ✅ Composant principal wrapper avec tous les providers
function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                <AppProvider>
                    <AppContent />
                </AppProvider>
            </LocalizationProvider>
        </ThemeProvider>
    );
}

export default App;
