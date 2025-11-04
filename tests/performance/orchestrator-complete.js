#!/usr/bin/env node

/**
 * 🎯 ORCHESTRATEUR COMPLET DES TESTS DE PERFORMANCE - RDS VIEWER ANECOOP
 * ===========================================================================
 * 
 * Ce script orchestre l'exécution de tous les tests de performance créés :
 * - Tests de temps de chargement des pages
 * - Tests de réactivité UI sous charge
 * - Benchmarks backend (API, DB, WebSocket)
 * - Tests de gestion mémoire et fuites
 * - Tests de stabilité sous charge concurrente
 * - Métriques IA/OCR sous charge
 * 
 * Usage: node orchestrator-complete.js [options]
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

// Configuration globale
const CONFIG = {
    baseDir: '/workspace/rdp/tests/performance',
    modulesDir: '/workspace/rdp',
    outputDir: '/workspace/rdp/tests/performance/reports',
    timeout: 30 * 60 * 1000, // 30 minutes par module
    parallel: true,
    verbose: false
};

// Couleurs pour l'affichage
const COLORS = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// Métriques globales
const globalMetrics = {
    startTime: Date.now(),
    tests: [],
    summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        totalTime: 0
    }
};

/**
 * Classe principale d'orchestration
 */
class PerformanceTestOrchestrator {
    constructor() {
        this.results = new Map();
        this.errors = [];
        this.warnings = [];
    }

    /**
     * Affiche le header de l'orchestrateur
     */
    printHeader() {
        console.log(`\n${COLORS.bright}${COLORS.cyan}╔════════════════════════════════════════════════════════════════════════════════════════════╗`);
        console.log(`║                    🎯 ORCHESTRATEUR COMPLET DE TESTS DE PERFORMANCE                      ║`);
        console.log(`║                            RDS VIEWER ANECOOP - VERSION 3.0.27                             ║`);
        console.log(`╚════════════════════════════════════════════════════════════════════════════════════════════╝${COLORS.reset}`);
        console.log(`${COLORS.cyan}🚀 Démarrage des tests de performance complets...${COLORS.reset}\n`);
        
        this.printSystemInfo();
    }

    /**
     * Affiche les informations système
     */
    printSystemInfo() {
        console.log(`${COLORS.blue}📊 Informations Système:${COLORS.reset}`);
        console.log(`   • Répertoire de base: ${CONFIG.baseDir}`);
        console.log(`   • Module RDS: ${CONFIG.modulesDir}`);
        console.log(`   • Rapport de sortie: ${CONFIG.outputDir}`);
        console.log(`   • Mode: ${CONFIG.parallel ? 'Parallèle' : 'Séquentiel'}`);
        console.log(`   • Timeout par test: ${CONFIG.timeout / 1000}s\n`);
    }

    /**
     * Exécute tous les modules de tests
     */
    async runAllTests() {
        const modules = [
            {
                name: 'Tests de Temps de Chargement',
                path: 'loading',
                script: 'index.js',
                priority: 1
            },
            {
                name: 'Tests de Réactivité UI',
                path: 'ui-reactivity', 
                script: 'index.js',
                priority: 2
            },
            {
                name: 'Benchmarks Backend',
                path: 'backend',
                script: 'index.js',
                priority: 3
            },
            {
                name: 'Tests de Gestion Mémoire',
                path: 'memory',
                script: 'runMemoryTests.js',
                priority: 4
            },
            {
                name: 'Tests de Stabilité et Charge',
                path: 'load-testing',
                script: 'index.js',
                priority: 5
            },
            {
                name: 'Métriques IA/OCR',
                path: 'ai-metrics',
                script: 'index.js',
                priority: 6
            }
        ];

        console.log(`${COLORS.yellow}⏳ Exécution des modules de test...${COLORS.reset}\n`);

        if (CONFIG.parallel) {
            await this.runModulesInParallel(modules);
        } else {
            await this.runModulesSequentially(modules);
        }

        await this.generateFinalReport();
        await this.printSummary();
    }

    /**
     * Exécute les modules en parallèle
     */
    async runModulesInParallel(modules) {
        console.log(`${COLORS.cyan}🚀 Lancement parallèle de ${modules.length} modules...${COLORS.reset}\n`);
        
        const promises = modules.map(module => this.runModule(module));
        const results = await Promise.allSettled(promises);
        
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                console.log(`${COLORS.green}✅ ${modules[index].name}: TERMINÉ${COLORS.reset}`);
            } else {
                console.log(`${COLORS.red}❌ ${modules[index].name}: ERREUR - ${result.reason}${COLORS.reset}`);
                this.errors.push(`${modules[index].name}: ${result.reason}`);
            }
        });
    }

    /**
     * Exécute les modules séquentiellement
     */
    async runModulesSequentially(modules) {
        console.log(`${COLORS.cyan}🔄 Lancement séquentiel de ${modules.length} modules...${COLORS.reset}\n`);
        
        for (const module of modules) {
            try {
                await this.runModule(module);
                console.log(`${COLORS.green}✅ ${module.name}: TERMINÉ${COLORS.reset}\n`);
            } catch (error) {
                console.log(`${COLORS.red}❌ ${module.name}: ERREUR - ${error.message}${COLORS.reset}\n`);
                this.errors.push(`${module.name}: ${error.message}`);
            }
        }
    }

    /**
     * Exécute un module spécifique
     */
    async runModule(module) {
        const modulePath = path.join(CONFIG.baseDir, module.path);
        const scriptPath = path.join(modulePath, module.script);
        
        console.log(`${COLORS.magenta}🔄 Exécution de: ${module.name}${COLORS.reset}`);
        console.log(`   📂 Répertoire: ${modulePath}`);
        console.log(`   📄 Script: ${scriptPath}`);

        // Vérification de l'existence du script
        if (!fs.existsSync(scriptPath)) {
            throw new Error(`Script non trouvé: ${scriptPath}`);
        }

        // Exécution du module
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const child = spawn('node', [scriptPath, '--orchestrator'], {
                cwd: modulePath,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let output = '';
            let errorOutput = '';

            child.stdout.on('data', (data) => {
                output += data.toString();
                if (CONFIG.verbose) {
                    console.log(`   ${data.toString().trim()}`);
                }
            });

            child.stderr.on('data', (data) => {
                errorOutput += data.toString();
                if (CONFIG.verbose) {
                    console.log(`   ${COLORS.yellow}${data.toString().trim()}${COLORS.reset}`);
                }
            });

            const timeout = setTimeout(() => {
                child.kill();
                reject(new Error(`Timeout après ${CONFIG.timeout / 1000}s`));
            }, CONFIG.timeout);

            child.on('close', (code) => {
                clearTimeout(timeout);
                const duration = Date.now() - startTime;
                
                if (code === 0) {
                    this.results.set(module.name, {
                        status: 'success',
                        duration,
                        output: output,
                        error: null
                    });
                    resolve({ duration, output });
                } else {
                    this.errors.push(`${module.name}: Code ${code} - ${errorOutput}`);
                    this.results.set(module.name, {
                        status: 'error',
                        duration,
                        output,
                        error: errorOutput
                    });
                    reject(new Error(`Code de sortie: ${code}`));
                }
            });

            child.on('error', (error) => {
                clearTimeout(timeout);
                this.errors.push(`${module.name}: ${error.message}`);
                reject(error);
            });
        });
    }

    /**
     * Génère le rapport final
     */
    async generateFinalReport() {
        console.log(`\n${COLORS.cyan}📊 Génération du rapport final...${COLORS.reset}`);
        
        const reportData = {
            metadata: {
                timestamp: new Date().toISOString(),
                version: '3.0.27',
                environment: 'production',
                orchestrator: 'Performance Test Orchestrator v1.0'
            },
            summary: this.generateSummary(),
            modules: Object.fromEntries(this.results),
            errors: this.errors,
            warnings: this.warnings,
            recommendations: this.generateRecommendations(),
            nextSteps: this.generateNextSteps()
        };

        // Sauvegarde en JSON
        const reportJson = path.join(CONFIG.outputDir, `performance-test-report-${Date.now()}.json`);
        fs.writeFileSync(reportJson, JSON.stringify(reportData, null, 2));

        // Génération du rapport HTML
        await this.generateHtmlReport(reportData, reportJson.replace('.json', '.html'));
        
        console.log(`${COLORS.green}✅ Rapport généré:${COLORS.reset}`);
        console.log(`   📄 JSON: ${reportJson}`);
        console.log(`   🌐 HTML: ${reportJson.replace('.json', '.html')}`);
    }

    /**
     * Génère le résumé des tests
     */
    generateSummary() {
        const totalDuration = Date.now() - globalMetrics.startTime;
        const moduleCount = this.results.size;
        const successCount = Array.from(this.results.values()).filter(r => r.status === 'success').length;
        const errorCount = Array.from(this.results.values()).filter(r => r.status === 'error').length;

        return {
            totalModules: moduleCount,
            successfulModules: successCount,
            failedModules: errorCount,
            totalDuration: totalDuration,
            averageModuleDuration: moduleCount > 0 ? totalDuration / moduleCount : 0,
            status: errorCount === 0 ? 'PASS' : (successCount > 0 ? 'PARTIAL' : 'FAIL'),
            readinessScore: moduleCount > 0 ? Math.round((successCount / moduleCount) * 100) : 0
        };
    }

    /**
     * Génère des recommandations
     */
    generateRecommendations() {
        const recommendations = [];
        
        if (this.errors.length > 0) {
            recommendations.push({
                priority: 'HIGH',
                category: 'Errors',
                message: `${this.errors.length} erreurs détectées nécessitent une attention immédiate`,
                action: 'Corriger les erreurs avant déploiement en production'
            });
        }

        const moduleDurations = Array.from(this.results.values()).map(r => r.duration);
        if (moduleDurations.length > 0) {
            const avgDuration = moduleDurations.reduce((a, b) => a + b, 0) / moduleDurations.length;
            const maxDuration = Math.max(...moduleDurations);
            
            if (maxDuration > 300000) { // 5 minutes
                recommendations.push({
                    priority: 'MEDIUM',
                    category: 'Performance',
                    message: `Durée maximale des tests: ${Math.round(maxDuration / 1000)}s`,
                    action: 'Optimiser les modules les plus lents'
                });
            }
        }

        recommendations.push({
            priority: 'LOW',
            category: 'Monitoring',
            message: 'Mettre en place une surveillance continue des performances',
            action: 'Intégrer les tests dans le pipeline CI/CD'
        });

        return recommendations;
    }

    /**
     * Génère les prochaines étapes
     */
    generateNextSteps() {
        return [
            'Revoir et corriger les erreurs identifiées',
            'Optimiser les performances des modules lents',
            'Exécuter une série complète de tests de régression',
            'Déployer la solution en environnement de staging',
            'Configurer la surveillance continue en production',
            'Former les équipes sur les métriques de performance'
        ];
    }

    /**
     * Génère le rapport HTML
     */
    async generateHtmlReport(data, outputPath) {
        const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport de Tests de Performance - RDS Viewer Anecoop</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; color: #2196F3; margin-bottom: 30px; }
        .status { padding: 15px; border-radius: 5px; margin: 20px 0; font-weight: bold; text-align: center; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .warning { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 5px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #2196F3; }
        .metric-label { color: #666; margin-top: 5px; }
        .module { border: 1px solid #ddd; margin: 10px 0; border-radius: 5px; padding: 15px; }
        .module-header { display: flex; justify-content: between; align-items: center; margin-bottom: 10px; }
        .module-name { font-weight: bold; color: #333; }
        .module-duration { color: #666; }
        .recommendations { background: #e3f2fd; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .next-steps { background: #f1f8e9; padding: 20px; border-radius: 5px; margin: 20px 0; }
        ul { padding-left: 20px; }
        li { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Rapport de Tests de Performance</h1>
            <h2>RDS Viewer Anecoop v3.0.27</h2>
            <p>Généré le: ${new Date(data.metadata.timestamp).toLocaleString('fr-FR')}</p>
        </div>

        <div class="status ${data.summary.status === 'PASS' ? 'success' : data.summary.status === 'PARTIAL' ? 'warning' : 'error'}">
            Status Global: ${data.summary.status} | Score de Préparation: ${data.summary.readinessScore}%
        </div>

        <div class="metrics">
            <div class="metric-card">
                <div class="metric-value">${data.summary.totalModules}</div>
                <div class="metric-label">Modules Testés</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${data.summary.successfulModules}</div>
                <div class="metric-label">Succès</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${data.summary.failedModules}</div>
                <div class="metric-label">Échecs</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${Math.round(data.summary.totalDuration / 60000)}min</div>
                <div class="metric-label">Durée Totale</div>
            </div>
        </div>

        <h3>📊 Détail des Modules</h3>
        ${Object.entries(data.modules).map(([name, result]) => `
            <div class="module">
                <div class="module-header">
                    <div class="module-name">${name}</div>
                    <div class="module-duration">${Math.round(result.duration / 1000)}s</div>
                </div>
                <div>Status: ${result.status === 'success' ? '✅ Succès' : '❌ Échec'}</div>
            </div>
        `).join('')}

        ${data.errors.length > 0 ? `
            <div class="status error">
                <h3>❌ Erreurs Détectées (${data.errors.length})</h3>
                <ul>
                    ${data.errors.map(error => `<li>${error}</li>`).join('')}
                </ul>
            </div>
        ` : ''}

        <div class="recommendations">
            <h3>💡 Recommandations</h3>
            <ul>
                ${data.recommendations.map(rec => `
                    <li><strong>${rec.priority}:</strong> ${rec.message} - ${rec.action}</li>
                `).join('')}
            </ul>
        </div>

        <div class="next-steps">
            <h3>🚀 Prochaines Étapes</h3>
            <ol>
                ${data.nextSteps.map(step => `<li>${step}</li>`).join('')}
            </ol>
        </div>
    </div>
</body>
</html>`;

        fs.writeFileSync(outputPath, html);
    }

    /**
     * Affiche le résumé final
     */
    async printSummary() {
        const summary = this.generateSummary();
        const totalDuration = Date.now() - globalMetrics.startTime;
        
        console.log(`\n${COLORS.bright}${COLORS.cyan}╔════════════════════════════════════════════════════════════════════════════════════════════╗`);
        console.log(`║                                  📊 RÉSUMÉ FINAL DES TESTS                                   ║`);
        console.log(`╚════════════════════════════════════════════════════════════════════════════════════════════╝${COLORS.reset}\n`);

        // Statut global
        const statusColor = summary.status === 'PASS' ? COLORS.green : summary.status === 'PARTIAL' ? COLORS.yellow : COLORS.red;
        console.log(`${statusColor}${COLORS.bright}🎯 Statut Global: ${summary.status}${COLORS.reset}`);
        console.log(`${COLORS.bright}📊 Score de Préparation: ${summary.readinessScore}%${COLORS.reset}\n`);

        // Métriques globales
        console.log(`${COLORS.blue}📈 Métriques Globales:${COLORS.reset}`);
        console.log(`   • Modules testés: ${summary.totalModules}`);
        console.log(`   • Succès: ${COLORS.green}${summary.successfulModules}${COLORS.reset}`);
        console.log(`   • Échecs: ${COLORS.red}${summary.failedModules}${COLORS.reset}`);
        console.log(`   • Durée totale: ${COLORS.cyan}${Math.round(totalDuration / 60000)}:${Math.round((totalDuration % 60000) / 1000).toString().padStart(2, '0')} min${COLORS.reset}`);
        console.log(`   • Durée moyenne par module: ${COLORS.cyan}${Math.round(summary.averageModuleDuration / 1000)}s${COLORS.reset}\n`);

        // Détail par module
        console.log(`${COLORS.blue}🔍 Détail par Module:${COLORS.reset}`);
        for (const [name, result] of this.results) {
            const statusIcon = result.status === 'success' ? '✅' : '❌';
            const statusText = result.status === 'success' ? 'Succès' : 'Échec';
            const statusColor = result.status === 'success' ? COLORS.green : COLORS.red;
            console.log(`   ${statusIcon} ${statusColor}${name}${COLORS.reset}: ${Math.round(result.duration / 1000)}s (${statusText})`);
        }

        // Erreurs
        if (this.errors.length > 0) {
            console.log(`\n${COLORS.red}❌ Erreurs Détectées (${this.errors.length}):${COLORS.reset}`);
            this.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${COLORS.red}${error}${COLORS.reset}`);
            });
        }

        // Statut de préparation pour la production
        console.log(`\n${COLORS.bright}${COLORS.cyan}🚀 STATUT DE PRÉPARATION POUR LA PRODUCTION:${COLORS.reset}`);
        if (summary.readinessScore >= 90) {
            console.log(`${COLORS.green}${COLORS.bright}✅ PRÊT POUR LA PRODUCTION${COLORS.reset} - L'application peut être déployée en production`);
        } else if (summary.readinessScore >= 70) {
            console.log(`${COLORS.yellow}${COLORS.bright}⚠️  PRÊT AVEC AVERTISSEMENTS${COLORS.reset} - Corriger les erreurs mineures avant déploiement`);
        } else {
            console.log(`${COLORS.red}${COLORS.bright}❌ NON PRÊT POUR LA PRODUCTION${COLORS.reset} - Corrections majeures requises`);
        }

        console.log(`\n${COLORS.cyan}📁 Rapports générés dans: ${CONFIG.outputDir}${COLORS.reset}`);
    }
}

// Point d'entrée principal
async function main() {
    const args = process.argv.slice(2);
    
    // Traitement des arguments
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
🎯 ORCHESTRATEUR COMPLET DE TESTS DE PERFORMANCE
===============================================

Usage: node orchestrator-complete.js [options]

Options:
  --parallel, -p     Exécution en parallèle (défaut)
  --sequential, -s   Exécution séquentielle
  --verbose, -v      Affichage détaillé
  --timeout <ms>     Timeout par test (défaut: 30min)
  --help, -h         Affichage de l'aide

Exemples:
  node orchestrator-complete.js              # Exécution parallèle standard
  node orchestrator-complete.js --verbose    # Avec détails
  node orchestrator-complete.js --sequential # Séquentiel
        `);
        process.exit(0);
    }

    // Configuration des options
    CONFIG.parallel = !args.includes('--sequential') && !args.includes('-s');
    CONFIG.verbose = args.includes('--verbose') || args.includes('-v');
    
    const timeoutArg = args.find(arg => arg === '--timeout');
    if (timeoutArg) {
        const timeoutIndex = args.indexOf(timeoutArg);
        if (timeoutIndex + 1 < args.length) {
            CONFIG.timeout = parseInt(args[timeoutIndex + 1]) || CONFIG.timeout;
        }
    }

    // Création du répertoire de sortie
    if (!fs.existsSync(CONFIG.outputDir)) {
        fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }

    try {
        const orchestrator = new PerformanceTestOrchestrator();
        await orchestrator.runAllTests();
        
        console.log(`\n${COLORS.green}${COLORS.bright}🎉 Orchestration terminée avec succès !${COLORS.reset}\n`);
        process.exit(0);
    } catch (error) {
        console.error(`\n${COLORS.red}${COLORS.bright}💥 Erreur lors de l'orchestration:${COLORS.reset}`, error.message);
        process.exit(1);
    }
}

// Exécution
if (require.main === module) {
    main();
}

module.exports = PerformanceTestOrchestrator;