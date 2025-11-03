#!/usr/bin/env node

/**
 * Script de test rapide pour vérifier le système de validation des permissions
 * Exécute tous les tests principaux et génère un rapport de validation
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Simuler colors.bold pour éviter les dépendances
const bold = (text) => `\x1b[1m${text}\x1b[0m`;
const green = (text) => `\x1b[32m${text}\x1b[0m`;
const red = (text) => `\x1b[31m${text}\x1b[0m`;
const yellow = (text) => `\x1b[33m${text}\x1b[0m`;
const cyan = (text) => `\x1b[36m${text}\x1b[0m`;

// Configuration du test rapide
const TEST_CONFIG = {
  projectRoot: path.join(__dirname, '..'),
  testFiles: [
    'tests/permissions/mock-data/permissions-mock-data.js',
    'tests/permissions/granular-permissions.test.js',
    'tests/permissions/permissions-config.test.js'
  ],
  scripts: [
    'scripts/validate-granular-permissions.js'
  ],
  outputPath: path.join(__dirname, 'quick-test-results'),
  timeout: 60000 // 60 secondes
};

// Résultats du test
const TEST_RESULTS = {
  timestamp: new Date().toISOString(),
  tests: [],
  scripts: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  },
  duration: 0,
  status: 'unknown'
};

async function runQuickTest() {
  console.log(bold('🚀 DÉMARRAGE DU TEST RAPIDE DE VALIDATION'));
  console.log('=' .repeat(60));
  console.log(`📅 Date: ${new Date().toLocaleString()}`);
  console.log(`⏱️ Timeout: ${TEST_CONFIG.timeout}ms`);
  console.log('');
  
  const startTime = Date.now();
  
  try {
    // 1. Test des données mock
    await testMockData();
    
    // 2. Test de la configuration
    await testConfiguration();
    
    // 3. Test du script de validation
    await testValidationScript();
    
    // 4. Génération du rapport
    const endTime = Date.now();
    TEST_RESULTS.duration = endTime - startTime;
    
    generateReport();
    
    // Statut final
    if (TEST_RESULTS.summary.failed === 0) {
      TEST_RESULTS.status = 'success';
      console.log('\n🎉 TOUS LES TESTS SONT PASSÉS!'.green.bold);
      console.log('✅ Le système de validation des permissions granulaires fonctionne correctement.');
      process.exit(0);
    } else {
      TEST_RESULTS.status = 'partial';
      console.log('\n⚠️ CERTAINS TESTS ONT ÉCHOUÉ'.yellow.bold);
      console.log(`❌ ${TEST_RESULTS.summary.failed} échecs détectés`);
      process.exit(1);
    }
    
  } catch (error) {
    const endTime = Date.now();
    TEST_RESULTS.duration = endTime - startTime;
    TEST_RESULTS.status = 'error';
    
    console.error('\n💥 ERREUR FATALE:'.red.bold, error.message);
    
    TEST_RESULTS.error = {
      message: error.message,
      stack: error.stack
    };
    
    generateReport();
    process.exit(1);
  }
}

async function testMockData() {
  console.log('🧪 Test des données mock...'.cyan);
  
  const testFile = path.join(TEST_CONFIG.projectRoot, TEST_CONFIG.testFiles[0]);
  
  try {
    // Exécuter le test des données mock
    const result = await executeNodeScript(testFile);
    
    TEST_RESULTS.tests.push({
      name: 'Mock Data Validation',
      file: testFile,
      status: 'passed',
      output: result.output,
      duration: result.duration
    });
    
    TEST_RESULTS.summary.total++;
    TEST_RESULTS.summary.passed++;
    
    console.log('✅ Données mock validées'.green);
    
  } catch (error) {
    TEST_RESULTS.tests.push({
      name: 'Mock Data Validation',
      file: testFile,
      status: 'failed',
      error: error.message,
      duration: error.duration || 0
    });
    
    TEST_RESULTS.summary.total++;
    TEST_RESULTS.summary.failed++;
    
    console.log('❌ Erreur données mock:'.red, error.message);
  }
  
  console.log('');
}

async function testConfiguration() {
  console.log('⚙️ Test de configuration...'.cyan);
  
  const configFile = path.join(TEST_CONFIG.projectRoot, 'config', 'config.json');
  
  try {
    // Vérifier que le fichier config existe
    if (!fs.existsSync(configFile)) {
      throw new Error('Fichier config.json manquant');
    }
    
    // Charger et valider la configuration
    const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    
    if (!config.roles) {
      throw new Error('Section "roles" manquante dans config.json');
    }
    
    const roleCount = Object.keys(config.roles).length;
    const expectedRoles = ['super_admin', 'admin', 'ged_specialist', 'manager', 'technician', 'viewer'];
    
    let missingRoles = 0;
    expectedRoles.forEach(role => {
      if (!config.roles[role]) {
        missingRoles++;
      }
    });
    
    TEST_RESULTS.tests.push({
      name: 'Configuration Structure',
      file: configFile,
      status: missingRoles === 0 ? 'passed' : 'warning',
      details: {
        roleCount,
        expectedRoles: expectedRoles.length,
        missingRoles
      },
      duration: 1
    });
    
    TEST_RESULTS.summary.total++;
    if (missingRoles === 0) {
      TEST_RESULTS.summary.passed++;
      console.log('✅ Configuration valide'.green);
    } else {
      TEST_RESULTS.summary.warnings++;
      console.log('⚠️ Configuration incomplète'.yellow);
    }
    
  } catch (error) {
    TEST_RESULTS.tests.push({
      name: 'Configuration Structure',
      file: configFile,
      status: 'failed',
      error: error.message,
      duration: 0
    });
    
    TEST_RESULTS.summary.total++;
    TEST_RESULTS.summary.failed++;
    
    console.log('❌ Erreur configuration:'.red, error.message);
  }
  
  console.log('');
}

async function testValidationScript() {
  console.log('🔍 Test du script de validation...'.cyan);
  
  const scriptFile = path.join(TEST_CONFIG.projectRoot, TEST_CONFIG.scripts[0]);
  
  try {
    // Exécuter le script de validation avec génération mock
    const result = await executeNodeScript(scriptFile, ['--generate-mock']);
    
    TEST_RESULTS.scripts.push({
      name: 'Permissions Validation Script',
      file: scriptFile,
      status: 'passed',
      output: result.output.substring(0, 500), // Limiter la sortie
      duration: result.duration
    });
    
    // Vérifier que le fichier mock a été généré
    const mockFile = path.join(TEST_CONFIG.projectRoot, 'config', 'permissions-advanced-mock.json');
    if (fs.existsSync(mockFile)) {
      const mockContent = JSON.parse(fs.readFileSync(mockFile, 'utf8'));
      
      TEST_RESULTS.scripts[TEST_RESULTS.scripts.length - 1].mockGenerated = {
        file: mockFile,
        roles: Object.keys(mockContent.roles || {}).length,
        hasMetadata: !!mockContent.metadata
      };
      
      console.log('✅ Script de validation exécuté et mock généré'.green);
    } else {
      throw new Error('Fichier mock non généré');
    }
    
  } catch (error) {
    TEST_RESULTS.scripts.push({
      name: 'Permissions Validation Script',
      file: scriptFile,
      status: 'failed',
      error: error.message,
      duration: error.duration || 0
    });
    
    console.log('❌ Erreur script validation:'.red, error.message);
  }
  
  console.log('');
}

function generateReport() {
  console.log('📊 RAPPORT DE TEST RAPIDE'.bold);
  console.log('=' .repeat(40));
  console.log(`⏱️ Durée totale: ${TEST_RESULTS.duration}ms`);
  console.log(`📈 Résultats:`);
  console.log(`   • Total: ${TEST_RESULTS.summary.total}`);
  console.log(`   • Réussis: ${TEST_RESULTS.summary.passed} ✅`);
  console.log(`   • Échoués: ${TEST_RESULTS.summary.failed} ❌`);
  console.log(`   • Avertissements: ${TEST_RESULTS.summary.warnings} ⚠️`);
  console.log('');
  
  // Résultats des tests
  if (TEST_RESULTS.tests.length > 0) {
    console.log('🧪 RÉSULTATS DES TESTS:'.cyan);
    TEST_RESULTS.tests.forEach(test => {
      const icon = test.status === 'passed' ? '✅' : 
                   test.status === 'warning' ? '⚠️' : '❌';
      console.log(`   ${icon} ${test.name} (${test.duration}ms)`);
      if (test.error) {
        console.log(`      Erreur: ${test.error}`);
      }
    });
    console.log('');
  }
  
  // Résultats des scripts
  if (TEST_RESULTS.scripts.length > 0) {
    console.log('🔧 RÉSULTATS DES SCRIPTS:'.cyan);
    TEST_RESULTS.scripts.forEach(script => {
      const icon = script.status === 'passed' ? '✅' : '❌';
      console.log(`   ${icon} ${script.name} (${script.duration}ms)`);
      if (script.error) {
        console.log(`      Erreur: ${script.error}`);
      }
      if (script.mockGenerated) {
        console.log(`      Mock généré: ${script.mockGenerated.roles} rôles`);
      }
    });
    console.log('');
  }
  
  // Sauvegarder le rapport
  saveReport();
}

function saveReport() {
  try {
    if (!fs.existsSync(TEST_CONFIG.outputPath)) {
      fs.mkdirSync(TEST_CONFIG.outputPath, { recursive: true });
    }
    
    const reportFile = path.join(
      TEST_CONFIG.outputPath,
      `quick-test-${Date.now()}.json`
    );
    
    fs.writeFileSync(reportFile, JSON.stringify(TEST_RESULTS, null, 2));
    console.log(`💾 Rapport sauvegardé: ${reportFile}`.green);
    
  } catch (error) {
    console.warn('⚠️ Impossible de sauvegarder le rapport:'.yellow, error.message);
  }
}

function executeNodeScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error(`Timeout après ${TEST_CONFIG.timeout}ms`));
    }, TEST_CONFIG.timeout);
    
    const child = spawn('node', [scriptPath, ...args], {
      cwd: TEST_CONFIG.projectRoot,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    let errorOutput = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    child.on('close', (code) => {
      clearTimeout(timeout);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (code === 0 || code === 2) { // 2 = avertissements acceptés
        resolve({
          output,
          errorOutput,
          code,
          duration
        });
      } else {
        reject(new Error(`Script terminé avec code ${code}: ${errorOutput || output}`), duration);
      }
    });
    
    child.on('error', (error) => {
      clearTimeout(timeout);
      const endTime = Date.now();
      reject(new Error(`Erreur exécution: ${error.message}`), endTime - startTime);
    });
  });
}

// Point d'entrée
if (require.main === module) {
  // Vérifier que nous sommes dans le bon répertoire
  const requiredFiles = [
    'src/models/permissions.js',
    'config/config.json',
    'scripts/validate-granular-permissions.js'
  ];
  
  const missingFiles = requiredFiles.filter(file => 
    !fs.existsSync(path.join(TEST_CONFIG.projectRoot, file))
  );
  
  if (missingFiles.length > 0) {
    console.error('❌ Fichiers requis manquants:'.red.bold);
    missingFiles.forEach(file => console.error(`   - ${file}`));
    process.exit(1);
  }
  
  // Exécuter le test
  runQuickTest().catch(error => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = {
  runQuickTest,
  TEST_CONFIG,
  TEST_RESULTS
};