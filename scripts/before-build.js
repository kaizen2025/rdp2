#!/usr/bin/env node

/**
 * Script Before Build - Electron Builder
 * RDS Viewer Anecoop v3.0.27
 * 
 * Ce script s'exécute AVANT le processus de build Electron Builder
 * Utilisé pour: vérifications, nettoyage, préparation
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 [Before Build] Préparation du build...');

// Fonction utilitaire pour logger
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  }[type];
  console.log(`${prefix} [${timestamp}] ${message}`);
}

// 1. Vérifier que le build React existe
function checkReactBuild() {
  log('Vérification du build React...');
  const buildPath = path.join(__dirname, '..', 'build');
  
  if (!fs.existsSync(buildPath)) {
    log('Le dossier build/ n\'existe pas. Veuillez exécuter "npm run build" d\'abord.', 'error');
    process.exit(1);
  }
  
  const indexPath = path.join(buildPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    log('index.html n\'existe pas dans build/. Build React incomplet.', 'error');
    process.exit(1);
  }
  
  log('Build React OK', 'success');
}

// 2. Vérifier les icônes
function checkIcons() {
  log('Vérification des icônes...');
  const buildResourcesPath = path.join(__dirname, '..', 'build');
  const iconPath = path.join(buildResourcesPath, 'icon.ico');
  
  if (!fs.existsSync(iconPath)) {
    log('icon.ico manquant dans build/. Icône par défaut sera utilisée.', 'warning');
  } else {
    log('icon.ico trouvé', 'success');
  }
}

// 3. Vérifier package.json
function checkPackageJson() {
  log('Vérification de package.json...');
  const packagePath = path.join(__dirname, '..', 'package.json');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Vérifier les champs requis
    if (!packageJson.name) {
      log('package.json: "name" manquant', 'error');
      process.exit(1);
    }
    
    if (!packageJson.version) {
      log('package.json: "version" manquant', 'error');
      process.exit(1);
    }
    
    log(`Application: ${packageJson.name} v${packageJson.version}`, 'info');
    log('package.json OK', 'success');
    
  } catch (error) {
    log(`Erreur lors de la lecture de package.json: ${error.message}`, 'error');
    process.exit(1);
  }
}

// 4. Nettoyer l'ancien build Electron
function cleanOldBuild() {
  log('Nettoyage de l\'ancien build Electron...');
  const distPath = path.join(__dirname, '..', 'dist');
  
  if (fs.existsSync(distPath)) {
    try {
      // Ne pas supprimer tout dist/, juste les fichiers temporaires
      const filesToClean = [
        'builder-debug.yml',
        'builder-effective-config.yaml'
      ];
      
      filesToClean.forEach(file => {
        const filePath = path.join(distPath, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          log(`Supprimé: ${file}`, 'info');
        }
      });
      
      log('Nettoyage terminé', 'success');
    } catch (error) {
      log(`Erreur lors du nettoyage: ${error.message}`, 'warning');
      // Ne pas arrêter le build pour une erreur de nettoyage
    }
  }
}

// 5. Créer un fichier de build info
function createBuildInfo() {
  log('Création du fichier build-info.json...');
  
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const buildInfo = {
    version: packageJson.version,
    name: packageJson.name,
    buildDate: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch
  };
  
  const buildPath = path.join(__dirname, '..', 'build');
  const buildInfoPath = path.join(buildPath, 'build-info.json');
  
  try {
    fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));
    log('build-info.json créé', 'success');
  } catch (error) {
    log(`Erreur lors de la création de build-info.json: ${error.message}`, 'warning');
  }
}

// 6. Vérifier l'espace disque
function checkDiskSpace() {
  log('Vérification de l\'espace disque...');
  
  // Sur Windows, cette vérification est plus complexe
  // Pour l'instant, on log juste un avertissement
  log('Assurez-vous d\'avoir au moins 5 GB d\'espace disque libre', 'info');
}

// Exécution principale
async function main() {
  try {
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('  ELECTRON BUILDER - BEFORE BUILD SCRIPT');
    console.log('  RDS Viewer Anecoop v3.0.27');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    
    checkPackageJson();
    checkReactBuild();
    checkIcons();
    checkDiskSpace();
    cleanOldBuild();
    createBuildInfo();
    
    console.log('');
    log('Préparation terminée avec succès!', 'success');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    
    process.exit(0);
    
  } catch (error) {
    console.log('');
    log(`Erreur fatale: ${error.message}`, 'error');
    console.log(error.stack);
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    process.exit(1);
  }
}

// Lancer le script
main();
