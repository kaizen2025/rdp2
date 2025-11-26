// src/components/dashboard/BenchmarkComparison.js - COMPARAISON AVEC LES BENCHMARKS
// Composant de comparaison avec les standards du marché et benchmarks internes

import React, { useState } from 'react';
import { Bar, Radar, Scatter } from 'react-chartjs-2';

const BenchmarkComparison = ({ 
    data, 
    benchmarks,
    comparisonType = 'market' // 'market', 'internal', 'historical'
}) => {
    const [activeComparison, setActiveComparison] = useState('market');
    const [selectedMetrics, setSelectedMetrics] = useState(['roi', 'efficiency', 'satisfaction']);

    // Données de benchmarks du marché (simulation)
    const marketBenchmarks = {
        roi: { 
            industry: 65, 
            leader: 85, 
            docucortex: data?.financialMetrics?.roi || 78.5,
            unit: '%'
        },
        efficiency: { 
            industry: 70, 
            leader: 90, 
            docucortex: data?.operationalMetrics?.efficiencyScore || 82,
            unit: '%'
        },
        satisfaction: { 
            industry: 7.5, 
            leader: 9.2, 
            docucortex: data?.businessKPIs?.satisfactionScore || 8.9,
            unit: '/10'
        },
        growth: { 
            industry: 12, 
            leader: 25, 
            docucortex: data?.businessKPIs?.growthRate || 15.2,
            unit: '%'
        },
        marketShare: { 
            industry: 15, 
            leader: 35, 
            docucortex: 18,
            unit: '%'
        },
        innovation: { 
            industry: 65, 
            leader: 88, 
            docucortex: 73,
            unit: '%'
        }
    };

    // Benchmarks internes par département
    const internalBenchmarks = {
        sales: { 
            target: 100, 
            average: 85, 
            docucortex: data?.businessKPIs?.growthRate ? 
                Math.min(100, data.businessKPIs.growthRate * 4) : 92,
            unit: '%'
        },
        operations: { 
            target: 95, 
            average: 78, 
            docucortex: data?.operationalMetrics?.efficiencyScore || 82,
            unit: '%'
        },
        customer: { 
            target: 90, 
            average: 82, 
            docucortex: data?.businessKPIs?.satisfactionScore * 10 || 89,
            unit: '%'
        },
        finance: { 
            target: 85, 
            average: 75, 
            docucortex: data?.financialMetrics?.roi ? data.financialMetrics.roi * 0.8 : 68,
            unit: '%'
        }
    };

    // Générer les données pour le graphique en barres
    const generateBarChartData = () => {
        const currentBenchmarks = activeComparison === 'market' ? marketBenchmarks : internalBenchmarks;
        
        const labels = Object.keys(currentBenchmarks).map(key => {
            if (activeComparison === 'market') {
                return key.charAt(0).toUpperCase() + key.slice(1);
            }
            return key.charAt(0).toUpperCase() + key.slice(1);
        });

        const docucortexData = Object.values(currentBenchmarks).map(b => b.docucortex);
        const industryData = activeComparison === 'market' ? 
            Object.values(currentBenchmarks).map(b => b.industry) :
            Object.values(currentBenchmarks).map(b => b.average);
        const leaderData = activeComparison === 'market' ? 
            Object.values(currentBenchmarks).map(b => b.leader) :
            Object.values(currentBenchmarks).map(b => b.target);

        return {
            labels,
            datasets: [
                {
                    label: 'DocuCortex',
                    data: docucortexData,
                    backgroundColor: '#3B82F6',
                    borderColor: '#2563EB',
                    borderWidth: 2
                },
                {
                    label: activeComparison === 'market' ? 'Secteur' : 'Moyenne Interne',
                    data: industryData,
                    backgroundColor: '#E5E7EB',
                    borderColor: '#D1D5DB',
                    borderWidth: 1
                },
                {
                    label: activeComparison === 'market' ? 'Leader du Marché' : 'Objectif',
                    data: leaderData,
                    backgroundColor: '#10B981',
                    borderColor: '#059669',
                    borderWidth: 2
                }
            ]
        };
    };

    // Générer les données pour le graphique radar
    const generateRadarChartData = () => {
        const selectedBenchmarks = Object.fromEntries(
            Object.entries(marketBenchmarks).filter(([key]) => selectedMetrics.includes(key))
        );

        const labels = Object.keys(selectedBenchmarks).map(key => 
            key.charAt(0).toUpperCase() + key.slice(1)
        );

        const docucortexData = Object.values(selectedBenchmarks).map(b => b.docucortex);
        const industryData = Object.values(selectedBenchmarks).map(b => b.industry);
        const leaderData = Object.values(selectedBenchmarks).map(b => b.leader);

        return {
            labels,
            datasets: [
                {
                    label: 'DocuCortex',
                    data: docucortexData,
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderColor: '#3B82F6',
                    borderWidth: 2,
                    pointBackgroundColor: '#3B82F6',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                },
                {
                    label: 'Secteur',
                    data: industryData,
                    backgroundColor: 'rgba(156, 163, 175, 0.2)',
                    borderColor: '#9CA3AF',
                    borderWidth: 2,
                    pointBackgroundColor: '#9CA3AF',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                },
                {
                    label: 'Leader du Marché',
                    data: leaderData,
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    borderColor: '#10B981',
                    borderWidth: 2,
                    pointBackgroundColor: '#10B981',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }
            ]
        };
    };

    // Calculer la position relative
    const calculateRelativePosition = (docucortexValue, industryValue, leaderValue) => {
        const range = leaderValue - industryValue;
        const position = ((docucortexValue - industryValue) / range) * 100;
        return Math.max(0, Math.min(100, position));
    };

    // Obtenir le statut de performance
    const getPerformanceStatus = (docucortexValue, industryValue, leaderValue) => {
        const position = calculateRelativePosition(docucortexValue, industryValue, leaderValue);
        
        if (position >= 90) return { status: 'leader', color: 'green', text: 'Leader' };
        if (position >= 70) return { status: 'strong', color: 'blue', text: 'Fort' };
        if (position >= 50) return { status: 'average', color: 'yellow', text: 'Moyen' };
        return { status: 'below', color: 'red', text: 'En retard' };
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
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        }
    };

    const radarOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            r: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                },
                pointLabels: {
                    font: {
                        size: 12
                    }
                }
            }
        },
        plugins: {
            legend: {
                position: 'top',
            }
        }
    };

    const currentBenchmarks = activeComparison === 'market' ? marketBenchmarks : internalBenchmarks;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800">
                    🎯 Comparaison Benchmark
                </h3>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setActiveComparison('market')}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            activeComparison === 'market'
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Marché
                    </button>
                    <button
                        onClick={() => setActiveComparison('internal')}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            activeComparison === 'internal'
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Interne
                    </button>
                </div>
            </div>

            {/* Graphique principal */}
            <div style={{ height: '300px' }} className="mb-6">
                <Bar data={generateBarChartData()} options={chartOptions} />
            </div>

            {/* Graphique radar pour la sélection personnalisée */}
            {activeComparison === 'market' && (
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-md font-semibold text-gray-700">
                            Analyse Multidimensionnelle
                        </h4>
                        <select
                            multiple
                            value={selectedMetrics}
                            onChange={(e) => setSelectedMetrics(Array.from(e.target.selectedOptions, option => option.value))}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            size={3}
                        >
                            <option value="roi">ROI</option>
                            <option value="efficiency">Efficacité</option>
                            <option value="satisfaction">Satisfaction</option>
                            <option value="growth">Croissance</option>
                            <option value="marketShare">Part de Marché</option>
                            <option value="innovation">Innovation</option>
                        </select>
                    </div>
                    <div style={{ height: '250px' }}>
                        <Radar data={generateRadarChartData()} options={radarOptions} />
                    </div>
                </div>
            )}

            {/* Tableau de comparaison détaillé */}
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b">
                            <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">
                                Métrique
                            </th>
                            <th className="text-center py-2 px-3 text-sm font-medium text-gray-600">
                                DocuCortex
                            </th>
                            <th className="text-center py-2 px-3 text-sm font-medium text-gray-600">
                                {activeComparison === 'market' ? 'Secteur' : 'Moyenne'}
                            </th>
                            <th className="text-center py-2 px-3 text-sm font-medium text-gray-600">
                                {activeComparison === 'market' ? 'Leader' : 'Objectif'}
                            </th>
                            <th className="text-center py-2 px-3 text-sm font-medium text-gray-600">
                                Position
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(currentBenchmarks).map(([key, benchmark]) => {
                            const status = getPerformanceStatus(
                                benchmark.docucortex,
                                activeComparison === 'market' ? benchmark.industry : benchmark.average,
                                activeComparison === 'market' ? benchmark.leader : benchmark.target
                            );

                            const position = calculateRelativePosition(
                                benchmark.docucortex,
                                activeComparison === 'market' ? benchmark.industry : benchmark.average,
                                activeComparison === 'market' ? benchmark.leader : benchmark.target
                            );

                            return (
                                <tr key={key} className="border-b border-gray-100">
                                    <td className="py-3 px-3 text-sm font-medium text-gray-900">
                                        {key.charAt(0).toUpperCase() + key.slice(1)}
                                    </td>
                                    <td className="py-3 px-3 text-center">
                                        <div className="text-sm font-semibold text-blue-600">
                                            {benchmark.docucortex.toFixed(1)}{benchmark.unit}
                                        </div>
                                    </td>
                                    <td className="py-3 px-3 text-center">
                                        <div className="text-sm text-gray-600">
                                            {(activeComparison === 'market' ? benchmark.industry : benchmark.average).toFixed(1)}{benchmark.unit}
                                        </div>
                                    </td>
                                    <td className="py-3 px-3 text-center">
                                        <div className="text-sm text-gray-600">
                                            {(activeComparison === 'market' ? benchmark.leader : benchmark.target).toFixed(1)}{benchmark.unit}
                                        </div>
                                    </td>
                                    <td className="py-3 px-3 text-center">
                                        <div className="flex items-center justify-center space-x-2">
                                            <div className={`w-16 bg-gray-200 rounded-full h-2`}>
                                                <div
                                                    className={`h-2 rounded-full bg-${status.color}-500`}
                                                    style={{ width: `${position}%` }}
                                                />
                                            </div>
                                            <span className={`text-xs font-medium text-${status.color}-600`}>
                                                {status.text}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Résumé des performances */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                    <h4 className="font-semibold text-green-800 mb-2">🏆 Forces</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                        {Object.entries(currentBenchmarks)
                            .filter(([_, b]) => {
                                const status = getPerformanceStatus(
                                    b.docucortex,
                                    activeComparison === 'market' ? b.industry : b.average,
                                    activeComparison === 'market' ? b.leader : b.target
                                );
                                return status.status === 'leader' || status.status === 'strong';
                            })
                            .map(([key, _]) => (
                                <li key={key}>• {key.charAt(0).toUpperCase() + key.slice(1)}</li>
                            ))
                        }
                    </ul>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                    <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Points d'Amélioration</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                        {Object.entries(currentBenchmarks)
                            .filter(([_, b]) => {
                                const status = getPerformanceStatus(
                                    b.docucortex,
                                    activeComparison === 'market' ? b.industry : b.average,
                                    activeComparison === 'market' ? b.leader : b.target
                                );
                                return status.status === 'below' || status.status === 'average';
                            })
                            .map(([key, _]) => (
                                <li key={key}>• {key.charAt(0).toUpperCase() + key.slice(1)}</li>
                            ))
                        }
                    </ul>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                    <h4 className="font-semibold text-blue-800 mb-2">💡 Recommandations</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Capitaliser sur les points forts</li>
                        <li>• Adopter les meilleures pratiques</li>
                        <li>• Investir dans l'innovation</li>
                        <li>• Optimiser les processus</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default BenchmarkComparison;