/**
 * Composant PermissionGate
 * Affiche/masque des éléments basés sur les permissions
 */

import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';

const PermissionGate = ({
  children,
  permission,
  anyOf = [],
  allOf = [],
  fallback = null,
  showFallbackIfNoAccess = true
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  // Vérifier les permissions
  let hasAccess = true;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (anyOf.length > 0) {
    hasAccess = hasAnyPermission(anyOf);
  } else if (allOf.length > 0) {
    hasAccess = hasAllPermissions(allOf);
  }

  // Si pas d'accès
  if (!hasAccess) {
    return showFallbackIfNoAccess ? fallback : null;
  }

  // L'utilisateur a accès, afficher le contenu
  return children;
};

export default PermissionGate;
