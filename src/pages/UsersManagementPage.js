// src/pages/UsersManagementPage.js - VERSION FINALE CORRIGÉE ET AMÉLIORÉE

import React, { useState, useMemo, useCallback, memo, useEffect, useRef } from 'react';
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
import { debounceAsyncLeading } from '../utils/debounce';

const AdGroupBadge = memo(({ groupName, isMember, onToggle, isLoading }) => {
    const isVpn = groupName === 'VPN';
    const icon = isVpn ? <VpnKeyIcon sx={{ fontSize: '16px' }} /> : <LanguageIcon sx={{ fontSize: '16px' }} />;
    const displayName = isVpn ? 'VPN' : 'INTERNET';
    const fullGroupName = isVpn ? 'VPN' : 'Sortants_responsables (Internet)';
    return (
        <Tooltip title={`${isMember ? 'Retirer de' : 'Ajouter à'} ${fullGroupName}`}>
            <Chip
                icon={isLoading ? <CircularProgress size={16} color="inherit" /> : icon}
                label={displayName}
                color={isMember ? (isVpn ? 'primary' : 'success') : 'default'}
                variant="outlined"
                onClick={onToggle}
                disabled={isLoading}
                sx={{
                    height: 30,
                    fontSize: '0.813rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    minWidth: 90,
                    '& .MuiChip-label': { px: 1.5, fontFamily: 'system-ui' },
                    '& .MuiChip-icon': { ml: 0.75 }
                }}
            />
        </Tooltip>
    );
});
AdGroupBadge.displayName = 'AdGroupBadge';

const UserRow = memo(({ user, isOdd, onEdit, onDelete, onConnectWithCredentials, onPrint, onOpenAdDialog, vpnMembers, internetMembers, onMembershipChange, onSelect, isSelected }) => {
    const { showNotification } = useApp();
    const [isUpdatingVpn, setIsUpdatingVpn] = useState(false);
    const [isUpdatingInternet, setIsUpdatingInternet] = useState(false);

    // ✅ HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURN
    // 🚀 Optimisation TSE: debounceAsyncLeading empêche clics multiples rapides
    const toggleGroup = useCallback(
        debounceAsyncLeading(async (group, isMember, setLoading) => {
            if (!user || !user.username) return;
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
        }, 800), // Cooldown 800ms pour éviter saturation TSE
        [user, onMembershipChange, showNotification]
    );

    // Protection: if user is undefined, return null AFTER all hooks
    if (!user || !user.username) {
        return null;
    }

    const adStatus = user.adEnabled === 1 ? 'enabled' : user.adEnabled === 0 ? 'disabled' : 'unknown';
    const statusColor = adStatus === 'enabled' ? 'success.main' : adStatus === 'disabled' ? 'error.main' : 'action.disabled';
    const statusTooltip = adStatus === 'enabled' ? 'Compte AD activé' : adStatus === 'disabled' ? 'Compte AD désactivé' : 'Statut AD non vérifié';

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, minHeight: 72, backgroundColor: isOdd ? 'grey.50' : 'white', borderBottom: '1px solid #e0e0e0', '&:hover': { backgroundColor: 'action.hover' }, gap: 2 }}>
            <Checkbox checked={isSelected} onChange={() => onSelect(user.username)} sx={{ p: 0, mr: 1 }} />
            <Box sx={{ flex: '1 1 150px', minWidth: 120, overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title={statusTooltip}><CircleIcon sx={{ fontSize: 12, color: statusColor }} /></Tooltip>
                <Box>
                    <Typography variant="body1" fontWeight={600} noWrap sx={{ fontSize: '0.938rem' }}>
                        {user.displayName}
                    </Typography>
                    <CopyableText text={user.username} sx={{ fontSize: '0.813rem' }} />
                </Box>
            </Box>
            <Box sx={{ flex: '0.8 1 100px', minWidth: 80 }}>
                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>{user.department || '-'}</Typography>
            </Box>
            <Box sx={{ flex: '1.2 1 180px', minWidth: 150, overflow: 'hidden' }}>
                <CopyableText text={user.email} sx={{ fontSize: '0.875rem' }} />
            </Box>
            <Box sx={{ flex: '1 1 160px', minWidth: 140, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <PasswordCompact password={user.password} label="RDS" />
                <PasswordCompact password={user.officePassword} label="Office" />
            </Box>
            <Box sx={{ flex: '1 1 130px', minWidth: 130, display: 'flex', gap: 1.2, flexWrap: 'wrap' }}>
                <AdGroupBadge groupName="VPN" isMember={vpnMembers.has(user.username)} onToggle={() => toggleGroup('VPN', vpnMembers.has(user.username), setIsUpdatingVpn)} isLoading={isUpdatingVpn} />
                <AdGroupBadge groupName="Sortants_responsables" isMember={internetMembers.has(user.username)} onToggle={() => toggleGroup('Sortants_responsables', internetMembers.has(user.username), setIsUpdatingInternet)} isLoading={isUpdatingInternet} />
            </Box>
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

// 🚀 OPTIMISATION: Liste virtualisée avec rendu progressif pour performances optimales
const VirtualizedUserList = memo(({ users, vpnMembers, internetMembers, selectedUsernames, onEdit, onDelete, onConnectWithCredentials, onPrint, onOpenAdDialog, onMembershipChange, onSelect }) => {
    const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
    const containerRef = useRef(null);
    const ROW_HEIGHT = 72;
    const BUFFER = 10;

    // Gestionnaire de scroll optimisé avec throttle
    const handleScroll = useCallback(() => {
        if (!containerRef.current) return;

        const { scrollTop, clientHeight } = containerRef.current;
        const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER);
        const visibleCount = Math.ceil(clientHeight / ROW_HEIGHT) + BUFFER * 2;
        const end = Math.min(users.length, start + visibleCount);

        setVisibleRange(prev => {
            if (prev.start !== start || prev.end !== end) {
                return { start, end };
            }
            return prev;
        });
    }, [users.length]);

    // Throttle scroll pour éviter trop de re-renders
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let ticking = false;
        const throttledScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        };

        container.addEventListener('scroll', throttledScroll);
        handleScroll(); // Initial calculation
        return () => container.removeEventListener('scroll', throttledScroll);
    }, [handleScroll]);

    if (!Array.isArray(users) || users.length === 0) {
        return null;
    }

    const totalHeight = users.length * ROW_HEIGHT;
    const offsetY = visibleRange.start * ROW_HEIGHT;

    return (
        <Box
            ref={containerRef}
            sx={{
                height: 'calc(100vh - 380px)',
                minHeight: 400,
                overflow: 'auto',
                '&::-webkit-scrollbar': { width: '8px' },
                '&::-webkit-scrollbar-track': { backgroundColor: 'grey.100' },
                '&::-webkit-scrollbar-thumb': { backgroundColor: 'grey.400', borderRadius: '4px' },
            }}
        >
            <Box sx={{ height: totalHeight, position: 'relative' }}>
                <Box sx={{ position: 'absolute', top: offsetY, left: 0, right: 0 }}>
                    {users.slice(visibleRange.start, visibleRange.end).map((user, index) => (
                        <UserRow
                            key={user?.username || `user-${visibleRange.start + index}`}
                            user={user}
                            isOdd={(visibleRange.start + index) % 2 === 1}
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
            </Box>
        </Box>
    );
});
VirtualizedUserList.displayName = 'VirtualizedUserList';

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

    // 🚀 Optimisation TSE: debounceAsyncLeading empêche double refresh
    const handleRefresh = useCallback(
        debounceAsyncLeading(async () => {
            setIsRefreshing(true);
            showNotification('info', 'Rafraîchissement des données en cours...');
            try {
                await apiService.refreshExcelUsers();
                await Promise.all([
                    invalidate('excel_users'),
                    invalidate('ad_groups:VPN'),
                    invalidate('ad_groups:Sortants_responsables')
                ]);
                showNotification('success', 'Données rafraîchies avec succès');
            } catch (error) {
                showNotification('error', `Erreur rafraîchissement: ${error.message}`);
            } finally {
                setIsRefreshing(false);
            }
        }, 2000), // Cooldown 2s - opération lourde
        [invalidate, showNotification]
    );

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

    // 🚀 Optimisation TSE: debounceAsyncLeading empêche suppressions multiples accidentelles
    const handleDeleteUser = useCallback(
        debounceAsyncLeading(async (user) => {
            if (!window.confirm(`Supprimer ${user.displayName} du fichier Excel ?`)) return;
            try {
                await apiService.deleteUserFromExcel(user.username);
                showNotification('success', 'Utilisateur supprimé.');
                await invalidate('excel_users');
            } catch (error) {
                showNotification('error', `Erreur: ${error.message}`);
            }
        }, 1000), // Cooldown 1s
        [invalidate, showNotification]
    );

    // 🚀 Optimisation TSE: debounceAsyncLeading empêche lancements RDP multiples
    const handleConnectUserWithCredentials = useCallback(
        debounceAsyncLeading(async (user) => {
            if (!window.electronAPI?.launchRdp) {
                return showNotification('warning', 'Fonctionnalité disponible uniquement dans l\'application de bureau.');
            }
            if (!user.password) {
                return showNotification('error', 'Aucun mot de passe configuré.');
            }
            try {
                showNotification('info', `Connexion automatique vers ${user.server}...`);
                const result = await window.electronAPI.launchRdp({
                    server: user.server,
                    username: user.username,
                    password: user.password
                });
                if (!result.success) {
                    showNotification('error', `Erreur: ${result.error}`);
                } else {
                    showNotification('success', 'Connexion RDP lancée');
                }
            } catch (error) {
                showNotification('error', `Erreur: ${error.message}`);
            }
        }, 1500), // Cooldown 1.5s - opération lourde (lancement RDP)
        [showNotification]
    );

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
                <Grid item xs={12}>
                    {isLoadingOUUsers || !isDataReady ? (
                        <LoadingScreen type="list" />
                    ) : !filteredUsers.length ? (
                        <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
                            <EmptyState type={searchTerm ? 'search' : 'empty'} title={searchTerm ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur'} onAction={searchTerm ? clearFilters : () => setDialog({ type: 'createAd' })} />
                        </Paper>
                    ) : (
                        <Paper elevation={2} sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 2, minHeight: 500 }}>
                            <Box sx={{ px: 2, py: 2, backgroundColor: 'primary.main', color: 'white', display: 'flex', gap: 2, fontWeight: 700, alignItems: 'center', fontSize: '0.938rem' }}>
                                <Checkbox
                                    indeterminate={selectedUsernames.size > 0 && selectedUsernames.size < filteredUsers.length}
                                    checked={filteredUsers.length > 0 && selectedUsernames.size === filteredUsers.length}
                                    onChange={handleSelectAll}
                                    sx={{ color: 'white', '&.Mui-checked': { color: 'white' }, '&.MuiCheckbox-indeterminate': { color: 'white' }, p: 0, mr: 1 }}
                                />
                                <Box sx={{ flex: '1 1 150px' }}>UTILISATEUR</Box>
                                <Box sx={{ flex: '0.8 1 100px' }}>SERVICE</Box>
                                <Box sx={{ flex: '1.2 1 180px' }}>EMAIL</Box>
                                <Box sx={{ flex: '1 1 160px' }}>MOTS DE PASSE</Box>
                                <Box sx={{ flex: '1 1 130px' }}>GROUPES AD</Box>
                                <Box sx={{ flex: '0 0 auto', width: '180px' }}>ACTIONS</Box>
                            </Box>
                            <Box sx={{ flex: 1, overflow: 'hidden' }}>
                                <VirtualizedUserList
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
