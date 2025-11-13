// src/contexts/AppContext.js - VERSION CORRIGÉE POUR WEBSOCKET ET STRICT MODE

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import apiService from '../services/apiService'; 

const AppContext = createContext();

export { AppContext }; // ✅ EXPORT AJOUTÉ pour usePermissions
export const useApp = () => useContext(AppContext);

// ✅ CORRECTION: Utiliser localhost explicitement pour éviter une URL invalide dans Electron
const WS_URL = `ws://localhost:3003`;

/**
 * Adaptateur pour convertir l'objet app_users en format compatible avec l'ancien système
 * Garantit la compatibilité avec tout le code existant (prêts, chat, historique, etc.)
 */
function adaptUserToTechnician(user) {
    if (!user) return null;

    // Si l'utilisateur vient de app_users (a display_name)
    if (user.display_name) {
        return {
            ...user,
            // Ajouter les propriétés de l'ancien système pour compatibilité
            id: user.username,           // 'kevin_bivia' au lieu de 1
            name: user.display_name,     // 'Kevin BIVIA'
            avatar: user.display_name.split(' ').map(n => n[0]).join(''),  // 'KB'
            role: user.is_admin ? 'admin' : 'technician',
            // Garder aussi les nouvelles propriétés
            _numericId: user.id,         // Garder l'ID numérique pour les nouvelles fonctions
            _username: user.username,    // Garder le username
        };
    }

    // Si c'est déjà un technicien de l'ancien système, retourner tel quel
    return user;
}

export const AppProvider = ({ children }) => {
    const [config, setConfig] = useState(null);
    const [_internalTechnician, _setInternalTechnician] = useState(null);

    // Wrapper qui adapte automatiquement la structure
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

    // ✅ NEW: updateConfig method for direct state updates
    const updateConfig = useCallback((newConfig) => {
        setConfig(newConfig);
    }, []);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const initializeApp = async () => {
            try {
                // ✅ FIX: Add timeout to prevent blocking webpack compilation
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Config load timeout')), 5000)
                );

                const loadedConfig = await Promise.race([
                    apiService.getConfig(),
                    timeoutPromise
                ]);

                setConfig(loadedConfig);
                connectWebSocket();
            } catch (err) {
                console.error('Erreur initialisation App:', err);
                // ✅ FIX: Don't block on config load failure - use defaults
                setError(`Impossible de charger la configuration: ${err.message}`);
                setIsOnline(false);
                // Set minimal default config to allow app to continue
                setConfig({
                    domain: 'anecoopfr.local',
                    servers: [],
                    rdsServers: []
                });
            } finally {
                setIsInitializing(false);
            }
        };

        // ✅ FIX: Don't await - let initialization happen async
        initializeApp();

        return () => {
            clearTimeout(reconnectTimeoutRef.current);
            if (wsRef.current) { wsRef.current.close(); }
        };
    }, [connectWebSocket]);
    
    const value = {
        config,
        updateConfig, // ✅ NEW: Export updateConfig
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