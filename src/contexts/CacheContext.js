// src/contexts/CacheContext.js

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';
import { useApp } from './AppContext';

const CacheContext = createContext();

export const useCache = () => useContext(CacheContext);

// Définition des priorités de chargement
const CRITICAL_ENTITIES = ['config', 'technicians']; // Chargé immédiatement
const SECONDARY_ENTITIES = ['loans', 'computers'];    // Chargé après court délai
const LAZY_ENTITIES = ['users', 'rds_sessions', 'ad_groups:VPN', 'ad_groups:Sortants_responsables']; // On-demand
const ALL_ENTITIES = [...CRITICAL_ENTITIES, ...SECONDARY_ENTITIES, ...LAZY_ENTITIES];

export const CacheProvider = ({ children }) => {
    const { events, showNotification } = useApp();
    const [cache, setCache] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDataForEntity = useCallback(async (entity) => {
        try {
            let data;
            // Logique pour charger les groupes AD
            if (entity.startsWith('ad_groups:')) {
                const groupName = entity.split(':')[1];

                // Utiliser l'API Electron si disponible (mode desktop), sinon fallback HTTP
                if (window.electronAPI && window.electronAPI.getAdGroupMembers) {
                    console.log(`[CacheContext] Utilisation de l'API Electron pour ${entity}`);
                    const result = await window.electronAPI.getAdGroupMembers(groupName);
                    data = result.success ? result.members : [];
                } else {
                    console.log(`[CacheContext] Fallback HTTP API pour ${entity}`);
                    data = await apiService.getAdGroupMembers(groupName);
                }
            } else {
                switch (entity) {
                    case 'loans': data = await apiService.getLoans(); break;
                    case 'computers': data = await apiService.getComputers(); break;
                    case 'users': {
                        const result = await apiService.getUsers();
                        data = result?.users || [];
                        break;
                    }
                    case 'technicians': data = await apiService.getConnectedTechnicians(); break;
                    case 'rds_sessions': data = await apiService.getRdsSessions(); break;
                    case 'config': data = await apiService.getConfig(); break;
                    default: return;
                }
            }

            // S'assurer que data n'est jamais undefined/null
            if (data === undefined || data === null) {
                data = entity.startsWith('ad_groups:') ? [] : (entity === 'users' ? [] : []);
            }

            setCache(prev => ({ ...prev, [entity]: data }));
            return data;
        } catch (err) {
            console.error(`Erreur chargement ${entity}:`, err);
            setError(err.message);

            // Ne pas afficher d'erreur pour les groupes AD (peut être transitoire)
            if (!entity.startsWith('ad_groups:')) {
                showNotification('error', `Impossible de charger les données: ${entity}`);
            }

            // Valeurs par défaut en cas d'erreur
            const fallbackData = entity.startsWith('ad_groups:') ? [] :
                entity === 'users' ? [] :
                    entity === 'config' ? {} : [];

            setCache(prev => ({ ...prev, [entity]: fallbackData }));
            return fallbackData;
        }
    }, [showNotification]);

    /**
     * Met à jour un élément dans le cache sans re-fetch
     */
    const updateCacheItem = useCallback((entity, data, action) => {
        setCache(prev => {
            const current = prev[entity];

            // Si c'est un objet simple (config), remplacer directement
            if (!Array.isArray(current)) {
                return { ...prev, [entity]: action === 'delete' ? {} : data };
            }

            // Si c'est un tableau (loans, computers, etc.)
            let updated;
            switch (action) {
                case 'create':
                    updated = [...current, data];
                    break;
                case 'update':
                    updated = current.map(item => item.id === data.id ? data : item);
                    break;
                case 'delete':
                    updated = current.filter(item => item.id !== data.id);
                    break;
                case 'full_refresh':
                    // Fallback: si on ne peut pas faire de mise à jour partielle
                    fetchDataForEntity(entity);
                    return prev;
                default:
                    return prev;
            }

            return { ...prev, [entity]: updated };
        });
    }, [fetchDataForEntity]);

    // Chargement initial optimisé (Phased Loading)
    useEffect(() => {
        const initialLoad = async () => {
            setIsLoading(true);

            // 1. Charger CRITICAL immédiatement
            console.log('🚀 [CacheContext] Phase 1: Critical Entities');
            await Promise.all(CRITICAL_ENTITIES.map(entity => fetchDataForEntity(entity)));

            // 2. Charger SECONDARY après un court délai
            setTimeout(() => {
                console.log('🚀 [CacheContext] Phase 2: Secondary Entities');
                Promise.all(SECONDARY_ENTITIES.map(entity => fetchDataForEntity(entity)));
            }, 500);

            // 3. LAZY sera chargé on-demand par les composants ou en arrière-plan plus tard
            setTimeout(() => {
                console.log('🚀 [CacheContext] Phase 3: Lazy Entities (Background)');
                // On précharge quand même doucement pour que ce soit prêt
                Promise.all(LAZY_ENTITIES.map(entity => fetchDataForEntity(entity)));
            }, 3000);

            setIsLoading(false); // UI débloquée rapidement !
        };
        initialLoad();
    }, [fetchDataForEntity]);

    // Gestion des mises à jour WebSocket
    useEffect(() => {
        const handleDataUpdate = (payload) => {
            if (payload && payload.entity) {
                const entityToUpdate = payload.group ? `${payload.entity}:${payload.group}` : payload.entity;

                if (ALL_ENTITIES.includes(entityToUpdate)) {
                    console.log(`[CacheContext] Mise à jour reçue pour: ${entityToUpdate}`);

                    // Mise à jour partielle si les données sont fournies
                    if (payload.data && payload.action) {
                        updateCacheItem(entityToUpdate, payload.data, payload.action);
                    }
                    // Support pour l'ancien format (operation au lieu de action)
                    else if (payload.data && payload.operation) {
                        updateCacheItem(entityToUpdate, payload.data, payload.operation);
                    }
                    else {
                        // Fallback: re-fetch si pas de données partielles
                        fetchDataForEntity(entityToUpdate);
                    }
                }
            }
        };

        const unsubscribe = events.on('data_updated', handleDataUpdate);
        return () => unsubscribe();
    }, [events, fetchDataForEntity, updateCacheItem]);

    // Fonction pour charger une entité lazy on-demand
    const loadLazyEntity = useCallback(async (entity) => {
        if (!cache[entity]) {
            return await fetchDataForEntity(entity);
        }
        return cache[entity];
    }, [cache, fetchDataForEntity]);

    // Fonction pour forcer le rafraîchissement d'une entité
    const invalidate = useCallback(async (entity) => {
        if (ALL_ENTITIES.includes(entity)) {
            await fetchDataForEntity(entity);
        }
    }, [fetchDataForEntity]);

    const value = {
        cache,
        isLoading,
        error,
        invalidate,
        loadLazyEntity
    };

    return (
        <CacheContext.Provider value={value}>
            {children}
        </CacheContext.Provider>
    );
};