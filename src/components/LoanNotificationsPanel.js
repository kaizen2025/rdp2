// src/components/LoanNotificationsPanel.js - CORRIGÉ POUR UTILISER L'API WEB

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grow from '@mui/material/Grow';

import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import UpdateIcon from '@mui/icons-material/Update';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import apiService from '../services/apiService';

const NOTIFICATION_TYPE_CONFIG = {
    reminder_before: { icon: <InfoIcon />, color: 'info', label: 'Rappel' },
    overdue: { icon: <WarningIcon />, color: 'warning', label: 'En retard' },
    critical: { icon: <ErrorIcon />, color: 'error', label: 'Critique' },
    returned: { icon: <CheckCircleIcon />, color: 'success', label: 'Retourné' },
    extended: { icon: <UpdateIcon />, color: 'info', label: 'Prolongé' },
};

const NotificationItem = React.memo(({ notification, onMarkAsRead }) => {
    const config = NOTIFICATION_TYPE_CONFIG[notification.type] || { icon: <NotificationsIcon />, color: 'default', label: 'Notification' };
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        if (diffMins < 1) return "À l'instant";
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffHours < 24) return `Il y a ${diffHours}h`;
        if (diffDays < 7) return `Il y a ${diffDays}j`;
        return date.toLocaleDateString();
    };

    const getNotificationMessage = (notif) => {
        const { type, details } = notif;
        switch (type) {
            case 'reminder_before': return `Retour prévu le ${new Date(details.expectedReturnDate).toLocaleDateString()}`;
            case 'overdue': return `En retard de ${details.daysOverdue} jour(s)`;
            case 'critical': return `Retard critique : ${details.daysOverdue} jour(s)`;
            case 'returned': return `Retourné avec succès`;
            case 'extended': return `Prolongé jusqu'au ${new Date(details.newReturnDate).toLocaleDateString()}`;
            default: return '';
        }
    };

    return (
        <Grow in={true}>
            <ListItem sx={{ backgroundColor: notification.read ? 'transparent' : 'action.hover', borderLeft: notification.read ? 'none' : `4px solid`, borderColor: `${config.color}.main`, mb: 1, borderRadius: 1 }}
                secondaryAction={!notification.read && (<IconButton edge="end" size="small" onClick={() => onMarkAsRead(notification.id)} title="Marquer comme lu"><CheckCircleIcon /></IconButton>)} >
                <ListItemIcon>{React.cloneElement(config.icon, { color: config.color })}</ListItemIcon>
            <ListItemText
                primary={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}><Chip label={config.label} size="small" color={config.color} /><Typography variant="caption" color="textSecondary">{formatDate(notification.date)}</Typography></Box>}
                secondary={<Box><Typography variant="body2" sx={{ mb: 0.5 }}><strong>{notification.computerName}</strong> - {notification.userDisplayName || notification.userName}</Typography><Typography variant="body2" color="textSecondary">{getNotificationMessage(notification)}</Typography></Box>}
            />
            </ListItem>
        </Grow>
    );
});

const LoanNotificationsPanel = ({ open, onClose, onNotificationClick }) => {
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentTab, setCurrentTab] = useState(0);

    const loadNotifications = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await apiService.getNotifications();
            setNotifications(result || []);
        } catch (error) { console.error('Erreur chargement notifications:', error); } 
        finally { setIsLoading(false); }
    }, []);

    useEffect(() => { if (open) loadNotifications(); }, [open, loadNotifications]);

    const handleMarkAsRead = async (id) => {
        try { await apiService.markNotificationAsRead(id); await loadNotifications(); onNotificationClick(); } 
        catch (error) { console.error('Erreur:', error); }
    };

    const handleMarkAllAsRead = async () => {
        try { await apiService.markAllNotificationsAsRead(); await loadNotifications(); onNotificationClick(); } 
        catch (error) { console.error('Erreur:', error); }
    };

    const filteredNotifications = useMemo(() => currentTab === 0 ? notifications.filter(n => !n.read) : notifications, [notifications, currentTab]);
    const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><NotificationsActiveIcon />Notifications de prêts {unreadCount > 0 && <Chip label={unreadCount} color="error" size="small" />}</Box>
                    {unreadCount > 0 && <Button startIcon={<DoneAllIcon />} onClick={handleMarkAllAsRead} size="small">Tout marquer comme lu</Button>}
                </Box>
            </DialogTitle>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}><Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)}><Tab label={`Non lues (${unreadCount})`} icon={<NotificationsActiveIcon />} iconPosition="start" /><Tab label={`Toutes (${notifications.length})`} icon={<NotificationsIcon />} iconPosition="start" /></Tabs></Box>
            <DialogContent>
                {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box> : filteredNotifications.length === 0 ? <Alert severity="info">{currentTab === 0 ? 'Aucune notification non lue' : 'Aucune notification'}</Alert> : <List>{filteredNotifications.map(notif => <NotificationItem key={notif.id} notification={notif} onMarkAsRead={handleMarkAsRead} />)}</List>}
            </DialogContent>
            <DialogActions><Button onClick={onClose}>Fermer</Button></DialogActions>
        </Dialog>
    );
};

export default LoanNotificationsPanel;