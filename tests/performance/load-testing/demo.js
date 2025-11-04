#!/usr/bin/env node

/**
 * Script de démonstration des tests de charge
 * Exemple d'utilisation de la suite de tests avec différents scénarios
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const LoadTestOrchestrator = require('./index');

// Scénarios de démonstration prédéfinis
const DEMO_SCENARIOS = {
  // Démo rapide (5 minutes)
  quick: {
    name: 'Démo Rapide',
    description: 'Tests essentiels en 5 minutes',
    duration: '5m',
    tests: ['concurrentUsers', 'databaseConcurrent', 'websocketLoad'],
    options: {
      skipEnvironmentCheck: true,
      enduranceDuration: '1m',
      enduranceLoad: 10
    }
  },
  
  // Démo complète (30 minutes)
  full: {
    name: 'Démo Complète',
    description: 'Suite complète de tests (30 minutes)',
    duration: '30m',
    tests: ['concurrentUsers', 'databaseConcurrent', 'websocketLoad', 'errorRecovery', 'bigDataPerformance', 'artilleryRun'],
    options: {
      skipEnvironmentCheck: true,
      enduranceDuration: '5m',
      enduranceLoad: 20
    }
  },
  
  // Test de performance dédié
  performance: {
    name: 'Test de Performance',
    description: 'Focus sur les performances et la scalabilité',
    duration: '15m',
    tests: ['concurrentUsers', 'databaseConcurrent', 'bigDataPerformance'],
    options: {
      skipEnvironmentCheck: true,
      stressTest: true
    }
  },
  
  // Test de résistance
  endurance: {
    name: 'Test d\'Endurance',
    description: 'Test de résistance prolongée',
    duration: '2h',
    tests: ['enduranceTest', 'errorRecovery'],
    options: {
      skipEnvironmentCheck: true,
      enduranceDuration: '1h',
      enduranceLoad: 50
    }
  }
};

class LoadTestDemo {
  constructor() {
    this.orchestrator = new LoadTestOrchestrator();
    this.currentScenario = null;
    this.results = [];
  }

  // Affichage de l'en-tête de démonstration
  printHeader() {
    console.log(chalk.cyan(`
╔══════════════════════════════════════════════════════════════╗
║                   🧪 DÉMONSTRATION TESTS DE CHARGE            ║
║                        DocuCortex                              ║
╠══════════════════════════════════════════════════════════════╣
║ Ce script présente les capacités de la suite de tests        ║
║ de charge avec des scénarios prédéfinis et des exemples       ║
║ d'utilisation pratiques.                                     ║
╚══════════════════════════════════════════════════════════════╝
    `));
  }

  // Menu de sélection des scénarios
  async showScenarioMenu() {
    console.log(chalk.yellow('\n📋 SCÉNARIOS DE DÉMONSTRATION DISPONIBLES:'));
    console.log(chalk.white('═'.repeat(70)));
    
    Object.entries(DEMO_SCENARIOS).forEach(([key, scenario], index) => {
      console.log(chalk.white(`${index + 1}. ${scenario.name}`));
      console.log(chalk.gray(`   ${scenario.description}`));
      console.log(chalk.gray(`   Durée estimée: ${scenario.duration}`));
      console.log(chalk.gray(`   Tests: ${scenario.tests.length} tests`));
      console.log();
    });
    
    console.log(chalk.yellow('0. Quitter'));
    console.log();
    
    const choice = await this.getUserChoice(Object.keys(DEMO_SCENARIOS).length);
    
    if (choice === 0) {
      console.log(chalk.green('👋 Au revoir!'));
      process.exit(0);
    }
    
    const scenarioKeys = Object.keys(DEMO_SCENARIOS);
    const selectedKey = scenarioKeys[choice - 1];
    this.currentScenario = DEMO_SCENARIOS[selectedKey];
    
    console.log(chalk.green(`\n✅ Scénario sélectionné: ${this.currentScenario.name}`));
  }

  async getUserChoice(maxOption) {
    while (true) {
      try {
        process.stdout.write(chalk.cyan('Votre choix (0-' + maxOption + '): '));
        process.stdin.resume();
        const data = await new Promise(resolve => {
          process.stdin.setEncoding('utf8');
          process.stdin.once('data', resolve);
        });
        
        process.stdin.pause();
        const choice = parseInt(data.trim());
        
        if (choice >= 0 && choice <= maxOption) {
          return choice;
        }
      } catch (error) {
        // Ignorer les erreurs et continuer
      }
      
      console.log(chalk.red('❌ Choix invalide. Veuillez saisir un nombre entre 0 et ' + maxOption + '.'));
    }
  }

  // Confirmation du scénario
  async confirmScenario() {
    console.log(chalk.cyan('\n📋 DÉTAILS DU SCÉNARIO SÉLECTIONNÉ:'));
    console.log(chalk.white('═'.repeat(60)));
    console.log(`Nom: ${this.currentScenario.name}`);
    console.log(`Description: ${this.currentScenario.description}`);
    console.log(`Durée estimée: ${this.currentScenario.duration}`);
    console.log(`Tests à exécuter: ${this.currentScenario.tests.length}`);
    
    console.log(chalk.yellow('\nTests inclus:'));
    this.currentScenario.tests.forEach((test, index) => {
      const testName = this.formatTestName(test);
      const duration = this.estimateTestDuration(test);
      console.log(chalk.white(`   ${index + 1}. ${testName} (${duration})`));
    });
    
    console.log(chalk.yellow('\nOptions:'));
    console.log(`   Skip vérification environnement: ${this.currentScenario.options.skipEnvironmentCheck ? 'Oui' : 'Non'}`);
    console.log(`   Tests de stress: ${this.currentScenario.options.stressTest ? 'Inclus' : 'Non'}`);
    
    console.log(chalk.cyan('\n⚠️  ATTENTION: Ce test va générer une charge importante sur le système.'));
    console.log(chalk.cyan('    Assurez-vous que DocuCortex est en cours d\'exécution.'));
    console.log();
    
    const confirm = await this.getYesNo('Confirmer l\'exécution de ce scénario? (y/N): ');
    
    if (!confirm) {
      console.log(chalk.yellow('❌ Exécution annulée.'));
      return false;
    }
    
    return true;
  }

  async getYesNo(question) {
    while (true) {
      try {
        process.stdout.write(question);
        process.stdin.resume();
        const data = await new Promise(resolve => {
          process.stdin.setEncoding('utf8');
          process.stdin.once('data', resolve);
        });
        
        process.stdin.pause();
        const answer = data.trim().toLowerCase();
        
        if (answer === 'y' || answer === 'yes') return true;
        if (answer === 'n' || answer === 'no' || answer === '') return false;
      } catch (error) {
        // Ignorer les erreurs
      }
      
      console.log(chalk.red('❌ Veuillez répondre par y (oui) ou n (non).'));
    }
  }

  // Exécution du scénario
  async runScenario() {
    console.log(chalk.green(`\n🚀 Démarrage du scénario: ${this.currentScenario.name}`));
    console.log(chalk.green(`⏱️  Heure de début: ${new Date().toLocaleString()}`));
    
    const startTime = Date.now();
    
    try {
      // Configurer l'orchestrateur avec les options du scénario
      const options = {
        ...this.currentScenario.options,
        tests: this.currentScenario.tests
      };
      
      // Exécuter les tests
      await this.orchestrator.runAllTests(options);
      
      const duration = Date.now() - startTime;
      this.results.push({
        scenario: this.currentScenario.name,
        duration: duration,
        success: true,
        timestamp: new Date().toISOString()
      });
      
      console.log(chalk.green(`\n✅ Scénario terminé en ${this.formatTime(duration)}`));
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        scenario: this.currentScenario.name,
        duration: duration,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      console.error(chalk.red(`\n❌ Scénario échoué: ${error.message}`));
    }
  }

  // Affichage des résultats de démonstration
  printDemoResults() {
    console.log(chalk.cyan('\n📊 RÉSUMÉ DE LA DÉMONSTRATION'));
    console.log(chalk.white('═'.repeat(50)));
    
    if (this.results.length === 0) {
      console.log(chalk.yellow('Aucun scénario exécuté.'));
      return;
    }
    
    let totalSuccess = 0;
    let totalDuration = 0;
    
    this.results.forEach(result => {
      const status = result.success ? chalk.green('✅') : chalk.red('❌');
      console.log(`${status} ${result.scenario}`);
      console.log(chalk.gray(`   Durée: ${this.formatTime(result.duration)}`));
      if (!result.success && result.error) {
        console.log(chalk.red(`   Erreur: ${result.error}`));
      }
      
      if (result.success) totalSuccess++;
      totalDuration += result.duration;
    });
    
    console.log(chalk.cyan('\n📈 STATISTIQUES GLOBALES'));
    console.log(chalk.white('═'.repeat(30)));
    console.log(`Scénarios exécutés: ${this.results.length}`);
    console.log(`Scénarios réussis: ${totalSuccess}`);
    console.log(`Taux de réussite: ${((totalSuccess / this.results.length) * 100).toFixed(1)}%`);
    console.log(`Durée totale: ${this.formatTime(totalDuration)}`);
    
    // Conseils post-test
    console.log(chalk.cyan('\n💡 PROCHAINES ÉTAPES RECOMMANDÉES:'));
    
    if (this.results.length > 0) {
      const hasFailures = this.results.some(r => !r.success);
      
      if (hasFailures) {
        console.log(chalk.yellow('1. Vérifiez les logs dans le répertoire reports/'));
        console.log(chalk.yellow('2. Assurez-vous que DocuCortex fonctionne correctement'));
        console.log(chalk.yellow('3. Ajustez la configuration selon les résultats'));
      } else {
        console.log(chalk.green('1. Consultez les rapports détaillés dans reports/'));
        console.log(chalk.green('2. Analysez les métriques de performance'));
        console.log(chalk.green('3. Configurez une surveillance continue'));
      }
    }
    
    console.log(chalk.blue('4. Explorez les autres scénarios disponibles'));
    console.log(chalk.blue('5. Intégrez ces tests dans votre pipeline CI/CD'));
  }

  // Formatage des noms de tests
  formatTestName(testName) {
    const names = {
      concurrentUsers: 'Utilisateurs Concurrents',
      databaseConcurrent: 'Base de Données Concurrente',
      websocketLoad: 'Charge WebSocket',
      errorRecovery: 'Récupération après Erreurs',
      bigDataPerformance: 'Performance Données Volumineuses',
      enduranceTest: 'Test d\'Endurance',
      artilleryRun: 'Test Artillery'
    };
    return names[testName] || testName;
  }

  // Estimation de la durée des tests
  estimateTestDuration(testName) {
    const durations = {
      concurrentUsers: '5 min',
      databaseConcurrent: '8 min',
      websocketLoad: '10 min',
      errorRecovery: '15 min',
      bigDataPerformance: '12 min',
      enduranceTest: 'Variable',
      artilleryRun: '6 min'
    };
    return durations[testName] || '5 min';
  }

  // Formatage du temps
  formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Boucle principale de démonstration
  async runDemo() {
    this.printHeader();
    
    let continueDemo = true;
    
    while (continueDemo) {
      try {
        await this.showScenarioMenu();
        
        const confirmed = await this.confirmScenario();
        if (!confirmed) {
          console.log(chalk.yellow('\nRetour au menu principal...\n'));
          continue;
        }
        
        await this.runScenario();
        
        // Proposer de relancer un autre scénario
        console.log();
        continueDemo = await this.getYesNo('Voulez-vous exécuter un autre scénario? (y/N): ');
        
        if (continueDemo) {
          console.log(chalk.blue('\n' + '='.repeat(70) + '\n'));
        }
        
      } catch (error) {
        console.error(chalk.red('\n❌ Erreur lors de la démonstration:'), error.message);
        continueDemo = false;
      }
    }
    
    this.printDemoResults();
    
    console.log(chalk.cyan('\n🎓 Merci d\'avoir utilisé la démonstration!'));
    console.log(chalk.blue('Pour plus d\'informations, consultez README.md'));
  }
}

// Fonction principale
async function main() {
  const args = process.argv.slice(2);
  
  // Mode direct (sans menu)
  if (args.length > 0) {
    const scenarioKey = args[0];
    
    if (DEMO_SCENARIOS[scenarioKey]) {
      const demo = new LoadTestDemo();
      demo.currentScenario = DEMO_SCENARIOS[scenarioKey];
      
      console.log(chalk.green(`🚀 Exécution directe du scénario: ${demo.currentScenario.name}`));
      await demo.runScenario();
      
    } else if (scenarioKey === '--help' || scenarioKey === '-h') {
      showHelp();
    } else {
      console.error(chalk.red(`❌ Scénario inconnu: ${scenarioKey}`));
      console.log(chalk.yellow('Utilisez --help pour voir les scénarios disponibles.'));
    }
    
    return;
  }
  
  // Mode interactif (avec menu)
  const demo = new LoadTestDemo();
  await demo.runDemo();
}

// Affichage de l'aide
function showHelp() {
  console.log(chalk.cyan(`
🧪 DÉMONSTRATION TESTS DE CHARGE - AIDE

Usage: node demo.js [scénario]

Scénarios disponibles:
  quick      - Démo rapide (5 minutes)
  full       - Démo complète (30 minutes) 
  performance - Test de performance (15 minutes)
  endurance  - Test d\'endurance (2 heures)

Exemples:
  node demo.js                    # Menu interactif
  node demo.js quick              # Exécution directe du scénario "quick"
  node demo.js performance        # Test de performance direct
  node demo.js --help             # Cette aide

La démonstration vous guide à travers différents scénarios
de tests de charge avec des explications détaillées.
  `));
}

// Point d'entrée
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red.bold('\n💥 ERREUR FATALE:'), error.message);
    process.exit(1);
  });
}

module.exports = LoadTestDemo;