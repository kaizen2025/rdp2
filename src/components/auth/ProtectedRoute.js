/**
 * Composant ProtectedRoute
 * Protège une route basée sur les permissions
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { Box, Alert, AlertTitle, Button } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import HomeIcon from '@mui/icons-material/Home';

const ProtectedRoute = ({
  children,
  requiredPermission,
  requiredAny = [],
  requiredAll = [],
  fallback = null,
  redirectTo = '/'
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, user } = usePermissions();

  // Si pas d'utilisateur connecté, rediriger vers la page de login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Vérifier les permissions
  let hasAccess = true;

  if (requiredPermission) {
    hasAccess = hasPermission(requiredPermission);
  } else if (requiredAny.length > 0) {
    hasAccess = hasAnyPermission(requiredAny);
  } else if (requiredAll.length > 0) {
    hasAccess = hasAllPermissions(requiredAll);
  }

  // Si pas d'accès
  if (!hasAccess) {
    // Si un fallback est fourni, l'afficher
    if (fallback) return fallback;

    // Sinon, afficher un message d'erreur
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
          p: 3
        }}
      >
        <Alert
          severity="error"
          icon={<LockIcon fontSize="large" />}
          sx={{ maxWidth: 600 }}
        >
          <AlertTitle sx={{ fontSize: '1.5rem', mb: 2 }}>
            Accès refusé
          </AlertTitle>
          <Box sx={{ mb: 2 }}>
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </Box>
          <Box sx={{ mb: 2, fontSize: '0.9rem', color: 'text.secondary' }}>
            Permission requise : <code>{requiredPermission || requiredAny.join(', ') || requiredAll.join(', ')}</code>
          </Box>
          <Box>
            Contactez votre administrateur si vous pensez qu'il s'agit d'une erreur.
          </Box>
          <Box sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              startIcon={<HomeIcon />}
              href={redirectTo}
            >
              Retour à l'accueil
            </Button>
          </Box>
        </Alert>
      </Box>
    );
  }

  // L'utilisateur a accès, afficher le contenu
  return children;
};

export default ProtectedRoute;
