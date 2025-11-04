#!/usr/bin/env node

/**
 * Script After All Artifact Build - Electron Builder
 * RDS Viewer Anecoop v3.0.27
 * 
 * Ce script s'exécute APRÈS que TOUS les artefacts ont été construits
 * Utilisé pour: génération de rapport, upload, notifications, nettoyage
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🎉 [After All Artifact Build] Finalisation du build...');

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
async function afterAllArtifactBuild(buildResult) {
  log('Script after-all-artifact-build exécuté', 'info');
  
  // Informations sur les artefacts construits
  const { artifactPaths, outDir, configuration } = buildResult;
  
  log(`Dossier de sortie: ${outDir}`, 'info');
  log(`Nombre d'artefacts: ${artifactPaths.length}`, 'info');
  
  // Lister tous les artefacts
  listArtifacts(artifactPaths);
  
  // Calculer les checksums
  await calculateChecksums(artifactPaths, outDir);
  
  // Générer un rapport de build
  await generateBuildReport(buildResult);
  
  // Créer un fichier release notes
  await createReleaseNotes(outDir, configuration);
  
  // Afficher un résumé
  displaySummary(artifactPaths, outDir);
  
  log('After-all-artifact-build terminé', 'success');
  
  // Retourner les chemins des artefacts (requis par electron-builder)
  return artifactPaths;
}

// Lister tous les artefacts construits
function listArtifacts(artifactPaths) {
  log('Artefacts construits:', 'info');
  
  artifactPaths.forEach((artifactPath, index) => {
    const fileName = path.basename(artifactPath);
    const stats = fs.statSync(artifactPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`  ${index + 1}. ${fileName} (${sizeMB} MB)`);
  });
}

// Calculer les checksums (SHA256) pour tous les artefacts
async function calculateChecksums(artifactPaths, outDir) {
  log('Calcul des checksums...', 'info');
  
  const checksums = {};
  
  for (const artifactPath of artifactPaths) {
    try {
      const fileName = path.basename(artifactPath);
      const fileBuffer = fs.readFileSync(artifactPath);
      const hashSum = crypto.createHash('sha256');
      hashSum.update(fileBuffer);
      const hex = hashSum.digest('hex');
      
      checksums[fileName] = {
        sha256: hex,
        size: fileBuffer.length,
        path: artifactPath
      };
      
      log(`✓ ${fileName}: ${hex.substring(0, 16)}...`, 'info');
      
    } catch (error) {
      log(`Erreur lors du calcul du checksum pour ${artifactPath}: ${error.message}`, 'warning');
    }
  }
  
  // Sauvegarder les checksums dans un fichier
  const checksumsPath = path.join(outDir, 'checksums.json');
  fs.writeFileSync(checksumsPath, JSON.stringify(checksums, null, 2));
  
  // Créer aussi un fichier texte lisible
  const checksumsTextPath = path.join(outDir, 'SHA256SUMS.txt');
  const checksumsText = Object.entries(checksums)
    .map(([file, data]) => `${data.sha256}  ${file}`)
    .join('\n');
  fs.writeFileSync(checksumsTextPath, checksumsText + '\n');
  
  log('Checksums sauvegardés dans checksums.json et SHA256SUMS.txt', 'success');
}

// Générer un rapport de build complet
async function generateBuildReport(buildResult) {
  log('Génération du rapport de build...', 'info');
  
  const { artifactPaths, outDir, configuration } = buildResult;
  
  // Récupérer les informations de package.json
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Créer le rapport
  const report = {
    build: {
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleString('fr-FR'),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    },
    application: {
      name: packageJson.name,
      productName: configuration.productName || packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
      author: packageJson.author
    },
    configuration: {
      appId: configuration.appId,
      compression: configuration.compression,
      asar: configuration.asar
    },
    artifacts: artifactPaths.map(artifactPath => {
      const fileName = path.basename(artifactPath);
      const stats = fs.statSync(artifactPath);
      
      return {
        name: fileName,
        path: artifactPath,
        size: stats.size,
        sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
        created: stats.birthtime.toISOString()
      };
    }),
    statistics: {
      totalArtifacts: artifactPaths.length,
      totalSizeMB: artifactPaths.reduce((sum, p) => {
        const stats = fs.statSync(p);
        return sum + stats.size;
      }, 0) / (1024 * 1024)
    }
  };
  
  // Sauvegarder le rapport
  const reportPath = path.join(outDir, 'build-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log('Rapport de build sauvegardé dans build-report.json', 'success');
  
  // Créer aussi une version texte lisible
  await generateTextReport(report, outDir);
}

// Générer un rapport texte lisible
async function generateTextReport(report, outDir) {
  const textReport = `
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║                     RAPPORT DE BUILD ELECTRON                         ║
║                     RDS Viewer Anecoop v${report.application.version.padEnd(7)}                    ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════
  INFORMATIONS DE BUILD
═══════════════════════════════════════════════════════════════════════

Date de build:     ${report.build.date}
Node.js:           ${report.build.nodeVersion}
Plateforme:        ${report.build.platform}
Architecture:      ${report.build.arch}

═══════════════════════════════════════════════════════════════════════
  INFORMATIONS DE L'APPLICATION
═══════════════════════════════════════════════════════════════════════

Nom:               ${report.application.name}
Nom de produit:    ${report.application.productName}
Version:           ${report.application.version}
Description:       ${report.application.description}
App ID:            ${report.configuration.appId}

═══════════════════════════════════════════════════════════════════════
  CONFIGURATION
═══════════════════════════════════════════════════════════════════════

Compression:       ${report.configuration.compression}
ASAR:              ${report.configuration.asar ? 'Activé' : 'Désactivé'}

═══════════════════════════════════════════════════════════════════════
  ARTEFACTS GÉNÉRÉS (${report.statistics.totalArtifacts})
═══════════════════════════════════════════════════════════════════════

${report.artifacts.map((artifact, index) => `
${index + 1}. ${artifact.name}
   Taille:         ${artifact.sizeMB} MB
   Créé:           ${new Date(artifact.created).toLocaleString('fr-FR')}
`).join('\n')}

═══════════════════════════════════════════════════════════════════════
  STATISTIQUES
═══════════════════════════════════════════════════════════════════════

Nombre total d'artefacts:    ${report.statistics.totalArtifacts}
Taille totale:               ${report.statistics.totalSizeMB.toFixed(2)} MB

═══════════════════════════════════════════════════════════════════════
  FICHIERS ADDITIONNELS
═══════════════════════════════════════════════════════════════════════

✓ checksums.json          - Checksums JSON de tous les artefacts
✓ SHA256SUMS.txt          - Checksums texte (format standard)
✓ build-report.json       - Rapport de build complet (JSON)
✓ build-report.txt        - Ce rapport (texte)
✓ release-notes.md        - Notes de version

═══════════════════════════════════════════════════════════════════════
  PROCHAINES ÉTAPES
═══════════════════════════════════════════════════════════════════════

1. Tester les installeurs sur des machines propres
2. Vérifier la signature de code (si configurée)
3. Uploader les artefacts sur le serveur de distribution
4. Mettre à jour le fichier latest.yml pour l'auto-update
5. Publier les release notes

═══════════════════════════════════════════════════════════════════════
  SUPPORT
═══════════════════════════════════════════════════════════════════════

Pour toute question:
- Email: support@anecoop.com
- Documentation: build/ELECTRON_BUILDER_DOCUMENTATION.md

═══════════════════════════════════════════════════════════════════════

Build réussi! 🎉

═══════════════════════════════════════════════════════════════════════
`.trim();
  
  const textReportPath = path.join(outDir, 'build-report.txt');
  fs.writeFileSync(textReportPath, textReport);
  
  log('Rapport texte sauvegardé dans build-report.txt', 'success');
}

// Créer des release notes
async function createReleaseNotes(outDir, configuration) {
  log('Création des release notes...', 'info');
  
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const releaseNotes = `# ${configuration.productName} v${packageJson.version}

## 📦 Release Notes

**Date de publication:** ${new Date().toLocaleDateString('fr-FR')}

## ✨ Nouveautés

- Mise à jour vers la version ${packageJson.version}
- Optimisations de performance
- Corrections de bugs

## 📥 Installation

### Installeur NSIS (Recommandé)

Téléchargez le fichier \`${configuration.productName}-${packageJson.version}-Setup.exe\` et lancez-le.

**Caractéristiques:**
- Installation en un clic
- Compression maximale (7z)
- Raccourcis automatiques
- Désinstallation propre

### Version Portable

Téléchargez le fichier \`${configuration.productName}-${packageJson.version}-portable.exe\`.

**Caractéristiques:**
- Aucune installation requise
- Idéal pour clé USB
- Paramètres stockés localement

### Archive ZIP

Téléchargez et extrayez le fichier \`${configuration.productName}-${packageJson.version}-win.zip\`.

## 🔐 Vérification d'Intégrité

Vérifiez l'intégrité des fichiers téléchargés avec les checksums SHA256:

\`\`\`bash
# Linux/Mac
shasum -a 256 -c SHA256SUMS.txt

# Windows (PowerShell)
Get-FileHash -Algorithm SHA256 "nom-du-fichier.exe"
\`\`\`

Comparez le résultat avec le fichier \`SHA256SUMS.txt\`.

## 📋 Prérequis

- Windows 10 ou supérieur (64 bits recommandé)
- 4 GB de RAM minimum
- 500 MB d'espace disque libre

## 🐛 Bugs Connus

Aucun bug critique connu à ce jour.

## 📞 Support

Pour toute question ou problème:
- Email: support@anecoop.com
- Site web: https://www.anecoop.com

## 📄 Licence

Copyright © 2025 Anecoop. Tous droits réservés.

---

**Version:** ${packageJson.version}  
**Build:** ${new Date().toISOString()}
`;
  
  const releaseNotesPath = path.join(outDir, 'release-notes.md');
  fs.writeFileSync(releaseNotesPath, releaseNotes);
  
  log('Release notes créées dans release-notes.md', 'success');
}

// Afficher un résumé final
function displaySummary(artifactPaths, outDir) {
  const totalSizeMB = artifactPaths.reduce((sum, p) => {
    const stats = fs.statSync(p);
    return sum + stats.size;
  }, 0) / (1024 * 1024);
  
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  BUILD TERMINÉ AVEC SUCCÈS! 🎉');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log(`📦 ${artifactPaths.length} artefact(s) généré(s)`);
  console.log(`💾 Taille totale: ${totalSizeMB.toFixed(2)} MB`);
  console.log(`📂 Dossier: ${outDir}`);
  console.log('');
  console.log('📄 Fichiers générés:');
  console.log('  • checksums.json - Checksums de tous les artefacts');
  console.log('  • SHA256SUMS.txt - Checksums au format texte');
  console.log('  • build-report.json - Rapport de build (JSON)');
  console.log('  • build-report.txt - Rapport de build (texte)');
  console.log('  • release-notes.md - Notes de version');
  console.log('');
  console.log('🎯 Prochaines étapes:');
  console.log('  1. Tester les installeurs');
  console.log('  2. Vérifier la signature (si configurée)');
  console.log('  3. Uploader sur le serveur de distribution');
  console.log('  4. Publier les release notes');
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
}

// Export pour electron-builder
exports.default = afterAllArtifactBuild;

// Si exécuté directement (test)
if (require.main === module) {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  ELECTRON BUILDER - AFTER ALL ARTIFACT BUILD');
  console.log('  RDS Viewer Anecoop v3.0.27');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  
  // Context de test
  const testOutDir = path.join(__dirname, '..', 'dist');
  
  const testContext = {
    outDir: testOutDir,
    artifactPaths: [
      path.join(testOutDir, 'RDS Viewer Anecoop-3.0.27-Setup.exe'),
      path.join(testOutDir, 'RDS Viewer Anecoop-3.0.27-portable.exe'),
      path.join(testOutDir, 'RDS Viewer Anecoop-3.0.27-win.zip')
    ].filter(p => fs.existsSync(p)), // Filtrer les fichiers qui existent
    configuration: {
      appId: 'com.anecoop.rdsviewer',
      productName: 'RDS Viewer Anecoop',
      compression: 'maximum',
      asar: true
    }
  };
  
  afterAllArtifactBuild(testContext).then(() => {
    console.log('Test terminé');
  }).catch(error => {
    log(`Erreur: ${error.message}`, 'error');
    process.exit(1);
  });
}
