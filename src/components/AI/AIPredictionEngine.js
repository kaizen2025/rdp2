// src/components/ai/AIPredictionEngine.js - MOTEUR IA PRÉDICTIF DOCUCORTEX
// Composant principal pour les prédictions et analyses intelligentes

import React, { useState, useEffect, useCallback } from 'react';
import { 
    Brain, 
    TrendingUp, 
    AlertTriangle, 
    Target, 
    RefreshCw, 
    Settings,
    BarChart3,
    Users,
    Clock,
    Zap,
    Eye,
    CheckCircle,
    XCircle,
    Info
} from 'lucide-react';
import aiService, { 
    PREDICTION_TYPES, 
    ANOMALY_TYPES, 
    RECOMMENDATION_TYPES 
} from '../../services/aiService';
import apiService from '../../services/apiService';

const AIPredictionEngine = ({ 
    userId = null, 
    refreshInterval = 300000, // 5 minutes
    autoRefresh = true 
}) => {
    // États du composant
    const [predictions, setPredictions] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [anomalies, setAnomalies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [training, setTraining] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [stats, setStats] = useState({});
    const [selectedTimeframe, setSelectedTimeframe] = useState(30); // jours
    const [activeTab, setActiveTab] = useState('predictions');

    // 🚀 Charger les données IA
    const loadAIData = useCallback(async () => {
        if (loading) return;
        
        setLoading(true);
        setError(null);
        
        try {
            console.log('🧠 Chargement des données IA...');
            
            // Charger les prédictions
            const [demandPrediction, delayPrediction] = await Promise.all([
                aiService.predictEquipmentDemand(null, selectedTimeframe),
                aiService.predictReturnDelays(userId, 14)
            ]);
            
            // Charger les recommandations
            const recs = await aiService.generatePersonalizedRecommendations(userId);
            
            // Charger les anomalies
            const detectedAnomalies = await aiService.detectAnomalies();
            
            // Charger les statistiques
            const aiStats = aiService.getAIStatistics();
            
            setPredictions([
                ...(demandPrediction?.predictions || []),
                ...(delayPrediction?.predictions || [])
            ]);
            
            setRecommendations(recs);
            setAnomalies(detectedAnomalies);
            setStats({
                ...aiStats,
                demandPrediction: demandPrediction,
                delayPrediction: delayPrediction
            });
            
            setLastUpdate(new Date());
            console.log(`✅ Données IA chargées: ${predictions.length} prédictions, ${recs.length} recommandations`);
            
        } catch (err) {
            console.error('❌ Erreur lors du chargement des données IA:', err);
            setError('Erreur lors du chargement des données IA');
        } finally {
            setLoading(false);
        }
    }, [userId, selectedTimeframe, loading]);

    // 🎓 Entraîner les modèles
    const trainModels = async () => {
        if (training) return;
        
        setTraining(true);
        try {
            console.log('🎓 Entraînement des modèles IA...');
            await aiService.trainModels();
            
            // Recharger les données après l'entraînement
            setTimeout(() => {
                loadAIData();
            }, 2000);
            
        } catch (err) {
            console.error('❌ Erreur lors de l\'entraînement:', err);
            setError('Erreur lors de l\'entraînement des modèles');
        } finally {
            setTraining(false);
        }
    };

    // 📊 Rafraîchissement automatique
    useEffect(() => {
        loadAIData();
        
        if (autoRefresh) {
            const interval = setInterval(loadAIData, refreshInterval);
            return () => clearInterval(interval);
        }
    }, [loadAIData, autoRefresh, refreshInterval]);

    // 🎯 Formatage des prédictions
    const formatPrediction = (prediction) => {
        if (prediction.documentId) {
            return {
                title: `Demande prédite pour document ${prediction.documentId}`,
                type: 'Équipement',
                value: `${prediction.predictedLoans} prêts prédits`,
                confidence: `${Math.round(prediction.confidence * 100)}%`,
                date: prediction.predictedDate,
                severity: prediction.confidence > 0.7 ? 'high' : 'medium'
            };
        } else {
            return {
                title: `Risque de retard pour prêt ${prediction.loanId}`,
                type: 'Retard',
                value: `${Math.round(prediction.probability * 100)}%`,
                confidence: 'Auto-calculé',
                date: prediction.generatedAt,
                severity: prediction.probability > 0.7 ? 'high' : 'medium'
            };
        }
    };

    // 📋 Formatage des recommandations
    const formatRecommendation = (recommendation) => {
        return {
            title: recommendation.title,
            type: recommendation.type,
            description: recommendation.description,
            priority: recommendation.priority,
            confidence: `${Math.round((recommendation.confidence || 0.5) * 100)}%`,
            actions: recommendation.actions || [],
            impact: recommendation.impact || 'unknown'
        };
    };

    // ⚠️ Formatage des anomalies
    const formatAnomaly = (anomaly) => {
        const severityColors = {
            low: 'text-blue-600 bg-blue-50',
            medium: 'text-yellow-600 bg-yellow-50',
            high: 'text-red-600 bg-red-50'
        };
        
        return {
            title: `Anomalie: ${anomaly.type.replace(/_/g, ' ')}`,
            type: anomaly.type,
            description: anomaly.description,
            severity: anomaly.severity,
            color: severityColors[anomaly.severity] || severityColors.medium,
            detectedAt: anomaly.detectedAt,
            evidence: anomaly.evidence || 'Analyse automatique'
        };
    };

    // 📈 Composant de prédiction
    const PredictionCard = ({ prediction }) => {
        const formatted = formatPrediction(prediction);
        
        const severityConfig = {
            high: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
            medium: { icon: Info, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            low: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' }
        };
        
        const config = severityConfig[formatted.severity] || severityConfig.medium;
        const IconComponent = config.icon;
        
        return (
            <div className={`p-4 rounded-lg border-l-4 ${config.bg} ${config.color}`}>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <IconComponent className="w-4 h-4" />
                            <h4 className="font-semibold text-sm">{formatted.title}</h4>
                        </div>
                        <p className="text-xs opacity-80 mb-1">{formatted.type}</p>
                        <p className="text-sm font-medium">{formatted.value}</p>
                        <p className="text-xs opacity-60 mt-1">Confiance: {formatted.confidence}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs opacity-60">
                            {new Date(formatted.date).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    // 💡 Composant de recommandation
    const RecommendationCard = ({ recommendation }) => {
        const formatted = formatRecommendation(recommendation);
        
        const priorityConfig = {
            high: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
            medium: { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
            low: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' }
        };
        
        const config = priorityConfig[formatted.priority] || priorityConfig.medium;
        
        return (
            <div className={`p-4 rounded-lg border ${config.border} ${config.bg}`}>
                <div className="flex items-start gap-3">
                    <Target className={`w-5 h-5 mt-0.5 ${config.color}`} />
                    <div className="flex-1">
                        <h4 className="font-semibold text-sm mb-1">{formatted.title}</h4>
                        <p className="text-xs opacity-80 mb-2">{formatted.description}</p>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${config.color} bg-white`}>
                                {formatted.priority}
                            </span>
                            <span className="text-xs opacity-60">
                                Confiance: {formatted.confidence}
                            </span>
                        </div>
                        {formatted.actions.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                                {formatted.actions.map((action, index) => (
                                    <button 
                                        key={index}
                                        className="text-xs px-2 py-1 bg-white rounded border hover:bg-gray-50"
                                        onClick={() => console.log(`Action: ${action}`)}
                                    >
                                        {action}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // ⚠️ Composant d'anomalie
    const AnomalyCard = ({ anomaly }) => {
        const formatted = formatAnomaly(anomaly);
        
        return (
            <div className={`p-4 rounded-lg border-l-4 ${formatted.color} border-l-red-500`}>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <h4 className="font-semibold text-sm">{formatted.title}</h4>
                        </div>
                        <p className="text-xs opacity-80 mb-1">{formatted.description}</p>
                        <p className="text-xs opacity-60">Événidence: {formatted.evidence}</p>
                    </div>
                    <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded-full ${formatted.color}`}>
                            {formatted.severity}
                        </span>
                        <p className="text-xs opacity-60 mt-1">
                            {new Date(formatted.detectedAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border">
            {/* En-tête */}
            <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Brain className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                Moteur IA Prédictif
                            </h2>
                            <p className="text-sm text-gray-600">
                                Analyses intelligentes et prédictions pour DocuCortex
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <select 
                            value={selectedTimeframe}
                            onChange={(e) => setSelectedTimeframe(parseInt(e.target.value))}
                            className="text-sm border rounded px-2 py-1"
                        >
                            <option value={7}>7 jours</option>
                            <option value={14}>14 jours</option>
                            <option value={30}>30 jours</option>
                            <option value={90}>90 jours</option>
                        </select>
                        
                        <button
                            onClick={trainModels}
                            disabled={training}
                            className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
                        >
                            <RefreshCw className={`w-4 h-4 ${training ? 'animate-spin' : ''}`} />
                            {training ? 'Entraînement...' : 'Entraîner'}
                        </button>
                        
                        <button
                            onClick={loadAIData}
                            disabled={loading}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Actualiser
                        </button>
                    </div>
                </div>
                
                {/* Statistiques rapides */}
                <div className="grid grid-cols-4 gap-4 mt-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                        <p className="text-sm font-semibold text-blue-900">{predictions.length}</p>
                        <p className="text-xs text-blue-700">Prédictions</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                        <Target className="w-6 h-6 text-green-600 mx-auto mb-1" />
                        <p className="text-sm font-semibold text-green-900">{recommendations.length}</p>
                        <p className="text-xs text-green-700">Recommandations</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                        <AlertTriangle className="w-6 h-6 text-red-600 mx-auto mb-1" />
                        <p className="text-sm font-semibold text-red-900">{anomalies.length}</p>
                        <p className="text-xs text-red-700">Anomalies</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <Zap className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                        <p className="text-sm font-semibold text-purple-900">{stats.modelsLoaded || 0}</p>
                        <p className="text-xs text-purple-700">Modèles</p>
                    </div>
                </div>
                
                {lastUpdate && (
                    <p className="text-xs text-gray-500 mt-2">
                        Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
                    </p>
                )}
            </div>

            {/* Onglets */}
            <div className="border-b">
                <nav className="flex">
                    {[
                        { id: 'predictions', label: 'Prédictions', icon: TrendingUp },
                        { id: 'recommendations', label: 'Recommandations', icon: Target },
                        { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle },
                        { id: 'analytics', label: 'Analytics', icon: BarChart3 }
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

            {/* Contenu des onglets */}
            <div className="p-6">
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                )}

                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
                        <p className="ml-2 text-gray-600">Chargement des données IA...</p>
                    </div>
                )}

                {!loading && activeTab === 'predictions' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Prédictions Intelligentes
                        </h3>
                        {predictions.length > 0 ? (
                            <div className="grid gap-4">
                                {predictions.map((prediction, index) => (
                                    <PredictionCard key={index} prediction={prediction} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Aucune prédiction disponible</p>
                                <p className="text-sm">Les prédictions apparaîtront après l'entraînement des modèles</p>
                            </div>
                        )}
                    </div>
                )}

                {!loading && activeTab === 'recommendations' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Target className="w-5 h-5" />
                            Recommandations Personnalisées
                        </h3>
                        {recommendations.length > 0 ? (
                            <div className="grid gap-4">
                                {recommendations.map((recommendation, index) => (
                                    <RecommendationCard key={index} recommendation={recommendation} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Aucune recommandation disponible</p>
                                <p className="text-sm">Les recommandations seront générées automatiquement</p>
                            </div>
                        )}
                    </div>
                )}

                {!loading && activeTab === 'anomalies' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Détection d'Anomalies
                        </h3>
                        {anomalies.length > 0 ? (
                            <div className="grid gap-4">
                                {anomalies.map((anomaly, index) => (
                                    <AnomalyCard key={index} anomaly={anomaly} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Aucune anomalie détectée</p>
                                <p className="text-sm">Le système fonctionne normalement</p>
                            </div>
                        )}
                    </div>
                )}

                {!loading && activeTab === 'analytics' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <BarChart3 className="w-5 h-5" />
                            Analytics IA
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-6">
                            {/* Statistiques des modèles */}
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <Brain className="w-4 h-4" />
                                    État des Modèles
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Modèles chargés:</span>
                                        <span className="font-medium">{stats.modelsLoaded || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>En entraînement:</span>
                                        <span className={`font-medium ${training ? 'text-yellow-600' : 'text-green-600'}`}>
                                            {training ? 'Oui' : 'Non'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Dernière mise à jour:</span>
                                        <span className="font-medium">
                                            {stats.lastTraining ? 
                                                new Date(stats.lastTraining).toLocaleDateString() : 
                                                'Jamais'
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Statistiques des prédictions */}
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    Prédictions
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Prédictions actuelles:</span>
                                        <span className="font-medium">{predictions.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Recommandations actives:</span>
                                        <span className="font-medium">{recommendations.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Anomalies détectées:</span>
                                        <span className={`font-medium ${anomalies.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {anomalies.length}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Actions rapides */}
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <Zap className="w-4 h-4" />
                                Actions Rapides
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                <button 
                                    onClick={loadAIData}
                                    className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Actualiser
                                </button>
                                <button 
                                    onClick={trainModels}
                                    disabled={training}
                                    className="px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
                                >
                                    <Brain className="w-4 h-4" />
                                    Entraîner
                                </button>
                                <button 
                                    onClick={() => aiService.cleanup()}
                                    className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 flex items-center gap-1"
                                >
                                    <Settings className="w-4 h-4" />
                                    Nettoyer
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIPredictionEngine;