// src/contexts/AppContext.js - VERSION CORRIGÉE POUR WEBSOCKET ET STRICT MODE

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import apiService from '../services/apiService'; 

const AppContext = createContext();

export { AppContext }; // ✅ EXPORT AJOUTÉ pour usePermissions
export const useApp = () => useContext(AppContext);

/**
 * Construit dynamiquement l'URL du WebSocket.
 * Gère les URL relatives (proxy dev) et absolues (prod).
 */
function getWebSocketUrl(apiBaseUrl) {
    // En développement, apiBaseUrl est souvent '/api', ce qui n'est pas une URL valide.
    // Nous construisons l'URL à partir de l'hôte de la page actuelle.
    if (apiBaseUrl && apiBaseUrl.startsWith('/')) {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        console.log(`[WebSocket] URL dynamique construite (depuis proxy): ${wsUrl}`);
        return wsUrl;
    }

    // En production ou si une URL complète est fournie.
    try {
        const url = new URL(apiBaseUrl);
        const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${url.host}`;
        console.log(`[WebSocket] URL dynamique construite (depuis URL absolue): ${wsUrl}`);
        return wsUrl;
    } catch (e) {
        console.error("URL API invalide, impossible de construire l'URL WebSocket:", apiBaseUrl);
        // Fallback de dernier recours, peu susceptible de fonctionner.
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//${window.location.hostname}:3002`;
    }
}


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
    const [wsUrl, setWsUrl] = useState(''); // ✅ État pour l'URL du WebSocket

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

    const [cache, setCache] = useState({
        computers: { data: [], loaded: false, loading: false },
        loans: { data: [], loaded: false, loading: false },
        users: { data: [], loaded: false, loading: false },
        rds_sessions: { data: [], loaded: false, loading: false },
        technicians: { data: [], loaded: false, loading: false }
    });

    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const initialized = useRef(false);
    const loadingPhases = useRef({ critical: false, secondary: false, lazy: false });

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

    const updateCacheEntity = useCallback((entityName, updater) => {
        setCache(prev => {
            const currentData = prev[entityName]?.data || [];
            const newData = typeof updater === 'function' ? updater(currentData) : updater;
            return {
                ...prev,
                [entityName]: { data: newData, loaded: true, loading: false }
            };
        });
    }, []);

    const invalidateCache = useCallback((entityName) => {
        setCache(prev => ({
            ...prev,
            [entityName]: { data: [], loaded: false, loading: false }
        }));
    }, []);

    const connectWebSocket = useCallback(() => {
        if (!wsUrl) {
            console.warn("[WebSocket] Attente de l'URL...");
            return;
        }
        if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
            return;
        }

        wsRef.current = new WebSocket(wsUrl);
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
                    if (data.payload.data) {
                        console.log(`[WebSocket] Mise à jour partielle: ${data.payload.entity}`);
                        updateCacheEntity(data.payload.entity, (current) => {
                            if (data.payload.operation === 'update' && data.payload.data.id) {
                                return current.map(item => item.id === data.payload.data.id ? { ...item, ...data.payload.data } : item);
                            } else if (data.payload.operation === 'delete' && data.payload.data.id) {
                                return current.filter(item => item.id !== data.payload.data.id);
                            } else if (data.payload.operation === 'create') {
                                return [...current, data.payload.data];
                            }
                            return data.payload.data;
                        });
                    } else {
                        console.log(`[WebSocket] Invalidation cache: ${data.payload.entity}`);
                        invalidateCache(data.payload.entity);
                    }
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
    }, [emit, showNotification, updateCacheEntity, invalidateCache, wsUrl]);

    // ✅ NOUVEL EFFET: Connecter le WebSocket dès que l'URL est connue
    useEffect(() => {
        if (wsUrl) {
            connectWebSocket();
        }
    }, [wsUrl, connectWebSocket]);

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

    const loadEntity = useCallback(async (entityName, apiFetch) => {
        if (cache[entityName]?.loaded || cache[entityName]?.loading) {
            return cache[entityName].data;
        }
        setCache(prev => ({ ...prev, [entityName]: { ...prev[entityName], loading: true } }));
        try {
            const data = await apiFetch();
            setCache(prev => ({ ...prev, [entityName]: { data, loaded: true, loading: false } }));
            return data;
        } catch (error) {
            console.error(`Erreur chargement ${entityName}:`, error);
            setCache(prev => ({ ...prev, [entityName]: { ...prev[entityName], loading: false } }));
            return [];
        }
    }, [cache]);

    const getCachedData = useCallback((entityName) => {
        return cache[entityName]?.data || [];
    }, [cache]);

    const isCacheLoaded = useCallback((entityName) => {
        return cache[entityName]?.loaded || false;
    }, [cache]);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const initializeApp = async () => {
            try {
                console.log('🚀 [AppContext] Phase CRITIQUE - Chargement config...');

                // ✅ L'URL du WebSocket est maintenant déterminée ici
                setWsUrl(getWebSocketUrl(apiService.baseURL));

                const loadedConfig = await apiService.getConfig();
                setConfig(loadedConfig);
                loadingPhases.current.critical = true;
                console.log('✅ [AppContext] Phase CRITIQUE terminée');

                setTimeout(() => {
                    console.log('🚀 [AppContext] Phase SECONDARY - Chargement entities...');
                    loadEntity('computers', () => apiService.getComputers());
                    loadEntity('loans', () => apiService.getLoans());
                    loadEntity('users', () => apiService.getExcelUsers());
                    loadingPhases.current.secondary = true;
                }, 2000);

                setTimeout(() => {
                    console.log('🚀 [AppContext] Phase LAZY - Chargement entities lourdes...');
                    loadEntity('rds_sessions', () => apiService.getRdsSessions());
                    loadEntity('technicians', () => apiService.getConnectedTechnicians());
                    loadingPhases.current.lazy = true;
                }, 5000);

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
    }, [loadEntity]);
    
    const value = {
        config, updateConfig, currentTechnician, setCurrentTechnician, isInitializing,
        error, isOnline, notifications, showNotification, handleSaveConfig,
        events: { on, off, emit },
        cache: { loadEntity, updateCacheEntity, invalidateCache, getCachedData, isCacheLoaded }
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};
