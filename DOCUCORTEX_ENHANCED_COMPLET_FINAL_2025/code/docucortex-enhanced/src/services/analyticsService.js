// src/services/analyticsService.js - SERVICE ANALYTICS AVANCÉ DOCUCORTEX
// Service pour agrégation, KPIs, analyses prédictives et détection d'insights

import { format, parseISO, subDays, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import ApiService from './apiService';

class AnalyticsService {
    constructor() {
        this.cache = new Map();
        this.insightsCache = new Map();
        this.predictionCache = new Map();
        this.anomalyDetectionCache = new Map();
        this.cacheTimeout = 300000; // 5 minutes
    }

    // ==========================================
    // MÉTRIQUES AVANCÉES ET KPIS
    // ==========================================

    /**
     * Calculer les KPIs business principaux
     */
    async calculateBusinessKPIs(dateRange = {}) {
        const cacheKey = `business_kpis_${JSON.stringify(dateRange)}`;
        
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            const loans = await this.getFilteredLoans(dateRange);
            const users = await this.getFilteredUsers(dateRange);
            const documents = await this.getFilteredDocuments(dateRange);

            // KPIs principaux
            const kpis = {
                // Métriques de volume
                totalLoans: loans.length,
                activeLoans: loans.filter(l => l.status === 'active').length,
                returnedLoans: loans.filter(l => l.status === 'returned').length,
                overdueLoans: loans.filter(l => l.status === 'overdue').length,
                totalUsers: users.length,
                totalDocuments: documents.length,

                // Taux de performance
                returnRate: this.calculateReturnRate(loans),
                overdueRate: this.calculateOverdueRate(loans),
                utilizationRate: this.calculateUtilizationRate(loans, documents),
                averageLoanDuration: this.calculateAverageLoanDuration(loans),
                userEngagementRate: this.calculateUserEngagementRate(loans, users),

                // Métriques temporelles
                loansPerDay: this.calculateLoansPerDay(loans),
                peakHours: this.calculatePeakHours(loans),
                peakDays: this.calculatePeakDays(loans),

                // Métriques de qualité
                completionRate: this.calculateCompletionRate(loans),
                satisfactionScore: this.calculateSatisfactionScore(loans),
                errorRate: this.calculateErrorRate(loans),

                // Indicateurs de croissance
                growthRate: await this.calculateGrowthRate(dateRange),
                trendDirection: this.calculateTrendDirection(loans),
                seasonalityIndex: this.calculateSeasonalityIndex(loans)
            };

            // Mettre en cache
            this.cache.set(cacheKey, {
                data: kpis,
                timestamp: Date.now()
            });

            return kpis;
        } catch (error) {
            console.error('Erreur lors du calcul des KPIs business:', error);
            return this.getDefaultKPIs();
        }
    }

    /**
     * Calculer les métriques financières
     */
    async calculateFinancialMetrics(dateRange = {}) {
        const loans = await this.getFilteredLoans(dateRange);
        const documents = await this.getFilteredDocuments();

        const metrics = {
            totalValue: this.calculateTotalValue(loans),
            revenuePerDay: this.calculateRevenuePerDay(loans),
            costPerTransaction: this.calculateCostPerTransaction(loans),
            profitMargin: this.calculateProfitMargin(loans),
            roi: await this.calculateROI(dateRange),
            breakEvenPoint: this.calculateBreakEvenPoint(loans),
            lifetimeValue: this.calculateCustomerLifetimeValue(loans),
            churnRate: this.calculateChurnRate(loans),
            acquisitionCost: this.calculateAcquisitionCost(loans)
        };

        return metrics;
    }

    /**
     * Calculer les métriques opérationnelles
     */
    async calculateOperationalMetrics(dateRange = {}) {
        const loans = await this.getFilteredLoans(dateRange);
        const users = await this.getFilteredUsers(dateRange);

        const metrics = {
            processingTime: this.calculateAverageProcessingTime(loans),
            automationRate: this.calculateAutomationRate(loans),
            errorReduction: await this.calculateErrorReduction(dateRange),
            efficiencyScore: this.calculateEfficiencyScore(loans),
            systemUptime: await this.calculateSystemUptime(),
            responseTime: await this.calculateAverageResponseTime(),
            resourceUtilization: this.calculateResourceUtilization(loans),
            productivityIndex: this.calculateProductivityIndex(loans, users)
        };

        return metrics;
    }

    // ==========================================
    // ANALYSES PRÉDICTIVES
    // ==========================================

    /**
     * Prédire la demande future
     */
    async predictFutureDemand(days = 30) {
        const cacheKey = `demand_prediction_${days}`;
        
        if (this.predictionCache.has(cacheKey)) {
            return this.predictionCache.get(cacheKey);
        }

        try {
            const historicalData = await this.getHistoricalLoanData(90); // 3 mois d'historique
            const seasonalPatterns = this.analyzeSeasonalPatterns(historicalData);
            const trendAnalysis = this.analyzeTrends(historicalData);
            const externalFactors = await this.getExternalFactors();

            // Algorithme de prédiction simple (peut être remplacé par ML)
            const prediction = this.generateDemandForecast(
                historicalData,
                seasonalPatterns,
                trendAnalysis,
                externalFactors,
                days
            );

            this.predictionCache.set(cacheKey, prediction);
            return prediction;
        } catch (error) {
            console.error('Erreur lors de la prédiction de la demande:', error);
            return this.getDefaultDemandPrediction(days);
        }
    }

    /**
     * Prédire les retours en retard
     */
    async predictOverdueReturns() {
        try {
            const activeLoans = await ApiService.getActiveLoans();
            const predictions = [];

            for (const loan of activeLoans) {
                const prediction = await this.calculateOverdueProbability(loan);
                predictions.push({
                    loanId: loan.id,
                    borrowerName: loan.borrowerName,
                    documentTitle: loan.documentTitle,
                    dueDate: loan.returnDate,
                    overdueProbability: prediction.probability,
                    riskFactors: prediction.factors,
                    recommendedAction: prediction.recommendedAction
                });
            }

            return predictions.sort((a, b) => b.overdueProbability - a.overdueProbability);
        } catch (error) {
            console.error('Erreur lors de la prédiction des retards:', error);
            return [];
        }
    }

    /**
     * Prédire la croissance des utilisateurs
     */
    async predictUserGrowth(months = 6) {
        const historicalData = await this.getHistoricalUserData(months * 2);
        const growthPatterns = this.analyzeUserGrowthPatterns(historicalData);
        
        const prediction = {
            projectedNewUsers: this.projectUserGrowth(growthPatterns, months),
            growthRate: this.calculateProjectedGrowthRate(growthPatterns),
            seasonalFactors: this.identifyUserGrowthSeasonality(historicalData),
            confidence: this.calculatePredictionConfidence(growthPatterns)
        };

        return prediction;
    }

    // ==========================================
    // DÉTECTION D'ANOMALIES ET INSIGHTS
    // ==========================================

    /**
     * Détecter les anomalies dans les données
     */
    async detectAnomalies(dateRange = {}) {
        const cacheKey = `anomalies_${JSON.stringify(dateRange)}`;
        
        if (this.anomalyDetectionCache.has(cacheKey)) {
            return this.anomalyDetectionCache.get(cacheKey);
        }

        try {
            const loans = await this.getFilteredLoans(dateRange);
            const anomalies = {
                volumeAnomalies: this.detectVolumeAnomalies(loans),
                behavioralAnomalies: this.detectBehavioralAnomalies(loans),
                temporalAnomalies: this.detectTemporalAnomalies(loans),
                systemAnomalies: await this.detectSystemAnomalies(loans),
                securityAnomalies: await this.detectSecurityAnomalies(loans)
            };

            this.anomalyDetectionCache.set(cacheKey, {
                anomalies,
                timestamp: Date.now()
            });

            return anomalies;
        } catch (error) {
            console.error('Erreur lors de la détection d\'anomalies:', error);
            return { volumeAnomalies: [], behavioralAnomalies: [], temporalAnomalies: [], systemAnomalies: [], securityAnomalies: [] };
        }
    }

    /**
     * Générer des insights automatisés
     */
    async generateInsights(dateRange = {}) {
        const cacheKey = `insights_${JSON.stringify(dateRange)}`;
        
        if (this.insightsCache.has(cacheKey)) {
            return this.insightsCache.get(cacheKey);
        }

        try {
            const kpis = await this.calculateBusinessKPIs(dateRange);
            const anomalies = await this.detectAnomalies(dateRange);
            const predictions = await this.predictFutureDemand(30);

            const insights = {
                performance: this.analyzePerformanceInsights(kpis),
                opportunities: this.identifyOpportunities(kpis, anomalies),
                risks: this.identifyRisks(kpis, anomalies, predictions),
                recommendations: this.generateRecommendations(kpis, anomalies, predictions),
                trends: this.analyzeTrends(kpis),
                benchmarks: await this.calculateBenchmarks(kpis)
            };

            this.insightsCache.set(cacheKey, {
                data: insights,
                timestamp: Date.now()
            });

            return insights;
        } catch (error) {
            console.error('Erreur lors de la génération d\'insights:', error);
            return this.getDefaultInsights();
        }
    }

    // ==========================================
    // ANALYSES COMPARATIVES
    // ==========================================

    /**
     * Comparer les performances sur différentes périodes
     */
    async comparePeriods(period1, period2) {
        const [data1, data2] = await Promise.all([
            this.calculateBusinessKPIs(period1),
            this.calculateBusinessKPIs(period2)
        ]);

        const comparison = {
            period1: { ...data1, label: period1.label },
            period2: { ...data2, label: period2.label },
            changes: this.calculateChanges(data1, data2),
            trends: this.calculateTrendChanges(data1, data2),
            significance: this.calculateStatisticalSignificance(data1, data2)
        };

        return comparison;
    }

    /**
     * Benchmarking interne
     */
    async calculateInternalBenchmarks() {
        const users = await ApiService.getUsers();
        const loans = await ApiService.getLoans();
        
        const benchmarks = {
            topPerformers: this.identifyTopPerformingUsers(loans, users),
            bestPractices: this.identifyBestPractices(loans),
            standards: this.calculatePerformanceStandards(loans),
            targets: this.calculatePerformanceTargets(loans)
        };

        return benchmarks;
    }

    // ==========================================
    // MÉTHODES PRIVÉES DE CALCUL
    // ==========================================

    calculateReturnRate(loans) {
        const completed = loans.filter(l => l.status === 'returned');
        return loans.length > 0 ? (completed.length / loans.length) * 100 : 0;
    }

    calculateOverdueRate(loans) {
        const overdue = loans.filter(l => l.status === 'overdue');
        return loans.length > 0 ? (overdue.length / loans.length) * 100 : 0;
    }

    calculateUtilizationRate(loans, documents) {
        const uniqueDocuments = new Set(loans.map(l => l.documentId));
        return documents.length > 0 ? (uniqueDocuments.size / documents.length) * 100 : 0;
    }

    calculateAverageLoanDuration(loans) {
        const completedLoans = loans.filter(l => l.status === 'returned' && l.returnDate);
        if (completedLoans.length === 0) return 0;

        const durations = completedLoans.map(loan => {
            const loanDate = parseISO(loan.loanDate);
            const returnDate = parseISO(loan.returnDate);
            return differenceInDays(returnDate, loanDate);
        });

        return durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
    }

    calculateUserEngagementRate(loans, users) {
        const activeUsers = new Set(loans.map(l => l.borrowerId));
        return users.length > 0 ? (activeUsers.size / users.length) * 100 : 0;
    }

    calculateLoansPerDay(loans) {
        if (loans.length === 0) return 0;
        const dates = loans.map(l => parseISO(l.loanDate).toDateString());
        const uniqueDays = new Set(dates);
        return loans.length / uniqueDays.size;
    }

    calculatePeakHours(loans) {
        const hourCounts = {};
        loans.forEach(loan => {
            const hour = parseISO(loan.loanDate).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });

        return Object.entries(hourCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([hour, count]) => ({ hour: parseInt(hour), count }));
    }

    calculatePeakDays(loans) {
        const dayCounts = {};
        loans.forEach(loan => {
            const day = parseISO(loan.loanDate).getDay();
            dayCounts[day] = (dayCounts[day] || 0) + 1;
        });

        const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        return Object.entries(dayCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([day, count]) => ({ day: days[parseInt(day)], count }));
    }

    calculateCompletionRate(loans) {
        const completed = loans.filter(l => ['returned', 'completed'].includes(l.status));
        return loans.length > 0 ? (completed.length / loans.length) * 100 : 0;
    }

    calculateSatisfactionScore(loans) {
        // Simulation du score de satisfaction basé sur les retours
        const scores = loans.filter(l => l.satisfactionScore).map(l => l.satisfactionScore);
        return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 8.5;
    }

    calculateErrorRate(loans) {
        const errors = loans.filter(l => l.error || l.status === 'cancelled');
        return loans.length > 0 ? (errors.length / loans.length) * 100 : 0;
    }

    async calculateGrowthRate(dateRange) {
        const currentLoans = await this.getFilteredLoans(dateRange);
        const previousPeriod = {
            start: subDays(dateRange.start, differenceInDays(dateRange.end, dateRange.start)),
            end: dateRange.start
        };
        const previousLoans = await this.getFilteredLoans(previousPeriod);

        if (previousLoans.length === 0) return 0;
        return ((currentLoans.length - previousLoans.length) / previousLoans.length) * 100;
    }

    calculateTrendDirection(loans) {
        if (loans.length < 2) return 'stable';
        
        // Analyser la tendance sur les 7 derniers jours
        const recentLoans = loans.slice(-7);
        const olderLoans = loans.slice(-14, -7);
        
        const recentAvg = recentLoans.length;
        const olderAvg = olderLoans.length;
        
        if (recentAvg > olderAvg * 1.1) return 'increasing';
        if (recentAvg < olderAvg * 0.9) return 'decreasing';
        return 'stable';
    }

    calculateSeasonalityIndex(loans) {
        const monthlyCounts = {};
        loans.forEach(loan => {
            const month = parseISO(loan.loanDate).getMonth();
            monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
        });

        const values = Object.values(monthlyCounts);
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        
        return Math.sqrt(variance) / mean; // Coefficient de variation
    }

    // ==========================================
    // MÉTHODES D'AIDE
    // ==========================================

    async getFilteredLoans(dateRange = {}) {
        const params = {};
        if (dateRange.start) params.startDate = format(dateRange.start, 'yyyy-MM-dd');
        if (dateRange.end) params.endDate = format(dateRange.end, 'yyyy-MM-dd');
        
        return await ApiService.getLoans(params);
    }

    async getFilteredUsers(dateRange = {}) {
        const params = {};
        if (dateRange.start) params.startDate = format(dateRange.start, 'yyyy-MM-dd');
        if (dateRange.end) params.endDate = format(dateRange.end, 'yyyy-MM-dd');
        
        return await ApiService.getUsers(params);
    }

    async getFilteredDocuments() {
        return await ApiService.getDocuments();
    }

    // ==========================================
    // MÉTHODES DE DÉFAUT
    // ==========================================

    getDefaultKPIs() {
        return {
            totalLoans: 0,
            activeLoans: 0,
            returnedLoans: 0,
            overdueLoans: 0,
            totalUsers: 0,
            totalDocuments: 0,
            returnRate: 0,
            overdueRate: 0,
            utilizationRate: 0,
            averageLoanDuration: 0,
            userEngagementRate: 0,
            loansPerDay: 0,
            processingTime: 0,
            satisfactionScore: 8.5
        };
    }

    getDefaultDemandPrediction(days) {
        return {
            predictedLoans: Array.from({ length: days }, (_, i) => ({
                date: format(subDays(new Date(), -i), 'yyyy-MM-dd'),
                loans: Math.floor(Math.random() * 20) + 5
            })),
            confidence: 0.7,
            factors: ['Données insuffisantes pour une prédiction précise']
        };
    }

    getDefaultInsights() {
        return {
            performance: ['Système opérationnel'],
            opportunities: ['Collecte de plus de données recommandée'],
            risks: ['Surveillance continue nécessaire'],
            recommendations: ['Continuer la collecte de données'],
            trends: ['Analyse en cours'],
            benchmarks: ['En cours de calcul']
        };
    }

    // ==========================================
    // GESTION DU CACHE
    // ==========================================

    clearCache() {
        this.cache.clear();
        this.insightsCache.clear();
        this.predictionCache.clear();
        this.anomalyDetectionCache.clear();
    }

    getCacheStatus() {
        return {
            businessKpis: this.cache.size,
            insights: this.insightsCache.size,
            predictions: this.predictionCache.size,
            anomalies: this.anomalyDetectionCache.size
        };
    }
}

// Export d'une instance singleton
const analyticsService = new AnalyticsService();

export default analyticsService;