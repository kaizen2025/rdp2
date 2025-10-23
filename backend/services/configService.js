// backend/services/configService.js - VERSION AVEC VALIDATION STRICTE

const fs = require('fs').promises;
const path =require('path');

const CONFIG_PATH = path.join(__dirname, '..', '..', 'config', 'config.json');
const TEMPLATE_CONFIG_PATH = path.join(__dirname, '..', '..', 'config', 'config.template.json');

let appConfig = null;
let isConfigValid = false;

/**
 * Valide que la configuration chargée contient les clés essentielles
 * et que celles-ci n'ont pas de valeurs placeholders.
 * @param {object} config - L'objet de configuration à valider.
 * @returns {{isValid: boolean, errors: string[]}} Un objet indiquant si la config est valide et les erreurs trouvées.
 */
function validateConfig(config) {
    const errors = [];
    const requiredKeys = {
        'databasePath': 'Le chemin vers la base de données SQLite.',
        'excelFilePath': 'Le chemin vers le fichier Excel des utilisateurs.',
        'guacamole.url': 'L\'URL de votre serveur Guacamole.',
        'guacamole.secretKey': 'La clé secrète pour l\'authentification Guacamole (doit correspondre à guacamole.properties).',
    };

    for (const [key, description] of Object.entries(requiredKeys)) {
        const keys = key.split('.');
        let value = config;
        for (const k of keys) {
            value = value ? value[k] : undefined;
        }

        if (!value) {
            errors.push(`Clé manquante: '${key}'. Description: ${description}`);
        } else if (typeof value === 'string' && (value.includes('VOTRE_') || value.includes('CHEMIN\\VERS'))) {
            errors.push(`Valeur placeholder détectée pour '${key}'. Veuillez la remplacer par une valeur réelle.`);
        }
    }

    return { isValid: errors.length === 0, errors };
}


async function loadTemplateConfig() {
    try {
        const templateData = await fs.readFile(TEMPLATE_CONFIG_PATH, 'utf-8');
        return JSON.parse(templateData);
    } catch (error) {
        throw new Error("Fichier de configuration template (config.template.json) introuvable ou invalide.");
    }
}

async function loadConfigAsync() {
    try {
        const data = await fs.readFile(CONFIG_PATH, 'utf-8');
        appConfig = JSON.parse(data);
    } catch (error) {
        console.error(`⚠️  Impossible de lire ou parser config.json (${error.message}).`);
        console.log("-> Tentative de démarrage avec une configuration minimale pour permettre le diagnostic.");
        appConfig = await loadTemplateConfig();
        isConfigValid = false; // Marquer comme invalide car c'est un fallback
        return; // Sortir pour ne pas valider une config de template
    }

    const { isValid, errors } = validateConfig(appConfig);
    if (!isValid) {
        console.error("====================== ERREUR DE CONFIGURATION ======================");
        console.error("Le fichier de configuration (config.json) est invalide. L'application ne peut pas démarrer correctement.");
        errors.forEach(err => console.error(`- ${err}`));
        console.error("=====================================================================");
        // On ne lance pas d'erreur pour permettre à l'API de santé de répondre,
        // mais on marque la configuration comme invalide.
        isConfigValid = false;
    } else {
        isConfigValid = true;
        console.log("✅ Configuration chargée et validée avec succès.");
    }
}

function getConfig() {
    return appConfig || {};
}

function isConfigurationValid() {
    return isConfigValid;
}

async function saveConfig(newConfig) {
    try {
        await fs.writeFile(CONFIG_PATH, JSON.stringify(newConfig, null, 4), 'utf-8');
        appConfig = newConfig;
        const { isValid, errors } = validateConfig(appConfig);
        isConfigValid = isValid; // Mettre à jour l'état de validité
        if (!isValid) {
            console.warn("Configuration sauvegardée, mais elle contient des erreurs:", errors);
        }
        return { success: true, message: "Configuration sauvegardée." };
    } catch (error) {
        return { success: false, message: `Erreur: ${error.message}` };
    }
}

module.exports = {
    loadConfigAsync,
    getConfig,
    saveConfig,
    isConfigurationValid,
    get appConfig() {
        return appConfig;
    },
};
