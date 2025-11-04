#!/usr/bin/env node

/**
 * Script de démonstration du système de métriques IA
 * Montre les fonctionnalités principales et les cas d'usage
 */

const AIPerformanceOrchestrator = require('./ai-metrics-orchestrator');
const AlertThresholds = require('./alerts/alert-thresholds');

class AIDemo {
    constructor() {
        this.orchestrator = new AIPerformanceOrchestrator();
        this.alertThresholds = new AlertThresholds();
        this.demoResults = {};
    }

    async runDemo() {
        console.log('🎭 === DÉMONSTRATION SYSTÈME MÉTRIQUES IA ===');
        console.log('DocuCortex - Tests de Performance sous Charge\n');
        
        try {
            await this.showIntro();
            await this.demoBasicTests();
            await this.demoAlertSystem();
            await this.demoCustomConfiguration();
            await this.demoReportGeneration();
            await this.demoDashboardPreview();
            await this.showSummary();
            
        } catch (error) {
            console.error('❌ Erreur dans la démonstration:', error.message);
        }
    }

    async showIntro() {
        console.log('📋 FONCTIONNALITÉS PRÉSENTÉES:');
        console.log('  • Tests de performance Ollama IA');
        console.log('  • Tests EasyOCR multi-langues');
        console.log('  • Tests DocuCortex IA (chat, recherche, traitement)');
        console.log('  • Tests GED volumineux');
        console.log('  • Tests latence réseau');
        console.log('  • Tests de dégradation gracieuse');
        console.log('  • Système d\'alertes intelligent');
        console.log('  • Dashboard de monitoring temps réel');
        console.log('  • Génération de rapports détaillés\n');
        
        await this.sleep(2000);
    }

    async demoBasicTests() {
        console.log('🚀 === 1. TESTS DE PERFORMANCE DE BASE ===\n');
        
        console.log('⚡ Test rapide Ollama (mode mock)...');
        const ollamaConfig = {
            concurrentUsers: 3,
            testDuration: 60, // Test court pour la démo
            mockMode: true
        };
        
        const OllamaLoadTest = require('./scripts/ollama-load-test');
        const ollamaTest = new OllamaLoadTest(ollamaConfig);
        this.demoResults.ollama = await ollamaTest.run();
        
        console.log('\n⚡ Test EasyOCR (mode mock)...');
        const EasyOCRLoadTest = require('./scripts/easyocr-load-test');
        const ocrTest = new EasyOCRLoadTest({
            concurrentUsers: 2,
            totalDocuments: 20,
            mockMode: true
        });
        this.demoResults.easyocr = await ocrTest.run();
        
        console.log('\n✅ Tests de base terminés\n');
        await this.sleep(1000);
    }

    async demoAlertSystem() {
        console.log('🚨 === 2. SYSTÈME D\'ALERTES ===\n');
        
        console.log('📊 Simulation de métriques avec seuils d\'alerte...\n');
        
        // Simuler des métriques avec alertes
        const testScenarios = [
            { metric: 'responseTime', value: 3500, service: 'ollama', expected: 'warning' },
            { metric: 'responseTime', value: 6000, service: 'ollama', expected: 'critical' },
            { metric: 'successRate', value: 75, service: 'easyocr', expected: 'critical' },
            { metric: 'cpuUsage', value: 88, service: 'system', expected: 'high' },
            { metric: 'memoryUsage', value: 92, service: 'system', expected: 'critical' }
        ];
        
        console.log('Seuil\t\tValeur\tService\t\tNiveau');
        console.log('-'.repeat(55));
        
        testScenarios.forEach(scenario => {
            const result = this.alertThresholds.checkThreshold(
                scenario.metric,
                scenario.value,
                scenario.service
            );
            
            const status = result.triggered ? 'DÉCLENCHÉ' : 'Normal';
            const level = result.level || 'good';
            const badge = this.getAlertBadge(level);
            
            console.log(`${scenario.metric}\t${scenario.value}\t${scenario.service}\t\t${badge} ${status}`);
        });
        
        console.log('\n🔔 Alertes actives:');
        const activeAlerts = this.alertThresholds.getActiveAlerts();
        activeAlerts.slice(0, 3).forEach(alert => {
            const badge = this.getAlertBadge(alert.level);
            console.log(`${badge} ${alert.metricName} (${alert.serviceName}): ${alert.value}`);
        });
        
        console.log('\n📋 Rapport santé système:');
        const healthReport = this.alertThresholds.generateHealthReport();
        console.log(`  Score santé: ${healthReport.overall.healthScore}/100`);
        console.log(`  Statut: ${healthReport.overall.status.toUpperCase()}`);
        console.log(`  Alertes actives: ${healthReport.overall.totalActiveAlerts}\n`);
        
        await this.sleep(1500);
    }

    async demoCustomConfiguration() {
        console.log('⚙️ === 3. CONFIGURATION PERSONNALISÉE ===\n');
        
        console.log('🎯 Configuration de test personnalisée:\n');
        
        const customConfig = {
            ollama: {
                concurrentUsers: 8,
                testDuration: 120,
                prompt: "Expliquez l'intelligence artificielle en termes simples.",
                mockMode: true
            },
            easyocr: {
                concurrentUsers: 4,
                totalDocuments: 30,
                languages: ['fr', 'en', 'es', 'de'],
                batchSize: 5,
                mockMode: true
            },
            docucortex: {
                concurrentUsers: 12,
                testDuration: 90,
                modules: ['chat', 'search', 'process'],
                mockMode: true
            }
        };
        
        console.log(JSON.stringify(customConfig, null, 2));
        
        console.log('\n🏃‍♂️ Exécution avec configuration personnalisée...\n');
        
        const DocuCortexAILoadTest = require('./scripts/docucortex-ai-load-test');
        const docuTest = new DocuCortexAILoadTest(customConfig.docucortex);
        this.demoResults.docucortex = await docuTest.run();
        
        console.log('\n✅ Configuration personnalisée testée\n');
        await this.sleep(1000);
    }

    async demoReportGeneration() {
        console.log('📄 === 4. GÉNÉRATION DE RAPPORTS ===\n');
        
        console.log('📊 Génération de rapport consolidé...\n');
        
        // Générer un rapport avec les données de démo
        const mockTestResults = {
            ollama: this.demoResults.ollama || { 
                avgResponseTime: 1250, 
                successRate: 95.5, 
                totalRequests: 150 
            },
            easyocr: this.demoResults.easyocr || { 
                avgProcessingTime: 2100, 
                overallSuccessRate: 92.3, 
                totalImages: 45 
            },
            docucortex: this.demoResults.docucortex || {
                avgResponseTime: 850,
                successRate: 97.2,
                moduleMetrics: { chat: { avgResponseTime: 750 } }
            },
            ged: { 
                avgResponseTime: 650, 
                successRate: 99.1, 
                totalDocuments: 100,
                uploadMetrics: { throughputMBps: 8.5 }
            },
            network: {
                globalMetrics: { networkScore: 87.5, latencyScore: 91.2 },
                overallSuccessRate: 94.8
            }
        };
        
        const report = await this.orchestrator.generateConsolidatedReport(mockTestResults);
        
        console.log('📈 RÉSUMÉ DU RAPPORT:');
        console.log('  • Statut global:', report.summary.overallStatus.toUpperCase());
        console.log('  • Tests réussis:', `${report.summary.successfulTests}/${report.summary.totalTests}`);
        console.log('  • Score performance:', report.summary.performanceScore + '/100');
        console.log('  • Temps réponse moyen:', report.summary.avgResponseTime + 'ms');
        console.log('  • Taux succès global:', report.summary.overallSuccessRate + '%');
        
        console.log('\n🔍 ANALYSE DES PERFORMANCES:');
        console.log('  Goulots d\'étranglement:');
        report.performanceAnalysis.bottlenecks.slice(0, 3).forEach(b => {
            console.log('    -', b);
        });
        
        console.log('  \n  Performances excellentes:');
        report.performanceAnalysis.topPerformers.slice(0, 3).forEach(t => {
            console.log('    ✓', t);
        });
        
        console.log('\n💡 RECOMMANDATIONS:');
        report.recommendations.slice(0, 3).forEach((rec, i) => {
            console.log(`  ${i + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
            console.log(`     ${rec.description}`);
        });
        
        // Sauvegarder le rapport de démo
        const demoReportPath = './results/demo-report-' + Date.now() + '.json';
        require('fs').writeFileSync(demoReportPath, JSON.stringify(report, null, 2));
        console.log(`\n💾 Rapport sauvegardé: ${demoReportPath}\n`);
        
        await this.sleep(2000);
    }

    async demoDashboardPreview() {
        console.log('📊 === 5. APERÇU DASHBOARD ===\n');
        
        console.log('🖥️ Simulation du dashboard de monitoring:\n');
        
        // Simuler les données du dashboard
        const dashboardData = {
            currentMetrics: {
                rps: 12.5,
                avgResponseTime: 1150,
                successRate: 94.2,
                activeAlerts: 3
            },
            services: {
                ollama: { responseTime: 1200, throughput: 8.5, status: 'online' },
                easyocr: { responseTime: 2100, accuracy: 96.8, status: 'online' },
                docucortex: { chatResponse: 850, searchResponse: 320, status: 'online' },
                ged: { uploadSpeed: 8.2, searchResponse: 280, status: 'online' }
            },
            alerts: [
                { type: 'responseTime', service: 'ollama', level: 'warning', message: 'Temps de réponse élevé' },
                { type: 'memoryUsage', service: 'system', level: 'high', message: 'Utilisation mémoire' },
                { type: 'networkLatency', service: 'network', level: 'medium', message: 'Latence réseau' }
            ]
        };
        
        // Afficher les métriques principales
        console.log('📊 MÉTRIQUES TEMPS RÉEL:');
        console.log(`  Requêtes/sec: ${dashboardData.currentMetrics.rps}`);
        console.log(`  Temps réponse moy: ${dashboardData.currentMetrics.avgResponseTime}ms`);
        console.log(`  Taux succès: ${dashboardData.currentMetrics.successRate}%`);
        console.log(`  Alertes actives: ${dashboardData.currentMetrics.activeAlerts}`);
        
        console.log('\n🔧 ÉTAT DES SERVICES:');
        Object.entries(dashboardData.services).forEach(([service, metrics]) => {
            const status = metrics.status === 'online' ? '🟢' : '🔴';
            console.log(`  ${status} ${service.toUpperCase()}:`);
            
            Object.entries(metrics).forEach(([key, value]) => {
                if (key !== 'status') {
                    const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    console.log(`    ${displayKey}: ${value}${key.includes('Time') ? 'ms' : key.includes('Speed') || key.includes('throughput') ? ' MB/s' : key.includes('Accuracy') || key.includes('successRate') ? '%' : ''}`);
                }
            });
        });
        
        console.log('\n🚨 ALERTES RÉCENTES:');
        dashboardData.alerts.forEach(alert => {
            const badge = this.getAlertBadge(alert.level);
            console.log(`  ${badge} ${alert.service}: ${alert.message}`);
        });
        
        console.log('\n🌐 Le dashboard interactif complet est disponible dans:');
        console.log('    dashboards/metrics-dashboard.html');
        console.log('    (Ouvrir dans un navigateur web)\n');
        
        await this.sleep(1500);
    }

    async showSummary() {
        console.log('✨ === RÉSUMÉ DE LA DÉMONSTRATION ===\n');
        
        console.log('🎯 FONCTIONNALITÉS DÉMONTRÉES:');
        console.log('  ✅ Tests de performance multi-services');
        console.log('  ✅ Système d\'alertes intelligent');
        console.log('  ✅ Configuration flexible');
        console.log('  ✅ Génération de rapports détaillés');
        console.log('  ✅ Dashboard de monitoring');
        console.log('  ✅ Analyse et recommandations automatiques');
        
        console.log('\n📈 MÉTRIQUES DE LA DÉMO:');
        const totalTests = Object.keys(this.demoResults).length;
        const successfulTests = Object.values(this.demoResults).filter(r => r && !r.error).length;
        
        console.log(`  • Tests exécutés: ${totalTests}`);
        console.log(`  • Tests réussis: ${successfulTests}`);
        console.log(`  • Alertes configurées: 15+ seuils`);
        console.log(`  • Services monitorés: 6 (Ollama, EasyOCR, DocuCortex, GED, Réseau, Système)`);
        
        console.log('\n🚀 PROCHAINES ÉTAPES:');
        console.log('  1. Exécuter ./start-ai-metrics.sh pour le mode interactif');
        console.log('  2. Tester node ai-metrics-orchestrator.js --help pour les options');
        console.log('  3. Ouvrir dashboards/metrics-dashboard.html pour le monitoring');
        console.log('  4. Consulter README.md pour la documentation complète');
        console.log('  5. Configurer alert-config.json pour vos seuils');
        
        console.log('\n💡 EXEMPLES D\'UTILISATION:');
        console.log('  # Test rapide Ollama + EasyOCR');
        console.log('  ./start-ai-metrics.sh --quick');
        console.log('');
        console.log('  # Tests complets');
        console.log('  ./start-ai-metrics.sh --full');
        console.log('');
        console.log('  # Test spécifique avec configuration');
        console.log('  node ai-metrics-orchestrator.js --tests ollama --config custom-config.json');
        console.log('');
        console.log('  # Dashboard en temps réel');
        console.log('  ./start-ai-metrics.sh --dashboard');
        
        console.log('\n🎉 Démonstration terminée avec succès!');
        console.log('   Le système de métriques IA est prêt à l\'emploi.\n');
    }

    // Utilitaires
    getAlertBadge(level) {
        const badges = {
            critical: '🔴 CRITIQUE',
            high: '🟡 ÉLEVÉ',
            warning: '🟠 AVERTISSEMENT',
            medium: '🔵 MOYEN',
            low: '🟢 BAS'
        };
        return badges[level] || '⚪ NORMAL';
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Lancement de la démonstration
if (require.main === module) {
    const demo = new AIDemo();
    demo.runDemo()
        .then(() => {
            console.log('👋 Démonstration terminée. Au revoir!');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Erreur démonstration:', error);
            process.exit(1);
        });
}

module.exports = AIDemo;