// src/pages/UsersManagementPage.js - VERSION FINALE CORRIGÉE ET AMÉLIORÉE

import React, { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { Box, Paper, Typography, Button, IconButton, Tooltip, CircularProgress, FormControl, InputLabel, Select, MenuItem, Chip, Grid, Checkbox } from '@mui/material';
import { PersonAdd as PersonAddIcon, Refresh as RefreshIcon, Clear as ClearIcon, Edit as EditIcon, Delete as DeleteIcon, Print as PrintIcon, VpnKey as VpnKeyIcon, Language as LanguageIcon, Settings as SettingsIcon, Person as PersonIcon, Dns as DnsIcon, Login as LoginIcon, Circle as CircleIcon } from '@mui/icons-material';

import { useApp } from '../contexts/AppContext';
import { useCache } from '../contexts/CacheContext';
import apiService from '../services/apiService';
import UserDialog from '../components/UserDialog';
import PrintPreviewDialog from '../components/PrintPreviewDialog';
import AdActionsDialog from '../components/AdActionsDialog';
import CreateAdUserDialog from '../components/CreateAdUserDialog';
import PasswordCompact from '../components/PasswordCompact';
import CopyableText from '../components/CopyableText';
import PageHeader from '../components/common/PageHeader';
import SearchInput from '../components/common/SearchInput';
import EmptyState from '../components/common/EmptyState';
import LoadingScreen from '../components/common/LoadingScreen';
import AdTreeView from '../components/ad-tree/AdTreeView';

const AdGroupBadge = memo(({ groupName, isMember, onToggle, isLoading }) => {
    const isVpn = groupName === 'VPN';
    const icon = isVpn ? <VpnKeyIcon sx={{ fontSize: '14px' }} /> : <LanguageIcon sx={{ fontSize: '14px' }} />;
    const displayName = isVpn ? 'VPN' : 'INT';
    const fullGroupName = isVpn ? 'VPN' : 'Sortants_responsables (Internet)';
    return (
        <Tooltip title={`${isMember ? 'Retirer de' : 'Ajouter à'} ${fullGroupName}`}>
            <Chip size="small" icon={isLoading ? <CircularProgress size={14} color="inherit" /> : icon} label={displayName} color={isMember ? (isVpn ? 'primary' : 'success') : 'default'} variant="outlined" onClick={onToggle} disabled={isLoading} sx={{ height: 24, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }} />
        </Tooltip>
    );
});
AdGroupBadge.displayName = 'AdGroupBadge';

const UserRow = memo(({ user, isOdd, onEdit, onDelete, onConnectWithCredentials, onPrint, onOpenAdDialog, vpnMembers, internetMembers, onMembershipChange, onSelect, isSelected }) => {
    const { showNotification } = useApp();
    const [isUpdatingVpn, setIsUpdatingVpn] = useState(false);
    const [isUpdatingInternet, setIsUpdatingInternet] = useState(false);

    // ✅ HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURN
    const toggleGroup = useCallback(async (group, isMember, setLoading) => {
        if (!user || !user.username) return;
        setLoading(true);
        try {
            const action = isMember ? apiService.removeUserFromGroup : apiService.addUserToGroup;
            await action(user.username, group);
            showNotification('success', `${user.username} ${isMember ? 'retiré de' : 'ajouté à'} ${group}`);
            onMembershipChange();
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); }
        finally { setLoading(false); }
    }, [user, onMembershipChange, showNotification]);

    // Protection: if user is undefined, return null AFTER all hooks
    if (!user || !user.username) {
        return null;
    }

    const adStatus = user.adEnabled === 1 ? 'enabled' : user.adEnabled === 0 ? 'disabled' : 'unknown';
    const statusColor = adStatus === 'enabled' ? 'success.main' : adStatus === 'disabled' ? 'error.main' : 'action.disabled';
    const statusTooltip = adStatus === 'enabled' ? 'Compte AD activé' : adStatus === 'disabled' ? 'Compte AD désactivé' : 'Statut AD non vérifié';

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, minHeight: 70, backgroundColor: isOdd ? 'grey.50' : 'white', borderBottom: '1px solid #e0e0e0', '&:hover': { backgroundColor: 'action.hover' }, gap: 2 }}>
            <Checkbox checked={isSelected} onChange={() => onSelect(user.username)} sx={{ p: 0, mr: 1 }} />
            <Box sx={{ flex: '1 1 150px', minWidth: 120, overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title={statusTooltip}><CircleIcon sx={{ fontSize: 10, color: statusColor }} /></Tooltip>
                <Box><Typography variant="body2" fontWeight="bold" noWrap>{user.displayName}</Typography><CopyableText text={user.username} /></Box>
            </Box>
            <Box sx={{ flex: '0.8 1 100px', minWidth: 80 }}><Typography variant="body2">{user.department || '-'}</Typography></Box>
            <Box sx={{ flex: '1.2 1 180px', minWidth: 150, overflow: 'hidden' }}><CopyableText text={user.email} /></Box>
            <Box sx={{ flex: '1 1 160px', minWidth: 140, display: 'flex', flexDirection: 'column', gap: 0.5 }}><PasswordCompact password={user.password} label="RDS" /><PasswordCompact password={user.officePassword} label="Office" /></Box>
            <Box sx={{ flex: '1 1 120px', minWidth: 100, display: 'flex', gap: 1 }}><AdGroupBadge groupName="VPN" isMember={vpnMembers.has(user.username)} onToggle={() => toggleGroup('VPN', vpnMembers.has(user.username), setIsUpdatingVpn)} isLoading={isUpdatingVpn} /><AdGroupBadge groupName="Sortants_responsables" isMember={internetMembers.has(user.username)} onToggle={() => toggleGroup('Sortants_responsables', internetMembers.has(user.username), setIsUpdatingInternet)} isLoading={isUpdatingInternet} /></Box>
            <Box sx={{ flex: '0 0 auto', display: 'flex', justifyContent: 'flex-end', width: '180px' }}>
                <Tooltip title="Connexion RDP (app bureau)"><span><IconButton size="small" onClick={() => onConnectWithCredentials(user)} disabled={!window.electronAPI} color="success"><LoginIcon /></IconButton></span></Tooltip>
                <Tooltip title="Éditer (Excel)"><IconButton size="small" onClick={() => onEdit(user)}><EditIcon /></IconButton></Tooltip>
                <Tooltip title="Imprimer Fiche"><IconButton size="small" onClick={() => onPrint(user)}><PrintIcon /></IconButton></Tooltip>
                <Tooltip title="Actions AD"><IconButton size="small" onClick={() => onOpenAdDialog(user)} color="primary"><SettingsIcon /></IconButton></Tooltip>
                <Tooltip title="Supprimer (Excel)"><IconButton size="small" onClick={() => onDelete(user)}><DeleteIcon color="error" /></IconButton></Tooltip>
            </Box>
        </Box>
    );
});
UserRow.displayName = 'UserRow';

// 🛡️ LISTE SIMPLE SANS REACT-WINDOW - Plus robuste et sans dépendances problématiques
const SimpleUserList = memo(({ users, vpnMembers, internetMembers, selectedUsernames, onEdit, onDelete, onConnectWithCredentials, onPrint, onOpenAdDialog, onMembershipChange, onSelect }) => {
    console.log('[SimpleUserList] Rendering', { usersCount: users?.length });

    if (!Array.isArray(users) || users.length === 0) {
        return null;
    }

    return (
        <Box sx={{
            maxHeight: 600,
            overflow: 'auto',
            '&::-webkit-scrollbar': {
                width: '8px',
            },
            '&::-webkit-scrollbar-track': {
                backgroundColor: 'grey.100',
            },
            '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'grey.400',
                borderRadius: '4px',
            },
        }}>
            {users.map((user, index) => (
                <UserRow
                    key={user?.username || `user-${index}`}
                    user={user}
                    isOdd={index % 2 === 1}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onConnectWithCredentials={onConnectWithCredentials}
                    onPrint={onPrint}
                    onOpenAdDialog={onOpenAdDialog}
                    vpnMembers={vpnMembers}
                    internetMembers={internetMembers}
                    onMembershipChange={onMembershipChange}
                    onSelect={onSelect}
                    isSelected={selectedUsernames.has(user.username)}
                />
            ))}
        </Box>
    );
});
SimpleUserList.displayName = 'SimpleUserList';

const UsersManagementPage = () => {
    const { showNotification } = useApp();
    const { cache, isLoading: isCacheLoading, invalidate } = useCache();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [serverFilter, setServerFilter] = useState('all');
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [dialog, setDialog] = useState({ type: null, data: null });
    const [selectedUsernames, setSelectedUsernames] = useState(new Set());
    const [selectedOU, setSelectedOU] = useState(null);
    const [ouUsers, setOuUsers] = useState([]);
    const [isLoadingOUUsers, setIsLoadingOUUsers] = useState(false);

    // ✅ FIX: Protection robuste contre undefined et null
    const users = useMemo(() => {
        if (!cache || typeof cache !== 'object') {
            return [];
        }
        if (!cache.excel_users || cache.excel_users === null || typeof cache.excel_users !== 'object') {
            return [];
        }
        // Additional safety: check if it's actually an object with values
        try {
            const values = Object.values(cache.excel_users);
            return Array.isArray(values) ? values.flat() : [];
        } catch (error) {
            console.error('Error parsing excel_users:', error);
            return [];
        }
    }, [cache]);

    // ✅ FIX: Protection robuste contre cache undefined/null
    const vpnMembers = useMemo(() => {
        if (!cache || typeof cache !== 'object') return new Set();
        return new Set((cache['ad_groups:VPN'] || []).map(m => m?.SamAccountName).filter(Boolean));
    }, [cache]);

    const internetMembers = useMemo(() => {
        if (!cache || typeof cache !== 'object') return new Set();
        return new Set((cache['ad_groups:Sortants_responsables'] || []).map(m => m?.SamAccountName).filter(Boolean));
    }, [cache]);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        showNotification('info', 'Rafraîchissement des données en cours...');
        await apiService.refreshExcelUsers();
        await Promise.all([invalidate('excel_users'), invalidate('ad_groups:VPN'), invalidate('ad_groups:Sortants_responsables')]);
        setIsRefreshing(false);
    }, [invalidate, showNotification]);

    const { servers, departments } = useMemo(() => {
        const safeUsers = Array.isArray(users) ? users : [];
        return {
            servers: [...new Set(safeUsers.map(u => u && u.server).filter(Boolean))].sort(),
            departments: [...new Set(safeUsers.map(u => u && u.department).filter(Boolean))].sort()
        };
    }, [users]);

    useEffect(() => {
        if (selectedOU) {
            setIsLoadingOUUsers(true);
            apiService.getAdUsersInOU(selectedOU)
                .then(setOuUsers)
                .catch(err => {
                    showNotification('error', `Erreur: ${err.message}`);
                    setOuUsers([]);
                })
                .finally(() => setIsLoadingOUUsers(false));
        } else {
            setOuUsers([]);
        }
    }, [selectedOU, showNotification]);

    const filteredUsers = useMemo(() => {
        // Ensure we always work with arrays
        const safeUsers = Array.isArray(users) ? users : [];
        const safeOuUsers = Array.isArray(ouUsers) ? ouUsers : [];

        let result = selectedOU && safeOuUsers.length > 0 ? safeOuUsers.map(ouUser => {
            const excelUser = safeUsers.find(u => u.username && u.username.toLowerCase() === ouUser.SamAccountName.toLowerCase());
            return {
                ...(excelUser || {}),
                displayName: ouUser.DisplayName,
                username: ouUser.SamAccountName,
                email: ouUser.EmailAddress,
                adEnabled: ouUser.Enabled ? 1 : 0,
            };
        }) : safeUsers;

        // Ensure result is always an array and never null/undefined
        if (!Array.isArray(result)) {
            console.warn('[UsersManagementPage] filteredUsers is not an array, returning empty array');
            return [];
        }

        if (serverFilter !== 'all') result = result.filter(u => u && u.server === serverFilter);
        if (departmentFilter !== 'all') result = result.filter(u => u && u.department === departmentFilter);
        if (selectedOU) {
            // This is a placeholder for the actual filtering logic,
            // as we don't have the OU information in the user object yet.
            // For now, we'll just log the selected OU.
            console.log("Filtering by OU:", selectedOU);
        }
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(u => u && ['displayName', 'username', 'email', 'department', 'server'].some(field => u[field] && String(u[field]).toLowerCase().includes(term)));
        }
        return result;
    }, [users, searchTerm, serverFilter, departmentFilter, selectedOU, ouUsers]);

    const stats = useMemo(() => {
        const safeUsers = Array.isArray(users) ? users : [];
        return {
            totalUsers: safeUsers.length,
            usersWithVpn: safeUsers.filter(u => u && u.username && vpnMembers.has(u.username)).length,
            usersWithInternet: safeUsers.filter(u => u && u.username && internetMembers.has(u.username)).length,
            totalServers: Array.isArray(servers) ? servers.length : 0,
        };
    }, [users, vpnMembers, internetMembers, servers]);

    const handleSaveUser = async (userData) => {
        try {
            await apiService.saveUserToExcel({ user: userData, isEdit: !!dialog.data });
            showNotification('success', 'Utilisateur sauvegardé.');
            await invalidate('excel_users');
            setDialog({ type: null, data: null });
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); }
    };

    const handleDeleteUser = useCallback(async (user) => {
        if (!window.confirm(`Supprimer ${user.displayName} du fichier Excel ?`)) return;
        try {
            await apiService.deleteUserFromExcel(user.username);
            showNotification('success', 'Utilisateur supprimé.');
            await invalidate('excel_users');
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); }
    }, [invalidate, showNotification]);

    const handleConnectUserWithCredentials = useCallback(async (user) => {
        if (!window.electronAPI?.launchRdp) return showNotification('warning', 'Fonctionnalité disponible uniquement dans l\'application de bureau.');
        if (!user.password) return showNotification('error', 'Aucun mot de passe configuré.');
        try {
            showNotification('info', `Connexion automatique vers ${user.server}...`);
            const result = await window.electronAPI.launchRdp({ server: user.server, username: user.username, password: user.password });
            if (!result.success) showNotification('error', `Erreur: ${result.error}`);
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); }
    }, [showNotification]);

    const handleSelectUser = (username) => {
        setSelectedUsernames(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(username)) newSelection.delete(username);
            else newSelection.add(username);
            return newSelection;
        });
    };

    const handleSelectAll = (event) => {
        if (event.target.checked) {
            const safeUsers = Array.isArray(filteredUsers) ? filteredUsers : [];
            setSelectedUsernames(new Set(safeUsers.map(u => u?.username).filter(Boolean)));
        } else {
            setSelectedUsernames(new Set());
        }
    };

    // 🎯 VÉRIFICATION SIMPLIFIÉE
    const isDataReady = useMemo(() => {
        if (isCacheLoading || !cache || typeof cache !== 'object') return false;
        // Check that all required cache entries are loaded
        const hasExcelUsers = cache.excel_users !== undefined;
        const hasVpnGroup = cache['ad_groups:VPN'] !== undefined;
        const hasInternetGroup = cache['ad_groups:Sortants_responsables'] !== undefined;
        return hasExcelUsers && hasVpnGroup && hasInternetGroup;
    }, [isCacheLoading, cache]);

    const clearFilters = () => { setSearchTerm(''); setServerFilter('all'); setDepartmentFilter('all'); };

    if (isCacheLoading) {
        return <LoadingScreen type="list" items={8} />;
    }

    return (
        <Box sx={{ p: 2 }}>
            <PageHeader
                title="Gestion des Utilisateurs"
                subtitle="Administration des comptes utilisateurs RDS et Active Directory"
                icon={PersonIcon}
                stats={[
                    { label: 'Total', value: stats.totalUsers, icon: PersonIcon },
                    { label: 'VPN', value: stats.usersWithVpn, icon: VpnKeyIcon },
                    { label: 'Internet', value: stats.usersWithInternet, icon: LanguageIcon },
                    { label: 'Serveurs', value: stats.totalServers, icon: DnsIcon }
                ]}
                actions={
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        {selectedUsernames.size > 0 && (
                            <Button
                                variant="outlined"
                                startIcon={<PrintIcon />}
                                onClick={() => setDialog({ type: 'print', data: users.filter(u => selectedUsernames.has(u.username)) })}
                            >
                                Imprimer ({selectedUsernames.size})
                            </Button>
                        )}
                        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => setDialog({ type: 'createAd' })} sx={{ borderRadius: 2 }}>Ajouter</Button>
                        <Tooltip title="Actualiser les données (Excel + AD)">
                            <span><IconButton onClick={handleRefresh} disabled={isRefreshing} color="primary">{isRefreshing ? <CircularProgress size={24} color="inherit" /> : <RefreshIcon />}</IconButton></span>
                        </Tooltip>
                    </Box>
                }
            />

            <Paper elevation={2} sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
                <Grid container spacing={2} alignItems="flex-end">
                    <Grid item xs={12} sm={4}><SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Rechercher..." fullWidth /></Grid>
                    <Grid item xs={6} sm={2}><FormControl fullWidth size="small"><InputLabel>Serveur</InputLabel><Select value={serverFilter} label="Serveur" onChange={e => setServerFilter(e.target.value)} sx={{ borderRadius: 2 }}><MenuItem value="all">Tous</MenuItem>{servers.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</Select></FormControl></Grid>
                    <Grid item xs={6} sm={2}><FormControl fullWidth size="small"><InputLabel>Service</InputLabel><Select value={departmentFilter} label="Service" onChange={e => setDepartmentFilter(e.target.value)} sx={{ borderRadius: 2 }}><MenuItem value="all">Tous</MenuItem>{departments.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}</Select></FormControl></Grid>
                    <Grid item xs={6} sm={2}><Button fullWidth size="small" startIcon={<ClearIcon />} onClick={clearFilters} sx={{ borderRadius: 2 }}>Réinitialiser</Button></Grid>
                    <Grid item xs={6} sm={2} sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                            {Array.isArray(filteredUsers) ? filteredUsers.length : 0} / {Array.isArray(users) ? users.length : 0} affichés
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>

            <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                    <Paper elevation={2} sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                        <Typography variant="h6" sx={{ mb: 1 }}>Unités d'organisation</Typography>
                        <AdTreeView onNodeSelect={(nodeId) => setSelectedOU(nodeId)} />
                    </Paper>
                </Grid>
                <Grid item xs={12} md={9}>
                    {isLoadingOUUsers || !isDataReady ? (
                        <LoadingScreen type="list" />
                    ) : !filteredUsers.length ? (
                        <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
                            <EmptyState type={searchTerm ? 'search' : 'empty'} title={searchTerm ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur'} onAction={searchTerm ? clearFilters : () => setDialog({ type: 'createAd' })} />
                        </Paper>
                    ) : (
                        <Paper elevation={2} sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 2, minHeight: 500 }}>
                            <Box sx={{ px: 2, py: 1.5, backgroundColor: 'primary.main', color: 'white', display: 'flex', gap: 2, fontWeight: 600, alignItems: 'center' }}>
                                <Checkbox
                                    indeterminate={selectedUsernames.size > 0 && selectedUsernames.size < filteredUsers.length}
                                    checked={filteredUsers.length > 0 && selectedUsernames.size === filteredUsers.length}
                                    onChange={handleSelectAll}
                                    sx={{ color: 'white', '&.Mui-checked': { color: 'white' }, '&.MuiCheckbox-indeterminate': { color: 'white' }, p: 0, mr: 1 }}
                                />
                                <Box sx={{ flex: '1 1 150px' }}>Utilisateur</Box><Box sx={{ flex: '0.8 1 100px' }}>Service</Box><Box sx={{ flex: '1.2 1 180px' }}>Email</Box><Box sx={{ flex: '1 1 160px' }}>Mots de passe</Box><Box sx={{ flex: '1 1 120px' }}>Groupes</Box><Box sx={{ flex: '0 0 auto', width: '180px' }}>Actions</Box>
                            </Box>
                            <Box sx={{ flex: 1, overflow: 'hidden' }}>
                                <SimpleUserList
                                    users={filteredUsers}
                                    vpnMembers={vpnMembers}
                                    internetMembers={internetMembers}
                                    selectedUsernames={selectedUsernames}
                                    onEdit={u => setDialog({ type: 'editExcel', data: u })}
                                    onDelete={handleDeleteUser}
                                    onConnectWithCredentials={handleConnectUserWithCredentials}
                                    onPrint={u => setDialog({ type: 'print', data: u })}
                                    onOpenAdDialog={u => setDialog({ type: 'adActions', data: u })}
                                    onMembershipChange={() => { invalidate('ad_groups:VPN'); invalidate('ad_groups:Sortants_responsables'); }}
                                    onSelect={handleSelectUser}
                                />
                            </Box>
                        </Paper>
                    )}
                </Grid>
            </Grid>

            {/* ✅ Rendu conditionnel des dialogues */}
            {dialog.type === 'editExcel' && <UserDialog open={true} onClose={() => setDialog({ type: null })} user={dialog.data} onSave={handleSaveUser} servers={servers} />}
            {dialog.type === 'print' && <PrintPreviewDialog open={true} onClose={() => setDialog({ type: null })} user={dialog.data} />}
            {dialog.type === 'adActions' && <AdActionsDialog open={true} onClose={() => setDialog({ type: null })} user={dialog.data} onActionComplete={handleRefresh} />}
            {dialog.type === 'createAd' && <CreateAdUserDialog open={true} onClose={() => setDialog({ type: null })} onSuccess={handleRefresh} servers={servers} />}
        </Box>
    );
};

export default memo(UsersManagementPage);
