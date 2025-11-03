#!/usr/bin/env node
/**
 * Script pour résoudre automatiquement les conflits de merge Git
 * Stratégie : Garder la version HEAD (la plus récente)
 */

const fs = require('fs');
const path = require('path');

function resolveConflicts(content) {
    // Pattern pour détecter les conflits de merge
    const conflictPattern = /<<<<<<< HEAD\n([\s\S]*?)=======\n([\s\S]*?)>>>>>>> [a-f0-9]+\n?/g;

    // Remplacer tous les conflits en gardant la version HEAD
    const resolved = content.replace(conflictPattern, (match, headContent, theirContent) => {
        // On garde la version HEAD
        return headContent;
    });

    return resolved;
}

function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');

        // Vérifier s'il y a des conflits
        if (content.includes('<<<<<<< HEAD')) {
            console.log(`Résolution des conflits dans: ${filePath}`);
            const resolved = resolveConflicts(content);
            fs.writeFileSync(filePath, resolved, 'utf8');
            console.log(`✅ Conflits résolus dans: ${filePath}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`❌ Erreur lors du traitement de ${filePath}:`, error.message);
        return false;
    }
}

function findFilesWithConflicts(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        // Ignorer node_modules et autres dossiers
        if (stat.isDirectory()) {
            if (!['node_modules', '.git', 'build', 'dist'].includes(file)) {
                findFilesWithConflicts(filePath, fileList);
            }
        } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.jsx'))) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

// Liste des fichiers connus avec conflits
const knownConflicts = [
    './backend/services/adService.js',
    './backend/services/databaseService.js',
    './server/server.js',
    './server/apiRoutes.js',
    './src/services/apiService.js',
    './src/components/ad-tree/AdTreeView.js',
    './src/components/CreateAdUserDialog.js',
    './src/components/loan-management/LoanList.js',
    './src/components/LoanDialog.js',
    './src/components/UserPrintSheet.js',
    './src/pages/ComputersPage.js',
    './src/pages/UsersManagementPage.js',
    './src/pages/ChatPage.js',
    './src/pages/SessionsPage.js',
    './src/pages/DashboardPage.js',
    './src/layouts/MainLayout.js',
    './electron/preload.js'
];

console.log('🔍 Résolution des conflits de merge...\n');

let resolvedCount = 0;
for (const filePath of knownConflicts) {
    if (fs.existsSync(filePath)) {
        if (processFile(filePath)) {
            resolvedCount++;
        }
    } else {
        console.log(`⚠️  Fichier non trouvé: ${filePath}`);
    }
}

console.log(`\n✅ ${resolvedCount} fichier(s) avec conflits résolus.`);
console.log('Vous pouvez maintenant relancer la compilation avec: npm run build');
