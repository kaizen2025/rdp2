import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  Badge,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Collapse
} from '@mui/material';
import {
  Timer,
  PlayArrow,
  Pause,
  Stop,
  Refresh,
  MoreVert,
  Visibility,
  Error,
  CheckCircle,
  Schedule,
  Assignment,
  FilterList,
  Search,
  Replay,
  Cancel,
  Speed,
  Dashboard,
  Analytics
} from '@mui/icons-material';
import { WorkflowEngine } from '../../services/workflowEngine';

/**
 * TaskMonitor - Monitoring en temps réel des tâches
 * 
 * Fonctionnalités:
 * - Surveillance en temps réel des tâches actives
 * - Statuts, progression, durées d'exécution
 * - Actions sur les tâches (pause, annuler, relancer)
 * - Filtrage et recherche
 * - Historique des tâches
 */
const TaskMonitor = ({ workflowEngine, refreshInterval = 5000 }) => {
  const [tasks, setTasks] = useState([]);
  const [activeTasks, setActiveTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [failedTasks, setFailedTasks] = useState([]);
  const [queuedTasks, setQueuedTasks] = useState([]);
  const [taskStats, setTaskStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    failed: 0,
    queued: 0,
    avgDuration: 0,
    successRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskDetailsOpen, setTaskDetailsOpen] = useState(false);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [actionMenuTask, setActionMenuTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState(0);
  const [taskLogs, setTaskLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  
  const intervalRef = useRef();
  const workflowEngineRef = useRef();

  // Types de tâches avec icônes et couleurs
  const taskTypes = {
    auto_approval: { icon: <Assignment />, color: 'success', label: 'Approbation' },
    notification: { icon: <Schedule />, color: 'info', label: 'Notification' },
    escalation: { icon: <Dashboard />, color: 'warning', label: 'Escalade' },
    data_sync: { icon: <Analytics />, color: 'primary', label: 'Sync' },
    report: { icon: <Dashboard />, color: 'secondary', label: 'Rapport' }
  };

  // Statuts avec couleurs
  const statusConfig = {
    pending: { color: 'default', label: 'En attente' },
    running: { color: 'primary', label: 'En cours' },
    completed: { color: 'success', label: 'Terminé' },
    failed: { color: 'error', label: 'Échec' },
    paused: { color: 'warning', label: 'Pause' },
    cancelled: { color: 'default', label: 'Annulé' }
  };

  // Initialiser le workflow engine
  useEffect(() => {
    if (!workflowEngine) {
      workflowEngineRef.current = new WorkflowEngine();
    } else {
      workflowEngineRef.current = workflowEngine;
    }
    
    loadTaskData();
    
    // Démarrer les mises à jour en temps réel
    intervalRef.current = setInterval(loadTaskData, refreshInterval);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [workflowEngine, refreshInterval]);

  // Charger les données des tâches
  const loadTaskData = async () => {
    try {
      const engine = workflowEngineRef.current;
      
      // Récupérer les tâches
      const allTasks = await engine.getAllTasks();
      const active = allTasks.filter(t => t.status === 'running' || t.status === 'pending');
      const completed = allTasks.filter(t => t.status === 'completed');
      const failed = allTasks.filter(t => t.status === 'failed');
      const queued = allTasks.filter(t => t.status === 'queued');

      // Calculer les statistiques
      const stats = {
        total: allTasks.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        queued: queued.length,
        avgDuration: calculateAverageDuration(completed),
        successRate: allTasks.length > 0 ? (completed.length / allTasks.length) * 100 : 0
      };

      setTasks(allTasks);
      setActiveTasks(active);
      setCompletedTasks(completed);
      setFailedTasks(failed);
      setQueuedTasks(queued);
      setTaskStats(stats);
      
    } catch (error) {
      console.error('Erreur lors du chargement des tâches:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Calculer la durée moyenne d'exécution
  const calculateAverageDuration = (completedTasks) => {
    if (completedTasks.length === 0) return 0;
    
    const totalDuration = completedTasks.reduce((sum, task) => {
      if (task.started && task.completed) {
        return sum + (new Date(task.completed) - new Date(task.started));
      }
      return sum;
    }, 0);
    
    return Math.round(totalDuration / completedTasks.length / 1000); // En secondes
  };

  // Rafraîchir manuellement
  const handleRefresh = () => {
    setRefreshing(true);
    loadTaskData();
  };

  // Filtrer les tâches
  const getFilteredTasks = () => {
    let filtered = tasks;
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus);
    }
    
    if (filterType !== 'all') {
      filtered = filtered.filter(task => task.type === filterType);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(task => 
        task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.workflowName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  // Obtenir les tâches selon l'onglet actif
  const getTasksByTab = () => {
    switch (currentTab) {
      case 0: return getFilteredTasks(); // Toutes
      case 1: return activeTasks; // Actives
      case 2: return completedTasks; // Terminées
      case 3: return failedTasks; // Échouées
      case 4: return queuedTasks; // En attente
      default: return getFilteredTasks();
    }
  };

  // Afficher les détails d'une tâche
  const showTaskDetails = (task) => {
    setSelectedTask(task);
    setTaskDetailsOpen(true);
    
    // Charger les logs de la tâche
    loadTaskLogs(task.id);
  };

  // Charger les logs d'une tâche
  const loadTaskLogs = async (taskId) => {
    try {
      const engine = workflowEngineRef.current;
      const logs = await engine.getTaskLogs(taskId);
      setTaskLogs(logs);
    } catch (error) {
      console.error('Erreur lors du chargement des logs:', error);
    }
  };

  // Ouvrir le menu d'actions
  const openActionMenu = (event, task) => {
    setActionMenuAnchor(event.currentTarget);
    setActionMenuTask(task);
  };

  // Fermer le menu d'actions
  const closeActionMenu = () => {
    setActionMenuAnchor(null);
    setActionMenuTask(null);
  };

  // Action: Pause
  const pauseTask = async (taskId) => {
    const engine = workflowEngineRef.current;
    await engine.pauseTask(taskId);
    closeActionMenu();
    handleRefresh();
  };

  // Action: Reprendre
  const resumeTask = async (taskId) => {
    const engine = workflowEngineRef.current;
    await engine.resumeTask(taskId);
    closeActionMenu();
    handleRefresh();
  };

  // Action: Annuler
  const cancelTask = async (taskId) => {
    const engine = workflowEngineRef.current;
    await engine.cancelTask(taskId);
    closeActionMenu();
    handleRefresh();
  };

  // Action: Relancer
  const retryTask = async (taskId) => {
    const engine = workflowEngineRef.current;
    await engine.retryTask(taskId);
    closeActionMenu();
    handleRefresh();
  };

  // Calculer la progression
  const getProgress = (task) => {
    if (task.status === 'completed') return 100;
    if (task.status === 'failed' || task.status === 'cancelled') return 0;
    if (!task.started) return 0;
    
    const now = new Date();
    const start = new Date(task.started);
    const estimated = task.estimatedDuration || 60000; // 1 minute par défaut
    
    const elapsed = now - start;
    return Math.min((elapsed / estimated) * 100, 95); // 95% max si en cours
  };

  // Formater la durée
  const formatDuration = (start, end) => {
    if (!start) return 'N/A';
    if (!end) {
      const now = new Date();
      const elapsed = now - new Date(start);
      return formatElapsedTime(elapsed);
    }
    
    const duration = new Date(end) - new Date(start);
    return formatElapsedTime(duration);
  };

  // Formater le temps écoulé
  const formatElapsedTime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Gérer le changement d'onglet
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Box textAlign="center">
          <Typography variant="h6">
            Chargement du monitoring des tâches...
          </Typography>
        </Box>
      </Box>
    );
  }

  const filteredTasks = getTasksByTab();

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Monitoring des Tâches
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Surveillance en temps réel des tâches de workflow
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
        </Box>
      </Box>

      {/* Statistiques rapides */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1 }}>
                <Timer />
              </Avatar>
              <Typography variant="h5">
                {taskStats.active}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Actives
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 1 }}>
                <CheckCircle />
              </Avatar>
              <Typography variant="h5">
                {taskStats.completed}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Terminées
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'error.main', mx: 'auto', mb: 1 }}>
                <Error />
              </Avatar>
              <Typography variant="h5">
                {taskStats.failed}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Échouées
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 1 }}>
                <Schedule />
              </Avatar>
              <Typography variant="h5">
                {taskStats.queued}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                En Attente
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'secondary.main', mx: 'auto', mb: 1 }}>
                <Speed />
              </Avatar>
              <Typography variant="h5">
                {Math.round(taskStats.successRate)}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Taux de Réussite
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtres et recherche */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Rechercher une tâche..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  label="Type"
                >
                  <MenuItem value="all">Tous les types</MenuItem>
                  {Object.entries(taskTypes).map(([key, config]) => (
                    <MenuItem key={key} value={key}>
                      {config.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Statut</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="Statut"
                >
                  <MenuItem value="all">Tous les statuts</MenuItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <MenuItem key={key} value={key}>
                      {config.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Onglets */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab 
            label={
              <Badge badgeContent={filteredTasks.length} color="primary">
                Toutes
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={activeTasks.length} color="success">
                Actives
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={completedTasks.length} color="info">
                Terminées
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={failedTasks.length} color="error">
                Échouées
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={queuedTasks.length} color="warning">
                En Attente
              </Badge>
            } 
          />
        </Tabs>
      </Box>

      {/* Liste des tâches */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tâche</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Progression</TableCell>
                <TableCell>Durée</TableCell>
                <TableCell>Démarré</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTasks.map((task) => (
                <TableRow key={task.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2">
                        {task.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {task.workflowName || 'Workflow inconnu'}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      size="small"
                      icon={taskTypes[task.type]?.icon}
                      label={taskTypes[task.type]?.label || task.type}
                      color={taskTypes[task.type]?.color || 'default'}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      size="small"
                      label={statusConfig[task.status]?.label || task.status}
                      color={statusConfig[task.status]?.color || 'default'}
                    />
                  </TableCell>
                  
                  <TableCell>
                    {task.status === 'running' && (
                      <Box sx={{ width: 100 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={getProgress(task)}
                          size="small"
                        />
                        <Typography variant="caption">
                          {Math.round(getProgress(task))}%
                        </Typography>
                      </Box>
                    )}
                    {task.status !== 'running' && (
                      <Typography variant="body2" color="textSecondary">
                        {task.status === 'completed' ? '100%' : '-'}
                      </Typography>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {formatDuration(task.started, task.completed)}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {task.started ? new Date(task.started).toLocaleString() : 'N/A'}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Voir les détails">
                        <IconButton 
                          size="small"
                          onClick={() => showTaskDetails(task)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Actions">
                        <IconButton 
                          size="small"
                          onClick={(e) => openActionMenu(e, task)}
                        >
                          <MoreVert />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              
              {filteredTasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      Aucune tâche trouvée
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Menu d'actions */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={closeActionMenu}
      >
        {actionMenuTask?.status === 'running' && (
          <MenuItem onClick={() => pauseTask(actionMenuTask.id)}>
            <Pause sx={{ mr: 1 }} />
            Mettre en pause
          </MenuItem>
        )}
        
        {actionMenuTask?.status === 'paused' && (
          <MenuItem onClick={() => resumeTask(actionMenuTask.id)}>
            <PlayArrow sx={{ mr: 1 }} />
            Reprendre
          </MenuItem>
        )}
        
        {(actionMenuTask?.status === 'running' || actionMenuTask?.status === 'paused') && (
          <MenuItem onClick={() => cancelTask(actionMenuTask.id)}>
            <Cancel sx={{ mr: 1 }} />
            Annuler
          </MenuItem>
        )}
        
        {actionMenuTask?.status === 'failed' && (
          <MenuItem onClick={() => retryTask(actionMenuTask.id)}>
            <Replay sx={{ mr: 1 }} />
            Relancer
          </MenuItem>
        )}
        
        <MenuItem onClick={() => {
          showTaskDetails(actionMenuTask);
          closeActionMenu();
        }}>
          <Visibility sx={{ mr: 1 }} />
          Voir les détails
        </MenuItem>
      </Menu>

      {/* Dialog des détails */}
      <Dialog open={taskDetailsOpen} onClose={() => setTaskDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Détails de la Tâche
          {selectedTask && (
            <Chip
              size="small"
              label={selectedTask.name}
              sx={{ ml: 2 }}
            />
          )}
        </DialogTitle>
        <DialogContent>
          {selectedTask && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" gutterBottom>Type</Typography>
                  <Chip
                    icon={taskTypes[selectedTask.type]?.icon}
                    label={taskTypes[selectedTask.type]?.label || selectedTask.type}
                    color={taskTypes[selectedTask.type]?.color || 'default'}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2" gutterBottom>Statut</Typography>
                  <Chip
                    label={statusConfig[selectedTask.status]?.label || selectedTask.status}
                    color={statusConfig[selectedTask.status]?.color || 'default'}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2" gutterBottom>Durée</Typography>
                  <Typography variant="body2">
                    {formatDuration(selectedTask.started, selectedTask.completed)}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2" gutterBottom>Progression</Typography>
                  {selectedTask.status === 'running' ? (
                    <Box sx={{ width: 150 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={getProgress(selectedTask)}
                        size="small"
                      />
                      <Typography variant="caption">
                        {Math.round(getProgress(selectedTask))}%
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2">N/A</Typography>
                  )}
                </Grid>
              </Grid>

              {/* Paramètres de la tâche */}
              <Typography variant="subtitle2" gutterBottom>Paramètres</Typography>
              <pre style={{ 
                backgroundColor: '#f5f5f5', 
                padding: '10px', 
                borderRadius: '4px',
                fontSize: '12px',
                overflow: 'auto',
                marginBottom: '16px'
              }}>
                {JSON.stringify(selectedTask.config, null, 2)}
              </pre>

              {/* Logs */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2">Logs</Typography>
                <Button 
                  size="small" 
                  onClick={() => setShowLogs(!showLogs)}
                >
                  {showLogs ? 'Masquer' : 'Afficher'}
                </Button>
              </Box>
              
              <Collapse in={showLogs}>
                <List dense>
                  {taskLogs.map((log, index) => (
                    <ListItem key={index}>
                      <ListItemAvatar>
                        <Avatar sx={{ width: 20, height: 20, fontSize: '0.7rem' }}>
                          {log.level === 'error' ? 'E' : log.level === 'warn' ? 'W' : 'I'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={log.message}
                        secondary={new Date(log.timestamp).toLocaleString()}
                      />
                    </ListItem>
                  ))}
                  
                  {taskLogs.length === 0 && (
                    <Typography variant="body2" color="textSecondary">
                      Aucun log disponible
                    </Typography>
                  )}
                </List>
              </Collapse>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaskDetailsOpen(false)}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaskMonitor;