// backend/services/excelService.js - VERSION CORRIGÉE POUR LA LECTURE DU CHEMIN EXCEL

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
    if (!localExcelCachePath) {
        const dbPath = configService.getConfig().databasePath;
        if (dbPath) {
            localExcelCachePath = path.join(path.dirname(dbPath), 'cache-excel.json');
        } else {
            console.warn("Chemin de base de données non défini, le cache Excel local est désactivé.");
        }
    }
    return localExcelCachePath;
}

async function readExcelFileAsync() {
    // **CORRECTION : Utiliser getConfig() pour s'assurer que la configuration est chargée.**
    const config = configService.getConfig();
    const excelPath = config.excelFilePath; // La clé doit être 'excelFilePath'

    const now = Date.now();
    if (memoryCache && memoryCacheTimestamp && (now - memoryCacheTimestamp) < MEMORY_CACHE_TTL) {
        console.log('🔦 Utilisation cache mémoire Excel');
        return { success: true, users: memoryCache, fromMemoryCache: true };
    }

    const currentCachePath = getCachePath();

    try {
        if (!excelPath || !fs.existsSync(excelPath)) {
            // **MESSAGE D'ERREUR AMÉLIORÉ**
            throw new Error(`Fichier Excel introuvable ou chemin non configuré. Vérifiez la clé 'excelFilePath' dans votre config.json. Chemin actuel: ${excelPath}`);
        }

        const workbook = XLSX.readFile(excelPath, { cellDates: true, cellNF: false, cellStyles: false });
        const sheetName = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: false, defval: '' });

        // **CORRECTION : S'assurer que 'excelColumnMapping' est bien lu depuis la config.**
        const columnMapping = config.excelColumnMapping || {
            'Identifiant': 'username',
            'Nom Complet': 'displayName',
            'Serveur': 'server',
            'Mot de passe': 'password'
        };

        const usersByServer = data.reduce((acc, row) => {
            const user = Object.entries(columnMapping).reduce((obj, [excelHeader, userKey]) => {
                if (row[excelHeader] !== undefined) obj[userKey] = String(row[excelHeader]).trim();
                return obj;
            }, {});

            if (user.username) {
                const server = user.server || (config.rds_servers ? config.rds_servers[0] : 'default');
                (acc[server] = acc[server] || []).push(user);
            }
            return acc;
        }, {});

        if (currentCachePath) {
            await safeWriteJsonFile(currentCachePath, usersByServer);
        }
        memoryCache = usersByServer;
        memoryCacheTimestamp = now;

        console.log(`✅ Excel chargé: ${Object.values(usersByServer).flat().length} utilisateurs`);
        return { success: true, users: usersByServer };

    } catch (error) {
        console.warn('⚠️ Erreur lecture Excel, utilisation du cache:', error.message);
        
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

// ... (les autres fonctions saveUserToExcel, deleteUserFromExcel restent similaires mais doivent aussi utiliser getConfig())

async function saveUserToExcel({ user, isEdit }) {
    const config = configService.getConfig();
    const excelPath = config.excelFilePath;
    const columnMapping = config.excelColumnMapping || {};
    
    try {
        if (!excelPath || !fs.existsSync(excelPath)) throw new Error(`Fichier introuvable: ${excelPath}`);

        const workbook = XLSX.readFile(excelPath);
        const sheetName = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const reverseMapping = Object.entries(columnMapping).reduce((acc, [key, value]) => ({ ...acc, [value]: key }), {});
        const excelRow = Object.entries(user).reduce((acc, [key, value]) => {
            if (reverseMapping[key]) acc[reverseMapping[key]] = value;
            return acc;
        }, {});

        const usernameColumn = reverseMapping.username || 'Identifiant';
        const index = data.findIndex(row => row[usernameColumn] === user.username);
        
        if (isEdit && index !== -1) {
            data[index] = { ...data[index], ...excelRow };
        } else if (!isEdit) {
            data.push(excelRow);
        } else {
            throw new Error(`Utilisateur ${user.username} non trouvé`);
        }

        const newWs = XLSX.utils.json_to_sheet(data);
        const newWb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(newWb, newWs, sheetName);
        XLSX.writeFile(newWb, excelPath);

        invalidateCache();
        return { success: true, message: `Utilisateur ${isEdit ? 'mis à jour' : 'ajouté'}` };

    } catch (error) {
        console.error('❌ Erreur sauvegarde Excel:', error.message);
        return { success: false, error: error.message };
    }
}

async function deleteUserFromExcel({ username }) {
    const config = configService.getConfig();
    const excelPath = config.excelFilePath;
    const columnMapping = config.excelColumnMapping || {};

    try {
        if (!excelPath || !fs.existsSync(excelPath)) throw new Error(`Fichier introuvable: ${excelPath}`);

        const workbook = XLSX.readFile(excelPath);
        const sheetName = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const reverseMapping = Object.entries(columnMapping).reduce((acc, [key, value]) => ({ ...acc, [value]: key }), {});
        const usernameColumn = reverseMapping.username || 'Identifiant';

        const updatedData = data.filter(row => row[usernameColumn] !== username);

        if (updatedData.length === data.length) throw new Error(`Utilisateur ${username} non trouvé`);

        const newWs = XLSX.utils.json_to_sheet(updatedData);
        const newWb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(newWb, newWs, sheetName);
        XLSX.writeFile(newWb, excelPath);

        invalidateCache();
        return { success: true, message: 'Utilisateur supprimé' };
    } catch (error) {
        console.error('❌ Erreur suppression Excel:', error.message);
        return { success: false, error: error.message };
    }
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
