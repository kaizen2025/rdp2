// src/pages/SessionsPage.js - VERSION FINALE AVEC CORRECTION D'IMPORT ET APPEL API

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Alert, TextField, Chip, Tooltip, IconButton, FormControl, InputLabel, Select, MenuItem, InputAdornment, Switch, FormControlLabel, Dialog, DialogContent, DialogTitle, LinearProgress } from '@mui/material'; // Ajout de LinearProgress
import { Person as PersonIcon, Dns as DnsIcon, Timer as TimerIcon, VpnKey as VpnKeyIcon, ScreenShare as ScreenShareIcon, Computer as ComputerIcon, Message as MessageIcon, Info as InfoIcon, Refresh as RefreshIcon, Announcement as AnnouncementIcon, CheckCircle as CheckCircleIcon, RadioButtonUnchecked as RadioButtonUncheckedIcon, Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';

import { useApp } from '../contexts/AppContext';
import apiService from '../services/apiService';
import SendMessageDialog from '../components/SendMessageDialog';
import UserInfoDialog from '../components/UserInfoDialog';
import GlobalMessageDialog from '../components/GlobalMessageDialog';
import GuacamoleViewer from '../components/GuacamoleViewer';

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
            <TableCell>{userInfo?.displayName || user}</TableCell>
            <TableCell><Typography variant="body2" fontWeight="bold">{user}</Typography></TableCell>
            <TableCell><Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>{serverList.map(s => <Chip key={s} label={s} size="small" />)}</Box></TableCell>
            <TableCell><Chip label={isActive ? 'Actif' : 'Déconnecté'} color={isActive ? 'success' : 'default'} size="small" icon={isActive ? <CheckCircleIcon/> : <RadioButtonUncheckedIcon/>} /></TableCell>
            <TableCell><Box sx={{display: 'flex', alignItems: 'center'}}><TimerIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }}/>{sessionDuration}</Box></TableCell>
            <TableCell>{oldestSession ? new Date(oldestSession.logonTime).toLocaleString('fr-FR') : 'N/A'}</TableCell>
            <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Tooltip title={isActive ? "Shadow - Prise en main directe" : "Session inactive"}>
                        <span><IconButton size="small" onClick={() => onShadow(mainSession, userInfo)} color="primary" disabled={!isActive}><ScreenShareIcon /></IconButton></span>
                    </Tooltip>
                    <Tooltip title="Connexion RDP directe">
                        <span><IconButton size="small" onClick={() => onConnect(mainSession, userInfo)} color="success"><ComputerIcon /></IconButton></span>
                    </Tooltip>
                    <Tooltip title={isActive ? "Envoyer un message" : "Session inactive"}>
                        <span><IconButton size="small" onClick={() => onSendMessage(mainSession)} color="info" disabled={!isActive}><MessageIcon /></IconButton></span>
                    </Tooltip>
                    {userInfo && (
                        <Tooltip title="Fiche utilisateur">
                            <IconButton size="small" onClick={() => onShowInfo(mainSession, userInfo)} color="secondary"><InfoIcon /></IconButton>
                        </Tooltip>
                    )}
                </Box>
            </TableCell>
        </TableRow>
    );
});

const SessionsPage = () => {
    const { config, showNotification, events } = useApp();
    const [sessions, setSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [users, setUsers] = useState({});
    const [filter, setFilter] = useState('');
    const [serverFilter, setServerFilter] = useState('all');
    const [dialogState, setDialogState] = useState({ type: null, data: null });
    const [multiScreenMode, setMultiScreenMode] = useState(false);
    const [guacamoleConfig, setGuacamoleConfig] = useState(null);

    const loadData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setIsRefreshing(true); else setIsLoading(true);
        setError('');
        try {
            const sessionsData = await apiService.getRdsSessions();
            setSessions(Array.isArray(sessionsData) ? sessionsData : []);

            // Charger les données Excel séparément pour mieux gérer les erreurs
            try {
                const usersData = await apiService.getExcelUsers();
                if (usersData.success) {
                    setUsers(usersData.users || {});
                } else {
                    // Si le backend signale une erreur (ex: fichier non trouvé), l'afficher.
                    const excelError = usersData.error || "Le fichier Excel n'a pas pu être chargé.";
                    setError(`Erreur de données utilisateur : ${excelError}`);
                    showNotification('warning', excelError);
                    setUsers({}); // S'assurer que les anciennes données sont effacées.
                }
            } catch (excelErr) {
                setError(`Erreur critique lors du chargement des données Excel: ${excelErr.message}`);
                showNotification('error', `Erreur Excel: ${excelErr.message}`);
                setUsers({});
            }

        } catch (err) {
            setError(`Erreur de chargement des sessions : ${err.message}`);
            showNotification('error', `Erreur sessions: ${err.message}`);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [showNotification]);

    useEffect(() => {
        loadData();
        const unsubscribe = events.on('data_updated:rds_sessions', () => loadData(true));
        return unsubscribe;
    }, [loadData, events]);

    const getUserInfo = useCallback((username) => {
        for (const serverUsers of Object.values(users)) {
            const user = serverUsers.find(u => u.username === username);
            if (user) return user;
        }
        return null;
    }, [users]);

    const groupedSessions = useMemo(() => {
        const validSessions = sessions.filter(s => s && s.username && (serverFilter === 'all' || s.server === serverFilter));
        const grouped = validSessions.reduce((acc, s) => { (acc[s.username] = acc[s.username] || []).push(s); return acc; }, {});
        return Object.entries(grouped).filter(([user]) => !filter || user.toLowerCase().includes(filter.toLowerCase()) || (getUserInfo(user)?.displayName || '').toLowerCase().includes(filter.toLowerCase()));
    }, [sessions, filter, serverFilter, getUserInfo]);
    
    const handleLaunchGuacamole = async (type, session, userInfo) => {
        if (!session) return;
        setIsLoading(true);
        try {
            const payload = {
                server: session.server,
                username: userInfo?.username || session.username,
                password: userInfo?.password,
                sessionId: type === 'shadow' ? session.sessionId : null,
                multiScreen: multiScreenMode,
            };
            const response = await apiService.createGuacamoleConnection(payload);
            setGuacamoleConfig({
                token: response.token,
                url: response.url,
                title: `${type === 'shadow' ? 'Shadow' : 'Connexion'}: ${session.username} sur ${session.server}`
            });
        } catch (err) {
            showNotification('error', `Impossible de lancer la session: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Box sx={{ p: 2, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
            {isRefreshing && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }} />}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5">Sessions RDS ({sessions.length})</Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <FormControlLabel control={<Switch checked={multiScreenMode} onChange={(e) => setMultiScreenMode(e.target.checked)} size="small" />} label="Multi-écrans" />
                        <Button variant="outlined" startIcon={<AnnouncementIcon />} onClick={() => setDialogState({ type: 'globalMessage' })}>Message à tous</Button>
                        <Tooltip title="Forcer le rafraîchissement"><span><IconButton onClick={() => loadData(true)} disabled={isRefreshing}>{isRefreshing ? <CircularProgress size={24} /> : <RefreshIcon />}</IconButton></span></Tooltip>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField label="Rechercher..." size="small" value={filter} onChange={(e) => setFilter(e.target.value)} sx={{flexGrow: 1}} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }} />
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Serveur</InputLabel>
                        <Select value={serverFilter} label="Serveur" onChange={(e) => setServerFilter(e.target.value)}>
                            <MenuItem value="all">Tous les serveurs</MenuItem>
                            {(config?.rds_servers || []).map(server => (<MenuItem key={server} value={server}>{server}</MenuItem>))}
                        </Select>
                    </FormControl>
                    <Typography variant="body2" color="text.secondary">{groupedSessions.length} utilisateur(s)</Typography>
                </Box>
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            </Paper>
            <TableContainer component={Paper} sx={{ flex: 1, position: 'relative' }}>
                {(isLoading && !isRefreshing) && <Box sx={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.5)', zIndex: 2}}><CircularProgress /></Box>}
                <Table size="small" stickyHeader>
                    <TableHead><TableRow><TableCell sx={{ width: '16%' }}><PersonIcon sx={{ verticalAlign: 'bottom', mr: 0.5 }}/>Nom Complet</TableCell><TableCell sx={{ width: '12%' }}><VpnKeyIcon sx={{ verticalAlign: 'bottom', mr: 0.5 }}/>Utilisateur</TableCell><TableCell sx={{ width: '13%' }}><DnsIcon sx={{ verticalAlign: 'bottom', mr: 0.5 }}/>Serveurs</TableCell><TableCell sx={{ width: '10%' }}>État</TableCell><TableCell sx={{ width: '11%' }}><TimerIcon sx={{ verticalAlign: 'bottom', mr: 0.5 }}/>Durée</TableCell><TableCell sx={{ width: '14%' }}>Heure Connexion</TableCell><TableCell sx={{ width: '14%' }}>Actions</TableCell></TableRow></TableHead>
                    <TableBody>
                         {groupedSessions.length === 0 && !isLoading ? (<TableRow><TableCell colSpan={7} align="center" sx={{ p: 4 }}><Typography color="text.secondary">Aucune session à afficher.</Typography></TableCell></TableRow>) :
                         (groupedSessions.map(([user, userSessions]) => (<GroupedUserRow key={user} user={user} sessions={userSessions} onSendMessage={(s) => setDialogState({ type: 'sendMessage', data: s })} onShowInfo={(s, ui) => setDialogState({ type: 'userInfo', data: { ...s, userInfo: ui } })} onShadow={handleLaunchGuacamole.bind(null, 'shadow')} onConnect={handleLaunchGuacamole.bind(null, 'connect')} getUserInfo={getUserInfo} />)))}
                    </TableBody>
                </Table>
            </TableContainer>
            {dialogState.type === 'sendMessage' && <SendMessageDialog open={true} onClose={() => setDialogState({ type: null })} selectedSessions={[`${dialogState.data.server}-${dialogState.data.sessionId}`]} sessions={sessions} />}
            {dialogState.type === 'userInfo' && <UserInfoDialog open={true} onClose={() => setDialogState({ type: null })} user={dialogState.data} />}
            {dialogState.type === 'globalMessage' && <GlobalMessageDialog open={true} onClose={() => setDialogState({ type: null })} servers={config?.rds_servers || []} />}
            <Dialog fullScreen open={!!guacamoleConfig} onClose={() => setGuacamoleConfig(null)}>
                <DialogTitle sx={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>{guacamoleConfig?.title}<IconButton onClick={() => setGuacamoleConfig(null)}><CloseIcon /></IconButton></DialogTitle>
                <DialogContent sx={{ p: 0, overflow: 'hidden' }}>{guacamoleConfig?.token && <GuacamoleViewer token={guacamoleConfig.token} url={guacamoleConfig.url} />}</DialogContent>
            </Dialog>
        </Box>
    );
};

export default SessionsPage;