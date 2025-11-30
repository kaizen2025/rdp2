// src/components/reports/MonthlyReport.js - RAPPORT MENSUEL DOCUCORTEX
// Rapport mensuel complet avec KPIs, tendances et analyses

import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    RadialLinearScale
} from 'chart.js';
import analyticsService from '../../services/analyticsService';
import ApiService from '../../services/apiService';

// Enregistrer les composants Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    RadialLinearScale
);

const MonthlyReport = ({ 
    month = new Date(), 
    onDataLoad,
    includeComparison = true 
}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedMetrics, setSelectedMetrics] = useState(['loans', 'users', 'revenue']);

    const dateRange = {
        start: startOfMonth(month),
        end: endOfMonth(month)
    };

    const previousMonth = subMonths(month, 1);
    const previousDateRange = {
        start: startOfMonth(previousMonth),
        end: endOfMonth(previousMonth)
    };

    // Charger les données du rapport
    useEffect(() => {
        loadReportData();
    }, [month]);

    const loadReportData = async () => {
        setLoading(true);
        setError(null);

        try {
            // Charger les données en parallèle
            const [
                currentKPIs,
                previousKPIs,
                insights,
                predictions,
                loans,
                users,
                anomalies
            ] = await Promise.all([
                analyticsService.calculateBusinessKPIs(dateRange),
                includeComparison ? analyticsService.calculateBusinessKPIs(previousDateRange) : null,
                analyticsService.generateInsights(dateRange),
                analyticsService.predictFutureDemand(30),
                ApiService.getLoans({ 
                    startDate: format(dateRange.start, 'yyyy-MM-dd'),
                    endDate: format(dateRange.end, 'yyyy-MM-dd')
                }),
                ApiService.getUsers({ 
                    startDate: format(dateRange.start, 'yyyy-MM-dd'),
                    endDate: format(dateRange.end, 'yyyy-MM-dd')
                }),
                analyticsService.detectAnomalies(dateRange)
            ]);

            const reportData = {
                currentKPIs,
                previousKPIs,
                insights,
                predictions,
                loans,
                users,
                anomalies,
                dateRange,
                reportMonth: month,
                generatedAt: new Date()
            };

            setData(reportData);

            if (onDataLoad) {
                onDataLoad(reportData);
            }

        } catch (err) {
            setError(err.message);
            console.error('Erreur lors du chargement du rapport mensuel:', err);
        } finally {
            setLoading(false);
        }
    };

    // Calculer les variations
    const calculateChange = (current, previous) => {
        if (!previous || previous === 0) return 0;
        return ((current - previous) / previous) * 100;
    };

    // Générer les données pour les graphiques
    const generateChartData = () => {
        if (!data) return {};

        // Données pour le graphique des prêts quotidiens
        const dailyLoans = {};
        data.loans.forEach(loan => {
            const date = format(new Date(loan.loanDate), 'dd/MM');
            dailyLoans[date] = (dailyLoans[date] || 0) + 1;
        });

        // Données pour la répartition des statuts
        const statusDistribution = data.loans.reduce((acc, loan) => {
            acc[loan.status] = (acc[loan.status] || 0) + 1;
            return acc;
        }, {});

        // Données pour le graphique radar des performances
        const performanceRadar = {
            labels: [
                'Taux de retour',
                'Satisfaction',
                'Efficacité',
                'Fiabilité',
                'Performance'
            ],
            datasets: [{
                label: 'Performance Actuelle',
                data: [
                    data.currentKPIs.returnRate,
                    data.currentKPIs.satisfactionScore * 10,
                    data.currentKPIs.utilizationRate,
                    100 - data.currentKPIs.errorRate,
                    data.currentKPIs.processingTime > 0 ? Math.max(0, 100 - data.currentKPIs.processingTime) : 80
                ],
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2
            }]
        };

        return {
            dailyLoans: {
                labels: Object.keys(dailyLoans),
                datasets: [{
                    label: 'Prêts par jour',
                    data: Object.values(dailyLoans),
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2
                }]
            },
            statusDistribution: {
                labels: Object.keys(statusDistribution),
                datasets: [{
                    data: Object.values(statusDistribution),
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF'
                    ]
                }]
            },
            performanceRadar,
            monthlyComparison: data.previousKPIs ? {
                labels: ['Prêts', 'Utilisateurs', 'Taux de retour', 'Satisfaction'],
                datasets: [
                    {
                        label: format(data.reportMonth, 'MMMM yyyy'),
                        data: [
                            data.currentKPIs.totalLoans,
                            data.currentKPIs.totalUsers,
                            data.currentKPIs.returnRate,
                            data.currentKPIs.satisfactionScore
                        ],
                        backgroundColor: 'rgba(54, 162, 235, 0.6)'
                    },
                    {
                        label: format(previousMonth, 'MMMM yyyy'),
                        data: [
                            data.previousKPIs.totalLoans,
                            data.previousKPIs.totalUsers,
                            data.previousKPIs.returnRate,
                            data.previousKPIs.satisfactionScore
                        ],
                        backgroundColor: 'rgba(255, 99, 132, 0.6)'
                    }
                ]
            } : null
        };
    };

    // Configuration des graphiques
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: false,
            },
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

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-24 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="h-64 bg-gray-200 rounded"></div>
                        <div className="h-64 bg-gray-200 rounded"></div>
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
                        onClick={loadReportData}
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
            {/* En-tête du rapport */}
            <div className="mb-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">
                            Rapport Mensuel - {format(month, 'MMMM yyyy')}
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Période: {format(dateRange.start, 'dd/MM/yyyy')} - {format(dateRange.end, 'dd/MM/yyyy')}
                        </p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                        <p>Généré le {format(new Date(), 'dd/MM/yyyy à HH:mm')}</p>
                        <p>DocuCortex Analytics</p>
                    </div>
                </div>
            </div>

            {/* KPIs principaux */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
                    <h3 className="text-sm font-medium opacity-90">Total des Prêts</h3>
                    <p className="text-3xl font-bold">{data.currentKPIs.totalLoans.toLocaleString()}</p>
                    {data.previousKPIs && (
                        <p className="text-sm opacity-90">
                            {calculateChange(data.currentKPIs.totalLoans, data.previousKPIs.totalLoans) >= 0 ? '↗' : '↘'}
                            {Math.abs(calculateChange(data.currentKPIs.totalLoans, data.previousKPIs.totalLoans)).toFixed(1)}%
                        </p>
                    )}
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
                    <h3 className="text-sm font-medium opacity-90">Taux de Retour</h3>
                    <p className="text-3xl font-bold">{data.currentKPIs.returnRate.toFixed(1)}%</p>
                    {data.previousKPIs && (
                        <p className="text-sm opacity-90">
                            {calculateChange(data.currentKPIs.returnRate, data.previousKPIs.returnRate) >= 0 ? '↗' : '↘'}
                            {Math.abs(calculateChange(data.currentKPIs.returnRate, data.previousKPIs.returnRate)).toFixed(1)}%
                        </p>
                    )}
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
                    <h3 className="text-sm font-medium opacity-90">Utilisateurs Actifs</h3>
                    <p className="text-3xl font-bold">{data.currentKPIs.totalUsers.toLocaleString()}</p>
                    {data.previousKPIs && (
                        <p className="text-sm opacity-90">
                            {calculateChange(data.currentKPIs.totalUsers, data.previousKPIs.totalUsers) >= 0 ? '↗' : '↘'}
                            {Math.abs(calculateChange(data.currentKPIs.totalUsers, data.previousKPIs.totalUsers)).toFixed(1)}%
                        </p>
                    )}
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg">
                    <h3 className="text-sm font-medium opacity-90">Score Satisfaction</h3>
                    <p className="text-3xl font-bold">{data.currentKPIs.satisfactionScore.toFixed(1)}/10</p>
                    {data.previousKPIs && (
                        <p className="text-sm opacity-90">
                            {calculateChange(data.currentKPIs.satisfactionScore, data.previousKPIs.satisfactionScore) >= 0 ? '↗' : '↘'}
                            {Math.abs(calculateChange(data.currentKPIs.satisfactionScore, data.previousKPIs.satisfactionScore)).toFixed(1)}%
                        </p>
                    )}
                </div>
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Évolution quotidienne */}
                <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Évolution Quotidienne des Prêts
                    </h3>
                    <div style={{ height: '300px' }}>
                        <Line data={chartData.dailyLoans} options={chartOptions} />
                    </div>
                </div>

                {/* Répartition des statuts */}
                <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Répartition des Prêts par Statut
                    </h3>
                    <div style={{ height: '300px' }}>
                        <Doughnut data={chartData.statusDistribution} options={chartOptions} />
                    </div>
                </div>

                {/* Comparaison mensuelle */}
                {chartData.monthlyComparison && (
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Comparaison avec le Mois Précédent
                        </h3>
                        <div style={{ height: '300px' }}>
                            <Bar data={chartData.monthlyComparison} options={chartOptions} />
                        </div>
                    </div>
                )}

                {/* Graphique radar des performances */}
                <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Analyse des Performances
                    </h3>
                    <div style={{ height: '300px' }}>
                        <Radar data={chartData.performanceRadar} options={radarOptions} />
                    </div>
                </div>
            </div>

            {/* Section Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Opportunités */}
                <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-400">
                    <h3 className="text-lg font-semibold text-green-800 mb-3">
                        💡 Opportunités
                    </h3>
                    <ul className="space-y-2">
                        {data.insights.opportunities?.slice(0, 3).map((opportunity, index) => (
                            <li key={index} className="text-green-700 text-sm">
                                • {opportunity}
                            </li>
                        )) || (
                            <li className="text-green-700 text-sm">
                                • Augmenter l'adoption des fonctionnalités avancées
                            </li>
                        )}
                    </ul>
                </div>

                {/* Risques */}
                <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-400">
                    <h3 className="text-lg font-semibold text-red-800 mb-3">
                        ⚠️ Risques Identifiés
                    </h3>
                    <ul className="space-y-2">
                        {data.insights.risks?.slice(0, 3).map((risk, index) => (
                            <li key={index} className="text-red-700 text-sm">
                                • {risk}
                            </li>
                        )) || (
                            <li className="text-red-700 text-sm">
                                • Surveiller l'augmentation des prêts en retard
                            </li>
                        )}
                    </ul>
                </div>

                {/* Recommandations */}
                <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-400">
                    <h3 className="text-lg font-semibold text-blue-800 mb-3">
                        🎯 Recommandations
                    </h3>
                    <ul className="space-y-2">
                        {data.insights.recommendations?.slice(0, 3).map((rec, index) => (
                            <li key={index} className="text-blue-700 text-sm">
                                • {rec}
                            </li>
                        )) || (
                            <li className="text-blue-700 text-sm">
                                • Optimiser les processus de rappel
                            </li>
                        )}
                    </ul>
                </div>
            </div>

            {/* Tableau détaillé */}
            <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Détail des Métriques
                </h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white rounded-lg">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Métrique
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Valeur Actuelle
                                </th>
                                {data.previousKPIs && (
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Mois Précédent
                                    </th>
                                )}
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Évolution
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {[
                                { key: 'totalLoans', label: 'Total des prêts' },
                                { key: 'activeLoans', label: 'Prêts actifs' },
                                { key: 'returnedLoans', label: 'Prêts retournés' },
                                { key: 'overdueLoans', label: 'Prêts en retard' },
                                { key: 'totalUsers', label: 'Total des utilisateurs' },
                                { key: 'returnRate', label: 'Taux de retour (%)', format: v => `${v.toFixed(1)}%` },
                                { key: 'utilizationRate', label: 'Taux d\'utilisation (%)', format: v => `${v.toFixed(1)}%` },
                                { key: 'averageLoanDuration', label: 'Durée moyenne (jours)', format: v => v.toFixed(1) },
                                { key: 'satisfactionScore', label: 'Score de satisfaction', format: v => v.toFixed(1) }
                            ].map(({ key, label, format: formatFn }) => (
                                <tr key={key}>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                        {label}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                        {formatFn ? formatFn(data.currentKPIs[key]) : data.currentKPIs[key].toLocaleString()}
                                    </td>
                                    {data.previousKPIs && (
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                            {formatFn ? formatFn(data.previousKPIs[key]) : data.previousKPIs[key].toLocaleString()}
                                        </td>
                                    )}
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        {data.previousKPIs ? (
                                            <span className={`${
                                                calculateChange(data.currentKPIs[key], data.previousKPIs[key]) >= 0 
                                                    ? 'text-green-600' 
                                                    : 'text-red-600'
                                            }`}>
                                                {calculateChange(data.currentKPIs[key], data.previousKPIs[key]) >= 0 ? '↗' : '↘'}
                                                {Math.abs(calculateChange(data.currentKPIs[key], data.previousKPIs[key])).toFixed(1)}%
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Prédictions */}
            {data.predictions && (
                <div className="mt-8 bg-blue-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-800 mb-4">
                        🔮 Prédictions pour le Prochain Mois
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">
                                {data.predictions.confidence ? (data.predictions.confidence * 100).toFixed(0) : 75}%
                            </p>
                            <p className="text-sm text-blue-700">Niveau de confiance</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">
                                {data.currentKPIs.loansPerDay ? (data.currentKPIs.loansPerDay * 30).toFixed(0) : 450}
                            </p>
                            <p className="text-sm text-blue-700">Prêts prédits</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">
                                {data.currentKPIs.returnRate ? data.currentKPIs.returnRate.toFixed(0) : 85}%
                            </p>
                            <p className="text-sm text-blue-700">Taux de retour attendu</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MonthlyReport;