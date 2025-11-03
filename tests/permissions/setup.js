#!/usr/bin/env node

/**
 * Script de setup pour les tests de permissions backend
 * Initialise l'environnement de test et valide la configuration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Couleurs pour l'affichage
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkNodeVersion() {
    const version = process.version;
    const majorVersion = parseInt(version.slice(1).split('.')[0]);
    
    if (majorVersion < 16) {
        log('❌ Node.js version 16+ requis', 'red');
        process.exit(1);
    }
    
    log(`✅ Node.js ${version} détecté`, 'green');
}

function createTestDirectories() {
    const directories = [
        './test-data',
        './test-data/backups',
        './logs/test',
        './coverage'
    ];
    
    directories.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            log(`📁 Création du répertoire: ${dir}`, 'cyan');
        }
    });
}

function installTestDependencies() {
    const testPackages = [
        'supertest',
        'jest',
        'jsonwebtoken',
        'bcrypt'
    ];
    
    log('📦 Installation des dépendances de test...', 'cyan');
    
    try {
        testPackages.forEach(pkg => {
            execSync(`npm install --save-dev ${pkg}`, { stdio: 'ignore' });
            log(`  ✅ ${pkg}`, 'green');
        });
    } catch (error) {
        log('❌ Erreur lors de l\'installation des dépendances', 'red');
        process.exit(1);
    }
}

function createTestEnvironmentFile() {
    const envContent = `# Configuration pour les tests de permissions backend
NODE_ENV=test
JWT_SECRET=test-jwt-secret-key-for-rds-viewer-permissions
JWT_EXPIRES_IN=3600
TEST_DB_PATH=./test-data/test.sqlite

# Configuration des tests
DEBUG_PERMISSION_TESTS=false
GENERATE_DETAILED_REPORT=true
AUDIT_LOG_ENABLED=true

# Configuration des limites de test
ADMIN_RATE_LIMIT_TEST=1000
MANAGER_RATE_LIMIT_TEST=500
TECHNICIAN_RATE_LIMIT_TEST=200
VIEWER_RATE_LIMIT_TEST=100
`;
    
    fs.writeFileSync('.env.test', envContent);
    log('📄 Fichier .env.test créé', 'green');
}

function createJestConfiguration() {
    const jestConfig = {
        testEnvironment: 'node',
        roots: ['<rootDir>/tests'],
        testMatch: [
            '**/tests/**/*.test.js',
            '**/tests/**/*.spec.js'
        ],
        collectCoverageFrom: [
            'server/**/*.js',
            'backend/**/*.js',
            '!server/**/*.test.js',
            '!backend/**/*.test.js',
            '!**/node_modules/**'
        ],
        coverageDirectory: 'coverage',
        coverageReporters: ['text', 'lcov', 'html'],
        testTimeout: 30000,
        setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
        verbose: true,
        forceExit: true,
        clearMocks: true,
        resetMocks: true,
        restoreMocks: true
    };
    
    fs.writeFileSync('jest.config.json', JSON.stringify(jestConfig, null, 2));
    log('⚙️ Configuration Jest créée', 'green');
}

function createNpmTestScripts() {
    const packageJsonPath = 'package.json';
    let packageJson = {};
    
    if (fs.existsSync(packageJsonPath)) {
        packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    }
    
    packageJson.scripts = {
        ...packageJson.scripts,
        'test:permissions': 'jest tests/permissions/',
        'test:permissions:watch': 'jest tests/permissions/ --watch',
        'test:permissions:coverage': 'jest tests/permissions/ --coverage',
        'test:security': 'jest tests/permissions/backend-security.test.js',
        'test:auth': 'jest tests/permissions/backend-permissions.test.js',
        'validate:permissions': 'node scripts/validate-permissions-backend.js',
        'test:integration:permissions': 'npm run test:server & npm run test:permissions',
        'setup:tests': 'node tests/permissions/setup.js'
    };
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    log('📜 Scripts NPM mis à jour', 'green');
}

function validateConfiguration() {
    const requiredFiles = [
        'server/middleware/auth-permissions.js',
        'server/middleware/validation.js',
        'backend/services/userService.js',
        'tests/permissions/backend-permissions.test.js',
        'tests/permissions/backend-security.test.js',
        'tests/permissions/test-config.js',
        'scripts/validate-permissions-backend.js'
    ];
    
    let allFilesExist = true;
    
    log('🔍 Vérification de la configuration...', 'cyan');
    
    requiredFiles.forEach(file => {
        if (fs.existsSync(file)) {
            log(`  ✅ ${file}`, 'green');
        } else {
            log(`  ❌ ${file} manquant`, 'red');
            allFilesExist = false;
        }
    });
    
    if (!allFilesExist) {
        log('❌ Configuration incomplète', 'red');
        process.exit(1);
    }
    
    log('✅ Configuration validée', 'green');
}

function runInitialTest() {
    log('🧪 Exécution du test initial...', 'cyan');
    
    try {
        execSync('npm test tests/permissions/backend-permissions.test.js --passWithNoTests', {
            stdio: 'pipe'
        });
        log('✅ Test initial réussi', 'green');
    } catch (error) {
        log('⚠️  Test initial échoué - Veuillez vérifier la configuration', 'yellow');
        log('   Les tests peuvent être exécutés après avoir démarré le serveur', 'yellow');
    }
}

function displaySummary() {
    log('\n🎉 Setup des tests de permissions terminé!', 'bright');
    log('\n📋 Résumé:', 'cyan');
    log('  • Tests d\'authentification: tests/permissions/backend-permissions.test.js', 'reset');
    log('  • Tests de sécurité: tests/permissions/backend-security.test.js', 'reset');
    log('  • Script de validation: scripts/validate-permissions-backend.js', 'reset');
    log('  • Documentation: docs/VALIDATION_PERMISSIONS_BACKEND.md', 'reset');
    
    log('\n🚀 Commandes disponibles:', 'cyan');
    log('  npm run test:permissions          - Tous les tests de permissions', 'reset');
    log('  npm run test:security             - Tests de sécurité uniquement', 'reset');
    log('  npm run test:auth                 - Tests d\'authentification', 'reset');
    log('  npm run validate:permissions      - Validation complète', 'reset');
    log('  npm run test:permissions:watch    - Mode watch', 'reset');
    log('  npm run test:permissions:coverage - Avec couverture', 'reset');
    
    log('\n📊 Pour commencer:', 'cyan');
    log('  1. Démarrez votre serveur RDS Viewer', 'reset');
    log('  2. npm run validate:permissions   - Validation complète', 'reset');
    log('  3. npm run test:permissions       - Exécution des tests', 'reset');
    
    log('\n🔧 Configuration:', 'cyan');
    log('  • Fichier env: .env.test', 'reset');
    log('  • Config Jest: jest.config.json', 'reset');
    log('  • Données test: ./test-data/', 'reset');
}

function main() {
    log('🔐 Setup des tests de permissions backend RDS Viewer', 'bright');
    log('=====================================================\n');
    
    try {
        checkNodeVersion();
        createTestDirectories();
        createTestEnvironmentFile();
        createJestConfiguration();
        createNpmTestScripts();
        validateConfiguration();
        runInitialTest();
        displaySummary();
        
        log('\n✅ Setup terminé avec succès!', 'green');
    } catch (error) {
        log('\n❌ Erreur lors du setup:', 'red');
        log(error.message, 'red');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    checkNodeVersion,
    createTestDirectories,
    installTestDependencies,
    createTestEnvironmentFile,
    createJestConfiguration,
    validateConfiguration
};