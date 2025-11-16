const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const multer = require('multer');
const mime = require('mime-types');
const { v4: uuidv4 } = require('uuid');

/**
 * Système de Configuration des Photos DocuCortex
 * Gère l'upload, validation, compression et stockage sécurisé des photos de techniciens
 */
class PhotoConfigurationSystem {
    constructor() {
        this.config = this.loadConfiguration();
        this.initializeDirectories();
        this.initializeDatabase();
    }

    /**
     * Configuration par défaut
     */
    loadConfiguration() {
        return {
            // Configuration d'upload
            upload: {
                maxFileSize: 10 * 1024 * 1024, // 10MB
                allowedFormats: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
                maxDimensions: { width: 4096, height: 4096 },
                minDimensions: { width: 100, height: 100 },
                maxFilesPerTechnician: 50,
                maxConcurrentUploads: 5
            },

            // Configuration de compression
            compression: {
                enabled: true,
                quality: {
                    thumbnail: 70,
                    medium: 80,
                    original: 90,
                    web: 75
                },
                resize: {
                    thumbnail: { width: 150, height: 150 },
                    medium: { width: 800, height: 600 },
                    web: { width: 1920, height: 1080 },
                    original: { width: 4096, height: 4096 }
                },
                formats: {
                    thumbnails: 'webp',
                    medium: 'jpeg',
                    web: 'webp',
                    original: 'jpeg'
                }
            },

            // Configuration de stockage
            storage: {
                basePath: '/var/docucortex/uploads/photos',
                tempPath: '/var/docucortex/temp',
                backupPath: '/var/docucortex/backups/photos',
                publicPath: '/public/uploads/photos',
                encryptionEnabled: true,
                cdnEnabled: false,
                cloudProvider: 'local', // local, aws, gcp, azure
                cloudConfig: {}
            },

            // Configuration de sécurité
            security: {
                encryptFiles: true,
                validateMetadata: true,
                scanForMalware: true,
                hashAlgorithm: 'sha256',
                retentionDays: 2555, // 7 ans
                accessControl: {
                    authenticatedUsers: true,
                    technicianOnly: true,
                    requireApproval: false,
                    watermark: false
                }
            },

            // Configuration d'administration
            admin: {
                enabled: true,
                maxAdmins: 10,
                approvalRequired: false,
                notificationEmail: 'admin@docucortex.com',
                autoModeration: true,
                aiContentModeration: false,
                auditLog: true
            },

            // Configuration de synchronisation
            sync: {
                enabled: true,
                interval: 300000, // 5 minutes
                retryAttempts: 3,
                batchSize: 10,
                compressionMode: 'async', // sync, async, queue
                conflictResolution: 'timestamp' // timestamp, manual, version
            },

            // Configuration de backup
            backup: {
                enabled: true,
                schedule: '0 2 * * *', // 2h du matin
                retention: 90, // jours
                compressionLevel: 6,
                encryptionKey: null,
                remoteBackup: false,
                cloudBackup: false
            },

            // Configuration API
            api: {
                rateLimit: {
                    enabled: true,
                    windowMs: 900000, // 15 minutes
                    max: 100, // requêtes par fenêtre
                    skipSuccessfulRequests: false,
                    skipFailedRequests: false
                },
                endpoints: {
                    upload: true,
                    delete: true,
                    batch: true,
                    resize: true,
                    metadata: true,
                    stats: true
                }
            },

            // Configuration de monitoring
            monitoring: {
                logLevel: 'info', // debug, info, warn, error
                metricsEnabled: true,
                alertsEnabled: true,
                performanceTracking: true,
                healthChecks: true
            }
        };
    }

    /**
     * Initialise les répertoires nécessaires
     */
    initializeDirectories() {
        const dirs = [
            this.config.storage.basePath,
            this.config.storage.tempPath,
            this.config.storage.backupPath,
            path.join(this.config.storage.basePath, 'original'),
            path.join(this.config.storage.basePath, 'thumbnails'),
            path.join(this.config.storage.basePath, 'medium'),
            path.join(this.config.storage.basePath, 'web'),
            path.join(this.config.storage.backupPath, 'daily'),
            path.join(this.config.storage.backupPath, 'weekly'),
            path.join(this.config.storage.backupPath, 'monthly')
        ];

        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    /**
     * Initialise la base de données pour les métadonnées
     */
    async initializeDatabase() {
        // Simulation d'une base de données
        this.db = {
            photos: new Map(),
            technicians: new Map(),
            metadata: new Map(),
            auditLog: new Map(),
            stats: new Map()
        };
    }

    /**
     * Configuration Multer pour l'upload
     */
    getMulterConfig() {
        return multer({
            storage: multer.memoryStorage(),
            limits: {
                fileSize: this.config.upload.maxFileSize,
                files: this.config.upload.maxConcurrentUploads
            },
            fileFilter: (req, file, cb) => {
                try {
                    const ext = path.extname(file.originalname).toLowerCase();
                    if (this.config.upload.allowedFormats.includes(ext)) {
                        // Vérification du type MIME
                        const mimeType = mime.lookup(ext);
                        if (mimeType && file.mimetype === mimeType) {
                            cb(null, true);
                        } else {
                            cb(new Error(`Format de fichier non valide: ${ext}`));
                        }
                    } else {
                        cb(new Error(`Format non autorisé: ${ext}. Formats autorisés: ${this.config.upload.allowedFormats.join(', ')}`));
                    }
                } catch (error) {
                    cb(new Error(`Erreur de validation: ${error.message}`));
                }
            }
        });
    }

    /**
     * Valide une image
     */
    async validateImage(buffer) {
        try {
            const image = sharp(buffer);
            const metadata = await image.metadata();

            if (!metadata.width || !metadata.height) {
                throw new Error('Image invalide: dimensions non détectables');
            }

            // Vérification des dimensions
            if (metadata.width < this.config.upload.minDimensions.width || 
                metadata.height < this.config.upload.minDimensions.height) {
                throw new Error(`Image trop petite: ${metadata.width}x${metadata.height}. Minimum requis: ${this.config.upload.minDimensions.width}x${this.config.upload.minDimensions.height}`);
            }

            if (metadata.width > this.config.upload.maxDimensions.width || 
                metadata.height > this.config.upload.maxDimensions.height) {
                throw new Error(`Image trop grande: ${metadata.width}x${metadata.height}. Maximum autorisé: ${this.config.upload.maxDimensions.width}x${this.config.upload.maxDimensions.height}`);
            }

            // Vérification du format
            const allowedFormats = ['jpeg', 'png', 'webp', 'gif'];
            if (!allowedFormats.includes(metadata.format)) {
                throw new Error(`Format non supporté: ${metadata.format}`);
            }

            return { valid: true, metadata, buffer };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    /**
     * Compresse une image en différentes tailles
     */
    async compressImage(buffer, imageId) {
        if (!this.config.compression.enabled) {
            return {
                original: buffer,
                thumbnail: buffer,
                medium: buffer,
                web: buffer
            };
        }

        try {
            const results = {};
            const baseImage = sharp(buffer);

            // Image originale
            if (this.config.compression.resize.original) {
                results.original = await baseImage
                    .resize(this.config.compression.resize.original)
                    .jpeg({ quality: this.config.compression.quality.original })
                    .toBuffer();
            } else {
                results.original = buffer;
            }

            // Thumbnail
            if (this.config.compression.resize.thumbnail) {
                results.thumbnail = await sharp(buffer)
                    .resize(this.config.compression.resize.thumbnail)
                    .webp({ quality: this.config.compression.quality.thumbnail })
                    .toBuffer();
            }

            // Medium
            if (this.config.compression.resize.medium) {
                results.medium = await sharp(buffer)
                    .resize(this.config.compression.resize.medium)
                    .jpeg({ quality: this.config.compression.quality.medium })
                    .toBuffer();
            }

            // Web
            if (this.config.compression.resize.web) {
                results.web = await sharp(buffer)
                    .resize(this.config.compression.resize.web)
                    .webp({ quality: this.config.compression.quality.web })
                    .toBuffer();
            }

            return results;
        } catch (error) {
            throw new Error(`Erreur de compression: ${error.message}`);
        }
    }

    /**
     * Chiffre une image
     */
    encryptImage(buffer, encryptionKey) {
        if (!this.config.security.encryptFiles || !encryptionKey) {
            return buffer;
        }

        try {
            const key = Buffer.from(encryptionKey, 'hex');
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipher('aes-256-cbc', key);
            cipher.setAAD(Buffer.from('docucortex'));

            let encrypted = cipher.update(buffer);
            cipher.final();
            const authTag = cipher.getAuthTag();

            // Combine IV + AuthTag + Encrypted data
            return Buffer.concat([iv, authTag, encrypted]);
        } catch (error) {
            throw new Error(`Erreur de chiffrement: ${error.message}`);
        }
    }

    /**
     * Déchiffre une image
     */
    decryptImage(encryptedBuffer, encryptionKey) {
        if (!this.config.security.encryptFiles || !encryptionKey) {
            return encryptedBuffer;
        }

        try {
            const key = Buffer.from(encryptionKey, 'hex');
            const iv = encryptedBuffer.slice(0, 16);
            const authTag = encryptedBuffer.slice(16, 32);
            const data = encryptedBuffer.slice(32);

            const decipher = crypto.createDecipher('aes-256-cbc', key);
            decipher.setAAD(Buffer.from('docucortex'));
            decipher.setAuthTag(authTag);

            let decrypted = decipher.update(data);
            decipher.final();

            return decrypted;
        } catch (error) {
            throw new Error(`Erreur de déchiffrement: ${error.message}`);
        }
    }

    /**
     * Génère un hash pour une image
     */
    generateImageHash(buffer) {
        return crypto.createHash(this.config.security.hashAlgorithm)
            .update(buffer)
            .digest('hex');
    }

    /**
     * Upload d'une photo de technicien
     */
    async uploadPhoto(technicianId, file, metadata = {}) {
        const startTime = Date.now();
        
        try {
            // Validation du technicien
            if (!technicianId) {
                throw new Error('ID technicien requis');
            }

            // Validation de l'image
            const validation = await this.validateImage(file.buffer);
            if (!validation.valid) {
                throw new Error(`Validation échouée: ${validation.error}`);
            }

            // Génération de l'ID unique
            const imageId = uuidv4();
            const timestamp = Date.now();
            
            // Génération du hash
            const hash = this.generateImageHash(file.buffer);
            
            // Compression
            const compressedImages = await this.compressImage(file.buffer, imageId);
            
            // Chiffrement si activé
            const encryptionKey = crypto.randomBytes(32).toString('hex');
            const originalEncrypted = this.config.security.encryptFiles ? 
                this.encryptImage(compressedImages.original, encryptionKey) : 
                compressedImages.original;
            
            // Stockage des fichiers
            const filePaths = {
                original: this.generateFilePath(imageId, technicianId, 'original'),
                thumbnail: this.generateFilePath(imageId, technicianId, 'thumbnail'),
                medium: this.generateFilePath(imageId, technicianId, 'medium'),
                web: this.generateFilePath(imageId, technicianId, 'web')
            };

            // Écriture des fichiers
            await this.writeImageFile(filePaths.original, originalEncrypted);
            if (compressedImages.thumbnail) {
                await this.writeImageFile(filePaths.thumbnail, compressedImages.thumbnail);
            }
            if (compressedImages.medium) {
                await this.writeImageFile(filePaths.medium, compressedImages.medium);
            }
            if (compressedImages.web) {
                await this.writeImageFile(filePaths.web, compressedImages.web);
            }

            // Enregistrement des métadonnées
            const photoMetadata = {
                id: imageId,
                technicianId,
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                dimensions: validation.metadata,
                formats: {
                    original: path.extname(filePaths.original),
                    thumbnail: path.extname(filePaths.thumbnail),
                    medium: path.extname(filePaths.medium),
                    web: path.extname(filePaths.web)
                },
                hash,
                encryptionKey: this.config.security.encryptFiles ? encryptionKey : null,
                filePaths,
                uploadTimestamp: timestamp,
                metadata,
                status: 'active',
                compressionEnabled: this.config.compression.enabled,
                storagePath: this.config.storage.basePath
            };

            // Sauvegarde en base de données
            this.db.photos.set(imageId, photoMetadata);
            this.db.metadata.set(hash, imageId);

            // Log de l'audit
            await this.logAudit('UPLOAD', technicianId, {
                imageId,
                fileName: file.originalname,
                size: file.size,
                duration: Date.now() - startTime
            });

            return {
                success: true,
                imageId,
                metadata: photoMetadata,
                downloadUrls: this.generateDownloadUrls(imageId),
                message: 'Photo uploadée avec succès'
            };

        } catch (error) {
            await this.logAudit('UPLOAD_ERROR', technicianId, {
                error: error.message,
                duration: Date.now() - startTime
            });
            
            throw new Error(`Erreur lors de l'upload: ${error.message}`);
        }
    }

    /**
     * Génère le chemin de fichier
     */
    generateFilePath(imageId, technicianId, size) {
        const subDir = path.join(technicianId, new Date().getFullYear().toString(), 
                                (new Date().getMonth() + 1).toString());
        return path.join(this.config.storage.basePath, size, subDir, `${imageId}.${this.config.compression.formats[size]}`);
    }

    /**
     * Écrit un fichier image
     */
    async writeImageFile(filePath, buffer) {
        try {
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(filePath, buffer);
        } catch (error) {
            throw new Error(`Erreur d'écriture du fichier: ${error.message}`);
        }
    }

    /**
     * Génère les URLs de téléchargement
     */
    generateDownloadUrls(imageId) {
        const baseUrl = '/api/photos';
        return {
            original: `${baseUrl}/${imageId}/original`,
            thumbnail: `${baseUrl}/${imageId}/thumbnail`,
            medium: `${baseUrl}/${imageId}/medium`,
            web: `${baseUrl}/${imageId}/web`
        };
    }

    /**
     * Supprime une photo
     */
    async deletePhoto(imageId, technicianId) {
        try {
            const photo = this.db.photos.get(imageId);
            if (!photo) {
                throw new Error('Photo non trouvée');
            }

            // Vérification des permissions
            if (photo.technicianId !== technicianId) {
                throw new Error('Accès non autorisé');
            }

            // Suppression des fichiers physiques
            const filePaths = Object.values(photo.filePaths);
            filePaths.forEach(filePath => {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });

            // Suppression de la base de données
            this.db.photos.delete(imageId);
            this.db.metadata.delete(photo.hash);

            // Log de l'audit
            await this.logAudit('DELETE', technicianId, { imageId });

            return {
                success: true,
                message: 'Photo supprimée avec succès'
            };

        } catch (error) {
            throw new Error(`Erreur lors de la suppression: ${error.message}`);
        }
    }

    /**
     * Récupère une photo
     */
    async getPhoto(imageId, size = 'original') {
        try {
            const photo = this.db.photos.get(imageId);
            if (!photo) {
                throw new Error('Photo non trouvée');
            }

            const filePath = photo.filePaths[size];
            if (!filePath || !fs.existsSync(filePath)) {
                throw new Error(`Fichier ${size} non trouvé`);
            }

            let buffer = fs.readFileSync(filePath);
            
            // Déchiffrement si nécessaire
            if (photo.encryptionKey) {
                buffer = this.decryptImage(buffer, photo.encryptionKey);
            }

            return {
                success: true,
                buffer,
                metadata: {
                    ...photo,
                    fileSize: buffer.length,
                    requestedSize: size
                }
            };

        } catch (error) {
            throw new Error(`Erreur lors de la récupération: ${error.message}`);
        }
    }

    /**
     * Liste les photos d'un technicien
     */
    async listTechnicianPhotos(technicianId, options = {}) {
        try {
            const photos = Array.from(this.db.photos.values())
                .filter(photo => photo.technicianId === technicianId)
                .sort((a, b) => new Date(b.uploadTimestamp) - new Date(a.uploadTimestamp));

            // Application des filtres
            let filteredPhotos = photos;
            
            if (options.status) {
                filteredPhotos = filteredPhotos.filter(photo => photo.status === options.status);
            }
            
            if (options.dateFrom) {
                filteredPhotos = filteredPhotos.filter(photo => 
                    photo.uploadTimestamp >= new Date(options.dateFrom).getTime()
                );
            }
            
            if (options.dateTo) {
                filteredPhotos = filteredPhotos.filter(photo => 
                    photo.uploadTimestamp <= new Date(options.dateTo).getTime()
                );
            }

            // Pagination
            const page = options.page || 1;
            const limit = options.limit || 20;
            const start = (page - 1) * limit;
            const end = start + limit;

            const paginatedPhotos = filteredPhotos.slice(start, end);

            return {
                success: true,
                photos: paginatedPhotos,
                pagination: {
                    page,
                    limit,
                    total: filteredPhotos.length,
                    pages: Math.ceil(filteredPhotos.length / limit)
                }
            };

        } catch (error) {
            throw new Error(`Erreur lors de la récupération: ${error.message}`);
        }
    }

    /**
     * Synchronisation avec la base de données
     */
    async syncDatabase() {
        try {
            if (!this.config.sync.enabled) {
                return { success: true, message: 'Synchronisation désactivée' };
            }

            const stats = await this.calculateStats();
            const syncData = {
                timestamp: Date.now(),
                stats,
                photos: Array.from(this.db.photos.values()),
                auditLog: Array.from(this.db.auditLog.values()).slice(-100)
            };

            // Sauvegarde du fichier de synchronisation
            const syncFile = path.join(this.config.storage.backupPath, 'sync', `sync_${Date.now()}.json`);
            fs.writeFileSync(syncFile, JSON.stringify(syncData, null, 2));

            await this.logAudit('SYNC', 'system', { stats });

            return {
                success: true,
                message: 'Synchronisation réussie',
                stats
            };

        } catch (error) {
            throw new Error(`Erreur de synchronisation: ${error.message}`);
        }
    }

    /**
     * Backup automatique des images
     */
    async performBackup() {
        try {
            if (!this.config.backup.enabled) {
                return { success: true, message: 'Backup désactivé' };
            }

            const backupType = this.determineBackupType();
            const backupPath = this.generateBackupPath(backupType);
            
            const backupData = {
                timestamp: Date.now(),
                type: backupType,
                photos: Array.from(this.db.photos.values()),
                statistics: await this.calculateStats(),
                config: this.config
            };

            // Compression du backup
            const compressedData = await this.compressBackup(backupData);
            
            // Chiffrement si configuré
            if (this.config.backup.encryptionKey) {
                const key = this.config.backup.encryptionKey;
                const encryptedBackup = this.encryptImage(compressedData, key);
                
                fs.writeFileSync(backupPath, encryptedBackup);
            } else {
                fs.writeFileSync(backupPath, compressedData);
            }

            await this.logAudit('BACKUP', 'system', { backupType, backupPath });

            return {
                success: true,
                message: `Backup ${backupType} créé avec succès`,
                backupPath
            };

        } catch (error) {
            throw new Error(`Erreur lors du backup: ${error.message}`);
        }
    }

    /**
     * Détermine le type de backup à effectuer
     */
    determineBackupType() {
        const now = new Date();
        const day = now.getDay();
        const date = now.getDate();

        if (day === 0) return 'weekly';
        if (date === 1) return 'monthly';
        return 'daily';
    }

    /**
     * Génère le chemin de backup
     */
    generateBackupPath(backupType) {
        const timestamp = Date.now();
        return path.join(
            this.config.storage.backupPath,
            backupType,
            `backup_${backupType}_${timestamp}.${backupType === 'monthly' ? 'json' : 'bin'}`
        );
    }

    /**
     * Compresse les données de backup
     */
    async compressBackup(data) {
        // Simulation de compression - en production utiliser zlib ou similar
        return Buffer.from(JSON.stringify(data));
    }

    /**
     * Calcule les statistiques
     */
    async calculateStats() {
        const photos = Array.from(this.db.photos.values());
        const technicians = new Set(photos.map(p => p.technicianId));
        
        const formatCounts = {};
        const sizeDistribution = {};
        
        photos.forEach(photo => {
            // Comptage des formats
            Object.values(photo.formats).forEach(format => {
                formatCounts[format] = (formatCounts[format] || 0) + 1;
            });
            
            // Distribution des tailles
            const sizeCategory = this.getSizeCategory(photo.size);
            sizeDistribution[sizeCategory] = (sizeDistribution[sizeCategory] || 0) + 1;
        });

        return {
            totalPhotos: photos.length,
            totalTechnicians: technicians.size,
            totalSize: photos.reduce((sum, p) => sum + p.size, 0),
            formatDistribution: formatCounts,
            sizeDistribution,
            averageFileSize: photos.length > 0 ? 
                photos.reduce((sum, p) => sum + p.size, 0) / photos.length : 0,
            compressionRatio: photos.filter(p => p.compressionEnabled).length / photos.length,
            uptime: Date.now() - this.startTime
        };
    }

    /**
     * Catégorise la taille des fichiers
     */
    getSizeCategory(size) {
        if (size < 1024 * 1024) return '< 1MB';
        if (size < 5 * 1024 * 1024) return '1-5MB';
        if (size < 10 * 1024 * 1024) return '5-10MB';
        return '> 10MB';
    }

    /**
     * Log d'audit
     */
    async logAudit(action, userId, details) {
        const logEntry = {
            id: uuidv4(),
            timestamp: Date.now(),
            action,
            userId,
            details,
            ip: null, // À implémenter selon les besoins
            userAgent: null // À implémenter selon les besoins
        };

        this.db.auditLog.set(logEntry.id, logEntry);
        
        // Limiter la taille du log d'audit
        if (this.db.auditLog.size > 10000) {
            const oldestLogs = Array.from(this.db.auditLog.keys()).slice(0, 1000);
            oldestLogs.forEach(id => this.db.auditLog.delete(id));
        }
    }

    /**
     * Met à jour la configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        return { success: true, message: 'Configuration mise à jour' };
    }

    /**
     * Récupère la configuration actuelle
     */
    getConfig() {
        return this.config;
    }

    /**
     * Interface d'administration - statistiques
     */
    async getAdminStats() {
        const stats = await this.calculateStats();
        const recentActivity = Array.from(this.db.auditLog.values())
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 10);
        
        const topTechnicians = await this.getTopTechnicians(10);

        return {
            success: true,
            stats,
            recentActivity,
            topTechnicians,
            systemHealth: await this.getSystemHealth()
        };
    }

    /**
     * Récupère les meilleurs techniciens
     */
    async getTopTechnicians(limit = 10) {
        const technicianPhotos = new Map();
        
        Array.from(this.db.photos.values()).forEach(photo => {
            const count = technicianPhotos.get(photo.technicianId) || 0;
            technicianPhotos.set(photo.technicianId, count + 1);
        });

        return Array.from(technicianPhotos.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([technicianId, photoCount]) => ({ technicianId, photoCount }));
    }

    /**
     * Vérifie la santé du système
     */
    async getSystemHealth() {
        const health = {
            status: 'healthy',
            checks: {}
        };

        // Vérification de l'espace disque
        const basePath = this.config.storage.basePath;
        if (fs.existsSync(basePath)) {
            try {
                const stats = fs.statSync(basePath);
                health.checks.storage = 'ok';
            } catch (error) {
                health.checks.storage = 'error';
                health.status = 'unhealthy';
            }
        }

        // Vérification de la base de données
        if (this.db.photos) {
            health.checks.database = 'ok';
        } else {
            health.checks.database = 'error';
            health.status = 'unhealthy';
        }

        // Vérification de la configuration
        if (this.config && this.config.upload) {
            health.checks.configuration = 'ok';
        } else {
            health.checks.configuration = 'error';
            health.status = 'unhealthy';
        }

        return health;
    }

    /**
     * Nettoyage automatique des fichiers temporaires et obsolètes
     */
    async performMaintenance() {
        try {
            const now = Date.now();
            const retentionTime = this.config.security.retentionDays * 24 * 60 * 60 * 1000;
            const tempPath = this.config.storage.tempPath;

            // Nettoyage des fichiers temporaires
            if (fs.existsSync(tempPath)) {
                const tempFiles = fs.readdirSync(tempPath);
                for (const file of tempFiles) {
                    const filePath = path.join(tempPath, file);
                    const stats = fs.statSync(filePath);
                    if (now - stats.mtime.getTime() > 60 * 60 * 1000) { // 1 heure
                        fs.unlinkSync(filePath);
                    }
                }
            }

            // Nettoyage des photos expirées
            let deletedCount = 0;
            for (const [imageId, photo] of this.db.photos.entries()) {
                if (now - photo.uploadTimestamp > retentionTime) {
                    await this.deletePhoto(imageId, photo.technicianId);
                    deletedCount++;
                }
            }

            await this.logAudit('MAINTENANCE', 'system', { deletedCount });

            return {
                success: true,
                message: 'Maintenance effectuée avec succès',
                deletedCount
            };

        } catch (error) {
            throw new Error(`Erreur lors de la maintenance: ${error.message}`);
        }
    }

    /**
     * Point d'entrée principal de l'API
     */
    getApiRoutes() {
        const router = require('express').Router();
        const uploadMiddleware = this.getMulterConfig();

        // Upload de photo
        router.post('/upload', uploadMiddleware.array('photos', this.config.upload.maxConcurrentUploads), async (req, res) => {
            try {
                const technicianId = req.body.technicianId;
                if (!technicianId) {
                    return res.status(400).json({ success: false, error: 'ID technicien requis' });
                }

                const results = [];
                for (const file of req.files) {
                    const result = await this.uploadPhoto(technicianId, file, req.body.metadata);
                    results.push(result);
                }

                res.json({
                    success: true,
                    message: `${results.length} photo(s) uploadée(s) avec succès`,
                    results
                });

            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Récupération de photo
        router.get('/:imageId/:size?', async (req, res) => {
            try {
                const { imageId } = req.params;
                const size = req.params.size || 'original';

                const result = await this.getPhoto(imageId, size);
                res.set('Content-Type', this.getMimeType(size));
                res.send(result.buffer);

            } catch (error) {
                res.status(404).json({ success: false, error: error.message });
            }
        });

        // Liste des photos d'un technicien
        router.get('/technician/:technicianId', async (req, res) => {
            try {
                const { technicianId } = req.params;
                const options = req.query;
                
                const result = await this.listTechnicianPhotos(technicianId, options);
                res.json(result);

            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Suppression de photo
        router.delete('/:imageId', async (req, res) => {
            try {
                const { imageId } = req.params;
                const technicianId = req.body.technicianId;
                
                const result = await this.deletePhoto(imageId, technicianId);
                res.json(result);

            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Statistiques
        router.get('/stats/overview', async (req, res) => {
            try {
                const stats = await this.calculateStats();
                res.json({ success: true, stats });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Statistiques d'administration
        router.get('/admin/stats', async (req, res) => {
            try {
                const adminStats = await this.getAdminStats();
                res.json(adminStats);
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Synchronisation
        router.post('/admin/sync', async (req, res) => {
            try {
                const result = await this.syncDatabase();
                res.json(result);
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Backup
        router.post('/admin/backup', async (req, res) => {
            try {
                const result = await this.performBackup();
                res.json(result);
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Maintenance
        router.post('/admin/maintenance', async (req, res) => {
            try {
                const result = await this.performMaintenance();
                res.json(result);
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Configuration
        router.get('/admin/config', (req, res) => {
            res.json({ success: true, config: this.getConfig() });
        });

        router.put('/admin/config', (req, res) => {
            try {
                const result = this.updateConfig(req.body);
                res.json(result);
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        return router;
    }

    /**
     * Obtient le type MIME pour un format
     */
    getMimeType(size) {
        const mimeTypes = {
            original: 'image/jpeg',
            thumbnail: 'image/webp',
            medium: 'image/jpeg',
            web: 'image/webp'
        };
        return mimeTypes[size] || 'image/jpeg';
    }
}

module.exports = PhotoConfigurationSystem;