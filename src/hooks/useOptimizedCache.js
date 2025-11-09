// src/hooks/useOptimizedCache.js - Hook de Cache Intelligent avec React Query

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import apiService from '../services/apiService';

// ✅ Configuration globale du cache
export const CACHE_CONFIG = {
  // Durées de cache par type de données (en millisecondes)
  STALE_TIME: {
    config: 5 * 60 * 1000,        // 5 minutes (données rarement modifiées)
    loans: 30 * 1000,              // 30 secondes (données dynamiques)
    computers: 60 * 1000,          // 1 minute
    excel_users: 2 * 60 * 1000,    // 2 minutes
    technicians: 15 * 1000,        // 15 secondes (présence temps réel)
    rds_sessions: 10 * 1000,       // 10 secondes (sessions actives)
    ad_groups: 60 * 1000,          // 1 minute
  },

  // Durée de rétention en cache après dernière utilisation
  CACHE_TIME: 10 * 60 * 1000, // 10 minutes

  // Retry strategy
  RETRY: {
    attempts: 3,
    delay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  },
};

// ✅ Query Keys - Centralisation pour éviter duplication
export const QUERY_KEYS = {
  loans: ['loans'],
  computers: ['computers'],
  excelUsers: ['excel_users'],
  technicians: ['technicians'],
  rdsSessions: ['rds_sessions'],
  config: ['config'],
  adGroup: (groupName) => ['ad_groups', groupName],
  allAdGroups: () => ['ad_groups'],
};

/**
 * Hook optimisé pour les prêts (loans)
 */
export function useLoans(options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.loans,
    queryFn: () => apiService.getLoans(),
    staleTime: CACHE_CONFIG.STALE_TIME.loans,
    cacheTime: CACHE_CONFIG.CACHE_TIME,
    retry: CACHE_CONFIG.RETRY.attempts,
    retryDelay: CACHE_CONFIG.RETRY.delay,
    ...options,
  });
}

/**
 * Hook optimisé pour les ordinateurs
 */
export function useComputers(options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.computers,
    queryFn: () => apiService.getComputers(),
    staleTime: CACHE_CONFIG.STALE_TIME.computers,
    cacheTime: CACHE_CONFIG.CACHE_TIME,
    retry: CACHE_CONFIG.RETRY.attempts,
    retryDelay: CACHE_CONFIG.RETRY.delay,
    ...options,
  });
}

/**
 * Hook optimisé pour les utilisateurs Excel
 */
export function useExcelUsers(options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.excelUsers,
    queryFn: async () => {
      const response = await apiService.getExcelUsers();
      return response?.users || {};
    },
    staleTime: CACHE_CONFIG.STALE_TIME.excel_users,
    cacheTime: CACHE_CONFIG.CACHE_TIME,
    retry: CACHE_CONFIG.RETRY.attempts,
    retryDelay: CACHE_CONFIG.RETRY.delay,
    ...options,
  });
}

/**
 * Hook optimisé pour les techniciens connectés
 */
export function useTechnicians(options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.technicians,
    queryFn: () => apiService.getConnectedTechnicians(),
    staleTime: CACHE_CONFIG.STALE_TIME.technicians,
    cacheTime: CACHE_CONFIG.CACHE_TIME,
    retry: CACHE_CONFIG.RETRY.attempts,
    retryDelay: CACHE_CONFIG.RETRY.delay,
    refetchInterval: 30000, // ✅ Refetch automatique toutes les 30s
    ...options,
  });
}

/**
 * Hook optimisé pour les sessions RDS
 */
export function useRdsSessions(options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.rdsSessions,
    queryFn: () => apiService.getRdsSessions(),
    staleTime: CACHE_CONFIG.STALE_TIME.rds_sessions,
    cacheTime: CACHE_CONFIG.CACHE_TIME,
    retry: CACHE_CONFIG.RETRY.attempts,
    retryDelay: CACHE_CONFIG.RETRY.delay,
    refetchInterval: 15000, // ✅ Refetch automatique toutes les 15s
    ...options,
  });
}

/**
 * Hook optimisé pour la configuration
 */
export function useConfig(options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.config,
    queryFn: () => apiService.getConfig(),
    staleTime: CACHE_CONFIG.STALE_TIME.config,
    cacheTime: CACHE_CONFIG.CACHE_TIME,
    retry: CACHE_CONFIG.RETRY.attempts,
    retryDelay: CACHE_CONFIG.RETRY.delay,
    ...options,
  });
}

/**
 * Hook optimisé pour un groupe AD spécifique
 */
export function useAdGroup(groupName, options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.adGroup(groupName),
    queryFn: async () => {
      // ✅ Utiliser Electron API si disponible, sinon HTTP
      if (window.electronAPI && window.electronAPI.getAdGroupMembers) {
        const result = await window.electronAPI.getAdGroupMembers(groupName);
        return result.success ? result.members : [];
      } else {
        return await apiService.getAdGroupMembers(groupName);
      }
    },
    staleTime: CACHE_CONFIG.STALE_TIME.ad_groups,
    cacheTime: CACHE_CONFIG.CACHE_TIME,
    retry: CACHE_CONFIG.RETRY.attempts,
    retryDelay: CACHE_CONFIG.RETRY.delay,
    enabled: !!groupName, // ✅ Ne pas exécuter si pas de nom de groupe
    ...options,
  });
}

/**
 * Hook pour invalider le cache
 */
export function useInvalidateCache() {
  const queryClient = useQueryClient();

  const invalidateLoans = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.loans });
  }, [queryClient]);

  const invalidateComputers = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.computers });
  }, [queryClient]);

  const invalidateExcelUsers = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.excelUsers });
  }, [queryClient]);

  const invalidateTechnicians = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.technicians });
  }, [queryClient]);

  const invalidateRdsSessions = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rdsSessions });
  }, [queryClient]);

  const invalidateConfig = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.config });
  }, [queryClient]);

  const invalidateAdGroup = useCallback((groupName) => {
    if (groupName) {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adGroup(groupName) });
    } else {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allAdGroups() });
    }
  }, [queryClient]);

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries();
  }, [queryClient]);

  return {
    invalidateLoans,
    invalidateComputers,
    invalidateExcelUsers,
    invalidateTechnicians,
    invalidateRdsSessions,
    invalidateConfig,
    invalidateAdGroup,
    invalidateAll,
  };
}

/**
 * Hook pour mutations (CREATE, UPDATE, DELETE)
 */
export function useLoanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (loanData) => apiService.createLoan(loanData),
    onSuccess: () => {
      // ✅ Invalider automatiquement le cache après mutation
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.loans });
    },
  });
}

/**
 * Hook générique pour précharger des données
 */
export function usePrefetchData() {
  const queryClient = useQueryClient();

  const prefetchLoans = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.loans,
      queryFn: () => apiService.getLoans(),
    });
  }, [queryClient]);

  const prefetchRdsSessions = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.rdsSessions,
      queryFn: () => apiService.getRdsSessions(),
    });
  }, [queryClient]);

  return {
    prefetchLoans,
    prefetchRdsSessions,
  };
}

/**
 * Hook principal pour accès unifié au cache
 * Compatible avec l'ancien CacheContext pour migration progressive
 */
export function useOptimizedCache() {
  const loans = useLoans();
  const computers = useComputers();
  const excelUsers = useExcelUsers();
  const technicians = useTechnicians();
  const rdsSessions = useRdsSessions();
  const config = useConfig();

  const invalidate = useInvalidateCache();

  // ✅ Format compatible avec l'ancien CacheContext
  const cache = {
    loans: loans.data || [],
    computers: computers.data || [],
    excel_users: excelUsers.data || {},
    technicians: technicians.data || [],
    rds_sessions: rdsSessions.data || [],
    config: config.data || {},
  };

  const isLoading = loans.isLoading ||
                    computers.isLoading ||
                    excelUsers.isLoading ||
                    technicians.isLoading ||
                    rdsSessions.isLoading ||
                    config.isLoading;

  const error = loans.error ||
                computers.error ||
                excelUsers.error ||
                technicians.error ||
                rdsSessions.error ||
                config.error;

  return {
    cache,
    isLoading,
    error,
    invalidate: invalidate.invalidateAll,
    invalidateLoans: invalidate.invalidateLoans,
    invalidateComputers: invalidate.invalidateComputers,
    invalidateExcelUsers: invalidate.invalidateExcelUsers,
    invalidateTechnicians: invalidate.invalidateTechnicians,
    invalidateRdsSessions: invalidate.invalidateRdsSessions,
    invalidateConfig: invalidate.invalidateConfig,
    invalidateAdGroup: invalidate.invalidateAdGroup,
  };
}
