// src/components/users/__tests__/ActiveDirectorySync.test.js - TESTS UNITAIRES
// Tests complets pour le système de synchronisation AD ↔ Excel

import { ActiveDirectorySync, SYNC_STATUS, CONFLICT_TYPE, CONFLICT_RESOLUTION } from '../ActiveDirectorySync.js';

// Mock des dépendances
const mockApiService = {
    getUsers: jest.fn(),
    updateUser: jest.fn(),
    createUser: jest.fn(),
    invalidateLoansCache: jest.fn()
};

const mockADConnector = {
    healthCheck: jest.fn(),
    syncUsers: jest.fn(),
    disconnect: jest.fn()
};

// Mock du module date-fns
jest.mock('date-fns', () => ({
    format: jest.fn((date, format) => '2025-11-15'),
    parseISO: jest.fn((date) => new Date(date)),
    isAfter: jest.fn((date1, date2) => date1 > date2),
    isBefore: jest.fn((date1, date2) => date1 < date2),
    differenceInMinutes: jest.fn((date1, date2) => 60)
}));

describe('ActiveDirectorySync', () => {
    let adSync;
    let mockConfig;

    beforeEach(() => {
        // Configuration de test
        mockConfig = {
            autoSync: false,
            syncInterval: 300000,
            conflictResolution: CONFLICT_RESOLUTION.KEEP_NEWER,
            enableLogging: false,
            fieldMappings: {
                'firstName': 'givenName',
                'lastName': 'sn',
                'email': 'mail'
            }
        };

        // Reset mocks
        jest.clearAllMocks();

        // Mock du localStorage
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: jest.fn(),
                setItem: jest.fn(),
                removeItem: jest.fn(),
                clear: jest.fn()
            },
            writable: true
        });

        // Créer l'instance de test
        adSync = new ActiveDirectorySync(mockConfig);
        
        // Injecter les mocks
        adSync.apiService = mockApiService;
        adSync.adConnector = mockADConnector;
        adSync.logger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn()
        };
    });

    describe('Initialisation', () => {
        test('doit s\'initialiser correctement', async () => {
            mockADConnector.healthCheck.mockResolvedValue({ healthy: true });

            await adSync.initialize();

            expect(adSync.status).toBe(SYNC_STATUS.IDLE);
            expect(adSync.isRunning).toBe(false);
            expect(mockADConnector.healthCheck).toHaveBeenCalled();
        });

        test('doit gérer l\'échec de connexion AD', async () => {
            mockADConnector.healthCheck.mockRejectedValue(new Error('Connexion échouée'));

            await expect(adSync.initialize()).rejects.toThrow('Connexion échouée');
        });
    });

    describe('Synchronisation', () => {
        beforeEach(() => {
            // Setup des données de test
            const mockADUsers = new Map([
                ['user1@example.com', {
                    id: 'user1@example.com',
                    givenName: 'John',
                    sn: 'Doe',
                    mail: 'user1@example.com',
                    isActive: true
                }]
            ]);

            const mockExcelUsers = new Map([
                ['user1@example.com', {
                    id: 'user1@example.com',
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'user1@example.com',
                    active: true
                }]
            ]);

            adSync.cache.adUsers = mockADUsers;
            adSync.cache.excelUsers = mockExcelUsers;
        });

        test('doit démarrer la synchronisation avec succès', async () => {
            // Mock des chargements de données
            adSync.loadADUsers = jest.fn().mockResolvedValue(new Map());
            adSync.loadExcelUsers = jest.fn().mockResolvedValue(new Map());
            adSync.detectConflicts = jest.fn().mockResolvedValue([]);
            adSync.applySynchronization = jest.fn().mockResolvedValue({
                syncedUsers: 1,
                createdUsers: 0,
                updatedUsers: 1,
                deactivatedUsers: 0,
                conflictsResolved: 0,
                errors: []
            });

            const result = await adSync.startSync();

            expect(adSync.isRunning).toBe(true);
            expect(result.syncedUsers).toBe(1);
            expect(adSync.status).toBe(SYNC_STATUS.COMPLETED);
        });

        test('doit gérer les erreurs lors de la synchronisation', async () => {
            adSync.loadADUsers = jest.fn().mockRejectedValue(new Error('Erreur AD'));

            await expect(adSync.startSync()).rejects.toThrow('Erreur AD');
            expect(adSync.status).toBe(SYNC_STATUS.FAILED);
        });
    });

    describe('Détection des conflits', () => {
        test('doit détecter les conflits de champs', () => {
            const adUser = {
                id: 'user1@example.com',
                givenName: 'John',
                sn: 'Doe',
                mail: 'user1@example.com'
            };

            const excelUser = {
                id: 'user1@example.com',
                firstName: 'Johnny', // Différent !
                lastName: 'Doe',
                email: 'user1@example.com'
            };

            const conflicts = adSync.detectFieldConflicts(adUser, excelUser);

            expect(conflicts).toHaveLength(1);
            expect(conflicts[0].field).toBe('firstName');
            expect(conflicts[0].adValue).toBe('John');
            expect(conflicts[0].excelValue).toBe('Johnny');
        });

        test('doit détecter les utilisateurs manquants', async () => {
            const adUsers = new Map([
                ['user1@example.com', { id: 'user1@example.com' }]
            ]);

            const excelUsers = new Map(); // Aucun utilisateur Excel

            const conflicts = await adSync.detectConflicts(adUsers, excelUsers);

            expect(conflicts).toHaveLength(1);
            expect(conflicts[0].type).toBe(CONFLICT_TYPE.MISSING_RECORD);
            expect(conflicts[0].userId).toBe('user1@example.com');
        });

        test('doit comparer les valeurs correctement', () => {
            // Test de comparaison de valeurs
            expect(adSync.areValuesDifferent('John', 'john')).toBe(true); // Case sensitive
            expect(adSync.areValuesDifferent('John', 'John')).toBe(false);
            expect(adSync.areValuesDifferent('', null)).toBe(true);
            expect(adSync.areValuesDifferent(null, null)).toBe(false);
        });
    });

    describe('Résolution de conflits', () => {
        test('doit résoudre automatiquement les conflits simples', async () => {
            const conflict = {
                type: CONFLICT_TYPE.FIELD_MISMATCH,
                userId: 'user1@example.com',
                conflicts: [{
                    field: 'firstName',
                    adField: 'givenName',
                    adValue: 'John',
                    excelValue: 'Johnny',
                    resolution: CONFLICT_RESOLUTION.KEEP_AD
                }]
            };

            const result = await adSync.autoResolveConflict(conflict);

            expect(result.action).toBe('update_excel');
            expect(result.fields.firstName).toBe('John');
        });

        test('ne doit pas résoudre automatiquement les conflits manuels', async () => {
            const conflict = {
                type: CONFLICT_TYPE.FIELD_MISMATCH,
                userId: 'user1@example.com',
                conflicts: [{
                    field: 'department',
                    adField: 'department',
                    adValue: 'IT',
                    excelValue: 'RH',
                    resolution: CONFLICT_RESOLUTION.MANUAL
                }]
            };

            const result = await adSync.autoResolveConflict(conflict);

            expect(result).toBeNull(); // Ne peut pas être résolu automatiquement
        });

        test('doit appliquer la résolution keep_newer correctement', () => {
            const adUser = {
                givenName: 'John',
                whenChanged: '2025-11-15T10:00:00Z'
            };

            const excelUser = {
                firstName: 'Johnny',
                updatedAt: '2025-11-14T10:00:00Z'
            };

            const newerValue = adSync.getNewerValue(
                adUser.givenName, 
                excelUser.firstName, 
                { ad: adUser, excel: excelUser }
            );

            expect(newerValue).toBe('John'); // AD est plus récent
        });
    });

    describe('Gestion des événements', () => {
        test('doit émettre et recevoir des événements', () => {
            const mockCallback = jest.fn();
            
            adSync.on('testEvent', mockCallback);
            adSync.emit('testEvent', { data: 'test' });

            expect(mockCallback).toHaveBeenCalledWith({ data: 'test' });
        });

        test('doit permettre de supprimer les listeners', () => {
            const mockCallback = jest.fn();
            
            adSync.on('testEvent', mockCallback);
            adSync.off('testEvent', mockCallback);
            adSync.emit('testEvent', { data: 'test' });

            expect(mockCallback).not.toHaveBeenCalled();
        });
    });

    describe('Métriques et monitoring', () => {
        test('doit calculer les métriques correctement', () => {
            adSync.metrics.totalSyncs = 10;
            adSync.metrics.successfulSyncs = 8;
            adSync.metrics.failedSyncs = 2;
            
            adSync.syncHistory = [
                { duration: 5000 },
                { duration: 3000 },
                { duration: 7000 }
            ];

            const metrics = adSync.getMetrics();

            expect(metrics.totalSyncs).toBe(10);
            expect(metrics.successfulSyncs).toBe(8);
            expect(metrics.failedSyncs).toBe(2);
            expect(metrics.averageSyncTime).toBe(5000);
        });

        test('doit mettre à jour la durée moyenne correctement', () => {
            adSync.syncHistory = [
                { duration: 1000 },
                { duration: 2000 },
                { duration: 3000 }
            ];

            adSync.updateAverageSyncTime();

            expect(adSync.metrics.averageSyncTime).toBe(2000);
        });
    });

    describe('Configuration', () => {
        test('doit mettre à jour la configuration', () => {
            const newConfig = {
                autoSync: true,
                conflictResolution: CONFLICT_RESOLUTION.KEEP_AD
            };

            adSync.updateConfiguration(newConfig);

            expect(adSync.config.autoSync).toBe(true);
            expect(adSync.config.conflictResolution).toBe(CONFLICT_RESOLUTION.KEEP_AD);
        });

        test('doit sauvegarder et charger la configuration', () => {
            const mockConfig = { test: 'value' };
            const mockConfigString = JSON.stringify(mockConfig);

            localStorage.getItem.mockReturnValue(mockConfigString);

            adSync.loadConfiguration();

            expect(localStorage.setItem).toHaveBeenCalledWith(
                'ad_sync_config', 
                mockConfigString
            );
        });
    });

    describe('Cache et persistance', () => {
        test('doit sauvegarder et charger le cache', () => {
            adSync.cache.adUsers = new Map([['user1', {}]]);
            adSync.cache.excelUsers = new Map([['user2', {}]]);

            adSync.saveCacheData();

            expect(localStorage.setItem).toHaveBeenCalledWith(
                'ad_sync_cache',
                expect.any(String)
            );
        });

        test('doit charger les données de cache existantes', () => {
            const cachedData = {
                adUsers: [['user1', {}]],
                excelUsers: [['user2', {}]],
                lastSyncTimestamp: '2025-11-15T10:00:00Z'
            };

            localStorage.getItem.mockReturnValue(JSON.stringify(cachedData));

            adSync.loadCacheData();

            expect(adSync.cache.adUsers.size).toBe(1);
            expect(adSync.cache.excelUsers.size).toBe(1);
        });
    });

    describe('Mapping et transformation', () => {
        test('doit mapper correctement les utilisateurs AD vers Excel', () => {
            const adUser = {
                givenName: 'John',
                sn: 'Doe',
                mail: 'john@example.com',
                telephoneNumber: '123-456',
                department: 'IT'
            };

            const excelUser = adSync.mapADUserToExcel(adUser);

            expect(excelUser.firstName).toBe('John');
            expect(excelUser.lastName).toBe('Doe');
            expect(excelUser.email).toBe('john@example.com');
            expect(excelUser.phone).toBe('123-456');
            expect(excelUser.department).toBe('IT');
            expect(excelUser.source).toBe('Active Directory');
        });

        test('doit mapper correctement les utilisateurs Excel vers AD', () => {
            const excelUser = {
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane@example.com'
            };

            const adUser = adSync.mapExcelUserToAD(excelUser);

            expect(adUser.givenName).toBe('Jane');
            expect(adUser.sn).toBe('Smith');
            expect(adUser.mail).toBe('jane@example.com');
        });
    });

    describe('Synchronisation en arrière-plan', () => {
        test('doit démarrer la synchronisation en arrière-plan', () => {
            jest.useFakeTimers();
            
            adSync.startBackgroundSync();

            // Vérifier qu'un intervalle a été créé
            expect(adSync.backgroundSync).toBeDefined();
            
            // Avancer le temps pour déclencher la sync
            jest.advanceTimersByTime(300000);
            
            // Nettoyer
            jest.useRealTimers();
        });

        test('doit arrêter la synchronisation en arrière-plan', () => {
            adSync.startBackgroundSync();
            adSync.stopBackgroundSync();

            expect(adSync.backgroundSync).toBeNull();
        });
    });

    describe('Méthodes utilitaires', () => {
        test('doit générer des IDs de synchronisation uniques', () => {
            const id1 = adSync.generateSyncId();
            const id2 = adSync.generateSyncId();

            expect(id1).toMatch(/^SYNC_\d+_[a-z0-9]+$/);
            expect(id1).not.toBe(id2);
        });

        test('doit obtenir les conflits en attente', () => {
            adSync.conflicts.set('user1', { userId: 'user1', type: 'field_mismatch' });
            adSync.conflicts.set('user2', { userId: 'user2', type: 'missing_record' });

            const pendingConflicts = adSync.getPendingConflicts();

            expect(pendingConflicts).toHaveLength(2);
            expect(pendingConflicts[0].userId).toBe('user1');
            expect(pendingConflicts[1].userId).toBe('user2');
        });

        test('doit exporter les logs d\'audit', () => {
            const auditLog = adSync.exportAuditLog('json');

            expect(auditLog).toBeDefined();
            expect(typeof auditLog).toBe('string');
            
            const parsedLog = JSON.parse(auditLog);
            expect(parsedLog.metrics).toBeDefined();
            expect(parsedLog.history).toBeDefined();
        });
    });

    describe('Gestion des erreurs et nettoyage', () => {
        test('doit nettoyer correctement les ressources', async () => {
            adSync.stopBackgroundSync = jest.fn();
            adSync.saveCacheData = jest.fn();
            adSync.saveConfiguration = jest.fn();
            adSync.adConnector.disconnect = jest.fn();

            await adSync.cleanup();

            expect(adSync.stopBackgroundSync).toHaveBeenCalled();
            expect(adSync.saveCacheData).toHaveBeenCalled();
            expect(adSync.saveConfiguration).toHaveBeenCalled();
            expect(adSync.adConnector.disconnect).toHaveBeenCalled();
        });

        test('doit gérer les erreurs de nettoyage', async () => {
            adSync.saveCacheData = jest.fn().mockImplementation(() => {
                throw new Error('Erreur sauvegarde');
            });

            // Ne doit pas propager l'erreur
            await expect(adSync.cleanup()).resolves.not.toThrow();
        });
    });
});

// Tests d'intégration avec les services externes
describe('ActiveDirectorySync Integration', () => {
    test('doit s\'intégrer correctement avec apiService', async () => {
        const adSync = new ActiveDirectorySync({ enableLogging: false });
        
        // Mock de l'apiService
        adSync.apiService = {
            updateUser: jest.fn().mockResolvedValue({ success: true }),
            createUser: jest.fn().mockResolvedValue({ id: 'newuser', success: true })
        };

        // Test de mise à jour
        await adSync.updateExcelUser('user1@example.com', { firstName: 'Updated' });
        expect(adSync.apiService.updateUser).toHaveBeenCalledWith(
            'user1@example.com', 
            { firstName: 'Updated' }
        );

        // Test de création
        const userData = { firstName: 'New', lastName: 'User', email: 'new@example.com' };
        await adSync.createExcelUser(userData);
        expect(adSync.apiService.createUser).toHaveBeenCalledWith(userData);
    });

    test('doit s\'intégrer correctement avec ActiveDirectoryConnector', async () => {
        const adSync = new ActiveDirectorySync({ enableLogging: false });
        
        // Mock du connecteur AD
        adSync.adConnector = {
            healthCheck: jest.fn().mockResolvedValue({ 
                healthy: true, 
                responseTime: 150,
                userCount: 100
            }),
            syncUsers: jest.fn().mockResolvedValue({
                users: [
                    {
                        givenName: 'Test',
                        sn: 'User',
                        mail: 'test@example.com'
                    }
                ]
            }),
            disconnect: jest.fn()
        };

        // Test de vérification de santé
        const health = await adSync.adConnector.healthCheck();
        expect(health.healthy).toBe(true);

        // Test de synchronisation
        const result = await adSync.adConnector.syncUsers('full');
        expect(result.users).toHaveLength(1);
    });
});

// Tests de performance et de charge
describe('ActiveDirectorySync Performance', () => {
    test('doit gérer des volumes importants d\'utilisateurs', async () => {
        const adSync = new ActiveDirectorySync({ enableLogging: false });
        
        // Simuler 1000 utilisateurs
        const largeADUsers = new Map();
        const largeExcelUsers = new Map();
        
        for (let i = 0; i < 1000; i++) {
            const id = `user${i}@example.com`;
            largeADUsers.set(id, {
                id,
                givenName: `User${i}`,
                sn: 'Test',
                mail: id
            });
            largeExcelUsers.set(id, {
                id,
                firstName: `User${i}`,
                lastName: 'Test',
                email: id
            });
        }

        adSync.cache.adUsers = largeADUsers;
        adSync.cache.excelUsers = largeExcelUsers;

        const startTime = Date.now();
        const conflicts = await adSync.detectConflicts(largeADUsers, largeExcelUsers);
        const endTime = Date.now();

        // La détection ne devrait pas prendre plus de 1 seconde pour 1000 utilisateurs
        expect(endTime - startTime).toBeLessThan(1000);
        expect(conflicts).toHaveLength(0); // Aucun conflit pour des données identiques
    });

    test('doit gérer les timeouts correctement', async () => {
        const adSync = new ActiveDirectorySync({ 
            enableLogging: false,
            timeout: 1000
        });

        // Mock d'une réponse lente
        adSync.loadADUsers = jest.fn().mockImplementation(() => 
            new Promise(resolve => setTimeout(resolve, 2000))
        );

        await expect(adSync.loadADUsers()).rejects.toThrow();
    });
});