// src/components/users/ActiveDirectorySync.js - SYNCHRONISATION BIDIRECTIONNELLE AD ↔ EXCEL
// Système de synchronisation avancée avec détection de conflits et résolution automatique

import apiService from '../../services/apiService.js';
import ActiveDirectoryConnector from '../../integrations/ActiveDirectoryConnector.js';
import { format, parseISO, isAfter, isBefore, differenceInMinutes } from 'date-fns';

// Types de données
const SYNC_DIRECTION = {
    AD_TO_EXCEL: 'ad_to_excel',
    EXCEL_TO_AD: 'excel_to_ad',
    BIDIRECTIONAL: 'bidirectional'
};

const CONFLICT_TYPE = {
    FIELD_MISMATCH: 'field_mismatch',
    TIMESTAMP_CONFLICT: 'timestamp_conflict',
    MISSING_RECORD: 'missing_record',
    DUPLICATE_RECORD: 'duplicate_record'
};

const CONFLICT_RESOLUTION = {
    KEEP_AD: 'keep_ad',
    KEEP_EXCEL: 'keep_excel',
    KEEP_NEWER: 'keep_newer',
    MANUAL: 'manual'
};

const SYNC_STATUS = {
    IDLE: 'idle',
    RUNNING: 'running',
    PAUSED: 'paused',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CONFLICTS_PENDING: 'conflicts_pending'
};

// Configuration par défaut
const DEFAULT_CONFIG = {
    autoSync: false,
    syncInterval: 300000, // 5 minutes
    conflictResolution: CONFLICT_RESOLUTION.KEEP_NEWER,
    batchSize: 100,
    maxRetries: 3,
    timeout: 30000,
    enableLogging: true,
    logLevel: 'info', // 'debug', 'info', 'warn', 'error'
    fieldMappings: {
        'firstName': 'givenName',
        'lastName': 'sn',
        'email': 'mail',
        'phone': 'telephoneNumber',
        'mobile': 'mobile',
        'department': 'department',
        'title': 'title'
    },
    conflictRules: {
        emailConflictResolution: CONFLICT_RESOLUTION.KEEP_EXCEL,
        phoneConflictResolution: CONFLICT_RESOLUTION.KEEP_AD,
        departmentConflictResolution: CONFLICT_RESOLUTION.MANUAL
    }
};

/**
 * Système de synchronisation bidirectionnelle Active Directory ↔ Excel
 */
class ActiveDirectorySync {
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        
        // Composants core
        this.apiService = apiService;
        this.adConnector = new ActiveDirectoryConnector({
            enabled: true,
            autoSync: false, // On gère la sync nous-mêmes
            ...this.config.adConfig
        });
        
        // État de synchronisation
        this.status = SYNC_STATUS.IDLE;
        this.isRunning = false;
        this.syncQueue = [];
        this.conflicts = new Map();
        this.syncHistory = [];
        this.backgroundSync = null;
        this.listeners = new Map();
        
        // Métriques et statistiques
        this.metrics = {
            totalSyncs: 0,
            successfulSyncs: 0,
            failedSyncs: 0,
            conflictsResolved: 0,
            conflictsManual: 0,
            lastSyncDuration: 0,
            averageSyncTime: 0
        };
        
        // Cache et gestion des données
        this.cache = {
            adUsers: new Map(),
            excelUsers: new Map(),
            lastSyncTimestamp: null,
            conflictCache: new Map()
        };
        
        // Logs et audit trail
        this.logger = new SyncLogger(this.config.logLevel);
        
        // Initialisation
        this.initializeEventHandlers();
        this.loadConfiguration();
        
        this.logger.info('ActiveDirectorySync initialisé', {
            autoSync: this.config.autoSync,
            conflictResolution: this.config.conflictResolution
        });
    }

    // 📊 INITIALISATION ET CONFIGURATION

    async initialize() {
        try {
            this.logger.info('Initialisation du système de synchronisation...');
            
            // Vérifier la connexion AD
            const adHealth = await this.adConnector.healthCheck();
            if (!adHealth.healthy) {
                throw new Error(`Connexion AD échouée: ${adHealth.error}`);
            }
            
            // Charger les données existantes
            await this.loadCacheData();
            
            // Démarrer la sync automatique si configurée
            if (this.config.autoSync) {
                this.startBackgroundSync();
            }
            
            this.logger.info('Synchronisation initialisée avec succès');
            return true;
            
        } catch (error) {
            this.logger.error('Erreur initialisation synchronisation', error);
            throw error;
        }
    }

    loadConfiguration() {
        try {
            const savedConfig = localStorage.getItem('ad_sync_config');
            if (savedConfig) {
                const config = JSON.parse(savedConfig);
                this.config = { ...this.config, ...config };
            }
            
            // Enregistrer les listeners d'événements
            this.setupEventListeners();
            
        } catch (error) {
            this.logger.warn('Impossible de charger la configuration', error);
        }
    }

    saveConfiguration() {
        try {
            localStorage.setItem('ad_sync_config', JSON.stringify(this.config));
        } catch (error) {
            this.logger.warn('Impossible de sauvegarder la configuration', error);
        }
    }

    // 🔄 SYNCHRONISATION PRINCIPALE

    /**
     * Démarrer la synchronisation bidirectionnelle
     */
    async startSync(options = {}) {
        if (this.isRunning) {
            throw new Error('Une synchronisation est déjà en cours');
        }

        this.isRunning = true;
        this.status = SYNC_STATUS.RUNNING;
        const syncId = this.generateSyncId();
        const startTime = Date.now();

        this.logger.info(`Début synchronisation ${syncId}`, options);

        try {
            // 1. Charger les données depuis les deux sources
            const [adUsers, excelUsers] = await Promise.all([
                this.loadADUsers(),
                this.loadExcelUsers()
            ]);

            // 2. Détecter les conflits
            const conflicts = await this.detectConflicts(adUsers, excelUsers);
            
            // 3. Résoudre automatiquement les conflits possibles
            const resolvedConflicts = await this.resolveConflicts(conflicts, options.autoResolve);
            
            // 4. Appliquer les synchronisations
            const syncResult = await this.applySynchronization(adUsers, excelUsers, resolvedConflicts);
            
            // 5. Mettre à jour le cache
            await this.updateCache(adUsers, excelUsers);
            
            // 6. Enregistrer dans l'historique
            const duration = Date.now() - startTime;
            this.recordSyncHistory(syncId, duration, syncResult);
            
            this.status = SYNC_STATUS.COMPLETED;
            this.metrics.totalSyncs++;
            this.metrics.successfulSyncs++;
            this.metrics.lastSyncDuration = duration;
            this.updateAverageSyncTime();
            
            this.emit('syncCompleted', {
                syncId,
                duration,
                result: syncResult,
                conflictsResolved: resolvedConflicts.length
            });

            this.logger.info(`Synchronisation ${syncId} terminée`, {
                duration,
                usersSynced: syncResult.syncedUsers,
                conflicts: resolvedConflicts.length
            });

            return syncResult;

        } catch (error) {
            this.status = SYNC_STATUS.FAILED;
            this.metrics.failedSyncs++;
            this.logger.error(`Erreur synchronisation ${syncId}`, error);
            
            this.emit('syncFailed', {
                syncId,
                error: error.message,
                duration: Date.now() - startTime
            });
            
            throw error;
            
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Synchronisation en arrière-plan automatique
     */
    startBackgroundSync() {
        if (this.backgroundSync) {
            clearInterval(this.backgroundSync);
        }

        this.backgroundSync = setInterval(async () => {
            if (!this.isRunning && this.config.autoSync) {
                try {
                    await this.startSync({ 
                        autoResolve: true, 
                        background: true 
                    });
                } catch (error) {
                    this.logger.warn('Échec synchronisation background', error);
                }
            }
        }, this.config.syncInterval);

        this.logger.info('Synchronisation en arrière-plan démarrée', {
            interval: this.config.syncInterval
        });
    }

    stopBackgroundSync() {
        if (this.backgroundSync) {
            clearInterval(this.backgroundSync);
            this.backgroundSync = null;
            this.logger.info('Synchronisation en arrière-plan arrêtée');
        }
    }

    // 🔍 CHARGEMENT DES DONNÉES

    async loadADUsers() {
        try {
            const result = await this.adConnector.syncUsers('incremental');
            const users = result.users || [];
            
            const adUsersMap = new Map();
            users.forEach(user => {
                const excelUser = this.mapADUserToExcel(user);
                adUsersMap.set(excelUser.id, excelUser);
            });
            
            this.cache.adUsers = adUsersMap;
            this.logger.debug(`Chargé ${users.length} utilisateurs AD`);
            
            return adUsersMap;
            
        } catch (error) {
            this.logger.error('Erreur chargement utilisateurs AD', error);
            throw error;
        }
    }

    async loadExcelUsers() {
        try {
            // Récupérer depuis l'API DocuCortex
            const users = await this.apiService.getUsers();
            const excelUsersMap = new Map();
            
            users.forEach(user => {
                excelUsersMap.set(user.id || user.email, this.normalizeExcelUser(user));
            });
            
            this.cache.excelUsers = excelUsersMap;
            this.logger.debug(`Chargé ${users.length} utilisateurs Excel/API`);
            
            return excelUsersMap;
            
        } catch (error) {
            this.logger.error('Erreur chargement utilisateurs Excel/API', error);
            throw error;
        }
    }

    // ⚠️ DÉTECTION DE CONFLITS

    /**
     * Détecter les conflits entre les données AD et Excel
     */
    async detectConflicts(adUsers, excelUsers) {
        const conflicts = [];
        const adUserIds = new Set(adUsers.keys());
        const excelUserIds = new Set(excelUsers.keys());
        
        this.logger.debug('Début détection des conflits', {
            adUsers: adUsers.size,
            excelUsers: excelUsers.size
        });

        // 1. Utilisateurs présents dans les deux systèmes
        for (const [userId] of adUsers) {
            if (excelUsers.has(userId)) {
                const adUser = adUsers.get(userId);
                const excelUser = excelUsers.get(userId);
                
                const fieldConflicts = this.detectFieldConflicts(adUser, excelUser);
                
                if (fieldConflicts.length > 0) {
                    conflicts.push({
                        type: CONFLICT_TYPE.FIELD_MISMATCH,
                        userId,
                        user: {
                            ad: adUser,
                            excel: excelUser
                        },
                        conflicts: fieldConflicts,
                        timestamp: new Date().toISOString()
                    });
                }
            }
        }

        // 2. Utilisateurs présents uniquement dans AD
        for (const [userId] of adUsers) {
            if (!excelUsers.has(userId)) {
                conflicts.push({
                    type: CONFLICT_TYPE.MISSING_RECORD,
                    userId,
                    user: {
                        ad: adUsers.get(userId),
                        excel: null
                    },
                    timestamp: new Date().toISOString()
                });
            }
        }

        // 3. Utilisateurs présents uniquement dans Excel
        for (const [userId] of excelUsers) {
            if (!adUsers.has(userId)) {
                conflicts.push({
                    type: CONFLICT_TYPE.MISSING_RECORD,
                    userId,
                    user: {
                        ad: null,
                        excel: excelUsers.get(userId)
                    },
                    timestamp: new Date().toISOString()
                });
            }
        }

        this.logger.info(`Détecté ${conflicts.length} conflits`, {
            fieldMismatches: conflicts.filter(c => c.type === CONFLICT_TYPE.FIELD_MISMATCH).length,
            missingRecords: conflicts.filter(c => c.type === CONFLICT_TYPE.MISSING_RECORD).length
        });

        return conflicts;
    }

    detectFieldConflicts(adUser, excelUser) {
        const conflicts = [];
        const mappedFields = this.config.fieldMappings;

        for (const [excelField, adField] of Object.entries(mappedFields)) {
            const adValue = adUser[adField];
            const excelValue = excelUser[excelField];
            
            if (this.areValuesDifferent(adValue, excelValue)) {
                // Déterminer la stratégie de résolution
                const resolution = this.getConflictResolution(excelField);
                
                conflicts.push({
                    field: excelField,
                    adField,
                    adValue,
                    excelValue,
                    resolution,
                    priority: this.getFieldPriority(excelField),
                    timestamp: new Date().toISOString()
                });
            }
        }

        return conflicts.sort((a, b) => b.priority - a.priority);
    }

    areValuesDifferent(value1, value2) {
        if (!value1 && !value2) return false;
        if (!value1 || !value2) return true;
        
        // Normaliser pour comparaison (trim, lowercase)
        const normalized1 = String(value1).trim().toLowerCase();
        const normalized2 = String(value2).trim().toLowerCase();
        
        return normalized1 !== normalized2;
    }

    // 🔧 RÉSOLUTION DE CONFLITS

    async resolveConflicts(conflicts, autoResolve = false) {
        const resolvedConflicts = [];
        const unresolvedConflicts = [];
        
        for (const conflict of conflicts) {
            let resolution = null;
            
            if (autoResolve && this.canAutoResolve(conflict)) {
                resolution = await this.autoResolveConflict(conflict);
                if (resolution) {
                    resolvedConflicts.push({
                        ...conflict,
                        resolution,
                        resolvedAt: new Date().toISOString()
                    });
                    
                    this.metrics.conflictsResolved++;
                }
            } else {
                // Marquer pour résolution manuelle
                this.conflicts.set(conflict.userId, conflict);
                unresolvedConflicts.push(conflict);
            }
        }
        
        this.logger.info(`Conflits résolus: ${resolvedConflicts.length}, Manuels: ${unresolvedConflicts.length}`);
        
        if (unresolvedConflicts.length > 0) {
            this.status = SYNC_STATUS.CONFLICTS_PENDING;
            this.emit('conflictsDetected', {
                conflicts: unresolvedConflicts,
                autoResolved: resolvedConflicts
            });
        }
        
        return [...resolvedConflicts, ...unresolvedConflicts];
    }

    canAutoResolve(conflict) {
        if (conflict.type !== CONFLICT_TYPE.FIELD_MISMATCH) {
            return true; // Les records manquants peuvent être résolus automatiquement
        }
        
        // Vérifier si tous les conflits peuvent être résolus automatiquement
        return conflict.conflicts.every(fieldConflict => 
            fieldConflict.resolution !== CONFLICT_RESOLUTION.MANUAL
        );
    }

    async autoResolveConflict(conflict) {
        switch (conflict.type) {
            case CONFLICT_TYPE.FIELD_MISMATCH:
                return this.resolveFieldMismatch(conflict);
                
            case CONFLICT_TYPE.MISSING_RECORD:
                return this.resolveMissingRecord(conflict);
                
            default:
                return { action: 'skip', reason: 'Type de conflit non supporté' };
        }
    }

    resolveFieldMismatch(conflict) {
        const resolvedFields = {};
        let hasChanges = false;
        
        for (const fieldConflict of conflict.conflicts) {
            switch (fieldConflict.resolution) {
                case CONFLICT_RESOLUTION.KEEP_AD:
                    resolvedFields[fieldConflict.field] = fieldConflict.adValue;
                    hasChanges = true;
                    break;
                    
                case CONFLICT_RESOLUTION.KEEP_EXCEL:
                    // Déjà dans Excel, pas de changement
                    break;
                    
                case CONFLICT_RESOLUTION.KEEP_NEWER:
                    // Comparer les timestamps si disponibles
                    const newerValue = this.getNewerValue(
                        fieldConflict.adValue,
                        fieldConflict.excelValue,
                        conflict.user
                    );
                    
                    if (newerValue !== fieldConflict.excelValue) {
                        resolvedFields[fieldConflict.field] = newerValue;
                        hasChanges = true;
                    }
                    break;
                    
                case CONFLICT_RESOLUTION.MANUEL:
                    // Ne pas résoudre automatiquement
                    return null;
            }
        }
        
        return hasChanges ? {
            action: 'update_excel',
            fields: resolvedFields,
            reason: 'Résolution automatique des conflits de champs'
        } : {
            action: 'no_change',
            reason: 'Aucun champ modifié'
        };
    }

    resolveMissingRecord(conflict) {
        const { ad, excel } = conflict.user;
        
        if (ad && !excel) {
            // Nouvel utilisateur dans AD - créer dans Excel
            return {
                action: 'create_in_excel',
                userData: ad,
                reason: 'Utilisateur présent uniquement dans AD'
            };
        } else if (!ad && excel) {
            // Utilisateur présent uniquement dans Excel - supprimer ou marquer
            return {
                action: 'mark_inactive',
                userData: excel,
                reason: 'Utilisateur présent uniquement dans Excel'
            };
        }
        
        return {
            action: 'skip',
            reason: 'Cas non géré'
        };
    }

    // 🎛️ INTERFACE DE RÉSOLUTION MANUELLE

    /**
     * Obtenir les conflits en attente de résolution manuelle
     */
    getPendingConflicts() {
        return Array.from(this.conflicts.values());
    }

    /**
     * Résoudre manuellement un conflit
     */
    async resolveConflictManually(userId, resolution) {
        const conflict = this.conflicts.get(userId);
        if (!conflict) {
            throw new Error(`Conflit non trouvé pour l'utilisateur: ${userId}`);
        }

        try {
            const result = await this.applyManualResolution(conflict, resolution);
            
            // Supprimer de la liste des conflits en attente
            this.conflicts.delete(userId);
            this.metrics.conflictsManual++;
            
            this.emit('conflictResolved', {
                userId,
                resolution,
                result
            });
            
            this.logger.info(`Conflit résolu manuellement pour ${userId}`, resolution);
            
            return result;
            
        } catch (error) {
            this.logger.error(`Erreur résolution manuelle conflit ${userId}`, error);
            throw error;
        }
    }

    async applyManualResolution(conflict, resolution) {
        switch (conflict.type) {
            case CONFLICT_TYPE.FIELD_MISMATCH:
                return this.applyFieldMismatchResolution(conflict, resolution);
                
            case CONFLICT_TYPE.MISSING_RECORD:
                return this.applyMissingRecordResolution(conflict, resolution);
                
            default:
                throw new Error(`Type de conflit non supporté: ${conflict.type}`);
        }
    }

    async applyFieldMismatchResolution(conflict, resolution) {
        const { userId, conflicts } = conflict;
        const updates = {};
        
        // Appliquer les résolutions pour chaque champ
        for (const fieldConflict of conflicts) {
            const fieldResolution = resolution.fields?.[fieldConflict.field];
            
            if (fieldResolution) {
                switch (fieldResolution) {
                    case CONFLICT_RESOLUTION.KEEP_AD:
                        updates[fieldConflict.field] = fieldConflict.adValue;
                        break;
                    case CONFLICT_RESOLUTION.KEEP_EXCEL:
                        // Déjà correct dans Excel
                        break;
                    case 'custom':
                        const customValue = resolution.customValues?.[fieldConflict.field];
                        if (customValue !== undefined) {
                            updates[fieldConflict.field] = customValue;
                        }
                        break;
                }
            }
        }
        
        // Appliquer les mises à jour
        if (Object.keys(updates).length > 0) {
            return await this.updateExcelUser(userId, updates);
        }
        
        return { action: 'no_change' };
    }

    async applyMissingRecordResolution(conflict, resolution) {
        const { userId, user } = conflict;
        
        switch (resolution.action) {
            case 'create_in_excel':
                return await this.createExcelUser(user.ad);
                
            case 'create_in_ad':
                return await this.createADUser(user.excel);
                
            case 'mark_inactive':
                return await this.markUserInactive(userId);
                
            case 'skip':
                return { action: 'skipped' };
                
            default:
                throw new Error(`Action non supportée: ${resolution.action}`);
        }
    }

    // 🔄 APPLICATION DE LA SYNCHRONISATION

    async applySynchronization(adUsers, excelUsers, conflicts) {
        const syncResult = {
            syncedUsers: 0,
            createdUsers: 0,
            updatedUsers: 0,
            deactivatedUsers: 0,
            conflictsResolved: 0,
            errors: []
        };
        
        // Traiter les conflits résolus
        for (const conflict of conflicts) {
            if (conflict.resolution) {
                try {
                    await this.applyConflictResolution(conflict);
                    syncResult.conflictsResolved++;
                } catch (error) {
                    syncResult.errors.push({
                        conflict: conflict.userId,
                        error: error.message
                    });
                }
            }
        }
        
        // Synchronisation des utilisateurs standards (sans conflit)
        await this.syncUsersWithoutConflicts(adUsers, excelUsers, syncResult);
        
        // Vider le cache de conflits résolus
        this.cache.conflictCache.clear();
        
        return syncResult;
    }

    async applyConflictResolution(conflict) {
        switch (conflict.resolution.action) {
            case 'update_excel':
                await this.updateExcelUser(conflict.userId, conflict.resolution.fields);
                break;
                
            case 'create_in_excel':
                await this.createExcelUser(conflict.resolution.userData);
                break;
                
            case 'mark_inactive':
                await this.markUserInactive(conflict.userId);
                break;
        }
    }

    async syncUsersWithoutConflicts(adUsers, excelUsers, syncResult) {
        // Synchroniser les utilisateurs sans conflit majeur
        for (const [userId, adUser] of adUsers) {
            if (!this.conflicts.has(userId) && excelUsers.has(userId)) {
                // Mise à jour des champs modifiés
                const excelUser = excelUsers.get(userId);
                const changes = this.getChangedFields(adUser, excelUser);
                
                if (changes.length > 0) {
                    try {
                        await this.updateExcelUser(userId, changes);
                        syncResult.updatedUsers++;
                        syncResult.syncedUsers++;
                    } catch (error) {
                        syncResult.errors.push({
                            userId,
                            error: error.message,
                            type: 'update'
                        });
                    }
                }
            } else if (!this.conflicts.has(userId) && !excelUsers.has(userId)) {
                // Nouvel utilisateur à créer
                try {
                    await this.createExcelUser(adUser);
                    syncResult.createdUsers++;
                    syncResult.syncedUsers++;
                } catch (error) {
                    syncResult.errors.push({
                        userId,
                        error: error.message,
                        type: 'create'
                    });
                }
            }
        }
        
        // Désactiver les utilisateurs Excel qui n'existent plus dans AD
        for (const [userId, excelUser] of excelUsers) {
            if (!adUsers.has(userId) && !this.conflicts.has(userId)) {
                try {
                    await this.markUserInactive(userId);
                    syncResult.deactivatedUsers++;
                } catch (error) {
                    syncResult.errors.push({
                        userId,
                        error: error.message,
                        type: 'deactivate'
                    });
                }
            }
        }
    }

    // 💾 OPERATIONS BASE DE DONNEES

    async updateExcelUser(userId, updates) {
        try {
            const result = await this.apiService.updateUser(userId, updates);
            this.logger.debug(`Utilisateur Excel mis à jour: ${userId}`, updates);
            return result;
        } catch (error) {
            this.logger.error(`Erreur mise à jour utilisateur Excel ${userId}`, error);
            throw error;
        }
    }

    async createExcelUser(userData) {
        try {
            const result = await this.apiService.createUser(userData);
            this.logger.debug(`Utilisateur Excel créé: ${userData.email || userData.id}`);
            return result;
        } catch (error) {
            this.logger.error(`Erreur création utilisateur Excel`, error);
            throw error;
        }
    }

    async markUserInactive(userId) {
        try {
            const updates = { 
                active: false, 
                inactiveReason: 'Not found in Active Directory',
                inactiveDate: new Date().toISOString()
            };
            const result = await this.updateExcelUser(userId, updates);
            return result;
        } catch (error) {
            this.logger.error(`Erreur désactivation utilisateur ${userId}`, error);
            throw error;
        }
    }

    async createADUser(userData) {
        // Création dans AD via le connecteur
        try {
            const adUserData = this.mapExcelUserToAD(userData);
            const result = await this.adConnector.createUser(adUserData);
            this.logger.debug(`Utilisateur AD créé: ${userData.email || userData.id}`);
            return result;
        } catch (error) {
            this.logger.error(`Erreur création utilisateur AD`, error);
            throw error;
        }
    }

    // 🔍 UTILITAIRES ET HELPERS

    mapADUserToExcel(adUser) {
        const mapped = {
            id: adUser.mail || adUser.userPrincipalName,
            firstName: adUser.givenName,
            lastName: adUser.sn,
            email: adUser.mail,
            phone: adUser.telephoneNumber,
            mobile: adUser.mobile,
            department: adUser.department,
            title: adUser.title,
            lastModified: adUser.whenChanged,
            source: 'Active Directory',
            active: adUser.isActive !== false
        };
        
        // Ajouter les champs mappés
        for (const [excelField, adField] of Object.entries(this.config.fieldMappings)) {
            if (adUser[adField] !== undefined) {
                mapped[excelField] = adUser[adField];
            }
        }
        
        return mapped;
    }

    mapExcelUserToAD(excelUser) {
        const mapped = {};
        
        // Mapper les champs selon la configuration
        for (const [excelField, adField] of Object.entries(this.config.fieldMappings)) {
            if (excelUser[excelField] !== undefined) {
                mapped[adField] = excelUser[excelField];
            }
        }
        
        return mapped;
    }

    normalizeExcelUser(user) {
        return {
            ...user,
            firstName: user.firstName || user.givenName || '',
            lastName: user.lastName || user.sn || '',
            active: user.active !== false
        };
    }

    getConflictResolution(fieldName) {
        return this.config.conflictRules[`${fieldName}ConflictResolution`] || 
               this.config.conflictResolution;
    }

    getFieldPriority(fieldName) {
        const priorities = {
            'email': 100,
            'firstName': 90,
            'lastName': 90,
            'department': 80,
            'title': 70,
            'phone': 60,
            'mobile': 50
        };
        
        return priorities[fieldName] || 50;
    }

    getNewerValue(adValue, excelValue, users) {
        // Comparer les timestamps si disponibles
        const adTime = users.ad?.lastModified;
        const excelTime = users.excel?.lastModified || users.excel?.updatedAt;
        
        if (adTime && excelTime) {
            const adDate = parseISO(adTime);
            const excelDate = parseISO(excelTime);
            
            if (isAfter(adDate, excelDate)) {
                return adValue;
            } else {
                return excelValue;
            }
        }
        
        // Fallback: préférer la valeur AD
        return adValue || excelValue;
    }

    getChangedFields(adUser, excelUser) {
        const changes = {};
        
        for (const [excelField, adField] of Object.entries(this.config.fieldMappings)) {
            const adValue = adUser[adField];
            const excelValue = excelUser[excelField];
            
            if (this.areValuesDifferent(adValue, excelValue)) {
                changes[excelField] = adValue;
            }
        }
        
        return changes;
    }

    // 📊 CACHE ET MÉTRIQUES

    async updateCache(adUsers, excelUsers) {
        this.cache.adUsers = adUsers;
        this.cache.excelUsers = excelUsers;
        this.cache.lastSyncTimestamp = new Date().toISOString();
        
        this.logger.debug('Cache mis à jour', {
            adUsers: adUsers.size,
            excelUsers: excelUsers.size,
            timestamp: this.cache.lastSyncTimestamp
        });
    }

    async loadCacheData() {
        try {
            const savedCache = localStorage.getItem('ad_sync_cache');
            if (savedCache) {
                const cache = JSON.parse(savedCache);
                this.cache = { ...this.cache, ...cache };
                
                this.logger.debug('Cache chargé', {
                    hasADUsers: this.cache.adUsers.size > 0,
                    hasExcelUsers: this.cache.excelUsers.size > 0,
                    lastSync: this.cache.lastSyncTimestamp
                });
            }
        } catch (error) {
            this.logger.warn('Erreur chargement cache', error);
        }
    }

    saveCacheData() {
        try {
            localStorage.setItem('ad_sync_cache', JSON.stringify({
                ...this.cache,
                adUsers: Array.from(this.cache.adUsers.entries()),
                excelUsers: Array.from(this.cache.excelUsers.entries())
            }));
        } catch (error) {
            this.logger.warn('Erreur sauvegarde cache', error);
        }
    }

    updateAverageSyncTime() {
        const totalTime = this.syncHistory.reduce((sum, sync) => sum + sync.duration, 0);
        this.metrics.averageSyncTime = this.syncHistory.length > 0 ? 
            Math.round(totalTime / this.syncHistory.length) : 0;
    }

    recordSyncHistory(syncId, duration, result) {
        const historyEntry = {
            syncId,
            duration,
            timestamp: new Date().toISOString(),
            status: 'completed',
            result,
            metrics: { ...this.metrics }
        };
        
        this.syncHistory.push(historyEntry);
        
        // Garder seulement les 100 dernières entrées
        if (this.syncHistory.length > 100) {
            this.syncHistory = this.syncHistory.slice(-100);
        }
        
        this.logger.debug('Historique synchronisation enregistré', {
            syncId,
            duration,
            totalEntries: this.syncHistory.length
        });
    }

    getMetrics() {
        return {
            ...this.metrics,
            status: this.status,
            isRunning: this.isRunning,
            cacheSize: {
                adUsers: this.cache.adUsers.size,
                excelUsers: this.cache.excelUsers.size
            },
            pendingConflicts: this.conflicts.size,
            lastSync: this.cache.lastSyncTimestamp,
            averageSyncTime: this.metrics.averageSyncTime
        };
    }

    // 📜 LOGS ET AUDIT

    initializeEventHandlers() {
        // Gestion des erreurs globales
        window.addEventListener('error', (event) => {
            this.logger.error('Erreur JavaScript globale', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
        });
    }

    setupEventListeners() {
        // Écouter les changements de configuration
        this.on('configChanged', (config) => {
            this.saveConfiguration();
            if (config.autoSync !== undefined) {
                if (config.autoSync) {
                    this.startBackgroundSync();
                } else {
                    this.stopBackgroundSync();
                }
            }
        });
    }

    generateSyncId() {
        return `SYNC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // 🎛️ GESTION DES ÉVÉNEMENTS

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    this.logger.error(`Erreur listener événement ${event}`, error);
                }
            });
        }
    }

    // 🛠️ CONFIGURATION PUBLIQUE

    updateConfiguration(newConfig) {
        const oldConfig = { ...this.config };
        this.config = { ...this.config, ...newConfig };
        
        this.saveConfiguration();
        
        this.emit('configChanged', {
            oldConfig,
            newConfig: this.config,
            changedFields: Object.keys(newConfig)
        });
        
        this.logger.info('Configuration mise à jour', {
            changes: Object.keys(newConfig)
        });
    }

    getConfiguration() {
        return { ...this.config };
    }

    // 🧹 NETTOYAGE ET DESTRUCTION

    async cleanup() {
        try {
            // Arrêter la synchronisation en arrière-plan
            this.stopBackgroundSync();
            
            // Sauvegarder les données
            this.saveCacheData();
            this.saveConfiguration();
            
            // Fermer la connexion AD
            this.adConnector.disconnect();
            
            // Nettoyer les listeners
            this.listeners.clear();
            
            this.logger.info('Nettoyage synchronisation terminé');
            
        } catch (error) {
            this.logger.error('Erreur lors du nettoyage', error);
        }
    }

    // 📋 MÉTHODES DE CONVENIENCE

    async getSyncStatus() {
        return {
            status: this.status,
            isRunning: this.isRunning,
            lastSync: this.cache.lastSyncTimestamp,
            pendingConflicts: this.conflicts.size,
            metrics: this.getMetrics()
        };
    }

    async forceSyncNow() {
        return await this.startSync({ 
            force: true, 
            autoResolve: false 
        });
    }

    pauseSync() {
        if (this.isRunning) {
            this.status = SYNC_STATUS.PAUSED;
            this.logger.info('Synchronisation mise en pause');
            this.emit('syncPaused', {});
        }
    }

    resumeSync() {
        if (this.status === SYNC_STATUS.PAUSED) {
            this.status = SYNC_STATUS.RUNNING;
            this.logger.info('Synchronisation reprise');
            this.emit('syncResumed', {});
        }
    }

    getSyncHistory(limit = 50) {
        return this.syncHistory.slice(-limit);
    }

    exportAuditLog(format = 'json') {
        const auditData = {
            metrics: this.getMetrics(),
            history: this.getSyncHistory(),
            conflicts: this.getPendingConflicts(),
            config: this.getConfiguration(),
            exportedAt: new Date().toISOString()
        };
        
        switch (format) {
            case 'json':
                return JSON.stringify(auditData, null, 2);
            case 'csv':
                return this.convertToCSV(auditData.history);
            default:
                return auditData;
        }
    }

    convertToCSV(history) {
        const headers = ['Sync ID', 'Duration (ms)', 'Timestamp', 'Status', 'Synced Users', 'Conflicts'];
        const rows = history.map(entry => [
            entry.syncId,
            entry.duration,
            entry.timestamp,
            entry.status,
            entry.result?.syncedUsers || 0,
            entry.result?.conflictsResolved || 0
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
}

/**
 * Logger spécialisé pour la synchronisation
 */
class SyncLogger {
    constructor(level = 'info') {
        this.level = level;
        this.levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };
    }

    shouldLog(level) {
        return this.levels[level] >= this.levels[this.level];
    }

    log(level, message, data = {}) {
        if (!this.shouldLog(level)) return;
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            data
        };
        
        // Sauvegarder en localStorage pour audit
        this.saveToAuditTrail(logEntry);
        
        // Afficher selon le niveau
        switch (level) {
            case 'debug':
                console.debug(`[AD Sync Debug] ${message}`, data);
                break;
            case 'info':
                console.info(`[AD Sync] ${message}`, data);
                break;
            case 'warn':
                console.warn(`[AD Sync Warning] ${message}`, data);
                break;
            case 'error':
                console.error(`[AD Sync Error] ${message}`, data);
                break;
        }
    }

    debug(message, data) {
        this.log('debug', message, data);
    }

    info(message, data) {
        this.log('info', message, data);
    }

    warn(message, data) {
        this.log('warn', message, data);
    }

    error(message, data) {
        this.log('error', message, data);
    }

    saveToAuditTrail(logEntry) {
        try {
            const key = 'ad_sync_audit_trail';
            const existing = localStorage.getItem(key);
            const trail = existing ? JSON.parse(existing) : [];
            
            trail.push(logEntry);
            
            // Garder seulement les 1000 dernières entrées
            if (trail.length > 1000) {
                trail.splice(0, trail.length - 1000);
            }
            
            localStorage.setItem(key, JSON.stringify(trail));
        } catch (error) {
            console.warn('Impossible de sauvegarder l\'audit trail:', error);
        }
    }
}

// Export
export default ActiveDirectorySync;
export { SYNC_DIRECTION, CONFLICT_TYPE, CONFLICT_RESOLUTION, SYNC_STATUS };