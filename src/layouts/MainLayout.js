// src/layouts/MainLayout.js - VERSION FINALE AVEC CENTRE DE NOTIFICATIONS ET NETTOYAGE

import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Badge from '@mui/material/Badge';
import Chip from '@mui/material/Chip';

// Icons
import DnsIcon from '@mui/icons-material/Dns';
import PeopleIcon from '@mui/icons-material/People';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import LaptopChromebookIcon from '@mui/icons-material/LaptopChromebook';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ComputerIcon from '@mui/icons-material/Computer';
import ChatIcon from '@mui/icons-material/Chat';
import NotificationsIcon from '@mui/icons-material/Notifications';

import { useApp } from '../contexts/AppContext';
import apiService from '../services/apiService';

// Lazy load pages
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const SessionsPage = lazy(() => import('../pages/SessionsPage'));
const UsersManagementPage = lazy(() => import('../pages/UsersManagementPage'));
const ConnectionsPage = lazy(() => import('../pages/ConnectionsPage'));
const AdGroupsPage = lazy(() => import('../pages/AdGroupsPage'));
const ComputerLoansPage = lazy(() => import('../pages/ComputerLoansPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const ChatDialog = lazy(() => import('../pages/ChatPage'));
const NotificationsPanel = lazy(() => import('../components/NotificationsPanel')); // NOUVEAU

const drawerWidth = 240;

const LoadingFallback = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
    </Box>
);

const navItems = [
    { text: 'Tableau de bord', path: '/dashboard', icon: <DashboardIcon /> },
    { text: 'Sessions RDS', path: '/sessions', icon: <ComputerIcon /> },
    { text: 'Utilisateurs', path: '/users', icon: <PeopleIcon /> },
    { text: 'Serveurs', path: '/servers', icon: <DnsIcon /> },
    { text: 'Groupes AD', path: '/ad-groups', icon: <GroupWorkIcon /> },
    { text: 'Gestion Prêts', path: '/loans', icon: <LaptopChromebookIcon /> },
];

function MainLayout({ onLogout, currentTechnician }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { events, isOnline } = useApp();
    
    const [userMenuAnchor, setUserMenuAnchor] = useState(null);
    const [chatOpen, setChatOpen] = useState(false);
    const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(false);
    const [onlineTechnicians, setOnlineTechnicians] = useState([]);
    const unreadChatCount = 0; // Logique à implémenter plus tard
    const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
    const [activeSessionsCount, setActiveSessionsCount] = useState(0);
    const [settingsOpen, setSettingsOpen] = useState(false);

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

    const handleUserMenuOpen = (event) => setUserMenuAnchor(event.currentTarget);
    const handleUserMenuClose = () => setUserMenuAnchor(null);

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        RDS Viewer - Anecoop
                    </Typography>

                    <Chip label={isOnline ? "En ligne" : "Hors ligne"} color={isOnline ? "success" : "error"} size="small" sx={{ mr: 2 }} />
                    <Tooltip title={`${activeSessionsCount} session(s) active(s)`}><Chip icon={<ComputerIcon />} label={activeSessionsCount} color="primary" size="small" sx={{ mr: 2 }} onClick={() => navigate('/sessions')} /></Tooltip>

                    <Tooltip title="Chat entre techniciens"><IconButton color="inherit" onClick={() => setChatOpen(true)}><Badge badgeContent={unreadChatCount} color="success"><ChatIcon /></Badge></IconButton></Tooltip>
                    <Tooltip title="Notifications"><IconButton color="inherit" onClick={() => setNotificationsPanelOpen(true)}><Badge badgeContent={unreadNotifsCount} color="error"><NotificationsIcon /></Badge></IconButton></Tooltip>
                    
                    <Tooltip title="Menu utilisateur"><IconButton onClick={handleUserMenuOpen} sx={{ p: 1, ml: 1 }}><Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>{currentTechnician?.avatar || 'IT'}</Avatar></IconButton></Tooltip>
                    <Menu sx={{ mt: '45px' }} anchorEl={userMenuAnchor} open={Boolean(userMenuAnchor)} onClose={handleUserMenuClose} anchorOrigin={{ vertical: 'top', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
                        <MenuItem disabled><ListItemText primary={currentTechnician?.name} secondary={currentTechnician?.position} /></MenuItem>
                        <Divider />
                        {onlineTechnicians.length > 0 && (
                            <Box>
                                <MenuItem disabled><ListItemText primary={`${onlineTechnicians.length} technicien(s) en ligne`} primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }} /></MenuItem>
                                {onlineTechnicians.slice(0, 3).map(tech => ( <MenuItem key={tech.id} disabled><Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: '0.75rem' }}>{tech.avatar}</Avatar><ListItemText primary={tech.name} primaryTypographyProps={{ variant: 'body2' }} /></MenuItem>))}
                                <Divider />
                            </Box>
                        )}
                        <MenuItem onClick={() => { setSettingsOpen(true); handleUserMenuClose(); }}><ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon><ListItemText>Paramètres</ListItemText></MenuItem>
                        <MenuItem onClick={onLogout}><ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon><ListItemText>Déconnexion</ListItemText></MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            <Suspense fallback={<div />}>
                {chatOpen && <ChatDialog open={chatOpen} onClose={() => setChatOpen(false)} onlineTechnicians={onlineTechnicians} />}
                {settingsOpen && <SettingsPage open={settingsOpen} onClose={() => setSettingsOpen(false)} />}
                {notificationsPanelOpen && <NotificationsPanel open={notificationsPanelOpen} onClose={() => setNotificationsPanelOpen(false)} onUpdate={refreshData} />}
            </Suspense>

            <Drawer variant="permanent" sx={{ width: drawerWidth, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' } }}>
                <Toolbar />
                <Box sx={{ overflow: 'auto' }}>
                    <List>{navItems.map((item) => (<ListItem key={item.text} disablePadding><ListItemButton selected={location.pathname === item.path} onClick={() => navigate(item.path)}><ListItemIcon>{item.icon}</ListItemIcon><ListItemText primary={item.text} /></ListItemButton></ListItem>))}</List>
                </Box>
            </Drawer>

            <Box component="main" sx={{ flexGrow: 1, p: 3, height: '100vh', overflow: 'auto', backgroundColor: 'background.default' }}>
                <Toolbar />
                <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/sessions" element={<SessionsPage />} />
                        <Route path="/users" element={<UsersManagementPage />} />
                        <Route path="/servers" element={<ConnectionsPage />} />
                        <Route path="/ad-groups" element={<AdGroupsPage />} />
                        <Route path="/loans" element={<ComputerLoansPage />} />
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </Suspense>
            </Box>
        </Box>
    );
}

export default MainLayout;