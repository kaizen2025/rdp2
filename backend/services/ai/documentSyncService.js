// backend/services/ai/documentSyncService.js
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const db = require('../databaseService');
const aiService = require('./aiService');

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
    console.log(`[DocSync] Starting synchronization for directory: ${directory}`);
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
                size: fileInfo.stats.size
            };
            await aiService.uploadDocument(fileObject);
            updateManifest(filePath, hash, fileInfo.lastModified);
        }
    }

    // Check for deleted files by comparing the manifest with the files found on disk
    for (const filePath in currentManifest) {
        if (!currentFiles[filePath]) {
            console.log(`[DocSync] Detected deleted file: ${filePath}`);
            const document = db.getAIDocumentByFilePath(filePath);
            if (document) {
                await aiService.deleteDocument(document.id);
            }
            deleteFromManifest(filePath);
        }
    }

    console.log('[DocSync] Synchronization complete.');
};

// Scheduler to run the sync periodically
let syncInterval = null;

const start = (directory) => {
    if (syncInterval) {
        clearInterval(syncInterval);
    }
    // Run sync every 15 minutes
    syncInterval = setInterval(() => synchronizeDocuments(directory), 15 * 60 * 1000);
    // Also run on startup
    synchronizeDocuments(directory);
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
