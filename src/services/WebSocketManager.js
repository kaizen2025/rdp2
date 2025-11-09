// src/services/WebSocketManager.js - WebSocket Manager Optimisé pour Production

class WebSocketManager {
    constructor(url, options = {}) {
        this.url = url;
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = options.maxReconnectAttempts || Infinity;
        this.reconnectInterval = options.reconnectInterval || 1000;
        this.maxReconnectInterval = options.maxReconnectInterval || 30000;
        this.heartbeatInterval = options.heartbeatInterval || 30000;
        this.heartbeatTimer = null;
        this.reconnectTimer = null;
        this.messageQueue = [];
        this.listeners = new Map();
        this.isIntentionalClose = false;
        this.connectionState = 'DISCONNECTED'; // DISCONNECTED, CONNECTING, CONNECTED, RECONNECTING

        // ✅ Options avancées
        this.enableLogging = options.enableLogging !== false;
        this.enableQueue = options.enableQueue !== false;
        this.maxQueueSize = options.maxQueueSize || 100;
        this.enableBatching = options.enableBatching || false;
        this.batchInterval = options.batchInterval || 100;
        this.batchQueue = [];
        this.batchTimer = null;

        // ✅ Callbacks
        this.onOpen = options.onOpen || (() => {});
        this.onClose = options.onClose || (() => {});
        this.onError = options.onError || (() => {});
        this.onReconnect = options.onReconnect || (() => {});
        this.onMessage = options.onMessage || (() => {});

        this.connect();
    }

    log(level, ...args) {
        if (this.enableLogging) {
            console[level]('[WebSocketManager]', ...args);
        }
    }

    connect() {
        if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
            this.log('warn', 'WebSocket already connecting or connected');
            return;
        }

        this.connectionState = this.reconnectAttempts === 0 ? 'CONNECTING' : 'RECONNECTING';
        this.log('info', `${this.connectionState}...`, this.url);

        try {
            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => this.handleOpen();
            this.ws.onmessage = (event) => this.handleMessage(event);
            this.ws.onerror = (error) => this.handleError(error);
            this.ws.onclose = (event) => this.handleClose(event);

        } catch (error) {
            this.log('error', 'Connection error:', error);
            this.scheduleReconnect();
        }
    }

    handleOpen() {
        this.connectionState = 'CONNECTED';
        this.log('info', '✅ WebSocket connected successfully');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.flushMessageQueue();
        this.onOpen();
        this.emit('connection', { status: 'connected' });
    }

    handleMessage(event) {
        try {
            const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

            // ✅ Heartbeat pong
            if (data.type === 'pong') {
                this.log('debug', '💓 Heartbeat pong received');
                return;
            }

            // ✅ Callback globale
            this.onMessage(data);

            // ✅ Émettre vers les listeners spécifiques
            if (data.type) {
                this.emit(data.type, data);
            }

            // ✅ Émettre vers tous les listeners
            this.emit('*', data);

        } catch (error) {
            this.log('error', 'Error parsing message:', error, event.data);
        }
    }

    handleError(error) {
        this.log('error', 'WebSocket error:', error);
        this.onError(error);
        this.emit('error', error);
    }

    handleClose(event) {
        this.connectionState = 'DISCONNECTED';
        this.log('warn', 'WebSocket closed', event.code, event.reason);
        this.stopHeartbeat();

        this.onClose(event);
        this.emit('connection', { status: 'disconnected', code: event.code, reason: event.reason });

        // ✅ Reconnexion automatique si non intentionnelle
        if (!this.isIntentionalClose) {
            this.scheduleReconnect();
        }
    }

    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.log('error', '❌ Max reconnect attempts reached');
            this.emit('connection', { status: 'failed', attempts: this.reconnectAttempts });
            return;
        }

        this.reconnectAttempts++;

        // ✅ Backoff exponentiel avec jitter
        const baseInterval = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
        const jitter = Math.random() * 1000; // Randomize pour éviter thundering herd
        const interval = Math.min(baseInterval + jitter, this.maxReconnectInterval);

        this.log('info', `🔄 Reconnecting in ${Math.round(interval / 1000)}s (attempt ${this.reconnectAttempts})...`);

        this.reconnectTimer = setTimeout(() => {
            this.onReconnect(this.reconnectAttempts);
            this.connect();
        }, interval);
    }

    startHeartbeat() {
        this.stopHeartbeat();

        this.heartbeatTimer = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.send({ type: 'ping', timestamp: Date.now() }, { skipQueue: true });
                this.log('debug', '💓 Heartbeat ping sent');
            }
        }, this.heartbeatInterval);
    }

    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    send(data, options = {}) {
        const message = typeof data === 'string' ? data : JSON.stringify(data);

        // ✅ Si connecté, envoyer directement
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            if (this.enableBatching && !options.skipBatch) {
                this.addToBatch(message);
            } else {
                this.ws.send(message);
                this.log('debug', '📤 Message sent:', data.type || 'unknown');
            }
            return true;
        }

        // ✅ Sinon, mettre en queue si activé
        if (this.enableQueue && !options.skipQueue) {
            if (this.messageQueue.length < this.maxQueueSize) {
                this.messageQueue.push(message);
                this.log('debug', '📥 Message queued (total:', this.messageQueue.length, ')');
                return true;
            } else {
                this.log('warn', '⚠️ Message queue full, dropping message');
                return false;
            }
        }

        this.log('warn', '⚠️ Cannot send message, WebSocket not connected and queue disabled');
        return false;
    }

    addToBatch(message) {
        this.batchQueue.push(message);

        if (!this.batchTimer) {
            this.batchTimer = setTimeout(() => {
                this.flushBatch();
            }, this.batchInterval);
        }
    }

    flushBatch() {
        if (this.batchQueue.length === 0) return;

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            // Envoyer le batch comme un seul message
            const batchMessage = JSON.stringify({
                type: 'batch',
                messages: this.batchQueue,
                count: this.batchQueue.length
            });

            this.ws.send(batchMessage);
            this.log('debug', `📤 Batch sent (${this.batchQueue.length} messages)`);
            this.batchQueue = [];
        }

        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.batchTimer = null;
        }
    }

    flushMessageQueue() {
        if (this.messageQueue.length === 0) return;

        this.log('info', `📤 Flushing message queue (${this.messageQueue.length} messages)...`);

        while (this.messageQueue.length > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
            const message = this.messageQueue.shift();
            this.ws.send(message);
        }

        this.log('info', '✅ Message queue flushed');
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);

        // Retourner fonction de désinscription
        return () => this.off(event, callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }

    emit(event, data) {
        // Émettre vers listeners spécifiques
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    this.log('error', `Error in listener for event "${event}":`, error);
                }
            });
        }
    }

    close(code = 1000, reason = 'Client closing connection') {
        this.isIntentionalClose = true;
        this.stopHeartbeat();

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.batchTimer = null;
        }

        if (this.ws) {
            this.ws.close(code, reason);
            this.ws = null;
        }

        this.connectionState = 'DISCONNECTED';
        this.log('info', '🔌 WebSocket closed intentionally');
    }

    reconnect() {
        this.log('info', '🔄 Manual reconnect triggered');
        this.close();
        this.isIntentionalClose = false;
        this.reconnectAttempts = 0;
        this.connect();
    }

    getState() {
        return {
            connectionState: this.connectionState,
            readyState: this.ws ? this.ws.readyState : null,
            reconnectAttempts: this.reconnectAttempts,
            queueLength: this.messageQueue.length,
            batchLength: this.batchQueue.length,
            isConnected: this.ws && this.ws.readyState === WebSocket.OPEN,
        };
    }
}

export default WebSocketManager;
