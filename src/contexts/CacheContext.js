// src/contexts/CacheContext.js

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';
import { useApp } from './AppContext';

const CacheContext = createContext();

export const useCache = () => useContext(CacheContext);

// Liste des entités à mettre en cache et à gérer
const ENTITIES = ['loans', 'computers', 'excel_users', 'technicians', 'rds_sessions', 'config'];

export const CacheProvider = ({ children }) => {
    const { events, showNotification } = useApp();
    const [cache, setCache] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDataForEntity = useCallback(async (entity) => {
        try {
            let data;
            switch (entity) {
                case 'loans': data = await apiService.getLoans(); break;
                case 'computers': data = await apiService.getComputers(); break;
                case 'excel_users': data = (await apiService.getExcelUsers())?.users || {}; break;
                case 'technicians': data = await apiService.getConnectedTechnicians(); break;
                case 'rds_sessions': data = await apiService.getRdsSessions(); break;
                case 'config': data = await apiService.getConfig(); break;
                default: return;
            }
            setCache(prev => ({ ...prev, [entity]: data }));
            return data;
        } catch (err) {
            console.error(`Erreur chargement ${entity}:`, err);
            setError(err.message);
            showNotification('error', `Impossible de charger les données: ${entity}`);
        }
    }, [showNotification]);

    // Chargement initial de toutes les données
    useEffect(() => {
        const initialLoad = async () => {
            setIsLoading(true);
            await Promise.all(ENTITIES.map(entity => fetchDataForEntity(entity)));
            setIsLoading(false);
        };
        initialLoad();
    }, [fetchDataForEntity]);

    // Écoute des événements WebSocket pour les mises à jour
    useEffect(() => {
        const handleDataUpdate = (payload) => {
            if (payload && payload.entity && ENTITIES.includes(payload.entity)) {
                console.log(`[CacheContext] Mise à jour reçue pour: ${payload.entity}`);
                fetchDataForEntity(payload.entity);
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