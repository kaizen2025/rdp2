/**
 * Système de seuils d'alerte pour les métriques IA
 * Configure et monitore les seuils de performance critiques
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class AlertThresholds extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.configPath = config.configPath || './alert-config.json';
        this.config = this.loadConfiguration(config);
        
        // Stockage des alertes actives
        this.activeAlerts = new Map();
        this.alertHistory = [];
        
        // Statistiques des seuils
        this.thresholdStats = {
            totalChecks: 0,
            triggeredAlerts: 0,
            resolvedAlerts: 0
        };
        
        // Configuration par défaut des seuils critiques
        this.defaultThresholds = {
            // Temps de réponse (millisecondes)
            responseTime: {
                critical: 5000,
                high: 3000,
                warning: 2000,
                good: 1000
            },
            
            // Taux de succès (%)
            successRate: {
                critical: 80,
                high: 85,
                warning: 90,
                good: 95
            },
            
            // Débit (requêtes par seconde)
            throughput: {
                critical: 1,
                high: 2,
                warning: 5,
                good: 10
            },
            
            // Utilisation CPU (%)
            cpuUsage: {
                critical: 95,
                high: 85,
                warning: 75,
                good: 60
            },
            
            // Utilisation mémoire (%)
            memoryUsage: {
                critical: 95,
                high: 85,
                warning: 75,
                good: 60
            },
            
            // Temps de traitement OCR (millisecondes)
            ocrProcessingTime: {
                critical: 10000,
                high: 5000,
                warning: 3000,
                good: 1500
            },
            
            // Précision OCR (%)
            ocrAccuracy: {
                critical: 85,
                high: 90,
                warning: 95,
                good: 98
            },
            
            // Latence réseau (millisecondes)
            networkLatency: {
                critical: 1000,
                high: 500,
                warning: 200,
                good: 100
            },
            
            // Perte de paquets réseau (%)
            networkPacketLoss: {
                critical: 10,
                high: 5,
                warning: 2,
                good: 1
            }
        };
        
        // Seuils spécifiques par service
        this.serviceThresholds = {
            'ollama': {
                responseTime: { multiplier: 1.5, ...this.defaultThresholds.responseTime },
                memoryUsage: { multiplier: 1.2, ...this.defaultThresholds.memoryUsage }
            },
            'easyocr': {
                responseTime: { multiplier: 2.0, ...this.defaultThresholds.responseTime },
                processingTime: { ...this.defaultThresholds.ocrProcessingTime }
            },
            'docucortex-ai': {
                responseTime: { multiplier: 1.2, ...this.defaultThresholds.responseTime },
                throughput: { multiplier: 1.5, ...this.defaultThresholds.throughput }
            },
            'ged': {
                responseTime: { multiplier: 0.8, ...this.defaultThresholds.responseTime },
                successRate: { multiplier: 1.1, ...this.defaultThresholds.successRate }
            }
        };
    }

    loadConfiguration(customConfig = {}) {
        let config = { ...this.defaultThresholds };
        
        try {
            if (fs.existsSync(this.configPath)) {
                const fileConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
                config = { ...config, ...fileConfig };
            }
        } catch (error) {
            console.warn('⚠️ Impossible de charger la configuration d\'alertes:', error.message);
        }
        
        // Fusionner avec la configuration personnalisée
        config = { ...config, ...customConfig };
        
        return config;
    }

    /**
     * Vérifie si une valeur dépasse les seuils définis
     */
    checkThreshold(metricName, value, serviceName = null) {
        this.thresholdStats.totalChecks++;
        
        const threshold = this.getThreshold(metricName, serviceName);
        if (!threshold) {
            return { level: 'none', triggered: false };
        }
        
        const result = this.evaluateValue(value, threshold);
        
        if (result.triggered) {
            this.thresholdStats.triggeredAlerts++;
            this.triggerAlert(metricName, value, result.level, serviceName, result);
        }
        
        return result;
    }

    /**
     * Obtient le seuil pour une métrique donnée
     */
    getThreshold(metricName, serviceName = null) {
        if (serviceName && this.serviceThresholds[serviceName]?.[metricName]) {
            return this.serviceThresholds[serviceName][metricName];
        }
        
        return this.config[metricName] || this.defaultThresholds[metricName];
    }

    /**
     * Évalue une valeur par rapport aux seuils
     */
    evaluateValue(value, thresholds) {
        const result = {
            triggered: false,
            level: 'good',
            value: value,
            thresholds: thresholds
        };
        
        if (thresholds.critical && value >= thresholds.critical) {
            result.triggered = true;
            result.level = 'critical';
        } else if (thresholds.high && value >= thresholds.high) {
            result.triggered = true;
            result.level = 'high';
        } else if (thresholds.warning && value >= thresholds.warning) {
            result.triggered = true;
            result.level = 'warning';
        } else if (thresholds.good && value >= thresholds.good) {
            result.level = 'good';
        } else {
            result.level = 'excellent';
        }
        
        return result;
    }

    /**
     * Déclenche une alerte
     */
    triggerAlert(metricName, value, level, serviceName = null, evaluation = null) {
        const alertId = this.generateAlertId(metricName, serviceName, level);
        
        const alert = {
            id: alertId,
            metricName,
            serviceName,
            level,
            value,
            timestamp: new Date().toISOString(),
            evaluation,
            status: 'active',
            acknowledgments: [],
            escalation: 0
        };
        
        this.activeAlerts.set(alertId, alert);
        
        // Émettre l'événement d'alerte
        this.emit('alert', alert);
        
        // Log de l'alerte
        console.log(`🚨 ALERTE [${level.toUpperCase()}] ${metricName} ${serviceName ? `(${serviceName})` : ''}: ${value}`);
        
        // Configuration des règles d'escalade automatique
        this.setupAlertEscalation(alert);
    }

    /**
     * Résout une alerte
     */
    resolveAlert(alertId, resolver = 'system') {
        const alert = this.activeAlerts.get(alertId);
        if (!alert) return false;
        
        alert.status = 'resolved';
        alert.resolvedAt = new Date().toISOString();
        alert.resolvedBy = resolver;
        
        // Déplacer vers l'historique
        this.alertHistory.push(alert);
        this.activeAlerts.delete(alertId);
        
        // Statistiques
        this.thresholdStats.resolvedAlerts++;
        
        // Émettre l'événement de résolution
        this.emit('alertResolved', alert);
        
        console.log(`✅ ALERTE RÉSOLUE: ${alert.metricName} ${alert.serviceName ? `(${alert.serviceName})` : ''}`);
        
        return true;
    }

    /**
     * Configure l'escalade automatique d'alertes
     */
    setupAlertEscalation(alert) {
        const escalationRules = {
            critical: { delay: 30000, increment: 1 },    // 30 secondes
            high: { delay: 60000, increment: 1 },        // 1 minute
            warning: { delay: 120000, increment: 1 }     // 2 minutes
        };
        
        const rule = escalationRules[alert.level];
        if (!rule) return;
        
        setTimeout(() => {
            if (this.activeAlerts.has(alert.id)) {
                alert.escalation++;
                
                // Niveau d'escalade maximum atteint ?
                if (alert.escalation >= 3) {
                    this.escalateAlert(alert, 'maximum');
                } else {
                    this.escalateAlert(alert, alert.escalation);
                }
                
                // Recommencer l'escalade
                this.setupAlertEscalation(alert);
            }
        }, rule.delay);
    }

    /**
     * Escalade une alerte
     */
    escalateAlert(alert, level) {
        console.log(`⚠️ ESCALADE ALERTE [${alert.level}] -> ${level}: ${alert.metricName} ${alert.serviceName || ''}`);
        
        // Émettre l'événement d'escalade
        this.emit('alertEscalated', { ...alert, escalationLevel: level });
        
        // Dans un vrai système, on pourrait envoyer des notifications
        // par email, SMS, Slack, etc.
    }

    /**
     * Génère un ID unique pour une alerte
     */
    generateAlertId(metricName, serviceName, level) {
        const timestamp = Date.now();
        const hash = require('crypto')
            .createHash('md5')
            .update(`${metricName}-${serviceName}-${level}-${timestamp}`)
            .digest('hex')
            .substring(0, 8);
        
        return `${metricName}-${serviceName || 'global'}-${level}-${hash}`;
    }

    /**
     * Obtient toutes les alertes actives
     */
    getActiveAlerts() {
        return Array.from(this.activeAlerts.values());
    }

    /**
     * Obtient l'historique des alertes
     */
    getAlertHistory(limit = 100) {
        return this.alertHistory.slice(-limit);
    }

    /**
     * Obtient les statistiques des seuils
     */
    getThresholdStats() {
        return {
            ...this.thresholdStats,
            activeAlerts: this.activeAlerts.size,
            totalAlerts: this.thresholdStats.triggeredAlerts + this.thresholdStats.resolvedAlerts,
            resolutionRate: this.thresholdStats.triggeredAlerts > 0 ? 
                (this.thresholdStats.resolvedAlerts / this.thresholdStats.triggeredAlerts * 100).toFixed(2) : 0
        };
    }

    /**
     * Configure un nouveau seuil personnalisé
     */
    setThreshold(metricName, thresholds, serviceName = null) {
        if (serviceName) {
            if (!this.serviceThresholds[serviceName]) {
                this.serviceThresholds[serviceName] = {};
            }
            this.serviceThresholds[serviceName][metricName] = thresholds;
        } else {
            this.config[metricName] = thresholds;
        }
        
        console.log(`✅ Seuil configuré: ${metricName} ${serviceName ? `(${serviceName})` : ''}`);
    }

    /**
     * Sauvegarde la configuration actuelle
     */
    saveConfiguration() {
        const configToSave = {
            global: this.config,
            services: this.serviceThresholds,
            metadata: {
                version: '1.0',
                lastModified: new Date().toISOString(),
                description: 'Configuration des seuils d\'alerte pour les métriques IA'
            }
        };
        
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(configToSave, null, 2));
            console.log(`💾 Configuration sauvegardée: ${this.configPath}`);
            return true;
        } catch (error) {
            console.error('❌ Erreur sauvegarde configuration:', error.message);
            return false;
        }
    }

    /**
     * Charge une configuration depuis un fichier
     */
    loadConfigurationFromFile(filePath) {
        try {
            const configData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            if (configData.global) {
                this.config = { ...this.config, ...configData.global };
            }
            
            if (configData.services) {
                this.serviceThresholds = { ...this.serviceThresholds, ...configData.services };
            }
            
            console.log(`📁 Configuration chargée depuis: ${filePath}`);
            return true;
        } catch (error) {
            console.error('❌ Erreur chargement configuration:', error.message);
            return false;
        }
    }

    /**
     * Génère un rapport de santé des seuils
     */
    generateHealthReport() {
        const stats = this.getThresholdStats();
        const activeAlerts = this.getActiveAlerts();
        
        // Analyser la répartition des alertes par niveau
        const alertsByLevel = {
            critical: activeAlerts.filter(a => a.level === 'critical').length,
            high: activeAlerts.filter(a => a.level === 'high').length,
            warning: activeAlerts.filter(a => a.level === 'warning').length
        };
        
        // Analyser les métriques les plus problématiques
        const metricFrequency = {};
        activeAlerts.forEach(alert => {
            const key = alert.metricName + (alert.serviceName ? `-${alert.serviceName}` : '');
            metricFrequency[key] = (metricFrequency[key] || 0) + 1;
        });
        
        const topProblematicMetrics = Object.entries(metricFrequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);
        
        return {
            timestamp: new Date().toISOString(),
            overall: {
                healthScore: this.calculateHealthScore(stats, alertsByLevel),
                status: this.getOverallStatus(activeAlerts),
                totalActiveAlerts: activeAlerts.length
            },
            statistics: stats,
            alertsByLevel,
            topProblematicMetrics,
            recommendations: this.generateRecommendations(activeAlerts, alertsByLevel)
        };
    }

    /**
     * Calcule un score de santé global
     */
    calculateHealthScore(stats, alertsByLevel) {
        let score = 100;
        
        // Pénalités pour les alertes actives
        score -= alertsByLevel.critical * 20;
        score -= alertsByLevel.high * 10;
        score -= alertsByLevel.warning * 5;
        
        // Pénalités pour le taux de résolution
        const resolutionRate = parseFloat(stats.resolutionRate);
        if (resolutionRate < 80) {
            score -= (80 - resolutionRate) * 0.5;
        }
        
        return Math.max(0, Math.min(100, score)).toFixed(1);
    }

    /**
     * Détermine le statut global du système
     */
    getOverallStatus(activeAlerts) {
        if (activeAlerts.some(a => a.level === 'critical')) {
            return 'critical';
        } else if (activeAlerts.some(a => a.level === 'high')) {
            return 'warning';
        } else if (activeAlerts.some(a => a.level === 'warning')) {
            return 'degraded';
        } else {
            return 'healthy';
        }
    }

    /**
     * Génère des recommandations d'amélioration
     */
    generateRecommendations(activeAlerts, alertsByLevel) {
        const recommendations = [];
        
        if (alertsByLevel.critical > 0) {
            recommendations.push('Révision urgente requise: Des alertes critiques sont actives');
        }
        
        if (alertsByLevel.high > 3) {
            recommendations.push('Nombre élevé d\'alertes HIGH: Considérer l\'ajustement des seuils ou l\'optimisation des performances');
        }
        
        // Recommandations basées sur les métriques les plus problématiques
        const timeouts = activeAlerts.filter(a => a.metricName.includes('timeout')).length;
        if (timeouts > 2) {
            recommendations.push('Timeouts fréquents: Vérifier la configuration réseau et la capacité des services');
        }
        
        const memoryAlerts = activeAlerts.filter(a => a.metricName.includes('memory')).length;
        if (memoryAlerts > 2) {
            recommendations.push('Alertes mémoire: Augmenter la RAM ou optimiser l\'utilisation mémoire');
        }
        
        return recommendations;
    }

    /**
     * Crée un tableau de bord des seuils
     */
    createThresholdsTable() {
        const table = {
            timestamp: new Date().toISOString(),
            sections: [
                {
                    name: 'Métriques de Performance',
                    metrics: [
                        { name: 'Temps de Réponse', unit: 'ms', thresholds: this.config.responseTime },
                        { name: 'Débit', unit: 'req/s', thresholds: this.config.throughput },
                        { name: 'Taux de Succès', unit: '%', thresholds: this.config.successRate }
                    ]
                },
                {
                    name: 'Métriques Système',
                    metrics: [
                        { name: 'CPU', unit: '%', thresholds: this.config.cpuUsage },
                        { name: 'Mémoire', unit: '%', thresholds: this.config.memoryUsage }
                    ]
                },
                {
                    name: 'Métriques Réseau',
                    metrics: [
                        { name: 'Latence', unit: 'ms', thresholds: this.config.networkLatency },
                        { name: 'Perte Paquets', unit: '%', thresholds: this.config.networkPacketLoss }
                    ]
                },
                {
                    name: 'Métriques OCR',
                    metrics: [
                        { name: 'Temps Traitement', unit: 'ms', thresholds: this.config.ocrProcessingTime },
                        { name: 'Précision', unit: '%', thresholds: this.config.ocrAccuracy }
                    ]
                }
            ]
        };
        
        return table;
    }
}

module.exports = AlertThresholds;