/**
 * Service d'Indexation Réseau Automatique
 * Scan périodique + Génération embeddings automatique
 */

const fs = require('fs').promises;
const path = require('path');
const chokidar = require('chokidar');
const geminiService = require('./geminiService');
const documentParserService = require('./documentParserService');

class AutoIndexingService {
    constructor() {
        this.watcher = null;
        this.isRunning = false;
        this.isPaused = false;
        this.stats = {
            filesIndexed: 0,
            filesUpdated: 0,
            filesDeleted: 0,
            errors: 0,
            lastScan: null,
            currentProgress: 0,
            totalFiles: 0,
            estimatedTimeRemaining: 0
        };
        this.config = null;
        this.scanInterval = null;
        this.embeddingsCache = new Map(); // Cache LIMITÉ pour éviter saturation mémoire
        this.maxCacheSize = 100; // ⚠️ TSE: Cache MINIMAL (100 docs max au lieu de 1000)
        this.currentScanController = null; // Pour annuler scan en cours
        this.throttleDelay = 50; // ms entre chaque fichier (éviter saturation CPU)
        this.chunkSize = 10; // Traiter fichiers par lots de 10
    }

    /**
     * Démarre l'indexation automatique
     */
    async start(config) {
        if (this.isRunning) {
            console.log('[AutoIndexing] ⚠️ Déjà en cours');
            return { success: false, error: 'Déjà démarré' };
        }

        try {
            this.config = config;
            console.log('[AutoIndexing] 🚀 Démarrage...');
            console.log('[AutoIndexing] 📂 Chemin:', config.serverPath);
            console.log('[AutoIndexing] ⏱️  Intervalle:', config.scanInterval, 'minutes');

            // Vérifier que le chemin existe
            const pathExists = await this.checkPathExists(config.serverPath);
            if (!pathExists) {
                throw new Error(`Chemin réseau inaccessible: ${config.serverPath}`);
            }

            // Scan initial
            console.log('[AutoIndexing] 📊 Scan initial...');
            await this.scanAndIndex();

            // Watcher temps réel pour changements
            if (config.realtimeWatch) {
                this.startRealTimeWatcher();
            }

            // Scan périodique
            const intervalMs = (config.scanInterval || 30) * 60 * 1000;
            this.scanInterval = setInterval(() => {
                console.log('[AutoIndexing] 🔄 Scan périodique programmé');
                this.scanAndIndex();
            }, intervalMs);

            this.isRunning = true;
            console.log('[AutoIndexing] ✅ Démarré avec succès');

            return {
                success: true,
                stats: this.stats,
                config: {
                    path: config.serverPath,
                    interval: config.scanInterval,
                    realtimeWatch: config.realtimeWatch
                }
            };

        } catch (error) {
            console.error('[AutoIndexing] ❌ Erreur démarrage:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Arrête l'indexation automatique
     */
    async stop() {
        console.log('[AutoIndexing] 🛑 Arrêt...');

        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }

        if (this.watcher) {
            await this.watcher.close();
            this.watcher = null;
        }

        this.isRunning = false;
        console.log('[AutoIndexing] ✅ Arrêté');

        return {
            success: true,
            finalStats: this.stats
        };
    }

    /**
     * 🚀 SCAN OPTIMISÉ POUR 1 TO - Méthodique et non-bloquant
     */
    async scanAndIndex() {
        const startTime = Date.now();
        console.log('[AutoIndexing] 🔍 Début scan optimisé pour gros volume...');

        // Créer controller pour annulation
        this.currentScanController = { cancelled: false };

        try {
            // === ÉTAPE 1: Scan incrémental sans tout charger en mémoire ===
            console.log('[AutoIndexing] 📊 Comptage fichiers (sans chargement mémoire)...');
            const totalFiles = await this.countFilesOnly(this.config.serverPath);
            this.stats.totalFiles = totalFiles;

            console.log(`[AutoIndexing] 📄 ${totalFiles} fichiers à scanner`);

            if (totalFiles === 0) {
                console.log('[AutoIndexing] ⏭️  Aucun fichier à indexer');
                return { success: true, indexed: 0, errors: 0 };
            }

            // === ÉTAPE 2: Scan par chunks pour éviter saturation mémoire ===
            let indexed = 0;
            let errors = 0;
            let processedCount = 0;

            await this.scanDirectoryStreaming(
                this.config.serverPath,
                async (fileChunk) => {
                    // Vérifier si scan annulé
                    if (this.currentScanController.cancelled || this.isPaused) {
                        console.log('[AutoIndexing] ⏸️  Scan interrompu');
                        return false; // Stop scan
                    }

                    // Traiter chunk par chunk
                    for (const file of fileChunk) {
                        try {
                            await this.indexFile(file);
                            indexed++;
                        } catch (error) {
                            console.error(`[AutoIndexing] Erreur ${file.name}:`, error.message);
                            errors++;
                        }

                        processedCount++;

                        // Mise à jour progression
                        this.stats.currentProgress = Math.round((processedCount / totalFiles) * 100);

                        // Estimation temps restant
                        const elapsed = Date.now() - startTime;
                        const avgTimePerFile = elapsed / processedCount;
                        const remaining = (totalFiles - processedCount) * avgTimePerFile;
                        this.stats.estimatedTimeRemaining = Math.round(remaining / 1000); // secondes

                        // Log tous les 50 fichiers
                        if (processedCount % 50 === 0) {
                            console.log(`[AutoIndexing] Progression: ${processedCount}/${totalFiles} (${this.stats.currentProgress}%) - ETA: ${this.stats.estimatedTimeRemaining}s`);
                        }

                        // ⚡ THROTTLE: Pause entre fichiers pour ne pas saturer CPU
                        await this.sleep(this.throttleDelay);
                    }

                    // 🧹 NETTOYAGE MÉMOIRE: Forcer GC tous les 100 fichiers
                    if (processedCount % 100 === 0) {
                        this.cleanupMemory();
                    }

                    return true; // Continue scan
                }
            );

            this.stats.filesIndexed += indexed;
            this.stats.errors += errors;
            this.stats.lastScan = new Date().toISOString();
            this.stats.currentProgress = 100;

            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log(`[AutoIndexing] ✅ Scan terminé: ${indexed} indexés, ${errors} erreurs (${duration}s)`);

            return {
                success: true,
                indexed,
                errors,
                duration,
                totalFiles
            };

        } catch (error) {
            console.error('[AutoIndexing] ❌ Erreur scan:', error);
            return {
                success: false,
                error: error.message
            };
        } finally {
            this.currentScanController = null;
        }
    }

    /**
     * Compte fichiers sans les charger en mémoire
     */
    async countFilesOnly(dirPath, count = 0) {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);

                if (entry.isDirectory()) {
                    if (this.shouldExcludeFolder(entry.name)) continue;
                    count = await this.countFilesOnly(fullPath, count);
                } else {
                    if (this.isAllowedFile(entry.name)) {
                        count++;
                    }
                }
            }

            return count;
        } catch (error) {
            return count;
        }
    }

    /**
     * Scan streaming par chunks (évite charger tous les fichiers en mémoire)
     */
    async scanDirectoryStreaming(dirPath, chunkCallback, currentChunk = []) {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);

                if (entry.isDirectory()) {
                    if (this.shouldExcludeFolder(entry.name)) continue;
                    await this.scanDirectoryStreaming(fullPath, chunkCallback, currentChunk);
                } else {
                    if (this.isAllowedFile(entry.name)) {
                        const stats = await fs.stat(fullPath);
                        currentChunk.push({
                            path: fullPath,
                            name: entry.name,
                            size: stats.size,
                            modified: stats.mtime
                        });

                        // Traiter chunk quand atteint chunkSize
                        if (currentChunk.length >= this.chunkSize) {
                            const shouldContinue = await chunkCallback([...currentChunk]);
                            currentChunk.length = 0; // Vider chunk

                            if (!shouldContinue) {
                                return; // Stop scan
                            }
                        }
                    }
                }
            }

            // Traiter chunk restant
            if (currentChunk.length > 0) {
                await chunkCallback([...currentChunk]);
                currentChunk.length = 0;
            }

        } catch (error) {
            console.error(`[AutoIndexing] Erreur scan streaming ${dirPath}:`, error.message);
        }
    }

    /**
     * Nettoyage mémoire agressif pour TSE
     */
    cleanupMemory() {
        // Limiter cache embeddings
        if (this.embeddingsCache.size > this.maxCacheSize) {
            const keysToDelete = Array.from(this.embeddingsCache.keys())
                .slice(0, this.embeddingsCache.size - this.maxCacheSize);

            keysToDelete.forEach(key => this.embeddingsCache.delete(key));
            console.log(`[AutoIndexing] 🧹 Cache nettoyé: ${keysToDelete.length} entrées supprimées`);
        }

        // Forcer garbage collection si disponible
        if (global.gc) {
            global.gc();
            console.log('[AutoIndexing] 🗑️  GC forcé');
        }
    }

    /**
     * Pause le scan en cours
     */
    pause() {
        this.isPaused = true;
        console.log('[AutoIndexing] ⏸️  Scan mis en pause');
    }

    /**
     * Reprend le scan
     */
    resume() {
        this.isPaused = false;
        console.log('[AutoIndexing] ▶️  Scan repris');
    }

    /**
     * Annule le scan en cours
     */
    cancelScan() {
        if (this.currentScanController) {
            this.currentScanController.cancelled = true;
            console.log('[AutoIndexing] ❌ Scan annulé');
        }
    }

    /**
     * Helper: sleep non-bloquant
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Scan récursif d'un répertoire
     */
    async scanDirectory(dirPath, filesList = []) {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);

                // Ignorer dossiers exclus
                if (entry.isDirectory()) {
                    if (this.shouldExcludeFolder(entry.name)) {
                        continue;
                    }
                    await this.scanDirectory(fullPath, filesList);
                } else {
                    // Vérifier extension autorisée
                    if (this.isAllowedFile(entry.name)) {
                        const stats = await fs.stat(fullPath);
                        filesList.push({
                            path: fullPath,
                            name: entry.name,
                            size: stats.size,
                            modified: stats.mtime
                        });
                    }
                }
            }

            return filesList;

        } catch (error) {
            console.error(`[AutoIndexing] Erreur scan ${dirPath}:`, error.message);
            return filesList;
        }
    }

    /**
     * Indexe un fichier avec génération d'embeddings
     */
    async indexFile(file) {
        try {
            console.log(`[AutoIndexing] 📝 Indexation: ${file.name}`);

            // === 1. Extraction contenu ===
            const content = await this.extractFileContent(file.path);

            if (!content || content.length < 10) {
                console.log(`[AutoIndexing] ⏭️  Fichier vide ou trop court: ${file.name}`);
                return;
            }

            // === 2. Génération embedding avec Gemini ===
            const embedding = await this.generateEmbedding(content);

            if (!embedding) {
                console.warn(`[AutoIndexing] ⚠️ Pas d'embedding pour: ${file.name}`);
            }

            // === 3. Sauvegarde dans base de données ===
            await this.saveToDatabase({
                filename: file.name,
                filepath: file.path,
                content: content.substring(0, 5000), // Limiter taille stockée
                embedding: embedding,
                size: file.size,
                modifiedDate: file.modified,
                indexedAt: new Date()
            });

            console.log(`[AutoIndexing] ✅ Indexé: ${file.name}`);

        } catch (error) {
            console.error(`[AutoIndexing] Erreur indexation ${file.name}:`, error);
            throw error;
        }
    }

    /**
     * Génère embedding avec Gemini
     */
    async generateEmbedding(text) {
        try {
            // Vérifier cache
            const cacheKey = this.hash(text);
            if (this.embeddingsCache.has(cacheKey)) {
                console.log('[AutoIndexing] 💾 Cache hit embedding');
                return this.embeddingsCache.get(cacheKey);
            }

            // Générer avec Gemini
            const result = await geminiService.generateEmbedding(text.substring(0, 2000));

            if (result.success) {
                const embedding = result.embedding;

                // Mettre en cache (limiter taille cache)
                if (this.embeddingsCache.size > 1000) {
                    const firstKey = this.embeddingsCache.keys().next().value;
                    this.embeddingsCache.delete(firstKey);
                }
                this.embeddingsCache.set(cacheKey, embedding);

                return embedding;
            }

            return null;

        } catch (error) {
            console.error('[AutoIndexing] Erreur génération embedding:', error);
            return null;
        }
    }

    /**
     * Watcher temps réel pour détecter changements
     */
    startRealTimeWatcher() {
        console.log('[AutoIndexing] 👀 Démarrage watcher temps réel...');

        this.watcher = chokidar.watch(this.config.serverPath, {
            ignored: this.config.excludedFolders,
            persistent: true,
            ignoreInitial: true, // Ne pas traiter fichiers existants
            awaitWriteFinish: {
                stabilityThreshold: 2000,
                pollInterval: 100
            }
        });

        this.watcher
            .on('add', filePath => {
                console.log(`[AutoIndexing] 🆕 Nouveau fichier: ${filePath}`);
                this.handleFileAdded(filePath);
            })
            .on('change', filePath => {
                console.log(`[AutoIndexing] 📝 Fichier modifié: ${filePath}`);
                this.handleFileChanged(filePath);
            })
            .on('unlink', filePath => {
                console.log(`[AutoIndexing] 🗑️  Fichier supprimé: ${filePath}`);
                this.handleFileDeleted(filePath);
            })
            .on('error', error => {
                console.error('[AutoIndexing] ❌ Erreur watcher:', error);
            });

        console.log('[AutoIndexing] ✅ Watcher actif');
    }

    /**
     * Handlers événements watcher
     */
    async handleFileAdded(filePath) {
        try {
            const stats = await fs.stat(filePath);
            await this.indexFile({
                path: filePath,
                name: path.basename(filePath),
                size: stats.size,
                modified: stats.mtime
            });
            this.stats.filesIndexed++;
        } catch (error) {
            console.error('[AutoIndexing] Erreur ajout fichier:', error);
            this.stats.errors++;
        }
    }

    async handleFileChanged(filePath) {
        try {
            const stats = await fs.stat(filePath);
            await this.indexFile({
                path: filePath,
                name: path.basename(filePath),
                size: stats.size,
                modified: stats.mtime
            });
            this.stats.filesUpdated++;
        } catch (error) {
            console.error('[AutoIndexing] Erreur mise à jour fichier:', error);
            this.stats.errors++;
        }
    }

    async handleFileDeleted(filePath) {
        try {
            await this.removeFromDatabase(filePath);
            this.stats.filesDeleted++;
        } catch (error) {
            console.error('[AutoIndexing] Erreur suppression fichier:', error);
            this.stats.errors++;
        }
    }

    /**
     * Extraction contenu selon type de fichier
     */
    async extractFileContent(filePath) {
        try {
            const ext = path.extname(filePath).toLowerCase();

            // Utiliser documentParserService existant
            const buffer = await fs.readFile(filePath);
            const result = await documentParserService.parseDocument(buffer, ext.substring(1));

            return result.text || '';

        } catch (error) {
            console.error('[AutoIndexing] Erreur extraction:', error);
            return '';
        }
    }

    /**
     * Helpers
     */
    async checkPathExists(dirPath) {
        try {
            await fs.access(dirPath);
            return true;
        } catch {
            return false;
        }
    }

    shouldExcludeFolder(folderName) {
        const excluded = this.config.excludedFolders || [];
        return excluded.some(ex => folderName.includes(ex));
    }

    isAllowedFile(filename) {
        const allowed = this.config.allowedExtensions || ['*'];
        if (allowed.includes('*')) return true;

        const ext = path.extname(filename).toLowerCase();
        return allowed.some(a => ext === `.${a}` || ext === a);
    }

    hash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }

    /**
     * Méthodes de base de données (à implémenter selon DB utilisée)
     */
    async saveToDatabase(data) {
        // TODO: Implémenter sauvegarde selon DB
        // Pour l'instant, log uniquement
        console.log('[AutoIndexing] 💾 Sauvegarde DB:', data.filename);
    }

    async removeFromDatabase(filePath) {
        // TODO: Implémenter suppression selon DB
        console.log('[AutoIndexing] 🗑️  Suppression DB:', filePath);
    }

    /**
     * Obtenir statistiques
     */
    getStats() {
        return {
            ...this.stats,
            isRunning: this.isRunning,
            cacheSize: this.embeddingsCache.size
        };
    }
}

module.exports = new AutoIndexingService();
