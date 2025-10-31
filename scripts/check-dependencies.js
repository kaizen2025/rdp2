const { execSync } = require('child_process');

function checkBetterSqlite3() {
    try {
        require('better-sqlite3');
        console.log('✅ better-sqlite3 fonctionne correctement.');
        return true;
    } catch (error) {
        // Affiche uniquement la première ligne de l'erreur pour la clarté
        console.warn('⚠️  better-sqlite3 ne fonctionne pas. Erreur:', error.message.split('\n')[0]);
        return false;
    }
}

function main() {
    console.log('🔍 Vérification des dépendances natives...');
    
    if (checkBetterSqlite3()) {
        // Si le module fonctionne, on ne fait rien de plus.
        return;
    }

    console.log('🔨 Recompilation de better-sqlite3 nécessaire...');
    try {
        // Exécute la commande de recompilation et affiche la sortie en temps réel
        execSync('npm rebuild better-sqlite3', { stdio: 'inherit' });
        console.log('✅ Recompilation terminée avec succès.');
        
        // Vérification finale après la recompilation
        if (!checkBetterSqlite3()) {
            throw new Error("La recompilation semble avoir échoué. Essayez de supprimer le dossier node_modules et de réinstaller avec `npm install`.");
        }
    } catch (error) {
        console.error('❌ Erreur critique lors de la recompilation de better-sqlite3.');
        console.error(error.message);
        // Quitte le processus avec un code d'erreur pour arrêter le script de démarrage
        process.exit(1);
    }
}

main();