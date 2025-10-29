// src/pages/UsersManagementPage.js - VERSION MODERNISÉE ET OPTIMISÉE

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import {
    Box, Paper, Typography, Button, IconButton, Tooltip, CircularProgress,
    FormControl, InputLabel, Select, MenuItem, Chip, Snackbar, Alert,
    Grid, LinearProgress, Menu, ListItemIcon, ListItemText
} from '@mui/material';

// Icons
import {
    PersonAdd as PersonAddIcon, Refresh as RefreshIcon,
    Clear as ClearIcon,
    Edit as EditIcon, Delete as DeleteIcon, Launch as LaunchIcon, Print as PrintIcon,
    MoreVert as MoreVertIcon, VpnKey as VpnKeyIcon,
    Language as LanguageIcon, Settings as SettingsIcon, Person as PersonIcon,
    Dns as DnsIcon
} from '@mui/icons-material';

import { useApp } from '../contexts/AppContext';
import { useCache } from '../contexts/CacheContext';
import apiService from '../services/apiService';
import UserDialog from '../components/UserDialog';
import PrintPreviewDialog from '../components/PrintPreviewDialog';
import AdActionsDialog from '../components/AdActionsDialog';
import PasswordCompact from '../components/PasswordCompact';
import CopyableText from '../components/CopyableText';

// Nouveaux composants modernes
import PageHeader from '../components/common/PageHeader';
import SearchInput from '../components/common/SearchInput';
import EmptyState from '../components/common/EmptyState';
import LoadingScreen from '../components/common/LoadingScreen';

// Debounce function is now built-in to SearchInput component

const AdGroupBadge = memo(({ groupName, isMember, onToggle, isLoading }) => {
    const isVpn = groupName === 'VPN';
    const icon = isVpn ? <VpnKeyIcon sx={{ fontSize: '14px' }} /> : <LanguageIcon sx={{ fontSize: '14px' }} />;
    const displayName = isVpn ? 'VPN' : 'INT';
    const fullGroupName = isVpn ? 'VPN' : 'Sortants_responsables (Internet)';
    return (
        <Tooltip title={`${isMember ? 'Retirer de' : 'Ajouter à'} ${fullGroupName}`}>
            <Chip
                size="small"
                icon={isLoading ? <CircularProgress size={14} color="inherit" /> : icon}
                label={displayName}
                color={isMember ? (isVpn ? 'primary' : 'success') : 'default'}
                variant="outlined"
                onClick={onToggle}
                disabled={isLoading}
                sx={{ height: 24, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
            />
        </Tooltip>
    );
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
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); } 
        finally { setLoading(false); }
    }, [user.username, onMembershipChange, showNotification]);

    return (
        <Box style={style} sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, backgroundColor: isOdd ? 'grey.50' : 'white', borderBottom: '1px solid #e0e0e0', '&:hover': { backgroundColor: 'action.hover' }, gap: 2 }}>
            <Box sx={{ flex: '1 1 150px', minWidth: 120, overflow: 'hidden' }}><Typography variant="body2" fontWeight="bold" noWrap>{user.displayName}</Typography><CopyableText text={user.username} /></Box>
            <Box sx={{ flex: '0.8 1 100px', minWidth: 80 }}><Typography variant="body2">{user.department || '-'}</Typography></Box>
            <Box sx={{ flex: '1.2 1 180px', minWidth: 150, overflow: 'hidden' }}><CopyableText text={user.email} /></Box>
            <Box sx={{ flex: '1 1 160px', minWidth: 140, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <PasswordCompact password={user.password} label="RDS" />
                {user.officePassword && <PasswordCompact password={user.officePassword} label="Office" />}
            </Box>
            <Box sx={{ flex: '1 1 120px', minWidth: 100, display: 'flex', gap: 1 }}><AdGroupBadge groupName="VPN" isMember={vpnMembers.has(user.username)} onToggle={() => toggleGroup('VPN', vpnMembers.has(user.username), setIsUpdatingVpn)} isLoading={isUpdatingVpn} /><AdGroupBadge groupName="Sortants_responsables" isMember={internetMembers.has(user.username)} onToggle={() => toggleGroup('Sortants_responsables', internetMembers.has(user.username), setIsUpdatingInternet)} isLoading={isUpdatingInternet} /></Box>
            <Box sx={{ flex: '0 0 auto', display: 'flex' }}>
                <Tooltip title="Connexion RDP (app bureau)">
                    <span>
                        <IconButton size="small" onClick={() => onConnect(user)} disabled={!window.electronAPI}><LaunchIcon /></IconButton>
                    </span>
                </Tooltip>
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
    const [adMenuAnchor, setAdMenuAnchor] = useState(null);
    const [selectedUserForAd, setSelectedUserForAd] = useState(null);
    const [updateAvailable, setUpdateAvailable] = useState(false);

    const { servers, departments } = useMemo(() => ({
        servers: [...new Set(users.map(u => u.server).filter(Boolean))].sort(),
        departments: [...new Set(users.map(u => u.department).filter(Boolean))].sort()
    }), [users]);

    const loadGroupMembers = useCallback(async (force = false) => {
        try {
            const [vpnData, internetData] = await Promise.all([
                fetchWithCache('adGroup:VPN', () => apiService.getAdGroupMembers('VPN'), { force }),
                fetchWithCache('adGroup:Sortants_responsables', () => apiService.getAdGroupMembers('Sortants_responsables'), { force })
            ]);
            setVpnMembers(new Set((vpnData || []).map(m => m.SamAccountName)));
            setInternetMembers(new Set((internetData || []).map(m => m.SamAccountName)));
        } catch (error) { showNotification('error', `Erreur chargement groupes: ${error.message}`); }
    }, [fetchWithCache, showNotification]);

    const loadUsers = useCallback(async (force = false) => {
        try {
            const data = await fetchWithCache('excel_users', apiService.getExcelUsers, { force });
            // Le backend retourne { success: true, users: { 'SRV-1': [...], 'SRV-2': [...] } }
            // On doit aplatir cet objet en un seul tableau.
            if (data?.success && typeof data.users === 'object' && data.users !== null) {
                const allUsers = Object.values(data.users).flat();
                setUsers(allUsers);
            } else {
                setUsers([]);
                if (data?.error) {
                    showNotification('error', `Impossible de charger les utilisateurs : ${data.error}`);
                }
            }
        } catch (error) {
            showNotification('error', `Erreur critique lors du chargement des utilisateurs: ${error.message}`);
            setUsers([]);
        }
    }, [fetchWithCache, showNotification]);

    const handleRefresh = useCallback(async (force = true) => {
        setIsRefreshing(true);
        invalidate('excel_users');
        invalidate('adGroup:VPN');
        invalidate('adGroup:Sortants_responsables');
        try { await Promise.all([loadUsers(force), loadGroupMembers(force)]); } 
        finally { setIsRefreshing(false); }
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

        // Filtre par serveur
        if (serverFilter !== 'all') {
            result = result.filter(u => u.server === serverFilter);
        }

        // Filtre par service/département
        if (departmentFilter !== 'all') {
            result = result.filter(u => u.department === departmentFilter);
        }

        // Filtre par recherche textuelle (amélioration: recherche ciblée)
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(u => {
                const searchFields = [
                    u.displayName,
                    u.username,
                    u.email,
                    u.department,
                    u.server
                ];
                return searchFields.some(field =>
                    field && String(field).toLowerCase().includes(term)
                );
            });
        }

        return result;
    }, [users, searchTerm, serverFilter, departmentFilter]);

    // Statistiques pour le PageHeader
    const stats = useMemo(() => {
        const usersWithVpn = users.filter(u => vpnMembers.has(u.username)).length;
        const usersWithInternet = users.filter(u => internetMembers.has(u.username)).length;
        return {
            totalUsers: users.length,
            usersWithVpn,
            usersWithInternet,
            totalServers: servers.length,
            totalDepartments: departments.length
        };
    }, [users, vpnMembers, internetMembers, servers.length, departments.length]);
    
    const handleSaveUser = async (userData) => {
        try {
            await apiService.saveUserToExcel({ user: userData, isEdit: !!selectedUser });
            showNotification('success', 'Utilisateur sauvegardé.');
            await handleRefresh(true);
            setUserDialogOpen(false);
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); }
    };

    const handleDeleteUser = useCallback(async (user) => {
        if (!window.confirm(`Supprimer ${user.displayName} du fichier Excel ?`)) return;
        try {
            await apiService.deleteUserFromExcel(user.username);
            showNotification('success', 'Utilisateur supprimé.');
            await handleRefresh(true);
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); }
    }, [handleRefresh, showNotification]);

    const handleConnectUser = useCallback((user) => {
        if (window.electronAPI?.launchRdp) {
            showNotification('info', `Lancement de la connexion RDP vers ${user.server}...`);
            window.electronAPI.launchRdp({ server: user.server });
        } else {
            showNotification('warning', 'La connexion RDP directe est uniquement disponible dans l\'application de bureau.');
        }
    }, [showNotification]);

    const Row = useCallback(({ index, style }) => (
        <UserRow
            user={filteredUsers[index]} style={style} isOdd={index % 2 === 1}
            onEdit={u => { setSelectedUser(u); setUserDialogOpen(true); }}
            onDelete={handleDeleteUser} onConnect={handleConnectUser}
            onPrint={u => { setUserToPrint(u); setPrintPreviewOpen(true); }}
            onOpenAdMenu={(e, u) => { setSelectedUserForAd(u); setAdMenuAnchor(e.currentTarget); }}
            vpnMembers={vpnMembers} internetMembers={internetMembers}
            onMembershipChange={() => handleRefresh(true)}
        />
    ), [filteredUsers, vpnMembers, internetMembers, handleDeleteUser, handleConnectUser, handleRefresh]);
    
    const clearFilters = () => {
        setSearchTerm('');
        setServerFilter('all');
        setDepartmentFilter('all');
    };

    return (
        <Box sx={{ p: 2 }}>
            {isRefreshing && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }} />}

            {/* Header Moderne */}
            <PageHeader
                title="Gestion des Utilisateurs"
                subtitle={`Administration complète des comptes utilisateurs RDS et Active Directory`}
                icon={PersonIcon}
                stats={[
                    {
                        label: 'Total utilisateurs',
                        value: stats.totalUsers,
                        icon: PersonIcon
                    },
                    {
                        label: 'Accès VPN',
                        value: stats.usersWithVpn,
                        icon: VpnKeyIcon
                    },
                    {
                        label: 'Accès Internet',
                        value: stats.usersWithInternet,
                        icon: LanguageIcon
                    },
                    {
                        label: 'Serveurs',
                        value: stats.totalServers,
                        icon: DnsIcon
                    }
                ]}
                actions={
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <Button
                            variant="contained"
                            startIcon={<PersonAddIcon />}
                            onClick={() => {
                                setSelectedUser(null);
                                setUserDialogOpen(true);
                            }}
                            sx={{ borderRadius: 2 }}
                        >
                            Ajouter
                        </Button>
                        <Tooltip title="Actualiser les données (Excel + AD)">
                            <span>
                                <IconButton
                                    onClick={() => handleRefresh(true)}
                                    disabled={isRefreshing}
                                    color="primary"
                                    sx={{
                                        bgcolor: 'primary.lighter',
                                        '&:hover': { bgcolor: 'primary.light' }
                                    }}
                                >
                                    <RefreshIcon />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Box>
                }
            />

            {/* Filtres */}
            <Paper elevation={2} sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
                <Grid container spacing={2} alignItems="flex-end">
                    <Grid item xs={12} sm={4}>
                        <SearchInput
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Rechercher (Nom, Identifiant, Email...)"
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={6} sm={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Serveur</InputLabel>
                            <Select
                                value={serverFilter}
                                label="Serveur"
                                onChange={e => setServerFilter(e.target.value)}
                                sx={{ borderRadius: 2 }}
                            >
                                <MenuItem value="all">Tous</MenuItem>
                                {servers.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6} sm={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Service</InputLabel>
                            <Select
                                value={departmentFilter}
                                label="Service"
                                onChange={e => setDepartmentFilter(e.target.value)}
                                sx={{ borderRadius: 2 }}
                            >
                                <MenuItem value="all">Tous</MenuItem>
                                {departments.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6} sm={2}>
                        <Button
                            fullWidth
                            size="small"
                            startIcon={<ClearIcon />}
                            onClick={clearFilters}
                            sx={{ borderRadius: 2 }}
                        >
                            Réinitialiser
                        </Button>
                    </Grid>
                    <Grid item xs={6} sm={2} sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                            {filteredUsers.length} / {users.length} affichés
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>
            {/* Table des utilisateurs */}
            {isLoading ? (
                <LoadingScreen type="list" items={8} />
            ) : !filteredUsers.length ? (
                <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
                    <EmptyState
                        type={searchTerm || serverFilter !== 'all' || departmentFilter !== 'all' ? 'search' : 'empty'}
                        title={searchTerm || serverFilter !== 'all' || departmentFilter !== 'all' ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur'}
                        description={
                            searchTerm || serverFilter !== 'all' || departmentFilter !== 'all'
                                ? 'Essayez avec d\'autres critères de recherche'
                                : 'Cliquez sur "Ajouter" pour créer votre premier utilisateur'
                        }
                        actionLabel={searchTerm || serverFilter !== 'all' || departmentFilter !== 'all' ? 'Réinitialiser les filtres' : 'Ajouter un utilisateur'}
                        onAction={
                            searchTerm || serverFilter !== 'all' || departmentFilter !== 'all'
                                ? clearFilters
                                : () => {
                                      setSelectedUser(null);
                                      setUserDialogOpen(true);
                                  }
                        }
                    />
                </Paper>
            ) : (
                <Paper elevation={2} sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 2, minHeight: 500 }}>
                    <Box sx={{
                        px: 2,
                        py: 1.5,
                        backgroundColor: 'primary.main',
                        color: 'white',
                        display: 'flex',
                        gap: 2,
                        fontWeight: 600
                    }}>
                        <Box sx={{ flex: '1 1 150px', minWidth: 120 }}>Utilisateur</Box>
                        <Box sx={{ flex: '0.8 1 100px', minWidth: 80 }}>Service</Box>
                        <Box sx={{ flex: '1.2 1 180px', minWidth: 150 }}>Email</Box>
                        <Box sx={{ flex: '1 1 160px', minWidth: 140 }}>Mots de passe</Box>
                        <Box sx={{ flex: '1 1 120px', minWidth: 100 }}>Groupes</Box>
                        <Box sx={{ flex: '0 0 auto', width: '180px' }}>Actions</Box>
                    </Box>
                    <Box sx={{ flex: 1, overflow: 'auto', minHeight: 400 }}>
                        <AutoSizer>
                            {({ height, width }) => (
                                <List
                                    height={height}
                                    width={width}
                                    itemCount={filteredUsers.length}
                                    itemSize={80}
                                    itemKey={i => filteredUsers[i].username}
                                >
                                    {Row}
                                </List>
                            )}
                        </AutoSizer>
                    </Box>
                </Paper>
            )}
            {userDialogOpen && <UserDialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} user={selectedUser} onSave={handleSaveUser} servers={servers} />}
            {printPreviewOpen && <PrintPreviewDialog open={printPreviewOpen} onClose={() => setPrintPreviewOpen(false)} user={userToPrint} />}
            <Menu anchorEl={adMenuAnchor} open={Boolean(adMenuAnchor)} onClose={() => setAdMenuAnchor(null)}><MenuItem onClick={() => { setAdDialogOpen(true); setAdMenuAnchor(null); }}><ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon><ListItemText>Gérer le compte AD</ListItemText></MenuItem></Menu>
            {selectedUserForAd && <AdActionsDialog open={adDialogOpen} onClose={() => setAdDialogOpen(false)} user={selectedUserForAd} onActionComplete={() => handleRefresh(true)} />}
            <Snackbar open={updateAvailable} autoHideDuration={10000} onClose={() => setUpdateAvailable(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}><Alert severity="info" action={<Button color="inherit" size="small" onClick={() => { handleRefresh(true); setUpdateAvailable(false); }}>Recharger</Button>}>La liste des utilisateurs a été mise à jour.</Alert></Snackbar>
        </Box>
    );
};

export default memo(UsersManagementPage);