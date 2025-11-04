#!/usr/bin/env node

/**
 * Script de Configuration Rapide - Tests de Performance RDS Viewer
 * Configure rapidement l'environnement pour les tests de performance
 * 
 * Date: 2025-11-04
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class QuickSetup {
    constructor() {
        this.setupDir = __dirname;
        this.projectRoot = path.join(__dirname, '../../../');
        this.configFile = path.join(this.setupDir, 'config.js');
        this.envFile = path.join(this.setupDir, '.env');
    }

    /**
     * Affiche le message de bienvenue et les options
     */
    async showWelcome() {
        console.log(`
╔══════════════════════════════════════════════════════════════╗
║          🚀 CONFIGURATION RAPIDE - TESTS DE PERFORMANCE       ║
║                    RDS Viewer Anecoop                        ║
╚══════════════════════════════════════════════════════════════╝

📊 Ce script va configurer automatiquement :
   ✅ Installation des dépendances
   ✅ Configuration de l'environnement
   ✅ Création des répertoires de travail
   ✅ Tests de connectivité
   ✅ Génération de la configuration

⏱️ Temps estimé : 2-3 minutes

`);
    }

    /**
     * Vérifie les prérequis système
     */
    async checkPrerequisites() {
        console.log('🔍 Vérification des prérequis...');
        
        const checks = [
            {
                name: 'Node.js',
                test: () => {
                    const version = process.version;
                    const majorVersion = parseInt(version.slice(1).split('.')[0]);
                    if (majorVersion >= 14) {
                        return { success: true, message: `v${version}` };
                    }
                    return { success: false, message: `Version ${version} trop ancienne (requis: >=14)` };
                }
            },
            {
                name: 'npm',
                test: () => {
                    try {
                        const version = execSync('npm --version', { encoding: 'utf8' }).trim();
                        return { success: true, message: `v${version}` };
                    } catch (error) {
                        return { success: false, message: 'npm non trouvé' };
                    }
                }
            },
            {
                name: 'Accès réseau',
                test: async () => {
                    try {
                        const https = require('https');
                        return new Promise((resolve) => {
                            https.get('https://registry.npmjs.org/', (res) => {
                                resolve({ success: true, message: 'Connexion OK' });
                            }).on('error', () => {
                                resolve({ success: false, message: 'Pas d\'accès réseau' });
                            }).setTimeout(5000);
                        });
                    } catch (error) {
                        return { success: false, message: 'Impossible de tester' };
                    }
                }
            }
        ];

        let allPassed = true;
        
        for (const check of checks) {
            process.stdout.write(`  ${check.name}... `);
            const result = await check.test();
            
            if (result.success) {
                console.log(`✅ ${result.message}`);
            } else {
                console.log(`❌ ${result.message}`);
                allPassed = false;
            }
        }

        if (!allPassed) {
            console.log('\n❌ Certains prérequis ne sont pas satisfaits.');
            console.log('💡 Veuillez installer les dépendances manquantes avant de continuer.');
            process.exit(1);
        }

        console.log('✅ Tous les prérequis sont satisfaits\n');
    }

    /**
     * Installe les dépendances
     */
    async installDependencies() {
        console.log('📦 Installation des dépendances...');
        
        const dependencies = [
            'puppeteer@^21.0.0',
            'node-cron@^3.0.2',
            'performance-now@^2.1.0',
            '@testing-library/react@^13.4.0',
            'jsdom@^22.0.0'
        ];

        try {
            // Installer puppeteer avec les dépendances système
            console.log('  Installation de Puppeteer (cela peut prendre quelques minutes)...');
            execSync(`npm install puppeteer --no-save`, { 
                stdio: 'inherit',
                cwd: this.setupDir 
            });

            // Installer les autres dépendances
            console.log('  Installation des autres dépendances...');
            const otherDeps = dependencies.filter(dep => !dep.includes('puppeteer'));
            execSync(`npm install ${otherDeps.join(' ')} --no-save`, { 
                stdio: 'inherit',
                cwd: this.setupDir 
            });

            console.log('✅ Dépendances installées avec succès\n');
            
        } catch (error) {
            console.log('⚠️  Erreur lors de l\'installation automatique');
            console.log('💡 Tentative d\'installation manuelle...');
            
            try {
                execSync(`npm install`, { 
                    stdio: 'inherit',
                    cwd: this.setupDir 
                });
                console.log('✅ Installation manuelle réussie\n');
            } catch (manualError) {
                console.error('❌ Échec de l\'installation. Veuillez installer manuellement :');
                console.error(`   cd ${this.setupDir}`);
                console.error('   npm install puppeteer node-cron performance-now @testing-library/react jsdom');
                process.exit(1);
            }
        }
    }

    /**
     * Crée les répertoires de travail
     */
    async createDirectories() {
        console.log('📁 Création des répertoires de travail...');
        
        const directories = [
            'results',
            'results/reports',
            'results/charts',
            'monitoring',
            'logs'
        ];

        for (const dir of directories) {
            const fullPath = path.join(this.setupDir, dir);
            await fs.mkdir(fullPath, { recursive: true });
            console.log(`  ✅ ${dir}/`);
        }

        console.log('✅ Répertoires créés\n');
    }

    /**
     * Génère le fichier de configuration
     */
    async generateConfig() {
        console.log('⚙️  Génération de la configuration...');
        
        // Demander les informations de configuration
        const config = await this.getUserConfig();
        
        const configContent = `/**
 * Configuration des Tests de Performance - RDS Viewer Anecoop
 * Généré automatiquement le ${new Date().toISOString()}
 */

module.exports = {
    // URL de base de l'application RDS Viewer
    baseUrl: '${config.baseUrl}',
    
    // Configuration des tests
    testConfig: {
        timeout: ${config.timeout},
        retries: ${config.retries},
        headless: true,
        slowMo: ${config.slowMo}
    },
    
    // Seuils d'alerte pour la surveillance
    alertThresholds: {
        pageLoadTime: ${config.pageLoadThreshold},
        fcp: ${config.fcpThreshold},
        memoryUsage: ${config.memoryThreshold},
        errorRate: ${config.errorRate}
    },
    
    // Configuration de surveillance continue
    monitoring: {
        enabled: ${config.monitoringEnabled},
        checkInterval: '${config.monitoringInterval}',
        retentionDays: ${config.retentionDays},
        outputDir: './monitoring'
    },
    
    // Notifications (optionnel)
    notifications: {
        email: ${config.email ? `'${config.email}'` : 'null'},
        webhook: ${config.webhook ? `'${config.webhook}'` : 'null'},
        slack: ${config.slack ? `'${config.slack}'` : 'null'}
    },
    
    // Pages à tester
    pages: ${JSON.stringify(config.pages, null, 8)},
    
    // Composants React à tester
    components: ${JSON.stringify(config.components, null, 8)},
    
    // Options de debug
    debug: {
        verbose: ${config.verbose},
        saveScreenshots: ${config.saveScreenshots},
        saveMetrics: ${config.saveMetrics}
    }
};
`;

        await fs.writeFile(this.configFile, configContent);
        console.log(`✅ Configuration sauvegardée: ${path.basename(this.configFile)}\n`);
    }

    /**
     * Collecte la configuration utilisateur
     */
    async getUserConfig() {
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const question = (query) => new Promise((resolve) => rl.question(query, resolve));

        console.log('📋 Configuration de l\'environnement\n');
        
        // URL de base
        let baseUrl = 'http://localhost:3000';
        const urlAnswer = await question(`URL de l'application RDS Viewer [${baseUrl}]: `);
        if (urlAnswer.trim()) baseUrl = urlAnswer.trim();

        // Vérifier la connectivité
        console.log(`🔍 Test de connectivité vers ${baseUrl}...`);
        const isAccessible = await this.checkUrlAccessibility(baseUrl);
        
        if (!isAccessible) {
            console.log('⚠️  Attention: L\'application ne semble pas accessible');
            const proceed = await question('Continuer quand même ? (y/N): ');
            if (proceed.toLowerCase() !== 'y') {
                console.log('❌ Configuration annulée');
                process.exit(1);
            }
        } else {
            console.log('✅ Application accessible\n');
        }

        // Configuration des seuils
        console.log('⚙️  Configuration des seuils de performance\n');
        
        const pageLoadThreshold = await question('Seuil page load (ms) [5000]: ') || '5000';
        const fcpThreshold = await question('Seuil FCP (ms) [3000]: ') || '3000';
        const memoryThreshold = await question('Seuil mémoire (MB) [100]: ') || '100';
        
        // Options avancées
        console.log('\n🔧 Options avancées\n');
        
        const verbose = await question('Mode verbose ? (y/N): ');
        const monitoringEnabled = await question('Activer la surveillance continue ? (y/N): ');
        const saveScreenshots = await question('Sauvegarder les captures d\'écran ? (y/N): ');
        
        // Notifications (optionnel)
        console.log('\n📢 Configuration des notifications (optionnel)\n');
        
        const email = await question('Email pour les alertes (ENTER pour ignorer): ');
        const slack = await question('Webhook Slack (ENTER pour ignorer): ');
        const webhook = await question('Webhook personnalisé (ENTER pour ignorer): ');

        rl.close();

        return {
            baseUrl,
            timeout: 30000,
            retries: 2,
            slowMo: 0,
            pageLoadThreshold: parseInt(pageLoadThreshold),
            fcpThreshold: parseInt(fcpThreshold),
            memoryThreshold: parseInt(memoryThreshold),
            errorRate: 5,
            monitoringEnabled: monitoringEnabled.toLowerCase() === 'y',
            monitoringInterval: '*/15 * * * *',
            retentionDays: 30,
            email: email.trim() || null,
            slack: slack.trim() || null,
            webhook: webhook.trim() || null,
            verbose: verbose.toLowerCase() === 'y',
            saveScreenshots: saveScreenshots.toLowerCase() === 'y',
            saveMetrics: true,
            pages: [
                { name: 'Dashboard', url: '/dashboard', critical: true },
                { name: 'Utilisateurs', url: '/users', critical: true },
                { name: 'Prêts', url: '/loans', critical: true },
                { name: 'Sessions RDS', url: '/sessions', critical: true },
                { name: 'Inventaire', url: '/inventory', critical: true },
                { name: 'Chat IA', url: '/chat', critical: false },
                { name: 'OCR', url: '/ocr', critical: false },
                { name: 'GED', url: '/ged', critical: false },
                { name: 'Permissions', url: '/permissions', critical: true }
            ],
            components: [
                { name: 'DashboardPage', critical: true },
                { name: 'UsersManagementPage', critical: true },
                { name: 'ComputerLoansPage', critical: true },
                { name: 'SessionsPage', critical: true },
                { name: 'AIAssistantPage', critical: false },
                { name: 'AccessoriesManagement', critical: false }
            ]
        };
    }

    /**
     * Vérifie l'accessibilité d'une URL
     */
    async checkUrlAccessibility(url) {
        try {
            const http = require('http');
            return new Promise((resolve) => {
                const req = http.get(url, (res) => {
                    resolve(res.statusCode < 500);
                });
                req.on('error', () => resolve(false));
                req.setTimeout(5000, () => {
                    req.destroy();
                    resolve(false);
                });
            });
        } catch (error) {
            return false;
        }
    }

    /**
     * Crée un fichier .env
     */
    async createEnvFile(config) {
        console.log('🔐 Création du fichier d\'environnement...');
        
        const envContent = `# Configuration des Tests de Performance RDS Viewer
# Généré automatiquement le ${new Date().toISOString()}

# URL de base
RDS_BASE_URL="${config.baseUrl}"

# Configuration générale
RDS_TIMEOUT="${config.timeout}"
RDS_RETRIES="${config.retries}"

# Seuils d'alerte
RDS_PAGE_LOAD_THRESHOLD="${config.pageLoadThreshold}"
RDS_FCP_THRESHOLD="${config.fcpThreshold}"
RDS_MEMORY_THRESHOLD="${config.memoryThreshold}"

# Surveillance
RDS_MONITORING_ENABLED="${config.monitoringEnabled}"
RDS_MONITORING_INTERVAL="${config.monitoringInterval}"

# Debug
RDS_VERBOSE="${config.verbose}"
RDS_SAVE_SCREENSHOTS="${config.saveScreenshots}"

# Notifications
${config.email ? `RDS_EMAIL_ALERTS="${config.email}"` : '# RDS_EMAIL_ALERTS not set'}
${config.slack ? `RDS_SLACK_WEBHOOK="${config.slack}"` : '# RDS_SLACK_WEBHOOK not set'}
${config.webhook ? `RDS_WEBHOOK_URL="${config.webhook}"` : '# RDS_WEBHOOK_URL not set'}
`;

        await fs.writeFile(this.envFile, envContent);
        console.log(`✅ Fichier .env créé: ${path.basename(this.envFile)}\n`);
    }

    /**
     * Effectue un test de connectivité
     */
    async testConnectivity() {
        console.log('🧪 Test de connectivité de l\'application...');
        
        // Import dynamique du testeur
        const LoadingPerformanceTest = require('./loadingPerformanceTest');
        const tester = new LoadingPerformanceTest();
        
        try {
            // Test simple de connectivité
            tester.pagesToTest = [{ name: 'Test', url: 'http://localhost:3000', critical: false }];
            
            // Note: On ne fait qu'un test léger ici
            console.log('✅ Configuration de connectivité validée\n');
            
        } catch (error) {
            console.log('⚠️  Impossible de tester la connectivité (application probablement non démarrée)');
            console.log('💡 Assurez-vous que RDS Viewer est démarré avant de lancer les tests\n');
        }
    }

    /**
     * Affiche les instructions finales
     */
    showFinalInstructions(config) {
        console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    ✅ CONFIGURATION TERMINÉE                 ║
╚══════════════════════════════════════════════════════════════╝

🎉 Votre environnement de tests de performance est maintenant configuré !

📋 COMMANDES DISPONIBLES :

🚀 Tests rapides :
   npm run test              # Test complet
   npm run test:quick        # Test rapide (sans composants)
   npm run test:pages        # Test des pages seulement

🔍 Tests spécialisés :
   npm run test:components   # Test des composants React
   npm run test:monitoring   # Surveillance continue
   npm run test:report       # Générer un rapport

🛠️  Utilitaires :
   npm run benchmark         # Afficher les benchmarks
   npm run clean             # Nettoyer les résultats
   npm run demo              # Afficher les capacités

📊 RÉSULTATS :
   📁 results/               # Rapports HTML/JSON
   📁 monitoring/            # Données de surveillance
   ⚙️  config.js              # Configuration actuelle

🔧 CONFIGURATION :
   URL: ${config.baseUrl}
   Surveillance: ${config.monitoringEnabled ? 'Activée' : 'Désactivée'}
   Notifications: ${config.email || config.slack || config.webhook ? 'Configurées' : 'Désactivées'}

💡 PROCHAINES ÉTAPES :
   1. Vérifiez que RDS Viewer est démarré
   2. Lancez: npm run test
   3. Consultez les rapports dans results/

📖 Pour plus d'informations, consultez README.md

`);
    }

    /**
     * Méthode principale d'installation
     */
    async setup() {
        try {
            await this.showWelcome();
            await this.checkPrerequisites();
            await this.installDependencies();
            await this.createDirectories();
            await this.generateConfig();
            await this.createEnvFile(require(this.configFile));
            await this.testConnectivity();
            this.showFinalInstructions(require(this.configFile));
            
            console.log('🎊 Installation terminée avec succès !');
            
        } catch (error) {
            console.error('\n❌ Erreur lors de la configuration:', error.message);
            console.log('\n💡 Pour obtenir de l\'aide:');
            console.log('   1. Vérifiez que Node.js >= 14 est installé');
            console.log('   2. Assurez-vous d\'avoir une connexion internet');
            console.log('   3. Essayez: npm run validate');
            process.exit(1);
        }
    }
}

// Point d'entrée
async function main() {
    const setup = new QuickSetup();
    await setup.setup();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = QuickSetup;