// src/components/Sidebar.js - Navigation complète avec toutes les pages

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import ComputerIcon from '@mui/icons-material/Computer';
import LaptopChromebookIcon from '@mui/icons-material/LaptopChromebook';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import ChatIcon from '@mui/icons-material/Chat';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import InventoryIcon from '@mui/icons-material/Inventory';
import MouseIcon from '@mui/icons-material/Mouse';
import PsychologyIcon from '@mui/icons-material/Psychology';

const drawerWidth = 240;

// AJOUT: Nouvelles entrées de navigation pour les accessoires et le calendrier
const navigationItems = [
    { 
        text: 'Tableau de bord', 
        path: '/dashboard', 
        icon: <DashboardIcon />,
        section: 'main'
    },
    { 
        text: 'Sessions RDS', 
        path: '/rds-viewer', 
        icon: <ComputerIcon />,
        section: 'main'
    },
    { 
        text: 'Utilisateurs', 
        path: '/users', 
        icon: <PeopleIcon />,
        section: 'main'
    },
    { 
        text: 'Active Directory', 
        path: '/active-directory', 
        icon: <GroupWorkIcon />,
        section: 'main'
    },
    { 
        text: 'Prêts Ordinateurs', 
        path: '/computer-loans', 
        icon: <LaptopChromebookIcon />,
        section: 'loans'
    },
    { 
        text: 'Calendrier Prêts', 
        path: '/loans-calendar', 
        icon: <CalendarMonthIcon />,
        section: 'loans',
        isNew: true // Badge "nouveau"
    },
    { 
        text: 'Gestion Accessoires', 
        path: '/accessories', 
        icon: <MouseIcon />,
        section: 'loans',
        isNew: true // Badge "nouveau"
    },
    {
        text: 'Chat',
        path: '/chat',
        icon: <ChatIcon />,
        section: 'ai'
    },
    {
        text: 'Configuration IA',
        path: '/ai-config',
        icon: <PsychologyIcon />,
        section: 'ai',
        isNew: true
    },
    {
        text: 'Paramètres',
        path: '/settings',
        icon: <SettingsIcon />,
        section: 'other'
    },
];

const Sidebar = ({ onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Grouper les items par section
    const mainItems = navigationItems.filter(item => item.section === 'main');
    const loansItems = navigationItems.filter(item => item.section === 'loans');
    const aiItems = navigationItems.filter(item => item.section === 'ai');
    const otherItems = navigationItems.filter(item => item.section === 'other');

    const renderNavigationItem = (item) => (
        <ListItem key={item.path} disablePadding>
            <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
                sx={{
                    '&.Mui-selected': {
                        backgroundColor: 'primary.main',
                        color: 'white',
                        '& .MuiListItemIcon-root': {
                            color: 'white',
                        },
                        '&:hover': {
                            backgroundColor: 'primary.dark',
                        },
                    },
                }}
            >
                <ListItemIcon sx={{ color: location.pathname === item.path ? 'white' : 'inherit' }}>
                    {item.icon}
                </ListItemIcon>
                <ListItemText 
                    primary={item.text}
                    primaryTypographyProps={{
                        fontSize: '0.9rem',
                        fontWeight: location.pathname === item.path ? 600 : 400,
                    }}
                />
                {/* Badge "Nouveau" pour les nouvelles fonctionnalités */}
                {item.isNew && (
                    <Box
                        sx={{
                            backgroundColor: 'success.main',
                            color: 'white',
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                            fontSize: '0.65rem',
                            fontWeight: 'bold',
                        }}
                    >
                        NEW
                    </Box>
                )}
            </ListItemButton>
        </ListItem>
    );

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                },
            }}
        >
            <Toolbar>
                <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
                    RDS Viewer
                </Typography>
            </Toolbar>
            <Divider />
            
            <Box sx={{ overflow: 'auto' }}>
                {/* Section Principale */}
                <List>
                    {mainItems.map(renderNavigationItem)}
                </List>

                <Divider />

                {/* Section Prêts */}
                <List
                    subheader={
                        <Box sx={{ px: 2, py: 1 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight="bold">
                                GESTION DES PRÊTS
                            </Typography>
                        </Box>
                    }
                >
                    {loansItems.map(renderNavigationItem)}
                </List>

                <Divider />

                {/* Section IA */}
                <List
                    subheader={
                        <Box sx={{ px: 2, py: 1 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight="bold">
                                INTELLIGENCE ARTIFICIELLE
                            </Typography>
                        </Box>
                    }
                >
                    {aiItems.map(renderNavigationItem)}
                </List>

                <Divider />

                {/* Section Autres */}
                <List>
                    {otherItems.map(renderNavigationItem)}
                </List>
            </Box>
        </Drawer>
    );
};

export default Sidebar;