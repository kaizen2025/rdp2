// scripts/start-server-safe.js - Démarrage sécurisé du serveur avec vérification des dépendances

const { spawn } = require('child_process');
const path = require('path');

console.log('\n=============================================');
console.log('🚀 Démarrage sécurisé du serveur...');
console.log('=============================================\n');

/**
 * Exécute le script de vérification des dépendances
 */
async function checkDependencies() {
    return new Promise((resolve, reject) => {
        console.log('🔍 Étape 1/2 : Vérification des dépendances natives\n');

        const isWindows = process.platform === 'win32';
        const command = isWindows ? 'node.exe' : 'node';

        const checkProcess = spawn(command, [
            path.join(__dirname, 'check-dependencies.js')
        ], {
            stdio: 'inherit',
            shell: false
        });

        checkProcess.on('error', (error) => {
            console.error(`❌ Erreur lors de la vérification: ${error.message}`);
            reject(error);
        });

        checkProcess.on('close', (code) => {
            if (code === 0) {
                console.log('✅ Étape 1/2 : Dépendances vérifiées\n');
                resolve();
            } else {
                console.error(`❌ La vérification des dépendances a échoué (code ${code})`);
                reject(new Error(`Vérification échouée avec le code ${code}`));
            }
        });
    });
}

/**
 * Démarre le serveur Node.js
 */
function startServer() {
    return new Promise((resolve) => {
        console.log('🚀 Étape 2/2 : Démarrage du serveur backend\n');
        console.log('=============================================\n');

        const isWindows = process.platform === 'win32';
        const command = isWindows ? 'node.exe' : 'node';

        const serverProcess = spawn(command, [
            path.join(__dirname, '..', 'server', 'server.js')
        ], {
            stdio: 'inherit',
            shell: false
        });

        serverProcess.on('error', (error) => {
            console.error(`❌ Erreur lors du démarrage du serveur: ${error.message}`);
            process.exit(1);
        });

        serverProcess.on('close', (code) => {
            console.log(`\n📊 Serveur terminé avec le code ${code}`);
            process.exit(code);
        });

        // Gestion du CTRL+C
        process.on('SIGINT', () => {
            console.log('\n\n🛑 Arrêt du serveur...');
            serverProcess.kill('SIGINT');
        });

        process.on('SIGTERM', () => {
            serverProcess.kill('SIGTERM');
        });

        resolve();
    });
}

/**
 * Fonction principale
 */
async function main() {
    try {
        // Étape 1 : Vérifier les dépendances
        await checkDependencies();

        // Étape 2 : Démarrer le serveur
        await startServer();

    } catch (error) {
        console.error(`\n❌ ERREUR FATALE: ${error.message}`);
        console.error('\n📖 Suggestions:');
        console.error('   1. Vérifier que Node.js est installé correctement');
        console.error('   2. Exécuter: npm install');
        console.error('   3. Exécuter: npm rebuild better-sqlite3');
        console.error('   4. Consulter PORT-MANAGEMENT.md pour plus d\'aide\n');
        process.exit(1);
    }
}

// Démarrage
main();
