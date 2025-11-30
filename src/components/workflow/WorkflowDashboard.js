import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  Avatar,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Fade,
  Slide,
  Collapse
} from '@mui/material';
import {
  Dashboard,
  PlayArrow,
  Pause,
  Stop,
  Refresh,
  Add,
  Workflow as WorkflowIcon,
  Assignment,
  Schedule,
  CheckCircle,
  Error,
  Warning,
  TrendingUp,
  TrendingDown,
  Timer,
  AccountTree,
  Analytics,
  Notifications,
  Settings,
  MoreVert,
  Visibility,
  History,
  Report
} from '@mui/icons-material';
import { WorkflowEngine } from '../../services/workflowEngine';
import { AlertManager } from '../../services/alertManager';

/**
 * WorkflowDashboard - Tableau de bord principal des workflows
 * 
 * Fonctionnalités:
 * - Vue d'ensemble des workflows actifs
 * - Métriques clés de performance
 * - Statistiques d'exécution en temps réel
 * - Gestion des workflows (démarrer, arrêter, configurer)
 * - Alertes et notifications
 */
const WorkflowDashboard = ({ workflowEngine, refreshInterval = 30000 }) => {
  const [workflows, setWorkflows] = useState([]);
  const [activeWorkflows, setActiveWorkflows] = useState([]);
  const [completedWorkflows, setCompletedWorkflows] = useState([]);
  const [failedWorkflows, setFailedWorkflows] = useState([]);
  const [metrics, setMetrics] = useState({
    totalWorkflows: 0,
    activeCount: 0,
    completedCount: 0,
    failedCount: 0,
    avgExecutionTime: 0,
    successRate: 0,
    todayExecutions: 0,
    peakHour: '',
    errorRate: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowType, setNewWorkflowType] = useState('auto_approval');
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [viewDetails, setViewDetails] = useState(false);
  const [performanceTrend, setPerformanceTrend] = useState([]);
  
  const intervalRef = useRef();
  const workflowEngineRef = useRef();

  // Initialiser le workflow engine si non fourni
  useEffect(() => {
    if (!workflowEngine) {
      workflowEngineRef.current = new WorkflowEngine();
    } else {
      workflowEngineRef.current = workflowEngine;
    }
    loadDashboardData();
    
    // Démarrer les mises à jour automatiques
    intervalRef.current = setInterval(loadDashboardData, refreshInterval);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [workflowEngine, refreshInterval]);

  // Charger les données du tableau de bord
  const loadDashboardData = async () => {
    try {
      if (refreshing) return;
      
      const engine = workflowEngineRef.current;
      
      // Récupérer les workflows
      const allWorkflows = await engine.getAllWorkflows();
      const active = allWorkflows.filter(w => w.status === 'running');
      const completed = allWorkflows.filter(w => w.status === 'completed');
      const failed = allWorkflows.filter(w => w.status === 'failed');

      // Récupérer les métriques
      const metricsData = await engine.getMetrics();
      const recentActivities = await engine.getRecentActivity(10);
      const activeAlerts = await AlertManager.getActiveAlerts();

      setWorkflows(allWorkflows);
      setActiveWorkflows(active);
      setCompletedWorkflows(completed);
      setFailedWorkflows(failed);
      setMetrics(metricsData);
      setRecentActivity(recentActivities);
      setAlerts(activeAlerts);
      
      // Calculer les tendances de performance
      const trend = await calculatePerformanceTrend();
      setPerformanceTrend(trend);
      
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Calculer les tendances de performance
  const calculatePerformanceTrend = async () => {
    const engine = workflowEngineRef.current;
    const trendData = [];
    
    for (let i = 23; i >= 0; i--) {
      const hour = new Date();
      hour.setHours(hour.getHours() - i);
      hour.setMinutes(0, 0, 0);
      
      const executions = await engine.getExecutionsByHour(hour);
      trendData.push({
        time: hour.getHours(),
        executions: executions.length,
        success: executions.filter(e => e.status === 'completed').length,
        failed: executions.filter(e => e.status === 'failed').length
      });
    }
    
    return trendData;
  };

  // Rafraîchir les données manuellement
  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  // Créer un nouveau workflow
  const handleCreateWorkflow = () => {
    if (!newWorkflowName.trim()) return;
    
    const engine = workflowEngineRef.current;
    const workflow = {
      id: `workflow_${Date.now()}`,
      name: newWorkflowName,
      type: newWorkflowType,
      status: 'stopped',
      config: getDefaultWorkflowConfig(newWorkflowType),
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    };
    
    engine.createWorkflow(workflow);
    setCreateDialog(false);
    setNewWorkflowName('');
    setNewWorkflowType('auto_approval');
    handleRefresh();
  };

  // Configuration par défaut selon le type
  const getDefaultWorkflowConfig = (type) => {
    const configs = {
      auto_approval: {
        enabled: true,
        maxAmount: 50000,
        riskThreshold: 0.8,
        businessHoursOnly: true
      },
      notification: {
        channels: ['email', 'in-app'],
        templates: 'default',
        rateLimit: 100
      },
      escalation: {
        levels: 3,
        timeouts: [30, 60, 120],
        autoEscalation: true
      },
      data_sync: {
        interval: 3600,
        conflictResolution: 'manual',
        batchSize: 100
      },
      report: {
        schedule: 'daily',
        format: 'pdf',
        recipients: []
      }
    };
    
    return configs[type] || {};
  };

  // Démarrer un workflow
  const startWorkflow = async (workflowId) => {
    const engine = workflowEngineRef.current;
    await engine.startWorkflow(workflowId);
    handleRefresh();
  };

  // Arrêter un workflow
  const stopWorkflow = async (workflowId) => {
    const engine = workflowEngineRef.current;
    await engine.stopWorkflow(workflowId);
    handleRefresh();
  };

  // Voir les détails d'un workflow
  const viewWorkflowDetails = (workflow) => {
    setSelectedWorkflow(workflow);
    setViewDetails(true);
  };

  // Récupérer l'icône du type de workflow
  const getWorkflowIcon = (type) => {
    const icons = {
      auto_approval: <CheckCircle color="success" />,
      notification: <Notifications color="info" />,
      escalation: <Warning color="warning" />,
      data_sync: <Analytics color="primary" />,
      report: <Report color="secondary" />
    };
    return icons[type] || <WorkflowIcon />;
  };

  // Récupérer la couleur du statut
  const getStatusColor = (status) => {
    const colors = {
      running: 'success',
      stopped: 'default',
      failed: 'error',
      completed: 'info'
    };
    return colors[status] || 'default';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Box textAlign="center">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Chargement du tableau de bord...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Tableau de Bord des Workflows
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Vue d'ensemble et gestion des workflows automatisés
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Actualisation...' : 'Actualiser'}
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialog(true)}
          >
            Nouveau Workflow
          </Button>
        </Box>
      </Box>

      {/* Alertes actives */}
      {alerts.length > 0 && (
        <Collapse in>
          <Alert 
            severity="warning" 
            sx={{ mb: 2 }}
            action={
              <IconButton size="small" onClick={() => setAlerts([])}>
                <MoreVert />
              </IconButton>
            }
          >
            {alerts.length} alerte(s) active(s) - Cliquez pour voir les détails
          </Alert>
        </Collapse>
      )}

      {/* Métriques principales */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <WorkflowIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" component="div">
                    {metrics.totalWorkflows}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Workflows Totaux
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <PlayArrow />
                </Avatar>
                <Box>
                  <Typography variant="h4" component="div">
                    {metrics.activeCount}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    En Cours d'Exécution
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="h4" component="div">
                    {Math.round(metrics.successRate)}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Taux de Réussite
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
                  <Timer />
                </Avatar>
                <Box>
                  <Typography variant="h4" component="div">
                    {Math.round(metrics.avgExecutionTime)}s
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Temps Moyen
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Contenu principal */}
      <Grid container spacing={3}>
        {/* Workflows actifs */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Workflows Actifs
                </Typography>
                <Chip 
                  label={`${activeWorkflows.length} actifs`} 
                  color="success" 
                  size="small" 
                />
              </Box>
              
              <List>
                {activeWorkflows.map((workflow) => (
                  <ListItem 
                    key={workflow.id}
                    sx={{ 
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      bgcolor: 'background.paper'
                    }}
                  >
                    <ListItemIcon>
                      {getWorkflowIcon(workflow.type)}
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">
                            {workflow.name}
                          </Typography>
                          <Chip
                            label={workflow.status}
                            color={getStatusColor(workflow.status)}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="textSecondary">
                            {workflow.description || 'Aucune description'}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                            <Typography variant="caption">
                              Commencé: {new Date(workflow.started).toLocaleString()}
                            </Typography>
                            {workflow.progress !== undefined && (
                              <Box sx={{ width: 100 }}>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={workflow.progress}
                                  size="small"
                                />
                                <Typography variant="caption">
                                  {Math.round(workflow.progress)}%
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      }
                    />
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Voir les détails">
                        <IconButton 
                          size="small"
                          onClick={() => viewWorkflowDetails(workflow)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Arrêter">
                        <IconButton 
                          size="small"
                          color="error"
                          onClick={() => stopWorkflow(workflow.id)}
                        >
                          <Stop />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItem>
                ))}
              </List>
              
              {activeWorkflows.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <WorkflowIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="body1" color="textSecondary">
                    Aucun workflow actif
                  </Typography>
                  <Button 
                    variant="contained" 
                    sx={{ mt: 2 }}
                    onClick={() => setCreateDialog(true)}
                  >
                    Créer un Workflow
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Activité récente et métriques */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={3}>
            {/* Activité récente */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Activité Récente
                  </Typography>
                  <List dense>
                    {recentActivity.slice(0, 5).map((activity, index) => (
                      <ListItem key={index}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {activity.type === 'start' && <PlayArrow color="success" fontSize="small" />}
                          {activity.type === 'complete' && <CheckCircle color="info" fontSize="small" />}
                          {activity.type === 'error' && <Error color="error" fontSize="small" />}
                        </ListItemIcon>
                        <ListItemText
                          primary={activity.message}
                          secondary={new Date(activity.timestamp).toLocaleTimeString()}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Métriques additionnelles */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Métriques du Jour
                  </Typography>
                  <Box sx={{ space: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Exécutions</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {metrics.todayExecutions}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Taux d'Erreur</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {Math.round(metrics.errorRate)}%
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Heure de Pointe</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {metrics.peakHour || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Dialog de création */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Créer un Nouveau Workflow</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nom du Workflow"
            fullWidth
            variant="outlined"
            value={newWorkflowName}
            onChange={(e) => setNewWorkflowName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            select
            margin="dense"
            label="Type de Workflow"
            fullWidth
            variant="outlined"
            value={newWorkflowType}
            onChange={(e) => setNewWorkflowType(e.target.value)}
          >
            <MenuItem value="auto_approval">Approbation Automatique</MenuItem>
            <MenuItem value="notification">Notification</MenuItem>
            <MenuItem value="escalation">Escalade</MenuItem>
            <MenuItem value="data_sync">Synchronisation de Données</MenuItem>
            <MenuItem value="report">Génération de Rapport</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleCreateWorkflow}
            variant="contained"
            disabled={!newWorkflowName.trim()}
          >
            Créer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog des détails */}
      <Dialog open={viewDetails} onClose={() => setViewDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle>Détails du Workflow</DialogTitle>
        <DialogContent>
          {selectedWorkflow && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedWorkflow.name}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {selectedWorkflow.description || 'Aucune description'}
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Configuration:</Typography>
                <pre style={{ 
                  backgroundColor: '#f5f5f5', 
                  padding: '10px', 
                  borderRadius: '4px',
                  fontSize: '12px',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(selectedWorkflow.config, null, 2)}
                </pre>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDetails(false)}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkflowDashboard;