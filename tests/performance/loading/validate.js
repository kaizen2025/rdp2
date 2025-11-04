#!/usr/bin/env node

/**
 * Script de Validation - Système de Tests de Performance RDS Viewer
 * Vérifie que tous les composants sont correctement installés et configurés
 * 
 * Date: 2025-11-04
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class SystemValidator {
    constructor() {
        this.setupDir = __dirname;
        this.validationResults = {
            timestamp: new Date().toISOString(),
            systemInfo: {},
            checks: [],
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                warnings: 0
            },
            recommendations: []
        };
    }

    /**
     * Affiche le header de validation
     */
    showHeader() {
        console.log(`
╔══════════════════════════════════════════════════════════════╗
║                🔍 VALIDATION DU SYSTÈME                      ║
║              Tests de Performance RDS Viewer                 ║
╚══════════════════════════════════════════════════════════════╝

🔍 Ce script vérifie :
   ✅ Installation des dépendances
   ✅ Configuration du système
   ✅ Connectivité réseau
   ✅ Intégrité des fichiers
   ✅ Performances système

⏱️ Durée estimée : 1 minute

🚀 Démarrage de la validation...

`);
    }

    /**
     * Collecte les informations système
     */
    collectSystemInfo() {
        this.validationResults.systemInfo = {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            workingDirectory: process.cwd(),
            scriptDirectory: this.setupDir,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Vérifie l'environnement Node.js
     */
    validateNodeEnvironment() {
        console.log('🔍 Validation de l\'environnement Node.js...');
        
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
        
        const check = {
            name: 'Node.js Version',
            status: majorVersion >= 14 ? 'passed' : 'failed',
            message: majorVersion >= 14 ? 
                `Node.js ${nodeVersion} (Compatible)` : 
                `Node.js ${nodeVersion} (Incompatible, requis >= 14)`,
            details: `Version majeure détectée: ${majorVersion}`
        };
        
        this.validationResults.checks.push(check);
        this.updateSummary(check);
        
        if (majorVersion < 14) {
            this.validationResults.recommendations.push({
                priority: 'high',
                issue: 'Version Node.js obsolète',
                solution: 'Mettre à jour Node.js vers la version 14 ou supérieure',
                impact: 'Nécessaire pour les fonctionnalités avancées'
            });
        }
        
        console.log(`  ${check.status === 'passed' ? '✅' : '❌'} ${check.message}\n`);
    }

    /**
     * Vérifie la présence des fichiers essentiels
     */
    validateRequiredFiles() {
        console.log('📁 Validation des fichiers essentiels...');
        
        const requiredFiles = [
            'performanceTestOrchestrator.js',
            'loadingPerformanceTest.js',
            'reactComponentPerformanceTest.js',
            'continuousPerformanceMonitor.js',
            'performanceBenchmarks.js',
            'performanceReportGenerator.js',
            'package.json',
            'README.md'
        ];
        
        const requiredDirs = [
            'results',
            'monitoring'
        ];

        // Vérifier les fichiers
        requiredFiles.forEach(async (file) => {
            const filePath = path.join(this.setupDir, file);
            const exists = await this.fileExists(filePath);
            
            const check = {
                name: `Fichier ${file}`,
                status: exists ? 'passed' : 'failed',
                message: exists ? 
                    `${file} trouvé` : 
                    `${file} manquant`,
                path: filePath
            };
            
            this.validationResults.checks.push(check);
            this.updateSummary(check);
            
            console.log(`  ${exists ? '✅' : '❌'} ${file}`);
        });

        // Vérifier les répertoires
        requiredDirs.forEach(async (dir) => {
            const dirPath = path.join(this.setupDir, dir);
            const exists = await this.fileExists(dirPath);
            
            const check = {
                name: `Répertoire ${dir}`,
                status: exists ? 'passed' : 'warning',
                message: exists ? 
                    `Répertoire ${dir} trouvé` : 
                    `Répertoire ${dir} sera créé automatiquement`,
                path: dirPath
            };
            
            this.validationResults.checks.push(check);
            this.updateSummary(check);
            
            console.log(`  ${exists ? '✅' : '⚠️'} ${dir}/`);
        });
        
        console.log('');
    }

    /**
     * Vérifie les dépendances npm
     */
    async validateNpmDependencies() {
        console.log('📦 Validation des dépendances npm...');
        
        const packageJsonPath = path.join(this.setupDir, 'package.json');
        
        try {
            const packageContent = await fs.readFile(packageJsonPath, 'utf8');
            const packageData = JSON.parse(packageContent);
            
            const requiredDeps = [
                'puppeteer',
                'node-cron',
                'performance-now',
                '@testing-library/react',
                'jsdom'
            ];
            
            const installedDeps = Object.keys(packageData.dependencies || {});
            
            requiredDeps.forEach(dep => {
                const isInstalled = installedDeps.includes(dep);
                const check = {
                    name: `Dépendance ${dep}`,
                    status: isInstalled ? 'passed' : 'failed',
                    message: isInstalled ? 
                        `${dep} installé` : 
                        `${dep} manquant`,
                    package: dep
                };
                
                this.validationResults.checks.push(check);
                this.updateSummary(check);
                
                console.log(`  ${isInstalled ? '✅' : '❌'} ${dep}`);
            });
            
            console.log('');
            
        } catch (error) {
            const check = {
                name: 'package.json',
                status: 'failed',
                message: `Erreur de lecture: ${error.message}`,
                error: error.message
            };
            
            this.validationResults.checks.push(check);
            this.updateSummary(check);
            
            console.log(`  ❌ Erreur lors de la lecture de package.json\n`);
        }
    }

    /**
     * Teste la connectivité réseau
     */
    async validateNetworkConnectivity() {
        console.log('🌐 Test de connectivité réseau...');
        
        const connectivityTests = [
            {
                name: 'Accès NPM Registry',
                url: 'https://registry.npmjs.org/',
                timeout: 5000
            },
            {
                name: 'Application Locale',
                url: 'http://localhost:3000',
                timeout: 3000
            }
        ];
        
        for (const test of connectivityTests) {
            const result = await this.testUrlConnectivity(test.url, test.timeout);
            
            const check = {
                name: test.name,
                status: result.success ? 'passed' : 'warning',
                message: result.success ? 
                    `Connexion OK (${result.responseTime}ms)` : 
                    `Non accessible: ${result.error}`,
                url: test.url,
                responseTime: result.responseTime,
                error: result.error
            };
            
            this.validationResults.checks.push(check);
            this.updateSummary(check);
            
            if (test.name === 'Application Locale') {
                if (!result.success) {
                    this.validationResults.recommendations.push({
                        priority: 'medium',
                        issue: 'Application RDS Viewer non accessible',
                        solution: 'Démarrer l\'application sur http://localhost:3000',
                        impact: 'Nécessaire pour les tests complets'
                    });
                }
            }
            
            console.log(`  ${result.success ? '✅' : '⚠️'} ${test.name}: ${check.message}`);
        }
        
        console.log('');
    }

    /**
     * Vérifie la configuration
     */
    async validateConfiguration() {
        console.log('⚙️  Validation de la configuration...');
        
        const configFiles = ['config.js', '.env'];
        
        for (const configFile of configFiles) {
            const configPath = path.join(this.setupDir, configFile);
            const exists = await this.fileExists(configPath);
            
            const check = {
                name: `Configuration ${configFile}`,
                status: exists ? 'passed' : 'warning',
                message: exists ? 
                    `Fichier de configuration trouvé` : 
                    `Fichier de configuration sera créé à la première utilisation`,
                path: configPath
            };
            
            this.validationResults.checks.push(check);
            this.updateSummary(check);
            
            console.log(`  ${exists ? '✅' : '⚠️'} ${configFile}`);
        }
        
        console.log('');
    }

    /**
     * Teste les performances système
     */
    async validateSystemPerformance() {
        console.log('⚡ Test des performances système...');
        
        // Test CPU (simulation)
        const cpuTestStart = Date.now();
        let sum = 0;
        for (let i = 0; i < 1000000; i++) {
            sum += Math.sqrt(i);
        }
        const cpuTestDuration = Date.now() - cpuTestStart;
        
        const cpuCheck = {
            name: 'Performance CPU',
            status: cpuTestDuration < 100 ? 'passed' : 'warning',
            message: `Test CPU: ${cpuTestDuration}ms`,
            duration: cpuTestDuration
        };
        
        this.validationResults.checks.push(cpuCheck);
        this.updateSummary(cpuCheck);
        
        console.log(`  ${cpuTestDuration < 100 ? '✅' : '⚠️'} CPU: ${cpuTestDuration}ms`);
        
        // Test mémoire
        const memBefore = process.memoryUsage();
        
        // Allocation de mémoire test
        const testArray = new Array(100000).fill(Math.random());
        const memAfter = process.memoryUsage();
        
        const memoryUsed = (memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024;
        
        const memoryCheck = {
            name: 'Performance Mémoire',
            status: memoryUsed < 10 ? 'passed' : 'warning',
            message: `Utilisation mémoire: ${memoryUsed.toFixed(2)}MB`,
            memoryUsed
        };
        
        this.validationResults.checks.push(memoryCheck);
        this.updateSummary(memoryCheck);
        
        // Nettoyer
        testArray.length = 0;
        
        console.log(`  ${memoryUsed < 10 ? '✅' : '⚠️'} Mémoire: ${memoryUsed.toFixed(2)}MB`);
        console.log('');
    }

    /**
     * Vérifie l'intégrité des scripts
     */
    async validateScriptIntegrity() {
        console.log('🛠️  Validation de l\'intégrité des scripts...');
        
        const criticalScripts = [
            'performanceTestOrchestrator.js',
            'loadingPerformanceTest.js'
        ];
        
        for (const script of criticalScripts) {
            const scriptPath = path.join(this.setupDir, script);
            const exists = await this.fileExists(scriptPath);
            
            if (exists) {
                try {
                    const content = await fs.readFile(scriptPath, 'utf8');
                    
                    // Vérifications basiques d'intégrité
                    const hasMainFunction = content.includes('async function') || content.includes('function');
                    const hasExports = content.includes('module.exports');
                    const hasErrorHandling = content.includes('try') || content.includes('catch');
                    
                    const integrityScore = [hasMainFunction, hasExports, hasErrorHandling].filter(Boolean).length;
                    
                    const check = {
                        name: `Intégrité ${script}`,
                        status: integrityScore >= 2 ? 'passed' : 'warning',
                        message: `Script valide (${integrityScore}/3 checks)`,
                        details: {
                            hasMainFunction,
                            hasExports,
                            hasErrorHandling
                        }
                    };
                    
                    this.validationResults.checks.push(check);
                    this.updateSummary(check);
                    
                    console.log(`  ${integrityScore >= 2 ? '✅' : '⚠️'} ${script}: ${check.message}`);
                    
                } catch (error) {
                    const check = {
                        name: `Lecture ${script}`,
                        status: 'failed',
                        message: `Erreur de lecture: ${error.message}`,
                        error: error.message
                    };
                    
                    this.validationResults.checks.push(check);
                    this.updateSummary(check);
                    
                    console.log(`  ❌ ${script}: Erreur de lecture`);
                }
            } else {
                const check = {
                    name: `Script ${script}`,
                    status: 'failed',
                    message: 'Script manquant'
                };
                
                this.validationResults.checks.push(check);
                this.updateSummary(check);
                
                console.log(`  ❌ ${script}: Script manquant`);
            }
        }
        
        console.log('');
    }

    /**
     * Met à jour le résumé
     */
    updateSummary(check) {
        this.validationResults.summary.total++;
        
        switch (check.status) {
            case 'passed':
                this.validationResults.summary.passed++;
                break;
            case 'failed':
                this.validationResults.summary.failed++;
                break;
            case 'warning':
                this.validationResults.summary.warnings++;
                break;
        }
    }

    /**
     * Teste la connectivité d'une URL
     */
    async testUrlConnectivity(url, timeout) {
        try {
            const https = require('https');
            const http = require('http');
            
            const startTime = Date.now();
            
            return new Promise((resolve) => {
                const urlObj = new URL(url);
                const client = urlObj.protocol === 'https:' ? https : http;
                
                const req = client.get(url, (res) => {
                    const responseTime = Date.now() - startTime;
                    resolve({
                        success: res.statusCode < 500,
                        responseTime,
                        statusCode: res.statusCode
                    });
                });
                
                req.on('error', (error) => {
                    resolve({
                        success: false,
                        responseTime: Date.now() - startTime,
                        error: error.message
                    });
                });
                
                req.setTimeout(timeout, () => {
                    req.destroy();
                    resolve({
                        success: false,
                        responseTime: timeout,
                        error: 'Timeout'
                    });
                });
            });
            
        } catch (error) {
            return {
                success: false,
                responseTime: timeout,
                error: error.message
            };
        }
    }

    /**
     * Vérifie l'existence d'un fichier
     */
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Génère les recommandations finales
     */
    generateFinalRecommendations() {
        // Analyser les résultats pour générer des recommandations
        
        const failedChecks = this.validationResults.checks.filter(c => c.status === 'failed');
        const warningChecks = this.validationResults.checks.filter(c => c.status === 'warning');
        
        if (failedChecks.length > 0) {
            this.validationResults.recommendations.push({
                priority: 'critical',
                issue: `${failedChecks.length} vérification(s) échouée(s)`,
                solution: 'Exécuter npm run setup pour corriger les problèmes',
                impact: 'Système non fonctionnel sans corrections'
            });
        }
        
        if (warningChecks.length > 0) {
            this.validationResults.recommendations.push({
                priority: 'low',
                issue: `${warningChecks.length} avertissement(s)`,
                solution: 'Consulter les logs pour plus de détails',
                impact: 'Fonctionnalité dégradée possible'
            });
        }
    }

    /**
     * Affiche le rapport final
     */
    displayFinalReport() {
        const summary = this.validationResults.summary;
        
        console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    📋 RAPPORT FINAL                          ║
╚══════════════════════════════════════════════════════════════╝

📊 RÉSULTATS DE LA VALIDATION :

✅ Validations réussies: ${summary.passed}
⚠️  Avertissements: ${summary.warnings}
❌ Échecs: ${summary.failed}
📈 Total des vérifications: ${summary.total}

🎯 STATUT GLOBAL: ${this.getOverallStatus()}

${summary.failed === 0 ? `
✅ SYSTÈME PRÊT À L'UTILISATION

🚀 Commandes disponibles :
   npm run test              # Test complet
   npm run demo              # Voir la démonstration
   npm run setup             # Configuration interactive
` : `
❌ CORRECTIONS NÉCESSAIRES

🔧 Actions recommandées :
   npm run setup             # Configuration automatique
   npm install               # Installation des dépendances
   npm run validate          # Revalidation après corrections
`}

${this.validationResults.recommendations.length > 0 ? `
💡 RECOMMANDATIONS :

${this.validationResults.recommendations.map((rec, index) => 
    `${index + 1}. [${rec.priority.toUpperCase()}] ${rec.issue}`
).join('\n')}
` : ''}

📁 Fichiers de validation:
   validation-results-${new Date().toISOString().split('T')[0]}.json

`);
    }

    /**
     * Détermine le statut global
     */
    getOverallStatus() {
        const { failed, warnings, total } = this.validationResults.summary;
        
        if (failed === 0 && warnings === 0) return 'EXCELLENT';
        if (failed === 0 && warnings <= 2) return 'BON';
        if (failed === 0 && warnings > 2) return 'CORRECT';
        if (failed <= 2) return 'NÉCESSITE ATTENTION';
        return 'PROBLÈMES CRITIQUES';
    }

    /**
     * Sauvegarde les résultats
     */
    async saveResults() {
        const filename = `validation-results-${new Date().toISOString().split('T')[0]}.json`;
        const filepath = path.join(this.setupDir, filename);
        
        await fs.writeFile(filepath, JSON.stringify(this.validationResults, null, 2));
        
        console.log(`💾 Résultats sauvegardés: ${filename}`);
        
        return filepath;
    }

    /**
     * Méthode principale de validation
     */
    async validate() {
        this.showHeader();
        this.collectSystemInfo();
        
        // Exécuter toutes les validations
        this.validateNodeEnvironment();
        await this.validateRequiredFiles();
        await this.validateNpmDependencies();
        await this.validateNetworkConnectivity();
        await this.validateConfiguration();
        await this.validateSystemPerformance();
        await this.validateScriptIntegrity();
        
        // Générer les recommandations finales
        this.generateFinalRecommendations();
        
        // Afficher le rapport final
        this.displayFinalReport();
        
        // Sauvegarder les résultats
        await this.saveResults();
        
        // Code de sortie basé sur les résultats
        const hasFailures = this.validationResults.summary.failed > 0;
        return !hasFailures; // true si succès
    }
}

// Point d'entrée principal
async function main() {
    const validator = new SystemValidator();
    
    try {
        const success = await validator.validate();
        process.exit(success ? 0 : 1);
    } catch (error) {
        console.error('❌ Erreur lors de la validation:', error);
        process.exit(1);
    }
}

// Export pour utilisation dans d'autres modules
module.exports = SystemValidator;

// Exécution directe
if (require.main === module) {
    main();
}