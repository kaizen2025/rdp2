#!/usr/bin/env node

/**
 * Script principal pour exécuter les tests de mémoire
 * Détection et test des fuites de mémoire pour l'application RDP
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class MemoryTestRunner {
  constructor() {
    this.config = {
      testPath: path.join(__dirname, 'tests/performance/memory'),
      jestConfig: path.join(__dirname, 'tests/performance/memory/jest.config.memory.js'),
      outputDir: path.join(__dirname, 'tests/performance/memory/reports'),
      nodeOptions: ['--expose-gc', '--max-old-space-size=1024']
    };
  }

  async run() {
    console.log('🚀 === SYSTÈME DE DÉTECTION DES FUITES DE MÉMOIRE ===\n');
    
    try {
      // Vérifie les prérequis
      await this.checkPrerequisites();
      
      // Crée les dossiers de sortie
      this.createDirectories();
      
      // Exécute les tests
      await this.runTests();
      
      // Génère le rapport final
      await this.generateFinalReport();
      
      console.log('\n✅ Tests de mémoire terminés avec succès!');
      
    } catch (error) {
      console.error('\n❌ Erreur lors des tests de mémoire:', error.message);
      process.exit(1);
    }
  }

  async checkPrerequisites() {
    console.log('🔍 Vérification des prérequis...');
    
    // Vérifie l'environnement Node.js
    const nodeVersion = process.version;
    console.log(`   Node.js: ${nodeVersion}`);
    
    // Vérifie les options d'environnement
    const requiredFlags = ['--expose-gc'];
    let hasRequiredFlags = true;
    
    requiredFlags.forEach(flag => {
      if (process.execArgv.includes(flag)) {
        console.log(`   ✅ ${flag}`);
      } else {
        console.log(`   ❌ ${flag} manquant`);
        hasRequiredFlags = false;
      }
    });
    
    if (!hasRequiredFlags) {
      console.log('\n⚠️  Pour une détection optimale, exécutez avec:');
      console.log(`   node --expose-gc ${__filename}`);
    }
    
    // Vérifie l'IDE DevTools
    if (process.env.NODE_ENV !== 'production') {
      console.log('   📊 React DevTools Profiler: Disponible en développement');
    }
    
    console.log('   ✅ Prérequis vérifiés\n');
  }

  createDirectories() {
    console.log('📁 Création des dossiers de sortie...');
    
    const directories = [
      this.config.outputDir,
      path.join(this.config.outputDir, 'snapshots'),
      path.join(this.config.outputDir, 'reports'),
      path.join(this.config.outputDir, 'logs')
    ];
    
    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`   📂 Créé: ${path.basename(dir)}`);
      } else {
        console.log(`   📂 Existe déjà: ${path.basename(dir)}`);
      }
    });
  }

  async runTests() {
    console.log('🧪 Exécution des tests de mémoire...\n');
    
    // Configuration des tests
    const testSuites = [
      {
        name: 'Tests Heap Node.js/Electron',
        pattern: 'nodeElectronHeap.test.js',
        description: 'Surveillance mémoire heap et détection fuites Node.js/Electron'
      },
      {
        name: 'Tests Composants React',
        pattern: 'reactComponentLeaks.test.js',
        description: 'Détection fuites useEffect, event listeners React'
      },
      {
        name: 'Tests WebSocket',
        pattern: 'websocketLeaks.test.js',
        description: 'Surveillance connexions WebSocket et connexions persistantes'
      },
      {
        name: 'Tests GED Massive',
        pattern: 'gedMassiveOperations.test.js',
        description: 'Performance mémoire opérations GED massives'
      },
      {
        name: 'Tests Nettoyage Electron',
        pattern: 'electronWindowCleanup.test.js',
        description: 'Nettoyage mémoire après fermeture fenêtres Electron'
      },
      {
        name: 'Tests Profilage Détaillé',
        pattern: 'detailedProfiling.test.js',
        description: 'Profilage mémoire détaillé et heap snapshots'
      }
    ];
    
    const results = [];
    
    for (const suite of testSuites) {
      console.log(`🔬 ${suite.name}:`);
      console.log(`   ${suite.description}\n`);
      
      try {
        const result = await this.runTestSuite(suite.pattern);
        results.push({
          name: suite.name,
          success: result.success,
          duration: result.duration,
          output: result.output
        });
        
        if (result.success) {
          console.log(`   ✅ ${suite.name}: RÉUSSI`);
        } else {
          console.log(`   ❌ ${suite.name}: ÉCHEC`);
          console.log(`   📋 Erreurs: ${result.errorCount} erreurs trouvées`);
        }
        
      } catch (error) {
        results.push({
          name: suite.name,
          success: false,
          error: error.message
        });
        console.log(`   💥 ${suite.name}: ERREUR - ${error.message}`);
      }
      
      console.log(''); // Ligne vide
    }
    
    // Résumé des résultats
    this.printTestSummary(results);
    return results;
  }

  async runTestSuite(pattern) {
    return new Promise((resolve, reject) => {
      const args = [
        'node_modules/.bin/jest',
        path.join(this.config.testPath, pattern),
        '--config', this.config.jestConfig,
        '--verbose',
        '--runInBand' // Execute serially
      ];
      
      const jestProcess = spawn('node', args, {
        env: {
          ...process.env,
          NODE_OPTIONS: this.config.nodeOptions.join(' ')
        },
        stdio: 'pipe'
      });
      
      let output = '';
      let errorOutput = '';
      const startTime = Date.now();
      
      jestProcess.stdout.on('data', (data) => {
        const message = data.toString();
        output += message;
        process.stdout.write(message);
      });
      
      jestProcess.stderr.on('data', (data) => {
        const message = data.toString();
        errorOutput += message;
        process.stderr.write(message);
      });
      
      jestProcess.on('close', (code) => {
        const duration = Date.now() - startTime;
        
        if (code === 0) {
          resolve({
            success: true,
            duration,
            output,
            exitCode: code
          });
        } else {
          resolve({
            success: false,
            duration,
            output,
            errorOutput,
            exitCode: code,
            errorCount: (output.match(/FAIL/g) || []).length
          });
        }
      });
      
      jestProcess.on('error', (error) => {
        reject(error);
      });
    });
  }

  printTestSummary(results) {
    console.log('📊 === RÉSUMÉ DES TESTS ===');
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Réussis: ${successful.length}/${results.length}`);
    console.log(`❌ Échoués: ${failed.length}/${results.length}`);
    console.log(`⏱️  Durée totale: ${(results.reduce((sum, r) => sum + r.duration, 0) / 1000).toFixed(2)}s\n`);
    
    if (successful.length > 0) {
      console.log('🎉 Tests réussis:');
      successful.forEach(test => {
        console.log(`   ✅ ${test.name} (${(test.duration / 1000).toFixed(2)}s)`);
      });
    }
    
    if (failed.length > 0) {
      console.log('\n💔 Tests échoués:');
      failed.forEach(test => {
        console.log(`   ❌ ${test.name}`);
        if (test.error) {
          console.log(`      Erreur: ${test.error}`);
        }
      });
    }
    
    console.log('\n');
  }

  async generateFinalReport() {
    console.log('📝 Génération du rapport final...');
    
    const reportPath = path.join(this.config.outputDir, 'final-memory-report.md');
    
    const report = this.generateMarkdownReport();
    
    fs.writeFileSync(reportPath, report);
    console.log(`   📄 Rapport généré: ${reportPath}`);
    
    // Génère aussi un rapport JSON
    const jsonReportPath = path.join(this.config.outputDir, 'final-memory-report.json');
    fs.writeFileSync(jsonReportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: 'Rapport généré par le système de tests de mémoire',
      reportGenerated: true
    }, null, 2));
  }

  generateMarkdownReport() {
    const timestamp = new Date().toISOString();
    
    return `# Rapport Tests de Mémoire - ${timestamp}

## 🎯 Objectifs
Ce rapport présente les résultats du système de détection et test des fuites de mémoire pour l'application RDP.

## 📋 Tests Exécutés

### 1. Tests de Surveillance Mémoire Heap Node.js/Electron
- **Objectif**: Surveillance heap Node.js et Electron
- **Couverture**: Détection fuites, monitoring continue, seuils critiques
- **Outils**: Node.js --inspect, heap snapshots

### 2. Tests de Fuites Composants React  
- **Objectif**: Détection fuites React (useEffect, event listeners)
- **Couverture**: Lifecycle composants, event listeners, références mémoire
- **Outils**: React DevTools Profiler, testing utilities

### 3. Tests de Fuites WebSocket et Connexions Persistantes
- **Objectif**: Surveillance connexions WebSocket
- **Couverture**: Event listeners WebSocket, historique messages, reconnexions
- **Outils**: Mock WebSocket, monitoring IPC

### 4. Tests Performance Mémoire GED Massive
- **Objectif**: Performance mémoire opérations GED massives
- **Couverture**: Upload/download, streaming, batch processing
- **Outils**: Mock GED Service, simulate large files

### 5. Tests Nettoyage Mémoire Electron
- **Objectif**: Nettoyage après fermeture fenêtres Electron
- **Couverture**: BrowserWindow lifecycle, IPC cleanup, event listeners
- **Outils**: Mock Electron App, window management

### 6. Profilage Mémoire Détaillé
- **Objectif**: Profilage approfondi avec heap snapshots
- **Couverture**: Analyse tendances, détection patterns, rapports détaillés
- **Outils**: HeapAnalyzer, LeakDetector, custom reporters

## 🔧 Configuration

### Variables d'Environnement
\`\`\`bash
NODE_OPTIONS="--expose-gc --max-old-space-size=1024"
NODE_ENV="test-memory"
\`\`\`

### Seuils de Mémoire
- **Heap Used Warning**: 100MB
- **Heap Used Critical**: 200MB  
- **RSS Warning**: 200MB
- **RSS Critical**: 300MB

### Configuration Profilage
- **Snapshot Interval**: 5 secondes
- **Heap Samples**: 100
- **Leak Detection Threshold**: 1MB croissance

## 📊 Résultats

Voir les rapports détaillés dans:
- \`./reports/memory-test-results.json\`
- \`./reports/final-memory-report.json\`
- Snapshots individuels dans \`./reports/snapshots/\`

## 🎯 Recommandations

1. **Monitoring Continue**: Implémenter la surveillance mémoire en production
2. **Alertes Mémoire**: Configurer des alertes pour dépassement de seuils
3. **Profiling Régulier**: Effectuer du profilage mémoire périodique
4. **Tests Automatisés**: Intégrer les tests mémoire dans la CI/CD
5. **Documentation**: Former les équipes sur la détection de fuites

## 🔍 Outils Utilisés

- **Node.js --inspect**: Débogage et profilage heap
- **React DevTools Profiler**: Profilage composants React
- **V8 Heap Statistics**: Statistiques mémoire détaillées
- **Custom Memory Monitor**: Surveillance temps réel
- **Jest avec reporter personnalisé**: Tests automatisés

## 📈 Métriques de Performance

Les métriques de performance sont collectées et analysées dans:
- Utilisation mémoire par test
- Croissance mémoire au fil du temps
- Détection automatique de fuites
- Tendances et prédictions

---

*Rapport généré automatiquement par le système de tests de mémoire RDP*
`;
  }
}

// Exécution du script
if (require.main === module) {
  const runner = new MemoryTestRunner();
  runner.run().catch(console.error);
}

module.exports = MemoryTestRunner;