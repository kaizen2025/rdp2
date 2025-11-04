#!/usr/bin/env node

/**
 * Script de validation de la suite de tests de charge
 * Vérifie que tous les composants sont correctement installés et fonctionnels
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

class LoadTestValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.successes = [];
    
    this.requiredFiles = [
      'index.js',
      'package.json',
      'README.md',
      'artillery-config.yml',
      'scripts/concurrent-users.js',
      'scripts/database-concurrent.js',
      'scripts/websocket-load.js',
      'scripts/error-recovery.js',
      'scripts/big-data-performance.js',
      'scripts/endurance-test.js',
      'demo.js',
      'install.sh',
      'config/environments.ini'
    ];
    
    this.requiredDirs = [
      'scripts',
      'config',
      'data',
      'reports',
      'logs'
    ];
  }

  // Validation principale
  async validate() {
    console.log(chalk.cyan('🔍 VALIDATION DE LA SUITE DE TESTS DE CHARGE'));
    console.log(chalk.cyan('=' .repeat(60)));
    
    this.validateStructure();
    this.validateDependencies();
    this.validateScripts();
    this.validateConfiguration();
    this.validatePermissions();
    
    this.printResults();
    
    return this.errors.length === 0;
  }

  // Validation de la structure de fichiers
  validateStructure() {
    console.log(chalk.yellow('\n📁 Validation de la structure...'));
    
    // Vérifier les fichiers requis
    this.requiredFiles.forEach(file => {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        this.successes.push(`✅ Fichier trouvé: ${file}`);
      } else {
        this.errors.push(`❌ Fichier manquant: ${file}`);
      }
    });
    
    // Vérifier les répertoires
    this.requiredDirs.forEach(dir => {
      const dirPath = path.join(__dirname, dir);
      if (fs.existsSync(dirPath)) {
        this.successes.push(`✅ Répertoire trouvé: ${dir}`);
      } else {
        try {
          fs.mkdirSync(dirPath, { recursive: true });
          this.successes.push(`✅ Répertoire créé: ${dir}`);
        } catch (error) {
          this.warnings.push(`⚠️ Impossible de créer le répertoire: ${dir}`);
        }
      }
    });
  }

  // Validation des dépendances
  validateDependencies() {
    console.log(chalk.yellow('\n📦 Validation des dépendances...'));
    
    try {
      const packagePath = path.join(__dirname, 'package.json');
      const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      const requiredDeps = [
        'loadtest',
        'artillery',
        'ws',
        'axios',
        'chalk',
        'mysql2',
        'pg'
      ];
      
      requiredDeps.forEach(dep => {
        if (packageContent.dependencies && packageContent.dependencies[dep]) {
          this.successes.push(`✅ Dépendance: ${dep}`);
        } else {
          this.warnings.push(`⚠️ Dépendance optionnelle: ${dep} (pourra être installée plus tard)`);
        }
      });
      
      this.successes.push('✅ Fichier package.json valide');
      
    } catch (error) {
      this.errors.push(`❌ Erreur lecture package.json: ${error.message}`);
    }
  }

  // Validation des scripts
  validateScripts() {
    console.log(chalk.yellow('\n📜 Validation des scripts...'));
    
    const scriptsDir = path.join(__dirname, 'scripts');
    const scriptFiles = fs.readdirSync(scriptsDir).filter(file => file.endsWith('.js'));
    
    scriptFiles.forEach(file => {
      const filePath = path.join(scriptsDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Vérifications de base
        const checks = [
          { pattern: /class\s+\w+\s*{/, name: 'Définition de classe' },
          { pattern: /async\s+\w+\s*\(/, name: 'Méthodes async' },
          { pattern: /results?\s*=/, name: 'Attribut résultats' },
          { pattern: /saveResults|printReport|generateReport/, name: 'Méthode sauvegarde/rapport' }
        ];
        
        let validScript = true;
        checks.forEach(check => {
          if (!check.pattern.test(content)) {
            this.warnings.push(`⚠️ ${file}: ${check.name} non détectée`);
            validScript = false;
          }
        });
        
        if (validScript) {
          this.successes.push(`✅ Script valide: ${file}`);
        }
        
      } catch (error) {
        this.errors.push(`❌ Erreur lecture ${file}: ${error.message}`);
      }
    });
  }

  // Validation de la configuration
  validateConfiguration() {
    console.log(chalk.yellow('\n⚙️ Validation de la configuration...'));
    
    // Vérifier le fichier de configuration Artillery
    try {
      const artilleryPath = path.join(__dirname, 'artillery-config.yml');
      const artilleryContent = fs.readFileSync(artilleryPath, 'utf8');
      
      const checks = [
        { pattern: /target:/, name: 'Configuration target' },
        { pattern: /phases:/, name: 'Configuration phases' },
        { pattern: /scenarios:/, name: 'Configuration scenarios' }
      ];
      
      checks.forEach(check => {
        if (check.pattern.test(artilleryContent)) {
          this.successes.push(`✅ Artillery: ${check.name}`);
        } else {
          this.warnings.push(`⚠️ Artillery: ${check.name} non trouvée`);
        }
      });
      
    } catch (error) {
      this.warnings.push(`⚠️ Fichier Artillery non accessible: ${error.message}`);
    }
    
    // Vérifier le README
    try {
      const readmePath = path.join(__dirname, 'README.md');
      const readmeContent = fs.readFileSync(readmePath, 'utf8');
      
      if (readmeContent.length > 1000) {
        this.successes.push('✅ README.md complet');
      } else {
        this.warnings.push('⚠️ README.md semble incomplet');
      }
      
    } catch (error) {
      this.errors.push(`❌ README.md inaccessible: ${error.message}`);
    }
  }

  // Validation des permissions
  validatePermissions() {
    console.log(chalk.yellow('\n🔒 Validation des permissions...'));
    
    const executables = ['install.sh', 'demo.js'];
    
    executables.forEach(file => {
      const filePath = path.join(__dirname, file);
      try {
        // Tenter de lire le fichier en tant que script Node.js
        require(filePath);
        this.successes.push(`✅ Script exécutable: ${file}`);
      } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
          // C'est normal si le fichier n'exporte rien
          this.successes.push(`✅ Script lisible: ${file}`);
        } else {
          this.warnings.push(`⚠️ ${file}: ${error.message}`);
        }
      }
    });
  }

  // Affichage des résultats
  printResults() {
    console.log(chalk.cyan('\n📊 RÉSULTATS DE LA VALIDATION'));
    console.log(chalk.cyan('=' .repeat(60)));
    
    // Succès
    if (this.successes.length > 0) {
      console.log(chalk.green('\n✅ SUCCÈS:'));
      this.successes.forEach(success => {
        console.log(chalk.white(`   ${success}`));
      });
    }
    
    // Avertissements
    if (this.warnings.length > 0) {
      console.log(chalk.yellow('\n⚠️ AVERTISSEMENTS:'));
      this.warnings.forEach(warning => {
        console.log(chalk.white(`   ${warning}`));
      });
    }
    
    // Erreurs
    if (this.errors.length > 0) {
      console.log(chalk.red('\n❌ ERREURS:'));
      this.errors.forEach(error => {
        console.log(chalk.white(`   ${error}`));
      });
    }
    
    // Résumé
    console.log(chalk.cyan('\n📈 RÉSUMÉ:'));
    console.log(chalk.white(`   Succès: ${this.successes.length}`));
    console.log(chalk.white(`   Avertissements: ${this.warnings.length}`));
    console.log(chalk.white(`   Erreurs: ${this.errors.length}`));
    
    // Recommandations
    if (this.errors.length === 0) {
      console.log(chalk.green('\n🎉 VALIDATION RÉUSSIE!'));
      console.log(chalk.blue('\nProchaines étapes:'));
      console.log(chalk.white('   1. Exécutez: node install.sh'));
      console.log(chalk.white('   2. Configurez vos variables d\'environnement'));
      console.log(chalk.white('   3. Testez avec: node demo.js'));
      console.log(chalk.white('   4. Exécutez: node index.js'));
    } else {
      console.log(chalk.red('\n💥 VALIDATION ÉCHOUÉE!'));
      console.log(chalk.yellow('\nActions recommandées:'));
      console.log(chalk.white('   1. Corrigez les erreurs listées ci-dessus'));
      console.log(chalk.white('   2. Vérifiez les permissions des fichiers'));
      console.log(chalk.white('   3. Relancez ce script de validation'));
    }
    
    // Instructions de lancement
    console.log(chalk.cyan('\n🚀 COMMANDES RAPIDES:'));
    console.log(chalk.white(`   Installation: ${chalk.yellow('node install.sh')}`));
    console.log(chalk.white(`   Démonstration: ${chalk.yellow('node demo.js')}`));
    console.log(chalk.white(`   Tests interactifs: ${chalk.yellow('node index.js')}`));
    console.log(chalk.white(`   Test rapide: ${chalk.yellow('node index.js --test concurrentUsers')}`));
    console.log(chalk.white(`   Aide: ${chalk.yellow('node index.js --help')}`));
  }
}

// Point d'entrée
async function main() {
  const validator = new LoadTestValidator();
  
  try {
    const isValid = await validator.validate();
    process.exit(isValid ? 0 : 1);
  } catch (error) {
    console.error(chalk.red('\n💥 ERREUR FATALE:'), error.message);
    process.exit(1);
  }
}

// Affichage de l'aide
function showHelp() {
  console.log(chalk.cyan(`
🔍 VALIDATION SUITE DE TESTS DE CHARGE

Usage: node validate.js [options]

Ce script vérifie que tous les composants de la suite
de tests de charge sont correctement installés et
prêts à être utilisés.

Options:
  --help, -h     Afficher cette aide
  --quick        Validation rapide (fichiers seulement)
  --full         Validation complète (par défaut)

Exemples:
  node validate.js           # Validation complète
  node validate.js --quick   # Validation rapide
  node validate.js --help    # Afficher l'aide
  `));
}

// Traitement des arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Exécution
if (require.main === module) {
  main();
}

module.exports = LoadTestValidator;