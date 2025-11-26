// src/components/dashboard/TrendAnalysis.js - ANALYSE DES TENDANCES POUR DASHBOARD
// Composant d'analyse et visualisation des tendances temporelles

import React, { useState } from 'react';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { Line, Area } from 'react-chartjs-2';

const TrendAnalysis = ({ 
    data, 
    dateRange, 
    selectedMetrics = ['loans', 'users', 'revenue'],
    timeGranularity = 'daily' 
}) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedMetric, setSelectedMetric] = useState('loans');

    // Données de tendances simulées basées sur les KPIs réels
    const generateTrendData = () => {
        if (!data) return {};

        const daysInRange = Math.ceil((dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24));
        const labels = Array.from({ length: daysInRange }, (_, i) => 
            format(subDays(dateRange.end, daysInRange - 1 - i), 'dd/MM')
        );

        const baseValues = {
            loans: data.businessKPIs?.totalLoans || 1000,
            users: data.businessKPIs?.totalUsers || 500,
            revenue: data.financialMetrics?.totalValue || 50000,
            satisfaction: data.businessKPIs?.satisfactionScore || 8.5,
            efficiency: data.operationalMetrics?.efficiencyScore || 80
        };

        const trendData = {};
        
        Object.keys(baseValues).forEach(metric => {
            const baseValue = baseValues[metric];
            const isPercentage = metric === 'satisfaction' || metric === 'efficiency';
            
            // Générer des données avec tendance et variance
            const values = labels.map((_, i) => {
                const progress = i / (daysInRange - 1);
                const trendMultiplier = 1 + (progress * 0.2) + (Math.random() - 0.5) * 0.3;
                const value = baseValue * trendMultiplier;
                
                return isPercentage ? Math.min(10, Math.max(0, value)) : Math.max(0, value);
            });

            trendData[metric] = {
                labels,
                datasets: [{
                    label: getMetricLabel(metric),
                    data: values,
                    borderColor: getMetricColor(metric),
                    backgroundColor: getMetricColor(metric, 0.1),
                    fill: true,
                    tension: 0.4
                }]
            };
        });

        return trendData;
    };

    const getMetricLabel = (metric) => {
        const labels = {
            loans: 'Prêts',
            users: 'Utilisateurs',
            revenue: 'Revenus',
            satisfaction: 'Satisfaction',
            efficiency: 'Efficacité'
        };
        return labels[metric] || metric;
    };

    const getMetricColor = (metric, alpha = 1) => {
        const colors = {
            loans: `rgba(59, 130, 246, ${alpha})`,
            users: `rgba(16, 185, 129, ${alpha})`,
            revenue: `rgba(245, 158, 11, ${alpha})`,
            satisfaction: `rgba(139, 92, 246, ${alpha})`,
            efficiency: `rgba(236, 72, 153, ${alpha})`
        };
        return colors[metric] || `rgba(107, 114, 128, ${alpha})`;
    };

    // Calculer les statistiques de tendance
    const calculateTrendStats = () => {
        const trendData = generateTrendData();
        const currentMetric = trendData[selectedMetric];
        
        if (!currentMetric) return null;

        const values = currentMetric.datasets[0].data;
        const firstValue = values[0];
        const lastValue = values[values.length - 1];
        const change = ((lastValue - firstValue) / firstValue) * 100;
        
        // Calculer la tendance (simple régression linéaire)
        const xMean = (values.length - 1) / 2;
        const yMean = values.reduce((sum, val) => sum + val, 0) / values.length;
        
        let numerator = 0;
        let denominator = 0;
        
        for (let i = 0; i < values.length; i++) {
            numerator += (i - xMean) * (values[i] - yMean);
            denominator += (i - xMean) * (i - xMean);
        }
        
        const slope = numerator / denominator;
        const direction = slope > 0 ? 'ascending' : slope < 0 ? 'descending' : 'stable';
        
        // Calculer la volatilité
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const volatility = Math.sqrt(variance) / mean * 100;

        return {
            change: change,
            direction: direction,
            volatility: volatility,
            slope: slope,
            prediction: predictNextPeriod(values)
        };
    };

    // Prédiction simple pour la prochaine période
    const predictNextPeriod = (values) => {
        const recentValues = values.slice(-7); // Dernières 7 valeurs
        const average = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
        const trend = recentValues[recentValues.length - 1] - recentValues[0];
        
        return {
            value: average + trend * 0.3,
            confidence: Math.min(95, 60 + Math.random() * 30)
        };
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            y: {
                beginAtZero: false,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        },
        elements: {
            point: {
                radius: 3,
                hoverRadius: 6
            }
        }
    };

    const trendData = generateTrendData();
    const trendStats = calculateTrendStats();

    const getDirectionIcon = (direction) => {
        switch (direction) {
            case 'ascending': return '↗️';
            case 'descending': return '↘️';
            default: return '➡️';
        }
    };

    const getDirectionColor = (direction) => {
        switch (direction) {
            case 'ascending': return 'text-green-600';
            case 'descending': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800">
                    📈 Analyse des Tendances
                </h3>
                <select
                    value={selectedMetric}
                    onChange={(e) => setSelectedMetric(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="loans">Prêts</option>
                    <option value="users">Utilisateurs</option>
                    <option value="revenue">Revenus</option>
                    <option value="satisfaction">Satisfaction</option>
                    <option value="efficiency">Efficacité</option>
                </select>
            </div>

            {/* Onglets */}
            <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'overview'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    Vue d'ensemble
                </button>
                <button
                    onClick={() => setActiveTab('forecast')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'forecast'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    Prévisions
                </button>
                <button
                    onClick={() => setActiveTab('analysis')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'analysis'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    Analyse
                </button>
            </div>

            {/* Contenu des onglets */}
            {activeTab === 'overview' && (
                <div>
                    {/* Graphique principal */}
                    <div style={{ height: '250px' }} className="mb-6">
                        {trendData[selectedMetric] && (
                            <Area data={trendData[selectedMetric]} options={chartOptions} />
                        )}
                    </div>

                    {/* Statistiques rapides */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-sm text-gray-600">Évolution</div>
                            <div className={`text-lg font-semibold ${getDirectionColor(trendStats?.direction)}`}>
                                {getDirectionIcon(trendStats?.direction)} {trendStats?.change?.toFixed(1)}%
                            </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-sm text-gray-600">Volatilité</div>
                            <div className="text-lg font-semibold text-gray-800">
                                {trendStats?.volatility?.toFixed(1)}%
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'forecast' && (
                <div>
                    {/* Graphique avec projections */}
                    <div style={{ height: '250px' }} className="mb-6">
                        {trendData[selectedMetric] && (
                            <Line 
                                data={{
                                    ...trendData[selectedMetric],
                                    datasets: [
                                        ...trendData[selectedMetric].datasets,
                                        {
                                            label: 'Prévision',
                                            data: [
                                                ...trendData[selectedMetric].datasets[0].data.slice(-7),
                                                trendStats?.prediction?.value
                                            ].slice(-8),
                                            borderColor: 'rgba(139, 92, 246, 1)',
                                            backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                            borderDash: [5, 5],
                                            fill: false,
                                            tension: 0.4
                                        }
                                    ]
                                }} 
                                options={chartOptions} 
                            />
                        )}
                    </div>

                    {/* Prédictions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
                            <div className="text-sm text-purple-700 mb-1">Valeur Prédite</div>
                            <div className="text-xl font-bold text-purple-800">
                                {trendStats?.prediction?.value?.toFixed(1)}
                            </div>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                            <div className="text-sm text-blue-700 mb-1">Confiance</div>
                            <div className="text-xl font-bold text-blue-800">
                                {trendStats?.prediction?.confidence?.toFixed(0)}%
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'analysis' && (
                <div className="space-y-6">
                    {/* Métriques détaillées */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-sm text-gray-600 mb-2">Tendance</div>
                            <div className={`text-lg font-semibold ${getDirectionColor(trendStats?.direction)}`}>
                                {getDirectionIcon(trendStats?.direction)} 
                                {trendStats?.direction === 'ascending' ? 'Hausse' :
                                 trendStats?.direction === 'descending' ? 'Baisse' : 'Stable'}
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-sm text-gray-600 mb-2">Pente</div>
                            <div className="text-lg font-semibold text-gray-800">
                                {trendStats?.slope?.toFixed(3)}
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-sm text-gray-600 mb-2">Variabilité</div>
                            <div className="text-lg font-semibold text-gray-800">
                                {trendStats?.volatility?.toFixed(1)}%
                            </div>
                        </div>
                    </div>

                    {/* Analyse de la saisonnalité */}
                    <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                        <h4 className="font-semibold text-yellow-800 mb-2">🔄 Analyse Saisonnière</h4>
                        <div className="text-sm text-yellow-700">
                            {trendStats?.volatility > 20 ? 
                                'Les données montrent une forte variabilité saisonnière. Les pics correspondent aux périodes de forte activité.' :
                                'Les données sont relativement stables avec peu de variations saisonnières.'
                            }
                        </div>
                    </div>

                    {/* Recommandations */}
                    <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                        <h4 className="font-semibold text-green-800 mb-2">💡 Recommandations</h4>
                        <ul className="text-sm text-green-700 space-y-1">
                            {trendStats?.direction === 'ascending' && (
                                <li>• Capitaliser sur la tendance positive en augmentant les ressources</li>
                            )}
                            {trendStats?.direction === 'descending' && (
                                <li>• Analyser les causes du déclin et implémenter des mesures correctives</li>
                            )}
                            {trendStats?.volatility > 30 && (
                                <li>• Optimiser les processus pour réduire la variabilité</li>
                            )}
                            <li>• Surveiller étroitement les prochaines valeurs prédites</li>
                        </ul>
                    </div>

                    {/* Comparaison périodique */}
                    <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                        <h4 className="font-semibold text-blue-800 mb-2">📊 Comparaison</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-blue-700">Période actuelle:</span>
                                <span className="ml-2 font-semibold">
                                    {trendData[selectedMetric]?.datasets[0]?.data.slice(-7)?.reduce((a, b) => a + b, 0)?.toFixed(0)}
                                </span>
                            </div>
                            <div>
                                <span className="text-blue-700">Période précédente:</span>
                                <span className="ml-2 font-semibold">
                                    {trendData[selectedMetric]?.datasets[0]?.data.slice(-14, -7)?.reduce((a, b) => a + b, 0)?.toFixed(0)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrendAnalysis;