// src/pages/AdGroupsPage.js - VERSION FINALE AVEC IMPORTS CORRIGÉS

import React, { useState, useMemo, memo, useCallback, useEffect } from 'react';
import { List as FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Box, Paper, Typography, Button, IconButton, Tooltip, CircularProgress, InputAdornment, Chip, FormControl, InputLabel, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText, ListItemIcon, Divider, TextField } from '@mui/material';

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

const MemberRow = memo(({ member, style, isOdd, onRemove, groupName }) => {
    if (!member) return null;

    return (
        <Box style={style} sx={{ display: 'flex', alignItems: 'center', px: 2, backgroundColor: isOdd ? 'grey.50' : 'white', borderBottom: '1px solid', borderColor: 'divider', '&:hover': { backgroundColor: 'action.hover' } }}>
            <Box sx={{ flex: 1, pr: 2 }}><Typography variant="body2" fontWeight={500}>{member.DisplayName || member.name || 'N/A'}</Typography><Typography variant="caption" color="text.secondary">{member.SamAccountName || member.sam || 'N/A'}</Typography></Box>
            <Tooltip title="Retirer du groupe"><IconButton size="small" color="error" onClick={() => onRemove(member.SamAccountName || member.sam, groupName)}><PersonRemoveIcon fontSize="small" /></IconButton></Tooltip>
        </Box>
    );
});
MemberRow.displayName = 'MemberRow';

const AdGroupsPage = () => {
    const { showNotification } = useApp();
    const { cache, isLoading: isCacheLoading, invalidate } = useCache();
    const electronAD = useElectronAD();

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

    const members = useMemo(() => {
        const data = cache[`ad_groups:${selectedGroup}`];
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
            invalidate(`ad_groups:${selectedGroup}`);
        }
    }, [selectedGroup, cache, invalidate]);

    const filteredMembers = useMemo(() => {
        const safeMembers = Array.isArray(members) ? members : [];
        if (!searchTerm) return safeMembers;
        const term = searchTerm.toLowerCase();
        const filtered = safeMembers.filter(m => m && ((m.DisplayName || m.name || '').toLowerCase().includes(term) || (m.SamAccountName || m.sam || '').toLowerCase().includes(term)));
        // ✅ Ensure we always return an array
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

    // 🔥 ULTIMATE FIX: Create itemData with useMemo and validate before rendering
    const itemData = useMemo(() => {
        // ✅ CRITICAL: Validate all dependencies before creating itemData
        if (!Array.isArray(filteredMembers) || typeof handleRemoveUser !== 'function' || !selectedGroup) {
            return null;
        }

        return {
            members: filteredMembers,
            onRemove: handleRemoveUser,
            groupName: selectedGroup
        };
    }, [filteredMembers, handleRemoveUser, selectedGroup]);

    // 🎯 CRITICAL: Verify that ALL required cache keys exist before rendering
    const isDataReady = useMemo(() => {
        if (isCacheLoading || !cache || typeof cache !== 'object') return false;
        // Check that config is loaded
        if (!config || typeof config !== 'object' || Object.keys(config).length === 0) return false;
        // Check that the current group's data is loaded
        if (selectedGroup && cache[`ad_groups:${selectedGroup}`] === undefined) return false;

        // ✅ CRITICAL: Verify that itemData is fully constructed and valid
        if (!itemData || !itemData.members || !Array.isArray(itemData.members)) return false;
        if (typeof itemData.onRemove !== 'function') return false;
        if (!itemData.groupName) return false;

        return true;
    }, [isCacheLoading, cache, config, selectedGroup, itemData]);

    const currentGroupData = useMemo(() => {
        if (!adGroups || typeof adGroups !== 'object') return {};
        return adGroups[selectedGroup] || {};
    }, [adGroups, selectedGroup]);

    const Row = useCallback(({ index, style, data }) => {
        // ✅ Use data.members passed via itemData for safety
        if (!data || typeof data !== 'object') return null;

        const members = data.members || [];
        const member = members[index];
        if (!member) return null;

        return <MemberRow member={member} style={style} isOdd={index % 2 === 1} onRemove={data.onRemove} groupName={data.groupName} />;
    }, []);

    // ✅ Afficher le loading si le cache n'est pas encore chargé ou si config est vide
    if (isCacheLoading || !config || typeof config !== 'object' || Object.keys(config).length === 0) {
        return <LoadingScreen type="list" />;
    }

    // ✅ Protection supplémentaire: vérifier que adGroups est bien défini
    if (!adGroups || typeof adGroups !== 'object') {
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
                <Paper elevation={2} sx={{ display: 'flex', flexDirection: 'column', minHeight: 500 }}>
                    <Box sx={{ flex: 1, overflow: 'hidden' }}>
                        <AutoSizer>{({ height, width }) => {
                            // 🛡️ ULTIMATE PROTECTION: Verify itemData is valid before rendering List
                            if (!itemData || !Array.isArray(itemData.members)) {
                                return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height }}><CircularProgress /></Box>;
                            }

                            return (
                                <FixedSizeList
                                    height={height}
                                    itemCount={itemData.members.length}
                                    itemSize={60}
                                    width={width}
                                    itemKey={(index, data) => data?.members?.[index]?.SamAccountName || `member-${index}`}
                                    itemData={itemData}
                                >
                                    {Row}
                                </FixedSizeList>
                            );
                        }}</AutoSizer>
                    </Box>
                </Paper>
            )}
            <Dialog open={addUserDialogOpen} onClose={() => setAddUserDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Ajouter à {selectedGroup}</DialogTitle>
                <DialogContent>
                    <TextField autoFocus margin="dense" label="Rechercher un utilisateur" fullWidth variant="outlined" value={userSearchTerm} onChange={(e) => { setUserSearchTerm(e.target.value); searchAdUsers(e.target.value); }} InputProps={{ startAdornment: (<InputAdornment position="start">{searchingUsers ? <CircularProgress size={20} /> : <SearchIcon />}</InputAdornment>), }} />
                    <Box sx={{ mt: 2, maxHeight: 400, overflow: 'auto' }}>
                        {availableUsers.length === 0 ? (<Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>{userSearchTerm.length < 2 ? 'Tapez au moins 2 caractères' : 'Aucun utilisateur trouvé'}</Typography>) : (<List>{availableUsers.map((user, index) => { const alreadyMember = members.some(m => (m.SamAccountName || m.sam) === user.SamAccountName); return (<React.Fragment key={user.SamAccountName}><ListItem button onClick={() => !alreadyMember && handleAddUser(user.SamAccountName)} disabled={alreadyMember}><ListItemIcon>{alreadyMember ? (<CheckCircleIcon color="success" />) : (<PersonAddIcon color="primary" />)}</ListItemIcon><ListItemText primary={user.DisplayName} secondary={<Box><Typography variant="caption" display="block">{user.SamAccountName}</Typography>{user.EmailAddress && (<Typography variant="caption" color="text.secondary">{user.EmailAddress}</Typography>)}</Box>} />{alreadyMember && (<Chip label="Déjà membre" size="small" color="success" />)}</ListItem>{index < availableUsers.length - 1 && <Divider />}</React.Fragment>); })}</List>)}
                    </Box>
                </DialogContent>
                <DialogActions><Button onClick={() => setAddUserDialogOpen(false)}>Fermer</Button></DialogActions>
            </Dialog>
        </Box>
    );
};

export default memo(AdGroupsPage);