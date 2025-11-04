#!/usr/bin/env node

/**
 * Orchestrateur principal des tests de métriques IA
 * Exécute tous les tests de performance et génère les rapports
 */

const path = require('path');
const fs = require('fs');

// Importer les modules de test
const OllamaLoadTest = require('./scripts/ollama-load-test');
const EasyOCRLoadTest = require('./scripts/easyocr-load-test');
const DocuCortexAILoadTest = require('./scripts/docucortex-ai-load-test');
const GEDVolumeLoadTest = require('./scripts/ged-volume-load-test');
const NetworkLatencyTest = require('./scripts/network-latency-test');
const GracefulDegradationTest = require('./scripts/graceful-degradation-test');

// Importer les modules partagés
const AlertThresholds = require('./alerts/alert-thresholds');

class AIPerformanceOrchestrator {
    constructor() {
        this.results = {};
        this.alertThresholds = new AlertThresholds({
            configPath: './alerts/alert-config.json'
        });
        this.startTime = Date.now();
        
        // Configuration des tests
        this.testConfigs = {
            ollama: {
                enabled: true,
                concurrentUsers: 5,
                testDuration: 300
            },
            easyocr: {
                enabled: true,
                totalDocuments: 50,
                concurrentUsers: 3
            },
            docucortex: {
                enabled: true,
                concurrentUsers: 8,
                testDuration: 240
            },
            ged: {
                enabled: true,
                totalDocuments: 100,
                concurrentUploads: 5
            },
            network: {
                enabled: true,
                testDuration: 180
            },
            degradation: {
                enabled: true,
                maxUsers: 30,
                testDuration: 600
            }
        };
    }

    async runAllTests(options = {}) {
        console.log('🚀 Démarrage de la suite complète de tests de métriques IA');
        console.log('⏰ Début:', new Date().toLocaleString());
        console.log('=' .repeat(60));
        
        try {
            // Configuration des tests
            this.configureTests(options);
            
            // Exécution séquentielle des tests
            const testResults = await this.runTestsSequentially(options.parallel);
            
            // Génération du rapport consolidé
            await this.generateConsolidatedReport(testResults);
            
            // Génération des alertes basées sur les résultats
            await this.processAlerts(testResults);
            
            console.log('\n✅ Suite de tests terminée avec succès');
            console.log(`⏱️ Durée totale: ${this.formatDuration(Date.now() - this.startTime)}`);
            
            return testResults;
            
        } catch (error) {
            console.error('❌ Erreur dans l\'orchestrateur:', error);
            throw error;
        }
    }

    async runTestsSequentially(parallel = false) {
        const testResults = {};
        
        if (parallel) {
            // Exécution parallèle des tests indépendants
            console.log('🔄 Exécution en parallèle...');
            
            const testPromises = [];
            
            if (this.testConfigs.ollama.enabled) {
                testPromises.push(this.runOllamaTest().then(result => ({ name: 'ollama', result })));
            }
            
            if (this.testConfigs.easyocr.enabled) {
                testPromises.push(this.runEasyOCRTest().then(result => ({ name: 'easyocr', result })));
            }
            
            if (this.testConfigs.network.enabled) {
                testPromises.push(this.runNetworkTest().then(result => ({ name: 'network', result })));
            }
            
            // Tests dépendants (séquentiels)
            testPromises.push(this.runDocuCortexTest().then(result => ({ name: 'docucortex', result })));
            testPromises.push(this.runGEDTest().then(result => ({ name: 'ged', result })));
            testPromises.push(this.runDegradationTest().then(result => ({ name: 'degradation', result })));
            
            const results = await Promise.allSettled(testPromises);
            
            results.forEach(result => {
                if (result.status === 'fulfilled') {
                    testResults[result.value.name] = result.value.result;
                } else {
                    console.error('❌ Échec d\'un test:', result.reason);
                    testResults[result.value?.name || 'unknown'] = { error: result.reason.message };
                }
            });
            
        } else {
            // Exécution séquentielle
            console.log('🔄 Exécution séquentielle...');
            
            if (this.testConfigs.ollama.enabled) {
                console.log('\n📋 Test 1/6: Ollama IA');
                testResults.ollama = await this.runOllamaTest();
            }
            
            if (this.testConfigs.easyocr.enabled) {
                console.log('\n📋 Test 2/6: EasyOCR');
                testResults.easyocr = await this.runEasyOCRTest();
            }
            
            if (this.testConfigs.docucortex.enabled) {
                console.log('\n📋 Test 3/6: DocuCortex IA');
                testResults.docucortex = await this.runDocuCortexTest();
            }
            
            if (this.testConfigs.ged.enabled) {
                console.log('\n📋 Test 4/6: GED Volume');
                testResults.ged = await this.runGEDTest();
            }
            
            if (this.testConfigs.network.enabled) {
                console.log('\n📋 Test 5/6: Latence Réseau');
                testResults.network = await this.runNetworkTest();
            }
            
            if (this.testConfigs.degradation.enabled) {
                console.log('\n📋 Test 6/6: Dégradation Gracieuse');
                testResults.degradation = await this.runDegradationTest();
            }
        }
        
        return testResults;
    }

    async runOllamaTest() {
        try {
            console.log('🤖 Test Ollama IA...');
            const test = new OllamaLoadTest(this.testConfigs.ollama);
            const result = await test.run();
            console.log('✅ Test Ollama terminé');
            return result;
        } catch (error) {
            console.error('❌ Échec test Ollama:', error.message);
            return { error: error.message, success: false };
        }
    }

    async runEasyOCRTest() {
        try {
            console.log('👁️ Test EasyOCR...');
            const test = new EasyOCRLoadTest(this.testConfigs.easyocr);
            const result = await test.run();
            console.log('✅ Test EasyOCR terminé');
            return result;
        } catch (error) {
            console.error('❌ Échec test EasyOCR:', error.message);
            return { error: error.message, success: false };
        }
    }

    async runDocuCortexTest() {
        try {
            console.log('💬 Test DocuCortex IA...');
            const test = new DocuCortexAILoadTest(this.testConfigs.docucortex);
            const result = await test.run();
            console.log('✅ Test DocuCortex terminé');
            return result;
        } catch (error) {
            console.error('❌ Échec test DocuCortex:', error.message);
            return { error: error.message, success: false };
        }
    }

    async runGEDTest() {
        try {
            console.log('📁 Test GED Volume...');
            const test = new GEDVolumeLoadTest(this.testConfigs.ged);
            const result = await test.run();
            console.log('✅ Test GED terminé');
            return result;
        } catch (error) {
            console.error('❌ Échec test GED:', error.message);
            return { error: error.message, success: false };
        }
    }

    async runNetworkTest() {
        try {
            console.log('🌐 Test Latence Réseau...');
            const test = new NetworkLatencyTest(this.testConfigs.network);
            const result = await test.run();
            console.log('✅ Test réseau terminé');
            return result;
        } catch (error) {
            console.error('❌ Échec test réseau:', error.message);
            return { error: error.message, success: false };
        }
    }

    async runDegradationTest() {
        try {
            console.log('🔄 Test Dégradation Gracieuse...');
            const test = new GracefulDegradationTest(this.testConfigs.degradation);
            const result = await test.run();
            console.log('✅ Test dégradation terminé');
            return result;
        } catch (error) {
            console.error('❌ Échec test dégradation:', error.message);
            return { error: error.message, success: false };
        }
    }

    async generateConsolidatedReport(testResults) {
        console.log('\n📊 Génération du rapport consolidé...');
        
        const consolidatedReport = {
            metadata: {
                testSuite: 'AI Performance Metrics Suite',
                version: '1.0',
                timestamp: new Date().toISOString(),
                duration: Date.now() - this.startTime,
                executedTests: Object.keys(testResults).length,
                successfulTests: Object.values(testResults).filter(r => r && !r.error).length
            },
            
            summary: this.generateSummary(testResults),
            
            results: testResults,
            
            performanceAnalysis: this.analyzePerformance(testResults),
            
            recommendations: this.generateRecommendations(testResults),
            
            alerts: await this.generateAlertsReport(),
            
            configuration: this.testConfigs
        };
        
        // Sauvegarder le rapport
        const reportPath = `./results/ai-metrics-consolidated-${new Date().toISOString().split('T')[0]}.json`;
        fs.writeFileSync(reportPath, JSON.stringify(consolidatedReport, null, 2));
        
        // Générer un rapport markdown lisible
        await this.generateMarkdownReport(consolidatedReport);
        
        console.log(`💾 Rapport sauvegardé: ${reportPath}`);
        
        this.results = consolidatedReport;
        return consolidatedReport;
    }

    generateSummary(testResults) {
        const summary = {
            overallStatus: 'unknown',
            totalTests: Object.keys(testResults).length,
            successfulTests: 0,
            failedTests: 0,
            totalRequests: 0,
            overallSuccessRate: 0,
            avgResponseTime: 0,
            criticalIssues: [],
            performanceScore: 0
        };
        
        let totalResponseTime = 0;
        let totalRequests = 0;
        let successfulRequests = 0;
        
        Object.entries(testResults).forEach(([testName, result]) => {
            if (result && !result.error) {
                summary.successfulTests++;
                
                // Accumuler les métriques
                if (result.totalRequests) {
                    totalRequests += result.totalRequests;
                    summary.totalRequests += result.totalRequests;
                }
                
                if (result.successfulRequests) {
                    successfulRequests += result.successfulRequests;
                }
                
                if (result.avgResponseTime) {
                    totalResponseTime += parseFloat(result.avgResponseTime);
                }
                
            } else {
                summary.failedTests++;
                summary.criticalIssues.push(`${testName}: ${result?.error || 'Erreur inconnue'}`);
            }
        });
        
        // Calculer les métriques globales
        summary.overallSuccessRate = totalRequests > 0 ? 
            ((successfulRequests / totalRequests) * 100).toFixed(2) : 0;
        
        summary.avgResponseTime = summary.successfulTests > 0 ? 
            (totalResponseTime / summary.successfulTests).toFixed(2) : 0;
        
        // Déterminer le statut global
        if (summary.failedTests === 0 && summary.criticalIssues.length === 0) {
            summary.overallStatus = 'success';
        } else if (summary.failedTests <= summary.totalTests * 0.2) {
            summary.overallStatus = 'partial';
        } else {
            summary.overallStatus = 'failure';
        }
        
        // Calculer un score de performance
        summary.performanceScore = this.calculatePerformanceScore(testResults);
        
        return summary;
    }

    calculatePerformanceScore(testResults) {
        let score = 100;
        
        Object.entries(testResults).forEach(([testName, result]) => {
            if (result && !result.error) {
                // Réduire le score selon les problèmes détectés
                if (result.errorRate && parseFloat(result.errorRate) > 5) {
                    score -= parseFloat(result.errorRate);
                }
                
                if (result.avgResponseTime && parseFloat(result.avgResponseTime) > 3000) {
                    score -= 10;
                }
                
                if (result.successRate && parseFloat(result.successRate) < 95) {
                    score -= (100 - parseFloat(result.successRate)) * 0.5;
                }
            } else {
                score -= 20; // Pénalité pour les tests échoués
            }
        });
        
        return Math.max(0, Math.min(100, score)).toFixed(1);
    }

    analyzePerformance(testResults) {
        const analysis = {
            bottlenecks: [],
            topPerformers: [],
            areasOfConcern: [],
            performanceTrends: {},
            resourceUtilization: {},
            scalabilityAssessment: {}
        };
        
        // Analyser chaque test
        Object.entries(testResults).forEach(([testName, result]) => {
            if (result && !result.error) {
                this.analyzeTestPerformance(testName, result, analysis);
            }
        });
        
        // Identifier les goulots d'étranglement
        if (analysis.bottlenecks.length === 0) {
            analysis.bottlenecks.push('Aucun goulot d\'étranglement majeur détecté');
        }
        
        return analysis;
    }

    analyzeTestPerformance(testName, result, analysis) {
        // Analyser les performances spécifiques par test
        switch (testName) {
            case 'ollama':
                this.analyzeOllamaPerformance(result, analysis);
                break;
            case 'easyocr':
                this.analyzeOCRPerformance(result, analysis);
                break;
            case 'docucortex':
                this.analyzeDocuCortexPerformance(result, analysis);
                break;
            case 'ged':
                this.analyzeGEDPerformance(result, analysis);
                break;
            case 'network':
                this.analyzeNetworkPerformance(result, analysis);
                break;
            case 'degradation':
                this.analyzeDegradationPerformance(result, analysis);
                break;
        }
    }

    analyzeOllamaPerformance(result, analysis) {
        if (result.avgResponseTime && parseFloat(result.avgResponseTime) > 2000) {
            analysis.bottlenecks.push('Ollama: Temps de réponse élevés (>2s)');
        }
        
        if (result.avgTokensPerSecond && parseFloat(result.avgTokensPerSecond) < 20) {
            analysis.areasOfConcern.push('Ollama: Débit de tokens faible');
        }
        
        analysis.topPerformers.push('Ollama: Modèle IA déployé et fonctionnel');
    }

    analyzeOCRPerformance(result, analysis) {
        if (result.avgProcessingTime && parseFloat(result.avgProcessingTime) > 5000) {
            analysis.bottlenecks.push('EasyOCR: Traitement lent (>5s)');
        }
        
        if (result.languageMetrics) {
            Object.entries(result.languageMetrics).forEach(([lang, metrics]) => {
                if (metrics.successRate && parseFloat(metrics.successRate) < 90) {
                    analysis.areasOfConcern.push(`EasyOCR: Faible taux de réussite en ${lang}`);
                }
            });
        }
        
        analysis.topPerformers.push('EasyOCR: Fonctionnalité OCR multi-langues');
    }

    analyzeDocuCortexPerformance(result, analysis) {
        if (result.moduleMetrics) {
            Object.entries(result.moduleMetrics).forEach(([module, metrics]) => {
                if (metrics.avgResponseTime && parseFloat(metrics.avgResponseTime) > 1500) {
                    analysis.bottlenecks.push(`DocuCortex ${module}: Réponse lente`);
                }
            });
        }
        
        if (result.stressMetrics && result.stressMetrics.stressSuccessRate < 90) {
            analysis.areasOfConcern.push('DocuCortex: Dégradation en charge');
        }
        
        analysis.topPerformers.push('DocuCortex: Intégration IA complète');
    }

    analyzeGEDPerformance(result, analysis) {
        if (result.uploadMetrics && parseFloat(result.uploadMetrics.throughputMBps) < 5) {
            analysis.bottlenecks.push('GED: Vitesse d\'upload faible (<5 MB/s)');
        }
        
        if (result.searchMetrics && parseFloat(result.searchMetrics.avgSearchTime) > 1000) {
            analysis.areasOfConcern.push('GED: Recherche lente');
        }
        
        analysis.topPerformers.push('GED: Gestion volumétrique de documents');
    }

    analyzeNetworkPerformance(result, analysis) {
        if (result.globalMetrics) {
            if (result.globalMetrics.networkScore < 70) {
                analysis.bottlenecks.push('Réseau: Score de connectivité faible');
            }
            
            if (result.globalMetrics.latencyScore < 80) {
                analysis.areasOfConcern.push('Réseau: Latence élevée');
            }
        }
        
        analysis.topPerformers.push('Réseau: Monitoring complet');
    }

    analyzeDegradationPerformance(result, analysis) {
        if (result.resilienceScore && parseFloat(result.resilienceScore) < 70) {
            analysis.areasOfConcern.push('Système: Score de résilience faible');
        }
        
        if (result.degradationAnalysis && result.degradationAnalysis.totalEvents > 5) {
            analysis.bottlenecks.push('Système: Nombreux événements de dégradation');
        }
        
        analysis.topPerformers.push('Système: Tests de résilience complets');
    }

    generateRecommendations(testResults) {
        const recommendations = [];
        
        // Recommandations générales
        recommendations.push({
            category: 'general',
            priority: 'high',
            title: 'Monitoring Continu',
            description: 'Implémenter un monitoring en temps réel des métriques IA avec des alertes automatiques',
            actionItems: [
                'Configurer le dashboard de monitoring',
                'Définir les seuils d\'alerte personnalisés',
                'Mettre en place la collecte continue de métriques'
            ]
        });
        
        // Recommandations spécifiques par test
        Object.entries(testResults).forEach(([testName, result]) => {
            if (result && !result.error) {
                this.generateTestRecommendations(testName, result, recommendations);
            }
        });
        
        return recommendations;
    }

    generateTestRecommendations(testName, result, recommendations) {
        switch (testName) {
            case 'ollama':
                if (result.avgResponseTime && parseFloat(result.avgResponseTime) > 1500) {
                    recommendations.push({
                        category: 'performance',
                        priority: 'medium',
                        title: 'Optimisation Ollama',
                        description: 'Améliorer les performances du modèle IA',
                        actionItems: [
                            'Optimiser la configuration Ollama',
                            'Ajuster les paramètres de génération',
                            'Considérer la mise à niveau du modèle'
                        ]
                    });
                }
                break;
                
            case 'easyocr':
                if (result.overallSuccessRate && parseFloat(result.overallSuccessRate) < 95) {
                    recommendations.push({
                        category: 'quality',
                        priority: 'high',
                        title: 'Amélioration OCR',
                        description: 'Améliorer la précision du traitement OCR',
                        actionItems: [
                            'Ajuster les paramètres EasyOCR',
                            'Optimiser la qualité des images d\'entrée',
                            'Implémenter un pré-traitement d\'images'
                        ]
                    });
                }
                break;
                
            case 'network':
                if (result.globalMetrics && result.globalMetrics.networkScore < 80) {
                    recommendations.push({
                        category: 'infrastructure',
                        priority: 'medium',
                        title: 'Optimisation Réseau',
                        description: 'Améliorer la connectivité réseau',
                        actionItems: [
                            'Vérifier la configuration réseau',
                            'Optimiser la latence des services',
                            'Implémenter la mise en cache'
                        ]
                    });
                }
                break;
        }
    }

    async generateAlertsReport() {
        const healthReport = this.alertThresholds.generateHealthReport();
        return healthReport;
    }

    async generateMarkdownReport(consolidatedReport) {
        const markdownContent = this.generateMarkdownContent(consolidatedReport);
        const markdownPath = `./results/ai-metrics-report-${new Date().toISOString().split('T')[0]}.md`;
        fs.writeFileSync(markdownPath, markdownContent);
        
        console.log(`📄 Rapport markdown: ${markdownPath}`);
    }

    generateMarkdownContent(report) {
        return `# Rapport de Métriques IA - ${new Date().toLocaleDateString()}

## Résumé Exécutif

- **Statut Global**: ${report.summary.overallStatus}
- **Tests Exécutés**: ${report.summary.totalTests}/${report.summary.successfulTests} réussis
- **Score de Performance**: ${report.summary.performanceScore}/100
- **Durée**: ${this.formatDuration(report.metadata.duration)}

## Métriques de Performance

### Temps de Réponse Moyen
${report.summary.avgResponseTime} ms

### Taux de Succès Global
${report.summary.overallSuccessRate}%

### Requêtes Totales
${report.summary.totalRequests}

## Résultats par Service

${Object.entries(report.results).map(([service, result]) => `
### ${service.charAt(0).toUpperCase() + service.slice(1)}
${result.error ? `❌ **ÉCHEC**: ${result.error}` : `
✅ **SUCCÈS**
- Temps de réponse: ${result.avgResponseTime || 'N/A'} ms
- Taux de succès: ${result.successRate || 'N/A'}%
${result.totalRequests ? `- Requêtes: ${result.totalRequests}` : ''}
`}
`).join('\n')}

## Analyse des Performances

### Goulots d'Étranglement
${report.performanceAnalysis.bottlenecks.map(b => `- ${b}`).join('\n') || '- Aucun détecté'}

### Performances Excellentes
${report.performanceAnalysis.topPerformers.map(t => `- ${t}`).join('\n') || '- Aucune identifiée'}

### Préoccupations
${report.performanceAnalysis.areasOfConcern.map(a => `- ${a}`).join('\n') || '- Aucune'}

## Recommandations

${report.recommendations.map(rec => `
### ${rec.title} (${rec.priority})
${rec.description}

**Actions à entreprendre:**
${rec.actionItems.map(item => `- ${item}`).join('\n')}
`).join('\n')}

## Configuration des Tests

\`\`\`json
${JSON.stringify(report.configuration, null, 2)}
\`\`\`

---
*Rapport généré automatiquement par le système de métriques IA DocuCortex*
`;
    }

    async processAlerts(testResults) {
        console.log('\n🚨 Traitement des alertes...');
        
        // Vérifier les seuils pour chaque test
        Object.entries(testResults).forEach(([testName, result]) => {
            if (result && !result.error) {
                this.processTestAlerts(testName, result);
            }
        });
        
        // Générer un rapport d'alertes
        const alertReport = await this.generateAlertsReport();
        console.log(`✅ ${alertReport.overall.totalActiveAlerts} alertes actives générées`);
    }

    processTestAlerts(testName, result) {
        // Traitement des alertes spécifiques par test
        switch (testName) {
            case 'ollama':
                if (result.avgResponseTime) {
                    this.alertThresholds.checkThreshold('responseTime', parseFloat(result.avgResponseTime), 'ollama');
                }
                if (result.successRate) {
                    this.alertThresholds.checkThreshold('successRate', parseFloat(result.successRate), 'ollama');
                }
                break;
                
            case 'easyocr':
                if (result.avgProcessingTime) {
                    this.alertThresholds.checkThreshold('ocrProcessingTime', parseFloat(result.avgProcessingTime), 'easyocr');
                }
                if (result.overallSuccessRate) {
                    this.alertThresholds.checkThreshold('successRate', parseFloat(result.overallSuccessRate), 'easyocr');
                }
                break;
                
            case 'network':
                if (result.globalMetrics?.networkScore) {
                    this.alertThresholds.checkThreshold('networkLatency', 1000 - parseFloat(result.globalMetrics.networkScore), 'network');
                }
                break;
        }
    }

    configureTests(options) {
        // Fusionner avec les options de ligne de commande
        if (options.tests) {
            Object.keys(this.testConfigs).forEach(testKey => {
                this.testConfigs[testKey].enabled = options.tests.includes(testKey) || options.tests.includes('all');
            });
        }
        
        // Appliquer les configurations personnalisées
        if (options.config) {
            Object.assign(this.testConfigs, options.config);
        }
    }

    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    // Méthodes utilitaires pour l'utilisation en ligne de commande
    showHelp() {
        console.log(`
🚀 Orchestrateur de Tests de Métriques IA

Utilisation:
  node ai-metrics-orchestrator.js [options]

Options:
  --help, -h              Afficher cette aide
  --parallel, -p          Exécuter les tests en parallèle
  --tests <liste>         Spécifier les tests à exécuter (ollama,easyocr,docucortex,ged,network,degradation,all)
  --config <fichier>      Charger une configuration personnalisée
  --quiet, -q             Mode silencieux (moins de logs)
  --output <dossier>      Dossier de sortie pour les résultats

Exemples:
  node ai-metrics-orchestrator.js --tests ollama,easyocr --parallel
  node ai-metrics-orchestrator.js --tests all --config my-config.json
  node ai-metrics-orchestrator.js --help

Tests disponibles:
  - ollama: Test de performance Ollama IA (llama3.2:3b)
  - easyocr: Test de performance EasyOCR multi-langues
  - docucortex: Test de performance DocuCortex IA (chat, recherche, traitement)
  - ged: Test de performance de traitement GED volumineux
  - network: Test de latence réseau pour les services IA
  - degradation: Test de dégradation gracieuse sous charge
`);
    }
}

// Interface ligne de commande
if (require.main === module) {
    const orchestrator = new AIPerformanceOrchestrator();
    const args = process.argv.slice(2);
    
    const options = {
        parallel: args.includes('--parallel') || args.includes('-p'),
        quiet: args.includes('--quiet') || args.includes('-q'),
        tests: null,
        config: null,
        output: './results'
    };
    
    // Parser les arguments
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        switch (arg) {
            case '--help':
            case '-h':
                orchestrator.showHelp();
                process.exit(0);
                break;
                
            case '--tests':
                const testsList = args[i + 1];
                if (testsList) {
                    options.tests = testsList.split(',');
                    i++;
                }
                break;
                
            case '--config':
                const configFile = args[i + 1];
                if (configFile && fs.existsSync(configFile)) {
                    options.config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
                    i++;
                }
                break;
                
            case '--output':
                const outputDir = args[i + 1];
                if (outputDir) {
                    options.output = outputDir;
                    i++;
                }
                break;
        }
    }
    
    // Exécuter les tests
    orchestrator.runAllTests(options)
        .then(() => {
            console.log('\n✨ Exécution terminée avec succès');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Échec de l\'exécution:', error.message);
            process.exit(1);
        });
}

module.exports = AIPerformanceOrchestrator;