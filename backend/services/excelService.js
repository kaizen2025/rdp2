// backend/services/excelService.js

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const configService = require('./configService');
const { safeReadJsonFile, safeWriteJsonFile } = require('./fileService');

let memoryCache = null;
let memoryCacheTimestamp = null;
const MEMORY_CACHE_TTL = 30000; // 30 secondes de cache en mémoire

function getCachePath() {
    const dbPath = configService.getConfig().databasePath;
    if (dbPath) {
        // Place le cache dans le même dossier que la base de données pour la cohérence
        return path.join(path.dirname(dbPath), 'cache-excel.json');
    }
    console.warn("Chemin de la base de données non défini, le cache disque Excel est désactivé.");
    return null;
}

async function readExcelFileAsync() {
    const config = configService.getConfig();
    const excelPath = config.excelFilePath;
    const now = Date.now();

    // 1. Tenter d'utiliser le cache mémoire rapide
    if (memoryCache && (now - memoryCacheTimestamp) < MEMORY_CACHE_TTL) {
        console.log('🔦 Utilisation du cache mémoire Excel.');
        return { success: true, users: memoryCache, fromMemoryCache: true };
    }

    try {
        if (!excelPath || !fs.existsSync(excelPath)) {
            throw new Error(`Fichier Excel introuvable. Vérifiez le chemin dans config.json. Chemin actuel: ${excelPath}`);
        }

        // 2. Tenter de lire le fichier Excel
        const workbook = XLSX.readFile(excelPath, { cellStyles: false }); // cellStyles: false peut aider avec les fichiers verrouillés
        const sheetName = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: false, defval: '' });

        const columnMapping = config.excelColumnMapping;
        if (!columnMapping || !columnMapping['Identifiant'] || !columnMapping['Nom complet']) {
             throw new Error("La section 'excelColumnMapping' dans config.json est manquante ou incomplète. 'Identifiant' et 'Nom complet' sont requis.");
        }

        const usersByServer = data.reduce((acc, row) => {
            const user = {};
            for (const [header, key] of Object.entries(columnMapping)) {
                user[key] = row[header] !== undefined ? String(row[header]).trim() : '';
            }

            if (user.username) {
                const server = user.server || config.rds_servers?.[0] || 'default';
                (acc[server] = acc[server] || []).push(user);
            }
            return acc;
        }, {});

        const userCount = Object.values(usersByServer).flat().length;
        if (userCount === 0) {
            console.warn("⚠️ Le fichier Excel a été lu, mais aucun utilisateur n'a été trouvé. Vérifiez le mapping des colonnes.");
        } else {
             console.log(`✅ Fichier Excel chargé: ${userCount} utilisateurs trouvés.`);
        }

        // 3. Mettre à jour les caches (disque et mémoire)
        const cachePath = getCachePath();
        if (cachePath) await safeWriteJsonFile(cachePath, usersByServer);
        memoryCache = usersByServer;
        memoryCacheTimestamp = now;

        return { success: true, users: usersByServer };

    } catch (error) {
        // 4. En cas d'échec, tenter de charger depuis le cache disque
        console.warn(`⚠️ Erreur lecture Excel (${error.message}), tentative d'utilisation du cache disque.`);
        const cachePath = getCachePath();
        if (cachePath) {
            const cachedData = await safeReadJsonFile(cachePath, {});
            if (Object.keys(cachedData).length > 0) {
                console.log('✅ Chargement réussi depuis le cache disque Excel.');
                memoryCache = cachedData;
                memoryCacheTimestamp = now;
                return { success: true, users: cachedData, fromCache: true, warning: 'Using cached data, Excel file is locked or unavailable.' };
            }
        }
        
        // 5. Si tout échoue
        return { success: false, error: error.message, users: {} };
    }
}

async function saveUserToExcel({ user, isEdit }) {
    const config = configService.getConfig();
    const excelPath = config.excelFilePath;
    const columnMapping = config.excelColumnMapping;
    const reverseMapping = Object.entries(columnMapping).reduce((acc, [key, value]) => ({ ...acc, [value]: key }), {});

    try {
        const workbook = XLSX.readFile(excelPath);
        const sheetName = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        
        const userRow = {};
        for (const key in user) {
            if (reverseMapping[key]) {
                userRow[reverseMapping[key]] = user[key];
            }
        }
        
        const userIndex = data.findIndex(row => row[reverseMapping.username] === user.username);
        
        if (isEdit && userIndex > -1) {
            data[userIndex] = { ...data[userIndex], ...userRow };
        } else if (!isEdit && userIndex === -1) {
            data.push(userRow);
        } else if (!isEdit && userIndex > -1) {
            throw new Error(`L'utilisateur ${user.username} existe déjà.`);
        } else {
            throw new Error(`L'utilisateur ${user.username} à modifier est introuvable.`);
        }

        const newSheet = XLSX.utils.json_to_sheet(data, { header: Object.keys(columnMapping) });
        workbook.Sheets[sheetName] = newSheet;
        XLSX.writeFile(workbook, excelPath);

        invalidateCache();
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function deleteUserFromExcel({ username }) {
    const config = configService.getConfig();
    const excelPath = config.excelFilePath;
    const columnMapping = config.excelColumnMapping;
    const usernameHeader = Object.keys(columnMapping).find(key => columnMapping[key] === 'username');

    try {
        const workbook = XLSX.readFile(excelPath);
        const sheetName = workbook.SheetNames[0];
        let data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        
        const initialLength = data.length;
        data = data.filter(row => row[usernameHeader] !== username);

        if (data.length === initialLength) {
            throw new Error(`Utilisateur "${username}" non trouvé.`);
        }
        
        const newSheet = XLSX.utils.json_to_sheet(data, { header: Object.keys(columnMapping) });
        workbook.Sheets[sheetName] = newSheet;
        XLSX.writeFile(workbook, excelPath);

        invalidateCache();
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function invalidateCache() {
    memoryCache = null;
    memoryCacheTimestamp = null;
    const cachePath = getCachePath();
    if (cachePath && fs.existsSync(cachePath)) {
        try {
            fs.unlinkSync(cachePath);
        } catch (e) {
            console.warn("Impossible de supprimer le cache disque Excel:", e.message);
        }
    }
    console.log("🧹 Cache Excel invalidé.");
}

module.exports = { readExcelFileAsync, saveUserToExcel, deleteUserFromExcel, invalidateCache };