// src/contexts/AppContext.js - VERSION OPTIMISÉE

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import apiService from '../services/apiService';

const AppContext = createContext();

export { AppContext };
export const useApp = () => useContext(AppContext);

// Utiliser localhost explicitement pour éviter une URL invalide dans Electron
const WS_URL = `ws://localhost:3003`;

/**
 * Adaptateur pour convertir l'objet app_users en format compatible avec l'ancien système
 */
function adaptUserToTechnician(user) {
    if (!user) return null;

    if (user.display_name) {
        return {
            ...user,
            id: user.username,
            name: user.display_name,
            avatar: user.display_name.split(' ').map(n => n[0]).join(''),
            role: user.is_admin ? 'admin' : 'technician',
            _numericId: user.id,
            _username: user.username,
        };
    }
    return user;
}

export const AppProvider = ({ children }) => {
    const [config, setConfig] = useState(null);
    const [_internalTechnician, _setInternalTechnician] = useState(null);

    const setCurrentTechnician = useCallback((user) => {
        const adapted = adaptUserToTechnician(user);
        _setInternalTechnician(adapted);
    }, []);

    const currentTechnician = _internalTechnician;
    const [isInitializing, setIsInitializing] = useState(true);
    const [error, setError] = useState('');
    const [notifications, setNotifications] = useState([]);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const pongTimeoutRef = useRef(null);
    const pingIntervalRef = useRef(null);
    const initialized = useRef(false);

    const eventListeners = useRef(new Map());

    const showNotification = useCallback((type, message, duration = 5000) => {
        const newNotification = { id: Date.now() + Math.random(), type, message, duration };
        setNotifications(prev => [...prev, newNotification]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
        }, duration);
    }, []);

    const off = useCallback((eventName, callback) => {
        if (eventListeners.current.has(eventName)) {
            eventListeners.current.get(eventName).delete(callback);
        }
    }, []);

    const on = useCallback((eventName, callback) => {
        if (!eventListeners.current.has(eventName)) {
            eventListeners.current.set(eventName, new Set());
        }
        eventListeners.current.get(eventName).add(callback);
        return () => off(eventName, callback);
    }, [off]);

    const emit = useCallback((eventName, data) => {
        if (eventListeners.current.has(eventName)) {
            eventListeners.current.get(eventName).forEach((callback) => {
                try {
                    callback(data);
                } catch (e) {
                    console.error(`Erreur dans un listener pour l'événement '${eventName}':`, e);
                }
            });
        }
    }, []);

    const connectWebSocket = useCallback(() => {
        if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
            return;
        }

        wsRef.current = new WebSocket(WS_URL);
        const ws = wsRef.current;

        ws.onopen = () => {
            console.log('✅ WebSocket connecté au serveur.');
            setIsOnline(true);
            showNotification('success', 'Connecté au serveur en temps réel.');
            clearTimeout(reconnectTimeoutRef.current);

            // Démarrer le heartbeat
            pingIntervalRef.current = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'ping' }));

                    // Timeout si pas de pong dans 5 secondes
                    pongTimeoutRef.current = setTimeout(() => {
                        console.warn('⚠️ Pas de pong reçu, connexion probablement morte');
                        ws.close();
                    }, 5000);
                }
            }, 30000);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Gestion du heartbeat
                if (data.type === 'pong') {
                    clearTimeout(pongTimeoutRef.current);
                    return;
                }

                // Émettre une seule fois
                emit(data.type, data.payload);

                // Si c'est une mise à jour de données, on peut aussi émettre un événement spécifique si besoin
                // Mais CacheContext écoute 'data_updated' globalement maintenant

            } catch (e) {
                console.error('Erreur parsing message WebSocket:', e);
            }
        };

        ws.onclose = () => {
            console.warn('🔌 WebSocket déconnecté. Tentative de reconnexion dans 5s...');
            setIsOnline(false);
            clearInterval(pingIntervalRef.current);
            clearTimeout(pongTimeoutRef.current);
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
        };

        ws.onerror = (error) => {
            console.error('❌ Erreur WebSocket.');
            ws.close();
        };
    }, [emit, showNotification]);

    const handleSaveConfig = useCallback(async ({ newConfig }) => {
        try {
            const result = await apiService.saveConfig(newConfig);
            if (result.success) {
                setConfig(newConfig);
                return true;
            }
            return false;
        } catch (error) {
            console.error("Erreur lors de la sauvegarde de la config:", error);
            return false;
        }
    }, []);

    const updateConfig = useCallback((newConfig) => {
        setConfig(newConfig);
    }, []);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const initializeApp = async () => {
            try {
                console.log('🚀 [AppContext] Initialisation...');

                // Chargement de la configuration (CRITIQUE)
                const loadedConfig = await apiService.getConfig();
                setConfig(loadedConfig);

                // Connexion WebSocket
                connectWebSocket();

            } catch (err) {
                console.error('Erreur initialisation App:', err);
                setError(`Impossible de charger la configuration: ${err.message}`);
                setIsOnline(false);
                setConfig({
                    domain: 'anecoopfr.local',
                    servers: [],
                    rdsServers: []
                });
            } finally {
                setIsInitializing(false);
            }
        };

        initializeApp();

        return () => {
            clearTimeout(reconnectTimeoutRef.current);
            clearInterval(pingIntervalRef.current);
            clearTimeout(pongTimeoutRef.current);
            if (wsRef.current) { wsRef.current.close(); }
        };
    }, [connectWebSocket]);

    const value = {
        config,
        updateConfig,
        currentTechnician,
        setCurrentTechnician,
        isInitializing,
        error,
        isOnline,
        notifications,
        showNotification,
        handleSaveConfig,
        events: { on, off, emit }
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};