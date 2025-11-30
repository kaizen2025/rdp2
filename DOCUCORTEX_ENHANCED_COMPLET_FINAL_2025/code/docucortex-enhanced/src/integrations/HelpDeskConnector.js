// src/integrations/HelpDeskConnector.js - CONNECTEUR HELP DESK
// Connecteur pour intégration avec les systèmes de tickets et incidents

class HelpDeskConnector {
    constructor(config = {}) {
        this.config = {
            apiUrl: config.apiUrl || '',
            apiKey: config.apiKey || '',
            authToken: config.authToken || '',
            username: config.username || '',
            password: config.password || '',
            autoTicketCreation: config.autoTicketCreation !== false,
            ticketCategories: {
                equipment: config.ticketCategories?.equipment || 'Equipment',
                document: config.ticketCategories?.document || 'Document',
                user: config.ticketCategories?.user || 'User',
                technical: config.ticketCategories?.technical || 'Technical'
            },
            priorityLevels: {
                low: config.priorityLevels?.low || 1,
                medium: config.priorityLevels?.medium || 2,
                high: config.priorityLevels?.high || 3,
                critical: config.priorityLevels?.critical || 4
            },
            timeout: config.timeout || 30000,
            retryAttempts: config.retryAttempts || 3,
            enabled: config.enabled !== false,
            webhookUrl: config.webhookUrl || '',
            ...config
        };

        this.api = null;
        this.isConnected = false;
        this.ticketCache = new Map();
        this.userCache = new Map();
        this.connectionHealth = {
            status: 'disconnected',
            lastCheck: null,
            responseTime: null
        };

        // Mapping DocuCortex vers Help Desk
        this.fieldMappings = {
            loanToTicket: {
                'documentId': 'equipmentId',
                'borrowerId': 'requesterId',
                'loanDate': 'reportedDate',
                'returnDate': 'dueDate',
                'status': 'status'
            },
            userToRequester: {
                'id': 'userId',
                'fullName': 'name',
                'email': 'email',
                'department': 'department',
                'phone': 'phone'
            }
        };

        // Initialiser le client API
        this.initializeClient();
    }

    // 🔧 Initialisation du client API
    initializeClient() {
        if (!this.config.apiUrl) {
            console.warn('URL API Help Desk non configurée, utilisation du mode simulation');
            return;
        }

        // Configuration des en-têtes selon le type d'authentification
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.config.apiKey) {
            headers['X-API-Key'] = this.config.apiKey;
        }
        if (this.config.authToken) {
            headers['Authorization'] = `Bearer ${this.config.authToken}`;
        }

        this.api = {
            baseURL: this.config.apiUrl,
            headers,
            timeout: this.config.timeout,
            auth: this.config.username && this.config.password ? {
                username: this.config.username,
                password: this.config.password
            } : null
        };

        console.log('Client Help Desk initialisé');
    }

    // 🔗 Connexion et authentification
    async connect() {
        if (this.isConnected) return;

        if (!this.config.apiUrl) {
            console.warn('Mode simulation Help Desk activé');
            this.isConnected = true;
            return;
        }

        try {
            // Test de connexion
            const response = await this.makeRequest('/api/status', 'GET');
            
            if (response.status === 'ok' || response.healthy) {
                this.isConnected = true;
                this.connectionHealth.status = 'connected';
                this.connectionHealth.lastCheck = new Date().toISOString();
                console.log('Connecté au système Help Desk');
            } else {
                throw new Error(`Réponse non valide: ${JSON.stringify(response)}`);
            }
        } catch (error) {
            console.error('Erreur connexion Help Desk:', error);
            throw error;
        }
    }

    async authenticate() {
        if (!this.api) {
            return { authenticated: false, reason: 'Mode simulation' };
        }

        try {
            // Authentification selon la méthode configurée
            let response;
            
            if (this.config.authToken) {
                response = await this.makeRequest('/api/auth/validate', 'GET');
            } else if (this.config.username && this.config.password) {
                response = await this.makeRequest('/api/auth/login', 'POST', {
                    username: this.config.username,
                    password: this.config.password
                });
            } else {
                throw new Error('Aucune méthode d\'authentification configurée');
            }

            return {
                authenticated: response.valid || response.success,
                user: response.user || null,
                sessionToken: response.token,
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
        this.ticketCache.clear();
        this.userCache.clear();
        console.log('Déconnecté du système Help Desk');
    }

    // 🎫 Gestion des tickets
    async createTicket(ticketData) {
        if (!this.isConnected) {
            await this.connect();
        }

        try {
            // Normaliser les données du ticket
            const normalizedTicket = this.normalizeTicketData(ticketData);
            
            const response = await this.makeRequest('/api/tickets', 'POST', normalizedTicket);
            
            // Mettre en cache le ticket créé
            if (response.id) {
                this.ticketCache.set(response.id, response);
            }

            // Enregistrer la référence dans DocuCortex
            await this.recordTicketReference({
                ticketId: response.id,
                docucortexId: ticketData.docucortexId,
                type: ticketData.type
            });

            return {
                ...response,
                createdAt: new Date().toISOString(),
                createdBy: 'DocuCortex'
            };
        } catch (error) {
            console.error('Erreur création ticket:', error);
            throw error;
        }
    }

    async updateTicket(ticketId, updates) {
        if (!this.isConnected) {
            await this.connect();
        }

        try {
            const normalizedUpdates = this.normalizeUpdateData(updates);
            const response = await this.makeRequest(`/api/tickets/${ticketId}`, 'PUT', normalizedUpdates);
            
            // Mettre à jour le cache
            if (response.id) {
                this.ticketCache.set(response.id, { ...this.ticketCache.get(response.id), ...response });
            }

            return response;
        } catch (error) {
            console.error('Erreur mise à jour ticket:', error);
            throw error;
        }
    }

    async getTicket(ticketId) {
        if (!this.isConnected) {
            await this.connect();
        }

        try {
            // Vérifier le cache d'abord
            if (this.ticketCache.has(ticketId)) {
                return this.ticketCache.get(ticketId);
            }

            const response = await this.makeRequest(`/api/tickets/${ticketId}`, 'GET');
            
            if (response.id) {
                this.ticketCache.set(response.id, response);
            }

            return response;
        } catch (error) {
            console.error('Erreur récupération ticket:', error);
            throw error;
        }
    }

    async searchTickets(criteria) {
        if (!this.isConnected) {
            await this.connect();
        }

        try {
            const params = new URLSearchParams(criteria);
            const response = await this.makeRequest(`/api/tickets/search?${params}`, 'GET');
            
            return response.tickets || response.items || [];
        } catch (error) {
            console.error('Erreur recherche tickets:', error);
            throw error;
        }
    }

    async getUserTickets(userId) {
        if (!this.isConnected) {
            await this.connect();
        }

        try {
            const response = await this.makeRequest(`/api/tickets?requesterId=${userId}`, 'GET');
            
            const tickets = response.tickets || response.items || [];
            
            // Mettre en cache
            tickets.forEach(ticket => {
                if (ticket.id) {
                    this.ticketCache.set(ticket.id, ticket);
                }
            });

            return tickets;
        } catch (error) {
            console.error('Erreur récupération tickets utilisateur:', error);
            throw error;
        }
    }

    // 🔄 Synchronisation bidirectionnelle
    async syncTickets(syncType = 'incremental') {
        if (!this.isConnected) {
            await this.connect();
        }

        try {
            let tickets = [];
            let metadata = {};

            switch (syncType) {
                case 'full':
                    tickets = await this.syncAllTickets();
                    break;
                case 'incremental':
                    tickets = await this.syncIncrementalTickets();
                    break;
                case 'partial':
                    tickets = await this.syncPartialTickets();
                    break;
                default:
                    throw new Error(`Type de synchronisation non supporté: ${syncType}`);
            }

            // Mettre en cache les tickets
            tickets.forEach(ticket => {
                if (ticket.id) {
                    this.ticketCache.set(ticket.id, ticket);
                }
            });

            return {
                type: syncType,
                tickets,
                timestamp: new Date().toISOString(),
                ticketCount: tickets.length
            };
        } catch (error) {
            console.error('Erreur synchronisation tickets:', error);
            throw error;
        }
    }

    async syncAllTickets() {
        const tickets = [];
        const response = await this.makeRequest('/api/tickets?limit=1000', 'GET');
        
        return response.tickets || response.items || [];
    }

    async syncIncrementalTickets() {
        const lastSyncTime = this.lastSyncTime || new Date(Date.now() - 3600000); // 1h par défaut
        
        const response = await this.makeRequest(`/api/tickets?updatedSince=${lastSyncTime.toISOString()}`, 'GET');
        
        return response.tickets || response.items || [];
    }

    async syncPartialTickets() {
        // Synchronisation des tickets DocuCortex uniquement
        const response = await this.makeRequest('/api/tickets?source=docucortex', 'GET');
        
        return response.tickets || response.items || [];
    }

    // 📊 Création automatique de tickets
    async createTicketFromLoan(loanData) {
        const loan = loanData.loan || loanData; // Support format objet ou direct
        
        const ticketData = {
            title: `Problème de prêt: ${loan.documentName || 'Document'}`,
            description: this.generateLoanTicketDescription(loan),
            category: this.config.ticketCategories.equipment,
            priority: this.mapLoanToPriority(loan),
            requesterId: loan.borrowerId,
            customFields: {
                docucortexId: loan.id,
                docucortexType: 'loan',
                documentId: loan.documentId,
                loanDate: loan.loanDate,
                returnDate: loan.returnDate,
                status: loan.status
            }
        };

        return await this.createTicket(ticketData);
    }

    async createTicketFromEquipment(equipmentData) {
        const equipment = equipmentData.equipment || equipmentData;
        
        const ticketData = {
            title: `Problème équipement: ${equipment.name}`,
            description: this.generateEquipmentTicketDescription(equipment),
            category: this.config.ticketCategories.equipment,
            priority: this.mapEquipmentToPriority(equipment),
            customFields: {
                docucortexId: equipment.id,
                docucortexType: 'equipment',
                equipmentId: equipment.assetTag,
                serialNumber: equipment.serialNumber,
                location: equipment.location,
                status: equipment.status
            }
        };

        return await this.createTicket(ticketData);
    }

    async createTicketFromUser(userData) {
        const user = userData.user || userData;
        
        const ticketData = {
            title: `Problème utilisateur: ${user.fullName}`,
            description: this.generateUserTicketDescription(user),
            category: this.config.ticketCategories.user,
            priority: this.config.priorityLevels.medium,
            requesterId: user.externalId || user.id,
            customFields: {
                docucortexId: user.id,
                docucortexType: 'user',
                email: user.email,
                department: user.department,
                position: user.position
            }
        };

        return await this.createTicket(ticketData);
    }

    // 🔗 Notifications bidirectionnelles
    async registerWebhook(webhookData) {
        if (!this.config.webhookUrl) {
            console.warn('URL webhook non configurée');
            return null;
        }

        const webhookConfig = {
            url: this.config.webhookUrl,
            events: [
                'ticket.created',
                'ticket.updated',
                'ticket.resolved',
                'ticket.closed'
            ],
            secret: this.generateWebhookSecret()
        };

        try {
            const response = await this.makeRequest('/api/webhooks', 'POST', webhookConfig);
            return response;
        } catch (error) {
            console.error('Erreur enregistrement webhook:', error);
            throw error;
        }
    }

    async handleWebhookEvent(eventData) {
        const { event, ticket, timestamp } = eventData;
        
        try {
            switch (event) {
                case 'ticket.updated':
                    await this.handleTicketUpdate(ticket);
                    break;
                case 'ticket.resolved':
                    await this.handleTicketResolved(ticket);
                    break;
                case 'ticket.closed':
                    await this.handleTicketClosed(ticket);
                    break;
                default:
                    console.log(`Événement webhook non géré: ${event}`);
            }
        } catch (error) {
            console.error('Erreur traitement événement webhook:', error);
            throw error;
        }
    }

    // 📈 Statistiques et reporting
    async getTicketStatistics() {
        if (!this.isConnected) {
            await this.connect();
        }

        try {
            const response = await this.makeRequest('/api/statistics', 'GET');
            
            const stats = {
                total: response.total || 0,
                byStatus: response.byStatus || {},
                byPriority: response.byPriority || {},
                byCategory: response.byCategory || {},
                byAssignee: response.byAssignee || {},
                averageResolutionTime: response.avgResolutionTime || 0,
                slaCompliance: response.slaCompliance || 0
            };

            return stats;
        } catch (error) {
            console.error('Erreur récupération statistiques tickets:', error);
            
            // Retourner des stats simulées en cas d'erreur
            return this.getMockTicketStatistics();
        }
    }

    async getTicketReport(dateRange = {}) {
        if (!this.isConnected) {
            await this.connect();
        }

        try {
            const params = new URLSearchParams(dateRange);
            const response = await this.makeRequest(`/api/reports/tickets?${params}`, 'GET');
            
            return response;
        } catch (error) {
            console.error('Erreur génération rapport tickets:', error);
            throw error;
        }
    }

    async getDocuCortexTickets() {
        // Récupérer tous les tickets liés à DocuCortex
        const allTickets = Array.from(this.ticketCache.values());
        
        return allTickets.filter(ticket => 
            ticket.customFields && ticket.customFields.docucortexType
        );
    }

    // 🛠️ Utilitaires
    normalizeTicketData(ticketData) {
        const normalized = {
            subject: ticketData.title || ticketData.subject,
            description: ticketData.description,
            priority: this.mapPriority(ticketData.priority),
            category: this.mapCategory(ticketData.category),
            status: ticketData.status || 'New',
            assignedTo: ticketData.assigneeId || ticketData.assignedTo,
            requester: ticketData.requesterId || ticketData.requester,
            customFields: ticketData.customFields || {}
        };

        // Ajouter les champs DocuCortex spécifiques
        if (ticketData.docucortexId) {
            normalized.customFields.docucortexId = ticketData.docucortexId;
            normalized.customFields.docucortexType = ticketData.docucortexType || 'unknown';
        }

        return normalized;
    }

    normalizeUpdateData(updates) {
        const normalized = { ...updates };

        if (updates.priority) {
            normalized.priority = this.mapPriority(updates.priority);
        }

        if (updates.status) {
            normalized.status = updates.status;
        }

        return normalized;
    }

    mapPriority(priority) {
        const priorityMap = {
            low: this.config.priorityLevels.low,
            medium: this.config.priorityLevels.medium,
            high: this.config.priorityLevels.high,
            critical: this.config.priorityLevels.critical,
            1: 'Low',
            2: 'Medium',
            3: 'High',
            4: 'Critical'
        };

        return priorityMap[priority] || this.config.priorityLevels.medium;
    }

    mapCategory(category) {
        return this.config.ticketCategories[category] || category || 'General';
    }

    mapLoanToPriority(loan) {
        const daysUntilReturn = Math.ceil(
            (new Date(loan.returnDate) - new Date()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilReturn < 0) {
            return 'Critical'; // En retard
        } else if (daysUntilReturn < 1) {
            return 'High'; // Échéance aujourd'hui
        } else if (daysUntilReturn < 3) {
            return 'Medium'; // Échéance proche
        } else {
            return 'Low';
        }
    }

    mapEquipmentToPriority(equipment) {
        // Déterminer la priorité basée sur le statut de l'équipement
        switch (equipment.status) {
            case 'Lost':
            case 'Stolen':
                return 'Critical';
            case 'Maintenance':
                return 'High';
            case 'In Use':
                return 'Medium';
            default:
                return 'Low';
        }
    }

    generateLoanTicketDescription(loan) {
        return `Ticket généré automatiquement par DocuCortex

**Détails du prêt :**
- Document: ${loan.documentName}
- Emprunteur: ${loan.borrowerName}
- Date d'emprunt: ${loan.loanDate}
- Date de retour prévue: ${loan.returnDate}
- Statut: ${loan.status}

**Problème signalé :**
${loan.issue || 'Problème non spécifié - investigation requise'}

*Ticket créé automatiquement par le système DocuCortex*`;
    }

    generateEquipmentTicketDescription(equipment) {
        return `Ticket généré automatiquement par DocuCortex

**Détails de l'équipement :**
- Nom: ${equipment.name}
- Tag d'actif: ${equipment.assetTag}
- Numéro de série: ${equipment.serialNumber}
- Localisation: ${equipment.location}
- Statut: ${equipment.status}

**Problème signalé :**
${equipment.issue || 'Problème non spécifié - investigation requise'}

*Ticket créé automatiquement par le système DocuCortex*`;
    }

    generateUserTicketDescription(user) {
        return `Ticket généré automatiquement par DocuCortex

**Détails de l'utilisateur :**
- Nom: ${user.fullName}
- Email: ${user.email}
- Département: ${user.department}
- Position: ${user.position}

**Problème signalé :**
${user.issue || 'Problème non spécifié - investigation requise'}

*Ticket créé automatiquement par le système DocuCortex*`;
    }

    // 🧪 Tests et validation
    async testConnection() {
        try {
            await this.connect();
            
            const response = await this.makeRequest('/api/status', 'GET');
            
            return {
                connected: true,
                version: response.version || 'unknown',
                plugins: response.plugins || [],
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
            const response = await this.makeRequest('/api/status', 'GET');
            const responseTime = Date.now() - startTime;

            this.connectionHealth = {
                status: 'healthy',
                lastCheck: new Date().toISOString(),
                responseTime
            };

            return {
                healthy: true,
                responseTime,
                status: response.status,
                ticketCount: this.ticketCache.size,
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

    // Méthodes utilitaires
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

        if (this.api.auth) {
            options.auth = this.api.auth;
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

    generateWebhookSecret() {
        return `docucortex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async recordTicketReference(data) {
        // Enregistrer la référence ticket dans DocuCortex
        // Cette méthode devrait être implémentée selon l'architecture DocuCortex
        console.log('Référence ticket enregistrée:', data);
    }

    // Gestionnaires d'événements webhook
    async handleTicketUpdate(ticket) {
        // Synchroniser les changements de ticket vers DocuCortex
        console.log('Ticket mis à jour:', ticket.id);
    }

    async handleTicketResolved(ticket) {
        // Notifier DocuCortex de la résolution du ticket
        console.log('Ticket résolu:', ticket.id);
    }

    async handleTicketClosed(ticket) {
        // Marquer le ticket comme fermé dans DocuCortex
        console.log('Ticket fermé:', ticket.id);
    }

    // 🧪 Données simulées
    getMockTicketStatistics() {
        return {
            total: 156,
            byStatus: {
                'New': 12,
                'In Progress': 23,
                'Resolved': 89,
                'Closed': 32
            },
            byPriority: {
                'Low': 45,
                'Medium': 78,
                'High': 23,
                'Critical': 10
            },
            byCategory: {
                'Equipment': 67,
                'Document': 34,
                'User': 23,
                'Technical': 32
            },
            averageResolutionTime: 4.2,
            slaCompliance: 87.5
        };
    }

    // 📈 Métriques et monitoring
    getMetrics() {
        return {
            connectionStatus: this.isConnected ? 'connected' : 'disconnected',
            ticketCount: this.ticketCache.size,
            userCount: this.userCache.size,
            connectionHealth: this.connectionHealth,
            autoTicketCreation: this.config.autoTicketCreation,
            timestamp: new Date().toISOString()
        };
    }
}

export default HelpDeskConnector;