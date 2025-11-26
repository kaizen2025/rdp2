// src/components/LoanManagementDashboard.js - Dashboard complet responsive

import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Fab,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Add as AddIcon,
  Dashboard as DashboardIcon,
  Assignment as LoansIcon,
  AssignmentReturn as ReturnsIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';

import { useBreakpoint } from '../hooks/useBreakpoint';
import LoanListResponsive from './loan-management/LoanListResponsive';
import LoanDialogResponsive from './LoanDialogResponsive';
import ReturnLoanDialogResponsive from './ReturnLoanDialogResponsive';
import MobileActionBar from './responsive/MobileActionBar';
import DesktopSidebar from './responsive/DesktopSidebar';

const LoanManagementDashboard = ({ 
  loans = [],
  users = [],
  computers = [],
  itStaff = [],
  onSaveLoan,
  onReturnLoan,
  onEditLoan,
  onExtendLoan,
  onCancelLoan,
  onHistoryLoan
}) => {
  const theme = useTheme();
  const { isMobile, isTablet, isDesktop, currentBreakpoint } = useBreakpoint();
  
  // États
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(isDesktop);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);

  // Statistiques calculées
  const statistics = useMemo(() => {
    const total = loans.length;
    const active = loans.filter(l => l.status === 'active').length;
    const overdue = loans.filter(l => l.status === 'overdue').length;
    const critical = loans.filter(l => l.status === 'critical').length;
    const returned = loans.filter(l => l.status === 'returned').length;
    const reserved = loans.filter(l => l.status === 'reserved').length;
    
    return {
      total,
      active,
      overdue,
      critical,
      returned,
      reserved,
      userCount: new Set(loans.map(l => l.userId)).size,
      computerCount: new Set(loans.map(l => l.computerId)).size
    };
  }, [loans]);

  // Gestion des couleurs utilisateur (simulation)
  const getUserColor = (userId) => {
    const colors = ['#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#f44336', '#00bcd4'];
    const index = userId ? userId.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  // Actions
  const handleCreateLoan = () => {
    setSelectedLoan(null);
    setDialogOpen(true);
  };

  const handleEditLoan = (loan) => {
    setSelectedLoan(loan);
    setDialogOpen(true);
  };

  const handleReturnLoan = (loan) => {
    setSelectedLoan(loan);
    setReturnDialogOpen(true);
  };

  const handleExtendLoan = (loan) => {
    console.log('Extend loan:', loan);
  };

  const handleHistoryLoan = (loan) => {
    console.log('History loan:', loan);
  };

  const handleCancelLoan = (loan) => {
    console.log('Cancel loan:', loan);
  };

  const handleSaveLoan = async (loanData) => {
    try {
      if (onSaveLoan) {
        await onSaveLoan(loanData);
      }
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving loan:', error);
    }
  };

  const handleReturnLoanComplete = async (loan, notes, accessoryInfo) => {
    try {
      if (onReturnLoan) {
        await onReturnLoan(loan, notes, accessoryInfo);
      }
      setReturnDialogOpen(false);
    } catch (error) {
      console.error('Error returning loan:', error);
    }
  };

  // Configuration des sections de la sidebar
  const sidebarSections = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: <DashboardIcon />,
      subSections: [
        { id: 'overview', label: 'Vue d\'ensemble' },
        { id: 'analytics', label: 'Analyses' },
        { id: 'reports', label: 'Rapports' }
      ]
    },
    {
      id: 'loans',
      label: 'Prêts',
      icon: <LoansIcon />,
      count: statistics.total,
      subSections: [
        { id: 'active', label: 'Actifs', count: statistics.active },
        { id: 'overdue', label: 'En retard', count: statistics.overdue },
        { id: 'critical', label: 'Critiques', count: statistics.critical }
      ]
    },
    {
      id: 'returns',
      label: 'Retours',
      icon: <ReturnsIcon />,
      count: statistics.returned,
      subSections: [
        { id: 'pending', label: 'En attente' },
        { id: 'completed', label: 'Complétés' }
      ]
    }
  ];

  // Rendu du tableau de bord
  const renderDashboard = () => (
    <Box>
      {/* Statistiques principales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Prêts
                  </Typography>
                  <Typography variant="h4">
                    {statistics.total}
                  </Typography>
                </Box>
                <LoansIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Prêts Actifs
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {statistics.active}
                  </Typography>
                </Box>
                <TrendingUpIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    En Retard
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {statistics.overdue}
                  </Typography>
                </Box>
                <NotificationsIcon color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Utilisateurs
                  </Typography>
                  <Typography variant="h4">
                    {statistics.userCount}
                  </Typography>
                </Box>
                <PeopleIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alertes */}
      {(statistics.overdue > 0 || statistics.critical > 0) && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
          <Typography variant="h6" gutterBottom>
            ⚠️ Alertes en cours
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {statistics.overdue > 0 && (
              <Chip 
                label={`${statistics.overdue} prêt(s) en retard`} 
                color="error"
                variant="filled"
              />
            )}
            {statistics.critical > 0 && (
              <Chip 
                label={`${statistics.critical} prêt(s) critique(s)`} 
                color="error"
                variant="filled"
              />
            )}
          </Box>
        </Paper>
      )}

      {/* Actions rapides */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Actions rapides
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                cursor: 'pointer', 
                transition: 'all 0.2s',
                '&:hover': { transform: 'translateY(-2px)' }
              }}
              onClick={handleCreateLoan}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <AddIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6">
                  Nouveau prêt
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Créer un nouveau prêt
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                cursor: 'pointer', 
                transition: 'all 0.2s',
                '&:hover': { transform: 'translateY(-2px)' }
              }}
              onClick={() => setActiveSection('loans')}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <LoansIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6">
                  Gérer les prêts
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Voir tous les prêts
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                cursor: 'pointer', 
                transition: 'all 0.2s',
                '&:hover': { transform: 'translateY(-2px)' }
              }}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h6">
                  Rapports
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Voir les statistiques
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                cursor: 'pointer', 
                transition: 'all 0.2s',
                '&:hover': { transform: 'translateY(-2px)' }
              }}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <NotificationsIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h6">
                  Notifications
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Gérer les alertes
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );

  return (
    <Box sx={{ 
      display: 'flex',
      height: '100vh',
      bgcolor: 'background.default'
    }}>
      {/* Sidebar Desktop */}
      <DesktopSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sections={sidebarSections}
        currentSection={activeSection}
        onSectionChange={setActiveSection}
        statistics={statistics}
        width={320}
      />

      {/* Contenu principal */}
      <Box sx={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        // Décaler le contenu si sidebar ouverte sur desktop
        ...(isDesktop && sidebarOpen && { ml: '320px' })
      }}>
        {/* Header mobile */}
        {isMobile && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6">
                DocuCortex Enhanced
              </Typography>
              <IconButton onClick={() => setSidebarOpen(true)}>
                <DashboardIcon />
              </IconButton>
            </Box>
          </Paper>
        )}

        {/* Contenu selon la section active */}
        <Box sx={{ flex: 1, overflow: 'auto', p: isMobile ? 1 : 3 }}>
          {activeSection === 'dashboard' && renderDashboard()}
          
          {activeSection === 'loans' && (
            <LoanListResponsive
              loans={loans}
              onSaveLoan={handleSaveLoan}
              onReturnLoan={handleReturnLoan}
              onEditLoan={handleEditLoan}
              onExtendLoan={handleExtendLoan}
              onCancelLoan={handleCancelLoan}
              onHistoryLoan={handleHistoryLoan}
              getUserColor={getUserColor}
              statistics={statistics}
            />
          )}
          
          {(activeSection === 'returns' || activeSection === 'pending') && (
            <Box>
              <Typography variant="h5" gutterBottom>
                Gestion des retours
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Section en cours de développement...
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* FAB pour création rapide sur mobile */}
      {isMobile && activeSection !== 'dashboard' && (
        <Fab
          color="primary"
          aria-label="ajouter"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1200
          }}
          onClick={handleCreateLoan}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Barre d'actions mobile */}
      <MobileActionBar
        visible={isMobile && activeSection !== 'dashboard'}
        onAdd={handleCreateLoan}
        selectedCount={0}
      />

      {/* Dialogs */}
      <LoanDialogResponsive
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        loan={selectedLoan}
        onSave={handleSaveLoan}
        users={users}
        itStaff={itStaff}
        computers={computers}
      />

      <ReturnLoanDialogResponsive
        open={returnDialogOpen}
        onClose={() => setReturnDialogOpen(false)}
        loan={selectedLoan}
        onReturn={handleReturnLoanComplete}
        enableQR={true}
        enableSignature={true}
      />
    </Box>
  );
};

export default LoanManagementDashboard;