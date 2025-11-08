// src/layouts/MainLayout.js - VERSION DÉFINITIVE AVEC NAVIGATION HORIZONTALE ET CORRECTIONS

import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
    Box, AppBar, Toolbar, Typography, IconButton, Tooltip, Menu, MenuItem,
    Badge, Chip, Avatar, Divider, Paper, Tabs, Tab, Collapse, Alert,
    ListItemIcon, ListItemText, CircularProgress // ✅ IMPORT MANQUANT AJOUTÉ
} from '@mui/material';

// Icons
import {
    Dns as DnsIcon, People as PeopleIcon, GroupWork as GroupWorkIcon,
    LaptopChromebook as LaptopChromebookIcon, Settings as SettingsIcon, Logout as LogoutIcon,
    Dashboard as DashboardIcon, Computer as ComputerIcon, Chat as ChatIcon,
    Notifications as NotificationsIcon, SmartToy as SmartToyIcon
} from '@mui/icons-material';

import { useApp } from '../contexts/AppContext';
import { useUnreadMessages } from '../hooks/useUnreadMessages'; // ✅ NOUVEAU
import { usePermissions } from '../hooks/usePermissions'; // ✅ NOUVEAU - Système de permissions
import ProtectedRoute from '../components/auth/ProtectedRoute'; // ✅ NOUVEAU - Protection des routes
import apiService from '../services/apiService';

// Lazy load pages
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const SessionsPage = lazy(() => import('../pages/SessionsPage'));
const UsersManagementPage = lazy(() => import('../pages/UsersManagementPage'));
const ConnectionsPage = lazy(() => import('../pages/ConnectionsPage'));
const AdGroupsPage = lazy(() => import('../pages/AdGroupsPage'));
const ComputerLoansPage = lazy(() => import('../pages/ComputerLoansPage'));
const AIAssistantPage = lazy(() => import('../pages/AIAssistantPage'));
const AIConfigPage = lazy(() => import('../pages/AIConfigPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const ChatDialog = lazy(() => import('../pages/ChatPage'));
const NotificationsPanel = lazy(() => import('../components/NotificationsPanel'));

const LoadingFallback = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 180px)' }}>
        <CircularProgress />
    </Box>
);

// Mapping des icônes pour les modules
const moduleIcons = {
    'dashboard': <DashboardIcon />,
    'sessions': <ComputerIcon />,
    'users': <PeopleIcon />,
    'servers': <DnsIcon />,
    'ad_groups': <GroupWorkIcon />,
    'loans': <LaptopChromebookIcon />,
    'ai_assistant': <SmartToyIcon />,
    'chat_ged': <ChatIcon />,
};

function MainLayout({ onLogout, currentTechnician, onChatClick }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { events, isOnline, notifications: toastNotifications } = useApp();
    const { unreadCount } = useUnreadMessages(); // ✅ NOUVEAU hook pour messages non lus
    const { getAccessibleModules, getUserRole, hasPermission } = usePermissions(); // ✅ NOUVEAU - Permissions

    const [userMenuAnchor, setUserMenuAnchor] = useState(null);
    const [chatOpen, setChatOpen] = useState(false);
    const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(false);
    const [onlineTechnicians, setOnlineTechnicians] = useState([]);
    const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
    const [activeSessionsCount, setActiveSessionsCount] = useState(0);
    const [settingsOpen, setSettingsOpen] = useState(false);

    // ✅ NOUVEAU - Menu dynamique basé sur les permissions
    const accessibleModules = getAccessibleModules();
    const userRole = getUserRole();
    const navItems = accessibleModules.map(module => ({
        text: module.label,
        path: module.path,
        icon: moduleIcons[module.id] || <DashboardIcon />,
        badge: module.badge,
        badgeColor: module.badgeColor
    }));

    // ✅ FIX: Meilleure logique pour détecter l'onglet actif
    // Chercher correspondance exacte d'abord, puis par startsWith (du plus long au plus court)
    const currentTab = navItems.findIndex(item =>
        location.pathname === item.path ||
        (location.pathname.startsWith(item.path) && item.path !== '/')
    );

    const refreshData = useCallback(async () => {
        try {
            const [techs, notifs, sessions] = await Promise.all([
                apiService.getConnectedTechnicians().catch(() => []),
                apiService.getUnreadNotifications().catch(() => []),
                apiService.getRdsSessions().catch(() => []),
            ]);
            
            setOnlineTechnicians(Array.isArray(techs) ? techs : []);
            setUnreadNotifsCount(Array.isArray(notifs) ? notifs.length : 0);
            setActiveSessionsCount(Array.isArray(sessions) ? sessions.filter(s => s.isActive).length : 0);
        } catch (error) { 
            console.error('Erreur rafraîchissement données layout:', error); 
        }
    }, []);

    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 30000);
        const unsubscribe = events.on('data_updated', refreshData);
        return () => { clearInterval(interval); unsubscribe(); };
    }, [refreshData, events]);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.default' }}>
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 2 }}>
                <Toolbar>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        RDS Viewer - Anecoop
                    </Typography>

                    <Chip label={isOnline ? "En ligne" : "Hors ligne"} color={isOnline ? "success" : "error"} size="small" sx={{ mr: 2 }} />
                    <Tooltip title={`${activeSessionsCount} session(s) active(s)`}><Chip icon={<ComputerIcon />} label={activeSessionsCount} color="primary" size="small" sx={{ mr: 2 }} onClick={() => navigate('/sessions')} /></Tooltip>

                    {/* ✅ NOUVEAU - Badge de rôle utilisateur */}
                    {userRole && (
                        <Tooltip title={userRole.description || userRole.name}>
                            <Chip
                                icon={<span style={{ fontSize: '16px' }}>{userRole.icon}</span>}
                                label={userRole.name}
                                size="small"
                                sx={{
                                    mr: 2,
                                    bgcolor: userRole.color || '#757575',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    '& .MuiChip-icon': { color: 'white' }
                                }}
                            />
                        </Tooltip>
                    )}

                    <Tooltip title="Chat"><IconButton color="inherit" onClick={() => { setChatOpen(true); if (onChatClick) onChatClick(); }}><Badge badgeContent={unreadCount} color="error"><ChatIcon /></Badge></IconButton></Tooltip>
                    <Tooltip title="Notifications"><IconButton color="inherit" onClick={() => setNotificationsPanelOpen(true)}><Badge badgeContent={unreadNotifsCount} color="error"><NotificationsIcon /></Badge></IconButton></Tooltip>
                    
                    <Tooltip title="Menu utilisateur"><IconButton onClick={(e) => setUserMenuAnchor(e.currentTarget)} sx={{ p: 1, ml: 1 }}><Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>{currentTechnician?.avatar || 'IT'}</Avatar></IconButton></Tooltip>
                    <Menu 
                        anchorEl={userMenuAnchor} 
                        open={Boolean(userMenuAnchor)} 
                        onClose={() => setUserMenuAnchor(null)}
                        sx={{ mt: '45px' }}
                        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    >
                        <MenuItem disabled>
                            <ListItemText primary={currentTechnician?.name} secondary={currentTechnician?.position} />
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={() => { setSettingsOpen(true); setUserMenuAnchor(null); }}>
                            <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
                            <ListItemText>Paramètres</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={onLogout}>
                            <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                            <ListItemText>Déconnexion</ListItemText>
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            <Suspense fallback={<div />}>
                {chatOpen && <ChatDialog open={chatOpen} onClose={() => setChatOpen(false)} onlineTechnicians={onlineTechnicians} />}
                {settingsOpen && <SettingsPage open={settingsOpen} onClose={() => setSettingsOpen(false)} />}
                {notificationsPanelOpen && <NotificationsPanel open={notificationsPanelOpen} onClose={() => setNotificationsPanelOpen(false)} onUpdate={refreshData} />}
            </Suspense>

            <Box component="main" sx={{ flexGrow: 1, pt: '64px', display: 'flex', flexDirection: 'column' }}>
                <Paper square elevation={1} sx={{ borderBottom: 1, borderColor: 'divider', position: 'sticky', top: '64px', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                    <Tabs
                        value={currentTab === -1 ? false : currentTab}
                        onChange={(event, newValue) => navigate(navItems[newValue].path)}
                        variant="scrollable"
                        scrollButtons="auto"
                        allowScrollButtonsMobile
                    >
                        {navItems.map((item) => (
                            <Tab
                                key={item.path}
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {item.text}
                                        {item.badge && (
                                            <Chip
                                                label={item.badge}
                                                size="small"
                                                color={item.badgeColor || 'default'}
                                                sx={{ height: '20px', fontSize: '0.7rem' }}
                                            />
                                        )}
                                    </Box>
                                }
                                icon={item.icon}
                                iconPosition="start"
                            />
                        ))}
                    </Tabs>
                </Paper>

                <Box sx={{ flexGrow: 1, p: { xs: 1, sm: 2, md: 3 }, overflow: 'auto' }}>
                    <Suspense fallback={<LoadingFallback />}>
                        <Routes>
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />

                            {/* ✅ NOUVEAU - Routes protégées par permissions */}
                            <Route path="/dashboard" element={
                                <ProtectedRoute requiredPermission="dashboard:view">
                                    <DashboardPage />
                                </ProtectedRoute>
                            } />

                            <Route path="/sessions" element={
                                <ProtectedRoute requiredPermission="sessions:view">
                                    <SessionsPage />
                                </ProtectedRoute>
                            } />

                            <Route path="/users" element={
                                <ProtectedRoute requiredPermission="users:view">
                                    <UsersManagementPage />
                                </ProtectedRoute>
                            } />

                            <Route path="/servers" element={
                                <ProtectedRoute requiredPermission="servers:view">
                                    <ConnectionsPage />
                                </ProtectedRoute>
                            } />

                            <Route path="/ad-groups" element={
                                <ProtectedRoute requiredPermission="ad_groups:view">
                                    <AdGroupsPage />
                                </ProtectedRoute>
                            } />

                            <Route path="/loans" element={
                                <ProtectedRoute requiredPermission="loans:view">
                                    <ComputerLoansPage />
                                </ProtectedRoute>
                            } />

                            <Route path="/ai-assistant" element={
                                <ProtectedRoute requiredPermission="ai_assistant:view">
                                    <AIAssistantPage />
                                </ProtectedRoute>
                            } />

                            <Route path="/ai-config" element={<AIConfigPage />} />

                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                    </Suspense>
                </Box>
            </Box>

            <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: (theme) => theme.zIndex.snackbar, width: 320 }}>
                {toastNotifications.map((notification) => (
                    <Collapse key={notification.id}>
                        <Alert 
                            severity={notification.type} 
                            sx={{ mb: 1, boxShadow: 3 }} 
                            onClose={() => { /* La fermeture est gérée par le timeout dans AppContext */ }}
                        >
                            {notification.message}
                        </Alert>
                    </Collapse>
                ))}
            </Box>
        </Box>
    );
}

export default MainLayout;