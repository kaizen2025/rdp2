// src/config/aiIntegration.js - CONFIGURATION D'INTÉGRATION IA DOCUCORTEX
// Configuration centralisée pour l'intégration de l'IA dans l'application

import { AIPredictionEngine, aiService } from '../components/ai';

// Configuration globale de l'IA
export const AI_CONFIG = {
    // Paramètres généraux
    enabled: true,
    autoInitialize: true,
    debug: process.env.NODE_ENV === 'development',
    
    // Seuils et paramètres
    confidenceThreshold: 0.7,
    anomalySensitivity: 'medium',
    predictionTimeframe: 30, // jours
    trainingInterval: 24 * 60 * 60 * 1000, // 24h
    
    // Interface utilisateur
    refreshInterval: 300000, // 5 minutes
    autoRefresh: true,
    maxRecommendations: 20,
    
    // Stockage
    storage: {
        maxPredictions: 1000,
        maxRecommendations: 500,
        maxAnomalies: 200,
        cacheExpiry: 86400000 // 24h
    },
    
    // Algorithmes
    algorithms: {
        clustering: 'kmeans',
        defaultClusters: 5,
        featureWeights: {
            loanFrequency: 0.3,
            returnTime: 0.25,
            documentType: 0.2,
            seasonal: 0.15,
            userBehavior: 0.1
        }
    }
};

// Rôles utilisateur et permissions IA
export const AI_PERMISSIONS = {
    ADMIN: {
        canViewAllPredictions: true,
        canViewAllAnomalies: true,
        canManageModels: true,
        canOverrideSettings: true,
        canExportData: true
    },
    MANAGER: {
        canViewAllPredictions: true,
        canViewAllAnomalies: true,
        canManageModels: false,
        canOverrideSettings: false,
        canExportData: true
    },
    USER: {
        canViewAllPredictions: false,
        canViewAllAnomalies: false,
        canManageModels: false,
        canOverrideSettings: false,
        canExportData: false
    },
    GUEST: {
        canViewAllPredictions: false,
        canViewAllAnomalies: false,
        canManageModels: false,
        canOverrideSettings: false,
        canExportData: false
    }
};

// Fonction pour initialiser l'IA avec configuration personnalisée
export const initAIWithConfig = async (customConfig = {}) => {
    const config = { ...AI_CONFIG, ...customConfig };
    
    if (!config.enabled) {
        console.log('🔌 IA DocuCortex désactivée dans la configuration');
        return null;
    }
    
    try {
        console.log('🧠 Initialisation de l\'IA DocuCortex avec configuration:', config);
        
        // Initialiser le service IA
        await aiService.init();
        
        // Charger les modèles sauvegardés
        await aiService.loadStoredModels();
        
        // Entraîner les modèles si configuré
        if (config.autoInitialize) {
            await aiService.trainModels();
        }
        
        console.log('✅ IA DocuCortex initialisée avec succès');
        
        return {
            service: aiService,
            config,
            initialized: true,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de l\'IA:', error);
        throw error;
    }
};

// Fonction pour obtenir les permissions IA selon le rôle
export const getAIPermissions = (userRole) => {
    return AI_PERMISSIONS[userRole?.toUpperCase()] || AI_PERMISSIONS.USER;
};

// Fonction pour filtrer les données selon les permissions
export const filterDataByPermissions = (data, userRole) => {
    const permissions = getAIPermissions(userRole);
    const filteredData = { ...data };
    
    // Filtrer les prédictions
    if (!permissions.canViewAllPredictions && userRole) {
        // Ne garder que les prédictions de l'utilisateur
        filteredData.predictions = (filteredData.predictions || []).filter(
            pred => pred.userId === userRole.id
        );
    }
    
    // Filtrer les anomalies
    if (!permissions.canViewAllAnomalies && userRole) {
        // Ne garder que les anomalies liées à l'utilisateur
        filteredData.anomalies = (filteredData.anomalies || []).filter(
            anomaly => anomaly.userId === userRole.id
        );
    }
    
    return filteredData;
};

// Composant d'intégration IA pour les routes
export const AIIntegrationWrapper = ({ children, userRole, requireAI = false }) => {
    const [aiStatus, setAiStatus] = useState({
        initialized: false,
        loading: true,
        error: null
    });
    
    useEffect(() => {
        const initialize = async () => {
            try {
                setAiStatus(prev => ({ ...prev, loading: true, error: null }));
                
                if (requireAI || AI_CONFIG.autoInitialize) {
                    await initAIWithConfig();
                }
                
                setAiStatus({
                    initialized: true,
                    loading: false,
                    error: null
                });
                
            } catch (error) {
                setAiStatus({
                    initialized: false,
                    loading: false,
                    error: error.message
                });
            }
        };
        
        initialize();
    }, [requireAI]);
    
    if (aiStatus.loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <RefreshCw className="w-6 h-6 animate-spin text-purple-600 mr-2" />
                <span>Initialisation de l'IA DocuCortex...</span>
            </div>
        );
    }
    
    if (aiStatus.error && requireAI) {
        return (
            <div className="p-8 text-center">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-600" />
                <h3 className="text-lg font-semibold mb-2">Erreur d'initialisation IA</h3>
                <p className="text-gray-600">{aiStatus.error}</p>
            </div>
        );
    }
    
    return children;
};

// Hook pour utiliser l'IA avec permissions
export const useAI = (userRole) => {
    const [data, setData] = useState({
        predictions: [],
        recommendations: [],
        anomalies: [],
        trends: [],
        optimizations: []
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const permissions = getAIPermissions(userRole);
    
    const loadAIData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const [predictions, recommendations, anomalies] = await Promise.all([
                aiService.predictEquipmentDemand(),
                aiService.generatePersonalizedRecommendations(userRole?.id),
                aiService.detectAnomalies()
            ]);
            
            const newData = {
                predictions: predictions?.predictions || [],
                recommendations: recommendations || [],
                anomalies: anomalies || [],
                trends: [], // À implémenter
                optimizations: [] // À implémenter
            };
            
            // Appliquer les permissions
            const filteredData = filterDataByPermissions(newData, userRole);
            setData(filteredData);
            
        } catch (err) {
            console.error('❌ Erreur lors du chargement des données IA:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        if (AI_CONFIG.enabled) {
            loadAIData();
            
            // Actualisation automatique
            if (AI_CONFIG.autoRefresh) {
                const interval = setInterval(loadAIData, AI_CONFIG.refreshInterval);
                return () => clearInterval(interval);
            }
        }
    }, [userRole]);
    
    return {
        data,
        loading,
        error,
        permissions,
        reload: loadAIData,
        initializeAI: () => initAIWithConfig()
    };
};

// Configuration des routes IA
export const AI_ROUTES = {
    '/ai-assistant': {
        component: 'AIAssistant',
        requireAI: true,
        title: 'Assistant IA DocuCortex'
    },
    '/ai-demo': {
        component: 'AIDemo',
        requireAI: false,
        title: 'Démonstration IA'
    },
    '/dashboard': {
        component: 'PredictionDashboard',
        requireAI: false,
        title: 'Tableau de Bord IA'
    }
};

// Fonction pour vérifier la compatibilité du navigateur
export const checkBrowserCompatibility = () => {
    const checks = {
        localStorage: typeof Storage !== 'undefined',
        fetch: typeof fetch !== 'undefined',
        promises: typeof Promise !== 'undefined',
        notifications: 'Notification' in window,
        webWorkers: typeof Worker !== 'undefined'
    };
    
    const compatible = Object.values(checks).every(check => check);
    
    return {
        compatible,
        checks,
        requirements: {
            minimum: ['localStorage', 'fetch', 'promises'],
            recommended: [...this.minimum, 'notifications', 'webWorkers']
        }
    };
};

// Fonction pour monitorer les performances IA
export const monitorAIPerformance = () => {
    const metrics = {
        startTime: Date.now(),
        predictions: 0,
        recommendations: 0,
        anomalies: 0,
        errors: 0,
        averageResponseTime: 0
    };
    
    const recordMetric = (type, responseTime, success = true) => {
        metrics[type]++;
        if (!success) metrics.errors++;
        
        // Calculer le temps de réponse moyen
        const totalCalls = metrics.predictions + metrics.recommendations + metrics.anomalies;
        metrics.averageResponseTime = (metrics.averageResponseTime * (totalCalls - 1) + responseTime) / totalCalls;
        
        console.log(`📊 Métrique IA: ${type} (${success ? 'succès' : 'erreur'}) - ${responseTime}ms`);
    };
    
    const getReport = () => {
        const totalTime = Date.now() - metrics.startTime;
        const successRate = ((metrics.predictions + metrics.recommendations + metrics.anomalies - metrics.errors) / 
                           Math.max(metrics.predictions + metrics.recommendations + metrics.anomalies, 1)) * 100;
        
        return {
            ...metrics,
            totalTime,
            successRate: Math.round(successRate * 100) / 100,
            uptime: new Date(metrics.startTime).toISOString()
        };
    };
    
    return {
        recordMetric,
        getReport,
        reset: () => {
            Object.assign(metrics, {
                startTime: Date.now(),
                predictions: 0,
                recommendations: 0,
                anomalies: 0,
                errors: 0,
                averageResponseTime: 0
            });
        }
    };
};

// Export par défaut
export default {
    AI_CONFIG,
    AI_PERMISSIONS,
    initAIWithConfig,
    getAIPermissions,
    filterDataByPermissions,
    AIIntegrationWrapper,
    useAI,
    AI_ROUTES,
    checkBrowserCompatibility,
    monitorAIPerformance
};