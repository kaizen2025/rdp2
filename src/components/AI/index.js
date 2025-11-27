// src/components/ai/index.js - EXPORT DES COMPOSANTS IA DOCUCORTEX
// Point d'entrée central pour tous les composants d'intelligence artificielle

// Composants principaux
export { default as AIPredictionEngine } from './AIPredictionEngine';
export { default as PredictionDashboard } from './PredictionDashboard';
export { default as RecommendationsPanel } from './RecommendationsPanel';
export { default as AnomalyAlert } from './AnomalyAlert';
export { default as TrendAnalysis } from './TrendAnalysis';
export { default as ResourceOptimization } from './ResourceOptimization';

// Service IA
export { default as aiService } from '../../services/aiService';
export { 
    PREDICTION_TYPES, 
    ANOMALY_TYPES, 
    RECOMMENDATION_TYPES,
    AI_CONFIG 
} from '../../services/aiService';

// Configuration IA
export const AI_COMPONENTS_CONFIG = {
    components: {
        AIPredictionEngine: {
            name: 'Moteur IA Prédictif',
            description: 'Composant principal pour les prédictions et analyses intelligentes',
            icon: 'Brain',
            category: 'core'
        },
        PredictionDashboard: {
            name: 'Tableau de Bord IA',
            description: 'Métriques et analyses prédictives en temps réel',
            icon: 'BarChart3',
            category: 'analytics'
        },
        RecommendationsPanel: {
            name: 'Panneau de Recommandations',
            description: 'Suggestions personnalisées intelligentes',
            icon: 'Target',
            category: 'recommendations'
        },
        AnomalyAlert: {
            name: 'Système d\'Alertes IA',
            description: 'Détection intelligente d\'anomalies comportementales',
            icon: 'Shield',
            category: 'monitoring'
        },
        TrendAnalysis: {
            name: 'Analyse de Tendances',
            description: 'Visualisation et prédiction des tendances',
            icon: 'TrendingUp',
            category: 'analytics'
        },
        ResourceOptimization: {
            name: 'Optimisation des Ressources',
            description: 'Amélioration automatique des performances',
            icon: 'Zap',
            category: 'optimization'
        }
    },
    
    features: [
        {
            name: 'Prédictions de Demande',
            description: 'Prévoir les besoins futurs d\'équipements',
            components: ['AIPredictionEngine', 'PredictionDashboard']
        },
        {
            name: 'Détection d\'Anomalies',
            description: 'Identifier les comportements suspects',
            components: ['AnomalyAlert', 'AIPredictionEngine']
        },
        {
            name: 'Recommandations Personnalisées',
            description: 'Suggestions intelligentes par utilisateur',
            components: ['RecommendationsPanel', 'AIPredictionEngine']
        },
        {
            name: 'Analyse de Tendances',
            description: 'Visualiser les patterns historiques',
            components: ['TrendAnalysis', 'PredictionDashboard']
        },
        {
            name: 'Optimisation Automatique',
            description: 'Améliorer l\'utilisation des ressources',
            components: ['ResourceOptimization', 'AIPredictionEngine']
        }
    ],
    
    requirements: {
        dependencies: [
            'date-fns',
            'lucide-react'
        ],
        browsers: [
            'Chrome >= 70',
            'Firefox >= 65',
            'Safari >= 12',
            'Edge >= 79'
        ],
        storage: {
            localStorage: true,
            sessionStorage: false
        }
    },
    
    usage: {
        basic: `
import { AIPredictionEngine, aiService } from '../components/ai';

function MyComponent() {
    return (
        <AIPredictionEngine 
            userId={currentUser.id}
            refreshInterval={300000}
            autoRefresh={true}
        />
    );
}
        `,
        advanced: `
import { 
    AIPredictionEngine,
    PredictionDashboard,
    RecommendationsPanel,
    AnomalyAlert,
    TrendAnalysis,
    ResourceOptimization,
    aiService
} from '../components/ai';

function AdvancedAIComponent() {
    // Configuration personnalisée
    const aiConfig = {
        confidenceThreshold: 0.8,
        autoTraining: true,
        alertSensitivity: 'high'
    };
    
    const handlePrediction = async (prediction) => {
        console.log('Nouvelle prédiction:', prediction);
        // Traiter la prédiction
    };
    
    const handleAnomaly = async (anomaly) => {
        console.log('Anomalie détectée:', anomaly);
        // Gérer l'anomalie
    };
    
    return (
        <div className="ai-workspace">
            <AIPredictionEngine 
                onPrediction={handlePrediction}
                onAnomaly={handleAnomaly}
                config={aiConfig}
            />
            
            <PredictionDashboard 
                timeframe="30d"
                metrics={['loans', 'users', 'documents']}
            />
            
            <RecommendationsPanel 
                userId={currentUser.id}
                maxRecommendations={10}
            />
            
            <AnomalyAlert 
                autoRefresh={true}
                refreshInterval={180000}
            />
            
            <TrendAnalysis 
                timeframe="90d"
                metrics={['loans', 'users', 'delays']}
            />
            
            <ResourceOptimization 
                autoOptimize={true}
                monitoringEnabled={true}
            />
        </div>
    );
}
        `
    }
};

// Fonction utilitaire pour initialiser l'IA
export const initializeAI = async (config = {}) => {
    try {
        console.log('🧠 Initialisation du système IA DocuCortex...');
        
        // Configurer le service IA
        aiService.initialize(config);
        
        // Charger les modèles
        await aiService.loadStoredModels();
        
        // Entraîner les modèles initiaux
        await aiService.trainModels();
        
        console.log('✅ Système IA DocuCortex initialisé avec succès');
        
        return {
            service: aiService,
            status: 'initialized',
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de l\'IA:', error);
        throw error;
    }
};

// Fonction utilitaire pour obtenir les statistiques IA
export const getAIStatistics = () => {
    const serviceStats = aiService.getAIStatistics();
    
    return {
        ...serviceStats,
        components: Object.keys(AI_COMPONENTS_CONFIG.components).length,
        features: AI_COMPONENTS_CONFIG.features.length,
        lastUpdate: new Date().toISOString()
    };
};

// Fonction utilitaire pour nettoyer les données IA
export const cleanupAIData = () => {
    try {
        // Nettoyer le service IA
        aiService.cleanup();
        
        // Nettoyer le stockage local des composants IA
        const aiStorageKeys = [
            'docucortex_ai_models',
            'docucortex_ai_predictions',
            'docucortex_ai_recommendations',
            'docucortex_ai_user_clusters',
            'docucortex_seasonal_patterns',
            'docucortex_ai_training_data',
            'docucortex_ai_anomalies'
        ];
        
        aiStorageKeys.forEach(key => {
            localStorage.removeItem(key);
        });
        
        console.log('🧹 Nettoyage des données IA effectué');
        
        return {
            status: 'cleaned',
            cleanedKeys: aiStorageKeys.length,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('❌ Erreur lors du nettoyage:', error);
        throw error;
    }
};

// Fonction utilitaire pour vérifier la compatibilité
export const checkAICompatibility = () => {
    const checks = {
        browserSupport: 'Notification' in window,
        localStorageSupport: typeof Storage !== 'undefined',
        fetchSupport: typeof fetch !== 'undefined',
        es6Support: (() => {
            try {
                new Function('(x = 0) => x');
                return true;
            } catch (e) {
                return false;
            }
        })()
    };
    
    const isCompatible = Object.values(checks).every(check => check);
    
    return {
        compatible: isCompatible,
        checks,
        timestamp: new Date().toISOString()
    };
};

export default {
    // Composants
    AIPredictionEngine,
    PredictionDashboard,
    RecommendationsPanel,
    AnomalyAlert,
    TrendAnalysis,
    ResourceOptimization,
    
    // Service
    aiService,
    
    // Utilitaires
    initializeAI,
    getAIStatistics,
    cleanupAIData,
    checkAICompatibility,
    
    // Configuration
    AI_COMPONENTS_CONFIG,
    PREDICTION_TYPES,
    ANOMALY_TYPES,
    RECOMMENDATION_TYPES,
    AI_CONFIG
};