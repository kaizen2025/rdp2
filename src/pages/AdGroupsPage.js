// src/pages/AdGroupsPage.js - VERSION ULTRA-ROBUSTE ANTI-CRASH

import React, { useState, useMemo, memo, useCallback, useEffect } from 'react';
import { Box, Paper, Typography, Button, IconButton, Tooltip, CircularProgress, InputAdornment, Chip, FormControl, InputLabel, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, List as MuiList, ListItem, ListItemText, ListItemIcon, Divider, TextField } from '@mui/material';

// ✅ CORRECTION: Imports des icônes depuis le module principal
import {
    Refresh as RefreshIcon,
    Search as SearchIcon,
    Group as GroupIcon,
    PersonAdd as PersonAddIcon,
    PersonRemove as PersonRemoveIcon,
    CheckCircle as CheckCircleIcon,
    Info as InfoIcon
} from '@mui/icons-material';

import { useApp } from '../contexts/AppContext';
import { useCache } from '../contexts/CacheContext';
import { useElectronAD } from '../hooks/useElectronAD';
import PageHeader from '../components/common/PageHeader';
import SearchInput from '../components/common/SearchInput';
import EmptyState from '../components/common/EmptyState';
import LoadingScreen from '../components/common/LoadingScreen';

const MemberRow = memo(({ member, isOdd, onRemove, groupName }) => {
    if (!member) return null;

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            px: 2,
            py: 1,
            minHeight: 60,
            backgroundColor: isOdd ? 'grey.50' : 'white',
            borderBottom: '1px solid',
            borderColor: 'divider',
            '&:hover': { backgroundColor: 'action.hover' }
        }}>
            <Box sx={{ flex: 1, pr: 2 }}>
                <Typography variant="body2" fontWeight={500}>
                    {member.DisplayName || member.name || 'N/A'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {member.SamAccountName || member.sam || 'N/A'}
                </Typography>
            </Box>
            <Tooltip title="Retirer du groupe">
                <IconButton
                    size="small"
                    color="error"
                    onClick={() => onRemove(member.SamAccountName || member.sam, groupName)}
                >
                    <PersonRemoveIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        </Box>
    );
});
MemberRow.displayName = 'MemberRow';

// 🛡️ LISTE SIMPLE SANS REACT-WINDOW - Plus robuste et sans dépendances problématiques
const SimpleMemberList = memo(({ members, onRemove, groupName }) => {
    console.log('[SimpleMemberList] Rendering', {
        membersCount: members?.length,
        groupName
    });

    if (!Array.isArray(members) || members.length === 0) {
        return null;
    }

    if (typeof onRemove !== 'function' || !groupName) {
        console.warn('[SimpleMemberList] ❌ Invalid props', { onRemove: typeof onRemove, groupName });
        return null;
    }

    return (
        <Box sx={{
            maxHeight: 500,
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
            {members.map((member, index) => (
                <MemberRow
                    key={member?.SamAccountName || member?.sam || `member-${index}`}
                    member={member}
                    isOdd={index % 2 === 1}
                    onRemove={onRemove}
                    groupName={groupName}
                />
            ))}
        </Box>
    );
});
SimpleMemberList.displayName = 'SimpleMemberList';

const AdGroupsPage = () => {
    const { showNotification } = useApp();
    const { cache, isLoading: isCacheLoading, invalidate } = useCache();
    const electronAD = useElectronAD();

    // 🔍 LOG 2: État du cache
    console.log('[AdGroupsPage] RENDER', {
        isCacheLoading,
        hasCache: !!cache,
        cacheType: typeof cache
    });

    // ✅ Protection robuste contre undefined/null
    const config = useMemo(() => {
        if (!cache || typeof cache !== 'object') return {};
        return cache.config || {};
    }, [cache]);

    const adGroups = useMemo(() => {
        if (!config || typeof config !== 'object') return {};
        return config.ad_groups || {};
    }, [config]);

    const groupKeys = useMemo(() => {
        if (!adGroups || typeof adGroups !== 'object') return [];
        return Object.keys(adGroups);
    }, [adGroups]);

    const [selectedGroup, setSelectedGroup] = useState(groupKeys.length > 0 ? groupKeys[0] : '');
    const [searchTerm, setSearchTerm] = useState('');
    const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [searchingUsers, setSearchingUsers] = useState(false);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // 🔍 LOG 3: Groupe sélectionné
    console.log('[AdGroupsPage] selectedGroup:', selectedGroup);

    const members = useMemo(() => {
        const data = cache[`ad_groups:${selectedGroup}`];
        console.log(`[AdGroupsPage] members for ${selectedGroup}:`, Array.isArray(data) ? data.length : typeof data);
        return Array.isArray(data) ? data : [];
    }, [cache, selectedGroup]);

    const handleRefresh = useCallback(async () => {
        if (!selectedGroup) return;
        setIsRefreshing(true);
        await invalidate(`ad_groups:${selectedGroup}`);
        setIsRefreshing(false);
    }, [selectedGroup, invalidate]);

    useEffect(() => {
        if (selectedGroup && !cache[`ad_groups:${selectedGroup}`]) {
            console.log('[AdGroupsPage] Loading group data for:', selectedGroup);
            invalidate(`ad_groups:${selectedGroup}`);
        }
    }, [selectedGroup, cache, invalidate]);

    const filteredMembers = useMemo(() => {
        const safeMembers = Array.isArray(members) ? members : [];
        if (!searchTerm) return safeMembers;
        const term = searchTerm.toLowerCase();
        const filtered = safeMembers.filter(m => m && ((m.DisplayName || m.name || '').toLowerCase().includes(term) || (m.SamAccountName || m.sam || '').toLowerCase().includes(term)));
        return Array.isArray(filtered) ? filtered : [];
    }, [members, searchTerm]);

    const handleRemoveUser = useCallback(async (username, groupName) => {
        if (!window.confirm(`Retirer ${username} du groupe ${groupName} ?`)) return;
        try {
            const result = await electronAD.removeUserFromGroup(username, groupName);
            if (result.success) {
                showNotification('success', `${username} retiré du groupe.`);
                await invalidate(`ad_groups:${groupName}`);
            } else {
                showNotification('error', `Erreur: ${result.error}`);
            }
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); }
    }, [electronAD, showNotification, invalidate]);

    const handleAddUser = async (username) => {
        try {
            const result = await electronAD.addUserToGroup(username, selectedGroup);
            if (result.success) {
                showNotification('success', `${username} ajouté au groupe.`);
                await invalidate(`ad_groups:${selectedGroup}`);
                setAddUserDialogOpen(false);
            } else {
                showNotification('error', `Erreur: ${result.error}`);
            }
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); }
    };

    const searchAdUsers = useCallback(async (term) => {
        if (!term || term.length < 2) { setAvailableUsers([]); return; }
        setSearchingUsers(true);
        try {
            const users = await electronAD.searchUsers(term);
            setAvailableUsers(Array.isArray(users) ? users : []);
        } catch (error) { showNotification('error', `Erreur recherche: ${error.message}`); }
        finally { setSearchingUsers(false); }
    }, [electronAD, showNotification]);

    const handleOpenAddDialog = () => { setUserSearchTerm(''); setAvailableUsers([]); setAddUserDialogOpen(true); };

    // 🎯 VÉRIFICATION SIMPLIFIÉE
    const isDataReady = useMemo(() => {
        if (isCacheLoading) {
            console.log('[AdGroupsPage] ❌ NOT READY: cache is loading');
            return false;
        }

        if (!cache || typeof cache !== 'object') {
            console.log('[AdGroupsPage] ❌ NOT READY: cache invalid');
            return false;
        }

        if (!config || typeof config !== 'object' || Object.keys(config || {}).length === 0) {
            console.log('[AdGroupsPage] ❌ NOT READY: config invalid');
            return false;
        }

        if (selectedGroup && cache[`ad_groups:${selectedGroup}`] === undefined) {
            console.log('[AdGroupsPage] ❌ NOT READY: group data not loaded');
            return false;
        }

        console.log('[AdGroupsPage] ✅ DATA READY');
        return true;
    }, [isCacheLoading, cache, config, selectedGroup]);

    const currentGroupData = useMemo(() => {
        if (!adGroups || typeof adGroups !== 'object') return {};
        return adGroups[selectedGroup] || {};
    }, [adGroups, selectedGroup]);

    // ✅ Afficher le loading si le cache n'est pas encore chargé ou si config est vide
    if (isCacheLoading || !config || typeof config !== 'object' || Object.keys(config || {}).length === 0) {
        console.log('[AdGroupsPage] Rendering LoadingScreen (cache/config loading)');
        return <LoadingScreen type="list" />;
    }

    // ✅ Protection supplémentaire: vérifier que adGroups est bien défini
    if (!adGroups || typeof adGroups !== 'object') {
        console.log('[AdGroupsPage] Rendering LoadingScreen (adGroups invalid)');
        return <LoadingScreen type="list" />;
    }

    return (
        <Box sx={{ p: 2 }}>
            <PageHeader title="Groupes Active Directory" subtitle="Gestion des membres des groupes" icon={GroupIcon} stats={[{ label: 'Membres', value: members.length, icon: GroupIcon }]} actions={
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Button variant="contained" startIcon={<PersonAddIcon />} onClick={handleOpenAddDialog}>Ajouter</Button>
                    <Tooltip title="Actualiser"><IconButton onClick={handleRefresh} disabled={isRefreshing} color="primary">{isRefreshing ? <CircularProgress size={24} /> : <RefreshIcon />}</IconButton></Tooltip>
                </Box>
            }/>
            <Paper elevation={2} sx={{ p: 2.5, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', mb: 2 }}>
                    <FormControl sx={{ minWidth: 300 }}><InputLabel>Groupe</InputLabel><Select value={selectedGroup} label="Groupe" onChange={(e) => setSelectedGroup(e.target.value)}>{Object.entries(adGroups || {}).map(([key, group]) => (<MenuItem key={key} value={key}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><GroupIcon fontSize="small" />{group.name}<Chip label={group.type} size="small" variant="outlined" /></Box></MenuItem>))}</Select></FormControl>
                    <Box sx={{ flexGrow: 1 }}><SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Rechercher un membre..." fullWidth /></Box>
                    <Chip icon={<GroupIcon />} label={`${Array.isArray(filteredMembers) ? filteredMembers.length : 0} membre(s)`} color="primary" />
                </Box>
                {currentGroupData.description && (<Box sx={{ p: 1.5, backgroundColor: 'info.lighter', borderRadius: 1, display: 'flex', gap: 1 }}><InfoIcon color="info" fontSize="small" /><Typography variant="body2" color="info.dark">{currentGroupData.description}</Typography></Box>)}
            </Paper>
            {isRefreshing || !isDataReady ? (
                <LoadingScreen type="list" />
            ) : filteredMembers.length === 0 ? (
                <Paper elevation={2} sx={{ p: 4 }}>
                    <EmptyState type={searchTerm ? 'search' : 'empty'} onAction={searchTerm ? () => setSearchTerm('') : handleOpenAddDialog} />
                </Paper>
            ) : (
                <Paper elevation={2} sx={{ display: 'flex', flexDirection: 'column' }}>
                    <SimpleMemberList
                        members={filteredMembers}
                        onRemove={handleRemoveUser}
                        groupName={selectedGroup}
                    />
                </Paper>
            )}
            <Dialog open={addUserDialogOpen} onClose={() => setAddUserDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Ajouter à {selectedGroup}</DialogTitle>
                <DialogContent>
                    <TextField autoFocus margin="dense" label="Rechercher un utilisateur" fullWidth variant="outlined" value={userSearchTerm} onChange={(e) => { setUserSearchTerm(e.target.value); searchAdUsers(e.target.value); }} InputProps={{ startAdornment: (<InputAdornment position="start">{searchingUsers ? <CircularProgress size={20} /> : <SearchIcon />}</InputAdornment>), }} />
                    <Box sx={{ mt: 2, maxHeight: 400, overflow: 'auto' }}>
                        {availableUsers.length === 0 ? (<Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>{userSearchTerm.length < 2 ? 'Tapez au moins 2 caractères' : 'Aucun utilisateur trouvé'}</Typography>) : (<MuiList>{availableUsers.map((user, index) => { const alreadyMember = members.some(m => (m.SamAccountName || m.sam) === user.SamAccountName); return (<React.Fragment key={user.SamAccountName}><ListItem button onClick={() => !alreadyMember && handleAddUser(user.SamAccountName)} disabled={alreadyMember}><ListItemIcon>{alreadyMember ? (<CheckCircleIcon color="success" />) : (<PersonAddIcon color="primary" />)}</ListItemIcon><ListItemText primary={user.DisplayName} secondary={<Box><Typography variant="caption" display="block">{user.SamAccountName}</Typography>{user.EmailAddress && (<Typography variant="caption" color="text.secondary">{user.EmailAddress}</Typography>)}</Box>} />{alreadyMember && (<Chip label="Déjà membre" size="small" color="success" />)}</ListItem>{index < availableUsers.length - 1 && <Divider />}</React.Fragment>); })}</MuiList>)}
                    </Box>
                </DialogContent>
                <DialogActions><Button onClick={() => setAddUserDialogOpen(false)}>Fermer</Button></DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdGroupsPage;
