// src/pages/SessionsPage.js - VERSION MODERNISÉE AVEC NOUVEAUX COMPOSANTS

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Alert, Chip, Tooltip, IconButton, FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel, LinearProgress } from '@mui/material';
import { Person as PersonIcon, Dns as DnsIcon, Timer as TimerIcon, VpnKey as VpnKeyIcon, ScreenShare as ScreenShareIcon, Computer as ComputerIcon, Message as MessageIcon, Info as InfoIcon, Refresh as RefreshIcon, Announcement as AnnouncementIcon, CheckCircle as CheckCircleIcon, RadioButtonUnchecked as RadioButtonUncheckedIcon, Cancel as CancelIcon } from '@mui/icons-material';

import { useApp } from '../contexts/AppContext';
import apiService from '../services/apiService';
import SendMessageDialog from '../components/SendMessageDialog';
import UserInfoDialog from '../components/UserInfoDialog';
import GlobalMessageDialog from '../components/GlobalMessageDialog';

// Nouveaux composants modernes
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
                    <Tooltip title={isActive ? "Shadow - Prise en main directe (app bureau)" : "Session inactive"}>
                        <span><IconButton size="small" onClick={() => onShadow(mainSession)} color="primary" disabled={!isActive || !window.electronAPI}><ScreenShareIcon /></IconButton></span>
                    </Tooltip>
                    <Tooltip title="Connexion RDP directe (app bureau)">
                        <span><IconButton size="small" onClick={() => onConnect(mainSession)} color="success" disabled={!window.electronAPI}><ComputerIcon /></IconButton></span>
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

    const loadData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setIsRefreshing(true); else setIsLoading(true);
        setError('');
        try {
            const [sessionsData, usersData] = await Promise.all([
                apiService.getRdsSessions(),
                apiService.getExcelUsers()
            ]);

            setSessions(Array.isArray(sessionsData) ? sessionsData : []);

            if (usersData.success && usersData.users) {
                setUsers(usersData.users);
            } else {
                const excelError = usersData.error || "Le fichier Excel n'a pas pu être chargé.";
                setError(`Erreur de données utilisateur : ${excelError}`);
                showNotification('warning', excelError);
                setUsers({});
            }
        } catch (err) {
            setError(`Erreur de chargement des données : ${err.message}`);
            showNotification('error', `Erreur de chargement: ${err.message}`);
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
        if (!users || typeof users !== 'object') return null;
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

    // Statistiques pour le PageHeader
    const stats = useMemo(() => {
        const activeSessions = sessions.filter(s => s.isActive).length;
        const disconnectedSessions = sessions.length - activeSessions;
        const uniqueServers = [...new Set(sessions.map(s => s.server))].length;
        return { activeSessions, disconnectedSessions, uniqueServers };
    }, [sessions]);

    const handleLaunchShadow = async (session) => {
        if (!window.electronAPI?.launchRdp) {
            showNotification('warning', 'Le mode Shadow est uniquement disponible dans l\'application de bureau.');
            return;
        }
        if (!session || !session.isActive) {
            showNotification('warning', 'La session doit être active pour utiliser le mode Shadow.');
            return;
        }
        showNotification('info', `Lancement du mode Shadow pour ${session.username} sur ${session.server}...`);
        try {
            const result = await window.electronAPI.launchRdp({ server: session.server, sessionId: session.sessionId });
            if (!result.success) throw new Error(result.error);
        } catch (err) { showNotification('error', `Erreur Shadow: ${err.message}`); }
    };

    const handleLaunchConnect = async (session) => {
        if (!window.electronAPI?.launchRdp) {
            showNotification('warning', 'La connexion RDP directe est uniquement disponible dans l\'application de bureau.');
            return;
        }
        if (!session) return;
        showNotification('info', `Lancement de la connexion RDP vers ${session.server}...`);
        try {
            const result = await window.electronAPI.launchRdp({ server: session.server });
            if (!result.success) throw new Error(result.error);
        } catch (err) { showNotification('error', `Erreur RDP: ${err.message}`); }
    };
    
    return (
        <Box sx={{ p: 2 }}>
            {isRefreshing && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }} />}

            {/* Header Moderne */}
            <PageHeader
                title="Sessions RDS"
                subtitle={`Surveillance en temps réel des sessions utilisateurs`}
                icon={ComputerIcon}
                stats={[
                    {
                        label: 'Sessions actives',
                        value: stats.activeSessions,
                        icon: CheckCircleIcon
                    },
                    {
                        label: 'Déconnectées',
                        value: stats.disconnectedSessions,
                        icon: CancelIcon
                    },
                    {
                        label: 'Serveurs',
                        value: stats.uniqueServers,
                        icon: DnsIcon
                    },
                    {
                        label: 'Utilisateurs',
                        value: groupedSessions.length,
                        icon: PersonIcon
                    }
                ]}
                actions={
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={multiScreenMode}
                                    onChange={(e) => setMultiScreenMode(e.target.checked)}
                                    size="small"
                                />
                            }
                            label="Multi-écrans"
                        />
                        <Button
                            variant="contained"
                            startIcon={<AnnouncementIcon />}
                            onClick={() => setDialogState({ type: 'globalMessage' })}
                            sx={{ borderRadius: 2 }}
                        >
                            Message à tous
                        </Button>
                        <Tooltip title="Forcer le rafraîchissement">
                            <span>
                                <IconButton
                                    onClick={() => loadData(true)}
                                    disabled={isRefreshing}
                                    color="primary"
                                    sx={{
                                        bgcolor: 'primary.lighter',
                                        '&:hover': { bgcolor: 'primary.light' }
                                    }}
                                >
                                    {isRefreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Box>
                }
            />

            {/* Filtres */}
            <Paper elevation={2} sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                    <Box sx={{ flexGrow: 1 }}>
                        <SearchInput
                            value={filter}
                            onChange={setFilter}
                            placeholder="Rechercher un utilisateur ou une session..."
                            fullWidth
                        />
                    </Box>
                    <FormControl size="small" sx={{ minWidth: 220 }}>
                        <InputLabel>Serveur</InputLabel>
                        <Select
                            value={serverFilter}
                            label="Serveur"
                            onChange={(e) => setServerFilter(e.target.value)}
                            sx={{ borderRadius: 2 }}
                        >
                            <MenuItem value="all">Tous les serveurs</MenuItem>
                            {(config?.rds_servers || []).map(server => (
                                <MenuItem key={server} value={server}>{server}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
                {error && <Alert severity="error" sx={{ mt: 2, borderRadius: 1 }}>{error}</Alert>}
            </Paper>
            {/* Table avec Loading et Empty States */}
            {isLoading && !isRefreshing ? (
                <LoadingScreen type="table" rows={10} columns={7} />
            ) : groupedSessions.length === 0 ? (
                <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
                    <EmptyState
                        type={filter || serverFilter !== 'all' ? 'search' : 'empty'}
                        title={filter || serverFilter !== 'all' ? 'Aucune session trouvée' : 'Aucune session active'}
                        description={
                            filter || serverFilter !== 'all'
                                ? 'Essayez avec d\'autres critères de recherche'
                                : 'Les sessions RDS apparaîtront ici une fois les utilisateurs connectés'
                        }
                        actionLabel={filter || serverFilter !== 'all' ? 'Réinitialiser les filtres' : undefined}
                        onAction={
                            filter || serverFilter !== 'all'
                                ? () => {
                                      setFilter('');
                                      setServerFilter('all');
                                  }
                                : undefined
                        }
                    />
                </Paper>
            ) : (
                <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ width: '16%', fontWeight: 600 }}>
                                    <PersonIcon sx={{ verticalAlign: 'bottom', mr: 0.5 }} />
                                    Nom Complet
                                </TableCell>
                                <TableCell sx={{ width: '12%', fontWeight: 600 }}>
                                    <VpnKeyIcon sx={{ verticalAlign: 'bottom', mr: 0.5 }} />
                                    Utilisateur
                                </TableCell>
                                <TableCell sx={{ width: '13%', fontWeight: 600 }}>
                                    <DnsIcon sx={{ verticalAlign: 'bottom', mr: 0.5 }} />
                                    Serveurs
                                </TableCell>
                                <TableCell sx={{ width: '10%', fontWeight: 600 }}>État</TableCell>
                                <TableCell sx={{ width: '11%', fontWeight: 600 }}>
                                    <TimerIcon sx={{ verticalAlign: 'bottom', mr: 0.5 }} />
                                    Durée
                                </TableCell>
                                <TableCell sx={{ width: '14%', fontWeight: 600 }}>Heure Connexion</TableCell>
                                <TableCell sx={{ width: '14%', fontWeight: 600 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {groupedSessions.map(([user, userSessions]) => (
                                <GroupedUserRow
                                    key={user}
                                    user={user}
                                    sessions={userSessions}
                                    onSendMessage={(s) => setDialogState({ type: 'sendMessage', data: s })}
                                    onShowInfo={(s, ui) => setDialogState({ type: 'userInfo', data: { ...s, userInfo: ui } })}
                                    onShadow={handleLaunchShadow}
                                    onConnect={handleLaunchConnect}
                                    getUserInfo={getUserInfo}
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