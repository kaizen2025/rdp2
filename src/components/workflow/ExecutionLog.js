import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Alert,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Menu,
  MenuItem as MenuItemComponent,
  Switch,
  FormControlLabel,
  InputAdornment,
  Badge,
  LinearProgress,
  CardActionArea
} from '@mui/material';
import {
  History,
  Search,
  FilterList,
  Download,
  Visibility,
  Error,
  Warning,
  Info,
  CheckCircle,
  Schedule,
  ExpandMore,
  ExpandLess,
  Refresh,
  Clear,
  FileDownload,
  GetApp,
  MoreVert,
  Sort,
  SortDirection,
  Analytics,
  Dashboard,
  Assignment
} from '@mui/icons-material';
import { WorkflowEngine } from '../../services/workflowEngine';

/**
 * ExecutionLog - Journal détaillé d'exécution des workflows
 * 
 * Fonctionnalités:
 * - Journal complet des exécutions de workflows
 * - Filtrage et recherche avancés
 * - Export des logs
 * - Affichage détaillé des événements
 * - Statistiques d'exécution
 */
const ExecutionLog = ({ workflowEngine, refreshInterval = 30000 }) => {
  const [executions, setExecutions] = useState([]);
  const [filteredExecutions, setFilteredExecutions] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    running: 0,
    avgDuration: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [userFilter, setUserFilter] = useState('');
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Menu d'actions
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [actionMenuExecution, setActionMenuExecution] = useState(null);
  
  // États d'export
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const [exporting, setExporting] = useState(false);
  
  // Événements détaillés
  const [executionEvents, setExecutionEvents] = useState([]);
  
  const intervalRef = useRef();
  const workflowEngineRef = useRef();

  // Types de workflows avec icônes et couleurs
  const workflowTypes = {
    auto_approval: { icon: <Assignment />, color: 'success', label: 'Approbation' },
    notification: { icon: <Schedule />, color: 'info', label: 'Notification' },
    escalation: { icon: <Dashboard />, color: 'warning', label: 'Escalade' },
    data_sync: { icon: <Analytics />, color: 'primary', label: 'Sync' },
    report: { icon: <Dashboard />, color: 'secondary', label: 'Rapport' }
  };

  // Statuts avec icônes et couleurs
  const statusConfig = {
    pending: { icon: <Schedule />, color: 'default', label: 'En attente' },
    running: { icon: <Schedule />, color: 'primary', label: 'En cours' },
    completed: { icon: <CheckCircle />, color: 'success', label: 'Terminé' },
    failed: { icon: <Error />, color: 'error', label: 'Échec' },
    cancelled: { icon: <Error />, color: 'default', label: 'Annulé' }
  };

  // Niveaux de log avec icônes
  const logLevels = {
    error: { icon: <Error color="error" />, color: 'error' },
    warn: { icon: <Warning color="warning" />, color: 'warning' },
    info: { icon: <Info color="info" />, color: 'info' },
    debug: { icon: <Info color="default" />, color: 'default' }
  };

  // Initialiser le workflow engine
  useEffect(() => {
    if (!workflowEngine) {
      workflowEngineRef.current = new WorkflowEngine();
    } else {
      workflowEngineRef.current = workflowEngine;
    }
    
    loadExecutionData();
    
    if (autoRefresh) {
      intervalRef.current = setInterval(loadExecutionData, refreshInterval);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [workflowEngine, refreshInterval, autoRefresh]);

  // Recharger quand les filtres changent
  useEffect(() => {
    applyFilters();
  }, [executions, searchTerm, statusFilter, typeFilter, dateRange, userFilter]);

  // Charger les données d'exécution
  const loadExecutionData = async () => {
    try {
      const engine = workflowEngineRef.current;
      
      // Récupérer les exécutions
      const executionData = await engine.getExecutionHistory();
      const statistics = await engine.getExecutionStatistics();
      
      setExecutions(executionData);
      setStats(statistics);
      
    } catch (error) {
      console.error('Erreur lors du chargement des exécutions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Appliquer les filtres
  const applyFilters = () => {
    let filtered = [...executions];
    
    // Filtre par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(execution =>
        execution.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        execution.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        execution.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        execution.user?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(execution => execution.status === statusFilter);
    }
    
    // Filtre par type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(execution => execution.type === typeFilter);
    }
    
    // Filtre par utilisateur
    if (userFilter) {
      filtered = filtered.filter(execution => 
        execution.user?.toLowerCase().includes(userFilter.toLowerCase())
      );
    }
    
    // Filtre par plage de dates
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter(execution => {
        const execDate = new Date(execution.started);
        const startDate = dateRange.start ? new Date(dateRange.start) : null;
        const endDate = dateRange.end ? new Date(dateRange.end) : null;
        
        if (startDate && execDate < startDate) return false;
        if (endDate && execDate > endDate) return false;
        return true;
      });
    }
    
    // Trier par date de démarrage (plus récent en premier)
    filtered.sort((a, b) => new Date(b.started) - new Date(a.started));
    
    setFilteredExecutions(filtered);
    setCurrentPage(1); // Reset à la première page
  };

  // Gérer la pagination
  const handlePageChange = (event, newPage) => {
    setCurrentPage(newPage);
  };

  // Gérer le changement de nombre de lignes par page
  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(1);
  };

  // Obtenir les executions paginées
  const getPaginatedExecutions = () => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredExecutions.slice(startIndex, endIndex);
  };

  // Calculer le nombre de pages
  const pageCount = Math.ceil(filteredExecutions.length / rowsPerPage);

  // Rafraîchir manuellement
  const handleRefresh = () => {
    setRefreshing(true);
    loadExecutionData();
  };

  // Voir les détails d'une exécution
  const viewExecutionDetails = async (execution) => {
    setSelectedExecution(execution);
    setDetailsOpen(true);
    
    // Charger les événements de l'exécution
    const engine = workflowEngineRef.current;
    try {
      const events = await engine.getExecutionEvents(execution.id);
      setExecutionEvents(events);
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
    }
  };

  // Basculer l'expansion d'une ligne
  const toggleRowExpansion = (executionId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(executionId)) {
      newExpanded.delete(executionId);
    } else {
      newExpanded.add(executionId);
    }
    setExpandedRows(newExpanded);
  };

  // Ouvrir le menu d'actions
  const openActionMenu = (event, execution) => {
    setActionMenuAnchor(event.currentTarget);
    setActionMenuExecution(execution);
  };

  // Fermer le menu d'actions
  const closeActionMenu = () => {
    setActionMenuAnchor(null);
    setActionMenuExecution(null);
  };

  // Ouvrir le menu d'export
  const openExportMenu = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };

  // Fermer le menu d'export
  const closeExportMenu = () => {
    setExportMenuAnchor(null);
  };

  // Exporter les données
  const handleExport = async (format) => {
    setExporting(true);
    closeExportMenu();
    
    try {
      const engine = workflowEngineRef.current;
      let blob;
      let filename;
      
      if (format === 'json') {
        const data = JSON.stringify(filteredExecutions, null, 2);
        blob = new Blob([data], { type: 'application/json' });
        filename = `execution-log-${new Date().toISOString().split('T')[0]}.json`;
      } else if (format === 'csv') {
        const headers = ['ID', 'Nom', 'Type', 'Statut', 'Utilisateur', 'Démarré', 'Terminé', 'Durée (s)'];
        const rows = filteredExecutions.map(exec => [
          exec.id,
          exec.name || '',
          exec.type || '',
          exec.status,
          exec.user || '',
          exec.started ? new Date(exec.started).toLocaleString() : '',
          exec.completed ? new Date(exec.completed).toLocaleString() : '',
          exec.duration ? Math.round(exec.duration / 1000) : ''
        ]);
        
        const csvContent = [headers, ...rows]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n');
        
        blob = new Blob([csvContent], { type: 'text/csv' });
        filename = `execution-log-${new Date().toISOString().split('T')[0]}.csv`;
      }
      
      // Télécharger le fichier
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
    } finally {
      setExporting(false);
    }
  };

  // Réexécuter un workflow
  const reExecuteWorkflow = async (executionId) => {
    const engine = workflowEngineRef.current;
    await engine.reExecuteWorkflow(executionId);
    closeActionMenu();
    handleRefresh();
  };

  // Formater la durée
  const formatDuration = (start, end) => {
    if (!start) return 'N/A';
    if (!end) return 'En cours...';
    
    const duration = new Date(end) - new Date(start);
    const seconds = Math.floor(duration / 1000);
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

  // Obtenir le nombre d'événements par niveau
  const getEventCountByLevel = (events) => {
    const counts = { error: 0, warn: 0, info: 0, debug: 0 };
    events.forEach(event => {
      if (counts[event.level] !== undefined) {
        counts[event.level]++;
      }
    });
    return counts;
  };

  // Effacer les filtres
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setUserFilter('');
    setDateRange({ start: '', end: '' });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Box textAlign="center">
          <Typography variant="h6">
            Chargement du journal d'exécution...
          </Typography>
        </Box>
      </Box>
    );
  }

  const paginatedExecutions = getPaginatedExecutions();

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Journal d'Exécution
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Historique détaillé des exécutions de workflows
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
            variant="outlined"
            startIcon={<Clear />}
            onClick={clearFilters}
          >
            Effacer Filtres
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={openExportMenu}
            disabled={exporting || filteredExecutions.length === 0}
          >
            {exporting ? 'Export...' : 'Exporter'}
          </Button>
        </Box>
      </Box>

      {/* Statistiques */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h5">
                {stats.total}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Exécutions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h5">
                {stats.successful}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Réussies
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h5">
                {stats.failed}
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
              <Typography variant="h5">
                {stats.running}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                En Cours
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h5">
                {Math.round(stats.avgDuration / 1000)}s
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Durée Moyenne
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtres */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Statut</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Statut"
                >
                  <MenuItem value="all">Tous</MenuItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <MenuItem key={key} value={key}>
                      {config.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  label="Type"
                >
                  <MenuItem value="all">Tous</MenuItem>
                  {Object.entries(workflowTypes).map(([key, config]) => (
                    <MenuItem key={key} value={key}>
                      {config.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Utilisateur"
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Date début"
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Date fin"
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Typography variant="body2" color="textSecondary">
                {filteredExecutions.length} exécution(s) trouvée(s)
              </Typography>
              <Chip
                label={`Page ${currentPage} sur ${pageCount}`}
                size="small"
                variant="outlined"
              />
            </Box>
            
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  size="small"
                />
              }
              label="Actualisation auto"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Tableau des exécutions */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Détails</TableCell>
                <TableCell>Workflow</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Utilisateur</TableCell>
                <TableCell>Démarré</TableCell>
                <TableCell>Terminé</TableCell>
                <TableCell>Durée</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedExecutions.map((execution) => (
                <React.Fragment key={execution.id}>
                  <TableRow hover>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => toggleRowExpansion(execution.id)}
                      >
                        {expandedRows.has(execution.id) ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </TableCell>
                    
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">
                          {execution.name || 'Sans nom'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {execution.id}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        size="small"
                        icon={workflowTypes[execution.type]?.icon}
                        label={workflowTypes[execution.type]?.label || execution.type}
                        color={workflowTypes[execution.type]?.color || 'default'}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        size="small"
                        icon={statusConfig[execution.status]?.icon}
                        label={statusConfig[execution.status]?.label || execution.status}
                        color={statusConfig[execution.status]?.color || 'default'}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {execution.user || 'Système'}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {execution.started ? new Date(execution.started).toLocaleString() : 'N/A'}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {execution.completed ? new Date(execution.completed).toLocaleString() : 'N/A'}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {formatDuration(execution.started, execution.completed)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="right">
                      <IconButton 
                        size="small"
                        onClick={() => viewExecutionDetails(execution)}
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton 
                        size="small"
                        onClick={(e) => openActionMenu(e, execution)}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  
                  {/* Ligne expandée avec résumé des événements */}
                  {expandedRows.has(execution.id) && execution.events && (
                    <TableRow>
                      <TableCell colSpan={9} sx={{ bgcolor: 'grey.50', p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Résumé des Événements
                        </Typography>
                        {(() => {
                          const eventCounts = getEventCountByLevel(execution.events || []);
                          return (
                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                              <Chip
                                size="small"
                                icon={<Error />}
                                label={`${eventCounts.error} erreur(s)`}
                                color="error"
                              />
                              <Chip
                                size="small"
                                icon={<Warning />}
                                label={`${eventCounts.warn} avertissement(s)`}
                                color="warning"
                              />
                              <Chip
                                size="small"
                                icon={<Info />}
                                label={`${eventCounts.info} info(s)`}
                                color="info"
                              />
                            </Box>
                          );
                        })()}
                        
                        <List dense>
                          {(execution.events || []).slice(-5).map((event, index) => (
                            <ListItem key={index} sx={{ py: 0.5 }}>
                              <ListItemIcon sx={{ minWidth: 32 }}>
                                {logLevels[event.level]?.icon}
                              </ListItemIcon>
                              <ListItemText
                                primary={event.message}
                                secondary={new Date(event.timestamp).toLocaleString()}
                              />
                            </ListItem>
                          ))}
                          
                          {(execution.events || []).length > 5 && (
                            <ListItem sx={{ py: 0.5 }}>
                              <Typography variant="caption" color="textSecondary">
                                ... et {(execution.events || []).length - 5} autre(s) événement(s)
                              </Typography>
                            </ListItem>
                          )}
                        </List>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
              
              {paginatedExecutions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      Aucune exécution trouvée
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        {pageCount > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
            <FormControl size="small" sx={{ width: 100 }}>
              <InputLabel>Lignes/page</InputLabel>
              <Select
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
                label="Lignes/page"
              >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
                <MenuItem value={100}>100</MenuItem>
              </Select>
            </FormControl>
            
            <Pagination
              count={pageCount}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              showFirstButton
              showLastButton
            />
          </Box>
        )}
      </Card>

      {/* Menu d'actions */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={closeActionMenu}
      >
        <MenuItemComponent onClick={() => {
          viewExecutionDetails(actionMenuExecution);
          closeActionMenu();
        }}>
          <Visibility sx={{ mr: 1 }} />
          Voir les détails
        </MenuItemComponent>
        
        {actionMenuExecution?.status === 'failed' && (
          <MenuItemComponent onClick={() => {
            reExecuteWorkflow(actionMenuExecution.id);
            closeActionMenu();
          }}>
            <Refresh sx={{ mr: 1 }} />
            Réexécuter
          </MenuItemComponent>
        )}
      </Menu>

      {/* Menu d'export */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={closeExportMenu}
      >
        <MenuItemComponent onClick={() => handleExport('json')}>
          <FileDownload sx={{ mr: 1 }} />
          Exporter en JSON
        </MenuItemComponent>
        <MenuItemComponent onClick={() => handleExport('csv')}>
          <GetApp sx={{ mr: 1 }} />
          Exporter en CSV
        </MenuItemComponent>
      </Menu>

      {/* Dialog des détails */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Détails de l'Exécution
          {selectedExecution && (
            <Chip
              size="small"
              label={selectedExecution.name}
              sx={{ ml: 2 }}
            />
          )}
        </DialogTitle>
        <DialogContent>
          {selectedExecution && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" gutterBottom>ID</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {selectedExecution.id}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2" gutterBottom>Utilisateur</Typography>
                  <Typography variant="body2">
                    {selectedExecution.user || 'Système'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2" gutterBottom>Démarré</Typography>
                  <Typography variant="body2">
                    {selectedExecution.started ? new Date(selectedExecution.started).toLocaleString() : 'N/A'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2" gutterBottom>Terminé</Typography>
                  <Typography variant="body2">
                    {selectedExecution.completed ? new Date(selectedExecution.completed).toLocaleString() : 'N/A'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2" gutterBottom>Durée</Typography>
                  <Typography variant="body2">
                    {formatDuration(selectedExecution.started, selectedExecution.completed)}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2" gutterBottom>Statut</Typography>
                  <Chip
                    icon={statusConfig[selectedExecution.status]?.icon}
                    label={statusConfig[selectedExecution.status]?.label || selectedExecution.status}
                    color={statusConfig[selectedExecution.status]?.color || 'default'}
                  />
                </Grid>
              </Grid>

              {/* Événements détaillés */}
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
                Événements ({executionEvents.length})
              </Typography>
              
              <List dense>
                {executionEvents.map((event, index) => (
                  <ListItem key={index}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {logLevels[event.level]?.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box>
                          <Typography variant="body2">
                            {event.message}
                          </Typography>
                          {event.details && (
                            <Typography variant="caption" color="textSecondary">
                              {event.details}
                            </Typography>
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption">
                            {new Date(event.timestamp).toLocaleString()}
                          </Typography>
                          {event.source && (
                            <Typography variant="caption" sx={{ ml: 1 }}>
                              - {event.source}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
                
                {executionEvents.length === 0 && (
                  <Typography variant="body2" color="textSecondary">
                    Aucun événement enregistré
                  </Typography>
                )}
              </List>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ExecutionLog;