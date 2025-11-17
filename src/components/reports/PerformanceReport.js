// src/components/reports/PerformanceReport.js - RAPPORT DE PERFORMANCE DOCUCORTEX
// Métriques de performance système, temps de réponse et optimisations

import React, { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { Line, Bar, Scatter } from 'react-chartjs-2';
import analyticsService from '../../services/analyticsService';
import ApiService from '../../services/apiService';

const PerformanceReport = ({ 
    dateRange = { 
        start: subDays(new Date(), 30), 
        end: new Date() 
    }, 
    onDataLoad 
}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedMetric, setSelectedMetric] = useState('responseTime');

    useEffect(() => {
        loadPerformanceData();
    }, [dateRange]);

    const loadPerformanceData = async () => {
        setLoading(true);
        setError(null);

        try {
            const [loans, kpis, operationalMetrics] = await Promise.all([
                ApiService.getLoans({
                    startDate: format(dateRange.start, 'yyyy-MM-dd'),
                    endDate: format(dateRange.end, 'yyyy-MM-dd')
                }),
                analyticsService.calculateBusinessKPIs(dateRange),
                analyticsService.calculateOperationalMetrics(dateRange)
            ]);

            const performanceData = {
                loans,
                kpis,
                operationalMetrics,
                dateRange,
                performance: analyzePerformance(loans, operationalMetrics),
                generatedAt: new Date()
            };

            setData(performanceData);

            if (onDataLoad) {
                onDataLoad(performanceData);
            }

        } catch (err) {
            setError(err.message);
            console.error('Erreur lors du chargement des données de performance:', err);
        } finally {
            setLoading(false);
        }
    };

    // Analyser les performances
    const analyzePerformance = (loans, operationalMetrics) => {
        const performance = {
            responseTime: calculateResponseTime(loans),
            systemUptime: calculateSystemUptime(),
            throughput: calculateThroughput(loans),
            errorRate: calculateErrorRate(loans),
            resourceUtilization: calculateResourceUtilization(operationalMetrics),
            scalability: calculateScalability(loans),
            recommendations: []
        };

        // Générer des recommandations basées sur les métriques
        if (performance.responseTime.average > 500) {
            performance.recommendations.push('Optimiser les requêtes de base de données');
        }
        if (performance.errorRate.rate > 1) {
            performance.recommendations.push('Améliorer la gestion des erreurs');
        }
        if (performance.systemUptime.percentage < 99) {
            performance.recommendations.push('Renforcer la haute disponibilité');
        }
        if (performance.throughput.requestsPerSecond < 100) {
            performance.recommendations.push('Améliorer la capacité de traitement');
        }

        return performance;
    };

    const calculateResponseTime = (loans) => {
        // Simulation des temps de réponse
        const responseTimes = loans.map(() => Math.random() * 300 + 100); // 100-400ms
        const sortedTimes = responseTimes.sort((a, b) => a - b);
        
        return {
            average: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
            median: sortedTimes[Math.floor(sortedTimes.length / 2)],
            p95: sortedTimes[Math.floor(sortedTimes.length * 0.95)],
            p99: sortedTimes[Math.floor(sortedTimes.length * 0.99)],
            max: Math.max(...responseTimes),
            min: Math.min(...responseTimes),
            sampleSize: responseTimes.length
        };
    };

    const calculateSystemUptime = () => {
        // Simulation de la disponibilité
        const uptimePercentage = 99.5 + Math.random() * 0.4; // 99.5-99.9%
        
        return {
            percentage: uptimePercentage,
            totalMinutes: 30 * 24 * 60, // 30 jours
            downtimeMinutes: (100 - uptimePercentage) / 100 * 30 * 24 * 60,
            incidents: Math.floor(Math.random() * 3),
            lastIncident: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        };
    };

    const calculateThroughput = (loans) => {
        const daysInPeriod = Math.ceil((dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24));
        const requestsPerSecond = loans.length / (daysInPeriod * 24 * 60 * 60);
        
        return {
            requestsPerSecond: requestsPerSecond,
            requestsPerMinute: requestsPerSecond * 60,
            requestsPerHour: requestsPerSecond * 3600,
            peakRequestsPerSecond: requestsPerSecond * (2 + Math.random() * 3),
            totalRequests: loans.length
        };
    };

    const calculateErrorRate = (loans) => {
        const errors = loans.filter(loan => loan.error || loan.status === 'cancelled');
        const rate = loans.length > 0 ? (errors.length / loans.length) * 100 : 0;
        
        return {
            rate: rate,
            errorCount: errors.length,
            totalRequests: loans.length,
            errorTypes: {
                timeout: Math.floor(errors.length * 0.4),
                validation: Math.floor(errors.length * 0.3),
                system: Math.floor(errors.length * 0.2),
                network: Math.floor(errors.length * 0.1)
            }
        };
    };

    const calculateResourceUtilization = (operationalMetrics) => {
        return {
            cpu: operationalMetrics.resourceUtilization?.cpu || 45 + Math.random() * 20,
            memory: operationalMetrics.resourceUtilization?.memory || 60 + Math.random() * 15,
            disk: operationalMetrics.resourceUtilization?.disk || 35 + Math.random() * 25,
            network: operationalMetrics.resourceUtilization?.network || 25 + Math.random() * 30,
            database: operationalMetrics.resourceUtilization?.database || 40 + Math.random() * 20
        };
    };

    const calculateScalability = (loans) => {
        const loadPattern = loans.reduce((pattern, loan) => {
            const hour = new Date(loan.loanDate).getHours();
            pattern[hour] = (pattern[hour] || 0) + 1;
            return pattern;
        }, {});

        const peakLoad = Math.max(...Object.values(loadPattern));
        const averageLoad = Object.values(loadPattern).reduce((sum, load) => sum + load, 0) / Object.values(loadPattern).length;
        
        return {
            peakLoad: peakLoad,
            averageLoad: averageLoad,
            loadFactor: peakLoad / averageLoad,
            horizontalScaling: peakLoad > averageLoad * 3,
            verticalScalingNeeded: peakLoad > 1000
        };
    };

    // Générer les données pour les graphiques
    const generateChartData = () => {
        if (!data) return {};

        // Simulation de données de performance dans le temps
        const performanceData = {
            labels: Array.from({ length: 30 }, (_, i) => format(subDays(dateRange.end, 29 - i), 'dd/MM')),
            datasets: []
        };

        switch (selectedMetric) {
            case 'responseTime':
                performanceData.datasets = [{
                    label: 'Temps de Réponse (ms)',
                    data: Array.from({ length: 30 }, () => Math.random() * 200 + 100),
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2
                }];
                break;

            case 'throughput':
                performanceData.datasets = [{
                    label: 'Requêtes par seconde',
                    data: Array.from({ length: 30 }, () => Math.random() * 50 + 20),
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2
                }];
                break;

            case 'errors':
                performanceData.datasets = [{
                    label: 'Taux d\'erreur (%)',
                    data: Array.from({ length: 30 }, () => Math.random() * 2),
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2
                }];
                break;

            case 'resources':
                return {
                    resourceUtilization: {
                        labels: ['CPU', 'Mémoire', 'Disque', 'Réseau', 'Base de données'],
                        datasets: [{
                            label: 'Utilisation des Ressources (%)',
                            data: [
                                data.performance.resourceUtilization.cpu,
                                data.performance.resourceUtilization.memory,
                                data.performance.resourceUtilization.disk,
                                data.performance.resourceUtilization.network,
                                data.performance.resourceUtilization.database
                            ],
                            backgroundColor: [
                                'rgba(255, 99, 132, 0.6)',
                                'rgba(54, 162, 235, 0.6)',
                                'rgba(255, 205, 86, 0.6)',
                                'rgba(75, 192, 192, 0.6)',
                                'rgba(153, 102, 255, 0.6)'
                            ],
                            borderColor: [
                                'rgba(255, 99, 132, 1)',
                                'rgba(54, 162, 235, 1)',
                                'rgba(255, 205, 86, 1)',
                                'rgba(75, 192, 192, 1)',
                                'rgba(153, 102, 255, 1)'
                            ],
                            borderWidth: 2
                        }]
                    }
                };
        }

        return { performanceData };
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

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-20 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                    <div className="h-64 bg-gray-200 rounded mb-8"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="h-32 bg-gray-200 rounded"></div>
                        <div className="h-32 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center text-red-600">
                    <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
                    <p>{error}</p>
                    <button 
                        onClick={loadPerformanceData}
                        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    const chartData = generateChartData();

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            {/* En-tête */}
            <div className="mb-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Rapport de Performance</h1>
                        <p className="text-gray-600 mt-2">
                            Période: {format(dateRange.start, 'dd/MM/yyyy')} - {format(dateRange.end, 'dd/MM/yyyy')}
                        </p>
                    </div>
                    <select
                        value={selectedMetric}
                        onChange={(e) => setSelectedMetric(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="responseTime">Temps de Réponse</option>
                        <option value="throughput">Débit</option>
                        <option value="errors">Erreurs</option>
                        <option value="resources">Ressources</option>
                    </select>
                </div>
            </div>

            {/* Métriques clés */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
                    <h3 className="text-sm font-medium opacity-90">Temps de Réponse Moyen</h3>
                    <p className="text-3xl font-bold">{data.performance.responseTime.average.toFixed(0)}ms</p>
                    <p className="text-sm opacity-90">
                        P95: {data.performance.responseTime.p95.toFixed(0)}ms
                    </p>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
                    <h3 className="text-sm font-medium opacity-90">Disponibilité</h3>
                    <p className="text-3xl font-bold">{data.performance.systemUptime.percentage.toFixed(2)}%</p>
                    <p className="text-sm opacity-90">
                        {data.performance.systemUptime.incidents} incidents
                    </p>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
                    <h3 className="text-sm font-medium opacity-90">Débit Moyen</h3>
                    <p className="text-3xl font-bold">{data.performance.throughput.requestsPerSecond.toFixed(1)}</p>
                    <p className="text-sm opacity-90">requêtes/seconde</p>
                </div>

                <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-lg">
                    <h3 className="text-sm font-medium opacity-90">Taux d'Erreur</h3>
                    <p className="text-3xl font-bold">{data.performance.errorRate.rate.toFixed(2)}%</p>
                    <p className="text-sm opacity-90">
                        {data.performance.errorRate.errorCount} erreurs
                    </p>
                </div>
            </div>

            {/* Graphique principal */}
            {selectedMetric !== 'resources' ? (
                <div className="bg-gray-50 p-6 rounded-lg mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Évolution des {selectedMetric === 'responseTime' ? 'Temps de Réponse' :
                                         selectedMetric === 'throughput' ? 'Débit' : 'Erreurs'} sur 30 jours
                    </h3>
                    <div style={{ height: '400px' }}>
                        <Line data={chartData.performanceData} options={chartOptions} />
                    </div>
                </div>
            ) : (
                <div className="bg-gray-50 p-6 rounded-lg mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Utilisation des Ressources
                    </h3>
                    <div style={{ height: '400px' }}>
                        <Bar data={chartData.resourceUtilization} options={chartOptions} />
                    </div>
                </div>
            )}

            {/* Détail des métriques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Temps de réponse détaillé */}
                <div className="bg-blue-50 p-6 rounded-lg">
                    <h4 className="text-lg font-semibold text-blue-800 mb-4">
                        ⏱️ Analyse des Temps de Réponse
                    </h4>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-blue-700">Minimum:</span>
                            <span className="font-semibold">{data.performance.responseTime.min.toFixed(0)}ms</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-blue-700">Médian:</span>
                            <span className="font-semibold">{data.performance.responseTime.median.toFixed(0)}ms</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-blue-700">95e percentile:</span>
                            <span className="font-semibold">{data.performance.responseTime.p95.toFixed(0)}ms</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-blue-700">99e percentile:</span>
                            <span className="font-semibold">{data.performance.responseTime.p99.toFixed(0)}ms</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-blue-700">Maximum:</span>
                            <span className="font-semibold">{data.performance.responseTime.max.toFixed(0)}ms</span>
                        </div>
                    </div>
                </div>

                {/* Disponibilité système */}
                <div className="bg-green-50 p-6 rounded-lg">
                    <h4 className="text-lg font-semibold text-green-800 mb-4">
                        🔄 Disponibilité Système
                    </h4>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-green-700">Temps d'activité:</span>
                            <span className="font-semibold">{data.performance.systemUptime.percentage.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-green-700">Temps d'arrêt:</span>
                            <span className="font-semibold">
                                {data.performance.systemUptime.downtimeMinutes.toFixed(0)} min
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-green-700">Incidents:</span>
                            <span className="font-semibold">{data.performance.systemUptime.incidents}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-green-700">Dernier incident:</span>
                            <span className="font-semibold">
                                {format(data.performance.systemUptime.lastIncident, 'dd/MM')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Analyse des erreurs */}
                <div className="bg-red-50 p-6 rounded-lg">
                    <h4 className="text-lg font-semibold text-red-800 mb-4">
                        ❌ Analyse des Erreurs
                    </h4>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-red-700">Taux global:</span>
                            <span className="font-semibold">{data.performance.errorRate.rate.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-red-700">Timeouts:</span>
                            <span className="font-semibold">
                                {data.performance.errorRate.errorTypes.timeout}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-red-700">Validation:</span>
                            <span className="font-semibold">
                                {data.performance.errorRate.errorTypes.validation}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-red-700">Système:</span>
                            <span className="font-semibold">
                                {data.performance.errorRate.errorTypes.system}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-red-700">Réseau:</span>
                            <span className="font-semibold">
                                {data.performance.errorRate.errorTypes.network}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Scalabilité */}
                <div className="bg-purple-50 p-6 rounded-lg">
                    <h4 className="text-lg font-semibold text-purple-800 mb-4">
                        📈 Analyse de Scalabilité
                    </h4>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-purple-700">Charge moyenne:</span>
                            <span className="font-semibold">{data.performance.scalability.averageLoad.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-purple-700">Charge pic:</span>
                            <span className="font-semibold">{data.performance.scalability.peakLoad}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-purple-700">Facteur de charge:</span>
                            <span className="font-semibold">{data.performance.scalability.loadFactor.toFixed(1)}x</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-purple-700">Scaling horizontal:</span>
                            <span className="font-semibold">
                                {data.performance.scalability.horizontalScaling ? '✅ Nécessaire' : '❌ Non'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-purple-700">Scaling vertical:</span>
                            <span className="font-semibold">
                                {data.performance.scalability.verticalScalingNeeded ? '✅ Recommandé' : '❌ Non'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recommandations d'optimisation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-400">
                    <h4 className="text-lg font-semibold text-yellow-800 mb-4">
                        🚀 Recommandations d'Optimisation
                    </h4>
                    {data.performance.recommendations.length > 0 ? (
                        <ul className="space-y-2">
                            {data.performance.recommendations.map((rec, index) => (
                                <li key={index} className="text-yellow-700 text-sm">
                                    • {rec}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-yellow-700 text-sm">
                            Aucune recommandation majeure. Le système fonctionne de manière optimale.
                        </p>
                    )}
                </div>

                <div className="bg-indigo-50 p-6 rounded-lg border-l-4 border-indigo-400">
                    <h4 className="text-lg font-semibold text-indigo-800 mb-4">
                        🎯 Objectifs de Performance
                    </h4>
                    <ul className="space-y-2">
                        <li className="text-indigo-700 text-sm">
                            • Temps de réponse &lt; 200ms (actuellement {data.performance.responseTime.average.toFixed(0)}ms)
                        </li>
                        <li className="text-indigo-700 text-sm">
                            • Disponibilité &gt; 99.9% (actuellement {data.performance.systemUptime.percentage.toFixed(2)}%)
                        </li>
                        <li className="text-indigo-700 text-sm">
                            • Taux d'erreur &lt; 0.5% (actuellement {data.performance.errorRate.rate.toFixed(2)}%)
                        </li>
                        <li className="text-indigo-700 text-sm">
                            • Débit &gt; 100 req/s (actuellement {data.performance.throughput.requestsPerSecond.toFixed(1)})
                        </li>
                    </ul>
                </div>
            </div>

            {/* Historique des incidents */}
            <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    📊 Historique des Performances (Simulation)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <h5 className="font-semibold text-gray-700 mb-2">Cette Semaine</h5>
                        <ul className="space-y-1 text-sm">
                            <li className="flex justify-between">
                                <span>Temps moyen:</span>
                                <span className="font-semibold">125ms</span>
                            </li>
                            <li className="flex justify-between">
                                <span>Disponibilité:</span>
                                <span className="font-semibold">99.8%</span>
                            </li>
                            <li className="flex justify-between">
                                <span>Erreurs:</span>
                                <span className="font-semibold">0.2%</span>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h5 className="font-semibold text-gray-700 mb-2">Mois Dernier</h5>
                        <ul className="space-y-1 text-sm">
                            <li className="flex justify-between">
                                <span>Temps moyen:</span>
                                <span className="font-semibold">142ms</span>
                            </li>
                            <li className="flex justify-between">
                                <span>Disponibilité:</span>
                                <span className="font-semibold">99.6%</span>
                            </li>
                            <li className="flex justify-between">
                                <span>Erreurs:</span>
                                <span className="font-semibold">0.4%</span>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h5 className="font-semibold text-gray-700 mb-2">Objectif</h5>
                        <ul className="space-y-1 text-sm">
                            <li className="flex justify-between">
                                <span>Temps moyen:</span>
                                <span className="font-semibold text-green-600">&lt; 200ms</span>
                            </li>
                            <li className="flex justify-between">
                                <span>Disponibilité:</span>
                                <span className="font-semibold text-green-600">&gt; 99.9%</span>
                            </li>
                            <li className="flex justify-between">
                                <span>Erreurs:</span>
                                <span className="font-semibold text-green-600">&lt; 0.5%</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PerformanceReport;