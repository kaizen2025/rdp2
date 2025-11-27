// src/index-analytics-rapports.js - POINT D'ENTRÉE POUR LE SYSTÈME ANALYTICS & RAPPORTS
// Import et export centralisé de tous les composants de la Phase 3

// Import des services
import analyticsService from './services/analyticsService';
import ApiService from './services/apiService';

// Import des composants dashboard
export {
    ExecutiveDashboard,
    KPIWidget,
    TrendAnalysis,
    BenchmarkComparison,
    InsightsPanel,
    FinancialKPIWidget,
    PercentageKPIWidget,
    NumberKPIWidget,
    SatisfactionKPIWidget,
    AlertKPIWidget
} from './components/dashboard';

// Import des composants de rapports
export { default as ReportGenerator } from './components/reports/ReportGenerator';
export { default as MonthlyReport } from './components/reports/MonthlyReport';
export { default as UsageReport } from './components/reports/UsageReport';
export { default as ComplianceReport } from './components/reports/ComplianceReport';
export { default as PerformanceReport } from './components/reports/PerformanceReport';
export { default as UserActivityReport } from './components/reports/UserActivityReport';

// Import du composant de démonstration
export { default as AnalyticsRapportsDemo } from './components/AnalyticsRapportsDemo';

// Export des services
export { analyticsService, ApiService };

// Configuration par défaut du système
export const AnalyticsConfig = {
    // Configuration des caches
    cacheTimeout: 300000, // 5 minutes
    maxCacheSize: 100,
    
    // Configuration des rapports
    defaultReportFormats: ['pdf', 'excel', 'html'],
    maxReportSize: '10MB',
    supportedLanguages: ['fr', 'en'],
    
    // Configuration des graphiques
    chartDefaults: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            }
        }
    },
    
    // Configuration des KPIs
    kpiThresholds: {
        satisfaction: { good: 8, warning: 6, critical: 4 },
        performance: { good: 90, warning: 70, critical: 50 },
        security: { good: 95, warning: 80, critical: 60 }
    },
    
    // Configuration de l'analytics
    predictionHorizon: 30, // jours
    anomalySensitivity: 0.1,
    trendSmoothing: 0.3
};

// Utilitaires pour faciliter l'utilisation
export const AnalyticsUtils = {
    // Formater les métriques selon le contexte
    formatMetric: (value, type, options = {}) => {
        const formatters = {
            currency: (val) => new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR'
            }).format(val),
            percentage: (val) => `${val.toFixed(1)}%`,
            number: (val) => val.toLocaleString('fr-FR'),
            duration: (val) => `${val.toFixed(1)} jours`,
            score: (val) => `${val.toFixed(1)}/10`
        };
        
        const formatter = formatters[type] || formatters.number;
        return formatter(value);
    },
    
    // Calculer le statut d'un KPI
    getKPIStatus: (value, threshold, type = 'higher') => {
        if (type === 'higher') {
            if (value >= threshold.good) return 'success';
            if (value >= threshold.warning) return 'warning';
            return 'danger';
        } else {
            if (value <= threshold.good) return 'success';
            if (value <= threshold.warning) return 'warning';
            return 'danger';
        }
    },
    
    // Générer un color scheme pour les graphiques
    getColorScheme: (name) => {
        const schemes = {
            default: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
            warm: ['#F59E0B', '#EF4444', '#EC4899', '#F97316', '#FCD34D'],
            cool: ['#3B82F6', '#06B6D4', '#8B5CF6', '#6366F1', '#0EA5E9'],
            mono: ['#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#F3F4F6']
        };
        
        return schemes[name] || schemes.default;
    },
    
    // Valider les paramètres d'un rapport
    validateReportParams: (params) => {
        const errors = [];
        
        if (!params.reportType) errors.push('Type de rapport requis');
        if (!params.dateRange?.start || !params.dateRange?.end) {
            errors.push('Plage de dates requise');
        }
        if (!['pdf', 'excel', 'html'].includes(params.format)) {
            errors.push('Format de sortie invalide');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    },
    
    // Exporter les données vers différents formats
    exportData: async (data, format, filename) => {
        const exporters = {
            csv: (data) => {
                const csv = convertToCSV(data);
                downloadFile(csv, filename, 'text/csv');
            },
            json: (data) => {
                const json = JSON.stringify(data, null, 2);
                downloadFile(json, filename, 'application/json');
            },
            excel: (data) => {
                // Utilisation d'ExcelJS pour l'export Excel
                // Cette fonction devrait être implémentée selon les besoins
                console.log('Export Excel à implémenter');
            }
        };
        
        if (exporters[format]) {
            await exporters[format](data);
        } else {
            throw new Error(`Format d'export non supporté: ${format}`);
        }
    }
};

// Fonctions utilitaires privées
const convertToCSV = (data) => {
    if (!Array.isArray(data) || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => 
                typeof row[header] === 'string' && row[header].includes(',') 
                    ? `"${row[header]}"` 
                    : row[header]
            ).join(',')
        )
    ].join('\n');
    
    return csvContent;
};

const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// Hook React pour l'utilisation simplifiée
export const useAnalytics = (options = {}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const {
        dateRange,
        autoRefresh = false,
        refreshInterval = 300000
    } = options;
    
    const loadData = useCallback(async () => {
        if (!dateRange) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const [kpis, insights, predictions] = await Promise.all([
                analyticsService.calculateBusinessKPIs(dateRange),
                analyticsService.generateInsights(dateRange),
                analyticsService.predictFutureDemand(30)
            ]);
            
            setData({ kpis, insights, predictions, dateRange });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [dateRange]);
    
    useEffect(() => {
        loadData();
        
        if (autoRefresh && dateRange) {
            const interval = setInterval(loadData, refreshInterval);
            return () => clearInterval(interval);
        }
    }, [loadData, autoRefresh, refreshInterval, dateRange]);
    
    return {
        data,
        loading,
        error,
        reload: loadData
    };
};

// Hook pour la génération de rapports
export const useReportGenerator = () => {
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    
    const generateReport = useCallback(async (config) => {
        setGenerating(true);
        setProgress(0);
        
        try {
            const validation = AnalyticsUtils.validateReportParams(config);
            if (!validation.isValid) {
                throw new Error(validation.errors.join(', '));
            }
            
            // Simulation du progrès
            for (let i = 0; i <= 100; i += 10) {
                setProgress(i);
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Ici, on appelera la logique réelle de génération
            // ...
            
            return { success: true, filename: `${config.reportType}_${Date.now()}.${config.format}` };
        } catch (error) {
            return { success: false, error: error.message };
        } finally {
            setGenerating(false);
            setProgress(0);
        }
    }, []);
    
    return {
        generateReport,
        generating,
        progress
    };
};

// Composant de démonstration rapide
export const QuickAnalyticsDemo = () => {
    const { data, loading, error } = useAnalytics({
        dateRange: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            end: new Date()
        },
        autoRefresh: true
    });
    
    if (loading) return <div>Chargement des analytics...</div>;
    if (error) return <div>Erreur: {error}</div>;
    if (!data) return <div>Aucune donnée disponible</div>;
    
    return (
        <div className="quick-analytics-demo">
            <h2>Analytics Rapides</h2>
            <div className="kpi-grid">
                <div className="kpi-card">
                    <h3>Total Prêts</h3>
                    <p className="kpi-value">{data.kpis.totalLoans}</p>
                </div>
                <div className="kpi-card">
                    <h3>Taux de Retour</h3>
                    <p className="kpi-value">{data.kpis.returnRate?.toFixed(1)}%</p>
                </div>
                <div className="kpi-card">
                    <h3>Satisfaction</h3>
                    <p className="kpi-value">{data.kpis.satisfactionScore}/10</p>
                </div>
            </div>
        </div>
    );
};

// Export par défaut pour compatibilité
export default {
    // Services
    analyticsService,
    ApiService,
    
    // Dashboard
    ExecutiveDashboard,
    KPIWidget,
    TrendAnalysis,
    BenchmarkComparison,
    InsightsPanel,
    
    // Rapports
    ReportGenerator,
    MonthlyReport,
    UsageReport,
    ComplianceReport,
    PerformanceReport,
    UserActivityReport,
    
    // Utilitaires
    AnalyticsConfig,
    AnalyticsUtils,
    
    // Hooks
    useAnalytics,
    useReportGenerator,
    
    // Composants utilitaires
    QuickAnalyticsDemo,
    AnalyticsRapportsDemo
};