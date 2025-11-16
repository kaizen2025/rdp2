// src/components/reports/UsageReport.js - RAPPORT D'UTILISATION DOCUCORTEX
// Analyse détaillée de l'utilisation du système et du comportement des utilisateurs

import React, { useState, useEffect } from 'react';
import { format, subDays, differenceInDays } from 'date-fns';
import { Line, Bar, Doughnut, Scatter } from 'react-chartjs-2';
import analyticsService from '../../services/analyticsService';
import ApiService from '../../services/apiService';

const UsageReport = ({ 
    dateRange = { 
        start: subDays(new Date(), 30), 
        end: new Date() 
    }, 
    onDataLoad 
}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPeriod, setSelectedPeriod] = useState('30days');

    // Charger les données d'utilisation
    useEffect(() => {
        loadUsageData();
    }, [dateRange, selectedPeriod]);

    const loadUsageData = async () => {
        setLoading(true);
        setError(null);

        try {
            const [loans, users, insights, kpis] = await Promise.all([
                ApiService.getLoans({
                    startDate: format(dateRange.start, 'yyyy-MM-dd'),
                    endDate: format(dateRange.end, 'yyyy-MM-dd')
                }),
                ApiService.getUsers(),
                analyticsService.generateInsights(dateRange),
                analyticsService.calculateBusinessKPIs(dateRange)
            ]);

            const usageData = {
                loans,
                users,
                insights,
                kpis,
                dateRange,
                analytics: analyzeUsagePatterns(loans, users),
                generatedAt: new Date()
            };

            setData(usageData);

            if (onDataLoad) {
                onDataLoad(usageData);
            }

        } catch (err) {
            setError(err.message);
            console.error('Erreur lors du chargement des données d\'utilisation:', err);
        } finally {
            setLoading(false);
        }
    };

    // Analyser les patterns d'utilisation
    const analyzeUsagePatterns = (loans, users) => {
        const analytics = {
            hourlyPatterns: {},
            dailyPatterns: {},
            userEngagement: {},
            documentPopularity: {},
            peakUsage: null,
            usageTrends: {},
            behaviorSegmentation: {}
        };

        // Patterns horaires
        loans.forEach(loan => {
            const hour = new Date(loan.loanDate).getHours();
            analytics.hourlyPatterns[hour] = (analytics.hourlyPatterns[hour] || 0) + 1;
        });

        // Patterns quotidiens
        loans.forEach(loan => {
            const day = new Date(loan.loanDate).getDay();
            const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
            analytics.dailyPatterns[dayNames[day]] = (analytics.dailyPatterns[dayNames[day]] || 0) + 1;
        });

        // Engagement des utilisateurs
        users.forEach(user => {
            const userLoans = loans.filter(loan => loan.borrowerId === user.id);
            if (userLoans.length > 0) {
                const engagement = {
                    totalLoans: userLoans.length,
                    averageDuration: userLoans.reduce((sum, loan) => {
                        if (loan.returnDate) {
                            const duration = differenceInDays(new Date(loan.returnDate), new Date(loan.loanDate));
                            return sum + duration;
                        }
                        return sum;
                    }, 0) / userLoans.length,
                    regularity: calculateUserRegularity(userLoans),
                    status: userLoans.some(l => l.status === 'overdue') ? 'risk' : 
                           userLoans.length > 5 ? 'power' : 'regular'
                };
                analytics.userEngagement[user.id] = engagement;
            }
        });

        // Popularité des documents
        loans.forEach(loan => {
            const docId = loan.documentId;
            if (!analytics.documentPopularity[docId]) {
                analytics.documentPopularity[docId] = {
                    title: loan.documentTitle || `Document ${docId}`,
                    count: 0,
                    totalDuration: 0,
                    averageRating: 0
                };
            }
            analytics.documentPopularity[docId].count++;
            if (loan.returnDate) {
                const duration = differenceInDays(new Date(loan.returnDate), new Date(loan.loanDate));
                analytics.documentPopularity[docId].totalDuration += duration;
            }
        });

        // Calculer les moyennes
        Object.values(analytics.documentPopularity).forEach(doc => {
            doc.averageDuration = doc.totalDuration / doc.count;
        });

        // Pics d'utilisation
        const peakHour = Object.entries(analytics.hourlyPatterns)
            .reduce((max, [hour, count]) => count > max.count ? { hour: parseInt(hour), count } : max, { hour: 0, count: 0 });
        
        const peakDay = Object.entries(analytics.dailyPatterns)
            .reduce((max, [day, count]) => count > max.count ? { day, count } : max, { day: '', count: 0 });

        analytics.peakUsage = {
            hour: peakHour,
            day: peakDay
        };

        // Segmentation comportementale
        const segments = {
            powerUsers: Object.values(analytics.userEngagement).filter(u => u.status === 'power').length,
            regularUsers: Object.values(analytics.userEngagement).filter(u => u.status === 'regular').length,
            atRiskUsers: Object.values(analytics.userEngagement).filter(u => u.status === 'risk').length
        };
        analytics.behaviorSegmentation = segments;

        return analytics;
    };

    // Calculer la régularité d'un utilisateur
    const calculateUserRegularity = (loans) => {
        if (loans.length < 2) return 0;
        
        const sortedLoans = loans.sort((a, b) => new Date(a.loanDate) - new Date(b.loanDate));
        const intervals = [];
        
        for (let i = 1; i < sortedLoans.length; i++) {
            const interval = differenceInDays(
                new Date(sortedLoans[i].loanDate),
                new Date(sortedLoans[i-1].loanDate)
            );
            intervals.push(interval);
        }
        
        const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
        const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - averageInterval, 2), 0) / intervals.length;
        
        return Math.max(0, 100 - Math.sqrt(variance)); // Plus la variance est faible, plus la régularité est élevée
    };

    // Générer les données pour les graphiques
    const generateChartData = () => {
        if (!data) return {};

        // Évolution de l'utilisation
        const dailyUsage = {};
        data.loans.forEach(loan => {
            const date = format(new Date(loan.loanDate), 'dd/MM');
            dailyUsage[date] = (dailyUsage[date] || 0) + 1;
        });

        // Patterns horaires
        const hourlyData = {
            labels: Array.from({ length: 24 }, (_, i) => `${i}h`),
            datasets: [{
                label: 'Utilisations par heure',
                data: Array.from({ length: 24 }, (_, i) => data.analytics.hourlyPatterns[i] || 0),
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2
            }]
        };

        // Patterns quotidiens
        const dailyData = {
            labels: Object.keys(data.analytics.dailyPatterns),
            datasets: [{
                label: 'Utilisations par jour',
                data: Object.values(data.analytics.dailyPatterns),
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                    '#9966FF', '#FF9F40', '#FF6384'
                ]
            }]
        };

        // Top documents
        const topDocuments = Object.values(data.analytics.documentPopularity)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        const documentsData = {
            labels: topDocuments.map(doc => doc.title.length > 20 ? doc.title.substring(0, 20) + '...' : doc.title),
            datasets: [{
                label: 'Nombre d\'emprunts',
                data: topDocuments.map(doc => doc.count),
                backgroundColor: 'rgba(153, 102, 255, 0.6)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 2
            }]
        };

        // Segmentation des utilisateurs
        const segmentationData = {
            labels: ['Utilisateurs Puissants', 'Utilisateurs Réguliers', 'Utilisateurs à Risque'],
            datasets: [{
                data: [
                    data.analytics.behaviorSegmentation.powerUsers,
                    data.analytics.behaviorSegmentation.regularUsers,
                    data.analytics.behaviorSegmentation.atRiskUsers
                ],
                backgroundColor: [
                    '#4BC0C0',
                    '#36A2EB',
                    '#FF6384'
                ]
            }]
        };

        // Évolution quotidienne
        const usageTrendData = {
            labels: Object.keys(dailyUsage),
            datasets: [{
                label: 'Utilisations par jour',
                data: Object.values(dailyUsage),
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 2,
                fill: true
            }]
        };

        return {
            hourlyData,
            dailyData,
            documentsData,
            segmentationData,
            usageTrendData
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
        },
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-20 bg-gray-200 rounded"></div>
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
                        onClick={loadUsageData}
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
                        <h1 className="text-3xl font-bold text-gray-800">Rapport d'Utilisation</h1>
                        <p className="text-gray-600 mt-2">
                            Période: {format(dateRange.start, 'dd/MM/yyyy')} - {format(dateRange.end, 'dd/MM/yyyy')}
                        </p>
                    </div>
                    <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="7days">7 derniers jours</option>
                        <option value="30days">30 derniers jours</option>
                        <option value="90days">90 derniers jours</option>
                        <option value="custom">Période personnalisée</option>
                    </select>
                </div>
            </div>

            {/* Métriques d'utilisation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
                    <h3 className="text-sm font-medium opacity-90">Total des Sessions</h3>
                    <p className="text-3xl font-bold">{data.loans.length.toLocaleString()}</p>
                    <p className="text-sm opacity-90">
                        {data.kpis.loansPerDay ? `${data.kpis.loansPerDay.toFixed(1)}/jour` : 'Analyse en cours'}
                    </p>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
                    <h3 className="text-sm font-medium opacity-90">Utilisateurs Actifs</h3>
                    <p className="text-3xl font-bold">
                        {Object.keys(data.analytics.userEngagement).length.toLocaleString()}
                    </p>
                    <p className="text-sm opacity-90">
                        {data.kpis.userEngagementRate ? `${data.kpis.userEngagementRate.toFixed(1)}% engagement` : 'Calcul en cours'}
                    </p>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
                    <h3 className="text-sm font-medium opacity-90">Documents Consultés</h3>
                    <p className="text-3xl font-bold">
                        {Object.keys(data.analytics.documentPopularity).length.toLocaleString()}
                    </p>
                    <p className="text-sm opacity-90">
                        {data.kpis.utilizationRate ? `${data.kpis.utilizationRate.toFixed(1)}% d'utilisation` : 'Calcul en cours'}
                    </p>
                </div>
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Évolution des utilisations */}
                <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Évolution des Utilisations
                    </h3>
                    <div style={{ height: '300px' }}>
                        <Line data={chartData.usageTrendData} options={chartOptions} />
                    </div>
                </div>

                {/* Utilisation par heure */}
                <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Utilisation par Heure de la Journée
                    </h3>
                    <div style={{ height: '300px' }}>
                        <Bar data={chartData.hourlyData} options={chartOptions} />
                    </div>
                </div>

                {/* Utilisation par jour */}
                <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Utilisation par Jour de la Semaine
                    </h3>
                    <div style={{ height: '300px' }}>
                        <Bar data={chartData.dailyData} options={chartOptions} />
                    </div>
                </div>

                {/* Segmentation des utilisateurs */}
                <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Segmentation Comportementale
                    </h3>
                    <div style={{ height: '300px' }}>
                        <Doughnut data={chartData.segmentationData} options={chartOptions} />
                    </div>
                </div>
            </div>

            {/* Top documents */}
            <div className="bg-gray-50 p-6 rounded-lg mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Top 10 des Documents les Plus Consultés
                </h3>
                <div style={{ height: '400px' }}>
                    <Bar 
                        data={chartData.documentsData} 
                        options={{
                            ...chartOptions,
                            indexAxis: 'y',
                            scales: {
                                x: {
                                    beginAtZero: true
                                }
                            }
                        }} 
                    />
                </div>
            </div>

            {/* Insights d'utilisation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Pics d'utilisation */}
                <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-400">
                    <h3 className="text-lg font-semibold text-blue-800 mb-4">
                        ⏰ Pics d'Utilisation Identifiés
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <p className="font-semibold text-blue-700">Heure de pointe:</p>
                            <p className="text-blue-600">
                                {data.analytics.peakUsage?.hour?.hour}h00 avec {data.analytics.peakUsage?.hour?.count} utilisations
                            </p>
                        </div>
                        <div>
                            <p className="font-semibold text-blue-700">Jour de pointe:</p>
                            <p className="text-blue-600">
                                {data.analytics.peakUsage?.day?.day} avec {data.analytics.peakUsage?.day?.count} utilisations
                            </p>
                        </div>
                    </div>
                </div>

                {/* Recommandations d'optimisation */}
                <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-400">
                    <h3 className="text-lg font-semibold text-green-800 mb-4">
                        💡 Optimisations Recommandées
                    </h3>
                    <ul className="space-y-2">
                        <li className="text-green-700 text-sm">
                            • Renforcer les ressources serveur aux heures de pointe
                        </li>
                        <li className="text-green-700 text-sm">
                            • Planifier la maintenance en dehors des pics d'utilisation
                        </li>
                        <li className="text-green-700 text-sm">
                            • Adapter les rappels selon les patterns utilisateurs
                        </li>
                        <li className="text-green-700 text-sm">
                            • Optimiser l'UX pour les heures creuses
                        </li>
                    </ul>
                </div>
            </div>

            {/* Tableau détaillé des utilisateurs */}
            <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Analyse Détaillée des Utilisateurs
                </h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white rounded-lg">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Utilisateur
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Prêts
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Durée Moyenne
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Régularité
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Segment
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {Object.entries(data.analytics.userEngagement)
                                .sort(([,a], [,b]) => b.totalLoans - a.totalLoans)
                                .slice(0, 10)
                                .map(([userId, engagement]) => (
                                <tr key={userId}>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                        Utilisateur {userId}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                        {engagement.totalLoans}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                        {engagement.averageDuration.toFixed(1)} jours
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                        {engagement.regularity.toFixed(0)}%
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            engagement.status === 'power' ? 'bg-purple-100 text-purple-800' :
                                            engagement.status === 'risk' ? 'bg-red-100 text-red-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                            {engagement.status === 'power' ? 'Puissant' :
                                             engagement.status === 'risk' ? 'À Risque' : 'Régulier'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UsageReport;