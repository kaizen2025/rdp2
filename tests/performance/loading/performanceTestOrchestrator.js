#!/usr/bin/env node

/**
 * Orchestrateur Principal des Tests de Performance - RDS Viewer Anecoop
 * Script principal pour lancer tous les types de tests de performance
 * 
 * Date: 2025-11-04
 */

const path = require('path');
const fs = require('fs').promises;

// Import des modules de test
const LoadingPerformanceTest = require('./loadingPerformanceTest');
const ReactComponentPerformanceTest = require('./reactComponentPerformanceTest');
const ContinuousPerformanceMonitor = require('./continuousPerformanceMonitor');
const PerformanceReportGenerator = require('./performanceReportGenerator');
const { PerformanceEvaluator } = require('./performanceBenchmarks');

class PerformanceTestOrchestrator {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            testSuite: 'RDS Viewer Anecoop - Tests de Performance',
            version: '1.0.0',
            pageTests: null,
            componentTests: null,
            monitoringData: null,
            reports: [],
            summary: null,
            errors: []
        };
        
        this.config = {
            baseUrl: 'http://localhost:3000',
            testTimeout: 30000,
            retries: 2,
            outputDir: path.join(__dirname, 'results'),
            keepReports: 10 // Nombre de rapports à conserver
        };
    }

    /**
     * Lance tous les tests de performance
     */
    async runAllTests(options = {}) {
        console.log('🚀 === ORCHESTRATEUR DE TESTS DE PERFORMANCE ===');
        console.log('Application: RDS Viewer Anecoop');
        console.log(`Démarrage: ${new Date().toLocaleString('fr-FR')}`);
        console.log(`URL de base: ${this.config.baseUrl}`);
        console.log('=' .repeat(60));
        
        const startTime = Date.now();
        
        try {
            // Créer le répertoire de sortie
            await this.initializeOutputDirectory();
            
            // Exécuter les tests de page
            if (options.skipPages !== true) {
                await this.runPagePerformanceTests();
            }
            
            // Exécuter les tests de composants React
            if (options.skipComponents !== true) {
                await this.runComponentPerformanceTests();
            }
            
            // Lancer la surveillance continue (optionnel)
            if (options.monitoring && options.monitoring.enabled) {
                await this.startContinuousMonitoring(options.monitoring);
            }
            
            // Générer les rapports
            await this.generateAllReports();
            
            // Calculer le résumé final
            await this.calculateFinalSummary();
            
            const endTime = Date.now();
            const totalDuration = endTime - startTime;
            
            this.results.executionTime = totalDuration;
            this.results.status = 'completed';
            
            console.log('\n' + '=' .repeat(60));
            console.log('✅ TOUS LES TESTS TERMINÉS AVEC SUCCÈS');
            console.log(`⏱️ Durée totale: ${(totalDuration / 1000).toFixed(2)} secondes`);
            console.log(`📊 Rapports générés: ${this.results.reports.length}`);
            console.log('=' .repeat(60));
            
            return this.results;
            
        } catch (error) {
            console.error('❌ ERREUR LORS DE L\'EXÉCUTION DES TESTS:', error);
            this.results.status = 'failed';
            this.results.errors.push(error.message);
            
            throw error;
        }
    }

    /**
     * Initialise le répertoire de sortie
     */
    async initializeOutputDirectory() {
        try {
            await fs.mkdir(this.config.outputDir, { recursive: true });
            await fs.mkdir(path.join(this.config.outputDir, 'reports'), { recursive: true });
            await fs.mkdir(path.join(this.config.outputDir, 'charts'), { recursive: true });
            console.log(`📁 Répertoire de sortie: ${this.config.outputDir}`);
        } catch (error) {
            throw new Error(`Impossible de créer le répertoire de sortie: ${error.message}`);
        }
    }

    /**
     * Lance les tests de performance des pages
     */
    async runPagePerformanceTests() {
        console.log('\n📄 === TESTS DE PERFORMANCE DES PAGES ===');
        
        try {
            const pageTester = new LoadingPerformanceTest();
            const pageResults = await pageTester.runAllTests();
            
            // Sauvegarder les résultats
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const pageReportPath = path.join(this.config.outputDir, `page-performance-${timestamp}.json`);
            await fs.writeFile(pageReportPath, JSON.stringify(pageResults, null, 2));
            
            this.results.pageTests = pageResults;
            this.results.reports.push({
                type: 'pagePerformance',
                path: pageReportPath,
                timestamp: new Date().toISOString()
            });
            
            console.log('✅ Tests de pages terminés');
            
        } catch (error) {
            console.error('❌ Erreur lors des tests de pages:', error);
            this.results.errors.push(`Tests de pages: ${error.message}`);
        }
    }

    /**
     * Lance les tests de performance des composants React
     */
    async runComponentPerformanceTests() {
        console.log('\n🧪 === TESTS DE PERFORMANCE DES COMPOSANTS REACT ===');
        
        try {
            const componentTester = new ReactComponentPerformanceTest();
            const componentResults = await componentTester.runAllComponentTests();
            
            // Sauvegarder les résultats
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const componentReportPath = path.join(this.config.outputDir, `component-performance-${timestamp}.json`);
            await fs.writeFile(componentReportPath, JSON.stringify(componentResults, null, 2));
            
            this.results.componentTests = componentResults;
            this.results.reports.push({
                type: 'componentPerformance',
                path: componentReportPath,
                timestamp: new Date().toISOString()
            });
            
            console.log('✅ Tests de composants terminés');
            
        } catch (error) {
            console.error('❌ Erreur lors des tests de composants:', error);
            this.results.errors.push(`Tests de composants: ${error.message}`);
        }
    }

    /**
     * Lance la surveillance continue (mode limité)
     */
    async startContinuousMonitoring(monitoringConfig = {}) {
        console.log('\n🔍 === SURVEILLANCE CONTINUE (MODE TEST) ===');
        
        try {
            const monitor = new ContinuousPerformanceMonitor({
                ...monitoringConfig,
                baseUrl: this.config.baseUrl,
                checkInterval: monitoringConfig.checkInterval || '*/2 * * * *', // Toutes les 2 minutes
                outputDir: path.join(this.config.outputDir, 'monitoring')
            });
            
            // Effectuer quelques vérifications rapides
            await monitor.performHealthCheck();
            await monitor.performHealthCheck();
            
            const monitoringPath = await monitor.generateMonitoringReport();
            
            this.results.monitoringData = monitor.monitoringData;
            this.results.reports.push({
                type: 'monitoring',
                path: monitoringPath,
                timestamp: new Date().toISOString()
            });
            
            console.log('✅ Surveillance limitée terminée');
            
        } catch (error) {
            console.error('❌ Erreur lors de la surveillance:', error);
            this.results.errors.push(`Surveillance: ${error.message}`);
        }
    }

    /**
     * Génère tous les rapports
     */
    async generateAllReports() {
        console.log('\n📊 === GÉNÉRATION DES RAPPORTS ===');
        
        try {
            const reportGenerator = new PerformanceReportGenerator();
            
            // Rapport consolidé avec toutes les données
            const consolidatedData = {
                summary: this.consolidateTestSummaries(),
                pages: this.results.pageTests?.pages || {},
                components: this.results.componentTests?.componentTests || {},
                monitoring: this.results.monitoringData || {},
                recommendations: this.consolidateRecommendations()
            };
            
            const reportPaths = await reportGenerator.generateFullReport(consolidatedData);
            
            // Ajouter les chemins aux résultats
            if (Array.isArray(reportPaths)) {
                reportPaths.forEach(reportPath => {
                    this.results.reports.push({
                        type: 'generated',
                        path: reportPath,
                        timestamp: new Date().toISOString()
                    });
                });
            } else {
                this.results.reports.push({
                    type: 'generated',
                    path: reportPaths,
                    timestamp: new Date().toISOString()
                });
            }
            
            console.log('✅ Rapports générés avec succès');
            
        } catch (error) {
            console.error('❌ Erreur lors de la génération des rapports:', error);
            this.results.errors.push(`Génération de rapports: ${error.message}`);
        }
    }

    /**
     * Consolide les résumés des tests
     */
    consolidateTestSummaries() {
        const summary = {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            averagePerformance: 0,
            criticalIssues: 0,
            recommendationsCount: 0
        };

        // Données des tests de pages
        if (this.results.pageTests?.summary) {
            summary.totalTests += this.results.pageTests.summary.totalPages || 0;
            summary.averagePerformance += (this.results.pageTests.summary.averageLoadTime || 0);
            summary.criticalIssues += this.results.pageTests.summary.recommendations?.length || 0;
        }

        // Données des tests de composants
        if (this.results.componentTests?.summary) {
            summary.totalTests += this.results.componentTests.summary.totalComponents || 0;
            summary.averagePerformance += (this.results.componentTests.summary.averageScore || 0);
            summary.criticalIssues += this.results.componentTests.summary.recommendations?.length || 0;
        }

        // Calculer la performance moyenne
        const testTypes = (this.results.pageTests?.summary ? 1 : 0) + 
                         (this.results.componentTests?.summary ? 1 : 0);
        summary.averagePerformance = testTypes > 0 ? summary.averagePerformance / testTypes : 0;

        return summary;
    }

    /**
     * Consolide toutes les recommandations
     */
    consolidateRecommendations() {
        const allRecommendations = [];

        // Recommandations des tests de pages
        if (this.results.pageTests?.summary?.recommendations) {
            allRecommendations.push(...this.results.pageTests.summary.recommendations.map(rec => ({
                ...rec,
                source: 'pageTests'
            })));
        }

        // Recommandations des tests de composants
        if (this.results.componentTests?.summary?.recommendations) {
            allRecommendations.push(...this.results.componentTests.summary.recommendations.map(rec => ({
                ...rec,
                source: 'componentTests'
            })));
        }

        return allRecommendations;
    }

    /**
     * Calcule le résumé final
     */
    async calculateFinalSummary() {
        console.log('\n📈 === CALCUL DU RÉSUMÉ FINAL ===');
        
        this.results.summary = {
            totalExecutionTime: this.results.executionTime,
            testResults: {
                pageTests: {
                    status: this.results.pageTests ? 'completed' : 'skipped',
                    pagesTested: this.results.pageTests?.summary?.totalPages || 0,
                    averageLoadTime: this.results.pageTests?.summary?.averageLoadTime || 0,
                    performanceGrade: this.calculateOverallPageGrade()
                },
                componentTests: {
                    status: this.results.componentTests ? 'completed' : 'skipped',
                    componentsTested: this.results.componentTests?.summary?.totalComponents || 0,
                    averageScore: this.results.componentTests?.summary?.averageScore || 0,
                    performanceGrade: this.calculateOverallComponentGrade()
                }
            },
            overallHealth: this.calculateOverallHealth(),
            topIssues: this.identifyTopIssues(),
            nextSteps: this.generateNextSteps()
        };

        // Sauvegarder le résumé final
        const summaryPath = path.join(this.config.outputDir, 'final-summary.json');
        await fs.writeFile(summaryPath, JSON.stringify(this.results.summary, null, 2));
        
        console.log('✅ Résumé final calculé');
        
        // Afficher le résumé
        this.displayFinalSummary();
    }

    /**
     * Calcule la note globale des pages
     */
    calculateOverallPageGrade() {
        if (!this.results.pageTests?.summary?.performanceDistribution) return 'N/A';
        
        const dist = this.results.pageTests.summary.performanceDistribution;
        const total = Object.values(dist).reduce((sum, count) => sum + count, 0);
        
        if (total === 0) return 'N/A';
        
        const gradeA = (dist.A || 0) / total;
        const gradeB = (dist.B || 0) / total;
        
        if (gradeA >= 0.7) return 'A';
        if (gradeA + gradeB >= 0.8) return 'B';
        if (gradeA + gradeB >= 0.6) return 'C';
        return 'D';
    }

    /**
     * Calcule la note globale des composants
     */
    calculateOverallComponentGrade() {
        if (!this.results.componentTests?.summary?.performanceDistribution) return 'N/A';
        
        const dist = this.results.componentTests.summary.performanceDistribution;
        const total = Object.values(dist).reduce((sum, count) => sum + count, 0);
        
        if (total === 0) return 'N/A';
        
        const excellent = (dist['A+'] || 0) + (dist.A || 0);
        const good = (dist.B || 0);
        
        if (excellent / total >= 0.6) return 'A';
        if ((excellent + good) / total >= 0.8) return 'B';
        if ((excellent + good) / total >= 0.6) return 'C';
        return 'D';
    }

    /**
     * Calcule la santé globale de l'application
     */
    calculateOverallHealth() {
        let healthScore = 0;
        let maxScore = 0;
        
        // Score basé sur les tests de pages (50%)
        if (this.results.pageTests?.summary) {
            const avgLoadTime = this.results.pageTests.summary.averageLoadTime;
            const pageScore = avgLoadTime < 2000 ? 50 : 
                             avgLoadTime < 4000 ? 30 : 10;
            healthScore += pageScore;
            maxScore += 50;
        }
        
        // Score basé sur les tests de composants (50%)
        if (this.results.componentTests?.summary) {
            const avgScore = this.results.componentTests.summary.averageScore;
            const componentScore = avgScore >= 80 ? 50 :
                                  avgScore >= 60 ? 30 : 10;
            healthScore += componentScore;
            maxScore += 50;
        }
        
        const percentage = maxScore > 0 ? (healthScore / maxScore) * 100 : 0;
        
        if (percentage >= 80) return 'excellent';
        if (percentage >= 60) return 'good';
        if (percentage >= 40) return 'fair';
        return 'poor';
    }

    /**
     * Identifie les problèmes principaux
     */
    identifyTopIssues() {
        const issues = [];
        
        // Problèmes de performance des pages
        if (this.results.pageTests?.summary?.slowestPages) {
            this.results.pageTests.summary.slowestPages.forEach(page => {
                issues.push({
                    type: 'performance',
                    severity: page.time > 5000 ? 'high' : 'medium',
                    description: `Page ${page.name} lente: ${page.time.toFixed(0)}ms`,
                    recommendation: 'Optimiser le chargement des ressources'
                });
            });
        }
        
        // Problèmes de composants
        if (this.results.componentTests?.summary?.slowComponents) {
            this.results.componentTests.summary.slowComponents.forEach(comp => {
                issues.push({
                    type: 'component',
                    severity: comp.score < 40 ? 'high' : 'medium',
                    description: `Composant ${comp.name} peu performant: ${comp.score}%`,
                    recommendation: 'Optimiser le rendu React'
                });
            });
        }
        
        return issues.slice(0, 5); // Top 5 des problèmes
    }

    /**
     * Génère les prochaines étapes
     */
    generateNextSteps() {
        const steps = [];
        
        const overallHealth = this.calculateOverallHealth();
        
        if (overallHealth === 'poor') {
            steps.push('🔴 CRITIQUE: Optimiser en priorité les performances des pages critiques');
            steps.push('🔴 CRITIQUE: Réduire les temps de chargement > 5 secondes');
        } else if (overallHealth === 'fair') {
            steps.push('🟡 IMPORTANT: Améliorer les performances des composants lents');
            steps.push('🟡 IMPORTANT: Optimiser les re-rendus React inutiles');
        } else {
            steps.push('🟢 MAINTENANCE: Surveiller les performances en continu');
            steps.push('🟢 OPTIMISATION: Implémenter les améliorations suggérées');
        }
        
        steps.push('📊 RAPPORTS: Consulter les rapports détaillés pour les recommandations spécifiques');
        
        return steps;
    }

    /**
     * Affiche le résumé final
     */
    displayFinalSummary() {
        if (!this.results.summary) return;
        
        console.log('\n' + '=' .repeat(60));
        console.log('📊 RÉSUMÉ FINAL DES TESTS DE PERFORMANCE');
        console.log('=' .repeat(60));
        
        console.log(`\n🏥 Santé globale: ${this.results.summary.overallHealth.toUpperCase()}`);
        
        console.log('\n📄 Tests de pages:');
        const pageTests = this.results.summary.testResults.pageTests;
        console.log(`  Status: ${pageTests.status}`);
        console.log(`  Pages testées: ${pageTests.pagesTested}`);
        console.log(`  Temps moyen: ${pageTests.averageLoadTime.toFixed(0)}ms`);
        console.log(`  Note: ${pageTests.performanceGrade}`);
        
        console.log('\n🧪 Tests de composants:');
        const compTests = this.results.summary.testResults.componentTests;
        console.log(`  Status: ${compTests.status}`);
        console.log(`  Composants testés: ${compTests.componentsTested}`);
        console.log(`  Score moyen: ${compTests.averageScore.toFixed(0)}%`);
        console.log(`  Note: ${compTests.performanceGrade}`);
        
        if (this.results.summary.topIssues.length > 0) {
            console.log('\n🚨 Principaux problèmes:');
            this.results.summary.topIssues.forEach((issue, index) => {
                console.log(`  ${index + 1}. ${issue.description}`);
            });
        }
        
        console.log('\n💡 Prochaines étapes:');
        this.results.summary.nextSteps.forEach(step => {
            console.log(`  ${step}`);
        });
        
        console.log('\n📁 Fichiers générés:');
        this.results.reports.forEach(report => {
            console.log(`  ${report.type}: ${path.basename(report.path)}`);
        });
    }

    /**
     * Nettoie les anciens rapports
     */
    async cleanupOldReports() {
        try {
            const files = await fs.readdir(this.config.outputDir);
            const reportFiles = files.filter(file => file.includes('-performance-') || file.includes('report-'));
            
            if (reportFiles.length > this.config.keepReports) {
                const sortedFiles = reportFiles
                    .map(file => ({
                        name: file,
                        path: path.join(this.config.outputDir, file),
                        time: fs.stat(path.join(this.config.outputDir, file)).then(s => s.mtime)
                    });
                
                // Trier par date de modification
                const filesWithTime = await Promise.all(sortedFiles);
                filesWithTime.sort((a, b) => b.time - a.time);
                
                // Supprimer les plus anciens
                const filesToDelete = filesWithTime.slice(this.config.keepReports);
                for (const file of filesToDelete) {
                    await fs.unlink(file.path);
                    console.log(`🗑️ Ancien rapport supprimé: ${file.name}`);
                }
            }
        } catch (error) {
            console.warn(`⚠️ Erreur lors du nettoyage: ${error.message}`);
        }
    }
}

// Fonction utilitaire pour vérifier si l'application est disponible
async function checkApplicationAvailability(baseUrl) {
    try {
        const response = await fetch(baseUrl);
        return response.ok;
    } catch (error) {
        return false;
    }
}

// Point d'entrée principal
async function main() {
    const args = process.argv.slice(2);
    const options = {
        skipPages: args.includes('--skip-pages'),
        skipComponents: args.includes('--skip-components'),
        monitoring: {
            enabled: args.includes('--monitoring'),
            checkInterval: '*/2 * * * *'
        },
        baseUrl: args.find(arg => arg.startsWith('--url='))?.split('=')[1] || 'http://localhost:3000'
    };

    console.log('🔍 Vérification de la disponibilité de l\'application...');
    
    const isAvailable = await checkApplicationAvailability(options.baseUrl);
    if (!isAvailable) {
        console.error(`❌ L'application n'est pas accessible à l'URL: ${options.baseUrl}`);
        console.error('💡 Assurez-vous que l\'application RDS Viewer est démarrée');
        process.exit(1);
    }
    
    console.log('✅ Application accessible\n');

    const orchestrator = new PerformanceTestOrchestrator();
    orchestrator.config.baseUrl = options.baseUrl;
    
    try {
        const results = await orchestrator.runAllTests(options);
        
        // Nettoyer les anciens rapports
        await orchestrator.cleanupOldReports();
        
        // Code de sortie basé sur les résultats
        const hasErrors = results.errors && results.errors.length > 0;
        const hasCriticalIssues = results.summary?.overallHealth === 'poor';
        
        if (hasErrors || hasCriticalIssues) {
            console.log('\n⚠️ Des problèmes ont été détectés');
            process.exit(1);
        } else {
            console.log('\n✅ Tous les tests ont réussi');
            process.exit(0);
        }
        
    } catch (error) {
        console.error('\n💥 Échec des tests:', error.message);
        process.exit(1);
    }
}

// Export pour utilisation dans d'autres modules
module.exports = PerformanceTestOrchestrator;

// Exécution directe
if (require.main === module) {
    main().catch(error => {
        console.error('💥 Erreur fatale:', error);
        process.exit(1);
    });
}