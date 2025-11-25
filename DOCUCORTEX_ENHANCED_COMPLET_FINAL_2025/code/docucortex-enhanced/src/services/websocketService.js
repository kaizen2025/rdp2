// src/services/websocketService.js - Service WebSocket pour Dashboard Temps Réel
import WebSocketManager from '../../../../../docucortex-analysis/src/services/WebSocketManager';

class WebSocketService {
    constructor() {
        this.wsManager = null;
        this.isConnected = false;
        this.listeners = new Map();
        this.subscriptions = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        // Configuration du WebSocket
        this.wsConfig = {
            url: this.getWebSocketUrl(),
            maxReconnectAttempts: this.maxReconnectAttempts,
            reconnectInterval: 1000,
            maxReconnectInterval: 10000,
            heartbeatInterval: 15000,
            enableBatching: true,
            batchInterval: 100,
            batchMaxSize: 20,
            enableMetrics: true,
            backoffStrategy: 'exponential'
        };

        this.initializeWebSocket();
    }

    // Détermine l'URL du WebSocket selon l'environnement
    getWebSocketUrl() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname;
        const port = process.env.REACT_APP_WS_PORT || '3002';
        
        // En mode développement, utiliser localhost
        if (process.env.NODE_ENV === 'development') {
            return `${protocol}//${host}:${port}/ws`;
        }
        
        // En production, utiliser le même host avec /ws path
        return `${protocol}//${host}/ws`;
    }

    // Initialisation du WebSocket avec gestion des événements
    initializeWebSocket() {
        console.log('[WebSocketService] 🚀 Initialisation du WebSocket...');
        
        this.wsManager = new WebSocketManager(this.wsConfig.url, this.wsConfig);
        
        // Gestionnaires d'événements WebSocket
        this.wsManager.on('connection', (status) => this.handleConnectionChange(status));
        this.wsManager.on('dashboard_update', (data) => this.handleDashboardUpdate(data));
        this.wsManager.on('loan_status_change', (data) => this.handleLoanStatusChange(data));
        this.wsManager.on('computer_status_change', (data) => this.handleComputerStatusChange(data));
        this.wsManager.on('alert', (data) => this.handleAlert(data));
        this.wsManager.on('user_activity', (data) => this.handleUserActivity(data));
        this.wsManager.on('system_metrics', (data) => this.handleSystemMetrics(data));
        this.wsManager.on('notification', (data) => this.handleNotification(data));
        
        // Erreurs et déconnexions
        this.wsManager.on('error', (error) => this.handleError(error));
        this.wsManager.on('*', (data) => this.handleRawMessage(data));
    }

    // Gestion des changements de connexion
    handleConnectionChange(status) {
        console.log('[WebSocketService] 🔌 Statut connexion:', status.status);
        
        this.isConnected = status.status === 'connected';
        
        if (status.status === 'connected') {
            this.reconnectAttempts = 0;
            this.resubscribeAll();
            this.emit('connection', { connected: true, metrics: status.metrics });
        } else if (status.status === 'disconnected') {
            this.emit('connection', { connected: false, reason: status.reason });
        } else if (status.status === 'failed') {
            this.emit('connection', { 
                connected: false, 
                failed: true, 
                attempts: status.attempts 
            });
        }
    }

    // Gestion des mises à jour dashboard
    handleDashboardUpdate(data) {
        console.log('[WebSocketService] 📊 Mise à jour dashboard reçue');
        this.emit('dashboard_update', data);
    }

    // Gestion des changements de statut de prêts
    handleLoanStatusChange(data) {
        console.log('[WebSocketService] 📋 Changement statut prêt:', data);
        this.emit('loan_status_change', data);
    }

    // Gestion des changements de statut d'ordinateurs
    handleComputerStatusChange(data) {
        console.log('[WebSocketService] 💻 Changement statut ordinateur:', data);
        this.emit('computer_status_change', data);
    }

    // Gestion des alertes
    handleAlert(data) {
        console.log('[WebSocketService] 🚨 Alerte reçue:', data);
        this.emit('alert', data);
    }

    // Gestion de l'activité utilisateur
    handleUserActivity(data) {
        console.log('[WebSocketService] 👤 Activité utilisateur:', data);
        this.emit('user_activity', data);
    }

    // Gestion des métriques système
    handleSystemMetrics(data) {
        console.log('[WebSocketService] ⚡ Métriques système:', data);
        this.emit('system_metrics', data);
    }

    // Gestion des notifications
    handleNotification(data) {
        console.log('[WebSocketService] 🔔 Notification reçue:', data);
        this.emit('notification', data);
    }

    // Gestion générique des messages
    handleRawMessage(data) {
        if (!data.type) return;
        
        // Log pour débogage (niveau debug)
        console.log('[WebSocketService] 📨 Message brut:', data.type, data);
    }

    // Gestion des erreurs
    handleError(error) {
        console.error('[WebSocketService] ❌ Erreur WebSocket:', error);
        this.emit('error', error);
    }

    // Abonnement à une ressource
    subscribe(resource, callback) {
        if (!this.subscriptions.has(resource)) {
            this.subscriptions.set(resource, new Set());
        }
        
        this.subscriptions.get(resource).add(callback);
        
        // S'abonner côté serveur si première fois
        if (this.subscriptions.get(resource).size === 1) {
            this.sendSubscription(resource);
        }
        
        // Retourner fonction de désabonnement
        return () => this.unsubscribe(resource, callback);
    }

    // Désabonnement d'une ressource
    unsubscribe(resource, callback) {
        if (!this.subscriptions.has(resource)) return;
        
        this.subscriptions.get(resource).delete(callback);
        
        // Se désabonner côté serveur si plus d'écouteurs
        if (this.subscriptions.get(resource).size === 0) {
            this.sendUnsubscription(resource);
            this.subscriptions.delete(resource);
        }
    }

    // Envoi d'abonnement au serveur
    sendSubscription(resource) {
        if (this.isConnected) {
            this.send({
                type: 'subscribe',
                resource: resource,
                timestamp: Date.now()
            });
        }
    }

    // Envoi de désabonnement au serveur
    sendUnsubscription(resource) {
        if (this.isConnected) {
            this.send({
                type: 'unsubscribe',
                resource: resource,
                timestamp: Date.now()
            });
        }
    }

    // Réabonnement à toutes les ressources
    resubscribeAll() {
        if (this.isConnected) {
            for (const resource of this.subscriptions.keys()) {
                this.sendSubscription(resource);
            }
        }
    }

    // Envoi de message
    send(data, options = {}) {
        if (this.wsManager && this.isConnected) {
            this.wsManager.send(data, options);
        } else {
            console.warn('[WebSocketService] ⚠️ Impossible d\'envoyer - WebSocket non connecté');
            return false;
        }
        return true;
    }

    // Demande de données en temps réel
    requestRealTimeData(resources, options = {}) {
        const request = {
            type: 'request_realtime_data',
            resources: resources,
            options: options,
            timestamp: Date.now()
        };
        
        return this.send(request, { priority: 'high' });
    }

    // Demande de métriques système
    requestSystemMetrics() {
        return this.send({
            type: 'get_system_metrics',
            timestamp: Date.now()
        }, { priority: 'high' });
    }

    // Demande de statistiques de prêts
    requestLoanStats() {
        return this.send({
            type: 'get_loan_stats',
            timestamp: Date.now()
        });
    }

    // Demande de top utilisateurs
    requestTopUsers(limit = 10) {
        return this.send({
            type: 'get_top_users',
            limit: limit,
            timestamp: Date.now()
        });
    }

    // Demande d'alertes actives
    requestActiveAlerts() {
        return this.send({
            type: 'get_active_alerts',
            timestamp: Date.now()
        });
    }

    // Synchronisation multi-utilisateurs
    syncWithOtherUsers(userId) {
        return this.send({
            type: 'sync_user_activity',
            userId: userId,
            timestamp: Date.now()
        });
    }

    // Configuration des filtres temps réel
    setRealTimeFilters(filters) {
        return this.send({
            type: 'set_filters',
            filters: filters,
            timestamp: Date.now()
        });
    }

    // Abonnement à un écouteur
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        
        // Retourner fonction de désabonnement
        return () => this.off(event, callback);
    }

    // Désabonnement d'un écouteur
    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }

    // Émission d'événement vers les écouteurs
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[WebSocketService] Erreur dans l'écouteur ${event}:`, error);
                }
            });
        }
    }

    // Déconnexion
    disconnect() {
        if (this.wsManager) {
            this.wsManager.close(1000, 'Client closing');
        }
        this.isConnected = false;
    }

    // Reconnexion manuelle
    reconnect() {
        if (this.wsManager) {
            this.wsManager.reconnect();
        }
    }

    // Obtenir les métriques de connexion
    getConnectionMetrics() {
        if (this.wsManager) {
            return this.wsManager.getMetrics();
        }
        return {
            connected: false,
            reconnectAttempts: this.reconnectAttempts
        };
    }

    // État de santé du service
    getHealthStatus() {
        const metrics = this.getConnectionMetrics();
        return {
            isConnected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            maxReconnectAttempts: this.maxReconnectAttempts,
            metrics: metrics,
            subscriptions: this.subscriptions.size,
            status: this.isConnected ? 'healthy' : 'disconnected'
        };
    }

    // Nettoyage
    destroy() {
        this.disconnect();
        this.listeners.clear();
        this.subscriptions.clear();
    }
}

// Instance singleton
const webSocketService = new WebSocketService();
export default webSocketService;