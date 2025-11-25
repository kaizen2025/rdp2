// src/demo/DemoApp.js - Application de démonstration des composants responsive

import React, { useState, useMemo } from 'react';
import {
  ThemeProvider as MUIThemeProvider,
  CssBaseline,
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Alert
} from '@mui/material';

import { ResponsiveThemeProvider } from '../theme/ResponsiveThemeProvider';
import { useBreakpoint } from '../hooks/useBreakpoint';
import LoanManagementDashboard from '../components/LoanManagementDashboard';

// Données de démonstration
const generateMockData = () => {
  const users = [
    { id: 1, username: 'john.doe', displayName: 'John Doe', department: 'IT' },
    { id: 2, username: 'jane.smith', displayName: 'Jane Smith', department: 'Marketing' },
    { id: 3, username: 'bob.wilson', displayName: 'Bob Wilson', department: 'RH' },
    { id: 4, username: 'alice.brown', displayName: 'Alice Brown', department: 'Finance' },
    { id: 5, username: 'mike.davis', displayName: 'Mike Davis', department: 'IT' }
  ];

  const computers = [
    { id: 1, name: 'Dell XPS 15', brand: 'Dell', model: 'XPS 15 9500', status: 'available' },
    { id: 2, name: 'MacBook Pro', brand: 'Apple', model: 'MacBook Pro 16"', status: 'available' },
    { id: 3, name: 'ThinkPad X1', brand: 'Lenovo', model: 'ThinkPad X1 Carbon', status: 'available' },
    { id: 4, name: 'Surface Laptop', brand: 'Microsoft', model: 'Surface Laptop 4', status: 'available' },
    { id: 5, name: 'ZenBook Pro', brand: 'ASUS', model: 'ZenBook Pro Duo', status: 'available' }
  ];

  const loans = [
    {
      id: 1,
      computerId: 1,
      computerName: 'Dell XPS 15',
      userId: 1,
      userName: 'john.doe',
      userDisplayName: 'John Doe',
      userDepartment: 'IT',
      status: 'active',
      loanDate: '2024-11-01T10:00:00Z',
      expectedReturnDate: '2024-11-15T10:00:00Z',
      amount: 1500,
      accessories: [1, 2],
      notes: 'Poste de développement principal'
    },
    {
      id: 2,
      computerId: 2,
      computerName: 'MacBook Pro',
      userId: 2,
      userName: 'jane.smith',
      userDisplayName: 'Jane Smith',
      userDepartment: 'Marketing',
      status: 'overdue',
      loanDate: '2024-10-20T09:00:00Z',
      expectedReturnDate: '2024-11-10T09:00:00Z',
      amount: 2500,
      accessories: [1, 3],
      notes: 'Conception graphique'
    },
    {
      id: 3,
      computerId: 3,
      computerName: 'ThinkPad X1',
      userId: 3,
      userName: 'bob.wilson',
      userDisplayName: 'Bob Wilson',
      userDepartment: 'RH',
      status: 'critical',
      loanDate: '2024-10-15T14:00:00Z',
      expectedReturnDate: '2024-11-05T14:00:00Z',
      amount: 1200,
      accessories: [1],
      notes: 'Gestion des ressources humaines'
    },
    {
      id: 4,
      computerId: 4,
      computerName: 'Surface Laptop',
      userId: 4,
      userName: 'alice.brown',
      userDisplayName: 'Alice Brown',
      userDepartment: 'Finance',
      status: 'reserved',
      loanDate: '2024-11-16T10:00:00Z',
      expectedReturnDate: '2024-11-30T10:00:00Z',
      amount: 1800,
      accessories: [2, 4],
      notes: 'Applications comptables'
    },
    {
      id: 5,
      computerId: 5,
      computerName: 'ZenBook Pro',
      userId: 5,
      userName: 'mike.davis',
      userDisplayName: 'Mike Davis',
      userDepartment: 'IT',
      status: 'active',
      loanDate: '2024-11-10T11:00:00Z',
      expectedReturnDate: '2024-11-25T11:00:00Z',
      amount: 2200,
      accessories: [1, 2, 3],
      notes: 'Serveur de développement'
    }
  ];

  const itStaff = ['Jean Technicien', 'Marie Admin', 'Pierre Support'];

  return { users, computers, loans, itStaff };
};

const DemoInfo = () => {
  const { isMobile, isTablet, isDesktop, currentBreakpoint, orientation } = useBreakpoint();

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        📱 Informations du Device
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <Alert severity="info">
          <strong>Breakpoint:</strong> {currentBreakpoint}
        </Alert>
        <Alert severity="info">
          <strong>Orientation:</strong> {orientation}
        </Alert>
      </Box>
      
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Alert severity={isMobile ? "warning" : "success"}>
          <strong>Mobile:</strong> {isMobile ? '✅' : '❌'}
        </Alert>
        <Alert severity={isTablet ? "warning" : "success"}>
          <strong>Tablet:</strong> {isTablet ? '✅' : '❌'}
        </Alert>
        <Alert severity={isDesktop ? "warning" : "success"}>
          <strong>Desktop:</strong> {isDesktop ? '✅' : '❌'}
        </Alert>
      </Box>
    </Paper>
  );
};

const DemoApp = () => {
  const [themeMode, setThemeMode] = useState('light');
  const [currentDemo, setCurrentDemo] = useState('dashboard'); // 'dashboard', 'loans', 'forms'

  // Générer les données de démonstration
  const mockData = useMemo(() => generateMockData(), []);

  // Handlers pour les actions
  const handleSaveLoan = async (loanData) => {
    console.log('Saving loan:', loanData);
    // Simulation d'un délai
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  };

  const handleReturnLoan = async (loan, notes, accessoryInfo) => {
    console.log('Returning loan:', { loan, notes, accessoryInfo });
    // Simulation d'un délai
    await new Promise(resolve => setTimeout(resolve, 1500));
    return { success: true };
  };

  const handleEditLoan = (loan) => {
    console.log('Editing loan:', loan);
  };

  const handleExtendLoan = (loan) => {
    console.log('Extending loan:', loan);
  };

  const handleCancelLoan = (loan) => {
    console.log('Cancelling loan:', loan);
  };

  const handleHistoryLoan = (loan) => {
    console.log('History for loan:', loan);
  };

  const toggleTheme = () => {
    setThemeMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ResponsiveThemeProvider 
      mode={themeMode} 
      enableAutoDetection={true}
      onThemeChange={(mode) => console.log('Theme changed to:', mode)}
    >
      <CssBaseline />
      
      <Box sx={{ 
        minHeight: '100vh',
        bgcolor: 'background.default'
      }}>
        {/* Header de démonstration */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Container maxWidth="lg">
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2
            }}>
              <Typography variant="h4" fontWeight="bold">
                🚀 DocuCortex Enhanced - Demo
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant={currentDemo === 'dashboard' ? 'contained' : 'outlined'}
                  onClick={() => setCurrentDemo('dashboard')}
                  size="small"
                >
                  Dashboard
                </Button>
                <Button
                  variant={currentDemo === 'loans' ? 'contained' : 'outlined'}
                  onClick={() => setCurrentDemo('loans')}
                  size="small"
                >
                  Gestion Prêts
                </Button>
                <Button
                  variant={currentDemo === 'forms' ? 'contained' : 'outlined'}
                  onClick={() => setCurrentDemo('forms')}
                  size="small"
                >
                  Formulaires
                </Button>
                <Button
                  variant="outlined"
                  onClick={toggleTheme}
                  size="small"
                >
                  {themeMode === 'light' ? '🌙' : '☀️'}
                </Button>
              </Box>
            </Box>
          </Container>
        </Paper>

        {/* Contenu selon la démo sélectionnée */}
        <Container maxWidth="lg" sx={{ pb: 4 }}>
          {currentDemo === 'dashboard' && (
            <>
              <DemoInfo />
              <LoanManagementDashboard
                loans={mockData.loans}
                users={mockData.users}
                computers={mockData.computers}
                itStaff={mockData.itStaff}
                onSaveLoan={handleSaveLoan}
                onReturnLoan={handleReturnLoan}
                onEditLoan={handleEditLoan}
                onExtendLoan={handleExtendLoan}
                onCancelLoan={handleCancelLoan}
                onHistoryLoan={handleHistoryLoan}
              />
            </>
          )}

          {currentDemo === 'loans' && (
            <>
              <DemoInfo />
              <Typography variant="h5" gutterBottom>
                📋 Gestion des Prêts - Vue Détaillée
              </Typography>
              <Typography variant="body1" color="textSecondary" paragraph>
                Cette démonstration montre l'interface complète de gestion des prêts 
                avec toutes les fonctionnalités responsive.
              </Typography>
              
              <LoanManagementDashboard
                loans={mockData.loans}
                users={mockData.users}
                computers={mockData.computers}
                itStaff={mockData.itStaff}
                onSaveLoan={handleSaveLoan}
                onReturnLoan={handleReturnLoan}
                onEditLoan={handleEditLoan}
                onExtendLoan={handleExtendLoan}
                onCancelLoan={handleCancelLoan}
                onHistoryLoan={handleHistoryLoan}
              />
            </>
          )}

          {currentDemo === 'forms' && (
            <>
              <DemoInfo />
              <Typography variant="h5" gutterBottom>
                📝 Démonstration des Formulaires Responsive
              </Typography>
              
              <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    🎯 Fonctionnalités Démontrées
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Alert severity="success">
                      ✅ Formulaires multi-étapes responsive
                    </Alert>
                    <Alert severity="success">
                      ✅ Validation en temps réel
                    </Alert>
                    <Alert severity="success">
                      ✅ Interface scan QR Code
                    </Alert>
                    <Alert severity="success">
                      ✅ Signature digitale tactile
                    </Alert>
                    <Alert severity="success">
                      ✅ Navigation gestuelle (swipe)
                    </Alert>
                    <Alert severity="success">
                      ✅ Dark mode automatique
                    </Alert>
                  </Box>
                </Paper>
                
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    📱 Breakpoints Testés
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2">
                      <strong>Mobile (xs-sm):</strong> Formulaire fullscreen, navigation tactile
                    </Typography>
                    <Typography variant="body2">
                      <strong>Tablet (md):</strong> Formulaire adaptatif, grille 2 colonnes
                    </Typography>
                    <Typography variant="body2">
                      <strong>Desktop (lg-xl):</strong> Formulaire modal, grille 3 colonnes
                    </Typography>
                  </Box>
                  
                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                    🎮 Interactions Disponibles
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2">• Tap : Sélectionner</Typography>
                    <Typography variant="body2">• Swipe ← : Précédent/Modifier</Typography>
                    <Typography variant="body2">• Swipe → : Suivant/Retour</Typography>
                    <Typography variant="body2">• Pinch : Zoom (futur)</Typography>
                  </Box>
                </Paper>
              </Box>
            </>
          )}
        </Container>

        {/* Footer */}
        <Paper sx={{ p: 2, mt: 4 }}>
          <Container maxWidth="lg">
            <Typography variant="body2" color="textSecondary" align="center">
              🎉 DocuCortex Enhanced Demo - Interface responsive complète | 
              Compatible mobile, tablette et desktop
            </Typography>
          </Container>
        </Paper>
      </Box>
    </ResponsiveThemeProvider>
  );
};

export default DemoApp;