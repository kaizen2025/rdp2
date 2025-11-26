import React, { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Container,
  Paper,
  Chip,
  Button,
  Tabs,
  Tab
} from '@mui/material';
import {
  Dashboard,
  Assignment,
  Timeline,
  BarChart,
  AccountTree,
  Menu as MenuIcon,
  Workflow,
  Analytics,
  Notifications,
  Settings
} from '@mui/icons-material';
import { WorkflowEngine } from '../../services/workflowEngine';
import { AlertManager } from '../../services/alertManager';

// Import des composants de monitoring
import WorkflowDashboard from './WorkflowDashboard';
import TaskMonitor from './TaskMonitor';
import ExecutionLog from './ExecutionLog';
import PerformanceMetrics from './PerformanceMetrics';
import WorkflowDesigner from './WorkflowDesigner';

/**
 * WorkflowMonitoringDemo - Démonstration complète du système de monitoring
 * 
 * Ce composant démontre l'utilisation de tous les composants d'interface
 * de monitoring des workflows dans une application unifiée.
 */
const WorkflowMonitoringDemo = () => {
  const [selectedView, setSelectedView] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [workflowEngine, setWorkflowEngine] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialiser le workflow engine
  useEffect(() => {
    const initializeEngine = async () => {
      try {
        const engine = new WorkflowEngine();
        await engine.initialize();
        setWorkflowEngine(engine);
      } catch (error) {
        console.error('Erreur lors de l\'initialisation du moteur:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeEngine();
  }, []);

  // Vues disponibles dans le monitoring
  const views = [
    {
      id: 'dashboard',
      label: 'Tableau de Bord',
      icon: <Dashboard />,
      component: WorkflowDashboard,
      description: 'Vue d\'ensemble des workflows et métriques principales'
    },
    {
      id: 'monitor',
      label: 'Monitoring Tâches',
      icon: <Assignment />,
      component: TaskMonitor,
      description: 'Surveillance en temps réel des tâches actives'
    },
    {
      id: 'logs',
      label: 'Journal d\'Exécution',
      icon: <Timeline />,
      component: ExecutionLog,
      description: 'Historique détaillé des exécutions de workflows'
    },
    {
      id: 'metrics',
      label: 'Métriques Performance',
      icon: <BarChart />,
      component: PerformanceMetrics,
      description: 'Analyse des performances et tendances'
    },
    {
      id: 'designer',
      label: 'Concepteur',
      icon: <AccountTree />,
      component: WorkflowDesigner,
      description: 'Éditeur visuel de workflows'
    }
  ];

  // Menu items pour le drawer
  const menuItems = [
    {
      text: 'Vue d\'ensemble',
      icon: <Dashboard />,
      view: 0
    },
    {
      text: 'Monitoring temps réel',
      icon: <Notifications />,
      view: 1
    },
    {
      text: 'Historique',
      icon: <Timeline />,
      view: 2
    },
    {
      text: 'Performances',
      icon: <Analytics />,
      view: 3
    },
    {
      text: 'Conception',
      icon: <AccountTree />,
      view: 4
    }
  ];

  // Gérer le changement de vue
  const handleViewChange = (event, newValue) => {
    setSelectedView(newValue);
  };

  // Basculer l'état du drawer
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  // Composant à afficher
  const CurrentComponent = views[selectedView].component;

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        bgcolor="grey.100"
      >
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Initialisation du système de monitoring...
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Chargement des composants et configuration des workflows
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'grey.100' }}>
      {/* Barre d'application */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'primary.main'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Workflow sx={{ mr: 2 }} />
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            DocuCortex - Système de Workflow Automatisé
          </Typography>
          
          <Chip
            label="Phase 3 Complète"
            color="success"
            variant="outlined"
            sx={{ 
              color: 'white',
              borderColor: 'white',
              '& .MuiChip-label': {
                color: 'white'
              }
            }}
          />
        </Toolbar>
      </AppBar>

      {/* Navigation latérale */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={drawerOpen}
        sx={{
          width: drawerOpen ? 240 : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
            mt: 8
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" color="primary" gutterBottom>
            Monitoring
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {views[selectedView].description}
          </Typography>
        </Box>
        
        <List>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => setSelectedView(item.view)}
              selected={selectedView === item.view}
              sx={{
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  color: 'white',
                  '& .MuiListItemIcon-root': {
                    color: 'white'
                  }
                }
              }}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
        
        <Box sx={{ p: 2, mt: 'auto' }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              État du Système
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption">Workflows Actifs:</Typography>
                <Chip size="small" label="3" color="success" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption">Tâches en Cours:</Typography>
                <Chip size="small" label="12" color="primary" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption">Alertes:</Typography>
                <Chip size="small" label="1" color="warning" />
              </Box>
            </Box>
          </Paper>
        </Box>
      </Drawer>

      {/* Contenu principal */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 0,
          mt: 8,
          ml: drawerOpen ? 0 : 0, // Le drawer est en overlay
          transition: (theme) => theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {/* Onglets pour navigation rapide */}
        <Paper sx={{ position: 'sticky', top: 0, zIndex: 1 }}>
          <Tabs
            value={selectedView}
            onChange={handleViewChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            {views.map((view, index) => (
              <Tab
                key={view.id}
                icon={view.icon}
                label={view.label}
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Paper>

        {/* Contenu de la vue sélectionnée */}
        <Box sx={{ height: 'calc(100vh - 120px)', overflow: 'auto' }}>
          {workflowEngine && (
            <CurrentComponent 
              workflowEngine={workflowEngine}
              key={views[selectedView].id}
            />
          )}
        </Box>
      </Box>

      {/* Bouton de basculement rapide (mobile) */}
      {!drawerOpen && (
        <IconButton
          onClick={toggleDrawer}
          sx={{
            position: 'fixed',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: (theme) => theme.zIndex.drawer + 2,
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': {
              bgcolor: 'primary.dark'
            }
          }}
        >
          <MenuIcon />
        </IconButton>
      )}
    </Box>
  );
};

export default WorkflowMonitoringDemo;

/**
 * UTILISATION ET DÉMONSTRATION
 * 
 * Ce composant démontre l'intégration complète de tous les composants
 * de monitoring des workflows DocuCortex Phase 3.
 * 
 * COMPOSANTS INCLUS:
 * 
 * 1. WorkflowDashboard - Tableau de bord principal
 *    - Vue d'ensemble des workflows actifs
 *    - Métriques clés en temps réel
 *    - Gestion des workflows (démarrer, arrêter, configurer)
 *    - Activité récente et alertes
 * 
 * 2. TaskMonitor - Monitoring en temps réel des tâches
 *    - Surveillance continue des tâches actives
 *    - Statuts, progression, durées d'exécution
 *    - Actions sur les tâches (pause, annuler, relancer)
 *    - Filtrage et recherche avancés
 * 
 * 3. ExecutionLog - Journal détaillé d'exécution
 *    - Historique complet des exécutions
 *    - Filtrage par statut, type, utilisateur, date
 *    - Export en JSON/CSV
 *    - Événements détaillés avec niveaux de log
 * 
 * 4. PerformanceMetrics - Métriques de performance
 *    - Indicateurs de performance temps réel
 *    - Graphiques de tendances
 *    - Alertes de performance
 *    - Indicateurs de santé système
 * 
 * 5. WorkflowDesigner - Éditeur visuel de workflows
 *    - Interface drag & drop pour créer des workflows
 *    - Palette de nœuds prédéfinis
 *    - Validation et simulation
 *    - Import/Export de configurations
 * 
 * FONCTIONNALITÉS TRANSVERSALES:
 * 
 * - Intégration complète avec WorkflowEngine
 * - Actualisation automatique des données
 * - Interface responsive et Material-UI
 * - Gestion des erreurs robuste
 * - Optimisations pour performance
 * - Support multi-utilisateur
 * 
 * EXEMPLE D'UTILISATION:
 * 
 * ```jsx
 * import WorkflowMonitoringDemo from './components/workflow/WorkflowMonitoringDemo';
 * 
 * function App() {
 *   return (
 *     <div className="App">
 *       <WorkflowMonitoringDemo />
 *     </div>
 *   );
 * }
 * ```
 * 
 * PERSONNALISATION:
 * 
 * Chaque composant peut être utilisé individuellement:
 * 
 * ```jsx
 * import WorkflowDashboard from './components/workflow/WorkflowDashboard';
 * 
 * function MonTableauDeBord() {
 *   return (
 *     <WorkflowDashboard 
 *       workflowEngine={myEngine}
 *       refreshInterval={30000}
 *     />
 *   );
 * }
 * ```
 * 
 * CONFIGURATION:
 * 
 * - refreshInterval: Intervalle d'actualisation (ms)
 * - workflowEngine: Instance du WorkflowEngine
 * - Paramètres spécifiques par composant
 * 
 * ÉTAT ACTUEL:
 * 
 * ✅ Phase 3 - WorkflowAutomatise COMPLÈTE
 * 
 * Composants créés:
 * - ✅ WorkflowEngine (moteur principal)
 * - ✅ 5 tâches d'automatisation
 * - ✅ 5 composants de gestion d'exceptions
 * - ✅ WorkflowBuilder (interface drag & drop)
 * - ✅ 5 interfaces de monitoring:
 *   - WorkflowDashboard
 *   - TaskMonitor  
 *   - ExecutionLog
 *   - PerformanceMetrics
 *   - WorkflowDesigner
 * 
 * Le système de workflow automatisé DocuCortex Phase 3 
 * est maintenant entièrement implémenté et opérationnel!
 */