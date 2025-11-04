#!/usr/bin/env node

/**
 * Script After Sign - Electron Builder
 * RDS Viewer Anecoop v3.0.27
 * 
 * Ce script s'exécute APRÈS la signature de code (si configurée)
 * Utilisé pour: vérification de signature, logging
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔐 [After Sign] Vérification de la signature...');

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
// Les arguments sont: context (objet avec des infos sur le build)
async function afterSign(context) {
  log('Script after-sign exécuté', 'info');
  
  // Informations du context
  if (context && context.outDir) {
    log(`Répertoire de sortie: ${context.outDir}`, 'info');
  }
  
  if (context && context.appOutDir) {
    log(`Application packagée: ${context.appOutDir}`, 'info');
  }
  
  // Sur Windows, vérifier la signature si signtool est disponible
  if (process.platform === 'win32') {
    try {
      log('Tentative de vérification de la signature Windows...', 'info');
      
      // Trouver l'exécutable
      const exePath = findExecutable(context.appOutDir);
      
      if (exePath) {
        verifyWindowsSignature(exePath);
      } else {
        log('Exécutable non trouvé pour vérification', 'warning');
      }
      
    } catch (error) {
      log(`Vérification de signature non disponible: ${error.message}`, 'warning');
    }
  }
  
  // Créer un fichier de log de signature
  createSignatureLog(context);
  
  log('After-sign terminé', 'success');
}

// Trouver l'exécutable dans le dossier de sortie
function findExecutable(appOutDir) {
  if (!appOutDir || !fs.existsSync(appOutDir)) {
    return null;
  }
  
  const files = fs.readdirSync(appOutDir);
  const exeFile = files.find(f => f.endsWith('.exe') && !f.includes('Uninstall'));
  
  if (exeFile) {
    return path.join(appOutDir, exeFile);
  }
  
  return null;
}

// Vérifier la signature Windows avec signtool
function verifyWindowsSignature(exePath) {
  try {
    log(`Vérification de la signature pour: ${exePath}`, 'info');
    
    // Essayer d'exécuter signtool
    const result = execSync(`signtool verify /pa "${exePath}"`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    log('Signature valide!', 'success');
    log(result, 'info');
    
  } catch (error) {
    // Si signtool n'existe pas ou si le fichier n'est pas signé
    if (error.message.includes('not recognized')) {
      log('signtool non disponible (OK si pas de certificat)', 'warning');
    } else {
      log('Fichier non signé ou signature invalide', 'warning');
      log('Pour signer le code, configurez WIN_CSC_LINK et WIN_CSC_KEY_PASSWORD', 'info');
    }
  }
}

// Créer un fichier de log de signature
function createSignatureLog(context) {
  const logData = {
    timestamp: new Date().toISOString(),
    platform: process.platform,
    arch: process.arch,
    signed: process.env.WIN_CSC_LINK ? true : false,
    certificate: process.env.WIN_CSC_LINK ? 'configured' : 'not configured',
    context: {
      outDir: context?.outDir || 'unknown',
      appOutDir: context?.appOutDir || 'unknown'
    }
  };
  
  const logPath = path.join(__dirname, '..', 'dist', 'signature-log.json');
  
  try {
    // S'assurer que le dossier dist existe
    const distPath = path.join(__dirname, '..', 'dist');
    if (!fs.existsSync(distPath)) {
      fs.mkdirSync(distPath, { recursive: true });
    }
    
    fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));
    log('signature-log.json créé', 'success');
  } catch (error) {
    log(`Erreur lors de la création du log: ${error.message}`, 'warning');
  }
}

// Export pour electron-builder
exports.default = afterSign;

// Si exécuté directement (test)
if (require.main === module) {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  ELECTRON BUILDER - AFTER SIGN SCRIPT');
  console.log('  RDS Viewer Anecoop v3.0.27');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  
  // Context de test
  const testContext = {
    outDir: path.join(__dirname, '..', 'dist'),
    appOutDir: path.join(__dirname, '..', 'dist', 'win-unpacked')
  };
  
  afterSign(testContext).then(() => {
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
  }).catch(error => {
    log(`Erreur: ${error.message}`, 'error');
    process.exit(1);
  });
}
