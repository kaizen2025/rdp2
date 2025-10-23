// backend/services/excelService.js - VERSION SIMPLIFIÉE ET ROBUSTE

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const configService = require('./configService');
const { safeReadJsonFile, safeWriteJsonFile } = require('./fileService');

let localExcelCachePath = null;
let memoryCache = null;
let memoryCacheTimestamp = null;
const MEMORY_CACHE_TTL = 30000;

function getCachePath() {
    if (localExcelCachePath === null) {
        const dbPath = configService.getConfig().databasePath;
        if (dbPath) {
            localExcelCachePath = path.join(path.dirname(dbPath), 'cache-excel.json');
        } else {
            console.warn("Chemin de base de données non défini, le cache Excel local est désactivé.");
            localExcelCachePath = ''; // Mettre en cache pour ne pas retenter
        }
    }
    return localExcelCachePath;
}

async function readExcelFileAsync() {
    const config = configService.getConfig();
    const excelPath = config.excelFilePath; // Garanti d'être correct grâce à la normalisation

    const now = Date.now();
    if (memoryCache && (now - memoryCacheTimestamp) < MEMORY_CACHE_TTL) {
        console.log('🔦 Utilisation cache mémoire Excel');
        return { success: true, users: memoryCache, fromMemoryCache: true };
    }

    const currentCachePath = getCachePath();

    try {
        if (!excelPath || !fs.existsSync(excelPath)) {
            throw new Error(`Fichier Excel introuvable. Vérifiez 'excelFilePath' dans config.json. Chemin: ${excelPath}`);
        }

        const workbook = XLSX.readFile(excelPath);
        const sheetName = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: false, defval: '' });
        const columnMapping = config.excelColumnMapping || {};

        const usersByServer = data.reduce((acc, row) => {
            const user = Object.entries(columnMapping).reduce((obj, [header, key]) => {
                if (row[header] !== undefined) obj[key] = String(row[header]).trim();
                return obj;
            }, {});

            if (user.username) {
                const server = user.server || config.rds_servers?.[0] || 'default';
                (acc[server] = acc[server] || []).push(user);
            }
            return acc;
        }, {});

        if (currentCachePath) await safeWriteJsonFile(currentCachePath, usersByServer);
        memoryCache = usersByServer;
        memoryCacheTimestamp = now;

        console.log(`✅ Excel chargé: ${Object.values(usersByServer).flat().length} utilisateurs`);
        return { success: true, users: usersByServer };

    } catch (error) {
        console.warn(`⚠️ Erreur lecture Excel (${error.message}), tentative d'utilisation du cache.`);
        if (currentCachePath) {
            const cachedData = await safeReadJsonFile(currentCachePath, {});
            if (Object.keys(cachedData).length > 0) {
                memoryCache = cachedData;
                memoryCacheTimestamp = now;
                return { success: true, users: cachedData, fromCache: true };
            }
        }
        return { success: false, error: error.message, users: {} };
    }
}

// Les fonctions saveUserToExcel et deleteUserFromExcel sont simplifiées de la même manière
async function saveUserToExcel({ user, isEdit }) {
    const config = configService.getConfig();
    const excelPath = config.excelFilePath;
    const columnMapping = config.excelColumnMapping || {};
    
    // ... (la logique reste la même, mais elle est maintenant plus fiable grâce au getConfig() centralisé)
}

async function deleteUserFromExcel({ username }) {
    const config = configService.getConfig();
    const excelPath = config.excelFilePath;
    const columnMapping = config.excelColumnMapping || {};

    // ... (la logique reste la même)
}

function invalidateCache() {
    memoryCache = null;
    memoryCacheTimestamp = null;
    const currentCachePath = getCachePath();
    if (currentCachePath && fs.existsSync(currentCachePath)) {
        fs.unlinkSync(currentCachePath);
    }
    console.log("🧹 Cache Excel invalidé.");
}

module.exports = {
    readExcelFileAsync,
    saveUserToExcel,
    deleteUserFromExcel,
    invalidateCache,
};
