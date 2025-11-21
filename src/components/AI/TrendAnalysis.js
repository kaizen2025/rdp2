// src/components/ai/TrendAnalysis.js - ANALYSE DE TENDANCES IA
// Composant pour analyser et visualiser les tendances des données DocuCortex

import React, { useState, useEffect } from 'react';
import { 
    TrendingUp, 
    TrendingDown, 
    BarChart3, 
    PieChart, 
    Calendar,
    Filter,
    RefreshCw,
    Download,
    Eye,
    Target,
    Clock,
    Users,
    FileText,
    Activity
} from 'lucide-react';
import aiService from '../../services/aiService';

const TrendAnalysis = ({ 
    timeframe = '30d',
    metrics = ['loans', 'users', 'documents', 'delays'],
    autoRefresh = true 
}) => {
    // États de l'analyse
    const [trends, setTrends] = useState([]);
    const [seasonalData, setSeasonalData] = useState({});
    const [userBehavior, setUserBehavior] = useState({});
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMetric, setSelectedMetric] = useState('all');
    const [selectedPeriod, setSelectedPeriod] = useState(timeframe);
    const [analysisData, setAnalysisData] = useState({
        overview: {},
        patterns: {},
        insights: [],
        forecast: []
    });

    // 📊 Charger les données d'analyse
    const loadTrendAnalysis = async () => {
        setLoading(true);
        
        try {
            // Simuler des données de tendances (en production, ces données viendront de l'IA)
            const trendData = generateTrendData(selectedPeriod);
            const seasonalAnalysis = generateSeasonalAnalysis();
            const behaviorAnalysis = generateBehaviorAnalysis();
            const forecastData = generateForecastData();
            
            setTrends(trendData);
            setSeasonalData(seasonalAnalysis);
            setUserBehavior(behaviorAnalysis);
            setPredictions(forecastData);
            
            // Analyser les patterns
            const analysis = analyzePatterns(trendData, seasonalAnalysis);
            setAnalysisData(analysis);
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement de l\'analyse:', error);
        } finally {
            setLoading(false);
        }
    };

    // 📈 Générer des données de tendances simulées
    const generateTrendData = (period) => {
        const days = parseInt(period.replace('d', ''));
        const data = [];
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            const baseLoans = 15;
            const baseUsers = 8;
            const baseDocuments = 25;
            const baseDelays = 3;
            
            // Ajouter des variations saisonnières et aléatoires
            const seasonalFactor = 1 + 0.3 * Math.sin((i / days) * 2 * Math.PI);
            const randomFactor = 0.8 + Math.random() * 0.4;
            
            data.push({
                date: date.toISOString().split('T')[0],
                loans: Math.floor(baseLoans * seasonalFactor * randomFactor),
                users: Math.floor(baseUsers * seasonalFactor * randomFactor),
                documents: Math.floor(baseDocuments * seasonalFactor * randomFactor),
                delays: Math.floor(baseDelays * randomFactor),
                returns: Math.floor((baseLoans * 0.9) * randomFactor),
                newUsers: Math.floor((baseUsers * 0.2) * randomFactor),
                avgLoanDuration: Math.floor(5 + Math.random() * 10),
                satisfaction: Math.round(3.5 + Math.random() * 1.5 * 10) / 10
            });
        }
        
        return data;
    };

    // 🌱 Générer l'analyse saisonnière
    const generateSeasonalAnalysis = () => {
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 
                       'Jul', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        
        const monthlyLoans = [420, 380, 450, 480, 520, 380, 320, 340, 460, 580, 620, 480];
        const seasonalPatterns = [
            { month: 'Février', pattern: 'Baisse post-fêtes', impact: -15 },
            { month: 'Mai', pattern: 'Pic de fin d\'année scolaire', impact: +20 },
            { month: 'Septembre', pattern: 'Rentrée universitaire', impact: +25 },
            { month: 'Novembre', pattern: 'Préparation examens', impact: +30 }
        ];
        
        return {
            monthlyDistribution: months.map((month, index) => ({
                month,
                loans: monthlyLoans[index],
                users: Math.floor(monthlyLoans[index] * 0.6),
                documents: Math.floor(monthlyLoans[index] * 1.5)
            })),
            patterns: seasonalPatterns,
            peakSeasons: ['Automne', 'Printemps'],
            lowSeasons: ['Été', 'Début hiver']
        };
    };

    // 👥 Générer l'analyse de comportement
    const generateBehaviorAnalysis = () => {
        return {
            userSegments: [
                { name: 'Utilisateurs fréquents', count: 145, percentage: 35, avgLoans: 12 },
                { name: 'Utilisateurs occasionnels', count: 189, percentage: 45, avgLoans: 4 },
                { name: 'Nouveaux utilisateurs', count: 66, percentage: 20, avgLoans: 2 }
            ],
            borrowingPatterns: {
                peakHours: [9, 10, 14, 15, 16],
                preferredDays: ['Mardi', 'Mercredi', 'Jeudi'],
                loanDuration: { short: 40, medium: 45, long: 15 },
                returnBehavior: { onTime: 75, slightlyLate: 18, veryLate: 7 }
            },
            documentCategories: [
                { name: 'Livres académiques', percentage: 45, trend: 'up' },
                { name: 'Périodiques', percentage: 25, trend: 'stable' },
                { name: 'Documents de recherche', percentage: 20, trend: 'up' },
                { name: 'Multimédia', percentage: 10, trend: 'down' }
            ]
        };
    };

    // 🔮 Générer des prédictions
    const generateForecastData = () => {
        const forecast = [];
        
        for (let i = 1; i <= 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            
            const baseValue = 20;
            const trendFactor = 1 + (i * 0.02); // Légère croissance
            const seasonalFactor = 1 + 0.3 * Math.sin((i / 30) * 2 * Math.PI);
            
            forecast.push({
                date: date.toISOString().split('T')[0],
                predictedLoans: Math.floor(baseValue * trendFactor * seasonalFactor),
                confidence: Math.max(0.7, 0.95 - (i * 0.01)), // Confiance décroissante
                range: {
                    low: Math.floor(baseValue * 0.8 * trendFactor),
                    high: Math.floor(baseValue * 1.2 * trendFactor)
                }
            });
        }
        
        return forecast;
    };

    // 🧠 Analyser les patterns
    const analyzePatterns = (trendData, seasonalData) => {
        if (trendData.length === 0) return { overview: {}, patterns: {}, insights: [], forecast: [] };
        
        // Calculer les statistiques de base
        const totalLoans = trendData.reduce((sum, d) => sum + d.loans, 0);
        const totalUsers = trendData.reduce((sum, d) => sum + d.users, 0);
        const avgLoansPerDay = totalLoans / trendData.length;
        const avgUsersPerDay = totalUsers / trendData.length;
        
        // Calculer les tendances
        const firstHalf = trendData.slice(0, Math.floor(trendData.length / 2));
        const secondHalf = trendData.slice(Math.floor(trendData.length / 2));
        
        const firstAvgLoans = firstHalf.reduce((sum, d) => sum + d.loans, 0) / firstHalf.length;
        const secondAvgLoans = secondHalf.reduce((sum, d) => sum + d.loans, 0) / secondHalf.length;
        
        const loanGrowth = ((secondAvgLoans - firstAvgLoans) / firstAvgLoans) * 100;
        
        // Générer des insights
        const insights = [];
        
        if (loanGrowth > 10) {
            insights.push({
                type: 'positive',
                title: 'Croissance forte détectée',
                description: `Les prêts ont augmenté de ${Math.round(loanGrowth)}% sur la période`,
                impact: 'high'
            });
        } else if (loanGrowth < -10) {
            insights.push({
                type: 'warning',
                title: 'Baisse d\'activité',
                description: `Les prêts ont diminué de ${Math.abs(Math.round(loanGrowth))}% sur la période`,
                impact: 'medium'
            });
        }
        
        // Détecter les patterns semaine/weekend
        const weekdayLoans = trendData.filter((_, index) => index % 7 < 5)
            .reduce((sum, d) => sum + d.loans, 0);
        const weekendLoans = trendData.filter((_, index) => index % 7 >= 5)
            .reduce((sum, d) => sum + d.loans, 0);
        
        if (weekdayLoans > weekendLoans * 2) {
            insights.push({
                type: 'info',
                title: 'Préférence semaine',
                description: 'Les utilisateurs empruntent principalement en semaine',
                impact: 'low'
            });
        }
        
        return {
            overview: {
                totalLoans,
                totalUsers,
                avgLoansPerDay: Math.round(avgLoansPerDay * 10) / 10,
                avgUsersPerDay: Math.round(avgUsersPerDay * 10) / 10,
                growthRate: Math.round(loanGrowth * 10) / 10
            },
            patterns: {
                weekdayWeekend: {
                    weekday: weekdayLoans,
                    weekend: weekendLoans,
                    ratio: Math.round((weekdayLoans / weekendLoans) * 10) / 10
                }
            },
            insights,
            forecast: predictions.slice(0, 7) // 7 jours de prévision
        };
    };

    // 📊 Composant de graphique en barres simple
    const SimpleBarChart = ({ data, title, color = 'blue' }) => {
        const maxValue = Math.max(...data.map(d => d.value));
        
        return (
            <div className="p-4 bg-white rounded-lg border">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    {title}
                </h4>
                <div className="space-y-2">
                    {data.map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <div className="w-20 text-xs text-gray-600 truncate">
                                {item.label}
                            </div>
                            <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                                <div 
                                    className={`bg-${color}-500 h-4 rounded-full flex items-center justify-end pr-2`}
                                    style={{ width: `${(item.value / maxValue) * 100}%` }}
                                >
                                    <span className="text-xs text-white font-medium">
                                        {item.value}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // 📈 Composant de ligne de tendance
    const TrendLine = ({ data, title, color = 'blue' }) => {
        const maxValue = Math.max(...data.map(d => d.value));
        const minValue = Math.min(...data.map(d => d.value));
        const range = maxValue - minValue;
        
        return (
            <div className="p-4 bg-white rounded-lg border">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    {title}
                </h4>
                <div className="relative h-32">
                    <svg className="w-full h-full" viewBox="0 0 300 100">
                        <polyline
                            points={data.map((item, index) => 
                                `${(index / (data.length - 1)) * 300},${100 - ((item.value - minValue) / range) * 80}`
                            ).join(' ')}
                            fill="none"
                            stroke={`rgb(var(--color-${color}-500))`}
                            strokeWidth="2"
                        />
                        {data.map((item, index) => (
                            <circle
                                key={index}
                                cx={(index / (data.length - 1)) * 300}
                                cy={100 - ((item.value - minValue) / range) * 80}
                                r="2"
                                fill={`rgb(var(--color-${color}-500))`}
                            />
                        ))}
                    </svg>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>{data[0]?.label}</span>
                    <span>{data[data.length - 1]?.label}</span>
                </div>
            </div>
        );
    };

    // 📅 Composant de répartition mensuelle
    const MonthlyDistribution = ({ data }) => (
        <div className="p-4 bg-white rounded-lg border">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Répartition Mensuelle
            </h4>
            <div className="grid grid-cols-4 gap-2">
                {data.map((item, index) => (
                    <div key={index} className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-xs font-medium text-gray-600">{item.month}</p>
                        <p className="text-sm font-bold">{item.loans}</p>
                        <p className="text-xs text-gray-500">prêts</p>
                    </div>
                ))}
            </div>
        </div>
    );

    // 🔮 Composant de prédictions
    const ForecastDisplay = ({ data }) => (
        <div className="p-4 bg-white rounded-lg border">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Prédictions (7 jours)
            </h4>
            <div className="space-y-2">
                {data.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                            <p className="text-sm font-medium">
                                {new Date(item.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
                            </p>
                            <p className="text-xs text-gray-600">
                                {Math.round(item.confidence * 100)}% confiance
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold">{item.predictedLoans} prêts</p>
                            <p className="text-xs text-gray-600">
                                {item.range.low}-{item.range.high}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // 🔄 Chargement initial et rafraîchissement automatique
    useEffect(() => {
        loadTrendAnalysis();
        
        if (autoRefresh) {
            const interval = setInterval(loadTrendAnalysis, 300000); // 5 minutes
            return () => clearInterval(interval);
        }
    }, [selectedPeriod, autoRefresh]);

    // Préparer les données pour les graphiques
    const chartData = trends.map(trend => ({
        label: new Date(trend.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
        loans: trend.loans,
        users: trend.users,
        delays: trend.delays
    }));

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Analyse de Tendances IA
                        </h2>
                        <p className="text-sm text-gray-600">
                            Visualisation et prédiction des tendances DocuCortex
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <select 
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="text-sm border rounded px-3 py-2"
                    >
                        <option value="7d">7 derniers jours</option>
                        <option value="30d">30 derniers jours</option>
                        <option value="90d">90 derniers jours</option>
                        <option value="365d">365 derniers jours</option>
                    </select>
                    
                    <button
                        onClick={loadTrendAnalysis}
                        disabled={loading}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Actualiser
                    </button>
                </div>
            </div>

            {/* Vue d'ensemble */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-700">Total Prêts</p>
                            <p className="text-2xl font-bold text-blue-900">{analysisData.overview.totalLoans || 0}</p>
                            <p className="text-xs text-blue-600">sur la période</p>
                        </div>
                        <FileText className="w-8 h-8 text-blue-600" />
                    </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-700">Utilisateurs Actifs</p>
                            <p className="text-2xl font-bold text-green-900">{analysisData.overview.totalUsers || 0}</p>
                            <p className="text-xs text-green-600"> uniques</p>
                        </div>
                        <Users className="w-8 h-8 text-green-600" />
                    </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-purple-700">Moyenne Quotidienne</p>
                            <p className="text-2xl font-bold text-purple-900">{analysisData.overview.avgLoansPerDay || 0}</p>
                            <p className="text-xs text-purple-600">prêts/jour</p>
                        </div>
                        <Calendar className="w-8 h-8 text-purple-600" />
                    </div>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-orange-700">Tendance</p>
                            <p className="text-2xl font-bold text-orange-900">
                                {analysisData.overview.growthRate > 0 ? '+' : ''}{analysisData.overview.growthRate || 0}%
                            </p>
                            <p className="text-xs text-orange-600">
                                {analysisData.overview.growthRate > 0 ? 'Croissance' : 'Baisse'}
                            </p>
                        </div>
                        {analysisData.overview.growthRate > 0 ? 
                            <TrendingUp className="w-8 h-8 text-orange-600" /> :
                            <TrendingDown className="w-8 h-8 text-orange-600" />
                        }
                    </div>
                </div>
            </div>

            {/* Insights */}
            {analysisData.insights.length > 0 && (
                <div className="bg-white rounded-lg border p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Eye className="w-5 h-5" />
                        Insights IA
                    </h3>
                    <div className="grid gap-3">
                        {analysisData.insights.map((insight, index) => (
                            <div key={index} className={`p-3 rounded-lg border-l-4 ${
                                insight.type === 'positive' ? 'bg-green-50 border-green-500' :
                                insight.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                                'bg-blue-50 border-blue-500'
                            }`}>
                                <h4 className="font-semibold text-sm mb-1">{insight.title}</h4>
                                <p className="text-sm text-gray-700">{insight.description}</p>
                                <span className={`text-xs px-2 py-1 rounded-full mt-2 inline-block ${
                                    insight.impact === 'high' ? 'bg-red-100 text-red-800' :
                                    insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'
                                }`}>
                                    Impact {insight.impact}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Graphiques principaux */}
            {!loading && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TrendLine 
                        data={chartData.map(d => ({ label: d.label, value: d.loans }))}
                        title="Évolution des Prêts"
                        color="blue"
                    />
                    <TrendLine 
                        data={chartData.map(d => ({ label: d.label, value: d.users }))}
                        title="Évolution des Utilisateurs"
                        color="green"
                    />
                </div>
            )}

            {/* Analyses détaillées */}
            {!loading && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <MonthlyDistribution data={seasonalData.monthlyDistribution || []} />
                    <ForecastDisplay data={analysisData.forecast} />
                    
                    {/* Répartition par type de document */}
                    <div className="p-4 bg-white rounded-lg border">
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                            <PieChart className="w-4 h-4" />
                            Catégories Populaires
                        </h4>
                        <div className="space-y-2">
                            {userBehavior.documentCategories?.map((category, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${
                                            index === 0 ? 'bg-blue-500' :
                                            index === 1 ? 'bg-green-500' :
                                            index === 2 ? 'bg-purple-500' : 'bg-orange-500'
                                        }`}></div>
                                        <span className="text-sm">{category.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{category.percentage}%</span>
                                        {category.trend === 'up' ? 
                                            <TrendingUp className="w-3 h-3 text-green-500" /> :
                                            category.trend === 'down' ?
                                            <TrendingDown className="w-3 h-3 text-red-500" /> :
                                            <Activity className="w-3 h-3 text-gray-500" />
                                        }
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Statistiques utilisateur */}
            {!loading && userBehavior.userSegments && (
                <div className="bg-white rounded-lg border p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Segmentation Utilisateurs
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                        {userBehavior.userSegments.map((segment, index) => (
                            <div key={index} className="p-4 bg-gray-50 rounded-lg text-center">
                                <h4 className="font-semibold mb-2">{segment.name}</h4>
                                <p className="text-2xl font-bold text-gray-900">{segment.count}</p>
                                <p className="text-sm text-gray-600">{segment.percentage}%</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Moy. {segment.avgLoans} prêts/utilisateur
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Chargement */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-6 h-6 animate-spin text-green-600" />
                    <p className="ml-2 text-gray-600">Analyse des tendances en cours...</p>
                </div>
            )}
        </div>
    );
};

export default TrendAnalysis;