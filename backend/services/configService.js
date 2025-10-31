// backend/services/configService.js - VERSION FINALE ROBUSTE

const fs = require('fs');
const path = require('path');

const isElectron = 'electron' in process.versions;
const isDev = isElectron ? require('electron-is-dev') : false;
// Détecte si on est dans un environnement Electron packagé
const isPackaged = process.mainModule && process.mainModule.filename.includes('app.asar');

/**
 * Calcule le chemin de base de l'application de manière fiable
 * dans tous les environnements (dev, prod, forked process).
 */
function getBasePath() {
    // Si l'application est packagée pour la production
    if (isElectron && !isDev) {
        // process.resourcesPath pointe vers le dossier des ressources
        return process.resourcesPath;
    }
    // En développement (Electron ou serveur Node seul), la base est la racine du projet
    return path.join(__dirname, '..', '..');
}

const basePath = getBasePath();
// Le dossier 'config' est copié à la racine des ressources par electron-builder
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
        if (!fs.existsSync(CONFIG_PATH)) {
            throw new Error(`Le fichier de configuration est introuvable à l'emplacement attendu.`);
        }
        const data = await fs.promises.readFile(CONFIG_PATH, 'utf-8');
        appConfig = JSON.parse(data);
    } catch (error) {
        console.error(`⚠️ ${error.message} Utilisation du template comme solution de repli.`);
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