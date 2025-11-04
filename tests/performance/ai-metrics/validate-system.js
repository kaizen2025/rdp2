#!/usr/bin/env node

/**
 * Script de validation du système de métriques IA
 * Vérifie l'intégrité et la configuration du système
 */

const fs = require('fs');
const path = require('path');

class AIVMetricsValidator {
    constructor() {
        this.baseDir = __dirname;
        this.errors = [];
        this.warnings = [];
        this.checks = {
            files: [],
            dependencies: [],
            configuration: [],
            permissions: [],
            services: []
        };
    }

    async validate() {
        console.log('🔍 === VALIDATION SYSTÈME MÉTRIQUES IA ===\n');
        console.log('Vérification de l\'intégrité du système...\n');
        
        await this.checkFileStructure();
        await this.checkDependencies();
        await this.checkConfiguration();
        await this.checkPermissions();
        await this.checkServices();
        await this.runQuickTests();
        
        this.generateReport();
    }

    async checkFileStructure() {
        console.log('📁 Vérification de la structure des fichiers...');
        
        const requiredFiles = [
            'ai-metrics-orchestrator.js',
            'start-ai-metrics.sh',
            'README.md',
            'package.json',
            'demo-ai-metrics.js',
            'scripts/ollama-load-test.js',
            'scripts/easyocr-load-test.js',
            'scripts/docucortex-ai-load-test.js',
            'scripts/ged-volume-load-test.js',
            'scripts/network-latency-test.js',
            'scripts/graceful-degradation-test.js',
            'shared/performance-monitor.js',
            'shared/load-generator.js',
            'shared/metrics-collector.js',
            'dashboards/metrics-dashboard.html',
            'alerts/alert-thresholds.js',
            'alerts/alert-config.json'
        ];

        let missingFiles = [];
        
        requiredFiles.forEach(file => {
            const filePath = path.join(this.baseDir, file);
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                console.log(`  ✅ ${file} (${this.formatSize(stats.size)})`);
                this.checks.files.push({ file, status: 'ok', size: stats.size });
            } else {
                console.log(`  ❌ ${file} - MANQUANT`);
                this.errors.push(`Fichier manquant: ${file}`);
                missingFiles.push(file);
            }
        });

        // Vérifier les dossiers requis
        const requiredDirs = ['scripts', 'shared', 'dashboards', 'alerts', 'configs', 'results'];
        requiredDirs.forEach(dir => {
            const dirPath = path.join(this.baseDir, dir);
            if (fs.existsSync(dirPath)) {
                const files = fs.readdirSync(dirPath);
                console.log(`  ✅ Dossier ${dir}/ (${files.length} fichiers)`);
            } else {
                console.log(`  ❌ Dossier ${dir}/ - MANQUANT`);
                this.errors.push(`Dossier manquant: ${dir}/`);
            }
        });

        console.log('');
    }

    async checkDependencies() {
        console.log('📦 Vérification des dépendances...');
        
        // Vérifier Node.js
        try {
            const nodeVersion = process.version;
            const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
            
            if (majorVersion >= 14) {
                console.log(`  ✅ Node.js ${nodeVersion} (>= 14.x requis)`);
                this.checks.dependencies.push({ name: 'Node.js', version: nodeVersion, status: 'ok' });
            } else {
                console.log(`  ❌ Node.js ${nodeVersion} (< 14.x requis)`);
                this.errors.push(`Node.js version trop ancienne: ${nodeVersion}`);
            }
        } catch (error) {
            console.log('  ❌ Node.js non trouvé');
            this.errors.push('Node.js non installé');
        }

        // Vérifier package.json
        try {
            const packagePath = path.join(this.baseDir, 'package.json');
            const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            
            console.log(`  ✅ package.json (v${packageJson.version})`);
            console.log(`    Nom: ${packageJson.name}`);
            console.log(`    Scripts: ${Object.keys(packageJson.scripts || {}).length} définis`);
            
            this.checks.dependencies.push({ name: 'package.json', status: 'ok' });
        } catch (error) {
            console.log('  ❌ package.json invalide');
            this.errors.push('package.json invalide ou manquant');
        }

        // Vérifier npm
        try {
            const { execSync } = require('child_process');
            const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
            console.log(`  ✅ npm ${npmVersion}`);
        } catch (error) {
            console.log('  ⚠️ npm non trouvé (optionnel)');
            this.warnings.push('npm non trouvé - installation manuelle des dépendances requise');
        }

        // Vérifier Python (optionnel)
        try {
            const { execSync } = require('child_process');
            const pythonVersion = execSync('python3 --version', { encoding: 'utf8' }).trim();
            console.log(`  ✅ ${pythonVersion} (pour EasyOCR)`);
        } catch (error) {
            console.log('  ⚠️ Python3 non trouvé (EasyOCR aura besoin de Python)');
            this.warnings.push('Python3 non installé - EasyOCR ne pourra pas être testé');
        }

        console.log('');
    }

    async checkConfiguration() {
        console.log('⚙️ Vérification de la configuration...');
        
        // Vérifier alert-config.json
        try {
            const alertConfigPath = path.join(this.baseDir, 'alerts', 'alert-config.json');
            const alertConfig = JSON.parse(fs.readFileSync(alertConfigPath, 'utf8'));
            
            const hasThresholds = alertConfig.global && alertConfig.services;
            if (hasThresholds) {
                console.log('  ✅ alert-config.json - Configuration valide');
                console.log(`    Seuls globaux: ${Object.keys(alertConfig.global).length}`);
                console.log(`    Services: ${Object.keys(alertConfig.services).length}`);
                this.checks.configuration.push({ name: 'alert-config', status: 'ok' });
            } else {
                console.log('  ❌ alert-config.json - Configuration incomplète');
                this.errors.push('Configuration alert-config.json incomplète');
            }
        } catch (error) {
            console.log('  ❌ alert-config.json invalide');
            this.errors.push('alert-config.json invalide');
        }

        // Vérifier config/
        const configDir = path.join(this.baseDir, 'configs');
        if (fs.existsSync(configDir)) {
            const configFiles = fs.readdirSync(configDir);
            if (configFiles.length > 0) {
                console.log(`  ✅ Dossier configs/ (${configFiles.length} fichiers)`);
                this.checks.configuration.push({ name: 'configs-dir', status: 'ok' });
            } else {
                console.log('  ⚠️ Dossier configs/ vide');
                this.warnings.push('Dossier configs/ vide - pas de configuration personnalisée');
            }
        } else {
            console.log('  ⚠️ Dossier configs/ absent');
            this.warnings.push('Dossier configs/ absent - sera créé automatiquement');
        }

        // Vérifier .env.example
        const envExamplePath = path.join(this.baseDir, '.env.example');
        if (fs.existsSync(envExamplePath)) {
            console.log('  ✅ .env.example présent');
            this.checks.configuration.push({ name: 'env-example', status: 'ok' });
        } else {
            console.log('  ⚠️ .env.example absent');
            this.warnings.push('.env.example absent -模板 des variables d\'environnement');
        }

        console.log('');
    }

    async checkPermissions() {
        console.log('🔐 Vérification des permissions...');
        
        // Vérifier les permissions du script de démarrage
        const startScriptPath = path.join(this.baseDir, 'start-ai-metrics.sh');
        if (fs.existsSync(startScriptPath)) {
            try {
                fs.accessSync(startScriptPath, fs.constants.X_OK);
                console.log('  ✅ start-ai-metrics.sh - Exécutable');
                this.checks.permissions.push({ name: 'start-script', status: 'ok' });
            } catch (error) {
                console.log('  ⚠️ start-ai-metrics.sh - Non exécutable');
                this.warnings.push('start-ai-metrics.sh devrait être exécutable (chmod +x)');
            }
        }

        // Vérifier les permissions d'écriture
        const resultsDir = path.join(this.baseDir, 'results');
        try {
            if (!fs.existsSync(resultsDir)) {
                fs.mkdirSync(resultsDir, { recursive: true });
            }
            const testFile = path.join(resultsDir, 'test-write.tmp');
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);
            console.log('  ✅ Dossier results/ - ÉcritureOK');
            this.checks.permissions.push({ name: 'results-dir', status: 'ok' });
        } catch (error) {
            console.log('  ❌ Dossier results/ - Pas d\'écriture');
            this.errors.push('Pas de permissions d\'écriture sur results/');
        }

        console.log('');
    }

    async checkServices() {
        console.log('🔌 Vérification de la connectivité des services...');
        
        const services = [
            { name: 'Ollama', url: 'http://localhost:11434/api/version' },
            { name: 'DocuCortex', url: 'http://localhost:3000/api/health' },
            { name: 'EasyOCR', port: 8000 }
        ];

        for (const service of services) {
            try {
                const axios = require('axios');
                const response = await axios.get(service.url, { timeout: 2000 });
                
                if (response.status < 400) {
                    console.log(`  ✅ ${service.name} - Accessible`);
                    this.checks.services.push({ name: service.name, status: 'online' });
                } else {
                    console.log(`  ⚠️ ${service.name} - Erreur ${response.status}`);
                    this.checks.services.push({ name: service.name, status: 'error', code: response.status });
                }
            } catch (error) {
                console.log(`  ⚠️ ${service.name} - Non accessible (mode mock disponible)`);
                this.checks.services.push({ name: service.name, status: 'offline' });
                this.warnings.push(`${service.name} non accessible - tests en mode mock`);
            }
        }

        console.log('');
    }

    async runQuickTests() {
        console.log('🧪 Tests rapides de validation...');
        
        // Test d'importation des modules
        const modulesToTest = [
            './ai-metrics-orchestrator.js',
            './scripts/ollama-load-test.js',
            './scripts/easyocr-load-test.js',
            './shared/performance-monitor.js',
            './alerts/alert-thresholds.js'
        ];

        for (const modulePath of modulesToTest) {
            try {
                require(path.join(this.baseDir, modulePath));
                console.log(`  ✅ Import ${path.basename(modulePath)}`);
            } catch (error) {
                console.log(`  ❌ Import ${path.basename(modulePath)} - ${error.message}`);
                this.errors.push(`Erreur import ${modulePath}: ${error.message}`);
            }
        }

        // Test de configuration des alertes
        try {
            const AlertThresholds = require('./alerts/alert-thresholds');
            const alertSystem = new AlertThresholds();
            
            const testResult = alertSystem.checkThreshold('responseTime', 3000);
            console.log('  ✅ Système d\'alertes - Test de seuil');
        } catch (error) {
            console.log(`  ❌ Système d'alertes - ${error.message}`);
            this.errors.push(`Erreur système d'alertes: ${error.message}`);
        }

        console.log('');
    }

    generateReport() {
        console.log('📋 === RAPPORT DE VALIDATION ===\n');
        
        const summary = {
            totalChecks: this.checks.files.length + this.checks.dependencies.length + 
                         this.checks.configuration.length + this.checks.permissions.length + 
                         this.checks.services.length,
            errors: this.errors.length,
            warnings: this.warnings.length,
            status: 'unknown'
        };

        if (this.errors.length === 0) {
            if (this.warnings.length <= 3) {
                summary.status = 'excellent';
            } else {
                summary.status = 'good';
            }
        } else if (this.errors.length <= 2) {
            summary.status = 'warning';
        } else {
            summary.status = 'critical';
        }

        // Statut global
        const statusEmojis = {
            excellent: '🎉',
            good: '✅',
            warning: '⚠️',
            critical: '❌'
        };

        console.log(`${statusEmojis[summary.status]} STATUT GLOBAL: ${summary.status.toUpperCase()}`);
        console.log(`  • Contrôles total: ${summary.totalChecks}`);
        console.log(`  • Erreurs: ${summary.errors}`);
        console.log(`  • Avertissements: ${summary.warnings}`);
        console.log(`  • Score: ${Math.max(0, 100 - (summary.errors * 10) - (summary.warnings * 3))}/100\n`);

        // Détail des erreurs
        if (this.errors.length > 0) {
            console.log('❌ ERREURS CRITIQUES:');
            this.errors.forEach((error, i) => {
                console.log(`  ${i + 1}. ${error}`);
            });
            console.log('');
        }

        // Détail des avertissements
        if (this.warnings.length > 0) {
            console.log('⚠️ AVERTISSEMENTS:');
            this.warnings.forEach((warning, i) => {
                console.log(`  ${i + 1}. ${warning}`);
            });
            console.log('');
        }

        // Recommandations
        console.log('💡 RECOMMANDATIONS:');
        
        if (this.errors.length === 0) {
            console.log('  • Le système est prêt à l\'emploi');
            console.log('  • Exécutez ./start-ai-metrics.sh pour commencer');
            console.log('  • Consultez README.md pour la documentation complète');
        } else {
            console.log('  • Corrigez les erreurs avant d\'utiliser le système');
            console.log('  • Vérifiez les prérequis (Node.js >= 14.x)');
            console.log('  • Exécutez npm install pour les dépendances');
        }

        if (this.warnings.length > 3) {
            console.log('  • Considérez résoudre les avertissements pour une expérience optimale');
        }

        console.log('');

        // Instructions suivantes
        console.log('🚀 PROCHAINES ÉTAPES:');
        if (summary.status === 'excellent' || summary.status === 'good') {
            console.log('  1. Exécutez node demo-ai-metrics.js pour voir une démo');
            console.log('  2. Lancez ./start-ai-metrics.sh pour le mode interactif');
            console.log('  3. Testez node ai-metrics-orchestrator.js --help');
        } else {
            console.log('  1. Corrigez les erreurs listées ci-dessus');
            console.log('  2. Relancez ce script de validation');
            console.log('  3. Consultez README.md section dépannage');
        }

        console.log('');
        
        // Code de sortie
        const exitCode = summary.status === 'excellent' || summary.status === 'good' ? 0 : 1;
        process.exit(exitCode);
    }

    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Lancement de la validation
if (require.main === module) {
    const validator = new AIVMetricsValidator();
    validator.validate()
        .catch(error => {
            console.error('💥 Erreur lors de la validation:', error);
            process.exit(1);
        });
}

module.exports = AIVMetricsValidator;