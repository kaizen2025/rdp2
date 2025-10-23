// backend/services/configService.js - VERSION AMÉLIORÉE AVEC FALLBACK

const fs = require('fs').promises;
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', '..', 'config', 'config.json');
const TEMPLATE_CONFIG_PATH = path.join(__dirname, '..', '..', 'config', 'config.template.json');

let appConfig = null;

/**
 * Charge la configuration depuis le fichier template.
 * C'est une mesure de sécurité pour s'assurer que l'application a toujours une configuration de base pour démarrer.
 * @returns {Promise<object>} La configuration par défaut.
 */
async function loadTemplateConfig() {
    try {
        console.warn("🔧 Chargement de la configuration depuis le template (config.template.json).");
        const templateData = await fs.readFile(TEMPLATE_CONFIG_PATH, 'utf-8');
        return JSON.parse(templateData);
    } catch (error) {
        console.error("❌ ERREUR CRITIQUE: Impossible de charger même la configuration du template.", error);
        // Si même le template est manquant, on lance une erreur fatale car l'application ne peut pas fonctionner.
        throw new Error("Fichier de configuration template introuvable ou invalide.");
    }
}

/**
 * Charge la configuration de manière asynchrone depuis config.json.
 * Si le fichier est introuvable ou invalide, il se rabat sur la configuration du template.
 */
async function loadConfigAsync() {
    try {
        console.log(`🔍 Tentative de chargement de la configuration depuis : ${CONFIG_PATH}`);
        const data = await fs.readFile(CONFIG_PATH, 'utf-8');
        appConfig = JSON.parse(data);
        console.log("✅ Configuration chargée avec succès.");
    } catch (error) {
        console.error(`⚠️  Échec du chargement de config.json (${error.message}). Utilisation du fallback.`);
        appConfig = await loadTemplateConfig();
    }
}

/**
 * Retourne la configuration actuellement chargée.
 * @returns {object} La configuration de l'application.
 */
function getConfig() {
    if (!appConfig) {
        // C'est une sécurité supplémentaire au cas où getConfig serait appelé avant loadConfigAsync.
        // Dans un flux normal, cela ne devrait pas arriver.
        console.warn("Configuration demandée avant son chargement complet.");
        return {};
    }
    return appConfig;
}

/**
 * Sauvegarde une nouvelle configuration dans config.json.
 * @param {object} newConfig - Le nouvel objet de configuration à sauvegarder.
 * @returns {Promise<{success: boolean, message: string}>} Un objet indiquant le succès ou l'échec.
 */
async function saveConfig(newConfig) {
    try {
        const configJson = JSON.stringify(newConfig, null, 4);
        await fs.writeFile(CONFIG_PATH, configJson, 'utf-8');
        appConfig = newConfig; // Mettre à jour la configuration en mémoire.
        console.log("✅ Configuration sauvegardée avec succès.");
        return { success: true, message: "Configuration sauvegardée." };
    } catch (error) {
        console.error("❌ Erreur lors de la sauvegarde de la configuration:", error);
        return { success: false, message: `Erreur: ${error.message}` };
    }
}

// Exposer appConfig pour un accès direct si nécessaire (pratique pour les services qui en dépendent).
module.exports = {
    loadConfigAsync,
    getConfig,
    saveConfig,
    get appConfig() {
        return appConfig;
    },
};
