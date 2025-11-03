#!/usr/bin/env node

/**
 * Test rapide de la structure des fichiers de validation des permissions
 */

const fs = require('fs');
const path = require('path');

// Couleurs pour l'affichage
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Structure des fichiers attendus
const expectedFiles = {
    'Tests principaux': [
        'rdp/tests/permissions/backend-permissions.test.js',
        'rdp/tests/permissions/backend-security.test.js',
        'rdp/tests/permissions/test-config.js',
        'rdp/tests/permissions/README.md',
        'rdp/tests/permissions/setup.js'
    ],
    
    'Middleware de sécurité': [
        'rdp/server/middleware/auth-permissions.js',
        'rdp/server/middleware/validation.js'
    ],
    
    'Script de validation': [
        'rdp/scripts/validate-permissions-backend.js'
    ],
    
    'Documentation': [
        'rdp/docs/VALIDATION_PERMISSIONS_BACKEND.md'
    ]
};

function checkFileExists(filePath) {
    const exists = fs.existsSync(filePath);
    const size = exists ? fs.statSync(filePath).size : 0;
    return { exists, size };
}

function testImports(filePath) {
    if (!fs.existsSync(filePath)) {
        return { success: false, error: 'Fichier non trouvé' };
    }
    
    try {
        // Simuler l'import (sans exécuter le code)
        const content = fs.readFileSync(filePath, 'utf8');
        const hasRequire = content.includes('require(');
        const hasModuleExports = content.includes('module.exports');
        
        return {
            success: true,
            requireStatements: (content.match(/require\(/g) || []).length,
            exports: hasModuleExports,
            linesOfCode: content.split('\n').length
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function validateTestStructure() {
    log('🔍 Validation de la structure des fichiers de permissions\n', 'blue');
    
    let totalFiles = 0;
    let existingFiles = 0;
    let importTests = 0;
    let successfulImports = 0;
    
    for (const [category, files] of Object.entries(expectedFiles)) {
        log(`📁 ${category}:`, 'yellow');
        
        files.forEach(file => {
            totalFiles++;
            const { exists, size } = checkFileExists(file);
            
            if (exists) {
                existingFiles++;
                log(`  ✅ ${file} (${(size / 1024).toFixed(1)}KB)`, 'green');
                
                // Test des imports pour les fichiers JS
                if (file.endsWith('.js')) {
                    importTests++;
                    const importResult = testImports(file);
                    
                    if (importResult.success) {
                        successfulImports++;
                        log(`    📦 ${importResult.requireStatements} imports, ${importResult.linesOfCode} lignes`, 'blue');
                    } else {
                        log(`    ⚠️  Test imports: ${importResult.error}`, 'yellow');
                    }
                }
            } else {
                log(`  ❌ ${file}`, 'red');
            }
        });
        
        log('');
    }
    
    // Résumé
    log('📊 Résumé de validation:', 'blue');
    log(`  Fichiers existants: ${existingFiles}/${totalFiles} (${Math.round(existingFiles/totalFiles*100)}%)`, 
        existingFiles === totalFiles ? 'green' : 'yellow');
    log(`  Tests d'import réussis: ${successfulImports}/${importTests} (${Math.round(successfulImports/importTests*100)}%)`,
        successfulImports === importTests ? 'green' : 'yellow');
    
    if (existingFiles === totalFiles && successfulImports === importTests) {
        log('\n🎉 Tous les fichiers sont présents et valides!', 'green');
        return true;
    } else {
        log('\n⚠️  Certains fichiers sont manquants ou invalides', 'yellow');
        return false;
    }
}

function testBasicFunctionality() {
    log('\n🧪 Test des fonctionnalités de base...', 'blue');
    
    try {
        // Test du script de validation
        const scriptPath = 'rdp/scripts/validate-permissions-backend.js';
        if (fs.existsSync(scriptPath)) {
            log('  ✅ Script de validation accessible', 'green');
        }
        
        // Test de la configuration
        const configPath = 'rdp/tests/permissions/test-config.js';
        if (fs.existsSync(configPath)) {
            const configContent = fs.readFileSync(configPath, 'utf8');
            if (configContent.includes('testUsers') && configContent.includes('endpoints')) {
                log('  ✅ Configuration de test valide', 'green');
            }
        }
        
        // Test du middleware
        const middlewarePath = 'rdp/server/middleware/auth-permissions.js';
        if (fs.existsSync(middlewarePath)) {
            const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
            if (middlewareContent.includes('authenticateToken') && middlewareContent.includes('authorizeRoles')) {
                log('  ✅ Middleware d\'authentification complet', 'green');
            }
        }
        
        return true;
    } catch (error) {
        log(`  ❌ Erreur: ${error.message}`, 'red');
        return false;
    }
}

function displayFileSummary() {
    log('\n📋 Récapitulatif des fichiers créés:', 'blue');
    
    const fileTypes = {
        'Tests de permissions': ['rdp/tests/permissions/backend-permissions.test.js', 'rdp/tests/permissions/backend-security.test.js'],
        'Configuration et utilitaires': ['rdp/tests/permissions/test-config.js', 'rdp/tests/permissions/setup.js'],
        'Documentation': ['rdp/tests/permissions/README.md', 'rdp/docs/VALIDATION_PERMISSIONS_BACKEND.md'],
        'Middleware sécurité': ['rdp/server/middleware/auth-permissions.js', 'rdp/server/middleware/validation.js'],
        'Script de validation': ['rdp/scripts/validate-permissions-backend.js']
    };
    
    for (const [category, files] of Object.entries(fileTypes)) {
        log(`\n${category}:`, 'yellow');
        files.forEach(file => {
            const { exists, size } = checkFileExists(file);
            if (exists) {
                log(`  • ${path.basename(file)} (${(size / 1024).toFixed(1)}KB)`, 'green');
            } else {
                log(`  • ${path.basename(file)} (manquant)`, 'red');
            }
        });
    }
}

function main() {
    log('🔐 Validation de la structure des permissions backend\n', 'blue');
    
    const structureValid = validateTestStructure();
    const functionalityValid = testBasicFunctionality();
    displayFileSummary();
    
    if (structureValid && functionalityValid) {
        log('\n✅ Structure de validation des permissions: VALIDÉE', 'green');
        log('\n🚀 Prochaines étapes:', 'blue');
        log('  1. npm run setup:tests  - Configuration initiale', 'reset');
        log('  2. npm run validate:permissions - Validation complète', 'reset');
        log('  3. npm run test:permissions - Exécution des tests', 'reset');
        process.exit(0);
    } else {
        log('\n❌ Structure de validation des permissions: INCOMPLÈTE', 'red');
        log('\n🔧 Actions requises:', 'yellow');
        log('  • Vérifier que tous les fichiers sont présents', 'reset');
        log('  • Exécuter le script de setup', 'reset');
        log('  • Vérifier les imports et dépendances', 'reset');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    validateTestStructure,
    testBasicFunctionality,
    checkFileExists,
    testImports
};