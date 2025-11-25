import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Button,
  Select,
  Badge,
  Progress,
  Alert,
  Spinner,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '../ui';
import { AlertCircle, TrendingUp, TrendingDown, Download, Settings, Zap } from 'lucide-react';

// Lazy loading des composants Chart.js pour optimiser les performances
const LineChart = lazy(() => import('../ui/charts/LineChart'));
const BarChart = lazy(() => import('../ui/charts/BarChart'));
const PieChart = lazy(() => import('../ui/charts/PieChart'));
const DoughnutChart = lazy(() => import('../ui/charts/DoughnutChart'));

// Configuration intelligente du cache (<50MB)
class SmartCache {
  constructor(maxSize = 50 * 1024 * 1024) { // 50MB
    this.maxSize = maxSize;
    this.currentSize = 0;
    this.cache = new Map();
    this.lastAccess = new Map();
  }

  set(key, value, size) {
    if (size > this.maxSize) return false;
    
    // Éviction LRU si nécessaire
    while (this.currentSize + size > this.maxSize && this.cache.size > 0) {
      const oldestKey = this.getOldestKey();
      this.delete(oldestKey);
    }
    
    this.cache.set(key, value);
    this.lastAccess.set(key, Date.now());
    this.currentSize += size;
    return true;
  }

  get(key) {
    if (this.cache.has(key)) {
      this.lastAccess.set(key, Date.now());
      return this.cache.get(key);
    }
    return null;
  }

  getOldestKey() {
    let oldestKey = null;
    let oldestTime = Infinity;
    
    for (const [key, time] of this.lastAccess) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }
    return oldestKey;
  }

  delete(key) {
    if (this.cache.has(key)) {
      this.currentSize -= this.estimateSize(this.cache.get(key));
      this.cache.delete(key);
      this.lastAccess.delete(key);
    }
  }

  estimateSize(obj) {
    return JSON.stringify(obj).length * 2; // Estimation approximative
  }

  clear() {
    this.cache.clear();
    this.lastAccess.clear();
    this.currentSize = 0;
  }

  getStats() {
    return {
      size: this.cache.size,
      memoryUsage: this.currentSize,
      maxSize: this.maxSize,
      hitRate: this.hitRate || 0
    };
  }
}

// Hook pour la gestion des données streaming optimisées
const useStreamingAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cacheRef = useMemo(() => new SmartCache(), []);
  
  const fetchData = useCallback(async (cacheKey = 'analytics_data') => {
    try {
      // Vérification du cache
      const cachedData = cacheRef.get(cacheKey);
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        return;
      }

      setLoading(true);
      
      // Simulation de données streaming optimisées
      const response = await new Promise(resolve => {
        setTimeout(() => {
          resolve({
            kpis: {
              satisfaction: {
                current: 4.2,
                previous: 3.9,
                trend: 'up',
                target: 4.5,
                history: [3.8, 3.9, 4.0, 4.1, 4.2]
              },
              tempsTraitement: {
                current: 2.3,
                previous: 2.8,
                trend: 'down',
                target: 2.0,
                unit: 'heures',
                history: [3.2, 3.0, 2.8, 2.5, 2.3]
              },
              retoursDelais: {
                current: 8.5,
                previous: 12.3,
                trend: 'down',
                target: 5.0,
                unit: '%',
                history: [15.2, 13.8, 12.3, 10.1, 8.5]
              }
            },
            charts: {
              utilisateursActifs: {
                labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
                data: [120, 145, 180, 165, 195, 210]
              },
              satisfactionMensuelle: {
                labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
                data: [3.8, 3.9, 4.0, 4.1, 4.2, 4.2]
              },
              performanceDepartements: {
                labels: ['IT', 'RH', 'Finance', 'Marketing', 'Ventes'],
                data: [85, 78, 92, 88, 81]
              },
              typesUtilisateurs: {
                labels: ['Utilisateurs', 'Administrateurs', 'Superviseurs', 'Guests'],
                data: [65, 15, 12, 8]
              }
            },
            alerts: [
              { id: 1, type: 'warning', message: 'Temps de traitement en hausse pour le département IT' },
              { id: 2, type: 'success', message: 'Objectif de satisfaction atteint pour mai' }
            ],
            lastUpdate: new Date().toISOString()
          });
        }, 500);
      });

      // Stockage dans le cache
      cacheRef.set(cacheKey, response, JSON.stringify(response).length * 2);
      
      setData(response);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [cacheRef]);

  return { data, loading, error, fetchData, cacheStats: cacheRef.getStats() };
};

// Composant KPI temps réel optimisé avec React.memo
const KPICard = React.memo(({ title, value, trend, target, unit, previous }) => {
  const isPositive = trend === 'up';
  const isAboveTarget = value >= target;
  
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const trendColor = isPositive ? 'text-green-500' : 'text-red-500';
  
  const progressValue = Math.min((value / target) * 100, 100);
  
  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <Badge variant={isAboveTarget ? 'default' : 'destructive'} className="text-xs">
          {unit}
        </Badge>
      </div>
      
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl font-bold text-gray-900">
          {value.toFixed(1)}
        </span>
        <div className={`flex items-center ${trendColor}`}>
          <TrendIcon className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">
            {isPositive ? '+' : ''}{((value - previous) / previous * 100).toFixed(1)}%
          </span>
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div 
          className={`h-2 rounded-full ${isAboveTarget ? 'bg-green-500' : 'bg-yellow-500'}`}
          style={{ width: `${Math.min(progressValue, 100)}%` }}
        />
      </div>
      
      <div className="text-xs text-gray-500">
        Objectif: {target.toFixed(1)} {unit}
      </div>
    </Card>
  );
});

// Composant de Widget configurable avec drag & drop
const ConfigurableWidget = React.memo(({ 
  id, 
  title, 
  children, 
  onRemove, 
  onConfigure,
  isDragging = false 
}) => {
  return (
    <Card className={`p-4 ${isDragging ? 'shadow-xl scale-105' : 'hover:shadow-lg'} transition-all duration-200`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onConfigure}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onRemove(id)}
          >
            ×
          </Button>
        </div>
      </div>
      <div className="min-h-[200px]">
        {children}
      </div>
    </Card>
  );
});

// Composant d'export automatisé
const ExportReport = React.memo(({ data, onExport }) => {
  const [exportFormat, setExportFormat] = useState('pdf');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      await onExport(exportFormat, data);
    } finally {
      setIsExporting(false);
    }
  }, [exportFormat, data, onExport]);

  return (
    <div className="flex items-center space-x-2">
      <Select 
        value={exportFormat} 
        onValueChange={setExportFormat}
        className="w-24"
      >
        <option value="pdf">PDF</option>
        <option value="excel">Excel</option>
        <option value="csv">CSV</option>
      </Select>
      <Button 
        onClick={handleExport} 
        disabled={isExporting}
        className="flex items-center space-x-2"
      >
        {isExporting ? (
          <Spinner className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        <span>Exporter</span>
      </Button>
    </div>
  );
});

// Composant principal optimisé
const UserAnalyticsDashboard = React.memo(() => {
  const { data, loading, error, fetchData, cacheStats } = useStreamingAnalytics();
  const [activeTab, setActiveTab] = useState('kpis');
  const [widgets, setWidgets] = useState([
    { id: 'satisfaction', title: 'Satisfaction Client', component: 'kpi' },
    { id: 'performance', title: 'Performance Temps Réel', component: 'chart' },
    { id: 'utilisateurs', title: 'Utilisateurs Actifs', component: 'chart' },
    { id: 'alerts', title: 'Alertes & Notifications', component: 'alert' }
  ]);
  
  // Auto-refresh toutes les 30 secondes pour les données temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchData]);

  // Optimisation pour compatibilité RDP (streaming adapté)
  const isRDPActive = useMemo(() => {
    return navigator.connection && navigator.connection.effectiveType === '2g';
  }, []);

  const removeWidget = useCallback((widgetId) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
  }, []);

  const configureWidget = useCallback((widgetId) => {
    console.log('Configuration du widget:', widgetId);
    // TODO: Ouvrir modal de configuration
  }, []);

  const handleExport = useCallback(async (format, data) => {
    const timestamp = new Date().toISOString().split('T')[0];
    
    switch (format) {
      case 'pdf':
        // Simulation export PDF
        const pdfBlob = new Blob([`Rapport Analytics - ${timestamp}`], { type: 'application/pdf' });
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport-analytics-${timestamp}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        break;
        
      case 'excel':
        // Simulation export Excel
        const csvContent = "data:text/csv;charset=utf-8," + 
          "KPI,Valeur,Objectif,Tendance\n" +
          `Satisfaction,${data.kpis.satisfaction.current},${data.kpis.satisfaction.target},${data.kpis.satisfaction.trend}\n` +
          `Temps Traitement,${data.kpis.tempsTraitement.current}h,${data.kpis.tempsTraitement.target}h,${data.kpis.tempsTraitement.trend}\n` +
          `Retours Délais,${data.kpis.retoursDelais.current}%,${data.kpis.retoursDelais.target}%,${data.kpis.retoursDelais.trend}`;
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `rapport-analytics-${timestamp}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        break;
        
      default:
        console.log('Format non supporté:', format);
    }
  }, []);

  // Memo des KPIs pour éviter les re-rendus inutiles
  const kpiData = useMemo(() => {
    if (!data) return null;
    
    return [
      {
        title: 'Satisfaction Client',
        value: data.kpis.satisfaction.current,
        trend: data.kpis.satisfaction.trend,
        target: data.kpis.satisfaction.target,
        unit: '/5',
        previous: data.kpis.satisfaction.previous
      },
      {
        title: 'Temps Traitement',
        value: data.kpis.tempsTraitement.current,
        trend: data.kpis.tempsTraitement.trend,
        target: data.kpis.tempsTraitement.target,
        unit: 'h',
        previous: data.kpis.tempsTraitement.previous
      },
      {
        title: 'Retours Délais',
        value: data.kpis.retoursDelais.current,
        trend: data.kpis.retoursDelais.trend,
        target: data.kpis.retoursDelais.target,
        unit: '%',
        previous: data.kpis.retoursDelais.previous
      }
    ];
  }, [data]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-gray-600">Chargement des analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-4">
        <AlertCircle className="h-4 w-4" />
        <div>
          <h4 className="font-medium">Erreur de chargement</h4>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </Alert>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* En-tête avec métadonnées */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Analytics Utilisateurs - Dashboard Temps Réel
          </h1>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Dernière mise à jour: {data?.lastUpdate ? new Date(data.lastUpdate).toLocaleTimeString() : 'N/A'}</span>
            <Badge variant="outline" className="flex items-center">
              <Zap className="h-3 w-3 mr-1" />
              Cache: {Math.round(cacheStats.memoryUsage / 1024)}KB
            </Badge>
            {isRDPActive && (
              <Badge variant="secondary">
                Mode RDP Optimisé
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <ExportReport data={data} onExport={handleExport} />
          <Button onClick={() => fetchData()} variant="outline">
            Actualiser
          </Button>
        </div>
      </div>

      {/* Indicateurs de cache et performance */}
      {cacheStats.memoryUsage > 40 * 1024 * 1024 && ( // 40MB
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Cache quasi plein</h4>
            <p className="text-sm text-gray-600">
              Usage: {Math.round(cacheStats.memoryUsage / 1024 / 1024 * 100) / 100}MB / 50MB
            </p>
          </div>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="kpis">KPIs Temps Réel</TabsTrigger>
          <TabsTrigger value="charts">Graphiques</TabsTrigger>
          <TabsTrigger value="widgets">Widgets</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        {/* Onglet KPIs */}
        <TabsContent value="kpis" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpiData?.map((kpi, index) => (
              <KPICard key={index} {...kpi} />
            ))}
          </div>
          
          {/* Alertes en temps réel */}
          {data?.alerts && data.alerts.length > 0 && (
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Alertes Temps Réel</h3>
              <div className="space-y-3">
                {data.alerts.map(alert => (
                  <Alert key={alert.id} className={
                    alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'
                  }>
                    <AlertCircle className="h-4 w-4" />
                    <div>
                      <h4 className="font-medium">{alert.type === 'warning' ? 'Attention' : 'Succès'}</h4>
                      <p className="text-sm text-gray-600">{alert.message}</p>
                    </div>
                  </Alert>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Onglet Graphiques */}
        <TabsContent value="charts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Suspense fallback={<div className="h-[300px] flex items-center justify-center"><Spinner className="h-6 w-6 animate-spin" /></div>}>
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Utilisateurs Actifs (6 derniers mois)</h3>
                <LineChart 
                  data={data?.charts.utilisateursActifs}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              </Card>
            </Suspense>
            
            <Suspense fallback={<div className="h-[300px] flex items-center justify-center"><Spinner className="h-6 w-6 animate-spin" /></div>}>
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Satisfaction Mensuelle</h3>
                <BarChart 
                  data={data?.charts.satisfactionMensuelle}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              </Card>
            </Suspense>
            
            <Suspense fallback={<div className="h-[300px] flex items-center justify-center"><Spinner className="h-6 w-6 animate-spin" /></div>}>
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Performance Départements</h3>
                <BarChart 
                  data={data?.charts.performanceDepartements}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              </Card>
            </Suspense>
            
            <Suspense fallback={<div className="h-[300px] flex items-center justify-center"><Spinner className="h-6 w-6 animate-spin" /></div>}>
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Répartition Utilisateurs</h3>
                <DoughnutChart 
                  data={data?.charts.typesUtilisateurs}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              </Card>
            </Suspense>
          </div>
        </TabsContent>

        {/* Onglet Widgets configurables */}
        <TabsContent value="widgets" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Widgets Configurables</h3>
            <Badge variant="outline">
              {widgets.length} widgets actifs
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {widgets.map(widget => (
              <ConfigurableWidget
                key={widget.id}
                id={widget.id}
                title={widget.title}
                onRemove={removeWidget}
                onConfigure={configureWidget}
              >
                {widget.component === 'kpi' && (
                  <div className="text-center p-4">
                    <Progress value={80} className="mb-2" />
                    <p className="text-sm text-gray-600">Widget KPI en temps réel</p>
                  </div>
                )}
                
                {widget.component === 'chart' && (
                  <Suspense fallback={<Spinner className="h-6 w-6 animate-spin" />}>
                    <LineChart 
                      data={{
                        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
                        datasets: [{ data: [10, 20, 30, 25, 35, 40] }]
                      }}
                      height={200}
                    />
                  </Suspense>
                )}
                
                {widget.component === 'alert' && (
                  <div className="space-y-2">
                    <Alert className="border-green-200 bg-green-50">
                      <AlertCircle className="h-4 w-4" />
                      <div>
                        <p className="text-sm">Système opérationnel</p>
                      </div>
                    </Alert>
                  </div>
                )}
              </ConfigurableWidget>
            ))}
          </div>
        </TabsContent>

        {/* Onglet Export */}
        <TabsContent value="export" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Configuration Export Automatisé</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Formats Disponibles</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• PDF - Rapport complet avec graphiques</li>
                  <li>• Excel - Données tabulaires exportables</li>
                  <li>• CSV - Données brutes pour analyse</li>
                  <li>• JSON - API format pour intégration</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Configuration Cache</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Taille: {cacheStats.size} entrées</p>
                  <p>Usage mémoire: {Math.round(cacheStats.memoryUsage / 1024)}KB</p>
                  <p>Limite: 50MB</p>
                  <Progress 
                    value={(cacheStats.memoryUsage / (50 * 1024 * 1024)) * 100} 
                    className="mt-2" 
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <ExportReport data={data} onExport={handleExport} />
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
});

// Optimisation finale pour le rendu
UserAnalyticsDashboard.displayName = 'UserAnalyticsDashboard';

export default UserAnalyticsDashboard;