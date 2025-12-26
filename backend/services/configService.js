// backend/services/configService.js - VERSION SIMPLIFIEE ET ROBUSTE

const fs = require('fs');
const path = require('path');
const os = require('os');

// Détection de l'environnement
const isElectron = typeof process.versions.electron !== 'undefined';
let isDev = true;
let electronApp = null;

// Essayer d'importer electron seulement si on est dans Electron
if (isElectron) {
    try {
        electronApp = require('electron').app;
        isDev = require('electron-is-dev');
    } catch (e) {
        // Silently fail - on est peut-être dans un worker ou subprocess
    }
}

/**
 * Calcule le chemin userData de manière fiable
 */
function getUserDataPath() {
    const envUserData = process.env.RDS_VIEWER_USER_DATA || process.env.APP_USER_DATA_DIR;
    if (envUserData) {
        return envUserData;
    }
    // 1. Si on a accès à electron.app, utiliser son userData
    if (electronApp) {
        try {
            return electronApp.getPath('userData');
        } catch (e) { }
    }

    // 2. Fallback: utiliser AppData/Roaming
    return path.join(os.homedir(), 'AppData', 'Roaming', 'RDS Viewer');
}

/**
 * Calcule le chemin de base de l'application
 */
function getBasePath() {
    // Si on est dans Electron packagé
    if (isElectron && !isDev && process.resourcesPath) {
        return process.resourcesPath;
    }
    // Sinon, remonter depuis __dirname
    return path.join(__dirname, '..', '..');
}

const userDataPath = getUserDataPath();
const basePath = getBasePath();

// Créer les dossiers nécessaires
const userConfigDir = path.join(userDataPath, 'config');
const userDataDir = path.join(userDataPath, 'data');

[userConfigDir, userDataDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        try { fs.mkdirSync(dir, { recursive: true }); } catch (e) { }
    }
});

const CONFIG_PATH = path.join(userConfigDir, 'config.json');
const TEMPLATE_CONFIG_PATH = path.join(basePath, 'config', 'config.template.json');

// Configuration par défaut fonctionnelle (sans dépendances externes)
const DEFAULT_CONFIG = {
    databasePath: path.join(userDataDir, 'rds_viewer_data.sqlite'),
    excelFilePath: '',  // Optionnel
    documentSyncPath: '', // Optionnel
    updateUrl: '',
    excelColumnMapping: {
        "Identifiant": "username",
        "Mot de passe": "password",
        "Office": "officePassword",
        "Nom complet": "displayName",
        "Service": "department",
        "Email": "email",
        "Serveur": "server"
    },
    rds_servers: ['SRV-RDS-1', 'SRV-RDS-2', 'SRV-RDS-3', 'SRV-RDS-4'],
    domain: '',
    username: '',
    password: '',
    server_groups: {
        "🏢 Infrastructure": [
            "SRV-AD-1", "SRV-AD-2", "SRV-AD-FLORENSUD", "SRV-DATA", "SRV-VPN-EDI"
        ],
        "🖥️ Services RDS": [
            "SRV-RDS-1", "SRV-RDS-2", "SRV-RDS-3", "SRV-RDS-4", "SRV-TSE-FLORENSUD"
        ],
        "📊 Applications": [
            "HRM-V9", "SAGERADIO64B", "SAGESEI_DOMAINENOK", "SRV-DIMENSION", "SRV-HOROQUARTZ",
            "SRV-ORACLE-SAGE", "SRV-QLIKVIEW", "SRV-QV", "SRV-SYRACUSE", "ServeurGED_DOMAINENOK", "ServeurQV_DOMAINENOK"
        ],
        "🔧 Autres": [
            "SRV-CENTOS-ZABBIX", "SRV-DIA", "SRWEXTRA01", "SRWINTRA01"
        ]
    },
    it_technicians: [],
    it_staff: []
};

let appConfig = null;
let isConfigValid = true; // Par défaut valide

/**
 * S'assure que le fichier config.json existe
 */
function ensureConfigExists() {
    if (fs.existsSync(CONFIG_PATH)) {
        return;
    }

    // Essayer de copier le template
    try {
        if (fs.existsSync(TEMPLATE_CONFIG_PATH)) {
            const templateContent = fs.readFileSync(TEMPLATE_CONFIG_PATH, 'utf-8');
            let config = JSON.parse(templateContent);

            // Remplacer les chemins invalides par des valeurs par défaut
            config.databasePath = DEFAULT_CONFIG.databasePath;
            if (config.excelFilePath?.includes('CHEMIN_RESEAU')) {
                config.excelFilePath = '';
            }
            if (config.documentSyncPath?.includes('CHEMIN_RESEAU')) {
                config.documentSyncPath = '';
            }

            fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
            console.log(`[Config] Configuration initialisée: ${CONFIG_PATH}`);
        } else {
            // Créer avec la config par défaut
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
            console.log(`[Config] Configuration par défaut créée: ${CONFIG_PATH}`);
        }
    } catch (err) {
        console.error('[Config] Erreur création config:', err.message);
        // Créer une config minimale
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
    }
}

/**
 * Charge la configuration
 */
async function loadConfigAsync() {
    ensureConfigExists();

    try {
        console.log(`[Config] Lecture de: ${CONFIG_PATH}`);
        const startTime = Date.now();
        const data = await fs.promises.readFile(CONFIG_PATH, 'utf-8');
        appConfig = JSON.parse(data);
        console.log(`[Config] ✅ Fichier config lu en ${Date.now() - startTime}ms`);

        // ✅ OPTIMISATION: Ne pas bloquer sur les chemins réseau
        // Définir les chemins réseau MAIS ne pas vérifier leur existence maintenant
        const NETWORK_DB_PATH = '\\\\192.168.1.230\\Donnees\\Informatique\\PROGRAMMES\\Programme RDS\\RDS Viewer Group\\rds_viewer_data.sqlite';
        const NETWORK_EXCEL_PATH = '\\\\192.168.1.230\\Donnees\\Informatique\\PROGRAMMES\\Programme RDS\\RDS Viewer Group\\Data_utilisateur_partage.xlsx';
        const NETWORK_DOC_PATH = '\\\\192.168.1.230\\Donnees\\Informatique\\Procédures';

        // Configurer les chemins sans vérification bloquante
        if (!appConfig.databasePath || !appConfig.databasePath.includes('192.168.1.230')) {
            console.log(`[Config] 📝 Chemin BDD configuré: ${NETWORK_DB_PATH}`);
            appConfig.databasePath = NETWORK_DB_PATH;
        }

        if (!appConfig.excelFilePath || appConfig.excelFilePath.includes('users.xlsx')) {
            console.log(`[Config] 📝 Chemin Excel configuré: ${NETWORK_EXCEL_PATH}`);
            appConfig.excelFilePath = NETWORK_EXCEL_PATH;
        }

        if (!appConfig.documentSyncPath || appConfig.documentSyncPath.includes('RDS_Viewer_Group\\documents')) {
            console.log(`[Config] 📝 Chemin DocSync configuré: ${NETWORK_DOC_PATH}`);
            appConfig.documentSyncPath = NETWORK_DOC_PATH;
        }

        // Sauvegarder la config de manière non-bloquante (ne pas attendre)
        saveConfig(appConfig).catch(err => console.warn('[Config] Warning sauvegarde config:', err.message));

        // CORRECTION SERVEURS MANQUANTS
        if (!appConfig.server_groups || Object.keys(appConfig.server_groups).length === 0) {
            console.log('[Config] 🔄 Restauration des groupes de serveurs par défaut');
            appConfig.server_groups = DEFAULT_CONFIG.server_groups;
            await saveConfig(appConfig);
        }

        // SYNC RDS_SERVERS
        if (appConfig.server_groups) {
            const rdsGroup = appConfig.server_groups['🖥️ Services RDS'] || [];
            const infraGroup = appConfig.server_groups['🏢 Infrastructure'] || [];
            // Combiner et dédupliquer
            const candidates = [...new Set([...rdsGroup, ...infraGroup])];
            // Filtrer pour ne garder que ceux qui ressemblent à des serveurs RDS (ou tout prendre si RDS group)
            // Ici on prend tout le groupe RDS + ceux qui ont RDS dans le nom
            const rdsList = [...new Set([
                ...rdsGroup,
                ...candidates.filter(s => s.toUpperCase().includes('RDS') || s.toUpperCase().includes('TSE'))
            ])];

            if (rdsList.length > 0 && (!appConfig.rds_servers || appConfig.rds_servers.length === 0)) {
                console.log(`[Config] 🔄 Synchro automatique rds_servers: ${rdsList.join(', ')}`);
                appConfig.rds_servers = rdsList;
                await saveConfig(appConfig);
            }
        }

        // La config est toujours considérée comme valide
        isConfigValid = true;
        console.log('✅ Configuration chargée avec succès.');

    } catch (error) {
        console.error(`[Config] Erreur lecture: ${error.message}`);
        appConfig = { ...DEFAULT_CONFIG };
        isConfigValid = true; // On continue quand meme
        saveConfig(appConfig).catch(err => console.warn('[Config] Warning sauvegarde config:', err.message));
    }
}

function getConfig() {
    return appConfig || DEFAULT_CONFIG;
}

function isConfigurationValid() {
    return isConfigValid;
}

async function saveConfig(newConfig) {
    try {
        const data = JSON.stringify(newConfig, null, 2);
        const tempPath = `${CONFIG_PATH}.tmp`;
        await fs.promises.writeFile(tempPath, data, 'utf-8');
        try {
            await fs.promises.rename(tempPath, CONFIG_PATH);
        } catch (renameError) {
            await fs.promises.writeFile(CONFIG_PATH, data, 'utf-8');
            await fs.promises.unlink(tempPath).catch(() => {});
        }
        appConfig = newConfig;
        return { success: true };
    } catch (error) {
        console.error('[Config] Erreur sauvegarde:', error.message);
        return { success: false, message: error.message };
    }
}


module.exports = {
    loadConfigAsync,
    getConfig,
    saveConfig,
    isConfigurationValid,
    get appConfig() { return appConfig || DEFAULT_CONFIG; },
    getUserDataPath: () => userDataPath,
    getBasePath: () => basePath
};




