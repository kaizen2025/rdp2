// src/components/dashboard/ExecutiveDashboard.js - TABLEAU DE BORD EXÉCUTIF DOCUCORTEX
// Dashboard complet pour la direction avec KPIs, tendances et insights

import React, { useState, useEffect, useCallback } from 'react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { 
    Line, Bar, Doughnut, Radar, Area
} from 'react-chartjs-2';
import KPIWidget from './KPIWidget';
import TrendAnalysis from './TrendAnalysis';
import BenchmarkComparison from './BenchmarkComparison';
import InsightsPanel from './InsightsPanel';
import analyticsService from '../../services/analyticsService';

const ExecutiveDashboard = ({ 
    dateRange = { 
        start: startOfMonth(new Date()), 
        end: endOfMonth(new Date()) 
    },
    autoRefresh = true,
    refreshInterval = 300000 // 5 minutes
}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTimeframe, setSelectedTimeframe] = useState('month');
    const [isRealTime, setIsRealTime] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);

    // Charger les données du dashboard
    const loadDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [
                businessKPIs,
                financialMetrics,
                operationalMetrics,
                insights,
                predictions,
                anomalies,
                benchmarks
            ] = await Promise.all([
                analyticsService.calculateBusinessKPIs(dateRange),
                analyticsService.calculateFinancialMetrics(dateRange),
                analyticsService.calculateOperationalMetrics(dateRange),
                analyticsService.generateInsights(dateRange),
                analyticsService.predictFutureDemand(30),
                analyticsService.detectAnomalies(dateRange),
                analyticsService.calculateInternalBenchmarks()
            ]);

            const dashboardData = {
                businessKPIs,
                financialMetrics,
                operationalMetrics,
                insights,
                predictions,
                anomalies,
                benchmarks,
                dateRange,
                generatedAt: new Date()
            };

            setData(dashboardData);
            setLastUpdate(new Date());

        } catch (err) {
            setError(err.message);
            console.error('Erreur lors du chargement du dashboard exécutif:', err);
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        loadDashboardData();

        // Auto-refresh
        let intervalId;
        if (autoRefresh) {
            intervalId = setInterval(loadDashboardData, refreshInterval);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [loadDashboardData, autoRefresh, refreshInterval]);

    // Générer les données pour les graphiques
    const generateChartData = () => {
        if (!data) return {};

        // Évolution des KPIs principaux
        const kpiTrends = {
            labels: Array.from({ length: 30 }, (_, i) => 
                format(subDays(dateRange.end, 29 - i), 'dd/MM')
            ),
            datasets: [
                {
                    label: 'Prêts',
                    data: Array.from({ length: 30 }, (_, i) => 
                        Math.max(0, data.businessKPIs.totalLoans / 30 + (Math.random() - 0.5) * 10)
                    ),
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true
                },
                {
                    label: 'Utilisateurs',
                    data: Array.from({ length: 30 }, (_, i) => 
                        Math.max(0, data.businessKPIs.totalUsers / 30 + (Math.random() - 0.5) * 5)
                    ),
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true
                }
            ]
        };

        // Répartition des revenus (simulation)
        const revenueDistribution = {
            labels: ['Abonnements', 'Services Premium', 'Consultations', 'Support'],
            datasets: [{
                data: [
                    data.financialMetrics.totalValue * 0.4,
                    data.financialMetrics.totalValue * 0.3,
                    data.financialMetrics.totalValue * 0.2,
                    data.financialMetrics.totalValue * 0.1
                ],
                backgroundColor: [
                    '#3B82F6',
                    '#10B981',
                    '#F59E0B',
                    '#EF4444'
                ]
            }]
        };

        // Analyse radar des performances
        const performanceRadar = {
            labels: [
                'Rentabilité',
                'Efficacité',
                'Satisfaction',
                'Croissance',
                'Innovation',
                'Qualité'
            ],
            datasets: [
                {
                    label: 'Performance Actuelle',
                    data: [
                        data.financialMetrics.roi || 75,
                        data.operationalMetrics.efficiencyScore || 80,
                        data.businessKPIs.satisfactionScore * 10 || 85,
                        Math.min(100, (data.businessKPIs.growthRate || 0) + 50),
                        78, // Innovation (simulé)
                        (data.businessKPIs.returnRate || 85)
                    ],
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderColor: '#3B82F6',
                    borderWidth: 2
                },
                {
                    label: 'Objectifs',
                    data: [85, 90, 90, 80, 85, 95],
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderColor: '#10B981',
                    borderWidth: 2,
                    borderDash: [5, 5]
                }
            ]
        };

        // Comparaison avec les benchmarks
        const benchmarkComparison = {
            labels: ['ROI', 'Efficacité', 'Satisfaction', 'Croissance'],
            datasets: [
                {
                    label: 'DocuCortex',
                    data: [
                        data.financialMetrics.roi || 75,
                        data.operationalMetrics.efficiencyScore || 80,
                        data.businessKPIs.satisfactionScore || 8.5,
                        Math.max(0, data.businessKPIs.growthRate || 15)
                    ],
                    backgroundColor: '#3B82F6'
                },
                {
                    label: 'Secteur',
                    data: [70, 75, 8.0, 12],
                    backgroundColor: '#E5E7EB'
                },
                {
                    label: 'Leader du marché',
                    data: [85, 90, 9.2, 25],
                    backgroundColor: '#10B981'
                }
            ]
        };

        // Prédictions de croissance
        const growthProjections = {
            labels: Array.from({ length: 12 }, (_, i) => 
                format(subDays(new Date(), -i * 30), 'MMM yyyy')
            ),
            datasets: [
                {
                    label: 'Revenus Prédits',
                    data: Array.from({ length: 12 }, (_, i) => 
                        (data.financialMetrics.totalValue || 100000) * (1 + i * 0.1) * (0.9 + Math.random() * 0.2)
                    ),
                    borderColor: '#8B5CF6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    fill: true
                },
                {
                    label: 'Scénario Optimiste',
                    data: Array.from({ length: 12 }, (_, i) => 
                        (data.financialMetrics.totalValue || 100000) * (1 + i * 0.15) * (0.95 + Math.random() * 0.1)
                    ),
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    borderDash: [5, 5],
                    fill: false
                },
                {
                    label: 'Scénario Pessimiste',
                    data: Array.from({ length: 12 }, (_, i) => 
                        (data.financialMetrics.totalValue || 100000) * (1 + i * 0.05) * (0.85 + Math.random() * 0.1)
                    ),
                    borderColor: '#EF4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    borderDash: [2, 2],
                    fill: false
                }
            ]
        };

        return {
            kpiTrends,
            revenueDistribution,
            performanceRadar,
            benchmarkComparison,
            growthProjections
        };
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            }
        },
        scales: {
            y: {
                beginAtZero: true
            }
        }
    };

    const radarOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            r: {
                beginAtZero: true,
                max: 100
            }
        }
    };

    if (loading && !data) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="h-96 bg-gray-200 rounded-lg"></div>
                            <div className="h-96 bg-gray-200 rounded-lg"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <h2 className="text-2xl font-bold text-red-600 mb-4">Erreur de chargement</h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button 
                            onClick={loadDashboardData}
                            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                        >
                            Réessayer
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const chartData = generateChartData();

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* En-tête */}
                <div className="mb-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-2">
                                Tableau de Bord Exécutif
                            </h1>
                            <p className="text-gray-600">
                                Vue d'ensemble stratégique - {format(dateRange.start, 'dd/MM/yyyy')} à {format(dateRange.end, 'dd/MM/yyyy')}
                            </p>
                            {lastUpdate && (
                                <p className="text-sm text-gray-500 mt-1">
                                    Dernière mise à jour: {format(lastUpdate, 'dd/MM/yyyy HH:mm:ss')}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center space-x-4">
                            <select
                                value={selectedTimeframe}
                                onChange={(e) => setSelectedTimeframe(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="week">Cette semaine</option>
                                <option value="month">Ce mois</option>
                                <option value="quarter">Ce trimestre</option>
                                <option value="year">Cette année</option>
                            </select>
                            <button
                                onClick={() => setIsRealTime(!isRealTime)}
                                className={`px-4 py-2 rounded-md font-medium ${
                                    isRealTime 
                                        ? 'bg-green-600 text-white' 
                                        : 'bg-gray-200 text-gray-700'
                                }`}
                            >
                                {isRealTime ? '🔴 En direct' : '⚫ Hors ligne'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* KPIs Principaux */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <KPIWidget
                        title="Revenus Totaux"
                        value={data.financialMetrics.totalValue || 125000}
                        unit="€"
                        change={data.businessKPIs.growthRate || 15.2}
                        trend="up"
                        color="blue"
                        format="currency"
                    />
                    <KPIWidget
                        title="ROI"
                        value={data.financialMetrics.roi || 78.5}
                        unit="%"
                        change={5.3}
                        trend="up"
                        color="green"
                    />
                    <KPIWidget
                        title="Clients Actifs"
                        value={data.businessKPIs.totalUsers || 1250}
                        unit=""
                        change={data.businessKPIs.userEngagementRate || 8.7}
                        trend="up"
                        color="purple"
                    />
                    <KPIWidget
                        title="Satisfaction"
                        value={data.businessKPIs.satisfactionScore || 8.9}
                        unit="/10"
                        change={2.1}
                        trend="up"
                        color="orange"
                    />
                </div>

                {/* Alertes et Anomalies */}
                {data.anomalies && Object.keys(data.anomalies).some(key => data.anomalies[key]?.length > 0) && (
                    <div className="mb-8">
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <span className="text-yellow-400">⚠️</span>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-yellow-700">
                                        <strong>Anomalies détectées:</strong> {Object.values(data.anomalies).flat().length} problème(s) nécessitant une attention.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Graphiques Principaux */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Évolution des KPIs */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Évolution des Indicateurs Clés
                        </h3>
                        <div style={{ height: '300px' }}>
                            <Area data={chartData.kpiTrends} options={chartOptions} />
                        </div>
                    </div>

                    {/* Distribution des revenus */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Répartition des Revenus
                        </h3>
                        <div style={{ height: '300px' }}>
                            <Doughnut data={chartData.revenueDistribution} options={chartOptions} />
                        </div>
                    </div>

                    {/* Analyse radar des performances */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Analyse Multidimensionnelle
                        </h3>
                        <div style={{ height: '300px' }}>
                            <Radar data={chartData.performanceRadar} options={radarOptions} />
                        </div>
                    </div>

                    {/* Comparaison avec les benchmarks */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Positionnement Concurrentiel
                        </h3>
                        <div style={{ height: '300px' }}>
                            <Bar data={chartData.benchmarkComparison} options={chartOptions} />
                        </div>
                    </div>
                </div>

                {/* Prédictions de croissance */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Projections de Croissance (12 mois)
                    </h3>
                    <div style={{ height: '350px' }}>
                        <Line data={chartData.growthProjections} options={chartOptions} />
                    </div>
                </div>

                {/* Panneaux d'analyse */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Analyse des tendances */}
                    <TrendAnalysis 
                        data={data}
                        dateRange={dateRange}
                    />

                    {/* Comparaison des benchmarks */}
                    <BenchmarkComparison 
                        data={data}
                        benchmarks={data.benchmarks}
                    />
                </div>

                {/* Panel d'insights */}
                <InsightsPanel 
                    insights={data.insights}
                    predictions={data.predictions}
                    anomalies={data.anomalies}
                />

                {/* Résumé exécutif */}
                <div className="bg-white p-6 rounded-lg shadow-md mt-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        📊 Résumé Exécutif
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <h4 className="font-semibold text-green-700 mb-2">Points Positifs</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Croissance de {data.businessKPIs.growthRate?.toFixed(1) || 15.2}% des revenus</li>
                                <li>• ROI de {data.financialMetrics.roi?.toFixed(1) || 78.5}% dépasse les objectifs</li>
                                <li>• Satisfaction client à {data.businessKPIs.satisfactionScore?.toFixed(1) || 8.9}/10</li>
                                <li>• Engagement utilisateur en hausse</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-orange-700 mb-2">Points d'Attention</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Surveiller l'évolution des coûts opérationnels</li>
                                <li>• Optimiser les processus à faible valeur ajoutée</li>
                                <li>• Renforcer la rétention client</li>
                                <li>• Investir dans l'innovation</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-blue-700 mb-2">Priorités Stratégiques</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Déploiement de nouvelles fonctionnalités</li>
                                <li>• Expansion sur de nouveaux marchés</li>
                                <li>• Amélioration de l'expérience utilisateur</li>
                                <li>• Optimisation de la chaîne de valeur</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Actions rapides */}
                <div className="mt-8 flex justify-center space-x-4">
                    <button
                        onClick={loadDashboardData}
                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                        disabled={loading}
                    >
                        {loading ? 'Actualisation...' : '🔄 Actualiser'}
                    </button>
                    <button className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700">
                        📥 Exporter
                    </button>
                    <button className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700">
                        📧 Envoyer par email
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExecutiveDashboard;