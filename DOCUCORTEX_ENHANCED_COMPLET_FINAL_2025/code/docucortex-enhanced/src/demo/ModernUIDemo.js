// src/demo/ModernUIDemo.js - Démonstration des composants UI modernes avec animations

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Divider,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  ExpandMore,
  Settings,
  LightMode,
  DarkMode,
  Palette
} from '@mui/icons-material';

// Thème
import { ModernThemeProvider } from '../theme/ModernThemeProvider';

// Composants modernes
import {
  ModernCard,
  ModernButton,
  ModernIconButton,
  ModernStatsCard,
  ModernProgressBar,
  ModernToast,
  ModernSkeleton
} from './ui/ModernUIComponents';

import ModernLoanCard from './ui/ModernLoanCard';
import { ModernActionButton, ModernActionGroup } from './ui/ModernActionButton';
import ModernDataTable from './ui/ModernDataTable';
import {
  ModernTextField,
  ModernSelect,
  ModernSwitch,
  ModernCheckbox,
  ModernRadioGroup,
  ModernSlider,
  ModernAccordion
} from './ui/ModernFormField';
import { ModernToast, ToastContainer, useToast } from './ui/ModernNotificationToast';

// Animations
import {
  PageTransition,
  StaggerContainer,
  StaggerItem,
  ScrollAnimation,
  AnimatedFeedback,
  AnimatedLoader,
  useReducedMotion
} from './animations/AnimationSystem';

/**
 * Composant de démonstration principal
 */
const ModernUIDemo = () => {
  const prefersReducedMotion = useReducedMotion();
  const { toasts, showSuccess, showError, showWarning, showInfo, showLoading } = useToast();
  
  // États pour les démos
  const [themeMode, setThemeMode] = useState('light');
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  
  // Données de démonstration
  const mockLoans = [
    {
      id: '1',
      loanId: 'PR-001',
      status: 'active',
      startDate: '2024-01-15',
      endDate: '2024-02-15',
      userId: 'user1'
    },
    {
      id: '2',
      loanId: 'PR-002',
      status: 'overdue',
      startDate: '2024-01-10',
      endDate: '2024-01-25',
      userId: 'user2'
    },
    {
      id: '3',
      loanId: 'PR-003',
      status: 'critical',
      startDate: '2024-01-01',
      endDate: '2024-01-20',
      userId: 'user3'
    }
  ];
  
  const mockUsers = [
    { id: 'user1', name: 'Jean Dupont', color: '#2196f3' },
    { id: 'user2', name: 'Marie Martin', color: '#4caf50' },
    { id: 'user3', name: 'Pierre Durand', color: '#ff9800' }
  ];
  
  const mockComputers = [
    { id: 'comp1', name: 'Dell XPS 13' },
    { id: 'comp2', name: 'MacBook Pro' },
    { id: 'comp3', name: 'ThinkPad X1' }
  ];
  
  // Configuration du tableau
  const tableColumns = [
    {
      field: 'loanId',
      label: 'ID Prêt',
      type: 'text'
    },
    {
      field: 'user',
      label: 'Utilisateur',
      type: 'avatar',
      format: (value, row) => ({
        name: mockUsers.find(u => u.id === row.userId)?.name || 'Utilisateur inconnu',
        color: mockUsers.find(u => u.id === row.userId)?.color || '#2196f3'
      })
    },
    {
      field: 'computer',
      label: 'Ordinateur',
      type: 'text',
      format: (value, row) => mockComputers.find(c => c.id === row.computerId)?.name || 'Non défini'
    },
    {
      field: 'status',
      label: 'Statut',
      type: 'status'
    },
    {
      field: 'progress',
      label: 'Progression',
      type: 'progress',
      format: (value, row) => {
        const start = new Date(row.startDate);
        const end = new Date(row.endDate);
        const now = new Date();
        const total = end.getTime() - start.getTime();
        const elapsed = now.getTime() - start.getTime();
        return Math.max(0, Math.min(100, (elapsed / total) * 100));
      }
    },
    {
      field: 'actions',
      label: 'Actions',
      type: 'actions'
    }
  ];
  
  // Données du tableau
  const tableRows = mockLoans.map(loan => ({
    ...loan,
    user: mockUsers.find(u => u.id === loan.userId),
    computer: mockComputers.find(c => c.id === loan.computerId)
  }));
  
  // Actions de démo
  const handleLoanAction = (action, loan) => {
    switch (action) {
      case 'edit':
        setSelectedLoan(loan);
        showSuccess(`Modification du prêt ${loan.loanId}`);
        break;
      case 'delete':
        showError(`Suppression du prêt ${loan.loanId}`);
        break;
      case 'extend':
        showInfo(`Extension du prêt ${loan.loanId}`);
        break;
      case 'return':
        showSuccess(`Retour du prêt ${loan.loanId}`);
        break;
      default:
        console.log('Action:', action, loan);
    }
  };
  
  // Démonstration des notifications
  const showNotifications = () => {
    showSuccess('Opération réussie avec succès !');
    setTimeout(() => showWarning('Attention, certaines données sont manquantes'), 1000);
    setTimeout(() => showError('Une erreur est survenue'), 2000);
    setTimeout(() => showInfo('Information importante à retenir'), 3000);
  };
  
  // Démonstration du chargement
  const simulateLoading = async () => {
    setLoading(true);
    showLoading('Chargement des données...');
    
    // Simulation d'un appel API
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setLoading(false);
    showSuccess('Données chargées avec succès !');
  };
  
  return (
    <ModernThemeProvider mode={themeMode}>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* Header */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 300, color: 'primary.main' }}>
                DocuCortex Modern UI
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={themeMode === 'dark'}
                      onChange={(e) => setThemeMode(e.target.checked ? 'dark' : 'light')}
                      icon={<LightMode />}
                      checkedIcon={<DarkMode />}
                    />
                  }
                  label={themeMode === 'dark' ? 'Mode sombre' : 'Mode clair'}
                />
                
                <ModernButton
                  onClick={showNotifications}
                  startIcon={<Palette />}
                >
                  Démontrer les notifications
                </ModernButton>
              </Box>
            </Box>
          </Container>
        </Paper>
        
        <Container maxWidth="lg">
          <PageTransition>
            <Grid container spacing={3}>
              {/* Section Cartes et Statistiques */}
              <Grid item xs={12}>
                <Typography variant="h4" sx={{ mb: 2, fontWeight: 500 }}>
                  Cartes et Statistiques Modernes
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <ModernStatsCard
                  title="Prêts Actifs"
                  value="124"
                  change="+12%"
                  trend="up"
                  icon={<Settings />}
                  animated={!prefersReducedMotion}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <ModernStatsCard
                  title="En Retard"
                  value="8"
                  change="-2"
                  trend="down"
                  icon={<Settings />}
                  animated={!prefersReducedMotion}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <ModernStatsCard
                  title="Retournés"
                  value="89"
                  change="+5%"
                  trend="up"
                  icon={<Settings />}
                  animated={!prefersReducedMotion}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <ModernStatsCard
                  title="Taux de Retour"
                  value="94%"
                  change="+2%"
                  trend="up"
                  icon={<Settings />}
                  animated={!prefersReducedMotion}
                />
              </Grid>
              
              {/* Section Cartes de Prêts */}
              <Grid item xs={12}>
                <Divider sx={{ my: 4 }}>
                  <Typography variant="h5" sx={{ fontWeight: 500 }}>
                    Cartes de Prêts Modernes
                  </Typography>
                </Divider>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <ModernLoanCard
                  loan={mockLoans[0]}
                  user={mockUsers[0]}
                  computer={mockComputers[0]}
                  onEdit={(loan) => handleLoanAction('edit', loan)}
                  onDelete={(loan) => handleLoanAction('delete', loan)}
                  onExtend={(loan) => handleLoanAction('extend', loan)}
                  onReturn={(loan) => handleLoanAction('return', loan)}
                  animated={!prefersReducedMotion}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <ModernLoanCard
                  loan={mockLoans[1]}
                  user={mockUsers[1]}
                  computer={mockComputers[1]}
                  onEdit={(loan) => handleLoanAction('edit', loan)}
                  onDelete={(loan) => handleLoanAction('delete', loan)}
                  onExtend={(loan) => handleLoanAction('extend', loan)}
                  onReturn={(loan) => handleLoanAction('return', loan)}
                  animated={!prefersReducedMotion}
                />
              </Grid>
              
              {/* Section Boutons d'Action */}
              <Grid item xs={12}>
                <Divider sx={{ my: 4 }}>
                  <Typography variant="h5" sx={{ fontWeight: 500 }}>
                    Boutons d'Action Modernes
                  </Typography>
                </Divider>
              </Grid>
              
              <Grid item xs={12}>
                <ModernCard>
                  <Box sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Boutons Standard
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                      <ModernButton type="primary">
                        Primaire
                      </ModernButton>
                      <ModernButton type="secondary">
                        Secondaire
                      </ModernButton>
                      <ModernButton type="success">
                        Succès
                      </ModernButton>
                      <ModernButton type="danger">
                        Danger
                      </ModernButton>
                      <ModernButton type="warning">
                        Attention
                      </ModernButton>
                      <ModernButton type="info">
                        Info
                      </ModernButton>
                    </Box>
                    
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Boutons avec Icônes
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                      <ModernButton
                        type="primary"
                        icon={<Settings />}
                        label="Avec icône"
                      />
                      <ModernButton
                        type="secondary"
                        icon={<Settings />}
                        iconPosition="start"
                        label="Icône au début"
                      />
                      <ModernButton
                        type="primary"
                        loading={loading}
                        onClick={simulateLoading}
                        label="Chargement"
                      />
                    </Box>
                    
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Groupe d'Actions
                    </Typography>
                    <ModernActionGroup
                      buttons={[
                        { key: 'save', type: 'primary', label: 'Sauvegarder', icon: <Settings /> },
                        { key: 'edit', type: 'secondary', label: 'Modifier', icon: <Settings /> },
                        { key: 'delete', type: 'danger', label: 'Supprimer', icon: <Settings /> }
                      ]}
                      animated={!prefersReducedMotion}
                    />
                    
                    <Typography variant="h6" sx={{ mb: 2, mt: 3 }}>
                      Boutons Icône
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <ModernIconButton type="primary">
                        <Settings />
                      </ModernIconButton>
                      <ModernIconButton type="success">
                        <Settings />
                      </ModernIconButton>
                      <ModernIconButton 
                        type="error"
                        pulse={!prefersReducedMotion}
                        badge={{ content: '3', color: 'error' }}
                      >
                        <Settings />
                      </ModernIconButton>
                    </Box>
                  </Box>
                </ModernCard>
              </Grid>
              
              {/* Section Formulaires */}
              <Grid item xs={12}>
                <Divider sx={{ my: 4 }}>
                  <Typography variant="h5" sx={{ fontWeight: 500 }}>
                    Champs de Formulaire Modernes
                  </Typography>
                </Divider>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <ModernCard>
                  <Box sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Champs de Texte
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <ModernTextField
                        label="Nom d'utilisateur"
                        placeholder="Entrez votre nom"
                        showClear
                        animated={!prefersReducedMotion}
                      />
                      <ModernTextField
                        label="Email"
                        type="email"
                        error="Email invalide"
                        animated={!prefersReducedMotion}
                      />
                      <ModernTextField
                        label="Mot de passe"
                        type="password"
                        showPasswordToggle
                        success="Mot de passe valide"
                        animated={!prefersReducedMotion}
                      />
                      <ModernTextField
                        label="Commentaire"
                        multiline
                        rows={3}
                        placeholder="Votre message..."
                        animated={!prefersReducedMotion}
                      />
                    </Box>
                  </Box>
                </ModernCard>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <ModernCard>
                  <Box sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Autres Composants
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <ModernSelect
                        label="Catégorie"
                        options={[
                          { value: 'tech', label: 'Technologie' },
                          { value: 'office', label: 'Bureautique' },
                          { value: 'mobile', label: 'Mobile' }
                        ]}
                        searchable
                        animated={!prefersReducedMotion}
                      />
                      
                      <ModernSwitch
                        label="Activer les notifications"
                        helperText="Recevoir des alertes par email"
                        animated={!prefersReducedMotion}
                      />
                      
                      <ModernRadioGroup
                        label="Priorité"
                        options={[
                          { value: 'low', label: 'Basse', description: 'Pas urgent' },
                          { value: 'medium', label: 'Moyenne', description: 'Urgent normal' },
                          { value: 'high', label: 'Haute', description: 'Très urgent' }
                        ]}
                        animated={!prefersReducedMotion}
                      />
                      
                      <ModernSlider
                        label="Volume"
                        min={0}
                        max={100}
                        value={75}
                        showValue
                        animated={!prefersReducedMotion}
                      />
                    </Box>
                  </Box>
                </ModernCard>
              </Grid>
              
              {/* Section Tableau */}
              <Grid item xs={12}>
                <Divider sx={{ my: 4 }}>
                  <Typography variant="h5" sx={{ fontWeight: 500 }}>
                    Tableau de Données Moderne
                  </Typography>
                </Divider>
              </Grid>
              
              <Grid item xs={12}>
                <ModernDataTable
                  data={tableRows}
                  columns={tableColumns}
                  loading={loading}
                  selectable
                  searchable
                  filterable
                  sortable
                  animated={!prefersReducedMotion}
                  onEdit={(row) => handleLoanAction('edit', row)}
                  onDelete={(row) => handleLoanAction('delete', row)}
                  onExtend={(row) => handleLoanAction('extend', row)}
                  onReturn={(row) => handleLoanAction('return', row)}
                  onSelectionChange={setSelectedRows}
                />
              </Grid>
              
              {/* Section Loading States */}
              <Grid item xs={12}>
                <Divider sx={{ my: 4 }}>
                  <Typography variant="h5" sx={{ fontWeight: 500 }}>
                    États de Chargement
                  </Typography>
                </Divider>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <ModernCard>
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Spinner
                    </Typography>
                    <AnimatedLoader type="spinner" size={48} color="primary" />
                  </Box>
                </ModernCard>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <ModernCard>
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Pulse
                    </Typography>
                    <AnimatedLoader type="pulse" size={48} color="success" />
                  </Box>
                </ModernCard>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <ModernCard>
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Skeleton
                    </Typography>
                    <ModernSkeleton width="100%" height={40} />
                    <Box sx={{ mt: 1 }}>
                      <ModernSkeleton width="80%" height={20} />
                    </Box>
                    <Box sx={{ mt: 1 }}>
                      <ModernSkeleton width="60%" height={20} />
                    </Box>
                  </Box>
                </ModernCard>
              </Grid>
              
              {/* Section Progression */}
              <Grid item xs={12}>
                <Divider sx={{ my: 4 }}>
                  <Typography variant="h5" sx={{ fontWeight: 500 }}>
                    Barres de Progression
                  </Typography>
                </Divider>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <ModernCard>
                  <Box sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Progression Standard
                    </Typography>
                    <ModernProgressBar value={75} color="primary" showLabel />
                  </Box>
                </ModernCard>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <ModernCard>
                  <Box sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Progression avec Alerte
                    </Typography>
                    <ModernProgressBar value={95} color="error" showLabel />
                  </Box>
                </ModernCard>
              </Grid>
              
              {/* Section Accordéons */}
              <Grid item xs={12}>
                <Divider sx={{ my: 4 }}>
                  <Typography variant="h5" sx={{ fontWeight: 500 }}>
                    Sections Collapsibles
                  </Typography>
                </Divider>
              </Grid>
              
              <Grid item xs={12}>
                <ModernAccordion
                  title="Configuration Avancée"
                  icon={<Settings />}
                  animated={!prefersReducedMotion}
                >
                  <Box sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Cette section contient des paramètres avancés pour personnaliser l'application.
                    </Typography>
                  </Box>
                </ModernAccordion>
                
                <ModernAccordion
                  title="Notifications et Alertes"
                  icon={<Settings />}
                  animated={!prefersReducedMotion}
                >
                  <Box sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Gérez vos préférences de notifications et les types d'alertes.
                    </Typography>
                  </Box>
                </ModernAccordion>
              </Grid>
              
              {/* Bouton d'action flottant */}
              <ModernActionButton
                type="floating"
                position="fixed"
                bottom={24}
                right={24}
                onClick={() => showSuccess('Action flottante déclenchée !')}
                animated={!prefersReducedMotion}
              />
            </Grid>
          </PageTransition>
        </Container>
        
        {/* Container de toasts */}
        <ToastContainer
          toasts={toasts}
          position="top-right"
          maxToasts={3}
          animated={!prefersReducedMotion}
        />
      </Box>
    </ModernThemeProvider>
  );
};

export default ModernUIDemo;