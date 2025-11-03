// src/App.js - VERSION FINALE

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

import { AppProvider } from './contexts/AppContext';
import { CacheProvider } from './contexts/CacheContext';
import LoginPage from './pages/LoginPage';
import MainLayout from './layouts/MainLayout';
import ErrorBoundary from './components/common/ErrorBoundary';
import apiService from './services/apiService';
import theme from './styles/theme';
import { Dialog } from '@mui/material';

// Configuration par défaut des dialogues
Dialog.defaultProps = {
    ...Dialog.defaultProps,
    hideBackdrop: false,
};

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentTechnician, setCurrentTechnician] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [configError, setConfigError] = useState(null);

    useEffect(() => {
        const checkHealthAndAuth = async () => {
            try {
                await apiService.checkServerHealth();
                setConfigError(null);
            } catch (error) {
                const errorMessage = error.response?.data?.message || error.message || "Erreur de communication avec le serveur.";
                setConfigError(errorMessage);
            }
            const storedTechnicianId = localStorage.getItem('currentTechnicianId');
            if (storedTechnicianId) {
                setCurrentTechnician({ id: storedTechnicianId });
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
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
    }

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
                </AppProvider>
            </LocalizationProvider>
        </ThemeProvider>
    );
}

export default App;
