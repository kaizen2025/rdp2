// src/pages/AIAssistant.js - PAGE D'ASSISTANT IA DOCUCORTEX
// Page de démonstration et gestion des fonctionnalités d'intelligence artificielle

import React, { useState, useEffect } from 'react';
import { 
    Brain, 
    Settings, 
    Download, 
    Upload, 
    Play, 
    Pause,
    RefreshCw,
    CheckCircle,
    AlertTriangle,
    Info,
    Zap,
    BarChart3,
    Target,
    Shield,
    TrendingUp,
    Eye
} from 'lucide-react';
import {
    AIPredictionEngine,
    PredictionDashboard,
    RecommendationsPanel,
    AnomalyAlert,
    TrendAnalysis,
    ResourceOptimization,
    aiService,
    initializeAI,
    getAIStatistics,
    cleanupAIData,
    checkAICompatibility
} from '../components/ai';

const AIAssistant = () => {
    // États de la page
    const [activeTab, setActiveTab] = useState('overview');
    const [aiStatus, setAiStatus] = useState({
        initialized: false,
        loading: false,
        error: null,
        stats: {}
    });
    const [activeComponents, setActiveComponents] = useState([]);
    const [settings, setSettings] = useState({
        autoRefresh: true,
        refreshInterval: 300000,
        confidenceThreshold: 0.7,
        alertSensitivity: 'medium',
        autoOptimization: true,
        trainingEnabled: true
    });
    const [showSettings, setShowSettings] = useState(false);

    // 🚀 Initialiser l'IA
    const initializeAI = async () => {
        setAiStatus(prev => ({ ...prev, loading: true, error: null }));
        
        try {
            const result = await initializeAI(settings);
            const stats = getAIStatistics();
            
            setAiStatus({
                initialized: true,
                loading: false,
                error: null,
                stats,
                lastInit: new Date().toISOString()
            });
            
            console.log('✅ IA initialisée avec succès:', result);
            
        } catch (error) {
            console.error('❌ Erreur d\'initialisation IA:', error);
            setAiStatus({
                initialized: false,
                loading: false,
                error: error.message,
                stats: {}
            });
        }
    };

    // 🧹 Nettoyer les données IA
    const cleanupData = async () => {
        try {
            const result = cleanupAIData();
            console.log('🧹 Nettoyage effectué:', result);
            
            // Recharger les statistiques
            const stats = getAIStatistics();
            setAiStatus(prev => ({ ...prev, stats }));
            
        } catch (error) {
            console.error('❌ Erreur lors du nettoyage:', error);
        }
    };

    // 📊 Vérifier la compatibilité
    const verifyCompatibility = () => {
        const compatibility = checkAICompatibility();
        return compatibility;
    };

    // ⚙️ Charger les paramètres
    const loadSettings = () => {
        const saved = localStorage.getItem('docucortex_ai_settings');
        if (saved) {
            setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
        }
    };

    // 💾 Sauvegarder les paramètres
    const saveSettings = (newSettings) => {
        setSettings(newSettings);
        localStorage.setItem('docucortex_ai_settings', JSON.stringify(newSettings));
        
        // Réinitialiser l'IA si nécessaire
        if (aiStatus.initialized) {
            initializeAI();
        }
    };

    // 📋 Gérer l'activation des composants
    const toggleComponent = (componentName) => {
        setActiveComponents(prev => 
            prev.includes(componentName)
                ? prev.filter(name => name !== componentName)
                : [...prev, componentName]
        );
    };

    // 🚀 Chargement initial
    useEffect(() => {
        loadSettings();
        
        // Vérifier la compatibilité
        const compatibility = verifyCompatibility();
        if (!compatibility.compatible) {
            console.warn('⚠️ Compatibilité IA limitée:', compatibility.checks);
        }
        
        // Initialiser automatiquement si activé
        if (settings.trainingEnabled) {
            initializeAI();
        }
    }, []);

    // Composants IA disponibles
    const availableComponents = [
        {
            name: 'Moteur IA Prédictif',
            component: AIPredictionEngine,
            icon: Brain,
            description: 'Prédictions et analyses intelligentes',
            color: 'purple'
        },
        {
            name: 'Tableau de Bord IA',
            component: PredictionDashboard,
            icon: BarChart3,
            description: 'Métriques en temps réel',
            color: 'blue'
        },
        {
            name: 'Panneau Recommandations',
            component: RecommendationsPanel,
            icon: Target,
            description: 'Suggestions personnalisées',
            color: 'amber'
        },
        {
            name: 'Système d\'Alertes',
            component: AnomalyAlert,
            icon: Shield,
            description: 'Détection d\'anomalies',
            color: 'red'
        },
        {
            name: 'Analyse de Tendances',
            component: TrendAnalysis,
            icon: TrendingUp,
            description: 'Visualisation des tendances',
            color: 'green'
        },
        {
            name: 'Optimisation Ressources',
            component: ResourceOptimization,
            icon: Zap,
            description: 'Optimisation automatique',
            color: 'yellow'
        }
    ];

    // Statuts du système
    const getSystemStatus = () => {
        if (aiStatus.error) return { status: 'error', icon: AlertTriangle, color: 'red' };
        if (aiStatus.loading) return { status: 'loading', icon: RefreshCw, color: 'yellow' };
        if (aiStatus.initialized) return { status: 'ready', icon: CheckCircle, color: 'green' };
        return { status: 'inactive', icon: Pause, color: 'gray' };
    };

    const systemStatus = getSystemStatus();
    const StatusIcon = systemStatus.icon;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* En-tête */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Brain className="w-8 h-8 text-purple-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Assistant IA DocuCortex
                                </h1>
                                <p className="text-sm text-gray-600">
                                    Intelligence artificielle pour la gestion intelligente des prêts
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            {/* Statut du système */}
                            <div className="flex items-center gap-2">
                                <StatusIcon className={`w-5 h-5 text-${systemStatus.color}-600 ${systemStatus.status === 'loading' ? 'animate-spin' : ''}`} />
                                <span className={`text-sm font-medium text-${systemStatus.color}-600`}>
                                    {systemStatus.status === 'ready' ? 'Système prêt' :
                                     systemStatus.status === 'loading' ? 'Initialisation...' :
                                     systemStatus.status === 'error' ? 'Erreur système' :
                                     'Système inactif'}
                                </span>
                            </div>
                            
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
                            >
                                <Settings className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Onglets de navigation */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-8">
                        {[
                            { id: 'overview', label: 'Vue d\'ensemble', icon: Eye },
                            { id: 'components', label: 'Composants IA', icon: Brain },
                            { id: 'predictions', label: 'Prédictions', icon: TrendingUp },
                            { id: 'recommendations', label: 'Recommandations', icon: Target },
                            { id: 'anomalies', label: 'Anomalies', icon: Shield },
                            { id: 'optimization', label: 'Optimisation', icon: Zap }
                        ].map(tab => {
                            const IconComponent = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === tab.id
                                            ? 'border-purple-500 text-purple-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <IconComponent className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Contenu principal */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Vue d'ensemble */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Contrôles rapides */}
                        <div className="bg-white rounded-lg border p-6">
                            <h3 className="text-lg font-semibold mb-4">Contrôles Rapides</h3>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={initializeAI}
                                    disabled={aiStatus.loading}
                                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Play className="w-4 h-4" />
                                    Initialiser l'IA
                                </button>
                                
                                <button
                                    onClick={cleanupData}
                                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Nettoyer Données
                                </button>
                                
                                <button
                                    onClick={() => aiService.trainModels()}
                                    disabled={!aiStatus.initialized}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Brain className="w-4 h-4" />
                                    Entraîner Modèles
                                </button>
                                
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="autoRefresh"
                                        checked={settings.autoRefresh}
                                        onChange={(e) => saveSettings({ ...settings, autoRefresh: e.target.checked })}
                                        className="rounded"
                                    />
                                    <label htmlFor="autoRefresh" className="text-sm">Actualisation auto</label>
                                </div>
                            </div>
                        </div>

                        {/* Statistiques */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'Composants Actifs', value: activeComponents.length, color: 'blue' },
                                { label: 'Prédictions', value: aiStatus.stats.totalPredictions || 0, color: 'green' },
                                { label: 'Recommandations', value: aiStatus.stats.totalRecommendations || 0, color: 'amber' },
                                { label: 'Anomalies', value: aiStatus.stats.anomaliesDetected || 0, color: 'red' }
                            ].map((stat, index) => (
                                <div key={index} className={`p-4 bg-${stat.color}-50 rounded-lg border border-${stat.color}-200`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">{stat.label}</p>
                                            <p className={`text-2xl font-bold text-${stat.color}-900`}>{stat.value}</p>
                                        </div>
                                        <div className={`w-8 h-8 bg-${stat.color}-200 rounded-full flex items-center justify-center`}>
                                            <span className={`text-${stat.color}-600 font-semibold text-sm`}>{stat.value}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Composants actifs */}
                        <div className="bg-white rounded-lg border">
                            <div className="p-6 border-b">
                                <h3 className="text-lg font-semibold">Composants IA Actifs</h3>
                            </div>
                            <div className="p-6">
                                {activeComponents.length > 0 ? (
                                    <div className="grid gap-4">
                                        {activeComponents.map((componentName, index) => {
                                            const component = availableComponents.find(c => c.name === componentName);
                                            if (!component) return null;
                                            
                                            const IconComponent = component.icon;
                                            return (
                                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <IconComponent className={`w-5 h-5 text-${component.color}-600`} />
                                                        <span className="font-medium">{component.name}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => toggleComponent(componentName)}
                                                        className="text-sm text-red-600 hover:text-red-800"
                                                    >
                                                        Désactiver
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>Aucun composant IA actif</p>
                                        <p className="text-sm">Activez les composants dans l'onglet "Composants IA"</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Composants IA */}
                {activeTab === 'components' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg border p-6">
                            <h3 className="text-lg font-semibold mb-4">Composants Disponibles</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {availableComponents.map((comp, index) => {
                                    const IconComponent = comp.icon;
                                    const isActive = activeComponents.includes(comp.name);
                                    
                                    return (
                                        <div key={index} className={`p-4 rounded-lg border transition-all ${
                                            isActive 
                                                ? `border-${comp.color}-200 bg-${comp.color}-50` 
                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                        }`}>
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <IconComponent className={`w-6 h-6 text-${comp.color}-600`} />
                                                    <h4 className="font-semibold">{comp.name}</h4>
                                                </div>
                                                {isActive && (
                                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 mb-4">{comp.description}</p>
                                            <button
                                                onClick={() => toggleComponent(comp.name)}
                                                className={`w-full px-4 py-2 rounded text-sm font-medium transition-colors ${
                                                    isActive
                                                        ? 'bg-red-600 text-white hover:bg-red-700'
                                                        : `bg-${comp.color}-600 text-white hover:bg-${comp.color}-700`
                                                }`}
                                            >
                                                {isActive ? 'Désactiver' : 'Activer'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Prédictions */}
                {activeTab === 'predictions' && (
                    <div className="space-y-6">
                        <PredictionDashboard />
                        {activeComponents.includes('Moteur IA Prédictif') && (
                            <AIPredictionEngine 
                                userId="demo-user"
                                refreshInterval={settings.refreshInterval}
                                autoRefresh={settings.autoRefresh}
                            />
                        )}
                    </div>
                )}

                {/* Recommandations */}
                {activeTab === 'recommendations' && (
                    <div className="space-y-6">
                        {activeComponents.includes('Panneau Recommandations') && (
                            <RecommendationsPanel 
                                userId="demo-user"
                                maxRecommendations={15}
                            />
                        )}
                    </div>
                )}

                {/* Anomalies */}
                {activeTab === 'anomalies' && (
                    <div className="space-y-6">
                        {activeComponents.includes('Système d\'Alertes') && (
                            <AnomalyAlert 
                                autoRefresh={settings.autoRefresh}
                                refreshInterval={settings.refreshInterval}
                            />
                        )}
                    </div>
                )}

                {/* Optimisation */}
                {activeTab === 'optimization' && (
                    <div className="space-y-6">
                        {activeComponents.includes('Optimisation Ressources') && (
                            <ResourceOptimization 
                                autoOptimize={settings.autoOptimization}
                                monitoringEnabled={true}
                            />
                        )}
                    </div>
                )}
            </div>

            {/* Modal de paramètres */}
            {showSettings && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold mb-4">Paramètres IA</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Seuil de confiance
                                </label>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="1"
                                    step="0.1"
                                    value={settings.confidenceThreshold}
                                    onChange={(e) => saveSettings({ ...settings, confidenceThreshold: parseFloat(e.target.value) })}
                                    className="w-full"
                                />
                                <div className="text-xs text-gray-600 mt-1">
                                    {Math.round(settings.confidenceThreshold * 100)}%
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Sensibilité des alertes
                                </label>
                                <select
                                    value={settings.alertSensitivity}
                                    onChange={(e) => saveSettings({ ...settings, alertSensitivity: e.target.value })}
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="low">Faible</option>
                                    <option value="medium">Moyenne</option>
                                    <option value="high">Élevée</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Intervalle d'actualisation (secondes)
                                </label>
                                <input
                                    type="number"
                                    min="30"
                                    max="3600"
                                    step="30"
                                    value={settings.refreshInterval / 1000}
                                    onChange={(e) => saveSettings({ ...settings, refreshInterval: parseInt(e.target.value) * 1000 })}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">
                                    Actualisation automatique
                                </label>
                                <input
                                    type="checkbox"
                                    checked={settings.autoRefresh}
                                    onChange={(e) => saveSettings({ ...settings, autoRefresh: e.target.checked })}
                                    className="rounded"
                                />
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">
                                    Optimisation automatique
                                </label>
                                <input
                                    type="checkbox"
                                    checked={settings.autoOptimization}
                                    onChange={(e) => saveSettings({ ...settings, autoOptimization: e.target.checked })}
                                    className="rounded"
                                />
                            </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowSettings(false)}
                                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => setShowSettings(false)}
                                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                            >
                                Sauvegarder
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIAssistant;