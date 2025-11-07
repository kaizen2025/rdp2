// src/hooks/useElectronAD.js
// Hook personnalisé pour utiliser window.electronAPI dans React
// Remplace les appels HTTP vers le backend par des appels IPC directs

import { useState, useCallback } from 'react';

/**
 * Hook React pour interagir avec Active Directory via Electron IPC
 * @returns {Object} Méthodes pour gérer les groupes et utilisateurs AD
 */
export const useElectronAD = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Récupère la liste des membres d'un groupe AD
     * @param {string} groupName - Nom du groupe (ex: 'VPN', 'Sortants_responsables')
     * @returns {Promise<Array>} Liste des membres avec SamAccountName, DisplayName, EmailAddress
     */
    const getGroupMembers = useCallback(async (groupName) => {
        setIsLoading(true);
        setError(null);
        try {
            if (!window.electronAPI) {
                throw new Error('API Electron non disponible (mode web?)');
            }

            const result = await window.electronAPI.getAdGroupMembers(groupName);

            if (!result.success) {
                throw new Error(result.error || 'Erreur inconnue');
            }

            return result.members || [];
        } catch (err) {
            console.error(`[useElectronAD] Erreur getGroupMembers(${groupName}):`, err);
            setError(err.message);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Ajoute un utilisateur à un groupe AD
     * @param {string} username - SamAccountName de l'utilisateur
     * @param {string} groupName - Nom du groupe
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    const addUserToGroup = useCallback(async (username, groupName) => {
        setIsLoading(true);
        setError(null);
        try {
            if (!window.electronAPI) {
                throw new Error('API Electron non disponible');
            }

            const result = await window.electronAPI.addUserToGroup({ username, groupName });

            if (!result.success) {
                throw new Error(result.error || 'Impossible d\'ajouter l\'utilisateur');
            }

            return result;
        } catch (err) {
            console.error(`[useElectronAD] Erreur addUserToGroup(${username}, ${groupName}):`, err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Retire un utilisateur d'un groupe AD
     * @param {string} username - SamAccountName de l'utilisateur
     * @param {string} groupName - Nom du groupe
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    const removeUserFromGroup = useCallback(async (username, groupName) => {
        setIsLoading(true);
        setError(null);
        try {
            if (!window.electronAPI) {
                throw new Error('API Electron non disponible');
            }

            const result = await window.electronAPI.removeUserFromGroup({ username, groupName });

            if (!result.success) {
                throw new Error(result.error || 'Impossible de retirer l\'utilisateur');
            }

            return result;
        } catch (err) {
            console.error(`[useElectronAD] Erreur removeUserFromGroup(${username}, ${groupName}):`, err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Recherche des utilisateurs dans AD
     * @param {string} searchTerm - Terme de recherche (min 2 caractères)
     * @returns {Promise<Array>} Liste des utilisateurs trouvés
     */
    const searchUsers = useCallback(async (searchTerm) => {
        setIsLoading(true);
        setError(null);
        try {
            if (!searchTerm || searchTerm.length < 2) {
                return [];
            }

            if (!window.electronAPI) {
                throw new Error('API Electron non disponible');
            }

            const result = await window.electronAPI.searchAdUsers(searchTerm);

            if (!result.success) {
                throw new Error(result.error || 'Erreur de recherche');
            }

            return result.users || [];
        } catch (err) {
            console.error(`[useElectronAD] Erreur searchUsers(${searchTerm}):`, err);
            setError(err.message);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Obtient les détails d'un utilisateur AD
     * @param {string} username - SamAccountName de l'utilisateur
     * @returns {Promise<Object|null>} Détails de l'utilisateur
     */
    const getUserDetails = useCallback(async (username) => {
        setIsLoading(true);
        setError(null);
        try {
            if (!window.electronAPI) {
                throw new Error('API Electron non disponible');
            }

            const result = await window.electronAPI.getAdUserDetails(username);

            if (!result.success) {
                throw new Error(result.error || 'Utilisateur introuvable');
            }

            return result.user || null;
        } catch (err) {
            console.error(`[useElectronAD] Erreur getUserDetails(${username}):`, err);
            setError(err.message);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Recherche des groupes dans AD
     * @param {string} searchTerm - Terme de recherche (min 2 caractères)
     * @returns {Promise<Array>} Liste des groupes trouvés
     */
    const searchGroups = useCallback(async (searchTerm) => {
        setIsLoading(true);
        setError(null);
        try {
            if (!searchTerm || searchTerm.length < 2) {
                return [];
            }

            if (!window.electronAPI) {
                throw new Error('API Electron non disponible');
            }

            const result = await window.electronAPI.searchAdGroups(searchTerm);

            if (!result.success) {
                throw new Error(result.error || 'Erreur de recherche');
            }

            return result.groups || [];
        } catch (err) {
            console.error(`[useElectronAD] Erreur searchGroups(${searchTerm}):`, err);
            setError(err.message);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Réinitialise l'état d'erreur
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        // Méthodes
        getGroupMembers,
        addUserToGroup,
        removeUserFromGroup,
        searchUsers,
        getUserDetails,
        searchGroups,
        clearError,

        // État
        isLoading,
        error,

        // Utilitaire pour vérifier si l'API est disponible
        isElectronAPIAvailable: !!window.electronAPI,
    };
};

export default useElectronAD;
