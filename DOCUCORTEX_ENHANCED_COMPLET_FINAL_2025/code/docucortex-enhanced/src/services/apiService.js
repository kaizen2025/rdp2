// src/services/apiService.js - SERVICE API POUR GESTION DES PRÊTS DOCUCORTEX
// Service centralisé pour les appels API et la gestion des données de prêts

import { format, parseISO } from 'date-fns';

// Configuration de l'API
const API_CONFIG = {
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
    timeout: 30000,
    retries: 3
};

// Clés de stockage local
const STORAGE_KEYS = {
    LOANS: 'docucortex_loans',
    USER_PREFERENCES: 'docucortex_user_prefs',
    API_CACHE: 'docucortex_api_cache'
};

// Types de données
const LOAN_STATUS = {
    ACTIVE: 'active',
    RESERVED: 'reserved',
    RETURNED: 'returned',
    OVERDUE: 'overdue',
    CANCELLED: 'cancelled'
};

const SORT_DIRECTION = {
    ASC: 'asc',
    DESC: 'desc'
};

class ApiService {
    constructor() {
        this.baseURL = API_CONFIG.baseURL;
        this.cache = new Map();
        this.requestInterceptors = [];
        this.responseInterceptors = [];
    }

    // 🔧 Configuration des intercepteurs
    addRequestInterceptor(interceptor) {
        this.requestInterceptors.push(interceptor);
    }

    addResponseInterceptor(interceptor) {
        this.responseInterceptors.push(interceptor);
    }

    // 🌐 Méthode de requête générique
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            timeout: API_CONFIG.timeout,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Appliquer les intercepteurs de requête
        for (const interceptor of this.requestInterceptors) {
            const result = interceptor({ url, config });
            if (result) {
                Object.assign(config, result);
            }
        }

        let response;
        let lastError;

        // Tentatives multiples en cas d'échec
        for (let attempt = 0; attempt < API_CONFIG.retries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), config.timeout);
                
                response = await fetch(url, {
                    ...config,
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);

                // Vérifier le statut de la réponse
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                // Appliquer les intercepteurs de réponse
                for (const interceptor of this.responseInterceptors) {
                    const result = interceptor(response);
                    if (result) {
                        response = result;
                    }
                }

                break; // Succès, sortir de la boucle
            } catch (error) {
                lastError = error;
                console.warn(`Tentative ${attempt + 1} échouée pour ${endpoint}:`, error.message);
                
                if (attempt === API_CONFIG.retries - 1) {
                    throw lastError;
                }
                
                // Attendre avant de réessayer (backoff exponentiel)
                await new Promise(resolve => 
                    setTimeout(resolve, Math.pow(2, attempt) * 1000)
                );
            }
        }

        // Traiter la réponse
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        
        return await response.text();
    }

    // 📋 GESTION DES PRÊTS

    // Récupérer tous les prêts
    async getLoans(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const endpoint = `/loans${queryString ? `?${queryString}` : ''}`;
            
            const cacheKey = `loans_${queryString}`;
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < 300000) { // 5 minutes
                    return cached.data;
                }
            }

            const response = await this.request(endpoint);
            
            // Cache la réponse
            this.cache.set(cacheKey, {
                data: response,
                timestamp: Date.now()
            });

            return response;
        } catch (error) {
            console.error('Erreur lors de la récupération des prêts:', error);
            // Retourner des données de fallback depuis le localStorage
            return this.getLoansFromStorage();
        }
    }

    // Récupérer un prêt par ID
    async getLoanById(loanId) {
        const response = await this.request(`/loans/${loanId}`);
        return response;
    }

    // Créer un nouveau prêt
    async createLoan(loanData) {
        const response = await this.request('/loans', {
            method: 'POST',
            body: JSON.stringify(loanData)
        });
        
        // Invalider le cache
        this.invalidateLoansCache();
        
        return response;
    }

    // Mettre à jour un prêt
    async updateLoan(loanId, updates) {
        const response = await this.request(`/loans/${loanId}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
        
        // Invalider le cache
        this.invalidateLoansCache();
        
        return response;
    }

    // Marquer un prêt comme retourné
    async returnLoan(loanId, returnData = {}) {
        const response = await this.request(`/loans/${loanId}/return`, {
            method: 'POST',
            body: JSON.stringify({
                returnDate: new Date().toISOString(),
                ...returnData
            })
        });
        
        this.invalidateLoansCache();
        return response;
    }

    // Prolonger un prêt
    async extendLoan(loanId, extensionData) {
        const response = await this.request(`/loans/${loanId}/extend`, {
            method: 'POST',
            body: JSON.stringify(extensionData)
        });
        
        this.invalidateLoansCache();
        return response;
    }

    // Annuler un prêt
    async cancelLoan(loanId, reason = '') {
        const response = await this.request(`/loans/${loanId}/cancel`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        });
        
        this.invalidateLoansCache();
        return response;
    }

    // Supprimer un prêt
    async deleteLoan(loanId) {
        const response = await this.request(`/loans/${loanId}`, {
            method: 'DELETE'
        });
        
        this.invalidateLoansCache();
        return response;
    }

    // 📊 STATISTIQUES ET ANALYTICS

    // Récupérer les statistiques des prêts
    async getLoanStatistics(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = `/loans/statistics${queryString ? `?${queryString}` : ''}`;
        
        return await this.request(endpoint);
    }

    // Récupérer les prêts en retard
    async getOverdueLoans() {
        return await this.request('/loans/overdue');
    }

    // Récupérer les prêts qui expirent bientôt
    async getExpiringLoans(days = 7) {
        return await this.request(`/loans/expiring?days=${days}`);
    }

    // 👥 GESTION DES UTILISATEURS

    // Récupérer tous les utilisateurs
    async getUsers(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = `/users${queryString ? `?${queryString}` : ''}`;
        
        return await this.request(endpoint);
    }

    // Récupérer un utilisateur par ID
    async getUserById(userId) {
        return await this.request(`/users/${userId}`);
    }

    // Récupérer l'utilisateur actuel
    async getCurrentUser() {
        return await this.request('/users/me');
    }

    // 📄 GESTION DES DOCUMENTS

    // Récupérer tous les documents
    async getDocuments(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = `/documents${queryString ? `?${queryString}` : ''}`;
        
        return await this.request(endpoint);
    }

    // Récupérer un document par ID
    async getDocumentById(documentId) {
        return await this.request(`/documents/${documentId}`);
    }

    // 📬 HISTORIQUE ET AUDIT

    // Récupérer l'historique d'un prêt
    async getLoanHistory(loanId) {
        return await this.request(`/loans/${loanId}/history`);
    }

    // Récupérer l'activité de l'utilisateur
    async getUserActivity(userId, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = `/users/${userId}/activity${queryString ? `?${queryString}` : ''}`;
        
        return await this.request(endpoint);
    }

    // 🔔 NOTIFICATIONS ET ALERTES

    // Récupérer les notifications
    async getNotifications(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = `/notifications${queryString ? `?${queryString}` : ''}`;
        
        return await this.request(endpoint);
    }

    // Marquer une notification comme lue
    async markNotificationAsRead(notificationId) {
        return await this.request(`/notifications/${notificationId}/read`, {
            method: 'PUT'
        });
    }

    // Envoyer une notification
    async sendNotification(notificationData) {
        return await this.request('/notifications', {
            method: 'POST',
            body: JSON.stringify(notificationData)
        });
    }

    // 🔍 RECHERCHE ET FILTRAGE

    // Recherche avancée de prêts
    async searchLoans(searchParams) {
        const queryString = new URLSearchParams(searchParams).toString();
        const endpoint = `/loans/search${queryString ? `?${queryString}` : ''}`;
        
        return await this.request(endpoint);
    }

    // Récupérer les suggestions de recherche
    async getSearchSuggestions(query) {
        return await this.request(`/search/suggestions?q=${encodeURIComponent(query)}`);
    }

    // 📱 ACTIONS EN MASSE

    // Prolonger plusieurs prêts
    async extendMultipleLoans(loanIds, extensionData) {
        return await this.request('/loans/bulk/extend', {
            method: 'POST',
            body: JSON.stringify({
                loanIds,
                extensionData
            })
        });
    }

    // Marquer plusieurs prêts comme retournés
    async returnMultipleLoans(loanIds, returnData = {}) {
        return await this.request('/loans/bulk/return', {
            method: 'POST',
            body: JSON.stringify({
                loanIds,
                returnData
            })
        });
    }

    // Envoyer des rappels en masse
    async sendBulkReminders(loanIds, message = '') {
        return await this.request('/loans/bulk/remind', {
            method: 'POST',
            body: JSON.stringify({
                loanIds,
                message
            })
        });
    }

    // 💾 GESTION DU CACHE ET STOCKAGE LOCAL

    // Invalider le cache des prêts
    invalidateLoansCache() {
        for (const [key] of this.cache.entries()) {
            if (key.startsWith('loans_')) {
                this.cache.delete(key);
            }
        }
    }

    // Sauvegarder les prêts en localStorage
    saveLoansToStorage(loans) {
        try {
            localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify({
                data: loans,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.warn('Impossible de sauvegarder les prêts en localStorage:', error);
        }
    }

    // Récupérer les prêts depuis localStorage
    getLoansFromStorage() {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.LOANS);
            if (stored) {
                const { data, timestamp } = JSON.parse(stored);
                
                // Vérifier si les données ont moins de 1 heure
                if (Date.now() - timestamp < 3600000) {
                    return data;
                }
            }
        } catch (error) {
            console.warn('Impossible de récupérer les prêts depuis localStorage:', error);
        }
        
        return [];
    }

    // Vider le cache
    clearCache() {
        this.cache.clear();
        console.log('Cache API vidé');
    }

    // 🛠️ UTILITAIRES

    // Construire une URL avec paramètres
    buildUrl(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return `${this.baseURL}${endpoint}${queryString ? `?${queryString}` : ''}`;
    }

    // Formater les erreurs API
    formatApiError(error) {
        if (error.name === 'AbortError') {
            return 'La requête a été annulée (timeout)';
        }
        
        if (error.message.includes('HTTP')) {
            const match = error.message.match(/HTTP (\d+): (.+)/);
            if (match) {
                const [, status, statusText] = match;
                switch (status) {
                    case '400':
                        return 'Données invalides dans la requête';
                    case '401':
                        return 'Authentification requise';
                    case '403':
                        return 'Accès refusé';
                    case '404':
                        return 'Ressource non trouvée';
                    case '500':
                        return 'Erreur interne du serveur';
                    default:
                        return `Erreur ${status}: ${statusText}`;
                }
            }
        }
        
        return error.message || 'Une erreur est survenue';
    }

    // Valider les données de prêt
    validateLoanData(loanData) {
        const errors = [];
        
        if (!loanData.documentId) {
            errors.push('Le document est requis');
        }
        
        if (!loanData.borrowerId) {
            errors.push('L\'emprunteur est requis');
        }
        
        if (!loanData.loanDate) {
            errors.push('La date d\'emprunt est requise');
        }
        
        if (!loanData.returnDate) {
            errors.push('La date de retour est requise');
        }
        
        if (loanData.returnDate && loanData.loanDate) {
            const loanDate = parseISO(loanData.loanDate);
            const returnDate = parseISO(loanData.returnDate);
            
            if (returnDate <= loanDate) {
                errors.push('La date de retour doit être postérieure à la date d\'emprunt');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // 📊 EXPORT ET RAPPORTS

    // Exporter les prêts en CSV
    async exportLoans(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = `/loans/export/csv${queryString ? `?${queryString}` : ''}`;
        
        const response = await this.request(endpoint, {
            headers: {
                'Accept': 'text/csv'
            }
        });
        
        return response;
    }

    // Générer un rapport de prêt
    async generateLoanReport(reportParams) {
        return await this.request('/reports/loans', {
            method: 'POST',
            body: JSON.stringify(reportParams)
        });
    }

    // 🎯 MÉTHODES DE CONVENIENCE

    // Récupérer les prêts actifs
    async getActiveLoans() {
        return await this.getLoans({ status: LOAN_STATUS.ACTIVE });
    }

    // Récupérer les prêts en retard
    async getOverdueLoansDetailed() {
        return await this.getLoans({ status: LOAN_STATUS.OVERDUE });
    }

    // Récupérer les prêts d'un utilisateur
    async getUserLoans(userId) {
        return await this.getLoans({ borrowerId: userId });
    }

    // Vérifier la disponibilité d'un document
    async checkDocumentAvailability(documentId) {
        return await this.request(`/documents/${documentId}/availability`);
    }
}

// Export d'une instance singleton
const apiService = new ApiService();

// Configuration par défaut des intercepteurs
apiService.addRequestInterceptor(({ url, config }) => {
    // Ajouter le token d'authentification si disponible
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
});

apiService.addResponseInterceptor(async (response) => {
    // Gérer les erreurs d'authentification
    if (response.status === 401) {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
        return response;
    }
    
    return response;
});

export default apiService;
export { LOAN_STATUS, SORT_DIRECTION };