// backend/services/configService.js - VERSION FINALE ROBUSTE

const fs = require('fs');
const path = require('path');

// Cette variable globale est définie par Electron, mais pas par Node.js.
// C'est le moyen le plus sûr de détecter l'environnement.
const isElectron = 'electron' in process.versions;

// On importe `electron-is-dev` uniquement si on est dans Electron.
const isDev = isElectron ? require('electron-is-dev') : process.env.NODE_ENV !== 'production';

function getBasePath() {
    if (!isElectron || isDev) {
        // En développement (Node pur ou Electron dev), la racine du projet.
        return path.join(__dirname, '..', '..');
    }
    // En production (EXE), `process.resourcesPath` est le chemin le plus fiable.
    return process.resourcesPath;
}

const basePath = getBasePath();
const CONFIG_PATH = path.join(basePath, 'config', 'config.json');
const TEMPLATE_CONFIG_PATH = path.join(basePath, 'config', 'config.template.json');

let appConfig = null;
let isConfigValid = false;

function normalizeConfig(config) {
    if (config.defaultExcelPath && !config.excelFilePath) {
        config.excelFilePath = config.defaultExcelPath;
    }
}

function validateConfig(config) {
    const errors = [];
    const requiredKeys = {
        'databasePath': 'Le chemin vers la base de données SQLite.',
        'excelFilePath': 'Le chemin vers le fichier Excel des utilisateurs.',
    };
    for (const [key, description] of Object.entries(requiredKeys)) {
        const value = key.split('.').reduce((o, i) => o?.[i], config);
        if (!value || (typeof value === 'string' && (value.includes('VOTRE_') || value.includes('CHEMIN_RESEAU')))) {
            errors.push(`Clé invalide: '${key}'. Description: ${description}`);
        }
    }
    return { isValid: errors.length === 0, errors };
}

async function loadConfigAsync() {
    try {
        console.log(`[Config] Lecture de: ${CONFIG_PATH}`);
        const data = await fs.promises.readFile(CONFIG_PATH, 'utf-8');
        appConfig = JSON.parse(data);
    } catch (error) {
        console.error(`⚠️ Impossible de lire config.json. Utilisation du template.`);
        try {
            const templateData = await fs.promises.readFile(TEMPLATE_CONFIG_PATH, 'utf-8');
            appConfig = JSON.parse(templateData);
        } catch (templateError) {
            throw new Error("ERREUR CRITIQUE: config.json et config.template.json sont illisibles.");
        }
        isConfigValid = false;
        return;
    }
    normalizeConfig(appConfig);
    const { isValid, errors } = validateConfig(appConfig);
    isConfigValid = isValid;
    if (!isValid) {
        console.error("====================== ERREUR DE CONFIGURATION ======================");
        errors.forEach(err => console.error(`- ${err}`));
        console.error("=====================================================================");
    }
}

function getConfig() { return appConfig || {}; }
function isConfigurationValid() { return isConfigValid; }

async function saveConfig(newConfig) {
    try {
        await fs.promises.writeFile(CONFIG_PATH, JSON.stringify(newConfig, null, 4), 'utf-8');
        appConfig = newConfig;
        normalizeConfig(appConfig);
        const { isValid, errors } = validateConfig(appConfig);
        isConfigValid = isValid;
        if (!isValid) console.warn("Config sauvegardée avec erreurs:", errors);
        return { success: true };
    } catch (error) {
        console.error('Erreur sauvegarde config:', error);
        return { success: false, message: error.message };
    }
}

module.exports = {
    loadConfigAsync, getConfig, saveConfig, isConfigurationValid,
    get appConfig() { return appConfig; },
};