// src/pages/UsersManagementPage.js - VERSION FINALE, SANS IMPORT EN DOUBLE

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
import Chip from '@mui/material/Chip';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';

// Icons
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LaunchIcon from '@mui/icons-material/Launch';
import PrintIcon from '@mui/icons-material/Print';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import LanguageIcon from '@mui/icons-material/Language';

// Import des contextes et services
import { useApp } from '../contexts/AppContext'; // Import unique et correct
import { useCache } from '../contexts/CacheContext';
import apiService from '../services/apiService';

// Import des composants enfants
import UserDialog from '../components/UserDialog';
import PrintPreviewDialog from '../components/PrintPreviewDialog';
import AdActionsDialog from '../components/AdActionsDialog';

const debounce = (func, wait) => {
    let timeout;
    return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func(...args), wait); };
};

const CopyableText = memo(({ text, display, maxLength = 30 }) => {
    const [copied, setCopied] = useState(false);
    const displayText = display || text || '-';
    const truncated = displayText.length > maxLength ? `${displayText.substring(0, maxLength)}...` : displayText;

    const copyToClipboard = useCallback(async () => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (err) { console.error('Erreur copie:', err); }
    }, [text]);

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="body2" sx={{ cursor: 'pointer' }} title={text} onClick={copyToClipboard}>{truncated}</Typography>
            <Tooltip title={copied ? 'Copié!' : 'Copier'}>
                <IconButton size="small" onClick={copyToClipboard} sx={{ p: 0.2 }}>
                    {copied ? <CheckCircleIcon fontSize="small" color="success" /> : <ContentCopyIcon sx={{ fontSize: '14px' }} />}
                </IconButton>
            </Tooltip>
        </Box>
    );
});

const PasswordCompact = memo(({ password }) => {
    const [isVisible, setIsVisible] = useState(false);
    if (!password) return <Typography variant="caption" color="text.secondary">-</Typography>;
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{isVisible ? password : '••••••••'}</Typography>
            <Tooltip title={isVisible ? 'Masquer' : 'Afficher'}>
                <IconButton size="small" onClick={() => setIsVisible(!isVisible)} sx={{ p: 0.1 }}>
                    {isVisible ? <VisibilityOff sx={{ fontSize: '12px' }} /> : <Visibility sx={{ fontSize: '12px' }} />}
                </IconButton>
            </Tooltip>
            <CopyableText text={password} display="" />
        </Box>
    );
});

const AdGroupBadge = memo(({ groupName, isMember, onToggle, isLoading }) => {
    const isVpn = groupName === 'VPN';
    const icon = isVpn ? <VpnKeyIcon sx={{ fontSize: '14px' }} /> : <LanguageIcon sx={{ fontSize: '14px' }} />;
    const displayName = isVpn ? 'VPN' : 'INT';
    const chip = (
        <Chip
            size="small"
            icon={isLoading ? <CircularProgress size={14} /> : icon}
            label={displayName}
            color={isMember ? (isVpn ? 'primary' : 'success') : 'default'}
            variant={isMember ? 'filled' : 'outlined'}
            onClick={onToggle}
            disabled={isLoading}
            sx={{ height: 22, fontSize: '10px', fontWeight: 700 }}
        />
    );
    return <Tooltip title={`${isMember ? 'Retirer de' : 'Ajouter à'} ${groupName}`}>{chip}</Tooltip>;
});

const UserRow = memo(({ user, style, isOdd, onEdit, onDelete, onConnect, onPrint, onOpenAdMenu, vpnMembers, internetMembers, onMembershipChange }) => {
    const { showNotification } = useApp();
    const [isUpdatingVpn, setIsUpdatingVpn] = useState(false);
    const [isUpdatingInternet, setIsUpdatingInternet] = useState(false);

    const toggleGroup = useCallback(async (group, isMember, setLoading) => {
        setLoading(true);
        try {
            const action = isMember ? apiService.removeUserFromGroup : apiService.addUserToGroup;
            await action(user.username, group);
            showNotification('success', `${user.username} ${isMember ? 'retiré de' : 'ajouté à'} ${group}`);
            onMembershipChange();
        } catch (error) {
            showNotification('error', `Erreur: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [user.username, onMembershipChange, showNotification]);

    return (
        <Box style={style} sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, backgroundColor: isOdd ? 'grey.50' : 'white', borderBottom: '1px solid #e0e0e0', '&:hover': { backgroundColor: 'action.hover' }, gap: 2 }}>
            <Box sx={{ flex: '1 1 150px', minWidth: 120 }}>
                <Typography variant="body2" fontWeight="bold">{user.displayName}</Typography>
                <CopyableText text={user.username} display={user.username} />
            </Box>
            <Box sx={{ flex: '0.8 1 100px', minWidth: 80 }}><Typography variant="body2">{user.department || '-'}</Typography></Box>
            <Box sx={{ flex: '1.2 1 180px', minWidth: 150 }}><CopyableText text={user.email} display={user.email} /></Box>
            <Box sx={{ flex: '1 1 160px', minWidth: 140, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <PasswordCompact password={user.password} />
                <PasswordCompact password={user.officePassword} />
            </Box>
            <Box sx={{ flex: '1 1 120px', minWidth: 100, display: 'flex', gap: 1 }}>
                <AdGroupBadge groupName="VPN" isMember={vpnMembers.has(user.username)} onToggle={() => toggleGroup('VPN', vpnMembers.has(user.username), setIsUpdatingVpn)} isLoading={isUpdatingVpn} />
                <AdGroupBadge groupName="Sortants_responsables" isMember={internetMembers.has(user.username)} onToggle={() => toggleGroup('Sortants_responsables', internetMembers.has(user.username), setIsUpdatingInternet)} isLoading={isUpdatingInternet} />
            </Box>
            <Box sx={{ flex: '0 0 auto', display: 'flex' }}>
                <Tooltip title="Connexion RDP (non disponible en web)"><IconButton size="small" onClick={() => onConnect(user)} disabled><LaunchIcon /></IconButton></Tooltip>
                <Tooltip title="Éditer (Excel)"><IconButton size="small" onClick={() => onEdit(user)}><EditIcon /></IconButton></Tooltip>
                <Tooltip title="Imprimer Fiche"><IconButton size="small" onClick={() => onPrint(user)}><PrintIcon /></IconButton></Tooltip>
                <Tooltip title="Actions AD"><IconButton size="small" onClick={(e) => onOpenAdMenu(e, user)}><MoreVertIcon /></IconButton></Tooltip>
                <Tooltip title="Supprimer (Excel)"><IconButton size="small" onClick={() => onDelete(user)}><DeleteIcon color="error" /></IconButton></Tooltip>
            </Box>
        </Box>
    );
});

const UsersManagementPage = () => {
    const { showNotification, events } = useApp();
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
    const [adDialogOpen, setAdDialogOpen] = useState(false);
    const [selectedUserForAd, setSelectedUserForAd] = useState(null);
    const [updateAvailable, setUpdateAvailable] = useState(false);

    const { servers, departments } = useMemo(() => ({
        servers: [...new Set(users.map(u => u.server).filter(Boolean))].sort(),
        departments: [...new Set(users.map(u => u.department).filter(Boolean))].sort()
    }), [users]);

    const loadGroupMembers = useCallback(async (force = false) => {
        try {
            const { data: vpn } = await fetchWithCache('adGroup:VPN', () => apiService.getAdGroupMembers('VPN'), { force });
            const { data: internet } = await fetchWithCache('adGroup:Sortants_responsables', () => apiService.getAdGroupMembers('Sortants_responsables'), { force });
            setVpnMembers(new Set((vpn || []).map(m => m.SamAccountName)));
            setInternetMembers(new Set((internet || []).map(m => m.SamAccountName)));
        } catch (error) { 
            console.error('Erreur chargement groupes:', error.message);
            showNotification('error', `Erreur chargement groupes: ${error.message}`);
        }
    }, [fetchWithCache, showNotification]);

    const loadUsers = useCallback(async (force = false) => {
        try {
            const { data } = await fetchWithCache('excel_users', apiService.getExcelUsers, { force });
            if (data?.success) {
                setUsers(Object.values(data.users || {}).flat());
            } else {
                setUsers([]);
                showNotification('error', data?.error || 'Impossible de charger les utilisateurs Excel.');
            }
        } catch (error) { 
            showNotification('error', `Erreur chargement utilisateurs: ${error.message}`); 
        }
    }, [fetchWithCache, showNotification]);

    const handleRefresh = useCallback(async (force = true) => {
        setIsRefreshing(true);
        try {
            if (force) {
                invalidate('excel_users');
                invalidate('adGroup:VPN');
                invalidate('adGroup:Sortants_responsables');
            }
            await Promise.all([loadUsers(force), loadGroupMembers(force)]);
        } finally {
            setIsRefreshing(false);
        }
    }, [loadUsers, loadGroupMembers, invalidate]);

    useEffect(() => {
        setIsLoading(true);
        handleRefresh(false).finally(() => setIsLoading(false));

        const onUsersUpdated = () => setUpdateAvailable(true);
        const unsubscribe = events.on('data_updated:excel_users', onUsersUpdated);
        return unsubscribe;
    }, [handleRefresh, events]);

    const filteredUsers = useMemo(() => {
        let result = users;
        if (serverFilter !== 'all') result = result.filter(u => u.server === serverFilter);
        if (departmentFilter !== 'all') result = result.filter(u => u.department === departmentFilter);
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(u => Object.values(u).some(val => String(val).toLowerCase().includes(term)));
        }
        return result;
    }, [users, searchTerm, serverFilter, departmentFilter]);

    const debouncedSetSearch = useMemo(() => debounce(setSearchTerm, 300), []);

    const handleSaveUser = async (userData) => {
        try {
            await apiService.saveUserToExcel({ user: userData, isEdit: !!selectedUser });
            showNotification('success', 'Utilisateur sauvegardé.');
            await handleRefresh(true);
            setUserDialogOpen(false);
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); }
    };

    const handleDeleteUser = async (user) => {
        if (!window.confirm(`Supprimer ${user.displayName} du fichier Excel ?`)) return;
        try {
            await apiService.deleteUserFromExcel(user.username);
            showNotification('success', 'Utilisateur supprimé.');
            await handleRefresh(true);
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); }
    };

    const handleConnectUser = (user) => {
        showNotification('info', 'La connexion RDP directe depuis le web n\'est pas possible.');
    };

    const Row = useCallback(({ index, style }) => (
        <UserRow
            user={filteredUsers[index]} style={style} isOdd={index % 2 === 1}
            onEdit={u => { setSelectedUser(u); setUserDialogOpen(true); }}
            onDelete={handleDeleteUser} onConnect={handleConnectUser}
            onPrint={u => { setUserToPrint(u); setPrintPreviewOpen(true); }}
            onOpenAdMenu={(e, u) => { setSelectedUserForAd(u); setAdDialogOpen(true); }}
            vpnMembers={vpnMembers} internetMembers={internetMembers}
            onMembershipChange={() => handleRefresh(true)}
        />
    ), [filteredUsers, vpnMembers, internetMembers, handleRefresh, handleDeleteUser, handleConnectUser]);

    return (
        <Box sx={{ p: 2, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {isRefreshing && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }} />}
            <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" fontWeight="bold">Gestion des Utilisateurs</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => { setSelectedUser(null); setUserDialogOpen(true); }}>Ajouter</Button>
                        <Tooltip title="Actualiser"><span><IconButton onClick={() => handleRefresh(true)} disabled={isRefreshing}><RefreshIcon /></IconButton></span></Tooltip>
                    </Box>
                </Box>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}><TextField fullWidth size="small" placeholder="Rechercher..." onChange={e => debouncedSetSearch(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} /></Grid>
                    <Grid item xs={6} sm={2}><FormControl fullWidth size="small"><InputLabel>Serveur</InputLabel><Select value={serverFilter} label="Serveur" onChange={e => setServerFilter(e.target.value)}><MenuItem value="all">Tous</MenuItem>{servers.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</Select></FormControl></Grid>
                    <Grid item xs={6} sm={2}><FormControl fullWidth size="small"><InputLabel>Service</InputLabel><Select value={departmentFilter} label="Service" onChange={e => setDepartmentFilter(e.target.value)}><MenuItem value="all">Tous</MenuItem>{departments.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}</Select></FormControl></Grid>
                    <Grid item xs={12} sm={2}><Button fullWidth size="small" startIcon={<ClearIcon />} onClick={() => { setSearchTerm(''); setServerFilter('all'); setDepartmentFilter('all'); }}>Réinitialiser</Button></Grid>
                    <Grid item xs={12} sm={2} sx={{ textAlign: 'right' }}><Typography variant="body2" color="text.secondary">{filteredUsers.length} / {users.length} affichés</Typography></Grid>
                </Grid>
            </Paper>
            <Paper elevation={2} sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Box sx={{ px: 2, py: 1.5, backgroundColor: 'primary.main', color: 'white', display: 'flex', gap: 2, fontWeight: 'bold' }}>
                    <Box sx={{ flex: '1 1 150px' }}>Utilisateur</Box><Box sx={{ flex: '0.8 1 100px' }}>Service</Box><Box sx={{ flex: '1.2 1 180px' }}>Email</Box><Box sx={{ flex: '1 1 160px' }}>Mots de passe</Box><Box sx={{ flex: '1 1 120px' }}>Groupes</Box><Box sx={{ flex: '0 0 auto' }}>Actions</Box>
                </Box>
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                    {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box> :
                     !filteredUsers.length ? <Typography sx={{ p: 4, textAlign: 'center' }}>Aucun utilisateur trouvé.</Typography> :
                     <AutoSizer>{({ height, width }) => <List height={height} width={width} itemCount={filteredUsers.length} itemSize={70} itemKey={i => filteredUsers[i].username}>{Row}</List>}</AutoSizer>}
                </Box>
            </Paper>
            {userDialogOpen && <UserDialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} user={selectedUser} onSave={handleSaveUser} servers={servers} />}
            {printPreviewOpen && <PrintPreviewDialog open={printPreviewOpen} onClose={() => setPrintPreviewOpen(false)} user={userToPrint} />}
            {selectedUserForAd && <AdActionsDialog open={adDialogOpen} onClose={() => setAdDialogOpen(false)} user={selectedUserForAd} onActionComplete={() => handleRefresh(true)} />}
            <Snackbar open={updateAvailable} autoHideDuration={10000} onClose={() => setUpdateAvailable(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
                <Alert severity="info" action={<Button color="inherit" size="small" onClick={() => { handleRefresh(true); setUpdateAvailable(false); }}>Recharger</Button>}>La liste des utilisateurs a été mise à jour.</Alert>
            </Snackbar>
        </Box>
    );
};

export default memo(UsersManagementPage);