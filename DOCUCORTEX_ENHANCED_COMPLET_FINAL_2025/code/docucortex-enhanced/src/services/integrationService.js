// src/services/integrationService.js - SERVICE D'INTÉGRATIONS EXTERNES DOCUCORTEX
// Service centralisé pour la gestion des intégrations avec systèmes externes (AD, CMDB, Help Desk)

import ActiveDirectoryConnector from '../integrations/ActiveDirectoryConnector.js';
import CMDBConnector from '../integrations/CMDBConnector.js';
import HelpDeskConnector from '../integrations/HelpDeskConnector.js';
import EmailConnector from '../integrations/EmailConnector.js';
import CalendarConnector from '../integrations/CalendarConnector.js';
import apiService from './apiService.js';
import { format, parseISO } from 'date-fns';

// Configuration des intégrations
const INTEGRATION_CONFIG = {
    activeDirectory: {
        enabled: true,
        syncInterval: 300000, // 5 minutes
        ldapUrl: process.env.REACT_APP_AD_LDAP_URL || '',
        domain: process.env.REACT_APP_AD_DOMAIN || '',
        bindDN: process.env.REACT_APP_AD_BIND_DN || '',
        bindCredentials: process.env.REACT_APP_AD_BIND_CREDENTIALS || '',
        ouBase: process.env.REACT_APP_AD_OU_BASE || 'DC=domain,DC=com',
        autoSync: true,
        fieldMappings: {
            userPrincipalName: 'email',
            displayName: 'fullName',
            givenName: 'firstName',
            sn: 'lastName',
            mail: 'email',
            telephoneNumber: 'phone',
            mobile: 'mobilePhone',
            department: 'department',
            title: 'position',
            manager: 'managerId'
        }
    },
    cmdb: {
        enabled: true,
        apiUrl: process.env.REACT_APP_CMDB_API_URL || '',
        apiKey: process.env.REACT_APP_CMDB_API_KEY || '',
        syncInterval: 600000, // 10 minutes
        autoSync: true,
        endpoints: {
            equipment: '/api/equipment',
            assets: '/api/assets',
            warranties: '/api/warranties',
            locations: '/api/locations'
        }
    },
    helpDesk: {
        enabled: true,
        apiUrl: process.env.REACT_APP_HELPDESK_API_URL || '',
        apiKey: process.env.REACT_APP_HELPDESK_API_KEY || '',
        autoTicketCreation: true,
        ticketCategories: {
            equipment: 'Equipment',
            document: 'Document',
            user: 'User',
            technical: 'Technical'
        }
    },
    email: {
        enabled: true,
        smtp: {
            host: process.env.REACT_APP_SMTP_HOST || 'localhost',
            port: process.env.REACT_APP_SMTP_PORT || 587,
            secure: false,
            auth: {
                user: process.env.REACT_APP_SMTP_USER || '',
                pass: process.env.REACT_APP_SMTP_PASS || ''
            }
        },
        templates: {
            loanReminder: 'loan_reminder',
            overdueNotice: 'overdue_notice',
            equipmentReturn: 'equipment_return',
            userWelcome: 'user_welcome'
        }
    },
    calendar: {
        enabled: true,
        provider: process.env.REACT_APP_CALENDAR_PROVIDER || 'google',
        apiKey: process.env.REACT_APP_CALENDAR_API_KEY || '',
        clientId: process.env.REACT_APP_CALENDAR_CLIENT_ID || '',
        calendarId: process.env.REACT_APP_CALENDAR_ID || 'primary'
    }
};

// États des intégrations
const INTEGRATION_STATUS = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    SYNCING: 'syncing',
    ERROR: 'error',
    MAINTENANCE: 'maintenance'
};

// Types de synchronisation
const SYNC_TYPES = {
    FULL: 'full',
    INCREMENTAL: 'incremental',
    PARTIAL: 'partial'
};

class IntegrationService {
    constructor() {
        this.connectors = new Map();
        this.syncStatus = new Map();
        this.lastSyncTimes = new Map();
        this.eventHandlers = new Map();
        this.syncQueues = new Map();
        this.circuitBreakers = new Map();
        
        // Initialiser les connecteurs
        this.initializeConnectors();
        
        // Démarrer la synchronisation automatique
        this.startAutoSync();
    }

    // 🔧 Initialisation des connecteurs
    initializeConnectors() {
        try {
            // Active Directory
            if (INTEGRATION_CONFIG.activeDirectory.enabled) {
                this.connectors.set('activeDirectory', new ActiveDirectoryConnector(INTEGRATION_CONFIG.activeDirectory));
            }

            // CMDB
            if (INTEGRATION_CONFIG.cmdb.enabled) {
                this.connectors.set('cmdb', new CMDBConnector(INTEGRATION_CONFIG.cmdb));
            }

            // Help Desk
            if (INTEGRATION_CONFIG.helpDesk.enabled) {
                this.connectors.set('helpDesk', new HelpDeskConnector(INTEGRATION_CONFIG.helpDesk));
            }

            // Email
            if (INTEGRATION_CONFIG.email.enabled) {
                this.connectors.set('email', new EmailConnector(INTEGRATION_CONFIG.email));
            }

            // Calendar
            if (INTEGRATION_CONFIG.calendar.enabled) {
                this.connectors.set('calendar', new CalendarConnector(INTEGRATION_CONFIG.calendar));
            }

            console.log(`${this.connectors.size} connecteurs d'intégration initialisés`);
        } catch (error) {
            console.error('Erreur lors de l\'initialisation des connecteurs:', error);
        }
    }

    // 🔄 Synchronisation automatique
    startAutoSync() {
        // Synchronisation AD
        if (INTEGRATION_CONFIG.activeDirectory.autoSync) {
            setInterval(() => {
                this.syncActiveDirectoryUsers(SYNC_TYPES.INCREMENTAL);
            }, INTEGRATION_CONFIG.activeDirectory.syncInterval);
        }

        // Synchronisation CMDB
        if (INTEGRATION_CONFIG.cmdb.autoSync) {
            setInterval(() => {
                this.syncEquipmentInventory(SYNC_TYPES.INCREMENTAL);
            }, INTEGRATION_CONFIG.cmdb.syncInterval);
        }
    }

    // 👥 SYNCHRONISATION ACTIVE DIRECTORY

    async syncActiveDirectoryUsers(syncType = SYNC_TYPES.FULL) {
        const connector = this.connectors.get('activeDirectory');
        if (!connector) {
            throw new Error('Connecteur Active Directory non disponible');
        }

        const syncId = this.generateSyncId('ad_users');
        this.setSyncStatus('activeDirectory', SYNC_TYPES.SYNCING, syncId);

        try {
            const result = await connector.syncUsers(syncType);
            
            // Traiter les utilisateurs synchronisés
            await this.processSyncedUsers(result.users);

            this.updateLastSyncTime('activeDirectory');
            this.setSyncStatus('activeDirectory', INTEGRATION_STATUS.CONNECTED, syncId);

            // Émettre l'événement
            this.emitEvent('activeDirectory:syncCompleted', {
                type: syncType,
                result,
                timestamp: new Date()
            });

            return result;
        } catch (error) {
            console.error('Erreur synchronisation AD:', error);
            this.setSyncStatus('activeDirectory', INTEGRATION_STATUS.ERROR, syncId);
            this.handleSyncError('activeDirectory', error);
            throw error;
        }
    }

    async processSyncedUsers(users) {
        const processedUsers = [];
        
        for (const user of users) {
            try {
                // Normaliser les données utilisateur
                const normalizedUser = this.normalizeUserData(user);
                
                // Mettre à jour ou créer l'utilisateur
                const result = await this.upsertUser(normalizedUser);
                processedUsers.push(result);
                
                // Synchroniser les groupes si configuré
                if (user.groups && user.groups.length > 0) {
                    await this.syncUserGroups(user.dn, user.groups);
                }
                
            } catch (error) {
                console.error(`Erreur traitement utilisateur ${user.samAccountName}:`, error);
            }
        }

        return processedUsers;
    }

    normalizeUserData(user) {
        const mappings = INTEGRATION_CONFIG.activeDirectory.fieldMappings;
        const normalized = {
            externalId: user.dn,
            externalSystem: 'activeDirectory',
            source: 'AD_SYNC',
            isActive: user.userAccountControl ? (user.userAccountControl & 0x2) === 0 : true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Appliquer les mappings de champs
        Object.keys(mappings).forEach(adField => {
            if (user[adField]) {
                normalized[mappings[adField]] = user[adField];
            }
        });

        return normalized;
    }

    async upsertUser(userData) {
        // Vérifier si l'utilisateur existe
        const existingUsers = await apiService.getUsers({ externalId: userData.externalId });
        
        if (existingUsers.length > 0) {
            // Mise à jour
            const existingUser = existingUsers[0];
            const updatedUser = {
                ...existingUser,
                ...userData,
                updatedAt: new Date().toISOString()
            };
            return await apiService.updateUser(existingUser.id, updatedUser);
        } else {
            // Création
            const newUser = {
                ...userData,
                id: this.generateUserId()
            };
            return await apiService.createUser(newUser);
        }
    }

    // 🖥️ SYNCHRONISATION CMDB

    async syncEquipmentInventory(syncType = SYNC_TYPES.FULL) {
        const connector = this.connectors.get('cmdb');
        if (!connector) {
            throw new Error('Connecteur CMDB non disponible');
        }

        const syncId = this.generateSyncId('cmdb_equipment');
        this.setSyncStatus('cmdb', SYNC_TYPES.SYNCING, syncId);

        try {
            const result = await connector.syncEquipment(syncType);
            
            // Traiter les équipements synchronisés
            await this.processSyncedEquipment(result.equipment);

            this.updateLastSyncTime('cmdb');
            this.setSyncStatus('cmdb', INTEGRATION_STATUS.CONNECTED, syncId);

            // Vérifier les alertes de garantie
            await this.checkWarrantyAlerts();

            this.emitEvent('cmdb:syncCompleted', {
                type: syncType,
                result,
                timestamp: new Date()
            });

            return result;
        } catch (error) {
            console.error('Erreur synchronisation CMDB:', error);
            this.setSyncStatus('cmdb', INTEGRATION_STATUS.ERROR, syncId);
            this.handleSyncError('cmdb', error);
            throw error;
        }
    }

    async processSyncedEquipment(equipmentList) {
        const processedEquipment = [];
        
        for (const equipment of equipmentList) {
            try {
                // Normaliser les données d'équipement
                const normalizedEquipment = this.normalizeEquipmentData(equipment);
                
                // Mettre à jour ou créer l'équipement
                const result = await this.upsertEquipment(normalizedEquipment);
                processedEquipment.push(result);
                
            } catch (error) {
                console.error(`Erreur traitement équipement ${equipment.assetTag}:`, error);
            }
        }

        return processedEquipment;
    }

    normalizeEquipmentData(equipment) {
        const normalized = {
            externalId: equipment.id,
            externalSystem: 'cmdb',
            source: 'CMDB_SYNC',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Mapping des champs CMDB
        normalized.name = equipment.name || equipment.assetTag;
        normalized.type = equipment.category || 'Unknown';
        normalized.model = equipment.model || '';
        normalized.manufacturer = equipment.manufacturer || '';
        normalized.serialNumber = equipment.serialNumber || '';
        normalized.assetTag = equipment.assetTag || '';
        normalized.location = equipment.location || '';
        normalized.status = this.mapEquipmentStatus(equipment.status);
        normalized.purchaseDate = equipment.purchaseDate || equipment.installDate;
        normalized.warrantyExpiration = equipment.warrantyEndDate;
        normalized.value = equipment.value || 0;
        normalized.notes = equipment.description || '';

        return normalized;
    }

    async upsertEquipment(equipmentData) {
        // Implémentation similaire à upsertUser
        // Pour la brevity, on utilise l'API service directement
        return await apiService.createOrUpdateEquipment(equipmentData);
    }

    // 🎫 INTÉGRATION HELP DESK

    async createHelpDeskTicket(ticketData) {
        const connector = this.connectors.get('helpDesk');
        if (!connector) {
            throw new Error('Connecteur Help Desk non disponible');
        }

        try {
            const result = await connector.createTicket(ticketData);
            
            // Enregistrer le ticket dans DocuCortex
            await this.recordTicketReference(result);
            
            this.emitEvent('helpDesk:ticketCreated', {
                ticketId: result.id,
                data: ticketData,
                timestamp: new Date()
            });

            return result;
        } catch (error) {
            console.error('Erreur création ticket:', error);
            throw error;
        }
    }

    async updateTicketStatus(ticketId, status, comments = '') {
        const connector = this.connectors.get('helpDesk');
        if (!connector) {
            throw new Error('Connecteur Help Desk non disponible');
        }

        try {
            const result = await connector.updateTicket(ticketId, {
                status,
                comments,
                updatedBy: 'DocuCortex System',
                updatedAt: new Date().toISOString()
            });

            this.emitEvent('helpDesk:ticketUpdated', {
                ticketId,
                status,
                comments,
                timestamp: new Date()
            });

            return result;
        } catch (error) {
            console.error('Erreur mise à jour ticket:', error);
            throw error;
        }
    }

    // 📧 INTÉGRATION EMAIL

    async sendNotificationEmail(template, recipient, data = {}) {
        const connector = this.connectors.get('email');
        if (!connector) {
            throw new Error('Connecteur Email non disponible');
        }

        try {
            const result = await connector.sendEmail({
                template,
                recipient,
                data,
                timestamp: new Date().toISOString()
            });

            this.emitEvent('email:notificationSent', {
                template,
                recipient,
                success: result.success,
                timestamp: new Date()
            });

            return result;
        } catch (error) {
            console.error('Erreur envoi email:', error);
            throw error;
        }
    }

    async sendLoanReminder(loanId, reminderData = {}) {
        const loan = await apiService.getLoanById(loanId);
        const borrower = await apiService.getUserById(loan.borrowerId);
        
        if (!borrower.email) {
            throw new Error('Email de l\'emprunteur non disponible');
        }

        return await this.sendNotificationEmail('loanReminder', borrower.email, {
            ...reminderData,
            loan,
            borrower,
            dueDate: loan.returnDate
        });
    }

    // 📅 INTÉGRATION CALENDRIER

    async createCalendarEvent(eventData) {
        const connector = this.connectors.get('calendar');
        if (!connector) {
            throw new Error('Connecteur Calendrier non disponible');
        }

        try {
            const result = await connector.createEvent({
                ...eventData,
                source: 'DocuCortex',
                timestamp: new Date().toISOString()
            });

            this.emitEvent('calendar:eventCreated', {
                eventId: result.id,
                data: eventData,
                timestamp: new Date()
            });

            return result;
        } catch (error) {
            console.error('Erreur création événement:', error);
            throw error;
        }
    }

    async scheduleEquipmentReservation(equipmentId, userId, startDate, endDate) {
        const equipment = await apiService.getEquipmentById(equipmentId);
        const user = await apiService.getUserById(userId);

        return await this.createCalendarEvent({
            title: `Réservation: ${equipment.name}`,
            description: `Réservation de l'équipement ${equipment.name} par ${user.fullName}`,
            startDate,
            endDate,
            attendees: [user.email],
            resources: [equipment.name],
            category: 'Equipment Reservation'
        });
    }

    // 🛠️ UTILITAIRES ET GESTION

    generateSyncId(prefix) {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateUserId() {
        return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    setSyncStatus(integration, status, syncId = null) {
        this.syncStatus.set(integration, {
            status,
            syncId,
            timestamp: new Date().toISOString()
        });

        this.emitEvent('integration:statusChanged', {
            integration,
            status,
            syncId,
            timestamp: new Date()
        });
    }

    updateLastSyncTime(integration) {
        this.lastSyncTimes.set(integration, new Date().toISOString());
    }

    handleSyncError(integration, error) {
        // Implémenter le circuit breaker pattern
        const breaker = this.circuitBreakers.get(integration) || {
            failures: 0,
            threshold: 5,
            timeout: 300000 // 5 minutes
        };

        breaker.failures++;
        breaker.lastFailure = new Date();

        if (breaker.failures >= breaker.threshold) {
            breaker.isOpen = true;
            breaker.openUntil = new Date(Date.now() + breaker.timeout);
            console.warn(`Circuit breaker ouvert pour ${integration}`);
        }

        this.circuitBreakers.set(integration, breaker);

        // Émettre l'événement d'erreur
        this.emitEvent('integration:error', {
            integration,
            error: error.message,
            timestamp: new Date(),
            breaker: breaker.isOpen ? 'OPEN' : 'CLOSED'
        });
    }

    mapEquipmentStatus(cmdbStatus) {
        const statusMap = {
            'Active': 'active',
            'In Use': 'in_use',
            'Available': 'available',
            'Maintenance': 'maintenance',
            'Retired': 'retired',
            'Lost': 'lost'
        };
        return statusMap[cmdbStatus] || 'unknown';
    }

    async checkWarrantyAlerts() {
        const connector = this.connectors.get('cmdb');
        if (!connector) return;

        try {
            const expiringWarranties = await connector.getExpiringWarranties(30); // 30 jours
            
            for (const equipment of expiringWarranties) {
                await this.sendNotificationEmail('warrantyAlert', 'admin@company.com', {
                    equipment: equipment.name,
                    assetTag: equipment.assetTag,
                    warrantyEndDate: equipment.warrantyEndDate,
                    daysUntilExpiration: equipment.daysUntilExpiration
                });
            }
        } catch (error) {
            console.error('Erreur vérification garanties:', error);
        }
    }

    // 🎯 GESTION DES ÉVÉNEMENTS

    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }

    off(event, handler) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    emitEvent(event, data) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Erreur dans le gestionnaire d'événement ${event}:`, error);
                }
            });
        }
    }

    // 📊 MÉTHODES DE STATUT ET MONITORING

    getIntegrationStatus() {
        const status = {};
        
        this.connectors.forEach((connector, name) => {
            status[name] = {
                connected: connector.isConnected(),
                lastSync: this.lastSyncTimes.get(name),
                syncStatus: this.syncStatus.get(name),
                circuitBreaker: this.circuitBreakers.get(name)
            };
        });

        return status;
    }

    getSyncHistory(limit = 50) {
        // Retourner l'historique des synchronisations
        return this.syncHistory ? this.syncHistory.slice(-limit) : [];
    }

    async healthCheck() {
        const health = {
            timestamp: new Date().toISOString(),
            overall: 'healthy',
            integrations: {}
        };

        for (const [name, connector] of this.connectors) {
            try {
                const status = await connector.healthCheck();
                health.integrations[name] = status;
            } catch (error) {
                health.integrations[name] = {
                    healthy: false,
                    error: error.message
                };
                health.overall = 'degraded';
            }
        }

        return health;
    }

    // 🔄 MÉTHODES DE RECONNEXION

    async reconnect(integrationName) {
        const connector = this.connectors.get(integrationName);
        if (!connector) {
            throw new Error(`Connecteur ${integrationName} non trouvé`);
        }

        this.setSyncStatus(integrationName, INTEGRATION_STATUS.CONNECTING);

        try {
            await connector.reconnect();
            this.setSyncStatus(integrationName, INTEGRATION_STATUS.CONNECTED);
            this.circuitBreakers.delete(integrationName);
            
            return true;
        } catch (error) {
            this.setSyncStatus(integrationName, INTEGRATION_STATUS.ERROR);
            throw error;
        }
    }

    async testConnection(integrationName) {
        const connector = this.connectors.get(integrationName);
        if (!connector) {
            throw new Error(`Connecteur ${integrationName} non trouvé`);
        }

        return await connector.testConnection();
    }

    // 🚫 ARRÊT ET NETTOYAGE

    disconnect() {
        this.connectors.forEach(connector => {
            connector.disconnect();
        });

        this.connectors.clear();
        this.syncStatus.clear();
        this.eventHandlers.clear();
        this.circuitBreakers.clear();
        
        console.log('Service d\'intégrations déconnecté');
    }
}

// Export d'une instance singleton
const integrationService = new IntegrationService();

export default integrationService;
export { INTEGRATION_CONFIG, INTEGRATION_STATUS, SYNC_TYPES };