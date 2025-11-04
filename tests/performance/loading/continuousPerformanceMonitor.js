#!/usr/bin/env node

/**
 * Système de Surveillance de Performance Continue - RDS Viewer Anecoop
 * Surveille en continu les performances de l'application et génère des alertes
 * 
 * Date: 2025-11-04
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');
const LoadingPerformanceTest = require('./loadingPerformanceTest');
const PerformanceReportGenerator = require('./performanceReportGenerator');
const { PerformanceEvaluator } = require('./performanceBenchmarks');

class ContinuousPerformanceMonitor {
    constructor(config = {}) {
        this.config = {
            // Configuration par défaut
            baseUrl: config.baseUrl || 'http://localhost:3000',
            checkInterval: config.checkInterval || '*/15 * * * *', // Toutes les 15 minutes
            alertThresholds: config.alertThresholds || {
                pageLoadTime: 5000, // ms
                fcp: 3000, // ms
                memoryUsage: 100, // MB
                errorRate: 5 // %
            },
            notifications: {
                email: config.email || null,
                webhook: config.webhook || null,
                slack: config.slack || null
            },
            retentionDays: config.retentionDays || 30,
            outputDir: config.outputDir || __dirname,
            ...config
        };

        this.browser = null;
        this.isMonitoring = false;
        this.monitoringData = {
            startTime: null,
            checks: [],
            alerts: [],
            trends: {}
        };
        
        this.evaluator = new PerformanceEvaluator();
        this.reportGenerator = new PerformanceReportGenerator();
        
        this.scheduler = null;
    }

    /**
     * Démarre la surveillance continue
     */
    async startMonitoring() {
        if (this.isMonitoring) {
            console.log('⚠️ La surveillance est déjà en cours');
            return;
        }

        console.log('🚀 Démarrage de la surveillance de performance continue...');
        console.log(`📊 URL de base: ${this.config.baseUrl}`);
        console.log(`⏰ Intervalle de vérification: ${this.config.checkInterval}`);
        console.log(`🚨 Seuils d'alerte:`, this.config.alertThresholds);

        this.monitoringData.startTime = new Date().toISOString();
        this.isMonitoring = true;

        // Initialiser le navigateur
        await this.initializeBrowser();

        // Planifier les vérifications automatiques
        this.schedulePeriodicChecks();

        // Effectuer une vérification immédiate
        await this.performHealthCheck();

        console.log('✅ Surveillance démarrée avec succès');
    }

    /**
     * Arrête la surveillance
     */
    async stopMonitoring() {
        if (!this.isMonitoring) {
            console.log('⚠️ La surveillance n\'est pas en cours');
            return;
        }

        console.log('🛑 Arrêt de la surveillance...');

        this.isMonitoring = false;
        
        if (this.scheduler) {
            this.scheduler.stop();
        }

        if (this.browser) {
            await this.browser.close();
        }

        // Sauvegarder les données finales
        await this.saveMonitoringData();
        
        console.log('✅ Surveillance arrêtée');
    }

    /**
     * Initialise le navigateur pour la surveillance
     */
    async initializeBrowser() {
        try {
            this.browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding',
                    '--disable-extensions',
                    '--no-first-run'
                ]
            });

            // Configurer les métriques de performance
            this.browser.on('disconnected', async () => {
                console.warn('⚠️ Navigation déconnectée, tentative de reconnexion...');
                if (this.isMonitoring) {
                    setTimeout(() => this.initializeBrowser(), 5000);
                }
            });

        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation du navigateur:', error);
            throw error;
        }
    }

    /**
     * Planifie les vérifications périodiques
     */
    schedulePeriodicChecks() {
        this.scheduler = cron.schedule(this.config.checkInterval, async () => {
            if (this.isMonitoring) {
                console.log('\n🔍 Vérification programmée démarrée...');
                await this.performHealthCheck();
            }
        }, {
            scheduled: false
        });

        this.scheduler.start();
        console.log(`⏰ Vérifications programmées: ${this.config.checkInterval}`);
    }

    /**
     * Effectue une vérification complète de santé
     */
    async performHealthCheck() {
        const checkStartTime = new Date().toISOString();
        console.log(`🔍 Vérification de santé: ${checkStartTime}`);

        try {
            const page = await this.browser.newPage();
            
            // Configurer la page pour la surveillance
            await this.configurePageForMonitoring(page);

            // Tester la connectivité
            const connectivityResult = await this.testConnectivity(page);
            
            // Tester les pages principales
            const pagesResult = await this.testCriticalPages(page);
            
            // Tester les métriques de performance
            const performanceResult = await this.testPerformanceMetrics(page);
            
            // Compiler les résultats
            const checkResult = {
                timestamp: checkStartTime,
                status: this.determineOverallStatus(connectivityResult, pagesResult, performanceResult),
                connectivity: connectivityResult,
                pages: pagesResult,
                performance: performanceResult,
                alerts: this.generateAlerts(connectivityResult, pagesResult, performanceResult)
            };

            // Sauvegarder les résultats
            await this.saveCheckResult(checkResult);
            
            // Traiter les alertes
            await this.processAlerts(checkResult.alerts);
            
            // Mettre à jour les tendances
            this.updateTrends(checkResult);

            await page.close();

            this.monitoringData.checks.push(checkResult);
            
            console.log(`✅ Vérification terminée: ${checkResult.status}`);

        } catch (error) {
            console.error('❌ Erreur lors de la vérification de santé:', error);
            
            const errorCheck = {
                timestamp: checkStartTime,
                status: 'error',
                error: error.message,
                alerts: [{
                    type: 'system',
                    severity: 'critical',
                    message: `Erreur système lors de la vérification: ${error.message}`,
                    timestamp: new Date().toISOString()
                }]
            };

            await this.saveCheckResult(errorCheck);
            await this.processAlerts(errorCheck.alerts);
        }
    }

    /**
     * Configure la page pour la surveillance
     */
    async configurePageForMonitoring(page) {
        // Activer la mise en cache pour des tests plus réalistes
        await page.setCacheEnabled(true);
        
        // Configurer le viewport standard
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Désactiver les images pour accélérer les tests
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (req.resourceType() === 'image' || req.resourceType() === 'media') {
                req.abort();
            } else {
                req.continue();
            }
        });
        
        // Capturer les erreurs JavaScript
        page.on('pageerror', (error) => {
            console.warn(`⚠️ Erreur JavaScript: ${error.message}`);
        });
    }

    /**
     * Teste la connectivité de base
     */
    async testConnectivity(page) {
        console.log('🔌 Test de connectivité...');
        
        const startTime = performance.now();
        
        try {
            const response = await page.goto(this.config.baseUrl, {
                waitUntil: 'networkidle2',
                timeout: 10000
            });
            
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            
            return {
                status: response.ok() ? 'ok' : 'error',
                responseTime,
                statusCode: response.status(),
                url: this.config.baseUrl,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            return {
                status: 'error',
                responseTime: performance.now() - startTime,
                error: error.message,
                url: this.config.baseUrl,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Teste les pages critiques
     */
    async testCriticalPages(page) {
        console.log('📄 Test des pages critiques...');
        
        const criticalPages = [
            { name: 'Dashboard', url: '/dashboard' },
            { name: 'Utilisateurs', url: '/users' },
            { name: 'Prêts', url: '/loans' },
            { name: 'Sessions RDS', url: '/sessions' }
        ];

        const results = {};

        for (const pageInfo of criticalPages) {
            try {
                const pageStartTime = performance.now();
                
                const response = await page.goto(
                    `${this.config.baseUrl}${pageInfo.url}`,
                    { waitUntil: 'networkidle2', timeout: 30000 }
                );
                
                const pageEndTime = performance.now();
                
                // Mesurer les métriques de performance
                const performanceMetrics = await page.evaluate(() => {
                    const navigation = performance.getEntriesByType('navigation')[0];
                    const paint = performance.getEntriesByType('paint');
                    
                    return {
                        loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
                        domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
                        firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
                        connectionType: navigator.connection ? navigator.connection.effectiveType : 'unknown'
                    };
                });
                
                results[pageInfo.name] = {
                    status: response.ok() ? 'ok' : 'error',
                    responseTime: pageEndTime - pageStartTime,
                    statusCode: response.status(),
                    ...performanceMetrics,
                    url: `${this.config.baseUrl}${pageInfo.url}`,
                    timestamp: new Date().toISOString()
                };
                
                console.log(`  ✅ ${pageInfo.name}: ${performanceMetrics.loadTime.toFixed(0)}ms`);
                
            } catch (error) {
                results[pageInfo.name] = {
                    status: 'error',
                    responseTime: 0,
                    error: error.message,
                    url: `${this.config.baseUrl}${pageInfo.url}`,
                    timestamp: new Date().toISOString()
                };
                
                console.log(`  ❌ ${pageInfo.name}: ${error.message}`);
            }
        }

        return results;
    }

    /**
     * Teste les métriques de performance globales
     */
    async testPerformanceMetrics(page) {
        console.log('📊 Test des métriques de performance...');
        
        try {
            // Aller sur le dashboard pour les tests
            await page.goto(`${this.config.baseUrl}/dashboard`, {
                waitUntil: 'networkidle2'
            });

            const metrics = await page.evaluate(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                const paint = performance.getEntriesByType('paint');
                
                // Mesurer l'utilisation mémoire
                let memoryUsage = null;
                if (performance.memory) {
                    memoryUsage = {
                        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
                    };
                }
                
                return {
                    loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
                    firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
                    domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
                    memoryUsage,
                    connectionType: navigator.connection ? navigator.connection.effectiveType : 'unknown',
                    userAgent: navigator.userAgent
                };
            });

            return {
                ...metrics,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            return {
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Détermine le statut global de la vérification
     */
    determineOverallStatus(connectivity, pages, performance) {
        // Vérifier les erreurs critiques
        if (connectivity.status === 'error') {
            return 'critical';
        }
        
        const pageErrors = Object.values(pages).filter(p => p.status === 'error').length;
        if (pageErrors > 0) {
            return pageErrors >= 2 ? 'critical' : 'warning';
        }
        
        // Vérifier les seuils de performance
        const performanceIssues = Object.values(pages).filter(p => 
            p.loadTime && p.loadTime > this.config.alertThresholds.pageLoadTime
        ).length;
        
        if (performanceIssues > 0) {
            return performanceIssues >= 2 ? 'warning' : 'ok';
        }
        
        return 'ok';
    }

    /**
     * Génère des alertes basées sur les résultats
     */
    generateAlerts(connectivity, pages, performance) {
        const alerts = [];

        // Alerte de connectivité
        if (connectivity.status === 'error') {
            alerts.push({
                type: 'connectivity',
                severity: 'critical',
                message: `Impossible de se connecter à l'application: ${connectivity.error}`,
                timestamp: new Date().toISOString(),
                data: connectivity
            });
        }

        // Alertes de performance des pages
        Object.entries(pages).forEach(([pageName, pageData]) => {
            if (pageData.status === 'error') {
                alerts.push({
                    type: 'page_error',
                    severity: 'critical',
                    message: `Erreur sur la page ${pageName}: ${pageData.error}`,
                    timestamp: new Date().toISOString(),
                    data: pageData
                });
            } else if (pageData.loadTime > this.config.alertThresholds.pageLoadTime) {
                alerts.push({
                    type: 'performance',
                    severity: 'warning',
                    message: `Temps de chargement élevé pour ${pageName}: ${pageData.loadTime.toFixed(0)}ms`,
                    timestamp: new Date().toISOString(),
                    data: pageData
                });
            }
        });

        // Alertes de métriques de performance
        if (performance.firstContentfulPaint > this.config.alertThresholds.fcp) {
            alerts.push({
                type: 'performance',
                severity: 'warning',
                message: `First Contentful Paint élevé: ${performance.firstContentfulPaint.toFixed(0)}ms`,
                timestamp: new Date().toISOString(),
                data: performance
            });
        }

        if (performance.memoryUsage && performance.memoryUsage.used > this.config.alertThresholds.memoryUsage) {
            alerts.push({
                type: 'memory',
                severity: 'warning',
                message: `Consommation mémoire élevée: ${performance.memoryUsage.used}MB`,
                timestamp: new Date().toISOString(),
                data: performance
            });
        }

        return alerts;
    }

    /**
     * Traite les alertes (notifications, etc.)
     */
    async processAlerts(alerts) {
        if (alerts.length === 0) return;

        console.log(`🚨 ${alerts.length} alerte(s) générée(s):`);
        
        for (const alert of alerts) {
            console.log(`  ${alert.severity.toUpperCase()}: ${alert.message}`);
            
            // Ajouter à la liste des alertes
            this.monitoringData.alerts.push(alert);
            
            // Envoyer les notifications
            await this.sendNotifications(alert);
        }
    }

    /**
     * Envoie les notifications
     */
    async sendNotifications(alert) {
        try {
            // Notification par email (si configurée)
            if (this.config.notifications.email) {
                await this.sendEmailNotification(alert);
            }
            
            // Notification par webhook (si configurée)
            if (this.config.notifications.webhook) {
                await this.sendWebhookNotification(alert);
            }
            
            // Notification Slack (si configurée)
            if (this.config.notifications.slack) {
                await this.sendSlackNotification(alert);
            }
            
        } catch (error) {
            console.warn(`⚠️ Erreur lors de l'envoi de notification: ${error.message}`);
        }
    }

    /**
     * Envoie une notification email
     */
    async sendEmailNotification(alert) {
        // Implémentation d'envoi d'email
        console.log(`📧 Notification email: ${alert.message}`);
    }

    /**
     * Envoie une notification webhook
     */
    async sendWebhookNotification(alert) {
        try {
            const response = await fetch(this.config.notifications.webhook, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    alert,
                    timestamp: new Date().toISOString(),
                    source: 'RDS Viewer Performance Monitor'
                })
            });
            
            if (response.ok) {
                console.log(`🔗 Notification webhook envoyée: ${alert.message}`);
            }
        } catch (error) {
            console.warn(`⚠️ Erreur webhook: ${error.message}`);
        }
    }

    /**
     * Envoie une notification Slack
     */
    async sendSlackNotification(alert) {
        try {
            const slackPayload = {
                text: `🚨 Alerte Performance RDS Viewer`,
                attachments: [
                    {
                        color: alert.severity === 'critical' ? 'danger' : 'warning',
                        fields: [
                            {
                                title: 'Type',
                                value: alert.type,
                                short: true
                            },
                            {
                                title: 'Sévérité',
                                value: alert.severity,
                                short: true
                            },
                            {
                                title: 'Message',
                                value: alert.message,
                                short: false
                            },
                            {
                                title: 'Horodatage',
                                value: alert.timestamp,
                                short: true
                            }
                        ]
                    }
                ]
            };

            const response = await fetch(this.config.notifications.slack, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(slackPayload)
            });
            
            if (response.ok) {
                console.log(`💬 Notification Slack envoyée: ${alert.message}`);
            }
        } catch (error) {
            console.warn(`⚠️ Erreur Slack: ${error.message}`);
        }
    }

    /**
     * Met à jour les tendances
     */
    updateTrends(checkResult) {
        const hour = new Date().getHours();
        
        if (!this.monitoringData.trends[hour]) {
            this.monitoringData.trends[hour] = {
                checks: 0,
                totalResponseTime: 0,
                alertsCount: 0,
                statusCounts: {}
            };
        }
        
        const trend = this.monitoringData.trends[hour];
        trend.checks++;
        trend.alertsCount += checkResult.alerts.length;
        
        // Ajouter les temps de réponse
        Object.values(checkResult.pages).forEach(page => {
            trend.totalResponseTime += page.responseTime || 0;
        });
        
        // Compter les statuts
        trend.statusCounts[checkResult.status] = (trend.statusCounts[checkResult.status] || 0) + 1;
    }

    /**
     * Sauvegarde les résultats d'une vérification
     */
    async saveCheckResult(checkResult) {
        const filename = `health-check-${new Date().toISOString().split('T')[0]}.json`;
        const filepath = path.join(this.config.outputDir, 'monitoring', filename);
        
        // Créer le répertoire si nécessaire
        await fs.mkdir(path.dirname(filepath), { recursive: true });
        
        // Lire les données existantes
        let existingData = [];
        try {
            const existingContent = await fs.readFile(filepath, 'utf8');
            existingData = JSON.parse(existingContent);
        } catch (error) {
            // Fichier inexistant, continuer avec un tableau vide
        }
        
        // Ajouter le nouveau résultat
        existingData.push(checkResult);
        
        // Garder seulement les derniers jours selon la configuration
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);
        
        const filteredData = existingData.filter(check => 
            new Date(check.timestamp) > cutoffDate
        );
        
        // Sauvegarder
        await fs.writeFile(filepath, JSON.stringify(filteredData, null, 2));
    }

    /**
     * Sauvegarde les données de surveillance
     */
    async saveMonitoringData() {
        const filename = `monitoring-summary-${new Date().toISOString().split('T')[0]}.json`;
        const filepath = path.join(this.config.outputDir, 'monitoring', filename);
        
        await fs.mkdir(path.dirname(filepath), { recursive: true });
        await fs.writeFile(filepath, JSON.stringify(this.monitoringData, null, 2));
        
        console.log(`💾 Données de surveillance sauvegardées: ${filepath}`);
    }

    /**
     * Génère un rapport de surveillance
     */
    async generateMonitoringReport() {
        console.log('📊 Génération du rapport de surveillance...');
        
        const report = {
            summary: {
                totalChecks: this.monitoringData.checks.length,
                totalAlerts: this.monitoringData.alerts.length,
                uptime: this.calculateUptime(),
                averageResponseTime: this.calculateAverageResponseTime()
            },
            alerts: this.monitoringData.alerts,
            trends: this.monitoringData.trends,
            recommendations: this.generateMonitoringRecommendations()
        };
        
        const reportPath = await this.reportGenerator.generateFullReport({
            summary: report.summary,
            pages: this.monitoringData.checks.slice(-1)[0]?.pages || {},
            recommendations: report.recommendations
        });
        
        return reportPath;
    }

    /**
     * Calcule le temps de fonctionnement
     */
    calculateUptime() {
        if (!this.monitoringData.startTime) return 0;
        
        const start = new Date(this.monitoringData.startTime);
        const now = new Date();
        return Math.round((now - start) / 1000 / 60); // minutes
    }

    /**
     * Calcule le temps de réponse moyen
     */
    calculateAverageResponseTime() {
        if (this.monitoringData.checks.length === 0) return 0;
        
        const totalResponseTime = this.monitoringData.checks.reduce((sum, check) => {
            const pageTimes = Object.values(check.pages || {}).map(p => p.responseTime || 0);
            return sum + pageTimes.reduce((pageSum, time) => pageSum + time, 0);
        }, 0);
        
        const totalPages = this.monitoringData.checks.reduce((sum, check) => {
            return sum + Object.keys(check.pages || {}).length;
        }, 0);
        
        return totalPages > 0 ? totalResponseTime / totalPages : 0;
    }

    /**
     * Génère des recommandations basées sur la surveillance
     */
    generateMonitoringRecommendations() {
        const recommendations = [];
        
        // Analyser les alertes critiques
        const criticalAlerts = this.monitoringData.alerts.filter(a => a.severity === 'critical');
        if (criticalAlerts.length > 0) {
            recommendations.push({
                priority: 'high',
                category: 'reliability',
                issue: `${criticalAlerts.length} alerte(s) critique(s) détectée(s)`,
                suggestion: 'Analyser et corriger les problèmes de connectivité et d\'erreurs système',
                impact: 'Amélioration de la disponibilité de l\'application'
            });
        }
        
        // Analyser les tendances de performance
        const avgResponseTime = this.calculateAverageResponseTime();
        if (avgResponseTime > this.config.alertThresholds.pageLoadTime) {
            recommendations.push({
                priority: 'medium',
                category: 'performance',
                issue: 'Temps de réponse moyen élevé',
                suggestion: 'Optimiser les performances des pages critiques',
                impact: 'Amélioration de l\'expérience utilisateur'
            });
        }
        
        return recommendations;
    }
}

// Configuration par défaut pour les tests
const defaultConfig = {
    baseUrl: 'http://localhost:3000',
    checkInterval: '*/30 * * * *', // Toutes les 30 minutes pour les tests
    alertThresholds: {
        pageLoadTime: 8000, // Plus permissif pour les tests
        fcp: 5000,
        memoryUsage: 200,
        errorRate: 10
    },
    retentionDays: 7, // Réduire pour les tests
    outputDir: path.join(__dirname, 'monitoring')
};

// Point d'entrée principal
async function main() {
    const config = process.argv.includes('--test') ? defaultConfig : {};
    const monitor = new ContinuousPerformanceMonitor(config);
    
    const command = process.argv[2];
    
    switch (command) {
        case 'start':
            await monitor.startMonitoring();
            // Maintenir le processus en vie
            process.on('SIGINT', async () => {
                console.log('\n🛑 Réception du signal d\'arrêt...');
                await monitor.stopMonitoring();
                process.exit(0);
            });
            break;
            
        case 'stop':
            await monitor.stopMonitoring();
            break;
            
        case 'report':
            const reportPath = await monitor.generateMonitoringReport();
            console.log(`📊 Rapport généré: ${reportPath}`);
            break;
            
        default:
            console.log(`
🚀 Surveillance de Performance Continue - RDS Viewer Anecoop

Usage: node continuousPerformanceMonitor.js <commande>

Commandes:
  start    Démarre la surveillance continue
  stop     Arrête la surveillance
  report   Génère un rapport de surveillance

Options:
  --test    Utilise la configuration de test (intervalles plus courts)

Exemples:
  node continuousPerformanceMonitor.js start
  node continuousPerformanceMonitor.js start --test
  node continuousPerformanceMonitor.js report
            `);
            process.exit(1);
    }
}

// Export pour utilisation dans d'autres modules
module.exports = ContinuousPerformanceMonitor;

// Exécution directe
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Erreur:', error);
        process.exit(1);
    });
}