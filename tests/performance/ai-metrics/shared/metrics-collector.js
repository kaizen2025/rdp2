/**
 * Collecteur de métriques pour les tests de performance IA
 * Centralise la collecte et l'analyse des métriques de performance
 */

const fs = require('fs');
const path = require('path');

class MetricsCollector {
    constructor(testName, options = {}) {
        this.testName = testName;
        this.options = {
            outputDir: './results',
            enableRealTime: options.enableRealTime || false,
            enableAlerts: options.enableAlerts || false,
            alertThresholds: {
                responseTime: 5000, // 5 secondes
                errorRate: 10, // 10%
                cpuUsage: 85, // 85%
                memoryUsage: 80 // 80%
            },
            ...options
        };
        
        // Stockage des métriques
        this.metrics = {
            requests: [],
            responses: [],
            errors: [],
            systemMetrics: [],
            customMetrics: {},
            alerts: []
        };
        
        // Compteurs en temps réel
        this.counters = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalResponseTime: 0,
            minResponseTime: Infinity,
            maxResponseTime: 0,
            startTime: Date.now()
        };
        
        // Configuration des métriques à collecter
        this.metricConfig = {
            request: {
                enabled: true,
                fields: ['timestamp', 'service', 'method', 'url', 'userId', 'requestId', 'size']
            },
            response: {
                enabled: true,
                fields: ['timestamp', 'requestId', 'statusCode', 'responseTime', 'size', 'success']
            },
            error: {
                enabled: true,
                fields: ['timestamp', 'service', 'errorType', 'errorMessage', 'requestId']
            },
            system: {
                enabled: true,
                fields: ['timestamp', 'cpu', 'memory', 'disk', 'network']
            },
            custom: {
                enabled: true,
                fields: [] // Configuré dynamiquement
            }
        };
        
        // Initialisation
        this.ensureOutputDir();
    }

    ensureOutputDir() {
        if (!fs.existsSync(this.options.outputDir)) {
            fs.mkdirSync(this.options.outputDir, { recursive: true });
        }
    }

    /**
     * Enregistre une requête
     */
    recordRequest(requestData) {
        if (!this.metricConfig.request.enabled) return;
        
        const request = {
            timestamp: requestData.timestamp || new Date().toISOString(),
            service: requestData.service || 'unknown',
            method: requestData.method || 'GET',
            url: requestData.url || '',
            userId: requestData.userId || '',
            requestId: requestData.requestId || '',
            size: requestData.size || 0,
            phase: requestData.phase || 'unknown',
            ...requestData
        };
        
        this.metrics.requests.push(request);
        this.counters.totalRequests++;
        
        // Vérification d'alertes en temps réel
        if (this.options.enableRealTime) {
            this.checkRealtimeAlerts('request', request);
        }
    }

    /**
     * Enregistre une réponse
     */
    recordResponse(responseData) {
        if (!this.metricConfig.response.enabled) return;
        
        const response = {
            timestamp: responseData.timestamp || new Date().toISOString(),
            requestId: responseData.requestId || '',
            statusCode: responseData.statusCode || 0,
            responseTime: responseData.responseTime || 0,
            size: responseData.size || 0,
            success: responseData.success || false,
            ...responseData
        };
        
        this.metrics.responses.push(response);
        
        // Mise à jour des compteurs
        if (response.success) {
            this.counters.successfulRequests++;
        } else {
            this.counters.failedRequests++;
        }
        
        // Mise à jour des temps de réponse
        this.counters.totalResponseTime += response.responseTime;
        this.counters.minResponseTime = Math.min(this.counters.minResponseTime, response.responseTime);
        this.counters.maxResponseTime = Math.max(this.counters.maxResponseTime, response.responseTime);
        
        // Vérification d'alertes en temps réel
        if (this.options.enableRealTime) {
            this.checkRealtimeAlerts('response', response);
        }
    }

    /**
     * Enregistre une erreur
     */
    recordError(errorData) {
        if (!this.metricConfig.error.enabled) return;
        
        const error = {
            timestamp: errorData.timestamp || new Date().toISOString(),
            service: errorData.service || 'unknown',
            errorType: errorData.errorType || 'unknown',
            errorMessage: errorData.errorMessage || '',
            requestId: errorData.requestId || '',
            severity: errorData.severity || 'medium',
            ...errorData
        };
        
        this.metrics.errors.push(error);
        
        // Vérification d'alertes
        if (this.options.enableAlerts) {
            this.triggerAlert('error', error);
        }
    }

    /**
     * Enregistre des métriques système
     */
    recordSystemMetrics(systemData) {
        if (!this.metricConfig.system.enabled) return;
        
        const system = {
            timestamp: systemData.timestamp || new Date().toISOString(),
            cpu: systemData.cpu || {},
            memory: systemData.memory || {},
            disk: systemData.disk || {},
            network: systemData.network || {},
            ...systemData
        };
        
        this.metrics.systemMetrics.push(system);
        
        // Vérification d'alertes système
        if (this.options.enableAlerts) {
            this.checkSystemAlerts(system);
        }
    }

    /**
     * Enregistre des métriques personnalisées
     */
    recordCustomMetrics(name, data) {
        if (!this.metricConfig.custom.enabled) return;
        
        if (!this.metrics.customMetrics[name]) {
            this.metrics.customMetrics[name] = [];
        }
        
        const customMetric = {
            timestamp: new Date().toISOString(),
            name,
            data: {
                ...data,
                testName: this.testName
            }
        };
        
        this.metrics.customMetrics[name].push(customMetric);
    }

    /**
     * Calcule les statistiques de base
     */
    calculateBasicStats() {
        const requests = this.metrics.requests;
        const responses = this.metrics.responses;
        
        if (responses.length === 0) {
            return {
                totalRequests: this.counters.totalRequests,
                successfulRequests: 0,
                failedRequests: 0,
                successRate: 0,
                avgResponseTime: 0,
                p50ResponseTime: 0,
                p95ResponseTime: 0,
                p99ResponseTime: 0,
                minResponseTime: 0,
                maxResponseTime: 0
            };
        }
        
        const successfulResponses = responses.filter(r => r.success);
        const failedResponses = responses.filter(r => !r.success);
        
        const responseTimes = responses.map(r => r.responseTime).sort((a, b) => a - b);
        const successRate = (successfulResponses.length / responses.length) * 100;
        
        return {
            totalRequests: this.counters.totalRequests,
            successfulRequests: successfulResponses.length,
            failedRequests: failedResponses.length,
            successRate: parseFloat(successRate.toFixed(2)),
            avgResponseTime: this.counters.totalResponseTime / responses.length,
            p50ResponseTime: this.calculatePercentile(responseTimes, 50),
            p95ResponseTime: this.calculatePercentile(responseTimes, 95),
            p99ResponseTime: this.calculatePercentile(responseTimes, 99),
            minResponseTime: this.counters.minResponseTime === Infinity ? 0 : this.counters.minResponseTime,
            maxResponseTime: this.counters.maxResponseTime,
            totalDuration: Date.now() - this.counters.startTime
        };
    }

    /**
     * Calcule les statistiques par service
     */
    calculateServiceStats() {
        const serviceStats = {};
        const responses = this.metrics.responses;
        
        // Grouper par service
        responses.forEach(response => {
            const service = response.service || 'unknown';
            
            if (!serviceStats[service]) {
                serviceStats[service] = {
                    service,
                    totalRequests: 0,
                    successfulRequests: 0,
                    failedRequests: 0,
                    responseTimes: []
                };
            }
            
            serviceStats[service].totalRequests++;
            if (response.success) {
                serviceStats[service].successfulRequests++;
            } else {
                serviceStats[service].failedRequests++;
            }
            serviceStats[service].responseTimes.push(response.responseTime);
        });
        
        // Calculer les statistiques pour chaque service
        Object.keys(serviceStats).forEach(service => {
            const stats = serviceStats[service];
            stats.successRate = (stats.successfulRequests / stats.totalRequests) * 100;
            stats.avgResponseTime = stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length;
            stats.p95ResponseTime = this.calculatePercentile(stats.responseTimes, 95);
            stats.maxResponseTime = Math.max(...stats.responseTimes);
            
            delete stats.responseTimes; // Nettoyer
        });
        
        return serviceStats;
    }

    /**
     * Calcule les statistiques temporelles
     */
    calculateTemporalStats(interval = 60000) { // 1 minute par défaut
        const now = Date.now();
        const intervals = [];
        
        // Créer les intervalles de temps
        const startTime = this.counters.startTime;
        for (let time = startTime; time <= now; time += interval) {
            intervals.push({
                start: time,
                end: time + interval,
                requests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                totalResponseTime: 0,
                errors: []
            });
        }
        
        // Remplir les intervalles
        this.metrics.responses.forEach(response => {
            const responseTime = new Date(response.timestamp).getTime();
            const intervalIndex = Math.floor((responseTime - startTime) / interval);
            
            if (intervalIndex >= 0 && intervalIndex < intervals.length) {
                const interval = intervals[intervalIndex];
                interval.requests++;
                
                if (response.success) {
                    interval.successfulRequests++;
                } else {
                    interval.failedRequests++;
                    interval.errors.push(response);
                }
                
                interval.totalResponseTime += response.responseTime;
            }
        });
        
        // Calculer les métriques pour chaque intervalle
        intervals.forEach(interval => {
            if (interval.requests > 0) {
                interval.avgResponseTime = interval.totalResponseTime / interval.requests;
                interval.successRate = (interval.successfulRequests / interval.requests) * 100;
                interval.throughput = interval.requests / (interval / 1000); // requêtes par seconde
            }
        });
        
        return intervals;
    }

    /**
     * Génère un rapport complet
     */
    generateReport() {
        const basicStats = this.calculateBasicStats();
        const serviceStats = this.calculateServiceStats();
        const temporalStats = this.calculateTemporalStats();
        
        const report = {
            testName: this.testName,
            timestamp: new Date().toISOString(),
            duration: basicStats.totalDuration,
            
            // Statistiques de base
            overall: basicStats,
            
            // Statistiques par service
            services: serviceStats,
            
            // Statistiques temporelles
            temporal: temporalStats,
            
            // Métriques d'erreur
            errors: this.analyzeErrors(),
            
            // Alertes déclenchées
            alerts: this.metrics.alerts,
            
            // Données brutes (échantillon)
            sample: {
                recentRequests: this.metrics.requests.slice(-100),
                recentResponses: this.metrics.responses.slice(-100),
                recentErrors: this.metrics.errors.slice(-50)
            },
            
            // Métriques personnalisées
            custom: this.metrics.customMetrics
        };
        
        return report;
    }

    /**
     * Analyse les erreurs
     */
    analyzeErrors() {
        const errors = this.metrics.errors;
        
        if (errors.length === 0) {
            return {
                totalErrors: 0,
                errorTypes: {},
                errorTimeline: [],
                topErrors: []
            };
        }
        
        const errorTypes = {};
        const errorTimeline = {};
        
        errors.forEach(error => {
            // Compter les types d'erreurs
            errorTypes[error.errorType] = (errorTypes[error.errorType] || 0) + 1;
            
            // Grouper par minute
            const minute = new Date(error.timestamp).toISOString().slice(0, 16);
            errorTimeline[minute] = (errorTimeline[minute] || 0) + 1;
        });
        
        // Top des erreurs
        const topErrors = Object.entries(errorTypes)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([type, count]) => ({ type, count }));
        
        return {
            totalErrors: errors.length,
            errorTypes,
            errorTimeline,
            topErrors,
            errorRate: (errors.length / this.counters.totalRequests * 100).toFixed(2)
        };
    }

    /**
     * Vérifie les alertes en temps réel
     */
    checkRealtimeAlerts(type, data) {
        const thresholds = this.options.alertThresholds;
        
        if (type === 'response' && data.responseTime > thresholds.responseTime) {
            this.triggerAlert('slow_response', {
                requestId: data.requestId,
                responseTime: data.responseTime,
                threshold: thresholds.responseTime
            });
        }
        
        if (type === 'response' && !data.success) {
            const errorRate = this.counters.failedRequests / this.counters.totalRequests * 100;
            if (errorRate > thresholds.errorRate) {
                this.triggerAlert('high_error_rate', {
                    currentRate: errorRate,
                    threshold: thresholds.errorRate,
                    failedRequests: this.counters.failedRequests,
                    totalRequests: this.counters.totalRequests
                });
            }
        }
    }

    /**
     * Vérifie les alertes système
     */
    checkSystemAlerts(systemData) {
        const thresholds = this.options.alertThresholds;
        
        if (systemData.cpu && systemData.cpu.usage > thresholds.cpuUsage) {
            this.triggerAlert('high_cpu', {
                currentUsage: systemData.cpu.usage,
                threshold: thresholds.cpuUsage
            });
        }
        
        if (systemData.memory && systemData.memory.usagePercent > thresholds.memoryUsage) {
            this.triggerAlert('high_memory', {
                currentUsage: systemData.memory.usagePercent,
                threshold: thresholds.memoryUsage
            });
        }
    }

    /**
     * Déclenche une alerte
     */
    triggerAlert(type, data) {
        const alert = {
            type,
            timestamp: new Date().toISOString(),
            data,
            severity: this.calculateAlertSeverity(type, data)
        };
        
        this.metrics.alerts.push(alert);
        
        // Log de l'alerte
        console.log(`🚨 ALERTE [${alert.severity}]: ${type}`, data);
        
        // Dans un environnement réel, on pourrait envoyer cette alerte
        // vers un système de monitoring (Prometheus, Grafana, etc.)
    }

    /**
     * Calcule la sévérité d'une alerte
     */
    calculateAlertSeverity(type, data) {
        const severityThresholds = {
            slow_response: { critical: 10000, high: 5000 },
            high_error_rate: { critical: 50, high: 20 },
            high_cpu: { critical: 95, high: 85 },
            high_memory: { critical: 95, high: 80 }
        };
        
        const thresholds = severityThresholds[type];
        if (!thresholds) return 'medium';
        
        const value = data.currentRate || data.currentUsage || data.responseTime || 0;
        
        if (value > thresholds.critical) return 'critical';
        if (value > thresholds.high) return 'high';
        return 'medium';
    }

    /**
     * Sauvegarde le rapport
     */
    saveReport(filename = null) {
        const report = this.generateReport();
        const timestamp = new Date().toISOString().split('T')[0];
        const reportFilename = filename || `${this.testName}-${timestamp}.json`;
        const reportPath = path.join(this.options.outputDir, reportFilename);
        
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`📄 Rapport sauvegardé: ${reportPath}`);
        return reportPath;
    }

    /**
     * Exporte les métriques au format CSV
     */
    exportToCSV() {
        const timestamp = new Date().toISOString().split('T')[0];
        const csvPath = path.join(this.options.outputDir, `${this.testName}-${timestamp}.csv`);
        
        // Export des réponses
        const csvHeader = 'timestamp,service,requestId,statusCode,responseTime,success\n';
        let csvContent = csvHeader;
        
        this.metrics.responses.forEach(response => {
            csvContent += `${response.timestamp},${response.service},${response.requestId},${response.statusCode},${response.responseTime},${response.success}\n`;
        });
        
        fs.writeFileSync(csvPath, csvContent);
        console.log(`📊 Export CSV: ${csvPath}`);
        return csvPath;
    }

    /**
     * Utilitaires
     */
    calculatePercentile(sortedArray, percentile) {
        if (sortedArray.length === 0) return 0;
        const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
        return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
    }

    /**
     * Réinitialise les métriques
     */
    reset() {
        this.metrics = {
            requests: [],
            responses: [],
            errors: [],
            systemMetrics: [],
            customMetrics: {},
            alerts: []
        };
        
        this.counters = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalResponseTime: 0,
            minResponseTime: Infinity,
            maxResponseTime: 0,
            startTime: Date.now()
        };
        
        console.log('🔄 Métriques réinitialisées');
    }

    /**
     * Obtient les métriques en temps réel
     */
    getRealtimeMetrics() {
        const uptime = Date.now() - this.counters.startTime;
        const currentRPS = uptime > 0 ? this.counters.totalRequests / (uptime / 1000) : 0;
        
        return {
            uptime,
            totalRequests: this.counters.totalRequests,
            successfulRequests: this.counters.successfulRequests,
            failedRequests: this.counters.failedRequests,
            currentRPS: parseFloat(currentRPS.toFixed(2)),
            successRate: this.counters.totalRequests > 0 ? 
                (this.counters.successfulRequests / this.counters.totalRequests * 100).toFixed(2) : 0,
            avgResponseTime: this.counters.totalRequests > 0 ? 
                (this.counters.totalResponseTime / this.metrics.responses.length).toFixed(2) : 0,
            activeAlerts: this.metrics.alerts.filter(a => 
                Date.now() - new Date(a.timestamp).getTime() < 60000 // Alertes de la dernière minute
            ).length
        };
    }
}

module.exports = MetricsCollector;