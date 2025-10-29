// scripts/check-dependencies.js - Vérification et rebuild automatique des dépendances natives

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n=============================================');
console.log('🔍 Vérification des dépendances natives...');
console.log('=============================================\n');

/**
 * Teste si better-sqlite3 fonctionne correctement
 */
function testBetterSqlite3() {
    try {
        console.log('📦 Test de better-sqlite3...');

        // Essayer de charger le module
        const Database = require('better-sqlite3');

        // Essayer de créer une base de données en mémoire
        const db = new Database(':memory:');
        db.close();

        console.log('✅ better-sqlite3 fonctionne correctement\n');
        return true;
    } catch (error) {
        console.log('❌ better-sqlite3 ne fonctionne pas correctement');
        console.log(`   Erreur: ${error.message}\n`);
        return false;
    }
}

/**
 * Rebuild better-sqlite3
 */
function rebuildBetterSqlite3() {
    try {
        console.log('🔨 Rebuild de better-sqlite3 en cours...');
        console.log('   (Cela peut prendre 30-60 secondes)\n');

        // Exécuter npm rebuild avec output en temps réel
        execSync('npm rebuild better-sqlite3', {
            stdio: 'inherit',
            cwd: process.cwd()
        });

        console.log('\n✅ better-sqlite3 recompilé avec succès\n');
        return true;
    } catch (error) {
        console.error('❌ Erreur lors du rebuild de better-sqlite3:');
        console.error(`   ${error.message}\n`);
        return false;
    }
}

/**
 * Obtenir des informations sur Node.js et le système
 */
function getSystemInfo() {
    const nodeVersion = process.version;
    const platform = process.platform;
    const arch = process.arch;
    const nodeModuleVersion = process.versions.modules;

    return {
        nodeVersion,
        platform,
        arch,
        nodeModuleVersion
    };
}

/**
 * Afficher les informations système
 */
function displaySystemInfo() {
    const info = getSystemInfo();

    console.log('📋 Informations système:');
    console.log(`   • Node.js version     : ${info.nodeVersion}`);
    console.log(`   • Plateforme          : ${info.platform}`);
    console.log(`   • Architecture        : ${info.arch}`);
    console.log(`   • Module version (ABI): ${info.nodeModuleVersion}`);
    console.log('');
}

/**
 * Vérifier si le rebuild est nécessaire
 */
function isRebuildNeeded() {
    // Vérifier si le fichier .rebuild-done existe avec la bonne version
    const rebuildFile = path.join(process.cwd(), '.rebuild-done');
    const currentNodeVersion = process.version;

    try {
        if (fs.existsSync(rebuildFile)) {
            const savedVersion = fs.readFileSync(rebuildFile, 'utf8').trim();
            if (savedVersion === currentNodeVersion) {
                console.log('ℹ️  Rebuild déjà effectué pour cette version de Node.js\n');
                return false;
            }
        }
    } catch (error) {
        // Fichier inexistant ou illisible, rebuild nécessaire
    }

    return true;
}

/**
 * Sauvegarder la version de Node.js après un rebuild réussi
 */
function saveRebuildVersion() {
    const rebuildFile = path.join(process.cwd(), '.rebuild-done');
    const currentNodeVersion = process.version;

    try {
        fs.writeFileSync(rebuildFile, currentNodeVersion, 'utf8');
        console.log('📝 Version de Node.js sauvegardée pour futures vérifications\n');
    } catch (error) {
        console.warn('⚠️  Impossible de sauvegarder la version de Node.js\n');
    }
}

/**
 * Fonction principale
 */
function main() {
    try {
        // Afficher les infos système
        displaySystemInfo();

        // Tester better-sqlite3
        const isWorking = testBetterSqlite3();

        if (isWorking) {
            console.log('✅ Toutes les dépendances sont prêtes\n');
            console.log('=============================================\n');
            return 0;
        }

        // better-sqlite3 ne fonctionne pas
        console.log('⚠️  better-sqlite3 doit être recompilé pour votre version de Node.js\n');

        // Vérifier si le rebuild a déjà été fait pour cette version
        const needsRebuild = isRebuildNeeded();

        if (!needsRebuild) {
            // Le rebuild a déjà été fait mais ça ne marche toujours pas
            console.log('⚠️  Le rebuild a déjà été effectué mais better-sqlite3 ne fonctionne pas');
            console.log('   Tentative de rebuild forcé...\n');
        }

        // Rebuild
        const rebuildSuccess = rebuildBetterSqlite3();

        if (!rebuildSuccess) {
            console.error('❌ ÉCHEC du rebuild de better-sqlite3');
            console.error('\n📖 Solutions possibles:');
            console.error('   1. Vérifier que vous avez les outils de build (Visual Studio Build Tools)');
            console.error('   2. Exécuter manuellement: npm rebuild better-sqlite3');
            console.error('   3. Réinstaller: npm uninstall better-sqlite3 && npm install better-sqlite3');
            console.error('   4. Utiliser une version compatible de Node.js (v18 ou v20 recommandé)\n');
            console.error('=============================================\n');
            return 1;
        }

        // Sauvegarder la version après un rebuild réussi
        saveRebuildVersion();

        // Retester après rebuild
        console.log('🔍 Test après rebuild...\n');
        const isWorkingNow = testBetterSqlite3();

        if (isWorkingNow) {
            console.log('✅ better-sqlite3 fonctionne maintenant correctement!');
            console.log('✅ Toutes les dépendances sont prêtes\n');
            console.log('=============================================\n');
            return 0;
        } else {
            console.error('❌ better-sqlite3 ne fonctionne toujours pas après rebuild');
            console.error('\n📖 Solutions avancées:');
            console.error('   1. Supprimer node_modules et réinstaller: ');
            console.error('      rmdir /s /q node_modules && npm install');
            console.error('   2. Vérifier la version de Python (Python 3.x requis)');
            console.error('   3. Consulter: https://github.com/WiseLibs/better-sqlite3/blob/master/docs/troubleshooting.md\n');
            console.error('=============================================\n');
            return 1;
        }

    } catch (error) {
        console.error('\n❌ ERREUR CRITIQUE:', error.message);
        console.error(error.stack);
        console.error('\n=============================================\n');
        return 1;
    }
}

// Exécution
const exitCode = main();
process.exit(exitCode);
