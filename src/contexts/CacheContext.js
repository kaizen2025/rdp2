// src/contexts/CacheContext.js

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';
import { useApp } from './AppContext';

const CacheContext = createContext();

export const useCache = () => useContext(CacheContext);

// ✅ AJOUT: 'ad_groups:VPN' et 'ad_groups:Sortants_responsables'
const ENTITIES = [
    'loans', 'computers', 'excel_users', 'technicians', 'rds_sessions', 'config',
    'ad_groups:VPN', 'ad_groups:Sortants_responsables'
];

export const CacheProvider = ({ children }) => {
    const { events, showNotification } = useApp();
    const [cache, setCache] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDataForEntity = useCallback(async (entity) => {
        try {
            let data;
            // ✅ AJOUT: Logique pour charger les groupes AD
            if (entity.startsWith('ad_groups:')) {
                const groupName = entity.split(':')[1];

                // ✅ Utiliser l'API Electron si disponible (mode desktop), sinon fallback HTTP
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
                    case 'excel_users': data = (await apiService.getExcelUsers())?.users || {}; break;
                    case 'technicians': data = await apiService.getConnectedTechnicians(); break;
                    case 'rds_sessions': data = await apiService.getRdsSessions(); break;
                    case 'config': data = await apiService.getConfig(); break;
                    default: return;
                }
            }
            // ✅ S'assurer que data n'est jamais undefined/null
            if (data === undefined || data === null) {
                data = entity.startsWith('ad_groups:') ? [] : (entity === 'excel_users' ? {} : []);
            }
            setCache(prev => ({ ...prev, [entity]: data }));
            return data;
        } catch (err) {
            console.error(`Erreur chargement ${entity}:`, err);
            setError(err.message);

            // ✅ FIX: Don't show notification for AD groups if it's a transient connection error
            if (!entity.startsWith('ad_groups:')) {
                showNotification('error', `Impossible de charger les données: ${entity}`);
            }

            // ✅ CORRECTION CRITIQUE: Set empty default based on entity type to prevent undefined errors
            const fallbackData = entity.startsWith('ad_groups:') ? [] :
                                entity === 'excel_users' ? {} :
                                entity === 'config' ? {} : [];
            setCache(prev => ({ ...prev, [entity]: fallbackData }));
            return fallbackData;
        }
    }, [showNotification]);

    // ... (le reste du fichier est identique)
    // Chargement initial de toutes les données
    useEffect(() => {
        const initialLoad = async () => {
            setIsLoading(true);
            await Promise.all(ENTITIES.map(entity => fetchDataForEntity(entity)));
            setIsLoading(false);
        };
        initialLoad();
    }, [fetchDataForEntity]);

    // ✅ OPTIMISATION: Mises à jour partielles au lieu de full re-fetch
    useEffect(() => {
        const handleDataUpdate = (payload) => {
            if (payload && payload.entity) {
                const entityToUpdate = payload.group ? `${payload.entity}:${payload.group}` : payload.entity;
                if (ENTITIES.includes(entityToUpdate)) {
                    console.log(`[CacheContext] Mise à jour reçue pour: ${entityToUpdate}`);

                    // ✅ NOUVEAU: Si le payload contient des données partielles, les appliquer directement
                    if (payload.data && payload.operation) {
                        setCache(prev => {
                            const current = prev[entityToUpdate] || [];
                            let updated;

                            if (payload.operation === 'update' && payload.data.id) {
                                // Mise à jour d'un élément
                                updated = Array.isArray(current)
                                    ? current.map(item => item.id === payload.data.id ? { ...item, ...payload.data } : item)
                                    : current;
                            } else if (payload.operation === 'delete' && payload.data.id) {
                                // Suppression d'un élément
                                updated = Array.isArray(current)
                                    ? current.filter(item => item.id !== payload.data.id)
                                    : current;
                            } else if (payload.operation === 'create') {
                                // Ajout d'un nouvel élément
                                updated = Array.isArray(current) ? [...current, payload.data] : current;
                            } else {
                                // Opération inconnue, remplacer tout
                                updated = payload.data;
                            }

                            return { ...prev, [entityToUpdate]: updated };
                        });
                    } else {
                        // Pas de données partielles, faire un full re-fetch
                        fetchDataForEntity(entityToUpdate);
                    }
                }
            }
        };

        const unsubscribe = events.on('data_updated', handleDataUpdate);
        return () => unsubscribe();
    }, [events, fetchDataForEntity]);

    // Fonction pour forcer le rafraîchissement d'une entité
    const invalidate = useCallback(async (entity) => {
        if (ENTITIES.includes(entity)) {
            await fetchDataForEntity(entity);
        }
    }, [fetchDataForEntity]);

    const value = {
        cache,
        isLoading,
        error,
        invalidate,
    };

    return (
        <CacheContext.Provider value={value}>
            {children}
        </CacheContext.Provider>
    );
};