// src/services/apiService.js - VERSION FINALE, COMPLÈTE ET NETTOYÉE

class ApiService {
    constructor() {
        // Détection automatique du mode
        const isElectron = window.electronAPI !== undefined;

        // En mode Electron : utiliser le port fixe configuré dans Electron (3002)
        // En mode navigateur dev : utiliser le proxy (setupProxy.js lit .ports.json automatiquement)
        if (isElectron) {
            this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';
        } else {
            // Le proxy setupProxy.js gère automatiquement la redirection depuis .ports.json
            this.baseURL = process.env.REACT_APP_API_URL || '/api';
        }

        this.currentTechnicianId = localStorage.getItem('currentTechnicianId') || null;
        console.log(`🔧 ApiService initialisé avec baseURL: ${this.baseURL} (Electron: ${isElectron}) pour le technicien: ${this.currentTechnicianId || 'aucun'}`);
    }

    /**
     * Méthode de requête centrale. L'utilisation d'une arrow function garantit que 'this' est correctement lié.
     */
    request = async (endpoint, options = {}) => {
        const url = `${this.baseURL}${endpoint}`;
        const techId = this.currentTechnicianId;
        
        // ✅ CORRECTION: Ne pas forcer Content-Type si le body est FormData
        // Le navigateur définit automatiquement multipart/form-data avec boundary
        const headers = { ...options.headers };
        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = headers['Content-Type'] || 'application/json';
        }
        if (techId) { headers['x-technician-id'] = techId; }
        const config = { ...options, headers };

        try {
            const response = await fetch(url, config);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: response.statusText, message: `Erreur HTTP ${response.status}` }));
                const errorMessage = errorData.error || errorData.details || errorData.message;
                const error = new Error(errorMessage);
                error.response = response; // Attache la réponse complète à l'erreur
                throw error;
            }
            if (response.status === 204) return null; // No Content
            return response.json();
        } catch (error) {
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Impossible de contacter le serveur. Vérifiez que le backend est démarré et accessible.');
            }
            throw error;
        }
    }

    setCurrentTechnician = (technicianId) => {
        this.currentTechnicianId = technicianId;
        if (technicianId) {
            localStorage.setItem('currentTechnicianId', technicianId);
        } else {
            localStorage.removeItem('currentTechnicianId');
        }
        console.log('👤 Technicien actuel défini:', technicianId);
    }

    // SANTÉ DU SERVEUR
    checkServerHealth = async () => this.request('/health')

    // AUTH & TECHNICIENS
    login = async (technicianData) => {
        this.setCurrentTechnician(technicianData.id);
        return this.request('/technicians/login', { method: 'POST', body: JSON.stringify(technicianData) });
    }
    logout = () => { this.setCurrentTechnician(null); return Promise.resolve(); }
    getConnectedTechnicians = async () => this.request('/technicians/connected')
    saveTechnicianPhoto = async (technicianId, photoFile) => {
        const formData = new FormData();
        formData.append('photo', photoFile);
        return this.request(`/technicians/${technicianId}/photo`, { method: 'POST', body: formData });
    }

    // CONFIGURATION
    getConfig = async () => this.request('/config')
    saveConfig = async (newConfig) => this.request('/config', { method: 'POST', body: JSON.stringify({ newConfig }) })
    updateConfig = async (newConfig) => this.saveConfig(newConfig) // Alias pour compatibilité

    // SESSIONS RDS
    getRdsSessions = async () => this.request('/rds-sessions')
    refreshRdsSessions = async () => this.request('/rds-sessions/refresh', { method: 'POST' })
    sendRdsMessage = async (server, sessionId, message) => this.request('/rds-sessions/send-message', { method: 'POST', body: JSON.stringify({ server, sessionId, message }) })
    pingRdsServer = async (server) => this.request(`/rds-sessions/ping/${server}`)

    // ORDINATEURS (COMPUTERS)
    getComputers = async () => this.request('/computers')
    saveComputer = async (computerData) => {
        const { id, ...data } = computerData;
        return id ? this.request(`/computers/${id}`, { method: 'PUT', body: JSON.stringify(data) }) : this.request('/computers', { method: 'POST', body: JSON.stringify(data) });
    }
    saveComputerPhoto = async (computerId, photoFile) => {
        const formData = new FormData();
        formData.append('photo', photoFile);
        return this.request(`/computers/${computerId}/photo`, { method: 'POST', body: formData });
    }
    deleteComputer = async (id) => this.request(`/computers/${id}`, { method: 'DELETE' })
    addComputerMaintenance = async (id, data) => this.request(`/computers/${id}/maintenance`, { method: 'POST', body: JSON.stringify(data) })
    bulkDeleteComputers = async (ids) => this.request('/computers/bulk-delete', { method: 'POST', body: JSON.stringify({ ids }) })
    bulkUpdateComputers = async (ids, updates) => this.request('/computers/bulk-update', { method: 'POST', body: JSON.stringify({ ids, updates }) })

    // PRÊTS (LOANS)
    getLoans = async () => this.request('/loans')
    createLoan = async (loanData) => this.request('/loans', { method: 'POST', body: JSON.stringify(loanData) })
    updateLoan = async (loanId, loanData) => this.request(`/loans/${loanId}`, { method: 'PUT', body: JSON.stringify(loanData) })
    returnLoan = async (id, notes, accessoryInfo) => this.request(`/loans/${id}/return`, { method: 'POST', body: JSON.stringify({ returnNotes: notes, accessoryInfo }) })
    extendLoan = async (id, date, reason) => this.request(`/loans/${id}/extend`, { method: 'POST', body: JSON.stringify({ newReturnDate: date, reason }) })
    cancelLoan = async (id, reason) => this.request(`/loans/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) })
    getLoanHistory = async (filters = {}) => { const qs = new URLSearchParams(filters).toString(); return this.request(`/loans/history${qs ? '?' + qs : ''}`); }
    getLoanStatistics = async () => this.request('/loans/statistics')
    getLoanSettings = async () => this.request('/loans/settings')

    // ACCESSOIRES
    getAccessories = async () => this.request('/accessories')
    saveAccessory = async (data) => this.request('/accessories', { method: 'POST', body: JSON.stringify(data) })
    deleteAccessory = async (id) => this.request(`/accessories/${id}`, { method: 'DELETE' })

    // NOTIFICATIONS
    getNotifications = async () => this.request('/notifications')
    getUnreadNotifications = async () => this.request('/notifications/unread')
    markNotificationAsRead = async (id) => this.request(`/notifications/${id}/read`, { method: 'PUT' })
    markAllNotificationsAsRead = async () => this.request('/notifications/read-all', { method: 'PUT' })

    // ACTIVE DIRECTORY
    searchAdUsers = async (term) => this.request(`/ad/users/search/${encodeURIComponent(term)}`)
    searchAdGroups = async (term) => this.request(`/ad/groups/search/${encodeURIComponent(term)}`)
    getAdGroupMembers = async (group) => this.request(`/ad/groups/${encodeURIComponent(group)}/members`)
    addUserToGroup = async (username, groupName) => this.request('/ad/groups/members', { method: 'POST', body: JSON.stringify({ username, groupName }) })
    removeUserFromGroup = async (username, groupName) => this.request(`/ad/groups/${encodeURIComponent(groupName)}/members/${encodeURIComponent(username)}`, { method: 'DELETE' })
    getAdUserDetails = async (username) => this.request(`/ad/users/${encodeURIComponent(username)}/details`)
    enableAdUser = async (username) => this.request(`/ad/users/${encodeURIComponent(username)}/enable`, { method: 'POST' })
    disableAdUser = async (username) => this.request(`/ad/users/${encodeURIComponent(username)}/disable`, { method: 'POST' })
    resetAdUserPassword = async (username, newPassword, mustChange = true) => this.request(`/ad/users/${encodeURIComponent(username)}/reset-password`, { method: 'POST', body: JSON.stringify({ newPassword, mustChange }) })
    createAdUser = async (userData) => this.request(`/ad/users`, { method: 'POST', body: JSON.stringify(userData) })
    getAdOUs = async (parentId = null) => this.request(parentId ? `/ad/ous?parentId=${encodeURIComponent(parentId)}` : '/ad/ous')
    getAdUsersInOU = async (ouDN) => this.request(`/ad/ou-users?ouDN=${encodeURIComponent(ouDN)}`)
    searchAdUsers = async (searchTerm) => this.request(`/ad/users/search?term=${encodeURIComponent(searchTerm)}`)

    // UTILISATEURS EXCEL
    getExcelUsers = async () => this.request('/excel/users')
    refreshExcelUsers = async () => this.request('/excel/users/refresh', { method: 'POST' })
    saveUserToExcel = async (userData) => this.request('/excel/users', { method: 'POST', body: JSON.stringify(userData) })
    deleteUserFromExcel = async (username) => this.request(`/excel/users/${encodeURIComponent(username)}`, { method: 'DELETE' })

    // CHAT
    getChatChannels = async () => this.request('/chat/channels')
    addChatChannel = async (name, description) => this.request('/chat/channels', { method: 'POST', body: JSON.stringify({ name, description }) })
    getChatMessages = async (channelId) => this.request(`/chat/messages/${channelId}`)
    sendChatMessage = async (channelId, messageText, fileInfo = null) => this.request('/chat/messages', { method: 'POST', body: JSON.stringify({ channelId, messageText, fileInfo }) })
    editChatMessage = async (messageId, channelId, newText) => this.request(`/chat/messages/${messageId}`, { method: 'PUT', body: JSON.stringify({ channelId, newText }) })
    deleteChatMessage = async (messageId, channelId) => this.request(`/chat/messages/${messageId}`, { method: 'DELETE', body: JSON.stringify({ channelId }) })
    toggleChatReaction = async (messageId, channelId, emoji) => this.request('/chat/reactions', { method: 'POST', body: JSON.stringify({ messageId, channelId, emoji }) })

    // ✅ AGENT IA
    // Health & Initialization
    getAIHealth = async () => this.request('/ai/health')
    initializeAI = async () => this.request('/ai/initialize', { method: 'POST' })
    
    // Documents
    uploadAIDocument = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return this.request('/ai/documents/upload', {
            method: 'POST',
            body: formData // ✅ Content-Type auto-détecté (multipart/form-data)
        });
    }
    getAIDocuments = async (limit = 100, offset = 0) => this.request(`/ai/documents?limit=${limit}&offset=${offset}`)
    getAIDocument = async (id) => this.request(`/ai/documents/${id}`)
    deleteAIDocument = async (id) => this.request(`/ai/documents/${id}`, { method: 'DELETE' })
    searchAIDocuments = async (query, maxResults = 5, minScore = 0.1) => this.request('/ai/documents/search', { method: 'POST', body: JSON.stringify({ query, maxResults, minScore }) })
    
    // Conversations - ✅ Using enhanced endpoint with OpenRouter support
    sendAIMessage = async (sessionId, message, userId = null, aiProvider = 'openrouter') => this.request('/ai/chat/enhanced', { method: 'POST', body: JSON.stringify({ sessionId, message, userId, aiProvider }) })
    sendGeminiMessage = async (sessionId, message, fileText, userId = null) => this.request('/ai/chat/enhanced', { method: 'POST', body: JSON.stringify({ sessionId, message, fileText, userId, aiProvider: 'gemini' }) })
    getAIConversationHistory = async (sessionId, limit = 50) => this.request(`/ai/conversations/${sessionId}?limit=${limit}`)
    getAllAIConversations = async (limit = 50) => this.request(`/ai/conversations?limit=${limit}`)

    // ✅ NOUVEAU - Gestion historique conversations
    updateConversationPinned = async (conversationId, isPinned) => this.request(`/ai/conversations/${conversationId}/pin`, { method: 'PUT', body: JSON.stringify({ isPinned }) })
    deleteConversation = async (conversationId) => this.request(`/ai/conversations/${conversationId}`, { method: 'DELETE' })

    // ==================== AUTHENTIFICATION ET UTILISATEURS ====================

    // Authentification
    changePassword = async (userId, oldPassword, newPassword) => this.request('/auth/change-password', { method: 'POST', body: JSON.stringify({ userId, oldPassword, newPassword }) })
    checkPermissions = async (userId, tabName) => this.request(`/auth/check-permissions/${userId}/${tabName}`)

    // Gestion utilisateurs
    getAllAppUsers = async () => this.request('/auth/users')
    getAppUser = async (userId) => this.request(`/auth/users/${userId}`)
    createAppUser = async (userData) => this.request('/auth/users', { method: 'POST', body: JSON.stringify(userData) })
    updateAppUser = async (userId, userData) => this.request(`/auth/users/${userId}`, { method: 'PUT', body: JSON.stringify(userData) })
    deleteAppUser = async (userId) => this.request(`/auth/users/${userId}`, { method: 'DELETE' })
    updateUserPermissions = async (userId, permissions) => this.request(`/auth/users/${userId}/permissions`, { method: 'PUT', body: JSON.stringify(permissions) })
    resetUserPassword = async (userId, newPassword) => this.request(`/auth/users/${userId}/reset-password`, { method: 'POST', body: JSON.stringify({ newPassword }) })

    // Statistiques connexions
    getLoginStats = async () => this.request('/auth/stats/login')
    getUserLoginHistory = async (userId, limit = 50) => this.request(`/auth/users/${userId}/login-history?limit=${limit}`)

    // Settings & Statistics
    getAISettings = async () => this.request('/ai/settings')
    updateAISetting = async (key, value) => this.request(`/ai/settings/${key}`, { method: 'PUT', body: JSON.stringify({ value }) })
    getAIStatistics = async () => this.request('/ai/statistics')
    getAIDailyStatistics = async (days = 7) => this.request(`/ai/statistics/daily?days=${days}`)
    getAIStatsOverview = async () => this.request('/ai/stats/overview')
    
    // Administration
    resetAI = async () => this.request('/ai/reset', { method: 'POST' })
    cleanupAI = async () => this.request('/ai/cleanup', { method: 'POST' })

    // ✅ OCR - Optical Character Recognition
    processOCR = async (formData) => this.request('/ai/ocr', {
        method: 'POST',
        body: formData // FormData avec file + options
    })
    getOCRStatistics = async () => this.request('/ai/ocr/statistics')

    // ✅ Analyse de documents
    analyzeAIDocument = async (documentId, analysisType = 'complete') => this.request('/ai/documents/' + documentId + '/analyze', {
        method: 'POST',
        body: JSON.stringify({ analysisType })
    })
    analyzeText = async (text, analysisType = 'complete') => this.request('/ai/analyze', {
        method: 'POST',
        body: JSON.stringify({ text, analysisType })
    })

    // ✅ Résumés de documents
    summarizeAIDocument = async (documentId, options = {}) => this.request('/ai/documents/' + documentId + '/summarize', {
        method: 'POST',
        body: JSON.stringify(options)
    })
    summarizeText = async (text, options = {}) => this.request('/ai/summarize', {
        method: 'POST',
        body: JSON.stringify({ text, ...options })
    })

    // ✅ Extraction d'entités et mots-clés
    extractKeywords = async (documentId) => this.request('/ai/documents/' + documentId + '/keywords')
    extractEntities = async (documentId) => this.request('/ai/documents/' + documentId + '/entities')

    // ✅ Analyse de sentiment
    analyzeSentiment = async (text) => this.request('/ai/sentiment', {
        method: 'POST',
        body: JSON.stringify({ text })
    })

    // ✅ Préférences utilisateur
    getUserPreferences = async () => this.request('/ai/preferences')
    saveUserPreferences = async (preferences) => this.request('/ai/preferences', {
        method: 'POST',
        body: JSON.stringify(preferences)
    })

    // ✅ Export de conversations
    exportConversation = async (sessionId, mode) => this.request(`/ai/conversations/${sessionId}/export?mode=${mode}`)

    // ✅ Prévisualisation de documents
    getDocumentPreview = async (documentId) => this.request(`/ai/documents/${documentId}/preview`)
    downloadDocument = async (documentId) => {
        // Téléchargement direct
        window.open(`${this.baseURL}/ai/documents/${documentId}/download`, '_blank');
    }

    // Natural Language Search
    naturalLanguageSearch = async (query) => this.request('/search', { method: 'POST', body: JSON.stringify({ query }) })
}

// Création d'une instance unique (singleton) pour toute l'application
const apiService = new ApiService();
export default apiService;