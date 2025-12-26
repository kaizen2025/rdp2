// backend/services/ai/documentSyncService.js
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const db = require('../databaseService');
const aiDatabaseService = require('./aiDatabaseService');
const AIService = require('./aiService');
const aiService = new AIService(aiDatabaseService);

// Function to calculate the SHA256 hash of a file
const calculateHash = async (filePath) => {
    const fileBuffer = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
};

// Get the last known state of the documents from the database
const getDocumentManifest = () => {
    const rows = db.all('SELECT * FROM ai_document_manifest');
    const manifest = {};
    rows.forEach(row => {
        manifest[row.filePath] = { hash: row.hash, lastModified: row.lastModified };
    });
    return manifest;
};

// Update the document manifest in the database
const updateManifest = (filePath, hash, lastModified) => {
    db.run(
        'INSERT OR REPLACE INTO ai_document_manifest (filePath, hash, lastModified) VALUES (?, ?, ?)',
        [filePath, hash, lastModified]
    );
};

// Delete a document from the manifest
const deleteFromManifest = (filePath) => {
    db.run('DELETE FROM ai_document_manifest WHERE filePath = ?', [filePath]);
};

// Helper function to recursively scan a directory and populate the currentFiles object
const scanDirectoryRecursive = async (directory, currentFiles) => {
    try {
        const entries = await fs.readdir(directory, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                await scanDirectoryRecursive(fullPath, currentFiles);
            } else if (entry.isFile()) {
                const stats = await fs.stat(fullPath);
                currentFiles[fullPath] = { lastModified: stats.mtime.toISOString(), stats: stats };
            }
        }
    } catch (error) {
        console.error(`[DocSync] Error scanning directory ${directory}:`, error);
    }
};

// The main synchronization function
const synchronizeDocuments = async (directory) => {
    try {
        console.log(`[DocSync] Starting synchronization for directory: ${directory}`);

        // Vérifier que le répertoire existe
        try {
            await fs.access(directory);
        } catch (error) {
            console.warn(`[DocSync] Le répertoire ${directory} n'existe pas ou n'est pas accessible. Synchronisation annulée.`);
            return;
        }

        try {
            aiDatabaseService.initialize();
        } catch (error) {
            console.error('[DocSync] Initialisation IA impossible:', error.message);
            return;
        }

        const currentManifest = getDocumentManifest();
        const currentFiles = {};

        // Recursively scan the directory to get a flat list of all files
        await scanDirectoryRecursive(directory, currentFiles);

        // Process all found files (new or modified)
        for (const filePath in currentFiles) {
            const fileInfo = currentFiles[filePath];

            // If lastModified is the same, no need to re-calculate hash.
            if (currentManifest[filePath] && currentManifest[filePath].lastModified === fileInfo.lastModified) {
                continue;
            }

            // File is new or modified, calculate hash
            const hash = await calculateHash(filePath);

            if (!currentManifest[filePath] || currentManifest[filePath].hash !== hash) {
                console.log(`[DocSync] Detected new or updated file: ${filePath}`);
                const fileBuffer = await fs.readFile(filePath);
                const fileObject = {
                    originalname: path.basename(filePath),
                    buffer: fileBuffer,
                    mimetype: 'application/octet-stream', // A library could be used for more accuracy
                    size: fileInfo.stats.size,
                    filepath: filePath
                };
                await aiService.uploadDocument(fileObject);
                updateManifest(filePath, hash, fileInfo.lastModified);
            }
        }

        // Check for deleted files by comparing the manifest with the files found on disk
        for (const filePath in currentManifest) {
            if (!currentFiles[filePath]) {
                console.log(`[DocSync] Detected deleted file: ${filePath}`);
                try {
                    // Recherche du document dans la base de données via une requête SQL directe
                    const document = db.get('SELECT * FROM ai_documents WHERE filepath = ?', [filePath]);
                    if (document) {
                        await aiService.deleteDocument(document.id);
                    }
                } catch (err) {
                    console.error(`[DocSync] Erreur lors de la suppression du document ${filePath}:`, err);
                }
                deleteFromManifest(filePath);
            }
        }

        console.log('[DocSync] Synchronization complete.');
    } catch (error) {
        console.error('[DocSync] Erreur lors de la synchronisation:', error);
    }
};

// Scheduler to run the sync periodically
let syncInterval = null;

const start = (directory) => {
    try {
        if (syncInterval) {
            clearInterval(syncInterval);
        }
        // Run sync every 15 minutes
        syncInterval = setInterval(() => synchronizeDocuments(directory), 15 * 60 * 1000);
        // Also run on startup (but don't block)
        synchronizeDocuments(directory).catch(err => {
            console.error('[DocSync] Erreur lors du premier lancement de la synchronisation:', err);
        });
    } catch (error) {
        console.error('[DocSync] Erreur lors du démarrage du service de synchronisation:', error);
    }
};

const stop = () => {
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
    }
};

module.exports = {
    start,
    stop,
    synchronizeDocuments,
};
