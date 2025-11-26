// src/services/aiService.js - SERVICE D'INTELLIGENCE ARTIFICIELLE DOCUCORTEX
// Moteur IA pour prédictions et recommandations intelligentes

import { format, parseISO, differenceInDays, addDays, getMonth, getDay, getHours } from 'date-fns';
import apiService from './apiService';

const AI_STORAGE_KEYS = {
    MODELS: 'docucortex_ai_models',
    PREDICTIONS: 'docucortex_ai_predictions',
    RECOMMENDATIONS: 'docucortex_ai_recommendations',
    USER_CLUSTERS: 'docucortex_ai_user_clusters',
    SEASONAL_PATTERNS: 'docucortex_seasonal_patterns',
    TRAINING_DATA: 'docucortex_ai_training_data',
    ANOMALIES: 'docucortex_ai_anomalies'
};

const AI_CONFIG = {
    MODEL_UPDATE_INTERVAL: 24 * 60 * 60 * 1000, // 24h
    PREDICTION_CONFIDENCE_THRESHOLD: 0.7,
    ANOMALY_SENSITIVITY: 0.8,
    CLUSTERING_ALGORITHM: 'kmeans',
    DEFAULT_CLUSTERS: 5,
    FEATURE_WEIGHTS: {
        loanFrequency: 0.3,
        returnTime: 0.25,
        documentType: 0.2,
        seasonal: 0.15,
        userBehavior: 0.1
    }
};

// Types de prédictions
const PREDICTION_TYPES = {
    LOAN_DEMAND: 'loan_demand',
    RETURN_DELAY: 'return_delay',
    EQUIPMENT_REPLACEMENT: 'equipment_replacement',
    USER_SATISFACTION: 'user_satisfaction',
    SEASONAL_TRENDS: 'seasonal_trends'
};

// Types d'anomalies
const ANOMALY_TYPES = {
    UNUSUAL_BORROWING_PATTERN: 'unusual_borrowing_pattern',
    EXTENDED_LOAN_TIME: 'extended_loan_time',
    HIGH_RETURN_DELAY: 'high_return_delay',
    EQUIPMENT_ABUSE: 'equipment_abuse',
    FRAUDULENT_ACTIVITY: 'fraudulent_activity'
};

// Types de recommandations
const RECOMMENDATION_TYPES = {
    EQUIPMENT_SUGGESTION: 'equipment_suggestion',
    MAINTENANCE_SCHEDULE: 'maintenance_schedule',
    LOAN_POLICY_UPDATE: 'loan_policy_update',
    CAPACITY_OPTIMIZATION: 'capacity_optimization',
    USER_EDUCATION: 'user_education'
};

class AIService {
    constructor() {
        this.models = new Map();
        this.predictions = new Map();
        this.isTraining = false;
        this.initialized = false;
        this.init();
    }

    // 🚀 Initialisation du service IA
    async init() {
        try {
            console.log('🧠 Initialisation du service IA DocuCortex...');
            
            await this.loadStoredModels();
            await this.loadTrainingData();
            await this.analyzeSeasonalPatterns();
            
            // Démarrer l'entraînement périodique
            this.schedulePeriodicTraining();
            
            this.initialized = true;
            console.log('✅ Service IA DocuCortex initialisé');
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation de l\'IA:', error);
        }
    }

    // 📊 CHARGEAMENTO ET SAUVEGARDE DES MODÈLES

    // Charger les modèles depuis le stockage
    async loadStoredModels() {
        try {
            const stored = localStorage.getItem(AI_STORAGE_KEYS.MODELS);
            if (stored) {
                const modelsData = JSON.parse(stored);
                for (const [modelName, modelData] of Object.entries(modelsData)) {
                    this.models.set(modelName, modelData);
                }
                console.log(`📦 ${this.models.size} modèles IA chargés`);
            }
        } catch (error) {
            console.warn('⚠️ Impossible de charger les modèles:', error);
        }
    }

    // Sauvegarder les modèles
    saveModels() {
        try {
            const modelsData = Object.fromEntries(this.models);
            localStorage.setItem(AI_STORAGE_KEYS.MODELS, JSON.stringify(modelsData));
            console.log('💾 Modèles IA sauvegardés');
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde des modèles:', error);
        }
    }

    // 📈 ANALYSE DES PATTERNS DE PRÊTS

    // Analyser les patterns historiques de prêts
    async analyzeLoanPatterns(loans = null) {
        try {
            if (!loans) {
                loans = await apiService.getLoans();
            }

            const patterns = {
                frequency: this.calculateLoanFrequency(loans),
                seasonalTrends: this.analyzeSeasonalTrends(loans),
                userBehavior: this.analyzeUserBehavior(loans),
                documentPreferences: this.analyzeDocumentPreferences(loans),
                returnPatterns: this.analyzeReturnPatterns(loans)
            };

            console.log('📈 Patterns de prêts analysés');
            return patterns;
        } catch (error) {
            console.error('❌ Erreur lors de l\'analyse des patterns:', error);
            return null;
        }
    }

    // Calculer la fréquence des prêts
    calculateLoanFrequency(loans) {
        const frequencyByUser = {};
        const frequencyByDocument = {};
        
        loans.forEach(loan => {
            // Par utilisateur
            const userId = loan.borrowerId || loan.borrower?.id;
            if (userId) {
                frequencyByUser[userId] = (frequencyByUser[userId] || 0) + 1;
            }
            
            // Par document
            const docId = loan.documentId || loan.document?.id;
            if (docId) {
                frequencyByDocument[docId] = (frequencyByDocument[docId] || 0) + 1;
            }
        });

        return {
            byUser: frequencyByUser,
            byDocument: frequencyByDocument,
            averageDailyLoans: loans.length / 30, // Approximation
            peakHours: this.calculatePeakHours(loans)
        };
    }

    // Analyser les tendances saisonnières
    analyzeSeasonalTrends(loans) {
        const monthlyData = {};
        const dailyData = {};
        
        loans.forEach(loan => {
            const loanDate = parseISO(loan.loanDate);
            const month = getMonth(loanDate);
            const dayOfWeek = getDay(loanDate);
            
            monthlyData[month] = (monthlyData[month] || 0) + 1;
            dailyData[dayOfWeek] = (dailyData[dayOfWeek] || 0) + 1;
        });

        const peakMonth = Object.keys(monthlyData).reduce((a, b) => 
            monthlyData[a] > monthlyData[b] ? a : b, '0');
        const peakDay = Object.keys(dailyData).reduce((a, b) => 
            dailyData[a] > dailyData[b] ? a : b, '0');

        return {
            monthlyDistribution: monthlyData,
            dailyDistribution: dailyData,
            peakMonth: parseInt(peakMonth),
            peakDay: parseInt(peakDay),
            seasonalityScore: this.calculateSeasonalityScore(monthlyData)
        };
    }

    // Calculer les heures de pointe
    calculatePeakHours(loans) {
        const hourDistribution = {};
        
        loans.forEach(loan => {
            const loanDate = parseISO(loan.loanDate);
            const hour = getHours(loanDate);
            hourDistribution[hour] = (hourDistribution[hour] || 0) + 1;
        });

        const sortedHours = Object.entries(hourDistribution)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([hour]) => parseInt(hour));

        return sortedHours;
    }

    // 🎯 PRÉDICTIONS INTELLIGENTES

    // Prédire la demande d'équipements
    async predictEquipmentDemand(documentId = null, daysAhead = 30) {
        try {
            const loans = await apiService.getLoans();
            const historicalPatterns = await this.analyzeLoanPatterns(loans);
            
            let predictions = [];
            
            if (documentId) {
                // Prédiction pour un document spécifique
                const docLoans = loans.filter(l => 
                    (l.documentId || l.document?.id) === documentId);
                predictions = this.predictSingleDocumentDemand(docLoans, daysAhead);
            } else {
                // Prédiction pour tous les documents
                const documentIds = [...new Set(loans.map(l => 
                    l.documentId || l.document?.id).filter(Boolean))];
                
                for (const docId of documentIds) {
                    const docLoans = loans.filter(l => 
                        (l.documentId || l.document?.id) === docId);
                    const prediction = this.predictSingleDocumentDemand(docLoans, daysAhead);
                    predictions.push(...prediction);
                }
            }

            return {
                predictions,
                confidence: this.calculatePredictionConfidence(predictions),
                generatedAt: new Date().toISOString(),
                timeframe: daysAhead
            };
        } catch (error) {
            console.error('❌ Erreur lors de la prédiction de demande:', error);
            return null;
        }
    }

    // Prédire la demande pour un document spécifique
    predictSingleDocumentDemand(documentLoans, daysAhead) {
        if (documentLoans.length === 0) return [];

        const frequency = documentLoans.length / 30; // Prêts par mois
        const dailyAverage = frequency / 30;
        const seasonalFactor = this.getSeasonalFactor();
        
        const predictions = [];
        
        for (let day = 1; day <= daysAhead; day++) {
            const predictedDate = addDays(new Date(), day);
            const dayOfWeek = getDay(predictedDate);
            const dayFactor = this.getDayOfWeekFactor(dayOfWeek);
            
            const predictedDemand = dailyAverage * seasonalFactor * dayFactor;
            
            predictions.push({
                documentId: documentLoans[0].documentId || documentLoans[0].document?.id,
                predictedDate: predictedDate.toISOString(),
                predictedLoans: Math.round(predictedDemand * 100) / 100,
                confidence: this.calculateDemandConfidence(documentLoans),
                factors: {
                    seasonal: seasonalFactor,
                    daily: dayFactor,
                    historical: frequency
                }
            });
        }

        return predictions;
    }

    // Prédire les retards de retour
    async predictReturnDelays(userId = null, daysAhead = 14) {
        try {
            const loans = await apiService.getLoans();
            let relevantLoans = loans;
            
            if (userId) {
                relevantLoans = loans.filter(l => 
                    (l.borrowerId || l.borrower?.id) === userId);
            }

            const activeLoans = relevantLoans.filter(l => l.status === 'active');
            const predictions = [];

            for (const loan of activeLoans) {
                const delayPrediction = this.predictSingleLoanDelay(loan, daysAhead);
                if (delayPrediction.probability > 0.1) {
                    predictions.push(delayPrediction);
                }
            }

            return {
                predictions: predictions.sort((a, b) => b.probability - a.probability),
                totalAnalyzed: relevantLoans.length,
                highRiskCount: predictions.filter(p => p.probability > 0.7).length,
                generatedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Erreur lors de la prédiction des retards:', error);
            return null;
        }
    }

    // Prédire le retard pour un prêt individuel
    predictSingleLoanDelay(loan, daysAhead) {
        const borrowerId = loan.borrowerId || loan.borrower?.id;
        const userHistory = this.getUserReturnHistory(borrowerId);
        
        // Facteurs de risque
        const factors = {
            historicalDelays: userHistory.avgDelay / 7, // Normalisé
            loanDuration: differenceInDays(parseISO(loan.returnDate), parseISO(loan.loanDate)) / 7,
            documentType: this.getDocumentTypeRiskFactor(loan.documentId),
            dayOfWeek: this.getDayOfWeekDelayFactor(loan.returnDate),
            seasonal: this.getSeasonalDelayFactor()
        };

        // Calcul de probabilité (algorithme simplifié)
        let probability = 0;
        probability += factors.historicalDelays * 0.4;
        probability += factors.documentType * 0.2;
        probability += factors.loanDuration > 14 ? 0.2 : 0.1;
        probability += factors.dayOfWeek * 0.1;
        probability += factors.seasonal * 0.1;

        probability = Math.min(probability, 0.95); // Plafond à 95%
        
        return {
            loanId: loan.id,
            borrowerId,
            probability: Math.round(probability * 100) / 100,
            riskLevel: this.getRiskLevel(probability),
            factors,
            recommendedActions: this.getRecommendedActions(probability, loan),
            predictedDelayDays: Math.round(probability * 7), // Estimation
            generatedAt: new Date().toISOString()
        };
    }

    // 🤖 CLUSTERING DES UTILISATEURS

    // Analyser les comportements utilisateur et créer des clusters
    async performUserClustering() {
        try {
            const loans = await apiService.getLoans();
            const userProfiles = this.createUserProfiles(loans);
            const clusters = this.performClustering(userProfiles);
            
            // Stocker les clusters
            localStorage.setItem(AI_STORAGE_KEYS.USER_CLUSTERS, JSON.stringify(clusters));
            
            console.log(`👥 Clustering effectué: ${clusters.length} clusters créés`);
            return clusters;
        } catch (error) {
            console.error('❌ Erreur lors du clustering:', error);
            return null;
        }
    }

    // Créer les profils utilisateur
    createUserProfiles(loans) {
        const profiles = {};
        
        loans.forEach(loan => {
            const userId = loan.borrowerId || loan.borrower?.id;
            if (!userId) return;
            
            if (!profiles[userId]) {
                profiles[userId] = {
                    userId,
                    totalLoans: 0,
                    averageLoanDuration: 0,
                    returnDelayRate: 0,
                    documentPreferences: {},
                    activeLoans: 0,
                    completionRate: 0
                };
            }
            
            const profile = profiles[userId];
            profile.totalLoans++;
            
            // Calcul de la durée moyenne
            const duration = differenceInDays(
                parseISO(loan.returnDate || new Date()),
                parseISO(loan.loanDate)
            );
            profile.averageLoanDuration = 
                (profile.averageLoanDuration + duration) / 2;
            
            // Préférences de documents
            const docType = loan.documentType || loan.document?.category || 'unknown';
            profile.documentPreferences[docType] = 
                (profile.documentPreferences[docType] || 0) + 1;
            
            // Prêts actifs
            if (loan.status === 'active') {
                profile.activeLoans++;
            }
        });
        
        return Object.values(profiles);
    }

    // Effectuer le clustering (K-means simplifié)
    performClustering(profiles) {
        const k = AI_CONFIG.DEFAULT_CLUSTERS;
        const features = profiles.map(p => [
            p.totalLoans / 50, // Normalisé
            p.averageLoanDuration / 30,
            p.returnDelayRate,
            Object.keys(p.documentPreferences).length / 10,
            p.activeLoans / 10
        ]);
        
        // Initialisation aléatoire des centroïdes
        const centroids = this.initializeCentroids(k, features[0].length);
        
        // Itérations K-means (simplifié)
        for (let iter = 0; iter < 10; iter++) {
            const assignments = this.assignToClusters(features, centroids);
            centroids = this.updateCentroids(features, assignments, k);
        }
        
        // Créer les clusters finaux
        const assignments = this.assignToClusters(features, centroids);
        const clusters = [];
        
        for (let i = 0; i < k; i++) {
            const clusterProfiles = profiles.filter((_, index) => assignments[index] === i);
            
            if (clusterProfiles.length > 0) {
                clusters.push({
                    clusterId: i,
                    users: clusterProfiles,
                    size: clusterProfiles.length,
                    characteristics: this.analyzeClusterCharacteristics(clusterProfiles),
                    recommendations: this.getClusterRecommendations(clusterProfiles, i)
                });
            }
        }
        
        return clusters;
    }

    // 🔍 DÉTECTION D'ANOMALIES

    // Détecter les anomalies dans les données de prêts
    async detectAnomalies() {
        try {
            const loans = await apiService.getLoans();
            const anomalies = [];
            
            // Détecter les patterns de prêt inhabituels
            const userPatterns = this.analyzeUserPatterns(loans);
            for (const pattern of userPatterns) {
                if (pattern.anomalyScore > AI_CONFIG.ANOMALY_SENSITIVITY) {
                    anomalies.push({
                        type: ANOMALY_TYPES.UNUSUAL_BORROWING_PATTERN,
                        userId: pattern.userId,
                        severity: this.getAnomalySeverity(pattern.anomalyScore),
                        description: pattern.description,
                        detectedAt: new Date().toISOString(),
                        evidence: pattern.evidence
                    });
                }
            }
            
            // Détecter les prêts exceptionnellement longs
            const extendedLoans = this.detectExtendedLoans(loans);
            anomalies.push(...extendedLoans);
            
            // Sauvegarder les anomalies
            localStorage.setItem(AI_STORAGE_KEYS.ANOMALIES, JSON.stringify(anomalies));
            
            console.log(`🔍 ${anomalies.length} anomalies détectées`);
            return anomalies;
        } catch (error) {
            console.error('❌ Erreur lors de la détection d\'anomalies:', error);
            return [];
        }
    }

    // Détecter les prêts exceptionnellement longs
    detectExtendedLoans(loans) {
        const anomalies = [];
        const loanDurations = loans.map(l => 
            differenceInDays(
                parseISO(l.returnDate || new Date()),
                parseISO(l.loanDate)
            )
        );
        
        const avgDuration = loanDurations.reduce((a, b) => a + b) / loanDurations.length;
        const stdDev = Math.sqrt(
            loanDurations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / loanDurations.length
        );
        
        loans.forEach(loan => {
            const duration = differenceInDays(
                parseISO(loan.returnDate || new Date()),
                parseISO(loan.loanDate)
            );
            
            if (duration > avgDuration + 2 * stdDev) {
                anomalies.push({
                    type: ANOMALY_TYPES.EXTENDED_LOAN_TIME,
                    loanId: loan.id,
                    userId: loan.borrowerId || loan.borrower?.id,
                    severity: 'high',
                    description: `Prêt exceptionnellement long: ${duration} jours (moyenne: ${Math.round(avgDuration)})`,
                    detectedAt: new Date().toISOString(),
                    duration,
                    averageDuration: Math.round(avgDuration)
                });
            }
        });
        
        return anomalies;
    }

    // 💡 GÉNÉRATION DE RECOMMANDATIONS

    // Générer des recommandations personnalisées
    async generatePersonalizedRecommendations(userId, recommendationTypes = null) {
        try {
            const loans = await apiService.getLoans();
            const userLoans = userId ? 
                loans.filter(l => (l.borrowerId || l.borrower?.id) === userId) : 
                loans;
            
            const recommendations = [];
            
            // Recommandations d'équipements
            if (!recommendationTypes || recommendationTypes.includes(RECOMMENDATION_TYPES.EQUIPMENT_SUGGESTION)) {
                const equipmentRecs = this.generateEquipmentRecommendations(userLoans);
                recommendations.push(...equipmentRecs);
            }
            
            // Recommandations de maintenance
            if (!recommendationTypes || recommendationTypes.includes(RECOMMENDATION_TYPES.MAINTENANCE_SCHEDULE)) {
                const maintenanceRecs = this.generateMaintenanceRecommendations(loans);
                recommendations.push(...maintenanceRecs);
            }
            
            // Optimisation de capacité
            if (!recommendationTypes || recommendationTypes.includes(RECOMMENDATION_TYPES.CAPACITY_OPTIMIZATION)) {
                const capacityRecs = await this.generateCapacityOptimizations();
                recommendations.push(...capacityRecs);
            }
            
            // Stocker les recommandations
            const recKey = userId ? `user_${userId}` : 'global';
            const stored = JSON.parse(localStorage.getItem(AI_STORAGE_KEYS.RECOMMENDATIONS) || '{}');
            stored[recKey] = recommendations;
            localStorage.setItem(AI_STORAGE_KEYS.RECOMMENDATIONS, JSON.stringify(stored));
            
            console.log(`💡 ${recommendations.length} recommandations générées`);
            return recommendations;
        } catch (error) {
            console.error('❌ Erreur lors de la génération des recommandations:', error);
            return [];
        }
    }

    // Générer des recommandations d'équipements
    generateEquipmentRecommendations(userLoans) {
        if (userLoans.length === 0) return [];
        
        const documentPreferences = {};
        userLoans.forEach(loan => {
            const docType = loan.documentType || loan.document?.category || 'unknown';
            documentPreferences[docType] = (documentPreferences[docType] || 0) + 1;
        });
        
        const topPreferences = Object.entries(documentPreferences)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);
        
        return topPreferences.map(([docType, count], index) => ({
            type: RECOMMENDATION_TYPES.EQUIPMENT_SUGGESTION,
            priority: index === 0 ? 'high' : 'medium',
            title: `Considérez plus de prêts de type: ${docType}`,
            description: `Vous empruntez fréquemment des documents de type "${docType}" (${count} fois). Nous recommandons d'explorer d'autres documents similaires.`,
            impact: 'personal',
            generatedAt: new Date().toISOString(),
            confidence: Math.min(0.9, count / userLoans.length + 0.5),
            actions: [
                'Voir les documents similaires',
                'Sauvegarder en favoris',
                'Configurer des alertes'
            ]
        }));
    }

    // 🎯 OPTIMISATION DES RESSOURCES

    // Optimiser l'utilisation des ressources
    async optimizeResourceUtilization() {
        try {
            const loans = await apiService.getLoans();
            const utilization = this.calculateUtilizationPatterns(loans);
            const optimizations = [];
            
            // Optimisation des horaires
            const timeOptimizations = this.optimizeTimeSlots(utilization);
            optimizations.push(...timeOptimizations);
            
            // Optimisation de stock
            const stockOptimizations = this.optimizeStockLevels(utilization);
            optimizations.push(...stockOptimizations);
            
            console.log(`⚡ ${optimizations.length} optimisations identifiées`);
            return optimizations;
        } catch (error) {
            console.error('❌ Erreur lors de l\'optimisation:', error);
            return [];
        }
    }

    // Calculer les patterns d'utilisation
    calculateUtilizationPatterns(loans) {
        const hourlyUtilization = {};
        const dailyUtilization = {};
        const documentUtilization = {};
        
        loans.forEach(loan => {
            const loanDate = parseISO(loan.loanDate);
            const hour = getHours(loanDate);
            const dayOfWeek = getDay(loanDate);
            const docId = loan.documentId || loan.document?.id;
            
            hourlyUtilization[hour] = (hourlyUtilization[hour] || 0) + 1;
            dailyUtilization[dayOfWeek] = (dailyUtilization[dayOfWeek] || 0) + 1;
            
            if (docId) {
                documentUtilization[docId] = (documentUtilization[docId] || 0) + 1;
            }
        });
        
        return {
            hourly: hourlyUtilization,
            daily: dailyUtilization,
            documents: documentUtilization
        };
    }

    // 📚 ENTRAÎNEMENT ET AMÉLIORATION DU MODÈLE

    // Entraîner les modèles avec de nouvelles données
    async trainModels() {
        if (this.isTraining) {
            console.log('⚠️ Entraînement déjà en cours...');
            return;
        }
        
        this.isTraining = true;
        
        try {
            console.log('🎓 Début de l\'entraînement des modèles IA...');
            
            const loans = await apiService.getLoans();
            
            // Entraîner le modèle de prédiction de demande
            await this.trainDemandPredictionModel(loans);
            
            // Entraîner le modèle de détection d'anomalies
            await this.trainAnomalyDetectionModel(loans);
            
            // Mettre à jour les patterns saisonniers
            await this.updateSeasonalPatterns(loans);
            
            // Sauvegarder les modèles mis à jour
            this.saveModels();
            
            console.log('✅ Entraînement des modèles terminé');
        } catch (error) {
            console.error('❌ Erreur lors de l\'entraînement:', error);
        } finally {
            this.isTraining = false;
        }
    }

    // 🔄 PLANIFICATION DE L'ENTRAÎNEMENT

    // Programmer l'entraînement périodique
    schedulePeriodicTraining() {
        setInterval(() => {
            if (!this.isTraining && this.initialized) {
                this.trainModels();
            }
        }, AI_CONFIG.MODEL_UPDATE_INTERVAL);
        
        console.log('⏰ Entraînement périodique programmé (24h)');
    }

    // Charger les données d'entraînement
    async loadTrainingData() {
        try {
            const stored = localStorage.getItem(AI_STORAGE_KEYS.TRAINING_DATA);
            if (stored) {
                const trainingData = JSON.parse(stored);
                console.log(`📚 ${Object.keys(trainingData).length} datasets d'entraînement chargés`);
            }
        } catch (error) {
            console.warn('⚠️ Impossible de charger les données d\'entraînement:', error);
        }
    }

    // 🛠️ UTILITAIRES ET FACTEURS

    // Calculer le facteur saisonnier
    getSeasonalFactor() {
        const month = getMonth(new Date());
        const seasonalMultipliers = [1.1, 1.0, 0.9, 1.0, 1.1, 0.8, 0.7, 0.8, 1.0, 1.2, 1.3, 1.1];
        return seasonalMultipliers[month];
    }

    // Calculer le facteur jour de la semaine
    getDayOfWeekFactor(dayOfWeek) {
        const dayFactors = [0.8, 1.2, 1.3, 1.2, 1.1, 0.9, 0.7]; // Lun-Dim
        return dayFactors[dayOfWeek];
    }

    // Obtenir l'historique de retour d'un utilisateur
    getUserReturnHistory(userId) {
        // Simuler l'historique (à remplacer par de vraies données)
        return {
            avgDelay: Math.random() * 7, // Jours de retard moyen
            onTimeRate: 0.7 + Math.random() * 0.3,
            totalLoans: Math.floor(Math.random() * 50) + 10
        };
    }

    // Calculer la confiance de prédiction
    calculatePredictionConfidence(predictions) {
        if (predictions.length === 0) return 0;
        
        const confidenceScores = predictions.map(p => p.confidence || 0.5);
        const avgConfidence = confidenceScores.reduce((a, b) => a + b) / confidenceScores.length;
        
        return Math.round(avgConfidence * 100) / 100;
    }

    // 🧹 NETTOYAGE ET MAINTENANCE

    // Nettoyer les anciennes données
    cleanup() {
        try {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            
            // Nettoyer les prédictions anciennes
            const stored = localStorage.getItem(AI_STORAGE_KEYS.PREDICTIONS);
            if (stored) {
                const predictions = JSON.parse(stored);
                const recentPredictions = predictions.filter(p => 
                    new Date(p.generatedAt) > thirtyDaysAgo
                );
                localStorage.setItem(AI_STORAGE_KEYS.PREDICTIONS, JSON.stringify(recentPredictions));
            }
            
            console.log('🧹 Nettoyage des données IA effectué');
        } catch (error) {
            console.error('❌ Erreur lors du nettoyage:', error);
        }
    }

    // 📊 STATISTIQUES ET MÉTRIQUES

    // Obtenir les statistiques du service IA
    getAIStatistics() {
        return {
            modelsLoaded: this.models.size,
            isTraining: this.isTraining,
            initialized: this.initialized,
            lastTraining: localStorage.getItem('docucortex_ai_last_training'),
            totalPredictions: JSON.parse(localStorage.getItem(AI_STORAGE_KEYS.PREDICTIONS) || '[]').length,
            totalRecommendations: JSON.parse(localStorage.getItem(AI_STORAGE_KEYS.RECOMMENDATIONS) || '{}').size,
            anomaliesDetected: JSON.parse(localStorage.getItem(AI_STORAGE_KEYS.ANOMALIES) || '[]').length
        };
    }
}

// Export d'une instance singleton
const aiService = new AIService();

export default aiService;
export { 
    PREDICTION_TYPES, 
    ANOMALY_TYPES, 
    RECOMMENDATION_TYPES,
    AI_CONFIG 
};