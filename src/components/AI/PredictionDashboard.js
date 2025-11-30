// src/components/ai/PredictionDashboard.js - TABLEAU DE BORD IA DOCUCORTEX
// Tableau de bord principal pour les métriques et analyses prédictives

import React, { useState, useEffect } from 'react';
import { 
    BarChart3, 
    TrendingUp, 
    TrendingDown, 
    Activity, 
    Brain,
    Eye,
    Target,
    AlertTriangle,
    Zap,
    Clock,
    Users,
    FileText,
    RefreshCw
} from 'lucide-react';
import aiService from '../../services/aiService';

const PredictionDashboard = ({ refreshInterval = 60000 }) => {
    // États du tableau de bord
    const [metrics, setMetrics] = useState({
        totalPredictions: 0,
        accuracy: 0,
        activeAnomalies: 0,
        recommendationsGenerated: 0,
        modelsTrained: 0,
        processingSpeed: 0
    });
    const [charts, setCharts] = useState({
        predictionTrends: [],
        anomalyDistribution: [],
        recommendationTypes: [],
        performanceMetrics: []
    });
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState('7d');
    const [alerts, setAlerts] = useState([]);

    // 📊 Charger les métriques du tableau de bord
    const loadDashboardData = async () => {
        setLoading(true);
        
        try {
            // Simuler des données de métriques (en production, ces données viendront de l'IA)
            const mockMetrics = {
                totalPredictions: Math.floor(Math.random() * 100) + 50,
                accuracy: Math.round((0.85 + Math.random() * 0.1) * 100),
                activeAnomalies: Math.floor(Math.random() * 10),
                recommendationsGenerated: Math.floor(Math.random() * 50) + 20,
                modelsTrained: Math.floor(Math.random() * 5) + 1,
                processingSpeed: Math.round((100 + Math.random() * 200))
            };
            
            // Charger les données de charts
            const mockCharts = {
                predictionTrends: generateTrendData(),
                anomalyDistribution: generateAnomalyData(),
                recommendationTypes: generateRecommendationData(),
                performanceMetrics: generatePerformanceData()
            };
            
            // Générer des alertes basées sur les métriques
            const generatedAlerts = generateAlerts(mockMetrics);
            
            setMetrics(mockMetrics);
            setCharts(mockCharts);
            setAlerts(generatedAlerts);
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement du tableau de bord:', error);
        } finally {
            setLoading(false);
        }
    };

    // Générer des données de tendances factices
    const generateTrendData = () => {
        const days = [];
        const baseValue = 50;
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            days.push({
                date: date.toISOString().split('T')[0],
                predictions: Math.floor(baseValue + Math.random() * 30),
                accuracy: Math.round((0.8 + Math.random() * 0.15) * 100)
            });
        }
        
        return days;
    };

    // Générer des données d'anomalies factices
    const generateAnomalyData = () => [
        { type: 'Comportement inhabitel', count: Math.floor(Math.random() * 5) + 1, color: 'bg-red-500' },
        { type: 'Retards fréquents', count: Math.floor(Math.random() * 3) + 1, color: 'bg-yellow-500' },
        { type: 'Utilisation excessive', count: Math.floor(Math.random() * 2) + 1, color: 'bg-orange-500' },
        { type: 'Anomalies système', count: Math.floor(Math.random() * 1) + 1, color: 'bg-purple-500' }
    ];

    // Générer des données de recommandations factices
    const generateRecommendationData = () => [
        { type: 'Équipements suggérés', count: Math.floor(Math.random() * 15) + 5, color: 'bg-blue-500' },
        { type: 'Maintenance préventive', count: Math.floor(Math.random() * 8) + 3, color: 'bg-green-500' },
        { type: 'Optimisation capacité', count: Math.floor(Math.random() * 5) + 2, color: 'bg-indigo-500' },
        { type: 'Politiques de prêt', count: Math.floor(Math.random() * 3) + 1, color: 'bg-pink-500' }
    ];

    // Générer des données de performance factices
    const generatePerformanceData = () => ({
        cpu: Math.round(30 + Math.random() * 40),
        memory: Math.round(40 + Math.random() * 30),
        accuracy: Math.round(85 + Math.random() * 10),
        throughput: Math.round(100 + Math.random() * 100)
    });

    // Générer des alertes basées sur les métriques
    const generateAlerts = (metrics) => {
        const alerts = [];
        
        if (metrics.activeAnomalies > 5) {
            alerts.push({
                type: 'warning',
                title: 'Nombre d\'anomalies élevé',
                message: `${metrics.activeAnomalies} anomalies actives détectées`,
                icon: AlertTriangle,
                color: 'text-yellow-600 bg-yellow-50'
            });
        }
        
        if (metrics.accuracy < 80) {
            alerts.push({
                type: 'error',
                title: 'Précision en baisse',
                message: `Précision du modèle: ${metrics.accuracy}%`,
                icon: TrendingDown,
                color: 'text-red-600 bg-red-50'
            });
        }
        
        if (metrics.recommendationsGenerated > 40) {
            alerts.push({
                type: 'info',
                title: 'Nouvelles recommandations',
                message: `${metrics.recommendationsGenerated} recommandations générées`,
                icon: Target,
                color: 'text-blue-600 bg-blue-50'
            });
        }
        
        return alerts;
    };

    // 🔄 Rafraîchissement automatique
    useEffect(() => {
        loadDashboardData();
        
        const interval = setInterval(loadDashboardData, refreshInterval);
        return () => clearInterval(interval);
    }, [refreshInterval]);

    // 📈 Composant de métrique
    const MetricCard = ({ title, value, icon: Icon, trend, color = 'blue' }) => {
        const colorClasses = {
            blue: 'bg-blue-50 text-blue-700 border-blue-200',
            green: 'bg-green-50 text-green-700 border-green-200',
            purple: 'bg-purple-50 text-purple-700 border-purple-200',
            yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
            red: 'bg-red-50 text-red-700 border-red-200'
        };
        
        const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Activity;
        
        return (
            <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium opacity-80">{title}</p>
                        <p className="text-2xl font-bold">{value}</p>
                        {trend && (
                            <div className="flex items-center gap-1 mt-1">
                                <TrendIcon className="w-3 h-3" />
                                <span className="text-xs opacity-60">
                                    {trend === 'up' ? '+12%' : trend === 'down' ? '-5%' : 'Stable'}
                                </span>
                            </div>
                        )}
                    </div>
                    <Icon className="w-8 h-8 opacity-60" />
                </div>
            </div>
        );
    };

    // 📊 Composant de graphique de tendance
    const TrendChart = ({ data }) => {
        const maxValue = Math.max(...data.map(d => d.predictions));
        
        return (
            <div className="p-4 bg-white rounded-lg border">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Tendances des Prédictions
                </h4>
                <div className="space-y-2">
                    {data.map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <div className="w-16 text-xs text-gray-600">
                                {new Date(item.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
                            </div>
                            <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                                <div 
                                    className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                                    style={{ width: `${(item.predictions / maxValue) * 100}%` }}
                                >
                                    <span className="text-xs text-white font-medium">
                                        {item.predictions}
                                    </span>
                                </div>
                            </div>
                            <div className="w-12 text-xs text-gray-600">
                                {item.accuracy}%
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // 📊 Composant de distribution d'anomalies
    const AnomalyDistribution = ({ data }) => (
        <div className="p-4 bg-white rounded-lg border">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Distribution des Anomalies
            </h4>
            <div className="space-y-3">
                {data.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center">
                                <span className="text-sm">{item.type}</span>
                                <span className="text-sm font-semibold">{item.count}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                <div 
                                    className={`h-2 rounded-full ${item.color}`}
                                    style={{ width: `${(item.count / Math.max(...data.map(d => d.count))) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // 📊 Composant de types de recommandations
    const RecommendationTypes = ({ data }) => (
        <div className="p-4 bg-white rounded-lg border">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Types de Recommandations
            </h4>
            <div className="grid grid-cols-2 gap-3">
                {data.map((item, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                            <span className="text-xs font-medium">{item.type}</span>
                        </div>
                        <p className="text-lg font-bold">{item.count}</p>
                    </div>
                ))}
            </div>
        </div>
    );

    // ⚡ Composant de performance
    const PerformanceMetrics = ({ data }) => (
        <div className="p-4 bg-white rounded-lg border">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Métriques de Performance
            </h4>
            <div className="grid grid-cols-2 gap-4">
                {[
                    { label: 'CPU', value: data.cpu, suffix: '%', color: 'blue' },
                    { label: 'Mémoire', value: data.memory, suffix: '%', color: 'green' },
                    { label: 'Précision', value: data.accuracy, suffix: '%', color: 'purple' },
                    { label: 'Débit', value: data.throughput, suffix: ' req/min', color: 'yellow' }
                ].map((metric, index) => (
                    <div key={index} className="text-center">
                        <p className="text-xs text-gray-600 mb-1">{metric.label}</p>
                        <div className={`w-16 h-16 rounded-full border-4 border-${metric.color}-200 flex items-center justify-center mx-auto mb-2`}>
                            <span className="text-sm font-bold">{metric.value}</span>
                        </div>
                        <p className="text-xs text-gray-500">{metric.suffix}</p>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* En-tête du tableau de bord */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <BarChart3 className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Tableau de Bord IA
                        </h2>
                        <p className="text-sm text-gray-600">
                            Métriques et analyses prédictives en temps réel
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <select 
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="text-sm border rounded px-3 py-2"
                    >
                        <option value="1d">Dernière journée</option>
                        <option value="7d">7 derniers jours</option>
                        <option value="30d">30 derniers jours</option>
                        <option value="90d">90 derniers jours</option>
                    </select>
                    
                    <button
                        onClick={loadDashboardData}
                        disabled={loading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Actualiser
                    </button>
                </div>
            </div>

            {/* Alertes prioritaires */}
            {alerts.length > 0 && (
                <div className="space-y-2">
                    {alerts.map((alert, index) => {
                        const IconComponent = alert.icon;
                        return (
                            <div key={index} className={`p-4 rounded-lg border ${alert.color}`}>
                                <div className="flex items-center gap-3">
                                    <IconComponent className="w-5 h-5" />
                                    <div>
                                        <p className="font-semibold text-sm">{alert.title}</p>
                                        <p className="text-xs opacity-80">{alert.message}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Métriques principales */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <MetricCard
                    title="Prédictions Totales"
                    value={metrics.totalPredictions}
                    icon={Eye}
                    trend="up"
                    color="blue"
                />
                <MetricCard
                    title="Précision Moyenne"
                    value={`${metrics.accuracy}%`}
                    icon={Target}
                    trend="up"
                    color="green"
                />
                <MetricCard
                    title="Anomalies Actives"
                    value={metrics.activeAnomalies}
                    icon={AlertTriangle}
                    color={metrics.activeAnomalies > 5 ? "red" : "yellow"}
                />
                <MetricCard
                    title="Recommandations"
                    value={metrics.recommendationsGenerated}
                    icon={Brain}
                    trend="up"
                    color="purple"
                />
                <MetricCard
                    title="Modèles Entraînés"
                    value={metrics.modelsTrained}
                    icon={Zap}
                    color="indigo"
                />
                <MetricCard
                    title="Vitesse (req/min)"
                    value={metrics.processingSpeed}
                    icon={Activity}
                    color="cyan"
                />
            </div>

            {/* Graphiques et analyses */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TrendChart data={charts.predictionTrends} />
                <PerformanceMetrics data={charts.performanceMetrics} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnomalyDistribution data={charts.anomalyDistribution} />
                <RecommendationTypes data={charts.recommendationTypes} />
            </div>

            {/* Informations système */}
            <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    État du Système IA
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                        <p className="text-gray-600">Dernière mise à jour</p>
                        <p className="font-medium">{new Date().toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-gray-600">Version du modèle</p>
                        <p className="font-medium">v2.1.0</p>
                    </div>
                    <div>
                        <p className="text-gray-600">Status</p>
                        <span className="inline-flex items-center gap-1 text-green-600">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Actif
                        </span>
                    </div>
                    <div>
                        <p className="text-gray-600">Prochaine maintenance</p>
                        <p className="font-medium">Dans 5 jours</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PredictionDashboard;