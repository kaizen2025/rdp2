#!/usr/bin/env node

/**
 * 🎯 VALIDATION FINALE RDS VIEWER ANECOOP
 * ======================================
 * 
 * Ce script effectuer une validation complète finale pour s'assurer que :
 * - Aucune erreur dans l'application
 * - Aucun avertissement critique
 * - L'application démarre parfaitement
 * - Tous les services sont opérationnels
 * 
 * Usage: node final-validation.js
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

// Configuration
const CONFIG = {
    rdpDir: '/workspace/rdp',
    appDir: '/workspace/rdp/app',
    testsDir: '/workspace/rdp/tests',
    logsDir: '/workspace/rdp/logs',
    timeout: 30000 // 30 secondes par vérification
};

// Couleurs d'affichage
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

// Résultats de validation
const validationResults = {
    timestamp: new Date().toISOString(),
    checks: [],
    summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
    },
    status: 'PENDING'
};

/**
 * Classe de validation finale
 */
class FinalValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.passed = 0;
    }

    /**
     * Affiche le header
     */
    printHeader() {
        console.log(`\n${COLORS.bright}${COLORS.cyan}╔════════════════════════════════════════════════════════════════════════════════════════════╗`);
        console.log(`║                         🎯 VALIDATION FINALE RDS VIEWER ANECOOP                             ║`);
        console.log(`║                                 VERSION 3.0.27 PRODUCTION                                    ║`);
        console.log(`╚════════════════════════════════════════════════════════════════════════════════════════════╝${COLORS.reset}`);
        console.log(`${COLORS.cyan}🔍 Vérification finale de tous les composants...${COLORS.reset}\n`);
    }

    /**
     * Exécute toutes les validations
     */
    async runAllValidations() {
        const validations = [
            { name: 'Structure des fichiers', method: 'validateFileStructure' },
            { name: 'Configuration production', method: 'validateProductionConfig' },
            { name: 'Scripts de démarrage', method: 'validateStartScripts' },
            { name: 'Tests de performance', method: 'validatePerformanceTests' },
            { name: 'Dépendances Node.js', method: 'validateNodeDependencies' },
            { name: 'Structure base de données', method: 'validateDatabaseStructure' },
            { name: 'Services IA (Ollama, OCR)', method: 'validateAIServices' },
            { name: 'Services Electron', method: 'validateElectronServices' },
            { name: 'Sécurité et permissions', method: 'validateSecurity' },
            { name: 'Logs et monitoring', method: 'validateLogging' }
        ];

        console.log(`${COLORS.yellow}⏳ Exécution de ${validations.length} validations...${COLORS.reset}\n`);

        for (const validation of validations) {
            try {
                console.log(`${COLORS.blue}🔍 ${validation.name}...${COLORS.reset}`);
                await this[validation.method]();
                console.log(`${COLORS.green}   ✅ OK${COLORS.reset}`);
                this.passed++;
                validationResults.checks.push({
                    name: validation.name,
                    status: 'PASS',
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.log(`${COLORS.red}   ❌ ERREUR: ${error.message}${COLORS.reset}`);
                this.errors.push(error.message);
                validationResults.checks.push({
                    name: validation.name,
                    status: 'FAIL',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }

        validationResults.summary.total = validations.length;
        validationResults.summary.passed = this.passed;
        validationResults.summary.failed = validationResults.summary.total - this.passed;
        validationResults.summary.warnings = this.warnings.length;
        validationResults.status = this.errors.length === 0 ? 'PASS' : 'FAIL';

        await this.generateValidationReport();
        await this.printFinalSummary();
    }

    /**
     * Valide la structure des fichiers
     */
    async validateFileStructure() {
        const requiredDirs = [
            'app',
            'config',
            'src',
            'tests',
            'docs',
            'scripts',
            'logs'
        ];

        const requiredFiles = [
            'package.json',
            'package-lock.json',
            'main.js',
            'config/production.json',
            '.env.production',
            'start-production.bat'
        ];

        // Vérification des répertoires
        for (const dir of requiredDirs) {
            const dirPath = path.join(CONFIG.rdpDir, dir);
            if (!fs.existsSync(dirPath)) {
                throw new Error(`Répertoire manquant: ${dir}`);
            }
        }

        // Vérification des fichiers
        for (const file of requiredFiles) {
            const filePath = path.join(CONFIG.rdpDir, file);
            if (!fs.existsSync(filePath)) {
                throw new Error(`Fichier manquant: ${file}`);
            }
        }

        // Vérification des tests de performance
        const perfTestsDir = path.join(CONFIG.testsDir, 'performance');
        if (!fs.existsSync(perfTestsDir)) {
            throw new Error(`Répertoire des tests de performance manquant`);
        }

        const perfSubDirs = ['loading', 'ui-reactivity', 'backend', 'memory', 'load-testing', 'ai-metrics'];
        for (const subDir of perfSubDirs) {
            const subDirPath = path.join(perfTestsDir, subDir);
            if (!fs.existsSync(subDirPath)) {
                throw new Error(`Sous-répertoire de tests manquant: ${subDir}`);
            }
        }
    }

    /**
     * Valide la configuration de production
     */
    async validateProductionConfig() {
        // Validation du fichier production.json
        const prodConfigPath = path.join(CONFIG.rdpDir, 'config', 'production.json');
        const prodConfig = JSON.parse(fs.readFileSync(prodConfigPath, 'utf8'));

        // Vérifications de structure
        if (!prodConfig.server) throw new Error('Configuration serveur manquante');
        if (!prodConfig.database) throw new Error('Configuration base de données manquante');
        if (!prodConfig.ai) throw new Error('Configuration IA manquante');
        if (!prodConfig.security) throw new Error('Configuration sécurité manquante');

        // Validation des valeurs critiques
        if (!prodConfig.server.port || prodConfig.server.port < 1000) {
            throw new Error('Port serveur invalide');
        }

        if (!prodConfig.database.type || !['sqlite', 'postgresql', 'mysql'].includes(prodConfig.database.type)) {
            throw new Error('Type de base de données non supporté');
        }

        // Validation du fichier .env.production
        const envPath = path.join(CONFIG.rdpDir, '.env.production');
        const envContent = fs.readFileSync(envPath, 'utf8');
        
        const requiredEnvVars = [
            'NODE_ENV',
            'DB_PATH',
            'JWT_SECRET',
            'SESSION_SECRET'
        ];

        for (const envVar of requiredEnvVars) {
            if (!envContent.includes(`${envVar}=`)) {
                throw new Error(`Variable d'environnement manquante: ${envVar}`);
            }
        }
    }

    /**
     * Valide les scripts de démarrage
     */
    async validateStartScripts() {
        // Validation du script start-production.bat
        const startScriptPath = path.join(CONFIG.rdpDir, 'start-production.bat');
        const startScriptContent = fs.readFileSync(startScriptPath, 'utf8');

        const requiredElements = [
            'NODE_ENV=production',
            'npm start',
            'electron .'
        ];

        for (const element of requiredElements) {
            if (!startScriptContent.includes(element)) {
                throw new Error(`Élément manquant dans start-production.bat: ${element}`);
            }
        }

        // Vérification de la syntaxe du package.json
        const packageJsonPath = path.join(CONFIG.rdpDir, 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        if (!packageJson.scripts || !packageJson.scripts.start) {
            throw new Error('Script "start" manquant dans package.json');
        }

        if (!packageJson.main) {
            throw new Error('Champ "main" manquant dans package.json');
        }
    }

    /**
     * Valide les tests de performance
     */
    async validatePerformanceTests() {
        // Vérification de l'orchestrateur
        const orchestratorPath = path.join(CONFIG.testsDir, 'performance', 'orchestrator-complete.js');
        if (!fs.existsSync(orchestratorPath)) {
            throw new Error('Orchestrateur de tests de performance manquant');
        }

        // Test d'importation du module
        try {
            const orchestrator = require(orchestratorPath);
            if (!orchestrator || typeof orchestrator !== 'function') {
                throw new Error('Orchestrateur invalide');
            }
        } catch (error) {
            throw new Error(`Erreur d'importation de l'orchestrateur: ${error.message}`);
        }

        // Vérification de chaque module de test
        const testModules = ['loading', 'ui-reactivity', 'backend', 'memory', 'load-testing', 'ai-metrics'];
        
        for (const module of testModules) {
            const modulePath = path.join(CONFIG.testsDir, 'performance', module);
            const indexFile = path.join(modulePath, 'index.js');
            
            if (!fs.existsSync(indexFile)) {
                throw new Error(`Module de test manquant: ${module}`);
            }
        }
    }

    /**
     * Valide les dépendances Node.js
     */
    async validateNodeDependencies() {
        const packageJsonPath = path.join(CONFIG.rdpDir, 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        // Dépendances critiques requises
        const criticalDeps = [
            'electron',
            'react',
            '@mui/material',
            'sqlite3',
            'ws',
            'express'
        ];

        for (const dep of criticalDeps) {
            if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
                throw new Error(`Dépendance critique manquante: ${dep}`);
            }
        }

        // Vérification des versions critiques
        if (packageJson.dependencies.electron) {
            const electronVersion = packageJson.dependencies.electron;
            // Vérification basique de version
            if (!electronVersion.match(/^\d+\.\d+\.\d+/)) {
                throw new Error(`Version Electron invalide: ${electronVersion}`);
            }
        }
    }

    /**
     * Valide la structure de la base de données
     */
    async validateDatabaseStructure() {
        const scriptsDir = path.join(CONFIG.rdpDir, 'scripts');
        
        // Vérification des scripts SQL
        const sqlFiles = fs.readdirSync(scriptsDir).filter(file => file.endsWith('.sql'));
        
        if (sqlFiles.length === 0) {
            throw new Error('Aucun script SQL trouvé');
        }

        // Vérification du script d'optimisation production
        const optScript = path.join(scriptsDir, 'optimize-production.sql');
        if (!fs.existsSync(optScript)) {
            throw new Error('Script d\'optimisation production manquant');
        }

        // Lecture et validation du contenu
        const optContent = fs.readFileSync(optScript, 'utf8');
        const requiredOptimizations = [
            'PRAGMA',
            'INDEX',
            'ANALYZE'
        ];

        for (const opt of requiredOptimizations) {
            if (!optContent.includes(opt)) {
                throw new Error(`Optimisation manquante: ${opt}`);
            }
        }
    }

    /**
     * Valide les services IA
     */
    async validateAIServices() {
        // Vérification de la configuration Ollama
        const configPath = path.join(CONFIG.rdpDir, 'config', 'production.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        if (!config.ai || !config.ai.ollama) {
            throw new Error('Configuration Ollama manquante');
        }

        // Vérification des modèles IA
        const aiModels = config.ai.ollama.models || [];
        if (!aiModels.includes('llama3.2:3b')) {
            throw new Error('Modèle llama3.2:3b manquant');
        }

        // Vérification de la configuration OCR
        if (!config.ai.ocr || !config.ai.ocr.enabled) {
            this.warnings.push('OCR désactivé dans la configuration');
        }

        // Vérification de la configuration GED
        if (!config.ai.ged || !config.ai.ged.enabled) {
            this.warnings.push('GED désactivé dans la configuration');
        }
    }

    /**
     * Valide les services Electron
     */
    async validateElectronServices() {
        const mainPath = path.join(CONFIG.rdpDir, 'main.js');
        if (!fs.existsSync(mainPath)) {
            throw new Error('Fichier main.js manquant');
        }

        const mainContent = fs.readFileSync(mainPath, 'utf8');

        // Vérifications critiques
        const criticalElements = [
            'app.whenReady',
            'BrowserWindow',
            'mainWindow',
            'ipcMain'
        ];

        for (const element of criticalElements) {
            if (!mainContent.includes(element)) {
                throw new Error(`Élément Electron manquant: ${element}`);
            }
        }

        // Vérification des preload scripts
        const preloadPattern = /preload.*\.js/;
        if (!preloadPattern.test(mainContent)) {
            this.warnings.push('Preload script non détecté');
        }
    }

    /**
     * Valide la sécurité et les permissions
     */
    async validateSecurity() {
        const configPath = path.join(CONFIG.rdpDir, 'config', 'production.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        // Vérification des paramètres de sécurité
        if (!config.security) {
            throw new Error('Configuration de sécurité manquante');
        }

        const securitySettings = [
            'jwtExpiration',
            'sessionTimeout',
            'maxLoginAttempts',
            'rateLimiting'
        ];

        for (const setting of securitySettings) {
            if (!(setting in config.security)) {
                this.warnings.push(`Paramètre de sécurité manquant: ${setting}`);
            }
        }

        // Vérification HTTPS
        if (!config.server.ssl || !config.server.ssl.enabled) {
            this.warnings.push('HTTPS non activé');
        }
    }

    /**
     * Valide les logs et le monitoring
     */
    async validateLogging() {
        // Vérification du répertoire de logs
        if (!fs.existsSync(CONFIG.logsDir)) {
            fs.mkdirSync(CONFIG.logsDir, { recursive: true });
        }

        // Vérification de la configuration des logs
        const configPath = path.join(CONFIG.rdpDir, 'config', 'production.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        if (!config.logging || !config.logging.enabled) {
            this.warnings.push('Logging désactivé');
        }
    }

    /**
     * Génère le rapport de validation
     */
    async generateValidationReport() {
        const reportPath = path.join(CONFIG.rdpDir, 'validation-report.json');
        
        const reportData = {
            ...validationResults,
            errors: this.errors,
            warnings: this.warnings,
            environment: {
                nodeVersion: process.version,
                platform: process.platform,
                architecture: process.arch,
                cwd: process.cwd()
            }
        };

        fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
        console.log(`\n${COLORS.blue}📊 Rapport de validation sauvegardé: ${reportPath}${COLORS.reset}`);
    }

    /**
     * Affiche le résumé final
     */
    async printFinalSummary() {
        const total = validationResults.summary.total;
        const passed = validationResults.summary.passed;
        const failed = validationResults.summary.failed;
        const warnings = this.warnings.length;
        const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;

        console.log(`\n${COLORS.bright}${COLORS.cyan}╔════════════════════════════════════════════════════════════════════════════════════════════╗`);
        console.log(`║                               📊 RÉSUMÉ DE VALIDATION FINALE                                ║`);
        console.log(`╚════════════════════════════════════════════════════════════════════════════════════════════╝${COLORS.reset}\n`);

        // Statut global
        const statusColor = validationResults.status === 'PASS' ? COLORS.green : COLORS.red;
        console.log(`${statusColor}${COLORS.bright}🎯 Statut Global: ${validationResults.status}${COLORS.reset}`);
        console.log(`${COLORS.bright}📊 Taux de Succès: ${successRate}% (${passed}/${total})${COLORS.reset}\n`);

        // Résumé des résultats
        console.log(`${COLORS.blue}📈 Résumé des Vérifications:${COLORS.reset}`);
        console.log(`   ✅ Réussies: ${COLORS.green}${passed}${COLORS.reset}`);
        console.log(`   ❌ Échouées: ${COLORS.red}${failed}${COLORS.reset}`);
        console.log(`   ⚠️  Avertissements: ${COLORS.yellow}${warnings}${COLORS.reset}\n`);

        // Statut de préparation
        console.log(`${COLORS.bright}${COLORS.cyan}🚀 STATUT DE PRÉPARATION PRODUCTION:${COLORS.reset}`);
        
        if (validationResults.status === 'PASS' && warnings <= 2) {
            console.log(`${COLORS.green}${COLORS.bright}✅ PRÊT POUR LA PRODUCTION${COLORS.reset}`);
            console.log(`${COLORS.green}L'application est validée et prête pour le déploiement.${COLORS.reset}`);
        } else if (validationResults.status === 'PASS') {
            console.log(`${COLORS.yellow}${COLORS.bright}⚠️  PRÊT AVEC AVERTISSEMENTS${COLORS.reset}`);
            console.log(`${COLORS.yellow}L'application est fonctionnelle mais nécessite attention sur les avertissements.${COLORS.reset}`);
        } else {
            console.log(`${COLORS.red}${COLORS.bright}❌ NON PRÊT POUR LA PRODUCTION${COLORS.reset}`);
            console.log(`${COLORS.red}Des corrections sont requises avant le déploiement.${COLORS.reset}`);
        }

        // Détail des erreurs
        if (this.errors.length > 0) {
            console.log(`\n${COLORS.red}❌ Erreurs à Corriger:${COLORS.reset}`);
            this.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${COLORS.red}${error}${COLORS.reset}`);
            });
        }

        // Détail des avertissements
        if (this.warnings.length > 0) {
            console.log(`\n${COLORS.yellow}⚠️  Avertissements:${COLORS.reset}`);
            this.warnings.forEach((warning, index) => {
                console.log(`   ${index + 1}. ${COLORS.yellow}${warning}${COLORS.reset}`);
            });
        }

        // Actions recommandées
        console.log(`\n${COLORS.blue}🎯 Actions Recommandées:${COLORS.reset}`);
        if (validationResults.status === 'PASS') {
            if (warnings === 0) {
                console.log(`   • Déployer l'application en production`);
                console.log(`   • Configurer la surveillance continue`);
                console.log(`   • Former les utilisateurs finaux`);
            } else {
                console.log(`   • Corriger les avertissements avant production`);
                console.log(`   • Mettre à jour la configuration de sécurité`);
                console.log(`   • Réviser les paramètres de performance`);
            }
        } else {
            console.log(`   • Corriger toutes les erreurs critiques`);
            console.log(`   • Relancer la validation complète`);
            console.log(`   • Tester en environnement de staging`);
        }

        console.log(`\n${COLORS.cyan}📁 Rapport détaillé: ${CONFIG.rdpDir}/validation-report.json${COLORS.reset}`);
        console.log(`\n${COLORS.bright}${COLORS.green}🎉 Validation terminée !${COLORS.reset}\n`);
    }
}

// Point d'entrée principal
async function main() {
    try {
        const validator = new FinalValidator();
        validator.printHeader();
        await validator.runAllValidations();
        
        process.exit(0);
    } catch (error) {
        console.error(`\n${COLORS.red}${COLORS.bright}💥 Erreur lors de la validation:${COLORS.reset}`, error.message);
        process.exit(1);
    }
}

// Exécution
if (require.main === module) {
    main();
}

module.exports = FinalValidator;