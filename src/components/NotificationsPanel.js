// src/components/NotificationsPanel.js - VERSION FINALE, 100% COMPLÈTE ET CORRIGÉE

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Grow from '@mui/material/Grow';
import ListItemIcon from '@mui/material/ListItemIcon';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import DialogContent from '@mui/material/DialogContent';

// Icons
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import UpdateIcon from '@mui/icons-material/Update';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CloseIcon from '@mui/icons-material/Close';

import apiService from '../services/apiService';
import { useApp } from '../contexts/AppContext';

const NOTIFICATION_TYPE_CONFIG = {
    reminder_before: { icon: <InfoIcon />, color: 'info', label: 'Rappel' },
    overdue: { icon: <WarningIcon />, color: 'warning', label: 'En retard' },
    critical: { icon: <ErrorIcon />, color: 'error', label: 'Critique' },
    returned: { icon: <CheckCircleIcon />, color: 'success', label: 'Retourné' },
    extended: { icon: <UpdateIcon />, color: 'info', label: 'Prolongé' },
};

const getNotificationMessage = (notification) => {
    const { type, details } = notification;
    switch (type) {
        case 'reminder_before': return `Retour prévu le ${new Date(details.expectedReturnDate).toLocaleDateString()}`;
        case 'overdue': return `En retard de ${details.daysOverdue} jour(s)`;
        case 'critical': return `Retard critique : ${details.daysOverdue} jour(s)`;
        case 'returned': return `Retourné avec succès`;
        case 'extended': return `Prolongé jusqu'au ${new Date(details.newReturnDate).toLocaleDateString()}`;
        default: return notification.details?.message || 'Notification système';
    }
};

const NotificationItem = React.memo(({ notification, onMarkAsRead }) => {
    const config = NOTIFICATION_TYPE_CONFIG[notification.type] || { icon: <NotificationsIcon />, color: 'default', label: 'Notification' };
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        if (diffMins < 1) return "À l'instant";
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffHours < 24) return `Il y a ${diffHours}h`;
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <Grow in={true}>
            <ListItem
                sx={{ backgroundColor: !notification.read_status ? 'action.hover' : 'transparent', borderLeft: !notification.read_status ? `4px solid` : 'none', borderColor: `${config.color}.main`, mb: 1, borderRadius: 1 }}
                secondaryAction={!notification.read_status && <IconButton edge="end" size="small" onClick={() => onMarkAsRead(notification.id)} title="Marquer comme lu"><CheckCircleIcon /></IconButton>}
            >
            <ListItemIcon>{React.cloneElement(config.icon, { color: config.color })}</ListItemIcon>
            <ListItemText
                primary={<Box component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}><Chip label={config.label} size="small" color={config.color} /><Typography variant="caption" color="textSecondary">{formatDate(notification.date)}</Typography></Box>}
                secondary={<Box component="div"><Typography variant="body2" sx={{ mb: 0.5 }}><strong>{notification.computerName}</strong> - {notification.userDisplayName || notification.userName}</Typography><Typography component="div" variant="body2" color="textSecondary">{getNotificationMessage(notification)}</Typography></Box>}
            />
            </ListItem>
        </Grow>
    );
});

const NotificationsPanel = ({ open, onClose, onUpdate }) => {
    const { showNotification } = useApp();
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentTab, setCurrentTab] = useState(0);

    const loadNotifications = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await apiService.getNotifications();
            setNotifications(data || []);
        } catch (error) { showNotification('error', 'Erreur chargement notifications'); } 
        finally { setIsLoading(false); }
    }, [showNotification]);

    useEffect(() => { if (open) loadNotifications(); }, [open, loadNotifications]);

    const handleMarkAsRead = async (id) => {
        try {
            await apiService.markNotificationAsRead(id);
            await loadNotifications();
            onUpdate(); // Met à jour le badge dans l'AppBar
        } catch (error) { showNotification('error', 'Erreur marquage notification'); }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await apiService.markAllNotificationsAsRead();
            await loadNotifications();
            onUpdate(); // Met à jour le badge dans l'AppBar
        } catch (error) { showNotification('error', 'Erreur marquage notifications'); }
    };
    
    const filteredNotifications = useMemo(() => currentTab === 0 ? notifications.filter(n => !n.read_status) : notifications, [notifications, currentTab]);
    const unreadCount = useMemo(() => notifications.filter(n => !n.read_status).length, [notifications]);

    return (
        <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 400, md: 500 } } }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NotificationsActiveIcon /> Centre de Notifications
                </Typography>
                <IconButton onClick={onClose}><CloseIcon /></IconButton>
            </Box>
            <Divider />
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)}>
                    <Tab label={`Non lues (${unreadCount})`} />
                    <Tab label={`Toutes (${notifications.length})`} />
                </Tabs>
                {unreadCount > 0 && <Button startIcon={<DoneAllIcon />} onClick={handleMarkAllAsRead} size="small">Tout marquer comme lu</Button>}
            </Box>
            <DialogContent>
                {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box> : 
                 filteredNotifications.length === 0 ? <Alert severity="success" sx={{m: 2}}>Vous êtes à jour !</Alert> : 
                 <List>{filteredNotifications.map(notif => <NotificationItem key={notif.id} notification={notif} onMarkAsRead={handleMarkAsRead} />)}</List>}
            </DialogContent>
        </Drawer>
    );
};

export default NotificationsPanel;