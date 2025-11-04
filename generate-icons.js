/**
 * Script de génération d'icônes pour DocuCortex IA
 * 
 * Ce script génère automatiquement toutes les icônes nécessaires
 * pour l'empaquetage Electron à partir d'une image source.
 * 
 * Usage: node generate-icons.js [chemin-image-source]
 */

const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Configuration
const CONFIG = {
  sourceImage: process.argv[2] || path.join(__dirname, 'assets', 'icon-source.png'),
  outputDir: path.join(__dirname, 'build', 'icons'),
  assetsDir: path.join(__dirname, 'assets'),
  
  // Résolutions pour les différentes plateformes
  sizes: {
    ico: [16, 32, 48, 64, 128, 256],
    png: [16, 32, 48, 64, 128, 256, 512, 1024],
    linux: 512,
    windows: 256
  },
  
  // Ressources installeur
  installer: {
    header: { width: 150, height: 57 },
    background: { width: 164, height: 314 }
  }
};

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

/**
 * Logger avec couleurs
 */
const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`)
};

/**
 * Vérifie si une commande existe
 */
async function commandExists(command) {
  try {
    await execAsync(`which ${command}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Vérifie les dépendances
 */
async function checkDependencies() {
  log.info('Vérification des dépendances...');
  
  const dependencies = [];
  
  // Vérifier ImageMagick (optionnel mais recommandé)
  const hasImageMagick = await commandExists('convert');
  if (hasImageMagick) {
    log.success('ImageMagick détecté');
    dependencies.push('imagemagick');
  } else {
    log.warning('ImageMagick non trouvé (optionnel, mais recommandé pour une meilleure qualité)');
  }
  
  // Vérifier si sharp est installé (alternative à ImageMagick)
  try {
    require.resolve('sharp');
    log.success('Sharp détecté');
    dependencies.push('sharp');
  } catch {
    log.warning('Sharp non installé');
  }
  
  return dependencies;
}

/**
 * Crée les dossiers nécessaires
 */
async function createDirectories() {
  log.info('Création des dossiers...');
  await fs.ensureDir(CONFIG.outputDir);
  await fs.ensureDir(CONFIG.assetsDir);
  log.success('Dossiers créés');
}

/**
 * Vérifie l'image source
 */
async function checkSourceImage() {
  log.info(`Vérification de l'image source: ${CONFIG.sourceImage}`);
  
  if (!await fs.pathExists(CONFIG.sourceImage)) {
    throw new Error(`Image source introuvable: ${CONFIG.sourceImage}`);
  }
  
  const stats = await fs.stat(CONFIG.sourceImage);
  log.success(`Image source trouvée (${(stats.size / 1024).toFixed(2)} KB)`);
}

/**
 * Génère les icônes PNG de différentes tailles avec Sharp
 */
async function generatePNGsWithSharp() {
  log.info('Génération des icônes PNG avec Sharp...');
  
  const sharp = require('sharp');
  const sourceBuffer = await fs.readFile(CONFIG.sourceImage);
  
  for (const size of CONFIG.sizes.png) {
    const outputPath = path.join(CONFIG.outputDir, `icon-${size}x${size}.png`);
    
    await sharp(sourceBuffer)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputPath);
    
    log.success(`Généré: icon-${size}x${size}.png`);
  }
  
  // Copier la version 512x512 comme icon.png principal
  await fs.copy(
    path.join(CONFIG.outputDir, 'icon-512x512.png'),
    path.join(CONFIG.outputDir, 'icon.png')
  );
  log.success('Icône principale Linux créée (icon.png)');
}

/**
 * Génère les icônes PNG avec ImageMagick
 */
async function generatePNGsWithImageMagick() {
  log.info('Génération des icônes PNG avec ImageMagick...');
  
  for (const size of CONFIG.sizes.png) {
    const outputPath = path.join(CONFIG.outputDir, `icon-${size}x${size}.png`);
    const cmd = `convert "${CONFIG.sourceImage}" -resize ${size}x${size} -background none -gravity center -extent ${size}x${size} "${outputPath}"`;
    
    await execAsync(cmd);
    log.success(`Généré: icon-${size}x${size}.png`);
  }
  
  // Copier la version 512x512 comme icon.png principal
  await fs.copy(
    path.join(CONFIG.outputDir, 'icon-512x512.png'),
    path.join(CONFIG.outputDir, 'icon.png')
  );
  log.success('Icône principale Linux créée (icon.png)');
}

/**
 * Génère le fichier ICO pour Windows avec ImageMagick
 */
async function generateICOWithImageMagick() {
  log.info('Génération de l\'icône Windows (ICO) avec ImageMagick...');
  
  // Créer un fichier ICO multi-résolution
  const iconFiles = CONFIG.sizes.ico.map(size => 
    path.join(CONFIG.outputDir, `icon-${size}x${size}.png`)
  ).join(' ');
  
  const outputPath = path.join(CONFIG.outputDir, 'icon.ico');
  const cmd = `convert ${iconFiles} "${outputPath}"`;
  
  await execAsync(cmd);
  log.success('Icône Windows créée (icon.ico)');
}

/**
 * Génère le fichier ICO avec png2icons
 */
async function generateICOWithPng2Icons() {
  log.info('Génération de l\'icône Windows (ICO) avec png2icons...');
  
  try {
    const png2icons = require('png2icons');
    
    const inputBuffer = await fs.readFile(CONFIG.sourceImage);
    const icoBuffer = png2icons.createICO(inputBuffer, png2icons.BICUBIC, 0, true);
    
    const outputPath = path.join(CONFIG.outputDir, 'icon.ico');
    await fs.writeFile(outputPath, icoBuffer);
    
    log.success('Icône Windows créée (icon.ico)');
  } catch (error) {
    log.warning('png2icons non disponible, essayez d\'installer: npm install png2icons');
    throw error;
  }
}

/**
 * Génère les ressources pour l'installeur
 */
async function generateInstallerAssets() {
  log.info('Génération des ressources pour l\'installeur...');
  
  try {
    const sharp = require('sharp');
    const sourceBuffer = await fs.readFile(CONFIG.sourceImage);
    
    // Bannière de l'installeur (header)
    const headerPath = path.join(CONFIG.outputDir, 'installer-header.png');
    await sharp(sourceBuffer)
      .resize(CONFIG.installer.header.width, CONFIG.installer.header.height, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(headerPath);
    log.success('Bannière d\'installeur créée (installer-header.png)');
    
    // Fond d'écran de l'installeur
    const bgPath = path.join(CONFIG.outputDir, 'installer-background.png');
    await sharp(sourceBuffer)
      .resize(CONFIG.installer.background.width, CONFIG.installer.background.height, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(bgPath);
    log.success('Fond d\'installeur créé (installer-background.png)');
    
  } catch (error) {
    log.warning('Impossible de générer les ressources d\'installeur (Sharp requis)');
  }
}

/**
 * Génère un exemple d'icône source si elle n'existe pas
 */
async function generateDefaultIcon() {
  log.info('Génération d\'une icône exemple...');
  
  try {
    const sharp = require('sharp');
    
    // Créer une icône simple avec les initiales "DC" pour DocuCortex
    const svg = `
      <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#4A90E2;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#2C5AA0;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="1024" height="1024" rx="180" fill="url(#grad)"/>
        <text x="512" y="650" font-family="Arial, sans-serif" font-size="480" font-weight="bold" fill="white" text-anchor="middle">DC</text>
        <circle cx="380" cy="280" r="40" fill="white" opacity="0.3"/>
        <circle cx="480" cy="240" r="30" fill="white" opacity="0.2"/>
        <circle cx="640" cy="260" r="35" fill="white" opacity="0.25"/>
      </svg>
    `;
    
    await sharp(Buffer.from(svg))
      .png()
      .toFile(CONFIG.sourceImage);
    
    log.success('Icône exemple créée');
    log.warning('Remplacez assets/icon-source.png par votre propre icône pour de meilleurs résultats');
    
  } catch (error) {
    log.error('Impossible de générer l\'icône exemple');
    throw error;
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('\n🎨 Générateur d\'icônes DocuCortex IA\n');
  
  try {
    // Étape 1: Vérifier les dépendances
    const deps = await checkDependencies();
    
    // Étape 2: Créer les dossiers
    await createDirectories();
    
    // Étape 3: Vérifier ou créer l'image source
    const sourceExists = await fs.pathExists(CONFIG.sourceImage);
    if (!sourceExists) {
      log.warning('Image source non trouvée, génération d\'une icône exemple...');
      await generateDefaultIcon();
    } else {
      await checkSourceImage();
    }
    
    // Étape 4: Générer les PNG
    if (deps.includes('sharp')) {
      await generatePNGsWithSharp();
    } else if (deps.includes('imagemagick')) {
      await generatePNGsWithImageMagick();
    } else {
      log.error('Aucun outil de génération d\'image disponible');
      log.info('Installez Sharp: npm install sharp');
      log.info('Ou ImageMagick: apt-get install imagemagick (Linux) / brew install imagemagick (macOS)');
      process.exit(1);
    }
    
    // Étape 5: Générer l'ICO
    try {
      if (deps.includes('imagemagick')) {
        await generateICOWithImageMagick();
      } else {
        await generateICOWithPng2Icons();
      }
    } catch (error) {
      log.warning('Impossible de générer le fichier ICO automatiquement');
      log.info('Vous pouvez utiliser un service en ligne: https://icoconvert.com/');
    }
    
    // Étape 6: Générer les ressources installeur
    if (deps.includes('sharp')) {
      await generateInstallerAssets();
    }
    
    // Résumé
    console.log('\n✨ Génération terminée!\n');
    log.success(`Icônes générées dans: ${CONFIG.outputDir}`);
    
    // Lister les fichiers créés
    const files = await fs.readdir(CONFIG.outputDir);
    console.log('\n📁 Fichiers créés:');
    files.forEach(file => console.log(`   - ${file}`));
    
    console.log('\n💡 Prochaines étapes:');
    console.log('   1. Vérifiez les icônes générées');
    console.log('   2. Remplacez assets/icon-source.png si nécessaire');
    console.log('   3. Relancez ce script pour régénérer');
    console.log('   4. Lancez npm run build pour empaqueter l\'application\n');
    
  } catch (error) {
    log.error(`Erreur: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Exécution
if (require.main === module) {
  main();
}

module.exports = { main, CONFIG };
