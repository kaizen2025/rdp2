// src/services/apiService.js - VERSION FINALE, COMPLÈTE ET NETTOYÉE

class ApiService {
    constructor() {
        this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';
        this.currentTechnicianId = localStorage.getItem('currentTechnicianId') || null;
        console.log(`🔧 ApiService initialisé avec baseURL: ${this.baseURL} pour le technicien: ${this.currentTechnicianId || 'aucun'}`);
    }

    /**
     * Méthode de requête centrale. L'utilisation d'une arrow function garantit que 'this' est correctement lié.
     */
    request = async (endpoint, options = {}) => {
        const url = `${this.baseURL}${endpoint}`;
        const techId = this.currentTechnicianId;
        const headers = { 'Content-Type': 'application/json', ...options.headers };
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

    // CONFIGURATION
    getConfig = async () => this.request('/config')
    saveConfig = async (newConfig) => this.request('/config', { method: 'POST', body: JSON.stringify({ newConfig }) })

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
    deleteComputer = async (id) => this.request(`/computers/${id}`, { method: 'DELETE' })
    addComputerMaintenance = async (id, data) => this.request(`/computers/${id}/maintenance`, { method: 'POST', body: JSON.stringify(data) })

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
    markNotificationAsRead = async (id) => this.request(`/notifications/${id}/mark-read`, { method: 'POST' })
    markAllNotificationsAsRead = async () => this.request('/notifications/mark-all-read', { method: 'POST' })

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
}

// Création d'une instance unique (singleton) pour toute l'application
const apiService = new ApiService();
export default apiService;