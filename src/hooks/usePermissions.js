/**
 * Hook React pour gérer les permissions
 * Utilise le contexte de l'application et le service de permissions
 */

import { useContext, useEffect, useMemo } from 'react';
import { AppContext } from '../contexts/AppContext';
import permissionService from '../services/permissionService';

export const usePermissions = () => {
  const { config, currentTechnician } = useContext(AppContext);

  // Initialiser le service de permissions
  useEffect(() => {
    if (currentTechnician && config) {
      permissionService.init(currentTechnician, config);
    }
  }, [currentTechnician, config]);

  // Mémoriser les fonctions et valeurs
  const permissions = useMemo(() => {
    if (!currentTechnician) {
      return {
        hasPermission: () => false,
        hasAnyPermission: () => false,
        hasAllPermissions: () => false,
        getAccessibleModules: () => [],
        getUserRole: () => null,
        isAdmin: () => false,
        isSuperAdmin: () => false,
        canAccessModule: () => false,
        getModuleActions: () => [],
        getUserInfo: () => null,
        user: null,
        role: null,
        userPermissions: [],
        accessibleModules: []
      };
    }

    return {
      hasPermission: (permission) => permissionService.hasPermission(permission),
      hasAnyPermission: (permissions) => permissionService.hasAnyPermission(permissions),
      hasAllPermissions: (permissions) => permissionService.hasAllPermissions(permissions),
      getAccessibleModules: () => permissionService.getAccessibleModules(),
      getUserRole: () => permissionService.getUserRole(),
      isAdmin: () => permissionService.isAdmin(),
      isSuperAdmin: () => permissionService.isSuperAdmin(),
      canAccessModule: (moduleId) => permissionService.canAccessModule(moduleId),
      getModuleActions: (moduleId) => permissionService.getModuleActions(moduleId),
      getUserInfo: () => permissionService.getUserInfo(),
      user: currentTechnician,
      role: permissionService.getUserRole(),
      userPermissions: permissionService.getUserPermissions(),
      accessibleModules: permissionService.getAccessibleModules()
    };
  }, [currentTechnician, config]);

  return permissions;
};

export default usePermissions;
