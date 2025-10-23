// src/hooks/useDataFetching.js - VERSION CORRIGÉE SANS BOUCLE INFINIE

import { useState, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';

const useDataFetching = (fetchFunction, options = {}) => {
    const { refreshInterval, entityName, initialFetch = true } = options;
    const { events } = useApp();
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(initialFetch);
    const [error, setError] = useState(null);

    // CORRECTION CRITIQUE: Utiliser useRef pour éviter la boucle infinie
    // fetchFunction ne doit PAS être dans les dépendances de useEffect
    const fetchFunctionRef = useRef(fetchFunction);

    // Mettre à jour la référence si la fonction change
    useEffect(() => {
        fetchFunctionRef.current = fetchFunction;
    }, [fetchFunction]);

    const fetchData = async (isBackgroundRefresh = false) => {
        if (!isBackgroundRefresh) setIsLoading(true);
        setError(null);

        try {
            const result = await fetchFunctionRef.current();
            setData(result);
        } catch (err) {
            console.error(`Erreur lors du fetch de ${entityName || 'données'}:`, err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (initialFetch) {
            fetchData(false);
        }

        const handleRefresh = () => fetchData(true);

        // Rafraîchissement périodique
        let intervalId = refreshInterval ? setInterval(handleRefresh, refreshInterval) : null;

        // Écoute des événements de mise à jour
        const unsubscribe = entityName ? events.on(`data_updated:${entityName}`, handleRefresh) : null;
        const forceRefreshUnsubscribe = events.on('force_refresh', handleRefresh);

        return () => {
            if (intervalId) clearInterval(intervalId);
            if (unsubscribe) unsubscribe();
            forceRefreshUnsubscribe();
        };
        // CORRECTION: Retirer fetchData des dépendances pour éviter la boucle
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshInterval, entityName, events, initialFetch]);

    return { data, isLoading, error, refresh: () => fetchData(false) };
};

export default useDataFetching;
