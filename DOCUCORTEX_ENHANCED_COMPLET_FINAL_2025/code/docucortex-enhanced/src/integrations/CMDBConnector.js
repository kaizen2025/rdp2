// src/integrations/CMDBConnector.js - CONNECTEUR CMDB
// Connecteur pour synchronisation avec les systèmes de gestion de configuration (CMDB)

class CMDBConnector {
    constructor(config = {}) {
        this.config = {
            apiUrl: config.apiUrl || '',
            apiKey: config.apiKey || '',
            authToken: config.authToken || '',
            syncInterval: config.syncInterval || 600000, // 10 minutes
            autoSync: config.autoSync !== false,
            endpoints: {
                equipment: config.endpoints?.equipment || '/api/equipment',
                assets: config.endpoints?.assets || '/api/assets',
                warranties: config.endpoints?.warranties || '/api/warranties',
                locations: config.endpoints?.locations || '/api/locations',
                maintenance: config.endpoints?.maintenance || '/api/maintenance',
                categories: config.endpoints?.categories || '/api/categories'
            },
            timeout: config.timeout || 30000,
            retryAttempts: config.retryAttempts || 3,
            enabled: config.enabled !== false,
            batchSize: config.batchSize || 100,
            ...config
        };

        this.api = null;
        this.isConnected = false;
        this.lastSync = null;
        this.syncQueue = [];
        this.equipmentCache = new Map();
        this.locationCache = new Map();
        this.warrantyCache = new Map();
        this.connectionHealth = {
            status: 'disconnected',
            lastCheck: null,
            responseTime: null
        };

        // Initialiser l'API client
        this.initializeClient();
    }

    // 🔧 Initialisation du client API
    initializeClient() {
        if (!this.config.apiUrl) {
            console.warn('URL API CMDB non configurée, utilisation du mode simulation');
            return;
        }

        // Créer un client HTTP avec configuration
        this.api = {
            baseURL: this.config.apiUrl,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`,
                'X-API-Key': this.config.apiKey
            },
            timeout: this.config.timeout
        };

        console.log('Client CMDB initialisé');
    }

    // 🔗 Connexion et authentification
    async connect() {
        if (this.isConnected) return;

        if (!this.config.apiUrl) {
            console.warn('Mode simulation CMDB activé');
            this.isConnected = true;
            return;
        }

        try {
            // Test de connexion
            const response = await this.makeRequest('/health', 'GET');
            
            if (response.status === 'healthy' || response.ok) {
                this.isConnected = true;
                this.connectionHealth.status = 'connected';
                this.connectionHealth.lastCheck = new Date().toISOString();
                console.log('Connecté au système CMDB');
            } else {
                throw new Error(`Réponse non valide: ${response.status}`);
            }
        } catch (error) {
            console.error('Erreur connexion CMDB:', error);
            throw error;
        }
    }

    async authenticate() {
        if (!this.api) {
            return { authenticated: false, reason: 'Mode simulation' };
        }

        try {
            const response = await this.makeRequest('/auth/validate', 'GET');
            
            return {
                authenticated: response.valid || response.status === 200,
                user: response.user || null,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                authenticated: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    disconnect() {
        this.isConnected = false;
        this.api = null;
        this.equipmentCache.clear();
        this.locationCache.clear();
        this.warrantyCache.clear();
        console.log('Déconnecté du système CMDB');
    }

    // 🔄 Synchronisation des équipements
    async syncEquipment(syncType = 'full') {
        if (!this.isConnected) {
            await this.connect();
        }

        try {
            let equipment = [];
            let metadata = {};

            switch (syncType) {
                case 'full':
                    const fullResult = await this.syncFullEquipment();
                    equipment = fullResult.equipment;
                    metadata = fullResult.metadata;
                    break;

                case 'incremental':
                    const incrementalResult = await this.syncIncrementalEquipment();
                    equipment = incrementalResult.equipment;
                    metadata = incrementalResult.metadata;
                    break;

                case 'partial':
                    const partialResult = await this.syncPartialEquipment();
                    equipment = partialResult.equipment;
                    metadata = partialResult.metadata;
                    break;

                default:
                    throw new Error(`Type de synchronisation non supporté: ${syncType}`);
            }

            // Mettre en cache les équipements
            this.updateEquipmentCache(equipment);

            this.lastSync = new Date().toISOString();
            
            return {
                type: syncType,
                equipment,
                metadata,
                timestamp: this.lastSync,
                syncId: this.generateSyncId(),
                equipmentCount: equipment.length
            };
        } catch (error) {
            console.error('Erreur synchronisation équipements CMDB:', error);
            throw error;
        }
    }

    async syncFullEquipment() {
        const equipment = [];
        const metadata = {
            totalPages: 0,
            currentPage: 0,
            totalItems: 0
        };

        let page = 1;
        const pageSize = this.config.batchSize;

        while (true) {
            const pageData = await this.getEquipmentPage(page, pageSize);
            
            if (!pageData.items || pageData.items.length === 0) {
                break;
            }

            equipment.push(...pageData.items);
            metadata.totalItems = pageData.total || equipment.length;

            if (pageData.items.length < pageSize || page >= metadata.totalPages) {
                break;
            }

            page++;
            metadata.currentPage = page;
        }

        return { equipment, metadata };
    }

    async syncIncrementalEquipment() {
        const lastSyncTime = this.lastSync ? new Date(this.lastSync) : new Date(Date.now() - 3600000); // 1h par défaut
        
        const updatedEquipment = await this.getUpdatedEquipmentSince(lastSyncTime);
        const newEquipment = await this.getNewEquipmentSince(lastSyncTime);

        return {
            equipment: [...updatedEquipment, ...newEquipment],
            metadata: {
                updatedCount: updatedEquipment.length,
                newCount: newEquipment.length,
                lastSyncTime
            }
        };
    }

    async syncPartialEquipment() {
        // Synchronisation des catégories spécifiques
        const targetCategories = ['IT Equipment', 'Furniture', 'Vehicles', 'Tools'];
        const equipment = [];

        for (const category of targetCategories) {
            const categoryEquipment = await this.getEquipmentByCategory(category);
            equipment.push(...categoryEquipment);
        }

        return {
            equipment,
            metadata: {
                categories: targetCategories,
                categoryCount: targetCategories.length
            }
        };
    }

    // 📊 Récupération des données CMDB
    async getEquipmentPage(page = 1, pageSize = 100) {
        if (!this.api) {
            return this.getMockEquipmentPage(page, pageSize);
        }

        const params = new URLSearchParams({
            page: page.toString(),
            pageSize: pageSize.toString(),
            includeInactive: 'false'
        });

        return await this.makeRequest(`${this.config.endpoints.equipment}?${params}`, 'GET');
    }

    async getEquipmentById(equipmentId) {
        if (!this.api) {
            return this.getMockEquipment(equipmentId);
        }

        return await this.makeRequest(`${this.config.endpoints.equipment}/${equipmentId}`, 'GET');
    }

    async getEquipmentByCategory(category) {
        if (!this.api) {
            return this.getMockEquipmentByCategory(category);
        }

        const params = new URLSearchParams({ category });
        return await this.makeRequest(`${this.config.endpoints.equipment}?${params}`, 'GET');
    }

    async getUpdatedEquipmentSince(timestamp) {
        if (!this.api) {
            return this.getMockUpdatedEquipment(timestamp);
        }

        const params = new URLSearchParams({
            updatedSince: timestamp.toISOString(),
            includeDeleted: 'false'
        });

        const response = await this.makeRequest(`${this.config.endpoints.equipment}?${params}`, 'GET');
        return response.items || [];
    }

    async getNewEquipmentSince(timestamp) {
        // Logique similaire à getUpdatedEquipmentSince mais pour les nouveaux équipements
        return this.getUpdatedEquipmentSince(timestamp);
    }

    // 🏢 Gestion des localisations
    async syncLocations() {
        if (!this.api) {
            return this.getMockLocations();
        }

        try {
            const response = await this.makeRequest(this.config.endpoints.locations, 'GET');
            const locations = response.items || [];

            // Mettre en cache les localisations
            this.locationCache.clear();
            locations.forEach(location => {
                this.locationCache.set(location.id, location);
            });

            return locations;
        } catch (error) {
            console.error('Erreur synchronisation localisations:', error);
            throw error;
        }
    }

    async getLocationHierarchy() {
        const locations = Array.from(this.locationCache.values());
        
        const hierarchy = this.buildLocationHierarchy(locations);
        return hierarchy;
    }

    buildLocationHierarchy(locations) {
        const locationMap = new Map();
        const rootLocations = [];

        // Créer une map des localisations par ID
        locations.forEach(location => {
            location.children = [];
            locationMap.set(location.id, location);
        });

        // Construire la hiérarchie
        locations.forEach(location => {
            if (location.parentId) {
                const parent = locationMap.get(location.parentId);
                if (parent) {
                    parent.children.push(location);
                }
            } else {
                rootLocations.push(location);
            }
        });

        return rootLocations;
    }

    // 📅 Gestion des garanties
    async syncWarranties() {
        if (!this.api) {
            return this.getMockWarranties();
        }

        try {
            const response = await this.makeRequest(this.config.endpoints.warranties, 'GET');
            const warranties = response.items || [];

            // Mettre en cache les garanties
            this.warrantyCache.clear();
            warranties.forEach(warranty => {
                this.warrantyCache.set(warranty.equipmentId, warranty);
            });

            return warranties;
        } catch (error) {
            console.error('Erreur synchronisation garanties:', error);
            throw error;
        }
    }

    async getExpiringWarranties(days = 30) {
        const warrantyDays = days * 24 * 60 * 60 * 1000; // Convertir en millisecondes
        const expirationThreshold = Date.now() + warrantyDays;

        const expiring = [];
        
        this.warrantyCache.forEach((warranty, equipmentId) => {
            if (warranty.endDate) {
                const endDate = new Date(warranty.endDate);
                if (endDate.getTime() <= expirationThreshold) {
                    const equipment = this.equipmentCache.get(equipmentId);
                    if (equipment) {
                        expiring.push({
                            ...equipment,
                            warrantyEndDate: warranty.endDate,
                            daysUntilExpiration: Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                        });
                    }
                }
            }
        });

        return expiring.sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration);
    }

    // 🔧 Gestion de la maintenance
    async syncMaintenanceSchedule() {
        if (!this.api) {
            return this.getMockMaintenance();
        }

        try {
            const response = await this.makeRequest(this.config.endpoints.maintenance, 'GET');
            return response.items || [];
        } catch (error) {
            console.error('Erreur synchronisation maintenance:', error);
            throw error;
        }
    }

    async getUpcomingMaintenance(days = 30) {
        const maintenanceItems = await this.syncMaintenanceSchedule();
        const threshold = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

        return maintenanceItems.filter(item => {
            const maintenanceDate = new Date(item.scheduledDate);
            return maintenanceDate <= threshold && maintenanceDate >= new Date();
        });
    }

    async scheduleMaintenance(equipmentId, maintenanceData) {
        if (!this.api) {
            return this.getMockMaintenanceItem(equipmentId, maintenanceData);
        }

        const payload = {
            ...maintenanceData,
            equipmentId,
            createdBy: 'DocuCortex',
            createdAt: new Date().toISOString()
        };

        return await this.makeRequest(this.config.endpoints.maintenance, 'POST', payload);
    }

    // 📊 Statistiques et rapports
    async getEquipmentStatistics() {
        const equipment = Array.from(this.equipmentCache.values());
        
        const stats = {
            total: equipment.length,
            byCategory: {},
            byStatus: {},
            byLocation: {},
            warrantyStatus: {
                active: 0,
                expired: 0,
                expiringSoon: 0
            }
        };

        equipment.forEach(item => {
            // Par catégorie
            const category = item.category || 'Unknown';
            stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

            // Par statut
            const status = item.status || 'Unknown';
            stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

            // Par localisation
            const location = item.location || 'Unknown';
            stats.byLocation[location] = (stats.byLocation[location] || 0) + 1;

            // Statut garantie
            const warranty = this.warrantyCache.get(item.id);
            if (warranty) {
                const endDate = new Date(warranty.endDate);
                const now = new Date();
                const daysUntilExpiration = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                if (daysUntilExpiration < 0) {
                    stats.warrantyStatus.expired++;
                } else if (daysUntilExpiration <= 30) {
                    stats.warrantyStatus.expiringSoon++;
                } else {
                    stats.warrantyStatus.active++;
                }
            }
        });

        return stats;
    }

    async getDepreciationReport() {
        const equipment = Array.from(this.equipmentCache.values());
        
        const report = equipment.map(item => {
            const warranty = this.warrantyCache.get(item.id);
            let depreciation = null;

            if (warranty && warranty.purchasePrice) {
                const purchaseDate = new Date(warranty.purchaseDate);
                const now = new Date();
                const ageInYears = (now - purchaseDate) / (365.25 * 24 * 60 * 60 * 1000);
                
                // Calcul de dépréciation linéaire sur 5 ans
                const depreciationRate = 1 / 5; // 20% par an
                const depreciationAmount = warranty.purchasePrice * depreciationRate * ageInYears;
                const currentValue = warranty.purchasePrice - depreciationAmount;

                depreciation = {
                    purchasePrice: warranty.purchasePrice,
                    currentValue: Math.max(currentValue, 0),
                    depreciationAmount,
                    depreciationRate: depreciationRate * 100,
                    ageInYears: Math.round(ageInYears * 100) / 100
                };
            }

            return {
                equipmentId: item.id,
                assetTag: item.assetTag,
                name: item.name,
                category: item.category,
                depreciation
            };
        });

        return report;
    }

    // 🔍 Recherche et filtrage
    async searchEquipment(criteria) {
        const equipment = Array.from(this.equipmentCache.values());
        
        return equipment.filter(item => {
            return Object.entries(criteria).every(([key, value]) => {
                if (value === null || value === undefined || value === '') {
                    return true;
                }

                const itemValue = item[key];
                if (typeof value === 'string') {
                    return itemValue && itemValue.toString().toLowerCase().includes(value.toLowerCase());
                }

                return itemValue === value;
            });
        });
    }

    async getEquipmentByLocation(locationId) {
        const equipment = Array.from(this.equipmentCache.values());
        return equipment.filter(item => item.locationId === locationId);
    }

    // 🧪 Tests et validation
    async testConnection() {
        try {
            await this.connect();
            
            const response = await this.makeRequest('/health', 'GET');
            
            return {
                connected: true,
                apiVersion: response.version || 'unknown',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                connected: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async healthCheck() {
        try {
            if (!this.isConnected) {
                await this.connect();
            }

            const startTime = Date.now();
            const response = await this.makeRequest('/health', 'GET');
            const responseTime = Date.now() - startTime;

            this.connectionHealth = {
                status: response.status || 'healthy',
                lastCheck: new Date().toISOString(),
                responseTime
            };

            return {
                healthy: true,
                responseTime,
                status: response.status,
                lastSync: this.lastSync,
                equipmentCount: this.equipmentCache.size,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            this.connectionHealth.status = 'error';
            this.connectionHealth.lastCheck = new Date().toISOString();
            this.connectionHealth.error = error.message;

            return {
                healthy: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // 🛠️ Utilitaires
    async makeRequest(endpoint, method = 'GET', data = null) {
        if (!this.api) {
            throw new Error('Client API non initialisé');
        }

        const url = `${this.api.baseURL}${endpoint}`;
        const options = {
            method,
            headers: this.api.headers,
            timeout: this.api.timeout
        };

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }

        return await response.text();
    }

    updateEquipmentCache(equipment) {
        equipment.forEach(item => {
            this.equipmentCache.set(item.id, item);
        });
    }

    generateSyncId() {
        return `CMDB_SYNC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // 🧪 Données simulées pour développement
    getMockEquipmentPage(page, pageSize) {
        const mockData = this.getMockEquipment();
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        
        return {
            items: mockData.slice(startIndex, endIndex),
            total: mockData.length,
            page,
            pageSize
        };
    }

    getMockEquipment(equipmentId = null) {
        const equipment = [
            {
                id: 'EQ001',
                assetTag: 'LAP001',
                name: 'Dell Latitude 7420',
                category: 'IT Equipment',
                type: 'Laptop',
                manufacturer: 'Dell',
                model: 'Latitude 7420',
                serialNumber: 'DL7420001',
                status: 'Active',
                location: 'Bureau 101',
                locationId: 'LOC001',
                purchaseDate: '2022-03-15',
                warrantyEndDate: '2025-03-15',
                value: 1200,
                description: 'Ordinateur portable développeur principal',
                assignedTo: 'John Doe',
                createdAt: '2022-03-15T08:00:00Z',
                updatedAt: '2024-01-15T14:30:00Z'
            },
            {
                id: 'EQ002',
                assetTag: 'MON001',
                name: 'Dell UltraSharp 27"',
                category: 'IT Equipment',
                type: 'Monitor',
                manufacturer: 'Dell',
                model: 'UltraSharp U2720Q',
                serialNumber: 'DLU27001',
                status: 'Active',
                location: 'Bureau 101',
                locationId: 'LOC001',
                purchaseDate: '2022-03-20',
                warrantyEndDate: '2025-03-20',
                value: 400,
                description: 'Écran 4K pour développement',
                assignedTo: 'John Doe',
                createdAt: '2022-03-20T08:00:00Z',
                updatedAt: '2024-01-10T09:15:00Z'
            },
            {
                id: 'EQ003',
                assetTag: 'TAB001',
                name: 'iPad Pro 12.9"',
                category: 'Mobile Device',
                type: 'Tablet',
                manufacturer: 'Apple',
                model: 'iPad Pro 12.9"',
                serialNumber: 'IPP12001',
                status: 'Available',
                location: 'Magasin IT',
                locationId: 'LOC002',
                purchaseDate: '2023-06-01',
                warrantyEndDate: '2024-06-01',
                value: 1000,
                description: 'Tablette pour démonstrations client',
                assignedTo: null,
                createdAt: '2023-06-01T08:00:00Z',
                updatedAt: '2024-01-08T16:20:00Z'
            }
        ];

        return equipmentId ? equipment.find(eq => eq.id === equipmentId) : equipment;
    }

    getMockEquipmentByCategory(category) {
        const allEquipment = this.getMockEquipment();
        return allEquipment.filter(eq => eq.category === category);
    }

    getMockUpdatedEquipment(timestamp) {
        const allEquipment = this.getMockEquipment();
        // Simuler que certains équipements ont été mis à jour
        return allEquipment.slice(0, 1);
    }

    getMockLocations() {
        return [
            {
                id: 'LOC001',
                name: 'Bureau 101',
                type: 'Office',
                parentId: null,
                address: '123 Rue de la Paix, 75001 Paris',
                manager: 'John Manager',
                capacity: 10,
                equipmentCount: 2
            },
            {
                id: 'LOC002',
                name: 'Magasin IT',
                type: 'Storage',
                parentId: null,
                address: '456 Rue Tech, 75002 Paris',
                manager: 'IT Manager',
                capacity: 100,
                equipmentCount: 1
            }
        ];
    }

    getMockWarranties() {
        return [
            {
                equipmentId: 'EQ001',
                startDate: '2022-03-15',
                endDate: '2025-03-15',
                type: 'manufacturer',
                status: 'active',
                provider: 'Dell',
                purchasePrice: 1200
            },
            {
                equipmentId: 'EQ002',
                startDate: '2022-03-20',
                endDate: '2025-03-20',
                type: 'manufacturer',
                status: 'active',
                provider: 'Dell',
                purchasePrice: 400
            },
            {
                equipmentId: 'EQ003',
                startDate: '2023-06-01',
                endDate: '2024-06-01',
                type: 'manufacturer',
                status: 'expired',
                provider: 'Apple',
                purchasePrice: 1000
            }
        ];
    }

    getMockMaintenance() {
        return [
            {
                id: 'MAINT001',
                equipmentId: 'EQ001',
                type: 'Preventive',
                scheduledDate: '2024-02-01',
                description: 'Maintenance préventive trimestrielle',
                status: 'Scheduled',
                technician: 'Tech 1'
            }
        ];
    }

    getMockMaintenanceItem(equipmentId, data) {
        return {
            id: `MAINT${Date.now()}`,
            equipmentId,
            ...data,
            status: 'Scheduled',
            createdAt: new Date().toISOString()
        };
    }

    // 📈 Métriques et monitoring
    getMetrics() {
        return {
            connectionStatus: this.isConnected ? 'connected' : 'disconnected',
            lastSync: this.lastSync,
            equipmentCount: this.equipmentCache.size,
            locationCount: this.locationCache.size,
            warrantyCount: this.warrantyCache.size,
            connectionHealth: this.connectionHealth,
            timestamp: new Date().toISOString()
        };
    }
}

export default CMDBConnector;