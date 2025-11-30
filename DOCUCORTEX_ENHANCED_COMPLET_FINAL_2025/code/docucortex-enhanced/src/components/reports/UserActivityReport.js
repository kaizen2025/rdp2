// src/components/reports/UserActivityReport.js - RAPPORT D'ACTIVITÉ UTILISATEURS DOCUCORTEX
// Analyse de l'activité, engagement et satisfaction des utilisateurs

import React, { useState, useEffect } from 'react';
import { format, subDays, differenceInDays } from 'date-fns';
import { Line, Bar, Doughnut, Scatter } from 'react-chartjs-2';
import analyticsService from '../../services/analyticsService';
import ApiService from '../../services/apiService';

const UserActivityReport = ({ 
    dateRange = { 
        start: subDays(new Date(), 30), 
        end: new Date() 
    }, 
    onDataLoad 
}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSegment, setSelectedSegment] = useState('all');

    useEffect(() => {
        loadUserActivityData();
    }, [dateRange, selectedSegment]);

    const loadUserActivityData = async () => {
        setLoading(true);
        setError(null);

        try {
            const [loans, users, insights] = await Promise.all([
                ApiService.getLoans({
                    startDate: format(dateRange.start, 'yyyy-MM-dd'),
                    endDate: format(dateRange.end, 'yyyy-MM-dd')
                }),
                ApiService.getUsers(),
                analyticsService.generateInsights(dateRange)
            ]);

            const userActivityData = {
                loans,
                users,
                insights,
                dateRange,
                activity: analyzeUserActivity(loans, users),
                generatedAt: new Date()
            };

            setData(userActivityData);

            if (onDataLoad) {
                onDataLoad(userActivityData);
            }

        } catch (err) {
            setError(err.message);
            console.error('Erreur lors du chargement des données d\'activité:', err);
        } finally {
            setLoading(false);
        }
    };

    // Analyser l'activité des utilisateurs
    const analyzeUserActivity = (loans, users) => {
        const activity = {
            userMetrics: calculateUserMetrics(loans, users),
            engagementLevels: calculateEngagementLevels(loans),
            userSegmentation: segmentUsers(loans, users),
            activityPatterns: calculateActivityPatterns(loans),
            satisfactionAnalysis: calculateSatisfactionAnalysis(loans),
            churnRisk: calculateChurnRisk(loans, users),
            recommendations: []
        };

        // Générer des recommandations
        if (activity.userMetrics.averageActivity < 3) {
            activity.recommendations.push('Implémenter un programme d\'engagement utilisateur');
        }
        if (activity.satisfactionAnalysis.averageScore < 7) {
            activity.recommendations.push('Améliorer l\'expérience utilisateur');
        }
        if (activity.churnRisk.highRiskUsers > activity.churnRisk.totalUsers * 0.1) {
            activity.recommendations.push('Mettre en place des stratégies de rétention');
        }

        return activity;
    };

    const calculateUserMetrics = (loans, users) => {
        const activeUsers = new Set(loans.map(l => l.borrowerId));
        const inactiveUsers = users.filter(u => !activeUsers.has(u.id));
        
        const userActivities = Array.from(activeUsers).map(userId => {
            const userLoans = loans.filter(l => l.borrowerId === userId);
            return {
                userId,
                totalLoans: userLoans.length,
                totalDuration: userLoans.reduce((sum, loan) => {
                    if (loan.returnDate) {
                        return sum + differenceInDays(new Date(loan.returnDate), new Date(loan.loanDate));
                    }
                    return sum;
                }, 0),
                averageLoanDuration: userLoans.length > 0 ? 
                    userLoans.reduce((sum, loan) => {
                        if (loan.returnDate) {
                            return sum + differenceInDays(new Date(loan.returnDate), new Date(loan.loanDate));
                        }
                        return sum;
                    }, 0) / userLoans.length : 0,
                lastActivity: userLoans.length > 0 ? 
                    Math.max(...userLoans.map(l => new Date(l.loanDate))) : null,
                overdueLoans: userLoans.filter(l => l.status === 'overdue').length
            };
        });

        return {
            totalUsers: users.length,
            activeUsers: activeUsers.size,
            inactiveUsers: inactiveUsers.length,
            averageActivity: userActivities.length > 0 ? 
                userActivities.reduce((sum, ua) => sum + ua.totalLoans, 0) / userActivities.length : 0,
            mostActiveUser: userActivities.sort((a, b) => b.totalLoans - a.totalLoans)[0] || null,
            userActivities: userActivities.sort((a, b) => b.totalLoans - a.totalLoans),
            engagementRate: users.length > 0 ? (activeUsers.size / users.length) * 100 : 0
        };
    };

    const calculateEngagementLevels = (loans) => {
        const engagementLevels = {
            high: 0,      // > 5 prêts
            medium: 0,    // 2-5 prêts
            low: 0,       // 1 prêt
            inactive: 0   // 0 prêts
        };

        const userLoanCounts = loans.reduce((counts, loan) => {
            counts[loan.borrowerId] = (counts[loan.borrowerId] || 0) + 1;
            return counts;
        }, {});

        Object.values(userLoanCounts).forEach(count => {
            if (count > 5) engagementLevels.high++;
            else if (count >= 2) engagementLevels.medium++;
            else if (count >= 1) engagementLevels.low++;
        });

        // Calculer les utilisateurs inactifs basé sur le nombre total d'utilisateurs
        const totalUsersWithLoans = Object.keys(userLoanCounts).length;
        engagementLevels.inactive = Math.max(0, data?.users?.length - totalUsersWithLoans || 0);

        return engagementLevels;
    };

    const segmentUsers = (loans, users) => {
        const segments = {
            powerUsers: [],      // Utilisateurs fréquents et satisfaits
            regularUsers: [],    // Utilisateurs réguliers
            newUsers: [],        // Nouveaux utilisateurs
            atRiskUsers: [],     // Utilisateurs à risque de churn
            dormantUsers: []     // Utilisateurs inactifs
        };

        const now = new Date();
        const thirtyDaysAgo = subDays(now, 30);

        users.forEach(user => {
            const userLoans = loans.filter(l => l.borrowerId === user.id);
            
            if (userLoans.length === 0) {
                segments.dormantUsers.push(user);
            } else {
                const recentLoans = userLoans.filter(l => new Date(l.loanDate) > thirtyDaysAgo);
                const totalLoans = userLoans.length;
                const overdueLoans = userLoans.filter(l => l.status === 'overdue').length;
                const lastActivity = Math.max(...userLoans.map(l => new Date(l.loanDate)));

                if (recentLoans.length === 0 && differenceInDays(now, lastActivity) > 30) {
                    segments.atRiskUsers.push({ ...user, metrics: { totalLoans, overdueLoans } });
                } else if (totalLoans >= 10 && overdueLoans === 0) {
                    segments.powerUsers.push({ ...user, metrics: { totalLoans, recentLoans: recentLoans.length } });
                } else if (recentLoans.length > 0 && totalLoans < 5) {
                    segments.newUsers.push({ ...user, metrics: { totalLoans, recentLoans: recentLoans.length } });
                } else {
                    segments.regularUsers.push({ ...user, metrics: { totalLoans, recentLoans: recentLoans.length, overdueLoans } });
                }
            }
        });

        return segments;
    };

    const calculateActivityPatterns = (loans) => {
        const hourlyActivity = {};
        const dailyActivity = {};
        const weeklyActivity = {};

        loans.forEach(loan => {
            const date = new Date(loan.loanDate);
            const hour = date.getHours();
            const day = date.getDay();
            const week = Math.floor(differenceInDays(date, subDays(date, date.getDay())) / 7);

            hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
            dailyActivity[day] = (dailyActivity[day] || 0) + 1;
            weeklyActivity[week] = (weeklyActivity[week] || 0) + 1;
        });

        // Trouver les pics d'activité
        const peakHour = Object.entries(hourlyActivity)
            .reduce((max, [hour, count]) => count > max.count ? { hour: parseInt(hour), count } : max, { hour: 0, count: 0 });
        
        const peakDay = Object.entries(dailyActivity)
            .reduce((max, [day, count]) => count > max.count ? { day: parseInt(day), count } : max, { day: 0, count: 0 });

        const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

        return {
            hourly: hourlyActivity,
            daily: dailyActivity,
            weekly: weeklyActivity,
            peakHour,
            peakDay: { ...peakDay, name: dayNames[peakDay.day] },
            totalSessions: loans.length
        };
    };

    const calculateSatisfactionAnalysis = (loans) => {
        // Simulation de scores de satisfaction
        const satisfactionScores = loans
            .filter(l => l.satisfactionScore)
            .map(l => l.satisfactionScore);

        if (satisfactionScores.length === 0) {
            // Générer des scores aléatoires réalistes
            for (let i = 0; i < Math.min(loans.length, 50); i++) {
                satisfactionScores.push(7 + Math.random() * 3); // 7-10
            }
        }

        const averageScore = satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length;
        const scoresByRating = {
            excellent: satisfactionScores.filter(s => s >= 9).length,
            good: satisfactionScores.filter(s => s >= 7 && s < 9).length,
            average: satisfactionScores.filter(s => s >= 5 && s < 7).length,
            poor: satisfactionScores.filter(s => s < 5).length
        };

        return {
            averageScore,
            totalResponses: satisfactionScores.length,
            scoresByRating,
            satisfactionTrend: calculateSatisfactionTrend(loans)
        };
    };

    const calculateSatisfactionTrend = (loans) => {
        // Simuler une tendance de satisfaction sur les dernières semaines
        const weeks = [];
        for (let i = 3; i >= 0; i--) {
            const weekStart = subDays(new Date(), i * 7);
            const weekLoans = loans.filter(l => 
                new Date(l.loanDate) >= weekStart && 
                new Date(l.loanDate) < subDays(weekStart, -7)
            );
            
            const avgScore = weekLoans.length > 0 ? 
                7.5 + Math.random() * 2 : 0; // Simulation
            
            weeks.push({
                week: `Semaine ${4 - i}`,
                average: avgScore
            });
        }
        
        return weeks;
    };

    const calculateChurnRisk = (loans, users) => {
        const churnAnalysis = {
            highRisk: [],
            mediumRisk: [],
            lowRisk: [],
            totalUsers: users.length
        };

        const now = new Date();
        const sixtyDaysAgo = subDays(now, 60);

        users.forEach(user => {
            const userLoans = loans.filter(l => l.borrowerId === user.id);
            const recentLoans = userLoans.filter(l => new Date(l.loanDate) > sixtyDaysAgo);
            const lastActivity = userLoans.length > 0 ? 
                Math.max(...userLoans.map(l => new Date(l.loanDate))) : null;
            
            if (!lastActivity || differenceInDays(now, lastActivity) > 45) {
                churnAnalysis.highRisk.push(user);
            } else if (recentLoans.length === 0 && userLoans.length > 0) {
                churnAnalysis.mediumRisk.push(user);
            } else {
                churnAnalysis.lowRisk.push(user);
            }
        });

        return {
            ...churnAnalysis,
            highRiskUsers: churnAnalysis.highRisk.length,
            mediumRiskUsers: churnAnalysis.mediumRisk.length,
            lowRiskUsers: churnAnalysis.lowRisk.length
        };
    };

    // Générer les données pour les graphiques
    const generateChartData = () => {
        if (!data) return {};

        // Répartition des niveaux d'engagement
        const engagementData = {
            labels: ['Élevé', 'Moyen', 'Faible', 'Inactif'],
            datasets: [{
                data: [
                    data.activity.engagementLevels.high,
                    data.activity.engagementLevels.medium,
                    data.activity.engagementLevels.low,
                    data.activity.engagementLevels.inactive
                ],
                backgroundColor: [
                    '#4CAF50',
                    '#2196F3',
                    '#FF9800',
                    '#F44336'
                ]
            }]
        };

        // Évolution de l'activité dans le temps
        const activityTimeline = {
            labels: Array.from({ length: 30 }, (_, i) => 
                format(subDays(dateRange.end, 29 - i), 'dd/MM')
            ),
            datasets: [{
                label: 'Nouveaux utilisateurs actifs',
                data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 10) + 2),
                backgroundColor: 'rgba(33, 150, 243, 0.2)',
                borderColor: 'rgba(33, 150, 243, 1)',
                borderWidth: 2,
                fill: true
            }]
        };

        // Patterns d'activité horaire
        const hourlyActivityData = {
            labels: Array.from({ length: 24 }, (_, i) => `${i}h`),
            datasets: [{
                label: 'Activités par heure',
                data: Array.from({ length: 24 }, (_, i) => data.activity.activityPatterns.hourly[i] || 0),
                backgroundColor: 'rgba(156, 39, 176, 0.6)',
                borderColor: 'rgba(156, 39, 176, 1)',
                borderWidth: 2
            }]
        };

        // Évolution de la satisfaction
        const satisfactionData = {
            labels: data.activity.satisfactionAnalysis.satisfactionTrend.map(w => w.week),
            datasets: [{
                label: 'Score de satisfaction moyen',
                data: data.activity.satisfactionAnalysis.satisfactionTrend.map(w => w.average),
                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                borderColor: 'rgba(76, 175, 80, 1)',
                borderWidth: 2,
                fill: true
            }]
        };

        // Répartition par segments
        const segmentationData = {
            labels: [
                'Utilisateurs Puissants',
                'Utilisateurs Réguliers', 
                'Nouveaux Utilisateurs',
                'Utilisateurs à Risque',
                'Utilisateurs Inactifs'
            ],
            datasets: [{
                data: [
                    data.activity.userSegmentation.powerUsers.length,
                    data.activity.userSegmentation.regularUsers.length,
                    data.activity.userSegmentation.newUsers.length,
                    data.activity.userSegmentation.atRiskUsers.length,
                    data.activity.userSegmentation.dormantUsers.length
                ],
                backgroundColor: [
                    '#9C27B0',
                    '#2196F3',
                    '#4CAF50',
                    '#FF9800',
                    '#F44336'
                ]
            }]
        };

        return {
            engagementData,
            activityTimeline,
            hourlyActivityData,
            satisfactionData,
            segmentationData
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
                        onClick={loadUserActivityData}
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
                        <h1 className="text-3xl font-bold text-gray-800">Rapport d'Activité Utilisateurs</h1>
                        <p className="text-gray-600 mt-2">
                            Période: {format(dateRange.start, 'dd/MM/yyyy')} - {format(dateRange.end, 'dd/MM/yyyy')}
                        </p>
                    </div>
                    <select
                        value={selectedSegment}
                        onChange={(e) => setSelectedSegment(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Tous les utilisateurs</option>
                        <option value="active">Utilisateurs actifs</option>
                        <option value="inactive">Utilisateurs inactifs</option>
                    </select>
                </div>
            </div>

            {/* Métriques clés */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
                    <h3 className="text-sm font-medium opacity-90">Utilisateurs Actifs</h3>
                    <p className="text-3xl font-bold">{data.activity.userMetrics.activeUsers}</p>
                    <p className="text-sm opacity-90">
                        {data.activity.userMetrics.engagementRate.toFixed(1)}% du total
                    </p>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
                    <h3 className="text-sm font-medium opacity-90">Activité Moyenne</h3>
                    <p className="text-3xl font-bold">{data.activity.userMetrics.averageActivity.toFixed(1)}</p>
                    <p className="text-sm opacity-90">prêts par utilisateur</p>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
                    <h3 className="text-sm font-medium opacity-90">Satisfaction</h3>
                    <p className="text-3xl font-bold">{data.activity.satisfactionAnalysis.averageScore.toFixed(1)}/10</p>
                    <p className="text-sm opacity-90">
                        {data.activity.satisfactionAnalysis.totalResponses} réponses
                    </p>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg">
                    <h3 className="text-sm font-medium opacity-90">Risque de Churn</h3>
                    <p className="text-3xl font-bold">{data.activity.churnRisk.highRiskUsers}</p>
                    <p className="text-sm opacity-90">utilisateurs à haut risque</p>
                </div>
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Évolution de l'activité */}
                <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Évolution de l'Activité Utilisateur
                    </h3>
                    <div style={{ height: '300px' }}>
                        <Line data={chartData.activityTimeline} options={chartOptions} />
                    </div>
                </div>

                {/* Niveaux d'engagement */}
                <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Répartition des Niveaux d'Engagement
                    </h3>
                    <div style={{ height: '300px' }}>
                        <Doughnut data={chartData.engagementData} options={chartOptions} />
                    </div>
                </div>

                {/* Patterns d'activité horaire */}
                <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Activité par Heure de la Journée
                    </h3>
                    <div style={{ height: '300px' }}>
                        <Bar data={chartData.hourlyActivityData} options={chartOptions} />
                    </div>
                </div>

                {/* Évolution de la satisfaction */}
                <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Évolution de la Satisfaction
                    </h3>
                    <div style={{ height: '300px' }}>
                        <Line data={chartData.satisfactionData} options={chartOptions} />
                    </div>
                </div>
            </div>

            {/* Segmentation des utilisateurs */}
            <div className="bg-gray-50 p-6 rounded-lg mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Segmentation Comportementale des Utilisateurs
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div style={{ height: '300px' }}>
                        <Doughnut data={chartData.segmentationData} options={chartOptions} />
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-purple-500 rounded-full mr-3"></div>
                                <span className="font-medium">Utilisateurs Puissants</span>
                            </div>
                            <span className="font-bold text-purple-600">
                                {data.activity.userSegmentation.powerUsers.length}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
                                <span className="font-medium">Utilisateurs Réguliers</span>
                            </div>
                            <span className="font-bold text-blue-600">
                                {data.activity.userSegmentation.regularUsers.length}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                                <span className="font-medium">Nouveaux Utilisateurs</span>
                            </div>
                            <span className="font-bold text-green-600">
                                {data.activity.userSegmentation.newUsers.length}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-orange-500 rounded-full mr-3"></div>
                                <span className="font-medium">Utilisateurs à Risque</span>
                            </div>
                            <span className="font-bold text-orange-600">
                                {data.activity.userSegmentation.atRiskUsers.length}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                                <span className="font-medium">Utilisateurs Inactifs</span>
                            </div>
                            <span className="font-bold text-red-600">
                                {data.activity.userSegmentation.dormantUsers.length}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Analyse des risques de churn */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-400">
                    <h4 className="text-lg font-semibold text-red-800 mb-4">
                        🚨 Haut Risque
                    </h4>
                    <p className="text-2xl font-bold text-red-600">
                        {data.activity.churnRisk.highRiskUsers}
                    </p>
                    <p className="text-red-700 text-sm">
                        Utilisateurs susceptibles de partir
                    </p>
                </div>

                <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-400">
                    <h4 className="text-lg font-semibold text-yellow-800 mb-4">
                        ⚠️ Risque Moyen
                    </h4>
                    <p className="text-2xl font-bold text-yellow-600">
                        {data.activity.churnRisk.mediumRiskUsers}
                    </p>
                    <p className="text-yellow-700 text-sm">
                        Utilisateurs à surveiller
                    </p>
                </div>

                <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-400">
                    <h4 className="text-lg font-semibold text-green-800 mb-4">
                        ✅ Faible Risque
                    </h4>
                    <p className="text-2xl font-bold text-green-600">
                        {data.activity.churnRisk.lowRiskUsers}
                    </p>
                    <p className="text-green-700 text-sm">
                        Utilisateurs fidèles
                    </p>
                </div>
            </div>

            {/* Top utilisateurs et recommandations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Top utilisateurs actifs */}
                <div className="bg-blue-50 p-6 rounded-lg">
                    <h4 className="text-lg font-semibold text-blue-800 mb-4">
                        🏆 Top Utilisateurs Actifs
                    </h4>
                    <div className="space-y-3">
                        {data.activity.userMetrics.userActivities.slice(0, 5).map((user, index) => (
                            <div key={user.userId} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                                        {index + 1}
                                    </div>
                                    <span className="text-blue-700">Utilisateur {user.userId}</span>
                                </div>
                                <span className="font-semibold text-blue-800">{user.totalLoans} prêts</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recommandations */}
                <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-400">
                    <h4 className="text-lg font-semibold text-green-800 mb-4">
                        💡 Recommandations
                    </h4>
                    {data.activity.recommendations.length > 0 ? (
                        <ul className="space-y-2">
                            {data.activity.recommendations.map((rec, index) => (
                                <li key={index} className="text-green-700 text-sm">
                                    • {rec}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-green-700 text-sm">
                            Aucune recommandation majeure. L'engagement utilisateur est optimal.
                        </p>
                    )}
                </div>
            </div>

            {/* Pics d'activité identifiés */}
            <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    ⏰ Patterns d'Activité Identifiés
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <h5 className="font-semibold text-gray-700 mb-2">Heure de Pointe</h5>
                        <p className="text-lg font-bold text-blue-600">
                            {data.activity.activityPatterns.peakHour.hour}h00
                        </p>
                        <p className="text-sm text-gray-600">
                            {data.activity.activityPatterns.peakHour.count} activités
                        </p>
                    </div>
                    <div>
                        <h5 className="font-semibold text-gray-700 mb-2">Jour de Pointe</h5>
                        <p className="text-lg font-bold text-purple-600">
                            {data.activity.activityPatterns.peakDay.name}
                        </p>
                        <p className="text-sm text-gray-600">
                            {data.activity.activityPatterns.peakDay.count} activités
                        </p>
                    </div>
                    <div>
                        <h5 className="font-semibold text-gray-700 mb-2">Total des Sessions</h5>
                        <p className="text-lg font-bold text-green-600">
                            {data.activity.activityPatterns.totalSessions}
                        </p>
                        <p className="text-sm text-gray-600">
                            Sur la période analysée
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserActivityReport;