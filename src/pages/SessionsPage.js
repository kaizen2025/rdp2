// src/pages/SessionsPage.js - VERSION FINALE CORRIGÉE

import React, { useState, useMemo, useCallback, memo } from 'react';
import { Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Chip, Tooltip, IconButton, FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel } from '@mui/material';
import { Person as PersonIcon, Dns as DnsIcon, Timer as TimerIcon, ScreenShare as ScreenShareIcon, Computer as ComputerIcon, Message as MessageIcon, Info as InfoIcon, Refresh as RefreshIcon, Announcement as AnnouncementIcon, CheckCircle as CheckCircleIcon, RadioButtonUnchecked as RadioButtonUncheckedIcon, Cancel as CancelIcon } from '@mui/icons-material';

import { useApp } from '../contexts/AppContext';
import { useCache } from '../contexts/CacheContext';
import apiService from '../services/apiService';
import SendMessageDialog from '../components/SendMessageDialog';
import UserInfoDialog from '../components/UserInfoDialog';
import GlobalMessageDialog from '../components/GlobalMessageDialog';
import PageHeader from '../components/common/PageHeader';
import SearchInput from '../components/common/SearchInput';
import EmptyState from '../components/common/EmptyState';
import LoadingScreen from '../components/common/LoadingScreen';

const GroupedUserRow = memo(({ user, sessions, onSendMessage, onShowInfo, onShadow, onConnect, getUserInfo }) => {
    const userInfo = useMemo(() => getUserInfo(user), [getUserInfo, user]);
    const mainSession = useMemo(() => sessions.find(s => s.isActive) || sessions[0], [sessions]);
    const serverList = useMemo(() => [...new Set(sessions.map(s => s.server))], [sessions]);
    const isActive = useMemo(() => sessions.some(s => s && s.isActive), [sessions]);
    
    const oldestSession = useMemo(() => {
        if (!isActive) return null;
        const sessionsWithTime = sessions.filter(s => s.logonTime);
        if (sessionsWithTime.length === 0) return null;
        return sessionsWithTime.reduce((oldest, current) => new Date(oldest.logonTime) > new Date(current.logonTime) ? current : oldest);
    }, [sessions, isActive]);

    const sessionDuration = useMemo(() => {
        if (!oldestSession) return 'N/A';
        const diffMs = new Date() - new Date(oldestSession.logonTime);
        const days = Math.floor(diffMs / 86400000);
        const hours = Math.floor((diffMs / 3600000) % 24);
        const minutes = Math.floor((diffMs / 60000) % 60);
        let durationStr = '';
        if (days > 0) durationStr += `${days}j `;
        if (hours > 0 || days > 0) durationStr += `${hours}h `;
        durationStr += `${minutes}m`;
        return durationStr.trim();
    }, [oldestSession]);

    return (
        <TableRow hover>
            <TableCell sx={{ fontWeight: 500 }}>{userInfo?.displayName || user}</TableCell>
            <TableCell><Typography variant="body2">{user}</Typography></TableCell>
            <TableCell><Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>{serverList.map(s => <Chip key={s} label={s} size="small" />)}</Box></TableCell>
            <TableCell><Chip label={isActive ? 'Actif' : 'Déconnecté'} color={isActive ? 'success' : 'default'} size="small" icon={isActive ? <CheckCircleIcon/> : <RadioButtonUncheckedIcon/>} /></TableCell>
            <TableCell><Box sx={{display: 'flex', alignItems: 'center', color: 'text.secondary'}}><TimerIcon fontSize="small" sx={{ mr: 1 }}/>{sessionDuration}</Box></TableCell>
            <TableCell>{oldestSession ? new Date(oldestSession.logonTime).toLocaleString('fr-FR') : 'N/A'}</TableCell>
            <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Tooltip title={isActive ? "Shadow (app bureau)" : "Session inactive"}><span><IconButton size="small" onClick={() => onShadow(mainSession)} color="primary" disabled={!isActive || !window.electronAPI}><ScreenShareIcon /></IconButton></span></Tooltip>
                    <Tooltip title="Connexion RDP (app bureau)"><span><IconButton size="small" onClick={() => onConnect(mainSession, userInfo)} color="success" disabled={!window.electronAPI}><ComputerIcon /></IconButton></span></Tooltip>
                    <Tooltip title={isActive ? "Envoyer un message" : "Session inactive"}><span><IconButton size="small" onClick={() => onSendMessage(mainSession)} color="info" disabled={!isActive}><MessageIcon /></IconButton></span></Tooltip>
                    {userInfo && (<Tooltip title="Fiche utilisateur"><IconButton size="small" onClick={() => onShowInfo(mainSession, userInfo)} color="secondary"><InfoIcon /></IconButton></Tooltip>)}
                </Box>
            </TableCell>
        </TableRow>
    );
});

const SessionsPage = () => {
    const { showNotification } = useApp();
    const { cache, isLoading: isCacheLoading, invalidate } = useCache();
    const [filter, setFilter] = useState('');
    const [serverFilter, setServerFilter] = useState('all');
    const [dialogState, setDialogState] = useState({ type: null, data: null });
    const [multiScreenMode, setMultiScreenMode] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const sessions = useMemo(() => Array.isArray(cache.rds_sessions) ? cache.rds_sessions : [], [cache.rds_sessions]);
    const users = useMemo(() => (cache.excel_users && typeof cache.excel_users === 'object') ? cache.excel_users : {}, [cache.excel_users]);
    const config = useMemo(() => cache.config || {}, [cache.config]);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        showNotification('info', 'Rafraîchissement des sessions en cours...');
        await apiService.refreshRdsSessions();
        await invalidate('rds_sessions');
        setIsRefreshing(false);
    }, [invalidate, showNotification]);

    const getUserInfo = useCallback((username) => {
        if (!users) return null;
        for (const serverUsers of Object.values(users)) {
            const user = serverUsers.find(u => u.username && u.username.toLowerCase() === username.toLowerCase());
            if (user) return user;
        }
        return null;
    }, [users]);
    
    const groupedSessions = useMemo(() => {
        const validSessions = sessions.filter(s => s && s.username && (serverFilter === 'all' || s.server === serverFilter));
        const grouped = validSessions.reduce((acc, s) => { (acc[s.username] = acc[s.username] || []).push(s); return acc; }, {});
        return Object.entries(grouped).filter(([user]) => !filter || user.toLowerCase().includes(filter.toLowerCase()) || (getUserInfo(user)?.displayName || '').toLowerCase().includes(filter.toLowerCase()));
    }, [sessions, filter, serverFilter, getUserInfo]);

    const stats = useMemo(() => {
        const activeSessions = sessions.filter(s => s.isActive).length;
        return {
            activeSessions,
            disconnectedSessions: sessions.length - activeSessions,
            uniqueServers: [...new Set(sessions.map(s => s.server))].length
        };
    }, [sessions]);

    const handleLaunchShadow = async (session) => {
        if (!window.electronAPI?.launchRdp) return showNotification('warning', 'Fonctionnalité disponible uniquement dans l\'application de bureau.');
        if (!session || !session.isActive) return showNotification('warning', 'La session doit être active.');
        showNotification('info', `Lancement du Shadow pour ${session.username}...`);
        try {
            const result = await window.electronAPI.launchRdp({ server: session.server, sessionId: session.sessionId });
            if (!result.success) throw new Error(result.error);
        } catch (err) { showNotification('error', `Erreur Shadow: ${err.message}`); }
    };

    const handleLaunchConnect = async (session, userInfo) => {
        if (!window.electronAPI?.launchRdp) return showNotification('warning', 'Fonctionnalité disponible uniquement dans l\'application de bureau.');
        if (!session) return;
        if (!userInfo?.password) {
            showNotification('error', `Aucun mot de passe configuré pour ${userInfo?.username}. Connexion manuelle requise.`);
            await window.electronAPI.launchRdp({ server: session.server });
            return;
        }
        showNotification('info', `Connexion RDP automatique vers ${session.server}...`);
        try {
            const result = await window.electronAPI.launchRdp({ server: session.server, username: userInfo.username, password: userInfo.password });
            if (!result.success) throw new Error(result.error);
        } catch (err) { showNotification('error', `Erreur RDP: ${err.message}`); }
    };
    
    if (isCacheLoading) {
        return <LoadingScreen type="table" rows={10} columns={7} />;
    }

    return (
        <Box sx={{ p: 2 }}>
            <PageHeader
                title="Sessions RDS"
                subtitle="Surveillance en temps réel des sessions utilisateurs"
                icon={ComputerIcon}
                stats={[
                    { label: 'Actives', value: stats.activeSessions, icon: CheckCircleIcon },
                    { label: 'Déconnectées', value: stats.disconnectedSessions, icon: CancelIcon },
                    { label: 'Serveurs', value: stats.uniqueServers, icon: DnsIcon },
                    { label: 'Utilisateurs', value: groupedSessions.length, icon: PersonIcon }
                ]}
                actions={
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <FormControlLabel control={<Switch checked={multiScreenMode} onChange={(e) => setMultiScreenMode(e.target.checked)} size="small" />} label="Multi-écrans" />
                        <Button variant="contained" startIcon={<AnnouncementIcon />} onClick={() => setDialogState({ type: 'globalMessage' })} sx={{ borderRadius: 2 }}>Message à tous</Button>
                        <Tooltip title="Forcer le rafraîchissement">
                            <span><IconButton onClick={handleRefresh} disabled={isRefreshing} color="primary">{isRefreshing ? <CircularProgress size={24} color="inherit" /> : <RefreshIcon />}</IconButton></span>
                        </Tooltip>
                    </Box>
                }
            />

            <Paper elevation={2} sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                    <Box sx={{ flexGrow: 1 }}><SearchInput value={filter} onChange={setFilter} placeholder="Rechercher un utilisateur..." fullWidth /></Box>
                    <FormControl size="small" sx={{ minWidth: 220 }}>
                        <InputLabel>Serveur</InputLabel>
                        <Select value={serverFilter} label="Serveur" onChange={(e) => setServerFilter(e.target.value)} sx={{ borderRadius: 2 }}>
                            <MenuItem value="all">Tous les serveurs</MenuItem>
                            {(config?.rds_servers || []).map(server => (<MenuItem key={server} value={server}>{server}</MenuItem>))}
                        </Select>
                    </FormControl>
                </Box>
            </Paper>

            {groupedSessions.length === 0 ? (
                <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
                    <EmptyState
                        type={filter || serverFilter !== 'all' ? 'search' : 'empty'}
                        title={filter || serverFilter !== 'all' ? 'Aucune session trouvée' : 'Aucune session active'}
                        description={filter || serverFilter !== 'all' ? 'Essayez avec d\'autres critères' : 'Les sessions apparaîtront ici.'}
                        actionLabel={filter || serverFilter !== 'all' ? 'Réinitialiser' : undefined}
                        onAction={filter || serverFilter !== 'all' ? () => { setFilter(''); setServerFilter('all'); } : undefined}
                    />
                </Paper>
            ) : (
                <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>Nom Complet</TableCell>
                                <TableCell>Utilisateur</TableCell>
                                <TableCell>Serveurs</TableCell>
                                <TableCell>État</TableCell>
                                <TableCell>Durée</TableCell>
                                <TableCell>Heure Connexion</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {groupedSessions.map(([user, userSessions]) => (
                                <GroupedUserRow
                                    key={user} user={user} sessions={userSessions}
                                    onSendMessage={(s) => setDialogState({ type: 'sendMessage', data: s })}
                                    onShowInfo={(s, ui) => setDialogState({ type: 'userInfo', data: { ...s, userInfo: ui } })}
                                    onShadow={handleLaunchShadow} onConnect={handleLaunchConnect} getUserInfo={getUserInfo}
                                />
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            {dialogState.type === 'sendMessage' && <SendMessageDialog open={true} onClose={() => setDialogState({ type: null })} selectedSessions={[`${dialogState.data.server}-${dialogState.data.sessionId}`]} sessions={sessions} />}
            {dialogState.type === 'userInfo' && <UserInfoDialog open={true} onClose={() => setDialogState({ type: null })} user={dialogState.data} />}
            {dialogState.type === 'globalMessage' && <GlobalMessageDialog open={true} onClose={() => setDialogState({ type: null })} servers={config?.rds_servers || []} />}
        </Box>
    );
};

export default SessionsPage;