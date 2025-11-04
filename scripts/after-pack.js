#!/usr/bin/env node

/**
 * Script After Pack - Electron Builder
 * RDS Viewer Anecoop v3.0.27
 * 
 * Ce script s'exécute APRÈS le packaging de l'application
 * Utilisé pour: ajout de fichiers, modification du package, logging
 */

const fs = require('fs');
const path = require('path');

console.log('📦 [After Pack] Post-traitement du package...');

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

// Context fourni par electron-builder
async function afterPack(context) {
  log('Script after-pack exécuté', 'info');
  
  // Informations du context
  const { appOutDir, packager, electronPlatformName, arch } = context;
  
  log(`Plateforme: ${electronPlatformName}`, 'info');
  log(`Architecture: ${arch}`, 'info');
  log(`Dossier de sortie: ${appOutDir}`, 'info');
  
  // Ajouter des fichiers supplémentaires si nécessaire
  await addExtraFiles(appOutDir);
  
  // Créer un README dans le package
  await createPackageReadme(appOutDir, packager);
  
  // Calculer et logger la taille du package
  await logPackageSize(appOutDir);
  
  // Créer un manifest
  await createManifest(appOutDir, context);
  
  log('After-pack terminé', 'success');
}

// Ajouter des fichiers supplémentaires au package
async function addExtraFiles(appOutDir) {
  log('Ajout de fichiers supplémentaires...', 'info');
  
  try {
    // Exemple: Copier un fichier LICENSE
    const rootPath = path.join(__dirname, '..');
    const licensePath = path.join(rootPath, 'LICENSE.txt');
    
    if (fs.existsSync(licensePath)) {
      const targetPath = path.join(appOutDir, 'LICENSE.txt');
      fs.copyFileSync(licensePath, targetPath);
      log('LICENSE.txt copié', 'success');
    }
    
    // Exemple: Créer un fichier VERSION
    const packagePath = path.join(rootPath, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const versionPath = path.join(appOutDir, 'VERSION.txt');
    
    fs.writeFileSync(versionPath, `${packageJson.name} v${packageJson.version}\n`);
    log('VERSION.txt créé', 'success');
    
  } catch (error) {
    log(`Erreur lors de l'ajout de fichiers: ${error.message}`, 'warning');
  }
}

// Créer un README pour le package
async function createPackageReadme(appOutDir, packager) {
  log('Création du README du package...', 'info');
  
  try {
    const packageJson = packager.appInfo;
    const readmePath = path.join(appOutDir, 'README.txt');
    
    const readmeContent = `
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║  ${packageJson.productName || 'Application'}
║                                                           ║
║  Version: ${packageJson.version || 'Unknown'}
║  Copyright: ${packageJson.copyright || '© 2025'}
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

Bienvenue dans ${packageJson.productName || 'l\'application'}!

INSTALLATION:
-------------
Cette version est déjà packagée et prête à l'emploi.
Lancez l'exécutable principal pour démarrer l'application.

SUPPORT:
--------
Pour toute question ou problème, veuillez contacter:
- Email: support@anecoop.com
- Site web: https://www.anecoop.com

LICENCE:
--------
Ce logiciel est protégé par le droit d'auteur.
Consultez le fichier LICENSE.txt pour plus d'informations.

═══════════════════════════════════════════════════════════

Build Date: ${new Date().toLocaleString('fr-FR')}
Node.js: ${process.version}
Platform: ${process.platform}
Architecture: ${process.arch}

═══════════════════════════════════════════════════════════
`.trim();
    
    fs.writeFileSync(readmePath, readmeContent);
    log('README.txt créé', 'success');
    
  } catch (error) {
    log(`Erreur lors de la création du README: ${error.message}`, 'warning');
  }
}

// Calculer et logger la taille du package
async function logPackageSize(appOutDir) {
  log('Calcul de la taille du package...', 'info');
  
  try {
    const size = getDirectorySize(appOutDir);
    const sizeMB = (size / (1024 * 1024)).toFixed(2);
    
    log(`Taille du package: ${sizeMB} MB`, 'info');
    
    // Sauvegarder dans un fichier
    const sizePath = path.join(appOutDir, 'package-size.txt');
    fs.writeFileSync(sizePath, `${sizeMB} MB\n`);
    
  } catch (error) {
    log(`Erreur lors du calcul de la taille: ${error.message}`, 'warning');
  }
}

// Calculer la taille d'un dossier récursivement
function getDirectorySize(dirPath) {
  let size = 0;
  
  try {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        size += getDirectorySize(filePath);
      } else {
        size += stats.size;
      }
    }
  } catch (error) {
    log(`Erreur lors du calcul de taille: ${error.message}`, 'warning');
  }
  
  return size;
}

// Créer un manifest du package
async function createManifest(appOutDir, context) {
  log('Création du manifest...', 'info');
  
  try {
    const manifest = {
      name: context.packager.appInfo.name,
      productName: context.packager.appInfo.productName,
      version: context.packager.appInfo.version,
      description: context.packager.appInfo.description,
      buildDate: new Date().toISOString(),
      platform: context.electronPlatformName,
      arch: context.arch,
      electronVersion: context.packager.config.electronVersion,
      buildHash: generateBuildHash(),
      files: listTopLevelFiles(appOutDir)
    };
    
    const manifestPath = path.join(appOutDir, 'package-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    log('Manifest créé', 'success');
    
  } catch (error) {
    log(`Erreur lors de la création du manifest: ${error.message}`, 'warning');
  }
}

// Générer un hash de build simple
function generateBuildHash() {
  const crypto = require('crypto');
  const timestamp = Date.now().toString();
  return crypto.createHash('sha256').update(timestamp).digest('hex').substring(0, 16);
}

// Lister les fichiers de premier niveau
function listTopLevelFiles(dirPath) {
  try {
    const files = fs.readdirSync(dirPath);
    return files.map(file => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        type: stats.isDirectory() ? 'directory' : 'file',
        size: stats.isDirectory() ? null : stats.size
      };
    });
  } catch (error) {
    log(`Erreur lors du listage des fichiers: ${error.message}`, 'warning');
    return [];
  }
}

// Export pour electron-builder
exports.default = afterPack;

// Si exécuté directement (test)
if (require.main === module) {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  ELECTRON BUILDER - AFTER PACK SCRIPT');
  console.log('  RDS Viewer Anecoop v3.0.27');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  
  // Context de test
  const testContext = {
    appOutDir: path.join(__dirname, '..', 'dist', 'win-unpacked'),
    electronPlatformName: 'win32',
    arch: 'x64',
    packager: {
      appInfo: {
        name: 'docucortex-ia',
        productName: 'RDS Viewer Anecoop',
        version: '3.0.27',
        description: 'DocuCortex IA - Gestionnaire Intelligent',
        copyright: '© 2025 Anecoop'
      },
      config: {
        electronVersion: '28.2.0'
      }
    }
  };
  
  afterPack(testContext).then(() => {
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
  }).catch(error => {
    log(`Erreur: ${error.message}`, 'error');
    process.exit(1);
  });
}
