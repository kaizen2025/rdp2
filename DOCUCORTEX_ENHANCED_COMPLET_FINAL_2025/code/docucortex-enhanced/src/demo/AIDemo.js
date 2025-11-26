// src/demo/AIDemo.js - DÉMONSTRATION COMPLÈTE DU SYSTÈME IA
// Composant de démonstration pour tester toutes les fonctionnalités IA

import React, { useState, useEffect } from 'react';
import { 
    Brain, 
    Play, 
    Pause, 
    RotateCcw, 
    Download, 
    Upload,
    Settings,
    BarChart3,
    Target,
    Shield,
    TrendingUp,
    Zap,
    CheckCircle,
    AlertTriangle,
    Info,
    RefreshCw,
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

// Données de démonstration
const DEMO_DATA = {
    users: [
        { id: 'user1', name: 'Jean Dupont', role: 'Professeur', loans: 15 },
        { id: 'user2', name: 'Marie Martin', role: 'Étudiante', loans: 8 },
        { id: 'user3', name: 'Pierre Durand', role: 'Chercheur', loans: 23 },
        { id: 'user4', name: 'Sophie Bernard', role: 'Bibliothécaire', loans: 5 }
    ],
    documents: [
        { id: 'doc1', title: 'Intelligence Artificielle', type: 'Livre', category: 'Informatique' },
        { id: 'doc2', title: 'Machine Learning Avancé', type: 'Livre', category: 'Informatique' },
        { id: 'doc3', title: 'Revue de Recherche IA', type: 'Périodique', category: 'Recherche' },
        { id: 'doc4', title: 'Guide React.js', type: 'Livre', category: 'Développement' },
        { id: 'doc5', title: 'Sécurité des Données', type: 'Livre', category: 'Cybersécurité' }
    ]
};

const AIDemo = () => {
    // États de la démonstration
    const [currentStep, setCurrentStep] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [aiStatus, setAiStatus] = useState({ initialized: false, loading: false });
    const [demoResults, setDemoResults] = useState({});
    const [activeTab, setActiveTab] = useState('overview');

    // Étapes de démonstration
    const demoSteps = [
        {
            id: 'initialization',
            title: 'Initialisation du Système IA',
            description: 'Chargement et configuration des modèles d\'intelligence artificielle',
            component: 'aiService',
            duration: 3000
        },
        {
            id: 'predictions',
            title: 'Génération de Prédictions',
            description: 'Analyse des patterns historiques et création de prédictions intelligentes',
            component: 'predictions',
            duration: 2000
        },
        {
            id: 'anomalies',
            title: 'Détection d\'Anomalies',
            description: 'Scan automatique des données pour identifier les comportements suspects',
            component: 'anomalies',
            duration: 2500
        },
        {
            id: 'recommendations',
            title: 'Génération de Recommandations',
            description: 'Création de suggestions personnalisées basées sur l\'historique utilisateur',
            component: 'recommendations',
            duration: 2000
        },
        {
            id: 'optimization',
            title: 'Optimisation des Ressources',
            description: 'Analyse et amélioration automatique de l\'utilisation des ressources',
            component: 'optimization',
            duration: 3000
        },
        {
            id: 'analysis',
            title: 'Analyse de Tendances',
            description: 'Visualisation des données et identification des patterns saisonniers',
            component: 'analysis',
            duration: 2500
        }
    ];

    // Initialiser la démonstration
    const initializeDemo = async () => {
        setAiStatus(prev => ({ ...prev, loading: true }));
        
        try {
            console.log('🚀 Démarrage de la démonstration IA DocuCortex...');
            
            // Initialiser le service IA
            await initializeAI({
                confidenceThreshold: 0.8,
                autoTraining: true,
                alertSensitivity: 'medium'
            });
            
            setAiStatus({ initialized: true, loading: false });
            console.log('✅ Service IA initialisé avec succès');
            
            // Simuler des données de démonstration
            await simulateDemoData();
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            setAiStatus({ initialized: false, loading: false });
        }
    };

    // Simuler des données de démonstration
    const simulateDemoData = async () => {
        console.log('📊 Génération des données de démonstration...');
        
        // Simuler les prédictions
        const predictions = await aiService.predictEquipmentDemand(null, 7);
        console.log('🎯 Prédictions générées:', predictions);
        
        // Simuler la détection d'anomalies
        const anomalies = await aiService.detectAnomalies();
        console.log('⚠️ Anomalies détectées:', anomalies);
        
        // Simuler les recommandations
        const recommendations = await aiService.generatePersonalizedRecommendations('user1');
        console.log('💡 Recommandations générées:', recommendations);
        
        // Simuler l'optimisation
        const optimizations = await aiService.optimizeResourceUtilization();
        console.log('⚡ Optimisations identifiées:', optimizations);
        
        setDemoResults({
            predictions,
            anomalies,
            recommendations,
            optimizations,
            statistics: getAIStatistics()
        });
        
        console.log('✅ Données de démonstration prêtes');
    };

    // Exécuter une étape de démonstration
    const executeStep = async (step) => {
        console.log(`🔄 Exécution de l'étape: ${step.title}`);
        
        switch (step.component) {
            case 'aiService':
                await initializeDemo();
                break;
                
            case 'predictions':
                const predictions = await aiService.predictEquipmentDemand();
                setDemoResults(prev => ({ ...prev, predictions }));
                break;
                
            case 'anomalies':
                const anomalies = await aiService.detectAnomalies();
                setDemoResults(prev => ({ ...prev, anomalies }));
                break;
                
            case 'recommendations':
                const recommendations = await aiService.generatePersonalizedRecommendations();
                setDemoResults(prev => ({ ...prev, recommendations }));
                break;
                
            case 'optimization':
                const optimizations = await aiService.optimizeResourceUtilization();
                setDemoResults(prev => ({ ...prev, optimizations }));
                break;
                
            case 'analysis':
                // Simuler l'analyse de tendances
                const trends = generateDemoTrends();
                setDemoResults(prev => ({ ...prev, trends }));
                break;
        }
        
        console.log(`✅ Étape terminée: ${step.title}`);
    };

    // Générer des tendances de démonstration
    const generateDemoTrends = () => {
        const trends = [];
        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            trends.push({
                date: date.toISOString(),
                loans: Math.floor(Math.random() * 20) + 5,
                users: Math.floor(Math.random() * 15) + 3,
                documents: Math.floor(Math.random() * 30) + 10,
                delays: Math.floor(Math.random() * 5)
            });
        }
        return trends;
    };

    // Lancer la démonstration complète
    const runFullDemo = async () => {
        setIsRunning(true);
        setCurrentStep(0);
        
        try {
            for (let i = 0; i < demoSteps.length; i++) {
                setCurrentStep(i);
                await executeStep(demoSteps[i]);
                
                // Pause entre les étapes
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            console.log('🎉 Démonstration terminée avec succès!');
            
        } catch (error) {
            console.error('❌ Erreur lors de la démonstration:', error);
        } finally {
            setIsRunning(false);
        }
    };

    // Réinitialiser la démonstration
    const resetDemo = () => {
        setCurrentStep(0);
        setIsRunning(false);
        setDemoResults({});
        setAiStatus({ initialized: false, loading: false });
        console.log('🔄 Démonstration réinitialisée');
    };

    // Exporter les résultats
    const exportResults = () => {
        const exportData = {
            timestamp: new Date().toISOString(),
            results: demoResults,
            users: DEMO_DATA.users,
            documents: DEMO_DATA.documents,
            statistics: getAIStatistics()
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `docucortex-ai-demo-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        console.log('📥 Résultats exportés');
    };

    // Composant de progression
    const DemoProgress = () => (
        <div className="p-6 bg-white rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Progression de la Démonstration</h3>
            
            <div className="space-y-3">
                {demoSteps.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isActive = index === currentStep;
                    const isPending = index > currentStep;
                    
                    return (
                        <div 
                            key={step.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                                isCompleted ? 'bg-green-50 border-green-200' :
                                isActive ? 'bg-blue-50 border-blue-200 animate-pulse' :
                                'bg-gray-50 border-gray-200'
                            }`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                isCompleted ? 'bg-green-500 text-white' :
                                isActive ? 'bg-blue-500 text-white' :
                                'bg-gray-300 text-gray-600'
                            }`}>
                                {isCompleted ? (
                                    <CheckCircle className="w-5 h-5" />
                                ) : isActive ? (
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                ) : (
                                    <span className="text-sm font-bold">{index + 1}</span>
                                )}
                            </div>
                            
                            <div className="flex-1">
                                <h4 className={`font-semibold text-sm ${
                                    isCompleted ? 'text-green-800' :
                                    isActive ? 'text-blue-800' :
                                    'text-gray-600'
                                }`}>
                                    {step.title}
                                </h4>
                                <p className="text-xs text-gray-600">{step.description}</p>
                            </div>
                            
                            {isActive && (
                                <div className="text-xs text-blue-600 font-medium">
                                    En cours...
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    // Composant de résultats
    const DemoResults = () => {
        const stats = demoResults.statistics || {};
        
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-700">Prédictions</p>
                            <p className="text-2xl font-bold text-blue-900">
                                {demoResults.predictions?.predictions?.length || 0}
                            </p>
                        </div>
                        <BarChart3 className="w-8 h-8 text-blue-600" />
                    </div>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-red-700">Anomalies</p>
                            <p className="text-2xl font-bold text-red-900">
                                {demoResults.anomalies?.length || 0}
                            </p>
                        </div>
                        <Shield className="w-8 h-8 text-red-600" />
                    </div>
                </div>
                
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-amber-700">Recommandations</p>
                            <p className="text-2xl font-bold text-amber-900">
                                {demoResults.recommendations?.length || 0}
                            </p>
                        </div>
                        <Target className="w-8 h-8 text-amber-600" />
                    </div>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-yellow-700">Optimisations</p>
                            <p className="text-2xl font-bold text-yellow-900">
                                {demoResults.optimizations?.length || 0}
                            </p>
                        </div>
                        <Zap className="w-8 h-8 text-yellow-600" />
                    </div>
                </div>
            </div>
        );
    };

    // Vérifier la compatibilité au montage
    useEffect(() => {
        const compatibility = checkAICompatibility();
        if (!compatibility.compatible) {
            console.warn('⚠️ Limitations de compatibilité détectées:', compatibility.checks);
        }
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* En-tête */}
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <Brain className="w-8 h-8 text-purple-600" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Démonstration IA DocuCortex
                                </h1>
                                <p className="text-gray-600">
                                    Découvrez les capacités d'intelligence artificielle de DocuCortex
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            {!aiStatus.initialized ? (
                                <button
                                    onClick={initializeDemo}
                                    disabled={aiStatus.loading}
                                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {aiStatus.loading ? (
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Play className="w-5 h-5" />
                                    )}
                                    {aiStatus.loading ? 'Initialisation...' : 'Initialiser IA'}
                                </button>
                            ) : (
                                <button
                                    onClick={resetDemo}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Réinitialiser
                                </button>
                            )}
                            
                            {Object.keys(demoResults).length > 0 && (
                                <button
                                    onClick={exportResults}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Exporter
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Contrôles de démonstration */}
                <div className="bg-white rounded-lg border p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Contrôles de Démonstration</h2>
                    
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={runFullDemo}
                            disabled={isRunning || !aiStatus.initialized}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            <Play className="w-5 h-5" />
                            {isRunning ? 'Démonstration en cours...' : 'Démarrer Démonstration Complète'}
                        </button>
                        
                        <button
                            onClick={simulateDemoData}
                            disabled={!aiStatus.initialized}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Simuler Données
                        </button>
                        
                        <button
                            onClick={cleanupAIData}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Nettoyer IA
                        </button>
                    </div>
                </div>

                {/* Statuts et progression */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* État du système IA */}
                    <div className="bg-white rounded-lg border p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            État du Système
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Service IA</span>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                    aiStatus.initialized ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                    {aiStatus.initialized ? 'Actif' : 'Inactif'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Prédictions</span>
                                <span className="text-sm font-medium">
                                    {demoResults.predictions?.predictions?.length || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Recommandations</span>
                                <span className="text-sm font-medium">
                                    {demoResults.recommendations?.length || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Anomalies</span>
                                <span className="text-sm font-medium">
                                    {demoResults.anomalies?.length || 0}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Progression */}
                    <div className="lg:col-span-2">
                        <DemoProgress />
                    </div>
                </div>

                {/* Résultats */}
                {Object.keys(demoResults).length > 0 && (
                    <div className="bg-white rounded-lg border p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4">Résultats de la Démonstration</h2>
                        <DemoResults />
                    </div>
                )}

                {/* Composants IA en action */}
                {aiStatus.initialized && (
                    <div className="space-y-6">
                        {/* Onglets des composants */}
                        <div className="bg-white rounded-lg border">
                            <div className="border-b">
                                <nav className="flex">
                                    {[
                                        { id: 'predictions', label: 'Prédictions', icon: BarChart3 },
                                        { id: 'recommendations', label: 'Recommandations', icon: Target },
                                        { id: 'anomalies', label: 'Anomalies', icon: Shield },
                                        { id: 'trends', label: 'Tendances', icon: TrendingUp },
                                        { id: 'optimization', label: 'Optimisation', icon: Zap }
                                    ].map(tab => {
                                        const IconComponent = tab.icon;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 ${
                                                    activeTab === tab.id 
                                                        ? 'border-purple-600 text-purple-600' 
                                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                                }`}
                                            >
                                                <IconComponent className="w-4 h-4" />
                                                {tab.label}
                                            </button>
                                        );
                                    })}
                                </nav>
                            </div>

                            <div className="p-6">
                                {activeTab === 'predictions' && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4">Prédictions Intelligentes</h3>
                                        {demoResults.predictions?.predictions?.length > 0 ? (
                                            <div className="grid gap-4">
                                                {demoResults.predictions.predictions.slice(0, 3).map((prediction, index) => (
                                                    <div key={index} className="p-4 bg-blue-50 rounded-lg border">
                                                        <h4 className="font-semibold">Prédiction {index + 1}</h4>
                                                        <p className="text-sm">Type: {prediction.type || 'Demande d\'équipement'}</p>
                                                        <p className="text-sm">Confiance: {Math.round((prediction.confidence || 0.7) * 100)}%</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500">Aucune prédiction disponible</p>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'recommendations' && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4">Recommandations</h3>
                                        {demoResults.recommendations?.length > 0 ? (
                                            <div className="grid gap-4">
                                                {demoResults.recommendations.slice(0, 3).map((rec, index) => (
                                                    <div key={index} className="p-4 bg-amber-50 rounded-lg border">
                                                        <h4 className="font-semibold">{rec.title || 'Recommandation'}</h4>
                                                        <p className="text-sm">{rec.description || 'Description automatique'}</p>
                                                        <p className="text-sm">Priorité: {rec.priority || 'moyenne'}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500">Aucune recommandation disponible</p>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'anomalies' && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4">Anomalies Détectées</h3>
                                        {demoResults.anomalies?.length > 0 ? (
                                            <div className="grid gap-4">
                                                {demoResults.anomalies.slice(0, 3).map((anomaly, index) => (
                                                    <div key={index} className="p-4 bg-red-50 rounded-lg border">
                                                        <h4 className="font-semibold">Anomalie {index + 1}</h4>
                                                        <p className="text-sm">Type: {anomaly.type || 'Pattern inhabituel'}</p>
                                                        <p className="text-sm">Sévérité: {anomaly.severity || 'moyenne'}</p>
                                                        <p className="text-sm">{anomaly.description || 'Description automatique'}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500">Aucune anomalie détectée</p>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'trends' && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4">Analyse de Tendances</h3>
                                        {demoResults.trends ? (
                                            <div className="text-center p-8 bg-gray-50 rounded-lg">
                                                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                                <p className="text-gray-600">Données de tendances simulées générées</p>
                                                <p className="text-sm text-gray-500 mt-2">
                                                    {demoResults.trends.length} points de données analysés
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-gray-500">Aucune donnée de tendance disponible</p>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'optimization' && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4">Optimisations</h3>
                                        {demoResults.optimizations?.length > 0 ? (
                                            <div className="grid gap-4">
                                                {demoResults.optimizations.slice(0, 3).map((opt, index) => (
                                                    <div key={index} className="p-4 bg-yellow-50 rounded-lg border">
                                                        <h4 className="font-semibold">Optimisation {index + 1}</h4>
                                                        <p className="text-sm">Type: {opt.type || 'Optimisation ressources'}</p>
                                                        <p className="text-sm">Impact: {opt.impact || 'moyen'}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500">Aucune optimisation disponible</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIDemo;