/**
 * Panneau de gestion des utilisateurs app_users et leurs permissions
 * Système moderne avec permissions par checkbox (7 onglets)
 */

import React from 'react';
import { Box, Alert, Typography } from '@mui/material';
import AppUsersManagementPage from '../../pages/AppUsersManagementPage';

const UsersPermissionsPanel = () => {
    return (
        <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                    <strong>Système de Permissions Moderne</strong><br />
                    Gérez les accès des utilisateurs avec des permissions granulaires par onglet :
                    Dashboard, Sessions RDS, Serveurs, Utilisateurs, Groupes AD, Prêts, DocuCortex IA
                </Typography>
            </Alert>

            {/* Utiliser directement AppUsersManagementPage */}
            <AppUsersManagementPage />
        </Box>
    );
};

export default UsersPermissionsPanel;
