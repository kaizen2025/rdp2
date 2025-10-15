// src/pages/UsersManagementPage.js - VERSION FINALE, COMPLÈTE ET CORRIGÉE

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';

// Icons
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LaunchIcon from '@mui/icons-material/Launch';
import PrintIcon from '@mui/icons-material/Print';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import LanguageIcon from '@mui/icons-material/Language';

// --- CORRECTION : IMPORT MANQUANT ---
import { useApp } from '../contexts/AppContext';
import { useCache } from '../contexts/CacheContext';
import UserDialog from '../components/UserDialog';
import PrintPreviewDialog from '../components/PrintPreviewDialog';
import UserAdActionsMenu from '../components/UserAdActionsMenu';

const debounce = (func, wait) => {
    let timeout;
    return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func(...args), wait); };
};

// --- SOUS-COMPOSANTS AMÉLIORÉS ---

const AdGroupChip = memo(({ groupKey, groupConfig, isMember, username, onMembershipChange }) => {
    const { showNotification } = useApp();
    const [isUpdating, setIsUpdating] = useState(false);

    const handleToggle = async () => {
        setIsUpdating(true);
        const action = isMember ? 'removeUserFromGroup' : 'addUserToGroup';
        try {
            const result = await window.electronAPI[action]({ username, groupName: groupKey });
            if (result.success) {
                showNotification('success', `Utilisateur ${isMember ? 'retiré de' : 'ajouté à'} ${groupConfig.description}.`);
                if (onMembershipChange) onMembershipChange();
            } else { throw new Error(result.error); }
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); } 
        finally { setIsUpdating(false); }
    };

    return (
        <Tooltip title={isMember ? `Retirer de ${groupConfig.description}` : `Ajouter à ${groupConfig.description}`}>
            <Chip
                icon={isUpdating ? <CircularProgress size={16} /> : (groupKey === 'VPN' ? <VpnKeyIcon /> : <LanguageIcon />)}
                label={groupKey === 'Sortants_responsables' ? 'Internet' : groupKey}
                color={isMember ? 'success' : 'default'}
                onClick={handleToggle}
                disabled={isUpdating}
                size="small"
                variant={isMember ? 'filled' : 'outlined'}
            />
        </Tooltip>
    );
});

const UserRow = memo(({ user, style, isOdd, onEdit, onDelete, onConnect, onPrint, onOpenAdMenu, adGroupsConfig, vpnMembers, internetMembers, onMembershipChange }) => (
    <Box 
        style={style} 
        sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            px: 2, 
            backgroundColor: isOdd ? 'action.hover' : 'inherit', 
            borderBottom: '1px solid', 
            borderColor: 'divider',
            '&:hover': { backgroundColor: 'action.selected' } 
        }}
    >
        <Box sx={{ width: '18%', pr: 2, minWidth: 160, overflow: 'hidden' }}>
            <Typography variant="body2" fontWeight={500} noWrap>{user.displayName}</Typography>
            <Typography variant="caption" color="text.secondary">{user.username}</Typography>
        </Box>
        <Box sx={{ width: '12%', pr: 2, minWidth: 100, overflow: 'hidden' }}><Typography variant="body2" noWrap>{user.department || '-'}</Typography></Box>
        <Box sx={{ width: '18%', pr: 2, minWidth: 160, overflow: 'hidden' }}>
            <Tooltip title={user.email || ''}><Typography variant="body2" noWrap>{user.email || '-'}</Typography></Tooltip>
        </Box>
        <Box sx={{ width: '15%', pr: 2, minWidth: 140, overflow: 'hidden' }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>Win: ••••••••</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>Office: ••••••••</Typography>
        </Box>
        <Box sx={{ width: '17%', display: 'flex', gap: 1, alignItems: 'center', pr: 2, minWidth: 180 }}>
            {Object.entries(adGroupsConfig).map(([key, config]) => (
                <AdGroupChip
                    key={key}
                    groupKey={key}
                    groupConfig={config}
                    isMember={key === 'VPN' ? vpnMembers.has(user.username) : internetMembers.has(user.username)}
                    username={user.username}
                    onMembershipChange={onMembershipChange}
                />
            ))}
        </Box>
        <Box sx={{ width: '20%', display: 'flex', gap: 0.5, justifyContent: 'flex-end', alignItems: 'center' }}>
            <Tooltip title="Modifier (Excel)"><IconButton size="small" onClick={() => onEdit(user)}><EditIcon fontSize="small" /></IconButton></Tooltip>
            <Tooltip title="Connexion RDP"><IconButton size="small" onClick={() => onConnect(user)}><LaunchIcon fontSize="small" /></IconButton></Tooltip>
            <Tooltip title="Imprimer Fiche"><IconButton size="small" color="info" onClick={() => onPrint(user)}><PrintIcon fontSize="small" /></IconButton></Tooltip>
            <Tooltip title="Actions Active Directory"><IconButton size="small" onClick={(e) => onOpenAdMenu(e, user)}><MoreVertIcon fontSize="small" /></IconButton></Tooltip>
            <Tooltip title="Supprimer (Excel)"><IconButton size="small" color="error" onClick={() => onDelete(user)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
        </Box>
    </Box>
));

const TableHeader = memo(() => (
    <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, backgroundColor: 'primary.main', color: 'white', borderBottom: '2px solid', borderColor: 'primary.dark' }}>
        <Box sx={{ width: '18%', pr: 2, minWidth: 160 }}><Typography variant="subtitle2" fontWeight={600}>Utilisateur</Typography></Box>
        <Box sx={{ width: '12%', pr: 2, minWidth: 100 }}><Typography variant="subtitle2" fontWeight={600}>Service</Typography></Box>
        <Box sx={{ width: '18%', pr: 2, minWidth: 160 }}><Typography variant="subtitle2" fontWeight={600}>Email</Typography></Box>
        <Box sx={{ width: '15%', pr: 2, minWidth: 140 }}><Typography variant="subtitle2" fontWeight={600}>Mots de passe</Typography></Box>
        <Box sx={{ width: '17%', pr: 2, minWidth: 180 }}><Typography variant="subtitle2" fontWeight={600}>Groupes Sécurité</Typography></Box>
        <Box sx={{ width: '20%', textAlign: 'right' }}><Typography variant="subtitle2" fontWeight={600}>Actions</Typography></Box>
    </Box>
));

const UsersManagementPage = () => {
    const { config, showNotification } = useApp();
    const { fetchWithCache, invalidate } = useCache();
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [serverFilter, setServerFilter] = useState('all');
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [userDialogOpen, setUserDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
    const [userToPrint, setUserToPrint] = useState(null);
    const [vpnMembers, setVpnMembers] = useState(new Set());
    const [internetMembers, setInternetMembers] = useState(new Set());
    const [adMenuAnchor, setAdMenuAnchor] = useState(null);
    const [selectedUserForMenu, setSelectedUserForMenu] = useState(null);

    const adGroupsConfig = useMemo(() => config?.ad_groups || {}, [config]);

    const { servers, departments } = useMemo(() => ({
        servers: [...new Set(users.map(u => u.server).filter(Boolean))].sort(),
        departments: [...new Set(users.map(u => u.department).filter(Boolean))].sort()
    }), [users]);

    const loadGroupMembers = useCallback(async (force = false) => {
        try {
            const [vpnResult, internetResult] = await Promise.all([
                fetchWithCache('adGroup:VPN', () => window.electronAPI.getAdGroupMembers('VPN'), { force }),
                fetchWithCache('adGroup:Sortants_responsables', () => window.electronAPI.getAdGroupMembers('Sortants_responsables'), { force })
            ]);
            const vpnData = vpnResult.data || [];
            const internetData = internetResult.data || [];
            setVpnMembers(new Set(Array.isArray(vpnData) ? vpnData.map(m => m.SamAccountName) : []));
            setInternetMembers(new Set(Array.isArray(internetData) ? internetData.map(m => m.SamAccountName) : []));
        } catch (error) { showNotification('error', `Erreur chargement membres AD: ${error.message}`); }
    }, [fetchWithCache, showNotification]);

    const loadUsers = useCallback(async (force = false) => {
        const loadingState = force ? setIsRefreshing : setIsLoading;
        loadingState(true);
        try {
            const { data: usersResult } = await fetchWithCache('users', () => window.electronAPI.syncExcelUsers(), { force });
            if (usersResult.success) {
                setUsers(Object.values(usersResult.users || {}).flat());
                await loadGroupMembers(force);
            } else { throw new Error(usersResult.error); }
        } catch (error) { showNotification('error', `Erreur chargement: ${error.message}`); } 
        finally { loadingState(false); }
    }, [fetchWithCache, showNotification, loadGroupMembers]);

    useEffect(() => { loadUsers(); }, [loadUsers]);

    const filteredUsers = useMemo(() => {
        let result = [...users];
        if (serverFilter !== 'all') result = result.filter(u => u.server === serverFilter);
        if (departmentFilter !== 'all') result = result.filter(u => u.department === departmentFilter);
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(u => u.username?.toLowerCase().includes(term) || u.displayName?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term));
        }
        return result;
    }, [users, searchTerm, serverFilter, departmentFilter]);

    const debouncedSetSearch = useMemo(() => debounce(setSearchTerm, 300), []);

    const handleSaveUser = async (userData) => {
        try {
            const result = await window.electronAPI.saveUserToExcel({ user: userData, isEdit: !!selectedUser });
            if (result.success) {
                showNotification('success', 'Utilisateur sauvegardé dans Excel.');
                invalidate('users');
                await loadUsers(true);
            } else throw new Error(result.error);
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); }
        setUserDialogOpen(false);
    };

    const handleDeleteUser = async (user) => {
        if (!window.confirm(`Supprimer ${user.username} du fichier Excel ?`)) return;
        try {
            const result = await window.electronAPI.deleteUserFromExcel({ username: user.username });
            if (result.success) {
                showNotification('success', 'Utilisateur supprimé d\'Excel.');
                invalidate('users');
                await loadUsers(true);
            } else throw new Error(result.error);
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); }
    };

    const handleConnectUser = (user) => {
        if (!user.server) { showNotification('warning', 'Aucun serveur associé.'); return; }
        window.electronAPI.connectWithStoredCredentials({ server: user.server, username: user.username, password: user.password });
        showNotification('info', `Tentative de connexion à ${user.server}...`);
    };

    const handlePrintUser = (user) => { setUserToPrint(user); setPrintPreviewOpen(true); };
    const clearFilters = () => { setSearchTerm(''); setServerFilter('all'); setDepartmentFilter('all'); };

    const handleOpenAdMenu = (event, user) => { setAdMenuAnchor(event.currentTarget); setSelectedUserForMenu(user); };
    const handleCloseAdMenu = () => { setAdMenuAnchor(null); };
    const handleAdActionComplete = (actionType) => { showNotification('success', `Action '${actionType}' terminée.`); handleCloseAdMenu(); loadUsers(true); };

    const Row = useCallback(({ index, style }) => {
        const user = filteredUsers[index];
        if (!user) return null;
        return <UserRow user={user} style={style} isOdd={index % 2 === 1} onEdit={(u) => { setSelectedUser(u); setUserDialogOpen(true); }} onDelete={handleDeleteUser} onConnect={handleConnectUser} onPrint={handlePrintUser} onOpenAdMenu={handleOpenAdMenu} adGroupsConfig={adGroupsConfig} vpnMembers={vpnMembers} internetMembers={internetMembers} onMembershipChange={() => loadGroupMembers(true)} />;
    }, [filteredUsers, vpnMembers, internetMembers, adGroupsConfig, loadGroupMembers]);

    return (
        <Box sx={{ p: 2, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
            {isRefreshing && <LinearProgress />}
            <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5">Gestion des Utilisateurs</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => { setSelectedUser(null); setUserDialogOpen(true); }}>Ajouter (Excel)</Button>
                        <Tooltip title="Actualiser"><IconButton onClick={() => loadUsers(true)} disabled={isRefreshing}>{isRefreshing ? <CircularProgress size={24} /> : <RefreshIcon />}</IconButton></Tooltip>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TextField size="small" placeholder="Rechercher..." onChange={(e) => debouncedSetSearch(e.target.value)} sx={{ minWidth: 300 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
                    <FormControl size="small" sx={{ minWidth: 180 }}><InputLabel>Serveur</InputLabel><Select value={serverFilter} label="Serveur" onChange={(e) => setServerFilter(e.target.value)}><MenuItem value="all">Tous</MenuItem>{servers.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</Select></FormControl>
                    <FormControl size="small" sx={{ minWidth: 180 }}><InputLabel>Service</InputLabel><Select value={departmentFilter} label="Service" onChange={(e) => setDepartmentFilter(e.target.value)}><MenuItem value="all">Tous</MenuItem>{departments.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}</Select></FormControl>
                    {(searchTerm || serverFilter !== 'all' || departmentFilter !== 'all') && <Button size="small" startIcon={<ClearIcon />} onClick={clearFilters}>Effacer</Button>}
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>{filteredUsers.length} / {users.length} affiché(s)</Typography>
                </Box>
            </Paper>
            <Paper elevation={3} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <TableHeader />
                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                    {isLoading ? <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box> : 
                    <AutoSizer>{({ height, width }) => (<List height={height} itemCount={filteredUsers.length} itemSize={85} width={width} overscanCount={10} itemKey={index => filteredUsers[index].username}>{Row}</List>)}</AutoSizer>}
                </Box>
            </Paper>
            {userDialogOpen && <UserDialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} user={selectedUser} onSave={handleSaveUser} servers={servers} />}
            {printPreviewOpen && <PrintPreviewDialog open={printPreviewOpen} onClose={() => setPrintPreviewOpen(false)} user={userToPrint} />}
            {selectedUserForMenu && <UserAdActionsMenu anchorEl={adMenuAnchor} onClose={handleCloseAdMenu} user={selectedUserForMenu} onActionComplete={handleAdActionComplete} />}
        </Box>
    );
};

export default memo(UsersManagementPage);