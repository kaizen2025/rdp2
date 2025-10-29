// src/contexts/AppContext.js - VERSION CORRIGÉE POUR WEBSOCKET ET STRICT MODE

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import apiService from '../services/apiService'; 

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

const WS_URL = process.env.NODE_ENV === 'development'
  ? 'ws://localhost:3003'
  : `ws://${window.location.hostname}:3003`;

export const AppProvider = ({ children }) => {
    const [config, setConfig] = useState(null);
    const [currentTechnician, setCurrentTechnician] = useState(null); 
    const [isInitializing, setIsInitializing] = useState(true);
    const [error, setError] = useState('');
    const [notifications, setNotifications] = useState([]);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const initialized = useRef(false); // **CORRECTION POUR STRICT MODE**

    const eventListeners = useRef(new Map());

    const showNotification = useCallback((type, message) => {
        const newNotification = { id: Date.now() + Math.random(), type, message };
        setNotifications(prev => [...prev, newNotification]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
        }, 5000);
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
                console.log('WebSocket Message Reçu:', data);
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
            // L'erreur est souvent non descriptive, onclose gère la reconnexion
            console.error('❌ Erreur WebSocket.');
            ws.close();
        };
    }, [emit, showNotification]);

    const handleSaveConfig = useCallback(async ({ newConfig }) => {
        try {
            const result = await apiService.saveConfig(newConfig);
            if (result.success) {
                setConfig(newConfig); // Met à jour l'état local
                return true;
            }
            return false;
        } catch (error) {
            console.error("Erreur lors de la sauvegarde de la config:", error);
            return false;
        }
    }, []);

    useEffect(() => {
        // **CORRECTION POUR STRICT MODE** : On s'assure que l'initialisation ne se fait qu'une fois
        if (initialized.current) return;
        initialized.current = true;

        const initializeApp = async () => {
            try {
                const loadedConfig = await apiService.getConfig();
                setConfig(loadedConfig);
                connectWebSocket(); // Démarrer le WebSocket après avoir chargé la config
            } catch (err) {
                console.error('Erreur initialisation App:', err);
                setError(`Impossible de charger la configuration depuis le serveur: ${err.message}`);
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