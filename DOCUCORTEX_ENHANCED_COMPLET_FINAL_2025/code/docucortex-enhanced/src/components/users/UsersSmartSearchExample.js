// src/components/users/UsersSmartSearchExample.js - Exemple d'utilisation de UsersSmartSearch
// Phase 2 - Recherche Intelligente Fuzzy - Démonstration complète

import React, { useState, useCallback } from 'react';
import { Box, Paper, Typography, Divider, Alert } from '@mui/material';
import { motion } from 'framer-motion';

// Importer le composant principal
import UsersSmartSearch from './UsersSmartSearch';

// =============================================================================
// 📊 DONNÉES DE DÉMONSTRATION
// =============================================================================

// Générateur d'utilisateurs de démonstration
const generateDemoUsers = (count = 500) => {
    const firstNames = ['Jean', 'Marie', 'Pierre', 'Sophie', 'Michel', 'Anne', 'Luc', 'Catherine', 'Paul', 'Isabelle'];
    const lastNames = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau'];
    const departments = ['IT', 'RH', 'Finance', 'Marketing', 'Commercial', 'Logistique', 'Qualité', 'R&D', 'Juridique', 'Communication'];
    const groups = ['Users', 'Admins', 'Managers', 'Guests', 'IT_Staff', 'Finance_Users'];
    const statuses = ['active', 'inactive', 'disabled'];

    const users = [];
    
    for (let i = 1; i <= count; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const department = departments[Math.floor(Math.random() * departments.length)];
        const group = groups[Math.floor(Math.random() * groups.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        const name = `${firstName} ${lastName}`;
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@entreprise.com`;
        const phone = `01${Math.floor(Math.random() * 90 + 10)}${Math.floor(Math.random() * 90 + 10)}${Math.floor(Math.random() * 90 + 10)}${Math.floor(Math.random() * 90 + 10)}${Math.floor(Math.random() * 90 + 10)}`;
        
        users.push({
            id: `user_${i}`,
            name,
            email,
            phone,
            username: `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
            department,
            group,
            status,
            hasActiveLoans: Math.random() > 0.7,
            tags: group === 'Admins' ? ['admin', 'vpn'] : group === 'IT_Staff' ? ['it', 'technical'] : ['user'],
            avatar: Math.random() > 0.5 ? `https://i.pravatar.cc/150?img=${i}` : null,
            lastLogin: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // 30 derniers jours
            created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000) // 1 an
        });
    }
    
    return users;
};

// =============================================================================
// 🎯 COMPOSANT PRINCIPAL DE DÉMONSTRATION
// =============================================================================

const UsersSmartSearchExample = () => {
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchMetrics, setSearchMetrics] = useState(null);
    const [demoUsers] = useState(() => generateDemoUsers(500));

    // Données pour la démonstration
    const [currentDemo, setCurrentDemo] = useState('basic');

    // =============================================================================
    // 🔍 GESTIONNAIRES D'ÉVÉNEMENTS
    // =============================================================================

    // Gestion de la sélection d'utilisateur
    const handleUserSelect = useCallback((user) => {
        setSelectedUser(user);
        console.log('👤 Utilisateur sélectionné:', user);
        
        // Ici vous pourriez ouvrir un modal de détails, naviguer vers une page, etc.
        // Exemple: onUserDetailsOpen(user);
    }, []);

    // Gestion du changement de recherche
    const handleSearchChange = useCallback((searchData) => {
        setSearchMetrics(searchData.metrics);
        console.log('🔍 Recherche changée:', searchData);
    }, []);

    // =============================================================================
    // 📋 INFORMATIONS DE DÉMONSTRATION
    // =============================================================================

    const demoFeatures = {
        basic: {
            title: 'Recherche de Base',
            description: 'Recherche simple avec autocomplétion et fuzzy matching',
            config: {
                enableHistory: false,
                enableFilters: false,
                showPerformanceMetrics: true,
                maxResults: 20
            }
        },
        advanced: {
            title: 'Recherche Avancée',
            description: 'Recherche complète avec historique et filtres',
            config: {
                enableHistory: true,
                enableFilters: true,
                showPerformanceMetrics: true,
                maxResults: 50,
                enableAutocomplete: true,
                enableFuzzySearch: true
            }
        },
        full: {
            title: 'Configuration Complète',
            description: 'Toutes les fonctionnalités activées pour 500+ utilisateurs',
            config: {
                enableHistory: true,
                enableFilters: true,
                showPerformanceMetrics: true,
                maxResults: 100,
                enableAutocomplete: true,
                enableFuzzySearch: true
            }
        }
    };

    // =============================================================================
    // 🎨 RENDU UI
    // =============================================================================

    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
            {/* En-tête de démonstration */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                        🚀 DocuCortex - Recherche Intelligente Fuzzy
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Composant optimisé pour 500+ utilisateurs avec fuzzy matching, autocomplétion et filtres intelligents
                    </Typography>
                </Paper>
            </motion.div>

            {/* Sélecteur de démonstration */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                    Sélectionnez un mode de démonstration :
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {Object.entries(demoFeatures).map(([key, feature]) => (
                        <motion.button
                            key={key}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setCurrentDemo(key)}
                            style={{
                                padding: '12px 24px',
                                border: currentDemo === key ? '2px solid #1976d2' : '1px solid #ccc',
                                borderRadius: '8px',
                                backgroundColor: currentDemo === key ? '#e3f2fd' : 'white',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: currentDemo === key ? 'bold' : 'normal'
                            }}
                        >
                            <strong>{feature.title}</strong>
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                {feature.description}
                            </div>
                        </motion.button>
                    ))}
                </Box>
            </Paper>

            {/* Informations sur la configuration actuelle */}
            <motion.div
                key={currentDemo}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Alert severity="info" sx={{ mb: 3 }}>
                    <strong>Configuration Actuelle:</strong> {demoFeatures[currentDemo].description}
                </Alert>
            </motion.div>

            {/* Composant de recherche */}
            <motion.div
                key={`search-${currentDemo}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Paper sx={{ p: 3, mb: 3 }}>
                    <UsersSmartSearch
                        users={demoUsers}
                        onUserSelect={handleUserSelect}
                        onSearchChange={handleSearchChange}
                        placeholder="Rechercher par nom, email, téléphone, département..."
                        {...demoFeatures[currentDemo].config}
                        className="demo-search"
                    />
                </Paper>
            </motion.div>

            {/* Informations utilisateur sélectionné */}
            <AnimatePresence>
                {selectedUser && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Paper sx={{ p: 3, mb: 3, bgcolor: 'success.light', color: 'success.contrastText' }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                ✅ Utilisateur Sélectionné
                            </Typography>
                            <Divider sx={{ my: 2, bgcolor: 'rgba(255,255,255,0.3)' }} />
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                                <div>
                                    <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                                        Nom Complet
                                    </Typography>
                                    <Typography variant="body1" fontWeight={600}>
                                        {selectedUser.name}
                                    </Typography>
                                </div>
                                <div>
                                    <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                                        Email
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedUser.email}
                                    </Typography>
                                </div>
                                <div>
                                    <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                                        Téléphone
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedUser.phone}
                                    </Typography>
                                </div>
                                <div>
                                    <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                                        Département
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedUser.department}
                                    </Typography>
                                </div>
                                <div>
                                    <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                                        Groupe
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedUser.group}
                                    </Typography>
                                </div>
                                <div>
                                    <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                                        Statut
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedUser.status === 'active' ? '🟢 Actif' : 
                                         selectedUser.status === 'inactive' ? '🟡 Inactif' : '🔴 Désactivé'}
                                    </Typography>
                                </div>
                            </Box>
                        </Paper>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Métriques de performance */}
            <AnimatePresence>
                {searchMetrics && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                📊 Métriques de Performance
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2 }}>
                                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 2 }}>
                                    <Typography variant="h4" color="primary.contrastText">
                                        {searchMetrics.duration}ms
                                    </Typography>
                                    <Typography variant="caption" color="primary.contrastText">
                                        Temps de recherche
                                    </Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
                                    <Typography variant="h4" color="success.contrastText">
                                        {searchMetrics.resultsCount}
                                    </Typography>
                                    <Typography variant="caption" color="success.contrastText">
                                        Résultats trouvés
                                    </Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'secondary.light', borderRadius: 2 }}>
                                    <Typography variant="h4" color="secondary.contrastText">
                                        {searchMetrics.cacheHits}
                                    </Typography>
                                    <Typography variant="caption" color="secondary.contrastText">
                                        Cache hits
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Instructions d'utilisation */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
            >
                <Paper sx={{ p: 3, mt: 3, bgcolor: 'info.light', color: 'info.contrastText' }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                        💡 Comment tester les fonctionnalités
                    </Typography>
                    <Divider sx={{ my: 2, bgcolor: 'rgba(255,255,255,0.3)' }} />
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
                        <div>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                🔍 Fuzzy Matching
                            </Typography>
                            <Typography variant="body2">
                                Tapez "john" ou "jean" pour voir la recherche tolérante aux erreurs
                            </Typography>
                        </div>
                        <div>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                🤖 Autocomplétion
                            </Typography>
                            <Typography variant="body2">
                                Tapez les premières lettres pour voir les suggestions intelligentes
                            </Typography>
                        </div>
                        <div>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                🎯 Multi-champs
                            </Typography>
                            <Typography variant="body2">
                                Recherchez par nom, email, téléphone ou département
                            </Typography>
                        </div>
                        <div>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                ⚡ Performance
                            </Typography>
                            <Typography variant="body2">
                                Testez avec 500 utilisateurs pour voir l'optimisation
                            </Typography>
                        </div>
                    </Box>
                </Paper>
            </motion.div>
        </Box>
    );
};

export default UsersSmartSearchExample;