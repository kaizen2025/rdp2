/**
 * DocuCortex Enhanced - Predictive User Management
 * Système de Machine Learning local pour gestion proactive des utilisateurs
 * Performance optimisée avec cache intelligent et détection d'anomalies
 */

class PredictiveUserManagement {
    constructor(options = {}) {
        this.config = {
            // Configuration ML
            learningRate: options.learningRate || 0.001,
            maxIterations: options.maxIterations || 1000,
            regularization: options.regularization || 0.01,
            
            // Cache intelligent
            cacheSize: options.cacheSize || 1000,
            cacheTTL: options.cacheTTL || 300000, // 5 minutes
            enableSmartCache: options.enableSmartCache !== false,
            
            // Performance
            batchSize: options.batchSize || 32,
            enableParallel: options.enableParallel !== false,
            
            // Mémoire
            memoryLimit: options.memoryLimit || 100 * 1024 * 1024, // 100MB
            enableMemoryOptimization: options.enableMemoryOptimization !== false,
            
            // Détection d'anomalies
            anomalyThreshold: options.anomalyThreshold || 0.7,
            enableRealTimeDetection: options.enableRealTimeDetection !== false
        };

        // Structures de données optimisées
        this.userProfiles = new Map();
        this.predictionCache = new LRUCache(this.config.cacheSize, this.config.cacheTTL);
        this.featureStore = new Map();
        this.modelWeights = new Map();
        this.anomalyPatterns = new Map();
        
        // Compteurs pour optimisation
        this.metrics = {
            predictions: 0,
            cacheHits: 0,
            cacheMisses: 0,
            anomalies: 0,
            memoryUsage: 0,
            processingTime: 0
        };

        // Matrices ML optimisées (Typed Arrays pour performance)
        this.initializeMLModels();
        
        // Event emitter pour temps réel
        this.eventQueue = [];
        this.processingQueue = [];
        
        // Démarrage du système temps réel
        this.startRealTimeProcessing();
    }

    /**
     * Initialise les modèles ML avec matrices optimisées
     */
    initializeMLModels() {
        // Modèle de régression linéaire pour prédictions continues
        this.linearRegression = {
            weights: new Float32Array(10), // 10 features
            bias: 0.0,
            learningRate: this.config.learningRate,
            iterations: 0
        };

        // Modèle de classification pour recommandations
        this.classificationModel = {
            weights: new Float32Array(20), // Classes multiples
            bias: new Float32Array(5),
            classes: ['low', 'medium', 'high', 'premium', 'vip'],
            softmaxCache: new Map()
        };

        // Modèle de clustering K-means pour segmentation utilisateurs
        this.clusteringModel = {
            centroids: new Float32Array(20), // 4 centroids * 5 features
            clusterCount: 4,
            features: 5,
            assignments: new Map()
        };

        // Réseau neuronal simple pour détection d'anomalies
        this.neuralNetwork = {
            inputLayer: new Float32Array(15),
            hiddenLayer: new Float32Array(8),
            outputLayer: new Float32Array(1),
            weightsIH: new Float32Array(120), // 15 * 8
            weightsHO: new Float32Array(8), // 8 * 1
            activations: ['sigmoid', 'sigmoid', 'sigmoid']
        };
    }

    /**
     * Prédit le comportement utilisateur et génère des recommandations
     */
    async predictUserBehavior(userId, contextData = {}) {
        const startTime = performance.now();
        
        try {
            // Vérification cache
            const cacheKey = this.generateCacheKey(userId, contextData);
            const cachedResult = this.predictionCache.get(cacheKey);
            
            if (cachedResult) {
                this.metrics.cacheHits++;
                return cachedResult;
            }
            
            this.metrics.cacheMisses++;
            
            // Récupération profil utilisateur
            const userProfile = this.userProfiles.get(userId) || await this.loadUserProfile(userId);
            
            // Extraction features optimisée
            const features = this.extractFeatures(userProfile, contextData);
            
            // Prédictions multiples en parallèle
            const predictions = await this.generatePredictions(features);
            
            // Génération recommandations personnalisées
            const recommendations = await this.generateRecommendations(userId, predictions, userProfile);
            
            // Détection d'anomalies
            const anomalies = await this.detectAnomalies(userId, features, predictions);
            
            // Métadonnées pour cache intelligent
            const result = {
                predictions,
                recommendations,
                anomalies,
                confidence: this.calculateConfidence(predictions),
                timestamp: Date.now(),
                processingTime: performance.now() - startTime,
                cacheExpiry: Date.now() + this.config.cacheTTL
            };
            
            // Stockage cache intelligent
            if (this.config.enableSmartCache) {
                this.storeWithPriority(cacheKey, result, userId);
            }
            
            // Mise à jour métriques
            this.updateMetrics(result);
            
            // Émission événements temps réel
            this.emitRealtimeUpdate(userId, result);
            
            return result;
            
        } catch (error) {
            console.error('Erreur prédiction utilisateur:', error);
            return this.getFallbackPrediction();
        }
    }

    /**
     * Extrait et normalise les features utilisateur
     */
    extractFeatures(userProfile, contextData) {
        const features = new Float32Array(10);
        
        // Features comportementales (0-4)
        features[0] = this.normalize(userProfile.activityLevel || 0, 0, 100);
        features[1] = this.normalize(userProfile.engagementScore || 0, 0, 1);
        features[2] = this.normalize(userProfile.sessionDuration || 0, 0, 3600) / 3600; // heures
        features[3] = this.normalize(userFeature.frequency || 0, 0, 30) / 30; // 30 jours
        features[4] = this.normalize(userProfile.satisfaction || 0, 0, 10) / 10;
        
        // Features contextuelles (5-9)
        features[5] = this.normalize(contextData.timeOfDay || 12, 0, 24) / 24;
        features[6] = this.normalize(contextData.dayOfWeek || 1, 1, 7) / 7;
        features[7] = this.normalize(contextData.deviceType || 'desktop', 'desktop', 3) / 3;
        features[8] = this.normalize(contextData.sessionCount || 1, 1, 10) / 10;
        features[9] = this.normalize(contextData.errorRate || 0, 0, 1);
        
        return features;
    }

    /**
     * Génère prédictions avec algorithmes ML optimisés
     */
    async generatePredictions(features) {
        const predictions = {};
        
        // Prédiction rétention (régression linéaire)
        predictions.retention = this.linearRegressionPredict(features);
        
        // Prédiction engagement (réseau neuronal)
        predictions.engagement = this.neuralNetworkPredict(features);
        
        // Prédiction churn (classification)
        predictions.churn = this.classificationPredict(features, 'churn');
        
        // Prédiction valeur vie client
        predictions.lifetimeValue = this.predictLifetimeValue(features);
        
        // Prédiction satisfaction future
        predictions.futureSatisfaction = this.predictSatisfaction(features);
        
        return predictions;
    }

    /**
     * Régression linéaire optimisée
     */
    linearRegressionPredict(features) {
        let prediction = this.linearRegression.bias;
        
        for (let i = 0; i < features.length && i < this.linearRegression.weights.length; i++) {
            prediction += features[i] * this.linearRegression.weights[i];
        }
        
        // Sigmoid pour normaliser entre 0 et 1
        return this.sigmoid(prediction);
    }

    /**
     * Réseau neuronal feedforward simple
     */
    neuralNetworkPredict(features) {
        // Passage input vers hidden layer
        for (let i = 0; i < this.neuralNetwork.hiddenLayer.length; i++) {
            this.neuralNetwork.hiddenLayer[i] = 0;
            for (let j = 0; j < features.length && j < this.neuralNetwork.inputLayer.length; j++) {
                this.neuralNetwork.hiddenLayer[i] += features[j] * this.neuralNetwork.weightsIH[i * features.length + j];
            }
            this.neuralNetwork.hiddenLayer[i] = this.sigmoid(this.neuralNetwork.hiddenLayer[i]);
        }
        
        // Passage hidden vers output
        let output = 0;
        for (let i = 0; i < this.neuralNetwork.hiddenLayer.length; i++) {
            output += this.neuralNetwork.hiddenLayer[i] * this.neuralNetwork.weightsHO[i];
        }
        
        return this.sigmoid(output);
    }

    /**
     * Classification avec softmax
     */
    classificationPredict(features, type) {
        const logits = new Float32Array(this.classificationModel.classes.length);
        
        for (let i = 0; i < logits.length; i++) {
            let logit = this.classificationModel.bias[i];
            for (let j = 0; j < features.length && j < this.classificationModel.weights.length / logits.length; j++) {
                logit += features[j] * this.classificationModel.weights[i * features.length + j];
            }
            logits[i] = logit;
        }
        
        return this.softmax(logits);
    }

    /**
     * Prédiction valeur vie client
     */
    predictLifetimeValue(features) {
        const recency = features[0]; // dernière activité
        const frequency = features[3]; // fréquence
        const monetary = features[1]; // montant moyen
        
        // RFM scoring simplifié
        const rfmScore = (recency + frequency + monetary) / 3;
        
        // Prédiction exponentielle avec seuil
        const baseValue = 100; // Valeur de base
        const multiplier = Math.exp(rfmScore * 0.5);
        
        return Math.min(baseValue * multiplier, 10000); // Plafonné à 10k
    }

    /**
     * Prédiction satisfaction
     */
    predictSatisfaction(features) {
        const engagement = features[1];
        const errors = features[9];
        const sessionDuration = features[2];
        
        // Formule pondérée
        let satisfaction = (engagement * 0.4) + (sessionDuration * 0.3) + (1 - errors) * 0.3;
        
        // Normalisation 0-10
        return satisfaction * 10;
    }

    /**
     * Génère recommandations personnalisées
     */
    async generateRecommendations(userId, predictions, userProfile) {
        const recommendations = [];
        
        // Recommandations basées sur prédiction rétention
        if (predictions.retention < 0.3) {
            recommendations.push({
                type: 'retention',
                priority: 'high',
                action: 'contact_immediate',
                message: 'Risk of churn detected - Immediate intervention recommended',
                confidence: 0.9
            });
        }
        
        // Recommandations basées sur engagement
        if (predictions.engagement < 0.4) {
            recommendations.push({
                type: 'engagement',
                priority: 'medium',
                action: 'content_personalization',
                message: 'Low engagement - Customize content recommendations',
                confidence: 0.8
            });
        }
        
        // Recommandations basées sur valeur vie client
        if (predictions.lifetimeValue > 5000) {
            recommendations.push({
                type: 'value_optimization',
                priority: 'medium',
                action: 'premium_upgrade',
                message: 'High value user - Offer premium services',
                confidence: 0.85
            });
        }
        
        // Recommandations temps réel
        if (userProfile.currentActivity === 'browsing') {
            recommendations.push({
                type: 'real_time',
                priority: 'low',
                action: 'guided_tour',
                message: 'User needs guidance - Offer interactive tour',
                confidence: 0.7
            });
        }
        
        return recommendations.sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Détection d'anomalies automatique
     */
    async detectAnomalies(userId, features, predictions) {
        const anomalies = [];
        
        // Détection comportement inhabituel
        const anomalyScore = this.calculateAnomalyScore(features, predictions);
        
        if (anomalyScore > this.config.anomalyThreshold) {
            anomalies.push({
                type: 'behavioral',
                severity: anomalyScore > 0.9 ? 'critical' : 'high',
                score: anomalyScore,
                description: 'Unusual user behavior pattern detected',
                timestamp: Date.now()
            });
        }
        
        // Détection patterns suspects
        const patternAnomalies = this.detectPatternAnomalies(userId, features);
        anomalies.push(...patternAnomalies);
        
        // Détection performance anormale
        if (features[9] > 0.1) { // High error rate
            anomalies.push({
                type: 'performance',
                severity: 'medium',
                score: features[9],
                description: 'User experiencing technical issues',
                timestamp: Date.now()
            });
        }
        
        // Apprentissage des patterns d'anomalies
        this.learnAnomalyPattern(userId, anomalies);
        
        return anomalies;
    }

    /**
     * Calcule score anomalie composite
     */
    calculateAnomalyScore(features, predictions) {
        let score = 0;
        
        // Score basé sur variance des features
        const featureVariance = this.calculateFeatureVariance(features);
        score += featureVariance * 0.3;
        
        // Score basé sur cohérence des prédictions
        const predictionConsistency = this.calculatePredictionConsistency(predictions);
        score += (1 - predictionConsistency) * 0.4;
        
        // Score basé sur historique utilisateur
        const userHistoryScore = this.getUserHistoryAnomalyScore(features);
        score += userHistoryScore * 0.3;
        
        return Math.min(score, 1.0);
    }

    /**
     * Détection patterns d'anomalies
     */
    detectPatternAnomalies(userId, features) {
        const anomalies = [];
        const userPattern = this.anomalyPatterns.get(userId);
        
        if (!userPattern) {
            // Première observation, initialiser pattern
            this.anomalyPatterns.set(userId, {
                lastFeatures: features,
                patternHistory: [],
                anomalyCount: 0
            });
            return anomalies;
        }
        
        // Détection spike usage
        const usageSpike = this.detectUsageSpike(userId, features);
        if (usageSpike.score > 0.8) {
            anomalies.push({
                type: 'usage_spike',
                severity: 'medium',
                score: usageSpike.score,
                description: 'Unusual usage spike detected',
                timestamp: Date.now()
            });
        }
        
        // Détection changement de comportement
        const behaviorChange = this.detectBehaviorChange(features, userPattern.lastFeatures);
        if (behaviorChange.score > 0.75) {
            anomalies.push({
                type: 'behavior_change',
                severity: 'high',
                score: behaviorChange.score,
                description: 'Significant behavior change detected',
                timestamp: Date.now()
            });
        }
        
        return anomalies;
    }

    /**
     * Apprentissage des patterns d'anomalies
     */
    learnAnomalyPattern(userId, anomalies) {
        const pattern = this.anomalyPatterns.get(userId);
        if (pattern) {
            pattern.anomalyCount += anomalies.length;
            pattern.patternHistory.push({
                timestamp: Date.now(),
                anomalies: anomalies.length,
                types: anomalies.map(a => a.type)
            });
            
            // Limitation taille historique pour performance
            if (pattern.patternHistory.length > 100) {
                pattern.patternHistory = pattern.patternHistory.slice(-50);
            }
        }
    }

    /**
     * Cache intelligent avec priorités
     */
    storeWithPriority(key, value, userId) {
        // Calcul priorité basée sur importance utilisateur et récence
        const userProfile = this.userProfiles.get(userId);
        const priority = this.calculateCachePriority(userProfile, value);
        
        this.predictionCache.set(key, value, {
            priority,
            userValue: userProfile?.lifetimeValue || 0,
            timestamp: Date.now()
        });
    }

    /**
     * Gestion mémoire optimisée
     */
    optimizeMemoryUsage() {
        if (!this.config.enableMemoryOptimization) return;
        
        const currentMemory = this.getMemoryUsage();
        
        if (currentMemory > this.config.memoryLimit * 0.8) {
            // Nettoyage agressif du cache
            this.cleanupCache();
            
            // Compression des données anciennes
            this.compressOldData();
            
            // Nettoyage des patterns d'anomalies
            this.cleanupAnomalyPatterns();
        }
    }

    /**
     * Traitement temps réel
     */
    startRealTimeProcessing() {
        if (!this.config.enableRealTimeDetection) return;
        
        setInterval(() => {
            this.processRealTimeEvents();
            this.optimizeMemoryUsage();
            this.cleanupExpiredCache();
        }, 1000); // 1 seconde
    }

    /**
     * Traite les événements en temps réel
     */
    async processRealTimeEvents() {
        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            
            try {
                // Traitement rapide sans cache
                const quickPrediction = await this.generateQuickPrediction(event.data);
                
                // Émission alertes si nécessaire
                if (quickPrediction.anomaly) {
                    this.emitAlert(event.userId, quickPrediction);
                }
                
            } catch (error) {
                console.error('Erreur traitement temps réel:', error);
            }
        }
    }

    /**
     * Génère prédiction rapide pour temps réel
     */
    async generateQuickPrediction(eventData) {
        const features = this.extractQuickFeatures(eventData);
        const anomalyScore = this.calculateAnomalyScore(features, {});
        
        return {
            anomaly: anomalyScore > this.config.anomalyThreshold,
            score: anomalyScore,
            timestamp: Date.now()
        };
    }

    /**
     * Extraits features快速 pour temps réel
     */
    extractQuickFeatures(eventData) {
        const features = new Float32Array(5);
        features[0] = eventData.activityLevel || 0;
        features[1] = eventData.engagement || 0;
        features[2] = eventData.sessionDuration || 0;
        features[3] = eventData.errorRate || 0;
        features[4] = eventData.timeOfDay || 12;
        return features;
    }

    // === UTILITAIRES ===

    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }

    softmax(logits) {
        const maxLogit = Math.max(...logits);
        const expLogits = Array.from(logits, logit => Math.exp(logit - maxLogit));
        const sumExp = expLogits.reduce((sum, exp) => sum + exp, 0);
        return expLogits.map(exp => exp / sumExp);
    }

    normalize(value, min, max) {
        if (max === min) return 0;
        return Math.max(0, Math.min(1, (value - min) / (max - min)));
    }

    calculateConfidence(predictions) {
        const values = Object.values(predictions);
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
        return Math.min(Math.max(avg, 0), 1);
    }

    generateCacheKey(userId, contextData) {
        return `${userId}:${JSON.stringify(contextData)}`;
    }

    updateMetrics(result) {
        this.metrics.predictions++;
        this.metrics.processingTime += result.processingTime;
        this.metrics.anomalies += result.anomalies.length;
        this.metrics.memoryUsage = this.getMemoryUsage();
    }

    emitRealtimeUpdate(userId, result) {
        // Émission événements pour monitoring temps réel
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('userPredictionUpdate', {
                detail: { userId, result }
            }));
        }
    }

    emitAlert(userId, prediction) {
        console.warn(`[ALERT] Anomalie détectée utilisateur ${userId}:`, prediction);
    }

    getMemoryUsage() {
        // Estimation simple de l'usage mémoire
        let usage = 0;
        
        this.userProfiles.forEach(profile => {
            usage += JSON.stringify(profile).length;
        });
        
        usage += this.predictionCache.size * 1024; // Estimation
        
        return usage;
    }

    async loadUserProfile(userId) {
        // Simulation chargement profil utilisateur
        // En production, charger depuis base de données
        const profile = {
            userId,
            activityLevel: Math.random() * 100,
            engagementScore: Math.random(),
            sessionDuration: Math.random() * 3600,
            frequency: Math.random() * 30,
            satisfaction: Math.random() * 10,
            currentActivity: 'browsing',
            lifetimeValue: Math.random() * 1000
        };
        
        this.userProfiles.set(userId, profile);
        return profile;
    }

    getFallbackPrediction() {
        return {
            predictions: { retention: 0.5, engagement: 0.5, churn: 0.3, lifetimeValue: 500, futureSatisfaction: 7 },
            recommendations: [],
            anomalies: [],
            confidence: 0.1,
            timestamp: Date.now(),
            processingTime: 0,
            isFallback: true
        };
    }

    cleanupCache() {
        const now = Date.now();
        const entries = Array.from(this.predictionCache.entries());
        
        // Supprime les entrées expirées et de faible priorité
        for (const [key, value] of entries) {
            if (value.timestamp && now - value.timestamp > this.config.cacheTTL) {
                this.predictionCache.delete(key);
            }
        }
    }

    compressOldData() {
        // Compression des données anciennes pour optimiser mémoire
        const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24h
        
        this.userProfiles.forEach((profile, userId) => {
            if (profile.lastActivity && profile.lastActivity < cutoff) {
                // Compression profile
                profile.compressed = true;
                profile.originalData = JSON.stringify(profile);
                delete profile.activityHistory;
            }
        });
    }

    cleanupAnomalyPatterns() {
        // Nettoie les patterns anciens
        const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 jours
        
        this.anomalyPatterns.forEach((pattern, userId) => {
            if (pattern.lastUpdate && pattern.lastUpdate < cutoff) {
                this.anomalyPatterns.delete(userId);
            }
        });
    }

    // === API PUBLIQUE ===

    /**
     * Entraine le modèle avec nouvelles données
     */
    async trainModel(trainingData) {
        for (const data of trainingData) {
            const features = this.extractFeatures(data.userProfile, data.contextData);
            
            // Entrainement régression linéaire
            this.trainLinearRegression(features, data.targets);
            
            // Entrainement réseau neuronal
            this.trainNeuralNetwork(features, data.targets);
            
            // Entrainement classification
            if (data.classLabels) {
                this.trainClassification(features, data.classLabels);
            }
        }
        
        this.linearRegression.iterations += trainingData.length;
    }

    /**
     * Ajoute un utilisateur au monitoring
     */
    addUserToMonitoring(userId, profile) {
        this.userProfiles.set(userId, {
            ...profile,
            monitoringStart: Date.now(),
            lastActivity: Date.now()
        });
    }

    /**
     * Retire un utilisateur du monitoring
     */
    removeUserFromMonitoring(userId) {
        this.userProfiles.delete(userId);
        this.anomalyPatterns.delete(userId);
        this.predictionCache.deletePattern(userId);
    }

    /**
     * Met à jour profil utilisateur
     */
    updateUserProfile(userId, updates) {
        const profile = this.userProfiles.get(userId);
        if (profile) {
            Object.assign(profile, updates, { lastUpdate: Date.now() });
        }
    }

    /**
     * Récupère les métriques du système
     */
    getSystemMetrics() {
        return {
            ...this.metrics,
            cacheHitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses),
            avgProcessingTime: this.metrics.processingTime / this.metrics.predictions,
            memoryUsageMB: Math.round(this.metrics.memoryUsage / 1024 / 1024),
            activeUsers: this.userProfiles.size,
            cachedPredictions: this.predictionCache.size
        };
    }

    /**
     * Configure les seuils de détection
     */
    configureAnomalyDetection(thresholds) {
        if (thresholds.anomalyThreshold) {
            this.config.anomalyThreshold = thresholds.anomalyThreshold;
        }
        if (thresholds.memoryLimit) {
            this.config.memoryLimit = thresholds.memoryLimit;
        }
    }

    /**
     * Exporte les modèles ML
     */
    exportModels() {
        return {
            linearRegression: {
                weights: Array.from(this.linearRegression.weights),
                bias: this.linearRegression.bias
            },
            neuralNetwork: {
                weightsIH: Array.from(this.neuralNetwork.weightsIH),
                weightsHO: Array.from(this.neuralNetwork.weightsHO)
            },
            classification: {
                weights: Array.from(this.classificationModel.weights),
                bias: Array.from(this.classificationModel.bias)
            }
        };
    }

    /**
     * Importe les modèles ML
     */
    importModels(models) {
        if (models.linearRegression) {
            this.linearRegression.weights = new Float32Array(models.linearRegression.weights);
            this.linearRegression.bias = models.linearRegression.bias;
        }
        
        if (models.neuralNetwork) {
            this.neuralNetwork.weightsIH = new Float32Array(models.neuralNetwork.weightsIH);
            this.neuralNetwork.weightsHO = new Float32Array(models.neuralNetwork.weightsHO);
        }
        
        if (models.classification) {
            this.classificationModel.weights = new Float32Array(models.classification.weights);
            this.classificationModel.bias = new Float32Array(models.classification.bias);
        }
    }

    /**
     * Nettoie toutes les données
     */
    clearAllData() {
        this.userProfiles.clear();
        this.predictionCache.clear();
        this.featureStore.clear();
        this.anomalyPatterns.clear();
        this.metrics = {
            predictions: 0,
            cacheHits: 0,
            cacheMisses: 0,
            anomalies: 0,
            memoryUsage: 0,
            processingTime: 0
        };
    }
}

/**
 * Cache LRU avec TTL pour optimisations performance
 */
class LRUCache {
    constructor(maxSize = 1000, ttl = 300000) {
        this.maxSize = maxSize;
        this.ttl = ttl;
        this.cache = new Map();
        this.order = [];
    }

    get(key) {
        if (!this.cache.has(key)) return null;
        
        const entry = this.cache.get(key);
        if (Date.now() - entry.timestamp > this.ttl) {
            this.delete(key);
            return null;
        }
        
        // Réorganise pour MRU
        this.updateOrder(key);
        return entry.value;
    }

    set(key, value, metadata = {}) {
        if (this.cache.size >= this.maxSize) {
            this.evictLRU();
        }
        
        this.cache.set(key, {
            value,
            timestamp: Date.now(),
            ...metadata
        });
        
        this.order.push(key);
    }

    delete(key) {
        this.cache.delete(key);
        const index = this.order.indexOf(key);
        if (index > -1) {
            this.order.splice(index, 1);
        }
    }

    clear() {
        this.cache.clear();
        this.order = [];
    }

    get size() {
        return this.cache.size;
    }

    updateOrder(key) {
        const index = this.order.indexOf(key);
        if (index > -1) {
            this.order.splice(index, 1);
        }
        this.order.push(key);
    }

    evictLRU() {
        const lruKey = this.order.shift();
        if (lruKey) {
            this.cache.delete(lruKey);
        }
    }

    deletePattern(userId) {
        // Supprime toutes les entrées liées à un utilisateur
        const keysToDelete = [];
        this.cache.forEach((entry, key) => {
            if (key.startsWith(userId + ':')) {
                keysToDelete.push(key);
            }
        });
        
        keysToDelete.forEach(key => this.delete(key));
    }
}

// === FONCTIONS D'ENTRAINEMENT ML ===

/**
 * Entraine régression linéaire
 */
function trainLinearRegression(model, features, target, learningRate) {
    const prediction = linearRegressionPredict.call(model, features);
    const error = prediction - target;
    
    // Mise à jour poids
    for (let i = 0; i < model.weights.length && i < features.length; i++) {
        model.weights[i] -= learningRate * error * features[i];
    }
    
    model.bias -= learningRate * error;
}

/**
 * Entraine réseau neuronal
 */
function trainNeuralNetwork(model, features, target, learningRate) {
    // Forward pass (simplifié pour l'exemple)
    const output = neuralNetworkPredict.call(model, features);
    const error = output - target;
    
    // Backpropagation (simplifiée)
    for (let i = 0; i < model.weightsHO.length; i++) {
        model.weightsHO[i] -= learningRate * error * model.hiddenLayer[i];
    }
    
    // Mise à jour weights input-hidden (simplifiée)
    for (let i = 0; i < model.weightsIH.length; i++) {
        model.weightsIH[i] -= learningRate * error * features[i % features.length];
    }
}

/**
 * Entraine modèle classification
 */
function trainClassification(model, features, label, learningRate) {
    const prediction = classificationPredict.call(model, features);
    const targetIndex = model.classes.indexOf(label);
    
    if (targetIndex >= 0) {
        for (let i = 0; i < model.bias.length; i++) {
            const target = i === targetIndex ? 1 : 0;
            const error = prediction[i] - target;
            model.bias[i] -= learningRate * error;
        }
        
        for (let i = 0; i < model.weights.length; i++) {
            model.weights[i] -= learningRate * error * features[i % features.length];
        }
    }
}

// Ajout méthodes d'entrainement au prototype
PredictiveUserManagement.prototype.trainLinearRegression = function(features, target) {
    trainLinearRegression(this.linearRegression, features, target, this.config.learningRate);
};

PredictiveUserManagement.prototype.trainNeuralNetwork = function(features, target) {
    trainNeuralNetwork(this.neuralNetwork, features, target, this.config.learningRate);
};

PredictiveUserManagement.prototype.trainClassification = function(features, label) {
    trainClassification(this.classificationModel, features, label, this.config.learningRate);
};

// === UTILITAIRES ML SUPPLÉMENTAIRES ===

/**
 * Calcule variance des features
 */
PredictiveUserManagement.prototype.calculateFeatureVariance = function(features) {
    const mean = features.reduce((sum, val) => sum + val, 0) / features.length;
    const variance = features.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / features.length;
    return variance;
};

/**
 * Calcule cohérence des prédictions
 */
PredictiveUserManagement.prototype.calculatePredictionConsistency = function(predictions) {
    const values = Object.values(predictions);
    if (values.length < 2) return 1;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    // Variance faible = haute cohérence
    return 1 - Math.min(variance, 1);
};

/**
 * Score anomalie basé sur historique
 */
PredictiveUserManagement.prototype.getUserHistoryAnomalyScore = function(features) {
    // Simplification: comparaison avec moyenne mobile
    const avgFeatures = this.calculateMovingAverage(features);
    const deviation = Math.sqrt(features.reduce((sum, val, i) => 
        sum + Math.pow(val - avgFeatures[i], 2), 0) / features.length);
    
    return Math.min(deviation, 1);
};

/**
 * Calcule moyenne mobile des features
 */
PredictiveUserManagement.prototype.calculateMovingAverage = function(currentFeatures) {
    // Implémentation simplifiée - en production utiliser historique complet
    return currentFeatures.map(val => val * 0.8 + 0.1); // Simplification
};

/**
 * Détecte spike d'usage
 */
PredictiveUserManagement.prototype.detectUsageSpike = function(userId, features) {
    const pattern = this.anomalyPatterns.get(userId);
    if (!pattern || !pattern.lastFeatures) {
        return { score: 0 };
    }
    
    const usageIncrease = (features[0] - pattern.lastFeatures[0]) / Math.max(pattern.lastFeatures[0], 1);
    return { score: Math.min(Math.abs(usageIncrease), 1) };
};

/**
 * Détecte changement de comportement
 */
PredictiveUserManagement.prototype.detectBehaviorChange = function(current, previous) {
    let totalDiff = 0;
    for (let i = 0; i < Math.min(current.length, previous.length); i++) {
        totalDiff += Math.abs(current[i] - previous[i]);
    }
    
    const avgDiff = totalDiff / Math.min(current.length, previous.length);
    return { score: Math.min(avgDiff * 2, 1) };
};

/**
 * Calcule priorité cache
 */
PredictiveUserManagement.prototype.calculateCachePriority = function(userProfile, prediction) {
    let priority = 0.5; // Priorité base
    
    if (userProfile?.lifetimeValue > 1000) priority += 0.2;
    if (prediction.anomalies?.length > 0) priority += 0.3;
    if (prediction.confidence > 0.8) priority += 0.1;
    
    return Math.min(priority, 1);
};

/**
 * Nettoie cache expiré
 */
PredictiveUserManagement.prototype.cleanupExpiredCache = function() {
    const now = Date.now();
    const expiredKeys = [];
    
    // Utilisation d'iterator pour éviter modification pendant itération
    for (const [key, entry] of this.predictionCache.cache.entries()) {
        if (entry.timestamp && now - entry.timestamp > this.config.cacheTTL) {
            expiredKeys.push(key);
        }
    }
    
    expiredKeys.forEach(key => this.predictionCache.delete(key));
};

// === EXPORT POUR NODE.JS ===
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PredictiveUserManagement;
}

// === EXPORT POUR NAVIGATEUR ===
if (typeof window !== 'undefined') {
    window.PredictiveUserManagement = PredictiveUserManagement;
}