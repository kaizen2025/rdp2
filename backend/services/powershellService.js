// backend/services/powershellService.js - VERSION AMÉLIORÉE AVEC SPAWN

const { spawn } = require('child_process');

/**
 * Exécute un script PowerShell de manière plus robuste en utilisant `spawn`.
 * Cette méthode est préférable à `exec` pour les raisons suivantes :
 * 1.  **Performance** : Ne bufferise pas la sortie, ce qui est plus efficace pour les scripts générant beaucoup de données.
 * 2.  **Sécurité** : Moins susceptible aux injections de commande car les arguments sont passés dans un tableau.
 * 3.  **Stabilité** : Meilleure gestion des flux stdout et stderr séparément.
 *
 * @param {string} psScript - Le script PowerShell à exécuter.
 * @param {number} [timeout=15000] - Le temps maximum d'exécution en millisecondes.
 * @returns {Promise<string>} Une promesse qui résout avec la sortie standard (stdout) du script.
 */
function executeEncodedPowerShell(psScript, timeout = 15000) {
    // L'encodage en Base64 reste une méthode fiable pour passer des scripts complexes sans problème de caractères spéciaux.
    const encodedScript = Buffer.from(psScript, 'utf16le').toString('base64');

    return new Promise((resolve, reject) => {
        const psProcess = spawn('powershell.exe', [
            '-ExecutionPolicy', 'Bypass',
            '-NoProfile',
            '-NonInteractive',
            '-EncodedCommand', encodedScript
        ], {
            // Utiliser 'ipc' permet une communication plus stable avec le sous-processus.
            stdio: ['ignore', 'pipe', 'pipe']
        });

        let stdoutData = '';
        let stderrData = '';

        // S'assurer que les données sont lues en UTF-8 pour une meilleure consistance.
        psProcess.stdout.setEncoding('utf8');
        psProcess.stderr.setEncoding('utf8');

        // Timeout pour éviter que le processus ne tourne indéfiniment.
        const timer = setTimeout(() => {
            psProcess.kill('SIGTERM'); // Tuer le processus si le timeout est atteint.
            reject(new Error(`Timeout : Le script PowerShell a dépassé les ${timeout / 1000} secondes.`));
        }, timeout);

        psProcess.stdout.on('data', (data) => {
            stdoutData += data.toString();
        });

        psProcess.stderr.on('data', (data) => {
            stderrData += data.toString();
        });

        psProcess.on('close', (code) => {
            clearTimeout(timer);
            if (code === 0) {
                resolve(stdoutData.trim());
            } else {
                // Si stderr contient quelque chose, on le privilégie car c'est souvent plus explicite.
                const errorMessage = stderrData.trim() || `Le processus PowerShell s'est terminé avec le code ${code}`;
                reject(new Error(errorMessage));
            }
        });

        psProcess.on('error', (err) => {
            clearTimeout(timer);
            reject(new Error(`Échec du démarrage du processus PowerShell : ${err.message}`));
        });
    });
}

module.exports = {
    executeEncodedPowerShell,
};
