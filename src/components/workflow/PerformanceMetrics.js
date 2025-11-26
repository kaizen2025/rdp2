import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  Switch,
  FormControlLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Badge
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Analytics,
  Speed,
  Timer,
  Error,
  CheckCircle,
  Warning,
  Schedule,
  Refresh,
  Assessment,
  BarChart,
  PieChart,
  Dashboard,
  Notifications,
  Alert as AlertIcon
} from '@mui/icons-material';
import { WorkflowEngine } from '../../services/workflowEngine';
import { AlertManager } from '../../services/alertManager';

/**
 * PerformanceMetrics - Widget de métriques de performance
 * 
 * Fonctionnalités:
 * - Métriques de performance en temps réel
 * - Graphiques de tendances
 * - Alertes de performance
 * - Indicateurs de santé système
 * - Comparaisons temporelles
 */
const PerformanceMetrics = ({ workflowEngine, refreshInterval = 10000 }) => {
  const [metrics, setMetrics] = useState({
    realTime: {
      activeWorkflows: 0,
      tasksPerSecond: 0,
      avgResponseTime: 0,
      successRate: 0,
      errorRate: 0,
      systemLoad: 0
    },
    trends: {
      workflowExecutions: [],
      responseTime: [],
      successRate: [],
      errorRate: []
    },
    alerts: [],
    performance: {
      throughput: 0,
      latency: 0,
      availability: 0,
      throughputTrend: 'stable',
      latencyTrend: 'stable',
      availabilityTrend: 'stable'
    }
  });
  const [selectedPeriod, setSelectedPeriod] = useState('1h');
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [historicalData, setHistoricalData] = useState([]);
  const [performanceThresholds, setPerformanceThresholds] = useState({
    responseTime: 5000, // 5 secondes
    successRate: 95, // 95%
    errorRate: 5, // 5%
    systemLoad: 80 // 80%
  });
  
  const intervalRef = useRef();
  const workflowEngineRef = useRef();

  // Périodes disponibles
  const periods = {
    '15m': { label: '15 minutes', milliseconds: 15 * 60 * 1000 },
    '1h': { label: '1 heure', milliseconds: 60 * 60 * 1000 },
    '6h': { label: '6 heures', milliseconds: 6 * 60 * 60 * 1000 },
    '24h': { label: '24 heures', milliseconds: 24 * 60 * 60 * 1000 },
    '7d': { label: '7 jours', milliseconds: 7 * 24 * 60 * 60 * 1000 }
  };

  // Métriques disponibles
  const metricTypes = {
    all: 'Toutes les métriques',
    throughput: 'Débit',
    latency: 'Latence',
    success: 'Taux de réussite',
    errors: 'Taux d\'erreur',
    load: 'Charge système'
  };

  // Initialiser le workflow engine
  useEffect(() => {
    if (!workflowEngine) {
      workflowEngineRef.current = new WorkflowEngine();
    } else {
      workflowEngineRef.current = workflowEngine;
    }
    
    loadMetrics();
    
    if (autoRefresh) {
      intervalRef.current = setInterval(loadMetrics, refreshInterval);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [workflowEngine, refreshInterval, autoRefresh]);

  // Charger les métriques
  const loadMetrics = async () => {
    try {
      const engine = workflowEngineRef.current;
      
      // Métriques en temps réel
      const realTimeData = await engine.getRealTimeMetrics();
      
      // Tendances historiques
      const trendsData = await engine.getPerformanceTrends(selectedPeriod);
      
      // Alertes de performance
      const alertsData = await AlertManager.getPerformanceAlerts();
      
      // Données historiques complètes
      const historical = await engine.getHistoricalMetrics(periods[selectedPeriod].milliseconds);
      
      // Calcul des tendances
      const performanceData = calculatePerformanceTrends(trendsData);
      
      setMetrics({
        realTime: realTimeData,
        trends: trendsData,
        alerts: alertsData,
        performance: performanceData
      });
      
      setHistoricalData(historical);
      
    } catch (error) {
      console.error('Erreur lors du chargement des métriques:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Calculer les tendances de performance
  const calculatePerformanceTrends = (trendsData) => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentData = trendsData.workflowExecutions.filter(point => 
      new Date(point.timestamp) > oneHourAgo
    );
    
    const olderData = trendsData.workflowExecutions.filter(point => 
      new Date(point.timestamp) <= oneHourAgo &&
      new Date(point.timestamp) > new Date(now.getTime() - 2 * 60 * 60 * 1000)
    );
    
    const getTrend = (recent, older) => {
      if (older.length === 0) return 'stable';
      const recentAvg = recent.reduce((sum, p) => sum + p.value, 0) / recent.length;
      const olderAvg = older.reduce((sum, p) => sum + p.value, 0) / older.length;
      
      const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;
      
      if (changePercent > 5) return 'up';
      if (changePercent < -5) return 'down';
      return 'stable';
    };
    
    return {
      throughput: recentData.length,
      latency: metrics.realTime.avgResponseTime,
      availability: metrics.realTime.successRate,
      throughputTrend: getTrend(recentData, olderData),
      latencyTrend: metrics.realTime.avgResponseTime < performanceThresholds.responseTime ? 'stable' : 'up',
      availabilityTrend: metrics.realTime.successRate > performanceThresholds.successRate ? 'stable' : 'down'
    };
  };

  // Rafraîchir manuellement
  const handleRefresh = () => {
    setRefreshing(true);
    loadMetrics();
  };

  // Gérer le changement de période
  const handlePeriodChange = (newPeriod) => {
    setSelectedPeriod(newPeriod);
    // Recharger avec la nouvelle période
    loadMetrics();
  };

  // Obtenir l'icône de tendance
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <TrendingUp color="success" />;
      case 'down': return <TrendingDown color="error" />;
      default: return <TrendingFlat color="default" />;
    }
  };

  // Obtenir la couleur de la tendance
  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up': return 'success';
      case 'down': return 'error';
      default: return 'default';
    }
  };

  // Vérifier les seuils de performance
  const checkPerformanceThresholds = () => {
    const alerts = [];
    
    if (metrics.realTime.avgResponseTime > performanceThresholds.responseTime) {
      alerts.push({
        type: 'warning',
        metric: 'responseTime',
        message: `Latence élevée: ${Math.round(metrics.realTime.avgResponseTime)}ms`,
        threshold: performanceThresholds.responseTime,
        value: metrics.realTime.avgResponseTime
      });
    }
    
    if (metrics.realTime.successRate < performanceThresholds.successRate) {
      alerts.push({
        type: 'error',
        metric: 'successRate',
        message: `Taux de réussite faible: ${Math.round(metrics.realTime.successRate)}%`,
        threshold: performanceThresholds.successRate,
        value: metrics.realTime.successRate
      });
    }
    
    if (metrics.realTime.errorRate > performanceThresholds.errorRate) {
      alerts.push({
        type: 'error',
        metric: 'errorRate',
        message: `Taux d'erreur élevé: ${Math.round(metrics.realTime.errorRate)}%`,
        threshold: performanceThresholds.errorRate,
        value: metrics.realTime.errorRate
      });
    }
    
    if (metrics.realTime.systemLoad > performanceThresholds.systemLoad) {
      alerts.push({
        type: 'warning',
        metric: 'systemLoad',
        message: `Charge système élevée: ${Math.round(metrics.realTime.systemLoad)}%`,
        threshold: performanceThresholds.systemLoad,
        value: metrics.realTime.systemLoad
      });
    }
    
    return alerts;
  };

  // Formater les données pour les graphiques
  const formatChartData = (data) => {
    return data.map(point => ({
      x: new Date(point.timestamp).toLocaleTimeString(),
      y: point.value
    }));
  };

  // Calculer les statistiques
  const getStatistics = (data) => {
    if (!data || data.length === 0) {
      return { min: 0, max: 0, avg: 0 };
    }
    
    const values = data.map(point => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    return { min, max, avg };
  };

  // Métriques principales
  const mainMetrics = [
    {
      title: 'Workflows Actifs',
      value: metrics.realTime.activeWorkflows,
      icon: <Dashboard />,
      color: 'primary',
      trend: 'stable'
    },
    {
      title: 'Tâches/seconde',
      value: metrics.realTime.tasksPerSecond.toFixed(1),
      icon: <Speed />,
      color: 'success',
      trend: 'up'
    },
    {
      title: 'Temps de Réponse',
      value: `${Math.round(metrics.realTime.avgResponseTime)}ms`,
      icon: <Timer />,
      color: metrics.realTime.avgResponseTime > performanceThresholds.responseTime ? 'error' : 'info',
      trend: metrics.realTime.avgResponseTime > performanceThresholds.responseTime ? 'up' : 'stable'
    },
    {
      title: 'Taux de Réussite',
      value: `${Math.round(metrics.realTime.successRate)}%`,
      icon: <CheckCircle />,
      color: metrics.realTime.successRate > performanceThresholds.successRate ? 'success' : 'warning',
      trend: metrics.realTime.successRate > performanceThresholds.successRate ? 'stable' : 'down'
    }
  ];

  const performanceAlerts = checkPerformanceThresholds();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Box textAlign="center">
          <Typography variant="h6">
            Chargement des métriques de performance...
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
            Métriques de Performance
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Surveillance temps réel et analyse des tendances
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Période</InputLabel>
            <Select
              value={selectedPeriod}
              onChange={(e) => handlePeriodChange(e.target.value)}
              label="Période"
            >
              {Object.entries(periods).map(([key, period]) => (
                <MenuItem key={key} value={key}>
                  {period.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Actualisation...' : 'Actualiser'}
          </Button>
          
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
            }
            label="Auto"
          />
        </Box>
      </Box>

      {/* Alertes de performance */}
      {performanceAlerts.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {performanceAlerts.map((alert, index) => (
            <Alert 
              key={index}
              severity={alert.type === 'error' ? 'error' : 'warning'}
              icon={<AlertIcon />}
              sx={{ mb: 1 }}
            >
              {alert.message}
              <Typography variant="caption" sx={{ ml: 1 }}>
                (Seuil: {alert.threshold})
              </Typography>
            </Alert>
          ))}
        </Box>
      )}

      {/* Métriques principales */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {mainMetrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: `${metric.color}.main`, mr: 2 }}>
                    {metric.icon}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      {metric.title}
                    </Typography>
                    <Typography variant="h4" component="div">
                      {metric.value}
                    </Typography>
                  </Box>
                  <Box>
                    {getTrendIcon(metric.trend)}
                  </Box>
                </Box>
                
                {/* Barre de progression si applicable */}
                {metric.title.includes('Taux') && (
                  <Box sx={{ width: '100%', mt: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={metric.title.includes('Réussite') ? metrics.realTime.successRate : 100 - metrics.realTime.errorRate}
                      color={metric.color}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Graphiques de tendances */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Tendances des Exécutions
                </Typography>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Métrique</InputLabel>
                  <Select
                    value={selectedMetric}
                    onChange={(e) => setSelectedMetric(e.target.value)}
                    label="Métrique"
                  >
                    {Object.entries(metricTypes).map(([key, label]) => (
                      <MenuItem key={key} value={key}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              
              {/* Simulation d'un graphique */}
              <Box sx={{ 
                height: 300, 
                bgcolor: 'grey.50', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                borderRadius: 1,
                position: 'relative'
              }}>
                <BarChart sx={{ fontSize: 48, color: 'primary.main', opacity: 0.3 }} />
                <Typography variant="h6" color="textSecondary" sx={{ position: 'absolute', bottom: 16 }}>
                  Graphique de tendances
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ position: 'absolute', bottom: 8 }}>
                  {formatChartData(metrics.trends.workflowExecutions).length} points de données
                </Typography>
              </Box>
              
              {/* Légende des statistiques */}
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" color="textSecondary">Moyenne</Typography>
                  <Typography variant="body2">
                    {Math.round(getStatistics(metrics.trends.workflowExecutions).avg)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">Minimum</Typography>
                  <Typography variant="body2">
                    {getStatistics(metrics.trends.workflowExecutions).min}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">Maximum</Typography>
                  <Typography variant="body2">
                    {getStatistics(metrics.trends.workflowExecutions).max}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">Total</Typography>
                  <Typography variant="body2">
                    {metrics.trends.workflowExecutions.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Indicateurs de santé système */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Santé Système
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Disponibilité"
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">
                          {metrics.realTime.successRate > 95 ? 'Excellente' : 'Bonne'}
                        </Typography>
                        <Chip
                          size="small"
                          label={`${Math.round(metrics.realTime.successRate)}%`}
                          color={metrics.realTime.successRate > 95 ? 'success' : 'warning'}
                        />
                      </Box>
                    }
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Speed color={metrics.realTime.avgResponseTime < 2000 ? 'success' : 'warning'} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Performance"
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">
                          {metrics.realTime.avgResponseTime < 2000 ? 'Rapide' : 'Lente'}
                        </Typography>
                        <Chip
                          size="small"
                          label={`${Math.round(metrics.realTime.avgResponseTime)}ms`}
                          color={metrics.realTime.avgResponseTime < 2000 ? 'success' : 'warning'}
                        />
                      </Box>
                    }
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Analytics color={metrics.realTime.errorRate < 2 ? 'success' : 'error'} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Fiabilité"
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">
                          {metrics.realTime.errorRate < 2 ? 'Haute' : 'Faible'}
                        </Typography>
                        <Chip
                          size="small"
                          label={`${Math.round(metrics.realTime.errorRate)}% erreurs`}
                          color={metrics.realTime.errorRate < 2 ? 'success' : 'error'}
                        />
                      </Box>
                    }
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tableau détaillé des métriques */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Métriques Détaillées
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Métrique</TableCell>
                  <TableCell align="right">Valeur Actuelle</TableCell>
                  <TableCell align="right">Tendance</TableCell>
                  <TableCell align="right">Seuil</TableCell>
                  <TableCell align="center">Statut</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Temps de réponse moyen</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color={metrics.realTime.avgResponseTime > performanceThresholds.responseTime ? 'error' : 'inherit'}>
                      {Math.round(metrics.realTime.avgResponseTime)}ms
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {getTrendIcon('stable')}
                  </TableCell>
                  <TableCell align="right">{performanceThresholds.responseTime}ms</TableCell>
                  <TableCell align="center">
                    <Chip
                      size="small"
                      label={metrics.realTime.avgResponseTime < performanceThresholds.responseTime ? 'OK' : 'Alerte'}
                      color={metrics.realTime.avgResponseTime < performanceThresholds.responseTime ? 'success' : 'error'}
                    />
                  </TableCell>
                </TableRow>
                
                <TableRow>
                  <TableCell>Taux de réussite</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color={metrics.realTime.successRate < performanceThresholds.successRate ? 'error' : 'inherit'}>
                      {Math.round(metrics.realTime.successRate)}%
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {getTrendIcon(metrics.realTime.successRate < performanceThresholds.successRate ? 'down' : 'stable')}
                  </TableCell>
                  <TableCell align="right">{performanceThresholds.successRate}%</TableCell>
                  <TableCell align="center">
                    <Chip
                      size="small"
                      label={metrics.realTime.successRate >= performanceThresholds.successRate ? 'OK' : 'Alerte'}
                      color={metrics.realTime.successRate >= performanceThresholds.successRate ? 'success' : 'error'}
                    />
                  </TableCell>
                </TableRow>
                
                <TableRow>
                  <TableCell>Taux d'erreur</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color={metrics.realTime.errorRate > performanceThresholds.errorRate ? 'error' : 'inherit'}>
                      {Math.round(metrics.realTime.errorRate)}%
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {getTrendIcon(metrics.realTime.errorRate > performanceThresholds.errorRate ? 'up' : 'stable')}
                  </TableCell>
                  <TableCell align="right">{performanceThresholds.errorRate}%</TableCell>
                  <TableCell align="center">
                    <Chip
                      size="small"
                      label={metrics.realTime.errorRate <= performanceThresholds.errorRate ? 'OK' : 'Alerte'}
                      color={metrics.realTime.errorRate <= performanceThresholds.errorRate ? 'success' : 'error'}
                    />
                  </TableCell>
                </TableRow>
                
                <TableRow>
                  <TableCell>Charge système</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color={metrics.realTime.systemLoad > performanceThresholds.systemLoad ? 'error' : 'inherit'}>
                      {Math.round(metrics.realTime.systemLoad)}%
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {getTrendIcon('stable')}
                  </TableCell>
                  <TableCell align="right">{performanceThresholds.systemLoad}%</TableCell>
                  <TableCell align="center">
                    <Chip
                      size="small"
                      label={metrics.realTime.systemLoad <= performanceThresholds.systemLoad ? 'OK' : 'Alerte'}
                      color={metrics.realTime.systemLoad <= performanceThresholds.systemLoad ? 'success' : 'error'}
                    />
                  </TableCell>
                </TableRow>
                
                <TableRow>
                  <TableCell>Workflows actifs</TableCell>
                  <TableCell align="right">{metrics.realTime.activeWorkflows}</TableCell>
                  <TableCell align="right">
                    {getTrendIcon('stable')}
                  </TableCell>
                  <TableCell align="right">-</TableCell>
                  <TableCell align="center">
                    <Chip
                      size="small"
                      label="Normal"
                      color="info"
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PerformanceMetrics;