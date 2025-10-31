// src/contexts/AppContext.js - VERSION CORRIGÉE POUR WEBSOCKET ET STRICT MODE

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import apiService from '../services/apiService'; 

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

// ✅ CORRECTION: Utiliser localhost explicitement pour éviter une URL invalide dans Electron
const WS_URL = `ws://localhost:3003`;

export const AppProvider = ({ children }) => {
    const [config, setConfig] = useState(null);
    const [currentTechnician, setCurrentTechnician] = useState(null); 
    const [isInitializing, setIsInitializing] = useState(true);
    const [error, setError] = useState('');
    const [notifications, setNotifications] = useState([]);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
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
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'data_updated' && data.payload?.entity) {
                    emit(`data_updated:${data.payload.entity}`, data.payload);
                    emit('data_updated', data.payload);
                } else {
                    emit(data.type, data.payload);
                }
            } catch (e) {
                console.error('Erreur parsing message WebSocket:', e);
            }
        };

        ws.onclose = () => {
            console.warn('🔌 WebSocket déconnecté. Tentative de reconnexion dans 5s...');
            setIsOnline(false);
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

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const initializeApp = async () => {
            try {
                const loadedConfig = await apiService.getConfig();
                setConfig(loadedConfig);
                connectWebSocket();
            } catch (err) {
                console.error('Erreur initialisation App:', err);
                setError(`Impossible de charger la configuration: ${err.message}`);
                setIsOnline(false);
            } finally {
                setIsInitializing(false);
            }
        };

        initializeApp();

        return () => {
            clearTimeout(reconnectTimeoutRef.current);
            if (wsRef.current) { wsRef.current.close(); }
        };
    }, [connectWebSocket]);
    
    const value = {
        config,
        currentTechnician,
        setCurrentTechnician,
        isInitializing,
        error,
        isOnline,
        notifications,
        showNotification,
        handleSaveConfig,
        events: { on, off, emit },
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};