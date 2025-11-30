// src/integrations/CalendarConnector.js - CONNECTEUR CALENDRIER
// Connecteur pour intégration avec les systèmes de calendrier (Google, Outlook, etc.)

class CalendarConnector {
    constructor(config = {}) {
        this.config = {
            provider: config.provider || 'google', // google, outlook, ical
            apiKey: config.apiKey || '',
            clientId: config.clientId || '',
            clientSecret: config.clientSecret || '',
            redirectUri: config.redirectUri || '',
            calendarId: config.calendarId || 'primary',
            authMode: config.authMode || 'oauth', // oauth, api_key, service_account
            scope: config.scope || 'https://www.googleapis.com/auth/calendar',
            timezone: config.timezone || 'Europe/Paris',
            defaultDuration: config.defaultDuration || 60, // minutes
            maxConcurrentEvents: config.maxConcurrentEvents || 10,
            enabled: config.enabled !== false,
            ...config
        };

        this.api = null;
        this.isConnected = false;
        this.authenticated = false;
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
        this.eventCache = new Map();
        this.calendarCache = new Map();
        this.connectionHealth = {
            status: 'disconnected',
            lastCheck: null,
            responseTime: null
        };

        // Mapping des types d'événements DocuCortex
        this.eventTypeMappings = {
            'loan': 'equipment_reservation',
            'equipment': 'equipment_maintenance',
            'return': 'equipment_return',
            'meeting': 'equipment_demo',
            'training': 'training_session'
        };

        // Initialiser le client
        this.initializeClient();
    }

    // 🔧 Initialisation
    initializeClient() {
        if (!this.config.provider) {
            console.warn('Provider calendrier non configuré, utilisation du mode simulation');
            return;
        }

        try {
            switch (this.config.provider) {
                case 'google':
                    this.initializeGoogleClient();
                    break;
                case 'outlook':
                    this.initializeOutlookClient();
                    break;
                case 'ical':
                    this.initializeICalClient();
                    break;
                default:
                    console.warn(`Provider calendrier non supporté: ${this.config.provider}`);
            }
            console.log(`Client calendrier ${this.config.provider} initialisé`);
        } catch (error) {
            console.error('Erreur initialisation client calendrier:', error);
        }
    }

    initializeGoogleClient() {
        if (typeof window !== 'undefined') {
            // Mode navigateur - Google Calendar API
            this.api = {
                init: () => {
                    if (window.gapi) {
                        window.gapi.load('auth2', () => {
                            window.gapi.auth2.init({
                                client_id: this.config.clientId,
                                scope: this.config.scope
                            });
                        });
                    }
                },
                signIn: async () => {
                    if (window.gapi?.auth2) {
                        const authInstance = window.gapi.auth2.getAuthInstance();
                        return await authInstance.signIn();
                    }
                    throw new Error('Google API non disponible');
                },
                createEvent: async (eventData) => {
                    // Simulation pour le navigateur
                    return this.mockGoogleCreateEvent(eventData);
                }
            };
        } else {
            // Mode serveur - utiliser googleapis
            try {
                const { google } = require('googleapis');
                this.oauth2Client = new google.auth.OAuth2(
                    this.config.clientId,
                    this.config.clientSecret,
                    this.config.redirectUri
                );
                this.google = google;
                this.api = {
                    calendar: google.calendar({ version: 'v3', auth: this.oauth2Client })
                };
            } catch (error) {
                console.warn('Google APIs non disponibles, mode simulation activé');
            }
        }
    }

    initializeOutlookClient() {
        // Initialisation Microsoft Graph API
        this.api = {
            auth: {
                getAccessToken: async () => {
                    // Implémentation OAuth Microsoft
                    return this.accessToken;
                }
            },
            createEvent: async (eventData) => {
                // Implémentation création événement Outlook
                return this.mockOutlookCreateEvent(eventData);
            }
        };
    }

    initializeICalClient() {
        // Client iCal simple (lecture seule)
        this.api = {
            fetchCalendar: async (calendarUrl) => {
                const response = await fetch(calendarUrl);
                const icalText = await response.text();
                return this.parseICalData(icalText);
            }
        };
    }

    // 🔐 Authentification
    async authenticate(authCode = null) {
        try {
            switch (this.config.provider) {
                case 'google':
                    return await this.authenticateGoogle(authCode);
                case 'outlook':
                    return await this.authenticateOutlook(authCode);
                case 'ical':
                    return await this.authenticateICal();
                default:
                    throw new Error(`Provider non supporté: ${this.config.provider}`);
            }
        } catch (error) {
            console.error('Erreur authentification calendrier:', error);
            throw error;
        }
    }

    async authenticateGoogle(authCode) {
        if (this.config.authMode === 'api_key') {
            this.authenticated = true;
            return { authenticated: true, method: 'api_key' };
        }

        if (!authCode) {
            // Démarrer le flux OAuth
            if (typeof window !== 'undefined') {
                return this.startGoogleOAuthFlow();
            } else {
                throw new Error('Code d\'authentification requis pour le mode serveur');
            }
        }

        try {
            // Échanger le code contre des tokens
            const tokens = await this.exchangeAuthCode(authCode);
            this.setTokens(tokens);
            
            this.authenticated = true;
            return {
                authenticated: true,
                user: await this.getCurrentUser(),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Erreur authentification Google:', error);
            throw error;
        }
    }

    async startGoogleOAuthFlow() {
        if (!window.gapi?.auth2) {
            throw new Error('Google API non disponible');
        }

        const authInstance = window.gapi.auth2.getAuthInstance();
        const user = await authInstance.signIn();
        
        const authResponse = user.getAuthResponse();
        this.setTokens({
            access_token: authResponse.access_token,
            refresh_token: authResponse.refresh_token,
            expires_in: authResponse.expires_in
        });

        this.authenticated = true;
        return {
            authenticated: true,
            user: {
                id: user.getId(),
                name: user.getBasicProfile().getName(),
                email: user.getBasicProfile().getEmail()
            },
            timestamp: new Date().toISOString()
        };
    }

    async exchangeAuthCode(authCode) {
        if (this.oauth2Client) {
            const { tokens } = await this.oauth2Client.getToken(authCode);
            return tokens;
        }
        
        // Simulation pour le navigateur
        return {
            access_token: `mock_token_${Date.now()}`,
            refresh_token: `mock_refresh_${Date.now()}`,
            expires_in: 3600
        };
    }

    async authenticateOutlook(authCode) {
        // Authentification Microsoft Graph
        this.authenticated = true;
        return { authenticated: true, method: 'oauth', provider: 'microsoft' };
    }

    async authenticateICal() {
        // L'authentification iCal se fait via URL
        this.authenticated = true;
        return { authenticated: true, method: 'url', provider: 'ical' };
    }

    setTokens(tokens) {
        this.accessToken = tokens.access_token;
        this.refreshToken = tokens.refresh_token;
        this.tokenExpiry = tokens.expires_in ? Date.now() + (tokens.expires_in * 1000) : null;
    }

    async refreshAccessToken() {
        if (!this.refreshToken) {
            throw new Error('Refresh token non disponible');
        }

        try {
            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    client_id: this.config.clientId,
                    client_secret: this.config.clientSecret,
                    refresh_token: this.refreshToken,
                    grant_type: 'refresh_token'
                })
            });

            const tokens = await response.json();
            this.setTokens(tokens);
            
            return tokens;
        } catch (error) {
            console.error('Erreur rafraîchissement token:', error);
            throw error;
        }
    }

    // 📅 Gestion des événements
    async createEvent(eventData) {
        if (!this.isConnected) {
            await this.connect();
        }

        try {
            const normalizedEvent = this.normalizeEventData(eventData);
            
            let createdEvent;
            switch (this.config.provider) {
                case 'google':
                    createdEvent = await this.createGoogleEvent(normalizedEvent);
                    break;
                case 'outlook':
                    createdEvent = await this.createOutlookEvent(normalizedEvent);
                    break;
                case 'ical':
                    createdEvent = await this.createICalEvent(normalizedEvent);
                    break;
                default:
                    throw new Error(`Provider non supporté: ${this.config.provider}`);
            }

            // Mettre en cache
            if (createdEvent.id) {
                this.eventCache.set(createdEvent.id, createdEvent);
            }

            return {
                ...createdEvent,
                createdAt: new Date().toISOString(),
                source: 'DocuCortex'
            };
        } catch (error) {
            console.error('Erreur création événement:', error);
            throw error;
        }
    }

    async createGoogleEvent(eventData) {
        if (this.api.calendar) {
            // Mode serveur avec googleapis
            const response = await this.api.calendar.events.insert({
                calendarId: this.config.calendarId,
                resource: eventData
            });

            return response.data;
        } else {
            // Mode navigateur - simulation
            return this.mockGoogleCreateEvent(eventData);
        }
    }

    async createOutlookEvent(eventData) {
        // Implémentation Microsoft Graph API
        const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
        });

        return await response.json();
    }

    async createICalEvent(eventData) {
        // iCal est généralement en lecture seule
        // Simulation pour la cohérence
        return {
            ...eventData,
            id: `ical_${Date.now()}`,
            status: 'tentative'
        };
    }

    async updateEvent(eventId, updates) {
        if (!this.isConnected) {
            await this.connect();
        }

        try {
            const normalizedUpdates = this.normalizeUpdateData(updates);
            
            let updatedEvent;
            switch (this.config.provider) {
                case 'google':
                    updatedEvent = await this.updateGoogleEvent(eventId, normalizedUpdates);
                    break;
                case 'outlook':
                    updatedEvent = await this.updateOutlookEvent(eventId, normalizedUpdates);
                    break;
                default:
                    throw new Error(`Mise à jour non supportée pour ${this.config.provider}`);
            }

            // Mettre à jour le cache
            if (updatedEvent.id) {
                this.eventCache.set(updatedEvent.id, updatedEvent);
            }

            return updatedEvent;
        } catch (error) {
            console.error('Erreur mise à jour événement:', error);
            throw error;
        }
    }

    async deleteEvent(eventId) {
        if (!this.isConnected) {
            await this.connect();
        }

        try {
            switch (this.config.provider) {
                case 'google':
                    await this.deleteGoogleEvent(eventId);
                    break;
                case 'outlook':
                    await this.deleteOutlookEvent(eventId);
                    break;
                default:
                    throw new Error(`Suppression non supportée pour ${this.config.provider}`);
            }

            // Supprimer du cache
            this.eventCache.delete(eventId);
            
            return { deleted: true, eventId, timestamp: new Date().toISOString() };
        } catch (error) {
            console.error('Erreur suppression événement:', error);
            throw error;
        }
    }

    async getEvent(eventId) {
        if (!this.isConnected) {
            await this.connect();
        }

        // Vérifier le cache d'abord
        if (this.eventCache.has(eventId)) {
            return this.eventCache.get(eventId);
        }

        try {
            let event;
            switch (this.config.provider) {
                case 'google':
                    event = await this.getGoogleEvent(eventId);
                    break;
                case 'outlook':
                    event = await this.getOutlookEvent(eventId);
                    break;
                default:
                    throw new Error(`Récupération non supportée pour ${this.config.provider}`);
            }

            if (event && event.id) {
                this.eventCache.set(event.id, event);
            }

            return event;
        } catch (error) {
            console.error('Erreur récupération événement:', error);
            throw error;
        }
    }

    async getEvents(timeMin = null, timeMax = null, maxResults = 50) {
        if (!this.isConnected) {
            await this.connect();
        }

        try {
            const params = {
                timeMin: timeMin || new Date().toISOString(),
                timeMax: timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                maxResults,
                singleEvents: true,
                orderBy: 'startTime'
            };

            let events;
            switch (this.config.provider) {
                case 'google':
                    events = await this.getGoogleEvents(params);
                    break;
                case 'outlook':
                    events = await this.getOutlookEvents(params);
                    break;
                default:
                    events = this.getMockEvents();
            }

            // Filtrer les événements DocuCortex
            const docuCortexEvents = events.filter(event => 
                event.source === 'DocuCortex' || event.description?.includes('DocuCortex')
            );

            // Mettre en cache
            docuCortexEvents.forEach(event => {
                if (event.id) {
                    this.eventCache.set(event.id, event);
                }
            });

            return docuCortexEvents;
        } catch (error) {
            console.error('Erreur récupération événements:', error);
            throw error;
        }
    }

    // 🎯 Fonctionnalités DocuCortex
    async createEquipmentReservation(reservationData) {
        const eventData = {
            title: `Réservation: ${reservationData.equipmentName}`,
            description: this.generateReservationDescription(reservationData),
            start: reservationData.startDate,
            end: reservationData.endDate,
            attendees: reservationData.attendees || [],
            resources: [reservationData.equipmentName],
            category: 'equipment_reservation',
            source: 'DocuCortex',
            customFields: {
                docucortexId: reservationData.id,
                docucortexType: 'equipment_reservation',
                equipmentId: reservationData.equipmentId,
                assetTag: reservationData.assetTag,
                borrowerId: reservationData.borrowerId
            }
        };

        return await this.createEvent(eventData);
    }

    async scheduleMaintenance(maintenanceData) {
        const eventData = {
            title: `Maintenance: ${maintenanceData.equipmentName}`,
            description: this.generateMaintenanceDescription(maintenanceData),
            start: maintenanceData.scheduledDate,
            end: this.addMinutes(maintenanceData.scheduledDate, this.config.defaultDuration),
            attendees: maintenanceData.technicians || [],
            category: 'equipment_maintenance',
            source: 'DocuCortex',
            customFields: {
                docucortexId: maintenanceData.id,
                docucortexType: 'maintenance',
                equipmentId: maintenanceData.equipmentId,
                type: maintenanceData.type
            }
        };

        return await this.createEvent(eventData);
    }

    async createReturnReminder(loanData) {
        const reminderDate = new Date(loanData.returnDate);
        reminderDate.setHours(reminderDate.getHours() - 2); // 2h avant

        const eventData = {
            title: `Rappel retour: ${loanData.documentTitle}`,
            description: this.generateReturnReminderDescription(loanData),
            start: reminderDate.toISOString(),
            end: new Date(reminderDate.getTime() + 30 * 60 * 1000).toISOString(), // 30 min
            attendees: [loanData.borrowerEmail],
            category: 'reminder',
            source: 'DocuCortex',
            customFields: {
                docucortexId: loanData.id,
                docucortexType: 'return_reminder',
                documentId: loanData.documentId,
                borrowerId: loanData.borrowerId
            }
        };

        return await this.createEvent(eventData);
    }

    // 🛠️ Utilitaires
    normalizeEventData(eventData) {
        const normalized = {
            summary: eventData.title || eventData.summary,
            description: eventData.description || '',
            start: {
                dateTime: eventData.startDate || eventData.start,
                timeZone: this.config.timezone
            },
            end: {
                dateTime: eventData.endDate || eventData.end,
                timeZone: this.config.timezone
            }
        };

        // Ajouter les participants
        if (eventData.attendees && eventData.attendees.length > 0) {
            normalized.attendees = eventData.attendees.map(email => ({
                email,
                responseStatus: 'needsAction'
            }));
        }

        // Ajouter les ressources
        if (eventData.resources && eventData.resources.length > 0) {
            normalized.resources = eventData.resources;
        }

        // Statut et visibilité
        normalized.status = eventData.status || 'confirmed';
        normalized.transparency = eventData.transparency || 'opaque';
        normalized.visibility = eventData.visibility || 'default';

        // Champs personnalisés
        if (eventData.customFields) {
            normalized.extendedProperties = {
                private: eventData.customFields
            };
        }

        return normalized;
    }

    normalizeUpdateData(updates) {
        const normalized = { ...updates };

        if (updates.startDate) {
            normalized.start = {
                dateTime: updates.startDate,
                timeZone: this.config.timezone
            };
        }

        if (updates.endDate) {
            normalized.end = {
                dateTime: updates.endDate,
                timeZone: this.config.timezone
            };
        }

        return normalized;
    }

    generateReservationDescription(reservationData) {
        return `Réservation d'équipement générée par DocuCortex

**Équipement:**
- Nom: ${reservationData.equipmentName}
- Tag d'actif: ${reservationData.assetTag}
- Localisation: ${reservationData.location || 'Non spécifiée'}

**Réservation:**
- Emprunteur: ${reservationData.borrowerName}
- Date de début: ${reservationData.startDate}
- Date de fin: ${reservationData.endDate}
- But: ${reservationData.purpose || 'Utilisation générale'}

**Contact:**
- ${reservationData.borrowerEmail}

---
Réservation créée automatiquement par DocuCortex le ${new Date().toLocaleDateString('fr-FR')}`;
    }

    generateMaintenanceDescription(maintenanceData) {
        return `Maintenance d'équipement programmée par DocuCortex

**Équipement:**
- Nom: ${maintenanceData.equipmentName}
- Tag d'actif: ${maintenanceData.assetTag}
- Type de maintenance: ${maintenanceData.type}

**Planification:**
- Date programmée: ${maintenanceData.scheduledDate}
- Durée estimée: ${this.config.defaultDuration} minutes
- Techniciens: ${maintenanceData.technicians?.join(', ') || 'Non assignés'}

**Description:**
${maintenanceData.description || 'Maintenance standard'}

---
Maintenance planifiée automatiquement par DocuCortex`;
    }

    generateReturnReminderDescription(loanData) {
        return `Rappel de retour de document généré par DocuCortex

**Document:**
- Titre: ${loanData.documentTitle}
- Emprunteur: ${loanData.borrowerName}
- Date d'emprunt: ${loanData.loanDate}
- Date de retour prévue: ${loanData.returnDate}

**Action requise:**
Retourner le document avant la date d'échéance.

**Contact:**
${loanData.borrowerEmail}

---
Rappel généré automatiquement par DocuCortex le ${new Date().toLocaleDateString('fr-FR')}`;
    }

    addMinutes(dateString, minutes) {
        const date = new Date(dateString);
        return new Date(date.getTime() + minutes * 60 * 1000).toISOString();
    }

    // 🔗 Connexion
    async connect() {
        if (this.isConnected && this.authenticated) return;

        try {
            if (!this.authenticated) {
                await this.authenticate();
            }

            this.isConnected = true;
            this.connectionHealth.status = 'connected';
            this.connectionHealth.lastCheck = new Date().toISOString();
            
            console.log(`Connecté au calendrier ${this.config.provider}`);
        } catch (error) {
            console.error('Erreur connexion calendrier:', error);
            throw error;
        }
    }

    disconnect() {
        this.isConnected = false;
        this.authenticated = false;
        this.accessToken = null;
        this.refreshToken = null;
        this.eventCache.clear();
        this.calendarCache.clear();
        console.log('Déconnecté du calendrier');
    }

    // 🧪 Implémentations spécifiques par provider
    async getGoogleEvent(eventId) {
        if (this.api.calendar) {
            const response = await this.api.calendar.events.get({
                calendarId: this.config.calendarId,
                eventId
            });
            return response.data;
        }
        return this.eventCache.get(eventId) || null;
    }

    async updateGoogleEvent(eventId, updates) {
        if (this.api.calendar) {
            const response = await this.api.calendar.events.patch({
                calendarId: this.config.calendarId,
                eventId,
                resource: updates
            });
            return response.data;
        }
        throw new Error('API Google Calendar non disponible');
    }

    async deleteGoogleEvent(eventId) {
        if (this.api.calendar) {
            await this.api.calendar.events.delete({
                calendarId: this.config.calendarId,
                eventId
            });
        }
    }

    async getGoogleEvents(params) {
        if (this.api.calendar) {
            const response = await this.api.calendar.events.list({
                calendarId: this.config.calendarId,
                ...params
            });
            return response.data.items || [];
        }
        return this.getMockEvents();
    }

    // Méthodes mock pour simulation
    mockGoogleCreateEvent(eventData) {
        return {
            id: `google_${Date.now()}`,
            ...eventData,
            status: 'confirmed',
            created: new Date().toISOString(),
            updated: new Date().toISOString()
        };
    }

    mockOutlookCreateEvent(eventData) {
        return {
            id: `outlook_${Date.now()}`,
            ...eventData,
            status: 'confirmed',
            created: new Date().toISOString()
        };
    }

    async getOutlookEvent(eventId) {
        const response = await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            }
        });
        return await response.json();
    }

    async updateOutlookEvent(eventId, updates) {
        const response = await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates)
        });
        return await response.json();
    }

    async deleteOutlookEvent(eventId) {
        await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            }
        });
    }

    async getOutlookEvents(params) {
        const query = new URLSearchParams({
            startDateTime: params.timeMin,
            endDateTime: params.timeMax
        });

        const response = await fetch(`https://graph.microsoft.com/v1.0/me/calendarview?${query}`, {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            }
        });

        const data = await response.json();
        return data.value || [];
    }

    parseICalData(icalText) {
        // Parser iCal basique
        const events = [];
        const eventMatches = icalText.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];
        
        eventMatches.forEach(match => {
            const event = {};
            const lines = match.split('\n');
            
            lines.forEach(line => {
                const [key, value] = line.split(':');
                if (key && value) {
                    event[key.toLowerCase()] = value;
                }
            });
            
            if (event.summary) {
                events.push(event);
            }
        });
        
        return events;
    }

    getMockEvents() {
        return [
            {
                id: 'mock_event_1',
                summary: 'Réservation: Dell Latitude 7420',
                description: 'Réservation d\'équipement DocuCortex',
                start: { dateTime: new Date().toISOString() },
                end: { dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() },
                source: 'DocuCortex',
                category: 'equipment_reservation'
            }
        ];
    }

    // 📊 Statistiques et monitoring
    async getCalendarStatistics() {
        const events = Array.from(this.eventCache.values());
        const now = new Date();
        const last24h = new Date(now - 24 * 60 * 60 * 1000);

        const stats = {
            total: events.length,
            recent24h: events.filter(e => new Date(e.created || e.start?.dateTime) > last24h).length,
            byCategory: {},
            upcoming: events.filter(e => new Date(e.start?.dateTime) > now).length,
            provider: this.config.provider,
            authenticated: this.authenticated
        };

        events.forEach(event => {
            const category = event.category || 'unknown';
            stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
        });

        return stats;
    }

    // 🧪 Tests et validation
    async testConnection() {
        try {
            await this.connect();
            
            return {
                connected: true,
                provider: this.config.provider,
                authenticated: this.authenticated,
                calendarId: this.config.calendarId,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                connected: false,
                provider: this.config.provider,
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
            
            // Test rapide - récupérer quelques événements
            const events = await this.getEvents(null, null, 1);
            const responseTime = Date.now() - startTime;

            this.connectionHealth = {
                status: 'healthy',
                lastCheck: new Date().toISOString(),
                responseTime
            };

            return {
                healthy: true,
                responseTime,
                provider: this.config.provider,
                authenticated: this.authenticated,
                eventCount: this.eventCache.size,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            this.connectionHealth.status = 'error';
            this.connectionHealth.lastCheck = new Date().toISOString();
            this.connectionHealth.error = error.message;

            return {
                healthy: false,
                provider: this.config.provider,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // 📈 Métriques et monitoring
    getMetrics() {
        return {
            connectionStatus: this.isConnected ? 'connected' : 'disconnected',
            authenticated: this.authenticated,
            provider: this.config.provider,
            eventCount: this.eventCache.size,
            calendarCount: this.calendarCache.size,
            connectionHealth: this.connectionHealth,
            config: {
                calendarId: this.config.calendarId,
                timezone: this.config.timezone,
                defaultDuration: this.config.defaultDuration
            },
            timestamp: new Date().toISOString()
        };
    }
}

export default CalendarConnector;